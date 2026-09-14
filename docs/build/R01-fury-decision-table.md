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

### 2026-09-14 — plan (rules researcher, branch `slice/R01`)

- Read: `CLAUDE.md`, `agent.MD`, `docs/build/README.md`, this slice, `docs/compendium-navigation.md`, the
  cited spec sections (`character-wizard-spec.md#v001-scope`, `#3-decision-system`,
  `v0.01-readiness-audit.md#g1-...`, `pre-alpha-design-gaps.md#confirmed-first-acceptance-journey`,
  `hero-fixture.md`, `rules-adaptation-principles.md`), and the Compendium files listed under *Rules research*
  plus the entries they reference (all 13 cultures, 18 careers, 25 kits, 9 devil trait files, Fury level-1
  features and 15 level-1 ability entries, skill groups, perk entries, free-strike entries, Renown rule,
  ancestries chapter, complications chapter and index, and the clean Heroes text for the sections the unified
  chapters omit).
- S01 has not landed: read the Markdown directly and record every path.
- Files to touch: `docs/fury-level-one-decisions.md` (new), `shared/content/fury-level-one-decisions.json`
  (new), `tests/fury-decisions.test.ts` (new, `node --test` style), implementation notes in
  `docs/character-wizard-spec.md#v001-scope` and `docs/v0.01-readiness-audit.md` (G1), new `Q-R-100`+ rows in
  `docs/rules-questions-for-user.md`, this work log. No `vendor/` changes; no `STATUS.md` edit (lead updates it).
- Spec discrepancies noted: none. The slice's "Read first" list has path corrections (unified Background and
  Perks chapters lack the sentences that establish culture benefits, language pools and perk types; they are
  cited from `en/books/heroes/clean/Draw Steel Heroes.md`).

### 2026-09-14 — closing entry

Delivered: the decision table document, the JSON mirror, the verification test, spec/audit implementation
notes, four new user questions (Q-R-100 duplicate Caelian language pick; Q-R-101 characteristic array
assignment order; Q-R-102 selectable language tables; Q-R-103 kit eligibility by aspect).

Acceptance checks and evidence:

1. Steps in source order with existing paths: `tests/fury-decisions.test.ts` "check 1" compares the JSON
   `sourceStep` list to the ten `#### N. ...` headings of `chapter/making-a-hero.md` and checks every cited
   path exists and the pinned revision matches `git rev-parse HEAD` of the submodule. Passed.
2. Option values verbatim in cited sources: "checks 2-3" verifies every pool value, option value, grant name,
   `optionSources` entry and per-parent value against its cited file after link/`<br>`/emphasis normalization
   (stated in the document's schema note). Passed.
3. Counts and budgets quote their source sentence: the same test verifies every decision `quote`, rule-object
   quote, `costQuote` and the numeric `cost` against the `N Point(s)` text. Passed. The document repeats the
   sentences per row.
4. Hero-fixture set complete, invalid set rejected: "check 4" validates the three selection sets with a small
   validator whose expected outcomes are the source budgets/counts (Set A: no diagnostics, one Q-R-100 warning;
   Set B: none; Set C: exactly the three stated diagnostics). Hand validation is in the document's *Worked
   selection sets*. Passed.
5. Ambiguities listed with ids: document section *Ambiguities and questions*; the mirror test asserts each
   `Q-` id in the JSON appears in the document and in `docs/rules-questions-for-user.md`. Passed.
6. Independent rules review: pending (not self-attested).

Command and output:

```
$ node --test tests/fury-decisions.test.ts
✔ R01 check 1: every source step appears in source order with an existing path
✔ R01 checks 2-3: every option value, grant and quoted count/budget sentence is verbatim in its cited source
✔ R01 check 4: the hero-fixture set is complete, the second path is complete, the invalid set is rejected
✔ R01: the document mirrors every decision id and question
ℹ tests 4  ℹ pass 4  ℹ fail 0
$ tsc --noEmit   (exit 0)
```

What remains: the user's answers to Q-R-100..103 (provisional defaults labeled); R02 consumes the grant
references; A02 renders the table.

2026-09-14 — review fixes and rebase. Independent and rules review: pass. Non-blocking fixes applied: the
*Source path corrections* row for `chapter/ancestries.md` corrected (it contains *Ancestry Traits* verbatim;
only *Starting Size and Speed* is missing) and the `ancestry.devil.signature-trait` and `budgetRule` citations
re-pointed to the unified chapter after confirming the text is identical; the JSON `textNormalization`
field now states the `*` emphasis stripping; `connections.notes` added to the interpretations list.
Rebased onto `main` after S00/R04/R05 (one conflict, both sides' new questions kept in
`docs/rules-questions-for-user.md`; `tsconfig.json` on main already includes `shared/contracts/*.ts` and
`tests/*.test.ts`). Test ported to Vitest (`import { test } from 'vitest'`), typed without `any` for the S00
lint, Prettier applied. `pnpm check` passed: lint; engine 7 files / 43 tests; app + scripts 8 files / 42 tests;
check-links; check-vendor; foes:source; build. `node scripts/check-commit.ts --range main..HEAD` rejects
`Rules-Review: required (pending)` (it accepts only `not required` or `<label> (<verdict>, date)`); the
trailer is kept as instructed for the lead to set at merge.
