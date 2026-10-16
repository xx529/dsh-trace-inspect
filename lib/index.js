// src/wire.ts
var TEXT_CAP = 2048;
var ARGS_CAP = 32768;
var RESULT_CAP = 32768;
var PAGE_SIZE = 2e3;
var PAGE_BUDGET_BYTES = 2 * 1024 * 1024;
var MAX_BODY_BYTES = 64 * 1024;
function clipText(value, cap) {
  return value.length > cap ? `${value.slice(0, cap)}\u2026` : value;
}
function record(value) {
  return value !== null && typeof value === "object" ? value : void 0;
}
function projectContent(content, cap) {
  if (typeof content === "string") return content.length > 0 ? clipText(content, cap) : void 0;
  if (!Array.isArray(content)) return void 0;
  const out = [];
  for (const block of content) {
    const b = record(block);
    if (b === void 0 || b.type !== "text" || typeof b.text !== "string" || b.text.length === 0) continue;
    out.push({ type: "text", text: clipText(b.text, cap) });
  }
  return out.length > 0 ? out : void 0;
}
function projectResultContent(content, cap) {
  if (typeof content === "string") {
    if (content.length === 0) return void 0;
    return {
      blocks: [{ type: "text", text: clipText(content, cap) }],
      bytes: content.length,
      truncated: content.length > cap
    };
  }
  if (!Array.isArray(content)) return void 0;
  const blocks = [];
  let bytes = 0;
  let truncated = false;
  for (const block of content) {
    const b = record(block);
    if (b === void 0) continue;
    if (b.type === "text") {
      if (typeof b.text !== "string" || b.text.length === 0) continue;
      bytes += b.text.length;
      if (b.text.length > cap) truncated = true;
      blocks.push({ type: "text", text: clipText(b.text, cap) });
      continue;
    }
    if (b.type !== "image") continue;
    const attachment = record(b.attachment);
    if (attachment === void 0) continue;
    const attachmentId = attachment.attachmentId;
    const mediaType = attachment.mediaType;
    if (typeof attachmentId !== "string" || attachmentId.length === 0) continue;
    if (typeof mediaType !== "string" || mediaType.length === 0) continue;
    const image = { attachmentId, mediaType };
    if (typeof attachment.bytes === "number") image.bytes = attachment.bytes;
    if (typeof attachment.width === "number") image.width = attachment.width;
    if (typeof attachment.height === "number") image.height = attachment.height;
    if (typeof attachment.name === "string") image.name = attachment.name;
    blocks.push({ type: "image", attachment: image });
  }
  return blocks.length > 0 ? { blocks, bytes, truncated } : void 0;
}
function sourceOf(data) {
  const message = record(data.message);
  if (message !== void 0) {
    const source = record(message.source);
    if (source !== void 0) return source;
  }
  return record(data.source);
}
function projectSourceFields(source) {
  const out = {};
  if (typeof source.kind === "string") out.kind = source.kind;
  if (typeof source.callId === "string" && source.callId.length > 0) out.callId = source.callId;
  return Object.keys(out).length > 0 ? out : void 0;
}
function isSurfaceOp(value) {
  if (value === "append") return true;
  const obj = record(value);
  return obj !== void 0 && typeof obj.op === "string" && obj.op.length > 0;
}
function isSeqList(value) {
  return Array.isArray(value) && value.length > 0 && value.every((n) => typeof n === "number");
}
function baseOf(event) {
  const extra = event;
  const base = { type: event.type, seq: event.seq };
  if (typeof event.time === "number") base.time = event.time;
  if (isSurfaceOp(extra.surfaceOp)) base.surfaceOp = extra.surfaceOp;
  if (isSeqList(extra.sourceEventSeqs)) base.sourceEventSeqs = extra.sourceEventSeqs;
  return base;
}
function withData(base, data) {
  return Object.keys(data).length > 0 ? { ...base, data } : base;
}
function projectEvent(event) {
  const base = baseOf(event);
  const data = record(event.data);
  if (data === void 0) return base;
  switch (event.type) {
    case "turn/start":
    case "turn/end":
      return typeof data.turn === "number" ? withData(base, { turn: data.turn }) : base;
    case "user/message": {
      const out = {};
      const content = projectContent(data.content, TEXT_CAP);
      if (content !== void 0) out.content = content;
      const message = record(data.message);
      if (message !== void 0) {
        const m = {};
        if (typeof message.content === "string" && message.content.length > 0) {
          m.content = clipText(message.content, TEXT_CAP);
        }
        const source2 = record(message.source);
        if (source2 !== void 0) {
          const s = projectSourceFields(source2);
          if (s !== void 0) m.source = s;
        }
        if (Object.keys(m).length > 0) out.message = m;
      }
      const source = record(data.source);
      if (source !== void 0) {
        const s = projectSourceFields(source);
        if (s !== void 0) out.source = s;
      }
      return withData(base, out);
    }
    case "assistant/message": {
      const out = {};
      const message = record(data.message);
      if (message !== void 0) {
        const content = projectContent(message.content, TEXT_CAP);
        if (content !== void 0) out.message = { content };
      }
      const fallback = projectContent(data.content, TEXT_CAP);
      if (fallback !== void 0) out.content = fallback;
      return withData(base, out);
    }
    case "tool/call": {
      const out = {};
      if (typeof data.name === "string" && data.name.length > 0) out.name = data.name;
      if (typeof data.arguments === "string") {
        out.arguments = clipText(data.arguments, ARGS_CAP);
        out.argsBytes = data.arguments.length;
        out.argsTruncated = data.arguments.length > ARGS_CAP;
      }
      if (typeof data.callId === "string" && data.callId.length > 0) out.callId = data.callId;
      if (typeof data.turn === "number") out.turn = data.turn;
      if (typeof data.step === "number") out.step = data.step;
      const source = sourceOf(data);
      if (source !== void 0) {
        const s = projectSourceFields(source);
        if (s !== void 0 && typeof s.callId === "string") out.message = { source: s };
      }
      return withData(base, out);
    }
    case "tool/result": {
      const out = {};
      const error = record(data.error);
      if (error !== void 0) {
        const e = {};
        if (typeof error.name === "string" && error.name.length > 0) e.name = error.name;
        if (typeof error.code === "string" && error.code.length > 0) e.code = error.code;
        if (Object.keys(e).length > 0) out.error = e;
      }
      const message = record(data.message);
      if (message?.isError === true || data.isError === true) out.isError = true;
      if (typeof data.callId === "string" && data.callId.length > 0) out.callId = data.callId;
      if (typeof data.turn === "number") out.turn = data.turn;
      if (typeof data.step === "number") out.step = data.step;
      const content = message !== void 0 ? projectResultContent(message.content, RESULT_CAP) : void 0;
      if (content !== void 0) {
        out.content = content.blocks;
        out.contentBytes = content.bytes;
        out.contentTruncated = content.truncated;
      }
      const source = sourceOf(data);
      if (source !== void 0) {
        const s = projectSourceFields(source);
        if (s !== void 0 && typeof s.callId === "string") out.message = { source: s };
      }
      return withData(base, out);
    }
    case "compaction/summary": {
      const summary = projectContent(data.summary, TEXT_CAP);
      return summary !== void 0 ? withData(base, { summary }) : base;
    }
    default:
      return base;
  }
}

// src/index.ts
var inject = ["webServer", "sessionQuery", "sessions"];
var trailCache = /* @__PURE__ */ new Map();
var CACHE_MAX_ENTRIES = 64;
var CACHE_MAX_BYTES = 64 * 1024 * 1024;
var cacheBytes = 0;
var PROBE_TTL_MS = 2e3;
function header(headers, name) {
  const value = headers[name];
  return typeof value === "string" ? value : void 0;
}
function parseAuthority(authority) {
  try {
    return new URL(`http://${authority}`);
  } catch {
    return void 0;
  }
}
function isLoopbackHostname(hostname) {
  if (hostname === "localhost" || hostname === "[::1]") return true;
  const parts = hostname.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function isTrustedApiRequest(request) {
  const host = header(request.headers, "host");
  if (host === void 0) return false;
  const hostUrl = parseAuthority(host);
  if (hostUrl === void 0 || !isLoopbackHostname(hostUrl.hostname)) return false;
  if (header(request.headers, "sec-fetch-site") === "cross-site") return false;
  const origin = header(request.headers, "origin");
  if (origin === void 0) return true;
  try {
    return new URL(origin).hostname === hostUrl.hostname;
  } catch {
    return false;
  }
}
function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": String(Buffer.byteLength(text))
  });
  res.end(text);
}
var BODY_TOO_LARGE = Symbol("trail-body-too-large");
async function readJsonBody(req) {
  const declared = header(req.headers, "content-length");
  if (declared !== void 0) {
    const declaredBytes = Number(declared);
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_BODY_BYTES) return BODY_TOO_LARGE;
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), "utf8");
    total += buf.length;
    if (total > MAX_BODY_BYTES) return BODY_TOO_LARGE;
    chunks.push(buf);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    const parsed = JSON.parse(text.length > 0 ? text : "{}");
    return parsed !== null && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function afterSeqOf(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
function upperBound(events, afterSeq) {
  let lo = 0;
  let hi = events.length;
  while (lo < hi) {
    const mid = lo + hi >> 1;
    const seq = events[mid].seq;
    if (typeof seq === "number" && seq <= afterSeq) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function liveEventsOf(session) {
  if (typeof session.snapshotEvents === "function") {
    try {
      const snapshot = session.snapshotEvents();
      if (Array.isArray(snapshot)) return snapshot;
    } catch {
      return void 0;
    }
  }
  return Array.isArray(session.events) ? session.events : void 0;
}
function liveSessionOf(ctx, sessionId) {
  const sessions = ctx.sessions;
  if (sessions === void 0 || typeof sessions.get !== "function") return void 0;
  try {
    const session = sessions.get(sessionId);
    if (session === null || typeof session !== "object") return void 0;
    return liveEventsOf(session) !== void 0 ? session : void 0;
  } catch {
    return void 0;
  }
}
function respondPage(res, events, afterSeq, project) {
  const lo = upperBound(events, afterSeq);
  const hardEnd = Math.min(events.length, lo + PAGE_SIZE);
  const tail = [];
  let bytes = 0;
  let i = lo;
  for (; i < hardEnd; i += 1) {
    const projected = project ? projectEvent(events[i]) : events[i];
    const size = Buffer.byteLength(JSON.stringify(projected));
    if (tail.length > 0 && bytes + size > PAGE_BUDGET_BYTES) break;
    bytes += size;
    tail.push(projected);
  }
  sendJson(res, 200, { events: tail, hasMore: i < events.length });
}
function cacheStore(sessionId, lastSeq, events, bytes, probedAt) {
  const existing = trailCache.get(sessionId);
  if (existing !== void 0) {
    trailCache.delete(sessionId);
    cacheBytes -= existing.bytes;
  }
  trailCache.set(sessionId, { lastSeq, probedAt, events, bytes });
  cacheBytes += bytes;
  while (trailCache.size > CACHE_MAX_ENTRIES || cacheBytes > CACHE_MAX_BYTES && trailCache.size > 1) {
    const oldest = trailCache.keys().next().value;
    if (oldest === void 0) break;
    const entry = trailCache.get(oldest);
    trailCache.delete(oldest);
    cacheBytes -= entry?.bytes ?? 0;
  }
}
function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "exact",
    path: "/trace-inspect/api/events",
    handler: async (rawReq, rawRes) => {
      const req = rawReq;
      const res = rawRes;
      if (!isTrustedApiRequest({ headers: req.headers })) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "method not allowed" });
        return;
      }
      const body = await readJsonBody(req);
      if (body === BODY_TOO_LARGE) {
        sendJson(res, 413, { error: "payload too large" });
        return;
      }
      const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
      if (sessionId.length === 0) {
        sendJson(res, 400, { error: "sessionId is required" });
        return;
      }
      const afterSeq = afterSeqOf(body.afterSeq);
      try {
        const live = liveSessionOf(ctx, sessionId);
        if (live !== void 0) {
          respondPage(res, liveEventsOf(live) ?? [], afterSeq, true);
          return;
        }
        const cached = trailCache.get(sessionId);
        let lastSeq = -1;
        let probedAt = 0;
        if (cached !== void 0 && Date.now() - cached.probedAt < PROBE_TTL_MS) {
          lastSeq = cached.lastSeq;
          probedAt = cached.probedAt;
        } else {
          try {
            const records = await ctx.sessionQuery.listEvents(sessionId);
            const last = records[records.length - 1];
            lastSeq = last !== void 0 && typeof last.seq === "number" ? last.seq : -1;
            probedAt = Date.now();
          } catch {
            lastSeq = -1;
            probedAt = Date.now();
          }
        }
        let base;
        if (cached !== void 0 && lastSeq >= 0 && cached.lastSeq === lastSeq) {
          base = cached.events;
          if (probedAt > cached.probedAt) cached.probedAt = probedAt;
          trailCache.delete(sessionId);
          trailCache.set(sessionId, cached);
        } else {
          const snapshot = await ctx.sessionQuery.readSession(sessionId);
          const raw = Array.isArray(snapshot.events) ? snapshot.events : [];
          let bytes = 0;
          base = raw.map((event) => {
            const projected = projectEvent(event);
            bytes += Buffer.byteLength(JSON.stringify(projected));
            return projected;
          });
          cacheStore(sessionId, lastSeq, base, bytes, probedAt);
        }
        respondPage(res, base, afterSeq, false);
      } catch {
        sendJson(res, 404, { error: "session-not-found" });
      }
    }
  }));
}
export {
  PROBE_TTL_MS,
  apply,
  inject,
  isLoopbackHostname,
  isTrustedApiRequest
};
//# sourceMappingURL=index.js.map
