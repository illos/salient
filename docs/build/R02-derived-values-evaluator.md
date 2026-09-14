# R02: Derived values and evaluator contract

| Field | Value |
| --- | --- |
| Family | R |
| Milestone | v0.01 |
| Owner type | Rules team |
| Rules review | required |
| Depends on | R01 |
| Unblocks | R03, A02 |
| Status | see `STATUS.md` |

## Goal

Define, with Compendium references, how the selections from R01 become a character sheet baseline,
and define the pure evaluator contract that the application calls: selections in; status, diagnostics
and a derived baseline with provenance out. This closes readiness-audit gap G2. It is a document with
three reviewed examples plus a TypeScript type file; the evaluator implementation belongs to A02.

## Spec references

- `docs/v0.01-readiness-audit.md#g2-derived-value-formulas-and-evaluator-contract`
- `docs/character-wizard-spec.md#3-decision-system` — evaluator status vocabulary.
- `docs/character-wizard-spec.md#9-shared-operations-and-reliability` — evaluation is a shared operation.
- `docs/character-wizard.md#character-model-direction` — derived baseline distinct from play values.
- `docs/character-sheet-spec.md` — the fields the sheet must be able to show from the baseline.
- `docs/workstream-app-status.md#integration-dependencies` — handoff request 2.

## In scope

- Formulas with source citations for: the five characteristics from the chosen array and ancestry or
  culture adjustments; maximum Stamina; Recoveries and recovery value; speed; stability; size;
  disengage if the source defines it; potency values if the source defines them for level one; heroic
  resource name (Ferocity) and its starting value at creation; granted abilities, skills, languages,
  traits, perks; kit contributions to Stamina, speed, stability, damage and distance.
- Evaluator contract: input shape (R01 selection ids and values), output shape with status
  `complete | incomplete | invalid | unsupported`, diagnostics keyed by decision id, and a derived
  baseline in which every value carries provenance (which choice and which source sentence).
- Three examples: complete (hero fixture), incomplete (missing kit), invalid (over-budget traits), each
  with the expected output written by hand from the source.
- `shared/contracts/characterEvaluation.ts` with the types only. No logic.

## Out of scope

- Live state, current Stamina, resource pools during play (R03).
- Levels above one, subclass features beyond what a level-one Fury has (V08).
- Reconciliation when maxima change after edits (open, deferred; see wizard spec section 12).
- Running the evaluator inside the app (A02).

## Inputs and dependencies

R01 committed. Pinned Compendium only.

## Deliverables

- `docs/character-derived-values.md` — formulas, provenance rules, evaluator contract, three examples.
- `shared/contracts/characterEvaluation.ts` — types.
- Update `docs/character-wizard-spec.md#3-decision-system` to point at the delivered contract.
- `rules` commit with `Spec:` trailers.

## Acceptance checks

1. Every formula cites the Compendium sentence it implements; the reviewer confirms each.
2. The hero-fixture example reproduces the fixture's published numbers (Stamina 30, Recoveries 10, and
   the rest) or the document explains which fixture number is wrong and cites why. Do not change the
   fixture without a source.
3. The incomplete and invalid examples produce diagnostics naming the R01 decision id at fault.
4. Every baseline value in the complete example has provenance.
5. The types compile under `pnpm check:app` and contain no implementation.
6. Ambiguities are listed as `Q-R-n` entries, not resolved by assumption.

## Rules research

- `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`
- `vendor/steel-compendium/en/unified/md/class/fury.md`
- `vendor/steel-compendium/en/unified/md/ancestry/devil.md`
- `vendor/steel-compendium/en/unified/md/rule/health/stamina.md`, `recoveries.md`, `winded.md`
- `vendor/steel-compendium/en/unified/md/rule/character/*.md` (characteristic, speed, stability, size)
- `vendor/steel-compendium/en/unified/md/chapter/kits.md` and the chosen kit entry
- `vendor/steel-compendium/en/unified/md/rule/general/always-round-down.md`

## Open questions

None known at slice creation.

## Work log

_Empty._
