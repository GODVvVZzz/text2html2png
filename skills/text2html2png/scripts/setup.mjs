#!/usr/bin/env node
// Installs the locked runtime and only the selected theme's font packages.
import { readFile, access, mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FONT_LIBRARY, themeFontFamilies, fontPackageDir } from './pipeline/font-library.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const themes = ['clean', 'editorial', 'notebook', 'warm', 'glass'];
const runtime = ['puppeteer-core', 'subset-font'];
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
function installed(pkg) {
  try { require.resolve(pkg); return true; } catch { return false; }
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
  const missingRuntime = runtime.filter(pkg => !installed(pkg));
  const missingFonts = (await requiredFonts(options.theme)).filter(entry => {
    try { fontPackageDir(entry); return false; } catch { return true; }
  }).map(entry => entry.pkg);
  let chrome = null, browserError = null;
  if (!missingRuntime.includes('puppeteer-core')) {
    try { chrome = await (await import('./screenshot.mjs')).findChrome(options.chrome); }
    catch (error) { browserError = error.message; }
  } else browserError = 'Install the runtime first to check browser discovery.';
  return { node: process.versions.node, nodeSupported: supportedNode(process.versions.node),
    theme: options.theme, missingRuntime, missingFonts, chrome, browserError,
    ready: supportedNode(process.versions.node) && !missingRuntime.length && !missingFonts.length && !!chrome };
}
export async function setup(options) {
  if (!supportedNode(process.versions.node)) throw Error('Node.js 22.12+ is required.');
  if (runtime.some(pkg => !installed(pkg))) {
    console.log('Installing the locked runtime (fonts are selected separately)…');
    await runNpm(['ci', '--omit=optional', '--no-audit', '--no-fund']);
  }
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
  const entries = await requiredFonts(options.theme);
  const missing = entries.filter(entry => { try { fontPackageDir(entry); return false; } catch { return true; } });
  if (missing.length) {
    const cache = path.join(root, '.runtime-fonts');
    await mkdir(cache, { recursive: true });
    try { await access(path.join(cache, 'package.json')); }
    catch { await writeFile(path.join(cache, 'package.json'), JSON.stringify({ name: 'text2html2png-local-fonts', private: true }) + '\n'); }
    const packages = missing.map(({ pkg }) => {
      const version = lock.packages['node_modules/' + pkg]?.version;
      if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version ?? '')) throw Error('Missing pinned font version for ' + pkg);
      return pkg + '@' + version;
    });
    console.log(`Installing ${options.theme} fonts: ${packages.join(', ')}`);
    await runNpm(['install', '--prefix', cache, '--save-exact', '--no-audit', '--no-fund', ...packages]);
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
    console.log(`Runtime: ${report.missingRuntime.join(', ') || 'OK'}`);
    console.log(`Fonts (${report.theme}): ${report.missingFonts.join(', ') || 'OK'}`);
    console.log(`Chrome: ${report.chrome || report.browserError}`);
    console.log(report.ready ? 'Ready. Browser launch and layout are checked when you render with --audit.' : 'Run setup for missing packages. For a missing browser, install Chrome/Chromium or pass --chrome.');
  }
  if (!report.ready) process.exitCode = 1;
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
