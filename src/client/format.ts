/**
 * format.ts — tiny display formatters shared by the shell and the detail band.
 *
 * Durations come from the wire timestamps added to `TrailStep` / `TrailTurn`
 * (`startedAt` / `endedAt`). Old logs have no timestamps, so every helper
 * returns an empty string instead of a fake number and callers simply omit
 * the slot.
 */

/** `0.4s` / `12.4s` / `1m05s` / `2m18s` / `1h04m` — '' when unknown. */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms < 0) return ''
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  const total = Math.round(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, '0')}m`
  return `${minutes}m${String(seconds).padStart(2, '0')}s`
}

/** `HH:mm` in the local timezone — '' when unknown. */
export function formatClock(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms)) return ''
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Span of one turn from its timestamps — '' when either end is unknown. */
export function turnDuration(startedAt?: number, endedAt?: number): string {
  if (startedAt === undefined || endedAt === undefined) return ''
  return formatDuration(endedAt - startedAt)
}

/** Tool family used for coloring an icon chip / row. */
export type ToolFamily = 'shell' | 'read' | 'edit' | 'mcp' | 'skill' | 'todo' | 'error' | 'generic'

/** Map a raw tool name onto the visual family used by the redesign. */
export function toolFamily(name: string, isError: boolean): ToolFamily {
  if (isError) return 'error'
  if (name.startsWith('mcp__') || name.startsWith('mcp_')) return 'mcp'
  if (name === 'bash' || name === 'bash_output' || name === 'shell' || name === 'pwsh') return 'shell'
  if (name === 'read' || name === 'read_image' || name === 'glob' || name === 'grep' || name === 'search' || name === 'ls') return 'read'
  if (name === 'write' || name === 'edit' || name === 'append') return 'edit'
  if (name === 'skill') return 'skill'
  if (name === 'todo_write' || name === 'todo_read') return 'todo'
  return 'generic'
}
