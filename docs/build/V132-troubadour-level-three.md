# V132: Troubadour levels two and three

Rules review: required. Depends on: V102, V116.

## Goal

Build and edit a Troubadour of every class act at target level two or three through the full wizard
and shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/troubadour.md`, Basics and Troubadour Advancement Table: +6 Stamina at
  levels 2 and 3 (shared class-profile growth); first echelon, 8 Recoveries, unchanged characteristics
  and potency.
- `feature/troubadour/level-2/`: Appeal to the Muses (automatic); Invocation, a choice of Allow Me to
  Introduce Tonight's Players, Formal Introductions or My Reputation Precedes Me; one interpersonal,
  lore or supernatural perk; the class act ability pair from `en/books/heroes/clean/Draw Steel
  Heroes.md`, 2nd-Level Auteur/Duelist/Virtuoso Ability: Guest Star / Twist at the End; Classic
  Chandelier Stunt / En Garde!; Encore / Tough Crowd.
- `feature/troubadour/level-3/3rd-level-class-act-feature.md`: Auteur Missed Cue, Duelist Foil
  (unlinked table row; `foil.md`), Virtuoso Second Album, which grants the performances "Fire Up the
  Night" and "Never-Ending Hero" (book, Second Album). `7-drama-ability.md`: Extensive Rewrites,
  Infernal Gavotte, Star Solo, We Meet at Last.
- Embedded uses, each a manual record citing its clause: Appeal to the Muses, each invocation's use,
  Missed Cue, Foil, En Garde!'s free-strike exchange, Classic Chandelier Stunt's free strike, "Fire Up
  the Night"'s free search, Tough Crowd's end-of-turn roll, Star Solo's free
  repeat and We Meet at Last's message.
- Table routes: En Garde! (7/11/16 + A, melee weapon kit bonus), Star Solo (5/8/11 + P, melee or
  ranged mode per V115), Infernal Gavotte (area, 5/7/10 fire, melee weapon kit bonus) and Extensive
  Rewrites (area, slides only) roll with conditions, pushes and slides manual. Tough Crowd's roll
  happens at the end of each of your turns, so it is recorded without a roll (manualRoll list, as
  Thunder Mother) and its roll is the embedded end-of-turn use. The others and the two performances
  have no power roll and are recorded with Drama payment where printed.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v132-troubadour-three-expected.json` extends the four
   V102 witnesses plus two alternates so every invocation, class act feature and level-2/3 ability is
   chosen. Focused engine test checks vitals, features, perk pool, costs, embedded uses,
   foreign-pool rejection and level/class-act pruning.
2. Authenticated `troubadour-level-three` headless cohort: six level-3 builds, draft resume and
   save, owner-only level transition, lower to 2 and back, and every new ability, performance and
   embedded use with Drama payment, blocked second paid use and persisted readback.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `635113a` on `slice/V132`, `.worktrees/troubadour-three`, with empty `vendor/*`.
  ENGINE2 informed. V117 Censor edits the same support/registration lines; rebase after it merges.
- Renumbered from V121 to V132 after ENGINE2 reserved V120 and V140–V150; the V121 branch was never pushed.
- Ledger written by an isolated subagent from the canonical Compendium only: Stamina +6 per level,
  no other numeric change; En Garde! 10/14/19 (Cloak and Dagger), Star Solo melee 8/11/14 and
  7/10/17 (Panther), Infernal Gavotte 6/8/11 and 5/7/10. Its labelled interpretations (kit melee
  bonus on the area Infernal Gavotte; Tough Crowd rolls at the end of your turns) match the routes here.
- Author checks: both TypeScript projects and ESLint pass; focused V132, V102 and sibling class
  engine files pass; V88 audit guard and live compiled report 34/34. Content 1711 entries;
  `compiled:check`, `content:check`, `supporting:check`, links pass.
- Independent rules/implementation review (subagent, source-only) of `a310238`: CHANGES REQUIRED, one
  blocking finding: the cohort never used the two Second Album performances. Fixed: they are now used
  (recorded, no cost), and the count is 24 (ten abilities, two performances, twelve embedded uses).
  Non-blocking findings closed: the performances carry the Routines selection rule; new manual uses
  for Classic Chandelier Stunt's free strike and "Fire Up the Night"'s free search; Appeal to the Muses,
  Tough Crowd (optional roll, pull 1/2/3), Formal Introductions and My Reputation Precedes Me wording
  follow the source; ledger path corrected; unused cost map removed.
- Follow-up (engine, not in this slice): Star Solo's free repeat for two rounds is a full use with its
  roll at no Drama. It is recorded as manual here; a cost-waived `ability.use` against the same target
  would automate it.
