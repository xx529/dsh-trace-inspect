// src/wire.ts
var CONTEXT_CAP = 64 * 1024;
var PAGE_BUDGET_BYTES = 2 * 1024 * 1024;
var MAX_BODY_BYTES = 64 * 1024;

// src/host-http.ts
function header(headers, name2) {
  const value = headers[name2];
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

// src/desc-inject/schema.ts
var PARAM_NAME = "description";
var MARKER = "Clear, concise description of what this call does, in active voice, 15-30 words (shown in the UI). Name the action and its target.";
function hasOwn(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}
function objectParameters(parameters) {
  if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) return void 0;
  const root = parameters;
  if (root.type !== "object") return void 0;
  const properties = root.properties;
  if (properties === null || typeof properties !== "object" || Array.isArray(properties)) return void 0;
  return parameters;
}
function matchesPrefix(name2, prefixes) {
  return prefixes.some((prefix) => prefix.length > 0 && name2.startsWith(prefix));
}
function injectable(name2, parameters, prefixes) {
  if (!matchesPrefix(name2, prefixes)) return false;
  const root = objectParameters(parameters);
  return root !== void 0 && !hasOwn(root.properties, PARAM_NAME);
}
function withDescriptionParameter(parameters) {
  const root = objectParameters(parameters);
  if (root === void 0) return parameters;
  const required = Array.isArray(root.required) ? root.required : [];
  return {
    ...root,
    properties: {
      ...root.properties,
      [PARAM_NAME]: { type: "string", description: MARKER }
    },
    required: [...required, PARAM_NAME]
  };
}
function stripInjected(args) {
  if (args === null || typeof args !== "object" || Array.isArray(args)) return args;
  if (!hasOwn(args, PARAM_NAME)) return args;
  const copy = { ...args };
  delete copy[PARAM_NAME];
  return copy;
}

// src/desc-inject/state.ts
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var PLUGIN_DIR = "dsh-trace-inspect";
var STATE_SUBDIR = "tool-description";
function resolveDshHome(env = process.env) {
  const configured = env.DSH_HOME?.trim();
  return configured !== void 0 && configured.length > 0 ? configured : join(homedir(), ".dsh");
}
function stateDirectory(home = resolveDshHome()) {
  return join(home, PLUGIN_DIR, STATE_SUBDIR);
}
function stateFile(sessionId, home = resolveDshHome()) {
  return join(stateDirectory(home), `${encodeURIComponent(sessionId)}.json`);
}
function readChoice(sessionId, home = resolveDshHome()) {
  let text;
  try {
    text = readFileSync(stateFile(sessionId, home), "utf8");
  } catch {
    return void 0;
  }
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object") return void 0;
    const enabled = parsed.enabled;
    return typeof enabled === "boolean" ? { enabled } : void 0;
  } catch {
    return void 0;
  }
}
function writeChoice(sessionId, enabled, home = resolveDshHome()) {
  mkdirSync(stateDirectory(home), { recursive: true });
  const target = stateFile(sessionId, home);
  const temporary = `${target}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ enabled, updatedAt: (/* @__PURE__ */ new Date()).toISOString() })}
`, "utf8");
  renameSync(temporary, target);
}
function resolveChoice(sessionId, parentOf, read = (id) => readChoice(id), fallback = false) {
  const seen = /* @__PURE__ */ new Set();
  let current = sessionId;
  for (let depth = 0; depth < 16 && current !== void 0; depth += 1) {
    if (seen.has(current)) break;
    seen.add(current);
    const own = read(current);
    if (own !== void 0) return { enabled: own.enabled, source: depth === 0 ? "session" : "parent" };
    current = parentOf(current);
  }
  return { enabled: fallback, source: "default" };
}

// src/desc-inject/index.ts
var name = "trace-inspect-desc";
var inject = ["tools", "agents"];
var AUDIT_PATH = "/trace-inspect/api/tool-audit";
var DEFAULT_PREFIXES = ["mcp__"];
var COMMAND_NAME = "desc-inject";
function decorateDefinition(definition) {
  const decorated = {
    ...definition,
    parameters: withDescriptionParameter(definition.parameters),
    execute: (args, exec) => definition.execute(stripInjected(args), exec),
    ...typeof definition.isConcurrencySafe === "function" ? { isConcurrencySafe: (args) => definition.isConcurrencySafe(stripInjected(args)) } : {}
  };
  return decorated;
}
function apply(ctx, config = {}) {
  const enabledByDefault = config.enabledByDefault === true;
  const prefixes = Array.isArray(config.prefixes) && config.prefixes.length > 0 ? config.prefixes.map(String) : [...DEFAULT_PREFIXES];
  const home = resolveDshHome();
  const liveAgents = /* @__PURE__ */ new Map();
  const shadows = /* @__PURE__ */ new Map();
  const modes = /* @__PURE__ */ new Map();
  const sealed = /* @__PURE__ */ new Set();
  let reconciling = false;
  const parentOf = (sessionId) => ctx.agents.get(sessionId)?.session.parentSession;
  const modeOf = (agent) => {
    const sessionId = agent.session.id;
    const cached = modes.get(sessionId);
    if (cached !== void 0) return cached;
    const resolved = resolveChoice(sessionId, parentOf, (candidate) => readChoice(candidate, home), enabledByDefault);
    modes.set(sessionId, resolved.enabled);
    return resolved.enabled;
  };
  const isSealed = (agent) => {
    const sessionId = agent.session.id;
    if (sealed.has(sessionId)) return true;
    let started = false;
    try {
      started = agent.session.snapshotEvents().some((event) => event.type === "turn/start");
    } catch {
      started = true;
    }
    if (started) sealed.add(sessionId);
    return started;
  };
  const statusOf = (agent) => ({ enabled: modeOf(agent), sealed: isSealed(agent) });
  const choose = (agent, enabled) => {
    writeChoice(agent.session.id, enabled, home);
    modes.set(agent.session.id, enabled);
    liveAgents.set(agent.id, agent);
    reconcile(agent);
    return statusOf(agent);
  };
  const reconcile = (agent) => {
    const registered = shadows.get(agent.id) ?? /* @__PURE__ */ new Map();
    shadows.set(agent.id, registered);
    if (!modeOf(agent)) {
      for (const dispose of registered.values()) dispose();
      registered.clear();
      return;
    }
    const targets = /* @__PURE__ */ new Map();
    for (const definition of ctx.tools.definitions()) {
      if (injectable(definition.name, definition.parameters, prefixes)) targets.set(definition.name, definition);
    }
    for (const [name2, dispose] of [...registered]) {
      if (targets.has(name2)) continue;
      dispose();
      registered.delete(name2);
    }
    for (const [name2, definition] of targets) {
      if (registered.has(name2)) continue;
      try {
        registered.set(name2, agent.ctx.tools.register(decorateDefinition(definition)));
      } catch (error) {
        ctx.logger?.warn?.(`desc-inject: cannot shadow "${name2}" for "${agent.id}": ${String(error)}`);
      }
    }
  };
  ctx.on("agent/created", ({ agent }) => {
    liveAgents.set(agent.id, agent);
    agent.ctx.effect(() => () => {
      liveAgents.delete(agent.id);
      shadows.delete(agent.id);
    });
    if (modeOf(agent)) reconcile(agent);
  });
  ctx.on("tools/change", () => {
    if (reconciling) return;
    reconciling = true;
    try {
      for (const agent of liveAgents.values()) reconcile(agent);
    } finally {
      reconciling = false;
    }
  });
  ctx.inject(["webServer"], (webCtx) => {
    const webServer = webCtx.webServer;
    if (webServer === void 0) return;
    webServer.register({
      kind: "exact",
      path: AUDIT_PATH,
      handler: async (rawReq, rawRes) => {
        const req = rawReq;
        const res = rawRes;
        if (!isTrustedApiRequest({ headers: req.headers })) {
          sendJson(res, 403, { error: "forbidden" });
          return;
        }
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        const sessionId = url.searchParams.get("sessionId") ?? "";
        const agent = sessionId.length > 0 ? ctx.agents.get(sessionId) : void 0;
        if (agent === void 0) {
          sendJson(res, 404, { error: "session not found" });
          return;
        }
        if (req.method === "GET") {
          sendJson(res, 200, statusOf(agent));
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
        if (typeof body.enabled !== "boolean") {
          sendJson(res, 400, { error: "enabled must be a boolean" });
          return;
        }
        if (isSealed(agent)) {
          sendJson(res, 409, { error: "sealed", ...statusOf(agent) });
          return;
        }
        try {
          sendJson(res, 200, choose(agent, body.enabled));
        } catch (error) {
          sendJson(res, 500, { error: String(error) });
        }
      }
    });
  });
  ctx.inject(["commands"], (commandCtx) => {
    const commands = commandCtx.commands;
    if (commands === void 0) return;
    commands.register({
      definitionId: "dsh-trace-inspect/desc-inject",
      name: COMMAND_NAME,
      description: "\u5F00\u542F\u6216\u5173\u95ED\u672C\u5BF9\u8BDD\u7684\u5DE5\u5177\u5BA1\u8BA1\uFF08\u5F00\u542F\u540E\u6CE8\u5165\u7C7B\u5DE5\u5177\u591A\u4E00\u4E2A description \u53C2\u6570\uFF0C\u8BB0\u5F55\u8C03\u7528\u76EE\u7684\uFF0C\u4EC5\u7528\u4E8E\u8F6E\u6B21\u8F68\u8FF9\uFF09",
      input: { hint: "[on|off|status]" },
      handler: ({ agent, rawInput }) => {
        const argument = String(rawInput ?? "").trim().toLowerCase();
        if (argument === "" || argument === "status") {
          return {
            kind: "success",
            text: `${modeOf(agent) ? "on" : "off"}${isSealed(agent) ? " (sealed)" : ""}`
          };
        }
        if (argument !== "on" && argument !== "off") {
          return { kind: "error", text: "\u7528\u6CD5\uFF1A/desc-inject on|off|status" };
        }
        if (isSealed(agent)) {
          return { kind: "error", text: "\u672C\u5BF9\u8BDD\u5DF2\u7ECF\u5F00\u59CB\uFF0C\u5DE5\u5177\u5BA1\u8BA1\u4E0D\u53EF\u518D\u4FEE\u6539\u3002" };
        }
        const enabled = argument === "on";
        try {
          choose(agent, enabled);
        } catch (error) {
          return { kind: "error", text: `\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25\uFF1A${String(error)}` };
        }
        return {
          kind: "success",
          text: enabled ? "\u5DF2\u5F00\u542F\uFF1A\u672C\u5BF9\u8BDD\u540E\u7EED\u6CE8\u5165\u7C7B\u5DE5\u5177\u4F1A\u5E26 description \u53C2\u6570\uFF08\u5DF2\u56FA\u5316\uFF09\u3002" : "\u5DF2\u5173\u95ED\uFF1A\u672C\u5BF9\u8BDD\u4E0D\u6CE8\u5165 description \u53C2\u6570\uFF08\u5DF2\u56FA\u5316\uFF09\u3002"
        };
      }
    });
  });
}
export {
  AUDIT_PATH,
  COMMAND_NAME,
  apply,
  decorateDefinition,
  inject,
  name
};
//# sourceMappingURL=desc-inject.js.map
