/**
 * paging.ts — the one constant both halves agree on for history segments.
 *
 * DSH's conversation window pages the durable log by MESSAGES (50 per page,
 * `SessionPageRequest.beforeSeq` / `hasMore`, driven by `loadOlder()`), and the
 * official trajectory view additionally renders a resident window of
 * `HISTORY_PAGE_NODES = 50` event nodes. The outline's unit is the TURN, so
 * this plugin pages by complete prompt-anchored turns instead: the tail
 * segment and every "load earlier" segment carry at most `PAGE_TURNS` turns.
 *
 * Kept in its own module (not `wire.ts`) so the client bundle pulls a constant
 * instead of the host projection code.
 */

/** Turns per history segment (tail load and each older page). */
export const PAGE_TURNS = 20

/** Hard cap on a client-requested segment size (`maxTurns`). */
export const MAX_PAGE_TURNS = 200
