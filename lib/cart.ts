"use client";
import { sendAnalyticsEvent } from "@/components/Analytics";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  variantId: string;
  variantName: string;
  quantity: number;
  unitPriceMinor: number | null;
  pricingMode: string;
  designId?: string;
  designToken?: string;
  notes?: string;
};

const KEY = "yl-cart-v1";
const EVENT = "yl-cart-changed";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function addCartItem(item: Omit<CartItem, "id">) {
  const items = readCart();
  const same = items.find((x) => {
    if (x.productId !== item.productId || x.variantId !== item.variantId)
      return false;
    if (!x.designId && !item.designId) return true;
    return (
      Boolean(x.designId) &&
      x.designId === item.designId &&
      x.designToken === item.designToken
    );
  });
  if (same) {
    same.quantity = Math.min(10000, same.quantity + item.quantity);
  } else {
    items.push({ ...item, id: crypto.randomUUID() });
  }
  save(items);
  sendAnalyticsEvent({
    eventName: "add_to_cart",
    productId: item.productId,
    path: "/cart",
    metadata: { quantity: item.quantity },
  });
}

export function updateCartQuantity(id: string, quantity: number) {
  const items = readCart();
  const item = items.find((x) => x.id === id);
  if (!item) return;
  item.quantity = Math.max(1, Math.min(10000, Math.trunc(quantity || 1)));
  save(items);
}

export function removeCartItem(id: string) {
  save(readCart().filter((x) => x.id !== id));
}

export function clearCart() {
  save([]);
}

export function cartCount() {
  return readCart().reduce((n, x) => n + x.quantity, 0);
}

export const CART_EVENT = EVENT;
