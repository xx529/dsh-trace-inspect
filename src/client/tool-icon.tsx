/**
 * tool-icon.tsx — tiny inline glyphs for the folded tool rows.
 *
 * All icons are hand-drawn stroke paths on a 24 grid (Lucide-derived geometry),
 * rendered at 13px with `stroke="currentColor"`. v0.10.19 gives **every DSH
 * work cluster its own glyph** (25 families, one per kind of work); the color
 * comes from the wrapper's `.ttl-ink-*` class, not from the glyph. Tools that
 * are neither DSH built-ins nor MCP (`figma_*` plugin tools, third-party and
 * unknown names) all share the wrench `generic` glyph.
 */
import * as React from 'react'
import type { ToolIconKind } from './tool-summary'

/** Shared stroke language of every glyph (24 grid, 1.7px, round joins). */
const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

type Prim = React.ReactElement

function path(d: string): Prim {
  return React.createElement('path', { d, ...STROKE })
}

function line(x1: number, y1: number, x2: number, y2: number): Prim {
  return React.createElement('line', { x1, y1, x2, y2, ...STROKE })
}

function polyline(points: string): Prim {
  return React.createElement('polyline', { points, ...STROKE })
}

function circle(cx: number, cy: number, r: number): Prim {
  return React.createElement('circle', { cx, cy, r, ...STROKE })
}

function rect(x: number, y: number, width: number, height: number, rx = 2): Prim {
  return React.createElement('rect', { x, y, width, height, rx, ...STROKE })
}

/** One primitive list per glyph family. */
function pathsOf(kind: ToolIconKind): React.ReactNode {
  switch (kind) {
    // ── A · 执行 ──────────────────────────────────────────────────────────
    case 'terminal':
      return React.createElement(React.Fragment, null,
        polyline('4 17 10 11 4 5'),
        line(12, 19, 20, 19))
    case 'terminal-session':
      // Square terminal: the session is a shell you come back to.
      return React.createElement(React.Fragment, null,
        path('m7 11 2-2-2-2'),
        path('M11 13h4'),
        rect(3, 3, 18, 18))
    case 'jobs':
      // Stacked layers: finished work waiting to be collected.
      return React.createElement(React.Fragment, null,
        path('m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z'),
        path('m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65'),
        path('m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'))
    case 'code':
      // Angle brackets: running code / language service.
      return React.createElement(React.Fragment, null,
        polyline('16 18 22 12 16 6'),
        polyline('8 6 2 12 8 18'))
    // ── B · 文件与信息 ────────────────────────────────────────────────────
    case 'file-read':
      return React.createElement(React.Fragment, null,
        path('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polyline('14 2 14 8 20 8'),
        line(8, 13, 16, 13),
        line(8, 17, 13, 17))
    case 'file-write':
      return React.createElement(React.Fragment, null,
        path('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polyline('14 2 14 8 20 8'),
        line(12, 12, 12, 17),
        polyline('9.5 14.5 12 17 14.5 14.5'))
    case 'file-edit':
      return React.createElement(React.Fragment, null,
        path('M12 20h9'),
        path('M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'))
    case 'search':
      return React.createElement(React.Fragment, null,
        circle(11, 11, 7),
        line(21, 21, 16.65, 16.65))
    case 'web':
      // Globe: the call leaves the machine.
      return React.createElement(React.Fragment, null,
        circle(12, 12, 10),
        path('M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'),
        path('M2 12h20'))
    // ── C · 计划与调度 ────────────────────────────────────────────────────
    case 'todo':
      return React.createElement(React.Fragment, null,
        path('m3 17 2 2 4-4'),
        path('m3 7 2 2 4-4'),
        path('M13 6h8'),
        path('M13 12h8'),
        path('M13 18h8'))
    case 'goal':
      // Target: a long-running objective with a definition of done.
      return React.createElement(React.Fragment, null,
        circle(12, 12, 10),
        circle(12, 12, 6),
        circle(12, 12, 2))
    case 'schedule':
      // Calendar + clock: the call runs later, on recurrence.
      return React.createElement(React.Fragment, null,
        path('M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5'),
        path('M16 2v4'),
        path('M8 2v4'),
        path('M3 10h5'),
        path('M17.5 17.5 16 16.3V14'),
        circle(16, 16, 6))
    // ── D · 交互与交付 ────────────────────────────────────────────────────
    case 'ask':
      // Speech bubble + question mark: the call waits on the human.
      return React.createElement(React.Fragment, null,
        path('M7.9 20A9 9 0 1 0 4 16.1L2 22Z'),
        path('M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'),
        path('M12 17h.01'))
    case 'present':
      // Presentation screen: the call hands files to the user.
      return React.createElement(React.Fragment, null,
        path('M2 3h20'),
        path('M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3'),
        path('m7 21 5-5 5 5'))
    // ── E · 协作与编排 ────────────────────────────────────────────────────
    case 'subagent':
      // Robot head: one delegated child agent.
      return React.createElement(React.Fragment, null,
        path('M12 8V4H8'),
        rect(4, 8, 16, 12),
        path('M2 14h2'),
        path('M20 14h2'),
        path('M15 13v2'),
        path('M9 13v2'))
    case 'team':
      // Two people: teammate coordination.
      return React.createElement(React.Fragment, null,
        path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'),
        circle(9, 7, 4),
        path('M22 21v-2a4 4 0 0 0-3-3.87'),
        path('M16 3.13a4 4 0 0 1 0 7.75'))
    case 'team-task':
      // Kanban board: the shared task board.
      return React.createElement(React.Fragment, null,
        rect(3, 3, 18, 18),
        path('M8 7v7'),
        path('M12 7v4'),
        path('M16 7v9'))
    case 'workflow':
      // Piped boxes: orchestration / loops.
      return React.createElement(React.Fragment, null,
        rect(3, 3, 8, 8),
        path('M7 11v4a2 2 0 0 0 2 2h4'),
        rect(13, 13, 8, 8))
    // ── F · 上下文与扩展 ──────────────────────────────────────────────────
    case 'skill':
      // Open book: loading a skill = opening its instructions (v0.10.14).
      return React.createElement(React.Fragment, null,
        path('M12 7v14'),
        path('M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'))
    case 'session':
      // Clock + rewind arrow: reading back through the event log.
      return React.createElement(React.Fragment, null,
        path('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'),
        path('M3 3v5h5'),
        path('M12 7v5l4 2'))
    case 'folder':
      return React.createElement(React.Fragment, null,
        path('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'))
    case 'plugin':
      // Puzzle piece: the runtime plugin surface.
      return React.createElement(React.Fragment, null,
        path('M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z'))
    // ── 协议 / 状态 ───────────────────────────────────────────────────────
    case 'mcp':
      return React.createElement(React.Fragment, null,
        line(9, 2, 9, 7),
        line(15, 2, 15, 7),
        path('M6 7h12v5a6 6 0 0 1-12 0z'),
        line(12, 18, 12, 22))
    case 'alert':
      return React.createElement(React.Fragment, null,
        path('M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'),
        line(12, 9, 12, 13),
        line(12, 17, 12.01, 17))
    case 'generic':
      // Non-built-in, non-MCP tool: a wrench reads as "some tool" without
      // implying terminal/file/search/agent semantics.
      return React.createElement(React.Fragment, null,
        path('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z'))
    default:
      return null
  }
}

export interface ToolIconProps {
  kind: ToolIconKind
}

/**
 * Row glyph: a structural icon whose ink comes from the wrapper's `.ttl-ink-*`.
 * @param props - Glyph family.
 * @returns The inline element for the row's leading slot.
 */
export function ToolIcon({ kind }: ToolIconProps): React.ReactElement {
  return React.createElement(
    'span',
    { className: 'ttl-rowIcon', 'aria-hidden': 'true' },
    React.createElement('svg', { viewBox: '0 0 24 24', width: 13, height: 13, focusable: 'false' }, pathsOf(kind)),
  )
}
