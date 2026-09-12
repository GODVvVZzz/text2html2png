#!/usr/bin/env node
// Installs the locked runtime and only the selected theme's font packages.
import { readFile, access, mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FONT_LIBRARY, themeFontFamilies } from './pipeline/font-library.mjs';
import { loadDependencyLock, inspectDependencies, existingFontPackages, fontInstallFiles } from './setup-dependencies.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const themes = ['clean', 'editorial', 'notebook', 'warm', 'glass'];
export function parseSetupArgs(argv) {
  const args = { theme: 'clean', check: false, json: false, chrome: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--theme') args.theme = argv[++i];
    else if (arg === '--chrome') {
      args.chrome = argv[++i];
      if (!args.chrome || args.chrome.startsWith('--')) throw Error('--chrome requires a path.');
    } else if (arg === '--check') args.check = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw Error('Unknown option: ' + arg);
  }
  if (![...themes, 'all'].includes(args.theme)) throw Error('--theme must be clean, editorial, notebook, warm, glass, or all.');
  return args;
}
export function supportedNode(version) {
  const [major, minor] = version.split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 12);
}
export async function requiredFonts(theme) {
  const families = new Set();
  for (const id of theme === 'all' ? themes : [theme]) {
    const css = await readFile(path.join(root, 'scripts/pipeline/themes', id + '.css'), 'utf8');
    themeFontFamilies(css).forEach(family => families.add(family));
  }
  return [...families].map(family => FONT_LIBRARY[family]);
}
async function npmCli() {
  const candidates = [process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
    path.resolve(path.dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].filter(Boolean);
  const resolved = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['npm'], { encoding: 'utf8', windowsHide: true });
  if (resolved.status === 0) {
    for (const command of resolved.stdout.trim().split(/\r?\n/)) {
      try { candidates.push(await realpath(command)); } catch {}
    }
  }
  for (const candidate of candidates) {
    if (!/\.(?:c?js|mjs)$/.test(candidate)) continue;
    try { await access(candidate); return candidate; } catch {}
  }
  throw Error('Cannot locate npm-cli.js. Run npm run setup -- --theme clean, or reinstall Node.js with npm.');
}
async function runNpm(args) {
  const result = spawnSync(process.execPath, [await npmCli(), ...args], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('npm failed. Check the output above, then rerun setup.');
}
export async function inspectSetup(options) {
  const fonts = (await requiredFonts(options.theme)).map(entry => entry.pkg);
  const { runtimeProblems, fontProblems } = await inspectDependencies(root, fonts);
  const missingRuntime = runtimeProblems.filter(problem => problem.reason === 'missing').map(problem => problem.package);
  const missingFonts = fontProblems.filter(problem => problem.reason === 'missing').map(problem => problem.package);
  const mismatchedRuntime = runtimeProblems.filter(problem => problem.reason !== 'missing');
  const mismatchedFonts = fontProblems.filter(problem => problem.reason !== 'missing');
  let chrome = null, browserError = null;
  if (!runtimeProblems.length) {
    try { chrome = await (await import('./screenshot.mjs')).findChrome(options.chrome); }
    catch (error) { browserError = error.message; }
  } else browserError = 'Run setup to repair runtime dependencies before checking browser discovery.';
  return { node: process.versions.node, nodeSupported: supportedNode(process.versions.node),
    theme: options.theme, missingRuntime, mismatchedRuntime, missingFonts, mismatchedFonts, chrome, browserError,
    ready: supportedNode(process.versions.node) && !runtimeProblems.length && !fontProblems.length && !!chrome };
}
export async function setup(options) {
  if (!supportedNode(process.versions.node)) throw Error('Node.js 22.12+ is required.');
  const dependencyLock = await loadDependencyLock(root);
  const selected = (await requiredFonts(options.theme)).map(entry => entry.pkg);
  // npm ci removes node_modules. Preserve every previously installed theme's
  // fonts when repairing a runtime or a font that shadows the separate cache.
  const previous = await existingFontPackages(root, Object.values(FONT_LIBRARY).map(entry => entry.pkg));
  const fonts = [...new Set([...previous, ...selected])];
  let state = await inspectDependencies(root, fonts, dependencyLock);
  if (state.runtimeProblems.length || state.fontProblems.some(problem => problem.location === 'runtime')) {
    console.log('Installing the locked runtime (missing or outdated dependencies)…');
    await runNpm(['ci', '--omit=optional', '--no-audit', '--no-fund']);
    state = await inspectDependencies(root, fonts, dependencyLock);
  }
  if (state.fontProblems.length) {
    const cache = path.join(root, '.runtime-fonts');
    await mkdir(cache, { recursive: true });
    const files = fontInstallFiles(dependencyLock.lock, fonts);
    await writeFile(path.join(cache, 'package.json'), JSON.stringify(files.manifest, null, 2) + '\n');
    await writeFile(path.join(cache, 'package-lock.json'), JSON.stringify(files.lock, null, 2) + '\n');
    console.log(`Installing locked fonts for ${options.theme} and previously installed themes: ${fonts.join(', ')}`);
    await runNpm(['ci', '--prefix', cache, '--no-audit', '--no-fund']);
  }
  return inspectSetup(options);
}
async function main() {
  const options = parseSetupArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node scripts/setup.mjs [--theme clean|editorial|notebook|warm|glass|all] [--check] [--json] [--chrome path]\n--check is read-only. Setup installs locally; it never downloads a browser.');
    return;
  }
  const report = options.check ? await inspectSetup(options) : await setup(options);
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Node ${report.node}: ${report.nodeSupported ? 'OK' : 'requires 22.12+'}`);
    const mismatch = problem => `${problem.package} (expected ${problem.expected}, installed ${problem.installed}; ${problem.reason} mismatch)`;
    console.log(`Runtime: ${[...report.missingRuntime, ...report.mismatchedRuntime.map(mismatch)].join(', ') || 'OK'}`);
    console.log(`Fonts (${report.theme}): ${[...report.missingFonts, ...report.mismatchedFonts.map(mismatch)].join(', ') || 'OK'}`);
    console.log(`Chrome: ${report.chrome || report.browserError}`);
    console.log(report.ready ? 'Ready. Browser launch and layout are checked when you render with --audit.' : 'Run setup for missing packages. For a missing browser, install Chrome/Chromium or pass --chrome.');
  }
  if (!report.ready) process.exitCode = 1;
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
