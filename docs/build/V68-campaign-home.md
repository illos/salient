# V68: Campaign home redesign

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team (UI/polish track, with app/social backend pieces) |
| Rules review | not required |
| Depends on | V21, V29, V31, V43, A09 |
| Unblocks | The session screen slice (roster, player selection, selected characters); the recap abstraction; the game-log/chat hybrid |
| Status | see `STATUS.md` |

## Goal

Rebuild the campaign home to the user's [simplified V2 mockup](../design-mockups/v2/campaign-home-simplified.png)
under the [decisions recorded on 2026-09-20](../design-mockups/v2/README.md#campaign-home-user-decisions-2026-09-20):
a header with the session count and last-played time plus INVITE PLAYERS and START SESSION; a Players
section of member cards showing owner/Director badges, connected presence and each member's admitted
heroes with level; a Session history list with optional session titles, participant discs, relative
dates and RECAP; a light campaign chat pane; and a Manage players pop-up holding the invitation link
and code, join requests and hero admission review. The next-session roster, the Party panel, the game
log feed, Foes prepared and the command console leave this page. Boundary: no session screen, no recap
abstraction, no roll results in chat, no active-Director delegation, no campaign deletion.

## Spec references

- `docs/design-mockups/v2/README.md#campaign-home-user-decisions-2026-09-20` — the binding layout and the user's decisions per depicted element.
- `docs/accounts-and-access-spec.md#campaigns` — owner and Director badges; every non-Director member is a player on campaign surfaces; Observer is session-level.
- `docs/accounts-and-access-spec.md#5-campaign-discovery-requests-and-blocking` — share code and link display, join requests.
- `docs/table-spec.md#2-participation-and-presence` — connected-member presence is built now; presence grants nothing.
- `docs/table-spec.md#reading-session-history` — optional session title, `Session n · title`, RECAP opens the session's game log; every member may read every past session.
- `docs/table-spec.md#game-log-and-chat-scope` — light campaign chat within the V12 contract; separate from the game log.
- `docs/build/V12-campaign-chat.md` — the chat contract this slice implements the light version of (no edit/delete, members read and write, attribution snapshot, no game-log entry, no undo seam).
- `docs/character-wizard-spec.md#7-revision-and-review-lifecycle` — hero admission review moves into the Manage players pop-up; the operations are unchanged.
- `docs/build/README.md#programmatic-headless-completion-gate` — every new capability has a CLI/API route proven headlessly before acceptance.

## In scope

- **Header.** Back link, campaign name, meta line `Session n · last played <relative>` (or `No sessions yet`), INVITE PLAYERS (outline; opens the Manage players pop-up on its invitation section; Director only) and START SESSION (primary; Director only). With an active session the header keeps the existing OPEN THE TABLE / PAUSE / RESUME / END actions and the VoidCard flow.
- **Players section.** Heading with `n members · n characters`; right aside `JOIN REQUESTS n` (Director only, red count when non-zero) and MANAGE PLAYERS (Director only). One card per member: disc, name, badges (OWNER, DIRECTOR; nothing for players), a presence dot (filled when connected), then one row per admitted hero the member owns in this campaign with the hero's name and `LV n`. The viewer's own card is tinted as the mockup draws it.
- **Presence.** New Convex module `presence`: `presence.heartbeat` mutation (member only) and `presence.list` query returning the connected member ids for a campaign. Clients on the campaign home send a heartbeat on mount and every 30 s, and `presence.leave` on unmount. Online means a heartbeat within the last 90 s. Recorded threshold; the spec leaves it open.
- **Session title.** Schema field `sessions.title` (optional string, max 100). `sessions.start` accepts an optional title; new `sessions.setTitle` (Director only, any status including closed). `sessions.list` and `sessions.get` return `title` and `number`.
- **Session history.** Rows newest first: `Session n` bold (grey when closed and older than the latest page), the title, participant discs from `selectedPlayerIds`, relative date, RECAP. Closed sessions only in this list; the active session is represented by the header actions. `ALL n SESSIONS` pages beyond the first five. RECAP opens the session's game log (existing `events.list` with `sessionId`) as a drill-in on the same page, with the read-only notice and OLDER ACTIVITY paging. Director can edit the title inline from the row.
- **Table chat.** New Convex module `chat`: `chat.send` (member only, text 1–2000 chars, `commandId` for retry identity) and `chat.list` (member only, newest 50 with `before` paging). Pane with header `Table chat · n online`, message rows (disc, name, text, relative time), composer with send button; Enter sends. No edit, no delete, no roll chip.
- **Manage players pop-up.** Director only; opened by MANAGE PLAYERS, INVITE PLAYERS and the join-request count. Sections: Invite (link and code with icon copy buttons, Replace code and link), Join requests (APPROVE / DECLINE), Hero admissions (the existing review queue with APPROVE / DECLINE). Uses the existing overlay-card / settings pop-up pattern. Non-Director members keep their own submission status where the Party panel showed it today: a short line under their card's hero rows.
- **START SESSION without a roster on this page.** The session screen that owns player selection is a later slice. Interim behavior, recorded as an assumption: START SESSION starts the session with every current member selected as a player, and the Director adjusts through the existing `sessions.setPlayers` operation (table pane and CLI). The header button opens a small confirmation naming who will be selected.
- **Projection additions**, computed in Convex not the UI: `campaigns.get` gains `ownerId` (exists), per-member `heroes: [{id, name, level}]` (admitted characters attached to the campaign, owned by that member), `sessionCount`, and `lastPlayedAt`.
- **Removal** from this page: NextSessionCard and PlayerTiles, PartyPanel, ActivitySection as the main feed (kept as the RECAP drill-in), InviteCard as an inline card (moved into the pop-up), MembersSection, FoesPrepared, the command console disclosure. Components that other pages still use are kept; the rest are deleted with their dead tests.
- Headless CLI/API proof for every new operation and projection, and updated `tests/app` coverage that justifies itself with a concrete failure.

## Out of scope

- The session screen (roster, player selection, selected characters, running-session controls beyond the header). Next slice.
- The recap abstraction over log, chat and Director notes; Director notes themselves.
- Roll results or any game-log content inside chat; the game-log/chat hybrid inside the session.
- Active-Director delegation, kicking members, campaign deletion, chat removal on campaign deletion (no deletion operation exists yet; V12 acceptance check 4 waits for it).
- Presence on the table roster and the session screen beyond exposing the same `presence.list`.
- Notifications, unread counts, typing indicators, message pagination beyond `before` paging.
- Mobile and tablet layouts (V17). Browser tests (moratorium; scenarios go to the backlog).

## Inputs and dependencies

- Hard: A09 campaign membership and sessions; V43 incremental table loading (the `events.list` paging contract RECAP reuses); the overlay-card pattern from V21/V29/V31.
- Existing operations reused unchanged: `campaigns.regenerateShareCode`, `campaigns.approveRequest`, `campaigns.declineRequest`, `characters.approve`, `characters.decline`, `characters.reviews`, `sessions.start`, `sessions.transition`, `sessions.setPlayers`, `events.list`.
- Development target: isolated CT114 environment `campaign-home` (provisioned from main's pinned backend binary per `docs/remote-development.md`). Shared `main` is untouched until merge.
- No fixtures stubbed.

## Deliverables

- `convex/schema.ts`: additive `sessions.title`, new `presence` and `chatMessages` tables with campaign indexes.
- `convex/presence.ts`, `convex/chat.ts`, `convex/sessions.ts` (title, number), `convex/campaigns.ts` (member heroes, session count, last played).
- `web/campaigns.tsx` (CampaignPage), `web/campaign/header.tsx`, new `web/campaign/players.tsx`, `web/campaign/session-history.tsx`, `web/campaign/chat.tsx`, `web/campaign/manage-players.tsx`; removal of `next-session.tsx`, `members.tsx`, `foes-prepared.tsx` and the inline `invite.tsx` card (its copy field and request rows move into the pop-up).
- `tests/app`: presence, chat, session title, campaign projection tests.
- Headless proof script or recorded `pnpm app` command sequence with sanitized output under `docs/build/evidence/V68/`.
- Browser coverage backlog rows for the pop-up, drill-in, presence dot and chat pane.
- Spec implementation notes already recorded on 2026-09-20 in the two owning specs and the V2 mockup README.

## Acceptance checks

1. **Roles.** `campaigns.get` for a campaign with an owner and two members: the UI shows OWNER and DIRECTOR on the owner's card and no role tag on the others. Headless: the projection carries `ownerId` and members; no `observer` or `player` tag field exists in the campaign projection.
2. **Presence.** Member A calls `presence.heartbeat`; `presence.list` from member B returns A. A non-member's heartbeat and list are refused. After `presence.leave`, or once 90 s pass without a heartbeat, A is no longer listed. Read back through `presence.list`, not the mutation result.
3. **Session title.** `sessions.start` with `title` persists it; `sessions.setTitle` by the Director changes it on a running and on a closed session; a player's `setTitle` is refused; an empty title clears it. `sessions.list` returns `title` and `number`; the header meta reads `Session n · last played …` from `lastPlayedAt`.
4. **Session history.** For a campaign with six closed sessions, the first page lists five newest-first with the correct numbers, participant ids and closed dates; `ALL 6 SESSIONS` reveals the sixth. RECAP on session 3 renders exactly the events `events.list` returns for that `sessionId`, with the read-only notice.
5. **Chat.** Member A `chat.send` text; member B's `chat.list` returns it with A's display-name snapshot and timestamp. A non-member's send and list are refused. Empty and over-length text are refused. No `chat.edit` or `chat.delete` operation exists in the registry. Sending creates no `events` row and does not change the sender's undo window (compare `history.status` or the equivalent before and after).
6. **Manage players.** From the pop-up, the Director approves a join request and a hero admission; both persist through the existing operations and the member card gains the hero with its level. The invitation link and code shown match `campaigns.get.shareCode`; Replace changes both.
7. **Member heroes.** After admission, `campaigns.get` lists the hero under its owner with the character's stored `level`; a declined or detached character is not listed.
8. **Start session interim.** START SESSION with no roster on the page starts a session whose `selectedPlayerIds` equal the current member ids; `sessions.setPlayers` still adjusts it.
9. **Removal.** The campaign home renders no Foes prepared section, no command console, no next-session tiles and no inline invite card; foe operations remain reachable on the table and through `pnpm app`.
10. **Baseline.** `pnpm check` passes; the headless proof table in the work log is complete with pass results before review.

## Ability design and playtest evidence

Not applicable.

## Rules research

None.

## Open questions

None raised. Assumptions recorded above for user review: the START SESSION interim (all members selected) and the Director's right to title closed sessions.

## Work log

### 2026-09-20 — claim and plan

- Thread: `Refine Campaign Screen UI` (Fable), T3 thread `f01b6791-2159-4bfe-8449-b8ec9fb69811`.
- Worktree `code/.worktrees/campaign-home`, branch `slice/V68` from main `2f5544f`. V67 was already taken by an engine branch.
- Decisions from the user's mockup review recorded in `docs/design-mockups/v2/README.md`, `docs/accounts-and-access-spec.md#campaigns`, `docs/table-spec.md#2-participation-and-presence`, `#reading-session-history` and `#game-log-and-chat-scope`.
- Plan: backend first (schema, presence, chat, session title, campaign projection) with `tests/app` coverage; then the page in the order header, players, session history with RECAP drill-in, chat pane, Manage players pop-up; then headless proof on the isolated `campaign-home` CT114 environment; then independent review; then lead integration and shared-main update.
- Verification is headless only under the browser moratorium; browser scenarios are appended to the backlog.

### 2026-09-20 — candidate built

- Backend: additive schema (`sessions.title`, `presence`, `chatMessages`); `convex/presence.ts`
  (`heartbeat`, `leave`, `list`; online window 90 s, heartbeat 30 s); `convex/chat.ts` (`send`,
  `list`); `sessions.start` takes an optional title, new `sessions.setTitle` (Director, any status,
  blank clears, 100 chars), `sessions.list`/`get` return `title` and `number`; `campaigns.get`
  returns each member's admitted heroes with the effective revision's level, `sessionCount` and
  `lastPlayedAt`. Generated API index refreshed with `convex codegen`.
- Page: `web/campaigns.tsx` composes `campaign/header.tsx` (meta line, INVITE PLAYERS, START SESSION
  with the all-members confirmation), `campaign/players.tsx` (cards, badges, presence hook),
  `campaign/session-history.tsx` (rows, inline title editing, ALL n SESSIONS, RECAP drill-in over
  `events.list`), `campaign/chat.tsx` and `campaign/manage-players.tsx` (invite fields, join
  requests, hero admissions in the OverlayCard). Removed: `campaign/next-session.tsx`,
  `members.tsx`, `foes-prepared.tsx`, `invite.tsx`, `activity.tsx`, `character-sheet/party.tsx` and
  the command console disclosure. `tests/browser/v21-campaign.spec.ts` now asserts removed
  elements; left untouched under the moratorium and logged in the backlog.
- Tests: `tests/app/campaign-home.test.ts` (presence membership/expiry, titles and numbering, chat
  boundaries, member heroes). Headless proof: `scripts/v68-headless.ts`.
- Local checks on Presidium before the CT114 run (scoped, no servers): eslint + prettier pass, tsc
  pass, `vitest --project app` 37 files pass; `--project scripts` fails only `tests/scripts/foes.test.ts`
  (12 cases) because the sparse vendor checkout lacks the Compendium book JSON it reads, a Presidium
  environment limit unrelated to this slice; the CT114 full check is the authoritative baseline.
- Assumption under review: START SESSION selects every current member (the session screen that owns
  selection is a later slice).

### 2026-09-20 — incident: codegen touched the hosted dev deployment

At 02:50 UTC `pnpm exec convex codegen` was run on Presidium in the slice worktree to refresh
`convex/_generated` after adding `convex/presence.ts` and `convex/chat.ts`. The worktree has no
`.env.local`, but the thread's shell environment carries an ambient `CONVEX_DEPLOY_KEY`, and with
the Better Auth component present the Convex CLI's codegen performs a dry-run start push against
that deployment (`dev:different-bat-943`). That staged the two new indexes on hosted without
finishing a push; no functions, content or data changed there. The WIZARD thread's V69 hosted
deployment at 03:04 UTC removed the staged indexes, which was correct, and nothing needed preserving.
Lesson recorded: no Convex CLI command runs on Presidium; codegen and every other CLI step run on
CT114 through `presidium-dev`, where no cloud credential is present.

### 2026-09-20 — incident: shared origin URL re-pointed

While initialising the vendor submodules in the slice worktree (GitHub unreachable from
Presidium, so `vendor/forge-steel` stayed an empty directory after the failed clone),
`git -C vendor/forge-steel remote set-url origin https://github.com/andyaiken/forgesteel.git`
resolved to the parent repository and overwrote the shared `remote.origin.url` in `.git/config`
(root checkout and every worktree). The WIZARD thread's candidate push failed with 403 at 03:14 UTC
and reported it. Restored to `https://github.com/illos/salient.git` at 03:15 UTC; no push had
succeeded to the wrong remote. Lesson: never run `git -C <path>` against a directory that is not
yet a repository; check `git -C <path> rev-parse --show-toplevel` first.

### 2026-09-20 — CT114 verification

Isolated environment `campaign-home` (`presidium-dev --env campaign-home up` from the slice
worktree; source `136f7e2`; backend and web healthy, "Convex functions ready" 03:21:53 UTC).
Full `pnpm check` on the environment: exit 0 (lint; 284 engine tests; 423 app and scripts tests
including `tests/app/campaign-home.test.ts`; 278 Markdown files linked; vendor pins; content,
supporting and foes checks; production build). Environment stopped afterwards, volumes retained.

Headless proof (`node scripts/v68-headless.ts`, evidence in [`evidence/V68`](evidence/V68/README.md)):

| Capability / scenario | CLI/API entry point | Headless command, source, target and persisted evidence | Headless result | Browser result and additional gap |
| --- | --- | --- | --- | --- |
| Campaign projection carries members with heroes, session count and last played; no role tags | `campaigns.get` | step 1, `evidence/V68/headless.json`, exit 0 | pass | pending (moratorium; backlog rows logged) |
| Join requests reviewed from the pop-up | `campaigns.requestJoin`, `campaigns.approveRequest` | step 2 | pass | pending |
| Presence: heartbeat lists a member, non-member refused, leave removes | `presence.heartbeat`, `presence.list`, `presence.leave` | step 3 (expiry after 90 s covered by `tests/app/campaign-home.test.ts`) | pass | pending |
| Chat: member-only, blank refused, retry returns the same id, no game-log entry, undo window unchanged | `chat.send`, `chat.list`, `events.list`, `history.status` | step 4 | pass | pending |
| Start session selecting every member (interim), title on start, player title refused, Director retitle | `sessions.start`, `sessions.setTitle`, `sessions.list` | step 5 | pass | pending |
| Closing updates `sessionCount`/`lastPlayedAt`, closed session accepts a title, RECAP reads that session's log | `sessions.transition`, `campaigns.get`, `events.list` with `sessionId` | step 6 | pass | pending |
| Hero admission from the pop-up lists the hero under its owner with level 1; unapproved hero absent; pending applicant cannot read the campaign | `characters.create/save/submit`, `characters.reviews`, `characters.approve`, `campaigns.get` | step 7 | pass | pending |
| Foe management remains reachable headlessly after leaving the campaign home | `foes.list` | step 8 | pass | pending |
| Replace code and link from the pop-up changes the share code and keeps pending requests | `campaigns.regenerateShareCode`, `campaigns.get` | step 2 (rerun `v68-mu99p51j`) | pass | pending |
| The Director narrows the interim all-members roster after start | `sessions.setPlayers`, `sessions.list` | step 5 (rerun `v68-mu99p51j`) | pass | pending |

Elapsed 12.8 s; no fixture or infrastructure failures in the final run. The first run failed before
any step on a Node ESM import-extension error in the script itself (fixed in `136f7e2`), not a
product defect.

### 2026-09-20 — independent review round 1: changes required, addressed

Reviewer (fresh Fable subagent, static review of `1f65278..f5eddbf`): **changes required**.
Blocking findings and repairs:

1. Hero-level assertion could not fail (both heroes level 1 and `campaigns.get` defaulted to 1).
   Repaired: the projection lists only characters with an effective revision and takes the level
   from it, with no default; the test levels Thorn to 2 through the real V32 advancement route
   (`characters.saveAdvancement` / `finalizeAdvancement`, fixture XP only) and expects `2`.
2. Acceptance check 4 unproven. Repaired: new test closes six sessions and asserts numbering
   `6..1` from the oldest with players and close times, and that `events.list` for the third
   session returns only that session's two events.
3. `chat.list` paging could skip a message sharing the boundary millisecond. Repaired: `chat.send`
   keeps `createdAt` strictly increasing per campaign (mutations are serialized), and a test sends
   52 messages under a frozen clock and reads both pages back with no loss or repeat.

Non-blocking findings addressed: `web/command-input.tsx` deleted (no importers); untitled rows now
show the number only; the stale "detach" comment corrected; the pending-hero test comment fixed;
the headless script now also proves Replace code (`campaigns.regenerateShareCode`) and roster
adjustment after the interim start (`sessions.setPlayers`). Known bound recorded: `sessions.list`,
`number` and `sessionCount` cover the newest 50 sessions (the existing `take(50)` page); the
session screen slice inherits it. The CT114 `pnpm check` log remains on the environment volume
(`/artifacts/v68/check.log`); the exit file and summary are in the evidence README.

Local (Presidium, now a permitted peer test environment per the user's 03:30 UTC rule): eslint,
prettier, tsc pass; `tests/app/campaign-home.test.ts` (6) and `access-sessions.test.ts` pass.
CT114 rerun of the full check and the headless proof follows in the next free window.

### 2026-09-20 — CT114 rerun after review fixes

Environment `campaign-home` resynced to `ed83dff` ("Convex functions ready" 03:39:06 UTC).
`scripts/v68-headless.ts`: 8/8 steps pass in 13.3 s (run `v68-mu99p51j`), now including
`campaigns.regenerateShareCode` (check 6) and `sessions.setPlayers` after the interim start
(check 8). Full `pnpm check`: exit 0, 284 engine and 425 app/scripts tests (six in
`campaign-home.test.ts`), build. Both logs are in `evidence/V68/`. Environment stopped, data kept.
The headless table above stands with these additions: check 4 is now proven by the six-session
test; check 7's level is proven at level 2 through the advancement route.

### 2026-09-20 — independent review round 2: pass; branch handoff

Reviewer verdict **pass** ([review record](reviews/V68-implementation-review.md)). All ten
acceptance checks proven headlessly or by code reading; browser scenarios stay in the backlog under
the moratorium. `Reviewed-By: v68_review (pass, 2026-09-20)` added to the branch commits.

Handoff state: **committed on `slice/V68`, not merged.** Main integration, the shared CT114 `main`
runtime update and the live changed-feature check follow the user's merge request under the merge
completion directive. Runtime impact when merged: additive schema (three new tables/fields, no
migration), new `presence` and `chat` modules, changed `sessions` and `campaigns` projections, and
the rebuilt campaign home; existing play data is compatible.

### 2026-09-20 — merge complete: main and shared playable app

User requested the merge ("merge to main so I can preview it there"). Completed merge:

- **Git:** main fast-forwarded to `3ca24e8` (branch base `e5c1cd8` was current main; no rebase or
  conflicts). `check-commit --merge` passes; every code commit carries `Reviewed-By: v68_review`.
- **Integrated check:** full `pnpm check` on the integrated tree in the isolated `campaign-home`
  environment: exit 0 (284 engine tests, 466 app/scripts tests, 302-file link check, build).
- **Shared playable target:** the default CT114 `main` slot, Compose `salient-dev-b90776c53141`,
  `https://salient-dev-fc4f48cb09a0.tail41404c.ts.net`, updated with `presidium-dev up` from the
  canonical checkout: source `3ca24e8`, "Convex functions ready" 04:06:36 UTC, install job exit 0,
  additive schema applied, existing data retained (no reset or seed). Web and `/api/auth/ok` both
  HTTP 200 from Presidium.
- **Live changed-feature check:** `scripts/v68-headless.ts` against shared main: 8/8 steps pass
  (`evidence/V68/main-headless.json`) using disposable accounts and a disposable campaign named
  `Headless <run>`; the user's existing campaigns were not touched.
- Isolated `campaign-home` environment stopped, data retained. `slice/V68` retired after this
  closeout commit; the worktree stays for the next UI slice.
- Browser verification remains pending under the moratorium (backlog rows logged); the user will
  view the page on shared main.
