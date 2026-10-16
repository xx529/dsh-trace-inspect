/**
 * markdown-labels.ts — reference-stable `MarkdownLabels` per locale.
 *
 * `MarkdownText` uses the labels object identity as its streaming cache key
 * (a fresh object discards the parse cache mid-message), so the same lang must
 * always return the SAME object: one instance per language, built once.
 */
import { t, type Lang } from './locales'
import type { MarkdownLabels } from './ui-primitives'

const cache = new Map<Lang, MarkdownLabels>()

/**
 * Localized Markdown chrome for one language.
 * @param lang - Active UI language.
 * @returns The cached labels object (same identity for the same lang).
 */
export function markdownLabels(lang: Lang): MarkdownLabels {
  const hit = cache.get(lang)
  if (hit !== undefined) return hit
  const created: MarkdownLabels = {
    code: {
      copyLabel: t(lang, 'copyField') as string,
      copiedLabel: t(lang, 'copiedDone') as string,
      toolbarLabels: {
        codeLabel: t(lang, 'codeLabel') as string,
        wrapLabel: t(lang, 'wrapLabel') as string,
        unwrapLabel: t(lang, 'unwrapLabel') as string,
      },
    },
    footnotes: t(lang, 'footnotes') as string,
  }
  cache.set(lang, created)
  return created
}
