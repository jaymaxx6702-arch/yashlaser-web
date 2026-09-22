# Customization engine

## Build-once architecture

The customer editor uses shared contracts rather than product-specific editors:

- `model.ts`: versioned design document and strict persisted-state validation.
- `rules.ts`: category/product customization rules for fields, templates, quantity limits and image requirements. The future admin rule builder must write this same contract instead of inventing another schema.
- `assets.ts`: immutable design-asset lifecycle: `original -> processed -> preview -> proof -> production`. Production assets must be approved and locked.
- `ai.ts`: provider-neutral AI media contract. Browser, self-hosted or server implementations must advertise capabilities and pass privacy policy checks.
- `templates.ts`: normalized product frames.
- `geometry.ts`: non-destructive crop, cover/contain scaling and bounded pan.
- `render.ts`: single canvas renderer for previews.
- `snapshot.ts`: portable preview/design export.
- `persistence.ts`: 24-hour browser draft recovery. Customer contact details are not persisted.
- `CustomizationEditor`: one shared editor; product/category rules change behaviour without forking the UI.

The first pilot is Photo Standee. Two additional seed products should validate that the same contracts work outside standees before full catalogue rollout.

## Image and AI pipeline

The intended reusable pipeline is:

`original upload -> quality analysis -> optional AI processing -> customer-editable preview -> proof -> approved production asset`

Rules:

1. Always retain the original customer source separately.
2. AI processing is optional and reversible.
3. Customer crop/position overrides remain available.
4. A preview is never treated as production artwork.
5. Remote customer-media processing is disabled unless the configured privacy policy explicitly allows it.
6. Provider-specific credentials never enter browser code.
7. Background removal and enhancement adapters return validated image outputs and may fail without blocking manual customization.

Original browser uploads remain bounded to 8 MB / 25 MP until a verified business requirement changes those limits.

## Backend and file security

Private uploads use signed targets and immutable metadata. The API validates the design against the catalogue product, bounds payload/file sizes and keeps prices server-derived. New asset/version storage migrations must be additive; historical proofs and production assets must not be overwritten.

## Checks

```bash
npm run test:customization
npm run lint
npm run build
npm run verify:offline
```


## Photo Standee browser background removal pilot

The first working background-removal provider is intentionally limited to the
Photo Standee category. It runs portrait matting in a same-origin module worker.
The worker imports the Apache-2.0 Transformers.js runtime at the exact
`4.3.0` npm version and loads the Apache-2.0 `Xenova/modnet` model at the
pinned `fa2fa54` revision using q8 weights. The customer photo is passed to
the worker as a local Blob/object URL; the provider descriptor explicitly marks
customer media as not sent off-device.

The external runtime/model downloads are lazy: nothing is downloaded until the
customer presses Remove background. If loading/inference fails, the original
photo and manual customizer remain available. This pilot must be browser/device
tested before production rollout, and a future self-hosted runtime/model mirror
can replace the provider without changing the customizer contract.
