import fs from "node:fs";
import { convert } from "html-to-text";

const source = JSON.parse(
  fs.readFileSync("migration/source/products.json", "utf8"),
);
const mapping = JSON.parse(
  fs.readFileSync("migration/category-mapping.json", "utf8"),
);
const imageManifest = fs.existsSync("migration/image-manifest.json")
  ? JSON.parse(fs.readFileSync("migration/image-manifest.json", "utf8"))
  : [];
const imagesByUrl = new Map(
  imageManifest.map((image) => [image.sourceUrl, image]),
);
const clean = (text) =>
  convert(String(text || ""), {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  })
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*(?:1\.\s*)?Product Description\s*\n/i, "")
    .trim();
const slugify = (value) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-$/g, "");
const subcategoryNames = {
  "photo-standees": "Photo Standees",
  "event-standees": "Event Standees",
  "acrylic-awards": "Acrylic Awards",
  "wooden-mementos": "Wooden Mementos",
  "sports-trophies": "Sports Trophies",
  "certificate-awards": "Certificate Awards",
  "clock-mementos": "Clock Mementos",
  "recognition-mementos": "Recognition Mementos",
  "photo-keychains": "Photo Keychains",
  "utility-keychains": "Utility Keychains",
  "school-id-cards": "School I-Cards",
  "corporate-id-cards": "Corporate I-Cards",
  "desk-name-plates": "Desk Name Plates",
  "door-name-plates": "Door & Office Name Plates",
  "home-temples": "Home Temples",
  "spiritual-decor": "Spiritual Decor",
  "decorative-cutouts": "Decorative Cutouts",
  "festival-decor": "Festival Decor",
  clocks: "Wall Clocks",
  "pen-holders": "Pen Holders",
  "custom-keepsakes": "Custom Keepsakes",
};
const titleOverrides = {
  33192458: "Customized School Student ID Cards",
  33192450: "Customized School Teacher ID Cards",
  32870131: "EC 110 Custom Laser Trophy",
};
const slugSet = new Set();
const products = source.map((p) => {
  const mapped = mapping.find((m) => m.sourceProductId === p.id);
  if (!mapped) throw new Error(`Missing mapping for ${p.id}`);
  let name = titleOverrides[p.id] || clean(p.name);
  if (!name.includes(" ") && name.includes("-"))
    name = name.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let slug = slugify(name);
  if (slugSet.has(slug)) slug += "-" + p.id;
  slugSet.add(slug);
  const variants = p.variants.map((v) => ({
    id: String(v.variant_id),
    name: clean(v.variant_name),
    sku: v.sku_id || null,
    priceMinor: Math.round(v.price * 100),
    effectivePriceMinor: Math.round(v.discounted_price * 100),
    sourcePrice: v.price,
    sourceEffectivePrice: v.discounted_price,
    available: Boolean(v.available),
    unit: null,
  }));
  const images = p.images.map((image, order) => {
    const downloaded = imagesByUrl.get(image.image_url);
    return {
      id: String(image.image_id),
      sourceUrl: image.image_url,
      alt: clean(image.alt_text) || name,
      order,
      src: downloaded?.status === "downloaded" ? downloaded.localPath : null,
      width: downloaded?.width || null,
      height: downloaded?.height || null,
      status: downloaded?.status || "pending",
      error: downloaded?.error || null,
    };
  });
  const regular = Math.round(p.price * 100),
    effective = Math.round(p.discounted_price * 100);
  const flags = [
    mapped.priceReview,
    mapped.contentReview ? "content-review" : null,
    variants.some((v) => /^\d+(\.\d+)?$/.test(v.name))
      ? "size-unit-unconfirmed"
      : null,
    images.some((i) => i.status === "failed") ? "image-failure" : null,
  ].filter(Boolean);
  const description =
    p.id === 32870131
      ? "EC 110 custom laser trophy. Contact Yash Laser to confirm materials and personalization details."
      : clean(p.description);
  return {
    id: "yl-" + p.id,
    sourceProductId: String(p.id),
    name,
    slug,
    categoryId: mapped.categoryId,
    subcategoryId: mapped.subcategoryId,
    label: subcategoryNames[mapped.subcategoryId],
    description,
    details: clean(p.description_detail),
    pricingMode: mapped.priceReview
      ? "quote_required"
      : variants.length > 1
        ? "from"
        : "fixed",
    currency: "INR",
    priceMinor: regular,
    effectivePriceMinor: effective,
    variants,
    images,
    featured: [33214872, 32851834, 33190743, 33190739].includes(p.id),
    collections: p.collections.map((c) => ({ id: String(c.id), name: c.name })),
    reviewFlags: flags,
    contentReview: mapped.contentReview,
    source: {
      url: p.sourceUrl,
      name: p.name,
      categoryId: String(p.category.id),
      category: p.category.name,
      price: p.price,
      effectivePrice: p.discounted_price,
      sku: p.sku_id || null,
      description: p.description,
      details: p.description_detail,
      fetchedAt: p.fetchedAt,
      contentSha256: p.originalContentSha256,
    },
  };
});
const normalizedDescription = (p) =>
  p.description.toLowerCase().replace(/[^a-z0-9]+/g, "");
const descriptionGroups = Object.values(
  Object.groupBy(products, normalizedDescription),
).filter((g) => g.length > 1);
const nameGroups = Object.values(
  Object.groupBy(products, (p) =>
    p.name
      .toLowerCase()
      .replace(/\b(standy|2)\b/g, "")
      .replace(/[^a-z0-9]+/g, ""),
  ),
).filter((g) => g.length > 1);
const candidates = [
  ...descriptionGroups.map((g) => ({
    reason: "Matching normalized descriptions; not proof of identical designs",
    products: g.map((p) => p.id),
  })),
  ...nameGroups.map((g) => ({
    reason: "Similar normalized names; manual review only",
    products: g.map((p) => p.id),
  })),
];
const duplicateReport = {
  exactSourceIdDuplicates:
    products.length - new Set(products.map((p) => p.sourceProductId)).size,
  slugDuplicates: products.length - slugSet.size,
  candidates,
  action: "All records retained. No automatic deletion or merge.",
};
fs.writeFileSync(
  "data/generated/products.json",
  JSON.stringify(products, null, 2) + "\n",
);
fs.writeFileSync(
  "migration/reports/duplicates.json",
  JSON.stringify(duplicateReport, null, 2) + "\n",
);
fs.writeFileSync(
  "migration/reports/catalogue-summary.json",
  JSON.stringify(
    {
      imported: products.length,
      unavailableSourceUrls: 2,
      skippedAvailableProducts: 0,
      categoryCounts: Object.fromEntries(
        Object.entries(Object.groupBy(products, (p) => p.categoryId)).map(
          ([key, rows]) => [key, rows.length],
        ),
      ),
      subcategoryCounts: Object.fromEntries(
        Object.entries(Object.groupBy(products, (p) => p.subcategoryId)).map(
          ([key, rows]) => [key, rows.length],
        ),
      ),
      variants: products.reduce((sum, p) => sum + p.variants.length, 0),
      quoteRequired: products.filter((p) => p.pricingMode === "quote_required")
        .length,
      failedImages: products
        .flatMap((p) => p.images)
        .filter((i) => i.status === "failed").length,
      pendingImages: products
        .flatMap((p) => p.images)
        .filter((i) => i.status === "pending").length,
      duplicateCandidateGroups: candidates.length,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Built ${products.length} products; ${candidates.length} duplicate candidate groups retained; ${slugSet.size} unique slugs.`,
);
