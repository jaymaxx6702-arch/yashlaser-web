"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/data/catalog";
import { business, whatsappUrl } from "@/data/business";
import { Brand } from "./Brand";
import { categoryCopy, isUiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    intro: "For the moments, milestones and names that deserve something personal.",
    established: "Established 1997",
    explore: "Explore the collection",
    personal: "Let’s make it personal",
    contact: "Contact & enquiries",
    bulk: "Bulk orders",
    event: "Plan my event",
    custom: "Custom acrylic",
    support: "Support",
    reviews: "Customer reviews",
    track: "Track order",
    account: "Customer account",
    privacy: "Privacy & customer artwork",
    whatsapp: "Hello Yash Laser, I would like to discuss a customised product.",
  },
  gu: {
    intro: "ખાસ ક્ષણો, સિદ્ધિઓ અને નામો માટે કંઈક વ્યક્તિગત.",
    established: "સ્થાપના 1997",
    explore: "કલેક્શન જુઓ",
    personal: "ચાલો તેને વ્યક્તિગત બનાવીએ",
    contact: "સંપર્ક અને પૂછપરછ",
    bulk: "બલ્ક ઓર્ડર",
    event: "ઇવેન્ટ પ્લાન કરો",
    custom: "કસ્ટમ એક્રેલિક",
    support: "સહાય",
    reviews: "ગ્રાહક રિવ્યૂ",
    track: "ઓર્ડર ટ્રેક કરો",
    account: "ગ્રાહક એકાઉન્ટ",
    privacy: "ગોપનીયતા અને ગ્રાહક આર્ટવર્ક",
    whatsapp: "નમસ્તે Yash Laser, મને કસ્ટમ પ્રોડક્ટ અંગે વાત કરવી છે.",
  },
  hi: {
    intro: "खास पलों, उपलब्धियों और नामों के लिए कुछ व्यक्तिगत.",
    established: "स्थापित 1997",
    explore: "कलेक्शन देखें",
    personal: "इसे व्यक्तिगत बनाएं",
    contact: "संपर्क और पूछताछ",
    bulk: "बल्क ऑर्डर",
    event: "इवेंट प्लान करें",
    custom: "कस्टम ऐक्रेलिक",
    support: "सहायता",
    reviews: "ग्राहक रिव्यू",
    track: "ऑर्डर ट्रैक करें",
    account: "ग्राहक अकाउंट",
    privacy: "गोपनीयता और ग्राहक आर्टवर्क",
    whatsapp: "नमस्ते Yash Laser, मुझे कस्टम प्रोडक्ट के बारे में बात करनी है.",
  },
  mr: {
    intro: "खास क्षण, यश आणि नावांसाठी काहीतरी वैयक्तिक.",
    established: "स्थापना 1997",
    explore: "कलेक्शन पहा",
    personal: "चला ते वैयक्तिक बनवूया",
    contact: "संपर्क आणि चौकशी",
    bulk: "बल्क ऑर्डर",
    event: "इव्हेंट प्लॅन करा",
    custom: "कस्टम अॅक्रिलिक",
    support: "मदत",
    reviews: "ग्राहक रिव्ह्यू",
    track: "ऑर्डर ट्रॅक करा",
    account: "ग्राहक अकाउंट",
    privacy: "गोपनीयता आणि ग्राहक आर्टवर्क",
    whatsapp: "नमस्कार Yash Laser, मला कस्टम प्रॉडक्टबद्दल चर्चा करायची आहे.",
  },
} as const;

export function SiteFooter() {
  const path = usePathname();
  const firstSegment = path.split("/").filter(Boolean)[0] || "";
  const lang = isUiLanguage(firstSegment) ? firstSegment : "en";
  const prefix = lang === "en" ? "" : "/" + lang;
  const t = copy[lang];
  const localHref = (value: string) => prefix + value;

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>{t.intro}</p>
          <span className="eyebrow">{t.established}</span>
        </div>
        <div>
          <h2>{t.explore}</h2>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={localHref("/categories/" + c.id)}>
                  {categoryCopy[lang][c.id].shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>{t.personal}</h2>
          <p>{business.address}</p>
          <p>
            <a href={whatsappUrl(t.whatsapp)}>
              WhatsApp: {business.phone}
            </a>
            <br />
            <a href="tel:+919427494264">{business.alternate}</a>
            <br />
            <a href={"mailto:" + business.email}>{business.email}</a>
          </p>
          <Link className="text-link" href={localHref("/contact")}>
            {t.contact} ↗
          </Link>
          <br />
          <Link className="text-link" href={localHref("/bulk-orders")}>
            {t.bulk} ↗
          </Link>
          <br />
          <Link className="text-link" href={localHref("/plan-my-event")}>
            {t.event} ↗
          </Link>
          <br />
          <Link className="text-link" href={localHref("/custom-acrylic")}>
            {t.custom} ↗
          </Link>
          <br />
          <Link className="text-link" href={localHref("/support")}>
            {t.support} ↗
          </Link>
          <br />
          <Link className="text-link" href={localHref("/reviews")}>
            {t.reviews} ↗
          </Link>
          <br />
          <Link className="text-link" href={localHref("/track-order")}>
            {t.track} ↗
          </Link>
          <br />
          <Link className="text-link" href={localHref("/account")}>
            {t.account} ↗
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Yash Laser</span>
        <Link href={localHref("/privacy")}>{t.privacy}</Link>
      </div>
    </footer>
  );
}
