import test from "node:test";
import assert from "node:assert/strict";
import {
  signDesignHandoff,
  verifyDesignHandoff,
} from "../lib/design-handoff";

const key = "test-secret-key";

test("design handoff signs and verifies immutable enquiry ownership", () => {
  const token = signDesignHandoff(
    {
      version: 1,
      enquiryItemId: "11111111-1111-4111-8111-111111111111",
      designId: "0123456789abcdef",
      productId: "yl-test-product",
      expiresAt: 2_000_000,
    },
    key,
  );
  const ticket = verifyDesignHandoff(token, key, 1_000_000);
  assert.equal(ticket.designId, "0123456789abcdef");
  assert.equal(ticket.productId, "yl-test-product");
});

test("design handoff rejects tampering, wrong keys and expiry", () => {
  const token = signDesignHandoff(
    {
      version: 1,
      enquiryItemId: "11111111-1111-4111-8111-111111111111",
      designId: "0123456789abcdef",
      productId: "yl-test-product",
      expiresAt: 2_000_000,
    },
    key,
  );

  assert.throws(() => verifyDesignHandoff(token + "x", key, 1_000_000));
  assert.throws(() => verifyDesignHandoff(token, "wrong-key", 1_000_000));
  assert.throws(() => verifyDesignHandoff(token, key, 3_000_000));
});
