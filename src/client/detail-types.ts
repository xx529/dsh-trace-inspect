/**
 * detail-types.ts — shared, dependency-free types for the v0.9 detail surface.
 *
 * Why a separate module: the inline detail band (StepDetail.tsx) and the
 * full-size overlay (ZoomOverlay.tsx) both need these unions, and TrailTab
 * needs them for jump/zoom plumbing. Keeping them here means the dependency
 * graph stays one-way: TrailTab → StepDetail → ZoomOverlay, TrailTab → ZoomOverlay.
 */

/** How a tool result is rendered: Markdown by default, raw text on demand. */
export type ResultView = 'rendered' | 'raw'

/** Tabs of the detail band / overlay. `summary` is the redesigned default. */
export type DetailTab = 'summary' | 'result' | 'params' | 'raw'
