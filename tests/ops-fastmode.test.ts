import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { safeIntegrationError } from "../lib/integration-errors";
import { postYashFlowOrder, validateYashFlowSyncResponse } from "../lib/yashflow-transport";

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
  const transport = fs.readFileSync("lib/yashflow-transport.ts", "utf8");
  assert.match(transport, /"idempotency-key": "shop-order:" \+ orderId/);
  assert.match(source, /const attempt = Math\.max/);
  assert.match(source, /yashflow_sync_status: "failed"/);
  assert.match(source, /shop_integration_events/);
  assert.match(transport, /partial sync failure/);
  assert.match(transport, /AbortSignal\.timeout\(timeoutMs\)/);
  assert.match(source, /throw new Error\(message\)/);
});

test("integration errors redact secret-like values before logging or returning", () => {
  const secret = ["sb_secret_example", "continued"].join("\n");
  const bearer = "Bearer abcdefghijklmnopqrstuvwxyz012345";
  const jwt = "eyJabcdefghijklmnopqrstuvwxyz0123456789";
  const result = safeIntegrationError(
    new Error(`request failed ${secret} ${bearer} ${jwt}`),
  );
  assert.doesNotMatch(result, /continued/);
  assert.doesNotMatch(result, /abcdefghijklmnopqrstuvwxyz012345/);
  assert.match(result, /sb_secret_\[redacted\]/);
  assert.match(result, /Bearer \[redacted\]/);
});


test("YashFlow transport surfaces missing mapping without creating a success", async () => {
  const payload = {
    schemaVersion: 1,
    shopOrderId: "shop-1",
    orderNo: "TEST-1",
    customer: { name: "Test", mobile: null },
    items: [{
      shopOrderItemId: "item-1",
      shopProductId: "unmapped",
      productName: "Test",
      quantity: 1,
      configuration: {},
    }],
  };
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: "Product mapping required." }), {
      status: 409,
      headers: { "content-type": "application/json" },
    });

  await assert.rejects(
    () => postYashFlowOrder({
      url: "https://example.invalid",
      secret: "secret",
      orderId: payload.shopOrderId,
      payload,
      fetchImpl: fetchImpl as typeof fetch,
    }),
    /Product mapping required/,
  );
});

test("YashFlow transport converts timeout into a stable failure", async () => {
  const payload = {
    schemaVersion: 1,
    shopOrderId: "shop-2",
    orderNo: "TEST-2",
    customer: { name: "Test", mobile: null },
    items: [{
      shopOrderItemId: "item-2",
      shopProductId: "mapped",
      productName: "Test",
      quantity: 1,
      configuration: {},
    }],
  };
  const fetchImpl = async () => {
    const error = new Error("aborted");
    error.name = "TimeoutError";
    throw error;
  };

  await assert.rejects(
    () => postYashFlowOrder({
      url: "https://example.invalid",
      secret: "secret",
      orderId: payload.shopOrderId,
      payload,
      timeoutMs: 25,
      fetchImpl: fetchImpl as typeof fetch,
    }),
    /timed out after 25ms/,
  );
});

test("YashFlow duplicate replay accepts existing order refs", async () => {
  const payload = {
    schemaVersion: 1,
    shopOrderId: "shop-3",
    orderNo: "TEST-3",
    customer: { name: "Test", mobile: null },
    items: [{
      shopOrderItemId: "item-3",
      shopProductId: "mapped",
      productName: "Test",
      quantity: 1,
      configuration: {},
    }],
  };
  const fetchImpl = async () =>
    new Response(JSON.stringify({
      ok: true,
      shopOrderId: payload.shopOrderId,
      orders: [{
        shopOrderItemId: "item-3",
        yashflowOrderId: "existing-order",
        orderNumber: "YL-TEST",
        existing: true,
      }],
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const result = await postYashFlowOrder({
    url: "https://example.invalid",
    secret: "secret",
    orderId: payload.shopOrderId,
    payload,
    fetchImpl: fetchImpl as typeof fetch,
  });

  assert.equal((result.orders as Array<{ existing: boolean }>)[0]?.existing, true);
});

test("YashFlow partial multi-item response is rejected", () => {
  assert.throws(
    () => validateYashFlowSyncResponse(
      {
        ok: true,
        orders: [{
          shopOrderItemId: "item-a",
          yashflowOrderId: "order-a",
          orderNumber: "YL-A",
          existing: false,
        }],
      },
      ["item-a", "item-b"],
    ),
    /partial sync failure/,
  );
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
