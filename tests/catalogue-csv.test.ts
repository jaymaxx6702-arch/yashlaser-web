import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  catalogueDraftsToCsv,
  inspectCatalogueCsv,
  parseCatalogueCsv,
} from "../lib/catalogue-csv";

const draft = {
  productKey: "yl-csv-test",
  baseProductId: "yl-csv-test",
  name: "CSV Test",
  slug: "csv-test",
  categoryId: "other" as const,
  pricingMode: "from" as const,
  currency: "INR" as const,
  priceMinor: 10000,
  effectivePriceMinor: 9000,
  description: "A, quoted \"description\"",
  details: "Line one\nLine two",
  variants: [
    {
      id: "small",
      name: "Small",
      priceMinor: 10000,
      effectivePriceMinor: 9000,
      available: true,
    },
    {
      id: "large",
      name: "Large",
      priceMinor: 12000,
      effectivePriceMinor: 11000,
      available: true,
    },
  ],
};

test("catalogue CSV round-trips product and variant data", () => {
  const csv = catalogueDraftsToCsv([draft]);
  const parsed = parseCatalogueCsv(csv);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, draft.name);
  assert.equal(parsed[0].description, draft.description);
  assert.equal(parsed[0].details, draft.details);
  assert.deepEqual(parsed[0].variants, draft.variants);
});

test("catalogue CSV neutralizes spreadsheet formulas on export", () => {
  const csv = catalogueDraftsToCsv([
    { ...draft, name: "=HYPERLINK(\"https://example.com\")" },
  ]);
  assert.match(csv, /'=HYPERLINK/);
});

test("catalogue CSV rejects conflicting repeated product data", () => {
  const csv = catalogueDraftsToCsv([draft]).replace(
    '"CSV Test"',
    '"Different Name"',
  );
  const rows = csv.split("\r\n");
  const second = rows[2].replace('"CSV Test"', '"Another Name"');
  rows[2] = second;
  assert.throws(() => parseCatalogueCsv(rows.join("\r\n")));
});


test("catalogue CSV inspection reports multiple product issues without creating drafts", () => {
  const csv = [
    '"product_key","base_product_id","name","slug","category_id","subcategory_id","pricing_mode","price_minor","effective_price_minor","description","details","variant_id","variant_name","variant_price_minor","variant_effective_price_minor","variant_available"',
    '"bad-one","","Bad One","same-slug","wrong-category","","fixed","100","100","","","","","","",""',
    '"good-one","","Good One","same-slug","other","","fixed","100","100","","","","","","",""',
    '"good-two","","Good Two","same-slug","other","","fixed","100","100","","","","","","",""',
  ].join("\\r\\n");

  const result = inspectCatalogueCsv(csv);
  assert.ok(result.issues.length >= 2);
  assert.ok(result.issues.some((issue) => issue.productKey === "bad-one"));
  assert.ok(result.issues.some((issue) => /also used/.test(issue.message)));
});

test("catalogue import endpoint only creates draft revisions after server validation", () => {
  const source = fs.readFileSync("app/api/admin/products/import-drafts/route.ts", "utf8");
  assert.match(source, /requireAdmin/);
  assert.match(source, /inspectCatalogueCsv/);
  assert.match(source, /findPublishedSlugConflicts/);
  assert.match(source, /importProductAdminDrafts/);

  const importer = fs.readFileSync("lib/catalogue-import-server.ts", "utf8");
  assert.match(importer, /state: "draft"/);
  assert.doesNotMatch(importer, /state: "published"/);
});
