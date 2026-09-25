# Monster spatial-fact triage — 2026-09-25

Read-only source audit for the parent thread. Repository HEAD observed: `43080f66fc7ce6bd30704c57e223b1898987a34c`. No tests, web rules, repository/vendor edits, or Chords messages. Source root: `/srv/presidium/projects/salient/code/vendor/steel-compendium/en/unified/md`. Paths below are relative to that root. This is a clause-level triage list, not a recommendation to remove an ability or introduce blanket deferrals.

## Coverage and exclusions

Enumerated all 501 imported records in `scripts/foes/selection.json`: 438 stat blocks and 63 Malice sheets (500 Monsters-book records plus Source of Earth), including retainers, rivals at all four echelons, every band and solo. The Heroes-book Source of Earth summon and its linked Earth Accepts Me clause were additionally checked in the canonical unified tree; its disposition is below. Parsed 1999 Monsters-book named source sections, plus the four Source of Earth sections, and screened spatial wording across the entire enumeration, with targeted additional searches for landing, counts, collision, exposure and height. Related monster group context is appended; pure geometry/permission portions there are also secondary. This is source triage, not a complete runtime audit or proof that each listed clause is unimplemented.

**V1** means the chosen 36 stat blocks or their selected Malice sheets; **Other catalog** includes stretch orcs, all higher-level bands, nonselected mounts, retainers and rivals. Each repeated name below lists every matching imported owner/path within its stated group. Source names retain printed spelling.

Excluded: ordinary chosen target/range checks; generic move/shift/push instructions without extra spatial-dependent riders; area/aura recipients whose only unknown is selected membership (including enter/start/end riders); squad/object area support gaps; ordinary hide/cover rules and unrestricted immunity/movement permissions; nonspatial counters/conditions. Implicit simple radius effects and death explosions are treated as membership-shaped, not added merely because their compiler is incomplete. Counted overlaps, geometry, traversal and relation to a second independently located entity remain included.

## Implementation evidence and limits

- `shared/foes/README.md`, Core foe content / Consumer contract: imported definitions and structured fields are not executable mechanics; import proves no automation.
- `docs/v1-foe-engine-inventory.md` explicitly calls its mappings planned, not implemented. `docs/build/STATUS.md` lists V217–V227 Registered. V217, V222 and V224 work logs say no implementation or test results. Treat V1 rows below as planned payloads unless a more specific disposition is stated; other catalog rows have import evidence only, execution not individually verified.
- V217 owns actual movement/adjacency/count/distance continuations; V219/V220 reactive timing; V222 traits; V223 spawning; V224 area/terrain; V225/V226 werewolf; V227 thorn dragon. These are scope references, not implementation claims.
- `docs/rules-questions-for-user.md`, Q-FOE-5 (around line 2192), current V222, and the inventory agree: Human Knave Overwhelm current-turn duration is accepted and its current disposition is text-only. V233 is included in main `43080f66`; V222 explicitly prohibits the proposed adjacency-input flow/automatic restriction. This report does not claim that older unresolved-duration wording survives in current main.
- Q-FOE-4 / V227 already defer Thorn Dragon Domain; no additional deferrals proposed here.
- Parent supplied current runtime evidence: `convex/lib/areas.ts` + `shared/resolve/areas.ts` use selected members/effect.members and fire enter/clock riders. This audit applies that exclusion and does not independently claim live execution.

- Q-FOE-1 / V229 is an accepted interaction contract, not new runtime proof: apply the original action, then offer a linked revision card; next committed action closes the unused card (next individual turn start outer cutoff). Printed reaction timing and unresolved Facepalm semantics do not authorize a blocking pause.
- All movement-dependent arithmetic below requires actual completed displacement/traversal facts. Allowances, target choices and membership changes do not establish those facts; current runtime observation is the parent audit's responsibility.

## Selected V1: high-priority review list

All paths below are relative to the canonical unified Markdown root. “Planned” is documentary evidence, not a runtime finding. Full repeated-owner lists follow in the appendix.

| Owner / exact named section | Source path | Extra spatial fact and timing | Status / deterministic remainder |
|---|---|---|---|
| Human Knave — Overwhelm; I'm Your Enemy | `monster/human/statblock/human-knave.md` | Start-turn enemy adjacency; separately taunted attacker's adjacency when it damages someone else | Overwhelm explicitly text-only Q-FOE-5; retaliation planned V219/V222. Taunt/damage state alone is insufficient. |
| Bugbear Commander — The Commander's Watching | `monster/bugbear/statblock/bugbear-commander.md` | Ally has line of effect at its turn start | Planned V222; choosing/ending a condition is deterministic after eligibility. |
| Undead Malice — Ravenous Horde | `monster/undead/1st-echelon/undead-malice-level-1-malice-features.md` | At delayed round end, which heroes have no adjacent undead? | Planned V223; spend, scheduling and zombie count/Stamina are separable. |
| Goblin Malice — Tiny Stabs; Monarch — Kill! | `monster/goblin/goblin-malice.md`; `monster/goblin/statblock/goblin-monarch.md` | Count adjacent Goblin-keyword creatures separately for every enemy at resolution | Planned V217; fixed multiplier 1 or 2. |
| Human Bandit Chief — Form Up!; Whip and Magic Longsword | `monster/human/statblock/human-bandit-chief.md` | Persistent adjacency to a buff recipient; actual post-pull adjacency | Planned V217/V222; immunity 2 / extra 3 corruption only. |
| Human Guard — Halberd | `monster/human/statblock/human-guard.md` | Is guard flanked after relevant attack? | Planned V215/V218; base coordinated attack remains. |
| Human Storm Mage — Arcane Shield; Blackguard — Parry! | `monster/human/statblock/human-storm-mage.md`; `monster/human/statblock/human-blackguard.md` | Damaging enemy adjacency / defended ally adjacency at reaction event | Planned V219/V222; fixed retaliation or halving once confirmed. |
| Bugbear Channeler — Shadow Drag; Roughneck — Drag Through Hell | `monster/bugbear/statblock/bugbear-channeler.md`; `monster/bugbear/statblock/bugbear-roughneck.md` | Grounded target; traversed squares; actual dragged distance | Planned V217/V224; tiers and 2×distance arithmetic remain. |
| All four chosen bugbears — Catcher; Roughneck — Flying Sawblade | Four exact owner paths listed in appendix | Movement crosses reach; vertical forced movement and attack point during/following fall | Planned V217/V219; source-owned grab/Haymaker follows supplied event. |
| Bugbear Malice — Grab Iron Ball; Grab Javelin | `monster/bugbear/bugbear-malice.md` | Throw distance per use | Planned V217; 8−distance / 12−distance and conditions separable. |
| Goblin Stinker — Swamp Gas | `monster/goblin/statblock/goblin-stinker.md` | Squares actually moved inside area | Planned V224; 2 poison per square; area membership alone is insufficient. |
| Specter / Ghost — Corruptive Phasing | `monster/undead/1st-echelon/statblock/specter.md`; `monster/undead/1st-echelon/statblock/ghost.md` | Which creatures were crossed, once per round | Planned V217/V222; 2 corruption and collision immunity are separable. |
| Ghoul — Leap | `monster/undead/1st-echelon/statblock/ghoul.md` | Actual landing on size-1 enemy | Planned V217/V218; conditional prone/free strike, not whole jump. |
| Arixx — Earth Sink; Dirt Devil; Sinkhole | `monster/arixx/arixx-malice.md`; `monster/arixx/statblock/arixx.md` | Ground/start-end same space; began underground; actual above-ground endpoint | Planned V217/V222/V224; source-specific rider only. Geyser safe endpoint is lower-priority table geometry. |
| Werewolf — Wall Leap; Facepalm and Head Slam | `monster/werewolf/statblock/werewolf.md` | Wall landing; prior straight approach ≥2 or charge | Planned V217/V220; damage and conditions remain. |
| Werewolf — Moonfall / Shared Ferocity | `monster/werewolf/werewolf-malice.md`; `monster/group/werewolf.md` | Line of effect to moon at allowance/turn end; to ferocity expenditure event | Planned V226; +2 rage / 1d3 Malice after eligibility. |
| Thorn Dragon — Provoking Nettles; Investiture of Verdure; Thorned Armor | `monster/dragon/statblock/thorn-dragon.md` | Traversed enemies; targets actually pulled; adjacent melee attacker | Planned V217/V219/V227; 3 damage / 5 temporary Stamina per actual pull / 3 retaliation. |
| Thorn Dragon — Bramble Barricade; Malign Thicket | `monster/dragon/thorn-dragon-malice.md`; `monster/dragon/statblock/thorn-dragon.md` | Forced-movement squares within wall; Thicket inherits two walls | Planned V224/V227; per-square wall damage and bleeding need confirmed traversal; Thicket poison needs actual dragon-caused displacement. Domain poison remains shelved. |
| Thorn Dragon — Thorn Dragon's Domain | `monster/group/dragon.md` | Active domain, grounded when restrained | Already manual Q-FOE-4, including Domain-dependent poison; not a new recommendation or runtime-support claim. |

Boundary/instruction-only, excluded from strict core: Ghost **Paranormal Activity / Spirited Away**, Undead Malice **Paranormal Fling**, and Werewolf **Accursed Rage** nearest-creature instruction (rage threshold/reset is recorded state). Also Werewolf **Full Wolf** fit/relocation; **Howl** and Bugbear Malice **Show Them the Great Fear** straight-line retreat. Do not conflate their ordinary movement instructions with new automatic trigger blockers. Their independent buffs, damage and conditions remain usable.

## Strict core appendix — extra predicate changes a number, condition, trigger or restriction

Core excludes ordinary target/member selection, pure movement/fit/placement, alternative origins, and ignore-cover permissions. Entries group complete imported owner/path lists for repeated names. A core predicate may already be supplied by an existing observation; this list does not claim every candidate requires a new UI prompt. V1 rows have planned scope evidence above; other catalog execution remains unverified.

#### 1. Overwhelm

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Enemy adjacent at its turn start (Human Knave only). **Timing/input burden:** Every enemy turn start; retain the snapshot for that turn. **Deterministic portion:** Restriction duration is an accepted current-turn interpretation; explicit text-only disposition, not a proposed new deferral.

Owners and exact source sections:

- **V1 — Human Knave**: `monster/human/statblock/human-knave.md` § **Overwhelm**.

#### 2. The Commander's Watching, Kuran'zoi Heraldry

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Ally has line of effect to commander/armiger at its turn start. **Timing/input burden:** Each eligible ally turn start, then choose condition. **Deterministic portion:** Condition removal once eligibility is supplied.

Owners and exact source sections:

- **V1 — Bugbear Commander**: `monster/bugbear/statblock/bugbear-commander.md` § **The Commander's Watching**.
- **Other catalog — Time Raider Armiger**: `monster/time-raider/statblock/time-raider-armiger.md` § **Kuran'zoi Heraldry**.

#### 3. Ravenous Horde

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Which heroes have NO undead adjacent at round end; legal adjacent spawn spaces. **Timing/input burden:** Delayed round-end census per hero. **Deterministic portion:** Malice, round restriction, spawn count and accepted zombie Stamina/squads are separable.

Owners and exact source sections:

- **V1 — Undead Malice (Level 1+ Malice Features)**: `monster/undead/1st-echelon/undead-malice-level-1-malice-features.md` § **Ravenous Horde (2 Malice)**.

#### 4. Imposing Energy, Praetorian Buzzing, Abyssal Buzzing, Lugged Spear

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Count adjacent specified creatures: two orliq; two praetorians; two soulraker minions; three blitzers respectively. **Timing/input burden:** Subject turn start (next turn only for Lugged Spear rider). **Deterministic portion:** Threshold, damage/slow and duration are deterministic after count.

Owners and exact source sections:

- **Other catalog — Orliq**: `monster/demon/2nd-echelon/statblock/orliq.md` § **Imposing Energy**.
- **Other catalog — Soulraker Praetorian**: `monster/demon/3rd-echelon/statblock/soulraker-praetorian.md` § **Praetorian Buzzing**.
- **Other catalog — Soulraker Scout**: `monster/demon/3rd-echelon/statblock/soulraker-scout.md` § **Abyssal Buzzing**.
- **Other catalog — Soulraker Soldier**: `monster/demon/3rd-echelon/statblock/soulraker-soldier.md` § **Abyssal Buzzing**.
- **Other catalog — Soulraker Stinger**: `monster/demon/3rd-echelon/statblock/soulraker-stinger.md` § **Abyssal Buzzing**.
- **Other catalog — Orc Blitzer**: `monster/orc/statblock/orc-blitzer.md` § **Lugged Spear (Signature Ability)**.

#### 5. Horrid Stench, Ever So Hungry

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Three pitlings within 2 squares / three adjacent ghoul cravers. **Timing/input burden:** Before healing or shifting; re-evaluate after relevant movement. **Deterministic portion:** Healing/shift prohibition after threshold.

Owners and exact source sections:

- **Other catalog — Pitling**: `monster/demon/1st-echelon/statblock/pitling.md` § **Horrid Stench**.
- **Other catalog — Ghoul Craver**: `monster/undead/2nd-echelon/statblock/ghoul-craver.md` § **Ever So Hungry**.

#### 7. Repelling Psihander

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Are the two targets adjacent to each other at the end of the target's next turn? **Timing/input burden:** Delayed per-target turn-end check. **Deterministic portion:** Signature damage/forced movement; conditional prone only waits.

Owners and exact source sections:

- **Other catalog — Time Raider Mind Punk**: `monster/time-raider/statblock/time-raider-mind-punk.md` § **Repelling Psihander (Signature Ability)**.

#### 8. Poison Blow Dart

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Which creatures end their turn adjacent to a target still weakened by this source? **Timing/input burden:** Each potentially exposed turn end. **Deterministic portion:** Original damage/weakening and propagated condition duration.

Owners and exact source sections:

- **Other catalog — Lizardfolk Skyterror**: `monster/lizardfolk/statblock/lizardfolk-skyterror.md` § **Poison Blow Dart**.

#### 9. Hollow Grasp

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Does affected target end its turn with NO spirit within 5 squares? **Timing/input burden:** Affected target turn end until expiry. **Deterministic portion:** Initial damage/weakening; only conditional ending needs spatial input.

Owners and exact source sections:

- **Other catalog — Faded Echo Spirit**: `monster/undead/3rd-echelon/statblock/faded-echo-spirit.md` § **Hollow Grasp (Signature Ability)**.

#### 10. Moonfall

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Werewolf/subject has line of effect to the moon. **Timing/input burden:** Werewolf turn allowance; each rage-holder turn end. **Deterministic portion:** Extra allowance and +2 rage conditional on that fact; existing rage requirement is recorded state.

Owners and exact source sections:

- **V1 — Werewolf Malice**: `monster/werewolf/werewolf-malice.md` § **Moonfall (10 Malice)**.

#### 11. Earth Sink, Nexus Jewel

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Ground/underground at start; whether end space equals start space. Nexus also needs entered-square counts in volcanic mode. **Timing/input burden:** Start and end snapshots, movement leaving starting space, each entered square. **Deterministic portion:** Fixed penalties, restraint/sinking and per-square arithmetic; other environment-mode modifiers are separable.

Owners and exact source sections:

- **Other catalog — Ajax's Malice**: `monster/ajax-the-invincible/ajaxs-malice.md` § **Nexus Jewel (5 Malice)**.
- **V1 — Arixx Malice**: `monster/arixx/arixx-malice.md` § **Earth Sink (7 Malice)**.

#### 14. Tiny Stabs, Kill!

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Number of goblins adjacent to EACH enemy, including bugbears with Goblin keyword. **Timing/input burden:** Feature resolution, per enemy. **Deterministic portion:** 1 or 2 damage times count; ordinary defense pipeline remains usable.

Owners and exact source sections:

- **V1 — Goblin Malice**: `monster/goblin/goblin-malice.md` § **Tiny Stabs (5 Malice)**.
- **V1 — Goblin Monarch**: `monster/goblin/statblock/goblin-monarch.md` § **Kill! (Villain Action 3)**.

#### 15. Bu'gathic Inspiration, Magic Terror, Bat Out Of Hell, Open Furnace, Tactical Positioning, Tethered

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Counts of adjacent knightmares/grilps/brandbearers/recruits or squad tetherites within 2. **Timing/input burden:** Relevant roll, damage or stability use; update after movement. **Deterministic portion:** Per-source count arithmetic, including same-name multiple owners.

Owners and exact source sections:

- **Other catalog — Bugbear Knightmare**: `monster/bugbear/statblock/bugbear-knightmare.md` § **Bu'gathic Inspiration**.
- **Other catalog — Bugbear Knightmare**: `monster/bugbear/statblock/bugbear-knightmare.md` § **Magic Terror**.
- **Other catalog — Grilp**: `monster/hobgoblin/statblock/grilp.md` § **Bat Out Of Hell**.
- **Other catalog — Hobgoblin Brandbearer**: `monster/hobgoblin/statblock/hobgoblin-brandbearer.md` § **Open Furnace**.
- **Other catalog — Hobgoblin Recruit**: `monster/hobgoblin/statblock/hobgoblin-recruit.md` § **Tactical Positioning**.
- **Other catalog — War Dog Tetherite**: `monster/war-dog/1st-echelon/statblock/war-dog-tetherite.md` § **Tethered**.

#### 16. Twystrd

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** All adjacent elemental motes to determine area size. **Timing/input burden:** Before selecting cube membership. **Deterministic portion:** Area size calculation; later area membership is excluded.

Owners and exact source sections:

- **Other catalog — High Elf Wyrd**: `monster/elf-high/statblock/high-elf-wyrd.md` § **Twystrd (Signature Ability)**.

#### 17. All to Cinders

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** How many distinct emitting targets cover EACH enemy (one/two/three+). **Timing/input burden:** Ability resolution before tests. **Deterministic portion:** Test bane tier depends on overlap count; flat union membership is insufficient.

Owners and exact source sections:

- **Other catalog — Fire Giant Chief**: `monster/giant/statblock/fire-giant-chief.md` § **All to Cinders (Villain Action 3)**.

#### 18. Shield? Shield!, Shield, Boss?, Form Up!, Lost in the Crowd, Face in the Crowd

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Adjacency to qualifying ally/mentor/marked recipient; hiding status is separately recorded. **Timing/input burden:** Before relevant defense/hide/strike and after movement. **Deterministic portion:** Stability, cover, immunity or invisibility/hide permission once pair relation is known.

Owners and exact source sections:

- **V1 — Human Bandit Chief**: `monster/human/statblock/human-bandit-chief.md` § **Form Up! (Villain Action 2)**.
- **Other catalog — Kobold Adeptus**: `monster/kobold/statblock/kobold-adeptus.md` § **Shield? Shield!**.
- **Other catalog — Kobold Artifex**: `monster/kobold/statblock/kobold-artifex.md` § **Shield? Shield!**.
- **Other catalog — Kobold Centurion**: `monster/kobold/statblock/kobold-centurion.md` § **Shield? Shield!**.
- **Other catalog — Kobold Legionary**: `monster/kobold/statblock/kobold-legionary.md` § **Shield? Shield!**.
- **Other catalog — Kobold Princeps**: `monster/kobold/statblock/kobold-princeps.md` § **Shield? Shield!**.
- **Other catalog — Kobold Sagittarion**: `monster/kobold/statblock/kobold-sagittarion.md` § **Shield? Shield!**.
- **Other catalog — Kobold Signifer**: `monster/kobold/statblock/kobold-signifer.md` § **Shield? Shield!**.
- **Other catalog — Kobold Tiro**: `monster/kobold/statblock/kobold-tiro.md` § **Shield? Shield!**.
- **Other catalog — Kobold Veles**: `monster/kobold/statblock/kobold-veles.md` § **Shield? Shield!**.
- **Other catalog — Kobold Venator**: `monster/kobold/statblock/kobold-venator.md` § **Lost in the Crowd**.
- **Other catalog — Kobold Venator**: `monster/kobold/statblock/kobold-venator.md` § **Shield? Shield!**.
- **Other catalog — Kobold Shieldbearer**: `monster/retainer/statblock/kobold-shieldbearer.md` § **Shield, Boss?**.
- **Other catalog — War Dog Hypokrite**: `monster/war-dog/2nd-echelon/statblock/war-dog-hypokrite.md` § **Face in the Crowd**.

#### 19. Composite Bow, Shocking Bolt, Corrupted Ash Daggers, Chop

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Ally/enemy/mentor adjacency determining a roll edge. **Timing/input burden:** Before ability roll. **Deterministic portion:** Base damage and other riders; secondary AoE membership is not the blocker.

Owners and exact source sections:

- **Other catalog — Kobold Adeptus**: `monster/kobold/statblock/kobold-adeptus.md` § **Shocking Bolt (Signature Ability)**.
- **Other catalog — Kobold Sagittarion**: `monster/kobold/statblock/kobold-sagittarion.md` § **Composite Bow (Signature Ability)**.
- **Other catalog — Human Warrior**: `monster/retainer/statblock/human-warrior.md` § **Chop  (Signature Ability)**.
- **Other catalog — War Dog Teletalite**: `monster/war-dog/1st-echelon/statblock/war-dog-teletalite.md` § **Corrupted Ash Daggers (Signature Ability)**.

#### 20. Infernal Pike, Splinter Dagger

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Are the two selected targets adjacent to EACH OTHER? **Timing/input burden:** Before damage resolution. **Deterministic portion:** Only extra 3 damage is conditional; base tiers remain.

Owners and exact source sections:

- **Other catalog — Devil Legate**: `monster/devil/statblock/devil-legate.md` § **Infernal Pike (Signature Ability)**.
- **Other catalog — Wode Elf Guerrilla**: `monster/elf-wode/statblock/wode-elf-guerrilla.md` § **Splinter Dagger (Signature Ability)**.

#### 21. Grim Thrust

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Attacker has high ground relative to target. **Timing/input burden:** Before damage resolution. **Deterministic portion:** Only +2 damage; ordinary chosen range is excluded.

Owners and exact source sections:

- **Other catalog — Hobgoblin Lancer**: `monster/hobgoblin/statblock/hobgoblin-lancer.md` § **Grim Thrust (Signature Ability)**.

#### 22. Halberd

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Is Human Guard flanked? **Timing/input burden:** After the guard's attack, before optional additional free strike. **Deterministic portion:** Initial attack remains deterministic; selecting another target is ordinary choice.

Owners and exact source sections:

- **V1 — Human Guard**: `monster/human/statblock/human-guard.md` § **Halberd (Signature Ability)**.

#### 23. Stalwart Guardian, Unwavering Defender

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Protected ally is adjacent to the conduit. **Timing/input burden:** Strike or damage event, per protected ally. **Deterministic portion:** Bane/halving after eligibility; same features in all imported rival echelons listed below.

Owners and exact source sections:

- **Other catalog — Rival Conduit**: `monster/rival/1st-echelon/statblock/rival-conduit.md` § **Stalwart Guardian**.
- **Other catalog — Rival Conduit**: `monster/rival/2nd-echelon/statblock/rival-conduit.md` § **Stalwart Guardian**.
- **Other catalog — Rival Conduit**: `monster/rival/3rd-echelon/statblock/rival-conduit.md` § **Unwavering Defender**.
- **Other catalog — Rival Conduit**: `monster/rival/4th-echelon/statblock/rival-conduit.md` § **Unwavering Defender**.

#### 24. I'm Your Enemy, Arcane Shield, Thorned Armor, Toxiferous, Bladed Body, Made of Teeth, Scorching Skin, Searing Skin, Fleshfused Spines, I Am Fire! I Am Death!, Anyone Can Do That

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Triggering attacker/grabber is adjacent to feature owner at the event; reach alone does not prove adjacency. **Timing/input burden:** Each relevant targeting/grab/damage event. **Deterministic portion:** Damage, retaliation, potency checks, restrictions, costs and once limits remain separable.

Owners and exact source sections:

- **Other catalog — Angulotl Cleaver**: `monster/angulotl/statblock/angulotl-cleaver.md` § **Toxiferous**.
- **Other catalog — Angulotl Dart**: `monster/angulotl/statblock/angulotl-dart.md` § **Toxiferous**.
- **Other catalog — Angulotl Daybringer**: `monster/angulotl/statblock/angulotl-daybringer.md` § **Toxiferous**.
- **Other catalog — Angulotl Needler**: `monster/angulotl/statblock/angulotl-needler.md` § **Toxiferous**.
- **Other catalog — Angulotl Slink**: `monster/angulotl/statblock/angulotl-slink.md` § **Toxiferous**.
- **Other catalog — Angulotl Wave**: `monster/angulotl/statblock/angulotl-wave.md` § **Toxiferous**.
- **Other catalog — Ashen Hoarder**: `monster/ashen-hoarder/statblock/ashen-hoarder.md` § **Bladed Body**.
- **Other catalog — Fangling**: `monster/demon/2nd-echelon/statblock/fangling.md` § **Made of Teeth**.
- **Other catalog — Myxovidan the Sintaker**: `monster/draconian/statblock/myxovidan-the-sintaker.md` § **Anyone Can Do That (2 Malice)**.
- **V1 — Thorn Dragon**: `monster/dragon/statblock/thorn-dragon.md` § **Thorned Armor (Villain Action 2)**.
- **Other catalog — Fire Giant Chief**: `monster/giant/statblock/fire-giant-chief.md` § **Scorching Skin**.
- **Other catalog — Fire Giant Fireballer**: `monster/giant/statblock/fire-giant-fireballer.md` § **Searing Skin**.
- **Other catalog — Fire Giant Lightbearer**: `monster/giant/statblock/fire-giant-lightbearer.md` § **Searing Skin**.
- **Other catalog — Fire Giant Red Fist**: `monster/giant/statblock/fire-giant-red-fist.md` § **Searing Skin**.
- **Other catalog — Hobgoblin Bloodlord**: `monster/hobgoblin/statblock/hobgoblin-bloodlord.md` § **I Am Fire! I Am Death! (Villain Action 3)**.
- **V1 — Human Knave**: `monster/human/statblock/human-knave.md` § **I'm Your Enemy**.
- **V1 — Human Storm Mage**: `monster/human/statblock/human-storm-mage.md` § **Arcane Shield**.
- **Other catalog — Angulotl Hopper**: `monster/retainer/statblock/angulotl-hopper.md` § **Toxiferous**.
- **Other catalog — Fleshflayed Shambler Zombie**: `monster/undead/2nd-echelon/statblock/fleshflayed-shambler-zombie.md` § **Fleshfused Spines**.

#### 25. Parry!, Intercepting Shield, No., Work as One

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Attacked ally adjacent to defending source at the trigger. **Timing/input burden:** Printed trigger is the strike against the protected ally. Accepted shared UI contract (Q-FOE-1/V229): resolve/apply original action first, then offer a linked-card revision; unused card closes at next committed action, with next individual turn start as outer cutoff. No blocking pre-resolution pause. **Deterministic portion:** Replacement/bane/halving is deterministic once trigger fact supplied.

Owners and exact source sections:

- **Other catalog — Dwarf Shieldwall**: `monster/dwarf/statblock/dwarf-shieldwall.md` § **Intercepting Shield (1 Malice)**.
- **V1 — Human Blackguard**: `monster/human/statblock/human-blackguard.md` § **Parry!**.
- **Other catalog — Orc Rampart**: `monster/orc/statblock/orc-rampart.md` § **No.**.
- **Other catalog — Rival Malice (Level 1+ Malice Features)**: `monster/rival/rival-malice-level-1-malice-features.md` § **Work as One (3 Malice)**.

#### 26. Catcher

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Movement actually enters source reach, with willing/forced and ally/size checks. **Timing/input burden:** During movement, potentially before endpoint. **Deterministic portion:** Grab effect once trigger confirmed; includes retainer Bugbear Commando outside V1.

Owners and exact source sections:

- **V1 — Bugbear Channeler**: `monster/bugbear/statblock/bugbear-channeler.md` § **Catcher**.
- **V1 — Bugbear Commander**: `monster/bugbear/statblock/bugbear-commander.md` § **Catcher**.
- **V1 — Bugbear Roughneck**: `monster/bugbear/statblock/bugbear-roughneck.md` § **Catcher**.
- **V1 — Bugbear Sneak**: `monster/bugbear/statblock/bugbear-sneak.md` § **Catcher**.
- **Other catalog — Bugbear Commando**: `monster/retainer/statblock/bugbear-commando.md` § **Catcher**.

#### 27. Facepalm and Head Slam

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Charge or at least 2 squares in a straight line toward werewolf before the melee ability. **Timing/input burden:** Printed trigger is melee targeting after the qualifying approach; its sequencing antecedent remains unresolved in Q-FOE-1. Accepted UI handling resolves/applies the original action first, then offers a linked-card revision expiring at next committed action (next individual turn start outer cutoff). Movement-history fact belongs to the triggering event; no blocking pre-resolution pause. **Deterministic portion:** Cost, damage and prone remain deterministic; attack itself is not removed.

Owners and exact source sections:

- **V1 — Werewolf**: `monster/werewolf/statblock/werewolf.md` § **Facepalm and Head Slam (2 Malice)**.

#### 28. Spinning Bone Blade

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** At least 3 preceding squares moved in a straight line this turn. **Timing/input burden:** Before signature roll. **Deterministic portion:** Conditional edge only.

Owners and exact source sections:

- **Other catalog — Grulqin**: `monster/demon/2nd-echelon/statblock/grulqin.md` § **Spinning Bone Blade (Signature Ability)**.

#### 29. Lockdown, Cut the... Nonsense!, Thresher Thrasher, You Didn't Pay Attention!, Mobile Prison Harness, Defensive Snapping, Portal to the Sky

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** A moving creature crosses adjacency/reach boundary; movement type and eligibility where printed. **Timing/input burden:** During movement, stop/intervene at crossing, not merely at destination. **Deterministic portion:** Stop shift, strike/Knockback, grab/restraint, or teleport consequences once event identified.

Owners and exact source sections:

- **Other catalog — Chimera Malice**: `monster/chimera/chimera-malice.md` § **Defensive Snapping (3 Malice)**.
- **Other catalog — Servitor War Walker**: `monster/dwarf/statblock/servitor-war-walker.md` § **Mobile Prison Harness**.
- **Other catalog — Trained Gummy Brick**: `monster/kobold/statblock/trained-gummy-brick.md` § **You Didn't Pay Attention!**.
- **Other catalog — Lizardfolk Deathrex**: `monster/lizardfolk/statblock/lizardfolk-deathrex.md` § **Thresher Thrasher (Villain Action 3)**.
- **Other catalog — Minotaur Malice**: `monster/minotaur/minotaur-malice.md` § **Cut the... Nonsense! (5 Malice)**.
- **Other catalog — Orc Warleader**: `monster/orc/statblock/orc-warleader.md` § **Lockdown (3 Malice)**.
- **Other catalog — Radenwight Bruxer**: `monster/radenwight/statblock/radenwight-bruxer.md` § **Lockdown**.
- **Other catalog — Logostician Vesper**: `monster/war-dog/4th-echelon/statblock/logostician-vesper.md` § **Portal to the Sky**.

#### 30. Overwhelm, Overpower, Rout, Devastate

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Fury's shift actually ends adjacent to subject; OR its separate force-movement trigger occurs. **Timing/input burden:** Once per turn at movement event. **Deterministic portion:** Force-movement branch is deterministic only if actual displacement is confirmed; an allowance is insufficient. Adjacency branch additionally needs the pairwise fact. Current runtime observation support is not established here.

Owners and exact source sections:

- **Other catalog — Rival Fury**: `monster/rival/1st-echelon/statblock/rival-fury.md` § **Overwhelm**.
- **Other catalog — Rival Fury**: `monster/rival/2nd-echelon/statblock/rival-fury.md` § **Overpower**.
- **Other catalog — Rival Fury**: `monster/rival/3rd-echelon/statblock/rival-fury.md` § **Rout**.
- **Other catalog — Rival Fury**: `monster/rival/4th-echelon/statblock/rival-fury.md` § **Devastate**.

#### 31. Whip and Magic Longsword, Tonguelash, Spiked Maul, Inhale, Magnetic Pull, Chainsaw Whip, Conditioning Spear

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Did completed pull/shift leave subject adjacent to source? **Timing/input burden:** After actual movement, per target. **Deterministic portion:** Base damage/movement instruction; conditional damage/grab/fly/free strike waits.

Owners and exact source sections:

- **V1 — Human Bandit Chief**: `monster/human/statblock/human-bandit-chief.md` § **Whip and Magic Longsword (Signature Ability)**.
- **Other catalog — Lizardfolk Tonguer**: `monster/lizardfolk/statblock/lizardfolk-tonguer.md` § **Tonguelash (Signature Ability)**.
- **Other catalog — Minotaur Sunderer**: `monster/minotaur/statblock/minotaur-sunderer.md` § **Spiked Maul (Signature Ability)**.
- **Other catalog — Koptourok**: `monster/undead/3rd-echelon/statblock/koptourok.md` § **Inhale (3 Malice)**.
- **Other catalog — Multivok Bodyguard**: `monster/valok/statblock/multivok-bodyguard.md` § **Magnetic Pull**.
- **Other catalog — War Dog Eviscerite**: `monster/war-dog/1st-echelon/statblock/war-dog-eviscerite.md` § **Chainsaw Whip (Signature Ability)**.
- **Other catalog — War Dog Ground Commander**: `monster/war-dog/1st-echelon/statblock/war-dog-ground-commander.md` § **Conditioning Spear (Signature Ability)**.

#### 32. Portable Ballista, Levitating Axes, Horn Vault, Biokinetic Ballista

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual endpoint next to wall/object/ally or collision with obstacle, according to source. **Timing/input burden:** After forced movement. **Deterministic portion:** Base attack tiers; restrain/bleed/prone rider only depends on fact.

Owners and exact source sections:

- **Other catalog — Dwarf Gunner**: `monster/dwarf/statblock/dwarf-gunner.md` § **Portable Ballista (Signature Ability)**.
- **Other catalog — Dwarf Marauder**: `monster/dwarf/statblock/dwarf-marauder.md` § **Levitating Axes (Signature Ability)**.
- **Other catalog — Minotaur Lackey**: `monster/minotaur/statblock/minotaur-lackey.md` § **Horn Vault (Signature Ability)**.
- **Other catalog — War Dog Ballistite**: `monster/war-dog/3rd-echelon/statblock/war-dog-ballistite.md` § **Biokinetic Ballista (Signature Ability)**.

#### 33. Animal Rally, Rat Race, Signum

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Endpoint adjacency to specified ally/recipient, beyond merely issuing move instruction. **Timing/input burden:** After movement (Animal Rally specifically end of turn). **Deterministic portion:** Stand/riding/free-strike continuation or shift eligibility.

Owners and exact source sections:

- **Other catalog — Big Animal B**: `monster/animal/statblock/big-animal-b.md` § **Animal Rally**.
- **Other catalog — Kobold Signifer**: `monster/kobold/statblock/kobold-signifer.md` § **Signum (Signature Ability)**.
- **Other catalog — Radenwight Malice**: `monster/radenwight/radenwight-malice.md` § **Rat Race (5 Malice)**.

#### 34. Leap, Wall Leap, Sinkhole, Ram's Defiance

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual landing on size-1 enemy, at wall, above ground within 2, or within attack distance respectively. **Timing/input burden:** After jump/shift; before conditional follow-up. **Deterministic portion:** Original movement and independent effects; prone/free strike/Bite/Dig or follow-up roll requires fact.

Owners and exact source sections:

- **V1 — Arixx**: `monster/arixx/statblock/arixx.md` § **Sinkhole (Villain Action 2)**.
- **Other catalog — Chimera**: `monster/chimera/statblock/chimera.md` § **Ram's Defiance**.
- **V1 — Ghoul**: `monster/undead/1st-echelon/statblock/ghoul.md` § **Leap**.
- **V1 — Werewolf**: `monster/werewolf/statblock/werewolf.md` § **Wall Leap**.

#### 35. Windwalk, Flame Jet, Air Raid!, Drop Troop

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Did flight end on solid ground / valid landing space, or is jumper on ground at turn end? **Timing/input burden:** Movement end or turn end as printed. **Deterministic portion:** Flight permission and other effects; only fall/prone consequence waits.

Owners and exact source sections:

- **Other catalog — Crux of Fire**: `monster/elemental/statblock/crux-of-fire.md` § **Flame Jet (1 Malice)**.
- **Other catalog — High Elf Zephyr**: `monster/elf-high/statblock/high-elf-zephyr.md` § **Windwalk**.
- **Other catalog — Time Raider Tyrannis**: `monster/time-raider/statblock/time-raider-tyrannis.md` § **Air Raid! (3 Malice)**.
- **Other catalog — War Dog Blood Jumper**: `monster/war-dog/4th-echelon/statblock/war-dog-blood-jumper.md` § **Drop Troop**.

#### 36. Glider, Jetwing Agility, Shield Bash

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual squares moved (ground/fall for Glider), not granted movement allowance. **Timing/input burden:** Movement threshold; turn roll/defense; Shield Bash use. **Deterministic portion:** Flight, bane, forced distance and ally movement formulas once count known.

Owners and exact source sections:

- **Other catalog — Kobold Legionary**: `monster/kobold/statblock/kobold-legionary.md` § **Shield Bash**.
- **Other catalog — Lizardfolk Skyterror**: `monster/lizardfolk/statblock/lizardfolk-skyterror.md` § **Glider**.
- **Other catalog — Orc Bloodrunner**: `monster/orc/statblock/orc-bloodrunner.md` § **Shield Bash (Signature Ability)**.
- **Other catalog — War Dog Aerocite**: `monster/war-dog/3rd-echelon/statblock/war-dog-aerocite.md` § **Jetwing Agility**.

#### 37. Hop To It, Blood Haze, Poisoned Dagger

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Cover/concealment at actual landing/end-shift location. **Timing/input burden:** After jump/shift, before hide attempt. **Deterministic portion:** Attack/cloud and movement remain; conditional hide eligibility only.

Owners and exact source sections:

- **Other catalog — Angulotl Slink**: `monster/angulotl/statblock/angulotl-slink.md` § **Hop To It (2 Malice)**.
- **Other catalog — High Elf Bloodletter**: `monster/elf-high/statblock/high-elf-bloodletter.md` § **Blood Haze (2 Malice)**.
- **Other catalog — War Dog War Frog**: `monster/war-dog/2nd-echelon/statblock/war-dog-war-frog.md` § **Poisoned Dagger (Signature Ability)**.

#### 38. Shadow Drag, Drag Through Hell

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Ground eligibility for Shadow Drag; Drag Through Hell damage uses actual distance. Exact terrain path creation is secondary, not an additional core blocker. **Timing/input burden:** Resolve movement; record path and distance per subject. **Deterministic portion:** Attack tiers / 2 damage per dragged square, release/prone; terrain follows confirmed path.

Owners and exact source sections:

- **V1 — Bugbear Channeler**: `monster/bugbear/statblock/bugbear-channeler.md` § **Shadow Drag (Signature Ability)**.
- **V1 — Bugbear Roughneck**: `monster/bugbear/statblock/bugbear-roughneck.md` § **Drag Through Hell (3 Malice)**.

#### 39. Swamp Gas, Bramble Barricade, Crag Burst, Barrage of Barbs, Operation Earth Sear, Burn It Right Down, Kinetic Crush, Burning Oil, Lay Waste

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual entered/moved-square count (and forced/willing/ground/first-entry-per-round distinctions as printed). **Timing/input burden:** Each movement through affected terrain; per-square history where needed. **Deterministic portion:** Damage multiplier, weakening/bleeding and durations; ordinary membership-only riders excluded.

Owners and exact source sections:

- **Other catalog — Omen Dragon Malice**: `monster/dragon/omen-dragon-malice.md` § **Burn It Right Down (10 Malice)**.
- **V1 — Thorn Dragon Malice**: `monster/dragon/thorn-dragon-malice.md` § **Bramble Barricade (5 Malice)**.
- **Other catalog — Granite Stone Giant**: `monster/giant/statblock/granite-stone-giant.md` § **Crag Burst (3 Malice)**.
- **V1 — Goblin Stinker**: `monster/goblin/statblock/goblin-stinker.md` § **Swamp Gas**.
- **Other catalog — Hobgoblin Malice**: `monster/hobgoblin/hobgoblin-malice.md` § **Operation Earth Sear (7 Malice)**.
- **Other catalog — Manticore Malice**: `monster/manticore/manticore-malice.md` § **Barrage of Barbs (7 Malice)**.
- **Other catalog — Time Raider Nemesis**: `monster/time-raider/statblock/time-raider-nemesis.md` § **Kinetic Crush (2 Malice)**.
- **Other catalog — Servok War Engine**: `monster/valok/statblock/servok-war-engine.md` § **Burning Oil (3 Malice)**.
- **Other catalog — War Dog Tetrarch**: `monster/war-dog/2nd-echelon/statblock/war-dog-tetrarch.md` § **Lay Waste (Villain Action 2)**.

#### 40. Grab Iron Ball, Grab Javelin

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual throw distance in squares. **Timing/input burden:** Per throw. **Deterministic portion:** Damage 8-distance / 12-distance, potency and condition; choosing target within range alone is insufficient.

Owners and exact source sections:

- **V1 — Bugbear Malice**: `monster/bugbear/bugbear-malice.md` § **Grab Iron Ball (3+ Malice)**.
- **V1 — Bugbear Malice**: `monster/bugbear/bugbear-malice.md` § **Grab Javelin (5+ Malice)**.

#### 41. Provoking Nettles, Corruptive Phasing, Shadow Phasing, Agonizing Phasing, Spirit Form, Trample, Writ of Execution, Firetail Pilum, Blazing Charge, Overwhelming March, Earth Breach, Maw

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual creatures/objects traversed, first traversal per source window, valid endpoint outside solid matter where required. **Timing/input burden:** During each square of path; apply first-crossing limits. **Deterministic portion:** Damage/tests, object destruction, conditions and immunity clauses once path facts supplied.

Owners and exact source sections:

- **Other catalog — Predator B**: `monster/animal/statblock/predator-b.md` § **Trample**.
- **Other catalog — Devil Legate**: `monster/devil/statblock/devil-legate.md` § **Writ of Execution**.
- **V1 — Thorn Dragon**: `monster/dragon/statblock/thorn-dragon.md` § **Provoking Nettles**.
- **Other catalog — Tusker Demon**: `monster/gnoll/statblock/tusker-demon.md` § **Trample**.
- **Other catalog — War Spider**: `monster/goblin/statblock/war-spider.md` § **Trample (5 Malice)**.
- **Other catalog — Kingfissure Worm**: `monster/kingfissure-worm/statblock/kingfissure-worm.md` § **Maw**.
- **Other catalog — Kingfissure Worm**: `monster/kingfissure-worm/statblock/kingfissure-worm.md` § **Earth Breach (Villain Action 2)**.
- **Other catalog — Kobold Centurion**: `monster/kobold/statblock/kobold-centurion.md` § **Firetail Pilum (Villain Action 1)**.
- **Other catalog — Orc Malice**: `monster/orc/orc-malice.md` § **Overwhelming March (3 Malice)**.
- **Other catalog — Unquiet Spirit**: `monster/retainer/statblock/unquiet-spirit.md` § **Corruptive Phasing**.
- **V1 — Ghost**: `monster/undead/1st-echelon/statblock/ghost.md` § **Corruptive Phasing**.
- **Other catalog — Shade**: `monster/undead/1st-echelon/statblock/shade.md` § **Shadow Phasing**.
- **V1 — Specter**: `monster/undead/1st-echelon/statblock/specter.md` § **Corruptive Phasing**.
- **Other catalog — Umbral Stalker**: `monster/undead/1st-echelon/statblock/umbral-stalker.md` § **Corruptive Phasing**.
- **Other catalog — Wraith**: `monster/undead/2nd-echelon/statblock/wraith.md` § **Agonizing Phasing**.
- **Other catalog — Faded Echo Spirit**: `monster/undead/3rd-echelon/statblock/faded-echo-spirit.md` § **Corruptive Phasing**.
- **Other catalog — Wraith Skulker**: `monster/undead/4th-echelon/statblock/wraith-skulker.md` § **Corruptive Phasing**.
- **Other catalog — War Dog Equivite**: `monster/war-dog/2nd-echelon/statblock/war-dog-equivite.md` § **Blazing Charge**.
- **Other catalog — Soulbinder Psyche**: `monster/war-dog/4th-echelon/statblock/soulbinder-psyche.md` § **Spirit Form**.

#### 42. Scramble, Chorus of Destruction, Don't Turn Away, Bound Ahead, Drangolin Plume, Swooping Torment, Executioner's Swing

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Which creatures become adjacent/in reach at ANY point of movement, not only endpoint. **Timing/input burden:** During shift/flight, potentially multiple recipients. **Deterministic portion:** Printed attacks, damage choices, Deathcount reduction and later abilities remain.

Owners and exact source sections:

- **Other catalog — Bredbeddle**: `monster/bredbeddle/statblock/bredbeddle.md` § **Executioner's Swing (Signature Ability)**.
- **Other catalog — Bredbeddle**: `monster/bredbeddle/statblock/bredbeddle.md` § **Scramble**.
- **Other catalog — Chimera**: `monster/chimera/statblock/chimera.md` § **Chorus of Destruction (Villain Action 3)**.
- **Other catalog — Omen Dragon**: `monster/dragon/statblock/omen-dragon.md` § **Don't Turn Away (1 Malice)**.
- **Other catalog — Striped Condor Griffon**: `monster/griffon/statblock/striped-condor-griffon.md` § **Bound Ahead (5 Malice)**.
- **Other catalog — Shieldscale Drangolin**: `monster/kobold/statblock/shieldscale-drangolin.md` § **Drangolin Plume (5 Malice)**.
- **Other catalog — Wyvern Lurker**: `monster/wyvern/statblock/wyvern-lurker.md` § **Swooping Torment**.

#### 43. Bone Dozer, Crash Through, Destructive Rollout, Destructive Path, Crush Underfoot

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Path occupants, relative sizes/materials, obstacles, destroyed/prone outcome and stopping location. **Timing/input burden:** During straight-line movement or each crossing. **Deterministic portion:** Damage/conditions/object destruction and stop rule follow supplied facts.

Owners and exact source sections:

- **Other catalog — Ashen Hoarder**: `monster/ashen-hoarder/statblock/ashen-hoarder.md` § **Bone Dozer**.
- **Other catalog — Frost Giant Wind Sprinter**: `monster/giant/statblock/frost-giant-wind-sprinter.md` § **Crush Underfoot**.
- **Other catalog — Hill Giant Clobberer**: `monster/giant/statblock/hill-giant-clobberer.md` § **Destructive Path**.
- **Other catalog — Ogre Blue Blood**: `monster/ogre/statblock/ogre-blue-blood.md` § **Crush Underfoot (Signature Ability)**.
- **Other catalog — Ogre Juggernaut**: `monster/ogre/statblock/ogre-juggernaut.md` § **Destructive Path**.
- **Other catalog — Troll Glutton**: `monster/troll/statblock/troll-glutton.md` § **Crash Through (3 Malice)**.
- **Other catalog — Servok War Engine**: `monster/valok/statblock/servok-war-engine.md` § **Destructive Rollout**.

#### 46. Noxious Bubble

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Did creature/object physically TOUCH bubble (or did known damage burst it)? **Timing/input burden:** Contact event, before burst. **Deterministic portion:** Damage-trigger branch is recorded state; burst recipients use membership selection.

Owners and exact source sections:

- **Other catalog — Angulotl Wave**: `monster/angulotl/statblock/angulotl-wave.md` § **Noxious Bubble (2 Malice)**.

#### 47. Mobile Mine Field

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Which mines are adjacent to an exploding mine (chain reaction topology). **Timing/input burden:** First explosion and recursively for neighboring mines. **Deterministic portion:** Initial membership trigger/damage can be selected; mine-to-mine adjacency is independent.

Owners and exact source sections:

- **Other catalog — Ashen Hoarder**: `monster/ashen-hoarder/statblock/ashen-hoarder.md` § **Mobile Mine Field (Villain Action 2)**.

#### 48. Portal to the Void

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Did forced movement actually reach area CENTER (distinct from being an area member)? **Timing/input burden:** Initial resolution / pull, first center entry per round. **Deterministic portion:** Outer-area slow/pull and centered damage are separate.

Owners and exact source sections:

- **Other catalog — Logostician Vesper**: `monster/war-dog/4th-echelon/statblock/logostician-vesper.md` § **Portal to the Void**.

#### 49. Punishing Regrowth

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Did actual forced movement finish in difficult terrain? **Timing/input burden:** Each qualifying strike's forced-movement completion. **Deterministic portion:** Round buffs and slide grant remain deterministic; only restrain rider waits.

Owners and exact source sections:

- **Other catalog — Wode Elf Malice**: `monster/elf-wode/wode-elf-malice.md` § **Punishing Regrowth (5 Malice)**.

#### 50. Snaking Entrails

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Affected enemy adjacent to a corpse? **Timing/input burden:** Paid rider resolution. **Deterministic portion:** Base attack unchanged; frightened rider only.

Owners and exact source sections:

- **Other catalog — War Dog Thanatite**: `monster/war-dog/2nd-echelon/statblock/war-dog-thanatite.md` § **Snaking Entrails (Signature Ability)**.

#### 51. Rainfall

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Creature/object exposed to sky rather than sheltered. **Timing/input burden:** When weather applies. **Deterministic portion:** Wet condition/duration once exposure known.

Owners and exact source sections:

- **Other catalog — Angulotl Malice**: `monster/angulotl/angulotl-malice.md` § **Rainfall (7 Malice)**.

#### 52. Dirt Devil

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Did Arixx start its turn underground? **Timing/input burden:** Start snapshot, consumed at this ability roll. **Deterministic portion:** Double edge only; area damage and terrain remain independent.

Owners and exact source sections:

- **V1 — Arixx**: `monster/arixx/statblock/arixx.md` § **Dirt Devil (3 Malice)**.

#### 53. Floor Mosaic, First Warning Quake, Final Warning Fissure, No Escape, Earth Pillar, King's Fissure, Roots Run Deep, Seismic Step, Seismic Sense, Seismic King

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Target touching ground; for senses this independently replaces normal line of effect. **Timing/input burden:** Ability eligibility; each relevant perception/targeting check. **Deterministic portion:** Damage/potency and printed movement remain; broad terrain immunities do not require a prompt.

Owners and exact source sections:

- **Other catalog — Field of Growth**: `monster/elemental/statblock/field-of-growth.md` § **Roots Run Deep**.
- **Other catalog — Fossil Cryptic Malice**: `monster/fossil-cryptic/fossil-cryptic-malice.md` § **Floor Mosaic (3 Malice)**.
- **Other catalog — Fossil Cryptic**: `monster/fossil-cryptic/statblock/fossil-cryptic.md` § **Seismic Step**.
- **Other catalog — Fossil Cryptic**: `monster/fossil-cryptic/statblock/fossil-cryptic.md` § **First Warning Quake (Villain Action 1)**.
- **Other catalog — Fossil Cryptic**: `monster/fossil-cryptic/statblock/fossil-cryptic.md` § **Final Warning Fissure (Villain Action 2)**.
- **Other catalog — Fossil Cryptic**: `monster/fossil-cryptic/statblock/fossil-cryptic.md` § **No Escape (Villain Action 3)**.
- **Other catalog — Kingfissure Worm**: `monster/kingfissure-worm/statblock/kingfissure-worm.md` § **Seismic King**.
- **Other catalog — Kingfissure Worm**: `monster/kingfissure-worm/statblock/kingfissure-worm.md` § **King's Fissure (Villain Action 1)**.
- **Other catalog — Mohler**: `monster/orc/statblock/mohler.md` § **Seismic Sense**.
- **Other catalog — Orc Terranova**: `monster/orc/statblock/orc-terranova.md` § **Earth Pillar (Signature Ability)**.
- **Other catalog — Orc Terranova**: `monster/orc/statblock/orc-terranova.md` § **Seismic Step**.

#### 54. Earth Bump, Whiptail

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Mohler at least 1 square beneath target / target atop scyza. **Timing/input burden:** Ability use. **Deterministic portion:** Conditional prone / edge and displacement only.

Owners and exact source sections:

- **Other catalog — Mohler**: `monster/orc/statblock/mohler.md` § **Earth Bump (Signature Ability)**.
- **Other catalog — Scyza**: `monster/orc/statblock/scyza.md` § **Whiptail**.

#### 55. Meltdown

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Enemy is on ground at turn start. **Timing/input burden:** Each enemy turn start during effect. **Deterministic portion:** Slagged application once grounded fact known.

Owners and exact source sections:

- **Other catalog — Crucible Dragon Malice**: `monster/dragon/crucible-dragon-malice.md` § **Meltdown (7 Malice)**.

#### 56. Stomp, Drill Press

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Is the ground suitably soft? **Timing/input burden:** Successful effect resolution. **Deterministic portion:** Other damage/restrain unaffected; entrenchment/hole creation conditional.

Owners and exact source sections:

- **Other catalog — Ceramic Horse**: `monster/elf-high/statblock/ceramic-horse.md` § **Stomp**.
- **Other catalog — Hill Giant Clobberer**: `monster/giant/statblock/hill-giant-clobberer.md` § **Stomp (3 Malice)**.
- **Other catalog — Servok Miner**: `monster/valok/statblock/servok-miner.md` § **Drill Press (Signature Ability)**.

#### 57. Stone Pillars

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Pillar rise/descent brings creature into contact with ceiling/floor. **Timing/input burden:** Placement and vertical movement completion. **Deterministic portion:** Prone/lift and potency-gated restraint separate.

Owners and exact source sections:

- **Other catalog — Fossil Cryptic Malice**: `monster/fossil-cryptic/fossil-cryptic-malice.md` § **Stone Pillars (5 Malice)**.

#### 58. Swordfall, Hammer and Anvil, Circle and Strike, Gravity Well, Investiture of Gravity, Crack the Earth, Skeletal Eruption

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual descent/fall distance, obstacle contact and landing consequence; Circle also directly-above trigger. **Timing/input burden:** Vertical movement/collision/landing. **Deterministic portion:** Damage formulas and conditional restraint/grab/prone; attack baseline remains.

Owners and exact source sections:

- **Other catalog — Ashen Hoarder**: `monster/ashen-hoarder/statblock/ashen-hoarder.md` § **Skeletal Eruption (Villain Action 1)**.
- **Other catalog — Crucible Dragon Malice**: `monster/dragon/crucible-dragon-malice.md` § **Swordfall (3 Malice)**.
- **Other catalog — Crucible Dragon**: `monster/dragon/statblock/crucible-dragon.md` § **Hammer and Anvil (1 Malice)**.
- **Other catalog — Meteor Dragon**: `monster/dragon/statblock/meteor-dragon.md` § **Gravity Well (Signature Ability)**.
- **Other catalog — Meteor Dragon**: `monster/dragon/statblock/meteor-dragon.md` § **Investiture of Gravity (5 Malice)**.
- **Other catalog — Griffon**: `monster/griffon/statblock/griffon.md` § **Crack the Earth**.
- **Other catalog — Striped Condor Griffon**: `monster/griffon/statblock/striped-condor-griffon.md` § **Circle and Strike**.

#### 66. Convocation of Chaos, Convocation of Verdure, Burning Aurora, Shared Sickness, Emergency Beacon, Wyrd Dyr, Locked On, Banded Predator, Shapeshifter

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Line of effect between specified source and affected creature/area (or absence from ALL enemies). **Timing/input burden:** Ability-trigger event, turn-start drain, buff use, hide/shapechange as printed. **Deterministic portion:** Nonspatial buffs, damage and conditions remain; not ordinary chosen-target range.

Owners and exact source sections:

- **Other catalog — Meteor Dragon**: `monster/dragon/statblock/meteor-dragon.md` § **Burning Aurora (Villain Action 2)**.
- **Other catalog — Elemental Malice**: `monster/elemental/elemental-malice.md` § **Convocation of Chaos (7 Malice)**.
- **Other catalog — Field of Growth**: `monster/elemental/statblock/field-of-growth.md` § **Convocation of Verdure**.
- **Other catalog — Brush Stalker**: `monster/elf-shadow/statblock/brush-stalker.md` § **Wyrd Dyr**.
- **Other catalog — Fire Giant Lightbearer**: `monster/giant/statblock/fire-giant-lightbearer.md` § **Emergency Beacon**.
- **Other catalog — Striped Condor Griffon**: `monster/griffon/statblock/striped-condor-griffon.md` § **Banded Predator**.
- **Other catalog — Wode Hag**: `monster/hag/statblock/wode-hag.md` § **Shapeshifter**.
- **Other catalog — Time Raider Armiger**: `monster/time-raider/statblock/time-raider-armiger.md` § **Shared Sickness**.
- **Other catalog — Voiceless Talker Artillerist**: `monster/voiceless-talker/statblock/voiceless-talker-artillerist.md` § **Locked On**.

#### Flying Sawblade

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Roughneck was vertically force moved by another creature; where during that movement or after fall the attack occurs. **Timing/input burden:** Movement interrupt. **Deterministic portion:** Haymaker roll/effects and reaction accounting remain deterministic.

- **V1 — Bugbear Roughneck**: `monster/bugbear/statblock/bugbear-roughneck.md` § **Flying Sawblade**.

#### Investiture of Verdure

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Which selected dragonsealed targets were actually pulled, rather than merely instructed to move. **Timing/input burden:** After each pull. **Deterministic portion:** 5 temporary Stamina per actually pulled target; selection count alone is insufficient.

- **V1 — Thorn Dragon**: `monster/dragon/statblock/thorn-dragon.md` § **Investiture of Verdure (5 Malice)**.

#### Gore Horn

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Charge actually moved at least 2 squares. **Timing/input burden:** Strike resolution. **Deterministic portion:** Only +10 damage depends on distance.

- **Other catalog — Unguloid**: `monster/demon/4th-echelon/statblock/unguloid.md` § **Gore Horn (Signature Ability)**.

#### Unimpeded, Leapfrog, Blizzard Surge

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Actual traversed creature/mentor spaces or enemies within 2 along entire route. **Timing/input burden:** During movement. **Deterministic portion:** Damage, extra jump allowance, or repeated strikes follow path; Angulotl Malice additionally identifies inactive ally.

- **Other catalog — Angulotl Malice**: `monster/angulotl/angulotl-malice.md` § **Leapfrog (3 Malice)**.
- **Other catalog — Frost Giant Wind Sprinter**: `monster/giant/statblock/frost-giant-wind-sprinter.md` § **Blizzard Surge (5 Malice)**.
- **Other catalog — Orc Bloodrunner**: `monster/orc/statblock/orc-bloodrunner.md` § **Unimpeded**.
- **Other catalog — Angulotl Hopper**: `monster/retainer/statblock/angulotl-hopper.md` § **Leapfrog  (Signature Ability)**.

#### Lash Out, Club Swing, Chain Hook

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Forced movement entered another creature's space, dealt collision damage, or triggered a trap with a power roll. **Timing/input burden:** Forced movement completion / trap activation. **Deterministic portion:** Base attack remains; secondary damage, slide or trap double edge conditional.

- **Other catalog — Basilisk**: `monster/basilisk/statblock/basilisk.md` § **Lash Out**.
- **Other catalog — Kobold Artifex**: `monster/kobold/statblock/kobold-artifex.md` § **Chain Hook (Signature Ability)**.
- **Other catalog — Ogre Goon**: `monster/ogre/statblock/ogre-goon.md` § **Club Swing (Signature Ability)**.
- **Other catalog — Haunt**: `monster/undead/3rd-echelon/statblock/haunt.md` § **Lash Out (Signature Ability)**.

#### Tail Whip

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Does actual endpoint leave target within 2 of scaletooth? **Timing/input burden:** After slide. **Deterministic portion:** Only potency-gated grab depends on endpoint.

- **Other catalog — Lizardfolk Scaletooth**: `monster/lizardfolk/statblock/lizardfolk-scaletooth.md` § **Tail Whip (2 Malice)**.

#### Blood in the Water, Life Drain, Magnetized Wyrmscale Aura

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Endpoint closer to prone creature / no closer to any shade / movement away from dragon forbidden. **Timing/input burden:** Each affected move or endpoint. **Deterministic portion:** Bonus distance or movement restriction only; aura membership trigger itself excluded.

- **Other catalog — Crucible Dragon**: `monster/dragon/statblock/crucible-dragon.md` § **Magnetized Wyrmscale Aura**.
- **Other catalog — Orc Juggernaut**: `monster/orc/statblock/orc-juggernaut.md` § **Blood in the Water**.
- **Other catalog — Shade**: `monster/undead/1st-echelon/statblock/shade.md` § **Life Drain (Signature Ability)**.

#### Leading

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Enemy being left is adjacent to magistrate ally. **Timing/input burden:** Movement from that enemy. **Deterministic portion:** Permission to shift instead of move, rather than automatic damage changes.

- **Other catalog — Devil Magistrate**: `monster/devil/statblock/devil-magistrate.md` § **Leading**.

#### Aetherweb

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** For EACH nearby enemy, already adjacent to target or actually shifted adjacent in response? **Timing/input burden:** Before copying potency effect. **Deterministic portion:** Original target effect and potency remain; secondary resistance requires pairwise adjacency and offered response.

- **Other catalog — High Elf Orbweaver**: `monster/elf-high/statblock/high-elf-orbweaver.md` § **Aetherweb**.

#### Of the Umbra, Night Knife, Petrify, Mass Petrify

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Direct sunlight or actual concealment/cover causing immunity, weakness, extra target or potency changes. **Timing/input burden:** Defense or ability use. **Deterministic portion:** These are extra numerical/target-count predicates, not ordinary attack cover confirmation. Parent may already have recorded cover/concealment facts.

- **Other catalog — Shadow Elf Assassin**: `monster/elf-shadow/statblock/shadow-elf-assassin.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Cloak**: `monster/elf-shadow/statblock/shadow-elf-cloak.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Dusk Mage**: `monster/elf-shadow/statblock/shadow-elf-dusk-mage.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Duskcaller**: `monster/elf-shadow/statblock/shadow-elf-duskcaller.md` § **Night Knife (Signature Ability)**.
- **Other catalog — Shadow Elf Duskcaller**: `monster/elf-shadow/statblock/shadow-elf-duskcaller.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Eclipse**: `monster/elf-shadow/statblock/shadow-elf-eclipse.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Knightfell**: `monster/elf-shadow/statblock/shadow-elf-knightfell.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Luminator**: `monster/elf-shadow/statblock/shadow-elf-luminator.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Moondancer**: `monster/elf-shadow/statblock/shadow-elf-moondancer.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Mournblade**: `monster/elf-shadow/statblock/shadow-elf-mournblade.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Nightstrike**: `monster/elf-shadow/statblock/shadow-elf-nightstrike.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Noctis Mage**: `monster/elf-shadow/statblock/shadow-elf-noctis-mage.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Panther**: `monster/elf-shadow/statblock/shadow-elf-panther.md` § **Of the Umbra**.
- **Other catalog — Shadow Elf Sniper**: `monster/elf-shadow/statblock/shadow-elf-sniper.md` § **Of the Umbra**.
- **Other catalog — Medusa**: `monster/medusa/statblock/medusa.md` § **Petrify (5 Malice)**.
- **Other catalog — Medusa**: `monster/medusa/statblock/medusa.md` § **Mass Petrify (Villain Action 1)**.
- **Other catalog — Shadow Elf Shade**: `monster/retainer/statblock/shadow-elf-shade.md` § **Of the Umbra**.

#### Fairness Is a Human Concept, Striking Afterimage, Stalker's Afterimage

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Cover/concealment at completed movement destination. **Timing/input burden:** After shift/teleport; delayed hide for warleader. **Deterministic portion:** Free strikes/damage reduction and movement remain independent.

- **Other catalog — Wode Elf Warleader**: `monster/elf-wode/statblock/wode-elf-warleader.md` § **Fairness Is a Human Concept (5 Malice)**.
- **Other catalog — Lightbender Pouncer**: `monster/lightbender/statblock/lightbender-pouncer.md` § **Striking Afterimage**.
- **Other catalog — Lightbender**: `monster/lightbender/statblock/lightbender.md` § **Stalker's Afterimage**.

#### Reactive Rebuke

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Subject becomes 11+ squares from Rhodar. **Timing/input burden:** After displacement; until frightened ends. **Deterministic portion:** Initial frightened application unaffected; spatial fact only ends it.

- **Other catalog — Count Rhodar von Glauer**: `monster/count-rhodar-von-glauer/statblock/count-rhodar-von-glauer.md` § **Reactive Rebuke (2 Malice)**.

#### Unslakable Bloodthirst, Agonizing Bloodthirst

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Can owner actually reach/use required attack against ANY bleeding creature on its turn? **Timing/input burden:** Turn planning/end, not a voluntary target pick. **Deterministic portion:** Nearby-creature speed buff may use maintained membership; compelled attack / self-damage requires feasibility. Include ONLY that extra predicate.

- **Other catalog — Vampire Rebel**: `monster/retainer/statblock/vampire-rebel.md` § **Agonizing Bloodthirst**.
- **Other catalog — Vampire Spawn**: `monster/undead/2nd-echelon/statblock/vampire-spawn.md` § **Unslakable Bloodthirst**.
- **Other catalog — Blood-Starved Vampire**: `monster/undead/3rd-echelon/statblock/blood-starved-vampire.md` § **Unslakable Bloodthirst**.
- **Other catalog — Vampire**: `monster/undead/3rd-echelon/statblock/vampire.md` § **Unslakable Bloodthirst**.

#### Phantom Pain, Rejuvenation, Upholding High Standards

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Physical touch of illusion/soulstone or entry into dead signifer's space to retrieve standard. **Timing/input burden:** Contact/retrieval. **Deterministic portion:** Normal illusion, test consequences or statblock replacement is deterministic once contact supplied; ordinary surrounding aura excluded.

- **Other catalog — Kobold Signifer**: `monster/kobold/statblock/kobold-signifer.md` § **Upholding High Standards**.
- **Other catalog — Lich**: `monster/lich/statblock/lich.md` § **Rejuvenation**.
- **Other catalog — Lord Syuul**: `monster/lord-syuul/statblock/lord-syuul.md` § **Phantom Pain (Villain Action 2)**.

#### Shrikegun Shot

**Classification: strict core — retain only the additional predicate described here, not the whole ability.**

**Unknown fact:** Is selected target within 2 (inside the ability's longer legal range)? **Timing/input burden:** Damage resolution. **Deterministic portion:** Only extra 3 damage depends on narrower proximity.

- **Other catalog — War Dog Sweeper**: `monster/war-dog/2nd-echelon/statblock/war-dog-sweeper.md` § **Shrikegun Shot (Signature Ability)**.

#### Stone Swim — Basilisk Malice underground immunity only

**Classification: strict core.** Unknown fact: currently underground when taking damage. Timing: damage event until the paid feature ends. Deterministic consequence: damage immunity 2. Generic burrowing and no-drag permission are excluded.

- **Other catalog — Basilisk Malice**: `monster/basilisk/basilisk-malice.md` § **Stone Swim (3+ Malice)**.

#### Bat Form — failed fit damage only

**Classification: strict core, narrow clause.** Unknown fact: can the returning true form fit at the actual endpoint? Timing: end of the bat-form shift. Numeric consequence: 10 damage if it cannot. The nearest-space relocation is secondary geometry, not itself a core candidate.

- **Other catalog — Vampire Rebel**: `monster/retainer/statblock/vampire-rebel.md` § **Bat Form (Encounter)**.

## Secondary appendix — instructions, geometry, and membership boundaries (not core)

Retained to document whole-catalog coverage without converting geometric wording into a new deferral. **Swarm** can be handled by selecting overlapping occupants, like area membership. **Paranormal Fling / Paranormal Activity** print fixed nearest-enemy movement instructions without extra numerical consequence. These are not strict-core blockers. Nearest target choice in **Accursed Rage** is likewise separated from its deterministic rage threshold/reset. Pure terrain creation, relocation and path permissions below do not by themselves justify a new prompt.

#### 6. Swarm

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Which creatures share the swarm's occupied space; legal occupied-space endpoint. **Timing/input burden:** Owner turn start; movement endpoints. **Deterministic portion:** Free strikes and size-based movement permission remain separable.

Owners and exact source sections:

- **Other catalog — Animal Swarm**: `monster/animal/statblock/animal-swarm.md` § **Swarm**.
- **Other catalog — Bugbear Mob**: `monster/bugbear/statblock/bugbear-mob.md` § **Swarm**.
- **Other catalog — Minotaur Stampede**: `monster/minotaur/statblock/minotaur-stampede.md` § **Swarm**.

#### 12. Accursed Rage, Souls of the Broken, Show Me Who You Are, Overflowing Rage, Immortal Soul

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Identity of nearest eligible creature/ally/enemy/object/war dog, including ties and legal movement toward it. **Timing/input burden:** Rage start; ability resolution; death transfer and later transfers. **Deterministic portion:** Rage reset, damage/conditions, inherited buffs/actions remain deterministic after identity.

Owners and exact source sections:

- **Other catalog — Omen Dragon**: `monster/dragon/statblock/omen-dragon.md` § **Souls of the Broken (Villain Action 2)**.
- **Other catalog — Voiceless Talker Evolutionist**: `monster/voiceless-talker/statblock/voiceless-talker-evolutionist.md` § **Show Me Who You Are (Villain Action 1)**.
- **Other catalog — Soulbinder Psyche**: `monster/war-dog/4th-echelon/statblock/soulbinder-psyche.md` § **Immortal Soul**.
- **V1 — Werewolf**: `monster/werewolf/statblock/werewolf.md` § **Accursed Rage**.
- **Other catalog — Wyvern Malice**: `monster/wyvern/wyvern-malice.md` § **Overflowing Rage (7 Malice)**.

#### 13. Paranormal Activity, Paranormal Fling

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Nearest enemy within 3 of EACH object and the object's actual trajectory. **Timing/input burden:** Each selected object's movement. **Deterministic portion:** Rise/pull instruction is fixed; do not claim movement or collisions occurred.

Owners and exact source sections:

- **V1 — Ghost**: `monster/undead/1st-echelon/statblock/ghost.md` § **Paranormal Activity (Villain Action 1)**.
- **V1 — Undead Malice (Level 1+ Malice Features)**: `monster/undead/1st-echelon/undead-malice-level-1-malice-features.md` § **Paranormal Fling (3 Malice)**.

#### 44. Cobblestone Shape, Castle Stone Shape, Blazing Trail, Convocation of Waves, Slime Trail, Ground Grinder, Titanic Tunneler, Valiar Tunneler

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Path squares and their terrain/underground depth; which squares become trail, wall, stream or tunnel. **Timing/input burden:** During/after movement; later membership can use ordinary area cards. **Deterministic portion:** Terrain creation geometry is independent; later membership effects need no new blocker.

Owners and exact source sections:

- **Other catalog — Essence of Tides**: `monster/elemental/statblock/essence-of-tides.md` § **Convocation of Waves**.
- **Other catalog — Basalt Stone Giant**: `monster/giant/statblock/basalt-stone-giant.md` § **Cobblestone Shape**.
- **Other catalog — Granite Stone Giant**: `monster/giant/statblock/granite-stone-giant.md` § **Castle Stone Shape**.
- **Other catalog — Hobgoblin Firerunner**: `monster/hobgoblin/statblock/hobgoblin-firerunner.md` § **Blazing Trail**.
- **Other catalog — Kingfissure Worm**: `monster/kingfissure-worm/statblock/kingfissure-worm.md` § **Titanic Tunneler**.
- **Other catalog — Mohler**: `monster/orc/statblock/mohler.md` § **Ground Grinder**.
- **Other catalog — Servok Miner**: `monster/valok/statblock/servok-miner.md` § **Valiar Tunneler**.
- **Other catalog — Xorannox's Malice**: `monster/xorannox-the-tyract/xorannoxs-malice.md` § **Slime Trail (5 Malice)**.

#### 45. Stone Walker; underground Stone Swim rider separated into core below

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Stone/solid-matter traversal, underground state, entry space and legal exit; dragging restriction. **Timing/input burden:** Movement and endpoint, plus underground defense use. **Deterministic portion:** Movement permission/immunity rules are deterministic; legal path and ejection space require facts.

Owners and exact source sections:

- **Other catalog — Dwarf Stone Whisperer**: `monster/dwarf/statblock/dwarf-stone-whisperer.md` § **Stone Walker**.

#### 59. Spirited Away, Turned Upside Down, Nostalgic Wanderlust

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Altitude and suspended location; actual vertical forced movement where required. **Timing/input burden:** Turn end rise / movement / restraint ending. **Deterministic portion:** Condition durations and flight/slow/weakening bundles remain separable.

Owners and exact source sections:

- **Other catalog — Izyak**: `monster/demon/4th-echelon/statblock/izyak.md` § **Nostalgic Wanderlust (Signature Ability)**.
- **Other catalog — Wode Hag**: `monster/hag/statblock/wode-hag.md` § **Turned Upside Down (2 Malice)**.
- **V1 — Ghost**: `monster/undead/1st-echelon/statblock/ghost.md` § **Spirited Away (Villain Action 2)**.

#### 60. Full Wolf, Bat Form, Engulf

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Space fits enlarged/returned form or aggregate engulfed occupants; nearest legal ejection if needed. **Timing/input burden:** Transformation/engulf/release. **Deterministic portion:** Form statistics, damage and periodic engulfed effects remain deterministic.

Owners and exact source sections:

- **Other catalog — Trained Gummy Brick**: `monster/kobold/statblock/trained-gummy-brick.md` § **Engulf (Signature Ability)**.
- **Other catalog — Vampire Rebel**: `monster/retainer/statblock/vampire-rebel.md` § **Bat Form (Encounter)**.
- **V1 — Werewolf**: `monster/werewolf/statblock/werewolf.md` § **Full Wolf (Villain Action 2)**.

#### 61. Geyser, Titanic Tear, Mohler Cavity, Break Ground, People Bowling

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Nearest legal safe space outside fissure/area; Mohler also at least one grounded occupant. **Timing/input burden:** Resolution before escape/fall; per creature. **Deterministic portion:** Test tiers and damage remain; endpoint and collision not invented.

Owners and exact source sections:

- **V1 — Arixx Malice**: `monster/arixx/arixx-malice.md` § **Geyser (5 Malice)**.
- **Other catalog — Giant Malice**: `monster/giant/giant-malice.md` § **Titanic Tear (7 Malice)**.
- **Other catalog — Ogre Goon**: `monster/ogre/statblock/ogre-goon.md` § **People Bowling (3 Malice)**.
- **Other catalog — Orc Malice**: `monster/orc/orc-malice.md` § **Mohler Cavity (7 Malice)**.
- **Other catalog — Servok Miner**: `monster/valok/statblock/servok-miner.md` § **Break Ground (5 Malice)**.

#### 62. Wyrd Warp, Elevate, Pillar, Decree by the Jade Hand, Sunderbuss, Earthwave

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Ground geometry/elevation change, support beneath creatures, ensuing fall. **Timing/input burden:** Terrain creation/destruction; per supported creature. **Deterministic portion:** Power-roll damage/conditions remain; changed terrain geometry is table fact.

Owners and exact source sections:

- **Other catalog — Ajax the Invincible**: `monster/ajax-the-invincible/statblock/ajax-the-invincible.md` § **Decree by the Jade Hand**.
- **Other catalog — Aeolyxria the Uncanny**: `monster/draconian/statblock/aeolyxria-the-uncanny.md` § **Elevate (2 Malice)**.
- **Other catalog — High Elf Wyrd**: `monster/elf-high/statblock/high-elf-wyrd.md` § **Wyrd Warp (2 Malice)**.
- **Other catalog — Granite Stone Giant**: `monster/giant/statblock/granite-stone-giant.md` § **Pillar**.
- **Other catalog — Time Raider Cannonfall**: `monster/time-raider/statblock/time-raider-cannonfall.md` § **Sunderbuss (Signature Ability)**.
- **Other catalog — War Dog Geomancer**: `monster/war-dog/3rd-echelon/statblock/war-dog-geomancer.md` § **Earthwave (Signature Ability)**.

#### 63. Walleye, Siegeworks, Scorekeeping Scales, Indirect Fire, Bloodscent

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Wall orientation/adjacency or existence of size-1 opening connecting source and target. **Timing/input burden:** Ability or line-of-effect check. **Deterministic portion:** Exceptions to ordinary line of effect only; other ability clauses survive.

Owners and exact source sections:

- **Other catalog — Basilisk Malice**: `monster/basilisk/basilisk-malice.md` § **Walleye (7 Malice)**.
- **Other catalog — Lydixavus the Deadeye**: `monster/draconian/statblock/lydixavus-the-deadeye.md` § **Scorekeeping Scales**.
- **Other catalog — Dwarf Launcher**: `monster/dwarf/statblock/dwarf-launcher.md` § **Indirect Fire**.
- **Other catalog — Gnoll Abyssal Archer**: `monster/gnoll/statblock/gnoll-abyssal-archer.md` § **Bloodscent**.
- **Other catalog — War Dog Geomancer**: `monster/war-dog/3rd-echelon/statblock/war-dog-geomancer.md` § **Siegeworks**.

#### 64. Build Wall

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Which removable wet-concrete squares are unoccupied and within range; count to convert to wall squares. **Timing/input burden:** Wall creation. **Deterministic portion:** 2 additional wall squares per eligible removed square.

Owners and exact source sections:

- **Other catalog — Servok Builder**: `monster/valok/statblock/servok-builder.md` § **Build Wall**.

#### 65. Heady or Not, Lop

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Actual head location / entering its square; beheaded line-of-effect adjacency cap. **Timing/input burden:** Head pickup/reattachment and targeting while headless. **Deterministic portion:** Form statistics, bleeding and survival duration are separable.

Owners and exact source sections:

- **Other catalog — Bredbeddle**: `monster/bredbeddle/statblock/bredbeddle.md` § **Heady or Not**.
- **Other catalog — Bredbeddle**: `monster/bredbeddle/statblock/bredbeddle.md` § **Lop (3 Malice)**.

#### Petrifying Fumes, Kingdom of Isolation

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Adjacency to tonguesnapper / within 2 of a frost giant at subject turn start. **Timing/input burden:** Recurring turn-start snapshot. **Deterministic portion:** Potency slow / no-shift restriction; these are Overwhelm-like printed traits. A parent may choose to represent a maintained radius membership, which would remove the need for a new question.

- **Other catalog — Basilisk Tonguesnapper**: `monster/basilisk/statblock/basilisk-tonguesnapper.md` § **Petrifying Fumes**.
- **Other catalog — Frost Giant Snowblaster**: `monster/giant/statblock/frost-giant-snowblaster.md` § **Kingdom of Isolation**.
- **Other catalog — Frost Giant Storm Hurler**: `monster/giant/statblock/frost-giant-storm-hurler.md` § **Kingdom of Isolation**.
- **Other catalog — Frost Giant Wind Sprinter**: `monster/giant/statblock/frost-giant-wind-sprinter.md` § **Kingdom of Isolation**.

#### Abyssal Jaunt / Necrotic Form

**Classification: secondary instruction / geometry / membership boundary; excluded from strict core.**

**Unknown fact:** Did movement/turn end inside solid matter; where was entry space? **Timing/input burden:** Movement end or turn end as printed. **Deterministic portion:** Immunities and condition clearing independent of ejection fact.

- **Other catalog — Demon Malice (Level 4+ Malice Features)**: `monster/demon/2nd-echelon/demon-malice-level-4-malice-features.md` § **Abyssal Jaunt (3 Malice)**.

- **Other catalog — Lich**: `monster/lich/statblock/lich.md` § **Necrotic Form**. Only endpoint shunting is geometric; immunity/condition clearing are deterministic.

## Source of Earth — final imported-record coverage

**Other catalog; not chosen V1.** All four sections checked at `monster/summon/elementalist/statblock/source-of-earth.md`:

- **Earthwalk**: terrain material changes movement cost (earth/stone exemption). Secondary movement permission; excluded from strict core under the narrowed scope.
- **Tunneler**: burrowing creates a size-2 tunnel. Secondary path/geometry instruction; no extra damage/condition/trigger predicate.
- **Earth Harness**: grants free-action use of **Earth Accepts Me** to meld into the source, to a creature already possessing that ability. Ownership/grant and melded state are explicit, not a new Overwhelm-like spatial question.
- **Boulder Bash**: fixed tier damage and push distances; ordinary targets/range/movement, excluded.

The linked `feature/ability/elementalist/level-3/earth-accepts-me.md` § **Effect** was checked only to resolve Earth Harness: size/material eligibility, inside/outside line-of-effect restriction and 10 damage upon destruction of the melded object. Once host/meld state is recorded, destruction damage is an event consequence; it does not require repeated spatial questioning. No hero-wide audit was performed. Import/reference evidence only; runtime support was not individually verified.

## Related monster group context (not extra imported stat blocks)

- **V1 — Werewolf**, `monster/group/werewolf.md` § **Shared Ferocity**: line of effect to the first qualifying ferocity-cost ability; check at that ability use. The 1d3 Malice award and encounter limit are deterministic once seen. Planned V226, accepted Q-FOE-3.
- **V1 — Thorn Dragon**, `monster/group/dragon.md` § **Thorn Dragon's Domain**: whether domain is active (one-week prerequisite), and whether a creature is grounded when restrained. Grounded bleeding rider needs that event fact; map-wide speed modifier can follow an explicit domain toggle. Already text/manual by Q-FOE-4; this is not a new deferral.
- **V1 — Thorn Dragon**, `monster/dragon/statblock/thorn-dragon.md` § **Malign Thicket (Villain Action 3)**: invokes Bramble Barricade twice, inheriting its forced-square-count dependency. Its dragon-caused forced-movement poison/weakening rider requires evidence of actual displacement by the dragon. An allowance, pull instruction, chosen target, or membership add does NOT prove that displacement; this audit does not establish that current runtime observes it. Once confirmed, 1d3 poison and the potency check are deterministic. Domain-dependent turn-start poison remains explicitly manual/user-shelved under Q-FOE-4, not claimed supported by a toggle. Preserve the independently supported clauses.
- **Other catalog — Crucible Dragon**, `monster/group/dragon.md` § **Crucible Dragon's Domain**: turn-start contact with ANY surface, and collision with a surface during forced movement, after the domain prerequisite. The +5 contact/collision damage can be calculated; lightning splash recipients are membership-only and excluded.
- **Other catalog — configurable Animals**, `monster/group/animal.md` § **Defensive Traits / Camouflage (1 Point)**: absence of line of effect from every enemy, at owner turn end, permits automatic hide. **Pack (1 Point)**: adjacent ally at defense/condition event grants flanking/frightened immunity. **Spiny (1 Point)**: adjacent grabbing/melee attacker at event takes fixed damage. **Stench (2 Points)**: adjacent enemies at animal turn start, then fixed potency/shift. § **Offensive Traits / Pouncer (1 Point)**: actual landing on enemy of permitted size allows prone/free strike. These apply only when that customizable trait was selected; examples in “Typically Used By” are not additional imported owners.

## Borderline exclusions and narrower retained clauses

- **Membership only, excluded:** Thorn Dragon **Withering Wyrmscale Aura** (`monster/dragon/statblock/thorn-dragon.md`); Ghost **Phantom Flow** (`monster/undead/1st-echelon/statblock/ghost.md`); Arixx **Spitfire / Acid Spew / Dust Cloud** (`monster/arixx/statblock/arixx.md`); Rotting Zombie **Death Grasp** and Decrepit Skeleton **Bonetrops** (their named files under `monster/undead/1st-echelon/statblock/`); Undead Malice **The Grasping, the Hungry** (`monster/undead/1st-echelon/undead-malice-level-1-malice-features.md`). Membership can be defined as the printed adjacent-to-surface zone. Unsupported object/minion riders are not spatial blockers.
- **Membership only, excluded:** Brambleguard **Wall of Roses / Thicket and Thorns** (`monster/elf-high/statblock/brambleguard.md`), Clawfish **Shocking** (`monster/angulotl/statblock/clawfish.md`), Angulotl Daybringer **Sun Lamp** (`monster/angulotl/statblock/angulotl-daybringer.md`), Skeleton Knight **Bitter Bones** (`monster/undead/4th-echelon/statblock/skeleton-knight.md`). Fixed zone damage/healing at enter/start needs no predicate beyond membership. Geometry/line-of-effect walls are table layout work, not a reason to defer these riders.
- **Membership-only repeated death splash, excluded:** **Loyalty Collar** and its named variants across imported War Dogs, **Infernal Ichor** across Hobgoblins/retainer Flameslinger, **Brittle Revenge** (Hollowbone Launcher), **Prismacore Detonation** (War Dog Prismite), **Soul Singularity** (Ashen Hoarder), **Necrotic Rupture** (Undead Malice level 7). Selecting explosion recipients suffices. Mobile Mine Field is retained only for mine-to-mine chain adjacency.
- **Ordinary selection/range, excluded:** Monarch **Meat Shield**, Underboss **Swordplay**, chosen recipient of **Grab Javelin** pull, Thorn Dragon **Thorny Scales** (Melee 1 trigger), routine ally free-strike grants. **Parry!** remains a candidate for the independent defended-ally/source adjacency relation. If existing reaction holder input already supplies that relation, no additional question is needed.
- **Ordinary alternative-origin target selection, excluded:** **Chaincast**, **Mind Over Manners**, **Psionic Conductor / Psionic Amplifier**, Arachnite **Longarm Shrikegun**, Wode Elf Lookout **There!**; select legal origin and target using existing range/line-of-effect facts. No extra trigger/count predicate identified.
- **Pure capabilities, excluded:** **Crafty**, **Vukenstep**, **Fickle and Free**, **Stone Steps**, **Nimble**, **Sure-Footed**, and ordinary **Stone Swim**, **Slip**, **Invisible Horror** permission clauses. Stone Walker/Abyssal Jaunt/lich spectral movement are retained only for conditional shunting and remembered entry position. Basilisk Malice Stone Swim is retained only for underground damage immunity, not generic burrowing.
- **Recorded state, excluded:** Zombie **Clobber and Clutch** / Arixx **Bite** turn-start damage relies on recorded source-owned grab and size, not fresh adjacency. Skeleton **Bone Shards** depends on a recorded willing-movement event, not direction/path/count. Sucker Punch and other start-hidden riders use a recorded hidden relationship; a need for historical state alone is not proof of a spatial blocker.
- **Repeated proximity buffs:** ordinary “all creatures within radius” and existential member buffs (e.g. Wyvern **Ruthless Rage / Stubborn Rage**, Vampire **Lord's Bloodthirst** speed/edge) are excluded as membership-shaped. The separate vampire obligation to attack if able is retained because actual feasibility is an additional fact.
- **Overwhelm-like borderline:** **Petrifying Fumes / Kingdom of Isolation** are named in the appendix because they print individual turn-start proximity checks. If represented as maintained moving-zone membership, their only spatial predicate disappears. **Overwhelm** itself has an explicit text-only user disposition. **Imposing Energy / Abyssal Buzzing / Praetorian Buzzing / Lugged Spear** still require counts of overlapping individual creatures; a single union membership does not supply them.
- **No whole-ability conclusions:** count/path/ground predicates affect only their named riders. Fixed damage, resources, potency, source-owned state, lifetime and independent clauses should retain their existing support.

## Final coverage limit

All 501 imported parent records were enumerated and screened, with exact named candidates grouped above and all selected repeated owners listed. This is an exhaustive catalog-wide spatial-language candidate sweep with clause triage, not a claim of line-by-line independent rules review of every nonmatching section, nor exhaustive runtime verification. No tests were run. Main files were read again for current V233/Overwhelm status. Only this review artifact was retained outside the repository.

## Imported supporting statblocks — 37-record coverage extension

**Reconciliation:** `shared/content/compendium/statblock.json` has 475 records. Matching its `sourcePath` suffix after `/md/` against the 438 foe-catalog statblock `source.path` suffixes leaves exactly 37 additional records. All 37 are Summoner minions: nine Demon, ten Elemental, nine Fey, nine Undead. None is a companion or fixture in this actual difference. All are outside the chosen36 foe roster. This extends, rather than repeats, the original 501-parent audit; total covered union is 475 statblocks plus 63 Malice sheets.

**Source discipline:** read each of the 37 canonical unified Markdown files, including all printed trait/ability clauses. No other vendor tree, tests, or online sources. Paths in this section remain relative to the canonical root.

**Current handling evidence:** `shared/content/classes/summoner/minions.ts` contains these source definitions. Inspected routes in `shared/content/classes/summoner/abilities.ts` explicitly describe manual resolution with summoned actors, movement, damage and timing not applied (e.g. Mawful Strike around line 447, Teeth! around 513, Rotting Strike around 612, Shadow Phasing around 703, Soaking Bog around 769). This is evidence of those authored route dispositions, not live execution proof and not authorization for any new deferral. Other clauses below have import/source evidence only unless a route was inspected. `shared/resolve/heroicResourceGeneration.ts` around 370 also explicitly says minions/positions are not tracked for its resource observation; that is supporting context, not an audit of every minion operation.

### Additional strict-core candidates

The following 11 named clauses have an additional spatial predicate beyond ordinary target/member selection. None warrants removing its deterministic remainder.

#### Fanged Musilex — Mawful Strike

`monster/minion/summoner/demon/statblock/fanged-musilex.md` § **Mawful Strike**.

**Unknown fact:** Actual pull finishes adjacent to the chosen musilex. **Timing/input burden:** After confirmed pull; per target. **Deterministic portion:** Only additional 2 damage or grab waits; strike damage, printed reach and participant-based pull distance remain deterministic.

#### Razor — Teeth!

`monster/minion/summoner/demon/statblock/razor.md` § **Teeth!**.

**Unknown fact:** Triggering grabbing/melee enemy is adjacent, plus number of razors adjacent to THAT enemy. **Timing/input burden:** Each qualifying event, once per turn as printed. **Deterministic portion:** Damage equals adjacent-razor count. A selected attacker does not supply the count; preserve the printed use limit without inventing multi-owner stacking.

#### Flow of Magma — Molten Strike 2d10 + R (Signature Ability)

`monster/minion/summoner/elemental/statblock/flow-of-magma.md` § **Molten Strike 2d10 + R (Signature Ability)**.

**Unknown fact:** Which squares the flow actually shifts into; each later entry into a burning square, including movement between burning squares. **Timing/input burden:** At completed shift to establish trail, then each square-entry event until expiry. **Deterministic portion:** Initial 4/6/8 fire and shift allowance remain independent. The 2-damage rider is printed per affected-square entry; merely adding area membership does not show internal square entries. Trail placement alone is secondary geometry.

#### Principle of the Swamp — Encroaching Strike

`monster/minion/summoner/elemental/statblock/principle-of-the-swamp.md` § **Encroaching Strike**.

**Unknown fact:** Would an affected grabbed creature move farther away from its owning principle? **Timing/input burden:** Each attempted movement while this source grab persists. **Deterministic portion:** Keep normal speed and source grab; only directional movement restriction needs comparative distance. Not a generic speed-zero grab.

#### Nixie Hemloche — Whirling Waves

`monster/minion/summoner/fey/statblock/nixie-hemloche.md` § **Whirling Waves**.

**Unknown fact:** Actual damage while the enemy is being force moved, including collision/trajectory facts if needed to establish it. **Timing/input burden:** During actual slide at hemloche turn end. **Deterministic portion:** Area selection and slide-3 instruction are independent; only Might-gated prone rider depends on movement damage. A movement allowance is not proof. If damage-in-movement is already recorded, no new spatial input is needed.

#### Nixie Soakreed — Soaking Bog

`monster/minion/summoner/fey/statblock/nixie-soakreed.md` § **Soaking Bog**.

**Unknown fact:** Number of distinct soaking bogs the target occupies, not just membership in their union. **Timing/input burden:** Target turn start, before potency comparison. **Deterministic portion:** Base slow test remains; +1 potency per additional bog, maximum +2. Separate per-source memberships could supply the count; list as overlap requirement, not a proven new UI prompt.

#### Accursed Mummy — Fetid Bindings 2d10 + R (Signature Ability)

`monster/minion/summoner/undead/statblock/accursed-mummy.md` § **Fetid Bindings 2d10 + R (Signature Ability)**.

**Unknown fact:** Did completed pull leave target adjacent to this mummy? **Timing/input burden:** After actual pull per target. **Deterministic portion:** Base 3/4/6 poison and R-based pull are independent; only strong-Might weakened rider depends on adjacency.

#### Ceaseless Mournling — Rupture

`monster/minion/summoner/undead/statblock/ceaseless-mournling.md` § **Rupture**.

**Unknown fact:** First actual burrowing emergence through the ground surface on this mournling turn. **Timing/input burden:** At emergence event, first on that turn. **Deterministic portion:** Adjacent recipient selection can be multiselect; extra fact is surface breach, not area membership. Fixed free-strike consequence follows confirmation.

#### Husk — Rotting Strike

`monster/minion/summoner/undead/statblock/husk.md` § **Rotting Strike**.

**Unknown fact:** Number of ADDITIONAL husks adjacent to target. **Timing/input burden:** When resolving free-strike potency. **Deterministic portion:** Weak-Might slowed threshold gets +1 per extra husk, capped +2; striking participant count alone does not establish adjacency.

#### Phase Ghoul — Leaping Strike

`monster/minion/summoner/undead/statblock/phase-ghoul.md` § **Leaping Strike**.

**Unknown fact:** Target is in the air when the strike resolves. **Timing/input burden:** After teleport, at strike/potency check. **Deterministic portion:** Teleport allowance and average-Might prone remain; only +1 potency depends on airborne status.

#### Stalker Shade — Shadow Phasing

`monster/minion/summoner/undead/statblock/stalker-shade.md` § **Shadow Phasing**.

**Unknown fact:** Which creatures were actually traversed, and first traversal this round for this source. **Timing/input burden:** During movement, per creature/source round window. **Deterministic portion:** 2 corruption per qualifying traversal; movement permission and forced-collision immunity independent.

### Full 37-record ledger and explicit exclusions

Every source section is listed below. “Core above” points to the clause-specific row; all other entries are excluded or boundary cases with reasons. Repeated **Soulsight**, **Minuscule**, and **Water Weird** therefore have complete owner/path listings.

#### Archer Spittlich

Source: `monster/minion/summoner/demon/statblock/archer-spittlich.md`.

- § **Splash Strike** — Excluded ordinary secondary-target selection: one adjacent enemy for 2 poison; poison-damage no-shift rider uses recorded damage and fixed expiry.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Ensnarer

Source: `monster/minion/summoner/demon/statblock/ensnarer.md`.

- § **Extended Barbed Strike** — Excluded: number of ensnarers STRIKING same target is declared participation, not count of nearby creatures. Chosen pull origin/range is ordinary selection.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Fanged Musilex

Source: `monster/minion/summoner/demon/statblock/fanged-musilex.md`.

- § **Mawful Strike** — Core above; only the stated predicate.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Gushing Spewler

Source: `monster/minion/summoner/demon/statblock/gushing-spewler.md`.

- § **Gushing Strike** — Excluded fixed range and R+2 slide instruction.
- § **Spew Slide** — Secondary: trail geometry needs exited squares. Bane while occupying slime is membership-only; damage trigger and shift-2 are recorded-event/instruction clauses.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Hulking Chimor

Source: `monster/minion/summoner/demon/statblock/hulking-chimor.md`.

- § **Mercurial Strike** — Excluded condition/potency arithmetic from current round; no spatial fact.
- § **Evershifting** — Excluded unconditional opportunity-attack movement permission.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Rasquine

Source: `monster/minion/summoner/demon/statblock/rasquine.md`.

- § **Skulker** — Excluded teleport-event hide permission; no extra spatial predicate printed.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Razor

Source: `monster/minion/summoner/demon/statblock/razor.md`.

- § **Teeth!** — Core above; only the stated predicate.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Twisted Bengrul

Source: `monster/minion/summoner/demon/statblock/twisted-bengrul.md`.

- § **Mind Twist 2d10 + R (Signature Ability)** — Excluded ordinary chosen targets and fixed damage/potency/twisted restrictions.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Violent

Source: `monster/minion/summoner/demon/statblock/violent.md`.

- § **Transforming Strike** — Excluded adjacent splash membership plus recorded hidden-from relationship; disguise removal and extra damage are deterministic after recipients/state.
- § **Mimicry** — Excluded start-turn free Hide/disguise instruction.
- § **Soulsight** — Excluded membership-shaped adjacency perception rule; no independent path/count predicate. Twisted Bengrul prints “ensnarer” in this section; do not silently repair self-reference.

#### Brisk Gale

Source: `monster/minion/summoner/elemental/statblock/brisk-gale.md`.

- § **Cutting the Air** — Excluded unconditional movement permission.
- § **Whirlwind** — Excluded death-space area membership, enter/start trigger and vertical shift permission.

#### Crux of Ash

Source: `monster/minion/summoner/elemental/statblock/crux-of-ash.md`.

- § **Soot Strike** — Excluded potency-gated hidden state with damage/maneuver/clock endings.
- § **Ashen Cloud (1 Essence)** — Membership-only concealment; outside-cloud line-of-effect boundary and wind dispersal are secondary geometry/environment, not additional numeric trigger. No new core deferral.

#### Dancing Silk

Source: `monster/minion/summoner/elemental/statblock/dancing-silk.md`.

- § **Entangling Strike** — Excluded initial target plus adjacent secondary members, fixed potency conditions.
- § **Web (1 Essence)** — Excluded placed-area membership, terrain and turn-end slow; placement is secondary.

#### Desolation of Sand

Source: `monster/minion/summoner/elemental/statblock/desolation-of-sand.md`.

- § **Burying Strike** — Excluded existing-slowed condition changes potency; recorded state.
- § **Sand Through Your Fingers** — Excluded unconditional opportunity-attack movement permission.
- § **Shifting Sand Pit (1 Essence)** — Excluded death-area membership and enter shift instruction.

#### Elemental Mote

Source: `monster/minion/summoner/elemental/statblock/elemental-mote.md`.

- § **Dweomer Burst** — Excluded death splash members and next-strike bane.
- § **Catalyst** — Excluded ordinary selection of adjacent allied template / paid alternate template; squad/name/Stamina state is not spatial.

#### Fire Plume

Source: `monster/minion/summoner/elemental/statblock/fire-plume.md`.

- § **Spitfire Strike** — Excluded fixed range.
- § **Pyre** — Excluded single-space flame enter/start membership rider.

#### Flow of Magma

Source: `monster/minion/summoner/elemental/statblock/flow-of-magma.md`.

- § **Molten Strike 2d10 + R (Signature Ability)** — Core above; only the stated predicate.
- § **Eruption (1 Essence)** — Excluded area placement/membership and fixed potency damage; no per-square traversal clause.

#### Principle of the Swamp

Source: `monster/minion/summoner/elemental/statblock/principle-of-the-swamp.md`.

- § **Encroaching Strike** — Core above; only the stated predicate.
- § **Sludgefoot (1 Essence)** — Excluded area members pulled toward center; reaching center has no extra printed numerical consequence.

#### Quiet of Snow

Source: `monster/minion/summoner/elemental/statblock/quiet-of-snow.md`.

- § **Freezing Howl 2d10 + R (Signature Ability)** — Excluded attack tiers and chosen adjacent ally shift/hide/defend; ordinary recipient selection.
- § **Cold Surge** — Excluded selected area members gain surge.

#### Walking Boulder

Source: `monster/minion/summoner/elemental/statblock/walking-boulder.md`.

- § **Obstruct** — Secondary line-of-effect geometry only.
- § **Pile Up (1 Essence)** — Secondary wall placement only.

#### Nixie Hemloche

Source: `monster/minion/summoner/fey/statblock/nixie-hemloche.md`.

- § **Water Weird** — Secondary chosen water destination and own-water exclusion; pure movement eligibility, not core under narrowed scope.
- § **Whirling Waves** — Core above; only the stated predicate.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Nixie Soakreed

Source: `monster/minion/summoner/fey/statblock/nixie-soakreed.md`.

- § **Water Weird** — Secondary chosen water destination and own-water exclusion; pure movement eligibility, not core under narrowed scope.
- § **Soaking Bog** — Core above; only the stated predicate.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Pixie Bellringer

Source: `monster/minion/summoner/fey/statblock/pixie-bellringer.md`.

- § **Ringing Strike** — Excluded same-target attacking participant count, not nearby-creature count.
- § **Fairy Chime** — Excluded radius-member saving-throw modifier; no per-bellringer count/stacking specified here.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Pixie Hydrain

Source: `monster/minion/summoner/fey/statblock/pixie-hydrain.md`.

- § **Burning/Healing Rain 2d10 + R (Signature Ability)** — Excluded attack tiers and ordinary chosen ally recovery/condition removal.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Pixie Loftlilly

Source: `monster/minion/summoner/fey/statblock/pixie-loftlilly.md`.

- § **Floating Toxins** — Excluded area membership plus recorded size/Reason/flight capability; no-shift, forced-distance bonus and bane follow membership. The printed hover height is deterministic, not a fresh altitude question.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Pixie Rosenthall

Source: `monster/minion/summoner/fey/statblock/pixie-rosenthall.md`.

- § **Stickerbush Symphony 2d10 + R (Signature Ability)** — Excluded damage/pull tiers; cannot-shift keyed to recorded bleeding, not fresh adjacency.
- § **Swarm** — Boundary/excluded: selected overlapping occupants suffice for turn-start 2 damage, consistent with earlier Swarm treatment.

#### Sprite Dandeknight

Source: `monster/minion/summoner/fey/statblock/sprite-dandeknight.md`.

- § **Magic Strike** — Excluded damage-type choice.
- § **Staccato Swings** — Excluded declared same-target strike grouping.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Sprite Foxglow

Source: `monster/minion/summoner/fey/statblock/sprite-foxglow.md`.

- § **Flash Strike** — Excluded recorded hidden-at-strike predicate.
- § **Quiet Flight** — Excluded silence-area membership and search bane; no independent numeric spatial predicate.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Sprite Orchiguard

Source: `monster/minion/summoner/fey/statblock/sprite-orchiguard.md`.

- § **Fairy Guard** — Excluded simple member protection plus deterministic self-damage/free-strike increment; amount not based on a new proximity count.
- § **Minuscule** — Boundary: cover while sharing a larger creature’s space. Selected overlapping occupant plus recorded size is sufficient, like Swarm occupancy; exclude from strict core unless parent finds that existing occupant selection cannot supply this relation.

#### Accursed Mummy

Source: `monster/minion/summoner/undead/statblock/accursed-mummy.md`.

- § **Fetid Bindings 2d10 + R (Signature Ability)** — Core above; only the stated predicate.
- § **Mummy Dust** — Excluded damage-triggered adjacent splash membership.

#### Ceaseless Mournling

Source: `monster/minion/summoner/undead/statblock/ceaseless-mournling.md`.

- § **Always Crying** — Excluded end-turn radius members get damage/no-shift; simple membership carries trigger.
- § **Immutable Form** — Excluded unconditional shape restriction.
- § **Rupture** — Core above; only the stated predicate.

#### Grave Knight

Source: `monster/minion/summoner/undead/statblock/grave-knight.md`.

- § **Knight Strike 2d10 + R (Signature Ability)** — Excluded ordinary targets and damage/bleeding tiers.
- § **To the Grave** — Excluded zero-Stamina trigger with ordinary melee free-strike target choice.

#### Husk

Source: `monster/minion/summoner/undead/statblock/husk.md`.

- § **Rotting Strike** — Core above; only the stated predicate.

#### Phase Ghoul

Source: `monster/minion/summoner/undead/statblock/phase-ghoul.md`.

- § **Leaping Strike** — Core above; only the stated predicate.
- § **Nerveless** — Excluded unconditional falling immunity/landing permission.

#### Shrieker

Source: `monster/minion/summoner/undead/statblock/shrieker.md`.

- § **Howling Strike** — Excluded fixed range.
- § **Shrill Alarm** — Excluded radius-member hiding restriction.

#### Skeleton

Source: `monster/minion/summoner/undead/statblock/skeleton.md`.

- § **Bonetrops** — Excluded one-space membership entry, damage and effect removal.

#### Stalker Shade

Source: `monster/minion/summoner/undead/statblock/stalker-shade.md`.

- § **Shadow Strike** — Excluded invisibility/shift/strike sequence; no extra spatial predicate.
- § **Shadow Phasing** — Core above; only the stated predicate.

#### Zombie Lumberer

Source: `monster/minion/summoner/undead/statblock/zombie-lumberer.md`.

- § **Zombie Clutch** — Excluded recorded source grab at turn start; R damage does not need new adjacency.
- § **Death Grasp** — Excluded death-triggered chosen adjacent target; ordinary range plus potency restraint.

**Extension completeness:** 37/37 source records read; all named sections accounted for. The existing 501-parent findings were not redone. No repository/vendor edits or tests.
