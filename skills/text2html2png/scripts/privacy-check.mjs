#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");

// Inside this repository the useful scan root is the repository itself, so that
// README, docs, and workflow files are covered. Once the skill is installed on
// its own there is no repository above it, and blindly walking up would scan
// unrelated directories belonging to the user. So only adopt an ancestor that
// actually contains this skill at the expected path.
export function defaultScanRoot() {
  let candidate = path.resolve(skillDir, "../..");
  for (let depth = 0; depth < 3; depth += 1) {
    if (existsSync(path.join(candidate, "skills", "text2html2png", "SKILL.md"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  return skillDir;
}

const defaultRoot = defaultScanRoot();
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const textExtensions = new Set([
  ".md", ".json", ".mjs", ".js", ".ts", ".css", ".html", ".yml", ".yaml",
  ".txt", ".svg", ".gitignore", ".gitattributes",
]);

const forbidden = [
  ["private host marker", /https?:\/\/[^\s/]*(?:internal|intranet|corp)\.[^\s/)"']+/i],
  ["private network address", /https?:\/\/(?:10\.|127\.0\.0\.1|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/],
  ["user home path", /(?:\/Users\/[A-Za-z0-9._-]+\/|\/home\/[A-Za-z0-9._-]+\/)/],
  ["secret assignment", /(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/i],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

function isTextPath(filePath) {
  const base = path.basename(filePath);
  return textExtensions.has(path.extname(filePath).toLowerCase()) || base.startsWith(".");
}

async function walk(target) {
  const info = await stat(target);
  if (info.isFile()) return [target];

  const paths = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(fullPath));
    else paths.push(fullPath);
  }
  return paths;
}

export function scanText(source) {
  return forbidden
    .filter(([, pattern]) => pattern.test(source))
    .map(([label]) => label);
}

export async function scanPath(targetPath = defaultRoot) {
  const root = path.resolve(targetPath);
  const failures = [];

  for (const filePath of await walk(root)) {
    if (!isTextPath(filePath)) continue;
    let source;
    try {
      source = await readFile(filePath, "utf8");
    } catch {
      continue;
    }
    for (const label of scanText(source)) {
      const displayPath = (await stat(root)).isFile() ? path.basename(filePath) : path.relative(root, filePath);
      failures.push(`${displayPath}: ${label}`);
    }
  }
  return failures;
}

function usage() {
  console.log(`Usage:
  node scripts/privacy-check.mjs [path]
  node scripts/privacy-check.mjs --path <file-or-directory>

Without a path, scans the repository containing this skill. Binary files and
the .git, node_modules, dist, and coverage directories are skipped.`);
}

function parseArgs(argv) {
  let target = null;
  let help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--path") target = argv[++i] ?? null;
    else if (arg === "-h" || arg === "--help") help = true;
    else if (!arg.startsWith("-") && !target) target = arg;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return { target: target ?? defaultRoot, help };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const failures = await scanPath(args.target);
  if (failures.length) {
    throw new Error(`Privacy check failed:\n- ${failures.join("\n- ")}`);
  }
  console.log(`Privacy check passed: ${path.resolve(args.target)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
