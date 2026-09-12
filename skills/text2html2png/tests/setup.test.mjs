import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseSetupArgs, supportedNode, requiredFonts } from '../scripts/setup.mjs';
import { loadDependencyLock, inspectDependencies, existingFontPackages, fontInstallFiles } from '../scripts/setup-dependencies.mjs';

test('setup validates theme arguments before invoking npm', () => {
  assert.equal(parseSetupArgs([]).theme, 'clean');
  assert.equal(parseSetupArgs(['--theme', 'glass', '--check']).check, true);
  assert.throws(() => parseSetupArgs(['--theme']), /--theme/);
  assert.throws(() => parseSetupArgs(['--theme', 'clean;echo unsafe']), /--theme/);
  assert.throws(() => parseSetupArgs(['--chrome']), /--chrome/);
});
test('setup honors the Node minimum and derives font packages from the theme', async () => {
  assert.equal(supportedNode('22.11.0'), false);
  assert.equal(supportedNode('22.12.0'), true);
  assert.equal(supportedNode('24.1.0'), true);
  const clean = (await requiredFonts('clean')).map(entry => entry.pkg).sort();
  assert.deepEqual(clean, ['@fontsource/ibm-plex-mono', '@fontsource/ibm-plex-sans', '@fontsource/noto-sans-sc']);
  assert.ok((await requiredFonts('all')).length > clean.length);
});

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'text2html2png-setup-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = { dependencies: { renderer: '^2.0.0', 'new-parser': '1.0.0' }, optionalDependencies: { '@fontsource/test': '5.3.0' } };
  const lock = { lockfileVersion: 3, packages: {
    '': manifest,
    'node_modules/renderer': { version: '2.1.0', integrity: 'sha512-renderer', dependencies: { helper: '^1.0.0' } },
    'node_modules/new-parser': { version: '1.0.0', integrity: 'sha512-parser' },
    'node_modules/renderer/node_modules/helper': { version: '1.1.0', integrity: 'sha512-helper' },
    'node_modules/@fontsource/test': { version: '5.3.0', integrity: 'sha512-font', optional: true },
  } };
  async function json(relative, value) {
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await writeFile(path.join(root, relative), JSON.stringify(value));
  }
  await json('package.json', manifest);
  await json('package-lock.json', lock);
  await json('node_modules/.package-lock.json', lock);
  for (const [relative, entry] of Object.entries(lock.packages)) {
    if (relative) await json(relative + '/package.json', { version: entry.version });
  }
  return { root, manifest, lock, json };
}

test('dependency diagnostics accept the locked installation without writing files', async t => {
  const { root } = await fixture(t);
  const before = await readFile(path.join(root, 'node_modules/.package-lock.json'), 'utf8');
  const state = await inspectDependencies(root, ['@fontsource/test']);
  assert.deepEqual(state.runtime, ['renderer', 'new-parser']);
  assert.deepEqual(state.runtimeProblems, []);
  assert.deepEqual(state.fontProblems, []);
  assert.equal(await readFile(path.join(root, 'node_modules/.package-lock.json'), 'utf8'), before);
});

test('an old runtime, stale transitive dependency, and newly added missing dependency cannot pass setup diagnostics', async t => {
  const { root, json } = await fixture(t);
  await json('node_modules/renderer/package.json', { version: '2.0.0' });
  await json('node_modules/renderer/node_modules/helper/package.json', { version: '1.0.0' });
  await rm(path.join(root, 'node_modules/new-parser'), { recursive: true });
  const state = await inspectDependencies(root, []);
  assert.deepEqual(state.runtimeProblems.map(({ package: pkg, reason }) => [pkg, reason]), [
    ['renderer', 'version'], ['new-parser', 'missing'], ['renderer/node_modules/helper', 'version'],
  ]);
});

test('changing the canonical lock detects a stale install even when package versions are unchanged', async t => {
  const { root, lock, json } = await fixture(t);
  lock.packages['node_modules/renderer'].integrity = 'sha512-new-artifact';
  await json('package-lock.json', lock);
  const state = await inspectDependencies(root, []);
  assert.deepEqual(state.runtimeProblems, [{ package: 'renderer', reason: 'lock', expected: '2.1.0', installed: '2.1.0' }]);
});

test('a missing npm install record requires a locked reinstall', async t => {
  const { root } = await fixture(t);
  await rm(path.join(root, 'node_modules/.package-lock.json'));
  const state = await inspectDependencies(root, []);
  assert.equal(state.runtimeProblems.length, 3);
  assert.ok(state.runtimeProblems.every(problem => problem.reason === 'lock'));
});

test('font diagnostics honor runtime precedence and reject stale cached fonts', async t => {
  const { root, lock, json } = await fixture(t);
  await json('.runtime-fonts/node_modules/@fontsource/test/package.json', { version: '5.3.0' });
  await json('.runtime-fonts/node_modules/.package-lock.json', lock);
  await json('node_modules/@fontsource/test/package.json', { version: '5.2.0' });
  let state = await inspectDependencies(root, ['@fontsource/test']);
  assert.equal(state.fontProblems[0].location, 'runtime');
  assert.equal(state.fontProblems[0].reason, 'version');
  await rm(path.join(root, 'node_modules/@fontsource/test'), { recursive: true });
  state = await inspectDependencies(root, ['@fontsource/test']);
  assert.deepEqual(state.fontProblems, []);
  await json('.runtime-fonts/node_modules/@fontsource/test/package.json', { version: '5.2.0' });
  state = await inspectDependencies(root, ['@fontsource/test']);
  assert.equal(state.fontProblems[0].location, 'font-cache');
  assert.equal(state.fontProblems[0].reason, 'version');
  assert.deepEqual(await existingFontPackages(root, ['@fontsource/test', '@fontsource/uninstalled']), ['@fontsource/test']);
});

test('font repair locks retained and newly selected fonts without optional omission or version ranges', async t => {
  const { lock } = await fixture(t);
  lock.packages['node_modules/@fontsource/next-theme'] = { version: '5.4.0', integrity: 'sha512-next', optional: true };
  const files = fontInstallFiles(lock, ['@fontsource/test', '@fontsource/next-theme', '@fontsource/test']);
  assert.deepEqual(files.manifest.dependencies, { '@fontsource/next-theme': '5.4.0', '@fontsource/test': '5.3.0' });
  for (const entry of Object.values(files.lock.packages).slice(1)) {
    assert.equal(entry.optional, undefined);
    assert.ok(entry.integrity);
  }
});

test('setup rejects an inconsistent dependency manifest before trying npm', async t => {
  const { root, manifest, json } = await fixture(t);
  manifest.dependencies['another-parser'] = '1.0.0';
  await json('package.json', manifest);
  await assert.rejects(loadDependencyLock(root), /does not match package-lock/);
});
