# V29: Desktop layout feedback follow-ups

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | UI/polish track |
| Rules review | not required |
| Depends on | V21 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Carry the user's desktop review of the V21 layout into the app. Each item is a placement or
presentation change the user asked for while looking at the running table; none of them changes a
rule, an operation's authority, or what the server returns. The slice collects those items so they
are traceable to the screenshots that prompted them, instead of being folded into V21's closed
record.

## Spec references

- `docs/table-spec.md#confirmed-combat-layout` — the settings pop-up and the combat layout decisions
  this slice adds to.
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` — the undo/rewind controls
  being relocated, and the confirmed inline Undo placement that stays.
- `docs/design-tokens.md#component-baseline` — the component surface the toast is built on.

## Items

### 1. History controls move into the table settings pop-up

**User instruction, 2026-09-16** (screenshot of the `REWIND` / `REDO` / `DISABLE USER UNDO` strip
under the LOG tabs): "we need to move this to the settings popup".

V21 placed the history toolbar directly under the LOG / RULES / ROLLS tabs because the mockup had no
home for it. The toolbar is now a row group in the Director's table settings pop-up: one row with
the `Rewind` and `Redo` buttons and the line describing what they would act on, and one row with the
`Enable user undo` switch. The centre pane keeps the log feed alone under its tabs.

The pop-up is the Director's, so the relocation would have left a player with no Redo button. Player
undo already has a confirmed inline placement — the Undo button on the entry the player's undo would
act on — and this item gives Redo the matching inline placement on the entry that would be redone.
No new authority: both buttons submit the same registered operations, and the server checks again
when they run.

### 2. Command errors are dismissible toasts

**User instruction, 2026-09-16** (screenshot of a hero card with a red block reading
`Server Error` / `Uncaught ConvexError: No acting character: …` overlapping the card's Stamina,
Recoveries and Ferocity rows): "so error messages need to popup as dismissable toast".

Every failed operation rendered an `ErrorNotice` block next to the control that submitted it. The
block is wider than the control, so it overlapped neighbouring content and moved the layout, and it
had no way to be dismissed. Operation failures now raise a toast in one dismissible, screen-reader
announced region, and the raw Convex envelope (`Server Error`, `Uncaught ConvexError:`) is stripped
so the toast shows the operation's own message.

Page-level and form-level error states that occupy a deliberate slot in their own layout — the
router's unavailable-page card, the table's entry error, the wizard's validation notice — keep the
inline `ErrorNotice`. They are not transient action failures and have nowhere to pop up from.

## In scope

- Move the history controls to the settings pop-up; remove the toolbar from the log pane header.
- Add the inline Redo affordance that keeps the player's redo reachable from the UI.
- A toast region with dismissible, auto-expiring toasts and an accessible live region.
- Raise every `useCommand` failure as a toast; remove the paired inline `ErrorNotice` renders.
- Strip the Convex error envelope in `errorMessage`.
- Record the confirmed placements in `docs/table-spec.md`.

## Out of scope

- Any change to history authority, windows, seams or the operations themselves (A06).
- Success or informational toasts. The log is the record of what happened; only failures pop up.
- Mobile placement of either surface, which remains V17's.
- The glyph typography of the relocated controls, which is V28's.

## Inputs and dependencies

- Hard: V21 for the settings pop-up and the log pane this edits.
- Reference: the user's two screenshots, kept as `2026-09-16-history-toolbar-feedback.png` and
  `2026-09-16-error-notice-overlap.png` under `.playtest/v29/`, which Git ignores.

## Deliverables

- `web/table/settings-popup.tsx` with the two history rows; `web/table/history-controls.tsx` reduced
  to the shared command helpers; `web/table/log.tsx` without the toolbar.
- `web/table/log-entry.tsx` with the inline Redo button.
- `web/toast.tsx` with the provider, the hook and the viewport; mounted in `web/main.tsx`.
- `web/ui.tsx` with `useCommand` raising toasts and `errorMessage` stripping the Convex envelope.
- Updated browser coverage for both items.

## Acceptance checks

1. The log pane under the LOG / RULES / ROLLS tabs contains no history toolbar; no element with
   `role="toolbar"` and the accessible name `History` exists on the table route.
2. Opening `Table settings` as the Director shows `Rewind`, `Redo` and the `Enable user undo`
   switch; clicking `Rewind` marks the latest roll entry `undone` and `Redo` restores it, read back
   from the feed's `data-disposition`.
3. A player with Enable user undo on sees the inline `Undo` button on the entry their undo would act
   on, and the inline `Redo` button on the entry their redo would restore; both work.
4. Submitting an operation that fails raises one toast whose text is the operation's message, with
   no `Server Error` or `Uncaught ConvexError:` prefix, and no `ErrorNotice` block appears beside the
   control.
5. The toast has a `Dismiss` button; pressing it removes the toast. The toast region is announced to
   assistive technology without stealing focus.
6. A failing command renders no error block inside the pane that submitted it; the message appears
   only in the fixed toast region.
7. `pnpm lint`, `pnpm check:engine`, `pnpm check:app` and the browser suite pass.

## Rules research

None. No item resolves, presents or depends on a game rule; the relocated controls submit the same
registered operations under the same server-side authority checks.

## Open questions

None. Both items are direct user instructions with the screenshots recorded above.

## Work log

### 2026-09-16 — both items implemented on `slice/V29`

Claimed by the UI/polish track in worktree `/srv/presidium/projects/salient/ui`, branch
`slice/V29`, cut from `main` at `14b7536` and rebased onto `8ef8b5e` when the documentation-only
V26 specification merge landed. The first build was `5e94c06`; the rebased commit is the one to
read.

**Item 1.** `web/table/history-controls.tsx` lost its component and now holds only the shared
helpers (`HistoryStatus`, `undoCommand`, `redoCommand`, `undoLabel`, `availability`).
`web/table/settings-popup.tsx` gained a `HistoryRow` reading `history.status` and an
`Enable user undo` switch reading `table.roster.settings.enableUserUndo`; its eyebrow is now
`Presentation and history`. `web/table/log.tsx` no longer renders the toolbar and passes a
`redoTarget` alongside `undoTarget`; `web/table/log-entry.tsx` renders the inline Redo on that
entry. No operation, argument or authority changed.

**Item 2.** `web/toast.tsx` is new: a provider mounted in `web/main.tsx`, a `useToast` publisher, and
a fixed viewport of `role="alert"` items with a `Dismiss` button and a ten-second lifetime, capped at
four. `web/ui.tsx` drops `error` from `useCommand`'s return and raises the message through the toast
instead; `errorMessage` prefers a `ConvexError`'s `data` and strips the `Server Error` /
`Uncaught ConvexError:` envelope. Forty-three inline `<ErrorNotice error={…} />` renders paired with
a `useCommand` hook were removed, along with the three transient non-command notices (the sign-out
failure, the invitation copy failure and the table-entry cancellation failure). The command console
and command line clear their `Recorded:` line on a failure, which previously depended on
`command.error`. `.toast-viewport` sits at `bottom: 5.5rem` so it clears the table's pinned command
line. Kept inline, as recorded above: the router's profile gate and unavailable-page card, the login
form and the wizard's assignment validation.

**Verification** (isolated development backend `anonymous:anonymous-agent` at `127.0.0.1:3210`,
dev server at `127.0.0.1:5183`; the user's playable environment on `5180` was not touched):

- `pnpm lint`, `pnpm check:engine` (97 engine tests), `pnpm check:app` (321 app/script tests),
  `pnpm check-links`, `pnpm check-vendor`, `pnpm content:check`, `pnpm build` — all pass, re-run on
  the rebased tree. `check-links` counts 170 files after the V26 documents and this slice's review.
- `pnpm exec playwright test` — the one reproducible failure is
  `tests/browser/table-audit.spec.ts:87`, and it is not this slice's: it asserts
  `contentStatus.entryCount` is 403 while the committed snapshot at pin `fb83a789da8f` holds 467,
  which `pnpm content:check` confirms. That line was last touched in V21 (`e83930e`), before the
  content that grew the snapshot landed; this slice changes no content. Left for the owning track.
  Two other specs failed once each under a long serial run on a loaded machine
  (`closeout.spec.ts`, `rule-popup.spec.ts`) and passed on re-run; they are harness flakes.
- Evidence screenshots: `.playtest/v21/rosters/settings-*.png` (the pop-up with the two history
  rows), `.playtest/v21/log/freeplay-director-*.png` (the log pane with no toolbar) and
  `.playtest/v21/log/error-toast-dark-1440x900.png` (the toast reading
  `/test roll needs an @actor.`, clear of the command line).

**Accepted losses, recorded rather than fixed.** The old toolbar rendered in the pane header for
every non-observer while a session ran, independent of what the feed showed. The inline buttons
render only when their target entry is rendered, so a player has no history button while the ROLLS
tab filters that entry out, or after paging back to older activity; `/history undo` and
`/history redo` remain available from the command line in both states. The availability and reason
line ("Nothing to rewind · history does not cross …") is now Director-only: a player whose undo is
unavailable sees no button and no explanation. No authority changed and the server re-checks every
call. Both are affordance losses; raise them again if the table feels them in play.

### 2026-09-16 — independent implementation review and the changes it required

An independent implementation reviewer returned `changes required` on `9dd186a`
([review](reviews/V29-implementation-review.md)): one blocking finding and nine others. The
blocking finding is worth recording in full, because it was invisible to every check above.

`OverlayCard` is a modal Base UI dialog, so while it is open `markOthers` puts `aria-hidden` on
everything outside it — including `#root`, where the toast region lives. `markOthers` exempts only
elements that already carry `[aria-live]` when the dialog opens. The region was mounted lazily with
its first message and carried no `aria-live`, so a failure raised from inside the settings pop-up —
the only home item 1 leaves for Rewind and Redo — was silent for a screen reader. Fixed by mounting
the region for the life of the app and giving it `aria-live="assertive"`; the empty region is
`display: none` and `pointer-events: none` so it neither draws nor takes a click.

Also fixed from the review: `errorMessage` no longer returns an empty string for a message that is
nothing but envelope (it falls back), and it applies the `Server Error` / `Uncaught ConvexError:`
strips only to a message that actually carried the Convex tags, so an operation whose own wording
starts with those words keeps it; a toast holds its lifetime while hovered or focused, so it cannot
be removed from under a keyboard user reading it; the `.gitignore` hunk was unrelated to this slice
and is reverted, with the two feedback screenshots kept under `.playtest/v29/` instead; and the
spec sentence that read as though a player's Undo moved into the Director's pop-up is corrected.

Test changes from the review: the "no error block" assertion was scoped to `[data-log-pane]`, which
does not contain the command line that submitted the failure, so it passed vacuously — it now
asserts the toast is the page's only `role="alert"`. Acceptance check 3 had no placement coverage;
the spec now drives a player's own roll, asserts the inline `Undo` is on that entry and on no
other, undoes it, asserts the inline `Redo` appears and restores it. The toast's clearance over the
pinned command line is asserted from the two bounding boxes rather than trusted to a constant.

Left unfixed and accepted: the reviewer's reading of Base UI's outside-press handling is that
dismissing a toast also closes an open settings card. The state is recoverable either way, and a
toast left alone expires without closing anything, which the spec now asserts. Not reproduced in
the running app; recorded as reported rather than confirmed or denied.

The regression test for the blocking finding is behavioural, not structural: with the settings
pop-up open, `tests/browser/v21-log.spec.ts` asserts `#root` carries no `aria-hidden="true"` and
that `getByRole('alert')` still resolves the toast. Playwright's role queries skip anything inside
an `aria-hidden` subtree, so that assertion fails on the unfixed code.

**Re-verification after the fixes** (same isolated backend, recreated clean because two full suite
runs had grown its Better Auth tables until sign-in exceeded Convex's 1s function budget):
`pnpm lint`, `pnpm check:engine` (97), `pnpm check:app` (321), `pnpm check-links` (170),
`pnpm check-vendor`, `pnpm content:check`, `pnpm build` all pass, and `pnpm exec playwright test`
is 20 of 21 with only the pre-existing `table-audit.spec.ts:87` content count failing. Earlier runs
in this session also failed on 1s function timeouts while peer threads held the machine at a load
average above 30 on four cores; those are environment, not code, and cleared when the load fell.

Acceptance checks 1 to 6 are asserted in `tests/browser/v21-log.spec.ts`; check 7 is the command
list above.

### 2026-09-16 — merged into `main` and the shared playable app updated

Merge complete. `slice/V29` rebased onto `main` `78a3a55` (after the V25 live closeout and the V27
undead ingestion landed) and fast-forwarded as **`7b80e56`**. The rebase's only conflict was
`STATUS.md`; `web/main.tsx` auto-merged, keeping V27's broadened public-route guard alongside the
new `ToastProvider`.

Integrated verification in `/srv/presidium/projects/salient/ui` on the isolated backend
`anonymous:anonymous-agent` (127.0.0.1:3210, frontend 127.0.0.1:5183), single-worker to respect the
host contention peers reported: `pnpm lint`, `pnpm check:engine` (97), `pnpm check:app` (336),
`pnpm check-links` (179), `pnpm check-vendor`, `pnpm content:check`, `pnpm build`, and
`pnpm exec playwright test` — **22 of 22**. The `table-audit.spec.ts` content-count failure carried
through this slice's own runs is gone: the V25 live closeout replaced that stale 403 expectation
with a manifest check on `main`.

**Runtime target.** Serving checkout `/srv/presidium/projects/salient/code` on `main`; frontend the
Vite dev server on `0.0.0.0:5180`; backend the local Convex deployment `anonymous:anonymous-agent`
at 127.0.0.1:3210-equivalent port 3212 with its site proxy on 3213. No secrets recorded.

**Update result.** V29 contains no `convex/` function, no schema and no seeded content, so no
backend sync, seed or reset was performed and no play data was touched. The frontend watcher was
the only component that needed to move, and it did: the shared server returns 200 for
`/web/toast.tsx` with `aria-live` present and for `/web/main.tsx` with `ToastProvider` mounted, and
the backend answers 200 on its version endpoint.

**Live changed-feature check**, run against the shared app itself (5180 / 3212) with disposable
verification accounts and campaigns, resetting nothing: `v21-log.spec.ts:25` passes there, which
exercises the whole slice end to end — no toolbar under the tabs, the settings pop-up's Rewind and
Redo round trip read back from the feed's `data-disposition`, the `Enable user undo` switch, the
toast's message and clearance over the command line, the accessibility assertion with the pop-up
open, the player's inline Undo and Redo on the right entries, manual dismissal and auto-expiry.
`v21-rosters.spec.ts` also passes there and captures the pop-up. Evidence from the shared app:
`evidence/V29-live/live-error-toast-dark.png` and `evidence/V29-live/live-settings-history-dark.png`.

Nothing is pending. `slice/V29` is retired and the isolated backend and dev server for this slice
are stopped.

