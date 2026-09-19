"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { clearCart, readCart, type CartItem } from "@/lib/cart";

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

type Validated = CartItem & {
  valid?: boolean;
  reason?: string;
  quoteRequired?: boolean;
  lineTotalMinor?: number | null;
};

export function CheckoutClient() {
  const [items, setItems] = useState<Validated[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const requestId = useRef("");

  useEffect(() => {
    const local = readCart();
    if (!local.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    void fetch("/api/cart/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: local }),
    })
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw new Error(result.error || "Unable to validate cart.");
        const byId = new Map(result.items.map((x: Validated) => [x.id, x]));
        setItems(local.map((x) => ({ ...x, ...(byId.get(x.id) || {}) })));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to validate cart."))
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(
    () => items.reduce((n, x) => n + (x.lineTotalMinor || 0), 0),
    [items],
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!items.length || items.some((x) => x.valid === false)) return;
    setBusy(true);
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const form = new FormData(e.currentTarget);
      const payload = {
        requestId: requestId.current,
        customer: {
          name: String(form.get("name") || ""),
          phone: String(form.get("phone") || ""),
          email: String(form.get("email") || ""),
          city: String(form.get("city") || ""),
          address: String(form.get("address") || ""),
          state: String(form.get("state") || ""),
          pincode: String(form.get("pincode") || ""),
          notes: String(form.get("notes") || ""),
          consent: form.get("consent") === "on",
        },
        items: readCart(),
      };
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit checkout.");
      setReference(result.reference);
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit checkout.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p role="status">Checking your cart…</p>;
  if (reference)
    return (
      <section className="checkout-success" role="status">
        <p className="eyebrow">Request received</p>
        <h1>Thank you.</h1>
        <p>Your reference is <strong>{reference}</strong>.</p>
        <p>
          We will confirm the final quotation, proof and delivery before any production or payment.
        </p>
        <Link className="button" href="/products">Continue browsing ↗</Link>
      </section>
    );
  if (!items.length)
    return (
      <section>
        <h1>Your cart is empty.</h1>
        <Link className="button" href="/products">Explore products ↗</Link>
      </section>
    );

  return (
    <form className="checkout-layout" onSubmit={submit}>
      <section>
        <p className="eyebrow">Checkout</p>
        <h1>Delivery & contact details.</h1>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="checkout-fields">
          <label>Your name<input name="name" minLength={2} maxLength={80} autoComplete="name" required /></label>
          <label>WhatsApp / phone<input name="phone" type="tel" minLength={10} maxLength={20} autoComplete="tel" required /></label>
          <label>Email (optional)<input name="email" type="email" maxLength={160} autoComplete="email" /></label>
          <label>City<input name="city" maxLength={100} autoComplete="address-level2" required /></label>
          <label className="full">Delivery address<textarea name="address" rows={3} maxLength={500} autoComplete="street-address" required /></label>
          <label>State<input name="state" maxLength={100} autoComplete="address-level1" required /></label>
          <label>Pincode<input name="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" required /></label>
          <label className="full">Notes (optional)<textarea name="notes" rows={3} maxLength={1000} /></label>
        </div>
        <label className="consent-row">
          <input type="checkbox" name="consent" required />
          I confirm these details are correct and understand the final quotation, digital proof and delivery must be confirmed before production.
        </label>
      </section>
      <aside className="cart-summary">
        <p className="eyebrow">Order review</p>
        {items.map((item) => (
          <div className="summary-row" key={item.id}>
            <span>{item.name} × {item.quantity}</span>
            <strong>{item.lineTotalMinor ? money(item.lineTotalMinor) : "Quote"}</strong>
          </div>
        ))}
        <div className="summary-row"><span>Priced subtotal</span><strong>{money(total)}</strong></div>
        <p className="muted">Shipping and quote-only items are confirmed before payment.</p>
        <button className="button" disabled={busy || items.some((x) => x.valid === false)}>
          {busy ? "Submitting…" : "Submit order request →"}
        </button>
      </aside>
    </form>
  );
}
