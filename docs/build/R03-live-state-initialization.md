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

### 2026-09-14 — plan (rules researcher, branch `slice/R03`)

- Read: `CLAUDE.md`, `agent.MD`, `docs/build/README.md`, this slice, `docs/compendium-navigation.md`, every
  cited spec section (`v0.01-readiness-audit.md#g3-...`, `character-wizard.md#character-model-direction`,
  `character-wizard-spec.md#7-revision-and-review-lifecycle`, `#12-open-decisions`,
  `table-spec.md#persistent-values-and-manual-adjustment-entries`, `#v001-temporary-stamina`,
  `#v001-surge-tracking`, `#v001-manual-condition-tracking`, `engine-architecture.md#proposed-boundaries`,
  `pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope`), R02's document, contract and
  examples JSON, R04's document and contract, R05's document and `core-conditions.json`, `clock.ts`,
  `history.ts`, `content.ts` (S01), `src/contracts.ts`, `src/engine.ts`, `docs/hero-fixture.md`,
  `docs/fury-goblin-automation.md`, `docs/character-sheet-spec.md`, `convex/foes.ts`, and the Compendium
  files in the research list plus those they reference (listed in the document's *Sources read*).
- Rebased onto `main` after S01 merged: `shared/goblin-warrior.json` is gone; the foe example and the test
  read the snapshot entry `mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior` and the vendor file.
- Files: `docs/live-state-initialization.md` (new), `shared/contracts/liveState.ts` and
  `shared/contracts/entities.ts` (new, types only), `tests/live-state-initialization.test.ts` (new, engine
  project), implementation notes in `docs/character-wizard-spec.md#12-open-decisions` and
  `docs/v0.01-readiness-audit.md` (G3), questions Q-R-200 and Q-R-201 in `docs/rules-questions-for-user.md`.
  No `vendor/`, `shared/content/**`, `convex/**` or `web/**` changes; no `STATUS.md` edit (lead).
- Worked examples were generated from the pinned files, the snapshot and R02's JSON by a throwaway script
  (not committed) so every `text` is byte-exact; the test re-derives every value from those sources.
- Spec discrepancies: none. Reconciliation of maxima is Q-CHAR-2 (already open); cited, no default applied.

### 2026-09-14 — closing entry

Delivered the four artifacts above plus the spec/audit notes and two questions. Acceptance checks:

1. *Every initial value cites its source sentence or ruling.* Document section 2: per value a quoted
   sentence with path, or the cited ruling; interpretations (current Stamina = maximum, Recoveries full,
   XP 0, printed foe Stamina) are labeled with alternatives; Ferocity 0 is R02's interpretation by
   reference. `tests/live-state-initialization.test.ts` "check 1" reads the Victories, surge, temporary
   Stamina, respite, condition and XP-table sentences from the pinned files and compares each live value
   to its baseline field or constant. Reviewer confirmation pending.
2. *Hero projection lists every R02-granted ability with verbatim text and no other.* "check 2": the
   ability names equal R02's complete-example list in order (seven), each `text` equals the complete pinned
   file byte-for-byte, frontmatter fields equal the projection's fields, six abilities equal their snapshot
   entries, Pain for Pain is verified against the vendor file and the kit entry's text.
3. *Goblin Warrior projection matches the snapshot entry exactly.* "check 3": `text` equals the entry and
   the vendor file; Stamina 15, free strike 1, speed 6, stability 0, size 1S, level 1, characteristics from
   the frontmatter via S01's parser; abilities equal the entry's `features` (names, usage, distance, target,
   keywords, cost, roll, tiers) with byte-exact blockquote blocks; Crafty verbatim; live 15/0/all off;
   `slain` false; winded value 7.
4. *One sentence for draft save and re-evaluation.* Document section 3, bold sentence; "check 4" asserts it
   and that every cited question id exists in the questions file.
5. *Types compile; no logic.* `tsc --noEmit` and `tsc -p tsconfig.web.json` inside `pnpm check`; both files
   contain only `type`/`interface` declarations and `import type`.
6. *Reviewer confirms citations.* Pending (deferred to the user's audit thread).

```
$ npx vitest run --project engine tests/live-state-initialization.test.ts
 Test Files  1 passed (1)   Tests  4 passed (4)
$ pnpm check
All matched files use Prettier code style!
(engine)  Test Files  9 passed (9)   Tests  51 passed (51)
(app+scripts)  Test Files  12 passed (12)   Tests  79 passed (79)
check-links, check-vendor: passed; content:check: 403 entries match; vite ✓ built in 2.19s
EXIT 0
```

Unfinished, stated honestly: independent review and rules review (commit carries
`Rules-Review: required (pending)`, no `Reviewed-By:`); the user's answers to Q-CHAR-2, Q-R-200 and
Q-R-201; the S01 follow-up note (kit signature ability files are not snapshot entries; the projection
cites the kit entry as `contentId`); A02 persists the live record and A01/A03 build the engine `Entity`
from the projection using the section 6 mapping.

