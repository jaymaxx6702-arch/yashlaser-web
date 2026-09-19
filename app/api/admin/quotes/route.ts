import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { newAccessToken, tokenHash } from "@/lib/commerce-server";

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => null);

  const name =
    typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const mobile =
    typeof body?.mobile === "string" ? body.mobile.trim().slice(0, 20) : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().slice(0, 160) : "";
  const items = Array.isArray(body?.items) ? body.items : [];
  const total = Number(body?.totalMinor);
  const validUntil =
    typeof body?.validUntil === "string" ? body.validUntil : null;
  const notes =
    typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";

  if (
    name.length < 2 ||
    mobile.replace(/\D/g, "").length < 10 ||
    !items.length
  )
    return NextResponse.json({ error: "Invalid quote." }, { status: 400 });

  const token = newAccessToken();
  const db = getSupabase();

  const { data, error } = await db
    .from("shop_quotes")
    .insert({
      access_token_hash: tokenHash(token),
      customer_name: name,
      customer_mobile: mobile,
      customer_email: email || null,
      source_type:
        typeof body?.sourceType === "string" ? body.sourceType : "custom",
      status: "sent",
      items,
      total_minor:
        Number.isFinite(total) && total >= 0 ? Math.round(total) : null,
      valid_until: validUntil,
      notes: notes || null,
    })
    .select("id,quote_no")
    .single();

  if (error || !data)
    return NextResponse.json(
      { error: error?.message || "Unable to create quote." },
      { status: 500 },
    );

  return NextResponse.json({
    quoteNo: data.quote_no,
    customerPath: "/quote/" + token,
  });
}
