# V64: Ability grammar coverage audit

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Engine implementer (parser/rules-engine track) |
| Rules review | not required |
| Depends on | V26 specification (merged `3689226`), S01 content snapshot, V35 foe catalog |
| Unblocks | V26 implementation planning; later grammar extensions |
| Status | see `STATUS.md` |

## Goal

Produce a checked-in, deterministic audit of how much of the committed content the bounded V26
grammar covers: every hero ability entry, kit signature, wizard-granted ability, foe ability and
Malice feature with a power roll is classified as `COMPILES`, `COMPILES_WITH_REMAINDER` (with every
remainder clause typed) or `NO_MATCH` (with the reason), and remainder clause shapes are ranked by
frequency. The audit is developer evidence for V26's affected-ability audit and acceptance checks
4, 5, 10 and 11. It changes no runtime, backend, content or gameplay behavior, never evaluates an
expression, and does not claim support for any ability.

## Spec references

- `docs/build/V26-compiled-ability-effects.md#1-source-to-compiled-definition` — the bounded grammar
  (one power roll, three tiers, supported damage expressions, optional `push N`, bounded post-damage
  potency-condition remainder) and the rule that nothing outside the envelope is harmless.
- `docs/build/V26-compiled-ability-effects.md#4-evidence-that-this-scales-beyond-a-demonstration` —
  deterministic JSON/Markdown report over the integrated snapshot, populations kept separate.
- `docs/build/V26-compiled-ability-effects.md#acceptance-checks` — checks 4, 5, 10 and 11 (grammar
  generality, no lost mechanics, report generated twice identically, live-grant availability
  compared with the inventory).
- `docs/build/V26-compiled-ability-effects.md#affected-ability-audit--2026-09-16` — the inventory of
  ten live designs and three compile-only comparisons the classifier is checked against.

## In scope

- `scripts/audit-ability-grammar.ts` (`pnpm audit:abilities`): envelope readers for hero
  `ability.json` entries, kit signature sections, composed wizard grants (class, ancestry, perk,
  complication, kit, free strikes), foe `catalog.json` abilities and Malice features with a power
  roll; the bounded-grammar classifier; deterministic `report.md` and `report.json` under
  `docs/build/evidence/V26/coverage-audit-2026-09-20/`.
- Per-ability classification with typed remainder diagnostics and normalized clause-shape keys;
  totals per corpus; the full list of compiling hero abilities with live grant availability derived
  from the same content the wizard uses; V26 inventory agreement; top-40 clause shapes; a "what
  the grammar buys" summary; envelopes the readers could not reconcile.
- `tests/scripts/audit-ability-grammar.test.ts`: source-derived expectations for ten real entries,
  the check-5 mutation guard and a two-run determinism check.

## Out of scope

- Any compiler, resolver, Convex, `shared/resolve`, `src/` or UI change; V26 implementation itself.
- Rules interpretation: the classifier recognizes syntax only. A `COMPILES` result is not evidence
  that the ability's mechanics are supported or correct.
- Tuning the classifier to make it agree with the V26 designs; disagreements are findings.

## Inputs and dependencies

Committed content only: `shared/content/compendium/{ability,kit,perk,manifest}.json`,
`shared/content/foes/catalog.json`, the composed wizard definitions from
`shared/content/character-decisions.ts`, `supporting-complication-abilities.ts` and
`supporting-kits.ts`. No vendor read, network, backend or generated Convex types. The minimal
field-access conventions of `convex/lib/resolve.ts` (`effectsOf`, `abilityFromKit`,
`targetShapeOf`, `rollEntry`) and `shared/resolve/index.ts` (`plainText`, `;` clause splitting) are
copied into the script rather than imported, because `convex/lib/resolve.ts` requires generated
Convex types; the copy keeps every roll block instead of only the first.

## Deliverables

- `scripts/audit-ability-grammar.ts`, `package.json` script `audit:abilities`.
- `docs/build/evidence/V26/coverage-audit-2026-09-20/report.md` and `report.json`.
- `tests/scripts/audit-ability-grammar.test.ts`.
- This document and a `STATUS.md` row.

## Acceptance checks

1. `pnpm audit:abilities` twice produces byte-identical `report.md` and `report.json`.
2. `report.md` totals per corpus: 52 hero standalone, 25 kit signatures, 15 own-text grants,
   1158 foe abilities, 14 Malice features with a power roll; each split into the three categories.
3. The V26 inventory table lists all thirteen abilities with the classifier's category, and each
   row's `Agrees` column is recorded (a `no` is a finding, not a failure of this slice).
4. Every remainder clause in `report.json` has a `type`, a `shape` and a `locator`; the top-40
   shape table names example ability ids.
5. `pnpm exec vitest run tests/scripts/audit-ability-grammar.test.ts` passes.

## Ability design and playtest evidence

Not applicable: no ability is built or changed. The report population is not an implementation
inventory (V26: "the report population is not automatically the implementation scope").

## Rules research

None. The classifier applies V26's specified syntax; it makes no mechanical claim.

## Open questions

None.

## Work log

### 2026-09-20 — audit built

- Branch `slice/V64-ability-coverage-audit` in `.worktrees/engine-audit`, cut from main `0f47e89`, rebased onto `b8eec27` and then current main before integration.
  Primary track: parser/rules engine. No development backend or server: pure Node script and one
  Vitest file, run on Presidium (`node_modules` linked from the main checkout; the script reads no
  vendor file).
- Classifier, readers, report and tests written; the grammar follows V26 section 1 exactly:
  supported damage expressions are `N`, `N + C`, `C + N`, `C`, `N + C or C` with an optional damage
  type; `push N` compiles only as the clause directly after damage; every other clause, section,
  second roll, tier table without a roll or unattached paragraph is a typed remainder. Remainder
  types extend the requested list (`potency-condition`, `push-with-extra`, `slide`, `shift`,
  `effect-paragraph`, `malice-spend`, `trigger`, `second-roll`, `extra-table`, `unknown`) with
  `pull`, `condition`, `extra-damage`, `resource-spend` (hero "Spend N Ferocity/Essence"),
  `roll-expression`, `tier-damage` and `no-power-roll` so NO_MATCH reasons are typed as well.
- Live availability is derived from `getDefinitions(1)` and `(2)`: an ability is `selectable` when
  a granting option/decision chain is supported (`supportedInV001`, mirroring
  `shared/evaluate/structure.ts#isSupported`), `not-selectable` when every path is unsupported,
  `not-granted` when no decision references it, `unknown` for pool-restricted decisions.
- Result: all thirteen V26 inventory rows agree with the classifier. Totals and findings are in
  the report; the commit message and lead handoff record the verification commands run.
- Envelopes the readers could not reconcile (28 diagnostics on 25 foe abilities) are retained as
  `unknown` remainders and listed in the report, for example Vampire Lord's Sacrifice (a nested
  second ability), Iron Banner (bullet list after the Effect), No Escape (second roll) and
  Laser Lancet / Flashing Fangs (`2d10 + highest characteristic:` roll headers).

### 2026-09-20 — verification (run on Presidium; pure Node script and one Vitest file only)

- `node scripts/audit-ability-grammar.ts` twice: identical output, `report.json` md5
  `d016c77fa85705b45906b7ab8cd379a6`, `report.md` md5 `a30f0130dfa341aeda2b6d0f43f936dd`; totals
  hero standalone 52 (8/22/22), kit signature 25 (2/19/4), own-text grants 15 (1/2/12), foe
  abilities 1158 (20/566/572), Malice with a power roll 14 (0/13/1), as COMPILES / with remainder /
  NO_MATCH. All 13 V26 inventory rows agree with their design-implied category.
- `node_modules/.bin/vitest run tests/scripts/audit-ability-grammar.test.ts`: 12 passed.
- `tsc --noEmit` with a scoped config extending `tsconfig.web.json` over the test and script: exit 0.
- `prettier --check` and `eslint` on the script, test and `package.json`: clean.
- `node scripts/check-links.ts`: passes over 270 Markdown files with both vendor submodules present
  (the Compendium was cloned locally at its pin into this worktree; forge-steel was linked from the
  main checkout only for the link check, then the empty submodule directory was restored).
  `node scripts/check-vendor.ts` passes. `git diff --cached --check` passes.
- Not run here: `pnpm check`, `pnpm build`, browser tests. The change adds no runtime, backend or
  UI behavior, so the programmatic headless completion gate and per-ability playtest gate do not
  apply; the lead's integration check on CT114 should run the full `pnpm check` (the new test is in
  the `scripts` Vitest project).
- Handoff: committed on `slice/V64-ability-coverage-audit`, not merged; no runtime update needed.
