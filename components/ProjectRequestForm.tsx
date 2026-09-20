"use client";
import { useState, type FormEvent } from "react";
import { uploadPrivate } from "@/lib/direct-upload";
import { business, whatsappUrl } from "@/data/business";
import type { UiLanguage } from "@/lib/i18n";

type Kind = "bulk" | "event" | "custom_acrylic";

const copy = {
  en: {
    titles: { bulk: "Bulk order request", event: "Plan my event", custom_acrylic: "Custom acrylic request" },
    name: "Your name", phone: "WhatsApp / phone", email: "Email (optional)", product: "Product / requirement",
    quantity: "Quantity", requiredDate: "Required date", eventType: "Event type", eventDate: "Event date",
    participants: "Approx. participants / quantity", budget: "Budget (optional)", size: "Approx. size",
    notes: "Requirement / notes", file: "File (optional)", fileHelp: "PDF, Excel/CSV or image · max 20 MB",
    submitting: "Submitting…", submit: "Submit request →", saved: "Request saved.", savedFile: "Request and file saved.",
    unable: "Unable to save request.", uploadPrepare: "Unable to prepare file upload.", uploadConfirm: "Unable to confirm file.",
    reference: "Reference", whatsapp: "Continue on WhatsApp ↗",
  },
  gu: {
    titles: { bulk: "બલ્ક ઓર્ડર રિક્વેસ્ટ", event: "મારો ઇવેન્ટ પ્લાન", custom_acrylic: "કસ્ટમ એક્રેલિક રિક્વેસ્ટ" },
    name: "તમારું નામ", phone: "WhatsApp / ફોન", email: "ઈમેલ (વૈકલ્પિક)", product: "પ્રોડક્ટ / જરૂરિયાત",
    quantity: "જથ્થો", requiredDate: "જરૂરી તારીખ", eventType: "ઇવેન્ટ પ્રકાર", eventDate: "ઇવેન્ટ તારીખ",
    participants: "અંદાજિત લોકો / જથ્થો", budget: "બજેટ (વૈકલ્પિક)", size: "અંદાજિત સાઇઝ",
    notes: "જરૂરિયાત / નોંધ", file: "ફાઇલ (વૈકલ્પિક)", fileHelp: "PDF, Excel/CSV અથવા image · મહત્તમ 20 MB",
    submitting: "સબમિટ થઈ રહ્યું છે…", submit: "રિક્વેસ્ટ સબમિટ કરો →", saved: "રિક્વેસ્ટ સેવ થઈ.", savedFile: "રિક્વેસ્ટ અને ફાઇલ સેવ થઈ.",
    unable: "રિક્વેસ્ટ સેવ થઈ શકી નથી.", uploadPrepare: "ફાઇલ અપલોડ તૈયાર થઈ શક્યો નથી.", uploadConfirm: "ફાઇલ કન્ફર્મ થઈ શકી નથી.",
    reference: "રેફરન્સ", whatsapp: "WhatsApp પર આગળ વધો ↗",
  },
  hi: {
    titles: { bulk: "बल्क ऑर्डर रिक्वेस्ट", event: "मेरा इवेंट प्लान", custom_acrylic: "कस्टम ऐक्रेलिक रिक्वेस्ट" },
    name: "आपका नाम", phone: "WhatsApp / फोन", email: "ईमेल (वैकल्पिक)", product: "प्रोडक्ट / आवश्यकता",
    quantity: "मात्रा", requiredDate: "आवश्यक तारीख", eventType: "इवेंट प्रकार", eventDate: "इवेंट तारीख",
    participants: "अनुमानित लोग / मात्रा", budget: "बजट (वैकल्पिक)", size: "अनुमानित साइज़",
    notes: "आवश्यकता / नोट्स", file: "फ़ाइल (वैकल्पिक)", fileHelp: "PDF, Excel/CSV या image · अधिकतम 20 MB",
    submitting: "सबमिट हो रहा है…", submit: "रिक्वेस्ट सबमिट करें →", saved: "रिक्वेस्ट सेव हुई.", savedFile: "रिक्वेस्ट और फ़ाइल सेव हुई.",
    unable: "रिक्वेस्ट सेव नहीं हो सकी.", uploadPrepare: "फ़ाइल अपलोड तैयार नहीं हो सका.", uploadConfirm: "फ़ाइल कन्फर्म नहीं हो सकी.",
    reference: "रेफरेंस", whatsapp: "WhatsApp पर आगे बढ़ें ↗",
  },
  mr: {
    titles: { bulk: "बल्क ऑर्डर रिक्वेस्ट", event: "माझा इव्हेंट प्लॅन", custom_acrylic: "कस्टम अॅक्रिलिक रिक्वेस्ट" },
    name: "तुमचे नाव", phone: "WhatsApp / फोन", email: "ईमेल (पर्यायी)", product: "प्रॉडक्ट / गरज",
    quantity: "प्रमाण", requiredDate: "आवश्यक तारीख", eventType: "इव्हेंट प्रकार", eventDate: "इव्हेंट तारीख",
    participants: "अंदाजे लोक / प्रमाण", budget: "बजेट (पर्यायी)", size: "अंदाजे साइझ",
    notes: "गरज / नोट्स", file: "फाइल (पर्यायी)", fileHelp: "PDF, Excel/CSV किंवा image · कमाल 20 MB",
    submitting: "सबमिट होत आहे…", submit: "रिक्वेस्ट सबमिट करा →", saved: "रिक्वेस्ट सेव्ह झाली.", savedFile: "रिक्वेस्ट आणि फाइल सेव्ह झाली.",
    unable: "रिक्वेस्ट सेव्ह करता आली नाही.", uploadPrepare: "फाइल अपलोड तयार करता आला नाही.", uploadConfirm: "फाइल निश्चित करता आली नाही.",
    reference: "रेफरन्स", whatsapp: "WhatsApp वर पुढे जा ↗",
  },
} as const;

export function ProjectRequestForm({
  kind,
  lang = "en",
}: {
  kind: Kind;
  lang?: UiLanguage;
}) {
  const t = copy[lang];
  const [result, setResult] = useState<{ requestNo: string; token: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const fd = new FormData(e.currentTarget);
      const customer = {
        name: String(fd.get("name") || ""),
        mobile: String(fd.get("mobile") || ""),
        email: String(fd.get("email") || ""),
      };
      const payload = Object.fromEntries(
        Array.from(fd.entries())
          .filter(([key]) => !["name", "mobile", "email", "file"].includes(key))
          .map(([key, value]) => [key, String(value).slice(0, 3000)]),
      );

      const response = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestType: kind, customer, payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.unable);
      setResult(data);
      setStatus(t.saved);

      if (file) {
        const sessionResponse = await fetch(
          "/api/project-requests/" + encodeURIComponent(data.requestNo) + "/upload-session",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              token: data.token,
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
            }),
          },
        );
        const session = await sessionResponse.json();
        if (!sessionResponse.ok)
          throw new Error(session.error || t.uploadPrepare);

        await uploadPrivate({ path: session.path, url: session.url }, file);

        const confirm = await fetch(
          "/api/project-requests/" + encodeURIComponent(data.requestNo) + "/files",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              token: data.token,
              path: session.path,
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
            }),
          },
        );
        const confirmed = await confirm.json();
        if (!confirm.ok)
          throw new Error(confirmed.error || t.uploadConfirm);
        setStatus(t.savedFile);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t.unable);
    } finally {
      setBusy(false);
    }
  }

  const title = t.titles[kind];

  return (
    <form className="project-form" onSubmit={submit}>
      <h2>{title}</h2>
      <div className="checkout-fields">
        <label>
          {t.name}
          <input name="name" required minLength={2} maxLength={80} />
        </label>
        <label>
          {t.phone}
          <input name="mobile" required minLength={10} maxLength={20} />
        </label>
        <label>
          {t.email}
          <input name="email" type="email" maxLength={160} />
        </label>

        {kind === "bulk" && (
          <>
            <label>
              {t.product}
              <input name="product" required maxLength={160} />
            </label>
            <label>
              {t.quantity}
              <input name="quantity" type="number" min={1} max={100000} required />
            </label>
            <label>
              {t.requiredDate}
              <input name="requiredDate" type="date" />
            </label>
          </>
        )}

        {kind === "event" && (
          <>
            <label>
              {t.eventType}
              <input name="eventType" required maxLength={120} />
            </label>
            <label>
              {t.eventDate}
              <input name="eventDate" type="date" required />
            </label>
            <label>
              {t.participants}
              <input name="quantity" type="number" min={1} max={100000} />
            </label>
            <label>
              {t.budget}
              <input name="budget" inputMode="numeric" maxLength={20} />
            </label>
          </>
        )}

        {kind === "custom_acrylic" && (
          <>
            <label>
              {t.size}
              <input name="size" maxLength={120} />
            </label>
            <label>
              {t.quantity}
              <input name="quantity" type="number" min={1} max={10000} required />
            </label>
            <label>
              {t.requiredDate}
              <input name="requiredDate" type="date" />
            </label>
            <label>
              {t.budget}
              <input name="budget" inputMode="numeric" maxLength={20} />
            </label>
          </>
        )}

        <label className="full">
          {t.notes}
          <textarea name="notes" rows={5} required maxLength={3000} />
        </label>

        <label className="full">
          {t.file}
          <input
            name="file"
            type="file"
            accept=".pdf,.csv,.xls,.xlsx,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <small>{t.fileHelp}</small>
        </label>
      </div>

      <button className="button" disabled={busy}>
        {busy ? t.submitting : t.submit}
      </button>

      {status && <p role="status">{status}</p>}

      {result && (
        <div className="request-success">
          <p>
            {t.reference}: <strong>{result.requestNo}</strong>
          </p>
          <a
            className="text-link"
            href={whatsappUrl(
              "Hello Yash Laser, my " +
                title +
                " reference is " +
                result.requestNo +
                ". Please help me with the next step. " +
                business.url,
            )}
            target="_blank"
            rel="noreferrer"
          >
            {t.whatsapp}
          </a>
        </div>
      )}
    </form>
  );
}
