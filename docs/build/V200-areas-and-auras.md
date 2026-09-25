# V200: Areas and auras with table-kept membership

Rules review: required. Depends on: V158, V159, V170, V171, V173, V174, V175, V178, V179.

## Goal

Areas and auras compile. A use stores an `area` effect instance on its user whose members the table
keeps, since there is no map. Each printed rider fires for the members it applies to: at their turn
start, at the user's turn end, or when a member is added, which counts as entering the area. The
user ruled this on 2026-09-25 (below). Distance, line of effect, the area's size and shape, and
moving it stay table facts. Nothing the engine computes depends on geometry.

## Scope

User rulings, 2026-09-25, recorded in `docs/lasting-effects-design.md` section 6,
`docs/decisions/2026-09-24-automation-rulings.md` section 6 and `docs/rules-questions-for-user.md`
Q-AREA-1:
1. **Membership is table-picked.** The use's targets are the first members, and the table edits the
   list later as creatures move.
2. **Adding a member means they entered.** `effect.members add` is an "enters the area" event, and
   enter riders fire subject to the printed once-per-round limit. There is no "list fix" flag and no
   movement confirmation. Removing a member is leaving. Undo of an add reverses it and what it set
   off, through the journal.

- **Contract** (`shared/contracts/liveState.ts`, validators in `convex/characterTables.ts`):
  - an `area` payload whose riders each carry `who` (`self`, and `ally`, `enemy` or `none` relative
    to the user) and a V171 watcher;
  - `EffectInstance.members`: party, child instance ids, and a manual reason for members the engine
    can't hold riders on;
  - `EffectInstance.area`: the link from a rider to its area and rider index;
  - the `area-entered` watcher event, the `performance` end trigger, and `no action` as an action
    type.
- **Grammar** (`shared/resolve/areas.ts`). Whole Effect sections are read with the target line's
  relation, and each cites its source:
  - effect-only: Blessing of the Faithful, Wellspring of Grace, Ballad of the Beast, Revitalizing
    Limerick and Fire Up the Night;
  - rolled: Incinerate's column of fire.
  - Incinerate's Strained section ends the area at the end of the user's turn
    (`shared/resolve/strained.ts`). It is admitted only with the area section.
  - `compileAbility` makes an `area` node, and `resolveCompiledAbility` and `resolveEffectOnly`
    re-read it and refuse tampering. "No action" is admitted only for the Performance keyword.
  - A manual clause of the other candidates carries an `area-manual` diagnostic naming what's
    missing.
- **Outcome** (`shared/resolve/compiledOutcome.ts` `CompiledAreaOutcome`):
  - once per use, with the targets as members and the bound riders;
  - a strained Incinerate lasts until the end of the user's turn (`eot` on the user);
  - with no strained decision, the outcome is manual.
- **Runtime** (`convex/lib/areas.ts`, `convex/lib/effectInstances.ts`):
  - `applyArea` stores the area on its user without V158 stacking; stacking is judged on riders.
  - Each applicable rider is stored as a child `watcher` instance on each member, so V171 registers,
    fires, limits and journals it, and the V158 boundary sees it. Riders are grouped by index, and
    the same rider from another area of the same ability joins a manual stacking group.
  - A rider leaves with its member and ends with the area (`endEffectInstance` cascades).
  - A re-added member's rider keeps its earlier firings, so "the first time in a combat round" is not
    reset by leaving.
  - Squad minions, squads and objects are manual members, as in V158. A squad as a whole is refused;
    add its minions.
  - Watcher damage goes through `writePlannedDamage`.
- **Performances** (`feature/troubadour/level-1/routines.md`):
  - "While this performance is active" lasts the encounter;
  - any use of a Performance ability by its user ends the current one (`endChosenPerformance`, in
    every `ability.use` path);
  - a `performance` clock work item at each round start ends it when the user is dazed or dead
    (`maintainPerformance`).
- **Operation** `effect.members instance=… add=@Creature | remove=@Creature [note]`:
  - registered, so the palette, slash text and headless calls share it;
  - the Director may change any area, and a player an area their hero owns or their own hero's
    membership;
  - journaled with the actor;
  - an aura's user can't leave it (`rule/combat/aura.md`).
  - `effect.list` shows each area's members.
- **UI** (`web/effect-instances.tsx`). An area lists its members, with Remove buttons and an Add
  picker that call `effect.members`. A rider says which area it belongs to. The ability card shows
  an Area entry. The hero sheet and the foe roster carry the fields.

Spec: `docs/lasting-effects-design.md#6-areas-and-auras`,
`docs/decisions/2026-09-24-automation-rulings.md#6-areas-and-auras-the-table-keeps-the-members-2026-09-25`.
Rules questions: Q-AREA-1 (answered) and Q-AREA-2 (readings, open).

Compendium read (`en/unified/md`):
- rules: `rule/combat/aura.md`, `area-of-effect.md`, `cube.md`, `burst.md`, `wall.md`, `side.md`,
  `enemy.md`, `ally.md`, `target.md`, `combat-round.md`, `surprised.md`, `rule/health/dying.md`,
  `feature/troubadour/level-1/routines.md`;
- abilities: every candidate below, at `feature/ability/<class>/level-N/<slug>.md`.

## Acceptance checks

1. `tests/scripts/areas.test.ts`:
   - the grammar admits the printed texts and refuses changed ones;
   - the Strained sentence is read;
   - the six abilities compile, and every other candidate is manual with `area-manual`;
   - "No action" needs Performance;
   - Incinerate's outcome is shown not strained, strained, and undecided;
   - Blessing of the Faithful names its user;
   - tampering is refused;
   - `riderApplies` covers sides;
   - enter matching is per area, and the enter limit is once per round, never outside combat.
2. `tests/app/areas.test.ts` (convex-test, `transactionLimits: true`, registered operations,
   persisted readback):
   - **Incinerate:**
     - the use stores the area with the target as member, and two riders on it;
     - an add deals 2 fire;
     - a second add is refused;
     - after a remove, a re-add in the same round deals nothing;
     - undo of the three reverses the damage and the riders;
     - an ally member gets no riders;
     - the goblins' turn starts deal 2 fire each;
     - in round 2, leave-and-enter deals 2 again, and the firings read rounds [1, 2];
     - the Talent's next turn start ends the area and every rider.
   - **Blessing of the Faithful** (Censor v99-fate, level 2):
     - the members are the Censor and Thorn;
     - after Thorn leaves, only the Censor gains the surge at the turn end;
     - after re-entering, both gain one;
     - `/adjust stamina value=0` on the Censor ends the aura and its riders.
   - **Probes:**
     - the crucibite's printed fire immunity 2 takes the enter damage to 0;
     - no triggered offer comes from rider damage;
     - a squad minion is a manual member, and a squad is refused;
     - a correction after an add is refused by the history window;
     - after undoing the add, the correction changes only the use's own damage and keeps the area;
     - undo of the use leaves no area or rider.
   - **Two Talents' columns on one goblin** ("Stacking Unique Effects"): the second set of riders
     joins a manual stacking group with the first, so the goblin's turn start deals nothing
     automatically instead of 2 + 2. An add that joins such a group logs it as `effect.untracked`.
   - **Ballad of the Beast and Revitalizing Limerick** (Troubadour v102-3):
     - the members are the Bard and Thorn;
     - the Bard can't leave;
     - Thorn's turn start gains 1 surge;
     - the round-2 start logs "maintained";
     - the Bard's turn start gains 1 surge;
     - choosing Revitalizing Limerick ends the Ballad and its riders;
     - the Limerick's reminder fires at the Bard's turn end;
     - dazed at the round-3 start ends it.
3. Reports: `node scripts/report-live-compiled-abilities.ts --check` matches. `node
   scripts/audit-ability-grammar.ts` regenerates unchanged.
4. TESTER: `pnpm check`, and the `areas`, `talent`, `censor-level-three`, `conduit-level-three`,
   `troubadour` and `troubadour-level-three` journeys. They were updated, not run here.
5. Independent review, then QC1.

## Work log

- 2026-09-25: ENGINE2 thread. `slice/V200` in `.worktrees/areas`, cut from main `e70a482c`.
- Flipped to fully compiled. Six abilities; the live report goes from 182 to **188** reachable
  compiled, without a power roll from 20 to 25, and compatibility from 1439 to 1433. No foe ability
  changes, and the V64 audit regenerates unchanged.
  - **Incinerate** (`talent/level-1/incinerate.md`), rolled:
    - the tier damage as before;
    - the column is an area of the targets until the start of the Talent's next turn;
    - 2 fire on entering (once per round) and at an enemy member's turn start;
    - strained, the column ends at the end of the Talent's turn.
  - **Blessing of the Faithful** (`censor/level-2`): 1 surge to each member at the Censor's turn
    ends, until the end of the encounter or until the Censor is dying.
  - **Wellspring of Grace** (`conduit/level-2`): at an ally member's turn start, a reminder that they
    can spend a Recovery (table work), with the same duration.
  - **Ballad of the Beast** (`troubadour/level-1`): 1 surge to a member at its turn start while the
    performance lasts.
  - **Revitalizing Limerick** (`troubadour/level-1`): at the Troubadour's turn end, the printed
    choice and Recovery as table work.
  - **Fire Up the Night** (`troubadour/level-3`): at a member's turn start, the printed concealment
    and search clauses as table work.
- The rest stay manual, each with an `area-manual` diagnostic, after checking every candidate against
  the Compendium and `docs/build/evidence/V72/support.md`:
  - **Null Field** (`null/level-1`) prints "Each target reduces their potencies by 1." A potency
    reduction on the members' own abilities is not a modifier the engine applies. Its three
    discipline options (a free maneuver once per turn), its life after the encounter and its
    willing end are manual too.
    - The family depends on it: **Psychic Pulse**, **Heat Sink**, and **Absorption**, **Molecular
      Rearrangement**, **Stabilizing** and **Synapse Field** enlarge it or read "the area of your
      Null Field".
    - Molecular Rearrangement also needs an I < AVERAGE potency on entering, and Synapse Field a
      rolled-damage watcher.
  - **Choreography**: +2 speed until the end of the member's turn is a modifier. Riders don't store
    modifiers yet.
  - **Acrobatics**: an automatic tier 3 on one later test isn't an input the test operation takes.
  - **Never-Ending Hero**: a "starts their turn dying" filter, plus an edge and ignoring bleeding
    until the end of the turn.
  - **Font of Wrath** and **Statue of Power**: the area is around a summoned spirit or statue, which
    the engine doesn't track (the statue has its own Stamina and immunities).
  - **Wall of Fire**: the damage counts the squares of the wall a creature enters or starts in, a map
    fact.
  - **O Flower Aid, O Earth Defend**: its listed area effects and Persistent section (moving the
    area, the line-of-effect end, V148 maintenance).
- Journeys and fixtures checked for every flipped name (`grep` over `scripts/headless` and `tests`):
  - `scripts/headless/censor-level-three.ts`: Blessing of the Faithful is now an `ability.use` with
    an area on the Censor and its rider.
  - `scripts/headless/conduit-level-three.ts`: Wellspring of Grace is an `ability.use`, with the
    area on the Conduit and the rider on the member.
  - `scripts/headless/troubadour.ts`: Revitalizing Limerick and Ballad of the Beast now target the
    Troubadour and the ally ("Self and each ally in the area" must name the user), and read the area
    back.
  - `scripts/headless/troubadour-level-three.ts`: Fire Up the Night is an `ability.use` with the
    area and its rider.
  - `scripts/headless/talent.ts` is unchanged. Incinerate was already a rolled use, and its ledger
    remainder `fire|strained` still matches the compiled area and Strained clauses.
  - The fixtures only name the abilities. `tests/scripts/watchers.test.ts` now expects Blessing of
    the Faithful as an area. `tests/scripts/live-compiled-report.test.ts` lists the six and counts
    25 effect-only.
  - The activation notes of the flipped abilities (and Incinerate: Lingering Fire) now say what the
    engine does.
- New headless cohort `areas` (`scripts/headless/areas.ts`): Incinerate with an add, a limited
  re-add and undo. It is registered in `scripts/verify-character-headless.ts` and has not been run
  here.
- Cross-feature probes (Q-AREA-2 point 6 labels the dealer reading):
  - **V174 revisions:** rider damage reaches only members on the other side from the user, so a
    hero's area never damages a hero or an ally. A revision needs a recorded hit, and an
    `effect.members` entry has none. No compiled foe owns an area.
  - **V173 offers:** rider damage has no dealer (Q-WATCH-1 point 1), so only damage-taken triggers
    could answer it. No offer arose in the probe.
  - **V175 marks:** the Mark benefit needs rolled damage, and "you or any ally deals damage"
    watchers need a dealer, so rider damage sets neither off. A retarget on 0 Stamina is unaffected.
  - **V178/V179:** rider damage goes through `damageTargetFacts`, so printed and granted immunity
    and weakness apply (tested with the crucibite).
  - **Corrections:** an area is once per use and keeps its occurrence. A correction after a later
    add is refused by the history window. Otherwise it changes only the use's damage.
  - **Owner dying:** "until you are dying" ends the area and its riders (tested). Riders carry
    `owner-dying`, so V171's firing re-check also ends them.
  - **Line of effect and moving the area:** table facts. The table edits members or ends the effect.
  - **Undo of `members add`:** it reverses the enter damage (tested).
- Next steps:
  1. a potency modifier for Null Field and a Null Field area, so the Null family can follow;
  2. modifier responses on riders (Choreography, Never-Ending Hero);
  3. Persistent areas (O Flower Aid, V148 maintenance).
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json`: pass.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches.
  - `node scripts/audit-ability-grammar.ts`: regenerates unchanged.
  - `vitest run --maxWorkers=2`, all passed:
    - `tests/scripts` (19 files, 262 tests): areas, audit-ability-grammar, compiled-ability,
      compiled-effects-presentation, effect-instances, effect-only, effect-riders,
      live-compiled-report, marks, modifiers, multi-target, strained, tier-instructions,
      triggered-actions, watchers, damage-reactions, granted-defenses, damage-types,
      forced-movement-followups.
    - The character tests for the Conduit, Censor, Talent, Troubadour and follow-up actions (10
      files).
    - `tests/app` (31 files, 177 tests): areas, watchers, watcher-interactions, effect-instances,
      effect-only, modifiers, talent-strained, triggered-actions, marks, damage-reactions,
      granted-defenses, immunity-weakness, heroic-resource-troubadour, -talent, -conduit, -censor,
      next-turn-duration, registry, abilities, combat, history, closeout, table, squads,
      party-read-limit, compiled-effects, condition-instances, effect-riders, multi-target,
      supporting-actions, elementalist-character.
- Committed on `slice/V200` as `43cea7d5` (not pushed). Handoff to TESTER and review is the lead's.
