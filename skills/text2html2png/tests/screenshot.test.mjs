import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { findChrome, parseArgs, renderScreenshot } from "../scripts/screenshot.mjs";
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

test("captures viewport-relative content and the bottom of long documents", async (context) => {
  const available = await browserIsUsable();
  if (!available.usable) return context.skip(available.reason);
  const dir = await mkdtemp(path.join(os.tmpdir(), "diagram-capture-"));
  const browser = await puppeteer.launch({ executablePath: await findChrome(), headless: true });
  try {
    const page = await browser.newPage();
    for (const [name, css, content, expectedHeight, expectedPixel] of [
      ["centered", "body{min-height:100vh;display:flex;align-items:center;justify-content:center}.wrap{width:700px;height:120px;background:rgb(220,30,40)}", "<h1>Viewport centered</h1>", 168, [220,30,40,255]],
      ["long", "body{display:flex;justify-content:center}.wrap{width:700px;height:1600px;background:white}.end{margin-top:1500px;height:100px;background:rgb(20,60,210)}", '<div class="end">Bottom of document</div>', 1624, [20,60,210,255]],
    ]) {
      const html = path.join(dir, name + ".html");
      const png = path.join(dir, name + ".png");
      await writeFile(html, `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{margin:0;background:white}${css}</style></head><body><main class="wrap">${content}</main></body></html>`);
      await renderScreenshot(parseArgs(["--html", html, "--out", png, "--width", "920", "--padding", "24", "--scale", "1"]));
      const pixels = await page.evaluate(async (base64) => {
        const image = new Image();
        image.src = "data:image/png;base64," + base64;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return { width: image.width, height: image.height, bottom: [...ctx.getImageData(80, image.height - 50, 1, 1).data] };
      }, (await readFile(png)).toString("base64"));
      assert.equal(pixels.width, 748, name);
      assert.equal(pixels.height, expectedHeight, name);
      assert.deepEqual(pixels.bottom, expectedPixel, name + " must contain the target, not a blank or cropped image");
    }
  } finally {
    await browser.close();
    await rm(dir, { recursive: true, force: true });
  }
});
