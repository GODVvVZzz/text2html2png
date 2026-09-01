# neon — 赛博霓虹

**Tone**: 前卫、炫酷、未来感
**Best for**: 技术分享配图、演讲 slides、漏斗图、转化分析、酷炫展示
**Layout**: Compact, symmetric, full (same as all styles). Cyber feel comes from glow effects, neon colors, and dark backgrounds, not from layout asymmetry.
**Background color**: `#0a0015`

---

## Font Stack

```css
font-family: 'Orbitron', 'Noto Sans SC', sans-serif;  /* titles */
font-family: 'Rajdhani', 'Noto Sans SC', sans-serif;   /* body */
```

Display/title: `'Orbitron', sans-serif` — weight 700-900, uppercase
Body: `'Rajdhani', 'Noto Sans SC', sans-serif` — weight 500
Code/labels: `'Share Tech Mono', monospace` — weight 400

**Optional web fonts** (only when the user explicitly allows network access; otherwise use the local stack above):
```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Noto+Sans+SC:wght@400;500&display=swap" rel="stylesheet">
```

---

## CSS Variables

```css
:root {
  --bg: #0a0015;
  --card-bg: rgba(20, 10, 40, 0.8);
  --card-bg-solid: #140a28;
  --text-primary: #f0e8ff;
  --text-secondary: #a090c0;
  --text-muted: #605080;
  --border-base: rgba(140, 100, 255, 0.25);

  --neon-purple: #a855f7;
  --neon-cyan: #22d3ee;
  --neon-pink: #ec4899;
  --neon-green: #4ade80;
  --neon-orange: #fb923c;

  /* Cross-chart contract */
  --accent: var(--neon-cyan);
  --accent-blue: var(--neon-cyan);
  --arrow-color: #a855f7;
  --s1: #22d3ee;
  --s2: #a855f7;
  --s3: #ec4899;
  --s4: #4ade80;
  --s5: #fb923c;
  --s6: #60a5fa;
  --s7: #facc15;
  --success: #4ade80;
  --minor: #facc15;
  --critical: #fb7185;

  --glow-purple: 0 0 12px rgba(168, 85, 247, 0.4);
  --glow-cyan: 0 0 12px rgba(34, 211, 238, 0.4);
  --glow-pink: 0 0 12px rgba(236, 72, 153, 0.4);
}
```

---

## Base Layout

```css
body {
  font-family: 'Rajdhani', 'Noto Sans SC', sans-serif;
  background: #0a0015;
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(34, 211, 238, 0.06) 0%, transparent 50%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 24px 20px;
  color: #f0e8ff;
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
  font-family: 'Orbitron', sans-serif;
  font-size: 22px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--neon-cyan);
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}
.page-sub {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
}
```

### Card
```css
.card {
  background: var(--card-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-base);
  border-radius: 8px;
  padding: 14px 16px;
}
```

### Neon-Bordered Card
```css
.card.neon-purple {
  border-color: var(--neon-purple);
  box-shadow: var(--glow-purple);
}
.card.neon-cyan {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}
.card.neon-pink {
  border-color: var(--neon-pink);
  box-shadow: var(--glow-pink);
}
```

### Neon Text
```css
.neon-text {
  color: var(--neon-cyan);
  text-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
}
```

### Badge
```css
.badge {
  display: inline-block;
  background: rgba(168, 85, 247, 0.15);
  color: var(--neon-purple);
  border: 1px solid rgba(168, 85, 247, 0.4);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 11px;
  font-family: 'Share Tech Mono', monospace;
}
```

### Stats
```css
.stat-num {
  font-family: 'Orbitron', sans-serif;
  font-size: 32px;
  font-weight: 900;
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Banner
```css
.banner {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%);
  border: 1px solid var(--border-base);
  border-radius: 8px;
  padding: 14px 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
.banner em {
  color: var(--neon-cyan);
  text-shadow: 0 0 6px rgba(34, 211, 238, 0.3);
  font-style: normal;
  font-weight: 600;
}
```

---

## Design Rules

- **Uppercase titles**: Orbitron is designed for uppercase display use
- **Neon glow**: Use box-shadow for card borders and text-shadow for text — sparingly
- **Dark transparent cards**: `rgba()` backgrounds with `backdrop-filter: blur`
- **Gradient text**: For hero numbers/stats, use CSS gradient clipping
- **Color cycling**: Rotate through neon-purple → neon-cyan → neon-pink → neon-green for steps/stages
- **Symmetric layout**: Equal-width cards, same as all styles. Energy comes from glow and color, not layout tricks.
- **Don't overdo it**: Max 2-3 glowing elements per view. Everything glowing = nothing stands out.

---

## Special Effects

- Dual radial gradient on background (purple top-left, cyan bottom-right)
- Neon glow box-shadows on key cards
- Gradient text on hero numbers
- Backdrop blur on card backgrounds
- Text-shadow glow on titles
- Monospace font for technical labels
