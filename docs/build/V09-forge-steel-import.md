# V09: Forge Steel import

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | V08 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Import `.ds-hero` / `.drawsteel-hero` files from the pinned Forge Steel version into owned characters:
validate structure, map selections to SCC ids through scoped mappings, reconcile Forge Steel's
damage/Recoveries-used representation with our current values, preserve the original payload and
unmapped data, and never let imported ownership or approvals grant authority. Export is not delivered;
the adapter boundary that would allow it is preserved.

## Spec references

- `docs/character-wizard-spec.md#required-import` — formats, validation, reconciliation, snapshot as initial revision.
- `docs/character-wizard-spec.md#desired-export` — deferred; preserve the adapter path.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — pins, scoped mappings, no silent ambiguity.
- `docs/forge-steel-interchange.md#file-format-and-import-path` — file format research.
- `docs/forge-steel-interchange.md#current-state-is-not-simply-current-totals` — state representation.
- `docs/forge-steel-interchange.md#proposed-adapter-boundary` — adapter shape.
- `docs/forge-steel-interchange.md#first-compatibility-examples` — sample files and expected results.
- `docs/v1-spec-checkpoint.md#release-scope` — Characters row: import included, export deferred.

## Parts

The slice is delivered in three parts, each merged separately.

- **Part a (this branch):** the pure adapter under `shared/interchange/forge-steel/` (shape guard,
  active-feature walker, scoped mappings, `importForgeHero`, export stub), the
  `characterImport.importForge` mutation with a `characterImports` table, the CLI route
  `pnpm character:import <file>`, a headless `forge-import` cohort, and tests. Levels 1–2 as the
  retained exports prove them.
- **Part b:** import UI in the wizard/character list; owner-visible diagnostics (Q-V-5); more scoped
  mappings (remaining ancestries, careers and classes, level 3) as retained exports prove them.
- **Part c:** play-state reconciliation (Stamina damage, Recoveries used, surges, XP, Victories,
  conditions; Q-V-3), complications, titles and inventory as V07 allows.

## In scope

- Parser for the two file extensions against Forge Steel pin
  `5a846aadb623a9855a023e9403bb887a956c341f`; support range per Q-V-4 (pinned shape only for now).
- Structural validation distinguishing malformed input from an incomplete valid draft.
- Selection mapping to Salient decision ids through scope-keyed rules; unmapped and ambiguous entries
  surfaced as diagnostics, never guessed.
- The original payload preserved verbatim with its SHA-256 and the Forge pin, outside evaluation.
- Summoner and Beastheart are supported classes (Q-CHAR-14); other supplements and homebrew are
  preserved in the payload, diagnosed, and never enabled.

## Out of scope

- Export implementation (`docs/character-wizard-spec.md#desired-export`); `export.ts` is a stub.
- Reconstructing an earlier level than the snapshot beyond what the data establishes.
- Importing items into inventories (preserved data only unless V07 has landed).

## Inputs and dependencies

- Hard: V08 (full core class choice model and decision ids).
- Hard: `vendor/forge-steel` at its pin, read-only, from the main checkout.
- Fixtures: `tests/fixtures/v45-reference/*.ds-hero` (real Forge exports; `docs/research/hero-sample.json`
  is not a hero file) paired with the hand-derived `tests/fixtures/v25-fury.json`, `v25-bethell.json`
  and `v32-fury-level-two.json`.

## Deliverables

- `shared/interchange/forge-steel/`: `shape.ts`, `walker.ts`, `names.ts`, `mappings.ts`, `import.ts`,
  `export.ts` (stub).
- `convex/characterImport.ts` (`importForge`), `convex/lib/characterDrafts.ts` (the creation path
  shared with `characters.create`), `characterImports` in `convex/characterTables.ts`.
- `scripts/forge/import.ts` (`pnpm character:import`), `scripts/headless/forge-import.ts`.
- `tests/forge-import.test.ts`, `tests/app/forge-import.test.ts`.

## Acceptance checks

Part a:

1. Importing `Grug-level-1.ds-hero`, `Grug-level-2.ds-hero` and `Bethell-corrected-export.ds-hero`
   yields exactly the selections of `v25-fury.json`, `v32-fury-level-two.json` and
   `v25-bethell.json` (lists compared as multisets; Bethell's authored name differs as documented),
   at levels 1, 2 and 1.
2. Malformed JSON, a non-hero object and a wrong field type are rejected; through the mutation they
   write no characters, revisions, imports or command receipts. An oversized file (> 512 KB) is
   rejected the same way. A valid hero with null class or career imports as a partial draft; an
   unnamed hero is saved as "Imported hero" and over-long notes are shortened, each with a
   diagnostic. Reusing a command id with a different file is rejected.
3. The mutation makes the caller the owner of an unattached draft at revision 1 (no campaign, no
   effective build, no live state, no review) evaluated by the same path as `characters.create`,
   and stores the payload verbatim with its SHA-256 and the Forge pin. Another user cannot read it.
4. Complications, titles, inventory, projects, ability customizations, non-default play state,
   folders and sourcebooks outside core, orden, beastheart and summoner each produce a diagnostic
   (the last is not listed as unmapped build data); diagnostic text, count and size are bounded; a Forge choice without a scoped rule,
   a value outside the decision's Compendium options, and a Forge choice where the Compendium grants
   a fixed value each produce a diagnostic and leave the decision empty.
5. Imported hero ids, folders and campaign-looking state grant nothing. Account deletion removes
   import rows, reading at most about 2 MiB of stored payload per purge step.
6. No code path claims export support.

Parts b and c: a Summoner or other unsupported selection is shown as unmapped in the UI; Stamina
damage and Recoveries used are reconciled per Q-V-3 with the rule cited.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/health/stamina.md`, `rule/health/recoveries.md`
- `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`
- Research already done: `docs/forge-steel-interchange.md`, `docs/research/hero-parser-sample.md`.

## Open questions

- Q-V-3: whether imported damage and Recoveries used survive admission.
- Q-V-4: the supported Forge Steel version range.
- Q-V-5: whether preserved unmapped data is shown to the owner.
- Q-V-6: what to do with a file above the supported level.

## Work log

- 2026-09-24: part a started by WIZARD3 on `slice/V09` (`.worktrees/forge-import`) from main
  `dd8c9ed`. Forge pin verified: `git -C vendor/forge-steel rev-parse HEAD` =
  `5a846aadb623a9855a023e9403bb887a956c341f` (main checkout).
- Mapped: ancestry (name, Devil Silver Tongue skill, purchased traits for any ancestry with a
  Salient points decision, borrowed Revenant traits excepted), culture (name, language,
  environment/organization/upbringing and their skills), career (name, inciting incident; Soldier
  and Mage's Apprentice features), class, subclass (via the class profile), characteristic array and
  assignment (checked against the profile's fixed scores), the Berserker kit slot, Fury levels 1–2 and
  Elementalist level 1 skills, abilities, enchantment, ward and perks, details name and notes. Forge
  "free choice" slots the Compendium fixes (Fury Nature, Berserker Lift, Elementalist and
  Mage's Apprentice Magic, Caelian) are checked; Forge's Magic-collision replacement on the career
  maps to `class.elementalist.magic-replacement`.
- Diagnosed only: everything else listed in acceptance check 4, plus unmapped active choices
  (e.g. Tactician Field Arsenal, Revenant former life, Conduit domains, other classes' feature ids).
- `forgeNameAliases` moved to `shared/interchange/forge-steel/names.ts`; `scripts/forge/` re-exports
  it. `tests/helpers/v45-reference.ts` keeps its assertion-based projection for the V45 test.
- 2026-09-24: part a committed on `slice/V09` (`8713d98` adapter, `7148cfe` mutation, CLI, headless
  cohort and app test). Authoring checks: `npx tsc --noEmit` and `npx tsc -p tsconfig.web.json
  --noEmit` clean, `pnpm -s lint` clean, `npx vitest run tests/forge-import.test.ts
  tests/app/forge-import.test.ts` 10/10. Convex push of `git archive 7148cfe` to an anonymous local
  deployment: "Convex functions ready"; codegen matches the committed `_generated/api.d.ts` entries
  for the two new modules. TESTER has not run the suite or the `forge-import` headless cohort.
- 2026-09-24: independent review FAILed; fixes in `13969f2`.
  - Account deletion: import rows keep the payload in the row, but the purge now deletes them one
    at a time under a 2 MiB payload-byte budget (`PURGE_IMPORT_BYTES`, rows store `payloadBytes`)
    and continues in a scheduled step. File storage was not used: `ctx.storage.store` exists only
    in actions, so the import would need an action plus an internal mutation, and a failure
    between the two steps would leave an orphaned file. The byte budget keeps one mutation.
  - Diagnostics: each string is capped at 200 characters (file text inside reasons at 40–60), with
    at most 200 entries and 64 KB in total, plus an "omitted" summary entry.
  - Sourcebooks: only ids outside core, orden, beastheart and summoner are noted, and they are not
    listed as unmapped.
  - Incomplete heroes: an empty name becomes "Imported hero" (`details.name` is left open), and names
    over 100 characters or notes over 10,000 are shortened, each with a diagnostic.
  - A decision whose options depend on a parent choice offers only that parent's options. The
    generic kit rule is replaced by the scoped Berserker kit rule.
  - Checks: both `tsc` configs clean, `pnpm -s lint` clean, `vitest run tests/forge-import.test.ts
    tests/app/forge-import.test.ts` 19/19, and the Convex push of `13969f2` reported "Convex
    functions ready" with the two `characterImports` indexes added.
- Independent re-review PASS (2026-09-24). Its remaining nit is fixed: a culture name over 100 characters is shortened with a diagnostic, rather than failing the whole file on the selection size cap.

## Publication: 2026-09-25

Merged in train 12 (V180, V09 part a) as main `1118489` and published as Worker `74d47264-33a5-44ce-a544-73c36de159c4`. Release
logs: `/srv/presidium/projects/salient/test-artifacts/train12-release-1118489`.
