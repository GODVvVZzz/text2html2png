# dark — 深色科技感

**Tone**: 专业、技术、沉稳
**Best for**: 系统架构、技术方案、服务拓扑、性能报告、监控面板
**Layout**: Compact, symmetric, full (same as all styles)
**Background color**: `#0d1117`

---

## Font Stack

```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;  /* for labels, code */
font-family: 'DM Sans', 'Noto Sans SC', sans-serif;      /* for body text */
```

Display/title: `'Space Grotesk', 'DM Sans', sans-serif` — weight 700
Body: `'DM Sans', 'Noto Sans SC', sans-serif` — weight 400-500
Code/labels: `'JetBrains Mono', 'Fira Code', monospace` — weight 400

**Optional web fonts** (only when the user explicitly allows network access; otherwise use the local stack above):
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500&display=swap" rel="stylesheet">
```

---

## CSS Variables

```css
:root {
  --bg: #0d1117;
  --card-bg: #161b22;
  --card-bg-alt: #1c2128;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --border-base: #30363d;

  --accent-blue: #58a6ff;
  --accent-green: #3fb950;
  --accent-orange: #d29922;
  --accent-red: #f85149;
  --accent-purple: #bc8cff;

  /* Cross-chart contract */
  --accent: var(--accent-blue);
  --arrow-color: #6e7681;
  --s1: #58a6ff;
  --s2: #3fb950;
  --s3: #bc8cff;
  --s4: #d29922;
  --s5: #f85149;
  --s6: #39c5cf;
  --s7: #db6d28;
  --success: #3fb950;
  --minor: #d29922;
  --critical: #f85149;

  --glow-blue: rgba(88, 166, 255, 0.15);
  --glow-green: rgba(63, 185, 80, 0.15);
  --glow-purple: rgba(188, 140, 255, 0.15);
}
```

---

## Base Layout

```css
body {
  font-family: 'DM Sans', 'Noto Sans SC', sans-serif;
  background: #0d1117;
  background-image: radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.04) 0%, transparent 60%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 24px 20px;
  color: #e6edf3;
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
  font-family: 'Space Grotesk', 'DM Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
.page-sub {
  font-size: 12.5px;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
}
```

### Card
```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-base);
  border-radius: 10px;
  padding: 14px 16px;
}
```

### Highlighted Card (glow effect)
```css
.card.glow {
  border-color: var(--accent-blue);
  box-shadow: 0 0 12px var(--glow-blue);
}
```

### Badge / Tag
```css
.badge {
  display: inline-block;
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent-blue);
  border: 1px solid rgba(88, 166, 255, 0.3);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
}
```

### Connectors
```css
/* SVG connectors use #30363d for normal paths, accent-blue for highlighted paths */
.connector line { stroke: var(--border-base); stroke-width: 1.5; }
.connector.highlight line { stroke: var(--accent-blue); stroke-width: 1.5; }
```

### Stats
```css
.stat-num {
  font-size: 28px;
  font-weight: 800;
  font-family: 'Space Grotesk', sans-serif;
}
```

### Banner
```css
.banner {
  background: linear-gradient(135deg, #161b22 0%, #1c2128 100%);
  border: 1px solid var(--border-base);
  border-radius: 10px;
  padding: 14px 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
.banner em { color: var(--accent-blue); font-style: normal; font-weight: 600; }
```

---

## Architecture Layout (important)

Layer labels **must** use flex row layout, not absolute positioning:

```css
.layer { display: flex; align-items: center; }
.layer-tag {
  width: 52px; flex-shrink: 0;
  font-size: 10px; font-weight: 600; color: #484f58;
  text-transform: uppercase; letter-spacing: 0.5px;
  text-align: right; padding-right: 10px;
}
.layer-nodes { flex: 1; display: flex; gap: 10px; justify-content: center; }
.conn-row { display: flex; align-items: center; }
.conn-spacer { width: 52px; flex-shrink: 0; }
.conn-center { flex: 1; display: flex; align-items: center; justify-content: center; height: 28px; }
```

---

## Special Effects

- Subtle radial gradient on background (bluish glow at top center)
- Glow box-shadow on highlighted cards
- Monospace font for labels and technical annotations
- Semi-transparent colored backgrounds for badges
- 1px border (thinner than warm's 1.5px) for a more technical feel
