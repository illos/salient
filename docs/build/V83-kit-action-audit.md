# V83 ordinary kit action audit

Fresh source audit, 2026-09-20. Application baseline `42211f5`; Compendium pin
`fb83a789da8f0327a389c277a0c790b1648d5810`. Read all 21 ordinary kit entries,
their complete embedded signatures and `en/unified/md/chapter/kits.md` from the
canonical pinned checkout. No browser, services or verification tests were run for this audit.
The owning implementation and acceptance record is [V83](V83-supporting-actions.md).

## Finding

All 21 ordinary signatures already have evaluator grants and a table CLI/API route.
No ordinary kit contains an additional separately activated action beyond its signature.
Their additional movement, conditional damage and other effects belong to that action;
they must remain readable and must not become invented extra abilities.

There is one confirmed projection defect across all 21: `characters.sheet` assigns kit
signatures empty metadata and `group: other`, despite every source specifying a main
action. The character sheet therefore places them in the wrong action group. The table
`abilities.sheet` already extracts action type, keywords, distance, targets, roll, tiers and
effects. V83 should share the extraction and prove both projections from persisted builds.

## Source ledger

Paths below are relative to `vendor/steel-compendium/en/unified/md/kit/`.
Every row is a **Main action** with an existing `kit-signature` grant, sourced from its kit
entry and marked `kitBonusesIncluded: true`. “Recorded” means the current table resolver
preserves the printed multi-characteristic roll but leaves resolution manual; it is not
a missing action. “Rolled” describes the existing legacy route, not full effect automation.

| Kit / source file | Granted signature | Existing table route | Additional effect retained with the signature |
| --- | --- | --- | --- |
| Arcane Archer / `arcane-archer.md` | Exploding Arrow | Recorded | Fire damage to nearby secondary target |
| Battlemind / `battlemind.md` | Unmooring | Recorded | Increased forced movement until target's next turn ends |
| Cloak and Dagger / `cloak-and-dagger.md` | Fade | Rolled | Tier-dependent shift |
| Dual Wielder / `dual-wielder.md` | Double Strike | Rolled | Two targets; optional intervening maneuver/move using the same roll |
| Guisarmier / `guisarmier.md` | Forward Thrust, Backward Smash | Rolled | Two targets |
| Martial Artist / `martial-artist.md` | Battle Grace | Rolled | Tier-dependent swap; extra damage if size prevents swap |
| Mountain / `mountain.md` | Pain for Pain | Rolled | Conditional damage against an enemy who damaged you |
| Panther / `panther.md` | Devastating Rush | Rolled | Optional straight movement before strike and associated extra damage |
| Pugilist / `pugilist.md` | Let's Dance | Rolled | Tier-dependent slide and optional follow-up shift |
| Raider / `raider.md` | Raider's Awe | Rolled | Bane on target's next power roll within its duration |
| Ranger / `ranger.md` | Hamstring Shot | Rolled | Potency-gated slowed, save ends |
| Rapid-Fire / `rapid-fire.md` | Two Shot | Rolled | Two targets |
| Retiarius / `retiarius.md` | Net and Stab | Rolled | Potency-gated slowed/restrained, EoT |
| Shining Armor / `shining-armor.md` | Protective Attack | Rolled | Taunted until target's next turn ends |
| Sniper / `sniper.md` | Patient Shot | Rolled | Extra damage conditional on not taking a move action |
| Spellsword / `spellsword.md` | Leaping Lightning | Recorded | Lightning damage to nearby secondary target |
| Stick and Robe / `stick-and-robe.md` | Where I Want You | Rolled | Tier-dependent slide |
| Swashbuckler / `swashbuckler.md` | Fancy Footwork | Rolled | Tier-dependent push and optional follow-up shift |
| Sword and Board / `sword-and-board.md` | Shield Bash | Rolled | Tier-dependent push; tier-three potency-gated prone |
| Warrior Priest / `warrior-priest.md` | Weakening Brand | Recorded | Damage weakness until target's next turn ends |
| Whirlwind / `whirlwind.md` | Extension of My Arm | Rolled | Tier-dependent vertical pull |

## Implementation trace and existing proof

- `shared/content/supporting-backgrounds.ts` composes automatic kit contribution decisions;
  `shared/evaluate/character.ts` emits the selected kit's signature and provenance.
- `shared/content/supporting-kits.ts` records the names and source paths; generated
  `shared/content/compendium/kit.json` preserves the actual signature sections.
- `convex/characters.ts` → `abilityView` is the incorrect metadata/group projection.
  `web/character-sheet/index.tsx` groups these projected entries directly.
  `shared/presentation/ability.ts` still extracts the complete embedded source for the card.
- `convex/lib/resolve.ts` → `abilitiesFor` / `abilityFromKit` extracts the selected signature
  for `abilities.sheet` and `/ability use`. Its `rollEntry` accepts single names or names
  separated by “or”; comma-separated choices remain a recorded manual route.
- `tests/supporting-backgrounds.test.ts` has all-21 baseline checks and source-path grant
  checks, ordinary/Stormwight eligibility checks, and numeric source citations. Its signature
  existence assertion uses the implementation's source-path mapping; it does not independently
  prove each printed signature name, persisted metadata, revocation or table use.
- `tests/app/abilities.test.ts` proves admitted Mountain/Pain for Pain execution, no doubled
  kit damage, source remainder and persisted target damage. Grammar/compiler tests also cover
  Mountain, but do not establish public-route acceptance for all kits.
- `scripts/headless/character-scenarios.ts` saves a transition to Panther and proves saved
  selections/authored fields. It does not assert the resulting signature or stale-grant removal.

## Bounded missing proof

1. Save/reload all 21 choices through the supported API; assert source-derived signature names,
   main grouping, metadata and matching table visibility. This catches sheet/table divergence,
   missed source-section extraction and a correct evaluator masked by stale persisted projection.
2. Replace a kit and prove its old signature is unavailable through both sheet and table routes;
   keep a no-kit class negative case. This catches stale grants independent of option coverage.
3. Preserve one rolled-kit use witness and add a comma-choice recorded-kit use witness with
   retained roll/tiers/effect text and persisted use. No new roll-expression automation is needed.

These are proposed acceptance cases, not passes recorded by this audit. Reuse existing Mountain
execution coverage when it proves unchanged behavior; do not duplicate its damage assertions.

## Class and gameplay boundaries

The four Stormwight catalog entries are Boren → Bear Claws, Corven → Wing Buffet,
Raden → Driving Pounce and Vuken → Unbalancing Attack. Their bonuses live under the Fury
feature sources and selection depends on Stormwight class support. They remain excluded from
the ordinary kit selector and this implementation scope; catalog presence is not completion.

The kits chapter also permits kit replacement as a respite activity and forbids improvised
weapons with kit weapon abilities. Its **optional** Losing Equipment rule can suppress a
Retiarius signature when the ensnaring weapon is not wielded. This audit does not claim
equipment-state enforcement, respite automation or full conditional effect execution. Those
gameplay rules do not add another wizard-granted action and should not expand this bounded
metadata/persistence correction into equipment-state or combat engine development.

## Shared extraction candidate

`shared/resolve/embeddedAbility.ts` now extracts an exact named kit or blockquoted perk
section and its printed fields, returning an explicit failure for a missing section/header.
It preserves full multiline effects, including all Arcane Trick options, without adding
effect execution. Integration into character/table projections remains owned by the V83 lead.

Local focused verification at this candidate (working tree based on `42211f5`):
`pnpm exec vitest run --project engine tests/embedded-ability.test.ts` passed 3 cases in
163 ms. They cover comma-choice kit metadata, quoted perk action types/multiline effects,
and strict missing/neighboring source boundaries. No app target, services or browser was used.
This focused parser proof does not close the persisted public API acceptance cases above.
