import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { auditLayout, formatReport, parseArgs } from "../scripts/audit-layout.mjs";
import { browserIsUsable } from "./helpers/browser.mjs";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(testDir, "fixtures", name);

const auditOptions = {
  width: 700,
  scale: 1,
  selector: ".wrap",
  padding: 32,
  minFont: 10,
  minBodyFont: 12,
  minContrast: 4.5,
  overlap: 0.35,
  chrome: null,
  allowNetwork: false,
  noSandbox: false,
};

test("requires an input document", () => {
  assert.throws(() => parseArgs([]), /--html is required/);
});

test("validates numeric thresholds", () => {
  assert.throws(() => parseArgs(["--html", "a.html", "--min-contrast", "99"]), /--min-contrast/);
  assert.throws(() => parseArgs(["--html", "a.html", "--overlap", "0"]), /--overlap/);
});

test("reports a clean document as passing", async (context) => {
  const browser = await browserIsUsable();
  if (!browser.usable) {
    context.skip(browser.reason);
    return;
  }

  const report = await auditLayout({ ...auditOptions, width: 840, html: fixture("smoke.html") });
  assert.equal(report.errors, 0, formatReport(report));
});

test("detects clipping, overflow, unreadable type, filler, and overlap", async (context) => {
  const browser = await browserIsUsable();
  if (!browser.usable) {
    context.skip(browser.reason);
    return;
  }

  const report = await auditLayout({ ...auditOptions, html: fixture("broken-layout.html") });
  const rules = new Set(report.findings.map((finding) => finding.rule));

  for (const expected of [
    "CONTENT_OUT_OF_BOUNDS",
    "TEXT_CLIPPED",
    "TEXT_TRUNCATED",
    "FONT_TOO_SMALL",
    "EMPTY_FILLER",
    "TEXT_OVERLAP",
  ]) {
    assert.ok(rules.has(expected), `expected ${expected}, got ${[...rules].join(", ")}`);
  }

  assert.ok(report.errors > 0);
  for (const finding of report.findings) {
    assert.ok(finding.fix.length > 0, `${finding.rule} must suggest a repair`);
    assert.ok(finding.evidence.length > 0, `${finding.rule} must cite measured evidence`);
  }
});

test("catches text that is buried or invisible rather than merely misplaced", async (context) => {
  const browser = await browserIsUsable();
  if (!browser.usable) {
    context.skip(browser.reason);
    return;
  }

  const report = await auditLayout({ ...auditOptions, width: 660, html: fixture("hidden-content.html") });
  const rules = new Set(report.findings.map((finding) => finding.rule));

  // Geometry alone cannot see either of these: the text is correctly laid out
  // but absent from the rendered image.
  assert.ok(rules.has("TEXT_OCCLUDED"), `expected TEXT_OCCLUDED, got ${[...rules].join(", ")}`);
  assert.ok(rules.has("TEXT_INVISIBLE"), `expected TEXT_INVISIBLE, got ${[...rules].join(", ")}`);
  assert.ok(report.errors >= 2);
});

test("catches text that is only partly buried", async (context) => {
  const browser = await browserIsUsable();
  if (!browser.usable) {
    context.skip(browser.reason);
    return;
  }

  // Half-hidden text is as unusable as fully hidden text, so the rule samples a
  // grid rather than requiring every probe to be covered.
  const report = await auditLayout({ ...auditOptions, width: 760, html: fixture("partial-burial.html") });
  const occluded = report.findings.find((finding) => finding.rule === "TEXT_OCCLUDED");
  assert.ok(occluded, `expected TEXT_OCCLUDED, got ${report.findings.map((f) => f.rule).join(", ")}`);
  assert.match(occluded.evidence, /\d+% of the sampled text area/);
});

test("accepts a decorative shape that its own container intentionally clips", async (context) => {
  const browser = await browserIsUsable();
  if (!browser.usable) {
    context.skip(browser.reason);
    return;
  }

  const report = await auditLayout({ ...auditOptions, width: 620, html: fixture("decorative-clipping.html") });
  assert.equal(report.findings.length, 0, formatReport(report));
});

test("names the capture root when it is missing", async (context) => {
  const browser = await browserIsUsable();
  if (!browser.usable) {
    context.skip(browser.reason);
    return;
  }

  const report = await auditLayout({
    ...auditOptions,
    html: fixture("smoke.html"),
    selector: ".does-not-exist",
  });
  assert.equal(report.findings[0].rule, "CAPTURE_ROOT_MISSING");
  assert.equal(report.errors, 1);
});
