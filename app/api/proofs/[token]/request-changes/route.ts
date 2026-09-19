import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : "";
  if (!comment) return NextResponse.json({ error: "Please describe the required change." }, { status: 400 });
  const db = getSupabase();
  const { data: proof } = await db
    .from("shop_proofs")
    .select("id,order_id,version_no,status")
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();
  if (!proof) return NextResponse.json({ error: "Proof link is invalid." }, { status: 404 });

  const { data: latest } = await db
    .from("shop_proofs")
    .select("id")
    .eq("order_id", proof.order_id)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest || latest.id !== proof.id || proof.status !== "ready")
    return NextResponse.json({ error: "A newer proof is available or this proof is no longer actionable." }, { status: 409 });

  await db.from("shop_proofs").update({ status: "changes_requested" }).eq("id", proof.id);
  await db.from("shop_proof_actions").insert({
    proof_id: proof.id,
    action: "changes_requested",
    comment,
    actor: "customer",
  });
  await db.from("shop_order_events").insert({
    order_id: proof.order_id,
    event_type: "proof_changes_requested",
    note: comment,
    source: "customer",
  });
  return NextResponse.json({ ok: true });
}
