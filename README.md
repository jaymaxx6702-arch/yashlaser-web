# Yash Laser Shop

Customer-facing personalised acrylic commerce platform for **Yash Laser (est. 1997)**.

- Production shop: `shop.yashlaser.in`
- Stack: Next.js + Supabase + Vercel
- Internal production integration: YashFlow
- UI languages: English, Gujarati, Hindi and Marathi

## Local development

```bash
npm ci
npm run dev
```

For production-equivalent verification:

```bash
npm run lint
npm run build
npm run start -- --port 3101
npm run check:routes -- http://localhost:3101
```

## Configuration

Copy `.env.example` to `.env.local` for local work and add private values locally. Never commit real credentials.

Canonical configuration documentation:

- `docs/ENVIRONMENT.md` — environment variable register and safe rollout order
- `docs/SETUP.md` — Supabase/private upload setup
- `docs/VERCEL.md` — production deployment/security notes
- `docs/commerce-rollout.md` — commerce feature enablement and rollback
- `docs/ADMIN.md` — admin workflow
- `docs/CUSTOMIZATION.md` — customisation engine
- `docs/YASHLASER_MASTER_PROJECT.md` — project source of truth and 100-task checklist

## Safety defaults

Provider-dependent features remain disabled until verified:

- online payments
- automated courier/rates
- optional YashFlow sync automation
- customer/account feature flags that have not completed production auth checks

Do not guess prices, dimensions, shipping promises or provider credentials. Server-side order totals remain the source for future payment creation.
