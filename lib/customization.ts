import type { Product } from "@/data/catalog";
import {
  categoryCustomizationDefinitions,
  legacyTextFields,
} from "@/lib/customization/contract";

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

function labelsFor(
  categoryId: Product["categoryId"],
): readonly [string, string] {
  const [first, second] = legacyTextFields(
    categoryCustomizationDefinitions[categoryId],
  );
  return [
    first?.label ?? "Personalisation text",
    second?.label ?? "Additional text (optional)",
  ];
}

export const fieldLabels: Record<
  Product["categoryId"],
  readonly [string, string]
> = {
  standees: labelsFor("standees"),
  awards: labelsFor("awards"),
  keychains: labelsFor("keychains"),
  "id-cards": labelsFor("id-cards"),
  "name-plates": labelsFor("name-plates"),
  other: labelsFor("other"),
};
