/**
 * styles.ts — the 「轮次轨迹」stylesheet (v0.9 redesign).
 *
 * Structure: design tokens + legacy content surfaces (Markdown / JSON tree /
 * JSON pretty / image blocks / value viewer / raw text / pills / dots) first,
 * then the v0.9 shell, inline detail band and two-pane overlay. The later
 * blocks intentionally win over the legacy ones where a class name is reused
 * (`.ttl-pill` radius, dot tones), so keep the order.
 *
 * Colors only consume DSH alias tokens with the native dark value as fallback
 * (`var(--dsw-alias-bg-layer-1, #232324)`), so light skins follow the host.
 * Class names are prefixed `ttl-` and are OUR contract (never matched against
 * DSH internals).
 */
export const trailCss = `
/* ══ reused content surfaces (v0.4–v0.8) ═════════════════════════════ */
.ttl-dot-success { background: var(--dsw-alias-state-success-primary, #22c55e); }

.ttl-dot-warn { background: var(--dsw-alias-state-warn-primary, #f59e0b); }

.ttl-dot-neutral { background: var(--dsw-alias-label-tertiary, #adb2b8); }

.ttl-dot-blue {
  background: var(--dsw-alias-state-business-primary, #4176e6);
}

.ttl-dot-violet {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color, #5686fe) 60%, var(--dsw-alias-state-error-secondary, #f25a5a));
}

.ttl-dot-red {
  background: var(--dsw-alias-state-error-primary, #f25a5a);
}

.ttl-spin {
  display: inline-flex;
  color: var(--dsw-alias-state-business-primary, #4176e6);
  animation: ttl-spin 1s linear infinite;
}

@keyframes ttl-spin { to { transform: rotate(360deg); } }

/* ── Jump highlight flash (on the main conversation) ─────── */
.ttl-flash { animation: ttl-flash 1.6s ease-out; }

@keyframes ttl-flash {
  0% { box-shadow: 0 0 0 3px var(--dsw-alias-state-business-primary, #4176e6); }
  100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
}

/* Micro tag (native 2px radius — never a 999px pill). */
.ttl-pill {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 5px;
  border-radius: 2px;
  background: var(--dsw-alias-bg-module-platform, #353638);
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
}

.ttl-pillWarn {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #f59e0b) 16%, var(--dsw-alias-bg-layer-1, #232324));
  color: var(--dsw-alias-state-warn-primary, #f59e0b);
}

.ttl-pillOk {
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #22c55e) 16%, var(--dsw-alias-bg-layer-1, #232324));
  color: var(--dsw-alias-state-success-primary, #22c55e);
}

.ttl-detailHint {
  padding: 4px 0;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 11px;
  line-height: 16px;
}

/* ── JSON tree ──────────────────────────────────────────── */
.ttl-json {
  min-width: 0;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei", monospace);
  font-size: 11.5px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  overflow-wrap: anywhere;
}

.ttl-jsonRow {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding-left: 2px;
}

.ttl-jsonKey {
  flex: none;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
}

.ttl-jsonKey::after {
  content: ":";
  margin-right: 3px;
}

.ttl-jsonToggle {
  box-sizing: border-box;
  flex: none;
  width: 14px;
  height: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font: inherit;
  font-size: 9px;
  line-height: 17px;
  cursor: pointer;
}

.ttl-jsonToggle:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}

/* Child block: the 1px guide line is the only indentation cue. */
.ttl-jsonChildren {
  margin-left: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
}

.ttl-jsonPreview { color: var(--dsw-alias-label-tertiary, #adb2b8); }

.ttl-jsonStr { color: var(--dsw-alias-label-primary, #f9fafb); }

.ttl-jsonNum { color: var(--dsw-alias-state-business-primary, #4176e6); }

.ttl-jsonBool { color: var(--dsw-alias-state-warn-primary, #f59e0b); }

.ttl-jsonNull { color: var(--dsw-alias-label-tertiary, #adb2b8); }

.ttl-jsonMore {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  height: 18px;
  margin: 2px 0;
  padding: 0 6px;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font: inherit;
  font-size: 10px;
  line-height: 14px;
  cursor: pointer;
}

.ttl-jsonMore:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-secondary, #cfd3d6);
}

.ttl-jsonCapped {
  padding: 4px 2px;
  color: var(--dsw-alias-state-warn-primary, #f59e0b);
  font-size: 11px;
  line-height: 16px;
}

/* Long string: capped height with inner scrolling + a field copy action. */
.ttl-strbox {
  box-sizing: border-box;
  position: relative;
  flex: 1;
  min-width: 0;
  max-height: 52px;
  overflow: auto;
  padding: 2px 30px 2px 6px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  border-radius: 4px;
  background: var(--dsw-alias-bg-module-platform, #353638);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}

.ttl-strboxCopy {
  position: absolute;
  top: 2px;
  right: 2px;
  box-sizing: border-box;
  height: 16px;
  padding: 0 5px;
  border: none;
  border-radius: 2px;
  background: var(--dsw-alias-interactive-bg-hover-solid, #353638);
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font: inherit;
  font-size: 10px;
  line-height: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.ttl-strboxCopy:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}

/* ── Rendered Markdown / raw text ───────────────────────── */
.ttl-md {
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-primary, #f9fafb);
  overflow-wrap: anywhere;
}

/* Tables scroll horizontally; a token-colored edge fade marks the cut. */
.ttl-mdTableWrap {
  position: relative;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}

.ttl-mdTableWrap::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 18px;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(to left, var(--dsw-alias-bg-layer-1, #232324), transparent);
  transition: opacity 120ms var(--ds-ease-in-out, ease);
}

.ttl-mdTableWrap:has(.ttl-md table)::after { opacity: 1; }

.ttl-mdTruncated {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 3px 6px;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 4px;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 11px;
  line-height: 16px;
}

.ttl-mdTruncated button {
  box-sizing: border-box;
  height: 18px;
  padding: 0 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-state-business-primary, #4176e6);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}

.ttl-mdTruncated button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}

.ttl-raw {
  margin: 0;
  padding: 0;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei", monospace);
  font-size: 11.5px;
  line-height: 17px;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  tab-size: 2;
}

/* ── Image placeholder chips (no URL contract yet — 契约 §0) ── */
.ttl-imgRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 0;
}

.ttl-imgChip {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 4px;
  background: var(--dsw-alias-bg-module-platform, #353638);
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-size: 11px;
  line-height: 16px;
}

/* ── Error result block ─────────────────────────────────── */
.ttl-errorBlock {
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #f25a5a) 40%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #f25a5a) 10%, transparent);
  color: var(--dsw-alias-state-error-primary, #f25a5a);
  font-size: 11.5px;
  line-height: 17px;
}

/* ══ v0.5.0 (契约 §10.4.1) ═══════════════════════════════════════════════
 * Image thumbnails over the session-authorized attachment route, the
 * on-demand full-detail states, the merged-from note, and the P2 zoom
 * overlay. Same rules as above: colors only as var(--dsw-*) (the hex
 * after the comma is the native dark fallback, never a literal choice),
 * radii from the native --dsw-radius-* scale, code from
 * var(--ds-font-family-code). The overlay is plain position:fixed so it
 * needs no host slot: .ttl-zoom is the fixed layer, .ttl-zoomBackdrop
 * fills it, .ttl-zoomPanel is the flex column on top. */

/* ── Image thumbnail (replaces the chip once bytes are authorized) ── */
.ttl-imgThumbWrap {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  max-width: 100%;
  min-width: 0;
  padding: 2px 0;
}

.ttl-imgThumb {
  box-sizing: border-box;
  display: block;
  max-width: 100%;
  max-height: 140px;
  width: auto;
  height: auto;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: var(--dsw-radius-sm, 8px);
  background: var(--dsw-alias-bg-module-platform, #353638);
  object-fit: contain;
}

.ttl-detailRetry {
  box-sizing: border-box;
  flex: none;
  height: 20px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border: none;
  border-radius: var(--dsw-radius-xs, 4px);
  background: transparent;
  color: var(--dsw-alias-state-business-primary, #4176e6);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  cursor: pointer;
}

.ttl-detailRetry:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}

.ttl-detailRetry:disabled {
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  cursor: default;
}

/* F4: the content was merged from several results with no surfaceOp. */
.ttl-detailMerged {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 3px 8px;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: var(--dsw-radius-xs, 4px);
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 11px;
  line-height: 16px;
}

.ttl-clickablePane { cursor: zoom-in; }

.ttl-jsonPrettyWrap { position: relative; }

.ttl-jsonPretty {
  margin: 0;
  padding: 2px 0 6px;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, Menlo, monospace);
  font-size: 11.5px;
  line-height: 17px;
  white-space: pre;
  overflow: auto;
  max-height: 420px;
  color: var(--dsw-alias-label-primary, #f9fafb);
  tab-size: 2;
}

.ttl-jsonMore {
  position: sticky;
  bottom: 0;
  align-self: flex-start;
}

.ttl-outputBody .ttl-md { padding: 2px 4px; }

/* ── v0.7.0: long-value blocks (B) + centered value reader (C) ────────── */
.ttl-jpLine { display: block; min-height: 17px; }

.ttl-jsonPunct { color: var(--dsw-alias-label-tertiary, #adb2b8); }

.ttl-jpLong {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border: 1px dashed var(--dsw-alias-separator-secondary, rgba(255, 255, 255, 0.18));
  border-radius: 5px;
  max-width: 100%;
}

.ttl-jpLongMeta {
  font-size: 10.5px;
  color: var(--dsw-alias-label-secondary, #b9bdc4);
  font-family: var(--ds-font-family-code, "SF Mono", Consolas, Menlo, monospace);
}

.ttl-jpRestored {
  flex-basis: 100%;
  margin: 2px 0 2px;
  padding: 4px 6px;
  max-height: 240px;
  overflow: auto;
  border-left: 2px solid var(--dsw-alias-state-business-primary, #4176e6);
  background: var(--dsw-alias-bg-layer-2, #202024);
  font-family: var(--ds-font-family-code, "SF Mono", Consolas, Menlo, monospace);
  font-size: 11px;
  line-height: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dsw-alias-label-primary, #f9fafb);
}

.ttl-valueViewer { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; }

.ttl-valueBackdrop { position: absolute; inset: 0; background: var(--dsw-alias-bg-mask, rgba(0, 0, 0, 0.55)); }

.ttl-valuePanel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(1080px, 92vw);
  height: min(760px, 88vh);
  background: var(--dsw-alias-bg-layer-1, #17171a);
  border: 1px solid var(--dsw-alias-separator-secondary, rgba(255, 255, 255, 0.16));
  border-radius: 10px;
  box-shadow: var(--dsw-alias-shadow-elevated, 0 24px 60px rgba(0, 0, 0, 0.55));
  outline: none;
}

.ttl-valueHead {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--dsw-alias-separator-secondary, rgba(255, 255, 255, 0.12));
}

.ttl-valueTitle { display: inline-flex; align-items: baseline; gap: 8px; min-width: 0; }

.ttl-valueName {
  font-family: var(--ds-font-family-code, "SF Mono", Consolas, Menlo, monospace);
  font-size: 12px;
  color: var(--dsw-alias-label-primary, #f9fafb);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ttl-valueMeta { font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #adb2b8); }

.ttl-valueTools { display: inline-flex; align-items: center; gap: 6px; flex: none; }

.ttl-valueSearch {
  width: 180px;
  padding: 2px 6px;
  font-size: 11px;
  color: var(--dsw-alias-label-primary, #f9fafb);
  background: var(--dsw-alias-bg-layer-2, #202024);
  border: 1px solid var(--dsw-alias-separator-secondary, rgba(255, 255, 255, 0.16));
  border-radius: 5px;
  outline: none;
}

.ttl-valueHits { font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #adb2b8); }

.ttl-valueBody {
  flex: 1;
  overflow: auto;
  padding: 6px 10px 10px;
  font-family: var(--ds-font-family-code, "SF Mono", Consolas, Menlo, monospace);
  font-size: 11.5px;
  line-height: 18px;
}

.ttl-valueLine { display: flex; gap: 10px; align-items: flex-start; }

.ttl-valueLn {
  flex: none;
  width: 38px;
  text-align: right;
  color: var(--dsw-alias-label-tertiary, #6a6e75);
  user-select: none;
}

.ttl-valueCode { white-space: pre-wrap; word-break: break-word; color: var(--dsw-alias-label-primary, #f9fafb); }

.ttl-valueHit { background: var(--dsw-alias-state-warn-primary, #f59e0b); color: var(--dsw-alias-bg-layer-1, #111111); border-radius: 2px; }

.ttl-valueClipped { padding: 6px 0 0 48px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #adb2b8); }

/* ══ v0.9 shell ═════════════════════════════════════════════════════════ */

.ttl-root {
  box-sizing: border-box;
  position: relative;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-1, #232324);
  color: var(--dsw-alias-label-primary, #f3f4f6);
  font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif);
  font-size: 12px;
  line-height: 18px;
  container: trail-tab / inline-size;
}

/* ── header ─────────────────────────────────────────────── */
.ttl-header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  height: 44px;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
}
.ttl-brandIcon {
  flex: none;
  display: inline-flex;
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
}
.ttl-brandIcon svg { display: block; width: 14px; height: 14px; }
.ttl-title {
  flex: none;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--dsw-alias-label-primary, #f3f4f6);
  white-space: nowrap;
}
.ttl-count {
  flex: none;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ttl-headerSpacer { flex: 1; min-width: 0; }
.ttl-follow {
  box-sizing: border-box;
  flex: none;
  height: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  white-space: nowrap;
}
.ttl-follow:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.ttl-followDot {
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--dsw-alias-label-tertiary, #9ba1a7);
  background: transparent;
}
.ttl-follow[aria-pressed="true"] { color: var(--dsw-alias-label-primary, #f3f4f6); }
.ttl-follow[aria-pressed="true"] .ttl-followDot {
  background: var(--dsw-alias-state-success-primary, #4ed4a4);
  box-shadow: none;
}
.ttl-iconBtn {
  box-sizing: border-box;
  flex: none;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  cursor: pointer;
}
.ttl-iconBtn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); color: var(--dsw-alias-label-primary, #f3f4f6); }
.ttl-iconBtn svg { display: block; }

/* ── search ─────────────────────────────────────────────── */
.ttl-searchRow {
  box-sizing: border-box;
  flex: none;
  padding: 8px 14px 4px;
}
.ttl-search {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px 0 10px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2, #2a2a2b);
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
}
.ttl-search:focus-within { border-color: color-mix(in srgb, var(--dsw-static-blue-500, #4c8dff) 45%, transparent); }
.ttl-searchIcon { flex: none; width: 12px; height: 12px; color: var(--dsw-alias-label-quaternary, #7b8086); }
.ttl-searchInput {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f3f4f6);
  font: inherit;
  font-size: 11.5px;
  line-height: 18px;
}
.ttl-searchInput::placeholder { color: var(--dsw-alias-label-quaternary, #7b8086); }
.ttl-searchClear {
  flex: none;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
}
.ttl-kbd {
  box-sizing: border-box;
  flex: none;
  min-width: 28px;
  height: 16px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--dsw-alias-bg-module-platform, #35363a);
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9px;
  line-height: 16px;
  text-align: center;
}

/* ── filters ────────────────────────────────────────────── */
.ttl-filters {
  box-sizing: border-box;
  flex: none;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 14px;
  overflow-x: auto;
  scrollbar-width: none;
}
.ttl-filters::-webkit-scrollbar { display: none; }
.ttl-chip {
  box-sizing: border-box;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font: inherit;
  font-size: 11.5px;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
}
.ttl-chip:hover { background: rgba(255, 255, 255, 0.07); color: var(--dsw-alias-label-secondary, #cfd3d6); }
.ttl-chipSelected {
  background: var(--dsw-alias-bg-module-platform, #35363a);
  border-color: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.10));
  color: var(--dsw-alias-label-primary, #f3f4f6);
}
.ttl-chipCount {
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.ttl-chipSelected .ttl-chipCount { color: var(--dsw-alias-label-tertiary, #9ba1a7); }
.ttl-chipDot { flex: none; width: 5px; height: 5px; border-radius: 50%; }
.ttl-chipLabel { white-space: nowrap; }
.ttl-chipMore { padding: 0 7px; }
.ttl-moreChip { padding: 0 7px; }
.ttl-toolDropdown {
  position: absolute;
  top: 124px;
  right: 14px;
  z-index: 30;
  min-width: 160px;
  max-height: 260px;
  overflow: auto;
  padding: 6px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, #2a2a2b);
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.10));
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}
.ttl-toolDropdown .ttl-chip { display: flex; width: 100%; background: transparent; }
.ttl-toolDropdown .ttl-chip:hover { background: rgba(255, 255, 255, 0.06); }

/* ── session summary ────────────────────────────────────── */
.ttl-summary {
  box-sizing: border-box;
  flex: none;
  padding: 2px 14px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
}
.ttl-summaryTop {
  display: flex;
  align-items: baseline;
  gap: 8px;
  height: 18px;
  line-height: 18px;
}
.ttl-summaryStat { color: var(--dsw-alias-label-secondary, #cfd3d6); font-size: 12px; font-weight: 500; }
.ttl-summaryFail { color: var(--dsw-alias-state-error-primary, #f2726f); font-size: 10.5px; }
.ttl-summarySpacer { flex: 1; }
.ttl-summaryDur { color: var(--dsw-alias-label-quaternary, #7b8086); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.ttl-dist {
  display: flex;
  height: 4px;
  margin: 8px 0 7px;
  border-radius: 2px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}
.ttl-distSeg { display: block; height: 4px; }
.ttl-legend { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ttl-legendItem { display: inline-flex; align-items: center; gap: 5px; color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 10.5px; }
.ttl-legendDot { width: 5px; height: 5px; border-radius: 50%; }

/* ── list & turns ───────────────────────────────────────── */
.ttl-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
  padding-bottom: 8px;
}
.ttl-listFoot {
  padding: 18px 14px 6px;
  text-align: center;
  color: var(--dsw-alias-label-quaternary, #6f747a);
  font-size: 10.5px;
}
.ttl-turn {
  position: relative;
  display: block;
  padding: 8px 14px 10px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
  background: transparent;
}
.ttl-turn:first-child { border-top: none; }
.ttl-turn[data-active="true"] { background: rgba(255, 255, 255, 0.03); }
.ttl-turn[data-active="true"]::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: color-mix(in srgb, var(--dsw-static-blue-500, #4c8dff) 70%, transparent);
}
.ttl-turnHead {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 18px;
}
.ttl-turnToggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ttl-turnTag {
  box-sizing: border-box;
  flex: none;
  height: 16px;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.07);
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9.5px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}
.ttl-turn[data-active="true"] .ttl-turnTag {
  background: rgba(76, 141, 255, 0.18);
  color: var(--dsw-static-blue-300, #7cb2ff);
}
.ttl-turnTime, .ttl-turnDur {
  flex: none;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ttl-turnMeta {
  flex: none;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
}
.ttl-mix { display: inline-flex; align-items: center; gap: 7px; color: var(--dsw-alias-label-quaternary, #7b8086); }
.ttl-mixItem { display: inline-flex; align-items: center; gap: 2px; font-size: 9.5px; font-variant-numeric: tabular-nums; }
.ttl-mixItem svg { display: block; }
.ttl-mixCount { font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); }
.ttl-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 16px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 9.5px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ttl-badgeErr { background: rgba(242, 114, 111, 0.14); color: var(--dsw-alias-state-error-primary, #f2726f); }
.ttl-badgeParallel { background: rgba(167, 139, 250, 0.16); color: #c4b2ff; }
.ttl-stepsNum { flex: none; color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 10.5px; white-space: nowrap; }
.ttl-locateBtn {
  flex: none;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  cursor: pointer;
}
.ttl-locateBtn:hover { background: rgba(255, 255, 255, 0.06); color: var(--dsw-alias-label-secondary, #cfd3d6); }
.ttl-chevron {
  flex: none;
  display: inline-flex;
  width: 14px;
  height: 14px;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  transition: transform 140ms ease;
}
.ttl-chevronOpen { transform: rotate(90deg); }
.ttl-turnPreview {
  margin: 3px 0 0;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-size: 12.5px;
  line-height: 18px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.ttl-turn[data-active="true"] .ttl-turnPreview { color: #e6e8ea; }
.ttl-turnBody { padding-top: 2px; }

/* ── steps ──────────────────────────────────────────────── */
.ttl-stepWrap { position: relative; }
.ttl-step {
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 14px 0 6px;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f3f4f6);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ttl-step:hover { background: rgba(255, 255, 255, 0.04); border-radius: 4px; }
.ttl-stepRail {
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.075);
  pointer-events: none;
}
.ttl-stepIcon {
  position: relative;
  z-index: 1;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: #2c2c2f;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
}
.ttl-stepIcon svg { display: block; }
.ttl-stepName {
  flex: none;
  width: 52px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10.5px;
}
.ttl-stepDesc {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #dfe2e5;
  font-size: 12px;
}
.ttl-stepStatus { flex: none; display: inline-flex; width: 10px; height: 10px; color: var(--dsw-alias-label-quaternary, #7b8086); }
.ttl-stepDur {
  flex: none;
  width: 32px;
  text-align: right;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.ttl-stepJump {
  position: absolute;
  right: 4px;
  top: 8px;
  width: 16px;
  height: 16px;
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  cursor: pointer;
}
.ttl-step:hover .ttl-stepJump, .ttl-stepWrap[data-open="true"] .ttl-stepJump { display: inline-flex; }
.ttl-stepWrap[data-open="true"] .ttl-step { background: rgba(76, 141, 255, 0.12); border-radius: 4px 4px 0 0; }
.ttl-stepWrap[data-open="true"] .ttl-step .ttl-stepJump { color: var(--dsw-static-blue-300, #7cb2ff); }
.ttl-step[data-step-kind="error"] { background: rgba(242, 114, 111, 0.08); }
.ttl-step[data-step-kind="error"] .ttl-stepDesc,
.ttl-step[data-step-kind="error"] .ttl-stepName,
.ttl-step[data-step-kind="error"] .ttl-stepStatus,
.ttl-step[data-step-kind="error"] .ttl-stepDur { color: var(--dsw-alias-state-error-primary, #f2726f); }
.ttl-step[data-step-kind="error"] .ttl-stepIcon { background: rgba(242, 114, 111, 0.16); color: var(--dsw-alias-state-error-primary, #f2726f); }

/* tool families */
.ttl-tone-shell { color: #a78bfa; }
.ttl-tone-read { color: #60a5fa; }
.ttl-tone-edit { color: #34d399; }
.ttl-tone-mcp { color: #f08fb8; }
.ttl-tone-todo { color: #f2b45c; }
.ttl-tone-error { color: #f2726f; }
.ttl-tone-generic { color: #9ba1a7; }
.ttl-stepIcon.ttl-tone-shell { background: rgba(167, 139, 250, 0.14); }
.ttl-stepIcon.ttl-tone-read { background: rgba(96, 165, 250, 0.14); }
.ttl-stepIcon.ttl-tone-edit { background: rgba(52, 211, 153, 0.13); }
.ttl-stepIcon.ttl-tone-mcp { background: rgba(240, 143, 184, 0.14); }
.ttl-stepIcon.ttl-tone-todo { background: rgba(242, 180, 92, 0.14); }
.ttl-stepIcon.ttl-tone-error { background: rgba(242, 114, 111, 0.16); }
.ttl-stepIcon.ttl-tone-generic { background: rgba(255, 255, 255, 0.06); }
.ttl-stepIcon .ttl-rowIcon, .ttl-stepIcon svg, .ttl-detailIcon .ttl-rowIcon, .ttl-detailIcon svg { color: inherit; }

/* dots */
.ttl-dot-green { background: #4ed4a4; }
.ttl-dot-blue { background: #60a5fa; }
.ttl-dot-amber { background: #f2b45c; }
.ttl-dot-violet { background: #b39cf5; }
.ttl-dot-pink { background: #f08fb8; }
.ttl-dot-red { background: #f2726f; }
.ttl-dot-neutral { background: #9ba1a7; }

/* ── parallel group (same level, no indent) ─────────────── */
.ttl-parallel {
  position: relative;
  margin: 0;
  padding: 4px 0 2px;
  background: rgba(255, 255, 255, 0.018);
}
.ttl-parallel::before {
  content: "";
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(167, 139, 250, 0.55);
}
.ttl-parallelHead {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 22px;
  padding: 0 14px 0 30px;
}
.ttl-parallelMark { color: #c4b2ff; font-size: 10px; }
.ttl-parallelLabel { color: #c4b2ff; font-size: 10px; font-weight: 500; }
.ttl-parallelHint { color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-parallelAgg {
  margin-left: auto;
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9.5px;
}
.ttl-parallelBody { position: relative; }
.ttl-parallelBody .ttl-stepRail { display: none; }

/* ── input / output items ───────────────────────────────── */
.ttl-item {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 6px 14px 6px 30px;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f3f4f6);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ttl-item:hover { background: rgba(255, 255, 255, 0.03); }
.ttl-itemDot { flex: none; width: 6px; height: 6px; margin-top: 6px; border-radius: 50%; }
.ttl-itemLabel {
  flex: none;
  width: 26px;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-size: 10.5px;
  line-height: 18px;
}
.ttl-itemText {
  flex: 1;
  min-width: 0;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-size: 12px;
  line-height: 18px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.ttl-itemText2 { -webkit-line-clamp: 2; }
.ttl-itemTextMuted { color: var(--dsw-alias-label-tertiary, #9ba1a7); }
.ttl-itemOutput .ttl-itemText { color: var(--dsw-alias-label-secondary, #cfd3d6); }
.ttl-outputWrap { position: relative; }
.ttl-outputBody {
  padding: 0 14px 8px 64px;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}
.ttl-turnFoot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 0;
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-size: 10px;
}
.ttl-turnHeadSpacer { flex: 1; }

/* ── states ─────────────────────────────────────────────── */
.ttl-skeleton { padding: 12px 14px; }
.ttl-skeletonRow { display: flex; align-items: center; gap: 8px; height: 32px; }
.ttl-skeletonDot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, 0.10); }
.ttl-skeletonBar {
  height: 10px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.085);
  animation: ttl-pulse 1.6s ease-in-out infinite;
}
.ttl-skeletonBud { width: 110px; height: 10px; border-radius: 3px; background: rgba(255, 255, 255, 0.10); margin-bottom: 8px; }
.ttl-skeletonFoot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-size: 10.5px;
}
@keyframes ttl-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
.ttl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 20px;
  text-align: center;
}
.ttl-emptyIcon { color: var(--dsw-alias-label-quaternary, #5f6469); }
.ttl-emptyTitle { color: var(--dsw-alias-label-secondary, #cfd3d6); font-size: 12px; }
.ttl-emptyDesc { color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 10.5px; }
.ttl-emptyAction {
  margin-top: 10px;
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.10));
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.ttl-emptyAction:hover { background: rgba(255, 255, 255, 0.08); }
.ttl-emptyInline { padding: 8px 14px; color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 10.5px; }
.ttl-emptyFiltered { padding: 8px 14px; }
.ttl-emptyFilteredText { color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 10.5px; }
.ttl-clear-filter {
  margin-left: 8px;
  padding: 2px 8px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.10));
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-static-blue-300, #7cb2ff);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
}
.ttl-errorCard {
  margin: 12px 14px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(242, 114, 111, 0.06);
  border: 1px solid rgba(242, 114, 111, 0.18);
}
.ttl-errorHead { display: flex; align-items: center; gap: 8px; }
.ttl-errorIcon { color: var(--dsw-alias-state-error-primary, #f2726f); }
.ttl-errorTitle { color: #f0f1f2; font-size: 12px; font-weight: 500; }
.ttl-errorCode {
  margin-top: 6px;
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10px;
  word-break: break-all;
}
.ttl-errorActions { display: flex; gap: 8px; margin-top: 10px; }
.ttl-errorRetry {
  height: 26px;
  padding: 0 12px;
  border: 1px solid rgba(242, 114, 111, 0.3);
  border-radius: 6px;
  background: rgba(242, 114, 111, 0.14);
  color: #f6a9a7;
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}
.ttl-error-copy {
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.ttl-errorNote { margin-top: 10px; color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-status { padding: 16px 14px; color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 11px; }
.ttl-statusbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-size: 10px;
}
.ttl-statusSpacer { flex: 1; }
.ttl-statusSeq { font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); font-size: 9.5px; }
.ttl-jumpBanner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 14px 0;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(76, 141, 255, 0.10);
  color: var(--dsw-static-blue-300, #7cb2ff);
  font-size: 10.5px;
}
.ttl-toBottom {
  position: absolute;
  right: 14px;
  bottom: 44px;
  z-index: 20;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.10));
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-3, #2f3033);
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}
.ttl-showEarlier {
  width: calc(100% - 28px);
  margin: 4px 14px;
  height: 26px;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.10));
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
}

/* ══ v0.9 inline detail band ═════════════════════════════════════════════ */

.ttl-detail {
  box-sizing: border-box;
  margin: 4px 14px 10px;
  padding: 12px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, #1e1e20);
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f3f4f6);
}
.ttl-detailHead { display: flex; align-items: center; gap: 8px; height: 36px; }
.ttl-detailIcon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.06);
}
.ttl-detailIcon svg { display: block; }
.ttl-detailName {
  flex: none;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary, #f3f4f6);
}
.ttl-detailSep { flex: none; color: var(--dsw-alias-label-quaternary, #5f6469); font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); font-size: 11px; }
.ttl-detailTool {
  flex: none;
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
}
.ttl-detailDesc {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #dfe2e5;
  font-size: 12px;
}
.ttl-detailAction, .ttl-detailViewCenter, .ttl-detailViewIcon {
  flex: none;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  cursor: pointer;
}
.ttl-detailAction:hover { background: rgba(255, 255, 255, 0.06); color: var(--dsw-alias-label-primary, #f3f4f6); }
.ttl-detailStatus {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-size: 10.5px;
}
.ttl-statusDot { flex: none; width: 6px; height: 6px; border-radius: 50%; }
.ttl-statusText { flex: none; }
.ttl-detailDur, .ttl-detailSeq, .ttl-detailMeta {
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.ttl-detailMeta { margin-left: auto; font-family: inherit; font-size: 10px; }
.ttl-tabs {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  height: 30px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
}
.ttl-tab {
  position: relative;
  height: 30px;
  padding: 0 0 8px;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}
.ttl-tab:hover { color: var(--dsw-alias-label-secondary, #cfd3d6); }
.ttl-tabSelected { color: var(--dsw-alias-label-primary, #f3f4f6); font-weight: 500; }
.ttl-tabSelected::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--dsw-static-blue-500, #4c8dff);
}
.ttl-detailBody { padding-top: 6px; }
.ttl-section { display: flex; align-items: center; gap: 8px; min-height: 24px; }
.ttl-sectionHead { display: flex; align-items: center; gap: 8px; min-height: 24px; }
.ttl-sectionLabel { color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 10px; font-weight: 500; letter-spacing: 0.5px; }
.ttl-sectionHint { color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-sectionMeta { color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-sectionAction {
  margin-left: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--dsw-static-blue-300, #7cb2ff);
  font: inherit;
  font-size: 9.5px;
  cursor: pointer;
}
.ttl-sectionActionText { color: inherit; font-size: inherit; }
.ttl-cmd-copy {
  margin-left: auto;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  cursor: pointer;
}
.ttl-code {
  margin-top: 2px;
  padding: 8px 10px 6px;
  border-radius: 6px;
  background: #171719;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}
.ttl-codeLine { display: flex; align-items: flex-start; gap: 8px; }
.ttl-codeGutter {
  flex: none;
  width: 14px;
  text-align: right;
  color: #55595e;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9px;
  line-height: 17px;
}
.ttl-codeText {
  flex: 1;
  min-width: 0;
  color: #d7dade;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 11px;
  line-height: 17px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ttl-code-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-size: 9.5px;
}
.ttl-codeFoot { color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-codeTool { color: var(--dsw-alias-label-quaternary, #5f6469); font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); font-size: 9.5px; }
.ttl-tok-cmd { color: #7cb2ff; }
.ttl-tok-sub { color: #e6e8ea; }
.ttl-tok-flag { color: #f2b45c; }
.ttl-tok-str { color: #a9e6b9; }
.ttl-tok-path { color: #63c9d1; }
.ttl-tok-hash { color: #c4b2ff; }
.ttl-tok-op { color: #6f747a; }
.ttl-tok-muted { color: #9ba1a7; }
.ttl-kv { display: flex; flex-direction: column; }
.ttl-kvRow { display: flex; align-items: center; gap: 8px; min-height: 24px; }
.ttl-kvKey {
  flex: none;
  width: 112px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9.5px;
}
.ttl-kvVal {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #d7dade;
  font-size: 11.5px;
}
.ttl-kvLong { white-space: normal; word-break: break-all; }
.ttl-kvMuted { color: var(--dsw-alias-label-quaternary, #5f6469); }
.ttl-kvType {
  flex: none;
  margin-left: auto;
  width: 56px;
  text-align: right;
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 8.5px;
}
.ttl-kvChips { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; flex: 1; min-width: 0; }
.ttl-chipTag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.07);
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9px;
  white-space: nowrap;
}
.ttl-chipMore { color: var(--dsw-alias-label-quaternary, #5f6469); }
.ttl-outBlock {
  margin-top: 2px;
  padding: 7px 10px;
  border-radius: 6px;
  background: #171719;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #d7dade;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10.5px;
  line-height: 16px;
  overflow: hidden;
}
.ttl-outBlockError { background: rgba(242, 114, 111, 0.06); border-color: rgba(242, 114, 111, 0.16); color: #f0a7a5; }
.ttl-outLine { display: block; white-space: pre-wrap; overflow-wrap: anywhere; }
.ttl-out-toggle {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--dsw-static-blue-300, #7cb2ff);
  font: inherit;
  font-size: 9.5px;
  cursor: pointer;
}
.ttl-mcpBlock { display: flex; align-items: center; gap: 8px; min-height: 22px; }
.ttl-mcpBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 16px;
  border-radius: 3px;
  background: rgba(240, 143, 184, 0.14);
  color: #f3b4cc;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 8.5px;
}
.ttl-mcpDot { width: 5px; height: 5px; border-radius: 50%; background: #4ed4a4; }
.ttl-mcpState { color: var(--dsw-alias-label-quaternary, #7b8086); font-size: 10px; }
.ttl-files { display: flex; flex-direction: column; }
.ttl-fileRow { display: flex; align-items: center; gap: 8px; height: 22px; }
.ttl-fileIcon { flex: none; display: inline-flex; color: var(--dsw-alias-label-quaternary, #7b8086); }
.ttl-fileName {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10.5px;
}
.ttl-fileSize { flex: none; color: var(--dsw-alias-label-quaternary, #5f6469); font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); font-size: 9.5px; }
.ttl-fileMore { padding-left: 24px; color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-fileBlock {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  padding: 4px 0;
  flex-wrap: wrap;
}
.ttl-filePath {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #d7dade;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 11px;
}
.ttl-fileStats { display: inline-flex; align-items: center; gap: 4px; }
.ttl-fileChip {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9px;
}
.ttl-resultBar { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.ttl-resultLabel { color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 10px; font-weight: 500; letter-spacing: 0.5px; }
.ttl-resultMeta { color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding: 2px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}
.ttl-segBtn {
  height: 18px;
  padding: 0 8px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font: inherit;
  font-size: 9.5px;
  cursor: pointer;
}
.ttl-segSelected { background: var(--dsw-alias-bg-module-platform, #35363a); color: var(--dsw-alias-label-primary, #f3f4f6); }
.ttl-resultCopy {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  cursor: pointer;
}
.ttl-bannerWarn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(242, 180, 92, 0.09);
  border: 1px solid rgba(242, 180, 92, 0.22);
}
.ttl-bannerIcon { flex: none; color: #f2b45c; margin-top: 1px; }
.ttl-bannerText { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ttl-bannerTitle { color: #f2c98d; font-size: 11px; font-weight: 500; }
.ttl-bannerSub { color: #b99a6b; font-size: 9.5px; }
.ttl-bannerAction {
  flex: none;
  margin-left: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: #f2b45c;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.ttl-detailFoot {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
}
.ttl-detailFoot .ttl-pill { flex: none; }
.ttl-detail-foot-seq { color: var(--dsw-alias-label-quaternary, #5f6469); font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); font-size: 9.5px; }
.ttl-detailFoot .ttl-detailViewCenter {
  margin-left: auto;
  width: auto;
  padding: 0 0 0 6px;
  color: var(--dsw-static-blue-300, #7cb2ff);
  font-size: 10px;
}
.ttl-rawSection { margin-top: 6px; }
.ttl-rawSection + .ttl-rawSection { margin-top: 12px; }
.ttl-pill {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 9.5px;
  line-height: 18px;
  white-space: nowrap;
}
.ttl-pillOk { background: rgba(78, 212, 164, 0.14); color: #8fdcb8; }
.ttl-pillWarn { background: rgba(242, 180, 92, 0.16); color: #f2c98d; }
.ttl-pillErr { background: rgba(242, 114, 111, 0.16); color: #f6a9a7; }

/* ══ v0.9 zoom overlay ═══════════════════════════════════════════════════ */

.ttl-zoom {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.ttl-zoomBackdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.62); }
.ttl-zoomPanel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 1120px;
  max-width: calc(100vw - 48px);
  height: 660px;
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1, #232324);
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
  outline: none;
}
.ttl-zoomTop {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
  background: rgba(255, 255, 255, 0.02);
}
.ttl-zoom .ttl-brandIcon { width: 16px; height: 16px; }
.ttl-zoomCrumb { display: flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-quaternary, #7b8086); font-size: 11.5px; white-space: nowrap; }
.ttl-zoomCrumb b { color: var(--dsw-alias-label-secondary, #cfd3d6); font-weight: 500; }
.ttl-zoomCrumbSep { color: var(--dsw-alias-label-quaternary, #5f6469); }
.ttl-zoomStatus { height: 22px; padding: 0 10px; }
.ttl-zoomTop .ttl-search { margin-left: auto; width: 420px; flex: none; height: 28px; }
.ttl-zoomTools { display: flex; align-items: center; gap: 4px; }
.ttl-zoomTools .ttl-iconBtn { width: 28px; height: 28px; }
.ttl-zoomBody { flex: 1; min-height: 0; display: flex; }
.ttl-zoomOutline {
  flex: none;
  width: 256px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  overflow-y: auto;
  background: var(--dsw-alias-bg-layer-1, #1f1f21);
  border-right: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
  scrollbar-width: thin;
}
.ttl-zoomOutlineHead { display: flex; align-items: baseline; gap: 6px; padding: 4px 8px 8px; }
.ttl-zoomOutlineLabel { color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 10px; font-weight: 500; letter-spacing: 0.5px; }
.ttl-zoomOutlineCount { color: var(--dsw-alias-label-quaternary, #5f6469); font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); font-size: 9.5px; }
.ttl-zoomOutlineCur { color: var(--dsw-static-blue-300, #7cb2ff); font-style: normal; font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace); font-size: 9.5px; }
.ttl-zoomOutlineTurn { display: flex; align-items: center; gap: 6px; padding: 4px 8px 6px; }
.ttl-zoomOutlineTurn .ttl-turnTime { font-size: 9.5px; }
.ttl-zoomOutlineRow {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ttl-zoomOutlineRow:hover { background: rgba(255, 255, 255, 0.04); }
.ttl-zoomOutlineRow[aria-current="true"] {
  background: rgba(76, 141, 255, 0.14);
  box-shadow: inset 2px 0 0 var(--dsw-static-blue-500, #4c8dff);
}
.ttl-zoomOutlineRow .ttl-stepIcon { width: 16px; height: 16px; }
.ttl-zoomOutlineRow .ttl-stepName { width: 38px; font-size: 9px; }
.ttl-zoomOutlineRow .ttl-stepDesc { font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #9ba1a7); }
.ttl-zoomOutlineRow[aria-current="true"] .ttl-stepDesc { color: #e6e8ea; }
.ttl-zoomOutlineRow .ttl-stepDur { width: 28px; font-size: 9px; }
.ttl-zoomMain {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 24px 0;
  overflow-y: auto;
  scrollbar-width: thin;
}
.ttl-zoomHead { flex: none; display: flex; align-items: center; gap: 10px; }
.ttl-zoomHead .ttl-detailIcon { width: 26px; height: 26px; }
.ttl-zoomHeadText { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ttl-zoomHeadLine { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ttl-zoomHeadLine .ttl-detailName { font-size: 15px; }
.ttl-zoomHeadLine .ttl-detailTool { font-size: 13px; max-width: 240px; }
.ttl-zoomHead .ttl-detailDesc { font-size: 12.5px; }
.ttl-zoomMeta, .ttl-zoom-meta {
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10px;
}
.ttl-zoomMain .ttl-tabs { margin-top: 10px; }
.ttl-zoomMain .ttl-tab { font-size: 11.5px; }
.ttl-zoomPane { padding: 10px 0 16px; min-height: 0; }
.ttl-zoomPane .ttl-code { padding: 12px 14px; }
.ttl-zoomPane .ttl-codeGutter { width: 18px; font-size: 9.5px; line-height: 20px; }
.ttl-zoomPane .ttl-codeText { font-size: 12px; line-height: 20px; }
.ttl-zoomPane .ttl-kvKey { width: 132px; font-size: 10px; }
.ttl-zoomPane .ttl-kvVal { font-size: 12px; }
.ttl-zoomPane .ttl-section { min-height: 26px; }
.ttl-zoomPane .ttl-outBlock { font-size: 11px; line-height: 18px; }
.ttl-zoomFoot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07));
  background: rgba(255, 255, 255, 0.015);
}
.ttl-zoomShortcuts { display: flex; align-items: center; gap: 14px; }
.ttl-zoomShortcut { display: inline-flex; align-items: center; gap: 5px; color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 10px; }
.ttl-zoomShortcut .ttl-kbd { min-width: 22px; }
.ttl-zoomFootState { display: flex; align-items: center; gap: 8px; margin-left: auto; color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 9.5px; }
.ttl-zoomFootState .ttl-pill { height: 16px; font-size: 9px; }
.ttl-zoom-empty, .ttl-zoom-nomatch { padding: 24px 0; color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 11px; }
.ttl-zoom-error { padding: 10px 0; color: var(--dsw-alias-state-error-primary, #f2726f); font-size: 11px; }

@media (prefers-reduced-motion: reduce) {
  .ttl-chevron, .ttl-skeletonBar { transition: none; animation: none; }
}

/* ── v0.9 leaf classes used by the new shell / detail ───── */
.ttl-empty-filtered { padding: 8px 14px; color: var(--dsw-alias-label-quaternary, #5f6469); font-size: 10.5px; }
.ttl-item-compaction { color: var(--dsw-alias-label-quaternary, #5f6469); }
.ttl-itemInput .ttl-itemDot { background: #60a5fa; }
.ttl-itemInput .ttl-itemLabel { color: #9bb8e8; }
.ttl-itemJump {
  flex: none;
  width: 16px;
  text-align: right;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-size: 11px;
  line-height: 18px;
}
.ttl-output-body {
  padding: 0 14px 8px 64px;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}
.ttl-statusMsg { color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 10.5px; }
.ttl-errorName, .ttl-error-name {
  color: var(--dsw-alias-state-error-primary, #f2726f);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 11px;
}

/* ── v0.9 fixes from shell-view review ─────────────────── */
.ttl-distSeg.ttl-tone-shell, .ttl-legendDot.ttl-tone-shell { background: #a78bfa; }
.ttl-distSeg.ttl-tone-read, .ttl-legendDot.ttl-tone-read { background: #60a5fa; }
.ttl-distSeg.ttl-tone-edit, .ttl-legendDot.ttl-tone-edit { background: #34d399; }
.ttl-distSeg.ttl-tone-mcp, .ttl-legendDot.ttl-tone-mcp { background: #f08fb8; }
.ttl-distSeg.ttl-tone-todo, .ttl-legendDot.ttl-tone-todo { background: #f2b45c; }
.ttl-distSeg.ttl-tone-generic, .ttl-legendDot.ttl-tone-generic { background: #9ba1a7; }
.ttl-statusDot { background: #4ed4a4; }
.ttl-stepWrap:hover .ttl-stepJump, .ttl-stepWrap[data-open="true"] .ttl-stepJump { display: inline-flex; }
.ttl-stepWrap[data-open="true"] .ttl-stepJump { color: var(--dsw-static-blue-300, #7cb2ff); }
.ttl-stepWrap:hover { background: rgba(255, 255, 255, 0.035); border-radius: 4px; }
.ttl-stepStatus { font-size: 10px; line-height: 10px; justify-content: center; align-items: center; }
.ttl-stepIcon svg { width: 16px; height: 16px; }
.ttl-stepWrap .ttl-step:hover { background: transparent; }

/* ══ v0.9 integration fixes (frame compare round 1) ══════════════════════ */

/* 1) turns are full-bleed; steps + band align to panel edges like the frames */
.ttl-turn { padding: 8px 0 10px; }
.ttl-turnHead { padding: 0 14px; }
.ttl-turnPreview { margin: 3px 14px 0; }
.ttl-turnFoot { padding: 6px 14px 0; }

/* 2) session summary bar / legend dots are painted from .ttl-tone-* (span/ i) */
.ttl-distSeg[class*="ttl-tone-"] { display: block; height: 4px; }
.ttl-legendDot[class*="ttl-tone-"] { display: inline-block; }

/* 3) locate arrow only on hover / focus, like the prototype */
.ttl-locateBtn { opacity: 0; pointer-events: none; transition: opacity 120ms ease; }
.ttl-turn:hover .ttl-locateBtn,
.ttl-turn:focus-within .ttl-locateBtn { opacity: 1; pointer-events: auto; }

/* 4) input/output rows use the same gutter as tool rows */
.ttl-item { padding-left: 15px; }
.ttl-itemLabel { width: 34px; }

/* 5) detail section = block container; its head is the flex row */
.ttl-section { display: block; }
.ttl-sectionHead { display: flex; align-items: center; gap: 8px; min-height: 24px; }
.ttl-sectionLabel { flex: none; white-space: nowrap; }
.ttl-sectionHint { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ttl-sectionAction { white-space: nowrap; }

/* 6) band is slightly darker than the panel, adapting to host skins */
.ttl-detail { background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #232324) 86%, #000000); }
.ttl-code, .ttl-outBlock { background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #232324) 78%, #000000); }

/* 7) MCP tool name gets more room in the detail head */
.ttl-detailTool { max-width: 196px; }

/* 8) zoom head: text action button, no duplicated status pill */
.ttl-zoomHeadLine .ttl-pill, .ttl-zoomHead .ttl-pill { display: none; }
.ttl-zoomHead .ttl-detailAction {
  width: auto;
  height: 28px;
  padding: 0 10px;
  gap: 6px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.10));
  background: rgba(255, 255, 255, 0.04);
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-size: 11px;
  white-space: nowrap;
}
.ttl-zoomHead .ttl-detailMeta { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 420px; }

/* 9) filters: keep the 「更多」 chip reachable while the list scrolls */
.ttl-moreChip, .ttl-chip-more {
  position: sticky;
  right: 0;
  z-index: 2;
  background: var(--dsw-alias-bg-layer-1, #232324);
  box-shadow: -8px 0 12px rgba(0, 0, 0, 0.35);
}


/* 10) expanded turns hide the mix strip (prototype 2-02) */
.ttl-turn[data-collapsed="false"] .ttl-mix { display: none; }

/* ══ v0.9 integration fixes (frame compare round 2) ══════════════════════ */
.ttl-codeFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  color: var(--dsw-alias-label-quaternary, #5f6469);
  font-size: 9.5px;
}
.ttl-sectionHead > .ttl-sectionMeta:last-child { margin-left: auto; }
.ttl-filters { gap: 4px; }
.ttl-chip { padding: 0 7px; }
.ttl-moreChip, .ttl-chip-more {
  position: static;
  box-shadow: none;
  background: rgba(255, 255, 255, 0.04);
}
.ttl-stepRail { background: rgba(255, 255, 255, 0.09); }
.ttl-zoomPanel { width: 1280px; height: 800px; max-width: calc(100vw - 48px); max-height: calc(100vh - 48px); }

/* ══ v0.9 integration fixes (frame compare round 3) ══════════════════════ */
.ttl-statusbar .ttl-toBottom,
.ttl-toBottomInline {
  position: static;
  margin-left: 8px;
  height: 20px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 9.5px;
  box-shadow: none;
  white-space: nowrap;
}
.ttl-turn[data-collapsed="false"] .ttl-itemInput { display: none; }
.ttl-detail { margin-left: 13.5px; margin-right: 13.5px; }

/* ══ v0.9.1 polish: quieter parallel groups, green MCP success ═══════════ */
.ttl-parallel {
  background: transparent;
  padding: 2px 0;
}
.ttl-parallel::before {
  width: 1px;
  background: rgba(167, 139, 250, 0.32);
}
.ttl-parallelHead {
  height: 20px;
  gap: 6px;
}
.ttl-parallelMark, .ttl-parallelLabel {
  color: #b9a7ee;
  font-size: 9.5px;
}
.ttl-parallelHint { display: none; }
.ttl-parallelAgg { font-size: 9px; color: var(--dsw-alias-label-quaternary, #7b8086); }
.ttl-tone-mcp { color: #34d399; }
.ttl-stepIcon.ttl-tone-mcp { background: rgba(52, 211, 153, 0.13); }

/* ══ v0.9.2 polish: full tool names, content-sized column ════════════════ */
.ttl-stepName {
  width: var(--ttl-step-name-w, 52px);
  min-width: 0;
}

/* ══ v0.9.3: parallel batches are marked by a bracket only ═══════════════ */
.ttl-stepRail { display: none; }
.ttl-parallel { padding: 0; background: transparent; }
.ttl-parallel::before {
  left: 3px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: #f2b45c;
  opacity: 0.8;
  border-radius: 2px;
}
.ttl-parallelHead { display: none; }

/* ══ v0.9.4: expanded trace gets breathing room on both sides ═════════════ */
.ttl-turn .ttl-step {
  padding-left: 14px;
  padding-right: 22px;
}
.ttl-turn .ttl-stepJump { right: 8px; }
.ttl-turn .ttl-item { padding-right: 20px; }
.ttl-turn .ttl-parallel::before { left: 10px; }
.ttl-turn .ttl-turnBody .ttl-showEarlier { width: calc(100% - 36px); margin-left: 18px; margin-right: 18px; }

`
