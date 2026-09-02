#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { validateHtmlFile } from "../../../skills/text2html2png/scripts/validate-html.mjs";
import { experimentDir, pipelineDir, themeDefinitions, validateMarkup } from "./validate-orthogonality.mjs";

const themesDir = path.join(pipelineDir, "themes");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

function usage() {
  console.log([
    "Usage:",
    "  node experiments/theme-decoupling/scripts/restyle.mjs --html <file> --theme <id> --out <file> [--force]",
    "",
    "Replaces only the canonical text2html2png theme block. Everything else is byte-identical."
  ].join("\n"));
}

function parseArgs(argv) {
  const args = { html: null, theme: null, out: null, force: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--html") args.html = argv[++i] || null;
    else if (arg === "--theme") args.theme = argv[++i] || null;
    else if (arg === "--out") args.out = argv[++i] || null;
    else if (arg === "--force") args.force = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error("Unknown option: " + arg);
  }
  if (!args.help && (!args.html || !args.theme || !args.out)) {
    throw new Error("--html, --theme, and --out are required.");
  }
  if (args.theme && !/^[a-z0-9-]+$/.test(args.theme)) throw new Error("Invalid theme id.");
  return args;
}

export async function restyle(input) {
  const htmlPath = path.resolve(input.html);
  const outPath = path.resolve(input.out);
  const source = await readFile(htmlPath, "utf8");
  const themeCss = await readFile(path.join(themesDir, input.theme + ".css"), "utf8");
  themeDefinitions(themeCss, input.theme);

  const pattern = /<style id="text2html2png-theme" data-theme="[^"]+">[\s\S]*?<\/style>/i;
  if (!pattern.test(source)) throw new Error("Canonical theme block not found.");
  const replacement = [
    '<style id="text2html2png-theme" data-theme="' + input.theme + '">',
    themeCss.trim(),
    "</style>"
  ].join("\n");
  const output = source.replace(pattern, replacement);
  validateMarkup(output, path.basename(outPath));

  if (await exists(outPath) && !input.force) {
    throw new Error("Output already exists: " + outPath + ". Pass --force to replace it.");
  }
  await mkdir(path.dirname(outPath), { recursive: true });
  const tempPath = path.join(path.dirname(outPath), "." + path.basename(outPath) + "." + randomUUID() + ".tmp");
  try {
    await writeFile(tempPath, output, "utf8");
    await validateHtmlFile(tempPath);
    if (input.force && await exists(outPath)) await unlink(outPath);
    await rename(tempPath, outPath);
  } finally {
    if (await exists(tempPath)) await unlink(tempPath);
  }
  return outPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const output = await restyle(args);
  console.log(output);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(function (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
