# V187: Level-up capture spec approves through Manage players

Rules review: not required (browser spec only). Depends on: V186.

## Goal

After V186 the V32 capture reached the History restore, then failed looking for a top-level "Approve"
button on the campaign page. Since V68, hero reviews (admissions and full edits) are approved in the
"Manage players" pop-up. The spec now opens it from the players pane's "Manage players" (the header's "Invite players" shows only
between sessions) and approves this hero's row.

## Acceptance checks

1. The Test-Deploy capture of `tests/browser/v32-progression.spec.ts` passes the restore approval.
