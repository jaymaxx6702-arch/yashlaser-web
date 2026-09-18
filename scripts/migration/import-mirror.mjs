import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { convert } from "html-to-text";
const root = path.resolve(process.argv[2] || "C:/Users/pc/YashLaser-Old-Site");
if (!fs.existsSync(root))
  throw new Error("Mirror directory not found: " + root);
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
const files = walk(root),
  pages = files.filter((f) => /\.html?$/i.test(f));
const clean = (text) =>
  convert(String(text || ""), {
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
const target = "migration/source/products.json";
const previous = fs.existsSync(target)
  ? JSON.parse(fs.readFileSync(target, "utf8"))
  : [];
const byId = new Map(previous.map((p) => [p.id, p]));
const failures = [],
  extracted = [],
  summaries = [];
for (const file of pages) {
  try {
    const html = fs.readFileSync(file, "utf8"),
      match = html.match(
        /<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
      );
    if (!match) {
      if (/[\\/]product[\\/]/i.test(file))
        failures.push({
          file,
          reason: "Product page missing structured data; review required",
        });
      continue;
    }
    const props = JSON.parse(match[1]).props?.pageProps;
    const p = props?.product;
    if (!p?.id) {
      summaries.push(path.relative(root, file));
      continue;
    }
    const canonical = html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i,
    )?.[1];
    const sourceUrl = p.link?.startsWith("https://www.yashlaser.in/product/")
      ? p.link
      : canonical?.startsWith("https://www.yashlaser.in/product/")
        ? canonical
        : "https://www.yashlaser.in/product/" +
          (p.slug_config?.url || path.basename(file).replace(/\.html?$/i, ""));
    const fields = [
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
    const record = Object.fromEntries(
      fields.map((key) => [
        key,
        p[key] ??
          (["images", "variants", "collections"].includes(key) ? [] : null),
      ]),
    );
    Object.assign(record, {
      sourceUrl,
      fetchedAt: fs.statSync(file).mtime.toISOString(),
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
    ) {
      failures.push({
        file,
        reason: "Missing category or price; previous record retained",
      });
      continue;
    }
    byId.set(p.id, record);
    extracted.push({ id: p.id, file: path.relative(root, file) });
  } catch (error) {
    failures.push({ file, reason: error.message });
  }
}
fs.mkdirSync("migration/reports", { recursive: true });
fs.mkdirSync("migration/source", { recursive: true });
if (extracted.length) {
  fs.mkdirSync("migration/backups", { recursive: true });
  if (fs.existsSync(target))
    fs.copyFileSync(
      target,
      "migration/backups/products-" + Date.now() + ".json",
    );
  fs.writeFileSync(
    target,
    JSON.stringify(
      [...byId.values()].sort((a, b) => a.id - b.id),
      null,
      2,
    ) + "\n",
  );
}
const report = {
  mirror: root,
  htmlPagesScanned: pages.length,
  productPagesExtracted: extracted.length,
  priorProductsRetained: previous.filter(
    (p) => !extracted.some((e) => e.id === p.id),
  ).length,
  totalRecords: byId.size,
  failures,
  extracted,
  summaryPages: summaries,
  note: extracted.length
    ? "Merged by source ID; no automatic deletion."
    : "Mirror has no complete product pages. Existing public-site snapshot retained. Use fetch-public.mjs for a refresh.",
};
fs.writeFileSync(
  "migration/reports/mirror-import.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { ...report, extracted: undefined, summaryPages: undefined },
    null,
    2,
  ),
);
