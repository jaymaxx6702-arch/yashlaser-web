import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export const CUSTOMER_COOKIE = "yl-customer-session";

export const customerAccountsEnabled = () =>
  process.env.CUSTOMER_ACCOUNTS_ENABLED === "true";

export function publicAuthClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key)
    throw new Error("Customer authentication is not configured.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function customerUser(): Promise<User | null> {
  if (!customerAccountsEnabled()) return null;
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    return !error && data.user ? data.user : null;
  } catch {
    return null;
  }
}

export async function requireCustomer() {
  const user = await customerUser();
  if (!user) redirect("/account/login");
  return user;
}
