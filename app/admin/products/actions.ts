"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import {
  nextProductAdminRevision,
  validateProductAdminDraft,
} from "@/lib/product-admin";

function readDraft(form: FormData) {
  const raw = String(form.get("product") || "");
  if (!raw || raw.length > 200_000) throw new Error("Invalid product draft.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Product draft must be valid JSON.");
  }
  return validateProductAdminDraft(parsed);
}

export async function saveProductAdminDraft(form: FormData) {
  const admin = await requireAdmin();
  const draft = readDraft(form);
  const db = getSupabase();

  const { data: revisions, error: readError } = await db
    .from("shop_product_admin_versions")
    .select("revision")
    .eq("product_key", draft.productKey)
    .order("revision", { ascending: false })
    .limit(100);

  if (readError) throw new Error("Unable to read product revisions.");
  const revision = nextProductAdminRevision(revisions ?? []);

  const { error } = await db.from("shop_product_admin_versions").insert({
    product_key: draft.productKey,
    base_product_id: draft.baseProductId ?? null,
    slug: draft.slug,
    name: draft.name,
    category_id: draft.categoryId,
    subcategory_id: draft.subcategoryId ?? null,
    revision,
    state: "draft",
    product_payload: draft,
    validation_report: { ok: true, issues: [] },
    created_by: admin.id,
  });

  if (error) throw new Error("Unable to save product draft.");
  revalidatePath("/admin/products");
  redirect(
    "/admin/products?product_key=" +
      encodeURIComponent(draft.productKey) +
      "&saved=1",
  );
}

export async function publishProductAdminVersion(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid product version.");

  const db = getSupabase();
  const { data, error } = await db
    .from("shop_product_admin_versions")
    .select("id,product_key,product_payload,validation_report,state")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Product version not found.");
  validateProductAdminDraft(data.product_payload);
  if (data.validation_report?.ok !== true)
    throw new Error("Product version has not passed validation.");

  const { error: publishError } = await db.rpc(
    "publish_shop_product_admin_version",
    { p_version_id: id, p_admin_id: admin.id },
  );
  if (publishError) throw new Error("Unable to publish product version.");

  revalidatePath("/admin/products");
  redirect(
    "/admin/products?product_key=" +
      encodeURIComponent(data.product_key) +
      "&published=1",
  );
}
