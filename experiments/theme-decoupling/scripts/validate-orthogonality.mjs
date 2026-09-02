#!/usr/bin/env node
// Theme-decoupling experiment QA harness.
//
// The validation core (token contract, chart-CSS discipline, markup
// whitelist, DOM fingerprint) is product code owned by the skill pipeline
// (`skills/text2html2png/scripts/pipeline/validate.mjs`); this wrapper adds
// the experiment's fixture-root discovery on top of it.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import process from "node:process";
import {
  REQUIRED_THEME_TOKENS,
  discoverPipelineCharts,
  sourceHash,
  stripThemeBlock,
  structureFingerprint,
  themeDefinitions,
  validateChartCss,
  validateMarkup,
  validatePipelineSources,
} from "../../../skills/text2html2png/scripts/pipeline/validate.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const experimentDir = path.resolve(scriptDir, "..");
export const pipelineDir = path.resolve(experimentDir, "../../skills/text2html2png/scripts/pipeline");
export const themesDir = path.join(pipelineDir, "themes");
export const chartDir = path.join(experimentDir, "chart");
export const sharedCssPath = path.join(pipelineDir, "shared.css");

export {
  REQUIRED_THEME_TOKENS,
  sourceHash,
  stripThemeBlock,
  structureFingerprint,
  themeDefinitions,
  validateChartCss,
  validateMarkup,
};

// Chart directories: one folder per chart in the skill pipeline with
// chart.css and body.mjs, plus one fixture per locale in the experiment's
// fixture root. Discovery stays dynamic so new charts onboard without
// touching this file.
export async function discoverCharts() {
  const charts = await discoverPipelineCharts(pipelineDir);
  return charts.map((chart) => ({
    ...chart,
    fixturePath: (locale) => path.join(chartDir, chart.id, `${locale}.json`),
  }));
}

export async function validateSources() {
  const sources = await validatePipelineSources(pipelineDir);
  for (const chart of sources.charts) {
    for (const locale of ["zh", "en"]) {
      try {
        await readFile(path.join(chartDir, chart.id, `${locale}.json`));
      } catch {
        throw new Error(`chart/${chart.id}: missing ${locale}.json fixture in the experiment`);
      }
    }
  }
  return { ...sources, charts: await discoverCharts() };
}

async function main() {
  const result = await validateSources();
  console.log(`Orthogonality sources passed: ${result.themes.length} themes, ${result.tokenCount} identical tokens, ${result.charts.length} chart structures.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
