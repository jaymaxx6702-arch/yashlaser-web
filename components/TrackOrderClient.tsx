"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type Result = {
  order: {
    order_no: string;
    status: string;
    payment_status: string;
    total_minor: number;
    currency: string;
    created_at: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    line_total_minor: number | null;
  }>;
  shipments: Array<{
    courier: string | null;
    awb: string | null;
    tracking_url: string | null;
    status: string;
  }>;
};

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

export function TrackOrderClient() {
  const params = useSearchParams();
  const [orderNo, setOrderNo] = useState(params.get("order") || "");
  const [token, setToken] = useState(params.get("token") || "");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNo, token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to track order.");
      setResult(data);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Unable to track order.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (orderNo && token) void lookup();
    // query-string lookup runs only on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tracking-layout">
      <form className="tracking-form" onSubmit={lookup}>
        <p className="eyebrow">Track order</p>
        <h1>Order status.</h1>
        <p className="muted">Use the order number and secure token from your confirmation link.</p>
        <label>Order number<input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} required /></label>
        <label>Secure token<input value={token} onChange={(e) => setToken(e.target.value)} required /></label>
        <button className="button" disabled={busy}>{busy ? "Checking…" : "Track order →"}</button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      {result && (
        <section className="tracking-result">
          <p className="eyebrow">{result.order.order_no}</p>
          <h2>{result.order.status.replaceAll("_", " ")}</h2>
          <p>Payment: <strong>{result.order.payment_status.replaceAll("_", " ")}</strong></p>
          {result.order.total_minor > 0 && <p>Total: <strong>{money(result.order.total_minor)}</strong></p>}
          <h3>Items</h3>
          {result.items.map((item) => (
            <div className="summary-row" key={item.id}>
              <span>{item.product_name}{item.variant_name ? " · " + item.variant_name : ""} × {item.quantity}</span>
              <strong>{item.line_total_minor ? money(item.line_total_minor) : "Quote"}</strong>
            </div>
          ))}
          {result.shipments.length > 0 && (
            <>
              <h3>Shipment</h3>
              {result.shipments.map((shipment, index) => (
                <div key={index}>
                  <p>{shipment.courier || "Courier"} · {shipment.status.replaceAll("_", " ")}</p>
                  {shipment.awb && <p>AWB: {shipment.awb}</p>}
                  {shipment.tracking_url && <a className="text-link" href={shipment.tracking_url} target="_blank" rel="noreferrer">Courier tracking ↗</a>}
                </div>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}
