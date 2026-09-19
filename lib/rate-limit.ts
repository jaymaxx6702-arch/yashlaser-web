import "server-only";
import { createHash } from "node:crypto";
import { getSupabase } from "@/lib/supabase";

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
