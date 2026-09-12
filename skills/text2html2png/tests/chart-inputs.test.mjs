import assert from "node:assert/strict";
import test from "node:test";
import { assertFixture as dashboard, bodyMarkup as dashboardHtml } from "../scripts/pipeline/charts/dashboard/body.mjs";
import { assertFixture as comparison, bodyMarkup as comparisonHtml } from "../scripts/pipeline/charts/comparison/body.mjs";
import { assertFixture as funnel, bodyMarkup as funnelHtml } from "../scripts/pipeline/charts/funnel/body.mjs";

const identity = { id: "sample", locale: "zh-CN", title: "业务快照" };

test("three supplied KPIs need no invented trend or detail panel", () => {
  const data = { ...identity, stats: ["用户", "请求", "错误"].map(label => ({ label, value: 0, icon: "chart", accent: 1 })) };
  dashboard(data);
  const html = dashboardHtml(data);
  assert.equal((html.match(/class="metric"/g) ?? []).length, 3);
  assert.ok(!html.includes("metric-trend"));
  assert.ok(!html.includes("dash-panels"));
  assert.ok(!html.includes("undefined"));
});

test("incomplete trends fail instead of becoming fabricated changes", () => {
  const data = { ...identity, stats: [{ label: "用户", value: "10", icon: "chart", accent: 1, trend: { direction: "up" } }] };
  assert.throws(() => dashboard(data), /trend/);
});

test("comparison can contain only options and supplied dimensions", () => {
  const data = { ...identity, criteria: ["部署"], columns: [
    { name: "A", tone: 1, icon: "code", values: ["本地"] },
    { name: "B", tone: 1, icon: "code", values: ["云端"] },
  ] };
  comparison(data);
  const html = comparisonHtml(data);
  assert.ok(!html.includes('class="metrics"'));
  assert.ok(!html.includes("undefined"));
  assert.ok(html.includes("本地") && html.includes("云端"));
  data.columns[0].values = null;
  assert.throws(() => comparison(data), /value count/);
});

const funnelData = (values, locale = "zh-CN") => ({
  ...identity, locale,
  stages: values.map((value, index) => ({ name: `Stage ${index + 1}`, value })),
});

test("funnel accepts actual narrow stages and derives both baseline and adjacent rates", () => {
  const data = funnelData([1000, 400, 100]);
  funnel(data);
  const html = funnelHtml(data);
  assert.deepEqual([...html.matchAll(/--bar-width: ([^%]+)%/g)].map((match) => Number(match[1])), [100, 40, 10]);
  assert.match(html, /转化 40% · 流失 60%/);
  assert.match(html, /转化 25% · 流失 75%/);
  assert.match(html, /class="funnel-stage-num">1,000</);
  assert.match(html, /class="funnel-pct">10%</);
});

test("funnel keeps tiny and zero values without minimum widths or undefined arithmetic", () => {
  const data = funnelData([1000, 0.001, 0, 0], "en-US");
  funnel(data);
  const html = funnelHtml(data);
  const widths = [...html.matchAll(/--bar-width: ([^%]+)%/g)].map((match) => Number(match[1]));
  assert.equal(widths[0], 100);
  assert.ok(Math.abs(widths[1] - 0.0001) < 1e-15);
  assert.deepEqual(widths.slice(2), [0, 0]);
  assert.match(html, /class="funnel-stage-num">0\.001</);
  assert.match(html, /class="funnel-pct">&lt;0\.01%</);
  assert.match(html, /Conversion 0% · Drop-off 100%/);
  assert.match(html, /Previous stage is 0; conversion and drop-off rates are undefined/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("all-zero funnel explicitly leaves rates undefined", () => {
  const data = funnelData([0, 0, 0]);
  funnel(data);
  const html = funnelHtml(data);
  assert.deepEqual([...html.matchAll(/--bar-width: ([^%]+)%/g)].map((match) => Number(match[1])), [0, 0, 0]);
  assert.equal((html.match(/class="funnel-pct">—</g) ?? []).length, 3);
  assert.match(html, /首阶段为 0/);
  assert.match(html, /转化率与流失率不可计算/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("funnel rejects invalid measurements and increasing stages instead of coercing or clipping", () => {
  for (const value of [-1, NaN, Infinity, -Infinity, "100", null, undefined]) {
    assert.throws(() => funnel(funnelData([1000, 400, value])), /finite non-negative/);
    assert.throws(() => funnel(funnelData([value, 0, 0])), /finite non-negative/);
  }
  for (const values of [[1000, 1001, 100], [1000, 0, 1], [0, 1, 0]]) {
    assert.throws(() => funnel(funnelData(values)), /non-increasing/);
  }
  const data = funnelData([1, 1, 1]);
  funnel(data);
  data.stages[1] = null;
  assert.throws(() => funnel(data), /non-empty name/);
});

test("funnel labels positive rates faithfully at the limits of numeric precision", () => {
  const data = funnelData([Number.MAX_VALUE, 1, Number.MIN_VALUE]);
  funnel(data);
  const html = funnelHtml(data);
  assert.equal((html.match(/class="funnel-pct">&lt;0\.01%</g) ?? []).length, 2);
  assert.doesNotMatch(html, /NaN|Infinity/);
  const nearTotal = funnelHtml(funnelData([1000, 999.999, 100]));
  assert.match(nearTotal, /class="funnel-pct">&gt;99\.99%</);
});

test("funnel validates optional reasons and accents and escapes stage copy", () => {
  const data = funnelData([1000, 400, 100]);
  data.stages[0].name = '<script>alert("x")</script>';
  data.dropReasons = ["", "No supplied cause"];
  funnel(data);
  assert.doesNotMatch(funnelHtml(data), /<script>/);
  data.dropReasons[0] = { unexpected: "object" };
  assert.throws(() => funnel(data), /dropReasons/);
  delete data.dropReasons;
  data.stages[0].accent = 99;
  assert.throws(() => funnel(data), /accent/);
});
