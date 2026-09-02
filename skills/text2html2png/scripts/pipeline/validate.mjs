#!/usr/bin/env node
// Orthogonality validation core for the multi-chart pipeline: the 48-token
// theme contract, chart-CSS discipline, markup whitelist and DOM fingerprint.
// Product code — consumed by the skill runtime itself; the theme-decoupling
// experiment wraps this module for its fixture-driven matrix checks.

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

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

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").trim();
}

// Fonts are an asset-loading concern, not styling: an embedded @font-face may
// only declare descriptors and a data: URI source, never selectors or colors.
function extractFontFaces(source, label) {
  const faces = [];
  const rest = source.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    faces.push(block);
    return "";
  });
  for (const face of faces) {
    const body = face.replace(/^@font-face\s*\{/, "").replace(/\}$/, "");
    // The data: URI contains semicolons, so src must be lifted out before
    // the remaining descriptors can be split on ";".
    let rest = body;
    let sawSrc = false;
    rest = rest.replace(/src\s*:\s*[\s\S]*?(?=font-family|font-style|font-weight|font-display|unicode-range|$)/, (srcDecl) => {
      sawSrc = true;
      const normalized = srcDecl.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, "");
      if (!/^src:url\(["']?data:font\/(woff2?|ttf|otf);base64,[A-Za-z0-9+/=]+["']?\)format\(["']?(woff2|woff|truetype|opentype)["']?\);?$/i.test(normalized)) {
        throw new Error(`${label}: @font-face src must be an inline data: URI font`);
      }
      return "";
    });
    if (!sawSrc) throw new Error(`${label}: @font-face is missing a src descriptor`);
    for (const declaration of rest.split(";").map((s) => s.trim()).filter(Boolean)) {
      const [, property = ""] = declaration.match(/^([a-z-]+)\s*:/i) ?? [];
      if (!["font-family", "font-style", "font-weight", "font-display", "unicode-range"].includes(property)) {
        throw new Error(`${label}: forbidden descriptor in @font-face: ${property || declaration.slice(0, 40)}`);
      }
    }
  }
  return rest.trim();
}

export function themeDefinitions(source, label = "theme") {
  const clean = stripComments(source);
  const rest = extractFontFaces(clean, label);
  const match = rest.match(/^:root\s*\{([\s\S]*)\}\s*$/);
  if (!match) {
    throw new Error(`${label}: theme CSS must contain exactly one :root rule (plus optional @font-face) and no component selectors.`);
  }

  const definitions = new Map();
  for (const entry of match[1].matchAll(/(--t-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    if (definitions.has(entry[1])) throw new Error(`${label}: duplicate token ${entry[1]}.`);
    definitions.set(entry[1], entry[2].trim());
  }

  const residue = match[1].replace(/--t-[a-z0-9-]+\s*:\s*[^;]+;/gi, "").trim();
  if (residue) throw new Error(`${label}: unexpected content inside :root: ${residue.slice(0, 80)}`);

  const missing = REQUIRED_THEME_TOKENS.filter((token) => !definitions.has(token));
  if (missing.length) throw new Error(`${label}: missing tokens: ${missing.join(", ")}`);
  return definitions;
}

function themedPropertyViolations(source) {
  const failures = [];
  const checks = [
    ["font-family", /font-family\s*:\s*([^;]+);/gi],
    ["border-radius", /border-radius\s*:\s*([^;]+);/gi],
    ["box-shadow", /box-shadow\s*:\s*([^;]+);/gi],
    ["text-shadow", /text-shadow\s*:\s*([^;]+);/gi],
    ["backdrop-filter", /(?<!-webkit-)backdrop-filter\s*:\s*([^;]+);/gi],
    ["-webkit-backdrop-filter", /-webkit-backdrop-filter\s*:\s*([^;]+);/gi]
  ];
  for (const [property, pattern] of checks) {
    for (const match of source.matchAll(pattern)) {
      const value = match[1].trim();
      const tokenShaped = /^var\(--t-[a-z0-9-]+\)$/i.test(value);
      const geometric = property === "border-radius" && value === "50%";
      if (!tokenShaped && !geometric) {
        failures.push(property + " must use a theme token");
      }
    }
  }
  return failures;
}

export function validateChartCss(source, themeTokenSet) {
  const failures = [];
  const clean = stripComments(source);
  const literalColor = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\blab\(|\blch\(/gi;
  const matches = clean.match(literalColor) ?? [];
  if (matches.length) failures.push(`literal colors outside the theme block: ${[...new Set(matches)].join(", ")}`);
  failures.push(...themedPropertyViolations(clean));

  const referenced = new Set([...clean.matchAll(/var\((--t-[a-z0-9-]+)\)/gi)].map((match) => match[1]));
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
];
const ACCENT_INLINE_VARS = ["--tone", "--metric-accent", "--step-accent"];

export function validateMarkup(markup, label = "markup") {
  const failures = [];
  const literalColor = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/gi;
  const stripped = stripThemeBlock(markup);
  if (literalColor.test(stripped)) failures.push("literal color outside the theme block");

  for (const match of stripped.matchAll(/\b(?:fill|stroke)=["']([^"']+)["']/gi)) {
    if (!/^(?:currentColor|none|var\(--t-[a-z0-9-]+\))$/i.test(match[1])) {
      failures.push(`unsafe SVG color value: ${match[1]}`);
    }
  }

  for (const match of stripped.matchAll(/style=["']([^"']+)["']/gi)) {
    for (const declaration of match[1].split(";").map((value) => value.trim()).filter(Boolean)) {
      const [, property = "", value = ""] = declaration.match(/^([^:]+):(.+)$/) ?? [];
      if (property.startsWith("--t-") || ACCENT_INLINE_VARS.includes(property)) {
        if (!/^var\(--t-[a-z0-9-]+\)$/i.test(value.trim())) {
          failures.push(`inline theme property must be a pure var(): ${declaration}`);
        }
      } else if (!STRUCTURAL_INLINE_VARS.includes(property)) {
        failures.push(`unexpected inline style property: ${property || declaration}`);
      }
    }
  }

  if (failures.length) throw new Error(`${label}:\n- ${[...new Set(failures)].join("\n- ")}`);
}

// Removes the theme block AND the runtime-injected WenKai font block: both
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
  return { themes: themeMeta, sharedCss, charts, tokenCount: tokenSets[0][1].size };
}
