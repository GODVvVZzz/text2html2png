import assert from "node:assert/strict";
import test from "node:test";
import { scanText } from "../scripts/privacy-check.mjs";

test("accepts ordinary public text", () => {
  assert.deepEqual(scanText("A synthetic release flow with public example data."), []);
});

test("detects likely secret assignments", () => {
  const keyName = ["api", "key"].join("_");
  assert.ok(scanText(`${keyName} = "example-secret-value"`).includes("secret assignment"));
});

test("detects absolute user home paths", () => {
  const homePath = ["", "Users", "example", "private", "file.txt"].join("/");
  assert.ok(scanText(homePath).includes("user home path"));
});
