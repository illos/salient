# V05: Ability parser and class/stat-block automation

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team (engine) with rules researcher |
| Rules review | required |
| Depends on | A09, V04 |
| Unblocks | None; V08 and V13 consume the parsed definitions (soft) |
| Status | see `STATUS.md` |

## Goal

Replace v0.01's manual resolution of unique ability effects with a deterministic parser for supported
Draw Steel wording and an executable-definition runtime: preserve source text and provenance, parse
supported phrases into typed effects, execute them through shared operations, and leave unrecognized
clauses explicitly unsupported. Coverage is defined by a verified core subset, not by every ability in
the corpus; the slice ends at class-specific resource lifecycles that need their own sourced contracts.

## Spec references

- `docs/engine-architecture.md#from-rules-text-to-executable-behavior` — preserve text, parse supported wording, unsupported stays explicit.
- `docs/engine-architecture.md#structured-effects-are-the-common-contract` — typed effects with actor/target IDs.
- `docs/rules-language.md#proposed-implementation-model` — five-stage model; compositional grammar.
- `docs/rules-language.md#homebrew-behavior` — read to bound: homebrew is excluded from V1 content.
- `docs/fury-goblin-automation.md#per-mechanic-status` — the deferred mechanics this slice may automate.
- `docs/fury-goblin-automation.md#turn-start-ferocity` — sourced example for a class resource trigger.
- `docs/table-spec.md#inline-interaction-cards-in-the-game-log` — cards collect only missing facts; Resolved at table.
- `docs/pre-alpha-design-gaps.md#v001-combat-acceptance-checklist` — the deferral rows being lifted.

## In scope

- Grammar for the recurring core phrases found in `docs/research/hero-parser-sample.md` and `docs/research/monster-parser-sample.md`: damage tiers, push/slide, conditions with save-ends/EoT, targets, costs, potency.
- Executable definitions stored with source reference and grammar version; diagnostics for unsupported clauses.
- Turn-start Ferocity and other confirmed-deferred hero resource triggers, executed through the clock.
- Minimal-input cards generated from a definition's missing facts.
- Coverage report: which core abilities parse fully, partially, or not at all.

## Out of scope

- Homebrew text input and live prose interpretation during play (`docs/engine-architecture.md#from-rules-text-to-executable-behavior`).
- Summoner/Beastheart and supplemental mechanics; retainers (`docs/reference-library-spec.md#confirmed-release-scope`).
- Any AI-generated translation as production input.
- Item mechanics (V07) and terrain objects (V20).

## Inputs and dependencies

- Hard: A09 and V04 (areas, linked responses, cards).
- Hard: S01 structured corpus.
- Soft: none stubbed; the parser must run against the pinned corpus.

## Deliverables

- `engine/parser/` grammar and tests; `engine/runtime/` effect execution.
- `docs/ability-automation-coverage.md` — generated coverage table with counts per class and per monster family.
- Registered operation to execute a parsed ability with fact collection.
- Implementation notes in `docs/fury-goblin-automation.md#per-mechanic-status`.

## Acceptance checks

1. Goblin Spinecleaver's middle Axe tier resolves to 4 damage and a push-3 instruction as typed effects with source path attached (`docs/rules-language.md#examined-example`).
2. An ability containing an unsupported clause executes its supported effects, records the unsupported clause as pending, and offers Resolved at table.
3. Turn-start Ferocity gain matches the value stated in `docs/fury-goblin-automation.md#turn-start-ferocity` on a persisted Fury sheet after a clock firing.
4. Expected test values are derived from cited Compendium text in the test file, not from running the parser.
5. The coverage report lists every level-1 core class signature ability with a parse status; no status is "guessed".
6. Re-running the parser over the pinned corpus is deterministic (identical definition hashes).

## Rules research

- `vendor/steel-compendium/en/unified/md/chapter/combat.md`, `chapter/tests.md`, `chapter/classes.md`
- `vendor/steel-compendium/en/unified/md/rule/combat/*.md`, `rule/damage/*.md`, `rule/dice/*.md`, `rule/character/potency.md`
- `vendor/steel-compendium/en/unified/md/condition/*.md`
- `vendor/steel-compendium/en/unified/md/rule/resource/heroic-resource.md`, `rule/resource/surge.md`
- `vendor/steel-compendium/en/unified/md/class/fury.md` and the eight other core class files.
- Research already done: `docs/research/hero-parser-sample.md`, `docs/research/monster-parser-sample.md`, `docs/research/content-storage-options.md`.

Rulings that apply: affordability blocks execution; warnings never block; critical extra action is offered, not executed.

## Open questions

Candidate `Q-V-n` entries from `docs/engine-architecture.md#open-decisions`:

- Degree of automatic application versus preview and confirmation for triggered choices.
- Initial supported grammar and handling of official wording variants.
- Engine release/compatibility policy for mismatched content during automated play.

## Work log

_Empty._
