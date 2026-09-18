"use client";
import { useEffect, useState } from "react";
import { loadSelection } from "@/lib/customization/persistence";
import { business, whatsappUrl } from "@/data/business";
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
      action={"/customize/" + p.slug}
      method="get"
      className="product-options"
    >
      <div className="option-fields">
        {p.variants.length > 0 && (
          <label>
            Size / variant
            <select
              name="variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select an available option
              </option>
              {p.variants.map((v) => (
                <option key={v.id} value={v.id} disabled={!v.available}>
                  {v.name}
                  {!v.available ? " — confirm availability" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Quantity
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
              {money(unitPrice)} <small>per item</small>
            </>
          ) : (
            "Price on enquiry"
          )}
        </p>
        {priced && validQuantity && count > 1 && (
          <p>
            Product estimate: <strong>{money(unitPrice * count)}</strong> for{" "}
            {count} items
          </p>
        )}
      </div>
      <p className="muted">
        Final pricing, bulk rates, personalisation and delivery are confirmed in
        your quotation.
      </p>
      {!canCustomise && (
        <p className="muted">
          Please ask our team about available sizes on WhatsApp.
        </p>
      )}
      <div className="detail-actions">
        <button type="submit" className="button" disabled={!canCustomise}>
          Personalise & enquire ↗
        </button>
        {validQuantity && (
          <a
            className="text-link"
            href={enquiry}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask on WhatsApp ↗
          </a>
        )}
      </div>
    </form>
  );
}
