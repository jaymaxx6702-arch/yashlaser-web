"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { UiLanguage } from "@/lib/i18n";

type TicketResult = {
  ticketNo: string;
  status: string;
  category: string;
  subject: string;
  message: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  orderLinked: boolean;
};

const copy = {
  en: {
    eyebrow: "Support ticket",
    title: "Check your support request.",
    help: "Use the ticket number and secure token from your support confirmation.",
    ticketNo: "Ticket number",
    token: "Secure token",
    button: "Check ticket →",
    checking: "Checking…",
    request: "Your request",
    response: "Yash Laser response",
    waiting: "Our team has not posted a response yet.",
    linked: "Linked to verified order",
    general: "General support request",
    created: "Created",
    responded: "Responded",
    error: "Unable to load support ticket.",
    statuses: {
      open: "Open",
      in_progress: "In progress",
      resolved: "Resolved",
      closed: "Closed",
    },
  },
  gu: {
    eyebrow: "સપોર્ટ ટિકિટ",
    title: "તમારી સપોર્ટ રિક્વેસ્ટ ચેક કરો.",
    help: "Support confirmationમાં મળેલો ticket number અને secure token વાપરો.",
    ticketNo: "ટિકિટ નંબર",
    token: "સિક્યોર ટોકન",
    button: "ટિકિટ ચેક કરો →",
    checking: "ચેક થઈ રહ્યું છે…",
    request: "તમારી રિક્વેસ્ટ",
    response: "Yash Laserનો જવાબ",
    waiting: "અમારી ટીમે હજી જવાબ મૂક્યો નથી.",
    linked: "Verified order સાથે linked",
    general: "સામાન્ય સપોર્ટ રિક્વેસ્ટ",
    created: "બનાવ્યું",
    responded: "જવાબ આપ્યો",
    error: "સપોર્ટ ટિકિટ લોડ થઈ શકી નથી.",
    statuses: {
      open: "ઓપન",
      in_progress: "કામ ચાલુ",
      resolved: "ઉકેલાયું",
      closed: "બંધ",
    },
  },
  hi: {
    eyebrow: "सपोर्ट टिकट",
    title: "अपनी सपोर्ट रिक्वेस्ट देखें.",
    help: "Support confirmation में मिला ticket number और secure token उपयोग करें.",
    ticketNo: "टिकट नंबर",
    token: "सिक्योर टोकन",
    button: "टिकट देखें →",
    checking: "जांच हो रही है…",
    request: "आपकी रिक्वेस्ट",
    response: "Yash Laser का जवाब",
    waiting: "हमारी टीम ने अभी जवाब पोस्ट नहीं किया है.",
    linked: "Verified order से linked",
    general: "सामान्य सपोर्ट रिक्वेस्ट",
    created: "बनाया गया",
    responded: "जवाब दिया",
    error: "सपोर्ट टिकट लोड नहीं हो सका.",
    statuses: {
      open: "ओपन",
      in_progress: "काम जारी",
      resolved: "समाधान हुआ",
      closed: "बंद",
    },
  },
  mr: {
    eyebrow: "सपोर्ट तिकीट",
    title: "तुमची सपोर्ट रिक्वेस्ट तपासा.",
    help: "Support confirmationमध्ये मिळालेला ticket number आणि secure token वापरा.",
    ticketNo: "तिकीट नंबर",
    token: "सिक्योर टोकन",
    button: "तिकीट तपासा →",
    checking: "तपासत आहे…",
    request: "तुमची रिक्वेस्ट",
    response: "Yash Laser चे उत्तर",
    waiting: "आमच्या टीमने अजून उत्तर पोस्ट केलेले नाही.",
    linked: "Verified order सोबत linked",
    general: "सामान्य सपोर्ट रिक्वेस्ट",
    created: "तयार केले",
    responded: "उत्तर दिले",
    error: "सपोर्ट तिकीट लोड करता आले नाही.",
    statuses: {
      open: "ओपन",
      in_progress: "काम सुरू",
      resolved: "निकाली",
      closed: "बंद",
    },
  },
} as const;

function dateTime(value: string | null, lang: UiLanguage) {
  if (!value) return "";
  const locale =
    lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
  return new Date(value).toLocaleString(locale, {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SupportTicketClient({
  lang = "en",
  initialTicketNo = "",
  initialToken = "",
}: {
  lang?: UiLanguage;
  initialTicketNo?: string;
  initialToken?: string;
}) {
  const t = copy[lang];
  const [ticketNo, setTicketNo] = useState(initialTicketNo);
  const [token, setToken] = useState(initialToken);
  const [result, setResult] = useState<TicketResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(
        "/api/support/" +
          encodeURIComponent(ticketNo.trim()) +
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
    if (!initialTicketNo || !initialToken) return;
    const timer = window.setTimeout(() => void lookup(), 0);
    return () => window.clearTimeout(timer);
    // Initial secure-link lookup only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = result
    ? t.statuses[result.status as keyof typeof t.statuses] || result.status.replaceAll("_", " ")
    : "";

  return (
    <div className="tracking-layout">
      <form className="tracking-form" onSubmit={lookup}>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="muted">{t.help}</p>
        <label>
          {t.ticketNo}
          <input
            value={ticketNo}
            onChange={(e) => setTicketNo(e.target.value)}
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
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>

      {result && (
        <section className="tracking-result">
          <p className="eyebrow">{result.ticketNo}</p>
          <h2>{statusLabel}</h2>
          <p>{result.orderLinked ? t.linked : t.general}</p>
          <p><strong>{result.subject}</strong></p>
          <p>{t.created}: {dateTime(result.createdAt, lang)}</p>

          <h3>{t.request}</h3>
          <p>{result.message}</p>

          <h3>{t.response}</h3>
          {result.adminResponse ? (
            <>
              <p>{result.adminResponse}</p>
              {result.respondedAt && (
                <small>{t.responded}: {dateTime(result.respondedAt, lang)}</small>
              )}
            </>
          ) : (
            <p className="muted">{t.waiting}</p>
          )}
        </section>
      )}
    </div>
  );
}
