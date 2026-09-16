# V25: Independent character source audit

## Scope and evidence status

This research checks the complete supported level-one Polder/Fire Elementalist **Bethell** and
rechecks every delivered feature, trait, perk, ability and grant of the existing level-one
Devil/Berserker/Mountain Fury. Rules authority is the pinned Steel Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`. Forge Steel is comparison evidence, not authority.
Expected values were calculated directly from the sources before running the new evaluator.
This document records the rules contract; implementation, persisted-state and browser verdicts
belong in [V25](../build/V25-two-class-wizard.md).

Portable independent fixtures:

- [Bethell](../../tests/fixtures/v25-bethell.json): normalized corrected choices, expected values,
  raw-reference discrepancies, and 59 source records.
- [Fury](../../tests/fixtures/v25-fury.json): original supported choices, independently recalculated
  values, and 49 source records. One Soldier language remains legally deferred in this existing
  fixture; it is not a Forge-export parity fixture.

Each ledger row has its own source path and SHA-256, grant kind, classification and expected
mechanical effect. Sources include the actual ability text, the parent granting feature, each
skill's group, ancestry budgets, career benefits and baseline arithmetic. Source hashes protect
against unnoticed local changes; the repository pin remains the authoritative version identity.

## The original Forge premade needs correction

The original website export is `.playtest/forge-reference/Bethell.ds-hero`, SHA-256
`d21ab1c1a0a3f7eb2a582ad246805ee53fbd703b010b480c3f85cbbdf7ac157a`, observed website 14.198.0.
The vendored structural reference remains 14.197.0 at
`5a846aadb623a9855a023e9403bb887a956c341f`. The original file stays unchanged.

The research found two mechanical problems in that premade's active selection graph:

| Item | Original export | Source result and corrected target |
| --- | --- | --- |
| Creative culture skill | Empathize | Creative permits Music, Perform or crafting. Select **Tailoring**. |
| Class crafting/lore choices | Blacksmithing, Tailoring, Alchemy | Tailoring now comes from culture; select **Blacksmithing, History, Alchemy**. |
| Fixed Magic from class and career | Magic selected twice, then deduplicated to one skill | Both fixed grants apply. Keep Magic and select **Empathize** as one unrestricted replacement. |

[Creative](../../vendor/steel-compendium/en/unified/md/culture/creative.md),
[Mage's Apprentice](../../vendor/steel-compendium/en/unified/md/career/mages-apprentice.md),
[Elementalist](../../vendor/steel-compendium/en/unified/md/class/elementalist.md) and **Choosing
Skills** in [Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md)
establish those results. Accepted [Q-CHAR-11](../rules-questions-for-user.md#q-char-11-which-skill-collisions-create-an-unrestricted-replacement-choice)
resolves fixed grants first and disallows manufacturing unrestricted replacements with optional
duplicate choices. No new user ruling is needed.

The corrected set retains every effective skill in the original and adds the missing **History**
entitlement: ten distinct skills instead of nine. Urban → Alertness is legal: Alertness belongs
to **intrigue**, not exploration. Communal → Gymnastics is also legal.

Exact Forge correction locations, kept separate from our internal choice identities:

- `culture.upbringing.data.selected`: `['Tailoring']`.
- Class level-one feature `elementalist-1-2`: `['Blacksmithing', 'History', 'Alchemy']`.
- Career feature `mages-apprentice-feature-1`: `['Empathize']`.
- Class level-one feature `elementalist-1-1` remains `['Magic']`.

Forge serializes its fixed-skill/replacement presentation as flexible skill slots. Our fixture
preserves the actual two fixed Magic origins and a separate replacement entitlement. Agreement
on the effective skills alone would miss this provenance requirement. Corrected live-export capture and comparison are recorded below; editing normalized data by
itself would not have established successful website recreation.

## Bethell build, feature by feature

The fixture's `ledger` is the complete machine-readable source audit. This table groups the same
records for human review. “Manual” means the build grants the readable rule while table timing,
target selection and effects remain subject to the existing engine support boundary.

| Grant or choice | Independently checked result | Build versus play |
| --- | --- | --- |
| Polder signature traits | Shadowmeld and Small!; Small! sets size 1S | Size derived; Shadowmeld maneuver/effects manual |
| Purchased Polder traits | Corruption Immunity 1 + Graceful Retreat 1 + Fearless 2 = budget 4 | Sourced grants and static values derived |
| Corruption Immunity | Level + 2 = 3 | Show immunity; feed value 3 into existing generic damage resolution |
| Graceful Retreat | Disengage shift 1 + 1 = 2 | Derived distance |
| Fearless | Cannot be made frightened | Show immunity; manual condition override remains available |
| Urban / Communal / Creative | Alertness / Gymnastics / Tailoring | Three distinct eligible skills |
| Culture language and edge | Khoursirian plus automatic Caelian; culture lore/social edge | Languages derived; contextual edge manual |
| Mage's Apprentice | Magic, Monsters, Timescape; First Language; renown +1; Arcane Trick; Forgotten Memories | Choices/grants derived; incident narrative |
| Duplicate fixed Magic | Magic retained once with both origins; Empathize replacement | Order-independent entitlement |
| Class skills | Alchemy, Blacksmithing, History plus fixed Magic | Three crafting/lore choices; ten total skills after all sources |
| Elementalist characteristics | R 2 fixed; M −1, A 1, I 2, P 1 from legal 2,1,1,−1 array | Four assignable characteristics |
| Elemental Specialization | Fire | Grants Acolyte, Return to Formlessness and Explosive Assistance |
| Essence | Essence identity, new hero 0 | Encounter/turn/damage generation manual; generic outside-combat waiver applies |
| Hurl Element | Automatic Magic ranged ability, range 10; can serve as ranged free strike | Build metadata plus sourced usage permission |
| Persistent Magic | Maintain spells by reducing turn-start Essence; stop at damage ≥10 in one turn | Runtime maintenance manual |
| Practical Magic | R-based ranged Knockback, flat damage 2, or teleport 2 plus Essence spend | Runtime choice manual; no rolled-damage bonus to flat damage |
| Fire: Acolyte of Fire | +1 rolled damage for Fire AND Magic; also fire Hurl Element | Generic rolled-damage contribution; conditional Hurl branch |
| Enchantment | One choice: Destruction | +1 rolled damage with Magic; includes Area abilities |
| Elementalist Ward | One choice: Delightful Consequences | First damage each round grants surge 1, manually resolved |
| Signature choices | Bifurcated Incineration and Viscous Fire | Two required, both at-will |
| Heroic choices | The Flesh, a Crucible (3 Essence), Conflagration (5 Essence) | Costs derived; Persistent 1/2 text retained |
| General free strikes | Both melee and ranged weapon free strikes | Remain available alongside Hurl Element |
| Kit | None | No kit choice or kit-granted equipment, Stamina or damage |

The Hurl Element **feature wrapper** explicitly permits use as a ranged free strike; the extracted
ability text omits that permission. Both must be accessible. Practical Magic also has a wrapper
and an ability. A perk record and its granted Arcane Trick ability refer to the same source text;
this is not two independent uses or grants of an effect.

At level one, later Fire features such as Disciple of Fire, Mantle of Essence and Smoldering Step
are inactive. The embedded higher-level data in the export is not an advancement history. Bethell
has **no fire immunity** from Fire specialization at this level. Corruption immunity comes from
Polder, and immunity to frightened comes from Fearless.

### Derived totals

| Field | Expected | Source calculation |
| --- | --- | --- |
| M / A / R / I / P | −1 / 1 / 2 / 2 / 1 | Elementalist fixed R and selected legal array |
| Stamina / winded | 18 / 9 | Class 18; half maximum |
| Recoveries / Recovery value | 8 / 6 | Class 8; floor(18 / 3) |
| Size / speed / stability | 1S / 5 / 0 | Small! size; ordinary speed/stability |
| Disengage | 2 | Base 1 + Graceful Retreat 1 |
| Weak / average / strong potency | 0 / 1 / 2 | R−2 / R−1 / R |
| Saving throw | 6+ | Ordinary rule; no modifying selection |
| Renown / Wealth | 1 / 1 | Career renown +1; ordinary starting Wealth 1 |
| Languages | Caelian, Khoursirian, The First Language | Automatic, culture, career respectively |
| Skills | Alchemy, Alertness, Blacksmithing, Empathize, Gymnastics, History, Magic, Monsters, Tailoring, Timescape | Ten distinct grants with the fixed-Magic replacement |

The raw Forge `state.renown` is **0**, while its sheet shows **1** after applying career grants.
Do not mistake the mutable state offset for the derived total. Starting Wealth is 1. New hero
Stamina is 18, Recoveries 8, Essence/Surges/Victories/XP 0. Those initial values must not reset
played state when a draft is recalculated or reviewed.

### Ability arithmetic and boundaries

These tier values include the chosen characteristic contribution where the printed damage
actually includes it. All Elementalist rolls here use Reason +2; that does not mean every damage
entry receives +2 from Reason.

| Ability | Source tier damage | Passive contributions | Final tiers |
| --- | --- | --- | --- |
| Hurl Element, nonfire | 2+R / 4+R / 6+R | Destruction +1 | 5 / 7 / 9 |
| Hurl Element, fire | 2+R / 4+R / 6+R | Destruction +1, Acolyte +1 | 6 / 8 / 10 |
| Bifurcated Incineration | 2 / 4 / 6 | Destruction +1, Acolyte +1 | 4 / 6 / 8 |
| Viscous Fire | 2+R / 5+R / 7+R | Destruction +1, Acolyte +1 | 6 / 9 / 11 |
| The Flesh, a Crucible | 5+R / 8+R / 11+R | Destruction +1, Acolyte +1 | 9 / 12 / 15 |
| Conflagration | 4 / 6 / 10 | Destruction +1, Acolyte +1 | 6 / 8 / 12 |
| Melee weapon free strike, A chosen | 2+A / 5+A / 7+A | None | 3 / 6 / 8 |
| Ranged weapon free strike, A chosen | 2+A / 4+A / 6+A | None | 3 / 5 / 7 |

Practical Magic's flat damage is **2**, with no Destruction or Acolyte bonus. Neither feature
requires the Strike keyword for rolled damage: Conflagration receives both. Hurl Element does
not have Fire printed among its keywords, but Acolyte explicitly grants the fire-damage exception.
Arcane Trick, Shadowmeld, Return to Formlessness and Explosive Assistance do not deal rolled
damage. Explosive Assistance adds 2 squares, or 4 when spending 1 Essence; it is a triggered
action, not a free triggered action. Persistent effects repeat under their printed timing;
paying a spell's initial Essence cost does not automatically maintain it.

## Fury regression audit

Every active record is independently listed in [the Fury fixture](../../tests/fixtures/v25-fury.json).
The existing path selects Devil, Beast Legs, Impressive Horns; Wilderness/Communal/Martial;
Soldier/Teamwork; Berserker; Mountain; Brutal Slam, Out of the Way! and Thunder Roar.

| Grant | Independent effect |
| --- | --- |
| Silver Tongue | Interpersonal skill Persuade; negotiation discovery edge manual |
| Beast Legs / Impressive Horns | Speed 6 / saves 5+; costs 1+2 fit budget 3 |
| Culture | Swim, Blacksmithing, Intimidate; culture edge; Caelian and Anjali |
| Soldier / Teamwork | Endurance, Alertness; two language slots; renown+1; first montage turn test and assist |
| Fury / Berserker | Nature, Jump, Climb, Lift; M2 A2 and assigned R0 I1 P0 |
| Ferocity | Correct resource identity; generation/reset/waiver rules readable and manual |
| Growing Ferocity | Only level-one thresholds 2/4/6 eligible; timing/manual benefits not permanent baseline bonuses |
| Mighty Leaps | Minimum tier 2 on Might jumping tests, not all Might tests |
| Kit / Mountain | Stamina +9, stability+2, Melee+Weapon rolled damage 0/0/+4; heavy armor/heavy weapon |
| Primordial Strength | Contextual object/impact extra damage M2, manual |
| Lines of Force | Triggered action; redirect force movement, +M2 or spend1 Ferocity for +2M4 |
| Pain for Pain | Granted by Mountain; printed damage already includes Mountain bonus; contextual extra2 manual |
| Selected class and free-strike abilities | Every action, distance, target, cost and tier checked in ledger |

Expected static totals: Stamina **30**, winded **15**, Recoveries **10**, Recovery value **10**,
speed **6**, stability **2**, size **1M**, Disengage **1**, Might potencies **0/1/2**, renown **1**,
Wealth **1**. Ten distinct skills and three currently known languages match the existing path;
the second Soldier language remains an explicit deferred slot.

| Fury ability | Effective tiers | Important boundary |
| --- | --- | --- |
| Brutal Slam | 5 / 8 / 15 | M2 and Mountain tier-three +4 |
| Out of the Way! | 5 / 7 / 14 | M2 and Mountain tier-three +4 |
| Thunder Roar | 6 / 9 / 17 | No M added to damage; Mountain applies to Melee+Weapon Area ability |
| Pain for Pain | 5 / 7 / 15 | Printed Mountain bonus already included; do not add it again |
| Melee weapon free strike | 4 / 7 / 13 | M/A2 and Mountain tier-three +4 |
| Ranged weapon free strike | 4 / 6 / 8 | M/A2; Mountain has no ranged bonus |

## Institutional knowledge for later tracks

- Retain separate grant origin, recipient, active level and selected value. Fixed Magic duplication
  proves a set of skill names alone cannot represent a build; Beastheart companion/Summoner
  portfolio recipients will need the same separation from hero-owned choices.
- Abilities may have granting-feature text omitted from their extracted ability entry. Source
  coverage must include both; Hurl Element's free-strike permission is a concrete example.
- “Rolled damage” and “Strike” are distinct. Area damage can receive kit or magical bonuses.
  Flat damage and conditional situational damage require separate handling.
- Permanent baseline contributions, conditional build modifiers and runtime triggered effects
  must remain distinguishable. Surges from the ward and Essence from taking damage are not
  starting resource grants and must not be re-applied by a wizard evaluation.
- Supplied premades and public PDFs are valuable comparison cases but can have illegal or
  incomplete choice allocation. Preserve originals, document discrepancies, and construct a
  separately identified legal corrected target. A matching UI screenshot cannot override rules.

No unresolved rules ambiguity blocks these two supported creation paths. This statement does not
claim all options, levels, cross-class/ancestry combinations, gameplay execution or interchange
adapters are verified. Independent implementation and rules reviews still have to examine the
finished change and its evidence.

## Corrected Forge reference comparison

The lead imported the corrected choice data into the actual Forge Steel website, exported it
again, and captured its rendered sheet on 2026-09-15 UTC. The independent rules researcher
compared that re-export and sheet text with the source-derived fixture on 2026-09-16 UTC.
[Portable capture metadata](v25-corrected-forge-reference.json) records artifact fingerprints,
normalizations, observed values and exact verification limits. Corrected re-export SHA-256:
`978b0c15f1c1169e06cf78dc50919f5d2833de7fca54eb2478e95716c7fb3a3e`.

| Comparison | Result |
| --- | --- |
| Active ancestry signatures and purchased traits | Pass: all five, with 4-point budget |
| Active class/subclass/enchantment/ward | Pass: level-one Fire, Destruction, Delightful Consequences; future definitions excluded |
| Selected and automatic embedded ability membership | Pass: all ten; two standard free strikes are supplied separately by shared core rules; metadata/text exceptions below |
| Culture/career/class skill allocation | Pass: corrected eligible allocations and ten distinct effective skills |
| Languages and career perk/incident | Pass: all three languages, Arcane Trick, Forgotten Memories |
| Rendered characteristics and all visible static totals | Pass: expected values in Derived totals; Essence/Surges/Victories/XP all 0 |
| Rendered immunities | Pass: corruption 3 and frightened; no fire immunity |
| Rendered ability damage cards | Not captured; source-derived tier expectations remain the contract |

The captured name is **Bethell Corrected V25**, an authored label only. Forge's typographic
Mage’s Apprentice and Acolyte of Fire map to the canonical source names in the fixture. All raw
and corrected binary/text capture artifacts remain ignored local evidence; the normalized
fixtures and metadata are portable and routine tests do not contact the live website.

This demonstrates a corrected **Forge-side** import/re-export and source comparison. It does
not demonstrate our future Forge import/export adapters, nor replace the required local editor,
persistence, browser and independent review evidence.

### Additional reference differences found in independent rules review

The corrected export matches the selected grants and static totals, not every metadata field or
sentence. Salient retains the pinned Compendium in both cases:

- Forge gives **Practical Magic** the Magic and Ranged keywords. The pinned
  `feature/ability/elementalist/level-1/practical-magic.md` lists only Magic. Salient uses only
  that keyword and retains the full effect text explaining each option's distance.
- Forge's **The Flesh, a Crucible — Persistent 1** text shortens the repeat instruction. The pinned
  `feature/ability/elementalist/level-1/the-flesh-a-crucible.md` explicitly makes the repeat optional,
  spends no Essence and requires no action. Salient displays that full source wording; persistent
  repeats remain manual.

These are documented reference differences, not reasons to change authoritative source content.
The independent [rules review](../reviews/V25-rules-review.md) records the exact graph/source locations.
