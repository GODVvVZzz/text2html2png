# Funnel — 漏斗图

Use a funnel for a sequence of measured, non-increasing stage volumes, such as acquisition, qualification, or recruitment. Supply the actual values; the renderer never enlarges a narrow stage to make its label fit.

## Input contract

The renderer is `scripts/pipeline/charts/funnel/body.mjs`. Wrap the chart data under `data` in a Diagram JSON envelope with `schemaVersion: 1`, `chart: "funnel"`, and a supported `theme`.

| Field | Meaning |
|---|---|
| `id`, `locale`, `title` | Required identity. Use `zh-CN` or `en-US` for the corresponding generated labels. |
| `eyebrow`, `subtitle` | Optional context. |
| `stages` | Three to six stages in source order. |
| `stages[].name` | Required non-empty stage name. |
| `stages[].value` | Required finite, non-negative number, no larger than the preceding stage. Zero and fractional values are supported. |
| `stages[].accent` | Optional theme accent integer from 1 to 7. |
| `dropReasons` | Optional string array, exactly one fewer entry than `stages`. Empty strings are allowed. Include causes only when supplied by the source. |
| `footerLabel`, `footer` | Optional source-supported summary; the footer is shown only when `footer` is supplied. |

```json
{
  "schemaVersion": 1,
  "chart": "funnel",
  "theme": "clean",
  "data": {
    "id": "signup-conversion",
    "locale": "zh-CN",
    "title": "注册转化",
    "stages": [
      {"name": "访问", "value": 1000},
      {"name": "注册", "value": 400},
      {"name": "激活", "value": 100}
    ]
  }
}
```

## Values and rates

- Bar width is exactly `stage.value / first.value * 100%`, subject to browser pixel precision. The bars share a full-width track and remain centered. No minimum width, padding, or percentage clamp distorts the ratio.
- Names, counts, and percentage labels are outside the bars. A tiny or zero-width bar never hides its data labels. A positive ratio below a display pixel can be invisible as a bar; its non-zero count and rate remain visible.
- Right-hand shares use the first stage as denominator. Between stages, conversion uses `current / previous`; drop-off uses `(previous - current) / previous`.
- Percentages display at most two decimal places. A positive percentage below `0.01%` is labelled `<0.01%`; a percentage between `99.99%` and `100%` is labelled `>99.99%`. Label rounding never changes bar geometry.
- A positive stage followed by zero has `0%` conversion and `100%` drop-off. Following a zero stage, rates are undefined; the diagram states that the preceding denominator is zero.
- An all-zero funnel is valid. Every bar has zero width; shares display `—`, with an explicit explanation that the first stage is zero. Non-increasing validation means a first value of zero cannot be followed by a positive value.
- Negative numbers, increasing stages, missing values, numeric strings, `NaN`, and infinities are rejected. If measurements are absent, ask for them or use a non-quantitative flowchart; do not invent equal counts or conversion claims.

## Layout and review

All five themes use the same data geometry and theme tokens. Labels wrap outside the bars; transition rows expand for longer Chinese or English explanations. At narrow widths the stage name appears above its count and share.

Review the rendered result against the source, including counts, stage order, denominator, and supplied reasons. A layout audit checks visibility and geometry, not whether the underlying cohort or drop-off explanation is valid. Keep every supplied stage, including stages with zero conversions.

Run the regression checks from the skill directory:

```bash
node --test tests/chart-inputs.test.mjs tests/funnel-browser.test.mjs
```
