# V1 foe source inventory and implementation mapping

Companion to the [plan](v1-foe-engine-plan.md). Pinned source revision
`fb83a789da8f0327a389c277a0c790b1648d5810`; all source paths are relative to the canonical
`vendor/steel-compendium/en/unified/md/`. Every bold feature name cites that exact named block in
its preceding source file. Mappings name planned slices, not implemented support. Multiple slice
numbers mean the whole feature cannot close until all its clauses are accounted for.

The stat-block inventory below covers all 110 catalog ability records and all 50 trait records.
The last sections cover 25 band Malice records, two basic Malice options and two group traits.
Headers (size, characteristics, defenses, movement, free strike, With Captain) are additional
inputs, not extra named features. V212 accounts for them; V215 proves all ten minion definitions.

## Goblins and bugbears

**Goblin Runner** — `monster/goblin/statblock/goblin-runner.md`.

- **Club Charge:** V215; one coordinated roll, per-target minion contributions and captain edge.
- **Crafty:** V222; opportunity-attack exception on supplied movement facts, readable at action use.

**Goblin Sniper** — `monster/goblin/statblock/goblin-sniper.md`.

- **Bow:** V215/V216; coordinated roll; edge conditional on no move action this turn, with a
  recorded declaration if the turn's later choices remain unknown; captain ranged distance +5.
- **Crafty:** V222.

**Goblin Spinecleaver** — `monster/goblin/statblock/goblin-spinecleaver.md`.

- **Axe:** V215; 2/4/5 damage and push 1/3/4, participant damage and captain +1 strike damage.
- **Crafty:** V222.

**Goblin Warrior** — `monster/goblin/statblock/goblin-warrior.md`.

- **Spear Charge**, **Bury the Point:** compiled baseline; V216/V228 preserve damage, 2 Malice
  payment and Might-gated bleeding. Bury the Point is not a cost-free signature.
- **Crafty:** V222.

**Goblin Assassin** — `monster/goblin/statblock/goblin-assassin.md`.

- **Sword Stab:** V216; 4/6/7 damage plus 2 for a qualifying edge/double edge.
- **Shadow Chains:** compiled baseline; V216/V228 preserve three-target, 3 Malice, corruption
  damage and Agility-gated restrained.
- **Crafty**, **Slip Away:** V222; opportunity exception and Hide while observed.

**Goblin Cursespitter** — `monster/goblin/statblock/goblin-cursespitter.md`.

- **Eye of Surlach**, **Dizzying Hex:** compiled baseline; V216/V228 preserve corruption/weakened
  and the 1 Malice maneuver's separate prone/can't-stand duration. Saving does not stand a target up.
- **Crafty:** V222.

**Goblin Stinker** — `monster/goblin/statblock/goblin-stinker.md`.

- **Toxic Winds:** V216/V217; area damage and slide; 1+ Malice allocated to a chosen target's
  extra forced distance, not automatically every target.
- **Swamp Gas:** V224; non-goblin membership, 2 poison per actual square moved, terrain, immunity
  to wind dispersal, caster next-turn/0-Stamina expiry.
- **Crafty:** V222.

**Goblin Underboss** — `monster/goblin/statblock/goblin-underboss.md`.

- **Swordplay:** V216/V218; damage plus a chosen adjacent ally's optional free strike.
- **Get Reckless!:** V214/V222; outgoing strike edge and incoming strike edge until owner's next
  turn; spend 2 Malice to remove only the incoming disadvantage.
- **Crafty:** V222.

**Goblin Monarch** — `monster/goblin/statblock/goblin-monarch.md`.

- **Handaxe:** V216/V218; two targets and one chosen nearby ally's free strike.
- **Get in Here!:** V223; spend 1 Malice, create two runners in selected legal spaces and squads.
- **Meat Shield:** V220; chosen adjacent ally replaces the monarch as the strike target (Q-FOE-1).
- **Crafty:** V222. **End Effect:** V213; optional 5 irreducible damage ends one save-ends effect.
- **What Are You Waiting For?:** V213/V218; villain action, each ally chooses move or free strike.
- **Focus Fire:** V213/V218; chosen enemy/object anchors allies' movement instruction.
- **Kill!:** V213/V217; 2 damage per adjacent goblin, per enemy, from recorded adjacency facts.

**Bugbear Channeler** — `monster/bugbear/statblock/bugbear-channeler.md`.

- **Shadow Drag:** V216/V217/V224; ground prerequisite, two-target pull, actual traversed squares
  become enemy difficult terrain.
- **Blistering Element:** V216; choose acid/cold/corruption/fire/poison for area damage and bleeding.
- **Twist Shape:** V222; tier-1 slowed; higher tiers' shapechange bundles slowed and fire weakness
  10 under one save-ended effect, after the initiating damage.
- **Throw:** V217; source-owned grab required, vertical push up to 3, ally collision-damage exception.
- **Catcher:** V217/V219; confirm size-1 movement trigger, then establish the channeler's grab.
- **Shadow Veil:** V219/V222; halve the ally's triggering damage and track strike untargetability
  until that ally's next turn; range is a supplied fact.

**Bugbear Commander** — `monster/bugbear/statblock/bugbear-commander.md`.

- **Inspiring Swordplay:** V216/V217/V222; two targets, choose just one grab at tier 3; a separately
  chosen ally gains a next-strike edge with owner next-turn expiry.
- **You Next!:** V218; chosen ally moves then uses a signature ability.
- **Fall Back!:** V218; 5 Malice, each ally shifts then may use Throw; source/grab availability checked.
- **Throw:** V217; vertical push up to 4 and ally damage exception.
- **Catcher:** V217/V219.
- **The Commander's Watching:** V222; each qualifying ally's turn start offers a choice of one
  condition to end, using confirmed line of effect; no automatic choice of condition.

**Bugbear Roughneck** — `monster/bugbear/statblock/bugbear-roughneck.md`.

- **Haymaker:** V216/V217; two targets, chosen grab and separately chosen push; 5 Malice transforms
  Strike to Area/1 burst, which changes targeting, modifiers and pool damage semantics.
- **Leaping Fury:** V216/V217; optional jump before strike, damage and Might-gated prone.
- **Drag Through Hell:** V217/V224; 3 Malice, actual drag distance ×2 damage, release then prone,
  traversed ground becomes enemy difficult terrain.
- **Throw:** V217; vertical push up to 5 and ally damage exception.
- **Catcher:** V217/V219. **Flying Sawblade:** V217/V218/V219; confirm vertical forced movement,
  then a sourced Haymaker during movement or after falling. Do not invent a completed move.

**Bugbear Sneak** — `monster/bugbear/statblock/bugbear-sneak.md`.

- **Sucker Punch:** V216/V217/V222; grab, next-round triggered-action prohibition, +4 damage from
  a recorded start-of-turn hidden relationship.
- **Shadow Cloak:** V222; target-specific concealment with potency and saving throw, shift/Hide.
- **Carving Dagger:** V216/V222; two-target bleeding, with no-Hide restriction tied to that bleeding.
- **Throw:** V217; vertical push up to 4 and ally damage exception.
- **Catcher:** V217/V219. **Clever Trick:** V220; 1 Malice, replace target with a chosen enemy
  in the triggering strike's distance (Q-FOE-1).

## First-echelon undead

**Rotting Zombie** — `monster/undead/1st-echelon/statblock/rotting-zombie.md`.

- **Rotting Fist:** V215/V216; coordinated damage; tier-3 M < 2 branches on size 1: prone,
  otherwise slowed (save ends). Captain +1 strike damage.
- **Death Grasp:** V223/V224; death leaves a chosen space hazardous; first entering enemy with
  M < 2 becomes slowed (save ends), then the effect ends. Do not consume it on a nonqualifying enemy.

**Decrepit Skeleton** — `monster/undead/1st-echelon/statblock/decrepit-skeleton.md`.

- **Bone Bow:** V215/V217; captain edge; choose another target for 1 damage, separate from primary
  squad targeting and contributions.
- **Bonetrops:** V223/V224; death space is difficult terrain; first enemy entering takes 1 damage
  and ends the effect.

**Crawling Claw** — `monster/undead/1st-echelon/statblock/crawling-claw.md`.

- **Fingernails:** V215/V217; shift instruction sized by actual damage dealt, including defenses;
  captain speed +2.
- **Disorganized:** V222; the claw cannot supply an ally's flanking benefit.

**Zombie** — `monster/undead/1st-echelon/statblock/zombie.md`.

- **Clobber and Clutch:** V217/V222; tier-3 grab, 2 corruption each grabbed target turn start,
  cumulative 5 damage from this effect creates the persistent hunger consequence. Ending grab
  stops its damage; it does not cure an already earned affliction.
- **Zombie Dust:** V216; self prone before area damage and potency conditions, 3 Malice.
- **Endless Knight:** V223; first qualifying defeat leaves 10 Stamina and prone; fire/holy damage
  or a destroyed body does not qualify. Preserve the used marker and damage provenance.

**Skeleton** — `monster/undead/1st-echelon/statblock/skeleton.md`.

- **Bone Shards:** V217/V222; 2 damage on the first willing movement on the target's turn,
  expiring at the skeleton's next turn.
- **Bone Spur:** V216/V222; 2 Malice, area damage/bleeding and next-strike bane.
- **Arise:** V223; first qualifying defeat leaves 1 Stamina and prone, with the same exclusions.

**Ghoul** — `monster/undead/1st-echelon/statblock/ghoul.md`.

- **Razor Claws:** compiled baseline; V216/V228 preserves tiers and bleeding.
- **Leap:** V217/V218; actual landing on size-1 enemy causes prone and offers free strike.
- **Arise:** V223. **Hunger:** V222; Charge grants +2 speed until the ghoul's turn ends.

**Specter** — `monster/undead/1st-echelon/statblock/specter.md`.

- **Decaying Touch:** V216/V223; 2 Malice increases potency by 1 and registers resurrection as a
  specter next round only for a living creature killed by this damage.
- **Hidden Movement:** V217/V222; temporary invisibility around a movement instruction, restored
  visible on completion; do not leave an indefinite invisibility effect.
- **Corruptive Phasing:** V217/V222; movement permissions and collision immunity; confirmed
  traversal of a creature deals 2 corruption at the source's first-in-round limit. The group
  text `monster/group/undead.md`, Spectral Undead and Phasing, also forbids ending combat movement
  inside a creature/object.

**Ghost** — `monster/undead/1st-echelon/statblock/ghost.md`.

- **Heat Death:** V216/V222; two-target cold/slowed and consumed next-strike edge against each target.
- **Haunt:** V217/V218; self or ally with Phasing, shift; 2 Malice adds one target.
- **Shriek:** V219; targeting-trigger eligibility, damage halving and 2 sonic retaliation, including
  a strike reduced to zero damage; keep trigger distinct from damage-taken.
- **Phantom Flow:** V222/V224; aura membership by distance/Phasing trait; prevention of slowed and
  weakened, without inventing removal of existing conditions if not justified by source.
- **Paranormal Activity:** V213/V217; each selected size ≤3 object rises then moves toward the
  confirmed nearest enemy; object movement/collision remains explicit table work until representable.
- **Spirited Away:** V213/V222; potency-gated levitation; EoT or encounter duration, rise on turns,
  conditional fly/slowed/weakened; altitude supplied by the table.
- **Awful Wail:** V213/V216; post-damage winded and P < 2 sets Stamina to 1.
- **Corruptive Phasing:** V217/V222, as above.

## Humans

**Human Guard** — `monster/human/statblock/human-guard.md`.

- **Halberd:** V215/V218; captain speed +2; when flanked, optional free strike against a different
  adjacent target, after the coordinated attack's relevant member effect.
- **Supernatural Insight:** V222; ignores only supernatural concealment, not cover or mundane concealment.

**Human Archer** — `monster/human/statblock/human-archer.md`.

- **Crossbow:** V215; coordinated damage and captain ranged distance +5.
- **Supernatural Insight:** V222.

**Human Raider** — `monster/human/statblock/human-raider.md`.

- **Handaxes:** V215/V218; captain edge; a Charge grants ranged free strike **before** the ability.
- **Supernatural Insight:** V222.

**Human Death Acolyte** — `monster/human/statblock/human-death-acolyte.md`.

- **Necrotic Bolt:** V215/V217; corruption damage, captain ranged distance +5, chosen creature
  within 5 regains 1 Stamina. Healing is a separate subject, not necessarily the attacked creature.
- **Supernatural Insight:** V222.

**Human Brawler** — `monster/human/statblock/human-brawler.md`.

- **Haymaker:** V216/V217/V222; already-grabbed +2 damage checks prior state; tier-3 grab includes
  Escape Grab bane tied to that grab.
- **Throw:** V217; 1 Malice and own grabbed target, push up to 5.
- **Shoot the Hostage:** V219; automatic strike split while holding size ≥1S; the hostage takes
  the remainder, not another independently rounded half. Preserve both causal damage records.
- **Supernatural Insight:** V222.

**Human Scoundrel** — `monster/human/statblock/human-scoundrel.md`.

- **Rapier and Dagger:** V216; 2 Malice buys +2 damage only with qualifying edge/double edge.
- **Dagger Storm:** V218; 5 Malice, up to three separately sourced Rapier and Dagger strikes and
  before/after shifts. It is not a single three-target roll by inference.
- **Supernatural Insight:** V222.

**Human Trickshot** — `monster/human/statblock/human-trickshot.md`.

- **Trick Crossbow:** V216/V222; ignore cover/concealment; spend 3 Malice for one extra target.
- **Supernatural Insight:** V222.

**Human Blackguard** — `monster/human/statblock/human-blackguard.md`.

- **Zweihander Swing:** V216/V218; area damage/slowed, chosen ally free strike or 1 Malice to
  replace it with signature ability.
- **You!:** V222; source-owned mark grants the blackguard and each ally an edge on abilities against target
  until the start of the owner's next turn; not the Tactician's Mark and does not grant its benefits.
- **End Effect:** V213. **Supernatural Insight:** V222.
- **Parry!:** V219; self/adjacent ally, strike-targeting event, halve damage without borrowing the
  hero Parry's potency reduction.
- **Advance!:** V213/V218; shift then/during two separate Zweihander Swing uses.
- **Back!:** V213/V217; selected enemies slide up to 5.
- **I Can Throw My Blade and So Should You!:** V213/V218; Zweihander against specified area targets,
  then chosen allies' free strikes, one target per ally, keeping the printed override envelope.

**Human Death Cultist** — `monster/human/statblock/human-death-cultist.md`.

- **Death Scythe:** V216/V217; optional 2 Malice heals caster for half actual damage dealt, rounded
  down and capped by maximum Stamina.
- **Rise, My Minions:** V223; pay 1 per selected dead minion killed this encounter; revive at full
  Stamina, allow repeated revival, kill the revived minions at caster death or encounter end.
- **Supernatural Insight:** V222.

**Human Knave** — `monster/human/statblock/human-knave.md`.

- **Morningstar and Javelin:** V216/V222; taunt EoT and tier-3 M < 2 next-roll double bane.
- **I'm Your Enemy:** V218/V219/V222; adjacency + source taunt + damage to another creature offers
  knave free strike; do not consume an ordinary triggered action for a trait that does not name one.
- **Overwhelm:** V222; qualifying adjacent turn start prevents shifting; duration is queued as Q-FOE-5 and stays a visible manual restriction pending the answer.
- **Supernatural Insight:** V222.

**Human Storm Mage** — `monster/human/statblock/human-storm-mage.md`.

- **Lightning Bolt:** V216; 5 Malice changes ranged strike to a 10×1 line area with enemy/object targets.
- **Gust of Wind:** V216/V217/V224; slide/slowed, dispel gas/vapor/flames except explicit source
  exceptions such as Swamp Gas; selected terrain/effects are required facts.
- **Arcane Shield:** V219/V222; bane to melee abilities, plus adjacent damage source takes 2
  lightning and R < 1 permits push up to 2. Prevent recursive duplicate retaliation.
- **Supernatural Insight:** V222.

**Human Bandit Chief** — `monster/human/statblock/human-bandit-chief.md`.

- **Whip and Magic Longsword:** V216/V217; two targets (+1 for 2 Malice), pull, then 3 corruption
  only for targets confirmed adjacent after resolution.
- **Kneel, Peasant!:** V216/V217; push/prone, 2 Malice transforms melee target to 1 burst.
- **Bloodstones:** V220; takes 5 irreducible corruption damage to improve own roll by one tier;
  retain original dice and revise all dependent effects, not just damage (Q-FOE-1).
- **End Effect:** V213. **Supernatural Insight:** V222.
- **Shoot!:** V213/V218; artillery allies each make a ranged free strike.
- **Form Up!:** V213/V218/V222; shifts plus encounter-long adjacency-dependent immunity 2.
- **Lead From the Front:** V213/V218; shift up to 10 regardless of speed, Whip against up to four
  targets, and one adjacent ally's free strike per target.

## Solos

**Arixx** — `monster/arixx/statblock/arixx.md`.

- **Solo Monster:** V213; two nonconsecutive turns; optional End Effect costs 5 irreducible damage.
- **Earthwalk:** V222; earth/loose-rock terrain exception.
- **Soft Underbelly:** V222; a prone melee striker gets double edge instead of the prone bane.
- **Bite:** V217/V222; grab plus 3 acid on a size-1 grabbed target's turn start.
- **Claw Swing:** V216/V217; up to two potency-gated grabs, chosen vertical slide up to 3 for each
  grabbed target; record the source exception to ordinary one-grab capacity.
- **Spitfire:** V216/V224; two-target acid/prone, separate persistent acid spaces under targets,
  2 acid on first entry in a round or turn start.
- **Dirt Devil:** V216/V224; damage/push, start-underground double edge and difficult terrain.
- **Dust Cloud:** V222/V224; until owner's next turn, bane for enemies inside or targeting a
  creature inside, plus caster movement.
- **Skitter:** V219; damage-taken halving, then shift up to 3 after triggering effect.
- **Acid Spew:** V213/V216/V224; line damage and persistent acid area with printed enter/start triggers.
- **Sinkhole:** V213/V217/V218; shift, confirm above ground and proximity, Bite, optional Dig.
- **Acid and Claws:** V213/V216; area acid and Might-gated weakened.

**Werewolf** — `monster/werewolf/statblock/werewolf.md`.

- **Solo Monster:** V213; two nonconsecutive turns and 5-damage End Effect.
- **Accursed Rage:** V225; non-stormwight enemies accumulate rage; ≥10 at turn start consumes rage,
  then shift toward nearest creature and melee free strike before ordinary turn actions; damage
  recipient gains 1 rage. Ordinary rage clears on respite.
- **Shapeshifter:** V226; starts hybrid and rejects external shape changes as a rules conflict.
- **Vukenstep:** V222; difficult-terrain movement exception.
- **Accursed Bite:** V216/V225/V226; 9/13/16 damage, 2/4/5 rage, optional 2 Malice lycanthropy
  with per-target failed-potency history and persistent turn-end rage.
- **Ripping Claws:** V216/V225; damage/bleeding and tier-2/3 rage 1/3.
- **Berserker Slash:** V216/V217/V225; 3 Malice, pre-use shift, push/slide and tier-specific rage.
- **Wall Leap:** V217/V218; supplied wall landing enables second leap/free strike; M < 2 prone.
- **Facepalm and Head Slam:** V220; 2 Malice, confirmed charge/straight-line approach, pre-resolution
  prone and 5 damage. Printed sequencing wording needs Q-FOE-1, not damage-only revision.
- **Howl:** V213/V221/V225; each target's Intuition test; encounter enemies with existing rage gain
  4 separately, even outside the burst when the printed predicate applies.
- **Full Wolf:** V213/V226; size 3, speed 10, stability 2, strikes deal +2 damage and give an
  additional 1 rage, Bite potency +1; lasts to death/encounter end with supplied relocation/push facts.
- **Rampage:** V213/V216/V225; area damage/bleeding/rage 2/4/8, shifts before and after.

**Thorn Dragon** — `monster/dragon/statblock/thorn-dragon.md`.

- **Solo Monster:** V213; two nonconsecutive turns and **10**, not 5, irreducible End Effect damage.
- **Withering Wyrmscale Aura:** V224/V227; other creatures' healing halved; winded member first
  entry each round or turn start takes recorded 1d3 corruption.
- **Virulent Breath:** V221/V227; **each target's Might test**, 12/9/5 poison, dragonsealed on lower
  tiers; dragonsealed adds 1d3 only to damage rolled as d6/d3, not every ability power-roll damage.
- **Spinous Tail Swing:** V216/V217/V227; two targets, damage/push; 2 Malice adds 1d3 and A < 2 bleeding.
- **Provoking Nettles:** V212/V217/V227; trait-granted once-per-turn shift up to 5, confirmed first
  traversal of an enemy's space deals 3; expose the action, not just trait text.
- **Investiture of Verdure:** V217/V227; 5 Malice, selected dragonsealed enemies, pull up to 5;
  temporary Stamina is 5 per target actually pulled, not merely selected.
- **Prickly Situation:** V219/V227; ending dragonsealed offers a free triggered pull and
  A < 2 restrained until end of subject's next turn.
- **Thorny Scales:** V218/V219/V227; 1 Malice free reaction to adjacent melee strike damage,
  free strike plus M < 2 bleeding until end of subject's next turn.
- **Briar Bindings:** V213/V216; area damage and Agility-gated restrained.
- **Thorned Armor:** V213/V219/V227; encounter-long adjacent melee-targeting retaliation of 3,
  then use Provoking Nettles, retaining its once-per-turn accounting.
- **Malign Thicket:** V213/V217/V224/V227; two no-cost Bramble Barricades, force-move poison 1d3
  and M < 2 weakened, plus domain-dependent turn-start poison 1d3.

## Band and solo Malice

Each cited file's introduction limits activation to the start of the matching creature's turn.
V214 supplies shared discovery, cost, timing and once-per-turn feature accounting. Rows below
assign the payload; an unimplemented payload stays manual with the actual payment recorded.

| Source file under `monster/` | Named feature and payload slices |
| --- | --- |
| `goblin/goblin-malice.md` | **Goblin Mode** — V214/V222: Goblin keyword, speed +2 through round end (includes bugbears). **Tiny Stabs** — V217: 1 damage per adjacent goblin, per enemy. **Swamp Stink** — V221/V224: all non-goblins' Might tests, terrain, low-tier 5 poison damage once; low/middle-tier weakened until mist disappears; wind cannot disperse it. |
| `bugbear/bugbear-malice.md` | **Goblin Malice Features** — V214: alias access, pay selected actual feature cost once. **Grab Iron Ball** — V214/V217/V218: 3 per acting non-minion recipient; grant maneuver, confirmed distance, damage 8−distance, M < 1 slowed. **Grab Javelin** — V214/V217/V218/V222: 5 per recipient, 12−distance damage, M < 1 bleeding; linked free maneuver pull for allies within 2. **Show Them the Great Fear** — V222/V224: doubled speed/climbing and qualifying-strike frightened plus forced retreat instruction through encounter end. |
| `undead/1st-echelon/undead-malice-level-1-malice-features.md` | **Ravenous Horde** — V223: delayed round-end adjacency check, two rotting zombies per qualifying hero with accepted Q-FOE-2: 2 Stamina each, separate squads and casualty step 2; no consecutive rounds. **Paranormal Fling** — V217: up to three selected unattended objects, nearest-enemy movement instructions. **The Grasping, the Hungry** — V221/V224: chosen nine-square surface; adjacent turn-end Agility test; 5 damage in every tier, restraint duration differs, restrained turn-start 1d6. **Dread March** — V218/V223: four undead +1 per extra Malice, move/free strike; defer their death to sequence completion. |
| `human/human-malice.md` | **Alchemical Device** — V214/V216: granted non-minion maneuver, one Malice payment, area corruption and Agility-gated slow/restrain. **Exploit Opening** — V214/V222: acting humans' edge, double edge against a conditioned enemy through their turn end. **Staying Power** — V214/V217: non-minion human heals 5×level, cap at max, route through healing modifiers. |
| `arixx/arixx-malice.md` | **Burning Maw** — V214/V222: next strike edge and +3 acid, consumed together. **Geyser** — V221/V217: enemy Agility tests, damage/vertical push or safe-space shift. **Solo Action** — V213/V214: extra main action even dazed, source-linked allowance. **Earth Sink** — V217/V222/V224: grounded A < 1 prone; extra movement cost and sinking depend on start/end facts, persist through encounter end. |
| `werewolf/werewolf-malice.md` | **Blood In Their Eyes** — V214/V226: 10 temporary Stamina, speed +3 through turn end, unavailable under the printed holy-damage history predicate. **Solo Action** — V213/V214. **Moonfall** — V225/V226: encounter duration, line-of-effect facts, extra move/maneuver and turn-end +2 rage only for creatures already carrying rage. |
| `dragon/thorn-dragon-malice.md` | **Cage of Thorns** — V227: selected dragonsealed enemy, restrained until end of subject's next turn. **Bramble Barricade** — V224/V227: ten wall squares, each 5 Stamina/fire weakness 5; line-of-effect exception, terrain, actual forced-movement squares ×1 damage and bleeding. **Solo Action** — V213/V214. **Afflictive Overgrowth** — V221/V227: each enemy's Agility test, 12/9/5 poison with restraint/bleeding duration by tier. |

## Shared rules and out-of-stat-block behavior

| Source and section | Planned handling |
| --- | --- |
| `rule/monster/malice.md`, Basic Malice / **Brutal Effectiveness** | V214/V222: 3 Malice, next ability with potency +1; an ability without potency must not consume it |
| Same, **Malicious Strike** | V214/V222: 5+ Malice, next strike adds highest characteristic plus extras to one chosen target, capped at 3×highest characteristic; encounter-wide no-consecutive-round usage, even by another monster |
| `monster/group/werewolf.md`, **Shared Ferocity** | V226: confirmed line of effect to a ferocity-cost ability yields one recorded 1d3 Malice grant per encounter, at the first qualifying use across creatures; accepted Q-FOE-3 |
| `monster/group/dragon.md`, **Thorn Dragon's Domain** | V227: Director declares the one-week location predicate; other creatures (including other dragons) take turn-start speed −2, minimum 1; only the source dragon is exempt from speed loss; any creature restrained while grounded also bleeds; duration question Q-FOE-4 |
| `rule/monster/villain-action.md`, Villain Actions | V213: at another creature's turn end; each named action once/encounter; at most one villain action per round across all such creatures; order may vary |
| `rule/monster/end-effect.md`, End Effect, plus printed stat-block values | V213: optional unreduceable damage, chosen save-ended effect; do not auto-spend at End turn |
| `rule/monster/creature-free-strike.md`, Creature Free Strikes / Creature Opportunity Attacks / Stat Block Self-Reference | V215/V218/V222: static damage; range/keywords/type from signature; bane prevents opportunity attack; relative allies/enemies and distances refer to the acting creature |
| `rule/monster/squad.md`, `rule/monster/captain.md`, and `chapter/monster-basics.md`, Using Minions / Acting Together | V215 verifies the canonical minion rules; preserve the owning table spec's explicit squad interpretations |

Objects, corpse choices, nearest creatures, trajectories, wall squares and external terrain are
never invented. A row may finish with documented table work for these facts while faithfully
automating arithmetic and recorded effects once supplied. Named abilities with unanswered rules
remain explicit manual cases, and the final roster report must name them.
