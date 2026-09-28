"use client";

import type { CustomizationProduct } from "@/lib/customization";
import { getCustomizationDefinition } from "@/lib/customization/contract";
import type { CustomizationDocument } from "@/lib/customization/model";
import type { PhotoQualityReport } from "@/lib/customization/photo-quality";
import type { UiLanguage } from "@/lib/i18n";
import { PhotoQualityPanel } from "./PhotoQualityPanel";

const copy = {
  en: {
    title: "AI Photo Studio",
    help:
      "Upload a photo to unlock on-device AI tools. The first AI operation may download a model; your photo is not sent to an external image-processing service.",
    ready: "Photo uploaded — choose a tool below.",
    locked: "Upload a photo below to activate these tools.",
    quality: "Quality check",
    background: "Background removal",
    manual: "Manual cutout refine",
    smartCrop: "Smart crop",
    enhance: "Enhance 2×",
    restore: "Restore original",
    refine: "Refine cutout",
    enhanced: "2× enhancement applied",
  },
  gu: {
    title: "AI Photo Studio",
    help:
      "Photo upload કરો અને on-device AI tools ચાલુ કરો. પહેલી AI operation વખતે model download થઈ શકે; તમારો photo external image-processing serviceને મોકલાતો નથી.",
    ready: "Photo upload થયો — નીચે tool પસંદ કરો.",
    locked: "આ tools ચાલુ કરવા નીચે photo upload કરો.",
    quality: "Quality check",
    background: "Background removal",
    manual: "Manual cutout refine",
    smartCrop: "Smart crop",
    enhance: "2× Enhance",
    restore: "Original restore કરો",
    refine: "Cutout refine કરો",
    enhanced: "2× enhancement લાગુ છે",
  },
  hi: {
    title: "AI Photo Studio",
    help:
      "Photo upload करके on-device AI tools चालू करें. पहली AI operation पर model download हो सकता है; photo external image-processing service को नहीं भेजा जाता.",
    ready: "Photo upload हो गया — नीचे tool चुनें.",
    locked: "इन tools को चालू करने के लिए नीचे photo upload करें.",
    quality: "Quality check",
    background: "Background removal",
    manual: "Manual cutout refine",
    smartCrop: "Smart crop",
    enhance: "2× Enhance",
    restore: "Original restore करें",
    refine: "Cutout refine करें",
    enhanced: "2× enhancement applied",
  },
  mr: {
    title: "AI Photo Studio",
    help:
      "Photo upload करून on-device AI tools सुरू करा. पहिल्या AI operationवेळी model download होऊ शकतो; photo external image-processing serviceकडे पाठवला जात नाही.",
    ready: "Photo upload झाला — खाली tool निवडा.",
    locked: "ही tools सुरू करण्यासाठी खाली photo upload करा.",
    quality: "Quality check",
    background: "Background removal",
    manual: "Manual cutout refine",
    smartCrop: "Smart crop",
    enhance: "2× Enhance",
    restore: "Original restore करा",
    refine: "Cutout refine करा",
    enhanced: "2× enhancement applied",
  },
} as const;

export function PhotoToolsPanel({
  product,
  document,
  hasArtwork,
  hasOriginal,
  derived,
  enhanced,
  qualityReport,
  processing,
  onSmartCrop,
  onEnhance,
  onRestoreOriginal,
  onRefineCutout,
  lang = "en",
}: {
  product: CustomizationProduct;
  document: CustomizationDocument;
  hasArtwork: boolean;
  hasOriginal: boolean;
  derived: boolean;
  enhanced: boolean;
  qualityReport: PhotoQualityReport | null;
  processing: boolean;
  onSmartCrop: () => void;
  onEnhance: () => void;
  onRestoreOriginal: () => void;
  onRefineCutout: () => void;
  lang?: UiLanguage;
}) {
  const t = copy[lang];
  const definition = getCustomizationDefinition(product);
  const artworkRule = definition.fields.find(
    (field) => field.legacySlot === "artwork",
  );
  if (!artworkRule) return null;

  const allowSmartCrop = artworkRule.ai?.smartCrop === "optional";
  const allowEnhancement = artworkRule.ai?.enhancement === "optional";
  const allowBackgroundRemoval =
    product.categoryId === "standees" &&
    artworkRule.ai?.backgroundRemoval === "optional";
  const canRefine =
    Boolean(document.backgroundRemoval.adapter) && hasArtwork && hasOriginal;

  return (
    <section className="photo-tools-panel" aria-label={t.title}>
      <div>
        <p className="eyebrow">{t.title}</p>
        <p className="muted">{t.help}</p>
      </div>
      <div className="photo-tool-capabilities" aria-label={t.title}>
        <span>{t.quality}</span>
        {allowBackgroundRemoval && <span>{t.background}</span>}
        {allowSmartCrop && <span>{t.smartCrop}</span>}
        {allowEnhancement && <span>{t.enhance}</span>}
        {allowBackgroundRemoval && <span>{t.manual}</span>}
      </div>
      {!hasArtwork && <p className="photo-tools-lock">{t.locked}</p>}
      <PhotoQualityPanel report={qualityReport} lang={lang} />
      {hasArtwork && (
        <>
          <p className="muted">{t.ready}</p>
          <div className="editor-toolbar">
            {allowSmartCrop && (
              <button type="button" onClick={onSmartCrop} disabled={processing}>
                {t.smartCrop}
              </button>
            )}
            {allowEnhancement &&
              !document.backgroundRemoval.adapter &&
              !enhanced && (
                <button type="button" onClick={onEnhance} disabled={processing}>
                  {t.enhance}
                </button>
              )}
            {derived && hasOriginal && (
              <button
                type="button"
                onClick={onRestoreOriginal}
                disabled={processing}
              >
                {t.restore}
              </button>
            )}
            {canRefine && (
              <button
                type="button"
                onClick={onRefineCutout}
                disabled={processing}
              >
                {t.refine}
              </button>
            )}
          </div>
          {enhanced && <p className="muted">{t.enhanced}</p>}
        </>
      )}
    </section>
  );
}
