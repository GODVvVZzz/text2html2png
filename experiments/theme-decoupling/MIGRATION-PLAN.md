# 主题解耦迁移计划:comparison → 全部 8 种图表

状态:待审批。本文档只做规划,不动任何代码。
前置:theme-decoupling 实验已完成 comparison 的迁移验证(7 主题 × 48 token 正交、14 张渲染图过严格质检与人工复检)。

## 0. 现状快照

- skill 支持 8 种图表:flowchart、comparison、timeline、architecture、dashboard、gantt、org-chart、funnel;9 个示例已覆盖全部 8 种
- 已迁移:comparison(结构 CSS 只引用 `--t-*`,主题为纯 `:root` token 块,允许受限 `@font-face`)
- 未迁移:flowchart、timeline、architecture、dashboard、gantt、org-chart、funnel
- 校验器:`validate-orthogonality.mjs`(token 集合一致性、结构 CSS 无字面色、DOM 跨主题/跨语言不变、@font-face 白名单描述符 + data: URI)
- CI:仓库根 `theme-orthogonality` job 已独立运行实验校验;skill 包自身脚本零外部路径依赖

## 1. 迁移顺序(按 1w star 目标排序)

排序依据:① README/社交传播中出现频率;② 单图信息密度带来的"截图分享率";③ 与已迁 comparison 的结构复用度(迁移成本)。

| 顺位 | 图表 | 理由 |
|---|---|---|
| 1 | flowchart | 使用频率最高、决策树第一落点;步骤/分支节点可大量复用 comparison 的卡片与 accent 机制 |
| 2 | timeline | 开源项目 README 的传播利器(roadmap 图),与 gantt 共享时间轴骨架,先打样 |
| 3 | dashboard | KPI 卡片截图分享率最高;结构上就是 metrics 区的扩展,成本最低 |
| 4 | gantt | 项目管理刚需;复用 timeline 的时间轴 token 接口 |
| 5 | architecture | 受众广但结构最复杂(节点/边界/连线),放到管线跑顺之后 |
| 6 | org-chart | 结构与 architecture 同族(层级树),架构迁完后近乎免费 |
| 7 | funnel | 受众最窄;结构最简单,留作管线成熟后的收尾 |

原则:每迁一种,必须同时交付——结构 CSS(只引用 `--t-*`)、两份 fixture(中/英同 DOM)、至少一个双语示例、chart-types.md 的样式默认值更新。

## 2. 每种图表的结构拆解要点

现有 48 token 是公共契约,目标是**尽量不新增 token**:颜色全部走 `--t-accent-1..7` + 语义 token,结构差异用结构 CSS 吸收。只有当结构 CSS 出现无法 token 化的硬编码视觉时才加 token(先例:`--t-head-rule-image`)。

- **flowchart**:节点=卡片(复用 surface/border/accent 机制);连线与箭头用 `currentColor` SVG;决策菱形=旋转正方形,border 用 accent。新增 token 预期:0
- **timeline**:轴线=1px `var(--t-rule)`;节点圆点=accent;日期标签=font-data。新增 token 预期:0
- **dashboard**:直接放大版 metrics 网格(grid 列数由 fixture 注入,同 `--compare-count` 模式);趋势箭头走单色 SVG。新增 token 预期:0
- **gantt**:条形填充=accent,color-mix 出浅底;今日线=accent 虚线(token 化样式沿用 `--t-leader-style`)。新增 token 预期:0
- **architecture**:分组边界框=surface-soft;连线上加粗细/虚实由 leader-style 吸收。新增 token 预期:0–1
- **org-chart**:树连接线=rule 色;层级缩进纯结构。新增 token 预期:0
- **funnel**:阶段宽度由数据注入 inline style(需扩 `validateMarkup` 的内联白名单:`--stage-value` 一类数据变量,非主题变量);颜色=accent 阶梯。新增 token 预期:0

每种迁移完成时跑:`build --render --audit` 全矩阵 + 正交性校验,`structureFingerprint` 跨主题一致仍是一票否决项。

## 3. 字体方案生产化(paper 的文楷)

实验阶段的做法:按 fixture 字符从 lxgw-wenkai-webfont 分片挑片 + 二次子集化,17 片约 78KB 内联。生产化必须改成**动态子集**:

1. skill 增加 `subset-font` 依赖(纯 JS,无原生编译)
2. 渲染前读取用户实际文案,按字符动态子集文楷 bold(单个用户图表通常 3–10KB),data: URI 内联
3. 文楷分片文件随 skill 的 node_modules 分发(OFL 协议允许再分发;license 文件一并带上)
4. 兜底字体栈保留 `"LXGW WenKai", "Kaiti SC", STKaiti, cursive`,离线/缺字体时不破版

明确不做:全量字体(19MB)、按 unicode-range 全分片内联(582 片)。

## 4. 示例与画廊重做

- 9 个现有示例全部迁到新管线:每示例输出中英两版,复用同一 DOM(实验已验证的 fixture 模式)
- 画廊只放第一梯队主题:minimal、editorial、dark、neon、warm(修复后)+ paper(文楷版);glass 视最终视觉定
- 每个示例的 meta 补 `theme` 与 `locale` 字段,渲染产物命名 `<name>-<locale>-<theme>.png`
- 示例即画廊素材:挑 3 张做 README 首屏,挑 1 张做 demo 动图分镜

## 5. README 与传播物料(双卖点叙事)

定位句式(已拍板):**头条钩子 = "任何文字变成一张能直接粘贴的图";第二卖点 = "产物是可编辑的 HTML,PNG 按需导出"**。

- README 首屏:一张最终主题渲染图 + 一句话钩子 + 3 行 quickstart
- 素材文案全面过一遍:分享卡、demo 动图、画廊页、README.zh-CN,凡"HTML 优先"表述统一为双卖点句式
- demo 动图脚本:一段中文会议纪要 → HTML → 换两次主题(展示 restyle 即时换皮)→ 导出 PNG 粘贴,15 秒内讲完
- 对标物料的差异化一句:carbon/ray.so 做代码截图,我们做"任意结构化文字"的图表卡

## 6. 首发 checklist(冲 star 的物料门槛)

- [ ] 8 种图表全迁移,正交性校验与 14+ 张渲染图全绿
- [ ] README 中英双语,首屏 3 秒可懂
- [ ] demo GIF ≤ 15s、≤ 4MB
- [ ] 画廊 5–7 张精选图,无丑图(丑图不上橱窗)
- [ ] npm 首发前跑打包模拟:`npm pack` 后 `npm run check` 必须通过(已有回归测试)
- [ ] LICENSE + 字体 OFL 归档
- [ ] GitHub Topics:markdown-to-image、chart、diagram、agent-skill、html-to-png

## 7. 明确不做的事

- 不在迁移中途改产品默认行为(HTML 优先 + PNG 按需已拍板,双卖点叙事,不再动)
- 不为迁移新增主题(token 集合冻结在 48,主题返工单独排期)
- dark 的"通用深色模板"观感问题不在本轮修——它需要重新设计而不是调 token,单独立项
- 不做在线服务/云端渲染,首发只推本地 CLI + skill
