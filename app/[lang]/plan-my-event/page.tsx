import { notFound } from "next/navigation";
import { ProjectRequestForm } from "@/components/ProjectRequestForm";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "Awards · Medals · Gifts · Identity", title: "Plan products for your event.", text: "Tell us the date, people count, budget and requirement. We will turn it into a practical product plan and quotation." },
  gu: { eyebrow: "એવોર્ડ · મેડલ · ગિફ્ટ · ઓળખ", title: "તમારા ઇવેન્ટ માટે પ્રોડક્ટ્સ પ્લાન કરો.", text: "તારીખ, લોકોની સંખ્યા, બજેટ અને જરૂરિયાત જણાવો. અમે તેને વ્યવહારુ પ્રોડક્ટ પ્લાન અને ક્વોટેશનમાં ગોઠવીશું." },
  hi: { eyebrow: "अवॉर्ड · मेडल · गिफ्ट · पहचान", title: "अपने इवेंट के लिए प्रोडक्ट प्लान करें.", text: "तारीख, लोगों की संख्या, बजट और आवश्यकता बताएं. हम इसे व्यावहारिक प्रोडक्ट प्लान और कोटेशन में बदलेंगे." },
  mr: { eyebrow: "अवॉर्ड · मेडल · गिफ्ट · ओळख", title: "तुमच्या इव्हेंटसाठी प्रॉडक्ट प्लॅन करा.", text: "तारीख, लोकसंख्या, बजेट आणि गरज सांगा. आम्ही त्याचे व्यवहार्य प्रॉडक्ट प्लॅन आणि कोटेशन तयार करू." },
} as const;

export default async function LocalizedPlanEvent({
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
      <ProjectRequestForm kind="event" lang={lang} />
    </main>
  );
}
