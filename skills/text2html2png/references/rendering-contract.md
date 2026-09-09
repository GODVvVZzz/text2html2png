# Rendering contract

Apply this contract to every chart/style combination. Generate through `scripts/render.mjs`; the chart and style references are explanatory examples, not alternate HTML templates. The current implementation lives in `scripts/pipeline/`.

## Required HTML structure

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'">
  <title>Diagram title</title>
  <style>/* all CSS inline */</style>
</head>
<body>
  <main class="wrap" aria-label="Diagram title">...</main>
</body>
</html>
```

- One `.wrap` root is required for measurement and clipping.
- No scripts, frames, forms, plugins, or external stylesheets/media in the default generated document. The public render entry point does not enable network access.
- Add `lang` matching the dominant content language.
- HTML-escape all user text before interpolation.
- Use semantic headings and `aria-label` where SVG meaning is not otherwise exposed.

## Style token contract

Each theme in `scripts/pipeline/themes/` defines the same 48 `--t-*` tokens in one `:root` rule. The authoritative list is `REQUIRED_THEME_TOKENS` in `scripts/pipeline/validate.mjs`; examples include `--t-canvas`, `--t-text`, `--t-surface`, `--t-accent-1`, and the font/spacing/surface tokens. Do not introduce the older `--bg`, `--card-bg`, or `--s1` vocabulary from illustrative reference snippets into generated output.

Keep visual choices in theme tokens and geometry in shared/chart CSS. Chart CSS must not contain literal colours. Inline properties are restricted to the structural and accent allowlists in `validate.mjs`; do not add arbitrary inline CSS. The public renderer validates this contract automatically.

## Primary surfaces

Apply the selected theme's surface tokens consistently to the chart's primary surfaces. Do not paste a generic `.card` rule and assume it applies automatically:

- flowchart: `.step`
- comparison: `.compare-col`
- timeline: `.tl-card`
- architecture: `.node`
- dashboard: `.metric`, `.panel`
- Gantt: `.gantt-row`
- org chart: `.org-node`
- funnel: `.funnel-stage`
- narrative: `.nar-card`, `.nar-callout`, `.nar-table`

## Layout and connectors

- Prefer Grid/Flexbox for nodes and layers.
- Treat coordinates in chart references as illustrative.
- When implementing node-specific connectors, derive widths and connector centers from the node count:
  - peer width = available row width / peer count;
  - connector center = node left + node width / 2;
  - parent connector spans the first and last child centers.
- Keep SVG connectors behind opaque or sufficiently solid node surfaces.
- Arrowheads must remain inside the measured `.wrap` bounds.
- Use `min-height` for connector lanes rather than a fixed height when labels can wrap.
- Match the actual chart's relationship model. Architecture uses one shared layer-level arrow; it does not support node-specific edge routing. Geometry checks cannot establish whether a dependency is true.

## Content and overflow

- Do not truncate facts silently.
- Wrap long labels; split dense content into logical groups when needed.
- Do not strand one CJK character or a short word on the final line of a compact heading. This is a composition defect, not an overflow defect: revise the repeated component's available text width or layout for every peer rather than adding a label-specific break.
- Widen the viewport before reducing text below a readable size.
- Do not use empty decorative cards to fill space.
- Do not use parent `opacity` for progress tracks when child fills must remain opaque; use alpha colors instead.

## Embedded fonts and icons

Every theme names its brand fonts in the `--t-font-*` tokens. At build time the pipeline resolves those families against `scripts/pipeline/font-embed.mjs`, subsets each face to the codepoints the copy actually uses, and inlines the results as data-URI `@font-face` (CJK families per unicode-range slice, Latin families as one face per weight). Rendering makes zero network requests after dependencies are installed. The same runtime, input, and font dependencies produce the same HTML; PNG rasterization can vary with Chrome, fallback fonts, and platform. If a `@fontsource` package is missing at build time the family is skipped with a stderr warning and the theme's system-font fallbacks take over. Restore missing dependencies before claiming a fully checked result.

Icon slots are dual-channel: a template may emit both an emoji span and a `currentColor` inline SVG, and the theme picks exactly one through `--t-emoji-display` / `--t-svg-display` — never both at once. `clean`, `editorial`, and `notebook` show SVGs; `warm` and `glass` show emoji. An empty emoji slot collapses via the shared `:empty` rule, so a fixture without emoji glyphs never leaves a gap. Emoji are welcome when they improve scanning, friendliness, or match the user's requested visual language; prefer SVG-only themes when byte-for-byte cross-platform appearance matters.

## Pre-render checks

Before screenshotting, confirm:

- every required style token is defined;
- the document passes `scripts/validate-html.mjs`;
- user text is escaped;
- no remote URL is present;
- the output path is new, or overwrite was explicitly requested.
