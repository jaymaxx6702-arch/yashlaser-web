import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status =
    body?.status === "published" || body?.status === "rejected"
      ? body.status
      : "";

  if (!/^[0-9a-f-]{36}$/i.test(id) || !status)
    return NextResponse.json(
      { error: "Invalid review update." },
      { status: 400 },
    );

  const db = getSupabase();
  const { error } = await db.from("shop_reviews").update({ status }).eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
