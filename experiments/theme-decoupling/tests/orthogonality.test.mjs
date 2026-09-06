import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { restyle } from "../scripts/restyle.mjs";
import {
  stripThemeBlock,
  structureFingerprint,
  themeDefinitions,
  themesDir,
  validateChartCss,
  validateSources
} from "../scripts/validate-orthogonality.mjs";

const run = promisify(execFile);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const experimentDir = path.resolve(testDir, "..");
const buildScript = path.join(experimentDir, "scripts", "build.mjs");

test("five themes expose one identical token contract", async () => {
  const result = await validateSources();
  assert.equal(result.themes.length, 5);
  assert.equal(result.tokenCount, 52);
});

test("clean uses a single SVG icon channel", async () => {
  const clean = themeDefinitions(await readFile(path.join(themesDir, "clean.css"), "utf8"), "clean");
  assert.equal(clean.get("--t-emoji-display"), "none");
  assert.equal(clean.get("--t-svg-display"), "inline-flex");
});

test("warm and glass use one emoji channel", async () => {
  for (const id of ["warm", "glass"]) {
    const theme = themeDefinitions(await readFile(path.join(themesDir, id + ".css"), "utf8"), id);
    assert.equal(theme.get("--t-emoji-display"), "inline-flex");
    assert.equal(theme.get("--t-svg-display"), "none");
  }
});

test("chart CSS rejects a literal color outside the theme", () => {
  assert.throws(
    () => validateChartCss(".x { color: #fff; }", new Set()),
    /literal colors/
  );
});

test("build keeps source invariant across themes and DOM invariant across locales", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "t2h-theme-proof-"));
  await run(process.execPath, [buildScript, "--out", output]);
  const zhClean = await readFile(path.join(output, "comparison-zh-clean.html"), "utf8");
  const zhNotebook = await readFile(path.join(output, "comparison-zh-notebook.html"), "utf8");
  const zhWarm = await readFile(path.join(output, "comparison-zh-warm.html"), "utf8");
  const enClean = await readFile(path.join(output, "comparison-en-clean.html"), "utf8");
  assert.equal(stripThemeBlock(zhClean), stripThemeBlock(zhNotebook));
  assert.equal(stripThemeBlock(zhClean), stripThemeBlock(zhWarm));
  assert.equal(structureFingerprint(zhClean), structureFingerprint(enClean));
  assert.match(zhClean, /--t-emoji-display: none/);
  assert.match(zhClean, /col-icon-svg/);
  assert.match(zhWarm, /📊/);
});

test("every discovered chart renders through the same theme pipeline", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "t2h-multichart-proof-"));
  await run(process.execPath, [buildScript, "--out", output]);
  const zhFlow = await readFile(path.join(output, "flowchart-zh-clean.html"), "utf8");
  const enFlow = await readFile(path.join(output, "flowchart-en-clean.html"), "utf8");
  assert.equal(structureFingerprint(zhFlow), structureFingerprint(enFlow));
  assert.match(zhFlow, /step-icon-svg/);
  assert.match(zhFlow, /class="arrow"/);
});

test("restyle changes only the canonical theme block", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "t2h-restyle-proof-"));
  await run(process.execPath, [buildScript, "--out", output, "--theme", "clean", "--locale", "zh"]);
  const input = path.join(output, "comparison-zh-clean.html");
  const target = path.join(output, "comparison-zh-editorial.html");
  await restyle({ html: input, theme: "editorial", out: target, force: false });
  const before = await readFile(input, "utf8");
  const after = await readFile(target, "utf8");
  assert.equal(stripThemeBlock(before), stripThemeBlock(after));
  assert.match(after, /data-theme="editorial"/);
});
