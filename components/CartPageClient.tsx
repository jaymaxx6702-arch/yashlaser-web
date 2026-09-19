"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CART_EVENT,
  readCart,
  removeCartItem,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

type Checked = CartItem & {
  valid?: boolean;
  reason?: string;
  quoteRequired?: boolean;
  lineTotalMinor?: number | null;
};

export function CartPageClient() {
  const [items, setItems] = useState<Checked[]>([]);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    const local = readCart();
    setItems(local);
    if (!local.length) {
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: local }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to validate cart.");
      const byId = new Map(result.items.map((x: Checked) => [x.id, x]));
      setItems(local.map((x) => ({ ...x, ...(byId.get(x.id) || {}) })));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => void refresh();
    const timer = window.setTimeout(handler, 0);
    window.addEventListener(CART_EVENT, handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CART_EVENT, handler);
    };
  }, [refresh]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, x) => sum + (x.valid && x.lineTotalMinor ? x.lineTotalMinor : 0),
        0,
      ),
    [items],
  );
  const blocked = items.some((x) => x.valid === false);

  if (!items.length)
    return (
      <section className="cart-empty">
        <p className="eyebrow">Your cart</p>
        <h1>Your cart is empty.</h1>
        <p>Explore the collection and add a product when you are ready.</p>
        <Link className="button" href="/products">Explore products ↗</Link>
      </section>
    );

  return (
    <div className="cart-layout">
      <section>
        <p className="eyebrow">Your cart</p>
        <h1>Review your selection.</h1>
        <div className="cart-items">
          {items.map((item) => (
            <article className="cart-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.variantName || "Option to confirm"}</p>
                {item.valid === false && <p className="form-error">{item.reason}</p>}
                {item.quoteRequired && <p className="muted">Final price confirmed in quotation.</p>}
              </div>
              <label>
                Quantity
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={item.quantity}
                  onChange={(e) =>
                    updateCartQuantity(item.id, Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </label>
              <div>
                <strong>
                  {item.lineTotalMinor
                    ? money(item.lineTotalMinor)
                    : item.quoteRequired
                      ? "Quote"
                      : "Checking…"}
                </strong>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => removeCartItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="cart-summary">
        <p className="eyebrow">Summary</p>
        <div className="summary-row"><span>Priced items</span><strong>{money(total)}</strong></div>
        <p className="muted">
          Delivery, bulk pricing, personalisation and any quote-only items are confirmed before payment.
        </p>
        <Link
          className={"button" + (blocked || checking ? " is-disabled" : "")}
          aria-disabled={blocked || checking}
          href={blocked || checking ? "/cart" : "/checkout"}
        >
          {checking ? "Checking cart…" : "Continue to checkout →"}
        </Link>
      </aside>
    </div>
  );
}
