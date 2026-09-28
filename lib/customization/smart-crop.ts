import type { Crop } from "./model";
import { cropPreset } from "./geometry";

type DetectionBox = { x: number; y: number; width: number; height: number };
type FaceDetectorConstructor = new (options?: {
  maxDetectedFaces?: number;
  fastMode?: boolean;
}) => {
  detect(
    source: ImageBitmap,
  ): Promise<Array<{ boundingBox: DetectionBox }>>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function focusCrop(
  width: number,
  height: number,
  targetAspect: number,
  focusX: number,
  focusY: number,
): Crop {
  const preset = cropPreset(width, height, targetAspect);
  const cropWidth = preset.width * width;
  const cropHeight = preset.height * height;

  const left = clamp(
    focusX - cropWidth / 2,
    0,
    Math.max(0, width - cropWidth),
  );
  // Place detected faces near the upper third so portraits retain more body.
  const top = clamp(
    focusY - cropHeight * 0.35,
    0,
    Math.max(0, height - cropHeight),
  );

  return {
    x: left / width,
    y: top / height,
    width: cropWidth / width,
    height: cropHeight / height,
  };
}

async function faceAwareCrop(
  bitmap: ImageBitmap,
  targetAspect: number,
): Promise<Crop | null> {
  const FaceDetector = (
    globalThis as typeof globalThis & {
      FaceDetector?: FaceDetectorConstructor;
    }
  ).FaceDetector;
  if (!FaceDetector) return null;

  try {
    const detector = new FaceDetector({
      maxDetectedFaces: 10,
      fastMode: true,
    });
    const faces = await detector.detect(bitmap);
    if (!faces.length) return null;

    let left = bitmap.width;
    let top = bitmap.height;
    let right = 0;
    let bottom = 0;
    for (const face of faces) {
      const box = face.boundingBox;
      if (
        !box ||
        !Number.isFinite(box.x) ||
        !Number.isFinite(box.y) ||
        !Number.isFinite(box.width) ||
        !Number.isFinite(box.height) ||
        box.width <= 0 ||
        box.height <= 0
      )
        continue;
      left = Math.min(left, box.x);
      top = Math.min(top, box.y);
      right = Math.max(right, box.x + box.width);
      bottom = Math.max(bottom, box.y + box.height);
    }

    if (right <= left || bottom <= top) return null;
    return focusCrop(
      bitmap.width,
      bitmap.height,
      targetAspect,
      (left + right) / 2,
      (top + bottom) / 2,
    );
  } catch {
    return null;
  }
}

function cropAroundTransparentSubject(
  bitmapWidth: number,
  bitmapHeight: number,
  targetAspect: number,
  box: DetectionBox,
): Crop {
  const padX = box.width * 0.08;
  const padY = box.height * 0.08;
  let left = clamp(box.x - padX, 0, bitmapWidth - 1);
  let top = clamp(box.y - padY, 0, bitmapHeight - 1);
  let right = clamp(box.x + box.width + padX, left + 1, bitmapWidth);
  let bottom = clamp(box.y + box.height + padY, top + 1, bitmapHeight);

  let boxWidth = right - left;
  let boxHeight = bottom - top;
  const current = boxWidth / boxHeight;

  if (current < targetAspect) {
    const wanted = boxHeight * targetAspect;
    const extra = wanted - boxWidth;
    left -= extra / 2;
    right += extra / 2;
  } else {
    const wanted = boxWidth / targetAspect;
    const extra = wanted - boxHeight;
    top -= extra / 2;
    bottom += extra / 2;
  }

  if (left < 0) {
    right -= left;
    left = 0;
  }
  if (right > bitmapWidth) {
    left -= right - bitmapWidth;
    right = bitmapWidth;
  }
  if (top < 0) {
    bottom -= top;
    top = 0;
  }
  if (bottom > bitmapHeight) {
    top -= bottom - bitmapHeight;
    bottom = bitmapHeight;
  }

  left = clamp(left, 0, bitmapWidth - 1);
  top = clamp(top, 0, bitmapHeight - 1);
  right = clamp(right, left + 1, bitmapWidth);
  bottom = clamp(bottom, top + 1, bitmapHeight);

  return {
    x: left / bitmapWidth,
    y: top / bitmapHeight,
    width: (right - left) / bitmapWidth,
    height: (bottom - top) / bitmapHeight,
  };
}

export async function smartCropForBitmap(
  bitmap: ImageBitmap,
  targetAspect: number,
): Promise<{
  crop: Crop;
  subjectAware: boolean;
  faceAware: boolean;
}> {
  if (
    !Number.isFinite(targetAspect) ||
    targetAspect <= 0 ||
    bitmap.width < 1 ||
    bitmap.height < 1
  )
    throw new Error("Smart crop is unavailable.");

  const faceCrop = await faceAwareCrop(bitmap, targetAspect);
  if (faceCrop)
    return { crop: faceCrop, subjectAware: true, faceAware: true };

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
  if (maxX < minX || maxY < minY || coverage > 0.94)
    return {
      crop: cropPreset(bitmap.width, bitmap.height, targetAspect),
      subjectAware: false,
      faceAware: false,
    };

  const box: DetectionBox = {
    x: (minX / width) * bitmap.width,
    y: (minY / height) * bitmap.height,
    width: ((maxX - minX + 1) / width) * bitmap.width,
    height: ((maxY - minY + 1) / height) * bitmap.height,
  };

  return {
    crop: cropAroundTransparentSubject(
      bitmap.width,
      bitmap.height,
      targetAspect,
      box,
    ),
    subjectAware: true,
    faceAware: false,
  };
}
