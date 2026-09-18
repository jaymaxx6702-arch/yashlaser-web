// Verifies one existing direct-upload QA record; never logs signed URLs or secrets.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const base = process.argv[2] || "http://localhost:3106";
const reference = process.argv[3];
assert.match(reference || "", /^YL-[A-F0-9]{32}$/);
const db = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { data: e, error } = await db
  .from("enquiries")
  .select("*")
  .eq("reference", reference)
  .single();
assert.equal(error, null);
const { data: item, error: itemError } = await db
  .from("enquiry_items")
  .select("*")
  .eq("enquiry_id", e.id)
  .single();
assert.equal(itemError, null);
assert.ok(item.artwork_path.startsWith("incoming/"));
const original = await db.storage
  .from("customer-artwork")
  .download(item.artwork_path);
assert.equal(original.error, null);
const bytes = Buffer.from(await original.data.arrayBuffer());
assert.equal(bytes.length, item.customization.artwork.bytes);
assert.ok(bytes.length > 4_500_000 && bytes.length <= 8 * 1024 * 1024);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  item.customization.artwork.sha256,
);
const bucket = await db.storage.getBucket("customer-artwork");
assert.equal(bucket.data.public, false);
for (const path of [item.artwork_path, item.preview_path]) {
  const signed = await db.storage
    .from("customer-artwork")
    .createSignedUrl(path, 60);
  assert.equal(signed.error, null);
  assert.equal((await fetch(signed.data.signedUrl)).ok, true);
  assert.equal(
    (
      await fetch(
        db.storage.from("customer-artwork").getPublicUrl(path).data.publicUrl,
      )
    ).ok,
    false,
  );
}
const payload = {
  requestId: e.request_id,
  productId: item.product_id,
  variantId: item.customization.variantId,
  quantity: item.quantity,
  designId: item.design_id,
  customization: item.customization,
  customerName: e.customer_name,
  phone: e.phone,
  email: e.email || "",
  city: e.city,
  notes: item.notes,
  consent: true,
};
const body = JSON.stringify(payload);
assert.ok(Buffer.byteLength(body) < 32768);
const retry = await fetch(base + "/api/enquiries", {
  method: "POST",
  headers: { origin: base, "content-type": "application/json" },
  body,
});
assert.equal(retry.status, 200);
assert.equal((await retry.json()).reference, reference);
const count = await db
  .from("enquiry_items")
  .select("id", { count: "exact", head: true })
  .eq("enquiry_id", e.id);
assert.equal(count.count, 1);
const report = {
  reference,
  originalBytes: bytes.length,
  jsonBytes: Buffer.byteLength(body),
  originalHashPreserved: true,
  privateAccess: true,
  signedAccess: true,
  idempotency: true,
};
fs.mkdirSync("tests/artifacts", { recursive: true });
fs.writeFileSync(
  "tests/artifacts/direct-upload-report.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
// Only this explicitly marked test record is cancelled, never deleted.
if (e.customer_name === "Direct Upload QA") {
  const r = await db
    .from("enquiries")
    .update({ status: "cancelled" })
    .eq("id", e.id);
  assert.equal(r.error, null);
  console.log("Direct-upload QA marked Cancelled.");
}
