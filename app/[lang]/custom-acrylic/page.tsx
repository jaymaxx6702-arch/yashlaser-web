import { notFound } from "next/navigation";
import { ProjectRequestForm } from "@/components/ProjectRequestForm";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "Upload your idea", title: "Custom acrylic, reviewed before we promise it.", text: "Share the idea, approximate size, quantity and reference file. Feasibility, final dimensions, price and timing are confirmed after review." },
  gu: { eyebrow: "તમારો વિચાર મોકલો", title: "કસ્ટમ એક્રેલિક — વચન આપતા પહેલાં સંપૂર્ણ સમીક્ષા.", text: "વિચાર, અંદાજિત સાઇઝ, જથ્થો અને રેફરન્સ ફાઇલ મોકલો. સમીક્ષા પછી શક્યતા, અંતિમ માપ, ભાવ અને સમય કન્ફર્મ કરવામાં આવશે." },
  hi: { eyebrow: "अपना आइडिया भेजें", title: "कस्टम ऐक्रेलिक — वादा करने से पहले पूरी समीक्षा.", text: "आइडिया, अनुमानित साइज़, मात्रा और रेफरेंस फ़ाइल भेजें. समीक्षा के बाद व्यवहार्यता, अंतिम माप, कीमत और समय कन्फर्म किया जाएगा." },
  mr: { eyebrow: "तुमची कल्पना पाठवा", title: "कस्टम अॅक्रिलिक — वचन देण्यापूर्वी संपूर्ण तपासणी.", text: "कल्पना, अंदाजे साइझ, प्रमाण आणि रेफरन्स फाइल पाठवा. तपासणीनंतर शक्यता, अंतिम माप, किंमत आणि वेळ निश्चित केली जाईल." },
} as const;

export default async function LocalizedCustomAcrylic({
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
      <p>{t.text}</p>
      <ProjectRequestForm kind="custom_acrylic" lang={lang} />
    </main>
  );
}
