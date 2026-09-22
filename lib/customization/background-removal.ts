import type { AiMediaAdapter } from "./ai";
import { runAiImageOperation } from "./ai-runner";
export interface BackgroundRemovalAdapter {
  readonly id: string;
  readonly execution: "browser" | "self-hosted";
  removeBackground(
    source: Blob,
    options: { signal: AbortSignal; onProgress?: (progress: number) => void },
  ): Promise<Blob>;
}
// No provider is installed, called or downloaded by default. Inject an adapter in
// CustomizationForm after selecting a suitable local model and checking its licence.
export async function removeBackground(
  adapter: BackgroundRemovalAdapter,
  source: Blob,
  signal: AbortSignal,
): Promise<Blob> {
  signal.throwIfAborted();
  const result = await adapter.removeBackground(source, { signal });
  signal.throwIfAborted();
  if (!["image/png", "image/webp"].includes(result.type))
    throw new Error("Background removal must return a PNG or WebP image.");
  return result;
}


export function backgroundRemovalAdapterFromAi(
  adapter: AiMediaAdapter,
): BackgroundRemovalAdapter | null {
  if (!adapter.removeBackground) return null;
  return {
    id: adapter.descriptor.id,
    execution:
      adapter.descriptor.execution === "browser" ? "browser" : "self-hosted",
    removeBackground: async (source, options) =>
      (
        await runAiImageOperation(
          adapter,
          "background-removal",
          source,
          {
            signal: options.signal,
            policy: {
              timeoutMs: 120_000,
              maxAttempts: 1,
              retainProcessedMs: 24 * 60 * 60 * 1000,
              allowRemoteMediaProcessing: false,
            },
          },
        )
      ).output,
  };
}
