import type { CategoryId } from "@/data/catalog";
import type { CustomizationProduct } from "@/lib/customization";
import type { TemplateId } from "./model";

export type CustomFieldKind =
  | "text"
  | "date"
  | "photo"
  | "logo"
  | "qr"
  | "number"
  | "choice";

export type CustomFieldRule = {
  id: string;
  kind: CustomFieldKind;
  label: string;
  required: boolean;
  maxLength?: number;
  slot?: "primary" | "secondary";
};

export type ImageRule = {
  required: boolean;
  allowPhoto: boolean;
  allowLogo: boolean;
  allowBackgroundRemoval: boolean;
  allowEnhancement: boolean;
  minRecommendedWidth: number;
  minRecommendedHeight: number;
};

export type ProductCustomizationRule = {
  version: 1;
  categoryId: CategoryId;
  templateIds: TemplateId[];
  quantity: { min: number; max: number };
  fields: CustomFieldRule[];
  image: ImageRule;
};

const commonQuantity = { min: 1, max: 10000 } as const;

const categoryRules: Record<CategoryId, ProductCustomizationRule> = {
  standees: {
    version: 1,
    categoryId: "standees",
    templateIds: ["standee"],
    quantity: commonQuantity,
    fields: [
      {
        id: "message",
        kind: "text",
        label: "Your message (optional)",
        required: false,
        maxLength: 120,
        slot: "primary",
      },
      {
        id: "occasion",
        kind: "text",
        label: "Occasion / date (optional)",
        required: false,
        maxLength: 180,
        slot: "secondary",
      },
    ],
    image: {
      required: true,
      allowPhoto: true,
      allowLogo: false,
      allowBackgroundRemoval: true,
      allowEnhancement: true,
      minRecommendedWidth: 1200,
      minRecommendedHeight: 1200,
    },
  },
  awards: {
    version: 1,
    categoryId: "awards",
    templateIds: ["trophy", "medal"],
    quantity: commonQuantity,
    fields: [
      {
        id: "recipient",
        kind: "text",
        label: "Recipient / organisation",
        required: true,
        maxLength: 120,
        slot: "primary",
      },
      {
        id: "achievement",
        kind: "text",
        label: "Achievement / award message",
        required: true,
        maxLength: 180,
        slot: "secondary",
      },
    ],
    image: {
      required: false,
      allowPhoto: true,
      allowLogo: true,
      allowBackgroundRemoval: true,
      allowEnhancement: true,
      minRecommendedWidth: 1000,
      minRecommendedHeight: 1000,
    },
  },
  keychains: {
    version: 1,
    categoryId: "keychains",
    templateIds: ["keychain"],
    quantity: commonQuantity,
    fields: [
      {
        id: "name",
        kind: "text",
        label: "Name / short message",
        required: false,
        maxLength: 120,
        slot: "primary",
      },
      {
        id: "extra",
        kind: "text",
        label: "Additional text (optional)",
        required: false,
        maxLength: 180,
        slot: "secondary",
      },
    ],
    image: {
      required: false,
      allowPhoto: true,
      allowLogo: true,
      allowBackgroundRemoval: true,
      allowEnhancement: true,
      minRecommendedWidth: 900,
      minRecommendedHeight: 900,
    },
  },
  "id-cards": {
    version: 1,
    categoryId: "id-cards",
    templateIds: ["id-card"],
    quantity: commonQuantity,
    fields: [
      {
        id: "displayName",
        kind: "text",
        label: "Display name",
        required: true,
        maxLength: 120,
        slot: "primary",
      },
      {
        id: "designation",
        kind: "text",
        label: "Organisation / designation",
        required: false,
        maxLength: 180,
        slot: "secondary",
      },
    ],
    image: {
      required: true,
      allowPhoto: true,
      allowLogo: true,
      allowBackgroundRemoval: true,
      allowEnhancement: true,
      minRecommendedWidth: 900,
      minRecommendedHeight: 1200,
    },
  },
  "name-plates": {
    version: 1,
    categoryId: "name-plates",
    templateIds: ["name-plate"],
    quantity: commonQuantity,
    fields: [
      {
        id: "name",
        kind: "text",
        label: "Name / family / business",
        required: true,
        maxLength: 120,
        slot: "primary",
      },
      {
        id: "designation",
        kind: "text",
        label: "House number / designation",
        required: false,
        maxLength: 180,
        slot: "secondary",
      },
    ],
    image: {
      required: false,
      allowPhoto: true,
      allowLogo: true,
      allowBackgroundRemoval: true,
      allowEnhancement: true,
      minRecommendedWidth: 1200,
      minRecommendedHeight: 800,
    },
  },
  other: {
    version: 1,
    categoryId: "other",
    templateIds: ["keepsake"],
    quantity: commonQuantity,
    fields: [
      {
        id: "personalisation",
        kind: "text",
        label: "Personalisation text",
        required: false,
        maxLength: 120,
        slot: "primary",
      },
      {
        id: "extra",
        kind: "text",
        label: "Additional text (optional)",
        required: false,
        maxLength: 180,
        slot: "secondary",
      },
    ],
    image: {
      required: false,
      allowPhoto: true,
      allowLogo: true,
      allowBackgroundRemoval: true,
      allowEnhancement: true,
      minRecommendedWidth: 1000,
      minRecommendedHeight: 1000,
    },
  },
};

export function customizationRuleFor(
  product: Pick<CustomizationProduct, "categoryId">,
): ProductCustomizationRule {
  return categoryRules[product.categoryId];
}

export function validateCustomizationRule(rule: ProductCustomizationRule) {
  if (rule.version !== 1) throw new Error("Unsupported customization rule version.");
  if (rule.quantity.min < 1 || rule.quantity.max < rule.quantity.min)
    throw new Error("Invalid quantity rule.");
  if (!rule.templateIds.length) throw new Error("At least one template is required.");
  const ids = new Set<string>();
  for (const field of rule.fields) {
    if (!field.id || ids.has(field.id)) throw new Error("Customization field IDs must be unique.");
    ids.add(field.id);
    if (field.kind === "text" && (!field.maxLength || field.maxLength < 1))
      throw new Error("Text fields require a max length.");
  }
  return rule;
}


function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid customization rule.");
  return value as Record<string, unknown>;
}

function asBoolean(value: unknown) {
  if (typeof value !== "boolean") throw new Error("Invalid customization rule.");
  return value;
}

function asInteger(value: unknown, min: number, max: number) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new Error("Invalid customization rule.");
  return value;
}

function asString(value: unknown, max: number) {
  if (typeof value !== "string" || !value || value.length > max)
    throw new Error("Invalid customization rule.");
  return value;
}

export function parseCustomizationRule(input: unknown): ProductCustomizationRule {
  const root = asRecord(input);
  if (root.version !== 1) throw new Error("Unsupported customization rule version.");
  const categoryId = asString(root.categoryId, 40) as CategoryId;
  if (!Object.hasOwn(categoryRules, categoryId))
    throw new Error("Unknown customization category.");

  if (!Array.isArray(root.templateIds) || root.templateIds.length < 1 || root.templateIds.length > 20)
    throw new Error("Invalid template list.");
  const allowedTemplates = new Set(categoryRules[categoryId].templateIds);
  const templateIds = root.templateIds.map((value) => {
    const id = asString(value, 60) as TemplateId;
    if (!allowedTemplates.has(id)) throw new Error("Template is not allowed for this category.");
    return id;
  });

  const quantityInput = asRecord(root.quantity);
  const quantity = {
    min: asInteger(quantityInput.min, 1, 10000),
    max: asInteger(quantityInput.max, 1, 10000),
  };
  if (quantity.max < quantity.min) throw new Error("Invalid quantity rule.");

  if (!Array.isArray(root.fields) || root.fields.length > 40)
    throw new Error("Invalid field list.");
  const kinds = new Set<CustomFieldKind>([
    "text",
    "date",
    "photo",
    "logo",
    "qr",
    "number",
    "choice",
  ]);
  const fields = root.fields.map((value) => {
    const field = asRecord(value);
    const kind = asString(field.kind, 20) as CustomFieldKind;
    if (!kinds.has(kind)) throw new Error("Unknown customization field kind.");
    const slot =
      field.slot === undefined
        ? undefined
        : field.slot === "primary" || field.slot === "secondary"
          ? field.slot
          : (() => {
              throw new Error("Invalid customization text slot.");
            })();
    const maxLength =
      field.maxLength === undefined
        ? undefined
        : asInteger(field.maxLength, 1, 3000);
    return {
      id: asString(field.id, 80),
      kind,
      label: asString(field.label, 160),
      required: asBoolean(field.required),
      ...(maxLength === undefined ? {} : { maxLength }),
      ...(slot === undefined ? {} : { slot }),
    } satisfies CustomFieldRule;
  });

  const imageInput = asRecord(root.image);
  const image: ImageRule = {
    required: asBoolean(imageInput.required),
    allowPhoto: asBoolean(imageInput.allowPhoto),
    allowLogo: asBoolean(imageInput.allowLogo),
    allowBackgroundRemoval: asBoolean(imageInput.allowBackgroundRemoval),
    allowEnhancement: asBoolean(imageInput.allowEnhancement),
    minRecommendedWidth: asInteger(imageInput.minRecommendedWidth, 1, 25000),
    minRecommendedHeight: asInteger(imageInput.minRecommendedHeight, 1, 25000),
  };

  return validateCustomizationRule({
    version: 1,
    categoryId,
    templateIds,
    quantity,
    fields,
    image,
  });
}
