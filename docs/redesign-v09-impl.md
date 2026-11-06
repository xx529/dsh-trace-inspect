# v0.9 重设计落地 · 实施契约（Agent Teams 版）

> 目标：按 `docs/prototype/` 的 8 帧原型重写客户端 UI 的视觉与结构；**数据层（fold / parallel group / jump / detail fetch）行为不变**。
> 原型图：`docs/prototype/*.png`（2x，400×880 侧栏 / 1280×800 浮层 / 设计系统）。
> 本文件定义文件归属、DOM/class 契约、接口与验收口径；实现细节由各 owner 读现有代码后决定。

## 0. 文件归属（禁止越界写）

| owner | 只允许写 | 禁止 |
|---|---|---|
| Lead | `src/trail-model.ts` 时间戳字段、`src/client/tool-summary.ts`（MCP）、`src/client/locales.ts`、`src/client/styles.ts` 组合入口、`tests/**`、`docs/**`、根配置 | 改 shell/detail/overlay 组件 |
| shell-view | `src/client/TrailTab.tsx` | 改 `StepDetail.tsx`、`styles.ts`、模型 |
| detail-view | 新建 `src/client/StepDetail.tsx`、`src/client/command-format.ts` | 改 `TrailTab.tsx`、`styles.ts` |
| overlay-view | `src/client/ZoomOverlay.tsx` | 改 `TrailTab.tsx`、`StepDetail.tsx`、`styles.ts` |
| css-foundation | `src/client/styles.ts`（整文件重写，保留内容类） | 改任何 TSX |
| verify-lab | `scripts/verify/**`、`/tmp/verify/**` | 改 `src/`、`lib/` |

**集成顺序**：各 owner 先按契约写 → Lead 合并类型错误 → `pnpm typecheck` → `pnpm build` → verify-lab 截图 → 逐帧比对 → 修正。

## 1. 设计 token（css-foundation 直接落地为 CSS 变量/字面量）

```
--ttl-panel:#232324; --ttl-layer2:#2a2a2b; --ttl-layer3:#35363a; --ttl-code:#171719; --ttl-detail-bg:#1e1e20;
--ttl-tx1:#f3f4f6; --ttl-tx2:#cfd3d6; --ttl-tx3:#9ba1a7; --ttl-tx4:#7b8086; --ttl-tx5:#5f6469;
--ttl-blue:#7cb2ff; --ttl-blue-deep:#4c8dff; --ttl-green:#4ed4a4; --ttl-red:#f2726f; --ttl-amber:#f2b45c;
--ttl-violet:#b39cf5; --ttl-pink:#f08fb8; --ttl-cyan:#63c9d1;
工具族：shell=#a78bfa read=#60a5fa edit=#34d399 mcp=#f08fb8 todo=#f2b45c error=#f2726f
字体：UI=PingFang SC/system；code=JetBrains Mono/SF Mono 等
字阶：15/13/12.5/12/11.5/11/10.5/10/9.5；行高 1.4~1.5
圆角：4/6/8/10；浮层 14；徽标 3~4；pill 999
}

必须继续使用 DSH alias token 作为 fallback 外层（`var(--dsw-alias-bg-layer-1, #232324)`），保证亮色皮肤不崩。
```

## 2. 侧栏 shell（TrailTab.tsx + styles.ts）

### 2.1 头部 / 搜索 / 筛选 / 概览
```
.ttl-root[data-testid=ttl-root]
 ├ header.ttl-header
 │  ├ span.ttl-brandIcon(route svg)  h2.ttl-title「轮次轨迹」  span.ttl-count[data-testid=ttl-count]「7 轮 · 208 步」
 │  ├ button.ttl-follow[data-testid=ttl-follow-toggle][aria-pressed]「· 跟随」
 │  └ button.ttl-iconBtn[data-testid=ttl-more]「⋯」
 ├ div.ttl-searchRow > div.ttl-search
 │  ├ svg.ttl-searchIcon  input.ttl-searchInput[data-testid=ttl-search][placeholder=搜索步骤、文件或命令]
 │  └ kbd.ttl-kbd「⌘F」
 ├ div.ttl-filters[data-testid=ttl-chips]
 │  ├ button.ttl-chip[.ttl-chipSelected][data-testid=ttl-chip-all] 全部 <span.ttl-chipCount>
 │  ├ button.ttl-chip[data-testid=ttl-chip-failed] <span.ttl-chipDot.ttl-dot-red> 失败 <span.ttl-chipCount>
 │  ├ button.ttl-chip[data-testid=ttl-chip-<tool>]（bash/edit/read…，mono 标签）
 │  ├ button.ttl-chip.ttl-moreChip[data-testid=ttl-chip-more]「⋯」 + div.ttl-toolDropdown[data-testid=ttl-tool-dropdown]
 ├ div.ttl-summary（新增，可折叠/常驻）
 │  ├ div.ttl-summaryTop：span.ttl-summaryStat「208 步 · 7 轮」  span.ttl-summaryFail「失败 7」  span.ttl-summaryDur「28m」
 │  ├ div.ttl-dist > i.ttl-distSeg（按工具族占比着色）
 │  └ div.ttl-legend > span.ttl-legendItem > i.ttl-legendDot + 文案
 └ div.ttl-list[data-testid=ttl-list] ...
```
- 搜索：对已加载 steps 的 `name/argsPreview/result.text` 做**大小写不敏感子串过滤**（客户端内存过滤即可），空结果显示 `.ttl-emptyFiltered`。
- 概览条数据：`turns.length`、`stats.total/failed`、`stats.tools`（按工具族归并）、总时长 = Σ(turn.endedAt-startedAt)；无 endedAt 时省略时长。
- 跟随/更多/筛选 chip 行为沿用现有逻辑与 testid。

### 2.2 轮次卡（三行）
```
section.ttl-turn[data-testid=ttl-turn][data-collapsed][data-active][data-error]
 ├ div.ttl-turnHead
 │  ├ span.ttl-turnTag[data-testid=ttl-turn-tag]「#7」
 │  ├ span.ttl-turnTime「14:31」 span.ttl-turnDur「2m18s」
 │  ├ span.ttl-turnMeta
 │  │   ├ span.ttl-mix（每族 i.ttl-mixItem：svg + 数字）
 │  │   ├ span.ttl-badge.ttl-badgeErr[data-testid=ttl-error-dot]「✗1」
 │  │   ├ span.ttl-badge.ttl-badgeParallel[data-testid=ttl-turn-parallel]「∥2」
 │  │   ├ span.ttl-stepsNum[data-testid=ttl-steps-count]「38 步」
 │  │   ├ button.ttl-locateBtn[data-testid=ttl-locate]（↗ 定位回对话）
 │  │   └ span.ttl-chevron（可旋转）
 │  └ （head 整体可点展开/收起：用 button.ttl-turnToggle 包裹标题区）
 ├ p.ttl-turnPreview（2 行 clamp；data-testid=ttl-turn-preview）
 └ div.ttl-turnBody（展开时）
```
- 时间：`turn.startedAt` → `HH:mm`；`turn.endedAt - turn.startedAt` → `Xm Ys / 48s`。
- mix：`turn.items` 里的 tool steps 按族计数（bash/read/edit/mcp/other），最多 4 个；错误数单独红色徽标。
- 展开体顺序：input 行 → parallel/step 行交错 → output 行 → `.ttl-turnFoot`（`38 步 · 2 个并行组 · 1 失败 · 2m18s`）。

### 2.3 步骤行（时间线）
```
div.ttl-stepWrap[data-testid=ttl-step-wrap][data-open][data-kind=tool|error]
 ├ button.ttl-step[data-testid=ttl-step][data-step-kind]
 │  ├ span.ttl-stepRail
 │  ├ span.ttl-stepIcon.ttl-tone-<shell|read|edit|mcp|error>（ToolIcon，16px）
 │  ├ span.ttl-stepName（mono 10.5，宽 52，省略）
 │  ├ span.ttl-stepDesc（12px，单行省略；错误行红）
 │  ├ span.ttl-stepStatus（✓/✗ 10px）
 │  └ span.ttl-stepDur（10px mono）
 ├ button.ttl-stepJump[data-testid=ttl-step-jump]（↗，仅 hover/选中显示）
 └ StepDetail(...)（open 时）
```
- 行高 32px；错误行整行 `background: rgba(242,114,111,.08)`、desc/状态红。
- hover 背景 `rgba(255,255,255,.04)`；选中（详情打开）`rgba(76,141,255,.12)` + 左侧 2px 蓝轨 + 跳转按钮常显。

### 2.4 并行组（**同级、不缩进**）
```
div.ttl-parallel[data-testid=ttl-parallel-group]
 ├ div.ttl-parallelHead[data-testid=ttl-parallel-head]
 │  ├ span.ttl-parallelMark「∥」 span.ttl-parallelLabel「并行 ×N」
 │  ├ span.ttl-parallelHint「同一助手步骤内并行下发」
 │  └ span.ttl-parallelAgg「N 个调用 · 0.8s」
 └ div.ttl-parallelBody（步骤行与普通行同列：icon 6 / name 30 / desc 86 / 右 332）
```
- 组视觉：整行宽 `rgba(255,255,255,.018)` 底 + 2px 紫色时间线（`#a78bfa .55`），**不缩进、不加框**。
- 头部 `role=group`、`aria-label` 沿用。

### 2.5 输入/输出/状态
- 输入行：`.ttl-item.ttl-itemInput`（蓝点 + 输入 2 行 + 定位），沿用 testid `ttl-item-input`。
- 输出行：`.ttl-item.ttl-itemOutput`（绿点 + 2 行 + 展开），testid `ttl-item-output`；展开体 `ttl-output-body`。
- 压缩提示：`ttl-item-compaction`。
- 底部状态条：`.ttl-statusbar`（同步点 + 只读文案 + seq）。
- 空/加载/错误：`.ttl-skeleton`（3 行骨架 + 底部「正在读取事件流…」）、`.ttl-empty`（图标+标题+说明）、`.ttl-errorCard`（红图标+错误码+重试/日志按钮）。
- 保留 `ttl-to-bottom`、`ttl-jump-banner`、`ttl-show-earlier`、`ttl-status`、`ttl-error`、`ttl-empty-filtered` 等 testid。

## 3. 详情带（StepDetail.tsx，detail-view 所有）

### 3.1 接口（TrailTab import）
```ts
export interface StepDetailProps {
  id: string
  step: TrailStep
  sessionId: string
  lang: Lang
  view: ResultView                     // 'rendered' | 'raw'
  onSetView(seq: number, view: ResultView): void
  onLoadDetail(seq: number): Promise<ToolDetailResult>
  onZoom(step: TrailStep, trigger: HTMLElement | null, tab?: DetailTab): void
}
export type DetailTab = 'summary' | 'result' | 'params' | 'raw'
export function StepDetail(props: StepDetailProps): React.ReactElement
```
旧实现里 `StepDetail` 是 TrailTab 内部函数；现在抽到新文件，TrailTab 只 import。旧 `DetailTab = 'params'|'result'|'raw'` 扩展为四值；ZoomOverlay 的 props 同步改为四值（overlay-view 负责）。

### 3.2 DOM
```
div.ttl-detail[data-testid=ttl-detail][data-tab]
 ├ div.ttl-detailHead
 │  ├ span.ttl-detailIcon.ttl-tone-<族>（22px chip + svg）
 │  ├ span.ttl-detailName（mono 11.5 Medium）  [MCP: span.ttl-detailSep「/」 + span.ttl-detailTool（tool 名）]
 │  ├ span.ttl-detailDesc（12，省略）
 │  ├ button.ttl-detailAction[data-testid=ttl-detail-copy]（复制）
 │  ├ button.ttl-detailAction[data-testid=ttl-detail-zoom]（放大）
 │  └ button.ttl-detailAction[data-testid=ttl-detail-close]（关闭）
 ├ div.ttl-detailStatus
 │  ├ span.ttl-statusDot[.ttl-dot-green|.ttl-dot-red] span.ttl-statusText「成功」
 │  ├ span.ttl-detailDur「1.1s」 span.ttl-detailSep「·」 span.ttl-detailSeq[data-testid=ttl-detail-seq]「seq #1185」
 │  └ span.ttl-detailMeta「参数 249 字符 / 参数 5 项 / 结果 2.4 KB」
 ├ div.ttl-tabs[role=tablist]
 │  ├ button.ttl-tab.ttl-tabSelected[data-testid=ttl-detail-tab-summary]「摘要」
 │  ├ button.ttl-tab[data-testid=ttl-detail-tab-result]「结果」
 │  ├ button.ttl-tab[data-testid=ttl-detail-tab-params]「参数」
 │  └ button.ttl-tab[data-testid=ttl-detail-tab-raw]「原始」
 ├ div.ttl-detailBody[data-testid=ttl-detail-body-<tab>]
 └ div.ttl-detailFoot[data-testid=ttl-detail-foot]
    ├ span.ttl-pill.ttl-pillOk|.ttl-pillWarn[data-testid=ttl-detail-pill]「完整 / 已截断 / 已加载」
    ├ span[data-testid=ttl-detail-seq] seq
    └ button[data-testid=ttl-detail-view-center]「在中央查看 ⤢」
```

### 3.3 摘要 tab（按工具类型）
- `bash/shell`：`section.ttl-section`（label「命令」+ hint「按 && / ; 分段 · 自动换行」+ 复制）→ `div.ttl-code`（每行 `ttl-codeLine > ttl-codeGutter + ttl-codeText`，段间 `&&/;` 用 op 色、画在上一行行尾（v0.10.7）；语法高亮：命令蓝/子命令常规/flag 琥珀/字符串绿/路径青/hash 紫）→ `ttl-codeFoot`；`参数` 键值表（`ttl-kv`）展示工作目录/描述等非命令字段；`输出` 折叠预览（`ttl-outBlock` + 展开全文）。
- `read/write/edit`：`ttl-fileBlock`（文件路径 mono + 行号/增删行 chip）。
- `mcp`：`ttl-mcpBlock`（MCP 徽标 + 「已连接」+ transport，数据不可得时只显示 server/tool）→ `参数` 键值表（key 值 + 类型徽标 `ttl-kvType`：string/number/boolean/array；数组折叠 chips + `+N`）→ `结果` 文件列表 `ttl-files > ttl-fileRow`（图标+文件名+大小）。
- 其他：参数键值表 + 输出预览。
- 命令分段/高亮逻辑放 `command-format.ts`：`splitCommand(cmd)` 返回 `{connector, tokens:[{text,kind}]}[]`，供渲染。

### 3.4 结果 / 参数 / 原始
- 结果：沿用 `MarkdownResult`（data-testid `ttl-md`、`ttl-md-raw`、`ttl-md-truncated`、`ttl-md-fallback`），顶部工具条 `.ttl-resultBar`（「结果」+ 大小行数 + 渲染/原文 segmented + 复制）；截断时 `.ttl-bannerWarn`（「结果被截断至 32 KiB」+ 加载完整内容 `data-testid=ttl-detail-load`）；图片沿用 `ttl-img-*`。
- 参数：沿用 `JsonTree`（`ttl-json*`）+ 完整加载/重试（`ttl-detail-load` / `ttl-detail-retry`）。
- 原始：原始参数/结果的 `<pre>`（`ttl-raw`），保留 `ttl-detail-unparsable` 提示。
- 压缩替换提示 `ttl-detail-merged`、直接 `ttl-raw`、空态 `ttl-detail-empty` 等 testid 保留。

## 4. 放大浮层（ZoomOverlay.tsx，overlay-view）

保留所有现有导出：`TrailImages`、``ZoomOverlay`、`copyToClipboard`、`toolDotClass`、`ResultView`、`formatBytes`、`downloadJson`（TrailTab 依赖）。`DetailTab` 改四值。
DOM：
```
div.ttl-zoom（fixed 全屏 + 遮罩 .ttl-zoomBackdrop）
 └ div.ttl-zoomPanel（1120×660 居中，r14，阴影）
    ├ header.ttl-zoomTop：brand/breadcrumb「轮次 #7 / 步骤 12」+ 状态 pill + 搜索框 + 复制/导出/关闭
    ├ div.ttl-zoomBody
    │  ├ aside.ttl-zoomOutline（256）：标题「步骤 12 / 38」+ turn 分组 + 步骤行（选中蓝轨）
    │  └ main.ttl-zoomMain：标题区（tool + desc + meta）+ tabs + 宽版内容（命令块 / 结果 / 参数 / 原始）
    └ footer.ttl-zoomFoot：快捷键（Esc/↑↓/⌘F/⌘C/⌘E）+ 只读状态
```
键盘：Esc 关闭、↑↓ 切步、⌘F 搜索、⌘C 复制、⌘⇧O 打开（保留现有行为）。

## 5. 数据/摘要增补

- `TrailStep` 增加 `startedAt?: number`（tool/call 的 event.time）与 `endedAt?: number`（tool/result 的 event.time），只用于 UI 时长；不改 fold 语义。
- `tool-summary.ts` MCP：`label = server`（`figma`），`detail = `${tool} · ${humanArgs}``，`icon='mcp'`；`humanArgs` 规则：`nodeIds` 数组→`N 个节点`；`path/url/query/format/name` 等字符串→截断值；否则 `N 个参数`。新增导出 `isMcpSummary`（或 `server/tool` 字段）供行/详情复用。
- 时长格式化（shell/detail 共用）：`formatDur(ms)` → `0.4s / 12.4s / 2m18s`。

## 6. 验收（每帧对比）

- `pnpm typecheck`、`pnpm test`、`pnpm build` 全绿（Lead 负责最终）。
- verify-lab 在 trace-verify 19487 + Playwright 截图：折叠列表 / 展开轮次 / bash 详情 / 结果 / MCP / 空态 / 浮层；与 `docs/prototype/*.png` 逐帧并排比对，记录差异（间距、字号、颜色、省略、顺序），迭代到「主要结构、层级、颜色一致」。
- 保留现有 `data-testid`（新控件可新增），行为回归由测试兜底。
