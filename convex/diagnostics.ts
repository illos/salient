// SPDX-License-Identifier: GPL-3.0-only
/**
 * V51 TEMPORARY DIAGNOSTIC INSTRUMENTATION. NOT A PRODUCT FEATURE, NOT A PROPOSED FIX.
 *
 * This module exists to answer one question about the V46 timeout blocker: is the cost that every
 * authenticated query pays on this backend attributable to the shared `requireUser` prefix, or to
 * host/backend contention that would slow any function equally?
 *
 * It is deliberately the smallest thing that can discriminate those two. Both queries return a
 * single boolean and add no work of their own beyond the prefix under test. Neither is referenced
 * by the application; nothing imports them and no client hook calls them except the V51 driver.
 *
 * Pinned versions this was written against, read from the installed tree: convex 1.45.0,
 * @convex-dev/better-auth 0.12.5, better-auth 1.6.15.
 *
 * DELETE THIS FILE before any merge. `slice/V51` is an unmerged diagnostic baseline that happens to
 * contain V46; it is never a route to merging V46 around its own gates.
 *
 * WHY THE NONCE. Convex caches query results by (function, args). Two calls with identical
 * arguments can be served from cache, and a cached read measures nothing about execution cost.
 * Every call therefore carries a caller-supplied `nonce`, which changes the argument tuple and
 * forces a fresh execution. The nonce is never read, never logged and never stored — it exists
 * only to defeat the cache. `auth:viewer` can be observed alongside these, but repeated cached
 * viewer reads are not an execution-cost measurement, which is exactly what the nonce avoids here.
 *
 * WHAT IS DELIBERATELY NOT DONE HERE:
 *   - No existing auth, session, expiry or revocation path is changed, called differently, or
 *     bypassed. `probeWithAuthPrefix` calls the same `requireUser` the application calls.
 *   - No limit is raised, no data is reset, no schema changes.
 *   - No identity, session id, token, email or display name is returned or logged. Both queries
 *     return a boolean. The control returns whether an identity was present, not who it was.
 */
import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireUser } from './lib/access';

/**
 * TREATMENT: pays the full shared prefix, then stops.
 *
 * `requireUser` is the only non-trivial work every timing-out query has in common. Its read set,
 * stated accurately: `authComponent.safeGetAuthUser(ctx)` issues two nested `ctx.runQuery` calls
 * into the better-auth component — a session lookup and a user lookup — and `requireUser` then
 * reads one row from the **application `users` table** through the `by_authId` index. So this
 * probe DOES read a component session and DOES read an application table. What it omits relative
 * to a real query is everything after the prefix: no campaign, no membership, no `sessions` row,
 * no domain table.
 *
 * An earlier draft of this comment said "no session, no application table". That was wrong about
 * the code directly beneath it.
 */
export const probeWithAuthPrefix = query({
  args: { nonce: v.string() },
  returns: v.boolean(),
  handler: async ctx => {
    await requireUser(ctx);
    return true;
  },
});

/**
 * CONTROL: authenticated, but does not touch the better-auth component or any table.
 *
 * `ctx.auth.getUserIdentity()` is identity access provided by the runtime. It performs no
 * component `runQuery` and no `ctx.db` read, which is the property being contrasted. Whether any
 * per-call cryptographic verification happens inside it is NOT demonstrated here and no claim
 * about that is made — an earlier draft asserted per-call JWT verification without evidence.
 *
 * Comparing this against the treatment isolates the cost of the component round trip plus the
 * indexed `users` read, against a baseline that is authenticated but does neither.
 *
 * Returns only whether an identity was present. Never the identity.
 */
export const probeIdentityOnly = query({
  args: { nonce: v.string() },
  returns: v.boolean(),
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
});
