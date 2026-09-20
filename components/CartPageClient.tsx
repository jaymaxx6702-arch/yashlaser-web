"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CART_EVENT,
  readCart,
  removeCartItem,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";
import type { UiLanguage } from "@/lib/i18n";

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

type Checked = CartItem & {
  valid?: boolean;
  reason?: string;
  quoteRequired?: boolean;
  lineTotalMinor?: number | null;
};

const copy = {
  en: {
    eyebrow: "Your cart", empty: "Your cart is empty.", emptyText: "Explore the collection and add a product when you are ready.",
    explore: "Explore products ↗", review: "Review your selection.", option: "Option to confirm", quoteHelp: "Final price confirmed in quotation.",
    quantity: "Quantity", quote: "Quote", checking: "Checking…", remove: "Remove", summary: "Summary", priced: "Priced items",
    help: "Delivery, bulk pricing, personalisation and any quote-only items are confirmed before payment.",
    checkingCart: "Checking cart…", checkout: "Continue to checkout →",
  },
  gu: {
    eyebrow: "તમારી કાર્ટ", empty: "તમારી કાર્ટ ખાલી છે.", emptyText: "કલેક્શન જુઓ અને તૈયાર હો ત્યારે પ્રોડક્ટ ઉમેરો.",
    explore: "પ્રોડક્ટ્સ જુઓ ↗", review: "તમારી પસંદગી ચેક કરો.", option: "વિકલ્પ કન્ફર્મ કરવો", quoteHelp: "અંતિમ ભાવ ક્વોટેશનમાં કન્ફર્મ થશે.",
    quantity: "જથ્થો", quote: "ક્વોટ", checking: "ચેક થઈ રહ્યું છે…", remove: "દૂર કરો", summary: "સારાંશ", priced: "ભાવવાળી વસ્તુઓ",
    help: "ડિલિવરી, બલ્ક ભાવ, કસ્ટમાઇઝેશન અને ક્વોટવાળી વસ્તુઓ ચુકવણી પહેલાં કન્ફર્મ થશે.",
    checkingCart: "કાર્ટ ચેક થઈ રહી છે…", checkout: "ચેકઆઉટ તરફ આગળ વધો →",
  },
  hi: {
    eyebrow: "आपकी कार्ट", empty: "आपकी कार्ट खाली है.", emptyText: "कलेक्शन देखें और तैयार होने पर प्रोडक्ट जोड़ें.",
    explore: "प्रोडक्ट देखें ↗", review: "अपनी पसंद जांचें.", option: "विकल्प कन्फर्म करना है", quoteHelp: "अंतिम कीमत कोटेशन में कन्फर्म होगी.",
    quantity: "मात्रा", quote: "कोट", checking: "जांच हो रही है…", remove: "हटाएँ", summary: "सारांश", priced: "कीमत वाले आइटम",
    help: "डिलीवरी, बल्क कीमत, कस्टमाइज़ेशन और कोट वाले आइटम भुगतान से पहले कन्फर्म होंगे.",
    checkingCart: "कार्ट जांची जा रही है…", checkout: "चेकआउट पर जाएँ →",
  },
  mr: {
    eyebrow: "तुमची कार्ट", empty: "तुमची कार्ट रिकामी आहे.", emptyText: "कलेक्शन पहा आणि तयार झाल्यावर प्रॉडक्ट जोडा.",
    explore: "प्रॉडक्ट पहा ↗", review: "तुमची निवड तपासा.", option: "पर्याय निश्चित करायचा आहे", quoteHelp: "अंतिम किंमत कोटेशनमध्ये निश्चित होईल.",
    quantity: "प्रमाण", quote: "कोट", checking: "तपासत आहे…", remove: "काढा", summary: "सारांश", priced: "किंमत असलेले आयटम",
    help: "डिलिव्हरी, बल्क किंमत, कस्टमायझेशन आणि कोट आयटम पेमेंटपूर्वी निश्चित होतील.",
    checkingCart: "कार्ट तपासत आहे…", checkout: "चेकआउटकडे जा →",
  },
} as const;

export function CartPageClient({ lang = "en" }: { lang?: UiLanguage }) {
  const t = copy[lang];
  const prefix = lang === "en" ? "" : "/" + lang;
  const [items, setItems] = useState<Checked[]>([]);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    const local = readCart();
    setItems(local);
    if (!local.length) {
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: local }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to validate cart.");
      const byId = new Map(result.items.map((x: Checked) => [x.id, x]));
      setItems(local.map((x) => ({ ...x, ...(byId.get(x.id) || {}) })));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => void refresh();
    const timer = window.setTimeout(handler, 0);
    window.addEventListener(CART_EVENT, handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CART_EVENT, handler);
    };
  }, [refresh]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, x) => sum + (x.valid && x.lineTotalMinor ? x.lineTotalMinor : 0),
        0,
      ),
    [items],
  );
  const blocked = items.some((x) => x.valid === false);

  if (!items.length)
    return (
      <section className="cart-empty">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.empty}</h1>
        <p>{t.emptyText}</p>
        <Link className="button" href={prefix + "/products"}>{t.explore}</Link>
      </section>
    );

  return (
    <div className="cart-layout">
      <section>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.review}</h1>
        <div className="cart-items">
          {items.map((item) => (
            <article className="cart-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.variantName || t.option}</p>
                {item.valid === false && <p className="form-error">{item.reason}</p>}
                {item.quoteRequired && <p className="muted">{t.quoteHelp}</p>}
              </div>
              <label>
                {t.quantity}
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={item.quantity}
                  onChange={(e) =>
                    updateCartQuantity(item.id, Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </label>
              <div>
                <strong>
                  {item.lineTotalMinor
                    ? money(item.lineTotalMinor)
                    : item.quoteRequired
                      ? t.quote
                      : t.checking}
                </strong>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => removeCartItem(item.id)}
                >
                  {t.remove}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="cart-summary">
        <p className="eyebrow">{t.summary}</p>
        <div className="summary-row"><span>{t.priced}</span><strong>{money(total)}</strong></div>
        <p className="muted">{t.help}</p>
        <Link
          className={"button" + (blocked || checking ? " is-disabled" : "")}
          aria-disabled={blocked || checking}
          href={blocked || checking ? prefix + "/cart" : prefix + "/checkout"}
        >
          {checking ? t.checkingCart : t.checkout}
        </Link>
      </aside>
    </div>
  );
}
