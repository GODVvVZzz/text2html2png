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
async function run(args, { expectedStatus = 0, capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: copy, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    let stdout = '', stderr = '';
    if (capture) {
      child.stdout.on('data', data => { stdout += data; });
      child.stderr.on('data', data => { stderr += data; });
    }
    child.on('error', reject);
    child.on('exit', code => code === expectedStatus ? resolve(stdout) : reject(Error(`Command failed (${code}, expected ${expectedStatus}): ${args[0]}\n${stdout}${stderr}`)));
  });
}
async function mutateJson(relative, change) {
  const file = path.join(copy, relative);
  const value = JSON.parse(await readFile(file, 'utf8'));
  change(value);
  await writeFile(file, JSON.stringify(value, null, 2) + '\n');
}
async function diagnose(theme, expectedStatus) {
  return JSON.parse(await run(['scripts/setup.mjs', '--theme', theme, '--check', '--json'], { expectedStatus, capture: true }));
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

  // Reproduce the old presence-only check's failure with a controlled stale
  // installation, then exercise the real npm repair in this isolated copy.
  await mutateJson('node_modules/subset-font/package.json', value => { value.version = '0.0.0'; });
  await mutateJson('.runtime-fonts/node_modules/@fontsource/ibm-plex-sans/package.json', value => { value.version = '0.0.0'; });
  let diagnosis = await diagnose('clean', 1);
  assert.equal(diagnosis.ready, false);
  assert.ok(diagnosis.mismatchedRuntime.some(problem => problem.package === 'subset-font' && problem.reason === 'version'));
  assert.ok(diagnosis.mismatchedFonts.some(problem => problem.package === '@fontsource/ibm-plex-sans' && problem.reason === 'version'));
  await run(['scripts/setup.mjs', '--theme', 'clean']);
  assert.equal((await diagnose('clean', 0)).ready, true);
  assert.equal((await diagnose('glass', 0)).ready, true, 'runtime repair must preserve previously installed themes');

  // The current lock can differ from an earlier installation even if a
  // package's version did not change. Never report that stale record Ready.
  await mutateJson('node_modules/.package-lock.json', value => {
    value.packages['node_modules/subset-font'].integrity = 'sha512-stale-install-record';
  });
  diagnosis = await diagnose('clean', 1);
  assert.ok(diagnosis.mismatchedRuntime.some(problem => problem.package === 'subset-font' && problem.reason === 'lock'));
  await run(['scripts/setup.mjs', '--theme', 'clean']);
  assert.equal((await diagnose('glass', 0)).ready, true);
  assert.equal(await readFile(path.join(copy, 'package-lock.json'), 'utf8'), beforeLock, 'repair must not rewrite the canonical lockfile');
  const data = JSON.parse(await readFile(path.join(copy, 'examples/service-architecture/zh.json'), 'utf8'));
  await writeFile(path.join(copy, 'smoke.diagram.json'), JSON.stringify({ schemaVersion: 1, chart: 'architecture', theme: 'clean', render: { width: 908 }, data }));
  await run(['scripts/render.mjs', '--input', 'smoke.diagram.json', '--html', 'smoke.html', '--png', 'smoke.png', '--audit']);
  assert.equal((await readFile(path.join(copy, 'smoke.png'))).subarray(1, 4).toString(), 'PNG');
  const report = { kind: 'isolated-install-smoke', measuredAt: new Date().toISOString(), node: process.versions.node,
    platform: process.platform, cleanInstallMs: cleanMs, cleanInstalledFileBytes: cleanBytes, cleanFonts,
    incrementalGlassSetup: 'passed', runtimeVersionRepair: 'passed', fontVersionRepair: 'passed',
    lockfileDriftRepair: 'passed', installedThemesPreserved: 'passed', cleanHtmlAndPngAudit: 'passed',
    note: 'One automated local runtime check; not an end-to-end agent evaluation or user success-rate measurement. npm cache and network affect elapsed time.' };
  const outIndex = process.argv.indexOf('--out');
  if (outIndex !== -1) {
    const out = path.resolve(process.argv[outIndex + 1]);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
} finally { await rm(temp, { recursive: true, force: true }); }
