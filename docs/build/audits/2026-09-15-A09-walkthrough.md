# A09 connected backend acceptance — 2026-09-15

Research recorded before adding the connected test. Scope: one fresh `convex-test` backend, actual
campaign membership and hero admission APIs, registered table operations, persisted reads and
command retries. Auth uses the existing Better Auth test adapter. This is backend acceptance;
it does not claim a live `pnpm app` process, browser reconnect, visual or performance coverage.

## Existing answers and rules evidence

The owning [Required checklist](../../pre-alpha-design-gaps.md#v001-combat-acceptance-checklist)
and [walkthrough](../../v001-basic-play-walkthrough.md) already answer these cases. No new question
or interpretation is needed. Use the repaired R02/R03 admitted baseline (Stamina 30, Recoveries 10,
recovery value 10, Might 2, Ferocity 0). Class grants stay manual. Condition toggles have no automatic
saves or expiry (Q-TS-1); ordinary saves are public dice followed by a separate toggle.

Pinned source revision: `fb83a789da8f0327a389c277a0c790b1648d5810`; all source paths below are under
`vendor/steel-compendium/en/unified/md/`. No online rules sources were consulted.

| Case | Source and independently calculated expectation |
| --- | --- |
| Free strike and correction | `feature/ability/common/melee-weapon-free-strike.md`; R04 §10.10. Dice 8 + 2, Might 2: total 12, tier 2, damage 5 + 2 = 7; Goblin 15 → 8. One bane: total 10, tier 1, damage 2 + 2 = 4; Goblin restored to 11. Undo/Redo restore those recorded outcomes without new dice. |
| Thunder Roar | `feature/ability/fury/level-1/thunder-roar.md`, `kit/mountain.md`; R04 §10.6/10.11. Cost 5; Ferocity 0 blocks without rolling. A recorded Director adjustment to 6 makes the cost payable, leaving 1. Dice 7 + 6 with Might 2 and per-target counts (1 edge, 2 banes, none) yield tiers 3/1/2 and damage 17/6/9. From the prior corrected foe at 11 and two fresh foes at 15, resulting Stamina is −6/9/6. Push clauses remain manual source text. |
| Temporary Stamina and healing | `rule/monster/creature-free-strike.md`, `monster/goblin/statblock/goblin-warrior.md`, `rule/health/temporary-stamina.md`, `feature/common/maneuvers/catch-breath.md`; R04 §10.9/10.14. Goblin free strike deals 1 without dice: hero temporary pool 3 → 2, Stamina 20 unchanged. Catch Breath spends one Recovery and restores 10 ordinary Stamina to 30, leaving temporary Stamina 2. |
| Malice and clock | `rule/monster/malice.md`; R05 (`conditions-and-clock.md`) §5. One hero with no Victories: combat-start 0, round 1 gain 1 + 1 = 2. After the explicitly awarded Victory, the next combat gains 1 and round 1 adds 2. A pool retained by Void keep remains: the later combat adds those 3 to the retained 13, yielding 16. Normal end clears Malice. |
| Common manual benefits | `feature/common/main-actions/defend.md` and `feature/common/maneuvers/aid-attack.md`: record a main action and a maneuver, respectively, with source text; benefits stay manual under the existing walkthrough scope. |
| Save | `rule/general/saving-throw.md`: ordinary d10 succeeds on 6 or higher. The test records a disclosed 6 through ordinary dice, then separately removes the manual condition. |
| Closeout | `rule/resource/surge.md` and `rule/health/temporary-stamina.md` clear remaining surges and temporary Stamina. Existing formal-closeout spec requires explicit Director Victory award once; remaining ordinary Stamina/conditions/resources persist. Defeated foes are removed; the archive cannot be rewound or corrected. |
| Void | Existing `table-spec.md#voiding-an-encounter` controls keep/reset, including while paused. It is a product decision, not a source-derived automatic reward/cleanup. Preserve the paused roster lock; reset restores the starting snapshot and removes later foes, while keep retains current state. |

## Verification

Implemented in `tests/app/v001-walkthrough.test.ts`. Focused run passed: one connected test,
2.10 seconds test time (`pnpm exec vitest run --project app tests/app/v001-walkthrough.test.ts`).
Focused ESLint and Prettier checks passed; TypeScript passed (`pnpm exec tsc -p tsconfig.web.json --noEmit`); repository link check passed (147 Markdown files).

The path uses one fresh backend throughout: campaign/membership/admission → setup cancellation →
committed combat → blocked/retried costed action → manual resource adjustment → real free strike →
player correction Undo/Redo with unchanged persisted dice and original event → multi-target cost and
damage journal → manual source resolution → condition/save/toggle → creature free strike into
actual temporary Stamina → Catch Breath → Aid Attack/Defend with advisory allowances → turn boundaries
→ explicit once-only Victory/cleanup/archive → session close/start → FreePlay Recovery → paused
Void keep → resume → another combat → paused Void reset. Every gameplay change uses the app APIs;
only server-dice positioning and content/auth setup use test facilities.

The first run exposed a mistaken test expectation, not an implementation defect: after Void keep
retains Malice 13, a subsequent combat adds its sourced grants (1 + 2), yielding 16. The final test
now checks that continuity explicitly. Reset uses different changed Stamina/surge/temporary values
from its starting snapshot, and removes an actually added catalog foe, so it cannot pass as a no-op.

This test complements the detailed A02–A07 suites rather than replacing their individual Required-cell
coverage. Critical-hit opportunity, target-draft firing, direct-test arithmetic, regrouping, detailed
negative authorization and audience cases remain mapped to their focused suites by the parent audit.
The browser/live CLI/performance evidence is separate. Independent implementation and rules review
remain required before A09 is certified.
