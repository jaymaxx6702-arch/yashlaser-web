export type RefinementPoint = { x: number; y: number };
export type RefinementStroke = {
  mode: "erase" | "restore";
  radius: number;
  points: RefinementPoint[];
};

export const MAX_REFINEMENT_STROKES = 500;
export const MAX_REFINEMENT_PIXELS = 12_000_000;

function bounded(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateRefinementStrokes(
  strokes: readonly RefinementStroke[],
): RefinementStroke[] {
  if (!Array.isArray(strokes) || strokes.length > MAX_REFINEMENT_STROKES)
    throw new Error("Too many cutout refinement strokes.");
  return strokes.map((stroke) => {
    if (
      !stroke ||
      !["erase", "restore"].includes(stroke.mode) ||
      !Number.isFinite(stroke.radius) ||
      stroke.radius < 0.002 ||
      stroke.radius > 0.25 ||
      !Array.isArray(stroke.points) ||
      stroke.points.length < 1 ||
      stroke.points.length > 4000 ||
      stroke.points.some((point) => !bounded(point.x) || !bounded(point.y))
    )
      throw new Error("Invalid cutout refinement stroke.");
    return {
      mode: stroke.mode,
      radius: stroke.radius,
      points: stroke.points.map((point) => ({ x: point.x, y: point.y })),
    };
  });
}

function traceStroke(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  stroke: RefinementStroke,
  width: number,
  height: number,
) {
  const size = Math.min(width, height);
  ctx.lineWidth = stroke.radius * size * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const first = stroke.points[0];
  ctx.moveTo(first.x * width, first.y * height);
  if (stroke.points.length === 1)
    ctx.lineTo(first.x * width + 0.01, first.y * height + 0.01);
  else
    for (const point of stroke.points.slice(1))
      ctx.lineTo(point.x * width, point.y * height);
  ctx.stroke();
}

export function drawRefinementPreview(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  processed: CanvasImageSource,
  original: CanvasImageSource,
  strokes: readonly RefinementStroke[],
  width: number,
  height: number,
) {
  const safe = validateRefinementStrokes(strokes);
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(processed, 0, 0, width, height);

  for (const stroke of safe) {
    if (stroke.mode === "erase") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000";
      traceStroke(ctx, stroke, width, height);
      ctx.restore();
      continue;
    }

    const temp =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement("canvas"), { width, height });
    const tempCtx = temp.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!tempCtx) throw new Error("Cutout refinement is unavailable.");
    tempCtx.drawImage(original, 0, 0, width, height);
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.strokeStyle = "#000";
    traceStroke(tempCtx, stroke, width, height);
    ctx.drawImage(temp as CanvasImageSource, 0, 0, width, height);
  }
  ctx.restore();
}

async function canvasBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): Promise<Blob> {
  if ("convertToBlob" in canvas)
    return canvas.convertToBlob({ type: "image/png" });
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Unable to export refined cutout.")),
      "image/png",
    ),
  );
}

export async function applyCutoutRefinement(
  processedBlob: Blob,
  originalBlob: Blob,
  strokes: readonly RefinementStroke[],
): Promise<Blob> {
  const safe = validateRefinementStrokes(strokes);
  if (!safe.length) return processedBlob;
  const [processed, original] = await Promise.all([
    createImageBitmap(processedBlob, { imageOrientation: "from-image" }),
    createImageBitmap(originalBlob, { imageOrientation: "from-image" }),
  ]);
  try {
    if (
      processed.width * processed.height > MAX_REFINEMENT_PIXELS ||
      processed.width < 1 ||
      processed.height < 1
    )
      throw new Error(
        "This image is too large for manual cutout refinement on this device. Use the original photo or a smaller source.",
      );
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(processed.width, processed.height)
        : Object.assign(document.createElement("canvas"), {
            width: processed.width,
            height: processed.height,
          });
    const ctx = canvas.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) throw new Error("Cutout refinement is unavailable.");
    drawRefinementPreview(
      ctx,
      processed,
      original,
      safe,
      processed.width,
      processed.height,
    );
    const output = await canvasBlob(canvas);
    if (!output.size) throw new Error("Unable to export refined cutout.");
    return output;
  } finally {
    processed.close();
    original.close();
  }
}
