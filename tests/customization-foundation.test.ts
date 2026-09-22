import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import type { CustomizationProduct } from "../lib/customization";
import {
  customizationRuleFor,
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
