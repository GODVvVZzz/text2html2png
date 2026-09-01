#!/usr/bin/env node

// Regenerates every gallery PNG from its committed HTML using the settings
// recorded in the example manifest, so any reader can reproduce the published
// images byte-for-byte on their own machine.

import process from "node:process";
import { pathToFileURL } from "node:url";
import { loadExamples } from "./examples.mjs";
import { renderScreenshot } from "./screenshot.mjs";

function usage() {
  console.log(`Usage:
  node scripts/render-examples.mjs [options]

Options:
  --only <id>       Render a single example
  --scale <n>       Override the device scale factor, 1-4
  --chrome <path>   Chrome/Chromium executable override
  --no-sandbox      Disable Chrome sandbox in a trusted isolated container
  -h, --help        Show help`);
}

async function main() {
  const argv = process.argv.slice(2);
  let only = null;
  let scale = null;
  let chrome = null;
  let noSandbox = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--only") only = argv[++i] ?? null;
    else if (arg === "--scale") scale = Number(argv[++i]);
    else if (arg === "--chrome") chrome = argv[++i] ?? null;
    else if (arg === "--no-sandbox") noSandbox = true;
    else if (arg === "-h" || arg === "--help") {
      usage();
      return;
    } else throw new Error(`Unknown option: ${arg}`);
  }

  const examples = (await loadExamples()).filter((example) => !only || example.id === only);
  if (!examples.length) throw new Error(`No example matches --only ${only}`);

  for (const example of examples) {
    const output = await renderScreenshot({
      html: example.htmlPath,
      out: example.pngPath,
      bg: example.background,
      width: example.width,
      padding: 32,
      scale: scale ?? example.scale,
      selector: ".wrap",
      chrome,
      allowNetwork: false,
      noSandbox,
      force: true,
    });
    console.log(`${example.id} -> ${output}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
