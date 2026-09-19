import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { newAccessToken, tokenHash } from "@/lib/commerce-server";

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const filePath = typeof body?.filePath === "string" ? body.filePath : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName.slice(0, 160) : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !filePath)
    return NextResponse.json({ error: "Invalid proof request." }, { status: 400 });

  const db = getSupabase();
  const { data: order } = await db.from("shop_orders").select("id,order_no").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { data: latest } = await db
    .from("shop_proofs")
    .select("version_no")
    .eq("order_id", orderId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version_no || 0) + 1;

  await db
    .from("shop_proofs")
    .update({ status: "superseded" })
    .eq("order_id", orderId)
    .in("status", ["ready", "changes_requested"]);

  const token = newAccessToken();
  const { data: proof, error } = await db
    .from("shop_proofs")
    .insert({
      order_id: orderId,
      version_no: version,
      status: "ready",
      file_path: filePath,
      file_name: fileName || null,
      mime_type: mimeType || null,
      note: note || null,
      access_token_hash: tokenHash(token),
    })
    .select("id,version_no")
    .single();
  if (error || !proof)
    return NextResponse.json({ error: error?.message || "Unable to save proof." }, { status: 500 });

  await db.from("shop_orders").update({ status: "proof", updated_at: new Date().toISOString() }).eq("id", orderId);
  await db.from("shop_order_events").insert({
    order_id: orderId,
    event_type: "proof_ready",
    to_status: "proof",
    note: `Proof v${version} ready`,
    source: "admin",
  });

  return NextResponse.json({
    proofId: proof.id,
    version,
    customerPath: `/proof/${token}`,
    orderNo: order.order_no,
  });
}
