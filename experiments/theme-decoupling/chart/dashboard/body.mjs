import { escapeHtml } from "../markup.mjs";
import { iconSvg } from "../icons.mjs";

const TREND_DIRECTIONS = ["up", "down", "flat"];

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (!Array.isArray(fixture.stats) || fixture.stats.length !== 4) {
    throw new Error(fixture.id + ": a dashboard needs exactly four KPI stats.");
  }
  for (const stat of fixture.stats) {
    if (!stat.value || !stat.label) throw new Error(fixture.id + ": every stat needs a value and a label.");
    if (!stat.icon) throw new Error(fixture.id + "/" + stat.label + ": every stat needs an icon.");
    if (!stat.trend || !TREND_DIRECTIONS.includes(stat.trend.direction) || !stat.trend.delta) {
      throw new Error(fixture.id + "/" + stat.label + ": every stat needs an up/down/flat trend with a delta.");
    }
  }
  if (!Array.isArray(fixture.panels) || fixture.panels.length < 2 || fixture.panels.length > 3) {
    throw new Error(fixture.id + ": a dashboard needs two or three detail panels.");
  }
  for (const panel of fixture.panels) {
    if (!panel.title) throw new Error(fixture.id + ": every panel needs a title.");
    if (!panel.rows || !panel.rows.length) throw new Error(fixture.id + "/" + panel.title + ": panels need rows.");
    for (const row of panel.rows) {
      if (!row.name || !row.value) throw new Error(fixture.id + "/" + panel.title + ": every row needs a name and a value.");
      if (row.bar !== undefined && (typeof row.bar !== "number" || row.bar < 0 || row.bar > 100)) {
        throw new Error(fixture.id + "/" + panel.title + "/" + row.name + ": bar must be a 0-100 number.");
      }
    }
  }
}

function statMarkup(stat) {
  const trend = stat.trend;
  return [
    '<article class="metric" style="--metric-accent: var(--t-accent-' + Number(stat.accent) + ');">',
    '<span class="metric-top">',
    '<span class="metric-emoji">' + escapeHtml(stat.emoji) + "</span>",
    '<span class="metric-icon-svg">' + iconSvg(stat.icon) + "</span>",
    '<span class="metric-value">' + escapeHtml(stat.value) + "</span>",
    "</span>",
    '<span class="metric-label">' + escapeHtml(stat.label) + "</span>",
    '<span class="metric-detail">' + escapeHtml(stat.detail) + "</span>",
    '<span class="metric-trend">' + iconSvg("trend-" + trend.direction) + "<span>" + escapeHtml(trend.delta) + "</span></span>",
    "</article>"
  ].join("\n");
}

function rowMarkup(row) {
  const parts = [
    '<div class="panel-row">',
    '<span class="panel-name">' + escapeHtml(row.name) + "</span>",
    '<span class="panel-leader" aria-hidden="true"></span>',
    '<span class="panel-value">' + escapeHtml(row.value) + "</span>",
    "</div>"
  ];
  if (row.bar !== undefined) {
    parts.push('<div class="panel-bar" aria-hidden="true"><span class="panel-bar-fill" style="--bar-pct: ' + Number(row.bar) + '%"></span></div>');
  }
  return parts.join("\n");
}

function panelMarkup(panel) {
  const rows = panel.rows.map(rowMarkup).join("\n");
  return [
    '<article class="panel" style="--tone: var(--t-accent-' + Number(panel.accent) + ');">',
    '<header class="panel-head">',
    '<span class="panel-icons">',
    '<span class="panel-icon-emoji">' + escapeHtml(panel.emoji) + "</span>",
    '<span class="panel-icon-svg">' + iconSvg(panel.icon) + "</span>",
    "</span>",
    '<h2 class="panel-title">' + escapeHtml(panel.title) + "</h2>",
    "</header>",
    '<div class="panel-rows">',
    rows,
    "</div>",
    "</article>"
  ].join("\n");
}

export function bodyMarkup(fixture) {
  return [
    '<main class="wrap" aria-label="' + escapeHtml(fixture.title) + '">',
    '<header class="head">',
    '<p class="eyebrow">' + escapeHtml(fixture.eyebrow) + "</p>",
    "<h1>" + escapeHtml(fixture.title) + "</h1>",
    '<p class="lede">' + escapeHtml(fixture.subtitle) + "</p>",
    '<div class="head-rule"></div>',
    "</header>",
    '<section class="metrics dash-grid" aria-label="' + escapeHtml(fixture.eyebrow) + '" style="--stat-count: ' + fixture.stats.length + ';">',
    fixture.stats.map(statMarkup).join("\n"),
    "</section>",
    '<section class="dash-panels" aria-label="' + escapeHtml(fixture.title) + '" style="--panel-count: ' + fixture.panels.length + ';">',
    fixture.panels.map(panelMarkup).join("\n"),
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
