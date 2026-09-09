// Generalized build-time font embedding.
//
// Theme CSS font tokens name the families; FONT_LIBRARY maps each family to
// its @fontsource package. The fonts download once at `npm install` and are
// reused from node_modules forever after — rendering itself stays offline:
// every face is subset down to the codepoints the copy actually uses and
// embedded as a data-URI @font-face, so mainland/overseas/offline runs all
// produce byte-identical output. If a package is missing the family is
// skipped with a loud warning and the theme's system-font fallbacks take
// over — degradation is explicit, never silent.
//
// CJK packages ship Google Fonts' unicode-range slice tables under
// `<pkg>/<weight>.css`; we parse that table, keep only the slices the copy
// touches, and subset each slice to the intersection. Latin families subset
// from the single `<slug>-latin-<weight>-normal.woff2` file.

import { readFile } from "node:fs/promises";
import path from "node:path";
import subsetFont from "subset-font";

import { FONT_LIBRARY, themeFontFamilies, fontPackageDir } from "./font-library.mjs";
export { themeFontFamilies } from "./font-library.mjs";

function slug(family) {
  return family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// `U+1f1e9-1f1f5,U+1f21a,...` → [[start, end], ...]
function parseUnicodeRange(range) {
  const intervals = [];
  for (const part of range.split(",")) {
    const body = part.trim().replace(/^U\+/i, "");
    if (!body) continue;
    const [lo, hi] = body.split("-").map((v) => Number.parseInt(v, 16));
    intervals.push([lo, Number.isNaN(hi) ? lo : hi]);
  }
  return intervals;
}

function intervalsCover(intervals, cp) {
  for (const [lo, hi] of intervals) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

// Parse `<pkg>/<weight>.css` into an ordered slice table. The file is a flat
// sequence of @font-face blocks, each pairing one unicode-range with one
// numbered woff2 under files/.
async function cjkSliceTable(pkgDir, weight) {
  const css = await readFile(path.join(pkgDir, `${weight}.css`), "utf8");
  const slices = [];
  for (const face of css.matchAll(/@font-face\s*\{[^}]*\}/g)) {
    const range = face[0].match(/unicode-range:\s*([^;]+);/i)?.[1];
    const file = face[0].match(/url\(\.\/files\/([^)]+\.woff2)\)/i)?.[1];
    if (range && file) {
      slices.push({ range, file, intervals: parseUnicodeRange(range) });
    }
  }
  return slices;
}

const sliceTableCache = new Map();
function cachedSliceTable(pkgDir, weight) {
  const key = `${pkgDir}#${weight}`;
  if (!sliceTableCache.has(key)) sliceTableCache.set(key, cjkSliceTable(pkgDir, weight));
  return sliceTableCache.get(key);
}

const sourceCache = new Map();
function cachedSource(pkgDir, file) {
  const key = `${pkgDir}/${file}`;
  if (!sourceCache.has(key)) sourceCache.set(key, readFile(path.join(pkgDir, "files", file)));
  return sourceCache.get(key);
}

function faceCss(family, weight, subset, unicodeRange, style = "normal") {
  return (
    "@font-face {\n" +
    `  font-family: ${JSON.stringify(family)};\n` +
    `  font-style: ${style};\n` +
    `  font-weight: ${weight};\n` +
    "  font-display: block;\n" +
    (unicodeRange ? `  unicode-range: ${unicodeRange};\n` : "") +
    `  src: url(data:font/woff2;base64,${subset.toString("base64")}) format("woff2");\n` +
    "}\n"
  );
}

/**
 * Build data-URI @font-face CSS covering exactly the codepoints in `text`
 * for every family the theme tokens request from the library.
 *
 * @param {string} themeCss raw theme CSS (font tokens are read from it)
 * @param {string} text the chart's user copy
 * @returns {Promise<{css: string, families: string[], faces: number, totalBytes: number, warnings: string[]}>}
 */
export async function buildThemeFontFaces(themeCss, text) {
  const families = themeFontFamilies(themeCss);
  const warnings = [];
  const wantItalic = /--t-lede-style:\s*italic/.test(themeCss);
  const wanted = new Set();
  for (const char of text) {
    if (/\s/u.test(char)) continue;
    wanted.add(char.codePointAt(0));
  }
  if (!families.length || !wanted.size) {
    return { css: "", families, faces: 0, totalBytes: 0, warnings };
  }
  const chars = String.fromCodePoint(...wanted);
  const blocks = [];
  let totalBytes = 0;
  for (const family of families) {
    const entry = FONT_LIBRARY[family];
    let pkgDir;
    try {
      pkgDir = fontPackageDir(entry);
    } catch {
      warnings.push(`${family}: ${entry.pkg} is not installed; falling back to system fonts`);
      continue;
    }
    const faces = entry.weights.map((weight) => ({ weight, style: "normal" }));
    if (wantItalic && entry.italics) {
      faces.push(...entry.italics.map((weight) => ({ weight, style: "italic" })));
    }
    for (const { weight, style } of faces) {
      if (entry.cjk) {
        const table = await cachedSliceTable(pkgDir, weight);
        // Assign each wanted codepoint to every slice covering it; the
        // ranges are disjoint in practice but partial overlaps are harmless.
        const sliceChars = table.map(() => []);
        for (const cp of wanted) {
          for (let i = 0; i < table.length; i += 1) {
            if (intervalsCover(table[i].intervals, cp)) {
              sliceChars[i].push(cp);
              break;
            }
          }
        }
        for (let i = 0; i < table.length; i += 1) {
          if (!sliceChars[i].length) continue;
          const sliceText = String.fromCodePoint(...sliceChars[i]);
          const subset = await subsetFont(await cachedSource(pkgDir, table[i].file), sliceText, {
            targetFormat: "woff2",
          });
          blocks.push(faceCss(family, weight, subset, table[i].range, style));
          totalBytes += subset.length;
        }
      } else {
        const file = `${slug(family)}-latin-${weight}-${style}.woff2`;
        try {
          const subset = await subsetFont(await cachedSource(pkgDir, file), chars, {
            targetFormat: "woff2",
          });
          blocks.push(faceCss(family, weight, subset, null, style));
          totalBytes += subset.length;
        } catch {
          warnings.push(`${family}: ${entry.pkg} is missing ${file}; falling back for that face`);
        }
      }
    }
  }
  if (blocks.length) {
    // Deterministic order: same theme+text always yields the same CSS bytes.
    blocks.sort();
  }
  return { css: blocks.join(""), families, faces: blocks.length, totalBytes, warnings };
}
