"use client";
import {
  useEffect,
  useRef,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import { clamp, type CustomizationDocument } from "@/lib/customization/model";
import { moveCrop, resizeCrop } from "@/lib/customization/geometry";
import {
  renderCustomization,
  type RenderResult,
} from "@/lib/customization/render";
import type { CustomizationProduct } from "@/lib/customization";
import type { UiLanguage } from "@/lib/i18n";

const ariaCopy = {
  en: {
    crop: "Crop photograph. Drag corners or use crop controls.",
    preview: "Live indicative preview. Drag the photograph or use position controls.",
    fallback: "Your browser must support canvas to display the live preview.",
  },
  gu: {
    crop: "ફોટો ક્રોપ કરો. Corners drag કરો અથવા crop controls વાપરો.",
    preview: "લાઇવ અંદાજિત પ્રિવ્યૂ. ફોટો drag કરો અથવા position controls વાપરો.",
    fallback: "લાઇવ પ્રિવ્યૂ જોવા તમારા browserમાં canvas support જરૂરી છે.",
  },
  hi: {
    crop: "फोटो क्रॉप करें. Corners drag करें या crop controls उपयोग करें.",
    preview: "लाइव अनुमानित प्रीव्यू. फोटो drag करें या position controls उपयोग करें.",
    fallback: "लाइव प्रीव्यू दिखाने के लिए browser में canvas support आवश्यक है.",
  },
  mr: {
    crop: "फोटो क्रॉप करा. Corners drag करा किंवा crop controls वापरा.",
    preview: "लाइव्ह अंदाजे प्रीव्ह्यू. फोटो drag करा किंवा position controls वापरा.",
    fallback: "लाइव्ह प्रीव्ह्यू दाखवण्यासाठी browserमध्ये canvas support आवश्यक आहे.",
  },
} as const;

export function CanvasPreview({
  document: doc,
  bitmap,
  product,
  cropMode = false,
  onChange,
  onOverflow,
  lang = "en",
}: {
  document: CustomizationDocument;
  bitmap: ImageBitmap | null;
  product: CustomizationProduct;
  cropMode?: boolean;
  onChange?: (doc: CustomizationDocument) => void;
  onOverflow?: (overflow: boolean) => void;
  lang?: UiLanguage;
}) {
  const t = ariaCopy[lang];
  const canvas = useRef<HTMLCanvasElement>(null),
    geometry = useRef<RenderResult | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    doc: CustomizationDocument;
    mode: string;
    pointer: number;
  } | null>(null);

  useEffect(() => {
    const node = canvas.current,
      ctx = node?.getContext("2d");
    if (!ctx) return;
    const frame = requestAnimationFrame(() => {
      geometry.current = renderCustomization(
        ctx,
        doc,
        bitmap,
        product.name,
        product.variants.find((v) => v.id === doc.variantId)?.name || "",
        cropMode,
      );
      onOverflow?.(geometry.current.textOverflow);
    });
    return () => cancelAnimationFrame(frame);
  }, [doc, bitmap, product, cropMode, onOverflow]);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) * 1000) / box.width,
      y: ((e.clientY - box.top) * 1000) / box.height,
    };
  };

  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (!onChange || !bitmap || !geometry.current || drag.current) return;
    const p = point(e),
      g = geometry.current;
    let mode = "pan";
    if (cropMode && g.cropBox) {
      const b = g.cropBox,
        c = doc.image.crop,
        left = b.x + c.x * b.width,
        top = b.y + c.y * b.height,
        right = left + c.width * b.width,
        bottom = top + c.height * b.height;
      const corners = [
        ["nw", left, top],
        ["ne", right, top],
        ["sw", left, bottom],
        ["se", right, bottom],
      ] as const;
      mode =
        corners.find(
          ([, x, y]) => Math.abs(p.x - x) < 40 && Math.abs(p.y - y) < 40,
        )?.[0] || "move";
      if (
        mode === "move" &&
        (p.x < left || p.x > right || p.y < top || p.y > bottom)
      )
        return;
    } else if (
      p.x < g.photo.x ||
      p.x > g.photo.x + g.photo.width ||
      p.y < g.photo.y ||
      p.y > g.photo.y + g.photo.height
    )
      return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { ...p, doc, mode, pointer: e.pointerId };
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    const start = drag.current,
      g = geometry.current;
    if (!start || !g || !onChange || start.pointer !== e.pointerId) return;
    const p = point(e),
      dx = p.x - start.x,
      dy = p.y - start.y;
    if (start.mode === "pan")
      onChange({
        ...start.doc,
        image: {
          ...start.doc.image,
          panX: clamp(
            start.doc.image.panX + (g.panRange.x ? dx / g.panRange.x : 0),
            -1,
            1,
          ),
          panY: clamp(
            start.doc.image.panY + (g.panRange.y ? dy / g.panRange.y : 0),
            -1,
            1,
          ),
        },
      });
    else if (g.cropBox) {
      const crop =
        start.mode === "move"
          ? moveCrop(
              start.doc.image.crop,
              dx / g.cropBox.width,
              dy / g.cropBox.height,
            )
          : resizeCrop(
              start.doc.image.crop,
              start.mode,
              dx / g.cropBox.width,
              dy / g.cropBox.height,
            );
      onChange({
        ...start.doc,
        image: { ...start.doc.image, crop, zoom: 1, panX: 0, panY: 0 },
      });
    }
  }

  function end(e: PointerEvent<HTMLCanvasElement>) {
    if (drag.current?.pointer === e.pointerId) {
      drag.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function key(e: KeyboardEvent<HTMLCanvasElement>) {
    if (
      !onChange ||
      !bitmap ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
    )
      return;
    e.preventDefault();
    const amount = e.shiftKey ? 0.1 : 0.025,
      dx =
        e.key === "ArrowLeft" ? -amount : e.key === "ArrowRight" ? amount : 0,
      dy = e.key === "ArrowUp" ? -amount : e.key === "ArrowDown" ? amount : 0;
    onChange({
      ...doc,
      image: cropMode
        ? { ...doc.image, crop: moveCrop(doc.image.crop, dx, dy) }
        : {
            ...doc.image,
            panX: clamp(doc.image.panX + dx, -1, 1),
            panY: clamp(doc.image.panY + dy, -1, 1),
          },
    });
  }

  return (
    <canvas
      ref={canvas}
      width={1000}
      height={1000}
      className={"editor-canvas" + (onChange ? " is-interactive" : "")}
      aria-label={cropMode ? t.crop : t.preview}
      role="img"
      tabIndex={onChange ? 0 : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
      onKeyDown={key}
    >
      {t.fallback}
    </canvas>
  );
}
