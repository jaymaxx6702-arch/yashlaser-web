"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { UiLanguage } from "@/lib/i18n";

type ProjectResult = {
  requestNo: string;
  requestType: string;
  status: string;
  payload: Record<string, unknown>;
  customerMessage: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  quote: null | {
    quoteNo: string;
    status: string;
    totalMinor: number | null;
    validUntil: string | null;
  };
};

const copy = {
  en: {
    eyebrow: "Project request",
    title: "Check your request status.",
    help: "Use the request number and secure token from your confirmation.",
    requestNo: "Request number",
    token: "Secure token",
    button: "Check request →",
    checking: "Checking…",
    details: "Request details",
    message: "Yash Laser update",
    waiting: "Our team has not posted an update yet.",
    quote: "Quotation",
    total: "Total",
    validUntil: "Valid until",
    created: "Created",
    updated: "Updated",
    error: "Unable to load project request.",
    types: {
      bulk: "Bulk order",
      event: "Event planning",
      custom_acrylic: "Custom acrylic",
    },
    statuses: {
      new: "New",
      reviewing: "Reviewing",
      quoted: "Quoted",
      accepted: "Accepted",
      closed: "Closed",
      cancelled: "Cancelled",
    },
  },
  gu: {
    eyebrow: "પ્રોજેક્ટ રિક્વેસ્ટ",
    title: "તમારી રિક્વેસ્ટની સ્થિતિ ચેક કરો.",
    help: "Confirmationમાં મળેલો request number અને secure token વાપરો.",
    requestNo: "રિક્વેસ્ટ નંબર",
    token: "સિક્યોર ટોકન",
    button: "રિક્વેસ્ટ ચેક કરો →",
    checking: "ચેક થઈ રહ્યું છે…",
    details: "રિક્વેસ્ટ વિગતો",
    message: "Yash Laser અપડેટ",
    waiting: "અમારી ટીમે હજી કોઈ અપડેટ મૂક્યું નથી.",
    quote: "ક્વોટેશન",
    total: "કુલ",
    validUntil: "માન્ય તારીખ",
    created: "બનાવ્યું",
    updated: "અપડેટ",
    error: "પ્રોજેક્ટ રિક્વેસ્ટ લોડ થઈ શકી નથી.",
    types: {
      bulk: "બલ્ક ઓર્ડર",
      event: "ઇવેન્ટ પ્લાનિંગ",
      custom_acrylic: "કસ્ટમ એક્રેલિક",
    },
    statuses: {
      new: "નવી",
      reviewing: "રિવ્યૂમાં",
      quoted: "ક્વોટ આપ્યો",
      accepted: "સ્વીકાર્યું",
      closed: "બંધ",
      cancelled: "રદ",
    },
  },
  hi: {
    eyebrow: "प्रोजेक्ट रिक्वेस्ट",
    title: "अपनी रिक्वेस्ट की स्थिति देखें.",
    help: "Confirmation में मिला request number और secure token उपयोग करें.",
    requestNo: "रिक्वेस्ट नंबर",
    token: "सिक्योर टोकन",
    button: "रिक्वेस्ट देखें →",
    checking: "जांच हो रही है…",
    details: "रिक्वेस्ट विवरण",
    message: "Yash Laser अपडेट",
    waiting: "हमारी टीम ने अभी कोई अपडेट पोस्ट नहीं किया है.",
    quote: "कोटेशन",
    total: "कुल",
    validUntil: "मान्य तिथि",
    created: "बनाया गया",
    updated: "अपडेट",
    error: "प्रोजेक्ट रिक्वेस्ट लोड नहीं हो सकी.",
    types: {
      bulk: "बल्क ऑर्डर",
      event: "इवेंट प्लानिंग",
      custom_acrylic: "कस्टम ऐक्रेलिक",
    },
    statuses: {
      new: "नई",
      reviewing: "रिव्यू में",
      quoted: "कोट दिया",
      accepted: "स्वीकृत",
      closed: "बंद",
      cancelled: "रद्द",
    },
  },
  mr: {
    eyebrow: "प्रोजेक्ट रिक्वेस्ट",
    title: "तुमच्या रिक्वेस्टची स्थिती तपासा.",
    help: "Confirmationमध्ये मिळालेला request number आणि secure token वापरा.",
    requestNo: "रिक्वेस्ट नंबर",
    token: "सिक्योर टोकन",
    button: "रिक्वेस्ट तपासा →",
    checking: "तपासत आहे…",
    details: "रिक्वेस्ट तपशील",
    message: "Yash Laser अपडेट",
    waiting: "आमच्या टीमने अजून कोणतेही अपडेट पोस्ट केलेले नाही.",
    quote: "कोटेशन",
    total: "एकूण",
    validUntil: "वैध तारीख",
    created: "तयार केले",
    updated: "अपडेट",
    error: "प्रोजेक्ट रिक्वेस्ट लोड करता आली नाही.",
    types: {
      bulk: "बल्क ऑर्डर",
      event: "इव्हेंट प्लॅनिंग",
      custom_acrylic: "कस्टम अॅक्रिलिक",
    },
    statuses: {
      new: "नवीन",
      reviewing: "रिव्ह्यूमध्ये",
      quoted: "कोट दिला",
      accepted: "स्वीकारले",
      closed: "बंद",
      cancelled: "रद्द",
    },
  },
} as const;

function dateTime(value: string | null, lang: UiLanguage) {
  if (!value) return "";
  const locale =
    lang === "gu"
      ? "gu-IN"
      : lang === "hi"
        ? "hi-IN"
        : lang === "mr"
          ? "mr-IN"
          : "en-IN";
  return new Date(value).toLocaleString(locale, {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function money(value: number, lang: UiLanguage) {
  const locale =
    lang === "gu"
      ? "gu-IN"
      : lang === "hi"
        ? "hi-IN"
        : lang === "mr"
          ? "mr-IN"
          : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
  }).format(value / 100);
}

export function ProjectRequestStatusClient({
  lang = "en",
  initialRequestNo = "",
  initialToken = "",
}: {
  lang?: UiLanguage;
  initialRequestNo?: string;
  initialToken?: string;
}) {
  const t = copy[lang];
  const [requestNo, setRequestNo] = useState(initialRequestNo);
  const [token, setToken] = useState(initialToken);
  const [result, setResult] = useState<ProjectResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "/api/project-requests/" +
          encodeURIComponent(requestNo.trim()) +
          "?token=" +
          encodeURIComponent(token.trim()),
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!initialRequestNo || !initialToken) return;
    const timer = window.setTimeout(() => void lookup(), 0);
    return () => window.clearTimeout(timer);
    // Initial secure-link lookup only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestType = result
    ? t.types[result.requestType as keyof typeof t.types] || result.requestType
    : "";
  const statusLabel = result
    ? t.statuses[result.status as keyof typeof t.statuses] ||
      result.status.replaceAll("_", " ")
    : "";

  return (
    <div className="tracking-layout">
      <form className="tracking-form" onSubmit={lookup}>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="muted">{t.help}</p>
        <label>
          {t.requestNo}
          <input
            value={requestNo}
            onChange={(e) => setRequestNo(e.target.value)}
            required
            maxLength={40}
          />
        </label>
        <label>
          {t.token}
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            minLength={20}
            maxLength={100}
          />
        </label>
        <button className="button" disabled={busy}>
          {busy ? t.checking : t.button}
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section className="tracking-result">
          <p className="eyebrow">{result.requestNo}</p>
          <h2>{statusLabel}</h2>
          <p>{requestType}</p>
          <p>
            {t.created}: {dateTime(result.createdAt, lang)}
            <br />
            {t.updated}: {dateTime(result.updatedAt, lang)}
          </p>

          <h3>{t.details}</h3>
          <dl>
            {Object.entries(result.payload || {}).map(([key, value]) => (
              <div key={key} className="summary-row">
                <dt>{key.replaceAll("_", " ")}</dt>
                <dd>{String(value || "—")}</dd>
              </div>
            ))}
          </dl>

          <h3>{t.message}</h3>
          {result.customerMessage ? (
            <p>{result.customerMessage}</p>
          ) : (
            <p className="muted">{t.waiting}</p>
          )}

          {result.quote && (
            <>
              <h3>{t.quote}</h3>
              <p>
                <strong>{result.quote.quoteNo}</strong> · {result.quote.status}
              </p>
              {result.quote.totalMinor != null && (
                <p>
                  {t.total}: {money(result.quote.totalMinor, lang)}
                </p>
              )}
              {result.quote.validUntil && (
                <p>
                  {t.validUntil}: {result.quote.validUntil}
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
