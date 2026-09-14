# Ally response after dependent resource spending

Research date: 2026-09-13. Sources: pinned local Steel Compendium,
`fb83a789da8f0327a389c277a0c790b1648d5810`. This is a source-backed scenario for the app's
apply-then-revise convention, not a claim that the rulebook permits postponing a trigger until after
unrelated play. No source or implementation changes.

## Concrete case

During Thorn's own turn, an enemy's opportunity attack deals damage. Thorn becomes winded for the first
time this encounter and gains Ferocity. Before a nearby allied Tactician uses Parry on that damage,
Thorn commits a main-action heroic ability that needs the newly granted Ferocity. The ally has committed
no intervening unrelated ability and no new individual turn has started.

- [Opportunity Attacks](../../vendor/steel-compendium/en/unified/md/rule/combat/opportunity-attack.md)
  permits the enemy's melee free strike during Thorn's willing movement. This supplies a concrete
  on-Thorn's-turn source of damage; no unsupported ordinary main action on an enemy's turn is assumed.
- [Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md)
  grants 1 on the round's first damage and 1d3 on the encounter's first winded/dying event.
- [Winded](../../vendor/steel-compendium/en/unified/md/rule/health/winded.md)
  includes current Stamina at or below half maximum.
- [Parry](../../vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-1/parry.md)
  can halve damage to an ally if its positioning requirements are met. Assume those facts are satisfied.
- [Out of the Way!](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/out-of-the-way.md)
  is a main action costing 3 Ferocity, providing an example of the subsequent legal spend.

Illustrative values, not a prescribed character build: maximum Stamina 40, current 26. Damage 10
reduces Thorn to 16, below the winded threshold 20. Parry reduces that hit to 5, leaving 21, so the
winded grant would not occur. If Thorn had 1 Ferocity before the hit, the first-damage grant adds 1 and
a winded roll of 1 adds another: 3 total, enough for the subsequent ability. Removing the winded grant
after that spend leaves the original ability without sufficient payment. The first-damage grant itself
remains justified and must not be removed.

## Earlier analysis — superseded by the user clarification

The confirmed early-close convention closes the acting character's earlier unused optional triggers.
Thorn's new ability therefore closes his own old opportunities, but the spec explicitly preserves other
characters' responses. The ally's Parry can remain offered. The next-turn cutoff has not occurred.
Precise grant-stage bookkeeping exposes the dependency but does not choose how the app handles the late
response. Ordinary corrections require sequential rewind; valid triggered continuations have deliberately
been kept distinct from ordinary corrections, so extending that restriction here requires a ruling.

Earlier recommendation, not adopted: once a subsequent committed action depends on the result that a late response
would invalidate, require sequential undo of the intervening gameplay chain before accepting that response.
Do not silently erase the later action, manufacture Ferocity debt, or hold every original hit for responses.
Restore/revalidate the opportunity under existing history rules after rewind. Player versus Director undo
follows the already-settled authority/seam rules. The question is the response's dependency boundary.

## User clarification: already covered by precedent

The user states that Thorn taking the damage opens the ally's Parry option in the game log. Thorn
then taking another action or spending those resources closes that window, even though the responding
character belongs to another player. The earlier research's reading that the ally's prompt remained
open was an incorrect interpretation of the product precedent, not a newly discovered rules ambiguity.
The source facts above remain useful, but the proposed special dependency boundary is not needed.
Apply the ordinary event-linked cutoff and existing undo/restoration contracts. Do not permit a stale
Parry reply to reverse a grant after Thorn has already moved past that hit's response window.
