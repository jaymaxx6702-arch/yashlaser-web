import type { CustomizationProduct } from "../customization";

export const CUSTOMIZATION_RULES_VERSION = 1 as const;

export type TemplateId =
  | "standee"
  | "trophy"
  | "medal"
  | "keychain"
  | "id-card"
  | "name-plate"
  | "keepsake";

export type CustomFieldKind =
  | "photo"
  | "logo"
  | "text"
  | "date"
  | "qr"
  | "choice"
  | "number";

export type CustomFieldRule = {
  id: string;
  kind: CustomFieldKind;
  label: string;
  required: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: readonly { value: string; label: string }[];
};

export type ProductCustomizationRuleOverride = {
  templates?: readonly TemplateId[];
  quantity?: Partial<{ min: number; max: number }>;
  fields?: readonly CustomFieldRule[];
  ai?: Partial<ProductCustomizationRules["ai"]>;
};

export type ProductCustomizationRules = {
  version: typeof CUSTOMIZATION_RULES_VERSION;
  productId: string;
  categoryId: CustomizationProduct["categoryId"];
  templates: readonly TemplateId[];
  quantity: { min: number; max: number };
  fields: readonly CustomFieldRule[];
  ai: {
    qualityAnalysis: boolean;
    backgroundRemoval: boolean;
    enhancement: boolean;
    smartCrop: boolean;
  };
};

export const categoryTemplates: Record<
  CustomizationProduct["categoryId"],
  readonly TemplateId[]
> = {
  standees: ["standee"],
  awards: ["trophy", "medal"],
  keychains: ["keychain"],
  "id-cards": ["id-card"],
  "name-plates": ["name-plate"],
  other: ["keepsake"],
};

const textLabels: Record<
  CustomizationProduct["categoryId"],
  readonly [string, string]
> = {
  standees: ["Your message (optional)", "Occasion / date (optional)"],
  awards: ["Recipient / organisation", "Achievement / award message"],
  keychains: ["Name / short message", "Additional text (optional)"],
  "id-cards": ["Display name", "Organisation / designation"],
  "name-plates": ["Name / family / business", "House number / designation"],
  other: ["Personalisation text", "Additional text (optional)"],
};

export function customizationRules(
  product: CustomizationProduct,
  override?: ProductCustomizationRuleOverride,
): ProductCustomizationRules {
  const [line1, line2] = textLabels[product.categoryId];
  const photoRequired = product.categoryId === "standees";

  const base: ProductCustomizationRules = {
    version: CUSTOMIZATION_RULES_VERSION,
    productId: product.id,
    categoryId: product.categoryId,
    templates: categoryTemplates[product.categoryId],
    quantity: { min: 1, max: 10000 },
    fields: [
      {
        id: "artwork",
        kind: "photo",
        label:
          product.categoryId === "name-plates"
            ? "Photo / logo (optional)"
            : "Photo / logo",
        required: photoRequired,
      },
      { id: "line1", kind: "text", label: line1, required: false, maxLength: 120 },
      { id: "line2", kind: "text", label: line2, required: false, maxLength: 180 },
    ],
    ai: {
      qualityAnalysis: true,
      backgroundRemoval: product.categoryId !== "id-cards",
      enhancement: true,
      smartCrop: true,
    },
  };

  if (!override) return base;

  return validateCustomizationRules(
    {
      ...base,
      ...(override.templates ? { templates: override.templates } : {}),
      quantity: { ...base.quantity, ...override.quantity },
      fields: override.fields ?? base.fields,
      ai: { ...base.ai, ...override.ai },
    },
    product,
  );
}

export function textRule(
  product: CustomizationProduct,
  index: 0 | 1,
): CustomFieldRule {
  const rule = customizationRules(product).fields.find(
    (field) => field.id === (index === 0 ? "line1" : "line2"),
  );
  if (!rule) throw new Error("Text customization rule is missing.");
  return rule;
}

export function validateCustomizationRules(
  input: ProductCustomizationRules,
  product: CustomizationProduct,
): ProductCustomizationRules {
  if (
    input.version !== CUSTOMIZATION_RULES_VERSION ||
    input.productId !== product.id ||
    input.categoryId !== product.categoryId
  )
    throw new Error("Customization rules do not match this product.");

  const allowedTemplates = categoryTemplates[product.categoryId];
  if (
    !input.templates.length ||
    input.templates.some((template) => !allowedTemplates.includes(template))
  )
    throw new Error("Customization template is not allowed for this product.");

  if (
    !Number.isInteger(input.quantity.min) ||
    !Number.isInteger(input.quantity.max) ||
    input.quantity.min < 1 ||
    input.quantity.max < input.quantity.min ||
    input.quantity.max > 10000
  )
    throw new Error("Invalid customization quantity rules.");

  const allowedKinds = new Set<CustomFieldKind>([
    "photo",
    "logo",
    "text",
    "date",
    "qr",
    "choice",
    "number",
  ]);
  const ids = new Set<string>();
  for (const field of input.fields) {
    if (!/^[a-z][a-z0-9_-]{0,39}$/.test(field.id) || ids.has(field.id))
      throw new Error("Invalid or duplicate customization field id.");
    ids.add(field.id);
    if (!allowedKinds.has(field.kind))
      throw new Error("Invalid customization field kind.");
    if (!field.label || field.label.length > 120)
      throw new Error("Invalid customization field label.");
    if (
      field.maxLength !== undefined &&
      (!Number.isInteger(field.maxLength) ||
        field.maxLength < 1 ||
        field.maxLength > 3000)
    )
      throw new Error("Invalid customization field length.");
    if (
      field.min !== undefined &&
      (!Number.isFinite(field.min) || Math.abs(field.min) > 1_000_000_000)
    )
      throw new Error("Invalid customization field minimum.");
    if (
      field.max !== undefined &&
      (!Number.isFinite(field.max) ||
        Math.abs(field.max) > 1_000_000_000 ||
        (field.min !== undefined && field.max < field.min))
    )
      throw new Error("Invalid customization field maximum.");
    if (field.kind === "choice") {
      if (!field.options?.length || field.options.length > 100)
        throw new Error("Choice fields require bounded options.");
      const optionValues = new Set<string>();
      for (const option of field.options) {
        if (
          !option.value ||
          option.value.length > 80 ||
          !option.label ||
          option.label.length > 120 ||
          optionValues.has(option.value)
        )
          throw new Error("Invalid customization choice option.");
        optionValues.add(option.value);
      }
    }
  }

  return input;
}
