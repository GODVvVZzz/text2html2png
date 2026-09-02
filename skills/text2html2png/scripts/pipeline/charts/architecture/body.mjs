import { escapeHtml } from "../../markup.mjs";
import { iconSvg } from "../../icons.mjs";

// One vertical stem with a solid arrowhead; a shared, measurement-free
// connector that stays centered regardless of how many nodes a layer has.
const CONN_SVG = '<svg viewBox="0 0 20 32" aria-hidden="true" focusable="false">' +
  '<path d="M10 0v22" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
  '<path d="M4.5 21L10 30l5.5-9z" fill="currentColor"/>' +
  "</svg>";

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (!Array.isArray(fixture.layers) || fixture.layers.length < 2 || fixture.layers.length > 4) {
    throw new Error(fixture.id + ": an architecture needs two to four layers.");
  }
  for (const layer of fixture.layers) {
    if (!layer.tag) throw new Error(fixture.id + ": every layer needs a tag.");
    if (!Array.isArray(layer.nodes) || layer.nodes.length < 1 || layer.nodes.length > 4) {
      throw new Error(fixture.id + "/" + layer.tag + ": every layer needs one to four nodes.");
    }
    for (const node of layer.nodes) {
      if (!node.name) throw new Error(fixture.id + "/" + layer.tag + ": every node needs a name.");
      if (!node.icon) throw new Error(fixture.id + "/" + node.name + ": every node needs an icon.");
    }
    if (!layer.accent) throw new Error(fixture.id + "/" + layer.tag + ": every layer needs an accent.");
  }
  if (fixture.connectors !== undefined) {
    if (!Array.isArray(fixture.connectors) || fixture.connectors.length !== fixture.layers.length - 1) {
      throw new Error(fixture.id + ": connectors must be one fewer than layers.");
    }
    for (const connector of fixture.connectors) {
      if (connector.label === undefined) throw new Error(fixture.id + ": every connector needs a label (use \"\" for none).");
    }
  }
}

function nodeMarkup(node) {
  return [
    '<article class="node">',
    '<span class="node-icons">',
    '<span class="node-icon-emoji">' + escapeHtml(node.emoji) + "</span>",
    '<span class="node-icon-svg">' + iconSvg(node.icon) + "</span>",
    "</span>",
    '<h2 class="node-name">' + escapeHtml(node.name) + "</h2>",
    '<p class="node-desc">' + escapeHtml(node.desc) + "</p>",
    "</article>"
  ].join("\n");
}

function layerMarkup(layer) {
  return [
    '<div class="layer" style="--tone: var(--t-accent-' + Number(layer.accent) + ');">',
    '<div class="layer-tag">' + escapeHtml(layer.tag) + "</div>",
    '<div class="layer-nodes">',
    layer.nodes.map(nodeMarkup).join("\n"),
    "</div>",
    "</div>"
  ].join("\n");
}

function connectorMarkup(label) {
  const parts = [
    '<div class="conn-row">',
    '<span class="conn-spacer"></span>',
    '<div class="conn-center">',
    CONN_SVG
  ];
  if (label) parts.push('<span class="conn-label">' + escapeHtml(label) + "</span>");
  parts.push("</div>", "</div>");
  return parts.join("\n");
}

export function bodyMarkup(fixture) {
  const blocks = [];
  fixture.layers.forEach(function (layer, index) {
    blocks.push(layerMarkup(layer));
    if (index < fixture.layers.length - 1) {
      const label = fixture.connectors ? fixture.connectors[index].label : "";
      blocks.push(connectorMarkup(label));
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
    '<section class="arch" aria-label="' + escapeHtml(fixture.title) + '">',
    ...blocks,
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
