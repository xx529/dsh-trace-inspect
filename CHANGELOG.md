# Changelog

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
