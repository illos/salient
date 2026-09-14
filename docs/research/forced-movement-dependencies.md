# Forced movement outcomes and dependent automation

Scope: whether table-supplied forced-movement facts unlock meaningful automation in a mapless companion, beyond a separate Director damage operation. Core *Draw Steel: Heroes* and *Draw Steel: Monsters* only; no supplemental examples, implementation, or new product rulings.

The local Compendium HEAD is `fb83a789da8f0327a389c277a0c790b1648d5810`. Its working tree was clean before research and after source inspection. All rules evidence below comes from that revision. Full cited entries and relevant general rules were read; Heroes source-order text was also checked locally with `git show HEAD:en/books/heroes/clean/Draw Steel Heroes.md`.

## Answer

There are concrete dependencies beyond collision damage: resource gains, mandatory attacks, conditions, healing opportunities along a path, and death effects whose targets must be determined after movement. Their existence does **not** require confirming every movement or tracking coordinates. Often the useful input is simply “actually pushed,” “collided with this creature,” “entered this wall,” or “these creatures are adjacent now.” A dedicated effect-resolution card can collect that fact directly.

A separate semantic **Apply damage** operation can handle damage and ordinary damage-trigger bookkeeping. An **Edit Stamina** correction alone does not express those events. Neither operation, without additional facts, establishes who pushed whom, a passed ally's eligibility to heal, a collision-triggered strike, or an endpoint's affected creatures. These are conceptual distinctions, not assertions about current implementation.

## General rules that constrain the examples

[Forced Movement](../../vendor/steel-compendium/en/unified/md/movement/forced-movement.md), SCC `mcdm.heroes.v1/movement/forced-movement`, defines push/pull/slide X as **up to** X squares; the mover can choose fewer, including none. Push and pull follow straight lines with their respective distance requirements; ordinary versions are not freely vertical. The ability's printed distance, its modified allowance, and actual displacement are therefore different facts. [Stability](../../vendor/steel-compendium/en/unified/md/rule/character/stability.md), SCC `mcdm.heroes.v1/rule.character/stability`, permits the target to reduce movement by **up to** their stability; maximum resistance is a choice, not an unavoidable subtraction.

[Restrained](../../vendor/steel-compendium/en/unified/md/condition/restrained.md), SCC `mcdm.heroes.v1/condition/restrained`, ordinarily prevents forced movement. [Grabbed](../../vendor/steel-compendium/en/unified/md/condition/grabbed.md), SCC `mcdm.heroes.v1/condition/grabbed`, ordinarily permits it only from the grabbing creature/object/effect. Its ending clause additionally requires separation, not merely a push declaration. This does not establish that outsiders can ordinarily push a grabbed victim free.

The general movement entry also establishes that forced movement ignores difficult terrain, never provokes opportunity attacks, triggers entry effects unless excepted, and resolves multiple targets individually in the mover's chosen order. It explicitly includes entry effects worded as willing movement. Actual path/order can matter, but a mapless table can supply only the affected identities or relevant event.

## 1. Level-one Fury: pushing grants a spendable resource

[Brutal Slam](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md), SCC `mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam`, deals tiered damage and push 1/2/4. [Growing Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md), SCC `mcdm.heroes.v1/feature.fury.level-1/growing-ferocity`, gives a Berserker at 4 ferocity: “The first time you push a creature on a turn, you gain 1 surge.” The Reaver counterpart uses slide. Benefits remain until the end of the Fury's turn despite ferocity spent during that turn.

**Minimal facts:** effective movement source and type, creature versus object, whether a qualifying push occurred, and its turn. Existing character state supplies the applicable benefit and whether its first-use opportunity is already consumed. Coordinates and exact nonzero distance are unnecessary.

**Consequence:** the gain is automatic once qualified; spending the surge is optional. [Surges](../../vendor/steel-compendium/en/unified/md/rule/resource/surge.md), SCC `mcdm.heroes.v1/rule.resource/surge`, permits later damage or potency spending. Example: a level-one Berserker with this benefit active, no prior push this turn, and 0 surges uses Brutal Slam and actually pushes a surviving creature 1 square. They gain 1 surge even on clear ground with no collision or fall. A second push that turn gives no second surge. A push of an object does not meet this wording. This example concerns later spending, not retroactively adding the earned surge to Brutal Slam's already-applied damage.

[Lines of Force](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/lines-of-force.md), SCC `mcdm.heroes.v1/feature.ability.fury.level-1/lines-of-force`, explicitly makes the responding Fury the movement's source, permits a replacement target and push type, and increases distance. That identity matters to the surge and Primordial Strength; the original damaging actor and effective mover can differ. These are optional response choices, not mandatory use of the action.

**Damage operation:** insufficient because the surge can arise with no damage from movement. An explicit qualifying-push report or direct sourced surge resolution can suffice.

A separate damage tool has its own useful automation: [Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md), SCC `mcdm.heroes.v1/feature.fury.level-1/ferocity`, grants 1 ferocity the first time each combat round the Fury takes damage, and 1d3 on first becoming winded or dying in the encounter. A Director-applied collision or fall can therefore feed these recorded damage/resource events without a general movement report. An already-resolved manual correction must not grant those resources again. This is a proposed operation boundary, not an implemented damage tool.

A second level-one example makes the distinction stronger: [Clarity and Strain](../../vendor/steel-compendium/en/unified/md/feature/talent/level-1/clarity-and-strain.md), SCC `mcdm.heroes.v1/feature.talent.level-1/clarity-and-strain`, automatically gives a Talent 1 clarity the first time each combat round a creature is force moved. No collision, damage, particular mover, or distance restriction is stated. If a Talent is at −1 clarity and this is the round's first qualifying event before their turn ends, gaining 1 brings them to 0 and removes the negative-clarity damage otherwise due then. Do not erase previously incurred strain effects: the entry says they can persist after strain ends.

## 2. Collision and fall tools — historical proposal, now excluded

The general movement rule's collision sections calculate creature collisions from **remaining** movement, and an unbroken stationary object of sufficient size deals 2 plus remaining squares. [Primordial Strength](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-strength.md), SCC `mcdm.heroes.v1/feature.fury.level-1/primordial-strength`, adds the Berserker's Might when they push another creature into an object. It is a mandatory rider, distinct from the feature's weapon-strike bonus against objects.

**Minimal facts:** effective mover/type, collision participants or object, remaining allowance at impact, object size and whether it breaks, plus applicable protections. If a Might 2 Berserker pushes a creature into a sufficiently large unbroken wall with 2 squares remaining, the separate impact is 2 + 2 + 2 = **6 damage**, assuming no other modifiers. This does not add Might a second time to the original strike.

A separate collision operation can calculate this faithfully if supplied those facts or a table-computed result. A bare untyped damage amount loses the reason the Might rider applies. The same matters defensively: [Inertial Sink](../../vendor/steel-compendium/en/unified/md/feature/null/level-2/inertial-sink.md), SCC `mcdm.heroes.v1/feature.null.level-2/inertial-sink`, reduces damage from being force moved by the Null's level. “Force damage” is not a damage type in [Damage Types](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-type.md), SCC `mcdm.heroes.v1/rule.damage/damage-type`; causation is separate from damage type.

[Impart Force](../../vendor/steel-compendium/en/unified/md/feature/ability/null/level-1/impart-force.md), SCC `mcdm.heroes.v1/feature.ability.null.level-1/impart-force`, exposes the reverse arithmetic: it deals 1 psychic damage **per square pushed**, without requiring a collision. With cost paid, tier-two push 5, equal-sized participants, no extra movement modifiers, and a stability-2 target choosing full resistance, moving all 3 available squares on clear ground deals 3 psychic damage before other modifiers. Choosing only 1 square gives 1. A damage calculator can accept actual distance or a manually determined damage result; printed push 5 is insufficient.

[Falling](../../vendor/steel-compendium/en/unified/md/rule/health/falling.md), SCC `mcdm.heroes.v1/rule.health/falling`, uses actual fall height, Agility, landing surface, and potentially another creature landed on. It can cause prone as well as damage. Forced movement over a gap finishes before a fall is checked; landing safely beyond the gap means no fall. Downward forced movement into an unbroken object additionally uses falling damage with Agility treated as 0. Ordinary falling is not itself forced movement.

**Assessment:** a dedicated Director collision/fall operation is a reasonable manual mode. To automate these rules it must cover their riders, conditions, and causation, not merely subtract Stamina. None of this alone justifies reporting every uneventful push.

## 3. A collision can require a new attack

[Panic in Their Lines](../../vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-6/panic-in-their-lines.md), SCC `mcdm.heroes.v1/feature.ability.tactician.level-6/panic-in-their-lines`, targets two creatures, deals damage and slide 1/3/5, and says a target force moved into another creature **must** make a free strike against that creature.

**Minimal facts:** which target collided with which creature, movement order, and whether the prospective attacker remains able to strike. Neither final coordinates nor exact path is inherently necessary. The collision gives the strike its target; the original Tactician does not make that strike.

**Consequence:** collision damage and an additional mandatory attack are distinct resolutions. Assume both original targets survive, the first is slid into a third creature and remains able to strike, and the second is slid into clear space. Only the first acquires the required free strike. [Creature Free Strikes](../../vendor/steel-compendium/en/unified/md/rule/monster/creature-free-strike.md), SCC `mcdm.monsters.v1/rule.monster/creature-free-strike`, supplies a Director-controlled creature's static damage, distance, keywords and damage type.

**Damage operation:** recording impact damage alone cannot determine the attacker/target pair or emit a strike with its own semantics. A linked “collided with” or “resolve required free strike” operation can; a complete movement record is optional. Cases where the initial damage kills the would-be attacker require further adjudication and are deliberately excluded from this example.

## 4. Movement can apply conditions independently of damage

[Wall of Ice](../../vendor/steel-compendium/en/unified/md/feature/ability/null/level-6/wall-of-ice.md), SCC `mcdm.heroes.v1/feature.ability.null.level-6/wall-of-ice`, slows an enemy entering an adjacent square and restrains an enemy forced into the wall, each at Might below average potency, save ends. These are separate entry/contact clauses, not damage triggers.

**Minimal facts:** active wall identity, the entrant's identity and allegiance, whether it entered adjacency or was forced into the wall. Recorded Might and the wall's potency resolve the comparison. With average potency 2 and an otherwise eligible Might-1 enemy forced into the intact wall, restraint applies automatically. Merely entering adjacency produces slowed instead; crossing the threshold does not require ending movement beside the wall. Allies can freely traverse the wall and do not meet its enemy clauses. The [potency rule](../../vendor/steel-compendium/en/unified/md/rule/character/potency.md), SCC `mcdm.heroes.v1/rule.character/potency`, establishes the strict inequality.

**Damage operation:** insufficient. “Entered this effect” can apply the condition directly. Once restrained, ordinary further forced movement is disallowed, so event order can affect subsequent movement.

An earlier-level endpoint example is [Lizardfolk Tonguer](../../vendor/steel-compendium/en/unified/md/monster/lizardfolk/statblock/lizardfolk-tonguer.md), SCC `mcdm.monsters.v1/monster.lizardfolk.statblock/lizardfolk-tonguer`: Tonguelash's pull or alternative shift automatically grabs if it leaves the target adjacent. The needed fact is final adjacency, subject to applicable grab restrictions. This also occurs after the tonguer's ordinary shift: it does not establish a general requirement to track that shift digitally.

## 5. Passing an ally can unlock healing

[Drag the Unworthy](../../vendor/steel-compendium/en/unified/md/feature/ability/conduit/level-8/drag-the-unworthy.md), SCC `mcdm.heroes.v1/feature.ability.conduit.level-8/drag-the-unworthy`, deals holy damage and slides its target. Each ally the target comes adjacent to **during** the forced movement can spend a Recovery.

**Minimal facts:** which allies became adjacent along this movement, then each ally's choice. Their recorded Recoveries, Stamina and recovery value supply the arithmetic. Endpoint adjacency alone is insufficient.

**Consequence:** an optional Recovery-spending opportunity, not automatic healing. Assume the target survives, is movable, and passes adjacent to wounded allies A and B with Recoveries available, ending adjacent to neither. Both may spend; if A accepts and B declines, only A loses one Recovery and regains Stamina per [Recoveries and Recovery Value](../../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md), SCC `mcdm.heroes.v1/rule.health/recoveries`. Neither requires collision damage.

**Damage operation:** insufficient. A list of eligible allies on this ability's card can preserve the dependency without recording the path. This is a particularly strong reason to collect specific movement facts when the supported ability needs them.

## 6. Lethal damage can await movement-dependent targeting

The general movement rule's **Death Effects and Forced Movement** section expressly places associated forced movement before a creature's death/0-Stamina triggered effect. [Hobgoblin Hell Trooper](../../vendor/steel-compendium/en/unified/md/monster/hobgoblin/statblock/hobgoblin-hell-trooper.md), SCC `mcdm.monsters.v1/monster.hobgoblin.statblock/hobgoblin-hell-trooper`, has Infernal Ichor: at 0 Stamina, each adjacent creature takes 3 fire damage.

**Minimal facts:** movement has been resolved at the physical table, and which creatures are adjacent then. The linked lethal ability identifies why this death effect waits.

**Example:** a same-sized Fury's tier-three Brutal Slam lethally damages a previously injured trooper. With no movement bonuses, its push 4 becomes 2 after the trooper uses stability 2. The table moves it those 2 squares without collision, leaving hero A no longer adjacent and hero B adjacent; no other creatures are adjacent. Infernal Ichor then deals B 3 fire damage before applicable modifiers, and deals none to A. The movement still occurs despite the lethal strike.

**Consequence:** mandatory effect, with affected identities determined after movement. A semantic damage operation that immediately resolves the burst against pre-movement neighbors would be wrong.

**Alternative:** a “resolve Infernal Ichor; select creatures adjacent after movement” card is sufficient. Answering it can attest that the table finished the movement, avoiding a separate movement confirmation. This dependency requires correct timing for this burst, not a universal gate on movement.

## Limits and product recommendation

Zero displacement is not comprehensively adjudicated by these entries. For the Fury/Talent gains, I recommend requiring an actual qualifying movement rather than equating a printed push/slide outcome with success: the movement definition explicitly allows choosing not to move. But the text does not expressly settle every fully resisted or immediate-obstacle case. Keep that interpretation separate from established nonzero examples.

There are explicit exceptions: [Metakinetic Mastery](../../vendor/steel-compendium/en/unified/md/feature/null/level-1/metakinetic-mastery.md), SCC `mcdm.heroes.v1/feature.null.level-1/metakinetic-mastery`, grants its discipline-4 once-per-round surge even if the relevant damage/movement effect is resisted. [Repel](../../vendor/steel-compendium/en/unified/md/feature/ability/talent/level-1/repel.md), SCC `mcdm.heroes.v1/feature.ability.talent.level-1/repel`, offers an optional counter-push when its movement reduction reaches 0. Zero must not universally mean “nothing remains to resolve.” Repel's reduction can be known from ability choices without reporting physical movement.

Recommendation, not a new requirement: collect facts at the dependent effect that needs them, support direct manual resolution, and retain source relationships when automation consumes those facts. Allow independent work to proceed. A plain nonlethal Brutal Slam into clear space, with no applicable movement-triggered feature/effect, has no demonstrated need for an additional outcome report after its damage and movement instruction.

The user's original-action-applies/Lines-of-Force-modifies-effective-movement convention and prompts lasting through End turn until the next individual turn starts are accepted product context, not rules derived here. If a late response changes a fact already used for a resource, strike, condition or death effect, that consequence must be revisited or explicitly manually resolved. This brief does not prescribe a universal wait, reopen the prompt convention, or treat every untracked physical move as unresolved automated work.

## Subsequent product decision

On 2026-09-13, the minimum-input direction was accepted: ask only for the facts and choices needed to resolve
the specific action or effect, deriving the rest from known state. The original recommendations above are
retained separately from this product decision. Later on 2026-09-13 the user deliberately excluded the
standalone damage/collision/fall tool, selecting result corrections and direct live-stat adjustments
for Director fine-tuning. Do not treat the historical tool proposals above as a current requirement or
missing gap. The Director's Resolved at table fallback for a specific unsupported effect is separately
confirmed. Source ambiguities such as zero-distance triggers remain unresolved. The
[table specification](../table-spec.md#inline-interaction-cards-in-the-game-log) owns the effective contract.
