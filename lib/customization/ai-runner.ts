import {
  assertAiProviderAllowed,
  defaultAiProcessingPolicy,
  providerSupports,
  type AiCapability,
  type AiMediaAdapter,
  type AiProcessingPolicy,
} from "./ai";

export type AiImageOperation = Extract<
  AiCapability,
  "background-removal" | "enhancement"
>;

function operation(
  adapter: AiMediaAdapter,
  capability: AiImageOperation,
) {
  if (capability === "background-removal") return adapter.removeBackground;
  return adapter.enhance;
}

function transparentCapable(type: string) {
  return type === "image/png" || type === "image/webp";
}

export async function runAiImageOperation(
  adapter: AiMediaAdapter,
  capability: AiImageOperation,
  source: Blob,
  options?: {
    signal?: AbortSignal;
    policy?: AiProcessingPolicy;
  },
) {
  const policy = options?.policy ?? defaultAiProcessingPolicy;
  assertAiProviderAllowed(adapter.descriptor, policy);
  if (!providerSupports(adapter.descriptor, capability))
    throw new Error(`AI provider does not support ${capability}.`);

  const fn = operation(adapter, capability);
  if (!fn) throw new Error(`AI provider is missing ${capability} implementation.`);

  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    options?.signal?.throwIfAborted();
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(options?.signal?.reason);
    options?.signal?.addEventListener("abort", abortFromCaller, { once: true });
    const timer = setTimeout(
      () => controller.abort(new DOMException("AI processing timed out.", "TimeoutError")),
      policy.timeoutMs,
    );

    try {
      const output = await fn.call(adapter, source, {
        signal: controller.signal,
      });
      if (!output.size) throw new Error("AI processing returned an empty image.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(output.type))
        throw new Error("AI processing returned an unsupported image type.");
      if (capability === "background-removal" && !transparentCapable(output.type))
        throw new Error("Background removal must return PNG or WebP.");
      return {
        output,
        providerId: adapter.descriptor.id,
        capability,
        attempt,
      };
    } catch (error) {
      lastError = error;
      if (options?.signal?.aborted) throw error;
      if (attempt === policy.maxAttempts) throw error;
    } finally {
      clearTimeout(timer);
      options?.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("AI processing failed.");
}
