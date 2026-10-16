#!/usr/bin/env node
/**
 * check-lib.mjs — fail when the committed `lib/` no longer matches a fresh build.
 *
 * The documented install path is `... add github:xx529/dsh-trace-inspect`, and
 * a git-sourced plugin gets no build step, so `lib/` must be committed AND
 * current. Two invariants enforce that:
 *
 *   1. lib/ is TRACKED by git (otherwise it would not ship with the repo);
 *   2. after `pnpm build`, nothing under lib/ is modified, staged, deleted,
 *      untracked or ignored.
 *
 * Why not `git diff --exit-code -- lib`: git diff is blind to untracked and
 * ignored paths, so it reported a false green while lib/ was untracked
 * (independent verification report F1) and again if lib/ were re-ignored (N3).
 * `git status --porcelain --ignored` covers every one of those states.
 */
import { execFileSync } from 'node:child_process'

/** Run git and return stdout. */
function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
}

let tracked = ''
let status = ''
try {
  tracked = git(['ls-files', '--', 'lib']).trim()
  status = git(['status', '--porcelain', '--ignored', '--', 'lib']).trim()
} catch (error) {
  console.error(`[check:lib] git failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

if (tracked.length === 0) {
  console.error('[check:lib] lib/ is not tracked by git — the github: install path would ship no bundle.')
  console.error('           Run `pnpm build` first, then `git add lib` and commit.')
  process.exit(1)
}

if (status.length > 0) {
  console.error('[check:lib] lib/ is out of date — run `pnpm build` and commit the result:')
  console.error(status)
  process.exit(1)
}

console.log(`[check:lib] ${tracked.split('\n').length} committed lib/ files match a fresh build`)
