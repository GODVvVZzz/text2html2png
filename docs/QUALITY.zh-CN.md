# 如何验证它是否真的好用

本项目区分三种证据：渲染器检查、Agent 端到端评测、真实用户试用。它们不能互相替代。

## 已有的自动化检查

- 仓库 CI 在 Ubuntu、macOS、Windows 上运行安全校验、单元测试与浏览器检查。
- 11 个双语示例由同一公共渲染入口生成；严格审计拒绝裁字、重叠、低对比度和中文短标题孤字。
- 隔离安装测试从不含依赖的技能副本开始：安装 clean、增装 glass、检查原有主题、生成 HTML 与 PNG 并审计。
- 输入回归覆盖工单编号、代码字面量、未知嵌套字段和单节图文；漏斗浏览器回归覆盖五主题、中英文、窄版、10% 转化、极小值和零值，核对实际条宽及可读性。
- 截图回归检查实际 PNG 像素，覆盖居中内容和长图底部；审计失败时验证原有 HTML、PNG 不被替换。
- 安装回归主动构造旧运行时、旧字体和锁定记录不一致的情况，检查诊断、修复及已装主题保留。发布流程先运行同一标签提交的完整 CI，再创建发布包。
- 这些检查不使用语言模型，不能当作自然语言输入的一次成功率。

最新结果以 [GitHub Actions](https://github.com/GODVvVZzz/text2html2png/actions) 为准。

## 首次安装体积测量

[原始测量 JSON](./quality/installation.json)记录了一次 macOS / Node 26 的隔离安装。clean 仅需 IBM Plex Sans、IBM Plex Mono、Noto Sans SC 三个字体包。

| 依赖安装方式 | 文件体积 |
|---|---:|
| 现有全主题安装 | 265,883,041 bytes，约 254 MiB |
| clean 按需安装 | 111,255,995 bytes，约 106 MiB |

同一运行时 lockfile；统计依赖目录中的文件字节，不含浏览器和 npm 缓存。安装时长受缓存与网络影响，不作为速度宣传。其他平台需要独立复测。

当前原始记录来自 2026-09-12 的本地运行。复现安装与升级检查：`node scripts/smoke-install.mjs --out install-smoke.json`。复现输入与浏览器回归：在技能目录执行 `npm run check`。这些是渲染器与安装证据，不是 Agent 端到端实测。

## 24 个固定 Agent 评测任务

[任务与逐条验收标准](../skills/text2html2png/evals/evals.json)覆盖：中文长标题、缺失数据、零值、共享与独占数据存储、条件与回路、稀疏对比、特殊字符、主题切换、窄画布、输出格式边界。

**当前尚无已完成的独立 Agent 评测结果，也没有对竞品的性能或质量胜出结论。**

在技能目录创建记录：

```bash
node scripts/evaluate.mjs --init output/trial.json --system "Agent / model / version / OS / setup"
```

对每个任务使用新的对话，原样提交 prompt。记录从提交到可用产物的总时间、所有重试、人工修改和作者介入；安装时间另记，不能只记录成功的渲染调用。保存输出与对话记录，逐项核对事实和排版。失败保留原因，没跑的任务保持 `not_run`。

填写后生成摘要：

```bash
node scripts/evaluate.mjs --results output/trial.json
```

脚本会校验任务指纹、评审项和必要记录；未跑不会计为成功，未完成评审不会给出一次成功率。摘要只是记录的汇总，不能代替人工核查。

同题比较通用 Agent 直接生成 HTML、Mermaid 工作流或其他技能时，复制一份独立结果表，保持任务、模型、环境、允许时间和人工帮助规则一致。图片匿名后再评价可读性，公开全部失败。不要将手工编写的参考 JSON 当作模型实测产物。

## 真实用户试用

[填写首次试用反馈](https://github.com/GODVvVZzz/text2html2png/issues/new?template=trial.yml)。表单记录安装环境、任务、结果、耗时、修改和实际使用情况。用户可一周后在同一 issue 补充是否复用。

目前没有真实用户成功率。公开评测应注明样本范围、运行环境、失败情况与数据来源；只收录获得授权并经过脱敏的案例。
