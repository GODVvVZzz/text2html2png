import { escapeHtml } from "../../markup.mjs";

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (!Array.isArray(fixture.stages) || fixture.stages.length < 3 || fixture.stages.length > 6) {
    throw new Error(fixture.id + ": a funnel needs three to six stages.");
  }
  const first = fixture.stages[0].value;
  if (typeof first !== "number" || first <= 0) {
    throw new Error(fixture.id + ": the first stage needs a positive number value.");
  }
  for (const stage of fixture.stages) {
    if (!stage.name) throw new Error(fixture.id + ": every stage needs a name.");
    if (typeof stage.value !== "number" || stage.value <= 0) {
      throw new Error(fixture.id + "/" + stage.name + ": every stage needs a positive number value.");
    }
    // Narrow bars cannot carry their labels; keep every stage at least 18% of
    // the widest one so name + number always fit inside the bar.
    if ((stage.value / first) * 100 < 18) {
      throw new Error(fixture.id + "/" + stage.name + ": stage value must be at least 18% of the first stage.");
    }
  }
  if (fixture.dropReasons !== undefined) {
    if (!Array.isArray(fixture.dropReasons) || fixture.dropReasons.length !== fixture.stages.length - 1) {
      throw new Error(fixture.id + ": dropReasons must be one fewer than stages (empty strings allowed).");
    }
  }
}

function formatNumber(value) {
  return value.toLocaleString("en-US");
}

function stageMarkup(stage, accent, barWidth, first) {
  return [
    '<div class="funnel-stage" style="--tone: var(--t-accent-' + Number(accent) + '); --bar-width: ' + barWidth + '%;">',
    '<div class="funnel-bar">',
    '<span class="funnel-stage-name">' + escapeHtml(stage.name) + "</span>",
    '<span class="funnel-stage-num">' + escapeHtml(formatNumber(stage.value)) + "</span>",
    "</div>",
    '<div class="funnel-meta"><span class="funnel-pct">' + Math.round((stage.value / first) * 100) + "%</span></div>",
    "</div>"
  ].join("\n");
}

function dropMarkup(dropPercent, reason) {
  const parts = ['<div class="funnel-drop">', '<span class="funnel-drop-text">' + dropPercent + "</span>"];
  if (reason) parts.push('<span class="funnel-drop-reason">' + escapeHtml(reason) + "</span>");
  parts.push("</div>");
  return parts.join("\n");
}

export function bodyMarkup(fixture) {
  const first = fixture.stages[0].value;
  const stages = [];
  const drops = [];

  fixture.stages.forEach(function (stage, index) {
    const accent = stage.accent ?? ((index % 5) + 1);
    const barWidth = Math.min(100, Math.max(18, Number(((stage.value / first) * 100).toFixed(2))));
    stages.push(stageMarkup(stage, accent, barWidth, first));
    if (index > 0) {
      const change = (1 - stage.value / fixture.stages[index - 1].value) * 100;
      const sign = change >= 0 ? "-" : "+";
      drops.push(sign + Math.abs(Number(change.toFixed(1))) + "%");
    }
  });

  const reasons = fixture.dropReasons ?? fixture.stages.map(function () {
    return "";
  });

  const blocks = [];
  stages.forEach(function (stageMarkupValue, index) {
    blocks.push(stageMarkupValue);
    if (index < stages.length - 1) {
      blocks.push(dropMarkup(drops[index], reasons[index]));
    }
  });

  return [
    '<main class="wrap" aria-label="' + escapeHtml(fixture.title) + '">',
    '<header class="head">',
    '<p class="eyebrow">' + escapeHtml(fixture.eyebrow) + "</p>",
    "<h1>" + escapeHtml(fixture.title) + "</h1>",
    '<p class="lede">' + escapeHtml(fixture.subtitle) + "</p>",
    '<div class="head-rule"></div>',
    "</header>",
    '<section class="funnel" aria-label="' + escapeHtml(fixture.title) + '">',
    ...blocks,
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
