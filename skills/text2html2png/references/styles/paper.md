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
  /* Base — ruled-notebook paper: horizontal pencil-grey lines at a 27px
     pitch, showing through the translucent note cards. */
  --bg: #f5f0e6;
  --bg-texture: repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(138, 126, 104, 0.14) 27px, rgba(138, 126, 104, 0.14) 28px);
  --card-bg: rgba(255, 255, 255, 0.72);
  --text-primary: #332b22;
  --text-secondary: #625747;
  --text-muted: #7d6f5c;
  --border-base: #c4b896;
  --border-style: dashed;   /* every edge is a hand-ruled dashed line */
  --border-width: 2px;
  --node-border: var(--border-base);
  --arrow-color: #c4b896;
  --accent: #2d5a87;
  --accent-red: #8b3a3a;
  --accent-blue: #2d5a87;
  --accent-green: #2f7650;
  --accent-orange: #96560f;
  --pencil-gray: #8a7e68;
  --banner-bg: #fff9e6;
  --rule-color: #c4b896;

  /* Step accent colors (cycle through).
     Blue and red are the red-pen/navy anchors of the palette; orange sits
     several steps darker than the classic value because accents double as
     white-text backgrounds (gantt bars) and these are the brightest values
     that still pass the 4.5:1 contrast gate. */
  --s1: #2d5a87;   /* notebook blue */
  --s2: #2f7650;   /* marker green */
  --s3: #96560f;   /* burnt ochre */
  --s4: #8b3a3a;   /* red pen */
  --s5: #6b5685;   /* pencil purple */
  --s6: #765633;   /* walnut brown */
  --s7: #376f6a;   /* ink teal */

  /* Semantic */
  --critical: #8b3a3a;
  --major: #96560f;
  --minor: #765633;
  --success: #2f7650;
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
  border: 2px dashed var(--border-base);
  border-radius: 6px;
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
  background: var(--banner-bg);
  border: 2px dashed var(--border-base);
  border-radius: 4px;
  padding: 14px 24px;
  text-align: center;
  color: var(--text-primary);
  font-family: 'Caveat', cursive;
  font-size: 18px;
}
.banner em { color: var(--accent-red); font-style: normal; font-weight: 700; }
```

---

## Design Rules

- **Handwritten titles**: Caveat font gives a personal, notebook feel
- **Dashed borders**: Default card borders are dashed (notebook style)
- **Paper texture**: Subtle horizontal ruled lines on background
- **Pencil-style arrows**: Slightly curved SVG paths, round caps (not geometric)
- **Warm off-white cards**: `#fffdf7` on `#f5f0e6` background
- **Red annotations**: Handwritten red notes for emphasis (like a teacher's markup)
- **Very small border-radius**: 4-6px (notebooks don't have rounded corners)
- **Subtle rotations**: 0.3-2deg rotation on annotations and sketch cards for organic feel

---

## Special Effects

- Ruled-line paper texture on background (via repeating-linear-gradient)
- Dashed borders on cards
- Slight rotation on annotation text
- Curved pencil-stroke arrows (SVG with quadratic curves)
- Circled numbers for steps (hand-drawn feel)
