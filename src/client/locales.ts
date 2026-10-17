/**
 * locales.ts — zh/en dictionaries for the trail panel.
 *
 * The active language follows DSH itself: the official client `locale` service
 * is the signal source (`ctx.get('locale').getLocale().active`), with
 * `html[lang]` and `navigator.language` only as fallbacks. Reading
 * `navigator.language` alone is wrong inside the Electron app: it reports the
 * Chromium default (`en-US`) while the UI itself is Chinese, which made the
 * sidebar tab read "Turn Outline" in a Chinese UI.
 */

export type Lang = 'zh' | 'en'

/** Normalize a locale id (`zh`, `zh-CN`, `en-US`, …) to a dictionary language. */
function normalizeLang(raw: string): Lang {
  return raw.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/** Language reported by the host `locale` service; `null` until wired. */
let hostLang: Lang | null = null

/**
 * Feed the host locale into the detector. Called from `apply()` when the DSH
 * `locale` service is reachable, and again on every locale change.
 * @param localeId - `LocaleSnapshot['active']` (`'zh'`, `'en'`, `'zh-CN'`, …).
 */
export function setHostLocale(localeId: string | null | undefined): void {
  hostLang = localeId === undefined || localeId === null || localeId === ''
    ? null
    : normalizeLang(localeId)
}

export function detectLang(): Lang {
  if (hostLang !== null) return hostLang
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement?.lang
    if (htmlLang) return normalizeLang(htmlLang)
  }
  if (typeof navigator !== 'undefined') return normalizeLang(navigator.language ?? '')
  return 'en'
}

export interface Dict {
  tabTitle: string
  /** One-liner shown under the tab title in better-sidebar's native guide page. */
  tabDescription: string
  turnsCount: (n: number) => string
  followLatest: string
  followPaused: string
  newUpdates: string
  filterAll: string
  filterFailed: string
  filterMore: string
  clearFilter: string
  emptyNoTurns: string
  emptyFiltered: string
  loadFailed: string
  loading: string
  retry: string
  stepsCount: (n: number) => string
  toolCalls: (n: number) => string
  input: string
  output: string
  context: string
  contextCount: (n: number) => string
  compaction: string
  /** Short compaction label for the row tag column. */
  compactionTag: string
  jumpProgress: (n: number) => string
  jumpDone: string
  jumpFailed: string
  jumpTrajectory: string
  previewExpand: string
  previewClose: string
  previewTitle: (label: string) => string
  copyTurn: string
  copied: string
  running: string
  error: string
  turnPrefix: (n: number) => string
  expandAll: string
  collapseAll: string
  locate: string
  stepsLabel: string
  filterCollapse: string
  showEarlierSteps: (n: number) => string
  // ── v0.4.0 inline detail（契约 §4.6） ──────────────────────
  detailParams: string
  detailResult: string
  detailRaw: string
  detailRender: string
  detailSource: string
  detailAria: (name: string) => string
  copyField: string
  copyDetail: string
  copiedDone: string
  expandLabel: string
  collapseLabel: string
  locateInChat: string
  fullPill: string
  truncatedPill: string
  showAllLines: (arg: string) => string
  jsonTooLarge: string
  resultEmpty: string
  resultUnparsable: string
  resultReplaced: (n: number) => string
  imageLabel: (name: string) => string
  imageMeta: (w: number, h: number, size: string) => string
  orphanResult: string
  markdownFallback: string
  loadMore: string
  // Additive to the §4.6 table: fence-toolbar chrome consumed by
  // markdown-labels.ts, so no user-visible string is hardcoded there.
  codeLabel: string
  wrapLabel: string
  unwrapLabel: string
  footnotes: string
  // ── v0.5.0（契约 §10.4.2）：缩略图 / 按需完整详情 / 放大浮层 ──
  imageLoadFailed: string
  detailLoading: string
  detailLoadFailed: string
  detailRetry: string
  detailLoadedFull: string
  mergedNoSurfaceOp: (n: number) => string
  zoomOpen: string
  /** Opens the centered viewer from a pane (v0.6.0). */
  viewInCenter: string
  /** Hint that the pane itself can be clicked to open the centered viewer. */
  clickToViewFull: string
  zoomTitle: (name: string) => string
  zoomClose: string
  zoomSearch: string
  zoomNoMatch: string
  zoomExport: string
  zoomHint: string
}

const zh: Dict = {
  tabTitle: '轮次轨迹',
  tabDescription: '按用户轮次折叠会话轨迹，一键定位回对话原位',
  turnsCount: (n) => `${n} 轮`,
  followLatest: '跟随最新',
  followPaused: '已暂停跟随',
  newUpdates: '有新更新 ↓',
  filterAll: '全部',
  filterFailed: '失败',
  filterMore: '更多',
  clearFilter: '清空筛选',
  emptyNoTurns: '会话还没有轮次',
  emptyFiltered: '没有符合筛选的步骤',
  loadFailed: '会话数据加载失败',
  loading: '正在加载会话数据…',
  retry: '重试',
  stepsCount: (n) => `${n} 步骤`,
  toolCalls: (n) => `${n} 次调用`,
  input: '输入',
  output: '输出',
  context: '上下文',
  contextCount: (n) => `${n} 条`,
  compaction: '压缩检查点',
  compactionTag: '压缩',
  jumpProgress: (n) => `正在定位更早的对话（已加载 ${n} 页）…`,
  jumpDone: '已定位',
  jumpFailed: '无法定位该消息',
  jumpTrajectory: '已在轨迹视图定位',
  previewExpand: '展开',
  previewClose: '关闭',
  previewTitle: (label) => label,
  copyTurn: '复制本轮',
  copied: '已复制',
  running: '进行中',
  error: '错误',
  turnPrefix: (n) => `轮次 ${n}`,
  expandAll: '展开全部',
  collapseAll: '全部折叠',
  locate: '定位',
  stepsLabel: '工具步骤数',
  filterCollapse: '收起',
  showEarlierSteps: (n) => `显示更早 ${n} 条`,
  detailParams: '参数',
  detailResult: '结果',
  detailRaw: '原始',
  detailRender: '渲染',
  detailSource: '原文',
  detailAria: (name) => `${name} 详情`,
  copyField: '复制',
  copyDetail: '复制全部',
  copiedDone: '已复制',
  expandLabel: '展开',
  collapseLabel: '收起',
  locateInChat: '在对话中定位',
  fullPill: '完整',
  truncatedPill: '已截断',
  showAllLines: (arg) => `展开全部（${arg}）`,
  jsonTooLarge: '对象过大，已折叠',
  resultEmpty: '该调用没有返回内容',
  resultUnparsable: '结果无法解析，已按原文显示',
  resultReplaced: (n) => `已被压缩替换（seq #${n}）`,
  imageLabel: (name) => `图片：${name}`,
  imageMeta: (w, h, size) => `${w}×${h} · ${size}`,
  orphanResult: '未匹配到调用（孤立结果）',
  markdownFallback: '未找到 Markdown 渲染器，已按原文显示',
  loadMore: '载入更多',
  codeLabel: '代码',
  wrapLabel: '自动换行',
  unwrapLabel: '不换行',
  footnotes: '脚注',
  imageLoadFailed: '图片加载失败，仅显示元数据',
  detailLoading: '载入完整内容…',
  detailLoadFailed: '完整内容加载失败，当前显示截断预览',
  detailRetry: '重试',
  detailLoadedFull: '已载入完整内容',
  mergedNoSurfaceOp: (n) => `该内容由 ${n} 条结果合并，事件未声明 surfaceOp`,
  zoomOpen: '放大查看',
  viewInCenter: '在中央查看',
  clickToViewFull: '点击查看全文',
  zoomTitle: (name) => `${name} · 步骤详情`,
  zoomClose: '关闭',
  zoomSearch: '搜索步骤',
  zoomNoMatch: '无匹配步骤',
  zoomExport: '导出 JSON',
  zoomHint: 'Esc 关闭 · ↑↓ 切步 · ⌘F 搜索',
}

const en: Dict = {
  tabTitle: 'Turn Outline',
  tabDescription: 'Fold the session into per-turn steps and jump back to any of them',
  turnsCount: (n) => `${n} turns`,
  followLatest: 'Follow latest',
  followPaused: 'Follow paused',
  newUpdates: 'New updates ↓',
  filterAll: 'All',
  filterFailed: 'Failed',
  filterMore: 'More',
  clearFilter: 'Clear filter',
  emptyNoTurns: 'No turns in this session yet',
  emptyFiltered: 'No steps match the filter',
  loadFailed: 'Failed to load session data',
  loading: 'Loading session data…',
  retry: 'Retry',
  stepsCount: (n) => `${n} steps`,
  toolCalls: (n) => `${n} calls`,
  input: 'Input',
  output: 'Output',
  context: 'Context',
  contextCount: (n) => `${n} items`,
  compaction: 'Compaction checkpoint',
  compactionTag: 'Fold',
  jumpProgress: (n) => `Locating earlier conversation (loaded ${n} page${n === 1 ? '' : 's'})…`,
  jumpDone: 'Located',
  jumpFailed: 'Could not locate that message',
  jumpTrajectory: 'Located in the trajectory view',
  previewExpand: 'Expand',
  previewClose: 'Close',
  previewTitle: (label) => label,
  copyTurn: 'Copy turn',
  copied: 'Copied',
  running: 'running',
  error: 'error',
  turnPrefix: (n) => `Turn ${n}`,
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  locate: 'Locate',
  stepsLabel: 'tool steps',
  filterCollapse: 'Collapse',
  showEarlierSteps: (n) => `Show ${n} earlier`,
  detailParams: 'Params',
  detailResult: 'Result',
  detailRaw: 'Raw',
  detailRender: 'Rendered',
  detailSource: 'Source',
  detailAria: (name) => `${name} details`,
  copyField: 'Copy',
  copyDetail: 'Copy all',
  copiedDone: 'Copied',
  expandLabel: 'Expand',
  collapseLabel: 'Collapse',
  locateInChat: 'Locate in chat',
  fullPill: 'Full',
  truncatedPill: 'Truncated',
  showAllLines: (arg) => `Show all (${arg})`,
  jsonTooLarge: 'Object too large, collapsed',
  resultEmpty: 'This call returned no content',
  resultUnparsable: 'Could not parse the result — showing raw text',
  resultReplaced: (n) => `Replaced by compaction (seq #${n})`,
  imageLabel: (name) => `Image: ${name}`,
  imageMeta: (w, h, size) => `${w}×${h} · ${size}`,
  orphanResult: 'No matching call (orphan result)',
  markdownFallback: 'Markdown renderer unavailable — showing raw text',
  loadMore: 'Load more',
  codeLabel: 'Code',
  wrapLabel: 'Wrap',
  unwrapLabel: 'No wrap',
  footnotes: 'Footnotes',
  imageLoadFailed: 'Image failed to load — metadata only',
  detailLoading: 'Loading full content…',
  detailLoadFailed: 'Failed to load full content — showing the truncated preview',
  detailRetry: 'Retry',
  detailLoadedFull: 'Full content loaded',
  mergedNoSurfaceOp: (n) => `Merged from ${n} results — the events declared no surfaceOp`,
  zoomOpen: 'Open zoomed view',
  viewInCenter: 'View centered',
  clickToViewFull: 'Click to view full text',
  zoomTitle: (name) => `${name} · step details`,
  zoomClose: 'Close',
  zoomSearch: 'Search steps',
  zoomNoMatch: 'No matching step',
  zoomExport: 'Export JSON',
  zoomHint: 'Esc close · ↑↓ step · ⌘F search',
}

const dicts: Record<Lang, Dict> = { zh, en }

export function t(lang: Lang, key: keyof Dict): string | number | ((...args: never[]) => unknown) {
  return dicts[lang][key]
}
