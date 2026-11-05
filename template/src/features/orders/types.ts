export type ShippingMethod = 'standard' | 'express';

export interface ShippingOption {
  id: ShippingMethod;
  name: string;
  /** Cents. */
  price: number;
  minDays: number;
  maxDays: number;
  /** Subtotal (cents) from which the option is free, or `null`. */
  freeOver: number | null;
}

export interface Address {
  fullName: string;
  street: string;
  complement: string;
  city: string;
  state: string;
  postalCode: string;
}

export type Payment = { method: 'card'; last4: string } | { method: 'cash' };

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: ShippingMethod;
  address: Address;
  payment: Payment;
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  address: Address;
  shippingMethod: ShippingMethod;
  /**
   * Simulated payment. A real app tokenizes the card with its payment
   * provider's SDK and sends only that token: never raw card data.
   */
  payment: Payment;
}

/** Shipping cost of an option for a subtotal (the server applies the same rule). */
export function shippingCost(option: ShippingOption, subtotal: number): number {
  return option.freeOver !== null && subtotal >= option.freeOver
    ? 0
    : option.price;
}
