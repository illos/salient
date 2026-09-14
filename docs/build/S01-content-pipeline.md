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

### 2026-09-14 — Plan (implementer: Claude Fable 5.1, worktree `slice/S01`)

Spec sections read in this checkout: `docs/v0.01-readiness-audit.md#g6-engine-placement-and-content-delivery-for-v001`,
`docs/data-architecture-spec.md#3-shared-game-content`, `#31-common-pack-contract--proposed`,
`#34-engine-compatibility-metadata`, `docs/monster-catalog-spec.md#recommended-storage-boundary`,
`#logical-records`, `#baseline-stats-and-unresolved-values`, `#features-and-supporting-rules`,
`docs/reference-library-spec.md#proposed-source-and-delivery-contract`, `docs/steel-compendium.md#pinning`,
`docs/rules-adaptation-principles.md#show-the-source-and-the-work`. No discrepancy between the slice
summary and the cited sections. `git submodule status` reports `fb83a789…` (tag `v4.20260908021459`).

Findings that shape the plan:

- The Markdown frontmatter and the JSON twin of each entry use different field names for abilities
  (`action_type`/`tier1..3`/`power_roll_characteristic` in Markdown; `usage`/`effects` in JSON). The
  Markdown file is the only file whose lines a reviewer can point at, so **structured fields are the
  frontmatter of the verbatim source file, copied without renaming, defaulting or projection**. The JSON
  twin is read only as a cross-check (`name`/`scc` and any shared key must agree, else the build fails).
- The language list ("Languages in Orden") is not in `en/unified/md` at this pin; R01 cites the clean
  Heroes book. The manifest records that as a gap, not an entry.
- `perk/` holds 8 `mcdm.beastheart.v1` entries and `chapter/perks.md` is Beastheart, `chapter/rewards.md`
  is Summoner (navigation guide). All are recorded as excluded with the sourcebook prefix as the reason.
- No sentence in `chapter/kits.md` or `class/fury.md` restricts a Fury to a `kit_type`; the pipeline
  includes every `kit/` entry with its printed `kit_type` and records the chapter sentence that furies
  use kits as the inclusion basis. Eligibility by aspect is R01's Q-R-103, not a pipeline decision.
- R03's document names `shared/goblin-warrior.json` as its fixture; that file is replaced by the
  Goblin Warrior content entry, and the reference is updated to the new path.

Files to add:

- `scripts/build-content.ts` — generator and `--check`. Reads the pinned submodule (refuses a changed
  or dirty pin), selects the v0.01 paths, writes `shared/content/compendium/`.
- `scripts/lib/frontmatter.ts` — strict YAML-subset parser for the frontmatter (fails loudly on any
  construct it does not know), unit tested.
- `scripts/seed-content.ts` — `pnpm content:seed`: local-deployment-only `convex run content:reseed`.
- `shared/content/compendium/manifest.json`, one `<kind>.json` per entry kind, `index.ts` barrel —
  all generated; `shared/content/README.md` — schema document (hand-written).
- `shared/contracts/content.ts` — types for entries and manifest.
- `convex/contentTables.ts` (`content`, `contentManifest`), `convex/content.ts` (`get`, `list`,
  `manifest` queries; `reseed` internal mutation loading the bundled snapshot).
- `tests/scripts/build-content.test.ts` — frontmatter parser; ten sampled entries diffed verbatim
  against the vendor files; structured fields traced to frontmatter lines; manifest revision equals
  the submodule commit; `--check` fails on a hand edit.
- `tests/app/content.test.ts` — convex-test for the queries and reseed.

Files to change: `convex/schema.ts` (spread `contentTables` only), `convex/foes.ts` (Goblin Warrior
from the content table), `tests/app/foes.test.ts` (seed in setup; assert against the entry shape),
`package.json` (`content:build`, `content:check`, `content:seed`; `foes:source` removed; `check`
updated), `tsconfig.web.json`, `.prettierignore`, `README.md`, `docs/monster-catalog-spec.md`,
`docs/steel-compendium.md`, `docs/engine-architecture.md`, `docs/workstream-app-status.md`,
`docs/build/README.md` (verification baseline note), `docs/build/R03-live-state-initialization.md`
(fixture path). Removed: `scripts/build-foe-source.ts`, `shared/goblin-warrior.json`.

Generation date: `generatedAt` is reused from the committed manifest while the content hash is
unchanged, so `content:check` is stable across runs; the source commit date is recorded separately.

### 2026-09-14 — Verification and closing entry (implementer: Claude Fable 5.1)

Commits: `16fa575` feat(S01) generator, snapshot, contracts, schema README, scripts tests;
`5ac12ad` feat(S01) Convex mirror, reseed, foes migration, removals, spec notes; this entry is the
`docs(S01)` commit. Branch rebased onto `main` at `11c0183` before work started. Independent review is
deferred to the user's audit thread per the lead; rules review is pending (`Rules-Review: required
(pending)`).

Acceptance checks:

1. **Verified.** `pnpm content:check` passes on the clean checkout (output: `shared/content/compendium
   matches the clean pinned Compendium (403 entries, 10 excluded, revision fb83a789da8f)`). Editing
   `"name": "Dazed"` in `condition.json` by hand fails it (`condition.json: differs.`, exit 1); a stray
   `extra.json` fails it (`extra.json: not generated by this script.`). Limitation: editing only
   `generatedAt` in the manifest passes, because the date is reused while the content hash is unchanged.
2. **Verified by test**, reviewer rerun pending. `tests/scripts/build-content.test.ts` samples ten entries
   with a fixed seed (20260914) and asserts `entry.text === readFileSync(sourcePath)`; the same test
   checks each `structured` key is a frontmatter line of that file. Reviewer command for any entry:
   `jq -r '.[] | select(.id=="<id>") | .text' shared/content/compendium/<kind>.json | diff - <sourcePath>`.
3. **Verified by test.** Goblin Warrior `structured` equals the sixteen frontmatter fields of
   `goblin-warrior.md` (values written into the test from the file, lines 2–21); `features` equals the
   JSON twin's `features` array. Brutal Slam fields are asserted against lines 2–20 of `brutal-slam.md`;
   all 15 Fury level-one abilities are checked key-by-key against their own frontmatter.
4. **Verified by construction**, reviewer search pending. `structured` is the frontmatter minus
   `name`/`scc`/`type` with no renaming or filling; `features` is the JSON twin array verbatim; the
   generator has no default values. `rg -n '"(none|unknown)"' shared/content/compendium/*.json` returns
   only source text. Zeros in the snapshot are printed values (for example `reason: 0`).
5. **Verified.** `tests/app/content.test.ts` reseeds and reads the Goblin Warrior back through
   `content.get`, asserting `text` equals the vendor file (the same file the removed
   `shared/goblin-warrior.json` held as `text`). `tests/app/foes.test.ts` and
   `tests/app/independent-review.test.ts` were updated to seed content in setup and to assert against the
   new snapshot shape; all foe tests pass (66 tests, 10 files).
6. **Verified.** `manifest.compendium.revision` is `fb83a789da8f0327a389c277a0c790b1648d5810`; the test
   compares it to `git -C vendor/steel-compendium rev-parse HEAD` and to the superproject `ls-tree` pin.

`pnpm check` output (tail): lint clean; engine and app/scripts Vitest projects pass; `Checked 115
Markdown files: no broken relative links or anchors`; `vendor/ matches the pinned submodule commits (2
submodules)`; content:check as above; `vite build` succeeds. `node scripts/check-commit.ts --range
main..HEAD` reports every commit ok (run after the docs commit; result in the hand-back report).

Not done / deviations:

- `pnpm content:seed` was not executed: this worktree has no local Convex deployment. The reseed path is
  exercised by convex-test only. Whoever next runs `pnpm dev:backend` must run `pnpm content:seed` once,
  or `foes.catalog` reports that content is not loaded.
- `convex/_generated/api.d.ts` was extended by hand (two module lines) because `convex codegen` needs a
  configured deployment; the next `convex dev` run regenerates it identically.
- `src/content.ts` (the retained engine experiment loader) still reads the submodule directly with its
  own pinned SHA; it is out of this slice's scope and no longer imported by any script.
- Languages are a recorded manifest gap, not entries (R01 reads the clean Heroes book). No user question
  was needed: the slice asked for extraction only and every gap is recorded rather than resolved.
- Content queries require a signed-in user. The reference library's public/Director audience split is
  V13's decision; nothing here narrows it.
