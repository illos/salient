# V213: Selected foe turns, villain actions and End Effect

Rules review: required. Depends on: V212. Implements the selected-roster subset of V03.

## Goal

Represent the selected solos' two turns, leaders'/solos' villain actions and optional End Effect
through the common turn clock and journal, with accurate rule warnings and choices.

## Scope

- Two independently spent, nonconsecutive turn entries sharing one creature state for Arixx,
  Werewolf and Thorn Dragon. Respect the spec's placement and captain-only entry rules.
- Villain action at another creature's turn end; each source action once per encounter; one
  villain action per round across the encounter. Track departures without resetting usage.
- Optional End Effect: chosen save-ended effect, 5 irreducible damage for selected leaders/Arixx/
  Werewolf; Thorn Dragon pays 10. Offer at turn end without automatic spending.
- Source-linked extra main actions are allowances, not extra turns (Solo Action payload in V214).
- Broader V03 recurring/immediate multi-turn grants outside this roster remain outside this slice.

Spec: `docs/table-spec.md#initiative-groups-confirmed-app-model`;
`docs/table-spec.md#game-clock-and-scheduled-rules-work`;
`docs/table-spec.md#inline-interaction-cards-in-the-game-log`.
Sources: `rule/monster/villain-action.md`, Villain Actions; `rule/monster/end-effect.md`, End Effect;
the three solo stat blocks' Solo Monster; Monarch/Blackguard/Bandit Chief, End Effect.
Read `docs/research/boss-and-captain-turn-review.md` before implementation.
Likely paths: `convex/lib/initiative.ts`, `combatOperations.ts`, `clock.ts`, action allowances and schema.

## Acceptance checks

1. `foe-turns`: Arixx takes first turn, another creature acts, then Arixx takes second turn with no
   already-spent warning. Both turns share Stamina/conditions; each boundary fires exactly once.
   Consecutive/third turns are warned departures, not newly earned entitlements.
2. Use villain action 3 first legally. Another villain acting in that round receives the shared
   usage warning; retry does not spend twice. Next round permits a different unused action.
3. End Effect is optional; decline leaves Stamina unchanged. Accept on Thorn Dragon at 100
   Stamina and no temporary Stamina leaves 90 and ends the selected save-ends effect even with
   damage immunity present. Separately derive the temporary-Stamina allocation from the health
   rules before coding; irreducible damage is not permission to invent a pool bypass. Never remove an unrelated effect or automatically stand up.
4. Verify the chosen End Effect/save ordering against the existing FIFO/save-last policy. Keep
   any unresolved optional-response timing explicit rather than spending before the Director chooses.
5. Captain attachment, undo of a turn, redo and encounter reset restore both entries and villain
   budgets. Additional main action creates no new boundary or turn and no villain refresh.
6. Test gate plus `foe-turns`; QC reviews the selected V03 overlap and warning policy. V03's old
   blanket refusal wording is subordinate to the owning rule-warning spec.

## Work log

- 2026-09-25: registered by V211; no implementation or test results. V03 remains open for broader scope.
