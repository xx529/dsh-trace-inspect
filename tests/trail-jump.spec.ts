/**
 * trail-jump.spec.ts — structured jump coverage (≈9 cases): chat view
 * anchor lookup, loadOlder paging, guard cap, hidden-node fallback, and the
 * trajectory-view mapping.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  findNodeForSeq,
  hasSeqInWindow,
  jumpToItem,
  trajectoryRecordIdFor,
  type ChatNodeLike,
  type DocumentLike,
  type SessionFace,
  type SessionSnapshotLike,
} from '../src/client/trail-jump'

const node = (key: string, anchorSeq: number, extra: Partial<ChatNodeLike> = {}): ChatNodeLike => ({
  key,
  anchorSeq,
  ...extra,
})

/** A fake session whose window grows toward older history on loadOlder(). */
function fakeSession(nodes: ChatNodeLike[], pages: number): SessionFace & { loadOlder: ReturnType<typeof vi.fn> } {
  let loaded = 0
  let hasMore = pages > 1
  const loadOlder = vi.fn(async () => {
    loaded += 1
    hasMore = loaded < pages - 1
  })
  return {
    loadOlder,
    getSnapshot: (): SessionSnapshotLike => ({
      hasMore,
      chat: { nodes: { values: () => nodes.slice(Math.max(0, nodes.length - (loaded + 1))) } },
    }),
  }
}

const chatDocument = (row: { scrollIntoView: ReturnType<typeof vi.fn>; classList?: { add: ReturnType<typeof vi.fn> } } | null): DocumentLike => ({
  querySelector: vi.fn((selector: string) => (
    typeof selector === 'string' && selector.includes('data-chat-anchor-key') ? row : null
  )) as unknown as DocumentLike['querySelector'],
  querySelectorAll: vi.fn(() => []) as unknown as DocumentLike['querySelectorAll'],
})

describe('hasSeqInWindow / findNodeForSeq', () => {
  it('window bounds are min..max of visible anchorSeq', () => {
    const snapshot: SessionSnapshotLike = {
      chat: { nodes: { values: () => [
        node('a', 10), node('b', 20), node('hidden', 15, { visibility: 'hidden' }),
      ] } },
    }
    expect(hasSeqInWindow(snapshot, 12)).toBe(true)
    expect(hasSeqInWindow(snapshot, 5)).toBe(false)
  })

  it('hidden nodes are skipped; nearest wins on no exact match', () => {
    const snapshot: SessionSnapshotLike = {
      chat: { nodes: { values: () => [
        node('a', 10), node('hidden', 15, { visibility: 'hidden' }), node('b', 18), node('c', 30),
      ] } },
    }
    // Hidden (15) skipped → nearest visible below 15 is b(18).
    expect(findNodeForSeq(snapshot, 15)?.key).toBe('b')
    // Between b(18) and c(30) the next row wins (content after the target).
    expect(findNodeForSeq(snapshot, 20)?.key).toBe('c')
    expect(findNodeForSeq(snapshot, 35)?.key).toBe('c')
  })
})

describe('jumpToItem — chat view', () => {
  it('exact node → row scrollIntoView(center) + flash class', async () => {
    const row = { scrollIntoView: vi.fn(), classList: { add: vi.fn() } }
    const session = fakeSession([node('k1', 10), node('k2', 20)], 1)
    const outcome = await jumpToItem(session, { seq: 20, kind: 'user' }, { document: chatDocument(row) })
    expect(outcome).toEqual({ ok: true, mode: 'chat' })
    expect(row.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(row.classList.add).toHaveBeenCalledWith('ttl-flash')
  })

  it('loadOlder pages until the target is inside the window, reporting progress', async () => {
    const row = { scrollIntoView: vi.fn(), classList: { add: vi.fn() } }
    // 5 nodes; target = seq 10 (oldest). Initial window = newest 1 → 3 pages needed.
    const nodes = [10, 20, 30, 40, 50].map((seq, i) => node(`k${i}`, seq))
    const session = fakeSession(nodes, 4)
    const pages: number[] = []
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, {
      document: chatDocument(row),
      onProgress: (p) => { pages.push(p) },
    })
    expect(outcome.ok).toBe(true)
    expect(session.loadOlder).toHaveBeenCalled()
    expect(pages.length).toBeGreaterThan(0)
  })

  it('guard caps the loadOlder loop; the nearest visible row still wins', async () => {
    const row = { scrollIntoView: vi.fn(), classList: { add: vi.fn() } }
    const nodes = Array.from({ length: 100 }, (_, i) => node(`k${i}`, i * 10))
    const session = fakeSession(nodes, 1000) // hasMore stays true for many pages
    const outcome = await jumpToItem(session, { seq: 1, kind: 'user' }, {
      document: chatDocument(row),
      guard: 5,
    })
    expect(session.loadOlder.mock.calls.length).toBeLessThanOrEqual(5)
    // Fallback: the nearest rendered row is still located, not a hard failure.
    expect(outcome.ok).toBe(true)
  })

  it('row not found in the chat view → explicit failure', async () => {
    const session = fakeSession([node('k1', 10)], 1)
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, { document: chatDocument(null) })
    expect(outcome).toEqual({ ok: false, error: 'row-not-in-chat-view' })
  })

  it('retries across frames while the freshly loaded row mounts (first-call miss)', async () => {
    const row = { scrollIntoView: vi.fn(), classList: { add: vi.fn() } }
    let chatSelectorCalls = 0
    const document: DocumentLike = {
      querySelector: vi.fn((selector: string) => {
        if (typeof selector === 'string' && selector.includes('data-trajectory-scroll')) return null
        if (typeof selector === 'string' && selector.includes('data-chat-anchor-key')) {
          chatSelectorCalls += 1
          return chatSelectorCalls >= 2 ? row : null // row mounts after one frame
        }
        return null
      }) as unknown as DocumentLike['querySelector'],
      querySelectorAll: vi.fn(() => []) as unknown as DocumentLike['querySelectorAll'],
    }
    const session = fakeSession([node('k1', 10)], 1)
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, { document })
    expect(outcome).toEqual({ ok: true, mode: 'chat' })
    expect(row.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(chatSelectorCalls).toBeGreaterThanOrEqual(2)
  })
})

describe('jumpToItem — trajectory view', () => {
  const trajectorySnapshot = (): SessionSnapshotLike => ({
    hasMore: false,
    views: {
      get: (kind: string) => kind === 'trajectory' ? {
        eventNodes: [
          { kind: 'user', seq: 10 },
          { kind: 'assistant', seq: 20, turn: 1, step: 2 },
          { kind: 'tool-result', seq: 25, callId: 'c25' },
        ],
        requests: [{ purpose: 'compaction', startSeq: 30, resultSeq: 35 }],
      } : null,
    },
  })

  it('maps user / assistant / tool / compaction items to row keys', () => {
    const snapshot = trajectorySnapshot()
    expect(trajectoryRecordIdFor({ seq: 10, kind: 'user' }, snapshot)).toBe('user\u0000seq\u000010')
    expect(trajectoryRecordIdFor({ seq: 20, kind: 'output' }, snapshot)).toBe('assistant\u00001\u00002')
    expect(trajectoryRecordIdFor({ seq: 25, kind: 'tool', callId: 'c25' }, snapshot)).toBe('tool\u0000call\u0000c25')
    expect(trajectoryRecordIdFor({ seq: 35, kind: 'compaction' }, snapshot)).toBe('compacted\u0000seq\u000030')
  })

  it('jumps when the trajectory row exists', async () => {
    const row = { scrollIntoView: vi.fn(), dataset: { trajectoryRowKey: 'user\u0000seq\u000010' } }
    const document: DocumentLike = {
      querySelector: vi.fn(() => ({})) as unknown as DocumentLike['querySelector'], // trajectory active
      querySelectorAll: vi.fn((selector: string) => (
        selector === 'tr[data-trajectory-row-key]' ? [row] : []
      )) as unknown as DocumentLike['querySelectorAll'],
    }
    const session = fakeSession([], 1)
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, { document })
    expect(outcome).toEqual({ ok: true, mode: 'trajectory' })
    expect(row.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('expands collapsed summaries and retries before failing', async () => {
    let expanded = false
    const row = { scrollIntoView: vi.fn(), dataset: { trajectoryRowKey: 'user\u0000seq\u000010' } }
    // Clicking a collapsed summary is what reveals the target row.
    const expandedClick = vi.fn(() => { expanded = true })
    const querySelectorAll = vi.fn((selector: string) => {
      if (selector === 'tr[data-trajectory-row-key]') {
        return expanded ? [row] : []
      }
      if (selector === 'tr[data-collapsed-summary]') return [{ click: expandedClick, dataset: {} }]
      return []
    })
    const document: DocumentLike = {
      querySelector: vi.fn(() => ({})) as unknown as DocumentLike['querySelector'],
      querySelectorAll: querySelectorAll as unknown as DocumentLike['querySelectorAll'],
    }
    const session = fakeSession([], 1)
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, { document })
    expect(outcome).toEqual({ ok: true, mode: 'trajectory' })
    expect(expandedClick).toHaveBeenCalled()
  })
})
