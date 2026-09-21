import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { newAccessToken, tokenHash } from "@/lib/commerce-server";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";
import { consumeRequestRateLimit, consumeShopRateLimit, rateLimitResponse } from "@/lib/rate-limit";

type ProjectRequestBody = {
  requestType?: unknown;
  customer?: unknown;
  payload?: unknown;
};

type ProjectCustomer = {
  name?: unknown;
  mobile?: unknown;
  email?: unknown;
};

const allowedTypes = new Set(["bulk", "event", "custom_acrylic"]);
const clean = (value: unknown, max = 1000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (!(await consumeRequestRateLimit(request, "project_request_ip", 20, 600)))
    return rateLimitResponse(600);

  if (process.env.PROJECT_REQUESTS_ENABLED !== "true")
    return NextResponse.json(
      { error: "Online project requests are not enabled yet." },
      { status: 503 },
    );

  let body: ProjectRequestBody | null;
  try {
    body = await readJsonBody<ProjectRequestBody>(request, 24 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }
  const customer =
    body?.customer && typeof body.customer === "object"
      ? (body.customer as ProjectCustomer)
      : null;
  const requestType = clean(body?.requestType, 40);
  const name = clean(customer?.name, 80);
  const mobile = clean(customer?.mobile, 20);
  const email = clean(customer?.email, 160);

  if (
    !allowedTypes.has(requestType) ||
    name.length < 2 ||
    mobile.replace(/\D/g, "").length < 10
  )
    return NextResponse.json(
      { error: "Please check your contact details." },
      { status: 400 },
    );

  const allowed = await consumeShopRateLimit(
    "project_request",
    mobile.replace(/\D/g, ""),
    5,
    600,
  );
  if (!allowed)
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
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
      { error: "Unable to save request." },
      { status: 500 },
    );

  return NextResponse.json({ requestNo: data.request_no, token });
}
