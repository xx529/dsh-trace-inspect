/**
 * ui-primitives.d.ts — ambient TYPES for the host-injected shared package
 * `@deepseek-ai/dsh-client-ui-primitives`.
 *
 * The package is NOT a dependency of this plugin: it is provided by the DSH
 * client at runtime (a plugin's client bundle may `require` it). This file
 * carries only the type surface this plugin consumes, so `tsc` type-checks
 * without the package installed and without touching package.json.
 *
 * Facts pinned to the installed `@deepseek-ai/dsh-client-ui-primitives@0.2.0-rc.2`
 * (see docs/detail-contract-v1.md §0/§4.1; evidence: `lib/types/markdown/*.d.ts`
 * inside the packed tarball):
 *   - `MarkdownText` ({ text, streaming?, labels, fileMentions?, pathImages?,
 *     variant }) renders untrusted Markdown as semantic React elements (raw
 *     HTML and unsafe protocols disabled; no innerHTML path).
 *   - `MarkdownDelegateProvider` ({ children, openExternalLink?, openFile?,
 *     fileImages? }) scopes file/URL navigation for settled Markdown.
 *   - `MarkdownLabels = { code: { copyLabel, copiedLabel, toolbarLabels? },
 *     footnotes }`.
 */

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ComponentType, ReactNode } from 'react'

  /** Localized language fallback and wrapping actions for a code card. */
  export interface CodeToolbarLabels {
    /** Title for an absent or unsupported language. */
    codeLabel: string
    /** Action that enables wrapping. */
    wrapLabel: string
    /** Action that preserves source columns with horizontal scrolling. */
    unwrapLabel: string
  }

  /** Copy-button labels forwarded to fenced code blocks. */
  export interface MarkdownCodeLabels {
    /** Copy-button idle label. */
    copyLabel: string
    /** Copy-button label during the post-copy confirmation window. */
    copiedLabel: string
    /** Shared card controls; omitted for custom toolbar layouts. */
    toolbarLabels?: CodeToolbarLabels | undefined
  }

  /** Localized chrome for a Markdown document. */
  export interface MarkdownLabels {
    code: MarkdownCodeLabels
    footnotes: string
  }

  /** Props of {@link MarkdownText}. */
  export interface MarkdownTextProps {
    /** Markdown source (untrusted). */
    text: string
    /** Parse incrementally while a message streams. */
    streaming?: boolean | undefined
    /** Localized fence/footnote chrome; pass a reference-stable object. */
    labels: MarkdownLabels
    /** `compact` = secondary text sizing and tight spacing. */
    variant?: 'body' | 'compact' | undefined
  }

  /** Props of {@link MarkdownDelegateProvider}. */
  export interface MarkdownDelegateProviderProps {
    readonly children?: ReactNode
    /**
     * Open a decoded local destination from settled Markdown.
     * @param path - Absolute or workspace-relative file path.
     * @param options - First line to reveal when the destination specifies one.
     */
    openFile?: ((path: string, options?: { line?: number }) => void) | undefined
  }

  /** Untrusted assistant-Markdown renderer (semantic React elements only). */
  export const MarkdownText: ComponentType<MarkdownTextProps>

  /** Scopes Markdown navigation without threading callbacks through renderers. */
  export const MarkdownDelegateProvider: ComponentType<MarkdownDelegateProviderProps>
}
