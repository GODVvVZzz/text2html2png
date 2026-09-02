import { escapeHtml } from "../markup.mjs";
import { iconSvg } from "../icons.mjs";

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (fixture.direction && fixture.direction !== "horizontal") {
    throw new Error(fixture.id + ": only the horizontal direction is implemented in the pipeline so far.");
  }
  if (!Array.isArray(fixture.steps) || fixture.steps.length < 2 || fixture.steps.length > 7) {
    throw new Error(fixture.id + ": a horizontal flow needs two to seven steps.");
  }
  if (fixture.stats && (!Array.isArray(fixture.stats) || fixture.stats.length !== 3)) {
    throw new Error(fixture.id + ": stats, when present, need exactly three entries.");
  }
  for (const step of fixture.steps) {
    if (!step.name || !step.icon) throw new Error(fixture.id + ": every step needs a name and an icon.");
  }
}

function stepArrow() {
  return [
    '<span class="arrow" aria-hidden="true">',
    '<svg width="24" height="20" viewBox="0 0 24 20">',
    '<line x1="1" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.8"/>',
    '<path d="M14 4.5l7.5 5.5-7.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    "</svg>",
    "</span>"
  ].join("");
}

function metricsMarkup(stats) {
  return stats.map(function (metric) {
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
  const steps = fixture.steps.map(function (step) {
    return [
      '<article class="step" style="--step-accent: var(--t-accent-' + Number(step.accent) + ');">',
      '<span class="step-num">' + escapeHtml(step.num) + "</span>",
      '<div class="step-head">',
      '<span class="step-icons">',
      '<span class="step-icon-emoji">' + escapeHtml(step.emoji) + "</span>",
      '<span class="step-icon-svg">' + iconSvg(step.icon) + "</span>",
      "</span>",
      '<h2 class="step-name">' + escapeHtml(step.name) + "</h2>",
      "</div>",
      '<p class="step-detail">' + escapeHtml(step.detail) + "</p>",
      "</article>"
    ].join("\n");
  }).join(stepArrow());

  const optionalMetrics = fixture.stats
    ? ['<section class="metrics" aria-label="' + escapeHtml(fixture.eyebrow) + '">', metricsMarkup(fixture.stats), "</section>"]
    : [];

  return [
    '<main class="wrap" aria-label="' + escapeHtml(fixture.title) + '">',
    '<header class="head">',
    '<p class="eyebrow">' + escapeHtml(fixture.eyebrow) + "</p>",
    "<h1>" + escapeHtml(fixture.title) + "</h1>",
    '<p class="lede">' + escapeHtml(fixture.subtitle) + "</p>",
    '<div class="head-rule"></div>',
    "</header>",
    ...optionalMetrics,
    '<section class="flow" aria-label="' + escapeHtml(fixture.title) + '">',
    steps,
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
