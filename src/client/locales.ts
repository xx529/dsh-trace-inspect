/**
 * locales.ts — zh/en dictionaries for the trail panel, following the
 * browser language (matching conversation-outline's i18n approach).
 */

export type Lang = 'zh' | 'en'

export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const raw = navigator.language ?? ''
  return raw.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export interface Dict {
  tabTitle: string
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
}

const zh: Dict = {
  tabTitle: '轮次轨迹',
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
}

const en: Dict = {
  tabTitle: 'Turn Outline',
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
}

const dicts: Record<Lang, Dict> = { zh, en }

export function t(lang: Lang, key: keyof Dict): string | number | ((...args: never[]) => unknown) {
  return dicts[lang][key]
}
