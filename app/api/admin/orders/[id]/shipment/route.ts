import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";
import { recordAdminAudit } from "@/lib/admin-audit";

type ShipmentBody = {
  status?: unknown;
  courier?: unknown;
  awb?: unknown;
  trackingUrl?: unknown;
};

const statuses = new Set([
  "preparing",
  "awb_created",
  "dispatched",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "rto",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await context.params;
  let body: ShipmentBody | null;
  try {
    body = await readJsonBody<ShipmentBody>(request, 8 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }
  const status =
    typeof body?.status === "string" ? body.status : "preparing";

  if (!/^[0-9a-f-]{36}$/i.test(id) || !statuses.has(status))
    return NextResponse.json(
      { error: "Invalid shipment." },
      { status: 400 },
    );

  const courier =
    typeof body?.courier === "string"
      ? body.courier.trim().slice(0, 100)
      : "";
  const awb =
    typeof body?.awb === "string" ? body.awb.trim().slice(0, 120) : "";
  const trackingUrl =
    typeof body?.trackingUrl === "string"
      ? body.trackingUrl.trim().slice(0, 500)
      : "";
  if (trackingUrl) {
    try {
      const parsed = new URL(trackingUrl);
      if (!["http:", "https:"].includes(parsed.protocol))
        throw new Error();
    } catch {
      return NextResponse.json(
        { error: "Tracking URL must use http or https." },
        { status: 400 },
      );
    }
  }

  const db = getSupabase();
  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("shop_shipments")
    .select("id")
    .eq("order_id", id)
    .limit(1)
    .maybeSingle();

  const values = {
    courier: courier || null,
    awb: awb || null,
    tracking_url: trackingUrl || null,
    status,
    dispatched_at: status === "dispatched" ? now : undefined,
    delivered_at: status === "delivered" ? now : undefined,
    updated_at: now,
  };

  const result = existing
    ? await db.from("shop_shipments").update(values).eq("id", existing.id)
    : await db.from("shop_shipments").insert({ order_id: id, ...values });

  if (result.error)
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 },
    );

  if (status === "dispatched" || status === "delivered") {
    await db
      .from("shop_orders")
      .update({ status, updated_at: now })
      .eq("id", id);

    await db.from("shop_order_events").insert({
      order_id: id,
      event_type: "shipment_" + status,
      to_status: status,
      source: "admin",
    });
  }

  await recordAdminAudit({
    adminUserId: admin.id,
    action: "shipment.update",
    entityType: "order",
    entityId: id,
    payload: { status, courier: courier || null, awbSet: Boolean(awb) },
  });

  return NextResponse.json({ ok: true });
}
