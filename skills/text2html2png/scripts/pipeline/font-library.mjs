// Pure font metadata and resolution; safe to load before npm dependencies exist.
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const localRequire = createRequire(import.meta.url);
const cachedRequire = createRequire(path.join(skillDir, ".runtime-fonts", "package.json"));

export const FONT_LIBRARY = {
  "Playfair Display": { pkg: "@fontsource/playfair-display", weights: [700, 900] },
  "Noto Serif SC": { pkg: "@fontsource/noto-serif-sc", weights: [500, 700], cjk: true },
  "Noto Sans SC": { pkg: "@fontsource/noto-sans-sc", weights: [400, 500, 700], cjk: true },
  "IBM Plex Sans": { pkg: "@fontsource/ibm-plex-sans", weights: [400, 500, 700] },
  "IBM Plex Mono": { pkg: "@fontsource/ibm-plex-mono", weights: [500, 600] },
  "Cormorant Garamond": { pkg: "@fontsource/cormorant-garamond", weights: [600, 700] },
  "Lora": { pkg: "@fontsource/lora", weights: [400, 500, 600], italics: [500] },
  "Libre Franklin": { pkg: "@fontsource/libre-franklin", weights: [400, 500, 600] },
  "Caveat": { pkg: "@fontsource/caveat", weights: [400, 700] },
  "Nunito": { pkg: "@fontsource/nunito", weights: [400, 500, 600, 700] },
  "Outfit": { pkg: "@fontsource/outfit", weights: [400, 500, 700, 800] },
  "LXGW WenKai": { pkg: "@fontsource/lxgw-wenkai", weights: [700] },
};

// Families a theme wants, i.e. the quoted names in its font tokens that the
// library can supply. Unknown names fall through to the system-font stack.
export function themeFontFamilies(themeCss) {
  const names = new Set();
  for (const token of themeCss.matchAll(/--t-font-(?:display|body|data):\s*([^;]+);/g)) {
    for (const quoted of token[1].matchAll(/"([^"]+)"|'([^']+)'/g)) {
      names.add(quoted[1] ?? quoted[2]);
    }
  }
  return [...names].filter((name) => FONT_LIBRARY[name]);
}

export function fontPackageDir(entry) {
  try { return path.dirname(localRequire.resolve(`${entry.pkg}/package.json`)); }
  catch { return path.dirname(cachedRequire.resolve(`${entry.pkg}/package.json`)); }
}
