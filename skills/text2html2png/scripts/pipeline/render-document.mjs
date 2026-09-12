import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateChartCss, validateMarkup, validatePipelineSources } from "./validate.mjs";
import { markupText } from "../document-syntax.mjs";
import { validateDataFields } from "./input-fields.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const defaultPipelineDir = moduleDir;
const pipelineCache = new Map();

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function validateDiagramDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Diagram input must be a JSON object.");
  const allowed = new Set(["schemaVersion", "chart", "theme", "render", "data"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error("Unknown diagram field(s): " + unknown.join(", "));
  if (input.schemaVersion !== 1) throw new Error("Unsupported schemaVersion; expected 1.");
  if (typeof input.chart !== "string" || !input.chart) throw new Error("Diagram chart is required.");
  if (typeof input.theme !== "string" || !input.theme) throw new Error("Diagram theme is required.");
  if (!input.data || typeof input.data !== "object" || Array.isArray(input.data)) throw new Error("Diagram data must be an object.");
  for (const field of ["id", "locale", "title"]) {
    if (typeof input.data[field] !== "string" || !input.data[field].trim()) throw new Error(`Diagram data.${field} is required.`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(input.data.id)) throw new Error("Diagram data.id must be lowercase letters, digits, and hyphens.");
  // Numeric geometry is never allowed to become CSS through coercion.
  function checkValues(value, location = "data", depth = 0) {
    if (depth > 32) throw new Error(location + ": maximum nesting depth exceeded.");
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error(location + ": expected a finite number.");
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      const at = location + "." + key;
      if (key === "accent" || (key === "tone" && typeof child === "number")) {
        if (!Number.isInteger(child) || child < 1 || child > 7) throw new Error(at + ": expected an accent integer from 1 to 7.");
      }
      checkValues(child, at, depth + 1);
    }
  }
  checkValues(input.data);
  const render = input.render ?? {};
  if (!render || typeof render !== "object" || Array.isArray(render)) throw new Error("Diagram render must be an object.");
  const renderAllowed = new Set(["width", "padding", "scale"]);
  const renderUnknown = Object.keys(render).filter((key) => !renderAllowed.has(key));
  if (renderUnknown.length) throw new Error("Unknown render field(s): " + renderUnknown.join(", "));
  const normalized = {
    width: render.width ?? 920,
    padding: render.padding ?? 24,
    scale: render.scale ?? 2,
  };
  if (!Number.isInteger(normalized.width) || normalized.width < 480 || normalized.width > 2000) throw new Error("render.width must be an integer from 480 to 2000.");
  if (!Number.isInteger(normalized.padding) || normalized.padding < 0 || normalized.padding > 160) throw new Error("render.padding must be an integer from 0 to 160.");
  if (!Number.isFinite(normalized.scale) || normalized.scale < 1 || normalized.scale > 4) throw new Error("render.scale must be from 1 to 4.");
  return { ...input, render: normalized };
}

async function loadPipeline(pipelineDir) {
  const key = path.resolve(pipelineDir);
  if (!pipelineCache.has(key)) {
    pipelineCache.set(key, (async () => ({
      sources: await validatePipelineSources(key),
      template: await readFile(path.join(key, "template.html"), "utf8"),
      themesDir: path.join(key, "themes"),
      charts: new Map(),
      themes: new Map(),
    }))());
  }
  return pipelineCache.get(key);
}

async function loadChart(pipeline, id) {
  const definition = pipeline.sources.charts.find((chart) => chart.id === id);
  if (!definition) throw new Error("Unknown chart: " + id);
  if (!pipeline.charts.has(id)) {
    const body = await import(pathToFileURL(path.join(definition.dir, "body.mjs")).href);
    if (typeof body.assertFixture !== "function" || typeof body.bodyMarkup !== "function") throw new Error(`Chart ${id} does not expose its renderer contract.`);
    const chartCss = pipeline.sources.sharedCss + "\n" + await readFile(path.join(definition.dir, "chart.css"), "utf8");
    validateChartCss(chartCss, pipeline.sources.tokenContract);
    pipeline.charts.set(id, { ...body, chartCss });
  }
  return pipeline.charts.get(id);
}

async function loadTheme(pipeline, id) {
  if (!pipeline.sources.themes.some((theme) => theme.id === id)) throw new Error("Unknown theme: " + id);
  if (!pipeline.themes.has(id)) pipeline.themes.set(id, await readFile(path.join(pipeline.themesDir, id + ".css"), "utf8"));
  return pipeline.themes.get(id);
}

export async function renderDocument(definition, options = {}) {
  const input = validateDiagramDefinition(definition);
  validateDataFields(input.chart, input.data);
  const pipeline = await loadPipeline(options.pipelineDir ?? defaultPipelineDir);
  const chart = await loadChart(pipeline, input.chart);
  const themeCss = await loadTheme(pipeline, input.theme);
  chart.assertFixture(input.data);
  const body = chart.bodyMarkup(input.data);

  const { buildThemeFontFaces, themeFontFamilies } = await import("./font-embed.mjs");
  const families = themeFontFamilies(themeCss);
  const visibleCopy = markupText(body);
  // CSS transforms are applied after HTML generation. Include uppercase
  // glyphs for the theme's label/title treatment as well as calculated copy.
  const fontCopy = /--t-(?:title|label)-transform:\s*(?:uppercase|capitalize)/.test(themeCss)
    ? visibleCopy + "\n" + visibleCopy.toUpperCase() : visibleCopy;
  const fontCss = families.length
    ? await buildThemeFontFaces(themeCss, fontCopy)
    : { css: "", families, faces: 0, totalBytes: 0, warnings: [] };
  const fontBlock = fontCss.css
    ? '<style id="text2html2png-fonts" data-font="' + escapeAttr(fontCss.families.join(", ")) + '">\n' + fontCss.css + "  </style>\n  "
    : "";
  const slots = {
    LANG: escapeAttr(input.data.locale),
    DOCUMENT_TITLE: escapeAttr(input.data.title),
    FONT_CSS: fontBlock,
    THEME_ID: escapeAttr(input.theme),
    THEME_CSS: themeCss.trim(),
    CHART_ID: escapeAttr(input.chart),
    CHART_CSS: chart.chartCss.trim() + (options.legacyCanvas ? "" : `\n.wrap { width: ${input.render.width - 48}px; max-width: 100%; flex-shrink: 0; }`),
    BODY: body,
  };
  // A single callback substitution preserves literal dollar signs and template
  // markers in source copy instead of interpreting them as replacement syntax.
  const html = pipeline.template.replace(/\{\{([A-Z_]+)\}\}/g, (marker, key) => slots[key] ?? marker);
  validateMarkup(html, `${input.data.id}-${input.theme}`);
  return { html, input, fontBytes: fontCss.totalBytes, fontWarnings: fontCss.warnings };
}
