import type { ImageQualityReport } from "./image-provider";

function summarizeLuminance(
  width: number,
  height: number,
  luminance: Uint8Array,
): ImageQualityReport {
  const count = luminance.length;
  let sum = 0;
  for (const value of luminance) sum += value;
  const mean = count ? sum / count : 0;

  let variance = 0;
  for (const value of luminance) variance += (value - mean) ** 2;
  const contrast = count ? Math.sqrt(variance / count) : 0;

  let gradientTotal = 0;
  let gradientCount = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const i = row + x;
      if (x + 1 < width) {
        gradientTotal += Math.abs(luminance[i] - luminance[i + 1]);
        gradientCount++;
      }
      if (y + 1 < height) {
        gradientTotal += Math.abs(luminance[i] - luminance[i + width]);
        gradientCount++;
      }
    }
  }
  const edgeEnergy = gradientCount ? gradientTotal / gradientCount : 0;
  const megapixels = (width * height) / 1_000_000;

  const issues: ImageQualityReport["issues"][number][] = [];
  if (width < 900 || height < 900 || megapixels < 1) issues.push("low-resolution");
  if (mean < 40) issues.push("underexposed");
  if (mean > 215) issues.push("overexposed");
  if (contrast < 18) issues.push("low-contrast");
  if (contrast >= 18 && edgeEnergy < 5) issues.push("blur");

  return {
    width,
    height,
    megapixels,
    issues,
    suitableForPreview: width >= 480 && height >= 480,
    suitableForProduction: null,
    source: "local-heuristic",
  };
}

export function analyzeQualitySample(
  width: number,
  height: number,
  luminance: Uint8Array,
): ImageQualityReport {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    luminance.length !== width * height
  )
    throw new Error("Invalid image quality sample.");
  return summarizeLuminance(width, height, luminance);
}

export function analyzeArtworkQuality(bitmap: ImageBitmap): ImageQualityReport {
  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Image quality analysis is unavailable.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const luminance = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    luminance[p] = Math.round(
      rgba[i] * 0.2126 + rgba[i + 1] * 0.7152 + rgba[i + 2] * 0.0722,
    );
  }
  const sampled = summarizeLuminance(width, height, luminance);
  return {
    ...sampled,
    width: bitmap.width,
    height: bitmap.height,
    megapixels: (bitmap.width * bitmap.height) / 1_000_000,
    issues: [
      ...new Set([
        ...(bitmap.width < 900 ||
        bitmap.height < 900 ||
        (bitmap.width * bitmap.height) / 1_000_000 < 1
          ? (["low-resolution"] as const)
          : []),
        ...sampled.issues.filter((issue) => issue !== "low-resolution"),
      ]),
    ],
    suitableForPreview: bitmap.width >= 480 && bitmap.height >= 480,
  };
}
