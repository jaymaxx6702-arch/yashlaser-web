import type { Crop } from "./model";

export type ImageProcessingExecution =
  | "browser"
  | "server-api"
  | "self-hosted";

export type ImageProcessingCapability =
  | "quality-analysis"
  | "background-removal"
  | "enhancement"
  | "smart-crop";

export type ImageProcessingContext = {
  signal: AbortSignal;
  onProgress?: (progress: number) => void;
};

export type ImageQualityReport = {
  width: number;
  height: number;
  megapixels: number;
  issues: readonly (
    | "low-resolution"
    | "blur"
    | "underexposed"
    | "overexposed"
    | "low-contrast"
  )[];
  suitableForPreview: boolean;
  suitableForProduction: boolean | null;
  source: "local-heuristic" | "provider";
};

export interface ImageProcessingProvider {
  readonly id: string;
  readonly execution: ImageProcessingExecution;
  readonly capabilities: readonly ImageProcessingCapability[];
  analyzeQuality?(
    source: Blob,
    context: ImageProcessingContext,
  ): Promise<ImageQualityReport>;
  removeBackground?(
    source: Blob,
    context: ImageProcessingContext,
  ): Promise<Blob>;
  enhance?(
    source: Blob,
    context: ImageProcessingContext,
  ): Promise<Blob>;
  suggestCrop?(
    source: Blob,
    context: ImageProcessingContext,
  ): Promise<Crop>;
}

export const IMAGE_PROCESSING_POLICY = {
  keepOriginal: true,
  processingIsNonDestructive: true,
  customerOverrideRequired: true,
  previewIsNotProductionApproval: true,
  providerTimeoutMs: 90_000,
} as const;

export function providerSupports(
  provider: ImageProcessingProvider,
  capability: ImageProcessingCapability,
) {
  return provider.capabilities.includes(capability);
}
