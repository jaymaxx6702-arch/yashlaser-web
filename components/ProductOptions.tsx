"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadSelection } from "@/lib/customization/persistence";
import { business, whatsappUrl } from "@/data/business";
import { addCartItem } from "@/lib/cart";
import {
  resolveSelection,
  type CustomizationProduct,
} from "@/lib/customization";

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    minor / 100,
  );
export function ProductOptions({
  product: p,
}: {
  product: CustomizationProduct;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = pathname.split("/").filter(Boolean)[0] || "en";
  const prefix = ["gu", "hi", "mr"].includes(currentLang)
    ? "/" + currentLang
    : "";
  const t =
    currentLang === "gu"
      ? {
          size: "સાઇઝ / વિકલ્પ",
          select: "ઉપલબ્ધ વિકલ્પ પસંદ કરો",
          unavailable: " — ઉપલબ્ધતા પૂછો",
          quantity: "જથ્થો",
          priceEnquiry: "ભાવ માટે પૂછપરછ કરો",
          perItem: "પ્રતિ નંગ",
          estimate: "પ્રોડક્ટ અંદાજ",
          final: "અંતિમ ભાવ, બલ્ક રેટ, કસ્ટમાઇઝેશન અને ડિલિવરી ક્વોટેશનમાં કન્ફર્મ થશે.",
          availability: "ઉપલબ્ધ સાઇઝ માટે અમારી ટીમને WhatsApp પર પૂછો.",
          personalise: "પ્રોડક્ટ કસ્ટમાઇઝ કરો ↗",
          cart: "કાર્ટમાં ઉમેરો →",
          whatsapp: "WhatsApp પર પૂછો ↗",
          items: "નંગ",
        }
      : currentLang === "hi"
        ? {
            size: "साइज़ / विकल्प",
            select: "उपलब्ध विकल्प चुनें",
            unavailable: " — उपलब्धता पूछें",
            quantity: "मात्रा",
            priceEnquiry: "कीमत के लिए पूछताछ करें",
            perItem: "प्रति आइटम",
            estimate: "प्रोडक्ट अनुमान",
            final: "अंतिम कीमत, बल्क रेट, कस्टमाइज़ेशन और डिलीवरी कोटेशन में कन्फर्म होंगे।",
            availability: "उपलब्ध साइज़ के लिए हमारी टीम से WhatsApp पर पूछें।",
            personalise: "प्रोडक्ट कस्टमाइज़ करें ↗",
            cart: "कार्ट में जोड़ें →",
            whatsapp: "WhatsApp पर पूछें ↗",
            items: "आइटम",
          }
        : currentLang === "mr"
          ? {
              size: "साइझ / पर्याय",
              select: "उपलब्ध पर्याय निवडा",
              unavailable: " — उपलब्धता विचारा",
              quantity: "प्रमाण",
              priceEnquiry: "किंमतीसाठी चौकशी करा",
              perItem: "प्रति नग",
              estimate: "प्रॉडक्ट अंदाज",
              final: "अंतिम किंमत, बल्क रेट, कस्टमायझेशन आणि डिलिव्हरी कोटेशनमध्ये निश्चित होतील.",
              availability: "उपलब्ध साइझसाठी आमच्या टीमला WhatsApp वर विचारा.",
              personalise: "प्रॉडक्ट कस्टमाइझ करा ↗",
              cart: "कार्टमध्ये जोडा →",
              whatsapp: "WhatsApp वर विचारा ↗",
              items: "नग",
            }
          : {
              size: "Size / variant",
              select: "Select an available option",
              unavailable: " — confirm availability",
              quantity: "Quantity",
              priceEnquiry: "Price on enquiry",
              perItem: "per item",
              estimate: "Product estimate",
              final: "Final pricing, bulk rates, personalisation and delivery are confirmed in your quotation.",
              availability: "Please ask our team about available sizes on WhatsApp.",
              personalise: "Personalise product ↗",
              cart: "Add to cart →",
              whatsapp: "Ask on WhatsApp ↗",
              items: "items",
            };
  const [variantId, setVariantId] = useState(resolveSelection(p).variantId);
  const [quantity, setQuantity] = useState("1");
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      const saved = loadSelection(p.id);
      if (cancelled || !saved) return;
      const valid = resolveSelection(
        p,
        saved.variantId,
        String(saved.quantity),
      );
      setVariantId(valid.variantId);
      setQuantity(String(valid.quantity));
    });
    return () => {
      cancelled = true;
    };
  }, [p]);
  const selected = p.variants.find((v) => v.id === variantId);
  const unitPrice = selected?.effectivePriceMinor ?? p.effectivePriceMinor;
  const regularPrice = selected?.priceMinor ?? p.priceMinor;
  const count = Number(quantity);
  const validQuantity =
    /^\d+$/.test(quantity) &&
    Number.isInteger(count) &&
    count >= 1 &&
    count <= 10000;
  const canCustomise = !p.variants.length || !!selected?.available;
  const priced =
    p.pricingMode !== "quote_required" && unitPrice > 0 && canCustomise;
  const enquiry = whatsappUrl(
    [
      "Hello Yash Laser, I am interested in " + p.name + ".",
      "Size / option: " + (selected?.name ?? "Please confirm"),
      "Quantity: " + quantity,
      "Please confirm availability, personalisation, final quotation and delivery.",
      business.url + "/products/" + p.slug,
    ].join("\n"),
  );
  return (
    <form
      action={prefix + "/customize/" + p.slug}
      method="get"
      className="product-options"
    >
      <div className="option-fields">
        {p.variants.length > 0 && (
          <label>
            {t.size}
            <select
              name="variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              required
            >
              <option value="" disabled>
                {t.select}
              </option>
              {p.variants.map((v) => (
                <option key={v.id} value={v.id} disabled={!v.available}>
                  {v.name}
                  {!v.available ? t.unavailable : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {t.quantity}
          <input
            type="number"
            name="quantity"
            min={1}
            max={10000}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <p className="detail-price">
          {priced ? (
            <>
              {regularPrice > unitPrice && <del>{money(regularPrice)}</del>}
              {money(unitPrice)} <small>{t.perItem}</small>
            </>
          ) : (
            t.priceEnquiry
          )}
        </p>
        {priced && validQuantity && count > 1 && (
          <p>
            {t.estimate}: <strong>{money(unitPrice * count)}</strong> · {count} {t.items}
          </p>
        )}
      </div>
      <p className="muted">
        {t.final}
      </p>
      {!canCustomise && (
        <p className="muted">
          {t.availability}
        </p>
      )}
      <div className="detail-actions">
        <button type="submit" className="button" disabled={!canCustomise}>
          {t.personalise}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={!canCustomise || !validQuantity}
          onClick={() => {
            if (!validQuantity) return;
            addCartItem({
              productId: p.id,
              slug: p.slug,
              name: p.name,
              variantId: selected?.id || "",
              variantName: selected?.name || "To confirm",
              quantity: count,
              unitPriceMinor: priced ? unitPrice : null,
              pricingMode: p.pricingMode,
              notes: "Added from product page; personalisation to confirm.",
            });
            router.push(prefix + "/cart");
          }}
        >
          {t.cart}
        </button>
        {validQuantity && (
          <a
            className="text-link"
            href={enquiry}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.whatsapp}
          </a>
        )}
      </div>
    </form>
  );
}
