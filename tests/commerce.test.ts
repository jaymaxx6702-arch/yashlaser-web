import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { supportedLanguages, uiCopy } from "../lib/i18n";
import { languageAlternates } from "../lib/seo";
import {
  RequestBodyError,
  readJsonBody,
} from "../lib/request-security";
import { categories, products } from "../data/catalog";

test("all supported UI languages expose the same copy keys", () => {
  const englishKeys = Object.keys(uiCopy.en).sort();

  for (const lang of supportedLanguages) {
    assert.deepEqual(
      Object.keys(uiCopy[lang]).sort(),
      englishKeys,
      "missing translated UI key for " + lang,
    );
  }
});

test("SEO language alternates point to the canonical shop host", () => {
  const alternates = languageAlternates("/products/sample");
  assert.equal(
    alternates.en,
    "https://shop.yashlaser.in/products/sample",
  );
  assert.equal(
    alternates.gu,
    "https://shop.yashlaser.in/gu/products/sample",
  );
  assert.equal(
    alternates.hi,
    "https://shop.yashlaser.in/hi/products/sample",
  );
  assert.equal(
    alternates.mr,
    "https://shop.yashlaser.in/mr/products/sample",
  );
  assert.equal(alternates["x-default"], alternates.en);
});

test("JSON body guard accepts valid JSON and rejects malformed or oversized input", async () => {
  const request = new Request("https://shop.yashlaser.in/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true }),
  });
  assert.deepEqual(await readJsonBody(request, 1024), { ok: true });

  const invalid = new Request("https://shop.yashlaser.in/api/test", {
    method: "POST",
    body: "{broken",
  });
  await assert.rejects(
    () => readJsonBody(invalid, 1024),
    (error: unknown) =>
      error instanceof RequestBodyError && error.status === 400,
  );

  const oversized = new Request("https://shop.yashlaser.in/api/test", {
    method: "POST",
    body: "x".repeat(1025),
  });
  await assert.rejects(
    () => readJsonBody(oversized, 1024),
    (error: unknown) =>
      error instanceof RequestBodyError && error.status === 413,
  );
});

test("catalogue identifiers remain unique and commerce quantities cannot rely on duplicate product IDs", () => {
  assert.equal(
    new Set(products.map((product) => product.id)).size,
    products.length,
  );
  assert.equal(
    new Set(products.map((product) => product.slug)).size,
    products.length,
  );
  assert.equal(
    new Set(categories.map((category) => category.id)).size,
    categories.length,
  );
});

test("rollout-sensitive feature flags default to disabled in the environment template", () => {
  const env = fs.readFileSync(".env.example", "utf8");
  for (const flag of [
    "COMMERCE_ORDERS_ENABLED",
    "PAYMENTS_ENABLED",
    "YASHFLOW_SYNC_ENABLED",
    "PROJECT_REQUESTS_ENABLED",
    "SUPPORT_ENABLED",
    "REVIEWS_ENABLED",
    "ANALYTICS_ENABLED",
    "RATE_LIMITS_ENABLED",
  ]) {
    assert.match(env, new RegExp("^" + flag + "=false$", "m"));
  }
});
