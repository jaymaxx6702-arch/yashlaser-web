import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

type ReviewUpdateBody = {
  status?: unknown;
  verifiedPurchase?: unknown;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;

  let body: ReviewUpdateBody | null;
  try {
    body = await readJsonBody<ReviewUpdateBody>(request, 4 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }

  const status =
    body?.status === "published" || body?.status === "rejected"
      ? body.status
      : "";
  const verifiedPurchase =
    typeof body?.verifiedPurchase === "boolean"
      ? body.verifiedPurchase
      : false;

  if (!/^[0-9a-f-]{36}$/i.test(id) || !status)
    return NextResponse.json(
      { error: "Invalid review update." },
      { status: 400 },
    );

  const db = getSupabase();
  const { error } = await db
    .from("shop_reviews")
    .update({
      status,
      verified_purchase: verifiedPurchase,
    })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
