import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import type { CustomizationProduct } from "../lib/customization";
import { customizationSeeds } from "../data/customization-seeds";
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
import {
  assertAiOperationAllowed,
  runAiOperation,
  supportsAiCapability,
  validateAiProviderPolicy,
} from "../lib/customization/ai-provider";
import {
  categoryCustomizationDefinitions,
  getCustomizationDefinition,
  legacyTextFields,
  requiredArtworkField,
  validateCustomizationDefinition,
  isFieldVisible,
  validateFieldValues,
} from "../lib/customization/contract";
const products = JSON.parse(
  fs.readFileSync("data/generated/products.json", "utf8"),
) as CustomizationProduct[];
const p = products.find(
  (p) => p.categoryId === "standees" && p.variants.length > 1,
)!;
test("universal customization definitions are valid and preserve v1 legacy slots", () => {
  for (const [categoryId, definition] of Object.entries(
    categoryCustomizationDefinitions,
  )) {
    assert.deepEqual(validateCustomizationDefinition(definition), definition);
    assert.equal(definition.categoryId, categoryId);
    assert.ok(definition.templates.length > 0);
    assert.ok(definition.quantity.min >= 1);
    assert.ok(definition.quantity.max <= 10000);
    const [first, second] = legacyTextFields(definition);
    assert.equal(first?.legacySlot, "text-1");
    assert.equal(second?.legacySlot, "text-2");
  }

  const standee = getCustomizationDefinition(p);
  assert.equal(standee.categoryId, "standees");
  assert.equal(requiredArtworkField(standee)?.kind, "photo");
  assert.equal(requiredArtworkField(standee)?.required, true);
});

test("field visibility rules are deterministic and rule types include future inputs", () => {
  const conditional = validateCustomizationDefinition({
    version: 1,
    categoryId: "other",
    templates: ["keepsake"],
    quantity: { min: 1, max: 100 },
    fields: [
      {
        id: "mode",
        kind: "choice",
        label: "Mode",
        required: true,
        choices: ["text", "qr"],
      },
      {
        id: "qr-value",
        kind: "qr",
        label: "QR value",
        required: false,
        maxLength: 500,
        visibility: [{ fieldId: "mode", operator: "equals", value: "qr" }],
      },
      {
        id: "event-date",
        kind: "date",
        label: "Event date",
        required: false,
      },
      {
        id: "person-name",
        kind: "name",
        label: "Name",
        required: false,
        maxLength: 120,
      },
      {
        id: "brand-logo",
        kind: "logo",
        label: "Logo",
        required: false,
        allowedMimeTypes: ["image/png", "image/webp"],
      },
    ],
  });
  const qr = conditional.fields.find((field) => field.id === "qr-value")!;
  assert.equal(isFieldVisible(qr, { mode: "text" }), false);
  assert.equal(isFieldVisible(qr, { mode: "qr" }), true);
  assert.deepEqual(
    conditional.fields.map((field) => field.kind),
    ["choice", "qr", "date", "name", "logo"],
  );
});

test("rule-driven field values validate, persist and remain backward compatible", () => {
  const dynamic = validateCustomizationDefinition({
    version: 1,
    categoryId: "other",
    templates: ["keepsake"],
    quantity: { min: 1, max: 20 },
    fields: [
      {
        id: "mode",
        kind: "choice",
        label: "Mode",
        required: true,
        choices: ["text", "qr"],
      },
      {
        id: "qr-value",
        kind: "qr",
        label: "QR value",
        required: true,
        maxLength: 500,
        visibility: [{ fieldId: "mode", operator: "equals", value: "qr" }],
      },
      {
        id: "event-date",
        kind: "date",
        label: "Event date",
        required: false,
      },
      {
        id: "brand-color",
        kind: "color",
        label: "Brand colour",
        required: false,
      },
    ],
  });

  assert.deepEqual(
    validateFieldValues(dynamic, {
      mode: "qr",
      "qr-value": "https://yashlaser.in",
      "event-date": "2026-09-26",
      "brand-color": "#112233",
    }),
    {
      mode: "qr",
      "qr-value": "https://yashlaser.in",
      "event-date": "2026-09-26",
      "brand-color": "#112233",
    },
  );
  assert.throws(() =>
    validateFieldValues(dynamic, { mode: "qr" }, { requireRequired: true }),
  );
  assert.deepEqual(
    validateFieldValues(
      dynamic,
      { mode: "text" },
      { requireRequired: true },
    ),
    { mode: "text" },
  );
  assert.throws(() =>
    validateFieldValues(dynamic, { mode: "text", unknown: "x" }),
  );
  assert.throws(() =>
    validateFieldValues(dynamic, { mode: "qr", "qr-value": "x".repeat(501) }),
  );
  assert.throws(() =>
    validateFieldValues(dynamic, { mode: "text", "event-date": "26/09/2026" }),
  );
  assert.throws(() =>
    validateFieldValues(dynamic, { mode: "text", "brand-color": "red" }),
  );

  const current = createDocument(p);
  assert.deepEqual(current.fieldValues, {});
  const legacy = JSON.parse(JSON.stringify(current));
  delete legacy.fieldValues;
  assert.deepEqual(validateDocument(legacy, p).fieldValues, {});
});

test("field-rule contract rejects duplicate ids, slots and invalid dependencies", () => {
  const base = categoryCustomizationDefinitions.standees;
  assert.throws(() =>
    validateCustomizationDefinition({
      ...base,
      fields: [...base.fields, { ...base.fields[1] }],
    }),
  );
  assert.throws(() =>
    validateCustomizationDefinition({
      ...base,
      fields: [
        ...base.fields,
        {
          id: "third-line",
          kind: "text",
          label: "Third line",
          required: false,
          legacySlot: "text-1",
          maxLength: 80,
        },
      ],
    }),
  );
  assert.throws(() =>
    validateCustomizationDefinition({
      ...base,
      fields: base.fields.map((field, index) =>
        index === 1
          ? {
              ...field,
              visibility: [
                {
                  fieldId: "missing-field",
                  operator: "present" as const,
                },
              ],
            }
          : field,
      ),
    }),
  );
});

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


test("AI provider policy is vendor-neutral and enforces privacy, limits and capabilities", async () => {
  const policy = validateAiProviderPolicy({
    id: "self-hosted-test",
    model: "test-model",
    execution: "server",
    hosting: "first-party",
    capabilities: ["background-removal", "enhancement"],
    consentRequired: true,
    retention: { mode: "ephemeral", maxHours: 1 },
    maxInputBytes: 8 * 1024 * 1024,
    timeoutMs: 5000,
    retries: 1,
    estimatedCostMinor: 0,
  });

  assert.equal(supportsAiCapability(policy, "background-removal"), true);
  assert.equal(supportsAiCapability(policy, "smart-crop"), false);
  assert.doesNotThrow(() =>
    assertAiOperationAllowed(policy, "background-removal", {
      bytes: 1024,
      consent: true,
    }),
  );
  assert.throws(() =>
    assertAiOperationAllowed(policy, "background-removal", {
      bytes: 1024,
      consent: false,
    }),
  );
  assert.throws(() =>
    assertAiOperationAllowed(policy, "smart-crop", {
      bytes: 1024,
      consent: true,
    }),
  );
  assert.throws(() =>
    assertAiOperationAllowed(policy, "enhancement", {
      bytes: 9 * 1024 * 1024,
      consent: true,
    }),
  );

  let attempts = 0;
  const result = await runAiOperation(policy, async () => {
    attempts++;
    if (attempts === 1) throw new Error("retry");
    return "ok";
  });
  assert.equal(result, "ok");
  assert.equal(attempts, 2);

  assert.throws(() =>
    validateAiProviderPolicy({
      ...policy,
      capabilities: ["background-removal", "background-removal"],
    }),
  );
  assert.throws(() =>
    validateAiProviderPolicy({
      ...policy,
      retention: { mode: "ephemeral", maxHours: 0 },
    }),
  );
});


test("customization editor renders controls from the shared rule contract", () => {
  const editor = fs.readFileSync(
    "components/customization/CustomizationEditor.tsx",
    "utf8",
  );
  const field = fs.readFileSync(
    "components/customization/RuleField.tsx",
    "utf8",
  );

  assert.match(editor, /getCustomizationDefinition\(product\)/);
  assert.match(editor, /definition\.quantity\.min/);
  assert.match(editor, /definition\.quantity\.max/);
  assert.match(editor, /artworkRule\.allowedMimeTypes/);
  assert.match(editor, /artworkRule\.required/);
  assert.match(editor, /isFieldVisible\(field, doc\.fieldValues\)/);
  assert.match(editor, /doc\.fieldValues\[field\.id\]/);
  assert.doesNotMatch(editor, /fieldLabels\[product\.categoryId\]/);

  assert.match(field, /field\.kind === "choice"/);
  assert.match(field, /field\.kind === "number"/);
  assert.match(field, /field\.kind === "date"/);
  assert.match(field, /field\.kind === "color"/);
  assert.match(field, /field\.kind === "qr"/);
  assert.match(field, /field\.required/);
  assert.match(field, /field\.maxLength/);
});


test("three customization pilot products stay aligned with the generated catalogue and manual review exclusions", () => {
  const raw = JSON.parse(
    fs.readFileSync("data/generated/products.json", "utf8"),
  ) as Array<Record<string, unknown>>;
  const manual = JSON.parse(
    fs.readFileSync("migration/reports/manual-review.json", "utf8"),
  ) as Array<{ id: string }>;
  const flagged = new Set(manual.map((item) => item.id));

  for (const seed of customizationSeeds) {
    assert.equal(flagged.has(seed.id), false, seed.id + " must not be manually flagged");
    const product = raw.find((item) => item.id === seed.id);
    assert.ok(product, "missing seed product " + seed.id);
    assert.equal(product.slug, seed.slug);
    assert.equal(product.name, seed.name);
    assert.equal(product.categoryId, seed.categoryId);
    assert.equal(product.subcategoryId, seed.subcategoryId);
    assert.equal(product.pricingMode, seed.pricingMode);

    const variants = Array.isArray(product.variants)
      ? (product.variants as Array<Record<string, unknown>>)
      : [];
    assert.deepEqual(
      variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        available: variant.available,
        effectivePriceMinor: variant.effectivePriceMinor,
      })),
      seed.variants,
    );
  }
});


test("admin customization rule storage is versioned, private and contract validated", () => {
  const migration = fs.readFileSync(
    "supabase/migrations/202609261600_customization_rules.sql",
    "utf8",
  );
  const actions = fs.readFileSync(
    "app/admin/customization-rules/actions.ts",
    "utf8",
  );
  const page = fs.readFileSync(
    "app/admin/customization-rules/page.tsx",
    "utf8",
  );

  assert.match(migration, /shop_customization_rules/);
  assert.match(migration, /unique \(product_id, revision\)/);
  assert.match(migration, /where status = 'published'/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all .* anon, authenticated/);
  assert.match(migration, /grant all .* service_role/);

  assert.match(actions, /requireAdmin\(\)/);
  assert.match(actions, /validateCustomizationDefinition\(parsed\)/);
  assert.match(actions, /nextCustomizationRuleRevision/);
  assert.match(actions, /status: "archived"/);
  assert.match(actions, /status: "published"/);
  assert.match(page, /Save draft revision/);
  assert.match(page, /Publish this revision/);
});
