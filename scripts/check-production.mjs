import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:3106";
for (const path of [
  "/",
  "/products",
  "/categories/standees",
  "/products/personalized-vertical-couple-standee-3d-cutout",
  "/admin/login",
  "/customize/personalized-vertical-couple-standee-3d-cutout",
]) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("x-frame-options"), "DENY");
  assert.match(
    r.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  const html = await r.text();
  if (path.startsWith("/admin") || path.startsWith("/customize"))
    assert.match(html, /noindex/);
  else {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, `Missing canonical: ${path}`);
    assert.equal(
      new URL(canonical[1]).href,
      new URL(path, "https://shop.yashlaser.in").href,
    );
  }
}
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
assert.ok(!sitemap.includes("www.yashlaser.in") && !sitemap.includes("/admin"));
assert.ok(sitemap.includes("shop.yashlaser.in"));
for (const endpoint of ["/api/enquiries", "/api/enquiries/uploads"]) {
  let r = await fetch(base + endpoint, {
    method: "POST",
    headers: { origin: base, "content-type": "application/json" },
    body: JSON.stringify({ padding: "x".repeat(33000) }),
  });
  assert.equal(r.status, 413);
  r = await fetch(base + endpoint, {
    method: "POST",
    headers: {
      origin: "https://evil.invalid",
      "content-type": "application/json",
    },
    body: "{}",
  });
  assert.equal(r.status, 403);
  r = await fetch(base + endpoint, {
    method: "POST",
    headers: { origin: base, "content-type": "multipart/form-data" },
    body: "raw image not accepted",
  });
  assert.equal(r.status, 415);
}
console.log(
  "PASS: security headers, shop canonical/sitemap, private noindex, 32 KiB guard, origin and raw-image rejection.",
);
