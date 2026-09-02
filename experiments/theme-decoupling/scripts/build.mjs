#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderScreenshot } from "../../../skills/text2html2png/scripts/screenshot.mjs";
import { auditLayout, formatReport } from "../../../skills/text2html2png/scripts/audit-layout.mjs";
import { buildWenKaiFaces } from "../../../skills/text2html2png/scripts/subset-wenkai.mjs";
import {
  chartDir,
  experimentDir,
  pipelineDir,
  sourceHash,
  stripThemeBlock,
  structureFingerprint,
  themeDefinitions,
  validateChartCss,
  validateMarkup,
  validateSources
} from "./validate-orthogonality.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(experimentDir, "../..");
const themesDir = path.join(pipelineDir, "themes");
const defaultOutput = path.resolve(repoRoot, "../theme-decoupling-output");

function usage() {
  console.log([
    "Usage:",
    "  node experiments/theme-decoupling/scripts/build.mjs [options]",
    "",
    "Options:",
    "  --out <dir>          Output directory (default: sibling work directory)",
    "  --chart <id>         Build one chart type (default: all)",
    "  --theme <id>         Build one theme",
    "  --locale <zh|en>     Build one locale",
    "  --render             Render PNGs for development proof only",
    "  --audit              Strictly audit every generated HTML",
    "  --scale <1-4>        PNG scale (default: 2)",
    "  --no-sandbox         Trusted isolated container only",
    "  -h, --help           Show help"
  ].join("\n"));
}

function parseArgs(argv) {
  const args = {
    out: defaultOutput,
    chart: null,
    theme: null,
    locale: null,
    render: false,
    audit: false,
    scale: 2,
    noSandbox: false,
    help: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = path.resolve(argv[++i] || "");
    else if (arg === "--chart") args.chart = argv[++i] || null;
    else if (arg === "--theme") args.theme = argv[++i] || null;
    else if (arg === "--locale") args.locale = argv[++i] || null;
    else if (arg === "--render") args.render = true;
    else if (arg === "--audit") args.audit = true;
    else if (arg === "--scale") args.scale = Number(argv[++i]);
    else if (arg === "--no-sandbox") args.noSandbox = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error("Unknown option: " + arg);
  }
  if (!Number.isFinite(args.scale) || args.scale < 1 || args.scale > 4) {
    throw new Error("--scale must be between 1 and 4.");
  }
  return args;
}

async function loadChart(chart) {
  const bodyModule = await import(pathToFileURL(path.join(chart.dir, "body.mjs")).href);
  if (typeof bodyModule.bodyMarkup !== "function" || typeof bodyModule.assertFixture !== "function") {
    throw new Error(`chart/${chart.id}: body.mjs must export assertFixture and bodyMarkup.`);
  }
  const chartCss = await readFile(path.join(chart.dir, "chart.css"), "utf8");
  const fixtureFiles = [];
  for (const locale of ["zh", "en"]) {
    const fixture = JSON.parse(await readFile(chart.fixturePath(locale), "utf8"));
    if (!fixture.id) {
      throw new Error(`chart/${chart.id}/${locale}.json: fixture is missing an id.`);
    }
    fixtureFiles.push([locale, fixture]);
  }
  return { ...chart, bodyMarkup: bodyModule.bodyMarkup, assertFixture: bodyModule.assertFixture, chartCss, fixtureFiles };
}

function documentHtml(input) {
  const body = input.bodyMarkup(input.fixture);
  const html = input.template
    .replace("{{LANG}}", escapeAttr(input.fixture.locale))
    .replace("{{DOCUMENT_TITLE}}", escapeAttr(input.fixture.title))
    .replace("{{FONT_CSS}}", input.fontCss)
    .replace("{{THEME_ID}}", escapeAttr(input.theme.id))
    .replace("{{THEME_CSS}}", input.themeCss.trim())
    .replace("{{CHART_ID}}", escapeAttr(input.chart.id))
    .replace("{{CHART_CSS}}", input.chartCss.trim())
    .replace("{{BODY}}", body);
  validateMarkup(html, `${input.chart.id}-${input.fixture.locale}-${input.theme.id}`);
  return html;
}

// Collect every string in the fixture: the font subset must cover all copy
// the document can render, wherever it appears in the data.
function fixtureStrings(value, out) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) fixtureStrings(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) fixtureStrings(item, out);
  return out;
}

// One subset per chart+locale, shared by every theme so the theme-invariant
// source check stays meaningful.
const fontCache = new Map();
async function fontCssFor(chartId, locale, fixture) {
  const key = chartId + "/" + locale;
  if (!fontCache.has(key)) {
    const text = fixtureStrings(fixture, []).join("\n");
    const result = await buildWenKaiFaces(text);
    fontCache.set(key, result);
  }
  return fontCache.get(key);
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

  const sources = await validateSources();
  const template = await readFile(path.join(pipelineDir, "template.html"), "utf8");
  const selectedThemes = sources.themes.filter(function (theme) {
    return !args.theme || theme.id === args.theme;
  });
  if (!selectedThemes.length) throw new Error("Unknown theme: " + args.theme);

  let charts = sources.charts;
  if (args.chart) {
    charts = charts.filter(function (chart) {
      return chart.id === args.chart;
    });
    if (!charts.length) throw new Error("Unknown chart: " + args.chart);
  }
  const loadedCharts = [];
  for (const chart of charts) loadedCharts.push(await loadChart(chart));

  await mkdir(args.out, { recursive: true });
  const generated = [];
  for (const chart of loadedCharts) {
    // The shared skeleton plus the chart-specific layer form the full
    // structure stylesheet; each layer is validated on its own.
    const chartCss = sources.sharedCss + "\n" + chart.chartCss;
    validateChartCss(chartCss, await tokenContract());

    for (const [locale, fixture] of chart.fixtureFiles) {
      if (args.locale && args.locale !== locale) continue;
      chart.assertFixture(fixture);
      let chartLocaleBaseline = null;
      for (const theme of selectedThemes) {
        const themeCss = await readFile(path.join(themesDir, theme.id + ".css"), "utf8");
        // A theme gets the dynamic WenKai faces exactly when it references
        // the family; subsets are computed once per chart+locale.
        const fontCss = themeCss.includes("LXGW WenKai")
          ? await fontCssFor(chart.id, locale, fixture)
          : "";
        const fontNote = fontCss ? ` fonts=${fontCss.faces.length} face/${fontCss.totalBytes}B` : "";
        const html = documentHtml({
          chart: chart,
          fixture: fixture,
          theme: theme,
          themeCss: themeCss,
          fontCss: fontCss ? '<style id="text2html2png-fonts" data-font="LXGW WenKai">\n' + fontCss.css + "  </style>\n  " : "",
          chartCss: chartCss,
          template: template,
          bodyMarkup: chart.bodyMarkup
        });
        const invariantHash = sourceHash(stripThemeBlock(html));
        if (chartLocaleBaseline && chartLocaleBaseline !== invariantHash) {
          throw new Error(`${chart.id}/${locale}: source outside the theme block changed for ${theme.id}.`);
        }
        if (!chartLocaleBaseline) chartLocaleBaseline = invariantHash;

        const stem = chart.id + "-" + locale + "-" + theme.id;
        const htmlPath = path.join(args.out, stem + ".html");
        const pngPath = path.join(args.out, stem + ".png");
        await writeFile(htmlPath, html, "utf8");
        generated.push({ chartId: chart.id, locale: locale, themeId: theme.id, htmlPath: htmlPath, pngPath: pngPath });
        console.log("built " + stem + ".html  invariant=" + invariantHash.slice(0, 12) + fontNote);
      }
    }
  }

  // DOM structure must be identical across themes for one chart+locale, and
  // identical across locales within one chart.
  const fingerprints = new Map();
  for (const item of generated) {
    const html = await readFile(item.htmlPath, "utf8");
    const fingerprint = structureFingerprint(html);
    const localeKey = item.chartId + "/" + item.locale;
    const previous = fingerprints.get(localeKey);
    if (previous && previous !== fingerprint) {
      throw new Error(`${localeKey}: DOM structure changed across themes.`);
    }
    fingerprints.set(localeKey, fingerprint);
  }
  for (const chart of loadedCharts) {
    const zh = fingerprints.get(chart.id + "/zh");
    const en = fingerprints.get(chart.id + "/en");
    if (zh && en && zh !== en) {
      throw new Error(`${chart.id}: Chinese and English fixtures do not share the same DOM structure.`);
    }
  }

  for (const item of generated) {
    if (args.audit) {
      const report = await auditLayout({
        html: item.htmlPath,
        width: 1120,
        scale: 1,
        selector: ".wrap",
        padding: 24,
        minFont: 10,
        minBodyFont: 12,
        minContrast: 4.5,
        overlap: 0.35,
        chrome: null,
        allowNetwork: false,
        noSandbox: args.noSandbox
      });
      if (report.errors || report.warnings) {
        throw new Error(`${item.chartId}-${item.locale}-${item.themeId}:\n` + formatReport(report));
      }
      console.log("audit PASS " + item.chartId + "-" + item.locale + "-" + item.themeId);
    }
    if (args.render) {
      await renderScreenshot({
        html: item.htmlPath,
        out: item.pngPath,
        bg: "auto",
        width: 1120,
        padding: 24,
        scale: args.scale,
        selector: ".wrap",
        chrome: null,
        allowNetwork: false,
        noSandbox: args.noSandbox,
        force: true
      });
      console.log("rendered " + item.chartId + "-" + item.locale + "-" + item.themeId + ".png");
    }
  }

  async function tokenContract() {
    if (!tokenContract._set) {
      const themeCss = await readFile(path.join(themesDir, sources.themes[0].id + ".css"), "utf8");
      tokenContract._set = new Set(themeDefinitions(themeCss, sources.themes[0].id).keys());
    }
    return tokenContract._set;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(function (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
