import puppeteer from "puppeteer-core";
import { findChrome } from "../../scripts/screenshot.mjs";

let cached = null;

// A browser that exists is not the same as a browser that starts. Restricted
// containers and sandbox-less CI images fail at launch, so probe once and let
// callers skip cleanly instead of reporting a false test failure.
export async function browserIsUsable() {
  if (cached !== null) return cached;

  let executablePath;
  try {
    executablePath = await findChrome();
  } catch {
    cached = { usable: false, reason: "No Chrome-family browser was found." };
    return cached;
  }

  let browser;
  try {
    browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-first-run"] });
    cached = { usable: true, reason: null };
  } catch (error) {
    cached = {
      usable: false,
      reason: `Chrome was found but did not launch: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`,
    };
  } finally {
    await browser?.close();
  }
  return cached;
}
