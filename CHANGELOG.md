# Changelog

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
