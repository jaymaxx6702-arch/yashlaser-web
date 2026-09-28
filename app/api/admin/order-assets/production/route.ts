import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";
import { createProductionSourceFromApprovedProof } from "@/lib/production-assets";
import { recordAdminAudit } from "@/lib/admin-audit";

type Body = { orderId?: unknown };

export async function POST(request: Request) {
  const admin = await requireAdmin();

  let body: Body | null;
  try {
    body = await readJsonBody<Body>(request, 4 * 1024);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: error instanceof RequestBodyError ? error.status : 400 },
    );
  }

  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId))
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });

  try {
    const result = await createProductionSourceFromApprovedProof(orderId);
    await recordAdminAudit({
      adminUserId: admin.id,
      action: "production_source.create",
      entityType: "order",
      entityId: orderId,
      payload: { assetId: result.id ?? null },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create production source.";
    const status =
      /not found|unavailable/i.test(message) ? 404 :
      /required|not ready|not synchronized/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
