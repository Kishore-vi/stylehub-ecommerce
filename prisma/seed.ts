
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    id: 1,
    name: "Classic White Shirt",
    category: "Men",
    price: 1299,
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=700&auto=format&fit=crop&q=80",
    label: "BESTSELLER",
    description:
      "A tailored classic white shirt made from breathable cotton. Perfect for both office elegance and casual smart occasions.",
  },
  {
    id: 2,
    name: "Everyday Essential Tee",
    category: "Men",
    price: 699,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80",
    label: "NEW",
    description:
      "Crafted from 100% combed organic cotton for maximum comfort and an effortless modern drape.",
  },
  {
    id: 3,
    name: "Elegant Summer Dress",
    category: "Women",
    price: 1899,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&auto=format&fit=crop&q=80",
    label: "TRENDING",
    description:
      "Lightweight, breathable, and gracefully silhouetted for sunny days, brunch dates, and evening walks.",
  },
  {
    id: 4,
    name: "Premium Denim Jacket",
    category: "Men",
    price: 2499,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80",
    label: "POPULAR",
    description:
      "Rugged yet refined, this classic denim jacket features antique brass hardware and durable reinforced stitching.",
  },
  {
    id: 5,
    name: "Minimal Everyday Outfit",
    category: "Women",
    price: 1599,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&auto=format&fit=crop&q=80",
    label: "NEW",
    description:
      "Effortless monochrome styling offering comfort and confidence for whatever the day brings.",
  },
  {
    id: 6,
    name: "Relaxed Fit Trousers",
    category: "Men",
    price: 1499,
    image:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&auto=format&fit=crop&q=80",
    label: "ESSENTIAL",
    description:
      "Designed with a contemporary relaxed cut and comfortable waistband for all-day versatile wear.",
  },
];

async function main() {
  for (const categoryName of ["Men", "Women"]) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
  }

  for (const item of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { name: item.category },
    });

    await prisma.product.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        categoryId: category.id,
        price: item.price * 100,
        image: item.image,
        label: item.label,
        description: item.description,
        isActive: true,
      },
      create: {
        id: item.id,
        name: item.name,
        categoryId: category.id,
        price: item.price * 100,
        image: item.image,
        label: item.label,
        description: item.description,
        sizes: {
          create: ["S", "M", "L", "XL"].map((size) => ({
            size,
            stock: 10,
          })),
        },
      },
    });

    // Add any missing sizes without resetting existing stock.
    for (const size of ["S", "M", "L", "XL"]) {
      await prisma.productSize.upsert({
        where: {
          productId_size: { productId: item.id, size },
        },
        update: {},
        create: {
          productId: item.id,
          size,
          stock: 10,
        },
      });
    }
  }

  console.log("Seed completed: 2 categories and 6 products processed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
