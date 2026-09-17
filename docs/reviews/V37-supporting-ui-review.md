# V37 supporting UI review

Status: **passed for integration after corrections and inspected remote evidence**, 2026-09-17. Independent review of UI authored by
another implementer. This reviewer did not edit the reviewed UI. Background content modules and
the later Director-setup backend authored by this reviewer are excluded from independent approval.

Reviewed V37 changes in `web/wizard/index.tsx`, `supporting-components.tsx`, `choice-list.tsx`,
`presentation.ts`, `hero-so-far.tsx`, `web/character-sheet/sections.tsx`, `ability-card.tsx` and
`web/progression/index.tsx`. Traced shared pool/availability/pruning and persisted selection
conversion where needed. Governing contracts are the wizard decision graph and V37 acceptance
items 2–5, plus pinned Rival and perk source rules.

## Original findings — resolved

1. **P1 — Changing an advancement perk retains its hidden nested choices.**
   `AdvancementEditor`'s `onSelect` changes one key in `choices` and never calls shared pruning.
   Select Area of Expertise, choose Alchemy, then change the level-two perk to Danger Sense.
   The target control disappears, but its value remains in `choices`, and `draftSelectionsFrom`
   preserves it in `newSelections`. The evaluator correctly rejects an unavailable decision, so
   a hidden stale target blocks advancement. The main wizard already uses `pruneUnavailable`;
   apply it to the advancement base plus new choices, retaining only the permitted new IDs afterward.
   Use the trusted original-choice context so Footsteps' unchanged earlier reference is not
   misinterpreted while pruning. Exercise the nested-target-to-no-target transition in the browser.
   Linguist parent-change coverage belongs to a legal career perk pool, not Fury's restricted
   level-two perk pool.

2. **P2 — Rival's Director target receives a false owned-skill requirement.**
   `DecisionEditor` always renders “Choose a skill you already know” for `selectionRole ===
   'skill-target'`. `complication.rival.rivalSkill` deliberately has no owned pool: the Director
   chooses the rival's skill from all skills, whether or not the hero owns it. The actual selector
   is correct, but its instruction contradicts that pool and the source. Gate the owned-skill
   instruction on the actual ownership restriction and use neutral modifier-target guidance
   otherwise. Preserve the separate Director/proposed-choice explanation and no-new-grant wording.

## Checked behavior

- Supporting parent selections load complete public Compendium articles. Selected skills resolve
  their canonical individual article; language displays include every nonempty table field and
  supplied usage paragraph. These displays do not substitute parent career prose for skill text.
- Career incidents retain selectable source names and full selected incident narrative. Custom
  incidents have a separate editable text path; they do not acquire a fabricated source-row identity.
- The large complication catalog retains an explicit None option and filtering does not discard
  the current selection. Offered/unsupported options use the shared supported marking.
- Main wizard edits call shared pruning, including changed parent choices and lost prerequisites.
  Nested multi-choice controls use source counts, exclude another slot's selected value and retain
  explicit deferrable slots. Exact-point budgets show their requirement; Wyrmplate-dependent
  Prismatic Scales remains visible with a disabled prerequisite explanation.
- Director-authored ordinary parameters are labeled as proposed choices for review. Strange
  Inheritance uses separate private setup, with no owner-side item selector in the general wizard.
- Hero/sheet supporting facts come from evaluator output. Conditional supporting choices show
  their conditions; item displays distinguish possessed, broken, absent and privately selected.
  Expanded ability cards show activation conditions, adjusted source costs, and linked adjustments
  while retaining printed source text and separate kit/damage modifier explanations.
- Progression evaluation now supplies character identity and progression context, so the server
  reconstructs trusted Footsteps origins. The outstanding pruning finding concerns local edits,
  not the server's origin validation or immutable advancement scope.

## Evidence and limits

Read `docs/build/evidence/V37/integration/supporting-browser.log`: the two supporting-choice and
private-inheritance journeys passed (1.2 minutes). This log predates the two cases above and does
not exercise every nested advancement transition. The lead also reports passing app tests and
other browser regressions; those are not treated here as personally inspected complete logs.
No local runtime, browser, dependency installation or application test was run by this reviewer.

## Re-review

Re-read both corrections and their new browser assertions on 2026-09-17:

- Advancement now freezes `getDefinitions(2, progression.choiceOrigins)` with the existing base,
  prunes the merged frozen earlier selections plus edited new choices, then retains only new
  decision IDs. The original base array is not rewritten. The browser regression chooses Area of
  Expertise/Blacksmithing, switches to Danger Sense, verifies the target disappears, saves, checks
  that persisted advancement selections contain no old target, and compares base selections with
  the original build. This closes the hidden stale-choice failure by static inspection.
- The target guidance now consults `ownedPool.kind === 'skill' && !ownedPool.exclude`. Rival's
  Director-selected target receives neutral no-new-grant guidance; the hero's Better skill target
  still correctly requires ownership. The first added browser assertion incorrectly expected zero
  owned-target instructions globally. The lead corrected it to expect the one legitimate Better
  skill instruction alongside the neutral Director-target instruction; re-read the corrected
  assertion after reporting that issue.

**Both implementation findings are closed; no remaining blocking UI defect was found in this
scope.** Final CT114 browser/check results remain subject to verification. No implementation files
were edited during this review.

## Final evidence closure

Inspected the final CT114 artifacts on 2026-09-17:

- [Full check](../build/evidence/V37/integration/check-final.log): lint/formatting, TypeScript,
  274 engine tests and 374 app/script tests passed (648 total), followed by source/link/vendor
  checks and the production web build. Supporting inventory verified 289 exact source records.
- [Browser run](../build/evidence/V37/integration/browser-final.log): V25 Elementalist, V32
  progression and both V37 supporting/private journeys passed. The V32 case includes persisted
  removal of the obsolete Area of Expertise target and unchanged base selections; the V37 case
  includes the corrected Rival instructions. The same run had one V21 failure against the old
  unsupported-option wording, not a failed character interaction.
- [V21 rerun](../build/evidence/V37/integration/wizard-final.log): passed in 13.5 seconds after its
  assertion was corrected to the displayed “Not offered yet” wording. Read the corrected assertion;
  no application behavior was changed for that rerun.

This closes the remote-evidence caveat for the reviewed UI and its reported defects. There are no
remaining UI review blockers in this scope. The result certifies the reviewed integration candidate,
not a merge or shared-environment rollout; those are separate lead-owned steps. This reviewer read
the artifacts rather than executing the remote workloads.
