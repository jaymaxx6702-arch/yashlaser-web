import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const source = read("migration/source/products.json"),
  products = read("data/generated/products.json"),
  images = read("migration/image-manifest.json"),
  redirects = read("data/generated/redirects.json");
assert.equal(
  products.length,
  source.length,
  "No available product silently skipped",
);
for (const key of ["id", "slug", "sourceProductId"])
  assert.equal(
    new Set(products.map((p) => p[key])).size,
    products.length,
    "Duplicate " + key,
  );
for (const p of products) {
  const original = source.find((s) => String(s.id) === p.sourceProductId);
  assert.ok(original);
  assert.equal(p.priceMinor, Math.round(original.price * 100));
  assert.equal(
    p.effectivePriceMinor,
    Math.round(original.discounted_price * 100),
  );
  assert.equal(p.variants.length, original.variants.length);
  for (const v of p.variants) {
    const raw = original.variants.find((r) => String(r.variant_id) === v.id);
    assert.ok(raw);
    assert.equal(v.priceMinor, Math.round(raw.price * 100));
    assert.equal(v.effectivePriceMinor, Math.round(raw.discounted_price * 100));
  }
  assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug));
  assert.ok(
    !/<\/?(?:script|style|div|p|span|img)\b/i.test(p.description + p.details),
    "Old HTML in " + p.id,
  );
  assert.ok(
    redirects.some(
      (r) =>
        r.source === new URL(p.source.url).pathname &&
        r.destination === "/products/" + p.slug,
    ),
  );
  for (const i of p.images) {
    assert.ok(["downloaded", "failed"].includes(i.status), "Unmarked image");
    if (i.status === "downloaded") {
      assert.ok(i.src?.startsWith("/products/"));
      assert.ok(fs.existsSync("public" + i.src));
    } else assert.ok(i.error);
  }
}
for (const image of images.filter((i) => i.status === "downloaded")) {
  const bytes = fs.readFileSync("public" + image.localPath);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    image.sha256,
  );
}
assert.equal(
  new Set(redirects.map((r) => r.source)).size,
  redirects.length,
  "Duplicate redirect source",
);
assert.equal(
  products.find((p) => p.sourceProductId === "31769051").subcategoryId,
  "pen-holders",
);
assert.equal(
  products.find((p) => p.sourceProductId === "31534408").subcategoryId,
  "clocks",
);
const report = {
  passed: true,
  products: products.length,
  variants: products.reduce((n, p) => n + p.variants.length, 0),
  verifiedImages: images.filter((i) => i.status === "downloaded").length,
  failedImages: images.filter((i) => i.status === "failed").length,
  redirects: redirects.length,
  duplicateSlugs: 0,
  priceChanges: 0,
};
fs.writeFileSync(
  "migration/reports/integrity-check.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
