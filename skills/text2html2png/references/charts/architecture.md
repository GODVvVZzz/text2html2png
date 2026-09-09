# Architecture — 分层架构总览

Use `architecture` for a top-down overview with 2–4 layers and 1–4 nodes per layer. Read the current example at `examples/service-architecture/zh.json` or `en.json`; those files contain the `data` object, which must be wrapped in a Diagram JSON envelope.

## Input contract

The current renderer is `scripts/pipeline/charts/architecture/body.mjs`. Supply:

| Field | Meaning |
|---|---|
| `id`, `locale`, `title` | Required identity; use `zh-CN` for Chinese content. |
| `eyebrow`, `subtitle` | Optional context shown above/below the title. |
| `layers` | 2–4 layers in top-to-bottom order. |
| `layers[].tag` | Required visible layer name. |
| `layers[].accent` | Required integer 1–7 selecting a theme accent. |
| `layers[].nodes` | 1–4 nodes per layer. |
| `nodes[].name` | Required component name; preserve source identifiers. |
| `nodes[].icon` | Required shared icon, for example `code`, `shield`, `package`, `lock`, or `layers`; see `scripts/pipeline/icons.mjs`. |
| `nodes[].emoji` | Optional emoji used by warm and glass. |
| `nodes[].desc` | Optional visible responsibility, dependency, or constraint. |
| `connectors` | Optional array with exactly `layers.length - 1` entries. |
| `connectors[].label` | Required string; use `""` for an unlabelled arrow. |
| `footerLabel`, `footer` | Visible source constraints or a concise explanation of the diagram's arrows. |

For example, the source “浏览器通过 HTTPS 调用 API 网关；API 网关鉴权后同步调用订单服务” can become:

```json
{
  "schemaVersion": 1,
  "chart": "architecture",
  "theme": "clean",
  "render": {"width": 1040, "padding": 24, "scale": 2},
  "data": {
    "id": "order-request",
    "locale": "zh-CN",
    "title": "订单请求链路",
    "layers": [
      {"tag": "客户端", "accent": 1, "nodes": [
        {"name": "浏览器", "icon": "code", "desc": "通过 HTTPS 调用 API 网关"}
      ]},
      {"tag": "接入层", "accent": 6, "nodes": [
        {"name": "API 网关", "icon": "shield", "desc": "鉴权后同步调用订单服务"}
      ]},
      {"tag": "服务层", "accent": 2, "nodes": [
        {"name": "订单服务", "icon": "package"}
      ]}
    ],
    "connectors": [{"label": "HTTPS"}, {"label": "鉴权后 · 同步调用"}]
  }
}
```

## Relationship fidelity

- Each adjacent pair of layers receives one shared downward arrow. The renderer draws that arrow even when `connectors` is omitted. These are layer-level connectors, not edges anchored to individual cards.
- There are no `edges`, node IDs for routing, branches, feedback loops, sidecars, or bidirectional connectors in this chart contract. Unknown fields may be ignored; they do not add visible relationships.
- Use this layout only when the layer ordering has source support. Do not infer that every node in one layer calls every node in the next, or that adjacent cards communicate with one another.
- For a layered overview with different node dependencies, name the exact source and target in node descriptions, connector labels, or the footer. Preserve synchronous/asynchronous behavior, failure conditions, shared/private storage, and negative constraints when supplied. Label the view “分层总览” and explain that arrows summarize layer direction if needed.
- If exact topology is the user's main need, use a supported narrative relationship table or clearly scoped diagrams when they preserve the requested meaning. A narrative table can use three columns: `来源`, `目标`, `关系 / 条件`; follow that chart's own limits. Do not force sparse input into its minimum section count or invent facts to fill it. For an explicit editable topology format, use the corresponding diagram tool.
- Do not duplicate a shared resource into private-looking copies, or merge separately owned resources just because their product names match. Use visible qualifiers only when the source establishes them.

## Layout and review

Start at width 1040 when node names are long or a layer has four peers. Use the same width for browser QA and export. Keep layer labels inside `.wrap`; the renderer aligns layers and connectors with an 88px gutter. Cards in a layer share the same accent and available width.

Keep protocol spelling verbatim (`gRPC`, `HTTPS`) and avoid abbreviating distinct service names into identical headings. If Chinese headings strand a final character, adjust width or split the view while preserving relationships. Do not repair generated HTML or shrink all type to hide crowding.

Compare the rendered result with the source: every component appears, every dependency is visible, conditions remain attached to the right relationship, and no connector implies an unsupported call. The browser audit checks geometry and readability; it cannot establish this semantic accuracy.
