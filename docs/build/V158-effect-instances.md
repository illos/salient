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
