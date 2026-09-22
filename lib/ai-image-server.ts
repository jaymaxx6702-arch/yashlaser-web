import "server-only";
import { CUSTOMIZATION_ARTWORK_POLICY } from "@/lib/customization/file-policy";

const MAX_AI_OUTPUT_BYTES = 16 * 1024 * 1024;

export function aiImageToolsEnabled() {
  return (
    process.env.AI_IMAGE_TOOLS_ENABLED === "true" &&
    Boolean(process.env.AI_BACKGROUND_REMOVE_URL)
  );
}

async function readProviderBody(response: Response) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_AI_OUTPUT_BYTES)
    throw new Error("AI image response is too large.");

  const reader = response.body?.getReader();
  if (!reader) throw new Error("AI image service returned an empty response.");

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_AI_OUTPUT_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Response is already rejected.
        }
        throw new Error("AI image response is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function removeBackgroundWithProvider(
  source: Uint8Array,
  mimeType: string,
) {
  if (!aiImageToolsEnabled())
    throw new Error("AI image tools are not configured.");

  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    Accept: "image/png, image/webp",
  };
  if (process.env.AI_IMAGE_API_SECRET)
    headers.Authorization = "Bearer " + process.env.AI_IMAGE_API_SECRET;

  const providerBody = new ArrayBuffer(source.byteLength);
  new Uint8Array(providerBody).set(source);

  const response = await fetch(process.env.AI_BACKGROUND_REMOVE_URL!, {
    method: "POST",
    headers,
    body: providerBody,
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("AI image service failed.");

  const resultType =
    response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ||
    "";
  if (!["image/png", "image/webp"].includes(resultType))
    throw new Error("AI image service returned an invalid format.");

  const body = await readProviderBody(response);
  if (!body.byteLength || body.byteLength > MAX_AI_OUTPUT_BYTES)
    throw new Error("AI image service returned an invalid file.");

  return { body, mimeType: resultType };
}

export const AI_INPUT_MAX_BYTES = CUSTOMIZATION_ARTWORK_POLICY.maxBytes;
