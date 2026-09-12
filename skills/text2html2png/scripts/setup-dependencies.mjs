// Dependency diagnostics must work before any npm package can be imported.
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

async function readJson(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

export async function loadDependencyLock(root) {
  const manifest = await readJson(path.join(root, 'package.json'));
  const lock = await readJson(path.join(root, 'package-lock.json'));
  if (!manifest || !lock?.packages?.['']) throw Error('A valid package.json and package-lock.json are required. Reinstall the skill.');
  for (const field of ['dependencies', 'optionalDependencies']) {
    if (!isDeepStrictEqual(manifest[field] ?? {}, lock.packages[''][field] ?? {})) {
      throw Error(`package.json ${field} does not match package-lock.json. Reinstall the skill or update its lockfile before setup.`);
    }
  }
  for (const [relative, entry] of Object.entries(lock.packages)) {
    if (!relative) continue;
    if (!relative.startsWith('node_modules/') || relative.split('/').includes('..') || relative.includes('\\') || !entry.version) {
      throw Error('Invalid locked dependency path or version: ' + relative);
    }
  }
  for (const pkg of Object.keys(manifest.dependencies ?? {})) {
    if (!lock.packages['node_modules/' + pkg]) throw Error('Missing locked runtime dependency: ' + pkg);
  }
  return { manifest, lock };
}

async function inspectPackage(root, relative, expected, installedLock) {
  const actual = await readJson(path.join(root, relative, 'package.json'));
  const pkg = relative.replace(/^node_modules\//, '');
  if (!actual) return { package: pkg, reason: 'missing', expected: expected.version, installed: null };
  if (actual.version !== expected.version) {
    return { package: pkg, reason: 'version', expected: expected.version, installed: actual.version ?? null };
  }
  // npm's install record also detects a changed lockfile with an unchanged
  // version. This checks installation provenance, not arbitrary file tampering.
  const recorded = installedLock?.packages?.[relative];
  if (!recorded || recorded.version !== expected.version || recorded.integrity !== expected.integrity) {
    return { package: pkg, reason: 'lock', expected: expected.version, installed: actual.version };
  }
  return null;
}

export async function existingFontPackages(root, packages) {
  const installed = [];
  for (const pkg of packages) {
    for (const base of [root, path.join(root, '.runtime-fonts')]) {
      try { await access(path.join(base, 'node_modules', pkg)); installed.push(pkg); break; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  return installed;
}

export async function inspectDependencies(root, fonts, dependencyLock = null) {
  const { manifest, lock } = dependencyLock ?? await loadDependencyLock(root);
  const installedLock = await readJson(path.join(root, 'node_modules/.package-lock.json'));
  const cachedRoot = path.join(root, '.runtime-fonts');
  const cachedLock = await readJson(path.join(cachedRoot, 'node_modules/.package-lock.json'));
  const runtimeProblems = [];
  const fontProblems = [];
  for (const [relative, expected] of Object.entries(lock.packages)) {
    if (!relative || expected.dev || expected.optional) continue;
    const problem = await inspectPackage(root, relative, expected, installedLock);
    if (problem) runtimeProblems.push(problem);
  }
  for (const pkg of fonts) {
    const relative = 'node_modules/' + pkg;
    const expected = lock.packages[relative];
    if (!expected) throw Error('Missing locked font version for ' + pkg);
    let base = root;
    try { await access(path.join(root, relative, 'package.json')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; base = cachedRoot; }
    const problem = await inspectPackage(base, relative, expected, base === root ? installedLock : cachedLock);
    if (problem) fontProblems.push({ ...problem, location: base === root ? 'runtime' : 'font-cache' });
  }
  return { runtime: Object.keys(manifest.dependencies ?? {}), runtimeProblems, fontProblems };
}

export function fontInstallFiles(lock, packages) {
  const name = 'text2html2png-local-fonts';
  const dependencies = {};
  const entries = {};
  for (const pkg of [...new Set(packages)].sort()) {
    const entry = lock.packages['node_modules/' + pkg];
    if (!entry?.version || !entry.integrity) throw Error('Missing pinned font version or integrity for ' + pkg);
    // Fontsource packages are leaf assets. Fail closed if their packaging ever
    // changes instead of resolving new dependencies outside the runtime lock.
    if (Object.keys(entry.dependencies ?? {}).length || Object.keys(entry.optionalDependencies ?? {}).length) {
      throw Error('Font dependencies must be included in the font lock before setup: ' + pkg);
    }
    dependencies[pkg] = entry.version;
    const { optional, dev, devOptional, ...requiredEntry } = entry;
    entries['node_modules/' + pkg] = requiredEntry;
  }
  return {
    manifest: { name, private: true, dependencies },
    lock: { name, lockfileVersion: 3, requires: true, packages: { '': { name, dependencies }, ...entries } },
  };
}
