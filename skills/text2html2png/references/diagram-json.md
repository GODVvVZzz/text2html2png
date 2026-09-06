# Diagram JSON

Use this reference when turning source material into renderer input. The agent owns meaning; the renderer owns layout.

```json
{
  "schemaVersion": 1,
  "chart": "flowchart",
  "theme": "clean",
  "render": {"width": 1040, "padding": 24, "scale": 2},
  "data": {
    "id": "release-flow",
    "locale": "zh-CN",
    "title": "发布流水线"
  }
}
```

`chart` and `theme` are explicit so rendering never guesses. `clean` is the default visual treatment; `editorial`, `notebook`, `warm`, and `glass` are intentional alternatives. `data` follows the selected chart reference and the checked examples under `examples/<id>/<locale>.json`. Validate the envelope against `schemas/diagram.schema.json`; the chart module validates its own semantic data.

Render HTML:

```bash
node "${SKILL_DIR}/scripts/render.mjs" --input diagram.json --html diagram.html
```

Audit and render PNG only when requested:

```bash
node "${SKILL_DIR}/scripts/render.mjs" --input diagram.json --html diagram.html --png diagram.png --audit
```

The same JSON produces the same HTML in Codex, Claude Code, and other compatible agents. PNG pixels additionally depend on the installed Chrome and platform font rasterizer.

## Sparse input

Dashboard `data.stats` accepts one to eight supplied KPIs, including numeric zero. A trend is optional: omit it when there is no comparison period. Detail panels are optional, with at most three panels. Never add metrics or trends simply to fill a template.

Comparison `data.metrics` is optional and accepts up to three entries. The options and criteria are sufficient for a comparison without additional headline statistics.

Flowchart `data.direction` accepts `horizontal` or `vertical`; narrow viewports stack steps vertically. `render.width` sets the viewport width, including the 24px page margin on each side. Screenshot padding is independent of the canvas width.
