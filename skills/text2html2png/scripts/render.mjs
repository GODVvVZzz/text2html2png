#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { renderDocument } from "./pipeline/render-document.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/render.mjs --input diagram.json --html output.html [--png output.png] [--audit] [--force]",
    "",
    "The JSON selects chart, theme, dimensions, and content. CLI flags only control files and browser execution.",
    "  --chrome <path>    Chrome/Chromium override",
    "  --no-sandbox       Trusted isolated container only",
    "  --json             Machine-readable success output",
  ].join("\n");
}

function args(argv) {
  const out = { input: null, html: null, png: null, audit: false, force: false, chrome: null, noSandbox: false, json: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (["--input", "--html", "--png", "--chrome"].includes(arg)
      && (!argv[i + 1] || argv[i + 1].startsWith("--"))) {
      throw new Error(arg + " requires a value.");
    }
    if (arg === "--input") out.input = argv[++i] ?? null;
    else if (arg === "--html") out.html = argv[++i] ?? null;
    else if (arg === "--png") out.png = argv[++i] ?? null;
    else if (arg === "--audit") out.audit = true;
    else if (arg === "--force") out.force = true;
    else if (arg === "--chrome") out.chrome = argv[++i] ?? null;
    else if (arg === "--no-sandbox") out.noSandbox = true;
    else if (arg === "--json") out.json = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error("Unknown option: " + arg);
  }
  if (!out.help && (!out.input || !out.html)) throw new Error("--input and --html are required.");
  return out;
}

async function exists(file) {
  try { await stat(file); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function atomicWrite(file, contents, force) {
  const target = path.resolve(file);
  if (await exists(target) && !force) throw new Error("Output already exists: " + target + ". Pass --force to replace it.");
  await mkdir(path.dirname(target), { recursive: true });
  const temp = path.join(path.dirname(target), "." + path.basename(target) + "." + randomUUID() + ".tmp");
  try {
    await writeFile(temp, contents, "utf8");
    if (force) await rename(temp, target);
    else await link(temp, target); // Atomic no-clobber publication.
  } finally {
    if (await exists(temp)) await unlink(temp);
  }
  return target;
}

export async function run(argv) {
  const options = args(argv);
  if (options.help) return { help: true };
  const inputPath = await realpath(path.resolve(options.input));
  const targets = [options.html, options.png].filter(Boolean).map((file) => path.resolve(file));
  const resolved = [];
  for (const target of targets) {
    let canonical;
    try { canonical = await realpath(target); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      canonical = target;
    }
    if (canonical === inputPath || resolved.includes(canonical)) {
      throw new Error("Input JSON, HTML, and PNG must use distinct paths.");
    }
    resolved.push(canonical);
    if (!options.force && await exists(target)) throw new Error("Output already exists: " + target + ". Pass --force to replace it.");
  }
  let definition;
  try { definition = JSON.parse(await readFile(path.resolve(options.input), "utf8")); }
  catch (error) { throw new Error("Cannot read diagram JSON: " + error.message); }
  const result = await renderDocument(definition);
  for (const warning of result.fontWarnings) console.error("warn: " + warning);
  const html = await atomicWrite(options.html, result.html, options.force);

  if (options.audit || options.png) {
    const { auditLayout, formatReport } = await import("./audit-layout.mjs");
    const report = await auditLayout({
      html, width: result.input.render.width, scale: 1, selector: ".wrap",
      padding: result.input.render.padding, minFont: 10, minBodyFont: 12,
      minContrast: 4.5, overlap: 0.35, chrome: options.chrome,
      allowNetwork: false, noSandbox: options.noSandbox,
    });
    if (report.errors || report.warnings) throw new Error(formatReport(report));
  }

  let png = null;
  if (options.png) {
    const { renderScreenshot } = await import("./screenshot.mjs");
    png = await renderScreenshot({
      html, out: path.resolve(options.png), bg: "auto", width: result.input.render.width,
      padding: result.input.render.padding, scale: result.input.render.scale,
      selector: ".wrap", chrome: options.chrome, allowNetwork: false,
      noSandbox: options.noSandbox, force: options.force,
    });
  }
  return { html, png, chart: result.input.chart, theme: result.input.theme };
}

async function main() {
  try {
    const result = await run(process.argv.slice(2));
    if (result.help) console.log(usage());
    else if (process.argv.includes("--json")) console.log(JSON.stringify(result));
    else console.log([result.html, result.png].filter(Boolean).join("\n"));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
