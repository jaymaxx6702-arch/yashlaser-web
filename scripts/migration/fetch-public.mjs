import fs from "node:fs";
import { convert } from "html-to-text";
import crypto from "node:crypto";
const origin = "https://www.yashlaser.in";
const text = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.text();
};
const index = await text(origin + "/sitemap.xml");
let xml = index;
for (const url of [...index.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => u.includes("product") && u.endsWith(".xml")))
  xml += "\n" + (await text(url));
const urls = [
  ...new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].replaceAll("&amp;", "&"))
      .filter((u) => u.startsWith(origin + "/product/")),
  ),
];
if (!urls.length)
  throw new Error("No product URLs found; source snapshot unchanged.");
const previous = JSON.parse(
  fs.readFileSync("migration/source/products.json", "utf8"),
);
const records = new Map(previous.map((p) => [p.id, p])),
  failures = [];
let cursor = 0;
const clean = (t) =>
  convert(String(t || ""), {
    wordwrap: false,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  })
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const html = await text(url),
        match = html.match(
          /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
        );
      const p = JSON.parse(match?.[1] || "{}").props?.pageProps?.product;
      if (!p?.id) throw new Error("Missing product data");
      const keys = [
        "id",
        "name",
        "price",
        "discounted_price",
        "category",
        "image_url",
        "thumbnail_url",
        "images",
        "available",
        "variants",
        "variants_count",
        "sku_id",
        "brand_name",
        "attributes",
        "item_option_variants",
        "b2b_pricing_info",
        "slug_config",
        "product_personalization",
        "collections",
      ];
      const record = Object.fromEntries(keys.map((k) => [k, p[k]]));
      Object.assign(record, {
        sourceUrl: url,
        fetchedAt: new Date().toISOString(),
        httpStatus: 200,
        description: clean(p.description),
        description_detail: clean(p.description_detail),
        originalContentSha256: crypto
          .createHash("sha256")
          .update(
            String(p.description || "") + String(p.description_detail || ""),
          )
          .digest("hex"),
      });
      if (
        !record.category?.id ||
        !Number.isFinite(record.price) ||
        !Number.isFinite(record.discounted_price)
      )
        throw new Error("Invalid category or price");
      records.set(p.id, record);
    } catch (e) {
      failures.push({ url, reason: e.message });
    }
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
fs.mkdirSync("migration/backups", { recursive: true });
fs.copyFileSync(
  "migration/source/products.json",
  "migration/backups/products-" + Date.now() + ".json",
);
fs.writeFileSync(
  "migration/source/products.json",
  JSON.stringify(
    [...records.values()].sort((a, b) => a.id - b.id),
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  "migration/reports/fetch-results.json",
  JSON.stringify(
    {
      urls: urls.length,
      totalRecords: records.size,
      failures,
      note: "Failed refreshes retain previous records.",
    },
    null,
    2,
  ) + "\n",
);
console.log({
  urls: urls.length,
  totalRecords: records.size,
  failed: failures.length,
});
