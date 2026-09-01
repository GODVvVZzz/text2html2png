# Asset provenance

Every image in this repository is either an original vector mark made for this project or a local rendering of HTML committed beside it. No customer, employee, company, or production data appears in any asset.

## Rendered images

| Asset | How it was produced |
|---|---|
| `skills/text2html2png/assets/gallery/*.png` | Rendered locally in Chrome from the matching `skills/text2html2png/examples/*.html`, using the width, background, and scale recorded in each `*.meta.json`. Regenerate with `npm run render:examples`. |
| `docs/gallery/*.png` | The same examples rendered at scale 1 for fast page loads. Regenerate with `node scripts/build-gallery.mjs`. |
| `assets/social-card.png` | Rendered from `assets/social-card.html` with the project's own renderer at 1280×640. |
| `assets/demo.gif` | Assembled from six committed gallery PNGs by `scripts/build-demo-animation.sh` (requires ffmpeg). Every frame is a real rendering, not a mockup. |

All example content — names, numbers, dates, roles, and volumes — is synthetic and written for this repository. Organisational examples use role titles only and contain no personal names.

## Vector assets

`assets/logo.svg`, `assets/logo-dark.svg`, `assets/icon.svg`, and `skills/text2html2png/assets/hero.svg` are original vector artwork created for this open-source release.

## What is deliberately absent

No company logos, private templates, browser screenshots, profile images, or proprietary fonts are included. The style references mention optional Google Fonts by family name only; no font files are redistributed, and remote fonts are not loaded unless the user explicitly passes `--allow-network`.
