import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import type { CustomizationProduct } from "../lib/customization";
import {
  customizationRuleFor,
  parseCustomizationRule,
  validateCustomizationRule,
} from "../lib/customization/rules";
import { categoryTemplates } from "../lib/customization/model";
import { backgroundRemovalAdapterFromAi } from "../lib/customization/background-removal";
import {
  assertAssetTransition,
  canTransitionAsset,
  validateDesignAssetVersion,
} from "../lib/customization/assets";
import {
  assertAiProviderAllowed,
  defaultAiProcessingPolicy,
  providerSupports,
} from "../lib/customization/ai";
import {
  analyzePixelBuffer,
  assessImageQuality,
  printPpiForSize,
} from "../lib/customization/quality";

const products = JSON.parse(
  fs.readFileSync("data/generated/products.json", "utf8"),
) as CustomizationProduct[];

test("every catalogue category resolves to a reusable validated customization rule", () => {
  const seen = new Set<string>();
  for (const product of products) {
    const rule = validateCustomizationRule(customizationRuleFor(product));
    assert.equal(rule.categoryId, product.categoryId);
    assert.ok(rule.templateIds.length > 0);
    assert.ok(rule.quantity.min >= 1);
    assert.ok(rule.quantity.max >= rule.quantity.min);
    seen.add(rule.categoryId);
  }
  assert.deepEqual(
    [...seen].sort(),
    ["awards", "id-cards", "keychains", "name-plates", "other", "standees"],
  );
});

test("photo standee pilot requires artwork and enables reusable AI photo capabilities", () => {
  const standee = products.find((product) => product.categoryId === "standees");
  assert.ok(standee);
  const rule = customizationRuleFor(standee);
  assert.equal(rule.image.required, true);
  assert.equal(rule.image.allowPhoto, true);
  assert.equal(rule.image.allowBackgroundRemoval, true);
  assert.equal(rule.image.allowEnhancement, true);
  assert.ok(rule.image.minRecommendedWidth >= 1000);
  assert.ok(rule.image.minRecommendedHeight >= 1000);
});

test("customization field rule IDs are unique and invalid rule definitions are rejected", () => {
  const product = products[0];
  assert.ok(product);
  const rule = customizationRuleFor(product);
  assert.doesNotThrow(() => validateCustomizationRule(rule));
  assert.throws(() =>
    validateCustomizationRule({
      ...rule,
      fields: [
        { id: "dup", kind: "text", label: "One", required: false, maxLength: 20 },
        { id: "dup", kind: "text", label: "Two", required: false, maxLength: 20 },
      ],
    }),
  );
});

test("design assets follow an immutable original-to-production lifecycle", () => {
  assert.equal(canTransitionAsset("original", "processed"), true);
  assert.equal(canTransitionAsset("processed", "preview"), true);
  assert.equal(canTransitionAsset("preview", "proof"), true);
  assert.equal(canTransitionAsset("proof", "production"), true);
  assert.equal(canTransitionAsset("production", "preview"), false);
  assert.throws(() => assertAssetTransition("production", "processed"));

  const original = {
    id: "source-1",
    stage: "original" as const,
    sourceId: null,
    mimeType: "image/png",
    bytes: 100,
    sha256: "a".repeat(64),
    width: 1200,
    height: 1200,
    createdAt: new Date(0).toISOString(),
    approvedAt: null,
    locked: false,
  };
  assert.deepEqual(validateDesignAssetVersion(original), original);

  assert.throws(() =>
    validateDesignAssetVersion({
      ...original,
      id: "production-1",
      stage: "production",
      sourceId: "proof-1",
    }),
  );

  const production = {
    ...original,
    id: "production-1",
    stage: "production" as const,
    sourceId: "proof-1",
    approvedAt: new Date(1).toISOString(),
    locked: true,
  };
  assert.deepEqual(validateDesignAssetVersion(production), production);
});

test("AI providers are capability-driven and remote customer media is privacy-gated", () => {
  const browserProvider = {
    id: "browser-test",
    execution: "browser" as const,
    capabilities: ["quality-analysis", "background-removal"] as const,
    sendsCustomerMediaOffDevice: false,
  };
  assert.equal(providerSupports(browserProvider, "background-removal"), true);
  assert.doesNotThrow(() =>
    assertAiProviderAllowed(browserProvider, defaultAiProcessingPolicy),
  );

  const remoteProvider = {
    ...browserProvider,
    id: "remote-test",
    execution: "server" as const,
    sendsCustomerMediaOffDevice: true,
  };
  assert.throws(() =>
    assertAiProviderAllowed(remoteProvider, defaultAiProcessingPolicy),
  );
  assert.doesNotThrow(() =>
    assertAiProviderAllowed(remoteProvider, {
      ...defaultAiProcessingPolicy,
      allowRemoteMediaProcessing: true,
    }),
  );
});


test("legacy template allowlists stay aligned with the shared rule contract", () => {
  for (const product of products) {
    const rule = customizationRuleFor(product);
    assert.deepEqual(rule.templateIds, categoryTemplates[product.categoryId]);
  }
});

test("generic AI media adapters bridge into the existing background-removal UI contract", async () => {
  const ai = {
    descriptor: {
      id: "bridge-test",
      execution: "browser" as const,
      capabilities: ["background-removal"] as const,
      sendsCustomerMediaOffDevice: false,
    },
    removeBackground: async () =>
      new Blob(["transparent"], { type: "image/png" }),
  };
  const bridge = backgroundRemovalAdapterFromAi(ai);
  assert.ok(bridge);
  assert.equal(bridge.id, "bridge-test");
  assert.equal(bridge.execution, "browser");
  const result = await bridge.removeBackground(new Blob(["source"]), {
    signal: new AbortController().signal,
  });
  assert.equal(result.type, "image/png");
});


test("quality assessment gives actionable warnings without blocking customer preview", () => {
  const standee = products.find((product) => product.categoryId === "standees");
  assert.ok(standee);
  const rule = customizationRuleFor(standee);
  const assessment = assessImageQuality(
    {
      width: 700,
      height: 900,
      blurScore: 0.8,
      exposure: "low",
      contrastScore: 0.1,
      subjectCount: 2,
      faceCount: 2,
    },
    rule,
  );
  assert.equal(assessment.acceptableForPreview, true);
  assert.ok(assessment.issues.some((issue) => issue.code === "resolution-low"));
  assert.ok(assessment.issues.some((issue) => issue.code === "blur-risk"));
  assert.ok(assessment.issues.some((issue) => issue.code === "underexposed"));
  assert.ok(assessment.issues.some((issue) => issue.code === "contrast-low"));
  assert.ok(assessment.issues.some((issue) => issue.code === "multiple-subjects"));
});

test("print PPI calculation is deterministic once physical size is verified", () => {
  assert.equal(printPpiForSize(3000, 3000, 254, 254), 300);
  assert.throws(() => printPpiForSize(0, 3000, 254, 254));
});


test("design asset migration is additive, private and enforces immutable production state", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/202609220015_design_assets.sql",
    "utf8",
  ).toLowerCase();
  assert.match(sql, /create table if not exists public\.shop_design_assets/);
  assert.match(sql, /stage in \('original','processed','preview','proof','production'\)/);
  assert.match(sql, /source_asset_id uuid references public\.shop_design_assets/);
  assert.match(sql, /stage <> 'production'/);
  assert.match(sql, /approved_at is not null and locked = true/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public\.shop_design_assets from anon, authenticated/);
});


test("admin-facing rule parser accepts safe rule JSON and rejects unsafe or incompatible input", () => {
  const standee = products.find((product) => product.categoryId === "standees");
  assert.ok(standee);
  const rule = customizationRuleFor(standee);
  assert.deepEqual(parseCustomizationRule(JSON.parse(JSON.stringify(rule))), rule);
  assert.throws(() =>
    parseCustomizationRule({
      ...rule,
      templateIds: ["name-plate"],
    }),
  );
  assert.throws(() =>
    parseCustomizationRule({
      ...rule,
      quantity: { min: 1, max: 10001 },
    }),
  );
  assert.throws(() =>
    parseCustomizationRule({
      ...rule,
      fields: [
        {
          id: "html",
          kind: "script",
          label: "Unsafe",
          required: false,
        },
      ],
    }),
  );
});


test("AI image runner applies privacy, capability, retry and output validation centrally", async () => {
  const { runAiImageOperation } = await import("../lib/customization/ai-runner");
  let calls = 0;
  const adapter = {
    descriptor: {
      id: "runner-test",
      execution: "browser" as const,
      capabilities: ["background-removal", "enhancement"] as const,
      sendsCustomerMediaOffDevice: false,
    },
    removeBackground: async () => {
      calls++;
      if (calls === 1) throw new Error("temporary failure");
      return new Blob(["transparent"], { type: "image/png" });
    },
    enhance: async () => new Blob(["enhanced"], { type: "image/webp" }),
  };
  const result = await runAiImageOperation(
    adapter,
    "background-removal",
    new Blob(["source"], { type: "image/jpeg" }),
    {
      policy: {
        ...defaultAiProcessingPolicy,
        maxAttempts: 2,
        timeoutMs: 1000,
      },
    },
  );
  assert.equal(result.attempt, 2);
  assert.equal(result.output.type, "image/png");
  assert.equal(result.providerId, "runner-test");
});


test("local pixel analysis produces bounded blur/exposure/contrast signals without uploading media", () => {
  const width = 8;
  const height = 8;
  const flatDark = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < flatDark.length; i += 4) {
    flatDark[i] = 20;
    flatDark[i + 1] = 20;
    flatDark[i + 2] = 20;
    flatDark[i + 3] = 255;
  }
  const dark = analyzePixelBuffer(flatDark, width, height);
  assert.equal(dark.exposure, "low");
  assert.ok((dark.blurScore ?? 0) >= 0 && (dark.blurScore ?? 0) <= 1);
  assert.ok((dark.contrastScore ?? 0) >= 0 && (dark.contrastScore ?? 0) <= 1);

  const checker = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const value = (x + y) % 2 ? 255 : 0;
      checker[i] = value;
      checker[i + 1] = value;
      checker[i + 2] = value;
      checker[i + 3] = 255;
    }
  const sharp = analyzePixelBuffer(checker, width, height);
  assert.equal(sharp.exposure, "ok");
  assert.ok((sharp.blurScore ?? 1) < (dark.blurScore ?? 0));
  assert.ok((sharp.contrastScore ?? 0) > (dark.contrastScore ?? 0));
});
