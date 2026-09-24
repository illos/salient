# V32: Fury level-one to level-two rules contract

Research date: 2026-09-16. Scope: the existing **Devil / Berserker Fury / Mountain / Soldier**
Grug path, advanced from level 1 to 2. This is source research and an independent expected target,
not proof of implemented progression or automated gameplay.

## Authority and references

- Rules: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
- Structural reference: pinned Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.
- [Owning character spec](../character-wizard-spec.md#level-up),
  [current-value policy](../character-wizard-spec.md#current-values-when-a-build-changes),
  [history policy](../character-wizard-spec.md#5-progression-history).
- [V24 sequence](../build/V24-character-wizard-assessment.md#recommended-delivery-order) and
  [V08 scope](../build/V08-classes-and-advancement.md).
- Inherited level-one target: [v25-fury.json](../../tests/fixtures/v25-fury.json).
- Independent level-two target: [v32-fury-level-two.json](../../tests/fixtures/v32-fury-level-two.json).

All `en/...` paths below are relative to `vendor/steel-compendium`. Read hidden book-specific
files with `git -C vendor/steel-compendium show HEAD:<path>`. Book-clean context is essential:
extracted level-two ability records do not carry their aspect, and unified `chapter/perks.md`
is from Beastheart. Neither fact authorizes widening the core perk or Berserker pools.

## Transition decision table

| Item | Sourced result at level 2 | Input / dependency | Source |
| --- | --- | --- | --- |
| Fury advancement | Retain signature, 3-Ferocity and 5-Ferocity abilities; add one aspect ability costing 5. Advancement table columns are cumulative. | Existing Fury 1 build. | `en/unified/md/class/fury.md`, Fury Advancement Table; `mcdm.heroes.v1/class/fury`. |
| Stamina | Increase class contribution by 9: class Stamina becomes 30. | Fury level becomes 2. | Same class entry, Basics. |
| Perk | Choose exactly one crafting, exploration or intrigue perk. | `class.fury.level-2.perk`. | `en/unified/md/feature/fury/level-2/perk.md`; `mcdm.heroes.v1/feature.fury.level-2/perk`. |
| Aspect feature | Automatically gain **Unstoppable Force**. | Existing Berserker aspect; no new aspect selection. | `en/unified/md/feature/fury/level-2/2nd-level-aspect-feature.md` and `unstoppable-force.md`. |
| Aspect ability | Choose exactly one of **Special Delivery** or **Wrecking Ball**. | `class.fury.level-2.aspect-ability`; Berserker. | `en/unified/md/feature/fury/level-2/2nd-level-aspect-ability.md`; `en/books/heroes/clean/Draw Steel Heroes.md`, lines 9280–9314, “2nd-Level Berserker Ability.” |
| Earlier choices | Keep ancestry, culture, career, traits, characteristics, kit, skills, languages and existing abilities. No level-two characteristic, skill, language, trait-budget or kit grant. | Earlier decisions remain owned by their original grants. | Fury Advancement Table and level-two feature paragraphs; scoped preservation is also the owning app spec. |
| Growing Ferocity | No new level-gated threshold unlocked; level-4/7/10 improvements remain dormant. Existing threshold benefits remain conditional on current Ferocity. | Existing Berserker. | `en/unified/md/feature/fury/level-1/growing-ferocity.md`, Berserker table. |
| Source timing | Standard threshold is cumulative XP 16; gain level during the same respite that supplies sufficient XP. | See timing below. | `en/unified/md/chapter/making-a-hero.md#heroic-advancement`; `en/unified/md/rule/resource/experience.md`. |

Death... Death! and Phalanx-Breaker belong to **Reaver**; Apex Predator and Visceral Roar belong
to **Stormwight**. A shared cost of 5 and a `class: fury` field do not make them Berserker options.
The book-clean passage immediately following the Berserker pair establishes these other groups.

The source's general Changing Character Options passage permits broader changes between sessions,
and an optional Director rule permits respite ability changes. Those are separate full-edit/optional
workflows; this transition supplies no additional replacement entitlement or implicit approval bypass.

## Eligible core perk pool and nested restrictions

Read `en/books/heroes/clean/Draw Steel Heroes.md`, “Crafting Perks,” “Exploration Perks,” and
“Intrigue Perks” (lines 17319–17395 and 17441–17467). The 22 source options are:

| Group | Core options |
| --- | --- |
| Crafting (6) | Area of Expertise; Expert Artisan; Handy; Improvisation Creation; Inspired Artisan; Traveling Artisan. |
| Exploration (10) | Brawny; Camouflage Hunter; Danger Sense; Friend Catapult; I've Got You!; Monster Whisperer; Put Your Back Into It!; Team Leader; Teamwork; Wood Wise. |
| Intrigue (6) | Criminal Contacts; Forgettable Face; Gum Up the Works; Lucky Dog; Master of Disguise; Slipped Lead. |

Individual entries are `en/unified/md/perk/<slug>.md`, SCC `mcdm.heroes.v1/perk/<slug>`.
Perk category membership comes from Heroes book context, not a guessed name or supplemental index.
A bounded implementation may expose a declared subset; it must not claim complete pool coverage.

**Area of Expertise** adds a mandatory choice of a crafting skill the hero *already has*
(`en/unified/md/perk/area-of-expertise.md`). It does not grant a new skill. Grug has only
Blacksmithing in the crafting group, so Blacksmithing is the only valid nested choice here.
Other listed perks refer to skills, rolls and contexts but add no creation-time skill selection.
Do not invent ownership prerequisites for perks whose text only describes when their benefit applies.

Grug already owns **Teamwork** from Soldier. Forge Steel explicitly excludes already-owned perk IDs
from its picker (`src/components/features/feature-data/perk.tsx`, `ConfigPerk`). A blanket ban on
selecting the same perk again was **not found in the inspected pinned Heroes perk chapter**. Treat a
nonduplicate picker as a conservative application/reference choice, not a quoted rule; do not infer
stacking or a replacement grant from a duplicate. The selected fixture avoids this uncertainty.
The app's Q-CHAR-11 duplicate **skill** policy does not establish a duplicate-perk rule.

**Chosen acceptance path: Danger Sense + Wrecking Ball.** Danger Sense is exploration, is not
already owned and adds no permanent numeric modifier or nested choice. Its Alertness edge and
surprise protection apply only in natural environments outside settlements; imminent natural-disaster
warning covers 72 hours. Keep all clauses readable. Grug's existing Alertness makes this a useful
choice without inventing a new skill grant. These are fixture choices, not automatic defaults for
all characters.

## Every newly delivered grant and gameplay boundary

| Grant | Complete relevant behavior | Wizard/sheet consequence | Runtime boundary |
| --- | --- | --- | --- |
| Unstoppable Force | Charge can use a strike signature or strike heroic ability instead of a free strike; may jump as part of the charge. | Readable automatic feature with source. | Does not make every ability usable with Charge. Neither level-two Berserker option has Strike. Movement/action substitution remains separate engine work. |
| Wrecking Ball | 5 Ferocity; maneuver; Melee, Weapon; Self. Move up to speed in a straight line, pass through and destroy mundane structures as difficult terrain, leave difficult terrain; one Might roll targets each enemy moved adjacent to; push 1/2/3. | Add selected ability; roll bonus +2, push tiers 1/2/3 for Grug. No damage expression exists. | Do not manufacture weapon damage or add Mountain's damage bonus to pushes. Terrain, movement, target selection and pushes may remain explicitly manual. |
| Special Delivery (alternative) | 5 Ferocity; maneuver; Melee, Weapon; melee 1; one willing ally. Vertical push up to 4, ignore stability, no collision damage; at end ally can make free strike with extra damage equal to Fury's Might. | Alternative selectable ability; extra ally strike damage is +2 for Grug. | This is not a damage roll made by the Fury; neither Mountain damage nor the Fury's weapon profile becomes the ally's strike. |
| Danger Sense | Natural environment excluding settlements: Alertness tests gain edge; cannot be surprised. Warns of natural disasters imminent within 72 hours without identifying their nature. | Readable selected perk; no blanket sheet edge or skill added. | Contextual test/surprise/disaster effects remain explicitly manual absent dedicated support. |

Sources: `en/unified/md/feature/fury/level-2/unstoppable-force.md`,
`en/unified/md/feature/ability/fury/level-2/{wrecking-ball,special-delivery}.md`,
`en/unified/md/perk/danger-sense.md`. Preserve the **body** of Wrecking Ball: its extracted
frontmatter effect omits the additional sentence establishing targets for the power roll.
Existing Primordial Strength can add damage when a pushed creature collides with an object; that
conditional collision is separate from Wrecking Ball's printed push tiers and is not baseline damage.

The existing Ferocity feature applies unchanged to newly gained abilities: outside combat, fixed
Ferocity cost is waived, but each such ability/effect cannot be used again outside combat until earning
one or more Victories or finishing a respite. A level-up or history restore is neither event.
Source: `en/unified/md/feature/fury/level-1/ferocity.md`. Recording a new ability is not proof that
this usage lifecycle has been automated.

## Independent baseline calculations

| Field | Level 1 | Level 2 | Explanation |
| --- | --- | --- | --- |
| Echelon | 1 | 1 | Levels 1–3 are first echelon: `en/unified/md/rule/general/echelon.md`. |
| Class Stamina | 21 | 30 | `21 + 9 × (level − 1)`, Fury Basics. |
| Mountain Stamina | 9 | 9 | +9 per echelon, `en/unified/md/kit/mountain.md`. |
| Stamina maximum | 30 | **39** | Class plus Mountain. |
| Recovery value | 10 | **13** | Floor(maximum / 3), `en/unified/md/rule/health/recoveries.md`. |
| Winded value | 15 | **19** | Half maximum rounded down: `rule/health/winded.md` and `rule/general/always-round-down.md`. |
| Recoveries maximum | 10 | **10** | Fury class; no increase at level 2. |
| Characteristics | M2 A2 R0 I1 P0 | Same | No level-two increase. |
| Speed / stability / size | 6 / 2 / 1M | Same | Beast Legs / Mountain / Devil, inherited audited fixture. |
| Disengage / save threshold | 1 / 5 | Same | Default disengage / Impressive Horns. |
| Potency weak / average / strong | 0 / 1 / 2 | Same | Might−2 / Might−1 / Might. |
| Renown / Wealth | 1 / 1 | Same | Soldier grants do not replay or increase with level. |
| Skills / languages | 10 / 3 chosen | Same | Deferred Soldier language remains deferred. |
| Perks | Teamwork | Teamwork, Danger Sense | Retain career grant, add class grant. |

All existing ability damage tiers remain unchanged: Brutal Slam 5/8/15; Out of the Way! 5/7/14;
Thunder Roar 6/9/17; Pain for Pain 5/7/15; melee weapon free strike 4/7/13; ranged weapon free
strike 4/6/8. Wrecking Ball has **no damage tiers**. These inherited calculations retain the V25
source ledger; the transition changes neither characteristics nor first-echelon kit bonuses.

## XP, timing and live values

The standard threshold for entering level `L` is `16 × (L − 1)` through level 10. XP is cumulative
and is not spent at level-up. At respite completion, convert Victories to XP and reset Victories to
zero (`rule/resource/experience.md`). The source then says the level is gained during that same
respite (`chapter/making-a-hero.md`, Heroic Advancement). Mere XP ≥ 16 during ordinary FreePlay
does not establish the source timing condition.

App Q-CHAR-3 supplies a separate admission offset: threshold eligibility uses
`campaignXP + entryLevelOffset`; offset is the admitted level's standard threshold and remains
fixed as XP accrues. Grug entering at level 1 has offset 0. XP15 fails, XP16 succeeds for the
threshold test. A level-2 entry would have offset16 and need16 new campaign XP to reach level3;
that broader transition is outside V32. Awards neither choose decisions nor activate builds.

V08 names `fixtures/manual-xp-entry` as a development dependency when respite is unavailable,
and V24 recommends manual XP entry for this first progression slice. That is not an alternate
campaign advancement rule. If the full respite loop is absent, record a clearly named development
fixture/readiness context establishing the same-respite opportunity; do not silently turn a numeric
XP field into general anytime-leveling permission. Respite completion/award readiness is a
coordination boundary for implementation, not a missing source threshold.

The source also restores all Stamina and Recoveries at respite completion
(`rule/resource/respite.md`). Keep that source restoration **separate** from build activation.
Q-CHAR-2 (revised 2026-09-24; this V32 contract used the 2026-09-15 rule) now defines activation
reconciliation as `newCurrent = newMaximum − (oldMaximum − oldCurrent)`; V32 shipped the earlier `min(oldCurrent, newMaximum)`,
without a zero floor or accidental refills. Examples for a build activation alone:

- Stamina20/30 → 20/39; Recoveries7/10 → 7/10; keep conditions and compatible counters.
- Stamina−3/30 → −3/39; do not floor valid negative Stamina to zero.
- Restore level1 while Stamina35/39 → 30/30; 20/39 → 20/30.
- Activating history never converts Victories to XP, awards items, resets Ferocity use limits or
  replays respite benefits. Current inventory and authored details stay independent.

The source does not prescribe a web-app queue for delayed level choices after a recorded respite
completion. Implement explicit readiness/transition semantics under the existing app policy, and
document the ordering used; do not disguise a product decision as source text.

## Pinned Forge Steel structural mapping

| Local concept | Pinned Forge Steel representation |
| --- | --- |
| Level | `hero.class.level`; `FeatureLogic.getFeaturesFromClass` includes class and selected-subclass `featuresByLevel` entries whose level is ≤ current level. Dormant later entries remain embedded in exports. |
| Fury Stamina | `src/data/classes/fury/fury.ts`: `fury-stamina`, bonus value21 and `valuePerLevel: 9`. |
| Class level-two perk | Same file: `fury-2-1`, `createPerk` with Crafting/Exploration/Intrigue lists. Selection is nested `data.selected`, not a flat class ability ID. |
| Berserker automatic feature | `src/data/classes/fury/berserker.ts`: subclass `fury-sub-1`, level2 `fury-sub-1-2-1`, Unstoppable Force. |
| Aspect choice | Same file: `fury-sub-1-2-2`, choice options wrapping ability features; Special Delivery `fury-sub-1-2-2a`, Wrecking Ball `fury-sub-1-2-2b`. |
| Choice defaults | `src/logic/factory-feature-logic.ts`: `createChoice` defaults count1, `selectAt: build`, empty selection; `createPerk` defaults count1 and empty selection. These defaults do not supply a selected perk/ability automatically. |
| Duplicate-perk UI | `src/components/features/feature-data/perk.tsx` gathers current perk IDs and filters them from the selection modal. |
| Inherited choices | Preserve the existing nested ancestry, culture, Soldier and level-one Fury selections, including the open language slot. Do not replace them with Forge quick-build defaults. |

Map by owning class/aspect, level, feature and canonical source identity. Do not rely on global
uniqueness of Forge IDs or copy their model into Salient. Forge exports are snapshots containing
future definitions; they do not prove those later choices were made and are not progression history.
Real website export validation is recorded separately by the reference-capture task; this source
contract does not claim that an external reference was captured or that Salient interchange exists.

## Acceptance targets and explicit uncertainties

- Primary complete path: existing Grug → Danger Sense + Wrecking Ball; all inherited grants remain,
  three new concrete grants appear (perk, feature, ability), and derived totals above match.
- Alternate aspect choice: Special Delivery is legal; Reaver/Stormwight options are rejected for
  Berserker. Missing or two selected aspect abilities are incomplete/invalid.
- Perk provenance/category is enforced; Area of Expertise requires an owned crafting skill if exposed.
  Selecting Danger Sense cannot invent Alertness or a permanent edge.
- Scope validation prevents a scoped level-up from rewriting earlier decisions. Broader choices use
  full-edit review. Old pending edits must not overwrite a subsequently advanced effective revision.
- Restore immutable snapshots without losing later history; record the restored source revision;
  apply the existing full-edit review and lock rules. Verify resource caps without replaying grants.
- Rules uncertainty is limited to duplicate-perk selection wording as described above. The fixture
  is lawful without resolving it. Full respite integration/queued readiness is an app integration
  decision; XP16 and source timing are established. No web rules research or source-pin changes.
