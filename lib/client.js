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
var React11 = __toESM(require("react"), 1);

// src/client/styles.ts
var trailCss = `
/* \u2550\u2550 reused content surfaces (v0.4\u2013v0.8) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2500\u2500 Jump highlight flash (on the main conversation) \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ttl-flash { animation: ttl-flash 1.6s ease-out; }

@keyframes ttl-flash {
  0% { box-shadow: 0 0 0 3px var(--dsw-alias-state-business-primary, #4176e6); }
  100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
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

/* \u2500\u2500 v0.7.0: long-value blocks (B) + centered value reader (C) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2550\u2550 v0.9 shell \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */

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

/* \u2500\u2500 header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 search \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 filters \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 session summary \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 list & turns \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 steps \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 parallel group (same level, no indent) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 input / output items \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 states \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2550\u2550 v0.9 inline detail band \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */

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

/* \u2550\u2550 v0.9 zoom overlay \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */

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

/* \u2500\u2500 v0.9 leaf classes used by the new shell / detail \u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 v0.9 fixes from shell-view review \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2550\u2550 v0.9 integration fixes (frame compare round 1) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */

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

/* 9) filters: keep the \u300C\u66F4\u591A\u300D chip reachable while the list scrolls */
.ttl-moreChip, .ttl-chip-more {
  position: sticky;
  right: 0;
  z-index: 2;
  background: var(--dsw-alias-bg-layer-1, #232324);
  box-shadow: -8px 0 12px rgba(0, 0, 0, 0.35);
}


/* 10) expanded turns hide the mix strip (prototype 2-02) */
.ttl-turn[data-collapsed="false"] .ttl-mix { display: none; }

/* \u2550\u2550 v0.9 integration fixes (frame compare round 2) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550 v0.9 integration fixes (frame compare round 3) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550 v0.9.1 polish: quieter parallel groups, green MCP success \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550 v0.9.2 polish: full tool names, content-sized column \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-stepName {
  width: var(--ttl-step-name-w, 52px);
  min-width: 0;
}

/* \u2550\u2550 v0.9.3: parallel batches are marked by a bracket only \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

/* \u2550\u2550 v0.9.4: expanded trace gets breathing room on both sides \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-turn .ttl-step {
  padding-left: 14px;
  padding-right: 22px;
}
.ttl-turn .ttl-stepJump { right: 8px; }
.ttl-turn .ttl-item { padding-right: 20px; }
.ttl-turn .ttl-parallel::before { left: 10px; }
.ttl-turn .ttl-turnBody .ttl-showEarlier { width: calc(100% - 36px); margin-left: 18px; margin-right: 18px; }

/* \u2550\u2550 v0.9.5: assistant prose as a quote-style message block \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-msg {
  position: relative;
  margin: 6px 14px 10px;
  padding: 6px 10px 7px 12px;
  border-left: 2px solid rgba(78, 212, 164, 0.55);
  border-radius: 0 6px 6px 0;
  background: rgba(255, 255, 255, 0.025);
}
.ttl-msgMain { cursor: pointer; outline: none; }
.ttl-msgMain:focus-visible { box-shadow: 0 0 0 1px rgba(124, 178, 255, 0.55); border-radius: 4px; }
.ttl-msgHead { display: flex; align-items: center; gap: 6px; height: 16px; }
.ttl-msgIcon { display: inline-flex; color: #4ed4a4; }
.ttl-msgRole { color: var(--dsw-alias-label-tertiary, #9ba1a7); font-size: 9.5px; letter-spacing: 0.4px; }
.ttl-msgRule { flex: 1; height: 1px; background: rgba(255, 255, 255, 0.05); }
.ttl-msgText {
  margin-top: 3px;
  color: #dfe2e5;
  font-size: 12.5px;
  line-height: 19px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ttl-msgTextOpen { display: block; -webkit-line-clamp: unset; overflow: visible; }
.ttl-msgStrong { color: #f3f4f6; font-weight: 600; }
.ttl-msgCode {
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 11px;
  padding: 0 3px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.07);
  color: #d7dade;
}
.ttl-msgMore {
  margin-top: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--dsw-static-blue-300, #7cb2ff);
  font: inherit;
  font-size: 9.5px;
  cursor: pointer;
}
.ttl-msgJump {
  position: absolute;
  right: 6px;
  top: 4px;
  width: 18px;
  height: 18px;
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  cursor: pointer;
}
.ttl-msg:hover .ttl-msgJump { display: inline-flex; }
.ttl-msg .ttl-output-body { margin-top: 6px; }

/* \u2550\u2550 v0.9.6: expanded message body inherits no old output indentation \u2550\u2550\u2550\u2550 */
.ttl-msg .ttl-output-body {
  padding: 0;
  margin-top: 6px;
  color: inherit;
}

/* \u2550\u2550 v0.9.7: no locate arrows, no \u2225N badge, edit/mcp colours split \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-stepJump, .ttl-locateBtn, .ttl-msgJump, .ttl-itemJump, .ttl-output-jump { display: none !important; }
.ttl-badgeParallel { display: none !important; }
.ttl-tone-edit { color: #f2b45c; }
.ttl-stepIcon.ttl-tone-edit { background: rgba(242, 180, 92, 0.14); }
.ttl-tone-todo { color: #9ba1a7; }
.ttl-stepIcon.ttl-tone-todo { background: rgba(255, 255, 255, 0.06); }

.ttl-distSeg.ttl-tone-edit, .ttl-legendDot.ttl-tone-edit { background: #f2b45c; }
.ttl-distSeg.ttl-tone-mcp, .ttl-legendDot.ttl-tone-mcp { background: #34d399; }
.ttl-distSeg.ttl-tone-todo, .ttl-legendDot.ttl-tone-todo { background: #9ba1a7; }

/* \u2550\u2550 v0.9.9: generic tool glyph gets its own hue (not grey) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-tone-generic { color: #f472b6; }
.ttl-stepIcon.ttl-tone-generic { background: rgba(244, 114, 182, 0.14); }
.ttl-distSeg.ttl-tone-generic, .ttl-legendDot.ttl-tone-generic { background: #f472b6; }

`;

// src/client/TrailTab.tsx
var React10 = __toESM(require("react"), 1);

// src/trail-model.ts
var PREVIEW_MAX = 120;
function stepsOf(turn) {
  const out = [];
  for (const item of turn.items) {
    if (item.kind === "tool") out.push(item.step);
  }
  return out;
}
function assistantStepOf(step) {
  if (step.kind !== "tool") return null;
  if (step.orphan === true) return null;
  if (typeof step.turn !== "number" || typeof step.step !== "number") return null;
  if (!Number.isFinite(step.turn) || !Number.isFinite(step.step)) return null;
  return { turn: step.turn, step: step.step };
}
function parallelGroupsOf(items) {
  const groups = [];
  let run = [];
  let identity = null;
  const flush = () => {
    if (identity !== null && run.length >= 2) {
      groups.push({
        key: `parallel:${identity.turn}:${identity.step}:${run[0].seq}`,
        turn: identity.turn,
        step: identity.step,
        steps: run
      });
    }
    run = [];
    identity = null;
  };
  for (const item of items) {
    if (item.kind !== "tool") {
      flush();
      continue;
    }
    const step = assistantStepOf(item.step);
    if (step === null) {
      flush();
      continue;
    }
    if (identity !== null && (identity.turn !== step.turn || identity.step !== step.step)) flush();
    identity = step;
    run.push(item.step);
  }
  flush();
  return groups;
}
function groupParallelItems(items) {
  const byFirstSeq = /* @__PURE__ */ new Map();
  for (const group of parallelGroupsOf(items)) byFirstSeq.set(group.steps[0].seq, group);
  const out = [];
  let index = 0;
  while (index < items.length) {
    const item = items[index];
    if (item.kind === "tool") {
      const group = byFirstSeq.get(item.step.seq);
      if (group !== void 0) {
        out.push({ kind: "group", group });
        index += group.steps.length;
        continue;
      }
    }
    out.push({ kind: "item", item });
    index += 1;
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
  applyToolCall(builder, data, seq, time) {
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
      error: "",
      ...typeof data.turn === "number" ? { turn: data.turn } : {},
      ...typeof data.step === "number" ? { step: data.step } : {},
      ...time !== void 0 ? { startedAt: time } : {}
    };
    this.addStep(builder, step);
    this.register(callId, seq, { builder, step });
  }
  /** tool/result → error rows keep v0.3.1 behavior; success results merge by surfaceOp. */
  applyToolResult(current, data, seq, eventSurfaceOp, time) {
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
        ...errorCode !== void 0 ? { errorCode } : {},
        ...typeof data.turn === "number" ? { turn: data.turn } : {},
        ...typeof data.step === "number" ? { step: data.step } : {},
        ...time !== void 0 ? { startedAt: time, endedAt: time } : {}
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
        if (time !== void 0) target.step.endedAt = time;
        this.seqIndex.set(seq, target);
        if (callId !== null && !this.byCallId.has(callId)) this.byCallId.set(callId, target);
      }
      return;
    }
    if (current === null) return;
    const hit = callId !== null ? this.byCallId.get(callId) : void 0;
    if (hit !== void 0) {
      this.applyContent(hit.builder, hit.step, seq, bits);
      if (time !== void 0) hit.step.endedAt = time;
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
    if (time !== void 0) step.endedAt = time;
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
        this.results.applyToolCall(this.current, data, seq, time);
        break;
      }
      case "tool/result": {
        this.results.applyToolResult(this.current, data, seq, surfaceOp, time);
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
      this.results.applyToolCall(this.userActive, data, seq, void 0);
      return;
    }
    if (type === "tool/result") {
      this.results.applyToolResult(this.userActive, data, seq, surfaceOp, void 0);
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
function normalizeLang(raw) {
  return raw.toLowerCase().startsWith("zh") ? "zh" : "en";
}
var hostLang = null;
function setHostLocale(localeId) {
  hostLang = localeId === void 0 || localeId === null || localeId === "" ? null : normalizeLang(localeId);
}
function detectLang() {
  if (hostLang !== null) return hostLang;
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang) return normalizeLang(htmlLang);
  }
  if (typeof navigator !== "undefined") return normalizeLang(navigator.language ?? "");
  return "en";
}
var zh = {
  tabTitle: "\u8F6E\u6B21\u8F68\u8FF9",
  tabDescription: "\u6309\u7528\u6237\u8F6E\u6B21\u6298\u53E0\u4F1A\u8BDD\u8F68\u8FF9\uFF0C\u4E00\u952E\u5B9A\u4F4D\u56DE\u5BF9\u8BDD\u539F\u4F4D",
  turnsCount: (n) => `${n} \u8F6E`,
  followLatest: "\u8DDF\u968F",
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
  parallelGroup: (n) => `\u5E76\u884C \xD7${n}`,
  parallelGroupHint: (n) => `\u540C\u4E00\u52A9\u624B\u6B65\u9AA4\u5185\u4E0B\u53D1\u7684 ${n} \u4E2A\u5DE5\u5177\u8C03\u7528\uFF08DSH \u53EF\u80FD\u6309\u5E76\u53D1\u5B89\u5168\u7B56\u7565\u4E32\u884C\u6267\u884C\uFF09`,
  parallelGroupsTitle: (groups, calls) => `${groups} \u7EC4\u5E76\u884C\u8C03\u7528 \xB7 \u5171 ${calls} \u6B21`,
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
  viewInCenter: "\u5728\u4E2D\u592E\u67E5\u770B",
  clickToViewFull: "\u70B9\u51FB\u67E5\u770B\u5168\u6587",
  zoomTitle: (name) => `${name} \xB7 \u6B65\u9AA4\u8BE6\u60C5`,
  zoomClose: "\u5173\u95ED",
  zoomSearch: "\u641C\u7D22\u6B65\u9AA4",
  zoomNoMatch: "\u65E0\u5339\u914D\u6B65\u9AA4",
  zoomExport: "\u5BFC\u51FA JSON",
  zoomHint: "Esc \u5173\u95ED \xB7 \u2191\u2193 \u5207\u6B65 \xB7 \u2318F \u641C\u7D22",
  valueMeta: (chars, lines) => `${chars} \u5B57\u7B26 \xB7 ${lines} \u884C`,
  valueViewerTitle: (label) => `${label} \xB7 \u5168\u6587`,
  valueSearch: "\u641C\u7D22\u5185\u5BB9",
  valueHits: (n) => `${n} \u5904`,
  valueNoHit: "\u65E0\u5339\u914D",
  valueClipped: (n) => `\u4EC5\u663E\u793A\u524D 4000 \u884C\uFF08\u53E6\u6709 ${n} \u884C\uFF1B\u590D\u5236\u4ECD\u662F\u5168\u6587\uFF09`,
  jsonShowAll: (n) => `\u663E\u793A\u5168\u90E8\uFF08\u5F53\u524D\u53EA\u6E32\u67D3\u4E86\u524D ${n} \u884C\uFF09`
};
var en = {
  tabTitle: "Turn Outline",
  tabDescription: "Fold the session into per-turn steps and jump back to any of them",
  turnsCount: (n) => `${n} turns`,
  followLatest: "Follow",
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
  parallelGroup: (n) => `Parallel \xD7${n}`,
  parallelGroupHint: (n) => `${n} tool calls issued in one assistant step (DSH may run them serially by concurrency policy)`,
  parallelGroupsTitle: (groups, calls) => `${groups} parallel group${groups === 1 ? "" : "s"} \xB7 ${calls} calls`,
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
  viewInCenter: "View centered",
  clickToViewFull: "Click to view full text",
  zoomTitle: (name) => `${name} \xB7 step details`,
  zoomClose: "Close",
  zoomSearch: "Search steps",
  zoomNoMatch: "No matching step",
  zoomExport: "Export JSON",
  zoomHint: "Esc close \xB7 \u2191\u2193 step \xB7 \u2318F search",
  valueMeta: (chars, lines) => `${chars} chars \xB7 ${lines} lines`,
  valueViewerTitle: (label) => `${label} \xB7 full text`,
  valueSearch: "Search in value",
  valueHits: (n) => `${n} matches`,
  valueNoHit: "No match",
  valueClipped: (n) => `First 4000 lines only (${n} more; copy still copies everything)`,
  jsonShowAll: (n) => `Show all (only the first ${n} rows are rendered)`
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

// src/client/tool-summary.ts
var FALLBACK_KEYS = ["description", "command", "file_path", "path", "pattern", "query", "url", "prompt"];
var DETAIL_MAX = 120;
function fileBaseName(path) {
  const trimmed = path.trim().replace(/[\\/]+$/, "");
  if (trimmed.length === 0) return path.trim();
  const at = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return at >= 0 ? trimmed.slice(at + 1) : trimmed;
}
function firstLine(text) {
  for (const line of text.split("\n")) {
    const value = line.trim();
    if (value.length > 0) return value;
  }
  return "";
}
function clip(text, max = DETAIL_MAX) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}\u2026` : flat;
}
function parseArgs(raw) {
  if (raw === void 0 || raw.trim().length === 0) return null;
  try {
    const value = JSON.parse(raw);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function str(args, key) {
  if (args === null) return void 0;
  const value = args[key];
  if (typeof value === "string" && value.trim().length > 0) return value;
  return void 0;
}
function mcpArgsSummary(args) {
  if (args === null) return "";
  const strings = (value) => Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  const nodes = strings(args.nodeIds);
  const files = strings(args.paths ?? args.files);
  const parts = [];
  if (nodes.length > 0) parts.push(`${nodes.length} \u4E2A\u8282\u70B9`);
  else if (files.length > 0) parts.push(`${files.length} \u4E2A\u6587\u4EF6`);
  const format = str(args, "format");
  const scale = typeof args.scale === "number" && Number.isFinite(args.scale) ? args.scale : void 0;
  if (format !== void 0) parts.push(scale !== void 0 ? `${format} @${scale}x` : format);
  const scalarKeys = ["path", "file_path", "url", "query", "name", "description", "prompt", "text", "command"];
  if (parts.length === 0) {
    for (const key of scalarKeys) {
      const value = str(args, key);
      if (value !== void 0) {
        parts.push(clip(firstLine(value), 48));
        break;
      }
    }
  }
  if (parts.length === 0) {
    const count = Object.keys(args).length;
    if (count > 0) parts.push(`${count} \u4E2A\u53C2\u6570`);
  }
  return parts.join(" \xB7 ");
}
function splitMcpName(name) {
  if (!name.startsWith("mcp__") && !name.startsWith("mcp_")) return null;
  const parts = name.split("__");
  if (parts.length < 2 || parts[0] !== "mcp") {
    const single = name.split("_");
    if (single[0] !== "mcp" || single.length < 3) return null;
    return { server: single[1], tool: single.slice(2).join("_") };
  }
  const server = parts[1] ?? "";
  const tool = parts.slice(2).join("__");
  return server.length > 0 ? { server, tool } : null;
}
function summarizeToolCall(name, rawArgs, argsPreview, lang) {
  const args = parseArgs(rawArgs ?? argsPreview);
  const mcp = splitMcpName(name);
  if (mcp !== null) {
    const tool = mcp.tool.length > 0 ? mcp.tool : "";
    const summary = mcpArgsSummary(args);
    const detail = [tool, summary].filter((part) => part.length > 0).join(" \xB7 ");
    return {
      label: mcp.server,
      detail,
      icon: "mcp",
      server: mcp.server,
      toolName: tool
    };
  }
  switch (name) {
    case "bash":
    case "bash_output":
    case "shell": {
      const description = str(args, "description");
      const command = str(args, "command");
      const detail = description !== void 0 ? clip(description) : command !== void 0 ? clip(firstLine(command)) : clip(firstLine(argsPreview));
      return { label: name, detail, icon: "terminal" };
    }
    case "read":
    case "read_image":
    case "write":
    case "edit":
    case "append": {
      const file = str(args, "file_path") ?? str(args, "path");
      const icon = name === "read" || name === "read_image" ? "file-read" : name === "write" || name === "append" ? "file-write" : "file-edit";
      if (file !== void 0) return { label: name, detail: clip(fileBaseName(file)), icon };
      return { label: name, detail: clip(firstLine(argsPreview)), icon };
    }
    case "glob":
    case "grep":
    case "search": {
      const pattern = str(args, "pattern") ?? str(args, "query");
      return { label: name, detail: pattern !== void 0 ? clip(pattern) : clip(firstLine(argsPreview)), icon: "search" };
    }
    case "ls":
    case "list_directory":
    case "list_dir": {
      const path = str(args, "path") ?? str(args, "file_path");
      return { label: name, detail: path !== void 0 ? clip(path) : clip(firstLine(argsPreview)), icon: "folder" };
    }
    default:
      break;
  }
  if (args !== null) {
    for (const key of FALLBACK_KEYS) {
      const value = str(args, key);
      if (value !== void 0) return { label: name, detail: clip(key === "file_path" || key === "path" ? fileBaseName(value) : firstLine(value)), icon: "generic" };
    }
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === "string" && value.trim().length > 0) {
        return { label: name, detail: clip(`${key} ${firstLine(value)}`), icon: "generic" };
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return { label: name, detail: clip(`${key} ${String(value)}`), icon: "generic" };
      }
      if (Array.isArray(value)) {
        return { label: name, detail: `${key} \xB7 ${value.length} \u9879`, icon: "generic" };
      }
    }
    const count = Object.keys(args).length;
    if (count > 0) return { label: name, detail: `${count} \u4E2A\u53C2\u6570`, icon: "generic" };
    return { label: name, detail: "", icon: "generic" };
  }
  return { label: name, detail: clip(firstLine(argsPreview)), icon: "generic" };
}

// src/client/tool-icon.tsx
var React2 = __toESM(require("react"), 1);
function pathsOf(kind) {
  const stroke2 = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };
  switch (kind) {
    case "terminal":
      return React2.createElement(
        React2.Fragment,
        null,
        React2.createElement("polyline", { key: "a", points: "4 17 10 11 4 5", ...stroke2 }),
        React2.createElement("line", { key: "b", x1: 12, y1: 19, x2: 20, y2: 19, ...stroke2 })
      );
    case "file-read":
      return React2.createElement(
        React2.Fragment,
        null,
        React2.createElement("path", { key: "a", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", ...stroke2 }),
        React2.createElement("polyline", { key: "b", points: "14 2 14 8 20 8", ...stroke2 }),
        React2.createElement("line", { key: "c", x1: 8, y1: 13, x2: 16, y2: 13, ...stroke2 }),
        React2.createElement("line", { key: "d", x1: 8, y1: 17, x2: 13, y2: 17, ...stroke2 })
      );
    case "file-write":
      return React2.createElement(
        React2.Fragment,
        null,
        React2.createElement("path", { key: "a", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", ...stroke2 }),
        React2.createElement("polyline", { key: "b", points: "14 2 14 8 20 8", ...stroke2 }),
        React2.createElement("line", { key: "c", x1: 12, y1: 12, x2: 12, y2: 17, ...stroke2 }),
        React2.createElement("polyline", { key: "d", points: "9.5 14.5 12 17 14.5 14.5", ...stroke2 })
      );
    case "file-edit":
      return React2.createElement(
        React2.Fragment,
        null,
        React2.createElement("path", { key: "a", d: "M12 20h9", ...stroke2 }),
        React2.createElement("path", { key: "b", d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", ...stroke2 })
      );
    case "search":
      return React2.createElement(
        React2.Fragment,
        null,
        React2.createElement("circle", { key: "a", cx: 11, cy: 11, r: 7, ...stroke2 }),
        React2.createElement("line", { key: "b", x1: 21, y1: 21, x2: 16.65, y2: 16.65, ...stroke2 })
      );
    case "folder":
      return React2.createElement("path", {
        d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        ...stroke2
      });
    case "mcp":
      return React2.createElement(
        React2.Fragment,
        null,
        React2.createElement("line", { key: "a", x1: 9, y1: 2, x2: 9, y2: 7, ...stroke2 }),
        React2.createElement("line", { key: "b", x1: 15, y1: 2, x2: 15, y2: 7, ...stroke2 }),
        React2.createElement("path", { key: "c", d: "M6 7h12v5a6 6 0 0 1-12 0z", ...stroke2 }),
        React2.createElement("line", { key: "d", x1: 12, y1: 18, x2: 12, y2: 22, ...stroke2 })
      );
    case "alert":
      return React2.createElement(
        React2.Fragment,
        null,
        React2.createElement("path", { key: "a", d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", ...stroke2 }),
        React2.createElement("line", { key: "b", x1: 12, y1: 9, x2: 12, y2: 13, ...stroke2 }),
        React2.createElement("line", { key: "c", x1: 12, y1: 17, x2: 12.01, y2: 17, ...stroke2 })
      );
    case "generic":
      return React2.createElement("path", {
        key: "a",
        d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z",
        ...stroke2
      });
    default:
      return null;
  }
}
function ToolIcon({ kind, tone }) {
  if (kind === "generic" || kind === "alert") {
    return React2.createElement(
      "span",
      { className: `ttl-rowIcon ttl-icon-${tone}`, "aria-hidden": "true" },
      React2.createElement("svg", { viewBox: "0 0 24 24", width: 13, height: 13, focusable: "false" }, pathsOf(kind))
    );
  }
  return React2.createElement(
    "span",
    { className: `ttl-rowIcon ttl-icon-${tone}`, "aria-hidden": "true" },
    React2.createElement("svg", { viewBox: "0 0 24 24", width: 13, height: 13, focusable: "false" }, pathsOf(kind))
  );
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
  const firstLine3 = (text.split("\n", 1)[0] ?? "").trimStart();
  if (firstLine3.startsWith("Error:") || firstLine3.startsWith("Traceback")) return false;
  if (/^at\s/.test(firstLine3)) return false;
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

// src/client/format.ts
function formatDuration(ms) {
  if (ms === void 0 || !Number.isFinite(ms) || ms < 0) return "";
  if (ms < 1e4) return `${(ms / 1e3).toFixed(1)}s`;
  if (ms < 6e4) return `${Math.round(ms / 1e3)}s`;
  const total = Math.round(ms / 1e3);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m${String(seconds).padStart(2, "0")}s`;
}
function formatClock(ms) {
  if (ms === void 0 || !Number.isFinite(ms)) return "";
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function turnDuration(startedAt, endedAt) {
  if (startedAt === void 0 || endedAt === void 0) return "";
  return formatDuration(endedAt - startedAt);
}
function toolFamily(name, isError) {
  if (isError) return "error";
  if (name.startsWith("mcp__") || name.startsWith("mcp_")) return "mcp";
  if (name === "bash" || name === "bash_output" || name === "shell" || name === "pwsh") return "shell";
  if (name === "read" || name === "read_image" || name === "glob" || name === "grep" || name === "search" || name === "ls") return "read";
  if (name === "write" || name === "edit" || name === "append") return "edit";
  if (name === "todo_write" || name === "todo_read") return "todo";
  return "generic";
}

// src/client/StepDetail.tsx
var React6 = __toESM(require("react"), 1);

// src/client/json-tree.tsx
var React4 = __toESM(require("react"), 1);
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
  const capped = React4.useMemo(
    () => countNodes(value, maxNodes, maxDepth) > maxNodes,
    [value, maxNodes, maxDepth]
  );
  const [openPaths, setOpenPaths] = React4.useState(
    () => /* @__PURE__ */ new Set([ROOT_PATH])
  );
  const [pageCounts, setPageCounts] = React4.useState(
    () => /* @__PURE__ */ new Map()
  );
  const onToggle = React4.useCallback((path, open) => {
    setOpenPaths((current) => {
      if (current.has(path) === open) return current;
      const next = new Set(current);
      if (open) next.add(path);
      else next.delete(path);
      return next;
    });
  }, []);
  const onMore = React4.useCallback((path) => {
    setPageCounts((current) => {
      const next = new Map(current);
      next.set(path, (next.get(path) ?? 1) + 1);
      return next;
    });
  }, []);
  return /* @__PURE__ */ React4.createElement("div", { className: "ttl-json", "data-testid": "ttl-json" }, capped ? /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonCapped", "data-testid": "ttl-json-capped" }, t(lang, "jsonTooLarge")) : /* @__PURE__ */ React4.createElement(
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
  const keyEl = keyName === null ? null : /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonKey" }, keyName);
  if (value === null) {
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonNull" }, "null"));
  }
  if (typeof value === "boolean") {
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonBool" }, String(value)));
  }
  if (typeof value === "number") {
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonNum" }, String(value)));
  }
  if (typeof value === "string") {
    if (value.length > STRING_BOX_CHARS) {
      return /* @__PURE__ */ React4.createElement(StringNode, { keyName, text: value, lang });
    }
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonStr" }, value));
  }
  if (typeof value !== "object") {
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonNull" }, String(value)));
  }
  if (depth >= maxDepth) {
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonMore" }, "\u2026"));
  }
  if (seen.has(value)) {
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonNull" }, "[Circular]"));
  }
  if (!openPaths.has(path)) {
    const count = Array.isArray(value) ? value.length : Object.keys(value).length;
    return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, /* @__PURE__ */ React4.createElement(
      "button",
      {
        type: "button",
        className: "ttl-jsonToggle",
        "data-testid": "ttl-json-toggle",
        "aria-expanded": false,
        onClick: () => onToggle(path, true)
      },
      "\u25B8"
    ), keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonPreview" }, Array.isArray(value) ? `[${count}]` : `{${count}}`));
  }
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
  const pages = pageCounts.get(path) ?? 1;
  const shown = entries.slice(0, pageSize * pages);
  const hasMore = entries.length > shown.length;
  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`;
  seen.add(value);
  return /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      type: "button",
      className: "ttl-jsonToggle",
      "data-testid": "ttl-json-toggle",
      "aria-expanded": true,
      onClick: () => onToggle(path, false)
    },
    "\u25BE"
  ), keyEl, /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonPreview" }, summary)), /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonChildren" }, shown.map(([childKey, childValue]) => /* @__PURE__ */ React4.createElement(
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
  )), hasMore ? /* @__PURE__ */ React4.createElement(
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
  const [copied, setCopied] = React4.useState(false);
  return /* @__PURE__ */ React4.createElement("div", { className: "ttl-jsonRow" }, keyName === null ? null : /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonKey" }, keyName), /* @__PURE__ */ React4.createElement("div", { className: "ttl-strbox", "data-testid": "ttl-strbox" }, /* @__PURE__ */ React4.createElement(
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
  ), /* @__PURE__ */ React4.createElement("span", { className: "ttl-jsonStr" }, text)));
}

// src/client/ui-shared.tsx
var React5 = __toESM(require("react"), 1);

// src/client/attachment-url.ts
function attachmentUrl(sessionId, ref) {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) return null;
  if (ref === null || typeof ref !== "object") return null;
  const attachmentId = ref.attachmentId;
  if (typeof attachmentId !== "string" || attachmentId.length === 0) return null;
  return `/trace-inspect/api/attachment?sessionId=${encodeURIComponent(sessionId)}&attachmentId=${encodeURIComponent(attachmentId)}`;
}

// src/client/ui-shared.tsx
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`;
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
  return /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgRow", "data-testid": "ttl-img-row" }, images.map((image, index) => /* @__PURE__ */ React5.createElement(ImageBlock, { key: `${image.attachmentId}:${index}`, image, sessionId, lang })));
}
var ImageBlock = React5.memo(function ImageBlock2(props) {
  const { image, sessionId, lang } = props;
  const [loadFailed, setLoadFailed] = React5.useState(false);
  const url = attachmentUrl(sessionId, image);
  const name = image.name ?? image.mediaType;
  const label = t(lang, "imageLabel")(name);
  const meta = /* @__PURE__ */ React5.createElement(React5.Fragment, null, /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgMeta" }, image.mediaType), image.width !== void 0 && image.height !== void 0 ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgMeta" }, t(lang, "imageMeta")(
    image.width,
    image.height,
    formatBytes(image.bytes)
  )) : null);
  const showThumb = url !== null && !loadFailed;
  return /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgItem", "data-testid": "ttl-img-item" }, showThumb ? /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgThumbWrap", "data-testid": "ttl-img-thumb-wrap" }, /* @__PURE__ */ React5.createElement(
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
  )) : null, /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgChip", "data-testid": "ttl-img-chip" }, /* @__PURE__ */ React5.createElement("span", null, label), meta), loadFailed ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-pill ttl-pillWarn", "data-testid": "ttl-img-failed" }, t(lang, "imageLoadFailed")) : null);
});

// src/client/command-format.ts
var HASH = /^[0-9a-fA-F]{40}$/;
var REDIRECT = /^(?:&>>?|(?:\d+)?(?:>>?|<)(?:&\d+|\d+|-)?)$/;
var OPERATOR_WORD = /^(?:&&|\|\||\||;)$/;
var QUOTED = /^["']/;
function isPathWord(word) {
  return word.includes("/") || word.includes("\\");
}
function operatorAt(text, index) {
  if (text.startsWith("&&", index)) return "&&";
  return text[index] === ";" ? ";" : null;
}
function classifyWord(word, first) {
  if (first) return "cmd";
  if (HASH.test(word)) return "hash";
  if (REDIRECT.test(word)) return "muted";
  if (word.startsWith("#")) return "muted";
  if (word.length > 1 && word.startsWith("-")) return "flag";
  if (QUOTED.test(word)) return "str";
  if (OPERATOR_WORD.test(word)) return "op";
  if (isPathWord(word)) return "path";
  return "sub";
}
function normalizeCommand(command) {
  return command.replace(/\\\r?\n/g, " ").replace(/\r\n?/g, "\n");
}
function splitCommand(command) {
  if (typeof command !== "string") return [];
  const text = normalizeCommand(command);
  if (text.trim().length === 0) return [];
  const segments = [];
  let tokens = [];
  let word = "";
  let quote = null;
  let connector = null;
  const flushWord = () => {
    if (word.length === 0) return;
    tokens.push({ text: word, kind: classifyWord(word, tokens.length === 0) });
    word = "";
  };
  let index = 0;
  while (index < text.length) {
    const ch = text[index];
    if (quote !== null) {
      word += ch;
      if (ch === quote) quote = null;
      index += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      word += ch;
      index += 1;
      continue;
    }
    const op = operatorAt(text, index);
    if (op !== null) {
      flushWord();
      if (tokens.length > 0) {
        segments.push({ connector, tokens });
        tokens = [];
        connector = op;
      } else if (segments.length === 0) {
        connector = null;
      } else if (connector === null) {
        connector = op;
      }
      index += op.length;
      continue;
    }
    if (ch === "\n") {
      flushWord();
      if (tokens.length > 0) {
        segments.push({ connector, tokens });
        tokens = [];
        connector = null;
      } else if (segments.length === 0) {
        connector = null;
      }
      index += 1;
      continue;
    }
    if (ch === " " || ch === "	") {
      flushWord();
      index += 1;
      continue;
    }
    word += ch;
    index += 1;
  }
  flushWord();
  if (tokens.length > 0) segments.push({ connector, tokens });
  return segments;
}
function commandStats(command) {
  if (typeof command !== "string") return { segments: 0, chars: 0 };
  return { segments: splitCommand(command).length, chars: command.trim().length };
}

// src/client/StepDetail.tsx
var CAP_KIB = 32;
var OUT_PREVIEW_LINES = 3;
var MAX_FILE_ROWS = 3;
var MAX_CHIPS = 3;
var LONG_VALUE_CHARS = 160;
var MAX_CODE_SEGMENTS = 12;
var FILE_EXT = /\.(?:png|jpe?g|gif|webp|svg|json|md|txt|pdf|csv|ts|tsx|js|jsx|html|css|yml|yaml|zip|tgz|log|toml)$/i;
var SIZE_TAIL = /\s*\(?(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)\)?\s*$/i;
var OUT_LINE_MAX = 240;
function labelsFor(lang) {
  const zh2 = lang === "zh";
  return {
    summary: zh2 ? "\u6458\u8981" : "Summary",
    params: t(lang, "detailParams"),
    result: t(lang, "detailResult"),
    raw: t(lang, "detailRaw"),
    render: t(lang, "detailRender"),
    source: t(lang, "detailSource"),
    command: zh2 ? "\u547D\u4EE4" : "Command",
    commandHint: zh2 ? "\u6309 && / ; \u5206\u6BB5 \xB7 \u81EA\u52A8\u6362\u884C" : "Split on && / ; \xB7 wrapped",
    output: zh2 ? "\u8F93\u51FA" : "Output",
    mcpCall: zh2 ? "\u8C03\u7528" : "Call",
    mcpProto: zh2 ? "MCP \u534F\u8BAE \xB7 \u8FDE\u63A5\u72B6\u6001" : "MCP protocol \xB7 connection",
    connected: zh2 ? "\u5DF2\u8FDE\u63A5" : "Connected",
    copy: t(lang, "copyField"),
    copyAll: t(lang, "copyDetail"),
    zoomTitle: t(lang, "zoomOpen"),
    closeTitle: t(lang, "zoomClose"),
    viewInCenter: t(lang, "viewInCenter"),
    clickToView: t(lang, "clickToViewFull"),
    showFull: zh2 ? "\u5C55\u5F00\u5168\u6587" : "Show full",
    collapse: t(lang, "collapseLabel"),
    collapseAll: zh2 ? "\u6536\u8D77" : "Collapse",
    showAllSegments: (n) => zh2 ? `\u5C55\u5F00\u5168\u90E8 ${n} \u6BB5` : `Show all ${n} segments`,
    ok: zh2 ? "\u6210\u529F" : "Success",
    failed: zh2 ? "\u5931\u8D25" : "Failed",
    loadingFull: t(lang, "detailLoading"),
    loadFailed: t(lang, "detailLoadFailed"),
    retry: t(lang, "detailRetry"),
    fullPill: t(lang, "fullPill"),
    truncatedPill: t(lang, "truncatedPill"),
    loadedPill: zh2 ? "\u5DF2\u52A0\u8F7D" : "Loaded",
    unparsable: t(lang, "resultUnparsable"),
    empty: t(lang, "resultEmpty"),
    markdownKind: "Markdown",
    textKind: zh2 ? "\u6587\u672C" : "Text",
    segments: (n) => zh2 ? `${n} \u6BB5` : `${n} segments`,
    chars: (n) => zh2 ? `${n} \u5B57\u7B26` : `${n} chars`,
    allItems: (n) => zh2 ? `\u5168\u90E8 ${n} \u9879` : `All ${n}`,
    lines: (n) => zh2 ? `${n} \u884C` : `${n} lines`,
    charsLines: (chars, lines) => zh2 ? `${chars} \u5B57\u7B26 \xB7 ${lines} \u884C` : `${chars} chars \xB7 ${lines} lines`,
    items: (n) => zh2 ? `${n} \u9879` : `${n} items`,
    files: (n) => zh2 ? `${n} \u4E2A\u6587\u4EF6` : `${n} files`,
    moreFiles: (n) => zh2 ? `+${n} \u4E2A\u6587\u4EF6\u5DF2\u6298\u53E0` : `+${n} more files`,
    truncatedResult: (cap) => zh2 ? `\u7ED3\u679C\u88AB\u622A\u65AD\u81F3 ${cap}` : `Result truncated to ${cap}`,
    truncatedArgs: (cap) => zh2 ? `\u53C2\u6570\u88AB\u622A\u65AD\u81F3 ${cap}` : `Arguments truncated to ${cap}`,
    linesTotal: (n) => zh2 ? `\u5171 ${n} \u884C` : `${n} lines total`,
    metaArgsChars: (n) => zh2 ? `\u53C2\u6570 ${n} \u5B57\u7B26` : `${n} chars`,
    metaArgsItems: (n) => zh2 ? `\u53C2\u6570 ${n} \u9879` : `${n} items`,
    metaResult: (size) => zh2 ? `\u7ED3\u679C ${size}` : `Result ${size}`,
    merged: (n) => t(lang, "mergedNoSurfaceOp")(n),
    replaced: (n) => t(lang, "resultReplaced")(n),
    orphan: t(lang, "orphanResult")
  };
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function utf8Bytes(text) {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 128) bytes += 1;
    else if (code < 2048) bytes += 2;
    else if (code >= 55296 && code <= 56319) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
  }
  return bytes;
}
function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 10) return `${Math.round(kb * 10) / 10} KB`;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${Math.round(kb / 1024 * 10) / 10} MB`;
}
function lineCount(text) {
  if (text.length === 0) return 0;
  let lines = 1;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") lines += 1;
  }
  return lines;
}
function iconToneOf(family) {
  switch (family) {
    case "shell":
      return "violet";
    case "read":
      return "blue";
    case "edit":
      return "success";
    case "mcp":
      return "violet";
    case "todo":
      return "warn";
    case "error":
      return "red";
    default:
      return "neutral";
  }
}
var KEY_LABELS = {
  cwd: { zh: "\u5DE5\u4F5C\u76EE\u5F55", en: "Working dir" },
  description: { zh: "\u63CF\u8FF0", en: "Description" },
  command: { zh: "\u547D\u4EE4", en: "Command" },
  file_path: { zh: "\u6587\u4EF6\u8DEF\u5F84", en: "File path" },
  path: { zh: "\u8DEF\u5F84", en: "Path" },
  content: { zh: "\u5185\u5BB9", en: "Content" },
  old_string: { zh: "\u539F\u5185\u5BB9", en: "Old text" },
  new_string: { zh: "\u65B0\u5185\u5BB9", en: "New text" },
  timeout: { zh: "\u8D85\u65F6", en: "Timeout" },
  offset: { zh: "\u8D77\u59CB\u884C", en: "Offset" },
  limit: { zh: "\u884C\u6570\u4E0A\u9650", en: "Limit" },
  append: { zh: "\u8FFD\u52A0", en: "Append" },
  pattern: { zh: "\u6A21\u5F0F", en: "Pattern" },
  query: { zh: "\u67E5\u8BE2", en: "Query" },
  url: { zh: "\u5730\u5740", en: "URL" },
  encoding: { zh: "\u7F16\u7801", en: "Encoding" }
};
function keyLabel(key, lang) {
  const known = KEY_LABELS[key];
  return known === void 0 ? key : known[lang];
}
function chipText(value) {
  const text = typeof value === "string" ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : "\u2026";
  return text.length > 20 ? `${text.slice(0, 19)}\u2026` : text;
}
function looksLikeFilePath(token) {
  if (token.includes("/") || token.includes("\\")) return true;
  return FILE_EXT.test(token);
}
function fileEntryOfPath(path, size) {
  const entry = { path, name: fileBaseName(path) };
  if (size !== void 0) entry.size = size;
  return entry;
}
function sizeToBytes(size) {
  const match = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i.exec(size.trim());
  if (match === null) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = (match[2] ?? "B").toUpperCase();
  const factor = unit === "GB" ? 1024 ** 3 : unit === "MB" ? 1024 ** 2 : unit === "KB" ? 1024 : 1;
  return amount * factor;
}
function totalSizeOf(entries) {
  let bytes = 0;
  for (const entry of entries) {
    if (entry.size === void 0) return null;
    const size = sizeToBytes(entry.size);
    if (size === null) return null;
    bytes += size;
  }
  return formatSize(bytes);
}
function fileEntriesOf(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 2e4) return null;
  if (trimmed.startsWith("[")) {
    const parsed = parseJsonLoose(trimmed);
    if (!parsed.ok || !Array.isArray(parsed.value)) return null;
    const entries2 = [];
    for (const item of parsed.value) {
      if (typeof item === "string") {
        entries2.push(fileEntryOfPath(item, void 0));
        continue;
      }
      if (!isPlainObject(item)) continue;
      const path = item.path ?? item.file ?? item.name;
      if (typeof path !== "string" || path.length === 0) continue;
      const rawSize = item.size;
      const size = typeof rawSize === "string" ? rawSize : typeof rawSize === "number" && Number.isFinite(rawSize) ? formatSize(rawSize) : void 0;
      entries2.push(fileEntryOfPath(path, size));
    }
    return entries2.length > 0 ? entries2 : null;
  }
  const lines = trimmed.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) return null;
  const entries = [];
  for (const line of lines.slice(0, 60)) {
    const cleaned = line.replace(/^[-*•]\s+/, "");
    let body = cleaned;
    let size;
    const sizeMatch = SIZE_TAIL.exec(cleaned);
    if (sizeMatch !== null) {
      size = `${sizeMatch[1]} ${(sizeMatch[2] ?? "B").toUpperCase()}`;
      body = cleaned.slice(0, sizeMatch.index);
    }
    let path = null;
    for (const token of body.split(/\s+/)) {
      if (token.length === 0) continue;
      if (path === null && looksLikeFilePath(token)) path = token.replace(/[,:]$/, "");
    }
    if (path !== null) entries.push(fileEntryOfPath(path, size));
  }
  if (entries.length === 0) return null;
  if (entries.length / lines.length < 0.6) return null;
  return entries;
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
function CopyButton(props) {
  const { text, testid, label, className } = props;
  const [copied, setCopied] = React6.useState(false);
  return /* @__PURE__ */ React6.createElement(
    "button",
    {
      type: "button",
      className,
      "data-testid": testid,
      title: label,
      "aria-label": label,
      onClick: () => {
        copyToClipboard(text);
        setCopied(true);
      }
    },
    copied ? "\u2713" : "\u29C9"
  );
}
function ParamSection(props) {
  const { entries, total, lang, labels, showTypes } = props;
  if (entries.length === 0) return null;
  return /* @__PURE__ */ React6.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionLabel" }, labels.params), /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionMeta" }, labels.allItems(total))), /* @__PURE__ */ React6.createElement("div", { className: "ttl-kv", "data-testid": "ttl-kv" }, entries.map(([key, value]) => /* @__PURE__ */ React6.createElement("div", { className: "ttl-kvRow", key }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvKey", title: key }, keyLabel(key, lang)), /* @__PURE__ */ React6.createElement(KvValue, { value, labels, showTypes })))));
}
function KvValue(props) {
  const { value, labels, showTypes } = props;
  if (Array.isArray(value)) {
    const chips = value.slice(0, MAX_CHIPS);
    const rest = value.length - chips.length;
    return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvVal ttl-kvChips" }, chips.map((item, index) => /* @__PURE__ */ React6.createElement("span", { className: "ttl-chipTag", key: index }, chipText(item))), rest > 0 ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-chipTag ttl-chipMore" }, `+${rest}`) : null), /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvType" }, `array \xB7 ${labels.items(value.length)}`));
  }
  if (isPlainObject(value)) {
    const count = Object.keys(value).length;
    return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvVal" }, `{${count}}`), /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvType" }, `object \xB7 ${labels.items(count)}`));
  }
  if (value === null) {
    return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvVal ttl-kvMuted" }, "null"), showTypes ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvType" }, "null") : null);
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvVal" }, String(value)), /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvType" }, typeof value));
  }
  const text = typeof value === "string" ? value : String(value);
  if (text.includes("\n") || text.length > LONG_VALUE_CHARS) {
    return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvVal ttl-kvLong", title: text }, labels.charsLines(text.length, lineCount(text))), showTypes ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvType" }, "string") : null);
  }
  return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvVal", title: text }, text), showTypes ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-kvType" }, "string") : null);
}
function CommandSection(props) {
  const { command, toolName, labels } = props;
  const segments = React6.useMemo(() => splitCommand(command), [command]);
  const [allSegments, setAllSegments] = React6.useState(false);
  if (segments.length === 0) return null;
  const stats = commandStats(command);
  const shown = allSegments ? segments : segments.slice(0, MAX_CODE_SEGMENTS);
  return /* @__PURE__ */ React6.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionLabel" }, labels.command), /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionHint" }, labels.commandHint), segments.length > MAX_CODE_SEGMENTS ? /* @__PURE__ */ React6.createElement(
    "button",
    {
      type: "button",
      className: "ttl-sectionAction ttl-sectionActionText",
      "data-testid": "ttl-code-toggle",
      "aria-expanded": allSegments,
      onClick: () => {
        setAllSegments(!allSegments);
      }
    },
    allSegments ? labels.collapseAll : labels.showAllSegments(segments.length)
  ) : null, /* @__PURE__ */ React6.createElement(CopyButton, { text: command, testid: "ttl-cmd-copy", label: labels.copy, className: "ttl-sectionAction" })), /* @__PURE__ */ React6.createElement("div", { className: "ttl-code", "data-testid": "ttl-code" }, shown.map((segment, index) => /* @__PURE__ */ React6.createElement("div", { className: "ttl-codeLine", key: index }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-codeGutter", "aria-hidden": "true" }, index + 1), /* @__PURE__ */ React6.createElement("span", { className: "ttl-codeText" }, segment.connector !== null ? /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-tok-op" }, segment.connector), " ") : null, segment.tokens.map((token, tokenIndex) => /* @__PURE__ */ React6.createElement(React6.Fragment, { key: tokenIndex }, tokenIndex > 0 ? " " : null, /* @__PURE__ */ React6.createElement("span", { className: `ttl-tok-${token.kind}` }, token.text)))))), /* @__PURE__ */ React6.createElement("div", { className: "ttl-codeFoot", "data-testid": "ttl-code-foot" }, /* @__PURE__ */ React6.createElement("span", null, `${labels.segments(stats.segments)} \xB7 ${labels.chars(stats.chars)}`), /* @__PURE__ */ React6.createElement("span", { className: "ttl-codeTool" }, toolName))));
}
function OutputSection(props) {
  const { text, labels, error } = props;
  const [expanded, setExpanded] = React6.useState(false);
  const lines = React6.useMemo(() => {
    const normalized = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
    return normalized.length === 0 ? [] : normalized.split("\n");
  }, [text]);
  if (lines.length === 0) return null;
  const shown = expanded ? lines : lines.slice(0, OUT_PREVIEW_LINES);
  return /* @__PURE__ */ React6.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionLabel" }, labels.output), /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionMeta" }, `${formatSize(utf8Bytes(text))} \xB7 ${labels.lines(lines.length)}`), lines.length > OUT_PREVIEW_LINES ? /* @__PURE__ */ React6.createElement(
    "button",
    {
      type: "button",
      className: "ttl-sectionAction ttl-sectionActionText",
      "data-testid": "ttl-out-toggle",
      "aria-expanded": expanded,
      onClick: () => {
        setExpanded(!expanded);
      }
    },
    expanded ? labels.collapse : labels.showFull
  ) : null), /* @__PURE__ */ React6.createElement("div", { className: `ttl-outBlock${error ? " ttl-outBlockError" : ""}`, "data-testid": "ttl-outBlock" }, shown.map((line, index) => {
    const rendered = !expanded && line.length > OUT_LINE_MAX ? `${line.slice(0, OUT_LINE_MAX)}\u2026` : line;
    return /* @__PURE__ */ React6.createElement("div", { className: "ttl-outLine", key: index }, rendered.length === 0 ? "\xA0" : rendered);
  })));
}
function McpSection(props) {
  const { labels } = props;
  return /* @__PURE__ */ React6.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionLabel" }, labels.mcpCall), /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionHint" }, labels.mcpProto)), /* @__PURE__ */ React6.createElement("div", { className: "ttl-mcpBlock", "data-testid": "ttl-mcpBlock" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-mcpBadge" }, "MCP"), /* @__PURE__ */ React6.createElement("span", { className: "ttl-mcpDot", "aria-hidden": "true" }), /* @__PURE__ */ React6.createElement("span", { className: "ttl-mcpState" }, labels.connected)));
}
function FileSection(props) {
  const { path, stats, labels } = props;
  return /* @__PURE__ */ React6.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-fileBlock", "data-testid": "ttl-fileBlock" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-filePath", title: path }, path), /* @__PURE__ */ React6.createElement("span", { className: "ttl-fileStats" }, stats.map((stat) => /* @__PURE__ */ React6.createElement("span", { className: "ttl-chipTag ttl-fileChip", key: stat }, stat)))));
}
function FilesSection(props) {
  const { entries, labels } = props;
  const shown = entries.slice(0, MAX_FILE_ROWS);
  const more = entries.length - shown.length;
  const total = totalSizeOf(entries);
  const meta = total === null ? labels.files(entries.length) : `${labels.files(entries.length)} \xB7 ${total}`;
  return /* @__PURE__ */ React6.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionLabel" }, labels.result), /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionMeta" }, meta)), /* @__PURE__ */ React6.createElement("div", { className: "ttl-files", "data-testid": "ttl-files" }, shown.map((entry, index) => /* @__PURE__ */ React6.createElement("div", { className: "ttl-fileRow", key: `${entry.path}:${index}` }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-fileIcon", "aria-hidden": "true" }, /* @__PURE__ */ React6.createElement(ToolIcon, { kind: "file-read", tone: "neutral" })), /* @__PURE__ */ React6.createElement("span", { className: "ttl-fileName", title: entry.path }, entry.name), entry.size !== void 0 ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-fileSize" }, entry.size) : null)), more > 0 ? /* @__PURE__ */ React6.createElement("div", { className: "ttl-fileMore" }, labels.moreFiles(more)) : null));
}
var TABS = [
  { value: "summary", key: "summary" },
  { value: "result", key: "result" },
  { value: "params", key: "params" },
  { value: "raw", key: "raw" }
];
function StepDetail(props) {
  const { id, step, sessionId, lang, view, onSetView, onLoadDetail, onZoom, onClose } = props;
  const labels = React6.useMemo(() => labelsFor(lang), [lang]);
  const result = step.result;
  const args = step.args ?? "";
  const [tab, setTab] = React6.useState("summary");
  const [detail, setDetail] = React6.useState(void 0);
  const [loadFailed, setLoadFailed] = React6.useState(false);
  const [retries, setRetries] = React6.useState(0);
  const truncated = step.argsTruncated === true || result?.truncated === true;
  const needsDetail = truncated;
  const retryDetail = React6.useCallback(() => {
    setRetries((current) => current >= 1 ? current : current + 1);
  }, []);
  React6.useEffect(() => {
    if (!needsDetail) return void 0;
    let alive = true;
    setLoadFailed(false);
    void onLoadDetail(step.seq).then((outcome) => {
      if (!alive) return;
      const item = outcome.ok ? outcome.items.find((entry) => entry.seq === step.seq) ?? outcome.items[0] : void 0;
      if (item !== void 0) setDetail(item);
      else setLoadFailed(true);
    }, () => {
      if (alive) setLoadFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [needsDetail, onLoadDetail, step.seq, retries]);
  const loaded = detail !== void 0;
  const fullArgs = loaded && detail.arguments !== null ? detail.arguments : args;
  const parsed = React6.useMemo(() => parseJsonLoose(fullArgs), [fullArgs]);
  const parsedArgs = parsed.ok && isPlainObject(parsed.value) ? parsed.value : null;
  const fullText = loaded ? detailTextOf(detail) : result?.text ?? "";
  const fullImages = loaded ? detailImagesOf(detail) : result?.images ?? [];
  const pillTruncated = loaded ? detail.truncated === true : truncated;
  const detailPhase = !needsDetail ? "ready" : loaded ? "ready" : loadFailed ? "failed" : "loading";
  const isError = loaded ? detail.isError || result?.isError === true || result?.kind === "error" || step.kind === "error" : result?.isError === true || result?.kind === "error" || step.kind === "error";
  const family = toolFamily(step.name, isError);
  const summary = React6.useMemo(
    () => summarizeToolCall(step.name, step.args, step.argsPreview, lang),
    [step.name, step.args, step.argsPreview, lang]
  );
  const isMcp = family === "mcp" || summary.icon === "mcp";
  const commandText = parsedArgs !== null && typeof parsedArgs.command === "string" ? parsedArgs.command : "";
  const mcpName = splitMcpName(step.name);
  const serverName = mcpName !== null ? mcpName.server : summary.label;
  const toolName = mcpName !== null ? mcpName.tool : summary.toolName ?? "";
  let desc = summary.detail;
  if (isMcp && toolName.length > 0) {
    if (desc === toolName) desc = "";
    else if (desc.startsWith(`${toolName} \xB7 `)) desc = desc.slice(toolName.length + 3);
  }
  const titleOf2 = (name) => t(lang, "detailAria")(name);
  const openZoomFor = (which, element) => {
    const wrap = element.closest(".ttl-stepWrap");
    const row = wrap !== null ? wrap.querySelector('[data-testid="ttl-step"]') : null;
    onZoom(step, row instanceof HTMLElement ? row : null, which);
  };
  const openZoomFromPane = (event) => {
    const target = event.target;
    if (target !== null && typeof target.closest === "function" && target.closest("button, a, input, textarea, select") !== null) return;
    if (typeof window !== "undefined" && (window.getSelection?.()?.toString() ?? "").length > 0) return;
    openZoomFor(tab, event.currentTarget);
  };
  const statusMeta = () => {
    if (tab === "result" || tab === "raw") {
      return fullText.length > 0 ? labels.metaResult(formatSize(utf8Bytes(fullText))) : "";
    }
    if (isMcp && parsedArgs !== null) return labels.metaArgsItems(Object.keys(parsedArgs).length);
    if ((family === "read" || family === "edit") && fullText.length > 0) {
      return labels.metaResult(formatSize(utf8Bytes(fullText)));
    }
    if (family === "shell" && commandText.length > 0) return labels.metaArgsChars(commandStats(commandText).chars);
    return args.length > 0 ? labels.metaArgsChars(args.length) : "";
  };
  const copiedAll = () => {
    copyToClipboard(fullText.length > 0 ? `${fullArgs.length > 0 ? `${fullArgs}

` : ""}${fullText}` : fullArgs);
  };
  const mergedNote = result !== void 0 && (result.mergedFrom ?? 0) > 1 && result.replacedBy === void 0 ? /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailMerged", role: "note", "data-testid": "ttl-detail-merged" }, labels.merged(result.mergedFrom ?? 0)) : null;
  const loadBanner = () => {
    if (!needsDetail) return null;
    if (detailPhase === "ready" && !pillTruncated) return null;
    const title = result?.truncated === true ? labels.truncatedResult(`${CAP_KIB} KiB`) : labels.truncatedArgs(`${CAP_KIB} KiB`);
    const sub = detailPhase === "loading" ? labels.loadingFull : detailPhase === "failed" ? labels.loadFailed : `${labels.linesTotal(lineCount(fullText))}`;
    return /* @__PURE__ */ React6.createElement("div", { className: "ttl-bannerWarn", "data-testid": "ttl-bannerWarn", role: "note" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-bannerIcon", "aria-hidden": "true" }, "\u26A0"), /* @__PURE__ */ React6.createElement("span", { className: "ttl-bannerText" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-bannerTitle" }, title), /* @__PURE__ */ React6.createElement("span", { className: "ttl-bannerSub" }, sub)), detailPhase === "loading" ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-bannerAction", "data-testid": "ttl-detail-load" }, labels.loadingFull) : detailPhase === "failed" ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-bannerAction", "data-testid": "ttl-detail-load" }, /* @__PURE__ */ React6.createElement(
      "button",
      {
        type: "button",
        className: "ttl-detailRetry",
        "data-testid": "ttl-detail-retry",
        disabled: retries >= 1,
        onClick: retryDetail
      },
      labels.retry
    )) : null);
  };
  const renderParams = () => /* @__PURE__ */ React6.createElement(React6.Fragment, null, parsed.ok ? /* @__PURE__ */ React6.createElement(JsonTree, { value: parsed.value }) : /* @__PURE__ */ React6.createElement(React6.Fragment, null, fullArgs.length > 0 ? /* @__PURE__ */ React6.createElement(RawText, { text: fullArgs }) : null, /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-unparsable" }, labels.unparsable)), loadBanner());
  const renderResult = () => {
    if (result === void 0 && !loaded) {
      return /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-empty" }, labels.empty);
    }
    if (isError) {
      const errorName = detail?.error?.name ?? result?.errorName ?? step.name;
      const errorCode = detail?.error?.code ?? result?.errorCode ?? step.errorCode;
      return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("div", { className: "ttl-errorBlock", "data-testid": "ttl-error-block" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-errorName", "data-testid": "ttl-error-name" }, errorCode !== void 0 ? `${errorName} \xB7 ${errorCode}` : errorName), fullText.length > 0 ? /* @__PURE__ */ React6.createElement(RawText, { text: fullText }) : null, fullImages.length > 0 ? /* @__PURE__ */ React6.createElement(TrailImages, { images: fullImages, sessionId, lang }) : null, mergedNote), loadBanner());
    }
    if (fullText.length === 0 && fullImages.length === 0) {
      return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-empty" }, labels.empty), loadBanner(), mergedNote);
    }
    const markdown2 = looksLikeMarkdown(fullText);
    return /* @__PURE__ */ React6.createElement(React6.Fragment, null, markdown2 && view === "rendered" ? /* @__PURE__ */ React6.createElement(MarkdownResult, { text: fullText, labels: markdownLabels(lang) }) : fullText.length > 0 ? /* @__PURE__ */ React6.createElement(RawText, { text: fullText }) : null, fullImages.length > 0 ? /* @__PURE__ */ React6.createElement(TrailImages, { images: fullImages, sessionId, lang }) : null, loadBanner(), mergedNote);
  };
  const renderRaw = () => /* @__PURE__ */ React6.createElement(React6.Fragment, null, result?.replacedBy !== void 0 ? /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-replaced" }, labels.replaced(result.replacedBy)) : null, step.orphan === true ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-pill ttl-pillWarn", "data-testid": "ttl-detail-orphan" }, labels.orphan) : null, fullArgs.length > 0 ? /* @__PURE__ */ React6.createElement("div", { className: "ttl-rawSection" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionLabel" }, labels.params)), /* @__PURE__ */ React6.createElement("pre", { className: "ttl-raw", "data-testid": "ttl-raw-args" }, fullArgs)) : null, fullText.length > 0 ? /* @__PURE__ */ React6.createElement("div", { className: "ttl-rawSection" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-sectionLabel" }, labels.result)), /* @__PURE__ */ React6.createElement("pre", { className: "ttl-raw", "data-testid": "ttl-raw-result" }, fullText)) : null);
  const renderSummary = () => {
    const entries = parsedArgs !== null ? Object.entries(parsedArgs) : [];
    const total = entries.length;
    const sections = [];
    const outputText = (() => {
      if (isError && fullText.length === 0) return step.error;
      if (family === "read" || family === "edit") {
        const envelope = unwrapFileResult(fullText);
        if (envelope !== null) return envelope.body;
      }
      return fullText;
    })();
    const output = () => /* @__PURE__ */ React6.createElement(OutputSection, { key: "output", text: outputText, labels, error: isError });
    if (family === "shell") {
      const command = commandText;
      if (command.length > 0) {
        sections.push(
          /* @__PURE__ */ React6.createElement(CommandSection, { key: "command", command, toolName: summary.label, labels })
        );
        const rest = entries.filter(([key]) => key !== "command");
        sections.push(
          /* @__PURE__ */ React6.createElement(
            ParamSection,
            {
              key: "params",
              entries: rest,
              total,
              lang,
              labels,
              showTypes: false
            }
          )
        );
        const out2 = output();
        if (out2 !== null) sections.push(out2);
        return /* @__PURE__ */ React6.createElement(React6.Fragment, null, sections, loadBanner());
      }
    }
    if (isMcp) {
      sections.push(/* @__PURE__ */ React6.createElement(McpSection, { key: "mcp", labels }));
      sections.push(
        /* @__PURE__ */ React6.createElement(
          ParamSection,
          {
            key: "params",
            entries,
            total,
            lang,
            labels,
            showTypes: true
          }
        )
      );
      const files = fileEntriesOf(fullText);
      if (files !== null) sections.push(/* @__PURE__ */ React6.createElement(FilesSection, { key: "files", entries: files, labels }));
      else {
        const out2 = output();
        if (out2 !== null) sections.push(out2);
      }
      return /* @__PURE__ */ React6.createElement(React6.Fragment, null, sections, loadBanner());
    }
    if (family === "read" || family === "edit" || family === "todo") {
      const filePath = parsedArgs !== null && typeof parsedArgs.file_path === "string" ? parsedArgs.file_path : parsedArgs !== null && typeof parsedArgs.path === "string" ? parsedArgs.path : "";
      const stats = [];
      if (family === "read" && outputText.length > 0) stats.push(labels.lines(lineCount(outputText)));
      if (family === "edit" && parsedArgs !== null) {
        const nextText = typeof parsedArgs.new_string === "string" ? parsedArgs.new_string : "";
        const prevText = typeof parsedArgs.old_string === "string" ? parsedArgs.old_string : "";
        const content = typeof parsedArgs.content === "string" ? parsedArgs.content : "";
        if (nextText.length > 0) stats.push(`+${lineCount(nextText)}`);
        if (prevText.length > 0) stats.push(`\u2212${lineCount(prevText)}`);
        if (nextText.length === 0 && prevText.length === 0 && content.length > 0) {
          stats.push(`+${lineCount(content)}`);
        }
      }
      if (filePath.length > 0) {
        sections.push(/* @__PURE__ */ React6.createElement(FileSection, { key: "file", path: filePath, stats, labels }));
      }
      const rest = entries.filter(([key]) => key !== "file_path" && key !== "path");
      sections.push(
        /* @__PURE__ */ React6.createElement(
          ParamSection,
          {
            key: "params",
            entries: rest,
            total,
            lang,
            labels,
            showTypes: false
          }
        )
      );
      const out2 = output();
      if (out2 !== null) sections.push(out2);
      return /* @__PURE__ */ React6.createElement(React6.Fragment, null, sections, loadBanner());
    }
    sections.push(
      /* @__PURE__ */ React6.createElement(
        ParamSection,
        {
          key: "params",
          entries,
          total,
          lang,
          labels,
          showTypes: false
        }
      )
    );
    const out = output();
    if (out !== null) sections.push(out);
    return /* @__PURE__ */ React6.createElement(React6.Fragment, null, sections, loadBanner());
  };
  const duration = formatDuration(
    step.startedAt !== void 0 && step.endedAt !== void 0 ? step.endedAt - step.startedAt : void 0
  );
  const meta = statusMeta();
  const markdown = looksLikeMarkdown(fullText);
  const resultMeta = fullText.length > 0 ? [markdown ? labels.markdownKind : labels.textKind, formatSize(utf8Bytes(fullText)), labels.lines(lineCount(fullText))].join(" \xB7 ") : "";
  const pillText = pillTruncated ? labels.truncatedPill : loaded ? labels.loadedPill : labels.fullPill;
  return /* @__PURE__ */ React6.createElement(
    "div",
    {
      className: "ttl-detail",
      id,
      role: "region",
      "aria-label": titleOf2(step.name),
      "data-testid": "ttl-detail",
      "data-tab": tab
    },
    /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailHead" }, /* @__PURE__ */ React6.createElement("span", { className: `ttl-detailIcon ttl-tone-${family}`, "aria-hidden": "true" }, /* @__PURE__ */ React6.createElement(ToolIcon, { kind: summary.icon, tone: iconToneOf(family) })), /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailName" }, serverName), isMcp && toolName.length > 0 ? /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailSep", "aria-hidden": "true" }, "/"), /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailTool" }, toolName)) : null, desc.length > 0 ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailDesc", title: desc }, desc) : null, /* @__PURE__ */ React6.createElement(
      CopyButton,
      {
        text: fullText.length > 0 ? `${fullArgs.length > 0 ? `${fullArgs}

` : ""}${fullText}` : fullArgs,
        testid: "ttl-detail-copy",
        label: labels.copyAll,
        className: "ttl-detailAction"
      }
    ), /* @__PURE__ */ React6.createElement(
      "button",
      {
        type: "button",
        className: "ttl-detailAction",
        "data-testid": "ttl-detail-zoom",
        title: labels.zoomTitle,
        "aria-label": labels.zoomTitle,
        onClick: (event) => {
          openZoomFor(tab, event.currentTarget);
        }
      },
      "\u2922"
    ), onClose !== void 0 ? /* @__PURE__ */ React6.createElement(
      "button",
      {
        type: "button",
        className: "ttl-detailAction",
        "data-testid": "ttl-detail-close",
        title: labels.closeTitle,
        "aria-label": labels.closeTitle,
        onClick: () => {
          onClose();
        }
      },
      "\u2715"
    ) : null),
    /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailStatus" }, /* @__PURE__ */ React6.createElement("span", { className: `ttl-statusDot ${isError ? "ttl-dot-red" : "ttl-dot-green"}`, "aria-hidden": "true" }), /* @__PURE__ */ React6.createElement("span", { className: "ttl-statusText" }, isError ? labels.failed : labels.ok), duration.length > 0 ? /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailDur" }, duration), /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailSep", "aria-hidden": "true" }, "\xB7")) : null, /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailSeq", "data-testid": "ttl-detail-seq" }, `seq #${step.seq}`), meta.length > 0 ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailMeta" }, meta) : null),
    /* @__PURE__ */ React6.createElement("div", { className: "ttl-tabs", role: "tablist" }, TABS.map((entry) => /* @__PURE__ */ React6.createElement(
      "button",
      {
        key: entry.value,
        type: "button",
        role: "tab",
        "aria-selected": tab === entry.value,
        className: `ttl-tab${tab === entry.value ? " ttl-tabSelected" : ""}`,
        "data-testid": `ttl-detail-tab-${entry.value}`,
        onClick: () => {
          setTab(entry.value);
        }
      },
      labels[entry.key]
    ))),
    /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailBody", "data-testid": `ttl-detail-body-${tab}` }, /* @__PURE__ */ React6.createElement(
      "div",
      {
        className: "ttl-clickablePane",
        "data-testid": "ttl-pane-clickable",
        title: labels.clickToView,
        onClick: openZoomFromPane
      },
      tab === "summary" ? renderSummary() : null,
      tab === "result" ? /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement("div", { className: "ttl-resultBar", "data-testid": "ttl-resultBar" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-resultLabel" }, labels.result), resultMeta.length > 0 ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-resultMeta" }, resultMeta) : null, markdown ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-seg", role: "group" }, /* @__PURE__ */ React6.createElement(
        "button",
        {
          type: "button",
          className: `ttl-segBtn${view === "rendered" ? " ttl-segSelected" : ""}`,
          "data-testid": "ttl-view-toggle",
          "aria-pressed": view === "rendered",
          onClick: () => {
            onSetView(step.seq, view === "rendered" ? "raw" : "rendered");
          }
        },
        labels.render
      ), /* @__PURE__ */ React6.createElement(
        "button",
        {
          type: "button",
          className: `ttl-segBtn${view === "raw" ? " ttl-segSelected" : ""}`,
          "data-testid": "ttl-view-raw",
          "aria-pressed": view === "raw",
          onClick: () => {
            onSetView(step.seq, "raw");
          }
        },
        labels.source
      )) : null, /* @__PURE__ */ React6.createElement(
        CopyButton,
        {
          text: fullText,
          testid: "ttl-result-copy",
          label: labels.copy,
          className: "ttl-resultCopy"
        }
      )), renderResult()) : null,
      tab === "params" ? renderParams() : null,
      tab === "raw" ? renderRaw() : null
    )),
    /* @__PURE__ */ React6.createElement("div", { className: "ttl-detailFoot", "data-testid": "ttl-detail-foot" }, /* @__PURE__ */ React6.createElement(
      "span",
      {
        className: `ttl-pill${pillTruncated ? " ttl-pillWarn" : " ttl-pillOk"}`,
        "data-testid": "ttl-detail-pill"
      },
      pillText
    ), /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailSeq", "data-testid": "ttl-detail-foot-seq" }, `seq #${step.seq}`), /* @__PURE__ */ React6.createElement(
      "button",
      {
        type: "button",
        className: "ttl-detailViewCenter",
        "data-testid": "ttl-detail-view-center",
        onClick: (event) => {
          openZoomFor(tab, event.currentTarget);
        }
      },
      labels.viewInCenter,
      /* @__PURE__ */ React6.createElement("span", { className: "ttl-detailViewIcon", "aria-hidden": "true" }, "\u2922")
    ))
  );
}

// src/client/ZoomOverlay.tsx
var React9 = __toESM(require("react"), 1);
var import_react_dom2 = require("react-dom");

// src/client/json-pretty.tsx
var React8 = __toESM(require("react"), 1);

// src/client/value-viewer.tsx
var React7 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");
var RENDER_LINE_CAP = 4e3;
function highlight(line, query) {
  if (query.length === 0) return line;
  const lower = line.toLowerCase();
  const needle = query.toLowerCase();
  const parts = [];
  let from = 0;
  let key = 0;
  for (let at = lower.indexOf(needle, from); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push(line.slice(from, at));
    parts.push(React7.createElement("mark", { key: key += 1, className: "ttl-valueHit" }, line.slice(at, at + query.length)));
    from = at + query.length;
  }
  if (from < line.length) parts.push(line.slice(from));
  return parts.length === 0 ? line : parts;
}
function ValueViewer(props) {
  const { label, text, lang, onClose } = props;
  const [query, setQuery] = React7.useState("");
  const [copied, setCopied] = React7.useState(false);
  const panelRef = React7.useRef(null);
  const searchRef = React7.useRef(null);
  const returnFocusRef = React7.useRef(null);
  const allLines = React7.useMemo(() => {
    return text.replace(/\r\n?/g, "\n").split("\n");
  }, [text]);
  const lines = allLines.length > RENDER_LINE_CAP ? allLines.slice(0, RENDER_LINE_CAP) : allLines;
  const clipped = lines.length < allLines.length;
  const hits = React7.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return 0;
    let count = 0;
    for (const line of allLines) {
      const lower = line.toLowerCase();
      for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, at + needle.length)) count += 1;
    }
    return count;
  }, [allLines, query]);
  React7.useEffect(() => {
    returnFocusRef.current = typeof document === "undefined" ? null : document.activeElement;
    const panel = panelRef.current;
    if (panel !== null) panel.focus();
    return () => {
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement && target.isConnected !== false) target.focus();
    };
  }, []);
  const copy = React7.useCallback(() => {
    copyToClipboard(text);
    setCopied(true);
  }, [text]);
  React7.useEffect(() => {
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
        copy();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [copy, onClose]);
  if (typeof document === "undefined") return null;
  const meta = `${allLines.length} \u884C \xB7 ${text.length} \u5B57\u7B26`;
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ React7.createElement("div", { className: "ttl-valueViewer", "data-testid": "ttl-value-viewer" }, /* @__PURE__ */ React7.createElement("div", { className: "ttl-valueBackdrop", onClick: onClose, "aria-hidden": "true" }), /* @__PURE__ */ React7.createElement(
      "div",
      {
        className: "ttl-valuePanel",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": t(lang, "valueViewerTitle")(label),
        tabIndex: -1,
        ref: panelRef,
        "data-testid": "ttl-value-panel"
      },
      /* @__PURE__ */ React7.createElement("div", { className: "ttl-valueHead" }, /* @__PURE__ */ React7.createElement("span", { className: "ttl-valueTitle", "data-testid": "ttl-value-title" }, /* @__PURE__ */ React7.createElement("span", { className: "ttl-valueName" }, label), /* @__PURE__ */ React7.createElement("span", { className: "ttl-valueMeta" }, meta)), /* @__PURE__ */ React7.createElement("span", { className: "ttl-valueTools" }, /* @__PURE__ */ React7.createElement(
        "input",
        {
          ref: searchRef,
          className: "ttl-valueSearch",
          "data-testid": "ttl-value-search",
          type: "search",
          value: query,
          placeholder: t(lang, "valueSearch"),
          "aria-label": t(lang, "valueSearch"),
          onChange: (event) => {
            setQuery(event.target.value);
          }
        }
      ), query.trim().length > 0 ? /* @__PURE__ */ React7.createElement("span", { className: "ttl-valueHits", "data-testid": "ttl-value-hits" }, hits > 0 ? t(lang, "valueHits")(hits) : t(lang, "valueNoHit")) : null, /* @__PURE__ */ React7.createElement("button", { type: "button", className: "ttl-dtab", "data-testid": "ttl-value-copy", onClick: copy }, t(lang, copied ? "copiedDone" : "copyDetail")), /* @__PURE__ */ React7.createElement("button", { type: "button", className: "ttl-dtab", "data-testid": "ttl-value-close", onClick: onClose }, t(lang, "zoomClose")))),
      /* @__PURE__ */ React7.createElement("div", { className: "ttl-valueBody", "data-testid": "ttl-value-body" }, lines.map((line, index) => (
        // eslint-disable-next-line react/no-array-index-key
        /* @__PURE__ */ React7.createElement("div", { className: "ttl-valueLine", key: index }, /* @__PURE__ */ React7.createElement("span", { className: "ttl-valueLn", "aria-hidden": "true" }, index + 1), /* @__PURE__ */ React7.createElement("span", { className: "ttl-valueCode" }, highlight(line, query.trim())))
      )), clipped ? /* @__PURE__ */ React7.createElement("div", { className: "ttl-valueClipped", "data-testid": "ttl-value-clipped" }, t(lang, "valueClipped")(allLines.length - lines.length)) : null)
    )),
    document.body
  );
}

// src/client/json-pretty.tsx
var LONG_VALUE_CHARS2 = 160;
var RENDER_LINE_CAP2 = 2e3;
function formatCount(n) {
  if (n < 1e3) return String(n);
  const thousands = Math.floor(n / 1e3);
  const rest = n % 1e3;
  return rest === 0 ? `${thousands},000` : `${thousands},${String(rest).padStart(3, "0")}`;
}
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function joinLabel(prefix, key) {
  return prefix.length === 0 ? key : `${prefix}.${key}`;
}
function pushRow(ctx, depth, content, testid) {
  if (ctx.budget <= 0) return;
  ctx.budget -= 1;
  ctx.seq += 1;
  ctx.rows.push(
    React8.createElement(
      "div",
      { className: "ttl-jpLine", style: { paddingLeft: `${depth * 14}px` }, "data-testid": testid, key: ctx.seq },
      content
    )
  );
}
function LongValue(props) {
  const { label, text, ctx } = props;
  const [open, setOpen] = React8.useState(false);
  const lineCount3 = text.includes("\n") ? text.split("\n").length : 1;
  const meta = t(ctx.lang, "valueMeta")(formatCount(text.length), lineCount3);
  return /* @__PURE__ */ React8.createElement(
    "span",
    {
      className: "ttl-jpLong",
      "data-testid": "ttl-json-long",
      onClick: (event) => {
        event.stopPropagation();
      }
    },
    /* @__PURE__ */ React8.createElement("span", { className: "ttl-jpLongMeta", "data-testid": "ttl-json-long-meta" }, meta),
    /* @__PURE__ */ React8.createElement(
      "button",
      {
        type: "button",
        className: "ttl-dtab",
        "data-testid": "ttl-json-long-toggle",
        "aria-expanded": open,
        onClick: () => {
          setOpen(!open);
        }
      },
      t(ctx.lang, open ? "collapseLabel" : "expandLabel")
    ),
    /* @__PURE__ */ React8.createElement(
      "button",
      {
        type: "button",
        className: "ttl-dtab",
        "data-testid": "ttl-json-long-copy",
        onClick: () => {
          copyToClipboard(text);
        }
      },
      t(ctx.lang, "copyField")
    ),
    /* @__PURE__ */ React8.createElement(
      "button",
      {
        type: "button",
        className: "ttl-dtab",
        "data-testid": "ttl-json-long-view",
        title: t(ctx.lang, "viewInCenter"),
        "aria-label": t(ctx.lang, "viewInCenter"),
        onClick: () => {
          ctx.onView(label, text);
        }
      },
      "\u2922"
    ),
    open ? /* @__PURE__ */ React8.createElement("pre", { className: "ttl-jpRestored", "data-testid": "ttl-json-long-body" }, text) : null
  );
}
function emitValue(ctx, value, depth, key, path, trailingComma) {
  const comma = trailingComma ? "," : "";
  const prefix = key === null ? null : React8.createElement(
    React8.Fragment,
    null,
    React8.createElement("span", { className: "ttl-jsonKey" }, JSON.stringify(key)),
    ": "
  );
  if (typeof value === "string") {
    if (value.length >= LONG_VALUE_CHARS2) {
      pushRow(ctx, depth, React8.createElement(
        React8.Fragment,
        null,
        prefix,
        React8.createElement(LongValue, { label: path, text: value, ctx }),
        comma
      ));
      return;
    }
    pushRow(ctx, depth, React8.createElement(
      React8.Fragment,
      null,
      prefix,
      React8.createElement("span", { className: "ttl-jsonStr" }, JSON.stringify(value)),
      comma
    ));
    return;
  }
  if (typeof value === "number") {
    pushRow(ctx, depth, React8.createElement(
      React8.Fragment,
      null,
      prefix,
      React8.createElement("span", { className: "ttl-jsonNum" }, String(value)),
      comma
    ));
    return;
  }
  if (typeof value === "boolean") {
    pushRow(ctx, depth, React8.createElement(
      React8.Fragment,
      null,
      prefix,
      React8.createElement("span", { className: "ttl-jsonBool" }, String(value)),
      comma
    ));
    return;
  }
  if (value === null) {
    pushRow(ctx, depth, React8.createElement(
      React8.Fragment,
      null,
      prefix,
      React8.createElement("span", { className: "ttl-jsonNull" }, "null"),
      comma
    ));
    return;
  }
  if (Array.isArray(value)) {
    emitContainer(ctx, value.map((entry, index) => [String(index), entry]), depth, key, path, "[", false, comma);
    return;
  }
  if (isPlainObject2(value)) {
    emitContainer(ctx, Object.entries(value), depth, key, path, "{", true, comma);
    return;
  }
  pushRow(ctx, depth, React8.createElement(
    React8.Fragment,
    null,
    prefix,
    React8.createElement("span", { className: "ttl-jsonNull" }, String(value)),
    comma
  ));
}
function emitContainer(ctx, entries, depth, key, path, brace, showKeys, trailingComma) {
  const close = brace === "{" ? "}" : "]";
  const prefix = key === null ? null : React8.createElement(
    React8.Fragment,
    null,
    React8.createElement("span", { className: "ttl-jsonKey" }, JSON.stringify(key)),
    ": "
  );
  pushRow(ctx, depth, React8.createElement(
    React8.Fragment,
    null,
    prefix,
    React8.createElement("span", { className: "ttl-jsonPunct" }, brace)
  ));
  entries.forEach(([entryKey, entryValue], index) => {
    emitValue(
      ctx,
      entryValue,
      depth + 1,
      showKeys ? entryKey : null,
      showKeys ? joinLabel(path, entryKey) : `${path}[${entryKey}]`,
      index < entries.length - 1
    );
  });
  pushRow(ctx, depth, React8.createElement(
    React8.Fragment,
    null,
    React8.createElement("span", { className: "ttl-jsonPunct" }, close),
    trailingComma
  ));
}
function JsonPretty(props) {
  const { value } = props;
  const lang = props.lang ?? detectLang();
  const [showAll, setShowAll] = React8.useState(false);
  const [viewer, setViewer] = React8.useState(null);
  const onView = React8.useCallback((label, text) => {
    setViewer({ label, text });
  }, []);
  const built = React8.useMemo(() => {
    const ctx = {
      lang,
      rows: [],
      budget: showAll ? Number.MAX_SAFE_INTEGER : RENDER_LINE_CAP2,
      seq: 0,
      onView
    };
    emitValue(ctx, value, 0, null, "", false);
    return { rows: ctx.rows, exhausted: ctx.budget <= 0 };
  }, [lang, onView, showAll, value]);
  return /* @__PURE__ */ React8.createElement("div", { className: "ttl-jsonPrettyWrap" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-jsonPretty", "data-testid": "ttl-json-pretty" }, built.rows), built.exhausted && !showAll ? /* @__PURE__ */ React8.createElement(
    "button",
    {
      type: "button",
      className: "ttl-dtab ttl-jsonMore",
      "data-testid": "ttl-json-pretty-more",
      onClick: () => {
        setShowAll(true);
      }
    },
    t(lang, "jsonShowAll")(RENDER_LINE_CAP2)
  ) : null, viewer !== null ? /* @__PURE__ */ React8.createElement(
    ValueViewer,
    {
      label: viewer.label,
      text: viewer.text,
      lang,
      onClose: () => {
        setViewer(null);
      }
    }
  ) : null);
}

// src/client/ZoomOverlay.tsx
var COPY = {
  zh: {
    brand: "\u8F6E\u6B21\u8F68\u8FF9",
    turn: (n) => `\u8F6E\u6B21 #${n}`,
    step: (n) => `\u6B65\u9AA4 ${n}`,
    stepsShort: (n) => `${n} \u6B65`,
    stepsLabel: "\u6B65\u9AA4",
    success: "\u6210\u529F",
    failed: "\u5931\u8D25",
    summary: "\u6458\u8981",
    command: "\u547D\u4EE4",
    commandHint: "\u6309 && / ; \u5206\u6BB5 \xB7 \u81EA\u52A8\u6362\u884C",
    segments: (n) => `${n} \u6BB5`,
    softWrap: "\u81EA\u52A8\u6362\u884C",
    copyCommand: "\u590D\u5236\u547D\u4EE4",
    params: "\u53C2\u6570",
    argsLabel: "\u53C2\u6570",
    resultLabel: "\u7ED3\u679C",
    allParams: (n) => `\u5168\u90E8 ${n} \u9879`,
    output: "\u8F93\u51FA",
    expandAll: "\u5C55\u5F00\u5168\u6587",
    collapse: "\u6536\u8D77",
    searchPlaceholder: "\u641C\u7D22\u547D\u4EE4\u6216\u8F93\u51FA",
    search: "\u641C\u7D22",
    close: "\u5173\u95ED",
    copy: "\u590D\u5236",
    stepNav: "\u5207\u6362\u6B65\u9AA4",
    copyDone: "\u5DF2\u590D\u5236",
    exportJson: "\u5BFC\u51FA JSON",
    readOnlySynced: "\u53EA\u8BFB \xB7 \u4E8B\u4EF6\u6D41\u5DF2\u540C\u6B65",
    fullContent: "\u5B8C\u6574\u5185\u5BB9",
    truncatedContent: "\u5DF2\u622A\u65AD",
    emptyResult: "\u8BE5\u8C03\u7528\u6CA1\u6709\u8FD4\u56DE\u5185\u5BB9",
    noParams: "\u8BE5\u8C03\u7528\u6CA1\u6709\u53C2\u6570",
    unparsable: "\u53C2\u6570\u65E0\u6CD5\u89E3\u6790\uFF0C\u5DF2\u6309\u539F\u6587\u663E\u793A",
    chars: (n) => `${n} \u5B57\u7B26`,
    lines: (n) => `${n} \u884C`
  },
  en: {
    brand: "Turn Outline",
    turn: (n) => `Turn #${n}`,
    step: (n) => `Step ${n}`,
    stepsShort: (n) => `${n} steps`,
    stepsLabel: "Steps",
    success: "Success",
    failed: "Failed",
    summary: "Summary",
    command: "Command",
    commandHint: "Split on && / ; \xB7 soft wrap",
    segments: (n) => `${n} segments`,
    softWrap: "soft wrap",
    copyCommand: "Copy command",
    params: "Params",
    argsLabel: "Args",
    resultLabel: "Result",
    allParams: (n) => `All ${n}`,
    output: "Output",
    expandAll: "Show all",
    collapse: "Collapse",
    searchPlaceholder: "Search commands or output",
    search: "Search",
    close: "Close",
    copy: "Copy",
    stepNav: "Step",
    copyDone: "Copied",
    exportJson: "Export JSON",
    readOnlySynced: "Read-only \xB7 event stream in sync",
    fullContent: "Full content",
    truncatedContent: "Truncated",
    emptyResult: "This call returned no content",
    noParams: "This call has no arguments",
    unparsable: "Arguments could not be parsed \u2014 showing raw text",
    chars: (n) => `${n} chars`,
    lines: (n) => `${n} lines`
  }
};
var OUT_PREVIEW_LINES2 = 3;
var OUT_LINE_MAX2 = 240;
var TITLE_CAP = 512;
function isFailedStep(step) {
  return step.kind === "error" || step.result?.isError === true || step.result?.kind === "error";
}
function familyOf(step) {
  return toolFamily(step.name, isFailedStep(step));
}
function toneOfFamily(family) {
  switch (family) {
    case "shell":
      return "violet";
    case "read":
      return "blue";
    case "edit":
      return "success";
    case "mcp":
      return "violet";
    case "todo":
      return "warn";
    case "error":
      return "red";
    default:
      return "neutral";
  }
}
function iconKindOf(step, summary) {
  return isFailedStep(step) ? "generic" : summary.icon;
}
function durationOf(step) {
  if (step.startedAt === void 0 || step.endedAt === void 0) return "";
  return formatDuration(step.endedAt - step.startedAt);
}
function errorHeadlineOf(step) {
  const result = step.result;
  const name = result?.errorName ?? step.name;
  const code = result?.errorCode ?? step.errorCode;
  return code !== void 0 ? `${name} \xB7 ${code}` : name;
}
function firstLine2(text) {
  for (const line of text.split("\n")) {
    const value = line.trim();
    if (value.length > 0) return value;
  }
  return "";
}
function clipInline(text, max) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}\u2026` : flat;
}
function titleOf(text) {
  return text.length > TITLE_CAP ? `${text.slice(0, TITLE_CAP)}\u2026` : text;
}
function byteLength(text) {
  if (typeof TextEncoder === "function") {
    try {
      return new TextEncoder().encode(text).length;
    } catch {
    }
  }
  return text.length;
}
function lineCount2(text) {
  if (text.length === 0) return 0;
  return text.replace(/\r\n?/g, "\n").split("\n").length;
}
function parseArgsObject(raw) {
  if (raw === void 0 || raw.trim().length === 0) return null;
  const parsed = parseJsonLoose(raw);
  if (!parsed.ok) return null;
  const value = parsed.value;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value;
}
function commandOf(step) {
  const args = parseArgsObject(step.args);
  if (args !== null) {
    const command = args.command;
    if (typeof command === "string" && command.trim().length > 0) return command;
  }
  return step.argsPreview;
}
function paneTextOf(step, tab) {
  if (tab === "summary") {
    if (step.kind === "error") {
      const text = step.result?.text ?? "";
      return text.length > 0 ? `${step.error}
${text}` : step.error;
    }
    return familyOf(step) === "shell" ? commandOf(step) : step.args ?? "";
  }
  if (tab !== "result") return step.args ?? "";
  const result = step.result;
  if (result === void 0) return "";
  if (isFailedStep(step)) {
    const headline = errorHeadlineOf(step);
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
var KV_TEXT_CAP = 240;
function valueSummary(value) {
  if (value === null) return { text: "null", full: "null", typeLabel: "null" };
  if (typeof value === "string") {
    return { text: clipInline(value, KV_TEXT_CAP), full: value, typeLabel: "string" };
  }
  if (typeof value === "number" || typeof value === "boolean") {
    const text = String(value);
    return { text, full: text, typeLabel: typeof value };
  }
  if (Array.isArray(value)) {
    const primitive = value.every((item) => item === null || ["string", "number", "boolean"].includes(typeof item));
    if (primitive) {
      const items = value.map((item) => String(item));
      const head = items.slice(0, 3).join(" \xB7 ");
      const text = items.length > 3 ? `${head} +${items.length - 3}` : head;
      return { text, full: items.join(", "), typeLabel: `array \xB7 ${items.length}` };
    }
    const json2 = JSON.stringify(value) ?? "";
    return { text: clipInline(json2, KV_TEXT_CAP), full: json2, typeLabel: `array \xB7 ${value.length}` };
  }
  const json = JSON.stringify(value) ?? "";
  return { text: clipInline(json, KV_TEXT_CAP), full: json, typeLabel: "object" };
}
function kvRowsOf(args, omit) {
  const rows = [];
  for (const key of Object.keys(args)) {
    if (omit.has(key)) continue;
    const summary = valueSummary(args[key]);
    rows.push({ key, ...summary });
  }
  return rows;
}
var stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
function routeIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 24 24", width: "15", height: "15", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React9.createElement("circle", { cx: "6", cy: "18", r: "2.2", ...stroke }), /* @__PURE__ */ React9.createElement("circle", { cx: "18", cy: "6", r: "2.2", ...stroke }), /* @__PURE__ */ React9.createElement("path", { d: "M8.2 18H12a4 4 0 0 0 4-4V8.2", ...stroke }));
}
function searchIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 24 24", width: "13", height: "13", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React9.createElement("circle", { cx: "11", cy: "11", r: "7", ...stroke }), /* @__PURE__ */ React9.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65", ...stroke }));
}
function copyIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 24 24", width: "13", height: "13", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React9.createElement("rect", { x: "9", y: "9", width: "11", height: "11", rx: "2", ...stroke }), /* @__PURE__ */ React9.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1", ...stroke }));
}
function downloadIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 24 24", width: "13", height: "13", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React9.createElement("path", { d: "M12 3v10", ...stroke }), /* @__PURE__ */ React9.createElement("path", { d: "M8 9l4 4 4-4", ...stroke }), /* @__PURE__ */ React9.createElement("path", { d: "M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2", ...stroke }));
}
function closeIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 24 24", width: "13", height: "13", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React9.createElement("path", { d: "M6 6l12 12M18 6L6 18", ...stroke }));
}
function ZoomOverlay(props) {
  const { steps, initialSeq, initialTab, sessionId, lang, onClose } = props;
  const copy = COPY[lang];
  const [selectedSeq, setSelectedSeq] = React9.useState(initialSeq);
  const [tab, setTab] = React9.useState(initialTab ?? "summary");
  const [views, setViews] = React9.useState(() => /* @__PURE__ */ new Map());
  const [expandedOutputs, setExpandedOutputs] = React9.useState(() => /* @__PURE__ */ new Set());
  const [query, setQuery] = React9.useState("");
  const [copied, setCopied] = React9.useState(false);
  const panelRef = React9.useRef(null);
  const searchRef = React9.useRef(null);
  const selectedRowRef = React9.useRef(null);
  const filtered = React9.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return steps;
    return steps.filter((step) => {
      const preview = step.kind === "error" ? step.error : step.argsPreview;
      return step.name.toLowerCase().includes(needle) || preview.toLowerCase().includes(needle) || (step.result?.text.toLowerCase().includes(needle) ?? false);
    });
  }, [steps, query]);
  const current = React9.useMemo(() => {
    const inFiltered = filtered.find((step) => step.seq === selectedSeq);
    if (inFiltered !== void 0) return inFiltered;
    if (filtered.length > 0) return filtered[0];
    return steps.find((step) => step.seq === selectedSeq) ?? steps[0] ?? null;
  }, [filtered, steps, selectedSeq]);
  const currentSummary = React9.useMemo(
    () => current === null ? null : summarizeToolCall(current.name, current.args, current.argsPreview, lang),
    [current, lang]
  );
  const onSearchChange = (value) => {
    setQuery(value);
    const needle = value.trim().toLowerCase();
    if (needle.length === 0) return;
    const matches = steps.filter((step) => {
      const preview = step.kind === "error" ? step.error : step.argsPreview;
      return step.name.toLowerCase().includes(needle) || preview.toLowerCase().includes(needle) || (step.result?.text.toLowerCase().includes(needle) ?? false);
    });
    if (matches.length > 0 && !matches.some((step) => step.seq === selectedSeq)) {
      setSelectedSeq(matches[0].seq);
    }
  };
  React9.useEffect(() => {
    const panel = panelRef.current;
    if (panel !== null) panel.focus();
  }, []);
  React9.useEffect(() => {
    const row = selectedRowRef.current;
    if (row !== null && typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ block: "nearest" });
    }
  }, [current?.seq]);
  const move = React9.useCallback((delta) => {
    const list = filtered.length > 0 ? filtered : steps;
    if (list.length === 0) return;
    const at = current === null ? -1 : list.findIndex((step) => step.seq === current.seq);
    const next = at === -1 ? 0 : Math.min(Math.max(at + delta, 0), list.length - 1);
    const target = list[next];
    if (target !== void 0) setSelectedSeq(target.seq);
  }, [current, filtered, steps]);
  const copyPane = React9.useCallback(() => {
    if (current === null) return;
    copyToClipboard(paneTextOf(current, tab));
    setCopied(true);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    }
  }, [current, tab]);
  const copyCommand = React9.useCallback(() => {
    if (current === null) return;
    copyToClipboard(familyOf(current) === "shell" ? commandOf(current) : current.args ?? "");
    setCopied(true);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    }
  }, [current]);
  const exportCurrent = React9.useCallback(() => {
    if (current === null) return;
    downloadJson(`trace-step-${current.seq}.json`, JSON.stringify(exportPayloadOf(current), null, 2));
  }, [current]);
  React9.useEffect(() => {
    const onKeyDown = (event) => {
      if (typeof document !== "undefined" && document.querySelector('[data-testid="ttl-value-viewer"]') !== null) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const mod = event.metaKey || event.ctrlKey;
      const target = event.target;
      const tag = target !== null && typeof target.tagName === "string" ? target.tagName.toUpperCase() : "";
      if (mod && (event.key === "f" || event.key === "F")) {
        event.preventDefault();
        const input = searchRef.current;
        if (input !== null) {
          input.focus();
          if (typeof input.select === "function") input.select();
        }
        return;
      }
      if (mod && (event.key === "e" || event.key === "E")) {
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        event.preventDefault();
        exportCurrent();
        return;
      }
      if (mod && (event.key === "c" || event.key === "C")) {
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
  }, [copyPane, exportCurrent, move, onClose]);
  const family = current === null ? "generic" : familyOf(current);
  const failed = current === null ? false : isFailedStep(current);
  const currentIndex = current === null ? -1 : steps.findIndex((step) => step.seq === current.seq);
  const stepPosition = currentIndex >= 0 ? currentIndex + 1 : 1;
  const turnNo = steps.find((step) => typeof step.turn === "number")?.turn ?? null;
  const turnStartedAt = steps.reduce(
    (min, step) => step.startedAt === void 0 ? min : min === void 0 ? step.startedAt : Math.min(min, step.startedAt),
    void 0
  );
  const turnEndedAt = steps.reduce(
    (max, step) => step.endedAt === void 0 ? max : max === void 0 ? step.endedAt : Math.max(max, step.endedAt),
    void 0
  );
  const turnClock = formatClock(turnStartedAt);
  const turnDuration2 = turnStartedAt !== void 0 && turnEndedAt !== void 0 ? formatDuration(turnEndedAt - turnStartedAt) : "";
  const stepDuration2 = current === null ? "" : durationOf(current);
  const argsText = current?.args ?? "";
  const argsBytes = current?.argsBytes ?? byteLength(argsText);
  const resultText2 = current?.result?.text ?? "";
  const resultBytes = byteLength(resultText2);
  const argsObj = React9.useMemo(() => parseArgsObject(current?.args), [current]);
  const commandText = current !== null && family === "shell" ? commandOf(current) : "";
  const commandSegments = React9.useMemo(
    () => commandText.length > 0 ? splitCommand(commandText) : [],
    [commandText]
  );
  const commandStatsValue = React9.useMemo(
    () => commandText.length > 0 ? commandStats(commandText) : { segments: 0, chars: 0 },
    [commandText]
  );
  const kvRows = React9.useMemo(() => {
    if (argsObj === null) return [];
    return kvRowsOf(argsObj, family === "shell" ? /* @__PURE__ */ new Set(["command"]) : /* @__PURE__ */ new Set());
  }, [argsObj, family]);
  const argKeys = argsObj === null ? 0 : Object.keys(argsObj).length;
  const outputLines = React9.useMemo(() => {
    const normalized = resultText2.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
    return normalized.length === 0 ? [] : normalized.split("\n");
  }, [resultText2]);
  const outputExpanded = current !== null && expandedOutputs.has(current.seq);
  const shownOutputLines = outputExpanded ? outputLines : outputLines.slice(0, OUT_PREVIEW_LINES2);
  const toggleExpandedOutput = React9.useCallback(() => {
    if (current === null) return;
    setExpandedOutputs((set) => {
      const next = new Set(set);
      if (next.has(current.seq)) next.delete(current.seq);
      else next.add(current.seq);
      return next;
    });
  }, [current]);
  const headMeta = current === null ? [] : [`seq #${current.seq}`];
  if (stepDuration2.length > 0) headMeta.push(stepDuration2);
  const argChars = commandText.length > 0 ? commandStatsValue.chars : argsText.length;
  if (argChars > 0) headMeta.push(`${copy.argsLabel} ${copy.chars(argChars)}`);
  else if (argsBytes > 0) headMeta.push(`${copy.argsLabel} ${formatBytes(argsBytes)}`);
  if (current?.result !== void 0) {
    headMeta.push(`${copy.resultLabel} ${formatBytes(resultBytes)}`);
    const truncated2 = current.result.truncated || current.argsTruncated === true;
    headMeta.push(truncated2 ? copy.truncatedContent : copy.fullContent);
  }
  const statusText = failed ? copy.failed : copy.success;
  const statusTop = stepDuration2.length > 0 ? `${statusText} ${stepDuration2}` : statusText;
  const statusWithDuration = stepDuration2.length > 0 ? `${statusText} \xB7 ${stepDuration2}` : statusText;
  const renderCommandBlock = (step) => {
    if (commandSegments.length === 0) return null;
    return /* @__PURE__ */ React9.createElement("section", { className: "ttl-section", "data-testid": "ttl-zoom-command" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-code" }, commandSegments.map((segment, index) => /* @__PURE__ */ React9.createElement("div", { className: "ttl-codeLine", key: index }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-codeGutter", "aria-hidden": "true" }, index + 1), /* @__PURE__ */ React9.createElement("span", { className: "ttl-codeText" }, segment.connector !== null ? /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement("span", { className: "ttl-tok-op" }, segment.connector), " ") : null, segment.tokens.map((token, tokenIndex) => /* @__PURE__ */ React9.createElement(React9.Fragment, { key: tokenIndex }, tokenIndex > 0 ? " " : null, /* @__PURE__ */ React9.createElement("span", { className: `ttl-tok-${token.kind}` }, token.text)))))), /* @__PURE__ */ React9.createElement("div", { className: "ttl-codeFoot", "data-testid": "ttl-zoom-command-foot" }, /* @__PURE__ */ React9.createElement("span", null, `${copy.segments(commandStatsValue.segments)} \xB7 ${copy.chars(commandStatsValue.chars)} \xB7 ${copy.softWrap}`), /* @__PURE__ */ React9.createElement("span", { className: "ttl-codeTool" }, step.name))));
  };
  const renderParamsSection = () => {
    if (argsObj === null) {
      if (argsText.trim().length === 0) return null;
      return /* @__PURE__ */ React9.createElement("section", { className: "ttl-section", "data-testid": "ttl-zoom-params" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-sectionLabel" }, copy.params)), /* @__PURE__ */ React9.createElement(RawText, { text: argsText }), /* @__PURE__ */ React9.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-unparsable" }, copy.unparsable));
    }
    return /* @__PURE__ */ React9.createElement("section", { className: "ttl-section", "data-testid": "ttl-zoom-params" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-sectionLabel" }, copy.params), /* @__PURE__ */ React9.createElement("span", { className: "ttl-sectionMeta" }, copy.allParams(argKeys))), kvRows.length === 0 ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-detailHint" }, copy.noParams) : /* @__PURE__ */ React9.createElement("div", { className: "ttl-kv" }, kvRows.map((row) => /* @__PURE__ */ React9.createElement("div", { className: "ttl-kvRow", key: row.key }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-kvKey", title: row.key }, row.key), /* @__PURE__ */ React9.createElement("span", { className: "ttl-kvVal", title: titleOf(row.full) }, row.text), family === "mcp" ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-kvType" }, row.typeLabel) : null))));
  };
  const renderOutputSection = (step) => {
    const result = step.result;
    const images = result?.images ?? [];
    const hasText = outputLines.length > 0;
    const hasOutput = hasText || images.length > 0;
    const error = isFailedStep(step);
    const expandable = hasText && outputLines.length > OUT_PREVIEW_LINES2;
    const sizeHint = hasText ? [
      formatBytes(byteLength(resultText2)),
      copy.lines(lineCount2(resultText2)),
      result?.truncated === true ? copy.truncatedContent : copy.fullContent
    ].join(" \xB7 ") : "";
    return /* @__PURE__ */ React9.createElement("section", { className: "ttl-section", "data-testid": "ttl-zoom-output" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-sectionLabel" }, copy.output), sizeHint.length > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-sectionMeta" }, sizeHint) : null, expandable ? /* @__PURE__ */ React9.createElement(
      "button",
      {
        type: "button",
        className: "ttl-sectionAction ttl-sectionActionText",
        "data-testid": "ttl-zoom-output-expand",
        "aria-expanded": outputExpanded,
        onClick: toggleExpandedOutput
      },
      outputExpanded ? copy.collapse : copy.expandAll
    ) : null), error ? /* @__PURE__ */ React9.createElement("div", { className: `ttl-outBlock${hasText ? " ttl-outBlockError" : ""}` }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-errorBlock", "data-testid": "ttl-zoom-error" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-errorName", "data-testid": "ttl-zoom-error-name" }, errorHeadlineOf(step)), resultText2.length > 0 ? /* @__PURE__ */ React9.createElement(RawText, { text: resultText2 }) : null)) : hasText ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-outBlock" }, shownOutputLines.map((line, index) => {
      const rendered = !outputExpanded && line.length > OUT_LINE_MAX2 ? `${line.slice(0, OUT_LINE_MAX2)}\u2026` : line;
      return /* @__PURE__ */ React9.createElement("div", { className: "ttl-outLine", key: index }, rendered.length === 0 ? "\xA0" : rendered);
    })) : /* @__PURE__ */ React9.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-empty" }, copy.emptyResult), images.length > 0 ? /* @__PURE__ */ React9.createElement(TrailImages, { images, sessionId, lang }) : null);
  };
  const renderSummary = (step) => /* @__PURE__ */ React9.createElement(React9.Fragment, null, family === "shell" ? renderCommandBlock(step) : null, renderParamsSection(), renderOutputSection(step));
  function setViewsWithCurrent(step, view) {
    setViews((map) => {
      const next = new Map(map);
      next.set(step.seq, view);
      return next;
    });
  }
  const renderResult = (step) => {
    const result = step.result;
    const images = result?.images ?? [];
    const error = isFailedStep(step);
    const markdown = result !== void 0 && looksLikeMarkdown(result.text);
    const view = views.get(step.seq) ?? defaultViewForTool(step.name);
    const resultMeta = result === void 0 ? "" : `${formatBytes(byteLength(result.text))} \xB7 ${copy.lines(lineCount2(result.text))}`;
    return /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement("div", { className: "ttl-resultBar", "data-testid": "ttl-zoom-result-bar" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-resultLabel" }, t(lang, "detailResult")), resultMeta.length > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-resultMeta" }, resultMeta) : null, markdown && !error ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-seg", role: "group" }, /* @__PURE__ */ React9.createElement(
      "button",
      {
        type: "button",
        className: `ttl-segBtn${view === "rendered" ? " ttl-segSelected" : ""}`,
        "data-testid": "ttl-zoom-view-toggle",
        "aria-pressed": view === "rendered",
        onClick: () => {
          setViewsWithCurrent(step, "rendered");
        }
      },
      t(lang, "detailRender")
    ), /* @__PURE__ */ React9.createElement(
      "button",
      {
        type: "button",
        className: `ttl-segBtn${view === "raw" ? " ttl-segSelected" : ""}`,
        "data-testid": "ttl-zoom-view-raw",
        "aria-pressed": view === "raw",
        onClick: () => {
          setViewsWithCurrent(step, "raw");
        }
      },
      t(lang, "detailSource")
    )) : null), error ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-errorBlock", "data-testid": "ttl-zoom-error" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-errorName", "data-testid": "ttl-zoom-error-name" }, errorHeadlineOf(step)), resultText2.length > 0 ? /* @__PURE__ */ React9.createElement(RawText, { text: resultText2 }) : null) : result === void 0 || resultText2.length === 0 && images.length === 0 ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-empty" }, copy.emptyResult) : markdown && view === "rendered" ? /* @__PURE__ */ React9.createElement(MarkdownResult, { text: resultText2, labels: markdownLabels(lang) }) : /* @__PURE__ */ React9.createElement(RawText, { text: resultText2 }), images.length > 0 ? /* @__PURE__ */ React9.createElement(TrailImages, { images, sessionId, lang }) : null);
  };
  const renderParams = (step) => {
    const args = step.args ?? "";
    const parsed = parseJsonLoose(args);
    if (parsed.ok) return /* @__PURE__ */ React9.createElement(JsonPretty, { value: parsed.value, lang });
    return /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement(RawText, { text: args }), /* @__PURE__ */ React9.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-unparsable" }, copy.unparsable));
  };
  const renderPane = () => {
    if (current === null) return null;
    if (tab === "summary") return renderSummary(current);
    if (tab === "raw") return /* @__PURE__ */ React9.createElement(RawText, { text: current.args ?? "" });
    if (tab === "params") return renderParams(current);
    return renderResult(current);
  };
  if (current === null || typeof document === "undefined") return null;
  const title = t(lang, "zoomTitle")(current.name);
  const truncated = current.argsTruncated === true || current.result?.truncated === true;
  const stepLabel = current.kind === "error" ? "error" : currentSummary?.label ?? current.name;
  const stepDesc = current.kind === "error" ? current.error || firstLine2(resultText2) : failed ? errorHeadlineOf(current) : currentSummary?.detail ?? "";
  const headTool = currentSummary?.toolName ?? "";
  const tabButton = (value, label) => /* @__PURE__ */ React9.createElement(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": tab === value,
      className: `ttl-tab${tab === value ? " ttl-tabSelected" : ""}`,
      "data-testid": `ttl-zoom-tab-${value}`,
      onClick: () => {
        setTab(value);
      }
    },
    label
  );
  const shortcut = (key, label) => /* @__PURE__ */ React9.createElement("span", { className: "ttl-zoomShortcut", key }, /* @__PURE__ */ React9.createElement("kbd", { className: "ttl-kbd" }, key), /* @__PURE__ */ React9.createElement("span", null, label));
  const outlineRow = (step) => {
    const selected = step.seq === current.seq;
    const rowFailed = isFailedStep(step);
    const rowFamily = familyOf(step);
    const summary = summarizeToolCall(step.name, step.args, step.argsPreview, lang);
    const rowLabel = step.kind === "error" ? "error" : summary.label;
    const rowDesc = step.kind === "error" ? step.error || firstLine2(step.result?.text ?? "") : rowFailed ? errorHeadlineOf(step) : summary.detail;
    const dur = durationOf(step);
    return /* @__PURE__ */ React9.createElement(
      "button",
      {
        key: step.seq,
        ref: selected ? selectedRowRef : void 0,
        type: "button",
        className: "ttl-step ttl-zoomOutlineRow",
        "data-testid": "ttl-zoom-step",
        "data-step-kind": step.kind,
        "aria-current": selected ? "true" : void 0,
        title: step.kind === "error" ? step.error : titleOf(step.argsPreview.length > 0 ? step.argsPreview : rowDesc),
        onClick: () => {
          setSelectedSeq(step.seq);
        }
      },
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepRail", "aria-hidden": "true" }),
      /* @__PURE__ */ React9.createElement("span", { className: `ttl-stepIcon ttl-tone-${rowFamily}`, "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement(ToolIcon, { kind: iconKindOf(step, summary), tone: toneOfFamily(rowFamily) })),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepName" }, rowLabel),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepDesc" }, rowDesc),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepStatus", "data-failed": rowFailed ? "true" : void 0 }, rowFailed ? "\u2717" : "\u2713"),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepDur" }, dur)
    );
  };
  return (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoom", "data-testid": "ttl-zoom" }, /* @__PURE__ */ React9.createElement(
      "div",
      {
        className: "ttl-zoomBackdrop",
        "data-testid": "ttl-zoom-backdrop",
        onClick: onClose,
        "aria-hidden": "true"
      }
    ), /* @__PURE__ */ React9.createElement(
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
      /* @__PURE__ */ React9.createElement("header", { className: "ttl-zoomTop" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-brandIcon", "aria-hidden": "true" }, routeIcon()), /* @__PURE__ */ React9.createElement("nav", { className: "ttl-zoomCrumb", "data-testid": "ttl-zoom-crumb", "aria-label": copy.brand }, /* @__PURE__ */ React9.createElement("span", null, copy.brand), turnNo !== null ? /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement("span", { className: "ttl-zoomCrumbSep", "aria-hidden": "true" }, "/"), /* @__PURE__ */ React9.createElement("span", null, copy.turn(turnNo))) : null, /* @__PURE__ */ React9.createElement("span", { className: "ttl-zoomCrumbSep", "aria-hidden": "true" }, "/"), /* @__PURE__ */ React9.createElement("span", null, copy.step(stepPosition))), /* @__PURE__ */ React9.createElement(
        "span",
        {
          className: `ttl-pill ${failed ? "ttl-pillErr" : "ttl-pillOk"} ttl-zoomStatus`,
          "data-testid": "ttl-zoom-status"
        },
        /* @__PURE__ */ React9.createElement("span", { className: `ttl-statusDot ${failed ? "ttl-dot-red" : "ttl-dot-green"}`, "aria-hidden": "true" }),
        statusTop
      ), /* @__PURE__ */ React9.createElement("div", { className: "ttl-search", role: "search" }, searchIcon(), /* @__PURE__ */ React9.createElement(
        "input",
        {
          ref: searchRef,
          type: "search",
          className: "ttl-searchInput",
          "data-testid": "ttl-zoom-search",
          placeholder: copy.searchPlaceholder,
          "aria-label": copy.searchPlaceholder,
          value: query,
          onChange: (event) => {
            onSearchChange(event.target.value);
          }
        }
      ), /* @__PURE__ */ React9.createElement("kbd", { className: "ttl-kbd", "aria-hidden": "true" }, "\u2318F")), /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoomTools", "data-testid": "ttl-zoom-tools" }, /* @__PURE__ */ React9.createElement(
        "button",
        {
          type: "button",
          className: "ttl-iconBtn",
          "data-testid": "ttl-zoom-copy",
          "data-copied": copied ? "true" : void 0,
          title: copied ? copy.copyDone : copy.copy,
          "aria-label": copied ? copy.copyDone : copy.copy,
          onClick: copyPane
        },
        copied ? "\u2713" : copyIcon()
      ), /* @__PURE__ */ React9.createElement(
        "button",
        {
          type: "button",
          className: "ttl-iconBtn",
          "data-testid": "ttl-zoom-export",
          title: copy.exportJson,
          "aria-label": copy.exportJson,
          onClick: exportCurrent
        },
        downloadIcon()
      ), /* @__PURE__ */ React9.createElement(
        "button",
        {
          type: "button",
          className: "ttl-iconBtn",
          "data-testid": "ttl-zoom-close",
          title: t(lang, "zoomClose"),
          "aria-label": t(lang, "zoomClose"),
          onClick: onClose
        },
        closeIcon()
      ))),
      /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoomBody" }, /* @__PURE__ */ React9.createElement("aside", { className: "ttl-zoomOutline", "data-testid": "ttl-zoom-outline" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoomOutlineHead" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-zoomOutlineLabel" }, copy.stepsLabel), /* @__PURE__ */ React9.createElement("span", { className: "ttl-zoomOutlineCount" }, /* @__PURE__ */ React9.createElement("em", { className: "ttl-zoomOutlineCur" }, stepPosition), ` / ${steps.length}`)), /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoomOutlineTurn" }, turnNo !== null ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnTag" }, `#${turnNo}`) : null, turnClock.length > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnTime" }, turnClock) : null, /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnMeta" }, [copy.stepsShort(steps.length), turnDuration2].filter((part) => part.length > 0).join(" \xB7 "))), filtered.length === 0 ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-zoom-nomatch" }, t(lang, "zoomNoMatch")) : filtered.map(outlineRow)), /* @__PURE__ */ React9.createElement("main", { className: "ttl-zoomMain", "data-testid": "ttl-zoom-pane", "data-tab": tab }, /* @__PURE__ */ React9.createElement("header", { className: "ttl-zoomHead", "data-testid": "ttl-zoom-head" }, /* @__PURE__ */ React9.createElement("span", { className: `ttl-detailIcon ttl-tone-${family}`, "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement(
        ToolIcon,
        {
          kind: currentSummary === null ? "generic" : iconKindOf(current, currentSummary),
          tone: toneOfFamily(family)
        }
      )), /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoomHeadText" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoomHeadLine" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-detailName", "data-testid": "ttl-zoom-title" }, stepLabel), currentSummary?.server !== void 0 && headTool.length > 0 ? /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement("span", { className: "ttl-detailSep", "aria-hidden": "true" }, "/"), /* @__PURE__ */ React9.createElement("span", { className: "ttl-detailTool" }, headTool)) : null, /* @__PURE__ */ React9.createElement(
        "span",
        {
          className: `ttl-pill ${failed ? "ttl-pillErr" : "ttl-pillOk"} ttl-zoomStatus`,
          "data-testid": "ttl-zoom-head-status"
        },
        /* @__PURE__ */ React9.createElement("span", { className: `ttl-statusDot ${failed ? "ttl-dot-red" : "ttl-dot-green"}`, "aria-hidden": "true" }),
        statusWithDuration
      )), stepDesc.length > 0 ? /* @__PURE__ */ React9.createElement("p", { className: "ttl-detailDesc", title: titleOf(stepDesc) }, stepDesc) : null, /* @__PURE__ */ React9.createElement("div", { className: "ttl-detailMeta", "data-testid": "ttl-zoom-meta" }, headMeta.map((part, index) => /* @__PURE__ */ React9.createElement(React9.Fragment, { key: `${index}:${part}` }, index > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-detailSep", "aria-hidden": "true" }, "\xB7") : null, /* @__PURE__ */ React9.createElement("span", null, part))))), /* @__PURE__ */ React9.createElement(
        "button",
        {
          type: "button",
          className: "ttl-detailAction",
          "data-testid": "ttl-zoom-copy-command",
          title: copy.copyCommand,
          onClick: copyCommand
        },
        copyIcon(),
        /* @__PURE__ */ React9.createElement("span", null, copy.copyCommand)
      )), /* @__PURE__ */ React9.createElement("div", { className: "ttl-tabs", role: "tablist", "data-testid": "ttl-zoom-tabs" }, tabButton("summary", copy.summary), tabButton("result", t(lang, "detailResult")), tabButton("params", t(lang, "detailParams")), tabButton("raw", t(lang, "detailRaw"))), /* @__PURE__ */ React9.createElement("div", { className: "ttl-zoomPane" }, /* @__PURE__ */ React9.createElement("div", { role: "tabpanel", "data-testid": `ttl-zoom-body-${tab}` }, renderPane())))),
      /* @__PURE__ */ React9.createElement("footer", { className: "ttl-zoomFoot", "data-testid": "ttl-zoom-foot" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-zoomShortcuts", "data-testid": "ttl-zoom-hint" }, shortcut("Esc", copy.close), shortcut("\u2191\u2193", copy.stepNav), shortcut("\u2318F", copy.search), shortcut("\u2318C", copy.copy), shortcut("\u2318E", copy.exportJson)), /* @__PURE__ */ React9.createElement("span", { className: "ttl-zoomFootState" }, /* @__PURE__ */ React9.createElement(
        "span",
        {
          className: `ttl-pill ${truncated ? "ttl-pillWarn" : "ttl-pillOk"}`,
          "data-testid": "ttl-zoom-pill"
        },
        t(lang, truncated ? "truncatedPill" : "fullPill")
      ), /* @__PURE__ */ React9.createElement("span", { "data-testid": "ttl-zoom-seq" }, `seq #${current.seq}`), /* @__PURE__ */ React9.createElement("span", { className: "ttl-statusDot ttl-dot-green", "aria-hidden": "true" }), /* @__PURE__ */ React9.createElement("span", null, copy.readOnlySynced)))
    )),
    document.body
  );
}

// src/client/TrailTab.tsx
function messageIcon() {
  return React10.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
    React10.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
  );
}
function inlineMarkdown(text) {
  const nodes = [];
  const pattern = /\*\*([\s\S]+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== void 0) {
      const inner = [];
      const innerPattern = /`([^`]+)`/g;
      let innerLast = 0;
      let innerMatch;
      while ((innerMatch = innerPattern.exec(match[1])) !== null) {
        if (innerMatch.index > innerLast) inner.push(match[1].slice(innerLast, innerMatch.index));
        key += 1;
        inner.push(React10.createElement("code", { key, className: "ttl-msgCode" }, innerMatch[1]));
        innerLast = innerMatch.index + innerMatch[0].length;
      }
      if (innerLast < match[1].length) inner.push(match[1].slice(innerLast));
      key += 1;
      nodes.push(React10.createElement("strong", { key, className: "ttl-msgStrong" }, inner));
    } else {
      key += 1;
      nodes.push(React10.createElement("code", { key, className: "ttl-msgCode" }, match[2]));
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
var STEP_CAP = 250;
var TITLE_CAP2 = 512;
var ZH_UI = {
  searchPlaceholder: "\u641C\u7D22\u6B65\u9AA4\u3001\u6587\u4EF6\u6216\u547D\u4EE4",
  clearSearch: "\u6E05\u9664\u641C\u7D22",
  more: "\u66F4\u591A",
  reading: "\u6B63\u5728\u8BFB\u53D6\u4E8B\u4EF6\u6D41\u2026",
  emptyTitle: "\u8FD8\u6CA1\u6709\u53EF\u6298\u53E0\u7684\u6B65\u9AA4",
  emptyDesc: "\u53D1\u9001\u4E00\u6761\u6D88\u606F\u540E\uFF0C\u8F68\u8FF9\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u8FD9\u91CC",
  refresh: "\u5237\u65B0",
  errorTitle: "\u8F68\u8FF9\u52A0\u8F7D\u5931\u8D25",
  errorNote: "\u91CD\u8BD5\u53EA\u4F1A\u91CD\u65B0\u62C9\u53D6\u4E8B\u4EF6\uFF0C\u4E0D\u4F1A\u6253\u65AD\u5F53\u524D\u4F1A\u8BDD\u3002",
  copyError: "\u590D\u5236\u9519\u8BEF",
  synced: "\u53EA\u8BFB \xB7 \u4E8B\u4EF6\u6D41\u5DF2\u540C\u6B65",
  syncing: "\u53EA\u8BFB \xB7 \u540C\u6B65\u4E2D\u2026",
  syncFailed: "\u53EA\u8BFB \xB7 \u540C\u6B65\u5931\u8D25",
  stepCount: (n) => `${n} \u6B65`,
  parallelGroups: (n) => `${n} \u4E2A\u5E76\u884C\u7EC4`,
  failCount: (n) => `${n} \u5931\u8D25`,
  calls: (n) => `${n} \u4E2A\u8C03\u7528`,
  parallelHint: "\u540C\u4E00\u52A9\u624B\u6B65\u9AA4\u5185\u5E76\u884C\u4E0B\u53D1",
  others: "\u5176\u4ED6",
  totalDuration: "\u603B\u65F6\u957F",
  toolDist: "\u5DE5\u5177\u5206\u5E03",
  shownAll: (turns, steps) => `\u5DF2\u663E\u793A\u5168\u90E8 ${turns} \u8F6E \xB7 ${steps} \u6B65`,
  shownFiltered: (turns, steps) => `\u5DF2\u7B5B\u9009 ${turns} \u8F6E \xB7 ${steps} \u6B65`
};
var EN_UI = {
  searchPlaceholder: "Search steps, files or commands",
  clearSearch: "Clear search",
  more: "More",
  reading: "Reading the event stream\u2026",
  emptyTitle: "No foldable steps yet",
  emptyDesc: "Steps will appear here after you send a message",
  refresh: "Refresh",
  errorTitle: "Failed to load the trail",
  errorNote: "Retrying only re-pulls events; the current conversation is not interrupted.",
  copyError: "Copy error",
  synced: "Read-only \xB7 event stream synced",
  syncing: "Read-only \xB7 syncing\u2026",
  syncFailed: "Read-only \xB7 sync failed",
  stepCount: (n) => `${n} step${n === 1 ? "" : "s"}`,
  parallelGroups: (n) => `${n} parallel group${n === 1 ? "" : "s"}`,
  failCount: (n) => `${n} failed`,
  calls: (n) => `${n} call${n === 1 ? "" : "s"}`,
  parallelHint: "Issued together within one assistant step",
  others: "Others",
  totalDuration: "Total duration",
  toolDist: "Tool distribution",
  shownAll: (turns, steps) => `Showing all ${turns} turns \xB7 ${steps} steps`,
  shownFiltered: (turns, steps) => `Filtered to ${turns} turns \xB7 ${steps} steps`
};
function uiStrings(lang) {
  return lang === "en" ? EN_UI : ZH_UI;
}
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
function clipTitle(value) {
  return value.length > TITLE_CAP2 ? `${value.slice(0, TITLE_CAP2)}\u2026` : value;
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
function stepMatchesFilter(step, filter) {
  if (filter === "all") return true;
  if (filter === "failed") return step.kind === "error";
  return step.kind === "tool" && step.name === filter;
}
function stepMatchesQuery(step, query) {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  if (step.name.toLowerCase().includes(needle)) return true;
  if (step.argsPreview.toLowerCase().includes(needle)) return true;
  if (step.result !== void 0 && step.result.text.toLowerCase().includes(needle)) return true;
  if (step.kind === "error" && step.error.toLowerCase().includes(needle)) return true;
  return false;
}
function stepMatches(step, filter, query) {
  return stepMatchesFilter(step, filter) && stepMatchesQuery(step, query);
}
function familyIconKind(family) {
  switch (family) {
    case "shell":
      return "terminal";
    case "read":
      return "file-read";
    case "edit":
      return "file-edit";
    case "mcp":
      return "mcp";
    default:
      return "generic";
  }
}
function familyLabel(family, ui) {
  switch (family) {
    case "shell":
      return "bash";
    case "read":
      return "read";
    case "edit":
      return "edit";
    case "mcp":
      return "mcp";
    case "todo":
      return "todo";
    case "error":
      return "error";
    default:
      return ui.others;
  }
}
function toolChipLabel(name) {
  return summarizeToolCall(name, void 0, "").label;
}
function stepDuration(step) {
  if (step.startedAt === void 0 || step.endedAt === void 0) return "";
  const span = step.endedAt - step.startedAt;
  return span >= 0 ? formatDuration(span) : "";
}
var StepRow = React10.memo(function StepRow2(props) {
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
  const summary = React10.useMemo(
    () => summarizeToolCall(step.name, step.args, step.argsPreview, lang),
    [step.name, step.args, step.argsPreview, lang]
  );
  const errored = step.kind === "error" || step.result?.isError === true;
  const family = toolFamily(step.name, errored);
  const tone = family === "error" ? "red" : "neutral";
  const iconKind = step.kind === "error" ? "alert" : summary.icon;
  const desc = step.kind === "error" ? step.error : summary.detail;
  const status = errored ? "\u2717" : "\u2713";
  const duration = stepDuration(step);
  const detailId = `ttl-detail-${step.kind}-${step.seq}`;
  const title = step.kind === "error" ? step.error : step.argsPreview.length > 0 ? step.argsPreview : desc;
  const openZoomForStep = React10.useCallback(
    (target, trigger, tab) => {
      onZoom(target, turn, trigger, tab);
    },
    [onZoom, turn]
  );
  const closeDetail = React10.useCallback(() => {
    onStepClose(step);
  }, [onStepClose, step]);
  return /* @__PURE__ */ React10.createElement(
    "div",
    {
      className: "ttl-stepWrap",
      "data-open": open ? "true" : void 0,
      "data-kind": errored ? "error" : step.kind,
      "data-testid": "ttl-step-wrap"
    },
    /* @__PURE__ */ React10.createElement(
      "button",
      {
        type: "button",
        className: "ttl-step",
        "data-testid": "ttl-step",
        "data-step-kind": errored ? "error" : step.kind,
        "aria-expanded": open,
        "aria-controls": detailId,
        title: clipTitle(title),
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
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-stepRail", "aria-hidden": "true" }),
      /* @__PURE__ */ React10.createElement("span", { className: `ttl-stepIcon ttl-tone-${family}`, "aria-hidden": "true" }, /* @__PURE__ */ React10.createElement(ToolIcon, { kind: iconKind, tone })),
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-stepName" }, summary.label),
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-stepDesc" }, desc),
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-stepStatus", "aria-hidden": "true" }, status),
      duration.length > 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-stepDur" }, duration) : null
    ),
    /* @__PURE__ */ React10.createElement(
      "button",
      {
        type: "button",
        className: "ttl-stepJump",
        "data-testid": "ttl-step-jump",
        title: t(lang, "locateInChat"),
        "aria-label": t(lang, "locateInChat"),
        onClick: () => {
          onJump(targetFor({ kind: "tool", step }), turn);
        }
      },
      "\u2197"
    ),
    open ? /* @__PURE__ */ React10.createElement(
      StepDetail,
      {
        id: detailId,
        step,
        sessionId,
        lang,
        view,
        onSetView,
        onLoadDetail,
        onZoom: openZoomForStep,
        onClose: closeDetail
      }
    ) : null
  );
});
var TurnRow = React10.memo(function TurnRow2(props) {
  const {
    turn,
    index,
    expanded,
    active,
    showFull,
    filter,
    query,
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
  const ui = uiStrings(lang);
  const id = turnByIdentity(turn);
  const searchActive = query.trim().length > 0;
  const matches = (step) => stepMatches(step, filter, query);
  const items = turn.items.filter((item) => {
    if (item.kind === "tool") return matches(item.step);
    if (item.kind === "input") return false;
    return !isToolFilter && !searchActive;
  });
  const parallelGroups = React10.useMemo(
    () => turn.stepsCount >= 2 ? parallelGroupsOf(turn.items) : [],
    // Open-turn items are APPENDED in place (same array identity), so length is
    // the structural signal; closed turns keep a frozen items array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turn.stepsCount, turn.items.length]
  );
  const parallelBadgeTitle = parallelGroups.length > 0 ? t(lang, "parallelGroupsTitle")(
    parallelGroups.length,
    parallelGroups.reduce((sum, group) => sum + group.steps.length, 0)
  ) : "";
  const errorCount = React10.useMemo(() => {
    let count = 0;
    for (const item of turn.items) {
      if (item.kind === "tool" && item.step.kind === "error") count += 1;
    }
    return count;
  }, [turn]);
  const mix = React10.useMemo(() => {
    const counts = /* @__PURE__ */ new Map();
    for (const item of turn.items) {
      if (item.kind !== "tool" || item.step.kind !== "tool") continue;
      const family = toolFamily(item.step.name, false);
      counts.set(family, (counts.get(family) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([family, count]) => ({ family, count }));
  }, [turn]);
  const [openOutputs, setOpenOutputs] = React10.useState(() => /* @__PURE__ */ new Set());
  const toggleOutput = React10.useCallback((key) => {
    setOpenOutputs((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const turnNo = turn.turn ?? index + 1;
  const turnTag = `#${turnNo}`;
  const turnTagTitle = t(lang, "turnPrefix")(turnNo);
  const clock = formatClock(turn.startedAt);
  const duration = turnDuration(turn.startedAt, turn.endedAt);
  const preview = turn.inputPreview;
  const hasError = turn.hasError;
  const inputItem = turn.items.find((item) => item.kind === "input");
  const renderInputRow = (item) => /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      className: "ttl-item ttl-itemInput",
      "data-testid": "ttl-item-input",
      title: clipTitle(item.text),
      onClick: () => {
        onJump({ seq: item.seq, kind: "input" }, turn);
      }
    },
    /* @__PURE__ */ React10.createElement("span", { className: "ttl-itemDot ttl-dot-blue", "aria-hidden": "true" }),
    /* @__PURE__ */ React10.createElement("span", { className: "ttl-itemLabel" }, t(lang, "input")),
    /* @__PURE__ */ React10.createElement("span", { className: "ttl-itemText" }, item.text),
    /* @__PURE__ */ React10.createElement("span", { className: "ttl-itemJump", "aria-hidden": "true" }, "\u2197")
  );
  const renderStep = (step, key) => /* @__PURE__ */ React10.createElement(
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
  const renderParallelGroup = (group) => {
    const label = t(lang, "parallelGroup")(group.steps.length);
    const hint = t(lang, "parallelGroupHint")(group.steps.length);
    return /* @__PURE__ */ React10.createElement(
      "div",
      {
        className: "ttl-parallel",
        key: group.key,
        role: "group",
        "aria-label": label,
        title: hint,
        "data-testid": "ttl-parallel-group",
        "data-step": group.step
      },
      /* @__PURE__ */ React10.createElement("div", { className: "ttl-parallelBody" }, group.steps.map((step) => renderStep(step, `seq:${step.seq}`)))
    );
  };
  const renderItem = (item, key) => {
    if (item.kind === "tool") return renderStep(item.step, key);
    if (item.kind === "input") return null;
    if (item.kind === "output") {
      const open = openOutputs.has(key);
      const text = item.text;
      const long = text.length > 90 || text.includes("\n");
      return /* @__PURE__ */ React10.createElement(
        "div",
        {
          className: "ttl-msg",
          key,
          "data-open": open ? "true" : void 0,
          "data-testid": "ttl-output-wrap"
        },
        /* @__PURE__ */ React10.createElement(
          "div",
          {
            className: "ttl-msgMain",
            "data-testid": "ttl-item-output",
            role: "button",
            tabIndex: 0,
            "aria-expanded": open,
            title: clipTitle(text),
            onClick: () => {
              toggleOutput(key);
            },
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleOutput(key);
              }
            }
          },
          /* @__PURE__ */ React10.createElement("div", { className: "ttl-msgHead" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-msgIcon", "aria-hidden": "true" }, messageIcon()), /* @__PURE__ */ React10.createElement("span", { className: "ttl-msgRole" }, t(lang, "output")), /* @__PURE__ */ React10.createElement("span", { className: "ttl-msgRule", "aria-hidden": "true" })),
          open ? /* @__PURE__ */ React10.createElement("div", { className: "ttl-output-body", "data-testid": "ttl-output-body" }, looksLikeMarkdown(text) ? /* @__PURE__ */ React10.createElement(MarkdownResult, { text, labels: markdownLabels(lang) }) : /* @__PURE__ */ React10.createElement("div", { className: "ttl-msgText ttl-msgTextOpen" }, inlineMarkdown(text))) : /* @__PURE__ */ React10.createElement("div", { className: "ttl-msgText" }, inlineMarkdown(text))
        ),
        long ? /* @__PURE__ */ React10.createElement(
          "button",
          {
            type: "button",
            className: "ttl-msgMore",
            "data-testid": "ttl-output-toggle",
            onClick: () => {
              toggleOutput(key);
            }
          },
          open ? t(lang, "collapseLabel") : lang === "zh" ? "\u5C55\u5F00\u5168\u6587" : "Show full"
        ) : null,
        /* @__PURE__ */ React10.createElement(
          "button",
          {
            type: "button",
            className: "ttl-msgJump",
            "data-testid": "ttl-output-jump",
            title: t(lang, "locateInChat"),
            "aria-label": t(lang, "locateInChat"),
            onClick: () => {
              onJump(targetFor(item), turn);
            }
          },
          "\u2197"
        )
      );
    }
    return /* @__PURE__ */ React10.createElement(
      "button",
      {
        type: "button",
        key,
        className: "ttl-item ttl-item-compaction",
        "data-testid": "ttl-item-compaction",
        title: clipTitle(item.preview),
        onClick: () => {
          onJump(targetFor(item), turn);
        }
      },
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-itemDot ttl-dot-neutral", "aria-hidden": "true" }),
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-itemLabel" }, t(lang, "compactionTag")),
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-itemText ttl-itemText2 ttl-itemTextMuted" }, item.preview)
    );
  };
  const footParts = [ui.stepCount(turn.stepsCount)];
  if (parallelGroups.length > 0) footParts.push(ui.parallelGroups(parallelGroups.length));
  if (errorCount > 0) footParts.push(ui.failCount(errorCount));
  if (duration.length > 0) footParts.push(duration);
  return /* @__PURE__ */ React10.createElement(
    "section",
    {
      className: "ttl-turn",
      "data-testid": "ttl-turn",
      "data-collapsed": expanded ? "false" : "true",
      "data-active": active ? "true" : void 0,
      "data-error": hasError ? "true" : void 0
    },
    /* @__PURE__ */ React10.createElement("div", { className: "ttl-turnHead" }, /* @__PURE__ */ React10.createElement(
      "button",
      {
        type: "button",
        className: "ttl-turnToggle",
        "aria-expanded": expanded,
        title: turnTagTitle,
        onClick: () => {
          onToggle(id);
        }
      },
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-turnTag", "data-testid": "ttl-turn-tag" }, turnTag),
      clock.length > 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-turnTime" }, clock) : null,
      duration.length > 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-turnDur" }, duration) : null,
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-turnHeadSpacer" }),
      /* @__PURE__ */ React10.createElement("span", { className: "ttl-turnMeta" }, mix.length > 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-mix", "aria-hidden": "true" }, mix.map((entry) => /* @__PURE__ */ React10.createElement(
        "i",
        {
          key: entry.family,
          className: `ttl-mixItem ttl-tone-${entry.family}`,
          title: familyLabel(entry.family, ui)
        },
        /* @__PURE__ */ React10.createElement(
          ToolIcon,
          {
            kind: familyIconKind(entry.family),
            tone: entry.family === "error" ? "red" : "neutral"
          }
        ),
        /* @__PURE__ */ React10.createElement("span", { className: "ttl-mixCount" }, entry.count)
      ))) : null, hasError ? /* @__PURE__ */ React10.createElement(
        "span",
        {
          className: "ttl-badge ttl-badgeErr",
          "data-testid": "ttl-error-dot",
          title: t(lang, "error")
        },
        `\u2717${errorCount}`
      ) : null, parallelGroups.length > 0 ? /* @__PURE__ */ React10.createElement(
        "span",
        {
          className: "ttl-badge ttl-badgeParallel",
          "data-testid": "ttl-turn-parallel",
          title: parallelBadgeTitle,
          "aria-label": parallelBadgeTitle
        },
        `\u2225${parallelGroups.length}`
      ) : null, /* @__PURE__ */ React10.createElement(
        "span",
        {
          className: "ttl-stepsNum",
          "data-testid": "ttl-steps-count",
          title: t(lang, "stepsLabel")
        },
        ui.stepCount(turn.stepsCount)
      ), /* @__PURE__ */ React10.createElement("span", { className: `ttl-chevron${expanded ? " ttl-chevronOpen" : ""}`, "aria-hidden": "true" }, chevronIcon()))
    ), /* @__PURE__ */ React10.createElement(
      "button",
      {
        type: "button",
        className: "ttl-locateBtn",
        "data-testid": "ttl-locate",
        title: t(lang, "locate"),
        "aria-label": t(lang, "locate"),
        onClick: () => {
          onJump({ seq: turn.anchorSeq, kind: "input" }, turn);
        }
      },
      arrowIcon()
    )),
    preview.length > 0 ? /* @__PURE__ */ React10.createElement(
      "p",
      {
        className: "ttl-turnPreview",
        "data-testid": "ttl-turn-preview",
        title: clipTitle(preview),
        style: expanded ? { WebkitLineClamp: 1 } : void 0
      },
      preview
    ) : null,
    expanded ? (() => {
      const truncated = items.length > STEP_CAP && !showFull;
      const shownItems = truncated ? items.slice(items.length - STEP_CAP) : items;
      const hiddenCount = items.length - shownItems.length;
      const shownEntries = groupParallelItems(shownItems);
      const showInput = filter === "all" && !searchActive && inputItem !== void 0;
      const emptyBody = items.length === 0 && (filter !== "all" || searchActive);
      return /* @__PURE__ */ React10.createElement("div", { className: "ttl-turnBody" }, showInput ? renderInputRow(inputItem) : null, hiddenCount > 0 ? /* @__PURE__ */ React10.createElement(
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
      ) : null, emptyBody ? /* @__PURE__ */ React10.createElement("div", { className: "ttl-emptyInline", "data-testid": "ttl-empty-inline" }, t(lang, "emptyFiltered")) : shownEntries.map((entry) => entry.kind === "group" ? renderParallelGroup(entry.group) : renderItem(entry.item, keyOfItem(entry.item))), /* @__PURE__ */ React10.createElement("div", { className: "ttl-turnFoot", "data-testid": "ttl-turn-foot" }, footParts.join(" \xB7 ")));
    })() : null
  );
});
function TrailTab(props) {
  const lang = detectLang();
  const ui = uiStrings(lang);
  const sessionId = props.scope?.sessionId ?? "";
  const visible = props.visible === true;
  const sessionsService = React10.useMemo(() => sessionsOf(props.ctx), [props.ctx]);
  const fetchEvents = React10.useMemo(
    () => props.fetchEventsOverride !== void 0 ? props.fetchEventsOverride : (sid, afterSeq) => fetchTrailEvents(sid, afterSeq),
    [props.fetchEventsOverride]
  );
  const { turns, stats, status, error, refresh } = useTrail(sessionId, visible, fetchEvents, sessionsService);
  const [filter, setFilter] = React10.useState("all");
  const [query, setQuery] = React10.useState("");
  const [expandedTurns, setExpandedTurns] = React10.useState(null);
  const [jumping, setJumping] = React10.useState(null);
  const [jumpPages, setJumpPages] = React10.useState(0);
  const [jumpMessage, setJumpMessage] = React10.useState(null);
  const [activeTurnId, setActiveTurnId] = React10.useState(null);
  const [followLatest, setFollowLatest] = React10.useState(true);
  const [followPaused, setFollowPaused] = React10.useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = React10.useState(false);
  const [showFullTurn, setShowFullTurn] = React10.useState(/* @__PURE__ */ new Set());
  const [openSeqs, setOpenSeqs] = React10.useState(() => /* @__PURE__ */ new Set());
  const [resultView, setResultView] = React10.useState(() => /* @__PURE__ */ new Map());
  const [zoom, setZoom] = React10.useState(null);
  const listRef = React10.useRef(null);
  const searchRef = React10.useRef(null);
  const jumpingRef = React10.useRef(false);
  const zoomReturnRef = React10.useRef(null);
  const isToolFilter = filter !== "all" && filter !== "failed";
  const searchActive = query.trim().length > 0;
  const visibleTurns = React10.useMemo(() => {
    if (filter === "all" && !searchActive) return turns;
    if (filter === "failed" && !searchActive) return turns;
    return turns.filter((turn) => stepsOf(turn).some((step) => stepMatches(step, filter, query)));
  }, [turns, filter, query, searchActive]);
  const shownStepCount = React10.useMemo(() => {
    if (filter === "all" && !searchActive) return stats.total;
    let count = 0;
    for (const turn of visibleTurns) {
      for (const step of stepsOf(turn)) if (stepMatches(step, filter, query)) count += 1;
    }
    return count;
  }, [visibleTurns, filter, query, searchActive, stats.total]);
  const latestSeq = React10.useMemo(() => {
    let max = 0;
    for (const turn of turns) {
      for (const item of turn.items) {
        const seq = item.kind === "tool" ? item.step.seq : item.seq;
        if (seq > max) max = seq;
      }
    }
    return max;
  }, [turns]);
  const overview = React10.useMemo(() => {
    const counts = /* @__PURE__ */ new Map();
    for (const tool of stats.tools) {
      const family = toolFamily(tool.name, false);
      counts.set(family, (counts.get(family) ?? 0) + tool.count);
    }
    const order = ["shell", "read", "edit", "mcp", "todo", "generic"];
    const families = order.filter((family) => (counts.get(family) ?? 0) > 0).map((family) => ({ family, count: counts.get(family) ?? 0 }));
    const total = families.reduce((sum, entry) => sum + entry.count, 0);
    let durationMs;
    for (const turn of turns) {
      if (turn.startedAt === void 0 || turn.endedAt === void 0) continue;
      const span = turn.endedAt - turn.startedAt;
      if (span < 0) continue;
      durationMs = (durationMs ?? 0) + span;
    }
    return { families, total, durationMs };
  }, [stats, turns]);
  const toolChips = stats.tools.slice(0, 3);
  const hiddenTools = stats.tools.slice(4);
  const hasMoreTools = hiddenTools.length > 0;
  const hiddenToolSelected = isToolFilter && hiddenTools.some((tool) => tool.name === filter);
  const onScroll = React10.useCallback(() => {
    const el = listRef.current;
    if (el === null) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    setFollowPaused(!nearBottom);
  }, []);
  React10.useEffect(() => {
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
  const scrollToBottom = React10.useCallback(() => {
    const el = listRef.current;
    if (el === null) return;
    el.scrollTop = el.scrollHeight;
    setFollowPaused(false);
  }, []);
  React10.useEffect(() => {
    if (!visible) return void 0;
    const onKeyDown = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "f") return;
      if (typeof document !== "undefined" && document.querySelector('[data-testid="ttl-zoom"]') !== null) return;
      const input = searchRef.current;
      if (input === null) return;
      event.preventDefault();
      input.focus();
      if (typeof input.select === "function") input.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);
  const latestIdRef = React10.useRef("");
  React10.useEffect(() => {
    latestIdRef.current = turns.length > 0 ? turnByIdentity(turns[turns.length - 1]) : "";
  }, [turns]);
  React10.useEffect(() => {
    if (!searchActive) return;
    setExpandedTurns((current) => {
      const next = current === null ? new Set(latestIdRef.current.length > 0 ? [latestIdRef.current] : []) : new Set(current);
      let changed = current === null;
      for (const turn of visibleTurns) {
        const id = turnByIdentity(turn);
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [searchActive, visibleTurns]);
  const prevSearchRef = React10.useRef(false);
  React10.useEffect(() => {
    if (prevSearchRef.current && !searchActive) setExpandedTurns(null);
    prevSearchRef.current = searchActive;
  }, [searchActive]);
  const isTurnExpanded = React10.useCallback((id, index) => {
    if (expandedTurns === null) return index === turns.length - 1;
    return expandedTurns.has(id);
  }, [expandedTurns, turns.length]);
  const toggleTurn = React10.useCallback((id) => {
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
  const allVisibleExpanded = expandedTurns !== null && visibleTurns.length > 0 && visibleTurns.every((turn) => expandedTurns.has(turnByIdentity(turn)));
  const toggleAllTurns = () => {
    setExpandedTurns(allVisibleExpanded ? /* @__PURE__ */ new Set() : new Set(visibleTurns.map(turnByIdentity)));
  };
  const toggleShowFull = React10.useCallback((id) => {
    setShowFullTurn((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const seedView = React10.useCallback((step) => {
    setResultView((current) => {
      if (current.has(step.seq)) return current;
      const next = new Map(current);
      next.set(step.seq, defaultViewForTool(step.name));
      return next;
    });
  }, []);
  const toggleStep = React10.useCallback((step, multi) => {
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
  const openStep = React10.useCallback((step, multi = false) => {
    setOpenSeqs((current) => {
      if (current.has(step.seq) && (multi || current.size === 1)) return current;
      const next = new Set(current);
      if (!multi) next.clear();
      next.add(step.seq);
      return next;
    });
    seedView(step);
  }, [seedView]);
  const closeStep = React10.useCallback((step) => {
    setOpenSeqs((current) => {
      if (!current.has(step.seq)) return current;
      const next = new Set(current);
      next.delete(step.seq);
      return next;
    });
  }, []);
  const setView = React10.useCallback((seq, view) => {
    setResultView((current) => {
      if (current.get(seq) === view) return current;
      const next = new Map(current);
      next.set(seq, view);
      return next;
    });
  }, []);
  const fetcherRef = React10.useRef(props.fetchToolDetailOverride ?? fetchToolDetail);
  fetcherRef.current = props.fetchToolDetailOverride ?? fetchToolDetail;
  const detailInflight = React10.useRef(/* @__PURE__ */ new Map());
  const loadDetail = React10.useCallback((seq) => {
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
  const openZoom = React10.useCallback((step, turn, trigger, tab) => {
    zoomReturnRef.current = trigger ?? (typeof document === "undefined" ? null : document.activeElement);
    setZoom({ turnId: turnByIdentity(turn), seq: step.seq, tab });
  }, []);
  const closeZoom = React10.useCallback(() => {
    setZoom(null);
  }, []);
  const zoomSteps = React10.useMemo(() => {
    if (zoom === null) return [];
    const turn = turns.find((entry) => turnByIdentity(entry) === zoom.turnId);
    return turn === void 0 ? [] : stepsOf(turn);
  }, [zoom, turns]);
  React10.useEffect(() => {
    if (zoom !== null) return;
    const target = zoomReturnRef.current;
    if (target === null) return;
    zoomReturnRef.current = null;
    if (target.isConnected !== false && typeof target.focus === "function") target.focus();
  }, [zoom]);
  React10.useEffect(() => {
    if (zoom !== null && zoomSteps.length === 0) setZoom(null);
  }, [zoom, zoomSteps]);
  React10.useEffect(() => {
    setOpenSeqs(/* @__PURE__ */ new Set());
    setResultView(/* @__PURE__ */ new Map());
    setZoom(null);
    setQuery("");
    setExpandedTurns(null);
  }, [sessionId]);
  React10.useEffect(() => {
    if (visible) return;
    setOpenSeqs(/* @__PURE__ */ new Set());
    setResultView(/* @__PURE__ */ new Map());
    setZoom(null);
  }, [visible]);
  const sessionForJump = React10.useMemo(() => {
    if (sessionsService === void 0) return null;
    const binding = sessionsService.binding(sessionId);
    const session = binding !== void 0 && binding.session !== void 0 ? binding.session : void 0;
    if (session === void 0) return null;
    const face = session;
    if (typeof face.loadOlder !== "function" || typeof face.getSnapshot !== "function") return null;
    return session;
  }, [sessionsService, sessionId]);
  const conversationForJump = React10.useMemo(
    () => conversationOf(props.ctx, sessionId),
    [props.ctx, sessionId]
  );
  const doJump = React10.useCallback(async (target, turn) => {
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
  React10.useEffect(() => {
    if (jumpMessage === null) return void 0;
    const timer = window.setTimeout(() => {
      setJumpMessage(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [jumpMessage]);
  React10.useEffect(() => {
    if (filter === "all" && !searchActive) return;
    setOpenSeqs((current) => {
      if (current.size === 0) return current;
      const allowed = /* @__PURE__ */ new Set();
      for (const turn of turns) {
        for (const step of stepsOf(turn)) {
          if (stepMatches(step, filter, query)) allowed.add(step.seq);
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
  }, [filter, searchActive, query, turns]);
  const clearFilters = React10.useCallback(() => {
    setFilter("all");
    setQuery("");
  }, []);
  if (!visible) return null;
  const chipButton = (value, label, count, dot) => /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      key: value,
      className: `ttl-chip${filter === value ? " ttl-chipSelected" : ""}`,
      "aria-pressed": filter === value,
      "data-testid": `ttl-chip-${value}`,
      onClick: () => {
        setFilter((current) => current === value ? "all" : value);
      }
    },
    dot !== void 0 ? /* @__PURE__ */ React10.createElement("span", { className: `ttl-chipDot ttl-dot-${dot}`, "aria-hidden": "true" }) : null,
    /* @__PURE__ */ React10.createElement("span", { className: "ttl-chipLabel" }, label),
    count > 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-chipCount" }, String(count)) : null
  );
  const header = /* @__PURE__ */ React10.createElement("header", { className: "ttl-header" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-brandIcon", "aria-hidden": "true" }, brandIcon()), /* @__PURE__ */ React10.createElement("h2", { className: "ttl-title" }, t(lang, "tabTitle")), /* @__PURE__ */ React10.createElement("span", { className: "ttl-count", "data-testid": "ttl-count" }, `${t(lang, "turnsCount")(turns.length)} \xB7 ${ui.stepCount(stats.total)}`), /* @__PURE__ */ React10.createElement("span", { className: "ttl-headerSpacer" }), /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      className: "ttl-follow",
      "aria-pressed": followLatest,
      "data-testid": "ttl-follow-toggle",
      "data-paused": followPaused ? "true" : void 0,
      title: t(lang, followLatest ? "followLatest" : "followPaused"),
      onClick: () => {
        setFollowLatest((current) => !current);
      }
    },
    /* @__PURE__ */ React10.createElement("span", { className: "ttl-followDot", "aria-hidden": "true" }),
    t(lang, followLatest ? "followLatest" : "followPaused")
  ), /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      className: "ttl-iconBtn",
      "data-testid": "ttl-more",
      "aria-label": t(lang, allVisibleExpanded ? "collapseAll" : "expandAll"),
      title: t(lang, allVisibleExpanded ? "collapseAll" : "expandAll"),
      onClick: toggleAllTurns
    },
    "\u22EF"
  ));
  const searchRow = /* @__PURE__ */ React10.createElement("div", { className: "ttl-searchRow" }, /* @__PURE__ */ React10.createElement("div", { className: "ttl-search" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-searchIcon", "aria-hidden": "true" }, searchIcon2()), /* @__PURE__ */ React10.createElement(
    "input",
    {
      ref: searchRef,
      type: "search",
      className: "ttl-searchInput",
      "data-testid": "ttl-search",
      value: query,
      placeholder: ui.searchPlaceholder,
      "aria-label": ui.searchPlaceholder,
      onChange: (event) => {
        setQuery(event.target.value);
      },
      onKeyDown: (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setQuery("");
        }
      }
    }
  ), query.length > 0 ? /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      className: "ttl-searchClear",
      "data-testid": "ttl-search-clear",
      "aria-label": ui.clearSearch,
      title: ui.clearSearch,
      onClick: () => {
        setQuery("");
      }
    },
    "\xD7"
  ) : null, /* @__PURE__ */ React10.createElement("kbd", { className: "ttl-kbd" }, "\u2318F")));
  const chips = /* @__PURE__ */ React10.createElement(React10.Fragment, null, /* @__PURE__ */ React10.createElement("div", { className: "ttl-filters", role: "group", "data-testid": "ttl-chips" }, chipButton("all", t(lang, "filterAll"), stats.total), stats.failed > 0 ? chipButton("failed", t(lang, "filterFailed"), stats.failed, "red") : null, toolChips.map((tool) => chipButton(tool.name, toolChipLabel(tool.name), tool.count)), hasMoreTools ? /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      className: `ttl-chip ttl-moreChip${moreToolsOpen || hiddenToolSelected ? " ttl-chipSelected" : ""}`,
      "aria-expanded": moreToolsOpen,
      "aria-label": t(lang, moreToolsOpen ? "filterCollapse" : "filterMore"),
      title: hiddenToolSelected ? toolChipLabel(filter) : t(lang, moreToolsOpen ? "filterCollapse" : "filterMore"),
      "data-testid": "ttl-chip-more",
      onClick: () => {
        setMoreToolsOpen((current) => !current);
      }
    },
    "\u22EF"
  ) : null), moreToolsOpen && hasMoreTools ? /* @__PURE__ */ React10.createElement("div", { className: "ttl-toolDropdown", "data-testid": "ttl-tool-dropdown" }, hiddenTools.map((tool) => chipButton(tool.name, toolChipLabel(tool.name), tool.count))) : null);
  const summaryBar = turns.length > 0 ? /* @__PURE__ */ React10.createElement("div", { className: "ttl-summary" }, /* @__PURE__ */ React10.createElement("div", { className: "ttl-summaryTop" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-summaryStat" }, `${ui.stepCount(stats.total)} \xB7 ${t(lang, "turnsCount")(turns.length)}`), /* @__PURE__ */ React10.createElement("span", { className: "ttl-summarySpacer" }), stats.failed > 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-summaryFail" }, ui.failCount(stats.failed)) : null, overview.durationMs !== void 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-summaryDur", title: ui.totalDuration }, formatDuration(overview.durationMs)) : null), overview.families.length > 0 ? /* @__PURE__ */ React10.createElement(React10.Fragment, null, /* @__PURE__ */ React10.createElement("div", { className: "ttl-dist", role: "img", "aria-label": ui.toolDist }, overview.families.map((entry) => /* @__PURE__ */ React10.createElement(
    "i",
    {
      key: entry.family,
      className: `ttl-distSeg ttl-dist-${entry.family} ttl-tone-${entry.family}`,
      style: { width: `${entry.count / overview.total * 100}%` }
    }
  ))), /* @__PURE__ */ React10.createElement("div", { className: "ttl-legend" }, overview.families.map((entry) => /* @__PURE__ */ React10.createElement("span", { className: "ttl-legendItem", key: entry.family }, /* @__PURE__ */ React10.createElement("i", { className: `ttl-legendDot ttl-dist-${entry.family} ttl-tone-${entry.family}`, "aria-hidden": "true" }), `${familyLabel(entry.family, ui)} ${entry.count}`)))) : null) : null;
  let body;
  if (turns.length === 0 && status === "loading") {
    body = /* @__PURE__ */ React10.createElement("div", { className: "ttl-skeleton", "data-testid": "ttl-status", role: "status", "aria-live": "polite" }, [0, 1, 2].map((index) => /* @__PURE__ */ React10.createElement("div", { className: "ttl-skeletonRow", key: index }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-skeletonDot", "aria-hidden": "true" }), /* @__PURE__ */ React10.createElement(
      "span",
      {
        className: "ttl-skeletonBar",
        style: { width: index === 0 ? "56%" : index === 1 ? "72%" : "63%" },
        "aria-hidden": "true"
      }
    ), /* @__PURE__ */ React10.createElement("span", { className: "ttl-skeletonBud", "aria-hidden": "true" }))), /* @__PURE__ */ React10.createElement("div", { className: "ttl-skeletonFoot" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-spin" }, spinnerIcon()), ui.reading));
  } else if (turns.length === 0 && status === "error") {
    const message = error ?? t(lang, "loadFailed");
    body = /* @__PURE__ */ React10.createElement("div", { className: "ttl-errorCard", "data-testid": "ttl-error", role: "alert" }, /* @__PURE__ */ React10.createElement("div", { className: "ttl-errorHead" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-errorIcon", "aria-hidden": "true" }, warningIcon()), /* @__PURE__ */ React10.createElement("span", { className: "ttl-errorTitle" }, ui.errorTitle)), /* @__PURE__ */ React10.createElement("p", { className: "ttl-errorCode" }, message), /* @__PURE__ */ React10.createElement("div", { className: "ttl-errorActions" }, /* @__PURE__ */ React10.createElement("button", { type: "button", className: "ttl-chip ttl-errorRetry", "data-testid": "ttl-retry", onClick: refresh }, t(lang, "retry")), /* @__PURE__ */ React10.createElement(
      "button",
      {
        type: "button",
        className: "ttl-chip",
        "data-testid": "ttl-error-copy",
        onClick: () => {
          copyToClipboard(message);
        }
      },
      ui.copyError
    )), /* @__PURE__ */ React10.createElement("p", { className: "ttl-errorNote" }, ui.errorNote));
  } else if (turns.length === 0) {
    body = /* @__PURE__ */ React10.createElement("div", { className: "ttl-empty", "data-testid": "ttl-empty", role: "status" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-emptyIcon", "aria-hidden": "true" }, brandIcon(26)), /* @__PURE__ */ React10.createElement("p", { className: "ttl-emptyTitle" }, ui.emptyTitle), /* @__PURE__ */ React10.createElement("p", { className: "ttl-emptyDesc" }, ui.emptyDesc), /* @__PURE__ */ React10.createElement("button", { type: "button", className: "ttl-chip ttl-emptyAction", "data-testid": "ttl-refresh", onClick: refresh }, ui.refresh));
  } else if (visibleTurns.length === 0) {
    body = /* @__PURE__ */ React10.createElement("div", { className: "ttl-emptyFiltered ttl-empty-filtered", "data-testid": "ttl-empty-filtered", role: "status" }, /* @__PURE__ */ React10.createElement("p", { className: "ttl-emptyFilteredText" }, t(lang, "emptyFiltered")), /* @__PURE__ */ React10.createElement("button", { type: "button", className: "ttl-chip", "data-testid": "ttl-clear-filter", onClick: clearFilters }, t(lang, "clearFilter")));
  } else {
    body = /* @__PURE__ */ React10.createElement("div", { className: "ttl-list", ref: listRef, onScroll, "data-testid": "ttl-list" }, visibleTurns.map((turn, index) => /* @__PURE__ */ React10.createElement(
      TurnRow,
      {
        key: turnByIdentity(turn),
        turn,
        index,
        expanded: isTurnExpanded(turnByIdentity(turn), index),
        active: activeTurnId === turnByIdentity(turn) || activeTurnId === null && index === visibleTurns.length - 1,
        showFull: showFullTurn.has(turnByIdentity(turn)),
        filter,
        query,
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
    )), /* @__PURE__ */ React10.createElement("div", { className: "ttl-listFoot", "data-testid": "ttl-list-foot" }, filter === "all" && !searchActive ? ui.shownAll(turns.length, stats.total) : ui.shownFiltered(visibleTurns.length, shownStepCount)));
  }
  const showStatusBar = turns.length > 0 || jumping !== null;
  const syncText = status === "loading" ? ui.syncing : error !== null ? ui.syncFailed : ui.synced;
  const stepNameWidth = React10.useMemo(() => {
    let max = 0;
    for (const turn of turns) {
      for (const item of turn.items) {
        if (item.kind !== "tool") continue;
        const mcp = splitMcpName(item.step.name);
        const label = mcp !== null ? mcp.server : item.step.name;
        if (label.length > max) max = label.length;
      }
    }
    return Math.min(132, Math.max(52, Math.round(max * 6.5) + 8));
  }, [turns]);
  const statusBar = showStatusBar ? /* @__PURE__ */ React10.createElement("div", { className: "ttl-statusbar", "data-testid": "ttl-statusbar" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-statusDot", "aria-hidden": "true" }), /* @__PURE__ */ React10.createElement("span", { className: "ttl-statusText" }, syncText), jumping !== null ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-statusMsg" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-spin" }, spinnerIcon()), t(lang, "jumpProgress")(jumpPages)) : jumpMessage !== null ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-statusMsg" }, jumpMessage) : null, /* @__PURE__ */ React10.createElement("span", { className: "ttl-statusSpacer" }), followPaused && turns.length > 0 ? /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      className: "ttl-toBottom ttl-toBottomInline",
      "data-testid": "ttl-to-bottom",
      onClick: scrollToBottom
    },
    t(lang, "newUpdates")
  ) : null, latestSeq > 0 ? /* @__PURE__ */ React10.createElement("span", { className: "ttl-statusSeq", "data-testid": "ttl-status-seq" }, `seq #${latestSeq}`) : null) : null;
  return /* @__PURE__ */ React10.createElement(
    "div",
    {
      className: "ttl-root",
      role: "complementary",
      "aria-label": t(lang, "tabTitle"),
      "data-testid": "ttl-root",
      style: { ["--ttl-step-name-w"]: `${stepNameWidth}px` }
    },
    header,
    turns.length > 0 ? searchRow : null,
    turns.length > 0 ? chips : null,
    summaryBar,
    body,
    statusBar,
    jumping !== null ? /* @__PURE__ */ React10.createElement("div", { className: "ttl-jumpBanner", "data-testid": "ttl-jump-banner", role: "status" }, /* @__PURE__ */ React10.createElement("span", { className: "ttl-spin" }, spinnerIcon()), t(lang, "jumpProgress")(jumpPages)) : null,
    zoom !== null && zoomSteps.length > 0 ? /* @__PURE__ */ React10.createElement(
      ZoomOverlay,
      {
        steps: zoomSteps,
        initialSeq: zoom.seq,
        initialTab: zoom.tab,
        sessionId,
        lang,
        onClose: closeZoom
      }
    ) : null
  );
}
function chevronIcon() {
  return /* @__PURE__ */ React10.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React10.createElement("path", { d: "M6 4l4 4-4 4", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function spinnerIcon() {
  return /* @__PURE__ */ React10.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React10.createElement("path", { d: "M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }));
}
function arrowIcon() {
  return /* @__PURE__ */ React10.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React10.createElement("path", { d: "M5 11l6-6M6 5h5v5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function brandIcon(size = 15) {
  return /* @__PURE__ */ React10.createElement("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React10.createElement("circle", { cx: "6", cy: "19", r: "3" }), /* @__PURE__ */ React10.createElement("path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }), /* @__PURE__ */ React10.createElement("circle", { cx: "18", cy: "5", r: "3" }));
}
function searchIcon2() {
  return /* @__PURE__ */ React10.createElement("svg", { viewBox: "0 0 16 16", width: "13", height: "13", "aria-hidden": "true" }, /* @__PURE__ */ React10.createElement("circle", { cx: "7", cy: "7", r: "4.5", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), /* @__PURE__ */ React10.createElement("path", { d: "M10.5 10.5L14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }));
}
function warningIcon() {
  return /* @__PURE__ */ React10.createElement("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": "true" }, /* @__PURE__ */ React10.createElement(
    "path",
    {
      d: "M8 2.5l6 10.5H2z",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.4",
      strokeLinejoin: "round"
    }
  ), /* @__PURE__ */ React10.createElement("path", { d: "M8 6v4M8 11.6v.1", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }));
}

// src/client/index.tsx
function routeIcon2(size) {
  const children = [
    React11.createElement("circle", { key: "a", cx: 6, cy: 19, r: 3 }),
    React11.createElement("path", { key: "p", d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }),
    React11.createElement("circle", { key: "b", cx: 18, cy: 5, r: 3 })
  ];
  return React11.createElement(
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
var TAB_TITLE = "\u8F6E\u6B21\u8F68\u8FF9";
function followHostLocale(ctx) {
  const locale = ctx.get("locale");
  const readLocaleId = () => {
    try {
      return locale?.getLocale?.().active;
    } catch {
      return void 0;
    }
  };
  setHostLocale(readLocaleId());
  if (typeof locale?.subscribe === "function") {
    ctx.effect(() => locale.subscribe(() => {
      setHostLocale(readLocaleId());
    }));
  }
}
function apply(ctx) {
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-trace-inspect";
  style.textContent = trailCss;
  document.head.appendChild(style);
  ctx.effect(() => () => style.remove());
  followHostLocale(ctx);
  const betterSidebar = ctx.get("betterSidebar");
  if (betterSidebar === void 0 || betterSidebar === null || typeof betterSidebar.registerTab !== "function") {
    return;
  }
  ctx.effect(() => betterSidebar.registerTab({
    id: "trace-inspect",
    // The tab's visible name is FIXED to the Chinese product name at the
    // owner's explicit request (2026-10-17). DSH's own UI language follows the
    // OS/browser locale and Electron reports `en-US`, so a locale-driven name
    // kept showing "Turn Outline" for this Chinese-first plugin. Everything
    // else in the panel (description, labels) still follows the host locale.
    title: () => TAB_TITLE,
    description: () => t(detectLang(), "tabDescription"),
    icon: (size) => routeIcon2(size),
    order: 46,
    single: true,
    component: (props) => React11.createElement(TrailTab, {
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
