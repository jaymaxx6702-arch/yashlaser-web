import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import {
  resolveDesignHandoff,
  type ResolvedDesignHandoff,
} from "@/lib/enquiry-handoff-server";

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
  designToken?: string | null;
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
      designToken: item.designToken || null,
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

  const handoffs: (ResolvedDesignHandoff | null)[] = await Promise.all(
    input.items.map(async (item) => {
      if (!item.designToken) return null;
      if (!item.designId)
        throw new Error("Saved design token is missing its design reference.");
      return resolveDesignHandoff(item.designToken, {
        designId: item.designId,
        productId: item.productId,
      });
    }),
  );
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

  const rows = input.items.map((item, index) => ({
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
    configuration: {
      ...(item.configuration || {}),
      ...(handoffs[index]
        ? { sourceEnquiryItemId: handoffs[index]!.enquiryItemId }
        : {}),
    },
  }));

  const { data: orderItems, error: itemError } = await db
    .from("shop_order_items")
    .insert(rows)
    .select("id,configuration");
  if (itemError || !orderItems) {
    await db.from("shop_orders").delete().eq("id", order.id);
    throw new Error(itemError?.message || "Order items could not be saved.");
  }

  const handoffBySource = new Map(
    handoffs
      .filter((handoff): handoff is ResolvedDesignHandoff => Boolean(handoff))
      .map((handoff) => [handoff.enquiryItemId, handoff]),
  );
  const copiedPaths: string[] = [];

  try {
    const linked = orderItems
      .map((row) => {
        const config =
          row.configuration && typeof row.configuration === "object"
            ? (row.configuration as Record<string, unknown>)
            : {};
        const source =
          typeof config.sourceEnquiryItemId === "string"
            ? config.sourceEnquiryItemId
            : "";
        const handoff = source ? handoffBySource.get(source) : undefined;
        return handoff ? { orderItemId: row.id as string, handoff } : null;
      })
      .filter(
        (
          value,
        ): value is {
          orderItemId: string;
          handoff: ResolvedDesignHandoff;
        } => Boolean(value),
      );

    const copied: {
      orderItemId: string;
      originalPath: string | null;
      previewPath: string;
      originalMime: string | null;
    }[] = [];

    for (const link of linked) {
      let originalPath: string | null = null;
      let originalMime: string | null = null;

      if (link.handoff.artworkPath) {
        const extension = link.handoff.artworkPath.split(".").pop() || "webp";
        originalPath =
          `orders/${order.id}/${link.orderItemId}/original.${extension}`;
        const originalCopy = await db.storage
          .from("customer-artwork")
          .copy(link.handoff.artworkPath, originalPath);
        if (originalCopy.error)
          throw new Error("Unable to preserve original artwork.");
        copiedPaths.push(originalPath);
        originalMime =
          extension === "jpg"
            ? "image/jpeg"
            : extension === "png"
              ? "image/png"
              : "image/webp";
      }

      const previewPath =
        `orders/${order.id}/${link.orderItemId}/preview.png`;
      const previewCopy = await db.storage
        .from("customer-artwork")
        .copy(link.handoff.previewPath, previewPath);
      if (previewCopy.error)
        throw new Error("Unable to preserve design preview.");
      copiedPaths.push(previewPath);

      copied.push({
        orderItemId: link.orderItemId,
        originalPath,
        previewPath,
        originalMime,
      });
    }

    const originalRows = copied
      .filter((asset) => asset.originalPath)
      .map((asset) => ({
        order_id: order.id,
        order_item_id: asset.orderItemId,
        asset_kind: "original",
        version_no: 1,
        state: "ready",
        storage_bucket: "customer-artwork",
        file_path: asset.originalPath!,
        mime_type: asset.originalMime,
      }));

    const originalIds = new Map<string, string>();
    if (originalRows.length) {
      const { data: originals, error: originalError } = await db
        .from("shop_order_assets")
        .insert(originalRows)
        .select("id,order_item_id");
      if (originalError || !originals)
        throw new Error("Unable to register original artwork.");
      for (const asset of originals)
        if (asset.order_item_id)
          originalIds.set(asset.order_item_id, asset.id);
    }

    const previewRows = copied.map((asset) => ({
      order_id: order.id,
      order_item_id: asset.orderItemId,
      asset_kind: "preview",
      version_no: 1,
      state: "ready",
      storage_bucket: "customer-artwork",
      file_path: asset.previewPath,
      mime_type: "image/png",
      source_asset_id: originalIds.get(asset.orderItemId) || null,
    }));

    if (previewRows.length) {
      const { error: previewError } = await db
        .from("shop_order_assets")
        .insert(previewRows);
      if (previewError)
        throw new Error("Unable to register design previews.");
    }
  } catch (error) {
    if (copiedPaths.length)
      await db.storage.from("customer-artwork").remove(copiedPaths);
    await db.from("shop_orders").delete().eq("id", order.id);
    throw error;
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
