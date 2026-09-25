# V233: Record Overwhelm duration and spatial-input proposal

## Goal

Record the accepted current-turn duration and explain how V222 can use mapless spatial facts.

## Scope

Documentation only: Q-FOE-5, V222, inventory and plan. Separate the confirmed duration from the
proposed inline input design. No map, coordinate tracking or runtime change.

Spec: `docs/table-spec.md#inline-interaction-cards-in-the-game-log`;
`docs/table-spec.md#game-clock-and-scheduled-rules-work`.
Source: pinned `monster/human/statblock/human-knave.md`, Overwhelm;
`movement/shifting.md`. Duration is a user-approved interpretation, not printed source text.

## Acceptance checks

1. QC verifies current-turn expiry, start-boundary adjacency and source enemy relation. Moving
   away does not end the restriction; moving adjacent later does not create it.
2. Fact collection is labelled a proposal. Unknown/stale adjacency is not treated as false/true;
   shared shift resolution and turn-end expiry own the restriction, not UI components.
3. Test runs focused diff and documentation link checks; QC then clears Deploy. No gameplay proof.

## Work log

- 2026-09-25: created `slice/V233` in `.worktrees/overwhelm-ruling` from `4fd2c92d`.
  User approved the duration and asked how spatial effects would be implemented. Read the
  minimum-input and clock contracts; recorded a proposed turn-scoped adjacency input flow.
