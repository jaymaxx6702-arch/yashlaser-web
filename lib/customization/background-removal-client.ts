"use client";
import type { BackgroundRemovalAdapter } from "./background-removal";

export const sameOriginBackgroundRemovalAdapter: BackgroundRemovalAdapter = {
  id: "shop-background-removal-v1",
  execution: "server-api",
  async removeBackground(source, { signal, onProgress }) {
    onProgress?.(0);
    const response = await fetch("/api/image-tools/background-remove", {
      method: "POST",
      headers: { "Content-Type": source.type || "application/octet-stream" },
      body: source,
      signal,
      cache: "no-store",
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Background removal is unavailable." }));
      throw new Error(error.error || "Background removal is unavailable.");
    }
    const result = await response.blob();
    onProgress?.(1);
    return result;
  },
};
