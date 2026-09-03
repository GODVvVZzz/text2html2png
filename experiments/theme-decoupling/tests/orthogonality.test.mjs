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

test("icon slots are single-channel: warm shows emoji, minimal shows SVG", async () => {
  const warm = themeDefinitions(await readFile(path.join(themesDir, "warm.css"), "utf8"), "warm");
  assert.equal(warm.get("--t-emoji-display"), "inline-flex");
  assert.equal(warm.get("--t-svg-display"), "none");
  const minimal = themeDefinitions(await readFile(path.join(themesDir, "minimal.css"), "utf8"), "minimal");
  assert.equal(minimal.get("--t-emoji-display"), "none");
  assert.equal(minimal.get("--t-svg-display"), "inline-flex");
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
  const zhWarm = await readFile(path.join(output, "comparison-zh-warm.html"), "utf8");
  const zhPaper = await readFile(path.join(output, "comparison-zh-paper.html"), "utf8");
  const enWarm = await readFile(path.join(output, "comparison-en-warm.html"), "utf8");
  assert.equal(stripThemeBlock(zhWarm), stripThemeBlock(zhPaper));
  assert.equal(structureFingerprint(zhWarm), structureFingerprint(enWarm));
  assert.match(zhWarm, /📊/);
  assert.match(zhWarm, /col-icon-svg/);
});

test("every discovered chart renders through the same theme pipeline", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "t2h-multichart-proof-"));
  await run(process.execPath, [buildScript, "--out", output]);
  const zhFlow = await readFile(path.join(output, "flowchart-zh-warm.html"), "utf8");
  const enFlow = await readFile(path.join(output, "flowchart-en-glass.html"), "utf8");
  assert.equal(structureFingerprint(zhFlow), structureFingerprint(enFlow));
  assert.match(zhFlow, /step-icon-svg/);
  assert.match(zhFlow, /class="arrow"/);
});

test("restyle changes only the canonical theme block", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "t2h-restyle-proof-"));
  await run(process.execPath, [buildScript, "--out", output, "--theme", "warm", "--locale", "zh"]);
  const input = path.join(output, "comparison-zh-warm.html");
  const target = path.join(output, "comparison-zh-editorial.html");
  await restyle({ html: input, theme: "editorial", out: target, force: false });
  const before = await readFile(input, "utf8");
  const after = await readFile(target, "utf8");
  assert.equal(stripThemeBlock(before), stripThemeBlock(after));
  assert.match(after, /data-theme="editorial"/);
});
