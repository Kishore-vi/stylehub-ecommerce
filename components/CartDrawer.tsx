"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/CartContext";

export default function CartDrawer() {
  const {
    cart,
    cartCount,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  // Close drawer on Escape key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    if (isCartOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) {
    return null;
  }

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
      onClick={closeCart}
      aria-modal="true"
      role="dialog"
      aria-label="Shopping Bag Drawer"
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h2 className="text-xl font-bold tracking-tight">
            Shopping Bag ({cartCount})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-neutral-100 cursor-pointer transition"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-base text-neutral-500">Your bag is empty.</p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-4 text-sm font-semibold text-orange-600 underline cursor-pointer hover:text-orange-700"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="truncate font-semibold text-sm text-neutral-900">
                      {item.name}
                    </h4>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Size: {item.size} · ₹{item.price.toLocaleString("en-IN")}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.size,
                            item.quantity - 1
                          )
                        }
                        className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 text-xs font-bold hover:bg-neutral-100 cursor-pointer transition disabled:opacity-30"
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-4 text-center text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.size,
                            item.quantity + 1
                          )
                        }
                        className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 text-xs font-bold hover:bg-neutral-100 cursor-pointer transition disabled:opacity-30"
                        disabled={item.quantity >= 10}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id, item.size)}
                    className="text-xs font-medium text-neutral-400 hover:text-red-600 cursor-pointer transition"
                    aria-label={`Remove ${item.name} from bag`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <div className="mb-4 flex items-center justify-between text-base font-bold text-neutral-900">
              <span>Subtotal</span>
              <span className="text-xl">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-xl bg-orange-600 py-3.5 font-bold text-white shadow-sm hover:bg-orange-700 cursor-pointer transition"
            >
              PROCEED TO CHECKOUT →
            </Link>

            <p className="mt-3 text-center text-xs text-neutral-500">
              Free shipping on orders above ₹1,999 · Taxes calculated at checkout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
