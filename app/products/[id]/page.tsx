"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { products } from "@/app/data/products";
import { useCart } from "@/app/CartContext";

function ProductDetailsContent() {
  const params = useParams<{ id: string }>();
  const { addToCart, openCart } = useCart();

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const productId = Number(params.id);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">
          Product Not Found
        </h1>

        <p className="mt-3 text-neutral-600">
          Sorry, we couldn&apos;t find this product in our collection.
        </p>

        <Link
          href="/"
          className="mt-6 rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-neutral-800 transition"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const currentProduct = product;

  function handleAddToCart() {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    setSizeError(false);

    addToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      category: currentProduct.category,
      price: currentProduct.price,
      image: currentProduct.image,
      size: selectedSize,
      quantity,
    });

    setAddedMessage(true);
    openCart();

    setTimeout(() => {
      setAddedMessage(false);
    }, 4000);
  }

  return (
    <div className="bg-neutral-50 px-4 py-8 sm:px-8 lg:px-16">
      {/* Back to Home Link */}
      <Link
        href="/#collection"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-orange-600 transition"
      >
        ← Back to Shop
      </Link>

      {/* Product Details Card */}
      <div className="mx-auto grid max-w-6xl gap-10 rounded-2xl bg-white p-5 shadow-sm sm:p-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="overflow-hidden rounded-xl bg-neutral-100">
          <Image
            src={currentProduct.image}
            alt={currentProduct.name}
            width={800}
            height={900}
            priority
            className="h-full max-h-[600px] min-h-[350px] w-full object-cover"
          />
        </div>

        {/* Product Information */}
        <div className="flex flex-col justify-center py-3">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            {currentProduct.category}
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-neutral-900 sm:text-4xl">
            {currentProduct.name}
          </h1>

          <p className="mt-4 text-2xl font-bold text-neutral-900">
            ₹{currentProduct.price.toLocaleString("en-IN")}
          </p>

          <p className="mt-5 leading-7 text-neutral-600">
            {currentProduct.description}
          </p>

          {/* Size Selection */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-neutral-900">Select Size</h2>

              <span className={`text-xs ${sizeError ? "font-bold text-red-500" : "text-neutral-500"}`}>
                {sizeError ? "Please choose a size" : "Required"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {["S", "M", "L", "XL"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  className={`h-12 w-14 rounded-lg border font-semibold transition cursor-pointer ${
                    selectedSize === size
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-800 hover:border-orange-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mt-7">
            <h2 className="mb-3 font-bold text-neutral-900">
              Quantity
            </h2>

            <div className="flex w-fit items-center overflow-hidden rounded-lg border border-neutral-300">
              <button
                type="button"
                onClick={() =>
                  setQuantity((previous) => Math.max(1, previous - 1))
                }
                disabled={quantity <= 1}
                className="h-11 w-12 text-xl hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span className="flex h-11 w-12 items-center justify-center font-semibold">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((previous) => Math.min(10, previous + 1))
                }
                disabled={quantity >= 10}
                className="h-11 w-12 text-xl hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              Maximum 10 items per selection.
            </p>
          </div>

          {/* Total Price */}
          <div className="mt-7 flex items-center justify-between border-t border-neutral-200 pt-5">
            <span className="font-medium text-neutral-600">
              Total Price
            </span>

            <span className="text-xl font-extrabold text-neutral-900">
              ₹{(currentProduct.price * quantity).toLocaleString("en-IN")}
            </span>
          </div>

          {/* Add to Bag Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-6 w-full rounded-xl bg-orange-600 px-6 py-4 font-bold text-white transition hover:bg-orange-700 cursor-pointer"
          >
            {addedMessage ? "✓ ADDED TO BAG!" : `ADD TO BAG — ₹${(currentProduct.price * quantity).toLocaleString("en-IN")}`}
          </button>

          {/* Confirmation Message with View Bag trigger */}
          {addedMessage && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <span className="font-medium">✓ Added to your shopping bag!</span>
              <button
                type="button"
                onClick={openCart}
                className="font-bold underline hover:text-green-950 cursor-pointer"
              >
                View Bag
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-neutral-500">
            Secure checkout · Easy shopping · STYLEHUB
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50">
          <p className="text-sm font-semibold text-neutral-500">
            Loading product details...
          </p>
        </div>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}