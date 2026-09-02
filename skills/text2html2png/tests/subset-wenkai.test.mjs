import assert from "node:assert/strict";
import test from "node:test";
import { buildWenKaiFaces } from "../scripts/subset-wenkai.mjs";

// The full pipeline test runs real woff2 re-subsetting through harfbuzzjs
// against the @fontsource/lxgw-wenkai bold source.

test("empty or whitespace-only text produces no faces", async () => {
  const empty = await buildWenKaiFaces("");
  assert.equal(empty.css, "");
  assert.equal(empty.faces.length, 0);
  const blanks = await buildWenKaiFaces(" \n\t ");
  assert.equal(blanks.css, "");
});

test("mixed text subsets to one small data-URI face", async () => {
  const text = "每周发布节奏追踪 Weekly Release Tracker：后端 42 项任务、前端 31 项任务。";
  const result = await buildWenKaiFaces(text);

  assert.equal(result.faces.length, 1);
  assert.ok(result.css.includes("@font-face"));
  assert.ok(result.css.includes('font-family: "LXGW WenKai"'));
  assert.ok(result.css.includes("font-weight: 700"));
  assert.ok(result.css.includes("url(data:font/woff2;base64,"));
  assert.ok(!result.css.includes("unicode-range"), "single face needs no range gating");

  const [face] = result.faces;
  const uniqueGlyphs = new Set([...text].filter((c) => !/\s/u.test(c))).size;
  assert.equal(face.glyphCount, uniqueGlyphs);
  // A subset must be orders of magnitude smaller than the 7.5MB source.
  assert.ok(face.bytes > 0 && face.bytes < 100 * 1024, `subset is ${face.bytes} bytes`);
  assert.ok(result.totalBytes === face.bytes);
});

test("subsetting is deterministic", async () => {
  const text = "转化漏斗 Funnel：简历初筛 → Offer 签发。";
  const a = await buildWenKaiFaces(text);
  const b = await buildWenKaiFaces(text);
  assert.equal(a.css, b.css);
  assert.equal(a.totalBytes, b.totalBytes);
});

test("growing text only grows the subset by its extra glyphs", async () => {
  const base = await buildWenKaiFaces("数据库建模与服务端实现联调回归");
  const grown = await buildWenKaiFaces(base && "数据库建模与服务端实现联调回归,前端组件开发提测");
  assert.ok(grown.totalBytes >= base.totalBytes);
  assert.ok(grown.totalBytes < base.totalBytes + 8 * 1024);
});
