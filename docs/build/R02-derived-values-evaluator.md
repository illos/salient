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

### 2026-09-14 — plan (rules researcher, branch `slice/R02`)

- Read: `CLAUDE.md`, `agent.MD`, `docs/build/README.md`, this slice, `docs/compendium-navigation.md`, the
  cited spec sections (`v0.01-readiness-audit.md#g2-...`, `character-wizard-spec.md#3-decision-system`,
  `#9-shared-operations-and-reliability`, `character-wizard.md#character-model-direction`,
  `character-sheet-spec.md`, `workstream-app-status.md#integration-dependencies`), R01's
  `docs/fury-level-one-decisions.md` and `shared/content/fury-level-one-decisions.json` (input vocabulary),
  `docs/hero-fixture.md`, R04 `docs/roll-and-damage-resolution.md` (kit damage, winded, Catch Breath, saves)
  and R05 `docs/conditions-and-clock.md` (ending conditions), `shared/contracts/{clock,rollResolution}.ts`,
  `docs/v1-character-wizard-contracts.md` (class baseline table, so nothing is restated differently), and
  the Compendium files listed under *Rules research* plus the entries they reference (listed in the
  document's *Sources read*).
- Files to touch: `docs/character-derived-values.md` (new), `shared/contracts/characterEvaluation.ts` (new,
  types only, imports `Characteristic` from `rollResolution.ts`), `shared/content/character-evaluation-examples.json`
  (new, the three examples in contract shape), `tests/character-derived-values.test.ts` (new, Vitest engine
  project), implementation notes in `docs/character-wizard-spec.md#3-decision-system` and
  `docs/v0.01-readiness-audit.md` (G2), this work log. No `vendor/` changes; no `STATUS.md` edit (lead).
- Dependencies: R01 committed (real). Branch fast-forwarded to `main` at `11c0183` so the commit hook
  accepts `Rules-Review: required (pending)`.
- Spec discrepancies noted: none. Path corrections: `rule/character/speed.md` carries the *Starting Size
  and Speed* sentence that R01 cited from the clean Heroes text (recorded in the document, section 1.16).

### 2026-09-14 — closing entry

Delivered: `docs/character-derived-values.md` (formulas with verbatim source sentences, provenance rule,
evaluator contract, three hand-computed examples, path corrections, questions table),
`shared/contracts/characterEvaluation.ts` (types only), `shared/content/character-evaluation-examples.json`
(the three examples in contract shape), `tests/character-derived-values.test.ts`, implementation notes in
`docs/character-wizard-spec.md#3-decision-system` and `docs/v0.01-readiness-audit.md` (G2 row and note).
No new `Q-R-n` question was needed; the document cites Q-R-100..103, Q-CHAR-10..12 and Q-R-3 where they
apply and labels its two interpretations (Stamina-maximum reading, ferocity creation value) with alternatives.

Acceptance checks and evidence:

1. Every formula cites its source sentence: document section 1, one or more blockquotes per formula. A
   verification script normalized every blockquote quote (32 blocks) and every JSON provenance quote (75
   distinct sentences) and found each verbatim in its cited pinned file; `tests/character-derived-values.test.ts`
   "check 1" repeats the JSON half on every run. Reviewer confirmation is pending (not self-attested).
2. Hero-fixture numbers reproduced: Stamina 30 (21 + 9), Recoveries 10, recovery value 10, winded 15, speed
   6, stability 2, size 1M, potencies 0/1/2, saves at 5+, Renown 1, ten skills, four language entries, seven
   abilities (document 4.1). No fixture number is wrong; the fixture is unchanged. "check 2" derives the
   expected numbers from `class/fury.md` and `kit/mountain.md` frontmatter and the rule sentences.
3. Incomplete example names `kit.choice` (`required-choice-missing`); invalid example names
   `ancestry.devil.purchased-traits` (`budget-exceeded`, the source's own Horns + Wings example). "check 3".
4. Every baseline value in the complete example has provenance: the JSON carries a provenance entry for
   each `DerivedValue` and granted item; "check 1" walks all of them and rejects any unknown decision id.
5. Types compile with no logic: `tsc --noEmit` and `tsc -p tsconfig.web.json` inside `pnpm check`; the file
   contains only `type`/`interface` declarations and one `import type`.
6. Ambiguities listed as questions: document section 5; the test asserts every `uncertainty` id the examples
   carry appears in the document and in `docs/rules-questions-for-user.md`.

Commands and output:

```
$ npx vitest run --project engine tests/character-derived-values.test.ts
 Test Files  1 passed (1)   Tests  4 passed (4)
$ pnpm check
All matched files use Prettier code style!
(engine)  Test Files  8 passed (8)   Tests  47 passed (47)
(app+scripts)  Test Files  8 passed (8)   Tests  43 passed (43)
check-links, check-vendor, foes:source: passed;  vite ✓ 399 modules transformed, built in 2.72s
EXIT 0
```

What remains: rules review and independent review (deferred to the user's audit thread per the lead;
`Rules-Review: required (pending)` on the commit, no `Reviewed-By:`); the user's answers to the cited open
questions; R03 consumes the baseline; A02 implements the evaluator against the types and examples.
