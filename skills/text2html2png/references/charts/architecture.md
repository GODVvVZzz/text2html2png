# Architecture — 架构拓扑

系统组件、服务依赖、模块划分、网络拓扑、微服务架构。

---

## Layout

```
[Title]
[Layer Label]  [Node A] [Node B] [Node C]
               ├────────┼────────┤
[Layer Label]  [Node D] [Node E]
               ├────────┤
[Layer Label]  [Node F]
[Banner]
```

Top-down layered architecture with nodes and connectors between layers.

---

## HTML Structure

**Critical**: Layer labels must use flex row layout inside `.wrap`. Never use `position: absolute` for labels — they will render outside the viewport on screenshot.

```html
<div class="wrap">
  <div class="page-title">System Architecture</div>
  <div class="page-sub">Microservices Overview</div>

  <!-- Layer 1 -->
  <div class="layer">
    <div class="layer-tag">Access</div>
    <div class="layer-nodes">
      <div class="node" style="--node-color: var(--accent-blue, var(--s3));">
        <div class="node-icon">🌐</div>
        <div class="node-name">API Gateway</div>
        <div class="node-desc">Rate limiting, auth</div>
      </div>
      <div class="node" style="--node-color: var(--accent-blue, var(--s3));">
        <div class="node-icon">📱</div>
        <div class="node-name">Mobile BFF</div>
        <div class="node-desc">iOS/Android adapter</div>
      </div>
    </div>
  </div>

  <!-- Connector row -->
  <div class="conn-row">
    <div class="conn-spacer"></div>
    <div class="conn-center">
      <svg width="200" height="28" viewBox="0 0 200 28">
        <line x1="60" y1="0" x2="60" y2="20" stroke="currentColor" stroke-width="1.5"/>
        <line x1="140" y1="0" x2="140" y2="20" stroke="currentColor" stroke-width="1.5"/>
        <path d="M55 18l5 8 5-8" fill="currentColor"/>
        <path d="M135 18l5 8 5-8" fill="currentColor"/>
      </svg>
    </div>
  </div>

  <!-- Layer 2 -->
  <div class="layer">
    <div class="layer-tag">Service</div>
    <div class="layer-nodes">
      <div class="node" style="--node-color: var(--s4);">...</div>
      <div class="node" style="--node-color: var(--s4);">...</div>
      <div class="node" style="--node-color: var(--s4);">...</div>
    </div>
  </div>

  <!-- ... more layers ... -->

  <div class="banner">Deployed on Kubernetes with auto-scaling</div>
</div>
```

---

## CSS

```css
.layer {
  display: flex;
  align-items: center;
}
.layer-tag {
  width: 52px;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: right;
  padding-right: 10px;
  line-height: 1.3;
}
.layer-nodes {
  flex: 1;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.node {
  background: var(--card-bg);
  border: 1.5px solid var(--node-color);
  border-radius: 10px;
  padding: 12px 14px;
  text-align: center;
  min-width: 120px;
  max-width: 180px;
}
.node-icon { font-size: 20px; margin-bottom: 4px; }
.node-name { font-size: 13px; font-weight: 700; }
.node-desc { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }

/* Connector row */
.conn-row {
  display: flex;
  align-items: center;
}
.conn-spacer {
  width: 52px;
  flex-shrink: 0;
}
.conn-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 4px 0;
  color: var(--border-base);
}
```

---

## Variants

### Single-Column Stack

For simple 3-layer architectures, skip layer labels and center everything:

```css
.layer { justify-content: center; }
.layer-tag { display: none; }
```

### Node Groups

Group related nodes with a subtle background:
```css
.node-group {
  background: rgba(0,0,0,0.03);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  gap: 8px;
}
```

### Protocol Labels on Connectors

Add labels supplied by the user, such as protocols, beside connector lines. Derive `x` from the actual connector center:
```html
<text x="{connector_center_x}" y="14" text-anchor="middle" font-size="9" fill="var(--text-muted)">{protocol}</text>
```

---

## Key Rules

1. **Layer tags inside `.wrap`**: Use flex layout with 52px left column for tags — NEVER absolute positioning
2. **Connector row matches layer structure**: Same `conn-spacer` (52px) + `conn-center` pattern
3. **Nodes centered within each layer**: `justify-content: center` on `.layer-nodes`
4. **Consistent node width**: Use `min-width`/`max-width` to keep nodes similar sizes
5. **Color by layer**: All nodes in same layer share one accent color
6. **SVG connectors**: Lines + arrowheads, color matches `--border-base` or accent for key paths
7. Layer gap: 0 (connectors handle spacing)
8. **Connectors follow the universal rule** (see `design-philosophy.md` → Connectors & Labels): arrows must always be complete; labels go beside the arrow, not overlapping it; use `min-height` + `padding` on `.conn-center`, not fixed `height`

---

## Pipeline migration note (theme-decoupling)

Architecture is migrated to the multi-chart pipeline in `experiments/theme-decoupling/chart/architecture/`
(`chart.css` + `body.mjs` + `zh.json`/`en.json` fixtures). The validated pattern supersedes the
snippet above where they differ; the legacy sections remain for the skill's current runtime vocabulary.

Validated structure (all 7 themes × zh/en, `build --render --audit` 84/84 green):

- `.arch` stacks layers and connector rows; each is the same two-column grid
  (`88px minmax(0, 1fr)`), so layer tags and connectors share one fixed gutter and everything
  stays inside the viewport (no absolute positioning).
- Per-layer accent via `--tone`: node cards tint their background with `color-mix(in srgb,
  var(--tone) 6%, var(--t-surface-strong))` and their border with a 60% tone mix — 45% was too
  faint on light glass surfaces. Nodes are `flex: 1 1 0` with a max-width, so every layer's cards
  are equal width regardless of node count.
- The connector is one measurement-free vertical stem + solid arrowhead SVG (stroke/fill on
  `currentColor`, `.conn-center` colored by `--t-rule`), centered in the timeline column; the
  protocol label sits BESIDE the arrow, never on it.
- Protocol labels are data, not labels: `.conn-label` uses the label font/size/weight/tracking
  tokens but NO `text-transform` — the theme uppercase treatment turned "gRPC" into "GRPC" and
  proper nouns must survive verbatim.
- Do not wrap connector rows in `aria-hidden`: the audit fails visible text inside hidden
  subtrees (WARN throws in strict mode). The decorative SVG carries its own `aria-hidden`.
- Layer accents must differ in hue family per theme — dark's grey-blue accent-6 read as the same
  color as accent-1 on tinted card borders, so accent-6 moved to magenta (#c77bd8). Thin tinted
  borders are a stricter accent-identity test than large text blocks.
