# V85–V86 independent implementation review

Reviewer: delegated Astra agent, 2026-09-20. Reviewed the lead's evaluator, sheet, resolver, admission and starting-reward UI integration. Applied the `convex-reviewer` skill for authentication, validators, indexed reads and query behavior. This reviewer authored the starting-item action catalog; that catalog and its focused tests are excluded and reviewed independently by the complication agent. No tests or services were run for this review.

Status: implementation and proof-code review pass for candidate `b15fc5952dd1ca94dab9520398fa571c3573b22e`, within the documented manual boundary. Formal release acceptance remains blocked on deployed API evidence.

## Resolved findings

1. **Psychic Blast main-action cost was missing.** The newly resolved main-action entry has no catalog `cost`, and the embedded parser does not infer its all-resource cost from prose. This permits the supported payment path to treat it as free. Both source entries now carry `All Heroic Resource`, translated to the actual current resource amount by the shared resolver; persisted payment proof remains part of acceptance.
2. **Proposed admission sheet could throw from the rewards query.** A Director may view an unattached character's proposed admission, but `characterRewards.get` only authorizes the character owner or attached campaign Director. The newly unconditional panel query therefore throws for this legitimate sheet audience. Both compact and full sheet variants now mount the panel only for the owner or an attached campaign sheet, preserving the existing API authority boundary.
3. **Reactive read used wall-clock time unnecessarily.** `characterRewards.get` passed `Date.now()` to a preparatory snapshot that it does not return. Read preparation now receives the constant 0; the discarded proposed timestamp is not returned. Mutation initialization retains its transaction timestamp.
4. **Previously supported Dragon Dreams rolls became manual-only.** The new complication resolver branch discarded roll/tiers for all entries. Dragon Breath and Draconian Pride previously used their ability content's supported rolled path; the revised resolver sends standalone `/feature/ability/` source grants through the existing `abilityFromEntry` path. Newly exposed unsupported prose remains explicitly manual. Grounded's independently granted version receives the source-correct ranged 5 metadata without duplicating the action.
5. **New helper imported the full content barrel.** `startingItemAbilities.ts` imported `manifest` through `compendium/index.ts`, evaluating every content JSON and flattening the whole corpus in backend modules. The helper now imports only `manifest.json`, preserving the existing cold-start boundary.

## Positive checks and boundaries

- `complicationAbilities` reconstructs current grants from the retained parent feature and selected Dragon Dreams traits, removes managed legacy entries, and preserves source provenance. This avoids trusting stale stored ability lists.
- `startingItemAbilities` selects only matching possessed item identity/source pairs in persisted rewards. Draft initial-item previews, broken items, absent artifacts and private inheritance placeholders cannot supply item actions.
- The first-admission guard initializes only when no reward record exists. Later build activation and historical restoration do not recompute or replace these possessions/balances.
- `startingRewardItems` adds the seven fixed source possessions and Shattered Legacy's repair-source entitlement from retained source features. It does not turn Refugee's held-by-invaders asset into spendable property or reveal Strange Inheritance's identity.
- Source pool exclusions feed both editor pool calculation and evaluator validation; direct submitted selections cannot bypass the two new source prohibitions merely by skipping the UI.
- Existing sheet peer projection returns before full ability or reward payload construction. The dedicated reward API authenticates first and checks owner/current attached Director authority before reads or mutation receipt replay. Current app policy equates Director with campaign owner; this change does not invent delegation.
- Legacy reward preparation uses the recorded first-admission revision, validates revision ownership and complete saved values, and never reads the latest career to regrant rewards. It enriches missing narrative metadata from saved origin features while retaining saved resource amounts.
- The supported resource-debit path can handle Guilty Conscience's Recovery and reject unavailable hero-token payments. Both Psychic Blast modes now expose the all-resource cost; the reviewed public witness explicitly checks the resulting pool and undo.

These findings concern concrete current paths. This review does not claim automated item modifiers, equipment state, project spending, temporary learned abilities, cooldowns, companions or private-trinket activation. Their manual/deferred boundaries must remain visible. Separate public API proofs and full build checks are required before release.

## Independent starting-item proof review

Reviewed lead-authored `scripts/headless/starting-items.ts` without running it. The scenario exercises real authenticated create/submit/query routes for all 12 trinket and 14 weapon selections, verifies draft entitlements do not expose item actions, checks persisted possession states, compares the resulting action list against a separately enumerated source ledger and checks each readable excerpt against the pinned source. It also exercises a table item invocation and outsider rejection. This is distinct application coverage, not a duplicate of the source/timing unit tests.

The earlier false-positive gap is closed: the final witness captures the returned event ID, fetches its persisted `ability.recorded` event and checks the manual flag, expected ability identity and exact source path. A blocked operation can no longer pass merely because live state stayed unchanged. It also verifies every independently enumerated active item key was visited and uses the supported session `action: 'close'` cleanup. This proof-code review passes; it does not substitute for the lead’s actual run result.

## Independent complication and reward proof review

Reviewed `scripts/headless/complication-actions.ts`, `scripts/headless/starting-rewards.ts` and their application test adapters, authored by another agent. No duplicate test-only behavior was introduced: the adapters run the same public-operation scenarios used by the real API runner.

The complication sheet matrix verifies grant retention, replacement removal, unique actions, source-readable content, independently transcribed prose timing and printed structured timing. Its catalog import supplies the case inventory, not expected timing or effect text; the independent all-row source audit supplies completeness review. The table witness adds behavior the sheet matrix cannot establish: paid Recovery, zero-pool block, exact undo/redo, actual all-resource debit for both Psychic Blast modes, owner/outsider boundaries, four/five-Victory gating and revocation, and retention of the supported rolled Dragon Breath route. Manual oath use checks the persisted event’s manual flag and unchanged live values.

The starting-reward witness independently expects Artisan’s printed 1 Wealth, 0 Renown and 240 project points, then verifies Shattered Legacy’s broken Grand Scarab and repair-source entitlement. Owner and Director agree on the actual record; unauthorized queries and initialization fail. Reinitialization, approved career replacement and historical restoration retain the exact original award identities and amounts.

The legacy-only fixture is justified because current public admissions already create the reward record. It publicly creates/adopts/changes a hero, removes only the newer reward field to simulate old storage, then tests initialization through the authenticated public mutation. The changed Aristocrat cannot replace the original Artisan reward. Stale/unauthorized requests, retry identity, exactly one revision increment, unchanged live state, absent unauthorized receipt and missing-origin refusal catch distinct real failure modes. The direct historical fixture is disclosed and is not presented as the live API proof.

No further blocking proof-code issue was found. The final assertions passed the lead’s integrated local check; deployed API results remain blocked. No tests or services were started by this reviewer.

## Lead verification record

The lead's full `pnpm check` on `faa9b1e` passed: 345 engine plus 519 app/script tests
(864 total), including final proof assertions, and the production build. This records the lead's
run, not an additional reviewer execution. The isolated CT114 deployment of `b15fc59` failed
its existing initial function-push readiness guard before any live API scenarios could start.
No retry or infrastructure repair was attempted; the environment is stopped with data retained.
[Evidence and logs](../evidence/V85/README.md) distinguish local proof from the blocked live gate.
The static/source review verdict is unchanged; delivery acceptance is not granted.
