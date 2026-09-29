import { NextResponse } from "next/server";

import { adminUser } from "@/lib/admin";
import { recordAdminAudit } from "@/lib/admin-audit";
import { safeIntegrationError } from "@/lib/integration-errors";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";
import { updateYashFlowMapping } from "@/lib/yashflow-mappings";

type MappingUpdateBody = {
  shopProductId?: unknown;
  yashflowProductId?: unknown;
  isActive?: unknown;
};

export async function PATCH(request: Request) {
  const user = await adminUser();
  if (!user) {
    return NextResponse.json(
      { error: "Admin session required." },
      { status: 401 },
    );
  }

  let body: MappingUpdateBody | null;
  try {
    body = await readJsonBody<MappingUpdateBody>(request, 8 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }
  const shopProductId =
    typeof body?.shopProductId === "string"
      ? body.shopProductId.trim().slice(0, 160)
      : "";
  const yashflowProductId =
    typeof body?.yashflowProductId === "string"
      ? body.yashflowProductId.trim()
      : "";
  const isActive = body?.isActive;

  if (
    !shopProductId ||
    !/^[0-9a-f-]{36}$/i.test(yashflowProductId) ||
    typeof isActive !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Invalid mapping update." },
      { status: 400 },
    );
  }

  try {
    const mapping = await updateYashFlowMapping({
      shopProductId,
      yashflowProductId,
      isActive,
    });

    await recordAdminAudit({
      adminUserId: user.id,
      action: "yashflow.mapping_updated",
      entityType: "product_mapping",
      entityId: shopProductId,
      payload: {
        yashflowProductId,
        isActive,
        workflowReady: mapping.workflowReady,
      },
    });

    return NextResponse.json({ ok: true, mapping });
  } catch (error) {
    const message = safeIntegrationError(error);
    await recordAdminAudit({
      adminUserId: user.id,
      action: "yashflow.mapping_update_failed",
      entityType: "product_mapping",
      entityId: shopProductId || null,
      payload: { message },
    });
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
