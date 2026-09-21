import "server-only";
import { createHash } from "node:crypto";
import { getSupabase } from "@/lib/supabase";

function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 120);

  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (forwarded) return forwarded.slice(0, 120);

  return "unknown";
}

export function requestRateLimitKey(request: Request) {
  return clientIp(request);
}

export async function consumeShopRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  if (process.env.RATE_LIMITS_ENABLED !== "true") return true;

  const keyHash = createHash("sha256")
    .update(key)
    .digest("hex");

  const db = getSupabase();
  const { data, error } = await db.rpc("consume_shop_rate_limit", {
    p_scope: scope,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("rate_limit_error", scope, error.message);
    return false;
  }

  return data === true;
}

export async function consumeRequestRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  return consumeShopRateLimit(
    scope,
    requestRateLimitKey(request),
    limit,
    windowSeconds,
  );
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}
