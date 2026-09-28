"use client";

import type { CustomizationProduct } from "@/lib/customization";
import { getCustomizationDefinition } from "@/lib/customization/contract";
import type { CustomizationDocument } from "@/lib/customization/model";
import type { PhotoQualityReport } from "@/lib/customization/photo-quality";
import type { UiLanguage } from "@/lib/i18n";
import { PhotoQualityPanel } from "./PhotoQualityPanel";

const copy = {
  en: {
    title: "Photo tools",
    help:
      "These tools run on this device. The first AI operation may download a model. Your photo is not sent to an external image-processing service.",
    smartCrop: "Smart crop",
    enhance: "Enhance 2×",
    restore: "Restore original",
    refine: "Refine cutout",
    enhanced: "2× enhancement applied",
  },
  gu: {
    title: "Photo tools",
    help:
      "આ tools આ device પર ચાલે છે. પહેલી AI operation વખતે model download થઈ શકે. તમારો photo external image-processing serviceને મોકલાતો નથી.",
    smartCrop: "Smart crop",
    enhance: "2× Enhance",
    restore: "Original restore કરો",
    refine: "Cutout refine કરો",
    enhanced: "2× enhancement લાગુ છે",
  },
  hi: {
    title: "Photo tools",
    help:
      "ये tools इसी device पर चलते हैं. पहली AI operation पर model download हो सकता है. Photo external image-processing service को नहीं भेजा जाता.",
    smartCrop: "Smart crop",
    enhance: "2× Enhance",
    restore: "Original restore करें",
    refine: "Cutout refine करें",
    enhanced: "2× enhancement applied",
  },
  mr: {
    title: "Photo tools",
    help:
      "ही tools या deviceवर चालतात. पहिल्या AI operationवेळी model download होऊ शकतो. Photo external image-processing serviceकडे पाठवला जात नाही.",
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
  const canRefine =
    Boolean(document.backgroundRemoval.adapter) && hasArtwork && hasOriginal;

  return (
    <section className="photo-tools-panel">
      <PhotoQualityPanel report={qualityReport} lang={lang} />
      {hasArtwork && (
        <>
          <div>
            <strong>{t.title}</strong>
            <p className="muted">{t.help}</p>
          </div>
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
