#!/usr/bin/env node

// Audits every published example at its own recorded viewport width. This is the
// gate that keeps the gallery honest: a diagram cannot ship with clipped text,
// content outside the capture area, unreadable type, or colliding labels.

import process from "node:process";
import { pathToFileURL } from "node:url";
import { loadExamples } from "./examples.mjs";
import { auditLayout, formatReport } from "./audit-layout.mjs";

function usage() {
  console.log(`Usage:
  node scripts/audit-examples.mjs [options]

Options:
  --strict          Treat warnings as failures
  --chrome <path>   Chrome/Chromium executable override
  --no-sandbox      Disable Chrome sandbox in a trusted isolated container
  -h, --help        Show help`);
}

async function main() {
  const argv = process.argv.slice(2);
  let strict = false;
  let chrome = null;
  let noSandbox = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--strict") strict = true;
    else if (arg === "--chrome") chrome = argv[++i] ?? null;
    else if (arg === "--no-sandbox") noSandbox = true;
    else if (arg === "-h" || arg === "--help") {
      usage();
      return;
    } else throw new Error(`Unknown option: ${arg}`);
  }

  const examples = await loadExamples();
  let failed = 0;

  for (const example of examples) {
    const report = await auditLayout({
      html: example.htmlPath,
      width: example.width,
      scale: 2,
      selector: ".wrap",
      padding: 32,
      minFont: 10,
      minBodyFont: 12,
      minContrast: 4.5,
      overlap: 0.35,
      chrome,
      allowNetwork: false,
      noSandbox,
    });

    const bad = report.errors > 0 || (strict && report.warnings > 0);
    if (bad) failed += 1;
    const status = report.errors > 0 ? "FAIL" : report.warnings > 0 ? "WARN" : "PASS";
    console.log(`${status} ${example.id} (${example.chart} x ${example.style}, ${example.width}px)`);
    if (report.findings.length) {
      console.log(formatReport(report).split("\n").map((line) => `     ${line}`).join("\n"));
    }
  }

  console.log(`\n${examples.length - failed}/${examples.length} examples pass the layout audit.`);
  if (failed) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
