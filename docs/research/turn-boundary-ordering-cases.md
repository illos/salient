# Turn-boundary ordering: concrete core cases

Research date: 2026-09-12. Source: only the local Steel Compendium pinned at
`fb83a789da8f0327a389c277a0c790b1648d5810`. This is an independent supporting
investigation of content examples, not a product ruling or implementation contract.
No online or external Draw Steel sources were used. Vendor files and pin are unchanged.

## Finding

The inspected core content supplies **specific ordering rules and genuine competing
boundary work**, but this pass did not find a universal rule ordering all turn-end,
turn-start, round-end, and round-start effects. That is a bounded negative result,
not proof that no such rule exists anywhere in the game.

Two explicit rules must not be generalized beyond their stated scope:

- An ability's multiple effects resolve in their presented order. That does not itself
  order unrelated, previously registered effects at a later boundary.
- Multiple triggered actions responding to one trigger are ordered by the players for
  their creatures, then by the Director for theirs. Expiry, ordinary saves, and traits
  are not automatically triggered actions merely because software handles them as events.

The most useful concrete unresolved cases are **wet versus its end-of-turn save**,
**a save-ends effect first imposed at turn end**, and **a monster's optional End Effect
versus its normal save**. These do not require inventing an unnamed damage/protection pair.

## Cases

### 1. Wet can cause a fall at the same boundary as its save

[Angulotls — Wet](../../vendor/steel-compendium/en/unified/md/monster/group/angulotl.md)
(`mcdm.monsters.v1/monster.group/angulotl`) says a non-angulotl who is wet and ends
their turn with no movement remaining slips and falls prone.
[Angulotl Slink — Tonguelash](../../vendor/steel-compendium/en/unified/md/monster/angulotl/statblock/angulotl-slink.md)
(`mcdm.monsters.v1/monster.angulotl.statblock/angulotl-slink`) expressly imposes:
“The target is wet (save ends).”

**Explicit:** Both the fall condition and the ordinary save refer to the affected
creature's turn end. Wet's movement fact must be supplied by the table in a client
that does not track movement; absence of tracked movement is not evidence of exhaustion.

**Unresolved:** The inspected wording does not say whether a successful save can
prevent the same boundary's fall, or whether qualification for the fall was already
fixed when the creature ended its turn. This is a real source interaction, not an
established ruling that either result is correct.

### 2. A new save-ends effect can be imposed at turn end

[Essence of Tides — Convocation of Waves, 3 Malice rider](../../vendor/steel-compendium/en/unified/md/monster/elemental/statblock/essence-of-tides.md)
(`mcdm.monsters.v1/monster.elemental.statblock/essence-of-tides`) creates a persistent
stream. An enemy ending their turn in it with Might below 2 becomes slowed (save ends).

**Explicit:** The effect is first applied at the enemy's own turn end.

**Unresolved:** Does that creature immediately make a save at that same boundary?
The general save rule says the end of each turn but the inspected entries do not
provide an explicit new-effect cutoff or ordering policy. A scheduler that gathers
all due work only once versus one that also processes newly registered work can give
different answers; neither algorithm is established by these texts alone.

### 3. End Effect is optional work alongside a normal save

[Human Bandit Chief — End Effect](../../vendor/steel-compendium/en/unified/md/monster/human/statblock/human-bandit-chief.md)
(`mcdm.monsters.v1/monster.human.statblock/human-bandit-chief`) permits taking 5 damage
at each own turn end to end one save-ends effect. The damage cannot be reduced.
The general [End Effect entry](../../vendor/steel-compendium/en/unified/md/rule/monster/end-effect.md)
(`mcdm.monsters.v1/rule.monster/end-effect`) confirms the damage-for-removal mechanism.

**Explicit:** This is a choice, not compulsory damage and not a replacement specified
for every saving throw.

**Unresolved:** No before/after instruction relative to the normal save was found in
these entries. Automatically charging the damage before offering or making a save
would silently select an order and make an optional decision.

### 4. Otherworldly Grace replaces future save work

[High Elf Zephyr — Otherworldly Grace](../../vendor/steel-compendium/en/unified/md/monster/elf-high/statblock/high-elf-zephyr.md)
(`mcdm.monsters.v1/monster.elf-high.statblock/high-elf-zephyr`) allows selecting one
save-ends effect at turn start. “That effect instead ends at the end of their turn.”

**Explicit:** Start-turn choice changes an effect's later ending rule. The selected
effect persists through the turn; this is not immediate removal.

**Implication:** Registered work needs replacement or cancellation, not merely a
fixed save callback that remains after the source has changed its duration.
This local replacement does not establish a general order among other end-turn effects.

### 5. Lightbender uses automatic expiry instead of saves

[Lightbender — Avoidance](../../vendor/steel-compendium/en/unified/md/monster/lightbender/statblock/lightbender.md)
(`mcdm.monsters.v1/monster.lightbender.statblock/lightbender`) says effects that would
end by saving throw instead end automatically at the end of the creature's next turn.

**Explicit:** A source exception changes the normal save mechanism. A generic
“save ends always rolls automatically” handler must first honor the creature's trait.

**Unresolved:** This says nothing about where that expiry falls relative to unrelated
work due at the same turn end.

### 6. Conduit Piety explicitly places a choice before the roll

[Piety](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/piety.md)
(`mcdm.heroes.v1/feature.conduit.level-1/piety`) grants 1d3 piety at the start of each
of the conduit's own combat turns and permits prayer **before** that roll. Prayer changes the possible
resource gain and can cause irreducible psychic damage or allow a chosen domain effect.

**Explicit:** The optional prayer decision precedes the roll; the roll determines
which further results are available. This is clear local ordering, not ambiguity.

**Implication:** Automatic clock work cannot always immediately roll every resource
grant and offer optional choices afterward. Some source choices precede dice.

### 7. Stand Fast! is an optional start-turn cost and effect choice

[Stand Fast!](../../vendor/steel-compendium/en/unified/md/feature/censor/level-5/stand-fast.md)
(`mcdm.heroes.v1/feature.censor.level-5/stand-fast`) permits spending 1d6 Stamina at
own turn start to end one save-ends or end-of-turn effect. Nearby allies gain the same
opportunity on their own turn starts.

**Explicit:** This is voluntary Stamina expenditure, with selection of an effect.
It is not a saving throw and it is not ordinary damage.

**Unresolved:** The entry does not order this decision against other independently
applicable start-turn work. A combination with another start-turn effect would need
its actual sources inspected, rather than assuming all removals happen first.

### 8. Malice has distinct round-grant and turn-spend boundaries

[Malice](../../vendor/steel-compendium/en/unified/md/rule/monster/malice.md)
(`mcdm.monsters.v1/rule.monster/malice`) distinguishes combat-start Malice from the
additional grant at the start of each combat round. Basic Malice features can be
activated at the start of any monster's turn.

**Explicit:** Malicious Strike also says it cannot be used in two consecutive rounds,
even by different monsters. This is more than resetting a boolean every round.

**Implication:** Preserve round identity/history and the scope of each restriction.
The source distinguishes the boundaries but does not supply a total ordering among
all possible effects within either boundary.

### 9. An expiring area can itself have round-end consequences

[Count Rhodar von Glauer — Vengeance of Rhöl](../../vendor/steel-compendium/en/unified/md/monster/count-rhodar-von-glauer/statblock/count-rhodar-von-glauer.md)
(`mcdm.monsters.v1/monster.count-rhodar-von-glauer.statblock/count-rhodar-von-glauer`)
creates spirit areas lasting to round end. The areas cause corruption damage on
specified entry/start-turn events. At round end the spirits disperse and qualifying
nearby enemies become weakened (save ends).

**Explicit:** Duration expiry does not mean the area has no final work. Its departure
has its own effect, with a different affected area and potency requirement.

**Implication:** Removing every expired object before evaluating all due consequences
could erase information needed to resolve this ability. Preserve the expiring area's
geometry/context through its final effect. This is not proof of universal “effects
before expiry” ordering across unrelated abilities.

### 10. Ordinary repeated damage may refer to the source's turn

[Your Entrails Are Your Extrails!](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/your-entrails-are-your-extrails.md)
(`mcdm.heroes.v1/feature.ability.fury.level-1/your-entrails-are-your-extrails`) imposes
bleeding (save ends), with additional damage while bleeding this way at the end of
each of **the Fury's** turns.

**Explicit:** The recurring damage is attached to the source's turn end; the ordinary
save is attached to the target's turn end. With separate individual turns these are
not automatically simultaneous, even when participants share an initiative group.

Also, ordinary [Bleeding](../../vendor/steel-compendium/en/unified/md/condition/bleeding.md)
(`mcdm.heroes.v1/condition/bleeding`) causes its own Stamina loss after qualifying
actions or rolls. It is not generic end-of-turn damage.

### 11. An ally save bonus is not automatically expiring at that ally's save

[Swarm of Spirits](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-3/swarm-of-spirits.md)
(`mcdm.heroes.v1/feature.ability.elementalist.level-3/swarm-of-spirits`) grants allies
in the area a +1 save bonus until the end of **the elementalist's** next turn.

**Explicit:** The beneficiaries are allies and the duration's reference creature is
the caster. This alone is not a valid example of the bonus expiring at a beneficiary's
normal end-turn save. A special coincident save would require an additional identified
rule. The Persistent rider also changes the duration to a start-turn boundary.

### 12. Some turn-end actions have a specific ordering rule; others do not share its type

[Hesitation Is Weakness](../../vendor/steel-compendium/en/unified/md/feature/ability/shadow/level-1/hesitation-is-weakness.md)
(`mcdm.heroes.v1/feature.ability.shadow.level-1/hesitation-is-weakness`) is a free
triggered action when another hero ends their turn, with a restriction on chaining it.
The Shadow takes their turn after the triggering hero.

[Triggered Actions](../../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md)
(`mcdm.heroes.v1/rule.combat/triggered-action`) explicitly covers ordering multiple
triggered actions answering the same trigger: player-controlled responders choose
their order, followed by the Director's ordering for Director-controlled responders.

[Villain Actions](../../vendor/steel-compendium/en/unified/md/rule/monster/villain-action.md)
(`mcdm.monsters.v1/rule.monster/villain-action`) can also occur at another creature's
turn end, but are their own category and have their own once-per-encounter and
shared once-per-round limits. Their numbered order is suggested, not compulsory.

**Unresolved:** The triggered-action rule does not expressly place a villain action,
ordinary save, or passive expiry relative to a Shadow's turn-taking response. Do not
silently classify all four as triggered actions to borrow that ordering rule.

### 13. Some simultaneity must remain meaningful after logging

[Troll Whelp — Lingering Hunger](../../vendor/steel-compendium/en/unified/md/monster/troll/statblock/troll-whelp.md)
(`mcdm.monsters.v1/monster.troll.statblock/troll-whelp`) specifically depends on two or
more whelps being simultaneously reduced to 0 Stamina by non-acid/non-fire damage;
half become limbjumbles with 4 Stamina.

**Explicit:** This is an actual simultaneous-outcome test, not a turn-boundary
ordering rule. Discrete ordered log entries must not, by themselves, turn a jointly
resolved outcome into mechanically separate events that defeat such a trait.

## General anchors and search coverage

[Saving Throw](../../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md)
(`mcdm.heroes.v1/rule.general/saving-throw`) puts normal saves at each affected
creature's turn end: d10, success on 6+. It does not give a general subphase sequence.

[End of Next Turn](../../vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md)
(`mcdm.heroes.v1/rule.combat/end-of-turn`) explicitly makes an EoT effect imposed on
the creature's current turn expire at that current turn's end. This clarifies duration,
not universal ordering of work arising during the ending boundary itself.

[Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md)
(`mcdm.heroes.v1/rule.dice/ability-roll`) says: “If an ability creates multiple effects,
those effects resolve in the order in which they are presented.” Its same paragraph
also orders damage to all targets before power-roll tier effects unless otherwise
indicated. This is scoped positive evidence, not a global expiry/save sequence.

Searches covered the unified local Markdown corpus, followed by SCC filtering to
`mcdm.heroes.v1` and `mcdm.monsters.v1`. At this pin, 2,612 files match those core SCC
prefixes; 555 match a broad start/end-of-turn/round search, and 457 mention saving
throws or save ends. These counts describe search coverage, **not** a claim that every
matching file was individually reviewed. Broad searches for simultaneous, same trigger,
and effects/order wording yielded 11 core files; all matching lines were inspected.
Additional searches covered same-time wording, before/after boundary instructions,
end-turn damage, save modifiers/duration, monster End Effect, and start-turn choices.
Relevant entries were read in full, including frontmatter provenance. Supplement
matches (Summoner/Beastheart) were excluded from conclusions.

The Heroes book's local clean text (`en/books/heroes/clean/Draw Steel Heroes.md`,
read with `git show HEAD:...`) was searched for ordering, simultaneous events, and
before/after boundary wording; it corroborated the ability/triggered-action rules and
Piety ordering. There is no Monsters clean-text file in the pinned tree; Monsters
context was checked through its local chapter and stat-block entries. The different
representations remain one Compendium source, not independent corroborating authorities.

No blanket “Director decides all simultaneous ordering” rule was established by this
pass. A Director fallback could be a product policy if chosen, but should remain
separate from the source rules and must preserve explicit player ordering where it applies.

The [general-rule report](turn-boundary-ordering-general.md) identifies an explicit adjudication rule in
[The Basics — Game of Exceptions](../../vendor/steel-compendium/en/unified/md/chapter/the-basics.md#game-of-exceptions):
specific exceptions override general rules, and the Director has final adjudication authority. This
supports handling an uncovered conflict without establishing a universal ordering procedure.
