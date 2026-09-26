import type { ProductAdminDraft, ProductAdminVariant } from "./product-admin";
import { validateProductAdminDraft } from "./product-admin";

const columns = [
  "product_key",
  "base_product_id",
  "name",
  "slug",
  "category_id",
  "subcategory_id",
  "pricing_mode",
  "price_minor",
  "effective_price_minor",
  "description",
  "details",
  "variant_id",
  "variant_name",
  "variant_price_minor",
  "variant_effective_price_minor",
  "variant_available",
] as const;

type Column = (typeof columns)[number];

function spreadsheetSafe(value: string) {
  return /^[=+@\-]/.test(value) ? "'" + value : value;
}

function csvCell(value: unknown) {
  const safe = spreadsheetSafe(String(value ?? ""));
  return '"' + safe.replaceAll('"', '""') + '"';
}

function parseRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const ch = csv[i];
    if (quoted) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((current) => current.some((value) => value !== ""));
}

function number(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0)
    throw new Error("Invalid " + label + ".");
  return parsed;
}

function bool(value: string) {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0" || value === "") return false;
  throw new Error("Invalid variant availability.");
}

export function catalogueDraftsToCsv(drafts: readonly ProductAdminDraft[]) {
  const rows: string[][] = [columns.map(String)];

  for (const draft of drafts) {
    const variants: (ProductAdminVariant | null)[] = draft.variants.length
      ? [...draft.variants]
      : [null];

    for (const variant of variants) {
      rows.push([
        draft.productKey,
        draft.baseProductId ?? "",
        draft.name,
        draft.slug,
        draft.categoryId,
        draft.subcategoryId ?? "",
        draft.pricingMode,
        String(draft.priceMinor),
        String(draft.effectivePriceMinor),
        draft.description,
        draft.details,
        variant?.id ?? "",
        variant?.name ?? "",
        variant ? String(variant.priceMinor) : "",
        variant ? String(variant.effectivePriceMinor) : "",
        variant ? String(variant.available) : "",
      ]);
    }
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function parseCatalogueCsv(csv: string): ProductAdminDraft[] {
  if (!csv.trim()) throw new Error("CSV is empty.");
  const rows = parseRows(csv);
  if (rows.length < 2) throw new Error("CSV has no product rows.");

  const header = rows[0].map((value) => value.trim()) as Column[];
  if (
    header.length !== columns.length ||
    columns.some((column, index) => header[index] !== column)
  )
    throw new Error("CSV header does not match the YashLaser catalogue template.");

  const index = Object.fromEntries(
    columns.map((column, position) => [column, position]),
  ) as Record<Column, number>;

  const grouped = new Map<string, string[][]>();
  for (const row of rows.slice(1)) {
    if (row.length > columns.length)
      throw new Error("CSV row has too many columns.");
    while (row.length < columns.length) row.push("");
    const key = row[index.product_key].trim();
    if (!key) throw new Error("CSV product_key is required.");
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  const drafts: ProductAdminDraft[] = [];
  for (const [productKey, group] of grouped) {
    const first = group[0];
    const variants = group
      .filter((row) => row[index.variant_id].trim())
      .map((row) => ({
        id: row[index.variant_id].trim(),
        name: row[index.variant_name].trim(),
        priceMinor: number(
          row[index.variant_price_minor],
          "variant price",
        ),
        effectivePriceMinor: number(
          row[index.variant_effective_price_minor],
          "variant effective price",
        ),
        available: bool(row[index.variant_available].trim()),
      }));

    const candidate = {
      productKey,
      baseProductId: first[index.base_product_id].trim() || undefined,
      name: first[index.name].trim(),
      slug: first[index.slug].trim(),
      categoryId: first[index.category_id].trim(),
      subcategoryId: first[index.subcategory_id].trim() || undefined,
      pricingMode: first[index.pricing_mode].trim(),
      currency: "INR",
      priceMinor: number(first[index.price_minor], "price"),
      effectivePriceMinor: number(
        first[index.effective_price_minor],
        "effective price",
      ),
      description: first[index.description],
      details: first[index.details],
      variants,
    };

    for (const row of group.slice(1)) {
      for (const column of [
        "base_product_id",
        "name",
        "slug",
        "category_id",
        "subcategory_id",
        "pricing_mode",
        "price_minor",
        "effective_price_minor",
        "description",
        "details",
      ] as const) {
        if (row[index[column]] !== first[index[column]])
          throw new Error(
            `Product ${productKey} has conflicting ${column} values.`,
          );
      }
    }

    drafts.push(validateProductAdminDraft(candidate));
  }

  return drafts;
}
