# Comparison — 对比表

方案 PK、优劣比较、技术选型、A vs B 对比。

---

## Layout

```
[Title + Subtitle]
[Column A Header]  [Column B Header]
[Item 1 A]         [Item 1 B]
[Item 2 A]         [Item 2 B]
...
[Optional sourced verdict or neutral summary]
```

Two columns side by side, each with its own color theme.

---

## HTML Structure

```html
<div class="wrap">
  <div class="page-title">Redis vs Memcached</div>
  <div class="page-sub">缓存方案选型对比</div>

  <div class="compare-grid">
    <!-- Column A -->
    <div class="compare-col" style="--col-accent: var(--s1);">
      <div class="col-header">
        <span class="col-icon">🔴</span>
        <span class="col-name">Redis</span>
        <span class="badge recommend">Preferred</span>  <!-- only when the user's criteria support it -->
      </div>
      <div class="col-items">
        <div class="compare-item">
          <div class="item-label">数据类型</div>
          <div class="item-value">String, Hash, List, Set, ZSet, Stream</div>
        </div>
        <div class="compare-item">
          <div class="item-label">持久化</div>
          <div class="item-value win">✓ RDB + AOF</div>
        </div>
        <!-- ... more items -->
      </div>
    </div>

    <!-- Column B -->
    <div class="compare-col" style="--col-accent: var(--s3);">
      <div class="col-header">
        <span class="col-icon">🟢</span>
        <span class="col-name">Memcached</span>
      </div>
      <div class="col-items">
        <div class="compare-item">
          <div class="item-label">数据类型</div>
          <div class="item-value">String only</div>
        </div>
        <div class="compare-item">
          <div class="item-label">持久化</div>
          <div class="item-value lose">✗ 无</div>
        </div>
      </div>
    </div>
  </div>

  <div class="banner">
    Summary: use only trade-offs and criteria supplied by the user.
  </div>
</div>
```

---

## CSS

```css
.compare-grid {
  display: flex;
  gap: 12px;
}
.compare-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.col-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--card-bg);
  border: 1.5px solid var(--col-accent);
  font-weight: 700;
  font-size: 16px;
}
.col-icon { font-size: 18px; }
.col-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.compare-item {
  background: var(--card-bg);
  border: 1px solid var(--border-base);
  border-radius: 8px;
  padding: 10px 14px;
}
.item-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.item-value {
  font-size: 13px;
  color: var(--text-primary);
}
.item-value.win { color: var(--success, #4a8c5c); font-weight: 600; }
.item-value.lose { color: var(--text-muted); }

.badge.recommend {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(74, 140, 92, 0.1);
  color: var(--success, #4a8c5c);
  border: 1px solid rgba(74, 140, 92, 0.3);
  margin-left: auto;
}
```

---

## Variants

### 3-Column Comparison

For comparing 3 options:
```css
.compare-grid { display: flex; gap: 10px; }
.compare-col { flex: 1; }
```

Card padding reduces to `10px 12px` for 3 columns.

### Pros/Cons List

When comparing pros and cons of a single topic:
- Left column = Pros (green accent)
- Right column = Cons (red accent)
- Each item is a bullet point, not label+value

---

## Key Rules

1. **Two columns must be equal width** (`flex: 1`) — comparison demands visual symmetry
2. Items in both columns should **align by topic** — same labels in same order
3. Win/lose markers: Use ✓/✗ or colored text, not elaborate badges
4. **Recommendation badge** only when the user asks for a choice and supplies decision criteria
5. Bottom banner may summarize sourced trade-offs; do not invent a winner
6. Column headers use different accent colors from the style's palette
7. Gap between columns: 10-12px, never less than 8px
