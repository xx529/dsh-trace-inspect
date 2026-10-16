/**
 * verify-detail.spec.ts — T5 独立对抗性验收（只读验证，不改实现）。
 *
 * 这份测试**不是**实现者测试的复述：它专门从「链路会怎么坏」的角度构造输入，
 * 覆盖 docs/detail-contract-v1.md §9 回填口径的逐条核对点：
 *
 *   A. surfaceOp 顶层链路（顶层透传 / data 兜底 / 两者都丢时的失败可见性）
 *   B. replace 的 seq 语义（指向 tool/result 的 seq、乱序一致、无目标不抛错）
 *   C. TrailFolder 水位线 + markDirty 冻结轮次重物化
 *   D. 同 callId 多 append 合并、孤儿 result、stats 口径
 *   E. wire 边界（32768/32769、text+image、页级字节预算）
 *   F. 组件降级（primitives 缺失、looksLikeMarkdown、JsonTree 环/上限）
 *   G. 规范（无 innerHTML/eval、无硬编码颜色、无新增运行时依赖、改名一致）
 *   H. 折叠态行结构回归
 *
 * 全部确定性：不读 /tmp、不读真实会话日志、不联网。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  foldTurns,
  stepsOf,
  TrailFolder,
  type SessionEventLike,
  type TrailStep,
  type TrailTurn,
} from '../src/trail-model'
import {
  ARGS_CAP,
  MAX_BODY_BYTES,
  PAGE_BUDGET_BYTES,
  PAGE_SIZE,
  RESULT_CAP,
  TEXT_CAP,
  projectEvent,
} from '../src/wire'
import { apply } from '../src/index'
import type {
  HostCtx,
  HttpRequestLike,
  HttpResponseLike,
} from '../src/context-types'
import { JsonTree } from '../src/client/json-tree'
import { MarkdownResult, defaultViewForTool, looksLikeMarkdown } from '../src/client/markdown-result'
import { markdownLabels } from '../src/client/markdown-labels'
import { setPrimitivesForTest, type PrimitivesModule } from '../src/client/ui-primitives'
import { TrailTab } from '../src/client/TrailTab'
import { trailCss } from '../src/client/styles'
import { t } from '../src/client/locales'

const ROOT = resolve(__dirname, '..')
/** JSX-free factory: this file must stay `.ts` (task-mandated path), so no JSX syntax. */
const h = React.createElement

// ── fixture helpers ───────────────────────────────────────────────────────

interface Ev {
  type: string
  seq: number
  time?: number
  data?: Record<string, unknown>
  surfaceOp?: unknown
  sourceEventSeqs?: number[]
}

const ev = (
  type: string,
  seq: number,
  data?: Record<string, unknown>,
  extra?: { surfaceOp?: unknown; sourceEventSeqs?: number[] },
): Ev => ({
  type,
  seq,
  ...(data !== undefined ? { data } : {}),
  ...(extra?.surfaceOp !== undefined ? { surfaceOp: extra.surfaceOp } : {}),
  ...(extra?.sourceEventSeqs !== undefined ? { sourceEventSeqs: extra.sourceEventSeqs } : {}),
})

const user = (seq: number, content: unknown): Ev => ev('user/message', seq, {
  content,
  message: { source: { kind: 'user' } },
})
const assistant = (seq: number, content: unknown): Ev => ev('assistant/message', seq, { message: { content } })
const turnStart = (seq: number, turn: number): Ev => ev('turn/start', seq, { turn })
const turnEnd = (seq: number, turn: number): Ev => ev('turn/end', seq, { turn })
const toolCall = (seq: number, name: string, args = '', callId = `c${seq}`): Ev =>
  ev('tool/call', seq, { name, arguments: args, callId })
const textBlock = (text: string): { type: 'text'; text: string } => ({ type: 'text', text })

/** raw-log tool/result: content only inside data.message.content (real shape). */
const rawResult = (seq: number, callId: string, content: unknown[], extra: Record<string, unknown> = {}): Ev =>
  ev('tool/result', seq, { callId, message: { source: { callId }, isError: false, content }, ...extra })

/**
 * A realistic compact-replace event: top-level surfaceOp (host projection +
 * real session log seq 182/183), replacement text in data.message.content,
 * sourceEventSeqs naming the replaced seq.
 */
const topLevelReplace = (seq: number, callId: string, replacement: string, from: number, to: number): Ev =>
  ev(
    'tool/result',
    seq,
    { callId, message: { source: { callId }, isError: false, content: [textBlock(replacement)] } },
    { surfaceOp: { op: 'replace', startSeq: from, endSeq: to }, sourceEventSeqs: [from] },
  )

const stepAt = (turn: TrailTurn, seq: number): TrailStep => {
  const hit = stepsOf(turn).find((step) => step.seq === seq)
  if (hit === undefined) throw new Error(`no step at seq ${seq}; have ${stepsOf(turn).map((s) => s.seq).join(',')}`)
  return hit
}

const turnsOf = (events: Ev[]): TrailTurn[] => foldTurns(events as SessionEventLike[])

/** Project one event and take its projected `data` with an asserted shape. */
const wireData = <T extends Record<string, unknown>>(event: SessionEventLike): T => {
  const projected = projectEvent(event) as unknown as { data?: T }
  return projected.data ?? ({} as T)
}

const folderOf = (events: Ev[]): TrailFolder => {
  const folder = new TrailFolder()
  for (const event of events) folder.push(event as SessionEventLike)
  return folder
}

// ── A. surfaceOp 顶层链路 ─────────────────────────────────────────────────

describe('A. surfaceOp 链路（顶层 / data 兜底 / 丢失）', () => {
  it('A1 顶层 surfaceOp 与 sourceEventSeqs 在任意事件类型上原样透传', () => {
    for (const type of ['user/message', 'assistant/message', 'tool/call', 'tool/result', 'turn/end', 'command/run']) {
      const projected = projectEvent(ev(type, 7, { content: 'x' }, {
        surfaceOp: { op: 'replace', startSeq: 20, endSeq: 22 },
        sourceEventSeqs: [20, 22],
      }) as SessionEventLike) as SessionEventLike & { surfaceOp?: unknown; sourceEventSeqs?: unknown }
      expect(projected.surfaceOp, type).toEqual({ op: 'replace', startSeq: 20, endSeq: 22 })
      expect(projected.sourceEventSeqs, type).toEqual([20, 22])
    }
  })

  it('A2 畸形 surfaceOp 被丢弃：非 append 字符串、op 非字符串、空/非数字 seq 列表', () => {
    const bad = [
      ev('tool/result', 1, {}, { surfaceOp: 42 }),
      ev('tool/result', 1, {}, { surfaceOp: { op: 123, startSeq: 1, endSeq: 2 } }),
      ev('tool/result', 1, {}, { surfaceOp: null }),
      ev('tool/result', 1, {}, { surfaceOp: 'replace' }),
      ev('tool/result', 1, {}, { sourceEventSeqs: [] }),
      ev('tool/result', 1, {}, { sourceEventSeqs: ['20'] as unknown as number[] }),
    ]
    for (const event of bad) {
      const projected = projectEvent(event as SessionEventLike) as SessionEventLike & { surfaceOp?: unknown; sourceEventSeqs?: unknown }
      expect(projected.surfaceOp).toBeUndefined()
      expect(projected.sourceEventSeqs).toBeUndefined()
    }
    // 合法：'append' 标签原样保留。
    const ok = projectEvent(ev('tool/result', 1, {}, { surfaceOp: 'append' }) as SessionEventLike) as { surfaceOp?: unknown }
    expect(ok.surfaceOp).toBe('append')
  })

  it('A3 wire 只读顶层：data.surfaceOp 经投影会被丢掉（模型侧才兜底）', () => {
    const raw = ev('tool/result', 30, {
      callId: 'c1',
      surfaceOp: { op: 'replace', startSeq: 20, endSeq: 20 },
      message: { content: [textBlock('COMPACT')] },
    })
    const projected = projectEvent(raw as SessionEventLike) as { surfaceOp?: unknown; data?: Record<string, unknown> }
    expect(projected.surfaceOp).toBeUndefined()
    expect((projected.data ?? {}).surfaceOp).toBeUndefined()
  })

  it('A4 端到端：顶层 surfaceOp 的 replace 改写 result（不是退化 append），且不动 args（§11.2）', () => {
    const raw: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat big.log', 'c1'),
      rawResult(20, 'c1', [textBlock('OLD-LONG-RESULT')]),
      turnEnd(25, 1),
      user(170, 'next'),
      turnStart(172, 2),
      // 真实形态：replace 在下一轮运行中到达，顶层携带 surfaceOp。
      topLevelReplace(182, 'c1', 'COMPACTED', 20, 20),
    ]
    const projected = raw.map((event) => projectEvent(event as SessionEventLike) as Ev)
    const turns = turnsOf(projected)
    const step = stepAt(turns[0]!, 10)
    expect(step.result?.text).toBe('COMPACTED')
    expect(step.result?.text).not.toContain('OLD-LONG-RESULT')
    expect(step.result?.replacedBy).toBe(182)
    expect(step.result?.replacedFrom).toBe(20)
    expect(step.result?.seq).toBe(182)
    // §11.2（F7 收口）：replace 只改写 result，工具参数保持 tool/call 原值。
    expect(step.args).toBe('cat big.log')
  })

  it('A5 data.surfaceOp 兜底：raw 日志（未经 wire）同样能应用 replace', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat big.log', 'c1'),
      rawResult(20, 'c1', [textBlock('OLD-LONG-RESULT')]),
      turnEnd(25, 1),
      turnStart(172, 2),
      ev('tool/result', 182, {
        callId: 'c1',
        surfaceOp: { op: 'replace', startSeq: 20, endSeq: 20 },
        message: { content: [textBlock('COMPACTED')] },
      }),
    ])
    expect(stepAt(turns[0]!, 10).result?.text).toBe('COMPACTED')
  })

  it('A6 两者都丢 + 轮次仍开着 → 退化为 append（脏拼接，可见但错误）', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat big.log', 'c1'),
      rawResult(20, 'c1', [textBlock('OLD-LONG-RESULT')]),
      // surfaceOp 在投影/中间层被丢掉（形态：只有 content，没有替换标记）。
      rawResult(182, 'c1', [textBlock('COMPACTED')]),
      turnEnd(190, 1),
    ])
    const step = stepAt(turns[0]!, 10)
    // 实测：追加而非替换 —— 旧长文与替换文本脏拼接，且没有 replacedBy 提示。
    expect(step.result?.text).toBe('OLD-LONG-RESULTCOMPACTED')
    expect(step.result?.replacedBy).toBeUndefined()
  })

  it('A7 两者都丢 + 轮次已关闭 → 事件被丢弃，界面只剩旧长文（无任何可见提示）', () => {
    const events: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat big.log', 'c1'),
      rawResult(20, 'c1', [textBlock('OLD-LONG-RESULT')]),
      turnEnd(25, 1),
      rawResult(182, 'c1', [textBlock('COMPACTED')]),
    ]
    const turns = turnsOf(events)
    const step = stepAt(turns[0]!, 10)
    // 记录真实行为：旧文本原样保留，新文本彻底消失，replacedBy 缺失。
    expect(step.result?.text).toBe('OLD-LONG-RESULT')
    expect(step.result?.replacedBy).toBeUndefined()
    expect(turns[0]!.items.some((item) => item.kind === 'tool' && item.step.seq === 182)).toBe(false)
  })
  it('A8 §9.2#4：{op:""} 是畸形 surfaceOp 必须被丢弃（F2 修复后的语义）', () => {
    const projected = projectEvent(
      ev('tool/result', 5, {}, { surfaceOp: { op: '', startSeq: 20, endSeq: 20 } }) as SessionEventLike,
    ) as { surfaceOp?: unknown }
    // F2 修复：isSurfaceOp 增加 op.length > 0，空串不再透传 → 下游也就不会把它当 append。
    expect(projected.surfaceOp).toBeUndefined()
    // 边界：契约只要求「非空 string」，不要求 trim —— 纯空白仍是合法形态。
    const blank = projectEvent(
      ev('tool/result', 6, {}, { surfaceOp: { op: ' ', startSeq: 20, endSeq: 20 } }) as SessionEventLike,
    ) as { surfaceOp?: unknown }
    expect(blank.surfaceOp).toEqual({ op: ' ', startSeq: 20, endSeq: 20 })
    // 'append' 标签与合法 replace 形态不受影响。
    const appended = projectEvent(
      ev('tool/result', 7, {}, { surfaceOp: 'append' }) as SessionEventLike,
    ) as { surfaceOp?: unknown }
    expect(appended.surfaceOp).toBe('append')
    const replaced = projectEvent(
      ev('tool/result', 8, {}, { surfaceOp: { op: 'replace', startSeq: 1, endSeq: 2 } }) as SessionEventLike,
    ) as { surfaceOp?: unknown }
    expect(replaced.surfaceOp).toEqual({ op: 'replace', startSeq: 1, endSeq: 2 })
  })
})

// ── B. replace 的 seq 语义与乱序 ──────────────────────────────────────────

describe('B. replace 目标 seq / 乱序 / 无目标', () => {
  it('B1 目标 seq 指向 tool/result 的 seq（20），而不是 tool/call 的 seq（10）', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('AAA')]),
      rawResult(22, 'c1', [textBlock('BBB')]),
      turnEnd(25, 1),
      topLevelReplace(30, 'c1', 'CCC', 20, 22),
    ])
    const step = stepAt(turns[0]!, 10)
    expect(step.result?.text).toBe('CCC')
    expect(step.result?.replacedBy).toBe(30)
    expect(stepsOf(turns[0]!).map((s) => s.seq)).toEqual([10])
  })

  it('B2 §9.3#2：replace 作废该步所有早于 replace seq 的分段（不只区间内）', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('AAA')]),
      rawResult(22, 'c1', [textBlock('BBB')]),
      rawResult(24, 'c1', [textBlock('CCC')]),
      turnEnd(25, 1),
      topLevelReplace(30, 'c1', 'COMPACT', 20, 20), // 只声明覆盖 20
    ])
    const step = stepAt(turns[0]!, 10)
    // 区间外的 22/24 也必须在 replace 之后消失，否则会与替换文本脏拼接。
    expect(step.result?.text).toBe('COMPACT')
    expect(step.result?.replacedFrom).toBe(20)
  })

  it('B3 replace 之后的新 append 正常接到替换内容后面', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('AAA')]),
      turnEnd(25, 1),
      topLevelReplace(30, 'c1', 'COMPACT', 20, 20),
      turnStart(40, 2),
      rawResult(50, 'c1', [textBlock('LATE')]),
      turnEnd(60, 2),
    ])
    expect(stepAt(turns[0]!, 10).result?.text).toBe('COMPACTLATE')
  })

  it('B4 乱序到达（replace 先于它覆盖的 append）结果一致', () => {
    const inOrder: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('AAA')]),
      topLevelReplace(30, 'c1', 'COMPACT', 20, 20),
      turnEnd(35, 1),
    ]
    const swapped: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      topLevelReplace(30, 'c1', 'COMPACT', 20, 20), // 先到（目标还在 seqIndex 外）
      rawResult(20, 'c1', [textBlock('AAA')]),      // 后到
      turnEnd(35, 1),
    ]
    const a = stepAt(turnsOf(inOrder)[0]!, 10)
    const b = stepAt(turnsOf(swapped)[0]!, 10)
    expect(b.result?.text).toBe(a.result?.text)
    expect(b.result?.text).toBe('COMPACT')
    expect(b.result?.replacedBy).toBe(30)
  })

  it('B5 乱序 + 无 callId：replace 找不到尚未到达的目标 → 被忽略（结果不同，记录行为）', () => {
    // 这是「乱序一致」的边界：仅当 replace 自身带 callId（真实日志有）才能靠 byCallId 兜底。
    const swappedNoCallId: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      ev('tool/result', 30, { message: { content: [textBlock('COMPACT')] } }, {
        surfaceOp: { op: 'replace', startSeq: 20, endSeq: 20 },
      }),
      rawResult(20, 'c1', [textBlock('AAA')]),
      turnEnd(35, 1),
    ]
    const step = stepAt(turnsOf(swappedNoCallId)[0]!, 10)
    expect(step.result?.text).toBe('AAA')
    expect(step.result?.replacedBy).toBeUndefined()
  })

  it('B6 replace 找不到任何目标时不抛错、不建孤儿、统计不变', () => {
    const events: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('AAA')]),
      turnEnd(25, 1),
      topLevelReplace(30, 'ghost', 'GHOST', 999, 1000),
    ]
    let turns: TrailTurn[] = []
    expect(() => { turns = turnsOf(events) }).not.toThrow()
    const all = turns.flatMap((turn) => stepsOf(turn))
    expect(all.map((step) => step.seq)).toEqual([10])
    expect(all[0]!.orphan).toBeUndefined()
    expect(all[0]!.result?.text).toBe('AAA')
  })

  it('B7 §11.2：replace 只改写 result，不改写参数（args/argsPreview/argsBytes/argsTruncated）', () => {
    const original = '{"path":"a","new_string":"x"}'
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'edit', original, 'c1'),
      rawResult(20, 'c1', [textBlock('AAA')]),
      turnEnd(25, 1),
      topLevelReplace(30, 'c1', 'COMPACTED-ARGS', 20, 20),
    ])
    const step = stepAt(turns[0]!, 10)
    // 结果侧照旧被替换（旧 §9.3#7 的结果语义不变）。
    expect(step.result?.text).toBe('COMPACTED-ARGS')
    expect(step.result?.replacedBy).toBe(30)
    expect(step.result?.replacedFrom).toBe(20)
    // 参数侧是「调用事实」：逐字段保持 tool/call 原值（§11.2 覆盖旧 §9.3#7）。
    expect(step.args).toBe(original)
    expect(step.argsPreview).toBe(original)
    expect(step.argsBytes).toBe(original.length)
    expect(step.argsTruncated).toBe(false)

    // 边界：目标步原本没有 result 时，replace 也只新增 result，同样不动参数。
    const bare = stepAt(turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'edit', original, 'c1'),
      turnEnd(25, 1),
      topLevelReplace(30, 'c1', 'COMPACTED-ARGS', 10, 10),
    ])[0]!, 10)
    expect(bare.args).toBe(original)
    expect(bare.argsPreview).toBe(original)
    expect(bare.result?.text).toBe('COMPACTED-ARGS')
    expect(bare.result?.replacedBy).toBe(30)
  })

  it('B8 §9.3#1：replace 不改 step.kind（error 行保持 error，hasError 不抖）', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      ev('tool/result', 20, {
        callId: 'c1',
        error: { name: 'CommandError', code: 'E1' },
        message: { source: { callId: 'c1' }, isError: true, content: [textBlock('boom')] },
      }),
      turnEnd(25, 1),
      topLevelReplace(30, 'c1', 'SUMMARY OF FAILURE', 20, 20),
    ])
    const errorStep = stepAt(turns[0]!, 20)
    expect(errorStep.kind).toBe('error')
    expect(turns[0]!.hasError).toBe(true)
    // §9.3#1：step 身份保持 error，只有 result.kind 按新内容重算。
    expect(errorStep.result?.kind).toBe('text')
    expect(errorStep.result?.text).toBe('SUMMARY OF FAILURE')
  })

  it('B9 目标 seq 落在 tool/call 的 seq 上时也能命中（seqIndex 双登记）', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('AAA')]),
      turnEnd(25, 1),
      topLevelReplace(30, 'c1', 'VIA-CALL-SEQ', 10, 10),
    ])
    expect(stepAt(turns[0]!, 10).result?.text).toBe('VIA-CALL-SEQ')
  })

  it('B10 §9.3#5：同一事件内多个 text 块用 \\n 连接；跨事件 append 直接拼接', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('line-a'), textBlock('line-b')]),
      rawResult(22, 'c1', [textBlock('tail')]),
      turnEnd(25, 1),
    ])
    expect(stepAt(turns[0]!, 10).result?.text).toBe('line-a\nline-btail')
  })

  it('B11 §9.3#6：模型侧 raw 图片块缺 attachmentId 跳过；mediaType 缺失降级空串、bytes 缺省 0', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'read_image', '{}', 'c1'),
      rawResult(20, 'c1', [
        { type: 'image', attachment: { mediaType: 'image/png' } },                     // 无 attachmentId → 跳过
        { type: 'image', attachment: { attachmentId: 'a1' } },                         // mediaType 缺失 → ''
        { type: 'image', attachment: { attachmentId: 'a2', mediaType: 'image/jpeg', bytes: 7 } },
      ]),
      turnEnd(25, 1),
    ])
    const images = stepAt(turns[0]!, 10).result?.images ?? []
    expect(images.map((image) => image.attachmentId)).toEqual(['a1', 'a2'])
    expect(images[0]!.mediaType).toBe('')
    expect(images[0]!.bytes).toBe(0)
    expect(images[1]!.bytes).toBe(7)
  })
})

// ── C. TrailFolder：水位线 + markDirty ────────────────────────────────────

describe('C. TrailFolder 水位线与冻结轮次', () => {
  const base = (): Ev[] => [
    user(1, 'go'),
    turnStart(2, 1),
    toolCall(10, 'bash', 'cat big.log', 'c1'),
    rawResult(20, 'c1', [textBlock('OLD-LONG-RESULT')]),
    turnEnd(25, 1),
  ]

  it('C1 水位线不丢 replace：seq 更大，目标 seq 更小', () => {
    const folder = folderOf(base())
    const before = folder.snapshot()
    expect(stepAt(before[0]!, 10).result?.text).toBe('OLD-LONG-RESULT')
    folder.push(topLevelReplace(30, 'c1', 'COMPACTED', 20, 20) as SessionEventLike)
    expect(folder.latestSeq).toBe(30)
    const after = folder.snapshot()
    expect(stepAt(after[0]!, 10).result?.text).toBe('COMPACTED')
  })

  it('C2 markDirty 生效：已冻结轮次被改写后 snapshot() 返回新对象（不是旧身份）', () => {
    const folder = folderOf(base())
    const first = folder.snapshot()
    const firstTurn = first[0]!
    // 冻结（再次 snapshot 拿到同一身份）。
    expect(folder.snapshot()[0]).toBe(firstTurn)
    folder.push(topLevelReplace(30, 'c1', 'COMPACTED', 20, 20) as SessionEventLike)
    const second = folder.snapshot()
    expect(second[0]).not.toBe(firstTurn)
    expect(stepAt(second[0]!, 10).result?.text).toBe('COMPACTED')
    // 新对象自身保持稳定身份。
    expect(folder.snapshot()[0]).toBe(second[0])
  })

  it('C3 重复推送同一 replace（seq 回溯的重发页）不会二次应用', () => {
    const folder = folderOf(base())
    folder.push(topLevelReplace(30, 'c1', 'COMPACTED', 20, 20) as SessionEventLike)
    folder.push(topLevelReplace(30, 'c1', 'COMPACTED', 20, 20) as SessionEventLike)
    expect(folder.latestSeq).toBe(30)
    expect(stepAt(folder.snapshot()[0]!, 10).result?.text).toBe('COMPACTED')
  })

  it('C4 TrailFolder 与 foldTurns 在同一 replace 夹具上逐项一致', () => {
    const events = [...base(), topLevelReplace(30, 'c1', 'COMPACTED', 20, 20)]
    const batch = turnsOf(events)
    const incremental = folderOf(events).snapshot()
    expect(incremental.length).toBe(batch.length)
    expect(stepAt(incremental[0]!, 10).result?.text).toBe(stepAt(batch[0]!, 10).result?.text)
    expect(stepAt(incremental[0]!, 10).result?.replacedBy).toBe(stepAt(batch[0]!, 10).result?.replacedBy)
  })

  it('C5 §9.3#8：user 模式（无 turn/start）下已关闭轮次被 replace 命中时重新物化', () => {
    const events: Ev[] = [
      user(1, 'first'),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('OLD')]),
      user(30, 'second'),
      toolCall(40, 'bash', 'ls', 'c2'),
      rawResult(50, 'c2', [textBlock('SECOND')]),
    ]
    const folder = folderOf(events)
    const first = folder.snapshot()
    expect(first.length).toBe(2)
    const closed = first[0]!
    expect(stepAt(closed, 10).result?.text).toBe('OLD')
    folder.push(topLevelReplace(60, 'c1', 'REPLACED', 20, 20) as SessionEventLike)
    const after = folder.snapshot()
    expect(after[0]).not.toBe(closed)
    expect(stepAt(after[0]!, 10).result?.text).toBe('REPLACED')
  })

  it('C6 乱序 push（seq 回退）被水位线丢弃，且不会污染已折叠结果', () => {
    const folder = folderOf(base())
    const before = stepAt(folder.snapshot()[0]!, 10).result?.text
    folder.push(rawResult(20, 'c1', [textBlock('REPLAY')]) as SessionEventLike)
    expect(stepAt(folder.snapshot()[0]!, 10).result?.text).toBe(before)
  })

  it('C7 §9.3#9：user 模式下 foldByUserBoundaries 与 TrailFolder 结果一致（含 replace）', () => {
    const events: Ev[] = [
      user(1, 'first'),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('OLD')]),
      user(30, 'second'),
      toolCall(40, 'bash', 'ls', 'c2'),
      rawResult(50, 'c2', [textBlock('SECOND')]),
      topLevelReplace(60, 'c1', 'REPLACED', 20, 20),
    ]
    const batch = foldTurns(events as SessionEventLike[])
    const incremental = folderOf(events).snapshot()
    expect(incremental.length).toBe(batch.length)
    for (let i = 0; i < batch.length; i += 1) {
      expect(stepsOf(incremental[i]!).map((step) => step.seq)).toEqual(stepsOf(batch[i]!).map((step) => step.seq))
    }
    // 被 replace 的已关闭轮次：两个实现都必须看到新文本。
    expect(stepAt(incremental[0]!, 10).result?.text).toBe('REPLACED')
    expect(stepAt(batch[0]!, 10).result?.text).toBe('REPLACED')
  })
})

// ── D. append 合并 / 孤儿 / 统计 ──────────────────────────────────────────

describe('D. append 合并、孤儿、统计口径', () => {
  it('D1 同一 callId 多条 append 按 seq 合并（乱序输入也一致）', () => {
    const ordered: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('part1')]),
      rawResult(22, 'c1', [textBlock('part2')]),
      rawResult(24, 'c1', [textBlock('part3')]),
      turnEnd(30, 1),
    ]
    const shuffled: Ev[] = [ordered[0]!, ordered[1]!, ordered[2]!, ordered[4]!, ordered[5]!, ordered[3]!, ordered[6]!]
    expect(stepAt(turnsOf(ordered)[0]!, 10).result?.text).toBe('part1part2part3')
    expect(stepAt(turnsOf(shuffled)[0]!, 10).result?.text).toBe('part1part2part3')
  })

  it('D2 同 seq 重复 append 只留一条', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat', 'c1'),
      rawResult(20, 'c1', [textBlock('once')]),
      rawResult(20, 'c1', [textBlock('twice')]),
      turnEnd(30, 1),
    ])
    const text = stepAt(turns[0]!, 10).result?.text
    expect(text === 'once' || text === 'twice').toBe(true)
    expect(text!.length).toBeLessThanOrEqual(5)
  })

  it('D3 孤儿 result 生成占位行、不崩、计入统计', () => {
    const events: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      rawResult(20, 'ghost', [textBlock('lonely')]),
      turnEnd(30, 1),
    ]
    const folder = folderOf(events)
    const turn = folder.snapshot()[0]!
    const step = stepAt(turn, 20)
    expect(step.orphan).toBe(true)
    expect(step.name).toBe('tool')
    expect(step.result?.text).toBe('lonely')
    expect(folder.stats().total).toBe(1)
    expect(turnsOf(events)[0]!.stepsCount).toBe(1)
  })

  it('D4 图片 + 文本 → result.kind = mixed，图片按 attachmentId 去重', () => {
    const image = (id: string, extra: Record<string, unknown> = {}): unknown => ({
      type: 'image', attachment: { attachmentId: id, mediaType: 'image/png', bytes: 10, ...extra },
    })
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'read_image', '{}', 'c1'),
      rawResult(20, 'c1', [image('a1'), textBlock('caption'), image('a1')]),
      turnEnd(30, 1),
    ])
    const result = stepAt(turns[0]!, 10).result
    expect(result?.kind).toBe('mixed')
    expect(result?.images?.map((i) => i.attachmentId)).toEqual(['a1'])
    expect(result?.text).toBe('caption')
  })

  it('D5 无 content 的成功 result 仍挂 result（text 空、truncated false）', () => {
    const turns = turnsOf([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'true', 'c1'),
      ev('tool/result', 20, { callId: 'c1' }),
      turnEnd(30, 1),
    ])
    const result = stepAt(turns[0]!, 10).result
    expect(result).toBeDefined()
    expect(result?.text).toBe('')
    expect(result?.truncated).toBe(false)
  })
})

// ── E. wire 边界与页级预算 ────────────────────────────────────────────────

describe('E. wire 边界', () => {
  it('E1 契约常量与冻结值一致', () => {
    expect(TEXT_CAP).toBe(2048)
    expect(ARGS_CAP).toBe(32768)
    expect(RESULT_CAP).toBe(32768)
    expect(PAGE_SIZE).toBe(2000)
    expect(PAGE_BUDGET_BYTES).toBe(2 * 1024 * 1024)
    expect(MAX_BODY_BYTES).toBe(64 * 1024)
  })

  it('E2 arguments 恰好 32768 / 32769 的边界', () => {
    type Args = { arguments: string; argsBytes: number; argsTruncated: boolean }
    const exact = wireData<Args>(toolCall(1, 'edit', 'a'.repeat(32768)) as SessionEventLike)
    expect(exact.arguments.length).toBe(32768)
    expect(exact.arguments.endsWith('…')).toBe(false)
    expect(exact.argsBytes).toBe(32768)
    expect(exact.argsTruncated).toBe(false)

    const over = wireData<Args>(toolCall(2, 'edit', 'a'.repeat(32769)) as SessionEventLike)
    expect(over.arguments.length).toBe(32769) // 32768 字符 + 省略号
    expect(over.arguments.endsWith('…')).toBe(true)
    expect(over.arguments.slice(0, 32768)).toBe('a'.repeat(32768))
    expect(over.argsBytes).toBe(32769)
    expect(over.argsTruncated).toBe(true)
  })

  it('E3 空 arguments 仍带 arguments/argsBytes=0/argsTruncated=false（§9.2#1）', () => {
    const projected = wireData<{ arguments?: string; argsBytes?: number; argsTruncated?: boolean }>(
      toolCall(1, 'noop', '') as SessionEventLike,
    )
    expect(projected.arguments).toBe('')
    expect(projected.argsBytes).toBe(0)
    expect(projected.argsTruncated).toBe(false)
  })

  it('E4 text+image 混合块：顺序保留、contentBytes 用裁剪前长度、image 元数据可选', () => {
    const projected = wireData<{ content: unknown[]; contentBytes: number; contentTruncated: boolean }>(
      ev('tool/result', 1, {
        callId: 'c1',
        message: {
          content: [
            textBlock('hello'),
            { type: 'image', attachment: { attachmentId: 'a1', mediaType: 'image/png', bytes: 5, width: 3, height: 4, name: 'p.png' } },
            textBlock('world'),
            { type: 'image', attachment: { attachmentId: '', mediaType: 'image/png' } },   // 丢弃
            { type: 'image', attachment: { attachmentId: 'a2' } },                        // mediaType 缺失 → 丢弃
          ],
        },
      }) as SessionEventLike,
    )
    expect(projected.content).toEqual([
      { type: 'text', text: 'hello' },
      { type: 'image', attachment: { attachmentId: 'a1', mediaType: 'image/png', bytes: 5, width: 3, height: 4, name: 'p.png' } },
      { type: 'text', text: 'world' },
    ])
    expect(projected.contentBytes).toBe(10)
    expect(projected.contentTruncated).toBe(false)
  })

  it('E5 结果文本块超 RESULT_CAP → 裁剪 + contentTruncated=true', () => {
    const projected = wireData<{ contentBytes: number; contentTruncated: boolean; content: Array<{ text: string }> }>(
      ev('tool/result', 1, {
        callId: 'c1',
        message: { content: [textBlock('x'.repeat(RESULT_CAP + 1))] },
      }) as SessionEventLike,
    )
    expect(projected.contentTruncated).toBe(true)
    expect(projected.contentBytes).toBe(RESULT_CAP + 1)
    expect(projected.content[0]!.text.length).toBe(RESULT_CAP + 1)
  })

  it('E6 纯图片结果 → contentBytes=0 / contentTruncated=false；空数组不带 content', () => {
    const imageOnly = wireData<{ contentBytes: number; contentTruncated: boolean; content: unknown[] }>(
      ev('tool/result', 1, {
        callId: 'c1',
        message: { content: [{ type: 'image', attachment: { attachmentId: 'a1', mediaType: 'image/png' } }] },
      }) as SessionEventLike,
    )
    expect(imageOnly.content.length).toBe(1)
    expect(imageOnly.contentBytes).toBe(0)
    expect(imageOnly.contentTruncated).toBe(false)

    const empty = wireData<Record<string, unknown>>(
      ev('tool/result', 2, { callId: 'c1', message: { content: [] } }) as SessionEventLike,
    )
    expect(empty.content).toBeUndefined()
  })

  it('E7 message.content 为裸字符串时按单个 text 块处理（§9.2#5）', () => {
    const projected = wireData<{ content: unknown[]; contentBytes: number }>(
      ev('tool/result', 1, { callId: 'c1', message: { content: 'plain result' } }) as SessionEventLike,
    )
    expect(projected.content).toEqual([{ type: 'text', text: 'plain result' }])
    expect(projected.contentBytes).toBe(12)
  })
})

describe('E8. 页级字节预算（真实路由）', () => {
  type Handler = (req: HttpRequestLike, res: HttpResponseLike) => Promise<void>

  function fakeCtx(sessionId: string, events: unknown[]): HostCtx & { captured: Handler[] } {
    const captured: Handler[] = []
    const ctx: HostCtx = {
      webServer: { register: (route) => { captured.push(route.handler as Handler) } },
      sessionQuery: {
        readSession: vi.fn(async (id: string) => ({ events: id === sessionId ? (events as SessionEventLike[]) : [] })),
        listEvents: vi.fn(async (id: string) => (id === sessionId ? (events as SessionEventLike[]) : []).map((event) => ({ seq: event.seq }))),
      },
      effect: (fn) => fn(),
    }
    return Object.assign(ctx, { captured })
  }

  function fakeReq(sessionId: string, afterSeq: number): HttpRequestLike {
    const body = JSON.stringify({ sessionId, afterSeq })
    return {
      method: 'POST',
      headers: { host: '127.0.0.1:43120' },
      url: '/trace-inspect/api/events',
      async *[Symbol.asyncIterator]() { yield Buffer.from(body, 'utf8') },
    } as unknown as HttpRequestLike
  }

  function fakeRes(): HttpResponseLike & { status: number; body: string } {
    return {
      status: 0,
      body: '',
      writeHead(status: number) { this.status = status },
      end(body?: string | Buffer) { this.body = typeof body === 'string' ? body : String(body ?? '') },
    }
  }

  async function getPage(
    ctx: HostCtx & { captured: Handler[] },
    sessionId: string,
    afterSeq: number,
  ): Promise<{ status: number; events: SessionEventLike[]; hasMore: boolean; bytes: number }> {
    const res = fakeRes()
    await ctx.captured[0]!(fakeReq(sessionId, afterSeq), res)
    const parsed = JSON.parse(res.body || '{}') as { events?: SessionEventLike[]; hasMore?: boolean }
    return {
      status: res.status,
      events: parsed.events ?? [],
      hasMore: parsed.hasMore === true,
      bytes: Buffer.byteLength(JSON.stringify(parsed.events ?? [])),
    }
  }

  /** One ~33 KB projected tool/call event (ARGS_CAP is 32 KiB). */
  const bigCall = (seq: number): SessionEventLike => ({
    type: 'tool/call',
    seq,
    data: { name: 'edit', arguments: 'a'.repeat(ARGS_CAP), callId: `c${seq}` },
  })

  it('E8a 预算截断时 hasMore=true、每页 ≥1 条、且能完整抽干（不丢事件）', async () => {
    const total = 80
    const sessionId = 'verify-e8a'
    const events = Array.from({ length: total }, (_, index) => bigCall(index + 1))
    const ctx = fakeCtx(sessionId, events)
    apply(ctx)

    const first = await getPage(ctx, sessionId, 0)
    expect(first.status).toBe(200)
    expect(first.events.length).toBeGreaterThan(0)
    expect(first.events.length).toBeLessThan(total)
    expect(first.hasMore).toBe(true)
    expect(first.bytes).toBeLessThanOrEqual(PAGE_BUDGET_BYTES + 40_000)

    const seen: number[] = []
    let afterSeq = 0
    let pages = 0
    for (;;) {
      const page = await getPage(ctx, sessionId, afterSeq)
      pages += 1
      expect(page.events.length).toBeGreaterThanOrEqual(1)
      for (const event of page.events) {
        expect(event.seq).toBeGreaterThan(afterSeq)
        seen.push(event.seq)
      }
      afterSeq = page.events[page.events.length - 1]!.seq
      if (!page.hasMore) break
      expect(pages).toBeLessThan(50)
    }
    expect(seen.length).toBe(total)
    expect(new Set(seen).size).toBe(total)
  })

  it('E8b 单事件超预算：整条下发（每页至少 1 条），不产生死循环', async () => {
    // 一个投影后远大于 2 MiB 的事件（surfaceOp 契约要求原样透传，额外字段随行）。
    const sessionId = 'verify-e8b'
    const huge: SessionEventLike = {
      type: 'tool/result',
      seq: 1,
      data: { callId: 'c1', content: [{ type: 'text', text: 'ok' }] },
      surfaceOp: { op: 'replace', startSeq: 1, endSeq: 1, pad: 'z'.repeat(3 * 1024 * 1024) },
    } as unknown as SessionEventLike
    const events: SessionEventLike[] = [huge, { type: 'user/message', seq: 2, data: { content: 'tail' } }]
    const ctx = fakeCtx(sessionId, events)
    apply(ctx)

    const first = await getPage(ctx, sessionId, 0)
    expect(first.events.map((event) => event.seq)).toEqual([1])
    expect(first.hasMore).toBe(true)
    const second = await getPage(ctx, sessionId, 1)
    expect(second.events.map((event) => event.seq)).toEqual([2])
    expect(second.hasMore).toBe(false)
  })

  it('E8c 页大小上限仍是 PAGE_SIZE（预算未触发时按 PAGE_SIZE 切页）', async () => {
    const sessionId = 'verify-e8c'
    const events = Array.from({ length: 5 }, (_, index) => bigCall(index + 1))
    const ctx = fakeCtx(sessionId, events)
    apply(ctx)
    const page = await getPage(ctx, sessionId, 0)
    expect(page.events.length).toBeLessThanOrEqual(PAGE_SIZE)
    expect(page.hasMore).toBe(false)
  })
})

// ── F. 组件降级与边界 ─────────────────────────────────────────────────────

describe('F. 组件降级', () => {
  afterEach(() => { cleanup(); setPrimitivesForTest(undefined) })

  it('F1 loadPrimitives() 为 null 时 MarkdownResult 不抛且回退原文', () => {
    setPrimitivesForTest(null)
    const { container } = render(
      h(MarkdownResult, { text: '# Title\n\n- a\n- b', labels: markdownLabels('en') }),
    )
    expect(container.textContent).toContain('# Title')
    expect(container.querySelector('.ttl-raw')).not.toBeNull()
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(screen.getByTestId('ttl-md-fallback')).toBeTruthy()
  })

  it('F2 primitives 正常但文本不是 Markdown → 原文，且无 fallback 提示', () => {
    const calls: string[] = []
    const primitives: PrimitivesModule = {
      MarkdownText: (props) => {
        calls.push(props.text)
        return h('div', { 'data-testid': 'fake-md' }, props.text)
      },
      MarkdownDelegateProvider: (props) => h('div', null, props.children),
    }
    setPrimitivesForTest(primitives)
    render(h(MarkdownResult, { text: '$ ls\nfile-a\nfile-b', labels: markdownLabels('en') }))
    expect(screen.getByTestId('ttl-md-raw')).toBeTruthy()
    expect(screen.queryByTestId('ttl-md-fallback')).toBeNull()
    expect(calls).toEqual([])
  })

  it('F3 looksLikeMarkdown：bash 日志 / ANSI / 错误堆栈 → false；真实 Markdown → true', () => {
    expect(looksLikeMarkdown('$ git status\nOn branch main\nnothing to commit')).toBe(false)
    expect(looksLikeMarkdown('\u001b[32m✓\u001b[0m pass\n\u001b[31m✗\u001b[0m fail\n\u001b[33mwarn\u001b[0m\n- item')).toBe(false)
    expect(looksLikeMarkdown('Error: boom\n- not a list item really')).toBe(false)
    expect(looksLikeMarkdown('Traceback (most recent call last):\n  File "a.py", line 1')).toBe(false)
    expect(looksLikeMarkdown('    at run (/app/index.js:10:5)\n# heading')).toBe(false)
    expect(looksLikeMarkdown('plain text with no signals')).toBe(false)
    expect(looksLikeMarkdown('')).toBe(false)

    expect(looksLikeMarkdown('# Title\ntext')).toBe(true)
    expect(looksLikeMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |')).toBe(true)
    expect(looksLikeMarkdown('```ts\nconst a = 1\n```')).toBe(true)
    expect(looksLikeMarkdown('- one\n- two')).toBe(true)
    expect(looksLikeMarkdown('1. one\n2. two')).toBe(true)
    expect(looksLikeMarkdown('> quote')).toBe(true)
    expect(looksLikeMarkdown('a **bold** word')).toBe(true)
  })

  it('F4 defaultViewForTool 先 trim+lowercase，未知工具 → raw', () => {
    expect(defaultViewForTool('read')).toBe('rendered')
    expect(defaultViewForTool('  READ ')).toBe('rendered')
    expect(defaultViewForTool('bash')).toBe('raw')
    expect(defaultViewForTool('Bash_Output')).toBe('raw')
    expect(defaultViewForTool('pwsh')).toBe('raw')
    expect(defaultViewForTool('some_unknown')).toBe('raw')
    expect(defaultViewForTool('')).toBe('raw')
  })

  it('F5 JsonTree：循环引用不崩，渲染 [Circular]', () => {
    const cyclic: Record<string, unknown> = { name: 'root' }
    cyclic.self = cyclic
    const { container } = render(h(JsonTree, { value: cyclic }))
    expect(container.textContent).toContain('[Circular]')
  })

  it('F6 JsonTree：共享子树（DAG）按 [Circular] 安全处理，不死循环', () => {
    const shared = { leaf: 1 }
    const { container } = render(h(JsonTree, { value: { a: shared, b: shared } }))
    // 只在展开的容器里注册；两个兄弟分支都不展开时不应误报环。
    expect(container.textContent).not.toContain('[Circular]')
  })

  it('F7 JsonTree：超过 maxNodes 只渲染 capped 提示（不渲染残树）', () => {
    const over = Array.from({ length: 2000 }, (_, index) => index) // 1 + 2000 = 2001 > 2000
    const first = render(h(JsonTree, { value: over }))
    expect(first.container.querySelector('[data-testid="ttl-json-capped"]')).not.toBeNull()
    expect(first.container.querySelectorAll('.ttl-jsonRow').length).toBe(0)

    const exact = Array.from({ length: 1999 }, (_, index) => index) // 2000 == maxNodes → 渲染
    const second = render(h(JsonTree, { value: exact }))
    expect(second.container.querySelector('[data-testid="ttl-json-capped"]')).toBeNull()
    expect(second.container.querySelectorAll('.ttl-jsonRow').length).toBeGreaterThan(0)
  })

  it('F8 JsonTree：深链不栈溢出（maxDepth 截断）', () => {
    let deep: Record<string, unknown> = { leaf: true }
    for (let i = 0; i < 5000; i += 1) deep = { child: deep }
    expect(() => render(h(JsonTree, { value: deep }))).not.toThrow()
  })

  it('F9 markdownLabels 同 lang 返回同一对象身份，中英不同', () => {
    expect(markdownLabels('zh')).toBe(markdownLabels('zh'))
    expect(markdownLabels('en')).toBe(markdownLabels('en'))
    expect(markdownLabels('zh')).not.toBe(markdownLabels('en'))
    expect(markdownLabels('zh').code.toolbarLabels?.codeLabel).toBe('代码')
    expect(markdownLabels('en').code.toolbarLabels?.codeLabel).toBe('Code')
  })

  it('F10 JsonTree：长字符串折叠为 ttl-strbox 且带单字段复制按钮', () => {
    render(h(JsonTree, { value: { blob: 'x'.repeat(500) } }))
    expect(screen.getByTestId('ttl-strbox')).toBeTruthy()
    expect(screen.getByTestId('ttl-strbox-copy')).toBeTruthy()
  })

  it('F11 renderCap：只渲染前 64KiB + 提示条；点「展开全部」后渲染全文', () => {
    const seen: number[] = []
    setPrimitivesForTest({
      MarkdownText: (props) => { seen.push(props.text.length); return h('div', { 'data-testid': 'fake-md' }) },
      MarkdownDelegateProvider: (props) => h('div', null, props.children),
    })
    const text = `# Title\n${'x'.repeat(70 * 1024)}`
    render(h(MarkdownResult, { text, labels: markdownLabels('en') }))
    expect(screen.getByTestId('ttl-md-truncated')).toBeTruthy()
    expect(seen[0]).toBe(64 * 1024)
    fireEvent.click(screen.getByRole('button', { name: /Show all/ }))
    expect(screen.queryByTestId('ttl-md-truncated')).toBeNull()
    expect(seen[seen.length - 1]).toBe(text.length)
  })

  it('F12 JsonTree 分页：默认 50/页，「载入更多」逐页展开，最后一页去掉按钮', () => {
    const value = Array.from({ length: 120 }, (_, index) => index)
    const { container } = render(h(JsonTree, { value }))
    const rows = (): number => container.querySelectorAll('.ttl-jsonRow').length
    expect(rows()).toBe(51) // 根行 + 50 个子节点
    expect(screen.getByTestId('ttl-json-more')).toBeTruthy()
    fireEvent.click(screen.getByTestId('ttl-json-more'))
    expect(rows()).toBe(101)
    fireEvent.click(screen.getByTestId('ttl-json-more'))
    expect(rows()).toBe(121)
    expect(screen.queryByTestId('ttl-json-more')).toBeNull()
  })

  it('F13 剪贴板缺失时单字段复制静默忽略，不抛错', () => {
    render(h(JsonTree, { value: { blob: 'x'.repeat(500) } }))
    expect(() => fireEvent.click(screen.getByTestId('ttl-strbox-copy'))).not.toThrow()
    expect(screen.getByTestId('ttl-strbox-copy').textContent).toBe('Copied')
  })
})

// ── G. 规范：安全 / 颜色 / 依赖 / 改名 ────────────────────────────────────

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

describe('G. 安全与规范', () => {
  const files = sourceFiles(resolve(ROOT, 'src'))

  it('G1 src/ 里没有实际调用的 innerHTML / dangerouslySetInnerHTML / eval（只允许注释里提到）', () => {
    const offenders: string[] = []
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return
        if (/dangerouslySetInnerHTML/.test(line) || /\.innerHTML\b/.test(line) || /\beval\s*\(/.test(line)) {
          offenders.push(`${file}:${index + 1}: ${trimmed}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it('G2 CSS 无硬编码颜色：hex 只作为 var(--dsw-*) 的 fallback；新增段无裸 rgba/hsl', () => {
    // 剥掉所有 var(--token, fallback) 片段（fallback 里允许一层括号，如 rgba(...)），剩下的颜色就是硬编码。
    const stripVars = (css: string): string =>
      css.replace(/var\(--[a-z0-9-]+\s*(?:,\s*(?:[^()]|\([^()]*\))*)?\)/gi, 'VAR')

    const strippedAll = stripVars(trailCss)
    expect(strippedAll.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])

    // v0.4.0 新增段（从 .ttl-stepWrap 起）：连裸 rgba 都不允许。
    const detailStart = trailCss.indexOf('.ttl-stepWrap')
    expect(detailStart).toBeGreaterThan(0)
    const detailCss = stripVars(trailCss.slice(detailStart))
    expect(detailCss.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
    expect(detailCss.match(/(?<![\w-])(?:rgba?|hsla?)\(/g) ?? []).toEqual([])
    expect(trailCss).toContain('var(--ds-font-family-code')
  })

  it('G3 没有新增运行时依赖：package.json 无 dependencies，lockfile importers 段无 dependencies', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    expect(pkg.dependencies).toBeUndefined()
    const lock = readFileSync(resolve(ROOT, 'pnpm-lock.yaml'), 'utf8')
    const importers = lock.slice(lock.indexOf('importers:'), lock.indexOf('\npackages:'))
    expect(importers).not.toContain('dependencies:')
    // 运行时只允许两个 peer 名（宿主注入的 ui-primitives 连 peer 都不声明）。
    expect(Object.keys(pkg.peerDependencies ?? {}).sort()).toEqual(['dsh-better-sidebar', 'react'])
  })

  it('G4 构建产物的 require 只含 react / react-dom / ui-primitives（产物缺失时跳过）', () => {
    const client = resolve(ROOT, 'lib/client.js')
    if (!existsSync(client)) return
    const code = readFileSync(client, 'utf8')
    const requires = [...code.matchAll(/require\("([^"]+)"\)/g)].map((match) => match[1]!)
    // react-dom joined the allow-list in v0.5.0: the zoom overlay mounts through
    // React.createPortal(document.body), which needs react-dom at runtime. All
    // three entries are host-provided (build.mjs `external`) — the point of this
    // assertion is that NO third-party runtime dependency sneaks into the bundle.
    expect([...new Set(requires)].sort()).toEqual([
      '@deepseek-ai/dsh-client-ui-primitives',
      'react',
      'react-dom',
    ])
  })

  it('G5 改名一致性：src/ 与 tests/ 里没有旧包名；五处身份一致', () => {
    const banned = ['turn', 'outline'].join('-')
    for (const file of [...files, ...sourceFiles(resolve(ROOT, 'tests'))]) {
      expect(readFileSync(file, 'utf8'), file).not.toContain(banned)
    }
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { name: string; version: string }
    expect(pkg.name).toBe('dsh-trace-inspect')
    // Bump-proof release identity (Lead, 2026-10-17): the version must be a
    // release version AND the newest CHANGELOG heading, so a bump can never
    // leave them out of sync (nor break this test on every release).
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf8')).toContain(`## [${pkg.version}]`)
    expect(readFileSync(resolve(ROOT, 'cordis.patch.yml'), 'utf8')).toContain('id: trace-inspect')
    expect(readFileSync(resolve(ROOT, 'cordis.patch.yml'), 'utf8')).toContain('name: dsh-trace-inspect')
    expect(readFileSync(resolve(ROOT, 'build.mjs'), 'utf8')).toContain("id: 'dsh-trace-inspect'")
    expect(readFileSync(resolve(ROOT, 'src/client/useTrail.ts'), 'utf8')).toContain("'/trace-inspect/api/events'")
    expect(readFileSync(resolve(ROOT, 'src/index.ts'), 'utf8')).toContain("'/trace-inspect/api/events'")
    expect(readFileSync(resolve(ROOT, 'src/client/index.tsx'), 'utf8')).toContain("id: 'trace-inspect'")
    expect(readFileSync(resolve(ROOT, 'src/client/index.tsx'), 'utf8')).toContain("'dsh-trace-inspect'")
  })

  it('G6 契约 §4.5 的全部 ttl- 类都在 styles.ts 里', () => {
    const required = [
      'ttl-stepWrap', 'ttl-caret', 'ttl-caretOpen', 'ttl-jump', 'ttl-detail', 'ttl-detailBar', 'ttl-dtab',
      'ttl-dtabSelected', 'ttl-detailBody', 'ttl-detailFoot', 'ttl-pill', 'ttl-pillWarn', 'ttl-pillOk',
      'ttl-detailHint', 'ttl-json', 'ttl-jsonRow', 'ttl-jsonKey', 'ttl-jsonToggle', 'ttl-jsonStr', 'ttl-jsonNum',
      'ttl-jsonBool', 'ttl-jsonNull', 'ttl-jsonMore', 'ttl-jsonCapped', 'ttl-strbox', 'ttl-md', 'ttl-mdTableWrap',
      'ttl-mdTruncated', 'ttl-raw', 'ttl-imgRow', 'ttl-imgChip', 'ttl-errorBlock',
    ]
    const missing = required.filter((name) => !trailCss.includes(`.${name}`))
    expect(missing).toEqual([])
  })

  it('G7 契约 §4.6 的键在 zh/en 两个字典里都存在且文案正确', () => {
    const enStr = (key: Parameters<typeof t>[1]): string => t('en', key) as string
    expect(enStr('detailParams')).toBe('Params')
    expect(enStr('detailResult')).toBe('Result')
    expect(enStr('detailRaw')).toBe('Raw')
    expect(enStr('detailRender')).toBe('Rendered')
    expect(enStr('detailSource')).toBe('Source')
    expect((t('en', 'detailAria') as (name: string) => string)('read')).toBe('read details')
    expect((t('en', 'showAllLines') as (arg: string) => string)('10')).toBe('Show all (10)')
    expect((t('en', 'resultReplaced') as (n: number) => string)(9)).toBe('Replaced by compaction (seq #9)')
    expect((t('en', 'imageLabel') as (name: string) => string)('a.png')).toBe('Image: a.png')
    expect((t('en', 'imageMeta') as (w: number, h: number, size: string) => string)(2, 3, '4 B')).toBe('2×3 · 4 B')
    for (const key of [
      'jsonTooLarge', 'resultEmpty', 'resultUnparsable', 'orphanResult', 'markdownFallback',
      'loadMore', 'copyField', 'copyDetail', 'copiedDone', 'fullPill', 'truncatedPill', 'locateInChat',
    ] as const) {
      expect(enStr(key).length, key).toBeGreaterThan(0)
      expect(t('zh', key) as string, `zh:${key}`).not.toBe(enStr(key))
    }
    // zh 侧逐条对照契约表。
    expect(t('zh', 'detailParams')).toBe('参数')
    expect(t('zh', 'detailResult')).toBe('结果')
    expect(t('zh', 'detailRaw')).toBe('原始')
    expect(t('zh', 'detailRender')).toBe('渲染')
    expect(t('zh', 'detailSource')).toBe('原文')
    expect((t('zh', 'imageMeta') as (w: number, h: number, size: string) => string)(2, 3, '4 B')).toBe('2×3 · 4 B')
  })
})

// ── H. 折叠态行结构回归 ───────────────────────────────────────────────────

describe('H. 折叠态行结构（对比 HEAD）', () => {
  afterEach(() => { cleanup(); setPrimitivesForTest(undefined); vi.unstubAllGlobals() })

  const foldedTurn = (): SessionEventLike[] => [
    { type: 'user/message', seq: 1, data: { content: 'run it', message: { source: { kind: 'user' } } } },
    { type: 'turn/start', seq: 2, data: { turn: 1 } },
    { type: 'tool/call', seq: 3, data: { name: 'bash', arguments: 'npm test', callId: 'c3' } },
    { type: 'assistant/message', seq: 4, data: { message: { content: [{ type: 'text', text: 'done' }] } } },
    { type: 'turn/end', seq: 5, data: { turn: 1 } },
  ]

  /** A `read` step whose result is Markdown-shaped (rendered by default). */
  const readTurn = (): SessionEventLike[] => [
    { type: 'user/message', seq: 1, data: { content: 'read it', message: { source: { kind: 'user' } } } },
    { type: 'turn/start', seq: 2, data: { turn: 1 } },
    { type: 'tool/call', seq: 3, data: { name: 'read', arguments: '{"path":"a.md"}', callId: 'c3' } },
    { type: 'tool/result', seq: 4, data: { callId: 'c3', message: { content: [{ type: 'text', text: '# Title\n\n- a' }] } } },
    { type: 'turn/end', seq: 5, data: { turn: 1 } },
  ]

  const fakePrimitives = (): PrimitivesModule => ({
    MarkdownText: () => h('div', { 'data-testid': 'fake-md' }),
    MarkdownDelegateProvider: (props) => h('div', null, props.children),
  })

  const mount = async (events: SessionEventLike[]): Promise<void> => {
    render(h(TrailTab, {
      scope: { sessionId: 's1' },
      visible: true,
      tab: { id: 'trace-inspect' },
      fetchEventsOverride: async () => ({ events, hasMore: false }),
    }))
    await waitFor(() => { expect(screen.getAllByTestId('ttl-step').length).toBeGreaterThan(0) })
  }

  it('H1 折叠行仍是 ttl-row + dot/name/args 三件套，外加 caret；未展开时无详情带', async () => {
    await mount(foldedTurn())
    const row = screen.getByTestId('ttl-step')
    const wrap = screen.getByTestId('ttl-step-wrap')
    expect(row.className).toBe('ttl-row')
    expect(row.getAttribute('data-step-kind')).toBe('tool')
    expect(row.querySelector('.ttl-caret')).not.toBeNull()
    expect(row.querySelector('.ttl-rowDot')).not.toBeNull()
    expect(row.querySelector('.ttl-rowName.ttl-rowNameMono')?.textContent).toBe('bash')
    expect(row.querySelector('.ttl-rowArgs')?.textContent).toBe('npm test')
    expect(row.children.length).toBe(4)
    expect(wrap.getAttribute('data-open')).toBeNull()
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
    // 跳转按钮是行的兄弟节点（不是嵌套按钮），折叠态也不占位。
    expect(screen.getByTestId('ttl-step-jump').parentElement).toBe(wrap)
  })

  it('H2 点行 = 展开（不触发跳转）；点 ↗ = 跳转（无会话服务 → 跳转失败提示）', async () => {
    await mount(foldedTurn())

    fireEvent.click(screen.getByTestId('ttl-step'))
    expect(screen.getByTestId('ttl-detail')).toBeTruthy()
    expect(screen.queryByTestId('ttl-statusbar')).toBeNull() // 没有发生跳转

    fireEvent.click(screen.getByTestId('ttl-step'))
    expect(screen.queryByTestId('ttl-detail')).toBeNull()

    fireEvent.click(screen.getByTestId('ttl-step-jump'))
    await waitFor(() => { expect(screen.getByTestId('ttl-statusbar')).toBeTruthy() })
  })

  it('H4 a11y：aria-controls 指向实际详情带；role=region/tab + aria-label', async () => {
    await mount(readTurn())
    fireEvent.click(screen.getByTestId('ttl-step'))
    const row = screen.getByTestId('ttl-step')
    const detail = screen.getByTestId('ttl-detail')
    expect(row.getAttribute('aria-expanded')).toBe('true')
    expect(row.getAttribute('aria-controls')).toBe(detail.id)
    expect(detail.getAttribute('role')).toBe('region')
    expect(detail.getAttribute('aria-label')).toBe('read details')
    const tabs = Array.from(detail.querySelectorAll('[role="tab"]'))
    expect(tabs.length).toBe(3)
    expect(tabs.map((tab) => tab.getAttribute('data-testid'))).toEqual([
      'ttl-dtab-params', 'ttl-dtab-result', 'ttl-dtab-raw',
    ])
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true').length).toBe(1)
  })

  it('H5 默认页签：有 result → 结果；无 result → 参数（且不可解析参数走原文+提示）', async () => {
    await mount(readTurn())
    fireEvent.click(screen.getByTestId('ttl-step'))
    expect(screen.getByTestId('ttl-detail-body-result')).toBeTruthy()
    fireEvent.click(screen.getByTestId('ttl-dtab-params'))
    expect(screen.getByTestId('ttl-json')).toBeTruthy() // {"path":"a.md"} 可解析 → JSON 树

    cleanup()
    await mount([
      { type: 'user/message', seq: 1, data: { content: 'x', message: { source: { kind: 'user' } } } },
      { type: 'turn/start', seq: 2, data: { turn: 1 } },
      { type: 'tool/call', seq: 3, data: { name: 'bash', arguments: 'ls -la', callId: 'c3' } },
      { type: 'turn/end', seq: 5, data: { turn: 1 } },
    ])
    fireEvent.click(screen.getByTestId('ttl-step'))
    expect(screen.getByTestId('ttl-detail-body-params')).toBeTruthy()
    expect(screen.getByTestId('ttl-detail-unparsable')).toBeTruthy()
  })

  it('H6 AC12：渲染/原文切换即时生效且折叠再展开后保持', async () => {
    setPrimitivesForTest(fakePrimitives())
    await mount(readTurn())
    fireEvent.click(screen.getByTestId('ttl-step'))
    // read → 默认渲染视图。
    expect(screen.getByTestId('fake-md')).toBeTruthy()
    expect(screen.queryByTestId('ttl-md-raw')).toBeNull()

    fireEvent.click(screen.getByTestId('ttl-view-toggle'))
    expect(screen.queryByTestId('fake-md')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw')).toBeTruthy()

    fireEvent.click(screen.getByTestId('ttl-step')) // 折叠
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
    fireEvent.click(screen.getByTestId('ttl-step')) // 再展开
    expect(screen.queryByTestId('fake-md')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw')).toBeTruthy()
  })

  it('H7 AC14：错误结果的错误名/码 + 原文都可见', async () => {
    await mount([
      { type: 'user/message', seq: 1, data: { content: 'rollback', message: { source: { kind: 'user' } } } },
      { type: 'turn/start', seq: 2, data: { turn: 1 } },
      { type: 'tool/call', seq: 3, data: { name: 'bash', arguments: 'rollback', callId: 'c3' } },
      {
        type: 'tool/result',
        seq: 4,
        data: {
          callId: 'c3',
          error: { name: 'CommandError', code: 'E1' },
          message: { source: { callId: 'c3' }, isError: true, content: [{ type: 'text', text: 'rollback failed: E1' }] },
        },
      },
      { type: 'turn/end', seq: 5, data: { turn: 1 } },
    ])
    const rows = screen.getAllByTestId('ttl-step')
    expect(rows.length).toBe(2)
    fireEvent.click(rows[1]!) // 第二行 = error 步骤
    expect(screen.getByTestId('ttl-error-block')).toBeTruthy()
    expect(screen.getByTestId('ttl-error-name').textContent).toBe('CommandError · E1')
    expect(screen.getByTestId('ttl-detail').textContent).toContain('rollback failed: E1')
  })

  it('H9 AC3 端到端：replace 让「结果」显示替换内容，而「行预览/参数」保持原始命令（§11.2）', async () => {
    const raw: Ev[] = [
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(10, 'bash', 'cat big.log', 'c1'),
      rawResult(20, 'c1', [textBlock('OLD-LONG-RESULT')]),
      turnEnd(25, 1),
      user(170, 'next'),
      turnStart(172, 2),
      topLevelReplace(182, 'c1', 'COMPACTED', 20, 20),
    ]
    const projected = raw.map((event) => projectEvent(event as SessionEventLike) as SessionEventLike)
    render(h(TrailTab, {
      scope: { sessionId: 's1' },
      visible: true,
      tab: { id: 'trace-inspect' },
      fetchEventsOverride: async () => ({ events: projected, hasMore: false }),
    }))
    await waitFor(() => { expect(screen.getAllByTestId('ttl-turn').length).toBe(2) })

    // 默认展开最新轮次（第 2 轮，无步骤）；点开第 1 轮的折叠头。
    const turnRows = screen.getAllByTestId('ttl-turn')
    fireEvent.click(turnRows[0]!.querySelector('.ttl-turnToggle') as Element)
    await waitFor(() => { expect(screen.getAllByTestId('ttl-step').length).toBe(1) })
    const row = screen.getAllByTestId('ttl-step')[0]!
    // §11.2（实机 F7 回归）：被 replace 覆盖的行，折叠预览仍必须是原始命令，
    // 不能变成压缩摘要（旧实现会把 argsPreview 写成替换文本）。
    expect(row.querySelector('.ttl-rowArgs')?.textContent).toBe('cat big.log')
    fireEvent.click(row)

    const detail = screen.getByTestId('ttl-detail')
    expect(detail.textContent).toContain('COMPACTED')
    expect(detail.textContent).not.toContain('OLD-LONG-RESULT')
    expect(screen.getByTestId('ttl-detail-replaced').textContent)
      .toContain('Replaced by compaction (seq #182)')

    // 「参数」页仍是原始命令；替换文本只出现在「结果」页。
    fireEvent.click(screen.getByTestId('ttl-dtab-params'))
    const paramsBody = screen.getByTestId('ttl-detail-body-params')
    expect(paramsBody.textContent).toContain('cat big.log')
    expect(paramsBody.textContent).not.toContain('COMPACTED')
  })

  it('H8 图片结果：占位 chip 含 imageLabel / mediaType / imageMeta', async () => {
    await mount([
      { type: 'user/message', seq: 1, data: { content: 'shot', message: { source: { kind: 'user' } } } },
      { type: 'turn/start', seq: 2, data: { turn: 1 } },
      { type: 'tool/call', seq: 3, data: { name: 'read_image', arguments: '{}', callId: 'c3' } },
      {
        type: 'tool/result',
        seq: 4,
        data: {
          callId: 'c3',
          message: {
            content: [
              { type: 'text', text: 'caption' },
              { type: 'image', attachment: { attachmentId: 'a1', mediaType: 'image/png', bytes: 2048, width: 100, height: 50, name: 'shot.png' } },
            ],
          },
        },
      },
      { type: 'turn/end', seq: 5, data: { turn: 1 } },
    ])
    fireEvent.click(screen.getByTestId('ttl-step'))
    const chip = screen.getByTestId('ttl-img-chip')
    expect(chip.textContent).toContain('Image: shot.png')
    expect(chip.textContent).toContain('image/png')
    expect(chip.textContent).toContain('100×50 · 2 KB')
    expect(screen.getByTestId('ttl-detail').textContent).toContain('caption')
  })

  it('H3 .ttl-row 基础样式与 HEAD 逐字节一致，新增只加了一条 padding-right 覆盖', () => {
    const headRow = [
      '.ttl-row {',
      '  box-sizing: border-box;',
      '  width: 100%;',
      '  display: flex;',
      '  align-items: flex-start;',
      '  gap: 7px;',
      '  padding: 3px 6px;',
      '  border: none;',
      '  border-radius: 4px;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-primary, #f9fafb);',
      '  font: inherit;',
      '  font-size: 12px;',
      '  line-height: 18px;',
      '  text-align: left;',
      '  cursor: pointer;',
      '}',
    ].join('\n')
    expect(trailCss).toContain(headRow)
    expect(trailCss).toContain('.ttl-stepWrap .ttl-row { padding-right: 26px; }')
    // 折叠态行高不变：18px 行高 + 3px 上下内边距。
    expect(trailCss).toMatch(/\.ttl-row \{[\s\S]*?padding: 3px 6px;[\s\S]*?line-height: 18px;/)
  })
})
