
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/CartContext";

type ProductSize = {
  size: string;
  stock: number;
};

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  label?: string | null;
  description: string;
  sizes: ProductSize[];
};

const AVAILABLE_SIZES = ["S", "M", "L", "XL"];
const MAX_QUANTITY = 10;

function ProductDetailsContent() {
  const params = useParams<{ id: string }>();
  const { addToCart, openCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const productId = Number(params.id);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!Number.isInteger(productId) || productId <= 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(false);

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const products: Product[] = await response.json();

        const foundProduct = products.find(
          (item) => item.id === productId
        );

        if (!cancelled) {
          setProduct(foundProduct ?? null);
          setSelectedSize("");
          setQuantity(1);
          setAddedMessage(false);
        }
      } catch (error) {
        console.error("Product details loading error:", error);

        if (!cancelled) {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedSizeStock =
    product?.sizes.find(
      (item) => item.size === selectedSize
    )?.stock ?? 0;

  const quantityLimit = Math.min(
    MAX_QUANTITY,
    selectedSizeStock
  );

  function handleAddToCart() {
    if (!product || !selectedSize) {
      setSizeError(true);
      return;
    }

    // Check stock before adding the item.
    if (
      selectedSizeStock <= 0 ||
      quantity > quantityLimit
    ) {
      setSizeError(true);
      return;
    }

    setSizeError(false);

    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      size: selectedSize,
      quantity,
    });

    setAddedMessage(true);
    openCart();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50">
        <p className="text-sm font-semibold text-neutral-500">
          Loading product details...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          Unable to load product
        </h1>
        <p className="mt-3 text-neutral-600">
          Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-neutral-800"
        >
          Try Again
        </button>
      </div>
    );
  }

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
          className="mt-6 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const hasAnyStock = product.sizes.some(
    (item) => item.stock > 0
  );

  return (
    <div className="bg-neutral-50 px-4 py-8 sm:px-8 lg:px-16">
      <Link
        href="/#collection"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-orange-600"
      >
        ← Back to Shop
      </Link>

      <div className="mx-auto grid max-w-6xl gap-10 rounded-2xl bg-white p-5 shadow-sm sm:p-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="overflow-hidden rounded-xl bg-neutral-100">
          <Image
            src={product.image}
            alt={product.name}
            width={800}
            height={900}
            priority
            className="h-full max-h-[600px] min-h-[350px] w-full object-cover"
          />
        </div>

        {/* Product Information */}
        <div className="flex flex-col justify-center py-3">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            {product.category}
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-neutral-900 sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 text-2xl font-bold text-neutral-900">
            ₹{product.price.toLocaleString("en-IN")}
          </p>

          <p className="mt-5 leading-7 text-neutral-600">
            {product.description}
          </p>

          {/* Size Selection and Stock */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-neutral-900">
                Select Size
              </h2>

              <span
                className={`text-xs ${
                  sizeError
                    ? "font-bold text-red-500"
                    : "text-neutral-500"
                }`}
              >
                {sizeError
                  ? !selectedSize
                    ? "Please choose a size"
                    : "Check size availability"
                  : "Required"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {AVAILABLE_SIZES.map((size) => {
                const stock =
                  product.sizes.find(
                    (item) => item.size === size
                  )?.stock ?? 0;

                const outOfStock = stock <= 0;
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => {
                      setSelectedSize(size);
                      setQuantity(1);
                      setSizeError(false);
                      setAddedMessage(false);
                    }}
                    title={
                      outOfStock
                        ? `${size} is out of stock`
                        : `${stock} available`
                    }
                    className={`flex min-h-12 min-w-14 flex-col items-center justify-center rounded-lg border px-3 py-2 transition ${
                      outOfStock
                        ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                        : isSelected
                          ? "cursor-pointer border-orange-600 bg-orange-600 text-white"
                          : "cursor-pointer border-neutral-300 bg-white text-neutral-800 hover:border-orange-600"
                    }`}
                  >
                    <span className="font-semibold">{size}</span>
                    <span className="text-[10px]">
                      {outOfStock ? "Sold out" : `${stock} left`}
                    </span>
                  </button>
                );
              })}
            </div>

            {!hasAnyStock && (
              <p className="mt-3 text-sm font-semibold text-red-600">
                This product is currently out of stock.
              </p>
            )}

            {selectedSize && selectedSizeStock > 0 && (
              <p className="mt-3 text-sm text-neutral-600">
                {selectedSizeStock} item(s) available in size{" "}
                {selectedSize}.
              </p>
            )}

            {selectedSize && selectedSizeStock <= 0 && (
              <p className="mt-3 text-sm text-red-600">
                This size is out of stock. Please choose another size.
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-7">
            <h2 className="mb-3 font-bold text-neutral-900">
              Quantity
            </h2>

            <div className="flex w-fit items-center overflow-hidden rounded-lg border border-neutral-300">
              <button
                type="button"
                onClick={() => {
                  setQuantity((previous) =>
                    Math.max(1, previous - 1)
                  );
                  setAddedMessage(false);
                }}
                disabled={quantity <= 1 || quantityLimit <= 0}
                className="h-11 w-12 cursor-pointer text-xl hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span className="flex h-11 w-12 items-center justify-center font-semibold">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => {
                  setQuantity((previous) =>
                    Math.min(quantityLimit, previous + 1)
                  );
                  setAddedMessage(false);
                }}
                disabled={
                  quantityLimit <= 0 ||
                  quantity >= quantityLimit
                }
                className="h-11 w-12 cursor-pointer text-xl hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              {selectedSize
                ? quantityLimit > 0
                  ? `Maximum ${quantityLimit} item(s) for this size.`
                  : "Select an available size to choose quantity."
                : "Select a size to check available quantity."}
            </p>
          </div>

          {/* Total Price */}
          <div className="mt-7 flex items-center justify-between border-t border-neutral-200 pt-5">
            <span className="font-medium text-neutral-600">
              Total Price
            </span>

            <span className="text-xl font-extrabold text-neutral-900">
              ₹{(product.price * quantity).toLocaleString("en-IN")}
            </span>
          </div>

          {/* Add to Bag */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!hasAnyStock}
            className="mt-6 w-full cursor-pointer rounded-xl bg-orange-600 px-6 py-4 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {!hasAnyStock
              ? "OUT OF STOCK"
              : addedMessage
                ? "✓ ADDED TO BAG!"
                : `ADD TO BAG — ₹${(
                    product.price * quantity
                  ).toLocaleString("en-IN")}`}
          </button>

          {addedMessage && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <span className="font-medium">
                ✓ Added to your shopping bag!
              </span>

              <button
                type="button"
                onClick={openCart}
                className="cursor-pointer font-bold underline hover:text-green-950"
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
