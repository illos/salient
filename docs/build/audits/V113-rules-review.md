# V113 independent rules and implementation review

Reviewer: V113-REVIEW (independent ENGINE2 review subagent). Date: 2026-09-24.
Reviewed `285813f84420e1e2ce4e2357577e8b882b76bd41` against base `344a7d7`, in `.worktrees/engine-tier-effects`.
Rules source: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, `en/unified/md`.

Verdict at `285813f`: changes required (R1–R3). The grammar, the compiler run, the resolver and all
27 promotions are correct against the source. Previously compiled nodes are byte-identical.

## R1: EoT on a creature that shares a squad turn never expires

`convex/lib/clock.ts` `isDue` (`end-of-next-turn`) matched only `event.turn.creatureId`. A squad's
shared turn names the squad and lists the members and the attached captain in `participantIds`
(`convex/lib/initiative.ts`). An attached captain is an ordinary, eligible foe target, so an EoT
condition on it never came due. `rule/monster/captain.md`: the captain takes their turn with the
squad. `rule/combat/end-of-turn.md`: the effect ends at the end of that turn. Required change:
match participants the way `creature-turn` does, and add a focused test.

## R2: the headless Vuken build is not a legal level-1 build

`scripts/headless/tier-effects.ts` put the stormwight-only Vuken kit (`kit/vuken.md`,
`feature/fury/level-1/beast-shape.md`) on the Berserker witness. The Q-R-103 ruling restricts
Berserker and Reaver to the standard kits, and the wizard implements it. Required change: use a
Stormwight witness. Expected values are unchanged: potencies 0/1/2, and damage 6/9/11.

## R3: a correction does not restore a taunt that the corrected use replaced

Knightfell B's taunt ends A's (`condition/taunted.md`). Correcting B's use to tier 1, which has no
taunt, ends B's instance and re-applies nothing, so A's stays ended and the target is untaunted. The
correction window allows this. Required change: refuse such corrections (tell the user to rewind)
or restore the replaced instance and registration, and add a focused test.

## Reviewed and accepted

- **Grammar.** `tierConditionExpression` and `forcedMovementExpression` admit exactly the
  documented forms:
  - no duration only for prone (`condition/prone.md`);
  - grabbed only with save ends (`condition/grabbed.md`);
  - lowercase characteristic or potency words are rejected.

  Compounds, "can't stand", bare non-prone conditions, trailing prose and comma-joined or
  potency-gated movement stay unsupported. V88's `conditionExpression` and the V64 audit are
  unchanged.
- **Compiler.** `supportedRun` admits only unbroken runs after the damage clause; nothing is
  skipped. The regenerated V72 report compared with `344a7d7`:
  - 1536 entries each side, and every previously supported entry is byte-identical;
  - exactly 27 promotions (72 → 99) and no demotions;
  - 135 manual envelopes gain partial nodes but stay manual, which is report-only.
- **Resolver.**
  - Unconditional conditions need an eligible creature and completed damage; objects and squads
    stay `fact-needed` (`rule/combat/target.md`).
  - The V88 requirement order is preserved.
  - Movement instructions match `movement/forced-movement.md`: push, pull, slide, vertical, fewer
    squares allowed, and the Big Versus Little bonus for Melee and Weapon abilities.
  - Stability reduction is optional (`rule/character/stability.md`).
  - Printed order follows `rule/dice/ability-roll.md`, and the structural tamper checks are
    complete.
- **Live state.**
  - EoT registers `end-of-next-turn` / `expire-effect`, and the handler validates before ending.
    `none` registers nothing.
  - Combat end unschedules EoT, and `condition off` ends every instance of the condition.
  - The validators accept the new durations.
  - The rolled-save guard is unaffected, and history restores EoT expiry.
- **The 27 promotions.** Each matches its source tiers, in printed order. Gasping in Pain keeps its
  V109 surge rider, and the kit-bonus flag is set only on the kit signatures.
- **Tests.** Expected values trace to source. The other fixture swaps are legal:
  - Holy Lash and Staggering Curse are Conduit level-1 signatures, and Magnetic Strike is a Null
    level-1 signature.
  - Retiarius is a standard kit.
  - The target uses the Elementalist "2, 2, −1, −1" array with A −1.
- **README.** A per-worktree offline install replaces the symlink.

## Non-blocking observations

1. A manual or unknown-source `taunted` is never replaced by a sourced taunt. Leaving it manual is
   defensible; the log could say so.
2. The movement label read "Printed push" for pull and slide.
3. Prone's `none` duration read "until removed"; "until Stand Up" would match the source.
4. Condition-name matching is case-insensitive, unlike V88. This is harmless on the current corpus.
5. The README subshell `cd` left the following lines' working directory ambiguous.
6. `imposedDuringTurnId` is unused. First-turn-end is equivalent while no clock handler imposes EoT
   during a turn-end dispatch.
7. Objects receive movement instructions while conditions on objects stay `fact-needed`. This
   extends V26 push and deserves a labelled interpretation.
8. Hero live state carries the taunter's foe id. Foe ids are already public.
9. Potency from the highest characteristic predates V88.
10. The STATUS row order.

No tests, builds, generators or services were run by the reviewer.

## R1–R3 closure: `38a43f74c2036ed619c276f9855a4812900eb850`

Final static verdict: PASS. Reviewed `285813f..38a43f7` against the pinned Compendium `fb83a789`.

- **R1 closed.** `end-of-next-turn` now matches the turn owner or any `participantIds` entry, the
  same as `creature-turn`. EoT on an attached captain ends with the squad's shared turn
  (`rule/monster/captain.md`, `rule/combat/end-of-turn.md`). The new `isDue` test covers a
  participant, a non-participant and `turn-start`.
- **R2 closed.** The Vuken actor uses the Stormwight `kit-raden` witness (M 2 / A 2). The Vuken
  kit is legal for a Stormwight (`feature/fury/level-1/beast-shape.md`, `kit/vuken.md`,
  Q-R-103). Expected prone at any tier and damage 6/9/11 are unchanged.
- **Conduit expectations.** Holy Lash and Staggering Curse are Magic, so Prayer of Destruction
  adds +1 (`feature/conduit/level-1/prayer-of-destruction.md`) and damage is 6/8/11. Magnetic
  Strike stays 7/10/13 and Net and Stab 6/8/10.
- **R3 closed.** A replaced taunt records `replacedBy` (contract and validator). `ability.correct`
  refuses to correct the replacing use and tells the user to rewind, which restores the old taunt
  and its registration through the journal. The app test asserts the refusal.
- **Non-blocking fixes.** Observations 2, 3, 5 and 10 are fixed. Observations 1, 4 and 6–9 stay
  open and are not regressions.
- No compiler, grammar or resolver source changed in this range, so the 27-promotion inventory
  still holds.

No tests, builds, generators or services were run by the reviewer.

Reviewed-By: V113-REVIEW (pass, 2026-09-24)
