import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Shop checkout never auto-routes unsupported products to YashFlow", () => {
  const checkout = fs.readFileSync("app/api/checkout/route.ts", "utf8");
  const adminSync = fs.readFileSync(
    "app/api/admin/orders/[id]/yashflow-sync/route.ts",
    "utf8",
  );
  assert.doesNotMatch(checkout, /syncShopOrderToYashFlow/);
  assert.doesNotMatch(checkout, /YASHFLOW_API_URL/);
  assert.match(adminSync, /adminUser/);
  assert.match(adminSync, /syncShopOrderToYashFlow/);
});

test("YashFlow retries are idempotent and failures remain visible", () => {
  const source = fs.readFileSync("lib/yashflow.ts", "utf8");
  assert.match(source, /"idempotency-key": "shop-order:" \+ order\.id/);
  assert.match(source, /const attempt = Math\.max/);
  assert.match(source, /yashflow_sync_status: "failed"/);
  assert.match(source, /shop_integration_events/);
  assert.match(source, /partial sync failure/);
  assert.match(source, /AbortSignal\.timeout\(25000\)/);
});

test("admin exposes failed sync queue, retry report and attention alert", () => {
  const integrations = fs.readFileSync(
    "app/admin/integrations/page.tsx",
    "utf8",
  );
  const admin = fs.readFileSync("app/admin/page.tsx", "utf8");
  const nav = fs.readFileSync("components/AdminNav.tsx", "utf8");
  assert.match(integrations, /Failed sync queue/);
  assert.match(integrations, /Recent sync attempts/);
  assert.match(integrations, /YashFlowSyncButton/);
  assert.match(integrations, /Attempt \{event\.attempts\}/);
  assert.match(admin, /need\s+YashFlow sync attention/);
  assert.match(nav, /\/admin\/integrations/);
});

test("launch operations runbook has support ownership and issue priority", () => {
  const runbook = fs.readFileSync("docs/RELEASE_RUNBOOK.md", "utf8");
  assert.match(runbook, /Issue priority matrix/);
  assert.match(runbook, /P0/);
  assert.match(runbook, /P1/);
  assert.match(runbook, /Support ownership/);
  assert.match(runbook, /Website technical owner/);
});
