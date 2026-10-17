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
| 用户可见 tab 标题 | **固定 `轮次轨迹`**（不随界面语言变化；所有者要求，2026-10-17）。面板内其它文案与 better-sidebar 引导页的 description 仍跟随 DSH 界面语言（v0.5.1 起用官方 client `locale` 服务，`html[lang]`/`navigator.language` 仅回退） | DSH 界面语言跟 OS/浏览器 locale，Electron 下是 `en-US`，语言驱动的 tab 名会显示 "Turn Outline" |

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
   > 口径限定（T10 报告 F-V3）：「最终结果必须与到达顺序无关」**只在该 replace 的目标已经登记的前提下成立**（处理该 replace 时 `seqIndex` 已含目标 seq，或 `byCallId` 已含该 callId）。replace 早于其 `tool/call` 到达时该事件被忽略 —— 真实链路不可达：`TrailFolder.push` 有 seq 水位线、wire 分页按 seq 升序、replace 事件自身 seq 恒大于被替换 seq（§0 实测 182 替换 20/22）。
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

> ⚠️ **本行已被 §11.2 覆盖（2026-10-17）**：`replace` 只改写 `result`，`args`/`argsPreview`/`argsBytes`/`argsTruncated` 保持 tool/call 原值。保留本行为历史记录。
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


---

# 附：v0.5.0 契约补充（P2 + 图片缩略图 + 按需完整详情 + F4 提示）

> 目标：把 v0.4.0 的「已知局限」与 v1.0 范围外的 P2 全部做完，并在**独立 profile 实例**上做浏览器级复核。
> 本补充同样是**冻结接口**；文件归属见下表，禁止跨 scope 写入。

## 10.1 文件归属（并行工作流不重叠）

| 工作流 | 独占文件 |
| --- | --- |
| **T7 host-detail** | `src/index.ts`、`src/trail-model.ts`、`src/client/attachment-url.ts`(新)、`src/client/useTrail.ts`、`tests/attachment-route.spec.ts`(新)、`tests/tool-detail-route.spec.ts`(新)、`tests/attachment-url.spec.ts`(新)、`tests/trail-detail.spec.ts`、`tests/host.spec.ts` |
| **T8 ui-styles** | `src/client/styles.ts`、`src/client/locales.ts`、`tests/detail-styles.spec.ts`(新) |
| **T6 ui-zoom**（依赖 T7/T8 落地） | `src/client/ZoomOverlay.tsx`(新)、`src/client/TrailTab.tsx`、`tests/zoom-overlay.spec.tsx`(新)、`tests/trail-tab.spec.tsx` |

## 10.2 已实测的平台事实（新增，禁止推翻）

| 事实 | 证据 |
| --- | --- |
| host 附件服务契约：`ctx.get('attachments')`（可选访问，必须判 undefined）→ `readImage(ref: ImageAttachmentRef, signal?): Promise<{ref, data: Uint8Array}>`、`imageHostPath(ref): string \| undefined` | 本机 `cordis_inspect` host `Service.listService {service:'attachments'}`（`/Users/lzx/.dsh/profiles/desktop` 运行时） |
| `ImageAttachmentRef = { attachmentId, mediaType, bytes, width, height, name?, originalDimensions? }`；`ImageMediaType = 'image/png'\|'image/jpeg'\|'image/webp'\|'image/gif'` | 同上（referencedTypes） |
| 浏览器 `<img src>` 的 GET 能通过插件围栏：`isTrustedApiRequest` 只要求 loopback `Host`，`Origin` 缺省即放行，只拒绝 `sec-fetch-site: cross-site` | `src/index.ts:100-113` |
| 平台自身的内置图片卡走「会话授权的 `loadImage`」，授权模型 = 「该会话的 `tool/result` 里存在引用该附件的 `image` 块」 | `/Users/lzx/.dsh/evidence/market/readmes.json`（imagegen 插件 README：`ctx.attachments.saveImage()` + 会话授权 `loadImage`；其自建图片路由也按同样授权） |

## 10.3 T7 接口（冻结）

### 10.3.1 `GET /trace-inspect/api/attachment`

```
GET /trace-inspect/api/attachment?sessionId=<id>&attachmentId=<sha256:...>
  200 原始字节，content-type = 该 image 块的 mediaType，cache-control: private, max-age=300，
      x-content-type-options: nosniff
  400 sessionId/attachmentId 缺失或格式非法
  403 围栏拒绝（复用 isTrustedApiRequest）
  404 该 session 的事件里不存在引用该 attachmentId 的 image 块 / attachments 服务不可用 / readImage 校验失败
  405 非 GET
```
- **授权**：仅当 `sessionId` 的事件流里存在 `image` 块（`content[].attachment.attachmentId === attachmentId`）时才读字节；不得只按 attachmentId 直读（防越权枚举）。
- 事件读取复用 `/events` 同一条路径（live 快照优先、否则 sessionQuery）；授权结果按 session 缓存（LRU ≤ 16 个 session，TTL ≤ 10s），避免每张图重扫全日志。
- 字节经 `ctx.get('attachments')?.readImage({attachmentId, mediaType, bytes, width, height, name})` 读取；服务不可用 → 404 `{error:'attachments-unavailable'}`；校验失败 → 404 `{error:'attachment-unavailable'}`。
- 图片尺寸字段缺失时，`readImage` 需要 `width/height`：从事件的 image 块取；若缺失则用 `mediaType/bytes/name` 允许的形态尝试，仍失败即 404（不得抛未捕获异常）。

### 10.3.2 `POST /trace-inspect/api/tool-detail`

```
POST /trace-inspect/api/tool-detail  { sessionId, seqs: number[] }     // seqs ≤ 32 条
  200 { items: ToolDetailItem[] }       // 找不到的 seq 直接省略，不报错
  400 sessionId 缺失 / seqs 非数组或超 32
  403 / 404 / 405 / 413（与 /events 同语义）
```
```ts
export interface ToolDetailItem {
  /** 调用方请求的那个 seq（call seq 或任一所属 result seq 均可）；`arguments`/`content`
   *  始终是整步内容。客户端只传 `TrailStep.seq`（= call seq）——见 T10 报告 F-V4。 */
  seq: number
  callId: string | null
  name: string
  arguments: string | null       // 完整、不 clipText
  argsBytes: number
  content: Array<{ type: 'text'; text: string } | { type: 'image'; attachment: AttachmentRefLike }> | null
  contentBytes: number
  isError: boolean
  error: { name?: string; code?: string } | null
}
```
- 「完整」= 不施加 `ARGS_CAP`/`RESULT_CAP`；但**仍受请求体上限与响应体积上限约束**：单次响应不超过 8 MiB，超出则对 `arguments`/`content` 文本按 4 MiB 截断并置 `truncated: true`（新增字段，见下）。
```ts
  truncated?: boolean            // 任一字段因 8 MiB 响应上限被二次截断
```

### 10.3.3 `src/client/attachment-url.ts`（T7 新建，T6 使用）

```ts
export interface AttachmentRefLike {
  attachmentId: string
  mediaType: string
  bytes?: number
  width?: number
  height?: number
  name?: string
}
/** URL of the session-authorized attachment route; null when the ref/sessionId is unusable. */
export function attachmentUrl(sessionId: string | null | undefined, ref: AttachmentRefLike): string | null
```
实现：`/trace-inspect/api/attachment?sessionId=<enc>&attachmentId=<enc>`（`encodeURIComponent`）；`sessionId` 为空串/空白或 `attachmentId` 为空 → 返回 `null`。

### 10.3.4 `src/client/useTrail.ts`（T7 扩展，T6 使用）

```ts
export type ToolDetailResult =
  | { ok: true; items: ToolDetailItem[] }
  | { ok: false; reason: 'http' | 'network' | 'unavailable' }

/** Fetch untruncated tool details for one session. Never throws. */
export function fetchToolDetail(sessionId: string, seqs: number[], signal?: AbortSignal): Promise<ToolDetailResult>
```
`ToolDetailItem` 类型从 `./tool-detail-types`? — 不新增文件：把 `ToolDetailItem` 定义在 `useTrail.ts` 并 `export`。

### 10.3.5 `src/trail-model.ts`（T7 扩展）

```ts
export interface TrailResult {
  /* …既有字段… */
  /** 合并进本内容的 tool/result 事件数：append 递增、replace 重置为 1；≥2 表示事件未显式声明合并语义。 */
  mergedFrom?: number
}
```
语义：每个 append 结果使 `mergedFrom` +1；replace 把它重置为 1（replace 自身是一条事件）；首次挂 result 时为 1。UI 仅在 `mergedFrom > 1 && replacedBy === undefined` 时提示。

## 10.4 T8 接口（冻结：新增类名与文案键）

### 10.4.1 新增 CSS 类（`styles.ts`，全部 `ttl-` 前缀、只用 token）

`.ttl-imgThumbWrap`、`.ttl-imgThumb`、`.ttl-detailLoad`、`.ttl-detailRetry`、`.ttl-detailMerged`、
`.ttl-zoom`、`.ttl-zoomBackdrop`、`.ttl-zoomPanel`、`.ttl-zoomHead`、`.ttl-zoomTitle`、`.ttl-zoomTools`、`.ttl-zoomSearch`、`.ttl-zoomBody`、`.ttl-zoomOutline`、`.ttl-zoomOutlineRow`、`.ttl-zoomOutlineRow[aria-current="true"]`、`.ttl-zoomPane`、`.ttl-zoomTabs`、`.ttl-zoomFoot`、`.ttl-zoomKbd`

尺寸基准：缩略图 `max-width:100%`、`max-height:140px`、圆角 `var(--dsw-radius-*)`；浮层 `position:fixed; inset:0; z-index:60`，面板 `width:min(1080px, 92vw)`、`height:min(760px, 88vh)`、`display:flex`；大纲列 `width:260px` 可滚动。

### 10.4.2 新增 `Dict` 键（zh/en 都要）

| key | zh | en | 类型 |
| --- | --- | --- | --- |
| `imageLoadFailed` | 图片加载失败，仅显示元数据 | Image failed to load — metadata only | string |
| `detailLoading` | 载入完整内容… | Loading full content… | string |
| `detailLoadFailed` | 完整内容加载失败，当前显示截断预览 | Failed to load full content — showing the truncated preview | string |
| `detailRetry` | 重试 | Retry | string |
| `detailLoadedFull` | 已载入完整内容 | Full content loaded | string |
| `mergedNoSurfaceOp` | `该内容由 {n} 条结果合并，事件未声明 surfaceOp` | `Merged from {n} results — the events declared no surfaceOp` | `(n: number) => string` |
| `zoomOpen` | 放大查看 | Open zoomed view | string |
| `zoomTitle` | `{name} · 步骤详情` | `{name} · step details` | `(name: string) => string` |
| `zoomClose` | 关闭 | Close | string |
| `zoomSearch` | 搜索步骤 | Search steps | string |
| `zoomNoMatch` | 无匹配步骤 | No matching step | string |
| `zoomExport` | 导出 JSON | Export JSON | string |
| `zoomHint` | `Esc 关闭 · ↑↓ 切步 · ⌘F 搜索` | `Esc close · ↑↓ step · ⌘F search` | string |

## 10.5 T6 行为（冻结）

1. **图片缩略图**：`result.images` 每项 → `attachmentUrl(sessionId, ref)`；非 null 渲染
   `<div className="ttl-imgThumbWrap"><img data-testid="ttl-img-thumb" className="ttl-imgThumb" loading="lazy" src={url} alt={t('imageLabel')(name)} /></div>`，
   下方保留 `imageMeta` 元数据行；`onError` → 隐藏 img、回退既有 `.ttl-imgChip`，并显示 `imageLoadFailed`（`.ttl-pillWarn`）。
2. **按需完整详情**：步骤展开且（`step.argsTruncated === true` 或 `step.result?.truncated === true`）时，自动调用 `fetchToolDetail(sessionId, [step.seq])`（按 seq inflight 去重，最多重试 1 次由用户点击触发）。成功 → `参数`/`结果` 页改用返回的完整 `arguments`/`content`，页脚显示 `detailLoadedFull`；失败 → 保持 wire 预览 + `.ttl-detailLoad` 显示 `detailLoadFailed` + `ttl-detail-retry` 按钮（文案 `detailRetry`）。加载中显示 `detailLoading`。
3. **F4 提示**：`result.mergedFrom > 1 && result.replacedBy === undefined` → `.ttl-detailMerged`（`role="note"`，testid `ttl-detail-merged`）显示 `mergedNoSurfaceOp(n)`。
4. **放大浮层**：详情带页脚 `⤢` 按钮（testid `ttl-detail-zoom`，title `zoomOpen`）+ 步骤行聚焦时 `⌘⇧O`/`Ctrl+Shift+O` 打开；`React.createPortal(document.body)` 挂载（**不依赖未验证的 slot key**，`position:fixed` 由 `.ttl-zoom` 提供）；`Esc` 关闭；`↑/↓` 在当前轮次的步骤间切换；`⌘F`/`Ctrl+F` 聚焦搜索框；`⌘C`/`Ctrl+C` 复制当前页内容；`ttl-zoom-export` 导出当前步骤 JSON（Blob + `a.download`）。左栏大纲复用当前轮次步骤（testid `ttl-zoom-step`），右栏复用 `JsonTree`/`MarkdownResult`/`RawText`，页签与详情带一致（testid `ttl-zoom-tabs`）。`aria-modal="true"` + `role="dialog"` + 关闭后焦点回到触发行。
5. 折叠态 DOM 与 v0.4.0 保持一致（只新增页脚按钮与条件渲染的浮层/提示）。

## 10.6 版本与门禁

- 版本：`0.5.0`（Lead 改 `package.json` / `CHANGELOG.md`）。
- 交付门禁不变：`pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm check:lib`；`lib/` 必须随源码一起提交（先 `pnpm build` 再 commit）。
- 浏览器级复核在**独立 profile 实例**（`trace-verify`，端口 19487，插件以 `link:` 装本仓库）上做，证据写进 `docs/verification-v1.md` §10。

## 11. 浏览器级复核发现的收口（2026-10-17，独立 profile 实例 19487）

> 复核方式：`dsh trace-verify --from-default-profile web --port 19487`（独立 profile，插件以 `link:` 装本仓库），Playwright 驱动真实 GUI，打开真实会话 `session-a29878e7…`（5 轮 / 177 步 / 6 个 `read_image`）与本仓库当前会话。

### 11.1 已实测通过（证据见 `docs/verification-v1.md` §10）

| 项 | 实测结果 |
| --- | --- |
| client 半注册 | better-sidebar 「+ 菜单」出现「轮次轨迹」tab；面板显示 5 轮 / chips（全部 177、失败 2、bash 131、read_image 6） |
| 行内展开 | 点工具行展开 `region "write 详情"`，页签 参数/结果/原始，默认 结果；页脚 `完整 · seq #923 · 复制全部` |
| JSON 树 | 3 行 + 1 个 `.ttl-strbox`（max-height 52px/overflow auto）+ 单字段复制；折叠 ↔ 展开 1→3→1→3；字体 11.5px/17px 等宽 |
| 按工具默认视图 | `bash` → 默认原文（`ttl-md-raw`），且提供 渲染/原文 切换；切换后生效 |
| 渲染/原文记忆 | 切换为原文 → 收起 → 重新展开，仍为原文（AC12） |
| 错误结果 | `TeamError · TEAM_MEMBER_NOT_FOUND` + 原文可见，页脚 `完整 · seq #389`（AC14） |
| 图片块 | `图片：A-inline-expand.png` + `image/png` + `1440×860 · 143 KB` 占位 chip（缩略图见 §10.5，v0.5.0 实现） |
| 跳回定位 | 点轮次 1 的 `↗`：对话区自动加载更早并滚动，视口内可见节点内容与该步参数完全一致（top=247 ∈ 视口 76–900）（AC8） |
| 键盘 | 行聚焦 `ArrowRight` 展开、`ArrowLeft` 收起、焦点留在行上（AC18） |
| 折叠态度量 | `.ttl-row` height 24px / font-size 12px / line-height 18px（与 v0.3.1 基线一致；AC9 的 v0.3.1 并排比对见 §10） |

### 11.2 【新发现 F7 / 已定口径】`surfaceOp.replace` 不得改写工具参数

- **现象**（真实浏览器）：被 compaction 替换过的步骤，其**行预览**与「参数」页显示的都是 `[dsh-jev-compaction] Historical tool output pruned…`，原始命令（如 `{"command":"ls …"}`）在界面上完全看不到；而日志里该 `tool/call` 的 `arguments` **完好无损**（实测：本仓库会话 96 处 replace，对应 tool/call 参数仍原样投影）。
- **原因**：T2 按契约旧文（§6.3.2「改写 args/result」）实现，把 replace 的内容同时写进了 `args`/`argsPreview`。
- **新口径（Lead 裁定，覆盖 §6.3.2 与 §9.3#7）**：
  - `replace` **只改写 `result`**（`text`/`images`/`truncated`/`replacedBy`/`replacedFrom`），
  - **不得**改写 `args` / `argsPreview` / `argsBytes` / `argsTruncated` —— 工具参数是「调用事实」，压缩插件从不改写它；
  - 行预览因此恢复为原始命令；「结果」页仍显示替换后的摘要 + `已被压缩替换（seq #N）`（AC3 的意图不变）。

### 11.3 【新发现 F8 / 已定口径】`read` 结果的 XML 信封必须先解包再决定是否渲染 Markdown

- **现象**（真实浏览器）：`read` 的结果形如
  ```
  <path>/tmp/ac13-wide-table.md</path>
  <type>file</type>
  <content>
  1: # AC13 宽表格 fixture
  ...
  5: | 模块 | 路径 | … |
  ```
  当前 `looksLikeMarkdown` 命中了 `| --- |` → 走 `MarkdownText`，结果**整段退化成一段转义文本**（`&lt;path&gt;…` + 行号），比原文更难读；表格永远不可能渲染成 `<table>`，AC13 因此无法通过。
- **新口径（Lead 裁定，覆盖 §9.3 的判定输入）**：
  - 新增 `unwrapFileResult(text)`：识别上述信封，返回 `{ path, type, body }`，`body` 去掉 `^\d+: ?` 行号前缀；
  - **仅当 `type === 'file'` 且 `path` 以 `.md`/`.markdown`/`.mdx` 结尾**时，`looksLikeMarkdown` 与 `MarkdownResult` 都以 **`body`** 为输入（渲染真实的文件 Markdown，含表格/代码围栏）；
  - 其它类型（`.ts`/`.json`/`bash` 日志等）一律走等宽原文——保持「拿不准就按原文」的既有原则；
  - 该改动完全落在 `src/client/markdown-result.tsx` 内（`looksLikeMarkdown` 语义自洽），`TrailTab.tsx` 无需改动。

### 11.4 F8 落地裁定（Lead，T9 提出的 4 个待定项）

| # | 问题 | 裁定 | 理由 |
| --- | --- | --- | --- |
| 1 | 信封存在但非 `file`+`.md` 时，是「一律原文」还是「回到原文再判 §5」 | **一律原文**（T9 实现即此） | §11.3 是权威口径；`.ts`/`.json` 正文里的 `* `、`|`、`#` 极易被误判成 Markdown 结构，误渲染的代价高于收益 |
| 2 | 真实 `read` 结果在正文末尾还有一行工具 chrome（`(End of file - total N lines)` / `(Showing lines A-B of N. Use offset=X to continue.)`），是否剥离 | **剥离**（Lead 在集成期补，`READ_FOOTER` 常量 + 只剥离「最后一个非空行」） | 实测证据：本机 `read` 一个 576 行文件的信封内确实带 `(Showing lines 1-4 of 576. Use offset=5 to continue.)`。它是工具 chrome 而非文件内容，渲染成 Markdown 会多出一段游离文本。只剥离「最后一个非空行」可保证正文中间同形文本不被误删（有单测固化） |
| 3 | `unwrapFileResult` 对 `<type>image</type>` 信封是否也返回对象 | **返回**（type='image'，由调用方拒绝渲染） | 保留 `type` 供判定；解析与渲染决策分离，便于将来接图片卡 |
| 4 | `loadPrimitives()` 为 null 时，`.md` 信封回退显示原信封还是 body | **显示原信封**（保持既有回退行为 + `markdownFallback` 提示） | 渲染器缺失属宿主异常路径，此时「所见即 wire 原文」比再做一次文本变换更可解释、更可诊断 |
| 5 | **（T10 报告 F-V6，Lead 裁定）** `.md` 信封但 body 不含任何 Markdown 信号时，非渲染回退显示原信封还是 body | **显示 body**（已实现） | 这正是 F8 要消除的噪声：带 `<path>`/行号/`(End of file…)` 的原信封比文件内容更难读。非 `.md` 信封维持裁定 1 的「一律原文」；渲染器缺失路径维持裁定 4（有 `markdownFallback` 提示可解释） |

### 11.5 实机复核第二轮（v0.5.0 构建，2026-10-17）

| 项 | 实测（独立 profile `trace-verify` / 端口 19487 / Playwright / 真实会话） |
| --- | --- |
| **附件图路由** | 授权 GET → `200 image/png 146710 bytes`（与事件里 `bytes:146710` 完全一致）、`x-content-type-options: nosniff`、`cache-control: private, max-age=300`；同 id 换 session → `404 {"error":"attachment-not-found"}`；伪造 id → 404；POST → 405 |
| **图片缩略图（U7 闭环）** | 真机 `<img data-testid="ttl-img-thumb" loading="lazy" src="/trace-inspect/api/attachment?sessionId=…&attachmentId=sha256%3Aad4189…">`，**naturalWidth 1440 × naturalHeight 860**（真解码，与事件 `width/height` 一致）、`complete:true`、CSS `max-width:100% / max-height:140px / border-radius:8px`，元数据 chip 仍在下方 |
| **按需完整详情（路由层）** | `write` 步 `argsBytes=44493`、wire 预览被裁到 `32769`，`POST /tool-detail` 返回 **44493 且 `truncated:false`**；`seqs` 越界 400、POST 缺参 400 语义与契约一致 |
| **F7** | 被压缩替换的步骤：**24/24** 行预览恢复为原始 `{"command":…}`（此前全为 `[dsh-jev-compaction] …`）；「参数」页恢复为真正的 JSON 树（不再「无法解析」回退）；「结果」页仍显示替换摘要 + `已被压缩替换（seq #N）` |
| **F8 / AC11 / AC13** | `.md` 的 read 结果渲染出**真 `<table>`（11 行 × 5 列）**+ 代码围栏（2 个按钮）；**无** `<path>` 信封泄漏、**无**行号泄漏、**无** `(End of file - total N lines)` footer 残留（footer 剥离在真实数据上生效）；`.ts`/非 md 信封一律原文 |
| **超宽表格** | 3 行 × 3 列、含 620 字符不可断行 token：表格宽 **423px ≤ 面板 444px**，`panelNoBlowout: true`；`.ttl-mdTableWrap` 的 `overflow-x: auto` 就位（`scrollWidth === clientWidth`，即运行时渲染器把表格约束在容器内，**未触发**横向滚动——属渲染器行为，不是本插件缺口） |
| **放大浮层** | `fixed` / `z-index:60` / 面板 1080×760 `display:flex`；`role="dialog"` + `aria-modal="true"` + `aria-label="read_image · 步骤详情"`（在 `.ttl-zoomPanel`），portal 挂 `BODY`；大纲 39 行且恰好 1 行 `aria-current="true"`；`↑↓` 切换（31 → 32）；搜索 `read_image` → 39 → **4** 行，无匹配 → **0** 行 + 「无匹配」提示，清空 → 39；导出触发 `URL.createObjectURL`；`Esc` → 浮层移除且**焦点回到触发行按钮**（`data-testid="ttl-step"`），底层详情带保持打开 |
| **AC17 暗色主题** | 深色（body `rgb(21,21,23)`）下实测对比度：行文本 **15.03:1**、详情带 **15.03:1**、JSON key **7.36:1**、JSON string 15.03:1、pill **9.2:1**、chip **6.75:1**；行度量仍为 24px/12px/18px |
| **懒加载（GUI 点击）** | **未复现**：本会话唯一未被 compaction 替换的截断步骤是 `write seq #169`（argsBytes 44,493），它位于面板每轮渲染窗口之外（面板每轮约渲染 90 步；点「加载更早」可扩窗，但无法在 DOM 层稳定定位该行）；另一条截断结果 `read seq #65` 已被压缩替换（`contentTruncated` 归零）。**替代证据**：路由层完整返回 44,493（上表）+ 组件层 34 例（成功换源/失败保留预览 + 单次重试/inflight 去重） |
| **AC20（GUI 挂载）** | 中等会话（977 事件 / 177 步）面板即开即用无长任务；大会话（145 轮 / 18,358 事件）的 GUI 挂载未测，改以数据层硬数字代替（§10.4） |

---

## 12. v0.6.0 详情面板可读性重做（使用反馈驱动）

> 依据：用户对实机截图的四条反馈。核心接口仍以本契约为准；以下为新增/变更的 UI 契约。

### 12.1 折叠行 = 语义摘要 + 图标（`src/client/tool-summary.ts`）

| 工具 | label | detail | 图标 |
| --- | --- | --- | --- |
| `bash` / `bash_output` / `shell` | 工具名 | `description`；缺失时取 `command` 首行；再缺失取 args 预览 | `terminal` |
| `read` / `read_image` | 工具名 | `file_path`（或 `path`）的 **basename** | `file-read` |
| `write` / `append` | 工具名 | 同上 | `file-write` |
| `edit` | 工具名 | 同上 | `file-edit` |
| `glob` / `grep` / `search` | 工具名 | `pattern`（或 `query`） | `search` |
| `ls` / `list_directory` / `list_dir` | 工具名 | `path` | `folder` |
| `mcp__<server>__<tool>`（也容忍 `mcp_<server>_<tool>`） | `mcp:<server>` | `<tool> {…}`（无参数时只显示 tool） | `mcp` |
| 其它 | 工具名 | 已知字段（description/command/file_path/path/pattern/query/url/prompt）否则 args 预览 | `generic`（保留原语义色点） |

- detail 压平空白并裁剪到 120 字符；**行 tooltip 仍是原始 args 预览**（`title`），信息不丢失。
- 错误行（`kind === 'error'`）仍是「工具/错误名 + 错误文本 + 红点」。

### 12.2 参数页 = 格式化 JSON，默认全展开（`src/client/json-pretty.tsx`）

- `JSON.stringify(value, null, 2)` 的语法着色 `<pre>`（复用 `.ttl-jsonKey/Str/Num/Bool/Null` token），**没有折叠节点**。
- 超过 `cap`（默认 200,000 字符）时只渲染前 `cap` 字符并给「+N」增量展开按钮。
- 行内详情带与放大浮层共用；JSON 不可解析时仍回退等宽原文 + 提示（§11.3 不变）。

### 12.3 中央查看器入口（复用 §10.5.4 的浮层）

| 入口 | 行为 |
| --- | --- |
| 详情带右上角「⤢ 在中央查看」 | 以**当前页签**打开浮层（新增 `initialTab`） |
| 点击参数/结果/原始面板空白处 | 同上；**点击落在按钮/链接/输入框上，或存在文本选区时不触发** |
| 页脚 ⤢ / 行聚焦 ⌘⇧O | 行为不变 |

### 12.4 输出行可展开全文

- 折叠态：2 行预览（不变）。
- 点击输出行 → 行下方就地展开完整消息（`looksLikeMarkdown` 时用 `MarkdownResult` 渲染，否则等宽原文），再次点击收起。
- 定位回对话原位改为行尾 `↗`（与工具行一致），不再占用行点击。
