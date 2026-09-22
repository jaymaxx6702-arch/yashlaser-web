# Customization engine

- model.ts: versioned document, strict shared validation, limits and category/template allowlist.
- templates.ts: normalized category frames; changing variant updates the selected size without inventing physical dimensions.
- geometry.ts: normalized source crop, cover/contain scaling and bounded pan.
- render.ts: single 1000 × 1000 canvas renderer for live preview and snapshot export.
- snapshot.ts: PNG + portable design JSON, content-derived design ID. Preview is indicative, not production artwork.
- persistence.ts: IndexedDB image/document draft, 24-hour restore window; expired drafts are purged when an editor opens. Contact details are never persisted. Reset removes photo/text; product/quantity remain selected.
- CustomizationEditor: common pointer, keyboard, slider, text and crop controls. CanvasPreview is also used for enquiry review.
- useCustomization: image lifecycle, concurrent upload protection, local recovery, save queue and optional background-removal integration.

Original browser uploads are bounded to 8 MB / 25 MP. Cropping is non-destructive; source crop, pan and zoom remain in the JSON. PNG export does not include customer contact information. WhatsApp links cannot attach files: customers download/share the preview and attach their original artwork separately.

## Backend

Apply both SQL migrations in order. The API validates the versioned document against the selected catalogue product, compares the uploaded artwork SHA-256/dimensions, bounds the preview, strips metadata and stores artwork + preview privately. Design settings and design_id are saved on enquiry_items. Prices come from the server catalogue, never the design JSON. Live Supabase verification is pending project credentials.

## Optional background removal

Implement BackgroundRemovalAdapter and inject it into CustomizationForm in a client-side integration. Default: no adapter and no AI call. A browser model or an owned self-hosted rembg service can implement removeBackground(Blob, {signal}). Return transparent PNG/WebP. The output passes the same upload validation and becomes the new draft artwork. Check model/code licence, local memory requirements and deployment configuration before enabling a provider. Do not put service secrets in this client interface.

## Checks

npm run test:customization
npm run lint
npm run build


## Stable shared contracts

Wave 1 keeps the existing version-1 design document compatible while moving
future product-specific behaviour behind reusable contracts:

- `rules.ts`: one product-rule schema for templates, quantity, fields and AI capabilities.
  Existing catalogue categories are adapted into this contract so later Admin Product
  Builder work does not require separate product-specific editors.
- `file-policy.ts`: one artwork/preview upload policy shared by browser and server validation.
- `assets.ts`: immutable original -> processed -> preview/proof/production asset roles with
  explicit lifecycle states and parent lineage.
- `image-provider.ts`: provider-neutral capabilities for quality analysis, background removal,
  enhancement and smart crop. No vendor is enabled by this contract.
- Existing customizer UI now reads its template and text constraints from `rules.ts`.

The rule contract is additive. Do not store payment, customer contact or provider secrets in
customization JSON. Original customer artwork must remain recoverable and AI/processed output
must be treated as derived data. A preview is never equivalent to production approval.


## Non-destructive photo correction

The version-1 document now carries bounded brightness, contrast and saturation
adjustments. Old saved designs without these values restore with neutral defaults,
so the change is backward compatible. Rendering applies corrections only to the
preview/canvas; the original uploaded artwork remains unchanged. Future AI
enhancement can therefore produce suggestions or a derived processed asset without
replacing the customer's source file.


Browser export and server verification now consume the same artwork/preview policy.
Changing size, MIME or pixel limits therefore requires one contract update plus tests,
instead of separate client/server edits.
