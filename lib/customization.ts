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

export const fieldLabels = Object.fromEntries(
  Object.entries(categoryCustomizationDefinitions).map(
    ([categoryId, definition]) => {
      const [first, second] = legacyTextFields(definition);
      return [
        categoryId,
        [
          first?.label ?? "Personalisation text",
          second?.label ?? "Additional text (optional)",
        ],
      ];
    },
  ),
) as Record<Product["categoryId"], readonly [string, string]>;
