"use client";

import type { AiMediaAdapter } from "../ai";

type WorkerResult =
  | { id: string; ok: true; blob: Blob }
  | { id: string; ok: false; error: string };

let worker: Worker | null = null;
const pending = new Map<
  string,
  { resolve: (blob: Blob) => void; reject: (error: Error) => void }
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
  const next = new Worker("/ai/modnet-worker.js", { type: "module" });
  next.onmessage = (event: MessageEvent<WorkerResult>) => {
    const result = event.data;
    const entry = pending.get(result.id);
    if (!entry) return;
    pending.delete(result.id);
    if (result.ok) entry.resolve(result.blob);
    else entry.reject(new Error(result.error));
  };
  next.onerror = () =>
    resetWorker(new Error("On-device background removal failed to start."));
  worker = next;
  return next;
}

async function runBackgroundRemoval(source: Blob, signal: AbortSignal) {
  signal.throwIfAborted();
  const id = crypto.randomUUID();
  const active = getWorker();
  return await new Promise<Blob>((resolve, reject) => {
    const abort = () => {
      pending.delete(id);
      resetWorker(
        new DOMException("Background removal was cancelled.", "AbortError"),
      );
      reject(new DOMException("Background removal was cancelled.", "AbortError"));
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
    active.postMessage({ id, blob: source });
  });
}

export const modnetBrowserAdapter: AiMediaAdapter = {
  descriptor: {
    id: "modnet-browser-q8-v1",
    execution: "browser",
    capabilities: ["background-removal"],
    sendsCustomerMediaOffDevice: false,
  },
  removeBackground: (source, { signal }) =>
    runBackgroundRemoval(source, signal),
};
