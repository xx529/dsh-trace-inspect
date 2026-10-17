/**
 * tool-icon.tsx — tiny inline glyphs for the folded tool rows.
 *
 * All icons are hand-drawn stroke paths on a 24 grid (Lucide-derived geometry),
 * rendered at 13px with `stroke="currentColor"` so the existing semantic color
 * classes (`ttl-icon-success|warn|neutral`) drive the tint — no new dependency
 * and no raw string HTML. `generic` falls back to the original 6px dot so
 * unknown tools keep the v0.3.1 look.
 */
import * as React from 'react'
import type { ToolIconKind, ToolTone } from './tool-summary'

/** One stroke path set per glyph family. */
function pathsOf(kind: ToolIconKind): React.ReactNode {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (kind) {
    case 'terminal':
      return React.createElement(React.Fragment, null,
        React.createElement('polyline', { key: 'a', points: '4 17 10 11 4 5', ...stroke }),
        React.createElement('line', { key: 'b', x1: 12, y1: 19, x2: 20, y2: 19, ...stroke }))
    case 'file-read':
      return React.createElement(React.Fragment, null,
        React.createElement('path', { key: 'a', d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', ...stroke }),
        React.createElement('polyline', { key: 'b', points: '14 2 14 8 20 8', ...stroke }),
        React.createElement('line', { key: 'c', x1: 8, y1: 13, x2: 16, y2: 13, ...stroke }),
        React.createElement('line', { key: 'd', x1: 8, y1: 17, x2: 13, y2: 17, ...stroke }))
    case 'file-write':
      return React.createElement(React.Fragment, null,
        React.createElement('path', { key: 'a', d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', ...stroke }),
        React.createElement('polyline', { key: 'b', points: '14 2 14 8 20 8', ...stroke }),
        React.createElement('line', { key: 'c', x1: 12, y1: 12, x2: 12, y2: 17, ...stroke }),
        React.createElement('polyline', { key: 'd', points: '9.5 14.5 12 17 14.5 14.5', ...stroke }))
    case 'file-edit':
      return React.createElement(React.Fragment, null,
        React.createElement('path', { key: 'a', d: 'M12 20h9', ...stroke }),
        React.createElement('path', { key: 'b', d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', ...stroke }))
    case 'search':
      return React.createElement(React.Fragment, null,
        React.createElement('circle', { key: 'a', cx: 11, cy: 11, r: 7, ...stroke }),
        React.createElement('line', { key: 'b', x1: 21, y1: 21, x2: 16.65, y2: 16.65, ...stroke }))
    case 'folder':
      return React.createElement('path', {
        d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
        ...stroke,
      })
    case 'mcp':
      return React.createElement(React.Fragment, null,
        React.createElement('line', { key: 'a', x1: 9, y1: 2, x2: 9, y2: 7, ...stroke }),
        React.createElement('line', { key: 'b', x1: 15, y1: 2, x2: 15, y2: 7, ...stroke }),
        React.createElement('path', { key: 'c', d: 'M6 7h12v5a6 6 0 0 1-12 0z', ...stroke }),
        React.createElement('line', { key: 'd', x1: 12, y1: 18, x2: 12, y2: 22, ...stroke }))
    default:
      return null
  }
}

export interface ToolIconProps {
  kind: ToolIconKind
  tone: ToolTone
}

/**
 * Row glyph: a colored stroke icon for known tools, the legacy dot otherwise.
 * @param props - Glyph family + semantic tone.
 * @returns The inline element for the row's leading slot.
 */
export function ToolIcon({ kind, tone }: ToolIconProps): React.ReactElement {
  if (kind === 'generic') {
    return React.createElement('span', { className: `ttl-rowDot ttl-dot-${tone}`, 'aria-hidden': 'true' })
  }
  return React.createElement(
    'span',
    { className: `ttl-rowIcon ttl-icon-${tone}`, 'aria-hidden': 'true' },
    React.createElement('svg', { viewBox: '0 0 24 24', width: 13, height: 13, focusable: 'false' }, pathsOf(kind)),
  )
}
