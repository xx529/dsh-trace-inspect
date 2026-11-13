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
var React10 = __toESM(require("react"), 1);

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

.ttl-jsonRow .ttl-jsonKey::after {
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

/* Tables scroll horizontally. No edge-fade overlay: it used to span the
 * WHOLE message body (any table turned it on) and dimmed the right edge of every
 * line, making long replies look cut. */
.ttl-mdTableWrap {
  position: relative;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, #545557) transparent;
}

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
 * on-demand full-detail states and the merged-from note. Same rules as
 * above: colors only as var(--dsw-*) (the hex after the comma is the native
 * dark fallback, never a literal choice), radii from the native
 * --dsw-radius-* scale, code from var(--ds-font-family-code). */

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

.ttl-imgThumbBtn {
  border: none;
  border-radius: var(--dsw-radius-sm, 8px);
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: zoom-in;
  transition: filter 160ms ease;
}
.ttl-imgThumbBtn:hover .ttl-imgThumb { filter: brightness(1.07); }
.ttl-imgThumbBtn:focus-visible {
  outline: 2px solid var(--dsw-static-blue-300, #7cb2ff);
  outline-offset: 2px;
}

/* v0.10.35: full-size image lightbox \u2014 same stage language as the value
   reader (fixed layer, blurred mask, one panel, Esc / backdrop closes). */
.ttl-imgLightbox {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.ttl-imgLightboxBackdrop {
  position: absolute;
  inset: 0;
  background: var(--dsw-alias-bg-mask, rgba(0, 0, 0, 0.45));
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.ttl-imgLightboxPanel {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: min(1200px, 92vw);
  max-height: 90vh;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  border-radius: var(--dsw-radius-md, 10px);
  background: var(--dsw-alias-bg-layer-1, #232324);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.ttl-imgLightboxHead {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 10px 0 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
}
.ttl-imgLightboxTitle {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-primary, #f3f4f6);
  font-size: 12px;
  line-height: 16px;
}
.ttl-imgLightboxMeta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-size: 10.5px;
  line-height: 16px;
}
.ttl-imgLightboxClose {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin-left: auto;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.ttl-imgLightboxClose:hover { background: rgba(255, 255, 255, 0.08); color: var(--dsw-alias-label-primary, #f3f4f6); }
.ttl-imgLightboxClose:focus-visible {
  outline: 2px solid var(--dsw-static-blue-300, #7cb2ff);
  outline-offset: 1px;
}
.ttl-imgLightboxBody {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  overflow: auto;
}
.ttl-imgLightboxImg {
  display: block;
  max-width: 100%;
  max-height: calc(90vh - 88px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--dsw-radius-xs, 4px);
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


.ttl-jsonPrettyWrap { position: relative; }

.ttl-jsonPretty {
  margin: 0;
  padding: 2px 0 6px;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", "Fira Code", Consolas, Menlo, monospace);
  font-size: 11.5px;
  line-height: 17px;
  /* v0.10.45: wrap long JSON values (a long cmdString used to be clipped at
     the panel edge with a silent horizontal scrollbar); indentation survives
     because rows are block-level with their own padding-left. */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow-x: hidden;
  overflow-y: auto;
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

.ttl-jpLineFlex { display: flex; align-items: baseline; min-width: 0; }
.ttl-jpLong {
  display: flex;
  flex: 1 1 auto;
  align-items: baseline;
  min-width: 0;
  vertical-align: baseline;
  /* v0.10.32: a long value stays a normal JSON string token \u2014 the only chrome
     is the blue \u300C\u2026\u300D (click \u2192 single-value reader). */
  color: var(--dsw-alias-label-primary, #f9fafb);
}
.ttl-jpLongQuote { color: inherit; }
.ttl-jpLongText {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
  -webkit-mask-image: linear-gradient(to right, #000000 calc(100% - 10px), transparent);
  mask-image: linear-gradient(to right, #000000 calc(100% - 10px), transparent);
}
.ttl-jpLongMore {
  flex: none;
  margin: 0 2px 0 1px;
  padding: 0 2px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--dsw-static-blue-300, #7cb2ff);
  font: inherit;
  line-height: inherit;
  cursor: pointer;
  transition: background-color 160ms ease;
}
.ttl-jpLongMore:hover { text-decoration: underline; background: rgba(124, 178, 255, 0.12); }
.ttl-jpLongMore:focus-visible { outline: 2px solid var(--dsw-static-blue-300, #7cb2ff); outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) { .ttl-jpLongMore { transition: none; } }

.ttl-valueViewer { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; }

.ttl-valueBackdrop {
  position: absolute;
  inset: 0;
  background: var(--dsw-alias-bg-mask, rgba(0, 0, 0, 0.45));
  /* v0.10.30: the single-value reader is the only popup left \u2014 blur what is
     behind it so the value reads as a focused layer, not another page. */
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

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
/* v0.10.24: the search lives in the header, right before \u300C\u8DDF\u968F\u300D \u2014 the old
   full-width row cost a whole line for one input. */
.ttl-header .ttl-search {
  flex: 1 1 120px;
  min-width: 72px;
  max-width: 240px;
  height: 24px;
  gap: 6px;
  padding: 0 6px 0 8px;
}
.ttl-header .ttl-searchIcon { width: 11px; height: 11px; }
.ttl-header .ttl-searchInput { font-size: 11px; line-height: 16px; }
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
.ttl-summaryFilters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 5px;
}
/* v0.10.38: the merged row mirrors the ORIGINAL legend exactly \u2014 dot, then
   one quiet text run of name + count (same sans font/colour for both) with a
   comfortable gap. The active filter is only brighter (no underline/pill). */
.ttl-summaryFilters .ttl-chip {
  height: 16px;
  padding: 0;
  gap: 6px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-family: inherit;
  font-size: 10.5px;
}
.ttl-summaryFilters .ttl-chip:hover { background: transparent; color: var(--dsw-alias-label-secondary, #cfd3d6); }
.ttl-summaryFilters .ttl-chipSelected {
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f3f4f6);
  text-decoration: none;
  font-weight: 500;
}
/* Selected family: a quiet ring around the colour dot (no underline / pill). */
.ttl-summaryFilters .ttl-chipSelected .ttl-legendDot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.24);
}
.ttl-summaryFilters .ttl-chipSelected .ttl-chipCount { color: inherit; }
.ttl-summaryFilters .ttl-chipCount {
  color: inherit;
  font-family: inherit;
  font-size: 10.5px;
}
.ttl-summaryFilters .ttl-chipDot { width: 5px; height: 5px; }
.ttl-summaryFilters .ttl-legendDot { flex: none; }
.ttl-familyChip { height: 16px; }
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
.ttl-moreChip { padding: 0 7px; }
.ttl-toolDropdown {
  position: absolute;
  /* v0.10.24: header (44) + chip row (36) + 2 \u2014 the search row is gone. */
  top: 82px;
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
  /* v0.10.22: may shrink so the cluster chips can wrap instead of overflowing
     the 400px dock; the tag / time / duration keep flex:none. */
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  /* v0.10.20: the glyphs are 13px tall; a 13px line box centers the 9.5\u201310.5px
     counters on the icon ink instead of leaving them 1px high (top-aligned
     look). Badges/pills keep their own 16px line-height. */
  line-height: 13px;
}
.ttl-mix {
  display: inline-flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  /* v0.10.25: the chips now live on the duration side (left group), so an
     overflow wraps left-aligned instead of hugging the right edge. */
  justify-content: flex-start;
  align-items: center;
  gap: 7px;
  row-gap: 3px;
  min-width: 0;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  /* v0.10.27: the v0.10.20 centring fix (13px line box) lived on
     .ttl-turnMeta; moving the chips out of that group (v0.10.25) left them
     inheriting the 18px header line height, so the counters sat 1px high
     again. Pin the glyph grid here too. */
  line-height: 13px;
}
.ttl-mixItem { display: inline-flex; align-items: center; gap: 2px; font-size: 9.5px; font-variant-numeric: tabular-nums; }
.ttl-mixItem svg { display: block; }
.ttl-mixCount { display: inline-flex; align-items: center; height: 13px; }
.ttl-mixCount text {
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9.5px;
}
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
/* v0.10.16: the failure stat uses the row's alert-triangle glyph, not "\u2717". */
.ttl-badgeErr .ttl-rowIcon { display: inline-flex; }
.ttl-badgeErr svg { width: 11px; height: 11px; }
.ttl-badgeCount { font-variant-numeric: tabular-nums; }
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
/* v0.10.21: the whole collapsed card is a click target (header row + preview). */
.ttl-turn[data-collapsed="true"] { cursor: pointer; }
.ttl-turn[data-collapsed="true"] .ttl-turnPreview:hover { color: var(--dsw-alias-label-primary, #f3f4f6); }
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
  /* v0.10.2: every family shares one neutral chip (prototype 2-02). The fill
     stays opaque so the restored rail shows only between chips, never through
     them; the token is the theme's surface fill, i.e. the frame's exact chip. */
  background: var(--dsw-alias-bg-layer-2, #2c2c2f);
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
.ttl-step[data-step-kind="error"] .ttl-stepIcon {
  /* Opaque red chip: the rail must not bleed through a failing row's icon. */
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #f2726f) 16%, var(--dsw-alias-bg-layer-1, #232324));
  color: var(--dsw-alias-state-error-primary, #f2726f);
}

/* tool families \u2014 glyph ink only; v0.10.2 unifies the chip fill
   (.ttl-stepIcon), the failing row keeps a red chip */
.ttl-tone-shell { color: #a78bfa; }
.ttl-tone-read { color: #60a5fa; }
.ttl-tone-edit { color: #34d399; }
.ttl-tone-mcp { color: #f08fb8; }
.ttl-tone-todo { color: #f2b45c; }
.ttl-tone-error { color: #f2726f; }
.ttl-tone-generic { color: #9ba1a7; }

/* cluster ink \u2014 one colour per work cluster (v0.10.19). Rows, detail heads,
   zoom rows AND the statistics (mix chips / distribution bar / legend dots) all
   paint from these; the legacy .ttl-tone-* family colours above stay for
   backward compatibility only. */
.ttl-ink-violet { color: #a78bfa; }
.ttl-ink-blue { color: #60a5fa; }
.ttl-ink-green { color: #34d399; }
.ttl-ink-amber { color: #f2b45c; }
.ttl-ink-pink { color: #f08fb8; }
.ttl-ink-teal { color: #63c9d1; }
.ttl-ink-gray { color: #9ba1a7; }
.ttl-ink-red { color: #f2726f; }
/* v0.10.46: brand inks for the two provider subagents (filled marks). */
.ttl-ink-claude { color: #d97757; }
.ttl-ink-codex { color: #e6e8ea; }
.ttl-distSeg.ttl-ink-violet, .ttl-legendDot.ttl-ink-violet { background: #a78bfa; }
.ttl-distSeg.ttl-ink-blue, .ttl-legendDot.ttl-ink-blue { background: #60a5fa; }
.ttl-distSeg.ttl-ink-green, .ttl-legendDot.ttl-ink-green { background: #34d399; }
.ttl-distSeg.ttl-ink-amber, .ttl-legendDot.ttl-ink-amber { background: #f2b45c; }
.ttl-distSeg.ttl-ink-pink, .ttl-legendDot.ttl-ink-pink { background: #f08fb8; }
.ttl-distSeg.ttl-ink-teal, .ttl-legendDot.ttl-ink-teal { background: #63c9d1; }
.ttl-distSeg.ttl-ink-gray, .ttl-legendDot.ttl-ink-gray { background: #9ba1a7; }
.ttl-distSeg.ttl-ink-red, .ttl-legendDot.ttl-ink-red { background: #f2726f; }
.ttl-distSeg.ttl-ink-claude, .ttl-legendDot.ttl-ink-claude { background: #d97757; }
.ttl-distSeg.ttl-ink-codex, .ttl-legendDot.ttl-ink-codex { background: #e6e8ea; }
.ttl-stepIcon.ttl-tone-error {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #f2726f) 16%, var(--dsw-alias-bg-layer-1, #232324));
}
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
.ttl-detailAction {
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
/* v0.10.43: expand/collapse affordances sit centred BELOW the block \u2014 readers
   reach the cut at the bottom, so they never have to scroll back up. */
.ttl-sectionExpand { display: flex; justify-content: center; padding: 6px 0 2px; }
.ttl-expandBtn {
  padding: 2px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-static-blue-300, #7cb2ff);
  font: inherit;
  font-size: 10.5px;
  line-height: 16px;
  cursor: pointer;
  transition: background-color 160ms ease;
}
.ttl-expandBtn:hover { background: rgba(124, 178, 255, 0.10); }
.ttl-expandBtn:focus-visible { outline: 2px solid var(--dsw-static-blue-300, #7cb2ff); outline-offset: 1px; }

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
.ttl-detailFoot .ttl-detailAction {
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

/* \u2550\u2550 v0.9 integration fixes (frame compare round 1) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */

/* 1) turns are full-bleed; steps + band align to panel edges like the frames */
.ttl-turn { padding: 8px 0 10px; }
.ttl-turnHead { padding: 0 14px; }
.ttl-turnPreview { margin: 3px 14px 0; }
.ttl-turnFoot { padding: 6px 14px 0; }

/* 2) session summary bar / legend dots are painted from .ttl-tone-* (span/ i) */
.ttl-distSeg[class*="ttl-tone-"], .ttl-distSeg[class*="ttl-ink-"] { display: block; height: 4px; }
.ttl-legendDot[class*="ttl-tone-"], .ttl-legendDot[class*="ttl-ink-"] { display: inline-block; }

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


/* 9) filters: keep the \u300C\u66F4\u591A\u300D chip reachable while the list scrolls */
.ttl-moreChip, .ttl-chip-more {
  position: sticky;
  right: 0;
  z-index: 2;
  background: var(--dsw-alias-bg-layer-1, #232324);
  box-shadow: -8px 0 12px rgba(0, 0, 0, 0.35);
}


/* 10) v0.10.23: the cluster mix stays visible when a turn is expanded too \u2014
   the counts are the same 1:1 ledger as the rows below, so hiding them on open
   made the opened turn look like the numbers had disappeared. */
.ttl-turn[data-collapsed="false"] .ttl-mix { display: inline-flex; }

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

/* \u2550\u2550 v0.9.2 polish: full tool names, content-sized column \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-stepName {
  width: var(--ttl-step-name-w, 52px);
  min-width: 0;
}

/* \u2550\u2550 v0.9.3: parallel batches are marked by a bracket only (the between-chip
   rail returned in v0.10.2, see the section at the end of this sheet) \u2550\u2550\u2550\u2550\u2550\u2550 */
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
/* v0.10.8: an expanded turn's body nests under its header (tree indent). */
.ttl-turn[data-collapsed="false"] .ttl-turnBody { padding-left: 14px; }
.ttl-turn .ttl-stepJump { right: 8px; }
.ttl-turn .ttl-item { padding-right: 20px; }
.ttl-turn .ttl-parallel::before { left: 10px; }
.ttl-turn .ttl-turnBody .ttl-showEarlier { width: calc(100% - 36px); margin-left: 18px; margin-right: 18px; }

/* \u2550\u2550 v0.9.5 / v0.10.3: assistant prose is a one-line row like a tool step \u2550\u2550
   The row keeps the 32px grid / 14px icon inset / 8px gaps of ttl-step, so
   messages and tool calls read as one list; the body only opens on click. */
.ttl-msg { position: relative; }
.ttl-msgRow {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 22px 0 14px;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f3f4f6);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ttl-msgRow:hover { background: rgba(255, 255, 255, 0.04); border-radius: 4px; }
.ttl-msgRow:focus-visible { outline: none; box-shadow: 0 0 0 1px rgba(124, 178, 255, 0.55); border-radius: 4px; }
.ttl-msg[data-open="true"] .ttl-msgRow {
  background: rgba(76, 141, 255, 0.12);
  border-radius: 4px 4px 0 0;
}
/* Reuse the step chip for the message glyph; only the ink stays message-green. */
.ttl-msgIcon { color: #4ed4a4; }
.ttl-inputIcon { color: #60a5fa; }
.ttl-msgRole {
  flex: none;
  /* Same name column as the tool name, so the message text starts exactly
     under the tool descriptions (user-requested alignment). */
  width: var(--ttl-step-name-w, 52px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-size: 10.5px;
}
.ttl-msgPreview {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #dfe2e5;
  font-size: 12px;
}
.ttl-msgRest {
  flex: none;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
}
.ttl-msgChevron {
  flex: none;
  display: inline-flex;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  transform: rotate(90deg);
  transition: transform 120ms ease;
}
.ttl-msgChevronOpen { transform: rotate(-90deg); }
.ttl-msgBody {
  box-sizing: border-box;
  /* v0.10.12: expanded message reads as a card, same surface/radius/border as
     the inline detail band, aligned to the same 13.5px inset. */
  margin: 4px 13.5px 10px;
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #232324) 86%, #000000);
  border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
}
.ttl-msgFull {
  color: #dfe2e5;
  font-size: 12.5px;
  line-height: 19px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ttl-msgJump {
  position: absolute;
  right: 6px;
  top: 6px;
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

/* \u2550\u2550 v0.10.46: context-injection rows \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   An injected user/message (time-context, runtime-context, instructions,
   skill catalog, notice, recall) shares the message row's 32px grid and hover
   chrome; only the mono name slot and the snapshot body are its own. The name
   slot carries the injection's own title, aligned with the tool-name column.
   It never draws a status / duration: it is material the model read, not a
   tool call. */
.ttl-ctxIcon { color: #a78bfa; }
.ttl-ctxName {
  flex: none;
  /* Same name column as the tool rows, so the summary starts exactly under the
     tool descriptions; a long producer title ellipsizes instead of wrapping. */
  width: var(--ttl-step-name-w, 52px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-secondary, #cfd3d6);
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 10.5px;
}
.ttl-ctxNote {
  margin: 0 0 8px;
  color: var(--dsw-alias-label-quaternary, #7b8086);
  font-size: 10.5px;
  line-height: 16px;
}
/* The sections are the same bytes the model read, split at the producer's own
   boundaries; a long snapshot scrolls inside the card instead of growing it. */
.ttl-ctxSections {
  display: grid;
  gap: 10px;
  max-height: 141px;
  margin: 0;
  padding: 0;
  overflow: auto;
}
.ttl-ctxSection { margin: 0; }
.ttl-ctxSectionName {
  margin: 0 0 2px;
  color: var(--dsw-alias-label-tertiary, #9ba1a7);
  font-size: 10.5px;
  font-weight: 600;
}
.ttl-ctxSectionText {
  margin: 0;
  color: #cfd3d6;
  font-family: var(--ds-font-family-code, "SF Mono", "JetBrains Mono", Menlo, monospace);
  font-size: 11px;
  line-height: 16px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* \u2550\u2550 v0.9.7: no locate arrows, no \u2225N badge, edit/mcp colours split \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-stepJump, .ttl-locateBtn, .ttl-msgJump, .ttl-itemJump, .ttl-output-jump { display: none !important; }
.ttl-badgeParallel { display: none !important; }
.ttl-tone-edit { color: #f2b45c; }
.ttl-tone-todo { color: #8fdcb8; }

.ttl-distSeg.ttl-tone-edit, .ttl-legendDot.ttl-tone-edit { background: #f2b45c; }
.ttl-distSeg.ttl-tone-mcp, .ttl-legendDot.ttl-tone-mcp { background: #34d399; }
.ttl-distSeg.ttl-tone-todo, .ttl-legendDot.ttl-tone-todo { background: #8fdcb8; }

/* \u2550\u2550 v0.9.9: generic tool glyph gets its own hue (not grey) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-tone-generic { color: #f472b6; }
.ttl-distSeg.ttl-tone-generic, .ttl-legendDot.ttl-tone-generic { background: #f472b6; }

/* \u2550\u2550 v0.10.2: unified chip + rail between chips (prototype 2-02) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
/* The rail is the connector SEEN BETWEEN ICONS only: every chip is opaque, so
   the 1px line is clipped to the 7px gaps above/below it. It sits under the
   chip (chip z-index 1) and leaves the parallel bracket untouched. */
.ttl-turn .ttl-stepRail {
  left: 23px;
  background: rgba(255, 255, 255, 0.08);
}


/* \u2550\u2550 v0.10.6: skill tool gets its own family glyph (sparkle) + teal ink \u2550\u2550 */
.ttl-tone-skill { color: #63c9d1; }
.ttl-distSeg.ttl-tone-skill, .ttl-legendDot.ttl-tone-skill { background: #63c9d1; }

/* \u2550\u2550 v0.10.10: figma plugin + todo get real colours (no grey glyphs) \u2550\u2550\u2550\u2550\u2550\u2550 */
.ttl-tone-figma { color: #c4b2ff; }
.ttl-distSeg.ttl-tone-figma, .ttl-legendDot.ttl-tone-figma { background: #c4b2ff; }
`;

// src/client/TrailTab.tsx
var React9 = __toESM(require("react"), 1);

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
var CONTEXT_FORMS = /* @__PURE__ */ new Set([
  "instructions",
  "catalog",
  "snapshot",
  "notice",
  "relay",
  "recall"
]);
function fullTextOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts = [];
  for (const block of content) {
    const b = record(block);
    if (b === null || Array.isArray(block) || b.type !== "text" || typeof b.text !== "string" || b.text.length === 0) continue;
    parts.push(b.text);
  }
  return parts.join("\n");
}
function firstLineOf(text) {
  for (const line2 of text.split("\n")) {
    const value = line2.trim();
    if (value.length > 0) return value;
  }
  return "";
}
function messageSourceOf(data) {
  const message = record(data.message);
  const nested = message === null ? null : record(message.source);
  if (nested !== null && !Array.isArray(nested)) return nested;
  const direct = record(data.source);
  return direct !== null && !Array.isArray(direct) ? direct : null;
}
function contextSectionsOf(source) {
  const list = source.sections;
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const entry of list) {
    const section = record(entry);
    if (section === null || Array.isArray(entry)) return [];
    if (typeof section.name !== "string" || section.name.length === 0) return [];
    if (typeof section.text !== "string") return [];
    out.push({ name: section.name, text: section.text });
  }
  return out;
}
function sourceValuesOf(source, member, field) {
  const list = source[member];
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const entry of list) {
    const item = record(entry);
    if (item === null || Array.isArray(entry)) continue;
    const value = item[field];
    if (typeof value === "string" && value.length > 0 && !out.includes(value)) out.push(value);
  }
  return out;
}
function contextLabelOf(kind, source) {
  if (kind === "skill-invocation" && typeof source.name === "string" && source.name.length > 0) {
    return source.name;
  }
  if (kind === "agent-instructions") {
    const paths = sourceValuesOf(source, "changes", "path");
    if (paths.length > 0) return paths.join(", ");
  }
  if (kind === "session-reference") {
    const labels = sourceValuesOf(source, "references", "label");
    if (labels.length > 0) return labels.join(", ");
  }
  return kind;
}
function contextItemOf(data, seq) {
  const source = messageSourceOf(data);
  if (source === null) return null;
  const kind = typeof source.kind === "string" && source.kind.length > 0 ? source.kind : null;
  if (kind === null || kind === "user") return null;
  const rawForm = typeof source.form === "string" ? source.form : null;
  const form = rawForm !== null && CONTEXT_FORMS.has(rawForm) ? rawForm : null;
  const sections = form === "snapshot" ? contextSectionsOf(source) : [];
  const message = record(data.message);
  const direct = fullTextOf(data.content);
  const text = direct.length > 0 ? direct : message === null ? "" : fullTextOf(message.content);
  const summary = compact(firstLineOf(sections.length > 0 ? sections[0].text : text));
  if (summary.length === 0) return null;
  return {
    kind: "context",
    seq,
    source: kind,
    label: contextLabelOf(kind, source),
    form,
    summary,
    sections,
    text
  };
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
  constructor(addStep, markDirty, syncFailed = () => {
  }) {
    this.addStep = addStep;
    this.markDirty = markDirty;
    this.syncFailed = syncFailed;
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
    this.syncFailed(step);
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
    /** Last known failed state per step, so the global counter can follow
     * replacements that turn a failed result back into a healthy one. */
    this.failedState = /* @__PURE__ */ new WeakMap();
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
      },
      (step) => {
        this.syncFailed(step);
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
    this.byTool.set(item.step.name, (this.byTool.get(item.step.name) ?? 0) + 1);
    this.syncFailed(item.step);
    this.markDirty(builder);
  }
  /**
   * Keep `failed` / `byTool` in sync with the SAME predicate the rows and the
   * per-turn badge use (`kind === 'error' || result.isError`). A plain
   * `tool/result` with `isError` is not a kind `error` row, so counting only
   * the kind made the global chip disagree with the turn badge; replacements
   * can also flip a step back, hence the per-step transition check.
   */
  syncFailed(step) {
    const now = step.kind === "error" || step.result?.isError === true;
    const before = this.failedState.get(step) === true;
    if (before === now) return;
    this.failedState.set(step, now);
    this.failed += now ? 1 : -1;
    const count = this.byTool.get(step.name) ?? 0;
    const next = now ? Math.max(0, count - 1) : count + 1;
    if (next === 0) this.byTool.delete(step.name);
    else this.byTool.set(step.name, next);
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
          const context = contextItemOf(data, seq);
          if (context !== null) {
            this.current.contexts.push({ seq, text: context.text, preview: context.summary });
            appendItem(this.current, context);
            this.markDirty(this.current);
          }
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
    this.failedState = /* @__PURE__ */ new WeakMap();
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
  autoOpenTitle: "\u9996\u8F6E\u81EA\u52A8\u6253\u5F00",
  autoOpenDesc: "\u65B0\u5BF9\u8BDD\u53D1\u51FA\u7B2C\u4E00\u6761\u6D88\u606F\u65F6\uFF0C\u81EA\u52A8\u5728\u53F3\u4FA7\u680F\u5C55\u5F00\u8F6E\u6B21\u8F68\u8FF9\uFF08\u6BCF\u4E2A\u4F1A\u8BDD\u53EA\u81EA\u52A8\u6253\u5F00\u4E00\u6B21\uFF0C\u7A84\u5C4F\u4E0D\u89E6\u53D1\uFF09",
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
  imageOpen: "\u67E5\u770B\u5927\u56FE",
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
  autoOpenTitle: "Open on the first turn",
  autoOpenDesc: "Pop the trail open in the right sidebar when a new conversation sends its first message (once per conversation; skipped on narrow screens)",
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
  imageOpen: "View full size",
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
var TRAJECTORY_SCROLL_SELECTOR = "[data-trajectory-scroll]";
var TRAJECTORY_SCAN_STEP_RATIO = 0.8;
var TRAJECTORY_SCAN_MAX_STEPS = 200;
var TRAJECTORY_SCAN_TIME_BUDGET_MS = 5e3;
function trajectoryScrollPane(document2) {
  const pane = document2.querySelector(TRAJECTORY_SCROLL_SELECTOR);
  if (pane === null || typeof pane !== "object") return null;
  if (typeof pane.scrollTop !== "number" || typeof pane.clientHeight !== "number") return null;
  if (!(pane.clientHeight > 0)) return null;
  return pane;
}
function moveScrollPane(pane, top) {
  pane.scrollTop = Math.max(0, top);
  if (typeof pane.dispatchEvent === "function" && typeof Event === "function") {
    try {
      pane.dispatchEvent(new Event("scroll"));
    } catch {
    }
  }
}
function matchTrajectoryRow(document2, keys, item) {
  return findTrajectoryRowByKeys(document2, keys) ?? findTrajectoryRowBySeq(document2, item);
}
async function scanTrajectoryRows(document2, keys, item) {
  const pane = trajectoryScrollPane(document2);
  if (pane === null) return null;
  const original = pane.scrollTop;
  const maxTop = Math.max(0, Number(pane.scrollHeight ?? 0) - pane.clientHeight);
  const step = Math.max(120, Math.floor(pane.clientHeight * TRAJECTORY_SCAN_STEP_RATIO));
  const probe = async () => {
    const row = matchTrajectoryRow(document2, keys, item);
    if (row !== null) return row;
    if (document2.querySelector("tr[data-collapsed-summary]") === null) return null;
    expandCollapsedSummaries(document2);
    await waitForNextFrame();
    return matchTrajectoryRow(document2, keys, item);
  };
  const walk = async (from, direction) => {
    let top = Math.max(0, Math.min(maxTop, from));
    const startedAt = Date.now();
    for (let index = 0; index < TRAJECTORY_SCAN_MAX_STEPS; index += 1) {
      if (Date.now() - startedAt > TRAJECTORY_SCAN_TIME_BUDGET_MS) break;
      moveScrollPane(pane, top);
      await waitForNextFrame();
      await waitForNextFrame();
      const row = await probe();
      if (row !== null) return row;
      if (direction > 0 && top >= maxTop) break;
      if (direction < 0 && top <= 0) break;
      top = Math.max(0, Math.min(maxTop, top + direction * step));
    }
    return null;
  };
  const downward = await walk(original, 1);
  if (downward !== null) return downward;
  const upward = await walk(original - step, -1);
  if (upward !== null) return upward;
  moveScrollPane(pane, original);
  return null;
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
      if (row2 === null) {
        row2 = await scanTrajectoryRows(document2, keys, item);
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
var INK_OF = {
  terminal: "violet",
  "terminal-session": "violet",
  jobs: "violet",
  code: "violet",
  "file-read": "blue",
  "file-write": "green",
  "file-edit": "green",
  search: "blue",
  web: "blue",
  todo: "amber",
  goal: "amber",
  schedule: "amber",
  ask: "blue",
  present: "green",
  subagent: "pink",
  claude: "claude",
  codex: "codex",
  team: "pink",
  "team-task": "pink",
  workflow: "violet",
  skill: "teal",
  session: "teal",
  folder: "gray",
  plugin: "gray",
  mcp: "pink",
  alert: "red",
  generic: "gray"
};
function inkOf(kind) {
  return INK_OF[kind];
}
var CLUSTER_BY_NAME = {
  // A · 执行
  bash: "terminal",
  pwsh: "terminal",
  shell: "terminal",
  bash_output: "terminal",
  terminal_open: "terminal-session",
  terminal_send: "terminal-session",
  terminal_read: "terminal-session",
  terminal_signal: "terminal-session",
  terminal_close: "terminal-session",
  terminal_list: "terminal-session",
  job_list: "jobs",
  job_output: "jobs",
  job_kill: "jobs",
  run_code: "code",
  lsp: "code",
  // B · 文件与信息
  read: "file-read",
  read_image: "file-read",
  write: "file-write",
  apply_patch: "file-write",
  append: "file-write",
  edit: "file-edit",
  str_replace_editor: "file-edit",
  glob: "search",
  grep: "search",
  search: "search",
  web_search: "web",
  web_fetch: "web",
  // C · 计划与调度
  todo_write: "todo",
  todo_read: "todo",
  create_goal: "goal",
  get_goal: "goal",
  update_goal: "goal",
  schedule_create: "schedule",
  schedule_edit: "schedule",
  schedule_list: "schedule",
  schedule_view: "schedule",
  // D · 交互与交付
  ask_user_question: "ask",
  present: "present",
  // E · 协作与编排
  subagent: "subagent",
  subagent_fork: "subagent",
  list_subagent_models: "subagent",
  // v0.10.46: the two provider-specific subagent tools carry their official
  // brand mark instead of the generic robot. The provider `toolName` is free
  // text (dsh-tool-subagent config), so these are the names DSH registers for
  // the bundled anthropic / openai providers.
  subagent_claude_code: "claude",
  subagent_codex: "codex",
  spawn_teammate: "team",
  list_agents: "team",
  send_message: "team",
  interrupt_agent: "team",
  wait_agent: "team",
  team_task_create: "team-task",
  team_task_get: "team-task",
  team_task_list: "team-task",
  team_task_update: "team-task",
  workflow: "workflow",
  ralph: "workflow",
  // F · 上下文与扩展
  skill: "skill",
  session_search: "session",
  session_event_search: "session",
  session_trace: "session",
  session_event_trace: "session",
  session_event_read: "session",
  working_directory: "folder",
  load_workspace_dependencies: "folder",
  create_worktree: "folder",
  ls: "folder",
  list_directory: "folder",
  list_dir: "folder",
  cordis_inspect_list: "plugin",
  cordis_inspect_query: "plugin",
  // MCP resources are MCP-flavoured, not a separate cluster.
  list_mcp_resources: "mcp",
  list_mcp_resource_templates: "mcp",
  read_mcp_resource: "mcp"
};
var CLUSTER_RULES = [
  ["terminal_", "terminal-session"],
  ["job_", "jobs"],
  ["schedule_", "schedule"],
  ["session_", "session"],
  ["team_task_", "team-task"],
  ["cordis_", "plugin"],
  // v0.10.46: every other provider-named subagent tool (`subagent_acp`, a
  // custom `toolName`) is still one delegated child agent; the two branded
  // providers above are resolved by the exact table first.
  ["subagent_", "subagent"]
];
function toolIconKind(name) {
  if (name.startsWith("mcp__") || name.startsWith("mcp_")) return "mcp";
  const exact = CLUSTER_BY_NAME[name];
  if (exact !== void 0) return exact;
  for (const [prefix, kind] of CLUSTER_RULES) {
    if (name.startsWith(prefix)) return kind;
  }
  if (name.endsWith("_goal")) return "goal";
  return "generic";
}
var FALLBACK_KEYS = ["description", "command", "file_path", "path", "pattern", "query", "url", "prompt"];
var DETAIL_MAX = 120;
function fileBaseName(path2) {
  const trimmed = path2.trim().replace(/[\\/]+$/, "");
  if (trimmed.length === 0) return path2.trim();
  const at = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return at >= 0 ? trimmed.slice(at + 1) : trimmed;
}
function firstLine(text) {
  for (const line2 of text.split("\n")) {
    const value = line2.trim();
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
  const icon = toolIconKind(name);
  switch (name) {
    case "bash":
    case "bash_output":
    case "shell": {
      const description = str(args, "description");
      const command = str(args, "command");
      const detail = description !== void 0 ? clip(description) : command !== void 0 ? clip(firstLine(command)) : clip(firstLine(argsPreview));
      return { label: name, detail, icon };
    }
    case "read":
    case "read_image":
    case "write":
    case "edit":
    case "append": {
      const file = str(args, "file_path") ?? str(args, "path");
      if (file !== void 0) return { label: name, detail: clip(fileBaseName(file)), icon };
      return { label: name, detail: clip(firstLine(argsPreview)), icon };
    }
    case "glob":
    case "grep":
    case "search": {
      const pattern = str(args, "pattern") ?? str(args, "query");
      return { label: name, detail: pattern !== void 0 ? clip(pattern) : clip(firstLine(argsPreview)), icon };
    }
    case "ls":
    case "list_directory":
    case "list_dir": {
      const path2 = str(args, "path") ?? str(args, "file_path");
      return { label: name, detail: path2 !== void 0 ? clip(path2) : clip(firstLine(argsPreview)), icon };
    }
    case "todo_write": {
      const todos = args?.todos;
      const count = Array.isArray(todos) ? todos.length : null;
      return {
        label: name,
        detail: count !== null ? `${count} \u9879` : clip(firstLine(argsPreview)),
        icon
      };
    }
    case "todo_read": {
      const todos = args?.todos;
      const count = Array.isArray(todos) ? todos.length : null;
      return { label: name, detail: count !== null ? `${count} \u9879` : "", icon };
    }
    case "skill": {
      const skillName = str(args, "name") ?? str(args, "skill");
      return {
        label: name,
        detail: skillName !== void 0 ? clip(skillName) : clip(firstLine(argsPreview)),
        icon
      };
    }
    default:
      break;
  }
  if (name.startsWith("figma_")) {
    const detail = str(args, "documentId") ?? str(args, "fileKey") ?? str(args, "nodeId") ?? str(args, "name") ?? (args === null ? clip(firstLine(argsPreview)) : "");
    return { label: name, detail, icon };
  }
  if (args !== null) {
    for (const key of FALLBACK_KEYS) {
      const value = str(args, key);
      if (value !== void 0) return { label: name, detail: clip(key === "file_path" || key === "path" ? fileBaseName(value) : firstLine(value)), icon };
    }
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === "string" && value.trim().length > 0) {
        return { label: name, detail: clip(`${key} ${firstLine(value)}`), icon };
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return { label: name, detail: clip(`${key} ${String(value)}`), icon };
      }
      if (Array.isArray(value)) {
        return { label: name, detail: `${key} \xB7 ${value.length} \u9879`, icon };
      }
    }
    const count = Object.keys(args).length;
    if (count > 0) return { label: name, detail: `${count} \u4E2A\u53C2\u6570`, icon };
    return { label: name, detail: "", icon };
  }
  return { label: name, detail: clip(firstLine(argsPreview)), icon };
}

// src/client/tool-icon.tsx
var React2 = __toESM(require("react"), 1);
var STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
function path(d) {
  return React2.createElement("path", { d, ...STROKE });
}
function line(x1, y1, x2, y2) {
  return React2.createElement("line", { x1, y1, x2, y2, ...STROKE });
}
function polyline(points) {
  return React2.createElement("polyline", { points, ...STROKE });
}
function circle(cx, cy, r) {
  return React2.createElement("circle", { cx, cy, r, ...STROKE });
}
function rect(x, y, width, height, rx = 2) {
  return React2.createElement("rect", { x, y, width, height, rx, ...STROKE });
}
function filled(d) {
  return React2.createElement("path", { d, fill: "currentColor", stroke: "none" });
}
var CLAUDE_MARK = "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";
var OPENAI_MARK = "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";
function pathsOf(kind) {
  switch (kind) {
    // ── A · 执行 ──────────────────────────────────────────────────────────
    case "terminal":
      return React2.createElement(
        React2.Fragment,
        null,
        polyline("4 17 10 11 4 5"),
        line(12, 19, 20, 19)
      );
    case "terminal-session":
      return React2.createElement(
        React2.Fragment,
        null,
        path("m7 11 2-2-2-2"),
        path("M11 13h4"),
        rect(3, 3, 18, 18)
      );
    case "jobs":
      return React2.createElement(
        React2.Fragment,
        null,
        path("m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"),
        path("m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"),
        path("m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65")
      );
    case "code":
      return React2.createElement(
        React2.Fragment,
        null,
        polyline("16 18 22 12 16 6"),
        polyline("8 6 2 12 8 18")
      );
    // ── B · 文件与信息 ────────────────────────────────────────────────────
    case "file-read":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"),
        polyline("14 2 14 8 20 8"),
        line(8, 13, 16, 13),
        line(8, 17, 13, 17)
      );
    case "file-write":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"),
        polyline("14 2 14 8 20 8"),
        line(12, 12, 12, 17),
        polyline("9.5 14.5 12 17 14.5 14.5")
      );
    case "file-edit":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M12 20h9"),
        path("M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z")
      );
    case "search":
      return React2.createElement(
        React2.Fragment,
        null,
        circle(11, 11, 7),
        line(21, 21, 16.65, 16.65)
      );
    case "web":
      return React2.createElement(
        React2.Fragment,
        null,
        circle(12, 12, 10),
        path("M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"),
        path("M2 12h20")
      );
    // ── C · 计划与调度 ────────────────────────────────────────────────────
    case "todo":
      return React2.createElement(
        React2.Fragment,
        null,
        path("m3 17 2 2 4-4"),
        path("m3 7 2 2 4-4"),
        path("M13 6h8"),
        path("M13 12h8"),
        path("M13 18h8")
      );
    case "goal":
      return React2.createElement(
        React2.Fragment,
        null,
        circle(12, 12, 10),
        circle(12, 12, 6),
        circle(12, 12, 2)
      );
    case "schedule":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"),
        path("M16 2v4"),
        path("M8 2v4"),
        path("M3 10h5"),
        path("M17.5 17.5 16 16.3V14"),
        circle(16, 16, 6)
      );
    // ── D · 交互与交付 ────────────────────────────────────────────────────
    case "ask":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M7.9 20A9 9 0 1 0 4 16.1L2 22Z"),
        path("M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"),
        path("M12 17h.01")
      );
    case "present":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M2 3h20"),
        path("M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"),
        path("m7 21 5-5 5 5")
      );
    // ── E · 协作与编排 ────────────────────────────────────────────────────
    case "subagent":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M12 8V4H8"),
        rect(4, 8, 16, 12),
        path("M2 14h2"),
        path("M20 14h2"),
        path("M15 13v2"),
        path("M9 13v2")
      );
    // v0.10.46: the provider-specific subagents show their own official mark
    // instead of the robot, so a row says *which* agent family ran.
    case "claude":
      return filled(CLAUDE_MARK);
    case "codex":
      return filled(OPENAI_MARK);
    case "team":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"),
        circle(9, 7, 4),
        path("M22 21v-2a4 4 0 0 0-3-3.87"),
        path("M16 3.13a4 4 0 0 1 0 7.75")
      );
    case "team-task":
      return React2.createElement(
        React2.Fragment,
        null,
        rect(3, 3, 18, 18),
        path("M8 7v7"),
        path("M12 7v4"),
        path("M16 7v9")
      );
    case "workflow":
      return React2.createElement(
        React2.Fragment,
        null,
        rect(3, 3, 8, 8),
        path("M7 11v4a2 2 0 0 0 2 2h4"),
        rect(13, 13, 8, 8)
      );
    // ── F · 上下文与扩展 ──────────────────────────────────────────────────
    case "skill":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M12 7v14"),
        path("M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z")
      );
    case "session":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"),
        path("M3 3v5h5"),
        path("M12 7v5l4 2")
      );
    case "folder":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")
      );
    case "plugin":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z")
      );
    // ── 协议 / 状态 ───────────────────────────────────────────────────────
    case "mcp":
      return React2.createElement(
        React2.Fragment,
        null,
        line(9, 2, 9, 7),
        line(15, 2, 15, 7),
        path("M6 7h12v5a6 6 0 0 1-12 0z"),
        line(12, 18, 12, 22)
      );
    case "alert":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"),
        line(12, 9, 12, 13),
        line(12, 17, 12.01, 17)
      );
    case "generic":
      return React2.createElement(
        React2.Fragment,
        null,
        path("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z")
      );
    default:
      return null;
  }
}
function ToolIcon({ kind }) {
  return React2.createElement(
    "span",
    { className: "ttl-rowIcon", "aria-hidden": "true" },
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
  const lines = body.split("\n").map((line2) => line2.replace(LINE_NUMBER_PREFIX, ""));
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
  const firstLine2 = (text.split("\n", 1)[0] ?? "").trimStart();
  if (firstLine2.startsWith("Error:") || firstLine2.startsWith("Traceback")) return false;
  if (/^at\s/.test(firstLine2)) return false;
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
    () => openFile === void 0 ? void 0 : (path2, options) => openFile(path2, options?.line),
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
  if (name === "skill") return "skill";
  if (name.startsWith("figma_")) return "figma";
  if (name === "todo_write" || name === "todo_read") return "todo";
  return "generic";
}

// src/client/StepDetail.tsx
var React8 = __toESM(require("react"), 1);

// src/client/json-tree.tsx
var React4 = __toESM(require("react"), 1);
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

// src/client/json-pretty.tsx
var React7 = __toESM(require("react"), 1);

// src/client/value-viewer.tsx
var React6 = __toESM(require("react"), 1);
var import_react_dom2 = require("react-dom");

// src/client/ui-shared.tsx
var React5 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");

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
function TrailImages(props) {
  const { images, sessionId, lang } = props;
  return /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgRow", "data-testid": "ttl-img-row" }, images.map((image, index) => /* @__PURE__ */ React5.createElement(ImageBlock, { key: `${image.attachmentId}:${index}`, image, sessionId, lang })));
}
function ImageLightbox(props) {
  const { url, label, meta, lang, onClose } = props;
  const closeRef = React5.useRef(null);
  const returnFocusRef = React5.useRef(null);
  React5.useEffect(() => {
    returnFocusRef.current = typeof document === "undefined" ? null : document.activeElement;
    const close = closeRef.current;
    if (close !== null && typeof close.focus === "function") close.focus();
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement && target.isConnected) target.focus();
    };
  }, [onClose]);
  if (typeof document === "undefined") return null;
  const closeLabel = t(lang, "zoomClose");
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ React5.createElement(
      "div",
      {
        className: "ttl-imgLightbox",
        "data-testid": "ttl-img-lightbox",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": label
      },
      /* @__PURE__ */ React5.createElement(
        "div",
        {
          className: "ttl-imgLightboxBackdrop",
          "data-testid": "ttl-img-lightbox-backdrop",
          "aria-hidden": "true",
          onClick: onClose
        }
      ),
      /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgLightboxPanel" }, /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgLightboxHead" }, /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgLightboxTitle" }, label), /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgLightboxMeta" }, meta), /* @__PURE__ */ React5.createElement(
        "button",
        {
          ref: closeRef,
          type: "button",
          className: "ttl-imgLightboxClose",
          "data-testid": "ttl-img-lightbox-close",
          title: closeLabel,
          "aria-label": closeLabel,
          onClick: onClose
        },
        "\u2715"
      )), /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgLightboxBody", onClick: onClose }, /* @__PURE__ */ React5.createElement(
        "img",
        {
          className: "ttl-imgLightboxImg",
          "data-testid": "ttl-img-lightbox-img",
          src: url,
          alt: label,
          onClick: (event) => {
            event.stopPropagation();
          }
        }
      )))
    ),
    document.body
  );
}
var ImageBlock = React5.memo(function ImageBlock2(props) {
  const { image, sessionId, lang } = props;
  const [loadFailed, setLoadFailed] = React5.useState(false);
  const [zoomed, setZoomed] = React5.useState(false);
  const url = attachmentUrl(sessionId, image);
  const name = image.name ?? image.mediaType;
  const label = t(lang, "imageLabel")(name);
  const meta = /* @__PURE__ */ React5.createElement(React5.Fragment, null, /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgMeta" }, image.mediaType), image.width !== void 0 && image.height !== void 0 ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgMeta" }, t(lang, "imageMeta")(
    image.width,
    image.height,
    formatBytes(image.bytes)
  )) : null);
  const showThumb = url !== null && !loadFailed;
  const openLabel = t(lang, "imageOpen");
  return /* @__PURE__ */ React5.createElement("div", { className: "ttl-imgItem", "data-testid": "ttl-img-item" }, showThumb ? /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      className: "ttl-imgThumbWrap ttl-imgThumbBtn",
      "data-testid": "ttl-img-thumb-wrap",
      title: openLabel,
      "aria-label": openLabel,
      onClick: () => {
        setZoomed(true);
      }
    },
    /* @__PURE__ */ React5.createElement(
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
    )
  ) : null, /* @__PURE__ */ React5.createElement("span", { className: "ttl-imgChip", "data-testid": "ttl-img-chip" }, /* @__PURE__ */ React5.createElement("span", null, label), meta), loadFailed ? /* @__PURE__ */ React5.createElement("span", { className: "ttl-pill ttl-pillWarn", "data-testid": "ttl-img-failed" }, t(lang, "imageLoadFailed")) : null, showThumb && zoomed && url !== null ? /* @__PURE__ */ React5.createElement(ImageLightbox, { url, label, meta, lang, onClose: () => {
    setZoomed(false);
  } }) : null);
});

// src/client/value-viewer.tsx
var RENDER_LINE_CAP = 4e3;
function highlight(line2, query) {
  if (query.length === 0) return line2;
  const lower = line2.toLowerCase();
  const needle = query.toLowerCase();
  const parts = [];
  let from = 0;
  let key = 0;
  for (let at = lower.indexOf(needle, from); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push(line2.slice(from, at));
    parts.push(React6.createElement("mark", { key: key += 1, className: "ttl-valueHit" }, line2.slice(at, at + query.length)));
    from = at + query.length;
  }
  if (from < line2.length) parts.push(line2.slice(from));
  return parts.length === 0 ? line2 : parts;
}
function ValueViewer(props) {
  const { label, text, lang, onClose } = props;
  const [query, setQuery] = React6.useState("");
  const [copied, setCopied] = React6.useState(false);
  const panelRef = React6.useRef(null);
  const searchRef = React6.useRef(null);
  const returnFocusRef = React6.useRef(null);
  const allLines = React6.useMemo(() => {
    return text.replace(/\r\n?/g, "\n").split("\n");
  }, [text]);
  const lines = allLines.length > RENDER_LINE_CAP ? allLines.slice(0, RENDER_LINE_CAP) : allLines;
  const clipped = lines.length < allLines.length;
  const hits = React6.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return 0;
    let count = 0;
    for (const line2 of allLines) {
      const lower = line2.toLowerCase();
      for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, at + needle.length)) count += 1;
    }
    return count;
  }, [allLines, query]);
  React6.useEffect(() => {
    returnFocusRef.current = typeof document === "undefined" ? null : document.activeElement;
    const panel = panelRef.current;
    if (panel !== null) panel.focus();
    return () => {
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement && target.isConnected !== false) target.focus();
    };
  }, []);
  const copy = React6.useCallback(() => {
    copyToClipboard(text);
    setCopied(true);
  }, [text]);
  React6.useEffect(() => {
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
  return (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ React6.createElement("div", { className: "ttl-valueViewer", "data-testid": "ttl-value-viewer" }, /* @__PURE__ */ React6.createElement("div", { className: "ttl-valueBackdrop", onClick: onClose, "aria-hidden": "true" }), /* @__PURE__ */ React6.createElement(
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
      /* @__PURE__ */ React6.createElement("div", { className: "ttl-valueHead" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-valueTitle", "data-testid": "ttl-value-title" }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-valueName" }, label), /* @__PURE__ */ React6.createElement("span", { className: "ttl-valueMeta" }, meta)), /* @__PURE__ */ React6.createElement("span", { className: "ttl-valueTools" }, /* @__PURE__ */ React6.createElement(
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
      ), query.trim().length > 0 ? /* @__PURE__ */ React6.createElement("span", { className: "ttl-valueHits", "data-testid": "ttl-value-hits" }, hits > 0 ? t(lang, "valueHits")(hits) : t(lang, "valueNoHit")) : null, /* @__PURE__ */ React6.createElement("button", { type: "button", className: "ttl-dtab", "data-testid": "ttl-value-copy", onClick: copy }, t(lang, copied ? "copiedDone" : "copyDetail")), /* @__PURE__ */ React6.createElement("button", { type: "button", className: "ttl-dtab", "data-testid": "ttl-value-close", onClick: onClose }, t(lang, "zoomClose")))),
      /* @__PURE__ */ React6.createElement("div", { className: "ttl-valueBody", "data-testid": "ttl-value-body" }, lines.map((line2, index) => (
        // eslint-disable-next-line react/no-array-index-key
        /* @__PURE__ */ React6.createElement("div", { className: "ttl-valueLine", key: index }, /* @__PURE__ */ React6.createElement("span", { className: "ttl-valueLn", "aria-hidden": "true" }, index + 1), /* @__PURE__ */ React6.createElement("span", { className: "ttl-valueCode" }, highlight(line2, query.trim())))
      )), clipped ? /* @__PURE__ */ React6.createElement("div", { className: "ttl-valueClipped", "data-testid": "ttl-value-clipped" }, t(lang, "valueClipped")(allLines.length - lines.length)) : null)
    )),
    document.body
  );
}

// src/client/json-pretty.tsx
var LONG_VALUE_CHARS = 160;
var RENDER_LINE_CAP2 = 2e3;
function formatCount(n) {
  if (n < 1e3) return String(n);
  const thousands = Math.floor(n / 1e3);
  const rest = n % 1e3;
  return rest === 0 ? `${thousands},000` : `${thousands},${String(rest).padStart(3, "0")}`;
}
function isPlainObject(value) {
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
    React7.createElement(
      "div",
      { className: "ttl-jpLine", style: { paddingLeft: `${depth * 14}px` }, "data-testid": testid, key: ctx.seq },
      content
    )
  );
}
function LongValue(props) {
  const { label, text, ctx, trailingComma = false } = props;
  const lineCount2 = text.includes("\n") ? text.split("\n").length : 1;
  const meta = t(ctx.lang, "valueMeta")(formatCount(text.length), lineCount2);
  const viewLabel = t(ctx.lang, "viewInCenter");
  const firstLine2 = (text.split("\n")[0] ?? "").trim();
  const title = `${viewLabel} \xB7 ${meta}`;
  return /* @__PURE__ */ React7.createElement(
    "span",
    {
      className: "ttl-jpLong",
      "data-testid": "ttl-json-long",
      onClick: (event) => {
        event.stopPropagation();
      }
    },
    /* @__PURE__ */ React7.createElement("span", { className: "ttl-jpLongQuote", "aria-hidden": "true" }, '"'),
    /* @__PURE__ */ React7.createElement("span", { className: "ttl-jpLongText", "data-testid": "ttl-json-long-preview" }, firstLine2),
    /* @__PURE__ */ React7.createElement(
      "button",
      {
        type: "button",
        className: "ttl-jpLongMore",
        "data-testid": "ttl-json-long-view",
        title,
        "aria-label": title,
        onClick: () => {
          ctx.onView(label, text);
        }
      },
      "\u2026"
    ),
    /* @__PURE__ */ React7.createElement("span", { className: "ttl-jpLongQuote", "aria-hidden": "true" }, '"'),
    trailingComma ? /* @__PURE__ */ React7.createElement("span", { className: "ttl-jsonPunct" }, ",") : null
  );
}
function emitValue(ctx, value, depth, key, path2, trailingComma) {
  const comma = trailingComma ? "," : "";
  const prefix = key === null ? null : React7.createElement(
    React7.Fragment,
    null,
    React7.createElement("span", { className: "ttl-jsonKey" }, JSON.stringify(key)),
    ": "
  );
  if (typeof value === "string") {
    if (value.length >= LONG_VALUE_CHARS) {
      pushRow(ctx, depth, React7.createElement(
        "span",
        { className: "ttl-jpLineFlex" },
        prefix,
        React7.createElement(LongValue, { label: path2, text: value, ctx, trailingComma })
      ));
      return;
    }
    pushRow(ctx, depth, React7.createElement(
      React7.Fragment,
      null,
      prefix,
      React7.createElement("span", { className: "ttl-jsonStr" }, JSON.stringify(value)),
      comma
    ));
    return;
  }
  if (typeof value === "number") {
    pushRow(ctx, depth, React7.createElement(
      React7.Fragment,
      null,
      prefix,
      React7.createElement("span", { className: "ttl-jsonNum" }, String(value)),
      comma
    ));
    return;
  }
  if (typeof value === "boolean") {
    pushRow(ctx, depth, React7.createElement(
      React7.Fragment,
      null,
      prefix,
      React7.createElement("span", { className: "ttl-jsonBool" }, String(value)),
      comma
    ));
    return;
  }
  if (value === null) {
    pushRow(ctx, depth, React7.createElement(
      React7.Fragment,
      null,
      prefix,
      React7.createElement("span", { className: "ttl-jsonNull" }, "null"),
      comma
    ));
    return;
  }
  if (Array.isArray(value)) {
    emitContainer(ctx, value.map((entry, index) => [String(index), entry]), depth, key, path2, "[", false, comma);
    return;
  }
  if (isPlainObject(value)) {
    emitContainer(ctx, Object.entries(value), depth, key, path2, "{", true, comma);
    return;
  }
  pushRow(ctx, depth, React7.createElement(
    React7.Fragment,
    null,
    prefix,
    React7.createElement("span", { className: "ttl-jsonNull" }, String(value)),
    comma
  ));
}
function emitContainer(ctx, entries, depth, key, path2, brace, showKeys, trailingComma) {
  const close = brace === "{" ? "}" : "]";
  const prefix = key === null ? null : React7.createElement(
    React7.Fragment,
    null,
    React7.createElement("span", { className: "ttl-jsonKey" }, JSON.stringify(key)),
    ": "
  );
  pushRow(ctx, depth, React7.createElement(
    React7.Fragment,
    null,
    prefix,
    React7.createElement("span", { className: "ttl-jsonPunct" }, brace)
  ));
  entries.forEach(([entryKey, entryValue], index) => {
    emitValue(
      ctx,
      entryValue,
      depth + 1,
      showKeys ? entryKey : null,
      showKeys ? joinLabel(path2, entryKey) : `${path2}[${entryKey}]`,
      index < entries.length - 1
    );
  });
  pushRow(ctx, depth, React7.createElement(
    React7.Fragment,
    null,
    React7.createElement("span", { className: "ttl-jsonPunct" }, close),
    trailingComma
  ));
}
function JsonPretty(props) {
  const { value } = props;
  const lang = props.lang ?? detectLang();
  const [showAll, setShowAll] = React7.useState(false);
  const [viewer, setViewer] = React7.useState(null);
  const onView = React7.useCallback((label, text) => {
    setViewer({ label, text });
  }, []);
  const built = React7.useMemo(() => {
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
  return /* @__PURE__ */ React7.createElement("div", { className: "ttl-jsonPrettyWrap" }, /* @__PURE__ */ React7.createElement("div", { className: "ttl-jsonPretty", "data-testid": "ttl-json-pretty" }, built.rows), built.exhausted && !showAll ? /* @__PURE__ */ React7.createElement(
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
  ) : null, viewer !== null ? /* @__PURE__ */ React7.createElement(
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

// src/client/output-format.ts
function parseJsonValue(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 512 * 1024) return null;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const bracketed = first === "{" && last === "}" || first === "[" && last === "]";
  if (!bracketed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}
function parseJsonLines(text) {
  const lines = text.split(/\r?\n/).map((line2) => line2.trim()).filter((line2) => line2.length > 0);
  if (lines.length < 2 || lines.length > 5e3) return null;
  const values = [];
  for (const line2 of lines) {
    const first = line2[0];
    const last = line2[line2.length - 1];
    if (!(first === "{" && last === "}" || first === "[" && last === "]")) return null;
    try {
      values.push(JSON.parse(line2));
    } catch {
      return null;
    }
  }
  return values;
}
function detectOutputKind(text) {
  if (text.trim().length === 0) return "text";
  if (parseJsonValue(text) !== null) return "json";
  if (parseJsonLines(text) !== null) return "jsonl";
  if (looksLikeMarkdown(text)) return "markdown";
  return "text";
}
function prettyJsonText(text) {
  if (text.length > 48 * 1024) return null;
  const value = parseJsonValue(text);
  if (value !== null) return JSON.stringify(value, null, 2);
  const lines = parseJsonLines(text);
  if (lines !== null) return lines.map((line2) => JSON.stringify(line2, null, 2)).join("\n");
  return null;
}

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
var OUT_PREVIEW_LINES = 20;
var MAX_FILE_ROWS = 3;
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
    closeTitle: t(lang, "zoomClose"),
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
function isPlainObject2(value) {
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
function looksLikeFilePath(token) {
  if (/["'{}[\],;]/.test(token)) return false;
  if (token.includes(":") || token.includes("@") || token.includes("->")) return false;
  if (/^(?:application|text|image|audio|video|multipart|font|model)\/[\w.+-]+$/i.test(token)) return false;
  if (/\/(?:tcp|udp|sctp)$/i.test(token)) return false;
  if (token.includes("/")) {
    const firstSegment = token.split("/")[0] ?? "";
    if (/^\d+(?:\.\d+)*$/.test(firstSegment)) return false;
    return true;
  }
  if (token.includes("\\")) {
    return /^[A-Za-z]:[\\/]/.test(token) || token.startsWith("\\\\");
  }
  return FILE_EXT.test(token);
}
function fileEntryOfPath(path2, size) {
  const entry = { path: path2, name: fileBaseName(path2) };
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
  if (trimmed.startsWith("{")) return null;
  if (trimmed.startsWith("[")) {
    const parsed = parseJsonLoose(trimmed);
    if (!parsed.ok || !Array.isArray(parsed.value)) return null;
    const entries2 = [];
    for (const item of parsed.value) {
      if (typeof item === "string") {
        entries2.push(fileEntryOfPath(item, void 0));
        continue;
      }
      if (!isPlainObject2(item)) continue;
      const path2 = item.path ?? item.file ?? item.name;
      if (typeof path2 !== "string" || path2.length === 0) continue;
      const rawSize = item.size;
      const size = typeof rawSize === "string" ? rawSize : typeof rawSize === "number" && Number.isFinite(rawSize) ? formatSize(rawSize) : void 0;
      entries2.push(fileEntryOfPath(path2, size));
    }
    return entries2.length > 0 ? entries2 : null;
  }
  const lines = trimmed.split("\n").map((line2) => line2.trim()).filter((line2) => line2.length > 0);
  if (lines.length === 0) return null;
  const entries = [];
  for (const line2 of lines.slice(0, 60)) {
    const cleaned = line2.replace(/^[-*•]\s+/, "");
    let body = cleaned;
    let size;
    const sizeMatch = SIZE_TAIL.exec(cleaned);
    if (sizeMatch !== null) {
      size = `${sizeMatch[1]} ${(sizeMatch[2] ?? "B").toUpperCase()}`;
      body = cleaned.slice(0, sizeMatch.index);
    }
    const tokens = body.split(/\s+/).filter((token) => token.length > 0);
    const first = tokens[0];
    if (first !== void 0 && looksLikeFilePath(first)) {
      entries.push(fileEntryOfPath(first.replace(/[,:]$/, ""), size));
    }
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
  const [copied, setCopied] = React8.useState(false);
  return /* @__PURE__ */ React8.createElement(
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
function ParamsJsonSection(props) {
  const { value, total, lang, labels } = props;
  return /* @__PURE__ */ React8.createElement("section", { className: "ttl-section", "data-testid": "ttl-params" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.params), /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionMeta" }, labels.allItems(total))), /* @__PURE__ */ React8.createElement(JsonPretty, { value, lang }));
}
function CommandSection(props) {
  const { command, toolName, labels } = props;
  const segments = React8.useMemo(() => splitCommand(command), [command]);
  const [allSegments, setAllSegments] = React8.useState(false);
  if (segments.length === 0) return null;
  const stats = commandStats(command);
  const shown = allSegments ? segments : segments.slice(0, MAX_CODE_SEGMENTS);
  return /* @__PURE__ */ React8.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.command), /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionHint" }, labels.commandHint), /* @__PURE__ */ React8.createElement(CopyButton, { text: command, testid: "ttl-cmd-copy", label: labels.copy, className: "ttl-sectionAction" })), /* @__PURE__ */ React8.createElement("div", { className: "ttl-code", "data-testid": "ttl-code" }, shown.map((segment, index) => {
    const trailing = shown[index + 1]?.connector ?? null;
    return /* @__PURE__ */ React8.createElement("div", { className: "ttl-codeLine", key: index }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-codeGutter", "aria-hidden": "true" }, index + 1), /* @__PURE__ */ React8.createElement("span", { className: "ttl-codeText" }, segment.tokens.map((token, tokenIndex) => /* @__PURE__ */ React8.createElement(React8.Fragment, { key: tokenIndex }, tokenIndex > 0 ? " " : null, /* @__PURE__ */ React8.createElement("span", { className: `ttl-tok-${token.kind}` }, token.text))), trailing !== null ? /* @__PURE__ */ React8.createElement(React8.Fragment, null, "\xA0", /* @__PURE__ */ React8.createElement("span", { className: "ttl-tok-op ttl-tok-tail", "data-testid": "ttl-cmd-connector" }, trailing)) : null));
  }), /* @__PURE__ */ React8.createElement("div", { className: "ttl-codeFoot", "data-testid": "ttl-code-foot" }, /* @__PURE__ */ React8.createElement("span", null, `${labels.segments(stats.segments)} \xB7 ${labels.chars(stats.chars)}`), /* @__PURE__ */ React8.createElement("span", { className: "ttl-codeTool" }, toolName))), segments.length > MAX_CODE_SEGMENTS ? /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionExpand" }, /* @__PURE__ */ React8.createElement(
    "button",
    {
      type: "button",
      className: "ttl-expandBtn",
      "data-testid": "ttl-code-toggle",
      "aria-expanded": allSegments,
      onClick: () => {
        setAllSegments(!allSegments);
      }
    },
    allSegments ? labels.collapseAll : labels.showAllSegments(segments.length)
  )) : null);
}
function OutputSection(props) {
  const { text, labels, images = [], sessionId, lang, markdown = false } = props;
  const [expanded, setExpanded] = React8.useState(false);
  const lines = React8.useMemo(() => {
    const source = prettyJsonText(text) ?? text;
    const normalized = source.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
    return normalized.length === 0 ? [] : normalized.split("\n");
  }, [text]);
  if (lines.length === 0 && images.length === 0) return null;
  const shown = expanded ? lines : lines.slice(0, OUT_PREVIEW_LINES);
  const clipped = lines.length > OUT_PREVIEW_LINES || lines.some((line2) => line2.length > OUT_LINE_MAX);
  return /* @__PURE__ */ React8.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.output), /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionMeta" }, `${formatSize(utf8Bytes(text))} \xB7 ${labels.lines(lines.length)}`)), markdown && lang !== void 0 ? /* @__PURE__ */ React8.createElement(MarkdownResult, { text, labels: markdownLabels(lang) }) : /* @__PURE__ */ React8.createElement("div", { className: "ttl-outBlock", "data-testid": "ttl-outBlock" }, shown.map((line2, index) => {
    const rendered = !expanded && line2.length > OUT_LINE_MAX ? `${line2.slice(0, OUT_LINE_MAX)}\u2026` : line2;
    return /* @__PURE__ */ React8.createElement("div", { className: "ttl-outLine", key: index }, rendered.length === 0 ? "\xA0" : rendered);
  })), clipped ? /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionExpand" }, /* @__PURE__ */ React8.createElement(
    "button",
    {
      type: "button",
      className: "ttl-expandBtn",
      "data-testid": "ttl-out-toggle",
      "aria-expanded": expanded,
      onClick: () => {
        setExpanded(!expanded);
      }
    },
    expanded ? labels.collapse : labels.showFull
  )) : null, images.length > 0 && sessionId !== void 0 && lang !== void 0 ? /* @__PURE__ */ React8.createElement(TrailImages, { images, sessionId, lang }) : null);
}
function McpSection(props) {
  const { labels } = props;
  return /* @__PURE__ */ React8.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.mcpCall), /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionHint" }, labels.mcpProto)), /* @__PURE__ */ React8.createElement("div", { className: "ttl-mcpBlock", "data-testid": "ttl-mcpBlock" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-mcpBadge" }, "MCP"), /* @__PURE__ */ React8.createElement("span", { className: "ttl-mcpDot", "aria-hidden": "true" }), /* @__PURE__ */ React8.createElement("span", { className: "ttl-mcpState" }, labels.connected)));
}
function FileSection(props) {
  const { path: path2, stats, labels } = props;
  return /* @__PURE__ */ React8.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-fileBlock", "data-testid": "ttl-fileBlock" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-filePath", title: path2 }, path2), /* @__PURE__ */ React8.createElement("span", { className: "ttl-fileStats" }, stats.map((stat) => /* @__PURE__ */ React8.createElement("span", { className: "ttl-chipTag ttl-fileChip", key: stat }, stat)))));
}
function FilesSection(props) {
  const { entries, labels } = props;
  const shown = entries.slice(0, MAX_FILE_ROWS);
  const more = entries.length - shown.length;
  const total = totalSizeOf(entries);
  const meta = total === null ? labels.files(entries.length) : `${labels.files(entries.length)} \xB7 ${total}`;
  return /* @__PURE__ */ React8.createElement("section", { className: "ttl-section" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.result), /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionMeta" }, meta)), /* @__PURE__ */ React8.createElement("div", { className: "ttl-files", "data-testid": "ttl-files" }, shown.map((entry, index) => /* @__PURE__ */ React8.createElement("div", { className: "ttl-fileRow", key: `${entry.path}:${index}` }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-fileIcon", "aria-hidden": "true" }, /* @__PURE__ */ React8.createElement(ToolIcon, { kind: "file-read" })), /* @__PURE__ */ React8.createElement("span", { className: "ttl-fileName", title: entry.path }, entry.name), entry.size !== void 0 ? /* @__PURE__ */ React8.createElement("span", { className: "ttl-fileSize" }, entry.size) : null)), more > 0 ? /* @__PURE__ */ React8.createElement("div", { className: "ttl-fileMore" }, labels.moreFiles(more)) : null));
}
var TABS = [
  { value: "summary", key: "summary" },
  { value: "raw", key: "raw" }
];
function StepDetail(props) {
  const { id, step, sessionId, lang, onLoadDetail, onClose } = props;
  const labels = React8.useMemo(() => labelsFor(lang), [lang]);
  const result = step.result;
  const args = step.args ?? "";
  const [tab, setTab] = React8.useState("summary");
  const [detail, setDetail] = React8.useState(void 0);
  const [loadFailed, setLoadFailed] = React8.useState(false);
  const [retries, setRetries] = React8.useState(0);
  const truncated = step.argsTruncated === true || result?.truncated === true;
  const needsDetail = truncated;
  const retryDetail = React8.useCallback(() => {
    setRetries((current) => current >= 1 ? current : current + 1);
  }, []);
  React8.useEffect(() => {
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
  const parsed = React8.useMemo(() => parseJsonLoose(fullArgs), [fullArgs]);
  const parsedArgs = parsed.ok && isPlainObject2(parsed.value) ? parsed.value : null;
  const fullText = loaded ? detailTextOf(detail) : result?.text ?? "";
  const fullImages = loaded ? detailImagesOf(detail) : result?.images ?? [];
  const pillTruncated = loaded ? detail.truncated === true : truncated;
  const detailPhase = !needsDetail ? "ready" : loaded ? "ready" : loadFailed ? "failed" : "loading";
  const isError = loaded ? detail.isError || result?.isError === true || result?.kind === "error" || step.kind === "error" : result?.isError === true || result?.kind === "error" || step.kind === "error";
  const family = toolFamily(step.name, isError);
  const summary = React8.useMemo(
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
  const titleOf = (name) => t(lang, "detailAria")(name);
  const statusMeta = () => {
    if (tab === "raw") {
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
  const mergedNote = result !== void 0 && (result.mergedFrom ?? 0) > 1 && result.replacedBy === void 0 ? /* @__PURE__ */ React8.createElement("div", { className: "ttl-detailMerged", role: "note", "data-testid": "ttl-detail-merged" }, labels.merged(result.mergedFrom ?? 0)) : null;
  const loadBanner = () => {
    if (!needsDetail) return null;
    if (detailPhase === "ready" && !pillTruncated) return null;
    const title = result?.truncated === true ? labels.truncatedResult(`${CAP_KIB} KiB`) : labels.truncatedArgs(`${CAP_KIB} KiB`);
    const sub = detailPhase === "loading" ? labels.loadingFull : detailPhase === "failed" ? labels.loadFailed : `${labels.linesTotal(lineCount(fullText))}`;
    return /* @__PURE__ */ React8.createElement("div", { className: "ttl-bannerWarn", "data-testid": "ttl-bannerWarn", role: "note" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-bannerIcon", "aria-hidden": "true" }, "\u26A0"), /* @__PURE__ */ React8.createElement("span", { className: "ttl-bannerText" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-bannerTitle" }, title), /* @__PURE__ */ React8.createElement("span", { className: "ttl-bannerSub" }, sub)), detailPhase === "loading" ? /* @__PURE__ */ React8.createElement("span", { className: "ttl-bannerAction", "data-testid": "ttl-detail-load" }, labels.loadingFull) : detailPhase === "failed" ? /* @__PURE__ */ React8.createElement("span", { className: "ttl-bannerAction", "data-testid": "ttl-detail-load" }, /* @__PURE__ */ React8.createElement(
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
  const renderRaw = () => /* @__PURE__ */ React8.createElement(React8.Fragment, null, result?.replacedBy !== void 0 ? /* @__PURE__ */ React8.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-replaced" }, labels.replaced(result.replacedBy)) : null, step.orphan === true ? /* @__PURE__ */ React8.createElement("span", { className: "ttl-pill ttl-pillWarn", "data-testid": "ttl-detail-orphan" }, labels.orphan) : null, fullArgs.length > 0 ? /* @__PURE__ */ React8.createElement("div", { className: "ttl-rawSection" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.params)), /* @__PURE__ */ React8.createElement("pre", { className: "ttl-raw", "data-testid": "ttl-raw-args" }, fullArgs)) : null, fullText.length > 0 ? /* @__PURE__ */ React8.createElement("div", { className: "ttl-rawSection" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.result)), /* @__PURE__ */ React8.createElement("pre", { className: "ttl-raw", "data-testid": "ttl-raw-result" }, fullText)) : null);
  const renderErrorHead = () => {
    if (!isError) return null;
    const errorName = detail?.error?.name ?? result?.errorName ?? step.name;
    const errorCode = detail?.error?.code ?? result?.errorCode ?? step.errorCode;
    const errorText = fullText.length > 0 ? fullText : step.error;
    return /* @__PURE__ */ React8.createElement("div", { className: "ttl-errorBlock", "data-testid": "ttl-error-block" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-errorName", "data-testid": "ttl-error-name" }, errorCode !== void 0 ? `${errorName} \xB7 ${errorCode}` : errorName), errorText.length > 0 ? /* @__PURE__ */ React8.createElement(RawText, { text: errorText }) : null);
  };
  const renderSummaryBody = () => {
    const paramsValue = parsed.ok ? parsed.value : null;
    const paramsTotal = Array.isArray(paramsValue) ? paramsValue.length : isPlainObject2(paramsValue) ? Object.keys(paramsValue).length : 0;
    const params = () => parsed.ok ? /* @__PURE__ */ React8.createElement(ParamsJsonSection, { value: paramsValue, total: paramsTotal, lang, labels }) : fullArgs.length > 0 ? /* @__PURE__ */ React8.createElement("section", { className: "ttl-section", "data-testid": "ttl-params" }, /* @__PURE__ */ React8.createElement("div", { className: "ttl-sectionHead" }, /* @__PURE__ */ React8.createElement("span", { className: "ttl-sectionLabel" }, labels.params)), /* @__PURE__ */ React8.createElement(RawText, { text: fullArgs }), /* @__PURE__ */ React8.createElement("div", { className: "ttl-detailHint", "data-testid": "ttl-detail-unparsable" }, labels.unparsable)) : null;
    const outputText = (() => {
      if (isError && fullText.length === 0) return step.error;
      if (family === "read" || family === "edit") {
        const envelope = unwrapFileResult(fullText);
        if (envelope !== null) return envelope.body;
      }
      return fullText;
    })();
    const output = () => isError ? renderErrorHead() : /* @__PURE__ */ React8.createElement(
      OutputSection,
      {
        text: outputText,
        labels,
        images: fullImages,
        sessionId,
        lang,
        markdown: detectOutputKind(outputText) === "markdown"
      }
    );
    if (family === "shell" && commandText.length > 0) {
      return /* @__PURE__ */ React8.createElement(React8.Fragment, null, /* @__PURE__ */ React8.createElement(CommandSection, { command: commandText, toolName: summary.label, labels }), params(), output(), loadBanner());
    }
    if (isMcp) {
      const files = fileEntriesOf(fullText);
      return /* @__PURE__ */ React8.createElement(React8.Fragment, null, /* @__PURE__ */ React8.createElement(McpSection, { labels }), params(), isError || files === null ? output() : /* @__PURE__ */ React8.createElement(FilesSection, { entries: files, labels }), loadBanner());
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
      return /* @__PURE__ */ React8.createElement(React8.Fragment, null, filePath.length > 0 ? /* @__PURE__ */ React8.createElement(FileSection, { path: filePath, stats, labels }) : null, params(), output(), loadBanner());
    }
    return /* @__PURE__ */ React8.createElement(React8.Fragment, null, params(), output(), loadBanner());
  };
  const renderSummary = () => /* @__PURE__ */ React8.createElement(React8.Fragment, null, renderSummaryBody(), mergedNote);
  const duration = formatDuration(
    step.startedAt !== void 0 && step.endedAt !== void 0 ? step.endedAt - step.startedAt : void 0
  );
  const meta = statusMeta();
  const pillText = pillTruncated ? labels.truncatedPill : loaded ? labels.loadedPill : labels.fullPill;
  return /* @__PURE__ */ React8.createElement(
    "div",
    {
      className: "ttl-detail",
      id,
      role: "region",
      "aria-label": titleOf(step.name),
      "data-testid": "ttl-detail",
      "data-tab": tab
    },
    /* @__PURE__ */ React8.createElement("div", { className: "ttl-detailHead" }, /* @__PURE__ */ React8.createElement("span", { className: `ttl-detailIcon ttl-ink-${family === "error" ? "red" : inkOf(summary.icon)}`, "aria-hidden": "true" }, /* @__PURE__ */ React8.createElement(ToolIcon, { kind: summary.icon })), /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailName" }, serverName), isMcp && toolName.length > 0 ? /* @__PURE__ */ React8.createElement(React8.Fragment, null, /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailSep", "aria-hidden": "true" }, "/"), /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailTool" }, toolName)) : null, desc.length > 0 ? /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailDesc", title: desc }, desc) : null, /* @__PURE__ */ React8.createElement(
      CopyButton,
      {
        text: fullText.length > 0 ? `${fullArgs.length > 0 ? `${fullArgs}

` : ""}${fullText}` : fullArgs,
        testid: "ttl-detail-copy",
        label: labels.copyAll,
        className: "ttl-detailAction"
      }
    ), onClose !== void 0 ? /* @__PURE__ */ React8.createElement(
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
    /* @__PURE__ */ React8.createElement("div", { className: "ttl-detailStatus" }, /* @__PURE__ */ React8.createElement("span", { className: `ttl-statusDot ${isError ? "ttl-dot-red" : "ttl-dot-green"}`, "aria-hidden": "true" }), /* @__PURE__ */ React8.createElement("span", { className: "ttl-statusText" }, isError ? labels.failed : labels.ok), duration.length > 0 ? /* @__PURE__ */ React8.createElement(React8.Fragment, null, /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailDur" }, duration), /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailSep", "aria-hidden": "true" }, "\xB7")) : null, /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailSeq", "data-testid": "ttl-detail-seq" }, `seq #${step.seq}`), meta.length > 0 ? /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailMeta" }, meta) : null),
    /* @__PURE__ */ React8.createElement("div", { className: "ttl-tabs", role: "tablist" }, TABS.map((entry) => /* @__PURE__ */ React8.createElement(
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
    /* @__PURE__ */ React8.createElement("div", { className: "ttl-detailBody", "data-testid": `ttl-detail-body-${tab}` }, tab === "summary" ? renderSummary() : null, tab === "raw" ? renderRaw() : null),
    /* @__PURE__ */ React8.createElement("div", { className: "ttl-detailFoot", "data-testid": "ttl-detail-foot" }, /* @__PURE__ */ React8.createElement(
      "span",
      {
        className: `ttl-pill${pillTruncated ? " ttl-pillWarn" : " ttl-pillOk"}`,
        "data-testid": "ttl-detail-pill"
      },
      pillText
    ), /* @__PURE__ */ React8.createElement("span", { className: "ttl-detailSeq", "data-testid": "ttl-detail-foot-seq" }, `seq #${step.seq}`))
  );
}

// src/client/TrailTab.tsx
function messageIcon() {
  return React9.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
    React9.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
  );
}
function inputIcon() {
  return React9.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
    React9.createElement("circle", { cx: 12, cy: 8, r: 3.4 }),
    React9.createElement("path", { d: "M4.6 20a7.4 7.4 0 0 1 14.8 0" })
  );
}
function contextIcon() {
  return React9.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
    React9.createElement("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }),
    React9.createElement("path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" })
  );
}
var OUTPUT_PREVIEW_CHARS = 32;
function outputPreviewText(text) {
  const flat = text.replace(/```[\s\S]*?```/g, " ").replace(/\s+/g, " ").replace(/(^|\s)[#>*+-]\s+/g, "$1").replace(/(^|\s)\d+[.)]\s+/g, "$1").replace(/\*\*|__|~~|`/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
  return flat.slice(0, OUTPUT_PREVIEW_CHARS).trimEnd();
}
function groupThousands(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
var FAMILY_FILTER_PREFIX = "family:";
function familyOfFilter(filter) {
  if (!filter.startsWith(FAMILY_FILTER_PREFIX)) return null;
  return filter.slice(FAMILY_FILTER_PREFIX.length);
}
var STEP_CAP = 250;
var TITLE_CAP = 512;
var ZH_UI = {
  searchPlaceholder: "\u641C\u7D22\u6B65\u9AA4\u3001\u6587\u4EF6\u6216\u547D\u4EE4",
  searchPlaceholderShort: "\u641C\u7D22\u6B65\u9AA4\u2026",
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
  charsLeft: (n) => `\u8FD8\u6709 ${groupThousands(n)} \u5B57\u7B26`,
  shownAll: (turns, steps) => `\u5DF2\u663E\u793A\u5168\u90E8 ${turns} \u8F6E \xB7 ${steps} \u6B65`,
  shownFiltered: (turns, steps) => `\u5DF2\u7B5B\u9009 ${turns} \u8F6E \xB7 ${steps} \u6B65`,
  contextSupersedes: "\u53D6\u4EE3\u5148\u524D\u7684\u5FEB\u7167"
};
var EN_UI = {
  searchPlaceholder: "Search steps, files or commands",
  searchPlaceholderShort: "Search steps\u2026",
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
  charsLeft: (n) => `${groupThousands(n)} more chars`,
  shownAll: (turns, steps) => `Showing all ${turns} turns \xB7 ${steps} steps`,
  shownFiltered: (turns, steps) => `Filtered to ${turns} turns \xB7 ${steps} steps`,
  contextSupersedes: "Supersedes earlier snapshots"
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
function stepFailed(step) {
  return step.kind === "error" || step.result?.isError === true;
}
function stepMatchesFilter(step, filter) {
  if (filter === "all") return true;
  if (filter === "failed") return stepFailed(step);
  const family = familyOfFilter(filter);
  if (family !== null) {
    if (stepFailed(step)) return false;
    return toolFamily(step.name, false) === family;
  }
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
    case "skill":
      return "skill";
    case "figma":
      return "generic";
    case "todo":
      return "todo";
    default:
      return "generic";
  }
}
function familyInk(family) {
  return inkOf(familyIconKind(family));
}
var CLUSTER_LABEL = {
  terminal: { zh: "\u547D\u4EE4\u6267\u884C", en: "shell" },
  "terminal-session": { zh: "\u957F\u9A7B\u7EC8\u7AEF", en: "terminal session" },
  jobs: { zh: "\u540E\u53F0\u4F5C\u4E1A", en: "jobs" },
  code: { zh: "\u4EE3\u7801\u6267\u884C", en: "code" },
  "file-read": { zh: "\u8BFB\u53D6\u6587\u4EF6", en: "file read" },
  "file-write": { zh: "\u5199\u5165\u6587\u4EF6", en: "file write" },
  "file-edit": { zh: "\u7F16\u8F91\u6587\u4EF6", en: "file edit" },
  search: { zh: "\u68C0\u7D22", en: "search" },
  web: { zh: "\u8054\u7F51", en: "web" },
  todo: { zh: "\u8BA1\u5212\u6E05\u5355", en: "plan" },
  goal: { zh: "\u76EE\u6807", en: "goal" },
  schedule: { zh: "\u5B9A\u65F6\u4EFB\u52A1", en: "schedule" },
  ask: { zh: "\u8BE2\u95EE\u7528\u6237", en: "ask" },
  present: { zh: "\u4EA4\u4ED8\u7269", en: "present" },
  subagent: { zh: "\u5B50\u4EE3\u7406", en: "subagent" },
  claude: { zh: "Claude Code \u5B50\u4EE3\u7406", en: "Claude Code" },
  codex: { zh: "Codex \u5B50\u4EE3\u7406", en: "Codex" },
  team: { zh: "\u56E2\u961F\u534F\u4F5C", en: "team" },
  "team-task": { zh: "\u56E2\u961F\u4EFB\u52A1\u677F", en: "team tasks" },
  workflow: { zh: "\u5DE5\u4F5C\u6D41 / \u5FAA\u73AF", en: "workflow" },
  skill: { zh: "\u6280\u80FD", en: "skill" },
  session: { zh: "\u4F1A\u8BDD\u56DE\u6EAF", en: "session" },
  folder: { zh: "\u5DE5\u4F5C\u533A", en: "workspace" },
  plugin: { zh: "\u8FD0\u884C\u65F6\u63D2\u4EF6", en: "plugin" },
  mcp: { zh: "MCP", en: "MCP" },
  alert: { zh: "\u5931\u8D25", en: "failed" },
  generic: { zh: "\u5176\u4ED6\u5DE5\u5177", en: "other tool" }
};
function clusterLabel(kind, lang) {
  return CLUSTER_LABEL[kind][lang];
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
    case "skill":
      return "skill";
    case "figma":
      return "figma";
    case "todo":
      return "todo";
    case "error":
      return "error";
    default:
      return ui.others;
  }
}
function stepDuration(step) {
  if (step.startedAt === void 0 || step.endedAt === void 0) return "";
  const span = step.endedAt - step.startedAt;
  return span >= 0 ? formatDuration(span) : "";
}
var StepRow = React9.memo(function StepRow2(props) {
  const {
    step,
    turn,
    open,
    lang,
    sessionId,
    onJump,
    onToggleStep,
    onStepOpen,
    onStepClose,
    onLoadDetail
  } = props;
  const summary = React9.useMemo(
    () => summarizeToolCall(step.name, step.args, step.argsPreview, lang),
    [step.name, step.args, step.argsPreview, lang]
  );
  const errored = step.kind === "error" || step.result?.isError === true;
  const family = toolFamily(step.name, errored);
  const iconKind = errored ? "alert" : summary.icon;
  const ink = inkOf(iconKind);
  const desc = step.kind === "error" ? step.error : summary.detail;
  const status = errored ? "\u2717" : "\u2713";
  const duration = stepDuration(step);
  const detailId = `ttl-detail-${step.kind}-${step.seq}`;
  const title = step.kind === "error" ? step.error : step.argsPreview.length > 0 ? step.argsPreview : desc;
  const closeDetail = React9.useCallback(() => {
    onStepClose(step);
  }, [onStepClose, step]);
  return /* @__PURE__ */ React9.createElement(
    "div",
    {
      className: "ttl-stepWrap",
      "data-open": open ? "true" : void 0,
      "data-kind": errored ? "error" : step.kind,
      "data-testid": "ttl-step-wrap"
    },
    /* @__PURE__ */ React9.createElement(
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
          }
        }
      },
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepRail", "aria-hidden": "true" }),
      /* @__PURE__ */ React9.createElement("span", { className: `ttl-stepIcon ttl-ink-${ink}`, "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement(ToolIcon, { kind: iconKind })),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepName" }, summary.label),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepDesc" }, desc),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepStatus", "aria-hidden": "true" }, status),
      duration.length > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepDur" }, duration) : null
    ),
    /* @__PURE__ */ React9.createElement(
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
    open ? /* @__PURE__ */ React9.createElement(
      StepDetail,
      {
        id: detailId,
        step,
        sessionId,
        lang,
        onLoadDetail,
        onClose: closeDetail
      }
    ) : null
  );
});
var TurnRow = React9.memo(function TurnRow2(props) {
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
    onToggle,
    onShowEarlier,
    onJump,
    onToggleStep,
    onStepOpen,
    onStepClose,
    onLoadDetail
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
  const parallelGroups = React9.useMemo(
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
  const stepFailed2 = (step) => step.kind === "error" || step.result?.isError === true;
  const errorCount = React9.useMemo(() => {
    let count = 0;
    for (const item of items) {
      if (item.kind !== "tool") continue;
      if (stepFailed2(item.step)) count += 1;
    }
    return count;
  }, [items]);
  const clusterMix = React9.useMemo(() => {
    const counts = /* @__PURE__ */ new Map();
    for (const item of items) {
      if (item.kind !== "tool") continue;
      if (stepFailed2(item.step)) continue;
      const kind = toolIconKind(item.step.name);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([kind, count]) => ({ kind, count }));
  }, [items]);
  const [openOutputs, setOpenOutputs] = React9.useState(() => /* @__PURE__ */ new Set());
  const toggleOutput = React9.useCallback((key) => {
    setOpenOutputs((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const [openContexts, setOpenContexts] = React9.useState(() => /* @__PURE__ */ new Set());
  const toggleContext = React9.useCallback((key) => {
    setOpenContexts((current) => {
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
  const inputRowShown = inputItem !== void 0 && filter === "all" && !searchActive;
  const renderInputRow = (item) => {
    const text = item.text;
    const flat = outputPreviewText(text);
    const rest = text.length > OUTPUT_PREVIEW_CHARS ? text.length - OUTPUT_PREVIEW_CHARS : 0;
    return /* @__PURE__ */ React9.createElement(
      "button",
      {
        type: "button",
        className: "ttl-itemInput ttl-msgRow",
        "data-testid": "ttl-item-input",
        title: clipTitle(text),
        onClick: () => {
          onJump({ seq: item.seq, kind: "input" }, turn);
        }
      },
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepIcon ttl-inputIcon", "aria-hidden": "true" }, inputIcon()),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-msgRole" }, t(lang, "input")),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-msgPreview", "data-testid": "ttl-input-preview" }, rest > 0 ? `${flat}\u2026` : flat),
      rest > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-msgRest", "data-testid": "ttl-input-rest" }, ui.charsLeft(rest)) : null
    );
  };
  const renderStep = (step, key) => /* @__PURE__ */ React9.createElement(
    StepRow,
    {
      key,
      step,
      turn,
      open: openSeqs.has(step.seq),
      lang,
      sessionId,
      onJump,
      onToggleStep,
      onStepOpen,
      onStepClose,
      onLoadDetail
    }
  );
  const renderParallelGroup = (group) => {
    const label = t(lang, "parallelGroup")(group.steps.length);
    const hint = t(lang, "parallelGroupHint")(group.steps.length);
    return /* @__PURE__ */ React9.createElement(
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
      /* @__PURE__ */ React9.createElement("div", { className: "ttl-parallelBody" }, group.steps.map((step) => renderStep(step, `seq:${step.seq}`)))
    );
  };
  const renderContext = (item, key) => {
    const open = openContexts.has(key);
    const expandable = item.sections.length > 0 || item.text.trim().length > 0;
    const title = item.sections.length > 0 ? item.sections[0].text : item.text;
    return /* @__PURE__ */ React9.createElement(
      "div",
      {
        className: "ttl-msg ttl-ctx",
        key,
        "data-open": open ? "true" : void 0,
        "data-testid": "ttl-context-wrap",
        "data-source": item.source
      },
      /* @__PURE__ */ React9.createElement(
        "button",
        {
          type: "button",
          className: "ttl-msgRow",
          "data-testid": "ttl-item-context",
          "aria-expanded": expandable ? open : void 0,
          title: clipTitle(title),
          onClick: () => {
            if (expandable) toggleContext(key);
          }
        },
        /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepIcon ttl-ctxIcon", "aria-hidden": "true" }, contextIcon()),
        /* @__PURE__ */ React9.createElement("span", { className: "ttl-ctxName", "data-testid": "ttl-context-producer", title: item.label }, item.label),
        /* @__PURE__ */ React9.createElement("span", { className: "ttl-msgPreview", "data-testid": "ttl-context-summary" }, item.summary),
        expandable ? /* @__PURE__ */ React9.createElement(
          "span",
          {
            className: `ttl-msgChevron${open ? " ttl-msgChevronOpen" : ""}`,
            "aria-hidden": "true"
          },
          chevronIcon()
        ) : null
      ),
      open && expandable ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-msgBody ttl-ctxBody", "data-testid": "ttl-context-body" }, item.sections.length > 0 ? /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement("p", { className: "ttl-ctxNote" }, ui.contextSupersedes), /* @__PURE__ */ React9.createElement("dl", { className: "ttl-ctxSections" }, item.sections.map((section, index2) => /* @__PURE__ */ React9.createElement("div", { className: "ttl-ctxSection", key: `${section.name}:${index2}` }, /* @__PURE__ */ React9.createElement("dt", { className: "ttl-ctxSectionName" }, section.name), /* @__PURE__ */ React9.createElement("dd", { className: "ttl-ctxSectionText" }, section.text))))) : /* @__PURE__ */ React9.createElement("div", { className: "ttl-msgFull" }, item.text)) : null
    );
  };
  const renderItem = (item, key) => {
    if (item.kind === "tool") return renderStep(item.step, key);
    if (item.kind === "input") return null;
    if (item.kind === "context") return renderContext(item, key);
    if (item.kind === "output") {
      const open = openOutputs.has(key);
      const text = item.text;
      const preview2 = outputPreviewText(text);
      const expandable = text.length > OUTPUT_PREVIEW_CHARS || text.includes("\n");
      const rest = expandable ? Math.max(0, text.length - OUTPUT_PREVIEW_CHARS) : 0;
      return /* @__PURE__ */ React9.createElement(
        "div",
        {
          className: "ttl-msg",
          key,
          "data-open": open ? "true" : void 0,
          "data-testid": "ttl-output-wrap"
        },
        /* @__PURE__ */ React9.createElement(
          "button",
          {
            type: "button",
            className: "ttl-msgRow",
            "data-testid": "ttl-item-output",
            "aria-expanded": expandable ? open : void 0,
            title: clipTitle(text),
            onClick: () => {
              if (expandable) toggleOutput(key);
            }
          },
          /* @__PURE__ */ React9.createElement("span", { className: "ttl-stepIcon ttl-msgIcon", "aria-hidden": "true" }, messageIcon()),
          /* @__PURE__ */ React9.createElement("span", { className: "ttl-msgRole" }, t(lang, "output")),
          /* @__PURE__ */ React9.createElement("span", { className: "ttl-msgPreview", "data-testid": "ttl-output-preview" }, rest > 0 ? `${preview2}\u2026` : preview2),
          rest > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-msgRest", "data-testid": "ttl-output-rest" }, ui.charsLeft(rest)) : null,
          expandable ? /* @__PURE__ */ React9.createElement(
            "span",
            {
              className: `ttl-msgChevron${open ? " ttl-msgChevronOpen" : ""}`,
              "aria-hidden": "true"
            },
            chevronIcon()
          ) : null
        ),
        open && expandable ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-msgBody", "data-testid": "ttl-output-body" }, looksLikeMarkdown(text) ? /* @__PURE__ */ React9.createElement(MarkdownResult, { text, labels: markdownLabels(lang) }) : /* @__PURE__ */ React9.createElement("div", { className: "ttl-msgFull" }, text)) : null,
        /* @__PURE__ */ React9.createElement(
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
    return /* @__PURE__ */ React9.createElement(
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
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-itemDot ttl-dot-neutral", "aria-hidden": "true" }),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-itemLabel" }, t(lang, "compactionTag")),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-itemText ttl-itemText2 ttl-itemTextMuted" }, item.preview)
    );
  };
  const onCardClick = React9.useCallback((event) => {
    const target = event.target;
    if (target.closest("button, a, input, textarea, select") !== null) return;
    if ((window.getSelection()?.toString() ?? "").length > 0) return;
    onToggle(id);
  }, [id, onToggle]);
  const footParts = [ui.stepCount(turn.stepsCount)];
  if (parallelGroups.length > 0) footParts.push(ui.parallelGroups(parallelGroups.length));
  if (errorCount > 0) footParts.push(ui.failCount(errorCount));
  if (duration.length > 0) footParts.push(duration);
  return /* @__PURE__ */ React9.createElement(
    "section",
    {
      className: "ttl-turn",
      "data-testid": "ttl-turn",
      "data-collapsed": expanded ? "false" : "true",
      onClick: expanded ? void 0 : onCardClick,
      "data-active": active ? "true" : void 0,
      "data-error": hasError ? "true" : void 0
    },
    /* @__PURE__ */ React9.createElement("div", { className: "ttl-turnHead" }, /* @__PURE__ */ React9.createElement(
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
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnTag", "data-testid": "ttl-turn-tag" }, turnTag),
      clock.length > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnTime" }, clock) : null,
      duration.length > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnDur" }, duration) : null,
      clusterMix.length > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-mix", "aria-hidden": "true" }, clusterMix.map((entry) => /* @__PURE__ */ React9.createElement(
        "i",
        {
          key: entry.kind,
          className: `ttl-mixItem ttl-ink-${inkOf(entry.kind)}`,
          "data-cluster": entry.kind,
          title: `${clusterLabel(entry.kind, lang)} ${entry.count}`
        },
        /* @__PURE__ */ React9.createElement(ToolIcon, { kind: entry.kind }),
        /* @__PURE__ */ React9.createElement(MixCount, { count: entry.count })
      ))) : null,
      errorCount > 0 ? /* @__PURE__ */ React9.createElement(
        "span",
        {
          className: "ttl-badge ttl-badgeErr",
          "data-testid": "ttl-error-dot",
          title: t(lang, "error")
        },
        /* @__PURE__ */ React9.createElement(ToolIcon, { kind: "alert" }),
        /* @__PURE__ */ React9.createElement("span", { className: "ttl-badgeCount", "data-testid": "ttl-error-count" }, errorCount)
      ) : null,
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnHeadSpacer" }),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-turnMeta" }, parallelGroups.length > 0 ? /* @__PURE__ */ React9.createElement(
        "span",
        {
          className: "ttl-badge ttl-badgeParallel",
          "data-testid": "ttl-turn-parallel",
          title: parallelBadgeTitle,
          "aria-label": parallelBadgeTitle
        },
        `\u2225${parallelGroups.length}`
      ) : null, /* @__PURE__ */ React9.createElement(
        "span",
        {
          className: "ttl-stepsNum",
          "data-testid": "ttl-steps-count",
          title: t(lang, "stepsLabel")
        },
        ui.stepCount(turn.stepsCount)
      ), /* @__PURE__ */ React9.createElement("span", { className: `ttl-chevron${expanded ? " ttl-chevronOpen" : ""}`, "aria-hidden": "true" }, chevronIcon()))
    ), /* @__PURE__ */ React9.createElement(
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
    preview.length > 0 && (!expanded || !inputRowShown) ? /* @__PURE__ */ React9.createElement(
      "p",
      {
        className: "ttl-turnPreview",
        "data-testid": "ttl-turn-preview",
        title: clipTitle(preview)
      },
      preview
    ) : null,
    expanded ? (() => {
      const truncated = items.length > STEP_CAP && !showFull;
      const shownItems = truncated ? items.slice(items.length - STEP_CAP) : items;
      const hiddenCount = items.length - shownItems.length;
      const shownEntries = groupParallelItems(shownItems);
      const showInput = inputRowShown;
      const emptyBody = items.length === 0 && (filter !== "all" || searchActive);
      return /* @__PURE__ */ React9.createElement("div", { className: "ttl-turnBody" }, showInput ? renderInputRow(inputItem) : null, hiddenCount > 0 ? /* @__PURE__ */ React9.createElement(
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
      ) : null, emptyBody ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-emptyInline", "data-testid": "ttl-empty-inline" }, t(lang, "emptyFiltered")) : shownEntries.map((entry) => entry.kind === "group" ? renderParallelGroup(entry.group) : renderItem(entry.item, keyOfItem(entry.item))), /* @__PURE__ */ React9.createElement("div", { className: "ttl-turnFoot", "data-testid": "ttl-turn-foot" }, footParts.join(" \xB7 ")));
    })() : null
  );
});
function TrailTab(props) {
  const lang = detectLang();
  const ui = uiStrings(lang);
  const sessionId = props.scope?.sessionId ?? "";
  const visible = props.visible === true;
  const sessionsService = React9.useMemo(() => sessionsOf(props.ctx), [props.ctx]);
  const fetchEvents = React9.useMemo(
    () => props.fetchEventsOverride !== void 0 ? props.fetchEventsOverride : (sid, afterSeq) => fetchTrailEvents(sid, afterSeq),
    [props.fetchEventsOverride]
  );
  const { turns, stats, status, error, refresh } = useTrail(sessionId, visible, fetchEvents, sessionsService);
  const [filter, setFilter] = React9.useState("all");
  const [query, setQuery] = React9.useState("");
  const [expandedTurns, setExpandedTurns] = React9.useState(null);
  const [jumping, setJumping] = React9.useState(null);
  const [jumpPages, setJumpPages] = React9.useState(0);
  const [jumpMessage, setJumpMessage] = React9.useState(null);
  const [activeTurnId, setActiveTurnId] = React9.useState(null);
  const [followLatest, setFollowLatest] = React9.useState(true);
  const [followPaused, setFollowPaused] = React9.useState(false);
  const [showFullTurn, setShowFullTurn] = React9.useState(/* @__PURE__ */ new Set());
  const [openSeqs, setOpenSeqs] = React9.useState(() => /* @__PURE__ */ new Set());
  const listRef = React9.useRef(null);
  const pendingScrollRef = React9.useRef(null);
  const holdExtraRef = React9.useRef(0);
  const basePadRef = React9.useRef("");
  const searchRef = React9.useRef(null);
  const jumpingRef = React9.useRef(false);
  const isToolFilter = filter !== "all" && filter !== "failed";
  const searchActive = query.trim().length > 0;
  const visibleTurns = React9.useMemo(() => {
    if (filter === "all" && !searchActive) return turns;
    if (filter === "failed" && !searchActive) return turns;
    return turns.filter((turn) => stepsOf(turn).some((step) => stepMatches(step, filter, query)));
  }, [turns, filter, query, searchActive]);
  const shownStepCount = React9.useMemo(() => {
    if (filter === "all" && !searchActive) return stats.total;
    let count = 0;
    for (const turn of visibleTurns) {
      for (const step of stepsOf(turn)) if (stepMatches(step, filter, query)) count += 1;
    }
    return count;
  }, [visibleTurns, filter, query, searchActive, stats.total]);
  const latestSeq = React9.useMemo(() => {
    let max = 0;
    for (const turn of turns) {
      for (const item of turn.items) {
        const seq = item.kind === "tool" ? item.step.seq : item.seq;
        if (seq > max) max = seq;
      }
    }
    return max;
  }, [turns]);
  const overview = React9.useMemo(() => {
    const counts = /* @__PURE__ */ new Map();
    for (const tool of stats.tools) {
      const family = toolFamily(tool.name, false);
      counts.set(family, (counts.get(family) ?? 0) + tool.count);
    }
    const order = ["shell", "read", "edit", "mcp", "figma", "skill", "todo", "generic"];
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
  const releaseScrollHold = React9.useCallback(() => {
    const el = listRef.current;
    if (el === null) return;
    if (holdExtraRef.current > 0) {
      el.style.paddingBottom = basePadRef.current;
      holdExtraRef.current = 0;
    }
  }, []);
  const captureScrollAnchor = React9.useCallback(() => {
    const el = listRef.current;
    pendingScrollRef.current = el === null ? null : el.scrollTop;
  }, []);
  React9.useLayoutEffect(() => {
    const desired = pendingScrollRef.current;
    if (desired === null) return;
    pendingScrollRef.current = null;
    const el = listRef.current;
    if (el === null) return;
    const naturalMax = el.scrollHeight - el.clientHeight - holdExtraRef.current;
    const need = desired - naturalMax;
    if (need > 0.5) {
      if (basePadRef.current === "" && holdExtraRef.current === 0) {
        const computed = Number.parseFloat(window.getComputedStyle(el).paddingBottom);
        basePadRef.current = Number.isFinite(computed) && computed > 0 ? `${computed}px` : "";
      }
      holdExtraRef.current = need;
      const base = Number.parseFloat(basePadRef.current);
      const basePx = Number.isFinite(base) ? base : 0;
      el.style.paddingBottom = `${basePx + need}px`;
      el.scrollTop = desired;
    } else {
      releaseScrollHold();
    }
  });
  const onScroll = React9.useCallback(() => {
    const el = listRef.current;
    if (el === null) return;
    if (holdExtraRef.current > 0) {
      const naturalMax = el.scrollHeight - el.clientHeight - holdExtraRef.current;
      if (el.scrollTop <= naturalMax + 0.5) releaseScrollHold();
    }
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    setFollowPaused(!nearBottom);
  }, [releaseScrollHold]);
  React9.useEffect(() => {
    if (!followLatest || followPaused) return void 0;
    const el = listRef.current;
    if (el === null) return void 0;
    releaseScrollHold();
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
  }, [turns, followLatest, followPaused, releaseScrollHold]);
  const scrollToBottom = React9.useCallback(() => {
    const el = listRef.current;
    if (el === null) return;
    el.scrollTop = el.scrollHeight;
    setFollowPaused(false);
  }, []);
  React9.useEffect(() => {
    if (!visible) return void 0;
    const onKeyDown = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "f") return;
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
  const latestIdRef = React9.useRef("");
  React9.useEffect(() => {
    latestIdRef.current = turns.length > 0 ? turnByIdentity(turns[turns.length - 1]) : "";
  }, [turns]);
  React9.useEffect(() => {
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
  React9.useEffect(() => {
    releaseScrollHold();
  }, [filter, query, releaseScrollHold]);
  const prevSearchRef = React9.useRef(false);
  React9.useEffect(() => {
    if (prevSearchRef.current && !searchActive) setExpandedTurns(null);
    prevSearchRef.current = searchActive;
  }, [searchActive]);
  const isTurnExpanded = React9.useCallback((id, index) => {
    if (expandedTurns === null) return index === turns.length - 1;
    return expandedTurns.has(id);
  }, [expandedTurns, turns.length]);
  const toggleTurn = React9.useCallback((id) => {
    captureScrollAnchor();
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
  const toggleShowFull = React9.useCallback((id) => {
    captureScrollAnchor();
    setShowFullTurn((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleStep = React9.useCallback((step, multi) => {
    captureScrollAnchor();
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
  }, []);
  const openStep = React9.useCallback((step, multi = false) => {
    captureScrollAnchor();
    setOpenSeqs((current) => {
      if (current.has(step.seq) && (multi || current.size === 1)) return current;
      const next = new Set(current);
      if (!multi) next.clear();
      next.add(step.seq);
      return next;
    });
  }, []);
  const closeStep = React9.useCallback((step) => {
    captureScrollAnchor();
    setOpenSeqs((current) => {
      if (!current.has(step.seq)) return current;
      const next = new Set(current);
      next.delete(step.seq);
      return next;
    });
  }, []);
  const fetcherRef = React9.useRef(props.fetchToolDetailOverride ?? fetchToolDetail);
  fetcherRef.current = props.fetchToolDetailOverride ?? fetchToolDetail;
  const detailInflight = React9.useRef(/* @__PURE__ */ new Map());
  const loadDetail = React9.useCallback((seq) => {
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
  React9.useEffect(() => {
    setOpenSeqs(/* @__PURE__ */ new Set());
    setQuery("");
    setExpandedTurns(null);
  }, [sessionId]);
  React9.useEffect(() => {
    if (visible) return;
    setOpenSeqs(/* @__PURE__ */ new Set());
  }, [visible]);
  const sessionForJump = React9.useMemo(() => {
    if (sessionsService === void 0) return null;
    const binding = sessionsService.binding(sessionId);
    const session = binding !== void 0 && binding.session !== void 0 ? binding.session : void 0;
    if (session === void 0) return null;
    const face = session;
    if (typeof face.loadOlder !== "function" || typeof face.getSnapshot !== "function") return null;
    return session;
  }, [sessionsService, sessionId]);
  const conversationForJump = React9.useMemo(
    () => conversationOf(props.ctx, sessionId),
    [props.ctx, sessionId]
  );
  const doJump = React9.useCallback(async (target, turn) => {
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
  React9.useEffect(() => {
    if (jumpMessage === null) return void 0;
    const timer = window.setTimeout(() => {
      setJumpMessage(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [jumpMessage]);
  React9.useEffect(() => {
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
  const clearFilters = React9.useCallback(() => {
    setFilter("all");
    setQuery("");
  }, []);
  const stepNameWidth = React9.useMemo(() => {
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
  if (!visible) return null;
  const chipButton = (value, label, count, dot) => /* @__PURE__ */ React9.createElement(
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
    dot !== void 0 ? /* @__PURE__ */ React9.createElement("span", { className: `ttl-chipDot ttl-dot-${dot}`, "aria-hidden": "true" }) : null,
    /* @__PURE__ */ React9.createElement("span", { className: "ttl-chipLabel" }, label),
    count > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-chipCount" }, String(count)) : null
  );
  const header = /* @__PURE__ */ React9.createElement("header", { className: "ttl-header" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-brandIcon", "aria-hidden": "true" }, brandIcon()), /* @__PURE__ */ React9.createElement("h2", { className: "ttl-title" }, t(lang, "tabTitle")), /* @__PURE__ */ React9.createElement("span", { className: "ttl-count", "data-testid": "ttl-count" }, `${t(lang, "turnsCount")(turns.length)} \xB7 ${ui.stepCount(stats.total)}`), /* @__PURE__ */ React9.createElement("span", { className: "ttl-headerSpacer" }), /* @__PURE__ */ React9.createElement(
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
    /* @__PURE__ */ React9.createElement("span", { className: "ttl-followDot", "aria-hidden": "true" }),
    t(lang, followLatest ? "followLatest" : "followPaused")
  ), turns.length > 0 ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-search", title: `${ui.searchPlaceholder} (\u2318F)` }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-searchIcon", "aria-hidden": "true" }, searchIcon()), /* @__PURE__ */ React9.createElement(
    "input",
    {
      ref: searchRef,
      type: "search",
      className: "ttl-searchInput",
      "data-testid": "ttl-search",
      value: query,
      placeholder: ui.searchPlaceholderShort,
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
  ), query.length > 0 ? /* @__PURE__ */ React9.createElement(
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
  ) : null) : null);
  const familySlug = (family) => {
    if (family === "shell") return "bash";
    if (family === "generic") return "other";
    return family;
  };
  const familyChip = (family, count) => {
    const value = `${FAMILY_FILTER_PREFIX}${family}`;
    const selected = filter === value;
    return /* @__PURE__ */ React9.createElement(
      "button",
      {
        key: family,
        type: "button",
        className: `ttl-chip ttl-familyChip${selected ? " ttl-chipSelected" : ""}`,
        "aria-pressed": selected,
        "data-testid": `ttl-chip-${familySlug(family)}`,
        onClick: () => {
          setFilter((current) => current === value ? "all" : value);
        }
      },
      /* @__PURE__ */ React9.createElement(
        "i",
        {
          className: `ttl-legendDot ttl-dist-${family} ttl-ink-${familyInk(family)}`,
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-chipLabel" }, familyLabel(family, ui)),
      /* @__PURE__ */ React9.createElement("span", { className: "ttl-chipCount" }, String(count))
    );
  };
  const summaryBar = turns.length > 0 ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-summary" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-summaryTop" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-summaryStat" }, `${ui.stepCount(stats.total)} \xB7 ${t(lang, "turnsCount")(turns.length)}`), /* @__PURE__ */ React9.createElement("span", { className: "ttl-summarySpacer" }), stats.failed > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-summaryFail" }, ui.failCount(stats.failed)) : null, overview.durationMs !== void 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-summaryDur", title: ui.totalDuration }, formatDuration(overview.durationMs)) : null), overview.families.length > 0 ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-dist", role: "img", "aria-label": ui.toolDist }, overview.families.map((entry) => /* @__PURE__ */ React9.createElement(
    "i",
    {
      key: entry.family,
      className: `ttl-distSeg ttl-dist-${entry.family} ttl-ink-${familyInk(entry.family)}`,
      style: { width: `${entry.count / overview.total * 100}%` }
    }
  ))) : null, /* @__PURE__ */ React9.createElement("div", { className: "ttl-summaryFilters", role: "group", "data-testid": "ttl-chips" }, chipButton("all", t(lang, "filterAll"), stats.total), stats.failed > 0 ? chipButton("failed", t(lang, "filterFailed"), stats.failed, "red") : null, overview.families.map((entry) => familyChip(entry.family, entry.count)))) : null;
  let body;
  if (turns.length === 0 && status === "loading") {
    body = /* @__PURE__ */ React9.createElement("div", { className: "ttl-skeleton", "data-testid": "ttl-status", role: "status", "aria-live": "polite" }, [0, 1, 2].map((index) => /* @__PURE__ */ React9.createElement("div", { className: "ttl-skeletonRow", key: index }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-skeletonDot", "aria-hidden": "true" }), /* @__PURE__ */ React9.createElement(
      "span",
      {
        className: "ttl-skeletonBar",
        style: { width: index === 0 ? "56%" : index === 1 ? "72%" : "63%" },
        "aria-hidden": "true"
      }
    ), /* @__PURE__ */ React9.createElement("span", { className: "ttl-skeletonBud", "aria-hidden": "true" }))), /* @__PURE__ */ React9.createElement("div", { className: "ttl-skeletonFoot" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-spin" }, spinnerIcon()), ui.reading));
  } else if (turns.length === 0 && status === "error") {
    const message = error ?? t(lang, "loadFailed");
    body = /* @__PURE__ */ React9.createElement("div", { className: "ttl-errorCard", "data-testid": "ttl-error", role: "alert" }, /* @__PURE__ */ React9.createElement("div", { className: "ttl-errorHead" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-errorIcon", "aria-hidden": "true" }, warningIcon()), /* @__PURE__ */ React9.createElement("span", { className: "ttl-errorTitle" }, ui.errorTitle)), /* @__PURE__ */ React9.createElement("p", { className: "ttl-errorCode" }, message), /* @__PURE__ */ React9.createElement("div", { className: "ttl-errorActions" }, /* @__PURE__ */ React9.createElement("button", { type: "button", className: "ttl-chip ttl-errorRetry", "data-testid": "ttl-retry", onClick: refresh }, t(lang, "retry")), /* @__PURE__ */ React9.createElement(
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
    )), /* @__PURE__ */ React9.createElement("p", { className: "ttl-errorNote" }, ui.errorNote));
  } else if (turns.length === 0) {
    body = /* @__PURE__ */ React9.createElement("div", { className: "ttl-empty", "data-testid": "ttl-empty", role: "status" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-emptyIcon", "aria-hidden": "true" }, brandIcon(26)), /* @__PURE__ */ React9.createElement("p", { className: "ttl-emptyTitle" }, ui.emptyTitle), /* @__PURE__ */ React9.createElement("p", { className: "ttl-emptyDesc" }, ui.emptyDesc), /* @__PURE__ */ React9.createElement("button", { type: "button", className: "ttl-chip ttl-emptyAction", "data-testid": "ttl-refresh", onClick: refresh }, ui.refresh));
  } else if (visibleTurns.length === 0) {
    body = /* @__PURE__ */ React9.createElement("div", { className: "ttl-emptyFiltered ttl-empty-filtered", "data-testid": "ttl-empty-filtered", role: "status" }, /* @__PURE__ */ React9.createElement("p", { className: "ttl-emptyFilteredText" }, t(lang, "emptyFiltered")), /* @__PURE__ */ React9.createElement("button", { type: "button", className: "ttl-chip", "data-testid": "ttl-clear-filter", onClick: clearFilters }, t(lang, "clearFilter")));
  } else {
    body = /* @__PURE__ */ React9.createElement("div", { className: "ttl-list", ref: listRef, onScroll, "data-testid": "ttl-list" }, visibleTurns.map((turn, index) => /* @__PURE__ */ React9.createElement(
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
        onToggle: toggleTurn,
        onShowEarlier: toggleShowFull,
        onJump: doJump,
        onToggleStep: toggleStep,
        onStepOpen: openStep,
        onStepClose: closeStep,
        onLoadDetail: loadDetail
      }
    )), /* @__PURE__ */ React9.createElement("div", { className: "ttl-listFoot", "data-testid": "ttl-list-foot" }, filter === "all" && !searchActive ? ui.shownAll(turns.length, stats.total) : ui.shownFiltered(visibleTurns.length, shownStepCount)));
  }
  const showStatusBar = turns.length > 0 || jumping !== null;
  const syncText = status === "loading" ? ui.syncing : error !== null ? ui.syncFailed : ui.synced;
  const statusBar = showStatusBar ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-statusbar", "data-testid": "ttl-statusbar" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-statusDot", "aria-hidden": "true" }), /* @__PURE__ */ React9.createElement("span", { className: "ttl-statusText" }, syncText), jumping !== null ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-statusMsg" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-spin" }, spinnerIcon()), t(lang, "jumpProgress")(jumpPages)) : jumpMessage !== null ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-statusMsg" }, jumpMessage) : null, /* @__PURE__ */ React9.createElement("span", { className: "ttl-statusSpacer" }), followPaused && turns.length > 0 ? /* @__PURE__ */ React9.createElement(
    "button",
    {
      type: "button",
      className: "ttl-toBottom ttl-toBottomInline",
      "data-testid": "ttl-to-bottom",
      onClick: scrollToBottom
    },
    t(lang, "newUpdates")
  ) : null, latestSeq > 0 ? /* @__PURE__ */ React9.createElement("span", { className: "ttl-statusSeq", "data-testid": "ttl-status-seq" }, `seq #${latestSeq}`) : null) : null;
  return /* @__PURE__ */ React9.createElement(
    "div",
    {
      className: "ttl-root",
      role: "complementary",
      "aria-label": t(lang, "tabTitle"),
      "data-testid": "ttl-root",
      style: { ["--ttl-step-name-w"]: `${stepNameWidth}px` }
    },
    header,
    summaryBar,
    body,
    statusBar,
    jumping !== null ? /* @__PURE__ */ React9.createElement("div", { className: "ttl-jumpBanner", "data-testid": "ttl-jump-banner", role: "status" }, /* @__PURE__ */ React9.createElement("span", { className: "ttl-spin" }, spinnerIcon()), t(lang, "jumpProgress")(jumpPages)) : null
  );
}
var MixCount = React9.memo(function MixCount2({ count }) {
  const digits = String(count);
  const width = digits.length * 5.7 + 0.2;
  return /* @__PURE__ */ React9.createElement("span", { className: "ttl-mixCount" }, /* @__PURE__ */ React9.createElement("svg", { width, height: 13, viewBox: `0 0 ${width} 13`, "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React9.createElement(
    "text",
    {
      x: "0",
      y: "10",
      textLength: digits.length * 5.7 - 0.6,
      lengthAdjust: "spacingAndGlyphs",
      fill: "currentColor"
    },
    digits
  )));
});
function chevronIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement("path", { d: "M6 4l4 4-4 4", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function spinnerIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement("path", { d: "M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }));
}
function arrowIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement("path", { d: "M5 11l6-6M6 5h5v5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function brandIcon(size = 15) {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement("circle", { cx: "6", cy: "19", r: "3" }), /* @__PURE__ */ React9.createElement("path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }), /* @__PURE__ */ React9.createElement("circle", { cx: "18", cy: "5", r: "3" }));
}
function searchIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 16 16", width: "13", height: "13", "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement("circle", { cx: "7", cy: "7", r: "4.5", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), /* @__PURE__ */ React9.createElement("path", { d: "M10.5 10.5L14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }));
}
function warningIcon() {
  return /* @__PURE__ */ React9.createElement("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": "true" }, /* @__PURE__ */ React9.createElement(
    "path",
    {
      d: "M8 2.5l6 10.5H2z",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.4",
      strokeLinejoin: "round"
    }
  ), /* @__PURE__ */ React9.createElement("path", { d: "M8 6v4M8 11.6v.1", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }));
}

// src/client/auto-open.ts
var AUTO_OPEN_SETTING_KEY = "autoOpenFirstTurn";
var AUTO_OPEN_MIN_WIDTH = 768;
var AUTO_OPEN_TAB_ID = "trace-inspect";
var FIRST_TURN_EVENT_TYPES = /* @__PURE__ */ new Set(["user/message", "turn/start"]);
function hasFirstTurnEvidence(events) {
  if (!Array.isArray(events)) return false;
  return events.some((event) => {
    if (event === null || typeof event !== "object") return false;
    const type = event.type;
    return typeof type === "string" && FIRST_TURN_EVENT_TYPES.has(type);
  });
}
var TAB_READY_RETRIES = 5;
var TAB_READY_RETRY_MS = 400;
var CONFIRM_DEBOUNCE_MS = 120;
async function fetchEventsDefault(sessionId, afterSeq) {
  const url = new URL("/trace-inspect/api/events", window.location.origin);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sessionId, afterSeq })
  });
  const data = await response.json();
  if (!response.ok || data === null || typeof data !== "object" || !Array.isArray(data.events)) {
    throw new Error(`HTTP ${response.status}`);
  }
  return { events: data.events };
}
function serviceOf(ctx, name) {
  try {
    const value = ctx.get(name);
    return value !== null && typeof value === "object" ? value : void 0;
  } catch {
    return void 0;
  }
}
function installFirstTurnAutoOpen(ctx, deps = {}) {
  const sidebar = serviceOf(ctx, "betterSidebar");
  if (sidebar === void 0 || typeof sidebar.openTab !== "function") return () => {
  };
  const sessions = serviceOf(ctx, "sessions");
  const right = serviceOf(ctx, "sidebarRight");
  const tabRegistry = serviceOf(ctx, "sidebarRightTabs");
  const fetchEvents = deps.fetchEvents ?? fetchEventsDefault;
  const viewportWidth = deps.viewportWidth ?? (() => typeof window === "undefined" ? Number.POSITIVE_INFINITY : window.innerWidth);
  const setTimer = deps.setTimeout ?? ((fn, ms) => window.setTimeout(fn, ms));
  const clearTimer = deps.clearTimeout ?? ((handle) => window.clearTimeout(handle));
  let disposed = false;
  let watched;
  let phase = "idle";
  let release;
  let retryTimer;
  let retriesLeft = 0;
  let confirmTimer;
  let probing = false;
  const fired = /* @__PURE__ */ new Set();
  const skipped = /* @__PURE__ */ new Set();
  const readPrefs = () => {
    try {
      return sidebar.getSnapshot?.()?.prefs;
    } catch {
      return void 0;
    }
  };
  const settingEnabled = () => {
    const blob = readPrefs()?.pluginSettings?.[AUTO_OPEN_TAB_ID];
    return blob?.[AUTO_OPEN_SETTING_KEY] !== false;
  };
  const tabEnabled = () => {
    try {
      if (sidebar.isTabEnabled !== void 0) return sidebar.isTabEnabled(AUTO_OPEN_TAB_ID) !== false;
      return readPrefs()?.tabsEnabled?.[AUTO_OPEN_TAB_ID] !== false;
    } catch {
      return true;
    }
  };
  const tabReady = () => {
    if (tabRegistry === void 0 || typeof tabRegistry.get !== "function") return true;
    try {
      return tabRegistry.get(AUTO_OPEN_TAB_ID) !== void 0;
    } catch {
      return false;
    }
  };
  const onScreenSession = () => {
    const mountedFace = right?.mounted;
    if (mountedFace !== void 0 && typeof mountedFace.getSnapshot === "function") {
      try {
        const mounted2 = mountedFace.getSnapshot();
        return typeof mounted2 === "string" && mounted2.length > 0 ? mounted2 : void 0;
      } catch {
        return void 0;
      }
    }
    try {
      const id = sidebar.getSnapshot?.()?.sessionId;
      return typeof id === "string" && id.length > 0 ? id : void 0;
    } catch {
      return void 0;
    }
  };
  const rowOf = (sessionId) => {
    try {
      const list = sessions?.list;
      if (list === void 0) return void 0;
      const row = list.getSnapshot()?.byId?.[sessionId];
      return row !== null && typeof row === "object" ? row : void 0;
    } catch {
      return void 0;
    }
  };
  const detach = () => {
    if (release !== void 0) {
      try {
        release();
      } catch {
      }
      release = void 0;
    }
    if (confirmTimer !== void 0) {
      clearTimer(confirmTimer);
      confirmTimer = void 0;
    }
  };
  const clearRetry = () => {
    if (retryTimer !== void 0) {
      clearTimer(retryTimer);
      retryTimer = void 0;
    }
  };
  const open = (sessionId) => {
    if (disposed || phase === "fired" || fired.has(sessionId) || retryTimer !== void 0) return;
    if (!settingEnabled() || !tabEnabled() || viewportWidth() < AUTO_OPEN_MIN_WIDTH) {
      phase = "fired";
      detach();
      return;
    }
    if (!tabReady()) {
      if (retriesLeft > 0) {
        retriesLeft -= 1;
        retryTimer = setTimer(() => {
          retryTimer = void 0;
          if (disposed || phase !== "armed") return;
          open(sessionId);
        }, TAB_READY_RETRY_MS);
        return;
      }
      phase = "fired";
      detach();
      return;
    }
    fired.add(sessionId);
    detach();
    try {
      sidebar.openTab?.({ type: AUTO_OPEN_TAB_ID }, { sessionId });
    } catch {
    }
    try {
      if (right !== void 0 && right.isExpanded?.() === false) right.toggleExpanded?.();
    } catch {
    }
  };
  const confirm = (sessionId) => {
    if (disposed || phase !== "armed" || watched !== sessionId) return;
    void fetchEvents(sessionId, 0).then((result) => {
      if (disposed || phase !== "armed" || watched !== sessionId) return;
      if (hasFirstTurnEvidence(result.events)) open(sessionId);
    }).catch(() => {
    });
  };
  const scheduleConfirm = (sessionId) => {
    if (confirmTimer !== void 0) return;
    confirmTimer = setTimer(() => {
      confirmTimer = void 0;
      confirm(sessionId);
    }, CONFIRM_DEBOUNCE_MS);
  };
  const arm = (sessionId) => {
    phase = "armed";
    retriesLeft = TAB_READY_RETRIES;
    const disposers2 = [];
    const binding = sessions?.binding?.(sessionId);
    for (const feed of [binding?.session, binding?.eventSource]) {
      if (feed === void 0 || typeof feed.subscribe !== "function") continue;
      try {
        disposers2.push(feed.subscribe(() => {
          scheduleConfirm(sessionId);
        }));
      } catch {
      }
    }
    if (sessions?.list !== void 0) {
      try {
        disposers2.push(sessions.list.subscribe(() => {
          const row = rowOf(sessionId);
          if (row !== void 0 && row.running === true) scheduleConfirm(sessionId);
          else if (row !== void 0 && row.blank === false) scheduleConfirm(sessionId);
        }));
      } catch {
      }
    }
    release = () => {
      for (const dispose of disposers2) {
        try {
          dispose();
        } catch {
        }
      }
    };
  };
  const resolvePending = (sessionId) => {
    phase = "pending";
    if (probing) return;
    probing = true;
    void fetchEvents(sessionId, 0).then((result) => {
      probing = false;
      if (disposed || watched !== sessionId || phase !== "pending") return;
      if (hasFirstTurnEvidence(result.events)) {
        skipped.add(sessionId);
        phase = "skipped";
        return;
      }
      arm(sessionId);
    }).catch(() => {
      probing = false;
    });
  };
  const watch = (sessionId) => {
    if (sessionId === watched) {
      if (sessionId !== void 0 && phase === "pending") resolvePending(sessionId);
      return;
    }
    detach();
    watched = sessionId;
    phase = "idle";
    if (sessionId === void 0) return;
    if (fired.has(sessionId) || skipped.has(sessionId)) {
      phase = fired.has(sessionId) ? "fired" : "skipped";
      return;
    }
    const row = rowOf(sessionId);
    if (row !== void 0) {
      if (row.blank === false) {
        skipped.add(sessionId);
        phase = "skipped";
        return;
      }
      if (row.blank === true) {
        arm(sessionId);
        return;
      }
    }
    resolvePending(sessionId);
  };
  const disposers = [];
  const mounted = right?.mounted;
  if (mounted !== void 0 && typeof mounted.subscribe === "function") {
    try {
      disposers.push(mounted.subscribe(() => {
        watch(onScreenSession());
      }));
    } catch {
    }
  }
  if (typeof sidebar.subscribeState === "function") {
    try {
      disposers.push(sidebar.subscribeState(() => {
        const current = onScreenSession();
        if (current !== watched) {
          watch(current);
          return;
        }
        if (phase === "pending") watch(current);
        else if (phase === "armed" && current !== void 0) {
          const row = rowOf(current);
          if (row !== void 0 && (row.running === true || row.blank === false)) scheduleConfirm(current);
        }
      }));
    } catch {
    }
  }
  if (sessions?.list !== void 0 && typeof sessions.list.subscribe === "function") {
    try {
      disposers.push(sessions.list.subscribe(() => {
        if (phase === "pending" && watched !== void 0) watch(watched);
      }));
    } catch {
    }
  }
  retriesLeft = TAB_READY_RETRIES;
  watch(onScreenSession());
  return () => {
    disposed = true;
    detach();
    clearRetry();
    for (const dispose of disposers) {
      try {
        dispose();
      } catch {
      }
    }
  };
}

// src/client/index.tsx
function routeIcon(size) {
  const children = [
    React10.createElement("circle", { key: "a", cx: 6, cy: 19, r: 3 }),
    React10.createElement("path", { key: "p", d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }),
    React10.createElement("circle", { key: "b", cx: 18, cy: 5, r: 3 })
  ];
  return React10.createElement(
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
function FirstTurnAutoOpenDefault(props) {
  const { pluginSettings, updatePluginSetting } = props;
  React10.useEffect(() => {
    if (pluginSettings[AUTO_OPEN_SETTING_KEY] === void 0) {
      updatePluginSetting(AUTO_OPEN_SETTING_KEY, true);
    }
  }, [pluginSettings, updatePluginSetting]);
  return null;
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
    icon: (size) => routeIcon(size),
    order: 46,
    single: true,
    // v0.10.39: the first-turn auto-open switch lives in the side-card settings
    // page under this tab's own row. It is a PLUGIN-OWNED toggle
    // (`pluginToggles` → prefs `pluginSettings['trace-inspect']`), not a host
    // `toggles` row: host rows must name a field of better-sidebar's own
    // PrefsSchema, and unknown keys are dropped there. `auto-open.ts` reads the
    // same blob at plugin level (documented default: on).
    settings: {
      pluginToggles: [
        {
          key: AUTO_OPEN_SETTING_KEY,
          type: "switch",
          title: () => t(detectLang(), "autoOpenTitle"),
          desc: () => t(detectLang(), "autoOpenDesc")
        }
      ],
      // Declarative rows have no default: this renderless panel persists the
      // documented ON default the first time the popup opens (see the
      // component above), so the switch is not shown OFF while the feature runs.
      render: (props) => React10.createElement(FirstTurnAutoOpenDefault, {
        pluginSettings: props.pluginSettings ?? {},
        updatePluginSetting: props.updatePluginSetting ?? (() => {
        })
      })
    },
    component: (props) => React10.createElement(TrailTab, {
      ctx: props.ctx,
      scope: props.scope,
      visible: props.visible === true,
      tab: props.tab
    })
  }));
  ctx.effect(() => installFirstTurnAutoOpen(ctx));
}

    return module.exports;
  },
});

//# sourceMappingURL=client.js.map
