# Devil level-one implementation preparation

Prepared 2026-09-19 from local pinned sources. This is research for the next separately scoped
ancestry commit under the [V44 delivery plan](../build/V44-character-option-delivery.md), not an
allocated slice, implemented expansion, completed reference capture or verification verdict.
V45 foundation validation remains a prerequisite. No options are enabled by this document.

## Source boundary

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Reference structure: Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.
Neither pin was changed. Research used local files only.

| Purpose | Exact repository source |
| --- | --- |
| Ancestry identity/signature | [Devil](../../vendor/steel-compendium/en/unified/md/ancestry/devil.md) |
| Three-point purchased-trait budget | [Devil Traits](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/devil-traits.md) |
| General ancestry selection context | [Ancestries](../../vendor/steel-compendium/en/unified/md/chapter/ancestries.md) |
| Default size, speed and stability | [Starting Size and Speed](../../vendor/steel-compendium/en/unified/md/rule/character/speed.md) |
| Signature skill and conditional edge | [Silver Tongue](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/silver-tongue.md) |
| Eligible signature skill pool | [Interpersonal Skills](../../vendor/steel-compendium/en/unified/md/skill/group/interpersonal.md) |
| Flight movement context | [Fly](../../vendor/steel-compendium/en/unified/md/movement/fly.md) |
| Forge choices and feature serialization | [Devil definition](../../vendor/forge-steel/src/data/ancestries/devil.ts) |

Devil's baseline is size 1M, speed 5 and stability 0 before applicable contributions. Purchased
traits have a three-point budget; the source quick build is Beast Legs plus Impressive Horns.
Unspent-point handling must retain the existing accepted policy documented in the
[Fury fixture](../../tests/fixtures/v25-fury.json); this preparation does not change that policy.

## Purchased traits and representation

All seven purchased traits are already readable options in the current definition. Only Beast
Legs and Impressive Horns are currently enabled. These rows describe the full level-one target,
including existing calculations that must be preserved.

| Trait | Cost | Source-backed effect | Build requirement and manual boundary |
| --- | ---: | --- | --- |
| [Barbed Tail](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/barbed-tail.md) | 1 | Once per round, when making a melee strike, optionally deal extra strike damage equal to the highest characteristic score. | Grant the sourced trait. Preserve the once-per-round, optional and melee-strike conditions; do not add an unconditional damage bonus. Activation, usage tracking and damage application remain manual gameplay. |
| [Beast Legs](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/beast-legs.md) | 1 | Speed becomes 6. | Set ancestry speed to 6, then apply eligible kit/other contributions. Preserve provenance and the existing no-kit path. |
| [Glowing Eyes](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/glowing-eyes.md) | 1 | After taking damage from a creature, a triggered action can deal that creature psychic damage equal to 1d10 + level. | Grant a readable ancestry ability as well as the purchased trait. At level one the formula is 1d10 + 1. Trigger use, roll and damage application remain manual; the wizard does not activate the ability. |
| [Hellsight](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/hellsight.md) | 1 | Strikes against creatures with concealment do not take a bane from that concealment. | Grant the complete sourced feature. This is a conditional exception, not a permanent edge or blanket removal of all banes. Spatial/concealment resolution remains manual. |
| [Impressive Horns](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/impressive-horns.md) | 2 | Saving throws succeed on 5 or higher. | Preserve derived saving-throw threshold 5, its source and removal when deselected. No new save automation is required. |
| [Prehensile Tail](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/prehensile-tail.md) | 2 | The hero cannot be flanked. | Grant the sourced feature. Flanking adjudication remains manual; there is no flat defensive-stat increase. |
| [Wings](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/wings.md) | 2 | Fly for at most max(1, Might) rounds before falling. While flying with these wings at level 3 or lower, damage weakness 5 applies. | Represent Fly movement and its complete restrictions. Flying uses full speed under the general Fly rule. The aloft limit is a derived conditional value: Fury Might 2 gives 2 rounds, while Might -1 gives 1. Weakness is conditional on flying, never an always-on baseline weakness. Movement, elapsed rounds, falling and conditional damage application remain manual gameplay. |

Forge represents Glowing Eyes as an ability with its trigger and effect text. It represents Wings
as a multiple feature containing the complete description and a Fly movement-mode feature.
Barbed Tail, Hellsight and Prehensile Tail are descriptive features; Beast Legs and Impressive
Horns have explicit speed/save-threshold feature types. These structures help identify active
exported grants; Compendium wording remains the rules authority.

Wings' weakness stops applying above level 3; this later-level change belongs in a separately
scoped ancestry-level unit before a future class build relies on it. This document does not enable
any additional level or automate flight. Glowing Eyes also scales with level and must be carried
forward or changed only within verified level support.

## Silver Tongue and skill choices

Silver Tongue always grants one chosen interpersonal skill. Its separate conditional edge applies
to tests discovering an NPC's motivations and pitfalls during a negotiation; keep that source
text readable without introducing a negotiation workflow.

The complete eligible pool has thirteen skills:

- Brag
- Empathize
- Flirt
- Gamble
- Handle Animals
- Interrogate
- Intimidate
- Lead
- Lie
- Music
- Perform
- Persuade
- Read Person

The current `ancestry.devil.silver-tongue-skill` row enables only Persuade. V37 widened culture
and class skill choices, not this ancestry choice. Completing Devil therefore adds twelve newly
supported skill choices alongside the five purchased traits. Keep the choice restricted to the
interpersonal pool; a broader supported-name list must not broaden eligibility.

Selecting an already-known skill in this flexible ancestry choice must retain existing duplicate
choice handling. It is not an additional fixed-skill grant and does not itself create an
unrestricted replacement entitlement. For witness builds, avoid duplicate selections so every
chosen skill is a legal, effective grant. Include duplicate-choice behavior in focused checks.

## Proposed completed reference matrix

Start from the portable [Grug and Bethell artifacts](v45-reference-inventory.md). Their historical
exports preserve the foundation, but cannot certify newly enabled Devil choices. New captures
must complete the actual target in Forge and retain its unmodified exported bytes.

Four builds are the minimum purchased-trait coverage: total distinct costs are ten points and
one build has at most three. The following four also cover both relevant Wings calculations:

| Template | Class and retained baseline | Purchased traits | Independent checks |
| --- | --- | --- | --- |
| A | Grug's Berserker Fury 1 / Soldier / Mountain | Beast Legs + Impressive Horns (3) | Ancestry speed 6; Mountain speed contribution 0; saving threshold 5; preserve the existing Fury values. |
| B | Same Fury baseline | Barbed Tail + Prehensile Tail (3) | Speed returns to 5; ordinary saving threshold returns to 6; conditional Barbed Tail damage amount 2; cannot-be-flanked feature. |
| C | Same Fury baseline | Glowing Eyes + Wings (3) | Speed 5 with Fly; maximum 2 rounds aloft; conditional weakness 5; ancestry triggered ability with 1d10 + 1 psychic damage. |
| D | Bethell's Fire Elementalist 1 / Mage's Apprentice / no kit, changed to Devil | Wings + Hellsight (3) | Size changes from 1S to 1M; speed 5, stability 0; Fly maximum 1 round at Might -1; conditional weakness 5; concealment exception. |

Complete both Soldier language slots for A/B/C: retain Vaslorian and use Khelt for the formerly
deferred slot. Keep culture Anjali; Caelian remains automatic. Retain the original class skills,
abilities, characteristic assignment, perk and incident. New witness names may identify their
case. The original Grug exports remain unchanged as historical evidence.

For D, retain Bethell's independent culture, language, career, class and nested replacement
choices where legal; culture does not have to change to the ancestry's suggested culture.
Remove Polder traits/grants and add Devil's signature skill. Retain the -1 Might assignment to
exercise the Wings minimum. This also provides the ancestry-switch comparison requested by the
reference procedure.

All selectable-option coverage requires thirteen completed witnesses, because Silver Tongue is
a single choice with thirteen eligible values. Reuse the four templates rather than multiplying
all trait combinations. Proposed option-to-witness ledger:

| Silver Tongue choice | Template |
| --- | --- |
| Persuade | A |
| Brag | B |
| Flirt | C |
| Intimidate | D |
| Empathize | A |
| Gamble | A |
| Handle Animals | A |
| Interrogate | A |
| Lead | A |
| Lie | A |
| Music | A |
| Perform | A |
| Read Person | A |

Intimidate uses D because Grug already receives Intimidate from Martial upbringing. The other
interpersonal choices do not collide with Grug's remaining skills. D avoids Empathize because
Bethell already uses that skill for the duplicate fixed Magic replacement. This proposed mapping
covers every eligible Devil option without changing unrelated background choices solely to
manufacture distinct skill grants. Recheck actual completed website exports before acceptance.

## Shared implementation needs

- Extend the owned Devil level-one content module, preserving IDs and source paths. Update
  option support and stale support-summary metadata consistently. Keep the pinned R01 JSON intact.
- Enable all thirteen Silver Tongue values while retaining its interpersonal eligibility and
  existing duplicate-choice semantics. No nested purchased-trait choices are introduced.
- Grant Glowing Eyes through the shared ancestry-ability mechanism. Confirm that source loading,
  catalog/card rendering and persisted build readback accept its trait source path; do not invent
  a Compendium ability path that does not exist.
- Coordinate a small shared representation for sourced movement modes and conditional build
  contributions before adding Wings. The current baseline has unconditional damage-weakness
  entries but no movement-mode or conditional-weakness field. Inserting Wings into unconditional
  `damageWeaknesses` would be incorrect. Preserve both the flight grant and its restrictions in
  derived/readable output, with the derived aloft limit clearly separate from elapsed play state.
- Keep conditional Barbed Tail, Hellsight, Prehensile Tail and Silver Tongue effects readable and
  explicitly manual. Do not silently model them as flat bonuses or add combat automation in this
  ancestry commit. Permanent build grants/calculations still need complete representation.
- Extend the bounded Forge comparison helper for new active feature shapes, especially Glowing
  Eyes' ability and Wings' multiple/movement-mode features. Do not let unselected option catalogs
  or future definitions become active grants.

The integration owner owns changes to shared contracts, evaluator phases, source-catalog assembly
and presentation support. See the [module handoff](../../shared/content/character-options.md).

## Capture and verification requirements

For each proposed witness, retain completed Forge `.ds-hero` export, readable sheet and relevant
trait/ability evidence, capture date, observed website version, enabled books, source pins and
hashes. Record exact selections and independently source-derived expected results separately from
Salient output. Retain website drift and source-backed discrepancies explicitly; an unexplained
mismatch or a missing same-build counterpart is not a pass.

Capture the same build through the Salient wizard and shared operations, then save/reload and
read back persisted choices, grants and values. Check removal when purchased traits, Silver Tongue
or ancestry change; old fly/ability/save/speed/skill contributions must not survive a changed
parent. Keep class/background choices and authored details where valid. Verify three-point
budget handling, forbidden four-point combinations, duplicate traits, non-interpersonal skills,
missing signature choices and existing draft behavior. Verify unchanged inventory/live-state
boundaries and existing Fury level-two compatibility without broadening progression support.

The unit still requires independent implementation and rules review, full repository/browser
verification on CT114, actual integration-candidate checks and the shared playable-app update
under the existing merge procedure. None of those gates or thirteen fresh captures has been
completed by this preparation. Source research, manual-effect classification and a proposed
matrix alone do not certify full Devil support.
