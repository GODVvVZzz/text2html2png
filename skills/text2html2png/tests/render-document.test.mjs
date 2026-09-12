import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { renderDocument, validateDiagramDefinition } from "../scripts/pipeline/render-document.mjs";
import { validateHtmlSource } from "../scripts/validate-html.mjs";
import { validateChartCss, validateMarkup, REQUIRED_THEME_TOKENS } from "../scripts/pipeline/validate.mjs";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function definition() {
  const data = JSON.parse(await readFile(path.join(skillDir, "examples/service-architecture/zh.json"), "utf8"));
  return { schemaVersion: 1, chart: "architecture", theme: "clean", render: { width: 920, padding: 24, scale: 2 }, data };
}

test("renders identical HTML from identical Diagram JSON", async () => {
  const input = await definition();
  const first = await renderDocument(input);
  const second = await renderDocument(input);
  assert.equal(first.html, second.html);
  assert.match(first.html, /data-theme="clean"/);
  assert.match(first.html, /data-chart="architecture"/);
  assert.match(first.html, new RegExp(input.data.title));
});

test("escapes hostile copy before rendering", async () => {
  const input = await definition();
  input.data.title = '<script>alert("x")</script>';
  const result = await renderDocument(input);
  assert.doesNotMatch(result.html, /<script>alert/);
  assert.match(result.html, /&lt;script&gt;alert/);
});

test("preserves dollar signs and template markers in user copy", async () => {
  const input = await definition();
  input.data.title = "Cost $& $$ $` $' {{BODY}}";
  const { html } = await renderDocument(input);
  assert.ok(html.includes("<title>Cost $&amp; $$ $` $&#39; {{BODY}}</title>"));
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
});

test("rejects unknown versions, charts, themes, and envelope fields", async () => {
  const input = await definition();
  assert.throws(() => validateDiagramDefinition({ ...input, schemaVersion: 2 }), /schemaVersion/);
  await assert.rejects(renderDocument({ ...input, chart: "pie" }), /Unknown chart/);
  await assert.rejects(renderDocument({ ...input, theme: "neon" }), /Unknown theme/);
  assert.throws(() => validateDiagramDefinition({ ...input, surprise: true }), /Unknown diagram field/);
});

test("render width controls the canvas and invalid accents fail early", async () => {
  const input = await definition();
  input.render.width = 1040;
  const result = await renderDocument(input);
  assert.ok(result.html.includes("width: 992px; max-width: 100%"));
  input.data.layers[0].accent = 99;
  assert.throws(() => validateDiagramDefinition(input), /accent integer/);
});

test("issue numbers and code examples survive both renderer and browser safety validation", async () => {
  const input = await definition();
  input.data.title = "Release #1234 / Order #abcdef / online=12";
  input.data.layers[0].nodes[0].desc = 'CSS: rgb(1,2,3); <script>alert("example")</script>; $100; A & B; javascript: is text';
  const { html } = await renderDocument(input);
  assert.ok(html.includes(input.data.title));
  assert.match(html, /&lt;script&gt;alert\(&quot;example&quot;\)&lt;\/script&gt;/);
  assert.deepEqual(validateHtmlSource(html), []);
});

test("theme validation examines real CSS and attributes while preserving prose", () => {
  assert.doesNotThrow(() => validateMarkup('<main class="wrap">#1234 rgb(1,2,3) fill="red" style="color:red"</main>'));
  assert.throws(() => validateMarkup('<main style="color: #fff">x</main>'), /color|style/);
  assert.throws(() => validateMarkup('<svg><path fill="#fff"/></svg>'), /SVG color/);
  assert.throws(() => validateMarkup('<main style="--bar-width: url(https://example.test)">x</main>'), /geometry/);
  const tokens = new Set(REQUIRED_THEME_TOKENS);
  assert.doesNotThrow(() => validateChartCss('#abc { color: var(--t-text); content: "#fff rgba(1,2,3)"; }', tokens));
  assert.throws(() => validateChartCss('.x { color: rgb(1,2,3); }', tokens), /literal colors/);
});
