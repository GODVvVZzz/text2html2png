#!/usr/bin/env node
// Build, audit and render the public examples through the multi-chart
// pipeline. Each example is a `<id>.meta.json` sidecar plus per-locale
// fixtures in `examples/<id>/{zh,en}.json`; the same DOM is rendered for
// every locale and audited per theme.

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  structureFingerprint,
  validatePipelineSources,
} from "./pipeline/validate.mjs";
import { renderDocument } from "./pipeline/render-document.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const skillDir = path.resolve(scriptDir, "..");
export const examplesDir = path.join(skillDir, "examples");
export const galleryDir = path.join(skillDir, "assets", "gallery");
export const pipelineDir = path.join(scriptDir, "pipeline");

const CHARTS = new Set([
  "flowchart", "comparison", "timeline", "architecture",
  "dashboard", "gantt", "org-chart", "funnel", "narrative",
]);
const LOCALES = ["zh", "en"];
const REQUIRED_META_FIELDS = ["id", "title", "chart", "theme", "locales", "summary", "prompt", "width"];

export function usage() {
  console.log([
    "Usage:",
    "  node scripts/build-examples.mjs [modes]",
    "",
    "Modes (combinable):",
    "  --check    Validate meta, fixtures, markup and fingerprints (no Chrome)",
    "  --audit    Strict layout audit of every generated document",
    "  --render   Render PNGs into assets/gallery",
    "  --force    Re-render even if the PNG exists",
    "  --chrome <path>   Chrome/Chromium executable override",
    "  --no-sandbox      Disable Chrome sandbox in a trusted isolated container",
    "  -h, --help Show help"
  ].join("\n"));
}

function parseArgs(argv) {
  const args = { check: false, audit: false, render: false, force: false, help: false, example: null, chrome: null, noSandbox: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") args.check = true;
    else if (arg === "--audit") args.audit = true;
    else if (arg === "--render") args.render = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--example") args.example = argv[++i] || null;
    else if (arg === "--chrome") args.chrome = argv[++i] || null;
    else if (arg === "--no-sandbox") args.noSandbox = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error("Unknown option: " + arg);
  }
  if (!args.check && !args.audit && !args.render && !args.help) {
    throw new Error("Pick at least one mode: --check, --audit, --render.");
  }
  return args;
}

export async function loadExamples() {
  const entries = (await readdir(examplesDir)).filter((name) => name.endsWith(".meta.json")).sort();
  const examples = [];
  for (const entry of entries) {
    const metaPath = path.join(examplesDir, entry);
    const meta = JSON.parse(await readFile(metaPath, "utf8"));
    for (const field of REQUIRED_META_FIELDS) {
      if (meta[field] === undefined || meta[field] === null || meta[field] === "") {
        throw new Error(`${entry}: missing required field "${field}"`);
      }
    }
    if (meta.id !== entry.replace(/\.meta\.json$/, "")) {
      throw new Error(`${entry}: "id" must match the file name`);
    }
    if (!CHARTS.has(meta.chart)) throw new Error(`${entry}: unknown chart "${meta.chart}"`);
    if (!Array.isArray(meta.locales) || !meta.locales.length || meta.locales.some((l) => !LOCALES.includes(l))) {
      throw new Error(`${entry}: "locales" must be a non-empty subset of ${LOCALES.join("/")}`);
    }
    if (!Number.isFinite(meta.width) || meta.width < 700) {
      throw new Error(`${entry}: "width" must be a number >= 700`);
    }
    const fixturePathFor = (locale) => path.join(examplesDir, meta.id, `${locale}.json`);
    examples.push({
      ...meta,
      scale: meta.scale ?? 2,
      fixtureDir: path.join(examplesDir, meta.id),
      fixturePathFor,
      htmlPathFor: (locale) => path.join(examplesDir, `${meta.id}-${locale}.html`),
      pngPathFor: (locale) => path.join(galleryDir, `${meta.id}-${locale}-${meta.theme}.png`),
    });
  }
  if (!examples.length) throw new Error("No examples found.");
  return examples;
}

export function coverageReport(examples) {
  const charts = new Set(examples.map((example) => example.chart));
  const themes = new Set(examples.map((example) => example.theme));
  return {
    examples: examples.length,
    missingCharts: [...CHARTS].filter((chart) => !charts.has(chart)),
    missingThemes: ["clean", "editorial", "notebook", "warm", "glass"].filter((theme) => !themes.has(theme)),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const sources = await validatePipelineSources(pipelineDir);
  const examples = await loadExamples();
  const selected = args.example ? examples.filter((example) => example.id === args.example) : examples;
  if (!selected.length) throw new Error("Unknown example: " + args.example);
  const report = coverageReport(examples);
  if (report.missingCharts.length) {
    throw new Error("Charts without an example: " + report.missingCharts.join(", "));
  }
  if (report.missingThemes.length) {
    throw new Error("Themes without an example: " + report.missingThemes.join(", "));
  }

  const generated = [];
  for (const example of selected) {
    const fixtures = {};
    for (const locale of example.locales) {
      try {
        fixtures[locale] = JSON.parse(await readFile(example.fixturePathFor(locale), "utf8"));
      } catch (error) {
        throw new Error(`${example.id}: cannot load ${locale} fixture — ${error.message}`);
      }
    }

    let localeBaseline = null;
    for (const locale of example.locales) {
      const fixture = fixtures[locale];
      if (fixture.id !== example.id) {
        throw new Error(`${example.id}/${locale}: fixture id must match the example id`);
      }
      const rendered = await renderDocument({
        schemaVersion: 1,
        chart: example.chart,
        theme: example.theme,
        render: { width: example.width, padding: 24, scale: example.scale },
        data: fixture,
      }, { pipelineDir, legacyCanvas: true });
      for (const warning of rendered.fontWarnings) {
        console.error(`warn: ${example.id}-${locale}: ${warning}`);
      }
      const html = rendered.html;

      // structureFingerprint normalizes lang/title/text, so zh and en may
      // differ only in copy — the structure outside the theme block must be
      // identical.
      const invariant = structureFingerprint(html);
      if (localeBaseline && localeBaseline !== invariant) {
        throw new Error(`${example.id}: source outside the theme block changed for locale ${locale}`);
      }
      localeBaseline = localeBaseline ?? invariant;

      const htmlPath = example.htmlPathFor(locale);
      await writeFile(htmlPath, html, "utf8");
      generated.push({ example, locale, htmlPath, pngPath: example.pngPathFor(locale), fontBytes: rendered.fontBytes });
      const fontNote = rendered.fontBytes ? ` fonts/${rendered.fontBytes}B` : "";
      console.log("built " + `${example.id}-${locale}.html` + fontNote);
    }
  }

  for (const item of generated) {
    if (args.audit) {
      // Imported lazily so manifest-only consumers (build-gallery) work in a
      // checkout with no installed dependencies, which is how CI runs it.
      const { auditLayout, formatReport } = await import("./audit-layout.mjs");
      const report = await auditLayout({
        html: item.htmlPath,
        width: item.example.width,
        scale: 1,
        selector: ".wrap",
        padding: 24,
        minFont: 10,
        minBodyFont: 12,
        minContrast: 4.5,
        overlap: 0.35,
        chrome: args.chrome,
        allowNetwork: false,
        noSandbox: args.noSandbox
      });
      if (report.errors || report.warnings) {
        throw new Error(`${item.example.id}-${item.locale}-${item.example.theme}:\n` + formatReport(report));
      }
      console.log("audit PASS " + item.example.id + "-" + item.locale + "-" + item.example.theme);
    }
    if (args.render) {
      const { renderScreenshot } = await import("./screenshot.mjs");
      await renderScreenshot({
        html: item.htmlPath,
        out: item.pngPath,
        bg: "auto",
        width: item.example.width,
        padding: 24,
        scale: item.example.scale,
        selector: ".wrap",
        chrome: args.chrome,
        allowNetwork: false,
        noSandbox: args.noSandbox,
        force: args.force
      });
      console.log("rendered " + path.basename(item.pngPath));
    }
  }

  console.log(`\n${generated.length} documents across ${examples.length} examples, ${sources.themes.length} themes available.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(function (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
