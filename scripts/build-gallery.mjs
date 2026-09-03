#!/usr/bin/env node

// Builds the published gallery from the example manifest:
//   docs/index.html        the GitHub Pages gallery
//   docs/gallery/*.png     web-weight copies rendered at scale 1
//   skills/.../prompts.md  the in-repository prompt index
//
// Everything is derived from `examples/<id>.meta.json`, so the site, the
// Markdown index, and the committed images cannot drift apart.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadExamples, coverageReport } from "../skills/text2html2png/scripts/build-examples.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const docsDir = path.join(repoRoot, "docs");
const docsGalleryDir = path.join(docsDir, "gallery");
const promptsPath = path.join(repoRoot, "skills", "text2html2png", "examples", "prompts.md");

const REPO_SLUG = "GODVvVZzz/text2html2png";
const BLOB_BASE = `https://github.com/${REPO_SLUG}/blob/main`;

const CHART_ORDER = [
  "flowchart", "comparison", "timeline", "architecture",
  "dashboard", "gantt", "org-chart", "funnel", "narrative",
];

const CHART_LABELS = {
  flowchart: "Flowchart",
  comparison: "Comparison",
  timeline: "Timeline",
  architecture: "Architecture",
  dashboard: "Dashboard",
  gantt: "Gantt",
  "org-chart": "Org chart",
  funnel: "Funnel",
  narrative: "Narrative brief",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function chartRank(chart) {
  const index = CHART_ORDER.indexOf(chart);
  return index === -1 ? CHART_ORDER.length : index;
}

function card(example) {
  const htmlEn = `examples/${example.id}-en.html`;
  const htmlZh = `examples/${example.id}-zh.html`;
  const pngRel = `assets/gallery/${example.id}-en-${example.theme}.png`;
  return `      <article class="card">
        <a class="shot" href="gallery/${example.id}-en-${example.theme}.png">
          <img src="gallery/${example.id}-en-${example.theme}.png" alt="${escapeHtml(example.title)}, a ${escapeHtml(example.chart)} diagram in the ${escapeHtml(example.theme)} theme" loading="lazy">
        </a>
        <div class="body">
          <div class="tags">
            <span class="tag chart">${escapeHtml(CHART_LABELS[example.chart] ?? example.chart)}</span>
            <span class="tag theme">${escapeHtml(example.theme)}</span>
            <span class="tag size">${example.width}px</span>
          </div>
          <h3>${escapeHtml(example.title)}</h3>
          <p class="summary">${escapeHtml(example.summary)}</p>
          <details>
            <summary>The prompt that produced it</summary>
            <blockquote>${escapeHtml(example.prompt)}</blockquote>
          </details>
          <div class="links">
            <a href="${BLOB_BASE}/skills/text2html2png/${htmlEn}">Editable HTML</a>
            <a href="${BLOB_BASE}/skills/text2html2png/${htmlZh}">中文 HTML</a>
            <a href="${BLOB_BASE}/skills/text2html2png/${pngRel}">Full-resolution PNG</a>
          </div>
        </div>
      </article>`;
}

function page(examples, coverage) {
  const sorted = [...examples].sort((a, b) => chartRank(a.chart) - chartRank(b.chart) || a.id.localeCompare(b.id));
  const charts = CHART_ORDER.length - coverage.missingCharts.length;
  const styles = 5 - coverage.missingThemes.length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>text2html2png gallery — every diagram type, rendered locally</title>
<meta name="description" content="Every published text2html2png example: the prompt, the editable HTML, and the rendered PNG. ${charts} chart types across ${styles} visual themes.">
<meta property="og:title" content="text2html2png gallery">
<meta property="og:description" content="Every published example: the prompt, the editable HTML, and the rendered PNG.">
<meta property="og:image" content="https://raw.githubusercontent.com/${REPO_SLUG}/main/assets/social-card.png">
<meta name="twitter:card" content="summary_large_image">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --bg: #0b1020;
    --panel: #141a2e;
    --panel-2: #1b2340;
    --line: #2a3350;
    --ink: #f4f7fc;
    --muted: #a8b3c7;
    --cyan: #38bdf8;
    --violet: #a855f7;
    --pink: #f472b6;
  }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font: 16px/1.6 "Avenir Next", "Segoe UI", "PingFang SC", system-ui, sans-serif;
    background-image:
      radial-gradient(circle at 6% 0%, rgba(56,189,248,.14), transparent 38%),
      radial-gradient(circle at 96% 100%, rgba(168,85,247,.16), transparent 42%);
    background-repeat: no-repeat;
  }
  a { color: var(--cyan); }
  .shell { max-width: 1220px; margin: 0 auto; padding: 56px 24px 80px; }

  header .eyebrow {
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  h1 {
    margin: 12px 0 0;
    font-size: clamp(34px, 5vw, 54px);
    line-height: 1.08;
    letter-spacing: -1.4px;
  }
  h1 span {
    background: linear-gradient(96deg, var(--cyan), var(--violet) 56%, var(--pink));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .lede { max-width: 720px; margin: 18px 0 0; color: #cdd6e5; font-size: 19px; }

  .facts { display: flex; flex-wrap: wrap; gap: 10px; margin: 26px 0 0; padding: 0; list-style: none; }
  .facts li {
    padding: 8px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: rgba(20,26,46,.85);
    font-size: 14px;
    font-weight: 600;
  }

  .install {
    display: block;
    width: fit-content;
    max-width: 100%;
    margin: 26px 0 0;
    padding: 14px 18px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #0f1526;
    color: #a7ebff;
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 15px;
    overflow-x: auto;
  }
  .header-links { margin-top: 20px; font-size: 15px; }
  .header-links a { margin-right: 18px; }

  h2 {
    margin: 64px 0 8px;
    font-size: 26px;
    letter-spacing: -.4px;
  }
  .section-note { margin: 0 0 24px; color: var(--muted); font-size: 15px; }

  /* Diagram aspect ratios range from 0.8 to 2.2, so an equal-height grid leaves
     large dead zones under the wide cards. Masonry columns pack them tightly
     without cropping or letterboxing anything. */
  .grid {
    columns: 3;
    column-gap: 22px;
  }
  @media (max-width: 1080px) { .grid { columns: 2; } }
  @media (max-width: 720px) { .grid { columns: 1; } }
  .card {
    break-inside: avoid;
    margin: 0 0 22px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--panel);
    overflow: hidden;
  }
  .shot { display: block; background: var(--panel-2); line-height: 0; }
  .shot img { width: 100%; height: auto; display: block; }
  .body { display: flex; flex-direction: column; gap: 10px; padding: 18px 20px 20px; }
  .tags { display: flex; flex-wrap: wrap; gap: 7px; }
  .tag {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
  }
  .tag.chart { background: rgba(56,189,248,.16); color: #9adcff; }
  .tag.theme { background: rgba(168,85,247,.18); color: #dcc0ff; }
  .tag.size { background: rgba(148,163,184,.16); color: #cbd5e1; }
  .card h3 { margin: 0; font-size: 20px; letter-spacing: -.3px; }
  .summary { margin: 0; color: #c3cddc; font-size: 15px; }
  details { border-top: 1px solid var(--line); padding-top: 12px; }
  details summary { cursor: pointer; color: var(--muted); font-size: 14px; font-weight: 600; }
  blockquote {
    margin: 12px 0 0;
    padding: 12px 14px;
    border-left: 3px solid var(--violet);
    border-radius: 0 8px 8px 0;
    background: #10162a;
    color: #d6deec;
    font-size: 14px;
  }
  .links { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 2px; font-size: 14px; font-weight: 600; }

  .repro {
    margin: 64px 0 0;
    padding: 26px 28px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--panel);
  }
  .repro h2 { margin-top: 0; }
  pre {
    margin: 0;
    padding: 16px 18px;
    border-radius: 12px;
    background: #0f1526;
    color: #d7e3f4;
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 14px;
    overflow-x: auto;
  }
  footer { margin-top: 56px; color: var(--muted); font-size: 14px; }
</style>
</head>
<body>
<div class="shell">
  <header>
    <p class="eyebrow">text2html2png gallery</p>
    <h1>Every example, with the <span>prompt that made it</span></h1>
    <p class="lede">These are real outputs of the skill, rendered locally in Chrome from the HTML committed next to them. Every figure is synthetic: no customer, employee, or company data appears anywhere.</p>
    <ul class="facts">
      <li>${examples.length} published examples</li>
      <li>${charts}/${CHART_ORDER.length} chart types</li>
      <li>${styles}/5 visual themes</li>
      <li>Layout-audited in CI</li>
    </ul>
    <code class="install">npx skills add ${REPO_SLUG} -g -y</code>
    <p class="header-links">
      <a href="https://github.com/${REPO_SLUG}">Repository</a>
      <a href="${BLOB_BASE}/README.md">README</a>
      <a href="${BLOB_BASE}/skills/text2html2png/SKILL.md">SKILL.md</a>
      <a href="${BLOB_BASE}/PRIVACY.md">Privacy</a>
    </p>
  </header>

  <main>
    <h2>The gallery</h2>
    <p class="section-note">Open any prompt to see exactly what was asked for. Nothing here was hand-corrected after rendering beyond fixes the layout audit demanded.</p>
    <div class="grid">
${sorted.map(card).join("\n")}
    </div>

    <section class="repro">
      <h2>Reproduce every image</h2>
      <p class="section-note">The gallery is generated, not curated by hand. Clone the repository and run:</p>
      <pre>git clone https://github.com/${REPO_SLUG}.git
cd text2html2png/skills/text2html2png
npm ci
npm run render:examples      # re-renders every full-resolution PNG from the committed HTML
npm run check:layout         # measures each rendering for clipping, contrast, and overlap
cd ../..
node scripts/build-gallery.mjs   # rebuilds this page and the images on it</pre>
    </section>
  </main>

  <footer>
    <p>All example content is synthetic and created for this repository. Rendered locally with no hosted API and no telemetry.</p>
  </footer>
</div>
</body>
</html>
`;
}

function promptsMarkdown(examples, coverage) {
  const sorted = [...examples].sort((a, b) => chartRank(a.chart) - chartRank(b.chart) || a.id.localeCompare(b.id));
  const charts = CHART_ORDER.length - coverage.missingCharts.length;
  const styles = 5 - coverage.missingThemes.length;

  const lines = [
    "<!-- Generated by scripts/build-gallery.mjs. Edit the example .meta.json files instead. -->",
    "",
    "# Public example prompts",
    "",
    `${examples.length} examples covering ${charts}/${CHART_ORDER.length} chart types and ${styles}/5 visual themes.`,
    "All example content is synthetic. Every example ships in English and Chinese, rendered from one shared DOM.",
    "",
    "| Example | Chart | Theme | Files |",
    "|---|---|---|---|",
  ];

  for (const example of sorted) {
    lines.push(`| ${example.title} | ${CHART_LABELS[example.chart] ?? example.chart} | \`${example.theme}\` | [HTML](${example.id}-en.html) · [PNG](../assets/gallery/${example.id}-en-${example.theme}.png) |`);
  }

  for (const example of sorted) {
    lines.push(
      "",
      `## ${example.title}`,
      "",
      `\`${example.chart}\` × \`${example.theme}\` · rendered at ${example.width}px`,
      "",
      `> ${example.prompt}`,
      "",
      example.summary,
      "",
      `Output: [HTML](${example.id}-en.html) · [PNG](../assets/gallery/${example.id}-en-${example.theme}.png)`,
    );
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const skipRender = process.argv.includes("--skip-render");
  const examples = await loadExamples();
  const coverage = coverageReport(examples);

  await mkdir(docsGalleryDir, { recursive: true });

  if (!skipRender) {
    // Imported lazily so `--skip-render` works in a checkout with no installed
    // dependencies, which is how CI verifies the generated text is current.
    const { renderScreenshot } = await import("../skills/text2html2png/scripts/screenshot.mjs");

    for (const example of examples) {
      // One English rendering per example keeps the published page fast; the
      // full-resolution bilingual PNGs stay in the skill gallery.
      const outName = `${example.id}-en-${example.theme}.png`;
      await renderScreenshot({
        html: example.htmlPathFor("en"),
        out: path.join(docsGalleryDir, outName),
        bg: "auto",
        width: example.width,
        padding: 24,
        scale: 1,
        selector: ".wrap",
        chrome: null,
        allowNetwork: false,
        noSandbox: false,
        force: true,
      });
      console.log(`rendered docs/gallery/${outName}`);
    }
  }

  await writeFile(path.join(docsDir, "index.html"), page(examples, coverage), "utf8");
  console.log("wrote docs/index.html");

  await writeFile(promptsPath, promptsMarkdown(examples, coverage), "utf8");
  console.log("wrote skills/text2html2png/examples/prompts.md");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
