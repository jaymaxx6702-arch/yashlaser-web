# Customization engine

## Universal rule contract

`lib/customization/contract.ts` is the single rule source for the reusable customisation engine. Contract version 1 defines category templates, quantity limits, field types, required/optional state, validation limits, conditional visibility and per-image AI permissions.

Supported rule-driven field kinds are: `photo`, `logo`, `text`, `name`, `date`, `qr`, `color`, `choice` and `number`. Definitions are plain serialisable data so the same validator can later be reused by the Admin Field/Rule Builder and API without hard-coding a provider or UI.

The validator accepts untrusted input and rejects unknown categories/templates/kinds, duplicate field IDs or legacy slots, invalid text/numeric/file limits, duplicate choices, broken visibility dependencies and self-dependencies. Existing document version 1 remains supported through explicit legacy slots (`artwork`, `text-1`, `text-2`) so the current renderer can migrate incrementally without breaking saved drafts.

Current category defaults intentionally preserve existing customer behaviour. Product-specific rules will be added through the same contract after the three seed products are verified; unverified prices, dimensions or production rules must not be guessed.

- model.ts: versioned document validation driven by the universal contract, including template, quantity, text and artwork limits.
- templates.ts: normalized category frames; changing variant updates the selected size without inventing physical dimensions.
- geometry.ts: normalized source crop, cover/contain scaling and bounded pan.
- render.ts: single 1000 × 1000 canvas renderer for live preview and snapshot export.
- snapshot.ts: PNG + portable design JSON, content-derived design ID. Preview is indicative, not production artwork.
- persistence.ts: IndexedDB image/document draft, 24-hour restore window; expired drafts are purged when an editor opens. Contact details are never persisted. Reset removes photo/text; product/quantity remain selected.
- CustomizationEditor: common pointer, keyboard, slider, text and crop controls. CanvasPreview is also used for enquiry review.
- useCustomization: image lifecycle, concurrent upload protection, local recovery, save queue and optional background-removal integration.

Original browser uploads are bounded to 8 MB / 25 MP. Cropping is non-destructive; source crop, pan and zoom remain in the JSON. PNG export does not include customer contact information. WhatsApp links cannot attach files: customers download/share the preview and attach their original artwork separately.

## Rule-driven editor UI

The customer editor now reads quantity limits, artwork requirements, accepted image MIME types, AI background-removal permission, legacy text-compatible fields and additional scalar fields from the shared customization definition.

`RuleField.tsx` renders serialisable field rules as customer controls for text, name, date, QR, color, choice and number values. Conditional extra fields use the same visibility rules as server validation. The current single artwork pipeline continues to handle the rule-mapped photo/logo field so existing crop, preview, upload and proof behaviour remains compatible.

Category defaults intentionally preserve the existing storefront. Product-specific seed rules should only be added after the underlying catalogue record is verified; no price, size or production values should be inferred from UI labels.

## Published product rules

YL-110 foundation stores per-product customisation definitions in `shop_customization_rules` with draft, published and archived revisions. Admin writes are validated by the same `validateCustomizationDefinition` contract used by the customer editor.

Publishing is performed by the database function `publish_shop_customization_rule` so archiving the previous live revision and promoting the selected draft happen atomically.

Customer customisation pages use `getPublishedCustomizationDefinition` on the server. A valid published definition is attached to the serialised product and becomes the active rule source for selection, document validation and the editor. If rule storage is unavailable, missing or invalid, the loader falls back to the existing category definition instead of failing the storefront.

The migration remains additive and must be applied before the Admin rule screen is used in production.

## Backend

Apply both SQL migrations in order. The API validates the versioned document against the selected catalogue product, compares the uploaded artwork SHA-256/dimensions, bounds the preview, strips metadata and stores artwork + preview privately. Design settings and design_id are saved on enquiry_items. Prices come from the server catalogue, never the design JSON. Live Supabase verification is pending project credentials.

## Optional background removal

Implement BackgroundRemovalAdapter and inject it into CustomizationForm in a client-side integration. Default: no adapter and no AI call. A browser model or an owned self-hosted rembg service can implement removeBackground(Blob, {signal}). Return transparent PNG/WebP. The output passes the same upload validation and becomes the new draft artwork. Check model/code licence, local memory requirements and deployment configuration before enabling a provider. Do not put service secrets in this client interface.

## Checks

npm run test:customization
npm run lint
npm run build
