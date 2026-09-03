# editorial — 杂志排版风

**Tone**: 优雅、知性、有叙事感
**Best for**: 产品介绍、内容展示、时间线、品牌故事、年度回顾
**Layout**: Compact, symmetric, full (same as all styles). Magazine feel comes from typography and dividers, not from layout asymmetry.
**Background color**: `#f8f5f0`

---

## Font Stack

```css
font-family: 'Lora', 'Noto Serif SC', serif;  /* body */
```

Display/title: `'Cormorant Garamond', 'Noto Serif SC', serif` — weight 700
Body: `'Lora', 'Noto Serif SC', serif` — weight 400-500
Auxiliary/labels: `'Libre Franklin', 'Noto Sans SC', sans-serif` — weight 500, all-caps, letter-spacing

**Embedded at build time**: the pipeline loads these faces from npm (`@fontsource/cormorant-garamond` 600/700, `@fontsource/lora`, `@fontsource/libre-franklin`, `@fontsource/noto-serif-sc`, `@fontsource/noto-sans-sc`), subsets them to the chart's actual copy, and inlines them as data-URI `@font-face` — zero network requests, identical rendering on any machine.

---

## CSS Variables

```css
:root {
  --bg: #f8f5f0;
  --card-bg: #ffffff;
  --text-primary: #1c1714;
  --text-secondary: #5a4e42;
  --text-muted: #9a8e82;
  --border-base: #d8d0c4;
  --accent-rust: #a0522d;
  --accent-navy: #2c3e5a;
  --accent-gold: #b8860b;
  --rule-color: #c8bca8;
  --accent: var(--accent-rust);
  --accent-blue: var(--accent-navy);
  --arrow-color: #8f7f6b;
  --s1: #a0522d;
  --s2: #2c3e5a;
  --s3: #b8860b;
  --s4: #6b7a5a;
  --s5: #7c3f58;
  --s6: #4c6b73;
  --s7: #8a623d;
  --success: #4f6f52;
  --minor: #9a6b16;
  --critical: #923f36;
}
```

---

## Base Layout

```css
body {
  font-family: 'Lora', 'Noto Serif SC', serif;
  background: var(--bg);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 28px 24px 24px;
  color: var(--text-primary);
}
.wrap {
  width: 860px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

---

## Components

### Title (magazine-style)
```css
.page-title {
  font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.15;
}
.page-sub {
  font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
  font-style: italic;
  font-size: 16px;
  color: var(--text-secondary);
}
.page-label {
  font-family: 'Libre Franklin', 'Noto Sans SC', sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--accent-rust);
}
```

### Horizontal Rule (editorial divider)
```css
.divider {
  height: 1px;
  background: var(--rule-color);
  margin: 4px 0;
}
.divider.thick {
  height: 2px;
  background: var(--text-primary);
}
```

### Card
```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-base);
  border-radius: 6px;
  padding: 16px 18px;
}
```

### Pull Quote (magazine style)
```css
.pull-quote {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-style: italic;
  color: var(--accent-navy);
  border-left: 3px solid var(--accent-rust);
  padding-left: 16px;
  margin: 8px 0;
}
```

### Two-Column Layout (equal)
```css
.cols-2 { display: flex; gap: 10px; }
.cols-2 > * { flex: 1; }
```

### Category Label
```css
.cat-label {
  font-family: 'Libre Franklin', sans-serif;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--accent-rust);
}
```

### Banner
```css
.banner {
  background: var(--accent-navy);
  border-radius: 6px;
  padding: 14px 24px;
  text-align: center;
  color: #f0ece4;
  font-family: 'Lora', serif;
  font-size: 13.5px;
}
.banner em { color: var(--accent-gold); font-style: normal; font-weight: 600; }
```

---

## Design Rules

- **Large serif titles**: Cormorant Garamond at 28-36px creates a magazine masthead feel
- **Italic subtitles**: Italic serif for secondary headings
- **ALL-CAPS labels**: Sans-serif, tiny (9-10px), wide letter-spacing for category/section labels
- **Thin rules**: 1px horizontal dividers separate sections (like a newspaper column)
- **Symmetric layout**: Equal-width columns, same as all styles. Magazine feel comes from typography, not layout asymmetry.
- **Muted warm palette**: Rust, navy, gold as accents on warm cream background
- **Small border-radius**: 6px (tighter than warm's 10px for a more editorial feel)

---

## Special Effects

- Thick 2px rule below main title (like a newspaper masthead)
- Pull quotes with left border accent
- Tiny uppercase category labels above sections
- Subtle warmth in background (#f8f5f0 is warmer than pure white)
- No shadows, no glow — editorial relies on typography and spacing
