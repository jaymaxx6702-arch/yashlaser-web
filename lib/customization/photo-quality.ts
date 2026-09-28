export type PhotoQualityIssueCode =
  | "resolution-low"
  | "blur-risk"
  | "too-dark"
  | "too-bright"
  | "contrast-low";

export type PhotoQualityIssue = {
  code: PhotoQualityIssueCode;
  severity: "warning";
};

export type PhotoQualityReport = {
  width: number;
  height: number;
  megapixels: number;
  meanLuma: number;
  contrast: number;
  sharpness: number;
  faceCount: number | null;
  status: "good" | "warning";
  issues: PhotoQualityIssue[];
};

export type PhotoQualitySignals = {
  meanLuma: number;
  contrast: number;
  sharpness: number;
};

function finite(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function assessPhotoQuality(input: {
  width: number;
  height: number;
  signals: PhotoQualitySignals;
  faceCount?: number | null;
}): PhotoQualityReport {
  const { width, height, signals } = input;
  const faceCount = input.faceCount ?? null;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    !finite(signals.meanLuma, 0, 255) ||
    !finite(signals.contrast, 0, 255) ||
    !Number.isFinite(signals.sharpness) ||
    signals.sharpness < 0 ||
    (faceCount !== null &&
      (!Number.isInteger(faceCount) || faceCount < 0 || faceCount > 100))
  )
    throw new Error("Invalid photo quality data.");

  const megapixels = (width * height) / 1_000_000;
  const issues: PhotoQualityIssue[] = [];

  if (megapixels < 1 || Math.min(width, height) < 700)
    issues.push({ code: "resolution-low", severity: "warning" });
  if (signals.meanLuma < 55)
    issues.push({ code: "too-dark", severity: "warning" });
  if (signals.meanLuma > 205)
    issues.push({ code: "too-bright", severity: "warning" });
  if (signals.contrast < 28)
    issues.push({ code: "contrast-low", severity: "warning" });
  if (signals.sharpness < 45)
    issues.push({ code: "blur-risk", severity: "warning" });

  return {
    width,
    height,
    megapixels: Math.round(megapixels * 100) / 100,
    meanLuma: Math.round(signals.meanLuma * 10) / 10,
    contrast: Math.round(signals.contrast * 10) / 10,
    sharpness: Math.round(signals.sharpness * 10) / 10,
    faceCount,
    status: issues.length ? "warning" : "good",
    issues,
  };
}

export function analyzePixelBuffer(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): PhotoQualitySignals {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 3 ||
    height < 3 ||
    rgba.length !== width * height * 4
  )
    throw new Error("Invalid photo sample.");

  const luma = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 1) {
    const alpha = rgba[i + 3] / 255;
    const value =
      (0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) *
        alpha +
      255 * (1 - alpha);
    luma[p] = value;
    sum += value;
  }

  const meanLuma = sum / luma.length;
  let variance = 0;
  for (const value of luma) variance += (value - meanLuma) ** 2;
  const contrast = Math.sqrt(variance / luma.length);

  let laplaceSum = 0;
  let laplaceSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const value =
        luma[i - 1] +
        luma[i + 1] +
        luma[i - width] +
        luma[i + width] -
        4 * luma[i];
      laplaceSum += value;
      laplaceSquares += value * value;
      count += 1;
    }
  }
  const laplaceMean = count ? laplaceSum / count : 0;
  const sharpness = count
    ? Math.max(0, laplaceSquares / count - laplaceMean * laplaceMean)
    : 0;

  return { meanLuma, contrast, sharpness };
}

type FaceDetectorConstructor = new (options?: {
  maxDetectedFaces?: number;
  fastMode?: boolean;
}) => {
  detect(source: ImageBitmap): Promise<unknown[]>;
};

async function detectFaceCount(bitmap: ImageBitmap): Promise<number | null> {
  const FaceDetector = (
    globalThis as typeof globalThis & {
      FaceDetector?: FaceDetectorConstructor;
    }
  ).FaceDetector;
  if (!FaceDetector) return null;

  try {
    const detector = new FaceDetector({
      maxDetectedFaces: 20,
      fastMode: true,
    });
    const faces = await detector.detect(bitmap);
    return Array.isArray(faces) ? Math.min(faces.length, 100) : null;
  } catch {
    return null;
  }
}

export async function analyzeBitmapQuality(
  bitmap: ImageBitmap,
): Promise<PhotoQualityReport> {
  const maxSide = 320;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(3, Math.round(bitmap.width * scale));
  const height = Math.max(3, Math.round(bitmap.height * scale));
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!context) throw new Error("Photo quality analysis is unavailable.");
  context.drawImage(bitmap, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  const faceCount = await detectFaceCount(bitmap);
  return assessPhotoQuality({
    width: bitmap.width,
    height: bitmap.height,
    signals: analyzePixelBuffer(pixels.data, width, height),
    faceCount,
  });
}
