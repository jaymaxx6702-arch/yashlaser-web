import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const products = read("data/generated/products.json"),
  categories = read("migration/source/categories.json");
const redirects = products.map((p) => ({
  source: new URL(p.source.url).pathname,
  destination: "/products/" + p.slug,
  permanent: true,
}));
for (const c of categories)
  redirects.push({
    source: "/shop/" + c.slug,
    destination: "/products?legacyCategory=" + c.id,
    permanent: true,
  });
redirects.push(
  { source: "/about-us", destination: "/#our-story", permanent: true },
  { source: "/contact-us", destination: "/contact", permanent: true },
);
fs.writeFileSync(
  "data/generated/redirects.json",
  JSON.stringify(redirects, null, 2) + "\n",
);
const candidates = read("migration/reports/duplicates.json").candidates;
const review = products
  .filter(
    (p) =>
      p.reviewFlags.length ||
      p.subcategoryId === "custom-keepsakes" ||
      candidates.some((g) => g.products.includes(p.id)),
  )
  .map((p) => ({
    id: p.id,
    name: p.name,
    url: p.source.url,
    newUrl: "/products/" + p.slug,
    category: p.categoryId,
    subcategory: p.subcategoryId,
    reasons: [
      ...p.reviewFlags,
      ...(p.subcategoryId === "custom-keepsakes" ? ["uncertain-category"] : []),
      ...(candidates.some((g) => g.products.includes(p.id))
        ? ["duplicate-candidate"]
        : []),
    ],
    note: p.contentReview,
  }));
fs.writeFileSync(
  "migration/reports/manual-review.json",
  JSON.stringify(review, null, 2) + "\n",
);
console.log({ redirects: redirects.length, manualReview: review.length });
