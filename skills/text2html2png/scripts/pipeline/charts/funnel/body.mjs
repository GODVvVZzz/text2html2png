import { escapeHtml } from "../../markup.mjs";

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (!Array.isArray(fixture.stages) || fixture.stages.length < 3 || fixture.stages.length > 6) {
    throw new Error(fixture.id + ": a funnel needs three to six stages.");
  }
  for (const [index, stage] of fixture.stages.entries()) {
    if (!stage || typeof stage.name !== "string" || !stage.name.trim()) {
      throw new Error(fixture.id + ": every stage needs a non-empty name.");
    }
    if (!Number.isFinite(stage.value) || stage.value < 0) {
      throw new Error(fixture.id + "/" + stage.name + ": every stage needs a finite non-negative number value.");
    }
    if (index > 0 && stage.value > fixture.stages[index - 1].value) {
      throw new Error(fixture.id + "/" + stage.name + ": stage values must be non-increasing.");
    }
    if (stage.accent !== undefined && (!Number.isInteger(stage.accent) || stage.accent < 1 || stage.accent > 7)) {
      throw new Error(fixture.id + "/" + stage.name + ": accent must be an integer from 1 to 7.");
    }
  }
  if (fixture.dropReasons !== undefined) {
    if (!Array.isArray(fixture.dropReasons) || fixture.dropReasons.length !== fixture.stages.length - 1
      || fixture.dropReasons.some((reason) => typeof reason !== "string")) {
      throw new Error(fixture.id + ": dropReasons must be one fewer than stages (empty strings allowed).");
    }
  }
}

function formatNumber(value) {
  return value.toLocaleString("en-US", { maximumSignificantDigits: 17 });
}

function formatPercent(numerator, denominator) {
  if (denominator === 0) return "—";
  if (numerator === 0) return "0%";
  if (numerator === denominator) return "100%";
  const value = (numerator / denominator) * 100;
  // Check the source values before division so underflow never labels a
  // positive count as zero, nor rounds a near-total rate to exactly 100%.
  if (value < 0.01) return "<0.01%";
  if (value > 99.99) return ">99.99%";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 }) + "%";
}

function stageMarkup(stage, accent, barWidth, first) {
  return [
    '<div class="funnel-stage" style="--tone: var(--t-accent-' + Number(accent) + '); --bar-width: ' + barWidth + '%;">',
    '<div class="funnel-stage-heading">',
    '<span class="funnel-stage-name">' + escapeHtml(stage.name) + "</span>",
    '<div class="funnel-meta">',
    '<span class="funnel-stage-num">' + escapeHtml(formatNumber(stage.value)) + "</span>",
    '<span class="funnel-pct">' + escapeHtml(formatPercent(stage.value, first)) + "</span>",
    "</div>",
    "</div>",
    '<div class="funnel-track" aria-hidden="true"><div class="funnel-bar"></div></div>',
    "</div>"
  ].join("\n");
}

function dropMarkup(previous, current, reason, chinese) {
  const text = previous === 0
    ? (chinese ? "前一阶段为 0，转化率与流失率不可计算" : "Previous stage is 0; conversion and drop-off rates are undefined")
    : (chinese ? "转化 " : "Conversion ") + formatPercent(current, previous)
      + (chinese ? " · 流失 " : " · Drop-off ") + formatPercent(previous - current, previous);
  const parts = ['<div class="funnel-drop">', '<span class="funnel-drop-text">' + escapeHtml(text) + "</span>"];
  if (reason) parts.push('<span class="funnel-drop-reason">' + escapeHtml(reason) + "</span>");
  parts.push("</div>");
  return parts.join("\n");
}

export function bodyMarkup(fixture) {
  const first = fixture.stages[0].value;
  const chinese = fixture.locale.startsWith("zh");
  const stages = [];

  fixture.stages.forEach(function (stage, index) {
    const accent = stage.accent ?? ((index % 5) + 1);
    // Text lives outside the bar, so even a zero-width stage keeps its labels.
    // Do not clamp or round geometry: all bars share the same full-width track.
    const barWidth = first === 0 ? 0 : (stage.value / first) * 100;
    stages.push(stageMarkup(stage, accent, barWidth, first));
  });

  const reasons = fixture.dropReasons ?? fixture.stages.map(function () {
    return "";
  });

  const blocks = [];
  stages.forEach(function (stageMarkupValue, index) {
    blocks.push(stageMarkupValue);
    if (index < stages.length - 1) {
      blocks.push(dropMarkup(fixture.stages[index].value, fixture.stages[index + 1].value, reasons[index], chinese));
    }
  });

  return [
    '<main class="wrap" aria-label="' + escapeHtml(fixture.title) + '">',
    '<header class="head">',
    fixture.eyebrow ? '<p class="eyebrow">' + escapeHtml(fixture.eyebrow) + "</p>" : "",
    "<h1>" + escapeHtml(fixture.title) + "</h1>",
    fixture.subtitle ? '<p class="lede">' + escapeHtml(fixture.subtitle) + "</p>" : "",
    '<div class="head-rule"></div>',
    "</header>",
    '<p class="funnel-note">' + (first === 0
      ? (chinese ? "首阶段为 0：各阶段数量均为 0，占比未定义（—）。" : "The first stage is 0: every stage is 0 and shares are undefined (—).")
      : (chinese ? "条宽与右侧占比均以首阶段为基准。" : "Bar widths and shares on the right are relative to the first stage.")) + "</p>",
    '<section class="funnel" aria-label="' + escapeHtml(fixture.title) + '">',
    ...blocks,
    "</section>",
    ...(fixture.footer ? [
      '<footer class="footer">',
      '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
      "<p>" + escapeHtml(fixture.footer) + "</p>",
      "</footer>",
    ] : []),
    "</main>"
  ].join("\n");
}
