# V26 prerequisites: consecutive corrections and proper-turn playtests

**The correction and turn-setup prerequisites are verified. V26's compiler/push implementation remains pending.**
This run supersedes the correction limitation and turn-setup gap in the
[historical baseline](../baseline-2026-09-16/README.md), which remains intact as before-fix evidence.

## What changed

The effective ability roll now stays correctable through an uninterrupted chain of corrections
linked to that same roll. Each correction retains its own attribution and undo unit. The player
can click Add bane twice; a Director correction still closes the player's window. Another action,
turn change or manual disposition must be rewound before more correction. The Director can mark
manual clauses after a correction, and that disposition then closes the correction window.

The browser runner now ends turns and takes eligible entries in the actual side/group sequence.
Every tested main action gets a fresh turn for its actor. Health/resource setup remains explicitly
logged; the runner restores declared balances after round-boundary grants. No turn, allowance,
accepted result or damage row is injected. The UI command helper also waits for the submitting
client's success acknowledgment before the next command.

## Source and execution identity

- Designs and pinned local sources: [V26 ability appendix](../../../V26-ability-designs.md).
  Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, 467 seeded entries.
- Runtime revision: `f69843b` (based on integrated main `f7137dc` plus historical evidence).
  The one changed application file is `convex/lib/history.ts`; its exact SHA-256 is
  `runtimeHistorySha256` in [readback.json](readback.json). The independently reviewed runner's
  SHA-256 identifies its later built-app authentication adapter separately.
- Isolated anonymous backend API 3234/site 3235, built-app preview on frontend 5184. The production
  frontend was built by the successful full check; its source matches the tested revision. Backend
  push completed before the successful run. No shared runtime or saved play data changed.
- Disposable accounts and real campaign/session/build approval, as in the historical fixture.
  Accepted dice come from normal ability operations after disclosed deterministic `diceStates`
  imports into this task-owned backend. Inputs/results/events/journal are not fabricated.
- Invocation: `SALIENT_V26_BASELINE=1 SALIENT_TEST_URL=http://127.0.0.1:5184 pnpm exec playwright test tests/browser/v26-baseline.spec.ts --output .playtest/v26/corrections-browser-6 --reporter=line`.
  Fresh evidence was written to ignored `.playtest/v26/corrections-evidence`, reviewed, then copied
  here deliberately. Ordinary browser runs skip this opt-in test.

Final browser result: **1 passed in 6.5 minutes**, with no page errors. The saved readback contains
23 records and 240 turn-transition events through round 11; 33 screenshots show source dialogs,
log outputs, correction/history states and the reloaded table. See [browser output](browser-output.txt).
All task-owned services were stopped afterward.

## Consecutive correction proof

| Step | Observed effective result | Screenshot |
| --- | --- | --- |
| Original Brutal Slam | Dice 7+7, Might 2, tier 2, damage 8; Goblin 15→7. | [Original](BS2-log.png) |
| Player clicks Add bane | Same dice, total 14, tier 2, damage 8; Goblin stays 7. Further correction controls remain available. | [One bane](BS7-one-bane-log.png) |
| Player clicks Add bane again | Same dice, double bane gives tier 1, damage 5; Goblin 7→10. Two linked corrections, no intervening rewind. | [Two banes](BS7-log.png) |
| Player Undo | Only second correction reversed; one bane, damage 8, Goblin 7. | [Undo](BS7-undo-log.png) |
| Player Redo | Second correction restored; two banes, damage 5, Goblin 10; no new dice. | [Redo](BS7-restored-log.png) |

The immutable original event description still records the original 8 damage. The effective card
below it shows the corrected outcome; the two are intentionally separate. Printed pushes remain
manual (`push 2` then `push 1`), so this does not prove V26's future calculated push correction.

## All ten abilities: source, log and saved state

| Ability / case | Observed damage and resource result | Log | Source |
| --- | --- | --- | --- |
| Brutal Slam / BS2, BS3 | Tier 2: 8 damage, Goblin 15→7. Tier 3: 15 damage, Goblin 15→0 Slain. | [Tier 2](BS2-log.png), [tier 3](BS3-log.png) | [Source](BS2-source.png) |
| Spear Charge / SC2 | Tier 2: 4 damage, Fury 30→26. Goblin's own turn. | [Log](SC2-log.png) | [Source](SC2-source.png) |
| Bury the Point / BP2 | Tier 2: 6 damage, Fury 30→24; Malice 2→0. Goblin's own turn; bleeding stays manual. | [Log](BP2-log.png) | [Source](BP2-source.png) |
| Melee Weapon Free Strike / MF3 | Tier 3: 7+2+4=13 damage, Goblin 15→2; Agility roll/Might damage. | [Log](MF3-log.png) | [Source](MF3-source.png) |
| Ranged Weapon Free Strike / RF3 | Tier 3: 6+2=8 damage, Goblin 15→7; Might roll/Agility damage. | [Log](RF3-log.png) | [Source](RF3-source.png) |
| Pain for Pain / PP3 | Tier 3: 13+2=15 damage, untouched second Goblin 15→0; no duplicate kit bonus. | [Log](PP3-log.png) | [Source](PP3-source.png) |
| Out of the Way! / OW2 | Tier 2: 7 damage, Goblin 15→8; Ferocity 3→0. | [Log](OW2-log.png) | [Source](OW2-source.png) |
| Thunder Roar / TR1 | Shared 7+6 dice; target tiers 3/1/2, damage 17/6/9, Stamina −2/9/6; Ferocity 6→1 once. | [Log](TR1-log.png) | [Source](TR1-source.png) |
| Lines of Force / LF1 | Manual record with unknown-Triggered warning; no roll/result/resource change. | [Log](LF1-log.png) | [Source](LF1-source.png) |
| Viscous Fire / VF2 | Tier 2: 5+2+1+1=9 fire damage, Goblin 15→6; Elementalist's own turn. | [Log](VF2-log.png) | [Source](VF2-source.png) |

[Readback](readback.json) contains before/after active-turn identity, rosters, results, encounter and
all turn-transition events. No tested ability or turn transition emitted an action/turn-order warning.
Bury the Point at Malice 1 still blocked without roll, cost, result or encounter change
([BP4](BP4-log.png)). Legacy manual disposition/history checks also passed
([BS8](BS8-disposition-log.png), [BP5](BP5-log.png)). Final reload retained state
([table](table-after-reload.png)).

## Verification and limits

- Running the browser test without `SALIENT_V26_BASELINE=1` reports **1 skipped** with all
  services stopped, confirming normal test runs cannot accidentally seed this evidence fixture.
- Focused regression cases failed before the correction-window change and passed afterward. The
  focused ability/history suite passes 38 tests. Tests cover retry, per-target isolation, retained
  dice/costs, original-event immutability, player/Director authority, user-undo setting, manual
  disposition, unrelated corrected rolls, turn changes and sequential restoration.
- Full `VITEST_MAX_WORKERS=1 pnpm check`: **435 tests** (97 engine + 338 app/scripts), lint/types,
  links, source/vendor/foe checks and production build pass. See [check output](check-output.txt).
  After the harness switched from a dev-module import to the installed authentication protocol,
  targeted lint/types passed again; independent review checked cookie expiry/header handling.
- Earlier browser attempts were retained locally: first timed out at login during dependency
  reloads/host load; second reached correction/history and the first three abilities, then the
  backend hit its 1-second execution limit during turn end under heavy memory pressure. A later
  attempt failed fixture token acquisition; another was canceled during startup/push timeouts.
  No timeout or gameplay assertion was weakened. Services were stopped, checks serialized, and
  peer browser work finished before the final runs used a ready backend and built-app preview.
  Run 5 passed through Thunder Roar, then the preview process exited with signal 15 (exit 143),
  causing WebSocket connection refusals during the next fixture reset. It was restarted under a
  monitored terminal session before the final unchanged journey.
- Physical placement, movement/collisions, trigger fulfillment, condition saves and unique manual
  riders remain table responsibilities. Lines of Force still does not automate its trigger or
  allowance. Both free-strike characteristics equal 2, so that fixture verifies selection fields
  but not unequal-value arithmetic. This is proper-turn resolution evidence, not a complete
  source-legal tactical encounter or broad privacy test.
- All eleven V26 compiler acceptance checks remain pending. No compiled definition, typed effect
  occurrence, calculated push allowance or compile-only case was implemented by this patch.

Independent implementation, pinned-source and final evidence review: [prerequisite review](../../../reviews/V26-corrections-review.md).
