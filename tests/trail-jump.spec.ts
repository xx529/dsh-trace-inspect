/**
 * trail-jump.spec.ts — structured jump coverage: chat view anchor lookup,
 * loadOlder paging, guard cap, hidden-node fallback, and the trajectory-view
 * mapping — across BOTH host lines:
 *
 *   0.2.0 — the conversation view registry (`uiConversation.binding(id)`
 *           targets 'chat' / 'trajectory') assembled via viewStateForJump;
 *   0.1.x — the legacy session snapshot fields (`snapshot.chat.nodes` /
 *           `snapshot.views.get('trajectory')`).
 */
import { describe, expect, it, vi } from 'vitest'
import {
  findNodeForSeq,
  hasSeqInWindow,
  jumpToItem,
  trajectoryRecordIdsFor,
  viewStateForJump,
  type ChatNodeLike,
  type ConversationTargetsLike,
  type DocumentLike,
  type JumpViewState,
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

/** A 0.2.0 conversation face exposing a 'chat' target whose window grows. */
function fakeConversation(nodes: ChatNodeLike[], pages: number): ConversationTargetsLike & { grow: () => void } {
  let loaded = 0
  return {
    grow: () => { loaded += 1 },
    target(name: string) {
      if (name !== 'chat') return undefined
      return {
        getSnapshot: () => ({ nodes: { values: () => nodes.slice(Math.max(0, nodes.length - (loaded + 1))) } }),
      }
    },
  }
}

/** A session + conversation pair where loadOlder grows both windows. */
function fakeModernSession(nodes: ChatNodeLike[], pages: number): { session: SessionFace; conversation: ConversationTargetsLike } {
  const conversation = fakeConversation(nodes, pages)
  let loaded = 0
  let hasMore = pages > 1
  const session: SessionFace = {
    loadOlder: vi.fn(async () => {
      loaded += 1
      hasMore = loaded < pages - 1
      conversation.grow()
    }),
    getSnapshot: () => ({ hasMore }) as SessionSnapshotLike,
  }
  void loaded
  return { session, conversation }
}

const chatDocument = (row: { scrollIntoView: ReturnType<typeof vi.fn>; classList?: { add: ReturnType<typeof vi.fn> } } | null): DocumentLike => ({
  querySelector: vi.fn((selector: string) => (
    typeof selector === 'string' && selector.includes('data-chat-anchor-key') ? row : null
  )) as unknown as DocumentLike['querySelector'],
  querySelectorAll: vi.fn(() => []) as unknown as DocumentLike['querySelectorAll'],
})

describe('hasSeqInWindow / findNodeForSeq', () => {
  const view = (nodes: ChatNodeLike[]): JumpViewState => ({ hasMore: false, chatNodes: { values: () => nodes }, trajectoryView: undefined })

  it('window bounds are min..max of visible anchorSeq', () => {
    const state = view([
      node('a', 10), node('b', 20), node('hidden', 15, { visibility: 'hidden' }),
    ])
    expect(hasSeqInWindow(state, 12)).toBe(true)
    expect(hasSeqInWindow(state, 5)).toBe(false)
  })

  it('hidden nodes are skipped; nearest wins on no exact match', () => {
    const state = view([
      node('a', 10), node('hidden', 15, { visibility: 'hidden' }), node('b', 18), node('c', 30),
    ])
    // Hidden (15) skipped → nearest visible below 15 is b(18).
    expect(findNodeForSeq(state, 15)?.key).toBe('b')
    // Between b(18) and c(30) the next row wins (content after the target).
    expect(findNodeForSeq(state, 20)?.key).toBe('c')
    expect(findNodeForSeq(state, 35)?.key).toBe('c')
  })
})

describe('viewStateForJump — 0.2.0 conversation registry', () => {
  it('prefers the conversation chat target over the legacy snapshot field', () => {
    const conversation = fakeConversation([node('new', 30)], 1)
    const session: SessionFace = {
      loadOlder: async () => {},
      getSnapshot: () => ({ hasMore: true, chat: { nodes: { values: () => [node('legacy', 5)] } } }),
    }
    const view = viewStateForJump(session, conversation)
    expect(view.hasMore).toBe(true)
    expect([...(view.chatNodes?.values() ?? [])].map((n) => n.key)).toEqual(['new'])
  })

  it('falls back to the legacy snapshot fields without a conversation face', () => {
    const session: SessionFace = {
      loadOlder: async () => {},
      getSnapshot: () => ({
        hasMore: false,
        chat: { nodes: { values: () => [node('legacy', 5)] } },
        views: { get: (kind) => kind === 'trajectory' ? { eventNodes: [] } : null },
      }),
    }
    const view = viewStateForJump(session)
    expect([...(view.chatNodes?.values() ?? [])].map((n) => n.key)).toEqual(['legacy'])
    expect(view.trajectoryView).toEqual({ eventNodes: [] })
  })

  it('reads the trajectory target from the conversation registry (0.2.0)', () => {
    const conversation: ConversationTargetsLike = {
      target(name: string) {
        return name === 'trajectory' ? { getSnapshot: () => ({ eventNodes: [{ kind: 'user', seq: 10 }], requests: [] }) } : undefined
      },
    }
    const session: SessionFace = { loadOlder: async () => {}, getSnapshot: () => ({ hasMore: false }) }
    const view = viewStateForJump(session, conversation)
    expect(trajectoryRecordIdsFor({ seq: 10, kind: 'user' }, view.trajectoryView)).toEqual(['user\u0000seq\u000010'])
  })
})

describe('jumpToItem — chat view (0.2.0 registry path)', () => {
  it('exact node → row scrollIntoView(center) + flash class', async () => {
    const row = { scrollIntoView: vi.fn(), classList: { add: vi.fn() } }
    const { session, conversation } = fakeModernSession([node('k1', 10), node('k2', 20)], 1)
    const outcome = await jumpToItem(session, { seq: 20, kind: 'user' }, { document: chatDocument(row), conversation })
    expect(outcome).toEqual({ ok: true, mode: 'chat' })
    expect(row.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(row.classList.add).toHaveBeenCalledWith('ttl-flash')
  })

  it('loadOlder pages until the target is inside the window, reporting progress', async () => {
    const row = { scrollIntoView: vi.fn(), classList: { add: vi.fn() } }
    // 5 nodes; target = seq 10 (oldest). Initial window = newest 1 → 3 pages needed.
    const nodes = [10, 20, 30, 40, 50].map((seq, i) => node(`k${i}`, seq))
    const { session, conversation } = fakeModernSession(nodes, 4)
    const pages: number[] = []
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, {
      document: chatDocument(row),
      onProgress: (p) => { pages.push(p) },
      conversation,
    })
    expect(outcome.ok).toBe(true)
    expect(session.loadOlder).toHaveBeenCalled()
    expect(pages.length).toBeGreaterThan(0)
  })
})

describe('jumpToItem — chat view (0.1.x legacy path)', () => {
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

  it('matches a 0.2.0 grouped row through data-chat-node-key when the anchor key is a JSON pair', async () => {
    const row = { scrollIntoView: vi.fn(), classList: { add: vi.fn() }, dataset: { chatNodeKey: 'k1' } }
    const document: DocumentLike = {
      // The exact anchor-key query misses (the row's anchor key is a JSON pair).
      querySelector: vi.fn(() => null) as unknown as DocumentLike['querySelector'],
      querySelectorAll: vi.fn((selector: string) => (
        typeof selector === 'string' && selector.includes('data-chat-node-key') ? [row] : []
      )) as unknown as DocumentLike['querySelectorAll'],
    }
    const session = fakeSession([node('k1', 10)], 1)
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, { document })
    expect(outcome).toEqual({ ok: true, mode: 'chat' })
    expect(row.scrollIntoView).toHaveBeenCalled()
  })
})

describe('jumpToItem — trajectory view', () => {
  const trajectoryView = (): Record<string, unknown> => ({
    eventNodes: [
      { kind: 'user', seq: 10 },
      { kind: 'assistant', seq: 20, turn: 1, step: 2 },
      { kind: 'tool-result', seq: 25, callId: 'c25' },
    ],
    requests: [{ purpose: 'compaction', startSeq: 30, resultSeq: 35 }],
  })

  it('maps user / assistant / tool / compaction items to row-key candidates', () => {
    expect(trajectoryRecordIdsFor({ seq: 10, kind: 'user' }, trajectoryView())).toEqual(['user\u0000seq\u000010'])
    // Assistant: legacy turn/step key first, 0.2.0 seq-grammar key second.
    expect(trajectoryRecordIdsFor({ seq: 20, kind: 'output' }, trajectoryView())).toEqual([
      'assistant\u00001\u00002',
      'assistant\u0000seq\u000020',
    ])
    expect(trajectoryRecordIdsFor({ seq: 25, kind: 'tool', callId: 'c25' }, trajectoryView())).toEqual(['tool\u0000call\u0000c25'])
    expect(trajectoryRecordIdsFor({ seq: 35, kind: 'compaction' }, trajectoryView())).toEqual(['compacted\u0000seq\u000030'])
    expect(trajectoryRecordIdsFor({ seq: 1, kind: 'user' }, undefined)).toEqual([])
  })

  it('jumps when the trajectory row exists (legacy snapshot source)', async () => {
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

  it('jumps when the trajectory row exists (0.2.0 conversation target)', async () => {
    const row = { scrollIntoView: vi.fn(), dataset: { trajectoryRowKey: encodeURIComponent('user\u0000seq\u000010') } }
    const document: DocumentLike = {
      querySelector: vi.fn(() => ({})) as unknown as DocumentLike['querySelector'], // trajectory active
      querySelectorAll: vi.fn((selector: string) => (
        selector === 'tr[data-trajectory-row-key]' ? [row] : []
      )) as unknown as DocumentLike['querySelectorAll'],
    }
    const { session, conversation } = fakeModernSession([], 1)
    ;(conversation as ConversationTargetsLike & { target(name: string): unknown }).target = (name: string) => (
      name === 'trajectory' ? { getSnapshot: () => trajectoryView() } : undefined
    )
    const outcome = await jumpToItem(session, { seq: 10, kind: 'user' }, { document, conversation })
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
