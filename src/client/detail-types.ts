/**
 * detail-types.ts — shared, dependency-free types for the v0.9 detail surface.
 *
 * Why a separate module: the inline detail band (StepDetail.tsx) and the
 * full-size overlay (ZoomOverlay.tsx) both need these unions, and TrailTab
 * needs them for jump/zoom plumbing. Keeping them here means the dependency
 * graph stays one-way: TrailTab → StepDetail → ZoomOverlay, TrailTab → ZoomOverlay.
 */

/** Tabs of the detail band / overlay (v0.10.29: 结果/参数 merged into 摘要). */
export type DetailTab = 'summary' | 'raw'
