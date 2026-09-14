# V01: Respite research and loop

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Rules team (research contract) then App team (loop) |
| Rules review | required |
| Depends on | A09 |
| Unblocks | None in `STATUS.md`; V08 consumes its Victory-to-XP and advancement-connection contract (soft) |
| Status | see `STATUS.md` |

## Goal

Deliver respite as its own dedicated table mode with a self-contained loop the Director starts and
ends: participation, start/completion/interruption, resource restoration, Victory-to-XP conversion,
supported respite choices and the hand-off to leveling. The slice is research-first: no step, effect
or player control is designed until the pinned Compendium passages are read and cited. It must not
pre-empt the user's active specification thread, which currently owns respite participation
(`docs/v1-roadmap.md#current-discussion`); the slice implements what that thread records in the table
spec and stops where it has not yet decided.

## Spec references

- `docs/v1-roadmap.md#current-discussion` — respite participation is an unanswered product question owned by the user's thread; do not decide it here.
- `docs/research/respite-rules.md#8-product-decision-queue` — the user's thread's ordered product questions; the slice waits on 1–5 for the main journey.
- `docs/research/respite-rules.md#9-bounded-rules-uncertainties` — bounded rules cases; no blanket duration or reset rule.
- `docs/research/respite-rules.md#10-acceptance-examples-for-the-later-build` — proposed verification cases to turn into checks.
- `docs/research/respite-rules.md#7-proposed-application-outline` — proposed stages (start, activities, completion review, progression); not yet accepted.
- `docs/table-spec.md#respite-mode` — dedicated mode, Director start/end, no import of combat locks/void/rewards, single-structured-state policy.
- `docs/v1-spec-checkpoint.md#remaining-work-before-complete-v1-play` — item 1: respite and resource lifecycle.
- `docs/v1-spec-checkpoint.md#release-scope` — respite included; montage/negotiation, downtime projects, nested activities deferred.
- `docs/pre-alpha-design-gaps.md#respite-and-fictional-time--deferred-beyond-v001` — the deferral this slice lifts; no invented resets or free reuse.
- `docs/table-spec.md#8-continue-exploring` — "FreePlay mechanics" row: outside-combat resource/reuse rules, Recoveries and fictional time.
- `docs/character-wizard-spec.md#level-up` — advancement eligibility method still to be specified; respite hands off here.

## In scope

- A sourced respite contract document: what a respite restores, what it costs in fictional time, what choices it offers, and how Victories convert to XP, each claim citing a Compendium path.
- Registered shared operations to start and end respite, with ordered attributed log entries and audience-correct reads.
- Participation as recorded in the table spec by the user's thread; until recorded, the operation accepts an explicit participant list with no default.
- Resource restoration applied through existing persistent-value operations with recorded causes and before/after values.
- Interruption and session-closure behavior for an in-progress respite, designed from the research.
- The connection to V08 level-up: a respite result that makes a hero eligible is recorded, not auto-applied.

## Out of scope

- Downtime projects, montage tests, negotiation and nested structured activities (`docs/v1-spec-checkpoint.md#release-scope`, deferred).
- Any respite activity beyond those the sourced contract lists; no invented "activities" UI.
- Deciding participation defaults; that belongs to the user's thread (`docs/v1-roadmap.md#current-discussion`).
- Level-up choice presentation (V08) and inventory changes during respite (V07).
- Retainers, Summoner/Beastheart and homebrew content.

## Inputs and dependencies

- Hard: A09 committed (FreePlay, combat closeout, persistent values, clock, history).
- Hard: the participation decision recorded in `docs/table-spec.md#respite-mode` before the participation control is built; the operation may ship with an explicit list only.
- Soft: V08 for applying advancement; stub with `fixtures/respite-advancement-stub` that records eligibility only.

## Deliverables

- `docs/respite-contract.md` — sourced research contract with cited passages and worked examples.
- Shared operations `respite.start`, `respite.end` (names proposed) registered in the command registry with headless equivalents.
- Convex-test coverage at the operation level; a browser test for start-to-end on the table.
- Implementation notes in `docs/table-spec.md#respite-mode`.

## Acceptance checks

1. Every restoration or conversion rule in `docs/respite-contract.md` quotes its Compendium sentence with path; reviewer confirms each.
2. Starting a respite in a running session persists a respite-mode record readable through the table query; combat cannot be started while it is active.
3. Ending a respite writes before/after values for every restored resource on each participant, read back through the sheet query, not the mutation response.
4. A hero whose XP crosses the sourced threshold shows recorded eligibility; the build is unchanged until V08's level-up runs.
5. Starting a respite while paused, or by a non-Director, is rejected with a logged refusal.
6. No participation default exists in code unless `docs/table-spec.md#respite-mode` records one.

## Rules research

Research already done by the user's thread: `docs/research/respite-rules.md` with its source inventory `docs/research/respite-source-inventory.csv`. Re-read the cited passages rather than re-deriving them. Grep of "respite" under `vendor/steel-compendium/en/unified/md/` yields these owning passages:

- `vendor/steel-compendium/en/unified/md/rule/resource/respite.md`
- `vendor/steel-compendium/en/unified/md/rule/resource/victories.md`
- `vendor/steel-compendium/en/unified/md/rule/resource/experience.md`
- `vendor/steel-compendium/en/unified/md/rule/health/stamina.md`, `rule/health/recoveries.md`
- `vendor/steel-compendium/en/unified/md/chapter/the-basics.md`, `chapter/making-a-hero.md`, `chapter/for-the-director.md`
- `vendor/steel-compendium/en/unified/md/rule/downtime/guide.md` and `chapter/downtime-projects.md` — read only to bound what is deferred.
- `vendor/steel-compendium/en/unified/md/rule/treasure/leveled-treasure.md`, `rule/treasure/consumable.md` — respite interactions with items, for V07 hand-off.

No ruling in `docs/gameplay-decision-record.md` covers respite; there is nothing to re-decide.

## Open questions

Candidate `Q-V-n` entries (not yet filed):

- Respite participation default (`docs/v1-roadmap.md#current-discussion`; `docs/research/respite-rules.md#8-product-decision-queue` question 1) — owned by the user's thread; do not file, wait for the spec.
- Respite spanning closed sessions, kit/ward changes without review, level-up completion timing, interruption recording, unused optional choices, reversal (`docs/research/respite-rules.md#8-product-decision-queue` questions 2–8) — same ownership.
- Interrupted rest with until-end effects, level-ten at completion, Bounce Back Fast, next-respite binding, stacked Recovery modifications, extra-activity stacking (`docs/research/respite-rules.md#9-bounded-rules-uncertainties`) — candidate `Q-V-n` rules questions once the slice is claimed.
- Relationship of respite to the downtime system (`docs/table-spec.md#respite-mode`, "explicitly unresolved").
- Interruption and session closure during respite (`docs/table-spec.md#respite-mode`).
- Advancement eligibility method, including XP after campaign transfer (`docs/character-wizard-spec.md#level-up`).

## Work log

_Empty._
