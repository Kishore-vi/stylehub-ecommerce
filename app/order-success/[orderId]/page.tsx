"use client";

import { Suspense, useEffect, useRef, useSyncExternalStore, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/CartContext";
import { DemoOrder } from "@/app/types/order";

let cachedOrder: DemoOrder | null = null;
let lastOrderId: string | null = null;

function getOrderSnapshot(orderId: string): DemoOrder | null {
  if (typeof window === "undefined") return null;
  if (lastOrderId === orderId && cachedOrder !== null) {
    return cachedOrder;
  }

  try {
    const stored =
      sessionStorage.getItem(`stylehub-order-${orderId}`) ||
      sessionStorage.getItem("stylehub-latest-order");

    if (stored) {
      cachedOrder = JSON.parse(stored);
      lastOrderId = orderId;
      return cachedOrder;
    }
  } catch {
    // Graceful fallback if storage is restricted
  }

  return null;
}

function subscribeOrder() {
  return () => {};
}

function OrderSuccessContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ orderId: string }>;
}) {
  const params = use(paramsPromise);
  const { clearCart } = useCart();

  const order = useSyncExternalStore(
    subscribeOrder,
    () => getOrderSnapshot(params.orderId),
    () => null
  );

  const hasClearedRef = useRef(false);

  // Clear the shopping bag once the customer lands on the confirmed order page
  useEffect(() => {
    if (!hasClearedRef.current) {
      hasClearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

  return (
    <div className="bg-neutral-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Success Header Card */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xs sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-orange-600">
            Order Confirmed (Demo)
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-neutral-900 sm:text-4xl">
            Thank You For Your Order!
          </h1>

          <p className="mt-2 text-sm text-neutral-600">
            Order Reference:{" "}
            <span className="font-mono font-bold text-neutral-900">
              #{params.orderId}
            </span>
          </p>

          {/* Prototype Notice Box */}
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-900 sm:text-sm">
            <p className="font-bold">⚠️ Demonstration Notice:</p>
            <p className="mt-1 leading-relaxed text-amber-800">
              This order was placed in frontend demonstration mode. No real money was collected, no card details were processed, and no parcel will be dispatched. In later backend phases, this will trigger real PostgreSQL order recording, inventory deduction, and automated email confirmation.
            </p>
          </div>

          {/* Estimated Delivery Timeline */}
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl bg-neutral-100 p-4 text-sm sm:flex-row sm:px-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div className="text-left">
                <p className="font-bold text-neutral-900">Estimated Delivery</p>
                <p className="text-xs text-neutral-500">Standard courier dispatch</p>
              </div>
            </div>
            <span className="rounded-full bg-white px-4 py-1.5 font-bold text-neutral-800 shadow-2xs">
              3–5 Business Days
            </span>
          </div>

          {/* Order Details (if retrieved from demo session) */}
          {order && (
            <div className="mt-8 text-left border-t border-neutral-200 pt-6">
              <h2 className="text-base font-bold text-neutral-900">
                Delivery Details
              </h2>
              <div className="mt-2 text-xs leading-5 text-neutral-600 sm:text-sm">
                <p className="font-semibold text-neutral-900">{order.customer.fullName}</p>
                <p>{order.customer.street}</p>
                <p>
                  {order.customer.city}, {order.customer.state} - {order.customer.pinCode}
                </p>
                <p className="mt-1">
                  Contact: {order.customer.phone} · {order.customer.email}
                </p>
                <p className="mt-1 font-medium text-neutral-800">
                  Payment Method:{" "}
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery (COD)"
                    : "Simulated Online Payment"}
                </p>
              </div>

              {/* Items Summary */}
              <h2 className="mt-6 text-base font-bold text-neutral-900">
                Purchased Garments ({order.items.length})
              </h2>
              <div className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3">
                {order.items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-xs font-semibold text-neutral-900 sm:text-sm">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Size: {item.size} · Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-neutral-900 sm:text-sm">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping Fee</span>
                  <span>
                    {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm font-extrabold text-neutral-900 sm:text-base">
                  <span>Total Amount</span>
                  <span>₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/#collection"
              className="rounded-xl bg-orange-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 transition"
            >
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50">
          <p className="text-sm font-semibold text-neutral-500">
            Loading confirmation receipt...
          </p>
        </div>
      }
    >
      <OrderSuccessContent paramsPromise={params} />
    </Suspense>
  );
}
