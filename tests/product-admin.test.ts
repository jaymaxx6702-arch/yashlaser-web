import test from "node:test";
import assert from "node:assert/strict";
import {
  nextProductAdminRevision,
  slugifyAdminProduct,
  validateProductAdminDraft,
} from "../lib/product-admin";

const valid = {
  productKey: "yl-test-product",
  slug: "test-product",
  name: "Test Product",
  categoryId: "other",
  pricingMode: "fixed",
  currency: "INR",
  priceMinor: 10000,
  effectivePriceMinor: 9000,
  description: "Test",
  details: "",
  variants: [],
};

test("product admin validates a safe draft", () => {
  assert.equal(validateProductAdminDraft(valid).slug, "test-product");
});

test("product admin rejects unsafe slugs and duplicate variants", () => {
  assert.throws(() =>
    validateProductAdminDraft({ ...valid, slug: "../bad" }),
  );
  assert.throws(() =>
    validateProductAdminDraft({
      ...valid,
      variants: [
        { id: "a", name: "A", priceMinor: 100, effectivePriceMinor: 100, available: true },
        { id: "a", name: "B", priceMinor: 100, effectivePriceMinor: 100, available: true },
      ],
    }),
  );
});

test("product admin revision numbering is monotonic", () => {
  assert.equal(nextProductAdminRevision([]), 1);
  assert.equal(nextProductAdminRevision([{ revision: 2 }, { revision: 7 }]), 8);
});

test("product admin slugifier normalizes customer-facing names", () => {
  assert.equal(slugifyAdminProduct(" Premium Acrylic Award 10 x 4 "), "premium-acrylic-award-10-x-4");
});
