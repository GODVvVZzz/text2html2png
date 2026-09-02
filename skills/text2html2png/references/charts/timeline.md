# Timeline — 时间线

里程碑、历史事件、版本迭代、路线图、发展历程。

---

## Layout

```
[Title]
         ● 2020-Q1  Event A
    ─────┤
         ● 2020-Q3  Event B
    ─────┤
         ● 2021-Q1  Event C
    ─────┤
         ● 2022     Event D
[Banner]
```

Vertical axis with alternating left/right content cards.

---

## HTML Structure

```html
<div class="wrap">
  <div class="page-title">Product Roadmap</div>
  <div class="page-sub">2020 — 2025</div>

  <div class="timeline">
    <!-- Left-aligned item -->
    <div class="tl-item tl-left">
      <div class="tl-date">2020 Q1</div>
      <div class="tl-dot" style="--dot-color: var(--s1);"></div>
      <div class="tl-card" style="--accent: var(--s1);">
        <div class="tl-card-title">Project Kickoff</div>
        <div class="tl-card-body">Initial team formation and requirements gathering.</div>
      </div>
    </div>

    <!-- Right-aligned item -->
    <div class="tl-item tl-right">
      <div class="tl-card" style="--accent: var(--s2);">
        <div class="tl-card-title">Alpha Release</div>
        <div class="tl-card-body">First public beta with the supplied core features.</div>
      </div>
      <div class="tl-dot" style="--dot-color: var(--s2);"></div>
      <div class="tl-date">2020 Q3</div>
    </div>

    <!-- ... alternating ... -->
  </div>

  <div class="banner">From concept to market leader in 5 years</div>
</div>
```

---

## CSS

```css
.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 20px;
}
/* Central vertical line */
.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-base);
  transform: translateX(-50%);
}

.tl-item {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.tl-left {
  flex-direction: row;
}
.tl-left .tl-date { flex: 1; text-align: right; }
.tl-left .tl-card { flex: 1; }

.tl-right {
  flex-direction: row;
}
.tl-right .tl-card { flex: 1; text-align: right; }
.tl-right .tl-date { flex: 1; text-align: left; }

.tl-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--dot-color);
  border: 3px solid var(--bg, #fff);
  box-shadow: 0 0 0 2px var(--dot-color);
  flex-shrink: 0;
  z-index: 1;
}

.tl-date {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  min-width: 80px;
}

.tl-card {
  background: var(--card-bg);
  border: 1.5px solid var(--accent);
  border-radius: 10px;
  padding: 12px 14px;
}
.tl-card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.tl-card-body {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}
```

---

## Variants

### Single-Side Timeline

For simpler timelines, all cards on the right:

```css
.tl-item { flex-direction: row; }
.timeline::before { left: 20px; }
.tl-date { width: 80px; flex-shrink: 0; text-align: right; }
```

### Milestone Markers

For key milestones, use larger dots:
```css
.tl-dot.milestone {
  width: 20px; height: 20px;
  border-width: 4px;
}
```

### Era Labels

Group events by era with a full-width label:
```html
<div class="tl-era">Early Stage (2020-2021)</div>
```

---

## Key Rules

1. **Central line**: 2px, uses `--border-base` color
2. **Alternating layout**: Left-right-left-right for visual rhythm
3. **Dot on the line**: Centered on the vertical axis, with ring effect (box-shadow)
4. **Date labels**: Always visible, opposite side from the card
5. **Color cycling**: Each dot/card border uses next accent color
6. **Consistent card width**: Both sides should have equal flex space
7. Gap between items: 8-10px

---

## Pipeline migration note (theme-decoupling)

Timeline is migrated to the multi-chart pipeline in `experiments/theme-decoupling/chart/timeline/`
(`chart.css` + `body.mjs` + `zh.json`/`en.json` fixtures). The validated pattern supersedes the
snippet above where they differ; the legacy sections remain for the skill's current runtime vocabulary.

Validated structure (all 7 themes × zh/en, `build --render --audit` 42/42 green):

- One uniform DOM per event: `.tl-item` = date → dot → card; even rows flip sides via grid
  `order` (the item is a 3-track grid `minmax(0,1fr) auto minmax(0,1fr)`), so both locales and
  all themes share one fingerprint.
- The side tracks are `minmax(0, 1fr)` — equal by definition, which keeps the dot column exactly
  on the axis regardless of card padding. (Flexbox `1fr`-style equal splits are NOT equivalent:
  Chrome clamps a flex item's base size to its padding-box, so a padded card skews the dot off
  the axis.)
- The central axis is `border-left: var(--t-leader-width) var(--t-leader-style) var(--t-rule)`
  on `.timeline::before` — themes that style leaders as dotted/dashed (warm, paper) get a
  hand-drawn axis for free.
- Dots: `border-radius: 50%` is the one allowed geometric constant in chart CSS (validator
  exemption); the ring uses `outline: 2px solid var(--tone)` instead of a raw box-shadow.
- Cards reuse the shared card anatomy (token radius/border/shadow, `color-mix` accent tint);
  milestone events get a bigger dot, a stronger tint, and an accent-mixed border via
  `.tl-item.milestone`.
- Accent cycling runs `--t-accent-1..7` through the `--tone` data variable (already whitelisted);
  themes must keep every accent legible on their surfaces — the strict audit enforces 4.5:1.
- Optional stats row reuses the shared `.metrics` skeleton (exactly 3 entries).
