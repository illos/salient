# V26 real-app baseline playtest — 2026-09-16

**Result: baseline checks passed for all ten abilities; V26 implementation acceptance remains blocked.**
The app currently applies supported damage/costs and retains manual clauses. It does not yet compile
V26 effects or calculate the designed push allowances. These screenshots document observed behavior,
not completion of the [V26 design cases](../../../V26-ability-designs.md).

## Provenance and method

- Runtime code: `f019e3a5b70766bcbff43dd718d6c5c1753267d6`, including integrated V25 character evaluation.
  Main advanced during the work; this is not verification of subsequent main/runtime changes.
- Compendium: `fb83a789da8f0327a389c277a0c790b1648d5810`; authenticated content status confirms 467 entries.
  The design appendix links each ability and all supporting rules directly to this pinned local source.
- Isolated frontend `http://127.0.0.1:5184`; task-owned anonymous local Convex API `3234`, site `3235`.
  Shared playable data/backend were untouched. Vite file watching was disabled for the successful run
  because writing evidence caused page reloads in earlier attempts.
- Executed [browser runner](../../../../../tests/browser/v26-baseline.spec.ts), SHA-256
  `de8a8fdb6bb6f258e8e6989a77d70aeb3d14d8b605dad0e71ed64112af1722a2`.
  `SALIENT_V26_BASELINE=1 SALIENT_TEST_URL=http://127.0.0.1:5184 pnpm exec playwright test tests/browser/v26-baseline.spec.ts --output .playtest/v26/browser-results-3 --reporter=line`
  completed **1 passed (2.8 minutes)**, with no captured page errors.
- Disposable Director/player accounts, real campaign/session and approved Fury/Elementalist builds.
  Account/campaign/session controls ran through the UI; character setup used authenticated public
  create/save/submit/approve operations with existing fixtures, not direct build/grant injection.
- Ability commands, corrections, manual dispositions and rewind/redo ran through rendered UI controls.
  Before each rolled case, an explicitly disclosed deterministic seed replaced **only `diceStates`**
  on this disposable backend. The real operation generated the accepted dice, results and journal.
  No ability result, event, damage or journal row was fabricated.
- [Readback](readback.json) records campaign/actor/event IDs, source content, actual dice, before/after
  rosters, results and encounter state. Screenshots show actual log rows and the app's source dialogs.
  Thunder Roar has an additional 1600×2200 capture after signing back into the same saved session;
  this exposes the full entry that the original viewport partially covered with its sticky header.
  Correction controls differ because later gameplay has advanced the eligible history window.
  Case names map to the design appendix; they do not imply every assertion in that design case passed.

## Observed results and screenshot pairs

H is the Mountain Fury (Might/Agility 2, Stamina 30); E is the Bethell Elementalist (Reason 2).
Each target Goblin begins at 15 Stamina unless the row is a correction continuation.
Damage shown below is observed applied damage and was checked against persisted Stamina.

| Ability / case | Observed result | Game log | In-app source | V26 status |
| --- | --- | --- | --- | --- |
| Brutal Slam / BS2 | 7+7+2=16, tier 2, damage 8; Goblin 15→7. Manual `push 2`. | [Log](BS2-log.png) | [Source](BS2-source.png) | Missing compiled occurrence and push 2+1=3 calculation. |
| Brutal Slam / BS3 | 8+7+2=17, tier 3, damage 9+2+4=15; Goblin 15→0, Slain. Manual `push 4`. | [Log](BS3-log.png) | [Source](BS3-source.png) | Missing calculated allowance 5 after lethal damage. |
| Spear Charge / SC2 | 7+7+2=16, tier 2, damage 4; H 30→26. | [Log](SC2-log.png) | [Source](SC2-source.png) | Correct legacy damage; compiled format absent. |
| Bury the Point / BP2 | Tier 2, damage 6; H 30→24; Malice 2→0. Bleeding clause stays manual; condition unchanged. | [Log](BP2-log.png) | [Source](BP2-source.png) | Missing compiled post-damage occurrence. |
| Melee Weapon Free Strike / MF3 | Agility roll, Might damage: tier 3, 7+2+4=13; Goblin 15→2. | [Log](MF3-log.png) | [Source](MF3-source.png) | Correct legacy damage; compiled format absent. |
| Ranged Weapon Free Strike / RF3 | Might roll, Agility damage: tier 3, 6+2=8; Goblin 15→7. | [Log](RF3-log.png) | [Source](RF3-source.png) | Correct legacy damage; compiled format absent. |
| Pain for Pain / PP3 | Tier 3, 13+2=15; untouched second Goblin 15→0. No duplicate kit bonus; conditional rider remains manual. | [Log](PP3-log.png) | [Source](PP3-source.png) | Compatibility baseline only. |
| Out of the Way! / OW2 | Tier 2, 5+2=7; Goblin 15→8; Ferocity 3→0. Slide and following-movement rider manual. | [Log](OW2-log.png) | [Source](OW2-source.png) | Compatibility baseline only. |
| Thunder Roar / TR1 | Shared dice 7+6; per-target tiers 3/1/2, damage 17/6/9; Goblins −2/9/6; Ferocity 6→1 once. Push/order manual. | [Expanded log](TR1-expanded-log.png) | [Source](TR1-source.png) | Compatibility baseline only. |
| Lines of Force / LF1 | Manual `ability.recorded`; unsupported Triggered action warning; no roll, result row, damage or resource change. | [Log](LF1-log.png) | [Source](LF1-source.png) | Existing limitation preserved, not trigger automation. |
| Viscous Fire / VF2 | Tier 2; fire damage 5+2+1+1=9; Goblin 15→6. Build bonuses are Enchantment of Destruction and Acolyte of Fire. Manual `push 3`. | [Log](VF2-log.png) | [Source](VF2-source.png) | Missing compiled fire/push occurrences and calculated instruction. |

## Corrections, costs and history

- **BS7 exposed a limitation:** after the first inline Add bane, saved `mayCorrect` becomes false
  and another inline correction is unavailable. [One-bane screenshot](BS7-one-bane-log.png).
  We rewound that correction, then submitted two banes at once through the UI command field.
  The same 7+7 dice yielded tier 1 and damage 5, restoring Goblin Stamina from 7 to 10.
  [Effective correction](BS7-log.png); [after rewind/redo](BS7-restored-log.png).
  The original historical event description still says 8 damage; the effective result card shows 5.
  The designed consecutive one-bane→two-bane workflow and calculated push correction did **not** pass.
- **BS8:** clicking Resolved at table created one manual disposition and left Stamina 7.
  Rewind removed that disposition; redo restored one disposition with Stamina still 7.
  [Disposition](BS8-disposition-log.png). This proves the legacy disposition path, not V26 occurrence IDs.
- **BP5:** marking the bleeding clause resolved persisted a disposition.
  [Screenshot](BP5-log.png). Saved H Stamina remains 24, Malice 0, and bleeding remains false;
  the click records table handling and does not automatically inflict the condition.
- **BP4:** with Malice 1, Bury the Point was blocked before a roll/cost/result. Roster, encounter and
  result list remained identical. [Blocked log](BP4-log.png), [source](BP4-source.png).
- Final reload retained state: [table screenshot](table-after-reload.png), `reload` readback record.
  Authenticated player roster readback is included; this is not a complete privacy regression suite.

## Scope limits and next work

This was a baseline probe of real UI resolution, **not a complete legal-turn playthrough**. The runner
reused one encounter/hero turn and restored health/resources with logged Director adjustments between
cases. Repeated main actions and off-turn foe/Elementalist actions therefore display the app's existing
warnings. Paid cases did not all satisfy the design's correct-actor-turn setup. Placement, range, lines,
actual forced movement, trigger fulfillment, condition saves and table decisions were not simulated.
The two free-strike roll/damage choices both have value 2; this confirms selected fields, not unequal
characteristic arithmetic. Exact source text and saved inputs remain available in the evidence.

All eleven V26 implementation acceptance checks remain pending. Compile-only Meteoric Introduction,
Ray of Agonizing Self-Reflection and Spinecleaver Axe were not played. Compiler diagnostics, source
mutation, legacy/new-format isolation and all unlisted tiers/edge cases remain untested here.

Next implementation work is the specified shared compiler/runtime boundary, typed damage/push results
and source-linked push arithmetic. Then rerun the complete designed cases with legal turn setup,
including consecutive correction behavior and occurrence-addressed disposition/history proof.

## Verification

The successful browser run and screenshot/readback inspection establish the baseline results above.
[Full repository check output](check-output.txt) records 432 passing tests and a successful build.
The opt-in runner was also invoked without its flag: 1 skipped, confirming ordinary browser runs
do not create this fixture or replace dice state. Documentation links were checked again after the report/review edits.
Repository checks and independent evidence review are recorded in the owning slice work log and
[baseline review](../../../reviews/V26-baseline-playtest-review.md).
