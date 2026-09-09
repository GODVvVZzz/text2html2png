#!/usr/bin/env node
// A real first-install check in an isolated skill copy. No agent/model is run.
import { cp, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(tmpdir(), 'text2html2png-install-'));
const copy = path.join(temp, 'skill');
async function run(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: copy, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(Error(`Command failed (${code}): ${args[0]}`)));
  });
}
async function bytes(dir) {
  let size = 0;
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) size += await bytes(file);
    else if (item.isFile()) size += (await stat(file)).size;
  }
  return size;
}
try {
  await cp(path.join(repo, 'skills/text2html2png'), copy, { recursive: true,
    filter: file => !file.split(path.sep).some(p => ['node_modules', '.runtime-fonts', '.local', 'output'].includes(p)) });
  const started = performance.now();
  await run(['scripts/setup.mjs', '--theme', 'clean']);
  const cleanMs = Math.round(performance.now() - started);
  const cleanBytes = await bytes(path.join(copy, 'node_modules')) + await bytes(path.join(copy, '.runtime-fonts'));
  const cleanFonts = (await readdir(path.join(copy, '.runtime-fonts/node_modules/@fontsource'))).sort();
  assert.deepEqual(cleanFonts, ['ibm-plex-mono', 'ibm-plex-sans', 'noto-sans-sc']);
  const beforeLock = await readFile(path.join(copy, 'package-lock.json'), 'utf8');
  await run(['scripts/setup.mjs', '--theme', 'glass']);
  await run(['scripts/setup.mjs', '--theme', 'clean', '--check']);
  assert.equal(await readFile(path.join(copy, 'package-lock.json'), 'utf8'), beforeLock, 'theme setup must preserve the runtime lockfile');
  const data = JSON.parse(await readFile(path.join(copy, 'examples/service-architecture/zh.json'), 'utf8'));
  await writeFile(path.join(copy, 'smoke.diagram.json'), JSON.stringify({ schemaVersion: 1, chart: 'architecture', theme: 'clean', render: { width: 908 }, data }));
  await run(['scripts/render.mjs', '--input', 'smoke.diagram.json', '--html', 'smoke.html', '--png', 'smoke.png', '--audit']);
  assert.equal((await readFile(path.join(copy, 'smoke.png'))).subarray(1, 4).toString(), 'PNG');
  const report = { kind: 'isolated-install-smoke', measuredAt: new Date().toISOString(), node: process.versions.node,
    platform: process.platform, cleanInstallMs: cleanMs, cleanInstalledFileBytes: cleanBytes, cleanFonts,
    incrementalGlassSetup: 'passed', cleanHtmlAndPngAudit: 'passed',
    note: 'One automated local runtime check; not an end-to-end agent evaluation or user success-rate measurement. npm cache and network affect elapsed time.' };
  const outIndex = process.argv.indexOf('--out');
  if (outIndex !== -1) {
    const out = path.resolve(process.argv[outIndex + 1]);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
} finally { await rm(temp, { recursive: true, force: true }); }
