# V107 Summoner level-one independent source audit

ENGINE; 2026-09-21. Source-only audit against main `a0792cd`; Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`. No implementation verdict or test execution. All paths below are relative to `vendor/steel-compendium/en/unified/md/`. Only that pinned source was used.

## Scope and choices

`class/summoner.md`, especially Summoner Advancement, grants level-one Minions, Essence, Summoner Strike, Strike for Me, Minion Bridge, Formation, Quick Command, Summoner Abilities, circle features and Portfolio. `feature/summoner/level-1/call-forth.md` and its ability supply Call Forth. There are 28 level-one feature files and 14 level-one ability files. The latter comprise four universal envelopes, four quick commands, and six 5-Essence alternatives. These counts exclude abilities embedded in minion stat blocks and activations embedded in feature prose.

- Reason is 2. Assign M/A/I/P using 2/2/-1/-1, 2/1/1/-1, 2/1/0/0, or 1/1/1/0. Reason potency gives weak/average/strong 0/1/2 at level one. No alternative potency characteristic.
- Class Stamina 15, 8 Recoveries, +6 Stamina at later levels. Magic and Strategy fixed; choose two intrigue/lore skills. Do not make the already granted skills extra selectable gains.
- Choose one circle, one formation, one quick command, one 5-Essence ability. No level-one class kit: Summoner's Kit appears at level three. No level-one perk in advancement.
- `summoner-circle.md` and `portfolio.md`: Blight/Demon, Graves/Undead, Spring/Fey, Storms/Elemental. Communication with the respective Abyssal/Undead/Fey/Elemental keyword is possible without a shared language; it is not an invented named-language grant.
- Advancement's Minions column is `1, 1, 3, 3`. **Interpretation:** select two different signature entries and two different 3-Essence entries from the circle portfolio. `portfolio.md` establishes learned creatures and circle restriction but does not explicitly spell out distinctness or translate this column into a pick instruction. Alternative readings include duplicate entries or treating the numerals as individual summons; the latter conflicts with the portfolio being learned types and 3-Essence stat blocks summoning two creatures. Record this interpretation/uncertainty in the slice/questions rather than calling an explicit distinctness sentence printed law.

## Formation and circle effects

Paths in this section are `feature/summoner/level-1/<slug>.md`; circle pairing is in `1st-level-circle-features.md`.

| Choice | Source effects and boundaries |
| --- | --- |
| Horde (`horde-formation`) | Max minions +4 (8 to 12); own-turn free signature summons four instead of three. |
| Platoon (`platoon-formation`) | Squad damaging ability adds Reason damage to ONE chosen target. Not every target, not once per minion. |
| Elite (`elite-formation`) | Each minion gains 3 Stamina and 1 stability; not the hero. |
| Leader (`leader-formation`) | No squad-destruction damage to hero; may take damage instead of minion within range. Light armor/light weapon treasure permission without a kit. Normal free strikes return only at level FOUR with the qualifying treasure, not now. Treasure damage applies to rolls from non-minion space, with the printed Strike for Me exception. |
| Blight | Death Snap: own demon dying unwillingly may deal free-strike damage to adjacent creature before death. Soulsense: trails from souls in line of effect over past five times level minutes; respite companion exception. |
| Graves | Dead Men Tell All Tales: corpse died within week; first question free, voluntary answer/may lie; later questions medium Reason test, failure/consequence permanently breaks connection. Rise!: once/round unwilling death in range, triggered signature undead in dead creature's space, can exceed maximum but must organize into squad, cannot act until next turn; free triggered action if dead creature was a minion. |
| Spring | Fairy Whispers: outside-combat task returns rumor, Reason tiers govern veracity/obscurity; each subsequent rumor that day OR location takes bane. Pixie Dust: hero Recoveries +2 (10); own fey death within range permits spending a Recovery for 2R temporary Stamina to each adjacent non-minion ally. No unwilling-death restriction printed for this trigger. |
| Storms | Elemental Affinity: Call Forth nonsignature elemental also summons a free signature sharing an Element keyword OR an Elemental Mote. Heart of Nature: sense Elemental/Dragon within mile/emotions; social Intuition tests with them minimum tier two. |

Formation/quick-command replacement is at respite, per `formation.md` and `quick-command.md`. Prune dependent portfolio grants on circle changes.

## Hero action envelopes and embedded activations

Each row cites `feature/ability/summoner/level-1/<slug>.md`; six heroic costs are independently established by `feature/summoner/level-1/summoner-abilities.md`.

| Envelope | Source requirement / result |
| --- | --- |
| Call Forth (`call-forth`) | Main, self, Summoner's Range. Signature costs one Essence per minion; other entries cost the stat block amount for its SET number. Level-one 3-cost entries summon TWO, not one. Cost/payment and manual summon record must not imply actors were created. |
| Summoner Strike (`summoner-strike`) | Main, Magic/Melee/Ranged/Strike, melee 1 or ranged 5, creature/object. Fixed R damage (2), target Reason < weak slows (save ends). NO power roll. Feature replaces both hero melee/ranged free strikes, including granted free strikes. Charge only with melee. |
| Strike for Me (`strike-for-me`) | Free triggered action when hero granted triggered free strike/signature, INSTEAD of hero attack. Reason roll chooses 3/5/7 minions for free strikes; natural 19/20 all minions in range. Edge when granted signature; preserve any target restriction. Tier numbers are minion counts, not damage. |
| Minion Bridge (`minion-bridge`) | Maneuver, own minion melee 1; shifts including vertically through minion squares. Embedded **1 Essence** allows adjacent ally to travel alongside and finish adjacent to last minion. |
| Focus Fire! (`focus-fire`) | Triggered, self/ally deals damage. Surges equal own minions adjacent to target, maximum three, usable on trigger. Embedded **1 Essence** gives edge if triggering ability uses power roll. |
| Halt! (`halt`) | Triggered creature starts moving/moves/is force moved. Summon signature adjacent, optionally waive collision damage; alternatively existing minion shifts speed adjacent before other effects. No printed optional Essence spend. |
| Not Yet! (`not-yet`) | Triggered ally would die/destroy; minion must be last squad member. Reduce triggering damage to leave 1 Stamina. Not a general resurrect action. |
| Shield! (`shield`) | Triggered self/ally targeted by strike; adjacent existing minion within strike distance becomes target. Embedded **1 Essence** instead summons signature adjacent to intercept. |
| Distraction Tactics (`distraction-tactics`) | **5**, free maneuver; encounter-long (or until hero dying) minion enhancement, I < weak taunt EoT; potency +1 per minion joining strike. Manual future-strike state, not immediate condition on selected foe. |
| Essence Transfer (`essence-transfer`) | **5**, main, Magic/Melee/Strike; Reason roll 5/8/11 + R corruption = 7/10/13 at R2; gain 2/3/4 charges. Spend 1 charge on Recovery permission or surge, 2 on signature summon; repeats allowed, remainder expires immediately. These three embedded choices spend CHARGES, not more Essence. |
| Explosive Parade (`explosive-parade`) | **5**, main; roll summons 4/5/6 signature minions ignoring cap/no squads, immediately moving toward targets; each explosion deals 2 and pushes 1, stack when same target. Existing eligible unacted minions may join. No death effects/Essence from these deaths. Do not compile 4/5/6 as damage or promise generic minion actors. |
| Rallying Cry (`rallying-cry`) | **5**, maneuver, 3 burst allies: each chooses two surges OR next strike +R damage. |
| Shields of Essence (`shields-of-essence`) | **5**, maneuver, Reason roll selects 3/4/5 creatures, encounter duration; each gets one free-triggered halve-damage use, then ends. Count is not damage. |
| Summoner's Sword (`summoners-sword`) | **5**, main, Magic/Melee/Strike, melee 3; R/2+R/4+R damage = 2/4/6 at R2, plus 2 for each ally adjacent to hero. No Weapon keyword. Adjacent allies cannot silently default to zero while claiming full automated source result. |

Beyond those envelopes, expose or explicitly account for circle activations (Death Snap, corpse questions, Rise!, rumor test, Pixie Dust), willing sacrifice, start-combat/start-turn summons, and selected minion commands/traits. Stable named manual actions can make these reachable without claiming actor automation. Three hero embedded Essence spends are Bridge/Focus/Shield, each 1. Essence Transfer has three charge choices; Rallying Cry has two recipient choices; Shields has its subsequent consumption action. Minion paid traits add another five named activations (below). Do not conflate these different units into one resource debit.

## Essence and summon boundaries

`feature/summoner/level-1/essence.md`: initial Essence = Victories; own turn +2; first unwilling death of ANY minion in range per ROUND +1; encounter end clears. Do not reuse Elementalist generation solely because both resources are named Essence. Outside combat costs waived but same paid ability/effect cannot repeat until a Victory or respite. A persisted manual record must name any untracked repeat restriction.

Willing sacrifice paragraph says sacrifice “one or more” eligible minions “to reduce the cost by 1” and allows sacrificing more minions than cost reduction. This is textually ambiguous about a per-minion discount. Eligibility excludes minions that already used main action or maneuver that turn; must be in range. **Keep discount amount/manual adjudication explicit; do not infer automated one-for-one reduction or trigger unwilling-death income.** Record alternatives if implementing later.

`feature/summoner/level-1/minions.md` establishes Summoner's Range = 5+R (7), line of effect, max eight minions, two homogeneous squads of up to eight each. Start encounter up to two signature minions free; own turn up to three (Horde four). Ground placement unless fly/hover. These are distinct from paid Call Forth.

Squad Stamina is pooled; each member's Stamina of damage destroys a member, hit member first then nearest. After squad wiped, hero suffers **2+level** (3), not arbitrary overflow (Leader exception). Area caps deaths at members actually in area and ignores excess; multitarget strikes use largest single damage instance, riders affect each. Minions cannot be winded/healed/gain temporary Stamina. Hero resolves minion saves as one instance of each condition. Immunities/weaknesses apply once to squad if any member has them.

Minions act during hero turn, before/between/after hero actions. Choices are move+main (not Heal/Defend), move+maneuver, or two moves. Simultaneous free strikes sum as one; squad signature against same target uses one effect plus each extra member's free-strike damage. Do not assume core foe squad restrictions transfer. Maneuver rolls are fixed **8 + minion characteristic + participating members in distance**, not dice. Escape maneuver may exclude a member from squad action. Minions use their own characteristics for resistance/maneuvers/tests; R references and potency use the hero. Shared hero surge pool.

Outside combat max four free minions; nonsignatures require Victories at least cost, summon printed set; simple tasks in previously visited locations, not followers/project workers. Entering combat these outside minions finish task/dismiss, not an extra army. Unconscious/unable hero cannot summon; minions cannot damage and act toward safety. End combat finish tasks/dismiss. Minions manifest hero soul, not separate soul-death triggers.

`chapter/summoner-advice.md` Standby Minions is an optional Director-discretion rule, NOT default. `docs/table-spec.md` defers rules-specific summon/companion behavior and turn integration. V107 can therefore describe editor/derived/manual coverage, not claim full summon combat.

## Portfolio source inventory

All eligible entries reside in `monster/minion/summoner/<portfolio>/statblock/<slug>.md`. Exclude `monster/rival/.../summoner` and `monster/retainer/summoner` lookalikes. There are **25 eligible entries: 13 signature (3 demon, 3 undead, 3 fey, 4 elemental), 12 costing 3 (three per portfolio)**. All 3-cost entries summon two. Higher-cost minions and champions are outside level one.

Each source's body is authoritative for embedded traits; the following mechanically extracted inventory preserves their names and nominal values for independent implementation comparison. R-valued immunity/stability derives from hero Reason, not the minion's Reason. Elite changes individual Stamina/stability, not free-strike damage.

| Source | Cost | Stamina/member | Free strike | Embedded names |
| --- | --- | --- | --- | --- |
| `demon/statblock/archer-spittlich.md` | 3 essence for two minions | 5 / 5 | 5 | Splash Strike; Soulsight |
| `demon/statblock/ensnarer.md` | 1 essence per minion summoned | 2 | 2 | Extended Barbed Strike; Soulsight |
| `demon/statblock/fanged-musilex.md` | 3 essence for two minions | 6 / 6 | 5 | Mawful Strike; Soulsight |
| `demon/statblock/rasquine.md` | 1 essence per minion summoned | 2 | 2 | Skulker; Soulsight |
| `demon/statblock/razor.md` | 1 essence per minion summoned | 2 | 1 | Teeth!; Soulsight |
| `demon/statblock/twisted-bengrul.md` | 3 essence for two minions | 5 / 5 | 4 | Mind Twist 2d10 + R (Signature Ability); Soulsight |
| `elemental/statblock/brisk-gale.md` | 1 essence per minion summoned | 2 | 1 | Cutting the Air; Whirlwind |
| `elemental/statblock/crux-of-ash.md` | 3 essence for two minions | 6 / 6 | 5 | Soot Strike; Ashen Cloud (1 Essence) |
| `elemental/statblock/desolation-of-sand.md` | 3 essence for two minions | 5 / 5 | 4 | Burying Strike; Sand Through Your Fingers; Shifting Sand Pit (1 Essence) |
| `elemental/statblock/elemental-mote.md` | 1 essence per minion summoned | 1 | 1 | Dweomer Burst; Catalyst |
| `elemental/statblock/fire-plume.md` | 1 essence per minion summoned | 1 | 2 | Spitfire Strike; Pyre |
| `elemental/statblock/flow-of-magma.md` | 3 essence for two minions | 6 / 6 | 4 | Molten Strike 2d10 + R (Signature Ability); Eruption (1 Essence) |
| `elemental/statblock/walking-boulder.md` | 1 essence per minion summoned | 3 | 1 | Obstruct; Pile Up (1 Essence) |
| `fey/statblock/nixie-soakreed.md` | 1 essence per minion summoned | 1 | 1 | Water Weird; Soaking Bog; Minuscule |
| `fey/statblock/pixie-bellringer.md` | 1 essence per minion summoned | 2 | 1 | Ringing Strike; Fairy Chime; Minuscule |
| `fey/statblock/pixie-hydrain.md` | 3 essence for two minions | 5 / 5 | 5 | Burning/Healing Rain 2d10 + R (Signature Ability); Minuscule |
| `fey/statblock/pixie-loftlilly.md` | 3 essence for two minions | 5 / 5 | 4 | Floating Toxins; Minuscule |
| `fey/statblock/sprite-dandeknight.md` | 1 essence per minion summoned | 2 | 1 | Magic Strike; Staccato Swings; Minuscule |
| `fey/statblock/sprite-orchiguard.md` | 3 essence for two minions | 8 / 8 | 4 | Fairy Guard; Minuscule |
| `undead/statblock/grave-knight.md` | 3 essence for two minions | 6 / 6 | 5 | Knight Strike 2d10 + R (Signature Ability); To the Grave |
| `undead/statblock/husk.md` | 1 essence per minion summoned | 3 | 1 | Rotting Strike |
| `undead/statblock/shrieker.md` | 1 essence per minion summoned | 1 | 2 | Howling Strike; Shrill Alarm |
| `undead/statblock/skeleton.md` | 1 essence per minion summoned | 2 | 1 | Bonetrops |
| `undead/statblock/stalker-shade.md` | 3 essence for two minions | 6 / 6 | 5 | Shadow Strike; Shadow Phasing |
| `undead/statblock/zombie-lumberer.md` | 3 essence for two minions | 8 / 8 | 1 | Zombie Clutch; Death Grasp |

### Embedded minion costs and tricky effects

- Elemental Mote **Catalyst**: free once/turn transformation into adjacent allied signature retaining Stamina; alternative **1 Essence** into elemental signature not in portfolio, as if newly summoned. Reassign squad when name differs. Do not accidentally grant every signature as a learned selection.
- Walking Boulder **Pile Up (1)**, Crux of Ash **Ashen Cloud (1)**, Desolation of Sand **Shifting Sand Pit (1)**, Flow of Magma **Eruption (1)** are paid death traits, not automatic free environmental changes. Walking Boulder's “Traits with an Essence Cost” callout explicitly confirms the payment rule.
- Rasquine **Skulker** is a free maneuver after teleport, once/turn. Sprite Dandeknight **Staccato Swings** gives two free strikes (sum if same target); **Magic Strike** offers seven types. Nixie **Water Weird** is a move-action teleport to water within five, not its own created bog.
- Four eligible embedded rolled signatures: Twisted Bengrul **Mind Twist**, 4/6/8 damage, P<0/1/2 twisted save ends (custom effect, not a core condition); Flow of Magma **Molten Strike**, 4/6/8 fire, shift3/4/5 plus burning path; Pixie Hydrain **Burning/Healing Rain**, 5/7/9 acid, M<0/1/2 weakened EoT/EoT/save ends, then one Recovery-or-condition-end recipient after squad use; Grave Knight **Knight Strike**, 5/7/9 corruption, M<0/1/2 bleeding EoT/EoT/save ends. Each targets one creature/object PER MINION and rolls 2d10+hero R. They are not hero-cast single-target effects.
- Free-strike riders include Ensnarer/Fanged Musilex pulls, Archer Spittlich splash/no-shift, Husk slow with adjacency potency, Zombie Lumberer grab and start-turn corruption, Crux ally hiding, Desolation slow/conditional restraint. Keep actor/range/duration and conditional state explicit.
- Death/area traits include skeleton Bonetrops, grave-knight To the Grave, lumberer Death Grasp, elemental Dweomer Burst/Whirlwind/Pyre, and paid elemental terrain. Fey Fairy Chime changes nearby saves; Fairy Guard redirects damage and increases that orchiguard's free strike; Floating Toxins changes movement; none is a static global hero modifier.

## Acceptance implications and uncertainties

Use four-circle source-derived witnesses and cover every eligible portfolio entry across builds; verify choice pruning and grant ownership. All 14 hero envelopes, selected stat-block rolled actions, named paid activations and applicable feature actions need a visible shared API/manual route. Prove real resource payment independently of manual effects; actor-labelled records must not debit the wrong resource or apply a minion effect from hero statistics by accident.

If no summon actors exist, source text plus a paid record is evidence of a manual instruction/payment, not evidence of a created squad, resolved death, condition, save, movement or Stamina change. Manual-only support must say so in both sheet and headless readbacks. The ordinary hero free-strike path must not remain silently usable as if Summoner Strike did not replace it.

Open source ambiguities: portfolio distinctness/column interpretation; sacrifice discount amount; Brisk Gale Whirlwind says shift (including vertically) without a printed distance; Twisted Bengrul Soulsight body erroneously says ensnarer. Preserve/flag these rather than inventing corrected mechanics. No online errata was consulted. Existing product deferral resolves implementation scope, not these rules questions.

This artifact is a source inventory and review checklist, not implementation acceptance. No tests, backend, browser, seed, deployment or source mutation was performed.
