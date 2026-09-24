# Automation rulings for lasting effects and reactions: confirmed 2026-09-24

The user made these rulings in the ENGINE2 thread on 2026-09-24. They were made while planning
automation for abilities without a power roll, lasting effects, watchers and triggered actions.
**Automation is the goal.** Earlier restrictions written for the free alpha are removed where they
conflict with these rulings.

## 1. Lasting effects and modifiers may be automated

Tracked effects and conditions may feed their bonuses, edges, banes, speed, stability and similar
modifiers into later rolls and derived values automatically. This supersedes, for V1:
- the v0.01 manual edge/bane contract (`docs/table-spec.md`, "v0.01 edge and bane inputs": the
  table supplies applicability);
- the Defend and Aid Attack "no automatic detection" limit.

Manual entry stays available as an override.

## 2. Effects that watch for later triggers may compile

The coverage boundary in [the coverage decision](2026-09-24-compiled-effect-coverage.md) is
widened. A lasting effect that needs the engine to notice a later trigger (damage dealt, a strike,
an ability use, a turn boundary) may compile once the engine tracks that trigger. Triggers the app
cannot observe stay table work. Movement is the main one, because there is no map.

## 3. Damage-changing responses revise the hit (option B)

A triggered response that changes damage already applied, such as "take half the damage", Parry or
Repel, works as follows:
- **Play is not interrupted.** The hit applies at once. The response card is offered on the log
  entry during the existing response window (`docs/table-spec.md`, "Inline interaction cards in the
  game log").
- **Accepting the response revises the hit, like a correction.** Stamina is recomputed, and
  consequences that are no longer true are reversed: winded, dying, the death threshold, and
  resource gains that the revised damage no longer earns. Consequences that are still true stand.
- **A gain already spent stands, and the log records that.** If a reversed gain was spent before the
  response, it is not clawed back. The Director can rewind to the hit if they disagree.

This settles finding F3 of `docs/v0.01-readiness-audit.md`. The user considered holding the hit
until every response is decided (option A) and rejected it, because it needs a blocking paused state
at the table. Revising Stamina only (option C) gives outcomes that are wrong by the rules, such as a
winded-triggered gain for a hit that never made anyone winded.

## 4. Who uses a triggered action

The player who controls the character with the triggered action uses it. By the app-wide doctrine
the Director can act for any player, so in effect either can.

## 5. Q-COND-1: "prone and can't stand"

A successful save (or the end of an EoT duration) ends the restriction on standing. It does not make
the creature stand up: the creature stays prone until it uses Stand Up. The table can still end prone
manually. This is backed by `condition/prone.md`, `feature/common/maneuvers/stand-up.md`, and stat
blocks that print prone and "can't stand" separately (for example
`monster/giant/statblock/hill-giant-clobberer.md`). The ruling applies to "prone and can't stand"
effects and their split printings only.
