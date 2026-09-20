# V92 implementation review: Shadow level one

Reviewer: fresh-context implementation reviewer (Fable), 2026-09-20.
Scope: commits `4032f4d` (shared evaluator: `Decision.dependsOnAny`, `effectiveParent`, kit-required
profile vitals, insight resource union) and `76e7e37` (Shadow content module, registration, wizard
labels, content ingest) on `slice/V92`, worktree `.worktrees/class-shadow`. Branch tip at review
time: `9f287bb` (a one-line follow-up to `76e7e37`, see note 1). Tests being written concurrently
(`tests/character-v92-shadow.test.ts`, `tests/app/shadow-character.test.ts`, `scripts/headless/*`)
and the WIZARD.2 witness commit `9c35cd4` were not reviewed.

## Verdict

`pass` — on the branch tip `9f287bb`. No blocking findings. Note 1 must be honoured when the range is
integrated: `76e7e37` on its own does not typecheck.

## Blocking findings

None.

## Non-blocking notes

1. `76e7e37` is not self-consistent: `shared/content/classes/shadow/level-one.ts` lines 80 and 109
   called `grant()` with two arguments (the builder requires a source), so
   `tsc -p tsconfig.json --noEmit` fails at that commit (`TS2554` x2). The follow-up `9f287bb`
   ("cite the class source on the characteristic and potency grants") fixes both calls and the tip
   typechecks clean. The merged range must include `9f287bb`; do not cherry-pick `76e7e37` alone.
2. `shared/content/level-one-decisions.ts:85-97`: the `kit.choice` Shadow entry has no note recording
   the stormwight exclusion. The slice document labels it an interpretation carried from Q-R-103; a
   one-line `note` on the entry (as the college option carries for the shortened names) would keep
   the interpretation visible next to the data. Not a rules error: `pool.kits.standard` is the
   correct pool and `feature/shadow/level-1/kit.md` says only "a kit".
3. `shared/evaluate/character.ts:1565-1580`: the Shadow's `Kit` class-feature grant is projected by the
   generic loop without `affects: ['kit']`, while the Fury's aspect-granted `Kit` feature carries it
   (line 1561). I found no consumer of `affects` in `web/` or `convex/`, so this is cosmetic
   contract drift, not a behaviour difference.
4. `shared/evaluate/structure.ts:240`: `basePoolOf` now builds `indexDecisions(definitions)` on every
   call, and `effectiveParent` recurses through `isAvailable` for each alternative parent.
   `pruneUnavailable` calls `poolOf` for every selected decision per pass, so this is a small
   constant-factor cost in the wizard's prune loop. Passing the index through would remove it; no
   change required for V92.
5. Kit Stamina provenance note text differs between the Fury path (`applyFuryVitals`: "1st echelon at
   level 1 (rule/general/echelon.md); rule: chapter/kits.md, Stamina Bonus") and the profile path
   (`profile.ts:92-95` reuses `kit.staminaBonusApplied` provenance: "3 at the 1st echelon"). Both cite
   the kit entry's "Stamina Bonus: +N per echelon" line with `operation: 'add'`; shape and values
   match. Cosmetic.
6. The missing-kit diagnostic for a Shadow reads "Required choice missing: You can use and gain the
   benefits of a kit." with source `feature/shadow/level-1/kit.md`. The message text comes from
   `kit.choice`'s own (Fury) quote, but the sentence is identical in the Shadow file, so the cited
   source is verbatim. The Berserker/Reaver special wording is unchanged.

## What was checked

### 1. `dependsOnAny` regression risk (Fury, Elementalist, kit contributions)

Traced `parentSatisfied`, `effectiveParent`, `isAvailable`, `basePoolOf`, `pruneUnavailable`
(`shared/evaluate/structure.ts`), `Evaluation.pool`/`missing`/`validate` (`shared/evaluate/character.ts`
lines 221-236, 258-330, 383-398), `belongsToOtherBranch` (`web/wizard/index.tsx:158-190`) and
`web/wizard/presentation.ts`.

- Fury: `class.fury.aspect` is listed first in `dependsOnAny`; with `class.choice = Fury` and no aspect
  the aspect parent is unsatisfied and `class.choice` has no `optionsByParent.Fury` entry, so the kit
  step stays unavailable. With an aspect the aspect is the effective parent: Berserker pool 21
  standard kits, Stormwight pool `[Boren, Corven, Raden, Vuken]`. The Berserker/Reaver missing-kit
  wording and the Mountain Stamina provenance (21 base + 9 add = 30) are unchanged (evaluated live).
- Elementalist: `effectiveParent` returns `undefined` (no entry for `Elementalist`), `isAvailable`
  false, pool empty, `pruneUnavailable` drops a stale `kit.choice`, `partial.kit === null`, Stamina 18,
  no `kit.choice` diagnostic; the wizard hides the kit step because every alternative parent is
  either in another branch (aspect) or chosen with a value that has no entry (class).
- `kit.<name>.contributions` decisions use `availableWhen: kit.choice = <name>` and never read
  `dependsOn`; `Evaluation.kit()` still finds them through `this.available`. Confirmed for a Shadow
  with Cloak and Dagger (contributions applied: speed 7, stability 0, disengage 2, Fade signature).
- Other `dependsOn` consumers (repo grep excluding vendor/node_modules): `character.ts:573`,
  `assignment.ts:36` and `structure.ts:445` read `dependsOn[0]` only for assignment decisions (array
  parent), which never use `dependsOnAny`; `tests/fury-decisions.test.ts` mirrors the R01 table and
  passes; `scripts/audit-ability-grammar.ts` does not walk `dependsOn`. No further consumer needs the
  OR semantics.

### 2. `profile.ts`

- `applyClassProfile` is guarded by `!ctx.available.has('class.fury.baseline')`, so Fury Stamina is
  derived once by `applyFuryVitals` and never re-derived; Elementalist (`kit: 'none'`) keeps
  `kit = null` and base Stamina exactly as before (only the `startingStamina` entry was hoisted).
- Ordering: `derive()` sets `out.kit` (line 775) and runs `applyFuryVitals` (778) before
  `deriveProfiles` → `applyClassProfile` (853/1214), so `out.kit.staminaBonusApplied` is present for
  kit-required classes; recovery value and winded follow from `out.staminaMaximum` (lines 104-117).
  Live check: Shadow + Cloak and Dagger → Stamina 21 (18 base + 3 add), recovery 7, winded 10.
- Without a kit `out.staminaMaximum` stays absent, status `incomplete`, and the `kit.choice`
  diagnostic cites `feature/shadow/level-1/kit.md`.
- Ancestry baselines run after with `noKit = false` and read `out.kit` for speed/stability
  (`ancestries/human.ts:20-28`), the same path a Fury takes.

### 3. Content accuracy

Every quote in `shared/content/classes/shadow/level-one.ts` and the `kit.choice` Shadow entry was
checked against the pinned files under `vendor/steel-compendium/en/unified/md/` after link stripping
(script over 25 quotes). All are verbatim; four (`Starting Stamina at 1st Level: 18`, `Recoveries: 8`,
`Weak Potency: Agility − 2`, `Strong Potency: Agility`) sit inside bold markers in the source, which
the repository's R02 verbatim check (`tests/character-derived-values.test.ts` `normalize`) strips,
consistent with the existing Elementalist and Fury quotes of the same lines.

- Ability options: all twelve slugs resolve to existing files; college slugs
  (`black-ash-teleport`, `in-all-this-confusion`, `coat-the-blade`, `defensive-roll`, `im-no-threat`,
  `clever-trick`) and `hesitation-is-weakness` exist.
- Partition from frontmatter: signature = no `cost`, no `subclass` (Gasping in Pain, I Work Better
  Alone, Teamwork Has Its Place, You Were Watching the Wrong One); `cost: 3 Insight` (Disorienting
  Strike, Eviscerate, Get In Get Out, Two Throats at Once); `cost: 5 Insight` (Coup de Grace, One
  Hundred Throats, Setup, Shadowstrike); `cost: 1 Insight` without subclass = Hesitation Is Weakness.
  College grants match the 1st-Level College Features and College Triggered Actions tables and the
  three "You have the X skill." sentences (Magic, Alchemy, Lie).
- Basics: Agility 2, four arrays, Stamina 18, Recoveries 8, potency Agility, Hide and Sneak plus five
  from Criminal Underworld or exploration/interpersonal/intrigue — all match `class/shadow.md`.
  A lore skill other than Criminal Underworld (Magic) is rejected `value-not-in-pool`; Hide chosen again
  is rejected `duplicate-skill` (evaluated live).
- No invented rule. The shortened college values and the standard-kit pool are labelled/recorded.

### 4. Trait-granted ability gate

Live evaluation of a Black Ash and a Caustic Alchemy Shadow lists: Hesitation Is Weakness `[class]`,
the college maneuver `[class]` (Black Ash Teleport / Coat the Blade; I'm No Threat by the same
grant), the college triggered action `[aspect-triggered]` (In All This Confusion / Defensive Roll /
Clever Trick), signature `[signature]`, 3-Insight `[heroic 3 insight]`, 5-Insight
`[heroic 5 insight]` (`parseCost` accepts `insight`), kit signature and both free strikes. Smoke Bomb
appears as a readable `class-feature` with source `feature/shadow/level-1/smoke-bomb.md`. Every
granted `sourcePath` is `en/unified/md/feature/ability/shadow/level-1/<slug>.md`, and
`convex/lib/resolve.ts:617-618` resolves sheet abilities by
`vendor/steel-compendium/${grant.sourcePath}` against the manifest; all nineteen Shadow abilities and
Smoke Bomb are present in `shared/content/compendium/ability.json` / `feature.json` (one entry each).

### 5. Content ingest

`scripts/build-content.ts` adds selection `shadow-level-one` over `class/shadow.md`,
`feature/shadow/level-1`, `feature/ability/shadow/level-1` (1 + 11 + 19 = 31 entries; manifest
1151 → 1182). `git diff --numstat a834119..76e7e37 -- shared/content/compendium`: ability.json
+658/−0, class.json +24/−0, feature.json +147/−0, manifest.json +260/−2 (the two removed lines are
the content hash and entry count). No unrelated entry changed. Spot check: the Coup de Grace entry's
text and structured `cost: 5 Insight` match the source file byte for byte.

## Commands run

All from `/srv/presidium/projects/salient/code/.worktrees/class-shadow` at tip `9f287bb`.

| Command | Result |
| --- | --- |
| `env -u CONVEX_DEPLOY_KEY node --preserve-symlinks --preserve-symlinks-main scripts/build-content.ts --check` | pass: "matches the clean pinned Compendium (1182 entries, 126 excluded, revision fb83a789da8f)", exit 0, tree unchanged |
| `node_modules/.bin/tsc -p tsconfig.json --noEmit` | first run at `9c35cd4`: fail (TS2554 x2 in `shared/content/classes/shadow/level-one.ts:80,109`); re-run at `9f287bb`: pass, exit 0 |
| `node_modules/.bin/tsc -p tsconfig.web.json --noEmit` | same: fail at `9c35cd4`, pass at `9f287bb` |
| `node_modules/.bin/eslint` on the 13 changed source/test files of both commits | pass, exit 0 |
| `env -u CONVEX_DEPLOY_KEY node_modules/.bin/vitest run --project engine tests/character-v92-kit-parent.test.ts tests/character-evaluator.test.ts tests/fury-decisions.test.ts tests/character-v25-evaluator.test.ts tests/character-v45-foundation.test.ts` | 5 files, 29 tests passed, 0 failed |
| `env -u CONVEX_DEPLOY_KEY node_modules/.bin/vitest run --project app tests/app/elementalist-character.test.ts tests/app/character-wizard-route.test.ts` | 2 files, 9 tests passed, 0 failed |
| Ad-hoc quote verification script (25 quotes, link-stripped) | 21 verbatim, 4 verbatim after bold-marker strip, 0 missing |
| Ad-hoc evaluator probes (Shadow with/without kit, Fury Berserker with/without kit, Stormwight pool, Elementalist) via `evaluateCharacter`/`isAvailable`/`poolOf` | values reported in sections 1, 2 and 4 |

No pnpm scripts were run. No source file was edited.
