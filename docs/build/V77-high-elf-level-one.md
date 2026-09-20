# V77: High Elf level one

Status: complete and merged/live as `1fa8aac` through [V82](V82-remaining-ancestries.md); focused/full checks, independent reviews, hosted API proof and Forge acceptance pass. Hosted and shared-main API acceptance pass.

## Scope and source

Complete wizard choices, three-point purchase budget, permanent baseline, retained traits and granted actions. Pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, `en/unified/md/ancestry/high-elf.md` and `en/unified/md/feature/trait/high-elf/`; Dragon Knight structured actions also use `feature/ability/dragon-knight/`. Default size 1M, speed 5, stability 0 come from the clean Heroes ancestry chapter. Conditional gameplay effects remain readable/manual.

| Trait | Character contribution / granted action |
| --- | --- |
| High Elf Glamor | Passive Flirt/Persuade Presence-test edge; no action. |
| Glamor of Terror | Triggered action after taking creature damage; manual frightened effect. |
| Graceful Retreat | +1 Disengage distance, existing action modifier. |
| High Senses | Passive threat-noticing test edge. |
| Otherworldly Grace | Saving throw success threshold 5. |
| Revisit Memory | Passive lore-recall test edge. |
| Unstoppable Mind | Permanent dazed immunity. |

Witness map: Unstoppable Mind + Graceful Retreat; Otherworldly Grace + High Senses; Otherworldly Grace + Revisit Memory; Glamor of Terror + High Senses. These legal three-point builds cover every purchase and the signature. No separate play-state choice is required.

## Ownership and acceptance

Own `shared/content/ancestries/high-elf/`, `shared/evaluate/ancestries/high-elf.ts`, `tests/character-v77-high-elf.test.ts` and this spec. Lead owns support/definition imports, evaluator hook integration, ability catalog aggregation, content ingestion, runtime and reference runner. Tests target missing actions, incorrect permanent values, illegal budgets and stale nested grants after replacement; no implementation-mirroring test count goal.

Before completion: focused and project checks, saved public API create/save/readback per witness, calibrated Forge comparison, source/rules and implementation reviews. Verify replacement preserves unrelated choices/live state. Browser moratorium remains in effect.
