import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";

const allowed = new Set([
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ requestNo: string }> },
) {
  const { requestNo } = await context.params;
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const fileName =
    typeof body?.fileName === "string" ? body.fileName.slice(0, 160) : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  const size = Number(body?.size);

  if (
    !token ||
    !fileName ||
    !allowed.has(mimeType) ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > 20 * 1024 * 1024
  )
    return NextResponse.json(
      { error: "Invalid upload request." },
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

  const ext =
    mimeType === "application/pdf"
      ? "pdf"
      : mimeType === "text/csv"
        ? "csv"
        : mimeType === "application/vnd.ms-excel"
          ? "xls"
          : mimeType.includes("spreadsheetml")
            ? "xlsx"
            : mimeType === "image/png"
              ? "png"
              : mimeType === "image/webp"
                ? "webp"
                : "jpg";

  const path =
    project.id + "/" + Date.now() + "-" + randomUUID() + "." + ext;

  const { data, error } = await db.storage
    .from("customer-documents")
    .createSignedUploadUrl(path);

  if (error || !data)
    return NextResponse.json(
      { error: error?.message || "Unable to prepare upload." },
      { status: 500 },
    );

  return NextResponse.json({ path, url: data.signedUrl });
}
