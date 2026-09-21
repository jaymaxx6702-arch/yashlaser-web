"use client";
import { useState, type FormEvent } from "react";
import type { UiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    title: "Add an existing guest order",
    help: "Use the order number and secure token from the original tracking link.",
    order: "Order number",
    token: "Secure token",
    adding: "Adding…",
    button: "Add order to account",
    success: "Order added to your account. Refresh to see it.",
    error: "Unable to add order.",
  },
  gu: {
    title: "જૂનો ગેસ્ટ ઓર્ડર એકાઉન્ટમાં ઉમેરો",
    help: "મૂળ ટ્રેકિંગ લિંકમાં આપેલો ઓર્ડર નંબર અને સુરક્ષિત ટોકન વાપરો.",
    order: "ઓર્ડર નંબર",
    token: "સુરક્ષિત ટોકન",
    adding: "ઉમેરાઈ રહ્યું છે…",
    button: "ઓર્ડર એકાઉન્ટમાં ઉમેરો",
    success: "ઓર્ડર તમારા એકાઉન્ટમાં ઉમેરાયો. જોવા માટે પેજ રિફ્રેશ કરો.",
    error: "ઓર્ડર ઉમેરાઈ શક્યો નથી.",
  },
  hi: {
    title: "पुराना गेस्ट ऑर्डर अकाउंट में जोड़ें",
    help: "मूल ट्रैकिंग लिंक में दिए गए ऑर्डर नंबर और सुरक्षित टोकन का उपयोग करें.",
    order: "ऑर्डर नंबर",
    token: "सुरक्षित टोकन",
    adding: "जोड़ा जा रहा है…",
    button: "ऑर्डर अकाउंट में जोड़ें",
    success: "ऑर्डर आपके अकाउंट में जुड़ गया. देखने के लिए पेज रिफ्रेश करें.",
    error: "ऑर्डर नहीं जोड़ा जा सका.",
  },
  mr: {
    title: "जुना गेस्ट ऑर्डर अकाउंटमध्ये जोडा",
    help: "मूळ ट्रॅकिंग लिंकमधील ऑर्डर नंबर आणि सुरक्षित टोकन वापरा.",
    order: "ऑर्डर नंबर",
    token: "सुरक्षित टोकन",
    adding: "जोडत आहे…",
    button: "ऑर्डर अकाउंटमध्ये जोडा",
    success: "ऑर्डर तुमच्या अकाउंटमध्ये जोडला. पाहण्यासाठी पेज रिफ्रेश करा.",
    error: "ऑर्डर जोडता आला नाही.",
  },
} as const;

export function ClaimOrderForm({ lang = "en" }: { lang?: UiLanguage }) {
  const t = copy[lang];
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);

    const response = await fetch("/api/account/claim-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderNo: String(fd.get("orderNo") || ""),
        token: String(fd.get("token") || ""),
      }),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? t.success
        : result.error || t.error,
    );
    setBusy(false);
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>{t.title}</h2>
      <p>{t.help}</p>
      <label>
        {t.order}
        <input name="orderNo" required maxLength={40} />
      </label>
      <label>
        {t.token}
        <input name="token" required minLength={20} maxLength={100} />
      </label>
      <button className="button" disabled={busy}>
        {busy ? t.adding : t.button}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
