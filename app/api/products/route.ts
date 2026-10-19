
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
        sizes: {
          orderBy: {
            size: "asc",
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category.name,
      price: product.price / 100,
      image: product.image,
      label: product.label,
      description: product.description,
      sizes: product.sizes.map((item) => ({
        size: item.size,
        stock: item.stock,
      })),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return NextResponse.json(
      { error: "Unable to load products" },
      { status: 500 }
    );
  }
}
