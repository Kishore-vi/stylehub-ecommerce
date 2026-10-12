"use client";

import Link from "next/link";
import { useCart } from "@/app/CartContext";

export default function Navbar() {
  const { cartCount, openCart } = useCart();

  return (
    <>
      {/* Top Promotional Announcement Banner */}
      <div className="bg-neutral-950 px-4 py-2 text-center text-xs tracking-widest text-white">
        FREE SHIPPING ON ORDERS ABOVE ₹1,999
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter sm:text-3xl"
          >
            STYLEHUB<span className="text-orange-600">.</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <Link href="/#collection" className="hover:text-orange-600 transition">
              Shop All
            </Link>
            <Link
              href="/?category=Men#collection"
              className="hover:text-orange-600 transition"
            >
              Men
            </Link>
            <Link
              href="/?category=Women#collection"
              className="hover:text-orange-600 transition"
            >
              Women
            </Link>
            <Link href="/#about" className="hover:text-orange-600 transition">
              Our Story
            </Link>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/#collection"
              aria-label="Search products"
              className="text-lg hover:text-orange-600 transition"
            >
              ⌕
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="rounded-full border border-neutral-300 px-3 py-2 font-semibold hover:bg-neutral-100 cursor-pointer transition"
              aria-label={`Shopping bag with ${cartCount} items`}
            >
              Bag ({cartCount})
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
