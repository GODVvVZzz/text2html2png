# Asset provenance

Every image in this repository is either an original vector mark made for this project or a local rendering of HTML committed beside it. No customer, employee, company, or production data appears in any asset.

## Rendered images

| Asset | How it was produced |
|---|---|
| `skills/text2html2png/assets/gallery/*.png` | Rendered locally in Chrome from the matching bilingual `skills/text2html2png/examples/<id>-<locale>.html`, named `<id>-<locale>-<theme>.png` using the width and scale recorded in each `*.meta.json`. Regenerate with `npm run render:examples`. |
| `docs/gallery/*.png` | The same examples, English rendering, at scale 1 for fast page loads. Regenerate with `node scripts/build-gallery.mjs`. |
| `assets/social-card.png` | Rendered from `assets/social-card.html` with the project's own renderer at 1280×640. |
| `assets/demo.gif` | Assembled from six committed gallery PNGs by `scripts/build-demo-animation.sh` (requires ffmpeg). Every frame is a real rendering, not a mockup. |

All example content — names, numbers, dates, roles, and volumes — is synthetic and written for this repository. Organisational examples use role titles only and contain no personal names.

## Fonts

The `paper` theme uses LXGW WenKai as its display face. No font binary is committed: the font arrives as the npm dependency `@fontsource/lxgw-wenkai` and is subset at render time to exactly the codepoints in the user's copy. The committed `paper` example HTML therefore embeds small data-URI font subsets derived from that face. LXGW WenKai is copyright LXGW (with Klee by Fontworks as its base) and licensed under the SIL Open Font License 1.1; the license text is archived at [`skills/text2html2png/LICENSES/lxgw-wenkai-OFL.txt`](./skills/text2html2png/LICENSES/lxgw-wenkai-OFL.txt).

## Vector assets

`assets/logo.svg`, `assets/logo-dark.svg`, and `assets/icon.svg` are original vector artwork created for this open-source release.

## What is deliberately absent

No company logos, private templates, browser screenshots, profile images, or proprietary fonts are included. The style references mention optional fonts by family name only, and remote fonts are never loaded unless the user explicitly passes `--allow-network`.
