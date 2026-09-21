import { notFound } from "next/navigation";
import { business, whatsappUrl } from "@/data/business";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "Established 1997", title: "Let’s make it personal.", whatsapp: "Enquire on WhatsApp ↗", process: "From your idea to your doorstep", steps: ["Browse a product and share your requirements.", "Discuss the price, personalisation and delivery on WhatsApp.", "Approve your digital mockup before production.", "We confirm production and delivery arrangements with you."], note: "Submitting an enquiry does not place a paid order. Prices, timing and delivery are confirmed directly with our team.", message: "Hello Yash Laser, I would like to discuss a customised product." },
  gu: { eyebrow: "સ્થાપના 1997", title: "ચાલો તેને વ્યક્તિગત બનાવીએ.", whatsapp: "WhatsApp પર પૂછપરછ કરો ↗", process: "તમારા વિચારથી તમારા દરવાજા સુધી", steps: ["પ્રોડક્ટ પસંદ કરો અને તમારી જરૂરિયાત જણાવો.", "ભાવ, કસ્ટમાઇઝેશન અને ડિલિવરી WhatsApp પર ચર્ચો.", "પ્રોડક્શન પહેલાં ડિજિટલ મોકઅપ મંજૂર કરો.", "અમે પ્રોડક્શન અને ડિલિવરીની વ્યવસ્થા કન્ફર્મ કરીએ છીએ."], note: "પૂછપરછ મોકલવાથી પેઇડ ઓર્ડર થતો નથી. ભાવ, સમય અને ડિલિવરી અમારી ટીમ સાથે સીધી રીતે કન્ફર્મ થાય છે.", message: "નમસ્તે Yash Laser, મને કસ્ટમ પ્રોડક્ટ અંગે વાત કરવી છે." },
  hi: { eyebrow: "स्थापित 1997", title: "इसे व्यक्तिगत बनाएं.", whatsapp: "WhatsApp पर पूछताछ करें ↗", process: "आपके आइडिया से आपके दरवाज़े तक", steps: ["प्रोडक्ट चुनें और अपनी आवश्यकता बताएं.", "कीमत, कस्टमाइज़ेशन और डिलीवरी पर WhatsApp में चर्चा करें.", "प्रोडक्शन से पहले डिजिटल मॉकअप मंज़ूर करें.", "हम प्रोडक्शन और डिलीवरी व्यवस्था कन्फर्म करते हैं."], note: "पूछताछ भेजने से पेड ऑर्डर नहीं बनता. कीमत, समय और डिलीवरी हमारी टीम के साथ सीधे कन्फर्म होते हैं.", message: "नमस्ते Yash Laser, मुझे कस्टम प्रोडक्ट के बारे में बात करनी है." },
  mr: { eyebrow: "स्थापना 1997", title: "चला ते वैयक्तिक बनवूया.", whatsapp: "WhatsApp वर चौकशी करा ↗", process: "तुमच्या कल्पनेपासून तुमच्या दारापर्यंत", steps: ["प्रॉडक्ट निवडा आणि गरज सांगा.", "किंमत, कस्टमायझेशन आणि डिलिव्हरीबद्दल WhatsApp वर चर्चा करा.", "प्रॉडक्शनपूर्वी डिजिटल मॉकअप मंजूर करा.", "आम्ही प्रॉडक्शन आणि डिलिव्हरी व्यवस्था निश्चित करतो."], note: "चौकशी पाठवल्याने पेड ऑर्डर तयार होत नाही. किंमत, वेळ आणि डिलिव्हरी आमच्या टीमसोबत थेट निश्चित होतात.", message: "नमस्कार Yash Laser, मला कस्टम प्रॉडक्टबद्दल चर्चा करायची आहे." },
} as const;

export default async function LocalizedContact({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const t = copy[lang];
  return (
    <main id="main-content" className="container text-page" lang={lang}>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.title}</h1>
      <p>{business.address}</p>
      <p>
        <a href="tel:+919427080400">{business.phone}</a> ·{" "}
        <a href="tel:+919427494264">{business.alternate}</a>
        <br />
        <a href={"mailto:" + business.email}>{business.email}</a>
      </p>
      <a className="button" href={whatsappUrl(t.message)} target="_blank" rel="noopener noreferrer">
        {t.whatsapp}
      </a>
      <h2>{t.process}</h2>
      <ol className="process-steps">
        {t.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <p>{t.note}</p>
    </main>
  );
}
