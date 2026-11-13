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

## 9. v0.9.4 展开态左右留白

| 反馈 | 修正 | 实测 |
| --- | --- | --- |
| 「展开看轨迹，两边太紧贴边缘」 | `.ttl-turn .ttl-step` 内边距 6/14 → **14/22px**；黄线 left 10px；输出行右 20px；`显示更早` 18px | icon x=1055（+8）；耗时右缘距 root 22px（6 行一致）；desc 可用 139px；无横向滚动 |

![展开态留白](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v094-padding.jpg>)

## 10. v0.9.5 模型文本输出改版

| 问题 | 方案 | 实测 |
| --- | --- | --- |
| 输出复用工具行（绿点 + 「输出」+ 原文），与步骤行栅格/语气都不搭，且直接显示 `**bold**` 原文 | 改为引用块：2px 绿色竖条 + 淡底 + 顶部角色标签；正文 12.5px/19、内联加粗/code、3 行截断 + 展开全文；展开后完整 Markdown | `.ttl-msg` 块、`ttl-msgStrong`/`ttl-msgCode` 渲染正常；↗ 仅 hover；展开/收起可用 |

![输出引用块](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v095-output.jpg>)

![展开后的完整 Markdown](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v095-output-open.jpg>)

> v0.9.6 修正：展开后的 Markdown 此前继承旧输出行 `padding-left:64px`（宽度 269），现 `.ttl-msg .ttl-output-body { padding:0 }`，与折叠正文左缘对齐、宽度恢复 ≈347（实机 1069/347）。折叠态的内联 Markdown 也支持「粗体内嵌 code」：`**改名为 \`dsh-trace-inspect\`**` 会渲染为加粗 + code chip，反引号不再外露。

![粗体内嵌 code](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v095-output-code.jpg>)

## 11. v0.9.7 静音与配色

| 反馈 | 修正 | 实测 |
| --- | --- | --- |
| 图1 箭头符号不要了 | `.ttl-stepJump` / `.ttl-locateBtn` / `.ttl-msgJump` / `.ttl-itemJump` 全部 `display:none`（DOM 保留）；chevron 保留 | computed display=none；chevron 11/11 可见 |
| edit 与 MCP 颜色重复 | edit/write 改琥珀 `#f2b45c`，MCP 保持绿 `#34d399`，todo 改灰；mix/详情/legend/分布条同步 | edit rgb(242,180,92)、mcp rgb(52,211,153)、todo rgb(155,161,167) |
| 并行次数 `∥N` 不需要 | 轮次头 `.ttl-badgeParallel` 隐藏；错误徽标保留 | `∥N` display none，`✗1` 仍显示 |

![静音后的列表](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v097-quiet.jpg>)

![概览图例与分布条跟随新配色](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v097-legend.jpg>)

## 12. v0.9.8 通用工具图标改为扳手

| 反馈 | 修正 | 实测 |
| --- | --- | --- |
| 通用工具 icon 用「类似 🔧 的同风格图标」 | `generic` 由方块改为 Lucide **wrench**（1 path、stroke 1.7、currentColor），与 terminal/file/search/mcp 同一线性语言；错误行仍用红色告警三角 | 未知工具行 SVG `d=M14.7 6.3…`，chip 灰 `#9ba1a7`；error 行 `M10.29 3.86…` 未变 |

![通用工具改用扳手](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v098-wrench.jpg>)

## 13. v0.9.9 通用工具图标配色

| 反馈 | 修正 | 实测 |
| --- | --- | --- |
| 通用扳手不要灰色 | 通用工具色改**粉色 `#f472b6`**，与 bash 紫 / read 蓝 / edit 琥珀 / MCP 绿 / error 红区分；图例「其他」与分布条同步 | chip color rgb(244,114,182)、bg rgba(244,114,182,.14)；legend/dist 同色；其它族未变 |

![通用工具粉色扳手](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v099-wrench-color.jpg>)

## 14. v0.10.0 工具输出自动格式化

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 输出大多 JSON/Markdown，希望先格式化 JSON，再 Markdown，最后原文 | 新增 output-format.ts：整段 JSON → JSONL（逐行都 JSON）→ Markdown（既有结构检测）→ 原文；摘要预览先 pretty 再 3 行折叠，结果 tab JSON 用 JsonPretty、Markdown 用 MarkdownResult、其余 RawText | mock {"previousStatus":"running"}：摘要 3 行缩进；结果 tab JSON · 28 B · 1 行、JsonPretty 单冒号、渲染/原文可切；普通文本仍 RawText |
| 防止误判 | 只有整段能 parse 才算 JSON；JSONL 要求每一行都能 parse；ANSI 日志/diff/混合文本一律原文 | 混合日志 → text；diff → text；Markdown → rendered |
| 默认显示 | 检测到 JSON/Markdown 的结果默认 rendered（bash 也生效），显式切「原文」仍可 | renderPressed=true 初始；切原文后 JsonPretty=0、RawText=1 |

![摘要：JSON 缩进预览](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0100-json-summary.jpg>)

![结果：JsonPretty + 渲染/原文分段](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0100-json-result.jpg>)

![切到原文](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0100-json-raw.jpg>)

## 15. v0.10.1 修复 tab 切换崩溃（React #300）

| 问题 | 根因 | 修复 |
| --- | --- | --- |
| 切到其他侧栏 tab 再切回「轮次轨迹」时报 `dsh-better-sidebar: Minified React error #300`（Rendered fewer hooks than expected） | v0.9.2 新增的 `stepNameWidth` `React.useMemo` 放在 `if (!visible) return null` **之后**；`visible=false` 时该 hook 被跳过，hooks 数量变化触发 React #300 | 把 `stepNameWidth` 移到 early return 之前，hooks 顺序恒定；新增回归测试「隐藏 → 显示」 |

### 实机复验（19487 / 0.10.1）

- 真实会话：打开轨迹 tab → 新增「文件」tab → 文件 ↔ 轮次轨迹切换 **3 轮**；每次切回都正常渲染 11 轮，`windowErrors=0`、`pageErrors=0`、`react300Seen=false`。
- 交互：展开轮次 → 打开步骤 → 四页签切换 → 打开/关闭浮层 → 再切 tab 两次：无报错。
- mock JSON 会话：打开步骤 → 结果 tab → 浮层 → 切换 tab 3 轮：无报错。
- console 仅既有静态资源 404。

![切换 tab 后正常](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0101-hookfix.jpg>)

## 16. v0.10.2 步骤行图标底色与竖线对齐原型 2-02

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 1. 当前 ICON 每个工具族各一个底色，设计稿里是统一颜色（只有报错是红底） | 删除 `.ttl-stepIcon.ttl-tone-{shell,read,edit,mcp,todo,generic}` 的底色覆盖；`.ttl-stepIcon` 统一用 `var(--dsw-alias-bg-layer-2)`（深色主题 `#2c2c2e`），字形仍走族色。报错 chip 保留红底但改为不透明 `color-mix(...)`，防止竖线透出 | `.ttl-stepIcon` 计算值 `rgb(44,44,46)`，与原型 2-02 chip `rgb(44,44,47)` 一致；bash/read/edit/MCP/通用 全部同底色；error chip `color(srgb 0.267137 0.171765 0.175059)` |
| 1（续）. 报错改用设计稿的 ICON | `StepRow` 的 `iconKind` 判断改为 `errored`：wire `error` 行和 `result.isError` 的工具行都显示警示三角，不再显示被染红的家族图标（终端 `/` 文件 / 扳手） | 用例：`result.isError` 的 bash 行渲染 `M10.29 3.86`（alert triangle）且无 terminal `<polyline>`；实机失败行截图三角 + 红 chip |
| 2. 保留「ICON 与 ICON 之间竖着的那条线」 | 撤销 v0.9.3 的 `.ttl-stepRail { display:none }`；1px `rgba(255,255,255,.08)`、`left:23px`（= 14px 内边距 + 18px chip 中心）；chip 不透明 → 线只在 chip 上下 7px 空隙可见；并行组内同样显示（琥珀分组竖线保留） | `.ttl-stepRail` 计算值 `1×32 @ x=1064`（行 x=1041 → +23）、全部行 `display:block`；空隙像素 `rgb(52,52,53)`，原型 2-02 `rgb(52,52,52)`；dock 400、行高 32、chip 18×18 不变 |

- 覆盖声明：并行批次的「归属」仍由琥珀色分组竖线（`.ttl-parallel::before`）表达，灰线只负责连接相邻 chip；error 行整行红晕（`rgba(242,114,111,.08)`）是 v0.9 既有口径，本版未改。
- 门禁：`pnpm typecheck` 0；`pnpm test` **527 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-iconrail.mjs`（普通行 / 失败行 / 并行组三段 + `iconrail-metrics.json`）。

![原型 2-02 vs 实机：中性 chip + chip 间灰线 + 红色三角报错](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/prototype/compare/02b-icon-rail.jpg>)

![实机失败行：红 chip 三角 + 中性 chip + 竖线](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0102-icon-rail.jpg>)

![并行组：琥珀分组竖线 + 组内灰线](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0102-parallel.jpg>)

![展开轮次全景：统一 chip + chip 间竖线](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0102-expanded.jpg>)

## 17. v0.10.3 输出消息改为单行行式

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 「输出」要跟上面工具行一样一行一行；点开才展示全文；icon 旁的文本 = 前 n 个字符 + 还有多少字符 | 输出行重写为 `.ttl-msgRow`：32px 行高、`padding: 0 22px 0 14px`、8px gap，与 `.ttl-step` 同栅格；18px 中性 chip + 消息绿字形 + 「输出」+ 前 32 字预览（压平换行、去 Markdown 标记、截断补 `…`）+「还有 N 字符」+ chevron；点击/键盘展开 `.ttl-msgBody` 完整 Markdown（无结构则原文换行）。短消息（≤32 字且单行）无 chevron / 字符数、点击不动作 | 行 `399×32`；chip `18×18 @ x=1055`（与工具行同列）；预览宽 `194`；meta `还有 558 字符`（千分位）；chevron `12`；展开后 body `399×398` 渲染完整 Markdown；短消息用例无 `ttl-output-rest` |
| 旧实现的取舍 | 删除引用块（绿竖条 + 淡底 + 3 行截断 + 内联 Markdown 预览）；展开体只在打开时挂载 | `ttl-item-output` / `ttl-output-body` / `ttl-output-jump` testid 与既有用例不变；本版覆盖 §13 的输出行口径 |

- v0.10.4 修正：v0.10.3 为多留预览宽度把「输出」角色列压到 40px，导致消息正文比工具描述左移约 92px；已恢复为 `var(--ttl-step-name-w, 52px)`。实测 `.ttl-stepDesc` x=**1221**、输出预览 x=**1221**（严格同列）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **529 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-outputrow.mjs`（折叠 / 展开两帧 + `outputrow-metrics.json`）。
- 已知偏差：预览固定 32 字，中英混排时视觉上约 13–16 个字符；「还有 N 字符」按原文长度计算（含换行 / Markdown 标记），不是可见字符数。

![输出行：单行（前 32 字 + 还有 558 字符）](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0103-output-collapsed.jpg>)

![v0.10.4：输出正文与工具描述同列](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0104-output-aligned.jpg>)

![点开：完整 Markdown 全文](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0103-output-open.jpg>)

## 18. v0.10.5 输入行统一样式

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 展开轮次里的用户输入是一整行大字、没有图标，跟上下行不统一 | 输入改为展开体的第一行，与工具/输出同一 32px 栅格：中性 chip + 蓝色用户字形 + 「输入」+ 前 32 字预览 + 「还有 N 字符」；点击保持 v0.4 起的「定位回对话」；展开态不再重复渲染头部 preview（折叠卡仍是原 2 行 preview，工具筛选 / 搜索时退回头部 preview） | 行 `399×32`、chip `18×18 @ x=1055`、preview x=**1221** = `.ttl-stepDesc` x、预览宽 `128`、meta `还有 82 字符`；长输入用例如期出现 char budget；过滤时 `ttl-item-input` 不再渲染 |
| 与上一版行式的复用 | 输入行复用 `.ttl-msgRow` / `.ttl-msgRole` / `.ttl-msgPreview` / `.ttl-msgRest`（与输出行同栅格），glyph 用蓝色区分「用户 vs 助手」 | 输入行无 chevron（点击=定位，不是展开） |

- 门禁：`pnpm typecheck` 0；`pnpm test` **530 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-outputrow.mjs`（新增 `panel-inputrow.png` 与 `inputRow` 度量）。
- 已知偏差：输入行预览同样固定 32 字；点击是跳回对话（不在此面板展开全文），与工具/输出的展开语义不同。

![输入行：与工具行同栅格、正文同列](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0105-input-row.jpg>)

## 19. v0.10.6 `skill` 调用单独成族

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 加载 skill 的图标不要用通用的 🔧，辨识度要特别一点；后面的描述不要 `name`，只留 skill 名称 | `ToolIconKind` / `ToolFamily` 新增 `skill`：sparkle（Lucide sparkles 四角星）字形 + 青色 `#63c9d1`；`summarizeToolCall('skill')` 取 `args.name`（兼容 `args.skill`）作为 detail，不再走通用 `key value` 回退；概览分布 / legend 增加 skill 段 | 行 label `skill`、desc `figma-workbench` / `ui-ux-pro-max`（无 `name ` 前缀）；字形 ink `rgb(99,201,209)`；legend `bash 1 · skill 2`；chip 仍为统一中性底 |

- 覆盖范围：步骤行、turn 头部 mix、详情 / 浮层图标、概览分布与 legend 都走同一 `toolFamily('skill')`；筛选 chips 仍按工具名（`skill`）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **532 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-skillrow.mjs`（路由 mock 一段含 2 个 skill 调用的最小会话 + 截图 / 度量）。
- 已知偏差：mock 会话（真实 trace-verify 历史里没有 `skill` 调用），字形 / 颜色与真实插件渲染一致。

![skill 行：青色四角星 + 仅 skill 名称](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0106-skill-row.jpg>)

## 20. v0.10.7 命令连接符移到上一行行尾

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 分段命令里 `&&` / `;` 落在下一行行首，每行起始参差不齐 | 连接符由「下一行的 leading op」改为「上一行的 trailing op」：渲染层把 `shown[i+1].connector` 追加到当前行末尾，前面用 NBSP 粘住最后一个词（软换行时不会单独掉行）；内联详情带与 1280 浮层共用同一规则；`splitCommand` 数据模型不变（连接符仍挂在它引入的段上） | 4 段命令渲染为 `cd … &&` / `pnpm install … &&` / `echo … &&` / `pnpm build …`；行首不再出现 `&&` / `;`；新增回归断言行文本与 2 个 trailing connector |

- 门禁：`pnpm typecheck` 0；`pnpm test` **533 例 / 22 文件**；`pnpm build` 通过。
- 采集：`scripts/verify/shoot.mjs --mode after`（`panel-03-command.png` / `panel-03-detail.png`）。
- 已知偏差：软换行仍可能把一行折成多视觉行（命令本来就很长），但折行末尾的连接符不会单独成行。

![命令：连接符在上一行行尾](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0107-command-tail.jpg>)

## 21. v0.10.8 展开轮次体 tree 缩进

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 展开后输入 / 步骤 / 输出与轮次标题同列，看不出这些内容属于该轮 | 对展开态的 `.ttl-turnBody` 加 `padding-left: 14px`：输入行、步骤行、消息行、并行组、详情带、轮次脚注整体右移；轮次标题保持原位，形成「#N 是父、body 是子」的 tree 结构。折叠卡不受影响 | `rowIndentVsHead = 14`、`iconIndentVsTag = 14`；dock 400 下详情带 `399-14-27 = 358` 宽（v0.9 契约的 372 是未缩进时代的数值，本版更新） |

- 覆盖：`.ttl-step`、`.ttl-msgRow`、`.ttl-itemInput`、`.ttl-parallel`、`.ttl-showEarlier`、`.ttl-turnFoot`、`.ttl-detail` 都在 `ttl-turnBody` 内，因此一起缩进；`.ttl-turnHead` / `.ttl-turnPreview` 不在 body 内，保持标题列。
- 门禁：`pnpm typecheck` 0；`pnpm test` **534 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-treeindent.mjs`（展开态 / 打开详情带两帧 + 缩进度量）。
- 已知偏差：详情带宽度从 372 变成 358（缩进 14 + 原有 13.5 margin），内容布局与换行逻辑不变。

![展开轮次：body 缩进 14px，形成 tree 层级](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0108-tree-indent.jpg>)

![打开详情带：band 随 body 缩进](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0108-tree-band.jpg>)

## 22. v0.10.9 轮次头部 mix 固定包含 skill

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 折叠轮次卡头部的工具族统计里看不到 skill 数量 | mix 原来只取数量 Top 4；`skill` 是「加载能力」的语义事件，数量少容易被挤掉。现在若存在 skill 则固定占一席（其余取 Top 3），总项数仍为 4 | mock 轮次（bash 2 / read 2 / edit 2 / custom 1 / skill 1）修复后 mix = `bash 2 · read 2 · edit 2 · skill 1`；修复前第 4 项是通用扳手 |
| 不破坏宽度 | 仍为 4 项，不增加头部宽度 | `.ttl-mixItem` 数量 = 4；轮次卡宽度不变 |

- 覆盖：仅折叠卡显示 mix（展开态 CSS 隐藏），展开态的轮次脚注/概览 legend 仍含 skill（v0.10.6）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **535 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-turnmix.mjs`（mock 两个轮次，截取折叠 `#1` 卡 + mix 度量）。
- 已知偏差：mock 会话（真实 trace-verify 历史里没有 skill 调用），组件渲染路径与真实插件一致。

![轮次头部 mix：skill 固定出现](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0109-turn-mix.jpg>)

## 23. v0.10.10 灰色 / 通用扳手工具归族（figma、todo）

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 有些 tool 有颜色、有些是灰色，怀疑是 bug，且影响每轮工具统计 | 两类问题修掉：① `todo_write` / `todo_read` 是「todo 族 + 灰色 `#9ba1a7` + 通用扳手」；现改为薄荷绿 `#8fdcb8` + 清单图标，`todo_write` 详情 = `N 项`。② `figma_*`（插件原生工具，非 `mcp__figma__`）落在 generic 族的扳手上；现单独成族：淡紫 `#c4b2ff` + layers 图标，详情优先展示 `documentId` / `fileKey` / `nodeId` | figma_reconnect = layers 淡紫；todo_write = 清单薄荷 + `2 项`；custom_tool = 粉色扳手（仍是 generic，但有色）；bash/read/edit/skill/mcp 不变 |
| 统计口径 | `toolFamily` / 概览分布 / legend / 轮次 mix 全部走同一映射，figma 与 todo 各自成段 | mock 会话 legend：`bash 3 · read 3 · edit 2 · figma 1 · skill 1 · todo 1 · 其他 2` |

- 覆盖：步骤行 glyph/ink、轮次头部 mix、详情 / 浮层图标都走 `summary.icon` + `ttl-tone-*`，一处改动全链路生效。
- 门禁：`pnpm typecheck` 0；`pnpm test` **539 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-turnmix.mjs`（mock 两个轮次，第二帧截取 figma/todo/generic/read 行）。
- 已知偏差：mock 会话；`figma_*` 为插件工具而非 MCP，归入独立 `figma` 族（MCP figma 仍按 `mcp__figma__` 归 mcp）。

![工具族：figma 淡紫 layers、todo 薄荷清单、generic 粉色扳手](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0110-tool-families.jpg>)

## 24. v0.10.11 输出预览默认 20 行

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| bash 输出默认只展示 3–4 行太少，起码 20 行 | `OUT_PREVIEW_LINES` 3 → **20**：摘要页签的「输出」折叠预览渲染前 20 行，超过 20 行仍提供「展开全文」；1280 浮层的输出预览同步 20 行 | mock 55 行输出：折叠态 `.ttl-outLine` = **20**（`line 20` 为最后一行、`line 21` 不渲染），点「展开全文」= **55** 行；`展开全文 / 收起` 状态与 meta `1.4 KB · 55 行` 正常 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **540 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-output-lines.mjs`（mock 55 行 bash 输出，折叠 / 展开两帧）。
- 已知偏差：mock 会话；真实长输出同样按 20 行折叠。
- 影响范围：仅预览行数；JSON 结果仍先 pretty-print 再折叠，`展开全文` 行为不变。

![输出预览：默认 20 行](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0111-output-20lines.jpg>)

## 25. v0.10.12 展开的输出改为卡片

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 图1 输出点开后是裸露纯文本，图2 的详情带是卡片样式 | `.ttl-msgBody` 从裸文本 `padding: 6px 22px 10px 14px` 改为与 `.ttl-detail` 同款卡片：`margin: 4px 13.5px 10px`、`padding: 12px`、`border-radius: 8px`、1px 边框、`color-mix(bg-layer-1 86%, #000)` 深色 surface | 展开体 `358×412`、`padding: 12px`、左缘 1069 = 行左 1055 + 13.5；与详情带（358 宽、27.5 内缩）完全同宽同位置；折叠行不变 |
| 影响 | 只改展开态容器，正文仍是 Markdown / 原文渲染；短输出（无 chevron）不展开，保持单行 | 输出行 `399×32` 不变；`还有 558 字符` + chevron 行为不变 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **541 例 / 22 文件**；`pnpm build` 通过。
- 采集：重跑 `scripts/verify/shoot-outputrow.mjs`（折叠 / 展开两帧 + 几何度量）。
- 已知偏差：卡片与行之间保留 4px 间距，与详情带的「行 → 带」间距一致。

![输出展开：卡片式正文](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0112-output-card.jpg>)

## 26. v0.10.13 修复 MCP 摘要「假文件行」

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 摘要的「结果」出现 1 个文件、文件名只有一个 `"` | 根因：文件列表启发式把带转义引号的 JSON 结果（`{"err":"… Property \"width\" failed …"}`）按行 token 化，token `\"` 里的反斜杠被当成路径分隔符 → `fileBaseName('\"')` = `"`。修复：① 结果以 `{` 开头（JSON 对象）直接不走文件列表；② 含 `" ' { } [ ] , ;` 的 token 不算路径；③ 反斜杠只接受 `C:\` / `\\server` 形式 | mock `mcp__figma__use_figma` + 同款 resize 错误 JSON：`ttl-files = 0`，摘要改回正常「输出」预览（`177 B · 14 行`，pretty JSON） |
| 别误伤真实文件列表 | 只收紧 token 判定；数组 / 行式路径列表逻辑不变 | `/tmp/assets/01.png 74 KB` 两行 → 仍渲染 2 个文件行（新增用例覆盖） |

- 门禁：`pnpm typecheck` 0；`pnpm test` **543 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-filesfix.mjs`（mock 同款 figma 结果，截图摘要 + `ttl-files` 计数）。
- 已知偏差：mock 会话；真实 figma use_figma 结果形状与此一致（seq #210/#211）。

![MCP 摘要：恢复为正常输出预览，不再有假文件行](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0113-mcp-files-fix.jpg>)

## 27. v0.10.14 skill 图标改为「打开的书」

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| skill 的四角星换成图2那种「打开一本书」的 icon | `ToolIcon` 的 `skill` 字形从 sparkle 换成 Lucide book-open（书页 + `M12 7v14` 书脊），青色 `#63c9d1` 家族色不变；行、图例、mix 共用同字形 | skill 行 glyph 含 `M12 7v14`；书本 ink `rgb(99,201,209)`；label `skill`、desc `figma-workbench` / `ui-ux-pro-max` 不变 |

- 覆盖：步骤行、轮次 mix、图例、详情 / 浮层图标都复用 `ToolIcon`，一处改动全链路生效。
- 门禁：`pnpm typecheck` 0；`pnpm test` **543 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-skillrow.mjs`（mock 两个 skill 调用）。
- 已知偏差：mock 会话；字形与 DSH 题目图标一致（非同一 SVG 源）。

![skill 行：打开的书图标](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0114-skill-book.jpg>)

## 28. v0.10.15 展开的长值不再内部滚动

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 很长的参数值点「展开」后仍要在小滚动框里滚才能看完 | `.ttl-jpRestored` 去掉 `max-height: 240px` 与 `overflow: auto`：展开即把整段文本一次渲染，滚动交给详情带 / 浮层本身；`收起 / 复制 / ⤢` 行为不变 | mock `mcp__figma__use_figma` 的 84 行 `code`：展开块 `359×1352`、`max-height: none`、`overflow: visible`、`scrollHeight == clientHeight = 1352` → **无内部滚动**；文本 1,491 字符 / 84 行全部在 DOM 里 |
| 覆盖范围 | 浮层与内联详情带的「参数 / 结果」long-value 共用 `JsonPretty` | 同一 CSS 改动两处生效；`ttl-strbox`（JSON 树短滚动盒）不受影响 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **544 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-longvalue.mjs`（打开浮层 → 参数 tab → 展开 long value → 量 scrollHeight/clientHeight）。
- 已知偏差：mock 会话；真实 4k 字符参数同样一次渲染，面板高度由内容撑开。

![展开的长值：全部渲染、无内部滚动](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0115-longvalue.jpg>)

## 29. v0.10.16 失败统计改用告警图标

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 图1 轮次头部的报错统计（`✗5`）应该用图2 里统一的失败图标 | 折叠卡头部徽标由文本 `✗{n}` 改为 `ToolIcon kind="alert"`（警示三角）+ 数字；红色 chip、title 语义不变；与失败行、原型 2-02 / 6-06 的失败图标一致 | mock 轮次（1 个失败步骤）：头部显示红色 chip「⚠ 1」；`.ttl-badgeErr` 内 path 含 `M10.29 3.86`；文本不再包含 `✗` |
| 不影响其他计数 | 只换图形；数字保留在 `ttl-error-count`，`ttl-error-dot` testid 不变 | mix（shell/read/edit/skill）+ 失败徽标 + `9 步` 同行布局不变 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **544 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-turnmix.mjs`（mock 轮次新增 1 个 `FsError` 步骤，截取折叠卡头部）。
- 已知偏差：mock 会话；真实失败轮次的徽标同样只显示三角 + 数量。

![轮次头部：失败统计 = 警示三角 + 数字](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0116-error-badge.jpg>)

## 30. v0.10.19 工具图标改为「每个工作簇一个图标」

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| dsh 内置的 tool，每一类工作的簇都给一个特殊的 ICON | 簇表按 DSH 工具包（`@deepseek-ai/dsh-tool-*` 的 `defineTool` 名）与官方 `dsh-client-ui-tool` 的 `detailIcon` 分组重写：22 个内置簇各一个字形（A 执行：命令执行 / 长驻终端 / 后台作业 / 代码执行；B 文件：读取 / 写入 / 编辑 / 检索 / 联网；C 计划：清单 / 目标 / 定时；D 交互：询问 / 交付；E 协作：子代理 / 团队 / 团队任务板 / 工作流；F 上下文：技能 / 会话回溯 / 工作区 / 运行时插件），MCP 保持插头 | mock 19 个工具的会话：行墨色依次为执行 `rgb(167,139,250)`、读取类 `rgb(96,165,250)`、变更类 `rgb(52,211,153)`、计划类 `rgb(242,180,92)`、协作类 `rgb(240,143,184)`、上下文类 `rgb(99,201,209)`、MCP 粉、兜底灰，与 Figma ④ 方案逐行一致 |
| 非 dsh 内置 tool、非 MCP 的 tool 用统一 🔧 | `figma_*` 从 v0.10.10 的 layers 特例回退成 `generic` 扳手（与第三方 / 未知工具同一条路径），行详情仍保留 `documentId` / `fileKey` | `figma_status`、`acme_deploy` 都是 `ttl-ink-gray` + 扳手路径 `M14.7 6.3` |
| 图标颜色怎么给 | 新增 `.ttl-ink-violet\|blue\|green\|amber\|pink\|teal\|gray\|red`；统计族色 `.ttl-tone-*` 只留给轮次 mix / 分布条 / 图例；青色复用既有 `#63c9d1`，不新增调色板 hex | 行、详情带头、浮层大纲/头部同一条 ink 链路；0 条 console error |

- 覆盖：`ToolIcon` 25 个字形；`ToolSummary.icon` 类型扩展；`toolIconKind()` 新增 `terminal_` / `job_` / `schedule_` / `session_` / `team_task_` / `cordis_` 前缀与 `*_goal` 后缀规则，以及 `shell` / `ls` / `append` / `search` / `todo_read` / `bash_output` 历史别名。
- 门禁：`pnpm typecheck` 0；`pnpm test` **555 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-clusters.mjs`（mock 19 个工具的会话，逐行量 ink 色 / ink 类 / 字形 primitive）。
- 设计稿：Figma 文件 `trace` · 页面「重设计原型 v0.9」· ④「工具图标系统」（x=1400 / y=2236，含 22 内置簇 + MCP + 兜底与 13px 真实尺寸预览）。
- 已知偏差：mock 会话（真实会话里低频簇很少同时出现）；字形沿用 Lucide 几何，与 Figma 稿逐条对应。

![每个工作簇一个图标：19 行字形与墨色](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0119-tool-clusters.jpg>)

## 31. v0.10.20 轮次头部统计条：墨色对齐行图标 + 数字居中

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 这个统计 icon 要跟刚才改的（v0.10.19 工作簇图标）一致 | mix chip、会话分布条、图例 dot 全部改用 `.ttl-ink-*` 簇墨色，字形仍取族的代表簇（terminal / 铅笔 / 插头 / 开卷 / 扳手）；`.ttl-tone-*` 旧族色只保留在 CSS 做兼容 | chips = `ttl-ink-violet` 3 / `ttl-ink-green` 2 / `ttl-ink-pink` 2 / `ttl-ink-teal` 1；图例 dot 依次 violet / blue / green / pink / teal，与行图标同色 |
| icon 和数字要居中对齐，现在是上对齐 | `.ttl-turnMeta` 显式 `line-height: 13px`（图标 13px 高），让 9.5px 计数落在图标墨迹中心；badge / pill 保持自己的 16px 行高 | 2× 截图像素量测：图标墨迹中心 23.0、数字墨迹中心 23.0；修复前同位置数字 24.5 vs 图标 26.5（约 1px 偏高） |

- 覆盖：轮次头部 mix（含 skill 固定槽）、会话概览分布条 + 图例、`N 步`；展开态隐藏 mix 的规则未动。
- 门禁：`pnpm typecheck` 0；`pnpm test` **557 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-mix.mjs`（mock 一轮 3×bash + 2×edit + 2×MCP + 1×read + 1×skill，量 chip 类名 / 计算色 / 行高）。
- 已知偏差：mock 会话；时间线上低频族的统计仍按「工具族」聚合（本次只改图标与配色，不把统计口径切成 22 簇）。

![轮次头部统计条：簇墨色 + 数字居中](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0120-mix.jpg>)

![会话概览：分布条与图例同一套簇墨色](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0120-summary.jpg>)

## 32. v0.10.21 折叠卡整卡可点（时间行 + 输入预览）

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 鼠标移到文本地方无法打开轨迹内容，只能点时间行；期望点时间行或文本行都能打开 | `section.ttl-turn` 在折叠态挂一个整卡 click handler：命中 `button / a / input / textarea / select` 时让内层控件自己处理，选区非空（拖选复制）时不展开；展开态不挂该 handler，步进行内的点击不会把轮次折回去。同时 `.ttl-turn[data-collapsed="true"] { cursor: pointer }`、预览悬停提亮 | 折叠卡：`data-collapsed=true`、预览 `cursor: pointer`、`ttl-step` 0 条 → **点击预览行** → `data-collapsed=false`、DOM 出现 3 条步骤；点展开体内的脚注仍保持展开 |
| 键盘 / 内层按钮不受影响 | `ttl-turnToggle` 仍是真正的 button；行尾 `↗` 定位是 button，整卡 handler 会跳过 | 点击 `↗`、步进行、脚注均不触发折叠（回归用例覆盖） |

- 覆盖：所有折叠轮次卡；展开态行为、筛选态（预览作为过滤提示出现时）都不变。
- 门禁：`pnpm typecheck` 0；`pnpm test` **561 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-cardclick.mjs`（两轮 mock 会话：折叠 → 截图 → 点预览展开 → 截图 → 点脚注验证不折叠）。
- 已知偏差：mock 会话；真实会话里卡片高度随预览行数变化，点击热区同样覆盖整卡。

![折叠卡：预览行是点击目标](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0121-card-collapsed.jpg>)

![点击预览行后：就地展开输入行 + 3 条步骤](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0121-card-expanded.jpg>)

## 33. v0.10.22 折叠统计按工作簇计数（可与展开行 1:1 对账）

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 折叠统计的 icon 和数量，跟实际打开的不一致；期望 icon 和对应数量在展开内容里数得一模一样 | 统计口径由「工具族」改为**工作簇**（`toolIconKind`，与行图标同一字形/墨色），计数取自展开体真正渲染的步骤集合（含筛选/搜索），失败步不算进簇——它们统一画告警三角、由红色失败徽标计数；取消 4 个 chip 上限与 skill 固定槽，出现的簇全展示，窄面板自动换行 | 真实 47 步轮次（bash 21 / wait_agent 9 / list_agents 4 / team_task_create 4 / spawn_teammate 4 / team_task_list 3 / todo_write 2）：chips `terminal 21 · team 17 · team-task 7 · todo 2`（和 47），展开后逐 chip `21/21 · 17/17 · 7/7 · 2/2` |
| 失败徽标与行内呈现也要一致 | 失败计数改为「画告警三角的行」：`step.kind === 'error'` 或 `result.isError === true`（此前只数 wire error，`isError` 结果行看着失败却不进徽标） | 8 簇 57 步行：chip 合计 57 == 展开行数；`isError` 单测：6 健康步 → 6 chip，告警 1 行 == 徽标 1，`chipTotal + alertRows == 全部行数` |

- 覆盖：折叠头 chips（含筛选/搜索态随可见步骤收缩）、失败徽标、脚注 `N failed`、`data-error` 卡背景不变。
- 门禁：`pnpm typecheck` 0；`pnpm test` **562 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-mix-exact.mjs --mode real|wrap`（逐 chip 用字形 innerHTML 对展开行计数，失败即 exit 2）。
- 已知偏差：mock 会话（工具名/数量取自用户上报的真实轮次，参数与结果文本为合成）；换行仅在单行放不下时发生。

![折叠统计（真实 47 步轮次）：terminal 21 · team 17 · team-task 7 · todo 2](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0122-mix-clusters.jpg>)

![8 簇 57 步：全部 chip 仍与展开行 1:1，单行排满](</Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0122-mix-wrap.jpg>)

## 34. v0.10.23 展开态保留簇统计条

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 轨迹展开时，icon + 数量统计也要保留，现在一展开就没有了 | v0.9 按原型 2-02 的 `.ttl-turn[data-collapsed="false"] .ttl-mix { display: none }` 改为展开态也显示（`display: inline-flex`）；折叠 / 展开共用同一份 chips，同一套 1:1 台账 | 展开态 `data-collapsed=false`、`.ttl-mix` computed `display:flex`；chips `terminal 21 · team 17 · team-task 7 · todo 2` + 47 行步骤；折叠回去同样可见 |
| 不影响折叠态与筛选 / 窄面板 | 只改显示规则；chip 计数仍取自可见步骤集合；wrap 规则沿用 v0.10.22 | 折叠态同样 visible；窄面板换行未变 |

- 覆盖：折叠头、展开头、筛选 / 搜索态（chip 随可见步骤收缩）；失败徽标、`N 步`、chevron 布局不变。
- 门禁：`pnpm typecheck` 0；`pnpm test` **563 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-expanded-mix.mjs`（mock 用户上报的 47 步轮次：展开 → 断言 computed display 与 chips → 截图 → 折叠复验）。
- 已知偏差：mock 会话（工具名/数量取自真实轮次，参数与结果文本为合成）。

![展开态头部仍显示簇统计：terminal 21 · team 17 · team-task 7 · todo 2](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0123-mix-expanded.jpg)

## 35. v0.10.24 头部收敛：去掉空闲 ⋯、搜索收进一行

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 上方「⋯」按钮没用，去除 | 删除头部右侧 `.ttl-iconBtn[data-testid=ttl-more]`（展开全部/全部折叠）及 `toggleAllTurns` / `allVisibleExpanded` 与两条文案；chips 行的「⋯」（更多工具）保留 | header children 不再含按钮：`brandIcon · title · count · spacer · search · follow` |
| 搜索框放到「跟随」旁边，省一行 | 删除独占一行的 `.ttl-searchRow`；搜索框内联到 header（跟随右侧、贴面板右缘），高 24px、宽 120–240px 自适应，占位文案「搜索步骤…」，完整文案作 aria-label/title（⌘F 保留） | dock 400：跟随 `50×24`（右缘 1278.5）→ 搜索 `143.5×24`（左缘 1286.5、右缘 1430 贴内边距）；dock 360：搜索 `123.5×24`（1306.5–1430），跟随右缘 1298.5 ≤ 搜索左缘；header 溢出 0，chips 紧贴 header |
| 下拉别错位 | 少一行后工具下拉锚点 `top:124px → 82px` | 下拉出现在 chips 下方 2px |

- 覆盖：空/加载/错误态的 header（搜索仅在 `turns > 0` 时渲染，与旧行为一致）；⌘F 聚焦、Esc 清空、清除按钮、筛选 chips、工具下拉均保持。
- 门禁：`pnpm typecheck` 0；`pnpm test` **566 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-header.mjs --dock 400|360`（量 header 子节点顺序、搜索/跟随矩形、溢出、chips 贴合、下拉偏移）。
- 已知偏差：mock 会话；窄于 320px 的极端 dock 未纳入本次验证。

![头部：跟随右侧贴边内联搜索，右上角 ⋯ 已移除（dock 400）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0124-header.jpg)

![dock 360：搜索框自动收窄，不重叠](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0124-header-360.jpg)

## 36. v0.10.25 轮次头的簇统计挪到「时长」一侧

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 这个统计 icon 换成靠时长的那一侧 | `clusterMix` 从 `.ttl-turnMeta`（右缘）移到 `.ttl-turnToggle` 里、紧跟 `ttl-turnDur`、位于 `spacer` 之前；右侧分组只剩失败/并行徽标、`N 步`、chevron | toggle 子节点 = `tag · time · dur · mix · spacer · meta`；`dur` 右缘 1164.2 → `mix` 1172.2–1276.1（同一行，中心线均 203），`meta` 1379.8–1426 |
| 换行方向 | `.ttl-mix` 由右对齐改左对齐（`flex: 0 1 auto` + `justify-content: flex-start`），多簇时在时长一侧向下换行 | chips = terminal 5 / file-read 2 / team 2 / file-edit 1，单行排布 |
| 缺失时长 | 无 `event.time` 时 chips 紧跟标签/时间，其余不变 | 回归用例覆盖折叠/展开两态 |

- 覆盖：折叠态与展开态共用同一份 DOM；`N 步`、失败/并行徽标、tooltip、`data-cluster` 对账字段不变。
- 门禁：`pnpm typecheck` 0；`pnpm test` **568 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-turnhead-mix.mjs`（mock 一轮 10 步 + 真实 12m00s 时长，量 dur/mix/meta 矩形与同行判定）。
- 已知偏差：mock 会话；时长侧空间不足时 chips 左对齐换行（不裁剪）。

![轮次头：簇统计紧随时长，右侧只留「10 步」与 chevron](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0125-turnhead-mix.jpg)

## 37. v0.10.26 read_image 在摘要页直接显示图片

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 读取图片的（read_image），要展示图片出来 | 结果里本来就带 `image` block（`attachment.attachmentId`），只是摘要页的 `OutputSection` 只画了文本占位。现在 `OutputSection` 接收 `images/sessionId/lang`，在「输出」文本下方渲染 `TrailImages`（会话授权缩略图 + 元数据 chip）；纯图片结果也会显示「输出」区块 + 图片 | 摘要页（默认，未切页签）出现 `ttl-img-row` + `ttl-img-thumb`，缩略图自然尺寸 `800×144`，chip `图片：turnheadmix-big.png image/jpeg 800×144 · 9 KB` |
| 覆盖范围 | 所有摘要页走 `OutputSection` 的族：read / read_image / edit / todo / MCP / generic / shell；「结果」页与浮层保持原行为 | 回归 + 实机各自覆盖；0 条 console error |

- 门禁：`pnpm typecheck` 0；`pnpm test` **569 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-read-image.mjs`（mock `read_image` 的文本信封 + image block，并 route 回放真实 PNG 作为 attachment 路由响应）。
- 已知偏差：mock 会话；缩略图走既有的 `/trace-inspect/api/attachment` 授权路由，非该会话引用的附件仍会回退占位 chip。

![read_image 摘要页：图片本体 + 元数据 chip](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0126-read-image.jpg)

## 38. v0.10.27 统计数字与图标重新居中

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 现在这个 icon 和数字怎么又不对齐了 | v0.10.20 的 `line-height: 13px` 加在 `.ttl-turnMeta` 上；v0.10.25 把 chips 移出 meta 后它们继承回头部 18px 行高 → 数字偏上 1px。现在 `.ttl-mix` 自带 `line-height: 13px`（行盒在容器上，折叠/展开、换行后的每一行都成立） | `.ttl-mix` / `.ttl-mixCount` 计算行高均 `13px`；2× 像素量测图标墨迹中心 23.0 vs 数字 23.0（Δ0，铅笔 0.25 CSS px 为其字形不对称） |

- 覆盖：折叠态、展开态、窄面板多行 chips；右侧 `.ttl-turnMeta`（徽标 / `N 步` / chevron）规则不变。
- 门禁：`pnpm typecheck` 0；`pnpm test` **576 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-turnhead-mix.mjs`（新增 mix/count line-height 指标与 2× 像素对齐量测）。
- 已知偏差：mock 会话；铅笔等不对称字形的墨迹中心天然略有偏差（≤0.25 CSS px）。

![统计数字与图标墨迹中心对齐（Δ0）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0127-mix-align.jpg)

## 39. v0.10.28 展开 / 收起保持滚动位置

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 展开和收起没有保持原有位置，收起后整个列表跳到另一处（有闪烁感） | 点击前记下 `scrollTop`；layout 阶段若收缩后的列表装不下原位置，就用**临时 `padding-bottom`** 撑住滚动位并把 `scrollTop` 放回原值 —— 被点的卡片原地不动；用户滚动进入真实内容后立即释放 padding（不残留）。覆盖轮次开合、步骤详情带开合、`显示更早` | 收起前 `scrollTop 1027` / 卡片 top 144 → 收起后 `scrollTop 1027` / 卡片 top 144 / `padding-bottom 621px`（零位移）；滚轮向上后 padding 恢复 8px |
| 不能影响新消息/筛选 | 新事件（follow-latest）、切换筛选/搜索时先释放临时 padding，再按原逻辑滚动 | 回归用例覆盖释放路径；0 console error |

- 说明：收起「列表末尾的长展开项」时，卡片不动在几何上必然表现为卡片下方留白（内容已折叠），该留白为临时状态。
- 门禁：`pnpm typecheck` 0；`pnpm test` **576 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-scroll-anchor.mjs`（18 轮 × 18 步 mock，收起前后量卡片 top / scrollTop / padding，并用真实滚轮验证释放）。
- 已知偏差：mock 会话；`scrollTop` 被撑住期间若收到新事件，会按 follow-latest 恢复到底部（正常行为）。

![收起后卡片原地不动（下方为临时留白，滚动即消失）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0128-scroll-anchor.jpg)

## 40. v0.10.29 详情收敛为「摘要 / 原始」两页签

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 结果 / 参数 两个 tab 的内容已经没必要了 | 摘要已含完整参数 JSON（v0.10.18）、输出与图片（v0.10.26），单独两页重复。`StepDetail` 与放大浮层都收敛为 `摘要 / 原始`：摘要 = 工具族区块 + 参数 JSON + 输出（Markdown 渲染 / 文本预览 / 图片）+ 错误块 + 合并提示；原始 = wire 参数/结果 + replace 提示。删除每一步的渲染/原文开关与 JsonTree 参数树；不可解析参数在摘要里显示原文 + 提示 | 内联带 2 个页签、摘要同时有 Markdown（`Deploy notes`）与参数 JSON（`ttl-json-pretty`）；原始页显示 `{"file_path":…}` 与结果原文；浮层 2 个页签、无 `ttl-view-toggle`；0 console error |
| 放大浮层 | 同规则；⌘C：摘要在 shell 步复制命令，原始页复制参数 | zoom tabs = 摘要 / 原始 |
| 失败 / 合并 | 错误名/码块与「Merged from N results」提示都进摘要 | 契约用例更新后全绿 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **576 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-detail-tabs.mjs`（mock `read` + Markdown 结果，量页签、摘要内容、原始页与浮层页签）。
- 已知偏差：删除「参数」页后，参数只能看格式化 JSON（不可逐层折叠的树），wire 原文仍可在「原始」页查看。

![详情带：摘要 / 原始两页签，Markdown、参数 JSON、图片块都在摘要](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0129-detail-tabs.jpg)

![放大浮层：同样是摘要 / 原始两页签](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0129-zoom-tabs.jpg)

## 41. v0.10.30 移除放大阅读浮层、长值改单值查看器

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 这个弹出框没必要了；唯一需要的是参数里很长的值，在 `…` 之后留一个点开查看该值内容，弹窗 + 背景模糊 | 删除 `ZoomOverlay.tsx` 与全部入口（详情头 `⤢`、底部「在中央查看」、点面板放大、`⌘⇧O`）及 `.ttl-zoom*`/`.ttl-clickablePane` 样式；参数 JSON 长值展示首行片段 + 可点击 `…`，点开 `ValueViewer` 单值查看器，并给背板加 `backdrop-filter: blur(6px)` | 详情带无 `ttl-detail-zoom` / `ttl-detail-view-center` / `ttl-pane-clickable`；`ttl-json-long-preview` 点击后 `ttl-value-viewer` portal 到 body、`backdrop-filter: blur(6px)`、标题 `command`；Esc 关闭 |
| 设计先行 | Figma 页面「重设计原型 v0.9」把 `07 · 放大阅读浮层` 标注「已移除」，新增 `07b · 长值查看弹窗`（详情带长值 + 单值查看器 + BACKGROUND_BLUR 8px 背板 + 交互标注） | 截图见 Figma `07b` 节点 |

- 保留：单值查看器的 `⌘F` 搜索值、`⌘C` 复制完整值、点遮罩/ Esc 关闭；行号 + 软换行。
- 门禁：`pnpm typecheck` 0；`pnpm test` **542 例 / 21 文件**（删除整组件与其 28 例浮层测试）；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-value-viewer.mjs`（mock 227 字符 bash 命令，量入口移除 / 查看器 portal / blur / Esc）。
- 已知偏差：mock 会话；单值查看器仍是全屏 fixed 层 + 弹窗，只是背景改为模糊。

![摘要：长参数值显示片段 +「…」](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0130-band-longvalue.jpg)

![单值查看器：弹窗 + 背景模糊](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0130-value-viewer.jpg)

## 42. v0.10.31 参数长值块重设计

| 反馈 | 方案（依据 `ui-ux-pro-max`：truncation / progressive disclosure / 可见焦点 / 150–300ms） | 实测 |
| --- | --- | --- |
| 这一块的 UI 太丑了 | 旧：虚线框 + 30px 实心按钮 + 值被裁。新：`1px solid` + 左侧 2px 蓝墨线 + 8px 圆角的低对比代码卡片；值行即主操作（单行等宽预览 + CSS 省略号，整行点击进单值查看器，右侧 20px `⤢` 显式入口）；元信息与「展开 / 复制」降为 10.5px 透明文本按钮，hover 才浮起；悬停仅改底色/边框无位移；键盘焦点 2px 蓝描边；展开在卡内显示全文（「收起」） | `border-style: solid`、`border-radius: 8px`；操作按钮 10.5px + `background: transparent`；`.ttl-dtab` 0 个；展开出正文、按钮变「收起」 |
| 设计先行 | Figma 新增 `07c · 参数长值块`：BEFORE / AFTER 折叠 / 悬停 / 展开四态 + 标注 | 见 Figma 页面「重设计原型 v0.9」 |

- 细节：JSON 逗号并入预览行尾，块级卡片不再产生孤立逗号行；`prefers-reduced-motion` 下过渡会自动禁用（仅颜色/背景过渡，无位移动画）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **543 例 / 21 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-longvalue-ui.mjs`（mock 211 字符命令，量 border/按钮/展开）。
- 已知偏差：mock 会话；窄宽度下预览走省略号（完整值点开查看）。

![长值块：实线卡片 + 值行为主操作](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0131-longvalue-collapsed.jpg)

![展开态：卡内显示全文，按钮变「收起」](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0131-longvalue-expanded.jpg)

## 43. v0.10.32 长值回到 JSON 原样（内联 + 蓝色「…」）

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 不要框框，直接文本…，省略号高亮一个颜色表示可点开，不破坏 JSON 原有格式 | 去掉卡片/边框/墨线/元信息行/按钮；长字符串就是普通 JSON token（键、引号、值、逗号原样），值尾内联蓝色 `…` 作为唯一可点区；hover 下划线 + 浅蓝底，点击打开单值查看器；字符/行数放进 tooltip；值行 flex 布局保证 `…` 与收尾引号/逗号始终在面板内；超出文本右侧渐隐 | `.ttl-jpLong` `display:flex` / `border-width:0` / 透明背景；`…` `rgb(147,197,253)`；无 `.ttl-jpLongMeta/Foot/Action`；点开查看器 3 行 + blur，Esc 关闭 |
| 格式保持 | 键行 `"command":` 与值同一行；逗号保留在收尾引号后 | `"command": "cd /Users/lzx…",` 结构不变 |

- 移除：内联展开（`.ttl-jpRestored`）与复制按钮（查看器内提供复制完整值）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **541 例 / 21 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-longvalue-ui.mjs`（量内联样式、`…` 颜色/点击、查看器与 Esc）。
- 设计：Figma `07d · 长值内联形式`（`07c` 标记已被替代）。

![长值回到 JSON 原样：只有蓝色「…」可点](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0132-longvalue-inline.jpg)

## 44. v0.10.33 MCP 统计恢复 + 失败徽标移到统计后面

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 为什么统计没有了 MCP | `toolIconKind()` 补 `mcp__` / 旧式 `mcp_` 前缀 → `mcp` 簇；此前 MCP 线名掉进 generic，行上粉插头、统计里却是扳手 | chips = `mcp 2`（粉色插头）· terminal 2 · file-read 1 · generic 1 |
| 报错的 icon 要跟在左侧的 icon 后面 | `⚠N` 失败徽标从右侧 meta 组移到左侧组：紧接簇统计 chips、在 spacer 之前；右侧仅 `∥N` / `N 步` / chevron | toggle 子节点顺序 `tag · time · dur · mix · badge · spacer · meta`；徽标不在 meta 内 |

- 覆盖：折叠态与展开态一致；失败步仍不计入簇 chip（由徽标计数），MCP 失败步也一样。
- 门禁：`pnpm typecheck` 0；`pnpm test` **544 例 / 21 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-mcp-mix.mjs`（mock 3 个 MCP + 1 失败 + bash/read/figma_status，量 chips 与徽标 DOM 位置）。

![折叠头：粉色插头 MCP 2，⚠1 紧跟在统计后面](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0133-mcp-mix.jpg)

## 45. v0.10.34 统计数字与图标同尺度（SVG text）

| 反馈 | 原因 | 方案 | 实测 |
| --- | --- | --- | --- |
| icon 和数字高度不一致 | 数字是 HTML 文本行盒（`line-height:13px`），图标是 13px SVG；在 ~90% 缩放/分数 DPR 下，文本行盒与矢量图标的取整路径不同，数字整体高约 1px（100% 时差 0，110% 时反而低 0.1px） | 数字改为 13px 高 SVG `<text>`（`textLength` + `lengthAdjust="spacingAndGlyphs"` 保证 1–2 位在盒内），与图标同一缩放路径 | zoom 0.9/1.0/1.1 下，terminal / mcp / file-read 的“数字墨迹中心 − 图标墨迹中心”均为 **0.00px** |

- 结构：`.ttl-mixCount` 只负责 13px 盒；`.ttl-mixCount text` 沿用 9.5px 代码字体；`textContent` 仍是数字（现有统计测试与 a11y 语义不变）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **546 例 / 21 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-mix-align.mjs`（zoom 0.9/1.0/1.1 截图 + DOM 契约；像素差在文档里用保存的 PNG 复核）。
- 已知偏差：skill 书形图标的墨迹中心比其 13px 盒中心低 0.75px（图标自身不对称，非数字问题）。

![90% 缩放下统计数字与图标居中对齐（56px zoom 头）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0134-mix-align.jpg)

## 46. v0.10.35 图片缩略图可点开大图

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 这种图片，点击应该有可以打开大图 | 缩略图改为按钮（`cursor: zoom-in`、hover 提亮、键盘可聚焦）；点击打开大图查看器：固定层 + `backdrop-filter: blur(6px)` 遮罩 + 面板（标题 / 格式 / 尺寸） + 右上 `✕`；Esc / 点遮罩 / ✕ 关闭，关闭后焦点回到缩略图；图片走会话授权 attachment 路由 | 缩略图父元素 `BUTTON`；点击后 `ttl-img-lightbox` portal body、role=dialog、aria-modal、大图 naturalWidth 1600、遮罩 blur(6px)；Esc 关闭 |
| 不放大到模糊 | 大图 `max-width: min(1200px, 92vw)` / `max-height: calc(90vh - 88px)` + `object-fit: contain`，原图小于容器时按原尺寸显示 | 面板宽 1138px（1600px 原图缩到上限内） |

- 新增文案 `imageOpen`（查看大图 / View full size）；加载失败仍只显示 chip + 警告，不出现可点缩略图。
- 门禁：`pnpm typecheck` 0；`pnpm test` **548 例 / 21 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-image-lightbox.mjs`（mock read_image + attachment 路由返回真实 JPEG，量 portal/尺寸/blur/Esc）。

![详情里的缩略图（可点击）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0135-image-inline.jpg)

![大图查看器：背景模糊 + 元信息 + Esc/遮罩关闭](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0135-image-lightbox.jpg)

## 47. v0.10.36 失败统计口径统一（全局 = 轮次 = 行）

| 反馈 | 原因 | 方案 | 实测 |
| --- | --- | --- | --- |
| 总体错误统计数据对不上（轮次 ⚠2、工具栏「失败 1」） | `TrailFolder.stats().failed` 只数 `kind==='error'`（wire `error` 行）；行/徽标谓词是 `kind==='error' \\|\\| result.isError`，普通 `tool/result` 带 `message.isError` 的失败被漏掉 | 统计改用同一谓词；按 step 维护 `failedState`，在 `applyContent`（含 replace）后做翻转校正，避免重复计数；失败步同时从 `byTool` 移除 | mock 7 步/2 轮（1 个 isError + 1 个 wire error）：轮次徽标 ⚠2、工具栏 `全部 7 · 失败 2`、概览 `2 失败`、图例合计 5（2+5=7） |
| 分布对不上 | 失败步此前只在部分路径排除 | 统一：失败行不进 `byTool`，`total = failed + tools` 恒等 | `total = failed + legend sum` 脚本断言通过 |

- 覆盖：`trail-folder` 2 例（isError only / 混合 + 恒等式）、`trail-tab` 1 例（同轮 ⚠2 时 chip、概览、图例一致）；两处 `referenceStats` 同步到新谓词。
- 门禁：`pnpm typecheck` 0；`pnpm test` **551 例 / 21 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-error-stats.mjs`（mock 2 轮 7 步，量徽标/chip/概览/图例与恒等式）。

![失败统计一致：轮次 ⚠2 = 工具栏失败 2 = 概览 2 失败，图例 5 项](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0136-error-stats.jpg)

## 48. v0.10.37 筛选与聚合合并为一行家族 chip

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 上下两部分语义重复；把聚合统计和点击筛选都放进下面概览 | 删除头部筛选条（全部/失败/top 工具/⋯）与概览图例行；概览块 = `步数·轮数 / 失败 / 时长` + 分布条 + **一行图例式筛选项**：`全部 N`、`失败 F`、每个工作家族一项（dot + 名称 + 计数），视觉沿用原图例（无白底/无胶囊，选中下划线 + 提亮）。点家族 chip 按家族筛选（`bash`=shell；`read` 覆盖 `read`/`read_image`…），计数只含健康步，`全部 = 失败 + 家族合计` | 只剩一行：全部9 / 失败1 / bash2 / read2 / edit1 / mcp1 / figma1 / skill1（8+1=9）；无 `.ttl-legend`、头部无筛选条；点 bash → 2 行且 `aria-pressed=true` |
| 避免再出现两处数字不一致 | 「失败」筛选改用 `kind==='error' \|\| result.isError`（与行/徽标/全局统计同一谓词）；移除 ⋯ 工具下拉 | 0 console error；既有 chip 测试改家族语义后全绿 |

- 结构：`.ttl-summaryFilters`（内嵌 `data-testid="ttl-chips"`）位于 `.ttl-summary` 内、`.ttl-dist` 之下；重置了 `.ttl-chip` 的底色/边框（透明、无胶囊），族色 dot 复用 `.ttl-legendDot` + `.ttl-ink-*`。
- 门禁：`pnpm typecheck` 0；`pnpm test` **551 例 / 21 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-summary-chips.mjs`（量一行 chips、恒等式、无图例/头部条、点击筛选结果）。

![概览一行：全部/失败 + 每个家族的点击筛选 chip](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0137-summary-chips.jpg)

![点击 bash 家族后只显示 bash 行](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0137-summary-filtered.jpg)

## 49. v0.10.38 家族筛选行对齐原图例

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 点击后下面的横线不要了 | 去掉选中项 `text-decoration`；选中态 = 文字 primary + 500 字重 + 圆点外 2px 细环（`box-shadow`） | 点 bash 后无下划线，圆点出现细环、文字提亮 |
| 颜色点与文本/数字距离太紧凑，参考原图例 | item 间距 12px、圆点↔文字 6px（原图例 5px 基础上略松）；名称与数字统一界面 sans、10.5px、同一颜色（默认 tertiary，选中 primary），去掉等宽小字号暗色数字 | `● bash 2` 与旧图例 `● bash 635` 的间距/字重/颜色一致 |

- 结构不变：`.ttl-summaryFilters`（内嵌 `data-testid="ttl-chips"`）一行完成「聚合 + 点击筛选」；`全部 = 失败 + 家族合计`。
- 门禁：`pnpm typecheck` 0；`pnpm test` **576 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-summary-chips.mjs`（同一脚本复核一行 chips、恒等式、点击筛选与选中态）。

![一行家族筛选项：无胶囊/无下划线，间距与字体对齐原图例](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0138-summary-chips.jpg)

![选中 bash：文字提亮 + 圆点细环，无下划线](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0138-summary-filtered.jpg)

## 50. v0.10.39 首轮自动打开右侧栏 tab

需求（2026-11-10）：「第一次对话运行时候就在右侧面的 better sidebar 自动弹出这个轮次轨迹」。

| 决策点 | 实现 |
| --- | --- |
| 触发时机 | 会话**第一轮**开始：client `sessions.list` 行仍为 `blank: true`（未开始过轮次）时 arm，随后该行 `blank→false` / `running→true`，或已 retain 会话的 `session`/`eventSource` feed 触发，最后用插件自己的 `POST /trace-inspect/api/events {afterSeq:0}` 确认 durable log 已写入**轮次证据**（`user/message` 或 `turn/start`；创建期 `sandbox/mode`/`approval/policy` 不算，见下方「实机校验」） |
| 只弹一次 | 每个会话触发即上锁（内存 latch）；手动关 tab / 收起右栏不再弹；切走再切回不重复；有历史的会话永不 arm |
| 打开方式 | `ctx.betterSidebar.openTab({ type:'trace-inspect' }, { sessionId })` → better-sidebar 0.30 原生面 → DSH 右侧栏；宿主每次 open 都会展开该列（不为看不到的列开内容），插件再 `isExpanded()===false → toggleExpanded()` 兜底 |
| 开关 | `descriptor.settings.pluginToggles['autoOpenFirstTurn']`（switch，默认开）→ prefs `pluginSettings['trace-inspect']`；插件级用 `betterSidebar.getSnapshot().prefs` 读 |
| 门控 | 开关关闭 / tab 被禁用（`isTabEnabled`）/ 视口 < 768px（宿主会把右列画成全屏）都不触发；全部在**触发时**判定 |
| 注册层级 | 插件级 `apply()`（tab 组件在触发时还不存在）；无 better-sidebar / 无原生右列时惰性退出，不报错 |
| 竞态 | 原生 tab 类型未注册时 `sidebarRightTabs.get('trace-inspect')` 探测失败 → 400ms×5 重试；open throw（无上屏 surface）吞掉，绝不弹错误条 |

- 代码：`src/client/auto-open.ts`（新，watcher + 纯谓词 `armDecisionOf`）、`src/client/index.tsx`（`settings.pluginToggles` + `ctx.effect(() => installFirstTurnAutoOpen(ctx))`）、`src/client/locales.ts`（中英开关文案）。
- 单测：`tests/client-auto-open.spec.ts` **23 例**（arm/skip/unknown 谓词；空白会话→首轮事件→只开一次；历史会话不探测；切会话重新 arm；未发布列表行单次探针；探针失败保持 pending；三条门控在触发时判定；已展开列不 toggle / 收起列兜底展开；原生类型注册竞态重试；传输失败保持 armed；dispose 不触发）+ `tests/client-apply.spec.tsx` 1 例（`pluginToggles` 契约）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **576 例 / 22 文件**；`pnpm build`（含 bundle 契约检查）通过。

### 实机校验（2026-11-10，独立 web 实例）

- 环境：`DSH_HOME=/tmp/verify/dsh-home7 dsh --profile trace-verify --no-open --port 19497`（profile 的 `node_modules/dsh-trace-inspect` 是仓库 symlink，直接加载构建产物），DSH 0.2.2-rc.1 + better-sidebar 0.30.1，Chromium 1440×1000@2x dark zh-CN。
- **第一轮实测暴露的两个缺陷（已修）**：
  1. 新会话出生即非空日志：`POST /trace-inspect/api/events {afterSeq:0}` 在新会话上返回 `sandbox/mode`(seq1) + `approval/policy`(seq2)，原确认门「有事件就开」导致面板在 `0 轮 · 0 步` 时就自动展开（发送前后 `expandedChangedByTheTurn=false`）。修复：确认门只认 `user/message`/`turn/start`（`hasFirstTurnEvidence`），创建期事件只保持 armed。
  2. 声明式开关无默认值：`pluginSettings['trace-inspect'].autoOpenFirstTurn` 缺席时行渲染 `checked=false`，与「默认开」的实现相反。修复：`settings.render` 挂一个 renderless 面板，在设置弹窗首次打开时把 `true` 写进插件自己的 blob。
- 结论（修复后复跑，**5/5 PASS**，exit 0，42.58s）：① 首轮前右栏折叠（`baseline.png`），发首条消息后由该轮触发展开并落到「轮次轨迹」（`positive.png`，`expandedChangedByTheTurn=true`、`prematureOpen=false`）；② 有历史的会话 reload 不弹（`negative.png`）；③ 设置页「首轮自动打开」渲染为已勾选（`settings.png`，默认值已物化）；④ 关掉开关后新会话首轮不弹（`switch-off.png`，7 次采样右栏始终折叠）；⑤ 0 console / 0 pageerror。
- 复跑要求：全新隔离 `DSH_HOME`（item ③/④ 会持久化开关状态）+ 全新浏览器上下文；**时序断言**必须包含「发送前 `expanded=false`、发送后才 `expanded=true`」，不能用「打开着」充当 PASS。

## 51. v0.10.40 首轮自动打开：E2E 暴露的两个缺陷

| 现象（E2E） | 根因 | 修复 | 复测 |
| --- | --- | --- | --- |
| 面板在 `0 轮 · 0 步` 的新会话上**提前弹出**：goto 后 1.99s 右栏就展开，发送前后 `expandedChangedByTheTurn=false` | DSH 0.2.2 的新会话**出生即非空日志**：创建瞬间写入 `sandbox/mode`(seq1) + `approval/policy`(seq2)（`POST /trace-inspect/api/events {afterSeq:0}` 实测）。确认门原判据是「page 里有事件」→ 会话创建时就通过；once 闩锁随即吞掉真正首轮 | 新增 `hasFirstTurnEvidence(events)`：只认 `user/message` / `turn/start`；确认门与「列表行未发布」的 settle 探针都用它——只有 housekeeping 的日志 = 空白会话（继续 armed），有轮次 = 历史（skip） | PASS：6s 静置 + 首轮前采样均 `ttlRoot=false`；发送后 `expandedChangedByTheTurn=true` |
| 默认开启的开关在设置页渲染成**未勾选**（`INPUT.checked=false`） | better-sidebar `SidebarSettingToggle` 没有 `default` 字段，声明式开关行读 `pluginSettings[id][key] === true`，值缺席即 unchecked；而实现把「缺席」当 ON | `settings.render` 挂 renderless 面板 `FirstTurnAutoOpenDefault`：设置弹窗首次打开时把 `true` 写进插件自己的 blob（不改 better-sidebar、不写宿主 prefs） | PASS：`INPUT.checked=true`，与同页 better-sidebar 原生开关视觉一致 |
| （顺带）原生 tab 类型注册竞态的重试预算只在插件装载时初始化一次 | 第二个会话遇到竞态时 `retriesLeft` 已耗尽 → 不重试 | 每次 `arm()` 重置 `retriesLeft = TAB_READY_RETRIES` | 单测覆盖 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **576 例 / 22 文件**；`pnpm build`（含 bundle 契约检查）通过。
- 实机：独立 `dsh web` 实例（`DSH_HOME=/tmp/verify/dsh-home15 dsh --profile trace-verify --no-open --port 19505`，profile 的 `dsh-trace-inspect` 为仓库 symlink；DSH 0.2.2-rc.1 + better-sidebar 0.30.1），被测构建 `lib/client.js` 281566B / sha256 `6a155604…`；脚本 `scripts/verify/auto-open-first-turn.mjs`（652 行，`--port/--url/--server-log/--home/--out/--message`，失败 exit 2）。

![首轮前：新会话 0 轮，右栏保持折叠](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0140-autoopen-baseline.png)

![发出第一条消息后：右栏自动展开并落到「轮次轨迹」](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0140-autoopen-positive.png)

![侧边卡片设置里的「首轮自动打开」，默认即勾选](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0140-autoopen-settings.png)

![关掉开关后，新会话首轮不再自动弹出](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0140-autoopen-switchoff.png)

- 脚本：`scripts/verify/auto-open-first-turn.mjs`（`--port/--url/--server-log/--out/--message`，失败 exit 2）；产物 `/tmp/verify/autoopen/`（`baseline/positive/negative/settings.png` + `metrics.json` + `control-experiment.md`）。

## 52. v0.10.41 失败详情完整显示报错

| 反馈 | 原因 | 方案 | 实测 |
| --- | --- | --- | --- |
| 报错内容现在无法完整显示 | 失败步同时渲染「错误块（完整）」与「输出块（240 字符单行截断）」；而「展开全文」只在 >20 行出现，长单行报错被切且无法展开 | 错误块成为唯一展示位置并展示完整文本（无结果文本时回退 `step.error`）；失败步不再渲染重复的「输出」区块；非失败的超长单行输出也出现「展开全文」 | 356 字符单行报错：错误块 `hasTail=true`、全文 356 字符、无 `ttl-outBlock`；超长单行成功输出：出现 `ttl-out-toggle`，展开后含尾串且无 `…` |
| 不误伤正常输出 | — | `OutputSection` 去掉 error 分支；`clipped = 行数>20 || 任一行>240` 才给展开按钮，展开后完整换行 | 全部既有输出/详情用例通过 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **578 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-error-full.mjs`（mock `rv_exec` 失败 + 超长成功输出，量错误块完整性/去重/展开）。

![失败详情：错误块完整显示整段报错，无重复输出](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0141-error-full.jpg)

## 53. v0.10.42 失败信息排在参数之后

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| error 信息在参数上面了，应该在参数下面 | 错误块不再统一放在摘要开头，而是占用原「输出」区块的位置（参数之后）；shell / 文件 / MCP / 通用各家族一致；MCP 失败优先错误块，避免被文件列表顶掉 | 摘要顺序 = `参数` → `错误块`（356 字符完整），无重复输出 |
| 不回归 v0.10.41 | 错误块仍是失败文本唯一展示位置，不截断；非失败长单行输出仍可「展开全文」 | 579 例全绿 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **579 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-error-full.mjs`（同一脚本复核错误完整性/去重/展开，并更新截图顺序）。

![失败详情：参数在上，错误块在下](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0142-error-order.jpg)

## 54. v0.10.43 展开按钮移到底部居中

| 反馈 | 方案 | 实测 |
| --- | --- | --- |
| 展开全文放在文本下方中央；bash 命令也是——习惯是滚到下方发现没看全才展开，回到上方交互不友好 | 命令块「展开全部 N 段 / 收起全部」与输出块「展开全文 / 收起」都从标题行右侧移出，放到内容下方、水平居中（`.ttl-sectionExpand` + `.ttl-expandBtn`）；标题行只留段数/字节等元信息与复制按钮 | 两个按钮 `parentClass=ttl-sectionExpand`、`inHeader=false`、`afterBlock=true`、与区块中心差 ≤2px |
| 状态与可达性 | 展开后同一位置变「收起」；hover 浅蓝底、`focus-visible` 2px 蓝描边；按钮可键盘聚焦 | 41 段命令 / 34 行输出均正常展开 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **580 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-expand-placement.mjs`（量父容器、DOM 位置、是否在标题行、与区块中心对齐）。

![命令块：展开全部 41 段移到代码块下方居中](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0143-expand-command.jpg)

![输出块：展开全文移到文本下方居中](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0143-expand-output.jpg)

## 55. v0.10.44 长 Markdown 回复右侧渐隐覆盖

| 反馈 | 原因 | 方案 | 实测 |
| --- | --- | --- | --- |
| 长回复显示不完整，旁边还有一个类似毛玻璃的东西 | `.ttl-mdTableWrap::after` 是 18px 右边缘渐隐；开关条件是 `:has(.ttl-md table)`，消息**含任意表格**时整段正文（高度 = 全文）都被这条渐隐覆盖，压暗每行最右约 18px 文字 | 删除该渐隐覆盖；表格保留 `overflow-x: auto` 横向滚动能力 | 真实会话回放（35 步 / 2171 字符消息含表格）：正文完整到「4. 把这套流程固化…」，右边缘无渐隐；0 console error |
| 不希望动到表格能力 | — | 只删 `::after` 覆盖，`.ttl-mdTableWrap` 容器与滚动不变 | 表格仍可横向滚动 |

- 门禁：`pnpm typecheck` 0；`pnpm test` **580 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/replay-long-message.mjs`（读取真实 session 日志回放该轮，滚动到消息体截图；无表格渐隐断言）。
- 说明：右侧若仍有细条，可能是宿主/系统的悬浮滚动条（不属于本插件样式）。

![长回复完整渲染：右边缘不再被渐隐覆盖](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0144-longmsg-nofade.jpg)

## 56. v0.10.45 MCP 结果误判文件列表 + 参数长值换行

| 反馈 | 原因 | 方案 | 实测 |
| --- | --- | --- | --- |
| MCP 摘要结果很怪（「结果 4 个文件」tcp / tcp…） | `fileEntriesOf` 的路径判定是「含 `/` 即路径」，且扫描整行 token：`docker ps` 的 `4320/tcp`、`127.0.0.1:3000->4320/tcp` 都成了文件 | 收紧：含 `:`/`@`/`->` 不算路径；`\d+/tcp\|udp\|sctp`、MIME、纯数字/点分数字开头段不算路径；每行只认第一个 token 为路径 | docker 表格：`hasFiles=false`，输出块正常显示 `4320/tcp` |
| 参数 JSON 长值在右边缘被切 | `.ttl-jsonPretty` 为 `white-space: pre; overflow: auto`（横向滚动，视觉像被裁） | 改 `pre-wrap + overflow-wrap: anywhere`，`overflow-x: hidden`，保留行内缩进 | `cmdString` 完整换行显示；`jsonScrollW == jsonClientW`（492/492） |

- 保留：行首的绝对/相对路径、带扩展名的文件行仍渲染为文件列表（既有用例通过）。
- 门禁：`pnpm typecheck` 0；`pnpm test` **583 例 / 22 文件**；`pnpm build` 通过。
- 采集脚本：`scripts/verify/shoot-mcp-summary.mjs`（mock MCP docker 表格，量文件列表误判与 JSON 横向溢出）。

![MCP 摘要：表格按文本显示，参数长值换行](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0145-mcp-summary.jpg)

## 57. v0.10.46 子智能体品牌图标 + 轨迹里的上下文注入

| 需求 | 设计稿（Figma「重设计原型 v0.9」） | 落地 |
| --- | --- | --- |
| 两个子智能体用官方 logo | `05e · 子智能体品牌图标：Claude Code / Codex`（`43:2`） | `tool-icon.tsx` 新增 `claude` / `codex` 填充路径；`tool-summary.ts` 精确名映射 + `subagent_` 前缀兜底 + 两个品牌 ink；`styles.ts` `.ttl-ink-claude/#d97757`、`.ttl-ink-codex/#e6e8ea` |
| 上下文注入进入轨迹 | `06e · 轨迹里的上下文注入行`（`44:335`，含折叠 / 展开 / 4 张规格卡） | `trail-model.ts` 新 `context` item（source / label / form / summary / sections / text，两条 fold 路径共用 `contextItemOf`）；`TrailTab.tsx` 注入行 + 展开体；`styles.ts` `.ttl-ctx*` |

真实日志核对（`session-00c569f2…`，50 轮）：

- `user/message` 的 `data.source = { kind, form?, sections?: [{ name, text }] }`；`source.kind = user` 才是用户气泡，其余都按注入处理。
- 实测样本：`time-context` 42 条、`runtime-context` 11 条（均 `form: snapshot`）、`skill-catalog` → `catalog`、`agent-instructions` → `instructions`、`tool-jobs` → `notice`；`session-reference` → `recall`（表单枚举与 DSH Chat 的 `KNOWN_FORMS` 一致）。
- 折叠行的名称列直接显示注入标题（`source.kind` → `time-context` / `runtime-context`；`skill-invocation` 显示技能名、`agent-instructions` 显示指令路径、`session-reference` 显示召回标签），与工具名共用 132px 名称列，摘要因此与工具描述对齐；
- 折叠行摘要取第一个分节的首行；展开态对 `snapshot` 先渲染「取代先前的快照」，再逐节渲染 `sections`。

证据方法与限制：

- 本次会话的文件沙箱禁止写 `~/.dsh/profiles/trace-verify/cordis.yml`，`dsh --profile trace-verify` 无法在 19487 起第二个实例（`DSH_HOME` 换到 `/tmp` 后，`@deepseek-ai/*` bundle 解析失败），因此**没有**走 `scripts/verify/shoot.mjs` 的真机链路。
- 替代证据：用一个临时用例渲染真实 `TrailTab`（mock 一轮：time-context → `subagent_claude_code` → `subagent_codex` → `bash` → runtime-context → 输出），把真实 `trailCss` + 渲染后的 DOM 序列化成静态页，再用 Chrome（2×、400px 侧栏、zh-CN）截图。组件、样式、文案都是真实产物，只缺宿主外壳；临时用例截图后已删除，不入库。
- 断言：`ttl-context-producer` = `time-context`；折叠行摘要 = 首行；展开含「取代先前的快照」与分节正文；无 `form` 时回退原文且不出现快照说明。

![上下文注入行：折叠态（time-context / runtime-context 各一行）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0146-context-rows.jpg)

![上下文注入行：展开态（取代先前的快照 + 分节渲染）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0146-context-expanded.jpg)

门禁：`pnpm typecheck` 0；`pnpm test` **588 例 / 22 文件**；`pnpm build` + `scripts/check-lib.mjs` 通过。

### v0.10.47 补充：长注入不再卡内裁切

- 反馈：展开 `agent-instructions` 这类几 KB 的注入时，卡片停在 141px、末尾被切在句子中间（旧样式沿用 DSH 对话区的内滚动）。
- 改法：`.ttl-ctxSections` 去掉 `max-height: 141px` 与 `overflow: auto`（改 `max-height: none` / `overflow: visible`），卡片随内容增高、面板滚动；折叠行新增「还有 N 字符」（与助手输出行同一 `ttl-msgRest`，N = 全文长度 − 首行摘要长度）。
- 实测（同一 DOM+Chrome 链路）：1,400+ 字符注入展开后卡片高 **900px**、末尾标记可见；折叠行「还有 1,378 字符」；`sections` 不再产生卡内滚动容器。
- 门禁：`pnpm typecheck` 0；`pnpm test` **590 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![长注入整段展开：折叠行给「还有 N 字符」，展开后不再卡内裁切](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0147-context-long.jpg)

### v0.10.48 补充：注入计入上方统计

- 汇总行：`全部 / 失败 / 注入 / 各工具族`，注入 chip 的圆点用 violet，计数为整段会话的注入条数；点击后 `visibleTurns` 只留含注入的轮次，展开体只渲染 `context` 行（`isToolFilter` 对 `inject` 为 false，避免被「非工具行隐藏」规则吞掉），再点恢复。
- turn 头部 mix：`clusterMix` 把 `context` 当作一个簇，渲染 inbox 字形 + 数量，与工具簇同样按数量排序；点开某轮后头部数字与展开行 1:1。
- 实测（DOM + Chrome）：`全部 3 / 注入 2 / bash 1 / 其他 2`；mix `context:2 claude:1 codex:1 terminal:1`；点击注入 chip 后展开体仅 2 条注入行、`ttl-step` 为 0。
- 门禁：`pnpm typecheck` 0；`pnpm test` **591 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![注入计入上方统计：汇总行「注入 2」+ turn 头部 inbox 计数](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0148-inject-stats.jpg)

### v0.10.49 补充：注入正文按 Markdown 渲染

- 旧行为：展开注入行后，正文按等宽原文整段铺开，`**定位**`、`1.` 之类的 Markdown 标记原样可见。
- 新行为：分节正文与整段正文都先过 `looksLikeMarkdown()`，命中则交给 `MarkdownResult`（与「输出」行、工具结果同一个组件、同一套 host `MarkdownText`，禁用原始 HTML）；无 Markdown 信号的机器文本仍走等宽原文。新增 `.ttl-ctxMd` 恢复面板字体与 12/18 行高，避免继承分节体的 mono / `pre-wrap`。
- 断言：`instructions` 注入展开后 `ttl-md` 存在、`fake-md` 收到原文（由渲染器消费 `**…**`）；无 Markdown 信号的注入 `ttl-md` 不存在。
- 门禁：`pnpm typecheck` 0；`pnpm test` **592 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

### v0.10.50 补充：注入只看到 2 KiB 的根因

- 现象：展开注入后正文停在 ~2,050 字符、以 `…` 结尾（用户截图：`skill-catalog` 还有 2,032 字符）。
- 根因不在渲染，在 `src/wire.ts` 的投影：`user/message` 的 `content` 一律 `clipText(..., TEXT_CAP=2048)`，且 `source` 只转发 `kind` / `callId`——真实会话里 `form`、`sections` 从未到达客户端，snapshot 只能走原文回退。
- 修复：注入消息（`source.kind !== 'user'`）改用 `CONTEXT_CAP = 64 KiB`；`source` 增发 `form` / `sections` / `name` / `changes[].path` / `references[].label`（分节文本 64 KiB 上限），页面预算 `PAGE_BUDGET_BYTES` 兜底。另外名称列宽度改为同时量注入标题（只有 `bash` 时不再挤成 `time-co…`）。
- 端到端实测（mock → `projectEvent()` → 渲染）：`time-context` 出现「取代先前的快照」+ 分节；`skill-catalog` 全文渲染到 `尾部标记 TAIL`；名称列 86px。
- 门禁：`pnpm typecheck` 0；`pnpm test` **596 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![注入全文：wire 投影修复后分节与 2 KiB 之后的尾部都在](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0150-inject-full.jpg)

### v0.10.51 补充：注入行改回「角色 + 名称」

- 反馈：名称列直接放注入标题，长名字被截成 `agent-inst…` / `runtime-co…`，看不出这是注入。
- 改法：行首增加角色词（zh「上下文」/ en「Context」，44px），标题列保持按最长标签自适应（≤132px，`time-context` / `runtime-context` 不截断），摘要与「还有 N 字符」不变。
- 实测（wire 投影后渲染）：`上下文 time-context`、`上下文 runtime-context`、`上下文 skill-catalog`，标题列 106px、无横向溢出。
- 门禁：`pnpm typecheck` 0；`pnpm test` **596 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![注入行：角色「上下文」+ 注入标题](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0151-context-role.jpg)

### v0.10.52 补充：`context` 角色词 + 名称进内容区

- 反馈：「上下文」改成英文 `context`；`time-context` 这种名字放到展示实际内容的地方。
- 改法：折叠行 = `[inbox] context · 首行摘要 · 还有 N 字符`；展开体第一行 = 注入名（mono 10.5，`ttl-context-title`），随后才是「取代先前的快照」与正文。`snapshot` 分节名与注入名相同时不重复渲染。行内标题列移除后摘要拿回整行剩余宽度。
- 实测（wire 投影后渲染）：`context  Time sampled while preparing …`；展开体首行 `time-context`，第二行「取代先前的快照」，正文完整。
- 门禁：`pnpm typecheck` 0；`pnpm test` **596 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![注入行：英文 context + 内容区顶部的注入名](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0152-context-word.jpg)

### v0.10.53 补充：`context <name>` 两列

- 反馈：行里第二列应展示注入名（如 `time-context`），并与上面的工具描述文本左对齐。
- 改法：角色词 `context` 占工具名列（`width: var(--ttl-step-name-w)`），注入名用 `.ttl-ctxName` 落在描述列（mono 11 / `#dfe2e5`），行内摘要与「还有 N 字符」移除；展开区回到「弯曲说明 + 正文」，并撤掉重复的注入名标题。
- 实测：`context  time-context` 与 `bash  列目录` 的描述同列；展开体只剩「取代先前的快照」+ 正文。
- 门禁：`pnpm typecheck` 0；`pnpm test` **596 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![注入行两列：context + 与工具描述对齐的注入名](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0153-context-name.jpg)

### v0.10.54 补充：注入正文「分节 / 原文」切换

- 背景：`snapshot` 注入的正文有两种真实形态——`source.sections` 的结构化分节，以及模型实际收到的 `content`（带 `<system-reminder>` 包裹与引导句）。之前只渲染前者，读者无法对照原文。
- 改法：展开体右上角加两个小按钮。默认「分节」＝「取代先前的快照 + 节名 + 正文」；「原文」＝逐字 `item.text`（`pre-wrap`，不做 Markdown、不改写）。没有 `sections` 的注入不显示切换。视图状态按事件 seq 记忆，折叠再展开保持。
- 实测（wire 投影后渲染）：分节态 = `取代先前的快照` + `working-directory:current` + `sandbox:policy`；原文态 = `<system-reminder> … </system-reminder>` 全文。
- 门禁：`pnpm typecheck` 0；`pnpm test` **597 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![注入正文：分节视图](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0154-context-sections.jpg)

![注入正文：原文视图（模型收到的 content）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0154-context-raw.jpg)

### v0.10.55 补充：MCP 图标换成官方 mark

- 旧：`.ttl-ink-pink` 的插头字形（自绘，24 网格）。
- 新：modelcontextprotocol.io 官方 logo 左半部分的 M 环 mark —— 三段圆头描边，官方坐标系 `19 24 158 166`、`stroke-width: 12`，`ToolIcon` 对 `mcp` 使用该 viewBox，等比显示到 13px；墨色仍是 MCP 簇的 pink。
- 断言：MCP 行行图标 `viewBox` / 3 条 `path` / `stroke-width` / `stroke-linecap`；全量 **598 例 / 22 文件**。
- 视觉（4×）：`figma`、`playwright` 两个 MCP 行是环状 mark，`bash` 行仍 `>_`。

![MCP 行图标：官方环状 mark（4×）](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0155-mcp-mark.jpg)

### v0.10.56 补充：注入图标改成 teal

- 旧：`.ttl-ctxIcon` 用 violet `#a78bfa`，和并行分组的 violet（`∥`、并行组 rail）撞色。
- 新：teal `#63c9d1`（本设计里「上下文 / 会话」的色相，`skill` / `session` 同色），行图标、汇总行「注入 N」圆点、turn 头部 mix 三处一起换；violet 只留给并行分组。
- 实测（3×）：`context` 行图标、`注入 N` 圆点、头部 inbox 计数均为 teal，`bash` 仍 violet。
- 门禁：`pnpm typecheck` 0；`pnpm test` **598 例 / 22 文件**；`pnpm build` + `check:lib` 通过。

![注入图标 teal：行图标 / 汇总圆点 / 头部 mix 同步](/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/v0156-context-teal.jpg)
