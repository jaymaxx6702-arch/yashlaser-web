import "server-only";

import type { ProductAdminDraft } from "@/lib/product-admin";
import { getSupabase } from "@/lib/supabase";

const CHUNK = 100;

export async function findPublishedSlugConflicts(
  drafts: readonly ProductAdminDraft[],
) {
  const db = getSupabase();
  const conflicts: { productKey: string; message: string }[] = [];

  for (let offset = 0; offset < drafts.length; offset += CHUNK) {
    const chunk = drafts.slice(offset, offset + CHUNK);
    const slugs = [...new Set(chunk.map((draft) => draft.slug))];
    if (!slugs.length) continue;

    const { data, error } = await db
      .from("shop_product_admin_versions")
      .select("product_key,slug")
      .eq("state", "published")
      .in("slug", slugs);

    if (error) throw new Error("Unable to verify published product slugs.");

    for (const row of data ?? []) {
      for (const draft of chunk) {
        if (draft.slug === row.slug && draft.productKey !== row.product_key) {
          conflicts.push({
            productKey: draft.productKey,
            message:
              'Slug "' +
              draft.slug +
              '" is already published by product ' +
              row.product_key +
              ".",
          });
        }
      }
    }
  }

  return conflicts;
}

export async function importProductAdminDrafts(
  drafts: readonly ProductAdminDraft[],
  adminId: string,
) {
  const db = getSupabase();
  const latestRevision = new Map<string, number>();

  for (let offset = 0; offset < drafts.length; offset += CHUNK) {
    const keys = drafts
      .slice(offset, offset + CHUNK)
      .map((draft) => draft.productKey);

    const { data, error } = await db
      .from("shop_product_admin_versions")
      .select("product_key,revision")
      .in("product_key", keys)
      .order("revision", { ascending: false });

    if (error) throw new Error("Unable to read current product revisions.");

    for (const row of data ?? []) {
      const current = latestRevision.get(row.product_key) ?? 0;
      latestRevision.set(row.product_key, Math.max(current, row.revision));
    }
  }

  const importedAt = new Date().toISOString();
  const rows = drafts.map((draft) => {
    const revision = (latestRevision.get(draft.productKey) ?? 0) + 1;
    latestRevision.set(draft.productKey, revision);

    return {
      product_key: draft.productKey,
      base_product_id: draft.baseProductId ?? null,
      slug: draft.slug,
      name: draft.name,
      category_id: draft.categoryId,
      subcategory_id: draft.subcategoryId ?? null,
      revision,
      state: "draft",
      product_payload: draft,
      validation_report: {
        ok: true,
        issues: [],
        source: "csv_import",
        imported_at: importedAt,
      },
      created_by: adminId,
    };
  });

  const { error } = await db.from("shop_product_admin_versions").insert(rows);
  if (error) {
    if (error.code === "23505")
      throw new Error(
        "A product revision changed during import. Preview the CSV again and retry.",
      );
    throw new Error("Unable to import product drafts.");
  }

  return rows;
}
