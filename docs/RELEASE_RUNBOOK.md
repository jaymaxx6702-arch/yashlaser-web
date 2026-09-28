# Yash Laser Shop — Release & Rollback Runbook

## Release gate

A production release is allowed only when all of the following are true:

1. The release branch is based on current `main`.
2. Shop CI passes lint, production build, offline verification and route/API smoke checks.
3. Required additive Supabase migrations are already applied and verified.
4. Security-sensitive feature flags are enabled only after their code + DB prerequisites pass.
5. `PAYMENTS_ENABLED` remains false until a real provider, webhook and refund/failure flow are verified.
6. Shipping/courier automation remains disabled until provider credentials and serviceability/rate/AWB flows are verified.
7. No stale or superseded branch is merged directly into `main`.

## Production release steps

1. Re-read the PR head SHA and verify the latest Shop CI is green.
2. Merge the approved consolidated PR into `main` using the expected head SHA.
3. Record the resulting merge commit SHA.
4. Confirm Vercel creates a production deployment for that exact `main` commit.
5. Wait for Vercel state `READY`.
6. Verify the `shop.yashlaser.in` alias points to the new deployment.
7. Check `/api/health`.
8. Run homepage/product/customizer/cart/checkout/track-order/language smoke checks.
9. Check Vercel runtime errors after rollout.
10. Update `docs/YASHLASER_MASTER_PROJECT.md` with the deployed commit and task status.

## Version convention

Use a release marker in the Master Project change log:

`YYYY-MM-DD / batch-name / main SHA / Vercel deployment ID`

Formal GitHub tags are optional until the launch freeze. At public-launch freeze, start semantic tags:

- `v1.0.0` — public launch
- patch: bug/security fixes
- minor: backwards-compatible customer/admin features
- major: breaking data/API or major workflow redesign

## Rollback decision

Rollback immediately when any of these occur after release:

- checkout/order creation is materially broken
- private artwork/proof access is exposed or cross-customer isolation fails
- admin authorization fails open
- YashFlow sync creates duplicate/corrupt orders
- persistent 5xx errors affect core customer flows
- a database migration creates incompatible reads/writes that cannot be safely forward-fixed

For cosmetic or isolated non-core problems, prefer a small forward fix instead of rollback.

## Rollback procedure

### Code-only release

1. Identify the last known-good production deployment and main commit.
2. Prefer Vercel instant rollback/promotion to the known-good deployment when available.
3. If repository history also needs to reflect rollback, create a revert commit; do not force-push `main`.
4. Verify domain alias, `/api/health`, route smoke and runtime errors.

### Release with additive database migration

Do not destructively roll the database back merely to match old code.

1. First roll application code back only if old code remains compatible with the additive schema.
2. Leave additive columns/tables/indexes in place.
3. If a migration introduced bad behavior, ship a new corrective additive migration.
4. Never delete historical orders, payments, proofs, source artwork or production lineage during rollback.

## Feature-flag rollback

For a feature already built but newly enabled, disabling its production flag is the preferred first rollback:

- `RATE_LIMITS_ENABLED=false`
- `ANALYTICS_ENABLED=false`
- `PROJECT_REQUESTS_ENABLED=false`
- `SUPPORT_ENABLED=false`
- `REVIEWS_ENABLED=false`
- `CUSTOMER_ACCOUNTS_ENABLED=false`

Commerce/YashFlow flags should only be disabled after checking operational impact on already-created records.

## Post-release verification

Record:

- main commit SHA
- Vercel deployment ID
- production alias state
- health flags
- CI run ID
- runtime error check
- any migration applied
- any flag changed
- rollback target

This record belongs in the Master Project change log or release note, never in a file containing secrets.
