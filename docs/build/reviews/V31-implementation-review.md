# V31 history control placement — independent implementation review

Reviewer: independent implementation reviewer (fresh context; did not implement V31). Worktree
`/srv/presidium/projects/salient/ui`, branch `slice/V31`, commit `6c47704`, whose parent is
`f7137dc` — the merged V29 tip the work log says the branch was cut from, confirmed. No file
outside this review document was modified and no state-changing Git command was run.

One housekeeping note first, because it affects anyone reading `git status` after me. Running the
browser suite in this worktree overwrites `docs/build/evidence/V27-ability-*.png` and
`V27-undead-*.png` in place, exactly as the V29 Chords handoff warned. I restored all four
byte-for-byte from `HEAD` with `git show HEAD:<path> > <path>` after each run.

Three rounds, all on 2026-09-16, against three successive versions of one commit: `6c47704`, then
`da6a0a4`, then `21786fc`. Everything from here to "What would move this to `pass`" is the first
round and is kept unchanged as the record of what was found. The
[re-verification](#re-verification--2026-09-16-da6a0a4) against `da6a0a4` follows it, then the
[close-out](#close-out--2026-09-16-21786fc) against `21786fc`, which carries the verdict.

Each round's evidence belongs to the commit it names and to no other. That matters here more than
usual: the mechanism behind the blocking finding was rebuilt twice, so the round-two measurements
describe markup that `21786fc` no longer contains. The section between the two — "Uncommitted
divergence after the verdict" — records the working-tree changes I found mid-close-out, which
became `21786fc` and are reviewed in the close-out itself.

## First-round verdict — 2026-09-16, `6c47704`

**changes required** (superseded; see the re-verification below)

One blocking finding. The slice deletes every visible explanation of a history control and moves
what each control would act on, and why it is unavailable, entirely into the button's `title`. It
then puts that `title` on a button carrying the native `disabled` attribute and the shared
`disabled:pointer-events-none` class. In the unavailable state — the only state whose explanation
matters — the browser has no tooltip to show at that point and the control is out of the tab
order, so neither a sighted mouse user nor a keyboard user can learn the reason. I measured that
in the running app rather than inferring it. That is acceptance check 3 failing, and it is a
regression against what is merged and live on `main` today, where the Director's pop-up row
printed the reason as visible text. See finding 1; the fix is about three lines.

Everything else holds up well. No authority, operation, argument or audience changed, the commit
contains no `convex/` file, the render gate is still `running` and not an observer, the two
affordance losses V29 recorded are genuinely removed, and the browser suite is 22 of 22 once the
host is quiet. The slice makes no rules claim, and I found none in the diff.

## Spec sections read, by anchor

- `docs/table-spec.md#confirmed-combat-layout` (line 355), including the rewritten
  **User decision, 2026-09-16** bullet at lines 403–412.
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` (line 2823) and the
  confirmed-placement paragraph the diff actually edits at lines 1557–1562.
- `docs/design-tokens.md#component-baseline` (line 150).
- `docs/build/README.md` sections "Commit format" (line 80), "Review standard" (line 140),
  "Branch and merge policy" (line 158) and "Merge completion includes the playable app" (line 185).
- `docs/build/V31-history-control-placement.md` in full, including its acceptance checks and work
  log, and `docs/build/V29-desktop-feedback.md` with its amended accepted-losses paragraph.
- `docs/build/reviews/V29-implementation-review.md` in full, as the standard this review matches.

Supporting reads, for the authority question and the accessibility mechanics: `convex/history.ts`,
`convex/lib/history.ts` (the `history.undo` / `history.rewind` / `history.redo` /
`campaign.user-undo` definitions and the window reasons), `web/components/ui/button.tsx`,
`web/table/log-entry.tsx`, `web/table/index.tsx`, `web/style.css`, the V21 and V29 versions of
`web/table/history-controls.tsx`, and the installed `@base-ui/react` 1.8.0 `Button`, `useButton`
and `useFocusableWhenDisabled` sources. No online Draw Steel research was done; nothing under
`vendor/` was read for a rules claim or modified.

## Checks I ran

All read-only, in `/srv/presidium/projects/salient/ui` at `6c47704`, against the isolated backend
`anonymous:anonymous-agent` on `127.0.0.1:3210` with the dev server on `127.0.0.1:5183`.

- `SALIENT_TEST_URL=http://127.0.0.1:5183 VITE_SITE_URL=http://127.0.0.1:5183 pnpm exec playwright
  test` — **19 passed, 3 failed, 19.9 minutes**. Started at a one-minute load average of 2.9; the
  host climbed past 50 mid-run under peer-thread work. All three failures are load artefacts, and
  none touches this slice's surface:
  - `journey.spec.ts` — `Command failed: node scripts/app.ts query foes:list … Sign-in failed.`
  - `v21-campaign.spec.ts` — `page.evaluate: Target page, context or browser has been closed` at
    `tests/browser/v21-fixtures.ts:124` (the browser was killed).
  - `v21-rosters.spec.ts` — `page.screenshot: Timeout 15000ms exceeded … waiting for fonts to
    load` at `tests/browser/v21-fixtures.ts:148`, reached from `v21-rosters.spec.ts:100`, which is
    *after* that spec's settings-pop-up assertions at lines 71–92 had already passed.
- Re-run of exactly those three at a one-minute load average between 5.7 and 6.8 —
  **3 passed, 1.4 minutes**. The effective suite result is therefore **22 of 22**, which
  reproduces the work log's claim. `v21-log.spec.ts:26`, the spec that carries every new V31
  assertion, passed in the loaded full run as well, in 4.0 minutes.
- `pnpm lint` — exit 0 (`eslint .` and `prettier --check .` both clean).
- `pnpm exec tsc -p tsconfig.web.json` — exit 0.
- `pnpm exec vitest run --project app --project scripts` — 37 files, **336** tests, all passing,
  which is the work log's `check:app` count exactly.
- `pnpm exec vitest run --project engine` — 14 files, **97** tests, all passing, likewise exact.
  Neither needed a re-run: `tests/scripts/rules.test.ts` completed first time at load 4.
- `pnpm check-links` — **180** Markdown files, no broken relative links or anchors, which is the
  count the work log gives. `pnpm check-vendor` — 2 submodules match the pins.
  `pnpm content:check` — 467 entries, 10 excluded, revision `fb83a789da8f`.
- `node scripts/check-commit.ts --rev 6c47704` — "commit message ok". All three `Spec:` anchors
  resolve, `Rules-Review: not required` is an explicit value, and `Reviewed-By:` is absent, which
  is correct before this review and is the lead's `--merge` gate.
- A throwaway Playwright probe under `/tmp/v31probe/` (outside the repository, its own config,
  reusing `tests/browser/v21-fixtures.ts`'s `createTable`) to settle the two questions static
  reading cannot: whether a disabled control's tooltip is actually reachable, and where the
  absolutely positioned group sits as the pane narrows. Its output is quoted under the findings.

## Acceptance checks

### 1. A `History` group in the tab row: two icon controls, right names, no label, no new row

**verified.** `web/table/history-controls.tsx:66` renders
`<span role="group" aria-label="History" data-history-controls>` containing exactly two
`CommandButton`s (`:68` and `:77`). The names come from `undoLabel` at `:39-41`, so the Director
gets `Rewind` and everyone else `Undo`, and the second is always `Redo`. Executed:
`tests/browser/v21-log.spec.ts:90-96` resolves the group, asserts `toHaveCount(2)` on its buttons
and `toHaveText('')` on each, and `:134-136` asserts the player's group carries `Undo`. My probe
read the same tree back independently: `groupRole: "group"`, `groupLabel: "History"`, both buttons
`text: ""` with `ariaLabel` `Rewind` and `Redo`, each containing one `svg` with
`aria-hidden="true"`, each `28x28`.

No row is added. The group is `absolute right-0 bottom-1` inside the new relative wrapper at
`web/table/log.tsx:390-400`, so it is taken out of flow and the tablist keeps its own height.
`.playtest/v21/log/freeplay-director-dark-1440x900.png` and `combat-director-dark-1440x900.png`
show the tabs still centred with the pair at the right of the same row and nothing beneath them.

### 2. The icon Rewind marks the latest roll `undone`; Redo restores it

**verified**, by execution. `tests/browser/v21-log.spec.ts:101-109` clicks the icon `Rewind`,
reads `li[data-dice="true"][data-disposition="undone"]` back from the feed, then clicks `Redo` and
reads the count back to zero. That is persisted disposition read through the application, not a
mutation response, which is what the project's verification rule asks for. It passed in my run.

### 3. Each tooltip names its target or the reason it is unavailable; unavailable is disabled

**failed.** The second half of the clause holds and the strings themselves are right: my probe
read `title` as `"Rewind: #13 Heroes act first — chosen by Director 60e12697 (Director
authority); the d10 (6) entitled the players. Round 1 begins."` on the available control and
`"Redo: Nothing to redo."` on the unavailable one, with `disabled` present on the latter. What
fails is that the unavailable control's tooltip cannot be shown and cannot be reached. Finding 1
carries the measurement and the fix.

### 4. The settings pop-up keeps `Enable user undo` and holds no Rewind or Redo

**verified.** `web/table/settings-popup.tsx:171-209` is four rows — Monster health display, Show
Malice, Show test difficulty, Enable user undo — and the `HistoryRow` component is deleted
outright. Executed: `tests/browser/v21-log.spec.ts:125-126` asserts the switch is visible and that
`settings.getByRole('button', { name: /Rewind|Redo/ })` has count 0. The screenshot
`.playtest/v21/rosters/settings-dark-1440x900.png` regenerated during *my* run (not the
implementer's) shows the four rows under the new `Campaign settings` eyebrow.

### 5. The inline per-entry Undo and Redo still appear on the right entries and still work

**verified.** `web/table/log-entry.tsx:281-301` is not in this diff, and its gate is still
`event.id === undoTarget` / `redoTarget`, derived from `history.status` at
`web/table/log.tsx:105-106`.
Executed: `tests/browser/v21-log.spec.ts:140-158` rolls as the player, captures the entry's
`data-sequence`, asserts the inline `Undo` is on that entry and that the feed holds exactly one,
clicks it, reads `data-disposition="undone"` back for that sequence, then does the same for
`Redo` and reads back `redone`. Every locator there is scoped to `feed(player)`, so the new header
pair cannot satisfy it by accident. See finding 4 for a coverage side effect elsewhere.

### 6. An observer sees no history control, and none renders outside a running session

**not verified by execution; verified statically, twice over.** There is no browser assertion for
either clause, in this diff or elsewhere — `grep` for an observer history assertion across
`tests/browser/` returns nothing. Statically the property is doubly gated:
`web/table/log.tsx:397` renders the pair only when `running && roster.role !== 'observer'`, and
`web/table/history-controls.tsx:63` returns `null` when the view has not loaded or
`view.role === 'observer'`. `running` is `roster.session?.status === 'running'`
(`web/table/index.tsx:61`), which is the same condition the server applies before it will report
any availability at all (`convex/history.ts:56-63`). I am confident in the property; it simply
rests on reading rather than on an executed assertion.

### 7. `pnpm lint`, `pnpm check:engine`, `pnpm check:app` and the browser suite pass

**verified.** All four reproduce here, with the counts under "Checks I ran". The browser suite
needs the host to be quiet: at a load average above about 30 it loses specs to font, sign-in and
browser-death timeouts that have nothing to do with this slice, and at load 6 it is 22 of 22.

## Findings

Ranked by severity. Line references are at `6c47704`.

### 1. Blocking — a disabled control's reason is unreachable, by hover and by keyboard

`web/table/setup-card.tsx:57`, with `web/components/ui/button.tsx:6` and
`web/table/history-controls.tsx:72` and `:81`.

V31 makes the tooltip the sole carrier of the explanation. The slice document says so in item 2:
"What each would act on, and why it is unavailable, moves entirely into the button's tooltip; the
grey explanation line V21 printed under the strip is gone." `CommandButton` then puts that string
on the `<Button>` itself (`setup-card.tsx:57`), and the same component sets `disabled` on that
button (`:56`). Two things follow from the shared button class at `button.tsx:6`, which contains
`disabled:pointer-events-none`, and from Base UI's `Button` defaulting `focusableWhenDisabled` to
`false` so the native `disabled` attribute is emitted
(`node_modules/@base-ui/react/utils/useFocusableWhenDisabled.js:41-42`):

- The disabled button is not hit-tested, so the browser resolves a hover to the element beneath it
  and looks for a `title` up *that* chain. There is none.
- The disabled button is out of the tab order, and no browser shows a `title` tooltip on focus in
  any case.

I measured both in the running app rather than reasoning about them. The probe hit-tests the
centre of each control and walks up from whatever it hits looking for a `title`:

```
Rewind (available): disabledAttr false, pointerEvents "auto", hitTarget "button",
                    nearestTitledFromHit "Rewind: #13 Heroes act first — chosen by Director …"
Redo (unavailable): disabledAttr true,  pointerEvents "none", hitTarget "span",
                    nearestTitledFromHit null
tabbable: [{"label":"Rewind","tabbable":true},{"label":"Redo","tabbable":false}]
```

`nearestTitledFromHit: null` is the whole finding: at the coordinates of the unavailable control
there is no `title` anywhere in the hit chain, so there is no tooltip to show. To answer the
question plainly, as asked: the reason is **not** available to a keyboard user at all, and it is
available to assistive technology only as an accessible description that some screen readers
announce in browse mode and others do not — it is not something the slice can rely on, and it is
not what acceptance check 3 promises.

This is a regression, and not only against V21. Both predecessors kept the reason reachable:

- V21 (`e83930e:web/table/history-controls.tsx:75-83`) printed it as **visible text** in a `<p>`
  under the strip, for every role, and additionally hung the `title` on a non-disabled wrapper
  `<span>` (`:51` and `:59`) so the tooltip survived the disabled button.
- V29, which is merged and live on `main` today, kept the visible line as the `SettingRow`
  description "Nothing to rewind · history does not cross …"
  (`7b80e56:web/table/settings-popup.tsx:158-165`) and again put the `title` on a wrapper
  `<span>` outside the button (`:167` and `:175`). So for the Director — the role that had a
  working explanation this morning — V31 is a straight loss.

The live consequence is not hypothetical. `.playtest/v21/log/combat-player-light-1440x900.png`,
an implementer-produced screenshot in this checkout, shows a player mid-combat with *both*
controls dimmed: a `History` group whose two buttons are unreachable by keyboard, carry no visible
text, and will not produce a tooltip. Nothing on the screen says why, and nothing in the tab order
even reveals that the group exists.

Because this defeats the check, it also falsifies three claims made in the slice's own record: the
commit message's "every role gets the reason line back in the tooltip", the work log's "the reason
line each control lost is back in its tooltip for every role", and the amended V29 paragraph
discussed in finding 3.

Suggested fix, and it is small. Move the `title` off the `<Button>` and onto the wrapper `<span>`
that `CommandButton` already renders at `setup-card.tsx:50` — that is precisely what V21 and V29
did, and it restores the hover tooltip in the disabled state at no visual cost. That leaves the
keyboard gap, so pair it with one of: passing `focusableWhenDisabled` through to Base UI's
`Button` so the control keeps focus with `aria-disabled` instead of `disabled` (Base UI already
supports this, and `useFocusableWhenDisabled.js:38-39` switches to `aria-disabled` for you); or
rendering the reason as an `sr-only` description referenced with `aria-describedby`. Note that the
second option would trip the new `toHaveText('')` assertion at `v21-log.spec.ts:95-96` unless the
assertion is relaxed, which is worth knowing before choosing.

Whatever is chosen, the regression test should assert reachability rather than the attribute's
presence, since `toHaveAttribute('title', …)` passes today while the tooltip does not work.

### 2. Medium, non-blocking — the pair overlaps the ROLLS tab as the centre pane narrows

`web/table/log.tsx:398`, against `web/style.css:55-58` and `:380-388`.

The group is `absolute right-0 bottom-1` and the tabs are centred by `justify-center`
(`web/table/log.tsx:217`), so the clearance between them is whatever the centre pane has left
over. The pane is a percentage of the viewport with no breakpoint anywhere in `web/style.css` —
`--pane-side-width: min(424px, calc(424 / 1440 * 100vw))` and a wider heroes column in combat —
so it narrows continuously. The group is also *after* the tablist in DOM order, so where it
overlaps it paints on top and takes the clicks.

Probe measurements, Director in combat, default root font size, all reporting
`groupInsideTablist: false` (see the passing structural check below):

| Viewport | ROLLS right | Group left | Clearance | ROLLS centre hit-tests to |
| --- | --- | --- | --- | --- |
| 1920 | 984 | 1272 | 288 px | `button[role=tab]` |
| 1440 | 744 | 792 | 48 px | `button[role=tab]` |
| 1280 | 671 | 695 | 24 px | `button[role=tab]` |
| 1152 | 614 | 617 | 3 px | `button[role=tab]` |
| 1024 | 556 | 540 | −16 px | `button[role=tab]` |
| 900 | 500 | 464 | −36 px | `button[aria-label=Rewind]` |

So the two collide from about 1152 CSS pixels of viewport width in combat, and by 900 the Rewind
button sits over the centre of the ROLLS tab and swallows its click. Free play is wider and
correspondingly safer. Browser zoom is the realistic route into this range on a desktop: 125 % in
a 1440-wide window is 1152 CSS pixels, and 150 % is 960.

Large text alone is *not* the problem, which is worth recording because it is the intuitive guess.
At a 32 px root font size in a 1440-wide window the tabs and the buttons scale together and the
clearance is still 16 px — the icon buttons are `size-7`, which is rem-based like the tab text.

I rank this medium rather than blocking: the mockups and the suite target 1440 and 1920, both of
which are clear, and mobile and tablet belong to V17. But nothing in the slice or the suite pins a
minimum width, and the failure mode is silent — a tab that looks present and cannot be clicked.
A flex row with the group as a `shrink-0` sibling and matching padding on the tablist would remove
the whole class of problem in about three lines while keeping the tabs optically centred; failing
that, the accepted lower bound should be written down.

### 3. Medium, non-blocking — the amended V29 paragraph claims more than the slice delivers

`docs/build/V29-desktop-feedback.md:168-176`.

The amendment reads: "and then not accepted: the user corrected this item the same day, and V31
returns Rewind and Redo to the table as an icon pair, **which removes both losses below**."

The paragraph below it records **three** losses, not two. The first two — a player with no history
button while the ROLLS tab filters the target entry out, and none at all after paging back — are
genuinely removed, and I verified that by reasoning about when the control renders rather than
trusting the claim: the pair's gate at `web/table/log.tsx:397` reads only `running` and the
viewer's role, while the tab filter and the `before` cursor are local state inside `GameLog`
(`web/table/log.tsx:90` and `:109`), and both buttons submit the bare `/history undo`,
`/history rewind` and `/history redo` forms with no event argument, so they act on the head of the
viewer's window regardless of what the feed happens to be showing. That half of the claim is
sound.

The third loss, in the same paragraph, is the explanation: "The availability and reason line … is
now Director-only: a player whose undo is unavailable sees no button and no explanation." Finding
1 is exactly that loss, unfixed and now extended to the Director as well. The amendment should say
"two of the three losses below", and the third should be re-recorded honestly or fixed.

### 4. Medium, non-blocking — an existing journey silently changes which control it exercises

`tests/browser/acceptance-extension.ts:124` and `:128`, against `web/table/log.tsx:397`.

Those two lines are `getByRole('button', { name: 'Undo'|'Redo', exact: true }).first().click()`,
unscoped. The V29 review recorded that after V29 they resolved to the inline per-entry buttons "as
a side effect of the toolbar's removal". V31 puts a control with the accessible name `Undo` back
into the pane header, which precedes the feed in DOM order, so `.first()` now resolves to the
header icon pair again. The file is not in this diff and neither is its comment.

The assertions still pass — `wizard.spec.ts`, the only importer, passed in my run in 2.4 min —
because the bare `/history undo` acts on the same unit the inline button would have targeted in
that scenario. So this is not a correctness defect. It is a coverage one: the inline per-entry
placement that V29 confirmed is now exercised only by `tests/browser/v21-log.spec.ts:140-158`, and
a reader of `acceptance-extension.ts` will believe otherwise. Scoping those two locators to the
feed, as `v21-log.spec.ts` already does, costs one line each and makes both specs mean what they
say. I established the resolution order structurally, from the render order in `log.tsx`, not by
instrumenting that journey.

### 5. Low, non-blocking — one of the new title assertions does not discriminate

`tests/browser/v21-log.spec.ts:98`.

`await expect(rewind).toHaveAttribute('title', /^Rewind: /)` matches every possible value of that
attribute. `availability()` at `web/table/history-controls.tsx:44-48` always returns
`` `${label}: …` ``, for the target branch and the reason branch alike, so the regex cannot tell
"names the entry it would act on" from "says why it is unavailable" — which is the distinction
acceptance check 3 draws. The Redo assertion at `:99` is properly specific
(`/^Redo: Nothing to redo/`, matching `convex/lib/history.ts:367`) and does discriminate, as do
`toHaveText('')` at `:95-96` (an empty locator would fail rather than pass, and a visible label
would break it), the disabled-to-enabled transition at `:100` and `:105`, and the pop-up's
`toHaveCount(0)` at `:126`. None of those is vacuous. Only `:98` is. Asserting
`/^Rewind: #\d+ /` in the available state would fix it.

### 6. Low, non-blocking — a stale comment in the file the slice edits

`web/table/log.tsx:97-99`.

"V29 moved the Director's toolbar into the table settings pop-up, so these inline buttons are the
log's own history affordance." That is no longer true as of the commit that contains it: the pane
header carries the pair again, three hundred lines further down the same file.

### 7. Low, non-blocking — engineering choices are recorded inside a **User decision** block

`docs/table-spec.md:400-412`.

The rewritten bullet is accurate about the code, and labelling the correction as the user's is
right — the quoted instruction in `docs/build/V31-history-control-placement.md` is "Actual undo
redo buttons can stay in the main UI. Though they should get a discreet icon control instead of
big buttons." But two sentences inside the **User decision, 2026-09-16** block go beyond it: "at
the right-hand end of the LOG / RULES / ROLLS tab row" and "What each would act on, and why it is
unavailable, is the control's tooltip." Neither is in the user's correction; both are the
implementer's choices, and the second is the one finding 1 says is wrong. The project rule is to
distinguish confirmed requirements from proposals and assumptions, so these belong in an
implementation note under the decision, not inside it.

Two smaller points in the same area. The block's lead-in at line 400–401 still reads "two further
placements, recorded in V29" and does not name V31, so a reader following the reference lands on
the superseded account. And the commit's `Spec:` anchor
`#undo-permissions-and-proposed-campaign-control` resolves to line 2823, but the paragraph the
diff actually edits is at line 1557, under `### Director edits to inline results`. The anchor
check passes and the cited section is the right owner of the meaning, so this is a note rather
than a defect — V29 did the same — but the trailer does not point at the edited text.

### 8. Low, non-blocking — focus is destroyed when a control disables itself under the user

`web/table/history-controls.tsx:75` and `:84`.

A keyboard user who activates `Rewind` and thereby exhausts the window has the focused button
given a native `disabled` attribute on the next render, which drops focus to `<body>`. When both
controls are unavailable the `History` group vanishes from the tab order entirely, with nothing to
announce that it exists. Inherited from V21 rather than introduced here, but finding 1's fix
(keeping the control focusable with `aria-disabled`) would resolve this at the same time.

### 9. Low, non-blocking — a now-unused export and a 142-character line

`web/table/history-controls.tsx:44` exports `availability()`, which since this commit has no
consumer outside its own file — `web/table/log-entry.tsx:26` imports only `redoCommand`,
`undoCommand`, `undoLabel` and the `HistoryStatus` type, and `web/table/settings-popup.tsx` no
longer imports anything from it. Making it module-private documents that.

`docs/build/V29-desktop-feedback.md:170` is 142 characters, the only line over 110 in that file;
Prettier ignores `docs/` and `*.md` so nothing catches it.

### 10. Low, non-blocking — the STATUS row records less than its neighbours

`docs/build/STATUS.md:159`.

The V31 row says "In progress" with the track, worktree and branch, but not the built commit
`6c47704`, the isolated backend identity or the checks that pass. The V29 and V27 rows above it
carry all of that. `docs/build/README.md` step 10 distinguishes a branch handoff awaiting
integration from a completed merge, and this row cannot be read as either until the commit is
named. The work log does record it, so this is presentation, not a missing fact.

## Claims I could not reproduce

1. **`pnpm exec playwright test` — "22 of 22".** Reproduced, but only in two parts and not in one
   pass. My single full run at a load average that peaked above 50 was 19 of 22; the three that
   failed passed on a targeted re-run at load 6. I am recording it as reproduced because the three
   failures are attributable — a CLI sign-in failure, a killed browser and a font-loading
   screenshot timeout — and none is in the changed surface. I have not myself seen 22 green in
   one run of this tree; the work log's single-run claim I take on trust.
2. **"re-run at load 6 it is 64 of 64"** in the work log, describing the `rules.test.ts` recovery
   after a loaded-host timeout. I reproduced neither the failure nor that re-run — the whole
   app-plus-scripts project passed first time here at load 4. The sentence is also ambiguous: 64
   is not the test count of `tests/scripts/rules.test.ts`, of the scripts project, or of anything
   else I can reconstruct, so a reader cannot tell what was re-run. Worth one clarifying clause.
3. **"the reason line each control lost is back in its tooltip for every role."** Not reproducible
   — this is finding 1. The string is in the attribute; the tooltip does not appear.
4. **"The V29 accepted losses are gone with it."** Two of the three are; see finding 3.
5. **Evidence screenshots.** These I *could* check, and they show what is claimed.
   `.playtest/v21/log/freeplay-director-dark-1440x900.png` shows the icon pair at the right of the
   tab row with the tabs still centred and no row beneath them, and the combat captures at both
   viewports show the same. They are implementer-produced artefacts that I inspected rather than
   regenerated; the settings capture I cite under acceptance check 4 is from my own run.

## Other checks, passing

- **No authority, operation, argument or audience changed.** `git show --stat 6c47704` is nine
  files and contains no `convex/` path. `history.undo`, `history.rewind`, `history.redo` and
  `campaign.user-undo` keep their ids, `roles`, `session: 'running'` and `actor: 'none'` gates
  (`convex/lib/history.ts:745-855`). The icon pair submits exactly the strings the V21 strip and
  the V29 pop-up row submitted — `/history rewind`, `/history undo`, `/history redo`, with no
  event argument — through `undoCommand` and `redoCommand`, which are unchanged in this diff. It
  therefore cannot reach anything the old strip could not. If anything the surface narrowed:
  V29's `HistoryRow` defaulted the role to `'director'` while the query was in flight
  (`undoCommand(view?.role ?? 'director')`), whereas `HistoryControls` returns `null` until the
  view resolves, so the submitted verb now always matches the server's view of the role.
- **The render gate is still `running` and not an observer**, at `web/table/log.tsx:397`, and it is
  not an observer-derived or client-computed availability: `history.status` remains the only source
  of `available`, `reason` and `target` (`web/table/history-controls.tsx:62`, `:75`, `:84`).
  `running` is `roster.session?.status === 'running'` (`web/table/index.tsx:61`), the same
  condition `convex/history.ts:56` applies server-side.
- **The group is not a non-tab child of the tablist.** `LogTabs` returns the
  `role="tablist"` element at `web/table/log.tsx:216-220`, and the group is its *sibling* inside
  the new `div.relative` at `:390-400`. My probe confirmed it at every viewport with
  `group.closest('[role="tablist"]') === null`. A `role="group"` with two buttons is also the right
  container here — the V21 `role="toolbar"` implied arrow-key navigation that was never
  implemented, so dropping it is an improvement rather than a loss.
- **`CommandButton`'s new props regress no caller.** The icon branch is correctly conditional:
  `aria-label` is set only when `icon` is present (`setup-card.tsx:55`), the size swaps `sm` for
  `icon-sm` only then (`:54`), `title` falls back to the submitted slash text (`:57`), and the
  child is `icon ?? label` (`:69`). I grepped every use — `web/table/director-pane.tsx:197,323`,
  `web/table/log-entry.tsx:284,294`, `web/table/initiative.tsx:54,68`,
  `web/table/closeout-card.tsx:37,183`, `web/table/setup-card.tsx:270,283,312,318` and the two in
  `history-controls.tsx` — and none of the twelve existing callers passes `icon` or `title`, so
  every one of them renders byte-identically to before. `tsc` agrees.
- **The settings pop-up is clean.** Only the `Enable user undo` row survives from the history
  group, `HistoryRow` is deleted, and the imports shrank to match: `useQuery`, `availability`,
  `redoCommand`, `undoCommand`, `undoLabel` and `CommandButton` are all gone from
  `web/table/settings-popup.tsx`, and every remaining import is still used. `history-controls.tsx`
  has no unused import either — `eslint` passes, and I checked each by hand. The `Campaign
  settings` eyebrow is consistent with the contents: all four rows are campaign settings read from
  `table.roster.settings`, which the server returns to the Director only.
- **The pair adds no second subscription.** `GameLog` already reads `api.history.status`
  (`web/table/log.tsx:100`) for the inline buttons, and the Convex client dedupes an identical
  query with identical arguments, so the second `useQuery` in `HistoryControls` costs one cache
  reader rather than one watch. It also means the header pair and the inline buttons cannot
  disagree about availability.
- **No rules claim.** Nothing in the diff adds or changes a rule, formula, threshold, seam or
  resource grant. The only rules-adjacent strings are the unavailability reasons, which come from
  `convex/lib/history.ts` unchanged. `Rules-Review: not required` is right, and no entry for
  `docs/rules-questions-for-user.md` arises from this slice.
- **Commit format.** Type, slice, a lower-case summary under 72 characters with no full stop,
  prose body, three resolving `Spec:` anchors, a `Verified:` line, `Rules-Review:` as an explicit
  value, and the parent is current `main`. `scripts/check-commit.ts --rev 6c47704` agrees.

## What would move this to `pass`

1. Fix finding 1 so the reason for unavailability actually reaches a mouse user and a keyboard
   user, and replace the `toHaveAttribute('title', …)` assertion with one that would fail on the
   current code.
2. Correct the amended V29 paragraph (finding 3) to two of three losses, and either fix or
   honestly re-record the third.
3. Either address the narrow-width overlap (finding 2) or write down the minimum width the
   placement assumes, in the slice document and in the spec bullet.
4. Move the two implementer choices out of the **User decision** block in `docs/table-spec.md`
   (finding 7) and point the block at V31.

Findings 4, 5, 6 and 8 to 10 are worth fixing and none of them blocks.

## Re-verification — 2026-09-16, `da6a0a4`

Second round, same reviewer, against the amended commit `da6a0a4`, which replaces `6c47704` in the
same worktree and keeps `f7137dc` as its parent. `git diff 6c47704 da6a0a4` touches eight files:
`web/table/history-controls.tsx`, `web/table/log.tsx`, `web/table/setup-card.tsx`,
`tests/browser/v21-log.spec.ts`, `tests/browser/acceptance-extension.ts`, `docs/table-spec.md`,
`docs/build/V29-desktop-feedback.md` and `docs/build/V31-history-control-placement.md`. Still no
`convex/` file, and the four spec files I read by anchor in the first round are the same.

The blocking finding is fixed, on both of the axes I named and with evidence I re-measured rather
than took on trust. The overlap is fixed and I could not produce a collision at any width I tried.
Four new observations follow, none blocking; the most useful is that the regression test written
for the overlap does not actually discriminate.

### Checks I ran this round

- `SALIENT_TEST_URL=http://127.0.0.1:5183 VITE_SITE_URL=http://127.0.0.1:5183 pnpm exec playwright
  test` — **22 passed, 10.0 minutes**, in one clean run. The one-minute load average was 4.1 at
  the start and between 5 and 14 throughout, never near the 30-plus that cost me three specs in
  round one. `journey.spec.ts`, `v21-campaign.spec.ts` and `v21-rosters.spec.ts` — the three that
  failed then — passed here in 23.8 s, 32.5 s and 32.4 s. This is the first 22-green single run I
  have observed of this slice, and it reproduces the work log's claim exactly.
- `pnpm lint` — exit 0. `pnpm exec tsc -p tsconfig.web.json` — exit 0.
- `pnpm exec vitest run --project app --project scripts` — 37 files, **336** tests, all passing.
  `pnpm exec vitest run --project engine` — 14 files, **97** tests, all passing. Both exact again.
- `pnpm check-links` — **181** Markdown files (180 plus this review, still untracked), no broken
  links or anchors. `pnpm check-vendor` — 2 submodules match. `pnpm content:check` — 467
  entries, revision `fb83a789da8f`. `node scripts/check-commit.ts --rev da6a0a4` — "commit
  message ok".
- A second throwaway probe under `/tmp/v31probe2/`, outside the repository, which this round also
  opens a CDP session and reads `Accessibility.getFullAXTree` so that the question about
  assistive technology is answered from the accessibility tree rather than from the DOM.

### The blocking finding, re-checked — fixed

Both halves hold, and I measured each.

**Hover.** `web/table/setup-card.tsx:57` now puts the tooltip on the wrapper `<span>` as well
as on the button. The wrapper is never disabled, so it takes the pointer events the disabled
button refuses. Re-running the same hit-test that produced `nearestTitledFromHit: null` in round
one:

```
Rewind (available):   disabled false, pointerEvents "auto", hitTarget "button",
                      nearestTitledFromHit "Rewind: #13 Heroes act first — chosen by Dire…"
Redo (unavailable):   disabled true,  pointerEvents "none", hitTarget "span",
                      nearestTitledFromHit "Redo: Nothing to redo.", titledIsWrapper true
```

The disabled control's hit chain now reaches a titled ancestor, so the browser has a tooltip to
show at those coordinates. That is the exact measurement that failed before, inverted.

**Assistive technology — the question asked plainly.** Yes, the description reaches assistive
technology on the disabled button in this build, and I am saying so from the accessibility tree,
not from the markup. `web/table/history-controls.tsx:96-101` renders two `sr-only` spans and
`:80` and `:90` point each button at one with `aria-describedby`. Chromium's AX tree for the
Director in combat:

```
{ role: "button", name: "Rewind", description: "Rewind: #13 Heroes act first — …",
  ignored: false, disabled: [] }
{ role: "button", name: "Redo",   description: "Redo: Nothing to redo.",
  ignored: false, disabled: [true] }
{ role: "StaticText", name: "Rewind: #13 Heroes act first — …", ignored: false }
{ role: "StaticText", name: "Redo: Nothing to redo.",           ignored: false }
```

Three things follow. The disabled button is not ignored, so it is present to a screen reader with
its `disabled` state. Its description is computed and exposed, so `aria-describedby` is honoured
on a natively disabled control here — it is not dropped the way the `title` fallback effectively
was. And the same text is independently present as `StaticText` inside the `History` group, so a
user reading through the pane header encounters the reason as ordinary content even if their
screen reader declines to voice descriptions on an inactive control. That belt-and-braces is what
makes me comfortable calling this reachable rather than merely present: the one mechanism I cannot
test from here, announcement policy, is not the only route.

I also checked for the side effect I expected and did not find it: the wrapper's `title` creates
no extra named node in the AX tree, so the reason is exposed twice (button description plus static
text), not three times. That is acceptable verbosity for a control with no visible label.

The `aria-describedby` wiring itself is sound. React 19.3.0's `useId` produced `_r_2_` here, so the
ids are `_r_2_-undo` and `_r_2_-redo`; I confirmed `document.querySelector('#_r_2_-redo')` resolves,
which is what `tests/browser/v21-log.spec.ts:105` depends on, and an underscore-led identifier is
not at risk of the escaping problem the older `:r0:` format would have had.

**One gap remains, and it is small.** A sighted keyboard-only user with no assistive technology
still cannot reach the reason: the text is visually hidden, the tooltip needs a pointer, and the
disabled control is out of the tab order. That is the residue of the user's own "discreet icon
control" instruction, which precludes a visible line, and it does not defeat acceptance check 3.
It is the reason my answer to the implementer's second question below is "yes, worth doing".

### The overlap, re-checked — fixed, and I could not break it

`web/table/log.tsx:388-400` replaces the absolute positioning with
`grid grid-cols-[1fr_auto_1fr] items-end`, a spacer span, the tablist, and the pair (or a second
spacer) in the third column. `rule-strong` moved from the tablist to the wrapper. Measured in
combat, which is the narrow case and the one the committed assertion does not cover, with
`oldClearance` recomputed from the same geometry as what the pre-fix absolute layout would have
given at that width:

| Viewport (combat) | ROLLS right | Pair left | Clearance now | Clearance before | ROLLS clickable |
| --- | --- | --- | --- | --- | --- |
| 1920 | 984 | 1272 | 288 px | 288 px | yes |
| 1440 | 744 | 792 | 48 px | 48 px | yes |
| 1280 | 671 | 695 | 23 px | 23 px | yes |
| 1152 | 614 | 617 | 3 px | 3 px | yes |
| 1024 | 540 | 540 | 0 px | −17 px | yes |
| 900 | 478 | 478 | 0 px | −36 px | yes |
| 800 | 490 | 490 | 0 px | −8 px | yes |

The `−17` and `−36` reproduce round one's measurements exactly, which is the check that the
derivation is right. Nothing is negative now at any width in combat or in free play, and
`document.elementFromPoint` at the ROLLS tab's centre returns the tab itself at every one of them,
including 900. Browser zoom is the same measurement: 150 % in a 1440-wide window is 960 CSS pixels,
between my 900 and 1024 samples, both clear. Large text is clear too — at a 32 px root font size
in a 1440-wide window the clearance is 22 px and the tab is still clickable, because the tabs and
the `size-7` buttons scale together.

`.playtest/v21/log/combat-director-dark-1440x900.png`, regenerated by my own run at 12:02, shows
the row unchanged to the eye: tabs centred, pair at the right, and the rule spanning the full pane
width from its new owner.

### Acceptance checks, re-stated

1. **verified.** Unchanged in substance and re-executed; the probe read `groupRole: "group"`,
   `groupLabel: "History"`, both buttons with empty text and the right `aria-label`. The two new
   `sr-only` spans are siblings of the buttons, not inside them, so `toHaveText('')` at
   `tests/browser/v21-log.spec.ts:95-96` still means what it says.
2. **verified.** Same assertions, executed in a clean run.
3. **verified** — this is the check that failed last round. The tooltip now reaches the pointer on
   a disabled control and the reason is additionally exposed to assistive technology, both measured
   above, and `v21-log.spec.ts:103-105` guards both in the suite.
4. **verified.** Unchanged, executed; `v21-rosters.spec.ts` also passed and re-captured the pop-up.
5. **verified.** Executed, and now better isolated: `tests/browser/acceptance-extension.ts:124-136`
   scopes both `.first()` locators to `[data-log-feed]`, so finding 4 is properly closed rather
   than left to DOM order.
6. **not verified by execution; verified statically**, unchanged from round one. Both gates are
   still in place (`web/table/log.tsx:396` and `web/table/history-controls.tsx:65`), and the
   `running`-false branch now renders an explicit spacer so the tabs stay centred for an observer.
   There is still no browser assertion for either clause.
7. **verified.** Every command reproduced, with the counts above, and the browser suite is 22 of 22
   in a single run for the first time.

### The other findings

- **2 (overlap) — fixed**, measured above. See R1 below for the test that guards it.
- **3 (the V29 paragraph) — fixed in count, and the claim is fair with one caveat.** It now reads
  that V31 "removes the first two losses below outright, and answers the third by carrying the
  reason in the control's tooltip and its accessible description for every role". Judging that, as
  asked: the first half is right and I verified it. The second half is right for a mouse user and
  right for an assistive-technology user — I measured both this round — so it is a fair claim
  rather than an overclaim. What it still glosses is that the *visible* line is gone with nothing
  in its place, so a sighted keyboard-only user has no route to the reason, and discoverability is
  lower than a line of text for everyone. I would add one clause saying so and recording it as
  accepted, because it follows from the user's own instruction to make the control discreet. Not
  blocking, and I am not asking for the visible line back.
- **4 (`acceptance-extension.ts`) — fixed.** Both locators are scoped to `[data-log-feed]`, with a
  comment naming why. `wizard.spec.ts` passed.
- **5 (non-discriminating title assertion) — fixed.** `/^Rewind: #\d+ /` now fails on the reason
  branch of `availability()`.
- **6 (stale comment) — fixed.** `web/table/log.tsx:96-98` describes the current arrangement.
- **7 (spec attribution) — fixed.** `docs/table-spec.md:405-415` keeps the user's correction in
  the **User decision** block and moves the tab-row placement and the tooltip/description choice
  into a following paragraph labelled "Implementation choices under that decision, not part of it
  and open to change", which links V31. The block's lead-in still says only "recorded in V29", but
  the substance is now attributed correctly and the sub-paragraph carries the V31 link, so I am
  dropping the point.
- **8 (focus loss) — not fixed**, deliberately. My view is below.
- **9 (unused export, long line) — fixed.** `availability` is module-private at
  `web/table/history-controls.tsx:45`, and no line in `docs/build/V29-desktop-feedback.md` now
  exceeds 110 characters.
- **10 (STATUS row) — not fixed**, to be added at integration. That is the same sequence V29 used
  and I have no objection to it.

### The two questions the implementer asked

**Does the description actually reach assistive technology on a disabled button?** Yes — answered
above from the AX tree, with the honest qualification that exposure is not the same as a guarantee
that every screen reader voices it, and that the `StaticText` copy is what closes that gap.

**Is the unfixed focus loss acceptable?** It is acceptable as a defect, but I would take the offer
and move to `aria-disabled` with a focusable no-op — for a reason beyond focus loss. Base UI
already implements it: passing `focusableWhenDisabled` makes `useButton` emit `aria-disabled`
instead of `disabled` and preventDefault the click
(`node_modules/@base-ui/react/utils/useFocusableWhenDisabled.js:38-42`,
`internals/use-button/useButton.js:84-88`), so the control stays inert but reachable. Doing it here
would close the one remaining gap from the blocking finding — the sighted keyboard-only user would
be able to Tab to the control, and a screen-reader user would get the description on focus rather
than only by browsing — and it would stop focus being dropped to `<body>` when a control disables
itself under the user, in the one place in the app where that is most likely, since acting on the
control is exactly what exhausts the window. It is a one-prop change plus keeping
`disabled:pointer-events-none` off the `aria-disabled` path so the tooltip still works. I would do
it; I am not making it a condition of the verdict, and if it is deferred it belongs in the work log
as an accepted affordance gap rather than as nothing.

### New this round

None of these blocks.

#### R1. Medium — the new overlap assertion cannot fail on the code it was written for

`tests/browser/v21-log.spec.ts:106-113`.

The loop asserts `rolls.x + rolls.width <= pair.x` at 1440, 1152 and 1024, which is the right
property. But the spec's fixture is `createTable(browser)` — free play, not combat — and free
play is the wide case. My probe measured what the pre-fix absolute layout would have given in
free play at those same three widths: **+119 px, +60 px and +34 px of clearance**. The old code
passes this assertion at all three. The defect lived in combat, where the heroes column is 566
px rather than 424 px and the centre pane is correspondingly narrower; that is where the old
clearance went to −17 px at 1024.

So the regression is fixed but unguarded: a future change that reintroduces it would not be caught.
Adding `{ combat: true }` to a small dedicated fixture, or asserting at a width at or below 1024
in the combat spec, would make it discriminate — old −17 px against new 0 px is a clean margin.
This is the same class of problem as the first round's finding 5, and worth fixing for the same
reason.

#### R2. Low — below about 950 px in combat the row overflows the pane instead of overlapping

`web/table/log.tsx:388`.

`auto` in the middle column floors at the tablist's 188 px min-content and the pair's column floors
at 58 px, so once the centre pane is narrower than their sum the grid overflows rather than
collides. At 900 px in combat the pair's right edge sits 14 px past the `[data-log-pane]` right
edge (`groupOverflowsPane: 14`); at every other width I measured it is 0. Nothing is covered and
the tab stays clickable, so this is a much better failure mode than the one it replaced, but it is
a failure mode. Worth one line in the slice document recording the width below which the row
overflows, or `min-w-0` plus an overflow rule if anyone wants it clipped instead.

#### R3. Low — the wrapper tooltip went into the shared component, so all twelve callers changed

`web/table/setup-card.tsx:57`.

The fix is correct but broader than V31 needs: `title` on the wrapper is unconditional, so every
`CommandButton` in the app now shows its tooltip while disabled, not just the icon pair. Two
existing controls are routinely disabled — `Take turn` (`web/table/initiative.tsx:72`) and
`Finish cleanup` (`web/table/closeout-card.tsx:188`) — and their tooltip is the raw slash text, so
hovering a greyed-out `TAKE TURN` now pops
`@{character:…} /turn take entry="…"` where it previously showed nothing. That is cosmetic and
arguably an improvement, but it is an unreviewed change to controls outside this slice and no check
covers it. `title={icon ? tooltip : undefined}` on the wrapper would scope it to the iconic branch,
matching how `aria-label` and the size swap are already conditioned one line below.

#### R4. Low — the slice document links a review that is not in the commit

`docs/build/V31-history-control-placement.md:141` links `reviews/V31-implementation-review.md`,
which is still untracked. `pnpm check-links` reads the working tree so it passes here, but the CI
checker runs over the pushed range, where the link would dangle. The implementer's stated plan is
to commit this document with the close-out, which resolves it; recording it so it is not forgotten.

### Claims from this round I could not reproduce

None. Every claim in the re-verification request reproduced: the tooltip is repeated on the
wrapper and takes the hover, the `aria-describedby` description is exposed on the disabled control,
the grid gives the pair a reserved column with no collision at any width I tried,
`acceptance-extension.ts` is scoped to the feed, the V29 paragraph accounts for three losses, the
`Rewind` regex is tightened, the stale comment is corrected, `availability` is no longer exported,
the over-long lines are wrapped, and the spec's implementation choices are separated out. The
browser suite is 22 of 22 at a load average that never justified a re-run, which is a stronger
result than the one the first round settled for.

## Uncommitted divergence after the verdict — 2026-09-16, 12:12 UTC

Recorded because the verdict below must not be read as covering it.

At 12:12 UTC, after `da6a0a4` had been handed to me and after every measurement and test run
above, two tracked files changed in this worktree and are still uncommitted:

```
 M tests/browser/v21-log.spec.ts
 M web/table/setup-card.tsx
```

They are not mine — the only file I have written is this review — and they are not in `da6a0a4`.
Read as a diff, they adopt two of my recommendations: `CommandButton` drops the wrapper `title`
and instead passes `focusableWhenDisabled` for the iconic branch, so Base UI emits `aria-disabled`
rather than the native `disabled` attribute and the control stays hoverable and focusable; and the
geometry assertion moves out of the free-play test into the combat test at
`tests/browser/v21-log.spec.ts:197-210`, which is exactly what finding R1 asked for.

I think that is the right direction — it is what I argued for in answer to the implementer's
second question. But it is a **substantive behaviour change to a shared component**, and
`docs/build/README.md` ("Branch and merge policy") requires renewed applicable review for those.
Nothing I measured applies to it:

- The accessibility-tree read, the hit-test and the 22-of-22 suite were all against `da6a0a4`,
  where the disabled control is natively `disabled` and the wrapper carries the tooltip. The
  working tree inverts both mechanisms.
- Inertness no longer rests on the native attribute. It now rests on Base UI's `useButton` click
  guard plus the added `if (inert) return;`. That the control cannot actually submit while
  `aria-disabled` needs to be demonstrated, not assumed — it is the one place where this change
  could turn an affordance fix into an authority bug, even though the server re-checks every call.
- `aria-disabled="false"` will now appear on *enabled* iconic buttons, because Base UI sets the
  attribute whenever `focusableWhenDisabled` is true. The revised assertions use
  `not.toHaveAttribute('aria-disabled', 'true')`, which accommodates that; anything else matching
  on `[aria-disabled]` would need checking.
- The change is conditioned on `icon`, so the eleven text `CommandButton`s keep native `disabled`.
  That also means R3 is resolved as a side effect: the unconditional wrapper `title` is gone, so
  `Take turn` and `Finish cleanup` go back to their previous hover behaviour.

None of this is criticism of the change. It is simply unreviewed. It needs a commit, `pnpm lint`,
and at minimum `v21-log.spec.ts` and `wizard.spec.ts` re-run, and then a third short round on the
two points above. Merging the working tree on the strength of the verdict below would be merging
something no reviewer has seen.

## Close-out — 2026-09-16, `21786fc`

Third round, same reviewer, against `21786fc`, which amends `da6a0a4` and commits the divergence
the section above recorded. `git diff da6a0a4 21786fc` is four files:
`web/table/setup-card.tsx`, `tests/browser/v21-log.spec.ts` and the two build documents. It takes
R1, R3 and the `aria-disabled` recommendation, and records R2 as accepted.

**I carried nothing forward.** The mechanism changed exactly as the divergence section warned, so
every measurement below was taken fresh against `21786fc`; the round-two numbers describe a
natively disabled button behind a titled wrapper, and neither of those exists any more.

### What I ran, and what I deliberately did not

The implementer had already run two full suites at 22 of 22 on this commit, I ran one at 22 of 22
on `da6a0a4`, and peers are queued behind this worktree's backend. So instead of a third full ten
minutes I ran the specs that touch the changed code, and reasoned explicitly about the rest:

- `pnpm exec playwright test v21-log.spec.ts combat.spec.ts closeout.spec.ts wizard.spec.ts` —
  **6 passed, 5.4 minutes** (the glob also picked up `v21-wizard.spec.ts`). One-minute load
  average 1.1 at the start, 13.1 at the end. That is every changed path: `v21-log.spec.ts` carries
  all the V31 assertions including the new inertness block and the moved geometry loop;
  `combat.spec.ts` and `closeout.spec.ts` exercise the *text* branch of `CommandButton` including
  its two routinely disabled callers, `Take turn` and `Finish cleanup`; `wizard.spec.ts` runs
  `acceptance-extension.ts` and the widest spread of `CommandButton` uses in the suite.
- The fourteen specs I did not re-run touch no file in `da6a0a4..21786fc`. The only executable
  change is `web/table/setup-card.tsx`, whose non-iconic output I show below is unchanged, and
  `tests/browser/v21-log.spec.ts`, which I did run.
- `pnpm lint` exit 0, `pnpm exec tsc -p tsconfig.web.json` exit 0, `pnpm check-links` 181 files,
  `node scripts/check-commit.ts --rev 21786fc` — "commit message ok".
- A third throwaway probe under `/tmp/v31probe3/`, outside the repository, re-measuring the
  markup, the hit chain, the accessibility tree, the computed styling in both themes, four
  separate activation routes and the geometry.

`docs/build/evidence/V27-*.png` did not need restoring this round: `foes.spec.ts`, the spec that
overwrites them, was not among the ones I ran, and `git status` confirms the worktree is clean
apart from this untracked document.

### The new mechanism, measured from scratch

The markup is what the implementer describes. Neither iconic button carries a native `disabled`
attribute; the unavailable one carries `aria-disabled="true"` and the available one
`aria-disabled="false"`; both have `tabindex="0"`; the wrapper `<span>` has no `title`; and each
button carries its own `title` and an `aria-describedby` that resolves:

```
Rewind: nativeDisabledAttr false, ariaDisabled "false", tabIndex 0, wrapperHasTitle false,
        hitTarget "button", titledIsSelf true,
        describedByText "Rewind: #13 Heroes act first — …"
Redo:   nativeDisabledAttr false, ariaDisabled "true",  tabIndex 0, wrapperHasTitle false,
        hitTarget "button", titledIsSelf true,
        describedByText "Redo: Nothing to redo."
```

`titledIsSelf: true` on the unavailable control is the round-one finding closed by a different
route from round two: the button keeps pointer events, so the hover lands on the button and the
browser reads the button's own `title`. No wrapper is involved any more.

The accessibility tree is better than it was in round two, not merely equivalent:

```
{ role: "button", name: "Rewind", description: "Rewind: #13 Heroes act first — …",
  ignored: false, focusable: [true], disabled: [] }
{ role: "button", name: "Redo",   description: "Redo: Nothing to redo.",
  ignored: false, focusable: [true], disabled: [true] }
{ role: "StaticText", name: "Rewind: #13 Heroes act first — …", ignored: false }
{ role: "StaticText", name: "Redo: Nothing to redo.",           ignored: false }
```

The unavailable control is now `focusable: true` **and** `disabled: true`, with its reason as the
accessible description and again as static text inside the group. That closes the one gap I left
open in round two: a sighted keyboard-only user can now Tab to the control, and a screen-reader
user gets the reason on focus rather than only by browsing. Every route to the explanation —
pointer, keyboard, assistive technology — now works.

### Does it still read as unavailable? Yes, in both themes

Computed styles on the pair, resting:

| Theme | Rewind (available) | Redo (unavailable) |
| --- | --- | --- |
| dark | opacity 1, colour `rgb(231, 227, 224)` | opacity **0.5**, same colour |
| light | opacity 1, colour `rgb(17, 17, 17)` | opacity **0.5**, same colour |

`aria-disabled:opacity-50` matches only `[aria-disabled="true"]`, so the `aria-disabled="false"`
on the available control does not dim it. That is the same 50 % the native `disabled:opacity-50`
gave, so there is no visual regression against `main` — see T1 for the one behaviour that did
change.

### Inertness: demonstrated by four routes, including Space

This is what I chiefly asked for, and it holds. Against the unavailable `Redo`, with the feed at
eleven entries:

| Route | Result |
| --- | --- |
| Ordinary `redo.click()` | Playwright refuses it — `TimeoutError`, the element is not enabled |
| `redo.click({ force: true })` | click dispatched, `defaultPrevented: true` |
| `element.click()` from page script | click dispatched, `defaultPrevented: true` |
| Focus + `Enter` | keydown `defaultPrevented: true` |
| Focus + `Space` | keydown `defaultPrevented: true` |

After all five: `entriesBefore=11 entriesAfter=11 toasts=0 undone=0`. Nothing was submitted by any
route — no log entry, no disposition change, and no failure toast, which would have appeared had a
`/history redo` reached the server and been rejected.

**Space is covered by the behaviour but not by the spec.** The committed assertion presses `Enter`
only. I measured `Space` separately and it is blocked identically, so there is no defect — but see
T3, because the spec is one key short of what it claims.

**Which guard is load-bearing: Base UI's, not the component's.** `defaultPrevented: true` on the
click is decisive. `CommandButton`'s `if (inert) return;` returns without calling `preventDefault`,
so it cannot have set that flag; Base UI's `useButton` did, at
`node_modules/@base-ui/react/internals/use-button/useButton.js:84-89`, which calls
`event.preventDefault()` and returns **before** invoking the external `onClick` at all. The
keyboard case is `useFocusableWhenDisabled.js:26-30`, which preventDefaults every key but `Tab`
while `disabled && focusableWhenDisabled`, so the native button never generates its activation
click for either `Enter` or `Space`.

That makes the component's own guard unreachable today — but it is worth keeping rather than
cutting. It is not decoration: if a Base UI upgrade ever stopped blocking, the external handler
would start being called and the guard is precisely what would still refuse the submission. It is
a real second line, and the server re-checks every call as a third.

### R3, verified directly: the other eleven callers are back to `main`

The claim holds, and I checked it in the running DOM rather than only in the diff. Every new prop
is conditioned on `icon` (`focusableWhenDisabled={icon ? true : undefined}`,
`className={icon ? … : undefined}`, `aria-label={icon ? label : undefined}`,
`size={icon ? 'icon-sm' : 'sm'}`), and passing `undefined` for `focusableWhenDisabled` hits Base
UI's `= false` default, so the text branch resolves to exactly `main`'s props. Measured on the
text `CommandButton`s present in a combat table:

```
"Take turn"    nativeDisabledAttr true,  ariaDisabled null, pointerEvents "none",
               wrapperHasTitle false, title "@{foe:…} /turn take entry=…"
"End combat"   nativeDisabledAttr false, ariaDisabled null, pointerEvents "auto",
               wrapperHasTitle false, title "/combat end encounter=…"
```

Native `disabled`, no `aria-disabled`, `pointer-events: none` while disabled, and no wrapper
title — which is `main`'s rendering exactly. The `da6a0a4` side effect I raised as R3, where a
greyed-out `TAKE TURN` popped its raw slash text on hover, is gone: with `pointer-events: none`
restored, that tooltip no longer opens. R3 is resolved, not merely narrowed.

### R1, verified: the moved assertion now discriminates

The loop is now in the combat test (`tests/browser/v21-log.spec.ts:207-219`, fixture
`createTable(browser, { combat: true })` at `:189`). Measured on `21786fc` in combat:

| Viewport | ROLLS right | Pair left | Clearance now | Old layout, measured in round one |
| --- | --- | --- | --- | --- |
| 1440 | 744 | 792 | 48 px | 48 px — passes on both |
| 1152 | 614 | 617 | 3 px | 3 px — passes on both |
| 1024 | 540 | 540 | 0 px | ROLLS right 556 vs pair left 540 — **fails** |

So `rolls.x + rolls.width <= pair.x` is false at 1024 on the pre-fix layout and true now. The
assertion discriminates. Worth knowing that **only the 1024 row does any work** — 1440 and 1152
pass on both layouts — so if anyone trims the loop, 1024 is the one to keep. The old numbers are
not reconstructed: they are round one's direct measurements of the real pre-fix code.

### R2, R4 and the remaining first-round items

R2 is recorded in the work log as accepted, with the right number: below roughly 950 px in combat
the row overflows the pane by up to 14 px rather than the controls colliding. That is the
disposition I asked for. R4 resolves when this document is committed with the close-out. Findings
1 to 7 and 9 from round one remain fixed; 8 (focus loss) is now fixed as a consequence of the
`aria-disabled` change, since the control no longer leaves the tab order when it becomes
unavailable; 10 (the STATUS row) is still deferred to integration, which is the V29 sequence.

### New this round

None blocks, and none needs another review round.

**T1. Low — an unavailable control now lights up under the cursor.** `web/table/setup-card.tsx:60`
and `web/components/ui/button.tsx:17`. The ghost variant's `hover:bg-muted` /
`dark:hover:bg-muted/50` is unconditional, and the control now keeps pointer events, so hovering
the inert `Redo` paints a hover background where at rest it is transparent — measured
`oklab(0.204625 … / 0.5)` in dark and `rgb(245, 245, 245)` in light. Under the native-`disabled`
mechanism `pointer-events-none` suppressed this. The cursor correctly stays `default` rather than
becoming a pointer, so the cue is weaker than it looks, but an inert control should not highlight.
`aria-disabled:hover:bg-transparent` on the same conditional class string fixes it in one token.

**T2. Trivial — `aria-disabled:cursor-default` is a no-op.** Same line. The button's resting
cursor is already `default` in both states (Tailwind 4's preflight does not set `cursor: pointer`
on buttons and nothing in this codebase does), so the class changes nothing. Harmless; drop it or
pair it with the T1 fix.

**T3. Low — the inertness assertion is one key short of its own claim.** `v21-log.spec.ts:110-119`
comments that the control "is inert" and then exercises a forced click and `Enter`. `Space` is the
other native activation key for a button and is not pressed. It is in fact blocked — I measured
it — so this is a coverage gap rather than a defect, and it is one line:
`await d.keyboard.press(' ')` beside the `Enter`.

**T4. Note — the AX-tree and styling facts are not guarded by any test.** The assertions cover
`aria-disabled`, focusability, the `title`, the described text and inertness, which is a good set.
Nothing asserts the 0.5 opacity that distinguishes unavailable from available, so a future change
to the conditional class string would pass the suite while the control stopped looking inert. One
`toHaveCSS('opacity', '0.5')` would close it. Not worth a round on its own.

### Claims from this round I could not reproduce

None. Every claim in the request reproduced: the iconic branch emits `aria-disabled` with
`tabindex="0"` and no native `disabled`; the wrapper `title` is gone and the button's own tooltip
opens on the unavailable control; the eleven text callers are back to `main`'s rendering; the
control cannot submit by pointer, script, `Enter` or `Space`; the geometry assertion moved into
combat and discriminates at 1024; and lint, tsc and the specs covering every changed path pass.
I did not reproduce the two full 22-of-22 suites, deliberately, for the reason given above.

### A second divergence, this one test-only — executed, and now committed as `bd0c512`

At 12:48 UTC, while I was writing this section, `tests/browser/v21-log.spec.ts` changed again in
the worktree. It is three lines, and it is T4 above:

```
+    // `aria-disabled` replaces the native `disabled:` variants, so the dimming is asserted too.
+    await expect(redo).toHaveCSS('opacity', '0.5');
+    await expect(rewind).not.toHaveCSS('opacity', '0.5');
```

I am recording it rather than ignoring it, for the same reason as the first divergence — but it
does not need a fourth round and I am not asking for one. It is test-only, additive, touches no
application code, and asserts exactly the two values I measured independently this round (0.5 on
the unavailable control, 1 on the available one, in both themes). So unlike the first divergence,
my evidence does apply to it.

I ran it rather than leaving it on reasoning. `pnpm exec playwright test v21-log.spec.ts` against
blob `fe7f5cc`: **2 passed, 1.2 minutes**, with the blob verified unchanged across the run. A
first attempt had failed at `v21-fixtures.ts:117` with
`ENOENT … test-results/.playwright-artifacts-0/traces/…`, which is a Playwright artefact
collision between two runs sharing this worktree's `test-results/`, not an assertion failure; the
clean re-run of the identical file passes, which settles it.

It has since been committed. `bd0c512` amends `21786fc` with three things: that test line, eight
lines in the slice document recording this verdict, and this review. Two checks close the loop:
`git rev-parse HEAD:tests/browser/v21-log.spec.ts` is `fe7f5cc`, **byte-identical to the blob I
executed**, so the run above covers the committed tree exactly; and
`node scripts/check-commit.ts --rev bd0c512` reports "commit message ok". The slice document's
new paragraph describes this verdict accurately and does not overclaim. There is no executable
difference between `21786fc` and `bd0c512` beyond that one asserted property.

One loose end for the implementer, not a finding: `bd0c512` captured this document as it stood a
few minutes ago, so it does not yet contain this subsection or the verdict below. Amend it once
more to pick them up. That amend changes nothing executable and needs no further verification
from me.

## Final verdict

pass

For `bd0c512` (and equally for `21786fc`, which it amends with one asserted property I executed
and two documentation changes). This supersedes the round-two `pass` on `da6a0a4` and the
first-round `changes required` on `6c47704`. No blocking finding remains, every acceptance check
is verified, and T1 to T3 are one-line follow-ups that do not need a further review. Amend in this
document as it now stands and the slice is ready for the lead.
