# V119 independent rules and implementation review

Reviewer: V119-REVIEW (independent ENGINE2 review subagent). Date: 2026-09-24.
Reviewed `a72c6506f5dc51b2dac349a3664894f8246114f6` against base `635113a`, in `.worktrees/engine-grab`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `a72c650`: changes required (R1–R8).

- **R1.** A creature already grabbed by one enemy could be grabbed by another (`chapter/classes.md`,
  Stacking Unique Effects). Required: withhold compiled and maneuver grabs, and add tests.
- **R2.** Foes could hold several grabs, from one multi-target use or a second use
  (`chapter/monster-basics.md`, Creatures Who Grab). Required: withhold them for the table.
- **R3.** Q-GRAB-1 missed the monster rule and Stacking Unique Effects, and its recommended option
  contradicts the source. Required: rewrite it; hero-only question plus Knocking Heads.
- **R4.** Grab event text said Stand Up ends a grab. Required: condition-specific text from
  `condition/grabbed.md`.
- **R5.** Correcting a Grab or Escape Grab use left the grab state wrong. Required: refuse and
  rewind, or reconcile.
- **R6.** A restrained creature could Stand Up (`condition/restrained.md`), and a grabbed creature
  could Knockback (`condition/grabbed.md`). Required: refuse both.
- **R7.** Escape Grab silently dropped its bane when a source size was unknown. Required: warn.
- **R8.** Three interpretations were unlabelled: the size rule on grabs imposed by abilities
  (Mindkiller example), "1T–1L count as 1" (`rule/character/size.md`), and "usually" in `grab.md`.

## Reviewed and accepted

- **Size order and Might exception.** They match `rule/character/size.md` and
  `condition/grabbed.md`. Unknown sizes stay `fact-needed` or manual.
- **Grammar.** A bare grab compiles with duration `none`; an EoT grab stays unsupported. The
  structural gates mirror the grammar.
- **Live state.** A no-duration grab has no registration and records `sourceActorId`. It is written
  under the use's journal scope, so rewind restores it.
- **Common maneuvers for every creature.** Supported by `feature/common/maneuvers/*.md` and
  `chapter/monster-basics.md`, with no duplicate for foes.
- **Maneuver tiers.** Grab and Escape Grab follow the printed tiers 1–3. The Escape Grab bane is
  applied only when smaller. Stand Up targets yourself or a willing adjacent creature.
- **UI and closeout.** `ineligible` is final in closeout and in `ability.resolved`.
- **The five promotions** (Joint Lock, Bear Claws, Tentacle, Killer Claws, Rotten Smash) compile as
  printed.
- **Tests.** The fixture values trace to source.

## Non-blocking observations

1. Knockback's "usually … size" has no size check.
2. Stand Up ignores prone that its source says the creature can't stand from.
3. Stand Up on another creature leaves willingness and adjacency to the table.
4. Escape Grab tier 3 ends every grab on the actor.
5. The Grab maneuver ignores immunity and prevention.
6. The grabbed condition's own bane is not automated.
7. Squad minions can't use Stand Up individually.
8. A natural-roll citation should point to `rule/dice/natural-roll.md`.
9. The pure test covers only Joint Lock's compilation.

No tests, builds, services or pnpm were run by the reviewer.
