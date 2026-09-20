# V76: Dragon Knight level one

Status: implemented in [V82](V82-remaining-ancestries.md); focused/full checks, independent reviews and hosted API proof pass. Forge live comparison and main delivery pending.

## Scope and source

Complete wizard choices, three-point purchase budget, permanent baseline, retained traits and granted actions. Pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, `en/unified/md/ancestry/dragon-knight.md` and `en/unified/md/feature/trait/dragon-knight/`; Dragon Knight structured actions also use `feature/ability/dragon-knight/`. Default size 1M, speed 5, stability 0 come from the clean Heroes ancestry chapter. Conditional gameplay effects remain readable/manual.

| Trait | Character contribution / granted action |
| --- | --- |
| Wyrmplate | Initial choice of six damage immunities, level-valued; readable respite-change rule. |
| Draconian Guard | Triggered action when self/adjacent creature takes strike damage; manual reduction by level. |
| Draconian Pride | Structured signature main action; normal ancestry ability grant. |
| Dragon Breath | Structured signature main action; per-use damage choice stays in ability text. |
| Prismatic Scales | Additional permanent choice from the six types; same-type immunity does not stack. |
| Remember Your Oath | Maneuver; manual 4+ saving throws through start of next turn. |
| Wings | Conditional flight duration/weakness; modifies movement, no new discrete action. |

Witness map: Dragon Breath + Scales with six Wyrmplate types (cycle Scales across the same six types); Pride + Guard; Wings + Oath. Include same-type Wyrmplate/Scales and pruning a removed Scales purchase. Neither source requires the two immunity types to differ. Full effect execution and respite automation remain outside wizard scope.

## Ownership and acceptance

Own `shared/content/ancestries/dragon-knight/`, `shared/evaluate/ancestries/dragon-knight.ts`, `tests/character-v76-dragon-knight.test.ts` and this spec. Lead owns support/definition imports, evaluator hook integration, ability catalog aggregation, content ingestion, runtime and reference runner. Tests target missing actions, incorrect permanent values, illegal budgets and stale nested grants after replacement; no implementation-mirroring test count goal.

Before completion: focused and project checks, saved public API create/save/readback per witness, calibrated Forge comparison, source/rules and implementation reviews. Verify replacement preserves unrelated choices/live state. Browser moratorium remains in effect.
