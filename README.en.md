# dsh-turn-outline

> A DSH plugin: registers a **Turn Outline** tab in the [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) sidebar — folds a session into user turns (input + tool steps + output) with structured jump-back into the conversation (works in both the chat view and the trajectory view).

[![License: MIT](https://img.shields.io/github/license/Andor-Z/dsh-turn-outline)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/Andor-Z/dsh-turn-outline)](https://github.com/Andor-Z/dsh-turn-outline/releases)
[![dsh-plugin](https://img.shields.io/badge/GitHub-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![better-sidebar](https://img.shields.io/badge/better--sidebar-%5E0.17.0-6e56cf)](https://github.com/omdsh-dev/DSH-better-sidebar)

[中文](README.md)

## Preview

<p align="center">
  <img src="docs/assets/turn-outline-panel.png" alt="Turn Outline tab: the session folded into per-user turns of input, tool steps and output" width="420" />
</p>

> Real-session screenshot: the whole session folds into turns 1-5, each = user input + tool steps + final output; the tool filter chips at the top (All / bash / read / edit / More) aggregate by semantic dot, and clicking any row jumps back to its place in the conversation.

## Overview

**Who it is for**: users of DeepSeek Harness (Web / Desktop profile) with long sessions who want to quickly revisit "what happened at step N" — at zero cost, without adding an LLM or touching the DSH core.

**What it solves**:

- **Fold the session into user turns** — the conversation is collapsed into a structured "input → tool steps → output" trail, so long sessions become scannable at a glance; multi-level folding inside a turn plus tool-type filter chips let you focus on what matters.
- **Structured jump-back** — click any turn / tool step to auto-load history and scroll to the matching row in the chat view / trajectory view. Navigation goes through the client `sessions` service (`loadOlder` + `anchorSeq` + `data-chat-anchor-key`) — no dependence on DOM text or hashed class names.
- **Zero AI dependency** — pure event folding, no LLM calls: zero tokens, instant open, no failure states.
- **Read-only & non-invasive** — never touches the DSH core: one read-only host route + one client tab; registers cleanly and unloads without residue.
- **Incremental performance** — refreshes are driven by session subscriptions (no polling); `TrailFolder` only re-folds open turns (O(delta)); seq-keyed rows reconcile in place instead of remounting.

> 💡 Complements [dsh-conversation-outline](https://github.com/YesSanSan/dsh-conversation-outline): that plugin generates a one-line LLM title per turn ("conversation outline"); this one is LLM-free and folds the raw "turn trail". Both register distinct tabs and can be used side by side from better-sidebar's **+ menu**.

## Install

**Prerequisite**: a DSH plugin host + [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar). This plugin declares better-sidebar as an **optional peer** — without it the plugin still loads, it just does not register the tab (inert, no side effects).

### Option 1: one-liner from npm (recommended)

Install better-sidebar first, then this plugin:

```sh
npx @deepseek-ai/dsh plugin --profile desktop add dsh-better-sidebar
npx @deepseek-ai/dsh plugin --profile desktop add dsh-turn-outline
```

> Using the Web profile? Swap `--profile desktop` for `--profile web`.
>
> ℹ️ **Version-line note**: this plugin declares the peer range `dsh-better-sidebar@^0.17.0 || ^0.18.0`, and both lines are co-tested — **better-sidebar 0.18.0 + DSH 0.1.2-rc.1** (validated since 0.2.7) and **better-sidebar 0.17.1 + DSH 0.1.1-rc.x (stable)**. Note that better-sidebar 0.18.0 supports only DSH 0.1.2-rc.1+: on an older stable host (0.1.0-rc.8 ~ 0.1.1-rc.2), pin `dsh-better-sidebar@0.17.1`.

### Option 2: install from source (development / offline)

```sh
git clone https://github.com/Andor-Z/dsh-turn-outline
cd dsh-turn-outline
pnpm install && pnpm build && pnpm pack     # produces dsh-turn-outline-0.2.6.tgz
npx @deepseek-ai/dsh plugin --profile desktop add "file:$(pwd)/dsh-turn-outline-0.2.6.tgz"
```

### Restart & enable

Restart DSH (host-side changes need a full restart; client-side changes only need a hard refresh Cmd/Ctrl+Shift+R). Open better-sidebar's **+ menu** and pick **Turn Outline**.

### Uninstall

```sh
npx @deepseek-ai/dsh plugin --profile desktop remove dsh-turn-outline
```

## Quick start

1. Install as above and restart DSH.
2. Open any session and add **Turn Outline** from better-sidebar's **+ menu**.
3. The trail is folded by user turn; click any turn / tool step to jump back to its exact position in the conversation (chat view and trajectory view both supported).
4. Use the turn / tool filter chips to collapse what you do not need.

## Architecture

```
host (Node)      inject: ['webServer','sessionQuery','sessions']
  POST /turn-outline/api/events { sessionId, afterSeq }
  → live sessions: borrow the frozen snapshot of the live store (O(1) probe + O(delta) projection, zero deep clones)
  → cold sessions: sessionQuery persisted log + lastSeq cache (LRU + byte cap)
  → paged responses (PAGE_SIZE events per page, hasMore semantics) + field trimming (no full tool-result payloads)
  → 200 { events, hasMore } / 400 / 403 / 404 / 405 / 413

client (browser) inject: ['sessions','betterSidebar'] (betterSidebar is an optional peer)
  → registerTab({ id:'turn-outline', single:true })
  → subscription-driven refresh (no polling) + incremental folding (TrailFolder: only re-folds open turns)
    + seq-keyed rows (append without remount) + per-turn React.memo + three-level folding + tool filter chips
```

## Performance design (introduced in v0.2.1)

- **No more deep-cloning the whole log on the host**: the old `listEvents` probe and `readSession` read each `structuredClone` every event (~3 full deep clones per request for live sessions). Live sessions now borrow the store's frozen `events` snapshot directly (the cached, immutable array is reused): O(1) probe, O(delta) incremental reads, fully synchronous, zero copies.
- **Paged + trimmed responses**: at most `PAGE_SIZE` events per page (`hasMore` pulls the rest; first paint renders progressively); events project only the fields folding needs (text capped at `TEXT_CAP`, arguments at `ARGS_CAP`, `tool/result` keeps only the error field — the largest transfer/memory cost is gone).
- **Incremental client folding**: `TrailFolder.push()` consumes each event exactly once; `snapshot()` reuses the TrailTurn objects of already-sealed turns (stable identity → `React.memo` re-renders only open turns), turning each refresh from O(n) full refolds into O(delta); duplicate/re-sent pages are dropped by the seq watermark.
- **Rows keyed by seq**: appended steps reconcile in place in the DOM instead of shifting indexes and remounting whole chunks.

## Permissions & data

- **Session logs**: one read-only host route `POST /turn-outline/api/events`, browser same-origin + Host-header trust fence; read-only, never writes or mutates the session.
- **Zero LLM calls**: nothing is sent to any model; no token consumption.
- **No credential access**: no other network/file access besides session events; no user config, no persistent storage (tab state follows better-sidebar's layout persistence).

## Compatibility

| Item | Value |
|---|---|
| Platform | DSH 0.1.1-rc.x (stable line; web/desktop profile) |
| Dependencies | dsh-better-sidebar (optional peer; inert when absent), react (injected by the DSH client seed) |
| Build | TypeScript + esbuild, no runtime npm dependencies |
| Tests | vitest, 80 cases (fold / folder / jump / tab / host) |

## Development

```sh
pnpm install          # if pnpm 10+ blocks build scripts, allow esbuild as prompted (see pnpm-workspace.yaml)
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run (80 cases)
pnpm build            # esbuild → lib/index.js + lib/client.js (includes bundle-contract self check)
pnpm pack             # produces dsh-turn-outline-<version>.tgz (prepack rebuilds automatically)
```

Layout: `src/index.ts` (host route) / `src/client/` (tab + folding model) / `tests/` (vitest + jsdom).

Contributing: fork → change → `pnpm typecheck && pnpm test && pnpm build` → open a PR.

## Troubleshooting

| Symptom | Meaning / fix |
| --- | --- |
| **No "Turn Outline" in the + menu** | Make sure better-sidebar is installed and on 0.17.x, and the plugin is in the profile (`dsh plugin --profile desktop list`); a full DSH restart is required after host-side changes |
| Page errors / broken styles | Client change not hard-refreshed yet: Cmd/Ctrl+Shift+R |
| No trail for a cold session | Generate any new event in the session (or activate it) before opening the tab; the read-only route only replays persisted logs |
| Plugin update not taking effect | Host-half changes need a `remove` + `add` reinstall (same-version reinstalls can be skipped by the pnpm cache, see Option 2) |

## License & security

[MIT](LICENSE). For security issues, report privately via [Issues](https://github.com/Andor-Z/dsh-turn-outline/issues), or contact the author by email before public disclosure.
