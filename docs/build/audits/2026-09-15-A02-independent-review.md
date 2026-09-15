# A02 independent code and rules review, 2026-09-15

Reviewer: `review_a02`, fresh review context. Baseline: `3b06832` plus the A02 repair in the
shared working tree. The concurrently built A07 files were not changed by this review.

## Verdict

The original A02 repair passes independent rules review. Code review found one remaining
important owner-review queue defect, reproduced it, and repaired it at the coordinating agent's
request. The coordinator independently reviewed that query/index/test repair and passed it.
The newly settled Q-CHAR-2 follow-up is implemented and locally verified below. The coordinator
independently read the confirmed policy, helper, activation and persisted tests and passed the
follow-up: downward caps, negative-value preservation, compatible counters, atomic resource refusal
and shared preview. Final code/rules verdict: **pass**, with these separate reviewer identities.
Browser/visual verification, coherent whole-tree checks, deployment/codegen and hosted CI remain
the coordinator's integration checks and are not claimed here.

### Latest-specification follow-up

During review, the separate ruling thread committed `afe6690`, resolving Q-CHAR-2. The latest
`character-wizard-spec.md#current-values-when-a-build-changes` and R03 section 3 were read before
implementing the follow-up. They require `min(oldCurrent, newMaximum)` for compatible Stamina and
Recoveries, no upward refill or added zero floor, preservation of conditions/counters, a shared
preview and atomic activation, and explicit reconciliation instead of mapping incompatible resource
types. This is a settled user-selected policy, not an inferred rulebook mechanic. The earlier
preserve-all/uncertainty contract below describes the reviewed baseline and is superseded by this
follow-up. The coordinator authorized its implementation here and independently reviewed it afterward.

## Finding and repair

**P2 — an owner's new submission disappeared after enough campaign review history.**
`characters.reviews` scoped the Director query correctly, but the owner path still read
`by_campaign_status`, took 200 rows, and only then filtered by owner. That index orders by status
before creation time: 205 withdrawn rows could displace a newly created pending submission.
Another member's rows could also consume the whole limit. The party panel then reported no
submission despite a persisted pending row. This follows the existing review visibility contract;
no new product question is required.

An independent persisted regression failed before the fix (the pending row existed, but its owner
could not see it). The fix adds `characterReviews.by_campaign_owner` and scopes both audience
branches before the descending bounded read. The two permanent regression cases in
`tests/app/character-review-queue.test.ts` cover same-owner and other-owner withdrawn history,
real admitted source characters, actual pending state, newest-first order, audience isolation and
the 200-row response bound. No review history is deleted.

The stale implementation note in `docs/character-sheet-spec.md` was also refreshed: Catch Breath
now invokes the shared ability operation, combat Recovery delegates there, and turn state reads
the current encounter. This documents the delivered integration without altering its authority.

## Independent rules research

All rules research used Git blobs at pinned Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`; no online rules or updated vendor material was used.
The current owning specification and question answers were checked before treating any issue as
unresolved.

- `en/unified/md/class/fury.md`, **Basics**, fixes Might and Agility at 2 and prints the three
  remaining-score arrays. Q-R-101 in `character-wizard-spec.md` explicitly supplies assignment in
  any order, initially blank slots, fixed scores locked and equivalent named input. The shared
  assignment transition and evaluator honor all nine distinct permutations, including repeated
  values, partial assignments and moves between slots. They refuse fixed-score or multiset changes.
- Clean Heroes, **Culture Benefits** and **Caelian Empire**, establish the culture-language grant
  and automatic common tongue. The independently inspected **Languages by Ancestry Table** and
  **Vaslorian Human Languages Table** contain the implemented 32 distinct extra-language choices
  after removing Caelian and deduplicating Khoursirian. Q-R-100/102 already settle this pool and
  exclusion of dead languages; the separate dead-language table is not imported as selectable.
- `en/unified/md/chapter/making-a-hero.md`, **I Speak Their Language**, explicitly permits leaving
  language choices open. The repaired Soldier fixture has two entitlement slots, one Vaslorian and
  one explicit `null`, plus automatic Caelian and culture Anjali. It does not silently invent a
  replacement language or discard the deferred entitlement.
- Fury **Basics** gives starting Stamina 21 and 10 Recoveries. Mountain's printed +9 per echelon
  gives 30 maximum at level one; Recoveries gives floor(maximum / 3), hence 10, and Winded gives
  half maximum, hence 15. The source/fixture suite verifies every provenance quotation and the
  remaining hand-computed values: Might/Agility 2, Intuition 1, Reason/Presence 0, speed 6,
  stability 2, size 1M, disengage 1, potency 0/1/2, saving threshold 5, Renown 1 and wealth 1.
- `rule/character/potency.md` says the potency characteristic is determined by class, and Fury
  prints Might-based potencies. Removing the resolved Q-CHAR-12 uncertainty is consistent with
  the existing research/specification. The labeled Stamina-term and initial Ferocity-zero
  interpretations remain explicit. Ferocity's source distinguishes combat grants from its
  outside-combat behavior; this creation repair does not automate deferred runtime grants.
- Q-R-103 already establishes the aspect-dependent kit grant. Berserker/Mountain remains the
  delivered option subset. R03's seven granted abilities and source snapshots remain intact;
  no extra feature automation was introduced. First admission starts from the evaluated baseline;
  later activation in the reviewed baseline preserved played live values and recorded changed
  maxima. The subsequent Q-CHAR-2 answer now replaces those provisional markers with downward caps.

Q-CHAR-10 and Q-CHAR-11 were unresolved at this initial review checkpoint; they were subsequently
answered and are implemented in [the final character-rulings follow-up](2026-09-15-A02-final-character-rulings.md).
Q-CHAR-2 was answered during this review and implemented below. The original supported fixture avoids the under-budget
and collision cases. Broader advancement,
restoration, reconfiguration and transfer questions remain their separately deferred work;
no answered Q-R-100–103 or Q-CHAR-12 question was reopened.

## Code and verification evidence

- Independently ran the six focused evaluator/source/live-state/draft/admission files:
  **38 tests passed**. Tests verify source quotations against pinned blobs, whole-result fixtures,
  all array permutations, language tables, persisted initialization/live preservation, source and
  audience payloads, duplicate-id rejection, canonical saved provenance, late admission roster
  locks and long review history. Source tables and the central formulas above were also read
  independently instead of relying solely on test assertions.
- Known decision ids receive canonical pinned source/branch references. Unknown ids stay visible
  as invalid diagnostics; fabricated branches cannot bypass duplicate-id detection.
- Save/activation paths check ownership and current edit/roster locks. Idempotent saved assignments
  preserve a single revision on retry. Destination paused/combat checks run before first admission
  creates a live record; refused approvals preserve both the pending row and unattached character.
- The final draft/admission/queue run passed **22 tests in three files**, including the latest
  Q-CHAR-2 cases. The queue fixture uses separately owned, actually admitted characters.
- The final four focused source/evaluator/live-state files passed **21 tests**, giving **43 focused
  tests across seven files** after the follow-up.
- Focused ESLint passed; a subsequent whole-tree TypeScript check passed after the coordinator
  repaired an unrelated concurrent audience typing error.

## Q-CHAR-2 implementation and validation

`shared/evaluate/liveReconciliation.ts` now computes the same preview consumed by activation.
Owners receive it through `characters.get` and draft sheets; Directors receive it on the proposed
sheet. The sheet lists current/maximum before and after. Activation rereads current live values and
updates the build and caps in the same transaction; it records the actual reconciliation in the
attributed admission/build event. A differing resource name is displayed and refused before any
activation writes. No automatic conversion or new resource-reconciliation workflow is invented.

Tests exercise 20/30 → 20/36 and 7/10 → 7/12, 20/30 → 18/18 and 7/10 → 6/6, negative Stamina
preservation, unchanged conditions/counters/temporary Stamina/resource/origin, preview-versus-event
equality, persisted activation, idempotent retry and incompatible-resource refusal preserving
the pending review, effective build, live values and events. Synthetic future baselines exercise
the lifecycle without widening the supported wizard options.

Maximum-only question markers are removed from current shared contracts, public reads, sheet UI
and newly written activation events. The optional legacy stored field remains schema-compatible
for existing rows and is cleared on their next successful activation. Old immutable events remain
historical records. The coordinator's independent follow-up review passed; deployment/codegen and
the final integrated checks remain root-owned.

The wizard browser test now exercises dragging, blank assignments, fixed scores, automatic
Caelian, regional languages and explicit deferral. This reviewer inspected the control paths but
did not execute or visually inspect the deployed browser in this task.
