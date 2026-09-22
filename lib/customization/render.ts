import type { CustomizationDocument, TextLayer } from "./model";
import { frameFor, relativeBox, templates, type Box } from "./templates";
import { cropStage, placement } from "./geometry";
const families = {
  sans: "Arial, sans-serif",
  serif: "Georgia, serif",
  mono: "monospace",
};
export const CANVAS_SIZE = 1000;
function photoFilter(doc: CustomizationDocument) {
  const a = doc.image.adjustments;
  return `brightness(${a.brightness}) contrast(${a.contrast}) saturate(${a.saturation})`;
}
function shape(ctx: CanvasRenderingContext2D, box: Box, kind: string) {
  ctx.beginPath();
  if (kind === "circle")
    ctx.ellipse(
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.width / 2,
      box.height / 2,
      0,
      0,
      Math.PI * 2,
    );
  else if (kind === "shield") {
    ctx.moveTo(box.x + box.width / 2, box.y);
    ctx.lineTo(box.x + box.width, box.y + box.height * 0.12);
    ctx.lineTo(box.x + box.width * 0.94, box.y + box.height * 0.82);
    ctx.quadraticCurveTo(
      box.x + box.width * 0.5,
      box.y + box.height * 1.06,
      box.x + box.width * 0.06,
      box.y + box.height * 0.82,
    );
    ctx.lineTo(box.x, box.y + box.height * 0.12);
    ctx.closePath();
  } else
    ctx.roundRect(
      box.x,
      box.y,
      box.width,
      box.height,
      Math.min(28, box.height * 0.08),
    );
}
function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const char of Array.from(paragraph)) {
      if (line && ctx.measureText(line + char).width > width) {
        result.push(line.trimEnd());
        line = char.trimStart();
      } else line += char;
    }
    result.push(line.trimEnd());
  }
  return result;
}
function drawText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  box: Box,
  scale: number,
): boolean {
  if (!layer.text) return false;
  let size = layer.fontSize * scale,
    rows: string[] = [];
  for (; size >= 10; size -= 1) {
    ctx.font = size + "px " + families[layer.font];
    rows = lines(ctx, layer.text, box.width);
    if (rows.length * size * 1.2 <= box.height) break;
  }
  const overflow = size < 10;
  size = Math.max(10, size);
  ctx.font = size + "px " + families[layer.font];
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.fillStyle = "#292b26";
  ctx.textAlign = layer.align;
  ctx.textBaseline = "middle";
  const x =
    layer.align === "left"
      ? box.x
      : layer.align === "right"
        ? box.x + box.width
        : box.x + box.width / 2;
  const top =
    box.y +
    Math.max(
      size * 0.6,
      (box.height - rows.length * size * 1.2) / 2 + size * 0.6,
    );
  rows.forEach((line, i) => ctx.fillText(line, x, top + i * size * 1.2));
  ctx.restore();
  return overflow;
}
export type RenderResult = {
  textOverflow: boolean;
  photo: Box;
  panRange: { x: number; y: number };
  cropBox: Box | null;
};
export function renderCustomization(
  ctx: CanvasRenderingContext2D,
  doc: CustomizationDocument,
  bitmap: ImageBitmap | null,
  productName: string,
  variantName: string,
  cropMode = false,
): RenderResult {
  ctx.save();
  ctx.clearRect(0, 0, 1000, 1000);
  ctx.fillStyle = "#f4f0e7";
  ctx.fillRect(0, 0, 1000, 1000);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#48463f";
  ctx.font = "22px Arial";
  ctx.fillText("YASH LASER · ESTABLISHED 1997", 500, 40);
  const template = templates[doc.templateId],
    frame = frameFor(template),
    photo = relativeBox(frame, template.photo);
  let textOverflow = false,
    panRange = { x: 0, y: 0 },
    cropBox: Box | null = null;
  if (cropMode && bitmap) {
    const stage = cropStage(bitmap.width, bitmap.height);
    cropBox = stage;
    ctx.filter = photoFilter(doc);
    ctx.drawImage(bitmap, stage.x, stage.y, stage.width, stage.height);
    ctx.filter = "none";
    const crop = doc.image.crop,
      box = {
        x: stage.x + crop.x * stage.width,
        y: stage.y + crop.y * stage.height,
        width: crop.width * stage.width,
        height: crop.height * stage.height,
      };
    ctx.fillStyle = "#0009";
    ctx.beginPath();
    ctx.rect(stage.x, stage.y, stage.width, stage.height);
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.fill("evenodd");
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(box.x + (i * box.width) / 3, box.y);
      ctx.lineTo(box.x + (i * box.width) / 3, box.y + box.height);
      ctx.moveTo(box.x, box.y + (i * box.height) / 3);
      ctx.lineTo(box.x + box.width, box.y + (i * box.height) / 3);
      ctx.stroke();
    }
    for (const x of [box.x, box.x + box.width])
      for (const y of [box.y, box.y + box.height]) {
        ctx.fillStyle = "#292b26";
        ctx.fillRect(x - 15, y - 15, 30, 30);
        ctx.strokeRect(x - 15, y - 15, 30, 30);
      }
  } else {
    ctx.save();
    shape(ctx, frame, template.shape);
    ctx.fillStyle = "#fffdf6";
    ctx.fill();
    ctx.strokeStyle = "#ab8a4d";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.clip();
    if (doc.templateId === "id-card") {
      ctx.fillStyle = "#303936";
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height * 0.08);
    }
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photo.x, photo.y, photo.width, photo.height, 8);
    ctx.clip();
    ctx.fillStyle = "#e4e4d9";
    ctx.fillRect(photo.x, photo.y, photo.width, photo.height);
    if (bitmap) {
      const layout = placement(bitmap.width, bitmap.height, photo, doc.image);
      const s = layout.source,
        d = layout.destination;
      ctx.filter = photoFilter(doc);
      ctx.drawImage(
        bitmap,
        s.x,
        s.y,
        s.width,
        s.height,
        d.x,
        d.y,
        d.width,
        d.height,
      );
      ctx.filter = "none";
      panRange = { x: layout.rangeX, y: layout.rangeY };
    } else {
      ctx.fillStyle = "#6f7267";
      ctx.textAlign = "center";
      ctx.font = "22px Arial";
      ctx.fillText(
        "Photo / logo",
        photo.x + photo.width / 2,
        photo.y + photo.height / 2,
        photo.width - 10,
      );
    }
    ctx.restore();
    doc.text.forEach((layer, i) => {
      if (
        drawText(
          ctx,
          layer,
          relativeBox(frame, template.text[i]),
          frame.width / 600,
        )
      )
        textOverflow = true;
    });
    ctx.restore();
    if (template.base) {
      ctx.fillStyle = "#ad8d52";
      ctx.fillRect(
        frame.x - 15,
        frame.y + frame.height - 2,
        frame.width + 30,
        20,
      );
    }
    if (doc.templateId === "keychain") {
      ctx.strokeStyle = "#777";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(500, frame.y - 27, 29, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#292b26";
  ctx.textAlign = "center";
  ctx.font = "22px Arial";
  ctx.fillText(
    productName.length > 74 ? productName.slice(0, 71) + "…" : productName,
    500,
    900,
    940,
  );
  ctx.font = "20px Arial";
  ctx.fillText(
    (variantName || "Size to confirm") + " · Quantity " + doc.quantity,
    500,
    933,
    940,
  );
  ctx.font = "17px Arial";
  ctx.fillText(
    cropMode
      ? "Drag corners to crop. Drag inside to move the crop."
      : "Indicative layout only · Digital mockup approval required",
    500,
    973,
    940,
  );
  ctx.restore();
  return { textOverflow, photo, panRange, cropBox };
}
