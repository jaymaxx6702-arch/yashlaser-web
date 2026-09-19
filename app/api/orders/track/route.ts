import { NextResponse } from "next/server";
import { commerceOrdersEnabled, trackCommerceOrder } from "@/lib/commerce-server";

export async function POST(request: Request) {
  if (!commerceOrdersEnabled())
    return NextResponse.json(
      { error: "Order tracking is not enabled yet." },
      { status: 503 },
    );
  const body = await request.json().catch(() => null);
  const orderNo = typeof body?.orderNo === "string" ? body.orderNo.trim().slice(0, 40) : "";
  const token = typeof body?.token === "string" ? body.token.trim().slice(0, 100) : "";
  if (!orderNo || token.length < 20)
    return NextResponse.json({ error: "Invalid tracking details." }, { status: 400 });
  const result = await trackCommerceOrder(orderNo, token);
  if (!result)
    return NextResponse.json({ error: "Order not found or link is invalid." }, { status: 404 });
  return NextResponse.json(result);
}
