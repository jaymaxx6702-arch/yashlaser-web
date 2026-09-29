export type YashFlowSyncPayload = {
  schemaVersion: number;
  shopOrderId: string;
  orderNo: string;
  customer: { name: string; mobile: string | null };
  items: Array<{
    shopOrderItemId: string;
    shopProductId: string;
    productName: string;
    quantity: number;
    configuration: Record<string, unknown>;
  }>;
};

type FetchLike = typeof fetch;

function timeoutError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === "TimeoutError" || error.name === "AbortError";
}

export function validateYashFlowSyncResponse(
  result: Record<string, unknown>,
  expectedItemIds: string[],
) {
  const remoteErrors = Array.isArray(result.errors)
    ? result.errors
        .map((value) =>
          typeof value === "string"
            ? value
            : value && typeof value === "object" && "error" in value
              ? String((value as { error?: unknown }).error || "")
              : "",
        )
        .filter(Boolean)
    : [];

  if (remoteErrors.length) {
    throw new Error(
      "YashFlow reported a partial sync failure: " +
        remoteErrors.slice(0, 5).join("; "),
    );
  }

  const refs = Array.isArray(result.orders) ? result.orders : [];
  const actualIds = refs
    .map((value) =>
      value && typeof value === "object" && "shopOrderItemId" in value
        ? String((value as { shopOrderItemId?: unknown }).shopOrderItemId || "")
        : "",
    )
    .filter(Boolean);

  const expected = new Set(expectedItemIds);
  const actual = new Set(actualIds);
  const missing = expectedItemIds.filter((id) => !actual.has(id));
  const unexpected = actualIds.filter((id) => !expected.has(id));

  if (
    refs.length !== expectedItemIds.length ||
    actualIds.length !== refs.length ||
    actual.size !== actualIds.length ||
    missing.length ||
    unexpected.length
  ) {
    throw new Error(
      "YashFlow reported a partial sync failure: response did not contain exactly one order reference for every Shop order item.",
    );
  }

  return refs;
}

export async function postYashFlowOrder({
  url,
  secret,
  orderId,
  payload,
  timeoutMs = 25000,
  fetchImpl = fetch,
}: {
  url: string;
  secret: string;
  orderId: string;
  payload: YashFlowSyncPayload;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}) {
  let response: Response;
  try {
    response = await fetchImpl(`${url.replace(/\/$/, "")}/api/integrations/shop/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
        "idempotency-key": "shop-order:" + orderId,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (timeoutError(error))
      throw new Error(`YashFlow request timed out after ${timeoutMs}ms.`);
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  let result: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    try {
      result = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`YashFlow returned invalid JSON (${response.status}).`);
    }
  } else {
    const preview = raw.replace(/\s+/g, " ").slice(0, 180);
    throw new Error(
      `YashFlow API returned non-JSON (${response.status}, ${contentType || "unknown content-type"}) from ${url}. ${preview}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : `YashFlow sync failed (${response.status}).`,
    );
  }

  validateYashFlowSyncResponse(
    result,
    payload.items.map((item) => item.shopOrderItemId),
  );

  return result;
}
