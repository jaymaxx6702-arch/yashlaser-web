import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";
import {
  consumeRequestRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ ticketNo: string }> },
) {
  if (!(await consumeRequestRateLimit(request, "support_track_ip", 40, 600)))
    return rateLimitResponse(600);

  const { ticketNo } = await context.params;
  const token = new URL(request.url).searchParams.get("token")?.trim() || "";

  if (!ticketNo || ticketNo.length > 40 || token.length < 20 || token.length > 100)
    return NextResponse.json(
      { error: "Invalid support ticket details." },
      { status: 400 },
    );

  const db = getSupabase();
  const { data, error } = await db
    .from("shop_support_tickets")
    .select(
      "ticket_no,status,category,subject,message,admin_response,responded_at,created_at,order_id",
    )
    .eq("ticket_no", ticketNo)
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();

  if (error)
    return NextResponse.json(
      { error: "Unable to load support ticket." },
      { status: 500 },
    );

  if (!data)
    return NextResponse.json(
      { error: "Support ticket was not found or the secure link is invalid." },
      { status: 404 },
    );

  return NextResponse.json(
    {
      ticketNo: data.ticket_no,
      status: data.status,
      category: data.category,
      subject: data.subject,
      message: data.message,
      adminResponse: data.admin_response,
      respondedAt: data.responded_at,
      createdAt: data.created_at,
      orderLinked: Boolean(data.order_id),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
