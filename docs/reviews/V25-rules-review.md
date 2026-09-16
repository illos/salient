# V25 independent rules review

Reviewer: `rules_review`, 2026-09-16. Fresh post-implementation reviewer; did not implement the
slice or author its source fixtures. Reviewed the uncommitted `slice/V25` changes against
`8a6c06c`, including untracked definitions, tests, fixtures and research evidence. This review
changes only this document.

## Verdict

**Pass.** No blocking mechanical defect or unresolved rules decision found in the two delivered
level-one paths. Bethell's corrected Forge selections, active grant membership and captured
static totals agree with the source-correct implementation. The existing Fury passes an
independent source regression. These are distinct evidence claims: no new live Forge Fury
export was supplied, and no rendered Forge ability-damage cards were captured.

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, verified locally.
Forge structural reference: `5a846aadb623a9855a023e9403bb887a956c341f`; actual corrected export
is the recorded website 14.198.0 capture. No internet rules sources were used.

## Specifications and implementation inspected

- [Build review standard](../build/README.md#review-standard),
  [V25 acceptance checks](../build/V25-two-class-wizard.md#acceptance-checks), and
  [reference verification procedure](../build/character-verification.md).
- Wizard [scope](../character-wizard-spec.md#fuller-product-scope),
  [decision system](../character-wizard-spec.md#3-decision-system),
  [revision/review](../character-wizard-spec.md#7-revision-and-review-lifecycle),
  [source compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility),
  and [acceptance](../character-wizard-spec.md#11-acceptance-scenarios).
- Sheet [content](../character-sheet-spec.md#layout-and-content),
  [readable rules](../character-sheet-spec.md#actions-tests-and-readable-rules), and
  [persistence/audiences](../character-sheet-spec.md#views-permissions-and-persistence).
- V1 contracts for [culture and careers](../v1-character-wizard-contracts.md#5-culture-skills-languages-and-careers),
  [duplicate skills](../v1-character-wizard-contracts.md#duplicate-skills),
  [class baselines](../v1-character-wizard-contracts.md#baseline-statistics-and-characteristic-assignment),
  and [kits](../v1-character-wizard-contracts.md#7-kits-equipment-and-grant-accounting).
- The dated V25 additions to [damage arithmetic](../roll-and-damage-resolution.md#43-damage-number)
  and section 9 of [roll/resource resolution](../roll-and-damage-resolution.md): permanent eligible
  bonuses, Polder corruption immunity and Elementalist's own outside-combat waiver. These match
  the inspected implementation and pinned sources; they add no extra automation claim.

Inspected the actual definitions/evaluation in `shared/content/level-one-decisions.ts` and
`shared/evaluate/{character,assignment,structure,abilityModifiers}.ts`; derived/sheet/roll
contracts; `convex/characters.ts` sheet projections and `convex/lib/resolve.ts` actor/target
facts; fixed-cost and damage handling in `shared/resolve/index.ts`; content selection and
generated entries; and the sheet's passive-modifier annotations. Tests were inspected and
rerun rather than treating the research ledger as executable proof.

## Source findings

Read and checked the mechanical passages behind all **59 Bethell ledger records** and
**49 Fury ledger records**, including skill membership, grant parents, ability bodies and
baseline rules. Independently verified all 108 recorded source hashes against the pin,
using the book-specific clean Heroes text where necessary. Per-record paths/classifications
remain in the portable [Bethell](../../tests/fixtures/v25-bethell.json) and
[Fury](../../tests/fixtures/v25-fury.json) ledgers; the grouped findings below identify the
important rules and their implementation consequences.

| Source group | Independent result |
| --- | --- |
| [Polder budget](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/polder-traits.md), [Small!](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/small.md), [Shadowmeld](../../vendor/steel-compendium/en/unified/md/feature/ability/polder/shadowmeld.md) | Four points; both signatures granted. Size 1S is permanent. Shadowmeld is a maneuver with conditional hiding and action/movement restrictions, not a permanent hidden state. |
| [Corruption Immunity](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/corruption-immunity.md), [Graceful Retreat](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/graceful-retreat.md), [Fearless](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/fearless.md) | Costs 1+1+2; corruption immunity 1+2=3; Disengage 1+1=2; frightened immunity. Generic damage receives immunity 3. Manual condition controls remain adjudication overrides. No fire immunity is granted. |
| [Urban](../../vendor/steel-compendium/en/unified/md/culture/urban.md), [Communal](../../vendor/steel-compendium/en/unified/md/culture/communal.md), [Creative](../../vendor/steel-compendium/en/unified/md/culture/creative.md) | Alertness is intrigue, Gymnastics exploration, Tailoring crafting. Creative cannot select Empathize. Culture grants one eligible skill per aspect and its contextual lore/social edge. |
| [Mage's Apprentice](../../vendor/steel-compendium/en/unified/md/career/mages-apprentice.md), [Choosing Skills](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#step-by-step-hero-making), [Arcane Trick](../../vendor/steel-compendium/en/unified/md/perk/arcane-trick.md) | Fixed Magic; Monsters/Timescape; one language; renown +1; supernatural perk and Forgotten Memories. Class and career both grant Magic; one effective Magic preserves both origins and Empathize uses the replacement entitlement. Arcane Trick is a main action with seven utility choices and no damage roll. |
| [Elementalist](../../vendor/steel-compendium/en/unified/md/class/elementalist.md) | Fixed R2; all four printed remaining arrays supported. Their unique permutations total 6+12+12+4=34. Three crafting/lore skills, 18 Stamina, 8 Recoveries, Reason potency. No kit grant exists in this supported path. |
| [Specialization](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/elemental-specialization.md), [level-one feature](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/1st-level-specialization-feature.md), [triggered action](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/specialization-triggered-action.md) | Fire supplies Acolyte of Fire, Return to Formlessness, Explosive Assistance. No higher-level Fire benefits are active. Explosive Assistance is an ordinary triggered action, not free; optional spend replaces R2 movement bonus with 2R4. |
| [Enchantment of Destruction](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment-of-destruction.md), [Acolyte](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/fire-acolyte-of-fire.md), [rolled damage](../../vendor/steel-compendium/en/unified/md/rule/damage/rolled-damage.md) | +1 Magic rolled damage and another +1 for Fire+Magic; no Strike requirement. Hurl has the explicit fire-damage exception. No bonus to Practical Magic's flat R2 damage. Implementation adds applicable bonuses once and preserves printed tiers. |
| [Essence](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/essence.md), [Persistent Magic](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/persistent-magic.md), [ward](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/ward-of-delightful-consequences.md) | Essence identity and fixed 3/5 costs are correct. Outside-combat fixed costs are waived; repeated use retains the existing warning policy. Resource generation/reset, persistent maintenance, the damage-at-least-5R interruption and ward surge timing remain manual. Outside-combat persistence lasts Victories rounds; unlimited spending uses Victories. Full source text retains these restrictions. |
| [Hurl wrapper](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/hurl-element.md), [Practical Magic](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/practical-magic.md), [Elementalist abilities](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/elementalist-abilities.md) | Hurl can serve as a ranged free strike; the wrapper is retained separately from its ability extraction. Practical Magic has three manual branches. Two signatures, one 3-Essence and one 5-Essence selection are required. Both ordinary weapon free strikes remain granted. |
| [Devil traits](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/devil-traits.md), [Silver Tongue](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/silver-tongue.md), [Beast Legs](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/beast-legs.md), [Impressive Horns](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/impressive-horns.md) | Budget 3; selected costs 1+2; Persuade from interpersonal; speed becomes 6; saves 5+. Negotiation edge stays contextual. |
| [Soldier](../../vendor/steel-compendium/en/unified/md/career/soldier.md), [Teamwork](../../vendor/steel-compendium/en/unified/md/perk/teamwork.md), [Fury](../../vendor/steel-compendium/en/unified/md/class/fury.md), [Berserker aspect](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-aspect.md) | Career grants Endurance, Alertness, two language slots, renown +1, Teamwork and incident. Fury grants Nature, Jump/Climb, fixed M2/A2, 21 Stamina and 10 Recoveries; Berserker grants Lift. One Soldier language is legally deferred. |
| [Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md), [Growing Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md), [Mighty Leaps](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/mighty-leaps.md), [Primordial Strength](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-strength.md) | No regression: resource lifecycle and level-one thresholds 2/4/6 are manual; jumping minimum tier applies only to Might jumping tests; object/impact damage is contextual. These do not become universal static bonuses. |
| [Mountain](../../vendor/steel-compendium/en/unified/md/kit/mountain.md), [kit bonuses](../../vendor/steel-compendium/en/unified/md/chapter/kits.md#damage-bonuses), [kit signature](../../vendor/steel-compendium/en/unified/md/chapter/kits.md#kit-signature-ability) | Stamina +9, stability +2, heavy armor/weapon, Melee+Weapon rolled damage 0/0/+4. Thunder Roar qualifies despite Area. Pain for Pain already includes the kit bonus and must not receive it twice. |

The fixed-grant-only collision interpretation and permission to leave ancestry points unspent
are adopted user decisions, not claims that the source explicitly states those restrictions.
The source permits deferring language selection. Caelian is automatic; Khoursirian, The First
Language, Anjali and Vaslorian are confirmed in the pinned Heroes **Culture Benefits**,
**Languages by Ancestry**, and **Vaslorian Human Languages** passages. Skill source groups were
checked individually rather than inferred from their names.

### Independently recalculated totals and damage

Bethell: characteristics **−1/1/2/2/1**, Stamina **18**, winded **9**, Recoveries **8**, Recovery
value **6**, size **1S**, speed **5**, stability **0**, Disengage **2**, potencies **0/1/2**,
save **6+**, renown/Wealth **1/1**, ten skills, three languages, no kit, initial Essence **0**.
Fury: **2/2/0/1/0**, Stamina **30**, winded **15**, Recoveries **10**, Recovery value **10**,
size **1M**, speed **6**, stability **2**, Disengage **1**, potencies **0/1/2**, save **5+**,
renown/Wealth **1/1**, ten skills, three known languages plus one deferred slot.
Recovery division and winded thresholds follow the pinned
[Recoveries](../../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md) and
[Winded](../../vendor/steel-compendium/en/unified/md/rule/health/winded.md) entries.

Read every selected ability's source tiers/action/keywords/range/targets/effects against its
ledger row. Calculated effective damage independently:

| Ability | Effective tier damage |
| --- | --- |
| Hurl Element, nonfire / fire | 5/7/9 / 6/8/10 |
| Bifurcated Incineration | 4/6/8 |
| Viscous Fire | 6/9/11 |
| The Flesh, a Crucible | 9/12/15 |
| Conflagration | 6/8/12 |
| Bethell melee / ranged weapon free strike, using A1 | 3/6/8 / 3/5/7 |
| Brutal Slam | 5/8/15 |
| Out of the Way! | 5/7/14 |
| Thunder Roar | 6/9/17 |
| Pain for Pain, before its conditional extra damage | 5/7/15 |
| Fury melee / ranged weapon free strike | 4/7/13 / 4/6/8 |

Reason is the ability-roll modifier but is not added to Bifurcated Incineration or Conflagration
damage, whose printed tiers lack R. Practical Magic remains flat damage 2. Hurl's chosen damage
type is still a manual gameplay choice; the sheet explicitly marks the additional fire bonus as
conditional. These arithmetic checks do not claim automated execution of all ability effects.

## Forge comparison and nonblocking differences

Independently inspected the actual corrected `.ds-hero` graph, following only selected traits,
career perk, class ability IDs and the selected Fire subclass at level 1. Confirmed all ten
embedded active abilities and five traits, the three corrected skill allocations, career
incident, enchantment, ward and characteristic assignments. Core free strikes come from shared
rules rather than embedded export ability records. Read the captured sheet text and verified
its listed totals, ten skills, three languages, corruption 3 and frightened immunity.
All five artifact byte lengths and SHA-256 values match the
[capture metadata](../research/v25-corrected-forge-reference.json).

No blocking reference mismatch remains. The following differences must not be described as
exact full-text or metadata parity:

1. The original Creative→Empathize allocation was ineligible, and fixed Magic was duplicated
   without its replacement. Corrected Forge uses Creative→Tailoring, class
   Blacksmithing/History/Alchemy, career replacement Empathize. Salient preserves both original
   fixed Magic grant origins, which Forge's flexible skill-slot serialization does not express.
2. Corrected export `class.featuresByLevel[level=1].features[id=elementalist-1-6].data.ability.keywords`
   contains `Magic, Ranged` for Practical Magic. The pinned
   [Practical Magic source](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/practical-magic.md)
   contains only `Magic`. Salient correctly uses the pin.
3. Corrected export `class.abilities[id=elementalist-ability-10].sections[type=field,name=Persist].effect`
   abbreviates The Flesh, a Crucible's repeat to “make a power roll for this ability again.”
   The pinned [ability](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/the-flesh-a-crucible.md)
   explicitly makes the repeat optional, without Essence or an action. Salient retains that
   fuller source text. Persistence remains manual.

Forge's Acolyte feature data is a Fire+Magic modifier; its exported node alone does not explain
the special fire-Hurl exception. The pinned Acolyte source does, and Salient records it explicitly.
No assertion about Forge's runtime handling of that exception is made here.

## Acceptance and verification

| V25 check | Result and evidence |
| --- | --- |
| 1. Both builds and persisted independent expectations | Verified for rules and headless persistence. Both fixture baselines/grant sets pass; new Elementalist persisted selections and sheet pass. Actual browser journeys are verified by the preceding implementation review and recorded logs. |
| 2. Every delivered grant sourced/classified | Verified: all 108 source-ledger records checked, supported grants traced, source hashes confirmed, all persisted new-path grant texts equal pinned source files. |
| 3. Characteristic assignment | Verified: source arrays, all 34 Elementalist permutations, fixed Reason, invalid/partial cases and Fury regression. |
| 4. No-kit/resource/cost/passive calculations | Verified: independently recalculated totals, unchanged legacy Fury output, persisted modifier/immunity projections, positive and negative roll-bonus cases, combat refusal and outside-combat fixed-cost waiver. |
| 5. Changed parents and unsupported choices | Verified: class/ancestry/career/culture/array invalidation, removed contributions and retained independent choices; invalid original Creative allocation is diagnosed. |
| 6. Review and live values | Verified in focused persistence tests: exact revision/staleness, effective isolation, audience privacy, combat lock, preserved compatible live values, atomic refusal of Ferocity→Essence conversion. |
| 7. Readable grants/manual gameplay boundary | Verified: every new-path grant's full text read back, wrappers retained, printed damage unchanged, conditional bonus identified; no automatic generation or persistent/ward effect execution added. |
| 8. Checks and independent reviews | Verified through focused rerun and preceding independent implementation review's recorded final evidence: repository check 97 engine + 321 app/scripts; both browser paths passed. No second full check or deployment was run by this reviewer. |

Reviewer command:

```sh
pnpm exec vitest run --project engine tests/character-v25-evaluator.test.ts tests/v25-build-roll-contributions.test.ts --project app tests/app/elementalist-character.test.ts
```

**16 tests in three files passed**, exit 0. Additional read-only Python inspection checked the
108 source hashes, five capture fingerprints and selected Forge graph. The
[independent implementation review](V25-implementation-review.md) supplies full-suite/browser
verification and closes its earlier synchronization-only test finding.

No implementation mechanical claim was disproved. Limits remain explicit: Fury is source-audited
regression, not a newly captured live Forge comparison; rendered Forge damage cards were not
captured; no Salient import/export adapter or full class-specific gameplay automation was tested
or delivered. Higher levels, other option families and companion/summon execution remain outside
this bounded verdict.
