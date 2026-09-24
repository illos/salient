# V167: Respite on the table

Rules review: not required (presentation over V165/V166 operations). Depends on: V165, V166.
No user gate: the user reviews after merge (2026-09-24).

## Goal

The respite visible and usable at the table ([respite mode](../table-spec.md#respite-mode)).

## Scope

- Director pane, between combats: a "Respite" card listing the party as resting-hero checkboxes
  (all ticked; each removable) and Start respite, which sends the ticked heroes, in the slot beside Encounter
  ready. While a respite is open it replaces Encounter ready (combat cannot start) with "Respite in
  progress": each resting hero and their activity, "No activity yet" and a count of unused activities
  (styled like the wizard's unspent-points notice), then Complete respite, Interrupt and Cancel respite.
- Heroes pane, the owner's selected sheet: a resting hero with no activity yet gets a kit picker (the
  kits their build allows, from the new `characters:kitOptions` query) and an "other activity" field;
  once used, the activity is shown. Tacticians change both kits from the palette (`/respite change-kit`).
- `table:roster` carries the open respite's participants and activities.
- Every control submits the registered respite operations; nothing is resolved in the UI.

## Acceptance checks

1. `tests/app/respite.test.ts`: roster readback of resting heroes and activities; kit options for the
   Thorn fixture (current Mountain, Panther offered).
2. Test-Deploy: gate, then the `respite` journey. Table browser tests are under moratorium.

## Work log

- Built on `slice/V167`, `.worktrees/respite-table`, from main. Author checks: lint, both TypeScript
  projects, respite app tests.
- Independent review PASS (2026-09-24). Fixed its one medium finding: the Start card now picks the
  resting heroes, as the spec's participant selection requires, instead of resting every hero.
  Noted, not changed: the owner's kit picker shows for an incomplete build or an observer-owner; the
  server refuses both.

## Publication: 2026-09-24

Merged with V167 and V169 stacked as main `59b890c` and published as Worker `089b650b-6979-4377-9527-34bf19876d72`. Release logs:
`/srv/presidium/projects/salient/test-artifacts/V169-release-59b890c`.
