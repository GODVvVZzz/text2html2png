import assert from "node:assert/strict";
import test from "node:test";
import { assertFixture as dashboard, bodyMarkup as dashboardHtml } from "../scripts/pipeline/charts/dashboard/body.mjs";
import { assertFixture as comparison, bodyMarkup as comparisonHtml } from "../scripts/pipeline/charts/comparison/body.mjs";

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
