
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";

// ---------------------------------------------------------------------------
// Constants — must stay in sync with checkout/page.tsx (read-only mirror)
// ---------------------------------------------------------------------------
const FREE_SHIPPING_THRESHOLD_PAISE = 1999 * 100; // ₹1,999 expressed in paise
const STANDARD_SHIPPING_FEE_PAISE = 149 * 100;    // ₹149 expressed in paise

// Exhaustive map: every paymentMethod value must have an explicit initial
// paymentStatus. Neither COD nor online_simulation involves real payment
// verification, so both start as "pending". TypeScript will flag a missing
// key if a new paymentMethod is ever added to the Zod enum without updating
// this map.
const PAYMENT_STATUS_BY_METHOD: Record<"cod" | "online_simulation", string> = {
  cod: "pending",
  online_simulation: "pending",
};

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------
const cartItemSchema = z.object({
  productId: z.int().positive("productId must be a positive integer"),
  size: z.string().min(1, "size must not be empty").max(10, "size too long"),
  quantity: z
    .int()
    .positive("quantity must be a positive integer")
    .max(99, "quantity must not exceed 99 per line item"),
});

const orderRequestSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2).max(120).trim(),
    email: z
      .string()
      .email("Invalid email address")
      .max(254)
      .trim()
      .toLowerCase(),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
    street: z.string().min(5).max(300).trim(),
    city: z.string().min(2).max(100).trim(),
    state: z.string().min(2).max(60).trim(),
    pinCode: z
      .string()
      .regex(/^\d{6}$/, "PIN code must be exactly 6 digits"),
  }),
  paymentMethod: z.enum(["cod", "online_simulation"], {
    error: "paymentMethod must be 'cod' or 'online_simulation'",
  }),
  items: z
    .array(cartItemSchema)
    .min(1, "Order must contain at least one item")
    .max(50, "Order may not exceed 50 line items"),
});

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { customer, paymentMethod, items } = parsed.data;

  // 2. Merge duplicate (productId, size) pairs — sum their quantities
  const mergedMap = new Map<string, { productId: number; size: string; quantity: number }>();
  for (const item of items) {
    const key = `${item.productId}:${item.size}`;
    const existing = mergedMap.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      mergedMap.set(key, { ...item });
    }
  }
  const mergedItems = Array.from(mergedMap.values());

  // Guard: after merging, a combined line quantity must not exceed 99.
  // (A client could send two entries for the same product+size, each with
  // quantity 99, bypassing the per-item Zod cap. Reject here before any DB IO.)
  const MAX_QUANTITY_PER_LINE = 99;
  for (const item of mergedItems) {
    if (item.quantity > MAX_QUANTITY_PER_LINE) {
      return NextResponse.json(
        {
          error: `Total quantity for product ID ${item.productId} in size '${item.size}' exceeds the maximum of ${MAX_QUANTITY_PER_LINE} per line.`,
        },
        { status: 400 }
      );
    }
  }

  // 3. Fetch authoritative product and size data from the database
  const productIds = [...new Set(mergedItems.map((i) => i.productId))];

  const dbProducts = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,       // stored as paise (integer)
      image: true,
      sizes: {
        select: {
          size: true,
          stock: true,
        },
      },
    },
  });

  // Index products by id for O(1) lookup
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // 4. Validate each line item against DB data
  type ValidatedLine = {
    productId: number;
    productName: string;
    productImage: string;
    size: string;
    unitPricePaise: number;   // paise
    quantity: number;
    lineTotalPaise: number;   // paise
  };

  const validatedLines: ValidatedLine[] = [];

  for (const item of mergedItems) {
    const product = productMap.get(item.productId);

    if (!product) {
      return NextResponse.json(
        { error: `Product ID ${item.productId} was not found or is unavailable.` },
        { status: 400 }
      );
    }

    const sizeRecord = product.sizes.find((s) => s.size === item.size);
    if (!sizeRecord) {
      return NextResponse.json(
        {
          error: `Size '${item.size}' is not available for product '${product.name}'.`,
        },
        { status: 400 }
      );
    }

    if (sizeRecord.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock for '${product.name}' in size '${item.size}'. Available: ${sizeRecord.stock}, requested: ${item.quantity}.`,
        },
        { status: 409 }
      );
    }

    validatedLines.push({
      productId: item.productId,
      productName: product.name,
      productImage: product.image,
      size: item.size,
      unitPricePaise: product.price,
      quantity: item.quantity,
      lineTotalPaise: product.price * item.quantity,
    });
  }

  // 5. Recalculate financials on the server (never trust client values)
  const subtotalPaise = validatedLines.reduce(
    (sum, line) => sum + line.lineTotalPaise,
    0
  );
  const shippingFeePaise =
    subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE
      ? 0
      : STANDARD_SHIPPING_FEE_PAISE;
  const totalPaise = subtotalPaise + shippingFeePaise;

  // 6. Generate a collision-resistant order ID
  const orderId = `SH-${randomUUID()}`;

  // 7. Persist order + order items + stock decrements in a single transaction
  try {
    const order = await prisma.$transaction(async (tx) => {
      // 7a. Re-verify within the transaction that all requested products are
      // still active. The pre-transaction findMany snapshot can go stale if a
      // product is deactivated between that read and now.
      const activeCount = await tx.product.count({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });
      if (activeCount !== productIds.length) {
        throw new ProductUnavailableError(
          "One or more products in your order are no longer available. Please review your cart."
        );
      }

      // 7b. Create the Order record
      const newOrder = await tx.order.create({
        data: {
          orderId,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          street: customer.street,
          city: customer.city,
          state: customer.state,
          pinCode: customer.pinCode,
          subtotal: subtotalPaise,
          shippingFee: shippingFeePaise,
          total: totalPaise,
          // Neither COD nor online_simulation involves verified payment.
          // Both start as "pending". A real payment gateway webhook is the only
          // event that should ever advance paymentStatus to "paid".
          paymentMethod,
          paymentStatus: PAYMENT_STATUS_BY_METHOD[paymentMethod],
          orderStatus: "placed",
        },
      });

      // 7c. Create OrderItem records
      await tx.orderItem.createMany({
        data: validatedLines.map((line) => ({
          orderId: newOrder.id,
          productId: line.productId,
          productName: line.productName,
          productImage: line.productImage,
          size: line.size,
          unitPrice: line.unitPricePaise,
          quantity: line.quantity,
          lineTotal: line.lineTotalPaise,
        })),
      });

      // 7d. Conditionally decrement stock for each (productId, size) pair.
      // The WHERE clause stock >= quantity ensures the update is a no-op if
      // stock has dropped since we read it (race-condition guard).
      for (const line of validatedLines) {
        const result = await tx.productSize.updateMany({
          where: {
            productId: line.productId,
            size: line.size,
            stock: { gte: line.quantity },
          },
          data: {
            stock: { decrement: line.quantity },
          },
        });

        // count === 0 means stock was insufficient at commit time → roll back
        if (result.count === 0) {
          throw new StockConflictError(
            `Stock for '${line.productName}' (size '${line.size}') was exhausted by a concurrent order.`
          );
        }
      }

      return newOrder;
    });

    // 8. Return confirmation — only non-sensitive fields
    return NextResponse.json(
      {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: subtotalPaise / 100,
        shippingFee: shippingFeePaise / 100,
        total: totalPaise / 100,
        itemCount: validatedLines.length,
        estimatedDelivery: "3–5 business days",
        // Clearly label that no real money movement occurred
        demoNotice:
          paymentMethod === "online_simulation"
            ? "This was a simulated payment. No real money was collected."
            : null,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ProductUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err instanceof StockConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    // Catch Prisma unique-constraint violation on orderId (extremely unlikely
    // with UUID but handled defensively)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A duplicate order ID was generated. Please retry." },
        { status: 409 }
      );
    }

    console.error("[POST /api/orders] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while placing your order. Please try again." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Internal sentinel errors — thrown inside the transaction to trigger rollback
// ---------------------------------------------------------------------------
class StockConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockConflictError";
  }
}

class ProductUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductUnavailableError";
  }
}
