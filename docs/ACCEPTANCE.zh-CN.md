# 阶段 1 与阶段 2 验收

## 开始试用

在仓库根目录执行：

```bash
cd skills/text2html2png
npm ci
npm run playground
```

打开终端打印的 `http://127.0.0.1:4318`。服务只监听本机，不上传输入。停止服务使用 Ctrl+C。

首次打开会载入订单事件架构案例。也可以选择发布流程、KPI 看板等案例，点击“载入案例”。修改左侧 JSON 中的标题或说明，点击“更新预览”，再下载 HTML 或导出 PNG。用“下载 JSON”保留完整源文件；替换尚未保留的修改时会提示确认。

HTML 预览使用隔离的 iframe。PNG 导出调用同一 CLI 并执行严格布局审计；失败时显示可操作的错误。预览成功不代表已完成 PNG 审计。此页面不接入语言模型；自然语言到 JSON 由安装了 Skill 的 Agent 完成。

## 阶段 1：成图能力

- 修改标题后文字正确显示，包含中文、英文与美元符号。
- 三个 KPI 不会被补成四个；没有趋势时不会生成趋势数据。
- 对比图可以只提供对照维度和选项。
- 流程图改为 `direction: "vertical"` 后连接顺序保持一致。
- 相同 JSON 在同一安装环境中产生相同 HTML。
- 未提供的事实不会被添加以填满模板。

## 阶段 2：使用体验

- 九类案例均可载入、预览。
- 错误 JSON 有明确报错，可修改后重试。
- 下载的 HTML 可以独立打开，PNG 能直接插入文档。
- HTML 和 PNG 的标题、顺序、内容一致。
- 风格选择与 JSON 的 theme 双向同步；渲染期间禁用输入，避免下载旧结果。
- 下载的 JSON 包含完整版本、图表、主题和尺寸配置，可直接传给公共 CLI。
- 本地试用不要求 API Key 或登录。

## 静态案例页

- `docs/index.html` 与 `docs/zh.html` 提供英文与中文入口。
- 招牌案例并列展示需求和成图，可切换示例、复制提示词或安装命令。
- HTML 可直接预览；HTML、PNG 和完整 Diagram JSON 都能从页面下载。
- 关闭 JavaScript 时仍可查看全部案例与下载文件；剪贴板不可用时提示手动复制。
- 页面只展示已生成案例，自然语言到 JSON 仍由 Agent 完成。

`npm test` 覆盖下载 JSON 与发布 HTML 的逐例一致性、链接可达、示例切换、复制成功与失败、375/760/1280px 宽度及本地试用的状态同步。浏览器测试需要本机 Chrome，PNG 版面验证另由 `npm run check:layout` 完成。

## 命令行与自动化

```bash
npm run render -- --input examples/release-flow.diagram.json --html release.html --png release.png --audit
```

默认拒绝覆盖已有文件。需要覆盖指定输出时添加 `--force`；输入 JSON 不可被当作输出覆盖。

仓库 CI 已配置 Windows、macOS、Linux 的公共 CLI 渲染及预览附件上传。只有推送并实际运行 Actions 后，才能确认远程平台结果；本地通过不等于远程通过。

## 发布前尚需验证

- npm 包仍标记为 private，没有发布到 npm；当前安装渠道是 GitHub Skill。
- 本地试用服务不是公共托管服务，不能直接暴露到互联网。
- 九类输入的完整 JSON Schema、精确架构边连接和所有边界密度尚未全部覆盖。
- 独立 Agent 样例不能替代实际 Codex 与 Claude 两端安装测试。
- GitHub Pages、npm 和 Release 的公开发布尚未执行。

反馈可直接在对话里给出，无需下载评测 JSON。
