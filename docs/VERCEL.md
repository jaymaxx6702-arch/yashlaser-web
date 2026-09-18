# Production: shop.yashlaser.in

No deployment or DNS changes are performed by this setup.

## Vercel project

Import the Git repository with the Next.js preset, Node.js 22.x, install `npm ci`, build `npm run build`, default Next.js output. Add `shop.yashlaser.in` only when authorised to deploy. Keep preview deployments access-protected and use a separate Supabase project for preview testing, or leave `ENQUIRIES_ENABLED=false`. Do not use real customer records in public preview deployments.

### Environment variables (values are private, never commit .env.local)

| Name | Scope / value source |
| --- | --- |
| `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; required for admin sign-in |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret; legacy `SUPABASE_SERVICE_ROLE_KEY` also supported |
| `ADMIN_USER_IDS` | Comma-separated authorised Supabase Auth user UUIDs; no public prefix |
| `ENQUIRIES_ENABLED` | `true` only after migrations/private storage checks |

Never prefix either secret/admin allowlist with `NEXT_PUBLIC_`. Do not put secrets in next.config, source, logs or build arguments. Configure Supabase Auth site URL to `https://shop.yashlaser.in`; no wildcard production redirect allowance is needed for the password login. Disable public signups if no customer Auth is intended. Admin authorisation still requires the server UUID allowlist.

## Database/storage

Reuse migrations 001, 002 and 003. For direct uploads, apply 004 or run `node --env-file=.env.local scripts/configure-private-uploads.mjs`; this storage configuration has already been applied to the tested project. Both tables have RLS, anon/authenticated table grants are revoked, and only the server calls submit_enquiry. The `customer-artwork` bucket remains private, capped at 8 MiB for new JPEG/PNG/WebP objects, with no anonymous/authenticated object policies. Admin resolves stored item paths and generates 60-second signed links. Do not share bearer links. Verify no unrelated broad storage policies grant access to this bucket in the production project.

## Payload and abuse limits

Vercel Functions cap request bodies at 4.5 MB: https://vercel.com/docs/functions/limitations . Both POST endpoints accept metadata JSON capped at 32 KiB. The browser sends originals up to 8 MiB/25 MP and previews up to 4 MiB directly to Supabase using signed upload URLs, never through the Vercel request body. Finalisation downloads files server-to-server for byte-count/hash/MIME/dimension/decoder validation. It retains original bytes privately and saves only verified paths. No base64 or raw images are embedded in enquiry JSON.

Supabase signed upload tokens have a native two-hour lifetime (https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl). The application receipt expires after 30 minutes and binds request ID, canonical enquiry digest, random paths and preview hash. Tokens permit creation at specific paths with upsert disabled; originals cannot be overwritten. The browser retains upload completion in memory for retries, obtains a fresh session after expiry and preserves the enquiry request ID. A lost save response is recovered by the idempotent RPC lookup.

The API uses a bounded, per-instance IP throttle (40 attempts/10 minutes shared where instances are shared), persistent database phone quotas (5 saved enquiries/10 minutes), strict same-origin validation and a honeypot. Before opening the public domain, configure Vercel Firewall rate limiting for POST `/api/enquiries/uploads` (10/IP/10 minutes), POST `/api/enquiries` (20/IP/10 minutes), and POST `/admin/login` (10/IP/10 minutes), adjusting through observed legitimate use. Upload-signing needs edge protection because unsigned visitors can request storage capacity before any enquiry is saved. Per-instance throttles do not provide distributed enforcement; verify rule availability for the selected Vercel plan. Apply managed protection where available.

The enquiry function declares a 60-second duration. Browser JSON requests time out at 55 seconds and direct uploads at 120 seconds. The RPC is transactional/idempotent. Upload failures offer retry plus WhatsApp fallback; the 8 MiB upload path does not depend on WhatsApp. Failed or abandoned uploads remain private. For cleanup, only consider `incoming/` objects older than 24 hours (beyond all token/receipt lifetimes), and exclude every `artwork_path` and `preview_path` referenced in enquiry_items. Recheck immediately before deletion; never delete a prefix wholesale or remove files during ambiguous commits. Establish this housekeeping process before sustained public use.

## Release verification

Run `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run test:customization`, `npm run test:production`, `npm run check:catalogue`, then `npm run check:routes -- http://localhost:PORT` against the new production build. Check canonical/sitemap URLs point at shop.yashlaser.in. The generated redirect map is served on the new shop host; links arriving at www.yashlaser.in require redirects configured on the OLD host by its owner (not done here).

After deployment, test one marked QA enquiry, private uploads, admin notes/status and logout on HTTPS, then mark QA Cancelled. Verify HTTPS cookies, WAF rules, noindex admin/customizer routes, image optimisation and Supabase availability. Product prices remain estimates requiring an approved quotation; structured data does not invent stock, ratings or shipping promises.
