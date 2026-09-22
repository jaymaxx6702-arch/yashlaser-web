import type { CustomizationProduct } from "../customization";
import { customizationRuleFor } from "./rules";
export const ENGINE_VERSION = 1;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
export type TemplateId =
  | "standee"
  | "trophy"
  | "medal"
  | "keychain"
  | "id-card"
  | "name-plate"
  | "keepsake";
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
  sourceArtwork: Artwork | null;
  image: {
    crop: Crop;
    zoom: number;
    panX: number;
    panY: number;
    fit: "contain" | "cover";
    adjustments: {
      brightness: number;
      contrast: number;
      saturation: number;
    };
  };
  text: [TextLayer, TextLayer];
  backgroundRemoval: { adapter: string | null };
};
export const categoryTemplates: Record<
  CustomizationProduct["categoryId"],
  TemplateId[]
> = {
  standees: ["standee"],
  awards: ["trophy", "medal"],
  keychains: ["keychain"],
  "id-cards": ["id-card"],
  "name-plates": ["name-plate"],
  other: ["keepsake"],
};
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function createDocument(
  p: CustomizationProduct,
  selection?: { variantId: string; quantity: number },
): CustomizationDocument {
  const rule = customizationRuleFor(p);
  return {
    version: 1,
    productId: p.id,
    categoryId: p.categoryId,
    templateId: rule.templateIds[0],
    variantId:
      selection?.variantId ?? p.variants.find((v) => v.available)?.id ?? "",
    quantity: selection?.quantity ?? 1,
    artwork: null,
    sourceArtwork: null,
    image: {
      crop: { x: 0, y: 0, width: 1, height: 1 },
      zoom: 1,
      panX: 0,
      panY: 0,
      fit: "cover",
      adjustments: {
        brightness: 1,
        contrast: 1,
        saturation: 1,
      },
    },
    text: [
      { text: "", fontSize: 32, align: "center", font: "sans" },
      { text: "", fontSize: 24, align: "center", font: "sans" },
    ],
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
function artworkValue(value: unknown): Artwork | null {
  if (value === null || value === undefined) return null;
  const a = record(value);
  const artwork: Artwork = {
    name: string(a.name, 180),
    mimeType: member(a.mimeType, ["image/jpeg", "image/png", "image/webp"]),
    bytes: numeric(a.bytes, 1, MAX_UPLOAD_BYTES),
    width: numeric(a.width, 1, MAX_IMAGE_PIXELS),
    height: numeric(a.height, 1, MAX_IMAGE_PIXELS),
    sha256: string(a.sha256, 64),
  };
  if (
    !/^[a-f0-9]{64}$/.test(artwork.sha256) ||
    !Number.isInteger(artwork.width) ||
    !Number.isInteger(artwork.height) ||
    artwork.width * artwork.height > MAX_IMAGE_PIXELS
  )
    throw new Error("Invalid artwork metadata.");
  return artwork;
}
export function validateDocument(
  input: unknown,
  p: CustomizationProduct,
): CustomizationDocument {
  const d = record(input);
  if (d.version !== 1 || d.productId !== p.id || d.categoryId !== p.categoryId)
    throw new Error("This design does not match the product.");
  const rule = customizationRuleFor(p);
  const templateId = member(d.templateId, rule.templateIds);
  const variantId = string(d.variantId, 60);
  if (
    p.variants.length
      ? !p.variants.some((v) => v.id === variantId && v.available)
      : variantId !== ""
  )
    throw new Error("Please select an available size.");
  const quantity = numeric(d.quantity, rule.quantity.min, rule.quantity.max);
  if (!Number.isInteger(quantity))
    throw new Error("Quantity must be a whole number.");
  const image = record(d.image),
    crop = record(image.crop);
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
  const adjustmentInput =
    image.adjustments === undefined ? {} : record(image.adjustments);
  const adjustments = {
    brightness:
      adjustmentInput.brightness === undefined
        ? 1
        : numeric(adjustmentInput.brightness, 0.5, 1.5),
    contrast:
      adjustmentInput.contrast === undefined
        ? 1
        : numeric(adjustmentInput.contrast, 0.5, 1.5),
    saturation:
      adjustmentInput.saturation === undefined
        ? 1
        : numeric(adjustmentInput.saturation, 0.5, 1.5),
  };
  if (!Array.isArray(d.text) || d.text.length !== 2)
    throw new Error("Invalid text layers.");
  const textRules = rule.fields.filter((field) => field.kind === "text");
  const text = d.text.map((entry, i) => {
    const t = record(entry);
    return {
      text: string(t.text, textRules[i]?.maxLength ?? (i === 0 ? 120 : 180)),
      fontSize: numeric(t.fontSize, 14, 60),
      align: member(t.align, ["left", "center", "right"]),
      font: member(t.font, ["sans", "serif", "mono"]),
    };
  }) as [TextLayer, TextLayer];
  const artwork = artworkValue(d.artwork);
  const sourceArtwork =
    d.sourceArtwork == null
      ? artwork
      : artworkValue(d.sourceArtwork);
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
    sourceArtwork,
    image: {
      crop: normalizedCrop,
      zoom: numeric(image.zoom, 1, 4),
      panX: numeric(image.panX, -1, 1),
      panY: numeric(image.panY, -1, 1),
      fit: member(image.fit, ["contain", "cover"]),
      adjustments,
    },
    text,
    backgroundRemoval: { adapter },
  };
}
export function requireReadyDocument(input: unknown, p: CustomizationProduct) {
  const d = validateDocument(input, p);
  const rule = customizationRuleFor(p);
  if (rule.image.required && !d.artwork)
    throw new Error(
      p.categoryId === "standees"
        ? "Please upload a photograph for your standee."
        : "Please upload the required artwork for this product.",
    );
  return d;
}
