#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, rename, stat, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { validateHtmlFile } from "./validate-html.mjs";

const MAX_RENDER_PIXELS = 50_000_000;

function usage() {
  console.log(`Usage:
  node scripts/screenshot.mjs --html <file> --out <file> [options]

Options:
  --html <path>       Input HTML file (required)
  --out <path>        Output PNG file (required)
  --bg <css-color>    Padding/background color; use auto for page CSS (default: auto)
  --width <px>        Initial viewport width, 320–3000 (default: 920)
  --padding <px>      Padding around .wrap, 0–160 (default: 32)
  --scale <n>         Device scale factor, 1–4 (default: 2)
  --selector <css>    Element to capture (default: .wrap)
  --chrome <path>     Chrome/Chromium executable override
  --allow-network     Permit network requests declared in the HTML
  --no-sandbox        Disable Chrome sandbox in a trusted isolated container
  --force             Replace an existing output file
  -h, --help          Show help`);
}

function numberInRange(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }
  return parsed;
}

export function parseArgs(argv) {
  const args = {
    html: null,
    out: null,
    bg: "auto",
    width: 920,
    padding: 32,
    scale: 2,
    selector: ".wrap",
    chrome: null,
    allowNetwork: false,
    noSandbox: false,
    force: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--html") args.html = argv[++i] ?? null;
    else if (arg === "--out") args.out = argv[++i] ?? null;
    else if (arg === "--bg") args.bg = argv[++i] ?? null;
    else if (arg === "--width") args.width = numberInRange(argv[++i], "--width", 320, 3000);
    else if (arg === "--padding") args.padding = numberInRange(argv[++i], "--padding", 0, 160);
    else if (arg === "--scale") args.scale = numberInRange(argv[++i], "--scale", 1, 4);
    else if (arg === "--selector") args.selector = argv[++i] ?? null;
    else if (arg === "--chrome") args.chrome = argv[++i] ?? null;
    else if (arg === "--allow-network") args.allowNetwork = true;
    else if (arg === "--no-sandbox") args.noSandbox = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (!args.help) {
    if (!args.html) throw new Error("--html is required.");
    if (!args.out) throw new Error("--out is required.");
    if (!args.bg) throw new Error("--bg requires a value.");
    if (!args.selector) throw new Error("--selector requires a value.");
  }
  return args;
}

async function isExecutable(candidate) {
  if (!candidate) return false;
  try {
    await access(candidate, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveCommand(command) {
  const resolver = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(resolver, [command], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? null;
}

export async function findChrome(override = null) {
  const envCandidates = [
    override,
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ];

  const platformCandidates = process.platform === "darwin"
    ? [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
      ]
    : process.platform === "win32"
      ? [
          path.join(process.env.PROGRAMFILES ?? "", "Google/Chrome/Application/chrome.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] ?? "", "Google/Chrome/Application/chrome.exe"),
          path.join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
          path.join(process.env.PROGRAMFILES ?? "", "Microsoft/Edge/Application/msedge.exe"),
          path.join(process.env.LOCALAPPDATA ?? "", "Microsoft/Edge/Application/msedge.exe"),
        ]
      : [
          "google-chrome",
          "google-chrome-stable",
          "chromium",
          "chromium-browser",
          "microsoft-edge",
          "brave-browser",
        ];

  for (const candidate of [...envCandidates, ...platformCandidates]) {
    if (!candidate) continue;
    if (path.isAbsolute(candidate) && await isExecutable(candidate)) return candidate;
    if (!path.isAbsolute(candidate)) {
      const resolved = resolveCommand(candidate);
      if (resolved && await isExecutable(resolved)) return resolved;
    }
  }

  throw new Error(
    "Chrome, Chromium, Edge, or Brave was not found. Install one or pass --chrome / set CHROME_PATH."
  );
}

async function outputExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

export async function renderScreenshot(args) {
  const htmlPath = await validateHtmlFile(args.html, { allowNetwork: args.allowNetwork });
  const documentUrl = pathToFileURL(htmlPath).href;
  const outPath = path.resolve(args.out);
  if (path.extname(outPath).toLowerCase() !== ".png") {
    throw new Error("--out must end in .png.");
  }
  if (await outputExists(outPath) && !args.force) {
    throw new Error(`Output already exists: ${outPath}. Pass --force to replace it.`);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  const chromePath = await findChrome(args.chrome);
  const launchArgs = [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-first-run",
  ];
  if (args.noSandbox) launchArgs.push("--no-sandbox", "--disable-setuid-sandbox");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: launchArgs,
  });

  const tempPath = path.join(path.dirname(outPath), `.${path.basename(outPath)}.${randomUUID()}.tmp.png`);

  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      const local = url === documentUrl || url.startsWith("data:") || url.startsWith("about:");
      const permittedNetwork = args.allowNetwork && /^https?:/i.test(url);
      if (local || permittedNetwork) request.continue();
      else request.abort("blockedbyclient");
    });

    await page.setViewport({
      width: Math.ceil(args.width),
      height: 1000,
      deviceScaleFactor: args.scale,
    });
    await page.goto(documentUrl, { waitUntil: "load", timeout: 30_000 });

    if (args.bg !== "auto") {
      await page.evaluate((bg) => {
        document.documentElement.style.backgroundColor = bg;
        document.body.style.backgroundColor = bg;
      }, args.bg);
    }

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }
    });

    const box = await page.$eval(args.selector, (element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: Math.max(rect.width, element.scrollWidth),
        height: Math.max(rect.height, element.scrollHeight),
      };
    }).catch(() => {
      throw new Error(`Capture selector not found: ${args.selector}`);
    });

    if (!(box.width > 0 && box.height > 0)) {
      throw new Error("Capture element has zero width or height.");
    }

    const clipX = Math.max(0, Math.floor(box.x - args.padding));
    const clipY = Math.max(0, Math.floor(box.y - args.padding));
    const clipWidth = Math.ceil(box.width + args.padding * 2);
    const clipHeight = Math.ceil(box.height + args.padding * 2);
    const viewportWidth = Math.max(Math.ceil(args.width), clipX + clipWidth + 2);
    const viewportHeight = Math.max(1, clipY + clipHeight + 2);
    const renderPixels = viewportWidth * viewportHeight * args.scale * args.scale;
    if (renderPixels > MAX_RENDER_PIXELS) {
      throw new Error(
        `Render would allocate about ${Math.round(renderPixels / 1_000_000)} MP. Reduce --scale/--width or split the diagram.`
      );
    }

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor: args.scale,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    await page.screenshot({
      path: tempPath,
      type: "png",
      clip: {
        x: clipX,
        y: clipY,
        width: clipWidth,
        height: clipHeight,
      },
      captureBeyondViewport: false,
    });

    if (args.force && await outputExists(outPath)) await unlink(outPath);
    await rename(tempPath, outPath);
    return outPath;
  } finally {
    await browser.close();
    if (await outputExists(tempPath)) await unlink(tempPath);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const output = await renderScreenshot(args);
  console.log(output);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
