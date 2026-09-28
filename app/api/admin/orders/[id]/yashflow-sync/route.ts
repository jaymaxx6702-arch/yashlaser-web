import { NextResponse } from "next/server";
import { adminUser } from "@/lib/admin";
import { syncShopOrderToYashFlow } from "@/lib/yashflow";
import { recordAdminAudit } from "@/lib/admin-audit";
import { recordAdminAudit } from "@/lib/admin-audit";

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "YashFlow sync failed.";
  return message
    .replace(/sb_secret_[A-Za-z0-9._-]+/g, "sb_secret_[redacted]")
    .replace(/eyJ[A-Za-z0-9._-]{20,}/g, "[redacted token]");
}

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
    const message = safeMessage(error);
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
