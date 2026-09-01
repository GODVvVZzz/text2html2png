#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const MAX_HTML_BYTES = 5 * 1024 * 1024;

export function validateHtmlSource(source, { allowNetwork = false } = {}) {
  const errors = [];

  if (!/<!doctype\s+html/i.test(source)) {
    errors.push("Missing <!doctype html>.");
  }
  if (!/class\s*=\s*["'][^"']*\bwrap\b/i.test(source)) {
    errors.push('Missing a root element with class="wrap".');
  }
  if (!/content-security-policy/i.test(source) || !/default-src\s+'none'/i.test(source)) {
    errors.push("Missing a restrictive Content-Security-Policy with default-src 'none'.");
  }

  const forbidden = [
    [/<script\b/i, "<script> is not allowed."],
    [/\bon[a-z]+\s*=/i, "Inline event-handler attributes are not allowed."],
    [/javascript\s*:/i, "javascript: URLs are not allowed."],
    [/<\s*(?:iframe|object|embed|form|base)\b/i, "Frames, plugins, forms, and base tags are not allowed."],
    [/<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i, "Meta refresh is not allowed."],
    [/(?:src|href)\s*=\s*["']\s*file:/i, "Local file src/href references are blocked."],
    [/url\(\s*["']?\s*file:/i, "Local file CSS resources are blocked."],
  ];

  for (const [pattern, message] of forbidden) {
    if (pattern.test(source)) errors.push(message);
  }

  if (!allowNetwork) {
    const networkPatterns = [
      [/(?:src|href)\s*=\s*["']\s*(?:https?:)?\/\//i, "Remote src/href is blocked."],
      [/@import\s+(?:url\()?\s*["']?\s*(?:https?:)?\/\//i, "Remote CSS imports are blocked."],
      [/url\(\s*["']?\s*(?:https?:)?\/\//i, "Remote CSS resources are blocked."],
    ];
    for (const [pattern, message] of networkPatterns) {
      if (pattern.test(source)) errors.push(message);
    }
  }

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
