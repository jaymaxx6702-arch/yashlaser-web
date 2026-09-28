import type { CustomizationDefinition } from "./contract";
import { validateCustomizationDefinition } from "./contract";

export type StoredCustomizationRule = {
  id: string;
  productId: string;
  revision: number;
  status: "draft" | "published" | "archived";
  definition: CustomizationDefinition;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export function parseStoredCustomizationRule(
  value: Record<string, unknown>,
): StoredCustomizationRule {
  const id = String(value.id ?? "");
  const productId = String(value.product_id ?? "");
  const revision = Number(value.revision);
  const status = String(value.status ?? "");
  const createdAt = String(value.created_at ?? "");
  const updatedAt = String(value.updated_at ?? "");
  const publishedAt =
    value.published_at === null || value.published_at === undefined
      ? null
      : String(value.published_at);

  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error("Invalid rule id.");
  if (!productId || productId.length > 160)
    throw new Error("Invalid rule product id.");
  if (!Number.isInteger(revision) || revision < 1)
    throw new Error("Invalid rule revision.");
  if (!["draft", "published", "archived"].includes(status))
    throw new Error("Invalid rule status.");

  return {
    id,
    productId,
    revision,
    status: status as StoredCustomizationRule["status"],
    definition: validateCustomizationDefinition(value.definition),
    createdAt,
    updatedAt,
    publishedAt,
  };
}

export function nextCustomizationRuleRevision(
  rows: readonly { revision: number }[],
): number {
  return rows.reduce((max, row) => Math.max(max, row.revision), 0) + 1;
}
