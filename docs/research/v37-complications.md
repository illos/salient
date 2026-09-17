# V37 complication inventory and rules comparison

Research date: 2026-09-17. Research is complete; implementation and independent rules review are not
claimed. No servers, dependencies, builds or browser tests were run for this document.

The current snapshot contains **100 core complications**, and pinned Forge Steel contains **100
matching entries**. All are matched one to one by rules content, including seven display aliases.
There are no excluded supplemental complication records in this snapshot. **A matching name or
matching source paragraph does not establish that Forge models the required choices.**

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Comparison reference: Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.
Source inventory: [current complication snapshot](../../shared/content/compendium/complication.json).
The [machine-readable ledger](v37-complications.json) retains all 100 canonical identities, source
paths, complete source bodies, exact Forge blocks with original line numbers, source-bound decisions,
permanent contributions, event/state analysis and individual comparison findings.

## Scope and completion

The [Complications chapter](../../vendor/steel-compendium/en/unified/md/chapter/complications.md)
makes complications optional, with Director agreement and both benefit and drawback. Preserve an
explicit None choice. Director control of story does not authorize substituting the Director's
choices for owner build choices, nor owner selection for an explicitly Director-selected effect.

The [V1 contracts](../v1-character-wizard-contracts.md#8-perks-and-complications-are-real-build-content)
require permanent effects and creation selections even when gameplay remains manual. The full source
body belongs in the wizard, including embedded abilities, Study Lore project, Special eligibility
rules and drawbacks. Sourced ability grants must appear on the character; executing them remains
engine work. A pending mechanical parameter or Director setup is explicit incomplete/unsupported
state, not an unqualified complete option with a Manual label.

Narrative character/creature names are ordinary backstory context. Do not create arbitrary completion
barriers for those names. Source-required mechanical references such as Rival skill, Lost in Time
damage type and Shared Spirit skill sets are required decisions. A form or monster-type choice may
need source-constrained narrative data where the book supplies examples rather than an exhaustive
list; that is not permission to fabricate a list of mechanically interchangeable choices.

Initial Wealth, Renown, items and counters are initialization intents, not changes to replay on each
save, edit or restoration. Baseline maxima remain separate from current resources. Immunity and
weakness contributions need normal source stacking rules; the ledger's `set` describes each sourced
value, not overwriting all other origins.

## Important discrepancies and dependencies

- **Dragon Dreams:** Forge has only text for the two-point purchased Dragon Knight tree. Six traits
  are available; the two-point budget is not a two-trait count. Prismatic Scales refers to Wyrmplate,
  which this complication does not grant. Q-CHAR-15 now accepts the corpus-based Wyrmplate prerequisite;
  only Scales is unavailable without it, not Dragon Dreams. Forge ancestry always grants Wyrmplate
  before its six flattened Scales variants; the complication has no borrowed-trait implementation. Benefits activate at five Victories but choices
  must exist before then. Wings' low-level flying weakness and nested ability text must survive.
- **Following in the Footsteps:** two independent class ability references, one future higher-level
  cost reduction and one currently known cost increase; neither grants an ability. Forge has no
  selectors. Above-current-level catalog eligibility and level-10 creation need explicit handling.
- **Ivory Tower:** three new skills, a Director-selected removal of exactly one of those three,
  permanent prohibition against relearning, and an explicit dead language. Forge cancellation can
  select any known skill. Its `options: [Dead]` is passed as names rather than types; actual config ignores it and permits all four default language categories.
- **Exile:** the same factory misuse with `options: [Common]`; source permits an extant language,
  including eligible cultural/regional entries. `allowedTypes` is the actual Forge category field. The config filters that field and ignores `options`, so both incorrect records offer all four noncustom categories.
- **Promising Apprentice:** the owned crafting skill receiving edge is a separate selection from the
  new crafting skill. Forge narrows its modifier text to the skill newly chosen for this complication.
- **Raised by Beasts:** remove culture and all culture-derived skills/language/edges while retaining
  Caelian and unrelated grants. Handle Animals and chosen related animal type still apply.
- **Shared Spirit:** record three owned skills and three new skills as conditional sets, leaving other
  skills available to either controller. Forge is text only. **Rival**, **Sewer Folk**, **Lost in Time**,
  **Shipwrecked** and **Lifebonded** also lack required selection data in Forge.
- **Shattered Legacy:** Forge nests the item choice in a toggle whose omitted `checked` defaults to
  true, activating the broken treasure. The source requires an already chosen but inoperative item.
  Artifact Bonded similarly needs a selected identity while its manifestation toggle is false.
- **Strange Inheritance:** Director chooses a secret second-echelon trinket; owner must not select or
  preview it. Activation at level plus Victories five and first revelation are separate state facts.
- **Permanent values:** Betrothed caps Renown at level minus one; Indebted sets starting Wealth to −5;
  Wodewalker adds highest characteristic after recovery-value baseline; Elemental Inside adds three
  Stamina per echelon. Do not miss these just because some are only text in Forge.
- **Source discrepancies:** Animal Form says start of **any** turn, Forge says your turn. Shadow Born
  says each turn start, Forge says once per round. Chaos Touched and Mundane penalties apply to power
  rolls including tests; Forge marks ability rolls only. Preserve source wording for broader
  conditional tests rather than limiting them to Forge skill filters.
- **Identity discrepancies:** Vampire Scion is Forge Vampire Sire; Corrupt Spirit is named Corrupted
  Spirit by Forge. Five capitalization/hyphen/ellipsis aliases plus Voice in Your Head are recorded
  explicitly in JSON. No complication is missing.

## Pools and source contracts

All skill pools are expanded to canonical IDs in JSON: five core groups, all skills, the four-group
Wrongly Imprisoned union, the interpersonal/intrigue Disgraced union and Hunter's eight explicit skills.
Apply Q-CHAR-11 fixed-grant replacement rules; intentional duplicate choices cannot widen a restricted
pool. Modifier targets confer no new skill. Removing a skill as a drawback grants no replacement.

Ivory Tower's nine printed dead languages are Ananjali, High Rhyvian, Khamish, Kheltivari, Low Rhyvian,
Old Variac, Phorialtic, Rallarian and Ullorvic. See the pinned Heroes clean **Dead Languages Table**.
Q-R-102's spoken-only choice was explicitly v0.01 generic creation; do not silently erase Ivory Tower's
explicit V1 exception. Q-CHAR-6 still excludes custom languages. Deferred language entitlements retain
source restrictions and grant nothing until selected. Shipwrecked must remove a known language, not
an unfilled slot; its source does not exempt Caelian. If automatic-Caelian product policy is treated
as unremovable, raise that precise collision rather than losing the drawback.

The item pools from Heroes clean **Rewards** are expanded below and in JSON. Their names are not
sufficient build implementation: every selected treasure needs its own full text, prerequisite and
build-effect resolution. Such integration is under the existing inventory contract. A broken or
absent treasure must retain its selection without applying its active benefits.

### First-echelon trinkets (12)

Color Cloak (Blue), Color Cloak (Red), Color Cloak (Yellow), Deadweight, Displacing Replacement Bracer, Divine Vine, Flameshade Gloves, Gecko Gloves, Hellcharger Helm, Mask of the Many, Quantum Satchel, Unbinder Boots.

### Second-echelon trinkets (8)

Bastion Belt, Evilest Eye, Insightful Crown, Key of Inquiry, Mediator's Charm, Necklace of the Bayou, Scannerstone, Stop-'n-Go Coin.

### Leveled weapons (14)

Authority's End, Blade of Quintessence, Blade of the Luxurious Fop, Displacer, Executioner's Blade, Icemaker Maul, Knife of Nine, Lance of the Sundered Star, Molten Constrictor, Onerous Bow, Steeltongue, Third Eye Seeker, Thunderhead Bident, Wetwork.

### All leveled treasures (35)

Adaptive Second Skin of Toxins, Chain of the Sea and Sky, Grand Scarab, King's Roar, Kuran'zoi Prismscale, Paper Trappings, Shrouded Memory, Spiny Turtle, Star-Hunter, Telekinetic Bulwark, Abjurer's Bastion, Brittlebreaker, Chaldorb, Ether-Fueled Vessel, Foesense Lenses, Words Become Wonders at Next Breath, Authority's End, Blade of Quintessence, Blade of the Luxurious Fop, Displacer, Executioner's Blade, Icemaker Maul, Knife of Nine, Lance of the Sundered Star, Molten Constrictor, Onerous Bow, Steeltongue, Third Eye Seeker, Thunderhead Bident, Wetwork, Bloodbound Band, Bloody Hand Wraps, Lightning Treads, Revenger's Wrap, Thief of Joy.

### Artifacts (3)

Blade of a Thousand Years, Encepter, Mortal Coil.

### Purchased Dragon Knight traits

| Trait | Cost | Nested rule |
| --- | ---: | --- |
| Draconian Guard | 1 | Triggered strike damage reduction equal to level. |
| Prismatic Scales | 1 | Select Wyrmplate immunity; requires Wyrmplate under Q-CHAR-15. |
| Remember Your Oath | 1 | Maneuver, saves succeed on 4+ until next turn start. |
| Draconian Pride | 2 | Signature Area/Magic main, 1 burst enemies; Might/Presence; 2/5/7 damage, push 0/1/2. |
| Dragon Breath | 2 | Signature Area/Magic main, 3 cube within 1, enemies; Might/Presence 2/4/6 damage. Choose acid/cold/corruption/fire/lightning/poison on use. |
| Wings | 2 | Fly Might rounds (minimum 1), then fall; at levels 1–3 damage weakness 5 while flying. |

## Per-record inventory

Each entry below gives the canonical source link, exact Forge identity, the creation decisions,
permanent contributions, and the comparison. The JSON additionally embeds every source body and
Forge block, plus the complete linked Dragon Knight traits/abilities, Motivate Earth and giant hawk; the effect analysis includes timing, conditional effects and both benefit and drawback.

### Advanced Studies

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/advanced-studies.md) — `mcdm.heroes.v1/complication/advanced-studies`.

Forge: `comp-advanced-studies`, member `advancedStudies`, line 17.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Respite activity: highest-characteristic test; <=11 summons hostile demon of level <= hero acting first; 12–16 nothing; 17+ chooses one qualifying class heroic ability until next respite. No permanent or creation ability grant.

Forge comparison: Three test tiers agree. Forge encodes this respite test as an ability with all characteristics in its roll list; source timing and highest-characteristic selection still govern. Not a permanent heroic-ability grant.

### Amnesia

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/amnesia.md) — `mcdm.heroes.v1/complication/amnesia`.

Forge: `comp-amnesia`, member `amnesia`, line 42.

Required source data:

- **trinket**: 1; firstEchelonTrinkets; actor owner; build.

Rules and timing: Bane on every lore-recall test. Chosen trinket is an actual initial possession with its own rules and possible dependencies.

Forge comparison: First-echelon item choice count defaults one; lore bane agrees. Item selection alone is not full handling of the selected treasure.

### Animal Form

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/animal-form.md) — `mcdm.heroes.v1/complication/animal-form`.

Forge: `comp-animal-form`, member `animalForm`, line 62.

Required source data:

- **animalForm**: 1; Specific harmless size-1T animal; book supplies no exhaustive species list; actor owner; build. Record animal and supported movement qualification; movement choice cannot be invented from a generic unrestricted trait selector.

Rules and timing: Maneuver transforms into the recorded specific size-1T animal until next turn start unless repeated; cannot talk/actions; only Escape Grab, Hide, Stand Up maneuvers. Animal movement applies only in form; +2 speed only if no additional movement. Director 1 Malice at start of ANY turn while winded forces transformation, once per respite.

Forge comparison: Forge stores transformation only as text with no form/movement control. Its drawback says start of YOUR turn; pinned Compendium says start of ANY turn. Preserve source wording.

### Antihero

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/antihero.md) — `mcdm.heroes.v1/complication/antihero`.

Forge: `comp-antihero`, member `antihero`, line 80.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Initial three antihero tokens; one replaces one Heroic Resource for an ability/effect. Regain one instead of party deed hero token when below three. While below three, hero AND each ally within 5 take interaction-test bane. Never a permanent Heroic Resource or Renown adjustment.

Forge comparison: Token substitution/recharge agree; Forge splits hero bane into roll modifier and adjacent allies into prose. Both recipients must survive display.

### Artifact Bonded

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/artifact-bonded.md) — `mcdm.heroes.v1/complication/artifact-bonded`.

Forge: `comp-artifactBonded`, member `artifactBonded`, line 104.

Required source data:

- **artifact**: 1; artifacts; actor owner; build. Selection persists while manifestation is inactive.

Rules and timing: Chosen artifact manifests first involuntary reduction to 0 Stamina each encounter; ends at earliest next-turn end/property benefit/Stamina >0. Each appearance costs current Recovery, else 1d10 irreducible damage. Artifact is selected at build even while absent; no always-active item effects.

Forge comparison: Forge nests one artifact choice beneath a checked:false toggle. Source requires choosing artifact regardless of current manifestation; inactive toggle must not erase or postpone the build choice.

### Bereaved

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/bereaved.md) — `mcdm.heroes.v1/complication/bereaved`.

Forge: `comp-bereaved`, member `bereaved`, line 128.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: weakness.corruption set 5.

Rules and timing: Spend hero token for Director best next course of action (even privileged information); no token spent if no good course. Corruption weakness is permanent.

Forge comparison: Director advice/hero-token spend and fixed corruption weakness5 agree.

### Betrothed

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/betrothed.md) — `mcdm.heroes.v1/complication/betrothed`.

Forge: `comp-betrothed`, member `betrothed`, line 147.

Required source data:

- **trinket**: 1; firstEchelonTrinkets; actor owner; build.

Permanent/initial contributions: renownMaximum cap level - 1.

Rules and timing: Initial first-echelon trinket. Renown maximum is level−1, not a subtract-one grant; apply cap after other starting grants and retain cap for later gains.

Forge comparison: Trinket pool agrees. Forge Renown cap is text only; cap must be represented in build rules, not omitted because no bonus factory exists.

### Chaos Touched

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/chaos-touched.md) — `mcdm.heroes.v1/complication/chaos-touched`.

Forge: `comp-chaosTouched`, member `chaosTouched`, line 166.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: additionalHeldItems add 1.

Rules and timing: Edge on Escape Grab, Grab and Knockback, plus can hold one additional item while hands full. While dying, bane on ALL power rolls, including tests; not just ability rolls.

Forge comparison: Maneuver edges and extra held item agree. Forge dying bane uses RollType.Ability; source says power rolls, including tests. RollType.Test is separate in Forge, so this encoding is narrower.

### Chosen One

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/chosen-one.md) — `mcdm.heroes.v1/complication/chosen-one`.

Forge: `comp-chosenOne`, member `chosenOne`, line 204.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Initial three destiny points; replace one or more class Heroic Resource; regain one per Victory. Each spend event, regardless of points spent, causes 1d10 irreducible psychic damage and reveals location to cult.

Forge comparison: Initial3, substitution, regain1 per Victory and irreducible1d10/location drawback agree. No factory counter; text still must be preserved.

### Consuming Interest

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/consuming-interest.md) — `mcdm.heroes.v1/complication/consuming-interest`.

Forge: `comp-consumingInterest`, member `consumingInterest`, line 222.

Required source data:

- **obsessionSkill**: 1; loreSkills; actor owner; build.

Rules and timing: Own chosen lore skill. Study Lore is a future project, maximum three completions, distinct project sources, goals 120/150/180; each completion adds one to that skill bonus. Director rolls chosen-skill lore recall in secret, gives correct or false information. Do not grant completed project bonuses at creation.

Forge comparison: One lore skill, three distinct-source Study Lore projects/goals120/150/180 and secret-roll drawback agree. Future project bonuses are not starting bonuses.

### Corrupted Mentor

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/corrupted-mentor.md) — `mcdm.heroes.v1/complication/corrupted-mentor`.

Forge: `comp-corruptedMentor`, member `corruptedMentor`, line 253.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: weakness.holy initialBaseline 1.

Granted ability: Corrupt Spirit. Full source block must be displayed.

Rules and timing: Corrupt Spirit is a granted Magic self maneuver. Until turn end, single-target damage-dealing heroic abilities gain corruption damage = highest characteristic. Base holy weakness 1 rises one per use to recovery-value cap, resets to 1 on holy damage; rising value is gameplay state.

Forge comparison: Forge ability named Corrupted Spirit; source Corrupt Spirit. Effect agrees; holy baseline weakness1 and escalation remain text rather than structured damage modifier.

### Coward

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/coward.md) — `mcdm.heroes.v1/complication/coward`.

Forge: `comp-coward`, member `coward`, line 285.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Frightened hero may move toward fear source. Saves ending frightened roll a d10 twice, use lower; no creation target.

Forge comparison: Moving toward fear and lower of two d10 save rolls agree; Forge 2d10 wording means keep lower, not sum.

### Crash Landed

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/crash-landed.md) — `mcdm.heroes.v1/complication/crash-landed`.

Forge: `comp-crashLanded`, member `crashLanded`, line 303.

No mandatory mechanical creation selection beyond the complication.

Fixed skills: Timescape.

Rules and timing: Timescape fixed skill; power pack activation/deactivation is a maneuver. Choose cold/fire/lightning/sonic ON ACTIVATION, converting damage-dealing abilities until deactivated. Bane recalling information about crash-landed world.

Forge comparison: Timescape selected in skill factory represents fixed grant; elemental pack choices and world-lore bane agree. Four damage types are chosen in play.

### Cult Victim

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/cult-victim.md) — `mcdm.heroes.v1/complication/cult-victim`.

Forge: `comp-cult-victim`, member `cultVictim`, line 326.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: weakness.corruption set 5.

Rules and timing: Once/turn pass through <=1 square solid matter; ending turn inside ejects to entry space and deals 5 irreducible damage. Corruption weakness 5 permanent.

Forge comparison: Passage1 square/once turn and5 damage eject plus corruption weakness5 agree.

### Curse of Caution

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/curse-of-caution.md) — `mcdm.heroes.v1/complication/curse-of-caution`.

Forge: `comp-carefulCurse`, member `curseOfCaution`, line 345.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: speed add -1.

Rules and timing: Until own turn taken in a round, incoming strikes take bane. Speed penalty −1 is unconditional baseline.

Forge comparison: Incoming-strike timing and speed−1 agree; Forge legacy IDs/names use carefulCurse/Careful Curse, not canonical display identity.

### Curse of Immortality

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/curse-of-immortality.md) — `mcdm.heroes.v1/complication/curse-of-immortality`.

Forge: `comp-curseOfImmortality`, member `curseOfImmortality`, line 363.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Does not age; death replaced with suspended animation; if body survives, return after 12 hours with recovery-value Stamina. Lore-recall tests take bane.

Forge comparison: No aging, conditional12h revival/recovery-value Stamina and lore bane agree.

### Curse of Misfortune

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/curse-of-misfortune.md) — `mcdm.heroes.v1/complication/curse-of-misfortune`.

Forge: `comp-curseOfMisfortune`, member `curseOfMisfortune`, line 382.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Combat test consequence replaced by hero and adjacent allies falling prone. No permanent stats/creation choices.

Forge comparison: Combat consequence replacement and adjacent prone agree.

### Curse of Poverty

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/curse-of-poverty.md) — `mcdm.heroes.v1/complication/curse-of-poverty`.

Forge: `comp-curseOfPoverty`, member `curseOfPoverty`, line 395.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: On respite with Wealth >1 set Wealth to 1, +1 Recovery per Wealth lost; boosted Recoveries reset first respite with current Recoveries below maximum. This is an event-driven conversion, not a starting Wealth cap or permanent maximum increase.

Forge comparison: Wealth-to-Recoveries respite conversion and reset condition agree; no baseline Wealth cap should be inferred.

### Curse of Punishment

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/curse-of-punishment.md) — `mcdm.heroes.v1/complication/curse-of-punishment`.

Forge: `comp-punishment-curse`, member `curseOfPunishment`, line 408.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: recoveriesMaximum add 1.

Rules and timing: One additional maximum Recovery; while current Recoveries exhausted, dying regardless of Stamina. Do not initialize dying or current Recovery loss from the feature.

Forge comparison: Recovery+1 and exhausted-Recoveries dying agree; Forge legacy punishment-curse name differs.

### Curse of Stone

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/curse-of-stone.md) — `mcdm.heroes.v1/complication/curse-of-stone`.

Forge: `comp-stoneCursed`, member `curseOfStone`, line 427.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: stability add 1; weakness.sonic set 5.

Rules and timing: Stability +1; free maneuver stone statue disguise while motionless. Sonic weakness 5; winded causes dazed. No baseline dazed condition.

Forge comparison: Stability+1, statue effect, sonic weakness5 and winded dazed agree; legacy stoneCursed names differ.

### Cursed Weapon

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/cursed-weapon.md) — `mcdm.heroes.v1/complication/cursed-weapon`.

Forge: `comp-cursedWeapon`, member `cursedWeapon`, line 456.

Required source data:

- **weapon**: 1; leveledWeapons; actor owner; build.

Permanent/initial contributions: weakness.allDamage set 2.

Rules and timing: Choose one leveled weapon initial possession; all-damage weakness 2 is unconditional. Include selected weapon build effects and choices through item contract; no free arbitrary treasure.

Forge comparison: LeveledWeapon item pool/count1 and all-damage weakness2 agree.

### Disgraced

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/disgraced.md) — `mcdm.heroes.v1/complication/disgraced`.

Forge: `comp-disgraced`, member `disgraced`, line 474.

Required source data:

- **skill**: 1; interpersonalOrIntrigueSkills; actor owner; build.

Permanent/initial contributions: initialRenown add 1.

Rules and timing: Gain 1 initial Renown and one skill from the UNION of interpersonal/intrigue. Infamous reputation; participating negotiation with NPC interest <=2 causes later hostile plan.

Forge comparison: Renown1 and UNION skill choice count1 plus low-interest NPC hostility agree.

### Dragon Dreams

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/dragon-dreams.md) — `mcdm.heroes.v1/complication/dragon-dreams`.

Forge: `comp-dragonDreams`, member `dragonDreams`, line 496.

Required source data:

- **traits**: 2; purchasedDragonKnightTraits; actor owner; build. Count is point budget, not number of traits. Never grant Wyrmplate or full ancestry. Resolve nested prerequisites and choices. No source permission to repeat traits.

Rules and timing: Preselect purchased Dragon Knight traits costing two points; benefits active only at >=5 Victories. Reaching 0 Stamina causes self and each creature within 5 to take fire damage 2×level; self damage irreducible. Conditional traits do not become baseline benefits before threshold.

Forge comparison: Forge text includes two-point choice but creates no trait selector. Compendium has six purchased choices and nested prerequisites; Prismatic Scales needs Wyrmplate not granted by complication.

### Elemental Inside

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/elemental-inside.md) — `mcdm.heroes.v1/complication/elemental-inside`.

Forge: `comp-elemental-inside`, member `elementalInside`, line 514.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: staminaMaximum add 3 * echelon.

Rules and timing: Maximum Stamina +3 at levels 1,4,7,10, cumulative. While dying elemental takes control, attacks nearest noticed creature and Director may control if rage not fulfilled. No change to normal character ownership.

Forge comparison: Forge valuePerEchelon3 agrees with source levels1/4/7/10 (not3 each level). Dying possession prose agrees.

### Evanesceria

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/evanesceria.md) — `mcdm.heroes.v1/complication/evanesceria`.

Forge: `comp-evanesceria`, member `evanesceria`, line 533.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Round-start optional d10 >=6 disappearance until own turn, returning chosen nearest free space if needed; recharge after >=1 Victory. Respite-activity 2d10 with either 1 means absent and no activity, though respite benefits retained.

Forge comparison: d10/2d10 thresholds, absent duration, recharge and lost activity agree.

### Exile

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/exile.md) — `mcdm.heroes.v1/complication/exile`.

Forge: `comp-exile`, member `exile`, line 551.

Required source data:

- **language**: 1; Printed extant spoken languages in Background; exclude dead/custom and already known Caelian; actor owner; build. Legal deferred entitlement follows I Speak Their Language; no language granted until chosen.

Rules and timing: One extant language entitlement. Recognizing homeland NPCs try to harm hero at Director discretion.

Forge comparison: Forge passes options:[LanguageType.Common] rather than allowedTypes. Factory treats options as LANGUAGE NAMES and defaults allowedTypes to Common/Regional/Cultural/Dead. ConfigLanguageChoice ignores options and allows all four types, including dead; use source extant pool.

### Fallen Immortal

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/fallen-immortal.md) — `mcdm.heroes.v1/complication/fallen-immortal`.

Forge: `comp-fallenImmortal`, member `fallenImmortal`, line 569.

No mandatory mechanical creation selection beyond the complication.

Fixed skills: Religion.

Rules and timing: Religion fixed skill. Any untyped-damage ability may deal holy instead (not restricted to strikes). Bane on tests to deceive.

Forge comparison: Fixed Religion, optional holy conversion of any untyped ability and deception bane agree.

### Famous Relative

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/famous-relative.md) — `mcdm.heroes.v1/complication/famous-relative`.

Forge: `comp-famousRelative`, member `famousRelative`, line 591.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Magic jewelry summons same-stat relative (Renown 10, power-roll edge, no hero treasure benefits) as maneuver, until peril resolved or one hour; one use per level. No Victories for challenges relative attends and next Renown award transferred each summon. Relative Renown is not hero Renown.

Forge comparison: Summoning, relative Renown10, edge/no treasures, duration/recharge, lost Victories/next Renown agree. Forge no creature/jewelry selection data; reference needed, not hero Renown grant.

### Feytouched

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/feytouched.md) — `mcdm.heroes.v1/complication/feytouched`.

Forge: `comp-feytouched`, member `feytouched`, line 610.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: At combat start optional +1 Heroic Resource paired with +3 Director Malice. No starting maximum resource modifier.

Forge comparison: Optional combat-start1 resource paired with3 Malice agrees.

### Fiery Ideal

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/fiery-ideal.md) — `mcdm.heroes.v1/complication/fiery-ideal`.

Forge: `comp-fieryIdeal`, member `fieryIdeal`, line 623.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Special purpose informs conditional tier-3 damage-dealing ability extra fire = highest characteristic. Director judges violations causing irreducible fire 5+level. Purpose is narrative context, not a prewritten selectable rules pool.

Forge comparison: Tier3 extra fire highest and violation fire5+level agree. Purpose is only prose in both.

### Fire and Chaos

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/fire-and-chaos.md) — `mcdm.heroes.v1/complication/fire-and-chaos`.

Forge: `comp-fire-and-chaos`, member `fireAndChaos`, line 641.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: immunity.fire set 5; weakness.cold set 5.

Rules and timing: Fire immunity 5 and cold weakness 5, both permanent.

Forge comparison: Capitalization differs (Fire And Chaos); fire immunity5/cold weakness5 agree.

### Following in the Footsteps

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/following-in-the-footsteps.md) — `mcdm.heroes.v1/complication/following-in-the-footsteps`.

Forge: `comp-followingInTheFootsteps`, member `followingInTheFootsteps`, line 656.

Required source data:

- **futureAbility**: 1; Heroic ability for chosen class whose source level exceeds level at selection; actor owner; build. Persist selection-level criterion and cost delta −2 floor1; grants no ability now.
- **costlierAbility**: 1; Currently known heroic abilities; actor owner; build. Cost +1; distinguish this from class ability selection.

Rules and timing: Select higher-level class heroic ability now; when later learned its cost is reduced 2, minimum 1. Independently select one currently known heroic ability whose cost permanently rises 1. Neither reference grants an ability; persist selections and original selection level.

Forge comparison: Both chosen ability references/cost changes are prose only in Forge. Need build controls, class/current-known validation, future source level and cost floor.

### Forbidden Romance

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/forbidden-romance.md) — `mcdm.heroes.v1/complication/forbidden-romance`.

Forge: `comp-forbiddenRomance`, member `forbiddenRomance`, line 674.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Lover grants secret constrained favors; reciprocal rescue obligations and discovery worsen separation. Narrative relationship only; no fabricated numeric bonus.

Forge comparison: Secret favors, reciprocal obligations and discovery consequences agree; no numeric data.

### Frostheart

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/frostheart.md) — `mcdm.heroes.v1/complication/frostheart`.

Forge: `comp-frostheart`, member `frostheart`, line 692.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: immunity.cold set 5; weakness.fire set 5.

Rules and timing: Cold immunity 5 and fire weakness 5. Untyped STRIKES may become cold; non-strike abilities are not covered.

Forge comparison: Cold immunity5/fire weakness5 and untyped STRIKE conversion agree; Forge Whwhenever typo is editorial.

### Getting Too Old for This

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/getting-too-old-for-this.md) — `mcdm.heroes.v1/complication/getting-too-old-for-this`.

Forge: `comp-gettingTooOldForThis`, member `gettingTooOldForThis`, line 712.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: On own turn choose a heroic ability learnable one level higher, all other prerequisites and cost apply; use once then recharge after >=2 Victories. While winded speed −2; no required creation ability selection.

Forge comparison: Capitalization differs. Next-level qualifying ability and winded speed−2 agree; Forge wording gained2 Victories corresponds to source earn2 or more. Selection is on turn, not build.

### Gnoll-Mauled

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/gnoll-mauled.md) — `mcdm.heroes.v1/complication/gnoll-mauled`.

Forge: `comp-gnollMauled`, member `gnollMauled`, line 730.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Ally within 5 reaches 0 Stamina: triggered action move speed then free strike. While dazed at turn start adjacent to creature, main action must make melee free strike against adjacent creature. Ineligible if hero cannot be made dazed.

Forge comparison: Source prerequisite is present only in Forge description, not machine eligibility; enforce no dazed immunity. Trigger, attack compulsion agree (Forge action versus main action shorthand).

### Greening

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/greening.md) — `mcdm.heroes.v1/complication/greening`.

Forge: `comp-greening`, member `greening`, line 751.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: immunity.corruption set 5; weakness.fire set 5.

Rules and timing: Corruption immunity 5 and fire weakness 5. Golden sapling is narrative possession, not an unlisted magical treasure.

Forge comparison: Corruption immunity5/fire weakness5 agree; no sapling statblock required.

### Grifter

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/grifter.md) — `mcdm.heroes.v1/complication/grifter`.

Forge: `comp-grifter`, member `grifter`, line 766.

Required source data:

- **skill**: 1; intrigueSkills; actor owner; build.

Rules and timing: One intrigue skill. Director may recognize first-met NPC as old con victim; party gains hero token when invoked.

Forge comparison: One intrigue skill and recognized-victim hero-token event agree.

### Grounded

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/grounded.md) — `mcdm.heroes.v1/complication/grounded`.

Forge: `comp-grounded`, member `grounded`, line 783.

No mandatory mechanical creation selection beyond the complication.

Granted ability: Motivate Earth. Full source block must be displayed.

Rules and timing: Grant Motivate Earth feature and complete linked ability; if already gained elsewhere change this ability to ranged 5. Nearby creature within 2 taking lightning causes hero 5 irreducible lightning. Do not mistake range enhancement for an extra identical ability.

Forge comparison: Forge stores grant/range upgrade as text only. Need linked complete Motivate Earth ability; source range upgrade at duplicate grant, not duplicate separate action.

### Guilty Conscience

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/guilty-conscience.md) — `mcdm.heroes.v1/complication/guilty-conscience`.

Forge: `comp-guiltyConscience`, member `guiltyConscience`, line 801.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: At negative winded Stamina, free triggered action spend Recovery. Interaction tests and strikes against people who know past wrongdoing take bane.

Forge comparison: Negative-winded free-trigger Recovery and both interaction/strike banes agree.

### Hawk Rider

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/hawk-rider.md) — `mcdm.heroes.v1/complication/hawk-rider`.

Forge: `comp-hawkRider`, member `hawkRider`, line 827.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Summon specified giant hawk outdoors with uninterrupted minute; mount only for hero, refuses structures; dismiss freely; restore full Stamina or revive as respite activity. Informed witnesses cause interaction bane and may report to Hawklords. Companion play is separate scope, not missing hero stat calculation.

Forge comparison: Specific giant hawk summon/mount/heal and witness drawback agree, but Forge does not embed statblock; source Monsters reference required for readable companion.

### Host Body

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/host-body.md) — `mcdm.heroes.v1/complication/host-body`.

Forge: `comp-hostBody`, member `hostBody`, line 851.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: weakness.fire set 5.

Rules and timing: Host considered alive; main action transfers to dead playable-ancestry humanoid within 10 while alive or <=24h after death; old body dies; replace ancestry-derived statistics with host ancestry, start 1 Stamina and may spend Recovery. Fire weakness 5 always. Bane reading humanoid emotions/body language, not only named Read Person skill.

Forge comparison: Transfer and fire weakness agree. Forge uses Read Person skill filter for drawback; source covers ANY test reading humanoid emotions/body language, not only use of that skill.

### Hunted

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/hunted.md) — `mcdm.heroes.v1/complication/hunted`.

Forge: `comp-hunted`, member `hunted`, line 877.

Required source data:

- **skill**: 1; intrigueSkills; actor owner; build.

Rules and timing: One intrigue skill. Lay low respite activity resets pursuers search. Renown gain reveals location; agents in 1d10 days unless move/lay low; lingering allows pursuer to find hero.

Forge comparison: One intrigue skill, lay-low activity and pursuer1d10 timetable agree.

### Hunter

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/hunter.md) — `mcdm.heroes.v1/complication/hunter`.

Forge: `comp-hunter`, member `hunter`, line 899.

Required source data:

- **skill**: 1; hunterSkills; actor owner; build.

Rules and timing: One of eight printed skills, plus quarry clue/search-test edge. Bane tracking other creatures; quarry must be identifiable to apply conditional effects.

Forge comparison: All eight skill names match. Forge encodes other-creature tracking bane as Track skill filter; preserve broader source test predicate if another skill could serve tracking.

### Indebted

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/indebted.md) — `mcdm.heroes.v1/complication/indebted`.

Forge: `comp-indebted`, member `indebted`, line 924.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: initialWealth set -5.

Rules and timing: Starting Wealth SET to −5 (not subtract five from other grants). While below 1, purchase as Wealth 1. Subsequent Wealth-earning events add one extra; creditors/closed shops narrative. Never reapply starting −5 on every revision.

Forge comparison: Starting Wealth−5 only text in Forge; must be initial SET in Salient. Additional Wealth income and spending-as1 agree.

### Infernal Contract... But, Like, Bad

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/infernal-contract-but-like-bad.md) — `mcdm.heroes.v1/complication/infernal-contract-but-like-bad`.

Forge: `comp-infernalContractButLikeBad`, member `infernalContractButLikeBad`, line 960.

Required source data:

- **benefit**: 1; renown+2, wealth+2, staminaMaximum+3; actor owner; build.

Rules and timing: Choose exactly one of +2 initial Renown, +2 initial Wealth, +3 maximum Stamina. Fiendish mark causes conditional interaction bane; death sends soul to Hell, prevents restoration.

Forge comparison: Punctuation alias. Forge generic choice defaults count1 and three value1 options correctly represent source choose1 of Renown2/Wealth2/Stamina3. Mark/disallowed revival agree.

### Infernal Contract

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/infernal-contract.md) — `mcdm.heroes.v1/complication/infernal-contract`.

Forge: `comp-infernalContract`, member `infernalContract`, line 942.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Initiative d10 threshold 4+ when both sides contain nonsurprised creatures. Patron service and pursuit narrative; no choice between initiative benefit and contract drawback.

Forge comparison: Initiative4+ and patron favor/threat agree.

### Ivory Tower

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/ivory-tower.md) — `mcdm.heroes.v1/complication/ivory-tower`.

Forge: `comp-ivoryTower`, member `ivoryTower`, line 1008.

Required source data:

- **skills**: 3; allSkills; actor owner; build.
- **lostSkill**: 1; Exactly the three skills selected at complication/skills; actor Director; build. Remove and permanently forbid. This is not owner selecting one of any known skills.
- **language**: 1; deadLanguages; actor owner; build. Explicit dead grant; v0.01 generic language ruling does not silently erase a V1 exception; custom remains excluded.

Rules and timing: Choose three distinct skills from any group, then DIRECTOR chooses one of those three to remove permanently and ban relearning; bane whenever that skill would apply. One explicit dead-language entitlement. Removed skill cannot become unrestricted replacement: drawback must remain.

Forge comparison: Forge grants three unrestricted skills and cancellation default1 knownSkillsOnly; control offers ANY known skill, broader than source exactly these three, and does not implement Director-only actor. Language options:[Dead] is passed as names, not allowedTypes:[Dead]; config ignores options and permits all four default categories.

### Lifebonded

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/lifebonded.md) — `mcdm.heroes.v1/complication/lifebonded`.

Forge: `comp-lifebonded`, member `lifebonded`, line 1032.

Required source data:

- **bondedCreature**: 1; Another creature without Lifebonded complication; actor owner; build. Named reference/attestation suffices for manual narrative creature; not forced playable companion creation.

Rules and timing: Identify a DIFFERENT creature without Lifebonded. Own death disappears body until linked creature respite or Victory, return adjacent fully healed. Linked creature death kills hero regardless of other protections.

Forge comparison: Linked creature non-Lifebonded predicate/death/reappearance agree as prose. Missing stored creature reference in Forge.

### Lightning Soul

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/lightning-soul.md) — `mcdm.heroes.v1/complication/lightning-soul`.

Forge: `comp-lightningSoul`, member `lightningSoul`, line 1050.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Regaining Stamina IN COMBAT gives one surge; surge extra damage may become lightning. When wet all-damage weakness 5; neither surge nor weakness is unconditional initial state.

Forge comparison: Regain-Stamina-in-combat surge AtWill and optional lightning agree; wet weakness is text-only conditional, not missing permanent immunity.

### Loner

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/loner.md) — `mcdm.heroes.v1/complication/loner`.

Forge: `comp-loner`, member `loner`, line 1082.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: At end of respite choose one not-owned skill until end of next respite. Keep as respite configuration, not permanent chosen skill. Ally reaching 0 causes taunt toward attacker until ally >0, new taunt, or encounter end.

Forge comparison: Forge skill choice defaults selectAt build and all five skill groups; source explicitly selects at respite end, expires next respite. Must preserve timing and not-known requirement.

### Lost in Time

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/lost-in-time.md) — `mcdm.heroes.v1/complication/lost-in-time`.

Forge: `comp-lostInTime`, member `lostInTime`, line 1100.

Required source data:

- **damageType**: 1; damageTypes; actor owner; build.

Rules and timing: One fixed damage-type parameter from nine printed types; each signature use may convert to that type. Automatically fail recall tests concerning suspended period. Store period as narrative context without inventing date precision.

Forge comparison: Nine damage types and recall failure agree in text, but Forge lacks stored type selector.

### Lost Your Head

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/lost-your-head.md) — `mcdm.heroes.v1/complication/lost-your-head`.

Forge: `comp-lostYourHead`, member `lostYourHead`, line 1118.

No mandatory mechanical creation selection beyond the complication.

Granted ability: Share Head. Full source block must be displayed.

Rules and timing: Grant Share Head: Psionic/Ranged maneuver, range 10 willing creature; senses and borrowed speech until different target/range/willingness ends. No own senses/speech except through ability; cannot wear head-required gear. Creature recipient is play-time target, not creation requirement.

Forge comparison: Share Head action/range/target/effects and gear/sense restrictions agree; no creation target needed.

### Lucky

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/lucky.md) — `mcdm.heroes.v1/complication/lucky`.

Forge: `comp-lucky`, member `lucky`, line 1145.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Spend hero token to save/reroll test, d10 >=6 retains token. Tier-1 test without token reroll gives next test bane.

Forge comparison: Hero token retain6+, tier1 next-test bane agree.

### Master Chef

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/master-chef.md) — `mcdm.heroes.v1/complication/master-chef`.

Forge: `comp-masterChef`, member `masterChef`, line 1164.

No mandatory mechanical creation selection beyond the complication.

Fixed skills: Cooking.

Rules and timing: Cooking fixed skill. After respite or sleep, uninterrupted hour with ingredients/tools feeds up to 10, each gets one free Recovery benefit within 24h. First daily meal not personally prepared loses two CURRENT Recoveries, not max.

Forge comparison: Fixed Cooking, meal timing/hour/ten/24h and first foreign meal current-Recoveries−2 agree.

### Meddling Butler

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/meddling-butler.md) — `mcdm.heroes.v1/complication/meddling-butler`.

Forge: `comp-meddlingButler`, member `meddlingButler`, line 1186.

Required source data:

- **retainer**: 1; Eligible retainer under Monsters Retainers and Rewards Renown; actor owner/Director setup; build. Source grants one but does not specify who picks species. Do not fabricate owner-exclusive selection authority or silently drop retainer. Only one retainer may serve at once.

Rules and timing: Gain one retainer, independent of Renown follower grants, but only one retainer may serve at once. Director controls retainer outside combat. Retainer identity/stat reference is setup dependency; playable companion subsystem remains deferred.

Forge comparison: Forge createRetainer models an entitlement; companion choice/one-retainer constraint and Director outside-combat control remain necessary. No additional ordinary Renown follower count.

### Medium

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/medium.md) — `mcdm.heroes.v1/complication/medium`.

Forge: `comp-medium`, member `medium`, line 1202.

No mandatory mechanical creation selection beyond the complication.

Granted ability: Contact Spirits. Full source block must be displayed.

Rules and timing: Telepathic communication from incorporeal undead within 10. Grant Contact Spirits Magic/self main action: Intuition or Presence; tier1 corruption 5+level, tier2 spirit and one question, tier3 three; recently nearby dead hostile/friendly grant double bane/edge; recharge after >=1 Victory.

Forge comparison: Ability stats/three tiers/hostile-friendly modifiers/recharge agree. Forge flavor says spirits others sense, omitting source do NOT sense; canonical flavor retained.

### Medusa Blood

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/medusa-blood.md) — `mcdm.heroes.v1/complication/medusa-blood`.

Forge: `comp-medusaBlood`, member `medusaBlood`, line 1236.

No mandatory mechanical creation selection beyond the complication.

Granted ability: Stone Eyes. Full source block must be displayed.

Rules and timing: Grant Stone Eyes Magic/Ranged/Strike main action range10 one creature; Might or Presence; damage 2/4/6, Might potency weak/average/strong slows save ends; no effect if cannot see eyes/avoids gaze, 0 Stamina petrifies. Out of combat involuntary gaze trigger, companions know to avoid.

Forge comparison: Stone Eyes keywords/range/characteristics/damage/potency/slow and gaze/petrification constraints agree.

### Misunderstood

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/misunderstood.md) — `mcdm.heroes.v1/complication/misunderstood`.

Forge: `comp-misunderstood`, member `misunderstood`, line 1271.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Revealed appearance to unfamiliar creatures gives edge where Brag/Intimidate COULD apply, bane where Flirt/Lead/Persuade COULD apply. Does not grant those skills or require actually using them.

Forge comparison: Forge uses named skill filters; source says skills COULD apply, including when not owned/chosen. Do not grant listed skills or require selecting them.

### Mundane

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/mundane.md) — `mcdm.heroes.v1/complication/mundane`.

Forge: `comp-mundane`, member `mundane`, line 1293.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: immunity.corruption set level; immunity.holy set level; immunity.psychic set level.

Rules and timing: Corruption/holy/psychic immunity equal level. Carrying >3 magic treasures gives bane on ALL power rolls, not only ability rolls. No prohibition on selecting magical classes.

Forge comparison: Three level-scaled immunities agree. Forge drawback RollType.Ability excludes tests, whereas source ALL power rolls includes tests.

### Outlaw

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/outlaw.md) — `mcdm.heroes.v1/complication/outlaw`.

Forge: `comp-outlaw`, member `outlaw`, line 1316.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: initialRenown add 1.

Rules and timing: One initial Renown. Recognizing law enforcers/bounty hunters attempt arrest.

Forge comparison: Renown1 and arrest drawback agree.

### Pirate

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/pirate.md) — `mcdm.heroes.v1/complication/pirate`.

Forge: `comp-pirate`, member `pirate`, line 1334.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Renown TREATED +2 with pirates/pirate hunters only; no global Renown grant. Holds one map piece, other holders threaten and treasure cursed/haunted.

Forge comparison: Situational Renown+2 and map/threats agree; Forge prose correctly does not add global Renown.

### Preacher

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/preacher.md) — `mcdm.heroes.v1/complication/preacher`.

Forge: `comp-preacher`, member `preacher`, line 1352.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Respite Presence conversion test at Director difficulty; success one Director-chosen follower, max one success per level. Failure loses Director-chosen existing follower else −1 Renown else if already zero no respite benefits. No starting follower or Renown change.

Forge comparison: Conversion test, one success/level and fallback failure chain agree.

### Primordial Sickness

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/primordial-sickness.md) — `mcdm.heroes.v1/complication/primordial-sickness`.

Forge: `comp-primordial-sickness`, member `primordialSickness`, line 1370.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: immunity.corruption set 5; immunity.poison set 5; recoveriesMaximum add -1.

Rules and timing: Corruption and poison immunity 5; maximum Recoveries −1. Permanent penalty must affect initial maximum and later derivation.

Forge comparison: Two immunity5 and Recoveries−1 agree.

### Prisoner of the Synlirii

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/prisoner-of-the-synlirii.md) — `mcdm.heroes.v1/complication/prisoner-of-the-synlirii`.

Forge: `comp-prisonerOfTheSynlirii`, member `prisonerOfTheSynlirii`, line 1391.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Telepathy within 10 with mutual awareness and shared language, target may respond. Voiceless talkers within one mile detect location and understand/overhear telepathy. No language grant.

Forge comparison: Range10/shared language/awareness/replies and1-mile listening agree; Forge TA creature typo editorial.

### Promising Apprentice

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/promising-apprentice.md) — `mcdm.heroes.v1/complication/promising-apprentice`.

Forge: `comp-promisingApprentice`, member `promisingApprentice`, line 1409.

Required source data:

- **skill**: 1; craftingSkills; actor owner; build.
- **edgeSkill**: 1; Owned crafting skills after all skill grants resolved; actor owner; build. Independent choice; need not equal newly granted skill. Does not grant target skill.

Rules and timing: Grant one new crafting skill, then independently target ANY owned crafting skill for edge. Bane on any test not using one of hero skills. Modifier target may equal newly granted skill but need not.

Forge comparison: Forge grants one crafting skill then describes edge on the skill CHOSEN FOR THIS complication. Source separately says choose one of YOUR crafting skills; missing independent owned-skill modifier selector materially narrows choice.

### Psychic Eruption

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/psychic-eruption.md) — `mcdm.heroes.v1/complication/psychic-eruption`.

Forge: `comp-psychicEruption`, member `psychicEruption`, line 1433.

No mandatory mechanical creation selection beyond the complication.

Granted ability: Psychic Blast. Full source block must be displayed.

Rules and timing: Grant Psychic Blast heroic ability with special ALL Heroic Resource cost; Area/Psionic/main/3 burst/all creatures; highest characteristic; psychic per resource capped at level / level+highest / uncapped. Becoming bleeding/frightened/weakened forces free triggered use. Do not copy Forge default zero cost.

Forge comparison: Ability tiers/trigger agree; Forge omits explicit cost field while prose says all resources. Preserve special heroic cost rather than default cost0. Source names it a heroic ability.

### Raised by Beasts

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/raised-by-beasts.md) — `mcdm.heroes.v1/complication/raised-by-beasts`.

Forge: `comp-raisedByBeasts`, member `raisedByBeasts`, line 1468.

Required source data:

- **animalType**: 1; Animal type related to animals that raised hero; no exhaustive source list; actor owner; build.

Fixed skills: Handle Animals.

Permanent/initial contributions: culture remove all culture aspects, their skills, language entitlement and culture-specific edges; retain Caelian.

Rules and timing: Grant Handle Animals; choose related animal type, edge on Handle Animals with type, communicate as shared language, normally not initially hostile. REMOVE culture including environment/organization/upbringing grants and culture language/edges; retain Caelian and unrelated career/class grants.

Forge comparison: Fixed Handle Animals and animal type edge/communication agree; type control absent. No-culture drawback prose needs actual culture/grant removal. Do not let normal wizard force three culture aspects afterward.

### Refugee

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/refugee.md) — `mcdm.heroes.v1/complication/refugee`.

Forge: `comp-refugee`, member `refugee`, line 1497.

Required source data:

- **lostAsset**: 1; Director-agreed family asset: trinket, leveled treasure, Wealth, project source, or like; actor owner+Director; build. Not current inventory; narrative specification can remain pending without synthesizing a reward.

Rules and timing: Director and owner define family asset (trinket/leveled treasure/Wealth/project source/etc.) held by invaders. It is a future recoverable asset, not initial usable inventory or Wealth. Hostile faction may harm recognized hero.

Forge comparison: Director-defined future asset and hostile faction agree; no asset actually granted to current inventory.

### Rival

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/rival.md) — `mcdm.heroes.v1/complication/rival`.

Forge: `comp-rival`, member `rival`, line 1515.

Required source data:

- **betterSkill**: 1; Owned skills; actor owner; build. Set ordinary skill contribution to3, do not add3.
- **rivalSkill**: 1; allSkills; actor Director; build. Does not need to be owned by hero; conditional bane applies when used.

Rules and timing: Select owned skill: its ordinary +2 skill contribution becomes +3. Director separately specifies rival best skill; bane using it, regardless of hero ownership. No new skill granted.

Forge comparison: Forge stores improved skill and rival skill only as prose; both target controls needed with separate decision actors. Source +3 INSTEAD OF +2 is not +3 additional.

### Rogue Talent

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/rogue-talent.md) — `mcdm.heroes.v1/complication/rogue-talent`.

Forge: `comp-rogueTalent`, member `rogueTalent`, line 1539.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: weakness.psychic set 5.

Granted ability: Telekinetic Grasp. Full source block must be displayed.

Rules and timing: Grant Telekinetic Grasp Psionic/Ranged/Strike maneuver usable as ranged free strike, range10 creature/object; Might/Intuition/Presence; push or pull 1/2/3, no damage. Psychic weakness 5.

Forge comparison: Telekinetic Grasp, usable ranged free strike, all keywords/range/roll/push-pull and psychic weakness5 agree.

### Runaway

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/runaway.md) — `mcdm.heroes.v1/complication/runaway`.

Forge: `comp-runaway`, member `runaway`, line 1574.

Required source data:

- **skill**: 1; craftingSkills; actor owner; build.

Rules and timing: One crafting skill. Extended family seeks return; narrative pressure only.

Forge comparison: One crafting skill/family threat agree; Forge grammatical typo editorial.

### Searching for a Cure

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/searching-for-a-cure.md) — `mcdm.heroes.v1/complication/searching-for-a-cure`.

Forge: `comp-searchingForACure`, member `searchingForACure`, line 1591.

Required source data:

- **monsterType**: 1; Type connected to homeland plight; e.g. vampire, ghost, medusa; actor owner; build.
- **transformationTimeline**: 1; Campaign-relevant timeline agreed with Director; actor owner+Director; build. Narrative context rather than automatic clock implementation.

Rules and timing: Choose monster type related to plight; saves against its abilities +1, characteristics TREATED +1 only to resist their potencies. Director and owner set campaign-relevant transformation timeline. Do not globally increase characteristics or saves.

Forge comparison: Monster-type-conditioned save/potency benefits and Director timeline agree, but Forge stores neither required monster type nor timeline.

### Secret Identity

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/secret-identity.md) — `mcdm.heroes.v1/complication/secret-identity`.

Forge: `comp-secretIdentity`, member `secretIdentity`, line 1609.

Required source data:

- **skill**: 1; intrigueSkills; actor owner; build.

Rules and timing: One intrigue skill. True identity temporarily treats Renown and Wealth +2, with optional Director benefits; daily 20% cumulative discovery risk resets after full day hidden. No baseline Renown/Wealth grant.

Forge comparison: One intrigue skill, situational+2 Renown/Wealth and20% cumulative risk agree.

### Secret Twin

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/secret-twin.md) — `mcdm.heroes.v1/complication/secret-twin`.

Forge: `comp-secretTwin`, member `secretTwin`, line 1631.

Required source data:

- **trinket**: 1; firstEchelonTrinkets; actor owner; build.

Rules and timing: One first-echelon trinket with twin marking. End-respite d10 1–2 allows Director past threat; no default assassin encounter at creation.

Forge comparison: First-echelon trinket count1/marking and respite1–2 threat agree.

### Self-Taught

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/self-taught.md) — `mcdm.heroes.v1/complication/self-taught`.

Forge: `comp-selfTaught`, member `selfTaught`, line 1650.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: At own combat turn start may forgo ALL Heroic Resource gain until next turn start, to gain strike damage bonus = highest characteristic for same duration. Optional play stance, no permanent strike modifier.

Forge comparison: Hyphen alias. Forego resource gain to next start/strike-highest bonus agree.

### Sewer Folk

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/sewer-folk.md) — `mcdm.heroes.v1/complication/sewer-folk`.

Forge: `comp-sewerFolk`, member `sewerFolk`, line 1663.

Required source data:

- **movement**: 1; climb, swim; actor owner; build.

Permanent/initial contributions: weakness.poison set 5; automaticFullSpeedMovement selected climb OR swim.

Rules and timing: Choose automatic full-speed climb OR swim, not both; never lost underground; city sewer undetected travel at Director determination. Poison weakness 5.

Forge comparison: Forge prints climb OR swim but provides no selector/movement mode; weakness5 agrees. Actual build must store one mode.

### Shadow Born

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/shadow-born.md) — `mcdm.heroes.v1/complication/shadow-born`.

Forge: `comp-shadowBorn`, member `shadowBorn`, line 1682.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: weakness.holy set 5.

Rules and timing: EACH turn start with concealment gain one surge (not once per round). Holy weakness 5.

Forge comparison: Forge surge factory frequency OncePerRound conflicts with source EVERY turn start with concealment. In multi-turn rounds source can trigger again. Holy weakness5 agrees.

### Shared Spirit

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/shared-spirit.md) — `mcdm.heroes.v1/complication/shared-spirit`.

Forge: `comp-sharedSpirit`, member `sharedSpirit`, line 1704.

Required source data:

- **selfSkills**: 3; Owned skills before Shared Spirit conditional grants; actor owner; build. Distinct targets; mark usable only by self.
- **spiritSkills**: 3; allSkills minus all previously owned skills; actor owner; build. Distinct new skills; available only with spirit control. Other known skills remain shared.

Rules and timing: Choose three currently owned skills usable only by self and three distinct new skills usable only by spirit. Other known skills stay available to either. Daily d6 1–4 self/5–6 spirit or choose if good terms; do not grant six skills unconditionally.

Forge comparison: Three owned/three new conditional skills and daily control choice agree in text; Forge no selectors or conditional skill grants.

### Shattered Legacy

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/shattered-legacy.md) — `mcdm.heroes.v1/complication/shattered-legacy`.

Forge: `comp-shatteredLegacy`, member `shatteredLegacy`, line 1717.

Required source data:

- **language**: 1; Printed language table entries subject to current language eligibility policy; actor owner; build. Source says one language without extant/dead restriction; Forge defaults all categories. Legal deferred slot retains restrictions.
- **brokenTreasure**: 1; leveledTreasures; actor owner; build. Identity/source retained even while broken; do not apply item benefits.

Rules and timing: One language and one leveled treasure chosen at build; treasure is BROKEN/inoperative and source for repair possessed. Craft Treasure repair at half normal project goal, must obtain item prerequisite. No treasure bonuses until repaired; retain item identity while broken.

Forge comparison: Forge toggle omitted checked; factory defaults TRUE, enabling broken treasure incorrectly. Item selector nested inside toggle also hides mandatory pre-repair identity. Language defaults all four categories; source one language unspecified. Leveled pool matches armor/implement/weapon/other.

### Shipwrecked

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/shipwrecked.md) — `mcdm.heroes.v1/complication/shipwrecked`.

Forge: `comp-shipwrecked`, member `shipwrecked`, line 1743.

Required source data:

- **skills**: 2; explorationSkills; actor owner; build.
- **forgottenLanguage**: 1; Currently known languages (not unfilled/deferred entitlements); actor owner; build. Source does not forbid forgetting Caelian. Q-R-100 says automatic known, not explicitly unforgettably known; concrete collision requires case-specific ruling if enforced otherwise.

Rules and timing: Choose two exploration skills, then remove one currently known language of choice. Cannot remove empty deferred entitlement. Source says forgotten, not permanently barred from relearning.

Forge comparison: Two exploration skills match; language removal is prose-only, no selector or removal operation in Forge.

### Sibling's Shield

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/siblings-shield.md) — `mcdm.heroes.v1/complication/siblings-shield`.

Forge: `comp-siblingsShield`, member `siblingsShield`, line 1762.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Sibling ceremonial shield on back prevents flanking, not a general kit shield bonus. Respite Intuition test cannot use skill; tiers1/2 regain one fewer CURRENT Recoveries. No permanent Recovery penalty.

Forge comparison: Back-worn shield and no-skill respite Intuition tiers1/2 penalty agree; no normal shield kit bonus.

### Silent Sentinel

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/silent-sentinel.md) — `mcdm.heroes.v1/complication/silent-sentinel`.

Forge: `comp-silentSentinel`, member `silentSentinel`, line 1780.

Required source data:

- **skill**: 1; loreSkills; actor owner; build.

Fixed skills: Eavesdrop, Sneak.

Permanent/initial contributions: weakness.sonic set 5.

Rules and timing: Eavesdrop and Sneak fixed grants plus one lore skill. Mutual observation/shared language telepathy, no fixed range cap. Sonic weakness 5; sonic damage dazes until next turn end.

Forge comparison: Fixed Eavesdrop/Sneak count2, lore count1, telepathy and sonic weakness/dazed agree. Fixed skills must participate in duplicate-grant replacement policy.

### Slight Case of Lycanthropy

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/slight-case-of-lycanthropy.md) — `mcdm.heroes.v1/complication/slight-case-of-lycanthropy`.

Forge: `comp-slightCaseOfLycanthropy`, member `slightCaseOfLycanthropy`, line 1813.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Non-minion winded or killed gives surge. Turn start >=5 surges or >=1 under moonlight: lose all, wolf hybrid until turn end, shift speed toward nearest then mandatory melee free strike, ally wins tie. Ineligible Stormwight Fury only, not all Furies.

Forge comparison: Source Stormwight Fury exclusion only in Forge text. Surge AtWill, wolf thresholds and ally tie target agree.

### Stolen Face

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/stolen-face.md) — `mcdm.heroes.v1/complication/stolen-face`.

Forge: `comp-stolenFace`, member `stolenFace`, line 1842.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Five uninterrupted minutes to copy previously observed same-ancestry face, no hair/nonface changes; double edge impersonation/disguise tests. Taking damage blanks face until feature used, but senses/speech intact.

Forge comparison: Source double edge on all impersonation/disguise tests; Forge filters Disguise skill, which is not a source ownership/use prerequisite. Timing/face blanking otherwise agree.

### Strange Inheritance

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/strange-inheritance.md) — `mcdm.heroes.v1/complication/strange-inheritance`.

Forge: `comp-strangeInheritance`, member `strangeInheritance`, line 1867.

Required source data:

- **secretTrinket**: 1; secondEchelonTrinkets; actor Director; build. Owner must not choose or see identity/powers before first operation. Unresolved setup is explicit, never random auto-selection.

Rules and timing: DIRECTOR chooses unknown second-echelon trinket; operational only level+Victories >=5, powers hidden until first operational. First Wealth >1 loses one Wealth, one-time event; not global Wealth penalty.

Forge comparison: Secret Director choice, threshold and first Wealth>1 loss agree, but Forge prose supplies no secret item reference, actor or activation latch.

### Stripped of Rank

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/stripped-of-rank.md) — `mcdm.heroes.v1/complication/stripped-of-rank`.

Forge: `comp-strippedOfRank`, member `strippedOfRank`, line 1885.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: followerRenownThresholds replace [4, 8, 12, 16].

Granted ability: Issue Order. Full source block must be displayed.

Rules and timing: Grant Issue Order ranged10 main action one ally: triggered main/maneuver/move; if hero has Strike Now, recipient free triggered instead. Follower Renown thresholds replace 3/6/9/12 with 4/8/12/16.

Forge comparison: Issue Order including Strike Now exception and follower thresholds4/8/12/16 agree.

### Thrill Seeker

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/thrill-seeker.md) — `mcdm.heroes.v1/complication/thrill-seeker`.

Forge: `comp-thrillSeeker`, member `thrillSeeker`, line 1913.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Party reaching 2/4/6 Victories grants hero token; session start excludes normal token for this hero. No starting stat changes.

Forge comparison: Hero token at party2/4/6 Victories and omitted session token agree.

### Vampire Scion

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/vampire-scion.md) — `mcdm.heroes.v1/complication/vampire-scion`.

Forge: `comp-vampireSire`, member `vampireSire`, line 1931.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Adjacent melee free strike may bite; tier3 grants temporary Stamina = damage until next respite end. While that temporary Stamina persists fangs, Presence interaction bane with humanoids and progenitor location sense. No unconditional temporary Stamina.

Forge comparison: Forge name Vampire Sire differs materially from canonical Vampire Scion, but benefit/drawback match exactly in meaning; alias, not missing record.

### Voice in Your Head

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/voice-in-your-head.md) — `mcdm.heroes.v1/complication/voice-in-your-head`.

Forge: `comp-hearsVoices`, member `hearsVoices`, line 1956.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Director provides useful vague voice advice; displeased voice may interrupt respite for two fewer Recoveries regained. No permanent Recovery modifier.

Forge comparison: Case alias Voice in your Head; member/id hearsVoices. Advice and two fewer regained Recoveries agree.

### Vow of Duty

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/vow-of-duty.md) — `mcdm.heroes.v1/complication/vow-of-duty`.

Forge: `comp-vowOfDuty`, member `vowOfDuty`, line 1974.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: stability add 1.

Rules and timing: Stability +1 baseline; forced disobedience SETS stability to 0 until doubts resolved/new organization, not merely removes +1.

Forge comparison: Stability+1 and SET0 on disobedience agree; Forge failure remains prose-only conditional, not baseline removal of1.

### Vow of Honesty

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/vow-of-honesty.md) — `mcdm.heroes.v1/complication/vow-of-honesty`.

Forge: `comp-vowOfHonesty`, member `vowOfHonesty`, line 1992.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Detect lower-level lies; double edge persuading specific fact. Lying disables benefit and causes interpersonal-skill test bane until penance. Neither grants Persuade skill nor allows permanently active benefit after oath broken.

Forge comparison: Source double edge any test persuading a fact; Forge Persuade filter could narrow applicability. Ability loss/bane after lying agrees in prose; no automatic active-state inference.

### Waking Dreams

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/waking-dreams.md) — `mcdm.heroes.v1/complication/waking-dreams`.

Forge: `comp-waking-dreams`, member `wakingDreams`, line 2024.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Each respite Reason test: tier1 lose Recovery AFTER finish; tier2 helpful brief current-world vision; tier3 >=1 minute. No build ability/initial Recovery loss.

Forge comparison: Forge represents respite test as ability with defaults. Source timing remains respite; three outcomes agree (Forge tier3 text typo). No permanent action grant from source.

### War Dog Collar

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/war-dog-collar.md) — `mcdm.heroes.v1/complication/war-dog-collar`.

Forge: `comp-warDogCollar`, member `warDogCollar`, line 2048.

No mandatory mechanical creation selection beyond the complication.

Granted ability: Posthumous Retirement. Full source block must be displayed.

Rules and timing: Worn collar prevents others Posthumous Promotion on hero. Grant Posthumous Retirement Area/Magic maneuver 1 burst enemies, fire5+level; reset with uninterrupted minute out of combat. Director may spend3 Malice per use to hit hero too.

Forge comparison: Keywords/burst/enemy damage and3-Malice self damage agree. Forge reset text drops uninterrupted qualifier: preserve uninterrupted minute OUT of combat.

### War of Assassins

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/war-of-assassins.md) — `mcdm.heroes.v1/complication/war-of-assassins`.

Forge: `comp-war-of-assassins`, member `warOfAssassins`, line 2080.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Initial three reasonable in-power favors from helped assassins faction. Other faction hostile. Favor count is spendable state, not three starting followers.

Forge comparison: Capitalization alias; three favors and rival faction hostility agree.

### Ward

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/ward.md) — `mcdm.heroes.v1/complication/ward`.

Forge: `comp-ward`, member `ward`, line 2098.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: Negotiating with monarch/aristocrat/wealthy leader grants NPC patience+1 max5. Respite d10=1 forces helping ward instead of activity, not loss of other respite benefits.

Forge comparison: Patience+1 max5 and d10=1 lost respite activity agree.

### Waterborn

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/waterborn.md) — `mcdm.heroes.v1/complication/waterborn`.

Forge: `comp-waterborn`, member `waterborn`, line 2116.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: automaticFullSpeedMovement grant swim; underwaterBreathing grant True; weakness.lightning set 5.

Granted ability: Rogue Wave. Full source block must be displayed.

Rules and timing: Automatic full-speed swimming and underwater breathing plus Rogue Wave Magic/Ranged/Strike main range10 creature/object, highest characteristic, damage2/5/7 push-or-pull1/2/3, can forgo damage. Lightning weakness5; ocean may temporarily withdraw benefits for disobedience.

Forge comparison: Rogue Wave fields/tiers/swim/breathing/lightning weakness5 agree; Director may disable benefits. Swim grant does not change baseline numeric speed.

### Wodewalker

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/wodewalker.md) — `mcdm.heroes.v1/complication/wodewalker`.

Forge: `comp-wodewalker`, member `wodewalker`, line 2166.

No mandatory mechanical creation selection beyond the complication.

Permanent/initial contributions: recoveryValue addAfterBaseline highest characteristic; weakness.fire set 5.

Rules and timing: Recovery value adds highest characteristic AFTER floor(max Stamina/3). Fire weakness5; recalculate highest when build changes.

Forge comparison: Recovery value highest-characteristic contribution and fire weakness5 agree; multiple characteristics mean highest per ModifierLogic, not sum.

### Wrathful Spirit

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/wrathful-spirit.md) — `mcdm.heroes.v1/complication/wrathful-spirit`.

Forge: `comp-wrathfulSpirit`, member `wrathfulSpirit`, line 2185.

No mandatory mechanical creation selection beyond the complication.

Rules and timing: While taunted, edge striking taunter; may spend1 Heroic Resource for double edge. Being struck while not taunted creates taunt until next turn end; insults force insult response or spend Recovery.

Forge comparison: Taunter edge/optional1-resource double edge and forced taunt/insult rules agree.

### Wrongly Imprisoned

[Canonical source](../../vendor/steel-compendium/en/unified/md/complication/wrongly-imprisoned.md) — `mcdm.heroes.v1/complication/wrongly-imprisoned`.

Forge: `comp-wronglyImprisoned`, member `wronglyImprisoned`, line 2210.

Required source data:

- **skills**: 2; nonInterpersonalSkills; actor owner; build.

Rules and timing: Two distinct skills from crafting/exploration/intrigue/lore UNION. Winded cough prevents hiding/sneaking; no permanent loss of Sneak skill.

Forge comparison: Two skills from four-group union and winded no hide/sneak agree.

## Verification and handoff

This research used lightweight local reads and Python text/JSON inspection only. Verified 100 snapshot
records, 100 unique matched Forge IDs, 100 individually authored effect classifications and 100
individual comparisons. Inspected factory defaults and relevant selectors rather than interpreting
omitted fields as rules. No Forge or Compendium pin was changed.

Independent implementation/rules reviews must check behavior, not just these inventory counts. Useful
contrasting cases are Promising Apprentice targeting an older owned skill; Ivory Tower rejecting a
nonparent removal; Raised by Beasts suppressing culture but keeping class/career fixed skills;
Shared Spirit retaining common skills without granting both exclusive sets; Shipwrecked removing a
known language; inactive artifacts preserving choices; broken treasures granting no stats; source
ability grants displaying complete blocks; and negative maximum/resource/renown operations retaining
current gameplay state.

Q-CHAR-15 follow-up: after research delivery, the user accepted relying on the corpus-backed
Wyrmplate prerequisite. Scales is source-visible and unavailable without that signature; the rest of
Dragon Dreams remains available. Forge ancestry Scales entries at lines 98–155 assume its preceding
Wyrmplate grant and do not establish signature-free use.
# Referenced treasure creation-choice audit — 2026-09-17

Read the full pinned source bodies for every treasure eligible through an item-grant complication:
12 first-echelon trinkets, 8 second-echelon trinkets, 35 leveled treasures (including the 14-weapon
subset), and 3 artifacts: **58 unique records**. The JSON ledger's
`referencedTreasureCreationChoiceAudit` records each identity, exact path, source hash and result.
No additional mandatory character-creation selection was found beyond choosing the item itself.

The following choices have explicit later timing and should not be invented as creation picks:

- Blade of Quintessence chooses its damage type when an ability is used. Blade of a Thousand Years
  changes light/medium/heavy form as a free maneuver while wielded; Artifact Bonded starts absent.
- Bloodbound Band forms bonds during a respite. Quantum Satchel gains a storage destination when
  its brooch is placed in a room/container. Neither implies a preexisting configured link.
- Mask of the Many chooses a disguise and gear appearance during its maneuver. Thief of Joy picks
  a creature and acquires envy/disdain during use. Adaptive Second Skin of Toxins selects retaliation
  damage when triggered, with later terrain alteration as a maneuver.
- Mediator's Charm asks the Director for an NPC motivation/pitfall at negotiation start. Divine
  Vine's Yllyric invocation is a use instruction, not a new language grant or a printed requirement
  to add a language choice to the build.
- Mortal Coil's host mortality, possession and active consequences belong to artifact use;
  selecting it for absent Artifact Bonded does not activate them. Crafting project prerequisites and
  roll characteristics describe later crafting, not choices required to receive a starting item.

Full source and initial item state remain necessary display information. Equipment, inventory use,
item-granted ability execution and changing configurations during play remain separate contracts.
