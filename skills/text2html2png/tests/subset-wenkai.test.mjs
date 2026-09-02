import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWenKaiFaces,
  formatUnicodeRange,
  parseUnicodeRangeValue,
} from "../scripts/subset-wenkai.mjs";

// Exported internals are exercised for the pure parsing/formatting logic; the
// full pipeline test runs real woff2 re-subsetting through harfbuzzjs.

test("parseUnicodeRangeValue expands ranges, singletons and wildcards", () => {
  assert.deepEqual(parseUnicodeRangeValue("U+4e2d"), [[0x4e2d, 0x4e2d]]);
  assert.deepEqual(parseUnicodeRangeValue("U+4e00-4e02, U+5185"), [
    [0x4e00, 0x4e02],
    [0x5185, 0x5185],
  ]);
  // U+4e?? expands to 0x4e00..0x4eff
  assert.deepEqual(parseUnicodeRangeValue("U+4e??"), [[0x4e00, 0x4eff]]);
});

test("formatUnicodeRange merges consecutive codepoints", () => {
  assert.equal(formatUnicodeRange([0x4e00, 0x4e01, 0x4e02, 0x5185]), "U+4e00-4e02, U+5185");
  assert.equal(formatUnicodeRange([0x41]), "U+41");
});

test("empty or whitespace-only text produces no faces", async () => {
  const empty = await buildWenKaiFaces("");
  assert.equal(empty.css, "");
  assert.equal(empty.faces.length, 0);
  const blanks = await buildWenKaiFaces(" \n\t ");
  assert.equal(blanks.css, "");
});

test("mixed text subsets to small data-URI faces covering every codepoint", async () => {
  const text = "每周发布节奏追踪 Weekly Release Tracker：后端 42 项任务、前端 31 项任务。";
  const result = await buildWenKaiFaces(text);

  assert.ok(result.faces.length >= 1, "at least one chunk is retained");
  assert.ok(result.css.includes("@font-face"));
  assert.ok(result.css.includes('font-family: "LXGW WenKai"'));
  assert.ok(result.css.includes("font-weight: 700"));
  assert.ok(result.css.includes('url(data:font/woff2;base64,'));
  assert.ok(result.css.includes("unicode-range: U+"));

  // Every non-whitespace codepoint of the text must be claimed by some face.
  const covered = new Set();
  for (const face of result.faces) for (const cp of face.codepoints) covered.add(cp);
  for (const char of text) {
    if (/\s/u.test(char)) continue;
    assert.ok(covered.has(char.codePointAt(0)), `codepoint of ${char} is covered`);
  }

  // Re-subsetting must beat the source chunks: a handful of chars is far
  // smaller than any 5-70KB chunk.
  assert.ok(result.totalBytes < 100 * 1024, `total ${result.totalBytes} bytes stays small`);
  for (const face of result.faces) {
    assert.ok(face.bytes > 0 && face.bytes < 80 * 1024);
  }
});

test("subsetting is deterministic", async () => {
  const text = "转化漏斗 Funnel：简历初筛 → Offer 签发。";
  const a = await buildWenKaiFaces(text);
  const b = await buildWenKaiFaces(text);
  assert.equal(a.css, b.css);
  assert.equal(a.totalBytes, b.totalBytes);
});

test("overlapping text shrinks: more reuse means fewer extra bytes", async () => {
  const base = await buildWenKaiFaces("数据库建模与服务端实现联调回归");
  const grown = await buildWenKaiFaces(base && "数据库建模与服务端实现联调回归,前端组件开发提测");
  assert.ok(grown.totalBytes >= base.totalBytes);
  assert.ok(grown.totalBytes < base.totalBytes + 8 * 1024);
});
