import { escapeHtml } from "../../markup.mjs";

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  const total = fixture.periods?.length ?? 0;
  if (!Array.isArray(fixture.periods) || total < 4 || total > 8) {
    throw new Error(fixture.id + ": a gantt needs four to eight time periods.");
  }
  for (const period of fixture.periods) {
    if (!period.label || !period.date) throw new Error(fixture.id + ": every period needs a label and a date.");
  }
  if (!Array.isArray(fixture.groups) || !fixture.groups.length) {
    throw new Error(fixture.id + ": a gantt needs at least one task group.");
  }
  for (const group of fixture.groups) {
    if (!group.name || !Array.isArray(group.tasks) || !group.tasks.length) {
      throw new Error(fixture.id + "/" + (group.name ?? "?") + ": every group needs a name and tasks.");
    }
    for (const task of group.tasks) {
      if (!task.name) throw new Error(fixture.id + "/" + group.name + ": every task needs a name.");
      if (typeof task.start !== "number" || typeof task.span !== "number" || task.span <= 0) {
        throw new Error(fixture.id + "/" + task.name + ": start and span must be numbers, span positive.");
      }
      if (task.start < 0 || task.start + task.span > total) {
        throw new Error(fixture.id + "/" + task.name + ": the bar must fit inside the time axis.");
      }
      if (task.progress !== undefined && (typeof task.progress !== "number" || task.progress < 0 || task.progress > 100)) {
        throw new Error(fixture.id + "/" + task.name + ": progress must be a 0-100 number.");
      }
      if (!task.accent) throw new Error(fixture.id + "/" + task.name + ": every task needs an accent.");
    }
  }
  for (const milestone of fixture.milestones ?? []) {
    if (!milestone.name || typeof milestone.pos !== "number" || !milestone.accent) {
      throw new Error(fixture.id + ": every milestone needs a name, a pos and an accent.");
    }
    if (milestone.pos < 0 || milestone.pos > total) {
      throw new Error(fixture.id + "/" + milestone.name + ": the milestone must sit on the time axis.");
    }
  }
}

// Percent-of-axis helper; parseFloat trims trailing zeros ("33.33%", "100%").
function pctValue(units, total) {
  return String(parseFloat(((units / total) * 100).toFixed(2))) + "%";
}

function labelMarkup(entry) {
  const parts = [
    '<div class="gantt-label">',
    '<span class="gantt-name">' + escapeHtml(entry.name) + "</span>"
  ];
  if (entry.owner) parts.push('<span class="gantt-owner">' + escapeHtml(entry.owner) + "</span>");
  parts.push("</div>");
  return parts.join("\n");
}

function taskMarkup(task, total) {
  const tone = "--tone: var(--t-accent-" + Number(task.accent) + ");";
  const geometry = "--bar-start: " + pctValue(task.start, total) + "; --bar-span: " + pctValue(task.span, total) + ";";
  const track = [];
  // Solid bar (planned-only or fully complete): tone background carries the
  // duration label. Partial progress uses a track+fill bar with the percentage
  // outside the track end (inner text would sit on the track mix, breaking
  // on-accent contrast).
  if (task.progress === undefined || task.progress === 100) {
    const text = task.duration ? '<span class="gantt-bar-text">' + escapeHtml(task.duration) + "</span>" : "";
    track.push('<div class="gantt-bar" style="' + geometry + '">' + text + "</div>");
  } else {
    track.push('<div class="gantt-bar progress" style="' + geometry + ' --bar-pct: ' + Number(task.progress) + '%"></div>');
    track.push('<span class="gantt-pct" style="' + geometry + '">' + Number(task.progress) + "%</span>");
  }
  return [
    '<div class="gantt-row" style="' + tone + '">',
    labelMarkup(task),
    '<div class="gantt-track">',
    ...track,
    "</div>",
    "</div>"
  ].join("\n");
}

function milestoneMarkup(milestone, total) {
  return [
    '<div class="gantt-row gantt-milestone" style="--tone: var(--t-accent-' + Number(milestone.accent) + ');">',
    '<div class="gantt-label"><span class="gantt-name">' + escapeHtml(milestone.name) + "</span></div>",
    '<div class="gantt-track"><span class="gantt-diamond" style="--bar-start: ' + pctValue(milestone.pos, total) + '" aria-hidden="true"></span></div>',
    "</div>"
  ].join("\n");
}

export function bodyMarkup(fixture) {
  const total = fixture.periods.length;
  const periods = fixture.periods.map(function (period) {
    return [
      '<span class="gantt-period">' + escapeHtml(period.label),
      '<span class="gantt-date">' + escapeHtml(period.date) + "</span>",
      "</span>"
    ].join("\n");
  }).join("\n");

  const rows = fixture.groups.flatMap(function (group) {
    return [
      '<div class="gantt-category">' + escapeHtml(group.name) + "</div>",
      ...group.tasks.map(function (task) {
        return taskMarkup(task, total);
      })
    ];
  });
  const milestones = (fixture.milestones ?? []).map(function (milestone) {
    return milestoneMarkup(milestone, total);
  });

  return [
    '<main class="wrap" aria-label="' + escapeHtml(fixture.title) + '">',
    '<header class="head">',
    '<p class="eyebrow">' + escapeHtml(fixture.eyebrow) + "</p>",
    "<h1>" + escapeHtml(fixture.title) + "</h1>",
    '<p class="lede">' + escapeHtml(fixture.subtitle) + "</p>",
    '<div class="head-rule"></div>',
    "</header>",
    '<section class="gantt" aria-label="' + escapeHtml(fixture.title) + '" style="--period-count: ' + total + ';">',
    '<div class="gantt-head">',
    '<span class="gantt-axis-label">' + escapeHtml(fixture.locale === "zh-CN" ? "任务" : "Task") + "</span>",
    '<div class="gantt-periods">',
    periods,
    "</div>",
    "</div>",
    ...rows,
    ...milestones,
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
