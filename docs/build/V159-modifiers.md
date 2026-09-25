# V159: Modifiers from lasting effects

Rules review: required. Depends on: V158 and the
[lasting effects design](../lasting-effects-design.md) (QC1 PASS), sections 2, 5a and 1 (stacking).

## Goal

Lasting effects that change later rolls or derived values compile. The engine applies them
automatically, and the table can exclude them. This is slice 2 of the design's delivery plan and is
the first slice where lasting effects change numbers
([automation rulings, section 1](../decisions/2026-09-24-automation-rulings.md#1-lasting-effects-and-modifiers-may-be-automated)).

## Design

- **Payload.** A `modifier` effect-instance payload holds:
  - the roll scope: rolls by the subject, rolls against the subject, strikes by or against, power
    rolls, or ability rolls, as printed;
  - edges, banes, a bonus or a penalty, as printed; or
  - a derived stat (`speed`, `stability`, `saving-throw`) and an amount.
- **Consumable components** (design 5a):
  - A "next power roll" or "next strike" modifier is its own sibling instance with `consumeOn`.
  - The first qualifying roll consumes it, even when banes cancel it.
  - Undo of that roll restores it.
- **Rolls.** `ability.use` (rolled paths) collects the effective aggregate (design section 1,
  printed stacking) of every active modifier that applies to the actor's roll, and to each target's
  roll-against. It merges them into the per-target inputs as automatic contributions. The saved
  result records each contribution by instance id.
  - `circumstance` edges and banes: today's `edges`/`banes` arguments, additive.
  - `exclude=[instanceId…]`: the table's override, which drops an automatic contribution for this
    roll without adding an opposite bane.
  - Corrections recompute from the saved contributions and exclusions. They never double count, and
    they never re-read changed effects.
- **Derived values.** Stability feeds the V113 forced-movement allowance. The saving-throw bonus
  feeds the save work. Speed is shown on the sheet as base plus effects (it is table movement). Each
  cites its source.
- **Compile.** Whole-sentence patterns for modifier sentences with bound durations. Each cites its
  source. Only sentences whose every clause is a modifier, a gain (V157), table work (V152/V158) or
  a condition the engine applies are admitted. Anything else stays manual.
- **Display.** Automatic contributions appear on the roll's log entry ("edge from X's Y") with the
  exclude control, as a command on the existing card. The sheet shows derived stats with their
  effect sources.

## Acceptance checks

1. Pure tests:
   - aggregation with the printed stacking (the design's examples);
   - scope matching: by versus against, strikes versus all power rolls;
   - consumption, including an edge cancelled by banes;
   - exclusion;
   - pattern admission and refusal.
2. App tests (convex-test, registered operations):
   - a lasting edge applies to the next matching roll and is recorded;
   - `exclude` drops it, and a correction keeps the exclusion;
   - a consumable edge is consumed once, and undo restores it;
   - a stability bonus changes a forced-movement allowance;
   - Perfect Clarity is covered only if it is admitted; it also needs its tier-3 clarity watcher,
     which belongs to the watchers slice, so that part stays out of this slice.
3. A headless cohort, `modifiers`, with persisted readback of contributions and exclusion.
4. TESTER full gate, independent review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V159` from `slice/V158` (`bd8e7c1`) in `.worktrees/modifiers`.
- Implemented on `slice/V159`:
  - `shared/resolve/modifiers.ts`: the modifier grammar, amount binding, the contributions of a
    subject's active modifiers to one roll, exclusions, consumption, and derived values.
    - The payload (`shared/contracts/liveState.ts` `ModifierPayload`) is a roll modifier
      (`rolls-by` or `rolls-against`; `power-roll`, `ability-roll` or `strike`; edges, banes and a
      bonus) or a stat modifier (`speed`, `stability`, `saving-throw` and an amount).
    - Consumables carry `consumeOn` and end with status `consumed` and the roll's event id.
  - Compile: a rolled ability's whole Effect section that is one admitted modifier sentence becomes
    a `modifier` section node. It is read before V109 riders. An effect-only sentence becomes a
    `modifier` node beside V157 gains and instructions. `resolveCompiledAbility` and
    `resolveEffectOnly` re-read each node from its clause and refuse a changed spec as tampering.
    - A modifier outcome is `applied` for a hero or foe subject.
    - It is `manual` for an object (rule/combat/target.md), for a squad minion (squad actions don't
      read modifiers), or when the bound amount is unknown.
  - `ability.use`, rolled paths (compiled and compatibility):
    - The actor's `rolls-by` modifiers apply to the shared roll against every target. Each target's
      `rolls-against` modifiers apply to its own roll. Both go through printed stacking.
    - `edges` and `banes` are circumstance and add to the automatic contributions. The totals feed
      the V156 insight discount, affordability and resolution.
    - `exclude=[instanceId…]` records a contribution as excluded and doesn't apply it. An unknown id
      is refused.
    - The result row keeps circumstance counts in `edges`/`banes` and each contribution, with its
      exclusion, in `targets[i].contributions` (absent when there were none). The log description
      lists them.
    - The consumables the roll qualified for are used up once, even when banes cancel them, with a
      linked `effect.consumed` entry. Undo restores them through the journal.
  - `ability.correct`: `edges`/`banes` are optional (the circumstance counts), and `exclude` is the
    corrected exclusion set.
    - It recomputes from the saved contributions, never from current effects, so a known edge is
      counted once and an excluded one stays excluded. Bonuses are carried (`correctTarget` takes
      them).
    - Excluding a consumable the roll used up reports "would not have been used up" and leaves it
      used up (design 5a).
    - Including a consumable that was excluded at the roll is refused ("rewind the use"), so a
      correction never consumes later.
  - Derived values:
    - `movementFacts` adds active stability effects to the forced-movement stability, floored at 0
      (rule/character/stability.md). The push outcome records them as `stabilityEffects`.
    - Save work adds the saving-throw bonus to the d10 (`saveSucceeds`) and records it on
      `lastSave.bonus` and in the log.
    - The hero sheet shows speed and stability as base plus effects, and the saving-throw bonus,
      each with its source.
  - Effect-only: "Self and each ally in the area" is read as an area that always names the user,
    and `ability.use` adds the user when omitted. The use stores modifiers with `commitModifiers`.
    Its actor characteristics bind "equal to your <score>".
  - Display: the ability card lists each automatic contribution with an Exclude/Include command
    (`ability.correct … exclude=[…]`). Modifier occurrences show as tracked effects. `effect.list`
    describes modifiers. Closeout and `ability.resolved` skip applied modifiers, as they skip
    applied gains.
  - The Squad! On Me! sheet note no longer says "apply both manually".
  - Headless cohort `modifiers` (`scripts/headless/modifiers.ts`) with
    `tests/fixtures/v159-modifiers-expected.json`.
- Survey: hero abilities at levels 1–3 and kit abilities, Beastheart and Summoner excluded. Every
  body line printing edge, bane, bonus, penalty, stability, speed or saving throw was read.
  - Admitted:
    - Raider's Awe (`kit/raider.md`; `feature/ability/raider/raiders-awe.md`): "The target takes a
      bane on their next power roll made before the end of their next turn." This is a consumable
      `rolls-by` bane on the single target. It ends at the end of the target's next turn (subject
      anchor, bound by V158). It was a V109 table-work rider.
    - Squad! On Me! (`feature/ability/tactician/level-2/squad-on-me.md`, 5 Focus): "Until the start
      of your next turn, each target has a bonus to stability equal to your Might score.
      Additionally, each target gains 2 surges." This gives a stability modifier bound to the
      user's Might on each target, plus a V157 gain.
  - Closest refusals, each staying manual:
    - Wither (`conduit/level-1/wither.md`): the bane is potency-gated tier text ("P < WEAK, the
      target takes a bane on their next power roll"). That needs a tier modifier node with a
      potency and correction rules for a consumed tier effect, which is not in this slice. Its lack
      of an expiry is covered by the Heroes book, "Ending Effects": effects end after combat when
      the heroes want.
    - Perfect Clarity (`talent/level-1/perfect-clarity.md`): the tier-3 clarity watcher belongs to
      the watchers slice. The source blocks are also unaccounted for (V72 diagnostics).
    - Minor Acceleration (`feature/ability/time-raider/minor-acceleration.md`): "(your choice)" of
      score, and a use carries no such choice.
    - Precognition (`talent/level-1/precognition.md`): a damage-triggered free strike (watcher).
    - Remote Assistance (`talent/level-1/remote-assistance.md`): a Spend section, an object target,
      and "an ally" as the roller.
    - Behold a Shield of Faith! (`censor/level-1/behold-a-shield-of-faith.md`): "any ally adjacent
      to you" is map membership. The section stays V109 table work rather than splitting the
      sentence.
    - Sacrificial Offer (`conduit/level-1/sacrificial-offer.md`): "can impose a bane on one power
      roll" is a choice at a later roll.
    - Star Power (`troubadour/level-1/star-power.md`): a tier floor ("can't have an outcome lower
      than tier 2"), which is not a modifier, and a Spend section.
    - Applied Chronometrics (`talent/level-2`): dazed immunity, an extra maneuver and Strained.
    - Swarm of Spirits (`elementalist/level-3`): "until the end of your next turn" (Q-EFFECT-1) and
      potency resistance.
    - Iron (`talent/level-1/iron.md`): the stability lasts "until the target no longer has
      temporary Stamina from this ability", an end the engine doesn't track.
    - Our Hearts Your Strength (`conduit/level-2`): a start-of-turn watcher that counts allies.
    - I'm No Threat and Careful Observation (`shadow`): conditional durations and a restricted
      surge.
    - Phase Strike and Impart Force (`null/level-1`): a tier-3 cap, slowed, and per-square damage.
    - Slow (`talent/level-2`): speed halved, which is not a bonus.
    - Soul Burn (`talent/level-3`): Presence tests (there is no test operation) and Strained.
    - Word of Guidance and Word of Judgment (`conduit/level-1`): triggered actions.
    - Other design sections: Mark and Judgment (section 5), the Null Field enlargements (section 6),
      Choreography, Never-Ending Hero and Fire Up the Night (performances with turn watchers), Fake
      Your Death, We Meet at Last, and Erase.
    - Edges on a later ability the table makes: Blur, Hammer and Anvil, the Inspiring Strike tier
      3, Dramatic Reversal, and With My Blessing.
- Flip list: the regenerated V72 report differs from `slice/V158` (`bd8e7c1`) in exactly two
  entries:
  - Squad! On Me!: manual/legacy-compatibility → supported/compiled. Reachable compiled goes from
    155 to 156, and without a power roll from 7 to 8.
  - Raider's Awe: still compiled. Its section is a `modifier` node instead of a `rider`, so its
    bane is applied rather than left to the table.
  - No foe ability changes. The V64 audit regenerates unchanged, since classify is untouched.
- Journeys and tests updated for the flips:
  - The V109 journey and `tests/app/effect-riders.test.ts`: Raider's Awe stores a modifier and its
    owner pointer. The app test's kit rider witness moves to Protective Attack (Shining Armor),
    whose taunt rider stays table work. The V109 ledger marks the change.
  - `tactician-level-three`: Squad! On Me! is a compiled use.
  - The effect-only target reader test, the V158 manual list, and the `ability.use` syntax.
- Deviations and choices:
  - Interpretation (labelled, `consumedBy`): an excluded consumable is not used up, since the table
    ruled that the roll doesn't qualify. The alternative is consuming it anyway.
  - Interpretation (labelled, `bindModifier`): a bonus "equal to your <score>" for a score below 0
    stays manual. The alternatives are applying the negative score or clamping it to 0.
  - Interpretation (labelled, `saveSucceeds`): a saving-throw bonus adds to the d10. Lowering the
    threshold instead gives the same outcome on every roll.
  - "A stability bonus changes a forced-movement allowance": the V113 push outcome keeps its
    allowance before the optional stability reduction. The bonus raises that reduction
    (`stability`) and names its source (rule/character/stability.md).
  - The lasting-edge app case uses a synthetic source occurrence, as V158 did, because no admitted
    printed sentence gives a lasting edge yet. Raider's Awe (consumable) and Squad! On Me!
    (stability) run through compiled uses.
  - Squad actions (`/squad act`) don't read modifiers, so no modifier is stored on a squad minion.
    Noted for later.
  - Review fix 2: "A test is a power roll" (rule/dice/power-roll.md), so `test.roll` reads the
    tester's own `rolls-by` power-roll modifiers, takes an `exclude` override, adds their edges,
    banes and bonuses, records the contributions and uses up consumables in its own journal (undo
    restores them). A test has no target, so `rolls-against` modifiers don't arise.
  - QC1 R1: each contribution records `usedUp` once, when the roll is made. A correction's
    exclusion keeps it, so a bane the roll used up can be excluded and included again (the Include
    control shows) without a second consumption. A consumable excluded at the original roll still
    needs a rewind.
  - V158's lifecycle (R1/R1b) stores a same-owner identical repeat as a supersede; any other
    same-ability overlap on one subject becomes a manual group (`manualStacking`), unscheduled.
    - `rollModifiersOf` and the stat filter skip manual-group instances.
    - Review fix 1: `commitModifiers` logs `effect.untracked` for a use that joined a manual group,
      and the saved occurrence is `manual` with a stacking requirement, not "applied
      automatically". For example, a second hero's Raider's Awe on the same goblin stays table work.
  - `kit-bonus` failed in 2 of 4 runs, depending on the dice. V148's Persistent Magic correction
    refusal ("a correction can't recompute it") hit an Elementalist target. No modifier is
    involved, and the path is unchanged without contributions. TESTER should confirm whether it
    also flakes on `slice/V158`.
- Open questions:
  - Squad actions should read modifiers before any `rolls-against` modifier is admitted.
    Otherwise a squad's roll against a subject would miss it.
  - Wither needs a potency-gated tier modifier node. A correction that changes its tier must end,
    or refuse to replace, an instance a later roll already used up.

## Publication: 2026-09-25

Merged in train 17 as main `0401350` and published as Worker `7db282ef-874d-4898-83e7-fad8a9c28cfd`. Release logs: `/srv/presidium/projects/salient/test-artifacts/train17-release-0401350`.
