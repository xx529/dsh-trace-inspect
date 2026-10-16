window.__ModuleLoader__.load({
  id: 'dsh-trace-inspect',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var React6 = __toESM(require("react"), 1);

// src/client/styles.ts
var trailCss = `
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

/* \u2500\u2500 Header (36px, hairline) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Filter row (flat text chips + semantic dots) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Turn list (flat rows, hairline separators) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Turn row (no card; 2px rail marks the located turn) \u2500\u2500\u2500 */
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
/* "\u8F6E\u6B21 N": native turnLabel-style micro tag (mono, module bg, 2px radius). */
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

/* \u2500\u2500 Expanded body (transparent, indented under the rail) \u2500\u2500 */
.ttl-turnBody {
  box-sizing: border-box;
  padding: 2px 6px 6px 34px;
  background: transparent;
}
/* \u2500\u2500 Unified row anatomy: [semantic dot] + [name] + [content] \u2500\u2500
 * One skeleton for every row. The 6px dot carries the whole color channel
 * (blue = user input, violet = assistant output, green/amber/neutral = tool
 * category matching the filter chips' dots, red = failure \u2014 replacing \u2717/\u2713),
 * the name names the row (monospace for tools), content follows. The name
 * column has a narrow 30px min-width: common short names (bash/edit/read,
 * \u8F93\u5165/\u8F93\u51FA) align without dead space; long names just push content. */
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
/* \u2500\u2500 Status bar / jump feedback \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Jump highlight flash (on the main conversation) \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ttl-flash { animation: ttl-flash 1.6s ease-out; }
@keyframes ttl-flash {
  0% { box-shadow: 0 0 0 3px var(--dsw-alias-state-business-primary, #4176e6); }
  100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .ttl-spin { animation: none; }
}

/* \u2500\u2500 Inline step detail (v0.4.0, \u5951\u7EA6 \xA74.5) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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
/* Micro tag (native 2px radius \u2014 never a 999px pill). */
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

/* \u2500\u2500 JSON tree \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Rendered Markdown / raw text \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Image placeholder chips (no URL contract yet \u2014 \u5951\u7EA6 \xA70) \u2500\u2500 */
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

/* \u2500\u2500 Error result block \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2550\u2550 v0.5.0 (\u5951\u7EA6 \xA710.4.1) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
 * Image thumbnails over the session-authorized attachment route, the
 * on-demand full-detail states, the merged-from note, and the P2 zoom
 * overlay. Same rules as above: colors only as var(--dsw-*) (the hex
 * after the comma is the native dark fallback, never a literal choice),
 * radii from the native --dsw-radius-* scale, code from
 * var(--ds-font-family-code). The overlay is plain position:fixed so it
 * needs no host slot: .ttl-zoom is the fixed layer, .ttl-zoomBackdrop
 * fills it, .ttl-zoomPanel is the flex column on top. */

/* \u2500\u2500 Image thumbnail (replaces the chip once bytes are authorized) \u2500\u2500 */
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

/* \u2500\u2500 On-demand full detail: loading / failed / loaded states \u2500\u2500 */
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

/* \u2500\u2500 Zoom overlay (fixed layer + backdrop + flex panel) \u2500\u2500 */
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
/* Header actions carry no class of their own \u2014 the cluster owns the chrome. */
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
`;

// src/client/TrailTab.tsx
var React5 = __toESM(require("react"), 1);

// src/trail-model.ts
var PREVIEW_MAX = 120;
function stepsOf(turn) {
  const out = [];
  for (const item of turn.items) {
    if (item.kind === "tool") out.push(item.step);
  }
  return out;
}
function compact(value, max = PREVIEW_MAX) {
  const oneLine = value.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1).trimEnd()}\u2026`;
}
function contentPreview(blocks) {
  if (typeof blocks === "string") return compact(blocks);
  if (!Array.isArray(blocks)) return "";
  for (const block of blocks) {
    if (block !== null && typeof block === "object" && block.type === "text" && typeof block.text === "string" && block.text.trim().length > 0) {
      return compact(block.text);
    }
  }
  return "";
}
function lastTextBlock(blocks) {
  if (typeof blocks === "string") return blocks;
  if (!Array.isArray(blocks)) return "";
  let last = "";
  for (const block of blocks) {
    if (block !== null && typeof block === "object" && block.type === "text" && typeof block.text === "string" && block.text.trim().length > 0) {
      last = block.text;
    }
  }
  return last;
}
function objectData(event) {
  return event.data !== null && typeof event.data === "object" ? event.data : {};
}
function sourceKindOf(event, data) {
  const message = data.message !== null && typeof data.message === "object" ? data.message : {};
  const source = message !== null && typeof message.source === "object" ? message.source : data.source !== null && typeof data.source === "object" ? data.source : null;
  if (source !== null && typeof source.kind === "string") return source.kind;
  return void 0;
}
function toolCallIdOf(data) {
  if (typeof data.callId === "string" && data.callId.length > 0) return data.callId;
  const message = data.message !== null && typeof data.message === "object" ? data.message : {};
  const source = message !== null && typeof message.source === "object" ? message.source : null;
  if (source !== null && typeof source.callId === "string" && source.callId.length > 0) {
    return source.callId;
  }
  return null;
}
function newBuilder(turn) {
  return {
    turn,
    startSeq: null,
    endSeq: null,
    input: "",
    inputSeq: null,
    output: "",
    outputSeq: null,
    items: [],
    steps: [],
    contexts: [],
    hasError: false
  };
}
function appendItem(builder, item) {
  builder.items.push(item);
  if (item.kind === "tool") {
    builder.steps.push(item.step);
    if (item.step.kind === "error") builder.hasError = true;
  }
}
function record(value) {
  return value !== null && typeof value === "object" ? value : null;
}
function rawResultContent(data) {
  const direct = data.content;
  if (typeof direct === "string" || Array.isArray(direct)) return direct;
  const message = record(data.message);
  if (message !== null) {
    const nested = message.content;
    if (typeof nested === "string" || Array.isArray(nested)) return nested;
  }
  return void 0;
}
function resultText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts = [];
  for (const block of content) {
    const b = record(block);
    if (b === null || b.type !== "text" || typeof b.text !== "string" || b.text.length === 0) continue;
    parts.push(b.text);
  }
  return parts.join("\n");
}
function resultImages(content) {
  if (!Array.isArray(content)) return [];
  const out = [];
  for (const block of content) {
    const b = record(block);
    if (b === null || b.type !== "image") continue;
    const attachment = record(b.attachment);
    if (attachment === null) continue;
    if (typeof attachment.attachmentId !== "string" || attachment.attachmentId.length === 0) continue;
    const image = {
      attachmentId: attachment.attachmentId,
      mediaType: typeof attachment.mediaType === "string" ? attachment.mediaType : "",
      bytes: typeof attachment.bytes === "number" && Number.isFinite(attachment.bytes) ? attachment.bytes : 0
    };
    if (typeof attachment.width === "number") image.width = attachment.width;
    if (typeof attachment.height === "number") image.height = attachment.height;
    if (typeof attachment.name === "string") image.name = attachment.name;
    out.push(image);
  }
  return out;
}
function resultContentOf(data) {
  const content = rawResultContent(data);
  const message = record(data.message);
  const isError = data.isError === true || message !== null && message.isError === true;
  return {
    text: resultText(content),
    images: resultImages(content),
    truncated: data.contentTruncated === true,
    isError
  };
}
function parseSurfaceOp(raw) {
  if (raw === "append") return { op: "append" };
  const op = record(raw);
  if (op !== null) {
    if (op.op === "replace" && typeof op.startSeq === "number" && Number.isFinite(op.startSeq) && typeof op.endSeq === "number" && Number.isFinite(op.endSeq)) {
      return { op: "replace", startSeq: op.startSeq, endSeq: op.endSeq };
    }
    if (op.op === "append") return { op: "append" };
  }
  return { op: "append" };
}
function surfaceOpOf(eventSurfaceOp, data) {
  return parseSurfaceOp(eventSurfaceOp !== void 0 ? eventSurfaceOp : data.surfaceOp);
}
function segmentOf(seq, bits) {
  return {
    seq,
    text: bits.text,
    images: bits.images,
    truncated: bits.truncated,
    isError: bits.isError,
    ...bits.errorName !== void 0 ? { errorName: bits.errorName } : {},
    ...bits.errorCode !== void 0 ? { errorCode: bits.errorCode } : {}
  };
}
function rebuildResult(step, content) {
  const entries = [];
  for (const seg of content.segments.values()) entries.push({ seq: seg.seq, seg });
  for (const rep of content.replaces.values()) entries.push({ seq: rep.seq, rep });
  entries.sort((a, b) => a.seq - b.seq || (a.seg !== void 0 ? 0 : 1) - (b.seg !== void 0 ? 0 : 1));
  const live = /* @__PURE__ */ new Map();
  let replacedBy;
  let replacedFrom;
  for (const entry of entries) {
    if (entry.seg !== void 0) {
      live.set(entry.seg.seq, entry.seg);
      continue;
    }
    const rep = entry.rep;
    for (const key of [...live.keys()]) {
      if (key < rep.seq) live.delete(key);
    }
    if (replacedBy === void 0 || rep.seq > replacedBy) {
      replacedBy = rep.seq;
      replacedFrom = rep.from;
    }
  }
  const ordered = [...live.values()].sort((a, b) => a.seq - b.seq);
  const text = ordered.map((seg) => seg.text).join("");
  const images = [];
  const seen = /* @__PURE__ */ new Set();
  for (const seg of ordered) {
    for (const image of seg.images) {
      if (seen.has(image.attachmentId)) continue;
      seen.add(image.attachmentId);
      images.push(image);
    }
  }
  const top = ordered.length > 0 ? ordered[ordered.length - 1] : void 0;
  const isError = top !== void 0 && top.isError;
  const truncated = ordered.some((seg) => seg.truncated);
  let seq = step.seq;
  for (const key of content.segments.keys()) {
    if (key > seq) seq = key;
  }
  const kind = isError ? "error" : text.length > 0 && images.length > 0 ? "mixed" : text.length === 0 && images.length > 0 ? "image" : "text";
  const result = {
    seq,
    kind,
    text,
    truncated,
    isError,
    mergedFrom: ordered.length,
    ...images.length > 0 ? { images } : {},
    ...isError && top !== void 0 && top.errorName !== void 0 ? { errorName: top.errorName } : {},
    ...isError && top !== void 0 && top.errorCode !== void 0 ? { errorCode: top.errorCode } : {},
    ...replacedBy !== void 0 ? { replacedBy } : {},
    ...replacedFrom !== void 0 ? { replacedFrom } : {}
  };
  step.result = result;
}
var ResultIndex = class {
  constructor(addStep, markDirty) {
    this.addStep = addStep;
    this.markDirty = markDirty;
    this.byCallId = /* @__PURE__ */ new Map();
    this.seqIndex = /* @__PURE__ */ new Map();
    this.contents = /* @__PURE__ */ new WeakMap();
  }
  /** Drop every registration (used when the folder flips from user mode). */
  reset() {
    this.byCallId.clear();
    this.seqIndex.clear();
    this.contents = /* @__PURE__ */ new WeakMap();
  }
  /** Register an already-built step under callId and seq. */
  register(callId, seq, ref) {
    if (callId !== null) this.byCallId.set(callId, ref);
    this.seqIndex.set(seq, ref);
  }
  /** tool/call → build the step (full args) and register callId + seq. */
  applyToolCall(builder, data, seq) {
    const name = typeof data.name === "string" && data.name.length > 0 ? data.name : "tool";
    const args = typeof data.arguments === "string" && data.arguments.length > 0 ? data.arguments : "";
    const callId = toolCallIdOf(data);
    const step = {
      kind: "tool",
      seq,
      name,
      argsPreview: compact(args),
      args,
      argsTruncated: data.argsTruncated === true,
      argsBytes: typeof data.argsBytes === "number" && Number.isFinite(data.argsBytes) ? data.argsBytes : args.length,
      callId,
      error: ""
    };
    this.addStep(builder, step);
    this.register(callId, seq, { builder, step });
  }
  /** tool/result → error rows keep v0.3.1 behavior; success results merge by surfaceOp. */
  applyToolResult(current, data, seq, eventSurfaceOp) {
    const callId = toolCallIdOf(data);
    const error = record(data.error);
    if (error !== null) {
      if (current === null) return;
      const errorName = typeof error.name === "string" && error.name.length > 0 ? error.name : "tool";
      const errorCode = typeof error.code === "string" && error.code.length > 0 ? error.code : void 0;
      const detail = errorCode !== void 0 ? ` \xB7 ${errorCode}` : "";
      const step2 = {
        kind: "error",
        seq,
        name: errorName,
        argsPreview: "",
        args: "",
        argsTruncated: false,
        argsBytes: 0,
        callId,
        error: compact(`${errorName}${detail}`),
        ...errorCode !== void 0 ? { errorCode } : {}
      };
      this.addStep(current, step2);
      const bits2 = {
        ...resultContentOf(data),
        isError: true,
        errorName,
        ...errorCode !== void 0 ? { errorCode } : {}
      };
      this.applyContent(current, step2, seq, bits2);
      this.seqIndex.set(seq, { builder: current, step: step2 });
      if (callId !== null && !this.byCallId.has(callId)) this.byCallId.set(callId, { builder: current, step: step2 });
      return;
    }
    const surfaceOp = surfaceOpOf(eventSurfaceOp, data);
    const bits = resultContentOf(data);
    if (surfaceOp.op === "replace") {
      const targets = [];
      const seen = /* @__PURE__ */ new Set();
      for (const [key, ref] of this.seqIndex) {
        if (key < surfaceOp.startSeq || key > surfaceOp.endSeq) continue;
        if (seen.has(ref.step)) continue;
        seen.add(ref.step);
        targets.push(ref);
      }
      if (targets.length === 0 && callId !== null) {
        const hit2 = this.byCallId.get(callId);
        if (hit2 !== void 0) targets.push(hit2);
      }
      if (targets.length === 0) return;
      for (const target of targets) {
        this.applyContent(target.builder, target.step, seq, bits, surfaceOp);
        this.seqIndex.set(seq, target);
        if (callId !== null && !this.byCallId.has(callId)) this.byCallId.set(callId, target);
      }
      return;
    }
    if (current === null) return;
    const hit = callId !== null ? this.byCallId.get(callId) : void 0;
    if (hit !== void 0) {
      this.applyContent(hit.builder, hit.step, seq, bits);
      this.seqIndex.set(seq, hit);
      return;
    }
    const step = {
      kind: "tool",
      seq,
      name: "tool",
      argsPreview: "",
      args: "",
      argsTruncated: false,
      argsBytes: 0,
      callId,
      error: "",
      orphan: true
    };
    this.addStep(current, step);
    this.applyContent(current, step, seq, bits);
    this.register(callId, seq, { builder: current, step });
  }
  applyContent(builder, step, seq, bits, surfaceOp) {
    let state = this.contents.get(step);
    if (state === void 0) {
      state = { segments: /* @__PURE__ */ new Map(), replaces: /* @__PURE__ */ new Map() };
      this.contents.set(step, state);
    }
    if (surfaceOp !== void 0 && surfaceOp.op === "replace") {
      state.replaces.set(seq, { seq, from: surfaceOp.startSeq, to: surfaceOp.endSeq });
    }
    state.segments.set(seq, segmentOf(seq, bits));
    rebuildResult(step, state);
    this.markDirty(builder);
  }
};
function finishBuilder(builder, index, boundarySeq) {
  const anchorSeq = builder.inputSeq !== null ? builder.inputSeq : boundarySeq;
  const status = builder.hasError ? "error" : builder.endSeq === null ? builder.items.length > 0 ? "running" : "pending" : "done";
  return {
    index,
    turn: builder.turn,
    anchorSeq,
    inputPreview: compact(builder.input),
    outputPreview: compact(builder.output),
    status,
    ...builder.startedAt !== void 0 ? { startedAt: builder.startedAt } : {},
    ...builder.endedAt !== void 0 ? { endedAt: builder.endedAt } : {},
    items: builder.items,
    stepsCount: builder.steps.length,
    contextCount: builder.contexts.length,
    hasError: builder.hasError
  };
}
function firstItemSeq(items) {
  for (const item of items) {
    if (item.kind === "tool") return item.step.seq;
    return item.seq;
  }
  return 0;
}
function finishUserTurn(builder, index) {
  const boundarySeq = builder.inputSeq !== null ? builder.inputSeq : builder.startSeq ?? 0;
  return finishBuilder(builder, index, boundarySeq);
}
var TrailFolder = class {
  constructor() {
    this.mode = "unknown";
    // turn-mode state
    this.builders = /* @__PURE__ */ new Map();
    this.order = [];
    this.frozen = [];
    this.pendingUser = [];
    this.current = null;
    // user-mode state
    this.userClosed = [];
    /** Builders of the closed user-mode turns, so a late write can re-materialize. */
    this.userClosedBuilders = [];
    this.userActive = null;
    this.userActiveTurn = null;
    this.userCounter = 0;
    this.lastSeq = -1;
    this.total = 0;
    this.failed = 0;
    this.byTool = /* @__PURE__ */ new Map();
    /**
     * Shared tool/call + tool/result application. addStep keeps the incremental
     * stats in sync with a batch re-fold; markDirty nulls the frozen slot of the
     * owning turn, so a replace that rewrites an already-frozen step forces React
     * to re-render the reused turn object.
     */
    this.results = new ResultIndex(
      (builder, step) => {
        this.addStep(builder, { kind: "tool", step });
      },
      (builder) => {
        this.markDirty(builder);
      }
    );
  }
  /** Highest event seq consumed so far (duplicates / re-pages are skipped). */
  get latestSeq() {
    return this.lastSeq;
  }
  push(event) {
    if (event === null || typeof event !== "object" || typeof event.type !== "string") return;
    const seq = typeof event.seq === "number" ? event.seq : Number.NaN;
    if (!Number.isFinite(seq) || seq <= this.lastSeq) return;
    const data = objectData(event);
    const time = typeof event.time === "number" ? event.time : void 0;
    this.lastSeq = seq;
    if (this.mode === "turn") {
      this.applyTurnEvent(event.type, data, seq, time, event.surfaceOp);
      return;
    }
    if (this.mode === "user") {
      if (event.type === "turn/start" && typeof data.turn === "number") {
        this.flipToTurnMode();
        this.applyTurnEvent(event.type, data, seq, time, event.surfaceOp);
      } else {
        this.applyUserEvent(event.type, data, seq, time, event.surfaceOp);
      }
      return;
    }
    if (event.type === "turn/start" && typeof data.turn === "number") {
      this.mode = "turn";
      this.applyTurnEvent(event.type, data, seq, time, event.surfaceOp);
      return;
    }
    if (event.type === "user/message" && sourceKindOf(event, data) === "user") {
      this.mode = "user";
      this.applyUserEvent(event.type, data, seq, time, event.surfaceOp);
      return;
    }
  }
  /** The current turn list; closed turns keep their object identity. */
  snapshot() {
    if (this.mode === "unknown") return [];
    if (this.mode === "user") {
      const out2 = this.userClosed.slice();
      if (this.userActive !== null) {
        if (this.userActiveTurn === null) {
          this.userActiveTurn = finishUserTurn(this.userActive, this.userClosed.length);
        }
        out2.push(this.userActiveTurn);
      }
      return out2;
    }
    const out = [];
    for (let i = 0; i < this.order.length; i += 1) {
      const materialized = this.frozen[i];
      if (materialized !== null) {
        out.push(materialized);
        continue;
      }
      const builder = this.builders.get(this.order[i]);
      if (builder === void 0) continue;
      out.push(this.materializeTurn(builder, i));
    }
    let counter = this.order.length;
    for (const pending of this.pendingUser) {
      const builder = newBuilder(null);
      builder.input = pending.text;
      builder.inputSeq = pending.seq;
      appendItem(builder, { kind: "input", seq: pending.seq, text: pending.text, preview: compact(pending.text) });
      out.push(finishBuilder(builder, counter, pending.seq));
      counter += 1;
    }
    return out;
  }
  /** Incrementally maintained step statistics (total / failed / by-tool). */
  stats() {
    const tools = [...this.byTool.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    return { total: this.total, failed: this.failed, tools };
  }
  // ── turn-mode application (mirrors foldTurns' switch verbatim) ─────────
  builderOf(turn) {
    let builder = this.builders.get(turn);
    if (builder === void 0) {
      builder = newBuilder(turn);
      builder.position = this.order.length;
      this.builders.set(turn, builder);
      this.order.push(turn);
      this.frozen.push(null);
    }
    return builder;
  }
  markDirty(builder) {
    if (this.mode === "user") {
      const closedAt = this.userClosedBuilders.indexOf(builder);
      if (closedAt >= 0) {
        this.userClosed[closedAt] = finishUserTurn(builder, closedAt);
        return;
      }
      if (builder === this.userActive) this.userActiveTurn = null;
      return;
    }
    const position = builder.position;
    if (position !== void 0 && position >= 0 && position < this.frozen.length) {
      this.frozen[position] = null;
    }
  }
  addStep(builder, item) {
    appendItem(builder, item);
    this.total += 1;
    if (item.step.kind === "error") this.failed += 1;
    else this.byTool.set(item.step.name, (this.byTool.get(item.step.name) ?? 0) + 1);
    this.markDirty(builder);
  }
  materializeTurn(builder, position) {
    const boundarySeq = builder.startSeq !== null ? builder.startSeq : builder.inputSeq ?? firstItemSeq(builder.items);
    const materialized = finishBuilder(builder, position, boundarySeq);
    this.frozen[position] = materialized;
    return materialized;
  }
  applyTurnEvent(type, data, seq, time, surfaceOp) {
    switch (type) {
      case "turn/start": {
        const raw = data.turn;
        if (typeof raw !== "number") break;
        const builder = this.builderOf(raw);
        if (builder.startSeq === null) builder.startSeq = seq;
        if (builder.startedAt === void 0) builder.startedAt = time;
        for (const pending of this.pendingUser.splice(0)) {
          builder.input = pending.text;
          builder.inputSeq = pending.seq;
          builder.items.unshift({ kind: "input", seq: pending.seq, text: pending.text, preview: compact(pending.text) });
        }
        this.current = builder;
        this.markDirty(builder);
        break;
      }
      case "turn/end": {
        const raw = data.turn;
        const target = typeof raw === "number" ? this.builderOf(raw) : this.current;
        if (target !== null) {
          target.endSeq = seq;
          target.endedAt = time;
          this.current = null;
          this.markDirty(target);
        }
        break;
      }
      case "user/message": {
        const preview = contentPreview(data.content);
        if (preview.length === 0) break;
        const kind = sourceKindOf({ type, seq, data }, data);
        const text = typeof data.content === "string" ? data.content : typeof data.message === "object" && data.message !== null && typeof data.message.content === "string" ? data.message.content : preview;
        if (kind === "user") {
          if (this.current === null) {
            this.pendingUser.push({ seq, text });
          } else {
            this.current.input = text;
            this.current.inputSeq = seq;
            appendItem(this.current, { kind: "input", seq, text, preview });
            this.markDirty(this.current);
          }
        } else if (this.current !== null) {
          this.current.contexts.push({ seq, text, preview });
          this.markDirty(this.current);
        }
        break;
      }
      case "assistant/message": {
        const message = data.message !== null && typeof data.message === "object" ? data.message : {};
        const content = typeof message.content !== "undefined" ? message.content : data.content;
        const text = lastTextBlock(content);
        if (text.length === 0) break;
        if (this.current !== null) {
          this.current.output = text;
          this.current.outputSeq = seq;
          appendItem(this.current, { kind: "output", seq, text, preview: compact(text) });
          this.markDirty(this.current);
        }
        break;
      }
      case "tool/call": {
        if (this.current === null) break;
        this.results.applyToolCall(this.current, data, seq);
        break;
      }
      case "tool/result": {
        this.results.applyToolResult(this.current, data, seq, surfaceOp);
        break;
      }
      case "compaction/summary": {
        const preview = contentPreview(data.summary);
        if (preview.length === 0) break;
        if (this.current !== null) {
          appendItem(this.current, { kind: "compaction", seq, preview });
          this.markDirty(this.current);
        }
        break;
      }
      default:
        break;
    }
  }
  // ── user-mode application (mirrors foldByUserBoundaries verbatim) ───────
  closeUserTurn() {
    if (this.userActive === null) return;
    this.userClosed.push(finishUserTurn(this.userActive, this.userCounter));
    this.userClosedBuilders.push(this.userActive);
    this.userCounter += 1;
    this.userActive = null;
    this.userActiveTurn = null;
  }
  applyUserEvent(type, data, seq, time, surfaceOp) {
    if (type === "user/message") {
      const kind = sourceKindOf({ type, seq, data }, data);
      if (kind !== "user") return;
      this.closeUserTurn();
      const text = typeof data.content === "string" ? data.content : contentPreview(data.content);
      if (text.length === 0) return;
      const builder = newBuilder(null);
      builder.startSeq = seq;
      builder.startedAt = time;
      builder.input = text;
      builder.inputSeq = seq;
      appendItem(builder, { kind: "input", seq, text, preview: compact(text) });
      this.userActive = builder;
      this.userActiveTurn = null;
      return;
    }
    if (this.userActive === null) return;
    if (type === "assistant/message") {
      const message = data.message !== null && typeof data.message === "object" ? data.message : {};
      const text = lastTextBlock(message.content ?? data.content);
      if (text.length === 0) return;
      this.userActive.output = text;
      this.userActive.outputSeq = seq;
      appendItem(this.userActive, { kind: "output", seq, text, preview: compact(text) });
      this.userActiveTurn = null;
      return;
    }
    if (type === "tool/call") {
      this.results.applyToolCall(this.userActive, data, seq);
      return;
    }
    if (type === "tool/result") {
      this.results.applyToolResult(this.userActive, data, seq, surfaceOp);
      return;
    }
  }
  /**
   * A turn/start arrived after user-boundary turns were folded. Reconstruct
   * what a from-scratch turn-mode fold of the consumed prefix would hold:
   * every user input becomes a pending input (in arrival order), and the
   * pre-turn outputs / tool steps are dropped — turn-mode replay attaches
   * nothing while no turn is open. Statistics reset accordingly.
   */
  flipToTurnMode() {
    const pending = [];
    const take = (turn) => {
      for (const item of turn.items) {
        if (item.kind === "input") {
          pending.push({ seq: item.seq, text: item.text });
          return;
        }
      }
    };
    for (const turn of this.userClosed) take(turn);
    if (this.userActive !== null && this.userActive.inputSeq !== null) {
      pending.push({ seq: this.userActive.inputSeq, text: this.userActive.input });
    }
    this.userClosed.length = 0;
    this.userClosedBuilders.length = 0;
    this.userActive = null;
    this.userActiveTurn = null;
    this.userCounter = 0;
    this.pendingUser.length = 0;
    this.pendingUser.push(...pending);
    this.total = 0;
    this.failed = 0;
    this.byTool.clear();
    this.results.reset();
    this.mode = "turn";
  }
};

// src/client/locales.ts
function detectLang() {
  if (typeof navigator === "undefined") return "en";
  const raw = navigator.language ?? "";
  return raw.toLowerCase().startsWith("zh") ? "zh" : "en";
}
var zh = {
  tabTitle: "\u8F6E\u6B21\u8F68\u8FF9",
  turnsCount: (n) => `${n} \u8F6E`,
  followLatest: "\u8DDF\u968F\u6700\u65B0",
  followPaused: "\u5DF2\u6682\u505C\u8DDF\u968F",
  newUpdates: "\u6709\u65B0\u66F4\u65B0 \u2193",
  filterAll: "\u5168\u90E8",
  filterFailed: "\u5931\u8D25",
  filterMore: "\u66F4\u591A",
  clearFilter: "\u6E05\u7A7A\u7B5B\u9009",
  emptyNoTurns: "\u4F1A\u8BDD\u8FD8\u6CA1\u6709\u8F6E\u6B21",
  emptyFiltered: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u7684\u6B65\u9AA4",
  loadFailed: "\u4F1A\u8BDD\u6570\u636E\u52A0\u8F7D\u5931\u8D25",
  loading: "\u6B63\u5728\u52A0\u8F7D\u4F1A\u8BDD\u6570\u636E\u2026",
  retry: "\u91CD\u8BD5",
  stepsCount: (n) => `${n} \u6B65\u9AA4`,
  toolCalls: (n) => `${n} \u6B21\u8C03\u7528`,
  input: "\u8F93\u5165",
  output: "\u8F93\u51FA",
  context: "\u4E0A\u4E0B\u6587",
  contextCount: (n) => `${n} \u6761`,
  compaction: "\u538B\u7F29\u68C0\u67E5\u70B9",
  compactionTag: "\u538B\u7F29",
  jumpProgress: (n) => `\u6B63\u5728\u5B9A\u4F4D\u66F4\u65E9\u7684\u5BF9\u8BDD\uFF08\u5DF2\u52A0\u8F7D ${n} \u9875\uFF09\u2026`,
  jumpDone: "\u5DF2\u5B9A\u4F4D",
  jumpFailed: "\u65E0\u6CD5\u5B9A\u4F4D\u8BE5\u6D88\u606F",
  jumpTrajectory: "\u5DF2\u5728\u8F68\u8FF9\u89C6\u56FE\u5B9A\u4F4D",
  previewExpand: "\u5C55\u5F00",
  previewClose: "\u5173\u95ED",
  previewTitle: (label) => label,
  copyTurn: "\u590D\u5236\u672C\u8F6E",
  copied: "\u5DF2\u590D\u5236",
  running: "\u8FDB\u884C\u4E2D",
  error: "\u9519\u8BEF",
  turnPrefix: (n) => `\u8F6E\u6B21 ${n}`,
  expandAll: "\u5C55\u5F00\u5168\u90E8",
  collapseAll: "\u5168\u90E8\u6298\u53E0",
  locate: "\u5B9A\u4F4D",
  stepsLabel: "\u5DE5\u5177\u6B65\u9AA4\u6570",
  filterCollapse: "\u6536\u8D77",
  showEarlierSteps: (n) => `\u663E\u793A\u66F4\u65E9 ${n} \u6761`,
  detailParams: "\u53C2\u6570",
  detailResult: "\u7ED3\u679C",
  detailRaw: "\u539F\u59CB",
  detailRender: "\u6E32\u67D3",
  detailSource: "\u539F\u6587",
  detailAria: (name) => `${name} \u8BE6\u60C5`,
  copyField: "\u590D\u5236",
  copyDetail: "\u590D\u5236\u5168\u90E8",
  copiedDone: "\u5DF2\u590D\u5236",
  expandLabel: "\u5C55\u5F00",
  collapseLabel: "\u6536\u8D77",
  locateInChat: "\u5728\u5BF9\u8BDD\u4E2D\u5B9A\u4F4D",
  fullPill: "\u5B8C\u6574",
  truncatedPill: "\u5DF2\u622A\u65AD",
  showAllLines: (arg) => `\u5C55\u5F00\u5168\u90E8\uFF08${arg}\uFF09`,
  jsonTooLarge: "\u5BF9\u8C61\u8FC7\u5927\uFF0C\u5DF2\u6298\u53E0",
  resultEmpty: "\u8BE5\u8C03\u7528\u6CA1\u6709\u8FD4\u56DE\u5185\u5BB9",
  resultUnparsable: "\u7ED3\u679C\u65E0\u6CD5\u89E3\u6790\uFF0C\u5DF2\u6309\u539F\u6587\u663E\u793A",
  resultReplaced: (n) => `\u5DF2\u88AB\u538B\u7F29\u66FF\u6362\uFF08seq #${n}\uFF09`,
  imageLabel: (name) => `\u56FE\u7247\uFF1A${name}`,
  imageMeta: (w, h, size) => `${w}\xD7${h} \xB7 ${size}`,
  orphanResult: "\u672A\u5339\u914D\u5230\u8C03\u7528\uFF08\u5B64\u7ACB\u7ED3\u679C\uFF09",
  markdownFallback: "\u672A\u627E\u5230 Markdown \u6E32\u67D3\u5668\uFF0C\u5DF2\u6309\u539F\u6587\u663E\u793A",
  loadMore: "\u8F7D\u5165\u66F4\u591A",
  codeLabel: "\u4EE3\u7801",
  wrapLabel: "\u81EA\u52A8\u6362\u884C",
  unwrapLabel: "\u4E0D\u6362\u884C",
  footnotes: "\u811A\u6CE8",
  imageLoadFailed: "\u56FE\u7247\u52A0\u8F7D\u5931\u8D25\uFF0C\u4EC5\u663E\u793A\u5143\u6570\u636E",
  detailLoading: "\u8F7D\u5165\u5B8C\u6574\u5185\u5BB9\u2026",
  detailLoadFailed: "\u5B8C\u6574\u5185\u5BB9\u52A0\u8F7D\u5931\u8D25\uFF0C\u5F53\u524D\u663E\u793A\u622A\u65AD\u9884\u89C8",
  detailRetry: "\u91CD\u8BD5",
  detailLoadedFull: "\u5DF2\u8F7D\u5165\u5B8C\u6574\u5185\u5BB9",
  mergedNoSurfaceOp: (n) => `\u8BE5\u5185\u5BB9\u7531 ${n} \u6761\u7ED3\u679C\u5408\u5E76\uFF0C\u4E8B\u4EF6\u672A\u58F0\u660E surfaceOp`,
  zoomOpen: "\u653E\u5927\u67E5\u770B",
  zoomTitle: (name) => `${name} \xB7 \u6B65\u9AA4\u8BE6\u60C5`,
  zoomClose: "\u5173\u95ED",
  zoomSearch: "\u641C\u7D22\u6B65\u9AA4",
  zoomNoMatch: "\u65E0\u5339\u914D\u6B65\u9AA4",
  zoomExport: "\u5BFC\u51FA JSON",
  zoomHint: "Esc \u5173\u95ED \xB7 \u2191\u2193 \u5207\u6B65 \xB7 \u2318F \u641C\u7D22"
};
var en = {
  tabTitle: "Turn Outline",
  turnsCount: (n) => `${n} turns`,
  followLatest: "Follow latest",
  followPaused: "Follow paused",
  newUpdates: "New updates \u2193",
  filterAll: "All",
  filterFailed: "Failed",
  filterMore: "More",
  clearFilter: "Clear filter",
  emptyNoTurns: "No turns in this session yet",
  emptyFiltered: "No steps match the filter",
  loadFailed: "Failed to load session data",
  loading: "Loading session data\u2026",
  retry: "Retry",
  stepsCount: (n) => `${n} steps`,
  toolCalls: (n) => `${n} calls`,
  input: "Input",
  output: "Output",
  context: "Context",
  contextCount: (n) => `${n} items`,
  compaction: "Compaction checkpoint",
  compactionTag: "Fold",
  jumpProgress: (n) => `Locating earlier conversation (loaded ${n} page${n === 1 ? "" : "s"})\u2026`,
  jumpDone: "Located",
  jumpFailed: "Could not locate that message",
  jumpTrajectory: "Located in the trajectory view",
  previewExpand: "Expand",
  previewClose: "Close",
  previewTitle: (label) => label,
  copyTurn: "Copy turn",
  copied: "Copied",
  running: "running",
  error: "error",
  turnPrefix: (n) => `Turn ${n}`,
  expandAll: "Expand all",
  collapseAll: "Collapse all",
  locate: "Locate",
  stepsLabel: "tool steps",
  filterCollapse: "Collapse",
  showEarlierSteps: (n) => `Show ${n} earlier`,
  detailParams: "Params",
  detailResult: "Result",
  detailRaw: "Raw",
  detailRender: "Rendered",
  detailSource: "Source",
  detailAria: (name) => `${name} details`,
  copyField: "Copy",
  copyDetail: "Copy all",
  copiedDone: "Copied",
  expandLabel: "Expand",
  collapseLabel: "Collapse",
  locateInChat: "Locate in chat",
  fullPill: "Full",
  truncatedPill: "Truncated",
  showAllLines: (arg) => `Show all (${arg})`,
  jsonTooLarge: "Object too large, collapsed",
  resultEmpty: "This call returned no content",
  resultUnparsable: "Could not parse the result \u2014 showing raw text",
  resultReplaced: (n) => `Replaced by compaction (seq #${n})`,
  imageLabel: (name) => `Image: ${name}`,
  imageMeta: (w, h, size) => `${w}\xD7${h} \xB7 ${size}`,
  orphanResult: "No matching call (orphan result)",
  markdownFallback: "Markdown renderer unavailable \u2014 showing raw text",
  loadMore: "Load more",
  codeLabel: "Code",
  wrapLabel: "Wrap",
  unwrapLabel: "No wrap",
  footnotes: "Footnotes",
  imageLoadFailed: "Image failed to load \u2014 metadata only",
  detailLoading: "Loading full content\u2026",
  detailLoadFailed: "Failed to load full content \u2014 showing the truncated preview",
  detailRetry: "Retry",
  detailLoadedFull: "Full content loaded",
  mergedNoSurfaceOp: (n) => `Merged from ${n} results \u2014 the events declared no surfaceOp`,
  zoomOpen: "Open zoomed view",
  zoomTitle: (name) => `${name} \xB7 step details`,
  zoomClose: "Close",
  zoomSearch: "Search steps",
  zoomNoMatch: "No matching step",
  zoomExport: "Export JSON",
  zoomHint: "Esc close \xB7 \u2191\u2193 step \xB7 \u2318F search"
};
var dicts = { zh, en };
function t(lang, key) {
  return dicts[lang][key];
}

// src/client/useTrail.ts
var React = __toESM(require("react"), 1);
var MAX_PULL_PAGES = 64;
function fetchTrailEvents(sessionId, afterSeq, base) {
  const url = new URL("/trace-inspect/api/events", base ?? window.location.origin);
  return fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sessionId, afterSeq })
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok || data === null || typeof data !== "object" || !Array.isArray(data.events)) {
      throw new Error(data !== null && typeof data === "object" && typeof data.error === "string" ? data.error : `HTTP ${response.status}`);
    }
    return { events: data.events, hasMore: data.hasMore === true };
  });
}
var EMPTY = [];
var EMPTY_STATS = { total: 0, failed: 0, tools: [] };
async function fetchToolDetail(sessionId, seqs, signal) {
  if (seqs.length === 0) return { ok: true, items: [] };
  if (typeof fetch !== "function" || typeof window === "undefined") return { ok: false, reason: "unavailable" };
  try {
    const url = new URL("/trace-inspect/api/tool-detail", window.location.origin);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sessionId, seqs }),
      ...signal !== void 0 ? { signal } : {}
    });
    if (!response.ok) return { ok: false, reason: "http" };
    const data = await response.json();
    if (data === null || typeof data !== "object" || !Array.isArray(data.items)) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, items: data.items };
  } catch {
    return { ok: false, reason: "network" };
  }
}
function useTrail(sessionId, visible, fetchEvents, sessionsService) {
  const [turns, setTurns] = React.useState(EMPTY);
  const [stats, setStats] = React.useState(EMPTY_STATS);
  const [status, setStatus] = React.useState("idle");
  const [error, setError] = React.useState(null);
  const folderRef = React.useRef(null);
  const seqRef = React.useRef(0);
  const sessionIdRef = React.useRef(sessionId);
  const fetchRef = React.useRef(fetchEvents);
  const requestGen = React.useRef(0);
  const lastPullAt = React.useRef(0);
  const throttleTimer = React.useRef(null);
  const visibleRef = React.useRef(visible);
  const schedulePullRef = React.useRef(null);
  React.useEffect(() => {
    fetchRef.current = fetchEvents;
  }, [fetchEvents]);
  React.useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);
  React.useEffect(() => () => {
    if (throttleTimer.current !== null) window.clearTimeout(throttleTimer.current);
    schedulePullRef.current = null;
  }, []);
  const pull = React.useCallback(async () => {
    const generation = ++requestGen.current;
    const sid = sessionIdRef.current;
    const seqBefore = seqRef.current;
    let drainCapped = false;
    try {
      for (let page = 0; page < MAX_PULL_PAGES; page += 1) {
        const { events, hasMore } = await fetchRef.current(sid, seqRef.current);
        if (generation !== requestGen.current || sid !== sessionIdRef.current) return;
        if (events.length > 0) {
          let folder = folderRef.current;
          if (folder === null) folder = folderRef.current = new TrailFolder();
          let anyPushed = false;
          for (const event of events) {
            const before = folder.latestSeq;
            folder.push(event);
            if (folder.latestSeq !== before) anyPushed = true;
          }
          if (anyPushed) {
            const last = events[events.length - 1];
            if (typeof last.seq === "number" && last.seq > seqRef.current) seqRef.current = last.seq;
            setTurns(folder.snapshot());
            setStats(folder.stats());
          }
        }
        if (hasMore !== true || events.length === 0) {
          drainCapped = false;
          break;
        }
        drainCapped = page === MAX_PULL_PAGES - 1;
      }
      setError(null);
      setStatus("ready");
      if (drainCapped && seqRef.current !== seqBefore && generation === requestGen.current && sid === sessionIdRef.current && visibleRef.current && schedulePullRef.current !== null) {
        schedulePullRef.current();
      }
    } catch (reason) {
      if (generation !== requestGen.current) return;
      setError(reason instanceof Error ? reason.message : String(reason));
      setStatus((current) => current === "ready" ? current : "error");
    }
  }, []);
  const refresh = React.useCallback(() => {
    void pull();
  }, [pull]);
  const schedulePull = React.useCallback(() => {
    const MIN_GAP = 120;
    const now = Date.now();
    const since = now - lastPullAt.current;
    if (since >= MIN_GAP) {
      lastPullAt.current = now;
      void pull();
      return;
    }
    if (throttleTimer.current !== null) return;
    throttleTimer.current = window.setTimeout(() => {
      throttleTimer.current = null;
      lastPullAt.current = Date.now();
      void pull();
    }, MIN_GAP - since);
  }, [pull]);
  React.useEffect(() => {
    schedulePullRef.current = schedulePull;
  }, [schedulePull]);
  React.useEffect(() => {
    sessionIdRef.current = sessionId;
    folderRef.current = null;
    seqRef.current = 0;
    setTurns(EMPTY);
    setStats(EMPTY_STATS);
    setError(null);
    setStatus(sessionId.length > 0 ? "loading" : "idle");
  }, [sessionId]);
  React.useEffect(() => {
    if (sessionId.length === 0 || !visible) return void 0;
    void pull();
    const binding = sessionsService?.binding(sessionId);
    const disposers = [];
    const session = binding !== void 0 && binding.session !== void 0 ? binding.session : void 0;
    if (session !== void 0 && typeof session.subscribe === "function") {
      disposers.push(session.subscribe(() => {
        schedulePull();
      }));
    }
    const eventSource = binding !== void 0 ? binding.eventSource : void 0;
    if (eventSource !== void 0 && typeof eventSource.subscribe === "function") {
      try {
        disposers.push(eventSource.subscribe(() => {
          schedulePull();
        }));
      } catch {
      }
    }
    if (disposers.length === 0) return void 0;
    return () => {
      for (const dispose of disposers) dispose();
    };
  }, [sessionId, visible, pull, schedulePull, sessionsService]);
  return { turns, stats, status, error, refresh };
}

// src/client/trail-jump.ts
function targetSnapshot(conversation, name) {
  try {
    const target = conversation.target(name);
    return target !== void 0 ? target.getSnapshot() : void 0;
  } catch {
    return void 0;
  }
}
function viewStateForJump(session, conversation) {
  const snapshot = session.getSnapshot();
  let chatNodes;
  let trajectoryView;
  if (conversation !== void 0) {
    const chat = targetSnapshot(conversation, "chat");
    if (chat !== null && typeof chat === "object" && chat.nodes !== void 0 && chat.nodes !== null) {
      chatNodes = chat.nodes;
    }
    const trajectory = targetSnapshot(conversation, "trajectory");
    if (trajectory !== null && typeof trajectory === "object") trajectoryView = trajectory;
  }
  if (chatNodes === void 0) chatNodes = snapshot.chat?.nodes;
  if (trajectoryView === void 0 && snapshot.views !== void 0 && typeof snapshot.views.get === "function") {
    const legacy = snapshot.views.get("trajectory");
    if (legacy !== null && typeof legacy === "object") trajectoryView = legacy;
  }
  return { hasMore: snapshot.hasMore === true, chatNodes, trajectoryView };
}
function hasSeqInWindow(view, seq) {
  const store = view.chatNodes;
  if (store === void 0 || typeof store.values !== "function") return false;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const node of store.values()) {
    if (node === null || typeof node !== "object" || typeof node.anchorSeq !== "number") continue;
    if (node.anchorSeq < min) min = node.anchorSeq;
    if (node.anchorSeq > max) max = node.anchorSeq;
  }
  return min <= seq && seq <= max;
}
function findNodeForSeq(view, seq) {
  const store = view.chatNodes;
  if (store === void 0 || typeof store.values !== "function") return null;
  let exact = null;
  let next = null;
  let prev = null;
  for (const node of store.values()) {
    if (node === null || typeof node !== "object" || node.visibility === "hidden") continue;
    const anchor = node.anchorSeq;
    if (typeof anchor !== "number") continue;
    if (Math.abs(anchor - seq) < 0.5) {
      if (exact === null) exact = node;
      continue;
    }
    if (anchor >= seq && (next === null || anchor < next.anchorSeq)) next = node;
    if (anchor <= seq && (prev === null || anchor > prev.anchorSeq)) prev = node;
  }
  return exact !== null ? exact : next !== null ? next : prev;
}
function isTrajectoryViewActive(document2) {
  return document2.querySelector("[data-trajectory-scroll]") !== null;
}
function trajectoryRecordIdsFor(item, trajectoryView) {
  if (trajectoryView === null || typeof trajectoryView !== "object") return [];
  const view = trajectoryView;
  const nodes = Array.isArray(view.eventNodes) ? view.eventNodes : [];
  const requests = Array.isArray(view.requests) ? view.requests : [];
  const nodeWithKind = (kinds, seq) => {
    const matches = nodes.filter((node) => node !== null && typeof node === "object" && kinds.includes(String(node.kind)) && typeof node.seq === "number");
    return matches.find((node) => node.seq === seq) ?? matches.filter((node) => node.seq >= seq).sort((a, b) => a.seq - b.seq)[0];
  };
  if (item.kind === "user" || item.kind === "context" || item.kind === "input") {
    const target = nodeWithKind(["user", "steering", "context"], item.seq);
    if (target === void 0 || typeof target.seq !== "number") return [];
    const rowKind = target.kind === "steering" ? "user" : target.kind;
    return [`${rowKind}\0seq\0${target.seq}`];
  }
  if (item.kind === "assistant" || item.kind === "output") {
    const target = nodeWithKind(["assistant"], item.seq);
    if (target === void 0 || typeof target.seq !== "number") return [];
    const ids = [];
    if (typeof target.turn === "number" && typeof target.step === "number") {
      ids.push(`assistant\0${target.turn}\0${target.step}`);
    }
    ids.push(`assistant\0seq\0${target.seq}`);
    return ids;
  }
  if (item.kind === "tool" || item.kind === "error") {
    if (typeof item.callId === "string" && item.callId.length > 0) return [`tool\0call\0${item.callId}`];
    const target = nodeWithKind(["tool-result"], item.seq);
    if (target === void 0 || typeof target.callId !== "string") return [];
    return [`tool\0call\0${target.callId}`];
  }
  if (item.kind === "compaction") {
    const compactions = [];
    for (const request of requests) {
      if (request === null || typeof request !== "object") continue;
      const record2 = request;
      if (record2.purpose === "compaction" && typeof record2.startSeq === "number") {
        compactions.push({ purpose: record2.purpose, startSeq: record2.startSeq, resultSeq: typeof record2.resultSeq === "number" ? record2.resultSeq : void 0 });
      }
    }
    const target = compactions.find((request) => request.resultSeq === item.seq) ?? compactions.filter((request) => (request.resultSeq ?? -1) >= item.seq).sort((a, b) => (a.resultSeq ?? -1) - (b.resultSeq ?? -1))[0];
    if (target === void 0) return [];
    return [`compacted\0seq\0${target.startSeq}`];
  }
  return [];
}
function findTrajectoryRowByKeys(document2, keys) {
  if (keys.length === 0) return null;
  for (const key of keys) {
    const encoded = encodeURIComponent(key);
    const rows = document2.querySelectorAll("tr[data-trajectory-row-key]");
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const value = row.dataset !== void 0 ? row.dataset.trajectoryRowKey : void 0;
      if (value === encoded || value === key) return row;
    }
  }
  return null;
}
function findTrajectoryRowBySeq(document2, item) {
  const rows = document2.querySelectorAll("tr[data-trajectory-row-key]");
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const raw = row.dataset.trajectoryRowKey ?? "";
    let id = "";
    try {
      id = decodeURIComponent(raw);
    } catch {
      continue;
    }
    if (id.includes(`\0seq\0${item.seq}`)) return row;
    if (typeof item.callId === "string" && id.includes(`\0call\0${item.callId}`)) return row;
  }
  return null;
}
function expandCollapsedSummaries(document2) {
  const rows = document2.querySelectorAll("tr[data-collapsed-summary]");
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (typeof row.click === "function") row.click();
  }
}
function waitForNextFrame() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      resolve();
    }
  });
}
function findChatRow(document2, key) {
  const exact = document2.querySelector(`[data-chat-anchor-key="${cssEscape(key)}"]`);
  if (exact !== null) return exact;
  const rows = document2.querySelectorAll("[data-chat-node-key],[data-chat-anchor-key]");
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.dataset !== void 0 && (row.dataset.chatNodeKey === key || row.dataset.chatAnchorKey === key)) return row;
  }
  return null;
}
function isHiddenInTree(row) {
  let el = row;
  while (el !== null && el !== void 0) {
    if (typeof el.hasAttribute === "function" && el.hasAttribute("hidden")) return true;
    el = el.parentElement;
  }
  return false;
}
function dispatchBeforematchUp(row) {
  let el = row;
  while (el !== null && el !== void 0) {
    if (typeof el.hasAttribute === "function" && el.hasAttribute("hidden") && typeof el.dispatchEvent === "function" && typeof Event === "function") {
      try {
        el.dispatchEvent(new Event("beforematch"));
      } catch {
      }
    }
    el = el.parentElement;
  }
}
async function revealRowUntilVisible(row, frames = 10) {
  if (!isHiddenInTree(row)) return true;
  for (let index = 0; index < frames; index += 1) {
    dispatchBeforematchUp(row);
    await waitForNextFrame();
    if (!isHiddenInTree(row)) return true;
  }
  return !isHiddenInTree(row);
}
async function jumpToItem(session, item, options) {
  const guard = Number.isFinite(Number(options.guard)) && (options.guard ?? 0) > 0 ? Math.min(500, Math.max(1, Math.floor(options.guard ?? 200))) : 200;
  const document2 = options.document;
  try {
    let view = viewStateForJump(session, options.conversation);
    const trajectoryActive = isTrajectoryViewActive(document2);
    if (trajectoryActive) {
      let keys = trajectoryRecordIdsFor(item, view.trajectoryView);
      let row2 = findTrajectoryRowByKeys(document2, keys);
      let pages2 = 0;
      if (row2 === null && view.hasMore) {
        while (view.hasMore && pages2 < guard) {
          await session.loadOlder();
          view = viewStateForJump(session, options.conversation);
          pages2 += 1;
          options.onProgress?.(pages2);
        }
        keys = trajectoryRecordIdsFor(item, view.trajectoryView);
        row2 = findTrajectoryRowByKeys(document2, keys);
      }
      if (row2 === null) {
        expandCollapsedSummaries(document2);
        await waitForNextFrame();
        keys = trajectoryRecordIdsFor(item, view.trajectoryView);
        row2 = findTrajectoryRowByKeys(document2, keys);
      }
      if (row2 === null) {
        row2 = findTrajectoryRowBySeq(document2, item);
      }
      if (row2 === null) return { ok: false, error: "trajectory-row-not-rendered" };
      row2.scrollIntoView({ behavior: "smooth", block: "center" });
      return { ok: true, mode: "trajectory" };
    }
    let pages = 0;
    if (!hasSeqInWindow(view, item.seq) && typeof session.loadThrough === "function") {
      await session.loadThrough(item.seq);
      await waitForNextFrame();
      await waitForNextFrame();
      view = viewStateForJump(session, options.conversation);
    }
    while (view.hasMore && !hasSeqInWindow(view, item.seq) && pages < guard) {
      await session.loadOlder();
      view = viewStateForJump(session, options.conversation);
      pages += 1;
      options.onProgress?.(pages);
    }
    let node = findNodeForSeq(view, item.seq);
    let nodeRetries = 0;
    while (node === null && nodeRetries < 6) {
      await waitForNextFrame();
      view = viewStateForJump(session, options.conversation);
      node = findNodeForSeq(view, item.seq);
      nodeRetries += 1;
    }
    if (node === null) return { ok: false, error: "seq-not-rendered" };
    let row = findChatRow(document2, node.key);
    let retries = 0;
    while (row === null && retries < 6) {
      await waitForNextFrame();
      row = findChatRow(document2, node.key);
      retries += 1;
    }
    if (row === null) return { ok: false, error: "row-not-in-chat-view" };
    if (!await revealRowUntilVisible(row)) return { ok: false, error: "row-hidden" };
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    if (row.classList !== void 0 && typeof row.classList.add === "function") {
      row.classList.add("ttl-flash");
    }
    return { ok: true, mode: "chat" };
  } catch (reason) {
    return { ok: false, error: reason instanceof Error ? reason.message : String(reason) };
  }
}
function cssEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

// src/client/json-tree.tsx
var React2 = __toESM(require("react"), 1);
var STRING_BOX_CHARS = 240;
var DEFAULT_MAX_DEPTH = 32;
var DEFAULT_PAGE_SIZE = 50;
var DEFAULT_MAX_NODES = 2e3;
var ROOT_PATH = "root";
var PATH_SEP = "";
function parseJsonLoose(text) {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (trimmed.length === 0) return { ok: false };
  const direct = tryJson(trimmed);
  if (direct.ok) return direct;
  const fenced = stripFence(trimmed);
  if (fenced !== null) {
    const parsed = tryJson(fenced);
    if (parsed.ok) return parsed;
  }
  const loosened = trimmed.replace(/,\s*([}\]])/g, "$1");
  if (loosened !== trimmed) {
    const parsed = tryJson(loosened);
    if (parsed.ok) return parsed;
  }
  return { ok: false };
}
function tryJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}
function stripFence(text) {
  const closed = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(text);
  if (closed !== null) return (closed[1] ?? "").trim();
  if (!text.startsWith("```")) return null;
  const firstBreak = text.indexOf("\n");
  return firstBreak === -1 ? null : text.slice(firstBreak + 1).trim();
}
function countNodes(value, limit, maxDepth) {
  const ancestors = /* @__PURE__ */ new WeakSet();
  let count = 0;
  const walk = (node, depth) => {
    count += 1;
    if (count > limit) return;
    if (node === null || typeof node !== "object") return;
    if (depth >= maxDepth) return;
    if (ancestors.has(node)) return;
    ancestors.add(node);
    const children = Array.isArray(node) ? node : Object.values(node);
    for (const child of children) {
      walk(child, depth + 1);
      if (count > limit) return;
    }
    ancestors.delete(node);
  };
  walk(value, 0);
  return count;
}
function copyText(text) {
  if (typeof navigator === "undefined") return;
  const clipboard = navigator.clipboard;
  if (clipboard === void 0 || typeof clipboard.writeText !== "function") return;
  try {
    const pending = clipboard.writeText(text);
    if (pending !== null && typeof pending === "object" && typeof pending.catch === "function") {
      void pending.catch(() => void 0);
    }
  } catch {
  }
}
function JsonTree(props) {
  const {
    value,
    maxDepth = DEFAULT_MAX_DEPTH,
    pageSize = DEFAULT_PAGE_SIZE,
    maxNodes = DEFAULT_MAX_NODES
  } = props;
  const lang = detectLang();
  const capped = React2.useMemo(
    () => countNodes(value, maxNodes, maxDepth) > maxNodes,
    [value, maxNodes, maxDepth]
  );
  const [openPaths, setOpenPaths] = React2.useState(
    () => /* @__PURE__ */ new Set([ROOT_PATH])
  );
  const [pageCounts, setPageCounts] = React2.useState(
    () => /* @__PURE__ */ new Map()
  );
  const onToggle = React2.useCallback((path, open) => {
    setOpenPaths((current) => {
      if (current.has(path) === open) return current;
      const next = new Set(current);
      if (open) next.add(path);
      else next.delete(path);
      return next;
    });
  }, []);
  const onMore = React2.useCallback((path) => {
    setPageCounts((current) => {
      const next = new Map(current);
      next.set(path, (next.get(path) ?? 1) + 1);
      return next;
    });
  }, []);
  return /* @__PURE__ */ React2.createElement("div", { className: "ttl-json", "data-testid": "ttl-json" }, capped ? /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonCapped", "data-testid": "ttl-json-capped" }, t(lang, "jsonTooLarge")) : /* @__PURE__ */ React2.createElement(
    JsonNode,
    {
      value,
      keyName: null,
      path: ROOT_PATH,
      depth: 0,
      maxDepth,
      pageSize,
      lang,
      seen: /* @__PURE__ */ new WeakSet(),
      openPaths,
      pageCounts,
      onToggle,
      onMore
    }
  ));
}
function JsonNode(props) {
  const {
    value,
    keyName,
    path,
    depth,
    maxDepth,
    pageSize,
    lang,
    seen,
    openPaths,
    pageCounts,
    onToggle,
    onMore
  } = props;
  const keyEl = keyName === null ? null : /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonKey" }, keyName);
  if (value === null) {
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonNull" }, "null"));
  }
  if (typeof value === "boolean") {
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonBool" }, String(value)));
  }
  if (typeof value === "number") {
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonNum" }, String(value)));
  }
  if (typeof value === "string") {
    if (value.length > STRING_BOX_CHARS) {
      return /* @__PURE__ */ React2.createElement(StringNode, { keyName, text: value, lang });
    }
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonStr" }, value));
  }
  if (typeof value !== "object") {
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonNull" }, String(value)));
  }
  if (depth >= maxDepth) {
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonMore" }, "\u2026"));
  }
  if (seen.has(value)) {
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonNull" }, "[Circular]"));
  }
  if (!openPaths.has(path)) {
    const count = Array.isArray(value) ? value.length : Object.keys(value).length;
    return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        className: "ttl-jsonToggle",
        "data-testid": "ttl-json-toggle",
        "aria-expanded": false,
        onClick: () => onToggle(path, true)
      },
      "\u25B8"
    ), keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonPreview" }, Array.isArray(value) ? `[${count}]` : `{${count}}`));
  }
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
  const pages = pageCounts.get(path) ?? 1;
  const shown = entries.slice(0, pageSize * pages);
  const hasMore = entries.length > shown.length;
  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`;
  seen.add(value);
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      className: "ttl-jsonToggle",
      "data-testid": "ttl-json-toggle",
      "aria-expanded": true,
      onClick: () => onToggle(path, false)
    },
    "\u25BE"
  ), keyEl, /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonPreview" }, summary)), /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonChildren" }, shown.map(([childKey, childValue]) => /* @__PURE__ */ React2.createElement(
    JsonNode,
    {
      key: childKey,
      value: childValue,
      keyName: childKey,
      path: `${path}${PATH_SEP}${childKey}`,
      depth: depth + 1,
      maxDepth,
      pageSize,
      lang,
      seen,
      openPaths,
      pageCounts,
      onToggle,
      onMore
    }
  )), hasMore ? /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      className: "ttl-jsonMore",
      "data-testid": "ttl-json-more",
      onClick: () => onMore(path)
    },
    t(lang, "loadMore")
  ) : null));
}
function StringNode(props) {
  const { keyName, text, lang } = props;
  const [copied, setCopied] = React2.useState(false);
  return /* @__PURE__ */ React2.createElement("div", { className: "ttl-jsonRow" }, keyName === null ? null : /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonKey" }, keyName), /* @__PURE__ */ React2.createElement("div", { className: "ttl-strbox", "data-testid": "ttl-strbox" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      className: "ttl-strboxCopy",
      "data-testid": "ttl-strbox-copy",
      onClick: () => {
        copyText(text);
        setCopied(true);
      }
    },
    t(lang, copied ? "copiedDone" : "copyField")
  ), /* @__PURE__ */ React2.createElement("span", { className: "ttl-jsonStr" }, text)));
}

// src/client/markdown-result.tsx
var React3 = __toESM(require("react"), 1);

// src/client/ui-primitives.ts
var cached;
var override;
function requirePrimitives() {
  try {
    if (typeof require !== "function") return null;
    const mod = require("@deepseek-ai/dsh-client-ui-primitives");
    if (mod === null || mod === void 0) return null;
    const bag = mod.MarkdownText === void 0 && mod.default !== null && typeof mod.default === "object" ? mod.default : mod;
    if (bag === null || bag === void 0) return null;
    if (bag.MarkdownText === void 0 || bag.MarkdownDelegateProvider === void 0) return null;
    return {
      MarkdownText: bag.MarkdownText,
      MarkdownDelegateProvider: bag.MarkdownDelegateProvider
    };
  } catch {
    return null;
  }
}
function loadPrimitives() {
  if (cached !== void 0) return cached;
  cached = override !== void 0 ? override : requirePrimitives();
  return cached;
}

// src/client/markdown-result.tsx
var RENDER_CAP = 64 * 1024;
var RENDERED_TOOLS = /* @__PURE__ */ new Set(["read", "web_fetch", "fetch", "glob", "grep"]);
var RAW_TOOLS = /* @__PURE__ */ new Set(["bash", "bash_output", "pwsh"]);
var ANSI_KILL_LIMIT = 3;
var MD_SIGNALS = [
  /^#{1,6} /m,
  // ATX heading
  /^```/m,
  // fenced code
  /^(?=[^\n]*\|)[\s|:-]*-{3,}[\s|:-]*$/m,
  // table separator (|---| / | --- |)
  /^[-*+] /m,
  // bullet list
  /^\d+\. /m,
  // ordered list
  /^>/m,
  // blockquote
  /\*\*[^\n*]+\*\*/,
  // bold
  /`[^`\n]+`/
  // inline code
];
var MARKDOWN_FILE_EXT = /\.(?:md|markdown|mdx)$/i;
var LINE_NUMBER_PREFIX = /^\d+: ?/;
var READ_FOOTER = /^\((?:End of file[^)]*|Showing lines \d+-\d+ of \d+[^)]*)\)$/;
var READ_ENVELOPE = /^<path>([^\n]*)<\/path>\n<type>([^\n]*)<\/type>\n<content>\n([\s\S]*)\n<\/content>$/;
function unwrapFileResult(text) {
  if (typeof text !== "string" || text.length === 0) return null;
  const match = READ_ENVELOPE.exec(text.replace(/\r\n?/g, "\n").trim());
  if (match === null) return null;
  return {
    path: (match[1] ?? "").trim(),
    type: (match[2] ?? "").trim(),
    body: stripLineNumbers(match[3] ?? "")
  };
}
function stripLineNumbers(body) {
  const lines = body.split("\n").map((line) => line.replace(LINE_NUMBER_PREFIX, ""));
  let lastNonBlank = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].trim() !== "") {
      lastNonBlank = i;
      break;
    }
  }
  if (lastNonBlank >= 0 && READ_FOOTER.test(lines[lastNonBlank].trim())) lines.splice(lastNonBlank, 1);
  return lines.join("\n");
}
function isMarkdownFileEnvelope(envelope) {
  return envelope.type.toLowerCase() === "file" && MARKDOWN_FILE_EXT.test(envelope.path);
}
function markdownInputFor(text) {
  const envelope = unwrapFileResult(text);
  if (envelope === null) return { markdown: looksLikeMarkdownText(text), source: text, unwrappedBody: null };
  if (isMarkdownFileEnvelope(envelope)) {
    return { markdown: looksLikeMarkdownText(envelope.body), source: envelope.body, unwrappedBody: envelope.body };
  }
  return { markdown: false, source: text, unwrappedBody: null };
}
function looksLikeMarkdown(text) {
  return markdownInputFor(text).markdown;
}
function looksLikeMarkdownText(text) {
  if (typeof text !== "string" || text.length === 0) return false;
  if (!MD_SIGNALS.some((signal) => signal.test(text))) return false;
  if (countOccurrences(text, "\x1B[") >= ANSI_KILL_LIMIT) return false;
  const firstLine = (text.split("\n", 1)[0] ?? "").trimStart();
  if (firstLine.startsWith("Error:") || firstLine.startsWith("Traceback")) return false;
  if (/^at\s/.test(firstLine)) return false;
  return true;
}
function countOccurrences(haystack, needle) {
  let count = 0;
  let at = haystack.indexOf(needle);
  while (at !== -1) {
    count += 1;
    at = haystack.indexOf(needle, at + needle.length);
  }
  return count;
}
function defaultViewForTool(name) {
  const normalized = typeof name === "string" ? name.trim().toLowerCase() : "";
  if (RENDERED_TOOLS.has(normalized)) return "rendered";
  if (RAW_TOOLS.has(normalized)) return "raw";
  return "raw";
}
function RawText(props) {
  const { text, className } = props;
  const merged = className === void 0 || className === "" ? "ttl-raw" : `ttl-raw ${className}`;
  return /* @__PURE__ */ React3.createElement("pre", { className: merged, "data-testid": "ttl-md-raw" }, text);
}
function MarkdownResult(props) {
  const { text, labels, openFile, renderCap = RENDER_CAP } = props;
  const lang = detectLang();
  const [showAll, setShowAll] = React3.useState(false);
  const delegateOpenFile = React3.useMemo(
    () => openFile === void 0 ? void 0 : (path, options) => openFile(path, options?.line),
    [openFile]
  );
  const primitives = loadPrimitives();
  const { markdown, source, unwrappedBody } = markdownInputFor(text);
  if (primitives === null) {
    return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(RawText, { text }), markdown ? /* @__PURE__ */ React3.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-md-fallback" }, t(lang, "markdownFallback")) : null);
  }
  if (!markdown) return /* @__PURE__ */ React3.createElement(RawText, { text: unwrappedBody ?? text });
  const capped = !showAll && renderCap > 0 && source.length > renderCap;
  const shown = capped ? source.slice(0, renderCap) : source;
  const { MarkdownText, MarkdownDelegateProvider } = primitives;
  return /* @__PURE__ */ React3.createElement(MarkdownDelegateProvider, { openFile: delegateOpenFile }, /* @__PURE__ */ React3.createElement("div", { className: "ttl-mdTableWrap" }, /* @__PURE__ */ React3.createElement("div", { className: "ttl-md", "data-testid": "ttl-md" }, /* @__PURE__ */ React3.createElement(MarkdownText, { text: shown, streaming: false, labels, variant: "compact" }))), capped ? /* @__PURE__ */ React3.createElement("div", { className: "ttl-mdTruncated", "data-testid": "ttl-md-truncated" }, /* @__PURE__ */ React3.createElement("button", { type: "button", className: "ttl-mdShowAll", onClick: () => setShowAll(true) }, t(lang, "showAllLines")(String(source.length)))) : null);
}

// src/client/markdown-labels.ts
var cache = /* @__PURE__ */ new Map();
function markdownLabels(lang) {
  const hit = cache.get(lang);
  if (hit !== void 0) return hit;
  const created = {
    code: {
      copyLabel: t(lang, "copyField"),
      copiedLabel: t(lang, "copiedDone"),
      toolbarLabels: {
        codeLabel: t(lang, "codeLabel"),
        wrapLabel: t(lang, "wrapLabel"),
        unwrapLabel: t(lang, "unwrapLabel")
      }
    },
    footnotes: t(lang, "footnotes")
  };
  cache.set(lang, created);
  return created;
}

// src/client/ZoomOverlay.tsx
var React4 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");

// src/client/attachment-url.ts
function attachmentUrl(sessionId, ref) {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) return null;
  if (ref === null || typeof ref !== "object") return null;
  const attachmentId = ref.attachmentId;
  if (typeof attachmentId !== "string" || attachmentId.length === 0) return null;
  return `/trace-inspect/api/attachment?sessionId=${encodeURIComponent(sessionId)}&attachmentId=${encodeURIComponent(attachmentId)}`;
}

// src/client/ZoomOverlay.tsx
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`;
}
function toolDotClass(name) {
  const n = name.toLowerCase();
  if (n.includes("edit") || n.includes("write") || n.includes("patch")) return "warn";
  if (n.includes("bash") || n.includes("command") || n.includes("exec") || n.includes("run")) return "success";
  return "neutral";
}
function copyToClipboard(text) {
  if (typeof navigator === "undefined") return;
  const clipboard = navigator.clipboard;
  if (clipboard === void 0 || typeof clipboard.writeText !== "function") return;
  try {
    const pending = clipboard.writeText(text);
    if (pending !== null && typeof pending === "object" && typeof pending.catch === "function") {
      void pending.catch(() => void 0);
    }
  } catch {
  }
}
function downloadJson(filename, text) {
  if (typeof document === "undefined") return;
  const blob = new Blob([text], { type: "application/json" });
  const urlApi = typeof URL === "undefined" ? void 0 : URL;
  const objectUrl = urlApi !== void 0 && typeof urlApi.createObjectURL === "function" ? urlApi.createObjectURL(blob) : null;
  const href = objectUrl ?? `data:application/json;charset=utf-8,${encodeURIComponent(text)}`;
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    if (anchor.parentNode !== null) anchor.parentNode.removeChild(anchor);
    if (objectUrl !== null && urlApi !== void 0 && typeof urlApi.revokeObjectURL === "function") {
      try {
        urlApi.revokeObjectURL(objectUrl);
      } catch {
      }
    }
  }
}
function TrailImages(props) {
  const { images, sessionId, lang } = props;
  return /* @__PURE__ */ React4.createElement("div", { className: "ttl-imgRow", "data-testid": "ttl-img-row" }, images.map((image, index) => /* @__PURE__ */ React4.createElement(ImageBlock, { key: `${image.attachmentId}:${index}`, image, sessionId, lang })));
}
var ImageBlock = React4.memo(function ImageBlock2(props) {
  const { image, sessionId, lang } = props;
  const [loadFailed, setLoadFailed] = React4.useState(false);
  const url = attachmentUrl(sessionId, image);
  const name = image.name ?? image.mediaType;
  const label = t(lang, "imageLabel")(name);
  const meta = /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("span", { className: "ttl-imgMeta" }, image.mediaType), image.width !== void 0 && image.height !== void 0 ? /* @__PURE__ */ React4.createElement("span", { className: "ttl-imgMeta" }, t(lang, "imageMeta")(
    image.width,
    image.height,
    formatBytes(image.bytes)
  )) : null);
  const showThumb = url !== null && !loadFailed;
  return /* @__PURE__ */ React4.createElement("div", { className: "ttl-imgItem", "data-testid": "ttl-img-item" }, showThumb ? /* @__PURE__ */ React4.createElement("div", { className: "ttl-imgThumbWrap", "data-testid": "ttl-img-thumb-wrap" }, /* @__PURE__ */ React4.createElement(
    "img",
    {
      "data-testid": "ttl-img-thumb",
      className: "ttl-imgThumb",
      loading: "lazy",
      src: url,
      alt: label,
      onError: () => {
        setLoadFailed(true);
      }
    }
  )) : null, /* @__PURE__ */ React4.createElement("span", { className: "ttl-imgChip", "data-testid": "ttl-img-chip" }, /* @__PURE__ */ React4.createElement("span", null, label), meta), loadFailed ? /* @__PURE__ */ React4.createElement("span", { className: "ttl-pill ttl-pillWarn", "data-testid": "ttl-img-failed" }, t(lang, "imageLoadFailed")) : null);
});
function paneTextOf(step, tab) {
  const args = step.args ?? "";
  if (tab !== "result") return args;
  const result = step.result;
  if (result === void 0) return "";
  if (result.isError || result.kind === "error" || step.kind === "error") {
    const errorName = result.errorName ?? step.name;
    const errorCode = result.errorCode ?? step.errorCode;
    const headline = errorCode !== void 0 ? `${errorName} \xB7 ${errorCode}` : errorName;
    return result.text.length > 0 ? `${headline}
${result.text}` : headline;
  }
  return result.text;
}
function exportPayloadOf(step) {
  return {
    seq: step.seq,
    callId: step.callId,
    name: step.name,
    kind: step.kind,
    arguments: step.args ?? null,
    argsBytes: step.argsBytes ?? null,
    argsTruncated: step.argsTruncated === true,
    error: step.error,
    errorCode: step.errorCode ?? null,
    result: step.result ?? null
  };
}
function ZoomOverlay(props) {
  const { steps, initialSeq, sessionId, lang, onClose } = props;
  const initial = steps.find((step) => step.seq === initialSeq) ?? steps[0] ?? null;
  const [selectedSeq, setSelectedSeq] = React4.useState(initialSeq);
  const [tab, setTab] = React4.useState(initial !== null && initial.result !== void 0 ? "result" : "params");
  const [views, setViews] = React4.useState(() => /* @__PURE__ */ new Map());
  const [query, setQuery] = React4.useState("");
  const [copied, setCopied] = React4.useState(false);
  const panelRef = React4.useRef(null);
  const searchRef = React4.useRef(null);
  const filtered = React4.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return steps;
    return steps.filter((step) => {
      const preview = step.kind === "error" ? step.error : step.argsPreview;
      return step.name.toLowerCase().includes(needle) || preview.toLowerCase().includes(needle);
    });
  }, [steps, query]);
  const current = React4.useMemo(() => {
    const inFiltered = filtered.find((step) => step.seq === selectedSeq);
    if (inFiltered !== void 0) return inFiltered;
    if (filtered.length > 0) return filtered[0];
    return steps.find((step) => step.seq === selectedSeq) ?? steps[0] ?? null;
  }, [filtered, steps, selectedSeq]);
  const onSearchChange = (value) => {
    setQuery(value);
    const needle = value.trim().toLowerCase();
    if (needle.length === 0) return;
    const matches = steps.filter((step) => {
      const preview = step.kind === "error" ? step.error : step.argsPreview;
      return step.name.toLowerCase().includes(needle) || preview.toLowerCase().includes(needle);
    });
    if (matches.length > 0 && !matches.some((step) => step.seq === selectedSeq)) {
      setSelectedSeq(matches[0].seq);
    }
  };
  React4.useEffect(() => {
    const panel = panelRef.current;
    if (panel !== null) panel.focus();
  }, []);
  const move = React4.useCallback((delta) => {
    const list = filtered.length > 0 ? filtered : steps;
    if (list.length === 0) return;
    const at = current === null ? -1 : list.findIndex((step) => step.seq === current.seq);
    const next = at === -1 ? 0 : Math.min(Math.max(at + delta, 0), list.length - 1);
    const target = list[next];
    if (target !== void 0) setSelectedSeq(target.seq);
  }, [current, filtered, steps]);
  const copyPane = React4.useCallback(() => {
    if (current === null) return;
    copyToClipboard(paneTextOf(current, tab));
    setCopied(true);
  }, [current, tab]);
  const exportCurrent = React4.useCallback(() => {
    if (current === null) return;
    downloadJson(`trace-step-${current.seq}.json`, JSON.stringify(exportPayloadOf(current), null, 2));
  }, [current]);
  React4.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const mod = event.metaKey || event.ctrlKey;
      if (mod && (event.key === "f" || event.key === "F")) {
        event.preventDefault();
        const input = searchRef.current;
        if (input !== null) {
          input.focus();
          if (typeof input.select === "function") input.select();
        }
        return;
      }
      if (mod && (event.key === "c" || event.key === "C")) {
        const target = event.target;
        const tag = target !== null && typeof target.tagName === "string" ? target.tagName.toUpperCase() : "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (typeof window.getSelection === "function" && (window.getSelection()?.toString() ?? "").length > 0) return;
        event.preventDefault();
        copyPane();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (event.target !== null && event.target === searchRef.current) return;
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [copyPane, move, onClose]);
  const renderPane = () => {
    if (current === null) return null;
    if (tab === "raw") return /* @__PURE__ */ React4.createElement(RawText, { text: current.args ?? "" });
    if (tab === "params") {
      const args = current.args ?? "";
      const parsed = parseJsonLoose(args);
      if (parsed.ok) return /* @__PURE__ */ React4.createElement(JsonTree, { value: parsed.value });
      return /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement(RawText, { text: args }), /* @__PURE__ */ React4.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-unparsable" }, t(lang, "resultUnparsable")));
    }
    const result = current.result;
    if (result === void 0) {
      return /* @__PURE__ */ React4.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-empty" }, t(lang, "resultEmpty"));
    }
    const images = result.images ?? [];
    const isError = result.isError || result.kind === "error" || current.kind === "error";
    if (isError) {
      const errorName = result.errorName ?? current.name;
      const errorCode = result.errorCode ?? current.errorCode;
      return /* @__PURE__ */ React4.createElement("div", { className: "ttl-errorBlock", "data-testid": "ttl-zoom-error" }, /* @__PURE__ */ React4.createElement("div", { className: "ttl-errorName", "data-testid": "ttl-zoom-error-name" }, errorCode !== void 0 ? `${errorName} \xB7 ${errorCode}` : errorName), result.text.length > 0 ? /* @__PURE__ */ React4.createElement(RawText, { text: result.text }) : null, images.length > 0 ? /* @__PURE__ */ React4.createElement(TrailImages, { images, sessionId, lang }) : null);
    }
    if (result.text.length === 0 && images.length === 0) {
      return /* @__PURE__ */ React4.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-empty" }, t(lang, "resultEmpty"));
    }
    const markdown = looksLikeMarkdown(result.text);
    const view = views.get(current.seq) ?? defaultViewForTool(current.name);
    return /* @__PURE__ */ React4.createElement(React4.Fragment, null, markdown && view === "rendered" ? /* @__PURE__ */ React4.createElement(MarkdownResult, { text: result.text, labels: markdownLabels(lang) }) : result.text.length > 0 ? /* @__PURE__ */ React4.createElement(RawText, { text: result.text }) : null, markdown ? /* @__PURE__ */ React4.createElement("div", { className: "ttl-detailHint" }, /* @__PURE__ */ React4.createElement(
      "button",
      {
        type: "button",
        className: "ttl-dtab",
        "data-testid": "ttl-zoom-view-toggle",
        "aria-pressed": view === "rendered",
        onClick: () => {
          setViews((map) => {
            const next = new Map(map);
            next.set(current.seq, view === "rendered" ? "raw" : "rendered");
            return next;
          });
        }
      },
      t(lang, view === "rendered" ? "detailSource" : "detailRender")
    )) : null, images.length > 0 ? /* @__PURE__ */ React4.createElement(TrailImages, { images, sessionId, lang }) : null);
  };
  if (current === null || typeof document === "undefined") return null;
  const title = t(lang, "zoomTitle")(current.name);
  const truncated = current.argsTruncated === true || current.result?.truncated === true;
  const tabButton = (value, label) => /* @__PURE__ */ React4.createElement(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": tab === value,
      className: `ttl-dtab${tab === value ? " ttl-dtabSelected" : ""}`,
      "data-testid": `ttl-zoom-tab-${value}`,
      onClick: () => {
        setTab(value);
      }
    },
    label
  );
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoom", "data-testid": "ttl-zoom" }, /* @__PURE__ */ React4.createElement(
      "div",
      {
        className: "ttl-zoomBackdrop",
        "data-testid": "ttl-zoom-backdrop",
        onClick: onClose,
        "aria-hidden": "true"
      }
    ), /* @__PURE__ */ React4.createElement(
      "div",
      {
        className: "ttl-zoomPanel",
        "data-testid": "ttl-zoom-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        ref: panelRef,
        tabIndex: -1
      },
      /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoomHead" }, /* @__PURE__ */ React4.createElement("h2", { className: "ttl-zoomTitle", "data-testid": "ttl-zoom-title" }, title), /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoomTools", "data-testid": "ttl-zoom-tools" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          ref: searchRef,
          type: "search",
          className: "ttl-zoomSearch",
          "data-testid": "ttl-zoom-search",
          placeholder: t(lang, "zoomSearch"),
          "aria-label": t(lang, "zoomSearch"),
          value: query,
          onChange: (event) => {
            onSearchChange(event.target.value);
          }
        }
      ), /* @__PURE__ */ React4.createElement("button", { type: "button", "data-testid": "ttl-zoom-copy", onClick: copyPane }, t(lang, copied ? "copiedDone" : "copyDetail")), /* @__PURE__ */ React4.createElement("button", { type: "button", "data-testid": "ttl-zoom-export", onClick: exportCurrent }, t(lang, "zoomExport")), /* @__PURE__ */ React4.createElement("button", { type: "button", "data-testid": "ttl-zoom-close", onClick: onClose }, t(lang, "zoomClose")))),
      /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoomBody" }, /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoomOutline", "data-testid": "ttl-zoom-outline" }, filtered.length === 0 ? /* @__PURE__ */ React4.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-nomatch" }, t(lang, "zoomNoMatch")) : filtered.map((step) => {
        const preview = step.kind === "error" ? step.error : step.argsPreview;
        const tone = step.kind === "error" || step.result?.isError === true ? "red" : toolDotClass(step.name);
        return /* @__PURE__ */ React4.createElement(
          "button",
          {
            key: step.seq,
            type: "button",
            className: "ttl-zoomOutlineRow",
            "data-testid": "ttl-zoom-step",
            "data-step-kind": step.kind,
            "aria-current": step.seq === current.seq ? "true" : void 0,
            title: preview,
            onClick: () => {
              setSelectedSeq(step.seq);
            }
          },
          /* @__PURE__ */ React4.createElement("span", { className: `ttl-rowDot ttl-dot-${tone}`, "aria-hidden": "true" }),
          /* @__PURE__ */ React4.createElement("span", { className: "ttl-rowName ttl-rowNameMono" }, step.name),
          /* @__PURE__ */ React4.createElement("span", { className: "ttl-rowArgs" }, preview)
        );
      })), /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoomPane", "data-testid": "ttl-zoom-pane" }, /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoomTabs", role: "tablist", "data-testid": "ttl-zoom-tabs" }, tabButton("params", t(lang, "detailParams")), tabButton("result", t(lang, "detailResult")), tabButton("raw", t(lang, "detailRaw"))), /* @__PURE__ */ React4.createElement("div", { "data-testid": `ttl-zoom-body-${tab}` }, renderPane()))),
      /* @__PURE__ */ React4.createElement("div", { className: "ttl-zoomFoot", "data-testid": "ttl-zoom-foot" }, /* @__PURE__ */ React4.createElement("span", { className: "ttl-zoomKbd", "data-testid": "ttl-zoom-hint" }, t(lang, "zoomHint")), /* @__PURE__ */ React4.createElement("span", { "data-testid": "ttl-zoom-seq" }, `seq #${current.seq}`), /* @__PURE__ */ React4.createElement(
        "span",
        {
          className: `ttl-pill${truncated ? " ttl-pillWarn" : " ttl-pillOk"}`,
          "data-testid": "ttl-zoom-pill"
        },
        t(lang, truncated ? "truncatedPill" : "fullPill")
      ))
    )),
    document.body
  );
}

// src/client/TrailTab.tsx
function sessionsOf(ctx) {
  if (ctx === void 0 || typeof ctx.get !== "function") return void 0;
  const service = ctx.get("sessions");
  return service !== void 0 && service !== null && typeof service.binding === "function" ? service : void 0;
}
function conversationOf(ctx, sessionId) {
  if (ctx === void 0 || typeof ctx.get !== "function") return void 0;
  const service = ctx.get("uiConversation");
  if (service === void 0 || service === null || typeof service.binding !== "function") return void 0;
  try {
    const targets = service.binding(sessionId);
    return targets !== void 0 && targets !== null && typeof targets.target === "function" ? targets : void 0;
  } catch {
    return void 0;
  }
}
function turnByIdentity(turn) {
  return turn.turn !== null ? `turn:${turn.turn}` : `input:${turn.anchorSeq}`;
}
function formatCount(n) {
  if (n < 1e3) return String(n);
  const k = n / 1e3;
  return `${k >= 10 ? String(Math.round(k)) : String(Math.round(k * 10) / 10)}k`;
}
var STEP_CAP = 250;
var TITLE_CAP = 512;
function clipTitle(value) {
  return value.length > TITLE_CAP ? `${value.slice(0, TITLE_CAP)}\u2026` : value;
}
function keyOfItem(item) {
  return `seq:${item.kind === "tool" ? item.step.seq : item.seq}`;
}
function targetFor(item) {
  if (item.kind === "tool") {
    return {
      seq: item.step.seq,
      kind: item.step.kind === "error" ? "error" : "tool",
      ...item.step.callId !== null ? { callId: item.step.callId } : {}
    };
  }
  return { seq: item.seq, kind: item.kind };
}
function detailTextOf(item) {
  if (item.content === null) return "";
  return item.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
}
function detailImagesOf(item) {
  if (item.content === null) return [];
  const out = [];
  for (const block of item.content) {
    if (block.type !== "image") continue;
    const ref = block.attachment;
    const image = {
      attachmentId: ref.attachmentId,
      mediaType: ref.mediaType,
      bytes: ref.bytes ?? 0
    };
    if (ref.width !== void 0) image.width = ref.width;
    if (ref.height !== void 0) image.height = ref.height;
    if (ref.name !== void 0) image.name = ref.name;
    out.push(image);
  }
  return out;
}
var StepDetail = React5.memo(function StepDetail2(props) {
  const { id, step, sessionId, lang, view, onSetView, onLoadDetail, onZoom } = props;
  const result = step.result;
  const args = step.args ?? "";
  const [tab, setTab] = React5.useState(result !== void 0 ? "result" : "params");
  const [copied, setCopied] = React5.useState(false);
  const [detail, setDetail] = React5.useState(void 0);
  const [loadFailed, setLoadFailed] = React5.useState(false);
  const [retries, setRetries] = React5.useState(0);
  const labels = markdownLabels(lang);
  const truncated = step.argsTruncated === true || result?.truncated === true;
  const needsDetail = truncated;
  const retryDetail = React5.useCallback(() => {
    setRetries((current) => current >= 1 ? current : current + 1);
  }, []);
  React5.useEffect(() => {
    if (!needsDetail) return void 0;
    let alive = true;
    setLoadFailed(false);
    void onLoadDetail(step.seq).then((outcome) => {
      if (!alive) return;
      const item = outcome.ok ? outcome.items.find((entry) => entry.seq === step.seq) ?? outcome.items[0] : void 0;
      if (item !== void 0) setDetail(item);
      else setLoadFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [needsDetail, onLoadDetail, step.seq, retries]);
  const detailPhase = !needsDetail ? "ready" : detail !== void 0 ? "ready" : loadFailed ? "failed" : "loading";
  const loaded = detail !== void 0;
  const fullArgs = loaded && detail.arguments !== null ? detail.arguments : args;
  const fullParsed = React5.useMemo(() => parseJsonLoose(fullArgs), [fullArgs]);
  const fullText = loaded ? detailTextOf(detail) : result?.text ?? "";
  const fullImages = loaded ? detailImagesOf(detail) : result?.images ?? [];
  const pillTruncated = loaded ? detail.truncated === true : truncated;
  const tabButton = (value, label) => /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": tab === value,
      className: `ttl-dtab${tab === value ? " ttl-dtabSelected" : ""}`,
      "data-testid": `ttl-dtab-${value}`,
      onClick: () => {
        setTab(value);
      }
    },
    label
  );
  const renderParams = () => fullParsed.ok ? /* @__PURE__ */ React5.createElement(JsonTree, { value: fullParsed.value }) : /* @__PURE__ */ React5.createElement(React5.Fragment, null, /* @__PURE__ */ React5.createElement(RawText, { text: fullArgs }), /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-unparsable" }, t(lang, "resultUnparsable")));
  const mergedNote = result !== void 0 && (result.mergedFrom ?? 0) > 1 && result.replacedBy === void 0 ? /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailMerged", role: "note", "data-testid": "ttl-detail-merged" }, t(lang, "mergedNoSurfaceOp")(result.mergedFrom ?? 0)) : null;
  const loadStrip = () => {
    if (detailPhase === "loading") {
      return /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailLoad", "data-testid": "ttl-detail-load" }, t(lang, "detailLoading"));
    }
    if (detailPhase === "failed") {
      return /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailLoad", "data-testid": "ttl-detail-load" }, /* @__PURE__ */ React5.createElement("span", null, t(lang, "detailLoadFailed")), /* @__PURE__ */ React5.createElement(
        "button",
        {
          type: "button",
          className: "ttl-detailRetry",
          "data-testid": "ttl-detail-retry",
          disabled: retries >= 1,
          onClick: retryDetail
        },
        t(lang, "detailRetry")
      ));
    }
    return null;
  };
  const renderResult = () => {
    const images = fullImages;
    const text = fullText;
    if (result === void 0 && !loaded) {
      return /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-empty" }, t(lang, "resultEmpty"));
    }
    const isError = detail?.isError === true || result?.isError === true || result?.kind === "error" || step.kind === "error";
    if (isError) {
      const errorName = detail?.error?.name ?? result?.errorName ?? step.name;
      const errorCode = detail?.error?.code ?? result?.errorCode ?? step.errorCode;
      return /* @__PURE__ */ React5.createElement("div", { className: "ttl-errorBlock", "data-testid": "ttl-error-block" }, /* @__PURE__ */ React5.createElement("div", { className: "ttl-errorName", "data-testid": "ttl-error-name" }, errorCode !== void 0 ? `${errorName} \xB7 ${errorCode}` : errorName), text.length > 0 ? /* @__PURE__ */ React5.createElement(RawText, { text }) : null, images.length > 0 ? /* @__PURE__ */ React5.createElement(TrailImages, { images, sessionId, lang }) : null, mergedNote);
    }
    if (text.length === 0 && images.length === 0) {
      return /* @__PURE__ */ React5.createElement(React5.Fragment, null, /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-empty" }, t(lang, "resultEmpty")), mergedNote);
    }
    const markdown = looksLikeMarkdown(text);
    return /* @__PURE__ */ React5.createElement(React5.Fragment, null, markdown && view === "rendered" ? /* @__PURE__ */ React5.createElement(MarkdownResult, { text, labels }) : text.length > 0 ? /* @__PURE__ */ React5.createElement(RawText, { text }) : null, markdown ? /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailHint" }, /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        className: "ttl-dtab",
        "data-testid": "ttl-view-toggle",
        "aria-pressed": view === "rendered",
        onClick: () => {
          onSetView(step.seq, view === "rendered" ? "raw" : "rendered");
        }
      },
      t(lang, view === "rendered" ? "detailSource" : "detailRender")
    )) : null, images.length > 0 ? /* @__PURE__ */ React5.createElement(TrailImages, { images, sessionId, lang }) : null, mergedNote);
  };
  const copyAll = () => {
    const text = fullText.length > 0 ? `${fullArgs.length > 0 ? `${fullArgs}

` : ""}${fullText}` : fullArgs;
    copyToClipboard(text);
    setCopied(true);
  };
  const openZoom = (event) => {
    const wrap = event.currentTarget.closest(".ttl-stepWrap");
    const row = wrap !== null ? wrap.querySelector('[data-testid="ttl-step"]') : null;
    onZoom(step, row instanceof HTMLElement ? row : null);
  };
  return /* @__PURE__ */ React5.createElement(
    "div",
    {
      className: "ttl-detail",
      id,
      role: "region",
      "aria-label": t(lang, "detailAria")(step.name),
      "data-testid": "ttl-detail"
    },
    /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailBar", role: "tablist" }, tabButton("params", t(lang, "detailParams")), tabButton("result", t(lang, "detailResult")), tabButton("raw", t(lang, "detailRaw"))),
    /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailBody", "data-testid": `ttl-detail-body-${tab}` }, loadStrip(), tab === "params" ? renderParams() : null, tab === "result" ? renderResult() : null, tab === "raw" ? /* @__PURE__ */ React5.createElement(RawText, { text: args }) : null),
    /* @__PURE__ */ React5.createElement("div", { className: "ttl-detailFoot", "data-testid": "ttl-detail-foot" }, /* @__PURE__ */ React5.createElement(
      "span",
      {
        className: `ttl-pill${pillTruncated ? " ttl-pillWarn" : " ttl-pillOk"}`,
        "data-testid": "ttl-detail-pill"
      },
      t(lang, pillTruncated ? "truncatedPill" : "fullPill")
    ), /* @__PURE__ */ React5.createElement("span", { "data-testid": "ttl-detail-seq" }, `seq #${step.seq}`), loaded ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-pill ttl-pillOk", "data-testid": "ttl-detail-full" }, t(lang, "detailLoadedFull")) : null, /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        className: "ttl-dtab",
        "data-testid": "ttl-detail-copy",
        onClick: copyAll
      },
      t(lang, copied ? "copiedDone" : "copyDetail")
    ), /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        className: "ttl-dtab",
        "data-testid": "ttl-detail-zoom",
        title: t(lang, "zoomOpen"),
        "aria-label": t(lang, "zoomOpen"),
        onClick: openZoom
      },
      "\u2922"
    ), result?.replacedBy !== void 0 ? /* @__PURE__ */ React5.createElement("span", { "data-testid": "ttl-detail-replaced" }, t(lang, "resultReplaced")(result.replacedBy)) : null, step.orphan === true ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-pill ttl-pillWarn", "data-testid": "ttl-detail-orphan" }, t(lang, "orphanResult")) : null)
  );
});
var StepRow = React5.memo(function StepRow2(props) {
  const {
    step,
    turn,
    open,
    view,
    lang,
    sessionId,
    onJump,
    onToggleStep,
    onStepOpen,
    onStepClose,
    onSetView,
    onLoadDetail,
    onZoom
  } = props;
  const text = step.kind === "error" ? step.error : step.argsPreview;
  const tone = step.kind === "error" || step.result?.isError === true ? "red" : toolDotClass(step.name);
  const detailId = `ttl-detail-${step.kind}-${step.seq}`;
  const openZoomForStep = React5.useCallback(
    (target, trigger) => {
      onZoom(target, turn, trigger);
    },
    [onZoom, turn]
  );
  return /* @__PURE__ */ React5.createElement("div", { className: "ttl-stepWrap", "data-open": open ? "true" : void 0, "data-testid": "ttl-step-wrap" }, /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      className: "ttl-row",
      "data-testid": "ttl-step",
      "data-step-kind": step.kind,
      "aria-expanded": open,
      "aria-controls": detailId,
      title: text,
      onClick: (event) => {
        onToggleStep(step, event.altKey);
      },
      onKeyDown: (event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onStepOpen(step);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          onStepClose(step);
        } else if ((event.key === "o" || event.key === "O") && event.shiftKey && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          onZoom(step, turn, event.currentTarget);
        }
      }
    },
    /* @__PURE__ */ React5.createElement("span", { className: `ttl-caret${open ? " ttl-caretOpen" : ""}`, "aria-hidden": "true" }),
    /* @__PURE__ */ React5.createElement("span", { className: `ttl-rowDot ttl-dot-${tone}`, "aria-hidden": "true" }),
    /* @__PURE__ */ React5.createElement("span", { className: "ttl-rowName ttl-rowNameMono" }, step.name),
    /* @__PURE__ */ React5.createElement("span", { className: "ttl-rowArgs" }, text)
  ), /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      className: "ttl-jump",
      "data-testid": "ttl-step-jump",
      title: t(lang, "locateInChat"),
      onClick: () => {
        onJump(targetFor({ kind: "tool", step }), turn);
      }
    },
    "\u2197"
  ), open ? /* @__PURE__ */ React5.createElement(
    StepDetail,
    {
      id: detailId,
      step,
      sessionId,
      lang,
      view,
      onSetView,
      onLoadDetail,
      onZoom: openZoomForStep
    }
  ) : null);
});
var TurnRow = React5.memo(function TurnRow2(props) {
  const {
    turn,
    index,
    expanded,
    active,
    showFull,
    filter,
    isToolFilter,
    lang,
    sessionId,
    openSeqs,
    resultView,
    onToggle,
    onShowEarlier,
    onJump,
    onToggleStep,
    onStepOpen,
    onStepClose,
    onSetView,
    onLoadDetail,
    onZoom
  } = props;
  const id = turnByIdentity(turn);
  const stepMatches = (step) => {
    if (filter === "all") return true;
    if (filter === "failed") return step.kind === "error";
    return step.kind === "tool" && step.name === filter;
  };
  const items = turn.items.filter((item) => {
    if (item.kind === "tool") return stepMatches(item.step);
    if (item.kind === "input") return false;
    return !isToolFilter;
  });
  const turnTag = t(lang, "turnPrefix")(turn.turn ?? index + 1);
  const preview = turn.inputPreview;
  const hasError = turn.hasError;
  const inputItem = turn.items.find((item) => item.kind === "input");
  const dot = (tone) => /* @__PURE__ */ React5.createElement("span", { className: `ttl-rowDot ttl-dot-${tone}`, "aria-hidden": "true" });
  const name = (label, mono) => /* @__PURE__ */ React5.createElement("span", { className: `ttl-rowName${mono ? " ttl-rowNameMono" : ""}` }, label);
  const renderInputRow = (item) => /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      className: "ttl-row",
      "data-testid": "ttl-item-input",
      title: clipTitle(item.text),
      onClick: () => {
        onJump({ seq: item.seq, kind: "input" }, turn);
      }
    },
    dot("blue"),
    name(t(lang, "input"), false),
    /* @__PURE__ */ React5.createElement("span", { className: "ttl-rowText" }, item.text)
  );
  const renderStep = (step, key) => /* @__PURE__ */ React5.createElement(
    StepRow,
    {
      key,
      step,
      turn,
      open: openSeqs.has(step.seq),
      view: resultView.get(step.seq) ?? defaultViewForTool(step.name),
      lang,
      sessionId,
      onJump,
      onToggleStep,
      onStepOpen,
      onStepClose,
      onSetView,
      onLoadDetail,
      onZoom
    }
  );
  const renderItem = (item, key) => {
    if (item.kind === "tool") return renderStep(item.step, key);
    if (item.kind === "input") return null;
    if (item.kind === "output") {
      return /* @__PURE__ */ React5.createElement(
        "button",
        {
          type: "button",
          key,
          className: "ttl-row",
          "data-testid": "ttl-item-output",
          title: clipTitle(item.text),
          onClick: () => {
            onJump(targetFor(item), turn);
          }
        },
        dot("violet"),
        name(t(lang, "output"), false),
        /* @__PURE__ */ React5.createElement("span", { className: "ttl-rowText ttl-rowText2" }, item.text)
      );
    }
    return /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        key,
        className: "ttl-row",
        "data-testid": "ttl-item-compaction",
        title: clipTitle(item.preview),
        onClick: () => {
          onJump(targetFor(item), turn);
        }
      },
      dot("neutral"),
      name(t(lang, "compactionTag"), false),
      /* @__PURE__ */ React5.createElement("span", { className: "ttl-rowText ttl-rowText2 ttl-rowTextMuted" }, item.preview)
    );
  };
  return /* @__PURE__ */ React5.createElement(
    "section",
    {
      className: "ttl-turnRow",
      "data-testid": "ttl-turn",
      "data-collapsed": expanded ? "false" : "true",
      "data-active": active ? "true" : void 0,
      "data-error": hasError ? "true" : void 0
    },
    /* @__PURE__ */ React5.createElement("div", { className: "ttl-turnHead" }, /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        className: "ttl-turnToggle",
        "aria-expanded": expanded,
        onClick: () => {
          onToggle(id);
        }
      },
      /* @__PURE__ */ React5.createElement("span", { className: `ttl-chevron${expanded ? " ttl-chevronOpen" : ""}` }, chevronIcon()),
      /* @__PURE__ */ React5.createElement("span", { className: "ttl-turnTag", "data-testid": "ttl-turn-tag" }, turnTag),
      preview.length > 0 ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-turnPreview", title: clipTitle(preview) }, preview) : null
    ), /* @__PURE__ */ React5.createElement("span", { className: "ttl-turnMeta" }, hasError ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-errorDot", "data-testid": "ttl-error-dot", title: t(lang, "error") }) : null, /* @__PURE__ */ React5.createElement(
      "span",
      {
        className: "ttl-stepsNum",
        "data-testid": "ttl-steps-count",
        title: t(lang, "stepsLabel")
      },
      formatCount(turn.stepsCount)
    ), /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        className: "ttl-locateBtn",
        "data-testid": "ttl-locate",
        title: t(lang, "locate"),
        onClick: () => {
          onJump({ seq: turn.anchorSeq, kind: "input" }, turn);
        }
      },
      targetIcon()
    ))),
    expanded ? (() => {
      const truncated = items.length > STEP_CAP && !showFull;
      const shownItems = truncated ? items.slice(items.length - STEP_CAP) : items;
      const hiddenCount = items.length - shownItems.length;
      return /* @__PURE__ */ React5.createElement("div", { className: "ttl-turnBody" }, filter === "all" && inputItem !== void 0 ? renderInputRow(inputItem) : null, hiddenCount > 0 ? /* @__PURE__ */ React5.createElement(
        "button",
        {
          type: "button",
          className: "ttl-showEarlier",
          "data-testid": "ttl-show-earlier",
          onClick: () => {
            onShowEarlier(id);
          }
        },
        t(lang, "showEarlierSteps")(hiddenCount)
      ) : null, items.length === 0 ? /* @__PURE__ */ React5.createElement("div", { className: "ttl-emptyInline" }, t(lang, "emptyFiltered")) : shownItems.map((item) => renderItem(item, keyOfItem(item))));
    })() : null
  );
});
function TrailTab(props) {
  const lang = detectLang();
  const sessionId = props.scope?.sessionId ?? "";
  const visible = props.visible === true;
  const sessionsService = React5.useMemo(() => sessionsOf(props.ctx), [props.ctx]);
  const fetchEvents = React5.useMemo(
    () => props.fetchEventsOverride !== void 0 ? props.fetchEventsOverride : (sid, afterSeq) => fetchTrailEvents(sid, afterSeq),
    [props.fetchEventsOverride]
  );
  const { turns, stats, status, error, refresh } = useTrail(sessionId, visible, fetchEvents, sessionsService);
  const [filter, setFilter] = React5.useState("all");
  const [expandedTurns, setExpandedTurns] = React5.useState(null);
  const [jumping, setJumping] = React5.useState(null);
  const [jumpPages, setJumpPages] = React5.useState(0);
  const [jumpMessage, setJumpMessage] = React5.useState(null);
  const [activeTurnId, setActiveTurnId] = React5.useState(null);
  const [followLatest, setFollowLatest] = React5.useState(true);
  const [followPaused, setFollowPaused] = React5.useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = React5.useState(false);
  const [showFullTurn, setShowFullTurn] = React5.useState(/* @__PURE__ */ new Set());
  const [openSeqs, setOpenSeqs] = React5.useState(() => /* @__PURE__ */ new Set());
  const [resultView, setResultView] = React5.useState(() => /* @__PURE__ */ new Map());
  const listRef = React5.useRef(null);
  const jumpingRef = React5.useRef(false);
  const onScroll = React5.useCallback(() => {
    const el = listRef.current;
    if (el === null) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    setFollowPaused(!nearBottom);
  }, []);
  React5.useEffect(() => {
    if (!followLatest || followPaused) return void 0;
    const el = listRef.current;
    if (el === null) return void 0;
    if (typeof window.requestAnimationFrame === "function") {
      const raf = window.requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return () => window.cancelAnimationFrame(raf);
    }
    const timeout = window.setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [turns, followLatest, followPaused]);
  const scrollToBottom = React5.useCallback(() => {
    const el = listRef.current;
    if (el === null) return;
    el.scrollTop = el.scrollHeight;
    setFollowPaused(false);
  }, []);
  const latestIdRef = React5.useRef("");
  React5.useEffect(() => {
    latestIdRef.current = turns.length > 0 ? turnByIdentity(turns[turns.length - 1]) : "";
  }, [turns]);
  const isTurnExpanded = React5.useCallback((id, index) => {
    if (expandedTurns === null) return index === turns.length - 1;
    return expandedTurns.has(id);
  }, [expandedTurns, turns.length]);
  const toggleTurn = React5.useCallback((id) => {
    setExpandedTurns((current) => {
      if (current === null) {
        const latestId = latestIdRef.current;
        const next2 = /* @__PURE__ */ new Set();
        if (latestId.length > 0) next2.add(latestId);
        if (next2.has(id)) next2.delete(id);
        else next2.add(id);
        return next2;
      }
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleShowFull = React5.useCallback((id) => {
    setShowFullTurn((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const seedView = React5.useCallback((step) => {
    setResultView((current) => {
      if (current.has(step.seq)) return current;
      const next = new Map(current);
      next.set(step.seq, defaultViewForTool(step.name));
      return next;
    });
  }, []);
  const toggleStep = React5.useCallback((step, multi) => {
    setOpenSeqs((current) => {
      const next = new Set(current);
      if (next.has(step.seq)) {
        next.delete(step.seq);
        return next;
      }
      if (!multi) next.clear();
      next.add(step.seq);
      return next;
    });
    seedView(step);
  }, [seedView]);
  const openStep = React5.useCallback((step, multi = false) => {
    setOpenSeqs((current) => {
      if (current.has(step.seq) && (multi || current.size === 1)) return current;
      const next = new Set(current);
      if (!multi) next.clear();
      next.add(step.seq);
      return next;
    });
    seedView(step);
  }, [seedView]);
  const closeStep = React5.useCallback((step) => {
    setOpenSeqs((current) => {
      if (!current.has(step.seq)) return current;
      const next = new Set(current);
      next.delete(step.seq);
      return next;
    });
  }, []);
  const setView = React5.useCallback((seq, view) => {
    setResultView((current) => {
      if (current.get(seq) === view) return current;
      const next = new Map(current);
      next.set(seq, view);
      return next;
    });
  }, []);
  const fetcherRef = React5.useRef(props.fetchToolDetailOverride ?? fetchToolDetail);
  fetcherRef.current = props.fetchToolDetailOverride ?? fetchToolDetail;
  const detailInflight = React5.useRef(/* @__PURE__ */ new Map());
  const loadDetail = React5.useCallback((seq) => {
    const pending = detailInflight.current.get(seq);
    if (pending !== void 0) return pending;
    const request = (async () => {
      try {
        return await fetcherRef.current(sessionId, [seq]);
      } catch {
        return { ok: false, reason: "network" };
      } finally {
        detailInflight.current.delete(seq);
      }
    })();
    detailInflight.current.set(seq, request);
    return request;
  }, [sessionId]);
  const [zoom, setZoom] = React5.useState(null);
  const zoomReturnRef = React5.useRef(null);
  const openZoom = React5.useCallback((step, turn, trigger) => {
    zoomReturnRef.current = trigger ?? (typeof document === "undefined" ? null : document.activeElement);
    setZoom({ turnId: turnByIdentity(turn), seq: step.seq });
  }, []);
  const closeZoom = React5.useCallback(() => {
    setZoom(null);
  }, []);
  const zoomSteps = React5.useMemo(() => {
    if (zoom === null) return [];
    const turn = turns.find((entry) => turnByIdentity(entry) === zoom.turnId);
    return turn === void 0 ? [] : stepsOf(turn);
  }, [zoom, turns]);
  React5.useEffect(() => {
    if (zoom !== null) return;
    const target = zoomReturnRef.current;
    if (target === null) return;
    zoomReturnRef.current = null;
    if (target.isConnected !== false && typeof target.focus === "function") target.focus();
  }, [zoom]);
  React5.useEffect(() => {
    if (zoom !== null && zoomSteps.length === 0) setZoom(null);
  }, [zoom, zoomSteps]);
  React5.useEffect(() => {
    setOpenSeqs(/* @__PURE__ */ new Set());
    setResultView(/* @__PURE__ */ new Map());
    setZoom(null);
  }, [sessionId]);
  React5.useEffect(() => {
    if (visible) return;
    setOpenSeqs(/* @__PURE__ */ new Set());
    setResultView(/* @__PURE__ */ new Map());
    setZoom(null);
  }, [visible]);
  const sessionForJump = React5.useMemo(() => {
    if (sessionsService === void 0) return null;
    const binding = sessionsService.binding(sessionId);
    const session = binding !== void 0 && binding.session !== void 0 ? binding.session : void 0;
    if (session === void 0) return null;
    const face = session;
    if (typeof face.loadOlder !== "function" || typeof face.getSnapshot !== "function") return null;
    return session;
  }, [sessionsService, sessionId]);
  const conversationForJump = React5.useMemo(
    () => conversationOf(props.ctx, sessionId),
    [props.ctx, sessionId]
  );
  const doJump = React5.useCallback(async (target, turn) => {
    if (jumpingRef.current) return;
    setActiveTurnId(turnByIdentity(turn));
    if (sessionForJump === null) {
      setJumpMessage(t(lang, "jumpFailed"));
      return;
    }
    jumpingRef.current = true;
    setJumping(target.seq);
    setJumpPages(0);
    setJumpMessage(null);
    const outcome = await jumpToItem(sessionForJump, target, {
      document: window.document,
      onProgress: (pages) => setJumpPages(pages),
      ...conversationForJump !== void 0 ? { conversation: conversationForJump } : {}
    });
    jumpingRef.current = false;
    setJumping(null);
    if (outcome.ok) {
      setJumpMessage(t(lang, outcome.mode === "trajectory" ? "jumpTrajectory" : "jumpDone"));
    } else {
      setJumpMessage(t(lang, "jumpFailed"));
    }
  }, [sessionForJump, conversationForJump, lang]);
  const stepMatches = (step) => {
    if (filter === "all") return true;
    if (filter === "failed") return step.kind === "error";
    return step.kind === "tool" && step.name === filter;
  };
  const visibleTurns = React5.useMemo(
    () => filter === "all" || filter === "failed" ? turns : turns.filter((turn) => stepsOf(turn).some((step) => stepMatches(step))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turns, filter]
  );
  const toolChips = stats.tools.slice(0, 4);
  const hasMoreTools = stats.tools.length > 4;
  const isToolFilter = filter !== "all" && filter !== "failed";
  React5.useEffect(() => {
    if (filter === "all") return;
    setOpenSeqs((current) => {
      if (current.size === 0) return current;
      const allowed = /* @__PURE__ */ new Set();
      for (const turn of turns) {
        for (const step of stepsOf(turn)) {
          if (stepMatches(step)) allowed.add(step.seq);
        }
      }
      let changed = false;
      const next = /* @__PURE__ */ new Set();
      for (const seq of current) {
        if (allowed.has(seq)) next.add(seq);
        else changed = true;
      }
      return changed ? next : current;
    });
  }, [filter, turns]);
  if (!visible) return null;
  const chipButton = (value, label, count, dot) => /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      key: value,
      className: "ttl-chip",
      "aria-pressed": filter === value ? "true" : "false",
      "data-testid": `ttl-chip-${value}`,
      onClick: () => {
        setFilter((current) => current === value ? "all" : value);
      }
    },
    dot ? /* @__PURE__ */ React5.createElement("span", { className: `ttl-chipDot ttl-dot-${dot}`, "aria-hidden": "true" }) : null,
    /* @__PURE__ */ React5.createElement("span", null, label),
    count > 0 ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-chipNum" }, String(count)) : null
  );
  const header = /* @__PURE__ */ React5.createElement("div", { className: "ttl-header" }, /* @__PURE__ */ React5.createElement("h2", { className: "ttl-title" }, t(lang, "tabTitle")), /* @__PURE__ */ React5.createElement("span", { className: "ttl-count", "data-testid": "ttl-count" }, t(lang, "turnsCount")(turns.length)), /* @__PURE__ */ React5.createElement("span", { className: "ttl-headerSpacer" }), /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      className: "ttl-toggle",
      "aria-pressed": followLatest ? "true" : "false",
      "data-testid": "ttl-follow-toggle",
      onClick: () => {
        setFollowLatest((current) => !current);
      }
    },
    /* @__PURE__ */ React5.createElement("span", { className: "ttl-toggleDot", "aria-hidden": "true" }),
    t(lang, "followLatest")
  ));
  const chips = /* @__PURE__ */ React5.createElement(React5.Fragment, null, /* @__PURE__ */ React5.createElement("div", { className: "ttl-filterRow", role: "group", "data-testid": "ttl-chips" }, chipButton("all", t(lang, "filterAll"), stats.total), stats.failed > 0 ? chipButton("failed", t(lang, "filterFailed"), stats.failed) : null, toolChips.map((tool) => chipButton(tool.name, tool.name, tool.count, toolDotClass(tool.name))), hasMoreTools ? /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      key: "more",
      className: "ttl-chip ttl-moreChip",
      "aria-expanded": moreToolsOpen ? "true" : "false",
      "data-testid": "ttl-chip-more",
      onClick: () => {
        setMoreToolsOpen((current) => !current);
      }
    },
    t(lang, moreToolsOpen ? "filterCollapse" : "filterMore"),
    /* @__PURE__ */ React5.createElement("span", { className: `ttl-moreArrow${moreToolsOpen ? " ttl-moreArrowOpen" : ""}` }, chevronIcon())
  ) : null), moreToolsOpen && hasMoreTools ? /* @__PURE__ */ React5.createElement("div", { className: "ttl-toolDropdown", "data-testid": "ttl-tool-dropdown" }, stats.tools.map((tool) => chipButton(tool.name, tool.name, tool.count, toolDotClass(tool.name)))) : null);
  let body;
  if (status === "loading") {
    body = /* @__PURE__ */ React5.createElement("div", { className: "ttl-status", "data-testid": "ttl-status" }, t(lang, "loading"));
  } else if (status === "error" && turns.length === 0) {
    body = /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("div", { className: "ttl-error", "data-testid": "ttl-error" }, error ?? t(lang, "loadFailed")), /* @__PURE__ */ React5.createElement("div", { className: "ttl-filterRow" }, /* @__PURE__ */ React5.createElement("button", { type: "button", className: "ttl-chip", onClick: refresh, "data-testid": "ttl-retry" }, t(lang, "retry"))));
  } else if (turns.length === 0) {
    body = /* @__PURE__ */ React5.createElement("div", { className: "ttl-status", "data-testid": "ttl-empty" }, t(lang, "emptyNoTurns"));
  } else if (visibleTurns.length === 0) {
    body = /* @__PURE__ */ React5.createElement("div", { className: "ttl-status", "data-testid": "ttl-empty-filtered" }, t(lang, "emptyFiltered"), /* @__PURE__ */ React5.createElement("button", { type: "button", className: "ttl-chip", style: { marginLeft: 8 }, onClick: () => {
      setFilter("all");
    } }, t(lang, "clearFilter")));
  } else {
    body = /* @__PURE__ */ React5.createElement("div", { className: "ttl-list", ref: listRef, onScroll, "data-testid": "ttl-list" }, visibleTurns.map((turn, index) => /* @__PURE__ */ React5.createElement(
      TurnRow,
      {
        key: turnByIdentity(turn),
        turn,
        index,
        expanded: isTurnExpanded(turnByIdentity(turn), index),
        active: activeTurnId === turnByIdentity(turn),
        showFull: showFullTurn.has(turnByIdentity(turn)),
        filter,
        isToolFilter,
        lang,
        sessionId,
        openSeqs,
        resultView,
        onToggle: toggleTurn,
        onShowEarlier: toggleShowFull,
        onJump: doJump,
        onToggleStep: toggleStep,
        onStepOpen: openStep,
        onStepClose: closeStep,
        onSetView: setView,
        onLoadDetail: loadDetail,
        onZoom: openZoom
      }
    )));
  }
  const statusBar = jumping !== null || jumpMessage !== null ? /* @__PURE__ */ React5.createElement("div", { className: "ttl-statusBar", "data-testid": "ttl-statusbar" }, jumping !== null ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-spin" }, spinnerIcon()) : null, /* @__PURE__ */ React5.createElement("span", null, jumping !== null ? `${t(lang, "jumpProgress")(jumpPages)} ` : "", jumpMessage ?? "")) : null;
  return /* @__PURE__ */ React5.createElement("div", { className: "ttl-root", role: "complementary", "aria-label": t(lang, "tabTitle"), "data-testid": "ttl-root" }, header, chips, body, statusBar, jumping !== null ? /* @__PURE__ */ React5.createElement("div", { className: "ttl-jumpBanner", "data-testid": "ttl-jump-banner", role: "status" }, /* @__PURE__ */ React5.createElement("span", { className: "ttl-spin" }, spinnerIcon()), t(lang, "jumpProgress")(jumpPages)) : null, followPaused && turns.length > 0 ? /* @__PURE__ */ React5.createElement("button", { type: "button", className: "ttl-toBottom", "data-testid": "ttl-to-bottom", onClick: scrollToBottom }, t(lang, "newUpdates")) : null, zoom !== null && zoomSteps.length > 0 ? /* @__PURE__ */ React5.createElement(
    ZoomOverlay,
    {
      steps: zoomSteps,
      initialSeq: zoom.seq,
      sessionId,
      lang,
      onClose: closeZoom
    }
  ) : null);
}
function chevronIcon() {
  return /* @__PURE__ */ React5.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React5.createElement("path", { d: "M6 4l4 4-4 4", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function spinnerIcon() {
  return /* @__PURE__ */ React5.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React5.createElement("path", { d: "M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }));
}
function targetIcon() {
  return /* @__PURE__ */ React5.createElement("svg", { viewBox: "0 0 16 16", width: "13", height: "13", "aria-hidden": "true" }, /* @__PURE__ */ React5.createElement("circle", { cx: "8", cy: "8", r: "5", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), /* @__PURE__ */ React5.createElement("circle", { cx: "8", cy: "8", r: "1.6", fill: "currentColor" }));
}

// src/client/index.tsx
function routeIcon(size) {
  const children = [
    React6.createElement("circle", { key: "a", cx: 6, cy: 19, r: 3 }),
    React6.createElement("path", { key: "p", d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }),
    React6.createElement("circle", { key: "b", cx: 18, cy: 5, r: 3 })
  ];
  return React6.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true
    },
    children
  );
}
var inject = ["sessions", "uiConversation", "betterSidebar"];
function tabDescription() {
  if (typeof navigator === "undefined") return "Turn outline";
  return navigator.language.toLowerCase().startsWith("zh") ? "\u6309\u7528\u6237\u8F6E\u6B21\u6298\u53E0\u4F1A\u8BDD\u8F68\u8FF9\uFF0C\u4E00\u952E\u5B9A\u4F4D\u56DE\u5BF9\u8BDD\u539F\u4F4D" : "Fold the session into per-turn steps and jump back to any of them";
}
function apply(ctx) {
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-trace-inspect";
  style.textContent = trailCss;
  document.head.appendChild(style);
  ctx.effect(() => () => style.remove());
  const betterSidebar = ctx.get("betterSidebar");
  if (betterSidebar === void 0 || betterSidebar === null || typeof betterSidebar.registerTab !== "function") {
    return;
  }
  ctx.effect(() => betterSidebar.registerTab({
    id: "trace-inspect",
    title: () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh") ? "\u8F6E\u6B21\u8F68\u8FF9" : "Turn Outline",
    description: tabDescription,
    icon: (size) => routeIcon(size),
    order: 46,
    single: true,
    component: (props) => React6.createElement(TrailTab, {
      ctx: props.ctx,
      scope: props.scope,
      visible: props.visible === true,
      tab: props.tab
    })
  }));
}

    return module.exports;
  },
});

//# sourceMappingURL=client.js.map
