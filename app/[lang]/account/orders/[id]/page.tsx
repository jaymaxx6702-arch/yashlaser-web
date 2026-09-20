import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  customerAccountsEnabled,
  requireCustomer,
} from "@/lib/customer-auth";
import { getSupabase } from "@/lib/supabase";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    account: "Account", order: "Order", placed: "Placed", updated: "Updated", payment: "Payment",
    back: "← Back to account", support: "Get support ↗", items: "Items", what: "What you ordered",
    standard: "Standard", qty: "Qty", priceRequest: "Price on request", viewProduct: "View product ↗",
    total: "Total", subtotal: "Subtotal", shipping: "Shipping", noPayment: "No separate payment transaction is recorded yet.",
    proof: "Proof", version: "Version", notUploaded: "Not uploaded yet", latestProof: "Latest proof created",
    approved: "Approved", openProof: "Open latest proof ↗", proofUnavailable: "Proof file is temporarily unavailable.",
    proofAction: "Proof approval or change requests still use the secure proof link sent by Yash Laser.",
    proofWaiting: "Your proof will appear here after the design team uploads it.",
    delivery: "Delivery", shippingTracking: "Shipping & tracking", shipTo: "Ship to", awb: "AWB",
    trackCourier: "Track with courier ↗", shipmentWaiting: "Shipment details will appear after dispatch is prepared.",
    timeline: "Timeline", updates: "Order updates", noTimeline: "No timeline entries yet.", notAvailable: "Not available",
  },
  gu: {
    account: "એકાઉન્ટ", order: "ઓર્ડર", placed: "ઓર્ડર તારીખ", updated: "અપડેટ", payment: "ચુકવણી",
    back: "← એકાઉન્ટ પર પાછા", support: "મદદ મેળવો ↗", items: "પ્રોડક્ટ્સ", what: "તમે શું ઓર્ડર કર્યું",
    standard: "સ્ટાન્ડર્ડ", qty: "જથ્થો", priceRequest: "ભાવ પૂછવા પર", viewProduct: "પ્રોડક્ટ જુઓ ↗",
    total: "કુલ", subtotal: "સબટોટલ", shipping: "શિપિંગ", noPayment: "હજુ અલગ payment transaction નોંધાયેલ નથી.",
    proof: "પ્રૂફ", version: "વર્ઝન", notUploaded: "હજુ અપલોડ નથી", latestProof: "છેલ્લો પ્રૂફ બનાવ્યો",
    approved: "મંજૂર", openProof: "છેલ્લો પ્રૂફ ખોલો ↗", proofUnavailable: "પ્રૂફ ફાઇલ હાલમાં ઉપલબ્ધ નથી.",
    proofAction: "પ્રૂફ મંજૂરી અથવા ફેરફાર માટે Yash Laser દ્વારા મોકલેલી સુરક્ષિત proof link વાપરો.",
    proofWaiting: "ડિઝાઇન ટીમ પ્રૂફ અપલોડ કર્યા પછી અહીં દેખાશે.",
    delivery: "ડિલિવરી", shippingTracking: "શિપિંગ અને ટ્રેકિંગ", shipTo: "મોકલવાનું સરનામું", awb: "AWB",
    trackCourier: "કુરિયર પર ટ્રેક કરો ↗", shipmentWaiting: "ડિસ્પેચ તૈયાર થયા પછી shipment વિગતો અહીં દેખાશે.",
    timeline: "ટાઇમલાઇન", updates: "ઓર્ડર અપડેટ્સ", noTimeline: "હજુ timeline entry નથી.", notAvailable: "ઉપલબ્ધ નથી",
  },
  hi: {
    account: "अकाउंट", order: "ऑर्डर", placed: "ऑर्डर तारीख", updated: "अपडेट", payment: "भुगतान",
    back: "← अकाउंट पर वापस", support: "सहायता लें ↗", items: "प्रोडक्ट", what: "आपने क्या ऑर्डर किया",
    standard: "स्टैंडर्ड", qty: "मात्रा", priceRequest: "कीमत पूछने पर", viewProduct: "प्रोडक्ट देखें ↗",
    total: "कुल", subtotal: "सबटोटल", shipping: "शिपिंग", noPayment: "अभी अलग payment transaction दर्ज नहीं है.",
    proof: "प्रूफ", version: "वर्ज़न", notUploaded: "अभी अपलोड नहीं", latestProof: "नवीनतम प्रूफ बनाया गया",
    approved: "मंज़ूर", openProof: "नवीनतम प्रूफ खोलें ↗", proofUnavailable: "प्रूफ फ़ाइल अभी उपलब्ध नहीं है.",
    proofAction: "प्रूफ मंज़ूरी या बदलाव के लिए Yash Laser द्वारा भेजी गई सुरक्षित proof link का उपयोग करें.",
    proofWaiting: "डिज़ाइन टीम प्रूफ अपलोड करने के बाद वह यहाँ दिखेगा.",
    delivery: "डिलीवरी", shippingTracking: "शिपिंग और ट्रैकिंग", shipTo: "भेजने का पता", awb: "AWB",
    trackCourier: "कूरियर पर ट्रैक करें ↗", shipmentWaiting: "डिस्पैच तैयार होने के बाद shipment विवरण यहाँ दिखेगा.",
    timeline: "टाइमलाइन", updates: "ऑर्डर अपडेट", noTimeline: "अभी timeline entry नहीं है.", notAvailable: "उपलब्ध नहीं",
  },
  mr: {
    account: "अकाउंट", order: "ऑर्डर", placed: "ऑर्डर तारीख", updated: "अपडेट", payment: "पेमेंट",
    back: "← अकाउंटवर परत", support: "मदत घ्या ↗", items: "प्रॉडक्ट", what: "तुम्ही काय ऑर्डर केले",
    standard: "स्टँडर्ड", qty: "प्रमाण", priceRequest: "किंमत विचारल्यावर", viewProduct: "प्रॉडक्ट पहा ↗",
    total: "एकूण", subtotal: "सबटोटल", shipping: "शिपिंग", noPayment: "अजून स्वतंत्र payment transaction नोंदलेले नाही.",
    proof: "प्रूफ", version: "व्हर्जन", notUploaded: "अजून अपलोड नाही", latestProof: "नवीनतम प्रूफ तयार",
    approved: "मंजूर", openProof: "नवीनतम प्रूफ उघडा ↗", proofUnavailable: "प्रूफ फाइल सध्या उपलब्ध नाही.",
    proofAction: "प्रूफ मंजुरी किंवा बदलासाठी Yash Laser ने पाठवलेली सुरक्षित proof link वापरा.",
    proofWaiting: "डिझाइन टीम प्रूफ अपलोड केल्यानंतर तो येथे दिसेल.",
    delivery: "डिलिव्हरी", shippingTracking: "शिपिंग आणि ट्रॅकिंग", shipTo: "पाठवायचा पत्ता", awb: "AWB",
    trackCourier: "कुरिअरवर ट्रॅक करा ↗", shipmentWaiting: "डिस्पॅच तयार झाल्यानंतर shipment तपशील येथे दिसेल.",
    timeline: "टाइमलाइन", updates: "ऑर्डर अपडेट", noTimeline: "अजून timeline entry नाही.", notAvailable: "उपलब्ध नाही",
  },
} as const;

const statuses = {
  en: { received: "Received", proof: "Proof", production: "Production", packed: "Packed", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled", pending: "Pending", partial: "Partial", paid: "Paid", refunded: "Refunded", not_applicable: "Not applicable", ready: "Ready", draft: "Draft", changes_requested: "Changes requested", approved: "Approved", superseded: "Superseded", created: "Created", failed: "Failed", preparing: "Preparing", awb_created: "AWB created", in_transit: "In transit", out_for_delivery: "Out for delivery", rto: "RTO" },
  gu: { received: "મળ્યો", proof: "પ્રૂફ", production: "પ્રોડક્શન", packed: "પેક થયો", dispatched: "ડિસ્પેચ થયો", delivered: "ડિલિવર થયો", cancelled: "રદ", pending: "બાકી", partial: "આંશિક", paid: "ચૂકવેલ", refunded: "રિફંડ", not_applicable: "લાગુ નથી", ready: "તૈયાર", draft: "ડ્રાફ્ટ", changes_requested: "ફેરફાર માંગ્યો", approved: "મંજૂર", superseded: "જૂનું વર્ઝન", created: "બનાવ્યું", failed: "નિષ્ફળ", preparing: "તૈયારીમાં", awb_created: "AWB બન્યું", in_transit: "રસ્તામાં", out_for_delivery: "ડિલિવરી માટે નીકળ્યું", rto: "RTO" },
  hi: { received: "प्राप्त", proof: "प्रूफ", production: "प्रोडक्शन", packed: "पैक", dispatched: "डिस्पैच", delivered: "डिलीवर", cancelled: "रद्द", pending: "बाकी", partial: "आंशिक", paid: "भुगतान हुआ", refunded: "रिफंड", not_applicable: "लागू नहीं", ready: "तैयार", draft: "ड्राफ्ट", changes_requested: "बदलाव मांगा गया", approved: "मंज़ूर", superseded: "पुराना वर्ज़न", created: "बनाया गया", failed: "असफल", preparing: "तैयारी में", awb_created: "AWB बना", in_transit: "रास्ते में", out_for_delivery: "डिलीवरी के लिए निकला", rto: "RTO" },
  mr: { received: "मिळाला", proof: "प्रूफ", production: "प्रॉडक्शन", packed: "पॅक", dispatched: "डिस्पॅच", delivered: "डिलिव्हर", cancelled: "रद्द", pending: "बाकी", partial: "अंशतः", paid: "पेड", refunded: "रिफंड", not_applicable: "लागू नाही", ready: "तयार", draft: "ड्राफ्ट", changes_requested: "बदल मागितले", approved: "मंजूर", superseded: "जुने व्हर्जन", created: "तयार केले", failed: "अयशस्वी", preparing: "तयारीत", awb_created: "AWB तयार", in_transit: "मार्गावर", out_for_delivery: "डिलिव्हरीसाठी बाहेर", rto: "RTO" },
} as const;

function readable(lang: keyof typeof statuses, value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return statuses[lang][value as keyof typeof statuses.en] ||
    value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: number | null, currency: string, lang: keyof typeof copy) {
  if (value == null) return copy[lang].priceRequest;
  const locale = lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(value) / 100);
}

function dateTime(value: string | null | undefined, lang: keyof typeof copy) {
  if (!value) return "—";
  const locale = lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
  return new Date(value).toLocaleString(locale, {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function addressText(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const address = value as Record<string, unknown>;
  const preferred = ["name", "line1", "address1", "line2", "address2", "landmark", "city", "district", "state", "pincode", "postalCode", "country"];
  const used = new Set<string>();
  const parts: string[] = [];
  for (const key of preferred) {
    const item = address[key];
    if (typeof item === "string" && item.trim()) {
      parts.push(item.trim());
      used.add(key);
    }
  }
  for (const [key, item] of Object.entries(address)) {
    if (!used.has(key) && typeof item === "string" && item.trim() && !["phone", "mobile", "email"].includes(key))
      parts.push(item.trim());
  }
  return parts.length ? parts.join(", ") : fallback;
}

export default async function LocalizedAccountOrderPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isUiLanguage(lang)) notFound();
  const t = copy[lang];
  const prefix = "/" + lang;
  const accountPath = prefix + "/account";
  const loginPath = accountPath + "/login";

  if (!customerAccountsEnabled()) redirect(accountPath);
  const user = await requireCustomer(loginPath);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = getSupabase();
  const { data: order, error } = await db
    .from("shop_orders")
    .select("id,order_no,status,payment_status,currency,subtotal_minor,shipping_minor,total_minor,shipping_address,created_at,updated_at")
    .eq("id", id)
    .eq("customer_user_id", user.id)
    .maybeSingle();

  if (error || !order) notFound();

  const [
    { data: items },
    { data: shipments },
    { data: proofs },
    { data: payments },
    { data: events },
  ] = await Promise.all([
    db.from("shop_order_items").select("id,product_slug,product_name,variant_name,quantity,unit_price_minor,line_total_minor,configuration").eq("order_id", order.id).order("created_at"),
    db.from("shop_shipments").select("id,courier,awb,tracking_url,status,package_count,dispatched_at,delivered_at,created_at").eq("order_id", order.id).order("created_at", { ascending: false }),
    db.from("shop_proofs").select("id,version_no,status,file_path,file_name,mime_type,note,approved_at,created_at").eq("order_id", order.id).order("version_no", { ascending: false }),
    db.from("shop_payments").select("id,provider,amount_minor,currency,status,created_at").eq("order_id", order.id).order("created_at", { ascending: false }),
    db.from("shop_order_events").select("id,event_type,to_status,note,created_at").eq("order_id", order.id).order("created_at", { ascending: false }),
  ]);

  const latestProof = proofs?.[0] || null;
  let proofUrl: string | null = null;
  if (latestProof?.file_path) {
    const { data } = await db.storage.from("shop-proofs").createSignedUrl(latestProof.file_path, 10 * 60);
    proofUrl = data?.signedUrl || null;
  }

  return (
    <main id="main-content" className="container section" lang={lang}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={accountPath}>{t.account}</Link><span>/</span><span>{order.order_no}</span>
      </nav>

      <div className="account-heading">
        <div>
          <p className="eyebrow">{t.order} {order.order_no}</p>
          <h1>{readable(lang, order.status, t.notAvailable)}</h1>
          <p>{t.placed} {dateTime(order.created_at, lang)} · {t.updated} {dateTime(order.updated_at, lang)}</p>
        </div>
        <div>
          <strong>{money(order.total_minor, order.currency, lang)}</strong>
          <p>{t.payment} {readable(lang, order.payment_status, t.notAvailable)}</p>
        </div>
      </div>

      <div className="hero-actions">
        <Link className="button button-secondary" href={accountPath}>{t.back}</Link>
        <Link className="text-link" href={prefix + "/support"}>{t.support}</Link>
      </div>

      <section className="section">
        <div className="section-heading"><div><p className="eyebrow">{t.items}</p><h2>{t.what}</h2></div></div>
        <div className="admin-list">
          {(items || []).map((item) => (
            <article className="admin-card" key={item.id}>
              <strong>{item.product_name}</strong>
              <p>{item.variant_name || t.standard} · {t.qty} {item.quantity}</p>
              <p>{item.line_total_minor == null ? t.priceRequest : money(item.line_total_minor, order.currency, lang)}</p>
              <Link className="text-link" href={prefix + "/products/" + item.product_slug}>{t.viewProduct}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">{t.payment}</p><h2>{readable(lang, order.payment_status, t.notAvailable)}</h2></div>
          <p>{t.total} {money(order.total_minor, order.currency, lang)}</p>
        </div>
        <div className="admin-card">
          <p>{t.subtotal}: {money(order.subtotal_minor, order.currency, lang)}</p>
          <p>{t.shipping}: {money(order.shipping_minor, order.currency, lang)}</p>
          {(payments || []).map((payment) => (
            <p key={payment.id}>
              {readable(lang, payment.status, t.notAvailable)} · {money(payment.amount_minor, payment.currency, lang)} · {readable(lang, payment.provider, t.notAvailable)} · {dateTime(payment.created_at, lang)}
            </p>
          ))}
          {!payments?.length && <p className="muted">{t.noPayment}</p>}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.proof}</p>
            <h2>{latestProof ? t.version + " " + latestProof.version_no + " · " + readable(lang, latestProof.status, t.notAvailable) : t.notUploaded}</h2>
          </div>
        </div>
        <div className="admin-card">
          {latestProof ? (
            <>
              <p>{t.latestProof} {dateTime(latestProof.created_at, lang)}{latestProof.approved_at ? " · " + t.approved + " " + dateTime(latestProof.approved_at, lang) : ""}</p>
              {latestProof.note && <p>{latestProof.note}</p>}
              {proofUrl ? (
                <a className="text-link" href={proofUrl} target="_blank" rel="noreferrer">{t.openProof}</a>
              ) : (
                <p className="muted">{t.proofUnavailable}</p>
              )}
              <p className="muted">{t.proofAction}</p>
            </>
          ) : <p>{t.proofWaiting}</p>}
        </div>
      </section>

      <section className="section">
        <div className="section-heading"><div><p className="eyebrow">{t.delivery}</p><h2>{t.shippingTracking}</h2></div></div>
        <div className="admin-card">
          <p><strong>{t.shipTo}:</strong> {addressText(order.shipping_address, t.notAvailable)}</p>
          {(shipments || []).map((shipment) => {
            const trackingUrl = safeExternalUrl(shipment.tracking_url);
            return (
              <div key={shipment.id}>
                <p>{readable(lang, shipment.status, t.notAvailable)}{shipment.courier ? " · " + shipment.courier : ""}{shipment.awb ? " · " + t.awb + " " + shipment.awb : ""}</p>
                {trackingUrl && <a className="text-link" href={trackingUrl} target="_blank" rel="noreferrer">{t.trackCourier}</a>}
              </div>
            );
          })}
          {!shipments?.length && <p className="muted">{t.shipmentWaiting}</p>}
        </div>
      </section>

      <section className="section">
        <div className="section-heading"><div><p className="eyebrow">{t.timeline}</p><h2>{t.updates}</h2></div></div>
        <div className="admin-list">
          {(events || []).map((event) => (
            <article className="admin-card" key={event.id}>
              <strong>{readable(lang, event.to_status || event.event_type, t.notAvailable)}</strong>
              {event.note && <p>{event.note}</p>}
              <small>{dateTime(event.created_at, lang)}</small>
            </article>
          ))}
          {!events?.length && <p>{t.noTimeline}</p>}
        </div>
      </section>
    </main>
  );
}
