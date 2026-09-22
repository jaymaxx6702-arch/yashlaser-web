export const CUSTOMIZATION_ARTWORK_POLICY = {
  maxBytes: 8 * 1024 * 1024,
  maxPixels: 25_000_000,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export const CUSTOMIZATION_PREVIEW_POLICY = {
  maxBytes: 4 * 1024 * 1024,
  width: 1000,
  height: 1000,
  mimeType: "image/png" as const,
} as const;

export type CustomizationArtworkMime =
  (typeof CUSTOMIZATION_ARTWORK_POLICY.mimeTypes)[number];

export function isCustomizationArtworkMime(
  value: unknown,
): value is CustomizationArtworkMime {
  return (
    typeof value === "string" &&
    CUSTOMIZATION_ARTWORK_POLICY.mimeTypes.includes(
      value as CustomizationArtworkMime,
    )
  );
}

export function artworkWithinPolicy(input: {
  bytes: number;
  width: number;
  height: number;
}) {
  return (
    Number.isInteger(input.bytes) &&
    input.bytes >= 1 &&
    input.bytes <= CUSTOMIZATION_ARTWORK_POLICY.maxBytes &&
    Number.isInteger(input.width) &&
    Number.isInteger(input.height) &&
    input.width >= 1 &&
    input.height >= 1 &&
    input.width * input.height <= CUSTOMIZATION_ARTWORK_POLICY.maxPixels
  );
}
