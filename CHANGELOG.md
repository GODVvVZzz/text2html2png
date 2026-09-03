# Changelog

All notable changes to the public project will be documented here.

## [Unreleased]

### Added

- Post-render layout audit (`scripts/audit-layout.mjs`): measures the rendered page in a real browser and fails on content pushed outside the capture area, clipped or truncated text, connectors escaping their `viewBox`, type below 10px, low contrast, colliding labels, empty filler boxes, and unreadable aspect ratios. Every finding reports the element, the measured evidence, and one repair.
- Example manifest (`examples/<id>.meta.json`) plus per-locale fixtures (`examples/<id>/{zh,en}.json`) as the single source of truth for each published example, and `scripts/build-examples.mjs` for manifest validation, strict layout auditing, and reproducible re-rendering of every bilingual example.
- Six new synthetic examples on top of the original three, bringing coverage to 9 examples across all 8 chart types and all 7 visual themes: a minimal plan comparison, an editorial roadmap timeline, a glass support dashboard, a neon signup funnel, a paper conference Gantt chart, and a warm org chart.
- Published gallery at `docs/index.html`, generated from the manifest together with the prompt index, so the site, the Markdown, and the committed images cannot drift apart.
- 1280×640 social preview card, rendered by the skill's own renderer from committed HTML.
- Animated README strip built from six real committed renderings.
- `PRIVACY.md` and a dark logo variant, both previously referenced by the plugin manifest but missing.
- Theme/chart orthogonality proof: one comparison structure, 45 identical theme tokens, Chinese and English fixtures, atomic restyling, and strict 2×7 visual validation.
- A ninth chart type, the `narrative` brief: one page that lays a whole document out — decisions as accent cards, a process strip, an impact table, a risk callout, and ✓/✕ acceptance lists. Ships with a bilingual `cafe-membership` example, bringing coverage to 10 published examples across all 9 chart types and 63 chart×theme pairings.
- An emoji icon channel in the warm, glass, neon, and dark themes, mutually exclusive with the inline-SVG slots so a diagram shows exactly one icon language; empty emoji slots collapse instead of leaving a gap.

### Changed

- HTML is now the default user deliverable. PNG export runs only when the user explicitly requests PNG, an image, a screenshot, or passes `--png`.
- `npm run check` now also validates the example manifest and layout-audits every published example.
- Step 6 of the skill workflow requires the layout audit before human review, with the full rule table.
- The link checker validates `.codex-plugin/plugin.json` asset and privacy-policy paths, not only Markdown links.
- Plugin screenshots point at the canonical gallery renderings instead of duplicated copies.
- READMEs rewritten around the differentiating chart types, with the quality-enforcement mechanism stated explicitly and an honest "use something else when" table.

### Fixed

- The layout audit passed two classes of genuinely broken output: text buried under an opaque element, and text whose colour matched its background. Added `TEXT_OCCLUDED` (hit-tests each text box against what is drawn on top) and `TEXT_INVISIBLE` (contrast below 1.6:1 is an error, not a warning).
- The layout audit reported false failures on ordinary cards: a decorative shape clipped by its own container was read as cropped text, and an element already clipped by an ancestor was read as escaping the capture area. Clipping is now measured from the element's own text runs, elements with a clipping ancestor are skipped, and positioned decoration is exempt from the filler rule.
- `check:layout` now runs with `--strict`, so the warnings the documentation claims are absent are actually enforced.
- Removed `allowNetwork` from the configuration schema: no configuration file should be able to turn on network access, and the privacy policy said so.
- The `generated-docs` CI job imported the renderer even when only regenerating text, so it failed on a checkout without installed dependencies.
- Browser-dependent tests now skip when Chrome is present but cannot launch, instead of reporting a false failure on restricted CI images.
- `service-architecture` example rendered 9px and 9.5px labels; raised to 10.5px and 11px.
- `release-flow` example used accent colours at 3.2:1 to 4.2:1 contrast against white text; darkened to at least 5.3:1.
- Gallery PNGs re-rendered at a consistent scale, cutting the largest from 1.6 MB to 618 KB.

### Removed

- Duplicated example PNGs under the repository-root `assets/` directory.

## [0.1.0] - initial public preparation

### Added

- Standard Agent Skills layout under `skills/text2html2png/`, plus a Codex plugin manifest.
- English and Simplified Chinese READMEs.
- Three synthetic prompt/HTML/PNG examples and original brand assets.
- Cross-platform Node ESM screenshot renderer with automatic style-based defaults.
- HTML safety validation, offline request blocking, sandbox-preserving browser launch, render-size limits, and atomic PNG writes.
- Skill metadata, style-contract, privacy, and Chrome smoke tests.
- A shared style token contract so any theme can be paired with any chart type.
- Content rules that prohibit invented facts, metrics, names, dates, trends, and recommendations.
- CI, release packaging, issue templates, security policy, and contribution guide.
