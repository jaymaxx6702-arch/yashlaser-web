export type PhotoQualityLevel = "good" | "warning" | "poor" | "not-checked";

export type PhotoQualityIssue =
  | "resolution-low"
  | "resolution-borderline"
  | "dpi-low"
  | "dpi-borderline"
  | "blur-likely"
  | "blur-possible"
  | "underexposed"
  | "overexposed"
  | "exposure-borderline"
  | "contrast-low"
  | "contrast-borderline";

export type PhotoQualityReport = {
  width: number;
  height: number;
  megapixels: number;
  dpi: number | null;
  resolution: PhotoQualityLevel;
  blur: PhotoQualityLevel;
  exposure: PhotoQualityLevel;
  contrast: PhotoQualityLevel;
  subject: PhotoQualityLevel;
  metrics: {
    meanLuma: number;
    lumaStdDev: number;
    edgeEnergy: number;
    shadowClipRatio: number;
    highlightClipRatio: number;
  };
  issues: PhotoQualityIssue[];
};

type PixelSample = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  targetWidthInches?: number;
};

const level = (
  poor: boolean,
  warning: boolean,
): Exclude<PhotoQualityLevel, "not-checked"> =>
  poor ? "poor" : warning ? "warning" : "good";

export function analyzePixelSample(sample: PixelSample): PhotoQualityReport {
  const { data, width, height, sourceWidth, sourceHeight } = sample;
  if (
    width < 1 ||
    height < 1 ||
    sourceWidth < 1 ||
    sourceHeight < 1 ||
    data.length !== width * height * 4
  )
    throw new Error("Invalid photo quality sample.");

  const luma = new Float64Array(width * height);
  let sum = 0;
  let sumSquares = 0;
  let shadows = 0;
  let highlights = 0;

  for (let pixel = 0, i = 0; pixel < luma.length; pixel++, i += 4) {
    const y = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
    luma[pixel] = y;
    sum += y;
    sumSquares += y * y;
    if (y <= 8) shadows++;
    if (y >= 247) highlights++;
  }

  const meanLuma = sum / luma.length;
  const variance = Math.max(0, sumSquares / luma.length - meanLuma * meanLuma);
  const lumaStdDev = Math.sqrt(variance);
  const shadowClipRatio = shadows / luma.length;
  const highlightClipRatio = highlights / luma.length;

  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const current = luma[y * width + x];
      if (x > 0) {
        edgeSum += Math.abs(current - luma[y * width + x - 1]);
        edgeCount++;
      }
      if (y > 0) {
        edgeSum += Math.abs(current - luma[(y - 1) * width + x]);
        edgeCount++;
      }
    }
  }
  const edgeEnergy = edgeCount ? edgeSum / edgeCount : 0;

  const shortEdge = Math.min(sourceWidth, sourceHeight);
  const resolution = level(shortEdge < 800, shortEdge < 1400);
  const blur = level(edgeEnergy < 5, edgeEnergy < 10);
  const exposure = level(
    meanLuma < 45 ||
      meanLuma > 210 ||
      shadowClipRatio > 0.2 ||
      highlightClipRatio > 0.2,
    meanLuma < 70 ||
      meanLuma > 185 ||
      shadowClipRatio > 0.08 ||
      highlightClipRatio > 0.08,
  );
  const contrast = level(lumaStdDev < 22, lumaStdDev < 38);

  const targetWidthInches = sample.targetWidthInches;
  const dpi =
    targetWidthInches && targetWidthInches > 0
      ? sourceWidth / targetWidthInches
      : null;
  const dpiLevel =
    dpi === null ? null : level(dpi < 120, dpi < 180);

  const issues: PhotoQualityIssue[] = [];
  if (resolution === "poor") issues.push("resolution-low");
  else if (resolution === "warning") issues.push("resolution-borderline");
  if (dpiLevel === "poor") issues.push("dpi-low");
  else if (dpiLevel === "warning") issues.push("dpi-borderline");
  if (blur === "poor") issues.push("blur-likely");
  else if (blur === "warning") issues.push("blur-possible");
  if (exposure === "poor")
    issues.push(meanLuma < 45 ? "underexposed" : "overexposed");
  else if (exposure === "warning") issues.push("exposure-borderline");
  if (contrast === "poor") issues.push("contrast-low");
  else if (contrast === "warning") issues.push("contrast-borderline");

  return {
    width: sourceWidth,
    height: sourceHeight,
    megapixels: (sourceWidth * sourceHeight) / 1_000_000,
    dpi,
    resolution,
    blur,
    exposure,
    contrast,
    subject: "not-checked",
    metrics: {
      meanLuma,
      lumaStdDev,
      edgeEnergy,
      shadowClipRatio,
      highlightClipRatio,
    },
    issues,
  };
}

export async function analyzePhotoQuality(
  bitmap: ImageBitmap,
): Promise<PhotoQualityReport> {
  const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {
    alpha: false,
    willReadFrequently: true,
  });
  if (!context) throw new Error("Photo quality analysis is unavailable.");

  context.drawImage(bitmap, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  return analyzePixelSample({
    data: pixels.data,
    width,
    height,
    sourceWidth: bitmap.width,
    sourceHeight: bitmap.height,
  });
}
