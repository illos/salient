# V178: Damage immunity and weakness for foes and heroes

Rules review: required. Depends on: V177 (stacked on `slice/V177` `05021058`), V170, V171, V174,
V175.

## Goal

Apply printed and evaluated damage immunity and weakness through the existing damage arithmetic
for every damage source. Before this slice, a foe's stat-block Immunity or Weakness cell other than
"-" left all engine damage to that foe manual, and a hero's evaluated weaknesses never reached
damage (V177 finding, Q-DT-1 items 4 and 5). A cell the app can't read exactly keeps the damage
manual, and the diagnostic names the cell.

## Scope

- `shared/resolve/damageModifiers.ts` (new, pure):
  - `parseModifierCell` and `statBlockModifiers` read a printed cell. "-" and "—" print none. A
    comma-separated list of "<type> <value>" is read, where the type is one of the nine in
    `rule/damage/damage-type.md` or "Damage" (`all-damage`, `damage-immunity.md`: "representing
    immunity to all damage"), and the value is a whole number or, for immunity only, "all". Any
    other item leaves the cell unread, with its reason.
  - `heroModifierEntries` maps evaluated immunities and weaknesses; the complication `allDamage`
    becomes `all-damage`.
  - `extraDamageAfterModifiers` adds damage to a hit already applied, using its saved weakness
    and immunity.
- `convex/lib/resolve.ts` `damageTargetFacts`: foes (and squad members, for the pool) get their
  parsed cells. Heroes get `weaknesses` next to `immunities`. So ability damage, free strikes,
  squad free strikes, watchers (V171), triggered damage (V173), Strained incur and self-damage
  (V170), the clarity and angered-gods clock damage, and corrections all go through
  `applyDamage` with them. Corrections keep reusing the saved `targetFacts`, and V174 revisions
  the saved `weaknessApplied`/`immunityApplied`.
- `shared/resolve/index.ts` `applyDamage`: no damage takes no weakness (Q-RES-4). The V174
  halving already reads it this way.
- `convex/lib/markOperations.ts`, `convex/lib/damageRevisions.ts` (`currentHitApplication`),
  `shared/resolve/marks.ts`: the Mark's extra damage joins the hit. It is sized against the
  weakness and immunity the hit's current accepted revision saved, instead of being left to the
  table. V174 already refuses any revision after an accepted extra-damage benefit.
- `docs/roll-and-damage-resolution.md` section 6.2: the parsing contract.

Out of scope, kept manual (Q-IW-1 point 4): summoner minions' "R" values, the trolls' valueless
fire weakness, and the Orc Eye of Grole's choice of types. Effects that grant a weakness during
play (Corruption's Curse, Setup) stay manual, as in V177.

Compendium (pinned `en/unified/md`): `rule/damage/damage-immunity.md`,
`rule/damage/damage-weakness.md`, `rule/damage/damage-type.md`,
`feature/summoner/level-1/minions.md`, `feature/trait/revenant/tough-but-withered.md`,
`complication/rogue-talent.md`, `feature/ability/talent/level-1/mind-spike.md`,
`feature/ability/tactician/level-1/mark.md`, and the stat blocks named below.

Spec references:

- `docs/roll-and-damage-resolution.md#62-immunity-and-weakness`

## Acceptance checks

1. `tests/scripts/immunity-weakness.test.ts` (pure):
   - Every distinct Immunity and Weakness cell printed by the 475 ingested stat blocks
     (`shared/content/compendium/statblock.json`) is enumerated and read as its text says. The set
     must match exactly, so a new printed form fails the test. The forms are: "-", "—", one or more
     "Type N" items, "Damage N", "Type R", a type with no value ("Acid 5, fire "), and a choice
     ("Cold, fire, or lightning").
   - The Mummy's real stat block reads "Corruption 4, poison 4" and "Fire 5".
   - The rule pages' own examples:
     - fire immunity 5 against 8 fire leaves 3;
     - damage immunity 5 with fire immunity 10 against 12 fire leaves 2;
     - fire weakness 5 on 10 fire gives 15;
     - halved to 4 before immunity 5 gives 0.
   - The order is weakness then immunity. Typed entries ignore untyped damage, "Damage 3" applies
     to both, and 0 damage takes no weakness.
   - Hero `allDamage` becomes `all-damage`.
   - The Mark's extra damage is sized from the saved hit.
2. `tests/app/immunity-weakness.test.ts` (convex-test, `transactionLimits: true`), each with persisted
   readback:
   - Mummy: Hurl Element poison at tier 2 takes 7 − 4, and fire takes 8 + 5. A goblin's untyped
     free strike 1 takes 1. A correction to tier 3 poison takes 9 − 4 from the saved facts.
   - Decrepit Skeleton squad of four: the pool goes from 12 to 12 − (7 − 1).
   - Level 1 Revenant: Hurl Element fire takes 8 + 5.
   - Talent with Rogue Talent, strained Mind Spike: the Talent takes 2 + 5 psychic, with immunity
     skipped and weakness applied, saved as `selfApplication`.
3. `tests/app/marks.test.ts`, V178 case: Hill Giant Clobberer ("Damage 3"). Brutal Slam 8 takes 5.
   The extra 4 then takes 4 more, not 1, and the log states the saved weakness and immunity.
4. `tests/app/abilities.test.ts`: the manual-immunity case now injects an unreadable printed form
   ("Cold, fire, or lightning"), and the diagnostic names it.
5. Journeys, for TESTER: no journey damages a foe with a printed cell or a hero with a weakness
   (checked below), so none changed. TESTER: `CI=true pnpm check`.
6. An independent rules and implementation review.

## Work log

- 2026-09-25: worked on `slice/V178` in `.worktrees/immunity-weakness`, stacked on `slice/V177`
  `05021058`.
- Printed forms (ingested stat blocks):
  - 63 distinct cells (Immunity and Weakness counted apart).
  - Read: every "Type N" list and "Damage N".
  - Manual: "R" values (all on summoner minions, which `foes:add` refuses), the seven trolls'
    "Acid N, fire", and the Orc Eye of Grole's "Cold, fire, or lightning".
  - No printed "all".
  - Ajax the Invincible and the Noncombatant print no cells ("cell not found", unchanged).
- Interactions checked:
  - **Watchers (V171):** they use `damageTargetFacts`. A watcher's typed damage to a foe with cells
    now applies instead of being manual.
  - **Triggered offers:** these are sized from the damage taken after immunity and weakness
    (Q-TRIG-1). The application carries both.
  - **Reactions (V174):** `halveApplication` keeps the saved values, as does `currentHitApplication`
    for Marks.
  - **Strained (V170):** self-damage skips immunities and keeps weaknesses (Q-STRAIN-1).
  - **Corrections:** these reuse the saved `targetFacts`, taking only the current pools.
  - **Squads:** the members' cells reduce each application before the pool takes `staminaDelta`.
    Triggered damage to a squad member stays manual, as before.
- Journeys and tests grepped:
  - Every foe name with a cell against `scripts/headless` and `tests/`.
  - Every foe `definitionId` in `scripts/headless` and its ledgers: Goblin Warrior, Goblin
    Assassin, War Dog Subcommander and the summoner Skeleton (refused). None has a cell.
  - Weakness-granting ancestries and complications in the journeys: Revenant (a sheet check
    only), Cursed Weapon (an item grant only) and Silent Sentinel (no damage).
  - No journey assertion changed.
- Authoring checks (all run in the worktree):
  - `pnpm -s lint` clean.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json` clean.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches.
  - `node scripts/audit-ability-grammar.ts`: unchanged.
  - `content:check`, `foes:check` and `supporting:check` verified. There are no content, grammar or
    foe data changes.
  - Focused vitest with `--maxWorkers=2` passed:
    - the new pure and app files, `tests/app/marks.test.ts`, and the manual-immunity case of
      `tests/app/abilities.test.ts`;
    - the engine and scripts files resolve, character-v79-revenant, live-state-initialization,
      strained, marks, damage-types, damage-reactions, triggered-actions, multi-target,
      compound-conditions, foes, cant-stand, effect-instances and heroic-resource-generation;
    - the app files watchers, watcher-interactions, triggered-actions, talent-strained,
      shadow-character, damage-types, damage-reactions, squads, compound-conditions,
      remaining-ancestries, foes, foe-operations, heroic-resource-talent, heroic-resource-conduit
      and complication-actions.
- Journeys were not run (TESTER). Open question: Q-IW-1 in `docs/rules-questions-for-user.md`.
