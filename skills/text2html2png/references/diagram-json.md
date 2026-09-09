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

`chart` and `theme` are explicit so rendering never guesses. `clean` is the default visual treatment; `editorial`, `notebook`, `warm`, and `glass` are intentional alternatives. Validate the envelope against `schemas/diagram.schema.json`; the chart module validates its own supported structure. Check the current chart's `assertFixture` and `bodyMarkup` in `scripts/pipeline/charts/<chart>/body.mjs` when field names or limits are unclear. Extra fields inside `data` may be ignored, so a valid input alone does not prove all source facts were rendered.

Render HTML with browser QA (no PNG is created):

```bash
node "${SKILL_DIR}/scripts/render.mjs" --input diagram.json --html diagram.html --audit
```

Add PNG only when the user requests an image:

```bash
node "${SKILL_DIR}/scripts/render.mjs" --input diagram.json --html diagram.html --png diagram.png --audit
```

Both commands fail on audit warnings as well as errors. They refuse to replace existing outputs without `--force`; use that flag when iterating on this session's generated files or when replacement is explicitly requested. Background comes from the selected theme automatically, while viewport, padding, and PNG scale come from `render`.

The same JSON, runtime, and installed font dependencies produce the same HTML across compatible agents. PNG pixels additionally depend on the installed Chrome, available fallback fonts, and platform font rasterizer.

## Sparse input

Dashboard `data.stats` accepts one to eight supplied KPIs, including numeric zero. A trend is optional: omit it when there is no comparison period. Detail panels are optional, with at most three panels. Never add metrics or trends simply to fill a template.

Comparison `data.metrics` is optional and accepts up to three entries. The options and criteria are sufficient for a comparison without additional headline statistics.

Flowchart `data.direction` accepts `horizontal` or `vertical`; narrow viewports stack steps vertically. `render.width` sets the viewport width, including the 24px page margin on each side. Screenshot padding is independent of the canvas width.
