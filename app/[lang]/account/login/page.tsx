import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  customerAccountsEnabled,
  customerUser,
} from "@/lib/customer-auth";
import {
  customerLogin,
  customerSignup,
} from "@/app/account/actions";
import { isUiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Yash Laser account", title: "Sign in or create an account.",
    disabled: "Customer accounts are prepared but not enabled yet. You can still track an order securely without an account.",
    track: "Track an order ↗", signIn: "Sign in", create: "Create account", email: "Email", password: "Password",
    signInFailed: "Sign in failed.", signupFailed: "Account could not be created.",
    checkEmail: "Check your email to complete account confirmation.",
  },
  gu: {
    eyebrow: "Yash Laser એકાઉન્ટ", title: "સાઇન ઇન કરો અથવા એકાઉન્ટ બનાવો.",
    disabled: "ગ્રાહક એકાઉન્ટ તૈયાર છે પરંતુ હજી સક્રિય નથી. એકાઉન્ટ વગર પણ સુરક્ષિત રીતે ઓર્ડર ટ્રેક કરી શકો છો.",
    track: "ઓર્ડર ટ્રેક કરો ↗", signIn: "સાઇન ઇન", create: "એકાઉન્ટ બનાવો", email: "ઈમેલ", password: "પાસવર્ડ",
    signInFailed: "સાઇન ઇન થઈ શક્યું નથી.", signupFailed: "એકાઉન્ટ બનાવી શકાયું નથી.",
    checkEmail: "એકાઉન્ટ કન્ફર્મ કરવા તમારું ઈમેલ ચેક કરો.",
  },
  hi: {
    eyebrow: "Yash Laser अकाउंट", title: "साइन इन करें या अकाउंट बनाएँ.",
    disabled: "ग्राहक अकाउंट तैयार हैं लेकिन अभी सक्रिय नहीं हैं. अकाउंट के बिना भी सुरक्षित रूप से ऑर्डर ट्रैक कर सकते हैं.",
    track: "ऑर्डर ट्रैक करें ↗", signIn: "साइन इन", create: "अकाउंट बनाएँ", email: "ईमेल", password: "पासवर्ड",
    signInFailed: "साइन इन नहीं हो सका.", signupFailed: "अकाउंट नहीं बनाया जा सका.",
    checkEmail: "अकाउंट कन्फर्म करने के लिए अपना ईमेल देखें.",
  },
  mr: {
    eyebrow: "Yash Laser अकाउंट", title: "साइन इन करा किंवा अकाउंट तयार करा.",
    disabled: "ग्राहक अकाउंट तयार आहेत पण अजून सक्रिय नाहीत. अकाउंटशिवायही सुरक्षितपणे ऑर्डर ट्रॅक करू शकता.",
    track: "ऑर्डर ट्रॅक करा ↗", signIn: "साइन इन", create: "अकाउंट तयार करा", email: "ईमेल", password: "पासवर्ड",
    signInFailed: "साइन इन करता आले नाही.", signupFailed: "अकाउंट तयार करता आले नाही.",
    checkEmail: "अकाउंट कन्फर्म करण्यासाठी ईमेल तपासा.",
  },
} as const;

export const metadata = {
  title: "Customer sign in",
  robots: { index: false, follow: false },
};

export default async function LocalizedCustomerLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const prefix = "/" + lang;
  const accountPath = prefix + "/account";
  const loginPath = accountPath + "/login";
  if (await customerUser()) redirect(accountPath);

  const query = await searchParams;
  const enabled = customerAccountsEnabled();
  const t = copy[lang];

  return (
    <main id="main-content" className="container section" lang={lang}>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.title}</h1>

      {!enabled ? (
        <div className="admin-card">
          <p>{t.disabled}</p>
          <Link className="button" href={prefix + "/track-order"}>{t.track}</Link>
        </div>
      ) : (
        <div className="account-auth-grid">
          <form className="admin-card" action={customerLogin}>
            <input type="hidden" name="accountPath" value={accountPath} />
            <input type="hidden" name="loginPath" value={loginPath} />
            <h2>{t.signIn}</h2>
            <label>
              {t.email}
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              {t.password}
              <input name="password" type="password" autoComplete="current-password" minLength={8} required />
            </label>
            <button className="button">{t.signIn}</button>
            {query.error && <p role="alert">{t.signInFailed}</p>}
          </form>

          <form className="admin-card" action={customerSignup}>
            <input type="hidden" name="accountPath" value={accountPath} />
            <input type="hidden" name="loginPath" value={loginPath} />
            <h2>{t.create}</h2>
            <label>
              {t.email}
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              {t.password}
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button className="button">{t.create}</button>
            {query.signup_error && <p role="alert">{t.signupFailed}</p>}
            {query.check_email && <p role="status">{t.checkEmail}</p>}
          </form>
        </div>
      )}
    </main>
  );
}
