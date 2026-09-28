"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import type { CustomizationProduct } from "@/lib/customization";
import type { UiLanguage } from "@/lib/i18n";
import {
  createDocument,
  validateDocument,
  type Artwork,
  type CustomizationDocument,
} from "@/lib/customization/model";
import { inspectArtwork } from "@/lib/customization/artwork";
import {
  loadDraft,
  saveDraft,
  saveSelection,
  saveDocument,
  loadDocument,
} from "@/lib/customization/persistence";
import {
  removeBackground,
  type BackgroundRemovalAdapter,
} from "@/lib/customization/background-removal";
import type { ImageEnhancementAdapter } from "@/lib/customization/browser-photo-ai";
import {
  analyzeBitmapQuality,
  type PhotoQualityReport,
} from "@/lib/customization/photo-quality";
import { smartCropForBitmap } from "@/lib/customization/smart-crop";
import { frameFor, relativeBox, templates } from "@/lib/customization/templates";

const statusCopy = {
  en: {
    loading: "Loading your draft…",
    mismatch: "Saved artwork did not match. Please upload it again.",
    unavailable: "Saved artwork is unavailable. Please upload it again.",
    originalUnavailable: "The original source photo is unavailable.",
    restored: "Draft restored on this browser.",
    saves: "Draft saves on this browser for 24 hours.",
    restoreFailed:
      "Local draft could not be restored. You can still customise and download a snapshot.",
    draftUnavailable: "Draft unavailable.",
    saved: "Draft saved on this browser for 24 hours.",
    storageFull:
      "Browser storage is unavailable or full. Download your snapshot before leaving.",
    storageUnavailable:
      "Browser storage is unavailable. Download your snapshot before leaving.",
    readImage: "Unable to read image.",
    clearFailed:
      "The saved draft could not be cleared. Clear this site’s browser data on a shared device.",
    backgroundFailed: "Background removal failed.",
    enhancementFailed: "2× enhancement failed on this device.",
    enhancementAlready: "This photo has already been enhanced in this draft.",
    enhanceAfterCutout:
      "Restore the original before enhancement. Enhancement is disabled after background removal.",
    smartCropFailed: "Smart crop could not be calculated.",
  },
  gu: {
    loading: "તમારો draft લોડ થઈ રહ્યો છે…",
    mismatch: "સેવ કરેલું artwork મેળ ખાતું નથી. કૃપા કરીને ફરી upload કરો.",
    unavailable: "સેવ કરેલું artwork ઉપલબ્ધ નથી. કૃપા કરીને ફરી upload કરો.",
    originalUnavailable: "Original source photo ઉપલબ્ધ નથી.",
    restored: "આ browserમાં draft restore થયો.",
    saves: "Draft આ browserમાં 24 કલાક માટે save થાય છે.",
    restoreFailed:
      "Local draft restore થઈ શક્યો નથી. તમે હજી પણ customise કરીને snapshot download કરી શકો છો.",
    draftUnavailable: "Draft ઉપલબ્ધ નથી.",
    saved: "Draft આ browserમાં 24 કલાક માટે save થયો.",
    storageFull:
      "Browser storage ઉપલબ્ધ નથી અથવા ભરાઈ ગયું છે. બહાર જતાં પહેલાં snapshot download કરો.",
    storageUnavailable:
      "Browser storage ઉપલબ્ધ નથી. બહાર જતાં પહેલાં snapshot download કરો.",
    readImage: "Image વાંચી શકાયું નથી.",
    clearFailed:
      "Saved draft clear થઈ શક્યો નથી. Shared device હોય તો આ siteનું browser data clear કરો.",
    backgroundFailed: "Background removal નિષ્ફળ થયું.",
    enhancementFailed: "આ device પર 2× enhancement નિષ્ફળ થયું.",
    enhancementAlready: "આ draftમાં photo પહેલેથી enhance થયેલો છે.",
    enhanceAfterCutout:
      "Enhancement પહેલાં original restore કરો. Background removal પછી enhancement બંધ છે.",
    smartCropFailed: "Smart crop ગણતરી થઈ શકી નથી.",
  },
  hi: {
    loading: "आपका draft लोड हो रहा है…",
    mismatch: "सेव किया गया artwork मेल नहीं खाता. कृपया फिर से upload करें.",
    unavailable: "सेव किया गया artwork उपलब्ध नहीं है. कृपया फिर से upload करें.",
    originalUnavailable: "Original source photo उपलब्ध नहीं है.",
    restored: "इस browser में draft restore हो गया.",
    saves: "Draft इस browser में 24 घंटे तक save रहता है.",
    restoreFailed:
      "Local draft restore नहीं हो सका. आप फिर भी customise करके snapshot download कर सकते हैं.",
    draftUnavailable: "Draft उपलब्ध नहीं है.",
    saved: "Draft इस browser में 24 घंटे के लिए save हुआ.",
    storageFull:
      "Browser storage उपलब्ध नहीं है या भर गया है. बाहर जाने से पहले snapshot download करें.",
    storageUnavailable:
      "Browser storage उपलब्ध नहीं है. बाहर जाने से पहले snapshot download करें.",
    readImage: "Image पढ़ा नहीं जा सका.",
    clearFailed:
      "Saved draft clear नहीं हो सका. Shared device पर इस site का browser data clear करें.",
    backgroundFailed: "Background removal असफल हुआ.",
    enhancementFailed: "इस device पर 2× enhancement असफल हुआ.",
    enhancementAlready: "इस draft में photo पहले ही enhance हो चुकी है.",
    enhanceAfterCutout:
      "Enhancement से पहले original restore करें. Background removal के बाद enhancement बंद है.",
    smartCropFailed: "Smart crop calculate नहीं हो सका.",
  },
  mr: {
    loading: "तुमचा draft लोड होत आहे…",
    mismatch: "सेव्ह केलेले artwork जुळत नाही. कृपया पुन्हा upload करा.",
    unavailable: "सेव्ह केलेले artwork उपलब्ध नाही. कृपया पुन्हा upload करा.",
    originalUnavailable: "Original source photo उपलब्ध नाही.",
    restored: "या browserमध्ये draft restore झाला.",
    saves: "Draft या browserमध्ये 24 तास save राहतो.",
    restoreFailed:
      "Local draft restore करता आला नाही. तरीही तुम्ही customise करून snapshot download करू शकता.",
    draftUnavailable: "Draft उपलब्ध नाही.",
    saved: "Draft या browserमध्ये 24 तासांसाठी save झाला.",
    storageFull:
      "Browser storage उपलब्ध नाही किंवा भरले आहे. बाहेर जाण्यापूर्वी snapshot download करा.",
    storageUnavailable:
      "Browser storage उपलब्ध नाही. बाहेर जाण्यापूर्वी snapshot download करा.",
    readImage: "Image वाचता आला नाही.",
    clearFailed:
      "Saved draft clear करता आला नाही. Shared device असल्यास या siteचे browser data clear करा.",
    backgroundFailed: "Background removal अयशस्वी झाले.",
    enhancementFailed: "या deviceवर 2× enhancement अयशस्वी झाले.",
    enhancementAlready: "या draftमध्ये photo आधीच enhance झाली आहे.",
    enhanceAfterCutout:
      "Enhancementपूर्वी original restore करा. Background removalनंतर enhancement बंद आहे.",
    smartCropFailed: "Smart crop calculate करता आला नाही.",
  },
} as const;

type CurrentState = {
  document: CustomizationDocument;
  artwork: Blob | null;
  sourceArtwork: Blob | null;
  sourceMetadata: Artwork | null;
  derived: boolean;
  enhanced: boolean;
};

export function useCustomization(
  product: CustomizationProduct,
  selection: { variantId: string; quantity: number },
  overrides: { variantId?: string; quantity?: number },
  lang: UiLanguage = "en",
) {
  const t = statusCopy[lang];
  const [document, setDocumentState] = useState(() =>
    createDocument(product, selection),
  );
  const [artwork, setArtwork] = useState<Blob | null>(null);
  const [sourceArtwork, setSourceArtwork] = useState<Blob | null>(null);
  const [sourceMetadata, setSourceMetadata] = useState<Artwork | null>(null);
  const [derived, setDerived] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [qualityReport, setQualityReport] =
    useState<PhotoQualityReport | null>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [storageMessage, setStorageMessage] = useState<string>(t.loading);
  const [error, setError] = useState("");

  const current = useRef<CurrentState>({
    document,
    artwork,
    sourceArtwork,
    sourceMetadata,
    derived,
    enhanced,
  });
  const activeBitmap = useRef<ImageBitmap | null>(null);
  const operation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const productRef = useRef(product);

  useEffect(() => {
    current.current = {
      document,
      artwork,
      sourceArtwork,
      sourceMetadata,
      derived,
      enhanced,
    };
    productRef.current = product;
  }, [
    document,
    artwork,
    sourceArtwork,
    sourceMetadata,
    derived,
    enhanced,
    product,
  ]);

  const initial = useRef({ selection, overrides });

  const setDocument = useCallback(
    (value: SetStateAction<CustomizationDocument>) => {
      const next =
        typeof value === "function" ? value(current.current.document) : value;
      current.current = { ...current.current, document: next };

      try {
        saveDocument(next);
        saveSelection(next);
      } catch {
        /* IndexedDB remains the fallback. */
      }

      const url = new URL(window.location.href);
      if (
        url.pathname.startsWith("/customize/") ||
        /^\/(gu|hi|mr)\/customize\//.test(url.pathname)
      ) {
        if (next.variantId) url.searchParams.set("variant", next.variantId);
        else url.searchParams.delete("variant");
        url.searchParams.set("quantity", String(next.quantity));
        if (url.href !== window.location.href)
          window.history.replaceState(null, "", url.pathname + url.search);
      }

      setDocumentState(next);
    },
    [],
  );

  const replaceBitmap = useCallback((next: ImageBitmap | null) => {
    activeBitmap.current?.close();
    activeBitmap.current = next;
    setBitmap(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const invalidate = () => {
      operation.current += 1;
      abort.current?.abort();
      activeBitmap.current?.close();
      activeBitmap.current = null;
    };

    async function restore() {
      try {
        const draft = await loadDraft(product.id);
        if (cancelled) return;

        const savedDocument = loadDocument(product.id) ?? draft?.document;
        if (savedDocument) {
          const checked = validateDocument(
            { ...savedDocument, ...initial.current.overrides },
            productRef.current,
          );

          if (checked.artwork && draft?.artwork) {
            const inspected = await inspectArtwork(
              draft.artwork,
              checked.artwork.name,
            );
            if (cancelled) {
              inspected.bitmap.close();
              return;
            }
            if (inspected.metadata.sha256 !== checked.artwork.sha256) {
              inspected.bitmap.close();
              throw new Error(t.mismatch);
            }

            const isDerived = Boolean(draft.derived);
            const sourceBlob = draft.sourceArtwork ?? draft.artwork;
            if (isDerived && !draft.sourceArtwork) {
              inspected.bitmap.close();
              throw new Error(t.originalUnavailable);
            }

            let sourceMeta = draft.sourceMetadata ?? null;
            if (!sourceMeta || !sourceBlob) {
              sourceMeta = isDerived ? null : inspected.metadata;
            }

            if (sourceBlob && sourceMeta) {
              if (sourceMeta.sha256 === inspected.metadata.sha256) {
                setQualityReport(
                  await analyzeBitmapQuality(inspected.bitmap).catch(() => null),
                );
              } else {
                const sourceInspected = await inspectArtwork(
                  sourceBlob,
                  sourceMeta.name,
                );
                if (sourceInspected.metadata.sha256 !== sourceMeta.sha256) {
                  sourceInspected.bitmap.close();
                  inspected.bitmap.close();
                  throw new Error(t.mismatch);
                }
                setQualityReport(
                  await analyzeBitmapQuality(sourceInspected.bitmap).catch(
                    () => null,
                  ),
                );
                sourceInspected.bitmap.close();
              }
            }

            replaceBitmap(inspected.bitmap);
            setArtwork(draft.artwork);
            setSourceArtwork(sourceBlob);
            setSourceMetadata(sourceMeta ?? inspected.metadata);
            setDerived(isDerived);
            setEnhanced(Boolean(draft.enhanced));
          } else if (checked.artwork) {
            throw new Error(t.unavailable);
          }

          setDocument(checked);
          setStorageMessage(t.restored);
        } else {
          setStorageMessage(t.saves);
        }
      } catch (e) {
        setStorageMessage(t.restoreFailed);
        setError(e instanceof Error ? e.message : t.draftUnavailable);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void restore();

    return () => {
      cancelled = true;
      invalidate();
    };
  }, [product.id, replaceBitmap, setDocument, t]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const latest = current.current;
    try {
      try {
        saveSelection(latest.document);
        saveDocument(latest.document);
      } catch {
        /* Artwork draft can still be saved when localStorage is disabled. */
      }

      await saveDraft(product.id, {
        document: latest.document,
        artwork: latest.artwork,
        sourceArtwork: latest.sourceArtwork,
        sourceMetadata: latest.sourceMetadata,
        derived: latest.derived,
        enhanced: latest.enhanced,
        updatedAt: Date.now(),
      });
      setStorageMessage(t.saved);
      return true;
    } catch {
      setStorageMessage(t.storageFull);
      return false;
    }
  }, [product.id, t]);

  useEffect(() => {
    if (!ready) return;
    timer.current = setTimeout(() => {
      void flush();
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [
    document,
    artwork,
    sourceArtwork,
    sourceMetadata,
    derived,
    enhanced,
    ready,
    flush,
  ]);

  useEffect(() => {
    if (!ready) return;
    const save = () => {
      void flush();
    };
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, [ready, flush]);

  async function replaceArtwork(
    file: Blob,
    name: string,
    options: {
      adapter?: string | null;
      preserveSource?: boolean;
      enhanced?: boolean;
    } = {},
  ) {
    const token = ++operation.current;
    setProcessing(true);
    setError("");

    try {
      const next = await inspectArtwork(file, name);
      if (token !== operation.current) {
        next.bitmap.close();
        return;
      }

      const preserveSource = Boolean(options.preserveSource);
      const sourceBlob = preserveSource
        ? current.current.sourceArtwork
        : file;
      const sourceMeta = preserveSource
        ? current.current.sourceMetadata
        : next.metadata;
      if (!sourceBlob || !sourceMeta) {
        next.bitmap.close();
        throw new Error(t.originalUnavailable);
      }

      const nextDocument: CustomizationDocument = {
        ...current.current.document,
        artwork: next.metadata,
        image: {
          ...current.current.document.image,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          zoom: 1,
          panX: 0,
          panY: 0,
        },
        backgroundRemoval: {
          adapter:
            options.adapter === undefined
              ? current.current.document.backgroundRemoval.adapter
              : options.adapter,
        },
      };

      if (!preserveSource)
        setQualityReport(
          await analyzeBitmapQuality(next.bitmap).catch(() => null),
        );

      const nextState: CurrentState = {
        document: nextDocument,
        artwork: file,
        sourceArtwork: sourceBlob,
        sourceMetadata: sourceMeta,
        derived: preserveSource,
        enhanced: Boolean(options.enhanced),
      };

      try {
        await saveDraft(product.id, {
          ...nextState,
          updatedAt: Date.now(),
        });
      } catch {
        setStorageMessage(t.storageUnavailable);
      }

      if (token !== operation.current) {
        next.bitmap.close();
        return;
      }

      current.current = nextState;
      replaceBitmap(next.bitmap);
      setArtwork(file);
      setSourceArtwork(sourceBlob);
      setSourceMetadata(sourceMeta);
      setDerived(preserveSource);
      setEnhanced(Boolean(options.enhanced));
      setDocument(nextDocument);
    } catch (e) {
      if (token === operation.current)
        setError(e instanceof Error ? e.message : t.readImage);
    } finally {
      if (token === operation.current) setProcessing(false);
    }
  }

  async function upload(file: Blob, name: string) {
    await replaceArtwork(file, name, {
      adapter: null,
      preserveSource: false,
      enhanced: false,
    });
  }

  function reset() {
    operation.current += 1;
    abort.current?.abort();
    replaceBitmap(null);
    setArtwork(null);
    setSourceArtwork(null);
    setSourceMetadata(null);
    setDerived(false);
    setEnhanced(false);
    setQualityReport(null);

    const clean = createDocument(productRef.current, {
      variantId: current.current.document.variantId,
      quantity: current.current.document.quantity,
    });

    current.current = {
      document: clean,
      artwork: null,
      sourceArtwork: null,
      sourceMetadata: null,
      derived: false,
      enhanced: false,
    };
    setDocument(clean);

    void saveDraft(product.id, {
      document: clean,
      artwork: null,
      sourceArtwork: null,
      sourceMetadata: null,
      derived: false,
      enhanced: false,
      updatedAt: Date.now(),
    }).catch(() => setStorageMessage(t.clearFailed));

    setProcessing(false);
    setError("");
  }

  async function restoreOriginalArtwork() {
    const source = current.current.sourceArtwork;
    const metadata = current.current.sourceMetadata;
    if (!source || !metadata) {
      setError(t.originalUnavailable);
      return;
    }
    await replaceArtwork(source, metadata.name, {
      adapter: null,
      preserveSource: false,
      enhanced: false,
    });
  }

  async function applyRefinedArtwork(result: Blob) {
    await replaceArtwork(result, "refined-cutout.png", {
      adapter:
        current.current.document.backgroundRemoval.adapter || "manual-cutout",
      preserveSource: true,
      enhanced: current.current.enhanced,
    });
  }

  async function applyBackgroundRemoval(adapter: BackgroundRemovalAdapter) {
    if (!current.current.artwork) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setProcessing(true);
    setError("");

    try {
      const result = await removeBackground(
        adapter,
        current.current.artwork,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setProcessing(false);
      await replaceArtwork(
        result,
        "background-removed." +
          (result.type === "image/png" ? "png" : "webp"),
        {
          adapter: adapter.id,
          preserveSource: true,
          enhanced: current.current.enhanced,
        },
      );
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : t.backgroundFailed);
      setProcessing(false);
    }
  }

  async function applyEnhancement(adapter: ImageEnhancementAdapter) {
    const source = current.current.artwork;
    if (!source) return;
    if (current.current.enhanced) {
      setError(t.enhancementAlready);
      return;
    }
    if (current.current.document.backgroundRemoval.adapter) {
      setError(t.enhanceAfterCutout);
      return;
    }
    if (
      current.current.document.artwork &&
      current.current.document.artwork.width *
        current.current.document.artwork.height >
        4_000_000
    ) {
      setError(
        "2× enhancement is limited to source images up to 4 megapixels on this device.",
      );
      return;
    }

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setProcessing(true);
    setError("");
    try {
      const result = await adapter.enhance(source, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setProcessing(false);
      await replaceArtwork(result, "enhanced-x2.png", {
        adapter: null,
        preserveSource: true,
        enhanced: true,
      });
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : t.enhancementFailed);
      setProcessing(false);
    }
  }

  async function applySmartCrop() {
    const active = activeBitmap.current;
    if (!active) return;
    setProcessing(true);
    setError("");
    try {
      const template = templates[current.current.document.templateId];
      const frame = frameFor(template);
      const photo = relativeBox(frame, template.photo);
      const result = await smartCropForBitmap(
        active,
        photo.width / photo.height,
      );
      setDocument({
        ...current.current.document,
        image: {
          ...current.current.document.image,
          crop: result.crop,
          zoom: 1,
          panX: 0,
          panY: 0,
        },
      });
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.smartCropFailed);
    } finally {
      setProcessing(false);
    }
  }

  return {
    document,
    setDocument,
    artwork,
    sourceArtwork,
    sourceMetadata,
    derived,
    enhanced,
    bitmap,
    qualityReport,
    ready,
    processing,
    storageMessage,
    error,
    setError,
    upload,
    reset,
    flush,
    restoreOriginalArtwork,
    applyRefinedArtwork,
    applyBackgroundRemoval,
    applyEnhancement,
    applySmartCrop,
  };
}
