# V31: History control placement correction

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | UI/polish track |
| Rules review | not required |
| Depends on | V29 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Correct V29 item 1. The user's instruction was about the **Enable user undo** toggle, not the whole
history strip: the toggle belongs in the table settings pop-up, while Rewind and Redo stay in the
main table UI as a discreet icon control rather than the two large caps buttons V21 gave them. No
rule, operation, argument or authority changes; this is placement and presentation only.

## Spec references

- `docs/table-spec.md#confirmed-combat-layout` — the combat layout decisions, including the
  2026-09-16 history placement this slice corrects.
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` — the undo/rewind controls and
  the confirmed inline Undo placement.
- `docs/design-tokens.md#component-baseline` — the icon-button size and ghost variant used.

## Items

### 1. Only the Enable user undo toggle belongs in the settings pop-up

**User correction, 2026-09-16**, after seeing V29 live: "I meant the user undo toggle. Actual undo
redo buttons can stay in the main UI. Though they should get a discreet icon control instead of big
buttons."

V29 read the earlier instruction as covering the whole `REWIND` / `REDO` / `DISABLE USER UNDO`
strip. Enable user undo is a campaign setting and stays where V29 put it, as a switch row in the
pop-up. Rewind and Redo are actions taken during play, so they return to the table.

### 2. Rewind and Redo are a discreet icon control

They return to the log pane, not as the caps buttons V21 drew but as two small icon-only ghost
buttons at the right-hand end of the LOG / RULES / ROLLS tab row, where they do not take a row of
their own and do not compete with the tabs. What each would act on, and why it is unavailable,
moves entirely into the button's tooltip; the grey explanation line V21 printed under the strip is
gone. The buttons are labelled for assistive technology, so nothing depends on the icon alone.

The Director's button rewinds and a player's undoes, exactly as before. The inline per-entry Undo
and Redo that V29 settled stay as they are: they are the confirmed placement beside a result, and
they remain the only history affordance attached to a specific entry.

## In scope

- Remove the `Rewind and redo` row from `web/table/settings-popup.tsx`, keeping the
  `Enable user undo` switch row.
- Restore `HistoryControls` in `web/table/history-controls.tsx` as an icon control and render it in
  the log pane's sticky header, aligned to the right of the tab row.
- Give `CommandButton` an optional icon form so the icon control submits through the same path.
- Correct the recorded user decision in `docs/table-spec.md`, and the V29 accepted loss it created.
- Update the browser coverage that asserts where each control lives.

## Out of scope

- Any change to history authority, windows, seams or the operations themselves (A06).
- The toast surface from V29 item 2, which is unaffected.
- Mobile placement, which remains V17's.
- The glyph typography of these controls, which is V28's.

## Inputs and dependencies

- Hard: V29 for the settings pop-up's history section and the log pane this edits.

## Deliverables

- `web/table/history-controls.tsx` exporting the icon `HistoryControls` again.
- `web/table/log.tsx` rendering it beside the tabs; `web/table/settings-popup.tsx` without the
  action row; `web/table/setup-card.tsx` with the icon form of `CommandButton`.
- Updated `tests/browser/v21-log.spec.ts`.

## Acceptance checks

1. The log pane's tab row carries a `History` group with exactly two controls, whose accessible
   names are `Rewind` (Director) or `Undo` (player), and `Redo`. Neither renders a visible text
   label, and no row is added under the tabs.
2. Clicking the icon `Rewind` marks the latest roll entry `undone`, read back from the feed's
   `data-disposition`; clicking `Redo` restores it.
3. Each icon control's tooltip names the entry it would act on, or the reason it is unavailable;
   an unavailable control is disabled.
4. The table settings pop-up contains the `Enable user undo` switch and no Rewind or Redo control.
5. The inline per-entry `Undo` and `Redo` still appear on the entries they would act on and still
   work, for a player with Enable user undo on.
6. An observer sees no history control, and none renders outside a running session.
7. `pnpm lint`, `pnpm check:engine`, `pnpm check:app` and the browser suite pass.

## Rules research

None. No item resolves, presents or depends on a game rule; the controls submit the same registered
operations under the same server-side authority checks.

## Open questions

None. This slice is a direct user correction.

## Work log

### 2026-09-16 — implemented on `slice/V31`

UI/polish track, worktree `/srv/presidium/projects/salient/ui`, branch `slice/V31` cut from `main`
at `f7137dc` (V29 already merged and live). Branch handoff pending review; `main` and the shared
playable app still run V29's placement.

`web/table/history-controls.tsx` exports `HistoryControls` again, now two icon-only ghost buttons
in a `role="group"` named `History`, reading availability and reasons from `history.status` and
putting both into each button's tooltip. `web/table/log.tsx` renders it absolutely positioned at
the right edge of the tab row, inside a new relative wrapper, so the tabs stay centred and no row
is added; the gate is unchanged (`running` and not an observer).
`web/table/setup-card.tsx` gives `CommandButton` optional `icon` and `title` props, so the icon
control submits through the same registered path as every other button rather than a parallel one.
`web/table/settings-popup.tsx` loses the `Rewind and redo` row and keeps the `Enable user undo`
switch; its eyebrow is now `Campaign settings`. No operation, argument, gate or audience changed —
the commit touches no `convex/` file.

The V29 accepted losses are gone with it: the icon pair renders in the pane header independent of
the feed's contents, so the ROLLS tab and a paged-back feed no longer hide a player's history
control, and the reason line each control lost is back in its tooltip for every role.

Verification on the isolated backend `anonymous:anonymous-agent` (127.0.0.1:3210, frontend
127.0.0.1:5183):

- `pnpm lint`, `pnpm check:engine` (97), `pnpm check-links` (180), `pnpm check-vendor`,
  `pnpm content:check`, `pnpm build` — pass.
- `pnpm exec playwright test` — **22 of 22**.
- `pnpm check:app` — 336 pass once the host is quiet. Under a load average above 30 from peer
  threads, `tests/scripts/rules.test.ts` times out on its 120-second deterministic rebuild, which
  the foes track reported independently; re-run at load 6 it is 64 of 64. Nothing in this slice
  touches the rules pipeline.
- Evidence: `.playtest/v21/log/freeplay-director-dark-1440x900.png` shows the icon pair at the
  right of the tab row with the tabs still centred.

### 2026-09-16 — independent implementation review and the changes it required

The reviewer returned `changes required` on `6c47704`
([review](reviews/V31-implementation-review.md)) with one blocking finding and several others, and
observed the same 22 of 22 browser result once the host was quiet.

**Blocking, and a regression against V29 as merged.** Making the tooltip the sole carrier of "why
this is unavailable" does not survive the control being disabled: a native `disabled` button takes
no pointer events, so its `title` never opens, and it is out of the tab order, so no keyboard or
screen-reader user can reach it either. The reviewer measured it in the running app —
`elementFromPoint` at the disabled control returned the wrapper with no titled ancestor at all.
V21 and V29 both printed the reason as visible text, so this slice would have removed it. Fixed by
repeating the tooltip on the wrapper span, which is not disabled and does take the hover, and by
giving each button an `aria-describedby` pointing at a visually hidden span holding the same line,
which is exposed whether or not the control is focusable. Both are asserted in the browser spec.

**Overlap.** The reviewer measured the absolutely positioned pair against the ROLLS tab: 48px clear
at 1440, 3px at 1152, and overlapping by 16px at 1024, where it swallowed the tab's click. Replaced
with a three-column grid — `1fr auto 1fr` — so the pair has a reserved column and the tabs stay
centred by construction. The rule under the row moved from the tablist to the wrapper so it still
spans the full width. The spec now asserts the clearance at 1440, 1152 and 1024.

Also fixed: `tests/browser/acceptance-extension.ts` was silently retargeted by this slice — its
`.first()` Undo and Redo now resolved to the header pair rather than the inline per-entry button,
so it is scoped to the log feed and keeps testing what it was written to test; the V29 paragraph
claiming "both losses" now accounts for all three; the `/^Rewind: /` assertion that matched any
title is `/^Rewind: #\d+ /`; the two implementation choices inside the spec's **User decision**
block are separated out as choices open to change; a stale comment in `web/table/log.tsx` and the
now-internal `availability` export are cleaned up.

**Re-verification after the fixes:** the reviewer returned `pass`, re-measuring both halves of the
blocking finding — the disabled control's hit chain now reaches a titled ancestor, and Chromium's
accessibility tree shows the button un-ignored with its description computed and the same text
present independently as static content. It observed 22 of 22 in a single clean run.

### 2026-09-16 — the reviewer's non-blocking observations, taken

Three of the four were worth acting on rather than recording, so the pass was earned twice.

The control is now **inert but focusable** rather than natively disabled, through Base UI's
`focusableWhenDisabled`, which emits `aria-disabled` in place of `disabled`. That closes the last
part of the blocking finding properly: a keyboard-only user can Tab to an unavailable control and
hear why, the tooltip opens on hover without the wrapper trick, and focus is no longer dropped to
the document when a control disables itself under the user — which is exactly what acting on it
does, since acting is what exhausts the window. The wrapper tooltip the first fix added is gone
with it, which also scopes the change back to this slice: it had silently given all twelve
`CommandButton` callers a tooltip while disabled, including `Take turn` and `Finish cleanup`.
`aria-disabled` styling replaces the native `disabled:` variants on the iconic branch only.

The overlap assertion did not discriminate: it ran in the free-play fixture, which is the wide
case, and the reviewer measured that the absolutely positioned layout it was written against would
have passed it at all three widths. It moved to the combat test, where the heroes column is wider
and the centre pane correspondingly narrower — the old layout measured −17px of clearance at 1024
there, against 0 or better now.

Recorded rather than fixed: below roughly 950px wide in combat the tab row overflows the pane by
up to 14px instead of the controls colliding, because the middle column floors at the tablist's
min-content width. Nothing is covered and every control stays clickable, which is the point of the
reserved column; the desktop layout is not specified below that width and mobile is V17's.

**Final verification:** `pnpm lint`, `tsc`, `pnpm exec playwright test` — 22 of 22.

The reviewer passed `21786fc`, re-measuring the new mechanism from scratch rather than carrying
round two forward: the iconic branch emits `aria-disabled` with `tabindex="0"` and no native
`disabled`, the control cannot submit by pointer, script, Enter or Space, the other eleven
`CommandButton` callers render as they do on `main`, and the moved geometry assertion now
discriminates at 1024 in combat. One test-only line was added after that verdict, on its
suggestion: the spec now asserts the inert control's 0.5 opacity, so a change to the conditional
class string cannot stop it looking unavailable without failing the suite.

### 2026-09-16 — merged into `main` and the shared playable app updated

Merge complete. `slice/V31` sat directly on `main` `f7137dc`, so the fast-forward needed no rebase
and no conflict resolution: **`bd0c512`**.

**Runtime target.** Serving checkout `/srv/presidium/projects/salient/code` on `main`; frontend the
Vite dev server on `0.0.0.0:5180`; backend the local Convex deployment `anonymous:anonymous-agent`
on 3212 with its site proxy on 3213. No secrets recorded.

**Update result.** V31 contains no `convex/` function, no schema and no seeded content, so no
backend sync, seed or reset was performed and no play data was touched. The frontend watcher was
the only component that needed to move, and it did: the shared server returns
`web/table/history-controls.tsx` exporting `HistoryControls` again, and its
`web/table/settings-popup.tsx` mentions Rewind only in the comment explaining that it is not
there. The backend answers on its version endpoint.

**Live changed-feature check**, against the shared app itself (5180 / 3212) with disposable
verification accounts and campaigns, resetting nothing: `v21-log.spec.ts` passes there — the icon
pair beside the tabs with its accessible names, tooltips and descriptions, an inert control that
submits nothing by pointer or keyboard, the Rewind and Redo round trip read back from the feed's
`data-disposition`, the settings pop-up holding `Enable user undo` and no history action, and the
inline per-entry Undo and Redo. `v21-rosters.spec.ts` passes there and captures the pop-up.
Evidence from the shared app: `evidence/V31-live/live-history-icon-pair-dark.png` and
`evidence/V31-live/live-settings-user-undo-dark.png`.

Nothing is pending. `slice/V31` is retired and the isolated backend and dev server for this slice
are stopped, which releases the browser window the engine and character tracks were queued behind.

### 2026-09-16 — follow-up: an inert control no longer lights up on hover

The reviewer's close-out left three one-line follow-ups. Two mattered and are done here, on `main`,
because the slice was already merged when it raised them.

Keeping pointer events on the control is what makes its tooltip open, and it also let the ghost
variant's hover background through, so an unavailable Rewind or Redo brightened under the cursor as
though it were live. `aria-disabled:hover:bg-transparent` did not win, and the arbitrary variant
`[&[aria-disabled=true]:hover]:bg-transparent` does — but not for the reason first recorded here.
The reviewer read the emitted rules: all three are specificity `(0,3,0)`, because the dark ghost
rule's `:is(.dark *)` supplies its third component. Both attempts tie with it and the tie breaks on
source order, which the arbitrary variant wins by being emitted last. So the first attempt would
have worked in the light theme and failed only in dark, which is why a dark-only measurement caught
it; and the win is an ordering tie-break that a Tailwind upgrade could flip. That is acceptable only
because it is now asserted: the spec checks the hovered background stays fully transparent, in
whichever notation Chromium reports it, and the pre-fix values fail that check.
The no-op `aria-disabled:cursor-default` went with it, and the spec now presses `Space` as well as
`Enter` on the inert control, which the reviewer had measured but nothing asserted.

Verified: `pnpm lint`, `tsc`, 336 app/script tests, 97 engine tests, `pnpm build`,
`pnpm check-links` (181), and `v21-log.spec.ts` against the shared app on 5180 — both tests pass.

