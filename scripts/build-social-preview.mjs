#!/usr/bin/env node
// Build the public website Open Graph preview from a committed diagram.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from '../skills/text2html2png/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { findChrome } from '../skills/text2html2png/scripts/screenshot.mjs';
import { buildThemeFontFaces } from '../skills/text2html2png/scripts/pipeline/font-embed.mjs';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(repo, 'docs/brand');
await mkdir(out, { recursive: true });
const diagram = (await readFile(path.join(repo, 'skills/text2html2png/assets/gallery/release-flow-zh-clean.png'))).toString('base64');
const copy = 'text2html2png 把技术说明变成清晰的图 开源 Agent 技能 原始需求 计划 开发 评审 测试 灰度 正式上线 每个阶段通过后进入下一步 实际渲染结果 PNG 直接分享 HTML 独立查看 JSON 修改复用 合成案例演示 图表由本地渲染器生成 需要已安装技能的 Agent 与本地运行环境 图交出去，源文件留下来 改一处文案，继续用 JSON 重新生成 github.com/GODVvVZzz/text2html2png → ·';
const font = await buildThemeFontFaces('--t-font-body: "Noto Sans SC", "IBM Plex Sans";', copy);
if (font.warnings.length) throw Error(font.warnings.join('\n'));
const configs = [
  { id: 'github-preview', width: 1200, height: 630 },
];
const browser = await puppeteer.launch({ executablePath: await findChrome(), headless: true });
try {
  for (const config of configs) {
    const landscape = config.width > config.height;
    const tall = config.height > 1600;
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>text2html2png 分享素材</title><style>${font.css}
*{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#202a3e;font-family:"Noto Sans SC","IBM Plex Sans",sans-serif}.poster{width:${config.width}px;height:${config.height}px;padding:${landscape ? '48px 56px' : '60px 68px'};display:flex;flex-direction:column;gap:${landscape ? 14 : 22}px;overflow:hidden}.brand{color:#2058ce;font:700 ${landscape ? 26 : 32}px "IBM Plex Sans",sans-serif;margin:0}h1{font-size:${landscape ? 48 : 64}px;line-height:1.3;letter-spacing:-1px;margin:0}p{margin:0}.intro{font-size:${landscape ? 18 : 28}px;color:#52617a}.content{display:${landscape ? 'grid' : 'flex'};${landscape ? 'grid-template-columns: .7fr 1.3fr;align-items:center;gap:28px;' : 'flex-direction:column;gap:24px;'}}.source{background:white;border-left:5px solid #2058ce;padding:${landscape ? 18 : 28}px;font-size:${landscape ? 19 : 27}px;line-height:1.75}.source strong{display:block;font-size:${landscape ? 17 : 23}px;margin-bottom:12px;color:#2058ce}.shot{margin:0;min-width:0;background:#fff;padding:12px;border:1px solid #cbd4e3;border-radius:8px}.shot img{display:block;width:100%;height:auto}.shot figcaption{font-size:${landscape ? 14 : 20}px;color:#52617a;padding:6px 12px}.outputs{display:flex;gap:12px}.outputs p{flex:1;border-top:2px solid #cbd4e3;padding-top:18px;font-size:${landscape ? 18 : 26}px;color:#52617a}.outputs b{display:block;color:#202a3e;margin-bottom:8px;font-family:"IBM Plex Sans",sans-serif}.footer{font-size:${landscape ? 16 : 23}px;color:#52617a;line-height:1.6;margin-top:auto}.repo{font-family:"IBM Plex Sans",sans-serif;color:#2058ce;font-size:${landscape ? 21 : 29}px}.disclaimer{font-size:${landscape ? 13 : 18}px;margin-top:10px}
${landscape ? ".poster{position:relative;padding:40px 48px;gap:12px}h1{font-size:40px;line-height:1.3}.content{display:block}.source{width:400px;font-size:18px;padding:18px}.shot{position:absolute;right:48px;top:144px;width:650px}.footer{margin-top:auto}" : ""}
${tall ? ".poster{gap:30px}h1{font-size:88px}.intro{font-size:32px}.source{font-size:32px;padding:34px}.outputs p{font-size:32px}.reuse{border-left:4px solid #2058ce;padding:16px 24px;margin-top:16px}.reuse strong{display:block;font-size:40px;margin-bottom:12px}.reuse p{font-size:28px;color:#52617a}" : ""}
</style></head><body><main class="poster"><p class="brand">text2html2png</p><h1>把技术说明<br>变成清晰的图</h1><p class="intro">开源 Agent 技能</p><div class="content"><div class="source"><strong>原始需求</strong>计划 → 开发 → 评审 → 测试 → 灰度 → <span style="white-space:nowrap">正式上线。</span><br>每个阶段通过后，进入下一步。</div><figure class="shot"><img src="data:image/png;base64,${diagram}" alt="发布流程实际渲染结果"><figcaption>实际渲染结果 · 合成案例</figcaption></figure></div>${landscape ? '' : '<div class="outputs"><p><b>PNG</b>直接分享</p><p><b>HTML</b>独立查看</p><p><b>JSON</b>修改复用</p></div>'}${tall ? '<aside class="reuse"><strong>图交出去，源文件留下来。</strong><p>改一处文案，继续用 JSON 重新生成。</p></aside>' : ''}<footer class="footer"><p class="repo">github.com/GODVvVZzz/text2html2png</p><p class="disclaimer">图表由本地渲染器生成；需要已安装技能的 Agent 与本地运行环境。</p></footer></main></body></html>`;
    const file = path.join(out, config.id + '.html');
    await writeFile(file, html);
    const page = await browser.newPage();
    await page.setViewport({ width: config.width, height: config.height });
    await page.setJavaScriptEnabled(false);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.$eval('.poster', element => element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
    if (overflow) throw Error('Social preview layout overflows: ' + config.id);
    await page.screenshot({ path: path.join(out, config.id + '.png') });
    await page.close();
    console.log('Built ' + config.id);
  }
} finally { await browser.close(); }
