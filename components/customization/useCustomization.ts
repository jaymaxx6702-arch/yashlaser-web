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
import { customizationRuleFor } from "@/lib/customization/rules";
import {
  analyzeBitmapQuality,
  assessImageQuality,
  type ImageQualityIssueCode,
} from "@/lib/customization/quality";

const qualityCopy: Record<UiLanguage, Record<ImageQualityIssueCode, string>> = {
  en: {
    "resolution-low": "This photo is below the recommended resolution. A higher-resolution original may print better.",
    "blur-risk": "This photo may be blurred. Review enhancement or use a sharper original.",
    underexposed: "This photo appears too dark and may need correction.",
    overexposed: "This photo appears too bright and may have lost detail.",
    "contrast-low": "This photo has low contrast and may need correction.",
    "subject-missing": "No clear main subject was detected. Check the crop manually.",
    "multiple-subjects": "Multiple subjects were detected. Confirm the intended subject.",
  },
  gu: {
    "resolution-low": "આ ફોટોની resolution ભલામણ કરતાં ઓછી છે. વધુ high-resolution originalથી print વધુ સારું આવી શકે.",
    "blur-risk": "ફોટો blur હોઈ શકે છે. Enhancement ચેક કરો અથવા વધુ sharp original વાપરો.",
    underexposed: "ફોટો બહુ dark લાગે છે અને correctionની જરૂર પડી શકે.",
    overexposed: "ફોટો બહુ bright લાગે છે અને detail ખોવાઈ હોઈ શકે.",
    "contrast-low": "ફોટોમાં contrast ઓછો છે અને correctionની જરૂર પડી શકે.",
    "subject-missing": "સ્પષ્ટ main subject મળ્યો નથી. Crop manual રીતે ચેક કરો.",
    "multiple-subjects": "એકથી વધુ subjects મળ્યા છે. કયો subject વાપરવો તે કન્ફર્મ કરો.",
  },
  hi: {
    "resolution-low": "इस फोटो की resolution सुझाए गए स्तर से कम है. Higher-resolution original से print बेहतर हो सकता है.",
    "blur-risk": "फोटो blur हो सकती है. Enhancement जांचें या sharper original उपयोग करें.",
    underexposed: "फोटो बहुत dark लग रही है और correction की जरूरत हो सकती है.",
    overexposed: "फोटो बहुत bright लग रही है और detail खो सकती है.",
    "contrast-low": "फोटो में contrast कम है और correction की जरूरत हो सकती है.",
    "subject-missing": "स्पष्ट main subject नहीं मिला. Crop को manually जांचें.",
    "multiple-subjects": "एक से अधिक subjects मिले हैं. उपयोग होने वाला subject confirm करें.",
  },
  mr: {
    "resolution-low": "या फोटोची resolution शिफारसीपेक्षा कमी आहे. Higher-resolution originalमुळे print चांगला येऊ शकतो.",
    "blur-risk": "फोटो blur असू शकतो. Enhancement तपासा किंवा sharper original वापरा.",
    underexposed: "फोटो खूप dark दिसतो आणि correctionची गरज असू शकते.",
    overexposed: "फोटो खूप bright दिसतो आणि detail कमी झाली असू शकते.",
    "contrast-low": "फोटोमध्ये contrast कमी आहे आणि correctionची गरज असू शकते.",
    "subject-missing": "स्पष्ट main subject सापडला नाही. Crop manually तपासा.",
    "multiple-subjects": "एकापेक्षा जास्त subjects सापडले. कोणता subject वापरायचा ते confirm करा.",
  },
};

const statusCopy = {
  en: {
    loading: "Loading your draft…",
    mismatch: "Saved artwork did not match. Please upload it again.",
    unavailable: "Saved artwork is unavailable. Please upload it again.",
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
  },
  gu: {
    loading: "તમારો draft લોડ થઈ રહ્યો છે…",
    mismatch: "સેવ કરેલું artwork મેળ ખાતું નથી. કૃપા કરીને ફરી upload કરો.",
    unavailable: "સેવ કરેલું artwork ઉપલબ્ધ નથી. કૃપા કરીને ફરી upload કરો.",
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
  },
  hi: {
    loading: "आपका draft लोड हो रहा है…",
    mismatch: "सेव किया गया artwork मेल नहीं खाता. कृपया फिर से upload करें.",
    unavailable: "सेव किया गया artwork उपलब्ध नहीं है. कृपया फिर से upload करें.",
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
  },
  mr: {
    loading: "तुमचा draft लोड होत आहे…",
    mismatch: "सेव्ह केलेले artwork जुळत नाही. कृपया पुन्हा upload करा.",
    unavailable: "सेव्ह केलेले artwork उपलब्ध नाही. कृपया पुन्हा upload करा.",
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
  },
} as const;

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
  const [artwork, setArtwork] = useState<Blob | null>(null),
    [sourceArtwork, setSourceArtwork] = useState<Blob | null>(null),
    [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [ready, setReady] = useState(false),
    [processing, setProcessing] = useState(false),
    [storageMessage, setStorageMessage] = useState<string>(t.loading),
    [error, setError] = useState(""),
    [qualityIssues, setQualityIssues] = useState<string[]>([]);

  const current = useRef({ document, artwork, sourceArtwork });
  const activeBitmap = useRef<ImageBitmap | null>(null),
    operation = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    abort = useRef<AbortController | null>(null);
  const productRef = useRef(product);

  useEffect(() => {
    current.current = { document, artwork, sourceArtwork };
    productRef.current = product;
  }, [document, artwork, sourceArtwork, product]);

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
      operation.current++;
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
            const sourceBlob = draft.sourceArtwork ?? draft.artwork;
            if (checked.sourceArtwork) {
              const sourceInspected =
                checked.sourceArtwork.sha256 === inspected.metadata.sha256
                  ? null
                  : await inspectArtwork(sourceBlob, checked.sourceArtwork.name);
              if (
                sourceInspected &&
                sourceInspected.metadata.sha256 !== checked.sourceArtwork.sha256
              ) {
                sourceInspected.bitmap.close();
                inspected.bitmap.close();
                throw new Error(t.mismatch);
              }
              sourceInspected?.bitmap.close();
            }
            replaceBitmap(inspected.bitmap);
            setArtwork(draft.artwork);
            setSourceArtwork(sourceBlob);
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

      await saveDraft(product.id, { ...latest, updatedAt: Date.now() });
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
  }, [document, artwork, sourceArtwork, ready, flush]);

  useEffect(() => {
    if (!ready) return;
    const save = () => {
      void flush();
    };
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, [ready, flush]);

  async function upload(
    file: Blob,
    name: string,
    adapter: string | null = null,
    preserveSource = false,
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

      const localSignals = await analyzeBitmapQuality(next.bitmap).catch(() => ({}));
      const quality = assessImageQuality(
        {
          width: next.metadata.width,
          height: next.metadata.height,
          ...localSignals,
        },
        customizationRuleFor(productRef.current),
      );
      setQualityIssues(
        quality.issues.map((issue) => qualityCopy[lang][issue.code]),
      );

      const d = current.current.document;
      const nextSourceArtwork = preserveSource
        ? d.sourceArtwork
        : next.metadata;
      const nextSourceBlob = preserveSource
        ? current.current.sourceArtwork
        : file;
      if (!nextSourceArtwork || !nextSourceBlob)
        throw new Error("Original artwork is unavailable.");
      const nextDocument: CustomizationDocument = {
        ...d,
        artwork: next.metadata,
        sourceArtwork: nextSourceArtwork,
        image: {
          ...d.image,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          zoom: 1,
          panX: 0,
          panY: 0,
        },
        backgroundRemoval: { adapter },
      };

      try {
        await saveDraft(product.id, {
          document: nextDocument,
          artwork: file,
          sourceArtwork: nextSourceBlob,
          updatedAt: Date.now(),
        });
      } catch {
        setStorageMessage(t.storageUnavailable);
      }

      if (token !== operation.current) {
        next.bitmap.close();
        return;
      }

      current.current = {
        document: nextDocument,
        artwork: file,
        sourceArtwork: nextSourceBlob,
      };
      replaceBitmap(next.bitmap);
      setArtwork(file);
      setSourceArtwork(nextSourceBlob);
      setDocument(nextDocument);
    } catch (e) {
      if (token === operation.current)
        setError(e instanceof Error ? e.message : t.readImage);
    } finally {
      if (token === operation.current) setProcessing(false);
    }
  }

  function reset() {
    operation.current++;
    abort.current?.abort();
    replaceBitmap(null);
    setArtwork(null);
    setSourceArtwork(null);

    const clean = createDocument(productRef.current, {
      variantId: current.current.document.variantId,
      quantity: current.current.document.quantity,
    });

    current.current = { document: clean, artwork: null, sourceArtwork: null };
    setDocument(clean);

    void saveDraft(product.id, {
      document: clean,
      artwork: null,
      sourceArtwork: null,
      updatedAt: Date.now(),
    }).catch(() => setStorageMessage(t.clearFailed));

    setProcessing(false);
    setError("");
    setQualityIssues([]);
  }

  async function restoreOriginalArtwork() {
    const source = current.current.sourceArtwork;
    const metadata = current.current.document.sourceArtwork;
    if (!source || !metadata) return;
    await upload(source, metadata.name, null, true);
  }

  async function applyRefinedArtwork(result: Blob) {
    const processor =
      current.current.document.backgroundRemoval.adapter || "manual-cutout";
    await upload(
      result,
      "refined-cutout.png",
      ("manual-refine:" + processor).slice(0, 80),
      true,
    );
  }

  async function applyBackgroundRemoval(adapter: BackgroundRemovalAdapter) {
    if (!artwork) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setProcessing(true);
    setError("");

    try {
      const result = await removeBackground(
        adapter,
        artwork,
        controller.signal,
      );
      await upload(
        result,
        "background-removed." + (result.type === "image/png" ? "png" : "webp"),
        adapter.id,
        true,
      );
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : t.backgroundFailed);
    } finally {
      if (!controller.signal.aborted) setProcessing(false);
    }
  }

  return {
    document,
    setDocument,
    artwork,
    sourceArtwork,
    restoreOriginalArtwork,
    applyRefinedArtwork,
    bitmap,
    ready,
    processing,
    storageMessage,
    qualityIssues,
    error,
    setError,
    upload,
    reset,
    flush,
    applyBackgroundRemoval,
  };
}
