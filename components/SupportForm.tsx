"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { UiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    name: "Name",
    phone: "Phone",
    email: "Email",
    category: "Category",
    categories: {
      order: "Order",
      proof: "Proof",
      delivery: "Delivery",
      replacement: "Replacement",
      general: "General",
    },
    orderNo: "Order number (optional)",
    orderToken: "Secure order token (optional)",
    orderHelp:
      "To link this complaint to an existing order, enter both values from your secure order tracking link.",
    subject: "Subject",
    message: "Message",
    submitting: "Submitting…",
    submit: "Create support ticket →",
    created: "Ticket {ticket} created.",
    error: "Unable to create support ticket.",
    track: "Track support ticket ↗",
  },
  gu: {
    name: "નામ",
    phone: "ફોન",
    email: "ઈમેલ",
    category: "કેટેગરી",
    categories: {
      order: "ઓર્ડર",
      proof: "પ્રૂફ",
      delivery: "ડિલિવરી",
      replacement: "રિપ્લેસમેન્ટ",
      general: "સામાન્ય",
    },
    orderNo: "ઓર્ડર નંબર (વૈકલ્પિક)",
    orderToken: "સિક્યોર ઓર્ડર ટોકન (વૈકલ્પિક)",
    orderHelp:
      "આ ફરિયાદને હાલના ઓર્ડર સાથે link કરવા secure order tracking linkમાંથી બંને values દાખલ કરો.",
    subject: "વિષય",
    message: "મેસેજ",
    submitting: "સબમિટ થઈ રહ્યું છે…",
    submit: "સપોર્ટ ટિકિટ બનાવો →",
    created: "ટિકિટ {ticket} બની ગઈ.",
    error: "સપોર્ટ ટિકિટ બનાવી શકાયી નથી.",
    track: "સપોર્ટ ટિકિટ ટ્રેક કરો ↗",
  },
  hi: {
    name: "नाम",
    phone: "फोन",
    email: "ईमेल",
    category: "कैटेगरी",
    categories: {
      order: "ऑर्डर",
      proof: "प्रूफ",
      delivery: "डिलीवरी",
      replacement: "रिप्लेसमेंट",
      general: "सामान्य",
    },
    orderNo: "ऑर्डर नंबर (वैकल्पिक)",
    orderToken: "सिक्योर ऑर्डर टोकन (वैकल्पिक)",
    orderHelp:
      "इस शिकायत को मौजूदा ऑर्डर से link करने के लिए secure order tracking link से दोनों values दर्ज करें.",
    subject: "विषय",
    message: "मैसेज",
    submitting: "सबमिट हो रहा है…",
    submit: "सपोर्ट टिकट बनाएँ →",
    created: "टिकट {ticket} बन गया.",
    error: "सपोर्ट टिकट नहीं बनाया जा सका.",
    track: "सपोर्ट टिकट ट्रैक करें ↗",
  },
  mr: {
    name: "नाव",
    phone: "फोन",
    email: "ईमेल",
    category: "कॅटेगरी",
    categories: {
      order: "ऑर्डर",
      proof: "प्रूफ",
      delivery: "डिलिव्हरी",
      replacement: "रिप्लेसमेंट",
      general: "सामान्य",
    },
    orderNo: "ऑर्डर नंबर (पर्यायी)",
    orderToken: "सिक्योर ऑर्डर टोकन (पर्यायी)",
    orderHelp:
      "ही तक्रार विद्यमान ऑर्डरशी link करण्यासाठी secure order tracking linkमधील दोन्ही values भरा.",
    subject: "विषय",
    message: "मेसेज",
    submitting: "सबमिट होत आहे…",
    submit: "सपोर्ट तिकीट तयार करा →",
    created: "तिकीट {ticket} तयार झाले.",
    error: "सपोर्ट तिकीट तयार करता आले नाही.",
    track: "सपोर्ट तिकीट ट्रॅक करा ↗",
  },
} as const;

export function SupportForm({ lang = "en" }: { lang?: UiLanguage }) {
  const t = copy[lang];
  const prefix = lang === "en" ? "" : "/" + lang;
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<{ ticketNo: string; token: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(
      [
        "name",
        "mobile",
        "email",
        "category",
        "orderNo",
        "orderToken",
        "subject",
        "message",
      ].map((key) => [key, String(fd.get(key) || "")]),
    );

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || t.error);

      setResult({ ticketNo: data.ticketNo, token: data.token });
      setStatus(t.created.replace("{ticket}", data.ticketNo));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="checkout-fields">
        <label>
          {t.name}
          <input name="name" required maxLength={80} />
        </label>
        <label>
          {t.phone}
          <input name="mobile" required maxLength={20} />
        </label>
        <label>
          {t.email}
          <input name="email" type="email" maxLength={160} />
        </label>
        <label>
          {t.category}
          <select name="category">
            <option value="order">{t.categories.order}</option>
            <option value="proof">{t.categories.proof}</option>
            <option value="delivery">{t.categories.delivery}</option>
            <option value="replacement">{t.categories.replacement}</option>
            <option value="general">{t.categories.general}</option>
          </select>
        </label>

        <label>
          {t.orderNo}
          <input name="orderNo" maxLength={40} />
        </label>
        <label>
          {t.orderToken}
          <input name="orderToken" maxLength={100} />
        </label>
        <p className="muted full">{t.orderHelp}</p>

        <label className="full">
          {t.subject}
          <input name="subject" required maxLength={160} />
        </label>
        <label className="full">
          {t.message}
          <textarea name="message" rows={5} required maxLength={3000} />
        </label>
      </div>

      <button className="button" disabled={busy}>
        {busy ? t.submitting : t.submit}
      </button>

      {status && <p role="status">{status}</p>}

      {result && (
        <p>
          <Link
            className="text-link"
            href={
              prefix +
              "/support/ticket?ticket=" +
              encodeURIComponent(result.ticketNo) +
              "&token=" +
              encodeURIComponent(result.token)
            }
          >
            {t.track}
          </Link>
        </p>
      )}
    </form>
  );
}
