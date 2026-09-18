import { clamp, type Crop, type CustomizationDocument } from "./model";
import type { Box } from "./templates";
export function placement(
  width: number,
  height: number,
  box: Box,
  image: CustomizationDocument["image"],
) {
  const source = {
    x: width * image.crop.x,
    y: height * image.crop.y,
    width: width * image.crop.width,
    height: height * image.crop.height,
  };
  const scale =
    (image.fit === "cover"
      ? Math.max(box.width / source.width, box.height / source.height)
      : Math.min(box.width / source.width, box.height / source.height)) *
    image.zoom;
  const w = source.width * scale,
    h = source.height * scale,
    rangeX = Math.abs(w - box.width) / 2,
    rangeY = Math.abs(h - box.height) / 2;
  return {
    source,
    destination: {
      x: box.x + (box.width - w) / 2 + image.panX * rangeX,
      y: box.y + (box.height - h) / 2 + image.panY * rangeY,
      width: w,
      height: h,
    },
    rangeX,
    rangeY,
  };
}
export function moveCrop(crop: Crop, dx: number, dy: number): Crop {
  return {
    ...crop,
    x: clamp(crop.x + dx, 0, 1 - crop.width),
    y: clamp(crop.y + dy, 0, 1 - crop.height),
  };
}
export function resizeCrop(
  crop: Crop,
  corner: string,
  dx: number,
  dy: number,
): Crop {
  let left = crop.x,
    top = crop.y,
    right = crop.x + crop.width,
    bottom = crop.y + crop.height;
  if (corner.includes("w")) left = clamp(left + dx, 0, right - 0.05);
  if (corner.includes("e")) right = clamp(right + dx, left + 0.05, 1);
  if (corner.includes("n")) top = clamp(top + dy, 0, bottom - 0.05);
  if (corner.includes("s")) bottom = clamp(bottom + dy, top + 0.05, 1);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
export function cropPreset(width: number, height: number, ratio: number): Crop {
  const w = Math.min(width, height * ratio),
    h = w / ratio;
  return {
    x: (width - w) / width / 2,
    y: (height - h) / height / 2,
    width: w / width,
    height: h / height,
  };
}
export function cropStage(width: number, height: number): Box {
  const scale = Math.min(840 / width, 740 / height);
  return {
    x: (1000 - width * scale) / 2,
    y: 110 + (740 - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
}
