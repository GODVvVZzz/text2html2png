import assert from "node:assert/strict";
import { copyFile, mkdtemp, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseArgs, renderScreenshot } from "../scripts/screenshot.mjs";
import { browserIsUsable } from "./helpers/browser.mjs";

const testDir = path.dirname(fileURLToPath(import.meta.url));

test("validates numeric CLI options", () => {
  assert.throws(
    () => parseArgs(["--html", "a.html", "--out", "a.png", "--scale", "8"]),
    /--scale/
  );
});

test("preserves the HTML background unless an override is explicit", () => {
  const args = parseArgs(["--html", "a.html", "--out", "a.png"]);
  assert.equal(args.bg, "auto");
});

test("renders a non-empty PNG when Chrome is available", async (context) => {
  const browser = await browserIsUsable();
  if (!browser.usable) {
    context.skip(browser.reason);
    return;
  }

  const outputDir = await mkdtemp(path.join(os.tmpdir(), "text2html2png-test-"));
  const input = path.join(outputDir, "input # one.html");
  await copyFile(path.join(testDir, "fixtures", "smoke.html"), input);
  const output = path.join(outputDir, "smoke.png");
  await renderScreenshot({
    html: input,
    out: output,
    bg: "#faf6ee",
    width: 840,
    padding: 24,
    scale: 1,
    selector: ".wrap",
    chrome: null,
    allowNetwork: false,
    noSandbox: false,
    force: false,
  });
  assert.ok((await stat(output)).size > 10_000);
});
