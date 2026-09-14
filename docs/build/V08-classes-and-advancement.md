# V08: Core class content through level 10, advancement and progression history

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | A09 |
| Unblocks | V09 |
| Status | see `STATUS.md` |

## Goal

Grow the minimal level-one devil Fury wizard into full creation and advancement for every core class
through level 10: all core ancestries, cultures, careers, kits, complications and class choices; scoped
level-up without review; full edits through the revision/review lifecycle; and browsable, restorable
progression history. The slice stops at Summoner, Beastheart, supplements and homebrew, and at
live-resource reconciliation rules the spec still leaves open.

## Spec references

- `docs/v1-character-wizard-contracts.md` — V1 researched foundation and proposed choice/lifecycle contracts.
- `docs/research/v1-wizard-coverage-matrix.md` and `v1-wizard-source-index.json` in that directory —
  reproducible core inventory, all 90 class/level rows, ancestry traits and printed religion/language pools;
  source availability is not implemented or verified choice coverage.
- `docs/character-wizard-spec.md#fuller-product-scope` — full creation/advancement scope.
- `docs/character-wizard-spec.md#level-up` — scoped level-up, no review queue, eligibility TBD.
- `docs/character-wizard-spec.md#5-progression-history` — restore any recorded decision point; level-7-to-3 Shadow example.
- `docs/character-wizard-spec.md#7-revision-and-review-lifecycle` — draft/submit/approve/withdraw.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — packs, SCC ids, no automatic source updates.
- `docs/character-wizard-spec.md#10-mobile-interaction-requirements` — resumable wizard overview (layout itself is V17).
- `docs/character-wizard-spec.md#12-open-decisions` — decisions this slice must not default.
- `docs/reference-library-spec.md#confirmed-release-scope` — core classes 1–10 only.
- `docs/data-architecture-spec.md#32-campaign-source-selection--proposed-behavior` — pack selection rechecked at activation.

## In scope

- Content coverage audit: every core class, subclass, domain, kit and level-1–10 feature parsed into wizard choices from S01.
- Include all 12 ancestries and their point budgets/nested traits, 13 culture aspects, 18 careers,
  47 core perks and 100 complications. Distinguish ordinary kits from Stormwight kits using their source
  eligibility, not the extracted `kit_type` alone. Preserve required noncombat grants despite runtime deferrals.
- Level-up flow presenting only the transition's choices; valid results recorded without review.
- Full edit and admission via the revision lifecycle for non-Director owners; Director's own edits logged without approval.
- Progression history browse and restore, retaining inventory and independent details; forward records preserved.
- Detachment/duplication of builds as already confirmed.

## Out of scope

- Summoner, Beastheart, all supplements, homebrew options (`docs/reference-library-spec.md#official-content-is-not-necessarily-core-content`).
- Forge Steel import/export (V09; export deferred).
- Respite-driven XP conversion (V01) and inventory (V07).
- Live Stamina/resource reconciliation when maxima change: record uncertainty, do not default (`docs/character-wizard-spec.md#12-open-decisions`).

## Inputs and dependencies

- Hard: A09; R01–R03 contracts; S01 corpus for all core classes.
- Soft: V01 eligibility record; until then a Director-entered XP value drives eligibility behind `fixtures/manual-xp-entry`.

## Deliverables

- Extended decision tables per class under `docs/rules/` (or the location R01 established), each sourced.
- Wizard steps and level-up view; progression history UI and restore operation.
- Coverage report listing every core class × level with parse/choice status.
- Extend the report to every ancestry and supporting option's decisions, automatic grants and derived
  effects; record gameplay automation separately. Include source-section choices without standalone SCCs.
- Convex-test cases per class at levels 1, 5 and 10; implementation notes in `docs/character-wizard-spec.md`.

## Acceptance checks

1. A level-7 wood elf Shadow restored to its level-3 record shows the level-3 choices, grants and derived values, keeps present inventory, and retains the level-4–7 records for forward navigation.
2. Level-up from 1 to 2 on any core class offers only that transition's choices and activates without a review row.
3. A non-Director owner's full edit creates a pending revision; the play sheet is unchanged until Director approval of that exact revision.
4. Every derived value at level 10 for each class matches a hand-computed value cited to the Compendium in the test file.
5. Attempting to select a Summoner or supplemental option is impossible through the wizard and the headless operation.
6. Disabling a pack after admission leaves an existing character's choices intact.
7. Exercise every ancestry's budget, all class branches/domain choices, each transition and the
   echelon boundaries 3→4, 6→7 and 9→10; levels 1/5/10 alone are insufficient coverage.
8. Verify the dependency cases in `docs/v1-character-wizard-contracts.md#10-representative-acceptance-examples`,
   including Revenant former ancestry, deferred languages, duplicate fixed skills, two-kit composition,
   conditional grants, negative complication effects and one-time inventory grants.

## Rules research

- `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`, `chapter/classes.md`, `chapter/ancestries.md`, `chapter/kits.md`, `chapter/perks.md`, `chapter/complications.md`
- `vendor/steel-compendium/en/unified/md/class/{censor,conduit,elementalist,fury,null,shadow,tactician,talent,troubadour}.md`
- `vendor/steel-compendium/en/unified/md/feature/`, `ancestry/`, `culture/`, `career/`, `kit/`, `perk/`, `complication/`
- `vendor/steel-compendium/en/unified/md/rule/resource/experience.md`, `rule/general/echelon.md`, `rule/general/subclass.md`

Rulings that apply: v0.01 Fury decisions in R01 remain; they are not precedent for other classes.

## Open questions

Q-CHAR-2 through Q-CHAR-13 in `docs/rules-questions-for-user.md` now supply researched recommendations
for wizard lifecycle and bounded source/scope cases. Coordinate overlapping rest/inventory/access
decisions with their owning threads; these are proposals, not resolved defaults.

Candidate `Q-V-n` entries from `docs/character-wizard-spec.md#12-open-decisions`:

- Current Stamina/resources/conditions when maxima or resource types change.
- Full list of campaign values and advancement eligibility after XP clears.
- New choices after rollback and treatment of retained future builds.
- Handling multiple competing submissions.

## Work log

2026-09-14: V1 wizard thread delivered the linked research contracts and reproducible source matrix.
This is specification progress; V08 implementation remains outstanding and the source index does not
certify every option's semantics or runtime behavior.
