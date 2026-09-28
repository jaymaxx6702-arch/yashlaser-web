import "server-only";

import { getSupabase } from "@/lib/supabase";
import type { OrderAssetState } from "@/lib/order-assets";

export async function registerProofAsset(input: {
  orderId: string;
  proofId: string;
  versionNo: number;
  filePath: string;
  fileName: string | null;
  mimeType: string | null;
}) {
  const db = getSupabase();
  const { error } = await db.from("shop_order_assets").insert({
    order_id: input.orderId,
    order_item_id: null,
    asset_kind: "proof",
    version_no: input.versionNo,
    state: "ready",
    storage_bucket: "shop-proofs",
    file_path: input.filePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    proof_id: input.proofId,
  });
  if (error) throw new Error("Unable to register proof asset.");
}
 
export async function supersedePreviousProofAssets(
  orderId: string,
  proofId: string,
) {
  const db = getSupabase();
  const { error } = await db
    .from("shop_order_assets")
    .update({ state: "superseded", updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("asset_kind", "proof")
    .neq("proof_id", proofId)
    .in("state", ["ready", "changes_requested"]);

  if (error) throw new Error("Unable to supersede previous proof assets.");
}

export async function syncProofAssetState(
  proofId: string,
  state: Extract<OrderAssetState, "approved" | "changes_requested">,
  approvedAt: string | null = null,
) {
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_order_assets")
    .update({
      state,
      approved_at: state === "approved" ? approvedAt : null,
      updated_at: new Date().toISOString(),
    })
    .eq("proof_id", proofId)
    .eq("asset_kind", "proof")
    .in("state", ["ready", "changes_requested"])
    .select("id")
    .maybeSingle();

  if (error) throw new Error("Unable to update proof asset state.");
  return Boolean(data);
}
