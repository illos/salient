# Minion lifecycle

Minions combine individual creatures with shared squad mechanics. Their positions, conditions, identities,
and death effects remain individual, while their squad shares Stamina, a turn, and coordinated action
rolls. A captain joins that shared timing but keeps a separate Stamina record and normal action options.
These distinctions matter from encounter preparation through the last casualty; treating a squad as
one ordinary monster or as several ordinary independent turns loses essential rules.[^1][^2][^3]

This report covers core *Draw Steel: Monsters* minions and the applicable *Heroes* rules in the local
Steel Compendium at revision `fb83a789da8f0327a389c277a0c790b1648d5810`. The accompanying
[stat-block inventory](minion-statblock-inventory.csv) identifies **116 source-qualified Monsters-book
Minion stat blocks**, including **10** with a Stamina-related captain benefit. The inventory is a
metadata census; the lifecycle analysis uses the general rules and representative exceptional stat
blocks, rather than claiming every possible ability interaction has a complete interpretation.
Supplemental Summoner/Beastheart mechanics and future playable-retainer flows are outside this report.

Rules findings, implications for the existing app, and unresolved interpretation are distinguished below.
The findings supply context for specification work; they do not establish new UI decisions or certify
implemented automation.

## 1. Preparation and squad formation

The printed Encounter Value for a minion represents **four minions together**. Encounter construction
buys them in sets of four, with at least two sets recommended for effectiveness. This purchasing unit
is separate from squad size: same-name minions can form squads of any size up to eight. Eight minions
can therefore be one squad of eight, two squads of four, or several smaller squads. A squad is not
required to contain exactly four or eight members.[^1][^2]

“Same name” is narrower than sharing a creature family. Goblin Spinecleavers and Goblin Snipers do not
become one squad merely because both are goblins. Two different squads of Spinecleavers also remain
separate, with separate pools and actions. The rules recommend making squad identity clear to the
players through distinguishable figures or markers; minion rules are intended to be public knowledge.[^1][^2]

A normal starting squad pool is:

`individual minion Stamina × number of members`

Eight Goblin Spinecleavers at 5 Stamina each start with a pool of 40. At preparation, the useful records
are the selected definition, member identities, squad identity, member count, current applicable
Stamina value, pool, captain relationship, and initiative placement. This is an analytical breakdown
of information required by the rules, not a proposed database schema.[^1][^4]

An initiative group can contain a squad alongside other participants. That does not merge their Stamina
or give every participant the squad action rules. Within an ordinary enemy initiative group, one
creature or squad finishes before the next acts. Within a squad, the special shared-turn rules apply.
The distinction survives the app's recent change to grouping turn entries linked to actors.[^1][^5]

**Subsequent user-selected add flow, 2026-09-13:** one squad entry defaults to four minions, with
plus/minus selecting any count from 1 through 8. The captain is additional to eight. Another squad
requires another independent entry; manual live-squad splitting/merging is excluded. These add controls
do not refill damaged squads. Preserve source-driven membership exceptions. Subsequent confirmed EV
policy: selected count × printed EV ÷ printed creature quantity, with no pack or integer rounding.
Six minions at EV 3 per four contribute EV 4.5. Preserve the printed four-minion purchase wording;
proportional costing is the user-selected calculator interpretation. Captain EV remains separate.

## 2. Attaching a captain

A captain can be any **non-minion, non-Mount** creature that speaks a language the squad understands.
It need not have the Leader organization. A squad has at most one captain, and a creature can captain
at most one squad. The general rule supplies no universal proximity radius for attachment or its
standard benefit; individual abilities can impose their own spatial requirements.[^3]

While the squad has its captain, each minion receives its stat block's “With Captain” benefit. Benefits
are not confined to damage, speed, and Stamina: the inventory includes edges on strikes, increased
melee or ranged distance, forced-movement increases, and a Sparkslinger-specific lightning-spread
increase. These are source-defined benefits, not a generic captain bonus.[^3][^4][^6]

For example, a Spinecleaver receives a +1 damage bonus to strikes. A Dwarf Axethrower instead receives
+2 Stamina; its base 7 becomes 9 while the bonus applies. Four such Axethrowers prepared with a captain
therefore start at 36 pooled Stamina. The captain's own Stamina is never added to that pool.[^3][^4][^7]

Benefits can also run in the other direction. A War Dog Tetherite squad increases its captain's stability
according to the number of tetherites within 2 squares. Losing or moving a particular member can therefore
change the captain's state without changing the captain's Stamina. This requires member identities and
spatial facts even when Stamina is pooled.[^8]

If a squad loses its captain, an eligible allied creature can become the replacement at the **start of
the next round**, without spending an action. The rule establishes a replacement opportunity, not an
automatic assignment. A slain captain and a promoted replacement remain separate creatures.[^3]

**Source limitation, before the app rulings below:** the general captain rule does not specify how to recalculate an already-damaged
pool when a Stamina bonus appears or disappears. It does not say whether to preserve raw current Stamina,
accumulated damage, or another quantity, or whether recalculation itself removes minions. For example,
four captain-boosted Axethrowers can have a damaged pool of 31 out of 36 when the captain is lost; the
source does not provide a worked transition to their new 7-per-minion value. The user-selected transitions below resolve the basic loss/gain behavior; remaining arithmetic
is explicitly bounded in the current table queue.[^1][^3][^7]

**Subsequent user ruling, 2026-09-13:** losing a captain’s Stamina bonus does not itself kill surviving
minions. User clarification: reduce total squad Stamina and keep the survivors even if the resulting
pool is below their combined stat-block Stamina. Do not enforce a pool-derived survivor count or assign
personal wounds. Subsequent user ruling: later non-area damage that exhausts the remaining pool defeats
all surviving ordinary minions. Two Stamina-4 survivors with 3 pooled Stamina are both defeated by a
later 3-damage non-area hit. This does not extend to area damage or override explicit death exceptions.
Confirmed replacement-bonus ruling, 2026-09-13: apply the bonus to surviving minions only and increase
the pool accordingly; three survivors gaining +2 each add 6. No defeated minion is revived or included
in the bonus calculation. This is a stat-bonus change, not ordinary healing or a reset of damage/turn use.
Non-exhausting damage thresholds after stat adjustment remain a separate follow-up.
This is an app ruling; the source’s shared-pool rule does establish that residual damage is not a
personal current-Stamina value attached to a surviving minion.

## 3. Starting and taking the shared turn

All squad members act together on the same initiative. A captain takes their turn **at the same time**
as the squad but has separate actions and Stamina. The source does not describe that as “captain finishes
a complete ordinary turn, then each minion takes a complete ordinary turn.” Ordinary group sequencing
must not erase this explicit exception.[^1][^2][^3]

Each minion's normal shared-turn options are limited to:

| Option | Actions available to that minion |
| --- | --- |
| Attack | One move action and one main action |
| Maneuver | One move action and one maneuver |
| Reposition | Two move actions |

Their main actions happen in concert. A member can decline to participate, or spend its available action
on an individual maneuver to address its circumstances. Shared timing does not mean every member has
identical remaining actions, can reach the same targets, or has the same conditions.[^1]

A minion that is dazed is subject to the condition's one-action restriction and cannot use triggered
or free triggered actions. That affects that creature, not every member of the squad. A prone member
can stand up individually, but then cannot also participate in the squad's main action or maneuver
that turn under the minion maneuver rule.[^1][^9]

For the app, a shared squad turn consequently needs individual participation inside it. A single squad
entry can be a useful presentation, but it cannot mean that the squad has one interchangeable action
budget or one shared set of conditions. The user subsequently selected a squad subgroup with individual
target reticles and participation controls, plus the captain’s normal actions in the shared-turn card.
See [the current contract](../table-spec.md#initiative-groups-confirmed-app-model).

## 4. Coordinated attacks and maneuvers

When multiple squad members use their signature ability on a turn, make **one roll for the squad**.
Assign the participating minions to targets. A target receives only one instance of the signature
ability; a second or third contributing minion adds damage equal to that minion's free-strike value.
Three is the maximum number contributing to the same target in this mechanism.[^1]

For Goblin Spinecleavers on a tier-2 result, without captain bonuses or other modifiers:

| Spinecleavers attacking one target | Damage | Forced movement from the signature ability |
| --- | --- | --- |
| One | 4 | Push 3 |
| Two | 6 | Push 3 |
| Three | 8 | Push 3 |

The added attackers contribute damage, not repeated copies of every effect. Three attackers do not
push the target three times. Different targets can receive different participating groups, all using
the squad's single roll. Target-specific facts and defenses still matter.[^1][^4]

The rulebook's own Pitling example has one minion deal 4 poison damage to one hero while two minions
deal 6 poison damage to another, from the same tier-2 roll. This is distinct from either rolling once
per minion or multiplying the complete ability result by the number of attackers.[^1][^10]

Grab, Hide, Knockback, and Search for Hidden Creatures are squad maneuvers. Grab, Knockback, and Search
expressly use one roll for the squad, with each target affected once. Other maneuvers can be taken
individually, normally to solve a member's own problem; doing so prevents that member from joining
the squad's main action or maneuver during the turn.[^1]

A critical hit with the squad's signature ability grants an additional main action to the minions who
**participated**. It does not give nonparticipants an action and does not create another full turn.
The ordinary critical-hit rules still define a natural 19 or 20 and their action-type requirements,
including the express exception allowing the extra main action while dazed.[^1][^11]

**Interpretation still needed:** the one-roll rule does not provide a complete algorithm for a squad
whose participants have different edges, banes, or modified characteristics. A blinded or weakened
member must not silently impose its condition on the entire squad, nor should a squad roll erase its
condition. Shared dice and per-participant/per-target resolution need a concrete source interpretation
before claiming faithful automation of those combinations.

## 5. Off-turn actions and personal conditions

Individual minions can make opportunity attacks. If several members of the **same squad** make a free
strike against the same target at the same time, sum their free-strike damage and treat it as **one
strike**. The rule is separate from the signature ability's up-to-three-contributors formula; it does
not state that same three-minion limit.[^1]

For example, four eligible Spinecleavers making simultaneous free strikes against one target contribute
8 damage before other applicable modifiers. The resulting single strike matters to damage reduction
and reactions. Free strikes by different squads should not be merged merely because their stat blocks
match. Eligibility is still checked per creature; a dazed minion cannot make its usual opportunity
attack.[^1][^4][^9]

Minions usually have few bespoke triggered abilities, but “usually” is not a prohibition. A Mindkiller
Whelp has the triggered ability Feast. Orc minions can have death-time free strikes. Those features
retain their own trigger and timing rather than being suppressed by the ordinary simplified action
economy.[^12][^13]

Conditions remain attached to their actual recipients. Save-ends effects ordinarily give each affected
creature a saving throw at the end of its turn. Nothing in the squad rules establishes one blanket
save for the whole squad. The app's existing enqueue-order/save-last convention can order that work;
it does not merge several recipients into one saving throw.[^14]

Bleeding is especially relevant: the condition causes unavoidable Stamina loss after qualifying actions,
which can make participation itself lead to squad casualties. Its wording distinguishes Stamina loss
from ordinary damage in its main rule, while the minion pooling text describes damage. Handling that
interaction should preserve the unavoidable-loss rule and individual source, with the exact pool mapping
made explicit rather than assuming damage immunity can prevent it.[^1][^15]

Malice remains the Director's shared resource, not a new pool for each minion or squad. General rules
give all monsters access to basic Malice features; family features can explicitly exclude minions.
Use each feature's eligibility, scope, cost and timing. A feature affecting the creatures acting on a
shared turn should not be multiplied merely because the UI renders several member controls. The
mapping of per-turn purchases to shared squad/captain timing requires the same care as other turn-boundary
work; the general source does not provide a complete worked squad example for every purchase.[^26]

## 6. Ordinary damage and selecting casualties

For ordinary minions, damage to a member reduces the squad pool. Crossing another individual-minion
Stamina threshold removes one member. Residual damage stays in the pool; it is not an independently
tracked wound that must remain attached to the last member hit.[^1]

User-requested source check, 2026-09-13: five Stamina-4 minions begin with a pool of 20. A 10-damage
non-area hit reduces it to 10, removing the directly hit minion and one additional nearest member.
Three survive; none is assigned a personal current Stamina of 2. A later 2 damage to any survivor
reduces the pool to 8 and removes that hit minion. The full 10 was deducted once; casualty selection
and the residual 2 do not create additional damage transactions. This follows Shared Low Stamina,
Dropping One Minion and Dropping Multiple Minions in the pinned source.[^1]

With eight 5-Stamina Spinecleavers:

| Event | Pool afterward | Living members | Explanation |
| --- | --- | --- | --- |
| Begin | 40 | 8 | Full squad |
| A takes 3 damage | 37 | 8 | No threshold crossed |
| B takes 2 damage | 35 | 7 | B is removed because its damage crossed the threshold |
| C takes 12 non-area damage | 23 | 5 | C and one additional nearest squad member are removed |
| D later takes 3 damage | 20 | 4 | The accumulated remainder crosses the next threshold |

Thus `floor(this hit's damage / individual Stamina)` alone is not a correct casualty count. For the
unchanging, ordinary case, comparing `ceil(old pool / individual Stamina)` with
`ceil(new pool / individual Stamina)` expresses the threshold difference. This is an analytical
convenience for the default rules, not a universal formula for changing membership, captain Stamina
bonuses, regeneration, or transformation.[^1]

If several directly damaged minions could be the casualty, the creature who dealt the damage chooses
which of those minions is removed. For **non-area** damage that takes out multiple minions, remove the
directly damaged minions first, then additional squad members nearest to those taken out. The rule
supplies no ordinary reach/range cap for the cinematic overflow beyond its nearest-member instruction.
Do not turn it into an extra attack against each additional casualty.[^1]

That makes identity and location necessary even though health is shared. An additional casualty could
be maintaining a condition, supplying proximity-based protection, or carrying a death effect. A count
alone cannot resolve the full outcome. The app's accepted inline casualty-assignment card is an
appropriate existing mechanism: calculate what is known and ask for the missing eligible identities.
Tied distances or incomplete location facts require an actual table choice rather than an invented map.[^1][^8]

## 7. Area damage, immunity, and weakness

Area damage counts damage to each affected minion against its squad's pool, but the ordinary area rule
only removes minions caught in the area. The printed example is three 5-Stamina Spinecleavers each hit
for 6 fire damage: the pool loses **15**, not 18, and the squad members outside the area are unscathed.
It is therefore wrong to use unrestricted non-area overflow for every attack.[^1]

For that equal-damage, otherwise unmodified example, capping each affected member's contribution at its
individual Stamina reproduces the stated result. The source example does not fully resolve how to
combine unequal per-target damage, already-partially-damaged pools, or heterogeneous defenses; do not
present one simplified formula as proven for every area case.

Minion immunity and weakness are a further special rule: apply the applicable modifier to the squad
**once**, even when several members share it, and apply these effects last. The text explicitly allows
them to drop or save multiple minions even from an area effect. General damage rules say weakness
precedes immunity and only the highest applicable value of each applies.[^1][^16]

An earlier interpretation treated three affected 3-Stamina Pitlings as contributing 9 area damage,
then added their holy weakness 3 and inferred a fourth casualty outside the area. That inference is
**not the selected app interpretation**. The source says the modifiers can remove multiple minions,
but does not explicitly authorize removing a minion outside the area.[^1][^10]

**Selected app interpretation, 2026-09-13:** the area-only casualty restriction takes priority. Area
damage cannot exceed the combined applicable Stamina of affected minions in that squad, regardless of
modifiers that would increase it further. Enforce this ceiling on the final pool damage, not just on
the displayed casualty count. Immunity and weakness still apply once per squad; they do not enable
non-area overflow. For the Pitling example the pool loses at most 9, and the fourth Pitling outside the
area survives. Three affected 5-Stamina minions similarly cap the final pool damage at 15.[^23]

When several squads are affected, preserve their separate pools and apply each bound to that squad's
affected members. A captain's own damage is separate. Mixed defenses and damage types still require
source-sensitive calculations, but outside-area casualty allocation is no longer an open app question.
The earlier claim that allowing a final cap to limit weakness was necessarily an implementation error
is superseded by this interpretation; the source's ambiguity must not be presented as settled contrary
evidence.

## 8. Casualties are events, not just pool subtraction

A minion taken out of the fight counts as reduced to 0 Stamina for triggering effects. The general
rule allows death or another form of removal from the fight; the actual disposition matters when a
feature specifically requires a death rather than merely reaching zero.[^1]

Representative consequences show why selecting casualties is part of required resolution:

| Example | Consequence | Lifecycle implication |
| --- | --- | --- |
| War Dog Tetherite | Its collar explodes for 1d3 damage to adjacent enemies and objects. | Each casualty retains its location and its own explosion source. |
| Orc Razor | Can make a free strike before dying. | Removal has a source-timed response, not just immediate disappearance. |
| Rotting Zombie | Its former space becomes difficult terrain with a later slowing effect. | The originating creature can be gone while its spatial effect persists. |
| Hollowbone Launcher | Explodes for damage to adjacent creatures. | Casualties can cause further damage, including to other nearby foes. |
| Orc Glorifier | Its granted melee-strike edge lasts until it and every other Glorifier in its squad are killed. | The lifetime depends on squad membership and multiple deaths. |

These examples are in their individual stat blocks.[^8][^13][^17] They do not all share the same enemy,
ally, area, or damage wording, so a universal “minion death explosion” rule would be wrong.

The app should retain the original damage event, pool change, selected casualties, and each resulting
source effect in a causally linked history. This follows its existing fine-grained bookkeeping and
partial-automation contracts. Applying a missing casualty choice must not deduct the original damage
again. Undo/redo must restore recorded identities and consequences under existing authority and window
rules, without resurrecting a minion merely because a displayed count was edited.[^23]

## 9. Reinforcements, promotion, and revival

Minions can appear after encounter setup. Lumbering Egress can produce minions through attacks,
maneuvers, and villain actions. Its Abyssal Protectors also responds when the last allied minion on the
map dies, or when the egress crosses its stated Stamina threshold, by creating eight ensnarers. An empty
squad or even no currently living minions is therefore not automatically the end of the encounter.[^18]

General monster summoning guidance says a summoned creature ordinarily takes its turn immediately after
the summoner unless specified otherwise. The app's default new-turn placement at the bottom remains
subject to explicit source timing. Newly created minions still need valid same-name squads and spatial
placement; “an encounter now has four more minions” does not identify their pool or turn participation.[^1][^18]

Several sources change the kind of creature rather than simply adding an ordinary minion:

- **Mindkiller Whelp — Feast:** after reducing a non-minion to zero, it can transform into a Mindkiller
  with Stamina equal to the pre-transformation squad pool; the pool then loses the whelp's Stamina.
  The reference for the subtraction requires care: whether “whelp's Stamina” denotes its minion value
  or the newly assigned amount should be resolved explicitly. It is unsafe to replace this with
  ordinary minion death processing.[^12]
- **Kobold Signifer — Upholding High Standards:** after a Signifer is killed, a kobold minion can enter
  its space, take up the standard, and replace its stat block with the Signifer stat block, without
  spending an action. Squad departure, current Stamina conversion, and turn allowance preservation
  are not specified as a complete transaction in that feature.[^19]
- **Elemental Mote — Spark of Life:** on its turn, the mote can leave the encounter to revive an adjacent
  dead Soot Crow, Brambleguard, or Ceramic Horse at 3 Stamina. The Soot Crow is itself a minion. Leaving
  the encounter is not expressly a death, and restoring a minion raises pool/membership questions that
  the general non-healing rule does not fully explain.[^20]
- **Demon Malice:** a demon minion can transform into a non-minion horde demon of the same level. It
  expressly changes organization but does not supply a general pooled-Stamina conversion algorithm.[^21]

These cases establish the need for source-aware membership changes. They do not establish unrestricted
in-combat squad merging, splitting, or refilling. The basic rules permit preparing different squad
sizes, but provide no general damaged-pool transfer procedure for arbitrary reassignment. A new squad
of reinforcements and new members inserted into an existing damaged squad are different operations.

## 10. Troll exceptions to ordinary death and healing

The general rule says minions cannot become winded, regain Stamina, or gain temporary Stamina during
battle. Troll stat blocks explicitly supply exceptions involving their **squad pools**; their wording
must not be discarded because the default minion rule is simpler.[^1][^22]

Troll Ravagers and Crack Troopers restore pooled Stamina through their signature abilities based on
half the damage dealt. Their Group Appetite trait also specifies death only under particular zero-pool
conditions: acid/fire reducing the pool to zero, acid/fire while it is already zero, or ending their
turn with the pool at zero. A standard threshold-to-death formula alone cannot implement that trait.
The general monster rule about healing through multi-target damage also limits healing to one damage
instance unless specified otherwise; squad contribution and this exception need to be evaluated
together rather than summing every target's damage automatically.[^1][^22]

Troll Whelps add a transformation case. When two or more are simultaneously reduced to zero by damage
other than acid or fire, half become Troll Limbjumbles at 4 Stamina. The general round-down rule applies
to odd halves. Preserve the simultaneous casualty set; processing every casualty as an unrelated
one-minion event would miss the trigger.[^22][^24]

Limbjumbles have a start-of-squad-turn rule increasing the pool as if each limbjumble were at full
Stamina. This expressly changes the pool, but the wording should not be mistaken for repeatedly adding
a whole fresh pool on top of existing Stamina. The intended refill computation, surviving membership,
and interaction with partially initialized transformed minions require a precise interpretation.
Nothing in that sentence explicitly resurrects previously removed members.[^22]

There is also a source-data limitation: the pinned Ravager/Crack Trooper/Whelp/Limbjumble weakness
entries contain a numeric acid weakness followed by a bare “fire” entry. The book-specific Ravager
Markdown contains the same omission. Its explicit acid/fire death triggers remain readable, but the
missing numeric fire weakness cannot be invented for automated damage calculations.

## 11. Squad depletion and encounter closeout

For ordinary squads, once the last minion is taken out and required resulting effects are resolved,
there are no living members left to act. A surviving captain is still a separate creature with its own
Stamina; disappearance of the squad does not kill the captain. Conversely, a captain's death does not
normally destroy surviving minions. Source exceptions and remaining granted work must be honored before
assuming the entire relationship can be discarded.[^1][^3]

The rules also offer an **optional Last-Stand Stamina** procedure for finishing a clearly won battle:
ordinary enemies drop to 1 Stamina and a minion squad's pool becomes equal to its member count. This is
an explicitly optional encounter-finishing rule, not automatic behavior when a squad becomes small or
when the Director ends combat. It does not authorize silently adopting another app tool.[^1]

The existing app contracts govern administrative closeout:

| Event | Already-established app behavior |
| --- | --- |
| Director ends combat normally | Stop structured turn play; do not fabricate a last squad/captain turn or its boundary effects. |
| Required effects remain | Resolve already-caused work before final cleanup; unused optional combat responses close under the existing window rules. |
| Normal cleanup finishes | Remove defeated foes under the roster policy, apply confirmed rewards/choices once, and archive the encounter. |
| Void, keep current state | Preserve the selected current gameplay state and skip normal ending rewards/effects. |
| Void, restore starting state | Restore the combat-start Director-panel snapshot, including original squad/captain relationships and related gameplay state; remove later additions. |
| After either terminal path | Preserve readable history; gameplay undo cannot reopen the archived encounter. |

These are app decisions, not minion rules quoted from the book.[^23] Neither retaining surviving foes
nor loading a saved encounter is permission to heal an existing squad automatically. Postcombat survivor
reorganization and any restoration should have an explicit operation/source; the battle-only restriction
on regaining Stamina does not itself specify how a pool refills between encounters.

## 12. Implications and remaining interpretation work

The existing design already supplies several necessary tools: prepared squads/captains in saved
encounters; actor-linked initiative entries; source-directed immediate turns; minimal inline spatial
and casualty inputs; individual source attribution; precise grants and reversals; and Director manual
resolution through result/stat adjustments. Those decisions need not be asked again merely because a
minion example uses them.[^23]

The most significant conceptual addition is **shared participation in a squad turn, including a captain**.
The source requires it. The app can preserve its turn-entry abstraction, but must represent the source's
shared timing and individual action/effect state. Treating a squad as one selectable participant with
member controls is now the selected presentation, including per-target participant counts and separate
captain actions. Dragging a turn entry does not itself split squad membership or move pooled Stamina.

The following issues remain bounded rather than silently decided:

| Issue | Established facts | What remains unresolved |
| --- | --- | --- |
| Captain Stamina bonus changes | Bonus exists only while attached; pool is shared; captain has separate Stamina. | Confirmed loss outcome: reduce total squad Stamina without removing minions, even when the pool is below their combined values. Later non-area damage exhausting the pool defeats all survivors, subject to explicit source exceptions. Confirmed gain outcome: add the bonus for surviving members only, without revival. Non-exhausting damage thresholds after adjustment remain a separate follow-up. |
| Midcombat membership changes | Preparation can use varied same-name squads; sources can create, revive, promote, or transform members. | Manual live splitting/merging is excluded; add a new entry for a new squad. Source-driven creation, revival, promotion and transformation still need their own pool, casualty and turn handling. |
| Pool floor and later damage after stat adjustment | Bonus loss causes no casualties; later non-area damage exhausting the pool defeats remaining ordinary members. | Non-exhausting casualty thresholds and whether bonus loss reaching/passing zero clamps or retains negative Stamina need a numeric contract. |
| Area exhaustion after stat adjustment | Outside-area minions cannot die; the non-area exhaustion ruling does not override that restriction. | Pool/threshold continuation if area damage exhausts the pool while unaffected members survive. Do not refill or remove survivors to normalize state. |
| Different modifiers within one squad attack | One squad roll; participation and targets remain individual. | How differing participant advantages and target modifiers select outcomes without erasing either rule. |
| Area damage with mixed defenses | Selected app interpretation caps final pool damage at the combined Stamina of affected members, regardless of modifiers; no outside-area casualties. Immunity/weakness apply once per squad. | Precise mixed-damage/defense calculation still needs source coverage; outside-area overflow is settled as unavailable. |
| Captain and squad timing | They act at the same time with separate action options and health. | Confirmed: global turn effects fire once per shared turn, not per participant; personal effects/saves remain individual. Personal extra captain turns are captain-only. Explicit multi-recipient grants and shared-turn removal retain their separate open cases. |
| A captain with multiple turns | Captain eligibility does not exclude Solos; some creatures get several full turns. | User ruling, 2026-09-13: personal extra turns belong only to the captain; squad participation does not refresh and attachment/benefits persist. The shared squad/captain entry is distinct from personal extra entries and follows existing legal entry selection. Explicit multi-recipient grants remain a separate source case. |
| Troll and promotion exceptions | Explicit pool healing, delayed deaths, transformation, and revival exist. | Precise membership/current-value transactions and incomplete source values. |

Wode Elf Guerrilla illustrates why captain timing deserves special attention: while acting as a captain,
its Do Not Hesitate in the Wode can make itself and allies take immediate turns when its trigger is met.
Its target text is broader than the attached squad. It should not be silently narrowed to that squad
or treated as an ordinary independent extra turn for each minion without reading the combined rules.[^25]

These are candidates for bounded source interpretation and then, where necessary, table-design discussion.
They are not a demand for a dedicated UI for every trait. The ordinary lifecycle can use the established
shared operations and action cards while exceptional or ambiguous steps remain honestly identified.

## Sources

All rules below are MCDM *Draw Steel: Monsters* or *Draw Steel: Heroes*, accessed through the pinned local
Steel Compendium revision stated above. Section titles and SCC identifiers identify the text; no original
printed page numbers or publication dates are inferred from the extracted files. Markdown/YAML/JSON
representations of the same entry are not independent corroboration. Application contracts are listed
separately from rules evidence.

[^1]: MCDM, *Draw Steel: Monsters*, [Monster Basics](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md), SCC `mcdm.monsters.v1/chapter/monster-basics`. Sections Using Minions; Shared Low Stamina; Dropping One/Multiple Minions; Minions and Area Effects; Minion Weakness and Immunity; Acting Together and its subsections; Creatures Who Summon/Heal Via Damage; Minions Come in Groups of Four; Build Initiative Groups; Optional Rule: Last-Stand Stamina.
[^2]: MCDM, *Monsters*, [Organized as Squads](../../vendor/steel-compendium/en/unified/md/rule/monster/squad.md), SCC `mcdm.monsters.v1/rule.monster/squad`.
[^3]: MCDM, *Monsters*, [Attached Squad Captain](../../vendor/steel-compendium/en/unified/md/rule/monster/captain.md), SCC `mcdm.monsters.v1/rule.monster/captain`; Separate Actions and Stamina, Captain Benefits, I Am the Captain Now.
[^4]: MCDM, *Monsters*, [Goblin Spinecleaver](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-spinecleaver.md), SCC `mcdm.monsters.v1/monster.goblin.statblock/goblin-spinecleaver`.
[^5]: MCDM, *Heroes*, [Combat Round](../../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md), SCC `mcdm.heroes.v1/rule.combat/combat-round`; Enemies Act in Groups.
[^6]: MCDM, *Monsters*, [War Dog Sparkslinger](../../vendor/steel-compendium/en/unified/md/monster/war-dog/2nd-echelon/statblock/war-dog-sparkslinger.md), With Captain. See also the [source-qualified inventory](minion-statblock-inventory.csv), whose rows retain individual SCC IDs and source paths.
[^7]: MCDM, *Monsters*, [Dwarf Axethrower](../../vendor/steel-compendium/en/unified/md/monster/dwarf/statblock/dwarf-axethrower.md), SCC `mcdm.monsters.v1/monster.dwarf.statblock/dwarf-axethrower`.
[^8]: MCDM, *Monsters*, [War Dog Tetherite](../../vendor/steel-compendium/en/unified/md/monster/war-dog/1st-echelon/statblock/war-dog-tetherite.md), SCC `mcdm.monsters.v1/monster.war-dog.1st-echelon.statblock/war-dog-tetherite`; captain stability trait and Loyalty Collar.
[^9]: MCDM, *Heroes*, [Dazed](../../vendor/steel-compendium/en/unified/md/condition/dazed.md), SCC `mcdm.heroes.v1/condition/dazed`.
[^10]: MCDM, *Monsters*, [Pitling](../../vendor/steel-compendium/en/unified/md/monster/demon/1st-echelon/statblock/pitling.md), SCC `mcdm.monsters.v1/monster.demon.1st-echelon.statblock/pitling`.
[^11]: MCDM, *Heroes*, [Critical Hit](../../vendor/steel-compendium/en/unified/md/rule/combat/critical-hit.md), SCC `mcdm.heroes.v1/rule.combat/critical-hit`.
[^12]: MCDM, *Monsters*, [Mindkiller Whelp](../../vendor/steel-compendium/en/unified/md/monster/voiceless-talker/statblock/mindkiller-whelp.md), SCC `mcdm.monsters.v1/monster.voiceless-talker.statblock/mindkiller-whelp`; Feast.
[^13]: MCDM, *Monsters*, [Orc Razor](../../vendor/steel-compendium/en/unified/md/monster/orc/statblock/orc-razor.md) and [Orc Glorifier](../../vendor/steel-compendium/en/unified/md/monster/orc/statblock/orc-glorifier.md), SCC family `mcdm.monsters.v1/monster.orc.statblock`.
[^14]: MCDM, *Heroes*, [Saving Throw](../../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md), SCC `mcdm.heroes.v1/rule.general/saving-throw`.
[^15]: MCDM, *Heroes*, [Bleeding](../../vendor/steel-compendium/en/unified/md/condition/bleeding.md), SCC `mcdm.heroes.v1/condition/bleeding`.
[^16]: MCDM, *Heroes*, [Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md) and [Damage Weakness](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-weakness.md), SCC family `mcdm.heroes.v1/rule.damage`.
[^17]: MCDM, *Monsters*, [Rotting Zombie](../../vendor/steel-compendium/en/unified/md/monster/undead/1st-echelon/statblock/rotting-zombie.md) and [Hollowbone Launcher](../../vendor/steel-compendium/en/unified/md/monster/undead/2nd-echelon/statblock/hollowbone-launcher.md), death-triggered traits.
[^18]: MCDM, *Monsters*, [Lumbering Egress](../../vendor/steel-compendium/en/unified/md/monster/demon/2nd-echelon/statblock/lumbering-egress.md), SCC `mcdm.monsters.v1/monster.demon.2nd-echelon.statblock/lumbering-egress`.
[^19]: MCDM, *Monsters*, [Kobold Signifer](../../vendor/steel-compendium/en/unified/md/monster/kobold/statblock/kobold-signifer.md), SCC `mcdm.monsters.v1/monster.kobold.statblock/kobold-signifer`; Upholding High Standards.
[^20]: MCDM, *Monsters*, [Elemental Mote](../../vendor/steel-compendium/en/unified/md/monster/elf-high/statblock/elemental-mote.md) and [Soot Crow](../../vendor/steel-compendium/en/unified/md/monster/elf-high/statblock/soot-crow.md), SCC family `mcdm.monsters.v1/monster.elf-high.statblock`.
[^21]: MCDM, *Monsters*, [Demon Malice: Level 1](../../vendor/steel-compendium/en/unified/md/monster/demon/1st-echelon/demon-malice-level-1-malice-features.md), minion-to-horde transformation feature.
[^22]: MCDM, *Monsters*, [Troll Ravager](../../vendor/steel-compendium/en/unified/md/monster/troll/statblock/troll-ravager.md), [Troll Crack Trooper](../../vendor/steel-compendium/en/unified/md/monster/troll/statblock/troll-crack-trooper.md), [Troll Whelp](../../vendor/steel-compendium/en/unified/md/monster/troll/statblock/troll-whelp.md), and [Troll Limbjumble](../../vendor/steel-compendium/en/unified/md/monster/troll/statblock/troll-limbjumble.md), SCC family `mcdm.monsters.v1/monster.troll.statblock`.
[^23]: Application contracts, distinct from game rules: [Table specification](../table-spec.md), [Monster catalog and saved encounters](../monster-catalog-spec.md), [Rules adaptation principles](../rules-adaptation-principles.md), and [Gameplay decision record](../gameplay-decision-record.md).
[^24]: MCDM, *Heroes*, [Always Round Down](../../vendor/steel-compendium/en/unified/md/rule/general/always-round-down.md), SCC `mcdm.heroes.v1/rule.general/always-round-down`.
[^25]: MCDM, *Monsters*, [Wode Elf Guerrilla](../../vendor/steel-compendium/en/unified/md/monster/elf-wode/statblock/wode-elf-guerrilla.md), SCC `mcdm.monsters.v1/monster.elf-wode.statblock/wode-elf-guerrilla`; Do Not Hesitate in the Wode.

[^26]: MCDM, *Monsters*, [Malice](../../vendor/steel-compendium/en/unified/md/rule/monster/malice.md), SCC `mcdm.monsters.v1/rule.monster/malice`; Earning Malice, Spending Malice, Basic Malice. For an explicit family restriction, see [Human Malice](../../vendor/steel-compendium/en/unified/md/monster/human/human-malice.md).
