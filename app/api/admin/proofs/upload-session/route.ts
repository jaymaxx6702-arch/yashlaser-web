import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

type UploadBody = {
  orderId?: unknown;
  mimeType?: unknown;
  fileName?: unknown;
  size?: unknown;
};

export async function POST(request: Request) {
  await requireAdmin();

  let body: UploadBody | null;
  try {
    body = await readJsonBody<UploadBody>(request, 8 * 1024);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: error instanceof RequestBodyError ? error.status : 400 },
    );
  }

  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  const fileName =
    typeof body?.fileName === "string" ? body.fileName.slice(0, 160) : "";
  const size = Number(body?.size);

  if (
    !/^[0-9a-f-]{36}$/i.test(orderId) ||
    !allowed.has(mimeType) ||
    !fileName ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > 10 * 1024 * 1024
  )
    return NextResponse.json(
      { error: "Invalid proof file." },
      { status: 400 },
    );

  const db = getSupabase();
  const { data: order } = await db
    .from("shop_orders")
    .select("id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { data: latest, error: latestError } = await db
    .from("shop_proofs")
    .select("id,status,version_no")
    .eq("order_id", orderId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError)
    return NextResponse.json(
      { error: "Unable to verify the current proof state." },
      { status: 500 },
    );

  if (latest?.status === "approved")
    return NextResponse.json(
      {
        error:
          "The customer-approved proof is locked. Reopen it deliberately before uploading another version.",
        code: "APPROVED_PROOF_LOCKED",
      },
      { status: 409 },
    );

  const ext =
    mimeType === "application/pdf"
      ? "pdf"
      : mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";

  const path = `${orderId}/${Date.now()}-${randomUUID()}.${ext}`;
  const { data, error } = await db.storage
    .from("shop-proofs")
    .createSignedUploadUrl(path);

  if (error || !data)
    return NextResponse.json(
      { error: error?.message || "Unable to create proof upload." },
      { status: 500 },
    );

  return NextResponse.json({
    path,
    url: data.signedUrl,
    fileName,
    mimeType,
  });
}
