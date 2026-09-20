import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!(await consumeRequestRateLimit(request, "proof_action_ip", 20, 600)))
    return rateLimitResponse(600);

  const body = await request.json().catch(() => ({}));
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
  const db = getSupabase();
  const { data: proof } = await db
    .from("shop_proofs")
    .select("id,order_id,version_no,status")
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();
  if (!proof) return NextResponse.json({ error: "Proof link is invalid." }, { status: 404 });

  const { data: latest } = await db
    .from("shop_proofs")
    .select("id,version_no")
    .eq("order_id", proof.order_id)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest || latest.id !== proof.id || proof.status !== "ready")
    return NextResponse.json({ error: "A newer proof is available. Please review the latest version." }, { status: 409 });

  const now = new Date().toISOString();
  const { error } = await db
    .from("shop_proofs")
    .update({ status: "approved", approved_at: now })
    .eq("id", proof.id)
    .eq("status", "ready");
  if (error) return NextResponse.json({ error: "Unable to approve proof." }, { status: 500 });

  await db.from("shop_proof_actions").insert({
    proof_id: proof.id,
    action: "approved",
    comment: comment || null,
    actor: "customer",
  });
  await db.from("shop_order_events").insert({
    order_id: proof.order_id,
    event_type: "proof_approved",
    note: `Proof v${proof.version_no} approved`,
    source: "customer",
  });
  return NextResponse.json({ ok: true });
}
