import Link from "next/link";
import { notFound } from "next/navigation";
import { SupportForm } from "@/components/SupportForm";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "Customer support", title: "How can we help?", existing: "Already opened a ticket?", track: "Track support ticket ↗" },
  gu: { eyebrow: "ગ્રાહક સહાય", title: "અમે કેવી રીતે મદદ કરી શકીએ?", existing: "પહેલેથી ટિકિટ બનાવી છે?", track: "સપોર્ટ ટિકિટ ટ્રેક કરો ↗" },
  hi: { eyebrow: "ग्राहक सहायता", title: "हम आपकी कैसे मदद कर सकते हैं?", existing: "पहले से टिकट बनाया है?", track: "सपोर्ट टिकट ट्रैक करें ↗" },
  mr: { eyebrow: "ग्राहक मदत", title: "आम्ही कशी मदत करू शकतो?", existing: "आधीच तिकीट तयार केले आहे?", track: "सपोर्ट तिकीट ट्रॅक करा ↗" },
} as const;

export default async function LocalizedSupportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const t = copy[lang];
  const prefix = "/" + lang;
  return (
    <main id="main-content" className="container section text-page" lang={lang}>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.title}</h1>
      <p>
        {t.existing}{" "}
        <Link className="text-link" href={prefix + "/support/ticket"}>
          {t.track}
        </Link>
      </p>
      <SupportForm lang={lang} />
    </main>
  );
}
