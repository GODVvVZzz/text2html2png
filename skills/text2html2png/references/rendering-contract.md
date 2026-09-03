# Rendering contract

Apply this contract to every chart/style combination. The chart and style references provide examples; this file defines the shared invariants.

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
- No scripts, frames, forms, or plugins. External stylesheets or media are allowed only when the user explicitly requests network-backed assets.
- Add `lang` matching the dominant content language.
- HTML-escape all user text before interpolation.
- Use semantic headings and `aria-label` where SVG meaning is not otherwise exposed.

## Style token contract

Every selected style must define all of these tokens:

```css
:root {
  --bg: #fff;
  --card-bg: #fff;
  --text-primary: #111;
  --text-secondary: #555;
  --text-muted: #777;
  --border-base: #ddd;
  --accent: #2563eb;
  --accent-blue: #2563eb;
  --arrow-color: #64748b;
  --success: #16803c;
  --minor: #a16207;
  --critical: #b42318;
  --s1: #2563eb;
  --s2: #0f766e;
  --s3: #7c3aed;
  --s4: #c2410c;
  --s5: #be123c;
  --s6: #4f46e5;
  --s7: #3f6212;
}
```

Chart-specific custom properties such as `--bar-color`, `--progress`, or `--stage-width` may be set inline on individual elements.

## Primary surfaces

The visual treatment used for a style's generic `.card` must also be reflected on the selected chart's primary surfaces:

- flowchart: `.step-card`
- comparison: `.compare-col`
- timeline: `.tl-card`
- architecture: `.node`
- dashboard: `.stat-card`, `.detail-card`
- Gantt: `.gantt-row`
- org chart: `.org-node`
- funnel: `.funnel-stage`

Do not paste a `.card` rule and assume it applies automatically.

## Layout and connectors

- Prefer Grid/Flexbox for nodes and layers.
- Treat coordinates in chart references as illustrative.
- For repeated nodes, derive widths and connector centers from the node count:
  - peer width = available row width / peer count;
  - connector center = node left + node width / 2;
  - parent connector spans the first and last child centers.
- Keep SVG connectors behind opaque or sufficiently solid node surfaces.
- Arrowheads must remain inside the measured `.wrap` bounds.
- Use `min-height` for connector lanes rather than a fixed height when labels can wrap.

## Content and overflow

- Do not truncate facts silently.
- Wrap long labels; split dense content into logical groups when needed.
- Widen the viewport before reducing text below a readable size.
- Do not use empty decorative cards to fill space.
- Do not use parent `opacity` for progress tracks when child fills must remain opaque; use alpha colors instead.

## Offline-first fonts and icons

Use local fallback stacks by default. A style reference may show an optional Google Fonts link for users who explicitly allow network access; omit it otherwise. In that explicit mode, add only the required origins to the CSP and pass `--allow-network` to both validation and rendering.

Icon slots are dual-channel: a template may emit both an emoji span and a `currentColor` inline SVG, and the theme picks exactly one through `--t-emoji-display` / `--t-svg-display` — never both at once. The `warm` and `glass` themes show emoji; `minimal`, `editorial`, and `paper` show SVGs. An empty emoji slot collapses via the shared `:empty` rule, so a fixture without emoji glyphs never leaves a gap. Emoji are welcome when they improve scanning, friendliness, or match the user's requested visual language; prefer SVG-only themes when byte-for-byte cross-platform appearance matters.

## Pre-render checks

Before screenshotting, confirm:

- every required style token is defined;
- the document passes `scripts/validate-html.mjs`;
- user text is escaped;
- no remote URL is present;
- the output path is new, or overwrite was explicitly requested.
