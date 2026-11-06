# v0.9 界面重设计 · 实机验证与逐帧对比

| 项 | 值 |
| --- | --- |
| 实现版本 | `0.9.0`（`package.json` / `CHANGELOG.md`） |
| 原型 | `docs/prototype/` 8 帧（Figma 页面「重设计原型 v0.9」） |
| 验证环境 | 独立 `trace-verify` web profile（DSH web + dsh-better-sidebar 0.28.0） + Playwright Chromium |
| 端口 / 尺寸 | 19487；视口 1440×900、设备像素比 2；轨迹面板 dock **400px** |
| 真实会话 | 11 轮 / 763 步 / 747 个 `tool/call`（另有 v0.8 基线 19488） |
| 采集脚本 | `scripts/verify/shoot.mjs`（标准帧）、`scripts/verify/shoot-extra.mjs`（结果/状态/全景） |
| 对比图 | `docs/prototype/compare/*.jpg`（左：原型；右：实机） |

## 1. 复现步骤

```sh
# 构建并跑门禁
pnpm typecheck && pnpm test && pnpm build

# 独立 profile（token 打印在 /tmp/verify/server.log）
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  --profile trace-verify --no-open --port 19487

# 采集
node scripts/verify/shoot.mjs --mode after --port 19487
node scripts/verify/shoot-extra.mjs --port 19487
```

状态帧依赖 Playwright 路由拦截：`**/trace-inspect/api/events**` 延迟 1500ms（骨架）、`abort('failed')`（错误卡）；空会话直接新建会话。

## 2. 逐帧结论

| 原型帧 | 实机截图 | 结论 | 关键差异 / 备注 |
| --- | --- | --- | --- |
| 01 列表总览 | `panel-01-collapsed.png`、`panel-01-top.png`、`panel-01-chips.png` | 结构一致：header（标题/轮数步数/跟随/⋯）→ 搜索 → chips → 会话概览（分布条+legend）→ 三行轮次卡 | 真实会话 11 轮/763 步（原型 7 轮/208 步），mix/`∥N` 数字不同；`有新更新↓` 是 v0.9 新功能，放在状态条内而非原型画面中；chips 只展示前 3 工具 + ⋯（399=399 一屏放下） |
| 02 展开轮次 | `panel-02-header.png`、`panel-02-expanded.png` | 三行卡 + 32px 步骤时间线 + 同级并行组 + 输出行 + 轮次汇总一致 | 真实轮次在工具调用前有一条 assistant 输出（会话顺序），原型无；展开态输入行隐藏（原型 2-02 也没有输入行），靠头部 1 行 preview 表达；并行组缩进实测 **0**，与普通行同列 |
| 03 详情 · 命令 | `panel-03-command.png`（4 段命令）、`panel-03-detail-full.png`、`panel-03-longcmd.png` | 四页签、命令分段 + 语法高亮 + 软换行、参数键值表、输出折叠、footer 完整 | 实机采样命令 4 段/132 字符（原型 4 段/249 字符）；超长 heredoc 默认 12 段 + 「展开全部 196 段」（原型无长命令样本）；`.ttl-detail` 372 宽 |
| 04 详情 · 结果 | `panel-04-result-band.png` | 结果工具条（Markdown/大小/行数/渲染/原文/复制）+ GFM 渲染 + 表格 + 错误块/缩略图沿用 | 宽表仍走 `overflow-x` 横向滚动（既有 Markdown 渲染口径，采样 2px 溢出）；22 行结果带高 2197px，原型是短结果 |
| 05 MCP 调用 | `panel-05-mcp.png` | MCP 徽标 + 已连接 + 参数键值表（类型徽标/数组折叠）+ 输出预览 + footer 一致 | 真实调用 `playwright / browser_run_code_unsafe`（参数为 2200 字符 code），原型示例是 `figma / download_assets`；无 transport 字段故不展示 stdio（不伪造） |
| 06 状态与微交互 | `panel-06-skeleton.png`、`panel-06-empty.png`、`panel-06-error.png` | 骨架屏 / 空会话 / 错误卡三态均按原型实现 | 原型 6-06 是状态设计板，实机是运行时三态；骨架用 1500ms 路由延迟抓拍，错误用 abort 抓拍 |
| 07 放大阅读浮层 | `panel-04-zoomPanel.png` | 双栏（256 大纲 + 宽版阅读）、面包屑/状态 pill/搜索/复制/导出/关闭、四页签、快捷键 footer | 面板内容 1280×800（边框盒 1282×802）；大纲仅当前轮 steps（props 限制）；头部状态 pill 去重（顶栏保留） |
| 08 设计系统 | `src/client/styles.ts` 调色板 | 颜色/字阶/间距/圆角/图标落到 CSS 变量与调色板白名单 | 原型是设计说明板；实现侧冻结 54 色白名单 + `var(--dsw-*)` fallback，测试 `detail-styles.spec.ts` 强校验 |

## 3. 实测 metrics（Playwright，400px dock）

| 指标 | 期望 | 实测 |
| --- | --- | --- |
| dock 宽度 | 400 | **400**（`width:400px; --dsh-sidebar-width:400px`） |
| `.ttl-step` 行高 | 32 | **32** |
| `.ttl-detail` 宽 | 372 | **372** |
| `.ttl-parallel` 缩进 | 0 | **0**（首行与普通行同列） |
| `.ttl-stepIcon svg` | 16×16 | **16×16** |
| `.ttl-locateBtn` 初始 | 隐藏 | **opacity 0** |
| `.ttl-filters` | 不溢出 | **scrollWidth = clientWidth = 399** |
| 命令折叠 | 12 段 + 展开 | **12** 段 / 「展开全部 196 段」/ 展开 196 行「收起」 |
| `.ttl-codeFoot` | 左右分布 | flex + `space-between`（左段/字符，右工具名） |
| `.ttl-zoomPanel` | 1280×800 | 内容 **1280×800**（border-box 1282×802） |
| 状态帧 | 骨架/空/错误 | 三态均命中对应 DOM |

## 4. 已知偏差（均为有意/环境口径）

1. **1px 宿主边框**：dock 400 的面板内容区 399，`.ttl-root` 因此 399 宽；`.ttl-detail` 用 13.5px 左右 margin 精确得到 372。
2. **浮层边框盒**：内容 1280×800，`getBoundingClientRect` 1282×802（1px border）。
3. **Markdown 表格**：沿用 v0.8 渲染口径，宽表横向滚动而非压缩列宽；原型 04 的表格是较短内容。
4. **MCP transport**：模型无连接传输字段，不展示 stdio；连接状态只到「已连接」。
5. **`有新更新↓`**：v0.9 保留的能力，已内联进底部状态条，不覆盖列表内容（elementFromPoint 校验通过）。
6. **字体**：原型用 JetBrains Mono；浏览器按字体栈回退到 SF Mono（等宽观感一致）。
7. **数据驱动差异**：轮数/步数/工具 mix/描述文本来自真实会话，与原型示例不同，但结构、层级、颜色一致。

## 5. 门禁

- `pnpm typecheck` → 0
- `pnpm test` → **516 passed / 21 files**
- `pnpm build` → `lib/index.js` + `lib/client.js`，bundle 契约自检 ok
- 浏览器 console：仅既有静态资源 404（v0.8 基线同样存在），无 JS 报错/裸 DOM

## 6. v0.9.1 视觉修正（实机反馈）

| 反馈 | 修正 | 实测 |
| --- | --- | --- |
| 「并行的条太难看」 | 去掉整行浅底与 2px 粗紫轨 → 1px 发丝轨（rgba(167,139,250,.32)）；组头 20px、`∥ 并行 ×N` 9.5px、隐藏重复 hint；右侧合计 9px muted | `.ttl-parallel` background 透明；`::before` 1px；label 9.5px `#b9a7ee` |
| 「没有专用 icon 的 tool 用通用图标」 | `generic` 从不可见的 6px 圆点改为统一 cube 图标；`step.kind='error'` 行改用红色告警三角 | 未知工具 chip `ttl-tone-generic` + 3-path cube；error 行 `ttl-icon-red` + alert svg |
| 「MCP 成功/失败的图标颜色对比不明显」 | MCP 成功 = 绿色插头（`rgb(52,211,153)` + 绿色底），失败 = 红色（沿用 error tone） | 成功行 `ttl-tone-mcp` 绿色；失败 MCP 行红插头 + 红底 |
| 失败结果行仍显示 ✓（连带发现） | `result.isError` 的 tool 行整行按 error 渲染：`data-step-kind=error`、✗、淡红底、红描述 | status `✗` rgb(242,90,90)、背景 rgba(242,114,111,.08) |

![并行组减重](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v091-parallel.jpg>)

![MCP 绿/红](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v091-mcp.jpg>)

![通用图标与错误图标](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v091-generic.jpg>)

![失败结果行](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v091-mcp-error.jpg>)

## 7. v0.9.2 工具名完整显示

| 反馈 | 修正 | 实测 |
| --- | --- | --- |
| `playwri…` / `open-…` 等长工具名被截断 | 工具名列从固定 52px 改为按可见步骤最长名字自适应（`--ttl-step-name-w`，52–132px）；所有行共享列宽，desc 起点对齐 | 该会话 `--ttl-step-name-w=132px`；`.ttl-stepName` 无溢出；5 条采样 `descX=1213` 一致 |
| 空参数工具显示 `{}` | 解析成功但无字段的工具不再输出 `{}` 描述 | `team_task_create` 等行只显示名字（desc 为审计内容而非 `{}`） |

![工具名完整显示](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v092-names.jpg>)

## 8. v0.9.3 并行表达极简

| 反馈 | 修正 | 实测 |
| --- | --- | --- |
| 「∥ 并行 ×N 这个文案的一行都不要了」 | 并行组不再渲染 head 行；语义移到 group 的 `aria-label`/`title`，轮次头 `∥N` 保留 | `.ttl-parallelHead` / `.ttl-parallelMark` 数量 = 0；`aria-label="并行 ×2"` |
| 「并行的 tool 前面多一个黄色竖线连起来」 | 组左侧 2px 琥珀线（`#f2b45c`，top/bottom 6px，圆角 2px，opacity .8） | 组高 64 → 线高 52px；5 组同屏可辨 |
| 「每行 icon 有灰色竖线穿插，不需要」 | `.ttl-stepRail` `display:none`；普通行无任何竖线 | 221/221 行 rail 不可见；并行/普通 icon x 均 1047，name x 均 1073 |

![并行黄色连接线](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v093-parallel.jpg>)
