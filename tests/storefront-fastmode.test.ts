import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("AI Photo Studio is visible before artwork upload and exposes capabilities", () => {
  const panel = fs.readFileSync(
    "components/customization/PhotoToolsPanel.tsx",
    "utf8",
  );
  assert.match(panel, /AI Photo Studio/);
  assert.match(panel, /Upload a photo to unlock on-device AI tools/);
  assert.match(panel, /Quality check/);
  assert.match(panel, /Background removal/);
  assert.match(panel, /Smart crop/);
  assert.match(panel, /Enhance 2×/);
  assert.match(panel, /Manual cutout refine/);
  assert.match(panel, /!hasArtwork/);
});

test("catalogue zero-result state gives customers a recovery path", () => {
  const source = fs.readFileSync("components/Catalogue.tsx", "utf8");
  assert.match(source, /empty-state/);
  assert.match(source, /Clear the search/);
  assert.match(source, /categories\.slice\(0, 4\)/);
  assert.match(source, /copy\.allProducts/);
});

test("storefront has global loading, error and not-found states", () => {
  assert.ok(fs.existsSync("app/loading.tsx"));
  assert.ok(fs.existsSync("app/error.tsx"));
  assert.ok(fs.existsSync("app/not-found.tsx"));
});

test("localized public pages use self-canonical URLs and shared hreflang alternates", () => {
  const home = fs.readFileSync("app/[lang]/page.tsx", "utf8");
  const products = fs.readFileSync("app/[lang]/products/page.tsx", "utf8");
  const categories = fs.readFileSync(
    "app/[lang]/categories/[slug]/page.tsx",
    "utf8",
  );
  const product = fs.readFileSync(
    "app/[lang]/products/[slug]/page.tsx",
    "utf8",
  );

  for (const source of [home, products, categories, product]) {
    assert.match(source, /languageAlternates/);
    assert.match(source, /canonical/);
  }
  assert.match(home, /canonical: "\/" \+ lang/);
  assert.match(products, /canonical: "\/" \+ lang \+ "\/products"/);
  assert.match(categories, /canonical: "\/" \+ lang \+ path/);
  assert.match(product, /canonical: "\/" \+ lang \+ path/);
});
