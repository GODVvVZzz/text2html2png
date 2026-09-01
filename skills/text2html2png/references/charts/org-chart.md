# Org Chart — 组织架构图

团队结构、汇报关系、分类层级、部门划分。

---

## Layout

```
[Title]
           [CEO]
          /     \
     [VP Eng]  [VP Product]
     /    \        |
[Team A] [Team B] [Team C]
```

Tree structure with top-down hierarchy and vertical connectors.

---

## HTML Structure

```html
<div class="wrap">
  <div class="page-title">Engineering Organization</div>
  <div class="page-sub">Q1 2026 Structure</div>

  <div class="org-tree">
    <!-- Level 1 (root) -->
    <div class="org-level">
      <div class="org-node root" style="--node-accent: var(--s1);">
        <div class="org-avatar">👤</div>
        <div class="org-info">
          <div class="org-name">{root_name}</div>
          <div class="org-role">{root_role}</div>
          <div class="org-meta">{root_meta_if_supplied}</div>
        </div>
      </div>
    </div>

    <!-- Illustrative two-child connector. Derive x positions from actual child centers. -->
    <div class="org-connector">
      <svg width="400" height="28" viewBox="0 0 400 28">
        <line x1="200" y1="0" x2="200" y2="14" stroke="currentColor" stroke-width="1.5"/>
        <line x1="100" y1="14" x2="300" y2="14" stroke="currentColor" stroke-width="1.5"/>
        <line x1="100" y1="14" x2="100" y2="28" stroke="currentColor" stroke-width="1.5"/>
        <line x1="300" y1="14" x2="300" y2="28" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </div>

    <!-- Level 2 -->
    <div class="org-level">
      <div class="org-node" style="--node-accent: var(--s3);">
        <div class="org-avatar">👤</div>
        <div class="org-info">
          <div class="org-name">{child_1_name}</div>
          <div class="org-role">{child_1_role}</div>
          <div class="org-meta">{child_1_meta_if_supplied}</div>
        </div>
      </div>
      <div class="org-node" style="--node-accent: var(--s5);">
        <div class="org-avatar">👤</div>
        <div class="org-info">
          <div class="org-name">{child_2_name}</div>
          <div class="org-role">{child_2_role}</div>
          <div class="org-meta">{child_2_meta_if_supplied}</div>
        </div>
      </div>
    </div>

    <!-- ... more levels ... -->
  </div>

  <!-- Add a totals banner only when the source supplies totals. -->
</div>
```

---

## CSS

```css
.org-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.org-level {
  display: flex;
  justify-content: center;
  gap: 14px;
}

.org-node {
  background: var(--card-bg);
  border: 1.5px solid var(--node-accent, var(--border-base));
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
  max-width: 220px;
}
.org-node.root {
  border-width: 2px;
  padding: 14px 18px;
}

.org-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.org-info { display: flex; flex-direction: column; gap: 1px; }
.org-name { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.org-role { font-size: 11px; color: var(--text-secondary); }
.org-meta { font-size: 10px; color: var(--text-muted); }

/* Connectors */
.org-connector {
  display: flex;
  justify-content: center;
  height: 28px;
  color: var(--border-base);
}
```

---

## Connector SVG Logic

The connector SVG adapts to the number of children:

**1 child**: Single vertical line
```svg
<line x1="center" y1="0" x2="center" y2="28"/>
```

**2 children**: T-shape
```svg
<line x1="center" y1="0" x2="center" y2="14"/>  <!-- stem -->
<line x1="left" y1="14" x2="right" y2="14"/>    <!-- bar -->
<line x1="left" y1="14" x2="left" y2="28"/>     <!-- left drop -->
<line x1="right" y1="14" x2="right" y2="28"/>   <!-- right drop -->
```

**3+ children**: Extended bar with multiple drops

The `x` positions should align with the center of each child node below.

---

## Variants

### Compact Cards

For large organizations, use smaller cards:
```css
.org-node.compact {
  padding: 8px 12px;
  min-width: 120px;
}
.org-node.compact .org-avatar { font-size: 18px; }
.org-node.compact .org-name { font-size: 12px; }
.org-node.compact .org-role { font-size: 10px; }
```

### Team Grouping

Group leaf nodes under a team label:
```html
<div class="org-team-group">
  <div class="org-team-label">Frontend Team (4)</div>
  <div class="org-level compact">
    <div class="org-node compact">...</div>
    <div class="org-node compact">...</div>
  </div>
</div>
```

### Department Colors

Each department branch uses a consistent accent color:
- Engineering: blue family
- Product: green family
- Design: purple family
- Operations: orange family

---

## Key Rules

1. **Center-aligned tree**: All levels centered, connectors centered
2. **Root node is visually distinct**: Thicker border (2px), slightly larger padding
3. **Avatar + info side by side**: flex row, not stacked
4. **Node gap**: 14px between siblings at same level
5. **Connector lane**: Minimum 28px with 1.5px lines; grow when labels or wrapped nodes require it
6. **Max 4 levels deep**: Beyond that, use compact variant or group leaf nodes
7. **Consistent node width**: use a shared minimum, but derive connector centers from final rendered widths
8. **Color by department**: Same branch shares accent color
