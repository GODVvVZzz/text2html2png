#!/usr/bin/env node
// Package the declared skill files, excluding caches, tests, and local output.
import { cp, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(repo, 'skills/text2html2png');
const pkg = JSON.parse(await readFile(path.join(skill, 'package.json'), 'utf8'));
const plugin = JSON.parse(await readFile(path.join(repo, '.codex-plugin/plugin.json'), 'utf8'));
const expected = process.argv[2]?.replace(/^v/, '');
if (!expected || expected !== pkg.version || expected !== plugin.version) throw Error('Release tag, runtime, and plugin versions must match.');
const out = path.join(repo, 'dist/package/text2html2png');
await mkdir(path.dirname(out), { recursive: true });
await mkdir(out); // Refuse to mix a new release with a previous package.
for (const entry of new Set(['package.json', 'LICENSE', 'LICENSES/', ...pkg.files])) {
  if (path.isAbsolute(entry) || entry.split('/').includes('..')) throw Error('Invalid package entry: ' + entry);
  await cp(path.join(skill, entry), path.join(out, entry), { recursive: true,
    filter: file => !file.split(path.sep).some(part => ['node_modules', '.runtime-fonts', '.local', 'output', '.DS_Store'].includes(part)) });
}
console.log(`Packaged v${pkg.version}: ${out}`);
