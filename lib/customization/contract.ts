import type { CategoryId } from "@/data/catalog";

export const CUSTOMIZATION_CONTRACT_VERSION = 1;

export type TemplateId =
  | "standee"
  | "trophy"
  | "medal"
  | "keychain"
  | "id-card"
  | "name-plate"
  | "keepsake";

export type CustomizationFieldKind =
  | "photo"
  | "logo"
  | "text"
  | "date"
  | "qr"
  | "color"
  | "choice"
  | "number";

export type LegacySlot = "artwork" | "text-1" | "text-2";

export type FieldVisibilityRule = {
  fieldId: string;
  operator: "equals" | "not-equals" | "present" | "not-present";
  value?: string | number | boolean;
};

export type AiFieldPolicy = {
  backgroundRemoval: "disabled" | "optional";
  enhancement: "disabled" | "optional";
  smartCrop: "disabled" | "optional";
};

export type CustomizationFieldRule = {
  id: string;
  kind: CustomizationFieldKind;
  label: string;
  required: boolean;
  legacySlot?: LegacySlot;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  choices?: readonly string[];
  allowedMimeTypes?: readonly ("image/jpeg" | "image/png" | "image/webp")[];
  maxBytes?: number;
  maxPixels?: number;
  visibility?: readonly FieldVisibilityRule[];
  ai?: AiFieldPolicy;
};

export type CustomizationDefinition = {
  version: 1;
  categoryId: CategoryId;
  templates: readonly TemplateId[];
  quantity: { min: number; max: number };
  fields: readonly CustomizationFieldRule[];
};

const imagePolicy: AiFieldPolicy = {
  backgroundRemoval: "optional",
  enhancement: "optional",
  smartCrop: "optional",
};

const photo = (
  label: string,
  required: boolean,
): CustomizationFieldRule => ({
  id: "artwork",
  kind: "photo",
  label,
  required,
  legacySlot: "artwork",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 8 * 1024 * 1024,
  maxPixels: 25_000_000,
  ai: imagePolicy,
});

const text = (
  id: string,
  label: string,
  slot: "text-1" | "text-2",
  maxLength: number,
): CustomizationFieldRule => ({
  id,
  kind: "text",
  label,
  required: false,
  legacySlot: slot,
  minLength: 0,
  maxLength,
});

export const categoryCustomizationDefinitions: Record<
  CategoryId,
  CustomizationDefinition
> = {
  standees: {
    version: 1,
    categoryId: "standees",
    templates: ["standee"],
    quantity: { min: 1, max: 10000 },
    fields: [
      photo("Photograph", true),
      text("message", "Your message (optional)", "text-1", 120),
      text("occasion", "Occasion / date (optional)", "text-2", 180),
    ],
  },
  awards: {
    version: 1,
    categoryId: "awards",
    templates: ["trophy", "medal"],
    quantity: { min: 1, max: 10000 },
    fields: [
      photo("Photo / logo", false),
      text("recipient", "Recipient / organisation", "text-1", 120),
      text("achievement", "Achievement / award message", "text-2", 180),
    ],
  },
  keychains: {
    version: 1,
    categoryId: "keychains",
    templates: ["keychain"],
    quantity: { min: 1, max: 10000 },
    fields: [
      photo("Photo / logo", false),
      text("name", "Name / short message", "text-1", 120),
      text("additional", "Additional text (optional)", "text-2", 180),
    ],
  },
  "id-cards": {
    version: 1,
    categoryId: "id-cards",
    templates: ["id-card"],
    quantity: { min: 1, max: 10000 },
    fields: [
      photo("Photograph / logo", false),
      text("display-name", "Display name", "text-1", 120),
      text("organisation", "Organisation / designation", "text-2", 180),
    ],
  },
  "name-plates": {
    version: 1,
    categoryId: "name-plates",
    templates: ["name-plate"],
    quantity: { min: 1, max: 10000 },
    fields: [
      photo("Logo / artwork", false),
      text("name", "Name / family / business", "text-1", 120),
      text("designation", "House number / designation", "text-2", 180),
    ],
  },
  other: {
    version: 1,
    categoryId: "other",
    templates: ["keepsake"],
    quantity: { min: 1, max: 10000 },
    fields: [
      photo("Photo / logo", false),
      text("personalisation", "Personalisation text", "text-1", 120),
      text("additional", "Additional text (optional)", "text-2", 180),
    ],
  },
};

type DefinitionProduct = { id: string; categoryId: CategoryId };

const productOverrides: Record<
  string,
  Partial<Omit<CustomizationDefinition, "version" | "categoryId">>
> = {};

function assertId(value: string, what: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(value))
    throw new Error(`Invalid ${what} id: ${value}`);
}

export function validateCustomizationDefinition(
  input: CustomizationDefinition,
): CustomizationDefinition {
  if (input.version !== CUSTOMIZATION_CONTRACT_VERSION)
    throw new Error("Unsupported customization contract version.");
  if (!input.templates.length)
    throw new Error("Customization definition requires a template.");
  if (
    !Number.isInteger(input.quantity.min) ||
    !Number.isInteger(input.quantity.max) ||
    input.quantity.min < 1 ||
    input.quantity.max < input.quantity.min ||
    input.quantity.max > 10000
  )
    throw new Error("Invalid customization quantity rule.");

  const ids = new Set<string>();
  const slots = new Set<LegacySlot>();
  for (const field of input.fields) {
    assertId(field.id, "field");
    if (ids.has(field.id))
      throw new Error(`Duplicate customization field: ${field.id}`);
    ids.add(field.id);

    if (!field.label.trim() || field.label.length > 100)
      throw new Error(`Invalid label for customization field: ${field.id}`);

    if (field.legacySlot) {
      if (slots.has(field.legacySlot))
        throw new Error(`Duplicate legacy slot: ${field.legacySlot}`);
      slots.add(field.legacySlot);
    }

    if (field.kind === "text") {
      const min = field.minLength ?? 0;
      const max = field.maxLength ?? 500;
      if (
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        min < 0 ||
        max < min ||
        max > 2000
      )
        throw new Error(`Invalid text limits for customization field: ${field.id}`);
    }

    if ((field.kind === "photo" || field.kind === "logo") && field.legacySlot !== "artwork")
      throw new Error("Version 1 image fields must use the artwork legacy slot.");

    for (const condition of field.visibility ?? []) {
      assertId(condition.fieldId, "visibility field");
      if (condition.fieldId === field.id)
        throw new Error(`Customization field cannot depend on itself: ${field.id}`);
    }
  }

  for (const field of input.fields)
    for (const condition of field.visibility ?? [])
      if (!ids.has(condition.fieldId))
        throw new Error(
          `Unknown visibility dependency ${condition.fieldId} for ${field.id}`,
        );

  return input;
}

export function getCustomizationDefinition(
  product: DefinitionProduct,
): CustomizationDefinition {
  const base = categoryCustomizationDefinitions[product.categoryId];
  const override = productOverrides[product.id];
  const merged: CustomizationDefinition = override
    ? {
        ...base,
        ...override,
        version: 1,
        categoryId: product.categoryId,
        quantity: override.quantity ?? base.quantity,
        templates: override.templates ?? base.templates,
        fields: override.fields ?? base.fields,
      }
    : base;
  return validateCustomizationDefinition(merged);
}

export function legacyTextFields(definition: CustomizationDefinition) {
  const bySlot = new Map(
    definition.fields
      .filter((field) => field.legacySlot === "text-1" || field.legacySlot === "text-2")
      .map((field) => [field.legacySlot, field] as const),
  );
  return [bySlot.get("text-1"), bySlot.get("text-2")] as const;
}

export function requiredArtworkField(definition: CustomizationDefinition) {
  return definition.fields.find(
    (field) => field.legacySlot === "artwork" && field.required,
  );
}
