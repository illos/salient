# S01: Content pipeline from the pinned Compendium

| Field | Value |
| --- | --- |
| Family | S |
| Milestone | v0.01 |
| Owner type | App lead (with a rules reviewer for extraction fidelity) |
| Rules review | required |
| Depends on | None |
| Unblocks | R01 (soft), A02, A03, V13 |
| Status | see `STATUS.md` |

## Goal

Replace the single hardcoded Goblin Warrior snapshot with a versioned, build-time content snapshot
generated from the pinned Compendium: readable source text plus the structured metadata the source
actually supplies, for exactly the content v0.01 needs. This closes the packaging half of readiness-audit
gap G6. The pipeline extracts and records; it does not interpret rules.

## Spec references

- `docs/v0.01-readiness-audit.md#g6-engine-placement-and-content-delivery-for-v001`
- `docs/data-architecture-spec.md#3-shared-game-content` and `#31-common-pack-contract--proposed` — the
  pack direction this snapshot is the first instance of.
- `docs/data-architecture-spec.md#34-engine-compatibility-metadata` — version identities.
- `docs/monster-catalog-spec.md#recommended-storage-boundary` and `#logical-records` — foe record shape.
- `docs/monster-catalog-spec.md#baseline-stats-and-unresolved-values` — unresolved values stay explicit.
- `docs/reference-library-spec.md` — readable coverage is separate from automation coverage.
- `docs/steel-compendium.md` — pin and update procedure; never advance the pin.
- `docs/rules-adaptation-principles.md` — complete verbatim source text in the log.

## In scope

- `scripts/build-content.ts` generating `shared/content/` from `vendor/steel-compendium` at the pinned
  revision, replacing `scripts/build-foe-source.ts`. Output is checked in and verified by
  `pnpm content:check` (regenerate and diff), the same way `foes:source` works today.
- Content manifest: Compendium revision, generator version, generation date, list of included entries.
- Included entries for v0.01: Goblin Warrior stat block; devil ancestry and its traits; Fury class
  through level one including signature and heroic abilities and the Ferocity text; the kits eligible
  for a Fury; cultures, careers, perks, skills and languages needed by R01; complications; the core
  conditions; the common actions and maneuvers (free strikes, Catch Breath, Defend, Aid Attack, and the
  rest of the source's common list); the rules pages R04 and R05 cite (power roll, edge/bane, critical,
  damage, Stamina, winded, temporary Stamina, recoveries, saving throw, Malice, combat round, turn).
- Per entry: stable id, source path, verbatim Markdown, and only the structured fields the source states
  explicitly (for abilities: name, action type, keywords, cost, distance, target, roll characteristic,
  tier text; for stat blocks: printed values). Fields the source does not state are absent, never
  defaulted.
- A small readable schema doc `shared/content/README.md`.
- Convex side: a `content` table or module that exposes these entries by id to shared operations, and a
  reseed command under the disposable-data policy.

## Out of scope

- Any other class, ancestry, or monster (V08, V06, V13).
- Interpreting ability text into executable effects (V05).
- A general pack format, pack selection UI, or community packs (data architecture 3.1 to 3.3, deferred).
- Search or a browsable reference library (V13).

## Inputs and dependencies

None. The pin in `.gitmodules` is authoritative; verify `git submodule status` matches `fb83a789…`.

## Deliverables

- `scripts/build-content.ts`, `shared/content/**`, `shared/content/README.md`
- `convex/content.ts` (queries) and `convex/contentTables.ts`
- `pnpm content:build`, `pnpm content:check` in `package.json`; `foes:source` removed or aliased
- Update `docs/monster-catalog-spec.md` checkout-status paragraph and `docs/steel-compendium.md`

## Acceptance checks

1. `pnpm content:check` passes on a clean checkout and fails when any generated file is edited by hand.
2. For ten randomly chosen entries, the reviewer diffs the verbatim Markdown against the vendor file and
   finds no difference.
3. Every structured field on the Goblin Warrior and on each Fury level-one ability is traceable to a
   line in the source file; the reviewer spot-checks all ability fields.
4. No entry contains a field whose value was inferred (the reviewer searches for defaults such as 0,
   "none", or "unknown" and confirms each is verbatim from source or absent).
5. `convex/content.ts` returns the Goblin Warrior entry with the same text the current
   `shared/goblin-warrior.json` holds; the existing foe tests keep passing or are updated to the new path.
6. The manifest revision equals the submodule commit.

## Rules research

Extraction only. Paths: `vendor/steel-compendium/en/unified/md/{monster/goblin,ancestry/devil.md,
class/fury.md,kit,culture,career,perk,skill,complication,condition,rule}`. Confirm with
`docs/compendium-navigation.md` where the unified paths point at supplemental chapters and record
those as excluded.

## Open questions

None known.

## Work log

_Empty._
