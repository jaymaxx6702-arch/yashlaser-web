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

export type CatalogueCsvIssue = {
  productKey: string | null;
  message: string;
};

export type CatalogueCsvInspection = {
  drafts: ProductAdminDraft[];
  issues: CatalogueCsvIssue[];
};

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
  const source = csv.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
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

export function inspectCatalogueCsv(csv: string): CatalogueCsvInspection {
  if (!csv.trim()) return { drafts: [], issues: [{ productKey: null, message: "CSV is empty." }] };

  let rows: string[][];
  try {
    rows = parseRows(csv);
  } catch (error) {
    return {
      drafts: [],
      issues: [
        {
          productKey: null,
          message: error instanceof Error ? error.message : "Invalid CSV.",
        },
      ],
    };
  }

  if (rows.length < 2)
    return {
      drafts: [],
      issues: [{ productKey: null, message: "CSV has no product rows." }],
    };

  const header = rows[0].map((value) => value.trim()) as Column[];
  if (
    header.length !== columns.length ||
    columns.some((column, index) => header[index] !== column)
  )
    return {
      drafts: [],
      issues: [
        {
          productKey: null,
          message: "CSV header does not match the YashLaser catalogue template.",
        },
      ],
    };

  const index = Object.fromEntries(
    columns.map((column, position) => [column, position]),
  ) as Record<Column, number>;

  const grouped = new Map<string, string[][]>();
  const issues: CatalogueCsvIssue[] = [];

  for (const row of rows.slice(1)) {
    if (row.length > columns.length) {
      issues.push({ productKey: null, message: "A CSV row has too many columns." });
      continue;
    }
    while (row.length < columns.length) row.push("");
    const key = row[index.product_key].trim();
    if (!key) {
      issues.push({ productKey: null, message: "CSV product_key is required." });
      continue;
    }
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  if (grouped.size > 1000) {
    issues.push({
      productKey: null,
      message: "A single import may contain at most 1000 products.",
    });
  }

  const drafts: ProductAdminDraft[] = [];
  for (const [productKey, group] of grouped) {
    try {
      const first = group[0];
      const variants = group
        .filter((row) => row[index.variant_id].trim())
        .map((row) => ({
          id: row[index.variant_id].trim(),
          name: row[index.variant_name].trim(),
          priceMinor: number(row[index.variant_price_minor], "variant price"),
          effectivePriceMinor: number(
            row[index.variant_effective_price_minor],
            "variant effective price",
          ),
          available: bool(row[index.variant_available].trim()),
        }));

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
            throw new Error("Conflicting " + column + " values.");
        }
      }

      drafts.push(
        validateProductAdminDraft({
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
        }),
      );
    } catch (error) {
      issues.push({
        productKey,
        message:
          error instanceof Error ? error.message : "Invalid product rows.",
      });
    }
  }

  const slugOwners = new Map<string, string>();
  for (const draft of drafts) {
    const owner = slugOwners.get(draft.slug);
    if (owner && owner !== draft.productKey) {
      issues.push({
        productKey: draft.productKey,
        message: `Slug "${draft.slug}" is also used by product ${owner}.`,
      });
    } else {
      slugOwners.set(draft.slug, draft.productKey);
    }
  }

  return { drafts, issues };
}

export function parseCatalogueCsv(csv: string): ProductAdminDraft[] {
  const inspection = inspectCatalogueCsv(csv);
  if (inspection.issues.length)
    throw new Error(
      inspection.issues
        .slice(0, 5)
        .map((issue) =>
          issue.productKey
            ? issue.productKey + ": " + issue.message
            : issue.message,
        )
        .join(" "),
    );
  return inspection.drafts;
}
