# paper — 手绘纸质感

**Tone**: 亲切、教学、手工感
**Best for**: 教学说明、操作手册、笔记风格、知识整理、入门教程
**Layout**: Compact, symmetric, full (same as all styles)
**Background color**: `#f5f0e6`

---

## Font Stack

```css
font-family: 'Caveat', 'LXGW WenKai', cursive;            /* titles, annotations */
font-family: 'Nunito', 'Noto Sans SC', sans-serif;       /* body */
```

Display/title: `'Caveat', 'LXGW WenKai', cursive` — weight 700 (handwritten feel)
Body: `'Nunito', 'Noto Sans SC', sans-serif` — weight 400-600
Annotations: `'Caveat', cursive` — weight 400

**Embedded at build time**: the pipeline loads these faces from npm (`@fontsource/caveat` 400/700, `@fontsource/nunito`, `@fontsource/lxgw-wenkai` 700 for the CJK handwriting, `@fontsource/noto-sans-sc`), subsets them to the chart's actual copy, and inlines them as data-URI `@font-face` — zero network requests, identical rendering on any machine.

---

## CSS Variables

```css
:root {
  --bg: #f5f0e6;
  --card-bg: #fffdf7;
  --text-primary: #3a3228;
  --text-secondary: #6a5e50;
  --text-muted: #a09480;
  --border-base: #d0c4aa;
  --border-sketch: #8a7e68;
  --accent-red: #c0392b;
  --accent-blue: #2e6da4;
  --accent-green: #27864a;
  --accent-orange: #d4820a;
  --pencil-gray: #8a7e68;
  --accent: var(--accent-blue);
  --arrow-color: var(--pencil-gray);
  --s1: #2e6da4;
  --s2: #27864a;
  --s3: #d4820a;
  --s4: #c0392b;
  --s5: #7b5aa6;
  --s6: #8a6a3e;
  --s7: #3f7c78;
  --success: #27864a;
  --minor: #d4820a;
  --critical: #c0392b;
}
```

---

## Base Layout

```css
body {
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  background: var(--bg);
  /* Paper texture via repeating gradient */
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(180, 170, 150, 0.12) 27px, rgba(180, 170, 150, 0.12) 28px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 24px 20px;
  color: var(--text-primary);
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

### Title (handwritten)
```css
.page-title {
  font-family: 'Caveat', 'ZCOOL XiaoWei', cursive;
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}
.page-sub {
  font-family: 'Caveat', cursive;
  font-size: 18px;
  color: var(--text-secondary);
}
```

### Card (notebook style)
```css
.card {
  background: var(--card-bg);
  border: 1.5px dashed var(--border-base);
  border-radius: 4px;
  padding: 14px 16px;
  position: relative;
}
```

### Sketch Border Card (hand-drawn effect)
```css
.card.sketch {
  border: 2px solid var(--border-sketch);
  border-radius: 2px;
  /* Slight rotation for hand-drawn feel (very subtle) */
  transform: rotate(-0.3deg);
}
```

### Annotation (margin note)
```css
.annotation {
  font-family: 'Caveat', cursive;
  font-size: 14px;
  color: var(--accent-red);
  transform: rotate(-2deg);
}
```

### Pencil Arrow (between steps)
```html
<div style="display:flex;align-items:center;justify-content:center;height:28px;">
  <svg width="24" height="26" viewBox="0 0 24 26" fill="none">
    <path d="M12 2 C11 8, 13 14, 12 18" stroke="#8a7e68" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M7 16 L12 24 L17 16" stroke="#8a7e68" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>
</div>
```

### Number Badge (circled number)
```css
.num-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border-sketch);
  font-family: 'Caveat', cursive;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
```

### Highlight Box
```css
.highlight-box {
  background: rgba(212, 130, 10, 0.1);
  border-left: 3px solid var(--accent-orange);
  padding: 10px 14px;
  border-radius: 2px;
  font-size: 13px;
}
```

### Banner
```css
.banner {
  background: var(--card-bg);
  border: 2px solid var(--border-sketch);
  border-radius: 4px;
  padding: 14px 24px;
  text-align: center;
  color: var(--text-primary);
  font-family: 'Caveat', cursive;
  font-size: 18px;
}
```

---

## Design Rules

- **Handwritten titles**: Caveat font gives a personal, notebook feel
- **Dashed borders**: Default card borders are dashed (notebook style)
- **Paper texture**: Subtle horizontal ruled lines on background
- **Pencil-style arrows**: Slightly curved SVG paths, round caps (not geometric)
- **Warm off-white cards**: `#fffdf7` on `#f5f0e6` background
- **Red annotations**: Handwritten red notes for emphasis (like a teacher's markup)
- **Very small border-radius**: 2-4px (notebooks don't have rounded corners)
- **Subtle rotations**: 0.3-2deg rotation on annotations and sketch cards for organic feel

---

## Special Effects

- Ruled-line paper texture on background (via repeating-linear-gradient)
- Dashed borders on cards
- Slight rotation on annotation text
- Curved pencil-stroke arrows (SVG with quadratic curves)
- Circled numbers for steps (hand-drawn feel)
