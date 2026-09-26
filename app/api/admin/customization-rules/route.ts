import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getCustomizationRuleState,
  validateProductCustomizationDefinition,
  writeCustomizationRule,
} from "@/lib/customization/rules-server";
import {
  RequestBodyError,
  readJsonBody,
} from "@/lib/request-security";

type RuleWriteBody = {
  productId?: unknown;
  status?: unknown;
  definition?: unknown;
};

const productIdPattern = /^yl-\d{5,20}$/;

export async function GET(request: Request) {
  await requireAdmin();
  const productId = new URL(request.url).searchParams.get("productId") ?? "";

  if (!productIdPattern.test(productId))
    return NextResponse.json(
      { error: "Invalid product id." },
      { status: 400 },
    );

  try {
    const state = await getCustomizationRuleState(productId);
    return NextResponse.json(state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load customization rules.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  let body: RuleWriteBody | null;
  try {
    body = await readJsonBody<RuleWriteBody>(request, 128 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }

  const productId =
    typeof body?.productId === "string" ? body.productId.trim() : "";
  const status =
    body?.status === "draft" || body?.status === "published"
      ? body.status
      : null;

  if (!productIdPattern.test(productId) || !status || !body?.definition)
    return NextResponse.json(
      { error: "Invalid customization rule request." },
      { status: 400 },
    );

  try {
    validateProductCustomizationDefinition(productId, body.definition);
    const rule = await writeCustomizationRule({
      productId,
      definition: body.definition,
      status,
      adminUserId: admin.id,
    });
    return NextResponse.json({ ok: true, rule });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save customization rule.";
    const badInput =
      /Unknown catalogue product|Invalid |Unsupported |does not match|requires|Duplicate|cannot depend|Unknown visibility|must use/.test(
        message,
      );
    return NextResponse.json(
      { error: message },
      { status: badInput ? 400 : 500 },
    );
  }
}
