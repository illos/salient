# V171: Watchers and limits

Rules review: required. Depends on: V170 (stacked on `slice/V170` `411b79a6`, itself on V159, V158
and V157, none merged yet).

## Goal

Lasting effects that watch for a later event compile. A use stores a `watcher` effect instance, and
the engine fires it where it already writes the event: damage at the damage writer, turn boundaries
at the clock, ability uses at the use's commit. Printed limits reuse the V120 claim windows. A firing
is journaled in the triggering operation, so undo reverts it. This is item 3 of the
[lasting effects design](../lasting-effects-design.md#8-delivery-plan). Triggered actions, reaction
cards, damage-changing responses, marks and area membership stay out (design items 4–6).

## Scope

- **Payload** (`shared/contracts/liveState.ts` `Watcher`): `{ event, whose, otherCreature?, limit,
  responses }`.
  - Events: `damage-taken`, `damage-dealt`, `made-winded`, `dying`, `turn-start`, `turn-end`,
    `ability-used` and `strike-made`.
  - `whose`: the instance's subject or its owner.
  - Limits: `turn` ("the first time on a turn"), `round` ("once per round") or `each`.
  - Responses: a gain (surges, temporary Stamina), damage (a fixed amount, dice, or a characteristic
    bound at use) through the damage writer, a condition through the condition instances, and table
    work (`instruction`).
- **Observation points** (`convex/lib/watchers.ts`):
  - `writeDamage` observes `damage-taken`, `made-winded` and `dying` (heroes only) of the damaged
    creature, and `damage-dealt` of the dealer, which `ability.use` and the free strike pass.
    - Winded follows rule/health/winded.md and dying follows rule/health/dying.md.
    - Zero damage is not damage taken (Q-RES-4).
  - The clock gets a new `watcher` work kind. It is registered with the instance, at each turn start
    or end of the watched creature, and retired with the instance and at combat end.
  - `ability.use` (rolled, effect-only and free strike) observes the user's `ability-used`, plus
    `strike-made` for the Strike keyword (rule/combat/strike.md).
- **Limits.** Each instance keeps its `firings`. They are its limit records and use the V120
  `claimWindow` (a round, or the active turn).
  - A `turn` or `round` limit needs combat. Outside it, or between turns, the watcher is logged as
    table work (`effect.watcher-manual`) and does not fire.
  - A same-owner identical repeat that supersedes an earlier use keeps the earlier firings
    (Q-WATCH-1, interpretation 2).
- **Stacking and holders** follow V158:
  - a squad or object subject is not tracked;
  - an unresolved same-ability overlap becomes a manual group, which never fires and is logged;
  - owner-watching instances held elsewhere are found through the owner's pointer (`watches`).
- **Nesting.** A watcher's own damage has no dealer (Q-WATCH-1, interpretation 1). It sets off the
  recipient's watchers after the firing is logged, to depth 3. Deeper chains are left to the table;
  this is an engine guard, not a rule.
- **History** (design section 7):
  - Every write goes through the operation's journal, so undo and redo restore firings, limit
    records and responses.
  - A correction is refused, with "rewind to the use", when the use set off a watcher, or when the
    corrected damage would set one off.
- **Compile** (`shared/resolve/watchers.ts`): each watcher sentence is matched whole and cites its
  source.
  - Rolled Effect sections become a `watcher` section node, for a one-target envelope (V110).
  - Effect-only sentences become a `watcher` node.
  - New effect-only target: "Self and each ally" (`each`, the user always included).
  - A watcher on an area target is refused. An aura "moves with you" (rule/combat/aura.md), and
    area membership is design section 6.
  - `resolveCompiledAbility` and `resolveEffectOnly` re-read each node and refuse tampering.
- **Operations and UI.** `effect.list` describes each watcher. Hero and foe sheets list active
  watchers with a "Watcher: …" line, and the ability card shows a "Watcher" entry. Closeout and
  manual resolution skip applied watchers.

Spec: `docs/lasting-effects-design.md#3-watchers`, `docs/lasting-effects-design.md#7-history-and-corrections`,
`docs/decisions/2026-09-24-automation-rulings.md#2-effects-that-watch-for-later-triggers-may-compile`.
Rules question: [Q-WATCH-1](../rules-questions-for-user.md#q-watch-1-who-deals-a-lasting-effects-damage-and-does-a-repeat-use-reset-the-first-time-v171).

## Acceptance checks

1. `tests/scripts/watchers.test.ts`:
   - The grammar admits and refuses the pinned texts.
   - Violence Will Not Aid Thee and Blessing of Insight compile. Blessing of the Faithful (an aura),
     Our Hearts Your Strength and Reap stay manual.
   - Outcomes: squads and objects are manual, and Blessing always names the user.
   - Tampering is refused.
   - Matching: the watched creature, the event, and "another creature".
   - Limits: per turn, per round, outside combat, and a manual group.
   - Damage events: taken, winded and dying.
2. `tests/app/watchers.test.ts` (convex-test with `transactionLimits: true`, registered operations,
   persisted readback). The Conduit is the v100-war witness at level 2.
   - Blessing of Insight on Thorn. Both hold a watcher with turn-end and combat-end registrations.
     The Conduit's turn end gives each 1 surge through two clock firings. Undo reverts both and redo
     restores them.
   - Violence Will Not Aid Thee on a goblin: a save-ends watcher. In the goblin's turn:
     - the first Free Strike on Thorn deals 1d10 (7) lightning to the goblin, 15 → 8;
     - the second deals nothing;
     - undoing both strikes restores 15 and an empty firing record.
   - A Spear Charge hit that fired the watcher, corrected with an edge, is refused ("Rewind to the
     use").
   - A synthetic once-per-round `damage-taken` watcher on Thorn:
     - two goblin strikes in round 1 give one surge;
     - round 2 gives another;
     - the firing records name each strike and round, and `effect.list` describes it.
3. Both reports are regenerated and checked: `node scripts/report-live-compiled-abilities.ts --check`,
   and the V64 audit is unchanged.
4. TESTER: `pnpm check` and the `conduit-level-three` and `conduit` journeys (assertions updated, not
   run here).
5. Independent review, then QC1.

## Work log

- 2026-09-24: ENGINE2 thread, `slice/V171` in `.worktrees/watchers`, stacked on `slice/V170`
  `411b79a6`.
- Flipped to fully compiled:
  - **Violence Will Not Aid Thee** (`feature/ability/conduit/level-1/violence-will-not-aid-thee.md`)
    is a rolled Effect-section watcher: damage dealt to another creature, the first time on a turn,
    1d10 lightning to the target, save ends.
  - **Blessing of Insight** (`feature/ability/conduit/level-2/blessing-of-insight.md`) is
    effect-only: the owner's turn ends, 1 surge to each target, until the end of the encounter or
    until the Conduit is dying.
  - The live report goes from 158 to **160** reachable compiled (effect-only 8 → 9); compatibility
    goes from 1463 to 1461. No foe ability changes. The V64 audit regenerates unchanged (classify is
    untouched).
- The research list, checked against the Compendium and `docs/build/evidence/V72/support.md`. The
  rest stay manual:
  - **Blessing of the Faithful** (`censor/level-2`), the same sentence on a 3 aura: area membership
    is design section 6. It compiled by accident at first and is now refused explicitly.
  - **Censored** (`censor/level-1`): "made winded by this ability … reduced to 0 Stamina" is a
    same-use consequence, not a lasting watcher. It needs a new "reduce to 0" response, the
    leader/solo organization, and tier-correction re-derivation.
  - **Our Hearts Your Strength** (`conduit/level-2`): it counts allies within 10 squares (no map),
    and a rolled-damage bonus is not a V159 modifier.
  - **Reap** (`conduit/level-2`): "kills an enemy" is not observed, because squad casualties come
    from the squad pool rather than the damage writer. The enemy relation is not modelled either.
  - **Edict of Perfect Order** and **Edict of Disruptive Isolation** (`censor/level-3`): aura
    targets (section 6), judgment (section 5) and adjacency.
  - **Behold the Mystery**, **Conflagration** and **The Flesh, a Crucible** (`elementalist/level-1`):
    Persistent sections, which need maintained-duration reading and the V148 maintenance cost; a
    turn-start instruction watcher is the likely route.
  - **Invigorating Growth** (`elementalist/level-1`): "any ally adjacent to the target" is a map fact,
    and the mushrooms end by a main action.
  - **Your Entrails Are Your Extrails!** (`fury/level-1`) and **Arcane Disruptor** (`null/level-1`):
    "while bleeding/weakened this way" ties the watcher's life to a potency-gated tier condition. That
    needs a linked lifetime and correction re-derivation. Arcane Disruptor also needs a
    "supernatural ability that costs Malice" filter (rule/general/supernatural.md).
  - **Face the Storm!** (`fury/level-3`): a damage bonus and a potency increase against taunted
    creatures are not V159 modifiers.
  - **You Are Already Dead** (`fury/level-3`): a delayed "reduced to 0 Stamina", a leader/solo branch
    and a free strike.
- Journeys checked for the flipped names:
  - `scripts/headless/conduit-level-three.ts`: Blessing of Insight is now an `ability.use` with a
    watcher on the Conduit and no surge at the use. Updated, not run.
  - `scripts/headless/conduit.ts` matches Violence Will Not Aid Thee's "lightning" remainder against
    compiled clause text too, so it is unchanged.
- Deviations and choices:
  - Watcher damage has no dealer, and a supersede carries the firings; both are labelled in Q-WATCH-1.
  - The nesting depth of 3 is an engine guard.
  - Resource (heroic resource) gains are not a response yet: no compiled watcher needs one, and the
    V120 claim path is keyed by class triggers. This is the next step when a consumer arrives.
  - `killed` and `saving-throw` events are not observed yet (see Reap above).
  - `force-move-attempted` and actual `force-moved` are not built. Movement watchers stay manual
    until a table-confirmed movement fact exists (design section 3).
- Pre-existing failure, not from this slice: `tests/app/abilities.test.ts` "every A05 operation is
  registered and discoverable" pins the `ability.use` syntax without V170's `[strained=…]`. It fails
  on `slice/V170` too.
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json`: pass.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches. `node
    scripts/audit-ability-grammar.ts` regenerates unchanged.
  - `vitest run --maxWorkers=2`:
    - `tests/scripts`: watchers, live-compiled-report, audit-ability-grammar, modifiers, effect-only,
      effect-instances, compiled-ability, strained, tier-instructions, effect-riders.
    - `tests/app`: watchers, effect-instances, modifiers, effect-only, effect-riders,
      condition-instances, talent-strained, heroic-resource-conduit, heroic-resource-null,
      heroic-resource-elementalist, heroic-resource-censor, party-read-limit, combat, history,
      closeout, table, squads, compiled-effects, compound-conditions, potency-conditions.
    - `tests/character-v100-conduit` and `tests/character-v134-conduit-three`.
    - All passed except the pre-existing `abilities.test.ts` syntax pin above.
- Committed on `slice/V171` as `d834cdee` (rebased onto V170 `38829088`; first committed as
  `a29cb33f`) and pushed. The independent review passed with notes.
- Review follow-ups:
  1. **Correction mode.** Any watcher that watches the changed damage now refuses the correction
     ("rewind to the use"), whatever its limit state; only a manual stacking group is exempt. Before,
     a `limited` or `manual` watcher was skipped against the current turn and round, not the use's.
     The changed damage is read in both directions, so less damage is watched as well as more.
  2. **Firings by cause.** `assertWatchersReconcilable` finds every `effect.watcher-fired` entry the
     use caused under its command (`by_campaign_command`) on whichever creature holds the watcher.
     The fired entry now records its holder. A firing still on its instance (not undone) refuses the
     correction and is named. Before, only the dealer and the target were read, so a nested firing
     on a third creature was missed.
  3. **Manual paths.** Uses recorded for manual resolution (the manual-compilation, Stand Up and
     recorded paths of `ability.use`) and `/adjust stamina` or `/adjust temporary-stamina` edits
     that lower a hero's or foe's pools reach no observer. Where the actor or a target holds a
     watcher of the use or the damage, a linked `effect.watcher-manual` note tells the table to
     resolve it. Nothing fires.
  4. This log now cites `d834cdee`.
- Tests added to `tests/app/watchers.test.ts`:
  - a limited-watcher correction is refused;
  - a nested third-creature firing is named in the refusal;
  - Aid Attack and a manual Stamina edit leave notes;
  - raising Stamina leaves no note.
