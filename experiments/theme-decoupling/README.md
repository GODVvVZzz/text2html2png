# Theme / chart orthogonality proof

Status: **PASS**

This experiment validates the architectural claim the whole skill stands on:

> Any chart can keep one semantic DOM and one structural CSS file while five themes change only a canonical `:root` token block.

It started as a narrow proof on the comparison chart and now covers every chart type: each chart ships a bilingual fixture pair in `chart/<id>/`, and every chart × theme × locale document is built and fingerprint-checked on CI.

It is a development proof, not a change to the default user output. The skill now produces HTML by default; the PNGs generated here exist only for visual theme review.

## Subject and design direction

The fixture compares the skill's two output modes:

- editable HTML, the default;
- high-resolution PNG, exported only when explicitly requested.

The Chinese fixture is the primary visual baseline. It restores the dense horizontal reading rhythm from the original design references: large data, a criteria rail, leader lines, equal comparison columns, and a compact conclusion band. The English fixture uses the identical DOM to test longer labels and prose.

The five themes are deliberately different visual languages:

| Theme | Direction |
|---|---|
| `warm` | warm archive folio |
| `minimal` | Swiss-style ink grid |
| `editorial` | journal folio |
| `paper` | functional field notebook; handwriting is limited to display text |
| `glass` | optical proof sheet with cobalt, teal, and amber |

Two development-only themes (`dark`, `neon`) were removed from the shipping skill; the proof now tracks the five that ship.

## Boundary

- `themes/*.css` contains exactly one `:root` rule and no chart selectors.
- Each `charts/<chart>/chart.css` in the skill pipeline owns layout and references theme values only through `var(--t-*)`.
- Inline SVG uses `currentColor`; no literal SVG fills or strokes are allowed.
- The DOM contains emoji and SVG alternatives. `warm` and `glass` show emoji by default, the other themes show monochrome SVG, and the two channels are structurally equivalent.
- Font families, radii, shadows, backdrop effects, and every literal colour belong to the theme.
- Restyling atomically replaces only `<style id="text2html2png-theme">...</style>`.

Every theme exposes the same **52 tokens**.

## Proof results

- 5/5 themes pass the identical token-set check (52 tokens).
- Theme files contain no component selectors.
- Structural CSS contains no literal colours.
- All nine chart types ship bilingual fixtures; 90 documents (9 charts × 5 themes × 2 locales) build through the same pipeline.
- Chinese and English variants of every chart share the same DOM structure fingerprint, and each chart keeps one non-theme source hash across themes.
- CI runs the source validation, the fingerprint and restyle tests, and a full HTML build on every push.
- The original comparison-only proof passed a strict browser layout audit (14/14 files, PNGs at 2×); the published gallery's 20 renderings pass the same strict audit on every build.
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
  --html ../theme-decoupling-output/comparison-zh-warm.html \
  --theme editorial \
  --out ../theme-decoupling-output/comparison-zh-restyled-editorial.html
```

## Decision

The hypothesis is validated and promoted: the theme token contract now lives in the skill pipeline, every chart type ships through it, and CI enforces the token, fingerprint, and restyle invariants on every push. Existing privacy, layout-audit, gallery, and CI systems remain reusable.
