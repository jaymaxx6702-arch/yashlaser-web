import { NextResponse } from "next/server";
import { adminUser } from "@/lib/admin";
import { syncShopOrderToYashFlow } from "@/lib/yashflow";
import { recordAdminAudit } from "@/lib/admin-audit";
import { safeIntegrationError } from "@/lib/integration-errors";


export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await adminUser();
  if (!user)
    return NextResponse.json({ error: "Admin session required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  try {
    const result = await syncShopOrderToYashFlow(id);
    await recordAdminAudit({
      adminUserId: user.id,
      action: "yashflow.sync_succeeded",
      entityType: "order",
      entityId: id,
      payload: {},
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = safeIntegrationError(error);
    await recordAdminAudit({
      adminUserId: user.id,
      action: "yashflow.sync_failed",
      entityType: "order",
      entityId: id,
      payload: { message },
    });
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
