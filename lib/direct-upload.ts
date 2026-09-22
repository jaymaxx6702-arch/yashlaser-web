import { enquiryPayloadFits } from "./enquiry-limits";
type Target = { path: string; url: string };
export type UploadSession = {
  receipt: string;
  expiresAt: number;
  artwork: Target | null;
  sourceArtwork: Target | null;
  preview: Target;
  artworkDone?: boolean;
  sourceArtworkDone?: boolean;
  previewDone?: boolean;
};
export async function postEnquiryJson(path: string, payload: unknown) {
  const body = JSON.stringify(payload);
  if (!enquiryPayloadFits(body))
    throw new Error(
      "Your enquiry text is too large. Please shorten the notes.",
    );
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(55000),
  });
  const result = await response
    .json()
    .catch(() => ({
      error:
        "The service is temporarily unavailable. Retry or contact us on WhatsApp.",
    }));
  if (!response.ok)
    throw new Error(result.error || "Unable to save. Please retry.");
  return result;
}
export async function uploadPrivate(target: Target, file: Blob) {
  try {
    const response = await fetch(target.url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-upsert": "false",
        "Cache-Control": "max-age=0",
      },
      body: file,
      signal: AbortSignal.timeout(120000),
    });
    if (response.ok) return;
    const result = await response.json().catch(() => ({}));
    if (
      response.status === 409 ||
      result.statusCode === "409" ||
      result.error === "Duplicate"
    )
      return;
    throw new Error();
  } catch {
    throw new Error(
      "Private upload failed. Check your connection and submit again to retry, or use WhatsApp below.",
    );
  }
}
export async function blobHash(blob: Blob) {
  const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
