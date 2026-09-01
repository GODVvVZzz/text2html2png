#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillPath = path.resolve(scriptDir, "..", "SKILL.md");
const source = await readFile(skillPath, "utf8");
const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/);
const failures = [];

if (!frontmatter) {
  failures.push("SKILL.md has no YAML frontmatter.");
} else {
  if (!/^name:\s*text2html2png\s*$/m.test(frontmatter[1])) {
    failures.push("Frontmatter name must be text2html2png.");
  }
  const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
  if (!description) failures.push("Frontmatter description is missing.");
  if (description.length > 700) failures.push("Frontmatter description is too long.");
}

for (const placeholder of ["[TODO", "TBD", "CHANGEME"]) {
  if (source.includes(placeholder)) failures.push(`Unfinished placeholder: ${placeholder}`);
}

if (failures.length) {
  console.error(`Skill validation failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("Skill validation passed.");
}
