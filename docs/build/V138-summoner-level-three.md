# V138: Summoner levels two and three

Rules review: required. Depends on: V107.

## Goal

Build and edit a Summoner of every circle at target level two or three through the full wizard and
shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/summoner.md`, Basics and Summoner Advancement: +6 Stamina at levels 2
  and 3 (shared class-profile growth), 8 Recoveries, first echelon, unchanged characteristics.
- `feature/summoner/level-2/`: one intrigue, lore or supernatural perk; Summoner's Dominion; New
  Portfolio Minion. Labelled interpretation (Q-SUMMONER-2): the advancement row `1, 1, 3, 3, 5` adds one
  5-essence minion from the circle's portfolio, extending V107's reading; alternatives are all three or a
  Director-set number.
- Summoner's Dominion fixture. Labelled interpretation: the feature summons "a fixture from your
  minions' native manifold or origin"; the Compendium files one fixture per portfolio family under
  `monster/fixture/<family>/featureblock/`, and `feature/summoner/level-1/portfolio.md` maps each
  circle to its family: Blight → The Boil, Graves → Barrow Gates, Spring → Glade Pond, Storms →
  Primordial Crystal. Alternative considered: any fixture may be chosen; the text ties it to your
  minions' origin, so it is not offered. Fixture Stamina is the printed 20 + your level; labelled
  interpretation (Q-SUMMONER-2): Elite Formation's minion bonus is not applied and the fixture does not
  count as a minion (alternative: it is a minion, 25/26 with Elite). Its 5th- and 9th-level advancement
  features stay excluded.
- `feature/summoner/level-3/`: Summoner's Kit (Summoner Strike damage 2 × Reason, potency R < AVERAGE,
  distance your Summoner's Range; labelled interpretation (Q-SUMMONER-2): the literal distance replaces
  "Melee 1 or Ranged 5", the alternative keeps Melee 1) and one ward: Conjured Ward (+3 Stamina, derived, with recovery and
  winded values), Emergency Ward, Howling Ward, Snare Ward. `feature/ability/summoner/level-3/`: Blitz
  Tactics, Cavalry Call, Essence Funnel, Lead By Example, each 7 essence.
- Everything a Summoner does stays a V107 manual record through `commands:invoke`: the Dominion
  summon (once per encounter) and its 1-essence relocation, each fixture trait, the twelve 5-essence
  minions' Call Forth (5 essence for three), free strikes and traits (with their printed trait
  costs), the Summoner's Kit strike note, the triggered wards and the four 7-essence abilities.
  Summoned creatures, fixtures, squads, auras, damage and movement are not applied.
- Content: Q-CHAR-14 supplemental admission widens to Summoner level 2–3 features and abilities, the
  5-essence minion stat blocks and the four fixture featureblocks.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v138-summoner-three-expected.json` extends the twelve
   V107 witnesses so every circle's 5-essence minion, every ward and every 7-essence ability is
   chosen. Focused engine test checks vitals, the fixture and kit summary, portfolio, features,
   records and costs, foreign-pool rejection and circle/level pruning.
2. Authenticated `summoner-level-three` headless cohort: level-3 builds, draft resume and save,
   level edits, and every new record once with essence payment, blocked second paid use and
   unchanged actor and target state.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `fad564f` on `slice/V138`, `.worktrees/summoner-three`, with empty `vendor/*`.
  ENGINE2 informed. Content 1751 → 1780 entries (+9 features, +4 abilities, +12 minions, +4 fixtures).
  The four 7-essence abilities join the V88 allowance; none reaches the compiled route.
- Ledger written by an isolated subagent from the canonical Compendium only: 12 witnesses, 71 printed
  actions, 19 recorded uncertainties (fixture link, one 5-essence minion, Conjured Ward on the maximum,
  kit strike distance and potency, whether the fixture is a minion). The implementer renamed its "Lead
  by Example" to the printed "Lead By Example" (recorded in the ledger's `corrections`).
- The ledger caught that the record replacement dropped the level-2 perk's own action (Forgettable
  Face, Creature Sense); perk grants now stay. The same fix landed in V137.
- Author checks: both TypeScript projects and ESLint pass; focused V138 (3) and V107 engine tests,
  V88 audit guard and live compiled report pass; content, supporting, foes, compiled and link checks
  pass. An evaluator dry run of every cohort record over all twelve builds is clean.
- Follow-up action audit (QC1 V135 R1, source-only): no separate Summoner level 2–3 action is missing.
  Essence Funnel's minion sacrifice gets its own "Part of parent ability" rider record, matching the
  level-1 Focus Fire! rider.
- Rebased onto main `98f1c3a` (Beastheart levels 2–3 merged). Reference-coverage pins follow
  `pnpm rules:ingest` there: 2614 core and 277 supplemental (149 Beastheart, 128 Summoner), 2891 in
  total; `build:web` rc0. Both TypeScript projects, ESLint, focused V138/V107/V32 engine tests (14),
  build-content, audit, report and rules script tests (66), and content, compiled, supporting, foes
  and link checks pass.
- Independent rules/implementation review (subagent, source-only) of `d276576`: CHANGES REQUIRED, three
  labelling findings, all fixed: fixture Stamina ignoring Elite and the kit's strike distance are now
  labelled interpretations in scope, code and contract, and Q-SUMMONER-2 records them with the fixture
  link, the one-minion reading and Leader Formation vs the class kit. Non-blocking, fixed: the test
  checks every printed action's type and trigger against the ledger and refuses out-of-pool perk, ward
  and 7-essence values; the perk filter matches its one decision; the strike reuses the range value.
