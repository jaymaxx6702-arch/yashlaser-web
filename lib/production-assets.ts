import "server-only";

import { getSupabase } from "@/lib/supabase";

function safeExtension(path: string) {
  const match = path.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  const ext = match?.[1] || "bin";
  return ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "bin";
}

export async function createProductionSourceFromApprovedProof(orderId: string) {
  const db = getSupabase();

  const { data: order, error: orderError } = await db
    .from("shop_orders")
    .select("id,order_no,status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) throw new Error("Order not found.");
  if (!["proof", "production"].includes(order.status))
    throw new Error("Order is not ready for production handoff.");

  const { data: proof, error: proofError } = await db
    .from("shop_proofs")
    .select("id,version_no,status,file_path,file_name,mime_type,approved_at")
    .eq("order_id", orderId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (proofError || !proof) throw new Error("Latest proof is unavailable.");
  if (proof.status !== "approved" || !proof.approved_at)
    throw new Error("Customer approval is required before production.");

  const { data: proofAsset, error: proofAssetError } = await db
    .from("shop_order_assets")
    .select("id,file_path,file_name,mime_type,state,storage_bucket")
    .eq("proof_id", proof.id)
    .eq("asset_kind", "proof")
    .maybeSingle();

  if (
    proofAssetError ||
    !proofAsset ||
    proofAsset.state !== "approved" ||
    proofAsset.storage_bucket !== "shop-proofs"
  )
    throw new Error("Approved proof asset is not synchronized.");

  const { data: existing, error: existingError } = await db
    .from("shop_order_assets")
    .select("id,version_no,file_path,state")
    .eq("order_id", orderId)
    .eq("asset_kind", "production")
    .eq("source_asset_id", proofAsset.id)
    .neq("state", "superseded")
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error("Unable to inspect production assets.");

  if (existing) {
    if (order.status !== "production") {
      const { error: repairError } = await db
        .from("shop_orders")
        .update({ status: "production", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("status", "proof");
      if (repairError) throw new Error("Unable to update order production status.");
    }
    return {
      id: existing.id as string,
      version: existing.version_no as number,
      filePath: existing.file_path as string,
      idempotent: true,
      sourceProofVersion: proof.version_no as number,
    };
  }

  const { data: latestProduction, error: latestProductionError } = await db
    .from("shop_order_assets")
    .select("version_no")
    .eq("order_id", orderId)
    .eq("asset_kind", "production")
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestProductionError)
    throw new Error("Unable to determine production asset version.");

  const version = (latestProduction?.version_no || 0) + 1;
  const extension = safeExtension(proofAsset.file_path);
  const destination =
    `production/${orderId}/v${version}/approved-proof.${extension}`;

  const { error: copyError } = await db.storage
    .from("shop-proofs")
    .copy(proofAsset.file_path, destination);
  if (copyError) throw new Error("Unable to preserve approved production source.");

  const { data: productionAsset, error: assetError } = await db
    .from("shop_order_assets")
    .insert({
      order_id: orderId,
      order_item_id: null,
      asset_kind: "production",
      version_no: version,
      state: "ready",
      storage_bucket: "shop-proofs",
      file_path: destination,
      file_name:
        `production-${order.order_no}-v${version}.${extension}`,
      mime_type: proofAsset.mime_type || proof.mime_type || null,
      source_asset_id: proofAsset.id,
      proof_id: proof.id,
    })
    .select("id")
    .single();

  if (assetError || !productionAsset) {
    await db.storage.from("shop-proofs").remove([destination]);
    throw new Error("Unable to register production source.");
  }

  const { error: supersedeError } = await db
    .from("shop_order_assets")
    .update({ state: "superseded", updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("asset_kind", "production")
    .neq("id", productionAsset.id)
    .in("state", ["draft", "ready", "approved"]);

  if (supersedeError) {
    await db.from("shop_order_assets").delete().eq("id", productionAsset.id);
    await db.storage.from("shop-proofs").remove([destination]);
    throw new Error("Unable to supersede previous production source.");
  }

  const { error: orderUpdateError } = await db
    .from("shop_orders")
    .update({ status: "production", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .in("status", ["proof", "production"]);

  if (orderUpdateError) {
    await db.from("shop_order_assets").delete().eq("id", productionAsset.id);
    await db.storage.from("shop-proofs").remove([destination]);
    throw new Error("Unable to move order into production.");
  }

  const { error: eventError } = await db.from("shop_order_events").insert({
    order_id: orderId,
    event_type: "production_source_created",
    from_status: order.status,
    to_status: "production",
    source: "admin",
    note:
      `Production source v${version} created from approved proof v${proof.version_no}`,
    payload: {
      productionAssetId: productionAsset.id,
      sourceProofId: proof.id,
      sourceProofVersion: proof.version_no,
      productionVersion: version,
    },
  });

  if (eventError) {
    await db
      .from("shop_orders")
      .update({ status: order.status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "production");
    await db.from("shop_order_assets").delete().eq("id", productionAsset.id);
    await db.storage.from("shop-proofs").remove([destination]);
    throw new Error("Unable to record production handoff.");
  }

  return {
    id: productionAsset.id as string,
    version,
    filePath: destination,
    idempotent: false,
    sourceProofVersion: proof.version_no as number,
  };
}
