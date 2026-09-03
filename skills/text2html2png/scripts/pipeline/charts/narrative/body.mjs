// Narrative: one long-form, decision-first page that mixes section modules
// (numbered cards, step strips, tables, callouts, checklists) on a single
// canvas. Sections are numbered automatically in fixture order.

import { escapeHtml } from "../../markup.mjs";
import { iconSvg } from "../../icons.mjs";

const SECTION_KINDS = ["cards", "steps", "table", "callout", "checklist"];

function fail(fixture, where, message) {
  throw new Error(fixture && fixture.id ? fixture.id + "/" + where + ": " + message : "narrative fixture: " + message);
}

function assertSection(fixture, section, index) {
  const where = "section " + (index + 1);
  if (!section || !SECTION_KINDS.includes(section.kind)) {
    fail(fixture, where, "kind must be one of " + SECTION_KINDS.join(", ") + ".");
  }
  if (!section.eyebrow || !section.title) fail(fixture, where, "every section needs an eyebrow and a title.");
  if (section.eyebrow.length > 24) fail(fixture, where, "eyebrow must stay under 24 characters (label type).");

  if (section.kind === "cards") {
    if (!Array.isArray(section.items) || section.items.length < 3 || section.items.length > 6) {
      fail(fixture, where, "cards need three to six items.");
    }
    for (const item of section.items) {
      if (!item.no || !item.title || !item.text) fail(fixture, where, "every card needs no, title, and text.");
    }
  }
  if (section.kind === "steps") {
    if (!Array.isArray(section.items) || section.items.length < 3 || section.items.length > 5) {
      fail(fixture, where, "steps need three to five items.");
    }
    for (const item of section.items) {
      if (!item.label || !item.text) fail(fixture, where, "every step needs a label and text.");
      if (item.label.length > 18) fail(fixture, where, "step labels must stay under 18 characters.");
    }
  }
  if (section.kind === "table") {
    if (!Array.isArray(section.columns) || section.columns.length < 2 || section.columns.length > 3) {
      fail(fixture, where, "tables need two or three columns.");
    }
    if (!Array.isArray(section.rows) || section.rows.length < 3 || section.rows.length > 6) {
      fail(fixture, where, "tables need three to six rows.");
    }
    for (const row of section.rows) {
      if (!Array.isArray(row.cells) || row.cells.length !== section.columns.length) {
        fail(fixture, where, "every row needs one cell per column.");
      }
      for (const cell of row.cells) {
        if (typeof cell !== "string" || !cell) fail(fixture, where, "table cells must be non-empty strings.");
      }
    }
  }
  if (section.kind === "callout") {
    if (!section.text) fail(fixture, where, "a callout needs text.");
    if (section.tone !== undefined && !["info", "warn"].includes(section.tone)) {
      fail(fixture, where, 'callout tone must be "info" or "warn".');
    }
  }
  if (section.kind === "checklist") {
    if (!Array.isArray(section.items) || section.items.length < 3 || section.items.length > 6) {
      fail(fixture, where, "checklists need three to six items.");
    }
    for (const item of section.items) {
      if (typeof item.text !== "string" || !item.text) fail(fixture, where, "every check needs text.");
    }
  }
}

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) {
    throw new Error("Fixture is missing identity fields.");
  }
  if (!Array.isArray(fixture.sections) || fixture.sections.length < 4 || fixture.sections.length > 7) {
    throw new Error(fixture.id + ": a narrative needs four to seven sections.");
  }
  fixture.sections.forEach((section, index) => assertSection(fixture, section, index));
  if (!fixture.footerLabel || !fixture.footer) {
    throw new Error(fixture.id + ": a narrative needs footerLabel and footer.");
  }
}

function iconSlot(emoji, icon) {
  return '<span class="sec-icon-emoji">' + escapeHtml(emoji) + '</span><span class="sec-icon-svg">' + iconSvg(icon) + "</span>";
}

function sectionHead(section, index) {
  const no = String(index + 1).padStart(2, "0");
  return [
    '<header class="sec-head">',
    '<span class="sec-no">' + no + "</span>",
    '<span class="sec-icon">' + iconSlot(section.emoji, section.icon) + "</span>",
    '<div class="sec-titles">',
    '<p class="sec-eyebrow">' + escapeHtml(section.eyebrow) + "</p>",
    "<h2>" + escapeHtml(section.title) + "</h2>",
    "</div>",
    "</header>"
  ].join("\n");
}

function cardsMarkup(section) {
  const cols = section.items.length <= 3 ? section.items.length : 3;
  return [
    '<div class="nar-cards" style="--nar-cols: ' + cols + ';">',
    section.items
      .map(
        (item) =>
          [
            '<article class="nar-card" style="--card-accent: var(--t-accent-' + Number(item.accent || 1) + ');">',
            '<p class="nar-card-no">' + escapeHtml(item.no) + "</p>",
            '<h3 class="nar-card-title">' + escapeHtml(item.title) + "</h3>",
            '<p class="nar-card-text">' + escapeHtml(item.text) + "</p>",
            "</article>"
          ].join("\n")
      )
      .join("\n"),
    "</div>"
  ].join("\n");
}

function stepsMarkup(section) {
  return [
    '<ol class="nar-steps">',
    section.items
      .map(
        (item) =>
          [
            '<li class="nar-step">',
            '<span class="nar-step-icon">' + iconSlot(item.emoji, item.icon) + "</span>",
            '<p class="nar-step-label">' + escapeHtml(item.label) + "</p>",
            '<p class="nar-step-text">' + escapeHtml(item.text) + "</p>",
            "</li>"
          ].join("\n")
      )
      .join("\n"),
    "</ol>"
  ].join("\n");
}

function tableMarkup(section) {
  const head = section.columns.map((col) => "<th>" + escapeHtml(col) + "</th>").join("");
  const rows = section.rows
    .map(
      (row) =>
        "<tr>" +
        row.cells.map((cell, i) => (i === 0 ? '<td class="nar-cell-key">' : "<td>") + escapeHtml(cell) + "</td>").join("") +
        "</tr>"
    )
    .join("\n");
  return '<table class="nar-table"><thead><tr>' + head + "</tr></thead><tbody>" + rows + "</tbody></table>";
}

function calloutMarkup(section) {
  const tone = section.tone === "warn" ? "warn" : "info";
  const accent = tone === "warn" ? 6 : 2;
  return [
    '<aside class="nar-callout" style="--card-accent: var(--t-accent-' + accent + ');">',
    '<p class="nar-callout-text">' + escapeHtml(section.text) + "</p>",
    "</aside>"
  ].join("\n");
}

function checklistMarkup(section) {
  return [
    '<ul class="nar-checks">',
    section.items
      .map((item) => {
        const mark = item.ok === false
          ? '<span class="nar-check-mark nar-check-no">✕</span>'
          : '<span class="nar-check-mark nar-check-yes">' + iconSvg("check") + "</span>";
        return '<li class="nar-check">' + mark + "<span>" + escapeHtml(item.text) + "</span></li>";
      })
      .join("\n"),
    "</ul>"
  ].join("\n");
}

function sectionMarkup(section, index) {
  let body;
  if (section.kind === "cards") body = cardsMarkup(section);
  else if (section.kind === "steps") body = stepsMarkup(section);
  else if (section.kind === "table") body = tableMarkup(section);
  else if (section.kind === "callout") body = calloutMarkup(section);
  else body = checklistMarkup(section);
  return [
    '<section class="nar-section" aria-label="' + escapeHtml(section.title) + '">',
    sectionHead(section, index),
    body,
    "</section>"
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
    '<div class="nar-sections">',
    fixture.sections.map(sectionMarkup).join("\n"),
    "</div>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
