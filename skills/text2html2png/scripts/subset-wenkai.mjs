#!/usr/bin/env node
// Dynamic LXGW WenKai (bold) subsetting.
//
// The `lxgw-wenkai-webfont` dependency ships the bold face as ~97 woff2
// chunks, each annotated with a `unicode-range` in `lxgwwenkai-bold.css`.
// Given the user's actual copy we pick only the chunks whose ranges intersect
// the text, re-subset each chunk down to the exact codepoints used (harfbuzzjs
// via `subset-font`, pure JS/WASM — no native compilation), and emit one
// data-URI @font-face per retained chunk. A typical chart lands in the 3-10KB
// range instead of the 19MB full font.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import process from "node:process";
import subsetFont from "subset-font";

const require = createRequire(import.meta.url);
const webfontDir = path.dirname(require.resolve("lxgw-wenkai-webfont"));
const BOLD_CSS_PATH = path.join(webfontDir, "lxgwwenkai-bold.css");
const FILES_DIR = path.join(webfontDir, "files");

export const WENKAI_FAMILY = "LXGW WenKai";
export const WENKAI_WEIGHT = 700;

// Fallback stack preserved for offline/missing-font environments: the data-URI
// faces above provide the glyphs; these names keep the kaiti look if a data
// URI is ever unavailable.
export const WENKAI_FALLBACK_STACK = '"LXGW WenKai", "Kaiti SC", STKaiti, cursive';

export function parseUnicodeRangeValue(value) {
  const intervals = [];
  for (const token of value.split(",")) {
    const part = token.trim().toLowerCase();
    if (!part) continue;
    if (!part.startsWith("u+")) throw new Error(`unsupported unicode-range token: ${token}`);
    if (part.includes("-")) {
      const [lo, hi] = part.slice(2).split("-");
      if (!/^[0-9a-f]+$/.test(lo) || !/^[0-9a-f]+$/.test(hi)) {
        throw new Error(`unsupported unicode-range token: ${token}`);
      }
      intervals.push([Number.parseInt(lo, 16), Number.parseInt(hi, 16)]);
    } else if (part.includes("?")) {
      // U+4e?? wildcard: hex digits, so "?" expands to the 0..f digit range.
      const digits = part.slice(2);
      if (/[^0-9a-f?]/.test(digits)) throw new Error(`unsupported unicode-range token: ${token}`);
      const fixed = digits.replace(/\?+$/, "");
      const wilds = digits.length - fixed.length;
      const base = Number.parseInt(fixed || "0", 16);
      intervals.push([base * 16 ** wilds, (base + 1) * 16 ** wilds - 1]);
    } else {
      if (!/^[0-9a-f]+$/.test(part.slice(2))) throw new Error(`unsupported unicode-range token: ${token}`);
      const cp = Number.parseInt(part.slice(2), 16);
      intervals.push([cp, cp]);
    }
  }
  return intervals;
}

function codepointInIntervals(cp, intervals) {
  for (const [lo, hi] of intervals) {
    if (cp >= lo && cp <= hi) return true;
    if (cp < lo) return false; // intervals are emitted in ascending order
  }
  return false;
}

// Merge ascending codepoints into compact "U+4e00-4e02, U+4e10" style ranges.
export function formatUnicodeRange(sortedCodepoints) {
  const parts = [];
  let start = null;
  let prev = null;
  const flush = () => {
    if (start === null) return;
    parts.push(start === prev ? `U+${start.toString(16)}` : `U+${start.toString(16)}-${prev.toString(16)}`);
    start = null;
    prev = null;
  };
  for (const cp of sortedCodepoints) {
    if (start === null) {
      start = cp;
    } else if (cp !== prev + 1) {
      flush();
      start = cp;
    }
    prev = cp;
  }
  flush();
  return parts.join(", ");
}

const FACE_PATTERN = /@font-face\s*\{[^}]*\}/g;
const SRC_PATTERN = /src\s*:\s*url\(['"]?([^'")]+)['"]?\)/i;
const RANGE_PATTERN = /unicode-range\s*:\s*([^;}]+)/i;

async function parseBoldFaces() {
  const css = await readFile(BOLD_CSS_PATH, "utf8");
  const faces = [];
  for (const match of css.matchAll(FACE_PATTERN)) {
    const block = match[0];
    const src = block.match(SRC_PATTERN)?.[1];
    const range = block.match(RANGE_PATTERN)?.[1];
    if (!src || !range) continue;
    faces.push({
      file: path.basename(src),
      intervals: parseUnicodeRangeValue(range),
    });
  }
  if (!faces.length) throw new Error(`no @font-face chunks parsed from ${BOLD_CSS_PATH}`);
  return faces;
}

/**
 * Build data-URI @font-face CSS for the WenKai bold face covering exactly the
 * codepoints in `text` (whitespace excluded — fallback fonts handle spacing).
 *
 * @param {string} text user copy to cover
 * @param {{ family?: string, weight?: number|string }} [options]
 * @returns {Promise<{ css: string, faces: Array<{ file: string, codepoints: number[], bytes: number }>, totalBytes: number }>}
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

  const faces = await parseBoldFaces();
  const selected = [];
  for (const face of faces) {
    const codepoints = [...wanted].filter((cp) => codepointInIntervals(cp, face.intervals)).sort((a, b) => a - b);
    if (codepoints.length) selected.push({ face, codepoints });
  }
  if (!selected.length) return { css: "", faces: [], totalBytes: 0 };

  let css = "";
  const reports = [];
  let totalBytes = 0;
  for (const { face, codepoints } of selected) {
    const source = await readFile(path.join(FILES_DIR, face.file));
    const chars = String.fromCodePoint(...codepoints);
    const subset = await subsetFont(source, chars, { targetFormat: "woff2" });
    const cssText =
      "@font-face {\n" +
      `  font-family: ${JSON.stringify(family)};\n` +
      "  font-style: normal;\n" +
      `  font-weight: ${weight};\n` +
      "  font-display: block;\n" +
      `  src: url(data:font/woff2;base64,${subset.toString("base64")}) format("woff2");\n` +
      `  unicode-range: ${formatUnicodeRange(codepoints)};\n` +
      "}\n";
    css += cssText;
    totalBytes += subset.length;
    reports.push({ file: face.file, codepoints, bytes: subset.length });
  }
  return { css, faces: reports, totalBytes };
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
    console.log(`chunks: ${result.faces.length}, subset total: ${result.totalBytes} bytes, css: ${result.css.length} chars`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main(process.argv);
}
