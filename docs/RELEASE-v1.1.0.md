Turn technical notes into clear, shareable diagrams, with editable HTML, versioned JSON, and PNG when requested.

- **Public bilingual gallery:** direct HTML previews and downloadable PNG / complete Diagram JSON. [English](https://godvvvzzz.github.io/text2html2png/) · [中文](https://godvvvzzz.github.io/text2html2png/zh.html).
- **Smaller first install:** `node scripts/setup.mjs --theme clean` installs the locked runtime and only clean's three font packages. Add another theme when needed; `--check` diagnoses the environment without installing anything. A full `npm ci` remains available for development.
- **Measured first-use checks:** CI installs an isolated skill copy, adds a second theme, and renders audited HTML and PNG. Installation measurements are scoped to that test and are not user success rates.
- **24 fixed evaluation tasks:** a results recorder keeps unrun tasks and pending reviews explicit. No independent agent success rate or competitive superiority is claimed.
- **Feedback and media:** a first-use issue form, a labelled example presentation, and reusable portrait / landscape assets.
- **Diagram reliability:** shared public rendering for the gallery and JSON downloads, clearer architecture relationship boundaries, and a portable embedded-font CJK orphan test.

Install from GitHub:

```bash
npx skills add GODVvVZzz/text2html2png -g -y
```

Runtime: Node.js 22.12+ and a locally installed Chrome-family browser for layout audits / PNG. No model API key is needed by the renderer; your agent handles natural-language input. The `.skill` asset is a ZIP archive of the portable skill folder, including its lockfile and references. `SHA256SUMS` verifies the download. This release does not publish an npm package.

中文：默认保存 HTML 与 JSON；需要图片时明确说“同时导出 PNG”。新安装可按主题加载字体。欢迎使用自己的任务试用，并在 [首次试用反馈](https://github.com/GODVvVZzz/text2html2png/issues/new?template=trial.yml) 中保留成功或失败的结果。
