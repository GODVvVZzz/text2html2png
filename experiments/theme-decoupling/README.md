# Theme / chart orthogonality proof

Status: **PASS**

This experiment validates one narrow architectural claim before the other seven chart types are migrated:

> A comparison chart can keep one semantic DOM and one structural CSS file while seven themes change only a canonical `:root` token block.

It is a development proof, not a change to the default user output. The skill now produces HTML by default; the PNGs generated here exist only for visual theme review.

## Subject and design direction

The fixture compares the skill's two output modes:

- editable HTML, the default;
- high-resolution PNG, exported only when explicitly requested.

The Chinese fixture is the primary visual baseline. It restores the dense horizontal reading rhythm from the original design references: large data, a criteria rail, leader lines, equal comparison columns, and a compact conclusion band. The English fixture uses the identical DOM to test longer labels and prose.

The seven themes are deliberately different visual languages:

| Theme | Direction |
|---|---|
| `warm` | warm archive folio |
| `dark` | technical graphite |
| `minimal` | Swiss-style ink grid |
| `editorial` | journal folio |
| `neon` | phosphor signal lab, without purple/pink AI gradients |
| `paper` | functional field notebook; handwriting is limited to display text |
| `glass` | optical proof sheet with cobalt, teal, and amber |

## Boundary

- `themes/*.css` contains exactly one `:root` rule and no chart selectors.
- `chart/comparison.css` owns layout and references theme values only through `var(--t-*)`.
- Inline SVG uses `currentColor`; no literal SVG fills or strokes are allowed.
- The DOM contains emoji and SVG alternatives. Theme tokens show emoji by default; strict cross-platform mode can show the SVG without changing structure.
- Font families, radii, shadows, backdrop effects, and every literal colour belong to the theme.
- Restyling atomically replaces only `<style id="text2html2png-theme">...</style>`.

Every theme exposes the same **47 tokens**.

## Proof results

- 7/7 themes pass the identical token-set check.
- Theme files contain no component selectors.
- Structural CSS contains no literal colours.
- Chinese variants share one non-theme source hash: `b4442715614d...`.
- English variants share one non-theme source hash: `7221a7e3b50c...`.
- Chinese and English variants share the same DOM structure fingerprint.
- 14/14 generated HTML files pass the strict browser layout audit.
- 14 development PNGs were rendered at 2× for human review.
- `restyle.mjs` changes only the canonical theme block and validates the result.

The first audit caught English metric prose at 10.5px; it was raised to 12px. Human review then caught spaces disappearing around `<strong>` inside flex cells; the text is now wrapped as one inline flow. Both defects are covered by the final generated proof.

## Commands

Validate source orthogonality:

```bash
node experiments/theme-decoupling/scripts/validate-orthogonality.mjs
```

Build HTML only, matching the product's default behavior:

```bash
node experiments/theme-decoupling/scripts/build.mjs
```

Run the development visual proof:

```bash
node experiments/theme-decoupling/scripts/build.mjs --audit --render --scale 2
```

Outputs are written outside the repository to `../theme-decoupling-output/`.

Restyle one generated HTML file:

```bash
node experiments/theme-decoupling/scripts/restyle.mjs \
  --html ../theme-decoupling-output/zh-warm.html \
  --theme neon \
  --out ../theme-decoupling-output/zh-restyled-neon.html
```

## Decision

The narrow hypothesis is validated. The recommended next phase is to promote the theme token contract into the canonical skill, align `references/charts/comparison.md` with this single structure, then migrate the remaining chart types one at a time. Existing privacy, layout-audit, gallery, and CI systems remain reusable.
