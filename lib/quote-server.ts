import "server-only";
import { getSupabase } from "@/lib/supabase";
import { tokenHash } from "@/lib/commerce-server";

export async function getQuoteByToken(token: string) {
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_quotes")
    .select(
      "id,quote_no,status,items,total_minor,valid_until,notes,created_at",
    )
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();

  return error ? null : data;
}
