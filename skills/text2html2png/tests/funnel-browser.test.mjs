import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import puppeteer from "puppeteer-core";
import { renderDocument } from "../scripts/pipeline/render-document.mjs";
import { auditLayout, formatReport, parseArgs as auditArgs } from "../scripts/audit-layout.mjs";
import { findChrome } from "../scripts/screenshot.mjs";
import { browserIsUsable } from "./helpers/browser.mjs";

test("funnel proportions and labels survive all five themes in Chinese and English", async context => {
  const available = await browserIsUsable();
  if (!available.usable) return context.skip(available.reason);
  const dir = await mkdtemp(path.join(tmpdir(), "diagram-funnel-matrix-"));
  const browser = await puppeteer.launch({ executablePath: await findChrome(), headless: true });
  try {
    const page = await browser.newPage();
    for (const theme of ["clean", "editorial", "notebook", "warm", "glass"]) {
      for (const locale of ["zh-CN", "en-US"]) {
        const width = locale === "zh-CN" ? 520 : 920;
        const names = locale === "zh-CN" ? ["访问", "注册", "激活", "付费", "续费"] : ["Visits", "Signups", "Activation", "Payment", "Renewal"];
        const values = [1000, 400, 100, 0.001, 0];
        const result = await renderDocument({ schemaVersion: 1, chart: "funnel", theme, render: { width }, data: {
          id: "conversion-regression", locale, title: locale === "zh-CN" ? "注册转化" : "Signup conversion",
          stages: values.map((value, index) => ({ name: names[index], value })),
        } });
        const html = path.join(dir, `${theme}-${locale}.html`);
        await writeFile(html, result.html);
        const report = await auditLayout(auditArgs(["--html", html, "--width", String(width), "--scale", "1", "--padding", "24"]));
        assert.equal(report.errors + report.warnings, 0, `${theme}/${locale}: ${formatReport(report)}`);
        await page.setViewport({ width, height: 1000 });
        await page.goto(pathToFileURL(html).href);
        await page.evaluate(() => document.fonts.ready);
        const stages = await page.$$eval(".funnel-stage", elements => elements.map(element => ({
          track: element.querySelector(".funnel-track").getBoundingClientRect().width,
          bar: element.querySelector(".funnel-bar").getBoundingClientRect().width,
          label: element.querySelector(".funnel-stage-name").textContent,
          count: element.querySelector(".funnel-stage-num").textContent,
          share: element.querySelector(".funnel-pct").textContent,
        })));
        for (let i = 0; i < stages.length; i++) {
          assert.ok(Math.abs(stages[i].bar - stages[i].track * values[i] / 1000) < 1, `${theme}/${locale} stage ${i} has distorted geometry`);
          assert.equal(stages[i].label, names[i]);
        }
        assert.deepEqual(stages.map(stage => stage.share), ["100%", "40%", "10%", "<0.01%", "0%"]);
        assert.equal(stages[3].count, "0.001");
        assert.equal(stages[4].bar, 0);
      }
    }
  } finally { await browser.close(); await rm(dir, { recursive: true, force: true }); }
});
