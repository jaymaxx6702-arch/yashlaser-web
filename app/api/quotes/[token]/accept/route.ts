import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!(await consumeRequestRateLimit(request, "quote_accept_ip", 20, 600)))
    return rateLimitResponse(600);

  const db = getSupabase();

  const { data } = await db
    .from("shop_quotes")
    .select("id,status,valid_until")
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();

  if (!data)
    return NextResponse.json(
      { error: "Quote link is invalid." },
      { status: 404 },
    );

  if (data.status !== "sent")
    return NextResponse.json(
      { error: "Quote is no longer awaiting acceptance." },
      { status: 409 },
    );

  if (
    data.valid_until &&
    data.valid_until < new Date().toISOString().slice(0, 10)
  )
    return NextResponse.json(
      { error: "Quote has expired." },
      { status: 409 },
    );

  const { error } = await db
    .from("shop_quotes")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .eq("status", "sent");

  if (error)
    return NextResponse.json(
      { error: "Unable to accept quote." },
      { status: 500 },
    );

  return NextResponse.json({ ok: true });
}
