"use client";

import type { BackgroundRemovalAdapter } from "./background-removal";

export interface ImageEnhancementAdapter {
  readonly id: string;
  readonly execution: "browser";
  enhance(
    source: Blob,
    options: { signal: AbortSignal; onProgress?: (progress: number) => void },
  ): Promise<Blob>;
}

type WorkerOperation = "background-remove" | "enhance-x2";
type WorkerResult =
  | { id: string; ok: true; blob: Blob }
  | { id: string; ok: false; error: string };

let worker: Worker | null = null;
const pending = new Map<
  string,
  {
    resolve: (blob: Blob) => void;
    reject: (error: Error) => void;
  }
>();

function resetWorker(error?: Error) {
  worker?.terminate();
  worker = null;
  if (error) {
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  }
}

function getWorker() {
  if (worker) return worker;
  const next = new Worker("/ai/photo-worker.js", { type: "module" });
  next.onmessage = (event: MessageEvent<WorkerResult>) => {
    const result = event.data;
    const entry = pending.get(result.id);
    if (!entry) return;
    pending.delete(result.id);
    if (result.ok) entry.resolve(result.blob);
    else entry.reject(new Error(result.error));
  };
  next.onerror = () =>
    resetWorker(new Error("On-device photo processing failed to start."));
  worker = next;
  return next;
}

async function run(
  operation: WorkerOperation,
  source: Blob,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  const id = crypto.randomUUID();
  const active = getWorker();
  return await new Promise<Blob>((resolve, reject) => {
    const abort = () => {
      pending.delete(id);
      reject(new DOMException("Photo processing was cancelled.", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    pending.set(id, {
      resolve: (blob) => {
        signal.removeEventListener("abort", abort);
        resolve(blob);
      },
      reject: (error) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    });
    active.postMessage({ id, operation, blob: source });
  });
}

export const modnetBrowserAdapter: BackgroundRemovalAdapter = {
  id: "modnet-browser-q8-v1",
  execution: "browser",
  removeBackground: (source, { signal }) =>
    run("background-remove", source, signal),
};

export const swin2srBrowserAdapter: ImageEnhancementAdapter = {
  id: "swin2sr-browser-x2-q8-v1",
  execution: "browser",
  enhance: (source, { signal }) => run("enhance-x2", source, signal),
};
