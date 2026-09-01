#!/usr/bin/env node

// Measures the rendered layout in a real browser and reports the visual defects
// that a language model cannot reliably see in its own generated HTML: clipped
// text, content pushed outside the capture area, unreadable type sizes, weak
// contrast, overlapping labels, connectors escaping their viewBox, and cards
// that exist only to fill space.
//
// Every finding carries a stable rule code, the element that caused it, the
// measured evidence, and one concrete repair, so the agent can fix the document
// instead of guessing.

import process from "node:process";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { validateHtmlFile } from "./validate-html.mjs";
import { findChrome } from "./screenshot.mjs";

const RULES = {
  CAPTURE_ROOT_MISSING: "error",
  CONTENT_OUT_OF_BOUNDS: "error",
  TEXT_CLIPPED: "error",
  TEXT_TRUNCATED: "error",
  TEXT_OCCLUDED: "error",
  TEXT_INVISIBLE: "error",
  SVG_CLIPPED: "error",
  FONT_TOO_SMALL: "error",
  FONT_SMALL_FOR_PROSE: "warning",
  LOW_CONTRAST: "warning",
  TEXT_OVERLAP: "warning",
  EMPTY_FILLER: "warning",
  ARIA_HIDDEN_TEXT: "warning",
  EXTREME_ASPECT_RATIO: "warning",
};

function usage() {
  console.log(`Usage:
  node scripts/audit-layout.mjs --html <file> [options]

Checks the rendered layout for defects that are invisible in source review.
Exits non-zero when any error-severity rule fires.

Options:
  --html <path>        Input HTML file (required)
  --width <px>         Viewport width used for the render, 320-3000 (default: 920)
  --scale <n>          Device scale factor, 1-4 (default: 2)
  --selector <css>     Capture root, must match the screenshot (default: .wrap)
  --padding <px>       Screenshot padding around the capture root (default: 32)
  --min-font <px>      Unreadable-type error floor, 6-48 (default: 10)
  --min-body-font <px> Comfort threshold for body copy, 6-48 (default: 12)
  --min-contrast <n>   Smallest acceptable WCAG contrast ratio (default: 4.5)
  --overlap <ratio>    Overlap share that counts as a collision (default: 0.35)
  --chrome <path>      Chrome/Chromium executable override
  --allow-network      Permit network requests declared in the HTML
  --no-sandbox         Disable Chrome sandbox in a trusted isolated container
  --strict             Treat warnings as failures
  --json               Emit a machine-readable report
  -h, --help           Show help`);
}

function numberInRange(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }
  return parsed;
}

export function parseArgs(argv) {
  const args = {
    html: null,
    width: 920,
    scale: 2,
    selector: ".wrap",
    padding: 32,
    minFont: 10,
    minBodyFont: 12,
    minContrast: 4.5,
    overlap: 0.35,
    chrome: null,
    allowNetwork: false,
    noSandbox: false,
    strict: false,
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--html") args.html = argv[++i] ?? null;
    else if (arg === "--width") args.width = numberInRange(argv[++i], "--width", 320, 3000);
    else if (arg === "--scale") args.scale = numberInRange(argv[++i], "--scale", 1, 4);
    else if (arg === "--selector") args.selector = argv[++i] ?? null;
    else if (arg === "--padding") args.padding = numberInRange(argv[++i], "--padding", 0, 160);
    else if (arg === "--min-font") args.minFont = numberInRange(argv[++i], "--min-font", 6, 48);
    else if (arg === "--min-body-font") args.minBodyFont = numberInRange(argv[++i], "--min-body-font", 6, 48);
    else if (arg === "--min-contrast") args.minContrast = numberInRange(argv[++i], "--min-contrast", 1, 21);
    else if (arg === "--overlap") args.overlap = numberInRange(argv[++i], "--overlap", 0.05, 1);
    else if (arg === "--chrome") args.chrome = argv[++i] ?? null;
    else if (arg === "--allow-network") args.allowNetwork = true;
    else if (arg === "--no-sandbox") args.noSandbox = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (!args.help) {
    if (!args.html) throw new Error("--html is required.");
    if (!args.selector) throw new Error("--selector requires a value.");
  }
  return args;
}

// Runs inside the page. Kept dependency-free and self-contained because it is
// serialized into the browser context.
/* c8 ignore start */
function collectFindings(options) {
  const findings = [];
  const root = document.querySelector(options.selector);
  if (!root) {
    return [{
      rule: "CAPTURE_ROOT_MISSING",
      target: options.selector,
      evidence: "No element matches the capture selector.",
      fix: `Wrap the diagram in a single <main class="wrap"> root, or pass --selector for the actual root.`,
    }];
  }

  const rootRect = root.getBoundingClientRect();
  const tolerance = 2;

  function cssPath(element) {
    if (element === root) return options.selector;
    const parts = [];
    let node = element;
    while (node && node !== root && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`${part}#${node.id}`);
        break;
      }
      const classes = (node.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean);
      if (classes.length) part += `.${classes.slice(0, 2).join(".")}`;
      const parent = node.parentElement;
      if (parent) {
        const twins = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
        if (twins.length > 1) part += `:nth-of-type(${twins.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ") || element.tagName.toLowerCase();
  }

  function isRendered(element) {
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (Number(style.opacity) <= 0.05) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0.5 && rect.height > 0.5;
  }

  // Screen-reader-only text is deliberately collapsed and clipped, so it must not
  // be measured as a layout defect.
  function isVisuallyHidden(element) {
    let node = element;
    while (node && node !== root.parentElement) {
      const rect = node.getBoundingClientRect();
      if (rect.width <= 4 || rect.height <= 4) return true;
      const style = getComputedStyle(node);
      if (style.clip && style.clip !== "auto") return true;
      if (style.clipPath && /inset\(\s*(?:50%|100%)/.test(style.clipPath)) return true;
      node = node.parentElement;
    }
    return false;
  }

  function ownText(element) {
    return Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
  }

  function label(text) {
    if (!text) return "";
    return text.length > 48 ? `${text.slice(0, 45)}...` : text;
  }

  function parseColor(value) {
    const match = /^rgba?\(([^)]+)\)$/.exec(value);
    if (!match) return null;
    const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((part) => !Number.isFinite(part))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function composite(top, bottom) {
    const alpha = top.a + bottom.a * (1 - top.a);
    if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
      a: alpha,
    };
  }

  function relativeLuminance({ r, g, b }) {
    const channel = (raw) => {
      const c = raw / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function contrastRatio(foreground, background) {
    const a = relativeLuminance(foreground) + 0.05;
    const b = relativeLuminance(background) + 0.05;
    return a > b ? a / b : b / a;
  }

  // Walks ancestors to find the colour actually behind the text. Gradients and
  // images are not sampled, so those elements are reported as unmeasured rather
  // than guessed at.
  function effectiveBackground(element) {
    let accumulated = { r: 0, g: 0, b: 0, a: 0 };
    let node = element;
    while (node) {
      const style = getComputedStyle(node);
      if (style.backgroundImage && style.backgroundImage !== "none") return null;
      const color = parseColor(style.backgroundColor);
      if (color && color.a > 0) {
        accumulated = accumulated.a === 0 ? color : composite(accumulated, color);
        if (accumulated.a >= 0.995) return accumulated;
      }
      node = node.parentElement;
    }
    const page = parseColor(getComputedStyle(document.documentElement).backgroundColor);
    const base = page && page.a > 0 ? page : { r: 255, g: 255, b: 255, a: 1 };
    return accumulated.a === 0 ? base : composite(accumulated, base);
  }

  function clips(style) {
    return ["hidden", "clip", "auto", "scroll"].includes(style.overflowX)
      || ["hidden", "clip", "auto", "scroll"].includes(style.overflowY);
  }

  // True when an ancestor below the capture root already clips this element.
  // Such an element is visually contained, so reporting it as cropped by the
  // screenshot would be a false positive; the clipping ancestor is judged instead.
  function hasClippingAncestor(element) {
    let node = element.parentElement;
    while (node && node !== root) {
      if (clips(getComputedStyle(node))) return true;
      node = node.parentElement;
    }
    return false;
  }

  // The union of the element's own text runs, measured with a Range so that a
  // decorative child overflowing a clipped box is not mistaken for cropped text.
  function ownTextBounds(element) {
    let bounds = null;
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width <= 0 || rect.height <= 0) continue;
        bounds = bounds
          ? {
              left: Math.min(bounds.left, rect.left),
              right: Math.max(bounds.right, rect.right),
              top: Math.min(bounds.top, rect.top),
              bottom: Math.max(bounds.bottom, rect.bottom),
            }
          : { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      }
      range.detach?.();
    }
    return bounds;
  }

  // Text hidden underneath an opaque sibling reads as a rendering failure but is
  // invisible to geometry checks, so hit-test the text box against what is on top.
  // Partial burial is just as damaging as total burial, so this samples a grid and
  // reports when most of the text is covered rather than requiring all of it.
  function occludedBy(element, rect) {
    const columns = [0.1, 0.3, 0.5, 0.7, 0.9];
    // Two rows even for a single line, so a cover that eats the top or bottom
    // half of the glyphs is sampled rather than stepped over.
    const rows = rect.height >= 24 ? [0.2, 0.5, 0.8] : [0.3, 0.7];
    const viewportWidth = document.documentElement.clientWidth;

    let covered = 0;
    let total = 0;
    let blocker = null;

    for (const row of rows) {
      for (const column of columns) {
        const x = rect.left + rect.width * column;
        const y = rect.top + rect.height * row;
        if (x < 0 || y < 0 || x > viewportWidth) continue;
        total += 1;

        const hit = document.elementFromPoint(x, y);
        if (!hit) continue;
        if (hit === element || element.contains(hit) || hit.contains(element)) continue;

        const style = getComputedStyle(hit);
        const covering = (parseColor(style.backgroundColor)?.a ?? 0) > 0.4
          || (style.backgroundImage && style.backgroundImage !== "none")
          || style.backdropFilter !== "none"
          || ["img", "svg", "canvas", "video"].includes(hit.tagName.toLowerCase());
        if (!covering) continue;

        covered += 1;
        blocker = hit;
      }
    }

    if (!total || covered / total < 0.5) return null;
    return { blocker, share: covered / total };
  }

  const elements = Array.from(root.querySelectorAll("*"))
    .filter(isRendered)
    .filter((element) => !isVisuallyHidden(element));
  const textElements = [];

  for (const element of elements) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const path = cssPath(element);
    const text = ownText(element);
    const tag = element.tagName.toLowerCase();

    // Content pushed outside the capture root is silently cropped by the
    // screenshot, which is the most damaging and least visible failure.
    const overflowRight = rect.right - rootRect.right;
    const overflowLeft = rootRect.left - rect.left;
    const overflowBottom = rect.bottom - rootRect.bottom;
    const overflowTop = rootRect.top - rect.top;
    const worst = Math.max(overflowRight, overflowLeft, overflowBottom, overflowTop);
    if (worst > tolerance && style.position !== "fixed" && !hasClippingAncestor(element)) {
      const sides = [];
      if (overflowRight > tolerance) sides.push(`right +${Math.round(overflowRight)}px`);
      if (overflowLeft > tolerance) sides.push(`left +${Math.round(overflowLeft)}px`);
      if (overflowBottom > tolerance) sides.push(`bottom +${Math.round(overflowBottom)}px`);
      if (overflowTop > tolerance) sides.push(`top +${Math.round(overflowTop)}px`);
      findings.push({
        rule: "CONTENT_OUT_OF_BOUNDS",
        target: path,
        text: label(text),
        evidence: `Extends past ${options.selector} (${sides.join(", ")}).`,
        fix: worst > options.padding
          ? "Reduce the fixed width, allow the label to wrap, or widen the capture root so the element fits inside it."
          : "The screenshot padding currently hides this, but the margin is unsafe. Keep every element inside the capture root.",
      });
    }

    // Real clipping inside a scroll container: the text exists but is cropped.
    // Measured from the text runs themselves, so an intentionally clipped
    // decorative child does not masquerade as lost content.
    if (clips(style)) {
      const textBounds = ownTextBounds(element);
      const hiddenX = textBounds ? Math.max(0, textBounds.right - rect.right, rect.left - textBounds.left) : 0;
      const hiddenY = textBounds ? Math.max(0, textBounds.bottom - rect.bottom, rect.top - textBounds.top) : 0;
      const descendantHidden = element.scrollHeight - element.clientHeight;
      const cropped = Math.max(hiddenX, hiddenY);

      // A container whose text children are cut off vertically reports through
      // scrollHeight, but only count it when the element actually holds text.
      const holdsText = element.textContent.trim().length > 0;
      const verticalCrop = holdsText && descendantHidden > 1 && element.querySelector("*") === null
        ? descendantHidden
        : 0;

      if (Math.max(cropped, verticalCrop) > 1) {
        const truncating = style.textOverflow === "ellipsis"
          || (style.webkitLineClamp && style.webkitLineClamp !== "none");
        findings.push({
          rule: truncating ? "TEXT_TRUNCATED" : "TEXT_CLIPPED",
          target: path,
          text: label(text || element.textContent.replace(/\s+/g, " ").trim()),
          evidence: `${Math.round(Math.max(cropped, verticalCrop))}px of text is cropped by overflow on this element.`,
          fix: truncating
            ? "Do not hide facts behind an ellipsis. Shorten the source label, wrap it onto two lines, or widen the container."
            : "Remove the fixed height/width, allow wrapping, or move the content into its own row.",
        });
      }
    }

    // SVG connectors and arrowheads routinely escape the viewBox and lose their tips.
    if (tag === "svg" && element.viewBox?.baseVal?.width > 0) {
      const view = element.viewBox.baseVal;
      for (const child of Array.from(element.querySelectorAll("path, line, polygon, polyline, rect, circle, ellipse"))) {
        let box;
        try {
          box = child.getBBox();
        } catch {
          continue;
        }
        if (box.width === 0 && box.height === 0) continue;
        const escape = Math.max(
          view.x - box.x,
          view.y - box.y,
          box.x + box.width - (view.x + view.width),
          box.y + box.height - (view.y + view.height),
        );
        if (escape > 1) {
          findings.push({
            rule: "SVG_CLIPPED",
            target: `${path} > ${child.tagName.toLowerCase()}`,
            evidence: `Geometry extends ${Math.round(escape)} user units outside the viewBox "${view.x} ${view.y} ${view.width} ${view.height}".`,
            fix: "Derive the viewBox from the actual node positions, or inset the connector so arrowheads stay inside it.",
          });
          break;
        }
      }
    }

    if (!text) {
      // A large decorated box holding nothing is filler, and the contract forbids it.
      const area = rect.width * rect.height;
      const hasContent = element.textContent.trim().length > 0
        || element.querySelector("svg, img, canvas, picture, video");
      // A placeholder card has a solid surface. A gradient band, a rule, or a
      // positioned shape is decoration, and this rule is a hard gate, so it must
      // not fire on ordinary art direction.
      const solidSurface = (parseColor(style.backgroundColor)?.a ?? 0) >= 0.9;
      const cardLike = style.borderTopWidth !== "0px"
        || style.boxShadow !== "none"
        || Number.parseFloat(style.borderTopLeftRadius) >= 8;
      const decorative = style.position === "absolute"
        || style.position === "fixed"
        || style.pointerEvents === "none"
        || rect.width / Math.max(rect.height, 1) > 6;
      if (!hasContent && solidSurface && cardLike && !decorative && area > 6000 && rect.width > 60 && rect.height > 40) {
        findings.push({
          rule: "EMPTY_FILLER",
          target: path,
          evidence: `Empty decorated box of ${Math.round(rect.width)}x${Math.round(rect.height)}px.`,
          fix: "Delete it. Use honest whitespace instead of a placeholder card, unless it is a deliberate legend swatch.",
        });
      }
      continue;
    }

    const fontSize = Number.parseFloat(style.fontSize);
    if (Number.isFinite(fontSize) && fontSize < options.minFont) {
      findings.push({
        rule: "FONT_TOO_SMALL",
        target: path,
        text: label(text),
        evidence: `Rendered font size is ${fontSize.toFixed(1)}px, below the ${options.minFont}px floor.`,
        fix: "Raise the font size. If that no longer fits, widen the viewport rather than shrinking text further.",
      });
    } else if (Number.isFinite(fontSize) && fontSize < options.minBodyFont && text.length > 24) {
      // Short uppercase eyebrows and badges are a legitimate convention at 10-11px.
      // Running prose at that size is not.
      findings.push({
        rule: "FONT_SMALL_FOR_PROSE",
        target: path,
        text: label(text),
        evidence: `${text.length} characters of body copy at ${fontSize.toFixed(1)}px, below the ${options.minBodyFont}px comfort threshold.`,
        fix: "Raise body copy to at least 12px, shorten the sentence, or widen the viewport.",
      });
    }

    const foreground = parseColor(style.color);
    const background = effectiveBackground(element);
    if (foreground && background) {
      const weight = Number.parseInt(style.fontWeight, 10) || 400;
      const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
      const required = large ? Math.min(3, options.minContrast) : options.minContrast;
      const ratio = contrastRatio(foreground, background);
      if (ratio < 1.6) {
        // Text this close to its background is not merely hard to read, it is
        // absent from the image, which silently deletes a fact.
        findings.push({
          rule: "TEXT_INVISIBLE",
          target: path,
          text: label(text),
          evidence: `Contrast ${ratio.toFixed(2)}:1 against the resolved background — the text does not appear in the render.`,
          fix: "Set an explicit text colour for this surface. Do not rely on an inherited colour that matches the background.",
        });
      } else if (ratio < required) {
        findings.push({
          rule: "LOW_CONTRAST",
          target: path,
          text: label(text),
          evidence: `Contrast ${ratio.toFixed(2)}:1 against the resolved background, below ${required}:1.`,
          fix: "Darken or lighten the text token, or place it on a more solid surface. Never rely on colour alone to carry meaning.",
        });
      }
    }

    const occlusion = occludedBy(element, rect);
    if (occlusion) {
      findings.push({
        rule: "TEXT_OCCLUDED",
        target: path,
        text: label(text),
        evidence: `${Math.round(occlusion.share * 100)}% of the sampled text area is covered by ${cssPath(occlusion.blocker)}, so this text is buried in the render.`,
        fix: "Fix the stacking or layout: give the covering element a lower z-index, move it out of the text's box, or place the text in its own grid cell.",
      });
    }

    // Visible text marked aria-hidden is readable in the PNG but absent from the
    // accessible tree, so the HTML deliverable silently drops it.
    if (element.closest('[aria-hidden="true"]')) {
      findings.push({
        rule: "ARIA_HIDDEN_TEXT",
        target: path,
        text: label(text),
        evidence: "Visible text sits inside an aria-hidden subtree, so screen readers will not announce it.",
        fix: "Remove aria-hidden from the element that carries the text, and scope it to the decorative shape instead.",
      });
    }

    textElements.push({ element, path, text, rect });
  }

  // Colliding labels look like a rendering bug to a reader, so flag real overlaps
  // between leaf text boxes while ignoring nesting.
  const leaves = textElements.filter(({ element }) =>
    !textElements.some((other) => other.element !== element && element.contains(other.element)));

  for (let i = 0; i < leaves.length; i += 1) {
    for (let j = i + 1; j < leaves.length; j += 1) {
      const a = leaves[i];
      const b = leaves[j];
      if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
      const overlapWidth = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const overlapHeight = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (overlapWidth <= 1 || overlapHeight <= 1) continue;
      const overlapArea = overlapWidth * overlapHeight;
      const smallest = Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height);
      if (smallest <= 0) continue;
      const share = overlapArea / smallest;
      if (share >= options.overlap) {
        findings.push({
          rule: "TEXT_OVERLAP",
          target: `${a.path} + ${b.path}`,
          text: `${label(a.text)} / ${label(b.text)}`,
          evidence: `Text boxes overlap by ${Math.round(share * 100)}% of the smaller box.`,
          fix: "Increase the gap, move one label outside the node, or lay the row out with Grid instead of absolute offsets.",
        });
      }
    }
  }

  const ratio = rootRect.width / Math.max(rootRect.height, 1);
  if (ratio > 6 || ratio < 0.12) {
    findings.push({
      rule: "EXTREME_ASPECT_RATIO",
      target: options.selector,
      evidence: `Capture root is ${Math.round(rootRect.width)}x${Math.round(rootRect.height)}px (ratio ${ratio.toFixed(2)}).`,
      fix: "Rebalance the layout: wrap a long row onto two rows, or split a very tall column into columns.",
    });
  }

  return findings;
}
/* c8 ignore stop */

export async function auditLayout(args) {
  const htmlPath = await validateHtmlFile(args.html, { allowNetwork: args.allowNetwork });
  const documentUrl = pathToFileURL(htmlPath).href;
  const chromePath = await findChrome(args.chrome);

  const launchArgs = [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-first-run",
  ];
  if (args.noSandbox) launchArgs.push("--no-sandbox", "--disable-setuid-sandbox");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: launchArgs,
  });

  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      const local = url === documentUrl || url.startsWith("data:") || url.startsWith("about:");
      const permittedNetwork = args.allowNetwork && /^https?:/i.test(url);
      if (local || permittedNetwork) request.continue();
      else request.abort("blockedbyclient");
    });

    await page.setViewport({
      width: Math.ceil(args.width),
      height: 1000,
      deviceScaleFactor: args.scale,
    });
    await page.goto(documentUrl, { waitUntil: "load", timeout: 30_000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }
    });

    const raw = await page.evaluate(collectFindings, {
      selector: args.selector,
      minFont: args.minFont,
      minBodyFont: args.minBodyFont,
      minContrast: args.minContrast,
      overlap: args.overlap,
      padding: args.padding,
    });

    const findings = raw.map((finding) => ({
      ...finding,
      severity: RULES[finding.rule] ?? "warning",
    }));

    return {
      html: htmlPath,
      viewport: { width: args.width, scale: args.scale },
      selector: args.selector,
      thresholds: {
        minFont: args.minFont,
        minBodyFont: args.minBodyFont,
        minContrast: args.minContrast,
        overlap: args.overlap,
      },
      findings,
      errors: findings.filter((finding) => finding.severity === "error").length,
      warnings: findings.filter((finding) => finding.severity === "warning").length,
    };
  } finally {
    await browser.close();
  }
}

export function formatReport(report) {
  if (!report.findings.length) {
    return `Layout audit passed at ${report.viewport.width}px: no clipping, overflow, unreadable type, weak contrast, or overlap detected.`;
  }

  const lines = [];
  const order = { error: 0, warning: 1 };
  const sorted = [...report.findings].sort((a, b) => order[a.severity] - order[b.severity]);
  for (const finding of sorted) {
    lines.push(`${finding.severity === "error" ? "ERROR" : "WARN "} ${finding.rule}`);
    lines.push(`  where: ${finding.target}`);
    if (finding.text) lines.push(`  text:  ${finding.text}`);
    lines.push(`  why:   ${finding.evidence}`);
    lines.push(`  fix:   ${finding.fix}`);
  }
  lines.push(`${report.errors} error(s), ${report.warnings} warning(s) at ${report.viewport.width}px.`);
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const report = await auditLayout(args);
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(formatReport(report));

  if (report.errors > 0 || (args.strict && report.warnings > 0)) {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
