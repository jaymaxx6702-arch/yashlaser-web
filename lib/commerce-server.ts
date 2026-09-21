import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { getSupabase } from "@/lib/supabase";

export type CommerceItemInput = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPriceMinor: number | null;
  pricingMode: string;
  designId?: string | null;
  configuration?: Record<string, unknown>;
};

export const commerceOrdersEnabled = () =>
  process.env.COMMERCE_ORDERS_ENABLED === "true";

export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function newAccessToken() {
  return randomBytes(32).toString("base64url");
}

function commerceOrderToken(input: {
  requestId: string;
  customer: { name: string; phone: string; email?: string };
  shipping: Record<string, unknown>;
  items: CommerceItemInput[];
}) {
  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Commerce token secret is unavailable.");

  const fingerprint = JSON.stringify({
    requestId: input.requestId,
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email || "",
    },
    shipping: input.shipping,
    items: input.items.map((item) => ({
      productId: item.productId,
      productSlug: item.productSlug,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      pricingMode: item.pricingMode,
      designId: item.designId || null,
      configuration: item.configuration || {},
    })),
  });

  return createHmac("sha256", secret)
    .update("shop-order-v1\0")
    .update(fingerprint)
    .digest("base64url");
}

export async function createCommerceOrder(input: {
  requestId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    userId?: string | null;
  };
  shipping: Record<string, unknown>;
  items: CommerceItemInput[];
}) {
  const db = getSupabase();
  const token = commerceOrderToken(input);
  const subtotal = input.items.reduce(
    (sum, item) =>
      sum + (item.unitPriceMinor ? item.unitPriceMinor * item.quantity : 0),
    0,
  );

  const { data: existing } = await db
    .from("shop_orders")
    .select("id,order_no,access_token_hash,customer_user_id")
    .eq("request_id", input.requestId)
    .maybeSingle();

  if (existing) {
    if (input.customer.userId && !existing.customer_user_id) {
      await db
        .from("shop_orders")
        .update({ customer_user_id: input.customer.userId })
        .eq("id", existing.id)
        .is("customer_user_id", null);
    }
    return {
      id: existing.id as string,
      orderNo: existing.order_no as string,
      accessToken:
        tokenHash(token) === existing.access_token_hash
          ? token
          : (null as string | null),
      idempotent: true,
    };
  }

  const { data: order, error } = await db
    .from("shop_orders")
    .insert({
      request_id: input.requestId,
      access_token_hash: tokenHash(token),
      customer_name: input.customer.name,
      customer_mobile: input.customer.phone,
      customer_email: input.customer.email || null,
      customer_user_id: input.customer.userId || null,
      shipping_address: input.shipping,
      subtotal_minor: subtotal,
      total_minor: subtotal,
      source: "website",
    })
    .select("id,order_no")
    .single();

  if (error || !order) throw new Error(error?.message || "Order creation failed.");

  const rows = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_slug: item.productSlug,
    product_name: item.productName,
    variant_id: item.variantId,
    variant_name: item.variantName,
    quantity: item.quantity,
    unit_price_minor: item.unitPriceMinor,
    line_total_minor: item.unitPriceMinor
      ? item.unitPriceMinor * item.quantity
      : null,
    pricing_mode: item.pricingMode,
    design_id: item.designId || null,
    configuration: item.configuration || {},
  }));

  const { error: itemError } = await db.from("shop_order_items").insert(rows);
  if (itemError) {
    await db.from("shop_orders").delete().eq("id", order.id);
    throw new Error(itemError.message);
  }

  await db.from("shop_order_events").insert({
    order_id: order.id,
    event_type: "order_created",
    to_status: "received",
    source: "shop",
  });

  return {
    id: order.id as string,
    orderNo: order.order_no as string,
    accessToken: token,
    idempotent: false,
  };
}

export async function trackCommerceOrder(orderNo: string, token: string) {
  const db = getSupabase();
  const { data: order, error } = await db
    .from("shop_orders")
    .select(
      "id,order_no,status,payment_status,currency,subtotal_minor,shipping_minor,total_minor,created_at,updated_at",
    )
    .eq("order_no", orderNo)
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();

  if (error || !order) return null;

  const [{ data: items }, { data: shipments }, { data: events }] =
    await Promise.all([
      db
        .from("shop_order_items")
        .select(
          "id,product_name,variant_name,quantity,unit_price_minor,line_total_minor",
        )
        .eq("order_id", order.id)
        .order("created_at"),
      db
        .from("shop_shipments")
        .select("courier,awb,tracking_url,status,dispatched_at,delivered_at")
        .eq("order_id", order.id)
        .order("created_at"),
      db
        .from("shop_order_events")
        .select("event_type,to_status,note,created_at")
        .eq("order_id", order.id)
        .order("created_at"),
    ]);

  return { order, items: items || [], shipments: shipments || [], events: events || [] };
}
