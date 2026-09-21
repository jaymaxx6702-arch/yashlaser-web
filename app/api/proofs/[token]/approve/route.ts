import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!(await consumeRequestRateLimit(request, "proof_action_ip", 20, 600)))
    return rateLimitResponse(600);

  let body: { comment?: unknown } | null;
  try {
    body = await readJsonBody<{ comment?: unknown }>(request, 4 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }
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
  const { data: updated, error } = await db
    .from("shop_proofs")
    .update({ status: "approved", approved_at: now })
    .eq("id", proof.id)
    .eq("status", "ready")
    .select("id")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Unable to approve proof." },
      { status: 500 },
    );
  if (!updated)
    return NextResponse.json(
      { error: "This proof is no longer actionable. Refresh and review the latest status." },
      { status: 409 },
    );

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
