const repo = 'https://github.com/GODVvVZzz/text2html2png';
export const installCommand = 'npx skills add GODVvVZzz/text2html2png -g -y';
export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
const words = {
  en: {
    lang: 'en', other: '中文', otherPage: 'zh.html', repository: 'GitHub repository',
    title: 'Turn technical notes into diagrams you can share.',
    intro: 'Bring your system description to a compatible agent. Get a readable diagram for your README or design review, as editable HTML. Ask for PNG when you need an image.',
    action: 'Try with your agent', browse: 'Browse the examples',
    demo: 'Start with the words. See the result.', demoNote: 'Explore the supplied examples here. To turn your own prose into a diagram, copy a prompt into an agent with the skill installed.',
    source: 'Example request', result: 'Rendered example', prompt: 'Copy prompt + PNG request',
    suffix: ' Use the text2html2png skill. Also export a PNG and keep the editable HTML and Diagram JSON.',
    open: 'Open HTML preview', html: 'Download HTML', png: 'Download PNG', json: 'Diagram JSON',
    install: 'Make your first diagram', step1: 'Install the skill', step2: 'Send a prompt to your agent',
    setup: 'Run this in your terminal. Use Node.js 22.12+ and an installed Chrome-family browser. The agent installs the local runtime dependencies when needed.',
    stepCopy: 'Copy a prompt from an example above, replace the description with your own, and send it to Codex, Claude Code, or another compatible agent.',
    output: 'HTML is the default deliverable. The copied prompt explicitly asks for PNG too. Keep the JSON to revise the content and render again.',
    copyInstall: 'Copy install command', examples: 'More ways to explain your work',
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
    title: '把技术说明，变成清晰的图。',
    intro: '把系统描述交给 Agent，得到能放进 README、方案评审的图。HTML 留下来继续修改；需要图片时，再说一句“同时导出 PNG”。',
    action: '用自己的内容试试', browse: '浏览案例',
    demo: '从一段话，到一张图。', demoNote: '先看示例的需求与产物。要处理自己的文字，复制提示词，交给装好技能的 Agent。',
    source: '示例需求', result: '渲染结果', prompt: '复制提示词（含导出 PNG）',
    suffix: ' 使用 text2html2png 技能，同时导出 PNG，并保留可编辑 HTML 和 Diagram JSON。',
    open: '打开 HTML 预览', html: '下载 HTML', png: '下载 PNG', json: 'Diagram JSON',
    install: '做出你的第一张图', step1: '安装技能', step2: '把提示词发给 Agent',
    setup: '在终端运行下面的命令。需要 Node.js 22.12+ 和已安装的 Chrome 系浏览器；Agent 会在需要时安装本地运行依赖。',
    stepCopy: '复制上方案例的提示词，把描述换成自己的内容，发给 Codex、Claude Code 或其他兼容 Agent。',
    output: '默认产出 HTML。复制的提示词已明确要求同时导出 PNG。保留 JSON，后续可以修改内容、重新生成。',
    copyInstall: '复制安装命令', examples: '还有这些表达方式',
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
export function galleryPage(examples, locale) {
  const w = words[locale];
  const featured = ['service-architecture', 'order-event-architecture', 'release-flow'].map(id => examples.find(e => e.id === id)).filter(Boolean);
  const blocks = featured.map(e => {
    const copy = localize(e, locale), a = assets(e, locale);
    return `<article class="demo-panel" id="demo-${e.id}" aria-labelledby="demo-title-${e.id}">
      <div class="source"><h3 id="demo-title-${e.id}">${escapeHtml(copy.title)}</h3><p class="caption">${w.source}</p>
      <blockquote id="prompt-${e.id}">${escapeHtml(copy.prompt)}</blockquote><button class="copy" data-copy="prompt-${e.id}" data-suffix="${escapeHtml(w.suffix)}">${w.prompt}</button>
      <p class="example-note">${escapeHtml(copy.summary)}</p></div>
      <figure><figcaption>${w.result}</figcaption><a class="image-link" href="${a.html}"><img src="${a.png}" alt="${escapeHtml(copy.title)}" ${e === featured[0] ? 'fetchpriority="high"' : 'loading="lazy"'}></a>${links(e, locale, w)}</figure>
    </article>`;
  }).join('\n');
  return `<!doctype html>
<!-- Generated by scripts/build-gallery.mjs. -->
<html lang="${w.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>text2html2png — ${w.title}</title><meta name="description" content="${w.intro}">
<meta property="og:title" content="text2html2png — ${w.title}"><meta property="og:description" content="${w.intro}"><meta property="og:image" content="https://godvvvzzz.github.io/text2html2png/brand/github-preview.png"><meta name="twitter:card" content="summary_large_image">
<link rel="alternate" hreflang="en" href="index.html"><link rel="alternate" hreflang="zh-CN" href="zh.html"><link rel="stylesheet" href="gallery.css"><script src="gallery.js" defer></script></head>
<body data-copy-success="${w.copySuccess}" data-copy-fail="${w.copyFail}"><div class="shell">
<nav class="top" aria-label="${locale === 'zh' ? '主导航' : 'Main navigation'}"><a class="brand" href="${locale === 'zh' ? 'zh.html' : 'index.html'}">text2html2png<span class="brand-mark" aria-hidden="true">¶ → ▧</span></a><div><a href="${w.otherPage}" lang="${locale === 'zh' ? 'en' : 'zh-CN'}">${w.other}</a><a href="${repo}">${w.repository}</a></div></nav>
<header class="hero"><h1>${w.title}</h1><div class="hero-copy"><p>${w.intro}</p><div class="actions"><a class="primary" href="#start">${w.action}</a><a href="#examples">${w.browse}</a></div></div></header>
<main><section aria-labelledby="demo-heading" class="demo-section"><h2 id="demo-heading">${w.demo}</h2><p class="section-note">${w.demoNote}</p>
<div class="example-switch" role="group" aria-label="${locale === 'zh' ? '选择示例' : 'Choose an example'}" hidden>${featured.map(e => `<button aria-pressed="false" aria-controls="demo-${e.id}" data-demo="demo-${e.id}">${escapeHtml(localize(e, locale).title)}</button>`).join('')}</div>${blocks}</section>
<section id="start" class="start"><h2>${w.install}</h2><div class="steps"><article><h3>1. ${w.step1}</h3><p>${w.setup}</p><div class="command"><code id="install-command">${installCommand}</code><button class="copy" data-copy="install-command">${w.copyInstall}</button></div></article><article><h3>2. ${w.step2}</h3><p>${w.stepCopy}</p><p>${w.output}</p></article></div>
<details class="local"><summary>${w.local}</summary><p>${w.localNote}</p><pre><code>git clone https://github.com/GODVvVZzz/text2html2png.git
cd text2html2png/skills/text2html2png
npm start</code></pre></details></section>
<section class="proof"><h2>${w.proof}</h2><div class="proof-items">${w.proofs.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div><p class="boundary">${w.boundary}</p><div class="file-links"><a href="quality.html">${w.quality}</a><a href="${repo}/issues/new?template=trial.yml">${w.feedback}</a><a href="present.html">${w.demoLink}</a></div></section>
<section id="examples"><h2>${w.examples}</h2><p class="section-note">${w.examplesNote}</p><div class="gallery-grid">${examples.map(e => {
    const copy = localize(e, locale), a = assets(e, locale);
    return `<article class="gallery-item"><a class="image-link" href="${a.html}"><img loading="lazy" src="${a.png}" alt="${escapeHtml(copy.title)}"></a><div class="gallery-copy"><h3>${escapeHtml(copy.title)}</h3><p>${escapeHtml(copy.summary)}</p><details><summary>${w.source}</summary><blockquote id="card-prompt-${e.id}">${escapeHtml(copy.prompt)}</blockquote><button class="copy" data-copy="card-prompt-${e.id}" data-suffix="${escapeHtml(w.suffix)}">${w.prompt}</button></details>${links(e, locale, w)}</div></article>`;
  }).join('\n')}</div></section></main>
<footer><span>text2html2png · MIT</span><div><a href="${repo}/blob/main/PRIVACY.md">${w.privacy}</a><a href="${repo}/blob/main/skills/text2html2png/SKILL.md">${w.skill}</a></div></footer>
</div><p id="copy-status" role="status" aria-live="polite"></p></body></html>\n`;
}
