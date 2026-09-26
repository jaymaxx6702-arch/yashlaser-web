import type { CustomizationDocument } from "./model";
const TTL = 24 * 60 * 60 * 1000;
export type Draft = {
  document: CustomizationDocument;
  /** Current working image used by the editor. */
  artwork: Blob | null;
  /**
   * First customer-supplied source for this working lineage.
   * Optional for backward compatibility with drafts saved before YL-109.
   */
  originalArtwork?: Blob | null;
  updatedAt: number;
};
const queues = new Map<string, Promise<unknown>>();
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("yash-laser-customizations", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("drafts");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(new Error("Browser draft storage is unavailable."));
    r.onblocked = () =>
      reject(new Error("Close another editor tab to enable draft storage."));
  });
}
async function operate<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("drafts", mode),
        r = fn(tx.objectStore("drafts"));
      tx.oncomplete = () => resolve(r.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function loadDraft(id: string): Promise<Draft | null> {
  await operate("readwrite", (store) => {
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (entry) {
        if (
          !Number.isFinite(entry.value.updatedAt) ||
          Date.now() - entry.value.updatedAt > TTL
        )
          entry.delete();
        entry.continue();
      }
    };
    return cursor;
  });
  const value = (await operate("readonly", (s) => s.get(id))) as
    Draft | undefined;
  if (!value) return null;
  if (Date.now() - value.updatedAt > TTL) {
    await clearDraft(id);
    return null;
  }
  return value;
}
export function saveDraft(id: string, draft: Draft) {
  const next = (queues.get(id) ?? Promise.resolve())
    .catch(() => {})
    .then(() => operate("readwrite", (s) => s.put(draft, id)));
  queues.set(id, next);
  return next;
}
export function clearDraft(id: string) {
  const next = (queues.get(id) ?? Promise.resolve())
    .catch(() => {})
    .then(() => operate("readwrite", (s) => s.delete(id)));
  queues.set(id, next);
  return next;
}
export function saveSelection(doc: CustomizationDocument) {
  localStorage.setItem(
    "yl-selection:" + doc.productId,
    JSON.stringify({
      variantId: doc.variantId,
      quantity: doc.quantity,
      updatedAt: Date.now(),
    }),
  );
}
export function saveDocument(doc: CustomizationDocument) {
  localStorage.setItem(
    "yl-design:" + doc.productId,
    JSON.stringify({ document: doc, updatedAt: Date.now() }),
  );
}
export function loadDocument(id: string): CustomizationDocument | null {
  try {
    const key = "yl-design:" + id;
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    if (!draft) return null;
    if (
      !Number.isFinite(draft.updatedAt) ||
      Date.now() - draft.updatedAt > TTL
    ) {
      localStorage.removeItem(key);
      return null;
    }
    return draft.document;
  } catch {
    return null;
  }
}
export function loadSelection(
  id: string,
): { variantId: string; quantity: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem("yl-selection:" + id) || "null");
    if (
      !v ||
      Date.now() - v.updatedAt > TTL ||
      typeof v.variantId !== "string" ||
      !Number.isInteger(v.quantity) ||
      v.quantity < 1 ||
      v.quantity > 10000
    )
      return null;
    return { variantId: v.variantId, quantity: v.quantity };
  } catch {
    return null;
  }
}
