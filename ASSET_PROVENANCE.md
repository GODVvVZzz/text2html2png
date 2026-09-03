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

Every theme ships brand typefaces. No font binary is committed: each face arrives as an npm `@fontsource` dependency, and the pipeline subsets it at render time to exactly the codepoints in the user's copy before inlining it as data-URI `@font-face` blocks. The committed example HTML therefore embeds small data-URI font subsets derived from those faces.

| Theme | Display | Body / data |
|---|---|---|
| `warm` | Playfair Display, Noto Serif SC | Noto Sans SC |
| `minimal` | IBM Plex Sans | IBM Plex Sans, IBM Plex Mono, Noto Sans SC |
| `editorial` | Cormorant Garamond, Noto Serif SC | Lora, Libre Franklin, Noto Sans SC |
| `paper` | Caveat, LXGW WenKai | Nunito, Noto Sans SC |
| `glass` | Outfit | Outfit, Noto Sans SC |

All of these families are licensed under the SIL Open Font License 1.1. LXGW WenKai is copyright LXGW (with Klee by Fontworks as its base); its license text is archived at [`skills/text2html2png/LICENSES/lxgw-wenkai-OFL.txt`](./skills/text2html2png/LICENSES/lxgw-wenkai-OFL.txt). The remaining faces are distributed by Google's `@fontsource` npm packages, whose `LICENSE` files accompany each package under `node_modules/@fontsource/<family>/`.

## Vector assets

`assets/logo.svg`, `assets/logo-dark.svg`, and `assets/icon.svg` are original vector artwork created for this open-source release.

## What is deliberately absent

No company logos, private templates, browser screenshots, profile images, or proprietary fonts are included. Brand fonts arrive as open-licensed npm dependencies and are always subset and embedded locally; remote fonts are never loaded unless the user explicitly passes `--allow-network`.
