/**
 * styles.ts — DSH-native, token-driven CSS for the trail panel, injected once
 * by the client entry. The design language mirrors the upstream DSH trajectory
 * surface: a monochrome "ink" chrome (label tiers + hairline separators +
 * interactive hover washes), flat turn rows instead of cards, a 2px turn rail
 * for the located turn, semantic accent dots (success/warn/neutral) instead of
 * a per-tool rainbow, and monospace tool names/args. Every expanded-body row
 * shares one anatomy — a 6px semantic dot + a narrow name column + content —
 * so input, output and tool rows read as one grid; the dot carries the whole
 * color channel (category for tools, red for failures).
 * All colors/fonts consume
 * DSW alias tokens (auto light/dark/skin); fallbacks mirror the native dark
 * values so a missing token never falls back to a foreign look.
 *
 * Radius scale (native): 2px micro tag · 4px chip/step hover · 6px buttons ·
 * 8px floating surfaces. No 999px pills. Class names are prefixed `ttl-` and
 * are OUR contract (never matched against DSH internals).
 */
export const trailCss = `
.ttl-root {
  box-sizing: border-box;
  position: relative;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-1, #232324);
  color: var(--dsw-alias-label-primary, #f9fafb);
  font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif);
  font-size: 12px;
  line-height: 18px;
  container: trail-tab / inline-size;
}

/* ── Header (36px, hairline) ────────────────────────────── */
.ttl-header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  height: 36px;
  padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
}
.ttl-title {
  flex: none;
  min-width: 0;
  max-width: 55%;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--dsw-alias-label-primary, #f9fafb);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ttl-count {
  flex: none;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 12px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}
.ttl-headerSpacer { flex: 1; min-width: 0; }
/* Follow-latest: native ghost button + status dot (no checkbox pill). */
.ttl-toggle {
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
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  white-space: nowrap;
}
.ttl-toggle:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}
.ttl-toggleDot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--dsw-alias-label-tertiary, #adb2b8);
}
.ttl-toggle[aria-pressed="true"] { color: var(--dsw-alias-label-primary, #f9fafb); }
.ttl-toggle[aria-pressed="true"] .ttl-toggleDot {
  background: var(--dsw-alias-state-success-primary, #22c55e);
  box-shadow: none;
}

/* ── Filter row (flat text chips + semantic dots) ────────── */
.ttl-filterRow {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2px;
  flex: none;
  padding: 4px 8px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}
.ttl-filterRow::-webkit-scrollbar { height: 4px; }
.ttl-filterRow::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-scrollbar-bg-l2, #545557);
  border-radius: 2px;
}
.ttl-chip {
  box-sizing: border-box;
  flex: none;
  height: 22px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  cursor: pointer;
}
.ttl-chip:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}
/* Active chip = business-blue TEXT on the hover wash (native detailTab). */
.ttl-chip[aria-pressed="true"] {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-state-business-primary, #4176e6);
}
.ttl-chipNum {
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-variant-numeric: tabular-nums;
  font-weight: 400;
}
.ttl-chip[aria-pressed="true"] .ttl-chipNum { color: inherit; opacity: 0.72; }
.ttl-chipDot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.ttl-dot-success { background: var(--dsw-alias-state-success-primary, #22c55e); }
.ttl-dot-warn { background: var(--dsw-alias-state-warn-primary, #f59e0b); }
.ttl-dot-neutral { background: var(--dsw-alias-label-tertiary, #adb2b8); }
.ttl-moreChip { color: var(--dsw-alias-label-tertiary, #adb2b8); }
.ttl-moreArrow {
  flex: none;
  display: inline-flex;
  transition: transform 120ms var(--ds-ease-in-out, ease);
}
.ttl-moreArrowOpen { transform: rotate(180deg); }
/* "More" dropdown: native elevated menu (layer-2 + hairline + 8px + shadow). */
.ttl-toolDropdown {
  box-sizing: border-box;
  position: absolute;
  z-index: 9;
  top: 64px;
  left: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  width: max-content;
  max-width: calc(100% - 16px);
  max-height: 180px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, #2c2c2e);
  box-shadow: 0 4px 16px var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.24));
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}

/* ── Turn list (flat rows, hairline separators) ──────────── */
.ttl-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}
.ttl-list::-webkit-scrollbar { width: 6px; }
.ttl-list::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-scrollbar-bg-l2, #545557);
  border-radius: 3px;
}
.ttl-status {
  margin: 14px;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 12px;
  line-height: 18px;
}
.ttl-error {
  margin: 14px;
  color: var(--dsw-alias-state-error-primary, #f25a5a);
  font-size: 12px;
  line-height: 18px;
}

/* ── Turn row (no card; 2px rail marks the located turn) ─── */
.ttl-turnRow {
  position: relative;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  background: transparent;
}
.ttl-turnRow:first-child { border-top: none; }
.ttl-turnRow[data-active="true"]::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: color-mix(in srgb, var(--dsw-static-blue-500, #3b82f6) 22%, var(--dsw-alias-bg-layer-1, #232324));
}
.ttl-turnRow[data-active="true"][data-error="true"]::before {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #f25a5a) 22%, var(--dsw-alias-bg-layer-1, #232324));
}
.ttl-turnHead {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0;
  min-height: 32px;
  padding: 0 6px 0 10px;
}
.ttl-turnHead:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.ttl-turnToggle {
  box-sizing: border-box;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ttl-chevron {
  flex: none;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  transition: transform 120ms var(--ds-ease-in-out, ease);
}
.ttl-chevronOpen { transform: rotate(90deg); }
/* "轮次 N": native turnLabel-style micro tag (mono, module bg, 2px radius). */
.ttl-turnTag {
  box-sizing: border-box;
  flex: none;
  padding: 1px 5px;
  border-radius: 2px;
  background: var(--dsw-alias-bg-module-platform, #353638);
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei", monospace);
  font-size: 10px;
  font-weight: 500;
  line-height: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  user-select: none;
}
.ttl-turnRow[data-active="true"] .ttl-turnTag {
  color: color-mix(in srgb, var(--dsw-static-blue-500, #3b82f6) 55%, var(--dsw-alias-label-tertiary, #adb2b8));
  background: color-mix(in srgb, var(--dsw-static-blue-500, #3b82f6) 14%, var(--dsw-alias-bg-layer-1, #232324));
}
.ttl-turnPreview {
  flex: 1;
  min-width: 0;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ttl-turnMeta {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}
/* Step count: a bare tabular number (never a colored badge). */
.ttl-stepsNum {
  flex: none;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}
.ttl-errorDot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-error-primary, #f25a5a);
}
.ttl-locateBtn {
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  cursor: pointer;
  padding: 0;
}
.ttl-locateBtn:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}

/* ── Expanded body (transparent, indented under the rail) ── */
.ttl-turnBody {
  box-sizing: border-box;
  padding: 2px 6px 6px 34px;
  background: transparent;
}
/* ── Unified row anatomy: [semantic dot] + [name] + [content] ──
 * One skeleton for every row. The 6px dot carries the whole color channel
 * (blue = user input, violet = assistant output, green/amber/neutral = tool
 * category matching the filter chips' dots, red = failure — replacing ✗/✓),
 * the name names the row (monospace for tools), content follows. The name
 * column has a narrow 30px min-width: common short names (bash/edit/read,
 * 输入/输出) align without dead space; long names just push content. */
.ttl-row {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 3px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f9fafb);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  text-align: left;
  cursor: pointer;
}
.ttl-row:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
.ttl-rowDot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 6px;
}
.ttl-dot-blue {
  background: var(--dsw-alias-state-business-primary, #4176e6);
}
.ttl-dot-violet {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color, #5686fe) 60%, var(--dsw-alias-state-error-secondary, #f25a5a));
}
.ttl-dot-red {
  background: var(--dsw-alias-state-error-primary, #f25a5a);
}
.ttl-rowName {
  flex: none;
  min-width: 30px;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
}
.ttl-rowNameMono {
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei", monospace);
}
.ttl-rowText {
  flex: 1;
  min-width: 0;
  color: var(--dsw-alias-label-primary, #f9fafb);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}
.ttl-rowText2 {
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.ttl-rowTextMuted { color: var(--dsw-alias-label-tertiary, #adb2b8); }
.ttl-rowArgs {
  flex: 1;
  min-width: 0;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei", monospace);
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Error rows read red across dot and payload. */
.ttl-row[data-step-kind="error"] .ttl-rowArgs {
  color: var(--dsw-alias-state-error-primary, #f25a5a);
}
.ttl-emptyInline {
  padding: 6px 8px;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 11px;
  line-height: 16px;
}
.ttl-showEarlier {
  box-sizing: border-box;
  width: 100%;
  height: 26px;
  margin: 2px 0 4px;
  padding: 0 8px;
  border: none;
  border-bottom: 1px dashed var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 0;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  text-align: left;
  cursor: pointer;
}
.ttl-showEarlier:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-secondary, #cfd3d6);
}
/* ── Status bar / jump feedback ──────────────────────────── */
.ttl-statusBar {
  box-sizing: border-box;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 14px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 12px;
  line-height: 18px;
}
.ttl-spin {
  display: inline-flex;
  color: var(--dsw-alias-state-business-primary, #4176e6);
  animation: ttl-spin 1s linear infinite;
}
@keyframes ttl-spin { to { transform: rotate(360deg); } }
.ttl-jumpBanner {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 7px;
  max-width: 90%;
  padding: 5px 10px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  background: var(--dsw-alias-button-floating-fill, #2c2c2e);
  color: var(--dsw-alias-label-primary, #f9fafb);
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  box-shadow: 0 4px 16px var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.24));
}
.ttl-toBottom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 5;
  box-sizing: border-box;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  background: var(--dsw-alias-button-floating-fill, #2c2c2e);
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
.ttl-toBottom:hover {
  background: var(--dsw-alias-interactive-bg-hover-solid, #353638);
  color: var(--dsw-alias-label-primary, #f9fafb);
}

/* ── Jump highlight flash (on the main conversation) ─────── */
.ttl-flash { animation: ttl-flash 1.6s ease-out; }
@keyframes ttl-flash {
  0% { box-shadow: 0 0 0 3px var(--dsw-alias-state-business-primary, #4176e6); }
  100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .ttl-spin { animation: none; }
}

/* ── Inline step detail (v0.4.0, 契约 §4.5) ──────────────────────────────
 * The expanded body is an inline band under its own row rather than a modal:
 * one hairline rail on the left marks the indent, the tab strip is 11px, the
 * band pads 8px 10px. Everything below consumes DSW alias tokens only (the
 * hex after each token is the native dark fallback, never a literal color
 * choice), so light/dark/skin follow the host. */
.ttl-stepWrap { position: relative; }
/* Reserve room for the absolutely positioned locate button so a tool row stays
   one line at the same density as every other row (padding is scoped to tool
   rows inside the wrapper; input/output/compaction rows are untouched). */
.ttl-stepWrap .ttl-row { padding-right: 26px; }
.ttl-stepWrap[data-open="true"] .ttl-row {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
}
/* Disclosure caret: a CSS triangle in currentColor (no icon font, no image). */
.ttl-caret {
  flex: none;
  width: 0;
  height: 0;
  margin-top: 7px;
  border: 4px solid transparent;
  border-left-color: var(--dsw-alias-label-tertiary, #adb2b8);
  transition: transform 120ms var(--ds-ease-in-out, ease);
}
.ttl-caretOpen { transform: rotate(90deg); }
.ttl-jump {
  box-sizing: border-box;
  /* Pinned to the row's top-right; the wrapper is the containing block. */
  position: absolute;
  top: 4px;
  right: 4px;
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
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font: inherit;
  font-size: 11px;
  line-height: 14px;
  cursor: pointer;
  opacity: 0;
}
.ttl-stepWrap:hover .ttl-jump,
.ttl-jump:focus-visible { opacity: 1; }
.ttl-jump:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}
.ttl-detail {
  box-sizing: border-box;
  margin: 2px 0 6px 12px;
  padding: 8px 10px;
  border-left: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: 0 4px 4px 0;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #2c2c2e) 45%, transparent);
  min-width: 0;
}
.ttl-detailBar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 2px;
  margin: -2px 0 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}
.ttl-dtab {
  box-sizing: border-box;
  flex: none;
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  cursor: pointer;
}
.ttl-dtab:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-secondary, #cfd3d6);
}
.ttl-dtabSelected {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}
.ttl-detailBody { min-width: 0; }
.ttl-detailFoot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 10px;
  line-height: 14px;
  font-variant-numeric: tabular-nums;
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

@media (prefers-reduced-motion: reduce) {
  .ttl-caret { transition: none; }
  .ttl-mdTableWrap::after { transition: none; }
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

/* ── On-demand full detail: loading / failed / loaded states ── */
.ttl-detailLoad {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 11px;
  line-height: 16px;
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

/* ── Zoom overlay (fixed layer + backdrop + flex panel) ── */
.ttl-zoom {
  position: fixed;
  inset: 0;
  z-index: 60;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.ttl-zoomBackdrop {
  position: absolute;
  inset: 0;
  background: var(--dsw-alias-bg-mask-3, rgba(0, 0, 0, 0.48));
}
.ttl-zoomPanel {
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(1080px, 92vw);
  height: min(760px, 88vh);
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: var(--dsw-radius-lg, 16px);
  background: var(--dsw-alias-bg-layer-2, #2c2c2e);
  color: var(--dsw-alias-label-primary, #f9fafb);
  box-shadow: 0 4px 16px var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.24));
}
.ttl-zoomHead {
  box-sizing: border-box;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
}
.ttl-zoomTitle {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--dsw-alias-label-primary, #f9fafb);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ttl-zoomTools {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
/* Header actions carry no class of their own — the cluster owns the chrome. */
.ttl-zoomTools button {
  box-sizing: border-box;
  height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border: none;
  border-radius: var(--dsw-radius-xs, 4px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  cursor: pointer;
}
.ttl-zoomTools button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}
.ttl-zoomSearch {
  box-sizing: border-box;
  flex: none;
  width: 160px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: var(--dsw-radius-xs, 4px);
  background: var(--dsw-alias-bg-module-platform, #353638);
  color: var(--dsw-alias-label-primary, #f9fafb);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
}
.ttl-zoomSearch::placeholder { color: var(--dsw-alias-label-tertiary, #adb2b8); }
.ttl-zoomSearch:focus {
  outline: none;
  border-color: var(--dsw-alias-state-business-primary, #4176e6);
}
.ttl-zoomBody {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
}
/* Outline column: fixed 260px rail with its own scroll. */
.ttl-zoomOutline {
  box-sizing: border-box;
  flex: none;
  width: 260px;
  min-width: 0;
  overflow-y: auto;
  padding: 6px 4px 6px 6px;
  border-right: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}
.ttl-zoomOutline::-webkit-scrollbar { width: 6px; }
.ttl-zoomOutline::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-scrollbar-bg-l2, #545557);
  border-radius: 3px;
}
.ttl-zoomOutlineRow {
  box-sizing: border-box;
  width: 100%;
  min-height: 26px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border: none;
  border-radius: var(--dsw-radius-xs, 4px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  text-align: left;
  cursor: pointer;
}
.ttl-zoomOutlineRow:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-label-primary, #f9fafb);
}
.ttl-zoomOutlineRow[aria-current="true"] {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--dsw-alias-state-business-primary, #4176e6);
}
.ttl-zoomPane {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 8px 12px 8px 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}
.ttl-zoomTabs {
  box-sizing: border-box;
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}
.ttl-zoomFoot {
  box-sizing: border-box;
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
  padding: 0 14px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-size: 11px;
  line-height: 16px;
}
.ttl-zoomKbd {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 5px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: var(--dsw-radius-xs, 4px);
  background: var(--dsw-alias-bg-module-platform, #353638);
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei", monospace);
  font-size: 10px;
  line-height: 14px;
  white-space: nowrap;
}

/* ── v0.6.0: semantic tool glyphs, pretty JSON, centered-viewer affordances ── */
.ttl-rowIcon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  margin-top: 2px;
  margin-right: 1px;
}
.ttl-icon-success { color: var(--dsw-alias-state-success-primary, #22c55e); }
.ttl-icon-warn { color: var(--dsw-alias-state-warn-primary, #f59e0b); }
.ttl-icon-neutral { color: var(--dsw-alias-label-tertiary, #adb2b8); }
.ttl-icon-blue { color: var(--dsw-alias-state-business-primary, #4176e6); }
.ttl-icon-violet { color: var(--dsw-alias-brand-primary-new-colorprimary-new-color, #5686fe); }
.ttl-icon-red { color: var(--dsw-alias-state-error-primary, #f25a5a); }
.ttl-detailTools {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
  padding: 1px 0 3px;
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
.ttl-outputWrap { display: block; position: relative; }
.ttl-outputBody {
  margin: 2px 0 4px 15px;
  padding: 4px 8px 6px;
  border-left: 1px solid var(--dsw-alias-separator-secondary, rgba(255, 255, 255, 0.12));
}
.ttl-outputBody .ttl-md { padding: 2px 4px; }
.ttl-outputToggle {
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #adb2b8);
  background: none;
  border: none;
  padding: 0 0 2px;
  cursor: pointer;
}
.ttl-outputToggle:hover { color: var(--dsw-alias-label-primary, #f9fafb); }
`
