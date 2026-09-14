# Two-round exploratory playtest

**Historical (2026-09-10).** Ran an agent-directed CLI simulation on 2026-09-10 with the prepared Fury and Goblin Warrior. Dice and clear-ground positioning were supplied deliberately. This was not a human playtest or a balanced encounter assessment. No runtime code or shared interfaces were changed.

The local saved record and submitted command files are in `.playtest/two-rounds-ub2z47t5/`; `summary.json` contains the observed steps and `run.json` contains full source definitions, requests, outputs, and snapshots. These ignored local artifacts are not part of Git.

| Step | Observed result |
| --- | --- |
| Round 1 start | Manual Malice gain: one hero + round 1 = 2. |
| Warrior uses Spear Charge | Dice 5+5, modifier 2: tier 2, 4 damage. Fury Stamina 30 → 26 and Ferocity 0 → 1. |
| Fury turn begins | Supplied d3 of 1 manually raises Ferocity to 2. |
| Fury uses Brutal Slam | Dice 5+5, Might 2: tier 2, 8 damage. Warrior Stamina 15 → 7. Push up to 3 remains pending; table records clear-ground movement completion. |
| Round 2 start | Manual Malice gain: one hero + round 2 = 3; balance 2 → 5. |
| Warrior returns to melee and uses Bury the Point | Table attests its movement. Dice 8+8, modifier 2: tier 3, 7 damage; Malice 5 → 3. Fury Stamina 26 → 19 and Ferocity 2 → 3. Might 2 is not below potency 2, so no bleeding. |
| Fury turn begins | Supplied d3 of 1 manually raises Ferocity to 4. |
| Fury uses Brutal Slam again | Dice 3+4, Might 2: tier 1 expected. Engine defers the whole action because the first-push surge benefit at Ferocity 4 is unsupported. No damage is prematurely applied. |
| Table completes the action | Records 5 damage, a clear-ground push of 2, and one surge for the first push this turn. Warrior Stamina 7 → 2; Fury surges 0 → 1. Stop before end-turn housekeeping. |

Expected values were checked against the pinned [Fury Ferocity](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md), [Growing Ferocity](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md), [Malice](../vendor/steel-compendium/en/unified/md/rule/monster/malice.md), [Brutal Slam](../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md), [Goblin Warrior](../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md), and [forced movement](../vendor/steel-compendium/en/unified/md/movement/forced-movement.md) text. The goblin's return to melee was included in the later turn note; its eligibility/distance were already supplied with the attack request. This illustrates that ordinary movement is currently an attestation, not its own recorded operation.

Reopening in separate CLI processes, stepping back before manual completion, then forward restored the identical final state. Retrying the final command did not repeat damage or grant another surge; history still contained ten operations.

## Findings for the engine and UI threads

- Four ability attempts needed six supporting manual operations: two round starts, two Fury turn starts, one movement completion, and one whole-action fallback. This is workable for the experiment but cumbersome for actual play.
- The same ability changed from automated damage plus pending movement to entirely manual resolution as Ferocity crossed a threshold. Parser success alone cannot determine the UI's automation label.
- Pending movement after applied damage and a prerequisite blocking all damage both currently use `needs-input`. The UI must display actual applied effects and pending work, rather than infer them from the status alone.
- Table completion needs the original ability, prior applied changes, remaining work, and an explicit completion/correction operation together. Users should not need to reconstruct these from the full JSON record.

The next proposed shared-engine increment is explicit turn context and the Berserker first-push surge trigger. It would address an observed interruption while giving the UI meaningful start-turn and resolve-action operations. This is a proposal, not an implemented contract change.

(Written before the web app existed; the app workstream has since started under `convex/` and `web/`.) The UI thread can use `src/contracts.ts` for shared types and `src/parser.ts` / `src/engine.ts` for pure logic. `src/content.ts` and `src/history.ts` currently use Node filesystem APIs; they belong behind a backend adapter, not in a browser bundle. The CLI's small evaluator composes these operations, but its file storage is a prototype adapter. Coordinate extraction of a common application entry point and any type changes across threads.
