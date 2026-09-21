"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { UiLanguage } from "@/lib/i18n";

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

const copy = {
  en: {
    eyebrow: "Track order",
    title: "Order status.",
    help: "Use the order number and secure token from your confirmation link.",
    order: "Order number",
    token: "Secure token",
    checking: "Checking…",
    button: "Track order →",
    payment: "Payment",
    total: "Total",
    items: "Items",
    quote: "Quote",
    shipment: "Shipment",
    courier: "Courier",
    awb: "AWB",
    courierTracking: "Courier tracking ↗",
    error: "Unable to track order.",
  },
  gu: {
    eyebrow: "ઓર્ડર ટ્રેક કરો",
    title: "ઓર્ડરની સ્થિતિ.",
    help: "તમારી કન્ફર્મેશન લિંકમાં આપેલો ઓર્ડર નંબર અને સુરક્ષિત ટોકન વાપરો.",
    order: "ઓર્ડર નંબર",
    token: "સુરક્ષિત ટોકન",
    checking: "ચેક થઈ રહ્યું છે…",
    button: "ઓર્ડર ટ્રેક કરો →",
    payment: "ચુકવણી",
    total: "કુલ",
    items: "પ્રોડક્ટ્સ",
    quote: "ક્વોટ",
    shipment: "શિપમેન્ટ",
    courier: "કુરિયર",
    awb: "AWB",
    courierTracking: "કુરિયર ટ્રેકિંગ ↗",
    error: "ઓર્ડર ટ્રેક કરી શકાયો નથી.",
  },
  hi: {
    eyebrow: "ऑर्डर ट्रैक करें",
    title: "ऑर्डर की स्थिति.",
    help: "कन्फर्मेशन लिंक में दिए गए ऑर्डर नंबर और सुरक्षित टोकन का उपयोग करें.",
    order: "ऑर्डर नंबर",
    token: "सुरक्षित टोकन",
    checking: "जांच हो रही है…",
    button: "ऑर्डर ट्रैक करें →",
    payment: "भुगतान",
    total: "कुल",
    items: "प्रोडक्ट",
    quote: "कोट",
    shipment: "शिपमेंट",
    courier: "कूरियर",
    awb: "AWB",
    courierTracking: "कूरियर ट्रैकिंग ↗",
    error: "ऑर्डर ट्रैक नहीं किया जा सका.",
  },
  mr: {
    eyebrow: "ऑर्डर ट्रॅक करा",
    title: "ऑर्डरची स्थिती.",
    help: "कन्फर्मेशन लिंकमधील ऑर्डर नंबर आणि सुरक्षित टोकन वापरा.",
    order: "ऑर्डर नंबर",
    token: "सुरक्षित टोकन",
    checking: "तपासत आहे…",
    button: "ऑर्डर ट्रॅक करा →",
    payment: "पेमेंट",
    total: "एकूण",
    items: "प्रॉडक्ट",
    quote: "कोट",
    shipment: "शिपमेंट",
    courier: "कुरिअर",
    awb: "AWB",
    courierTracking: "कुरिअर ट्रॅकिंग ↗",
    error: "ऑर्डर ट्रॅक करता आला नाही.",
  },
} as const;

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

export function TrackOrderClient({ lang = "en" }: { lang?: UiLanguage }) {
  const t = copy[lang];
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
      if (!response.ok) throw new Error(data.error || t.error);
      setResult(data);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (orderNo && token) void lookup();
    }, 0);
    return () => window.clearTimeout(timer);
    // query-string lookup runs only on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tracking-layout">
      <form className="tracking-form" onSubmit={lookup}>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="muted">{t.help}</p>
        <label>{t.order}<input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} required /></label>
        <label>{t.token}<input value={token} onChange={(e) => setToken(e.target.value)} required /></label>
        <button className="button" disabled={busy}>{busy ? t.checking : t.button}</button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      {result && (
        <section className="tracking-result">
          <p className="eyebrow">{result.order.order_no}</p>
          <h2>{result.order.status.replaceAll("_", " ")}</h2>
          <p>{t.payment}: <strong>{result.order.payment_status.replaceAll("_", " ")}</strong></p>
          {result.order.total_minor > 0 && <p>{t.total}: <strong>{money(result.order.total_minor)}</strong></p>}
          <h3>{t.items}</h3>
          {result.items.map((item) => (
            <div className="summary-row" key={item.id}>
              <span>{item.product_name}{item.variant_name ? " · " + item.variant_name : ""} × {item.quantity}</span>
              <strong>{item.line_total_minor ? money(item.line_total_minor) : t.quote}</strong>
            </div>
          ))}
          {result.shipments.length > 0 && (
            <>
              <h3>{t.shipment}</h3>
              {result.shipments.map((shipment, index) => (
                <div key={index}>
                  <p>{shipment.courier || t.courier} · {shipment.status.replaceAll("_", " ")}</p>
                  {shipment.awb && <p>{t.awb}: {shipment.awb}</p>}
                  {shipment.tracking_url && <a className="text-link" href={shipment.tracking_url} target="_blank" rel="noreferrer">{t.courierTracking}</a>}
                </div>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}
