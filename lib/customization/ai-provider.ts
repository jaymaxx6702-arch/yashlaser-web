export type AiImageCapability =
  | "quality-analysis"
  | "background-removal"
  | "enhancement"
  | "smart-crop";

export type AiExecution = "browser" | "server";
export type AiHosting = "first-party" | "third-party";

export type AiRetentionPolicy =
  | { mode: "none" }
  | { mode: "ephemeral"; maxHours: number }
  | { mode: "provider-managed"; maxHours?: number };

export type AiProviderPolicy = {
  id: string;
  model: string;
  execution: AiExecution;
  hosting: AiHosting;
  capabilities: readonly AiImageCapability[];
  consentRequired: boolean;
  retention: AiRetentionPolicy;
  maxInputBytes: number;
  timeoutMs: number;
  retries: number;
  estimatedCostMinor?: number;
};

const capabilities: readonly AiImageCapability[] = [
  "quality-analysis",
  "background-removal",
  "enhancement",
  "smart-crop",
];

function nonEmpty(value: unknown, field: string, max = 120) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max
  )
    throw new Error(`Invalid AI provider ${field}.`);
  return value;
}

function integer(value: unknown, min: number, max: number, field: string) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new Error(`Invalid AI provider ${field}.`);
  return value;
}

export function validateAiProviderPolicy(input: unknown): AiProviderPolicy {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid AI provider policy.");
  const policy = input as Record<string, unknown>;

  if (policy.execution !== "browser" && policy.execution !== "server")
    throw new Error("Invalid AI provider execution mode.");
  if (policy.hosting !== "first-party" && policy.hosting !== "third-party")
    throw new Error("Invalid AI provider hosting mode.");
  if (typeof policy.consentRequired !== "boolean")
    throw new Error("Invalid AI provider consent policy.");

  if (
    !Array.isArray(policy.capabilities) ||
    policy.capabilities.length < 1 ||
    policy.capabilities.some(
      (capability) =>
        typeof capability !== "string" ||
        !(capabilities as readonly string[]).includes(capability),
    )
  )
    throw new Error("Invalid AI provider capabilities.");
  const uniqueCapabilities = [...new Set(policy.capabilities)] as AiImageCapability[];
  if (uniqueCapabilities.length !== policy.capabilities.length)
    throw new Error("AI provider capabilities must be unique.");

  if (
    !policy.retention ||
    typeof policy.retention !== "object" ||
    Array.isArray(policy.retention)
  )
    throw new Error("Invalid AI provider retention policy.");
  const retention = policy.retention as Record<string, unknown>;
  let normalizedRetention: AiRetentionPolicy;
  if (retention.mode === "none") {
    normalizedRetention = { mode: "none" };
  } else if (retention.mode === "ephemeral") {
    normalizedRetention = {
      mode: "ephemeral",
      maxHours: integer(retention.maxHours, 1, 24 * 30, "retention hours"),
    };
  } else if (retention.mode === "provider-managed") {
    normalizedRetention = {
      mode: "provider-managed",
      ...(retention.maxHours === undefined
        ? {}
        : {
            maxHours: integer(
              retention.maxHours,
              1,
              24 * 365,
              "retention hours",
            ),
          }),
    };
  } else {
    throw new Error("Invalid AI provider retention mode.");
  }

  const estimatedCostMinor =
    policy.estimatedCostMinor === undefined
      ? undefined
      : integer(policy.estimatedCostMinor, 0, 100000, "estimated cost");

  return {
    id: nonEmpty(policy.id, "id", 80),
    model: nonEmpty(policy.model, "model", 120),
    execution: policy.execution,
    hosting: policy.hosting,
    capabilities: uniqueCapabilities,
    consentRequired: policy.consentRequired,
    retention: normalizedRetention,
    maxInputBytes: integer(
      policy.maxInputBytes,
      1,
      50 * 1024 * 1024,
      "max input bytes",
    ),
    timeoutMs: integer(policy.timeoutMs, 1000, 120000, "timeout"),
    retries: integer(policy.retries, 0, 3, "retry count"),
    ...(estimatedCostMinor === undefined ? {} : { estimatedCostMinor }),
  };
}

export function supportsAiCapability(
  policy: AiProviderPolicy,
  capability: AiImageCapability,
) {
  return policy.capabilities.includes(capability);
}

export function assertAiOperationAllowed(
  policy: AiProviderPolicy,
  capability: AiImageCapability,
  input: { bytes: number; consent: boolean },
) {
  if (!supportsAiCapability(policy, capability))
    throw new Error(`AI capability is not supported: ${capability}`);
  if (
    !Number.isFinite(input.bytes) ||
    input.bytes <= 0 ||
    input.bytes > policy.maxInputBytes
  )
    throw new Error("AI input exceeds provider limits.");
  if (policy.consentRequired && !input.consent)
    throw new Error("AI processing consent is required.");
}

export async function runAiOperation<T>(
  policy: AiProviderPolicy,
  operation: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= policy.retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), policy.timeoutMs);
    const abort = () => controller.abort();

    if (signal?.aborted) controller.abort();
    signal?.addEventListener("abort", abort, { once: true });

    try {
      return await operation(controller.signal);
    } catch (error) {
      lastError = error;
      if (
        controller.signal.aborted ||
        signal?.aborted ||
        attempt >= policy.retries
      )
        throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("AI operation failed.");
}
