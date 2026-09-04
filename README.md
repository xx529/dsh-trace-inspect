# dsh-turn-outline

> DSH Web 插件：在 [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) 侧边栏注册「轮次轨迹」tab——把会话按用户轮次折叠成「输入 + 工具步骤 + 输出」摘要，一键定位回对话原位（聊天视图 / 轨迹视图双支持）。

[![License: MIT](https://img.shields.io/github/license/Andor-Z/dsh-turn-outline)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/Andor-Z/dsh-turn-outline)](https://github.com/Andor-Z/dsh-turn-outline/releases)
[![dsh-plugin](https://img.shields.io/badge/GitHub-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![better-sidebar](https://img.shields.io/badge/better--sidebar-%5E0.17.0-6e56cf)](https://github.com/omdsh-dev/DSH-better-sidebar)

[English](README.en.md)

## 样式预览

<p align="center">
  <img src="docs/assets/turn-outline-panel.png" alt="轮次轨迹 tab：会话按用户轮次折叠成「输入 → 工具步骤 → 输出」的结构化轨迹" width="420" />
</p>

> 真实会话截图：整条会话折叠为「轮次 1-5」，每轮 = 用户输入 + 工具步骤 + 最终输出；顶部工具筛选 chips（全部 / bash / read / edit / 更多）按语义色点聚合，点击任意行可定位回对话原位。

## 概览

**适合谁**：使用 DeepSeek Harness（Web / Desktop profile）、会话很长、想快速回看某一步「当时做了什么」的用户——希望零成本、不引入 LLM 也不改动核心。

**解决什么问题**：

- **按用户轮次折叠轨迹** —— 会话被折叠成「输入 → 工具步骤 → 输出」的结构化轨迹，长会话一目了然；轮次内支持多级折叠与工具类型筛选 chips，只看你想看的部分。
- **一键跳回原位** —— 点击任意轮次 / 工具步骤，自动加载历史并滚动到聊天视图 / 轨迹视图的对应行；走 client `sessions` 服务（`loadOlder` + `anchorSeq` + `data-chat-anchor-key`），不依赖 DOM 文本与哈希类名。
- **零 AI 依赖** —— 纯事件折叠，不调用 LLM：零 token、秒开、无失败态。
- **只读零侵入** —— 不改动 DSH 核心：host 一个只读路由 + client 一个 tab，注册即用、卸载干净。
- **增量性能** —— 会话订阅驱动刷新（无定时轮询）；`TrailFolder` 只重折打开中的轮次（O(delta)）；seq-keyed 行追加不重挂。

> 💡 与 [dsh-conversation-outline](https://github.com/YesSanSan/dsh-conversation-outline) 互补：它用 LLM 为每轮生成一句话标题做「对话大纲」；本插件零 AI、按轮次折叠「轨迹」。两者注册不同的 tab，可在 better-sidebar 的 **+ 菜单**中同时使用。

## 安装

**前置**：DSH 插件宿主 + [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)。本插件把 better-sidebar 声明为**可选 peer**——未安装时插件照常加载、只是不注册 tab（inert，无副作用）。

### 方式一：npm 一行命令（推荐）

先装 better-sidebar（stable 线钉 0.17.x），再装本插件：

```sh
npx @deepseek-ai/dsh plugin --profile desktop add dsh-better-sidebar@0.17.1
npx @deepseek-ai/dsh plugin --profile desktop add dsh-turn-outline
```

> 使用 Web profile 时把 `--profile desktop` 换成 `--profile web`。
>
> ⚠️ **版本线说明**：本插件当前验证于 **better-sidebar 0.17.x + DSH 0.1.1-rc.x（stable）**。npm `latest` 的 better-sidebar 0.18.0 仅支持 DSH 0.1.2-rc.1+，尚未与本插件联调——在 0.18 适配版发布前，升级宿主请先固定 `dsh-better-sidebar@0.17.1`。

### 方式二：源码本地安装（开发 / 离线）

```sh
git clone https://github.com/Andor-Z/dsh-turn-outline
cd dsh-turn-outline
pnpm install && pnpm build && pnpm pack     # 产出 dsh-turn-outline-0.2.6.tgz
npx @deepseek-ai/dsh plugin --profile desktop add "file:$(pwd)/dsh-turn-outline-0.2.6.tgz"
```

### 重启与启用

重启 DSH（host 改动需完整重启；client 改动硬刷新 Cmd/Ctrl+Shift+R 即可）。打开 better-sidebar 侧边栏的 **+ 菜单**，选择「轮次轨迹」。

### 卸载

```sh
npx @deepseek-ai/dsh plugin --profile desktop remove dsh-turn-outline
```

## 快速开始

1. 按上文安装并重启 DSH。
2. 打开任意会话，在 better-sidebar 侧边栏 **+ 菜单**添加「轮次轨迹」。
3. 轨迹按用户轮次折叠展示；点击任意轮次 / 工具步骤即定位回对话原位（聊天视图 / 轨迹视图都支持）。
4. 需要时用轮次 / 工具筛选 chips 收起无关内容。

## 架构

```
host（Node）  inject: ['webServer','sessionQuery','sessions']
  POST /turntrail/api/events { sessionId, afterSeq }
  → 活跃会话：直接借用 live store 冻结快照（O(1) 探测 + O(delta) 投影，零深拷贝）
  → 冷会话：sessionQuery 持久化日志 + lastSeq 缓存（LRU + 字节上限）
  → 响应逐页（每页 PAGE_SIZE 事件，hasMore 语义）+ 字段裁剪（不发 tool 结果全文）
  → 200 { events, hasMore } / 400 / 403 / 404 / 405 / 413

client（浏览器）  inject: ['sessions','betterSidebar']（betterSidebar 可选 peer）
  → registerTab({ id:'turn-outline', single:true })
  → 会话订阅驱动刷新（无定时轮询）+ 增量折叠（TrailFolder：只重折打开中的轮次）
    + seq-keyed 行（追加不重挂）+ 按轮次 React.memo + 三级折叠 + 工具筛选 chips
```

## 性能设计（v0.2.1 引入）

- **host 不再对整份日志做深拷贝**：旧的 `listEvents` 探测与 `readSession` 读取会对每个事件 `structuredClone`（活跃会话约 3 次全量深拷贝/请求）。现在活跃会话直接借用 store 的冻结 `events` 快照（复用不变数组），探测 O(1)、取增量 O(delta)，全程同步零拷贝。
- **响应逐页 + 裁剪**：每页最多 `PAGE_SIZE` 事件（`hasMore` 续拉，首载渐进渲染）；事件只投影折叠所需字段（文本截断到 `TEXT_CAP`、arguments 到 `ARGS_CAP`、`tool/result` 只留 error 字段——最大的传输与内存占用被去掉）。
- **client 增量折叠**：`TrailFolder.push()` 每事件只消费一次，`snapshot()` 复用已封口轮次的 TrailTurn 对象（身份稳定 → `React.memo` 只重渲染打开中的轮次），每轮刷新从 O(n) 全量重折降为 O(delta)；重复/重发的分页被 seq 水位线丢弃。
- **行 key 用 seq**：新步骤追加时行在其 DOM 原位 reconcile，不再索引平移导致整段卸载重挂。

## 权限与数据

- **会话日志**：host 只读路由 `POST /turntrail/api/events`，浏览器同源 + Host 头信任围栏；只读不回写、不改动会话。
- **零 LLM 调用**：不向任何模型发送内容，无 token 消耗。
- **不读取凭据**：除会话事件外无其他网络 / 文件访问；无用户配置、无持久化存储（tab 状态随 better-sidebar 布局持久化）。

## 兼容性

| 项 | 值 |
|---|---|
| 平台 | DSH 0.1.1-rc.x（stable 线；web/desktop profile） |
| 依赖 | dsh-better-sidebar（可选 peer；未装则 inert）、react（DSH client 种子注入） |
| 构建 | TypeScript + esbuild，无运行时 npm 依赖 |
| 测试 | vitest 80 用例（fold / folder / jump / tab / host） |

## 开发

```sh
pnpm install          # pnpm 10+ 拦截构建脚本时按提示允许 esbuild（见 pnpm-workspace.yaml）
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run（80 用例）
pnpm build            # esbuild → lib/index.js + lib/client.js（含 bundle 契约自检）
pnpm pack             # 产出 dsh-turn-outline-<version>.tgz（prepack 自动重新构建）
```

布局：`src/index.ts`（host 路由）/ `src/client/`（tab 与折叠模型）/ `tests/`（vitest + jsdom）。

贡献方式：fork → 修改 → `pnpm typecheck && pnpm test && pnpm build` → 提 PR。

## 故障排查

| 现象 | 含义 / 处理 |
| --- | --- |
| **+ 菜单里没有「轮次轨迹」** | 确认 better-sidebar 已安装且版本为 0.17.x；确认插件已加入 profile（`dsh plugin --profile desktop list`）；host 改动后需完整重启 DSH |
| 页面报错 / 样式错乱 | client 改动后未硬刷新：Cmd/Ctrl+Shift+R |
| 冷会话没有轨迹 | 先在会话中任意产生新事件（或激活该会话）再打开 tab；只读路由只回放已持久化的日志 |
| 更新插件后不生效 | host 半变更需 `remove` + `add` 重装（同版本号重装可能被 pnpm 缓存跳过，见方式二） |

## License 与安全

[MIT](LICENSE)。安全问题请通过 [Issues](https://github.com/Andor-Z/dsh-turn-outline/issues) 私密反馈，或先邮件联系作者，再公开披露。
