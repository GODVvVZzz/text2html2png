# minimal — 极简黑白

**Tone**: 正式、克制、权威
**Best for**: 领导汇报、PPT 辅助、正式文档、简历、提案
**Layout**: Compact, symmetric, full (same as all styles)
**Background color**: `#ffffff`

---

## Font Stack

```css
font-family: 'IBM Plex Sans', 'Noto Sans SC', sans-serif;
```

Display/title: `'IBM Plex Sans', 'Noto Sans SC', sans-serif` — weight 700
Body: `'IBM Plex Sans', 'Noto Sans SC', sans-serif` — weight 400
Numbers: `'IBM Plex Mono', monospace` — weight 600

**Optional web fonts** (only when the user explicitly allows network access; otherwise use the local stack above):
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## CSS Variables

```css
:root {
  --bg: #ffffff;
  --card-bg: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #555555;
  --text-muted: #999999;
  --border-base: #e0e0e0;
  --border-strong: #1a1a1a;
  --accent: #1a1a1a;
  --accent-blue: #1a1a1a;
  --arrow-color: #555555;
  --s1: #111111;
  --s2: #2f2f2f;
  --s3: #4a4a4a;
  --s4: #666666;
  --s5: #7a7a7a;
  --s6: #333333;
  --s7: #595959;
  --success: #2f2f2f;
  --minor: #666666;
  --critical: #111111;
}
```

---

## Base Layout

```css
body {
  font-family: 'IBM Plex Sans', 'Noto Sans SC', sans-serif;
  background: #ffffff;
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
  font-size: 22px;
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
  border: 1.5px solid var(--border-base);
  border-radius: 8px;
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

- **No color**: Everything is black, white, and grays. No accent colors.
- **No shadows**: Clean, flat design.
- **No textures**: Pure white background.
- **No gradients**: Solid fills only.
- **Emphasis via weight**: Use font-weight 700 and border-left 3px for emphasis, not color.
- **Grid alignment**: All elements must align to an implicit grid. No offset elements.
- **Small border-radius**: 8px for cards (not 10px), 4px for small elements.

---

## Special Effects

None. The power of minimal style comes from the absence of decoration. Every pixel must serve a purpose.
