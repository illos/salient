# V182: Forge Steel import at levels 2–3, level ceiling, play-state seed and import UI

Rules review: required. Depends on: V09 part a (merged to main, train 12), V163. This is V09 part b ([V09](V09-forge-steel-import.md#parts)).

## Goal

Import Forge Steel heroes of every class at levels two and three, refuse files above a class's
supported level, reconcile Forge damage and Recoveries used against Salient's own maxima (stored,
not applied), and give owners an import control with a preview and a diagnostics view
([required import](../character-wizard-spec.md#required-import)).

## Scope

- **Mappings, levels 1–3, all eleven classes** (`shared/interchange/forge-steel/mappings.ts`):
  skills, fixed Compendium grants Forge models as free choices (checked, never written), kits
  (Tactician's two Field Arsenal kits split in Forge order, labelled an interpretation), signature,
  3-, 5- and 7-cost abilities, subclass and level-two subclass abilities, perks with their Linguist
  and Eidetic Memory sub-choices, Troubadour invocation, Conduit prayer, ward and triggered action,
  Null and Talent augmentation and ward, Beastheart companion, Summoner formation (Forge option ids
  mapped, `feature/summoner/level-1/formation.md`), quick command, portfolio and level-three ward.
  New name aliases (`names.ts`) each cite the Compendium file, checked by cost, keywords, distance
  and flavor where the words differ.
- **Not mappable, always diagnosed or left open:** Forge records a Censor's or Conduit's domains but
  no deity, and Salient offers domains per deity, so deity, domains and every domain-dependent choice
  stay open with a "no deity" diagnostic. Forge has no Beastheart companion melee bonus, drake
  attunement or Tactician per-benefit Field Arsenal choice. Forge fixes the Storms Elemental Mote
  and offers one more signature minion; Salient's portfolio is a choice of two, so that slot is
  diagnosed. Forge does not record Area of Expertise or Specialist targets; those are diagnosed as
  choices to make in Salient.
- **Level ceiling (Q-V-6, INTERIM DEFAULT pending the user's answer):** `forgeImportRefusal` refuses
  a hero whose level is above `supportedLevelCeiling(class)` (`shared/content/character-support.ts`;
  Shadow 6, every other class 3); the message names that ceiling and nothing is written. Options B
  and C of Q-V-6 are not built.
- **Play-state seed** (`shared/interchange/forge-steel/state.ts`): Stamina = Salient Stamina maximum
  − `staminaDamage` (`rule/health/stamina.md`, not clamped: `rule/health/dying.md`); Recoveries =
  max(0, Salient Recoveries maximum − `recoveriesUsed`) (`rule/health/recoveries.md`); temporary
  Stamina and surges as recorded. Stored as `characterImports.liveSeed`; not applied to live state
  while Q-V-3 is open.
- **API and CLI:** `characterImport.previewForge` (query; no writes), `characterImport.importDiagnostics`
  (owner only; null for anyone else), `characterImport.importForge` now refuses above the ceiling and
  stores `liveSeed`. `pnpm character:import <file> --dry-run` calls the preview;
  `pnpm character:import --diagnostics <characterId>` reads the stored diagnostics.
- **UI:** "Import from Forge Steel" card on the characters list (`web/forge-import.tsx`): choose a
  `.ds-hero`/`.drawsteel-hero` file, see name, level, class and diagnostics (or the refusal), then
  Import opens the new draft. The character page shows the owner a collapsed "Imported from Forge
  Steel" panel with the diagnostics and the recorded (unapplied) Stamina and Recoveries.
- **Forge witness tooling:** `scripts/forge/pinned-source.mjs` bundles Forge sources from the pin's
  Git objects, so `scripts/forge/build.mjs` now works with the sparse Presidium copy (no files are
  extracted). One-copy rule: `build.mjs` writes the bundle (a derived copy of Forge sources) into a
  fresh `mkdtemp` directory, runs it from there in one command, and removes the directory in a
  `finally` block; only reports reach `SALIENT_FORGE_OUTPUT`, and the `import` runner writes no raw
  heroes there. New family `import`: `scripts/forge/import-witnesses.ts` and `run-import.ts`.
- **Choices Forge cannot supply** (`forgeAbsentDecisions` in `mappings.ts`): the Beastheart companion
  melee bonus, the drake attunement, and each Tactician `class.tactician.arsenal.*` benefit choice
  are reported as diagnostics whenever the evaluator's availability rule says the build needs them
  (for Field Arsenal, only benefits both kits print with different values). A Recoveries seed
  clamped to 0 is also reported.

## Proof status

| Class | Real Forge UI export | Forge-built (pinned definitions) L2 and L3 | Ledger class/kit choices imported |
| --- | --- | --- | --- |
| Fury | L1, L2 (Grug) | yes | all |
| Elementalist | L1 (Bethell) | yes | all |
| Shadow, Tactician, Troubadour, Null, Talent, Summoner | none | yes | all |
| Beastheart | none | yes | all but companion melee bonus (no Forge field) |
| Censor | none | yes | all but deity, domain, domain skill (no Forge deity) |
| Conduit | none | yes | all but deity and the domain chain (no Forge deity) |

The Forge-built heroes (`tests/fixtures/v182-forge/*.ds-hero.gz`, `manifest.json`) are not Forge UI
exports: the builder clones the unchanged pinned class, kit, perk, domain and summon definitions
into the retained Grug level-2 export (ancestry, culture and career kept) and fills Forge's own
selection fields from the ledger selections. Pinned Forge `FeatureLogic.isChosen` reports every
class choice made except the Censor and Conduit Domain Features, which the builder leaves empty, and
the template's own unfilled Soldier language.

**Mapped but unproven** (no file exercises them; option names are still checked against Salient's
options for every pinned Forge option by the runner's name coverage): other subclasses than each
ledger's (Fury Reaver and Stormwight kits and abilities; Censor Oracle and Paragon; Null
Cryokinetic and Metakinetic; Shadow Caustic Alchemy and Harlequin Mask; Tactician Mastermind and
Vanguard; Talent Telekinesis and Telepathy; Troubadour Duelist and Virtuoso; Beastheart Prowler,
Punisher and Spark; Summoner Graves, Spring and Storms), and the Linguist and Eidetic Memory perk
sub-choices. Name coverage leaves two expected gaps: Forge's Elementalist level-one 5-cost pool also
lists the level-two abilities, and Forge's Summoner "Summoner's Cradle" has no Compendium entry.

## Acceptance checks

1. `tests/forge-import-levels.test.ts`: each of the 22 Forge-built heroes (digest checked against
   the manifest) imports at its level with exactly the ledger's class and kit choices, except the
   named Forge gaps, which stay empty; Censor and Conduit report the missing deity; fully mapped
   classes have no class diagnostics at level 3; the ceiling refusal text; the liveSeed of a
   labelled synthetic Grug (damage 5, 2 Recoveries used) is Stamina 25 and Recoveries 8 against the
   hand-derived maxima 30 and 10 (`tests/fixtures/v25-fury.json`).
2. `tests/app/forge-import-levels.test.ts`: the preview writes no character, revision, import or
   command rows; a Fury file at level 4 is refused by preview and import with no rows written; the
   Tactician level-3 file persists the ledger's class choices; `importDiagnostics` returns the
   diagnostics and liveSeed to the owner, null to another user, and the draft has no live state.
3. `tests/browser/v182-forge-import.spec.ts` (non-table, authored only): refusal preview, preview,
   import, diagnostics panel, CLI readback.
4. Forge runner: `SALIENT_FORGE_OUTPUT=<dir> SALIENT_FORGE_FAMILY=import node scripts/forge/build.mjs`
   reports the table above and leaves no bundle behind.
5. Pure: every V182 name alias resolves to the `name:` of its cited Compendium file (subclass
   aliases to the Salient option the Compendium subclass names); a synthetic Tactician with Shining
   Armor and Mountain reports exactly the stamina, stability and melee damage arsenal choices; the
   Beastheart heroes report the companion melee bonus; a clamped Recoveries seed is reported.
6. App: an oversized preview is refused with no parse; an over-maximum Recoveries import stores 0
   with a diagnostic.

## Work log

- 2026-09-24: started by WIZARD3 on `slice/V182` (`.worktrees/forge-import-b`), stacked on
  `slice/V09` `bd6fff72`. Forge read only at the main checkout's pin
  `5a846aadb623a9855a023e9403bb887a956c341f`, through Git objects.
- Forge runner executed here (a build step producing the fixtures, not a test run):
  `SALIENT_FORGE_OUTPUT=/tmp/v182/forge-out SALIENT_FORGE_FAMILY=import node scripts/forge/build.mjs`
  and `SALIENT_FORGE_FIXTURE_DIR=tests/fixtures/v182-forge node /tmp/v182/forge-out/forge-run.mjs`:
  22 heroes; class/kit choices imported 11/11 and 12/12 (Shadow), 11/11 and 12/12 (Fury), 12/12 and
  13/13 (Tactician), 11/14 and 12/15 (Censor), 13/13 and 14/14 (Troubadour), 12/12 and 13/13 (Null),
  11/17 and 12/18 (Conduit), 12/12 and 13/13 (Elementalist, Talent), 12/13 and 13/14 (Beastheart),
  12/12 and 14/14 (Summoner). Some pinned Forge entries carry random ids generated at load, so a
  rerun changes those files' digests; the manifest records the committed ones.
- 2026-09-25: committed on `slice/V182` (`c1b74b31` docs, `9293f7ca` mappings/tooling/fixtures,
  `2bc98bc3` API and CLI, `04410e6c` UI). Authoring checks at `04410e6c`: `npx tsc --noEmit` exit 0,
  `npx tsc -p tsconfig.web.json --noEmit` exit 0, `pnpm -s lint` exit 0 ("All matched files use
  Prettier code style!"), `vitest run tests/forge-import-levels.test.ts tests/forge-import.test.ts
  tests/app/forge-import-levels.test.ts tests/app/forge-import.test.ts` 49/49. Convex push of
  `git archive 04410e6c` to an anonymous local deployment: "Convex functions ready"; the codegen
  differs from the committed `_generated/api.d.ts` only by five `lib/*` entries also missing on
  main, none from this slice. The browser spec is authored only; TESTER has run nothing.
- 2026-09-25: review fixes. Rebased onto origin/main `2778db59` (V09 part a merged as cherry-picks;
  STATUS rows from both sides kept). Fixes in `a66e35eb`: build.mjs bundles into a removed mkdtemp
  directory; alias test against the cited Compendium names; diagnostics for Forge-absent Beastheart
  and Field Arsenal choices (synthetic Shining Armor + Mountain Tactician); clamped-Recoveries
  diagnostic; payload SHA-256 command key; `--diagnostics` CLI; `liveSeed` no longer optional;
  oversized-preview test. Checks: both `tsc` configs exit 0, `pnpm -s lint` exit 0, focused vitest
  (4 files) 51/51, Convex push of `git archive 6199c40b` in a removed mkdtemp copy: "Convex
  functions ready!". A one-step `import` runner run into a removed temp output reproduced the
  table above and left no `salient-forge-*` directory.
- Independent re-review PASS (2026-09-25). Deploy note: liveSeed is required, so characterImports rows written by the merged V09a (e.g. forge-import journey rows on cloud dev) must be cleared before the schema push.
