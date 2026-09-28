import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  bulkPersonalizationTemplateCsv,
  inspectBulkPersonalizationCsv,
} from "../lib/bulk-personalization";

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

test("storefront preserves real 404s while customer flows have scoped loading states", () => {
  assert.ok(!fs.existsSync("app/loading.tsx"));
  assert.ok(fs.existsSync("app/cart/loading.tsx"));
  assert.ok(fs.existsSync("app/checkout/loading.tsx"));
  assert.ok(fs.existsSync("app/account/loading.tsx"));
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


test("bulk personalisation supports same/different modes, CSV validation and filename matching", () => {
  const template = bulkPersonalizationTemplateCsv();
  assert.match(template, /record_id/);
  assert.match(template, /photo_filename/);

  const csv = [
    "record_id,name,line1,line2,photo_filename",
    "001,Asha,Winner,Annual Event,001.jpg",
    "002,Ravi,Runner-up,Annual Event,002.png",
  ].join("\n");
  const ok = inspectBulkPersonalizationCsv(csv, ["001.jpg", "002.png"]);
  assert.equal(ok.rows.length, 2);
  assert.equal(ok.issues.filter((issue) => issue.kind === "error").length, 0);
  assert.deepEqual(ok.matchedPhotoNames.sort(), ["001.jpg", "002.png"]);

  const missing = inspectBulkPersonalizationCsv(csv, ["001.jpg"]);
  assert.ok(
    missing.issues.some(
      (issue) =>
        issue.kind === "error" &&
        issue.message.includes('Missing uploaded photo "002.png"'),
    ),
  );

  const duplicateId = inspectBulkPersonalizationCsv(
    [
      "record_id,name,line1,line2,photo_filename",
      "001,Asha,Winner,Event,001.jpg",
      "001,Ravi,Runner-up,Event,002.png",
    ].join("\n"),
    ["001.jpg", "002.png"],
  );
  assert.ok(
    duplicateId.issues.some((issue) =>
      issue.message.includes("Duplicate record_id"),
    ),
  );

  const component = fs.readFileSync(
    "components/BulkPersonalizationBuilder.tsx",
    "utf8",
  );
  assert.match(component, /Same for all/);
  assert.match(component, /Different for each/);
  assert.match(component, /Download CSV template/);
  assert.match(component, /matched photos/);
});

test("bulk project attachments are private uploads with admin-only signed access", () => {
  const form = fs.readFileSync("components/ProjectRequestForm.tsx", "utf8");
  const admin = fs.readFileSync("app/admin/projects/page.tsx", "utf8");
  const route = fs.readFileSync(
    "app/api/admin/project-files/[id]/route.ts",
    "utf8",
  );

  assert.match(form, /BulkPersonalizationBuilder/);
  assert.match(form, /bulkFiles/);
  assert.match(form, /uploadPrivate/);
  assert.match(admin, /shop_project_files/);
  assert.match(admin, /\/api\/admin\/project-files\//);
  assert.match(route, /requireAdmin/);
  assert.match(route, /createSignedUrl/);
  assert.match(route, /customer-documents/);
});


test("private uploads remain signed, bounded and retry-safe", () => {
  const direct = fs.readFileSync("lib/direct-upload.ts", "utf8");
  const enquiry = fs.readFileSync(
    "app/api/enquiries/uploads/route.ts",
    "utf8",
  );
  const project = fs.readFileSync(
    "app/api/project-requests/[requestNo]/upload-session/route.ts",
    "utf8",
  );
  const adminFile = fs.readFileSync(
    "app/api/admin/project-files/[id]/route.ts",
    "utf8",
  );

  assert.match(direct, /x-upsert/);
  assert.match(direct, /response\.status === 409/);
  assert.match(direct, /AbortSignal\.timeout\(120000\)/);
  assert.match(enquiry, /createSignedUploadUrl/);
  assert.match(enquiry, /upsert: false/);
  assert.match(project, /20 \* 1024 \* 1024/);
  assert.match(project, /allowed\.has\(mimeType\)/);
  assert.match(adminFile, /requireAdmin/);
  assert.match(adminFile, /createSignedUrl/);
});


function walkRoutes(directory: string): string[] {
  const output: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const path = directory + "/" + entry.name;
    if (entry.isDirectory()) output.push(...walkRoutes(path));
    else if (entry.isFile() && entry.name === "route.ts") output.push(path);
  }
  return output;
}

test("API writes use bounded JSON readers instead of raw request.json", () => {
  for (const path of walkRoutes("app/api")) {
    const source = fs.readFileSync(path, "utf8");
    assert.doesNotMatch(
      source,
      /request\.json\s*\(/,
      path + " must use the shared bounded request-body reader.",
    );
  }
});

test("admin and Supabase privileged clients remain server-only and secrets stay non-public", () => {
  const admin = fs.readFileSync("lib/admin.ts", "utf8");
  const supabase = fs.readFileSync("lib/supabase.ts", "utf8");
  const config = fs.readFileSync("next.config.ts", "utf8");
  const proxy = fs.readFileSync("proxy.ts", "utf8");

  assert.match(admin, /import "server-only"/);
  assert.match(admin, /ADMIN_USER_IDS/);
  assert.match(admin, /auth\.getUser/);
  assert.match(supabase, /import "server-only"/);
  assert.match(supabase, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(supabase, /NEXT_PUBLIC_SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(supabase, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);

  assert.match(config, /X-Frame-Options/);
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /Cache-Control/);
  assert.match(config, /private, no-store/);
  assert.match(proxy, /Cross-site request blocked/);
  assert.match(proxy, /Origin mismatch/);
});


test("privileged admin mutations write to the private audit ledger", () => {
  const mutationFiles = [
    "app/admin/actions.ts",
    "app/admin/customization-rules/actions.ts",
    "app/admin/products/actions.ts",
    "app/api/admin/order-assets/production/route.ts",
    "app/api/admin/orders/[id]/shipment/route.ts",
    "app/api/admin/orders/[id]/yashflow-sync/route.ts",
    "app/api/admin/products/import-drafts/route.ts",
    "app/api/admin/projects/[id]/route.ts",
    "app/api/admin/proofs/route.ts",
    "app/api/admin/quotes/route.ts",
    "app/api/admin/reviews/[id]/route.ts",
    "app/api/admin/support/[id]/route.ts",
  ];

  for (const path of mutationFiles) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(
      source,
      /recordAdminAudit/,
      path + " must record privileged mutations.",
    );
  }

  const helper = fs.readFileSync("lib/admin-audit.ts", "utf8");
  const migration = fs.readFileSync(
    "supabase/migrations/202609281730_admin_audit_events.sql",
    "utf8",
  );
  const page = fs.readFileSync("app/admin/audit/page.tsx", "utf8");
  const nav = fs.readFileSync("components/AdminNav.tsx", "utf8");

  assert.match(helper, /import "server-only"/);
  assert.match(helper, /shop_admin_audit_events/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all/);
  assert.match(migration, /service_role/);
  assert.match(page, /requireAdmin/);
  assert.match(page, /shop_admin_audit_events/);
  assert.match(nav, /\/admin\/audit/);
});
