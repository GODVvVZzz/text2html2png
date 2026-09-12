#!/usr/bin/env node
// Orthogonality validation core for the multi-chart pipeline: the 48-token
// theme contract, chart-CSS discipline, markup whitelist and DOM fingerprint.
// Product code — consumed by the skill runtime itself; the theme-decoupling
// experiment wraps this module for its fixture-driven matrix checks.

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cssIdentifier, cssText, htmlAttribute, htmlDocument, htmlNodes, literalCssColors, parseCss, pureThemeReference, styleText, walkCss } from "../document-syntax.mjs";

export const REQUIRED_THEME_TOKENS = [
  "--t-canvas", "--t-canvas-image", "--t-surface", "--t-surface-strong",
  "--t-surface-soft", "--t-text", "--t-text-secondary", "--t-text-muted",
  "--t-border", "--t-rule", "--t-accent-1", "--t-accent-2", "--t-accent-3",
  "--t-accent-4", "--t-accent-5", "--t-accent-6", "--t-accent-7",
  "--t-on-accent", "--t-banner-bg", "--t-banner-text", "--t-banner-accent",
  "--t-font-display", "--t-font-body", "--t-font-data", "--t-title-size",
  "--t-title-weight", "--t-title-tracking", "--t-title-transform",
  "--t-body-size", "--t-body-weight", "--t-label-size", "--t-label-weight",
  "--t-label-tracking", "--t-label-transform", "--t-data-size",
  "--t-data-weight", "--t-card-radius", "--t-small-radius",
  "--t-border-width", "--t-border-style", "--t-card-shadow",
  "--t-highlight-shadow", "--t-backdrop", "--t-leader-style",
  "--t-leader-width", "--t-emoji-display", "--t-svg-display",
  "--t-head-rule-image",
];

// Fonts are an asset-loading concern, not styling: an embedded @font-face may
// only declare descriptors and a data: URI source, never selectors or colors.
function validateFontFace(face, label) {
  const seen = new Set();
  for (const declaration of face.block?.children ?? []) {
    const property = declaration.type === "Declaration" ? cssIdentifier(declaration.property).toLowerCase() : "";
    if (!["src", "font-family", "font-style", "font-weight", "font-display", "unicode-range"].includes(property) || declaration.important || seen.has(property)) {
      throw new Error(`${label}: forbidden or duplicate descriptor in @font-face: ${property || declaration.type}`);
    }
    seen.add(property);
    if (property !== "src") continue;
    const values = declaration.value.children.toArray();
    const format = values[1];
    const formatArgs = format?.type === "Function" ? format.children.toArray() : [];
    if (values.length !== 2 || values[0].type !== "Url" || !/^data:font\/(woff2?|ttf|otf);base64,[A-Za-z0-9+/=]+$/i.test(values[0].value)
      || format?.type !== "Function" || cssIdentifier(format.name).toLowerCase() !== "format" || formatArgs.length !== 1
      || !["String", "Identifier"].includes(formatArgs[0].type) || !["woff2", "woff", "truetype", "opentype"].includes(formatArgs[0].value ?? cssIdentifier(formatArgs[0].name))) {
      throw new Error(`${label}: @font-face src must be an inline data: URI font with a supported format`);
    }
  }
  if (!seen.has("src")) throw new Error(`${label}: @font-face is missing a src descriptor`);
}

export function themeDefinitions(source, label = "theme") {
  const rules = [];
  for (const node of parseCss(source).children) {
    if (node.type === "Comment") continue;
    if (node.type === "Atrule" && cssIdentifier(node.name).toLowerCase() === "font-face" && !node.prelude && node.block) validateFontFace(node, label);
    else rules.push(node);
  }
  if (rules.length !== 1 || rules[0].type !== "Rule" || cssText(rules[0].prelude).toLowerCase() !== ":root") {
    throw new Error(`${label}: theme CSS must contain exactly one :root rule (plus optional @font-face) and no component selectors.`);
  }

  const definitions = new Map();
  for (const declaration of rules[0].block.children) {
    const property = declaration.type === "Declaration" ? cssIdentifier(declaration.property) : "";
    if (!/^--t-[a-z0-9-]+$/.test(property) || declaration.important || !cssText(declaration.value).trim()) {
      throw new Error(`${label}: unexpected content inside :root: ${cssText(declaration).slice(0, 80)}`);
    }
    if (definitions.has(property)) throw new Error(`${label}: duplicate token ${property}.`);
    definitions.set(property, cssText(declaration.value));
  }
  const missing = REQUIRED_THEME_TOKENS.filter((token) => !definitions.has(token));
  if (missing.length) throw new Error(`${label}: missing tokens: ${missing.join(", ")}`);
  return definitions;
}

function themedPropertyViolations(ast) {
  const failures = [];
  const themed = new Set(["font-family", "border-radius", "box-shadow", "text-shadow", "backdrop-filter", "-webkit-backdrop-filter"]);
  walkCss(ast, { visit: "Declaration", enter(declaration) {
    const property = cssIdentifier(declaration.property).toLowerCase();
    if (themed.has(property) && !pureThemeReference(declaration.value) && !(property === "border-radius" && cssText(declaration.value) === "50%")) {
      failures.push(property + " must use a theme token");
    }
  } });
  return failures;
}

export function validateChartCss(source, themeTokenSet) {
  const failures = [];
  const ast = parseCss(source);
  const colors = literalCssColors(ast);
  if (colors.length) failures.push(`literal colors outside the theme block: ${colors.join(", ")}`);
  failures.push(...themedPropertyViolations(ast));

  const referenced = new Set();
  walkCss(ast, { visit: "Function", enter(node) {
    const first = node.children.first;
    if (cssIdentifier(node.name).toLowerCase() === "var" && first?.type === "Identifier" && cssIdentifier(first.name).startsWith("--t-")) referenced.add(cssIdentifier(first.name));
  } });
  const unknown = [...referenced].filter((token) => !themeTokenSet.has(token));
  if (unknown.length) failures.push(`chart references undefined theme tokens: ${unknown.join(", ")}`);
  if (!referenced.size) failures.push("chart CSS does not reference the theme contract");

  if (failures.length) throw new Error(`chart.css:\n- ${failures.join("\n- ")}`);
  return referenced;
}

// Structural inline vars carry data geometry (counts, percents, grid spans);
// everything else inline must be a pure theme-var reference.
const STRUCTURAL_INLINE_VARS = [
  "--compare-count", "--criteria-count", "--matrix-rows", "--stat-count",
  "--panel-count", "--bar-pct", "--bar-start", "--bar-span", "--bar-width",
  "--period-count", "--leaf-count", "--node-start", "--node-span",
  "--nar-cols",
];
const ACCENT_INLINE_VARS = ["--tone", "--metric-accent", "--step-accent", "--card-accent"];

export function validateMarkup(markup, label = "markup") {
  const failures = [];
  for (const node of htmlNodes(htmlDocument(markup))) {
    if (!node.tagName) continue;
    if (node.tagName === "style" && !["text2html2png-theme", "text2html2png-fonts"].includes(htmlAttribute(node, "id"))) {
      if (literalCssColors(parseCss(styleText(node))).length) failures.push("literal color outside the theme block");
    }
    for (const attribute of node.attrs) {
      const name = attribute.name.toLowerCase();
      if (["fill", "stroke"].includes(name)) {
        const value = parseCss(attribute.value, "value");
        if (!["currentcolor", "none"].includes(cssText(value).toLowerCase()) && !pureThemeReference(value)) failures.push(`unsafe SVG color value: ${attribute.value}`);
      }
      if (name !== "style") continue;
      const declarations = parseCss(attribute.value, "declarationList");
      if (literalCssColors(declarations).length) failures.push("literal color outside the theme block");
      for (const declaration of declarations.children) {
        if (declaration.type !== "Declaration") {
          failures.push("unexpected inline CSS: " + declaration.type);
          continue;
        }
        const property = cssIdentifier(declaration.property);
        if (property.startsWith("--t-") || ACCENT_INLINE_VARS.includes(property)) {
          if (declaration.important || !pureThemeReference(declaration.value)) failures.push(`inline theme property must be a pure var(): ${cssText(declaration)}`);
        } else if (STRUCTURAL_INLINE_VARS.includes(property)) {
          const values = declaration.value.children.toArray();
          if (declaration.important || values.length !== 1 || !["Number", "Percentage"].includes(values[0].type) || !Number.isFinite(Number(values[0].value))) failures.push(`inline geometry must be a finite number or percentage: ${cssText(declaration)}`);
        } else {
          failures.push(`unexpected inline style property: ${property}`);
        }
      }
    }
  }

  if (failures.length) throw new Error(`${label}:\n- ${[...new Set(failures)].join("\n- ")}`);
}

// Removes the theme block AND the runtime-injected font block: both
// are theme/asset injection, never part of the chart structure that the
// invariant hash and the markup scan reason about.
export function stripThemeBlock(html) {
  return html
    .replace(/\s*<style id="text2html2png-theme" data-theme="[^"]+">[\s\S]*?<\/style>\s*/i, "\n")
    .replace(/\s*<style id="text2html2png-fonts" data-font="[^"]*">[\s\S]*?<\/style>\s*/i, "\n");
}

export function sourceHash(source) {
  return createHash("sha256").update(source).digest("hex");
}

export function structureFingerprint(html) {
  return sourceHash(
    stripThemeBlock(html)
      .replace(/<html lang="[^"]+">/i, '<html lang="">')
      .replace(/<title>[\s\S]*?<\/title>/gi, "<title></title>")
      .replace(/\saria-label="[^"]*"/gi, "")
      .replace(/>[^<>]+</g, "><")
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Pipeline discovery: one folder per chart with chart.css + body.mjs.
export async function discoverPipelineCharts(pipelineDir) {
  const chartsDir = path.join(pipelineDir, "charts");
  const entries = await readdir(chartsDir, { withFileTypes: true });
  const charts = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(chartsDir, entry.name);
    const files = new Set(await readdir(dir));
    for (const required of ["chart.css", "body.mjs"]) {
      if (!files.has(required)) {
        throw new Error(`charts/${entry.name}: missing ${required}`);
      }
    }
    charts.push({ id: entry.name, dir });
  }
  if (!charts.length) throw new Error("No chart directories found.");
  return charts.sort((a, b) => a.id.localeCompare(b.id));
}

// Full source validation for a pipeline directory (themes + shared + charts).
export async function validatePipelineSources(pipelineDir) {
  const themesDir = path.join(pipelineDir, "themes");
  const themeMeta = JSON.parse(await readFile(path.join(themesDir, "themes.json"), "utf8"));
  const tokenSets = [];
  for (const theme of themeMeta) {
    const source = await readFile(path.join(themesDir, `${theme.id}.css`), "utf8");
    tokenSets.push([theme.id, themeDefinitions(source, theme.id)]);
  }

  const baseline = [...tokenSets[0][1].keys()].sort().join("\n");
  for (const [id, definitions] of tokenSets.slice(1)) {
    if ([...definitions.keys()].sort().join("\n") !== baseline) {
      throw new Error(`${id}: token set differs from ${tokenSets[0][0]}.`);
    }
  }

  const tokenContract = new Set(tokenSets[0][1].keys());
  const sharedCss = await readFile(path.join(pipelineDir, "shared.css"), "utf8");
  validateChartCss(sharedCss, tokenContract);
  const charts = [];
  for (const chart of await discoverPipelineCharts(pipelineDir)) {
    const chartCss = await readFile(path.join(chart.dir, "chart.css"), "utf8");
    validateChartCss(chartCss, tokenContract);
    charts.push(chart);
  }
  return { themes: themeMeta, sharedCss, charts, tokenCount: tokenSets[0][1].size, tokenContract };
}
