# Yash Laser setup

The catalogue, detail pages and browser previews work without external credentials.
With no Supabase configuration, the form prepares a WhatsApp draft. It clearly states that it has not been sent or saved and that artwork must be attached in WhatsApp.

## Supabase

1. Create your Supabase project.
2. Run both files in supabase/migrations in filename order in its SQL editor.
3. Copy .env.example to .env.local and set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY). The secret key stays server-only; the publishable key is not needed by the enquiry endpoint. Never prefix a secret key variable with NEXT_PUBLIC_. API keys do not provide SQL migration access: apply the existing migrations in the dashboard SQL editor or using a private Postgres connection.
4. Set ENQUIRIES_ENABLED=true and restart Next.js. Keep the same variables in your production server's secret environment.
5. Submit a test enquiry with artwork. Verify one enquiry + item, a private customer-artwork object, and an inaccessible anonymous object URL. Verify repeat request_id returns the same reference.
6. Confirm a private upload cannot be fetched with an anonymous or authenticated user key. The server key must never enter NEXT_PUBLIC_* variables.
7. After verification, remove only your own test records and artwork from the dashboard.

No admin UI or online payment is provided. Staff use the Supabase dashboard to review enquiries and private artwork. Uploaded images are validated, decoded, orientation-corrected and stored as metadata-free lossless WebP. Keep source artwork via the agreed customer conversation when needed. Do not make the bucket public.

Apply deployment request limits (14 MB) and rate limiting/WAF before a public launch. The route bounds streamed bodies, checks same-origin submission, validates product/variant/quantity, enforces consent, strips image metadata, and applies a database phone-based rate limit. A honeypot and in-process throttle provide additional basic protection, not a distributed anti-bot service.

## Catalogue

- npm run migrate:mirror -- "C:/Users/pc/YashLaser-Old-Site"
- npm run migrate:fetch (optional network refresh)
- npm run migrate
- npm run migrate -- "C:/Users/pc/YashLaser-Old-Site" (combined mirror scan, mapping, image copy/download, normalization, redirects, review and integrity checks)
- npm run check:catalogue
- npm run build

Source snapshots are retained. Refresh scripts merge by original ID, never automatically delete unmatched products. Backups are kept in ignored migration/backups. Review migration/reports/manual-review.json before correcting questionable source information; original prices and descriptions remain in provenance data.

## QA

npm run lint
npm run build
npm run start -- --port 3101
npm run check:routes -- http://localhost:3101

Live Supabase verification passed from the local production build: browser upload and enquiry submission, one enquiry/item, customization JSON, private artwork and preview, a saved reference, and the WhatsApp handoff summary. Public URLs and anonymous table/storage access were denied; server-generated 60-second signed downloads succeeded. Replaying the request returned the same reference without a duplicate item. No WhatsApp message was sent.

QA reference: `YL-85FEA3AA611B45D59DB2C81B060BD223` (cancelled; retained with test artwork for inspection). This verifies the configured Supabase project, not a deployed website. Configure the same server-only environment variables and request limits in the deployment environment before launch.

Repeat private-storage verification without logging credentials or signed URLs:
`node --env-file=.env.local scripts/verify-live-enquiry.mjs YL-85FEA3AA611B45D59DB2C81B060BD223`
