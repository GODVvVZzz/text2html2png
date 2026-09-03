#!/usr/bin/env node
// Build, audit and render the public examples through the multi-chart
// pipeline. Each example is a `<id>.meta.json` sidecar plus per-locale
// fixtures in `examples/<id>/{zh,en}.json`; the same DOM is rendered for
// every locale and audited per theme.

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderScreenshot } from "./screenshot.mjs";
import { auditLayout, formatReport } from "./audit-layout.mjs";
import { buildWenKaiFaces } from "./subset-wenkai.mjs";
import {
  structureFingerprint,
  validateChartCss,
  validateMarkup,
  validatePipelineSources,
} from "./pipeline/validate.mjs";

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
    missingThemes: [...new Set(["warm", "dark", "minimal", "editorial", "neon", "paper", "glass"])].filter((theme) => !themes.has(theme)),
  };
}

// Collect every string in the fixture so the font subset covers all copy.
function fixtureStrings(value, out) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) fixtureStrings(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) fixtureStrings(item, out);
  return out;
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const sources = await validatePipelineSources(pipelineDir);
  const template = await readFile(path.join(pipelineDir, "template.html"), "utf8");
  const themeCssCache = new Map();
  async function themeCss(id) {
    if (!themeCssCache.has(id)) {
      themeCssCache.set(id, await readFile(path.join(pipelineDir, "themes", `${id}.css`), "utf8"));
    }
    return themeCssCache.get(id);
  }

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

  const chartCache = new Map();
  async function loadChart(id) {
    if (!chartCache.has(id)) {
      const dir = path.join(pipelineDir, "charts", id);
      const bodyModule = await import(pathToFileURL(path.join(dir, "body.mjs")).href);
      if (typeof bodyModule.bodyMarkup !== "function" || typeof bodyModule.assertFixture !== "function") {
        throw new Error(`charts/${id}: body.mjs must export assertFixture and bodyMarkup.`);
      }
      chartCache.set(id, {
        dir,
        bodyMarkup: bodyModule.bodyMarkup,
        assertFixture: bodyModule.assertFixture,
        chartCss: await readFile(path.join(dir, "chart.css"), "utf8"),
      });
    }
    return chartCache.get(id);
  }

  const generated = [];
  for (const example of selected) {
    const chart = await loadChart(example.chart);
    const fullChartCss = sources.sharedCss + "\n" + chart.chartCss;
    validateChartCss(fullChartCss, sources.tokenContract);
    const css = await themeCss(example.theme);
    const needsWenKai = css.includes("LXGW WenKai");

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
      chart.assertFixture(fixture);
      if (fixture.id !== example.id) {
        throw new Error(`${example.id}/${locale}: fixture id must match the example id`);
      }
      const fontCss = needsWenKai
        ? await buildWenKaiFaces(fixtureStrings(fixture, []).join("\n"))
        : { css: "", faces: [], totalBytes: 0 };
      const body = chart.bodyMarkup(fixture);
      const html = template
        .replace("{{LANG}}", escapeAttr(fixture.locale ?? locale))
        .replace("{{DOCUMENT_TITLE}}", escapeAttr(fixture.title))
        .replace("{{FONT_CSS}}", fontCss.css ? '<style id="text2html2png-fonts" data-font="LXGW WenKai">\n' + fontCss.css + "  </style>\n  " : "")
        .replace("{{THEME_ID}}", escapeAttr(example.theme))
        .replace("{{THEME_CSS}}", css.trim())
        .replace("{{CHART_ID}}", escapeAttr(example.chart))
        .replace("{{CHART_CSS}}", fullChartCss.trim())
        .replace("{{BODY}}", body);
      validateMarkup(html, `${example.id}-${locale}-${example.theme}`);

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
      generated.push({ example, locale, htmlPath, pngPath: example.pngPathFor(locale), fontBytes: fontCss.totalBytes });
      const fontNote = fontCss.totalBytes ? ` fonts=1 face/${fontCss.totalBytes}B` : "";
      console.log("built " + `${example.id}-${locale}.html` + fontNote);
    }
  }

  for (const item of generated) {
    if (args.audit) {
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
