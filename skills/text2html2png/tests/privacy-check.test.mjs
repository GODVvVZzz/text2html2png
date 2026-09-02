import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { defaultScanRoot, scanText } from "../scripts/privacy-check.mjs";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

test("never scans above the project that contains this skill", () => {
  // Installed on its own, the skill has no repository above it. Walking up
  // regardless would scan unrelated user directories, so the root must either be
  // a directory that really contains this skill or the skill directory itself.
  const root = defaultScanRoot();
  const containsThisSkill = path.resolve(root, "skills", "text2html2png") === skillDir;
  assert.ok(
    containsThisSkill || root === skillDir,
    `scan root ${root} is neither the skill directory nor a project containing it`
  );
});
