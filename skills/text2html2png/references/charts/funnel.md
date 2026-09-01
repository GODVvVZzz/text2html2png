# Funnel — 漏斗图

转化率、筛选流程、销售漏斗、用户旅程、招聘流程。

The percentages below are synthetic layout examples. Replace them only with values supplied by the user; without values, use equal-width stages and omit conversion claims.

---

## Layout

```
[Title]
┌─────────────────────────────────┐  100%  Stage 1
│                                 │
└────────────────────────────┐    │
     ┌───────────────────────┘    │
     │                       │    65%   Stage 2
     └──────────────────┐    │
          ┌─────────────┘    │
          │             │    38%   Stage 3
          └────────┐    │
               ┌───┘    │
               │   │    12%   Stage 4
               └───┘
[Summary Banner]
```

Centered trapezoids with decreasing width, labels on the side.

---

## HTML Structure

```html
<div class="wrap">
  <div class="page-title">User Acquisition Funnel</div>
  <div class="page-sub">March 2026 — Conversion Analysis</div>

  <div class="funnel">
    <div class="funnel-stage" style="--stage-width: 100%; --stage-color: var(--s1);">
      <div class="funnel-bar">
        <div class="funnel-bar-inner">
          <span class="funnel-stage-name">Page Views</span>
          <span class="funnel-stage-num">125,000</span>
        </div>
      </div>
      <div class="funnel-meta">
        <div class="funnel-pct">100%</div>
      </div>
    </div>

    <div class="funnel-drop">
      <span class="funnel-drop-text">-35% drop</span>
    </div>

    <div class="funnel-stage" style="--stage-width: 65%; --stage-color: var(--s2);">
      <div class="funnel-bar">
        <div class="funnel-bar-inner">
          <span class="funnel-stage-name">Sign-ups</span>
          <span class="funnel-stage-num">81,250</span>
        </div>
      </div>
      <div class="funnel-meta">
        <div class="funnel-pct">65%</div>
        <div class="funnel-conv">Conv: 65%</div>
      </div>
    </div>

    <div class="funnel-drop">
      <span class="funnel-drop-text">-42% drop</span>
    </div>

    <div class="funnel-stage" style="--stage-width: 38%; --stage-color: var(--s3);">
      <div class="funnel-bar">
        <div class="funnel-bar-inner">
          <span class="funnel-stage-name">Active Users</span>
          <span class="funnel-stage-num">47,500</span>
        </div>
      </div>
      <div class="funnel-meta">
        <div class="funnel-pct">38%</div>
        <div class="funnel-conv">Conv: 58%</div>
      </div>
    </div>

    <div class="funnel-drop">
      <span class="funnel-drop-text">-68% drop</span>
    </div>

    <div class="funnel-stage" style="--stage-width: 12%; --stage-color: var(--s4);">
      <div class="funnel-bar">
        <div class="funnel-bar-inner">
          <span class="funnel-stage-name">Paid</span>
          <span class="funnel-stage-num">15,000</span>
        </div>
      </div>
      <div class="funnel-meta">
        <div class="funnel-pct">12%</div>
        <div class="funnel-conv">Conv: 32%</div>
      </div>
    </div>
  </div>

  <div class="banner">Overall conversion: <em>12%</em> — Focus area: Sign-up → Active (42% drop)</div>
</div>
```

---

## CSS

```css
.funnel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.funnel-stage {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  justify-content: center;
}

.funnel-bar {
  width: var(--stage-width);
  flex: 0 1 var(--stage-width);
  min-width: 80px;
  background: var(--stage-color);
  border-radius: 6px;
  padding: 12px 16px;
  transition: width 0.3s ease;
}
.funnel-bar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.funnel-stage-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}
.funnel-stage-num {
  font-size: 14px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
}

.funnel-meta {
  flex: 0 0 80px;
  text-align: left;
}
.funnel-pct {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}
.funnel-conv {
  font-size: 10px;
  color: var(--text-muted);
}

/* Drop indicator */
.funnel-drop {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.funnel-drop-text {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
}
```

---

## Variants

### Centered Trapezoid Style

True trapezoid shapes using clip-path:
```css
.funnel-bar.trapezoid {
  clip-path: polygon(
    calc(50% - var(--stage-width) / 2) 0%,
    calc(50% + var(--stage-width) / 2) 0%,
    calc(50% + var(--next-width) / 2) 100%,
    calc(50% - var(--next-width) / 2) 100%
  );
}
```

### Horizontal Funnel

For landscape layouts, use left-to-right stage cards. Keep text horizontal; do not rotate the vertical funnel:
```css
.funnel.horizontal {
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
}
.funnel.horizontal .funnel-stage {
  flex: 1;
  width: auto;
  flex-direction: column;
}
.funnel.horizontal .funnel-bar {
  width: 100%;
  min-height: var(--stage-height, 84px);
}
.funnel.horizontal .funnel-meta {
  flex-basis: auto;
  text-align: center;
}
```

### With Reasons

Add drop-off reasons next to each transition:
```html
<div class="funnel-drop">
  <span class="funnel-drop-text">-35% drop</span>
  <span class="funnel-drop-reason">Main cause: complex form</span>
</div>
```

---

## Key Rules

1. **Bars decrease in width only when values are supplied**: Derive `--stage-width` from source values; otherwise use equal widths
2. **Centered alignment**: All bars centered horizontally, creating symmetric funnel shape
3. **White text on colored bars**: Stage name and number are white on accent-colored backgrounds
4. **Percentage labels on the side**: Large font (18px), next to each bar
5. **Drop indicators between stages**: Show a percentage only when it can be computed from supplied values
6. **Color gradient**: Each stage uses a different accent color, getting warmer/darker as funnel narrows
7. **Min-width on bars**: At least 80px even for small percentages (so text remains readable)
8. Drop height: 20px between stages
9. Bar border-radius: 6px (slightly rounded, not pill-shaped)
