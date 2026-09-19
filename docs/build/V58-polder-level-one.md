# V58: Complete Polder level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team — Astra Polder implementer |
| Rules review | required |
| Depends on | V45 |
| Unblocks | V44 first-wave audit |
| Status | see `STATUS.md` |

## Goal

Finish all six level-one Polder purchased choices in the existing character wizard. Preserve
permanent derived values and expose conditional gameplay effects as readable source text.

## Spec references

- `docs/character-wizard-spec.md#3-decision-system` — choices, budgets, grants, manual effects.
- `docs/character-wizard-spec.md#4-wizard-flows` — creation and full editing.
- `docs/character-wizard-spec.md#7-revision-and-review-lifecycle` — persisted revisions and live state.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — reference comparisons.
- `docs/build/astra-character-workflow.md#unit-contract` — fresh complete ancestry unit.

## In scope

- Enable Nimblestep, Polder Geist and Reactive Tumble at their printed costs.
- Preserve the four-point budget, two signatures and existing quick-build traits.
- Save/read back new choices and readable effects; replace traits without stale grants or live resets.
- Completed same-build Forge counterpart and observed Salient counterpart.

## Out of scope

Gameplay automation, new movement controls, class expansion, source updates and general importer
work are excluded by [V44](V44-character-option-delivery.md#goal-and-scope).

## Inputs and dependencies

Main `6459c8d`; existing V25 Polder/Fire Elementalist build and V45 modular composition. Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`, Forge `5a846aadb623a9855a023e9403bb887a956c341f`.
No shared contract change, stub, evaluator rewrite or new backend behavior is needed.

## Deliverables

- `shared/content/ancestries/polder/level-one.ts` — complete option support.
- `tests/character-v58-polder.test.ts` — manual effects and new-option budget boundaries.
- `tests/app/polder-v58.test.ts` — persisted readable sheet and trait replacement/live-state case.
- This source-backed acceptance record and retained Forge/Salient evidence under V58.

## Acceptance checks

1. Complete corrected V25 Bethell with Nimblestep + Polder Geist + Reactive Tumble (2+1+1).
   Baseline has exactly those purchased traits plus Small! and Shadowmeld, size 1S, speed 5,
   Disengage 1, no corruption/frightened immunities. The three manual effects add no unconditional
   movement bonus. Other V25 class/background values remain unchanged.
2. Nimblestep + Fearless is complete at four points. Adding Polder Geist is invalid at five points,
   with `budget-exceeded` and no purchased trait grants. Existing budget validation remains shared.
3. Admit, query and read the new build's sheet through existing character operations. All three
   purchased source texts are present. Save the quick-build replacement, submit and approve it;
   query again and see old purchased traits removed and Disengage 2, with live state unchanged.
4. Forge counterpart uses exactly the same supported choices; retain an authentic export and
   readable sheet, then save/reload in Salient. Record observed comparisons, not evaluator predictions.
5. Run focused tests, `pnpm check` and the required full browser suite on CT114. Existing V25
   ancestry switching, V32 progression/history and character privacy tests supply unchanged-path
   coverage. Obtain independent implementation then rules review before integration; verify the
   shared playable app afterward.

## Ability design and playtest evidence

Not applicable: no gameplay ability is implemented or automated. Shadowmeld remains the existing
readable ability; the newly supported purchased traits remain manually resolved gameplay effects.

## Rules research

Read fresh from the pinned Compendium before changing options. All paths below are relative to
`vendor/steel-compendium/en/unified/md/`:

| Source | Independent expectation |
| --- | --- |
| `feature/trait/polder/polder-traits.md` | Four ancestry points; quick build is Corruption Immunity, Fearless, Graceful Retreat. |
| `feature/trait/polder/small.md` | Signature sets size 1S. |
| `feature/ability/polder/shadowmeld.md` | Signature maneuver, manually resolved; no always-on hidden status. |
| `feature/trait/polder/corruption-immunity.md` | Cost 1; level + 2 corruption immunity, hence 3 at level one. |
| `feature/trait/polder/fearless.md` | Cost 2; cannot be made frightened. |
| `feature/trait/polder/graceful-retreat.md` | Cost 1; +1 Disengage shift distance. |
| `feature/trait/polder/nimblestep.md` | Cost 2; ignore difficult terrain and move full speed sneaking. No flat speed increase. |
| `feature/trait/polder/polder-geist.md` | Cost 1; at combat turn start, qualifying enemy line-of-effect/hidden/concealment condition grants +3 speed until turn end. Not a permanent increase. |
| `feature/trait/polder/reactive-tumble.md` | Cost 1; optional free triggered action shifts 1 square after forced movement resolves. Not a Disengage bonus. |

The source gives no extra prerequisites or nested choices for the three new options. Existing
base statistics and Disengage calculation remain unchanged. Generic purchased-trait composition
already resolves each source file into the sheet. No new ancestry-specific evaluator code is needed.

### Option-to-witness table

| Options | Completed counterpart | Status |
| --- | --- | --- |
| Corruption Immunity, Fearless, Graceful Retreat | Corrected V25 Bethell; [metadata](../research/v25-corrected-forge-reference.json), [portable export](../../tests/fixtures/v45-reference/Bethell-corrected-export.ds-hero), [readable sheet](../../tests/fixtures/v45-reference/Bethell-corrected-sheet.txt) | Existing source audit and comparison; V45 retained the authentic artifacts in the normal checkout. |
| Nimblestep, Polder Geist, Reactive Tumble | Same corrected Bethell with only purchased traits replaced | Fresh actual Forge export and complete persisted Salient browser readback pass; independent comparison recorded in evidence. |
| Small!, Shadowmeld | Both builds | Existing grants preserved in both actual counterparts. |

## Open questions

None.

## Work log

- 2026-09-19: Claimed characters unit on `slice/V58` in
  `/srv/presidium/projects/salient/astra-polder`, fresh from main `6459c8d`. Lead owns STATUS,
  shared integration and CT114 `character-restart` runtime scheduling. No pilot input used.
  Chords calls returned ambiguous provider-session mapping; lead coordinates peer threads.
- Derived expectations above before evaluation. Enabled the three options using existing grants,
  budgets and source readers. Added two evaluator cases and one persisted journey, each documenting
  the concrete failure caught and coverage beyond existing quick-build tests. No runtime commands
  run by this implementer; focused tests, formatting, full checks, browser evidence and reviews pending.

- Lead baseline: clean main `6459c8d` in newly provisioned CT114 `character-restart` passed
  `pnpm check` (691 tests, lint/types/content/build) and the existing
  `v25-elementalist.spec.ts` journey (22 seconds). See [check log](evidence/V58/baseline/check.log)
  and [browser log](evidence/V58/baseline/browser.log); corresponding `.exit` files record zero.
  Fresh content seeded: 483 records at pinned Compendium revision. Main data untouched.
  Integration checkout moved to `/srv/presidium/projects/salient/code/.worktrees/astra-integration`
  because the broker rejects sibling checkouts; the standard helper works there without modification.

- Candidate focused tests: first run failed because the test helper incorporated a space in a
  command ID; changed only its fixture name to `Polder-movement`. Rerun passed all three cases.
  New complete wizard journey passed in 14 seconds, including reload, persisted readback and all
  three source dialogs. Forge export captured after correcting obsolete accessible selectors and
  waiting for editor navigation; initial failed attempts retained. Both rendered builds show speed
  5 / Disengage 1. Independent complete comparison follows in evidence.
- First full candidate check stopped at new engine-test import syntax (NodeNext requires `.ts`
  extensions and JSON import attribute); corrected the test imports. Full rerun pending. Remote
  formatting and these test-only repairs were fetched explicitly; application code remains the
  identical three support flags used by the passing browser journey.

- Full candidate `pnpm check` passed: 286 engine + 408 app/script tests, lint/types, links,
  pinned content and production build. The broker connection returned 143 during the final build;
  the container continued, `docker wait` returned 0 and retained `check2.exit` is 0. No rerun of
  that successful job was needed. Local four changed code/test files match the tested remote bytes.
  Required full browser suite started on the same candidate; no merge or overall acceptance yet.

- **Paused, not merged.** Required full browser run began 53 cases; campaign-sharing passed,
  closeout failed at `closeout.spec.ts:104` with the app's “Function execution timed out (maximum
  duration: 1s)” error, and combat began before the lead stopped the suite. Container exit143,
  OOM flag false. See [raw log](evidence/V58/checks/full-browser.log),
  [error context](evidence/V58/closeout-failure/error-context.md) and
  [termination/archive record](evidence/V58/checks/termination.json). This is failed/incomplete
  verification, never a full pass. The failure is outside changed option code, but root cause and
  whether it reproduces on main are not established. No timeout/assertion changes or blind rerun.
- User explicitly requested a pause if progress became an open-ended detour. Lead paused here
  before backend investigation, preserving both candidates and all evidence. Implementation review
  found no code/test-value blocker but cannot grant acceptance with the required suite failed;
  fresh rules review and shared-app rollout were not started. Next discussion: a separate bounded
  investigation of the closeout timeout. Shared main remains `6459c8d` unchanged.
