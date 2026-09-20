import { notFound } from "next/navigation";
import { ProjectRequestForm } from "@/components/ProjectRequestForm";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "Schools · Corporate · Events", title: "Bulk orders, without the spreadsheet chaos.", text: "Share quantity, deadline and an optional Excel/CSV file. We review the data and confirm the quotation and proof before production." },
  gu: { eyebrow: "શાળા · કોર્પોરેટ · ઇવેન્ટ", title: "બલ્ક ઓર્ડર, વધુ ગૂંચવણ વગર.", text: "જથ્થો, સમયમર્યાદા અને જરૂરી હોય તો Excel/CSV ફાઇલ મોકલો. પ્રોડક્શન પહેલાં અમે ડેટા ચેક કરીને ક્વોટેશન અને પ્રૂફ કન્ફર્મ કરીએ છીએ." },
  hi: { eyebrow: "स्कूल · कॉर्पोरेट · इवेंट", title: "बल्क ऑर्डर, बिना अनावश्यक उलझन के.", text: "मात्रा, समयसीमा और चाहें तो Excel/CSV फ़ाइल भेजें. प्रोडक्शन से पहले हम डेटा की जांच करके कोटेशन और प्रूफ कन्फर्म करते हैं." },
  mr: { eyebrow: "शाळा · कॉर्पोरेट · इव्हेंट", title: "बल्क ऑर्डर, अनावश्यक गोंधळाशिवाय.", text: "प्रमाण, अंतिम तारीख आणि आवश्यक असल्यास Excel/CSV फाइल पाठवा. प्रॉडक्शनपूर्वी आम्ही डेटा तपासून कोटेशन आणि प्रूफ निश्चित करतो." },
} as const;

export default async function LocalizedBulkOrders({
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
      <ProjectRequestForm kind="bulk" lang={lang} />
    </main>
  );
}
