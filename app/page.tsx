
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCart } from "./CartContext";

const categories = ["All", "Men", "Women"];

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  label?: string | null;
  description: string;
};

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overrideCategory, setOverrideCategory] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState<number[]>([]);

  const { addToCart, openCart } = useCart();

  // Fetch products from the database through our API
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load products. Please try again.");
        }

        const data: Product[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid product data received.");
        }

        setProducts(data);
      } catch (err) {
        console.error("Product loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const activeCategory =
    overrideCategory ??
    (categoryParam && categories.includes(categoryParam)
      ? categoryParam
      : "All");

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  function toggleWishlist(id: number) {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function handleQuickAdd(product: Product) {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      size: "M",
      quantity: 1,
    });

    openCart();
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#eeeae3]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div className="relative z-10">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-orange-700">
              The new everyday
            </p>

            <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
              Wear your
              <br />
              <span className="font-serif font-normal italic">
                own story.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-neutral-600">
              Thoughtfully chosen styles, everyday essentials and timeless
              pieces made to feel like you.
            </p>

            <a
              href="#collection"
              className="mt-8 inline-flex items-center gap-3 bg-neutral-950 px-7 py-4 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              EXPLORE COLLECTION <span>→</span>
            </a>

            <div className="mt-10 flex gap-8 border-t border-neutral-300 pt-6">
              <div>
                <p className="text-xl font-bold">New</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Seasonal drops
                </p>
              </div>
              <div>
                <p className="text-xl font-bold">Easy</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Everyday comfort
                </p>
              </div>
              <div>
                <p className="text-xl font-bold">You</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Your own style
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=85"
              alt="Fashion collection inspiration"
              width={1200}
              height={800}
              priority
              className="h-[360px] w-full object-cover sm:h-[500px] lg:h-[570px]"
            />

            <div className="absolute bottom-5 left-5 bg-white px-5 py-4 shadow-lg">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                Style note 01
              </p>
              <p className="mt-1 font-bold">Less, but better.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Collection Section */}
      <section
        id="collection"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-10 sm:py-16"
      >
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-700">
              Curated for you
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Shop the collection
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Everyday favourites. Elevated essentials.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setOverrideCategory(item)}
                className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  activeCategory === item
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 hover:border-neutral-950"
                }`}
              >
                {item === "All" ? "All Products" : item}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-7">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shirts, dresses, jackets..."
            aria-label="Search products"
            className="w-full rounded-none border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-950 sm:max-w-md"
          />
        </div>

        {/* Loading, Error and Products */}
        {loading ? (
          <div
            className="py-16 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-neutral-500">
              Loading products...
            </p>
          </div>
        ) : error ? (
          <div className="border border-dashed border-neutral-300 py-16 text-center">
            <p className="text-lg font-semibold">
              Unable to load products
            </p>
            <p className="mt-2 text-sm text-neutral-500">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 cursor-pointer text-sm font-bold underline hover:text-orange-600"
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="border border-dashed border-neutral-300 py-16 text-center">
            <p className="text-lg font-semibold">No products found</p>
            <p className="mt-2 text-sm text-neutral-500">
              Try another search or category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setOverrideCategory("All");
              }}
              className="mt-4 cursor-pointer text-sm font-bold underline hover:text-orange-600"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article key={product.id} className="group">
                <div className="relative overflow-hidden bg-neutral-100">
                  <Link
                    href={`/products/${product.id}`}
                    className="block"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={600}
                      height={700}
                      className="h-56 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-80"
                    />
                  </Link>

                  {product.label && (
                    <span className="absolute left-3 top-3 bg-white px-2.5 py-1.5 text-[9px] font-bold tracking-widest sm:text-[10px]">
                      {product.label}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={
                      wishlist.includes(product.id)
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-lg shadow-xs transition hover:bg-neutral-950 hover:text-white"
                  >
                    {wishlist.includes(product.id) ? "♥" : "♡"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(product)}
                    className="absolute bottom-0 left-0 w-full cursor-pointer bg-neutral-950/95 py-3 text-xs font-bold tracking-wider text-white transition hover:bg-orange-700 sm:translate-y-full sm:group-hover:translate-y-0"
                  >
                    + ADD TO BAG
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2 pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                      {product.category}
                    </p>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="mt-1 text-sm font-semibold transition hover:text-orange-600 sm:text-base">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <p className="shrink-0 text-sm font-bold">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Brand Philosophy Section */}
      <section
        id="about"
        className="bg-[#eeeae3] px-5 py-16 text-center sm:py-20"
      >
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-700">
          Our philosophy
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
          Good clothes. Good days. Your kind of style.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-600">
          STYLEHUB is about finding pieces you love, wearing them your way,
          and feeling comfortable being yourself.
        </p>
        <a
          href="#collection"
          className="mt-7 inline-block border border-neutral-950 px-7 py-3 text-xs font-bold tracking-widest transition hover:bg-neutral-950 hover:text-white"
        >
          FIND YOUR STYLE
        </a>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm font-semibold text-neutral-400">
            Loading catalog...
          </p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
