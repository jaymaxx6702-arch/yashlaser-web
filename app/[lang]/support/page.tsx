import { notFound } from "next/navigation";
import { SupportForm } from "@/components/SupportForm";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "Customer support", title: "How can we help?" },
  gu: { eyebrow: "ગ્રાહક સહાય", title: "અમે કેવી રીતે મદદ કરી શકીએ?" },
  hi: { eyebrow: "ग्राहक सहायता", title: "हम आपकी कैसे मदद कर सकते हैं?" },
  mr: { eyebrow: "ग्राहक मदत", title: "आम्ही कशी मदत करू शकतो?" },
} as const;

export default async function LocalizedSupportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const t = copy[lang];
  return (
    <main id="main-content" className="container section text-page" lang={lang}>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.title}</h1>
      <SupportForm lang={lang} />
    </main>
  );
}
