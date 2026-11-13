/**
 * tool-icon.tsx — tiny inline glyphs for the folded tool rows.
 *
 * All icons are hand-drawn stroke paths on a 24 grid (Lucide-derived geometry),
 * rendered at 13px with `stroke="currentColor"`. v0.10.19 gives **every DSH
 * work cluster its own glyph** (25 families, one per kind of work); the color
 * comes from the wrapper's `.ttl-ink-*` class, not from the glyph. Tools that
 * are neither DSH built-ins nor MCP (`figma_*` plugin tools, third-party and
 * unknown names) all share the wrench `generic` glyph.
 *
 * v0.10.46 adds two *filled* brand marks (Claude / OpenAI) for the provider
 * subagents: they are solid official logos on the same 24 grid, still inked by
 * the wrapper, so the row layout and chip geometry stay untouched.
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

/**
 * Filled mark (v0.10.46): the two subagent provider logos are solid brand
 * shapes, not stroke geometry — filling with `currentColor` keeps the ink
 * coming from the wrapper's `.ttl-ink-*` class like every other glyph.
 */
function filled(d: string): Prim {
  return React.createElement('path', { d, fill: 'currentColor', stroke: 'none' })
}

/**
 * Claude starburst — the official Claude mark, 24 grid (simple-icons CC0).
 * Rendered solid so the 13px row glyph reads as the brand, not a sparkle.
 */
const CLAUDE_MARK =
  'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z'

/**
 * OpenAI blossom — the official OpenAI mark, 24 grid (simple-icons CC0).
 * OpenAI publishes no standalone Codex mark (openai/codex ships none), so
 * Codex is identified by the OpenAI mark, as in every other agent UI.
 */
const OPENAI_MARK =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z'

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
    // v0.10.46: the provider-specific subagents show their own official mark
    // instead of the robot, so a row says *which* agent family ran.
    case 'claude':
      return filled(CLAUDE_MARK)
    case 'codex':
      return filled(OPENAI_MARK)
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
