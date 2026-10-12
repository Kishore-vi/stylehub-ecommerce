"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart, CartItem } from "@/app/CartContext";
import { CustomerDetails, DemoOrder } from "@/app/types/order";

const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 149;

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

function createDemoOrder(
  formData: CustomerDetails,
  cart: CartItem[],
  subtotal: number,
  shippingFee: number,
  total: number,
  paymentMethod: "cod" | "online_simulation"
): DemoOrder {
  const timestamp = Date.now().toString().slice(-4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    orderId: `SH-${timestamp}-${randomSuffix}`,
    customer: formData,
    items: [...cart],
    subtotal,
    shippingFee,
    total,
    paymentMethod,
    createdAt: new Date().toISOString(),
    estimatedDelivery: "3–5 business days",
  };
}

function CheckoutContent() {
  const router = useRouter();
  const { cart, cartCount } = useCart();

  const [formData, setFormData] = useState<CustomerDetails>({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "Delhi",
    pinCode: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online_simulation">("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const shippingFee =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0
      ? 0
      : STANDARD_SHIPPING_FEE;

  const total = subtotal + shippingFee;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof CustomerDetails, string>> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    const phoneClean = formData.phone.replace(/\D/g, "");
    if (!phoneClean || phoneClean.length !== 10) {
      newErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (!formData.street.trim() || formData.street.trim().length < 5) {
      newErrors.street = "Please enter your complete street address (house/flat no., street).";
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      newErrors.city = "Please enter your city.";
    }

    if (!formData.state) {
      newErrors.state = "Please select your state.";
    }

    const pinClean = formData.pinCode.replace(/\D/g, "");
    if (!pinClean || pinClean.length !== 6) {
      newErrors.pinCode = "Please enter a valid 6-digit PIN code.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleInputChange(
    field: keyof CustomerDetails,
    value: string
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (cart.length === 0) {
      alert("Your shopping bag is empty. Please add items before checking out.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const demoOrder = createDemoOrder(
      formData,
      cart,
      subtotal,
      shippingFee,
      total,
      paymentMethod
    );
    const orderId = demoOrder.orderId;

    // Store the order temporarily in sessionStorage for the demonstration success view
    try {
      sessionStorage.setItem(`stylehub-order-${orderId}`, JSON.stringify(demoOrder));
      sessionStorage.setItem("stylehub-latest-order", JSON.stringify(demoOrder));
    } catch {
      // Ignore storage quota issues in demo
    }

    // Direct customer to the order confirmation page
    router.push(`/order-success/${orderId}`);
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Your Bag is Empty
          </h1>
          <p className="mt-3 text-neutral-600">
            There are no items in your shopping bag to checkout.
          </p>
          <Link
            href="/#collection"
            className="mt-6 inline-block rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-orange-700 transition"
          >
            Explore Collection →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/#collection"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-orange-600 transition"
          >
            ← Return to Shopping
          </Link>
          <span className="text-xs text-neutral-500 font-medium">
            Checkout · Step 1 of 2
          </span>
        </div>

        {/* Prototype Notice Banner */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 sm:text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none">⚠️</span>
            <div>
              <p className="font-bold">Phase 2: Frontend Checkout Demonstration</p>
              <p className="mt-1 leading-5 text-amber-800">
                This is a client-side interface demonstration. No real payment will be charged, and no sensitive card credentials are collected. Secure PostgreSQL order persistence and Razorpay/Stripe verification will be implemented in subsequent backend phases.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Left Column: Customer & Delivery Details */}
            <div className="lg:col-span-7 space-y-8">
              {/* 1. Contact Information */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                    1
                  </span>
                  Contact Information
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="e.g. John Doe"
                      className={`mt-1.5 w-full rounded-lg border p-3 text-sm outline-none transition ${
                        errors.fullName ? "border-red-500 bg-red-50/30" : "border-neutral-300 focus:border-neutral-950"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john@example.com"
                      className={`mt-1.5 w-full rounded-lg border p-3 text-sm outline-none transition ${
                        errors.email ? "border-red-500 bg-red-50/30" : "border-neutral-300 focus:border-neutral-950"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`mt-1.5 w-full rounded-lg border p-3 text-sm outline-none transition ${
                        errors.phone ? "border-red-500 bg-red-50/30" : "border-neutral-300 focus:border-neutral-950"
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Delivery Address */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                    2
                  </span>
                  Shipping Address
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      placeholder="House / Flat no., Building name, Street"
                      className={`mt-1.5 w-full rounded-lg border p-3 text-sm outline-none transition ${
                        errors.street ? "border-red-500 bg-red-50/30" : "border-neutral-300 focus:border-neutral-950"
                      }`}
                    />
                    {errors.street && (
                      <p className="mt-1 text-xs text-red-600">{errors.street}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="City"
                      className={`mt-1.5 w-full rounded-lg border p-3 text-sm outline-none transition ${
                        errors.city ? "border-red-500 bg-red-50/30" : "border-neutral-300 focus:border-neutral-950"
                      }`}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm outline-none focus:border-neutral-950"
                    >
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      value={formData.pinCode}
                      onChange={(e) => handleInputChange("pinCode", e.target.value)}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      className={`mt-1.5 w-full rounded-lg border p-3 text-sm outline-none transition ${
                        errors.pinCode ? "border-red-500 bg-red-50/30" : "border-neutral-300 focus:border-neutral-950"
                      }`}
                    />
                    {errors.pinCode && (
                      <p className="mt-1 text-xs text-red-600">{errors.pinCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Payment Method Selection */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                    3
                  </span>
                  Payment Method
                </h2>

                <p className="mt-2 text-xs text-neutral-500">
                  Select your preferred payment method for this order.
                </p>

                <div className="mt-5 space-y-3">
                  {/* Cash on Delivery */}
                  <label
                    className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                      paymentMethod === "cod"
                        ? "border-orange-600 bg-orange-50/30"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 accent-orange-600"
                    />
                    <div>
                      <span className="block text-sm font-bold text-neutral-900">
                        Cash on Delivery (COD)
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        Pay in cash or UPI when your parcel is delivered to your doorstep.
                      </span>
                    </div>
                  </label>

                  {/* Online Payment (Simulated) */}
                  <label
                    className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                      paymentMethod === "online_simulation"
                        ? "border-orange-600 bg-orange-50/30"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online_simulation"
                      checked={paymentMethod === "online_simulation"}
                      onChange={() => setPaymentMethod("online_simulation")}
                      className="mt-1 accent-orange-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900">
                          Online Payment
                        </span>
                        <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                          DEMO SIMULATION
                        </span>
                      </div>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        Simulated UPI / Card payment. (No real money or card numbers are processed).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-orange-600 py-4 text-base font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 cursor-pointer transition"
              >
                {isSubmitting
                  ? "PROCESSING DEMO ORDER..."
                  : `PLACE DEMO ORDER — ₹${total.toLocaleString("en-IN")}`}
              </button>

              <p className="text-center text-xs text-neutral-500">
                By placing this demo order, you confirm acceptance of STYLEHUB terms.
              </p>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900">
                    Order Summary
                  </h3>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                    {cartCount} item{cartCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto py-2">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex items-center gap-4 py-3"
                    >
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-sm font-semibold text-neutral-900">
                          {item.name}
                        </h4>
                        <p className="text-xs text-neutral-500">
                          Size: {item.size} · Qty: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-neutral-900">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Free Shipping Callout */}
                <div className="my-4 rounded-lg bg-neutral-50 p-3 text-xs">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <p className="font-semibold text-green-700 flex items-center gap-1.5">
                      ✓ You qualify for FREE Delivery!
                    </p>
                  ) : (
                    <p className="text-neutral-600">
                      Add <strong className="text-neutral-900">₹{amountToFreeShipping.toLocaleString("en-IN")}</strong> more to qualify for <strong className="text-green-700">Free Shipping</strong>.
                    </p>
                  )}
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-2.5 border-t border-neutral-200 pt-4 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-neutral-900">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>Estimated Shipping</span>
                    {shippingFee === 0 ? (
                      <span className="font-semibold text-green-600 uppercase text-xs">
                        Free
                      </span>
                    ) : (
                      <span className="font-semibold text-neutral-900">
                        ₹{shippingFee}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-extrabold text-neutral-900">
                    <span>Final Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Reassurance Badges */}
                <div className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span>🔒</span>
                    <span>Safe & encrypted demo experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span>Estimated Delivery: 3–5 Business Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>↺</span>
                    <span>7-Day Easy Return Policy upon actual delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50">
          <p className="text-sm font-semibold text-neutral-500">
            Loading checkout...
          </p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
