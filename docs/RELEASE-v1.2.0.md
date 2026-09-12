v1.2.0 makes ordinary technical text, low-conversion funnels and short briefs work reliably, with safer exports and a simpler local start.

- **Technical text stays text.** Issue numbers such as `Release #1234`, code examples and `online=12` no longer trigger false safety errors. HTML and CSS are parsed using their grammars; real scripts, event attributes and local/remote resource requests remain restricted.
- **Funnels preserve actual proportions.** `1000 → 400 → 100` now renders and exports as `100% → 40% → 10%`. Labels sit outside the bars, including very small and zero values. Zero denominators are explicitly undefined.
- **Short briefs need no filler.** Narrative diagrams accept one to seven sections; eyebrows, icons and footers are optional.
- **Safer files and complete fonts.** Audit and rasterization finish before publishing outputs, so audit/browser failures preserve earlier HTML and PNG files. Capture keeps the audited viewport, fixing centered-content blank images. Font subsets include calculated labels and uppercase theme text.
- **One local start command.** Run `npm start` in `skills/text2html2png` after cloning. It checks and installs the clean-theme runtime before serving the JSON playground. Setup also detects and repairs old dependency versions, fonts and stale install records while preserving installed themes.
- **Validated release workflow.** Packaging waits for the full CI workflow on the tagged commit, including Ubuntu, macOS and Windows checks, isolated installation/repair, gallery consistency and theme contracts.

Compatibility and upgrade:

- The version 1 Diagram JSON envelope and all published example inputs remain supported.
- Unsupported fields inside `data`, including nested fields, now fail with their JSON path instead of being ignored. Move metadata outside the renderer input; map source facts to fields the selected chart actually displays.
- Funnel values must be finite, non-negative and non-increasing. Increasing sequences should use a different representation.
- CLI delivery now requires the selected theme's fonts. After updating the skill, run `node scripts/setup.mjs --theme clean` in its directory; select another theme when needed. Node.js 22.12+ and a local Chrome-family browser remain required for the full workflow.

Install from GitHub:

```bash
npx skills add GODVvVZzz/text2html2png -g -y
```

Local validation before release: 76 runtime tests with no skips, 22 strict example layout audits, seven theme-contract tests, isolated installation and repair, local playground PNG export, and zero reported dependency vulnerabilities. These checks exercise the renderer and installation; they are not independent Agent success rates, user adoption measurements or competitive benchmarks. Architecture diagrams remain layered overviews, without arbitrary node-to-node routing.

The `.skill` asset is a ZIP archive of the portable skill directory. Verify it using `SHA256SUMS`. No npm package is published.

中文：本版修复普通技术文字误判、低转化率漏斗无法出图及居中内容截图空白的问题；支持单节图文和 `npm start` 自动准备本地试用。升级会检查并修复旧依赖，审计失败保留旧产物。注意：未知 JSON 字段现在会报错，漏斗数值必须非递增；尚未完成独立 Agent 评测或真实用户复用验证。

[English gallery](https://godvvvzzz.github.io/text2html2png/) · [中文案例](https://godvvvzzz.github.io/text2html2png/zh.html) · [Quality and evaluation](https://github.com/GODVvVZzz/text2html2png/blob/main/docs/QUALITY.zh-CN.md)
