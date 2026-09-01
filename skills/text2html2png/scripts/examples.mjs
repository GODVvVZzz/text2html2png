#!/usr/bin/env node

// Single source of truth for the public examples. Each example is described by a
// `<id>.meta.json` sidecar next to its HTML, so rendering, auditing, and the
// published gallery all read the same record and cannot drift apart.

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const skillDir = path.resolve(scriptDir, "..");
export const examplesDir = path.join(skillDir, "examples");
export const galleryDir = path.join(skillDir, "assets", "gallery");

const CHARTS = new Set([
  "flowchart", "comparison", "timeline", "architecture",
  "dashboard", "gantt", "org-chart", "funnel",
]);
const STYLES = new Set(["warm", "dark", "minimal", "editorial", "neon", "paper", "glass"]);

const REQUIRED_FIELDS = ["id", "title", "chart", "style", "summary", "prompt", "width", "background"];

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function loadExamples() {
  const entries = (await readdir(examplesDir)).filter((name) => name.endsWith(".meta.json")).sort();
  const examples = [];

  for (const entry of entries) {
    const metaPath = path.join(examplesDir, entry);
    const meta = JSON.parse(await readFile(metaPath, "utf8"));

    for (const field of REQUIRED_FIELDS) {
      if (meta[field] === undefined || meta[field] === null || meta[field] === "") {
        throw new Error(`${entry}: missing required field "${field}"`);
      }
    }
    if (meta.id !== entry.replace(/\.meta\.json$/, "")) {
      throw new Error(`${entry}: "id" must match the file name`);
    }
    if (!CHARTS.has(meta.chart)) throw new Error(`${entry}: unknown chart "${meta.chart}"`);
    if (!STYLES.has(meta.style)) throw new Error(`${entry}: unknown style "${meta.style}"`);
    if (!/^#[0-9a-fA-F]{6}$/.test(meta.background)) {
      throw new Error(`${entry}: "background" must be a six-digit hex colour`);
    }

    const htmlPath = path.join(examplesDir, `${meta.id}.html`);
    if (!await exists(htmlPath)) throw new Error(`${entry}: missing ${meta.id}.html`);

    examples.push({
      ...meta,
      scale: meta.scale ?? 2,
      htmlPath,
      pngPath: path.join(galleryDir, `${meta.id}.png`),
      htmlRelative: path.posix.join("examples", `${meta.id}.html`),
      pngRelative: path.posix.join("assets", "gallery", `${meta.id}.png`),
    });
  }

  if (!examples.length) throw new Error("No examples found.");
  return examples;
}

export async function coverageReport() {
  const examples = await loadExamples();
  const charts = new Set(examples.map((example) => example.chart));
  const styles = new Set(examples.map((example) => example.style));
  return {
    examples: examples.length,
    charts: [...CHARTS].map((chart) => ({ chart, covered: charts.has(chart) })),
    styles: [...STYLES].map((style) => ({ style, covered: styles.has(style) })),
    missingCharts: [...CHARTS].filter((chart) => !charts.has(chart)),
    missingStyles: [...STYLES].filter((style) => !styles.has(style)),
  };
}

async function main() {
  const report = await coverageReport();
  const examples = await loadExamples();
  for (const example of examples) {
    const rendered = await exists(example.pngPath) ? "png" : "no png";
    console.log(`${example.id.padEnd(24)} ${example.chart.padEnd(13)} ${example.style.padEnd(10)} ${rendered}`);
  }
  console.log(`\n${report.examples} examples, ${8 - report.missingCharts.length}/8 charts, ${7 - report.missingStyles.length}/7 styles.`);
  if (report.missingCharts.length) console.log(`Charts without an example: ${report.missingCharts.join(", ")}`);
  if (report.missingStyles.length) console.log(`Styles without an example: ${report.missingStyles.join(", ")}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
