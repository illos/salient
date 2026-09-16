# V29 desktop layout feedback follow-ups — independent implementation review

Reviewer: independent implementation reviewer (fresh context; did not implement V29). Worktree
`/srv/presidium/projects/salient/ui`, branch `slice/V29`. No file outside this review document was
modified and no state-changing Git command was run in any round.

Three rounds, all on 2026-09-16, against three successive amendments of one commit: `9dd186a`,
then `b2ce3a3`, then `4bb2879`. Everything from here to
[What would move this to `pass`](#what-would-move-this-to-pass) is the first round and is kept
unchanged as the record of what was found. The
[re-verification](#re-verification--2026-09-16-b2ce3a3) against `b2ce3a3` follows it, and the
[close-out](#close-out--2026-09-16-4bb2879) against `4bb2879` carries the verdict.

## First-round verdict — 2026-09-16, `9dd186a`

**changes required** (superseded; see the re-verification below)

One blocking finding: a toast raised while any `OverlayCard` is open — which now includes the
Director's table settings pop-up, the only home item 1 leaves for Rewind and Redo — is placed
inside the `aria-hidden` subtree Base UI applies to everything outside a modal dialog, so it is
neither announced nor keyboard-reachable. That is acceptance check 5 failing in the flow this
slice created. The fix is small (see finding 1).

## Spec sections read, by anchor

- `docs/table-spec.md#confirmed-combat-layout` (line 355), including the added
  **User decision, 2026-09-16** block at lines 400–412.
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` (line 2820) and the
  confirmed inline-Undo placement paragraph the diff edits at lines 1556–1560.
- `docs/design-tokens.md#component-baseline` (line 150).
- `docs/build/README.md` sections "Commit format" (line 80), "Review standard" (line 140),
  "Branch and merge policy" (line 158) and "Merge completion includes the playable app" (line 185).
- `docs/build/V29-desktop-feedback.md` in full, including its acceptance checks and work log.

Supporting reads: `convex/history.ts`, `convex/lib/history.ts` (windows and the
`history.undo` / `history.rewind` / `history.redo` / `campaign.user-undo` operation definitions),
`convex/lib/audience.ts`, `web/components/overlay-card.tsx`, and the installed
`@base-ui/react` 1.8.0 dialog and focus-manager sources. No online Draw Steel research was done;
nothing under `vendor/` was read for a rules claim or modified. The slice makes no rules claim, and
I found none in the diff: no operation, validator, window, seam or authority is touched — the
commit contains no `convex/` file at all.

## Checks I ran

All read-only, in `/srv/presidium/projects/salient/ui` at `9dd186a`:

- `pnpm lint` — exit 0 (`eslint .` and `prettier --check .` both clean).
- `pnpm exec tsc -p tsconfig.web.json` — exit 0.
- `pnpm exec vitest run --project app` — 30 files, 272 tests, all passing.
- `pnpm exec vitest run --project engine --project scripts` — 19 files, 146 tests, all passing.
- `pnpm check-links` — 169 Markdown files, no broken links or anchors.
- `pnpm check-vendor` — `vendor/` matches the pinned submodule commits (2 submodules).
- `pnpm content:check` — 467 entries, 10 excluded, revision `fb83a789da8f`.
- `node scripts/check-commit.ts --rev 9dd186a` — "commit message ok". All three `Spec:` anchors
  resolve (`docs/table-spec.md` lines 355 and 2820, `docs/design-tokens.md` line 150);
  `Rules-Review: not required` is present; `Reviewed-By:` is absent, which is correct before review
  and is the lead's `--merge` gate.

I did **not** run the browser suite: this worktree has no dev server and no backend, as the task
states. Everything below that depends on a Playwright run is marked `not verified`.

## Acceptance checks

### 1. No history toolbar in the log pane; no `role="toolbar"` named `History`

**verified.** `grep -rn 'role="toolbar"\|data-history-toolbar' web/ tests/` returns nothing —
the attribute and the accessible name no longer exist anywhere in the application or the suite.
`HistoryControls` is deleted from `web/table/history-controls.tsx` and its render site is gone from
`web/table/log.tsx:389`. The implementer's screenshot
`.playtest/v21/log/error-toast-dark-1440x900.png` (untracked, inspected directly) shows the
LOG / RULES / ROLLS tabs with the feed immediately beneath. The matching runtime assertion is
`tests/browser/v21-log.spec.ts:57`, which I could not execute; the static evidence is stronger than
that assertion, because it covers the whole tree rather than one route.

### 2. Director's settings pop-up shows Rewind, Redo and Enable user undo; the round trip works

**not verified.** The presentation half is verified: `web/table/settings-popup.tsx:154-181` renders
the `Rewind and redo` row with both `CommandButton`s, `web/table/settings-popup.tsx:238-248` renders
the `Enable user undo` switch, and `.playtest/v21/rosters/settings-dark-1440x900.png` shows both
rows in the Director's card. The behavioural half — clicking `Rewind`, reading
`data-disposition="undone"` back from the feed, then `Redo` restoring it — is asserted only at
`tests/browser/v21-log.spec.ts:58-68`, which needs a running backend. Those assertions are
well-formed (they read persisted disposition back from the feed rather than trusting a mutation
response) but I cannot claim them. Running `pnpm exec playwright test v21-log.spec.ts` against an
isolated backend would verify this.

### 3. A player sees the inline Undo and inline Redo on the right entries, and both work

**not verified.** `tests/browser/acceptance-extension.ts` is **not in this diff**; its lines 124 and
128 are the unchanged `getByRole('button', { name: 'Undo'|'Redo', exact: true }).first().click()`
calls, which will now resolve to the inline buttons only as a side effect of the toolbar's removal.
The test asserts nothing about which entry carries the button, so even a successful run would not
establish "on the entry their undo would act on". Statically, `web/table/log.tsx:104-105` derives
`undoTarget` and `redoTarget` from `history.status`, and `web/table/log-entry.tsx:282-300` renders
each button only on the matching `event.id`, which is the right shape. Verifying this needs a
browser run with a player session and an assertion that the button sits on the `li[data-sequence]`
whose id equals `history.undo.target.eventId` / `history.redo.target.eventId`. See also finding 5,
which is about states where those entries are not rendered at all.

### 4. A failed operation raises one toast with the operation's own message and no inline block

**verified.** Three independent lines of evidence. Static: `errorMessage` in `web/ui.tsx:14-25`
strips `[CONVEX …]`, `[Request ID: …]`, the stack tail, a leading `Server Error` and a leading
`Uncaught (Convex)?Error:`; I traced the real Convex envelope
(`[CONVEX M(x)] [Request ID: y] Server Error\nUncaught ConvexError: msg\n    at …`) through those
replacements in order and it reduces to `msg`. Static: `grep -rn ErrorNotice web/` leaves only
`web/router.tsx:107`, `:236`, `:382` and `web/wizard/index.tsx:488`, none of which is fed by a
`useCommand` — see check 6. Visual:
`.playtest/v21/log/error-toast-dark-1440x900.png` shows exactly one toast reading
`/test roll needs an @actor.` with no envelope and no block beside the command line. The screenshot
is implementer-produced; I inspected the file rather than regenerating it.
Finding 3 records an input for which the stripping produces an empty message.

### 5. Dismiss button removes the toast; the region is announced without stealing focus

**failed.** Two of the three clauses hold. The button has an accessible name
(`aria-label="Dismiss"`, `web/toast.tsx:54`) with the icon marked `aria-hidden`, and nothing steals
focus — there is no `focus()`, `autoFocus` or `tabIndex` anywhere in `web/toast.tsx`. The removal
behaviour is asserted only at `tests/browser/v21-log.spec.ts:84-85`, which I could not run.

The announcement clause fails whenever an `OverlayCard` is open, which is exactly the surface item 1
created for the Director's Rewind and Redo. Detail in finding 1.

### 6. A failing command renders no error block inside the pane that submitted it

**verified**, but not by the test the work log cites. Statically, the four surviving `ErrorNotice`
renders are all page-level or form-level and none is fed by a command hook: `web/router.tsx:107`
(profile gate, local `setError` from `ensure`), `:236` (login form), `:382` (route error boundary)
and `web/wizard/index.tsx:488` (local `assignmentError` validation). `grep` for `command.error`,
`addition.error` and `deletion.error` across `web/` returns nothing. `useCommand` no longer exposes
an error at all (`web/ui.tsx:59`), so no consumer can render one. See finding 4 for why the test's
own assertion does not establish this.

### 7. `pnpm lint`, `pnpm check:engine`, `pnpm check:app` and the browser suite pass

**not verified** — the first three reproduce, the fourth I could not run. `pnpm lint` and
`tsc -p tsconfig.web.json` pass; the app project is 272 tests and engine plus scripts is 146,
which reconciles exactly with the work log's "97 engine" and "321 app/script" (97 + 49 = 146,
272 + 49 = 321). `check-links`, `check-vendor` and `content:check` all pass. The browser suite
needs a dev server and backend that this worktree no longer has.

## Findings

Ranked by severity. File references are at `9dd186a` unless they name `node_modules`.

### 1. Blocking — a toast raised from a modal pop-up is not announced and not keyboard-reachable

`web/toast.tsx:78`, `web/main.tsx:33-35`, `web/components/overlay-card.tsx:46-66`.

`OverlayCard` uses `DialogPrimitive.Root` without a `modal` prop, so Base UI's default
`modal={true}` applies. In that mode `FloatingFocusManager` calls `markOthers` with
`ariaHidden: modal` at
`node_modules/@base-ui/react/floating-ui-react/components/FloatingFocusManager.js:345-347`, which
sets `aria-hidden="true"` on every element outside the dialog's portal. The dialog portals to
`<body>` by default, so `#root` — and therefore the whole toast viewport — is one of those
outside elements. `markOthers` exempts only elements carrying a literal `[aria-live]` attribute
(`node_modules/@base-ui/react/floating-ui-react/utils/markOthers.js:93`). `web/toast.tsx:78` renders
`<ol className="toast-viewport" data-toast-viewport>` with no `aria-live`; `role="alert"` on the
child `<li>` does not match that selector and is not announced from inside an `aria-hidden`
subtree. The same focus trap keeps Tab from reaching the Dismiss button.

Failure scenario: the Director opens `Table settings`, presses `Rewind` on a stale window, the
operation is rejected, and a screen-reader user receives nothing at all — no announcement and no
tabbable dismiss — while the sighted user sees a red panel. Before this slice the same failure
rendered an inline `ErrorNotice` with `role="alert"` **inside** the pop-up, where it was both
announced and in the trap. This is a regression introduced by pairing item 1 with item 2, and it
defeats the slice's own acceptance check 5 and the spec sentence added at `docs/table-spec.md:409`
("one fixed, screen-reader announced toast region").

Suggested fix, two lines: render the `<ol>` unconditionally (so the live region pre-exists rather
than being inserted with its first message) and give it `aria-live="assertive"`, which both makes
it a real live region and earns the `markOthers` exemption. Worth also passing an explicit
`modal="trap-focus"` or an `initialFocus`-style escape only if keyboard dismissal is wanted inside
the trap; the `aria-live` change alone restores the announcement.

I verified this by reading the installed dependency source, not with a screen reader. It is settled
in the running app by opening the settings pop-up, provoking a failure, and reading
`document.getElementById('root').getAttribute('aria-hidden')` — the finding predicts `"true"`.

### 2. Medium, non-blocking — dismissing a toast also closes the settings pop-up

`web/components/overlay-card.tsx:76-79`, `web/toast.tsx:49-59`, `web/style.css:316-318`.

`OverlayCard` does not pass `dismissible={false}`, so Base UI's `useDismiss` outside-press handling
is active (`node_modules/@base-ui/react/dialog/root/useDialogRoot.js:28-45`). The toast viewport is
outside the dialog, and it is painted above the dialog's internal backdrop (z-index 90 against the
backdrop's `auto`), so it receives the click. A Director whose `Rewind` is rejected and who clicks
`Dismiss` on the resulting toast loses the settings pop-up along with it and has to reopen it to
retry. Non-blocking because the state is recoverable and nothing is lost, but it is a new and
surprising interaction between the slice's two items.

### 3. Medium, non-blocking — `errorMessage` can return an empty string and raise a blank toast

`web/ui.tsx:14-26`, `web/ui.tsx:52`, `web/toast.tsx:43-59`.

When a Convex deployment reports a non-`ConvexError` server exception without detail, the client
message is exactly `[CONVEX M(commands:submit)] [Request ID: …] Server Error`. After the two
bracket strips and `^\s*Server Error\s*`, `errorMessage` returns `''`. `useCommand` passes that to
`showError` unconditionally, and `ToastItem` renders a bordered red panel containing an empty
`<span>` and a Dismiss button — a red box with no text. Before this slice `ErrorNotice` returned
`null` for an empty string (`web/ui.tsx:63`), so nothing was drawn. The same applies to a thrown
non-`Error` value that stringifies to `"Server Error"` or to whitespace. Suggested fix: in
`errorMessage`, return a fallback such as `'The operation failed.'` when the stripped result is
empty, or guard in `useCommand` before calling `showError`.

### 4. Medium, non-blocking — the new test's "no error block" assertion is wrongly scoped

`tests/browser/v21-log.spec.ts:82`, against `web/table/log.tsx:375` and `web/table/index.tsx:93`.

The assertion is `expect(director.locator('[data-log-pane] [role="alert"]')).toHaveCount(0)` with
the comment "no error block beside the control that submitted it". The failing command is submitted
through the command line, and `CommandLine` is rendered at `web/table/index.tsx:93` as a sibling
*after* `</LogPane>` at line 89 — outside the `[data-log-pane]` div that `web/table/log.tsx:375`
opens. The removed `ErrorNotice` lived in `web/table/command-line.tsx`, inside that sibling. The
assertion therefore passes vacuously and does not establish acceptance checks 4 or 6 for the control
it names. The property itself does hold (I established it statically under check 6); the test does
not prove it. Scoping the locator to the command line, or simply asserting
`page.locator('[role="alert"]')` has count 1 (the toast), would fix it.

### 5. Medium, non-blocking — states where a player loses a history control they had before

`web/table/log.tsx:108`, `web/table/log.tsx:389` (removed line), `web/table/log-entry.tsx:282-300`.

The old toolbar rendered for every non-observer while a session was running, in the sticky pane
header, independent of the feed's contents. The inline buttons render only when the target entry is
itself rendered. Two reachable states lose the control:

- The ROLLS tab filters the feed to `hasDice` entries (`web/table/log.tsx:108`). A player whose undo
  target is a dice-less entry — a condition application, a resource adjustment — sees no Undo
  while that tab is selected.
- The feed paginates with `before` (`web/table/log.tsx:91-94`). A player who has paged back to older
  entries has neither target rendered and so no history control at all.

Separately, the availability and reason line is now Director-only: `HistoryRow` shows
"Nothing to rewind · history does not cross …", but a player for whom undo is unavailable simply
sees no button and is told nothing, where the old toolbar showed a disabled button plus
"Nothing to undo · history does not cross …" and "Player undo is off." No authority changes and
the server re-checks every call, so this is an affordance and explanation regression, not a
permission one. The slice document does not acknowledge it; it should either be accepted
explicitly in the work log or given a fallback (for example, keeping the reason line on the log pane
for players).

### 6. Low, non-blocking — focus is destroyed when a focused toast auto-expires

`web/toast.tsx:44-47`. A keyboard user who tabs to `Dismiss` and then reads the message for ten
seconds has the button removed from under them by the `LIFETIME_MS` timer, dropping focus to
`<body>` and losing their place in the page. Nothing *steals* focus, so the acceptance check's
wording is satisfied, but pausing the timer on hover or focus-within is the usual remedy.

### 7. Low, non-blocking — the envelope regexes are not anchored to the envelope

`web/ui.tsx:24-25`. `^\s*Server Error\s*` and `^\s*Uncaught (?:Convex)?Error:\s*` run on any
message, including one that never carried a Convex envelope, and will eat a legitimate operation
message that begins with those words. No current operation message does, and a `ConvexError` with
string `data` short-circuits at line 17 before the strips run, so the exposure is limited to
`ConvexError`s with non-string `data` and to plain thrown values. Applying the strips only when the
bracket tags were actually present would remove the class of bug.

### 8. Low, non-blocking — the `.gitignore` hunk is unrelated and names a file that is absent

`.gitignore:13-16`. The added comment reads "Core-book page scans and upstream font archives kept
as local design reference only … the README is tracked", and the hunk un-ignores
`docs/design-mockups/v1/reference/README.md`. That file does not exist and is not tracked:
`git ls-files docs/design-mockups/v1/reference/` returns nothing, and the directory on disk holds
the two feedback screenshots plus `core-books/` and `fonts/`. The negation is therefore inert and
the comment is wrong. The hunk is also repository hygiene about core-book scans and fonts, not V29
work, folded into a feature commit against the "one logical change per commit" rule in
`docs/build/README.md`. It is defensible as a licence-safety guard, but the comment should be
corrected or the README actually added.

### 9. Low, non-blocking — the spec sentence misstates where a player's Undo went

`docs/table-spec.md:403-405`. "Rewind / Undo, Redo and Enable user undo leave the strip V21 put
under the LOG / RULES / ROLLS tabs and become rows of the same settings pop-up." A player's Undo
never becomes a row of that pop-up — the pop-up is the Director's, and a player's Undo keeps the
inline placement it already had. The clause three lines later corrects this, but the leading
sentence read alone is wrong about the Director-only surface. Otherwise the added text is accurate
against the code and is correctly labelled **User decision, 2026-09-16** rather than an assumption,
as is the paired "Confirmed 2026-09-16" edit at `docs/table-spec.md:1557-1560`.

### 10. Low, non-blocking — `bottom: 5.5rem` is an eyeballed constant with nothing holding it true

`web/style.css:320`. The offset is matched by inspection to the table's pinned command line rather
than derived from a token or measured from the command line, and no test asserts the clearance; a
later change to the command line's height silently breaks it. On non-table routes it covers no
fixed control — the only `bottom-0` rule in the codebase is the scoped select footer at
`web/components/ui/select.tsx:168` — but a 28 rem opaque panel does float over ordinary page
content at the bottom right of any scrolled page.

### Layering, checked and clear

Answering the layering question directly, because it is the one place the implementation is right
for a non-obvious reason. `.toast-viewport` (z-index 90) lives inside `#root`; `.overlay-card`
(81) and `.overlay-card-backdrop` (80) are portalled to `<body>`. Neither `#root` nor the portal
node creates a stacking context — `index.html` styles neither, `grep` finds no `#root` rule in
`web/style.css`, and the only `isolate` classes in the tree are inside the unused shadcn
select/tooltip/dialog primitives. Both therefore participate in the root stacking context, where
90 > 81, so a toast raised from inside the settings pop-up does paint above it. Verified by reading
the CSS and the DOM structure, not from a screenshot of that combination — the committed evidence
screenshots do not show a toast and an open pop-up at the same time.

## Claims I could not reproduce

1. **The browser suite results.** "Two full runs … 20 of 21 pass … 18 pass, with
   `closeout.spec.ts` and `rule-popup.spec.ts` failing on harness timing … both pass when re-run
   together, so they are flakes." Not reproducible here: this worktree has no dev server and no
   backend. This run is the only evidence offered for the behavioural halves of acceptance
   checks 2, 3 and 5.
2. **The branch base.** The work log says `slice/V29` was "cut from `main` at `14b7536`". The commit
   under review has parent `8ef8b5e`; `14b7536` is an ancestor seven commits back. The six
   intervening commits are all `docs(V26)`, so no code differs and the risk is nil, but the branch
   as committed was not cut where the log says.
3. **The commit identity.** The Chords broadcast for this slice names the build as `5e94c06`; the
   commit under review is `9dd186a`. Neither the work log nor `STATUS.md` records a rebase or
   re-commit, so the reader cannot tell that the recorded verification predates the reviewed tree.
4. **`pnpm check-links` (166 files).** It reports 169 here. The difference is consistent with
   claim 2: the V26 documentation commits added Markdown files under `docs/` after the verification
   run. Taken with claim 3, the `Verified:` trailer describes the pre-rebase tree, not `9dd186a`.
   Because the intervening commits are documentation only, I consider the code verification still
   applicable — but the work log should say so rather than leave the reader to work it out.
5. **`tests/browser/acceptance-extension.ts` "now resolves them to the inline buttons".** The file
   is not in the diff and its assertions say nothing about placement, so this is an inference about
   selector resolution, not coverage. See acceptance check 3.
6. **Evidence screenshots.** These I *could* check, and they show what is claimed:
   `.playtest/v21/log/error-toast-dark-1440x900.png` (one toast, `/test roll needs an @actor.`, no
   envelope, clear of the command line, no toolbar under the tabs) and
   `.playtest/v21/rosters/settings-dark-1440x900.png` (the two history rows in the Director's card).
   They are implementer-produced artefacts that I inspected rather than regenerated.

### The `table-audit.spec.ts` pre-existing failure — independently confirmed

The claim holds. `pnpm content:check` reports the committed snapshot as **467 entries** at revision
`fb83a789da8f`, while `tests/browser/table-audit.spec.ts:87` asserts `contentStatus.entryCount`
is **403** (line 88 asserts the same revision the snapshot has, so only the count is stale).
`git log -1 -- tests/browser/table-audit.spec.ts` returns `e83930e` — the V21 commit of
2026-09-15, before this slice. `9dd186a` touches no file under `shared/content/`, no ingestion
script and not that spec. The mismatch that causes the failure is therefore real, pre-existing and
unrelated to V29, and leaving it to the owning track is the right call. I confirmed the mismatch,
not the test failure itself, since I did not run Playwright.

## Other checks, passing

- **No authority, operation, argument or audience boundary changed.** The commit contains no
  `convex/` file. `history.undo`, `history.rewind`, `history.redo` and `campaign.user-undo` keep
  their ids, `roles`, `session` and `actor` gates and their `eventArg` validators
  (`convex/lib/history.ts:745-875`). The new inline Redo submits
  `/history redo event="<id>"`, and `history.redo` already accepted `event` and validates the
  requested unit against the top of the redo path server-side
  (`convex/lib/history.ts:829`, `redoWindow` at `:355-383`). `enableUserUndo` was already in the
  Director-only roster settings projection (`convex/table.ts:57`, `convex/lib/audience.ts:13`), so
  the new switch reads nothing newly exposed. The old toolbar was gated on `running`, and the new
  `HistoryRow` disables its buttons from the same `history.status` reasons, so no previously gated
  control became live.
- **No double announcement.** The `<ol>` carries no `aria-live`, so the only announcement per toast
  is the item's own `role="alert"`; there is no nested live region. (That same absence is what
  causes finding 1 — the fix should add `aria-live` to the `<ol>` and leave `role="alert"` on the
  items, or move to a single region, but not duplicate both.)
- **No caller left relying on stale state.** `grep` for `command.error`, `addition.error` and
  `deletion.error` across `web/` returns nothing, and `useCommand` no longer returns `error`
  (`web/ui.tsx:59`), so the type checker would have caught any survivor — it passes. The two
  consumers that genuinely read the old flag, `web/command-input.tsx:57,79` and
  `web/table/command-line.tsx:108,113-116`, were converted correctly: both now clear `last` on
  failure instead of suppressing the `Recorded:` line while an error was set, which is a small
  improvement (the old form re-showed a stale `Recorded:` line as soon as the error cleared).
- **Provider and hook contract.** `useToast` returns a stable callback and falls back to
  `console.error` outside a provider rather than throwing (`web/toast.tsx:32-41`), so a unit test
  mounting one component cannot crash. In the application the fallback is effectively unreachable:
  the only `root.render` path without `ToastProvider` is the "Connect a development backend" card
  (`web/main.tsx:16-25`), which mounts no hooks.
- **Duplicate replacement, cap and timers.** `show` filters an identical message out before
  appending a new id (`web/toast.tsx:69-72`), so a repeat replaces rather than stacks and its timer
  restarts, which is what the doc comment claims. `.slice(-MAX_TOASTS)` keeps the newest four and
  unmounts the rest, clearing their timers. Under React StrictMode the `ToastItem` effect's cleanup
  clears the timeout before the remount sets a new one (`web/toast.tsx:44-47`), and its deps
  (`toast.id`, the stable `dismiss` callback) do not churn, so there is no leak and no early
  expiry. `nextId` is a `useRef` on a provider that is never remounted, so ids stay unique.
- **The removed inline notices did not take the only announcement of a failure anywhere.** The three
  non-command notices removed — the sign-out failure (`web/components/session-user.tsx:50-72`),
  the invitation copy failure (`web/campaign/invite.tsx:34-40`) and the table-entry cancellation
  failure (`web/table/index.tsx:39-52`) — all now route to the toast, and none had a second
  presentation that also disappeared. The invitation card keeps its separate `sr-only role="status"`
  success line. Counting the diff: 46 `<ErrorNotice>` renders were removed, of which 43 were fed by
  a command hook (37 `command.error`, 3 `addition.error`, 3 `deletion.error`) and 3 were the
  transient non-command notices, which matches the work log exactly.
- **`STATUS.md` matches reality.** The V29 row records "Built on `slice/V29`, not merged", the
  worktree, the isolated backend identity, the checks that pass, the `table-audit.spec.ts:87`
  exception and that the user's playable app on `5180` still runs `main`. All of that is consistent
  with what I found, subject to the commit-identity and file-count discrepancies above. The row
  correctly does not claim a merge or a runtime update, which is what the merge-completion directive
  requires of a branch handoff.
- **Commit format.** Type, slice, lower-case summary without a period, prose body, three resolving
  `Spec:` anchors, a `Verified:` line naming only commands that were run, and
  `Rules-Review: not required` as an explicit value. `scripts/check-commit.ts --rev 9dd186a` agrees.

## What would move this to `pass`

1. Fix finding 1 (`aria-live` on an unconditionally mounted viewport) and confirm in the running app
   that `#root` no longer hides the region, or that the region is exempted, while a pop-up is open.
2. Re-run the browser suite against an isolated backend and record it, so acceptance checks 2, 3
   and 5 rest on an executed assertion rather than on a previous tree's run — and extend
   `v21-log.spec.ts` to cover check 3's placement and to fix the scoping in finding 4.
3. Either address finding 5 or record the accepted loss in the slice's work log.
4. Correct the work log's base commit, commit identity and file counts so the `Verified:` evidence
   is attributable to `9dd186a`.

Findings 2, 3 and 6 to 10 are worth fixing but none of them blocks.

## Re-verification — 2026-09-16, `b2ce3a3`

Second round, same reviewer, against the amended commit `b2ce3a3` (39 files, +1112 / -205), which
replaces `9dd186a` in the same worktree. `git diff 9dd186a b2ce3a3` touches seven files:
`web/toast.tsx`, `web/ui.tsx`, `web/style.css`, `tests/browser/v21-log.spec.ts`,
`docs/table-spec.md`, `docs/build/V29-desktop-feedback.md` and this review document, which the
implementer committed as it stood. `.gitignore` is byte-identical between the two commits — see
the blocking item below.

An isolated backend (`anonymous:anonymous-agent` at `127.0.0.1:3210`) and a dev server at
`127.0.0.1:5183` were available this round, so the browser evidence is my own rather than the
implementer's.

### Checks I ran this round

- `SALIENT_TEST_URL=http://127.0.0.1:5183 VITE_SITE_URL=http://127.0.0.1:5183 pnpm exec playwright
  test` — **20 passed, 1 failed, 8.9 minutes**, at a one-minute load average between 1.6 and 6.7,
  so no result here is a loaded-machine artefact. The single failure is
  `tests/browser/table-audit.spec.ts:87`, reported verbatim as `Expected: 403 / Received: 467`.
  That is the pre-existing stale content count, now confirmed by execution rather than inferred.
- `pnpm lint` — exit 0. `pnpm exec tsc -p tsconfig.web.json` — exit 0.
- `pnpm exec vitest run --project app --project scripts` — 35 files, **321 tests**, all passing.
- `pnpm exec vitest run --project engine` — 14 files, **97 tests**, all passing.
- `pnpm check-links` — **170** Markdown files. `pnpm check-vendor` — 2 submodules match.
  `pnpm content:check` — 467 entries, revision `fb83a789da8f`.
- `node scripts/check-commit.ts --rev b2ce3a3` — "commit message ok".
- A throwaway probe under `/tmp/v29probe/` (outside the repository; the worktree is clean) to
  settle finding 2. Detail below.

Every count in the commit's `Verified:` trailer and in the work log — 97, 321, 170, 20 of 21 —
reproduces exactly.

### Acceptance checks, re-stated

1. **verified.** `grep -rn 'role="toolbar"' web/ tests/` still returns nothing, and
   `tests/browser/v21-log.spec.ts:25` — which asserts it on the live table route — now passed in
   my own run (31.8 s).
2. **verified.** Same spec, executed. It opens `Table settings`, asserts the `Enable user undo`
   switch, clicks `Rewind`, reads `li[data-dice="true"][data-disposition="undone"]` back from the
   feed, clicks `Redo` and reads the count back to zero. Persisted disposition, read through the
   application, not a mutation response.
3. **verified.** This was the weakest check last round and is now the best covered. The spec rolls
   as the player, waits for the second dice entry to land, captures its `data-sequence`, asserts
   the inline `Undo` is on that entry **and** that the feed holds exactly one `Undo` button,
   clicks it, reads that sequence back as `data-disposition="undone"`, then asserts and clicks the
   inline `Redo` and reads it back as `redone`. That is placement plus round trip, executed.
4. **verified.** Executed: one toast, `role="alert"`, text matching `/test roll needs an @actor.`,
   containing neither `Server Error` nor `ConvexError`.
5. **verified** — the finding that failed this check last round is fixed and the fix is now
   guarded behaviourally. See "the blocking finding, re-checked" below.
6. **verified.** The vacuous locator is gone; the spec now asserts `getByRole('alert')` has count
   1 across the whole page and that the one alert is inside `[data-toast-viewport]`.
7. **verified.** I reran every command myself, including the browser suite, with the results
   above. The suite is 20 of 21 with only the pre-existing content count failing.

### The blocking finding, re-checked

Fixed, and the regression test is sound. `web/toast.tsx:97` now renders the region unconditionally
as `<ol className="toast-viewport" data-toast-viewport aria-live="assertive" aria-label="Errors">`,
and `web/style.css:316-337` gives it `pointer-events: none` with `.toast-viewport:empty { display:
none }` and `pointer-events: auto` on each toast, so the always-present region neither draws nor
intercepts a click when it is empty.

The implementer asked me to confirm the reasoning and that the test would fail without the fix.
Both hold, and I traced the mechanism rather than taking it on trust:

- `markOthers` collects `body.querySelectorAll('[aria-live]')` into its keep set and then walks
  down from `<body>` marking everything that is neither a keep element nor an ancestor of one
  (`markOthers.js:93` and `collectOutsideElements` at `:52-70`). `buildKeepSet` adds every
  ancestor of the `<ol>`, so `#root` is now walked into instead of hidden; the router subtree
  inside it is still hidden, which is the correct modal behaviour; and the `<ol>` is in
  `stopElements`, so it is neither hidden nor descended into. The attribute query ignores CSS, so
  `display: none` while empty does not cost the exemption.
- On the unfixed code the region was mounted with its first message and carried no `aria-live`, so
  `#root` was outside the keep set and took `aria-hidden="true"` wholesale.
- The spec's two assertions therefore discriminate. The `#root` assertion —
  `not.toHaveAttribute('aria-hidden', 'true')` — fails directly on the old code, and
  Playwright's role engine excludes elements hidden from assistive technology, so
  `getByRole('alert')` would resolve zero inside that subtree rather than one. Raising the toast
  *before* opening the pop-up, as the spec does, is the harder case and the right one to assert.

One caveat on the announcement itself, which no automated check can settle: `display: none` keeps
the empty region out of the accessibility tree, so the announcement still comes from the inserted
`<li role="alert">` rather than from the container being a pre-existing live region. That is the
same mechanism as before and is fine; the `aria-live` attribute's load-bearing job here is the
`markOthers` exemption, which is exactly what the code comment says. I see no double announcement
risk: a mutation is attributed to the innermost live region, which is the `<li>`.

A residual flake risk, low: the spec raises the toast and then opens the pop-up while the
ten-second lifetime runs, so the `getByRole('alert')` assertion has to land inside that window. It
did comfortably in my run, and the toast holds its lifetime only on hover or focus, neither of
which applies here. If that assertion ever flakes, this is why.

### Finding 2 — withdrawn, disproven in the running app

I was wrong. The settings pop-up **survives** a toast dismissal.

I ran a probe at `/tmp/v29probe/toast-dismiss.spec.ts` (outside the repository, with a
`node_modules` symlink and its own config, reusing the repo's `createTable` fixture): open the
table as Director, raise a toast from the command line, open `Table settings` over it, click the
toast's `Dismiss`, then read the dialog's visibility. Output:

```
PROBE RESULT: settings pop-up still open after toast Dismiss = true
1 passed (12.6s)
```

My first-round reading cited only the inside/outside test at
`node_modules/@base-ui/react/floating-ui-react/hooks/useDismiss.js:88` and missed the guards in
`closeOnPressOutside` (`:226-320`), which run in the `intentional` press mode the dialog selects
whenever a backdrop is mounted (`dialog/root/useDialogRoot.js:29-39`). I did not isolate which of
those guards is decisive, and I do not need to: the behaviour is verified, so the finding is
withdrawn and the work log's "recorded as reported rather than confirmed or denied" should be
updated to record it as disproven.

Worth one line in the slice record, not a finding: the app never opts out of outside-press
dismissal explicitly, so this good behaviour rests on Base UI internals and could change under a
dependency bump. The spec does not cover it. An assertion costs three lines if anyone wants it.

### The other findings

- **3 (empty toast) — fixed.** `web/ui.tsx:8` adds `UNREADABLE_FAILURE` and `:34` returns
  `text.trim() || UNREADABLE_FAILURE`, so a message that is nothing but envelope can no longer
  raise a blank panel.
- **4 (vacuous assertion) — fixed**, as described under acceptance check 6.
- **5 (player reachability) — accepted and recorded**, which is a legitimate disposition. The work
  log names all three states and, better than I asked for, notes that `/history undo` and
  `/history redo` stay available from the command line; `docs/table-spec.md` records the same, so
  the fallback is in the owning spec and not only in the build document.
- **6 (focus on auto-expiry) — fixed.** `web/toast.tsx:88-96` holds the lifetime on
  `onMouseEnter`/`onFocusCapture` and releases it on leave/blur, with the timer effect keyed on
  `held` (`:84-89`).
- **7 (unanchored regexes) — fixed.** `web/ui.tsx:26-33` computes `wrapped` from a
  `/\[CONVEX[^\]]*\]/` test and applies the two anchored strips only when it is true.
- **9 (spec sentence) — fixed.** `docs/table-spec.md` now reads "the Director's Rewind, Redo and
  Enable user undo become rows of the same settings pop-up … The pop-up is the Director's, so a
  player's undo and redo are not in it", which is what the code does.
- **10 (`bottom: 5.5rem`) — addressed as well as it can be.** The constant stays, but the spec now
  compares the toast's bounding box against the command line's and asserts the clearance, so a
  later change to the command line's height fails a test instead of passing silently.
- **My unreproducible claims 2, 3 and 4 — corrected.** The work log now records that the branch
  was cut at `14b7536` and rebased onto `8ef8b5e`, that the first build was `5e94c06` and
  `b2ce3a3` is the commit to read, and that `check-links` counts 170.

### Blocking: the work log records a change the tree does not contain

*Resolved on `4bb2879`; see [the close-out](#close-out--2026-09-16-4bb2879) below.*

`docs/build/V29-desktop-feedback.md` (the review-response entry) states: "the `.gitignore` hunk was
unrelated to this slice and is reverted, with the two feedback screenshots kept under
`.playtest/v29/` instead". Half of that is true and half is not.

- True: the screenshots moved. `.playtest/v29/` holds
  `2026-09-16-error-notice-overlap.png` and `2026-09-16-history-toolbar-feedback.png`, and
  `docs/design-mockups/v1/reference/` now holds only `core-books/` and `fonts/`.
- Not true: the hunk is not reverted. `git show b2ce3a3:.gitignore` still ends with the five added
  lines, `git show b2ce3a3 --stat` still lists `.gitignore | 5 +`, and
  `git diff 9dd186a b2ce3a3` does not touch the file at all. The comment still claims "the README
  is tracked" while `git ls-files docs/design-mockups/v1/reference/` returns nothing.

No code is wrong and nothing runtime-visible depends on this; the hunk is in fact now a more
accurate description of that directory than it was, since only scans and fonts remain in it. What
blocks is the mismatch itself. The lead is about to fast-forward `main` with a slice record that
asserts a change the commit does not contain, and the project's standing rule is that a claim needs
evidence in this checkout. I raised the finding, it was reported back to me as done, and it was
not done — which is precisely the class of thing an independent review exists to catch.

Either resolution clears it, and both are about a minute's work:

1. Actually revert the hunk, or
2. keep it, and correct the work log to say it was kept deliberately now that the directory holds
   only core-book scans and font archives — and in that case drop or fix the "the README is
   tracked" sentence, since there is no such file.

### The implementer's other open question

The inline Redo is asserted only in `tests/browser/v21-log.spec.ts` and not in
`tests/browser/acceptance-extension.ts`. That is fine and I would not change it. The new coverage
in `v21-log.spec.ts` asserts placement, exclusivity and the persisted round trip for both inline
buttons, which is strictly more than `acceptance-extension.ts` ever did; duplicating it in a second
long serial spec would add runtime and flake surface for no additional guarantee.

### Claims from this round I could not reproduce

One, listed above: the work log's statement that the `.gitignore` hunk is reverted. Everything else
in the work log and in the commit's `Verified:` trailer reproduced exactly, including the browser
suite's 20 of 21 and the identity of the one failure.

## Close-out — 2026-09-16, `4bb2879`

The blocking item is fixed. `4bb2879` amends `b2ce3a3`; the implementer's account of the earlier
failure is consistent with what I found — `git checkout -- .gitignore` restores from the index,
which already held the hunk, so it reverted nothing.

Verified on `4bb2879`:

- `git diff 8ef8b5e 4bb2879 -- .gitignore` is empty, and the file now ends at `public/rules-data/`
  with no reference hunk.
- `git show 4bb2879 --stat` lists 38 files and contains no `.gitignore` and nothing under
  `docs/design-mockups/`. `git ls-tree -r 4bb2879 -- docs/design-mockups/v1/reference/` is empty,
  so the path is absent from the commit and from the index.
- `git diff b2ce3a3 4bb2879 --stat` is exactly two files: `.gitignore` (−5) and this review
  document, which the implementer committed as it stood. Nothing executable changed.
- The work log sentence is unchanged and is now accurate in both halves: the hunk is gone, and
  `.playtest/v29/` holds `2026-09-16-error-notice-overlap.png` and
  `2026-09-16-history-toolbar-feedback.png`. `.playtest/` is ignored at `.gitignore:2`, so those
  screenshots stay out of Git.
- `node scripts/check-commit.ts --rev 4bb2879` — "commit message ok". `pnpm lint`,
  `pnpm check-links` (170) and `pnpm check-vendor` rerun clean.

**I did not re-run the browser suite, deliberately.** The only code-bearing difference between
`b2ce3a3` and `4bb2879` is the removal of five `.gitignore` lines, which nothing executable reads.
The 20-of-21 result recorded in the re-verification above is the evidence for `4bb2879`, carried
forward on that basis rather than re-observed.

One observation, not a finding and not blocking. Removing the rule is right for V29 — the hunk was
never this slice's work — but its net effect today is that
`docs/design-mockups/v1/reference/` is untracked-and-unignored in this worktree, and it holds
core-book page scans, a font archive and a font licence that must never be committed. No check
breaks (the directory holds only `.jpg`, `.otf`, `.pdf`, `.txt` and `.zip`, so lint, prettier and
`check-links` all skip it) and `git commit -a` cannot pick up untracked files, but `git add -A` in
this worktree would stage all of it. The stated plan — V28 re-adding the ignore rule with its
tracked README when it merges — is the right home for it. Until then, treat this worktree as one
where `git add -A` is unsafe.

## Final verdict

pass
