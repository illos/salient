# V25 shared playable verification — 2026-09-16

## Target and update

Reviewed V25 implementation `4cb3f1f` is integrated into main. This closeout initially tested
main `663b49f`, served from `/srv/presidium/projects/salient/code` at
`http://127.0.0.1:5180`. Its local anonymous Convex deployment is `anonymous:anonymous-agent`,
backend `http://127.0.0.1:3212`, site service `http://127.0.0.1:3213`.
These are the shared playable services, not the previous isolated V25 backend on 3230.

The stored content was still generator 1.0.1 with 403 entries. Synced the reviewed main backend
using an explicit local URL and the existing local credentials, then ran `pnpm content:seed`.
The ordinary `convex dev --once` attempt had refused to start because the backend was already
running; the direct push succeeded, including typecheck and schema validation. No indexes were
deleted. No reset, production deployment or external publication occurred.

[Stored manifest](content-manifest.json) now matches the committed snapshot: generator 1.0.2,
467 entries, pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`, content hash
`sha256:d076c3d75a546811c031d9d14a1075990a900bd61750dd1fd99b014722046dc9`.
The existing main frontend serves the integrated source through Vite.

## Persisted character evidence

The shared-app Elementalist browser journey created the corrected Bethell through all supported
wizard choices, saved/reloaded, submitted to a different Director, received approval and opened
every delivered grant's source. The Fury journey also completed creation, admission and the
owner/Director/peer sheet checks. Fresh test accounts and campaigns isolated these operations
from existing user records.

Authenticated `scripts/app.ts query characters:sheet` reads independently checked both saved
**effective**, complete revision-2 builds against `tests/fixtures/v25-bethell.json` and
`tests/fixtures/v25-fury.json`: all scalar totals, characteristics, potency, resource, kit and
six grant groups match. Every returned ability/feature source is byte-equal to its pinned local
Compendium file: 30 Elementalist and 17 Fury grants. See the
[readback summary](readback-summary.json).

- [Elementalist sheet](elementalist-sheet.png)
- [Fury owner sheet](fury-sheet.png)

The [data preservation check](data-preservation.json) records identical per-record fingerprints
for all 13,838 existing application rows across 28 root tables after the backend/content update.
The check excludes the deliberately replaced content tables and does not claim a snapshot of
Better Auth component sessions. Existing campaigns, characters, revisions and game history were
preserved. New verification records were added afterward.

## Verification repairs and interrupted runs

The extended Fury journey exposed Convex server diagnostics on the headless client's stdout,
breaking consumers' JSON parsing. `scripts/app.ts` now routes its Convex logger to stderr while
keeping the JSON result on stdout. A real child-process regression supplies a successful Convex
HTTP response containing diagnostics and checks both output streams. The table audit's obsolete
403-entry assertion now checks the committed manifest's count, revision and hash.

The [independent review](../../../reviews/V25-live-verification-review.md) passes these
nonmechanical changes. The original [implementation](../../../reviews/V25-implementation-review.md)
and [rules review](../../../reviews/V25-rules-review.md) remain applicable; no rule, evaluator or
backend implementation was changed by this closeout.

Some attempts encountered login timeouts, a table-audit timeout, three 5-second unit-test timeouts
and an interrupted browser process during severe host memory pressure. These are retained in
local logs rather than counted as passes. The unused character-track isolated services were
stopped and the remaining suites scheduled serially; the final runs all passed, as recorded below.

## Evidence boundaries

The original 108-record source audit and corrected live Forge Steel re-export remain the rules
and external-reference evidence. This closeout verifies their delivered behavior in the shared
app; it does not claim a new Forge export. Fury remains a source-audited regression reference.
Forge rendered ability-damage cards were not captured. Full eleven-class progression and the
Salient import/export adapter remain later slices.

## Final checks

- `VITEST_MAX_WORKERS=1 pnpm check`: **PASS**, 97 engine + 336 app/scripts tests,
  lint, typechecks, 177 Markdown link checks, both source pins, generated content/foes checks and
  production build. Worker count limited concurrency; assertions and timeouts were unchanged.
- Shared `v25-elementalist.spec.ts`: **PASS** after backend/content sync.
- Shared `wizard.spec.ts`, with the reviewed CLI repair: **PASS**, including all three sheet
  audiences, persisted headless operations, corrections, undo/redo, reconnect, 60 real condition
  toggles and closeout/session restart; 6.2 minutes under host contention.
- Gracefully restarted shared backend 3212/site 3213 using the same binary, arguments, environment
  and data directory to release accumulated memory. Frontend 5180 and proxied auth remained
  reachable. No play-data reset or target change.

Browser command environment for the follow-up worktree explicitly selected shared frontend
5180, backend 3212 and site 3213; its isolated `.env.local` was not repointed. Raw logs are retained
under `.playtest/v25-live/` in the main and character worktrees. The earlier standalone reference
screenshots and raw Forge captures remain in the character worktree.

- Shared `table-audit.spec.ts`: **PASS**, 1.1 minutes after the restart, including the manifest
  count/revision/hash, three table contexts, command palette, console and live CLI persisted
  operations. No test assertions or timeouts were relaxed.
