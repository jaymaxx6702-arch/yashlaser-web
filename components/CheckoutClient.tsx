"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { clearCart, readCart, type CartItem } from "@/lib/cart";
import { sendAnalyticsEvent } from "@/components/Analytics";
import type { UiLanguage } from "@/lib/i18n";

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

type Validated = CartItem & {
  valid?: boolean;
  reason?: string;
  quoteRequired?: boolean;
  lineTotalMinor?: number | null;
};

const copy = {
  en: {
    loading: "Checking your cart…", received: "Request received", thanks: "Thank you.", reference: "Your reference is",
    confirm: "We will confirm the final quotation, proof and delivery before any production or payment.",
    track: "Track this order ↗", browse: "Continue browsing ↗", empty: "Your cart is empty.", explore: "Explore products ↗",
    eyebrow: "Checkout", title: "Delivery & contact details.", name: "Your name", phone: "WhatsApp / phone",
    email: "Email (optional)", city: "City", address: "Delivery address", state: "State", pincode: "Pincode",
    notes: "Notes (optional)", consent: "I confirm these details are correct and understand the final quotation, digital proof and delivery must be confirmed before production.",
    review: "Order review", quote: "Quote", subtotal: "Priced subtotal", shipping: "Shipping and quote-only items are confirmed before payment.",
    submitting: "Submitting…", submit: "Submit order request →", checkingDelivery: "Checking delivery…",
    deliveryDefault: "Delivery will be confirmed before payment.", deliveryError: "Unable to check delivery.",
    cartError: "Unable to validate cart.", submitError: "Unable to submit checkout.",
  },
  gu: {
    loading: "તમારી કાર્ટ ચેક થઈ રહી છે…", received: "રિક્વેસ્ટ મળી ગઈ", thanks: "આભાર.", reference: "તમારો રેફરન્સ છે",
    confirm: "પ્રોડક્શન અથવા ચુકવણી પહેલાં અમે અંતિમ ક્વોટેશન, પ્રૂફ અને ડિલિવરી કન્ફર્મ કરીશું.",
    track: "આ ઓર્ડર ટ્રેક કરો ↗", browse: "ખરીદી ચાલુ રાખો ↗", empty: "તમારી કાર્ટ ખાલી છે.", explore: "પ્રોડક્ટ્સ જુઓ ↗",
    eyebrow: "ચેકઆઉટ", title: "ડિલિવરી અને સંપર્કની વિગતો.", name: "તમારું નામ", phone: "WhatsApp / ફોન",
    email: "ઈમેલ (વૈકલ્પિક)", city: "શહેર", address: "ડિલિવરી સરનામું", state: "રાજ્ય", pincode: "પિનકોડ",
    notes: "નોંધ (વૈકલ્પિક)", consent: "હું ખાતરી કરું છું કે આ વિગતો સાચી છે અને પ્રોડક્શન પહેલાં અંતિમ ક્વોટેશન, ડિજિટલ પ્રૂફ અને ડિલિવરી કન્ફર્મ થવી જરૂરી છે.",
    review: "ઓર્ડર સમીક્ષા", quote: "ક્વોટ", subtotal: "ભાવવાળો સબટોટલ", shipping: "શિપિંગ અને ક્વોટવાળી વસ્તુઓ ચુકવણી પહેલાં કન્ફર્મ થશે.",
    submitting: "સબમિટ થઈ રહ્યું છે…", submit: "ઓર્ડર રિક્વેસ્ટ સબમિટ કરો →", checkingDelivery: "ડિલિવરી ચેક થઈ રહી છે…",
    deliveryDefault: "ચુકવણી પહેલાં ડિલિવરી કન્ફર્મ થશે.", deliveryError: "ડિલિવરી ચેક કરી શકાયી નથી.",
    cartError: "કાર્ટ ચેક કરી શકાયી નથી.", submitError: "ચેકઆઉટ સબમિટ થઈ શક્યો નથી.",
  },
  hi: {
    loading: "आपकी कार्ट जांची जा रही है…", received: "रिक्वेस्ट मिल गई", thanks: "धन्यवाद.", reference: "आपका रेफरेंस है",
    confirm: "प्रोडक्शन या भुगतान से पहले हम अंतिम कोटेशन, प्रूफ और डिलीवरी कन्फर्म करेंगे.",
    track: "इस ऑर्डर को ट्रैक करें ↗", browse: "खरीदारी जारी रखें ↗", empty: "आपकी कार्ट खाली है.", explore: "प्रोडक्ट देखें ↗",
    eyebrow: "चेकआउट", title: "डिलीवरी और संपर्क विवरण.", name: "आपका नाम", phone: "WhatsApp / फोन",
    email: "ईमेल (वैकल्पिक)", city: "शहर", address: "डिलीवरी पता", state: "राज्य", pincode: "पिनकोड",
    notes: "नोट्स (वैकल्पिक)", consent: "मैं पुष्टि करता/करती हूँ कि ये विवरण सही हैं और प्रोडक्शन से पहले अंतिम कोटेशन, डिजिटल प्रूफ और डिलीवरी कन्फर्म होना आवश्यक है.",
    review: "ऑर्डर समीक्षा", quote: "कोट", subtotal: "कीमत वाला सबटोटल", shipping: "शिपिंग और कोट वाले आइटम भुगतान से पहले कन्फर्म होंगे.",
    submitting: "सबमिट हो रहा है…", submit: "ऑर्डर रिक्वेस्ट सबमिट करें →", checkingDelivery: "डिलीवरी जांची जा रही है…",
    deliveryDefault: "भुगतान से पहले डिलीवरी कन्फर्म होगी.", deliveryError: "डिलीवरी जांची नहीं जा सकी.",
    cartError: "कार्ट जांची नहीं जा सकी.", submitError: "चेकआउट सबमिट नहीं हो सका.",
  },
  mr: {
    loading: "तुमची कार्ट तपासत आहे…", received: "रिक्वेस्ट मिळाली", thanks: "धन्यवाद.", reference: "तुमचा रेफरन्स आहे",
    confirm: "प्रॉडक्शन किंवा पेमेंटपूर्वी आम्ही अंतिम कोटेशन, प्रूफ आणि डिलिव्हरी निश्चित करू.",
    track: "हा ऑर्डर ट्रॅक करा ↗", browse: "खरेदी सुरू ठेवा ↗", empty: "तुमची कार्ट रिकामी आहे.", explore: "प्रॉडक्ट पहा ↗",
    eyebrow: "चेकआउट", title: "डिलिव्हरी आणि संपर्क तपशील.", name: "तुमचे नाव", phone: "WhatsApp / फोन",
    email: "ईमेल (पर्यायी)", city: "शहर", address: "डिलिव्हरी पत्ता", state: "राज्य", pincode: "पिनकोड",
    notes: "नोट्स (पर्यायी)", consent: "मी खात्री करतो/करते की ही माहिती बरोबर आहे आणि प्रॉडक्शनपूर्वी अंतिम कोटेशन, डिजिटल प्रूफ आणि डिलिव्हरी निश्चित करणे आवश्यक आहे.",
    review: "ऑर्डर आढावा", quote: "कोट", subtotal: "किंमत असलेला सबटोटल", shipping: "शिपिंग आणि कोट आयटम पेमेंटपूर्वी निश्चित होतील.",
    submitting: "सबमिट होत आहे…", submit: "ऑर्डर रिक्वेस्ट सबमिट करा →", checkingDelivery: "डिलिव्हरी तपासत आहे…",
    deliveryDefault: "पेमेंटपूर्वी डिलिव्हरी निश्चित होईल.", deliveryError: "डिलिव्हरी तपासता आली नाही.",
    cartError: "कार्ट तपासता आली नाही.", submitError: "चेकआउट सबमिट करता आला नाही.",
  },
} as const;

export function CheckoutClient({ lang = "en" }: { lang?: UiLanguage }) {
  const t = copy[lang];
  const prefix = lang === "en" ? "" : "/" + lang;
  const [items, setItems] = useState<Validated[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [trackingPath, setTrackingPath] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const requestId = useRef("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const local = readCart();
      if (!local.length) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      void fetch("/api/cart/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: local }),
      })
        .then(async (r) => {
          const result = await r.json();
          if (!r.ok)
            throw new Error(result.error || t.cartError);
          const byId = new Map(
            result.items.map((x: Validated) => [x.id, x]),
          );
          if (!cancelled)
            setItems(
              local.map((x) => ({
                ...x,
                ...(byId.get(x.id) || {}),
              })),
            );
        })
        .catch((e) => {
          if (!cancelled)
            setError(
              e instanceof Error
                ? e.message
                : t.cartError,
            );
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [t.cartError]);

  const total = useMemo(
    () => items.reduce((n, x) => n + (x.lineTotalMinor || 0), 0),
    [items],
  );

  async function checkPincode(value: string) {
    const pincode = value.trim();
    if (!/^\d{6}$/.test(pincode)) {
      setShippingStatus("");
      return;
    }
    setShippingStatus(t.checkingDelivery);
    try {
      const response = await fetch("/api/shipping/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pincode }),
      });
      const result = await response.json();
      setShippingStatus(
        response.ok
          ? result.message || t.deliveryDefault
          : result.error || t.deliveryError,
      );
    } catch {
      setShippingStatus(t.deliveryDefault);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!items.length || items.some((x) => x.valid === false)) return;
    setBusy(true);
    sendAnalyticsEvent({
      eventName: "begin_checkout",
      path: prefix + "/checkout",
      metadata: { itemCount: items.length },
    });
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
      if (!response.ok) throw new Error(result.error || t.submitError);
      setReference(result.reference);
      setTrackingPath(typeof result.trackingPath === "string" ? result.trackingPath : "");
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.submitError);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p role="status">{t.loading}</p>;
  if (reference)
    return (
      <section className="checkout-success" role="status">
        <p className="eyebrow">{t.received}</p>
        <h1>{t.thanks}</h1>
        <p>{t.reference} <strong>{reference}</strong>.</p>
        <p>{t.confirm}</p>
        <div className="hero-actions">
          {trackingPath && <Link className="button" href={trackingPath}>{t.track}</Link>}
          <Link className="text-link" href={prefix + "/products"}>{t.browse}</Link>
        </div>
      </section>
    );
  if (!items.length)
    return (
      <section>
        <h1>{t.empty}</h1>
        <Link className="button" href={prefix + "/products"}>{t.explore}</Link>
      </section>
    );

  return (
    <form className="checkout-layout" onSubmit={submit}>
      <section>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="checkout-fields">
          <label>{t.name}<input name="name" minLength={2} maxLength={80} autoComplete="name" required /></label>
          <label>{t.phone}<input name="phone" type="tel" minLength={10} maxLength={20} autoComplete="tel" required /></label>
          <label>{t.email}<input name="email" type="email" maxLength={160} autoComplete="email" /></label>
          <label>{t.city}<input name="city" maxLength={100} autoComplete="address-level2" required /></label>
          <label className="full">{t.address}<textarea name="address" rows={3} maxLength={500} autoComplete="street-address" required /></label>
          <label>{t.state}<input name="state" maxLength={100} autoComplete="address-level1" required /></label>
          <label>
            {t.pincode}
            <input
              name="pincode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="postal-code"
              required
              onBlur={(e) => void checkPincode(e.currentTarget.value)}
            />
            {shippingStatus && <small role="status">{shippingStatus}</small>}
          </label>
          <label className="full">{t.notes}<textarea name="notes" rows={3} maxLength={1000} /></label>
        </div>
        <label className="consent-row">
          <input type="checkbox" name="consent" required />
          {t.consent}
        </label>
      </section>
      <aside className="cart-summary">
        <p className="eyebrow">{t.review}</p>
        {items.map((item) => (
          <div className="summary-row" key={item.id}>
            <span>{item.name} × {item.quantity}</span>
            <strong>{item.lineTotalMinor ? money(item.lineTotalMinor) : t.quote}</strong>
          </div>
        ))}
        <div className="summary-row"><span>{t.subtotal}</span><strong>{money(total)}</strong></div>
        <p className="muted">{t.shipping}</p>
        <button className="button" disabled={busy || items.some((x) => x.valid === false)}>
          {busy ? t.submitting : t.submit}
        </button>
      </aside>
    </form>
  );
}
