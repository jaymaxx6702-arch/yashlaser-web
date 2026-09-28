"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  applyCutoutRefinement,
  drawRefinementPreview,
  type RefinementStroke,
} from "@/lib/customization/refinement";
import type { UiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    title: "Refine cutout",
    help: "Erase leftover background or restore parts of the original. The original stays unchanged.",
    erase: "Erase",
    restore: "Restore",
    brush: "Brush size",
    undo: "Undo",
    reset: "Reset",
    compare: "Compare original",
    edited: "Show edited",
    cancel: "Cancel",
    apply: "Apply refinement",
    applying: "Applying…",
    error: "Unable to refine this cutout on this device.",
  },
  gu: {
    title: "Cutout સુધારો",
    help: "બાકી background erase કરો અથવા originalનો ભાગ restore કરો. Original બદલાતો નથી.",
    erase: "Erase",
    restore: "Restore",
    brush: "Brush size",
    undo: "Undo",
    reset: "Reset",
    compare: "Original જુઓ",
    edited: "Edited જુઓ",
    cancel: "Cancel",
    apply: "સુધારો લાગુ કરો",
    applying: "લાગુ થઈ રહ્યું છે…",
    error: "આ device પર cutout refine થઈ શક્યો નથી.",
  },
  hi: {
    title: "Cutout सुधारें",
    help: "बचा background erase करें या original का हिस्सा restore करें. Original नहीं बदलेगा.",
    erase: "Erase",
    restore: "Restore",
    brush: "Brush size",
    undo: "Undo",
    reset: "Reset",
    compare: "Original देखें",
    edited: "Edited देखें",
    cancel: "Cancel",
    apply: "सुधार लागू करें",
    applying: "लागू हो रहा है…",
    error: "इस device पर cutout refine नहीं हो सका.",
  },
  mr: {
    title: "Cutout सुधारा",
    help: "उरलेले background erase करा किंवा originalचा भाग restore करा. Original बदलणार नाही.",
    erase: "Erase",
    restore: "Restore",
    brush: "Brush size",
    undo: "Undo",
    reset: "Reset",
    compare: "Original पाहा",
    edited: "Edited पाहा",
    cancel: "Cancel",
    apply: "सुधार लागू करा",
    applying: "लागू होत आहे…",
    error: "या deviceवर cutout refine करता आला नाही.",
  },
} as const;

export function CutoutRefinement({
  processed,
  original,
  lang = "en",
  onApply,
  onCancel,
}: {
  processed: Blob;
  original: Blob;
  lang?: UiLanguage;
  onApply: (blob: Blob) => Promise<void>;
  onCancel: () => void;
}) {
  const t = copy[lang];
  const canvas = useRef<HTMLCanvasElement>(null);
  const bitmaps = useRef<{ processed: ImageBitmap; original: ImageBitmap } | null>(
    null,
  );
  const active = useRef<number | null>(null);
  const [strokes, setStrokes] = useState<RefinementStroke[]>([]);
  const [mode, setMode] = useState<"erase" | "restore">("erase");
  const [radius, setRadius] = useState(0.035);
  const [showOriginal, setShowOriginal] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      createImageBitmap(processed, { imageOrientation: "from-image" }),
      createImageBitmap(original, { imageOrientation: "from-image" }),
    ])
      .then(([processedBitmap, originalBitmap]) => {
        if (cancelled) {
          processedBitmap.close();
          originalBitmap.close();
          return;
        }
        bitmaps.current = { processed: processedBitmap, original: originalBitmap };
        const node = canvas.current;
        if (node) {
          const scale = Math.min(
            1,
            900 / Math.max(processedBitmap.width, processedBitmap.height),
          );
          node.width = Math.max(2, Math.round(processedBitmap.width * scale));
          node.height = Math.max(2, Math.round(processedBitmap.height * scale));
        }
        setReady(true);
      })
      .catch(() => setError(t.error));
    return () => {
      cancelled = true;
      bitmaps.current?.processed.close();
      bitmaps.current?.original.close();
      bitmaps.current = null;
    };
  }, [processed, original, t.error]);

  useEffect(() => {
    const node = canvas.current;
    const images = bitmaps.current;
    const ctx = node?.getContext("2d");
    if (!node || !ctx || !images || !ready) return;
    if (showOriginal) {
      ctx.clearRect(0, 0, node.width, node.height);
      ctx.drawImage(images.original, 0, 0, node.width, node.height);
      return;
    }
    drawRefinementPreview(
      ctx,
      images.processed,
      images.original,
      strokes,
      node.width,
      node.height,
    );
  }, [strokes, ready, showOriginal]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
      y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)),
    };
  }

  function down(event: PointerEvent<HTMLCanvasElement>) {
    if (!ready || busy || showOriginal) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const index = strokes.length;
    active.current = index;
    setStrokes((current) => [
      ...current,
      { mode, radius, points: [point(event)] },
    ]);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    const index = active.current;
    if (
      index === null ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    )
      return;
    const next = point(event);
    setStrokes((current) =>
      current.map((stroke, i) =>
        i === index
          ? { ...stroke, points: [...stroke.points, next].slice(-4000) }
          : stroke,
      ),
    );
  }

  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    active.current = null;
  }

  async function apply() {
    setBusy(true);
    setError("");
    try {
      const blob = await applyCutoutRefinement(processed, original, strokes);
      await onApply(blob);
    } catch (value) {
      setError(value instanceof Error ? value.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cutout-refiner" aria-busy={busy}>
      <div>
        <p className="eyebrow">{t.title}</p>
        <p className="muted">{t.help}</p>
      </div>
      <canvas
        ref={canvas}
        className="cutout-refiner-canvas"
        aria-label={t.title}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="editor-toolbar" role="group" aria-label={t.title}>
        <button type="button" aria-pressed={mode === "erase"} onClick={() => setMode("erase")} disabled={busy}>
          {t.erase}
        </button>
        <button type="button" aria-pressed={mode === "restore"} onClick={() => setMode("restore")} disabled={busy}>
          {t.restore}
        </button>
        <label>
          {t.brush}
          <input
            type="range"
            min={0.01}
            max={0.12}
            step={0.005}
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            disabled={busy}
          />
        </label>
        <button type="button" onClick={() => setStrokes((current) => current.slice(0, -1))} disabled={busy || strokes.length === 0}>
          {t.undo}
        </button>
        <button type="button" onClick={() => setStrokes([])} disabled={busy || strokes.length === 0}>
          {t.reset}
        </button>
        <button
          type="button"
          aria-pressed={showOriginal}
          onClick={() => setShowOriginal((value) => !value)}
          disabled={busy}
        >
          {showOriginal ? t.edited : t.compare}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-toolbar">
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>
          {t.cancel}
        </button>
        <button type="button" className="button" onClick={() => void apply()} disabled={busy || !ready}>
          {busy ? t.applying : t.apply}
        </button>
      </div>
    </section>
  );
}
