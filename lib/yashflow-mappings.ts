import "server-only";

import { safeIntegrationError } from "@/lib/integration-errors";

export type YashFlowTargetProduct = {
  id: string;
  name: string;
  isActive: boolean;
  workflowStageCount: number;
  workflowReady: boolean;
};

export type YashFlowProductMapping = {
  id: string;
  shopProductId: string;
  yashflowProductId: string;
  yashflowProductName: string;
  isActive: boolean;
  workflowStageCount: number;
  workflowReady: boolean;
  createdAt: string;
  updatedAt: string;
};

export type YashFlowMappingSnapshot = {
  ok: true;
  products: YashFlowTargetProduct[];
  mappings: YashFlowProductMapping[];
};

function config() {
  const url = (process.env.YASHFLOW_API_URL || "").replace(/\/$/, "");
  const secret = process.env.YASHFLOW_API_SECRET || "";
  if (!url || !secret) throw new Error("YashFlow integration is not configured.");
  return { url, secret };
}

async function requestYashFlow<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {},
) {
  const { url, secret } = config();
  let response: Response;

  try {
    response = await fetch(url + path, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  } catch (error) {
    throw new Error(safeIntegrationError(error));
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(
      `YashFlow mapping API returned non-JSON (${response.status}).`,
    );
  }

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(
      `YashFlow mapping API returned invalid JSON (${response.status}).`,
    );
  }

  if (!response.ok) {
    throw new Error(
      safeIntegrationError(
        typeof result.error === "string"
          ? result.error
          : `YashFlow mapping request failed (${response.status}).`,
      ),
    );
  }

  return result as T;
}

export async function getYashFlowMappings(): Promise<YashFlowMappingSnapshot> {
  const result = await requestYashFlow<YashFlowMappingSnapshot>(
    "/api/integrations/shop/mappings",
    { method: "GET" },
  );

  if (!Array.isArray(result.products) || !Array.isArray(result.mappings)) {
    throw new Error("YashFlow mapping response is incomplete.");
  }

  return result;
}

export async function updateYashFlowMapping(input: {
  shopProductId: string;
  yashflowProductId: string;
  isActive: boolean;
}) {
  const result = await requestYashFlow<{
    ok: true;
    mapping: YashFlowProductMapping;
  }>("/api/integrations/shop/mappings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!result.mapping?.shopProductId) {
    throw new Error("YashFlow mapping update response is incomplete.");
  }

  return result.mapping;
}
