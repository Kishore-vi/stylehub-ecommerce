export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  label?: string;
  description: string;
};

export const products: Product[] = [
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
