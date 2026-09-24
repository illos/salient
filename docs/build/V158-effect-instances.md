# V158: Effect instances and durations

Rules review: required. Depends on: V88, V113, V153, V155, V157, and the
[lasting effects design](../lasting-effects-design.md) (QC1 PASS at `0d1ca5f`), sections 1 and 5a.

## Goal

Give the engine tracked lasting effects: a generic effect instance with a source, an owner, a
subject, a payload, a bound duration, extra end conditions, printed stacking into an effective
aggregate, and `effect.list` / `effect.end`, with a minimal active-effects list on hero and foe
sheets. The first consumer is lasting effects whose payload is **table work**. The engine now
tracks and ends them instead of leaving the whole text manual. Modifiers, watchers and reactions
are later slices (design section 8, items 2–5).

## Design (from the lasting effects design)

- **Storage.** `liveState.effectInstances` on heroes and `live.effectInstances` on foes, beside the
  existing condition instances. Condition instances are unchanged and keep their tests. Shape:
  - id, kind (`instruction` in this slice; the rest of the enum is reserved);
  - `sourceUseEventId`, `sourceActorId`, `abilityName`, `actorLabel`, `sourcePath`, `clause`;
  - owner, subject, payload, duration;
  - `endsWhen[]`, status, `endedReason`, `registrationIds`, group;
  - `consumeOn?`, reserved.
- **Durations.** Bound to creatures when applied, using existing clock timings:
  - `start-of-next-turn` (owner): creature-turn turn-start, next;
  - `end-of-next-turn` (owner or subject): end-of-next-turn;
  - `encounter`: expires at combat end;
  - `save-ends` and `eot`: as condition instances do;
  - `maintained`: ends when the owner stops maintaining (V148);
  - `none`.
- **Extra end conditions (`endsWhen`):**
  - `owner-dying`: the damage writer checks the owner reaching dying (rule/health/dying.md);
  - `reused`: the owner uses the same ability again;
  - `willingly-ended`: `effect.end`.
- **Stacking** (Heroes book, "Stacking Unique Effects"):
  - a pure `effectiveAggregate(instances)`: the same ability doesn't stack across owners, the most
    impactful payload wins, and the newest use sets the duration;
  - different abilities combine;
  - a condition or named consequence counts once;
  - tested with the design's examples (two owners' Null Fields, an old +3 with a new +1). Those need
    only the pure function, since payloads with numbers arrive in the modifiers slice.
- **Operations**, both on the command registry, so slash commands and headless calls work:
  - `effect.list [creature]`;
  - `effect.end instance=… [note]`: journaled, and anyone controlling the owner or subject may use
    it, as may the Director.
- **Compile:**
  - Effect sentences of the form "Until <printed duration>, <table-work sentence>" (or with the
    duration after) compile to an `instruction` effect instance.
  - Only durations the engine binds are admitted, and only table-work sentences the coverage boundary
    admits: movement, other creatures' actions, entering banes or edges at a later roll, Recovery
    spending.
  - Anything that changes a number the engine computes stays manual until the modifiers slice.
  - Each admitted pattern cites its source.
- **Display:** the hero and foe sheets list active effect instances (source, duration, clause) with
  an end button that calls `effect.end`. This is minimal; polish comes later.
- **History:** every write goes through the journal. Undo and redo restore instances and their
  registrations. Combat end expires `encounter` instances and unschedules the others, as conditions
  are unscheduled today.

## Acceptance checks

1. Pure tests:
   - the durations bind to the right creatures;
   - `effectiveAggregate` examples from the design;
   - pattern admission and refusal;
   - tamper refusal.
2. App test (convex-test, registered operations):
   - an instruction instance from a compiled use appears in `effect.list`;
   - each duration expires at the right boundary: start of the owner's next turn, end of the
     subject's next turn, and combat end;
   - `reused` ends the old instance;
   - `owner-dying` ends it when the owner reaches dying;
   - `effect.end` ends it with a journaled reason;
   - undo and redo restore it.
3. A headless cohort, `effect-instances`, with persisted readback.
4. TESTER full gate, independent review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V158` from `slice/V157` (`e6f69ac`) in `.worktrees/effect-instances`.
  The design doc is carried from `docs/effects-design` (`0d1ca5f`).
- Implemented on `slice/V158`:
  - `shared/resolve/lastingEffects.ts`: the lasting-instruction grammar (both printed forms,
    "Until <duration>, <work>" and "<work> until <duration>."), `bindDuration`, `timingFor` and the
    pure `effectiveAggregate` ("Stacking Unique Effects", Heroes book). The duration phrases cite
    where each is printed; the only admitted table work is Relentless Nemesis's. A compiled rider
    carries the `lasting` spec; `resolveCompiledAbility` re-reads it from the clause and refuses a
    changed spec, clause or subject as tampering.
  - Storage: `effectInstances` and `ownedEffects` on hero `liveState` and foe `live`
    (`convex/characterTables.ts`). An instance is held by its subject, or by its owner when the
    subject has no live record. The owner keeps a pointer to instances others hold, so
    `owner-dying` (damage writer, rule/health/dying.md) and `reused` (`ability.use`, both compiled
    branches) find them without scanning the campaign. `maintained` ends through
    `resource.maintain value=off`, the Persistent Magic break and the encounter-end reset.
  - Clock (`convex/lib/clock.ts`): `expire-effect` and `saving-throw` work finds effect instances
    after condition instances. `encounter` registers `combat-end` expiry; combat end unschedules
    any other scheduled instance and logs `effect.unscheduled`. Foe removal unschedules too.
  - Operations (`convex/lib/effectOperations.ts`, registered): `effect.list [creature]` (all
    roles, non-gameplay for history) and `effect.end instance=… [note]` (Director, or a player
    controlling the owner or subject), journaled with its reason.
  - Corrections keep a use's lasting occurrence, which is its instance's id.
  - `web/effect-instances.tsx`: the active-effects list with End on the hero sheet's Conditions
    section and the foe sheet. The roster's foe projection carries active instances.
  - Headless cohort `effect-instances` with `tests/fixtures/v158-effect-instances-expected.json`.
- First-consumer survey (hero abilities levels 1–3 and kits, manual in the V72 report on
  `slice/V157`, Beastheart and Summoner excluded, 66 abilities print "until"). Admitted:
  - Relentless Nemesis (`feature/ability/null/level-1/relentless-nemesis.md`): "Until the start of
    your next turn", table work only (the target's unobservable movement and the user's shift).
  Refused, with the reason:
  - Precognition (`talent/level-1/precognition.md`) and Dancer (`shadow/level-3/dancer.md`): each
    has a trigger the engine observes (damage), which is the watchers slice.
  - Apex Predator (`fury/level-2/apex-predator.md`): "for 24 hours" is not a bound duration.
  - No More Than a Breeze (`elementalist/level-1/no-more-than-a-breeze.md`): Persistent section.
  - Remote Assistance (`talent/level-1/remote-assistance.md`): Spend section and an object target
    the effect-only reader doesn't accept; a consumable "next roll" edge (design 5a).
  - Squad! On Me!, Minor Acceleration, Swarm of Spirits, Applied Chronometrics, Perfect Clarity,
    Our Hearts Your Strength, Star Power, Fake Your Death, Unmooring, Weakening Brand: they change
    a number the engine computes (stability, speed, potency, saves, damage, forced movement).
  - Mark, Judgment, Fog of War, Targets of Opportunity, Mind Game and the level-3 mark and edict
    abilities: marks and judgments are design section 5; the edicts and blessings watch turn
    boundaries or damage.
  - Areas, auras, walls and summoned objects (Wellspring of Grace, Font of Wrath, Statue of Power,
    Wall of Fire, the Null Field enlargements, Stink Bomb, Tough Crowd, O Flower Aid, There Is No
    Space Between): design section 6.
  - Strained sections (Hoarfrost, Kinetic Pulse, Gravitic Burst, Overwhelm, Synaptic Override,
    Soul Burn, Incinerate, Iron, Inertia Soak, Fling Through Time, Reflector Field): out of scope.
  - Already compiled lasting riders (Behold a Shield of Faith!, Sacrificial Offer, Raider's Awe,
    the taunt riders) keep their V109/V152 behaviour and create no instance.
- Flip list: the regenerated V72 report moves exactly Relentless Nemesis to compiled, 154 → 155
  reachable (7 without a power roll, unchanged). No foe ability changes. The V64 audit regenerates
  unchanged (classify is untouched). The live inventory test names the addition.
- Deviations and choices:
  - The app test stores the durations and end conditions no admitted sentence prints yet (end of
    the subject's next turn, encounter, `owner-dying`, `reused`) through `applyEffectInstance` with
    a synthetic source occurrence, as the V88 lifecycle test does, and drives their ends with
    registered operations. The start-of-next-turn expiry, list, end, correction, undo and redo use
    the compiled Relentless Nemesis.
  - `effect.list` records a log entry like every operation, classed non-gameplay so history undo
    skips it.
  - The grammar refuses the owner-anchored "end of your next turn", so such sentences stay manual
    until the user rules on Q-EFFECT-1.
  - `maintained` ends the oldest excess instance when maintenance of an ability drops (labelled
    interpretation in `endUnmaintainedEffects`; `effect.end` corrects the pick). Nothing admitted
    uses it yet.
  - Effect-only abilities (V157) don't yet produce lasting instances: no candidate needed it.
- Authoring runs:
  - `tsc --noEmit` and `tsc -p tsconfig.web.json --noEmit` are clean; eslint and prettier are clean
    on the changed files.
  - `vitest run` on the scripts tests `effect-instances`, `audit-ability-grammar`,
    `compiled-ability`, `compiled-condition-privacy`, `compiled-effects-presentation`,
    `effect-only`, `effect-riders`, `live-compiled-report`, `tier-effects` and `tier-instructions`:
    10 files, 184 tests passed.
  - `vitest run` on the app tests `effect-instances`, `effect-riders`, `compiled-effects`,
    `condition-instances`, `effect-only`, `heroic-resource-null`, `heroic-resource-elementalist`,
    `closeout` and `table`: 9 files, 32 passed; `abilities`, `combat`, `history` and
    `party-read-limit`: 4 files, 53 passed.
  - The `effect-instances`, `null` and `compound-conditions` journeys passed under a throwaway
    convex-test harness, which was not committed. This is not the TESTER gate.
