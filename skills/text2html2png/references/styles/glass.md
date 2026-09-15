# glass — 深色玻璃拟态

**Tone**: 深靛蓝、半透明、清晰的数据对比
**Best for**: 产品数据、转化漏斗、现代看板、深色背景上的汇报图
**Layout**: Follow the chart: make its data shape the focus; use restrained translucent surfaces.
**Background color**: `#101831`

## Typography and palette

Use Outfit for display, body and numeric data, with Noto Sans SC for Chinese. The renderer subsets and embeds the locally installed fonts; no remote font request is needed.

The canvas is deep indigo, the main surface is translucent navy, and text is light. Violet and sky blue are the main accents; mint, amber and rose distinguish supplied categories. Text on a solid accent uses dark ink. Do not put white labels on these light accents.

The authoritative values are in [glass.css](../../scripts/pipeline/themes/glass.css). The aliases below document the cross-chart vocabulary used by older illustrative snippets; the renderer uses the `--t-*` contract.

```css
:root {
  --bg: #101831;
  --card-bg: rgba(23, 33, 62, 0.88);
  --card-bg-strong: #202e50;
  --text-primary: #f4f7ff;
  --text-secondary: #c4d0e8;
  --text-muted: #acbddc;
  --border-base: rgba(182, 207, 255, 0.28);
  --border-glass: rgba(182, 207, 255, 0.28);
  --accent: #bea6ff;
  --accent-blue: #72d5f4;
  --arrow-color: #7185af;
  --s1: #bea6ff;
  --s2: #72d5f4;
  --s3: #7bdfbb;
  --s4: #f0ce85;
  --s5: #ffa8c2;
  --s6: #94b8ff;
  --s7: #78dad5;
  --success: #7bdfbb;
  --minor: #f0ce85;
  --critical: #ffa8c2;
  --glass-shadow: 0 14px 32px rgba(4, 9, 24, 0.24), inset 0 1px 0 rgba(218, 230, 255, 0.12);
  --glass-blur: blur(12px);
}
```

## Design rules

- Use the deep indigo canvas with restrained violet and cyan radial light at the edges. Keep plot areas quiet.
- Use translucent navy surfaces, a fine translucent border and a subtle top-edge highlight. Use the stronger opaque surface behind dense text.
- Give the chart shape visual priority: proportional funnel stages, aligned metric readings, or a comparison matrix. Do not turn every label into a separate glass card.
- Use the dark `--t-on-accent` text token on filled accents, and light `--t-text` on dark surfaces.
- Keep all geometry in chart CSS and all palette, fonts, surface and shadow values in theme tokens.
- Audit contrast against the rendered background, including mixed and translucent colours. Do not reduce thresholds to accommodate the theme.
- Keep supplied data and equal-weight comparisons intact. Colour and area must not imply an unsupported winner or trend.

## Reproduction

Use `theme: "glass"` in Diagram JSON and render through `scripts/render.mjs`. Switching the theme keeps the chart's structure and facts; HTML, embedded fonts and PNG are generated from the same source. The historical pale glass palette has been replaced by this dark palette so the five built-in themes provide a visibly wider range.
