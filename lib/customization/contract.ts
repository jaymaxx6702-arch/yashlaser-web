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
  | "name"
  | "date"
  | "qr"
  | "color"
  | "choice"
  | "number";

export type LegacySlot = "artwork" | "text-1" | "text-2";
export type FieldValue = string | number | boolean | null;

export type FieldVisibilityRule = {
  fieldId: string;
  operator: "equals" | "not-equals" | "present" | "not-present";
  value?: FieldValue;
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

const categories: readonly CategoryId[] = [
  "standees",
  "awards",
  "keychains",
  "id-cards",
  "name-plates",
  "other",
];

const templateIds: readonly TemplateId[] = [
  "standee",
  "trophy",
  "medal",
  "keychain",
  "id-card",
  "name-plate",
  "keepsake",
];

const fieldKinds: readonly CustomizationFieldKind[] = [
  "photo",
  "logo",
  "text",
  "name",
  "date",
  "qr",
  "color",
  "choice",
  "number",
];

const legacySlots: readonly LegacySlot[] = ["artwork", "text-1", "text-2"];
const visibilityOperators: readonly FieldVisibilityRule["operator"][] = [
  "equals",
  "not-equals",
  "present",
  "not-present",
];
const mimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const aiModes = ["disabled", "optional"] as const;

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
  allowedMimeTypes: mimeTypes,
  maxBytes: 8 * 1024 * 1024,
  maxPixels: 25_000_000,
  ai: imagePolicy,
});

const text = (
  id: string,
  label: string,
  slot: "text-1" | "text-2",
  maxLength: number,
  kind: "text" | "name" = "text",
): CustomizationFieldRule => ({
  id,
  kind,
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
      text("recipient", "Recipient / organisation", "text-1", 120, "name"),
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
      text("name", "Name / short message", "text-1", 120, "name"),
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
      text("display-name", "Display name", "text-1", 120, "name"),
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
      text("name", "Name / family / business", "text-1", 120, "name"),
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

function record(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(message);
  return value as Record<string, unknown>;
}

function member<T extends string>(
  value: unknown,
  allowed: readonly T[],
  message: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T))
    throw new Error(message);
  return value as T;
}

function integer(
  value: unknown,
  min: number,
  max: number,
  message: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new Error(message);
  return value;
}

function optionalInteger(
  value: unknown,
  min: number,
  max: number,
  message: string,
) {
  return value === undefined ? undefined : integer(value, min, max, message);
}

function id(value: unknown, what: string) {
  if (
    typeof value !== "string" ||
    !/^[a-z0-9][a-z0-9-]{0,79}$/.test(value)
  )
    throw new Error(`Invalid ${what} id.`);
  return value;
}

function fieldValue(value: unknown): FieldValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  throw new Error("Invalid field visibility value.");
}

function parseVisibility(value: unknown): FieldVisibilityRule[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 10)
    throw new Error("Invalid field visibility rules.");
  return value.map((entry) => {
    const rule = record(entry, "Invalid field visibility rule.");
    const operator = member(
      rule.operator,
      visibilityOperators,
      "Invalid field visibility operator.",
    );
    return {
      fieldId: id(rule.fieldId, "visibility field"),
      operator,
      ...(operator === "equals" || operator === "not-equals"
        ? { value: fieldValue(rule.value) }
        : {}),
    };
  });
}

function parseAi(value: unknown): AiFieldPolicy | undefined {
  if (value === undefined) return undefined;
  const ai = record(value, "Invalid AI field policy.");
  return {
    backgroundRemoval: member(
      ai.backgroundRemoval,
      aiModes,
      "Invalid background-removal policy.",
    ),
    enhancement: member(
      ai.enhancement,
      aiModes,
      "Invalid enhancement policy.",
    ),
    smartCrop: member(ai.smartCrop, aiModes, "Invalid smart-crop policy."),
  };
}

function parseField(value: unknown): CustomizationFieldRule {
  const field = record(value, "Invalid customization field rule.");
  const fieldId = id(field.id, "field");
  const kind = member(field.kind, fieldKinds, "Invalid customization field kind.");
  if (
    typeof field.label !== "string" ||
    !field.label.trim() ||
    field.label.length > 100
  )
    throw new Error(`Invalid label for customization field: ${fieldId}`);
  if (typeof field.required !== "boolean")
    throw new Error(`Invalid required rule for customization field: ${fieldId}`);

  const legacySlot =
    field.legacySlot === undefined
      ? undefined
      : member(field.legacySlot, legacySlots, "Invalid legacy slot.");

  const minLength = optionalInteger(
    field.minLength,
    0,
    2000,
    `Invalid minLength for customization field: ${fieldId}`,
  );
  const maxLength = optionalInteger(
    field.maxLength,
    0,
    2000,
    `Invalid maxLength for customization field: ${fieldId}`,
  );
  if (
    minLength !== undefined &&
    maxLength !== undefined &&
    maxLength < minLength
  )
    throw new Error(`Invalid text limits for customization field: ${fieldId}`);

  let choices: string[] | undefined;
  if (field.choices !== undefined) {
    if (
      !Array.isArray(field.choices) ||
      field.choices.length < 1 ||
      field.choices.length > 100 ||
      field.choices.some(
        (choice) =>
          typeof choice !== "string" || !choice.trim() || choice.length > 100,
      )
    )
      throw new Error(`Invalid choices for customization field: ${fieldId}`);
    choices = [...new Set(field.choices as string[])];
    if (choices.length !== field.choices.length)
      throw new Error(`Duplicate choices for customization field: ${fieldId}`);
  }
  if (kind === "choice" && !choices)
    throw new Error(`Choice field requires choices: ${fieldId}`);

  const min =
    field.min === undefined
      ? undefined
      : typeof field.min === "number" && Number.isFinite(field.min)
        ? field.min
        : NaN;
  const max =
    field.max === undefined
      ? undefined
      : typeof field.max === "number" && Number.isFinite(field.max)
        ? field.max
        : NaN;
  if (
    Number.isNaN(min) ||
    Number.isNaN(max) ||
    (min !== undefined && max !== undefined && max < min)
  )
    throw new Error(`Invalid numeric limits for customization field: ${fieldId}`);

  let allowedMimeTypes:
    | ("image/jpeg" | "image/png" | "image/webp")[]
    | undefined;
  if (field.allowedMimeTypes !== undefined) {
    if (!Array.isArray(field.allowedMimeTypes) || !field.allowedMimeTypes.length)
      throw new Error(`Invalid mime types for customization field: ${fieldId}`);
    allowedMimeTypes = field.allowedMimeTypes.map((mime) =>
      member(mime, mimeTypes, "Invalid customization image mime type."),
    );
  }

  const maxBytes = optionalInteger(
    field.maxBytes,
    1,
    50 * 1024 * 1024,
    `Invalid maxBytes for customization field: ${fieldId}`,
  );
  const maxPixels = optionalInteger(
    field.maxPixels,
    1,
    100_000_000,
    `Invalid maxPixels for customization field: ${fieldId}`,
  );

  if (
    (kind === "photo" || kind === "logo") &&
    legacySlot !== undefined &&
    legacySlot !== "artwork"
  )
    throw new Error("Version 1 image fields must use the artwork legacy slot.");
  if (
    (legacySlot === "text-1" || legacySlot === "text-2") &&
    kind !== "text" &&
    kind !== "name" &&
    kind !== "date" &&
    kind !== "qr"
  )
    throw new Error("Version 1 text slots require a text-compatible field.");

  return {
    id: fieldId,
    kind,
    label: field.label,
    required: field.required,
    ...(legacySlot ? { legacySlot } : {}),
    ...(minLength !== undefined ? { minLength } : {}),
    ...(maxLength !== undefined ? { maxLength } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(choices ? { choices } : {}),
    ...(allowedMimeTypes ? { allowedMimeTypes } : {}),
    ...(maxBytes !== undefined ? { maxBytes } : {}),
    ...(maxPixels !== undefined ? { maxPixels } : {}),
    ...(parseVisibility(field.visibility)
      ? { visibility: parseVisibility(field.visibility) }
      : {}),
    ...(parseAi(field.ai) ? { ai: parseAi(field.ai) } : {}),
  };
}

export function validateCustomizationDefinition(
  input: unknown,
): CustomizationDefinition {
  const definition = record(input, "Invalid customization definition.");
  if (definition.version !== CUSTOMIZATION_CONTRACT_VERSION)
    throw new Error("Unsupported customization contract version.");

  const categoryId = member(
    definition.categoryId,
    categories,
    "Invalid customization category.",
  );

  if (
    !Array.isArray(definition.templates) ||
    definition.templates.length < 1 ||
    definition.templates.length > templateIds.length
  )
    throw new Error("Customization definition requires a valid template list.");
  const templates = definition.templates.map((template) =>
    member(template, templateIds, "Invalid customization template."),
  );
  if (new Set(templates).size !== templates.length)
    throw new Error("Customization templates must be unique.");

  const quantity = record(
    definition.quantity,
    "Invalid customization quantity rule.",
  );
  const quantityRule = {
    min: integer(quantity.min, 1, 10000, "Invalid customization quantity rule."),
    max: integer(quantity.max, 1, 10000, "Invalid customization quantity rule."),
  };
  if (quantityRule.max < quantityRule.min)
    throw new Error("Invalid customization quantity rule.");

  if (!Array.isArray(definition.fields) || definition.fields.length > 50)
    throw new Error("Invalid customization fields.");
  const fields = definition.fields.map(parseField);

  const ids = new Set<string>();
  const slots = new Set<LegacySlot>();
  for (const field of fields) {
    if (ids.has(field.id))
      throw new Error(`Duplicate customization field: ${field.id}`);
    ids.add(field.id);
    if (field.legacySlot) {
      if (slots.has(field.legacySlot))
        throw new Error(`Duplicate legacy slot: ${field.legacySlot}`);
      slots.add(field.legacySlot);
    }
  }

  for (const field of fields)
    for (const condition of field.visibility ?? []) {
      if (condition.fieldId === field.id)
        throw new Error(`Customization field cannot depend on itself: ${field.id}`);
      if (!ids.has(condition.fieldId))
        throw new Error(
          `Unknown visibility dependency ${condition.fieldId} for ${field.id}`,
        );
    }

  return {
    version: 1,
    categoryId,
    templates,
    quantity: quantityRule,
    fields,
  };
}

export function getCustomizationDefinition(
  product: DefinitionProduct,
): CustomizationDefinition {
  const base = categoryCustomizationDefinitions[product.categoryId];
  const override = productOverrides[product.id];
  return validateCustomizationDefinition(
    override
      ? {
          ...base,
          ...override,
          version: 1,
          categoryId: product.categoryId,
          quantity: override.quantity ?? base.quantity,
          templates: override.templates ?? base.templates,
          fields: override.fields ?? base.fields,
        }
      : base,
  );
}

export function legacyTextFields(definition: CustomizationDefinition) {
  const bySlot = new Map(
    definition.fields
      .filter(
        (field) =>
          field.legacySlot === "text-1" || field.legacySlot === "text-2",
      )
      .map((field) => [field.legacySlot, field] as const),
  );
  return [bySlot.get("text-1"), bySlot.get("text-2")] as const;
}

export function requiredArtworkField(definition: CustomizationDefinition) {
  return definition.fields.find(
    (field) => field.legacySlot === "artwork" && field.required,
  );
}

export function isFieldVisible(
  field: CustomizationFieldRule,
  values: Readonly<Record<string, FieldValue>>,
) {
  return (field.visibility ?? []).every((rule) => {
    const value = values[rule.fieldId] ?? null;
    if (rule.operator === "present")
      return value !== null && value !== "" && value !== false;
    if (rule.operator === "not-present")
      return value === null || value === "" || value === false;
    if (rule.operator === "equals") return value === (rule.value ?? null);
    return value !== (rule.value ?? null);
  });
}

function scalarFieldValue(
  field: CustomizationFieldRule,
  value: unknown,
): FieldValue {
  if (field.kind === "number") {
    if (typeof value !== "number" || !Number.isFinite(value))
      throw new Error(`Invalid value for customization field: ${field.id}`);
    if (field.min !== undefined && value < field.min)
      throw new Error(`Value is below minimum for customization field: ${field.id}`);
    if (field.max !== undefined && value > field.max)
      throw new Error(`Value is above maximum for customization field: ${field.id}`);
    return value;
  }

  if (
    field.kind === "photo" ||
    field.kind === "logo"
  )
    throw new Error(
      `Image customization field ${field.id} must use the artwork pipeline.`,
    );

  if (typeof value !== "string")
    throw new Error(`Invalid value for customization field: ${field.id}`);

  const minLength = field.minLength ?? 0;
  const maxLength = field.maxLength ?? (field.kind === "qr" ? 1000 : 500);
  if (value.length < minLength || value.length > maxLength)
    throw new Error(`Invalid length for customization field: ${field.id}`);

  if (field.kind === "choice" && !field.choices?.includes(value))
    throw new Error(`Invalid choice for customization field: ${field.id}`);
  if (field.kind === "date" && value && !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error(`Invalid date for customization field: ${field.id}`);
  if (
    field.kind === "color" &&
    value &&
    !/^#[0-9a-f]{6}$/i.test(value)
  )
    throw new Error(`Invalid color for customization field: ${field.id}`);

  return value;
}

export function validateFieldValues(
  definition: CustomizationDefinition,
  input: unknown,
  options: { requireRequired?: boolean } = {},
): Record<string, FieldValue> {
  const values = record(input, "Invalid customization field values.");
  const allowed = new Map(
    definition.fields
      .filter((field) => !field.legacySlot)
      .map((field) => [field.id, field] as const),
  );

  for (const key of Object.keys(values))
    if (!allowed.has(key))
      throw new Error(`Unknown customization field value: ${key}`);

  const parsed: Record<string, FieldValue> = {};
  for (const field of allowed.values()) {
    const visible = isFieldVisible(field, {
      ...parsed,
      ...Object.fromEntries(
        Object.entries(values).filter(
          ([key, value]) =>
            allowed.has(key) &&
            (typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean" ||
              value === null),
        ),
      ),
    });
    if (!visible) continue;

    const value = values[field.id];
    const missing =
      value === undefined ||
      value === null ||
      value === "" ||
      value === false;

    if (missing) {
      if (options.requireRequired && field.required)
        throw new Error(`Required customization field is missing: ${field.id}`);
      continue;
    }

    parsed[field.id] = scalarFieldValue(field, value);
  }

  return parsed;
}
