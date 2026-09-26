import type { CustomizationProduct } from "../customization";
import {
  categoryCustomizationDefinitions,
  getCustomizationDefinition,
  legacyTextFields,
  requiredArtworkField,
  validateFieldValues,
  type FieldValue,
  type TemplateId,
} from "./contract";

export const ENGINE_VERSION = 1;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;

export type { TemplateId } from "./contract";

export type Crop = { x: number; y: number; width: number; height: number };

export type Artwork = {
  name: string;
  mimeType: string;
  bytes: number;
  width: number;
  height: number;
  sha256: string;
};

export type TextLayer = {
  text: string;
  fontSize: number;
  align: "left" | "center" | "right";
  font: "sans" | "serif" | "mono";
};

export type CustomizationDocument = {
  version: 1;
  productId: string;
  categoryId: CustomizationProduct["categoryId"];
  templateId: TemplateId;
  variantId: string;
  quantity: number;
  artwork: Artwork | null;
  image: {
    crop: Crop;
    zoom: number;
    panX: number;
    panY: number;
    fit: "contain" | "cover";
  };
  text: [TextLayer, TextLayer];
  fieldValues: Record<string, FieldValue>;
  backgroundRemoval: { adapter: string | null };
};

export const categoryTemplates = Object.fromEntries(
  Object.entries(categoryCustomizationDefinitions).map(
    ([categoryId, definition]) => [categoryId, [...definition.templates]],
  ),
) as Record<CustomizationProduct["categoryId"], TemplateId[]>;

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export function createDocument(
  p: CustomizationProduct,
  selection?: { variantId: string; quantity: number },
): CustomizationDocument {
  const definition = getCustomizationDefinition(p);
  return {
    version: 1,
    productId: p.id,
    categoryId: p.categoryId,
    templateId: definition.templates[0],
    variantId:
      selection?.variantId ?? p.variants.find((v) => v.available)?.id ?? "",
    quantity: selection?.quantity ?? definition.quantity.min,
    artwork: null,
    image: {
      crop: { x: 0, y: 0, width: 1, height: 1 },
      zoom: 1,
      panX: 0,
      panY: 0,
      fit: "cover",
    },
    text: [
      { text: "", fontSize: 32, align: "center", font: "sans" },
      { text: "", fontSize: 24, align: "center", font: "sans" },
    ],
    fieldValues: {},
    backgroundRemoval: { adapter: null },
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid customization data.");
  return value as Record<string, unknown>;
}

function numeric(value: unknown, min: number, max: number) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min - 1e-9 ||
    value > max + 1e-9
  )
    throw new Error("Invalid customization value.");
  return clamp(value, min, max);
}

function string(value: unknown, max: number) {
  if (typeof value !== "string" || value.length > max)
    throw new Error("Invalid customization text.");
  return value;
}

function member<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T))
    throw new Error("Invalid customization option.");
  return value as T;
}

export function validateDocument(
  input: unknown,
  p: CustomizationProduct,
): CustomizationDocument {
  const definition = getCustomizationDefinition(p);
  const d = record(input);

  if (d.version !== 1 || d.productId !== p.id || d.categoryId !== p.categoryId)
    throw new Error("This design does not match the product.");

  const templateId = member(d.templateId, definition.templates);
  const variantId = string(d.variantId, 60);

  if (
    p.variants.length
      ? !p.variants.some((v) => v.id === variantId && v.available)
      : variantId !== ""
  )
    throw new Error("Please select an available size.");

  const quantity = numeric(
    d.quantity,
    definition.quantity.min,
    definition.quantity.max,
  );
  if (!Number.isInteger(quantity))
    throw new Error("Quantity must be a whole number.");

  const image = record(d.image);
  const crop = record(image.crop);
  const normalizedCrop = {
    x: numeric(crop.x, 0, 0.95),
    y: numeric(crop.y, 0, 0.95),
    width: numeric(crop.width, 0.05, 1),
    height: numeric(crop.height, 0.05, 1),
  };

  if (
    normalizedCrop.x + normalizedCrop.width > 1.000001 ||
    normalizedCrop.y + normalizedCrop.height > 1.000001
  )
    throw new Error("Crop is outside the photograph.");

  if (!Array.isArray(d.text) || d.text.length !== 2)
    throw new Error("Invalid text layers.");

  const textRules = legacyTextFields(definition);
  const text = d.text.map((entry, i) => {
    const t = record(entry);
    const rule = textRules[i];
    return {
      text: string(t.text, rule?.maxLength ?? (i === 0 ? 120 : 180)),
      fontSize: numeric(t.fontSize, 14, 60),
      align: member(t.align, ["left", "center", "right"]),
      font: member(t.font, ["sans", "serif", "mono"]),
    };
  }) as [TextLayer, TextLayer];

  let artwork: Artwork | null = null;
  if (d.artwork !== null) {
    const a = record(d.artwork);
    const artworkRule = definition.fields.find(
      (field) => field.legacySlot === "artwork",
    );
    const allowedMimeTypes =
      artworkRule?.allowedMimeTypes ??
      (["image/jpeg", "image/png", "image/webp"] as const);
    const maxBytes = artworkRule?.maxBytes ?? MAX_UPLOAD_BYTES;
    const maxPixels = artworkRule?.maxPixels ?? MAX_IMAGE_PIXELS;

    artwork = {
      name: string(a.name, 180),
      mimeType: member(a.mimeType, allowedMimeTypes),
      bytes: numeric(a.bytes, 1, maxBytes),
      width: numeric(a.width, 1, maxPixels),
      height: numeric(a.height, 1, maxPixels),
      sha256: string(a.sha256, 64),
    };

    if (
      !/^[a-f0-9]{64}$/.test(artwork.sha256) ||
      !Number.isInteger(artwork.width) ||
      !Number.isInteger(artwork.height) ||
      artwork.width * artwork.height > maxPixels
    )
      throw new Error("Invalid artwork metadata.");
  }

  const fieldValues = validateFieldValues(
    definition,
    d.fieldValues === undefined ? {} : d.fieldValues,
  );

  const removal = record(d.backgroundRemoval);
  const adapter = removal.adapter === null ? null : string(removal.adapter, 80);

  return {
    version: 1,
    productId: p.id,
    categoryId: p.categoryId,
    templateId,
    variantId,
    quantity,
    artwork,
    image: {
      crop: normalizedCrop,
      zoom: numeric(image.zoom, 1, 4),
      panX: numeric(image.panX, -1, 1),
      panY: numeric(image.panY, -1, 1),
      fit: member(image.fit, ["contain", "cover"]),
    },
    text,
    fieldValues,
    backgroundRemoval: { adapter },
  };
}

export function requireReadyDocument(input: unknown, p: CustomizationProduct) {
  const d = validateDocument(input, p);
  const definition = getCustomizationDefinition(p);
  validateFieldValues(definition, d.fieldValues, { requireRequired: true });
  const requiredArtwork = requiredArtworkField(definition);
  if (requiredArtwork && !d.artwork) {
    const label = requiredArtwork.label.toLowerCase();
    throw new Error(
      p.categoryId === "standees"
        ? "Please upload a photograph for your standee."
        : `Please upload ${label} before continuing.`,
    );
  }
  return d;
}
