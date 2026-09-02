# Gantt Chart — 甘特图

项目排期、任务进度、里程碑跟踪、Sprint 计划。

---

## Layout

```
[Title + Date Range]
[Time Axis Header: W1 | W2 | W3 | W4 | ...]
[Category A]
  [Task 1]  ████████░░░░░░░░
  [Task 2]  ░░░░████████░░░░
[Category B]
  [Task 3]  ░░░░░░░░████████
[Milestones]    ◆         ◆
[Legend / Summary Banner]
```

Horizontal time axis with task bars.

---

## HTML Structure

```html
<div class="wrap">
  <div class="page-title">Project Timeline</div>
  <div class="page-sub">Q1 2026 — Sprint Plan</div>

  <div class="gantt">
    <!-- Time axis header -->
    <div class="gantt-header">
      <div class="gantt-label-col">Task</div>
      <div class="gantt-timeline">
        <div class="gantt-period">W1<br><span class="gantt-date">1/6</span></div>
        <div class="gantt-period">W2<br><span class="gantt-date">1/13</span></div>
        <div class="gantt-period">W3<br><span class="gantt-date">1/20</span></div>
        <div class="gantt-period">W4<br><span class="gantt-date">1/27</span></div>
      </div>
    </div>

    <!-- Category -->
    <div class="gantt-category">Backend</div>

    <!-- Task row -->
    <div class="gantt-row">
      <div class="gantt-label-col">
        <span class="gantt-task-name">API Design</span>
        <span class="gantt-task-owner">{owner_if_supplied}</span>
      </div>
      <div class="gantt-timeline">
        <div class="gantt-bar" style="--start: 0%; --width: 50%; --bar-color: var(--s1);">
          <span class="gantt-bar-text">2 weeks</span>
        </div>
      </div>
    </div>

    <div class="gantt-row">
      <div class="gantt-label-col">
        <span class="gantt-task-name">Database Schema</span>
        <span class="gantt-task-owner">{owner_if_supplied}</span>
      </div>
      <div class="gantt-timeline">
        <div class="gantt-bar" style="--start: 25%; --width: 50%; --bar-color: var(--s2);"></div>
      </div>
    </div>

    <!-- Milestone -->
    <div class="gantt-row milestone">
      <div class="gantt-label-col">
        <span class="gantt-task-name">MVP Release</span>
      </div>
      <div class="gantt-timeline">
        <div class="gantt-diamond" style="--pos: 75%; --color: var(--s4);"></div>
      </div>
    </div>
  </div>

  <div class="banner">On track — <em>3/5 tasks completed</em></div>
</div>
```

---

## CSS

```css
.gantt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--card-bg);
  border: 1px solid var(--border-base);
  border-radius: 10px;
  padding: 14px;
  overflow: hidden;
}

/* Header */
.gantt-header {
  display: flex;
  align-items: flex-end;
  border-bottom: 1.5px solid var(--border-base);
  padding-bottom: 8px;
  margin-bottom: 4px;
}

/* Label column */
.gantt-label-col {
  width: 180px;
  flex-shrink: 0;
  padding-right: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gantt-task-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.gantt-task-owner { font-size: 10px; color: var(--text-muted); }

/* Timeline area */
.gantt-timeline {
  flex: 1;
  display: flex;
  position: relative;
  min-height: 28px;
}
.gantt-header .gantt-timeline {
  min-height: auto;
}
.gantt-period {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  border-left: 1px solid var(--border-base);
  padding: 0 4px;
}
.gantt-period:first-child { border-left: none; }
.gantt-date { font-size: 9px; color: var(--text-muted); font-weight: 400; }

/* Task rows */
.gantt-row {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 2px 0;
}
.gantt-row:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

/* Bar */
.gantt-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: var(--start);
  width: var(--width);
  height: 20px;
  background: var(--bar-color);
  border-radius: 4px;
  opacity: 0.85;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gantt-bar-text {
  font-size: 9px;
  color: #fff;
  font-weight: 600;
}

/* Milestone diamond */
.gantt-diamond {
  position: absolute;
  top: 50%;
  left: var(--pos);
  transform: translate(-50%, -50%) rotate(45deg);
  width: 12px; height: 12px;
  background: var(--color);
}

/* Category label */
.gantt-category {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 6px 0 2px;
  border-top: 1px solid var(--border-base);
  margin-top: 4px;
}
.gantt-category:first-of-type { border-top: none; margin-top: 0; }
```

---

## Variants

### Progress Bars

Show completion percentage with a filled portion:
```css
.gantt-bar.progress::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: var(--progress);
  background: var(--bar-color);
  border-radius: 4px;
  z-index: 0;
}
.gantt-bar.progress {
  opacity: 1;
  overflow: hidden;
  background: color-mix(in srgb, var(--bar-color) 30%, transparent);
}
.gantt-bar.progress .gantt-bar-text {
  position: relative;
  z-index: 1;
}
```

### Dependency Arrows

SVG arrows from one bar's end to another bar's start.

---

## Key Rules

1. **Label column fixed at 180px**: Contains task name + optional owner
2. **Timeline area is flexible**: Divides evenly among time periods
3. **Bars use absolute positioning**: `--start` and `--width` as percentages of timeline area
4. **Milestones are diamonds**: Rotated 45deg squares, positioned on timeline
5. **Alternating row backgrounds**: Very subtle (2% opacity) for readability
6. **Category separators**: Uppercase labels with top border
7. **Color coding**: Different categories or priorities use different bar colors
8. Time periods: 4-8 columns work best visually

---

## Pipeline migration note (theme-decoupling)

Gantt is migrated to the multi-chart pipeline in `experiments/theme-decoupling/chart/gantt/`
(`chart.css` + `body.mjs` + `zh.json`/`en.json` fixtures). The validated pattern supersedes the
snippet above where they differ; the legacy sections remain for the skill's current runtime vocabulary.

Validated structure (all 7 themes × zh/en, `build --render --audit` 70/70 green):

- One grid, subgrid rows: `.gantt` is a two-column grid (`minmax(0, 235px) minmax(0, 1fr)`);
  header and task rows are `grid-template-columns: subgrid` items, so the label column and the
  timeline column stay pixel-identical across the header, every task row and every milestone row.
- Time geometry is data, not CSS: `--period-count` sizes the header ticks; bars inject
  `--bar-start` / `--bar-span` (and partial progress `--bar-pct`) as inline structural vars,
  computed from period units. All three are whitelisted inline properties.
- Bars come in exactly two shapes. Solid (planned-only or 100% complete): `background: var(--tone)`
  with the duration text inside in `var(--t-on-accent)`. Partial: a `color-mix` track (30% tone)
  with a `::before` fill at `--bar-pct`, and the percentage label OUTSIDE the track end — inner
  text would sit on the track mix and fail the contrast audit against the element's declared
  background (the audit resolves computed backgrounds, it cannot see pseudo-element fills).
- Milestones are rotated 45° squares (`transform`, not border-radius), positioned by
  `--bar-start` and tinted via `--tone`; the diamond is exempt from accent-cycling rules that
  apply to text.
- Alternating row shading from the legacy snippet used a literal `rgba` — dropped. Row separation
  comes from the header's bottom border and a leader line on `.gantt-row + .gantt-category`.
- Category labels reuse the label-token stack (`--t-label-*` on `--t-font-data`), so dotted /
  uppercase / tracking treatments follow the theme automatically.
- Copy discipline: the footer text must describe the fixture's real granularity (half-week units
  are legal; "snap to week boundaries" is not, if any bar starts at 0.5).
