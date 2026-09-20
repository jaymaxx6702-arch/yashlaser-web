import fs from "node:fs";
import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:3101";
const products = JSON.parse(
    fs.readFileSync("data/generated/products.json", "utf8"),
  ),
  redirects = JSON.parse(
    fs.readFileSync("data/generated/redirects.json", "utf8"),
  );
const localizedUtility = [
  "",
  "/products",
  "/contact",
  "/privacy",
  "/bulk-orders",
  "/plan-my-event",
  "/custom-acrylic",
  "/support",
  "/support/ticket",
  "/project-request-status",
  "/reviews",
  "/account",
  "/account/login",
  "/about",
  "/faq",
  "/shipping-policy",
  "/terms",
  "/replacement-damage",
  "/cart",
  "/checkout",
  "/track-order",
];
const paths = [
  "/",
  "/products",
  "/contact",
  "/privacy",
  "/bulk-orders",
  "/plan-my-event",
  "/custom-acrylic",
  "/support",
  "/reviews",
  "/cart",
  "/checkout",
  "/track-order",
  "/account",
  "/about",
  "/faq",
  "/shipping-policy",
  "/terms",
  "/replacement-damage",
  ...["gu", "hi", "mr"].flatMap((lang) =>
    localizedUtility.map((path) => "/" + lang + path),
  ),
  "/api/health",
  "/sitemap.xml",
  "/robots.txt",
  ...new Set(products.map((p) => "/categories/" + p.categoryId)),
  ...products.map((p) => "/products/" + p.slug),
  ...products.slice(0, 3).flatMap((p) => [
    "/gu/products/" + p.slug,
    "/hi/products/" + p.slug,
    "/mr/products/" + p.slug,
    "/gu/customize/" + p.slug,
    "/hi/customize/" + p.slug,
    "/mr/customize/" + p.slug,
  ]),
  ...new Map(
    products.map((p) => [p.categoryId, "/customize/" + p.slug]),
  ).values(),
];
let cursor = 0;
const failures = [],
  links = new Set();
async function worker() {
  while (cursor < paths.length) {
    const path = paths[cursor++];
    try {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      if (
        path.startsWith("/customize/") ||
        /^\/(gu|hi|mr)\/customize\//.test(path) ||
        path === "/support/ticket" ||
        /^\/(gu|hi|mr)\/support\/ticket$/.test(path) ||
        path === "/project-request-status" ||
        /^\/(gu|hi|mr)\/project-request-status$/.test(path)
      )
        assert.match(html, /noindex/);
      for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
        const link = m[1].replaceAll("&amp;", "&");
        if (!link.startsWith("/_next/") && !link.startsWith("//"))
          links.add(link);
      }
    } catch (e) {
      failures.push({ path, error: e.message });
    }
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
const extras = [...links].filter((p) => !paths.includes(p));
cursor = 0;
async function extraWorker() {
  while (cursor < extras.length) {
    const path = extras[cursor++];
    try {
      const r = await fetch(base + path);
      assert.ok(r.status < 400, path + " " + r.status);
      await r.arrayBuffer();
    } catch (e) {
      failures.push({ path, error: e.message });
    }
  }
}
await Promise.all(Array.from({ length: 5 }, extraWorker));
for (const r of redirects) {
  const response = await fetch(base + r.source, { redirect: "manual" });
  if (
    response.status !== 308 ||
    new URL(response.headers.get("location"), base).pathname !==
      new URL(r.destination, base).pathname
  )
    failures.push({ redirect: r.source, status: response.status });
  await response.arrayBuffer();
}
for (const path of [
  "/products/nonexistent-product",
  "/categories/nonexistent-category",
  "/customize/nonexistent-product",
]) {
  const r = await fetch(base + path);
  if (r.status !== 404)
    failures.push({ path, status: r.status, expected: 404 });
  await r.arrayBuffer();
}
const api = await fetch(base + "/api/enquiries", {
  method: "POST",
  headers: { origin: base, "content-type": "application/json" },
  body: "{}",
});
if (![400, 503].includes(api.status))
  failures.push({
    api: "Missing form must be rejected whether backend is configured or disabled",
    status: api.status,
  });

const crossSite = await fetch(base + "/api/analytics", {
  method: "POST",
  headers: {
    origin: "https://example.invalid",
    "sec-fetch-site": "cross-site",
    "content-type": "application/json",
  },
  body: JSON.stringify({ eventName: "page_view", path: "/" }),
});
if (crossSite.status !== 403)
  failures.push({
    api: "Cross-site unsafe API request must be blocked",
    status: crossSite.status,
  });
await crossSite.arrayBuffer();
const report = {
  routes: paths.length,
  linkedRoutes: extras.length,
  redirects: redirects.length,
  failures,
};
fs.writeFileSync(
  "migration/reports/route-check.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
if (failures.length) process.exitCode = 1;
