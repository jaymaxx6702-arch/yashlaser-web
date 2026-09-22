export type AiCapability =
  | "quality-analysis"
  | "background-removal"
  | "cutout-refinement"
  | "enhancement"
  | "smart-crop"
  | "layout-suggestion";

export type AiExecution = "browser" | "server";

export type AiProviderDescriptor = {
  id: string;
  execution: AiExecution;
  capabilities: readonly AiCapability[];
  sendsCustomerMediaOffDevice: boolean;
};

export type AiProcessingPolicy = {
  timeoutMs: number;
  maxAttempts: number;
  retainProcessedMs: number;
  allowRemoteMediaProcessing: boolean;
};

export const defaultAiProcessingPolicy: AiProcessingPolicy = {
  timeoutMs: 45_000,
  maxAttempts: 2,
  retainProcessedMs: 24 * 60 * 60 * 1000,
  allowRemoteMediaProcessing: false,
};

export interface AiMediaAdapter {
  descriptor: AiProviderDescriptor;
  analyzeQuality?(
    input: Blob,
    options: { signal: AbortSignal },
  ): Promise<{
    width?: number;
    height?: number;
    blurScore?: number;
    exposure?: "low" | "ok" | "high";
    warnings: string[];
  }>;
  removeBackground?(
    input: Blob,
    options: { signal: AbortSignal },
  ): Promise<Blob>;
  enhance?(
    input: Blob,
    options: { signal: AbortSignal },
  ): Promise<Blob>;
}

export function providerSupports(
  provider: AiProviderDescriptor,
  capability: AiCapability,
) {
  return provider.capabilities.includes(capability);
}

export function assertAiProviderAllowed(
  provider: AiProviderDescriptor,
  policy: AiProcessingPolicy,
) {
  if (
    provider.sendsCustomerMediaOffDevice &&
    !policy.allowRemoteMediaProcessing
  )
    throw new Error(
      "Remote customer-media processing is disabled by the current privacy policy.",
    );
}
