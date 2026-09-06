# 阶段 1 与阶段 2 验收

## 开始试用

在仓库根目录执行：

```bash
cd skills/text2html2png
npm ci
npm run playground
```

打开终端打印的 `http://127.0.0.1:4318`。服务只监听本机，不上传输入。停止服务使用 Ctrl+C。

选择发布流程、系统架构或 KPI 看板，点击“载入案例”。修改左侧 JSON 中的标题或说明，点击“更新预览”，再下载 HTML 或导出 PNG。载入其他案例前请先保留自己的修改。

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
- 本地试用不要求 API Key 或登录。

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
