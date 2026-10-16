/**
 * markdown-result.tsx — decides HOW a tool result is shown: rendered Markdown
 * for prose-shaped output (read/web_fetch/glob/grep …), literal text for
 * machine output (bash/pwsh logs, ANSI colour, stack traces).
 *
 * Security: untrusted tool output is never handed to `innerHTML` /
 * `dangerouslySetInnerHTML` / `eval`. Markdown goes exclusively through the
 * host's `MarkdownText` (which disables raw HTML and unsafe protocols), and
 * everything else through `<RawText>` (React children, whitespace preserved).
 * When the host renderer is missing, `loadPrimitives()` returns null and this
 * component degrades to raw text plus an explanatory hint.
 */
import * as React from 'react'
import { detectLang, t } from './locales'
import { loadPrimitives, type MarkdownLabels } from './ui-primitives'

/** Default render cap: 64 KiB of Markdown before the "show all" affordance. */
export const RENDER_CAP = 64 * 1024

/** Tools whose output is prose/markdown shaped → rendered by default. */
const RENDERED_TOOLS = new Set(['read', 'web_fetch', 'fetch', 'glob', 'grep'])
/** Tools whose output is machine text → raw by default (listed for clarity). */
const RAW_TOOLS = new Set(['bash', 'bash_output', 'pwsh'])

const ANSI_KILL_LIMIT = 3

/** Structural Markdown signals (契约 §5). */
const MD_SIGNALS: RegExp[] = [
  /^#{1,6} /m,                       // ATX heading
  /^```/m,                           // fenced code
  /^(?=[^\n]*\|)[\s|:-]*-{3,}[\s|:-]*$/m, // table separator (|---| / | --- |)
  /^[-*+] /m,                        // bullet list
  /^\d+\. /m,                        // ordered list
  /^>/m,                             // blockquote
  /\*\*[^\n*]+\*\*/,                 // bold
  /`[^`\n]+`/,                       // inline code
]

/**
 * Does this output read as Markdown rather than as machine text? (契约 §5)
 * True only with a structural signal, fewer than 3 ANSI escapes, and a first
 * line that is not an error stack.
 * @param text - Candidate output.
 * @returns Whether the rendered view should be preferred.
 */
export function looksLikeMarkdown(text: string): boolean {
  if (typeof text !== 'string' || text.length === 0) return false
  if (!MD_SIGNALS.some((signal) => signal.test(text))) return false
  if (countOccurrences(text, '\u001b[') >= ANSI_KILL_LIMIT) return false
  const firstLine = (text.split('\n', 1)[0] ?? '').trimStart()
  if (firstLine.startsWith('Error:') || firstLine.startsWith('Traceback')) return false
  if (/^at\s/.test(firstLine)) return false
  return true
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0
  let at = haystack.indexOf(needle)
  while (at !== -1) {
    count += 1
    at = haystack.indexOf(needle, at + needle.length)
  }
  return count
}

/**
 * Seed view for a tool: `rendered` for prose-producing tools, `raw` for
 * shell output and every unknown tool (契约 §4.3).
 * @param name - Tool name as recorded on `tool/call`.
 * @returns The initial view.
 */
export function defaultViewForTool(name: string): 'rendered' | 'raw' {
  const normalized = typeof name === 'string' ? name.trim().toLowerCase() : ''
  if (RENDERED_TOOLS.has(normalized)) return 'rendered'
  if (RAW_TOOLS.has(normalized)) return 'raw'
  return 'raw'
}

/**
 * Literal text block: whitespace preserved, no interpretation at all.
 * @param props - Text plus an optional extra class.
 * @returns A `<pre>` element.
 */
export function RawText(props: { text: string; className?: string }): React.ReactElement {
  const { text, className } = props
  const merged = className === undefined || className === '' ? 'ttl-raw' : `ttl-raw ${className}`
  return <pre className={merged} data-testid="ttl-md-raw">{text}</pre>
}

/** Props of {@link MarkdownResult}. */
export interface MarkdownResultProps {
  text: string
  labels: MarkdownLabels
  openFile?: (path: string, line?: number) => void
  renderCap?: number
}

/**
 * Render one settled tool result: Markdown through the host renderer when the
 * output looks like Markdown, raw text otherwise.
 * @param props - Output text, labels, file opener and the render cap.
 * @returns The rendered result, or a raw-text fallback.
 */
export function MarkdownResult(props: MarkdownResultProps): React.ReactElement {
  const { text, labels, openFile, renderCap = RENDER_CAP } = props
  const lang = detectLang()
  const [showAll, setShowAll] = React.useState(false)

  // The provider's `openFile` takes an options bag while our callers pass a
  // line number; keep one stable identity so MarkdownText's cache survives.
  const delegateOpenFile = React.useMemo(
    () => (openFile === undefined
      ? undefined
      : (path: string, options?: { line?: number }): void => openFile(path, options?.line)),
    [openFile],
  )

  const primitives = loadPrimitives()
  const markdown = looksLikeMarkdown(text)

  if (primitives === null) {
    return (
      <>
        <RawText text={text} />
        {markdown
          ? (
            <div className="ttl-detailHint" data-testid="ttl-md-fallback">
              {t(lang, 'markdownFallback') as string}
            </div>
          )
          : null}
      </>
    )
  }
  if (!markdown) return <RawText text={text} />

  const capped = !showAll && renderCap > 0 && text.length > renderCap
  const shown = capped ? text.slice(0, renderCap) : text
  const { MarkdownText, MarkdownDelegateProvider } = primitives

  return (
    <MarkdownDelegateProvider openFile={delegateOpenFile}>
      <div className="ttl-mdTableWrap">
        <div className="ttl-md" data-testid="ttl-md">
          <MarkdownText text={shown} streaming={false} labels={labels} variant="compact" />
        </div>
      </div>
      {capped
        ? (
          <div className="ttl-mdTruncated" data-testid="ttl-md-truncated">
            <button type="button" className="ttl-mdShowAll" onClick={() => setShowAll(true)}>
              {(t(lang, 'showAllLines') as (arg: string) => string)(String(text.length))}
            </button>
          </div>
        )
        : null}
    </MarkdownDelegateProvider>
  )
}
