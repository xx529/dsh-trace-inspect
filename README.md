# dsh-trace-inspect

> DSH Web 插件：在 [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) 侧边栏注册「轮次轨迹」tab——把会话按用户轮次折叠成「输入 + 工具步骤 + 输出」摘要，**并可就地展开任一步查看完整参数（JSON 树）、工具结果（Markdown 渲染 / 原文）、图片与错误**，同时保留一键定位回对话原位（聊天视图 / 轨迹视图双支持）。
>
> 本仓库是 [Andor-Z/dsh-turn-outline](https://github.com/Andor-Z/dsh-turn-outline)（MIT）的详情增强分支：v0.4.0 起使用独立包名 `dsh-trace-inspect`，上游核心折叠与跳转逻辑保留。

[![License: MIT](https://img.shields.io/github/license/xx529/dsh-trace-inspect)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/xx529/dsh-trace-inspect)](https://github.com/xx529/dsh-trace-inspect/releases)
[![dsh-plugin](https://img.shields.io/badge/GitHub-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![better-sidebar](https://img.shields.io/badge/better--sidebar-%3E%3D0.17.0-6e56cf)](https://github.com/omdsh-dev/DSH-better-sidebar)
[![dsh](https://img.shields.io/badge/DSH-0.2.0--rc.x_主线-0064ff)](https://github.com/omdsh-dev/DSH-better-sidebar)

[English](README.en.md)

## 样式预览

<p align="center">
  <img src="docs/assets/turn-outline-panel.png" alt="轮次轨迹 tab：会话按用户轮次折叠成「输入 → 工具步骤 → 输出」的结构化轨迹" width="420" />
</p>

> 真实会话截图（折叠态，v0.3.1 起的视觉基线）：整条会话折叠为「轮次 1-5」，每轮 = 用户输入 + 工具步骤 + 最终输出；顶部工具筛选 chips（全部 / bash / read / edit / 更多）按语义色点聚合。v0.4.0 起点击工具行**就地展开详情带**，行尾 `↗` 定位回对话原位。

## 详情增强（v0.4.0）

<p align="center">
  <img src="docs/assets/detail-inline-expand.png" alt="点击工具行就地展开详情带：参数页签 + JSON 树 + 底部完整度/seq" width="420" />
  <img src="docs/assets/detail-result-markdown.png" alt="结果页签：Markdown 渲染与原文并排对照" width="420" />
</p>

> 设计稿（左 `A-inline-expand` / 右 `A2-result-markdown`）：点击工具行**就地展开详情带**——`参数` 是可逐层折叠的 JSON 树（长字符串折叠成块、可单字段复制），`结果` 默认 Markdown 渲染、一键切「原文」，`原始` 保留 wire 原文；底部标注 `完整/已截断` 与 seq。
>
> ⚠️ 这两张是**设计稿，不是实机截图**；实机截图与像素级核对待补（折叠态视觉基线见上方真实截图）。

## 概览

**适合谁**：使用 DeepSeek Harness（Web / Desktop profile）、会话很长、想快速回看某一步「当时做了什么」的用户——希望零成本、不引入 LLM 也不改动核心。

**解决什么问题**：

- **按用户轮次折叠轨迹** —— 会话被折叠成「输入 → 工具步骤 → 输出」的结构化轨迹，长会话一目了然；轮次内支持多级折叠与工具类型筛选 chips，只看你想看的部分。
- **就地展开详情（v0.4.0 新增）** —— 点击工具行**就地展开详情带**，三个页签：
  - `参数`：完整工具参数（host 侧上限 32 KiB，不再是 512 字符截断）渲染成可逐层折叠的 JSON 树，长字符串折叠成块并可单字段复制；
  - `结果`：工具结果文本按 **Markdown 渲染**（GFM + TeX，禁用 raw HTML / 不安全协议），可一键切「原文」；`read`/`web_fetch` 默认渲染、`bash`/`pwsh` 默认原文；图片块显示为占位 chip，失败结果显示错误名/码 + 原文；
  - `原始`：host 投影的原始参数文本（保留空白）。
  详情带底部标注「完整/已截断」与 seq；被压缩插件替换过的结果会显示**替换后的摘要**并标注 `已被压缩替换（seq #N）`。
- **一键跳回原位** —— 点击轮次行 / 行尾 `↗` 按钮（工具行本身改为展开详情），自动加载历史并滚动到聊天视图 / 轨迹视图的对应行；0.2.0 走 client `uiConversation` 会话视图注册表（`anchorSeq` 节点匹配 + `loadOlder` 翻页），0.1.x 回退旧 session 快照，不依赖 DOM 文本与哈希类名。
- **零 AI 依赖** —— 纯事件折叠，不调用 LLM：零 token、秒开、无失败态。
- **只读零侵入** —— 不改动 DSH 核心：host 一个只读路由 + client 一个 tab，注册即用、卸载干净。
- **增量性能** —— 会话订阅驱动刷新（无定时轮询）；`TrailFolder` 只重折打开中的轮次（O(delta)）；seq-keyed 行追加不重挂。

> 💡 与 [dsh-conversation-outline](https://github.com/YesSanSan/dsh-conversation-outline) 互补：它用 LLM 为每轮生成一句话标题做「对话大纲」；本插件零 AI、按轮次折叠「轨迹」。两者注册不同的 tab，可在 better-sidebar 的 **+ 菜单**中同时使用。

## 安装

**前置**：DSH 插件宿主 + [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)。本插件把 better-sidebar 声明为**可选 peer**——未安装时插件照常加载、只是不注册 tab（inert，无副作用）。

### 方式一：从 GitHub 安装（推荐）

先装 better-sidebar，再装本插件：

```sh
npx @deepseek-ai/dsh plugin --profile desktop add dsh-better-sidebar
npx @deepseek-ai/dsh plugin --profile desktop add github:xx529/dsh-trace-inspect
```

> 使用 Web profile 时把 `--profile desktop` 换成 `--profile web`。
>
> ℹ️ **本仓库未发布到 npm**：`dsh-turn-outline` 是上游 Andor-Z 的包的 npm 名（那是另一个插件，不含本仓库的详情增强）。请用上面的 GitHub 安装方式，或从源码本地打包安装。
>
> ℹ️ **版本线说明**：**0.3.0 起以 DSH 0.2.0-rc.x 为主线**（DSH Desktop 2.0.17 内置运行时 + better-sidebar 0.24.1 实测联调；跳回走 `uiConversation` 会话视图注册表，host live 路径用 `snapshotEvents()`）。0.1.x 线继续回退兼容——**better-sidebar 0.18.0 + DSH 0.1.2-rc.1** 与 **better-sidebar 0.17.1 + DSH 0.1.1-rc.x（stable）**：旧宿主上插件自动走旧快照跳转与 `.events` live 路径，无需任何配置。注意 better-sidebar 0.18.0 仅支持 DSH 0.1.2-rc.1+：更旧的 stable 宿主（0.1.0-rc.8 ~ 0.1.1-rc.2）请固定安装 `dsh-better-sidebar@0.17.1`。

### 方式二：源码本地安装（开发 / 离线）

```sh
git clone https://github.com/xx529/dsh-trace-inspect
cd dsh-trace-inspect
pnpm install && pnpm build && pnpm pack     # 产出 dsh-trace-inspect-0.4.0.tgz
npx @deepseek-ai/dsh plugin --profile desktop add "file:$(pwd)/dsh-trace-inspect-0.4.0.tgz"
```

### 重启与启用

重启 DSH（host 改动需完整重启；client 改动硬刷新 Cmd/Ctrl+Shift+R 即可）。打开 better-sidebar 侧边栏的 **+ 菜单**，选择「轮次轨迹」。

### 卸载

```sh
npx @deepseek-ai/dsh plugin --profile desktop remove dsh-trace-inspect
```

## 快速开始

1. 按上文安装并重启 DSH。
2. 打开任意会话，在 better-sidebar 侧边栏 **+ 菜单**添加「轮次轨迹」。
3. 轨迹按用户轮次折叠展示；点击工具行即在侧栏内展开详情（`参数` / `结果` / `原始`），行尾 `↗` 定位回对话原位（聊天视图 / 轨迹视图都支持）。
4. 需要时用轮次 / 工具筛选 chips 收起无关内容。

## 架构

```
host（Node）  inject: ['webServer','sessionQuery','sessions']
  POST /trace-inspect/api/events { sessionId, afterSeq }
  → 活跃会话：借用 live store 冻结快照（0.2.0 经 snapshotEvents()，0.1.x 读 .events；
    O(1) 探测 + O(delta) 投影，零深拷贝）
  → 冷会话：sessionQuery 持久化日志 + lastSeq 缓存（LRU + 字节上限）
  → 响应逐页（每页 ≤ PAGE_SIZE 事件且 ≤ 2 MiB 页级字节预算，hasMore 语义）
    + 字段裁剪（tool/call 参数 ≤ ARGS_CAP=32 KiB，tool/result content ≤ 32 KiB）
  → 200 { events, hasMore } / 400 / 403 / 404 / 405 / 413

client（浏览器）  inject: ['sessions','uiConversation','betterSidebar']（后两者可选 peer）
  → registerTab({ id:'trace-inspect', single:true, description })
  → 跳回：0.2.0 走 ctx.uiConversation 会话视图注册表（chat/trajectory target）；
    0.1.x 回退 session snapshot 的 chat.nodes / views 字段
  → 会话订阅驱动刷新（session.subscribe + 0.2.0 eventSource，无定时轮询）
  → 增量折叠（TrailFolder：只重折打开中的轮次）+ seq-keyed 行（追加不重挂）
    + 按轮次 React.memo + 三级折叠 + 工具筛选 chips
  → 步骤详情（v0.4.0）：按 callId/seq 关联 tool/call 与 tool/result，遵守
    surfaceOp（append 合并 / replace 改写目标步）；详情带按需渲染 JSON 树与
    Markdown（未展开的步骤零额外 DOM）
```

## 性能设计（v0.2.1 引入）

- **host 不再对整份日志做深拷贝**：旧的 `listEvents` 探测与 `readSession` 读取会对每个事件 `structuredClone`（活跃会话约 3 次全量深拷贝/请求）。现在活跃会话直接借用 store 的冻结事件快照（0.2.0 的 `snapshotEvents()` / 0.1.x 的 `events` 属性，复用不变数组），探测 O(1)、取增量 O(delta)，全程同步零拷贝。
- **响应逐页 + 裁剪**：每页最多 `PAGE_SIZE` 事件且总字节不超过 `PAGE_BUDGET_BYTES`（2 MiB，`hasMore` 续拉，首载渐进渲染）；事件只投影折叠与详情所需字段（文本截断到 `TEXT_CAP=2 KiB`、tool 参数到 `ARGS_CAP=32 KiB`、tool 结果 content 到 32 KiB，图片只留 `{attachmentId,mediaType,bytes,width,height,name}` 不内联 base64）。
- **client 增量折叠**：`TrailFolder.push()` 每事件只消费一次，`snapshot()` 复用已封口轮次的 TrailTurn 对象（身份稳定 → `React.memo` 只重渲染打开中的轮次），每轮刷新从 O(n) 全量重折降为 O(delta)；重复/重发的分页被 seq 水位线丢弃。
- **行 key 用 seq**：新步骤追加时行在其 DOM 原位 reconcile，不再索引平移导致整段卸载重挂。

## 权限与数据

- **会话日志**：host 只读路由 `POST /trace-inspect/api/events`，浏览器同源 + Host 头信任围栏；只读不回写、不改动会话。
- **零 LLM 调用**：不向任何模型发送内容，无 token 消耗。
- **不读取凭据**：除会话事件外无其他网络 / 文件访问；无用户配置、无持久化存储（tab 状态随 better-sidebar 布局持久化）。

## 兼容性

| 项 | 值 |
|---|---|
| 平台（主线） | DSH 0.2.0-rc.x（DSH Desktop 2.0.17 内置运行时实测；web/desktop profile） |
| 平台（回退兼容） | DSH 0.1.2-rc.1 / 0.1.1-rc.x（stable 线） |
| 依赖 | dsh-better-sidebar（可选 peer，`>=0.17.0`；未装则 inert）、react（DSH client 种子注入） |
| 构建 | TypeScript + esbuild，无运行时 npm 依赖 |
| 测试 | vitest 272 用例（fold / folder / detail / wire / json-tree / markdown / jump / tab / host） |

## 开发

```sh
pnpm install          # pnpm 10+ 拦截构建脚本时按提示允许 esbuild（见 pnpm-workspace.yaml）
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm build            # esbuild → lib/index.js + lib/client.js（含 bundle 契约自检）
pnpm check:lib        # 校验提交进仓库的 lib/ 与 src/ 一致（CI 同款门禁）
pnpm pack             # 产出 dsh-trace-inspect-<version>.tgz（prepack 自动重新构建）
```

布局：`src/index.ts`（host 路由）/ `src/client/`（tab、折叠模型、详情组件）/ `tests/`（vitest + jsdom）。

> **`lib/` 是提交进仓库的**：官方安装路径是 `... add github:xx529/dsh-trace-inspect`，而 git 来源的插件在 pnpm 的构建脚本闸门下不保证跑 `prepare`，所以两个构建产物随源码一起提交（构建可复现，CI 用 `pnpm check:lib` 防漂移）。改了 `src/` 记得跑一次 `pnpm build` 并一起提交。

贡献方式：fork → 修改 → `pnpm typecheck && pnpm test && pnpm build` → 提 PR。

## 故障排查

| 现象 | 含义 / 处理 |
| --- | --- |
| **+ 菜单里没有「轮次轨迹」** | 确认 better-sidebar 已安装且版本为 0.17.x；确认插件已加入 profile（`dsh plugin --profile desktop list`）；host 改动后需完整重启 DSH |
| 页面报错 / 样式错乱 | client 改动后未硬刷新：Cmd/Ctrl+Shift+R |
| 冷会话没有轨迹 | 先在会话中任意产生新事件（或激活该会话）再打开 tab；只读路由只回放已持久化的日志 |
| 更新插件后不生效 | host 半变更需 `remove` + `add` 重装（同版本号重装可能被 pnpm 缓存跳过，见方式二） |
| **市场更新后还是旧版本** | dshmarket 安装路径有 24h 发布冷却闸（供应链防护），新版本发布不足 24h 会被静默跳过（exit 0 不报错）。本仓库从 GitHub 安装，不受该闸影响：`npx @deepseek-ai/dsh plugin --profile desktop add github:xx529/dsh-trace-inspect` |
| **展开详情带后看不到结果** | 该步的 `tool/result` 可能尚未到达（仍在运行），或历史结果被压缩插件替换（此时显示的是替换后的摘要，底部有 `已被压缩替换（seq #N）` 标注）；图片块只显示占位 chip（当前版本不解析附件 URL） |

## License 与安全

[MIT](LICENSE)。安全问题请通过 [Issues](https://github.com/xx529/dsh-trace-inspect/issues) 私密反馈，或先邮件联系原作者，再公开披露。上游项目：[Andor-Z/dsh-turn-outline](https://github.com/Andor-Z/dsh-turn-outline)（本分支的折叠与跳转逻辑来源）。
