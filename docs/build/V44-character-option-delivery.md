# V44: Character option delivery plan

**Paused and quarantined by the user, 2026-09-19.** This pre-pilot plan is retained as historical
context, not an active assignment. See [the quarantine record](../quarantine/opus-pilot-20260919.md).

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Character integration lead, ancestry and class implementers |
| Rules review | Required for mechanical implementation; this plan makes no new rules claims |
| Depends on | V25, V32, V37, V40, V42 |
| Unblocks | Independently verified ancestry and class/level implementation slices |
| Status | Plan recorded; implementation and audits pending; see `STATUS.md` |

## Goal

Expand the shared wizard through three coordinated tracks: ancestry options, class/level options,
and shared evaluation/progression integration. The user approved this organization on 2026-09-19
and requested one ancestry or class per level per commit, matching Forge Steel builds, a full audit
after the initial work, and merging each commit after full verification. This document plans the
work; it does not certify additional character coverage.

## Spec references

- [Decision system](../character-wizard-spec.md#3-decision-system).
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows).
- [Progression history](../character-wizard-spec.md#5-progression-history).
- [Review lifecycle](../character-wizard-spec.md#7-revision-and-review-lifecycle).
- [Forge Steel compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility).
- [Delivery sequence](../character-wizard-spec.md#13-proposed-delivery-sequence).
- [Reference verification](character-verification.md).
- [Merge completion](README.md#merge-completion-includes-the-playable-app).

## In scope

- Complete option selection, prerequisites, counts/budgets, automatic and selected grants,
  permanent derived values, readable source, saved builds and dependency changes.
- Separate reviewed implementation commits for each ancestry/level or class/level unit. A class
  unit covers every applicable subclass branch and option at that level, not one reference path.
- Reference builds with identical choices in Salient and Forge Steel, backed by independent
  Compendium expectations, option coverage and recorded discrepancies.
- Existing review, ownership, history, inventory and live-value boundaries, with level-transition
  support extended only alongside verified class/level definitions.
- Full independent foundation and first-wave audits, per-commit verification and playable delivery.

## Out of scope

Combat automation, new table controls, general import/export implementation, source-pin upgrades,
homebrew and unapproved supplemental sources. Manual gameplay effects remain clearly described;
missing permanent build effects cannot be declared complete by labeling them manual. Beastheart
and Summoner remain included in the eleven-class editor target. Their companion/portfolio editor
dependencies are separate from live creature control.

## Inputs and dependencies

Baseline: integrated main `c63294b29a1d04d374bc061185ab8c72d36c4100`. V37 supporting choices and
V40/V42 wizard presentation are merged and live. Existing reference paths are Devil/Berserker
Fury, Polder/Fire Elementalist and Fury advancement from level one to two. These are partial
ancestry/class coverage, not completed option families.

Current shared constraints: definitions extend the original Fury data, the evaluator retains
Fury/Devil special cases and explicit level-one/two support checks, and progression is Fury 1→2.
Preserve decision IDs, revision compatibility and actual supported behavior while changing these
extension points. Do not enable a level merely because a numeric field or source record exists.

The [source matrix](../research/v1-wizard-coverage-matrix.md) inventories twelve core ancestries
and nine core classes. Its nine-class denominator must not hide the separately included Beastheart
and Summoner. Pin both vendor revisions in every reference ledger; keep vendor files unchanged.

Performance V41/V43 proceeds independently. The historical
[Fury admission/table timeouts](evidence/V42/README.md#regression-timeout) were sent to that thread
through Chords. Check the latest integrated result before treating them as current failures or
resolved issues. A required verification failure remains a failed gate until resolved and rerun;
record reproducible unrelated blockers without weakening assertions or increasing backend limits.

## Deliverables

### Commit and ownership boundaries

| Track | Owns | Shared boundary |
| --- | --- | --- |
| Ancestries | One ancestry module, its level-qualified effects, source/Forge fixtures and tests per unit | Request shared primitives from the integration owner |
| Classes | One class at one level, all applicable branches, grants and decision fixtures per unit | Request shared progression/evaluator extensions from the integration owner |
| Integration | Shared contracts, definition composition, evaluator primitives, progression, persistence, source-catalog assembly and merge/runtime sequencing | Keep UI and headless behavior on the same operations |

Use a separate short-lived slice/worktree per active unit. Allocate slice IDs when claiming work,
not by reserving a large speculative block. Shared infrastructure gets its own prerequisite commit;
do not bury a second class/ancestry or future-level expansion inside an option commit. Tests,
fixtures, source records and specification changes for that unit travel with its implementation.
Rework may be folded into an unmerged unit; fixes to already merged work receive a new scoped
commit. Never rewrite main to produce an artificial one-commit history. Documentation closeouts
and audit records may be separate commits.

An ancestry is first delivered at level one. If its sourced grants scale or change at a later
level, implement and verify that ancestry's change in its own level commit before relying on it
in a class build there. Do not invent ten different ancestry choice trees or empty commits for
unchanged levels. Record carry-forward verification at every supported level. Class units cover
exactly one level; scheduling in bands never combines several levels into one implementation commit.

### Initial sequence

| Order | Unit | Required result |
| --- | --- | --- |
| 0 | Shared foundation | Extract independently owned ancestry/class modules and central support registration; keep current IDs/build outputs and supported paths unchanged. Establish reusable reference comparison and coverage reports. |
| 0a | Full foundation audit | Independent implementation and rules-preservation review; full repository and browser regression checks, existing Forge build comparisons, history/review/live-state regression. Pass before merging the foundation or option implementations. |
| 1A | Devil, level 1 | Finish every eligible trait and nested decision; preserve the existing Fury reference and contrast trait combinations. |
| 1B | Polder, level 1 | Finish every eligible trait and nested decision; preserve the existing Elementalist reference and contrast trait combinations. |
| 1C | Dwarf, level 1 | Add all eligible ancestry decisions and grants; compare a Dwarf Elementalist with the existing Polder reference while holding class/background choices constant where legal. |
| 1D | Fury, level 1 | Complete all primordial aspects, eligible kits, abilities and other level-one choices; preserve existing Berserker level-two behavior. |
| 1E | Elementalist, level 1 | Complete all elemental specializations, applicable enchantments/wards, abilities and nested choices; verify no-kit builds and source-specific contributions. |
| 1F | Full first-wave audit | Audit the integrated foundation and all five units, option coverage, same-build Forge comparisons and cross-family interactions; fix findings before wave two. |

The Fury unit includes Berserker, Reaver and Stormwight; the Elementalist unit includes Earth,
Fire, Green and Void. Research each option pool and nested dependency before implementation.
Completing a level-one branch must not accidentally enable its unimplemented level-two branch.
Existing level-two Berserker builds remain a required compatibility case throughout the wave.

After foundation contracts are fixed, ancestry and class implementation can run concurrently in
disjoint modules. Source research and reference capture may start earlier. Each unit merges as soon
as its own full verification passes, rather than waiting for the whole wave; 1F is an additional
combined audit. One integration owner serializes shared-file changes and main/runtime updates.

Next wave: Conduit level one and Tactician level one as separate units, then independently scoped
Fury, Elementalist and Conduit level-two units. These exercise nested domains, two-kit composition
and transitions beyond the existing Berserker path. Exact order follows researched dependencies.
Continue other ancestries in separate units, with nested/former-ancestry cases such as Revenant
scheduled when their required ancestry choices are implemented. Complete the other classes,
including Beastheart and Summoner once their concrete editor dependencies are available, and
advance through levels 2–3, 4–6, 7–9 and 10, always one class/level per commit. This later sequence
is planning, not a claim that those classes or levels are supported.

### Forge Steel comparison artifacts

For each option unit, retain a source/choice coverage ledger, unchanged `.ds-hero` exports,
readable Forge sheets/screenshots, normalized selections, independently derived expectations and
Salient persisted readbacks/screenshots. Record source/version identifiers, capture date and hashes.
Use the [reference procedure](character-verification.md#2-build-and-capture-the-reference).

Every newly supported selectable option must appear in a legal completed reference build with
the same ancestry, class, subclass, level, background, kit, perks, complication and nested choices
in both builders. Reuse a build to cover compatible options; mutually exclusive choices require
additional builds. Cover all subclass branches, selection shapes and meaningful interactions;
one showcase hero cannot certify a complete class. Exhaustive Cartesian-product coverage is not
required. Fixed grants and calculated values must also be accounted for in those builds.

Expected mechanics come from the pinned Compendium, independently of Salient's evaluator. Forge
differences require a source-backed explanation and independent review; an unexplained mismatch
blocks merge. If Forge cannot represent a source-legal option, document the exact limitation and
closest comparable build, retain source-derived checks, and explicitly mark exact counterpart
coverage incomplete. Do not call that an exact-match pass or silently waive the user's comparison
requirement; resolve the gap before that unit is declared fully verified.

Historical fixture names are not sufficient proof: the V25 source audit explicitly distinguishes
its Fury fixture from Forge export parity, and older Elementalist inspection artifacts have limited
coverage/portability. Inspect their actual retained evidence and capture fresh portable counterparts
where needed. The foundation audit cannot inherit an unsupported parity claim from those records.

For levels above one, capture the same hero before and after the transition; verify direct creation
at the target level, scoped advancement, edited parent choices and restoration of the prior build.
Exports containing embedded future definitions do not prove active choices or historical builds.

## Acceptance checks

Each implementation unit must pass these gates before merge:

1. Its inventory accounts for every eligible option and branch at the assigned level, with source
   references, permanent/manual classification, prerequisites and a legal same-build Forge witness.
   Confirm forbidden choices, budgets, counts and nested-choice behavior with contrasting tests.
2. Pure evaluation matches independently established choices, grants and derived values. Changing
   a parent removes obsolete choices/effects and preserves independent details; later definitions
   cannot leak into lower-level builds. An ancestry change preserves unrelated class effects.
3. Save/reload and shared headless operations return the same persisted build. Reopening works;
   review activates exactly the submitted revision; stale and unauthorized operations are refused.
4. Applicable level-up/restoration tests preserve live state and current inventory under confirmed
   policy, do not repeat initial grants or spawn live creatures, and retain immutable history.
   New class/level support must be recognized consistently in evaluation, wizard and progression.
5. Run full `pnpm check` plus `pnpm test:browser` on the isolated CT114 candidate, using the
   configured single workers. Add the unit's actual wizard/source/sheet and persisted-readback
   journeys to the browser suite. Retain screenshots, command output, failures and resolved reruns.
   Foundation/shared changes exercise all existing supported reference paths and workflows.
6. Independent implementation and rules reviewers pass the unit, source mapping, Forge comparison
   and acceptance evidence. The implementer does not self-certify; a dropdown entry or passing
   parser/unit check alone is insufficient. No outstanding required failure counts as verification.
7. Rebase onto current main, resolve conflicts, repeat affected reviews if behavior changes, run
   integrated full checks and browser verification, then validate actual commit trailers. Reuse
   evidence only when it covers the exact unchanged integration candidate; do not rerun the same
   expensive suite without a changed candidate or unresolved concern.
8. Merge the verified commit and update affected backend/content/frontend on shared CT114 main.
   Verify the changed journey at the actual shared HTTPS URL, with saved-state readback and existing
   data preserved. Record commit/runtime identity and publish completion through Chords. A Git merge
   with pending runtime checks is not complete. Merge authorization is already given for passing units.

The full audits at 0a and 1F independently check all the above across their combined scope, including
coverage-report omissions, class/ancestry switching, existing V37 background/kit/perk/complication
interactions, private Director choices, review/history behavior and resource preservation. Include
the complete Fury admission/table regression; coordinate remaining timeout work with performance.
Report pass/fail/not verified and explain every Forge discrepancy. Fix findings and rerun affected
checks before proceeding to the next wave. This is a wizard/build audit, not certification of all
gameplay automation or Forge interchange.

## Ability design and playtest evidence

Not applicable to parser/engine execution: this plan assigns editor choices, source display and
permanent build evaluation. Each grant still needs source and actual UI/persisted-build evidence.
Any later change to executed ability behavior belongs in its own coordinated engine slice and
must satisfy the existing per-ability design/playtest gate.

## Rules research

Start each unit from its pinned `en/unified/md/ancestry/<slug>.md`, `feature/trait/<slug>/`,
`class/<slug>.md`, `feature/<class>/level-<n>/` and `feature/ability/<class>/level-<n>/` entries.
Follow parent sections and Heroes book context where unified records omit grouping. Read related
general rules and existing rulings before encoding formulas. Use the corresponding pinned Forge
ancestry/class definitions and factories to understand choices and serialization. The source
matrix and [V1 contracts](../v1-character-wizard-contracts.md) are navigation, not rules certification.

## Open questions

None required to start planning or foundation extraction. Use the existing question queue for
concrete source ambiguities, incompatible resource conversion or a reference-comparison gap that
cannot be resolved within these requirements. Continue independent units while a specific unit waits.

## Work log

2026-09-19: user approved three-track organization, per-ancestry/class/level commits, matching Forge
builds, full audit after initial work and verified incremental merges. Read current implementation,
source inventory, verification procedure and V24/V37/V40/V42 evidence. Created `slice/V44` in
`/srv/presidium/projects/salient/wizard-plan` from main `c63294b`. This commit records the delivery
plan and confirmed verification policy only; no application behavior or source pin changes. Source
research, implementation, Forge captures, full suites and audits for these new units remain pending.

Independent read-only planning review by `wizard_plan_review` agreed with the bounded first wave
and identified all-branch coverage, ancestry scaling, existing level-two restrictions, incomplete
historical Forge fixtures and unresolved required timeout regressions as explicit acceptance risks.
Those requirements are included above. This was a planning review, not an implementation/rules
audit or a fresh test run.

Final planning review passed; clarified which requirements were user-confirmed and which are
engineering choices in this plan. Both vendors were initialized at their existing pins for link
validation after the initially empty worktree vendor directories caused missing-target reports.
`node scripts/check-links.ts` passed across 246 Markdown files; `git diff --check` passed. No
application tests, builds or browsers were run for this documentation-only change. Integration
requires no backend/content/frontend update or live feature check because executable files and
runtime behavior are unchanged. Implementation units and their audits remain pending.
