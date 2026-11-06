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
