import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  customerAccountsEnabled,
  customerUser,
} from "@/lib/customer-auth";
import { getSupabase } from "@/lib/supabase";
import { ClaimOrderForm } from "@/components/ClaimOrderForm";
import { customerLogout } from "@/app/account/actions";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Your Yash Laser account",
    title: "Orders, proofs and delivery in one place.",
    disabledEyebrow: "Your Yash Laser orders",
    disabledTitle: "Customer account.",
    disabledText: "Customer accounts are prepared but not enabled yet. Secure guest order tracking remains available.",
    track: "Track an order ↗",
    shop: "Continue shopping ↗",
    signOut: "Sign out",
    guestTrack: "Track a guest order ↗",
    help: "Need help? ↗",
    myOrders: "My orders",
    history: "Your order history",
    historyHelp: "Open an order to view items, payment, proof, shipping and status history.",
    payment: "Payment",
    view: "View order ↗",
    loadError: "Orders could not be loaded. Please try again later.",
    none: "No linked orders yet.",
    noneHelp: "New orders placed while signed in will appear here automatically. You can also add an older guest order below.",
    priceRequest: "Price on request",
  },
  gu: {
    eyebrow: "તમારું Yash Laser એકાઉન્ટ",
    title: "ઓર્ડર, પ્રૂફ અને ડિલિવરી એક જ જગ્યાએ.",
    disabledEyebrow: "તમારા Yash Laser ઓર્ડર",
    disabledTitle: "ગ્રાહક એકાઉન્ટ.",
    disabledText: "ગ્રાહક એકાઉન્ટ તૈયાર છે પરંતુ હજી સક્રિય નથી. સુરક્ષિત ગેસ્ટ ઓર્ડર ટ્રેકિંગ ઉપલબ્ધ છે.",
    track: "ઓર્ડર ટ્રેક કરો ↗",
    shop: "ખરીદી ચાલુ રાખો ↗",
    signOut: "સાઇન આઉટ",
    guestTrack: "ગેસ્ટ ઓર્ડર ટ્રેક કરો ↗",
    help: "મદદ જોઈએ? ↗",
    myOrders: "મારા ઓર્ડર",
    history: "તમારો ઓર્ડર ઇતિહાસ",
    historyHelp: "પ્રોડક્ટ્સ, ચુકવણી, પ્રૂફ, શિપિંગ અને સ્ટેટસ ઇતિહાસ જોવા ઓર્ડર ખોલો.",
    payment: "ચુકવણી",
    view: "ઓર્ડર જુઓ ↗",
    loadError: "ઓર્ડર લોડ થઈ શક્યા નથી. ફરી પ્રયત્ન કરો.",
    none: "હજુ કોઈ linked ઓર્ડર નથી.",
    noneHelp: "સાઇન ઇન કરીને કરેલા નવા ઓર્ડર અહીં આપમેળે દેખાશે. જૂનો ગેસ્ટ ઓર્ડર પણ નીચે ઉમેરી શકો છો.",
    priceRequest: "ભાવ પૂછવા પર",
  },
  hi: {
    eyebrow: "आपका Yash Laser अकाउंट",
    title: "ऑर्डर, प्रूफ और डिलीवरी एक ही जगह.",
    disabledEyebrow: "आपके Yash Laser ऑर्डर",
    disabledTitle: "ग्राहक अकाउंट.",
    disabledText: "ग्राहक अकाउंट तैयार हैं लेकिन अभी सक्रिय नहीं हैं. सुरक्षित गेस्ट ऑर्डर ट्रैकिंग उपलब्ध है.",
    track: "ऑर्डर ट्रैक करें ↗",
    shop: "खरीदारी जारी रखें ↗",
    signOut: "साइन आउट",
    guestTrack: "गेस्ट ऑर्डर ट्रैक करें ↗",
    help: "मदद चाहिए? ↗",
    myOrders: "मेरे ऑर्डर",
    history: "आपका ऑर्डर इतिहास",
    historyHelp: "प्रोडक्ट, भुगतान, प्रूफ, शिपिंग और स्टेटस इतिहास देखने के लिए ऑर्डर खोलें.",
    payment: "भुगतान",
    view: "ऑर्डर देखें ↗",
    loadError: "ऑर्डर लोड नहीं हो सके. फिर कोशिश करें.",
    none: "अभी कोई linked ऑर्डर नहीं है.",
    noneHelp: "साइन इन करके दिए गए नए ऑर्डर यहाँ अपने-आप दिखेंगे. पुराना गेस्ट ऑर्डर भी नीचे जोड़ सकते हैं.",
    priceRequest: "कीमत पूछने पर",
  },
  mr: {
    eyebrow: "तुमचे Yash Laser अकाउंट",
    title: "ऑर्डर, प्रूफ आणि डिलिव्हरी एकाच ठिकाणी.",
    disabledEyebrow: "तुमचे Yash Laser ऑर्डर",
    disabledTitle: "ग्राहक अकाउंट.",
    disabledText: "ग्राहक अकाउंट तयार आहेत पण अजून सक्रिय नाहीत. सुरक्षित गेस्ट ऑर्डर ट्रॅकिंग उपलब्ध आहे.",
    track: "ऑर्डर ट्रॅक करा ↗",
    shop: "खरेदी सुरू ठेवा ↗",
    signOut: "साइन आउट",
    guestTrack: "गेस्ट ऑर्डर ट्रॅक करा ↗",
    help: "मदत हवी? ↗",
    myOrders: "माझे ऑर्डर",
    history: "तुमचा ऑर्डर इतिहास",
    historyHelp: "प्रॉडक्ट, पेमेंट, प्रूफ, शिपिंग आणि स्टेटस इतिहास पाहण्यासाठी ऑर्डर उघडा.",
    payment: "पेमेंट",
    view: "ऑर्डर पहा ↗",
    loadError: "ऑर्डर लोड करता आले नाहीत. पुन्हा प्रयत्न करा.",
    none: "अजून linked ऑर्डर नाहीत.",
    noneHelp: "साइन इन करून केलेले नवीन ऑर्डर येथे आपोआप दिसतील. जुना गेस्ट ऑर्डरही खाली जोडू शकता.",
    priceRequest: "किंमत विचारल्यावर",
  },
} as const;

const statusCopy = {
  en: { received: "Received", proof: "Proof", production: "Production", packed: "Packed", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled", pending: "Pending", partial: "Partial", paid: "Paid", refunded: "Refunded", not_applicable: "Not applicable" },
  gu: { received: "મળ્યો", proof: "પ્રૂફ", production: "પ્રોડક્શન", packed: "પેક થયો", dispatched: "ડિસ્પેચ થયો", delivered: "ડિલિવર થયો", cancelled: "રદ", pending: "બાકી", partial: "આંશિક", paid: "ચૂકવેલ", refunded: "રિફંડ", not_applicable: "લાગુ નથી" },
  hi: { received: "प्राप्त", proof: "प्रूफ", production: "प्रोडक्शन", packed: "पैक", dispatched: "डिस्पैच", delivered: "डिलीवर", cancelled: "रद्द", pending: "बाकी", partial: "आंशिक", paid: "भुगतान हुआ", refunded: "रिफंड", not_applicable: "लागू नहीं" },
  mr: { received: "मिळाला", proof: "प्रूफ", production: "प्रॉडक्शन", packed: "पॅक", dispatched: "डिस्पॅच", delivered: "डिलिव्हर", cancelled: "रद्द", pending: "बाकी", partial: "अंशतः", paid: "पेड", refunded: "रिफंड", not_applicable: "लागू नाही" },
} as const;

function translatedStatus(lang: keyof typeof statusCopy, value: string) {
  return statusCopy[lang][value as keyof typeof statusCopy.en] ||
    value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(
  value: number | null,
  currency: string,
  lang: keyof typeof copy,
) {
  if (value == null) return copy[lang].priceRequest;
  const locale =
    lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number(value) / 100);
}

export const metadata = {
  title: "Customer account",
  robots: { index: false, follow: false },
};

export default async function LocalizedAccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const t = copy[lang];
  const prefix = "/" + lang;
  const accountPath = prefix + "/account";
  const loginPath = accountPath + "/login";

  if (!customerAccountsEnabled())
    return (
      <main id="main-content" className="container section" lang={lang}>
        <p className="eyebrow">{t.disabledEyebrow}</p>
        <h1>{t.disabledTitle}</h1>
        <p>{t.disabledText}</p>
        <div className="hero-actions">
          <Link className="button" href={prefix + "/track-order"}>{t.track}</Link>
          <Link className="text-link" href={prefix + "/products"}>{t.shop}</Link>
        </div>
      </main>
    );

  const user = await customerUser();
  if (!user) redirect(loginPath);

  const db = getSupabase();
  const { data: orders, error } = await db
    .from("shop_orders")
    .select("id,order_no,status,payment_status,total_minor,currency,created_at")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main id="main-content" className="container section" lang={lang}>
      <div className="account-heading">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{user.email}</p>
        </div>
        <form action={customerLogout}>
          <input type="hidden" name="loginPath" value={loginPath} />
          <button className="button button-secondary">{t.signOut}</button>
        </form>
      </div>

      <div className="hero-actions">
        <Link className="button" href={prefix + "/products"}>{t.shop}</Link>
        <Link className="text-link" href={prefix + "/track-order"}>{t.guestTrack}</Link>
        <Link className="text-link" href={prefix + "/support"}>{t.help}</Link>
      </div>

      {error ? (
        <p role="alert">{t.loadError}</p>
      ) : (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.myOrders}</p>
              <h2>{t.history}</h2>
            </div>
            <p>{t.historyHelp}</p>
          </div>
          <div className="admin-list">
            {(orders || []).map((order) => (
              <article className="admin-card" key={order.id}>
                <div className="account-heading">
                  <div>
                    <strong>{order.order_no}</strong>
                    <p>
                      {translatedStatus(lang, order.status)} · {t.payment}{" "}
                      {translatedStatus(lang, order.payment_status)}
                    </p>
                    <small>
                      {new Date(order.created_at).toLocaleString(
                        lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN",
                        { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" },
                      )}
                    </small>
                  </div>
                  <div>
                    <strong>{money(order.total_minor, order.currency, lang)}</strong>
                    <br />
                    <Link className="text-link" href={accountPath + "/orders/" + order.id}>
                      {t.view}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            {!orders?.length && (
              <div className="admin-card">
                <h3>{t.none}</h3>
                <p>{t.noneHelp}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <ClaimOrderForm lang={lang} />
    </main>
  );
}
