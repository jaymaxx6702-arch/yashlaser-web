# Yash Laser Shop — Environment Register

This file documents environment variable names and their purpose only. **Never commit real secret values.**

## Rules

- Production values live in Vercel/Supabase configuration, not in Git.
- Local private values live in `.env.local`, which must remain untracked.
- Variables containing secret/service credentials must never use the `NEXT_PUBLIC_` prefix.
- Feature flags stay `false` until their migration, credentials and smoke tests pass.
- Payment and courier flags must stay disabled until real provider contracts are implemented and verified.

## Core Supabase

| Variable | Exposure | Required for | Notes |
|---|---|---|---|
| `SUPABASE_URL` | Server only | Database/storage/auth server calls | Preferred server project URL. `NEXT_PUBLIC_SUPABASE_URL` can be used as URL fallback. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser safe | Browser Supabase auth plus URL fallback | Project URL only; not a secret. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser safe | Customer/admin Supabase Auth | Publishable key only. |
| `SUPABASE_SECRET_KEY` | **Secret** | Server database/storage access | Preferred modern server secret. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Legacy server database/storage access | Supported fallback when `SUPABASE_SECRET_KEY` is unavailable. |
| `ADMIN_USER_IDS` | Server only | Admin authorization | Comma-separated approved Supabase Auth user UUIDs. |

## Customer enquiry & commerce flags

| Variable | Exposure | Default | Meaning |
|---|---|---:|---|
| `ENQUIRIES_ENABLED` | Server only | `false` | Enables saved online customisation enquiries/private uploads. |
| `COMMERCE_ORDERS_ENABLED` | Server only | `false` | Enables database-backed shop order creation/tracking. |
| `PROJECT_REQUESTS_ENABLED` | Server only | `false` | Enables Bulk/Event/Custom Acrylic request saving. |
| `SUPPORT_ENABLED` | Server only | `false` | Enables support ticket creation/workflow. |
| `REVIEWS_ENABLED` | Server only | `false` | Enables review submission/moderation workflow. |
| `CUSTOMER_ACCOUNTS_ENABLED` | Server only | `false` | Enables customer sign-in/account/claim flow. |
| `ANALYTICS_ENABLED` | Server only | `false` | Enables first-party analytics event storage. |
| `RATE_LIMITS_ENABLED` | Server only | `false` | Enables persistent Supabase-backed public endpoint rate limits. |

## YashFlow integration

| Variable | Exposure | Required for | Notes |
|---|---|---|---|
| `YASHFLOW_SYNC_ENABLED` | Server only | Shop → YashFlow sync | Keep false until URL, shared secret and mappings are verified. |
| `YASHFLOW_API_URL` | Server only | YashFlow integration | Base URL for the YashFlow integration API. |
| `YASHFLOW_API_SECRET` | **Secret** | YashFlow integration | Bearer secret shared with YashFlow; never expose to browser code. |

## Payments — blocked until merchant decision

| Variable | Exposure | Current status | Notes |
|---|---|---|---|
| `PAYMENTS_ENABLED` | Server only | Must remain `false` | Enable only after provider adapter + webhook verification. |
| `PAYMENT_PROVIDER` | Server only | Provider not selected | Provider identifier used by the adapter registry. |
| `PAYMENT_WEBHOOK_SECRET` | **Secret** | Reserved / not operational yet | Do not configure as “complete” until a real provider webhook handler is implemented and tested. |

The payment foundation resolves the payable order and outstanding amount on the server. The browser must never be trusted to supply the payment amount.

## Shipping / courier — blocked until provider decision

| Variable | Exposure | Current status | Notes |
|---|---|---|---|
| `SHIPPING_PROVIDER` | Server only | Provider not selected | Reserved for the approved courier/rate adapter. |
| `SHIPPING_API_KEY` | **Secret** | Reserved / not operational yet | Current checkout remains manual-confirmation until a real provider is implemented. |

## Safe rollout order

1. Apply all required Supabase migrations.
2. Verify private storage and admin access.
3. Enable `RATE_LIMITS_ENABLED`.
4. Enable `ANALYTICS_ENABLED`.
5. Enable project requests/support/reviews one at a time.
6. Enable commerce orders.
7. Enable customer accounts only after Supabase Auth URLs/mode are verified.
8. Enable YashFlow sync only after mappings/shared secret are verified.
9. Keep payments and automated courier disabled until their provider-specific implementations pass sandbox/real webhook/API tests.

## Verification

For every environment change:

```bash
npm ci
npm run lint
npm run build
npm run start -- --port 3101
npm run check:routes -- http://localhost:3101
```

After deployment, verify `/api/health` and the relevant customer/admin flow without exposing secret values in screenshots, logs or chat.


## AI image processing

| Variable | Exposure | Default | Meaning |
|---|---|---:|---|
| `AI_IMAGE_TOOLS_ENABLED` | Server only | `false` | Enables customer-facing AI image tools only after the provider/service is verified. |
| `AI_BACKGROUND_REMOVE_URL` | Server only | empty | Full HTTPS endpoint for the approved/self-hosted background-removal service. Browser code never sees this URL. |
| `AI_IMAGE_API_SECRET` | **Secret** | empty | Optional bearer secret for the image service. Never use a `NEXT_PUBLIC_` prefix. |

The Shop calls the provider only through a same-origin API route. This keeps provider
credentials out of the browser and allows the model/runtime to change without
rewriting the customizer. Keep the feature flag false until privacy, licence,
latency, output quality and mobile behaviour have been verified.
