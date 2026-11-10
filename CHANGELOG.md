# Changelog

## [0.10.36] - 2026-11-10

### Fixed

- **总体失败统计与轮次徽标对不上**：`stats.failed` 只累加 `kind === 'error'`（wire `error` 行），而轮次头 ⚠N、行上的红色 alert 用的是 `kind === 'error' || result.isError`；普通 `tool/result` 带 `message.isError: true` 的失败因此只出现在轮次里（截图：轮次 ⚠2，工具栏「失败 1」）。现在 `TrailFolder` 用与行/徽标相同的谓词增量维护失败数，并在结果被 replace 改写时按“失败状态翻转”校正（不会重复计数）。
- **失败步不再混进工具分布**：失败行从 `byTool` 中移除，分布条 / 图例与「失败」chip 互补——`全部 = 失败 + 分布合计`（截图数据：7 = 2 + 5）。轮次内的簇统计本来就不计失败行，两处口径终于一致。

### Verification

- 更新两处 `referenceStats` 到新谓词，并新增 3 例回归：`trail-folder`（普通 isError → failed 1、工具 mix 为空；wire error + isError 混合 → failed 2 且 `total = failed + tools`）、`trail-tab`（同轮 ⚠2 时工具栏 chip 2、概览「2 失败」、图例不含失败）。测试 **551 例 / 21 文件**；`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 420，mock 2 轮 7 步：1 个普通 isError + 1 个 wire error）：轮次徽标 `⚠2`、工具栏 `全部 7 · 失败 2`、概览 `2 失败`、图例 `bash 2 · read 1 · mcp 1 · figma 1`（合计 5，2+5=7）；0 条 console error。截图 `docs/assets/v0136-error-stats.jpg`，脚本 `scripts/verify/shoot-error-stats.mjs`。

## [0.10.35] - 2026-11-10

### Added

- **图片缩略图可点开大图**：详情「摘要」里的图片块（如 `read_image` 结果）现在是按钮（`cursor: zoom-in`，hover 轻微提亮，键盘可聚焦/回车打开），点击后打开**大图查看器**：固定层 + 背景模糊（与单值查看器同一套语言）、顶部标题/尺寸/格式元信息、右上 `✕`，Esc / 点遮罩 / `✕` 关闭；关闭后焦点回到缩略图。图片仍走会话授权的 attachment 路由，按 `max-width/max-height` 自适应，不放大到模糊。
- 新增文案 `imageOpen`（查看大图 / View full size）。

### Verification

- 新增 2 例回归：点击缩略图打开 role=dialog + aria-modal + 图片 src；Esc / 点遮罩 / 关闭按钮三种关闭方式，点图片本身不关闭。测试 **548 例 / 21 文件**；`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 400，mock 一条 `read_image` + `image/*` attachment，attachment 路由回真实 JPEG）：缩略图 naturalWidth 1600、父元素是 `BUTTON`；点击后 `ttl-img-lightbox` portal 到 body、role=dialog、`backdrop-filter: blur(6px)`、大图 naturalWidth 1600；Esc 关闭；0 条 console error。截图 `docs/assets/v0135-image-inline.jpg`、`docs/assets/v0135-image-lightbox.jpg`，脚本 `scripts/verify/shoot-image-lightbox.mjs`。

## [0.10.34] - 2026-11-10

### Fixed

- **统计数字与图标在缩放/高分屏下差 1px**：数字原本是 HTML 文本行盒（`line-height: 13px`）配 13px SVG 图标；在 ~90% 缩放（或分数 DPR）下，文本行盒取整与矢量图标取整不一致，数字整体高了约 1px。现在数字改成一个 **13px 高的 SVG `<text>`**（`textLength` + `lengthAdjust="spacingAndGlyphs"` 保证 1–2 位数字始终落在盒内），和图标走同一条矢量缩放路径：90% / 100% / 110% 三个缩放级别下，terminal / mcp / file-read 三个簇的“数字墨迹中心 − 图标墨迹中心”偏差均为 **0px**。

### Verification

- 新增 2 例回归：`trail-tab` 断言每个 `.ttl-mixCount` 内是 13px 的 SVG text 且文本等于数字；`detail-styles` 断言 `.ttl-mixCount` 为 13px 盒、`text` 走 9.5px 代码字体。测试 **546 例 / 21 文件**；`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 400，mock 一轮 5 个簇）：在 zoom 0.9 / 1.0 / 1.1 三次截图，像素级量“数字墨迹中心 − 图标墨迹中心”，terminal/mcp/file-read 均为 0.00；0 条 console error。截图 `docs/assets/v0134-mix-align.jpg`，脚本 `scripts/verify/shoot-mix-align.mjs`。

## [0.10.33] - 2026-11-10

### Fixed

- **折叠统计里少了 MCP**：`toolIconKind()` 只认 `mcp__server__tool` 之外的显式表与前缀规则，MCP 线名落进了兜底 wrench，于是行上是粉色插头、统计里却是扳手（截图里的 `⟳ 2` 其实是 generic）。现在 `mcp__` / 旧式 `mcp_` 前缀直接归 `mcp` 簇，统计与行图标一致。
- **失败徽标挪到统计图标后面**：`⚠N` 从右侧 meta 组移到左侧组——紧随簇统计 chips、在弹性 spacer 之前；右侧分组只保留 `∥N` 并行徽标、`N 步` 与 chevron。折叠/展开两态一致。

### Verification

- 新增 2 例回归：`tool-summary` 断言 MCP 线名（含旧式 `mcp_server_tool`）→ `mcp` 簇 + pink；`trail-tab` 断言 MCP 调用合成粉插头 chip、失败徽标是 toggle 的直接子节点且在 spacer 之前、不在 meta 里。测试 **544 例 / 21 文件**；`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 400，mock 一轮：bash×2 / read / 3×MCP（1 个失败）/ figma_status）：折叠头 chips = `mcp 2 · terminal 2 · file-read 1 · generic 1`，随后是 `⚠1` 徽标；toggle 子节点顺序 `tag · time · dur · mix · badge · spacer · meta`；0 条 console error。截图 `docs/assets/v0133-mcp-mix.jpg`，脚本 `scripts/verify/shoot-mcp-mix.mjs`。

## [0.10.32] - 2026-11-10

### Changed

- **长值不再有卡片框，回到 JSON 原样**（承接 0.10.31）：去掉实线卡片、左侧墨线、元信息行与「展开 / 复制」按钮；长字符串就是一串普通 JSON——键、引号、值、逗号保持原样，只在值尾内联一个蓝色 `…` 表示「可点开查看完整值」。
  - 蓝色 `…` 是唯一可点区：hover 变下划线 + 浅蓝底，点击打开 07b 的单值查看器（背景模糊）；字符数 / 行数放进它的 tooltip。
  - 值行用 flex 布局（key 固定 + 值占剩余宽度），保证 `…` 与收尾引号、逗号始终在面板宽度内；超出的文本用右侧渐隐而非硬裁。
  - 内联「展开」不再需要（查看器承担阅读），`.ttl-jpRestored` 一并移除。

### Verification

- 更新 2 例 json-pretty 回归：内联 JSON 形状（`"command": "…` 且无 meta/toggle/copy/body）+ 点击 `…` 打开查看器；`detail-styles` 契约改为内联规则（无 border/background/按钮）。测试 **541 例 / 21 文件**；`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 420px，mock 211 字符 bash 命令）：`.ttl-jpLong` 计算 `display: flex`、`border-width: 0px`、背景透明，`…` 颜色 `rgb(147,197,253)`、无卡片/按钮/元信息节点；点击后单值查看器打开（标题 `command`、3 行、`backdrop-filter: blur(6px)`），Esc 关闭；0 条 console error。截图 `docs/assets/v0132-longvalue-inline.jpg`，脚本 `scripts/verify/shoot-longvalue-ui.mjs`。
- 设计：Figma 新增 `07d · 长值内联形式`，并把 `07c` 标注为已被替代。

## [0.10.31] - 2026-11-10

### Changed

- **参数长值块重设计**（按 `ui-ux-pro-max` 的 truncation / progressive disclosure / 可见焦点 / 150–300ms 过渡规则）：
  - 去掉虚线框与三个 30px 实心按钮，改为低对比代码卡片：`1px solid` 边框 + 左侧 2px 蓝墨线 + 8px 圆角 + 2% 白底；
  - **值本身是主操作**：单行等宽预览（超长走 CSS 省略号），整行可点打开单值查看器；右侧 20px `⤢` 是显式入口（hover 变蓝）；
  - 字符数 / 行数降为 10.5px 四元色元信息，「展开 / 复制」降为 10.5px 透明文本按钮（hover 才浮起底色），不再抢视觉；悬停仅改底色/边框、无位移；键盘焦点 2px 蓝描边；
  - 展开态在卡内显示全文（按钮变「收起」），不再另开面板；JSON 逗号并入预览行尾，块级卡片不再产生孤立逗号行。

### Verification

- 新增 1 例 CSS 回归（实线/墨线/8px 圆角/无 dashed；文本按钮 10.5px 透明底；预览走 ellipsis）。测试 **543 例 / 21 文件**；`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 420px，mock 211 字符 bash 命令）：长值块 `border-style: solid`、`border-radius: 8px`、`展开/复制` 均 `10.5px` + 透明底、块内 `.ttl-dtab` 0 个；展开后 `ttl-json-long-body` 出现且按钮变「收起」；0 条 console error。截图 `docs/assets/v0131-longvalue-collapsed.jpg`、`docs/assets/v0131-longvalue-expanded.jpg`，脚本 `scripts/verify/shoot-longvalue-ui.mjs`。
- 设计：Figma 新增 `07c · 参数长值块`（BEFORE / AFTER 折叠 / 悬停 / 展开四态）。

## [0.10.30] - 2026-11-09

### Changed

- **移除整步「放大阅读浮层」**：摘要现在已含完整参数 JSON、Markdown 输出与图片块，参数/结果被截断时会按需拉全，再开一个「步骤大纲 + 宽版阅读」的浮层已无必要。删掉 `ZoomOverlay.tsx`（约 1000 行）、`.ttl-zoom*` 样式与 `.ttl-clickablePane`，以及所有入口：详情头 `⤢`、底部「在中央查看」、点击面板放大、行上 `⌘⇧O`。放大浮层的 ⌘F/⌘C/导出等交互随组件一起下掉。
- **长参数值改为「…」+ 单值查看器**：参数 JSON 里的长值先给首行片段 + 可点击的 `…`（`ttl-json-long-preview`）；点 `…` 或 `⤢` 打开既有的**单值查看器**（`ValueViewer`，body portal），并给它加了 `backdrop-filter: blur(6px)` 的背景模糊——弹窗 + 模糊背板，Esc / 点遮罩关闭、`⌘F` 搜索值、`⌘C` 复制完整值。
- `DetailTab` 收敛为 `summary` / `raw`；`ResultView` 类型删除。

### Verification

- 测试：删除 `tests/zoom-overlay.spec.tsx`（整组件）与浮层相关契约用例；`detail-styles` 的类名契约改为单值查看器（`.ttl-valueViewer/.ttl-valueBackdrop/.ttl-valuePanel`）并新增模糊断言。现 **542 例 / 21 文件**；`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 420px，Playwright 路由 mock 一条 227 字符 `bash` 命令）：详情带无 `ttl-detail-zoom` / `ttl-detail-view-center` / `ttl-pane-clickable`；参数里出现 `ttl-json-long-preview`；点击后 `ttl-value-viewer` portal 到 body、`backdrop-filter: blur(6px)`、标题 `command`、Esc 关闭；0 条 console error。截图 `docs/assets/v0130-band-longvalue.jpg`、`docs/assets/v0130-value-viewer.jpg`，脚本 `scripts/verify/shoot-value-viewer.mjs`。
- 设计：Figma 页面「重设计原型 v0.9」里把 `07 · 放大阅读浮层` 标注为已移除，新增 `07b · 长值查看弹窗`（详情带长值 + 单值查看器 + BACKGROUND_BLUR 背板）。

## [0.10.29] - 2026-11-09

### Changed

- **详情只保留「摘要 / 原始」两个页签**：v0.10.18 起「参数」页的内容（完整参数 JSON）已经在摘要里，v0.10.26 起图片块也在摘要里渲染，单独的「结果」「参数」页签纯属重复。现在 `StepDetail` 与放大浮层都只保留两页：
  - **摘要**：工具族区块（命令 / 文件 / MCP）+ 完整参数 JSON + 输出（Markdown 渲染、纯文本预览、图片块）+ 失败时的错误名/码块 + 合并提示；原「结果」页的 Markdown 渲染与渲染/原文开关并入这里（开关不再需要，wire 原文看「原始」）。
  - **原始**：wire 参数 / 结果原文 + replace 提示，未变。
- 同步删除：`ResultView` 的每一步记忆状态、`ttl-view-toggle` 开关、摘要外的 JsonTree 参数树、`DetailTab` 的 `result` / `params` 取值。放大浮层的 ⌘C 语义改为「摘要在 shell 步复制命令，原始页复制参数」。
- 不可解析的参数不再另开页：摘要里直接显示原文 + 「无法解析」提示。

### Verification

- 更新/合并 15 例既有契约测试（trail-tab、verify-detail、verify-v050、zoom-overlay）到两页签契约，并新增两页签/合并内容的断言。测试 **570 例 / 22 文件**（571 → 570：删除与合并了旧的「结果/参数」页、渲染/原文开关用例）。
- `pnpm typecheck` 0；`pnpm build` 通过。
- 实机（独立 `trace-verify` web profile，19487，dock 420px，Playwright 路由 mock 一条 `read` 结果 = Markdown 文档）：摘要页签共 2 个（摘要 / 原始），摘要同时出现 Markdown 渲染（`Deploy notes`）与参数 JSON（`ttl-json-pretty`）；「原始」页显示 wire 参数与结果原文；放大浮层同样是 2 个页签、无 `ttl-view-toggle`；0 条 console error。截图 `docs/assets/v0129-detail-tabs.jpg`、`docs/assets/v0129-zoom-tabs.jpg`，脚本 `scripts/verify/shoot-detail-tabs.mjs`。

## [0.10.28] - 2026-11-09

### Changed

- **展开 / 收起不再让列表整段跳动**：以前在列表底部收起一张展开的轮次卡（或关掉内联详情带）时，内容变短会让浏览器把 `scrollTop` 夹到新的最大值，整个列表跳到另一处。现在点击前记下滚动位置，layout 阶段如果新内容装不下这个位置，就用**临时底部内边距**把滚动位撑住——被点的卡片停在原地，列表不跳；多出来的空白在用户滚动回内容区后立即释放（不会残留）。
- 覆盖所有会改变列表高度的交互：轮次展开/收拢、步骤详情带开/关、`显示更早 N 条`。卡片点击（v0.10.21 整卡可点）走同一条路径。
- 释放时机：用户滚动进入真实内容区时；以及新事件到达触发 follow-latest、切换筛选/搜索时（先恢复原状再按原逻辑滚动）。
- 说明：收起位于列表末尾的展开项时，「卡片原地不动」在几何上必然表现为卡片下方留白（内容已折叠消失）；留白只是临时的，滚动即消失。

### Verification

- 新增 1 例回归：用 jsdom 模拟 1000→700 的列表收缩，断言收起后 `scrollTop` 保持 600、`padding-bottom: 300px`，滚动回内容区后 `padding` 释放且位置不变。测试 **571 例 / 22 文件**（570 → 571）。
- 实机（独立 `trace-verify` web profile，19487，dock 400，Playwright 路由 mock 18 轮 × 18 步，滚到列表底部后收起最后一张展开卡）：收起前 `scrollTop 1027`、卡片 top 144；收起后 `scrollTop 1027`、卡片 top 144、`padding-bottom 621px`（**位置零位移**）；滚轮向上滚动后 `padding-bottom` 恢复 8px、`scrollTop` 落在真实内容内；0 条 console error。截图 `docs/assets/v0128-scroll-anchor.jpg`，脚本 `scripts/verify/shoot-scroll-anchor.mjs`。

## [0.10.27] - 2026-11-09

### Fixed

- **轮次头的统计数字又比图标高 1px（上对齐）**：v0.10.20 把「13px 行盒」加在 `.ttl-turnMeta` 上让计数与 13px 图标居中，但 v0.10.25 把 chips 移出 meta、挪到「时长」一侧后，`.ttl-mix` 重新继承了头部 18px 行高，数字又偏上约 1px。现在 `.ttl-mix` 自己带 `line-height: 13px`，与图标同为 13px 墨迹网格；`.ttl-turnMeta` 的规则保留给右侧徽标 / `N 步` / chevron。
- 覆盖：折叠态与展开态、窄面板换行后的每一行 chips 都生效（行盒在 chips 容器上，不依赖父级）。

### Verification

- 新增 1 例 CSS 回归：`.ttl-mix {` 必须含 `line-height: 13px;`。测试 **570 例 / 22 文件**（569 → 570）。
- 实机（独立 `trace-verify` web profile，19487，dock 400，mock 一轮 10 步 + 12m00s 时长）：`.ttl-mix` 与 `.ttl-mixCount` 计算行高均 `13px`，mix 高度 13px 且与 `dur`/`meta` 同中心线（203）；2× 截图像素量测：图标墨迹中心 23.0 vs 数字墨迹中心 23.0（Δ0；铅笔字形自身不对称，Δ0.25 CSS px）；0 条 console error。截图 `docs/assets/v0127-mix-align.jpg`，脚本 `scripts/verify/shoot-turnhead-mix.mjs`（新增 line-height 指标）。

## [0.10.26] - 2026-11-09

### Fixed

- **`read_image` 在详情「摘要」页直接显示图片**：此前摘要页只把结果文本画出来——`image/jpeg image, 800×144 px, 9390 bytes` 的占位串，真正带 `attachment` 的 image block 只在「结果」页和放大浮层渲染，所以点开图片工具看不到图。现在 `OutputSection` 接收结果里的 image blocks，在「输出」文本下方用会话授权缩略图（`/trace-inspect/api/attachment`）+ 元数据 chip 显示；纯图片结果（无文本）也会渲染「输出」区块 + 图片。
- 覆盖所有在摘要页走 `OutputSection` 的工具族：`read` / `read_image` / `edit` / `todo`、MCP、generic、shell（任何结果里带 image block 的调用）；「结果」页与浮层行为不变。

### Verification

- 新增 1 例回归：`read_image` 打开后**不切页签**（默认摘要）即出现 `ttl-img-row` / `ttl-img-thumb`，`src` 为会话授权附件地址、`alt`/元数据 chip 正确。测试 **569 例 / 22 文件**（568 → 569）。
- 实机（独立 `trace-verify` web profile，19487，dock 420px，Playwright 路由 mock 一条 `read_image` 结果 = 文本信封 + image block，并回放真实 800×144 PNG 作为 attachment）：摘要页 `data-tab=summary`、`ttl-img-row` 存在、缩略图自然尺寸 `800×144`（面板内显示 352×65），chip `图片：turnheadmix-big.png image/jpeg 800×144 · 9 KB`，0 条 console error。截图 `docs/assets/v0126-read-image.jpg`，脚本 `scripts/verify/shoot-read-image.mjs`。

## [0.10.25] - 2026-11-09

### Changed

- **轮次头的簇统计挪到「时长」一侧**：v0.10.22 的 chips 原本贴右缘（`#1 10:32 12m00s … >_39 📄2 42 步 >`），中间留出一大段空白。现在 chips 作为左侧分组的一员紧跟在 `时长` 后面、`spacer` 之前：`#1 10:32 12m00s >_39 📄2 ⟳1 … 42 步 >`，右侧只剩失败/并行徽标、`N 步` 与 chevron。
- `.ttl-mix` 从右对齐换行改为左对齐换行（`justify-content: flex-start`，`flex: 0 1 auto`），chips 多时在时长一侧向下换行，不再挤右边缘。
- 覆盖：折叠态与展开态一致；计时缺失（无 event.time）时 chips 紧跟时间/标签，行为不变。

### Verification

- 新增 2 例回归：`trail-tab` 断言 `.ttl-mix` 是 `.ttl-turnToggle` 的直接子节点、位于 `spacer` 之前且不再属于 `.ttl-turnMeta`；`detail-styles` 断言 `.ttl-mix` 的 `flex: 0 1 auto` + `justify-content: flex-start`。测试 **568 例 / 22 文件**（566 → 568）。
- 实机（独立 `trace-verify` web profile，19487，dock 400，Playwright 路由 mock 一轮带真实 12m00s 时长的会话）：`.ttl-turnToggle` 子节点 = `tag · time · dur · mix · spacer · meta`；`dur` 右缘 1164.2 → `mix` 1172.2–1276.1（同一行，中心线 203 = 203），`meta`（`10 步` + chevron）在 1379.8–1426；chips = terminal 5 / file-read 2 / team 2 / file-edit 1；0 条 console error。截图 `docs/assets/v0125-turnhead-mix.jpg`，脚本 `scripts/verify/shoot-turnhead-mix.mjs`。

## [0.10.24] - 2026-11-09

### Changed

- **面板头部去掉空闲的 ⋯**：右上角「⋯」（展开全部 / 全部折叠）平时没人点、又容易和菜单混淆，直接移除；同时删掉 `toggleAllTurns` / `allVisibleExpanded` 与 `expandAll` / `collapseAll` 两条文案。工具筛选 chips 行里的 ⋯（更多工具）是功能入口，保留。
- **搜索框收进头部、省掉一整行**：原来独占一行的 `.ttl-searchRow`（含 8px 上下内边距）删除，搜索框移到「跟随」右侧的同一行（贴右缘，跟随紧挨其左），高 24px、宽 120–240px 自适应；占位文案缩为「搜索步骤…」（完整文案仍作 aria-label + hover title，⌘F 快捷键照旧）。面板因此少一整行（约 42px），chips 行紧跟头部，工具下拉锚点也从 `top:124px` 收到 `82px`。

### Verification

- 新增 3 例回归：头部 DOM 顺序（brand/title/count/spacer/search/follow）、无 `ttl-more` 按钮、无 `.ttl-searchRow`，且头部搜索仍能过滤列表；2 例 CSS gate（旧搜索行样式删除、头部搜索 24px 高度、下拉 `top:82px`）。测试 **566 例 / 22 文件**（563 → 566）。
- 实机（独立 `trace-verify` web profile，19487，Playwright 路由 mock 一轮 6 个工具）：dock 400 与 360 两档下 header 顺序均为 `brandIcon · title · count · spacer · search · follow`，搜索框 `143.5×24` / `123.5×24` 且位于「跟随」右侧、右缘贴 header 内边距（1430），跟随右缘 1278.5/1298.5 ≤ 搜索左缘 1286.5/1306.5，header 横向溢出 0，chips 行紧贴 header（差值 <1.5px），工具下拉在 chips 下方 2px（`top:82`），无 `ttl-more`；0 条 console error。截图 `docs/assets/v0124-header.jpg`（400）与 `docs/assets/v0124-header-360.jpg`（360），脚本 `scripts/verify/shoot-header.mjs --dock 400|360`。

## [0.10.23] - 2026-11-09

### Changed

- **展开轮次时保留簇统计条**：v0.9 沿原型 2-02 的规则（`.ttl-turn[data-collapsed="false"] .ttl-mix { display: none }`）会在展开后把折叠头部的 `icon + N` 统计整条藏掉，看起来像统计消失了。现在折叠 / 展开共用同一份 chips（同一套 1:1 台账），展开态的头部继续显示簇统计，随时可以和下面的步骤行对账。
- 覆盖：折叠态、展开态、筛选/搜索态（chip 随可见步骤收缩）；失败徽标、`N 步`、chevron 的排布不变；窄面板仍按 v0.10.22 的 wrap 规则换行。

### Verification

- 新增 1 例样式回归：展开态不再出现 `display: none`，且保留 `.ttl-turn[data-collapsed="false"] .ttl-mix { display: inline-flex; }`。测试 **563 例 / 22 文件**（562 → 563）。
- 实机（独立 `trace-verify` web profile，19487，dock 400px，Playwright 路由 mock 用户上报的 47 步轮次）：展开态 `data-collapsed=false` 时 `.ttl-mix` 计算样式 `display:flex`（inline-flex），chips 仍是 `terminal 21 · team 17 · team-task 7 · todo 2`，下方 47 行步骤；再折叠回去同样可见；0 条 console error。截图 `docs/assets/v0123-mix-expanded.jpg`，脚本 `scripts/verify/shoot-expanded-mix.mjs`。

## [0.10.22] - 2026-11-09

### Fixed

- **折叠统计的 icon 和数量与展开内容对不上**：轮次头部的混合统计此前按「工具族」聚合（9 个粗粒度族），而展开后的步骤行按「工作簇」画图标，于是 `generic` 族会把 `wait_agent` / `list_agents` / `team_task_create` / `spawn_teammate` 合成一个扳手图标，展开后却找不到任何扳手行；`read` 族也会把 `read` 与 `grep` 合并成一个文件图标。现在统计改为按**工作簇**聚合——与行图标同一套 `toolIconKind`，每个 chip 都用行的字形与墨色，`data-cluster` 可对账。
- **计数口径对齐「展开后真正渲染的步骤」**：簇计数取自当前过滤/搜索后的步骤列表，而不是全量 `turn.items`，所以在任何筛选状态下 chip 计数都等于展开体里能数到的行数；不再封顶 4 个 chip + skill 固定槽，所有出现的簇各占一个 chip，窄面板自动换行（`.ttl-mix` flex-wrap）。
- **失败步不再混进簇计数**：失败行统一画红色告警三角，现在归失败徽标统计；同时把失败徽标/脚注的口径从「只有 wire `error` 步」改成「画告警三角的行」，即 `step.kind === 'error'` **或** `result.isError === true`，与行内呈现一致（之前 `isError` 结果行看着是失败但不计入徽标）。
- 覆盖范围：折叠态与展开态共用同一份 DOM；筛选/搜索态 chip 随可见步骤收缩；`skill` 不再需要固定槽位（无上限后自然出现）。

### Verification

- 更新/新增回归：`trail-tab` 重写 mix 用例为簇口径并**逐 chip 对账**（打开轮次后按字形 innerHTML 统计行数 == chip 数字）；新增失败口径用例（1 个 `isError` 结果：6 个健康步 → 6 个 chip，告警行 1 条 == 徽标 1，`chipTotal + alertRows == 全部行数`）。测试 **562 例 / 22 文件**（561 → 562）。
- 实机（独立 `trace-verify` web profile，19487，dock 400px，Playwright 路由 mock **用户上报的那一轮 47 步**：bash 21 / wait_agent 9 / list_agents 4 / team_task_create 4 / spawn_teammate 4 / team_task_list 3 / todo_write 2）：折叠头 chips = `terminal 21 · team 17 · team-task 7 · todo 2`（总和 47 = 步数），展开后逐 chip 计数 `21/21 · 17/17 · 7/7 · 2/2` 全部一致；另测 8 簇 57 步行也逐 chip 一致（折叠头一行排满，必要时换行）；0 条 console error。截图 `docs/assets/v0122-mix-clusters.jpg`（真实轮次）与 `docs/assets/v0122-mix-wrap.jpg`（8 簇），脚本 `scripts/verify/shoot-mix-exact.mjs`（`--mode real|wrap`）。

## [0.10.21] - 2026-11-09

### Changed

- **折叠卡整卡可点**：以前只有头部时间行（`.ttl-turnToggle`）能展开轮次，2 行输入预览是「死文本」，鼠标移上去没有反应。现在折叠状态下整张卡都是点击目标——点时间行、点输入预览、点卡片内边距都会展开；`cursor: pointer`，预览悬停时文字提亮。
- **交互边界**：卡片内部的按钮 / 链接 / 输入框保留自己的行为（如行尾 `↗` 定位不会被当成展开）；用鼠标拖选预览文字时不触发展开；展开后的卡片不挂整卡点击，步进行内的点击（含详情带空白处）不会把轮次折回去。
- 键盘路径不变：`ttl-turnToggle` 仍是真正的 button（Tab / Enter / Space），整卡点击只是鼠标侧的补充。

### Verification

- 新增 4 例回归：点击输入预览展开、点击卡片内边距展开、拖选文字不展开（mock `getSelection`）、展开后点步进行/脚注不折叠。测试 **561 例 / 22 文件**（557 → 561）。
- 实机（独立 `trace-verify` web profile，端口 19487，dock 400px，Playwright 路由 mock 两轮会话）：折叠卡 `data-collapsed=true` 且预览 `cursor: pointer`，`ttl-step` 0 条；**点击预览行**后 `data-collapsed=false`、DOM 出现 3 条步骤；再点展开体内的脚注仍保持展开；0 条 console error。截图 `docs/assets/v0121-card-collapsed.jpg` / `docs/assets/v0121-card-expanded.jpg`，采集脚本 `scripts/verify/shoot-cardclick.mjs`。

## [0.10.20] - 2026-11-09

### Changed

- **轮次头部统计条与行图标统一**：轮次 mix chip、会话分布条与图例 dot 改用 v0.10.19 的簇墨色 `.ttl-ink-*`，不再用旧族色 `.ttl-tone-*` —— 于是 `edit` 从琥珀回到绿色、`mcp` 从绿回到粉色，与旁边步骤行的图标颜色一致；字形仍取该族的代表簇（terminal / 铅笔 / 插头 / 开卷 / 扳手…）。`.ttl-tone-*` 规则仅作向后兼容保留在 CSS 里，UI 不再引用。
- **统计数字与图标垂直居中**：`.ttl-turnMeta` 显式 `line-height: 13px`。此前它继承 18px 行高，9.5px 的计数在 13px 图标的行盒里整体偏高约 1px，看起来像「上对齐」；现在图标墨迹中心与数字墨迹中心重合（badge / pill 仍用自己的 16px 行高）。
- 覆盖范围：展开态隐藏 mix 的规则不变；错误徽标、`∥N` 并行徽标、`N 步` 共用同一条 13px 行高。

### Verification

- 更新/新增回归：`trail-tab` 的 mix 用例改断言 `.ttl-ink-teal|violet` 且不再出现 `ttl-tone-*`，并扩展为 violet / blue / green / teal 四色齐全；会话分布条与图例 dot 断言 `ttl-ink-violet`；`detail-styles` 新增 2 例（`.ttl-turnMeta` 含 `line-height: 13px`、dist/legend 的 ink 背景与 `[class*="ttl-ink-"]` display 规则），并把「ink 不给 chip 上底色」的断言收窄到行 / 详情 chip。测试 **557 例 / 22 文件**（555 → 557）。
- 实机（独立 `trace-verify` web profile，端口 19487，右侧 dock 400px，Playwright 路由 mock 一轮 3×bash + 2×edit + 2×MCP + 1×read + 1×skill）：mix chips = `ttl-ink-violet` 3 / `ttl-ink-green` 2 / `ttl-ink-pink` 2 / `ttl-ink-teal` 1，计算行高均为 `13px`；图例 dot 依次为 vioet/blue/green/pink/teal 的墨色；2× 截图像素量测：图标墨迹中心 23.0、数字墨迹中心 23.0（修复前数字 24.5 vs 图标 26.5，约 1px 偏高）；0 条 console error。截图 `docs/assets/v0120-mix.jpg`（轮次头部）与 `docs/assets/v0120-summary.jpg`（会话概览分布条 + 图例），采集脚本 `scripts/verify/shoot-mix.mjs`。

## [0.10.19] - 2026-11-09

### Changed

- **每个工作簇一个图标，不再只有 8 个族**：`ToolIcon` 从 8 个字形族扩到 25 个 —— 22 个 DSH 内置工作簇各一个专属字形（命令执行 `>_`／长驻终端／后台作业／代码执行／读取／写入／编辑／检索／联网／计划清单／目标／定时／询问／交付／子代理／团队／团队任务板／工作流／技能／会话回溯／工作区／运行时插件），MCP 保持插头，失败行保持告警三角。簇表与 DSH 自身的工具包一一对应（`@deepseek-ai/dsh-tool-*` 的 `defineTool` 名 + 官方 `dsh-client-ui-tool` 的 `detailIcon` 分组），含 `terminal_*` / `job_*` / `schedule_*` / `session_*` / `team_task_*` / `cordis_*` / `*_goal` 的前后缀规则与历史别名（`shell` / `ls` / `append` / `search` / `todo_read` / `bash_output`）。
- **非内置、非 MCP 一律统一扳手**：`figma_*` 等插件自带工具不再用 layers 字形（v0.10.10 的特例回退），与第三方 / 未知工具共用同一个扳手；行详情仍保留 `documentId` / `fileKey` 等有用字段。`list_mcp_resources` / `read_mcp_resource` 等 MCP 资源工具归入 MCP 簇。
- **字形墨色与统计族色解耦**：新增 `.ttl-ink-violet|blue|green|amber|pink|teal|gray|red`，行、详情带头、浮层大纲/头部的图标改用工作簇墨色；`.ttl-tone-*` 只保留给轮次 mix、族分布条与图例。青色复用既有 `#63c9d1`（skill 家族色），不新增调色板 hex。
- `ToolSummary.icon` 的类型扩展为 25 个 `ToolIconKind`；`ToolIcon` 不再接收 `tone`（墨色由外层 `ttl-ink-*` 决定），`ToolTone` 与 StepDetail / ZoomOverlay 的 `toneOfFamily` / `iconToneOf` 一并移除。

### Verification

- 新增 6 例回归：`tool-summary` 3 例（39 个工具名 → 簇的映射表、非内置非 MCP 兜底 + MCP 资源归 MCP、`inkOf` 七色表）；`trail-tab` 1 例（`create_goal` / `subagent` / `session_search` / `job_list` / `terminal_open` / 未知工具六行的 ink 类与字形几何）；`detail-styles` 2 例（8 条 `.ttl-ink-*` 规则齐全且不参与 chip 底色、统计族色仍在）。
- 测试 **555 例 / 22 文件**（549 → 555）；`pnpm typecheck` 0；`pnpm build` 通过（产物 `lib/client.js` 已含 `ttl-ink-*` 与新增字形路径），`check-lib` 契约检查 ok。
- 实机（独立 `trace-verify` web profile，端口 19487，右侧 dock 400px，Playwright 路由 mock 一轮 19 个工具的会话）：19 行墨色全部命中 —— 执行簇 `rgb(167,139,250)`、读取/检索/联网 `rgb(96,165,250)`、写入/编辑 `rgb(52,211,153)`、计划/目标/定时 `rgb(242,180,92)`、子代理/团队/任务板/MCP `rgb(240,143,184)`、技能/会话 `rgb(99,201,209)`、`figma_status` 与 `acme_deploy` 灰扳手 `rgb(155,161,167)`；0 条 console error。截图 `docs/assets/v0119-tool-clusters.jpg`，采集脚本 `scripts/verify/shoot-clusters.mjs`。
- 设计依据：Figma 文件 `trace` · 页面「重设计原型 v0.9」· ④「工具图标系统」（22 内置簇 + MCP + 兜底，含 13px 真实尺寸预览）。

## [0.10.18] - 2026-11-09

### Changed

- **展开后工具的「参数」统一用格式化 JSON 展示，不再按工具族特判**：内联详情带与放大浮层的「摘要」页里，「参数」区块此前是键值表——友好 key 名、数组折成 chips（`…` + `+N`）、长字符串折成「N 字符 · M 行」、MCP 加类型徽标、shell 隐藏 `command`、文件类隐藏 `file_path`，实际参数内容被藏起来。现在所有工具族统一为 `section.ttl-section[data-testid=ttl-params]` + `JsonPretty`（`ttl-json-pretty`）：**完整参数对象一次按 JSON 格式化展开**，各字段值/数组/嵌套对象原样可读（长字符串仍按既有 long-value 块折叠展开/复制/⤢）。
- 保留的专属块：shell 的「命令」高亮分段块、文件类的 `ttl-fileBlock`、MCP 的 `ttl-mcpBlock`、结果侧的文件列表与「输出」折叠预览；相对地，专属块不再从参数 JSON 里剔除对应字段（`command` / `file_path` 仍会出现在 JSON 中）。
- 不变：「参数」页签仍是可逐层折叠的 `JsonTree`（浮层里仍是 `JsonPretty`），「原始」页仍是 wire 原文，`结果` 渲染逻辑未改。
- 样式清理：删除随之失效的 `.ttl-kv*`（键值表/类型徽标/数组 chips/长值）与 `.ttl-chipMore` 规则；`ZoomOverlay` 里的键值表辅助函数一并移除。

### Verification

- 新增 2 例回归：①内联带四种工具族（shell / `ask_user_question` / read / MCP）的「摘要」参数区块都渲染 `ttl-json-pretty`、无 `.ttl-kv`、数组不再变成 chip，专属块仍在；②浮层「摘要」参数区块同为 `JsonPretty`、shell 命令块保留；测试 547 → **549 例 / 22 文件**。
- `pnpm typecheck` 0、`pnpm build` 通过；样式类名断言（3 处）同步去掉 `ttl-kv`。
- 实机（独立 `trace-verify` profile，App 内置 DSH 0.2.2-rc.1 + better-sidebar 0.30.1，端口 19487，右侧 dock 560px，Playwright 路由 mock 一轮 `ask_user_question` + `bash`）：generic 详情带「参数」区块 = `ttl-json-pretty`、`.ttl-kv` 0、`.ttl-chipTag` 0，`questions` 数组完整展开；shell 详情带命令分段块保留、JSON 含 `command` / `description` / `timeout`；浮层 `ttl-zoom-params` 同为格式化 JSON、`.ttl-kv` 0；「参数」页签仍是 `ttl-json` 树；全程 0 条 console error。截图 `docs/assets/v0118-params-json.jpg`（generic）、`docs/assets/v0118-params-json-shell.jpg`（shell）、`docs/assets/v0118-params-json-zoom.jpg`（浮层），采集脚本 `scripts/verify/shoot-paramsjson.mjs`。

## [0.10.17] - 2026-11-08

### Fixed

- **DSH 0.2.2-rc.1 下「轨迹」视图里跳回对话失效（提示「无法定位该消息」）**：0.2.x 的 Trajectory 表格在账本超过 100 条记录、或已向前翻过历史后启用虚拟化，只把视口内（+ overscan）的行走挂到 DOM。本插件的轨迹跳转此前只在已挂载的 `tr[data-trajectory-row-key]` 里按 `data-trajectory-row-key` 查找，目标行一旦落在窗口外就永远找不到——即使 `loadOlder()` 已把 `hasMore` 翻成 false、目标事件已在快照里（实测会话：`eventNodes` 425 条、DOM 仅 36 行，`trajectoryRecordIdsFor` 的 `tool\u0000call\u0000…` 键生成正确）。现在新增虚拟化扫描：以 `[data-trajectory-scroll]` 为滚动容器，按 0.8 视口步进先向下、再向上翻账本，每步同时按行键与 seq/callId 匹配，途中展开挂载出来的折叠子调用摘要行（`tr[data-collapsed-summary]`），命中后 `scrollIntoView({block:'center'})`；整张表都找不到时把滚动位置还原，仍如实报 `trajectory-row-not-rendered`（`src/client/trail-jump.ts`）。
- 覆盖范围：仅轨迹视图分支；聊天视图跳转（`data-chat-anchor-key` / `data-chat-node-key` + `beforematch` 揭示）逻辑未变。

### Verification

- 新增 3 例虚拟化回归（`tests/trail-jump.spec.ts`）：①目标行在窗口外、滚动后才挂载 → 定位成功且 pane 滚到位；②扫描途中遇到折叠摘要 → 点击展开后命中；③目标不在账本内 → 失败并把滚动位置还原。测试 544 → **547 例 / 22 文件**，`pnpm typecheck` 0、`pnpm build` 通过。
- 实机（独立 `trace-verify` profile，端口 19500，App 内置 DSH **0.2.2-rc.1** + better-sidebar 0.30.1 + Playwright，真实大会话）：修复前轨迹视图点跳转 → 状态栏「无法定位该消息」；修复后 → 「已在轨迹视图定位」，跳转后 DOM 轨迹行 36 → 38（滚动挂载）。聊天视图同一会话仍为「已定位」并给目标行加 `ttl-flash`；全程 0 条 console error。截图 `/tmp/verify-traj-fixed.png`。

## [0.10.16] - 2026-11-07

### Changed

- **轮次头部的失败统计改用统一的告警图标**：折叠卡头部的 `✗N` 文本徽标改为「警示三角 + 数字」（`ToolIcon kind="alert"`），红色 chip 保留，与失败行、原型 2-02 / 6-06 的失败图标一致。
- 覆盖：折叠轮次卡头部统计；行内失败行本来就是同一三角字形，未变。

### Verification

- 更新面板回归断言：`ttl-error-dot` 内出现 alert-triangle path（含 `M10.29 3.86`），数字单独在 `ttl-error-count`，不再是 `✗1` 文本。
- `pnpm typecheck` 0、`pnpm test` **544 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock 轮次含 1 个失败步骤）：头部 mix 后显示红色 chip「⚠ 1」，文本不再出现 `✗`；截图 `docs/assets/v0116-error-badge.jpg`。

## [0.10.15] - 2026-11-07

### Changed

- **长参数值展开后全量显示，不再有内部滚动条**：`.ttl-jpRestored` 去掉 `max-height: 240px` / `overflow: auto`，点「展开」后 4k+ 字符的 `code` 等长值一次渲染完（由面板 / 浮层本身滚动）；复制、收起、⤢ 中央查看器行为不变。
- 覆盖范围：浮层与内联详情带的「参数 / 结果」里，JSON long-value 都由 `JsonPretty` 渲染，一处改动同时生效。

### Verification

- 新增 1 例样式回归：`.ttl-jpRestored` 不再含 `max-height` / `overflow: auto`，仍保留 `white-space: pre-wrap`。
- `pnpm typecheck` 0、`pnpm test` **544 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock `mcp__figma__use_figma` + 84 行 code）：展开块 `359×1352`、`max-height: none`、`overflow: visible`、`scrollHeight == clientHeight = 1352`、`innerScroll: false`；截图 `docs/assets/v0115-longvalue.jpg`。

## [0.10.14] - 2026-11-07

### Changed

- **skill 图标换成「打开的书」**：四角星（sparkle）改为 Lucide book-open 书页图形，和 DSH 自身的 skill 统计图标一致；青色 `#63c9d1` 家族色不变，`skill` 行的名称/详情、图例、mix 都沿用同一字形。

### Verification

- 更新面板回归断言：`skill` 行 glyph 含 `M12 7v14`（书脊线），不再是 sparkle 路径。
- `pnpm typecheck` 0、`pnpm test` **543 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock 两个 skill 调用）：行 label `skill`、desc `figma-workbench` / `ui-ux-pro-max`、书本字形 ink `rgb(99,201,209)`；截图 `docs/assets/v0114-skill-book.jpg`。

## [0.10.13] - 2026-11-07

### Fixed

- **MCP 摘要把 JSON 结果误判成「1 个文件」**：`use_figma` 这类工具返回带转义引号的 JSON（`{"err":"... Property \"width\" failed ..."}`）时，文件列表启发式把 token `\"` 里的反斜杠当成路径分隔符，渲染出一个文件名是 `"` 的假文件行。修复：① 整个结果是 JSON 对象（以 `{` 开头）时不再走路径列表；② 含引号 / 花括号 / 方括号 / 逗号 / 分号 的 token 一律不算路径；③ 反斜杠只在 `C:\` / `\\server` 这类 Windows 路径里才算分隔符。
- 真正的路径列表（如 `/tmp/assets/01.png  74 KB`）仍然按文件行渲染。

### Verification

- 新增 2 例：带转义引号的 JSON 结果不再出现 `ttl-files`（并正常显示 输出预览），真实路径列表仍渲染文件行。
- `pnpm typecheck` 0、`pnpm test` **543 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock `mcp__figma__use_figma` + 同款 resize 错误 JSON）：`ttl-files = 0`、输出预览 14 行、meta `177 B · 14 行`；截图 `docs/assets/v0113-mcp-files-fix.jpg`。

## [0.10.12] - 2026-11-07

### Changed

- **展开的「输出」改为卡片式**：点开「输出」行后，正文不再裸露在行下，而是放进与详情带同款的卡片：`border-radius: 8px`、12px 内边距、1px 边框、`color-mix` 深色 surface、`margin: 4px 13.5px 10px`（与 `.ttl-detail` 同宽 358、同左内缩 27.5）。
- 折叠态不变（仍是单行 + 前 32 字 + 还有 N 字符 + chevron）。

### Verification

- 新增 1 例样式回归：`.ttl-msgBody` 卡片几何（margin / padding / radius / border / surface），并断言旧的裸文本 padding 已移除。
- `pnpm typecheck` 0、`pnpm test` **541 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2）：展开后 body `358×412`、`padding: 12px`、左缘 1069（= 行左 1055 + 13.5），与详情带同宽；截图 `docs/assets/v0112-output-card.jpg`。

## [0.10.11] - 2026-11-07

### Changed

- **输出预览默认 20 行**（此前 3 行）：摘要页签里「输出」的折叠预览改为前 20 行，仍保留「展开全文」看全部；1280 浮层里的输出预览同步改为 20 行。501 行以上的结果默认就能读到足够上下文。

### Verification

- 新增 1 例：55 行输出在摘要页签默认渲染 20 行（`line 20` 可见、`line 21` 不在），点「展开全文」后 55 行全部渲染。
- `pnpm typecheck` 0、`pnpm test` **540 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock 55 行输出 `scripts/verify/shoot-output-lines.mjs`）：折叠 20 行 → 展开 55 行；截图 `docs/assets/v0111-output-20lines.jpg`。

## [0.10.10] - 2026-11-07

### Fixed

- **figma 插件工具不再显示成通用扳手**：`figma_*`（`figma_status` / `figma_reconnect` / `figma_select_document` …）此前落在 generic 族（粉色扳手），现在单独成族：淡紫 `#c4b2ff` + layers（层叠）图标；`figma_select_document` 等会显示 `documentId` / `fileKey` 作为行详情。
- **todo 不再用灰色**：`todo_write` / `todo_read` 此前是灰色（`#9ba1a7`）+ 通用扳手；现在改成薄荷绿 `#8fdcb8` + 清单（list-checks）图标，`todo_write` 的详情直接显示 `N 项`（不再是 `todos · N 项`）。
- 两者的概览分布 / legend / 轮次 mix 现在分别统计 `figma`、`todo`（mock 会话 legend：`bash 3 · read 3 · edit 2 · figma 1 · skill 1 · todo 1 · 其他 2`）。

### Verification

- 新增 4 例：tool-summary 2 例（todo 计数 / figma 图标与 documentId）、trail-tab 1 例（族 class + 专用 glyph，无灰色）、detail-styles 1 例（todo 薄荷 / figma 淡紫，且无灰色 todo 规则）。
- `pnpm typecheck` 0、`pnpm test` **539 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock 事件 `scripts/verify/shoot-turnmix.mjs`）：figma_reconnect = layers 淡紫、todo_write = 清单薄荷 + `2 项`、custom_tool = 粉色扳手（generic）、bash/read 保持原色；截图 `docs/assets/v0110-tool-families.jpg`。

## [0.10.9] - 2026-11-07

### Fixed

- **折叠轮次卡的 mix 漏掉 skill 计数**：头部工具族统计只取数量 Top 4，加载 skill 这种「语义事件」数量通常很少，会被 mcp / bash / read / edit 等挤掉。现在 `skill` 若存在必占一席（其余取数量 Top 3），总项数仍为 4。
- 实测（mock 轮次：bash 2 / read 2 / edit 2 / custom 1 / skill 1）修复前第 4 项是通用扳手、skill 不显示；修复后显示 `bash 2 · read 2 · edit 2 · skill 1`。

### Verification

- 新增 1 例：5 个工具族、skill 数量最小，仍出现在 mix，且 mix 总项数仍为 4。
- `pnpm typecheck` 0、`pnpm test` **535 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock 事件 `scripts/verify/shoot-turnmix.mjs`）：mix items = shell2 / read2 / edit2 / skill1；截图 `docs/assets/v0109-turn-mix.jpg`。

## [0.10.8] - 2026-11-07

### Changed

- **展开轮次的体做 tree 缩进**：展开后，输入行 / 步骤行 / 消息行 / 并行组 / 详情带 / 轮次脚注整体左缩进 **14px**，视觉上从属于该轮标题（`#N 时间 时长 步数`），折叠卡仍保持满宽。
- 详情带随缩进占 `358`（dock 400；此前 372），内部命令 / Markdown 等布局不变。

### Verification

- 新增 1 例样式回归：`.ttl-turn[data-collapsed="false"] .ttl-turnBody { padding-left: 14px }`，基础 `.ttl-turnBody` 不带缩进。
- `pnpm typecheck` 0、`pnpm test` **534 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2）：`rowIndentVsHead = 14`、`iconIndentVsTag = 14`、展开详情带 `358`；截图 `docs/assets/v0108-tree-indent.jpg` / `v0108-tree-band.jpg`。

## [0.10.7] - 2026-11-07

### Changed

- **命令分段换行更整齐**：详情「命令」区的 `&&` / `;` 连接符从「下一行行首」移到「上一行行尾」，每一行都以命令词开头：
  ```
  cd /Users/lzx/.../dsh-trace-inspect &&
  pnpm install 2>&1 | tail -4 &&
  echo "=== BUILD ===" &&
  pnpm build 2>&1 | tail -3
  ```
- 渲染层用 `shown[i+1].connector` 把连接符附加到当前行末尾，`&nbsp;` 粘住最后一个词（软换行时不会单独掉到下一行）；内联详情带与 1280 浮层使用同一规则；`splitCommand` 数据模型不变（连接符仍记录在它所引入的段上）。

### Verification

- 新增 1 例：3 段命令的行文本为 `cd /tmp &&` / `sed -n 1p a.ts ;` / `echo done`，没有行以 `&&` / `;` 开头，且恰好 2 个 trailing connector。
- `pnpm typecheck` 0、`pnpm test` **533 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2）：4 段命令的 4 行分别以连接符结尾、下一行以命令词开头；截图 `docs/assets/v0107-command-tail.jpg`。

## [0.10.6] - 2026-11-07

### Changed

- **skill 工具单独成族**：`skill` 不再落进通用工具（扳手）——新增 sparkle（四角星）字形 + 青色家族色 `#63c9d1`；chip 仍用统一中性底，只有字形 / 图例着色。
- **行详情只显示 skill 名称**：`skill {"name":"figma-workbench"}` 的行显示 `skill  figma-workbench`，不再出现 `name figma-workbench` 的原始 key。
- 会话概览的工具分布 / legend 增加 skill 段（label `skill`），筛选 chips 仍按工具名。

### Verification

- 新增 `tests/tool-summary.spec.ts` 1 例 + `tests/trail-tab.spec.tsx` 1 例（label / detail / ttl-tone-skill / sparkle path）；`pnpm typecheck` 0、`pnpm test` **532 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，mock 事件 `scripts/verify/shoot-skillrow.mjs`）：行 label `skill`、desc `figma-workbench` / `ui-ux-pro-max`、字形 ink `rgb(99,201,209)`、legend `bash 1 · skill 2`；截图 `docs/assets/v0106-skill-row.jpg`。

## [0.10.5] - 2026-11-07

**输入行统一样式**：展开轮次里的用户输入不再是一整行大字 preview，改为展开体第一行，与工具/输出同一套 32px 行。

### Changed

- 输入行改为 `.ttl-itemInput.ttl-msgRow`：中性 chip + 蓝色用户字形 + 「输入」+ 前 32 字预览 + 「还有 N 字符」，行高 32 / `padding: 0 22px 0 14px` / 8px gap，正文列与 `.ttl-stepDesc` 严格同列。
- 点击输入行保持 v0.4 起的定位行为（跳回对话里的这条用户消息）；展开态不再重复渲染头部 preview。折叠卡仍是原来的 2 行 preview；切到工具筛选 / 搜索时输入行隐藏，头部 preview 照常显示。
- 删除 v0.9 的「展开态隐藏输入行」规则（`.ttl-turn[data-collapsed="false"] .ttl-itemInput`）与旧的蓝点 / 标签样式。

### Verification

- 更新/新增 2 例：输入行作为展开体首行 + 点击定位 + 过滤时隐藏；长输入同样出现 char budget。`pnpm typecheck` 0、`pnpm test` **530 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2）：输入行 `399×32`、chip `18×18 @ x=1055`、preview x=**1221** = `.ttl-stepDesc` x、预览宽 128、meta `还有 82 字符`；截图 `docs/assets/v0105-input-row.jpg`。

## [0.10.4] - 2026-11-07

### Fixed

- **输出行文本列与工具描述列对齐**：v0.10.3 为了多留预览宽度把「输出」角色列压到 40px，导致输出消息的正文比工具描述左移约 92px。现在 `.ttl-msgRole` 恢复为 `var(--ttl-step-name-w, 52px)`（与 `.ttl-stepName` 同列），输出预览从工具描述同一 x 起排。

### Verification

- 实机（19487 / dock 400 / dsf2）：`.ttl-stepDesc` x=1221，`[data-testid="ttl-output-preview"]` x=1221（严格同列）；行仍为 `399×32`，chip `18×18 @ x=1055`，预览宽 102、meta `还有 558 字符`、chevron 12。
- `pnpm typecheck` 0；`pnpm test` **529 例 / 22 文件**；`pnpm build` 通过。截图 `docs/assets/v0104-output-aligned.jpg`。

## [0.10.3] - 2026-11-06

**输出消息改为单行行式**：助手消息不再用「引用块 + 3 行截断」，改为与工具步骤同一套 32px 行——消息图标 + 「输出」+ 前 32 字预览 + 「还有 N 字符」+ chevron，点开就地展开完整 Markdown 全文。

### Changed

- 输出行重写为 `.ttl-msgRow`：32px 行高、`padding: 0 22px 0 14px`、8px 间距，与 `.ttl-step` 同一栅格；chip 复用步骤的 18px 中性 chip，字形保持消息绿 `#4ed4a4`。
- 预览取原文前 32 字：压平换行、去掉最常见的 Markdown 标记（标题/列表/粗斜体/行内 code/链接），截断时补 `…`；右侧 meta 显示「还有 N 字符」（zh）/「N more chars」（en），数字带千分位。
- 点击/键盘展开完整正文：有 Markdown 结构走 `MarkdownResult`，否则原文 `white-space: pre-wrap`；展开体 `.ttl-msgBody` 只在打开时挂载。
- 删除旧的引用块实现与内联 Markdown 预览（`inlineMarkdown`、`.ttl-msgText`、`.ttl-msgMore`、`.ttl-msgRule` 等）；短消息（≤32 字且单行）保持单行，无 chevron / 字符数、点击不动作。

### Verification

- 新增 2 例：长输出单行 + 「还有 N 字符」+ 点击展开全文；短输出无展开 affordance。`pnpm typecheck` 0、`pnpm test` **529 例 / 22 文件**、`pnpm build` 通过。
- 实机（19487 / dock 400 / dsf2，`scripts/verify/shoot-outputrow.mjs`）：输出行 `399×32`、chip `18×18 @ x=1055`（与工具行同列）、预览 `194` 宽、meta `还有 558 字符`、chevron `12`；展开后 body `399×398`、渲染完整 Markdown；截图 `docs/assets/v0103-output-collapsed.jpg` / `v0103-output-open.jpg`。

## [0.10.2] - 2026-11-06

**步骤行图标与连线对齐原型 2-02**：ICON 统一中性底色、恢复图标之间的 1px 竖线、失败行统一用告警三角。

### Changed

- **统一 ICON 底色**：所有工具族共用同一个中性 chip（`var(--dsw-alias-bg-layer-2)`，深色主题 `#2c2c2e`，与原型 2-02 实测 `rgb(44,44,47)` 一致），不再按 bash / read / edit / MCP / 通用各染一层；字形仍保留家族色。报错行保留红底，并改成不透明 `color-mix(...)`，避免竖线透过 chip。
- **恢复「ICON 与 ICON 之间竖着的那条线」**：1px、`rgba(255,255,255,.08)`、对齐图标中心（`left:23px`）+ chip 不透明 → 只在图标上下 7px 空隙可见（实测空隙色 `rgb(52,52,53)`，原型 2-02 为 `rgb(52,52,52)`）；并行组的琥珀色分组竖线保留，组内同样有灰线连接。
- **失败行统一告警图标**：`result.isError` 的工具行不再显示被染红的工具家族图标，与 wire `error` 行一样显示警示三角（原型 2-02 / 6-06「失败」）。

### Verification

- 新增样式回归 `tests/detail-styles.spec.ts` 3 例（chip 统一 / 报错红底不透明 / 竖线恢复且居中）、行为回归 `tests/trail-tab.spec.tsx` 1 例（isError 工具行 → ⚠ path）。
- `pnpm typecheck` 0；`pnpm test` **527 例 / 22 文件**；`pnpm build` 通过。
- 实机（`trace-verify` / 19487 / dock 400 / dsf2）：`.ttl-stepIcon` bg `rgb(44,44,46)`、`.ttl-stepRail` `1×32 @ left 23px`、全部行 `display:block`、error chip `color(srgb 0.267 0.172 0.175)`；对比图 `docs/prototype/compare/02b-icon-rail.jpg`，截图 `docs/assets/v0102-*.jpg`。

## [0.10.1] - 2026-11-06

### Fixed

- **侧栏 tab 报 React error #300**（`Rendered fewer hooks than expected`）：`TrailTab` 的 `stepNameWidth` `useMemo` 位于 `if (!visible) return null` 之后，切换侧栏 tab（visible=false）时少执行一个 hook，再切回即崩溃。已把该 hook 移到 early return 之前，并新增「隐藏 → 再显示」回归测试。
- 验证：`tests/trail-tab.spec.tsx` 新增 1 例，`pnpm test` **523 例 / 22 文件**；typecheck/build 通过。

## [0.10.0] - 2026-11-06

**工具输出自动格式化**：结果按「JSON → JSONL → Markdown → 原文」启发式选择渲染方式，不再一律显示原始字符串。

### Added

- `src/client/output-format.ts`：纯函数检测器 `detectOutputKind()` / `parseJsonValue()` / `parseJsonLines()` / `prettyJsonText()`。规则保守：只有**整段**能 parse 才算 JSON，多行则要求**每一行**都是 JSON 才算 JSONL；混合日志、ANSI、diff 一律原文。
- 摘要 tab 的「输出」预览：JSON/JSONL 先 `JSON.stringify(…, 2)` 再走 3 行折叠，缩进可读。
- 结果 tab：JSON → `JsonPretty` 结构化渲染（沿用长值折叠/查看器）；JSONL → 按数组渲染；Markdown → `MarkdownResult`；其余 → `RawText`。
- 默认页签策略：检测到 JSON / Markdown 的结果**默认走渲染**（不再因为 bash 默认 raw 而先显示原始串）；显式点「原文」仍可切回。
- 结果栏 meta 的类型标签按检测显示 JSON / JSONL / Markdown / 文本；JSON/JSONL 结果也提供「渲染 / 原文」分段（此前只有 Markdown 有）。
- 修复 JsonPretty 与旧 .ttl-jsonKey::after 冲突导致的双冒号：伪元素收窄为 .ttl-jsonRow .ttl-jsonKey::after，只作用于 JsonTree。

### Verification

- 新增 `tests/output-format.spec.ts`（5 例：JSON/JSONL/Markdown/混合日志/diff/大小上限）。
- `pnpm typecheck` 0；`pnpm test` **522 例 / 22 文件**；`pnpm build` 通过。实机截图见 `docs/assets/v0100-*.jpg`。

## [0.9.9] - 2026-11-06

### Changed

- 通用工具（未知工具）的扳手图标不再使用灰色，改为**粉色 `#f472b6`**：与 bash 紫 / read 蓝 / edit 琥珀 / MCP 绿 / error 红区分开；概览的「其他」legend 点与分布条同步为粉色。

### Verification

- 实机（19487 / dock 400）：`.ttl-stepIcon.ttl-tone-generic` color rgb(244,114,182)、bg rgba(244,114,182,.14)，扳手 path 不变；legend/分布条同色。截图 `docs/assets/v099-wrench-color.jpg`。
- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` 通过。

## [0.9.8] - 2026-11-06

### Changed

- 未知工具的 `generic` 图标由方块改为**同风格扳手（wrench）**：与 terminal/file/search/mcp 等图标同为 1.7 stroke 线性语言，避免「方块」被误读为模块/包；错误行仍用红色告警三角。

### Verification

- 实机（19487 / dock 400）：`send_message` / `wait_agent` / `team_*` 等行显示扳手；其它族图标与错误三角不变。截图 `docs/assets/v098-wrench.jpg`。
- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` 通过。

## [0.9.7] - 2026-11-06

**列表静音 + 配色去重**：去掉定位箭头与并行次数徽标，edit 与 MCP 不再撞色。

### Changed

- 移除定位 `↗`：步骤行、轮次头、消息块、输出行的箭头全部隐藏（DOM 保留供键盘/后续入口），chevron 保留。
- 移除轮次头部的 `∥N` 徽标；错误徽标 `✗N` 保留。
- 工具族配色：bash 紫、read 蓝、**edit/write 琥珀 `#f2b45c`**、**MCP 绿 `#34d399`**、todo 灰 `#9ba1a7`；mix、详情图标、概览 legend 与分布条全部跟随同一套色（此前 legend/分布条仍用旧绿/粉）。

### Verification

- 实机（19487 / dock 400）：箭头与 `∥N` computed display=none，chevron 11/11 可见；edit/write rgb(242,180,92)、mcp rgb(52,211,153)、todo rgb(155,161,167)；legend/分布条同色；无横向滚动。截图 `docs/assets/v097-quiet.jpg`、`docs/assets/v097-legend.jpg`。
- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` 通过。

## [0.9.6] - 2026-11-06

### Fixed

- 模型消息块展开后，完整 Markdown 继承了旧输出行的 `padding-left: 64px`，导致正文右移、宽度从 347 收窄到 269；现在 `.ttl-msg .ttl-output-body` 显式 `padding: 0`，展开与折叠正文左缘对齐。
- 折叠态内联 Markdown 不支持「粗体内嵌 code」：`**改名为 \`dsh-trace-inspect\`**` 会把反引号原样显示；现在先解析粗体、再在粗体内递归解析行内 code。

## [0.9.5] - 2026-11-06

**模型文本输出改为引用块**：assistant 消息不再复用工具行的「绿点 + 输出 + 原文」，改为独立的阅读块。

### Changed

- 输出块：左侧 2px 绿色竖条 + 很淡底色 + 顶部小图标/「输出」角色标签/发丝分隔线；正文 12.5px/19，**内联渲染加粗与行内 code**，3 行截断 + 「展开全文」；悬停显示 `↗` 定位。
- 展开后显示完整 Markdown（标题/列表/代码块），提供「收起」。
- 保留 `ttl-item-output` / `ttl-output-wrap` / `ttl-output-body` / `ttl-output-jump` testid；新增 `ttl-output-toggle`。

### Fixed

- 折叠的助手文本此前直接显示原始 `**...**` 标记，现在加粗/行内 code 正常渲染。

### Verification

- 实机（19487 / dock 400）：`.ttl-msg` 引用块、3 行 clamp、展开完整 Markdown、悬停才显示 ↗；截图 `docs/assets/v095-output.jpg`、`docs/assets/v095-output-open.jpg`。
- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` 通过。

## [0.9.4] - 2026-11-06

**展开态左右留白**：轨迹展开后不再紧贴面板两侧。

### Changed

- `.ttl-turn .ttl-step` 左右内边距 6/14 → **14/22px**；并行黄线随之内移到 `left:10px`；输出/输入行右侧 20px；「显示更早」左右 18px。
- 详情带宽度保持 372px（margin 13.5），列表无横向滚动。

### Verification

- 实机（19487 / dock 400）：icon x=1055（+8）、耗时右缘距面板 22px、黄线 left 10px、desc 可用 139px；root/list scrollWidth=clientWidth=399，无横向滚动。截图 `docs/assets/v094-padding.jpg`。
- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` 通过。

## [0.9.3] - 2026-11-06

**并行表达进一步极简**：不再有「∥ 并行 ×N」文字行，改由一条黄色连接线表达同一批调用；同时去掉贯穿图标的灰色时间线。

### Changed

- 并行组不再渲染 `.ttl-parallelHead`（`∥ 并行 ×N` / hint / 合计时长整行移除）；语义保留在 group 的 `aria-label` 与 `title`（悬停可读「同一助手步骤内下发的 N 个工具调用…」），轮次头部 `∥N` 徽标不变。
- 并行组左侧新增 **2px 琥珀色连接线**（`#f2b45c`，上下各内缩 6px、圆角），把同批 tool 连成一个视觉单元。
- 普通步骤行不再有贯穿 icon 的灰色竖线（`.ttl-stepRail` 保留 DOM 但 `display:none`），列表更干净；并行行与普通行 icon/name 的 x 坐标完全一致（无缩进、无错位）。

### Verification

- 实机（19487 / dock 400）：`.ttl-parallelHead` 数量 0；5 组同屏；黄线 2px `rgb(242,180,92)`、top/bottom 6px；`.ttl-stepRail` display none（221/221 行）；并行行与普通行 icon x=1047、name x=1073，delta 0。
- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` 通过。截图 `docs/assets/v093-parallel.jpg`。

## [0.9.2] - 2026-11-06

**工具名完整显示**：工具/服务名列不再固定 52px 截断。

### Fixed

- 工具名列改为按当前可见步骤的**最长名字自适应宽度**（CSS 变量 `--ttl-step-name-w`，52–132px），`playwright`、`team_task_create`、`spawn_teammate`、`open-computer-use` 等不再显示为 `playwri…` / `open-…`；同一根节点内所有行共享列宽，desc 起点保持对齐。
- 空参数工具（解析成功的 `{}`）不再把 `{}` 当描述，只显示工具名。

### Verification

- 实机（19487 / Playwright / dock 400）：`--ttl-step-name-w=132px`（该会话存在超长名）、`.ttl-stepName` `overflow=false`、5 条采样 descX 一致（1213）；截图 `docs/assets/v092-names.jpg`。
- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` 通过。

## [0.9.1] - 2026-11-06

**视觉修正（按实机反馈）**：并行组减重、未知工具补通用图标、MCP 成败配色与失败行状态。

### Fixed

- **并行组视觉过重**：去掉整行浅底与 2px 粗紫轨，改为 1px 淡紫发丝轨 + 9.5px 小标题（`∥ 并行 ×N`），隐藏重复的「同一助手步骤内并行下发」hint，右侧合计时长降为 9px muted。
- **未知工具图标**：`generic` 原来渲染成几乎不可见的 6px 圆点，现改为统一的 cube 图标；错误行改用告警三角图标（红色），不再复用 generic。
- **MCP 成功/失败对比**：MCP 家族色由粉色改为**绿色**（成功），失败行红色；图标同为插头，靠颜色 + 状态区分。
- **失败结果行一致性**：`tool/result` 报错（`result.isError`，如 MCP TimeoutError）此前仍显示 ✓/普通底色，现在整行按错误态渲染（✗ + 淡红底 + 红色描述），与 `error` 行一致。

### Verification

- `pnpm typecheck` 0；`pnpm test` 516 例 / 21 文件；`pnpm build` + bundle 契约自检通过。
- 实机（trace-verify 19487 / Playwright / dock 400）补拍：并行组 `background: transparent`、轨 1px、标题 9.5px；未知工具 cube 图标；MCP 成功绿 `rgb(52,211,153)` / 失败红 `rgb(242,90,90)` + ✗ + 行淡红底；截图见 `docs/assets/v091-*.jpg`。

## [0.9.0] - 2026-11-06

**界面重设计（v0.9 原型 → 实现）**：按 `docs/prototype/` 的 8 帧原型重写侧栏与浮层的视觉/结构；数据折叠、并行分组、跳回对话、按需完整内容等行为保持不变。

### Added

- **列表总览**：`N 轮 · M 步` 头部 + 搜索（⌘F，内存子串过滤 name/args/result）+ 会话概览条（步数/轮数/失败数/总时长 + 工具族分布条 + legend）。
- **轮次三行卡**：`#N` + `HH:mm` + 时长 + 工具族 mix（≤4）+ 错误/并行徽标 + 步数 + 定位 + 2 行 preview；展开体「输入 → 步骤/并行组 → 输出 → 汇总」。
- **步骤时间线**：32px 行 = 工具族色 icon chip + mono 工具名 + 单行人话描述 + ✓/✗ + 单步时延；失败行整行标红；↗ 仅 hover/选中显示。
- **并行组同级化**（语义修正）：并行调用与普通步骤**同列、不缩进**，只用整行浅底 + 2px 紫色时间线 + `∥ 并行 ×N` 分组头（含「N 个调用 · 合计时长」）标注归属。
- **详情带四页签**：摘要 / 结果 / 参数 / 原始；摘要按工具族渲染——bash 命令按 `&&`/`;` 分段 + 语法高亮 + 软换行（超过 12 段折叠「展开全部 N 段」）、read/write/edit 文件块、MCP 参数表、其他参数表 + 输出预览。
- **MCP 调用**：行内拆成「服务 · 工具 · 人话参数」（如 `figma download_assets · 5 个节点 · PNG @2x`），详情展示 MCP 徽标/连接状态、带类型徽标的参数表（数组折叠 chips + `+N`）、结果文件列表；未知工具的原始 JSON 预览也改为 `key value` 人话摘要。
- **放大阅读浮层**：1280×800 双栏（256px 步骤大纲 + 宽版阅读区），面包屑/状态 pill/搜索/复制/导出/关闭，四页签与详情带同源；保留 Esc/↑↓/⌘F/⌘C/⌘E 键盘模型。
- **状态与边角**：骨架屏、空会话、错误卡（错误码 + 重试/复制）、长命令折叠、底部常驻状态条（同步状态 + seq + 「有新更新↓」内联按钮）。
- **单步时延数据**：`TrailStep` 新增 `startedAt` / `endedAt`（来自 wire `event.time`），UI 只展示真实时间戳，缺失即省略。

### Changed

- `styles.ts` 重写为「设计 token + 内容面复用 + v0.9 shell/detail/overlay」结构；颜色收敛到 v0.9 调色板（54 色白名单）并继续使用 `var(--dsw-*)` fallback。
- `tool-summary.ts`：MCP `label` 改为服务名并新增 `server/toolName` 字段与 `mcpArgsSummary()`；未知工具增加对象参数的人话摘要。
- `ZoomOverlay.tsx` 重写为双栏；共享原语（图片/剪贴板/字节格式化）抽到 `ui-shared.tsx`，四页签类型抽到 `detail-types.ts`；新增 `format.ts`（时长/时刻/工具族）与 `command-format.ts`（命令分段与 token 化）。
- `TrailTab.tsx` 重写为 v0.9 结构（搜索/概览/三行卡/时间线/并行组/状态），内部 `StepDetail` 抽到 `StepDetail.tsx`。

### Verification

- `pnpm typecheck` 0；`pnpm test` **516 例 / 21 文件** 全绿；`pnpm build` + bundle 契约自检通过。
- 独立 `trace-verify` web profile（DSH web，端口 19487，Playwright Chromium 1440×900 @2x，真实会话 11 轮 / 763 步 / 747 个 `tool/call`）逐帧实拍：dock 400px、`.ttl-step` 32px、`.ttl-detail` 372px、`.ttl-parallel` 缩进 0、`.ttl-zoomPanel` 1280×800、chips `scrollWidth=clientWidth=399`。
- 逐帧对比图与差异记录：`docs/prototype/compare/`、`docs/verification-v09.md`（原型 vs 实机：列表 / 展开 / 详情命令 / 详情结果 / MCP / 浮层）。

## [0.8.0] - 2026-10-25

**并行工具调用可视化**：同一助手步骤内下发的多个 tool 调用在轮次轨迹里折叠成一个「∥ 并行 ×N」组，折叠态轮次表头也能看到并行组数。

### Added

- **并行组（assistant-step batch）**：DSH 的 `tool/call` 事件自带 `turn` + `step`；`step` 就是一次助手响应。同一个 `(turn, step)` 下的多个 tool 调用 = 模型在**一条响应里并行下发**的一批调用（DSH 随后交给工具调度器：并发安全的工具走并行池，其余走独占屏障）。轨迹面板现在把**连续的**同一步骤调用折成一个组：
  - 组标题 `∥ 并行 ×N`（en: `Parallel ×N`），悬停解释判定依据（同一助手步骤内下发，DSH 可能按并发安全策略串行执行）；
  - 组内行加一条发丝级左侧竖线 + 缩进，一眼看出这是「一批」而不是 N 个独立步骤；
  - 组内每一行原有的展开详情、`↗` 定位、键盘操作完全不变；筛选 chips 仍逐行生效（筛选后同一步骤仍有 ≥2 行才成组，剩 1 行则平铺）。
- **轮次表头徽标**：展开/折叠都在表头显示 `∥N`（N = 该轮并行的组数），悬停给出「N 组并行调用 · 共 M 次」；折叠轮次不用展开就能看出这一轮有没有并行调用。
- **无数据的旧日志不变**：缺少 `step` 的历史日志（或孤儿结果行、错误行）不参与分组，外观与 v0.7.0 完全一致。

### Changed

- `TrailStep` 新增可选的 `turn` / `step`（来自 `tool/call.data`，wire 早已透传）；新增纯函数 `parallelGroupsOf` / `groupParallelItems`，UI 只消费折叠结果，不采信相邻性、耗时等启发式。

### Verification

- `pnpm typecheck` 0 / `pnpm test` **510 例 / 21 文件** / `pnpm build` + bundle 契约自检。
- 新增：`tests/parallel-groups.spec.ts`（14：身份写入、两种折叠实现一致、连续/断组/旧日志/孤儿/切片），`tests/trail-tab.spec.tsx` +7（组标题与徽标、两组分离、折叠态徽标、旧日志无组、chips 重分组、组内行交互、中文文案）。
- 判定依据来自真实会话日志（`/Users/lzx/.dsh/sessions/--Users-lzx-Documents-GitHub-dsh-trace-inspect--/session-2720edba-…/session.v4.jsonl.zstd`：747 个 `tool/call` 中 128 组同 `(turn, step)` 的并行批次，最大 5 个）与 App 内置 DSH 0.2.1-rc.2 的 `dsh-agent-loop` 调度源码。
- 实机复核（独立 `trace-verify` profile，端口 19487，App 内置 DSH 0.2.1-rc.2 + Playwright，真实会话 11 轮 / 763 步 / 747 个 `tool/call`）：7 个含并行批次的轮次表头分别显示 `∥76`、`∥18`、`∥18`、`∥2`、`∥5`、`∥2`、`∥1`（turn 1 = 76 组 / 163 次），展开体出现 `role=group` 的 `并行 ×2` 组（`bash` + `job_kill` 两行，组内 `↗` 保留）；截图 `/tmp/v080-parallel-panel.png`。

## [0.7.0] - 2026-10-17

**长参数可读性（方案 B + C，按选定口径）**：`\n` 还原为真实换行、超长值默认折叠、单值中央查看。

### Added

- **长字符串折叠成块（B）**：参数 JSON 里长度 ≥ **160 字符**的字符串不再内联成一行，而是显示为
  `1,240 字符 · 6 行` 的块，带 `展开 / 复制 / ⤢`。**默认折叠**（按选定口径），展开后就地显示**真实换行**（JSON 的 `\n` 转义还原为多行），可再收起。复制始终复制**解码后的完整文本**，不是转义串。
- **单值中央查看器（C）**：块上的 `⤢` 打开居中浮层，**只显示这一个值**——行号、软换行（不再横向滚动）、`⌘F`/搜索框内查找并高亮（含匹配计数与「无匹配」）、`⌘C` 复制全文、Esc 关闭并把焦点还给触发按钮。超长值最多渲染 4000 行（复制仍是全文）。
- 参数 JSON 改为**结构化渲染**（逐行、全展开、无折叠节点），短值仍严格等同 `JSON.stringify` 的内联形式（`"cmd": "ls"`），长值才走块；行渲染上限 2000 行，超出给「显示全部」。

### Fixed

- 参数页里长命令（1–4 KB 的 bash/heredoc）此前只能横向滚动、尾部根本看不到；现在「块 → 展开 → 中央查看器」三级都能完整读到。
- 嵌套在放大浮层里的值查看器关闭时，Esc 不再同时关掉浮层（键盘归属先给最上层对话框）。

### Verification

- `pnpm typecheck` 0 / `pnpm test` **489 例 / 20 文件** / `pnpm build` + bundle 契约自检。
- 新增：`tests/value-viewer.spec.tsx`（7）、`tests/json-pretty.spec.tsx` 重写（8：结构/阈值/默认折叠/展开真实换行/查看器/复制）。
- 样式纪律：新增段颜色全部走 `var(--dsw-*)`，无裸 hex/rgba（既有 CSS 纪律测试保持绿色）。

## [0.6.0] - 2026-10-17

**详情面板可读性重做**（按使用反馈的四条）。

### Changed / Added

- **工具行改成语义摘要 + 图标**：不再直接打印裁剪后的参数 JSON。
  - `bash` → `bash <description>`（没有 description 时取命令行首行）；
  - `read` / `write` / `edit` → `read package.json` 这样的文件名（完整路径保留在悬停 tooltip）；
  - `glob` / `grep` → 显示 pattern；`ls` 等目录类 → 显示路径；
  - `mcp__<server>__<tool>` → `mcp:<server> <tool> {…}`；
  - 每行前置 13px 内联图标（terminal / file-read / file-write / file-edit / search / folder / plug），未知工具仍用原来的语义色点；
  - 纯函数在 `src/client/tool-summary.ts`，11 个单测覆盖映射与边界（长文本裁剪、非 JSON 参数、Windows 路径、mcp 两种拼写）。
- **参数页改为格式化 JSON，且默认全展开**：`src/client/json-pretty.tsx` 用语法着色的 `<pre>` 渲染完整文档，不再需要逐层点开 `{3}`；超大文档（默认 20 万字符）才出现「+N」增量展开。行内详情带与放大浮层共用。
- **长内容可在页面中央查看**：详情带右上角新增「⤢ 在中央查看」；**点击参数/结果/原始面板空白处**也会在页面中央打开查看器（点面板内的按钮/有文本选区时不触发），并落在当前页签（浮层新增 `initialTab`）。查看器沿用居中浮层（1080×760、role=dialog、Esc、↑↓、⌘F、⌘C、导出 JSON）。
- **输出（assistant 消息）可点开看全文**：折叠态仍是 2 行预览，点击就地展开完整内容（Markdown 照常渲染），再点收起；定位回原位的动作移到行尾 `↗`，与工具行一致。

### Verification

- `pnpm typecheck` 0 / `pnpm test` **478 例 / 19 文件** / `pnpm build` + bundle 契约自检。
- 新增：`tests/tool-summary.spec.ts`（11）、`tests/json-pretty.spec.tsx`（4）、`tests/trail-tab.spec.tsx` +4 个交互用例；旧标记断言同步（`ttl-json` → `ttl-json-pretty`、行首 dot → 图标）。

## [0.5.2] - 2026-10-17

### Fixed

- **侧栏 tab 名称固定为「轮次轨迹」**，不再随界面语言变化。DSH 的界面语言跟随系统/浏览器 locale（Electron 下是 `en-US`），所以 v0.5.1 的「跟随 DSH locale」在桌面客户端里仍会渲染成 "Turn Outline"。按所有者要求，tab 名固定为中文产品名；**面板内其它文案**（含 better-sidebar 引导页的 `description`）继续跟随 DSH 界面语言，v0.5.1 的 locale 服务修复保留。
- 回归测试同步：en-US 宿主下 `title()` 仍是「轮次轨迹」；`description` / `detectLang()` 的 locale 链路（`locale=zh` + `navigator.language=en-US`、反向、`zh-CN` 归一化、实时切换、`html[lang]` 回退、服务抛错）单独覆盖。

## [0.5.1] - 2026-10-17

### Fixed

- **侧栏 tab 名称不跟随界面语言（中文界面显示 "Turn Outline"）**：标题以前只读 `navigator.language`，而 Electron 里它回报的是 Chromium 默认的 `en-US`，即使 DSH 界面是中文。现在改为跟随 DSH 官方 client `locale` 服务：`ctx.get('locale').getLocale().active` 作为主信号（`zh-CN` 这类区域标签会归一化），`locale.subscribe` 跟随运行时切换；`html[lang]` 与 `navigator.language` 只在服务缺失时回退。**同一个根因**也让面板内的文案在 Electron 下退化成英文，一并修正。
- tab 的 `description`（better-sidebar 引导页标题下的一行说明）同样改为走字典 + `detectLang()`，不再硬编码语言判断。
- 新增 6 个回归用例（`tests/client-apply.spec.tsx`）：`locale=zh` + `navigator.language=en-US` → 「轮次轨迹」（复现用户场景）、反向覆盖、`zh-CN` 归一化、运行时切换、`html[lang]` 回退、locale 服务抛错时不崩。

## [0.5.0] - 2026-10-17

**完成 v1.0 之外的剩余项**：会话授权图片缩略图、按需完整内容、P2 放大阅读浮层、`mergedFrom` 可见提示，以及两处在独立 profile 实机复核中发现的正确性修复（F7/F8）。

### Fixed（实机复核发现，均有真实浏览器证据）

- **F7 `surfaceOp.replace` 曾把工具参数一起改写**：被压缩替换的步骤，行预览与「参数」页都会显示 `[dsh-jev-compaction] …`，原始命令完全看不到（而日志里 `tool/call.arguments` 完好）。现在 `replace` **只改写 `result`**，`args`/`argsPreview`/`argsBytes`/`argsTruncated` 保持调用原值；「结果」页仍显示替换后的摘要 + `已被压缩替换（seq #N）`。契约 §6.3.2/§9.3#7 已标记被 §11.2 覆盖。
- **F8 `read` 结果的 XML 信封曾被整段当 Markdown 渲染**：DSH `read` 返回 `<path>…</path><type>file</type><content>1: …</content>`，整段喂给渲染器会退化成一段转义文本（`&lt;path&gt;…`），表格/代码围栏永远渲染不出来。新增 `unwrapFileResult()`：**仅** `type=file` 且路径为 `.md`/`.markdown`/`.mdx` 时解包出行号剥离后的正文再渲染（并剥离末尾工具 chrome `(End of file - total N lines)` / `(Showing lines A-B of N. …)`）；其它类型一律走等宽原文。

### Added

- **图片缩略图（会话授权）**：新增 `GET /trace-inspect/api/attachment?sessionId&attachmentId`，**只有**当该会话的事件流里存在引用该 `attachmentId` 的 `image` 块时才读取字节（防越权枚举），字节经 host `attachments.readImage()` 取得；授权结果按会话 LRU（≤16，TTL 10s）缓存。client 侧 `<img>` 懒加载缩略图，失败回退占位 chip + `imageLoadFailed`。**不再只是占位 chip。**
- **按需完整内容**：新增 `POST /trace-inspect/api/tool-detail`（`{sessionId, seqs[]}` ≤ 32，不施 `ARGS_CAP`/`RESULT_CAP`，响应 ≤ 8 MiB 并按 UTF-8 码点边界二次截断）。client 在展开「参数/结果被截断」的步骤时自动拉取完整内容（inflight 去重、失败保留预览 + 重试），页脚显示 `已载入完整内容`。
- **P2 放大阅读浮层**（`src/client/ZoomOverlay.tsx`，`React.createPortal(document.body)`）：入口 = 详情页脚 `⤢` 或步骤行聚焦时 `⌘⇧O`/`Ctrl+Shift+O`；左侧当前轮次步骤大纲、右侧复用 JSON 树 / Markdown / 原文三页签；`Esc` 关闭、`↑/↓` 切步、`⌘F` 搜索、`⌘C` 复制、`⤢` 导出 JSON；`role="dialog"` + `aria-modal`，关闭后焦点回到触发行。
- **`mergedFrom` 可见提示**：`TrailResult.mergedFrom` 记录合并进该步内容的 `tool/result` 事件数（append 递增、replace 重置为 1）；当 `>1` 且没有 `replacedBy` 时，详情带显示 `该内容由 N 条结果合并，事件未声明 surfaceOp` —— 把 F4（surfaceOp 全链路丢失时的静默脏拼接）变成**可见**提示，而不是只在文档里记一笔。
- 新增文案键 13 个、CSS 类 20 个（i18n 与主题 token 齐全）。

### Changed

- 版本 `0.4.0` → `0.5.0`；`lib/` 随源码一并提交（构建逐字节可复现，CI 用 `pnpm check:lib` 防漂移）。
- client bundle 现在除 `react` / `@deepseek-ai/dsh-client-ui-primitives` 外还 `require("react-dom")`（浮层用 `React.createPortal`）。三者都是宿主共享种子（`build.mjs` 的 `external`），**没有新增 npm 运行时依赖**；产物白名单断言同步为三个。
- `ToolDetailItem.seq` 的 JSDoc 明确为「调用方请求的那个 seq（call seq 或任一 result seq），`arguments`/`content` 始终是整步内容」（T10 F-V4）；契约 §3.3「与到达顺序无关」限定为「replace 的目标已登记时」（T10 F-V3，真实链路不可达）。

### Verification

- 本地门禁：`pnpm typecheck` / `pnpm test`（**452 例 / 17 文件**）/ `pnpm build` / `pnpm check:lib` 全绿（提交后）。
- **独立 profile 实例的浏览器级复核**（`trace-verify`，端口 19487，Playwright + 真实会话）：U1–U7 的实机项已关闭，证据与原始数值在 `docs/verification-v1.md` §10 与契约 §11.5。
- 两组**独立**对抗验收（`tests/verify-detail.spec.ts` 70 例 + `tests/verify-v050.spec.tsx` 56 例），共 12 条发现全部处置（修复或明确记录为已知局限/未证实项）。

## [0.4.0] - 2026-10-17

**详情增强版（P0+P1+P1.5）**：在侧栏内就地展开任一步查看完整参数、工具结果（Markdown 渲染）、图片与错误；同时把包名切到本仓库的独立身份 `dsh-trace-inspect`。

### Changed（身份与协议）

- 包名 / client bundle id / cordis patch id / 路由统一改名：`dsh-turn-outline` → `dsh-trace-inspect`，路由 `/turn-outline/api/events` → `/trace-inspect/api/events`，better-sidebar tab id `turn-outline` → `trace-inspect`（用户可见标题仍为「轮次轨迹 / Turn Outline」）。
- **发行方式**：`lib/`（`index.js` + `client.js` + sourcemap）**提交进仓库**——官方安装路径是 `dsh plugin add github:xx529/dsh-trace-inspect`，而 git 来源的插件在 pnpm 构建脚本闸门下不保证执行 `prepare`，随源码交付构建产物可让安装路径不依赖构建步骤（构建逐字节可复现，已实测）。CI 新增 `pnpm check:lib`（`scripts/check-lib.mjs`：断言 `lib/` 已被 git 跟踪、且 `git status --porcelain --ignored` 在 `pnpm build` 后为空）防漂移；最初用 `git diff --exit-code HEAD -- lib` 是**假绿**（git diff 看不见未跟踪路径，独立验证报告 F1/N3），已替换。`prepack` 仍会在 `pnpm pack` 时重新构建。本地开发路径：`verifyDepsBeforeRun: false`（避免 `pnpm test/typecheck` 期间嵌套安装）。
- `package.json` 的 `homepage`/`repository`/`bugs` 指向本仓库；保留 upstream 作者与 MIT 归属（新增 `contributors`）。
- 构建产物契约自检新增：bundle id、`@deepseek-ai/dsh-client-ui-primitives` 守卫 require（仅当 Markdown 详情视图打进 bundle 时检查）、host 路由字符串（`build.mjs`）。
- **不新增任何 npm 运行时依赖**：`@deepseek-ai/dsh-client-ui-primitives` 只做 ambient 类型声明 + 运行时守卫 `require`（宿主未提供时降级为原文渲染），esbuild 侧标 external。

### Added（P0 数据层）

- 工具参数不再被砍到 512 字符：`ARGS_CAP` 512 → **32768**，并新增 `argsBytes` / `argsTruncated` 让 UI 能如实标注「完整 / 已截断」（实测本机会话 43% 的参数超过 512 字符，最大 25,661）。
- `tool/result` 的 `message.content` 不再被丢弃：投影保留 text 块（≤ `RESULT_CAP` = 32 KiB）与 image 块（只留 `{attachmentId,mediaType,bytes,width,height,name}`，不内联 base64），并带 `contentBytes` / `contentTruncated` / `isError`。
- 透传 `surfaceOp` 与 `sourceEventSeqs`（`append` 与 `{op:'replace',startSeq,endSeq}` 两种形态）。
- **页级字节预算** `PAGE_BUDGET_BYTES` = 2 MiB：单页响应先到者截断（event 数或字节数），每页至少 1 条，`hasMore` 语义不变；长会话缓存上限 32 MiB → 64 MiB。

### Added（P0 模型层）

- `TrailStep` 新增 `args` / `argsTruncated` / `argsBytes` / `errorCode` / `result` / `orphan`；新增 `TrailResult` / `TrailResultImage`。
- 按 `callId` 关联 `tool/call` 与 `tool/result`；`append` 结果**按 seq 顺序合并**（乱序到达结果一致）；`surfaceOp.replace` 按 `[startSeq,endSeq]` **改写**目标步骤的参数与结果（实测该区间指向被替换的 **tool/result** 的 seq），旧长文不再出现，并显示替换摘要 + `已被压缩替换（seq #N）`。
- 找不到对应 call 的结果生成**孤儿占位行**（`orphan: true`），不再静默丢弃。
- 已冻结轮次中的步骤被改写时显式 `markDirty`，否则 `TrailFolder` 复用对象身份会让 React 跳过重渲染（本次最容易出 bug 的点，已配专项单测）。
- `foldTurns`（全量）与 `TrailFolder`（增量）语义一致，配同一 fixture 的对比测试。

### Added（P1 视图层）

- 工具行**点击 = 就地展开详情带**，跳转语义移到行尾 `↗` 按钮；`Alt+点击` 可同时展开多步（默认同时只开 1 个）。
- 详情带页签：`参数`（可逐层折叠的 JSON 树，长字符串折叠成块 + 单字段复制）/ `结果`（Markdown 渲染 ⇄ 原文一键切换）/ `原始`。
- 结果 Markdown 用运行时自带的 `MarkdownText`（`variant="compact"`、`streaming={false}`，禁 raw HTML / 不安全协议）；按工具记忆默认视图：`read`/`web_fetch` 默认渲染、`bash`/`pwsh` 默认原文；非 Markdown 内容（纯日志、ANSI、错误堆栈）自动回退原文；超 64 KiB 只渲染前段 + 「展开全部」。
- 失败结果显示错误名 / 错误码 + 原文；图片块显示占位 chip（`name · mediaType · WxH · bytes`）；底部标注完整度、seq、替换来源、孤儿提示。
- a11y：`aria-expanded` / `aria-controls` / `role="region"` / `role="tab"`，`←/→` 收起/展开；筛选变化时自动收起被筛掉的步骤，会话切换清空展开态。
- 折叠态行结构与既有样式 token 不变（详情带只在实际展开的步骤上渲染）。

### Known limitations（未做 / 待确认）

- **surfaceOp 全链路丢失时无可见降级提示**：若顶层 `surfaceOp`/`sourceEventSeqs` 与 `data.surfaceOp` 三者同时丢失（只会由本插件自身的 host 投影 + client 折叠同时回归造成，链路上没有第三方 hop），已开启轮次的结果会退化为 append（旧长文与新内容相接），无开启轮次的结果按 v0.3.1 语义丢弃并显示替换前的旧长文。独立验证报告 F4 记录，本次接受为已知局限（见 `docs/verification-v1.md` / `docs/detail-contract-v1.md` §9.5）。
- **图片不解析附件 URL**：只显示占位 chip。`app.asar` 里只找到 `/attachments/v1/{objects,files,file-objects}` 字符串，未能确认插件可用的 attachment URL 模板（未验证）。
- 未做规格书 §5.3 的按需详情接口（当前 cap 已覆盖实测 p100）。
- 未做 P2 放大浮层（ZoomOverlay）与全量键盘导航。
- 未在真实浏览器/桌面会话里验证：折叠态像素级一致、超宽表格溢出、明暗主题对比度、≥100 轮真实会话的内存与卡顿（见 `docs/verification-v1.md` §5 的 U1–U6）。

## [0.3.1] - 2026-09-30

### Fixed（0.2.0 聊天视图折叠行定位）

- **工具步骤 / 已完成轮次的过程行跳回失效**：DSH 0.2.0 默认折叠已完成轮次的过程组（演示策略 `foldCompletedTurns` + 步骤分组），折叠的成员行（`tool-call`、`assistant-step`）**仍挂在 DOM 里但带 `hidden="until-found"`**（为浏览器页内查找保留可发现性）。`scrollIntoView()` 对这种行没有渲染盒，静默无效——表现为提示已定位而视图不动。现在跳转复用 0.2.0 自己的揭示契约：向行及其祖先派发 `beforematch` 事件（聊天视图的 `useSearchableHidden` 监听它并展开折叠组），等行真正可见后再滚动；超过 10 帧仍不可见则如实报 `row-hidden` 失败，不再假成功（`src/client/trail-jump.ts`）。
- **老轮次（如轮次 1/2）定位命中错误位置 / 首点失败**：历史回溯改用 0.2.0 会话控制器的专用跳转装载器 **`loadThrough(seq)`**（一次调用反向翻页直到事件窗口覆盖目标 seq），替代逐页 `loadOlder()` 循环（0.1.x 无此 API 自动回退旧循环）；同时给节点查找与行查找各加跨帧重试——会话投影在 notify 后才重建 chat node store，此前首次点击可能读到旧窗口（定位到错误行）或行尚未提交（报无法定位）。测试 94 → 100（`src/client/trail-jump.ts` / `tests/trail-jump.spec.ts`）。

## [0.3.0] - 2026-09-28

### Changed（DSH 0.2.0-rc.x 适配线）

- **适配 DSH 0.2.0-rc.2（DSH Desktop 2.0.17 内置运行时）+ better-sidebar 0.24.1**。0.2.0 对本插件消费的三处客户端缝做了重构，逐一迁移：
  - session binding 的 `getSnapshot()` 不再携带 `chat.nodes` 与 `views`（chat 视图模型与 trajectory 视图模型全部迁入新的会话视图注册表）。跳回逻辑改走官方 `ctx.uiConversation.binding(sessionId)`（`chat` target 的 `nodes` Map 仍含 `{key, anchorSeq, visibility}`；`trajectory` target 的 `{eventNodes, requests}` 字段与旧快照同形），并在无该服务时回退旧版快照字段（0.1.x 双线兼容）（`src/client/trail-jump.ts` / `src/client/TrailTab.tsx`）。
  - chat 行 DOM 锚点：0.2.0 分组行的 `data-chat-anchor-key` 是 JSON 对（`[nodeKey, groupPart]`），裸节点键改由新增的 `data-chat-node-key` 承载。行定位现在两个属性都匹配（`src/client/trail-jump.ts`）。
  - client `sessions` 服务的提供方从旧 `@deepseek-ai/dsh-client-runtime` 种子（0.2.0 已移除该模块）迁到 `@deepseek-ai/dsh-api-session-controller`；`package.json` 的 `dsh.client.inject` 同步指向 0.2.0 模块并新增 `@deepseek-ai/dsh-client-ui-conversation`（`package.json`）。
- **host live 零拷贝快路径兼容 0.2.0**：0.2.0 把 live Session 的冻结日志从 `.events` 属性改为 `snapshotEvents()` 方法（`snapshotEvents` 沿用 DSH 侧命名，冻结数组身份稳定、零拷贝语义不变）。现在优先探测方法、旧属性兜底，活跃会话路径在两条 DSH 线上都保持同步零拷贝（`src/index.ts` / `src/context-types.ts`）。
- 订阅源增加 0.2.0 binding 的 `eventSource`（client 事件窗 feed，事件追加即触发节流刷新）；`session.subscribe` 保留，同源合并不叠加成本（`src/client/useTrail.ts`）。
- tab descriptor 新增 `description`：0.1.5-rc.1+ / 0.2.0 的原生右侧栏 + 菜单会在标题下渲染说明行（`src/client/index.tsx`）。
- 事件数据形状逐字段核对（0.2.0 session format v4）：`turn/start → data.turn`、`user/message → data.content + data.source.kind`、`assistant/message → data.message.content`、`tool/call → data.callId + data.arguments`、`tool/result → data.message.source.callId + data.error.{name,code}`、`compaction/summary → data.summary`，折叠投影（`src/wire.ts`）无需改动即兼容。
- peer 声明放宽为 `dsh-better-sidebar >=0.17.0`：可选 peer + 运行时特性探测下，宽区间是诚实声明；未安装时依旧 inert。
- 轨迹行键兼容：assistant 行在旧 `assistant\0turn\0step` 之外新增 0.2.0 的 `assistant\0seq\0<seq>` 候选（tool 行 `tool\0call\0<callId>` 语法 0.2.0 未变）。
- 测试 80 → 94：live 快路径双形态（`snapshotEvents()` / `.events`）、conversation 注册表装配、双线跳转、`data-chat-node-key` 分组行匹配、descriptor `description` 等（`tests/`）。

### 兼容性

| 组合 | 状态 |
|---|---|
| DSH 0.2.0-rc.2 + better-sidebar 0.24.1（本机 Desktop 2.0.17 实测环境） | ✅ 目标线 |
| DSH 0.1.2-rc.1 + better-sidebar 0.18.0 | ✅ 回退兼容（旧快照跳转 + `.events` live 路径） |
| DSH 0.1.1-rc.x（stable）+ better-sidebar 0.17.1 | ✅ 回退兼容 |

## [0.2.7] - 2026-09-04

### Changed

- 适配 better-sidebar 0.18.0（DSH 0.1.2-rc.1 正式线）：peer 声明放宽为 `dsh-better-sidebar@^0.17.0 || ^0.18.0`（0.x 语义化版本下 `^0.17.0` 不覆盖 0.18.x）。0.18.0 对插件面 API 为零变化（上游 #537 纯版本升级；`registerTab(descriptor): () => void` 与 `TabDescriptor` 各字段原样保留），已在新组合（DSH 0.1.2-rc.1 + better-sidebar 0.18.0）真机联调；0.17.1 + DSH 0.1.1-rc.x stable 线继续支持（`package.json` / `README.md` / `README.en.md`）。
- host 路由 `/turntrail/api/events` 改名 `/turn-outline/api/events`，与包名对齐（client 请求方 `src/client/useTrail.ts`、README 权限说明、host 测试同步更新；该路由为插件内部契约，client+host 同包原子发布，无外部消费者）。测试 80 通过（`tests/host.spec.ts`）。

## [0.2.6] - 2026-09-04

### Changed

- 更换「轮次轨迹」tab 图标：ui-primitives `IconBranchOutline16`（与源代码管理同形的分支图标）→ 内联 Lucide `route` SVG（ISC，两个端点 + S 形绕线，仅 3 个元素；中途曾试 4 节点 waypoints，选中态 14px 下偏拥挤后定稿 route），呼应「轨迹」意象且不再与源代码管理混淆；同时移除 client 对 `@deepseek-ai/dsh-client-ui-primitives` 的依赖（inject 声明、esbuild external 与惰性 require 全部摘除），tab 字形零依赖自绘（`src/client/index.tsx` / `build.mjs` / `package.json`）。

### Performance

- 冷会话 lastSeq 探针加 2s TTL（`PROBE_TTL_MS`）：`sessionQuery.listEvents` 在 sessionQuery 内部是整份日志重读 + 逐事件 `structuredClone` + 全量 `foldSurface`，此前每次冷请求（含多页 drain 的每一页）都要付一次全量成本；现在探针结果按 TTL 复用，大会话冷启动首开成本从 O(页数×n) 降到 O(n)（`src/index.ts`）。
- 缓存字节预算改为投影时逐事件累计，去掉独立的全量 `JSON.stringify` 与多 MB 巨型中间串（`src/index.ts`）。
- client drain 达到 `MAX_PULL_PAGES` 上限且仍有余页时经节流路径自动续拉，超大会话首载不再静默截断；续拉链带守卫——tab 隐藏、会话/代际变更或本轮零 seq 进展（停滞传输）即停（`src/client/useTrail.ts`）。测试 77 → 80。

## [0.2.5] - 2026-09-04（首个对外发布版）

> 0.2.2 ~ 0.2.4 为内部迭代版本号推进，未单独发布；相关改动合并记录于本版。

### Fixed

- 修复工具筛选 chips 的颜色引用：`toolColorClass`（未定义）→ `toolDotClass`（`src/client/TrailTab.tsx`）。此前会话含工具步骤时渲染工具 chips 会抛 ReferenceError；已补回归覆盖（用例 74 → 77）。

### Changed

- 样式细节与本地化微调（`src/client/styles.ts` / `src/client/locales.ts` / `src/client/useTrail.ts`）。

## [0.2.1] - 2026-09-03

**功能**：在 dsh-better-sidebar 侧边栏注册「轮次轨迹」tab——按用户轮次折叠会话（输入 + 工具步骤 + 输出），一键定位回对话原位；零 AI 依赖、只读零侵入。

**性能重构**：

- host 零深拷贝：活跃会话直接借用冻结快照，O(1) 探测 + O(delta) 增量。
- 响应逐页 + 字段裁剪：每页 PAGE_SIZE 事件，tool 结果只保留 error 字段。
- client 增量折叠：TrailFolder 只重折打开中的轮次，每轮刷新 O(delta)。
- 行 key 用 seq：新步骤追加不重挂。
