# V107 — Summoner level one

## Goal

Complete the last level-one class in the editor, including circles, formations, commands, portfolios and sourced manual actions.

## Scope

[Character scope](../character-wizard-spec.md#1-product-outcome-and-scope),
[participation boundary](../table-spec.md#2-participation-and-presence), and
[reference source contract](../reference-library-spec.md#confirmed-release-scope).
Pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` only. No vendor changes.

Four characteristic arrays, four circles, four formations, four quick commands, six 5-Essence abilities;
25 minion options (13 signature, 12 cost-three). No ordinary kit at level one. Pixie Dust gives two
Recoveries; Elite changes each minion's Stamina/stability, Horde changes summon limits; hero modifiers
never leak from minion statistics. Summoner Strike replaces ordinary free strikes in sheet and API.

Labelled interpretation: `class/summoner.md#Summoner Advancement` lists `1, 1, 3, 3`, while
`feature/summoner/level-1/portfolio.md` maps each circle to its family. Read as two distinct known
signature species and two distinct known three-Essence species within that portfolio. Alternative:
repeated selection could denote duplicate species; that grants no additional known option and is not
explicitly stated. Record in the rules questions file; no other source silently fills the gap.

All summoned-creature combat, shared turns, squads, automatic resource income, sacrifice discounts,
recovery spending, outside-combat reuse, summons/transformations and timing stay explicit/manual under
the existing table scope. Every action records source effects through `commands:invoke`; fixed Essence
costs debit the hero pool, waived outside combat. These are manual records, not summoned actors or
claims of automated combat. Portfolio statistics and full sources remain readable. Higher-level
linked reference articles do not enable higher-level builds.

## Acceptance checks

Independent Compendium ledger covers every circle, formation, command, heroic choice and all 25
portfolio entries. Public create/admit/read journeys compare persisted builds. Every distinct manual
record gets invoked, event readback, cost/debit/empty-pool refusal and unchanged affected state.
Circle edits prune obsolete portfolio, unauthorised edits refuse, level two remains unsupported.
TESTER owns generators, full check and isolated cohort. ENGINE independently reviews source and proof.

## Work log

- Started from main `a0792cd`. Source audit and independent review completed; acceptance below.

- Authoring `38cb8e9`: both TypeScript projects and touched ESLint passed. TESTER generated
  content/audit/support/reference outputs (exit 0 each): 1,629 content entries, 2,840 readable
  references (2,614 core + 122 Beastheart + 104 Summoner), support 23/1,483/0. Artifacts:
  `/srv/presidium/projects/salient/test-artifacts/V107-38cb8e9-generation`.
- ENGINE found paid Catalyst wording and missing Horde provenance; repaired both. Three-Essence
  Call Forth correctly pays for two minions. Exact core 438 statblocks/1,158 embedded abilities
  remain checked separately from 25 supplemental minions. V88 preserves all prior rows/hashes,
  explicitly adding only the 14 source hero envelopes. Generator gives statblock imports consistent
  JSON attributes in shared and backend modules; existing regression now covers both kit/statblock.
- Twelve independent source witnesses cover all 25 minions, four arrays/circles/formations/commands
  and six heroic choices. All 144 distinct records carry source-derived expected costs. Focused
  two-test authoring run passed. Initial fixture mistakenly retained Alertness from another witness:
  Soldier grants only the two chosen skills, and Creative gives Tailoring, so source review removed
  the unsupported extra skill before acceptance. See `tests/fixtures/v107-summoner-expected.json`.
- Summoner statblocks are readable editor references, excluded from both `foes:definitions` and
  the shared foe/squad loading guard. Live proof checks refusal. These minions do not use the ordinary
  foe squad rules. Headless also checks ordinary free strikes cannot be invoked by the Summoner.
- Forge pin `5a846aadb623a9855a023e9403bb887a956c341f` has `src/data/classes/summoner/`
  (`class-summoner`, four circle modules, feature bonuses, resource/portfolio followers). Inspected
  for model mapping only; `scripts/forge/project.ts` currently supports Fury/Elementalist/Shadow/
  Tactician. No executed Summoner parity or import/export claim. Compendium remains sole rules source.
- Browser scenario backlog: four circles and both portfolio pickers; formation-derived minion
  statistics; free-strike substitution; readable manual actions. No browser run under moratorium.

### TESTER job

Frozen candidate only; default local isolated target. Run `CI=true pnpm check`, then the standard
isolated setup/seed with `SALIENT_HEADLESS_COHORT=summoner node scripts/verify-character-headless.ts`.
Expected one scenario: twelve saved/admitted builds and 144 manual action records with persisted
readback, actual payments, blocked repeat with empty resource, outside-combat waiver, circle edit
pruning/admission isolation, owner refusal, no ordinary free strikes or generic minion loading.
Keep existing 15s request/240s run/295s hard stop. Backend must be stopped when finished. No shared
cloud action or browser needed. Logs under test-artifacts/V107-<commit>. Reuse unchanged passed stages
if a concrete repair is needed. Generator outputs are committed; freshness gates perform comparison.


### Accepted result and frozen handoff

- ENGINE static **PASS** on `405dd4d081aeda80c1e4443c3f1e49730aa4ebb7`;
  [written review](audits/V107-summoner-rules-review.md). All findings closed. The review did not run tests.
- TESTER message 1619: `CI=true pnpm check` **exit 0, 217.4s**; **1,002 tests (399 engine + 603
  app/scripts)**, all content/reference/type/lint/link/vendor/support/build gates passed.
- Isolated local Summoner cohort **exit 0, 178.5s**, one scenario passed: twelve saved/admitted
  builds and **144 distinct manual action records**. Readback covers all 25 portfolio options,
  costs/debit/blocked empty-resource, waiver, ownership, edit pruning/admission isolation,
  free-strike replacement and generic Summoner foe-loading refusal. This proves records/payments,
  not automated minion combat. Full/live inputs are the same tested commit above.
- Artifacts: `/srv/presidium/projects/salient/test-artifacts/V107-405dd4d` (`full.log`, `full.json`,
  `headless.log`, setup/backend/seed evidence). TESTER stopped backend; ports free, data retained,
  clean checkout released. No browser, hosted test, reset of shared data or deployment smoke.
- Frozen owner handoff: `slice/V107`, `.worktrees/class-summoner`; documentation closeout adds
  only this acceptance, STATUS and the authentic review. DEPLOY2 integrates/publishes to the
  standing-authorized cloud dev target and pushes main, reusing these accepted checks.
  Required release builds/publication are sufficient; no rerun or smoke. No schema/dependency
  or environment configuration change. Runtime content is 1,629 entries.
