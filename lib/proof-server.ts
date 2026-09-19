import "server-only";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";

export async function getProofByToken(token: string) {
  const db = getSupabase();
  const { data: proof, error } = await db
    .from("shop_proofs")
    .select("id,order_id,version_no,status,file_path,file_name,mime_type,note,created_at,approved_at")
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();
  if (error || !proof) return null;

  const { data: order } = await db
    .from("shop_orders")
    .select("order_no,status,payment_status")
    .eq("id", proof.order_id)
    .maybeSingle();
  if (!order) return null;

  const { data: latest } = await db
    .from("shop_proofs")
    .select("id,version_no")
    .eq("order_id", proof.order_id)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: signed } = await db.storage
    .from("shop-proofs")
    .createSignedUrl(proof.file_path, 600);

  return {
    proof,
    order,
    latest: latest || null,
    signedUrl: signed?.signedUrl || null,
    isLatest: latest?.id === proof.id,
  };
}
