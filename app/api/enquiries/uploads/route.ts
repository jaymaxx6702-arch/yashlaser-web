import { randomUUID } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import {
  checkQuota,
  enquiryJson,
  parseEnquiry,
  enquiryError,
  EnquiryError,
  serverSecret,
} from "@/lib/enquiry-server";
import { MAX_PREVIEW_BYTES } from "@/lib/enquiry-limits";
import { signTicket } from "@/lib/upload-ticket";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const data = await enquiryJson(request),
      input = parseEnquiry(data);
    const reference = await checkQuota(input);
    if (reference) return Response.json({ reference });
    const preview = data.preview as
      { bytes?: number; sha256?: string } | undefined;
    if (
      !preview ||
      !Number.isInteger(preview.bytes) ||
      preview.bytes! < 1 ||
      preview.bytes! > MAX_PREVIEW_BYTES ||
      !/^[a-f0-9]{64}$/.test(preview.sha256 || "")
    )
      throw new EnquiryError("Invalid preview metadata.");
    const prefix = `incoming/${input.requestId}/${randomUUID()}`;
    const artwork = input.customization.artwork;
    const artworkPath = artwork
      ? `${prefix}/artwork.${artwork.mimeType === "image/jpeg" ? "jpg" : artwork.mimeType === "image/png" ? "png" : "webp"}`
      : null;
    const sourceArtwork = input.sourceArtwork;
    const sourceArtworkPath = sourceArtwork
      ? `${prefix}/source-artwork.${sourceArtwork.mimeType === "image/jpeg" ? "jpg" : sourceArtwork.mimeType === "image/png" ? "png" : "webp"}`
      : null;
    const previewPath = `${prefix}/preview.png`;
    const db = getSupabase();
    const sign = async (path: string) => {
      const r = await db.storage
        .from("customer-artwork")
        .createSignedUploadUrl(path, { upsert: false });
      if (r.error) throw new Error("Upload signing failed");
      return { path, url: r.data.signedUrl };
    };
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const [artworkTarget, sourceArtworkTarget, previewTarget] =
      await Promise.all([
        artworkPath ? sign(artworkPath) : null,
        sourceArtworkPath ? sign(sourceArtworkPath) : null,
        sign(previewPath),
      ]);
    const receipt = signTicket(
      {
        version: 1,
        requestId: input.requestId,
        payloadHash: input.payloadHash,
        artworkPath,
        sourceArtworkPath,
        previewPath,
        previewBytes: preview.bytes!,
        previewHash: preview.sha256!,
        expiresAt,
      },
      serverSecret(),
    );
    return Response.json(
      {
        receipt,
        expiresAt,
        artwork: artworkTarget,
        sourceArtwork: sourceArtworkTarget,
        preview: previewTarget,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return enquiryError(error);
  }
}
