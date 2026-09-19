import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { newAccessToken, tokenHash } from "@/lib/commerce-server";

export async function POST(request: Request) {
  if (process.env.SUPPORT_ENABLED !== "true")
    return NextResponse.json(
      { error: "Online support tickets are not enabled yet." },
      { status: 503 },
    );

  const body = await request.json().catch(() => null);
  const name =
    typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const mobile =
    typeof body?.mobile === "string"
      ? body.mobile.trim().slice(0, 20)
      : "";
  const email =
    typeof body?.email === "string"
      ? body.email.trim().slice(0, 160)
      : "";
  const subject =
    typeof body?.subject === "string"
      ? body.subject.trim().slice(0, 160)
      : "";
  const message =
    typeof body?.message === "string"
      ? body.message.trim().slice(0, 3000)
      : "";
  const category =
    typeof body?.category === "string"
      ? body.category.trim().slice(0, 60)
      : "general";

  if (
    name.length < 2 ||
    mobile.replace(/\D/g, "").length < 10 ||
    !subject ||
    !message
  )
    return NextResponse.json(
      { error: "Please complete the required support details." },
      { status: 400 },
    );

  const token = newAccessToken();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_support_tickets")
    .insert({
      access_token_hash: tokenHash(token),
      customer_name: name,
      customer_mobile: mobile,
      customer_email: email || null,
      category,
      subject,
      message,
    })
    .select("ticket_no")
    .single();

  if (error || !data)
    return NextResponse.json(
      { error: error?.message || "Unable to create ticket." },
      { status: 500 },
    );

  return NextResponse.json({ ticketNo: data.ticket_no, token });
}
