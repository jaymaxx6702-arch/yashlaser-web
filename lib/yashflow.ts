import "server-only";
import { getSupabase } from "@/lib/supabase";

export const yashFlowSyncEnabled = () =>
  process.env.YASHFLOW_SYNC_ENABLED === "true" &&
  Boolean(process.env.YASHFLOW_API_URL) &&
  Boolean(process.env.YASHFLOW_API_SECRET);

function baseUrl() {
  return (process.env.YASHFLOW_API_URL || "").replace(/\/$/, "");
}

function safeIntegrationError(message: string) {
  return message
    .replace(/sb_secret_[A-Za-z0-9._\-\s]+/g, "sb_secret_[redacted]")
    .replace(/eyJ[A-Za-z0-9._\-]{20,}/g, "[redacted token]");
}

function authHeaders() {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${process.env.YASHFLOW_API_SECRET || ""}`,
  };
}

export async function syncShopOrderToYashFlow(orderId: string) {
  if (!yashFlowSyncEnabled()) throw new Error("YashFlow sync is not configured.");
  const db = getSupabase();
  const { data: order } = await db
    .from("shop_orders")
    .select("id,order_no,customer_name,customer_mobile,status,payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) throw new Error("Shop order not found.");

  const { data: items, error: itemError } = await db
    .from("shop_order_items")
    .select("id,product_id,product_name,variant_id,variant_name,quantity,design_id,configuration")
    .eq("order_id", orderId)
    .order("created_at");
  if (itemError || !items?.length) throw new Error(itemError?.message || "Shop order has no items.");

  await db
    .from("shop_orders")
    .update({ yashflow_sync_status: "pending", yashflow_last_error: null })
    .eq("id", orderId);

  const payload = {
    schemaVersion: 1,
    shopOrderId: order.id,
    orderNo: order.order_no,
    customer: {
      name: order.customer_name,
      mobile: order.customer_mobile,
    },
    items: items.map((item) => ({
      shopOrderItemId: item.id,
      shopProductId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      configuration: {
        ...(item.configuration || {}),
        variantId: item.variant_id,
        variantName: item.variant_name,
        designId: item.design_id,
      },
    })),
  };

  try {
    const response = await fetch(`${baseUrl()}/api/integrations/shop/orders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    let result: Record<string, unknown> = {};
    if (contentType.includes("application/json")) {
      try {
        result = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        throw new Error(`YashFlow returned invalid JSON (${response.status}).`);
      }
    } else {
      const preview = raw.replace(/\s+/g, " ").slice(0, 180);
      throw new Error(
        `YashFlow API returned non-JSON (${response.status}, ${contentType || "unknown content-type"}) from ${baseUrl()}. ${preview}`,
      );
    }
    if (!response.ok)
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : `YashFlow sync failed (${response.status}).`,
      );

    const refs = Array.isArray(result.orders) ? result.orders : [];
    await db
      .from("shop_orders")
      .update({
        yashflow_sync_status: "synced",
        yashflow_order_refs: refs,
        yashflow_last_error: null,
        yashflow_last_synced_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    await db.from("shop_integration_events").insert({
      kind: "yashflow_order_sync",
      entity_id: orderId,
      status: "success",
      payload: result,
      attempts: 1,
    });
    return result;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "YashFlow sync failed.";
    const message = safeIntegrationError(rawMessage);
    await db
      .from("shop_orders")
      .update({
        yashflow_sync_status: "failed",
        yashflow_last_error: message.slice(0, 2000),
      })
      .eq("id", orderId);
    await db.from("shop_integration_events").insert({
      kind: "yashflow_order_sync",
      entity_id: orderId,
      status: "failed",
      error: message.slice(0, 2000),
      attempts: 1,
    });
    throw error;
  }
}

export async function getYashFlowOrderStatus(shopOrderId: string) {
  if (!yashFlowSyncEnabled()) return null;
  try {
    const response = await fetch(
      `${baseUrl()}/api/integrations/shop/status/${encodeURIComponent(shopOrderId)}`,
      {
        headers: { authorization: `Bearer ${process.env.YASHFLOW_API_SECRET || ""}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
