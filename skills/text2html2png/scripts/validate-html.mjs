#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { cssResources, htmlAttribute, htmlDocument, htmlNodes, parseCss, styleText } from "./document-syntax.mjs";

const MAX_HTML_BYTES = 5 * 1024 * 1024;
const URL_ATTRIBUTES = new Set(["src", "href", "action", "formaction", "poster", "background", "cite", "longdesc", "data", "codebase", "manifest"]);
const CSS_RESOURCE_ATTRIBUTES = new Set(["fill", "stroke", "filter", "clip-path", "mask", "marker", "marker-start", "marker-mid", "marker-end", "cursor"]);

function restrictivePolicy(content = "") {
  const directives = new Map();
  for (const directive of content.split(";")) {
    const [name, ...values] = directive.trim().split(/[\t\n\f\r ]+/);
    // CSP uses the first occurrence of a repeated directive.
    if (!directives.has(name.toLowerCase())) directives.set(name.toLowerCase(), values);
  }
  const sources = directives.get("default-src");
  return sources?.length === 1 && sources[0].toLowerCase() === "'none'";
}

function resourceError(value, allowNetwork, css = false) {
  if (!value.trim() || value.trim().startsWith("#")) return null;
  let url;
  try { url = new URL(value, "file:///__text2html2png__/input.html"); }
  catch { return "Invalid resource URL."; }
  if (["javascript:", "vbscript:"].includes(url.protocol)) return "javascript: and other executable URLs are not allowed.";
  if (url.protocol === "file:") return css ? "Local file CSS resources are blocked." : "Local file src/href references are blocked.";
  if (["http:", "https:"].includes(url.protocol)) return allowNetwork ? null : (css ? "Remote CSS resources and imports are blocked." : "Remote src/href is blocked.");
  if (!["data:", "about:"].includes(url.protocol)) return "Unsupported resource URL protocol: " + url.protocol;
  return null;
}

export function validateHtmlSource(source, { allowNetwork = false } = {}) {
  const errors = [];
  const document = htmlDocument(source);
  let hasDoctype = false, hasRoot = false, hasPolicy = false;

  const checkCss = (css, context) => {
    try {
      for (const resource of cssResources(parseCss(css, context))) {
        const error = resourceError(resource, allowNetwork, true);
        if (error) errors.push(error);
      }
    } catch (error) { errors.push("Invalid or unsupported CSS: " + error.message); }
  };

  for (const node of htmlNodes(document)) {
    if (node.nodeName === "#documentType" && node.name.toLowerCase() === "html") hasDoctype = true;
    if (!node.tagName) continue;
    const tag = node.tagName.toLowerCase();
    if ((htmlAttribute(node, "class") ?? "").split(/[\t\n\f\r ]+/).includes("wrap")) hasRoot = true;
    if (tag === "meta") {
      const directive = (htmlAttribute(node, "http-equiv") ?? "").trim().toLowerCase();
      if (directive === "refresh") errors.push("Meta refresh is not allowed.");
      if (directive === "content-security-policy" && node.parentNode?.tagName === "head" && restrictivePolicy(htmlAttribute(node, "content"))) hasPolicy = true;
    }
    if (tag === "script") errors.push("<script> is not allowed.");
    if (["iframe", "frame", "frameset", "object", "embed", "form", "base"].includes(tag)) errors.push("Frames, plugins, forms, and base tags are not allowed.");
    if (["animate", "animatemotion", "animatetransform", "set"].includes(tag)) errors.push("Active SVG animation is not allowed.");
    if (tag === "style") checkCss(styleText(node), "stylesheet");
    for (const attribute of node.attrs) {
      const name = attribute.name.toLowerCase();
      if (/^on[a-z]+$/.test(name)) errors.push("Inline event-handler attributes are not allowed.");
      if (name === "style") checkCss(attribute.value, "declarationList");
      if (CSS_RESOURCE_ATTRIBUTES.has(name)) checkCss(attribute.value, "value");
      // The static capture contract uses one explicit resource per element.
      // Reject responsive URL lists rather than partially parsing their grammar.
      if (["srcset", "imagesrcset"].includes(name)) errors.push("Responsive resource lists are not supported; use a single src.");
      const urls = name === "ping" ? attribute.value.split(/[\t\n\f\r ]+/) : URL_ATTRIBUTES.has(name) ? [attribute.value] : [];
      for (const resource of urls) {
        const error = resourceError(resource, allowNetwork);
        if (error) errors.push(error);
      }
    }
  }
  if (!hasDoctype) errors.push("Missing <!doctype html>.");
  if (!hasRoot) errors.push('Missing a root element with class="wrap".');
  if (!hasPolicy) errors.push("Missing a restrictive Content-Security-Policy with default-src 'none'.");
  return [...new Set(errors)];
}

export async function validateHtmlFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  const info = await stat(absolutePath);
  if (!info.isFile()) throw new Error(`HTML input is not a file: ${absolutePath}`);
  if (info.size > MAX_HTML_BYTES) {
    throw new Error(`HTML input exceeds ${MAX_HTML_BYTES} bytes.`);
  }

  const source = await readFile(absolutePath, "utf8");
  const errors = validateHtmlSource(source, options);
  if (errors.length) {
    throw new Error(`Unsafe or invalid HTML:\n- ${errors.join("\n- ")}`);
  }
  return absolutePath;
}

function usage() {
  console.log(`Usage:
  node scripts/validate-html.mjs --html <file> [--allow-network]

Options:
  --html <path>       HTML file to validate
  --allow-network     Permit remote src/href/@import/url() references
  -h, --help          Show help`);
}

function parseCli(argv) {
  let html = null;
  let allowNetwork = false;
  let help = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--html") html = argv[++i] ?? null;
    else if (arg === "--allow-network") allowNetwork = true;
    else if (arg === "-h" || arg === "--help") help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return { html, allowNetwork, help };
}

async function main() {
  const args = parseCli(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  if (!args.html) throw new Error("--html is required.");
  const validated = await validateHtmlFile(args.html, { allowNetwork: args.allowNetwork });
  console.log(`Validated: ${validated}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
