# V150: Self-Taught forgo for automatic heroic resources

Rules review: required. Depends on: V120.
Raised by: QC1's V145 review (shared blocker, `../review-artifacts/2026-09-24-V145-QC1.md`).

## Goal

Model the Self-Taught complication's forgo for heroes whose Heroic Resource the app generates, so
automatic gains never apply while the hero has forgone them.

## Scope

Source: `complication/self-taught.md`, "At the start of each of your turns during combat, you can
forgo gaining your Heroic Resource until the start of your next turn."
- `canForgo(baseline)`: the hero has the Self-Taught complication feature.
- `resource.forgo value=on|off` (a slash command, the ability panel, or headless) declares the forgo
  for the hero's next turn start. It is refused for a hero without Self-Taught, and for a class whose
  resource the app does not generate.
- At that turn start the clock grants nothing. It logs the forgo and sets `forgoing`.
- While `forgoing` is set, every claim is refused. The observed triggers added by later engine
  slices check the same guard.
- The next turn start ends the window, and that turn's gain applies (Q-RES-7).
- `resource.forgo value=now`, during the hero's own turn after its automatic turn-start gain, removes
  that gain (not below the floor) and starts the forgo. The gain is recorded as `lastTurnGain` at
  the turn start.
- Encounter end and a keep-mode void clear the flags. A reset-mode void restores the pre-combat
  state.
- The Self-Taught content row points to the control. The strike damage bonus stays manual.

## Out of scope

- Automating the damage bonus.

## Acceptance

App test `tests/app/heroic-resource-forgo.test.ts`, on a Self-Taught Shadow:
- a forgo is refused for Thorn, who is not Self-Taught;
- a declared forgo means no 1d3 at the turn start;
- a claim is refused while forgoing;
- the next turn start applies the 1d3 again and reopens claims.

## Work log

- 2026-09-24: implemented on main `693280c`. The focused test passes; `tsc` is clean.
- Independent review ([audit](audits/V150-rules-review.md)): changes required.
  - R1: a keep-mode void left the flags set; it now clears them.
  - R2: forgoing at the turn start, as the rule has it, had no control; `value=now` is added.
  - R3: the test now builds the Shadow with `complication.choice: Self-Taught` and checks the
    evaluated feature.
  - QC1's notes are also covered: claim refusal on another creature's turn, and recovery at the
    next turn.
  - R4: `value=now` is refused once the pool has moved after the turn-start gain (a claim or a spend).
    `lastTurnGain.after` records the value; a test claims first and expects the refusal.
