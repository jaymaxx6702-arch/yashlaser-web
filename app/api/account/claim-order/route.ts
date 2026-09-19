import { NextResponse } from "next/server";
import { customerUser } from "@/lib/customer-auth";
import { getSupabase } from "@/lib/supabase";
import { trackCommerceOrder } from "@/lib/commerce-server";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";
import { consumeShopRateLimit } from "@/lib/rate-limit";

type ClaimBody = {
  orderNo?: unknown;
  token?: unknown;
};

export async function POST(request: Request) {
  const user = await customerUser();
  if (!user)
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );

  let body: ClaimBody | null;
  try {
    body = await readJsonBody<ClaimBody>(request, 8 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }

  const orderNo =
    typeof body?.orderNo === "string"
      ? body.orderNo.trim().slice(0, 40)
      : "";
  const token =
    typeof body?.token === "string"
      ? body.token.trim().slice(0, 100)
      : "";

  if (!orderNo || token.length < 20)
    return NextResponse.json(
      { error: "Invalid order tracking details." },
      { status: 400 },
    );

  const allowed = await consumeShopRateLimit(
    "claim_order",
    user.id,
    10,
    3600,
  );
  if (!allowed)
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );

  const tracked = await trackCommerceOrder(orderNo, token);
  if (!tracked)
    return NextResponse.json(
      { error: "Order not found or secure token is invalid." },
      { status: 404 },
    );

  const db = getSupabase();
  const { data: current } = await db
    .from("shop_orders")
    .select("customer_user_id")
    .eq("id", tracked.order.id)
    .maybeSingle();

  if (
    current?.customer_user_id &&
    current.customer_user_id !== user.id
  )
    return NextResponse.json(
      { error: "This order is already linked to another account." },
      { status: 409 },
    );

  const { error } = await db
    .from("shop_orders")
    .update({ customer_user_id: user.id })
    .eq("id", tracked.order.id);

  if (error)
    return NextResponse.json(
      { error: "Unable to add order to account." },
      { status: 500 },
    );

  return NextResponse.json({ ok: true });
}
