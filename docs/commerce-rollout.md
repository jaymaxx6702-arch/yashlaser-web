# Yash Laser Shop — Commerce Rollout Runbook

This document is the safe rollout order for the commerce upgrade. Keep all new
feature flags disabled until the matching database migration and external
provider configuration are verified.

## 1. Code deployment

Deploy the tested `main` branch first with all rollout flags set to `false`.
This is intentionally safe: the existing enquiry/customisation flow remains
available while new commerce modules stay disabled.

## 2. Shop Supabase migrations

Apply these migrations in this exact order after the existing enquiry and
customisation migrations:

1. `202609190005_commerce.sql`
2. `202609190006_proof_storage.sql`
3. `202609190007_yashflow_sync.sql`
4. `202609190008_project_uploads.sql`
5. `202609190009_analytics.sql`
6. `202609190010_rate_limits.sql`
7. `202609190011_customer_accounts.sql`
8. `202609200012_analytics_checkout_complete.sql`
9. `202609200013_support_workflow.sql`
10. `202609200014_project_followup.sql`
11. `202609220015_design_assets.sql`

After each migration, confirm it completes without error before running the
next one.

## 3. Required Shop environment variables

Server-only values:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USER_IDS`

Browser-safe Supabase values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Keep these off initially:

- `COMMERCE_ORDERS_ENABLED=false`
- `PAYMENTS_ENABLED=false`
- `YASHFLOW_SYNC_ENABLED=false`
- `PROJECT_REQUESTS_ENABLED=false`
- `SUPPORT_ENABLED=false`
- `REVIEWS_ENABLED=false`
- `ANALYTICS_ENABLED=false`
- `RATE_LIMITS_ENABLED=false`
- `CUSTOMER_ACCOUNTS_ENABLED=false`

## 4. Safe feature enablement order

Enable one feature at a time and smoke-test it before continuing:

1. `RATE_LIMITS_ENABLED=true`
2. `ANALYTICS_ENABLED=true`
3. `PROJECT_REQUESTS_ENABLED=true`
4. `SUPPORT_ENABLED=true`
5. `REVIEWS_ENABLED=true`
6. `COMMERCE_ORDERS_ENABLED=true`
7. `CUSTOMER_ACCOUNTS_ENABLED=true` only after Supabase Auth email/site URL
   settings are verified.
8. `YASHFLOW_SYNC_ENABLED=true` only after the YashFlow integration SQL,
   shared secret and product mappings are ready.
9. `PAYMENTS_ENABLED=true` only after a real merchant provider and verified
   webhook implementation are installed.
10. Configure live shipping provider only after courier credentials and rate
    rules are verified. Until then the Shop must continue to show manual
    shipping confirmation.

## 5. YashFlow setup

On the YashFlow Supabase project apply:

- `sql/2026-09-19-shop-integration.sql`

Configure YashFlow server variables:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `YASHFLOW_INTEGRATION_SECRET`
- `YASHFLOW_INTEGRATION_EMPLOYEE_ID`

Configure Shop variables with the matching secret:

- `YASHFLOW_API_URL`
- `YASHFLOW_API_SECRET`

Create a Shop Product ID → YashFlow Product ID mapping for every product that
may enter production. Do not enable automatic sync while a required mapping is
missing.

## 6. Smoke test sequence

Use a non-production sample order:

1. Product page loads.
2. Customisation saves privately.
3. Add to cart works.
4. Cart revalidation works.
5. Checkout rejects invalid data and accepts valid data.
6. Secure order tracking link opens.
7. Customer account can claim the order with the secure token.
8. Admin creates proof v1.
9. Customer requests changes.
10. Admin creates proof v2.
11. Old proof link can no longer approve.
12. Customer approves v2.
13. Admin updates shipment/AWB.
14. Customer tracking shows shipment status.
15. Shop order syncs once to YashFlow.
16. Retrying YashFlow sync does not create duplicate production orders.

## 7. Rollback

All new commerce features are controlled with flags. If any rollout check
fails, turn the affected feature flag back to `false` first. The migrations
are additive and should not be rolled back destructively during an incident.

Payments and courier automation must remain disabled until their provider
credentials and webhook/rate contracts are tested with real sandbox accounts.


## Design asset lineage

`202609220015_design_assets.sql` adds a private, additive lineage index for original,
processed, preview, proof and production assets. It does not replace or delete
existing enquiry artwork/preview paths or proof records. New code should dual-write
the lineage table when an asset becomes part of a persisted customer/order workflow.
Production assets must be approved and locked.
