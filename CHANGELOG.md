# Changelog

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
