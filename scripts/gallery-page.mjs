const repo = 'https://github.com/GODVvVZzz/text2html2png';
export const installCommand = 'npx skills add GODVvVZzz/text2html2png -g -y';
export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
const words = {
  en: {
    lang: 'en', other: '中文', otherPage: 'zh.html', repository: 'GitHub repository',
    title: 'Different ideas deserve different diagrams.',
    intro: 'A system map, a project plan, a funnel. Pick the result that fits your work, copy its prompt, and bring your own notes to an agent. Keep the HTML and ask for PNG to share.',
    action: 'Try with your agent', browse: 'Browse the examples',
    demo: 'Choose a result. Make it yours.', demoNote: 'Five real outputs, five visual themes. Select an image to see its source prompt and download the files.',
    source: 'Read the source prompt', result: 'Rendered example', prompt: 'Copy prompt + PNG request', selected: 'The selected example', all: 'Explore every example', type: 'Diagram type', style: 'Visual theme', presentTitle: 'Start with the result.', presentNote: 'Choose a diagram, then look at the words and reusable files behind it. These synthetic examples are rendered by the skill.', stepResult: '1. See the diagram', stepSource: '2. Read the prompt', stepFiles: '3. Keep the files', filesTitle: 'A diagram you can keep working with', filesNote: 'Share the PNG, open the HTML on its own, or edit the Diagram JSON and render it again.', gallery: 'All examples',
    suffix: ' Use the text2html2png skill. Also export a PNG and keep the editable HTML and Diagram JSON.',
    open: 'Open HTML preview', html: 'Download HTML', png: 'Download PNG', json: 'Diagram JSON',
    install: 'Make your first diagram', step1: 'Install the skill', step2: 'Send a prompt to your agent',
    setup: 'Run this in your terminal. Use Node.js 22.12+ and an installed Chrome-family browser. The agent installs the local runtime dependencies when needed.',
    stepCopy: 'Copy a prompt from an example above, replace the description with your own, and send it to Codex, Claude Code, or another compatible agent.',
    output: 'HTML is the default deliverable. The copied prompt explicitly asks for PNG too. Keep the JSON to revise the content and render again.',
    copyInstall: 'Copy install command', examples: 'Find a diagram for the work in front of you',
    examplesNote: 'English and Chinese examples, with the source data and downloadable output. All example content is synthetic.',
    local: 'Try the renderer locally', localNote: 'Edit Diagram JSON, preview, and export in your browser. This local playground does not convert free-form text; your agent handles that step.',
    proof: 'What keeps the result useful',
    proofs: [ ['Keep the supplied facts', 'The skill instructs the agent to preserve facts and relationships, and omit unsupported metrics. Review the meaning against your source before sharing.'], ['Check the actual layout', 'The browser audit checks clipping, overlap, contrast, and short Chinese labels. PNG export runs the audit before capturing the image.'], ['Keep your source', 'HTML, PNG, and versioned Diagram JSON are files you can keep. Rendering runs locally; your agent’s handling of input depends on its service.'] ],
    boundary: 'Architecture examples show layers; node descriptions state the specific dependencies. Use a graph editor for arbitrary node-to-node connections. Use a plotting library for scientific charts.',
    copySuccess: 'Copied.', copyFail: 'Clipboard unavailable. Select and copy the text manually.', privacy: 'Privacy', skill: 'Skill instructions',
    feedback: 'Share your first-use result', quality: 'Quality and evaluation', demoLink: 'Example walkthrough',
  },
  zh: {
    lang: 'zh-CN', other: 'English', otherPage: 'index.html', repository: 'GitHub 仓库',
    title: '架构、计划、数据，各有各的表达。',
    intro: '系统架构、项目排期、转化漏斗。选一张接近你需求的成图，复制提示词，把自己的内容交给 Agent。保留 HTML，再说一句“同时导出 PNG”，就能贴进文档。',
    action: '用自己的内容试试', browse: '浏览案例',
    demo: '先挑一张你想做的图。', demoNote: '五种风格，都是技能实际生成的产物。点击图片，查看原始需求、复制提示词、下载源文件。',
    source: '查看原始需求', result: '渲染结果', prompt: '复制提示词（含导出 PNG）', selected: '当前案例', all: '查看全部案例', type: '图表类型', style: '视觉风格', presentTitle: '先看图，再看它怎么做。', presentNote: '挑一个案例，对照成图、原始需求和可复用的源文件。所有内容均为合成示例，由技能实际渲染。', stepResult: '1. 看成图', stepSource: '2. 看需求', stepFiles: '3. 留下源文件', filesTitle: '图之外，还留下源文件', filesNote: 'PNG 用于粘贴分享；HTML 可独立查看；Diagram JSON 可修改内容和主题，再次渲染。', gallery: '全部案例',
    suffix: ' 使用 text2html2png 技能，同时导出 PNG，并保留可编辑 HTML 和 Diagram JSON。',
    open: '打开 HTML 预览', html: '下载 HTML', png: '下载 PNG', json: 'Diagram JSON',
    install: '做出你的第一张图', step1: '安装技能', step2: '把提示词发给 Agent',
    setup: '在终端运行下面的命令。需要 Node.js 22.12+ 和已安装的 Chrome 系浏览器；Agent 会在需要时安装本地运行依赖。',
    stepCopy: '复制上方案例的提示词，把描述换成自己的内容，发给 Codex、Claude Code 或其他兼容 Agent。',
    output: '默认产出 HTML。复制的提示词已明确要求同时导出 PNG。保留 JSON，后续可以修改内容、重新生成。',
    copyInstall: '复制安装命令', examples: '你的内容，适合哪一种图？',
    examplesNote: '中英文案例都提供源数据与可下载的产物。所有案例内容均为合成示例。',
    local: '在本机试用渲染器', localNote: '在浏览器中修改 Diagram JSON、预览和导出。本地试用页不理解自由文本；文字整理这一步由 Agent 完成。',
    proof: '让图真正用得上的三个约定',
    proofs: [ ['保留给定的事实', '技能要求 Agent 保留事实与关系，不补造指标。分享前，仍应对照原文检查图中的含义。'], ['检查实际排版', '浏览器质检检查裁字、重叠、对比度和中文短标题换行。PNG 导出会先通过版面审计。'], ['留下可复用的源文件', 'HTML、PNG 和版本化 Diagram JSON 都能保留。渲染在本机运行；Agent 如何处理输入，取决于你使用的服务。'] ],
    boundary: '架构示例按层展示，具体依赖写在节点说明里。任意节点连线请使用图编辑工具；科学统计图请使用数据绘图库。',
    copySuccess: '已复制。', copyFail: '剪贴板不可用，请选中文字手动复制。', privacy: '隐私说明', skill: '技能说明',
    feedback: '反馈首次试用结果', quality: '质量与评测', demoLink: '产品演示',
  },
};
export function localize(example, locale) {
  const data = example.fixtures[locale];
  return {
    title: locale === 'zh' ? (example.titleZh || data.title) : example.title,
    summary: locale === 'zh' ? (example.summaryZh || data.subtitle || '') : example.summary,
    prompt: locale === 'zh' ? (example.promptZh || example.prompt) : example.prompt,
  };
}
function assets(example, locale) {
  return { png: `gallery/${example.id}-${locale}-${example.theme}.png`, html: `examples/${example.id}-${locale}.html`, json: `examples/${example.id}-${locale}.diagram.json` };
}
function links(example, locale, w) {
  const a = assets(example, locale);
  return `<div class="file-links"><a href="${a.html}">${w.open}</a><a href="${a.png}" download>${w.png}</a><a href="${a.html}" download>${w.html}</a><a href="${a.json}" download>${w.json}</a></div>`;
}
const featuredIds = ['signup-funnel', 'launch-plan', 'library-roadmap', 'studio-org', 'service-architecture'];
const chartNames = {
  en: { architecture: 'Architecture', flowchart: 'Workflow', comparison: 'Comparison', timeline: 'Timeline', dashboard: 'Dashboard', gantt: 'Gantt plan', 'org-chart': 'Org chart', funnel: 'Funnel', narrative: 'Product brief' },
  zh: { architecture: '架构图', flowchart: '流程图', comparison: '对比表', timeline: '时间线', dashboard: '数据看板', gantt: '甘特图', 'org-chart': '组织架构', funnel: '转化漏斗', narrative: '产品长图' },
};
function featuredExamples(examples) {
  const featured = featuredIds.map(id => examples.find(example => example.id === id)).filter(Boolean);
  return featured.length ? featured : examples.slice(0, 5);
}
function metadata(example, locale) {
  return `<span class="chart-kind">${escapeHtml(chartNames[locale][example.chart] || example.chart)}</span><span class="theme-label">${escapeHtml(example.theme)}</span>`;
}
function imageMarkup(example, locale, eager = false) {
  const copy = localize(example, locale);
  return `<img src="${assets(example, locale).png}" alt="${escapeHtml(chartNames[locale][example.chart] || example.chart)}：${escapeHtml(copy.title)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}
function overview(examples, locale, { present = false } = {}) {
  const w = words[locale];
  return `<div class="example-switch visual-menu" aria-label="${locale === 'zh' ? '选择成图案例' : 'Choose a diagram'}">${examples.map((example, index) => {
    const copy = localize(example, locale);
    const target = `${present ? 'showcase' : 'demo'}-${example.id}`;
    return `<a class="visual-choice" href="#${target}" data-${present ? 'showcase' : 'demo'}="${target}" aria-controls="${target}"><span class="choice-image">${imageMarkup(example, locale, index === 0)}</span><span class="choice-caption"><span class="choice-title">${escapeHtml(copy.title)}</span><span class="example-meta">${metadata(example, locale)}</span></span></a>`;
  }).join('')}</div>`;
}
function promptBlock(example, locale, prefix = 'prompt', open = false) {
  const w = words[locale], copy = localize(example, locale);
  return `<details class="prompt-details"${open ? ' open' : ''}><summary>${w.source}</summary><blockquote id="${prefix}-${example.id}">${escapeHtml(copy.prompt)}</blockquote></details><button class="copy" data-copy="${prefix}-${example.id}" data-suffix="${escapeHtml(w.suffix)}">${w.prompt}</button>`;
}
function pageHead(locale, title, script = 'gallery.js') {
  const w = words[locale];
  return `<!doctype html>
<!-- Generated by scripts/build-gallery.mjs. -->
<html lang="${w.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>text2html2png — ${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(w.intro)}">
<meta property="og:title" content="text2html2png — ${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(w.intro)}"><meta property="og:image" content="https://godvvvzzz.github.io/text2html2png/brand/github-preview.png"><meta name="twitter:card" content="summary_large_image">
<link rel="alternate" hreflang="en" href="index.html"><link rel="alternate" hreflang="zh-CN" href="zh.html"><link rel="stylesheet" href="gallery.css"><script src="${script}" defer></script></head>`;
}
function footer(locale) {
  const w = words[locale];
  return `<footer><span>text2html2png · MIT</span><div><a href="${repo}/blob/main/PRIVACY.md">${w.privacy}</a><a href="${repo}/blob/main/skills/text2html2png/SKILL.md">${w.skill}</a></div></footer>`;
}
export function galleryPage(examples, locale) {
  const w = words[locale], featured = featuredExamples(examples);
  const featuredSet = new Set(featured.map(example => example.id));
  const ordered = [...examples.filter(example => !featuredSet.has(example.id)), ...featured];
  ordered.sort((a, b) => Number(b.id === 'support-snapshot') - Number(a.id === 'support-snapshot'));
  const blocks = featured.map(example => {
    const copy = localize(example, locale), a = assets(example, locale);
    return `<article class="demo-panel" id="demo-${example.id}" aria-labelledby="demo-title-${example.id}">
      <figure><a class="image-link" href="${a.html}">${imageMarkup(example, locale)}</a><figcaption>${w.result} <a href="${a.html}">${w.open}</a></figcaption></figure>
      <div class="source"><div class="example-meta">${metadata(example, locale)}</div><h3 id="demo-title-${example.id}">${escapeHtml(copy.title)}</h3><p class="example-note">${escapeHtml(copy.summary)}</p>${promptBlock(example, locale)}${links(example, locale, w)}</div>
    </article>`;
  }).join('\n');
  return `${pageHead(locale, w.title)}
<body data-copy-success="${w.copySuccess}" data-copy-fail="${w.copyFail}"><a class="skip-link" href="#demo-heading">${locale === 'zh' ? '跳到案例' : 'Skip to examples'}</a><div class="shell">
<nav class="top" aria-label="${locale === 'zh' ? '主导航' : 'Main navigation'}"><a class="brand" href="${locale === 'zh' ? 'zh.html' : 'index.html'}">text2html2png<span class="brand-mark" aria-hidden="true">¶ → ▧</span></a><div><a class="language-link" href="${w.otherPage}" lang="${locale === 'zh' ? 'en' : 'zh-CN'}">${w.other}</a><a href="${repo}">${w.repository}</a></div></nav>
<header class="hero"><h1>${locale === 'zh' ? '<span>架构、计划、数据，</span><span>各有各的表达。</span>' : w.title}</h1><div class="hero-copy"><p>${w.intro}</p><div class="actions"><a class="primary" href="#start">${w.action}</a><a href="#examples">${w.browse}</a></div></div></header>
<main><section aria-labelledby="demo-heading" class="demo-section"><div class="section-heading"><h2 id="demo-heading">${w.demo}</h2><a href="present.html">${w.demoLink}</a></div><p class="section-note">${w.demoNote}</p>
${overview(featured, locale)}<div class="demo-viewer">${blocks}</div></section>
<section id="examples"><h2>${w.examples}</h2><p class="section-note">${w.examplesNote}</p><div class="gallery-grid">${ordered.map(example => {
    const copy = localize(example, locale), a = assets(example, locale);
    return `<article class="gallery-item"><a class="image-link" href="${a.html}">${imageMarkup(example, locale)}</a><div class="gallery-copy"><div class="example-meta">${metadata(example, locale)}</div><h3>${escapeHtml(copy.title)}</h3><p>${escapeHtml(copy.summary)}</p>${promptBlock(example, locale, 'card-prompt')}${links(example, locale, w)}</div></article>`;
  }).join('\n')}</div></section>
<section id="start" class="start"><h2>${w.install}</h2><div class="steps"><article><h3>1. ${w.step1}</h3><p>${w.setup}</p><div class="command"><code id="install-command">${installCommand}</code><button class="copy" data-copy="install-command">${w.copyInstall}</button></div></article><article><h3>2. ${w.step2}</h3><p>${w.stepCopy}</p><p>${w.output}</p></article></div>
<details class="local"><summary>${w.local}</summary><p>${w.localNote}</p><pre><code>git clone https://github.com/GODVvVZzz/text2html2png.git
cd text2html2png/skills/text2html2png
npm start</code></pre></details></section>
<section class="proof"><h2>${w.proof}</h2><div class="proof-items">${w.proofs.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div><p class="boundary">${w.boundary}</p><div class="file-links"><a href="quality.html">${w.quality}</a><a href="${repo}/issues/new?template=trial.yml">${w.feedback}</a><a href="present.html">${w.demoLink}</a></div></section></main>
${footer(locale)}</div><p id="copy-status" role="status" aria-live="polite"></p></body></html>\n`;
}

export function presentPage(examples, locale = 'zh') {
  const w = words[locale], featured = featuredExamples(examples);
  return `${pageHead(locale, w.presentTitle, 'present.js')}
<body data-copy-success="${w.copySuccess}" data-copy-fail="${w.copyFail}"><div class="shell"><nav class="top" aria-label="${locale === 'zh' ? '主导航' : 'Main navigation'}"><a class="brand" href="${locale === 'zh' ? 'zh.html' : 'index.html'}">text2html2png</a><div><a href="${locale === 'zh' ? 'zh.html' : 'index.html'}">${w.gallery}</a><a href="quality.html">${w.quality}</a></div></nav>
<main><header class="present-intro"><h1>${w.presentTitle}</h1><p class="section-note">${w.presentNote}</p></header>${overview(featured, locale, { present: true })}
<div class="showcase-viewer">${featured.map(example => {
    const copy = localize(example, locale), a = assets(example, locale), id = `showcase-${example.id}`;
    return `<section class="showcase" id="${id}" aria-labelledby="${id}-title"><div class="section-heading"><h2 id="${id}-title">${escapeHtml(copy.title)}</h2><div class="example-meta">${metadata(example, locale)}</div></div>
      <div class="showcase-steps" role="group" aria-label="${locale === 'zh' ? '演示步骤' : 'Walkthrough steps'}" hidden><button data-step="${id}-result" aria-controls="${id}-result" aria-pressed="true">${w.stepResult}</button><button data-step="${id}-source" aria-controls="${id}-source" aria-pressed="false">${w.stepSource}</button><button data-step="${id}-files" aria-controls="${id}-files" aria-pressed="false">${w.stepFiles}</button></div>
      <div class="screen result-screen" id="${id}-result"><a class="image-link" href="${a.html}">${imageMarkup(example, locale)}</a><p><a href="${a.html}">${w.open}</a></p></div>
      <div class="screen" id="${id}-source"><h3>${w.source}</h3><blockquote id="showcase-prompt-${example.id}">${escapeHtml(copy.prompt)}</blockquote><button class="copy" data-copy="showcase-prompt-${example.id}" data-suffix="${escapeHtml(w.suffix)}">${w.prompt}</button></div>
      <div class="screen" id="${id}-files"><h3>${w.filesTitle}</h3><p>${w.filesNote}</p>${links(example, locale, w)}<p><a class="primary" href="${locale === 'zh' ? 'zh.html' : 'index.html'}#start">${w.action}</a></p></div>
    </section>`;
  }).join('\n')}</div><section class="present-next"><h2>${w.install}</h2><p>${w.stepCopy}</p><div class="actions"><a class="primary" href="${locale === 'zh' ? 'zh.html' : 'index.html'}#start">${w.action}</a><a href="${locale === 'zh' ? 'zh.html' : 'index.html'}#examples">${w.all}</a></div></section></main>${footer(locale)}</div><p id="copy-status" role="status" aria-live="polite"></p></body></html>\n`;
}
