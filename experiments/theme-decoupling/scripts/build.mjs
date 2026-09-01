#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderScreenshot } from "../../../skills/text2html2png/scripts/screenshot.mjs";
import { auditLayout, formatReport } from "../../../skills/text2html2png/scripts/audit-layout.mjs";
import {
  experimentDir,
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
const fixturesDir = path.join(experimentDir, "fixtures");
const themesDir = path.join(experimentDir, "themes");
const chartDir = path.join(experimentDir, "chart");
const defaultOutput = path.resolve(repoRoot, "../theme-decoupling-output");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRichText(value) {
  const source = String(value);
  let result = "";
  let cursor = 0;
  for (const match of source.matchAll(/<strong>([\s\S]*?)<\/strong>/gi)) {
    result += escapeHtml(source.slice(cursor, match.index));
    result += "<strong>" + escapeHtml(match[1]) + "</strong>";
    cursor = match.index + match[0].length;
  }
  return result + escapeHtml(source.slice(cursor));
}

function iconSvg(kind) {
  if (kind === "code") {
    return [
      '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">',
      '<path d="M12 9L5 16l7 7M20 9l7 7-7 7M18.5 6l-5 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>"
    ].join("");
  }
  if (kind === "image") {
    return [
      '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">',
      '<rect x="4.5" y="5.5" width="23" height="21" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
      '<circle cx="11" cy="12" r="2.2" fill="currentColor"/>',
      '<path d="M7.5 23l6.2-6.4 4.2 4 3.2-3.2 3.4 5.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>"
    ].join("");
  }
  throw new Error("Unknown icon: " + kind);
}

function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (!Array.isArray(fixture.metrics) || fixture.metrics.length !== 3) {
    throw new Error(fixture.id + ": exactly three metrics are required.");
  }
  if (!Array.isArray(fixture.criteria) || !fixture.criteria.length) {
    throw new Error(fixture.id + ": criteria are required.");
  }
  if (!Array.isArray(fixture.columns) || fixture.columns.length < 2 || fixture.columns.length > 3) {
    throw new Error(fixture.id + ": comparison requires two or three columns.");
  }
  for (const column of fixture.columns) {
    if (column.values.length !== fixture.criteria.length) {
      throw new Error(fixture.id + "/" + column.name + ": value count must match criteria count.");
    }
  }
}

function bodyMarkup(fixture) {
  const matrixRows = fixture.criteria.length + 1;
  const metrics = fixture.metrics.map(function (metric) {
    return [
      '<article class="metric" style="--metric-accent: var(--t-accent-' + Number(metric.accent) + ');">',
      '<span class="metric-top">',
      '<span class="metric-emoji">' + escapeHtml(metric.emoji) + "</span>",
      '<span class="metric-value">' + escapeHtml(metric.value) + "</span>",
      "</span>",
      '<span class="metric-label">' + escapeHtml(metric.label) + "</span>",
      '<span class="metric-detail">' + escapeHtml(metric.detail) + "</span>",
      "</article>"
    ].join("");
  }).join("\n");

  const rail = fixture.criteria.map(function (criterion) {
    return [
      '<div class="crit">',
      '<span class="crit-label">' + escapeHtml(criterion) + "</span>",
      '<span class="crit-leader" aria-hidden="true"></span>',
      "</div>"
    ].join("");
  }).join("\n");

  const columns = fixture.columns.map(function (column) {
    const cells = column.values.map(function (value) {
      return '<div class="cell"><span class="cell-content">' + renderRichText(value) + "</span></div>";
    }).join("\n");
    return [
      '<article class="compare-col" style="--tone: var(--t-accent-' + Number(column.tone) + ');">',
      '<header class="col-head">',
      '<div class="col-kicker">',
      '<span class="col-icons">',
      '<span class="col-icon-emoji">' + escapeHtml(column.emoji) + "</span>",
      '<span class="col-icon-svg">' + iconSvg(column.icon) + "</span>",
      "</span>",
      "<span>" + escapeHtml(column.kicker) + "</span>",
      "</div>",
      '<h2 class="col-name">' + escapeHtml(column.name) + "</h2>",
      '<p class="col-note">' + escapeHtml(column.note) + "</p>",
      "</header>",
      cells,
      "</article>"
    ].join("\n");
  }).join("\n");

  return [
    '<main class="wrap" aria-label="' + escapeHtml(fixture.title) + '">',
    '<header class="head">',
    '<p class="eyebrow">' + escapeHtml(fixture.eyebrow) + "</p>",
    "<h1>" + escapeHtml(fixture.title) + "</h1>",
    '<p class="lede">' + escapeHtml(fixture.subtitle) + "</p>",
    '<div class="head-rule"></div>',
    "</header>",
    '<section class="metrics" aria-label="' + escapeHtml(fixture.eyebrow) + '">',
    metrics,
    "</section>",
    '<section class="matrix" aria-label="' + escapeHtml(fixture.title) + '" style="--compare-count: ' + fixture.columns.length + "; --criteria-count: " + fixture.criteria.length + "; --matrix-rows: " + matrixRows + ';">',
    '<div class="rail">',
    '<div class="rail-head"><span>' + escapeHtml(fixture.locale === "zh-CN" ? "对照维度" : "Criteria") + "</span></div>",
    rail,
    "</div>",
    columns,
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}

function documentHtml(input) {
  assertFixture(input.fixture);
  const body = bodyMarkup(input.fixture);
  const html = input.template
    .replace("{{LANG}}", escapeHtml(input.fixture.locale))
    .replace("{{DOCUMENT_TITLE}}", escapeHtml(input.fixture.title))
    .replace("{{THEME_ID}}", escapeHtml(input.theme.id))
    .replace("{{THEME_CSS}}", input.themeCss.trim())
    .replace("{{CHART_CSS}}", input.chartCss.trim())
    .replace("{{BODY}}", body);
  validateMarkup(html, input.fixture.id + "-" + input.theme.id);
  return html;
}

function usage() {
  console.log([
    "Usage:",
    "  node experiments/theme-decoupling/scripts/build.mjs [options]",
    "",
    "Options:",
    "  --out <dir>          Output directory (default: sibling work directory)",
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const sources = await validateSources();
  const template = await readFile(path.join(chartDir, "template.html"), "utf8");
  const selectedThemes = sources.themes.filter(function (theme) {
    return !args.theme || theme.id === args.theme;
  });
  if (!selectedThemes.length) throw new Error("Unknown theme: " + args.theme);

  const fixtureFiles = [["zh", "zh.json"], ["en", "en.json"]].filter(function (entry) {
    return !args.locale || entry[0] === args.locale;
  });
  if (!fixtureFiles.length) throw new Error("Unknown locale: " + args.locale);

  await mkdir(args.out, { recursive: true });
  const generated = [];
  for (const fixtureEntry of fixtureFiles) {
    const locale = fixtureEntry[0];
    const fixture = JSON.parse(await readFile(path.join(fixturesDir, fixtureEntry[1]), "utf8"));
    let localeBaseline = null;
    for (const theme of selectedThemes) {
      const themeCss = await readFile(path.join(themesDir, theme.id + ".css"), "utf8");
      const definitions = themeDefinitions(themeCss, theme.id);
      validateChartCss(sources.chartCss, new Set(definitions.keys()));
      const html = documentHtml({
        fixture: fixture,
        theme: theme,
        themeCss: themeCss,
        chartCss: sources.chartCss,
        template: template
      });
      const invariantHash = sourceHash(stripThemeBlock(html));
      if (localeBaseline && localeBaseline !== invariantHash) {
        throw new Error(locale + ": source outside the theme block changed for " + theme.id + ".");
      }
      if (!localeBaseline) localeBaseline = invariantHash;

      const stem = locale + "-" + theme.id;
      const htmlPath = path.join(args.out, stem + ".html");
      const pngPath = path.join(args.out, stem + ".png");
      await writeFile(htmlPath, html, "utf8");
      generated.push({ locale: locale, theme: theme, html: html, htmlPath: htmlPath, pngPath: pngPath });
      console.log("built " + stem + ".html  invariant=" + invariantHash.slice(0, 12));
    }
  }

  const fingerprints = new Map();
  for (const item of generated) {
    const fingerprint = structureFingerprint(item.html);
    const previous = fingerprints.get(item.locale);
    if (previous && previous !== fingerprint) throw new Error(item.locale + ": DOM structure changed across themes.");
    fingerprints.set(item.locale, fingerprint);
  }
  if (!args.locale && fingerprints.size === 2 && new Set(fingerprints.values()).size !== 1) {
    throw new Error("Chinese and English fixtures do not share the same DOM structure.");
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
        throw new Error(item.locale + "-" + item.theme.id + ":\n" + formatReport(report));
      }
      console.log("audit PASS " + item.locale + "-" + item.theme.id);
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
      console.log("rendered " + item.locale + "-" + item.theme.id + ".png");
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(function (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
