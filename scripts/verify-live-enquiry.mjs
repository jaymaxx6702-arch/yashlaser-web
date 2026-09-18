// Read-only verification, except replaying the same idempotent request.
// Run: node --env-file=.env.local scripts/verify-live-enquiry.mjs YL-reference
// Never log credentials, signed URLs, customer details or storage paths.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

async function verify() {
  const reference = process.argv[2];
  assert.match(reference || "", /^YL-[A-F0-9]{32}$/);
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const db = createClient(url, secret, options);
  const anonymous = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const { data: enquiry, error } = await db.from("enquiries").select("id,request_id,reference,phone_hash,phone").eq("reference", reference).single();
  assert.equal(error, null, "Enquiry lookup failed");
  assert.equal(enquiry.phone_hash, createHash("sha256").update(secret + enquiry.phone.replace(/\D/g, "")).digest("hex"), "Server secret hashing mismatch");
  const items = await db.from("enquiry_items").select("*").eq("enquiry_id", enquiry.id);
  assert.equal(items.error, null, "Item lookup failed");
  assert.equal(items.data.length, 1, "Expected exactly one item");
  const item = items.data[0];
  assert.equal(item.customization.quantity, item.quantity);
  assert.equal(item.customization.variantId, item.variant_id);
  assert.equal(item.customization.text[0].text, item.line1);
  assert.match(item.design_id, /^[a-f0-9]{16}$/);
  assert.match(item.customization.artwork.sha256, /^[a-f0-9]{64}$/);
  assert.ok(item.design_id && item.artwork_path && item.preview_path);
  const bucket = await db.storage.getBucket("customer-artwork");
  assert.equal(bucket.error, null, "Bucket lookup failed");
  assert.equal(bucket.data.public, false, "Bucket must be private");
  for (const [kind, path] of [["artwork", item.artwork_path], ["preview", item.preview_path]]) {
    const denied = await anonymous.storage.from("customer-artwork").download(path);
    assert.ok(denied.error, "Anonymous download must fail");
    const publicUrl = db.storage.from("customer-artwork").getPublicUrl(path).data.publicUrl;
    assert.equal((await fetch(publicUrl)).ok, false, "Public URL must fail");
    const signed = await db.storage.from("customer-artwork").createSignedUrl(path, 60);
    assert.equal(signed.error, null, "Signed access failed");
    const response = await fetch(signed.data.signedUrl);
    assert.equal(response.ok, true, "Signed download failed");
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, kind === "preview" ? 1000 : item.customization.artwork.width);
    assert.equal(metadata.height, kind === "preview" ? 1000 : item.customization.artwork.height);
    assert.equal(metadata.exif, undefined);
  }
  for (const table of ["enquiries", "enquiry_items"]) {
    const denied = await anonymous.from(table).select("id").limit(1);
    assert.ok(denied.error, "Anonymous table access must fail");
  }
  const replay = await db.rpc("submit_enquiry", { payload: { request_id: enquiry.request_id, phone_hash: enquiry.phone_hash } });
  assert.equal(replay.error, null, "Idempotent replay failed");
  assert.equal(replay.data.reference, reference);
  const count = await db.from("enquiry_items").select("id", { count: "exact", head: true }).eq("enquiry_id", enquiry.id);
  assert.equal(count.count, 1);
  console.log(JSON.stringify({ reference, enquiry: "PASS", item: "PASS", snapshot: "PASS", privateImages: 2, anonymousAccess: "DENIED", publicAccess: "DENIED", signedAccess60Seconds: "PASS", idempotency: "PASS" }, null, 2));
}
verify().catch(() => { console.error("Live verification failed; inspect the failed assertion locally without printing secrets."); process.exitCode = 1; });
