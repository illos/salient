# Milestone 1 results

Implemented and cross-reviewed on 2026-09-10. `npm run check` passes TypeScript checking and 28 behavior tests; `npm run demo` successfully creates and reopens a local run. The Compendium remains unmodified at `fb83a789da8f0327a389c277a0c790b1648d5810`.

## What the experiment establishes

Selected official monster and hero abilities can share a small grammar and deterministic resolver. The same state/history operations support automatic effects, manual completion, and corrections. Renaming an ability and changing its numeric text changes the result without adding a handler for its name.

This is evidence for the architecture's first slice, not evidence of whole-book coverage. The grammar recognizes only a limited set of formulas. Full source text is retained, and unknown mechanical clauses block automatic execution of the action rather than disappear behind recognized damage tiers.

## Demonstrated outcomes

| Case | Source-grounded expectation and observed result |
| --- | --- |
| Prepared hero | Level-one devil Berserker Fury with Mountain kit: maximum Stamina 30, Might 2, stability 2, melee weapon tier bonuses +0/+0/+4. Choices and sources are in [the fixture guide](hero-fixture.md). |
| CLI demo: Spear Charge | Supplied dice 5+5, monster modifier +2: tier 2, 4 damage. Fury Stamina 30 → 26; first damage this round increases already-started Ferocity 1 → 2. |
| CLI demo: Brutal Slam | Supplied dice 5+5, Might +2: tier 2, 6+2 = 8 damage. Warrior Stamina 15 → 7. Push 2 gains +1 for the larger melee weapon user; movement remains a pending table instruction. Manual completion clears it without repeating damage. |
| Higher tier / squad pool | Dice 8+8, Might +2: tier 3, 9+2+4 = 15 damage. Four Spinecleavers' shared pool falls 20 → 5; the supplied nearest-minion order identifies three casualties. A surviving minion can subsequently act. |
| Squad attacking | Three Spinecleavers use one tier-3 result: 5 damage plus two free-strike values of 2 = 9 damage, with one push. |
| Cost and potency | Bury the Point spends 2 shared Malice once. Its tier-3 Might-below-2 potency does not affect Might 2; it does apply bleeding to Might 1. |
| Unsupported ability | Out of the Way retains its slide/following-movement text. No cost or damage is automatically applied. A recorded manual resolution spends 3 Ferocity and applies tier-2 damage 5+2 = 7; rewind restores the unresolved state. |
| Holdout and homebrew | Goblin Runner's Club Charge parses through the existing grammar. Renamed Spear Charge with tier-2 damage changed to 7 deals 7. Call the Thunder Down's extra willing-ally effect is explicitly unsupported. No name-specific code was added for these cases. |
| History | Request input is durable before evaluation. Save/reopen and backward/forward navigation restore exact snapshots without modifier calls. Identical command retries do not apply twice; conflicting IDs and new actions in past history are refused. |
| Failure handling | Invalid choices leave combat values unchanged. Failed evaluation and unfinished requests remain explicit records. Concurrent CLI writers are refused; failed initial persistence never invokes the modifier. |

Rules evidence comes from the pinned [ability-roll rules](../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md), [forced movement](../vendor/steel-compendium/en/unified/md/movement/forced-movement.md), [kit rules](../vendor/steel-compendium/en/unified/md/chapter/kits.md), [minion rules](../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md), and the individual abilities/features linked from the fixture guide. Expected values were checked against this text separately from implementation assertions.

## Review and fixes

The history/CLI agent reviewed combat semantics against the source; the combat agent reviewed parser/content boundaries; the content agent reviewed history/CLI. The integrating agent added the held-out content and end-to-end acceptance cases and ran the complete suite and demo.

- Manual Fury damage originally could leave stale once-per-round/encounter flags and grant Ferocity twice. Manual Fury Stamina changes now require explicit trigger bookkeeping in the same atomic operation.
- Kit damage originally required the Strike keyword. The source requires rolled Melee + Weapon damage; corrected. Kit signatures also carry a source-derived marker for bonuses already included in their printed damage.
- Multi-target actions originally interleaved each target's damage and effects. All rolled damage now precedes tier effects, as specified in the rules.
- Missing manual entity identifiers now return a rejection instead of throwing. Unsupported action types require manual resolution.
- Generic monster loading preserves unrepresented fields as unsupported markers so omitted immunities or other mechanics cannot silently yield an apparently supported actor. Source loading checks the pinned checkout revision.
- Parser checks retain extra body text, contradictory costs, and known Compendium JSON omissions. Recognized tier expressions alone do not authorize automation.

No unresolved blocker remains for the declared slice. This was an internal implementation review and scripted playtest; it has not yet had a human table playtest.

## Deliberate limits

The table supplies action eligibility, turn timing, geometry, and fixed dice. There is no random dice service, scheduler, complete character sheet, UI, account system, or Convex deployment yet. The runtime engine itself has no filesystem, database, or UI dependency; content loading and run-file storage are separate modules.

Active conditions, edges/banes, critical hits, unknown passives, collisions, several Fury features, and area damage against minion squads require manual resolution. Coordinated squad attacks currently support one target and at most three participating minions. Condition application is supported in the selected potency grammar; ongoing condition rules and saves are not automated.

`needs-input` can mean either an unchanged state awaiting prerequisites or applied damage with pending movement. Inspect `effects`, `state.pending`, and `unresolved`; never assume status alone means nothing happened. Pending work blocks subsequent automatic actions until the table records completion. `manual-required` preserves combat values and creates an explicit whole-action instruction. Manual values are table adjudications, not certified rules outcomes.

History uses full snapshots and preserves future entries when navigating backward. Branching, long-session storage efficiency, shared authorization, and distributed concurrency remain future decisions. Local run validation checks structural consistency; it does not certify arbitrary imported records. External callers of the history API must supply persistence and serialize writes as the CLI does.

Next useful step: run a short human-directed CLI exchange, then select the most obstructive manual mechanic for the next small milestone. Expand the shared grammar and context handling from observed needs before committing to a larger app shell.
