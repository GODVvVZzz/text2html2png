import { escapeHtml } from "../../markup.mjs";
import { iconSvg } from "../../icons.mjs";

export function assertFixture(fixture) {
  if (!fixture.id || !fixture.locale || !fixture.title) throw new Error("Fixture is missing identity fields.");
  if (!fixture.tree || !fixture.tree.name || !fixture.tree.role) {
    throw new Error(fixture.id + ": the tree needs a root with a name and a role.");
  }
  // Depth of the tree; every node above the deepest level must have children
  // so connector lanes stay aligned with the leaf-slot grid.
  let leaves = 0;
  let maxDepth = 0;
  (function visit(node, depth) {
    maxDepth = Math.max(maxDepth, depth);
    const children = node.children ?? [];
    if (!children.length) {
      leaves += 1;
      return;
    }
    if (depth === 2) throw new Error(fixture.id + "/" + node.name + ": the tree must not exceed three levels.");
    for (const child of children) {
      visit(child, depth + 1);
    }
  })(fixture.tree, 0);
  if (leaves < 2 || leaves > 6) {
    throw new Error(fixture.id + ": the tree needs two to six leaf slots.");
  }
  (function check(node) {
    if (!node.name || !node.role) throw new Error(fixture.id + "/" + (node.name ?? "?") + ": every node needs a name and a role.");
    if (!node.icon) throw new Error(fixture.id + "/" + node.name + ": every node needs an icon.");
    for (const child of node.children ?? []) check(child);
  })(fixture.tree);
}

function pct(units) {
  return Number((units * 100).toFixed(3));
}

function path(d) {
  return '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
}

// Connector lanes share the leaf-slot coordinate space (viewBox 0..100),
// so every stem, bar and drop lands exactly on the node centers without
// runtime measurement.
function connectorPaths(entries, leafCount) {
  const paths = [];
  for (const entry of entries) {
    if (!entry.childEntries || !entry.childEntries.length) continue;
    const px = pct((entry.start - 1 + entry.span / 2) / leafCount);
    const centers = entry.childEntries.map(function (child) {
      return pct((child.start - 1 + child.span / 2) / leafCount);
    });
    if (centers.length === 1) {
      paths.push(path("M" + px + " 0V28"));
      continue;
    }
    paths.push(path("M" + px + " 0V14"));
    paths.push(path("M" + centers[0] + " 14H" + centers[centers.length - 1]));
    for (const center of centers) {
      paths.push(path("M" + center + " 14V28"));
    }
  }
  return paths;
}

function layout(fixture) {
  const levels = [];
  let cursor = 1;
  let maxDepth = 0;
  function walk(node, depth, accent) {
    maxDepth = Math.max(maxDepth, depth);
    const tone = node.accent ?? accent;
    const start = cursor;
    const childEntries = (node.children ?? []).map(function (child) {
      return walk(child, depth + 1, tone);
    });
    const span = childEntries.length ? childEntries.reduce(function (sum, child) {
      return sum + child.span;
    }, 0) : 1;
    if (!childEntries.length) cursor += 1;
    const entry = { node, accent: tone, start, span, childEntries, depth };
    (levels[depth] ??= []).push(entry);
    return entry;
  }
  walk(fixture.tree, 0, undefined);
  return { levels, leafCount: cursor, maxDepth };
}

function nodeMarkup(entry) {
  const node = entry.node;
  const classes = entry.depth === 0 ? "org-node root" : "org-node";
  const parts = [
    '<article class="' + classes + '" style="--tone: var(--t-accent-' + Number(entry.accent) + '); --node-start: ' + entry.start + "; --node-span: " + entry.span + ';">',
    '<span class="org-icons">',
    '<span class="org-icon-emoji">' + escapeHtml(node.emoji ?? "👤") + "</span>",
    '<span class="org-icon-svg">' + iconSvg(node.icon) + "</span>",
    "</span>",
    '<span class="org-info">',
    '<h2 class="org-name">' + escapeHtml(node.name) + "</h2>",
    '<span class="org-role">' + escapeHtml(node.role) + "</span>"
  ];
  if (node.meta) parts.push('<span class="org-meta">' + escapeHtml(node.meta) + "</span>");
  parts.push("</span>", "</article>");
  return parts.join("\n");
}

export function bodyMarkup(fixture) {
  const { levels, leafCount } = layout(fixture);

  const blocks = [];
  levels.forEach(function (entries, index) {
    blocks.push('<div class="org-level">' + entries.map(nodeMarkup).join("\n") + "</div>");
    if (index < levels.length - 1) {
      const paths = connectorPaths(entries, leafCount);
      blocks.push('<div class="org-conn" aria-hidden="true"><svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + paths.join("") + "</svg></div>");
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
    '<section class="org-tree" aria-label="' + escapeHtml(fixture.title) + '" style="--leaf-count: ' + leafCount + ';">',
    ...blocks,
    "</section>",
    '<footer class="footer">',
    '<div class="footer-label">' + escapeHtml(fixture.footerLabel) + "</div>",
    "<p>" + escapeHtml(fixture.footer) + "</p>",
    "</footer>",
    "</main>"
  ].join("\n");
}
