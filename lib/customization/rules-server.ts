import "server-only";

import { products, type Product } from "@/data/catalog";
import {
  getCustomizationDefinition,
  validateCustomizationDefinition,
  type CustomizationDefinition,
} from "@/lib/customization/contract";
import { getSupabase } from "@/lib/supabase";

export type CustomizationRuleStatus = "draft" | "published" | "archived";

export type StoredCustomizationRule = {
  id: string;
  productId: string;
  categoryId: Product["categoryId"];
  revision: number;
  status: CustomizationRuleStatus;
  definition: CustomizationDefinition;
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
};

type RuleRow = {
  id: string;
  product_id: string;
  category_id: Product["categoryId"];
  revision: number;
  status: CustomizationRuleStatus;
  definition: unknown;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
};

export function findCustomizationProduct(productId: string) {
  return products.find((product) => product.id === productId) ?? null;
}

export function validateProductCustomizationDefinition(
  productId: string,
  input: unknown,
) {
  const product = findCustomizationProduct(productId);
  if (!product) throw new Error("Unknown catalogue product.");

  const definition = validateCustomizationDefinition(input);
  if (definition.categoryId !== product.categoryId)
    throw new Error("Customization category does not match the product.");

  return { product, definition };
}

function parseRuleRow(row: RuleRow): StoredCustomizationRule {
  const { definition } = validateProductCustomizationDefinition(
    row.product_id,
    row.definition,
  );
  if (row.category_id !== definition.categoryId)
    throw new Error("Stored customization category does not match definition.");
  return {
    id: row.id,
    productId: row.product_id,
    categoryId: row.category_id,
    revision: row.revision,
    status: row.status,
    definition,
    createdBy: row.created_by,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export async function getCustomizationRuleState(productId: string) {
  const product = findCustomizationProduct(productId);
  if (!product) throw new Error("Unknown catalogue product.");

  const { data, error } = await getSupabase()
    .from("shop_customization_rules")
    .select(
      "id,product_id,category_id,revision,status,definition,created_by,published_at,created_at",
    )
    .eq("product_id", productId)
    .order("revision", { ascending: false })
    .limit(25);

  if (error) throw new Error(error.message);

  const history = ((data ?? []) as RuleRow[]).map(parseRuleRow);
  return {
    product,
    baseDefinition: getCustomizationDefinition(product),
    published: history.find((rule) => rule.status === "published") ?? null,
    latestDraft: history.find((rule) => rule.status === "draft") ?? null,
    history,
  };
}

export async function writeCustomizationRule(input: {
  productId: string;
  definition: unknown;
  status: "draft" | "published";
  adminUserId: string;
}) {
  const { product, definition } = validateProductCustomizationDefinition(
    input.productId,
    input.definition,
  );

  const { data, error } = await getSupabase().rpc(
    "write_shop_customization_rule",
    {
      p_product_id: product.id,
      p_category_id: product.categoryId,
      p_definition: definition,
      p_status: input.status,
      p_created_by: input.adminUserId,
    },
  );

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Customization rule write returned no row.");

  return parseRuleRow(row as RuleRow);
}

export async function getPublishedCustomizationDefinition(product: Product) {
  const { data, error } = await getSupabase()
    .from("shop_customization_rules")
    .select(
      "id,product_id,category_id,revision,status,definition,created_by,published_at,created_at",
    )
    .eq("product_id", product.id)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data
    ? parseRuleRow(data as RuleRow).definition
    : getCustomizationDefinition(product);
}
