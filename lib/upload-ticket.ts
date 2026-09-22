import { createHmac, timingSafeEqual } from "node:crypto";
export type UploadTicket = {
  version: 1;
  requestId: string;
  payloadHash: string;
  artworkPath: string | null;
  sourceArtworkPath?: string | null;
  previewPath: string;
  previewBytes: number;
  previewHash: string;
  expiresAt: number;
};
export function signTicket(ticket: UploadTicket, key: string) {
  const body = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return (
    body +
    "." +
    createHmac("sha256", key)
      .update("yl-upload-v1:" + body)
      .digest("base64url")
  );
}
export function verifyTicket(
  token: string,
  key: string,
  now = Date.now(),
): UploadTicket {
  if (token.length > 4096) throw new Error("Invalid upload receipt.");
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) throw new Error("Invalid upload receipt.");
  const expected = createHmac("sha256", key)
    .update("yl-upload-v1:" + body)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("Invalid upload receipt.");
  const data = JSON.parse(
    Buffer.from(body, "base64url").toString(),
  ) as UploadTicket;
  if (
    data.version !== 1 ||
    !Number.isFinite(data.expiresAt) ||
    data.expiresAt <= now
  )
    throw new Error("Upload session expired. Please retry your upload.");
  const prefix = /^incoming\/[a-f0-9-]{36}\/[a-f0-9-]{36}\//;
  if (
    !prefix.test(data.previewPath) ||
    !data.previewPath.endsWith("/preview.png") ||
    (data.artworkPath !== null &&
      (!prefix.test(data.artworkPath) ||
        !/\/artwork\.(jpg|png|webp)$/.test(data.artworkPath))) ||
    (data.sourceArtworkPath != null &&
      (!prefix.test(data.sourceArtworkPath) ||
        !/\/source-artwork\.(jpg|png|webp)$/.test(data.sourceArtworkPath)))
  )
    throw new Error("Invalid upload path.");
  return data;
}
