import type { Product } from "@/data/catalog";
export type CustomizationProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "categoryId"
  | "variants"
  | "pricingMode"
  | "effectivePriceMinor"
  | "priceMinor"
>;
export function resolveSelection(
  product: CustomizationProduct,
  variant?: string | string[],
  quantity?: string | string[],
) {
  const selected =
    product.variants.find((v) => v.id === variant && v.available) ??
    product.variants.find((v) => v.available);
  const parsed =
    typeof quantity === "string" && /^\d+$/.test(quantity)
      ? Number(quantity)
      : 1;
  return {
    variantId: selected?.id ?? "",
    quantity:
      Number.isInteger(parsed) && parsed >= 1 && parsed <= 10000 ? parsed : 1,
  };
}
export const fieldLabels = {
  standees: ["Your message (optional)", "Occasion / date (optional)"],
  awards: ["Recipient / organisation", "Achievement / award message"],
  keychains: ["Name / short message", "Additional text (optional)"],
  "id-cards": ["Display name", "Organisation / designation"],
  "name-plates": ["Name / family / business", "House number / designation"],
  other: ["Personalisation text", "Additional text (optional)"],
} as const;
