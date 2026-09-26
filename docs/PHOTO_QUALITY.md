# YL-101 Photo Quality Screening

## Scope

The first YL-101 implementation performs private, on-device screening of the image selected in the customer customiser.

It checks:

- source pixel dimensions and megapixels;
- a deterministic edge-energy sharpness/blur heuristic;
- mean exposure and extreme shadow/highlight clipping;
- luminance contrast;
- optional DPI only when an explicit physical target width in inches is supplied.

## Privacy

The browser analyser draws a downscaled sample to a local canvas and reads its pixels. It does not call `fetch`, upload the sample, or send the image to an AI provider.

The existing original artwork upload flow remains separate and only occurs as part of the existing enquiry workflow.

## Important limitations

This is preliminary screening, not print approval.

- DPI is not guessed from variant labels or unconfirmed units.
- Face/person quality is reported as `not-checked` until a configured quality-analysis provider/model is available.
- Blur, exposure and contrast results are heuristics intended to give early customer warnings. They do not replace the final digital mockup and production review.
- Background-removed/processed artwork does not overwrite the original-upload screening result during the current session.

## Provider path

YL-108 already defines the provider-neutral `quality-analysis` capability. A future face/person model can plug into that policy only after provider privacy, retention, consent, timeout, retry and cost rules are approved.

No provider or model is hard-coded by YL-101.
