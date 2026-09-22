import { renderCustomization } from "./render";
import { requireReadyDocument, type CustomizationDocument } from "./model";
import type { CustomizationProduct } from "../customization";
import { CUSTOMIZATION_PREVIEW_POLICY } from "./file-policy";
export type CustomizationSnapshot = {
  designId: string;
  document: CustomizationDocument;
  png: Blob;
  json: Blob;
};
export async function createSnapshot(
  input: CustomizationDocument,
  bitmap: ImageBitmap | null,
  product: CustomizationProduct,
): Promise<CustomizationSnapshot> {
  const doc = requireReadyDocument(input, product);
  if (doc.artwork && !bitmap)
    throw new Error("Your photograph is still loading. Please wait.");
  const canvas = document.createElement("canvas");
  canvas.width = CUSTOMIZATION_PREVIEW_POLICY.width;
  canvas.height = CUSTOMIZATION_PREVIEW_POLICY.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Preview export is unavailable in this browser.");
  const result = renderCustomization(
    ctx,
    doc,
    bitmap,
    product.name,
    product.variants.find((v) => v.id === doc.variantId)?.name || "",
  );
  if (result.textOverflow)
    throw new Error(
      "The text does not fit. Shorten it or reduce its font size.",
    );
  const serialized = JSON.stringify(doc),
    digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(serialized),
    );
  const designId = [...new Uint8Array(digest)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Unable to export preview.")),
      "image/png",
    ),
  );
  if (png.size > CUSTOMIZATION_PREVIEW_POLICY.maxBytes)
    throw new Error("Preview is too large. Please use a smaller photograph.");
  return {
    designId,
    document: doc,
    png,
    json: new Blob(
      [
        JSON.stringify(
          {
            designId,
            productName: product.name,
            variantName:
              product.variants.find((v) => v.id === doc.variantId)?.name ||
              null,
            indicative: true,
            document: doc,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  };
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
