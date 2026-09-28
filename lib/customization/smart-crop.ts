import type { Crop } from "./model";
import { cropPreset } from "./geometry";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function smartCropForBitmap(
  bitmap: ImageBitmap,
  targetAspect: number,
): Promise<{ crop: Crop; subjectAware: boolean }> {
  if (
    !Number.isFinite(targetAspect) ||
    targetAspect <= 0 ||
    bitmap.width < 1 ||
    bitmap.height < 1
  )
    throw new Error("Smart crop is unavailable.");

  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(2, Math.round(bitmap.width * scale));
  const height = Math.max(2, Math.round(bitmap.height * scale));
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Smart crop is unavailable.");
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let subjectPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 32) continue;
      subjectPixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const coverage = subjectPixels / (width * height);
  if (
    maxX < minX ||
    maxY < minY ||
    coverage > 0.94
  )
    return {
      crop: cropPreset(bitmap.width, bitmap.height, targetAspect),
      subjectAware: false,
    };

  const padX = Math.max(2, Math.round((maxX - minX + 1) * 0.08));
  const padY = Math.max(2, Math.round((maxY - minY + 1) * 0.08));
  let left = clamp(minX - padX, 0, width - 1);
  let top = clamp(minY - padY, 0, height - 1);
  let right = clamp(maxX + padX + 1, left + 1, width);
  let bottom = clamp(maxY + padY + 1, top + 1, height);

  const imageAspect = bitmap.width / bitmap.height;
  const targetSampleAspect = targetAspect / imageAspect;
  let boxWidth = right - left;
  let boxHeight = bottom - top;
  const current = boxWidth / boxHeight;

  if (current < targetSampleAspect) {
    const wanted = boxHeight * targetSampleAspect;
    const extra = wanted - boxWidth;
    left -= extra / 2;
    right += extra / 2;
  } else {
    const wanted = boxWidth / targetSampleAspect;
    const extra = wanted - boxHeight;
    top -= extra / 2;
    bottom += extra / 2;
  }

  if (left < 0) {
    right -= left;
    left = 0;
  }
  if (right > width) {
    left -= right - width;
    right = width;
  }
  if (top < 0) {
    bottom -= top;
    top = 0;
  }
  if (bottom > height) {
    top -= bottom - height;
    bottom = height;
  }

  left = clamp(left, 0, width - 1);
  top = clamp(top, 0, height - 1);
  right = clamp(right, left + 1, width);
  bottom = clamp(bottom, top + 1, height);

  return {
    crop: {
      x: left / width,
      y: top / height,
      width: (right - left) / width,
      height: (bottom - top) / height,
    },
    subjectAware: true,
  };
}
