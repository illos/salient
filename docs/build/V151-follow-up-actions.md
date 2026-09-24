# V151: Level 2–3 follow-up actions

Rules review: required. Depends on: V134, V135, V136, V137.

## Goal

Close QC1's V135 R1 for every merged level 2–3 class: each separate action a source clause grants is its
own entry in the character's action list and shared API route, with its own timing and availability, not
prose inside the parent's activation text.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system); AGENTS.md "Rules and mechanics": a
  feature that grants an action is complete when the action is in the UI list and the shared route.
- Source-only audit agents read every level 2–3 feature and ability of Elementalist, Conduit, Talent and
  Beastheart (and Summoner, fixed in V138). Findings, quoted in `tests/fixtures/v151-follow-up-actions.json`:
  - Elementalist: Disciple of the Green great-cat jump (3rd level only; gated by the character level),
    There Is No Space Between additional portal and end portals, A Conversation With Fire end
    conversation, Distance Is Only Memory dismiss portal, O Flower Aid, O Earth Defend allow Recoveries
    and move area (its upkeep record is now "No action", as the other persistent records), Earth Accepts
    Me exit object (no printed action type: Q-ELEMENTALIST-2).
  - Talent: the strained Slow's end effect. Force Orbs: Fire Orb now says it needs an orb.
  - Beastheart: Omnomnom regurgitate (companion free maneuver), Jaws of Death pull (free triggered action).
  - Conduit: none missing.
- All new entries are manual records: availability that depends on table state (portals active, a
  creature swallowed, a target weakened) is stated in the activation text; nothing new is automated.

## Acceptance checks

1. Focused `tests/character-v151-follow-up-actions.test.ts`: every fixture action is on a complete level-3
   witness build beside its parent, with its source action type and the quoted clause in its source;
   the great-cat jump is absent at 2nd level and present at 3rd. The V135/V136/V137 ledger tests expect
   the additions.
2. Authenticated `follow-up-actions` headless cohort: each action is listed with source and condition,
   used once through `commands:invoke` with persisted `ability.recorded` readback and unchanged actor and
   target state; a level-2 Green Elementalist cannot use the jump.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the cohort and publishes.

## Work log

- Started from main `98f1c3a` on `slice/V151`, `.worktrees/follow-up-actions`, with empty `vendor/*`.
  ENGINE2 and QC1 informed. Five source-only audit agents (one per class) found the actions above.
- Author checks: both TypeScript projects and ESLint pass; focused V151, V134–V137 and V101–V106 engine
  tests 37/37; content, compiled and supporting checks pass.
