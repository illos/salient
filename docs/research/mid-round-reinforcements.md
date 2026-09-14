# Mid-round reinforcements and first-turn timing

Research date: 2026-09-14. Question: Q-R-52. Source: the pinned local Steel Compendium,
`fb83a789da8f0327a389c277a0c790b1648d5810`. A dedicated research subagent checked the general
combat rules, reinforcement guidance and summoning examples. No external rules sources were used.

## Finding

No explicit general rule was found that specifically makes ordinary reinforcements arriving
mid-round act that round or wait until the next. Same-round eligibility is consistent with the
ordinary turn rules. Summoning supplies an explicit, narrower example of acting after arrival.

## Source evidence

- [Combat Round](../../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md), opening
  paragraph: “During a combat round, each creature in the battle takes a turn.” Under **Creatures Take
  Turns**, the prohibition on acting again applies to a creature that has already taken a turn in
  the round; remaining creatures can act after the opposing side has finished. Under **End of Round**,
  the round ends after all creatures have acted. **Interpretation:** a newcomer has not used its
  turn, so a same-round turn fits this structure. Late arrival is not expressly addressed.
- [Monster Basics — Creatures Who Summon](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#creatures-who-summon):
  “Unless otherwise specified, a creature or object summoned into a combat encounter by another
  creature takes their turn immediately after the summoner.” This explicitly supports a same-round
  turn for an on-turn summon. Its immediate-after sequencing belongs to summons, not all additions.
  This passage does not clarify off-turn summoning after the summoner has already acted.
- [Lumbering Egress — Demonic Egress](../../vendor/steel-compendium/en/unified/md/monster/demon/2nd-echelon/statblock/lumbering-egress.md)
  provides a concrete on-turn example: a maneuver produces four demon minions.
- [Monster Basics](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md), **Escort →
  Reinforcements**, places replacements at round start. **Hold Them Off → Reinforcements** places
  newcomers at round end. These are arrival schedules for particular encounter structures; neither
  establishes a general delay for a creature that has already arrived mid-round. **Utilize
  Reinforcements** recommends new waves without giving an additional turn-delay rule.

## Confirmed app behavior

The [table specification](../table-spec.md#mid-combat-additions-and-regrouping) already recorded the
same-round unused-turn decision on 2026-09-12. The user reaffirmed it during Q-R-52 on 2026-09-14,
and requested this independent rules lookup. The question queue and R05 contract had incorrectly
continued to label the app choice provisional.

Ordinary newly added foes receive an unused turn in the current round, in a new group at the bottom
of the roster. Existing side/group scheduling still applies; arrival does not interrupt the current
turn. Preserve source-specific timing, including the summon rule above, when those mechanics are
supported. Regrouping an existing creature does not grant it a fresh turn.

This is a confirmed app choice consistent with the general rules, not a claim that the source
explicitly states a universal mid-round reinforcement rule. Research does not certify implementation
or add summoning automation to v0.01.
