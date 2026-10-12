import { CartItem } from "../CartContext";

export type CustomerDetails = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
};

export type DemoOrder = {
  orderId: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: "cod" | "online_simulation";
  createdAt: string;
  estimatedDelivery: string;
};
