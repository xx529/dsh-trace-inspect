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
 *
 * A DSH `read` result arrives inside an XML envelope with line-numbered lines;
 * `unwrapFileResult` strips both before the Markdown decision (契约 §11.3).
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

/** File extensions whose `read` envelope is unwrapped and rendered (契约 §11.3). */
const MARKDOWN_FILE_EXT = /\.(?:md|markdown|mdx)$/i

/** Line-number prefix the `read` tool puts in front of every reported line. */
const LINE_NUMBER_PREFIX = /^\d+: ?/

/**
 * The `read` tool's own trailing note inside `<content>` — tool chrome, never
 * file content. Both real forms are covered:
 * `(End of file - total 24 lines)` and
 * `(Showing lines 1-4 of 576. Use offset=5 to continue.)`.
 * Verified against a live read result in the desktop runtime.
 */
const READ_FOOTER = /^\((?:End of file[^)]*|Showing lines \d+-\d+ of \d+[^)]*)\)$/

/**
 * The DSH `read` result envelope, byte-for-byte the shape the host's own read
 * card validates (verified in the shipped shell):
 * `<path>…</path>\n<type>…</type>\n<content>\n…\n</content>`.
 */
const READ_ENVELOPE =
  /^<path>([^\n]*)<\/path>\n<type>([^\n]*)<\/type>\n<content>\n([\s\S]*)\n<\/content>$/

/** A parsed `read` envelope; {@link UnwrappedFileResult.body} carries no line numbers. */
export interface UnwrappedFileResult {
  path: string
  type: string
  body: string
}

/**
 * Unwrap the DSH `read` result envelope (契约 §11.3 F8).
 *
 * `read` answers with an XML envelope whose `<content>` holds every line
 * prefixed by its line number. Handing that whole envelope to a Markdown
 * renderer is worse than useless: MarkdownText disables raw HTML, so the tags
 * become one escaped paragraph, and the prefixes stop table separator rows and
 * code fences from being recognised. Callers therefore render the unwrapped
 * `body`.
 * @param text - Raw tool result.
 * @returns The path/type/body, or `null` when `text` is not that envelope.
 */
export function unwrapFileResult(text: string): UnwrappedFileResult | null {
  if (typeof text !== 'string' || text.length === 0) return null
  const match = READ_ENVELOPE.exec(text.replace(/\r\n?/g, '\n').trim())
  if (match === null) return null
  return {
    path: (match[1] ?? '').trim(),
    type: (match[2] ?? '').trim(),
    body: stripLineNumbers(match[3] ?? ''),
  }
}

/**
 * Drop the `read` line-number prefix (`1: …`) from every line of a body, plus
 * the tool's own trailing note when it is the last non-blank line — that note
 * is chrome (`(End of file - total N lines)` / `(Showing lines A-B of N. …)`),
 * and rendering it would append a stray paragraph to the document.
 */
function stripLineNumbers(body: string): string {
  const lines = body.split('\n').map((line) => line.replace(LINE_NUMBER_PREFIX, ''))
  let lastNonBlank = -1
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].trim() !== '') {
      lastNonBlank = i
      break
    }
  }
  if (lastNonBlank >= 0 && READ_FOOTER.test(lines[lastNonBlank].trim())) lines.splice(lastNonBlank, 1)
  return lines.join('\n')
}

/** Is this envelope the file payload of a Markdown document? (契约 §11.3) */
function isMarkdownFileEnvelope(envelope: UnwrappedFileResult): boolean {
  return envelope.type.toLowerCase() === 'file' && MARKDOWN_FILE_EXT.test(envelope.path)
}

/**
 * Resolve what the Markdown path should read, and whether it applies at all.
 *
 * - not an envelope → the text itself, judged by the structural rules (§5);
 * - `type=file` + `.md`/`.markdown`/`.mdx` → the unwrapped body (契约 §11.3);
 * - any other `read` payload (`.ts`/`.json` logs, image envelopes) → never
 *   Markdown, so it keeps the literal monospace view: "when in doubt, show the
 *   original" (契约 §11.3).
 *
 * `unwrappedBody` is the line-number/footer-free file body whenever the payload
 * was a `.md` envelope. The literal fallback uses it too, so a Markdown file
 * that happens to contain no Markdown signals still shows its *content* rather
 * than the `<path>`/`<content>` chrome around it (契约 §11.4#5).
 * @param text - Raw tool result.
 * @returns The verdict, the text to render when it is true, and the unwrapped body if any.
 */
function markdownInputFor(text: string): { markdown: boolean; source: string; unwrappedBody: string | null } {
  const envelope = unwrapFileResult(text)
  if (envelope === null) return { markdown: looksLikeMarkdownText(text), source: text, unwrappedBody: null }
  if (isMarkdownFileEnvelope(envelope)) {
    return { markdown: looksLikeMarkdownText(envelope.body), source: envelope.body, unwrappedBody: envelope.body }
  }
  return { markdown: false, source: text, unwrappedBody: null }
}

/**
 * Does this output read as Markdown rather than as machine text? (契约 §5)
 * A DSH `read` envelope is unwrapped first, so the decision is made on the file
 * body rather than on `<path>` tags and line numbers (契约 §11.3).
 * @param text - Candidate output.
 * @returns Whether the rendered view should be preferred.
 */
export function looksLikeMarkdown(text: string): boolean {
  return markdownInputFor(text).markdown
}

/**
 * Structural Markdown test on text that is already unwrapped (§5): true only
 * with a structural signal, fewer than 3 ANSI escapes, and a first line that is
 * not an error stack.
 * @param text - Candidate output.
 * @returns Whether the rendered view should be preferred.
 */
function looksLikeMarkdownText(text: string): boolean {
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
 * output looks like Markdown, raw text otherwise. A `read` envelope for a
 * `.md`/`.markdown`/`.mdx` file is rendered as its unwrapped body (契约 §11.3).
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
  // `source` is the Markdown input: the unwrapped `.md` file body for a `read`
  // envelope, otherwise the result text itself (契约 §11.3). The literal
  // fallbacks below keep showing the untouched original.
  const { markdown, source, unwrappedBody } = markdownInputFor(text)

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
  // No Markdown to render: show the file *body* for a `.md` envelope (chrome
  // stripped), and the untouched original for everything else (契约 §11.4#1/#5).
  if (!markdown) return <RawText text={unwrappedBody ?? text} />

  const capped = !showAll && renderCap > 0 && source.length > renderCap
  const shown = capped ? source.slice(0, renderCap) : source
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
              {(t(lang, 'showAllLines') as (arg: string) => string)(String(source.length))}
            </button>
          </div>
        )
        : null}
    </MarkdownDelegateProvider>
  )
}
