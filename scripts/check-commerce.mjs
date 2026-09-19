import fs from "node:fs";
import assert from "node:assert/strict";

const requiredFiles = [
  "proxy.ts",
  "app/cart/page.tsx",
  "app/checkout/page.tsx",
  "app/track-order/page.tsx",
  "app/account/page.tsx",
  "app/proof/[token]/page.tsx",
  "app/quote/[token]/page.tsx",
  "app/bulk-orders/page.tsx",
  "app/plan-my-event/page.tsx",
  "app/custom-acrylic/page.tsx",
  "app/support/page.tsx",
  "app/reviews/page.tsx",
  "app/admin/shop-orders/page.tsx",
  "app/admin/proofs/page.tsx",
  "app/admin/projects/page.tsx",
  "app/admin/quotes/page.tsx",
  "app/admin/support/page.tsx",
  "app/admin/reviews/page.tsx",
  "app/[lang]/products/page.tsx",
  "app/[lang]/products/[slug]/page.tsx",
];

for (const file of requiredFiles)
  assert.ok(fs.existsSync(file), "Missing commerce file: " + file);

const migrations = [
  "supabase/migrations/202609190005_commerce.sql",
  "supabase/migrations/202609190006_proof_storage.sql",
  "supabase/migrations/202609190007_yashflow_sync.sql",
  "supabase/migrations/202609190008_project_uploads.sql",
  "supabase/migrations/202609190009_analytics.sql",
  "supabase/migrations/202609190010_rate_limits.sql",
];

for (const file of migrations)
  assert.ok(fs.existsSync(file), "Missing migration: " + file);

for (const file of [
  migrations[0],
  migrations[3],
  migrations[4],
  migrations[5],
]) {
  const sql = fs.readFileSync(file, "utf8").toLowerCase();
  assert.match(sql, /enable row level security/, "RLS missing: " + file);
}

const proxy = fs.readFileSync("proxy.ts", "utf8");
assert.match(proxy, /sec-fetch-site/);
assert.match(proxy, /origin/);
assert.match(proxy, /\/api\/integrations\//);

const nextConfig = fs.readFileSync("next.config.ts", "utf8");
for (const route of [
  "/cart",
  "/checkout",
  "/account",
  "/track-order",
  "/proof/:path*",
  "/quote/:path*",
])
  assert.ok(nextConfig.includes(route), "Private cache header missing: " + route);

const env = fs.readFileSync(".env.example", "utf8");
assert.ok(
  !/NEXT_PUBLIC_.*(?:SECRET|SERVICE_ROLE)/i.test(env),
  "Server secrets must never be NEXT_PUBLIC_",
);

const report = {
  passed: true,
  requiredFiles: requiredFiles.length,
  migrations: migrations.length,
  rlsChecked: 4,
};

fs.mkdirSync("migration/reports", { recursive: true });
fs.writeFileSync(
  "migration/reports/commerce-check.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
