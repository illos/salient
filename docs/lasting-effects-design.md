# Lasting effects, watchers and reactions: engine design

Status: proposal by ENGINE2, 2026-09-24, revised after QC1's review
(`../review-artifacts/2026-09-24-lasting-effects-design-QC1.md`, R1–R5 and the missing decisions). It builds pieces 4–6 of the automation
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

"Until the end of your next turn" follows the user's ruling on Q-EFFECT-1 (B, 2026-09-24,
`docs/rules-questions-for-user.md`): used on the owner's own turn, it lasts through the owner's
following turn, so the clock skips the end of the turn it was applied in; used off the owner's turn,
it ends at the end of the owner's next turn. "(EoT)" and "their next turn" keep the first end of the
subject's turn after application (rule/combat/end-of-turn.md). Outside combat none of these is
scheduled; the table ends them with `effect.end`.

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

### Stacking (printed rule)

Pinned `en/books/heroes/clean/Draw Steel Heroes.md`, "Stacking Unique Effects", governs this. It is
printed footing, not an interpretation:
- **Different abilities combine** when their durations and targets overlap.
- **The same ability used several times doesn't stack, whoever used it.** The most impactful effect
  from any use applies, such as the highest bonus, and the most recent use sets the duration. For
  example, two Nulls' Null Fields reduce a cultist's potency by 1, not 2.
- **The same condition from different effects is imposed once.** Weakened twice is still one bane.
  A grabbed creature can't be grabbed again by another enemy. Non-condition effects work the same
  way: a recovery value halved twice is halved once.

The engine therefore keeps **stored source instances** separate from the **effective aggregate**:
- Every use stores its own instance, with its own source, owner, payload and duration, and history
  keeps them all.
- The aggregate is computed per subject:
  - group by ability identity, across owners;
  - within a group, take the most impactful payload and the duration of the most recent instance;
  - across groups, combine;
  - a condition or a named non-condition consequence (halved recovery value, and so on) counts once,
    however many instances impose it.
- Examples the tests pin down:
  - two owners' Null Fields give −1;
  - an old +3 bonus with a newer +1 from the same ability gives +3, lasting as long as the newer
    use;
  - weakened from two sources gives one bane.
- A source rule that says otherwise, such as the taunt replacement or the Mark rules in section 5,
  is an explicit exception on that source. It is not a general default.

## 2. Modifier pipeline

A `modifier` payload is `{ target: 'rolls-by' | 'rolls-against' | 'strikes-by' | …, edges?, banes?,
bonus?, stat?: 'speed' | 'stability' | 'saving-throw' | 'potency-resistance' | …, amount? }`.

- **Rolls.** `ability.use` collects the effective aggregate of every active modifier affecting the
  actor's roll or a target's roll against. The inputs keep two things apart:
  - `circumstance` edges and banes that the table adds for situations the engine can't see. These
    are additive, as today's inputs are.
  - `exclude: [instanceId…]`, the table's override. It rejects an automatic contribution that
    doesn't apply here, such as a stale effect or one needing line of effect that the table says is
    blocked. The table never has to invent an opposite bane.
- **Recording.** The saved roll records every contribution it applied and every exclusion. A
  correction recomputes from those saved inputs, so a known edge isn't counted twice and an
  excluded one stays excluded.
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
| `force-move-attempted` | a forced-movement node or ability use that *tries* to move a creature (Lines of Force's "would be force moved") |
| `force-moved` (actual) | only a **confirmed movement fact** that the table enters: who moved, squares moved and the kind of movement |
| `saving-throw` | save work |

Responses:
- a **gain** (surges, temporary Stamina, a resource via the V120 claim path);
- **damage** (a fixed amount, applied through `writeDamage`);
- a **condition**;
- an **instruction** (table work);
- or a **reaction offer** (section 4).

Limits ("the first time on a turn", "once per round") reuse V120's per-turn and per-round
limit records.

**Movement.** A forced-movement instruction is only an allowance. It can be declined, blocked or
resolved as zero squares, and neither the allowance nor a "resolved at table" disposition proves
that anything moved (QC1 R2; automation rulings section 2). So:
- watchers on an *attempt* fire from the attempt;
- watchers on *actual* movement ("for each square you push the target", "whenever the target moves
  or is force moved") fire only from a movement fact the table confirms, with the fields the source
  needs, such as the number of squares;
- without that fact they stay instructions.

## 4. Triggered actions and reactions

A triggered ability ("Triggered" or "Free triggered" with a Trigger section) compiles when its
trigger is an observable event and its effect is compiled.

- **Offer.** When the event happens, the engine checks eligibility and adds a **response card** to
  the triggering log entry. The spec already designs this card in `docs/table-spec.md` "Inline
  interaction cards in the game log", with its window until the next turn start, pass, and early
  close. Eligibility (rule/combat/triggered-action.md):
  - **Triggered actions:** one per round. The owner must not have used their ordinary triggered
    action this round.
  - **Free triggered actions:** don't count against that limit and don't need it. They are subject
    only to their own source limits, such as "once per round" or the Mark's "one benefit from the
    same trigger".
  - Any effect that prevents triggered actions prevents both kinds.
  - Cost and eligibility are **checked again when the card is accepted**, not only when it's
    offered.
- **Order.** When several responses answer one trigger, the players decide the order among their own
  responses first, then the Director orders theirs (rule/combat/triggered-action.md). Offer arrival
  order never decides it. Test cases:
  - an ordinary triggered action already used, then a legal free response;
  - two competing ordinary offers to the same owner;
  - a prevention effect that suppresses both kinds.
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

The base Mark's lifecycle is printed in `feature/ability/tactician/level-1/mark.md` and is encoded as
written:
- It targets **one creature**, not an object, until the end of the encounter, until you are dying,
  or until you use Mark again (`endsWhen: owner-dying, reused`).
- You can end it willingly (no action required).
- **If another Tactician marks the creature, your mark on it ends.** This is a source exception to
  stacking.
- **When a marked creature is reduced to 0 Stamina,** you may use a free triggered action to mark a
  new target.
- **Benefits:**
  - an edge on power rolls against the marked creature, for you and allies, while it is within
    your line of effect;
  - on rolled damage to it, spend 1 focus for one benefit as a free triggered action;
  - "You can't gain more than one benefit from the same trigger."
- **Other abilities that add marks** (Fog of War, Targets of Opportunity, and so on) are handled per
  source.
- Judgment (Censor) is **not** assumed to share these rules; it gets its own reading.
- **Line of effect has no map.** The Mark edge needs **both** relationships: the marked creature
  within the Tactician's line of effect, **and** the creature rolling (the Tactician or an ally)
  within the Tactician's line of effect ("you and allies within your line of effect", mark.md).
  - The engine offers the edge on the roll as an automatic contribution labelled with both
    conditions.
  - The table rejects it with `exclude` (section 2) when either fails. Example: the Tactician sees
    the marked foe and the ally sees the foe, but the Tactician can't see the ally. That ally gets no
    Mark edge.
  - The per-damage benefit is a free-triggered response card.

Product question: can players see marks on foes? (Recommended: yes.)

## 5a. Consumable "next" effects

Some effects are used up by the next qualifying event rather than lasting for a time. For example:
- "the next ability roll you make this turn automatically obtains a tier 3 outcome"
  (`fury/level-1/make-peace-with-your-god.md`);
- "they have a double edge on the next power roll they make" (`talent/level-1/perfect-clarity.md`);
- "The next ability roll an ally makes against the target before the start of your next turn gains
  an edge" (`talent/level-1/remote-assistance.md`);
- "the target takes a bane on their next power roll" (Wither's tier text).

Consumable parts are **separate components** from any lasting parts of the same effect:
- One use creates **sibling instances** that share source provenance (use event, owner, clause).
- Each sibling has its own lifetime: a lasting duration, or `consumeOn` plus its printed expiry.
- Consuming one sibling never ends another.

**Consumption:**
- The first roll that matches a consumable's filter (by whom, against whom, what kind) **consumes
  it**. Its status becomes `consumed`, with the roll's event id recorded.
- A qualifying roll consumes it **even if banes cancel its numerical benefit**. "The next power
  roll" means the next power roll, not the next roll it actually helps (perfect-clarity.md;
  rule/dice/power-roll.md, "Rolling With Edges and Banes").

**History:**
- Undo of that roll restores the component through the journal.
- A correction that removes the roll's eligibility reports the component as "would not have been
  consumed", as V156 reports a cost change. It never silently consumes again.

**Roll-outcome watchers.** A consumable can carry one, such as "If the target obtains a tier 3
outcome on that roll, you gain 1 clarity". It fires from the same roll that consumes the component,
and a correction that changes the tier re-evaluates it through the V142 reconciliation path.

**Acceptance case: Perfect Clarity** (`talent/level-1/perfect-clarity.md`, on an ally). It creates
three siblings:
1. +3 speed, lasting until the start of the **caster's** next turn;
2. a double edge, consumed by the **ally's** next power roll;
3. a watcher on that roll: tier 3 gives the caster 1 clarity.

The ally's next power roll, made with two banes, consumes the double edge and gives no net edge.
The speed bonus remains until the caster's next turn starts. The clarity watcher resolves from that
roll's actual tier. Undo of the roll restores the double edge and withdraws any clarity it gave.

## 5b. Response revision accounting (ruling 3, option B)

- **Links.** Each hit keeps a revision chain: the original application, then each accepted response
  as a linked revision. Every gain, condition and watcher firing caused by the hit is linked to the
  revision that caused it, reusing V142's `resource.triggered` consequence links.
- **Recompute.** Accepting a response recomputes from the **current accepted revision**, not the
  original. A second response never re-applies damage or gains that the first already adjusted.
- **Reversal.** A consequence that is no longer true is reversed. If a linked gain was partly or
  wholly spent before the revision, the spent part stands, as ruled, and the log records how much.
  The unspent part is reversed.
- **Attribution.** Which spend used "this" gain is ambiguous when a pool holds gains from several
  sources. The proposal counts the most recent gains as spent first. This is surfaced for review as
  an open accounting choice, not a rules claim.

## 6. Areas and auras

There is no map, so the engine can't know who is "in the area". An aura or area effect is an
instance with a membership list:
- the table sets the list at use time, with the existing target selection;
- `effect.members add/remove` edits it later;
- effects "for each creature in the area" apply to the members.

User rulings, 2026-09-25 (`decisions/2026-09-24-automation-rulings.md`, section 6):
- **Membership is table-picked.** There is no map. The table picks who is in an area or aura at use
  time with the existing target selection, and edits the list later as creatures move.
- **Adding a member means they entered.** In the user's words: "just make adding a new member to the
  effect an explicit enter, and have the riders trigger. If the players screwed up and forgot to
  enter someone, the director can manually remove the effects they didn't want."
  - `effect.members add` is an "enters the area" event. Enter riders fire then, within their
    printed limit ("for the first time in a combat round": a V120 per-round limit record per
    creature).
  - There is no "list fix" flag and no separate movement confirmation.
  - `effect.members remove` is leaving: the member's riders end.
  - Undo of an add reverses it and whatever it set off, through the journal as usual.

So:
- Every change is journaled with who made it, so corrections and undo keep the history.
- Geometry, distance, line of effect, the size of the area and moving it remain table facts. An
  ability that moves or enlarges an area changes nothing the engine computes; the table edits the
  members.

V200 (`build/V200-areas-and-auras.md`) builds this: an `area` instance held by the user, with its
members, and each printed rider stored as a watcher on each member it applies to.

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

1. **Mark visibility:** can players see marks on foes? Recommended: yes, marks are table knowledge.
   The Mark lifecycle itself is printed, so it isn't a question.
2. **Area membership:** is it acceptable that the table picks who is in an area and updates the
   list as creatures move, since the app has no map? Recommended: yes. **Answered yes, 2026-09-25**,
   with adding a member counting as entering the area (section 6).
3. **Active-effects display:** is a simple list per creature (source, duration, end button) enough
   for V1, with polish later? Recommended: yes.
