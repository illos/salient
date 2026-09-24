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
  Portfolio Minion. The advancement row `1, 1, 3, 3, 5` adds one 5-essence minion from the circle's
  portfolio (the V107 reading of the row, extended by one entry).
- Summoner's Dominion fixture. Labelled interpretation: the feature summons "a fixture from your
  minions' native manifold or origin"; the Compendium files one fixture per portfolio family under
  `monster/fixture/<family>/featureblock/`, and `feature/summoner/level-1/portfolio.md` maps each
  circle to its family: Blight → The Boil, Graves → Barrow Gates, Spring → Glade Pond, Storms →
  Primordial Crystal. Alternative considered: any fixture may be chosen; the text ties it to your
  minions' origin, so it is not offered. Fixture Stamina is 20 + your level; its 5th- and 9th-level
  advancement features stay excluded.
- `feature/summoner/level-3/`: Summoner's Kit (Summoner Strike damage 2 × Reason, potency R < AVERAGE,
  distance your Summoner's Range) and one ward: Conjured Ward (+3 Stamina, derived, with recovery and
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
