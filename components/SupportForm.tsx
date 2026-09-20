"use client";
import { useState, type FormEvent } from "react";
import type { UiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    name: "Name", phone: "Phone", email: "Email", category: "Category",
    categories: { order: "Order", proof: "Proof", delivery: "Delivery", replacement: "Replacement", general: "General" },
    subject: "Subject", message: "Message", submitting: "Submitting…", submit: "Create support ticket →",
    created: "Ticket {ticket} created.", error: "Unable to create support ticket.",
  },
  gu: {
    name: "નામ", phone: "ફોન", email: "ઈમેલ", category: "કેટેગરી",
    categories: { order: "ઓર્ડર", proof: "પ્રૂફ", delivery: "ડિલિવરી", replacement: "રિપ્લેસમેન્ટ", general: "સામાન્ય" },
    subject: "વિષય", message: "મેસેજ", submitting: "સબમિટ થઈ રહ્યું છે…", submit: "સપોર્ટ ટિકિટ બનાવો →",
    created: "ટિકિટ {ticket} બની ગઈ.", error: "સપોર્ટ ટિકિટ બનાવી શકાયી નથી.",
  },
  hi: {
    name: "नाम", phone: "फोन", email: "ईमेल", category: "कैटेगरी",
    categories: { order: "ऑर्डर", proof: "प्रूफ", delivery: "डिलीवरी", replacement: "रिप्लेसमेंट", general: "सामान्य" },
    subject: "विषय", message: "मैसेज", submitting: "सबमिट हो रहा है…", submit: "सपोर्ट टिकट बनाएँ →",
    created: "टिकट {ticket} बन गया.", error: "सपोर्ट टिकट नहीं बनाया जा सका.",
  },
  mr: {
    name: "नाव", phone: "फोन", email: "ईमेल", category: "कॅटेगरी",
    categories: { order: "ऑर्डर", proof: "प्रूफ", delivery: "डिलिव्हरी", replacement: "रिप्लेसमेंट", general: "सामान्य" },
    subject: "विषय", message: "मेसेज", submitting: "सबमिट होत आहे…", submit: "सपोर्ट तिकीट तयार करा →",
    created: "तिकीट {ticket} तयार झाले.", error: "सपोर्ट तिकीट तयार करता आले नाही.",
  },
} as const;

export function SupportForm({ lang = "en" }: { lang?: UiLanguage }) {
  const t = copy[lang];
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");

    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(
      ["name", "mobile", "email", "category", "subject", "message"].map(
        (key) => [key, String(fd.get(key) || "")],
      ),
    );

    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();

    setStatus(
      response.ok
        ? t.created.replace("{ticket}", result.ticketNo)
        : result.error || t.error,
    );
    setBusy(false);
  }

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="checkout-fields">
        <label>
          {t.name}
          <input name="name" required />
        </label>
        <label>
          {t.phone}
          <input name="mobile" required />
        </label>
        <label>
          {t.email}
          <input name="email" type="email" />
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
        <label className="full">
          {t.subject}
          <input name="subject" required />
        </label>
        <label className="full">
          {t.message}
          <textarea name="message" rows={5} required />
        </label>
      </div>

      <button className="button" disabled={busy}>
        {busy ? t.submitting : t.submit}
      </button>
      {status && <p role="status">{status}</p>}
    </form>
  );
}
