import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName.slice(0, 160) : "";
  const size = Number(body?.size);
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !allowed.has(mimeType) || !fileName || !Number.isFinite(size) || size <= 0 || size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "Invalid proof file." }, { status: 400 });

  const ext =
    mimeType === "application/pdf" ? "pdf" :
    mimeType === "image/png" ? "png" :
    mimeType === "image/webp" ? "webp" : "jpg";
  const path = `${orderId}/${Date.now()}-${randomUUID()}.${ext}`;
  const db = getSupabase();
  const { data, error } = await db.storage.from("shop-proofs").createSignedUploadUrl(path);
  if (error || !data)
    return NextResponse.json({ error: error?.message || "Unable to create proof upload." }, { status: 500 });
  return NextResponse.json({
    path,
    url: data.signedUrl,
    fileName,
    mimeType,
  });
}
