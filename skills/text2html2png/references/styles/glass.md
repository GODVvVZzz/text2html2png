# glass — 玻璃拟态

**Tone**: 现代、精致、高端
**Best for**: 产品展示、数据看板、现代 SaaS 界面、高端报告
**Layout**: Compact, symmetric, full (same as all styles)
**Background color**: `#e8eaf0`

---

## Font Stack

```css
font-family: 'Outfit', 'Noto Sans SC', sans-serif;
```

Display/title: `'Outfit', 'Noto Sans SC', sans-serif` — weight 700
Body: `'Outfit', 'Noto Sans SC', sans-serif` — weight 400-500
Numbers: `'Outfit', sans-serif` — weight 800

**Embedded at build time**: the pipeline loads these faces from npm (`@fontsource/outfit` 400/500/700/800, `@fontsource/noto-sans-sc`), subsets them to the chart's actual copy, and inlines them as data-URI `@font-face` — zero network requests, identical rendering on any machine.

---

## CSS Variables

```css
:root {
  --bg: #e8eaf0;
  --card-bg: rgba(255, 255, 255, 0.45);
  --card-bg-strong: rgba(255, 255, 255, 0.7);
  --text-primary: #1e2030;
  --text-secondary: #555a70;
  --text-muted: #8a8fa5;
  --border-base: rgba(255, 255, 255, 0.5);
  --border-glass: rgba(255, 255, 255, 0.3);

  --accent-violet: #7c3aed;
  --accent-sky: #0ea5e9;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;

  /* Cross-chart contract */
  --accent: var(--accent-violet);
  --accent-blue: var(--accent-sky);
  --arrow-color: #7c8aa5;
  --s1: #0ea5e9;
  --s2: #10b981;
  --s3: #7c3aed;
  --s4: #f59e0b;
  --s5: #f43f5e;
  --s6: #6366f1;
  --s7: #14b8a6;
  --success: #059669;
  --minor: #d97706;
  --critical: #e11d48;

  --glass-shadow: 0 4px 16px rgba(30, 32, 48, 0.08);
  --glass-blur: blur(12px);
}
```

---

## Base Layout

```css
body {
  font-family: 'Outfit', 'Noto Sans SC', sans-serif;
  /* Gradient mesh background */
  background: #e8eaf0;
  background-image:
    radial-gradient(at 20% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 50%),
    radial-gradient(at 80% 30%, rgba(14, 165, 233, 0.06) 0%, transparent 50%),
    radial-gradient(at 50% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  min-height: 100vh;
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
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.page-sub {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
}
```

### Glass Card (core component)
```css
.card {
  background: var(--card-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-base);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: var(--glass-shadow);
}
```

### Frosted Card (stronger glass effect)
```css
.card.frosted {
  background: var(--card-bg-strong);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
```

### Accent-Tinted Card
```css
.card.tint-violet {
  background: rgba(124, 58, 237, 0.06);
  border-color: rgba(124, 58, 237, 0.2);
}
.card.tint-sky {
  background: rgba(14, 165, 233, 0.06);
  border-color: rgba(14, 165, 233, 0.2);
}
.card.tint-emerald {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.2);
}
```

### Stats
```css
.stat-num {
  font-size: 32px;
  font-weight: 800;
  color: var(--accent-violet);
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}
```

### Badge (pill)
```css
.badge {
  display: inline-block;
  background: rgba(124, 58, 237, 0.1);
  color: var(--accent-violet);
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 11px;
  font-weight: 600;
}
```

### Connectors
```css
/* Soft colored lines */
.connector line {
  stroke: rgba(124, 58, 237, 0.25);
  stroke-width: 1.5;
}
```

### Banner
```css
.banner {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(14, 165, 233, 0.06) 100%);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  padding: 14px 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 500;
}
.banner em { color: var(--accent-violet); font-style: normal; font-weight: 700; }
```

---

## Design Rules

- **Glassmorphism**: Every card uses `backdrop-filter: blur(12px)` + semi-transparent white background
- **Soft shadows**: `0 4px 16px rgba(30,32,48,0.08)` — never harsh
- **Gradient mesh background**: Multiple radial gradients in soft accent colors create depth
- **Inset highlight**: `inset 0 1px 0 rgba(255,255,255,0.5)` on frosted cards for top-edge light
- **12px border-radius**: Slightly larger than other styles, feels softer/modern
- **Semi-transparent borders**: `rgba(255,255,255,0.3-0.5)` — not solid colors
- **Accent tints**: Card backgrounds can have subtle color tinting to differentiate sections

---

## Special Effects

- Multi-color radial gradient mesh on body background
- Backdrop blur on all glass cards
- Inset white highlight on card top edge
- Subtle box-shadow layering (outer shadow + inner highlight)
- Color-tinted card variants for visual grouping
- Pill-shaped badges with accent colors
