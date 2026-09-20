import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

type SupportUpdateBody = {
  status?: unknown;
  response?: unknown;
};

const statuses = new Set(["open", "in_progress", "resolved", "closed"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;

  let body: SupportUpdateBody | null;
  try {
    body = await readJsonBody<SupportUpdateBody>(request, 8 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }

  const status =
    typeof body?.status === "string" && statuses.has(body.status)
      ? body.status
      : "";
  const hasResponse = typeof body?.response === "string";
  const response = hasResponse ? String(body?.response).trim().slice(0, 3000) : "";

  if (!/^[0-9a-f-]{36}$/i.test(id) || !status)
    return NextResponse.json(
      { error: "Invalid support ticket update." },
      { status: 400 },
    );

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (hasResponse) {
    update.admin_response = response || null;
    update.responded_at = response ? now : null;
  }

  const db = getSupabase();
  const { error } = await db
    .from("shop_support_tickets")
    .update(update)
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
