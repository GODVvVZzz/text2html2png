// The renderer must never accept facts in fields that it does not display.
// This structural guard checks field names/types; each chart's assertFixture
// remains responsible for required fields, counts and semantic constraints.
const copy = { id: "string", locale: "string", title: "string", eyebrow: "string", subtitle: "string", footerLabel: "string", footer: "string" };
const decoration = { icon: "string", emoji: "string", accent: "number" };
const metric = { ...decoration, value: "text", label: "string", detail: "string" };
const orgNode = () => ({ ...decoration, name: "string", role: "string", meta: "string", children: [orgNode] });
const section = value => {
  const common = { kind: "string", eyebrow: "string", title: "string", icon: "string", emoji: "string" };
  const fields = {
    cards: { items: [{ no: "text", title: "string", text: "string", accent: "number" }] },
    steps: { items: [{ label: "string", text: "string", icon: "string", emoji: "string" }] },
    table: { columns: ["string"], rows: [{ cells: ["string"] }] },
    callout: { text: "string", tone: "string" },
    checklist: { items: [{ text: "string", ok: "boolean" }] },
  };
  if (!Object.hasOwn(fields, value.kind)) throw new Error("data.sections: unknown section kind " + String(value.kind));
  return { ...common, ...fields[value.kind] };
};
const charts = {
  architecture: {
    layers: [{ tag: "string", accent: "number", nodes: [{ name: "string", desc: "string", icon: "string", emoji: "string" }] }],
    connectors: [{ label: "string" }],
  },
  flowchart: { direction: "string", stats: [metric], steps: [{ ...decoration, num: "text", name: "string", detail: "string" }] },
  timeline: { stats: [metric], events: [{ ...decoration, date: "string", name: "string", detail: "string", milestone: "boolean" }] },
  dashboard: {
    stats: [{ ...metric, trend: { direction: "string", delta: "text" } }],
    panels: [{ ...decoration, title: "string", rows: [{ name: "string", value: "text", bar: "number" }] }],
  },
  comparison: { metrics: [metric], criteria: ["string"], columns: [{ name: "string", kicker: "string", note: "string", tone: "number", icon: "string", emoji: "string", values: ["text"] }] },
  gantt: {
    periods: [{ label: "string", date: "string" }],
    groups: [{ name: "string", tasks: [{ name: "string", owner: "string", start: "number", span: "number", progress: "number", accent: "number", duration: "string" }] }],
    milestones: [{ name: "string", pos: "number", accent: "number" }],
  },
  "org-chart": { tree: orgNode },
  funnel: { stages: [{ name: "string", value: "number", accent: "number" }], dropReasons: ["string"] },
  narrative: { sections: [section] },
};

function inspect(value, shape, at, depth = 0) {
  if (depth > 32) throw new Error(at + ": maximum nesting depth exceeded.");
  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) throw new Error(at + ": expected an array.");
    value.forEach((item, index) => inspect(item, shape[0], `${at}[${index}]`, depth + 1));
    return;
  }
  if (typeof shape === "string") {
    const valid = shape === "text" ? typeof value === "string" || (typeof value === "number" && Number.isFinite(value))
      : typeof value === shape && (shape !== "number" || Number.isFinite(value));
    if (!valid) throw new Error(at + ": expected " + (shape === "text" ? "a string or finite number" : "a " + shape) + ".");
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(at + ": expected an object.");
  const fields = typeof shape === "function" ? shape(value) : shape;
  for (const [key, child] of Object.entries(value)) {
    if (!Object.hasOwn(fields, key)) {
      throw new Error(`${at}.${key}: unsupported field. Use the chart's documented fields so every supplied fact is visible.`);
    }
    inspect(child, fields[key], at + "." + key, depth + 1);
  }
}

export function validateDataFields(chart, data) {
  if (!Object.hasOwn(charts, chart)) throw new Error("Unknown chart: " + chart);
  inspect(data, { ...copy, ...charts[chart] }, "data");
}
