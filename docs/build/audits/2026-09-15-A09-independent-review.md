# A09 independent implementation and rules review — 2026-09-15

Reviewer: `review_a09`, fresh review context. Scope: the connected
`tests/app/v001-walkthrough.test.ts`, its source record, the browser extension in
`tests/browser/acceptance-extension.ts`, and the Required coverage mapping in
`docs/build/evidence/v001-acceptance.md`. Reviewed the working tree based on `e6ac6b2`.
The coordinator owns final browser execution, visuals, full checks and hosted CI; this report does
not certify those unfinished runs. No application code or vendor files were changed by this review.

## Verdict and verification

**Connected backend implementation: pass. Rules arithmetic: pass. Browser test code and coverage
mapping: pass after the repairs below.** Browser execution remains the coordinator's gate.
Independently reran:

```text
pnpm exec vitest run --project app tests/app/v001-walkthrough.test.ts
Test Files 1 passed (1); Tests 1 passed (1)
Duration 1.52s; test time 1.25s
```

The test creates a fresh `convex-test` backend and uses actual membership, character creation,
save, submission, approval and registered table operations. Inspected the fixture rather than
assuming its name guarantees admission fidelity. The only direct test writes are authentication
setup, content reseeding and disclosed positioning of the server dice counter. No Stamina,
Recovery, ability, encounter or reward state is fabricated to bypass a public gameplay operation.
Manual resource gains are attributed Director adjustments. Accepted dice and changes are read
from persistence. Retry checks cover the blocked action, accepted strikes, Catch Breath, explicit
Victory, cleanup and both Void modes. Correction Undo/Redo retains the original event and recorded
rolls. Void reset changes values to different numbers before restoring them, removes an actual
later catalog foe, and retains the paused session/roster lock; it cannot pass as a no-op.

## Independent source pass

Read `agent.MD`, the owning Required checklist and walkthrough, R04 and R05, and the local source
files below. Verified the vendor checkout is pinned at
`fb83a789da8f0327a389c277a0c790b1648d5810`. No online rules research was used. Source paths below
are relative to `vendor/steel-compendium/en/unified/md/`.

| Case | Independent calculation and authority |
| --- | --- |
| Free strike and correction | `feature/ability/common/melee-weapon-free-strike.md`, `rule/dice/bane.md`, R04 §10.10: 8 + 2 + Might 2 = 12, tier 2, damage 5 + 2 = 7, foe 15 → 8. One bane changes total to 10, tier 1, damage 2 + 2 = 4, so reconciliation restores 3 to Stamina 11. |
| Multi-target fixed-cost action | `feature/ability/fury/level-1/thunder-roar.md`, `rule/dice/edge.md`, `rule/dice/bane.md`, `chapter/kits.md`, `kit/mountain.md`, R04 §10.6: 7 + 6 + 2 = 15. One edge gives total 17/tier 3; two banes lower tier 2 to tier 1 without subtracting 4; no modifiers stays tier 2. Melee and Weapon permit Mountain's tier-3 +4 even though this is an Area ability. Damage is 17/6/9; current 11/15/15 becomes −6/9/6. The printed cost 5 blocks at 0 and leaves 1 after an explicit adjustment to 6. Push remains manual. |
| Creature strike and Recovery | `rule/monster/creature-free-strike.md`, `monster/goblin/statblock/goblin-warrior.md`, `rule/health/temporary-stamina.md`, `rule/health/recoveries.md`, `feature/common/maneuvers/catch-breath.md`: Goblin Free Strike is 1 without dice; temporary 3 → 2 and ordinary 20 stays 20. Recovery value floor(30/3) = 10, so Catch Breath makes ordinary 30, Recovery 10 → 9, temporary remains 2. Later FreePlay healing caps 22 + 10 at 30 and spends the next Recovery. |
| Clock and Malice | `rule/monster/malice.md`, R05 §§3/5: initial average Victories 0 plus one hero and round 1 yields 2. One explicitly awarded Victory makes a later start add 1 + 2 = 3. Void keep retains 13 under the settled product decision; the subsequent combat therefore reaches 16, not 3. Normal cleanup clears the pool. |
| Common recorded actions and save | `feature/common/main-actions/defend.md`, `feature/common/maneuvers/aid-attack.md`, `rule/general/saving-throw.md`: main action, maneuver, and ordinary d10 success on 6+. Their benefits and condition removal remain manual under the current scope. Spent allowances warn and do not block these invocations. |
| Cleanup and Void | `rule/resource/surge.md` and `rule/health/temporary-stamina.md` support ordinary end cleanup. The formal-closeout and Void sections of `table-spec.md` already answer explicit once-only rewards, no synthetic final turn, archive floors, keep/reset and paused-state preservation. No new ruling is needed. |

The Stamina 30/Recoveries 10/Might 2 baseline is an actual evaluated admission and agrees with the
separately reviewed R02/R03 fixture contract. This review does not reopen those formulas or automate
deferred Fury grants.

## Coverage findings

**Resolved — actual pending interaction survival during combat reconnect.**
Initially, the browser extension opened a Thunder Roar targeting draft, verified it survived the
Director's reload, then verified the owner's reload cleared it. That proved target preparation and
active-turn continuity, but did not prove a separate persisted pending action card survived, as
required by A09 acceptance check 4. The existing table-audit browser test resolves its guided card
before later reload. The coordinator repaired the extension during review. It now opens a real
actor-bound guided `/table roll`, retains the same interaction ID, checks its `awaiting-input` state
and displayed log card after every role reconnects, then responds through the live CLI and retries
the same command ID. It asserts the resolved event pointer and exactly one event for that response.
The target-draft clearing and active-turn identity checks remain separate, and the original event
IDs remain present. Re-read the updated code and public query/interaction contracts: the coverage
gap is closed in test code, subject to the coordinator's browser execution.

**Resolved — explicit Runtime specialization coverage row.** The owning checklist has that
Required cell. The coordinator added a row pointing to the admitted baseline, pinned foe ability
snapshots, readable sources and unsupported-clause dispositions, including the connected manual
resolution. Re-read the revised mapping; no Required cell is silently omitted.

Other Required areas have identifiable focused tests in the mapped suites. The connected test does
not itself advance to round 2 or successfully rewind as Director; `combat.test.ts` and
`history.test.ts` own those checks. It also does not itself prove the live CLI transport: the
browser extension invokes `pnpm app` against the local deployment. Keep these evidence boundaries
explicit. Full source fidelity is checked by the content/ability suites; a single substring
assertion in the connected test is appropriately complementary.

The performance limitation is honest. The owning tech-stack acceptance section explicitly leaves
prototype duration and numerical budgets unselected. Recording a measured shorter sample does not
establish a one-hour or six-hour pass. Actual duration, heap/DOM trends and any instability must be
reported after the coordinator's run. Browser/visual completion and hosted CI remain outside this
review's executed evidence.

## Follow-up: reload implementation repair

The coordinator's browser run then reproduced a real implementation gap: an owner's persisted
targeting draft survived page reload. Reviewed the narrow `TablePage` entry effect in
`web/table/index.tsx` and its existing `selection.cancel` operation. The effect waits for the
authenticated roster and targeting query, executes once per campaign mount, skips observers and
tables without an active session or owned draft, and submits through the registered command runner.
The operation supports running and paused sessions, resolves ownership from the authenticated user,
and deletes only that user's targeting draft. It neither answers/closes guided interactions nor
changes gameplay or rerolls dice. The mount ref prevents reactive query updates from repeatedly
clearing newly selected targets. This implements A09 acceptance check 4 without new rules content.

The updated connected browser helper independently checks the same active turn, persisted guided
interaction and visible pending log entry through all role reconnects, then checks the owner's
draft is gone and resolves the surviving interaction once through CLI response/retry. Static review
passes for that path; the coordinator owns its fresh browser rerun. The stale theme-test button
locator now matches the actual create-and-open wizard control and changes no product behavior.

The coordinator also applied the robustness recommendation: entry-cancellation errors now appear
inline and reset on campaign entry, rather than replacing the entire readable table after a
possible role/session race. Re-read that repair. Backend authority checks remain necessary even
when the client has just read an eligible role.

## Final bounded question/specification sweep

Compared the current queue against the owning character-wizard scope and contracts, the Required
v0.01 checklist, current evaluator/activation operations and wizard presentation. The parallel rules
thread is still active; this is a dated checkpoint, not permission to freeze future answers.

| Answer | Existing prototype behavior and disposition |
| --- | --- |
| Q-CHAR-2 | Shared reconciliation preserves compatible current amounts, applies downward caps with `Math.min`, preserves negatives/conditions/counters and refuses incompatible resource conversion. Activation is atomic and retires old unresolved markers. Preview/commit and retry coverage exist in `admission.test.ts`; no remaining mismatch found. |
| Q-CHAR-3 | Higher-level transfer/advancement is deferred. The actual level-one first admission starts XP at zero, which is consistent with a zero eligibility offset. No new prototype advancement or transfer workflow is required. |
| Q-CHAR-4 | Progression restoration UI/operations remain deferred. Current saves append immutable build revisions and do not implement an incompatible restoration branch. The answer creates no additional v0.01 gate. |
| Q-CHAR-5 | Filling deferred language choices uses the normal save/submission/Director approval path. No language approval exemption exists. Only Mountain is supported, and dedicated respite kit swapping remains deferred. |
| Q-CHAR-6 | Supported language identities remain the sourced core pools; arbitrary custom selectable identities are not enabled. Authored culture name/description remain allowed, separately from custom languages or deity portfolios. |
| Q-CHAR-10/11 | These newly answered diagnostics and skill entitlement changes were assigned to the active independent A02 reviewer/repair agent. Their completion and focused tests are a final integration dependency, not silently assumed by this sweep. |
| Q-CHAR-8/12 | Melodrama is outside the level-one Fury scope. Fury potency already uses its class-named Might basis and no Q-CHAR-12 uncertainty is emitted. |

Found one additional presentation mismatch and sent it to the A02 artifact owner: culture-language
metadata still listed resolved Q-CHAR-6 and career-language metadata still listed resolved
Q-CHAR-5, while the wizard renders every such entry as `open`. The culture-name note also wrongly
associated Q-CHAR-6 with assembled cultures. The mechanics already follow the answers; remove the
stale open labels and correct the note alongside the Q-CHAR-10/11 artifact update. No new user
question is needed.

The four remaining open queue entries do not block the confirmed prototype: Q-CHAR-7 concerns a
Revenant/Dragon Knight trait combination; Q-CHAR-9 concerns project-point careers absent from the
supported Soldier path; Q-CHAR-13 concerns optional higher-level starting treasure; Q-R-201 concerns
later transfer/duplication/readmission, explicitly outside the one-time-admission journey. None has
an existing answer that was overlooked by this scope check. Q-A-200's provisional maxima bridge
has been retired; the coordinator marked its engineering follow-up completed, explicitly preserved
the earlier description as historical context, and did not invent a user ruling. Re-read that update.
Old question identifiers retained only in compatibility types/comments do not create gameplay
defaults; no additional emitted stale provisional mechanic was found outside the assigned A02
diagnostic repair.

This sweep uses current recorded rulings and the already completed pinned-source reviews. It
introduces no rules interpretation, broader V1 feature requirement or additional approval gate.

Cross-reviewed the final performance-helper correction: `li[data-disposition]` matches the actual
rendered game-log entries in `TablePage`, unlike the absent `.game-log` selector. The 60 real
condition operations now record seven post-GC samples for all three roles, reject zero-row
measurements, enforce the existing 50-entry rendering limit and require a full 50-row window from
cycle 40 onward. The duration/workload label matches the loop, and no invented heap threshold or
long-duration certification was added. Execution and measured trends remain in the coordinator's
final browser evidence.

## Final Q-CHAR-10/11 repair: independent pass

Independently reviewed the completed evaluator repair, contract/decision metadata, new engine and
persisted-operation tests, and `2026-09-15-A02-final-character-rulings.md`. Re-read the pinned Devil
Traits budget, Making a Hero's Choosing Skills paragraph, Fury's fixed Nature grant and Primordial
Aspect's Berserker Lift grant. The source allows skill replacement when two sources grant the same
specific skill; the fixed-grant/discretionary distinction is correctly attributed to the current
user interpretation rather than misrepresented as an explicit source restriction.

The implementation allows an explicit zero- or two-point ancestry selection to remain complete
with a warning and no uncertainty tag, while preserving over-budget rejection and unrelated
missing-choice diagnostics. Skill accounting collects all grants before resolving collisions;
fixed Nature/Lift grants take priority regardless of input order, and chosen collisions invalidate
the affected choices without granting an unrestricted replacement. The unsupported fixed/fixed
branch is labeled rather than inventing a replacement: no supported Soldier/Berserker option
requires that later workflow. No blocking defect found within delivered scope.

Independent reruns:

```text
pnpm exec vitest run --project engine tests/character-creation-rulings.test.ts tests/character-evaluator.test.ts tests/character-derived-values.test.ts tests/fury-decisions.test.ts
4 files passed; 23 tests passed; duration 681ms

pnpm exec vitest run --project app tests/app/character-rulings.test.ts
1 file passed; 2 tests passed; duration 1.10s
```

The persisted tests prove an under-budget revision evaluates, saves, submits and activates through
public APIs; a duplicate chosen Lift saves as invalid, cannot submit, and preserves the previous
effective baseline and live state. Rechecked that all resolved question metadata is now removed
from wizard decision `questions`, including the previously reported language labels.

The browser addition removes Beast Legs from the completed fixture, checks the visible unspent
warning and exact `complete` status, then restores the canonical fixture before admission. The
coordinator corrected substring completion checks to exact text, avoiding `incomplete` false
positives. Static review passes; the coordinator's final browser run owns execution evidence.
The earlier Q-CHAR-10/11 integration dependency and stale-language-label finding are resolved.

## Latest question checkpoint after concurrent rules commits

Read `f73b501` (Q-R-201 destination admission) and `5a1f05a` (remaining-question deferrals),
then rechecked the current queue and exposed character/campaign operations. **The reviewed queue
now has zero open questions and three explicitly deferred questions: Q-CHAR-7, Q-CHAR-9 and
Q-CHAR-13.** Their research recommendations remain unadopted; the deferral is the user's decision.
The earlier four-open count above is historical to that sweep and is superseded by this checkpoint.

Q-R-201 now requires a fresh campaign live record at destination admission: Stamina/Recoveries
full against the admitted build; XP/Victories, conditions, temporary pools and campaign-specific
adjustments cleared; other resources initialized normally. This is not a respite or permission
to replay creation grants. Within-attachment build edits still use Q-CHAR-2 preservation/caps.

Inspected `convex/characters.ts`, `convex/lib/characterOperations.ts`, the operation registry,
campaign public endpoints, and character UI/CLI surfaces. No detach, duplicate, import or
readmission operation is exposed. Existing submissions/approvals reject a character already
attached to another campaign. The implemented fresh-character path initializes a null live record
with full Stamina/Recoveries, zero Ferocity/XP/Victories and clear conditions/counters, consistent
with the new answer. Session close/start preserves the same attachment and correctly does not
trigger destination initialization. No executable prototype repair is needed for this answer.

Future transfer implementation must explicitly recognize a new attachment instead of assuming
`liveState === null` identifies every admission: the current activation helper retains non-null
live values for within-campaign edits. That branch is not proof that Q-R-201's deferred transfer
workflow already exists. The owning R03 document explicitly keeps reattachment in later scope.
This review does not introduce that workflow or certify future transfer behavior.

`ProjectionUncertaintyId` in `shared/contracts/entities.ts` still permits the historical
Q-R-200/Q-R-201 identifiers, and its contract test verifies those identifiers remain documented.
That is a compatibility vocabulary, not an emitted current projection or an active question.
The source/spec resolutions and latest queue checkpoint above supersede the old type comment's
“open question” wording. No runtime change or new transfer workflow was made during the frozen
final browser run.

## Coordinator integration closeout

The final local full check passed 392 tests plus lint, types, source/vendor comparisons, links and
production build. The final combined browser run passed all eight scenarios, including the
reviewed pending-card/reload repair, exact under-budget completion check, invitation link and
60-action bounded-log sample. Independent desktop visual review passes. See
[the acceptance record](../evidence/v001-acceptance.md) for scope and measured limits.
