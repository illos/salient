# R03: Live-state initialization and engine projection

| Field | Value |
| --- | --- |
| Family | R |
| Milestone | v0.01 |
| Owner type | Rules team |
| Rules review | required |
| Depends on | R02 |
| Unblocks | A02, A03 |
| Status | see `STATUS.md` |

## Goal

Define how a newly approved hero's live play state is initialized from its derived baseline, and how
the effective build plus live state project into the engine's combat entity. Closes readiness-audit
gap G3. Saving a draft must never reset play state; that boundary is part of this contract.

## Spec references

- `docs/v0.01-readiness-audit.md#g3-new-character-live-state-initialization-and-engine-projection`
- `docs/character-wizard.md#character-model-direction` — baseline versus current values.
- `docs/character-wizard-spec.md#7-revision-and-review-lifecycle` — when a build becomes effective.
- `docs/table-spec.md#persistent-values-and-manual-adjustment-entries` — which values are Director-editable.
- `docs/table-spec.md#v001-temporary-stamina`, `#v001-surge-tracking` — extra counters that exist from
  creation.
- `docs/engine-architecture.md#proposed-boundaries` — engine-owned ids and entity contract.
- `docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope` — Ferocity and class resources
  are editable counters with no automated class logic in v0.01.

## In scope

- Initial values at first admission: current Stamina equals maximum; Recoveries current equals maximum;
  temporary Stamina 0; surges 0; Victories 0; heroic resource (Ferocity) starting value per source, with
  the explicit note that in-combat generation is manual in v0.01; condition toggles all off; XP if the
  source defines a level-one starting value.
- The rule that re-evaluation after a build edit recomputes the baseline and leaves live values
  untouched, with the reconciliation of maxima recorded as an open question, not decided here.
- Engine projection: a `HeroEntity` shape the engine consumes (ids, characteristics, maxima, current
  values, granted abilities with source text and known structured metadata, kit values), with a
  worked projection for the hero fixture.
- Foe projection for symmetry: the Goblin Warrior snapshot projects into a `FoeEntity` with printed
  Stamina, free-strike and ability metadata, and Slain status at zero.
- `shared/contracts/liveState.ts` and `shared/contracts/entities.ts` types only.

## Out of scope

- Reconciliation policy when maxima change (raise as `Q-R-n`, apply no default).
- Hero dying automation (deferred).
- Class-specific resource generation (deferred).
- Persisting these values (A02, S02).

## Inputs and dependencies

R02 committed. The Goblin Warrior entry of the S01 content snapshot (`shared/content/compendium/statblock.json`, id `mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior`) for the foe example.

## Deliverables

- `docs/live-state-initialization.md` — contract, both worked examples, open questions.
- `shared/contracts/liveState.ts`, `shared/contracts/entities.ts`.
- Update to `docs/character-wizard-spec.md#12-open-decisions` marking G3 delivered and listing the
  reconciliation question id.
- `rules` commit.

## Acceptance checks

1. Every initial value cites its source sentence or the ruling that sets it.
2. The hero-fixture projection lists every ability the R02 baseline grants, with verbatim source text
   attached, and no ability the source does not grant.
3. The Goblin Warrior projection matches the printed values of the S01 content entry (`structured` and `features` in `shared/content/compendium/statblock.json`) exactly.
4. The contract states in one sentence what happens to live values on draft save and on re-evaluation.
5. Types compile; no logic.
6. Reviewer confirms the source citations.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/health/*.md`
- `vendor/steel-compendium/en/unified/md/class/fury.md` (Ferocity starting value and reset wording)
- `vendor/steel-compendium/en/unified/md/chapter/monster-basics.md`
- `vendor/steel-compendium/en/unified/md/monster/goblin/` (the Goblin Warrior entry)

## Open questions

None known at slice creation.

## Work log

_Empty._
