# Chart selection

Choose the chart from the structure of the information, not from a single keyword.

## Supported types

| Type | Use when the source contains | Required source facts |
|---|---|---|
| `flowchart` | Ordered steps, decisions, or a workflow | Step order and any branches |
| `comparison` | Two or more alternatives evaluated on shared dimensions | Alternatives and comparable dimensions |
| `timeline` | Dated or ordered milestones | Dates/periods and events |
| `architecture` | Components, boundaries, dependencies, or data flow | Nodes and relationships |
| `dashboard` | A set of supplied KPIs or status metrics | Metric names and values/status |
| `gantt` | Tasks placed on a time scale | Tasks and dates/durations |
| `org-chart` | Reporting or category hierarchy | Parent/child relationships |
| `funnel` | Ordered stages with decreasing volume or supplied conversion | Stages and values/percentages |

## Decision sequence

1. Does the source describe hierarchy?
   - People or categories → `org-chart`
   - Systems or services → `architecture`
2. Does it compare named alternatives on common dimensions? → `comparison`
3. Does it include time?
   - Tasks with start/end or duration → `gantt`
   - Milestones or history → `timeline`
   - Ordered operational steps without dates → `flowchart`
4. Does it contain several independent KPIs? → `dashboard`
5. Does it contain ordered stages with supplied volume/conversion? → `funnel`
6. Does it contain an ordered process? → `flowchart`

If none fits, ask what relationship the user wants to communicate rather than forcing the content into a flowchart.

## Default style suggestions

| Type | Strong defaults | Other valid styles |
|---|---|---|
| `flowchart` | warm, paper | all |
| `comparison` | minimal, warm | all |
| `timeline` | editorial, paper | all |
| `architecture` | dark, glass | all |
| `dashboard` | glass, dark | all |
| `gantt` | warm, minimal | all |
| `org-chart` | minimal, glass | all |
| `funnel` | neon, glass | all |

These are defaults, not restrictions. An explicit user style always wins.

## Missing-data behavior

- Rephrase or group supplied content to improve clarity.
- Do not create missing values, dates, people, percentages, recommendations, dependencies, or trend directions.
- Omit a field that is not supplied, label it `Not provided` only when the absence itself matters, or ask a concise question when the chart would otherwise be misleading.
- Comparison charts may summarize trade-offs stated by the user, but must not invent a winner.
- Dashboard charts must not infer period-over-period change.
- Funnel widths must use supplied values; if no values exist, use equal-width stages and label the result as a process funnel rather than a conversion funnel.

## Ambiguous cases

- “CI/CD architecture” can be either a process or a system map. Use `architecture` when components and integrations dominate; use `flowchart` when ordered actions dominate.
- A product roadmap with dates is a `timeline`; with task spans and owners it is a `gantt`.
- A team grouped by function but without reporting lines may be a grouped card layout, not an org chart. Ask if hierarchy is important.
