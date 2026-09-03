# Dashboard — 数据看板

数字指标汇总、统计报表、KPI 面板、监控概览。

---

## Layout

```
[Title + Subtitle]
[Stat Card 1] [Stat Card 2] [Stat Card 3] [Stat Card 4]
[Detail Section A]           [Detail Section B]
[Summary Banner]
```

Top row of hero numbers, followed by detail sections.

---

## HTML Structure

```html
<div class="wrap">
  <div class="page-title">Weekly Performance Report</div>
  <div class="page-sub">2026-03-24 — 2026-03-30</div>

  <!-- Hero stats row -->
  <div class="stats">
    <div class="stat-card" style="--accent: var(--s1);">
      <div class="stat-num">12,847</div>
      <div class="stat-label">Total Users</div>
      <div class="stat-trend up">↑ 12.3%</div>
    </div>
    <div class="stat-card" style="--accent: var(--s3);">
      <div class="stat-num">98.7%</div>
      <div class="stat-label">Uptime</div>
      <div class="stat-trend stable">— 0.1%</div>
    </div>
    <div class="stat-card" style="--accent: var(--s5);">
      <div class="stat-num">247ms</div>
      <div class="stat-label">Avg Latency</div>
      <div class="stat-trend down">↓ 8.5%</div>
    </div>
    <div class="stat-card" style="--accent: var(--s2);">
      <div class="stat-num">¥89.2K</div>
      <div class="stat-label">Revenue</div>
      <div class="stat-trend up">↑ 23.1%</div>
    </div>
  </div>

  <!-- Detail sections -->
  <div class="detail-grid">
    <div class="detail-card">
      <div class="detail-title">Top Pages</div>
      <div class="detail-list">
        <div class="detail-row">
          <span class="detail-name">/dashboard</span>
          <span class="detail-value">3,421</span>
        </div>
        <!-- ... more rows ... -->
      </div>
    </div>
    <div class="detail-card">
      <div class="detail-title">Error Distribution</div>
      <!-- ... -->
    </div>
  </div>

  <div class="banner">Overall: <em>Healthy</em> — All KPIs within target range</div>
</div>
```

---

## CSS

```css
/* Hero stats */
.stats {
  display: flex;
  gap: 10px;
}
.stat-card {
  flex: 1;
  background: var(--card-bg);
  border-radius: 10px;
  border: 1.5px solid var(--border-base);
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
.stat-num {
  font-size: 28px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.stat-trend {
  font-size: 11px;
  margin-top: 4px;
  font-weight: 600;
}
.stat-trend.up { color: var(--success, #4a8c5c); }
.stat-trend.down { color: var(--critical, #b83232); }
.stat-trend.stable { color: var(--text-muted); }

/* Detail sections */
.detail-grid {
  display: flex;
  gap: 10px;
}
.detail-card {
  flex: 1;
  background: var(--card-bg);
  border: 1px solid var(--border-base);
  border-radius: 10px;
  padding: 14px 16px;
}
.detail-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--text-primary);
}
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border-base);
}
.detail-row:last-child { border-bottom: none; }
.detail-name { color: var(--text-secondary); }
.detail-value { font-weight: 600; color: var(--text-primary); }
```

---

## Variants

### Mini Bar Charts

For visual data representation within cards:
```html
<div class="mini-bar" style="--bar-pct: 75%; --bar-color: var(--s1);"></div>
```
```css
.mini-bar {
  height: 6px;
  background: var(--border-base);
  border-radius: 3px;
  position: relative;
  margin-top: 4px;
}
.mini-bar::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: var(--bar-pct);
  background: var(--bar-color);
  border-radius: 3px;
}
```

### Status Indicators

```css
.status-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.status-dot.green { background: var(--success); }
.status-dot.red { background: var(--critical); }
.status-dot.yellow { background: var(--minor); }
```

---

## Key Rules

1. **Hero stats row always on top**: 3-5 stat cards, equal width (`flex: 1`)
2. **Top accent bar**: 3px colored strip on stat cards for visual punch
3. **Trend indicators**: show direction and percentage only when both are supplied
4. **Detail sections below**: 2-3 equal columns with list data
5. **Number formatting**: Large numbers with commas (12,847), percentages with 1 decimal (98.7%)
6. **Card gap**: 10px between stat cards, 10px between detail cards
7. Bottom banner summarizes only status present in the source

---

## Pipeline migration note (theme-decoupling)

Dashboard is migrated to the multi-chart pipeline in `experiments/theme-decoupling/chart/dashboard/`
(`chart.css` + `body.mjs` + `zh.json`/`en.json` fixtures). The validated pattern supersedes the
snippet above where they differ; the legacy sections remain for the skill's current runtime vocabulary.

Validated structure (all themes × zh/en, `build --render --audit` 56/56 green):

- One uniform DOM: `.metrics.dash-grid` KPI row (`--stat-count` structural var) + `.dash-panels`
  detail row (`--panel-count`), so both locales and all themes share one fingerprint. The
  `.dash-grid` override comes later in the cascade than the shared 3-column `.metrics` rule.
- KPI cards reuse the shared `.metric` anatomy (accent top bar, `--metric-accent` tint, data-font
  value) plus a `.metric-trend` row: a monochrome `trend-up`/`trend-down`/`trend-flat` SVG icon and
  the delta text. Trend direction is encoded by icon shape and the +/- sign, never by color —
  semantic green/red would break theme orthogonality.
- Detail panels follow the shared card anatomy with a `--tone`-tinted background and 4px top bar;
  each row is name → dotted leader → tabular `panel-value` (same leader pattern as comparison).
- Progress bars inject data through the `--bar-pct` structural var (whitelisted inline); the track
  is `color-mix(in srgb, var(--tone) 16%, var(--t-surface))` so the fill/track pairing adapts to
  every theme without literal colors.
- Trend values and panel values use `font-variant-numeric: tabular-nums` for column-stable digits.
- Themes must keep all 5 accents distinct ON THEIR OWN surfaces: a grey-blue
  accent-3/accent-6 pair once read as one color inside a 4-up KPI row, so accent-3 moved to warm sand
  (#d4a763) — adjacent KPI cards are the strictest accent-identity test in the suite.
