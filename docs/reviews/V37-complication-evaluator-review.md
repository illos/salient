# V37 background content and complication consumer review

Date: 2026-09-17. Status: **static source review passed for the independent scope below;
remote verification and an independent review of the choice-origin implementation remain required.**

This reviewer authored the complication ledger, catalog, embedded ability content and later the
choice-origin implementation. None of those files is self-certified by this review. The independent
scope is `shared/content/supporting-backgrounds.ts` and the lead-authored supporting-benefit,
supporting-choice, skill/language and ability consumers in `shared/evaluate/character.ts`.
The background researcher separately reviews those consumers and the lead reviews complication data.

Rules authority is Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Forge `5a846aadb623a9855a023e9403bb887a956c341f` is comparison evidence only.
No tests, builds or dependency installations were executed locally. CT114 execution belongs to the
lead; a remotely reported test result is distinguished from a test run by this reviewer.

## Independent background content findings

- All 18 core career records were compared with their pinned source benefits: fixed skills,
  discretionary skill groups/counts, initial language counts, perk categories, Renown, Wealth and
  project points. No discrepancy remains in those constants. Fixed skills retain grant identity;
  a discretionary pick does not become an unrestricted replacement merely because it collides.
- All 47 core perk source bodies were read. None supplies an unconditional numeric increase to
  permanent hero statistics. Conditional Renown treatment from Specialist, Stamina expenditures
  from Brawny/Lucky Dog and companion statistics from Familiar must not alter those baselines.
  The background module correctly keeps these source effects readable rather than inventing
  permanent numeric grants.
- Area of Expertise and Specialist require an already owned crafting/lore target. Their children
  select a target, not a new skill. The consumer records the selection without adding a duplicate
  skill. Source paths are `perk/area-of-expertise.md` and `perk/specialist.md` under `en/unified/md/`.
- Linguist requires two **new** languages with prior regular exposure. The new owned-language
  exclusion enforces “new”; the visible note preserves the exposure prerequisite. Deferral preserves
  an unfilled entitlement rather than granting an unnamed language. Later immersion/research
  benefits remain gameplay procedures. Source: `en/unified/md/perk/linguist.md`.
- Eidetic Memory's optional configuration records an unowned lore skill for the current respite.
  It is not required to invent a previous respite during creation, and it is not included as permanent
  knowledge. Source: `en/unified/md/perk/eidetic-memory.md`.
- The core language catalog includes the printed dead-language table. Q-R-102's old v0.01 support
  fence is not an independent source rule against this authorized expansion. The restricted dead
  pool in Ivory Tower and common pool in Exile remain distinct from the general language catalog.
- Inciting incidents remain narrative choices/custom text, without speculative mechanical grants.
  The module has all six incidents for each career, including Sailor's irregular extracted table.

The lead reported all 46 new background tests passing in the first CT114 run. That result does not
replace the source review above or imply that later integration changes were already tested.

## Consumer findings and fixes inspected

1. **Mundane immunity expression.** The original `amountOf` omitted `level`, silently dropping
   corruption, holy and psychic immunity. The inspected code now recognizes `value === 'level'`.
   Source: `en/unified/md/complication/mundane.md`.
2. **Infernal Contract … But, Like, Bad choice.** The original consumer did not apply the selected
   benefit. The inspected code now maps only the selected Renown, Wealth or Stamina option and
   recalculates recovery/winded values when Stamina changes. It does not grant all three benefits.
   Source: `en/unified/md/complication/infernal-contract-but-like-bad.md`.
3. **Recovery derivation order.** Permanent Stamina changes are applied before floor(Stamina/3).
   Wodewalker's highest-characteristic addition is applied afterward. Permanent immunity/weakness
   magnitudes are displayed; a conditional Victory/form/possession effect does not automatically
   activate during build evaluation.
4. **Removed knowledge.** The inspected positive-grant resolver now subtracts actual source-valid
   skill/language removals for owned-target eligibility. Ivory Tower's lost skill cannot continue
   satisfying Area of Expertise/Specialist. Removal pickers intentionally retain the pre-removal
   view so their saved selection remains authorable. Shared Spirit differs: its three original
   skills remain owned but conditional, rather than being permanently forgotten.
5. **Footsteps cost.** The lead's consumer now uses `Math.max(1, cost + adjustment)`, applies the
   discount only to a known granted ability, and records `costAdjustments` separately from its raw
   source text. The source explicitly gives minimum 1. The catalog's future reference does not
   itself grant an ability. Source: `en/unified/md/complication/following-in-the-footsteps.md`.
6. **Items and initial rewards.** The consumer keeps absent Artifact Bonded, broken Shattered Legacy
   and pending private Strange Inheritance as distinct display states. Selecting an item identity
   is not an instruction to restore/activate it. Starting career/complication rewards remain build
   values; this review does not certify their live-state activation or private Director persistence.

No additional blocking discrepancy was found in this independent static scope after those changes.
The persisted Footsteps test and broader integration run must still pass remotely.

## Footsteps research handed to the origin implementer/reviewer

The complication asks for a higher-level heroic ability the hero can learn. It is a choice at the
time the complication is configured; learning the chosen ability later is the benefit's trigger.
Requiring it to remain above the hero's current level would invalidate that trigger. The supported
solution preserves server-owned original selection level across unchanged revision references;
changing the reference establishes a new current-level choice. A newly created level-two hero must
not silently be treated as if the choice had been made at level one.

The pinned clean Heroes class chapters establish these Fury restrictions:

| Level | Berserker | Reaver | Stormwight |
| --- | --- | --- | --- |
| 2 | Special Delivery; Wrecking Ball | Death… Death!; Phalanx-Breaker | Apex Predator; Visceral Roar |
| 6 | Avalanche Impact; Force of Storms | Death Strike; Seek and Destroy | Pounce; Riders on the Storm |
| 9 | Death Comes for You All!; Primordial Vortex | Primordial Bane; Shower of Blood | Death Rattle; Deluge |

Fury levels 1, 3, 5 and 8 are shared heroic pools. Elementalist heroic pools at levels 1, 2, 3, 5,
6, 8 and 9 are shared across elemental specializations: ability element keywords are not a
specialization eligibility restriction. An earlier-level option offered again at a later grant
retains its earlier minimum level; it does not become a new “future” option solely because a later
feature offers it again. The exported `COMPLICATION_FUTURE_ABILITY_ELIGIBILITY` records 70 exact
source paths across the two supported classes, including 18 Fury aspect requirements and their
class-grant evidence. An independent reviewer must verify the implementation consuming this export.

## Later coverage note

Grounded grants Motivate Earth; if already known, its source changes that ability to ranged 5.
The currently supported Elementalist specialization does not supply that duplicate. When Earth
specialization becomes selectable, merge the provenance and display the altered range instead of
appending an identical second ability. This is an explicit source dependency, not permission to
silently stack duplicate abilities or to rewrite the source body.
