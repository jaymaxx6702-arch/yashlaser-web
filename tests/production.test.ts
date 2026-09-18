import test from "node:test";
import assert from "node:assert/strict";
import { enquiryPayloadFits, MAX_ENQUIRY_BYTES } from "../lib/enquiry-limits";
import { business } from "../data/business";
import {
  signTicket,
  verifyTicket,
  type UploadTicket,
} from "../lib/upload-ticket";
test("metadata JSON fits well below Vercel limit, including UTF-8 byte counting", () => {
  assert.equal(MAX_ENQUIRY_BYTES, 32768);
  assert.equal(enquiryPayloadFits("x".repeat(32768)), true);
  assert.equal(enquiryPayloadFits("x".repeat(32769)), false);
  assert.equal(enquiryPayloadFits("અ".repeat(12000)), false);
});
const folder =
  "incoming/12345678-1234-4234-8234-123456789012/12345678-1234-4234-8234-123456789013";
const ticket: UploadTicket = {
  version: 1,
  requestId: "12345678-1234-4234-8234-123456789012",
  payloadHash: "a".repeat(64),
  artworkPath: folder + "/artwork.jpg",
  previewPath: folder + "/preview.png",
  previewBytes: 1000,
  previewHash: "b".repeat(64),
  expiresAt: 2000,
};
test("upload receipt binds immutable paths and cannot be forged, expired or re-signed with another secret", () => {
  const signed = signTicket(ticket, "test-only-secret");
  assert.deepEqual(verifyTicket(signed, "test-only-secret", 1000), ticket);
  assert.throws(() => verifyTicket(signed, "other-secret", 1000));
  assert.throws(() => verifyTicket(signed, "test-only-secret", 2000));
  assert.throws(() => verifyTicket(signed + "x", "test-only-secret", 1000));
  assert.throws(() =>
    verifyTicket(
      signTicket(
        { ...ticket, artworkPath: "../../private.png" },
        "test-only-secret",
      ),
      "test-only-secret",
      1000,
    ),
  );
});
test("customer links target the shop domain", () =>
  assert.equal(business.url, "https://shop.yashlaser.in"));
