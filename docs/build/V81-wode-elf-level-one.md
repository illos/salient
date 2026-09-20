# V81 — Wode Elf level one

Status: implemented in [V82](V82-remaining-ancestries.md); focused/full checks, independent reviews, hosted API proof and Forge acceptance pass. Main/shared-app delivery is tracked in V82.
Branch: `slice/V81`. Owned files: `shared/content/ancestries/wode-elf/`,
`shared/evaluate/ancestries/wode-elf.ts`, and `tests/character-v81-wode-elf.test.ts`.

## Rules and behavior

Authority: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/ancestry/wode-elf.md`, `feature/trait/wode-elf/`, and
`feature/ability/wode-elf/the-wode-defends.md`.

Size 1M, speed 5, stability 0 before kit bonuses. Wode Elf Glamor is automatic.
Three ancestry points buy all six source options. Swift sets ancestry speed to 6;
Otherworldly Grace sets the saving throw success threshold to 5. The Wode Defends
retains its purchased trait and grants the sourced main action through the ordinary
ability pipeline. Its power roll, targets and outcomes remain sourced manual effects.

Trait/action audit: Wode Elf Glamor modifies hide/sneak/search tests; Forest Walk
modifies shifting through difficult terrain; Otherworldly Grace modifies saving
throws; Quick and Brutal modifies critical-hit action economy; Revisit Memory
modifies lore-recall tests; Swift modifies speed. None grants a separately activated
action. The Wode Defends grants its named signature main action. No additional
runtime choice or persisted play state is required by these traits.

## Witnesses and gates

| Witness | Purchases | Coverage |
| --- | --- | --- |
| WE1 | Swift; Otherworldly Grace | Quick build, speed and saving throws; Fury and Elementalist |
| WE2 | The Wode Defends; Forest Walk | Structured ability plus readable movement rule |
| WE3 | Forest Walk; Quick and Brutal; Revisit Memory | Remaining manual traits |

Focused tests catch missing baseline effects, description-only action grants,
invalid-budget grant leakage, and stale ancestry grants on replacement. Root owns
shared registration/content ingestion, authenticated save/readback journeys,
Forge counterpart generation/comparison and full checks on the selected environment.
No browser testing under the moratorium. Candidate is not complete until these gates
and independent implementation then rules review pass. No tests were run by the
unit implementer; root runs the integrated candidate.

Integration hooks: append `levelOneDecisions`, enable `Wode Elf`, invoke
`applyWodeElfBaseline` after class/kit vitals and before complication modifiers.
The normal `ancestry-ability` option grant supplies The Wode Defends. The empty
`wodeElfAbilities` export documents that no additional prose action is needed.
