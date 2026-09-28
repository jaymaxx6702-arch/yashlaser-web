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


test("project request flows provide secure create, file, tracking and admin follow-up foundations", () => {
  const form = fs.readFileSync("components/ProjectRequestForm.tsx", "utf8");
  const status = fs.readFileSync(
    "components/ProjectRequestStatusClient.tsx",
    "utf8",
  );
  const api = fs.readFileSync("app/api/project-requests/route.ts", "utf8");
  const upload = fs.readFileSync(
    "app/api/project-requests/[requestNo]/upload-session/route.ts",
    "utf8",
  );
  const files = fs.readFileSync(
    "app/api/project-requests/[requestNo]/files/route.ts",
    "utf8",
  );
  const admin = fs.readFileSync(
    "app/api/admin/projects/[id]/route.ts",
    "utf8",
  );

  assert.match(form, /requestNo/);
  assert.match(form, /project-request-status/);
  assert.match(form, /upload-session/);
  assert.match(status, /customerMessage/);
  assert.match(api, /PROJECT_REQUESTS_ENABLED/);
  assert.match(api, /newAccessToken/);
  assert.match(upload, /createSignedUploadUrl/);
  assert.match(files, /shop_project_files/);
  assert.match(admin, /customer_message/);
  assert.match(admin, /readJsonBody/);
});

test("reviews support moderation, verified badge and secure customer tracking", () => {
  const reviews = fs.readFileSync("components/ReviewsClient.tsx", "utf8");
  const moderation = fs.readFileSync(
    "components/ReviewModeration.tsx",
    "utf8",
  );
  const reviewApi = fs.readFileSync(
    "app/api/admin/reviews/[id]/route.ts",
    "utf8",
  );
  const support = fs.readFileSync("components/SupportForm.tsx", "utf8");
  const supportTrack = fs.readFileSync(
    "components/SupportTicketClient.tsx",
    "utf8",
  );
  const supportAdmin = fs.readFileSync(
    "app/api/admin/support/[id]/route.ts",
    "utf8",
  );

  assert.match(reviews, /Verified purchase/);
  assert.match(moderation, /Verified purchase badge/);
  assert.match(reviewApi, /verified_purchase/);
  assert.match(reviewApi, /readJsonBody/);
  assert.match(support, /secure order tracking link/);
  assert.match(supportTrack, /adminResponse/);
  assert.match(supportAdmin, /admin_response/);
  assert.match(supportAdmin, /readJsonBody/);
});


test("customer account claim and history foundations are secure and refresh after claim", () => {
  const claimRoute = fs.readFileSync(
    "app/api/account/claim-order/route.ts",
    "utf8",
  );
  const claimForm = fs.readFileSync(
    "components/ClaimOrderForm.tsx",
    "utf8",
  );
  const account = fs.readFileSync("app/account/page.tsx", "utf8");
  const detail = fs.readFileSync(
    "app/account/orders/[id]/page.tsx",
    "utf8",
  );

  assert.match(claimRoute, /customerUser/);
  assert.match(claimRoute, /trackCommerceOrder/);
  assert.match(claimRoute, /already linked to another account/);
  assert.match(claimRoute, /consumeShopRateLimit/);
  assert.match(claimForm, /router\.refresh\(\)/);
  assert.match(account, /customer_user_id/);
  assert.match(detail, /customer_user_id/);
  assert.match(detail, /createSignedUrl/);
  assert.match(detail, /shop_shipments/);
  assert.match(detail, /shop_order_events/);
});
