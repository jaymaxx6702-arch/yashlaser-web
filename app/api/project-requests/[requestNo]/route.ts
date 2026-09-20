import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";
import {
  consumeRequestRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ requestNo: string }> },
) {
  if (!(await consumeRequestRateLimit(request, "project_track_ip", 40, 600)))
    return rateLimitResponse(600);

  const { requestNo } = await context.params;
  const token = new URL(request.url).searchParams.get("token")?.trim() || "";

  if (
    !requestNo ||
    requestNo.length > 40 ||
    token.length < 20 ||
    token.length > 100
  )
    return NextResponse.json(
      { error: "Invalid project request details." },
      { status: 400 },
    );

  const db = getSupabase();
  const { data, error } = await db
    .from("shop_project_requests")
    .select(
      "request_no,request_type,status,payload,customer_message,responded_at,created_at,updated_at,quote_id",
    )
    .eq("request_no", requestNo)
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();

  if (error)
    return NextResponse.json(
      { error: "Unable to load project request." },
      { status: 500 },
    );

  if (!data)
    return NextResponse.json(
      { error: "Request was not found or the secure link is invalid." },
      { status: 404 },
    );

  let quote: null | {
    quoteNo: string;
    status: string;
    totalMinor: number | null;
    validUntil: string | null;
  } = null;

  if (data.quote_id) {
    const { data: quoteRow } = await db
      .from("shop_quotes")
      .select("quote_no,status,total_minor,valid_until")
      .eq("id", data.quote_id)
      .maybeSingle();

    if (quoteRow) {
      quote = {
        quoteNo: quoteRow.quote_no,
        status: quoteRow.status,
        totalMinor: quoteRow.total_minor,
        validUntil: quoteRow.valid_until,
      };
    }
  }

  return NextResponse.json(
    {
      requestNo: data.request_no,
      requestType: data.request_type,
      status: data.status,
      payload: data.payload,
      customerMessage: data.customer_message,
      respondedAt: data.responded_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      quote,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
