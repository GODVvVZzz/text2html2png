import { escapeHtml, renderRichText } from "../markup.mjs";
import { iconSvg } from "../icons.mjs";

export function assertFixture(fixture) {
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

function metricsMarkup(fixture) {
  return fixture.metrics.map(function (metric) {
    return [
      '<article class="metric" style="--metric-accent: var(--t-accent-' + Number(metric.accent) + ');">',
      '<span class="metric-top">',
      '<span class="metric-emoji">' + escapeHtml(metric.emoji) + "</span>",
      '<span class="metric-icon-svg">' + iconSvg(metric.icon) + "</span>",
      '<span class="metric-value">' + escapeHtml(metric.value) + "</span>",
      "</span>",
      '<span class="metric-label">' + escapeHtml(metric.label) + "</span>",
      '<span class="metric-detail">' + escapeHtml(metric.detail) + "</span>",
      "</article>"
    ].join("\n");
  }).join("\n");
}

export function bodyMarkup(fixture) {
  const matrixRows = fixture.criteria.length + 1;
  const metrics = metricsMarkup(fixture);

  const rail = fixture.criteria.map(function (criterion) {
    return [
      '<div class="crit">',
      '<span class="crit-label">' + escapeHtml(criterion) + "</span>",
      '<span class="crit-leader" aria-hidden="true"></span>',
      "</div>"
    ].join("\n");
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
