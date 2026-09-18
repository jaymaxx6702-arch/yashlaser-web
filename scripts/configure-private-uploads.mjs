// Run once per environment with --env-file=.env.local. Never prints credentials.
import { createClient } from "@supabase/supabase-js";
const db = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const existing = await db.storage.getBucket("customer-artwork");
if (existing.error) throw new Error("Existing private bucket is required.");
const updated = await db.storage.updateBucket("customer-artwork", {
  public: false,
  fileSizeLimit: 8 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});
if (updated.error) throw new Error("Private bucket configuration failed.");
console.log(
  "Private customer-artwork bucket: JPEG/PNG/WebP, 8 MiB, public=false.",
);
