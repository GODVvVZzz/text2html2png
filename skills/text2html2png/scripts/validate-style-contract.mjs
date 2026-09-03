#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const stylesDir = path.join(skillDir, "references", "styles");
const themes = JSON.parse(
  await readFile(path.join(scriptDir, "pipeline", "themes", "themes.json"), "utf8"),
);
const required = [
  "--bg",
  "--card-bg",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--border-base",
  "--accent",
  "--accent-blue",
  "--arrow-color",
  "--success",
  "--minor",
  "--critical",
  "--s1",
  "--s2",
  "--s3",
  "--s4",
  "--s5",
  "--s6",
  "--s7",
];

const files = (await readdir(stylesDir)).filter((name) => name.endsWith(".md")).sort();
const failures = [];

for (const file of files) {
  const source = await readFile(path.join(stylesDir, file), "utf8");
  const defined = new Set([...source.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map((match) => match[1]));
  const missing = required.filter((token) => !defined.has(token));
  if (missing.length) failures.push(`${file}: missing ${missing.join(", ")}`);
}

if (files.length !== themes.length) {
  failures.push(`Expected a style guide per theme (${themes.length} in themes.json), found ${files.length}.`);
}

if (failures.length) {
  console.error(`Style contract failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Style contract passed for ${files.length} styles and ${required.length} required tokens.`);
}
