import type { ProductCustomizationRule } from "./rules";

export type ImageQualitySignals = {
  width: number;
  height: number;
  blurScore?: number;
  exposure?: "low" | "ok" | "high";
  contrastScore?: number;
  subjectCount?: number;
  faceCount?: number;
};

export type ImageQualityIssueCode =
  | "resolution-low"
  | "blur-risk"
  | "underexposed"
  | "overexposed"
  | "contrast-low"
  | "subject-missing"
  | "multiple-subjects";

export type ImageQualityIssue = {
  code: ImageQualityIssueCode;
  severity: "warning" | "error";
  message: string;
};

export type ImageQualityAssessment = {
  width: number;
  height: number;
  megapixels: number;
  issues: ImageQualityIssue[];
  acceptableForPreview: boolean;
};

function boundedScore(value: number | undefined) {
  return value === undefined || (Number.isFinite(value) && value >= 0 && value <= 1);
}

export function assessImageQuality(
  signals: ImageQualitySignals,
  rule: Pick<ProductCustomizationRule, "image">,
): ImageQualityAssessment {
  if (
    !Number.isInteger(signals.width) ||
    !Number.isInteger(signals.height) ||
    signals.width < 1 ||
    signals.height < 1 ||
    !boundedScore(signals.blurScore) ||
    !boundedScore(signals.contrastScore)
  )
    throw new Error("Invalid image quality signals.");

  const issues: ImageQualityIssue[] = [];
  if (
    signals.width < rule.image.minRecommendedWidth ||
    signals.height < rule.image.minRecommendedHeight
  )
    issues.push({
      code: "resolution-low",
      severity: "warning",
      message:
        "Image resolution is below the recommended level for this product. A higher-resolution original may print better.",
    });

  if (signals.blurScore !== undefined && signals.blurScore >= 0.65)
    issues.push({
      code: "blur-risk",
      severity: "warning",
      message:
        "The image may be blurred. Use a sharper original or review enhancement before approval.",
    });

  if (signals.exposure === "low")
    issues.push({
      code: "underexposed",
      severity: "warning",
      message: "The image appears too dark and may need exposure correction.",
    });
  else if (signals.exposure === "high")
    issues.push({
      code: "overexposed",
      severity: "warning",
      message: "The image appears too bright and may have lost highlight detail.",
    });

  if (signals.contrastScore !== undefined && signals.contrastScore <= 0.2)
    issues.push({
      code: "contrast-low",
      severity: "warning",
      message: "The image has low contrast and may need correction.",
    });

  if (signals.subjectCount === 0)
    issues.push({
      code: "subject-missing",
      severity: "warning",
      message: "No clear main subject was detected. Check the crop manually.",
    });
  else if (signals.subjectCount !== undefined && signals.subjectCount > 1)
    issues.push({
      code: "multiple-subjects",
      severity: "warning",
      message: "Multiple subjects were detected. Confirm which subject should be used.",
    });

  return {
    width: signals.width,
    height: signals.height,
    megapixels: Math.round((signals.width * signals.height) / 10_000) / 100,
    issues,
    acceptableForPreview: true,
  };
}

export function printPpiForSize(
  widthPixels: number,
  heightPixels: number,
  widthMm: number,
  heightMm: number,
) {
  if (
    ![widthPixels, heightPixels, widthMm, heightMm].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error("Invalid print-size values.");
  const widthInches = widthMm / 25.4;
  const heightInches = heightMm / 25.4;
  return Math.floor(Math.min(widthPixels / widthInches, heightPixels / heightInches));
}


function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function analyzePixelBuffer(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Pick<
  ImageQualitySignals,
  "blurScore" | "exposure" | "contrastScore"
> {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 2 ||
    height < 2 ||
    rgba.length !== width * height * 4
  )
    throw new Error("Invalid pixel buffer.");

  const luminance = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    const alpha = rgba[i + 3] / 255;
    const y =
      ((0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) /
        255) *
        alpha +
      (1 - alpha);
    luminance[p] = y;
    sum += y;
  }

  const mean = sum / luminance.length;
  let varianceSum = 0;
  for (const value of luminance) varianceSum += (value - mean) ** 2;
  const standardDeviation = Math.sqrt(varianceSum / luminance.length);
  const contrastScore = clamp01(standardDeviation / 0.32);

  let laplacianSum = 0;
  let laplacianSquares = 0;
  let laplacianCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const laplacian =
        luminance[i - 1] +
        luminance[i + 1] +
        luminance[i - width] +
        luminance[i + width] -
        4 * luminance[i];
      laplacianSum += laplacian;
      laplacianSquares += laplacian * laplacian;
      laplacianCount++;
    }
  }
  const laplacianMean = laplacianCount ? laplacianSum / laplacianCount : 0;
  const laplacianVariance = laplacianCount
    ? laplacianSquares / laplacianCount - laplacianMean * laplacianMean
    : 0;
  // Conservative heuristic: high values mean higher blur risk. A provider can
  // later replace/supplement this signal without changing the assessment UI.
  const blurScore = clamp01((0.006 - laplacianVariance) / 0.006);

  return {
    blurScore,
    exposure: mean < 0.2 ? "low" : mean > 0.88 ? "high" : "ok",
    contrastScore,
  };
}

export async function analyzeBitmapQuality(
  bitmap: ImageBitmap,
): Promise<Pick<ImageQualitySignals, "blurScore" | "exposure" | "contrastScore">> {
  const maxSide = 160;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(2, Math.round(bitmap.width * scale));
  const height = Math.max(2, Math.round(bitmap.height * scale));
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!context) throw new Error("Image quality analysis is unavailable.");
  context.drawImage(bitmap, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  return analyzePixelBuffer(pixels.data, width, height);
}
