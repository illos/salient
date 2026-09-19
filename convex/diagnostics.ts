// SPDX-License-Identifier: GPL-3.0-only
/**
 * V51 TEMPORARY DIAGNOSTIC INSTRUMENTATION. NOT A PRODUCT FEATURE, NOT A PROPOSED FIX.
 *
 * This module exists to answer one question about the V46 timeout blocker: is the cost that every
 * authenticated query pays on this backend attributable to the shared `requireUser` prefix, or to
 * host/backend contention that would slow any function equally?
 *
 * It is deliberately the smallest thing that can discriminate those two. Both queries below return
 * a single boolean and read no application table beyond what the prefix itself reads. Neither is
 * referenced by the application; nothing imports them and no client hook calls them except the
 * V51 driver.
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
 * `requireUser` is the only non-trivial work every timing-out query has in common. It calls
 * `authComponent.safeGetAuthUser(ctx)`, which issues two nested `ctx.runQuery` calls into the
 * better-auth component, and then resolves one `users` row by index. This query does exactly that
 * and nothing else — no campaign, no membership, no session, no application table.
 *
 * If this query's server-side execution time is high while the control below is low, the prefix is
 * established as the shared cost. If both are high, the cost is not the prefix.
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
 * `ctx.auth.getUserIdentity()` verifies the caller's JWT in the runtime and returns without a
 * component round trip. Comparing this against the treatment separates JWT identity verification
 * from better-auth component invocation cost.
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
