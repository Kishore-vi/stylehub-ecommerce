"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  useState,
  ReactNode,
} from "react";

export type CartItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: number, size: string, quantity: number) => void;
  removeFromCart: (id: number, size: string) => void;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

let memoryCart: CartItem[] = [];
let isInitialized = false;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function initCart() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;
  try {
    const saved = localStorage.getItem("stylehub-cart");
    if (saved) {
      memoryCart = JSON.parse(saved);
    }
  } catch {
    localStorage.removeItem("stylehub-cart");
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CartItem[] {
  initCart();
  return memoryCart;
}

const serverCart: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return serverCart;
}

function saveCart(newCart: CartItem[]) {
  initCart();
  if (memoryCart.length === 0 && newCart.length === 0) return;
  memoryCart = newCart;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("stylehub-cart", JSON.stringify(memoryCart));
    } catch {
      // ignore
    }
  }
  emitChange();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isCartOpen, setIsCartOpen] = useState(false);

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  function addToCart(item: CartItem) {
    const current = getSnapshot();
    const existingIndex = current.findIndex(
      (cartItem) => cartItem.id === item.id && cartItem.size === item.size
    );

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + item.quantity,
      };
      saveCart(updated);
    } else {
      saveCart([...current, item]);
    }
  }

  function updateQuantity(id: number, size: string, quantity: number) {
    if (quantity < 1) return;
    const current = getSnapshot();
    const updated = current.map((item) =>
      item.id === id && item.size === size ? { ...item, quantity } : item
    );
    saveCart(updated);
  }

  function removeFromCart(id: number, size: string) {
    const current = getSnapshot();
    const updated = current.filter(
      (item) => !(item.id === id && item.size === size)
    );
    saveCart(updated);
  }

  function clearCart() {
    if (memoryCart.length === 0) return;
    saveCart([]);
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}