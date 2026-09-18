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
