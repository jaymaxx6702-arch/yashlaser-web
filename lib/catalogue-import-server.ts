import "server-only";

import type { ProductAdminDraft } from "@/lib/product-admin";
import { getSupabase } from "@/lib/supabase";

const CHUNK = 100;

export type CatalogueImportState = {
  productKey: string;
  latestRevision: number | null;
  latestState: string | null;
  unchanged: boolean;
};

function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return "[" + value.map((item) => canonicalJson(item)).join(",") + "]";
  if (value && typeof value === "object") {
    return (
      "{" +
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => JSON.stringify(key) + ":" + canonicalJson(item))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value);
}

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

export async function inspectCatalogueImportState(
  drafts: readonly ProductAdminDraft[],
): Promise<CatalogueImportState[]> {
  const db = getSupabase();
  const latest = new Map<
    string,
    { revision: number; state: string; productPayload: unknown }
  >();

  for (let offset = 0; offset < drafts.length; offset += CHUNK) {
    const chunk = drafts.slice(offset, offset + CHUNK);
    const keys = chunk.map((draft) => draft.productKey);
    if (!keys.length) continue;

    const { data, error } = await db
      .from("shop_product_admin_versions")
      .select("product_key,revision,state,product_payload")
      .in("product_key", keys)
      .order("revision", { ascending: false });

    if (error) throw new Error("Unable to inspect current product revisions.");

    for (const row of data ?? []) {
      const current = latest.get(row.product_key);
      if (!current || row.revision > current.revision) {
        latest.set(row.product_key, {
          revision: row.revision,
          state: row.state,
          productPayload: row.product_payload,
        });
      }
    }
  }

  return drafts.map((draft) => {
    const current = latest.get(draft.productKey);
    return {
      productKey: draft.productKey,
      latestRevision: current?.revision ?? null,
      latestState: current?.state ?? null,
      unchanged:
        Boolean(current) &&
        canonicalJson(current?.productPayload) === canonicalJson(draft),
    };
  });
}

export async function importProductAdminDrafts(
  drafts: readonly ProductAdminDraft[],
  adminId: string,
) {
  const db = getSupabase();
  const importState = await inspectCatalogueImportState(drafts);
  const byKey = new Map(importState.map((item) => [item.productKey, item]));
  const changedDrafts = drafts.filter(
    (draft) => !byKey.get(draft.productKey)?.unchanged,
  );

  const importedAt = new Date().toISOString();
  const rows = changedDrafts.map((draft) => {
    const state = byKey.get(draft.productKey);
    const revision = (state?.latestRevision ?? 0) + 1;

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

  if (rows.length) {
    const { error } = await db.from("shop_product_admin_versions").insert(rows);
    if (error) {
      if (error.code === "23505")
        throw new Error(
          "A product revision changed during import. Preview the CSV again and retry.",
        );
      throw new Error("Unable to import product drafts.");
    }
  }

  return {
    rows,
    skippedUnchanged: drafts.length - changedDrafts.length,
  };
}
