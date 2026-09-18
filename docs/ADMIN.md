# Minimum admin panel

1. Apply `supabase/migrations/202609180003_admin.sql` after migrations 001 and 002. This adds private internal notes and expands the status constraint; existing `mockup` records become `mockup_pending`.
2. Create the intended staff account in Supabase Authentication. Set its UUID in the server environment `ADMIN_USER_IDS` (comma-separated for multiple staff). An empty allowlist denies all admin access. Never use user-editable profile metadata to grant access.
3. Configure the existing Supabase URL, publishable key and server-only secret key. Restart the server after changing environment variables.
4. Visit `/admin/login` and sign in. The access token stays in an HttpOnly, SameSite Strict cookie scoped to `/admin`, secure on HTTPS. Sessions expire within one hour; sign in again when expired. No refresh token is kept. Use HTTPS for production.

Every admin data page, mutation and artwork handler checks the current Supabase Auth user against the server allowlist. Removing a UUID revokes application access after updating/restarting the server. Customer submission does not grant admin privileges. Next Server Actions enforce same-origin mutation checks; Supabase Auth applies its login rate limits.

The enquiry list supports reference/name/phone search, status/date filters (IST) and 25-row pagination. Details include saved unit/total estimates, selected variant, quantity, customer instructions, customization JSON and private preview/artwork. Internal notes remain staff-only. Status changes allow staff to correct any state; no customer message or production action is sent automatically.

Artwork links authenticate the staff member on each request, resolve only the saved item's path, then issue a 60-second signed redirect. Responses are no-store; signed URLs are bearer links until expiry and must not be shared. Admin pages are dynamic and noindex; robots exclusion is supplementary, not authentication.

QA: unauthenticated list/detail requests redirect to login and artwork requests return 401. After account/schema setup, open retained QA enquiry `YL-85FEA3AA611B45D59DB2C81B060BD223`, test filters, preview/artwork, save an internal note, verify a status change and return it to Cancelled. Do not contact the customer during QA.
