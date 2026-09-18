"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import type { CustomizationProduct } from "@/lib/customization";
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
export function useCustomization(
  product: CustomizationProduct,
  selection: { variantId: string; quantity: number },
  overrides: { variantId?: string; quantity?: number },
) {
  const [document, setDocumentState] = useState(() =>
    createDocument(product, selection),
  );
  const [artwork, setArtwork] = useState<Blob | null>(null),
    [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [ready, setReady] = useState(false),
    [processing, setProcessing] = useState(false),
    [storageMessage, setStorageMessage] = useState("Loading your draft…"),
    [error, setError] = useState("");
  const current = useRef({ document, artwork });
  const activeBitmap = useRef<ImageBitmap | null>(null),
    operation = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    abort = useRef<AbortController | null>(null);
  const productRef = useRef(product);
  useEffect(() => {
    current.current = { document, artwork };
    productRef.current = product;
  }, [document, artwork, product]);
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
      if (url.pathname.startsWith("/customize/")) {
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
              throw new Error(
                "Saved artwork did not match. Please upload it again.",
              );
            }
            replaceBitmap(inspected.bitmap);
            setArtwork(draft.artwork);
          } else if (checked.artwork)
            throw new Error(
              "Saved artwork is unavailable. Please upload it again.",
            );
          setDocument(checked);
          setStorageMessage("Draft restored on this browser.");
        } else setStorageMessage("Draft saves on this browser for 24 hours.");
      } catch (e) {
        setStorageMessage(
          "Local draft could not be restored. You can still customise and download a snapshot.",
        );
        setError(e instanceof Error ? e.message : "Draft unavailable.");
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
      invalidate();
    };
  }, [product.id, replaceBitmap, setDocument]);
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
      setStorageMessage("Draft saved on this browser for 24 hours.");
      return true;
    } catch {
      setStorageMessage(
        "Browser storage is unavailable or full. Download your snapshot before leaving.",
      );
      return false;
    }
  }, [product.id]);
  useEffect(() => {
    if (!ready) return;
    timer.current = setTimeout(() => {
      void flush();
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [document, artwork, ready, flush]);
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
      const d = current.current.document;
      const nextDocument: CustomizationDocument = {
        ...d,
        artwork: next.metadata,
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
          updatedAt: Date.now(),
        });
      } catch {
        setStorageMessage(
          "Browser storage is unavailable. Download your snapshot before leaving.",
        );
      }
      if (token !== operation.current) {
        next.bitmap.close();
        return;
      }
      current.current = { document: nextDocument, artwork: file };
      replaceBitmap(next.bitmap);
      setArtwork(file);
      setDocument(nextDocument);
    } catch (e) {
      if (token === operation.current)
        setError(e instanceof Error ? e.message : "Unable to read image.");
    } finally {
      if (token === operation.current) setProcessing(false);
    }
  }
  function reset() {
    operation.current++;
    abort.current?.abort();
    replaceBitmap(null);
    setArtwork(null);
    const clean = createDocument(productRef.current, {
      variantId: current.current.document.variantId,
      quantity: current.current.document.quantity,
    });
    current.current = { document: clean, artwork: null };
    setDocument(clean);
    void saveDraft(product.id, {
      document: clean,
      artwork: null,
      updatedAt: Date.now(),
    }).catch(() =>
      setStorageMessage(
        "The saved draft could not be cleared. Clear this site’s browser data on a shared device.",
      ),
    );
    setProcessing(false);
    setError("");
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
      );
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Background removal failed.");
    } finally {
      if (!controller.signal.aborted) setProcessing(false);
    }
  }
  return {
    document,
    setDocument,
    artwork,
    bitmap,
    ready,
    processing,
    storageMessage,
    error,
    setError,
    upload,
    reset,
    flush,
    applyBackgroundRemoval,
  };
}
