"use client";
import { useState } from "react";
import { fieldLabels, type CustomizationProduct } from "@/lib/customization";
import {
  categoryTemplates,
  clamp,
  type CustomizationDocument,
  type Crop,
} from "@/lib/customization/model";
import { templates } from "@/lib/customization/templates";
import { cropPreset } from "@/lib/customization/geometry";
import { CanvasPreview } from "./CanvasPreview";
import type { BackgroundRemovalAdapter } from "@/lib/customization/background-removal";
export function CustomizationEditor({
  document: doc,
  bitmap,
  product,
  onChange,
  onUpload,
  onReset,
  onOverflow,
  processing,
  adapter,
  onRemoveBackground,
  onDownload,
}: {
  document: CustomizationDocument;
  bitmap: ImageBitmap | null;
  product: CustomizationProduct;
  onChange: (d: CustomizationDocument) => void;
  onUpload: (file: File) => void;
  onReset: () => void;
  onOverflow: (v: boolean) => void;
  processing: boolean;
  adapter?: BackgroundRemovalAdapter;
  onRemoveBackground: () => void;
  onDownload: () => void;
}) {
  const [cropMode, setCropMode] = useState(false),
    [fileKey, setFileKey] = useState(0);
  const image = (patch: Partial<CustomizationDocument["image"]>) =>
    onChange({ ...doc, image: { ...doc.image, ...patch } });
  const crop = (next: Crop) => image({ crop: next, zoom: 1, panX: 0, panY: 0 });
  const currentVariant = product.variants.find((v) => v.id === doc.variantId);
  const price =
    currentVariant?.effectivePriceMinor ?? product.effectivePriceMinor;
  return (
    <div className="advanced-editor">
      <section className="editor-preview">
        <p className="eyebrow">
          {cropMode ? "Crop your photograph" : "Live indicative preview"}
        </p>
        <CanvasPreview
          document={doc}
          bitmap={bitmap}
          product={product}
          cropMode={cropMode}
          onChange={processing ? undefined : onChange}
          onOverflow={onOverflow}
        />
        <div className="editor-toolbar">
          <button
            type="button"
            className="button button-secondary"
            disabled={!bitmap || processing}
            onClick={() => setCropMode(!cropMode)}
          >
            {cropMode ? "Done cropping" : "Crop photo"}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={onDownload}
            disabled={processing}
          >
            Download preview
          </button>
        </div>
        <p className="muted">
          Drag your photo to reposition it. Arrow keys and the controls below
          also work. The selected size is shown; template proportions are
          indicative, not a measurement guide. Final shape, colours and text
          layout require mockup approval.
        </p>
      </section>
      <fieldset className="editor-controls" disabled={processing}>
        <legend className="sr-only">Customization controls</legend>
        <section>
          <h2>1. Product & options</h2>
          <div className="option-fields">
            {product.variants.length > 0 && (
              <label>
                Size / variant
                <select
                  value={doc.variantId}
                  onChange={(e) =>
                    onChange({ ...doc, variantId: e.target.value })
                  }
                  required
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={!v.available}>
                      {v.name}
                      {!v.available ? " — unavailable" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Quantity
              <input
                type="number"
                min={1}
                max={10000}
                step={1}
                value={doc.quantity}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  onChange({
                    ...doc,
                    quantity: Number.isInteger(n) ? clamp(n, 1, 10000) : 1,
                  });
                }}
              />
            </label>
          </div>
          <p className="muted">
            {product.pricingMode === "quote_required" || !price
              ? "Price confirmed on enquiry"
              : new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format((price * doc.quantity) / 100) +
                " product estimate · customisation and delivery confirmed separately"}
          </p>
          {categoryTemplates[product.categoryId].length > 1 && (
            <label>
              Preview template
              <select
                value={doc.templateId}
                onChange={(e) =>
                  onChange({
                    ...doc,
                    templateId: e.target
                      .value as CustomizationDocument["templateId"],
                  })
                }
              >
                {categoryTemplates[product.categoryId].map((t) => (
                  <option key={t} value={t}>
                    {templates[t].name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>
        <section>
          <h2>2. Photo / logo</h2>
          <label>
            Upload photo or logo
            <input
              key={fileKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setCropMode(false);
                  onUpload(f);
                }
                e.target.value = "";
              }}
            />
          </label>
          <p className="muted">
            JPG, PNG or WebP · up to 8 MB / 25 megapixels.{" "}
            {doc.artwork
              ? "Selected: " + doc.artwork.name
              : "No photograph selected."}
          </p>
          {adapter && (
            <button
              type="button"
              className="text-link"
              disabled={!bitmap}
              onClick={onRemoveBackground}
            >
              Remove background (
              {adapter.execution === "browser"
                ? "on this device"
                : "self-hosted"}
              )
            </button>
          )}
          {bitmap && (
            <>
              <div className="editor-toolbar">
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(false);
                    image({ zoom: 1, panX: 0, panY: 0 });
                  }}
                >
                  Reset position
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(true);
                    crop({ x: 0, y: 0, width: 1, height: 1 });
                  }}
                >
                  Full photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(true);
                    crop(cropPreset(bitmap.width, bitmap.height, 1));
                  }}
                >
                  Square crop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(true);
                    crop(cropPreset(bitmap.width, bitmap.height, 4 / 5));
                  }}
                >
                  Portrait crop
                </button>
              </div>
              {cropMode ? (
                <div className="crop-controls">
                  <p className="muted">
                    Drag the crop corners, or adjust the four edges.
                  </p>
                  {(["left", "top", "right", "bottom"] as const).map((edge) => {
                    const c = doc.image.crop,
                      value =
                        edge === "left"
                          ? c.x
                          : edge === "top"
                            ? c.y
                            : edge === "right"
                              ? c.x + c.width
                              : c.y + c.height;
                    return (
                      <label key={edge}>
                        Crop {edge}: {Math.round(value * 100)}%
                        <input
                          type="range"
                          min={
                            edge === "right"
                              ? (c.x + 0.05) * 100
                              : edge === "bottom"
                                ? (c.y + 0.05) * 100
                                : 0
                          }
                          max={
                            edge === "left"
                              ? (c.x + c.width - 0.05) * 100
                              : edge === "top"
                                ? (c.y + c.height - 0.05) * 100
                                : 100
                          }
                          step={0.1}
                          value={value * 100}
                          onChange={(e) => {
                            const n = Number(e.target.value) / 100;
                            crop(
                              edge === "left"
                                ? { ...c, x: n, width: c.x + c.width - n }
                                : edge === "top"
                                  ? { ...c, y: n, height: c.y + c.height - n }
                                  : edge === "right"
                                    ? { ...c, width: n - c.x }
                                    : { ...c, height: n - c.y },
                            );
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              ) : (
                <>
                  <label>
                    Photo fit
                    <select
                      value={doc.image.fit}
                      onChange={(e) =>
                        image({
                          fit: e.target.value as "contain" | "cover",
                          panX: 0,
                          panY: 0,
                        })
                      }
                    >
                      <option value="cover">Fill the photo area</option>
                      <option value="contain">Show the whole crop</option>
                    </select>
                  </label>
                  <label>
                    Zoom: {doc.image.zoom.toFixed(2)}×
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.01}
                      value={doc.image.zoom}
                      onChange={(e) => image({ zoom: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Horizontal position
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={doc.image.panX}
                      onChange={(e) => image({ panX: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Vertical position
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={doc.image.panY}
                      onChange={(e) => image({ panY: Number(e.target.value) })}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </section>
        <section>
          <h2>3. Personal text</h2>
          {doc.text.map((layer, i) => (
            <div className="text-layer-controls" key={i}>
              <label>
                {fieldLabels[product.categoryId][i]}
                <textarea
                  rows={2}
                  maxLength={i === 0 ? 120 : 180}
                  value={layer.text}
                  onChange={(e) =>
                    onChange({
                      ...doc,
                      text: doc.text.map((t, n) =>
                        n === i ? { ...t, text: e.target.value } : t,
                      ) as CustomizationDocument["text"],
                    })
                  }
                />
              </label>
              <div className="option-fields">
                <label>
                  Line {i + 1} font
                  <select
                    value={layer.font}
                    onChange={(e) =>
                      onChange({
                        ...doc,
                        text: doc.text.map((t, n) =>
                          n === i
                            ? { ...t, font: e.target.value as typeof t.font }
                            : t,
                        ) as CustomizationDocument["text"],
                      })
                    }
                  >
                    <option value="sans">Modern</option>
                    <option value="serif">Classic</option>
                    <option value="mono">Monospace</option>
                  </select>
                </label>
                <label>
                  Line {i + 1} alignment
                  <select
                    value={layer.align}
                    onChange={(e) =>
                      onChange({
                        ...doc,
                        text: doc.text.map((t, n) =>
                          n === i
                            ? { ...t, align: e.target.value as typeof t.align }
                            : t,
                        ) as CustomizationDocument["text"],
                      })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Centre</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>
              <label>
                Line {i + 1} font size: {layer.fontSize}
                <input
                  type="range"
                  min={14}
                  max={60}
                  step={1}
                  value={layer.fontSize}
                  onChange={(e) =>
                    onChange({
                      ...doc,
                      text: doc.text.map((t, n) =>
                        n === i
                          ? { ...t, fontSize: Number(e.target.value) }
                          : t,
                      ) as CustomizationDocument["text"],
                    })
                  }
                />
              </label>
            </div>
          ))}
          <p className="muted">
            Long text wraps and scales down to fit. Please check the downloaded
            preview.
          </p>
        </section>
        <button
          className="text-link"
          type="button"
          onClick={() => {
            setCropMode(false);
            setFileKey((k) => k + 1);
            onReset();
          }}
        >
          Reset customization (remove photo & text)
        </button>
      </fieldset>
    </div>
  );
}
