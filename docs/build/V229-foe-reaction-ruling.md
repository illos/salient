# V229: Record the Director reaction interaction ruling

## Goal

Correct V211's proposed interruption flow to follow the user's character-reaction precedent.

## Scope

Documentation only: Q-FOE-1, the V220 plan and the overall foe plan. Resolve the player's action
immediately and offer a dynamic Director card for a linked revision. Record confirmed direction
with next-committed-action closure across hero and monster triggered cards, separately from
unconfirmed source-specific readings. Q-FOE-2–5 stay open.

Spec: `docs/table-spec.md#inline-interaction-cards-in-the-game-log`;
`docs/decisions/2026-09-24-automation-rulings.md#3-damage-changing-responses-revise-the-hit-option-b`.

## Acceptance checks

1. QC compares the record with the user's answer and the character-reaction precedent; no
   blocking response step survives in the owning V220 plan.
2. Record next-committed-action closure even within the same turn across heroes and monsters.
   No approval is inferred for damage-only target substitution or Facepalm's ambiguous antecedent.
3. Test runs the focused documentation link check and diff whitespace check on the committed tip.
   No executable change or gameplay proof is claimed. QC then clears the docs handoff to Deploy.

## Work log

- 2026-09-25: created from main `a26a958e` in `.worktrees/foe-reaction-ruling`, `slice/V229`.
  Read the existing option B, Lines of Force and response-window precedents. Recorded the user's
  confirmed direction. The user then confirmed next-action closure across all these triggered
  cards, resolving the window clarification. No runtime implementation or tests.
- Test accepted `a57bb42e`: diff check passed and 583 Markdown files had no broken relative links
  or anchors. QC gave final PASS on that exact tip. Fast-forward merged into main; no runtime
  component changed.
