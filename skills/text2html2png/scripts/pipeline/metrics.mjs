import { escapeHtml } from "./markup.mjs";
import { iconSvg } from "./icons.mjs";

export function metricsMarkup(stats) {
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
