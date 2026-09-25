# V230: Record Ravenous Horde spawn ruling

## Goal

Record the user's accepted Q-FOE-2 exception and give V223 concrete independent expectations.

## Scope

Docs only: questions, plan, inventory and V223. Ravenous Horde creates separate squads with
2 Stamina per zombie and casualty step 2; ordinary rotting zombies stay at 5. Do not grant the
weakened condition or generalize the exception to other minions.

Spec: `docs/table-spec.md#minion-squads-and-captain-state`.
Sources under the pinned unified Markdown root: `monster/undead/1st-echelon/undead-malice-level-1-malice-features.md`,
Ravenous Horde; `monster/undead/1st-echelon/statblock/rotting-zombie.md`, header;
`chapter/monster-basics.md`, Shared Low Stamina and Dropping One Minion. The source conflict and
user-approved resolution are recorded in Q-FOE-2; the 2-point formula is an application ruling.

## Acceptance checks

1. QC verifies the recorded answer, exception scope and V223 expectations: four living zombies,
   pool 8; post-defense damage 3 leaves three/pool 5; another 1 leaves two/pool 4.
2. Ordinary minion behavior and other unanswered questions remain outside this ruling.
3. Test checks documentation links and diff whitespace on the submitted tip; QC gives final
   clearance to Deploy. No gameplay execution or implemented spawning is claimed.

## Work log

- 2026-09-25: created `slice/V230` in `.worktrees/ravenous-horde-ruling` from `171a8702`.
  User accepted the previously presented separate-squad/casualty example and explicitly confirmed
  summoned zombies have 2 Stamina. Recorded the answer and updated planned acceptance cases.
- Test accepted `3f45f32b`: diff check passed and 584 Markdown files had no broken relative links
  or anchors. QC gave final PASS on that exact tip. Fast-forward merged into main; no runtime
  component changed.
