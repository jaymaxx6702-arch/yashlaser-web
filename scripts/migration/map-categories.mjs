import fs from "node:fs";

const source = JSON.parse(
  fs.readFileSync("migration/source/products.json", "utf8"),
);
// Classify the actual product, never all items in a legacy material category.
export function classify(product) {
  const name = product.name.toLowerCase().replaceAll("-", " ");
  const description = product.description.toLowerCase();
  const result = (categoryId, subcategoryId, reason) => ({
    categoryId,
    subcategoryId,
    reason,
  });
  if (product.id === 32870131)
    return result(
      "awards",
      "recognition-mementos",
      "EC 110 title explicitly identifies a laser trophy; SEO-only description is flagged, material is not inferred.",
    );
  if (/pen holder/.test(name) && /pen holder/.test(description))
    return result(
      "other",
      "pen-holders",
      "Name and description identify a functional pen holder, not an award.",
    );
  if (/wall clock/.test(name) && /clock/.test(description))
    return result(
      "other",
      "clocks",
      "Wall clock for home/office use; award keywords in description are cross-selling.",
    );
  if (/keychain/.test(name))
    return result(
      "keychains",
      /mobile stand/.test(name) ? "utility-keychains" : "photo-keychains",
      "Primary product is a keychain; ignore unrelated award keywords.",
    );
  if (/id cards?|i cards?/.test(name))
    return result(
      "id-cards",
      /school/.test(name) ? "school-id-cards" : "corporate-id-cards",
      "Identification card with school/corporate use stated in name and description.",
    );
  if (/name plate|nameplate/.test(name))
    return result(
      "name-plates",
      /desk|professional/.test(name) ? "desk-name-plates" : "door-name-plates",
      "Primary function is personalised identification/signage, not recognition.",
    );
  if (
    /standee|standy/.test(name) &&
    /photo|personalized|person|couple|family/.test(name)
  )
    return result(
      "standees",
      /life size|wedding.*cut out/.test(name)
        ? "event-standees"
        : "photo-standees",
      "Personal photo/person/event standee identified in name and description.",
    );
  if (/decorative home temple|mandir/.test(name))
    return result(
      "other",
      "home-temples",
      "Home temple is devotional decor, not a trophy; contradictory source text is separately flagged.",
    );
  if (/religious signage|goddess|religious.*decorative|puja.*frame/.test(name))
    return result(
      "other",
      "spiritual-decor",
      "Religious display/signage intended for devotional spaces.",
    );
  if (/cut out|cutout/.test(name))
    return result(
      "other",
      /navratri/.test(name) ? "festival-decor" : "decorative-cutouts",
      "Non-personalised historical/spiritual/festival cutout; distinguish from customer photo standees.",
    );
  if (/clock.*memento/.test(name))
    return result(
      "awards",
      "clock-mementos",
      "Commemorative award with an integrated clock; recognition is its stated purpose.",
    );
  if (/certificate/.test(name) && /award|plaque|trophy/.test(name))
    return result(
      "awards",
      "certificate-awards",
      "Certificate recognition plaque/trophy; material is a separate attribute.",
    );
  if (/sports trophy|athletic meet/.test(name))
    return result(
      "awards",
      "sports-trophies",
      "Sports/athletic recognition explicitly identified in title and descriptive purpose.",
    );
  if (/wooden/.test(name) && /memento|trophy|plaque/.test(name))
    return result(
      "awards",
      "wooden-mementos",
      "Wooden recognition memento identified by product title; material conflicts separately flagged.",
    );
  if (
    /award|trophy|memento|plaque/.test(name) &&
    /award|trophy|honou?r|achievement|recognition|prize/.test(description)
  )
    return result(
      "awards",
      /acrylic/.test(name + " " + description)
        ? "acrylic-awards"
        : "recognition-mementos",
      "Product title and descriptive use both establish a recognition award.",
    );
  return result(
    "other",
    "custom-keepsakes",
    "Conservative fallback: insufficient agreement to assign a specific primary product type.",
  );
}

const contentIssues = {
  31530148:
    "Temple 003 description incorrectly describes an electronic device.",
  31494157:
    "Temple 002 description calls it a memento; confirm actual purpose.",
  32851361: "Title code 110; description code 113.",
  32851363: "Title code 111; description code 113.",
  32851832: "Title code 433; description/legacy URL code 432.",
  32851365: "Title identifies Baba Ramdev; description says meditating monk.",
  32851520: "Title identifies Vivekanand; description says Lord Hanuman.",
  32851695:
    "Title identifies Swami Vivekanand; description says Shivaji Maharaj.",
  32178599: "RW 32 wooden title conflicts with EC 154 acrylic description.",
  32870131:
    "EC 110 description consists of SEO instructions; retain source, show neutral product summary.",
  33190508: "Single person title includes couple-oriented description.",
  33192458: "Student card description refers to staff/faculty.",
  32851429:
    "Life-size title but small unqualified size variants; dimensions need confirmation.",
};
const mapping = source.map((p) => ({
  sourceProductId: p.id,
  sourceName: p.name,
  sourceCategory: p.category.name,
  sourceUrl: p.sourceUrl,
  regularPrice: p.price,
  effectivePrice: p.discounted_price,
  ...classify(p),
  descriptionEvidence: p.description,
  contentReview: contentIssues[p.id] || null,
  priceReview:
    p.price === 0
      ? "zero-price"
      : p.variants.length &&
          !p.variants.some((v) => v.discounted_price === p.discounted_price)
        ? "product-variant-mismatch"
        : null,
}));
fs.writeFileSync(
  "migration/category-mapping.json",
  JSON.stringify(mapping, null, 2) + "\n",
);
const counts = Object.entries(Object.groupBy(mapping, (p) => p.categoryId)).map(
  ([id, list]) => ({ id, count: list.length }),
);
const exceptions = mapping.filter(
  (p) => p.sourceCategory === "ACRYLIC" && p.categoryId !== "awards",
);
fs.writeFileSync(
  "migration/reports/category-mapping.md",
  "# Category mapping review\n\nEvery product is evaluated using its title, descriptive purpose and price validity. Prices are never used to guess a product type. Original category is retained as provenance.\n\n" +
    mapping
      .map(
        (p) =>
          `- ${p.sourceProductId} | ${p.sourceName} | ${p.sourceCategory} → ${p.categoryId}/${p.subcategoryId} | INR ${p.regularPrice}/${p.effectivePrice} | ${p.reason}${p.contentReview ? " REVIEW: " + p.contentReview : ""}`,
      )
      .join("\n") +
    "\n",
);
console.log(
  JSON.stringify(
    {
      counts,
      acrylicExceptions: exceptions.map((p) => ({
        name: p.sourceName,
        subcategory: p.subcategoryId,
      })),
      reviewCount: mapping.filter((p) => p.contentReview).length,
    },
    null,
    2,
  ),
);
