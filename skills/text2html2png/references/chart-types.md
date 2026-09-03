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
| `narrative` | A brief or document mixing decisions, process, impact, risks, and acceptance | Section topics; module content per section |

## Decision sequence

1. Does the source ask for a document-style brief — decisions plus scope plus acceptance, or "图文版/说明文档" rather than one figure? → `narrative`
2. Does the source describe hierarchy?
   - People or categories → `org-chart`
   - Systems or services → `architecture`
3. Does it compare named alternatives on common dimensions? → `comparison`
4. Does it include time?
   - Tasks with start/end or duration → `gantt`
   - Milestones or history → `timeline`
   - Ordered operational steps without dates → `flowchart`
5. Does it contain several independent KPIs? → `dashboard`
6. Does it contain ordered stages with supplied volume/conversion? → `funnel`
7. Does it contain an ordered process? → `flowchart`

If none fits, ask what relationship the user wants to communicate rather than forcing the content into a flowchart.

## Default style suggestions

| Type | Strong defaults | Other valid styles |
|---|---|---|
| `flowchart` | warm, paper | all |
| `comparison` | minimal, warm | all |
| `timeline` | editorial, paper | all |
| `architecture` | glass, minimal | all |
| `dashboard` | glass, paper | all |
| `gantt` | warm, minimal | all |
| `org-chart` | minimal, glass | all |
| `funnel` | glass, warm | all |
| `narrative` | warm, glass | all |

These are defaults, not restrictions. An explicit user style always wins.

## Missing-data behavior

- Rephrase or group supplied content to improve clarity.
- Content the user supplied is the backbone: keep their facts, numbers, and relationships.
- Content the user has not decided is yours to decide: infer the most plausible value consistent with what was supplied and draw it straight in — no assumption labels, no clarifying round-trips. The user will correct any call they disagree with.
- Explicit user constraints always win: if the user says "no benchmarks" or "do not pick a winner", honor it.
- Comparison charts may summarize trade-offs stated by the user; add a recommendation only when the user asked for one or left the choice open.
- Funnel widths use supplied values; if none exist, infer plausible stage volumes consistent with the story instead of leaving the funnel unshaped.
- Narrative sections follow the same rule: an unstated owner, metric, or date gets a sensible default rather than a placeholder.

## Ambiguous cases

- “CI/CD architecture” can be either a process or a system map. Use `architecture` when components and integrations dominate; use `flowchart` when ordered actions dominate.
- A product roadmap with dates is a `timeline`; with task spans and owners it is a `gantt`.
- A team grouped by function but without reporting lines may be a grouped card layout, not an org chart. Ask if hierarchy is important.
- A PRD or plan that lists decisions, steps, and acceptance criteria in one breath is a `narrative` brief, not a flowchart; use `flowchart` only when a single process is the whole story.
