# Essence of Tides: saving against an effect imposed at turn end

Research date: 2026-09-12. Only the pinned local Steel Compendium was consulted, at revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. Evidence below is core *Heroes* and *Monsters*;
retainer examples are core textual comparisons, not a proposal to implement playable retainers.

## Finding

**Allowing the first save at the same turn end is the better-supported interpretation, but the inspected
Compendium does not explicitly settle this exact timing collision.** The general rule says an affected
creature saves at the end of **each** of its turns, with no requirement to have suffered the effect for a
full turn or to wait for its next turn. Convocation of Waves imposes slowed when the creature ends its
turn in the stream, with no exception delaying its first save.[^save][^tides]

That reading fits the app's separately accepted policy of resolving non-save boundary work before
save-ends rolls. It still requires one additional interpretation: effects imposed during that boundary
are included in its subsequent save processing. Queue order alone does not decide whether eligible
effects were collected before or after the stream applies slowed. This report recommends including the
new effect; it does not label that collection policy an explicit published rule.

Confidence is high in the cited wording and the distinction between exposure and duration, moderate in
the immediate-save interpretation, and limited as to proving absence of a clarification. This is a
targeted search of the pinned corpus, not a claim about any other publication or revision.

## Exact source and general context

Convocation of Waves is a maneuver targeting self or one elemental at ranged 5. Its ordinary effect
grants cold immunity 5 until the essence's next turn starts. The 3 Malice rider creates an encounter-long
pool/stream of difficult terrain. The decisive sentence reads:

> Any enemy who ends their turn in the stream and has M < 2 is slowed (save ends).

That sentence is the same in the book-specific Monsters Markdown and the unified entry.[^tides]
It does not say “starts and ends,” “remains,” “next turn,” or “while in the stream.” The cold immunity,
terrain, and slowed condition have their own stated durations; do not apply the immunity's duration
to the stream or to slowed.

The general saving-throw rule says a creature suffering a save-ends effect makes a saving throw at the
end of each of its turns. The save is d10, succeeding on 6 or higher before applicable exceptions.
On failure the effect continues.[^save] The rule does not specify a minimum duration before the first
attempt and does not provide a same-boundary collection/order rule.

The sourcebook's *Ending Effects* section says the imposing ability, feature, hazard, or other mechanic
specifies duration. Immediately after that introduction, the clean Heroes source presents **End of Next
Turn (EoT)** and then **Saving Throw (Save Ends)**. The EoT paragraph explicitly includes the current turn
when an EoT effect was imposed on that turn.[^ending][^eot] This corroborates that being imposed during
one's own turn does not inherently guarantee a whole subsequent turn of duration. It is an analogy,
not permission to substitute EoT rules for save-ends rules, and it does not explain a newly imposed
effect during the end-turn boundary itself.

## Closely matching effects

The broader search found this pattern in both books; it is not unique to the essence.

| Core source | Relevant behavior | What it establishes |
| --- | --- | --- |
| Elementalist, **Web of All That's Come Before** | The area is difficult terrain until the caster's next turn starts; each enemy ending its turn there is restrained (save ends).[^web] | Exact hero-side analogue for imposing a save-ends condition at the recipient's turn end. No first-save delay is stated. The ability also has initial roll effects, so distinguish that initial restraint from later area exposure. |
| Rival Elementalist, **The World Consumes** | Enemies have acid weakness and are slowed while in the area. A qualifying enemy ending its turn there is restrained (save ends).[^rival] | Explicit contrast within one ability between a location-dependent ongoing effect and a separately imposed save-ends condition. No first-save timing instruction. |
| Ajax, **Nexus Jewel — Swamp** | A creature that starts and ends its turn in the same space becomes restrained (save ends).[^ajax] | Shows an explicit start-and-end requirement when the author wants one. Tides has no such requirement. Still no same-boundary save sequence. |
| Hexer retainer, **Take Root** | A target slowed by this ability that ends its turn without moving stops being slowed and becomes restrained (save ends).[^hexer] | Replacement with a new save-ends condition at turn end is another real case. A stale list of pre-boundary conditions could wrongly save against slowed after it has been replaced. The text does not expressly order the ordinary save relative to replacement. |
| Devil Defector retainer, **Hell On Earth** | A qualifying enemy ending its turn in the area takes damage and becomes frightened (save ends).[^defector] | Another area-triggered application at the recipient's turn end, without a first-save delay. |

These parallels strengthen the need for a consistent interpretation. Repetition of the same unspecified
timing does not, by itself, resolve it.

## Exceptions and counterarguments checked

- **Lightbender — Avoidance** explicitly replaces save-ends removal with automatic ending at the end of
  its next turn.[^lightbender] This is special text, not the ordinary saving rule. It demonstrates that
  alternative timing/removal can be written explicitly, but does not decide how its own “next turn”
  wording interacts with every boundary case.
- **High Elf Orbweaver — Otherworldly Grace** chooses a qualifying effect at turn start, and that effect
  ends at turn end instead.[^orbweaver] An effect first imposed at turn end could not have been chosen at
  that turn's start. This explicit early selection contrasts with ordinary saves, whose general rule
  contains no start-of-turn snapshot requirement.
- **Improved Implement of Wrath** grants nearby allies saves at the weapon wielder's turn end.[^implement]
  This is an extra, explicitly anchored opportunity; the general save schedule is the affected
  creature's own turns, not all participants' turns or merely a round boundary.
- **Erase** escalates an existing save-ends effect at the end of the first and second affected turns,
  but does not state the save's relative order.[^erase] It therefore repeats an ordering question
  rather than settling the newly imposed effect case.
- The prior ordering research found rules for printed order within an ability and for same-trigger
  triggered actions. Neither specifies when ordinary end-turn saves collect their eligible effects.
  See [the boundary-ordering synthesis](turn-boundary-ordering.md).

The strongest argument for delay is a possible procedural reading: the end-turn event occurs, the
stream then adds a condition, and the newly registered save listener waits for the next occurrence of
that event. That is a plausible software/event model, but no such listener-registration or frozen
eligibility rule was located in the source. Conversely, immediate saving cannot be proved solely by
saying “each turn”: it assumes the ongoing end-turn resolution still provides the relevant save
opportunity after the new condition is applied. The chosen app save-last convention makes that
assumption coherent; it does not retroactively make it printed rules text.

## Exposure and persistence are separate

**Neither reading requires the creature to spend a whole turn or round standing in the stream.**
The ability checks where the creature is when its turn ends. It could enter the stream near the end of
that turn, have been moved there earlier, or have remained there; only the stated ending position and
Might threshold matter to this clause.[^tides]

Once slowed applies, leaving the stream is not a listed removal condition. The effect uses save ends,
not “slowed while in the stream.” Slowed reduces speed to 2 unless it was already lower and prevents
shifting.[^slowed] Those restrictions can affect granted movement outside the creature's ordinary turn
as well as movement on its next turn. The stream remains difficult terrain independently of whether
the creature saves successfully.

An illustrative two-turn trace, assuming no other removal, immunity, or special feature:

1. **Turn A ends:** a qualifying enemy is in the stream and becomes slowed. Under the recommended
   interpretation, it immediately makes the ordinary end-turn save. Success removes this slowed
   effect; failure leaves it active.
2. **Between turns and during Turn B:** if still slowed, the creature suffers slowed's restrictions.
   Moving out of the stream does not itself clear the condition. If it ends Turn B outside the stream,
   there is no new application from the stream, but the surviving effect still gets its ordinary save.
   If it ends Turn B in the stream, the stream's clause applies again, subject to ordinary effect
   stacking/duration rules.[^ending]

Under the delayed-first-save alternative, the only change to this trace is skipping the first save at
Turn A's end. Slowed still applies then, without requiring continued exposure, and persists until
removal. “Wait a whole round” is therefore imprecise: the alternative waits until the affected
creature's next turn end, and initiative choices can change how much play occurs in between.

## Recommended case ruling and implementation implication

For **Convocation of Waves**, resolve the stream exposure, apply slowed when eligible, and include that
effect in the same turn's subsequent save-ends work. If it succeeds, remove the applied slowed effect;
if it fails, it remains. Do not rerun the same stream exposure after that save merely because the
creature is still in the stream: that would turn one end-turn event into an unintended repetition.

This is a researched interpretation recommended for the user's ruling, not a definitive resolution
from explicit source text. A general policy for every newly created boundary effect remains a separate
product choice. Ordinary saves for an effect should not repeat endlessly within a single boundary;
explicit additional save opportunities and effects created by later responses need their own handling.

The app has no map, so whether the creature ended in the stream remains a table-supplied fact. This
research does not authorize automatic spatial inference or movement bookkeeping.

## Accepted case decision

After reviewing these findings on 2026-09-12, the immediate-save interpretation was accepted for
Convocation of Waves. The [table specification](../table-spec.md#game-clock-and-scheduled-rules-work)
owns that product ruling: apply slowed, then include it in the same turn's final save phase. The research
confidence and limits above remain unchanged. In a subsequent explicit decision, the save-eligibility
interpretation became standing app policy: all applicable save-ends effects applied before the final save
phase begins are included, unless the source specifies otherwise. This generalization was expressly
accepted rather than inferred from the case ruling. It does not settle all newly registered clock work,
including effects created during or after the save phase.

## Search coverage and reproducibility

- Read the repository research restriction and Compendium navigation guide; no web, external service,
  Forge Steel rules content, or new source download was used.
- Verified the pinned commit. Searched all 2,611 unified Markdown entries whose frontmatter identified
  core Heroes or Monsters. Stripped SCC link markup when searching paragraph text, since links between
  “their” and “turn” or around “save” otherwise hide important matches. This exposed Web, Take Root,
  and Hell On Earth beyond the initial literal-line search.
- Searched combinations of save ends/saving throw with turn start/end, first/next/current/same turn,
  immediate/before/after/instead, and effect replacement/duration. Read the directly relevant passages
  cited here, checked their source identity, and reviewed general turn, save, condition, stacking,
  expiration and special-removal context. Search matches alone were not treated as resolved evidence.
- Recovered the clean Heroes source at
  `en/books/heroes/clean/Draw Steel Heroes.md` using local `git show`; lines 4374–4396 preserve the
  adjacent duration/save sections and line 8452 the Web analogue. Checked the Monsters book-specific
  Essence entry and Monster Basics/End Effect context. The pinned tree has no clean Monsters source
  matching the Heroes clean-file layout; book-specific extracted entries remain the available context.
- Unified/book-specific Markdown and structured variants represent the same corpus, not independent
  corroboration. No explicit instruction was located either to save immediately against a condition
  first imposed at turn end or to defer that first save until the next turn.

## Sources

[^save]: [Saving Throw (Save Ends)](../../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md), SCC `mcdm.heroes.v1/rule.general/saving-throw`.
[^tides]: [Essence of Tides — Convocation of Waves](../../vendor/steel-compendium/en/unified/md/monster/elemental/statblock/essence-of-tides.md), SCC `mcdm.monsters.v1/monster.elemental.statblock/essence-of-tides`; also local Git path `en/books/monsters/md/monster/elemental/statblock/essence-of-tides.md` at the pinned commit.
[^ending]: [Classes — Stacking Unique Effects and Ending Effects](../../vendor/steel-compendium/en/unified/md/chapter/classes.md#ending-effects), SCC `mcdm.heroes.v1/chapter/classes`.
[^eot]: [End of Next Turn (EoT)](../../vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md), SCC `mcdm.heroes.v1/rule.combat/end-of-turn`.
[^web]: [Web of All That's Come Before](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-5/web-of-all-thats-come-before.md), SCC `mcdm.heroes.v1/feature.ability.elementalist.level-5/web-of-all-thats-come-before`.
[^rival]: [Rival Elementalist — The World Consumes](../../vendor/steel-compendium/en/unified/md/monster/rival/4th-echelon/statblock/rival-elementalist.md), SCC `mcdm.monsters.v1/monster.rival.4th-echelon.statblock/rival-elementalist`.
[^ajax]: [Ajax's Malice — Nexus Jewel](../../vendor/steel-compendium/en/unified/md/monster/ajax-the-invincible/ajaxs-malice.md), SCC `mcdm.monsters.v1/monster.ajax-the-invincible/ajaxs-malice`.
[^hexer]: [Hexer Abilities — Take Root](../../vendor/steel-compendium/en/unified/md/monster/retainer/role-advancement/hexer.md), SCC `mcdm.monsters.v1/monster.retainer.role-advancement/hexer`.
[^defector]: [Devil Defector Advancement Features — Hell On Earth](../../vendor/steel-compendium/en/unified/md/monster/retainer/advancement-features/devil-defector.md), SCC `mcdm.monsters.v1/monster.retainer.advancement-features/devil-defector`.
[^lightbender]: [Lightbender — Avoidance](../../vendor/steel-compendium/en/unified/md/monster/lightbender/statblock/lightbender.md), SCC `mcdm.monsters.v1/monster.lightbender.statblock/lightbender`.
[^orbweaver]: [High Elf Orbweaver — Otherworldly Grace](../../vendor/steel-compendium/en/unified/md/monster/elf-high/statblock/high-elf-orbweaver.md), SCC `mcdm.monsters.v1/monster.elf-high.statblock/high-elf-orbweaver`.
[^implement]: [Improved Implement of Wrath](../../vendor/steel-compendium/en/unified/md/feature/censor/level-9/improved-implement-of-wrath.md), SCC `mcdm.heroes.v1/feature.censor.level-9/improved-implement-of-wrath`.
[^erase]: [Erase](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-3/erase.md), SCC `mcdm.heroes.v1/feature.ability.elementalist.level-3/erase`.
[^slowed]: [Slowed](../../vendor/steel-compendium/en/unified/md/condition/slowed.md), SCC `mcdm.heroes.v1/condition/slowed`.
