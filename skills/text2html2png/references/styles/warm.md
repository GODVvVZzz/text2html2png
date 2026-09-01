# warm — 暖色系

**Tone**: 温暖、专业、亲和
**Best for**: 测试报告、工作流程、业务方案、操作步骤、项目计划
**Layout**: Compact, symmetric, full (same as all styles)
**Background color**: `#faf6ee`

---

## Font Stack

```css
font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Georgia', serif;
```

Display/title: `'Playfair Display', 'Noto Serif SC', serif` — weight 700-900
Body: `'Noto Sans SC', 'Source Han Sans SC', sans-serif` — weight 400-500

**Optional web fonts** (only when the user explicitly allows network access; otherwise use the local stack above):
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@700&display=swap" rel="stylesheet">
```

---

## CSS Variables

```css
:root {
  /* Base */
  --bg: #faf6ee;
  --bg-texture: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  --card-bg: #ffffff;
  --text-primary: #2e2410;
  --text-secondary: #6a5a40;
  --text-muted: #a08060;
  --border-base: #e2d8c4;
  --arrow-color: #c0a06a;
  --accent: #c0622a;
  --accent-blue: #2c6e9e;

  /* Step accent colors (cycle through) */
  --s1: #c0622a;   /* burnt orange */
  --s2: #b08830;   /* gold */
  --s3: #3a7a8c;   /* teal */
  --s4: #6a3a8c;   /* purple */
  --s5: #2c6e9e;   /* steel blue */
  --s6: #7a5c38;   /* brown */
  --s7: #4a8c5c;   /* forest green */

  /* Semantic */
  --critical: #b83232;
  --major: #c0622a;
  --minor: #b08830;
  --success: #4a8c5c;
}
```

---

## Base Layout

```css
body {
  font-family: 'Noto Sans SC', 'Source Han Sans SC', sans-serif;
  background: var(--bg);
  background-image: var(--bg-texture);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 24px 20px;
  color: var(--text-primary);
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
  font-family: 'Playfair Display', 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.page-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: -4px;
}
```

### Card
```css
.card {
  background: var(--card-bg);
  border-radius: 10px;
  border: 1.5px solid var(--border-base);
  padding: 14px 16px;
}
.card[data-accent] {
  border-color: var(--accent);
}
```

### Arrow (vertical, between steps)
```html
<div style="display:flex;align-items:center;justify-content:center;height:24px;">
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
    <line x1="10" y1="0" x2="10" y2="15" stroke="#c0a06a" stroke-width="1.8" stroke-dasharray="4 2"/>
    <path d="M5 14l5 7 5-7" fill="#c0a06a"/>
  </svg>
</div>
```

### Stats Row
```css
.stats { display: flex; gap: 10px; }
.stat-card {
  flex: 1;
  border-radius: 10px;
  border: 1.5px solid var(--border-base);
  background: var(--card-bg);
  padding: 14px 14px 12px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: '';
  display: block;
  height: 3px;
  border-radius: 10px 10px 0 0;
  margin: -14px -14px 10px;
  background: var(--accent);
}
.stat-num { font-size: 28px; font-weight: 800; }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.stat-sub { font-size: 10.5px; color: var(--text-muted); margin-top: 3px; }
```

### Banner (bottom summary)
```css
.banner {
  background: linear-gradient(135deg, #3a2a10 0%, #5c3a18 100%);
  border-radius: 10px;
  padding: 14px 24px;
  text-align: center;
  color: #f5e8cc;
  font-size: 13.5px;
  font-weight: 600;
}
.banner em { color: #f0c060; font-style: normal; font-weight: 700; }
```

---

## Special Effects

- Subtle paper-like grain on background via SVG noise filter
- Top accent bar on stat cards (3px colored strip)
- Warm gradient on bottom banner
- Dashed arrows between steps (not solid — gives a hand-drawn feel)
