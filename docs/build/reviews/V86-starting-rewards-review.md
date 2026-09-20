# V86 independent starting rewards review

Reviewer: complication implementer, reviewing the separately authored V86 snapshot, starting-item
catalog and tests on 2026-09-20. The review excludes this reviewer's V85 complication catalog,
content exclusions and focused tests. It is independent for the paths below.

Status: source and static implementation review pass after the corrections below; full build and
live application verification remain separate acceptance gates. No browser was used.

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
Expanded per-option/API verification is the lead's remaining gate, not assumed from these tests.

## Corrected findings

- The first UI version mounted the rewards query for a Director viewing a proposed first admission,
  although that Director is intentionally not yet authorized by the personal reward endpoint. The
  sheet now mounts the panel for the owner or an actually attached campaign only. Static readback
  confirms `characters.sheet` emits `campaign: null` for first-admission proposals, so the query is
  skipped while existing admission review remains available. Endpoint access was not broadened.
- Read-only legacy feasibility initially supplied an unnecessary current timestamp. The timestamp
  is not returned or used as a grant by the query; use a fixed preparation value and reserve actual
  initialization time for the mutation. Correction is checked in final readback.

## Scope limits

This review approves a once-recorded starting award and explicit manual item actions. It does not
approve a general inventory/equipment system, mutable spending balances, crafting completion,
follower entities, or automatic item bonuses. Full `pnpm check`, persisted API journeys and actual
runtime source identity still must pass before delivery can be claimed.
