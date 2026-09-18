import { MAX_UPLOAD_BYTES, MAX_IMAGE_PIXELS, type Artwork } from "./model";
export async function inspectArtwork(
  file: Blob,
  name = "artwork.png",
): Promise<{ bitmap: ImageBitmap; metadata: Artwork }> {
  if (
    !file.size ||
    file.size > MAX_UPLOAD_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new Error("Choose a JPG, PNG or WebP image up to 8 MB.");
  const bytes = await file.arrayBuffer(),
    b = new Uint8Array(bytes);
  const actual =
    b[0] === 255 && b[1] === 216
      ? "image/jpeg"
      : b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71
        ? "image/png"
        : String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
            String.fromCharCode(...b.slice(8, 12)) === "WEBP"
          ? "image/webp"
          : null;
  if (actual !== file.type)
    throw new Error("The file does not contain a supported image.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "This image could not be opened. Choose another photograph.",
    );
  }
  if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
    bitmap.close();
    throw new Error("Please use an image up to 25 megapixels.");
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return {
    bitmap,
    metadata: {
      name: name.slice(0, 180),
      mimeType: file.type,
      bytes: file.size,
      width: bitmap.width,
      height: bitmap.height,
      sha256: [...new Uint8Array(digest)]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join(""),
    },
  };
}
