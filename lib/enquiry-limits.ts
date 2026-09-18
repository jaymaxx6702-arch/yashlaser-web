// Images go directly to Storage. Next.js endpoints accept metadata JSON only.
export const MAX_ENQUIRY_BYTES = 32 * 1024;
export const MAX_PREVIEW_BYTES = 4 * 1024 * 1024;
export function enquiryPayloadFits(json: string) {
  return new TextEncoder().encode(json).byteLength <= MAX_ENQUIRY_BYTES;
}
