import type { CategoryId } from "@/data/catalog";

export const productAdminStates = ["draft", "published", "archived"] as const;
export type ProductAdminState = (typeof productAdminStates)[number];

export type ProductAdminVariant = {
  id: string;
  name: string;
  priceMinor: number;
  effectivePriceMinor: number;
  available: boolean;
};

export type ProductAdminDraft = {
  productKey: string;
  baseProductId?: string;
  slug: string;
  name: string;
  categoryId: CategoryId;
  subcategoryId?: string;
  pricingMode: "fixed" | "from" | "quote_required";
  currency: "INR";
  priceMinor: number;
  effectivePriceMinor: number;
  description: string;
  details: string;
  variants: ProductAdminVariant[];
};

const categories = new Set<CategoryId>([
  "standees",
  "awards",
  "keychains",
  "id-cards",
  "name-plates",
  "other",
]);

function text(value: unknown, max: number, label: string) {
  if (typeof value !== "string") throw new Error("Invalid " + label + ".");
  const parsed = value.trim();
  if (!parsed || parsed.length > max) throw new Error("Invalid " + label + ".");
  return parsed;
}

function optionalText(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error("Invalid optional text.");
  const parsed = value.trim();
  if (parsed.length > max) throw new Error("Optional text is too long.");
  return parsed || undefined;
}

function money(value: unknown, label: string) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 100_000_000
  )
    throw new Error("Invalid " + label + ".");
  return value;
}

export function slugifyAdminProduct(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export function validateProductAdminDraft(input: unknown): ProductAdminDraft {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid product draft.");
  const value = input as Record<string, unknown>;

  const productKey = text(value.productKey, 120, "product key");
  if (!/^[a-z0-9][a-z0-9-]{2,119}$/.test(productKey))
    throw new Error("Invalid product key.");

  const slug = text(value.slug, 120, "slug");
  if (slug !== slugifyAdminProduct(slug))
    throw new Error("Invalid product slug.");

  const name = text(value.name, 180, "product name");
  const categoryId = value.categoryId as CategoryId;
  if (!categories.has(categoryId)) throw new Error("Invalid product category.");

  const pricingMode = value.pricingMode;
  if (
    pricingMode !== "fixed" &&
    pricingMode !== "from" &&
    pricingMode !== "quote_required"
  )
    throw new Error("Invalid pricing mode.");

  if (!Array.isArray(value.variants) || value.variants.length > 100)
    throw new Error("Invalid product variants.");

  const ids = new Set<string>();
  const variants = value.variants.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw new Error("Invalid variant.");
    const variant = entry as Record<string, unknown>;
    const id = text(variant.id, 80, "variant id");
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(id))
      throw new Error("Invalid variant id.");
    if (ids.has(id)) throw new Error("Duplicate variant id.");
    ids.add(id);
    const priceMinor = money(variant.priceMinor, "variant price");
    const effectivePriceMinor = money(
      variant.effectivePriceMinor,
      "variant effective price",
    );
    if (effectivePriceMinor > priceMinor && priceMinor > 0)
      throw new Error("Variant effective price cannot exceed regular price.");
    if (typeof variant.available !== "boolean")
      throw new Error("Invalid variant availability.");
    return {
      id,
      name: text(variant.name, 100, "variant name"),
      priceMinor,
      effectivePriceMinor,
      available: variant.available,
    };
  });

  const priceMinor = money(value.priceMinor, "price");
  const effectivePriceMinor = money(value.effectivePriceMinor, "effective price");
  if (effectivePriceMinor > priceMinor && priceMinor > 0)
    throw new Error("Effective price cannot exceed regular price.");

  if (pricingMode !== "quote_required" && !variants.length && effectivePriceMinor < 1)
    throw new Error("Sellable product requires a price or variant.");

  return {
    productKey,
    ...(optionalText(value.baseProductId, 160)
      ? { baseProductId: optionalText(value.baseProductId, 160) }
      : {}),
    slug,
    name,
    categoryId,
    ...(optionalText(value.subcategoryId, 120)
      ? { subcategoryId: optionalText(value.subcategoryId, 120) }
      : {}),
    pricingMode,
    currency: "INR",
    priceMinor,
    effectivePriceMinor,
    description:
      typeof value.description === "string"
        ? value.description.trim().slice(0, 4000)
        : "",
    details:
      typeof value.details === "string"
        ? value.details.trim().slice(0, 12000)
        : "",
    variants,
  };
}

export function nextProductAdminRevision(
  rows: readonly { revision: number }[],
) {
  return rows.reduce((max, row) => Math.max(max, row.revision), 0) + 1;
}
