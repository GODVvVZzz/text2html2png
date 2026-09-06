# clean — 清晰制图

**Tone**: 正式、克制、精确
**Best for**: 领导汇报、PPT 辅助、正式文档、简历、提案
**Layout**: Compact, symmetric, full (same as all styles)
**Background color**: `#f4f6f8`

---

## Font Stack

```css
font-family: 'IBM Plex Sans', 'Noto Sans SC', sans-serif;
```

Display/title: `'IBM Plex Sans', 'Noto Sans SC', sans-serif` — weight 700
Body: `'IBM Plex Sans', 'Noto Sans SC', sans-serif` — weight 400
Numbers: `'IBM Plex Mono', monospace` — weight 600

**Embedded at build time**: the pipeline loads these faces from npm (`@fontsource/ibm-plex-sans` 400/500/700, `@fontsource/ibm-plex-mono` 500/600, `@fontsource/noto-sans-sc`), subsets them to the chart's actual copy, and inlines them as data-URI `@font-face` — zero network requests, identical rendering on any machine.

---

## CSS Variables

```css
:root {
  /* One engineering-blue accent. Structure and scale carry meaning;
     colour never rotates merely to make peer items look different. */
  --bg: #f4f6f8;
  --card-bg: #ffffff;
  --text-primary: #15171a;
  --text-secondary: #454b55;
  --text-muted: #6b7280;
  --border-base: #d9ddd8;
  --border-strong: #15171a;
  --accent: #2457d6;
  --accent-blue: #2457d6;
  --arrow-color: #aeb6c2;
  --rule-color: #aeb6c2;
  --s1: #2457d6;
  --s2: #2457d6;
  --s3: #2457d6;
  --s4: #2457d6;
  --s5: #2457d6;
  --s6: #2457d6;
  --s7: #2457d6;
  --success: #2457d6;
  --minor: #2457d6;
  --critical: #2457d6;
}
```

---

## Base Layout

```css
body {
  font-family: 'IBM Plex Sans', 'Noto Sans SC', sans-serif;
  background: #f4f6f8;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 24px 20px;
  color: #1a1a1a;
}
.wrap {
  width: 860px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

---

## Components

### Title
```css
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.page-sub {
  font-size: 13px;
  color: var(--text-secondary);
}
```

### Card
```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-base);
  border-radius: 3px;
  padding: 14px 16px;
}
```

### Highlighted Card
```css
.card.highlight {
  border-left: 3px solid var(--border-strong);
}
```

### Numbers
```css
.stat-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}
```

### Connectors / Arrows
```css
/* Solid black lines, no dashes */
.connector line {
  stroke: var(--text-primary);
  stroke-width: 1.5;
}
```

### Tags / Labels
```css
.tag {
  display: inline-block;
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 500;
}
```

### Banner
```css
.banner {
  background: var(--text-primary);
  border-radius: 8px;
  padding: 14px 24px;
  text-align: center;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
}
```

---

## Design Rules

- **One accent**: Engineering blue is the only decorative accent. Additional colours require semantic meaning.
- **No shadows**: Clean, flat design.
- **No textures**: Pure white background.
- **No decorative gradients**: The short calibration rule below the heading is the sole patterned element.
- **Emphasis via weight**: Use font-weight 700 and border-left 3px for emphasis, not color.
- **Grid alignment**: All elements must align to an implicit grid. No offset elements.
- **Small border-radius**: 4px for the frame, 3px for cards and small elements.

---

## Special Effects

A restrained calibration rule below the heading references the product's measured, browser-audited output. It is the only signature device; every other pixel serves reading and comparison.
