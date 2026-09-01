#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const experimentDir = path.resolve(scriptDir, "..");
export const themesDir = path.join(experimentDir, "themes");
export const chartPath = path.join(experimentDir, "chart", "comparison.css");

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
];

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").trim();
}

export function themeDefinitions(source, label = "theme") {
  const clean = stripComments(source);
  const match = clean.match(/^:root\s*\{([\s\S]*)\}\s*$/);
  if (!match) {
    throw new Error(`${label}: theme CSS must contain exactly one :root rule and no component selectors.`);
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
      if (!/^var\(--t-[a-z0-9-]+\)$/i.test(match[1].trim())) {
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

  if (failures.length) throw new Error(`comparison.css:\n- ${failures.join("\n- ")}`);
  return referenced;
}

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
      if (property.startsWith("--t-") || property === "--tone" || property === "--metric-accent") {
        if (!/^var\(--t-[a-z0-9-]+\)$/i.test(value.trim())) {
          failures.push(`inline theme property must be a pure var(): ${declaration}`);
        }
      } else if (!["--compare-count", "--criteria-count", "--matrix-rows"].includes(property)) {
        failures.push(`unexpected inline style property: ${property || declaration}`);
      }
    }
  }

  if (failures.length) throw new Error(`${label}:\n- ${[...new Set(failures)].join("\n- ")}`);
}

export function stripThemeBlock(html) {
  return html.replace(
    /\s*<style id="text2html2png-theme" data-theme="[^"]+">[\s\S]*?<\/style>\s*/i,
    "\n"
  );
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

export async function validateSources() {
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

  const chartCss = await readFile(chartPath, "utf8");
  validateChartCss(chartCss, new Set(tokenSets[0][1].keys()));
  return { themes: themeMeta, chartCss, tokenCount: tokenSets[0][1].size };
}

async function main() {
  const result = await validateSources();
  console.log(`Orthogonality sources passed: ${result.themes.length} themes, ${result.tokenCount} identical tokens, one comparison structure.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
