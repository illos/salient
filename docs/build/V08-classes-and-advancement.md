# V08: Eleven-class editor, advancement and progression history

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

Grow the minimal level-one devil Fury wizard into full creation and advancement for all eleven classes
through level 10 (nine core classes plus Beastheart and Summoner): all core ancestries, cultures, careers, kits, complications and class choices; scoped
level-up without review; full edits through the revision/review lifecycle; and browsable, restorable
progression history. Q-CHAR-14 confirms all eleven from the outset of wizard development.
Table/engine support has separate acceptance; other supplements and homebrew remain excluded.

## Spec references

- `docs/v1-character-wizard-contracts.md` — V1 researched foundation and proposed choice/lifecycle contracts.
- `docs/research/v1-wizard-coverage-matrix.md` and `v1-wizard-source-index.json` in that directory —
  reproducible core inventory, currently 90 core class/level rows, to expand to 110 with both supplemental classes;
  source availability is not implemented or verified choice coverage.
- `docs/character-wizard-spec.md#fuller-product-scope` — full creation/advancement scope.
- `docs/character-wizard-spec.md#level-up` — scoped level-up, no review queue, confirmed eligibility policy.
- `docs/character-wizard-spec.md#5-progression-history` — restore any recorded decision point; level-7-to-3 Shadow example.
- `docs/character-wizard-spec.md#7-revision-and-review-lifecycle` — draft/submit/approve/withdraw.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — packs, SCC ids, no automatic source updates.
- `docs/character-wizard-spec.md#10-mobile-interaction-requirements` — resumable wizard overview (layout itself is V17).
- `docs/character-wizard-spec.md#12-open-decisions` — decisions this slice must not default.
- `docs/reference-library-spec.md#confirmed-release-scope` — core sources plus the explicit eleven-class editor exception.
- `docs/data-architecture-spec.md#32-campaign-source-selection--proposed-behavior` — pack selection rechecked at activation.

## In scope

- Content coverage audit: all eleven classes and their subclasses, domains, kits and level-1–10 features parsed into wizard choices from S01.
- Include all 12 ancestries and their point budgets/nested traits, 13 culture aspects, 18 careers,
  47 core perks and 100 complications. Distinguish ordinary kits from Stormwight kits using their source
  eligibility, not the extracted `kit_type` alone. Preserve required noncombat grants despite runtime deferrals.
- Level-up flow presenting only the transition's choices; valid results recorded without review.
- Full edit and admission via the revision lifecycle for non-Director owners; Director's own edits logged without approval.
- Progression history browse and restore, retaining inventory and independent details; forward records preserved.
- Detachment/duplication of builds as already confirmed.

## Out of scope

- Other supplements, homebrew options (`docs/reference-library-spec.md#official-content-is-not-necessarily-core-content`).
- Forge Steel import/export (V09; export deferred).
- Respite-driven XP conversion (V01) and inventory (V07).
- Automatic conversion between incompatible resource types: follow the unresolved boundary. Compatible current values and maximum changes use the confirmed cap policy.

## Inputs and dependencies

- Hard: A09; R01–R03 contracts; content delivery for each implemented class, including the explicit supplemental dependencies.
- Soft: V01 eligibility record; until then a Director-entered XP value drives eligibility behind `fixtures/manual-xp-entry`.

## Deliverables

- Extended decision tables per class under `docs/rules/` (or the location R01 established), each sourced.
- Wizard steps and level-up view; progression history UI and restore operation.
- Coverage report listing all eleven classes × levels 1–10 with parse/choice status.
- Extend the report to every ancestry and supporting option's decisions, automatic grants and derived
  effects; record gameplay automation separately. Include source-section choices without standalone SCCs.
- Convex-test cases per class at levels 1, 5 and 10; implementation notes in `docs/character-wizard-spec.md`.

## Acceptance checks

1. A level-7 wood elf Shadow restored to its level-3 record shows the level-3 choices, grants and derived values, keeps present inventory, and retains the level-4–7 records for forward navigation.
2. Level-up from 1 to 2 on any included class offers only that transition's choices and activates without a review row.
3. A non-Director owner's full edit creates a pending revision; the play sheet is unchanged until Director approval of that exact revision.
4. Every derived value at level 10 for each class matches a hand-computed value cited to the Compendium in the test file.
5. Beastheart and Summoner choices are available through the wizard and headless operations when their slice is delivered; other excluded supplements/homebrew remain unavailable. Companion/portfolio choices and derived grants survive save/reload and progression without creating or resetting live creatures.
6. Disabling a pack after admission leaves an existing character's choices intact.
7. Exercise every ancestry's budget, all class branches/domain choices, each transition and the
   echelon boundaries 3→4, 6→7 and 9→10; levels 1/5/10 alone are insufficient coverage.
8. Verify the dependency cases in `docs/v1-character-wizard-contracts.md#10-representative-acceptance-examples`,
   including Revenant former ancestry, deferred languages, duplicate fixed skills, two-kit composition,
   conditional grants, negative complication effects and one-time inventory grants.

## Rules research

- `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`, `chapter/classes.md`, `chapter/ancestries.md`, `chapter/kits.md`, `chapter/perks.md`, `chapter/complications.md`
- `vendor/steel-compendium/en/unified/md/class/{beastheart,censor,conduit,elementalist,fury,null,shadow,summoner,tactician,talent,troubadour}.md`
- `vendor/steel-compendium/en/unified/md/feature/`, `ancestry/`, `culture/`, `career/`, `kit/`, `perk/`, `complication/`
- `vendor/steel-compendium/en/unified/md/rule/resource/experience.md`, `rule/general/echelon.md`, `rule/general/subclass.md`

Rulings that apply: v0.01 Fury decisions in R01 remain; they are not precedent for other classes.

## Open questions

The 2026-09-15 user walkthrough answered or deferred the reviewed character-question batch.
Q-CHAR-7 (Revenant/Prismatic Scales), Q-CHAR-9 (career project-point spending), and Q-CHAR-13
(higher-level starting treasure) are explicitly deferred until after the playtest. Preserve their
research and undecided alternatives; do not treat them as playtest gates or adopt defaults.
Use the owning specs for accepted lifecycle, skill, completion and source resolutions. Coordinate
later rest/inventory/access work without reopening answered questions.

Candidate `Q-V-n` entries from `docs/character-wizard-spec.md#12-open-decisions`:

- Incompatible resource-type reconciliation beyond the current-value/cap policy already settled by Q-CHAR-2.
- Any remaining campaign-value enumeration beyond Q-R-201; advancement eligibility is already settled by Q-CHAR-3.
- Handling multiple competing submissions.

## Shared class knowledge

As each class slice is researched and built, retain concise class notes beside its sourced decision
contract and link them from the coverage report. Reuse existing research; avoid a separate tracker.
Each note covers:

- Choice order, prerequisites, counts, pools and nested choices, with pinned Compendium references.
- Automatic/conditional grants and derived contributions, their recipient and level/timing.
- Hero/companion/summon relationships, shared or distinct state and table/engine dependencies.
- Forge Steel class/subclass/factory references and import/export mapping, including dormant choices.
- Worked build/progression examples, executable evidence, unresolved cases and current manual behavior.

These notes form a reusable handoff to parser, engine and UI work. Upstream implementation behavior
is a structural reference; Compendium findings and case-specific user rulings remain separately
identified. Editor implementation is not proof of table behavior.

## Work log

2026-09-15: Q-CHAR-14 confirms eleven-class editor scope from the outset. Beastheart/Summoner
choices, grants and progression belong to this track; their table UI and engine work have separate
milestones. Preserve institutional knowledge through the class notes above. Existing core source
inventory remains 90 rows until the supplemental inventory is actually added.


2026-09-14: V1 wizard thread delivered the linked research contracts and reproducible source matrix.
This is specification progress; V08 implementation remains outstanding and the source index does not
certify every option's semantics or runtime behavior.
