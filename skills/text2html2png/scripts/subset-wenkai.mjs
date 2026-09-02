#!/usr/bin/env node
// Dynamic LXGW WenKai (bold) subsetting.
//
// The `@fontsource/lxgw-wenkai` dependency ships the complete bold face as a
// single 7.5MB woff2. Given the user's actual copy we subset that source down
// to the exact codepoints used (harfbuzzjs via `subset-font`, pure JS/WASM —
// no native compilation) and emit one data-URI @font-face. A typical chart
// lands in the 3-15KB range instead of the 7.5MB source or the 19MB TTF.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import process from "node:process";
import subsetFont from "subset-font";

const require = createRequire(import.meta.url);
const fontDir = path.dirname(require.resolve("@fontsource/lxgw-wenkai"));
const BOLD_WOFF2_PATH = path.join(fontDir, "files", "lxgw-wenkai-latin-700-normal.woff2");

export const WENKAI_FAMILY = "LXGW WenKai";
export const WENKAI_WEIGHT = 700;

// Fallback stack preserved for offline/missing-font environments: the data-URI
// face above provides the glyphs; these names keep the kaiti look if the data
// URI is ever unavailable.
export const WENKAI_FALLBACK_STACK = '"LXGW WenKai", "Kaiti SC", STKaiti, cursive';

let boldSource = null;
async function loadBoldSource() {
  if (!boldSource) boldSource = await readFile(BOLD_WOFF2_PATH);
  return boldSource;
}

/**
 * Build a data-URI @font-face for the WenKai bold face covering exactly the
 * codepoints in `text` (whitespace excluded — fallback fonts handle spacing).
 *
 * @param {string} text user copy to cover
 * @param {{ family?: string, weight?: number|string }} [options]
 * @returns {Promise<{ css: string, faces: Array<{ file: string, glyphCount: number, bytes: number }>, totalBytes: number }>}
 */
export async function buildWenKaiFaces(text, options = {}) {
  const family = options.family ?? WENKAI_FAMILY;
  const weight = options.weight ?? WENKAI_WEIGHT;
  const wanted = new Set();
  for (const char of text) {
    if (/\s/u.test(char)) continue;
    wanted.add(char.codePointAt(0));
  }
  if (!wanted.size) return { css: "", faces: [], totalBytes: 0 };

  const chars = String.fromCodePoint(...wanted);
  const source = await loadBoldSource();
  const subset = await subsetFont(source, chars, { targetFormat: "woff2" });
  const css =
    "@font-face {\n" +
    `  font-family: ${JSON.stringify(family)};\n` +
    "  font-style: normal;\n" +
    `  font-weight: ${weight};\n` +
    "  font-display: block;\n" +
    `  src: url(data:font/woff2;base64,${subset.toString("base64")}) format("woff2");\n` +
    "}\n";
  return {
    css,
    faces: [{ file: path.basename(BOLD_WOFF2_PATH), glyphCount: wanted.size, bytes: subset.length }],
    totalBytes: subset.length,
  };
}

async function main(argv) {
  const args = argv.slice(2);
  const option = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return undefined;
    return args[index + 1];
  };
  const textArg = option("--text");
  const textFile = option("--text-file");
  const out = option("--out");
  const json = args.includes("--json");
  if (textArg === undefined && textFile === undefined) {
    console.error("usage: node scripts/subset-wenkai.mjs (--text <string> | --text-file <path>) [--out <css>] [--json]");
    process.exitCode = 2;
    return;
  }
  const text = textFile ? await readFile(textFile, "utf8") : textArg;
  const result = await buildWenKaiFaces(text);
  if (out) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(out, result.css);
  }
  if (json) {
    console.log(JSON.stringify({ faces: result.faces.length, totalBytes: result.totalBytes, out: out ?? null }, null, 2));
  } else {
    console.log(`faces: ${result.faces.length}, subset total: ${result.totalBytes} bytes, css: ${result.css.length} chars`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main(process.argv);
}
