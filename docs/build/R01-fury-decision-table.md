# R01: Level-one devil Fury decision table

| Field | Value |
| --- | --- |
| Family | R |
| Milestone | v0.01 |
| Owner type | Rules team |
| Rules review | required |
| Depends on | S01 (soft: may read the Compendium directly until the pipeline exists) |
| Unblocks | R02, A02 |
| Status | see `STATUS.md` |

## Goal

Produce the sourced decision definition the minimal wizard consumes: every creation step in the
pinned Compendium's order, with stable ids, selection shape, permitted values, counts and budgets,
dependencies, automatic grants and source references, for a level-one devil Fury. This closes
readiness-audit gap G1. It is a document plus a machine-readable file, not application code.

## Spec references

- `docs/v0.01-readiness-audit.md#g1-level-one-devil-fury-decision-table` — the gap and the artifact.
- `docs/character-wizard-spec.md#v001-scope` — every applicable creation step, one supported option per
  step acceptable, kit included, starting equipment excluded.
- `docs/character-wizard-spec.md#3-decision-system` — decision, branch, option, dependency vocabulary.
- `docs/pre-alpha-design-gaps.md#confirmed-first-acceptance-journey` — devil ancestry, Fury class, level
  one; no fixture behind a mock wizard.
- `docs/hero-fixture.md` — one legal path (supporting evidence, not the contract).
- `docs/rules-adaptation-principles.md` — faithful automation, explicit uncertainty.

## In scope

- Step list taken from the Compendium's *Making a Hero* step-by-step section, in its order:
  ancestry, culture, career, class, kit, details, plus any step the Compendium lists that applies to a
  level-one Fury. The optional complication step is recorded in the table as present in the source but
  marked "not presented in v0.01" (Q-CHAR-1 answered 2026-09-14: no). Do not use "background" as a step name.
- For each step: id, source path, whether optional, selection shape (single, multi with count, point
  budget), the option pool, dependencies on earlier choices, and automatic grants.
- Ancestry: devil signature trait plus purchased traits with the point budget from the source.
- Culture: environment, organization, upbringing, language grants.
- Career: skills, languages, perk, inciting incident.
- Class: Fury characteristic arrays, starting characteristics, skills, aspect (subclass), level-one
  ability choices, kit eligibility.
- Kit: eligible kits for the Fury and their sourced contributions (recorded as references for R02).
- Complication: listed as a source step with its pool recorded as references only; not presented in v0.01.
- Details: name, appearance, biography and other authored fields, marked as non-mechanical.
- A machine-readable file `shared/content/fury-level-one-decisions.json` mirroring the document, with a
  schema note in the document. Ids are stable strings; never renumber.
- Three worked selection sets: the hero-fixture path, a second legal path, and one invalid set
  (over budget or missing a required choice), each annotated with why.

## Out of scope

- Other ancestries, classes, or levels. V08 covers full core coverage.
- Derived values (R02) and live state (R03).
- Any UI. A02 renders this.
- Starting equipment inventory (deferred with inventory).

## Inputs and dependencies

Pinned Compendium only. If S01 has landed, use its extracted content; otherwise read the Markdown
directly and record the paths. No fixture is acceptable in place of the source.

## Deliverables

- `docs/fury-level-one-decisions.md` — the human-readable table with source references per row.
- `shared/content/fury-level-one-decisions.json` — the machine-readable mirror.
- Updates to `docs/character-wizard-spec.md#v001-scope` recording that G1 is delivered and where.
- A `rules` commit with `Spec:` trailers for every section above.

## Acceptance checks

1. Every step in the Compendium's step list for a level-one hero appears, in source order, with a
   source path that exists in `vendor/steel-compendium`.
2. Every option value in the JSON file can be found verbatim in the cited source file.
3. Every count or budget in the table quotes the sentence from the source that establishes it.
4. The hero-fixture selection set validates as complete under the table by hand-check; the invalid
   set is rejected with the stated reason.
5. The document lists every place the source is ambiguous or silent, each with an id in
   `docs/rules-questions-for-user.md`, and none is resolved by assumption.
6. Rules reviewer independently reads the cited source files and confirms each row.

## Rules research

Read first:

- `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`
- `vendor/steel-compendium/en/unified/md/ancestry/devil.md`
- `vendor/steel-compendium/en/unified/md/chapter/background.md` and the `culture/`, `career/` entries
- `vendor/steel-compendium/en/unified/md/class/fury.md`
- `vendor/steel-compendium/en/unified/md/chapter/kits.md` and `kit/` entries eligible for the Fury
- `vendor/steel-compendium/en/unified/md/chapter/complications.md`
- `vendor/steel-compendium/en/unified/md/chapter/perks.md`, `skill/`

Existing rulings that apply: the wizard must present every applicable step with at least one supported
option; "one supported option per step" is acceptable for v0.01 but the table must still list the full
pool so that the supported subset is a deliberate marking, not a hidden omission.

## Open questions

None open. Q-CHAR-1 answered 2026-09-14 (complication step not presented). Expect questions on budgeted
choices (which traits a devil may buy with which points) if the source wording is ambiguous; raise them
as `Q-R-n`.

## Work log

_Empty._
