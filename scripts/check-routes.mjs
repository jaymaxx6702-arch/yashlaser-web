import fs from "node:fs";
import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:3101";
const products = JSON.parse(
    fs.readFileSync("data/generated/products.json", "utf8"),
  ),
  redirects = JSON.parse(
    fs.readFileSync("data/generated/redirects.json", "utf8"),
  );
const paths = [
  "/",
  "/products",
  "/contact",
  "/privacy",
  "/sitemap.xml",
  "/robots.txt",
  ...new Set(products.map((p) => "/categories/" + p.categoryId)),
  ...products.map((p) => "/products/" + p.slug),
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
      if (path.startsWith("/customize/")) assert.match(html, /noindex/);
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
  headers: { origin: base },
});
if (api.status !== 503)
  failures.push({
    api: "Unconfigured backend must reject saving",
    status: api.status,
  });
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
