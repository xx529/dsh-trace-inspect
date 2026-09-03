/**
 * Structured host context / wire types for dsh-turn-outline.
 * Deliberately structural: the plugin never value-imports DSH internals,
 * so it stays compatible across DSH releases (rc and alpha alike).
 */

/** One session event as read from `sessionQuery.readSession(id).events`. */
export interface SessionEventLike {
  type: string
  seq: number
  time?: number
  data?: Record<string, unknown> | null
}

/** The host `webServer` face we consume. */
export interface WebServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (req: unknown, res: unknown) => void | Promise<void>
  }): void
}

/** The host `sessionQuery` face (dsh-session-query) we consume. */
export interface SessionQueryLike {
  readSession(sessionId: string): Promise<{ events: SessionEventLike[] }>
  listEvents(sessionId: string): Promise<Array<{ seq: number }>>
}

/**
 * The host `sessions` face (dsh-session SessionStore) we consume. Live
 * sessions expose `events` — an immutable frozen append-only snapshot that
 * DSH caches until the next append, so borrowing it is O(1) amortized and
 * requires no deep copy.
 */
export interface SessionsServiceLike {
  get(sessionId: string): unknown
}

/** A live session's read-only face: the frozen event log snapshot. */
export interface LiveSessionLike {
  readonly events: ReadonlyArray<SessionEventLike>
}

/** Minimal host context seen by `apply(ctx)`. */
export interface HostCtx {
  webServer: WebServerLike
  sessionQuery: SessionQueryLike
  /** Live session store (host core); optional so test contexts stay simple. */
  sessions?: SessionsServiceLike
  effect<T>(fn: () => T): T
  logger?: { warn(message: string, ...args: unknown[]): void }
}

/** Node http.IncomingMessage-like headers subset the fence reads. */
export interface HttpHeadersLike {
  host?: string
  origin?: string
  'sec-fetch-site'?: string
}

/** Node http request facade the route handler receives. */
export interface HttpRequestLike {
  method?: string
  headers: HttpHeadersLike
  url?: string
  [Symbol.asyncIterator](): AsyncIterableIterator<Buffer | string>
}

/** Node http server response facade the route handler writes to. */
export interface HttpResponseLike {
  writeHead(status: number, headers: Record<string, string>): void
  end(body?: string | Buffer): void
}

/** The wire body of POST /turntrail/api/events. */
export interface TrailEventsRequest {
  sessionId?: unknown
  afterSeq?: unknown
}

/** The wire response of POST /turntrail/api/events. */
export interface TrailEventsResponse {
  events: SessionEventLike[]
  /** More pages remain; the client re-pulls with the last delivered seq. */
  hasMore: boolean
}
