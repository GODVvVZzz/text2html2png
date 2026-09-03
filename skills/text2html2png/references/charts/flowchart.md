# Flowchart — 流程图

步骤、操作流程、工作流、Pipeline、CI/CD 部署流程。

---

## Direction Selection

| Condition | Direction | Wrap Width |
|-----------|-----------|-----------|
| Steps ≤ 7, short descriptions (≤ 30 chars each) | **Horizontal** | 960px |
| Steps > 7, or long descriptions | **Vertical** | 860px |

---

## Horizontal Layout

```
[Stats Row (optional)]
[Step 1] → [Step 2] → [Step 3] → ... → [Step N]
[Summary Banner (optional)]
```

### HTML Structure

```html
<div class="wrap" style="width:960px;">
  <!-- Optional stats row -->
  <div class="stats">...</div>

  <!-- Steps row -->
  <div class="steps-h">
    <div class="step-card" style="--accent: var(--s1);">
      <div class="step-header">
        <span class="step-icon">📋</span>
        <span class="step-title">Step Title</span>
      </div>
      <div class="step-body">Description text</div>
    </div>

    <div class="arrow-h">
      <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
        <line x1="0" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.8" stroke-dasharray="4 2"/>
        <path d="M14 5l7 5-7 5" fill="currentColor"/>
      </svg>
    </div>

    <div class="step-card" style="--accent: var(--s2);">...</div>
    <!-- ... more steps + arrows ... -->
  </div>

  <!-- Optional banner -->
  <div class="banner">...</div>
</div>
```

### CSS

```css
.steps-h {
  display: flex;
  align-items: stretch;
  gap: 0;
}
.step-card {
  flex: 1;
  border: 1.5px solid var(--accent);
  border-radius: 10px;
  padding: 14px 12px;
  background: var(--card-bg);
}
.step-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
}
.step-icon { font-size: 16px; }
.step-body { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
.arrow-h {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
  color: var(--arrow-color, #c0a06a);
}
```

---

## Vertical Layout

```
[Stats Row (optional)]
[Step 1]
    ↓
[Step 2]
    ↓
...
[Step N]
[Summary Banner (optional)]
```

### HTML Structure

```html
<div class="wrap">
  <div class="steps-v">
    <div class="step-card" style="--accent: var(--s1);">
      <div class="step-num">01</div>
      <div class="step-content">
        <div class="step-header">
          <span class="step-icon">📋</span>
          <span class="step-title">Step Title</span>
        </div>
        <div class="step-body">Description</div>
      </div>
    </div>

    <!-- Vertical arrow -->
    <div class="arrow-v"><!-- SVG arrow --></div>

    <div class="step-card" style="--accent: var(--s2);">...</div>
  </div>
</div>
```

### CSS

```css
.steps-v {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.step-card {
  display: flex;
  gap: 12px;
  border: 1.5px solid var(--accent);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--card-bg);
}
.step-num {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
  min-width: 32px;
}
.arrow-v {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
}
```

---

## Branching Flows

For flows with decision points or sub-steps:

```
[Step 1] → [Step 2] → [Decision]
                          ↓
              [Sub-step A] [Sub-step B]
                          ↓
                    [Step 3] → [Step 4]
```

Use horizontal row → vertical arrow → horizontal sub-row → vertical arrow → resume horizontal.

---

## Key Rules

1. **Icon + title on same line** (flex row, gap 6px) — never stack them vertically
2. Card gap: 8-10px (horizontal), 0 with arrow dividers (vertical)
3. Arrow area: 24px width (horizontal) or 24px height (vertical)
4. Color cycling: Each step uses next accent color from style's palette
5. Top stats row + bottom banner make the chart feel complete, not bare
6. Step numbers: Optional but recommended for vertical layouts (01, 02, 03...)

---

## Pipeline migration note (theme-decoupling)

Flowchart is migrated to the multi-chart pipeline in `experiments/theme-decoupling/chart/flowchart/`
(`chart.css` + `body.mjs` + `zh.json`/`en.json` fixtures). The validated pattern supersedes the
snippet above where they differ; the legacy sections remain for the skill's current runtime vocabulary.

Validated structure (all themes × zh/en, `build --render --audit` 28/28 green):

- Single horizontal flex row `.flow`; each `.step` is a card with `padding: 13px 14px 14px`,
  a 4px accent top bar via `::before`, and a `--step-accent` data variable (not a theme token)
  pointing at `var(--t-accent-1..7)`.
- Arrows are `<span class="arrow">` (28px) holding an inline SVG line + chevron drawn with
  `currentColor`; the span colors itself from `color-mix(in srgb, var(--t-accent-1) 60%, transparent)`.
  No literal colors, no dashed strokes.
- Icons are monochrome inline SVGs using `currentColor` (shared `chart/icons.mjs`); the emoji
  channel exists but every theme sets `--t-emoji-display: none`.
- Step numbers use the label token pair (`--t-label-*`); themes must keep all five accents
  legible as text on their own surfaces — the strict audit enforces 4.5:1.
- Optional stats row reuses the comparison `.metrics` skeleton (exactly 3 entries).
- `structureFingerprint` must be identical across all themes and both locales; zh/en fixtures
  share one DOM.
