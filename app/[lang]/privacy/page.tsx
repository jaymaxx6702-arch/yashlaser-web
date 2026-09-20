import { notFound } from "next/navigation";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    title: "Your details & artwork",
    paragraphs: [
      "Your customization draft can be saved on this browser for up to 24 hours so you can return to it. It is not uploaded until you submit an enabled online enquiry.",
      "We use the contact details, product choices and artwork you share to respond to your enquiry, prepare a mockup and arrange an approved order.",
      "Customer artwork is stored privately for the Yash Laser team and is not automatically added to a public gallery.",
      "Please avoid uploading identity documents or unnecessary personal information. For I-cards, discuss secure collection of staff or student data with our team.",
    ],
  },
  gu: {
    title: "તમારી વિગતો અને આર્ટવર્ક",
    paragraphs: [
      "તમારો કસ્ટમાઇઝેશન ડ્રાફ્ટ આ બ્રાઉઝરમાં મહત્તમ 24 કલાક માટે સેવ થઈ શકે છે. તમે સક્ષમ online enquiry સબમિટ કરો ત્યાં સુધી તે અમારા સર્વર પર અપલોડ થતો નથી.",
      "તમારી પૂછપરછનો જવાબ આપવા, મોકઅપ બનાવવા અને મંજૂર ઓર્ડર ગોઠવવા માટે તમે આપેલી સંપર્ક વિગતો, પ્રોડક્ટ પસંદગી અને આર્ટવર્કનો ઉપયોગ કરીએ છીએ.",
      "ગ્રાહક આર્ટવર્ક Yash Laser ટીમ માટે ખાનગી રીતે સ્ટોર થાય છે અને આપમેળે જાહેર ગેલેરીમાં ઉમેરાતું નથી.",
      "ઓળખ દસ્તાવેજો અથવા અનાવશ્યક વ્યક્તિગત માહિતી અપલોડ ન કરો. I-card માટે સ્ટાફ અથવા વિદ્યાર્થી ડેટાની સુરક્ષિત પ્રક્રિયા અમારી ટીમ સાથે નક્કી કરો.",
    ],
  },
  hi: {
    title: "आपकी जानकारी और आर्टवर्क",
    paragraphs: [
      "आपका कस्टमाइज़ेशन ड्राफ्ट इस ब्राउज़र में अधिकतम 24 घंटे तक सेव हो सकता है. सक्षम online enquiry सबमिट करने तक यह हमारे सर्वर पर अपलोड नहीं होता.",
      "आपकी पूछताछ का जवाब देने, मॉकअप तैयार करने और स्वीकृत ऑर्डर व्यवस्थित करने के लिए हम आपके संपर्क विवरण, प्रोडक्ट चयन और आर्टवर्क का उपयोग करते हैं.",
      "ग्राहक आर्टवर्क Yash Laser टीम के लिए निजी रूप से स्टोर होता है और अपने-आप सार्वजनिक गैलरी में नहीं जोड़ा जाता.",
      "पहचान दस्तावेज़ या अनावश्यक निजी जानकारी अपलोड न करें. I-card के लिए स्टाफ या छात्र डेटा की सुरक्षित प्रक्रिया हमारी टीम के साथ तय करें.",
    ],
  },
  mr: {
    title: "तुमची माहिती आणि आर्टवर्क",
    paragraphs: [
      "तुमचा कस्टमायझेशन ड्राफ्ट या ब्राउझरमध्ये कमाल 24 तास सेव्ह होऊ शकतो. सक्षम online enquiry सबमिट करेपर्यंत तो आमच्या सर्व्हरवर अपलोड होत नाही.",
      "तुमच्या चौकशीला उत्तर देण्यासाठी, मॉकअप तयार करण्यासाठी आणि मंजूर ऑर्डर व्यवस्थित करण्यासाठी आम्ही संपर्क तपशील, प्रॉडक्ट निवड आणि आर्टवर्क वापरतो.",
      "ग्राहक आर्टवर्क Yash Laser टीमसाठी खाजगी स्वरूपात साठवले जाते आणि आपोआप सार्वजनिक गॅलरीमध्ये जोडले जात नाही.",
      "ओळखपत्रांची कागदपत्रे किंवा अनावश्यक वैयक्तिक माहिती अपलोड करू नका. I-card साठी कर्मचारी किंवा विद्यार्थी डेटाची सुरक्षित प्रक्रिया आमच्या टीमसोबत ठरवा.",
    ],
  },
} as const;

export default async function LocalizedPrivacy({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const t = copy[lang];
  return (
    <main id="main-content" className="container text-page" lang={lang}>
      <h1>{t.title}</h1>
      {t.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <p>
        <a href="mailto:yashlaser@gmail.com">yashlaser@gmail.com</a> · +91 94270 80400
      </p>
    </main>
  );
}
