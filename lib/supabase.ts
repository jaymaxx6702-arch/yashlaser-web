import "server-only";
import { createClient } from "@supabase/supabase-js";
const projectUrl = () =>
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverKey = () =>
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
export const submissionEnabled = () =>
  Boolean(
    projectUrl() && serverKey() && process.env.ENQUIRIES_ENABLED === "true",
  );
export function getSupabase() {
  if (!projectUrl() || !serverKey())
    throw new Error("Supabase is not configured.");
  return createClient(projectUrl()!, serverKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
