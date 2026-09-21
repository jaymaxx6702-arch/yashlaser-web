import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

export async function POST(
  request: Request,
  context: { params: Promise<{ requestNo: string }> },
) {
  const { requestNo } = await context.params;
  if (!(await consumeRequestRateLimit(request, "project_file_confirm_ip", 30, 600)))
    return rateLimitResponse(600);

  let body:
    | {
        token?: unknown;
        path?: unknown;
        fileName?: unknown;
        mimeType?: unknown;
        size?: unknown;
      }
    | null;
  try {
    body = await readJsonBody(request, 8 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }
  const token =
    typeof body?.token === "string" ? body.token.trim().slice(0, 100) : "";
  const path =
    typeof body?.path === "string" ? body.path.trim().slice(0, 500) : "";
  const fileName =
    typeof body?.fileName === "string" ? body.fileName.slice(0, 160) : "";
  const mimeType =
    typeof body?.mimeType === "string" ? body.mimeType.trim().slice(0, 120) : "";
  const size = Number(body?.size);

  if (!token || !path || !fileName)
    return NextResponse.json(
      { error: "Invalid file confirmation." },
      { status: 400 },
    );

  const db = getSupabase();
  const { data: project } = await db
    .from("shop_project_requests")
    .select("id")
    .eq("request_no", requestNo)
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();

  if (!project)
    return NextResponse.json(
      { error: "Request link is invalid." },
      { status: 404 },
    );

  if (!path.startsWith(project.id + "/"))
    return NextResponse.json({ error: "File path mismatch." }, { status: 400 });

  const objectName = path.slice(project.id.length + 1);
  if (
    !/^[A-Za-z0-9._-]{1,240}$/.test(objectName) ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > 20 * 1024 * 1024
  )
    return NextResponse.json(
      { error: "Invalid file confirmation." },
      { status: 400 },
    );
  const { data: objects } = await db.storage
    .from("customer-documents")
    .list(project.id, { search: objectName, limit: 5 });

  if (!objects?.some((x) => x.name === objectName))
    return NextResponse.json(
      { error: "Uploaded file was not found." },
      { status: 400 },
    );

  const { error } = await db.from("shop_project_files").insert({
    request_id: project.id,
    file_path: path,
    file_name: fileName,
    mime_type: mimeType,
    file_size: Number.isFinite(size) ? size : null,
  });

  if (
    error &&
    !error.message.toLowerCase().includes("duplicate")
  )
    return NextResponse.json({ error: "Unable to save uploaded file." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
