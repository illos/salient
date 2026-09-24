# V172: Owner-anchored "until the end of your next turn" plus the user's rulings

Rules review: required. Depends on: V171 (stacked on `slice/V171` `c47e5514`, itself on V170, V159,
V158 and V157, none merged yet).

## Goal

Bind the owner-anchored duration "until the end of your next turn" the way the user ruled on
Q-EFFECT-1 (B, 2026-09-24), through the existing clock timing, and record the user's rulings on
Q-EFFECT-1 and Q-STRAIN-1. The "(EoT)" tag and the target-anchored "their next turn" keep their
current binding. No other lasting-effect grammar is widened.

## Scope

- **Ruling B** (`docs/rules-questions-for-user.md`, Q-EFFECT-1):
  - Used on the owner's own turn, the effect lasts through the owner's following turn and ends at its
    end.
  - Used off the owner's turn (a triggered action on another creature's turn, or between turns), it
    ends at the end of the owner's next turn, the first one after it is applied.
  - Outside combat it is not scheduled, as every V158 turn-anchored duration: at combat end it stays
    active unscheduled (`effect.unscheduled`) and the table ends it with `/effect end`.
- **Grammar** (`shared/resolve/lastingEffects.ts`): `DURATIONS` binds "the end of your next turn" as
  `{ kind: 'end-of-next-turn', anchor: 'owner' }`. The admitted table work (`BODIES`) is unchanged.
- **Clock** (`shared/contracts/clock.ts`, `convex/lib/clock.ts`): the `end-of-next-turn` clause gains
  an optional `excludeTurnId`, a turn whose end does not count. `isDue` skips it; everything else
  about the clause (first matching turn end, squad participants, one-shot) is unchanged.
- **Binding** (`ownTurnToSkip`, `timingFor`, `convex/lib/effectInstances.ts`): at application, when the
  printed duration is the owner-anchored end of the next turn and the encounter's active turn includes
  the owner (a squad's shared turn lists each participant), that turn is excluded.
- **Rulings recorded** in `docs/rules-questions-for-user.md`: Q-EFFECT-1 answered B with the
  Compendium evidence; Q-STRAIN-1 answered yes to all three current V170 behaviours (docs only).
  `docs/lasting-effects-design.md#durations` notes the ruling.
- Out of scope: the "(EoT)" carve-out and "their next turn" (unchanged); new table work, modifiers or
  conditions with this duration (each candidate's other clauses, below).

Spec: `docs/lasting-effects-design.md#durations`.
Rules question: [Q-EFFECT-1](../rules-questions-for-user.md#q-effect-1-when-does-until-the-end-of-your-next-turn-end-if-used-on-your-own-turn-v158).

## Acceptance checks

1. `tests/app/next-turn-duration.test.ts` (convex-test, registered turn operations, persisted
   readback):
   - applied on Thorn's own turn, the instance is bound to Thorn and its registration excludes that
     turn; it survives Thorn's turn end and the goblin's turn, lasts through Thorn's round-2 turn and
     ends at its end (`ended`, "end of the next turn", registration retired);
   - applied on the goblin's turn (off the owner's turn), no turn is excluded and it ends at Thorn's
     next turn end;
   - a subject-anchored "their next turn" applied on the subject's own turn still ends with that turn;
   - one applied on Thorn's round-2 turn stays active past combat end, unscheduled, one
     `effect.unscheduled` event, and ends with `effect.end`.
2. `tests/scripts/effect-instances.test.ts`: the grammar admits "Until the end of your next turn, …"
   with the owner anchor; `ownTurnToSkip` skips only the owner's own current turn (including a squad
   participant), never for "their next turn" or "(EoT)"; `timingFor` carries `excludeTurnId` only for
   the end of the next turn.
3. `node scripts/report-live-compiled-abilities.ts --check` matches; the V64 audit regenerates
   unchanged.
4. TESTER: `pnpm check`.
5. Independent review, then QC1.

## Work log

- 2026-09-24: `slice/V172` in `.worktrees/next-turn`, cut from `slice/V171` `c47e5514`.
- Implementation commit: `3883a567`. Rulings recorded in the following docs commit.
- Flip list: none. The V72 report (`--check`) and the V64 audit regenerate unchanged; the live
  inventory test is unchanged. The L1–3 hero abilities that print the phrase
  (`feature/ability/...`, from a Compendium grep) each have another blocker:
  - Swarm of Spirits (`elementalist/level-3`): an aura target (area membership, design section 6),
    potency resistance and a saving-throw bonus on allies, and a Persistent section.
  - Hoarfrost (`talent/level-1`): a self condition with this duration (condition instances bind
    save ends and EoT only) and slowed becoming restrained on the target.
  - Every Step… Death! (`censor/level-1`): damage per square the target willingly moves; movement is
    not observable (no map).
  - Font of Wrath (`conduit/level-1`): a summoned spirit and area damage by position.
  - Shared Void Sense (`elementalist/level-1`): targets per Victory and a feature's benefit.
  - Sticky Bomb (`shadow/level-2`): a detonation power roll against an area, and disarming.
  - Fake Your Death (`troubadour/level-1`): invisibility, a speed bonus and four other end conditions.
  - Beastheart: Shadow in the Mist ("or you deal damage", invisibility, Hide), Howling Gale (fly, and
    the companion's speed), Head to Head (the companion's edge), Flurry of Wings (area membership).
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json`: pass.
  - `vitest run --maxWorkers=2` on `tests/scripts/effect-instances`, `tests/app/next-turn-duration`,
    `tests/app/effect-instances`, `tests/app/tier-effects`, `tests/app/watchers` and
    `tests/scripts/live-compiled-report`: 6 files, 24 tests passed.
  - The new app test fails (the effect ends at the owner's current turn end) with the `excludeTurnId`
    check removed from `isDue`.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches.
  - `node scripts/audit-ability-grammar.ts`: regenerated, no diff.
