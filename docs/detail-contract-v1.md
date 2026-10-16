# dsh-trace-inspect v0.4.0 · 详情增强冻结契约（P0+P1+P1.5）

> 本文件是**冻结接口**。所有并行工作流必须严格按此实现；如需改动，先通知 Lead，由 Lead 更新本文件后再改代码。
> 需求来源：v0.4.0 开发规格书（范围 = P0 数据层 + P1 行内展开 + P1.5 结果完整度）；本仓库以**本文件**为权威实现口径，设计稿见 `docs/assets/detail-inline-expand.png`、`docs/assets/detail-result-markdown.png`。
> 全部结论均来自本机实测，未实测项已标注「未验证」。

## 0. 硬事实（实测，禁止推翻）

| 事实 | 证据 |
| --- | --- |
| `tool/result` 的**表面替换**事件真实形态：替换文本在 `data.message.content[].text`，`surfaceOp={op:'replace',startSeq,endSeq}` 指向**被替换的 tool/result 的 seq**（不是 tool/call 的 seq），同事件还带 `sourceEventSeqs:[seq]` | `/Users/lzx/.dsh/sessions/--Users-lzx-Documents-research--/session-8b8489a4-.../session.v4.jsonl.zstd` seq=182、183（`surfaceOp.startSeq=20/22`，均为原 tool/result 的 seq） |
| `isError` 位于 `data.message.isError`；`toolCallId` 位于 `data.message.toolCallId`，`source.callId` 亦可用 | 同上 seq=182；规格书 §3.1 |
| `MarkdownText` 精确 props：`{ text, streaming?, labels: MarkdownLabels, fileMentions?, pathImages?, variant?: 'body'\|'compact' }`；`MarkdownLabels = { code: MarkdownCodeLabels, footnotes: string }`；`MarkdownCodeLabels = { copyLabel, copiedLabel, toolbarLabels?: CodeToolbarLabels }`；`CodeToolbarLabels = { codeLabel, wrapLabel, unwrapLabel }`；`MarkdownDelegateProviderProps = { children, openExternalLink?, openFile?: (path, opts?: {line?}) => void, fileImages? }` | `npm pack @deepseek-ai/dsh-client-ui-primitives@0.2.0-rc.2` → `lib/types/markdown/MarkdownText.d.ts`、`render.d.ts`、`MarkdownDelegate.d.ts`、`CodeToolbar.d.ts` |
| 插件 client bundle 可以 `require('@deepseek-ai/dsh-client-ui-primitives')`（宿主注入） | `/Users/lzx/.dsh/profiles/desktop/node_modules/dsh-better-sidebar/lib/client.js:32` |
| 运行环境：DSH `0.2.0-rc.2`（cordis 4.0.4），better-sidebar `0.26.1`；当前 profile = `desktop` | `/Users/lzx/.dsh/evidence/turn-outline/desktop-runtime.json`；`/Users/lzx/.dsh/profiles/desktop/package.json` |
| 图片块结构：`{type:'image',attachment:{attachmentId,mediaType,bytes,width,height,name}}` | 规格书 §3.1（本机实测样例） |
| **未验证**：按 `attachmentId` 取图片 URL 的客户端契约（在 `app.asar` 里只找到 `/attachments/v1/{objects,files,file-objects}` 字符串，未确认可用 URL 模板） | 本次实测：`grep -a` 于 `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar` |

**图片处置（v1.0 冻结）**：不取 URL、不内联 base64；渲染**占位 chip**（`name · mediaType · WxH · bytes`）+ 文案 `imageLabel`。等附件 URL 契约被证实后再做缩略图。

## 1. 身份与改名（全仓库统一）

| 项 | 值 | 归属 |
| --- | --- | --- |
| npm 包名 | `dsh-trace-inspect` | Lead（package.json） |
| 版本 | `0.4.0` | Lead |
| client bundle id（`__ModuleLoader__.load({id})`） | `dsh-trace-inspect` | Lead（build.mjs） |
| cordis patch | `id: trace-inspect` / `name: dsh-trace-inspect` | Lead（cordis.patch.yml） |
| HTTP 路由 | `/trace-inspect/api/events` | T1（src/index.ts）、T4（src/client/useTrail.ts） |
| better-sidebar tab id | `trace-inspect` | T4（src/client/index.tsx） |
| 注入 `<style>` 的 dataset | `dsh-trace-inspect` | T4（src/client/index.tsx） |
| 用户可见 tab 标题 | 保持 `轮次轨迹` / `Turn Outline` | 不改 |

## 2. Host 投影契约（`src/wire.ts`）

常量（导出，测试会断言）：

```ts
export const TEXT_CAP = 2048            // 不变
export const ARGS_CAP = 32768           // 512 → 32768
export const RESULT_CAP = 32768         // 新增
export const PAGE_SIZE = 2000           // 不变
export const PAGE_BUDGET_BYTES = 2 * 1024 * 1024   // 新增
export const MAX_BODY_BYTES = 64 * 1024 // 不变
```

`projectEvent` 的 `base`：**所有事件类型**都透传
- `surfaceOp`：原样（`'append'` 字符串或 `{op,startSeq?,endSeq?}` 对象；非这两种形态则丢弃）
- `sourceEventSeqs`：仅当是非空 number 数组时透传

`case 'tool/call'` 的 `data`（新增字段一律「有才带」）：
- `name: string`
- `arguments: string` = `clipText(args, ARGS_CAP)`
- `argsBytes: number` = 裁剪前 `args.length`（UTF-16 码元数）
- `argsTruncated: boolean` = `args.length > ARGS_CAP`
- `callId: string`
- `turn?: number`、`step?: number`（`data.turn` / `data.step` 为 number 时）
- `message: { source: { kind?, callId? } }`（不变）

`case 'tool/result'` 的 `data`：
- `error?: { name?, code? }`（不变）
- `isError?: boolean` = `data.message.isError === true || data.isError === true`
- `callId: string`、`turn?`、`step?`、`message.source`（不变）
- `content?: Array<Block>`，`Block = {type:'text',text} | {type:'image',attachment:TrailResultImage}`：
  - text 块：跳过空串；`clipText(text, RESULT_CAP)`
  - image 块：`attachmentId`（string，必需）与 `mediaType`（string）；`bytes/width/height`（number 时带）；`name`（string 时带）
  - 保留原始顺序；数组为空则不带该字段
- `contentBytes: number` = 所有 text 块裁剪前字符数之和（仅在带 `content` 时出现）
- `contentTruncated: boolean` = 任一 text 块被裁剪

新增内部函数（T1 自定名，但行为冻结）：
```ts
function projectResultContent(content: unknown, cap: number):
  { blocks: Block[]; bytes: number; truncated: boolean } | undefined
```
`projectContent`（供 user/assistant 用）**保持只输出 text 块**，不得改动其行为。

`respondPage`（`src/index.ts`）加页级字节预算：

```ts
const lo = upperBound(events, afterSeq)
const hardEnd = Math.min(events.length, lo + PAGE_SIZE)
const tail = []
let bytes = 0
let i = lo
for (; i < hardEnd; i += 1) {
  const projected = project ? projectEvent(events[i]) : events[i]
  const size = Buffer.byteLength(JSON.stringify(projected))
  if (tail.length > 0 && bytes + size > PAGE_BUDGET_BYTES) break
  bytes += size
  tail.push(projected)
}
sendJson(res, 200, { events: tail, hasMore: i < events.length })
```
- 每页**至少 1 条**（否则预算小于单事件时会死循环）
- 预算与 `PAGE_SIZE` 取先到者；`hasMore` 语义不变
- `CACHE_MAX_BYTES`：32 MiB → **64 MiB**（`CACHE_MAX_ENTRIES` 保持 64）

## 3. 模型契约（`src/trail-model.ts`）

```ts
export interface TrailResultImage {
  attachmentId: string
  mediaType: string
  bytes: number
  width?: number
  height?: number
  name?: string
}

export interface TrailResult {
  /** 产出/追加这段内容的 tool/result 事件 seq（replace 发生时改为 replace 事件的 seq）。 */
  seq: number
  kind: 'text' | 'image' | 'mixed' | 'error'
  /** 已按 seq 顺序合并（append）或已被 replace 覆盖的最终文本。 */
  text: string
  images?: TrailResultImage[]
  truncated: boolean
  isError: boolean
  errorName?: string
  errorCode?: string
  /** 覆盖本内容的 replace 事件 seq（调试 + UI 提示）。 */
  replacedBy?: number
  /** 被覆盖区间的起点（= surfaceOp.startSeq）。 */
  replacedFrom?: number
}

export interface TrailStep {
  kind: 'tool' | 'error'
  seq: number
  name: string
  argsPreview: string        // 不变：折叠行用
  args?: string              // 新增：完整参数（wire 交付的原文，可能仍被 ARGS_CAP 截断）
  argsTruncated?: boolean
  argsBytes?: number
  callId: string | null
  error: string
  errorCode?: string
  result?: TrailResult
  /** 该 result 找不到对应 tool/call（孤儿占位行）。 */
  orphan?: boolean
}
```

**必须实现的行为（每条都要有单测）**

1. `tool/call` → 建步：`args`（完整）、`argsTruncated`、`argsBytes`；登记 `byCallId.set(callId, {builder, step})` 与 `seqIndex.set(seq, {builder, step})`。
2. `tool/result` 且 `error != null` → **保持 v0.3.1 旧行为**：额外生成一条 `kind:'error'` 步骤（`name=error.name`，`error=compact('name · code')`）。同时给该步骤挂 `errorCode` 与
   `result = { kind:'error', seq, text:<content 的 text 合并>, isError:true, errorName, errorCode, truncated }`。
   若已有同 callId 的 tool 步骤，**不要**把 error 内容挂到它上面（避免一行两处显示）；只登记 `seqIndex.set(resultSeq, errorStep)`（`byCallId` 已有则不覆盖）。
3. `tool/result` 且 `error == null`：
   - 按 `callId` 找步；找不到 → 建**孤儿占位步**（`kind:'tool'`、`name:'tool'`、`orphan:true`、`callId`），照样进 `items`/`steps` 与 `seqIndex`。
   - 内容按 `surfaceOp` 应用（内部用「分段表」实现，最终结果必须与到达顺序无关）：
     - `'append'`/缺省：把本事件文本/图片按 `seq` 升序合并进 `result.text`（同 seq 只留一条）；`images` 按 `attachmentId` 去重，按 seq 顺序；
     - `{op:'replace',startSeq,endSeq}`：把 **`seqIndex` 中 seq ∈ [startSeq,endSeq]** 的步骤的全部内容（`result` 及 `args`/`argsPreview`）**改写**为本次事件的内容；标记 `replacedBy = <本次事件 seq>`、`replacedFrom = startSeq`；`argsPreview = compact(新文本)`；`kind` 由新内容重算。找不到目标 → 退回按 `callId` 找；仍找不到 → 忽略（不得抛错）。
   - `result.kind` 判定：有 text 且有 image → `'mixed'`；仅 image → `'image'`；否则 `'text'`；`isError` 为真时 `'error'`。
   - 找不到 content 时也要挂 `result`（`text:''`、`truncated:false`），让 UI 知道这一步已经结束（`resultEmpty` 文案）。
4. **脏标记**：任何对已存在步骤对象的写入都必须 `markDirty(builder)`（`TrailFolder` 的 `frozen` 槽必须置空），否则已冻结轮次复用对象身份会导致 React 不重渲染。`foldTurns` 不需要（一次性折叠）。
5. **水位线**：`push()` 对 `seq <= lastSeq` 的去重保持不变；replace 事件自身 seq 更大，**不得**因为「目标 seq 更小」而被丢弃（用 `seqIndex` 反查，不用水位线）。要有专项单测。
6. **统计口径不变**：`stats.total` 计新增步骤数（孤儿占位计入）、`failed` 只计 `kind === 'error'` 步骤、`byTool` 对 `kind==='tool'` 计 name。
7. `foldTurns`（一次性全量折叠）与 `TrailFolder` 必须**同步实现**同一套语义，二者对同一事件流的输出必须一致（用同一组 fixture 跑双实现对比测试）。
8. 折叠/展开、`stepsCount`、`hasError`、`contextCount` 等既有口径不得回归。

## 4. 组件契约

### 4.1 `src/client/ui-primitives.ts`（新）
```ts
export interface PrimitivesModule {
  MarkdownText: React.ComponentType<{
    text: string; streaming?: boolean; labels: MarkdownLabels; variant?: 'body' | 'compact'
  }>
  MarkdownDelegateProvider: React.ComponentType<{ children?: React.ReactNode; openFile?: (path: string, options?: { line?: number }) => void }>
}
export function loadPrimitives(): PrimitivesModule | null   // 记忆化的守卫 require，失败返回 null
```
配套 `src/client/ui-primitives.d.ts`：`declare module '@deepseek-ai/dsh-client-ui-primitives'` 声明上述两个导出与 `MarkdownLabels`/`MarkdownCodeLabels`/`CodeToolbarLabels` 类型（**仅为类型**，不新增依赖）。
`loadPrimitives` 内部必须 `try { require('@deepseek-ai/dsh-client-ui-primitives') } catch { null }`（模块缺失/宿主变化时降级，不抛）。

### 4.2 `src/client/json-tree.tsx`（新）
```ts
export interface JsonTreeProps { value: unknown; maxDepth?: number; pageSize?: number; maxNodes?: number }
export function JsonTree(props: JsonTreeProps): React.ReactElement
export function parseJsonLoose(text: string): { ok: true; value: unknown } | { ok: false }
```
- 默认 `maxDepth = 32`、`pageSize = 50`、`maxNodes = 2000`。
- 折叠节点不构造子树（懒渲染）；超 `maxNodes` → 显示 `ttl-jsonCapped` + 文案 `jsonTooLarge`。
- 循环引用保护（`WeakSet`）。
- 长字符串（> 240 字符）折叠为 `.ttl-strbox`（max-height 52px、内滚动）+ 单字段复制按钮。
- 类名：`ttl-json`、`ttl-jsonRow`、`ttl-jsonKey`、`ttl-jsonToggle`、`ttl-jsonStr`、`ttl-jsonNum`、`ttl-jsonBool`、`ttl-jsonNull`、`ttl-jsonMore`、`ttl-jsonCapped`。
- `data-testid`：`ttl-json`、`ttl-json-toggle`、`ttl-json-more`、`ttl-json-capped`、`ttl-strbox`、`ttl-strbox-copy`。
- 复制走 `navigator.clipboard?.writeText`，缺失时静默忽略。

### 4.3 `src/client/markdown-result.tsx`（新）
```ts
export function looksLikeMarkdown(text: string): boolean         // §5 判定
export function defaultViewForTool(name: string): 'rendered' | 'raw'   // read/web_fetch/fetch/glob/grep → rendered，bash/bash_output/pwsh → raw，其余 raw
export function RawText(props: { text: string; className?: string }): React.ReactElement
export function MarkdownResult(props: {
  text: string; labels: MarkdownLabels; openFile?: (path: string, line?: number) => void; renderCap?: number
}): React.ReactElement
```
- `loadPrimitives()` 为 null 或 `!looksLikeMarkdown(text)` → 返回 `<RawText>`。
- 否则 `<MarkdownDelegateProvider openFile={...}><div className="ttl-md"><MarkdownText text streaming={false} labels variant="compact" /></div></MarkdownDelegateProvider>`。
- `renderCap` 默认 `64 * 1024`：超限只渲染前 `renderCap` 字符 + `.ttl-mdTruncated` 提示条（按钮 → `showAllLines` 文案，点击后渲染全文）。
- 表格溢出由 `.ttl-mdTableWrap`（CSS `:has(> table)` 或包裹元素）处理：横向滚动 + 右侧渐隐。
- `data-testid`：`ttl-md`、`ttl-md-raw`、`ttl-md-truncated`。
- 安全：只走 `MarkdownText`，**禁止** `dangerouslySetInnerHTML` / `innerHTML` / `eval`。

### 4.4 `src/client/markdown-labels.ts`（新）
```ts
export function markdownLabels(lang: Lang): MarkdownLabels   // 同一 lang 必须返回同一对象身份（模块级缓存）
```
内容：`code.copyLabel`（复制/已复制由 ui-primitives 内部状态切换，只传 `copyLabel`/`copiedLabel`）、`code.toolbarLabels = { codeLabel: '代码'/'Code', wrapLabel: '自动换行'/'Wrap', unwrapLabel: '不换行'/'No wrap' }`、`footnotes: '脚注'/'Footnotes'`。

### 4.5 `src/client/styles.ts`（T3 独占）
必须新增（全部 `ttl-` 前缀、只用 `--dsw-*` / `--ds-font-family-code` token、无硬编码颜色）：

`.ttl-stepWrap`、`.ttl-stepWrap[data-open="true"] .ttl-row`、`.ttl-caret`、`.ttl-caretOpen`、`.ttl-jump`、`.ttl-detail`、`.ttl-detailBar`、`.ttl-dtab`、`.ttl-dtabSelected`、`.ttl-detailBody`、`.ttl-detailFoot`、`.ttl-pill`、`.ttl-pillWarn`、`.ttl-pillOk`、`.ttl-detailHint`、`.ttl-json`、`.ttl-jsonRow`、`.ttl-jsonKey`、`.ttl-jsonToggle`、`.ttl-jsonStr`、`.ttl-jsonNum`、`.ttl-jsonBool`、`.ttl-jsonNull`、`.ttl-jsonMore`、`.ttl-jsonCapped`、`.ttl-strbox`、`.ttl-md`、`.ttl-mdTableWrap`、`.ttl-mdTruncated`、`.ttl-raw`、`.ttl-imgRow`、`.ttl-imgChip`、`.ttl-errorBlock`。

尺寸基准（与效果图一致）：详情带 `padding: 8px 10px`、页签条 11px、JSON 11.5px/17px、长字符串块 `max-height: 52px`、缩进参考线 `1px rgba(255,255,255,.12)`。

### 4.6 `src/client/locales.ts`（T3 独占）
新增 `Dict` 键（zh/en 都必须有）：

| key | zh | en | 类型 |
| --- | --- | --- | --- |
| `detailParams` | 参数 | Params | string |
| `detailResult` | 结果 | Result | string |
| `detailRaw` | 原始 | Raw | string |
| `detailRender` | 渲染 | Rendered | string |
| `detailSource` | 原文 | Source | string |
| `detailAria` | `{name} 详情` | `{name} details` | `(name: string) => string` |
| `copyField` | 复制 | Copy | string |
| `copyDetail` | 复制全部 | Copy all | string |
| `copiedDone` | 已复制 | Copied | string |
| `expandLabel` | 展开 | Expand | string |
| `collapseLabel` | 收起 | Collapse | string |
| `locateInChat` | 在对话中定位 | Locate in chat | string |
| `fullPill` | 完整 | Full | string |
| `truncatedPill` | 已截断 | Truncated | string |
| `showAllLines` | `展开全部（{n}）` | `Show all ({n})` | `(arg: string) => string` |
| `jsonTooLarge` | 对象过大，已折叠 | Object too large, collapsed | string |
| `resultEmpty` | 该调用没有返回内容 | This call returned no content | string |
| `resultUnparsable` | 结果无法解析，已按原文显示 | Could not parse the result — showing raw text | string |
| `resultReplaced` | `已被压缩替换（seq #{n}）` | `Replaced by compaction (seq #{n})` | `(n: number) => string` |
| `imageLabel` | `图片：{name}` | `Image: {name}` | `(name: string) => string` |
| `imageMeta` | `{w}×{h} · {size}` | `{w}×{h} · {size}` | `(w: number, h: number, size: string) => string` |
| `orphanResult` | 未匹配到调用（孤立结果） | No matching call (orphan result) | string |
| `markdownFallback` | 未找到 Markdown 渲染器，已按原文显示 | Markdown renderer unavailable — showing raw text | string |
| `loadMore` | 载入更多 | Load more | string |

`t(lang, key)` 的返回类型保持不变（`string | number | ((...args: never[]) => unknown)`），调用点自行断言。

## 5. Markdown 判定（`looksLikeMarkdown`，冻结）

返回 true 当且仅当：文本含 Markdown 结构信号（行首 `#{1,6} ` / ``` 围栏 / `|---|` 或 `| --- |` 表格分隔行 / 行首 `[-*+] ` 或 `\d+. ` 列表 / `>` 引用 / `**bold**` 或 `` `code` ``），**且** ANSI 转义（`\u001b[`）出现次数 < 3，**且**首行不是错误堆栈（不以 `Error:`/`Traceback`/`    at ` 开头）。其余一律 false（走原文）。

## 6. 视图契约（`src/client/TrailTab.tsx` + `useTrail.ts`）

- 折叠态行结构（`renderStep`）改为：
```tsx
<div className="ttl-stepWrap" data-open={open ? 'true' : undefined} data-testid="ttl-step-wrap" key={key}>
  <button type="button" className="ttl-row" data-testid="ttl-step" data-step-kind={step.kind}
          aria-expanded={open} aria-controls={detailId} title={text}
          onClick={(e) => toggleStep(step, e.altKey)}>
    <span className={`ttl-caret${open ? ' ttl-caretOpen' : ''}`} aria-hidden="true" />
    {dot(tone)}{name(step.name, true)}<span className="ttl-rowArgs">{text}</span>
  </button>
  <button type="button" className="ttl-jump" data-testid="ttl-step-jump"
          title={t(lang,'locateInChat')} onClick={() => { onJump(targetFor({kind:'tool',step}), turn) }}>↗</button>
  {open ? <StepDetail id={detailId} step={step} lang={lang} onJump={...} sessionId={...} /> : null}
</div>
```
- `tone`：`step.kind === 'error' || step.result?.isError === true` → `'red'`，否则沿用 `toolDotClass(step.name)`。
- **点击行 = 展开/收起（不再跳转）**；`↗` 按钮 = 跳转（复用现有 `onJump(targetFor(...), turn)`，含 turn 锚点）。`Alt+点击` = 多开，否则同时只开 1 个。
- 状态：`openSeqs: Set<number>`（key = step.seq）、`resultView: Map<number, 'rendered'|'raw'>`（首次展开按 `defaultViewForTool(step.name)` 播种，用户切换后记住）。会话切换或 tab 隐藏时清空。
- 筛选变化时把已展开但被筛掉的 seq 从 `openSeqs` 移除。
- `StepDetail`（`React.memo`）：
  - 页签 `参数 | 结果 | 原始`（`data-testid` = `ttl-dtab-params` / `ttl-dtab-result` / `ttl-dtab-raw`，容器 `ttl-detail`）；默认页签：`step.result` 存在 → `结果`，否则 `参数`。
  - `参数`：`parseJsonLoose(step.args ?? '')` 成功 → `<JsonTree value/>`；失败 → `<RawText>` + 提示行 `resultUnparsable`。
  - `结果`：`step.result` 为 error → `.ttl-errorBlock`（`errorName · errorCode` + `<RawText>`）；否则 `<MarkdownResult>`/`<RawText>`，配「渲染/原文」切换按钮（`data-testid="ttl-view-toggle"`，仅当 `looksLikeMarkdown` 为真时显示）。图片块 → `.ttl-imgRow` 内 `.ttl-imgChip`（`imageLabel(name)` + `imageMeta`）。
  - `原始`：`<RawText text={step.args ?? ''}/>`（保留空白）。
  - 底部 `ttl-detailFoot`：`完整/已截断` pill（`data-testid="ttl-detail-pill"`）、`seq`、`replacedBy` 时的 `resultReplaced` 提示（`data-testid="ttl-detail-replaced"`）、`orphan` 时的 `orphanResult` 提示。
  - a11y：`role="region"` + `aria-label={detailAria(step.name)}` + `id={detailId}`；页签用 `<button role="tab" aria-selected>`。
- `useTrail.ts`：路由改 `/trace-inspect/api/events`。**不做**按需详情接口（规格书 §5.3 为可选项）。
- 既有 `tests/trail-tab.spec.tsx` 中断言「点击 ttl-step 触发跳转」的用例要改为「点击 ttl-step 展开、点击 ttl-step-jump 跳转」。

## 7. 交付物与验收映射

| 验收 | 归属 | 验证方式 |
| --- | --- | --- |
| AC1 参数 32 KiB 内不截断 | T1 | `tests/wire-detail.spec.ts` |
| AC2 result content（text+image）进投影 | T1 | 同上 |
| AC3 surfaceOp 透传 + replace 应用后 UI 显示替换内容 | T1/T2 | 同上 + `tests/trail-detail.spec.ts` |
| AC4 单页字节预算生效 | T1 | `tests/host.spec.ts` |
| AC5 同 callId append 按 seq 合并（含乱序） | T2 | `tests/trail-detail.spec.ts` |
| AC6 replace 正确改写目标步且不被水位线丢弃 | T2 | 同上 |
| AC7 孤儿 result 不崩、生成占位行 | T2 | 同上 |
| AC8 点行展开不跳转、`↗` 跳转 | T4 | `tests/trail-tab.spec.tsx` |
| AC10 JSON 树可折叠/分页/单字段复制 | T3 | `tests/json-tree.spec.tsx` |
| AC11 read→渲染 / bash→原文 | T3 | `tests/markdown-result.spec.tsx` |
| AC12 渲染/原文切换状态保持 | T4 | `tests/trail-tab.spec.tsx` |
| AC13 表格横向滚动、代码块复制 | T3 | CSS + 组件测试 |
| AC14 错误名/码 + 原文可见 | T4 | `tests/trail-tab.spec.tsx` |
| AC17 i18n 无遗漏 | T3 | 类型系统（Dict 必填键） |
| AC18 键盘可达 | T4 | 组件测试（Enter/Space/ArrowLeft/Right） |
| AC19 单测覆盖 + CI 绿 | 全员 | `pnpm typecheck && pnpm test && pnpm build` |
| AC20 真实会话无卡顿 | Lead/verifier | 手工 + 数据层单测 |
| 折叠态视觉不回归 | T4 | 现有 `trail-tab` 用例 + 人工核对 |

## 8. 全局约束

1. 不新增任何 npm 运行时依赖（`@deepseek-ai/dsh-client-ui-primitives` 只做**类型**声明 + 运行时守卫 require；esbuild 侧标 `external`）。
2. 只用 `--dsw-alias-*` / `--dsw-font-*` / `--ds-font-family-code` token，不硬编码颜色。
3. 工具结果按**不可信内容**处理：禁 `innerHTML`/`dangerouslySetInnerHTML`/`eval`。
4. 每个工作流只改自己 write scope 内的文件；跨文件接口改动先找 Lead。
5. 完成后必须自己跑：`pnpm typecheck` + 自己相关的 `pnpm vitest run tests/<file>`；Lead 在集成后跑全量 `pnpm test` + `pnpm build`。

## 9. 实现口径补充（T1–T3 落地后回填，T4/T5 按此核对）

### 9.1 新增实测事实

- **`surfaceOp` / `sourceEventSeqs` 位于事件顶层**（不在 `data` 里）：真实日志 seq=182/183 实测；T1 的 `projectEvent` 从顶层透传（`baseOf`），T2 的模型按「顶层优先、`data.surfaceOp` 兜底」读取。**任何中间层若丢掉顶层字段，replace 会退化为 append**（这是本次最容易静默出错的链路）。

### 9.2 T1（wire/host）已确认的口径

| # | 口径 |
| --- | --- |
| 1 | `arguments === ''` 时仍带 `arguments`/`argsBytes=0`/`argsTruncated=false`（契约字面） |
| 2 | wire 侧用本地结构等价类型 `WireResultImage`（`bytes?` 可选；缺省就不带），不 import trail-model，避免跨工作流编译耦合 |
| 3 | image 块要求 `attachmentId` 与 `mediaType` 均为非空 string，否则丢弃该块 |
| 4 | `surfaceOp` 对象形态要求 `op` 是非空 string，否则视为畸形丢弃 |
| 5 | `contentBytes` / `contentTruncated` 只要产生 `content` 就带（纯图片时 `contentBytes=0`）；`message.content` 为字符串时按单个 text 块处理 |
| 6 | 页级预算：**每页至少 1 条**（单事件超 2 MiB 也整条下发），否则 `hasMore` 抽干会死循环；`hasMore = i < events.length` |

### 9.3 T2（trail-model）已确认的口径

| # | 口径 |
| --- | --- |
| 1 | `step.kind` 不随 replace 重算（error 行保持 error 身份，`hasError` 不抖）；只重算 `result.kind` |
| 2 | replace 命中某步时**作废该步所有早于 replace seq 的分段**（不只是 `[startSeq,endSeq]` 内的分段），否则同一 callId 的后续 append 会与替换文本脏拼接；分段表按 seq 排序重建 → replace 先到/后到结果一致 |
| 3 | 找不到目标的 replace → 忽略，不建孤儿；只有「无 replace 的成功 result 找不到 callId」才建孤儿占位 |
| 4 | 非 replace 的成功 result 若没有开启中的轮次，仍按 v0.3.1 丢弃；**replace 不受此限**（真实场景就是「改写已关闭轮次的历史结果」） |
| 5 | 同一事件内多个 text 块用 `\n` 连接；跨事件 append 直接拼接（流式片段语义） |
| 6 | image 块缺 `attachmentId` 直接跳过；`mediaType` 缺失降级为空串、`bytes` 缺省 0 |
| 7 | replace 改写参数口径：`args` = 替换文本、`argsPreview = compact(替换文本)`、`argsTruncated = contentTruncated`、`argsBytes` = 替换文本长度 |
| 8 | 补了契约未明说的 markDirty 缺口：user/fallback 模式下被 replace 命中的**已关闭**轮次必须重新 materialize |
| 9 | 内部共享一个 `ResultIndex`（`byCallId` + `seqIndex` + 按 seq 排序的分段表），`foldTurns` / `foldByUserBoundaries` / `TrailFolder` 三处同步，双实现逐前缀一致 |

### 9.4 T3（组件层）已确认的口径

| # | 口径 |
| --- | --- |
| 1 | `tsc` 会忽略与同名实现文件并存的 `.d.ts`：`ui-primitives.d.ts` 必须由 `ui-primitives.ts` 首行 `/// <reference path="./ui-primitives.d.ts" />` 引入，否则 ambient 声明不进 program（TS2307） |
| 2 | 新增测试 seam `setPrimitivesForTest(next)`（vitest 的 ESM runner 注入了真实 CJS `require`，无法用 `vi.stubGlobal('require')` 顶替宿主模块） |
| 3 | `Locales` 除契约表外另加 4 键（`codeLabel`/`wrapLabel`/`unwrapLabel`/`footnotes`）供 `markdownLabels()` 用，避免硬编码文案 |
| 4 | 另加 3 个 CSS 类：`.ttl-jsonChildren` / `.ttl-jsonPreview` / `.ttl-strboxCopy`。（组件里还挂着 `.ttl-mdShowAll` 类名，但它的样式来自 `.ttl-mdTruncated button`，`styles.ts` 里没有独立规则——T5 报告 F3） |
| 5 | JsonTree：根默认展开、嵌套默认折叠（懒渲染）；`maxDepth` 到顶显示 `…` 且不构造子树；`maxNodes` 超限**只**渲染 `ttl-json-capped` + `jsonTooLarge`（不渲染残树）；环检测用**每渲染遍新建**的 `WeakSet`（跨渲染持久会把容器自身判成环）；同一遍内兄弟分支共享的对象（DAG）按 `[Circular]` 安全处理 |
| 6 | `looksLikeMarkdown`：表格分隔行须含 `|` 且 `-{3,}`；结构信号须在行首（ANSI 前缀后的 `#` 不算）；`\u001b[` ≥3 次 → false；首行 `Error:`/`Traceback`/`at ` → false；`defaultViewForTool` 先 trim+lowercase |
| 7 | `MarkdownResult` 的提示条语言用内部 `detectLang()`（契约 props 不带 lang，与 TrailTab 同源） |

### 9.5 已知局限（T5 独立验证确认，v1.0 接受）

| 项 | 事实 | 为什么不修 |
| --- | --- | --- |
| surfaceOp 全链路丢失时无可见提示（T5 F4） | 若顶层 `surfaceOp`、`sourceEventSeqs`、`data.surfaceOp` 三者都丢：轮次仍开着 → 结果被 append（旧长文与新内容脏拼接）；无开启轮次 → 该 result 按 v0.3.1 语义被丢弃，界面显示替换前的旧长文，且没有任何提示。测试：`pnpm vitest run tests/verify-detail.spec.ts -t '两者都丢'` | 该形态要求**本仓库自己的 host 投影与 client 折叠同时丢掉字段**（链路上没有第三方 hop：`wire.baseOf` → JSON → `TrailFolder.push`）。为它加 `surfaceOpLost` 标记 + UI 提示，是给一个只能由自身回归造成的场景增加常驻复杂度；改为在本表记录，并在 CHANGELOG 的 Known limitations 里对用户可见 |
| 图片不解析 attachment URL（U7） | 只渲染占位 chip（`name · mediaType · WxH · bytes`） | 见 §0：`app.asar` 里只找到 `/attachments/v1/{objects,files,file-objects}` 字符串，未确认插件可用的 URL 模板（未验证） |
| AC9 像素级一致 / AC13 真实表格溢出 / AC17 明暗对比度 / AC20 真实会话压测 | 只有结构、CSS 与单测级证据 | 需要真实浏览器与会话环境（T5 报告 §5 的 U2–U5），留待安装后在桌面版实机复核 |

### 9.6 验证收口（T5 发现的处理）

| 发现 | 处理 | 证据 |
| --- | --- | --- |
| F1【中】`check:lib` 假绿（`git diff` 看不见未跟踪的 `lib/`） | 改为 `scripts/check-lib.mjs`，用 `git status --porcelain -- lib` 覆盖 modified/staged/deleted/**untracked**；并把 `lib/` 从 `.gitignore` 移除、随提交入库 | `pnpm check:lib` 在 `lib/` 漂移或未跟踪时必须非 0（见 verification-v1.md 增补） |
| F2【低】`{op:''}` 被当作合法 surfaceOp | `src/wire.ts` 的 `isSurfaceOp` 增加 `obj.op.length > 0`；T5 的 A8 用例期望同步翻转 | `pnpm test` 全绿 |
| F3【低】契约声称的 `.ttl-mdShowAll` 不存在 | 修正为本节 §9.4#4 的真实清单（3 个类） | 同上 |
| F4【低/风险】无可见降级提示 | 记为 §9.5 已知局限 + CHANGELOG Known limitations | 同上 |

