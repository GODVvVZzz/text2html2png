#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const ignored = new Set([".git", "node_modules", "dist"]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files;
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

const failures = [];
for (const markdownPath of await walk(repoRoot)) {
  const source = await readFile(markdownPath, "utf8");
  const targets = [
    ...[...source.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].map((match) => match[1]),
    ...[...source.matchAll(/<(?:a|img)\b[^>]*(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]),
  ];

  for (const rawTarget of targets) {
    if (/^(?:https?:|mailto:|data:|codex:|#)/i.test(rawTarget)) continue;
    const targetWithoutAnchor = rawTarget.split("#", 1)[0].split("?", 1)[0];
    if (!targetWithoutAnchor) continue;
    const decoded = decodeURIComponent(targetWithoutAnchor.replace(/^<|>$/g, ""));
    const absoluteTarget = path.resolve(path.dirname(markdownPath), decoded);
    if (!await exists(absoluteTarget)) {
      failures.push(`${path.relative(repoRoot, markdownPath)} -> ${rawTarget}`);
    }
  }
}

// The Codex plugin manifest points at brand assets and documents that live
// outside Markdown, so validate those paths with the same strictness.
const manifestPath = path.join(repoRoot, ".codex-plugin", "plugin.json");
if (await exists(manifestPath)) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const interfaceBlock = manifest.interface ?? {};
  const manifestTargets = [
    manifest.skills,
    interfaceBlock.composerIcon,
    interfaceBlock.logo,
    interfaceBlock.logoDark,
    ...(interfaceBlock.screenshots ?? []),
  ].filter((value) => typeof value === "string" && value.length > 0);

  for (const rawTarget of manifestTargets) {
    if (/^https?:/i.test(rawTarget)) continue;
    // Manifest paths are relative to the plugin root, which is the repository root.
    if (!await exists(path.resolve(repoRoot, rawTarget))) {
      failures.push(`.codex-plugin/plugin.json -> ${rawTarget}`);
    }
  }

  // A privacy policy URL that 404s is worse than none at all, so require the
  // in-repository file whenever the manifest advertises one on this repository.
  const privacyUrl = interfaceBlock.privacyPolicyURL;
  if (typeof privacyUrl === "string" && privacyUrl.includes("/blob/")) {
    const repoRelativePath = privacyUrl.split("/blob/").at(-1)?.split("/").slice(1).join("/");
    if (repoRelativePath && !await exists(path.resolve(repoRoot, repoRelativePath))) {
      failures.push(`.codex-plugin/plugin.json -> privacyPolicyURL ${repoRelativePath}`);
    }
  }
}

if (failures.length) {
  console.error(`Broken local links:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("All local Markdown links and manifest asset paths resolve.");
}
