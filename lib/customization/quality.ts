export type PhotoQualityLevel = "good" | "warning" | "poor";

export type PhotoQualityIssueCode =
  | "low-resolution"
  | "very-low-resolution"
  | "underexposed"
  | "overexposed"
  | "low-contrast"
  | "soft-image";

export type PhotoQualityIssue = {
  code: PhotoQualityIssueCode;
  level: Exclude<PhotoQualityLevel, "good">;
};

export type PhotoQualityReport = {
  version: 1;
  level: PhotoQualityLevel;
  width: number;
  height: number;
  megapixels: number;
  sampledWidth: number;
  sampledHeight: number;
  meanLuminance: number;
  luminanceStdDev: number;
  sharpnessScore: number;
  shadowClipPercent: number;
  highlightClipPercent: number;
  issues: PhotoQualityIssue[];
  printSuitability: {
    status: "needs-physical-dimensions";
  };
  subjectAssessment: {
    status: "not-analyzed";
    reason: "provider-not-configured";
  };
};

type PixelAnalysisInput = {
  width: number;
  height: number;
  sampledWidth: number;
  sampledHeight: number;
  rgba: ArrayLike<number>;
};

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function overallLevel(issues: readonly PhotoQualityIssue[]): PhotoQualityLevel {
  if (issues.some((issue) => issue.level === "poor")) return "poor";
  if (issues.length) return "warning";
  return "good";
}

export function analyzePixelSamples({
  width,
  height,
  sampledWidth,
  sampledHeight,
  rgba,
}: PixelAnalysisInput): PhotoQualityReport {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    !Number.isInteger(sampledWidth) ||
    !Number.isInteger(sampledHeight) ||
    sampledWidth < 2 ||
    sampledHeight < 2 ||
    rgba.length < sampledWidth * sampledHeight * 4
  )
    throw new Error("Invalid photo quality sample.");

  const count = sampledWidth * sampledHeight;
  const luminance = new Float32Array(count);
  let sum = 0;
  let shadows = 0;
  let highlights = 0;

  for (let index = 0; index < count; index++) {
    const offset = index * 4;
    const alpha = Number(rgba[offset + 3]) / 255;
    const r = Number(rgba[offset]);
    const g = Number(rgba[offset + 1]);
    const b = Number(rgba[offset + 2]);
    // Composite transparency over white so a transparent cutout is not
    // incorrectly classified as a dark photograph.
    const rr = r * alpha + 255 * (1 - alpha);
    const gg = g * alpha + 255 * (1 - alpha);
    const bb = b * alpha + 255 * (1 - alpha);
    const y = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
    luminance[index] = y;
    sum += y;
    if (y <= 12) shadows++;
    if (y >= 243) highlights++;
  }

  const mean = sum / count;
  let variance = 0;
  for (const y of luminance) variance += (y - mean) ** 2;
  const stdDev = Math.sqrt(variance / count);

  let laplacianEnergy = 0;
  let laplacianCount = 0;
  for (let y = 1; y < sampledHeight - 1; y++) {
    for (let x = 1; x < sampledWidth - 1; x++) {
      const i = y * sampledWidth + x;
      const laplacian =
        4 * luminance[i] -
        luminance[i - 1] -
        luminance[i + 1] -
        luminance[i - sampledWidth] -
        luminance[i + sampledWidth];
      laplacianEnergy += laplacian * laplacian;
      laplacianCount++;
    }
  }
  const sharpnessScore =
    laplacianCount > 0 ? laplacianEnergy / laplacianCount : 0;

  const megapixels = (width * height) / 1_000_000;
  const shadowClipPercent = (shadows / count) * 100;
  const highlightClipPercent = (highlights / count) * 100;
  const issues: PhotoQualityIssue[] = [];

  // These are source-file screening thresholds, not print-DPI guarantees.
  // Exact print suitability remains unknown until physical output dimensions
  // are verified for the selected product/variant.
  if (megapixels < 0.5)
    issues.push({ code: "very-low-resolution", level: "poor" });
  else if (megapixels < 1.5)
    issues.push({ code: "low-resolution", level: "warning" });

  if (mean < 55 || shadowClipPercent > 35)
    issues.push({ code: "underexposed", level: mean < 35 ? "poor" : "warning" });
  else if (mean > 210 || highlightClipPercent > 35)
    issues.push({ code: "overexposed", level: mean > 230 ? "poor" : "warning" });

  if (stdDev < 24)
    issues.push({ code: "low-contrast", level: stdDev < 14 ? "poor" : "warning" });

  if (sharpnessScore < 80)
    issues.push({ code: "soft-image", level: sharpnessScore < 35 ? "poor" : "warning" });

  return {
    version: 1,
    level: overallLevel(issues),
    width,
    height,
    megapixels: round(megapixels),
    sampledWidth,
    sampledHeight,
    meanLuminance: round(mean, 1),
    luminanceStdDev: round(stdDev, 1),
    sharpnessScore: round(sharpnessScore, 1),
    shadowClipPercent: round(shadowClipPercent, 1),
    highlightClipPercent: round(highlightClipPercent, 1),
    issues,
    printSuitability: { status: "needs-physical-dimensions" },
    subjectAssessment: {
      status: "not-analyzed",
      reason: "provider-not-configured",
    },
  };
}

export async function analyzeBitmapQuality(
  bitmap: ImageBitmap,
): Promise<PhotoQualityReport> {
  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const sampledWidth = Math.max(2, Math.round(bitmap.width * scale));
  const sampledHeight = Math.max(2, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = sampledWidth;
  canvas.height = sampledHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Photo quality analysis is unavailable.");

  context.drawImage(bitmap, 0, 0, sampledWidth, sampledHeight);
  const rgba = context.getImageData(
    0,
    0,
    sampledWidth,
    sampledHeight,
  ).data;

  return analyzePixelSamples({
    width: bitmap.width,
    height: bitmap.height,
    sampledWidth,
    sampledHeight,
    rgba,
  });
}
