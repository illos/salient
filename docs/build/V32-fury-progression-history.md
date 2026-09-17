# V32: Fury advancement and restorable character history

| Field | Value |
| --- | --- |
| Family | V |
| Primary track | Characters |
| Owner | Codex character team |
| Milestone | First progression slice under V08 |
| Rules review | required |
| Depends on | V25, A09; V29 integrated UI contracts |
| Unblocks | Further class progression and dependent grants |
| Status | Merged and live verified — implementation `73b7ab4`, integration `ea831d6` |

## Goal

Advance the existing campaign-attached Devil/Berserker Fury from level one to level two through
scoped choices, then browse and restore actual recorded builds. Preserve current play values,
independent authored details and exact-revision campaign review. This is the next bounded step
in the eleven-class, levels 1–10 editor track; it does not deliver the entire progression tree.
The user authorized starting this slice on 2026-09-16 after V25's shared-runtime closeout.

## Spec references

- `docs/character-wizard-spec.md#level-up` — eligibility, source timing and scoped owner choices.
- `docs/character-wizard-spec.md#current-values-when-a-build-changes` — retain amounts, cap downward.
- `docs/character-wizard-spec.md#4-wizard-flows` — full editing and campaign review.
- `docs/character-wizard-spec.md#5-progression-history` — immutable snapshots, additive restoration.
- `docs/character-wizard-spec.md#7-revision-and-review-lifecycle` — exact revisions and stale edits.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — sourced content and adapters.
- `docs/build/V08-classes-and-advancement.md` — eleven-class scope and soft respite dependency.

## In scope

- Shared level-qualified definitions/evaluation: existing level-one builds remain compatible;
  supported Fury level two has its automatic grants, source-correct Stamina/recovery/winded values,
  one supported perk (Danger Sense), and either Berserker level-two ability. Other legal perks
  remain visibly unsupported in this bounded slice; list their sourced pool without claiming support.
- Campaign-attached Fury 1→2 advancement from its exact effective revision, with 16 cumulative XP
  and explicit manual confirmation that the advancement occurs during a respite. The formal respite
  workflow remains a soft dependency: confirmation supplies timing context, awards no XP and restores
  no resources. Add XP to the existing Director-only numeric adjustment workflow for development verification and manual campaign tracking; this does not award XP automatically.
- Persisted scoped advancement draft separate from pending full edits. Save/reload retains choices.
  The backend rejects earlier-choice substitutions, stale bases and unsupported target builds.
- Owner finalization applies the complete advancement without Director approval. An older pending
  full edit becomes stale and cannot overwrite advancement through resubmission or old approval.
- History list and exact snapshot preview; owner restoration creates a new chronological revision
  pointing at the original snapshot. Preserve intervening history and current authored/live data.
  Attached restoration uses ordinary full-edit review, including the owning Director exemption;
  unattached history/restoration works without inventing campaign authority or live resources.
- Full editing of the supported level-two build through the existing wizard. Parent changes prune
  incompatible progression choices and remain explicit; existing Elementalist level one regresses.
- UI and headless clients use the same operations; ownership, privacy, idempotency, stale writes
  and combat locks are verified. History does not grant peers broader sheet/private-note access.
- Exact source references, independently calculated expected builds, actual Forge export comparison,
  and durable class/progression knowledge for the consuming engine and UI tracks.

## Out of scope

- Unattached scoped advancement until an outside-campaign XP workflow exists; general higher-level
  creation, other subclasses/classes, level three onward, and the rest of the perk catalog.
- New respite lifecycle, XP award mechanics, one-time inventory grants, detachment/sharing workflows,
  incompatible resource conversion, Forge file adapters and class-specific gameplay automation.
  Existing independent inventory/state is not copied or replayed during restoration.

## Inputs and dependencies

V25's current builds, separate baseline/live state, source snapshot and exact-revision review are
hard dependencies. Source timing remains authoritative while formal respite is unavailable.
Pinned Compendium is the only rules authority; Forge Steel provides a separately checked structural
reference. Future embedded export definitions are not completed advancement choices or real history.

## Deliverables

- Source contract and independent level-two Fury fixture; before/after Forge reference metadata.
- Shared level-aware evaluator/decision contracts and minimal sourced content expansion.
- Persisted progression/history operations, backward-compatible optional revision metadata and
  eligibility offset, separate scoped draft, and meaningful persisted operation tests.
- Sheet entry points, scoped advancement choices, full-editor compatibility, historical previews
  and reviewed restoration UI; browser evidence of actual resulting state.

## Acceptance checks

1. Existing Fury and Elementalist level-one fixtures and old saved revisions remain readable and
   unchanged. Unsupported levels/classes remain explicit, never silently evaluated as level one.
2. Advance the existing Fury with the source-derived level-two choices: maximum Stamina 30→39,
   recovery 10→13, winded 15→19, new automatic feature/perk/ability; no extra skill or characteristic.
   Compare every delivered trait/feature/grant and scalar to independent source expectations and
   actual completed Forge level-one/level-two exports. Explain any reference disagreement.
3. Owner can save/reload a scoped draft and finalize at the source eligibility/timing. XP alone
   does not change level. Earlier choices, out-of-pool values, unsupported targets, stale bases,
   nonowners and combat-locked writes are refused without partial state changes.
4. With Stamina 20/30 before advancement, read back 20/39 afterward. Compatible resources,
   conditions, XP, independent descriptions and unrelated data persist. No automatic respite heal.
5. Pending full edit based on level one becomes stale when advancement activates; its old approval
   and unchanged resubmission cannot revert the new effective build. Legitimate full editing still
   follows existing review; level-up cannot smuggle unrelated changes through its exemption.
6. History preview does not mutate. Restore an actual level-one snapshot after level two: append a
   new latest revision with restoration provenance, keep all old entries, and preserve current data.
   For a player-owned attached hero, effective level two remains until that exact restore is approved.
   Verify downward caps (39 current→30 maximum), incomplete snapshots and later forward restoration.
7. History reads enforce owner/Director access and keep private notes private. Test another owner,
   ordinary campaign peer, nonmember, stale writes and duplicate command IDs through persisted reads.
8. Browser journeys demonstrate advancement, saved draft, history/restore review and source cards;
   authenticated headless reads agree. Repeat relevant existing character/table regressions.
9. `VITEST_MAX_WORKERS=1 pnpm check`, isolated backend push/seed, independent implementation review
   and independent rules review all pass. Retain screenshots, actual targets, commands and limitations.

## Ability design and playtest evidence

No parser/resolver implementation is assigned. Newly granted abilities expose complete source text
and retain existing generic supported cost/roll behavior; their bespoke effects remain manual.
If implementation requires a new automated mechanic, first add its source-backed design and the
per-ability live evidence required by the build process; do not extend automation incidentally.

## Rules research

Research the pinned Fury class/advancement table and Berserker second-level grouping, Unstoppable
Force, Special Delivery, Wrecking Ball, Danger Sense, perk entitlement, experience and respite.
Researcher records exact paths/quotes, ordered grants, restrictions and independent expected values
before implementation. Existing Q-CHAR-2/3/4 govern reconciliation, eligibility and additive history.

## Open questions

None requiring a new user ruling at claim. Unattached XP workflow and broader perk coverage are
explicit later scope. Report new material source ambiguity through the existing question queue.

## Work log

2026-09-16: claimed from main `f7137dc` in
`/srv/presidium/projects/salient/characters-build`, branch `slice/V32` (V31 is already the UI
thread's next slice). Parent owns spec/UI/integration; bounded source/evaluator, Forge-reference/progression-UI
and backend tasks run independently with file ownership. Independent review follows implementation.
Read V29's `useCommand`/toast change and preserve it. Intended isolated target: anonymous local
backend 3230/site 3231, frontend 5290. Confirm configuration before starting/syncing; shared
5180/3212 is not a branch-development target. Limit test workers and serialize broad checks.

At handoff distinguish a reviewed branch from a completed merge. When integration is authorized,
include backend/content/frontend sync and changed-feature verification at the shared playable
URL under the standing merge-completion directive, preserving compatible play data.

Implementation and intermediate verification:

- Implemented level-qualified definitions/evaluation, scoped drafts/finalization, immutable paginated
  history and additive restoration, with source-correct manual feature text. Added Director-only
  `/adjust xp` because inspection found the existing numeric adjustment registry had no XP writer.
- Source/evaluator author and backend author independently reviewed each other's component. A fresh
  whole-slice reviewer separately inspected all changes and rules sources. Fixed nested restore-command
  identity collisions, incorrect standalone attachment labeling, incomplete-history draft restoration,
  legacy stale-edit markers and acknowledged standalone-save UI state.
- `VITEST_MAX_WORKERS=1 pnpm check`: pass, 106 engine plus 349 app/scripts tests (455 total),
  source/content/link checks and production build. Local backend 3230 successfully compiled; reseeded
  473 source entries. No shared runtime update.
- Actual Forge UI build/export/import/level-up/export/reimport captured at both levels; all exported
  fields are unchanged on round trip except collision-reassigned hero ID. See reference metadata.
- Browser attempts: first timed out before login during Vite dependency optimization; second completed
  advancement and baseline/live preservation before a test-only doubled source-path prefix failed.
  Corrected that path. Third encountered an actual Convex one-second execution timeout under host
  memory pressure before choosing level-up options. Preserved all logs; stopped owned services and
  queued the final run behind peer browser work. No assertions or backend limits relaxed.
- Visual review corrected the empty automatic Stamina section and historical source-card attribution
  (the latter now follows the recorded class, including Elementalist). Final browser evidence pending.

Final closeout:

- Coordinated a browser window after the UI and engine threads completed. Existing Elementalist
  wizard/reload/review/source regression and Fury advancement/history journey both passed (54.1s).
- Final screenshot inspection found inherited feature badges labeled with current hero level. Fixed
  `web/character-sheet/sections.tsx` to show source grant level; targeted ESLint/types/build passed,
  and the full Fury journey passed again (38s), explicitly checking Ferocity L1 and Unstoppable Force L2.
- Authenticated persisted readback matches all expected build fields and all 20 source grants exactly.
  Verified 20/30→20/39 without healing; restore stayed pending until Director approval, then 39→30.
  Original baseline/authored data match, and all four chronological revisions remain.
- Durable [evidence](evidence/V32/README.md) contains screenshots, logs and compact readback; raw
  captures remain in `.playtest/v32`. Fresh [whole-slice review](../reviews/V32-independent-review.md)
  closes implementation and rules acceptance.
- Stopped every owned runtime after capture; 3230/3231/5290 have no listeners. The shared playable
  environment is unchanged. This is a reviewed branch handoff, not a completed merge.

Branch handoff: implementation/evidence committed as `d9da1df`. All 186 Markdown link checks,
whitespace checks and the branch commit gate pass. No merge or shared runtime update was performed.

User-requested pause: see the [character checkpoint](../checkpoint-2026-09-16-characters-v32.md)
for the saved branch, newer-main observation, evidence and resume instructions.

## Integration — 2026-09-17

The user authorized merging V32 and updating the shared playable app before expanding supporting
character choices. Rebased all three original commits onto main `a0ac6d4` without conflicts;
`git range-diff` reports identical patches. New implementation commit is `73b7ab4`, with checkpoint
head `6456651`. The complete branch commit gate and whitespace check pass.

All new development workloads run on CT114. Isolated environment `characters`, Compose
`salient-characters-dev-2389e144b9dd`, uses an independent anonymous backend and the HTTPS origin
`https://salient-characters-dev-aa988a1a3752.tail41404c.ts.net`. The backend pushed successfully
and loaded the 473-entry V32 source snapshot. Original local runtimes remain stopped.

The infrastructure client has the known sibling-worktree broker cwd issue. A temporary local
launcher preserves its normal archive, source identity and validation but launches only its broker
subprocess from the canonical project directory. No installed helper, grant or credentials changed.

[Independent integration review](../reviews/V32-integration-review.md) passes static checks,
including all 62 source-ledger hashes and 24 retained Forge artifacts. Added a focused rendered
Wrecking Ball paragraph assertion for its interaction with V34 full-source presentation.
Integrated `pnpm check` passed 466 tests (106 engine, 360 app/scripts), lint/types, content/vendor/foe
checks and production build. Generated Convex API types exactly match the checked-in declarations.
The first browser run passed V25 Elementalist, V32 progression/history and V21 character-sheet
journeys, including the Wrecking Ball paragraph. The table audit failed after a one-second
`history:status` timeout inside `safeGetAuthUser`; its unchanged isolated retry passed (1.5 minutes). No assertion or timeout was relaxed.
Shared live verification remains pending until integration. Screenshots and compact authenticated
readback are retained under `docs/build/evidence/V32/integration/`.

### Shared-app completion

V32 merged into main at `ea831d6`. `presidium-dev up` from the clean canonical checkout updated
shared CT114 Compose `salient-dev-b90776c53141` at
`https://salient-dev-fc4f48cb09a0.tail41404c.ts.net`. Backend functions pushed successfully,
content reseeded to the exact 473-entry snapshot, frontend restarted, existing data volume retained.
No application data reset or migration occurred.

Both actual shared HTTPS browser journeys passed in 1.1 minutes: Elementalist creation/reload/review
and Fury advancement/history/restoration, including 20 exact source grants and rendered Wrecking
Ball text. No backend timeouts or uncaught errors occurred during shared verification. See
[the shared browser log](evidence/V32/main/browser.log),
[readback](evidence/V32/main/readback-summary.json),
[level-two sheet](evidence/V32/main/level-two-sheet.png) and
[restored sheet](evidence/V32/main/restored-sheet.png).

The character worktree has moved to the next user-assigned supporting-choice slice, V37. Original
Forge artifacts remain preserved there. This closeout changes documentation/evidence only; the
verified running implementation remains `ea831d6` and requires no additional runtime update.
