import { escapeHtml } from "../../markup.mjs";
import { metricsMarkup } from "../../metrics.mjs";
import { iconSvg } from "../../icons.mjs";

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (!Array.isArray(fixture.events) || fixture.events.length < 3 || fixture.events.length > 7) {
    throw new Error(fixture.id + ": a timeline needs three to seven events.");
  }
  if (fixture.stats && (!Array.isArray(fixture.stats) || fixture.stats.length !== 3)) {
    throw new Error(fixture.id + ": stats, when present, need exactly three entries.");
  }
  for (const event of fixture.events) {
    if (!event.date || !event.name) throw new Error(fixture.id + ": every event needs a date and a name.");
    if (!event.icon) throw new Error(fixture.id + "/" + event.name + ": every event needs an icon.");
  }
}

export function bodyMarkup(fixture) {
  const items = fixture.events.map(function (event) {
    const classes = event.milestone ? "tl-item milestone" : "tl-item";
    return [
      '<article class="' + classes + '" style="--tone: var(--t-accent-' + Number(event.accent) + ');">',
      '<div class="tl-date">' + escapeHtml(event.date) + "</div>",
      '<span class="tl-dot" aria-hidden="true"></span>',
      '<div class="tl-card">',
      '<div class="tl-card-head">',
      '<span class="tl-icons">',
      '<span class="tl-icon-emoji">' + escapeHtml(event.emoji) + "</span>",
      '<span class="tl-icon-svg">' + iconSvg(event.icon) + "</span>",
      "</span>",
      '<h2 class="tl-name">' + escapeHtml(event.name) + "</h2>",
      "</div>",
      '<p class="tl-detail">' + escapeHtml(event.detail) + "</p>",
      "</div>",
      "</article>"
    ].join("\n");
  }).join("\n");

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
    '<section class="timeline" aria-label="' + escapeHtml(fixture.title) + '">',
    items,
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
