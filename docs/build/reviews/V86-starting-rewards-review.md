# V86 independent starting rewards review

Reviewer: complication implementer, reviewing the separately authored V86 snapshot, starting-item
catalog and tests on 2026-09-20. The review excludes this reviewer's V85 complication catalog,
content exclusions and focused tests. It is independent for the paths below.

Status: source and static implementation review pass at candidate
`b15fc5952dd1ca94dab9520398fa571c3573b22e` after final correction readback. The local full build passed;
live application verification remains a blocked acceptance gate. No browser was used.

## Source review

Read every core first-echelon trinket (12) and leveled weapon's first-level section (14) directly
from Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`. Compared all 20 entries in
`shared/content/starting-item-abilities.ts` against their exact source, then separately checked
timing, triggers, wearer/holder restrictions and omitted passive modifiers. No source defects found.

Distinct Divine Vine release and Flameshade Gloves recovery operations retain their different
printed action types. Quantum Satchel and optional weapon shifts do not acquire invented combat
action costs. The weapon cards stop before fifth-level properties. Gecko Gloves and eight
weapons supply no additional standalone first-level action; their passive effects remain readable
item rules, not falsely automated statistics.

The seven fixed narrative possessions and Shattered Legacy repair-source annotation in
`shared/content/starting-reward-items.ts` match the corresponding complete complication bodies.
A broken leveled treasure does not grant its active properties, and an absent bonded artifact does
not become an equipped item. Secret inheritance remains a placeholder in the public snapshot.

Final readback checked all seven fixed possessions: notebook, power pack, loyalty collar,
sibling’s shield, relative’s jewelry, pirate-map piece and golden sapling. Each requires the actual
complication feature and matching pinned source path. The helper copies input items and deduplicates
fixed grants by their stable possession decision ID. Reapplying it at baseline derivation and then
snapshot initialization neither duplicates items nor appends the Shattered Legacy repair sentence
again; previously stored possessions survive later feature removal. These are named possessions,
not an invented treasure catalog or automatically applied equipment bonuses.

Focused source checks passed: `pnpm exec vitest run --project engine tests/starting-item-abilities.test.ts`,
two tests, exit 0, `/tmp/v86-item-review.log`. One checks real-source excerpt/level boundaries;
the other catches wrong timing despite correct source prose. Neither substitutes catalog counts
for behavior or duplicates the later persisted API proof.

## Implementation review

Reviewed `convex/characterRewards.ts`, `convex/lib/startingRewards.ts`, first-admission integration,
`shared/contracts/startingRewards.ts`, `shared/evaluate/startingItemAbilities.ts`, sheet rendering,
and the shared public API proof plus historical fixture test. Applied the Convex reviewer skill.

The owner/current campaign Director authority is checked before command receipt lookup. Required
IDs and expected revisions are validated; the origin revision must belong to the character and
have a complete saved evaluation. Legacy preparation uses the original admitted revision, not a
changed career/draft. Initialization writes and receipt commit share the mutation transaction.
Read-only preparation does not mint rewards. Existing snapshots survive subsequent activation.
Item actions project from possessed item identity/source, never from draft entitlement previews;
broken, absent and hidden placeholder items do not expose those actions. Peer sheet projection
returns before private item-action construction.

The public-route test exercises admission, approved career edit, restore, repeat initialization
and non-owner denial. Its expected Artisan resources and broken Grand Scarab are source-derived.
The historical fixture patch is justified because new public admissions already create snapshots;
it catches regrant from a later career, stale requests, unauthorized receipts and unavailable origin.
The item proof now checks the returned event ID against persisted `events.list`, including
`ability.recorded`, the manual flag, the actual item ability name and source. This catches
a route returning success without retaining the manual action. Expanded per-option/API verification
is the lead's remaining gate, not assumed from these tests.

## Corrected findings

- The first UI version mounted the rewards query for a Director viewing a proposed first admission,
  although that Director is intentionally not yet authorized by the personal reward endpoint. The
  sheet now mounts the panel for the owner or an actually attached campaign only. Static readback
  confirms `characters.sheet` emits `campaign: null` for first-admission proposals, so the query is
  skipped while existing admission review remains available. Endpoint access was not broadened.
- Read-only legacy feasibility initially supplied an unnecessary current timestamp. The timestamp
  is not returned or used as a grant by the query. Final readback confirms `get` now passes `0`,
  while `initialize` alone records `Date.now()` during the mutation.

## Scope limits

This review approves a once-recorded starting award and explicit manual item actions. It does not
approve a general inventory/equipment system, mutable spending balances, crafting completion,
follower entities, or automatic item bonuses. The remaining deployed API journeys and actual runtime source identity must pass before delivery
can be claimed.

## Lead verification record

The lead's full `pnpm check` on `faa9b1e` passed: 345 engine plus 519 app/script tests
(864 total), including final proof assertions, and the production build. This records the lead's
run, not an additional reviewer execution. The isolated CT114 deployment of `b15fc59` failed
its existing initial function-push readiness guard before any live API scenarios could start.
No retry or infrastructure repair was attempted; the environment is stopped with data retained.
[Evidence and logs](../evidence/V85/README.md) distinguish local proof from the blocked live gate.
The static/source review verdict is unchanged; delivery acceptance is not granted.
