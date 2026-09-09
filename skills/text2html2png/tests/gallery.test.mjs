import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { browserIsUsable } from './helpers/browser.mjs';
import { findChrome } from '../scripts/screenshot.mjs';
import { renderDocument } from '../scripts/pipeline/render-document.mjs';
import { loadExamples } from '../scripts/build-examples.mjs';
import { galleryPage, escapeHtml } from '../../../scripts/gallery-page.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const docs = path.join(repo, 'docs');

test('downloaded Diagram JSON reproduces the published HTML in both languages', async () => {
  for (const example of await loadExamples()) {
    for (const locale of example.locales) {
      const stem = path.join(docs, 'examples', `${example.id}-${locale}`);
      const definition = JSON.parse(await readFile(stem + '.diagram.json', 'utf8'));
      const fixture = JSON.parse(await readFile(example.fixturePathFor(locale), 'utf8'));
      assert.deepEqual(definition.data, fixture, `${example.id}/${locale}: stale JSON`);
      const result = await renderDocument(definition);
      assert.equal(await readFile(stem + '.html', 'utf8'), result.html, `${example.id}/${locale}: HTML must use the public renderer`);
    }
  }
});

test('gallery previews and downloads stay on the published site and resolve', async () => {
  for (const file of ['index.html', 'zh.html']) {
    const html = await readFile(path.join(docs, file), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      if (/^https?:/.test(match[1])) continue;
      await access(path.join(docs, match[1]));
    }
    assert.equal((html.match(/class="gallery-item"/g) || []).length, (await loadExamples()).length);
    assert.match(html, /\.diagram\.json" download/);
    assert.doesNotMatch(html, /href="https:\/\/github\.com[^\"]+\.html"/);
  }
});

test('example source text is escaped before it becomes gallery markup', () => {
  const title = '</h3><script>alert("unsafe")</script>';
  const example = { id: 'service-architecture', title, summary: title, prompt: title, chart: 'architecture', theme: 'clean', fixtures: { en: { title } } };
  const html = galleryPage([example], 'en');
  assert.ok(html.includes(escapeHtml(title)));
  assert.ok(!html.includes(title));
});

test('gallery switching, prompt copy, fallback, and mobile layout work', async t => {
  const usable = await browserIsUsable();
  if (!usable.usable) return t.skip(usable.reason);
  const browser = await puppeteer.launch({ executablePath: await findChrome(), headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedText = text; } } });
    });
    await page.goto(pathToFileURL(path.join(docs, 'zh.html')).href);
    assert.equal(await page.locator('.demo-panel:not([hidden])').wait().then(() => page.$eval('.demo-panel:not([hidden])', e => e.id)), 'demo-service-architecture');
    await page.click('[data-demo="demo-order-event-architecture"]');
    assert.equal(await page.$$eval('.demo-panel:not([hidden])', nodes => nodes.length), 1);
    await page.click('[data-copy="prompt-order-event-architecture"]');
    const copied = await page.evaluate(() => window.copiedText);
    assert.match(copied, /OrderCreated/);
    assert.match(copied, /同时导出 PNG/);
    assert.match(copied, /Diagram JSON/);
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw Error('denied'); }; });
    await page.click('[data-copy="install-command"]');
    await page.waitForFunction(() => document.getElementById('copy-status').textContent.includes('手动复制'));
    assert.match(await page.evaluate(() => getSelection().toString()), /npx skills add/);
    for (const locale of ['zh.html', 'index.html']) {
      await page.goto(pathToFileURL(path.join(docs, locale)).href);
      for (const width of [375, 760, 1280]) {
        await page.setViewport({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} overflows at ${width}px`);
      }
      const broken = await page.$$eval('img', imgs => imgs.filter(img => img.complete && !img.naturalWidth).map(img => img.src));
      assert.deepEqual(broken, []);
    }
    await page.setJavaScriptEnabled(false);
    await page.goto(pathToFileURL(path.join(docs, 'zh.html')).href);
    assert.equal(await page.$$eval('.demo-panel:not([hidden])', nodes => nodes.length), 3, 'examples remain available without JavaScript');
  } finally { await browser.close(); }
});
