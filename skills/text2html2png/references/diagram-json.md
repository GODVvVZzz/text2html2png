# Diagram JSON

Use this reference when turning source material into renderer input. The agent owns meaning; the renderer owns layout.

## Start from a valid input

Use `examples/release-flow.diagram.json` for a complete runnable input. For a Chinese technical diagram, [charts/architecture.md](charts/architecture.md) includes a complete JSON example and the limits of its relationship model.

The `examples/<id>/<locale>.json` files contain chart data only. Wrap their contents under `data`; do not pass them directly to `render.mjs`.

| Envelope field | Value |
|---|---|
| `schemaVersion` | `1` |
| `chart` | An explicit supported chart, such as `architecture`. |
| `theme` | An explicit supported style, normally `clean`. |
| `render` | Optional `width` (default 920), `padding` (24), and `scale` (2). |
| `data` | Identity fields `id`, `locale`, `title`, plus the chosen chart's supported content fields. |

`chart` and `theme` are explicit so rendering never guesses. `clean` is the default visual treatment; `editorial`, `notebook`, `warm`, and `glass` are intentional alternatives. `schemas/diagram.schema.json` validates the envelope. At runtime, `scripts/pipeline/input-fields.mjs` checks supported field names and types recursively, and the selected chart's `assertFixture` checks its required structure and semantic limits. Unknown fields inside `data`, including nested fields, fail with their exact JSON path. Put facts into fields the chart actually displays; this structural check cannot establish that the wording preserves the source meaning.

Render HTML with browser QA (no PNG is created):

```bash
node "${SKILL_DIR}/scripts/render.mjs" --input diagram.json --html diagram.html --audit
```

Add PNG only when the user requests an image:

```bash
node "${SKILL_DIR}/scripts/render.mjs" --input diagram.json --html diagram.html --png diagram.png --audit
```

Both commands fail on audit warnings as well as errors. They refuse to replace existing outputs without `--force`; use that flag when iterating on this session's generated files or when replacement is explicitly requested. Audit and PNG generation finish before publishing the outputs, so a failed audit preserves the previous files. Missing fonts block CLI delivery; run the indicated setup command. Background comes from the selected theme automatically, while viewport, padding, and PNG scale come from `render`.

The same JSON, runtime, and installed font dependencies produce the same HTML across compatible agents. PNG pixels additionally depend on the installed Chrome, available fallback fonts, and platform font rasterizer.

## Sparse input

Dashboard `data.stats` accepts one to eight supplied KPIs, including numeric zero. A trend is optional: omit it when there is no comparison period. Detail panels are optional, with at most three panels. Never add metrics or trends simply to fill a template.

Comparison `data.metrics` is optional and accepts up to three entries. The options and criteria are sufficient for a comparison without additional headline statistics.

Funnel stages may contain zero or very small non-negative values. Counts must not increase between stages. Labels sit outside the proportional bars; percentages with a zero denominator are explicitly undefined. See [charts/funnel.md](charts/funnel.md).

Narrative supports one to seven sections, including a single callout or one-row relationship table. Eyebrows, icons and the page footer are optional. Match the number of sections to the supplied facts.

Flowchart `data.direction` accepts `horizontal` or `vertical`; narrow viewports stack steps vertically. `render.width` sets the viewport width, including the 24px page margin on each side. Screenshot padding is independent of the canvas width.
