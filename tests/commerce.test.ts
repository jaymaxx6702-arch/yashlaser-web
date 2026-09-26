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
import {
  assertOrderAssetTransition,
  assertOrderAssetVersion,
  canTransitionOrderAsset,
  isOrderAssetKind,
  isOrderAssetState,
} from "../lib/order-assets";

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

test("environment template is parseable and rollout-sensitive flags default disabled", () => {
  const env = fs.readFileSync(".env.example", "utf8");
  assert.doesNotMatch(env, /\\n/);
  assert.match(env, /^NEXT_PUBLIC_SUPABASE_URL=$/m);
  assert.match(env, /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$/m);
  for (const flag of [
    "COMMERCE_ORDERS_ENABLED",
    "PAYMENTS_ENABLED",
    "YASHFLOW_SYNC_ENABLED",
    "PROJECT_REQUESTS_ENABLED",
    "SUPPORT_ENABLED",
    "REVIEWS_ENABLED",
    "ANALYTICS_ENABLED",
    "RATE_LIMITS_ENABLED",
    "CUSTOMER_ACCOUNTS_ENABLED",
  ]) {
    assert.match(env, new RegExp("^" + flag + "=false$", "m"));
  }
});


test("customer-facing write APIs retain persisted request rate limiting", () => {
  const directRoutes = [
    "app/api/account/claim-order/route.ts",
    "app/api/analytics/route.ts",
    "app/api/cart/validate/route.ts",
    "app/api/checkout/route.ts",
    "app/api/orders/track/route.ts",
    "app/api/payments/create/route.ts",
    "app/api/project-requests/route.ts",
    "app/api/project-requests/[requestNo]/route.ts",
    "app/api/project-requests/[requestNo]/upload-session/route.ts",
    "app/api/project-requests/[requestNo]/files/route.ts",
    "app/api/proofs/[token]/approve/route.ts",
    "app/api/proofs/[token]/request-changes/route.ts",
    "app/api/quotes/[token]/accept/route.ts",
    "app/api/reviews/route.ts",
    "app/api/shipping/check/route.ts",
    "app/api/support/route.ts",
    "app/api/support/[ticketNo]/route.ts",
  ];

  for (const path of directRoutes) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(
      source,
      /consumeRequestRateLimit/,
      path + " must retain endpoint request rate limiting",
    );
  }

  for (const path of [
    "app/api/enquiries/route.ts",
    "app/api/enquiries/uploads/route.ts",
  ]) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(source, /enquiryJson\(request\)/);
  }

  const enquiryServer = fs.readFileSync("lib/enquiry-server.ts", "utf8");
  assert.match(
    enquiryServer,
    /consumeRequestRateLimit\(request, "enquiry_ip"/,
  );

  const migration = fs.readFileSync(
    "supabase/migrations/202609190010_rate_limits.sql",
    "utf8",
  );
  assert.match(migration, /consume_shop_rate_limit/);
  assert.match(migration, /pg_advisory_xact_lock/);
});


test("analytics covers the planned storefront conversion events without customer PII", () => {
  const api = fs.readFileSync("app/api/analytics/route.ts", "utf8");
  for (const eventName of [
    "page_view",
    "search",
    "product_view",
    "add_to_cart",
    "begin_checkout",
    "checkout_complete",
  ]) {
    assert.match(api, new RegExp('"' + eventName + '"'));
  }

  const analytics = fs.readFileSync("components/Analytics.tsx", "utf8");
  assert.match(analytics, /eventName: "page_view"/);
  assert.match(analytics, /eventName: "search"/);
  assert.match(analytics, /eventName: "product_view"/);

  const cart = fs.readFileSync("lib/cart.ts", "utf8");
  assert.match(cart, /eventName: "add_to_cart"/);

  const productOptions = fs.readFileSync("components/ProductOptions.tsx", "utf8");
  assert.doesNotMatch(productOptions, /eventName: "add_to_cart"/);

  const customization = fs.readFileSync("components/CustomizationForm.tsx", "utf8");
  assert.doesNotMatch(customization, /eventName: "add_to_cart"/);

  const checkout = fs.readFileSync("components/CheckoutClient.tsx", "utf8");
  assert.match(checkout, /eventName: "begin_checkout"/);
  assert.match(checkout, /eventName: "checkout_complete"/);

  const migration = fs.readFileSync(
    "supabase/migrations/202609200012_analytics_checkout_complete.sql",
    "utf8",
  );
  assert.match(migration, /checkout_complete/);

  for (const source of [api, analytics, cart, checkout]) {
    assert.doesNotMatch(source, /metadata:\s*\{[^}]*phone/i);
    assert.doesNotMatch(source, /metadata:\s*\{[^}]*email/i);
  }
});


test("support workflow links verified orders and exposes secure admin responses", () => {
  const createRoute = fs.readFileSync("app/api/support/route.ts", "utf8");
  assert.match(createRoute, /orderNo/);
  assert.match(createRoute, /orderToken/);
  assert.match(createRoute, /access_token_hash/);
  assert.match(createRoute, /order_id: orderId/);

  const customerRoute = fs.readFileSync(
    "app/api/support/[ticketNo]/route.ts",
    "utf8",
  );
  assert.match(customerRoute, /tokenHash\(token\)/);
  assert.match(customerRoute, /admin_response/);
  assert.match(customerRoute, /Cache-Control/);

  const adminRoute = fs.readFileSync(
    "app/api/admin/support/[id]/route.ts",
    "utf8",
  );
  assert.match(adminRoute, /requireAdmin/);
  assert.match(adminRoute, /admin_response/);
  assert.match(adminRoute, /responded_at/);

  const migration = fs.readFileSync(
    "supabase/migrations/202609200013_support_workflow.sql",
    "utf8",
  );
  assert.match(migration, /admin_response/);
  assert.match(migration, /responded_at/);

  const form = fs.readFileSync("components/SupportForm.tsx", "utf8");
  assert.match(form, /support\/ticket\?ticket=/);
});


test("project request workflow exposes secure status and admin follow-up", () => {
  const customerRoute = fs.readFileSync(
    "app/api/project-requests/[requestNo]/route.ts",
    "utf8",
  );
  assert.match(customerRoute, /tokenHash\(token\)/);
  assert.match(customerRoute, /customer_message/);
  assert.match(customerRoute, /Cache-Control/);

  const adminRoute = fs.readFileSync(
    "app/api/admin/projects/[id]/route.ts",
    "utf8",
  );
  assert.match(adminRoute, /requireAdmin/);
  assert.match(adminRoute, /customer_message/);
  assert.match(adminRoute, /responded_at/);

  const migration = fs.readFileSync(
    "supabase/migrations/202609200014_project_followup.sql",
    "utf8",
  );
  assert.match(migration, /customer_message/);
  assert.match(migration, /responded_at/);

  const form = fs.readFileSync("components/ProjectRequestForm.tsx", "utf8");
  assert.match(form, /project-request-status\?request=/);
});


test("public JSON write APIs use bounded body readers", () => {
  const routes = [
    "app/api/account/claim-order/route.ts",
    "app/api/analytics/route.ts",
    "app/api/cart/validate/route.ts",
    "app/api/checkout/route.ts",
    "app/api/orders/track/route.ts",
    "app/api/payments/create/route.ts",
    "app/api/project-requests/route.ts",
    "app/api/project-requests/[requestNo]/upload-session/route.ts",
    "app/api/project-requests/[requestNo]/files/route.ts",
    "app/api/proofs/[token]/approve/route.ts",
    "app/api/proofs/[token]/request-changes/route.ts",
    "app/api/reviews/route.ts",
    "app/api/shipping/check/route.ts",
    "app/api/support/route.ts",
  ];

  for (const path of routes) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(source, /readJsonBody/, path + " must bound JSON request bodies");
    assert.doesNotMatch(
      source,
      /request\.json\(/,
      path + " must not use unbounded request.json()",
    );
  }
});


test("order asset lifecycle keeps original, preview, proof and production versions explicit", () => {
  for (const kind of ["original", "preview", "proof", "production"])
    assert.equal(isOrderAssetKind(kind), true);
  assert.equal(isOrderAssetKind("final"), false);

  for (const state of [
    "draft",
    "ready",
    "changes_requested",
    "approved",
    "superseded",
  ])
    assert.equal(isOrderAssetState(state), true);

  assert.equal(canTransitionOrderAsset("draft", "ready"), true);
  assert.equal(canTransitionOrderAsset("ready", "approved"), true);
  assert.equal(canTransitionOrderAsset("approved", "superseded"), true);
  assert.equal(canTransitionOrderAsset("superseded", "ready"), false);
  assert.throws(() => assertOrderAssetTransition("superseded", "ready"));
  assert.equal(assertOrderAssetVersion(1), 1);
  assert.throws(() => assertOrderAssetVersion(0));
  assert.throws(() => assertOrderAssetVersion(1.5));
});

test("order asset migration is additive, private and versioned", () => {
  const migration = fs.readFileSync(
    "supabase/migrations/202609260015_order_assets.sql",
    "utf8",
  );
  assert.match(migration, /create table if not exists public\.shop_order_assets/);
  assert.match(migration, /'original','preview','proof','production'/);
  assert.match(
    migration,
    /'draft','ready','changes_requested','approved','superseded'/,
  );
  assert.match(migration, /shop_order_assets_scope_version_uidx/);
  assert.match(migration, /references public\.shop_order_items/);
  assert.match(migration, /references public\.shop_proofs/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.shop_order_assets from anon, authenticated/);
  assert.match(migration, /grant all on public\.shop_order_assets to service_role/);
});
