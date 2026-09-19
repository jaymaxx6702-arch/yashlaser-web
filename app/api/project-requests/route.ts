import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { newAccessToken, tokenHash } from "@/lib/commerce-server";

const allowedTypes = new Set(["bulk", "event", "custom_acrylic"]);
const clean = (value: unknown, max = 1000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (process.env.PROJECT_REQUESTS_ENABLED !== "true")
    return NextResponse.json(
      { error: "Online project requests are not enabled yet." },
      { status: 503 },
    );

  const body = await request.json().catch(() => null);
  const requestType = clean(body?.requestType, 40);
  const name = clean(body?.customer?.name, 80);
  const mobile = clean(body?.customer?.mobile, 20);
  const email = clean(body?.customer?.email, 160);

  if (
    !allowedTypes.has(requestType) ||
    name.length < 2 ||
    mobile.replace(/\D/g, "").length < 10
  )
    return NextResponse.json(
      { error: "Please check your contact details." },
      { status: 400 },
    );

  const token = newAccessToken();
  const rawPayload =
    body?.payload && typeof body.payload === "object" ? body.payload : {};
  const encoded = JSON.stringify(rawPayload);
  if (encoded.length > 12000)
    return NextResponse.json({ error: "Request details are too large." }, { status: 400 });

  const db = getSupabase();
  const { data, error } = await db
    .from("shop_project_requests")
    .insert({
      request_type: requestType,
      customer_name: name,
      customer_mobile: mobile,
      customer_email: email || null,
      payload: rawPayload,
      access_token_hash: tokenHash(token),
    })
    .select("id,request_no")
    .single();

  if (error || !data)
    return NextResponse.json(
      { error: error?.message || "Unable to save request." },
      { status: 500 },
    );

  return NextResponse.json({ requestNo: data.request_no, token });
}
