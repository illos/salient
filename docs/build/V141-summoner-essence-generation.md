# V141: Summoner essence generation

Rules review: required. Depends on: V120 (shared heroic-resource engine).
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/summoner.md`](evidence/V120/summoner.md).

## Goal

Enable automatic essence generation for the Summoner on the V120 engine, with its own implementation
and an independent rules review.

## Scope

The Summoner profile in `shared/resolve/heroicResourceGeneration.ts`, with sources in
`feature/summoner/level-1/essence.md`. It is keyed by class, because the Elementalist's resource is
also essence.
- +Victories at combat start.
- +2 at the start of each of the Summoner's turns.
- Claim `summoner-minion-death`: +1 "The first time each round that any minion (either yours or an
  enemy) dies unwillingly within your Summoner's Range".
  - It is a table claim, because summoned minions are not app actors and range is not tracked.
  - The confirmation text excludes willing sacrifices and the deaths that three abilities say give
    no essence: Explosive Parade, Cavalry Call and Essence Funnel.
  - From level 4 it is +2 (`feature/summoner/level-4/essence-salvage.md`, "2 essence instead of 1").
- Lose all remaining essence at encounter end.
- Verified through level 6. `feature/summoner/level-7/font-of-creation.md` changes the turn-start gain
  to 3, so a Summoner of level 7 or higher stays manual.

## Out of scope

- Automatic detection of enemy-minion deaths. Range and "unwillingly" need the table.
- The sacrifice discount (Q-SUMMONER-1, manual).
- The ledger's ambiguities about dismissal and the Standby Minions optional rule. These deaths stay
  with the table's confirmation.

**Resolved on the source: the turn-start gain while dying.** `essence.md` states no exception, and
`rule/health/dying.md` says "While you are dying, you can still act". The Unconscious rule in
`feature/summoner/level-1/minions.md` stops only summoning and minion damage. So the gain applies
while dying. The rejected alternative was no gain while dying.

## Acceptance

- Pure quote test: the Summoner's clauses and amounts, including level 4.
- App test `tests/app/heroic-resource-summoner.test.ts`:
  - Victories at commit;
  - +2 each turn across two rounds;
  - the claim once per round;
  - 2 at level 4;
  - 0 after finish.
- Headless cohort `heroic-resource-summoner`.

## Work log

- 2026-09-24: implemented on top of V120 (`eb32e21`). The focused files pass (1/1 and 5/5); `tsc`
  and eslint are clean. No Summoner content row adds essence by hand.
- Independent review ([audit](audits/V141-rules-review.md)): PASS with two advisories, both fixed.
  - R1: the gain while dying is recorded above as resolved on the source.
  - R2: levels 4–6 are recorded in the ledger. The reviewer confirmed that Essence Salvage is the
    only change through level 6.
- TESTER gate at `22601b5`: `tsc -p tsconfig.web.json` failed in the new app test. The witness
  selections needed an `unknown` cast (TS2352). Fixed.
- A stale manual row the review missed: `Summoner: Essence` still said to add the Victories, +2 and
  +1 by hand, the same defect as V143 R1. It now points to the automation and the claim.

## Publication: 2026-09-24

Merged in resource train 3 (V141, V143, V146, V142) as main `7e9f731`. The tip passed the full
gate (431 engine and 683 app tests) and the train's headless journeys. The backend and frontend were
published as Worker `35639817-fb01-4132-9428-728b6512c8ec`. Release logs: `/srv/presidium/projects/salient/test-artifacts/rtrain3-release-7e9f731`.
