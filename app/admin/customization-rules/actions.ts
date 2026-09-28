"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { products } from "@/data/catalog";
import { getSupabase } from "@/lib/supabase";
import {
  nextCustomizationRuleRevision,
  parseStoredCustomizationRule,
} from "@/lib/customization/admin-rules";
import { validateCustomizationDefinition } from "@/lib/customization/contract";

function productId(form: FormData) {
  const value = String(form.get("product_id") || "").trim();
  if (!/^[a-z0-9][a-z0-9-]{0,159}$/i.test(value))
    throw new Error("Invalid product id.");
  return value;
}

function definition(form: FormData) {
  const raw = String(form.get("definition") || "");
  if (!raw || raw.length > 100_000) throw new Error("Invalid rule definition.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Rule definition must be valid JSON.");
  }
  return validateCustomizationDefinition(parsed);
}

export async function saveCustomizationRuleDraft(form: FormData) {
  await requireAdmin();
  const product = productId(form);
  const parsed = definition(form);
  const catalogueProduct = products.find((item) => item.id === product);
  if (!catalogueProduct) throw new Error("Unknown product id.");
  if (parsed.categoryId !== catalogueProduct.categoryId)
    throw new Error("Rule category does not match product category.");
  const db = getSupabase();

  const { data: rows, error: readError } = await db
    .from("shop_customization_rules")
    .select("revision")
    .eq("product_id", product)
    .order("revision", { ascending: false })
    .limit(100);
  if (readError) throw new Error("Unable to read customization revisions.");

  const revision = nextCustomizationRuleRevision(rows ?? []);
  const { error } = await db.from("shop_customization_rules").insert({
    product_id: product,
    revision,
    status: "draft",
    definition: parsed,
  });
  if (error) throw new Error("Unable to save customization draft.");

  revalidatePath("/admin/customization-rules");
  redirect(
    "/admin/customization-rules?product_id=" +
      encodeURIComponent(product) +
      "&saved=1",
  );
}

export async function publishCustomizationRule(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "");
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error("Invalid rule id.");
  const db = getSupabase();

  const { data, error } = await db
    .from("shop_customization_rules")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error("Customization rule not found.");
  const rule = parseStoredCustomizationRule(data);

  const catalogueProduct = products.find(
    (item) => item.id === rule.productId,
  );
  if (!catalogueProduct) throw new Error("Unknown product id.");
  if (rule.definition.categoryId !== catalogueProduct.categoryId)
    throw new Error("Rule category does not match product category.");

  const { error: publishError } = await db.rpc(
    "publish_shop_customization_rule",
    { p_rule_id: rule.id },
  );
  if (publishError) throw new Error("Unable to publish customization rule.");

  revalidatePath("/admin/customization-rules");
  redirect(
    "/admin/customization-rules?product_id=" +
      encodeURIComponent(rule.productId) +
      "&published=1",
  );
}
