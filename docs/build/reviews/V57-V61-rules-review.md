# V57/V58/V60/V61 independent rules review

Reviewer: Astra `v70_v71_rules_review`, 2026-09-20; independent of these implementations.
Reviewed the preserved Devil/Polder changes and Dwarf/Human modules in the combined candidate
`ab0f2fd` on `slice/V69`, their focused tests and owning slice source expectations.

**Rules verdict: pass for these four level-one ancestry units; no blocking rules findings.**
This is a source-correctness verdict, not full acceptance, Forge parity or delivery. Outstanding
authentic matching Forge coverage remains outstanding. Live headless results and shared-app
publication belong to the lead's separately retained evidence. No workloads were run here.

The sole rules source was pinned local Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`; no Opus material or external rules sources were used.
Paths below are relative to `vendor/steel-compendium/en/unified/md/` at that revision.

## Findings by ancestry

- **Devil V57:** `feature/trait/devil/devil-traits.md` gives three points. The seven trait
  headers match the implementation: Barbed Tail, Beast Legs, Glowing Eyes and Hellsight cost
  one; Impressive Horns, Prehensile Tail and Wings cost two. Silver Tongue's automatic skill
  choice offers all thirteen entries in `skill/group/interpersonal.md`; the grant remains
  distinct from its manual negotiation edge (`silver-tongue.md`). `beast-legs.md` sets base
  speed 6, while `impressive-horns.md` sets saves to 5+. The other purchases preserve the
  printed manual limitations: once-per-round melee extra damage; triggered psychic retaliation;
  concealment-bane exemption; no flanking; and flight for Might rounds (minimum one), with
  weakness 5 only while flying at level three or below. No unconditional Wings weakness or
  generic damage bonus is invented. The focused skill witness uses a legal Martial Ride choice
  (`culture/martial.md`) to avoid an unrelated Intimidate collision.
- **Polder V58:** `feature/trait/polder/polder-traits.md` gives four points. Corruption
  Immunity, Graceful Retreat, Polder Geist and Reactive Tumble cost one; Fearless and Nimblestep
  cost two. `small.md` sets size 1S and `feature/ability/polder/shadowmeld.md` supplies the
  automatic maneuver, not permanent hidden status. Existing permanent effects remain correct:
  corruption immunity level + 2 = 3 at level one, frightened immunity, and +1 Disengage shift
  distance. The newly enabled traits preserve difficult-terrain/full-speed-sneaking benefits,
  conditional combat-turn-start speed +3 until turn end, and a free triggered shift 1 after
  forced movement. None changes ordinary speed or Disengage. Source conditions remain readable.
- **Dwarf V60:** `feature/trait/dwarf/dwarf-traits.md` gives three points. Grounded, Stand
  Tough and Stone Singer cost one; Great Fortitude and Spark Off Your Skin cost two.
  `grounded.md`, `great-fortitude.md` and `spark-off-your-skin.md` match +1 stability, weakened
  immunity and +6 Stamina at level one, including recalculated dependent health values. Stand
  Tough is resistance-only Might, not attack/core Might. Stone Singer retains one uninterrupted
  hour, mundane unworked stone, three-square limits and reshaping rather than destruction.
  `runic-carving.md` retains Detection/Light/Voice, one active rune, and ten-minute changes;
  it requires no fixed creation-time rune. Future Spark increases at levels 4/7/10 are outside
  this level-one verdict.
- **Human V61:** `feature/trait/human/human-traits.md` gives three points. Can't Take Hold,
  Perseverance and Resist the Unnatural cost one; Determination and Staying Power cost two.
  `staying-power.md` adds two Recoveries, not healing or Stamina. The remaining traits preserve
  their manual boundaries: magic/psionic temporary terrain and forced-movement exceptions;
  Endurance-test edge and slowed speed 3; a maneuver ending one specified condition; and a
  triggered action halving non-untyped damage. They do not grant permanent damage/condition
  immunity or change ordinary speed. `detect-the-supernatural.md` remains the automatic
  maneuver with five-square range, duration through the next turn, and its specified targets.

## Independent expectations and coverage limits

`rule/character/speed.md` gives size 1M, speed 5 and stability 0 before overrides; Mountain
contributes stability 2 and no speed (`kit/mountain.md`). Devil's legal trait witnesses therefore
have speed 5 or 6 and save threshold 6 or 5, depending only on Beast Legs and Impressive Horns
(`rule/general/saving-throw.md` gives the ordinary 6+). Polder's new 2+1+1 loadout gives size
1S, speed 5, Disengage 1 and neither old immunity. Graceful Retreat instead gives Disengage 2
from the one-square base in `feature/common/move-actions/disengage.md`.

Dwarf Mountain Fury with Grounded/Spark has Stamina 30 + 6 = 36, recovery 12, winded 18 and
stability 3. Without Spark, health stays 30/10/15; Stand Tough leaves Might/strong potency 2.
The no-kit Elementalist Spark witness has Stamina 18 + 6 = 24, winded 12 and stability 1;
its Wodewalker recovery is floor(24/3) + 2 = 10 (`complication/wodewalker.md`). Human Staying
Power increases the existing class recovery counts from 8 to 10 or 10 to 12 while leaving
Stamina/healing unchanged. These independently calculated ancestry deltas agree with the tests
and slice tables; health formulas come from `rule/health/recoveries.md` and `rule/health/winded.md`.

Focused cases have distinct value: newly legal options and skill grants, manual-versus-permanent
effects, exact budget boundaries without refused-benefit leakage, and removal of stale grants
after parent edits. Source review does not substitute for persisted live readbacks or authentic
per-option Forge comparisons, and no missing reference case is marked passed here.
