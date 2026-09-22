import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import type { CustomizationProduct } from "../lib/customization";
import {
  createDocument,
  validateDocument,
  requireReadyDocument,
  categoryTemplates,
} from "../lib/customization/model";
import {
  placement,
  moveCrop,
  resizeCrop,
  cropPreset,
} from "../lib/customization/geometry";
import {
  templates,
  frameFor,
  relativeBox,
} from "../lib/customization/templates";
import { removeBackground } from "../lib/customization/background-removal";
import { customizationRules, validateCustomizationRules } from "../lib/customization/rules";
import { CUSTOMIZATION_ARTWORK_POLICY, artworkWithinPolicy } from "../lib/customization/file-policy";
import { canTransitionDesignAsset, validateDesignAssetRef } from "../lib/customization/assets";
import { providerSupports, type ImageProcessingProvider } from "../lib/customization/image-provider";
import { analyzeQualitySample } from "../lib/customization/quality";
const products = JSON.parse(
  fs.readFileSync("data/generated/products.json", "utf8"),
) as CustomizationProduct[];
const p = products.find(
  (p) => p.categoryId === "standees" && p.variants.length > 1,
)!;
test("catalogue selections create valid versioned documents without prices or customer contact data", () => {
  for (const product of products) {
    if (product.variants.length && !product.variants.some((v) => v.available))
      continue;
    const d = createDocument(product);
    assert.deepEqual(
      validateDocument(JSON.parse(JSON.stringify(d)), product),
      d,
    );
    assert.equal("price" in d, false);
    assert.equal("customerName" in d, false);
  }
});
test("only category-appropriate templates are accepted, including both award templates", () => {
  for (const category of [
    "standees",
    "awards",
    "keychains",
    "id-cards",
    "name-plates",
  ] as const) {
    const product = products.find((p) => p.categoryId === category)!;
    for (const id of categoryTemplates[category])
      assert.equal(
        validateDocument(
          { ...createDocument(product), templateId: id },
          product,
        ).templateId,
        id,
      );
  }
  assert.throws(() =>
    validateDocument({ ...createDocument(p), templateId: "name-plate" }, p),
  );
});
test("tampered product, variant, quantity, crop and transform values are rejected", () => {
  const d = createDocument(p);
  for (const patch of [
    { productId: "other" },
    { version: 2 },
    { variantId: "fake" },
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: 10001 },
    { quantity: NaN },
    { categoryId: "awards" },
  ])
    assert.throws(() => validateDocument({ ...d, ...patch }, p));
  for (const patch of [
    { zoom: 0 },
    { zoom: 4.1 },
    { panX: Infinity },
    { panY: 2 },
    { fit: "html" },
    { crop: { x: 0.8, y: 0, width: 0.5, height: 1 } },
  ])
    assert.throws(() =>
      validateDocument({ ...d, image: { ...d.image, ...patch } }, p),
    );
});
test("standees require artwork and bounded text / image metadata", () => {
  const d = createDocument(p);
  assert.throws(() => requireReadyDocument(d, p), /photograph/);
  const artwork = {
    name: "photo.png",
    mimeType: "image/png",
    bytes: 100,
    width: 800,
    height: 600,
    sha256: "a".repeat(64),
  };
  assert.equal(requireReadyDocument({ ...d, artwork }, p).artwork?.width, 800);
  assert.throws(() =>
    validateDocument({ ...d, artwork: { ...artwork, width: 26000000 } }, p),
  );
  assert.throws(() =>
    validateDocument(
      { ...d, artwork: { ...artwork, bytes: 9 * 1024 * 1024 } },
      p,
    ),
  );
  assert.throws(() =>
    validateDocument({ ...d, artwork: { ...artwork, sha256: "invalid" } }, p),
  );
  assert.throws(() =>
    validateDocument(
      { ...d, text: [{ ...d.text[0], text: "x".repeat(121) }, d.text[1]] },
      p,
    ),
  );
  assert.throws(() =>
    validateDocument(
      { ...d, text: [{ ...d.text[0], fontSize: 500 }, d.text[1]] },
      p,
    ),
  );
  assert.throws(() =>
    validateDocument(
      { ...d, text: [{ ...d.text[0], align: "justify" }, d.text[1]] },
      p,
    ),
  );
});
test("cover geometry never exposes empty edges at any supported pan or zoom", () => {
  const box = { x: 100, y: 80, width: 400, height: 500 };
  for (const [w, h] of [
    [400, 400],
    [200, 1200],
    [1400, 200],
  ])
    for (const zoom of [1, 1.7, 4])
      for (const panX of [-1, 0, 1])
        for (const panY of [-1, 0, 1]) {
          const d = createDocument(p);
          const image = {
            ...d.image,
            crop: { x: 0.1, y: 0.1, width: 0.7, height: 0.8 },
            zoom,
            panX,
            panY,
          };
          const { destination: r, source } = placement(w, h, box, image);
          assert.ok(
            r.x <= box.x + 1e-8 &&
              r.y <= box.y + 1e-8 &&
              r.x + r.width >= box.x + box.width - 1e-8 &&
              r.y + r.height >= box.y + box.height - 1e-8,
          );
          assert.equal(source.width, w * 0.7);
        }
});
test("contain fits the complete selected crop and pan stays within the available margin", () => {
  const d = createDocument(p),
    box = { x: 0, y: 0, width: 400, height: 400 };
  const r = placement(800, 400, box, { ...d.image, fit: "contain", panY: 1 });
  assert.equal(r.destination.width, 400);
  assert.equal(r.destination.height, 200);
  assert.equal(r.destination.y, 200);
});
test("crop corners and movement remain bounded even after extreme drags", () => {
  const start = { x: 0.2, y: 0.15, width: 0.5, height: 0.6 };
  for (const dx of [-10, -0.15, 0.04, 10])
    for (const dy of [-10, 0.01, 10])
      for (const handle of ["nw", "ne", "sw", "se"]) {
        const crop = resizeCrop(start, handle, dx, dy);
        assert.ok(
          crop.x >= 0 &&
            crop.y >= 0 &&
            crop.width >= 0.05 - 1e-9 &&
            crop.height >= 0.05 - 1e-9,
        );
        assert.ok(
          crop.x + crop.width <= 1 + 1e-9 && crop.y + crop.height <= 1 + 1e-9,
        );
        assert.doesNotThrow(() =>
          validateDocument(
            {
              ...createDocument(p),
              image: { ...createDocument(p).image, crop },
            },
            p,
          ),
        );
      }
  assert.deepEqual(moveCrop(start, 20, -20), { ...start, x: 0.5, y: 0 });
  const square = cropPreset(800, 400, 1);
  assert.equal(square.width * 800, square.height * 400);
});
test("every template keeps photograph and text inside its frame", () => {
  for (const t of Object.values(templates)) {
    const f = frameFor(t);
    assert.ok(
      f.x >= 0 && f.y >= 0 && f.x + f.width <= 1000 && f.y + f.height <= 900,
    );
    for (const b of [t.photo, ...t.text]) {
      const r = relativeBox(f, b);
      assert.ok(
        r.x >= f.x &&
          r.y >= f.y &&
          r.x + r.width <= f.x + f.width + 1e-9 &&
          r.y + r.height <= f.y + f.height + 1e-9,
      );
    }
  }
});
test("background removal is injected, cancellable, and requires transparent-capable output", async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  const adapter = {
    id: "local-test",
    execution: "browser" as const,
    removeBackground: async () => {
      calls++;
      return new Blob(["test"], { type: "image/png" });
    },
  };
  await assert.rejects(
    removeBackground(adapter, new Blob(), controller.signal),
  );
  assert.equal(calls, 0);
  const out = await removeBackground(
    adapter,
    new Blob(),
    new AbortController().signal,
  );
  assert.equal(out.type, "image/png");
  assert.equal(calls, 1);
  await assert.rejects(
    removeBackground(
      {
        ...adapter,
        removeBackground: async () => new Blob(["x"], { type: "text/html" }),
      },
      new Blob(),
      new AbortController().signal,
    ),
  );
});


test("shared product rules preserve current editor limits and remain product-bound", () => {
  const rules = customizationRules(p);
  assert.equal(rules.productId, p.id);
  assert.equal(rules.fields.find((field) => field.id === "artwork")?.required, true);
  assert.equal(rules.fields.find((field) => field.id === "line1")?.maxLength, 120);
  assert.equal(rules.fields.find((field) => field.id === "line2")?.maxLength, 180);
  assert.equal(rules.quantity.min, 1);
  assert.equal(rules.quantity.max, 10000);
  assert.deepEqual(validateCustomizationRules(rules, p), rules);
  assert.throws(() =>
    validateCustomizationRules({ ...rules, productId: "other" }, p),
  );
});

test("artwork policy is shared and rejects oversized pixel or byte payloads", () => {
  assert.equal(CUSTOMIZATION_ARTWORK_POLICY.maxBytes, 8 * 1024 * 1024);
  assert.equal(CUSTOMIZATION_ARTWORK_POLICY.maxPixels, 25_000_000);
  assert.equal(
    artworkWithinPolicy({ bytes: 1000, width: 1200, height: 1200 }),
    true,
  );
  assert.equal(
    artworkWithinPolicy({ bytes: 1000, width: 6000, height: 6000 }),
    false,
  );
  assert.equal(
    artworkWithinPolicy({
      bytes: CUSTOMIZATION_ARTWORK_POLICY.maxBytes + 1,
      width: 1200,
      height: 1200,
    }),
    false,
  );
});

test("design asset lifecycle keeps originals immutable and derived files traceable", () => {
  assert.equal(canTransitionDesignAsset("draft", "generated"), true);
  assert.equal(canTransitionDesignAsset("approved", "draft"), false);
  const original = {
    id: "asset_orig_1234",
    role: "original" as const,
    state: "generated" as const,
    sha256: "a".repeat(64),
    mimeType: "image/png",
    bytes: 100,
    parentId: null,
    createdAt: new Date(0).toISOString(),
  };
  assert.deepEqual(validateDesignAssetRef(original), original);
  assert.throws(() =>
    validateDesignAssetRef({ ...original, role: "processed", parentId: null }),
  );
});

test("image provider contract declares capabilities before provider-specific calls", () => {
  const provider: ImageProcessingProvider = {
    id: "test-provider",
    execution: "browser",
    capabilities: ["quality-analysis", "background-removal"],
  };
  assert.equal(providerSupports(provider, "quality-analysis"), true);
  assert.equal(providerSupports(provider, "enhancement"), false);
});


test("local quality analysis reports exposure and resolution without claiming print readiness", () => {
  const bright = new Uint8Array(100).fill(240);
  const brightReport = analyzeQualitySample(10, 10, bright);
  assert.ok(brightReport.issues.includes("overexposed"));
  assert.ok(brightReport.issues.includes("low-resolution"));
  assert.equal(brightReport.suitableForProduction, null);
  assert.equal(brightReport.source, "local-heuristic");

  const varied = new Uint8Array(100);
  for (let i = 0; i < varied.length; i++) varied[i] = i % 2 ? 30 : 220;
  const variedReport = analyzeQualitySample(10, 10, varied);
  assert.equal(variedReport.issues.includes("low-contrast"), false);
});


test("legacy customization documents gain safe image-correction defaults", () => {
  const legacy = createDocument(p);
  const input = JSON.parse(JSON.stringify(legacy));
  delete input.image.adjustments;
  const checked = validateDocument(input, p);
  assert.deepEqual(checked.image.adjustments, {
    brightness: 1,
    contrast: 1,
    saturation: 1,
  });
});

test("image correction remains bounded and non-destructive", () => {
  const d = createDocument(p);
  const checked = validateDocument(
    {
      ...d,
      image: {
        ...d.image,
        adjustments: { brightness: 1.2, contrast: 0.9, saturation: 1.4 },
      },
    },
    p,
  );
  assert.equal(checked.image.adjustments.brightness, 1.2);
  assert.throws(() =>
    validateDocument(
      {
        ...d,
        image: {
          ...d.image,
          adjustments: { brightness: 3, contrast: 1, saturation: 1 },
        },
      },
      p,
    ),
  );
});
