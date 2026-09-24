# Lasting effects, watchers and reactions: engine design

Status: proposal by ENGINE2, 2026-09-24, for user review. It builds pieces 4–6 of the automation
plan on the product rulings in
[the automation rulings](decisions/2026-09-24-automation-rulings.md):
- automation is the goal;
- modifiers may feed rolls automatically;
- effects that watch for later triggers may compile;
- damage responses revise the hit (option B);
- the triggered action's owner uses it, and the Director can act for them.

This document is CLI/API first. UI appears only where the table needs to see or end something.
Polish comes later.

The pinned Compendium is the only rules source. Every effect kind below is admitted per ability, by
whole-sentence grammar that cites its source, as V109–V157 do.

## Why

After V152–V157, most remaining level 1–3 class abilities last beyond the moment of use or react to
later events. By the V157 survey of the 120 roll-less abilities across the nine classes without
companions:
- about 50 last for a while ("until the end of the encounter or until you are dying" appears 13
  times, "until the start of your next turn" 8);
- about 29 watch for events ("whenever …" 15 times);
- about 27 are triggered actions;
- about 30 change later rolls (bonuses, edges and banes).

Rolled abilities carry the same shapes in their Effect sections.

## 1. Effect instances

Generalize today's condition instances (V88/V113/V153/V155) into **effect instances**. A condition
instance becomes one kind of effect instance. The persisted shape and the saving throw, EoT expiry
and journal behaviour are kept.

```
EffectInstance {
  id                      // occurrence id of the use that created it (as today)
  kind: 'condition' | 'modifier' | 'aura' | 'mark' | 'watcher' | 'maintained'
  sourceUseEventId, sourceActorId, abilityName, actorLabel, sourcePath, clause
  owner                   // the creature that "you" refers to: the actor at use time (bound on apply)
  subject                 // the creature it applies to (target, or owner for self effects)
  payload                 // kind-specific, below
  duration: Duration
  endsWhen?: EndTrigger[] // extra printed end conditions ("until you are dying", "you use this ability again")
  status: 'active' | 'ended'; endedReason?
  registrationIds         // clock work that expires or saves it
  group?                  // shared end, as V153 saveGroup (one save ends the whole printed effect)
}
```

### Durations

Each duration maps to existing clock timing:

| Printed duration | Duration | Clock timing |
| --- | --- | --- |
| (save ends) | `save-ends` | creature-turn turn-end, each (existing) |
| (EoT) | `eot` | end-of-next-turn of the subject (existing) |
| until the end of your next turn | `end-of-next-turn` | end-of-next-turn of the **owner** |
| until the start of your next turn | `start-of-next-turn` | creature-turn turn-start, next, **owner** |
| until the end of their next turn | `end-of-next-turn` | end-of-next-turn of the **subject** |
| until the end of the encounter | `encounter` | combat-end (existing unscheduling becomes expiry) |
| while a performance is active / maintained | `maintained` | ends when the owner stops maintaining (V148 `resource.maintain`) |
| no printed duration | `none` | ends by its own rules (prone: Stand Up) |

Relative anchors ("your", "their") bind to creatures when the effect is applied, as
`docs/table-spec.md` "Game clock and scheduled rules work" already requires.

### Extra end conditions

`endsWhen` holds extra printed end conditions, checked by the engine where observable:
- `owner-dying`: the owner reaches dying (rule/health/dying.md), found by the damage writer.
- `reused`: the owner uses the same ability again.
- `willingly-ended`: an explicit `effect.end` operation (the "no action required" wording).
- `subject-has-no-temporary-stamina`: Iron's stability bonus.

Anything the engine can't observe stays a printed instruction on the instance, ended with
`effect.end`.

### Operations (CLI/API)

- `effect.list [creature]`: active instances with source, duration and payload summary.
- `effect.end instance=… [note]`: ends an instance with a journaled reason. Anyone who could have
  ended it at the table may use it; the Director can always.
- Condition operations keep working. `condition off X` ends every condition instance of X, as today.

### Stacking

The research inventory (`docs/research/table-command-targeting-cases.md`) records non-stacking and
"most recent use determines duration". Rule: a new instance from the **same ability and owner** on
the same subject replaces the old one. Different sources stack unless a source rule says otherwise
(for example the taunted replacement, which already exists). This is labelled as an interpretation
in the first slice, citing the passages.

## 2. Modifier pipeline

A `modifier` payload is `{ target: 'rolls-by' | 'rolls-against' | 'strikes-by' | …, edges?, banes?,
bonus?, stat?: 'speed' | 'stability' | 'saving-throw' | 'potency-resistance' | …, amount? }`.

- **Rolls.** `ability.use` collects every active modifier affecting the actor's roll or a target's
  roll against, and adds them to the per-target inputs the resolver already accepts: edges, banes
  and `bonuses`. The table's manual edge/bane entries are added on top. The result records which
  instances contributed, so a correction or undo can show and reverse them.
- **Derived values** (speed, stability, saving throw bonus) are computed where the engine uses them:
  forced-movement allowance uses stability, and the save uses the saving throw bonus. They are shown
  on the sheet as "base + effects".
- **Double edge and bane caps** apply after all sources are summed (existing `resolveEdgeBane`).

## 3. Watchers

A `watcher` payload is `{ event, filter, response }`. Events come from places the engine already
writes:

| Event | Observed at |
| --- | --- |
| `damage-taken` / `damage-dealt` | `writeDamage` (the V142 observer) |
| `strike-made` / `ability-used` | `ability.use` commit |
| `turn-start` / `turn-end` of a creature | clock boundaries |
| `made-winded` / `dying` / `killed` | the damage writer (V149) |
| `forced-movement` | forced-movement instructions (no map: only the instruction, not the path) |
| `saving-throw` | save work |

Responses:
- a **gain** (surges, temporary Stamina, a resource via the V120 claim path);
- **damage** (a fixed amount, applied through `writeDamage`);
- a **condition**;
- an **instruction** (table work);
- or a **reaction offer** (section 4).

Limits ("the first time on a turn", "once per round") reuse V120's per-turn and per-round
limit records. Movement-based watchers ("whenever the target moves") stay instructions, because
there is no map.

## 4. Triggered actions and reactions

A triggered ability ("Triggered" or "Free triggered" with a Trigger section) compiles when its
trigger is an observable event and its effect is compiled.

- **Offer.** When the event happens, the engine checks eligibility: the owner can act, hasn't used
  their triggered action this round, can afford the cost, and the trigger filter matches. It then
  adds a **response card** to the triggering log entry. The spec already designs this card in
  `docs/table-spec.md` "Inline interaction cards in the game log", with its window until the next
  turn start, pass, and early close.
- **Distance.** Distance and line of effect aren't known without a map. The card says "within N
  squares: the table confirms", and accepting it is the confirmation.
- **Who uses it.** The owning player, or the Director for them (ruling 4).
- **Damage-changing responses** ("take half the damage", Parry) use option B (ruling 3):
  - accepting revises the hit through the correction machinery;
  - Stamina is recomputed;
  - no-longer-true consequences are reversed (winded, dying, resource gains);
  - a gain already spent stands, with a log note.
- **Unobservable triggers** ("the target moves", "an ally uses an ability of yours") get a manual
  "use triggered action" on the actor's action list, with the trigger text shown. It works the same
  way once invoked.

## 5. Marks and similar statuses

A mark (Tactician) or judgment (Censor) is an effect instance with kind `mark`, an owner and a
subject.
- **Default:** one mark relation per owner and subject.
- **"Until you use this ability again":** handled by `endsWhen: reused`.
- **Mark benefits:** watchers on the owner, such as "whenever you or any ally deals damage to a
  target marked by you…".
- **Open questions:**
  - Does a new mark end older ones?
  - Can objects be marked?
  - Can players see marks on foes?

## 6. Areas and auras

There is no map, so the engine can't know who is "in the area". An aura or area effect is an
instance with a membership list:
- the table sets the list at use time, with the existing target selection;
- `effect.members add/remove` edits it later;
- effects "for each creature in the area" apply to the members.

This keeps the rules automatic while the table owns geometry.

## 7. History and corrections

- Every instance write goes through the journal, so undo and redo restore them exactly.
- A correction that changes a use's tier re-derives the instances it created, as conditions do now.
- The modifier pipeline records contributions per roll. Correcting or undoing an effect never
  silently re-rolls anything: later rolls that used its modifier are flagged for the table, as V142
  reconciliation does.

## 8. Delivery plan

Each slice below gets its own review, TESTER gate and QC1, as usual.

1. **Effect instances and durations:**
   - generalize condition instances;
   - the new durations and `endsWhen`;
   - `effect.list` and `effect.end`;
   - a sheet/table list of active effects (minimal UI).
2. **Modifiers:** the roll pipeline and derived values. This unlocks the "+N bonus", "edge/bane"
   and "speed/stability" effects (about 30).
3. **Watchers and limits:** the gain, damage, condition and instruction responses. This unlocks the
   "whenever …" and "at the start/end of each turn" effects (about 29).
4. **Triggered actions:** offers on observable triggers, and manual invocation for the rest.
5. **Damage-changing reactions:** option B revision.
6. **Marks and judgments,** then auras with membership lists.

The per-class sweeps afterwards reuse these mechanisms ability by ability.

## Questions for the user

These are the decisions this design needs from you. Each has a recommendation.

1. **Marks:**
   - Does a new mark from the same Tactician end their earlier mark? Recommended: follow each
     ability's text, and where it is silent, a new mark by the same owner ends the old one.
   - Can players see marks on foes? Recommended: yes, marks are table knowledge.
2. **Area membership:** is it acceptable that the table picks who is in an area and updates the
   list when creatures move, since the app has no map? Recommended: yes.
3. **Active-effects display:** is a simple list per creature (source, duration, end button) enough
   for V1, with polish later? Recommended: yes.
