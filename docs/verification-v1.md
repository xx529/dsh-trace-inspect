# dsh-trace-inspect v0.4.0「详情增强」独立验证报告（T5）

| 项 | 值 |
| --- | --- |
| 验证者 | verifier（T5，独立对抗性验收；只新增 `tests/verify-detail.spec.ts` 与本文档，未改任何实现文件） |
| 被验对象 | `docs/detail-contract-v1.md`（冻结契约，含 §9 实现口径回填）+ `/Users/lzx/Documents/research/turn-outline-enhancement/docs/development-spec.md` §12 的 AC1–AC20 |
| 基准提交 | 工作树（未提交），`HEAD = 64fad2e`，36 个改动/新增路径 |
| 验证时间 | 2026-10-17 01:43–01:53 (+08:00) |
| 环境 | node v22.22.2 / pnpm 11.8.0（`packageManager: pnpm@11.8.0`）/ vitest 3.2.7 / jsdom 26.1.0 |

## 0. 被验证版本的指纹（复核用）

实现文件的 `git hash-object` 前 12 位（本报告所有结论都针对这一版；若指纹变化需重跑）：

```
a8b41a813b48 src/wire.ts            ac51766bba3b src/index.ts
a04689e4a9ae src/trail-model.ts     d509b35f7afc src/context-types.ts
64b706ddea78 src/client/TrailTab.tsx    2bc11627157c src/client/useTrail.ts
81910f23d787 src/client/index.tsx   f684f35dfae7 src/client/json-tree.tsx
5c31f62f0312 src/client/markdown-result.tsx  ff289c47d944 src/client/markdown-labels.ts
7aab3cce1080 src/client/ui-primitives.ts     7c982e74a0ae src/client/styles.ts
634778a54f69 src/client/locales.ts  2abb78603966 build.mjs
adedf235412a package.json           2e15e4e13be9 cordis.patch.yml
```

## 1. 我实际跑过的命令与真实输出

```
$ node -v && pnpm -v
v22.22.2
11.8.0

$ pnpm typecheck
$ tsc --noEmit
typecheck_exit=0

$ pnpm test
 RUN  v3.2.7 /Users/lzx/Documents/GitHub/dsh-trace-inspect
 ✓ tests/host.spec.ts (23 tests) 124ms
 ✓ tests/client-apply.spec.tsx (5 tests) 29ms
 ✓ tests/markdown-result.spec.tsx (19 tests) 91ms
 ✓ tests/trail-jump.spec.ts (23 tests) 478ms
 ✓ tests/verify-detail.spec.ts (70 tests) 268ms      ← 本次新增的对抗测试
 ✓ tests/json-tree.spec.tsx (17 tests) 694ms
 ✓ tests/trail-folder.spec.ts (14 tests) 14ms
 ✓ tests/trail-detail.spec.ts (34 tests) 18ms
 ✓ tests/wire-detail.spec.ts (19 tests) 5ms
 ✓ tests/fold-turns.spec.ts (25 tests) 8ms
 ✓ tests/trail-tab.spec.tsx (23 tests) 1177ms
 Test Files  11 passed (11)
      Tests  272 passed (272)
test_exit=0

$ pnpm build
  lib/index.js      14.5kb
  lib/client.js     121.0kb
build ok → lib/index.js + lib/client.js
bundle contract check ok
build_exit=0

$ pnpm check:lib
$ git diff --exit-code HEAD -- lib
checklib_exit=0            ← 见缺陷 F1：该命令在当前工作树恒为 0（假绿）

$ pnpm install --frozen-lockfile --ignore-scripts
Already up to date
install_exit=0
```

说明：`pnpm install` 的 `prepare` 会跑 `node build.mjs`；为避免在多成员并行工作时重建 `node_modules`/产物，我用 `--ignore-scripts` 只验证 lockfile 一致性，`pnpm build` 已单独跑过并成功。

## 2. 对抗测试（`tests/verify-detail.spec.ts`，70 个用例，全绿）

全部确定性：不读 `/tmp`、不读真实会话日志、不联网。分组与关键用例：

| 组 | 用例 | 打的是什么 |
| --- | --- | --- |
| A（8） | A1–A8 | 顶层 `surfaceOp`/`sourceEventSeqs` 透传；畸形形态丢弃；`data.surfaceOp` 兜底；**两者都丢**时的两种失败形态；`{op:''}` 未被丢弃（§9.2#4 口径核对） |
| B（11） | B1–B11 | replace 目标 seq 指向 tool/result 的 seq（20）而非 tool/call 的 seq（10）；`[start,end]` 外的早期分段也被作废（§9.3#2）；replace 后新 append 正常接续；**乱序（replace 先到）结果一致**；无目标不抛错不建孤儿；参数改写口径；`step.kind` 不重算；多 text 块 `\n` 连接；raw 图片块降级 |
| C（7） | C1–C7 | TrailFolder 水位线不丢 replace；**冻结轮次被改写后 `snapshot()` 返回新对象**；重复页幂等；foldTurns ≡ TrailFolder；user 模式已关闭轮次重物化（§9.3#8）；seq 回退被水位线丢弃 |
| D（5） | D1–D5 | 同 callId 多 append 按 seq 合并（乱序一致）；同 seq 去重；孤儿占位行；text+image → `mixed` 且 attachmentId 去重；空 result 仍挂 `result` |
| E（10） | E1–E7 + E8a–c | 常量冻结值；arguments 恰好 32768/32769；空 arguments；text+image 混合块；RESULT_CAP 裁剪；纯图片/空数组；裸字符串 content；**真实路由**上的页级预算：截断时 `hasMore=true`、每页 ≥1 条、可完整抽干；单事件超 2 MiB 整条下发不死循环；预算未触发时仍按 PAGE_SIZE |
| F（13） | F1–F13 | `loadPrimitives()===null` 不抛且回退原文；非 Markdown 走原文；`looksLikeMarkdown` 对 bash 日志/ANSI/错误堆栈 false、对真实 Markdown true；`defaultViewForTool`；JsonTree 环引用/DAG/超 maxNodes/深链/分页 50 行/复制降级；renderCap 64 KiB + 展开全部 |
| G（7） | G1–G7 | 无实际 `innerHTML`/`dangerouslySetInnerHTML`/`eval(`；CSS 无硬编码颜色（hex 只在 `var(--dsw-*)` fallback 内、新增段无裸 rgba）；无新增运行时依赖；构建产物 require 仅 react + ui-primitives；改名一致；§4.5 类名齐全；§4.6 文案（zh/en） |
| H（9） | H1–H9 | 折叠行仍是 `ttl-row` + dot/name/args + caret、未展开无详情带；点行=展开（无跳转）/点 ↗=跳转；`aria-controls` 指向真实详情带 + role=region/tab；默认页签；AC12 渲染/原文记忆；AC14 错误名/码+原文；图片 chip；**AC3 端到端（wire 投影 → 模型 → UI 显示替换文本 + replacedBy 提示）** |

## 3. AC1–AC20 结论表

判定口径：**已证实** = 有可复现的代码/命令/测试证据；**部分证实** = 关键机制已证实但 AC 的全部字面要求缺证据；**未证实** = 缺证据（不等于不成立）；**不成立 / 不适用** = 与实现范围不符。

| AC | 结论 | 证据（文件:行号 / 测试 / 命令） |
| --- | --- | --- |
| AC1 参数 16 KiB 内不截断 | **已证实** | `src/wire.ts:29` `ARGS_CAP = 32768`；`src/wire.ts:261-265`；E2/E3（32768 原样无 `…`、32769 → 32768+`…` 且 `argsTruncated=true`）；`tests/wire-detail.spec.ts` 亦覆盖 |
| AC2 result content（text+image）进投影 | **已证实** | `src/wire.ts:105-146`（text 跳空串、clip 到 RESULT_CAP；image 需非空 `attachmentId`+`mediaType`；`contentBytes` 用裁剪前长度）；E4/E6/E7；模型侧 D4/B11 |
| AC3 surfaceOp 透传 + replace 后 UI 显示替换内容 | **已证实** | 透传 `src/wire.ts:190-197`（A1）；应用 `src/trail-model.ts:569-593` + `408-472`（A4/A5/B1–B4）；**UI 端到端** H9：经 `projectEvent` 投影后挂载 TrailTab，详情带显示 `COMPACTED`、不含 `OLD-LONG-RESULT`、footer 显示 `Replaced by compaction (seq #182)` |
| AC4 单页体积上限生效 | **已证实** | `src/index.ts:213-232`（`PAGE_BUDGET_BYTES=2MiB`，`src/wire.ts:38`）；E8a 80×~33 KB 事件 → 首页截断且 `hasMore=true`、逐页抽干 80 条无重无漏；E8b 单事件 3 MiB 整条下发（`hasMore` 正确，无死循环）；E8c 预算未触发仍按 `PAGE_SIZE` |
| AC5 同 callId append 按 seq 合并（含乱序） | **已证实** | `src/trail-model.ts:408-472` 分段表按 seq 重建；D1（有序/乱序同结果）、D2（同 seq 去重）、B4（replace 先到） |
| AC6 replace 改写目标 step 且不被水位线丢弃 | **已证实** | `src/trail-model.ts:957-963`（水位线只比自身 seq）+ `1049-1067`（markDirty）；B1/B2/B4；C1（水位线不丢 replace）、C3（重发页幂等） |
| AC7 孤儿 result 不崩 + 占位行 | **已证实** | `src/trail-model.ts:605-620`；D3（`orphan:true`、`name='tool'`、计入 `stepsCount`/`stats.total`） |
| AC8 点行展开不跳转、↗ 跳转（含轮次锚点） | **已证实（组件级）** | `src/client/TrailTab.tsx:344-379`（行 button 只 `onToggleStep`，↗ 单独 button 调 `onJump(targetFor(...), turn)`）；H2/H4；`tests/trail-tab.spec.tsx:242-249`（↗ 触发跳转且不展开详情带）。**真实会话中的定位准确性**未端到端验证（见 §5 U1） |
| AC9 折叠态视觉与 v0.3.1 一致 | **部分证实** | `git diff HEAD -- src/client/TrailTab.tsx`：HEAD 的 `renderStep` 是单个 `<button class="ttl-row" data-testid="ttl-step">`，子节点为 `dot(tone)+name(step.name,true)+span.ttl-rowArgs`；当前 `StepRow` 保留完全相同的 4 个类/结构，仅新增 `span.ttl-caret` 与兄弟节点 `button.ttl-jump`（`position:absolute`）。`styles.ts` 的 `.ttl-row` 基础规则与 HEAD **逐字节一致**（`box-sizing/width/display/gap/padding:3px 6px/…/line-height:18px`），新增覆盖仅 `.ttl-stepWrap .ttl-row{padding-right:26px}`；H1/H3 断言上述不变式。**像素级对比未做**（无浏览器截图证据） |
| AC10 参数 JSON 树可折叠/分页/单字段复制 | **已证实** | `src/client/json-tree.tsx`（懒渲染 263-280、分页 285-334、capped 158-160/187-188、环 259-261、长串 341-360）；F7/F10/F12/F13；H5（`{"path":"a.md"}` → `ttl-json`） |
| AC11 read→渲染 / bash→原文 | **已证实** | `src/client/markdown-result.tsx:21-23,72-77`；F2/F3/F4/F9；H6（read 默认 rendered） |
| AC12 渲染/原文切换即时生效且状态保持 | **已证实** | `src/client/TrailTab.tsx:671-724`（`resultView` 按 step.seq 记忆 + `seedView` 首次播种）；H6（切 raw → 折叠 → 再展开仍 raw）；`tests/trail-tab.spec.tsx:277-300` |
| AC13 表格横向滚动、代码块有复制 | **部分证实** | `src/client/styles.ts:812-831`（`.ttl-mdTableWrap` + `overflow-x:auto` + `:has(.ttl-md table)` 渐隐）；`src/client/markdown-labels.ts:19-27` 传 `toolbarLabels`；F9 验证文案与对象身份。**真实表格溢出行为未在浏览器验证**（U2） |
| AC14 错误名/码 + 原文可见 | **已证实** | `src/client/TrailTab.tsx:224-235`；H7（`CommandError · E1` + `rollback failed: E1`） |
| AC15 面板 <420px 无方案 B 分栏 | **不适用** | 未实现方案 B：`grep -n '420\|@media' src/client/styles.ts` 只有 2 处 `prefers-reduced-motion`，无宽度分栏代码 |
| AC16 放大浮层（P2） | **不适用** | P2 未实现：`ls src/client | grep -i zoom` → 无产物；契约 §7 未列该项 |
| AC17 i18n 无遗漏 + 明暗主题对比度 | **i18n 已证实 / 对比度未证实** | `src/client/locales.ts:14-87`（`Dict` 必填）+ `89-158`/`160-229` 两套字典，缺键即 typecheck 失败；G7 逐条对照 §4.6 文案。颜色全部走 DSW token（G2），**实际明暗主题下的对比度未渲染验证**（U3） |
| AC18 键盘完成展开→切页签→复制 | **已证实（组件级）** | `src/client/TrailTab.tsx:354-362`（ArrowRight/ArrowLeft）；页签与复制均为原生 `<button>`（可 Tab+Enter）；`tests/trail-tab.spec.tsx:266-275`。未做"纯键盘全流程"端到端录制（U1） |
| AC19 单测覆盖 + CI 绿 | **本地已证实 / CI 未证实** | `pnpm typecheck` exit 0；`pnpm test` 272 passed（11 files）；`pnpm build` + `bundle contract check ok`。**CI 未运行**（无法访问 GitHub Actions），且发现 `check:lib` 在当前工作树是假绿（F1） |
| AC20 真实会话 ≥100 轮无卡顿 | **未证实** | 未做真实会话/内存压测；只有既有增量折叠的 O(delta) 设计与单测（`tests/trail-folder.spec.ts`、`useTrail` 的 MAX_PULL_PAGES 用例）间接支持（U4） |

## 4. 发现的问题（按严重度）

> 本节记录**第一轮**（改动前）的原始发现；F1–F3 已由 Lead 修复、F4 已接受为已知局限，处理结果与复验证据见 **§8**。本节保留原文以留痕。

### F1【中】`check:lib` 是假绿：`lib/` 未被 git 跟踪，产物漂移永远检测不出来

- 事实：`package.json:25` `"check:lib": "git diff --exit-code HEAD -- lib"`，`.github/workflows/ci.yml:49` 在 build 之后跑它；`.gitignore:6-12` 注释声称「`lib/` is intentionally COMMITTED … CI re-builds and asserts `git diff --exit-code HEAD -- lib`」。
- 实测：`git ls-files lib | wc -l` → **0**；`git status --short` → `?? lib/`（未跟踪）。`git diff` 对**未跟踪路径**不产生任何输出：
  ```
  $ git status --short lib docs/detail-contract-v1.md
  ?? docs/detail-contract-v1.md
  ?? lib/
  $ git diff --exit-code HEAD -- lib; echo "check:lib(exit=$?)"
  check:lib(exit=0)
  $ git diff --exit-code HEAD -- docs/detail-contract-v1.md; echo "untracked-file-diff(exit=$?)"
  untracked-file-diff(exit=0)          ← 同一 git 语义：未跟踪 = 看不见
  $ pnpm check:lib; echo $?
  0                                    ← 无论 lib/ 是否与 src/ 漂移
  ```
- 影响：CI 的漂移门禁目前**不可能失败**（假绿）；且若最终提交漏掉 `git add lib`，`.gitignore` 声称的「lib/ 已提交、`github:` 安装无需构建」路径不成立，而 CI 仍会全绿。
- 复现：`git ls-files lib | wc -l; pnpm check:lib; echo $?`
- 建议（不在我的写 scope 内，仅报告）：提交前 `git add lib`；或把门禁改成 `node build.mjs && git diff --exit-code -- lib`（对未跟踪文件也能检出差异）。

### F2【低】§9.2#4 口径与实现不一致：`surfaceOp.op === ''` 未被当作畸形丢弃

- 契约 §9.2#4：`surfaceOp` 对象形态要求 `op` 是**非空** string，否则视为畸形丢弃。
- 实现 `src/wire.ts:166-170`：
  ```ts
  function isSurfaceOp(value: unknown): boolean {
    if (value === 'append') return true
    const obj = record(value)
    return obj !== undefined && typeof obj.op === 'string'   // ← 缺 .length > 0
  }
  ```
- 实测（`tests/verify-detail.spec.ts` A8，通过即证实现行为）：`{op:'', startSeq:20, endSeq:20}` **被原样透传**；下游 `parseSurfaceOp`（`src/trail-model.ts:367-381`）把它归一化成 append。
- 影响：行为上等价于丢弃（都按 append 处理），但让「顶层 surfaceOp 存在」这一关键信号失真 —— 与 §9.1 强调的「最容易静默出错的链路」直接相关。
- 复现：`pnpm vitest run tests/verify-detail.spec.ts -t 'A8'`
- 建议：`typeof obj.op === 'string' && obj.op.length > 0`。

### F3【低】§9.4#4 声称新增的 `.ttl-mdShowAll` CSS 类不存在

- 契约 §9.4#4：「另加 4 个 CSS 类：`.ttl-jsonChildren` / `.ttl-jsonPreview` / `.ttl-strboxCopy` / `.ttl-mdShowAll`」。
- 实测：`grep -c '\.ttl-mdShowAll' src/client/styles.ts` → **0**（其余 3 个各存在）；但组件里确实用了这个类名：`src/client/markdown-result.tsx:151` `className="ttl-mdShowAll"`。真正的样式来自 `styles.ts:845-857` 的 `.ttl-mdTruncated button`。
- 影响：视觉无缺失（按钮仍有样式），但类名空挂、口径不实；若将来有人按类名写样式会发现"不生效"。
- 复现：`grep -n 'ttl-mdShowAll' src/client/styles.ts src/client/markdown-result.tsx`

### F4【低 / 风险】surfaceOp 全链路丢失时没有可见降级提示（两种失败形态都不可信）

契约 §9.1 只承认「丢掉顶层字段 → replace 退化为 append」，未规定可见性；§3.5 的 `replacedBy` 只在 replace **被成功应用**时才有值。实测两种形态（`tests/verify-detail.spec.ts` A6/A7）：

| 形态 | 实测结果（断言即证据） | 用户看到什么 |
| --- | --- | --- |
| 两者都丢 + 轮次仍开着（真实压缩时序：turn N+1 运行中） | `result.text === 'OLD-LONG-RESULTCOMPACTED'`，`replacedBy` 缺失 | 旧长文与压缩摘要**脏拼接**，无任何"这是替换后的内容"提示 |
| 两者都丢 + 无开启轮次（压缩后会话结束/重新折叠历史） | `result.text === 'OLD-LONG-RESULT'`，替换事件被整体丢弃 | **静默显示模型已看不到的旧长文**（正是 §15 风险表里要防的"误导用户"） |

- 复现：`pnpm vitest run tests/verify-detail.spec.ts -t '两者都丢'`
- 建议（可选加固）：wire 层对「`tool/result` 带 `message.content` 且 `sourceEventSeqs` 非空、但 `surfaceOp` 缺失」的事件透传一个 `surfaceOpLost: true` 标记，UI 在 `ttl-detailFoot` 显示提示。

### F5【观察，非缺陷】仓库仍有两处旧名 `turn-outline`，均非被禁位置

`grep -rn turn-outline --include='*' .`（排除 `node_modules/.git/lib`）→ `README.md` / `README.en.md` / `CHANGELOG.md` / `docs/detail-contract-v1.md` / `package.json:87`（`keywords`）/ `.github/workflows/release.yml:53`。
`src/`、`tests/` **零命中**（G5 测试）；契约 §1 的四处身份全部一致：`package.json:2` `dsh-trace-inspect`、`cordis.patch.yml:2-3` `id: trace-inspect` / `name: dsh-trace-inspect`、`build.mjs:43` `id: 'dsh-trace-inspect'`、`src/client/useTrail.ts:68` + `src/index.ts:261` 路由 `/trace-inspect/api/events`、`src/client/index.tsx:86` tab id `trace-inspect` 与 `:66` dataset `dsh-trace-inspect`。`release.yml:53` 的 `NPM_PUBLISHER_REPOSITORY: Andor-Z/dsh-turn-outline` 被 `if: github.repository == env.NPM_PUBLISHER_REPOSITORY`（`:98/:102`）用作守卫，注释明确本 fork 不发布 npm —— 与注释意图一致，故不算缺陷，但读起来容易误解。

### F6【信息】既有代码里的一处裸颜色（非本次新增）

`src/client/styles.ts:532` `100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }` —— `git show HEAD:src/client/styles.ts` 同样存在于 532 行，属 v0.3.1 既有代码，**不是本次新增**。G2 测试据此把「无裸 rgba」的判定范围限定在新增段（`.ttl-stepWrap` 起，styles.ts:539-911），全文件的硬编码 hex 检查仍然通过（所有 hex 都在 `var(--dsw-*)` fallback 内）。

## 5. 未证实项清单（明确缺证据，不要当成通过）

| # | 项 | 为什么未证实 | 需要什么才能证实 |
| --- | --- | --- | --- |
| U1 | AC8 的"定位准确（含轮次锚点）"、AC18 的"全键盘流程" | 无真实会话/DOM 环境；我只验证到"点击 ↗ 进入跳转路径"（无 `sessions` 服务时得到 `jumpFailed`），箭头键在 jsdom 下触发展开/收起 | 在真实 DSH 会话里手工点 ↗ 并确认滚动到正确消息；纯键盘录制 |
| U2 | AC13 表格横向滚动、代码块语言标签/复制 | CSS 与 labels 已接线，但真实渲染由宿主 `MarkdownText` 完成 | 浏览器内渲染超宽表格与大 `read` 结果截图 |
| U3 | AC17 的"明暗主题下无对比度问题" | 未在 light/dark token 下渲染 | 两种主题截图 + 对比度检查 |
| U4 | AC20 真实会话（≥100 轮、含压缩）无卡顿、内存峰值增幅 < 20% | 未做真实会话压测，也没有内存基线 | 真实会话打开 tab 的耗时/内存采样，与 v0.3.1 对比 |
| U5 | AC9 的像素级一致 | 只有结构/CSS 级证据（H1/H3 + HEAD diff） | 折叠态截图的像素比对（行高/字号/颜色/chips） |
| U6 | AC19 的"CI 绿" | 无法运行 GitHub Actions；且 `check:lib` 当前是假绿（F1） | CI 运行记录（需先修 F1 并提交 `lib/`） |
| U7 | 图片按 `attachmentId` 取 URL / 缩略图 | 契约 §0 已冻结为"不取 URL、只渲染占位 chip"，未验证项 | 与 AC 无关，仅记录契约遗留 |

## 6. 对抗性核对的补充结论（§9 逐条）

- §9.1 顶层字段链路：**成立** —— `baseOf`（`src/wire.ts:190-197`）对所有事件类型透传；模型 `surfaceOpOf` 顶层优先、`data.surfaceOp` 兜底（A1/A3/A4/A5）。丢失时的可见性问题见 F4。
- §9.2：1 ✅（E3）、2 ✅（`WireResultImage` 本地结构等价，未 import trail-model，A4 通过 wire 投影后语义一致）、3 ✅（E4 空 `attachmentId`/缺 `mediaType` 被丢弃）、4 ❌（F2：空串未丢）、5 ✅（E6/E7）、6 ✅（E8a/E8b）。
- §9.3：1 ✅（B8：`step.kind` 保持 error、`hasError` 不抖，只有 `result.kind` 重算）、2 ✅（B2：区间外的早期分段也被作废）、3 ✅（B6）、4 ✅（A7 vs A4：仅 replace 能在无开启轮次时生效）、5 ✅（B10）、6 ✅（B11）、7 ✅（B7）、8 ✅（C5）、9 ✅（C4/C7 双实现一致）。
- §9.4：1 ✅（`src/client/ui-primitives.ts:1` 的 `/// <reference path="./ui-primitives.d.ts" />`，typecheck 通过）、2 ✅（`setPrimitivesForTest`，F1/F2/H6 用它切换）、3 ✅（`locales.ts:83-86` 四键 + G7）、4 ⚠️（F3：`.ttl-mdShowAll` 缺）、5 ✅（F5–F8：根展开/嵌套折叠/环/超限只渲染 capped）、6 ✅（F3 逐条）、7 ✅（`markdown-result.tsx:106` 内部 `detectLang()`）。

## 7. 验证范围声明

- 写入范围严格遵守：只新增 `tests/verify-detail.spec.ts` 与本文档，未修改任何实现文件或他人的测试文件（`git status` 中其余 34 个路径均非我改动）。
- 所有"已证实"结论都有上文的文件:行号或命令原文；凡未取得证据的一律列入 §5，未把推测写成已证实。
- 未执行 `git commit/push`，未安装/启用任何插件。

---

## 8. 改后复验（Lead 依 F1–F4 修改后的第二轮验证）

复验时间 2026-10-17 01:54–01:57 (+08:00)。本节只覆盖改动面，§1–§7 的其余结论按 §8.6 的实测重新确认。

### 8.1 Lead 的改动清单（与代码逐条核对）

| # | Lead 的说法 | 代码实际 | 一致？ |
| --- | --- | --- | --- |
| F1 | 新增 `scripts/check-lib.mjs`（`git status --porcelain -- lib`，覆盖 modified/staged/deleted/**untracked**）；`check:lib` 改为 `node scripts/check-lib.mjs`；`.gitignore` 移除 `lib/` 行 | `scripts/check-lib.mjs:19` `execFileSync('git', ['status','--porcelain','--','lib'])`，非空即 `exit(1)`（同文件 `:25-29`）；`package.json:25` `"check:lib": "node scripts/check-lib.mjs"`；`git diff HEAD -- .gitignore` 显示 `-lib/` 被删除 | ✅ 一致 |
| F2 | `src/wire.ts` 的 `isSurfaceOp` 增加 `obj.op.length > 0` | `src/wire.ts:166-172`：`typeof obj.op === 'string' && obj.op.length > 0` | ✅ 一致 |
| F3 | 契约 §9.4#4 改为真实的 3 个类，并注明 `.ttl-mdShowAll` 的样式来自 `.ttl-mdTruncated button` | `docs/detail-contract-v1.md` §9.4#4 现为 `.ttl-jsonChildren`/`.ttl-jsonPreview`/`.ttl-strboxCopy` + 上述说明；与 `styles.ts` 实测一致（3 个类存在、`.ttl-mdShowAll` 无独立规则） | ✅ 一致 |
| F4 | 记为已知局限（契约 §9.5 + CHANGELOG Known limitations），理由：链路上没有第三方 hop | §9.5 第 1 行与 `CHANGELOG.md` Known limitations 第 1 条均在；理由与我 A6/A7 的结论一致 | ✅ 一致 |

### 8.2 A8 用例语义翻转（F2 修复后）

`tests/verify-detail.spec.ts:247-266` 改为断言**丢弃**，并补了修复后的边界：

```ts
it('A8 §9.2#4：{op:""} 是畸形 surfaceOp 必须被丢弃（F2 修复后的语义）', () => {
  ... surfaceOp: { op: '', startSeq: 20, endSeq: 20 } ...
  expect(projected.surfaceOp).toBeUndefined()                       // ← 翻转点
  expect(blank.surfaceOp).toEqual({ op: ' ', ... })                 // 纯空白仍合法（契约只要求"非空"，未要求 trim）
  expect(appended.surfaceOp).toBe('append')                         // 'append' 标签不受影响
  expect(replaced.surfaceOp).toEqual({ op: 'replace', ... })        // 合法 replace 不受影响
})
```

实测：`pnpm vitest run tests/verify-detail.spec.ts -t A8` 通过 → 修复确实生效（修复前同一断言是 `toEqual({op:''})`，现为 `toBeUndefined()`）。

### 8.3 F1 修复的正 / 反两向证据

反向（必须先复现出「假绿」已被消灭）：

```
$ cd /Users/lzx/Documents/GitHub/dsh-trace-inspect
$ pnpm build            # build ok → lib/index.js + lib/client.js，bundle contract check ok
$ pnpm check:lib
$ node scripts/check-lib.mjs
[check:lib] lib/ is out of date — run `pnpm build` and commit the result:
?? lib/
[ELIFECYCLE] Command failed with exit code 1.
checklib_exit=1                     ← 旧实现恒为 0（假绿），新实现如实报红

$ printf '\n' >> lib/client.js && pnpm check:lib ; echo $?     # 故意制造漂移
1                                   # 非 0 ✅（本轮该树本就因 ?? lib/ 为非 0，判据见下）
$ pnpm build && git hash-object lib/client.js
f40c1c7cca670745a4bd0354afcfa8b880e67817    # 与漂移前 before=f40c1c7... 相同 → 已复原 ✅
```

正向（在**临时 git 仓库里跑真实构建**，让 `lib/` 能被提交 —— 本仓库内因禁止 commit 无法进入该状态）：

```
$ T=$(mktemp -d); cd $T; git init; cp -R <repo>/src build.mjs package.json cordis.patch.yml scripts .; ln -s <repo>/node_modules .
$ node build.mjs                     # build ok → lib/index.js + lib/client.js
$ git add -A && git commit -m "committed lib"
$ node scripts/check-lib.mjs
[check:lib] committed lib/ matches a fresh build
exit=0                               # ✅ lib/ 与 src/ 一致 → 绿

$ printf '\n// drift\n' >> src/wire.ts && node build.mjs && node scripts/check-lib.mjs
[check:lib] lib/ is out of date — run `pnpm build` and commit the result:
M lib/index.js.map
exit=1                               # ✅ src 漂移 → 门禁报红（真实 bundle 的 sourcemap 变了）
$ git checkout -- src/wire.ts && node build.mjs && node scripts/check-lib.mjs
[check:lib] committed lib/ matches a fresh build
exit=0                               # ✅ 复原后重新变绿
```

脚本自身状态覆盖（临时 git 仓库，逐类构造）：clean committed **0**、`M` modified **1**、`D` deleted **1**、`A ` staged-new **1**、`??` untracked **1**、回归 clean **0**、git 不可用（PATH 只留 node）→ `[check:lib] git status failed: spawnSync git ENOENT`，**1**。全部符合预期。

构建可复现性（支撑 CHANGELOG"构建逐字节可复现，已实测"）：连续两次 `pnpm build` 后 `lib/index.js`+`lib/client.js` 合并 `git hash-object` 均为 `84a62bde0861757b72c68569b5e074e3741815c6`；四个产物哈希 `f2e7600f…/f40c1c7c…/8b695bd6…/706afca3…` 稳定。

### 8.4 本轮新发现

| # | 严重度 | 事实 | 证据 / 复现 |
| --- | --- | --- | --- |
| **N1** | 中（验收阻断） | **Lead 的验收条件"`lib/` 与 `src/` 一致时 `pnpm check:lib` exit 0"在当前树不可达**：`lib/` 尚未入库（`?? lib/`），脚本按设计报红。更严格的是：`git add lib` 之后仍是 `A  lib/...`，同样非 0 —— 必须**真正 commit** `lib/` 才能变绿。因此"CI 新增 check:lib"在提交前是红的，提交后才符合预期（语义正确，但需要一步提交动作收口） | 本仓库：`pnpm check:lib` → `?? lib/` + exit 1（见 8.3）；staged 形态在临时仓库复现为 `A  lib/b.js` → exit 1 |
| **N2** | 低 | **两处描述过时**（Lead 要求核对描述与代码一致性）：`.gitignore:11-12` 仍写 "CI re-builds and asserts `git diff --exit-code HEAD -- lib`"；`CHANGELOG.md:10` 仍写 "CI 新增 `pnpm check:lib` = `git diff --exit-code HEAD -- lib` 防漂移"。实际实现是 `node scripts/check-lib.mjs` → `git status --porcelain -- lib` | `grep -n 'git diff --exit-code HEAD -- lib' .gitignore CHANGELOG.md` → `.gitignore:11`、`CHANGELOG.md:10` 两处命中 |
| **N3** | 低 | **门禁残留脆弱性**：新判据依赖 `lib/` 不被 ignore。若日后有人把 `lib/` 重新写进 `.gitignore` 且 `lib/` 未被跟踪，`git status --porcelain -- lib` 返回**空** → 门禁重新变成假绿（与 F1 完全同形）。建议 `--ignored` 或额外断言 `git ls-files lib` 非空 | 临时仓库隔离复现：`git status --porcelain -- lib` → `[]`，`--ignored -- lib` → `!! lib/`，`node scripts/check-lib.mjs` → exit **0**（漏报） |
| **N4** | 极低（文案） | `scripts/check-lib.mjs:5-8` 的注释有编辑残留，句子不通："...no matter how far the committed... er, how far the on-disk bundle had drifted..." | 直接读文件 |

### 8.5 契约 / CHANGELOG 的其余核对（Lead 要求）

- §9.4#4 的 3 类清单 ✅ 与 `styles.ts` 一致；§9.5 的 F4 局限描述 ✅ 与 A6/A7 的实测逐字对应；§9.6 的四行处理 ✅ 与代码一致（除 N2 的过时命令串）。
- CHANGELOG 的"构建逐字节可复现" ✅ 已由我独立复跑证实（见 8.3）。
- CHANGELOG 的 "`lib/`（`index.js` + `client.js` + sourcemap）提交进仓库" ✅ 与 `.gitignore` 去掉 `lib/` 一致；`git status` 目前仍是 `?? lib/`，等待提交（N1）。

### 8.6 原结论是否受改动影响（实测重新确认）

F2 只把 `isSurfaceOp` 的合法集缩小了一个元素（`op === ''`），其影响面仅限 wire 的 surfaceOp 透传判定。原报告中依赖该判定的用例只有 A 组（A1/A2/A8 与 A4/A5 的投影入口）。

- 改后全量实测：`pnpm typecheck` exit 0；`pnpm test` → **Test Files 11 passed (11)，Tests 272 passed (272)**；`pnpm build` → `build ok` + `bundle contract check ok`。
- `tests/verify-detail.spec.ts` **70/70 通过**，分组计数与原报告 §2 完全一致：A8、B11、C7、D5、E10、F13、G7、H9（A8 用例数不变，只是断言翻转）。逐条通过列表：`A1 A2 A3 A4 A5 A6 A7 A8 B1 B2 B3 B4 B5 B6 B7 B8 B9 B10 B11 C1 C2 C3 C4 C5 C6 C7 D1 D2 D3 D4 D5 E1 E2 E3 E4 E5 E6 E7 E8a E8b E8c F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 F13 G1 G2 G3 G4 G5 G6 G7 H1 H2 H3 H4 H5 H6 H7 H8 H9`。
- 指纹层面：`src/wire.ts` 由 `a8b41a813b48` → `bd2e73c32596`（唯一被改的实现文件）；`src/trail-model.ts`（`a04689e4a9ae`）、`src/client/TrailTab.tsx`（`64b706ddea78`）、`src/client/styles.ts`（`7c982e74a0ae`）**未变**，故 §3 表里模型层/组件层的结论无需重跑即仍成立（且已被 70/70 再次覆盖）。
- 因此：**A1–A7、B、C、D、E、F、G、H 组的结论全部不变**；A8 由"不成立（口径未落实）"变为"已成立（修复后丢弃）"。

### 8.7 改后指纹（复验针对的版本）

```
bd2e73c32596 src/wire.ts                244002183461 scripts/check-lib.mjs
c3b0be7cf6a7 package.json               ded717a6728d .gitignore
3f8b698ea0ca .github/workflows/ci.yml   1771f5b52aaf docs/detail-contract-v1.md
70d351655968 CHANGELOG.md               8e09ae07122d tests/verify-detail.spec.ts
a04689e4a9ae src/trail-model.ts         64b706ddea78 src/client/TrailTab.tsx
7c982e74a0ae src/client/styles.ts
lib: f2e7600fc742 lib/index.js · f40c1c7cca67 lib/client.js · 8b695bd6d5ac lib/index.js.map · 706afca3e2a4 lib/client.js.map
```

### 8.8 本轮写入范围声明

- 只改了 `tests/verify-detail.spec.ts`（A8 语义翻转 + 边界补充）与本文档（新增本节）。
- 按 Lead 的明确指示做过一次 `lib/client.js` 漂移注入（`printf '\n' >>`）作为反向证据，随后 `pnpm build` 复原并校验哈希逐字节一致（`f40c1c7cca670745a4bd0354afcfa8b880e67817` 前后相同）；`lib/` 是构建产物，不属于任何人的源文件。
- 未修改 `docs/detail-contract-v1.md`、`CHANGELOG.md`、`scripts/check-lib.mjs`、`src/wire.ts` 等 Lead 的文件；N1–N4 只报告不修。

## 9. 提交与安装后实机复核（Lead，2026-10-17）

本节是 Lead 在**提交 + 推送 + 装进当前 profile** 之后补做的端到端复核，与上面 T5 的桌面验证互补（T5 验的是源码行为，这里验的是"真的装上了、真的在真实会话上跑出正确投影"）。

### 9.1 提交与推送

| 项 | 值 |
| --- | --- |
| 提交 | `8692d78 feat(detail): inspect any tool step in place — full params, Markdown results, images, errors (v0.4.0)`（43 个路径，含 `lib/` 4 个构建产物） |
| 分支 / 标签 | `origin/main` = 8692d78；`v0.4.0` 注解标签已推送 |
| 漂移门禁 | 提交前 `pnpm check:lib` **非 0**（`lib/ is not tracked`，证明不再是假绿）；提交后 `[check:lib] 4 committed lib/ files match a fresh build` → 0 |
| 本地门禁 | `pnpm typecheck` 0 / `pnpm test` **272 passed (11 files)** / `pnpm build` + `bundle contract check ok` |

### 9.2 装进当前 profile（desktop，DSH 0.2.0-rc.2）

用 App 内置 CLI（`/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh --version` → `0.2.0-rc.2`；**不是** PATH 里那个 0.1.2-alpha.2）：

```
$ ".../runtime/cli/bin/dsh" plugin --profile desktop add github:xx529/dsh-trace-inspect
+ dsh-trace-inspect github:xx529/dsh-trace-inspect
Packages: +1 -32   Done in 7.5s
```

| 证据 | 值 |
| --- | --- |
| profile 依赖 | `dsh-trace-inspect: github:xx529/dsh-trace-inspect` |
| profile bundles | 末尾新增 `dsh-trace-inspect` |
| 安装的包 | `dsh-trace-inspect@0.4.0`，`main: lib/index.js`，`lib/` 来自 git 树（**未执行任何构建脚本**，验证了「提交 lib/」这一发行决策） |
| cordis 加载 | `plugin_manager list_plugins` → `include:trace-inspect` / `moduleName: dsh-trace-inspect` / `enabled: true` / `fiberPhase: "active"` |
| 产物一致性 | 安装包 `lib/client.js` 的 sha256 `cedb5a7f…` 与仓库提交产物**逐字节相同**（保证装的就是验过的） |

### 9.3 真实会话上的主机路由端到端（装好之后）

对当前会话（`sessionId = 79345631-22b6-4a5d-b01d-a946804ef2df`，工作区即本仓库）直接打新路由：

```
$ curl -s -X POST http://127.0.0.1:19387/trace-inspect/api/events \
    -H 'content-type: application/json' -d '{"sessionId":"…","afterSeq":0}'
http=200 bytes=755817     → 753 events, hasMore=false（755 KB < 2 MiB 页预算）
```

| 观察 | 实测值 | 意义 |
| --- | --- | --- |
| `tool/call` 带 `argsBytes`/`argsTruncated` | 144 / 167 条；含 `turn`/`step` | 新契约字段真的在线上响应里 |
| **被截断的参数** | `write`：`argsBytes=44493`，下发 `len(arguments)=32769`（**旧版只给 512**） | 用户最初痛点在真实数据上被修掉 |
| `tool/result` 带 `content` | 240 / 240（旧版 **0**） | 结果不再被整体丢弃 |
| 结果被裁剪 | 1 条（`contentTruncated`），最大 `contentBytes=44078` | RESULT_CAP 生效 |
| `surfaceOp` 透传 | 362 条：`append` 266、`replace` **96** | 真实压缩替换链路已被真实数据覆盖（不只是构造用例） |
| 图片块 | 0 | 本会话无图片结果，图片路径仍只有单测证据（U7/§9.5） |

### 9.4 仍未在实机验证的（与 §5 一致，不重复算通过）

客户端 tab 的**可视**验证：client 半在页面加载时注册，插件是本次会话运行期间才装的，所以需要用户在 GUI 里硬刷新（Cmd/Ctrl+Shift+R）后打开 better-sidebar 的 **+ 菜单 → 轮次轨迹** 才能看到新的展开交互；本报告没有做浏览器内的像素/交互复核（U1–U5 仍然成立）。

---

## 11. 第二轮口径变更复验：F7「replace 只改写 result」（契约 §11.2）

复验时间 2026-10-17 02:17–02:20 (+08:00)。本节编号用 §11（**§10 特意留空**：契约 §11.1 把实机浏览器证据指向 `docs/verification-v1.md §10`，该节应由 Lead 补，我不占用）。

### 11.1 口径变更与实现核对

| 项 | 内容 |
| --- | --- |
| 旧口径 | `docs/detail-contract-v1.md:155`（§6.3.2）与 `:346`（§9.3#7）：replace 把 `result` **及** `args`/`argsPreview` **改写**为新内容 |
| 新口径 | `docs/detail-contract-v1.md` **§11.2**（Lead 裁定，覆盖上述两处）：replace **只改写 `result`**（text/images/truncated/replacedBy/replacedFrom），**不得**改写 `args`/`argsPreview`/`argsBytes`/`argsTruncated` |
| 实现 | `src/trail-model.ts` 的 `applyContent()` replace 分支现在只 `state.replaces.set(seq, …)` + `state.segments.set(seq, …)`，不再触碰 `step.args*`；指纹 `92e0385c7dd9`（§8 时为 `a04689e4a9ae`） |
| 实机依据 | Lead 在独立 profile + Playwright 的真实会话里看到：被 replace 覆盖的步骤，行预览与「参数」页都成了 `[dsh-jev-compaction] …`，而日志里 `tool/call.arguments` 完好 → 与我在模型层看到的旧行为（A4/B7 原断言）完全一致 |

### 11.2 被翻转 / 扩展的用例（只在 `tests/verify-detail.spec.ts`）

| 用例 | 改动 |
| --- | --- |
| **A4**（`:175-196`） | 标题改为「…replace 改写 result（不是退化 append），且不动 args（§11.2）」；`expect(step.args).toBe('COMPACTED')` → **`expect(step.args).toBe('cat big.log')`**；结果侧断言（`result.text='COMPACTED'`、`replacedBy=182`、`replacedFrom=20`、`seq=182`）**不变** |
| **B7**（`:380-413`） | 标题改为「§11.2：replace 只改写 result，不改写参数（args/argsPreview/argsBytes/argsTruncated）」；4 个参数断言从「等于替换文本」翻转为「**等于 tool/call 原值**」（`args`/`argsPreview` 为原文、`argsBytes = original.length`、`argsTruncated=false`）；保留结果侧断言；**新增边界**：目标步原本**没有 result** 时（replace 打 tool/call 的 seq 10）也只新增 result、不动参数 |
| **H9**（`:1298` 起，端到端 UI） | 扩展为实机 F7 的回归守卫：折叠行预览 `.ttl-rowArgs` 仍是 `cat big.log`（不得变成压缩摘要）；「结果」页显示 `COMPACTED` + `Replaced by compaction (seq #182)`；切到「参数」页后显示原始命令且**不含** `COMPACTED` |

### 11.3 同一断言的前后实测（旧口径 → 新口径）

```
① 旧实现 + 旧断言（§1 的 01:53 与 §8 的 01:58 两轮）
   tests/verify-detail.spec.ts  70 passed (70)     ← 其中 A4 断言 args === 'COMPACTED' 通过
   ⇒ 证明旧代码确实把 replace 内容写进了 args

② T7 改后 + 旧断言（02:17:53，我未改任何断言前）
   Test Files  1 failed (1)
        Tests  2 failed | 68 passed (70)
   A4 → expected 'cat big.log' to be 'COMPACTED'
   B7 → expected '{"path":"a","new_string":"x"}' to be 'COMPACTED-ARGS'
   ⇒ 证明新代码只改 result、不动 args

③ 翻转断言后（本轮）
   tests/verify-detail.spec.ts  70 passed (70)
```

### 11.4 该文件里「args 相关」断言的完整复查（Lead 要求顺带扫）

`grep -n 'step.args\|argsPreview' tests/verify-detail.spec.ts` 命中：`:196`(A4)、`:396-399`(B7)、`:410`(B7 边界)。逐一判定：

| 位置 | 性质 | 是否受 §11.2 影响 | 实测 |
| --- | --- | --- | --- |
| A4 `:196` | replace 后的**参数**断言 | **受影响 → 已翻转** | 通过 |
| B7 `:396-399` / `:410` | replace 后的**参数**断言（含无 result 边界） | **受影响 → 已翻转** | 通过 |
| H9 `:1298` 起 | replace 后的**行预览 / 参数页**（UI） | 受影响 → 已扩展为守卫 | 通过 |
| E2 `:674` / E3 `:690` | wire 层 `tool/call` 投影边界（32768/32769、空 arguments） | 不经 replace，不受影响 | 通过（未改） |
| H1 `:1188` | **无 replace** 的行预览（`npm test`） | 不受影响 | 通过（未改） |
| A6 `:216` / A7 `:232` | surfaceOp 丢失时的**结果合并**语义 | 只断言 `result.text`，不涉及 args | 通过（未改） |

结论：除 A4/B7/H9 外，没有其它依赖「replace 改写 args」的断言。

### 11.5 重跑结果（真实输出）

```
$ pnpm typecheck
tests/tool-detail-route.spec.ts(223,7): error TS2353: Object literal may only specify known
properties, and 'surfaceOp' does not exist in type 'SessionEventLike'.
[ELIFECYCLE] Command failed with exit code 2.        typecheck_exit=2
（该文件是队友新增、未被跟踪的新文件；tests/verify-detail.spec.ts 对此错误 0 命中 → 见 §11.6 O1）

$ pnpm typecheck        # 02:20:25 复测：该文件所有者已修好（同一命令）
$ tsc --noEmit
typecheck_exit=0

$ pnpm test            # 02:19:17 与 02:19:21 连续两轮
 Test Files  15 passed (15)
      Tests  351 passed (351)                        test_exit=0
（运行期间队友仍在写新测试：338 → 345 → 351；02:18:42 那一轮曾出现 1 个非本文件用例的瞬时失败）

$ pnpm typecheck && pnpm test && pnpm build        # 02:20:48 收口复测
typecheck_exit=0
 Test Files  15 passed (15)
      Tests  353 passed (353)                        test_exit=0
build ok → lib/index.js + lib/client.js / bundle contract check ok
（用例仍在增长：351 → 353，说明工作树仍在被队友写入；我的文件稳定 70/70）

$ pnpm vitest run tests/verify-detail.spec.ts
 Test Files  1 passed (1)      Tests  70 passed (70)

$ pnpm build
build ok → lib/index.js + lib/client.js
bundle contract check ok                             build_exit=0
（T7 改了 model，故重建同步产物：lib/index.js 8665c4808d36、lib/client.js 7b5f0d1e9b51）
```

### 11.6 本轮顺带发现（只报告，不修）

| # | 严重度 | 事实 | 证据 / 复现 |
| --- | --- | --- | --- |
| **O1** | 观察（曾瞬时阻塞 CI，**已消除**） | 02:19 复验时 `pnpm typecheck` **失败**，唯一错误来自队友正在写的 `tests/tool-detail-route.spec.ts:223`：`const replace: SessionEventLike = { type, seq, surfaceOp: {…}, data: {…} }` —— `surfaceOp` 属于 `src/wire.ts` 的 `ProjectedEvent`，而 `src/context-types.ts` 的 `SessionEventLike` 没有该字段（TS2353）。**02:20:25 复测已是 `tsc --noEmit` exit 0**（所有者已修）。留档原因：CI 的 `ci.yml` 先跑 typecheck，这类字面量标注（也正是我第一轮踩过的同一个坑）在写入窗口内会让门禁变红 | 红：§11.5 上半段原文（02:19）；绿：`pnpm typecheck`（02:20:25）→ `typecheck_exit=0` |
| **O2** | 低 | 旧口径文本仍在且无内联废弃标记：`docs/detail-contract-v1.md:155`（§6.3.2）与 `:346`（§9.3#7）仍写着「改写 args/result」。§11.2 声明了覆盖，但照旧文实现正是 F7 的成因。建议在两处加「（已被 §11.2 覆盖）」 | `sed -n '155p;346p' docs/detail-contract-v1.md` |
| **O3** | 低 | 契约 §11.3（F8，`unwrapFileResult`）**尚未实现**：`grep -c unwrapFileResult src/client/markdown-result.tsx` → **0**，该文件指纹 `5c31f62f0312` 与 §8 相同 → 实机上 `read` 的 XML 信封仍会退化成转义文本，AC13 仍不通过。我的 F 组用例不受影响（F3 的输入都不是该信封） | 同上 grep |
| **O4** | 信息 | 契约 §11.1 引用「证据见 `docs/verification-v1.md` §10」，但本报告当前没有 §10（§9 是 Lead 的提交/安装复核）。为避免误占，我用了 §11 | `grep -n '^## ' docs/verification-v1.md` |
| **O5** | 信息 | 复验期间工作树持续变化（测试文件 11 → 15、用例 272 → 353、`pnpm typecheck` 曾瞬时由绿转红后又被所有者修好）→ 本节结论只对 §11.7 的指纹成立 | §11.7 |

### 11.7 本轮指纹（复验针对的版本）

```
92e0385c7dd9 src/trail-model.ts               bd2e73c32596 src/wire.ts
5c31f62f0312 src/client/markdown-result.tsx   8de0a3b49d86 docs/detail-contract-v1.md
ff7b96c4d0a8 tests/verify-detail.spec.ts     84f19998e76e tests/trail-detail.spec.ts
e3f523cc7754 tests/tool-detail-route.spec.ts 2af471e060c9 tests/detail-styles.spec.ts
1db1d59f9874 tests/attachment-route.spec.ts  997c9c717e1a tests/attachment-url.spec.ts
lib: 8665c4808d36 lib/index.js · 7b5f0d1e9b51 lib/client.js
```

### 11.8 本轮写入范围声明

- 只改 `tests/verify-detail.spec.ts`（A4/B7 断言翻转 + B7 边界 + H9 扩展）与本文档（新增本节）。
- 未修改 `src/trail-model.ts`、`src/client/markdown-result.tsx`、`docs/detail-contract-v1.md`、`CHANGELOG.md`、`scripts/check-lib.mjs` 及队友的任何测试文件；O1–O5 只报告不修。
- 未执行 `git commit/push`；`pnpm build` 已把 `lib/` 与 T7 的新 model 同步（构建产物，属重建而非改动源码）。

## 10. 独立 profile 实例的浏览器级复核（Lead，2026-10-17）

> §5 列出的 U1–U7（未证实项）在本节用**真实浏览器 + 真实会话**复核。执行者是 Lead（T5 在 §11 中说明本节由 Lead 补），因此这里给出的是**原始观测值 + 可复现命令**，便于任何人重跑。

### 10.1 环境（可复现）

```sh
# 从 shipped web 模板新建一个独立 profile（不碰 desktop / web）
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  trace-verify --from-default-profile web --port 19487 --no-open
# 装依赖插件 + 本仓库（link: → 改 src 后重建并重启即可复测）
"$CLI" plugin --profile trace-verify add dsh-better-sidebar@0.26.1
"$CLI" plugin --profile trace-verify add /Users/lzx/Documents/GitHub/dsh-trace-inspect
```

| 项 | 值 |
| --- | --- |
| profile | `/Users/lzx/.dsh/profiles/trace-verify`（bundles: `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、`dsh-better-sidebar@0.26.1`、`dsh-trace-inspect`(link:)） |
| 运行时 | DSH `0.2.0-rc.2`（App 内置 CLI，**不是** PATH 里 0.1.2-alpha.2 那个） |
| 浏览器 | Playwright Chromium，1440×900 |
| 会话 | `session-a29878e7…`（Research，5 轮 / 177 步 / 6 个 `read_image` / 84 处 replace）、`session-4d51254b…`（dsh-task-gantt，**145 轮 / 18,358 事件 / 2,698 步 / 2,232 处 replace / 37 张图**）、本仓库当前会话 |

### 10.2 客户端半：注册与交互（实测数值）

| 检查 | 方法 | 实测结果 |
| --- | --- | --- |
| tab 注册 | 打开右侧边栏 | 「+ 菜单」出现**「轮次轨迹」**；面板显示 `5 轮` + chips `全部 177 / 失败 2 / bash 131 / write 10 / edit 7 / read_image 6 / 更多` |
| 行内展开（AC8 前半） | 点 `write` 步骤行 | 出现 `region "write 详情"`（`aria-label` 正确），页签 `参数/结果/原始`，默认选中 `结果`；页脚 `完整 · seq #923 · 复制全部` |
| JSON 树（AC10） | 切「参数」页 | `.ttl-json` 3 行 + `.ttl-jsonToggle` 1 个 + `.ttl-strbox` 1 个（30 KB 字符串折叠）；`max-height:52px`、`overflow-y:auto`、单字段复制按钮存在；折叠↔展开 `1→3→1→3`；字体 `SF Mono…`、`11.5px/17px` |
| 按工具默认视图（AC11） | 点 `bash` 步骤 | 「结果」页默认 **原文**（`ttl-md-raw` 存在、`.ttl-md` 不存在），同时提供「渲染/原文」切换；点击切换后 `.ttl-md` 出现 |
| 视图记忆（AC12） | 切「原文」→ 收起 → 重新展开 | 仍为原文（`rememberedRaw: true`） |
| 错误结果（AC14） | `失败` chip → 展开错误行 | `.ttl-errorBlock` 显示 `TeamError · TEAM_MEMBER_NOT_FOUND` + 原文；页脚 `完整 · seq #389` |
| 图片块 | `read_image` chip → 展开有图的那步 | `图片：A-inline-expand.png` + `image/png` + `1440×860 · 143 KB` 占位 chip（缩略图 = v0.5.0 §10.5） |
| 跳回定位（AC8 后半） | 在轮次 1 点某步 `↗` | 对话区自动加载更早内容并滚动；**视口内命中的叶子节点文本与该步参数逐字一致**（`top=247 ∈ 聊天视口 76–900`），`scrollHeight` 由 7,007 → 12,596 |
| 键盘（AC18） | 行聚焦 `ArrowRight` / `ArrowLeft` | 展开 / 收起，焦点保持在行上（`aria-expanded` 同步） |
| 会话切换 | 切到另一会话再回来 | 面板重挂、展开态清空（契约 §6） |
| 折叠态度量（AC9） | 取 `.ttl-row` 计算样式 | `height 24px / font-size 12px / line-height 18px`，`padding 3px 6px`、`border-radius 4px` |

### 10.3 AC9 的跨版本比对（为什么不是截图 diff）

- **规则级**：把上游 `dsh-turn-outline@0.3.1` 的 CSS（`lib/client.js` 内联样式串）与当前 `src/client/styles.ts` 逐选择器比对，折叠态相关规则**逐字节相同**：
  `.ttl-row`、`.ttl-rowDot`、`.ttl-rowName`、`.ttl-rowArgs`、`.ttl-chip`、`.ttl-turnRow`、`.ttl-turnHead` → 全部 `same: true`（脚本见本节末尾）。
- **数值级**：实机 `getComputedStyle` 得到的行高/字号/行高/内边距/圆角与上表一致（v0.3.1 官方基线 12px/18px）。
- **为什么不做像素 diff**：两个版本共用 `ttl-*` 类名，若并装在同一 profile 里会**互相污染 CSS**（后注入者覆盖同名选择器），截图 diff 的结论会失真。因此改为「规则逐字节 + 计算样式」这一对更严格且无污染的判据。v0.4.0 唯一新增的是契约要求的展开态元素（caret / `↗` / 详情带），折叠态本身未动。

### 10.4 AC20：真实最大会话的量化（数据层 + IPC）

对 `session-4d51254b…`（145 轮 / 18,358 事件 / 2,232 处 replace）跑真实路由分页 + 真实模型：

```
events=18358 pages=10 fetch=260ms pageMs=[67,21,19,23,…] maxPageMiB=1.346 totalMiB=10.11
cache-miss page latency avg=23ms
foldTurns: 182ms turns=145 steps=2698 withResult=2660 replaced=2232 images=37 heapDelta=12.3MiB
TrailFolder incremental push: 150ms (122166 events/s) turns=145 stats={"total":2698,"failed":38,…}
snapshot() on fold: 0.0ms
```

| 结论 | 数值 | 对照要求 |
| --- | --- | --- |
| 单页字节预算在真实数据上生效 | 最大页 **1.346 MiB** | ≤ 2 MiB（§5.2） |
| 大会话分页连续性 | 10 页、`afterSeq` 无缝、260ms 全量 | 无重复/无断档 |
| 客户端冷折叠吞吐 | 2,698 步 / 2,232 replace / 182ms | AC20 无卡顿 |
| 客户端增量折叠吞吐（live 路径） | **12.2 万事件/秒**（150ms / 18,358 事件） | 会话运行中增量刷新 |
| 折叠内存增量 | 12.3 MiB（含 2,660 条结果文本） | 客户端 LRU 建议上限 16 MiB |
| 列表 DOM 规模 | 只渲染窗口内的 ~20 个 `.ttl-step-wrap`（其余折叠态不建 DOM） | §11 首屏性能 |

> 说明：AC20 的 GUI 端「点开 tab 到首屏」在**中等会话**（977 事件 / 177 步）上观感即时、无长任务告警；**大会话的 GUI 挂载**与暗色对比度在 v0.5.0 构建后的复验轮里补测（见 §12）。这里给出的是同一风险点（传输 + 折叠）在真实最大会话上的硬数字。

### 10.5 复核脚本（可重跑）

- AC9 规则比对：`node /tmp/csscmp.mjs`（读上游 `lib/client.js` 与 `src/client/styles.ts`，打印每个选择器的 `same:`）
- AC20 量化：`node --expose-gc /tmp/ac20.mjs session-4d51254b-d8f4-4f21-a245-6b3ee56f6a99`（走真实路由分页 + 真实 `trail-model`）

### 10.6 观察项（非本插件缺陷）

- 控制台固定出现核心宿主路由 `GET /api/changes.summary?…` 的 **404**（本 profile 未装提供该能力的插件）。与 `dsh-trace-inspect` 无关（我们只有 `/trace-inspect/api/*`）。
- 本 profile 未装 `dsh-market`，因此「插件」页里的市场相关能力缺失，属环境差异。

---

## 12. v0.5.0 增量独立验证（T10，2026-10-17）

> 验证者：`verifier-v050`（**独立于 T6/T7/T8/T9 实现者**，只找错、不改实现）。
> 范围：契约 `docs/detail-contract-v1.md`「附：v0.5.0 契约补充」§10–§11 的增量 —— 两条新 host 路由（附件图 / 按需完整详情）、`mergedFrom`、F7、F8、ZoomOverlay、懒加载、规范与产物一致性。
> 唯一新增测试文件：`tests/verify-v050.spec.tsx`（56 例）。§1–§11 既有内容未改动。

**并发变更时间线（诚实记录）**：本轮验证与 Lead 的收口并行发生，期间有三处**他人**改动落在我验证过的文件上，我每次都重跑并更新结论：
1. `tests/verify-detail.spec.ts` G4 在 06:17:53 被修（加入 `react-dom`）→ 全量从 448/1红 变为 449–452 全绿（**F-V1**）。
2. `src/client/markdown-result.tsx` 在 06:38:40 被改（新增 §11.4#5 裁定：`.md` 信封且 body 无 Markdown 信号时显示解包后的 body）→ 我同步更新了 E9 并新增 E10，随后 `pnpm build` 重建 `lib/`（**F-V6**）。
3. 契约同时新增了 **§11.5 实机复核第二轮**（Lead 在 19487 profile 上的浏览器级证据）；本轮我只做数据层/jsdom 层验证，**未独立复核 §11.5 的数字**（见 §12.5 U1）。
4. `src/index.ts` 在 06:53:21 被改（只补 `ToolDetailItem.seq` 的 JSDoc，+5 行；即 **F-V4** 的修复）→ 我在 07:08 重建并复跑：`npx vitest run tests/verify-v050.spec.tsx` 56/56、`pnpm test` 452/452；`lib/index.js` 的 sha256 未变（纯注释）→ §12.6 的 `src/index.ts` 指纹已更新为该 revision，其余引用行号也已按 +5 平移校正。

### 12.1 跑过的命令与真实输出

| 命令 | 真实结果 |
| --- | --- |
| `pnpm typecheck` | **0**（`$ tsc --noEmit`，无诊断输出） |
| `npx vitest run tests/verify-v050.spec.tsx` | **56 passed / 56**（`Test Files 1 passed`） |
| `pnpm test`（06:07，G4 修复**前**） | **448 passed，1 failed**（17 个文件）；唯一失败 = `tests/verify-detail.spec.ts` G4（见 §12.3 **F-V1**） |
| `pnpm test`（06:47 与 07:08 两轮，最终） | **452 passed / 452，17/17 文件全绿**（07:08 = `src/index.ts` 06:53 变更后重建复跑） |
| `pnpm build` | **0** → `build ok → lib/index.js + lib/client.js` + `bundle contract check ok` |
| `pnpm check:lib` | **1** → `[check:lib] lib/ is out of date — run \`pnpm build\` and commit the result: M lib/client.js …`（见 §12.3 **F-V2**） |
| 连续两次 `pnpm build` 后 `shasum -a 256 lib/*` | 两次完全一致（`diff` 空）→ 构建确定性成立，工作区 `lib/` == 最新构建 |
| `git status --porcelain -- lib` | ` M lib/client.js` / ` M lib/client.js.map` / ` M lib/index.js` / ` M lib/index.js.map`（v0.5.0 尚未提交，故 check:lib 非 0） |

复现（本轮全部命令均可直接重跑）：

```bash
cd /Users/lzx/Documents/GitHub/dsh-trace-inspect
pnpm typecheck && npx vitest run tests/verify-v050.spec.tsx && pnpm test
pnpm build && pnpm check:lib
```

**F11 的 HEAD 基线对照**（折叠态行结构，`git show HEAD:src/client/TrailTab.tsx`）：
v0.4.0 的 `.ttl-stepWrap` 子节点 = `button.ttl-row`（内含 `ttl-caret` / `ttl-rowDot` / `ttl-rowName` / `ttl-rowArgs` 共 4 个 span）+ `button.ttl-jump` + 条件渲染 `StepDetail`；v0.5.0 只在该行 `onKeyDown` 里多了一个 `⌘⇧O` 分支，节点结构逐字相同 → F11 的「折叠态未新增子节点」成立。

### 12.2 结论表（逐项 已证实 / 未证实 / 不成立）

| # | 契约项 | 结论 | 证据（文件:行号 / 用例） |
| --- | --- | --- | --- |
| 1 | 附件路由**只按会话日志授权**（有引用 200；无引用 404；别的 session 引用 → 404；不按 id 直读） | 已证实 | A1/A2/A9；`src/index.ts:659-674`、`src/index.ts:383-396`、`src/index.ts:621-635` |
| 2 | 200 的响应头：`content-type` = 该 image 块的 `mediaType`、`x-content-type-options: nosniff`、`cache-control: private, max-age=300`、原始字节 | 已证实 | A3；`src/index.ts:417-423` |
| 3 | 非 GET → 405；围栏（非 loopback Host / cross-site / 异源 Origin）→ 403；无 Origin 的 `<img>` GET 放行 | 已证实 | A4/A5；`src/index.ts:367-374`、`src/index.ts:116-129` |
| 4 | `attachments` 服务缺失 / 无 `readImage` / 读取拒绝 → 404 且不抛未捕获异常 | 已证实 | A6；`src/index.ts:405-409`、`src/index.ts:424-427`、`src/index.ts:685-703` |
| 5 | `mediaType` 不在平台 4 个白名单 → 404 且**不调用** `readImage`，不回显该 mediaType | 已证实 | A7（含 `IMAGE/PNG`、`image/svg+xml`、`image/avif` 等 5 种反例 + 4 种白名单正例）；`src/index.ts:400-403`、`src/index.ts:500` |
| 6 | sessionId/attachmentId 空 / 空白 / 控制字符 / >512 → 400；恰好 512 属结构性合法（→404） | 已证实 | A8；`src/index.ts:546-549`、`src/index.ts:477-478` |
| 7 | 授权结果按 session 缓存：LRU ≤16、TTL ≤10s、**不同 session 不互相命中** | 已证实 | A2/A10/A11；`src/index.ts:644-674`、`src/index.ts:480-482` |
| 8 | `/tool-detail`：`seqs` 非数组或 >32 → 400；恰好 32 → 200；不存在的 seq 被省略 | 已证实 | B1/B2/B3；`src/index.ts:456-460` |
| 9 | 不施 `ARGS_CAP`/`RESULT_CAP`：>32 KiB 参数与结果完整返回 | 已证实 | B4（40 KiB 逐字节相等，`truncated` 缺省）；`src/index.ts:578-584`、`src/index.ts:837-842` |
| 10 | 响应 >8 MiB → 按 4 MiB 截断、`truncated:true`、`argsBytes`/`contentBytes` 仍为原始大小、整包 ≤8 MiB | 已证实 | B7；`src/index.ts:965-978`、`src/index.ts:931-952` |
| 11 | 4 MiB 边界落在多字节码点中间 → 退到码点边界，**无 U+FFFD** | 已证实 | B8（3 字节字符，截断后字节数仍为 3 的倍数）；`src/index.ts:920-928` |
| 12 | 按 `callId` 聚合整步：请求 call seq 或任一 result seq 都返回同名/同参数/同内容 | 已证实（**F-V4** 已由 Lead 补齐接口注释，见 §12.3） | B5；`src/index.ts:851-917` |
| 13 | `replace` 聚合语义与客户端折叠一致（替换前内容整段丢弃） | 已证实 | B6；`src/index.ts:813-817` |
| 14 | `mergedFrom`：首次 = 1、append 递增、replace 重置为 1（并记 `replacedBy`/`replacedFrom`） | 已证实 | C1/C2/C3；`src/trail-model.ts:472`、`src/trail-model.ts:415-480` |
| 15 | 「无序到达一致」（replace 早于其覆盖的 append，call 已登记） | 已证实 | C4 |
| 16 | 契约字面「最终结果必须与到达顺序无关」在 **replace 早于其 tool/call** 时 | **不成立**（低危：真实链路不可达，见 **F-V3**） | C5（characterization 用例） |
| 17 | `TrailFolder`（增量）与 `foldTurns`（批量）同流输出一致 | 已证实 | C6；`src/trail-model.ts:488-654` |
| 18 | **F7** `replace` 只改 `result`；`args`/`argsPreview`/`argsBytes`/`argsTruncated` 逐字段保持原值 | 已证实 | D1/D3；`src/trail-model.ts:643-652`（`applyContent` 不再写 args） |
| 19 | F7 边界：目标步**原本无 result** 时 replace 建出 result，参数原样 | 已证实 | D2 |
| 20 | **F8** `.md` 信封解包 + `^\d+: ?` 行号剥离，Markdown 判定/渲染都以 `body` 为输入 | 已证实 | E1/E7；`src/client/markdown-result.tsx:84-112`、`130-137` |
| 21 | F8 末尾工具 chrome（`(End of file - total N lines)` / `(Showing lines A-B of N. …)`）被剥离；**正文中间同形文本不误删** | 已证实 | E2/E3；`src/client/markdown-result.tsx:55`、`101-111` |
| 22 | F8 `.ts`/`.json`/image 信封一律原文（不因正文含 `#`/`| --- |` 而误渲染） | 已证实 | E4/E6；`src/client/markdown-result.tsx:115-117`、`130-137` |
| 23 | F8 缺 `</content>` / 非信封 → `unwrapFileResult` 返回 `null` | 已证实 | E5；`src/client/markdown-result.tsx:62-63`、`86-87` |
| 24 | F8 `loadPrimitives()` 为 null → 显示**原信封** + `markdownFallback`（§11.4 裁定 4） | 已证实 | E8；`src/client/markdown-result.tsx:241-252` |
| 24b | F8 `.md` 信封但 body 无 Markdown 信号 → 字面回退显示**解包后的 body**（§11.4#5） | 已证实 | E9/E10；`src/client/markdown-result.tsx:135-142`、`257` |
| 25 | F8 `<type>image</type>` 信封也返回对象、但不渲染（§11.4 裁定 3） | 已证实 | E4 |
| 26 | **ZoomOverlay**：`role=dialog`+`aria-modal`、Esc 关闭、↑↓ 切步、⌘F 搜索、⌘C 复制当前页、导出 JSON、关闭后焦点回触发行 | 已证实 | F1–F6；`src/client/ZoomOverlay.tsx:434-450`、`312-348`、`src/client/TrailTab.tsx:911-918` |
| 27 | 懒加载：inflight 去重（同一 seq 并发只发 1 次）、失败保留预览、用户重试**最多 1 次** | 已证实 | F7/F8；`src/client/TrailTab.tsx:873-890`、`207-215`、`274-297` |
| 28 | 缩略图：`attachmentUrl` + `loading="lazy"` + `alt`；`onError` 隐藏 img、保留 chip、显示 `imageLoadFailed` | 已证实 | F9；`src/client/ZoomOverlay.tsx:133-187` |
| 29 | sessionId 为空/空白 或 attachmentId 为空 → 不渲染 `<img>`（不发未授权请求） | 已证实 | F10；`src/client/attachment-url.ts:23-29` |
| 30 | 折叠态行 DOM 与 v0.4.0 一致（未新增子节点） | 已证实 | F11 + §12.1 的 HEAD 源码对照 |
| 31 | 无新增 npm **运行时**依赖（HEAD 对比：`dependencies` 均缺省、peer 相同、lockfile importers 无 `dependencies:`） | 已证实 | G1；`package.json`、`pnpm-lock.yaml`、`git show HEAD:package.json` |
| 32 | 产物只 require 宿主种子（react / react-dom / ui-primitives） | 已证实 | G2；`lib/client.js` 的 3 个 `require` |
| 33 | 未把不可信内容交给 `innerHTML`/`dangerouslySetInnerHTML`/`eval`（源码仅注释提及，产物 0 命中） | 已证实 | G3；`lib/client.js` 无 `innerHTML|dangerouslySetInnerHTML|eval(|new Function(` |
| 34 | UI 无裸 hex（hex 仅出现在 `var(--…)` fallback 内）；20 个新类名 + 13 个新文案键齐备 | 已证实（1 处 `rgba(0,0,0,0)` 见 **F-V5**） | G4；`src/client/styles.ts:1138` 等、`src/client/locales.ts:172-184,256-268` |
| 35 | `package.json.version` == CHANGELOG 最新标题（bump-proof） | 已证实 | H1（两者均 `0.5.0`） |
| 36 | `lib/` 由 git 跟踪，且 v0.5.0 host/client 标记都在产物里 | 已证实（构建产物与 src 一致）；`pnpm check:lib == 0` 只能等提交后成立 → **F-V2** | H2/H3 |
| 37 | AC9 像素级一致 / AC13 真实表格溢出 / AC17 明暗对比度 / AC20 大会话 GUI 挂载 | 证据由 Lead 在契约 **§11.5 实机复核第二轮**给出（19487 profile / Playwright）；**本验证者未独立复核**，且 §11.5 自认仍缺「懒加载 GUI 点击路径」与「大会话 GUI 挂载」 | 契约 §11.5；见 §12.5 U1 |

### 12.3 发现的真实缺陷（含复现命令）

**F-V1【中 · 本轮已修复】`pnpm test` 曾变红：`tests/verify-detail.spec.ts` G4 的期望集没有跟进 v0.5.0 的 `react-dom`。**

- 状态：**修复已落地（并发，非本验证者所改）**。06:07 我跑全量时的真实输出是 `Test Files 1 failed | 16 passed`、`Tests 1 failed | 448 passed`；06:17:53 该测试被改（`ls -l` mtime，标题变为「G4 构建产物的 require 只含 react / react-dom / ui-primitives」），06:33 我重跑全量为 **449 passed / 449（17/17）**，最终一轮（06:47，§11.4#5 落地并重建后）为 **452 passed / 452（17/17）**。本节保留原始观测，供追溯。
- 修复前现象：`expected [ …(3) ] to deeply equal [ …(2) ]`，`+ "react-dom"`。
- 位置：`tests/verify-detail.spec.ts:1086-1091`（v0.4.0 验证者所写）断言 `lib/client.js` 的 `require` 集合恰为 `['@deepseek-ai/dsh-client-ui-primitives','react']`。
- 事实：v0.5.0 的 `ZoomOverlay` 用 `React.createPortal`，`build.mjs` 明确把 `react-dom` 与 `react` 一起标为 external（`build.mjs:8-12` 注释 + `external: ['react','react-dom','@deepseek-ai/dsh-client-ui-primitives']`），产物因此出现第 3 个 `require("react-dom")`。
- 判定：**实现与 build 自洽，过期的是这条断言**（不是「多了一个运行时依赖」：`package.json` 无 `dependencies`，`react-dom` 只是 devDependency/宿主种子 —— 见 32/31 行结论与本机证据：`dsh-activity-bell`、`dsh-better-sidebar`（×4）、`dsh-diff-approval`、`dsh-oh-my-claude` 共 7 个已装插件的 client bundle 同样 `require("react-dom")`，`app.asar` 内有 `react-dom` seed）。
- 复现：`npx vitest run tests/verify-detail.spec.ts -t G4`（**修复后已绿**；修复前用同命令可复现）。
- 处置：**已修复**——期望集加入 `react-dom`，与 `tests/verify-v050.spec.tsx` G2/G3 的「宿主种子白名单」口径一致（本验证者未改该文件，仅报告）。

**F-V2【中/流程】`pnpm check:lib` 非 0，但 `lib/` 与最新构建一致 —— 阻塞点只是「v0.5.0 未提交」。**

- 现象：`pnpm build` 成功（`bundle contract check ok`）后立即 `pnpm check:lib` → exit 1，输出 `M lib/client.js` 等 4 行。
- 原因：`scripts/check-lib.mjs:41-45` 用 `git status --porcelain --ignored -- lib` 判定「构建产物未被改动/未跟踪」，因此**只要 lib/ 的改动还没 commit 就必然非 0**；契约 §10.6 要求的正是「先 `pnpm build` 再 commit」。
- 反证「是漂移而非仅未提交」：连续两次 `pnpm build` 后 `lib/{index,client}.js(.map)` 的 sha256 完全一致（`diff` 空），且 `git status` 里只有这 4 个 ` M`（无 untracked/deleted）→ 工作区 lib/ 就是最新 src 的产物。
- 复现：`pnpm build && pnpm check:lib`。
- 结论：**不是代码缺陷**；Lead 提交 `lib/` 后该门禁即为 0（`tests/verify-v050.spec.tsx` H2/H3 已在提交前把「lib 与 src 同步」的等价物固化）。

**F-V3【低/不可达】契约字面「最终结果必须与到达顺序无关」（§3.3 / §9.3#2）在 replace 早于其 `tool/call` 时不成立。**

- 现象：把 `[user, turn/start, replace(6), tool/call(3), result(4), result(5), turn/end]` 交给 `foldTurns`，replace 因「`seqIndex` 无命中且 `byCallId` 尚无 c1」被整条丢弃：结果 `text='AB'`、`replacedBy=undefined`、`mergedFrom=2`；而升序输入为 `text='[pruned]'`、`mergedFrom=1`。
- 可达性：不可达。`TrailFolder.push` 有 seq 水位线（`src/trail-model.ts:968`），wire 页按 seq 升序，且 replace 事件自身 seq 恒大于被替换 seq（契约 §0 实测 seq=182 替换 20/22）。`foldTurns` 只吃升序数组。
- 复现：`npx vitest run tests/verify-v050.spec.tsx -t 'C5'`。
- 处置建议：保持现状（与 §9.3#2 的「replace 先到/后到一致」在可达范围内成立 —— C4 已证实）；若 Lead 想收紧措辞，可在契约里把 §3.3 的「与到达顺序无关」限定为「在 replace 的目标已登记的前提下」。

**F-V4【低/文档 · 已修复（并发）】`ToolDetailItem.seq` 的口径与接口注释不完全一致。**

- 原事实（我验证时）：接口注释写 `seq: number // tool/call 事件的 seq（= 客户端 TrailStep.seq）`；实测请求 **result seq** 时返回的 `item.seq` 就是该 result seq（`items.push({ seq, … })` 用的是请求值），而 `arguments`/`content` 仍是整步内容。
- 影响：客户端只请求 `step.seq`（= call seq），功能无影响；仅当别的调用方按「result seq 请求 + 读 item.seq 当 call seq」使用时会误解。
- 处置：**Lead 已在 06:53 补齐接口注释**（接口现位于 `src/index.ts:722-738`，`seq` 的 JSDoc 明确「Echo of the requested seq … see T10 F-V4」，取值处 `src/index.ts:904`）。我已按新 revision 重跑 B5（行为未变、断言仍绿）。
- 复现：`npx vitest run tests/verify-v050.spec.tsx -t 'B5'`。

**F-V5【信息】`styles.ts` 有 1 处非 token 颜色字面量 `rgba(0, 0, 0, 0)`。**

- 位置：`src/client/styles.ts:532`，`@keyframes ttl-flash` 的 `100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }` —— 全透明收尾帧，视觉上等价 `transparent`。
- 判定：不构成主题色硬编码（契约 §4.5 的「无硬编码颜色」针对 hex/token 化；契约自身也为缩进参考线指定了 `rgba(255,255,255,.12)`）。其余 48 处 `rgba(` 均在 `var(--dsw-…)` fallback 内。裸 hex = 0（G4）。
- 复现：`grep -n 'rgba(' src/client/styles.ts | grep -v 'var(--dsw'`。

**F-V6【低/边界 · 已被 §11.4#5 裁定并修复（并发）】`.md` 信封但 body 不含任何 Markdown 信号时，回退曾显示原信封（含 `<path>` tag 与行号）。**

- 我验证时的行为（06:47 之前）：`src/client/markdown-result.tsx:250` 为 `if (!markdown) return <RawText text={text} />`，`text` 是 wire 原文 → 显示 `<path>…</path>` + `1: …`。
- 契约状态：§11.3/§11.4 原表只裁定了「非 `.md` 一律原文」与「渲染器缺失显示原信封」，未覆盖此边界；我在 06:47 前的 E9 用例中作为**边界观察**记录。
- 处置：Lead 已新增 **§11.4#5** 裁定（`.md` 信封的字面回退也显示解包后的 body），`src/client/markdown-result.tsx` 在 06:38:40 落地 `unwrappedBody`，`if (!markdown) return <RawText text={unwrappedBody ?? text} />`（`src/client/markdown-result.tsx:255`）。我已把 E9 更新为新口径并新增 E10（`.ts` 信封仍显示原信封全文）——两者均绿。
- 复现（新口径）：`npx vitest run tests/verify-v050.spec.tsx -t 'E9'`、`-t 'E10'`。

### 12.4 对抗用例分组计数（`tests/verify-v050.spec.tsx`，56 例全绿）

| 组 | 主题 | 用例数 | 编号 |
| --- | --- | --- | --- |
| A | 附件图路由授权（防越权、响应头、405/403/404/400、TTL/LRU、畸形块） | 11 | A1–A11 |
| B | `/tool-detail`（seqs 边界、不截断、callId 聚合、8 MiB/4 MiB、UTF-8 边界、405/413） | 8 | B1–B8 |
| C | `mergedFrom`（首次/递增/replace 重置/顺序/双实现一致） | 6 | C1–C6 |
| D | F7（replace 只改 result、无 result 边界、邻居不受影响） | 3 | D1–D3 |
| E | F8（解包/行号/footer/中间同形/非 md/缺标签/CRLF/渲染器缺失/§11.4#5 边界） | 10 | E1–E10 |
| F | 组件（ZoomOverlay 键盘与 a11y、焦点回归、inflight 去重、重试上限、缩略图回退、折叠态 DOM） | 11 | F1–F11 |
| G | 规范（依赖、宿主种子、innerHTML/eval、裸 hex、类名/文案键） | 4 | G1–G4 |
| H | 产物一致性（版本/CHANGELOG、lib 跟踪与标记、lib 响应头词表） | 3 | H1–H3 |
| **合计** | | **56** | |

### 12.5 未证实项（不要当成通过）

| # | 未证实项 | 为什么 | 补测方式 |
| --- | --- | --- | --- |
| U1 | AC9 像素级一致 / AC13 真实表格溢出 / AC17 明暗对比度 / AC20 大会话 GUI 挂载 | **本验证者没有浏览器/独立 profile 环境**，只做到数据层 + jsdom 组件层；契约 §11.5 已由 Lead 给出实机数字，但我**未独立复核**（不把别人的观测当自己的证据） | 若要独立复核：按 §10.3 起 19487 profile + Playwright 重跑 §11.5 的检查项；§11.5 自认仍缺「懒加载 GUI 点击路径」与「大会话 GUI 挂载」 |
| U2 | `react-dom` 在真实宿主 client 模块图中的可解析性（本插件 portal 的实际打开） | 本机证据只有「7 个已装插件的 client bundle 同样 require react-dom」+ `app.asar` 的 `react-dom` seed 字符串；F6 只验到 jsdom 层 | 在 19487 profile 打开一次详情浮层（`⤢` / `⌘⇧O`），确认无模块解析错误 |
| U3 | 真实 `attachments.readImage` 对「缺 width/height」ref 的行为 | A7 的 200 来自 mock 的「第二次调用成功」；契约 §10.3.1 只说「尝试」，未承诺真实服务接受 `{bytes:0,width:0,height:0}` | 在真实会话对一张 `read_image` 结果请求 `/api/attachment`，观察状态码与 `content-type` |
| U4 | 附件字节的内容正确性（hash/尺寸是否与块声明一致） | 本轮只验证「路由把 `readImage` 的字节原样下发 + 头正确」，未核对 PNG 头/尺寸 | 取真实附件响应，比对 `image/png` magic 与块里的 `width/height/bytes` |
| U5 | 会话中途新增 image 块后、10s TTL 内的授权即时性 | A10 只验证 TTL 边界；「新块在 TTL 窗口内不被授权」是缓存语义的必然结果，未单独构造实时会话场景 | 对 live session 做「先 404 → 追加 image 块 → 立即 200（需等 TTL 或换 session）」的端到端观察 |

### 12.6 改后关键文件指纹（sha256，2026-10-17 本轮验证时点）

| 文件 | sha256 |
| --- | --- |
| `src/index.ts` | `3e1a3cabd598ce9808c87cd1984153b46889eea928d62868d3fd2cc1efc5f205` |
| `src/trail-model.ts` | `19b6be3f80f4ee59797b93b4c91a73a73c84970903f5cfca3eda6977f6cb95fb` |
| `src/client/attachment-url.ts` | `d7237c3f8116434f595a127e357affe60811b336114e69fab356c8261a70d236` |
| `src/client/useTrail.ts` | `d3e26201499611e43b352385047635f2c7780eb7c281462470418da62c366188` |
| `src/client/TrailTab.tsx` | `b2dd48f1b90a102ee5eabf91138cd1b6ae7a4deaa5abcb0f2d2e093df3d4c4a5` |
| `src/client/ZoomOverlay.tsx` | `8903f69e7101a304c56e9c799eaca5b2f88d5ac07d0c9f72bb4de0655a839535` |
| `src/client/markdown-result.tsx` | `a7011b2478d3c94375ba8a86119abc9d0cb7ed8bed081d1fa9dc7c7428839a53` |
| `src/client/styles.ts` | `8d9a0b90591569c2a062e4a5d90038a16a17b8d652f92a21c12d2b5a252f4b87` |
| `src/client/locales.ts` | `a4f35efd80fee34e8bd4b2ba8c7297c857887494cb653397c0d4ac4cafac81a8` |
| `tests/verify-v050.spec.tsx` | `a77bfce98b8a4168f7b314fed53f5d78ea9c84b298a54094a1eac1ca013d94c4` |
| `lib/index.js`（`pnpm build` 后） | `ce5bab2e7d57bcbcd77183082da3bb5022848be873b16dba8e14549bae9a8e5d` |
| `lib/client.js`（`pnpm build` 后） | `c7f2e47c48d0316e55ccc146987a1a14edf84f7428d5ba23c0da62804ea412c2` |
| `package.json` | `570968138111d07cc6b94b5ea16eee82b2f9ecd1b0c9ce2fbedec8f41a3914f5` |
| `CHANGELOG.md` | `64ee40b1a597ea3bd5afceca8f6bef135d8f53dc5472e791197330f35183896f` |

> §12 的结论仅对本表指纹对应的代码成立；`pnpm build` 之后再改 `src/` 会使 `lib/*` 指纹变化，需重新核对。

## 13. v0.5.0 发布、CI 与当前 profile 安装复核（Lead，2026-10-17）

### 13.1 提交与推送

| 项 | 值 |
| --- | --- |
| 提交 | `99ea52b feat(v0.5.0): image thumbnails, on-demand full detail, zoomed reading view, F7/F8 fixes`（31 个路径，7,799 insertions / 301 deletions，含 `lib/` 4 个构建产物） |
| 分支 / 标签 | `origin/main` = `99ea52b`；注解标签 `v0.5.0` → `99ea52b` |
| 推送过程 | 第一次 `git push origin main` 遇到一次瞬时错误 `Error in the HTTP2 framing layer`（标签推送成功、main 未推）；重试后 `947b307..99ea52b main -> main` 成功 |

### 13.2 提交后门禁（本地）

```
pnpm typecheck                → 0
pnpm test                     → 452 passed (17 files)
pnpm build                    → build ok + bundle contract check ok
pnpm check:lib                → [check:lib] 4 committed lib/ files match a fresh build   (exit 0)
```

> F-V2（T10 提出）在提交前必然非 0，提交后为 0 —— 与 `scripts/check-lib.mjs` 的语义一致（该门禁检查的是「已提交且与构建一致」）。

### 13.3 GitHub Actions（AC19 的 CI 部分）

| 项 | 值 |
| --- | --- |
| 现象 | v0.4.0 与 v0.5.0 两次 `git push origin main` **都没有**产生任何 run（`gh api .../actions/runs → total_count 0`），但 `gh workflow list` 显示 CI 处于 active、`.github/workflows/ci.yml` 已在 main 上且内容与本地一致 |
| 处置 | 给 `ci.yml` 增加 `workflow_dispatch` 并随 v0.5.0 提交；`gh workflow run CI --ref main` |
| 结果 | run **38981619283** → `✓ completed success`（30s），全部步骤真实执行并成功：`Install dependencies` → `Typecheck` → `Test` → `Build` → **`Verify lib/ is up to date`** |
| 证据 | `gh run view --job=117243564739` 步骤清单全 `✓` |
| 仍未解释 | 为何 push 事件不触发 run（Actions 对 push 的触发在 GitHub 侧未生效）；由于手动 dispatch 可跑且步骤全绿，本轮按「CI 可跑且绿」记录，并把 `workflow_dispatch` 留在工作流里以便重跑 |

### 13.4 当前 profile（desktop）安装复核

```
$ dsh plugin --profile desktop remove dsh-trace-inspect
$ dsh plugin --profile desktop add github:xx529/dsh-trace-inspect     # → Packages: +1 -32, Done in 7.8s
```

| 检查 | 实测 |
| --- | --- |
| 安装版本 | `dsh-trace-inspect@0.5.0`（`node_modules/dsh-trace-inspect/package.json`），`dsh-better-sidebar@0.26.1` 未受影响 |
| 产物一致性 | 安装包的 `lib/index.js` = `ce5bab2e…`、`lib/client.js` = `c7f2e47c…`，与本仓库提交的构建产物 **sha256 逐字节相同** |
| 新功能标记 | 安装包 client 含 `ttl-zoom`×45；host 含 `TOOL_DETAIL_PATH` / `ATTACHMENT_PATH` 常量与 `path: …_PATH` 的注册调用 |
| cordis 条目 | `plugin_manager list_plugins` → `include:trace-inspect` / `moduleName: dsh-trace-inspect` / `enabled: true` / `fiberPhase: "active"` |
| profile 清单 | `dependencies.dsh-trace-inspect = github:xx529/dsh-trace-inspect`；`dsh.profile.bundles` 末尾含 `dsh-trace-inspect` |
| 运行中实例的路由 | `POST /trace-inspect/api/events` → **200**（851,501 bytes）；但 `POST /trace-inspect/api/tool-detail` → **405**、`GET /trace-inspect/api/attachment` → **404** ⇒ **运行中的 desktop host 仍是 v0.4.0 的模块** |

**结论与用户需要做的两步**（README「重启与启用」已写）：

1. **完整重启 DSH**（host 改动不会热重载）→ 之后 `/tool-detail`、`/attachment` 两条新路由才会在桌面版生效；
2. **硬刷新页面**（Cmd/Ctrl+Shift+R）→ client 半（缩略图 / 按需完整内容 / 放大浮层）才会注册。

> 本轮没有替用户重启桌面 App（会中断当前会话与 GUI）；v0.5.0 的**功能行为**已在独立 profile 实例上完成实机验证（§10、§11.5），桌面 profile 的**安装正确性**由「产物逐字节相同 + cordis active + 路由注册在产物中」三项证据闭环。

### 13.5 与 §12.6 指纹的关系

T10 的 §12.6 记的是 **07:12 时点**的指纹。其后 Lead 又改了两处并重建：`src/client/markdown-result.tsx`（§11.4#5 的 F-V6 修复，06:38）与 `src/index.ts`（`ToolDetailItem.seq` JSDoc，06:53，注释不影响产物），最终 `lib/client.js` 由 `e6b82bc4…` 变为 `c7f2e47c…`、`lib/index.js` 保持 `ce5bab2e…`。**§12 的结论以「改后复验」为准**：T10 已按新 revision 重跑 56/56 与全量 452/452，并平移校正了行号引用；本轮最终提交后的门禁再次全绿（§13.2）。改 `src/` 后必须重跑 `pnpm build && pnpm test` 并按新指纹复核。
