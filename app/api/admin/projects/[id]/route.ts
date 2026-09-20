import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

type ProjectUpdateBody = {
  status?: unknown;
  customerMessage?: unknown;
};

const statuses = new Set([
  "new",
  "reviewing",
  "quoted",
  "accepted",
  "closed",
  "cancelled",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;

  let body: ProjectUpdateBody | null;
  try {
    body = await readJsonBody<ProjectUpdateBody>(request, 8 * 1024);
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
  const hasMessage = typeof body?.customerMessage === "string";
  const customerMessage = hasMessage
    ? String(body?.customerMessage).trim().slice(0, 3000)
    : "";

  if (!/^[0-9a-f-]{36}$/i.test(id) || !status)
    return NextResponse.json(
      { error: "Invalid project request update." },
      { status: 400 },
    );

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (hasMessage) {
    update.customer_message = customerMessage || null;
    update.responded_at = customerMessage ? now : null;
  }

  const db = getSupabase();
  const { error } = await db
    .from("shop_project_requests")
    .update(update)
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
