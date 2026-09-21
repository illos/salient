# V95: Account screen

Rules review: not required. Depends on: V39 (Better Auth wiring and recovery), V75 (Quiet theme).

## Goal

One screen for the signed-in user's own account, opened from the portrait disc in the header:
profile (portrait, display name, email), security (signed-in devices, password), preferences
(appearance) and account deletion under the confirmed retention rules. The header keeps only the
connection pip and the disc. Not in this slice: friends, blocking, personal share codes,
owner-initiated campaign deletion, email verification, notifications, account-side preference
storage.

## Scope

- Header: the connection status collapses to the pip (its text stays for assistive technology);
  the theme switch, the name and Sign out leave the header; the disc links to `/account`. The
  session header does the same. The login page keeps its switch.
- `/account` (Profile), `/account/security`, `/account/preferences`, `/account/delete`: a sidebar
  of sections beside one `card` panel, after `docs/design-mockups/quiet/account-light.png`.
- Profile: portrait upload and removal (Convex file storage, an account-bound short-lived upload
  ticket, orphan cleanup, image under 2 MB, shown in the header, the sidebar and campaign member
  cards); display name (the app profile other players see); email change through Better Auth's
  change-email route (addresses are unverified in this app, so the change is direct; an address
  another account uses is refused without saying whose).
- Security: signed-in devices from Better Auth's session table with the current one marked; sign
  out one device or every other device; change password (current password required, other
  sessions revoked); sign out this device.
- Preferences: appearance (light, dark, system), still stored in this browser by `web/theme.ts`.
- Delete account: password-confirmed Better Auth deletion; the user-delete trigger purges app
  data in the same transaction: owned campaigns with everything campaign-owned, other players'
  characters detached with campaign values cleared, the account's own characters deleted
  everywhere, memberships and requests, command receipts, the portrait, the profile row. Events
  and chat in retained campaigns keep their name snapshots.

Spec:

- `docs/accounts-and-access-spec.md#accounts-and-administration`
- `docs/accounts-and-access-spec.md#proposed-regular-account-behavior`
- `docs/accounts-and-access-spec.md#campaign-and-account-deletion`
- `docs/design-mockups/quiet/README.md#rules-of-thumb-for-new-screens`

Interpretations, labelled as such: detachment clears `liveState`, which holds XP and Victories
together with the current Stamina and resources; the spec's proposal to preserve a copy of the
current recorded state first is not implemented because nothing reads such a copy yet. A deleted
character in another campaign's committed encounter leaves participant references that resolve to
nothing; closeout and actor lookups already tolerate a missing hero, and the spec leaves the
affected combat participation contract open. The "active Director replaced by the owner" rule is a
no-op while the owner is always the Director. Mockup departures: the email hint reads "Used to
sign in and to recover your password" (no verification, invitations are share links, no
reminders); the header shows the disc alone, as pictured, and the name sits on the account screen.

## Acceptance checks

1. `CI=true pnpm exec vitest run tests/app/account.test.ts`: a display name change persists on the
   `users` row and is what `campaigns.get` returns for the member; empty and over-long names are
   refused.
2. Portrait: an account-bound ticket accepts its new stored image, sets `users.portraitId` and
   `auth.viewer.portraitUrl`, and cannot claim or delete another profile's exposed storage ID;
   replacing removes the earlier file; non-image and over-2-MB uploads are deleted; an unclaimed
   upload is cleaned after expiry; clearing removes the file and field.
3. Devices: explicit Convex cursors list all Better Auth session pages, with the current one first
   after client-side expiry filtering; Better Auth's revoke-session route removes one chosen
   device, and a repeated bounded mutation removes every other device. A 102-session fixture proves
   listing and revocation beyond Better Auth's pinned 100-row default.
4. Deletion cascade (`internal.account.continuePurge` on a fixture table): the owned campaign and
   its memberships, sessions, events and chat are gone; another player's attached hero is detached
   (`campaignId` null, `liveState` null, `combatLocked` false) with its revisions intact; the
   deleted user's own characters are gone; the membership in another user's campaign is gone while
   that user's chat line keeps `authorName`; the `users` row is gone.
5. A fixture with `PURGE_BUDGET + 1` command receipts spends the first transaction's budget,
   schedules a continuation, then removes the last receipt and profile when scheduled work drains.
6. Real route and headless journey: `POST /api/auth/delete-user` with the password removes the
   Better Auth user and, through the trigger, the app profile and owned campaign; an unauthenticated
   `campaigns.preview` persisted readback confirms the deleted campaign is no longer reachable.
7. Quiet greps on `web/account/**`, `web/router.tsx`, `web/components/session-user.tsx` and
   `web/components/disc.tsx`: no raw hex, `uppercase`, `tracking-caps`, `shadow-hard`,
   `rule-strong`, text under 13px or weights over 500. Browser scenarios logged in the
   [browser coverage backlog](browser-coverage-backlog.md).
8. TESTER: `CI=true pnpm check` passes on the candidate commit.

## Work log

2026-09-20: branch `slice/V95`, worktree `.worktrees/account-screen`, base main `3d5991a`. User
request in the UI thread: collapse the connection status to the pip; an account screen from the
header disc with Profile, Security, Preferences and Delete account; theme settings move to
Preferences. The user's mockup is saved as `docs/design-mockups/quiet/account-light.png`. V94 was
already taken by the Tactician slice, so this is V95.

2026-09-21: the original UI thread reached its session limit before committing. UI3 recovered its
working tree, rebased it onto main `1d3c54c` (including UI2's completed navigation polish), and
finished the backend, deletion cascade, shared CLI action support, authenticated headless journey,
tests and slice records. Authoring checks on the recovered candidate: `tsc -p tsconfig.web.json`
passed; targeted ESLint and Prettier passed; the four focused app/script files passed (21 tests,
6.86 s); the quiet-theme grep and `git diff --check` passed. The isolated headless journey and the
required full gate were assigned to TESTER after the candidate commit. Browser scenarios are in the
backlog under the standing V66 moratorium.

2026-09-21: TESTER passed candidate `7b481ef`: `CI=true pnpm check` completed 949 checks in
181 seconds, then an isolated Convex push/codegen and `pnpm test:headless:account` passed in 5.28
seconds. Artifacts: `/srv/presidium/projects/salient/test-artifacts/V95-7b481ef`. Codegen also
restored the omitted generated declaration for the already-present `lib/conditionInstances`
module; that generated-only repair is included in the closeout commit and does not change tested
runtime inputs.

2026-09-21: independent review rejected `7b481ef` because a caller could submit another account's
exposed storage ID, abandoned uploads had no cleanup, the custom device query depended on
`Date.now()` and a 200-row cap, the headless deletion stopped at auth loss, and the bounded purge
had no continuation-scale proof. The repair binds each upload to a short-lived profile ticket,
refuses already-owned storage IDs, schedules orphan cleanup, and proves server-side type/size
enforcement. Device listing/revocation first moved to Better Auth's routes directly. The headless
journey reads the owned campaign back as absent after deletion, and a `PURGE_BUDGET + 1` fixture
proves the scheduled continuation. The revised focused file passed all six tests in 4.47 seconds.

2026-09-21: re-review found that pinned Better Auth itself applies a 100-row default to its
unbounded list/revoke-other routes. The final repair follows explicit component cursors for reads
and repeats a bounded mutation for revocation; a 102-session fixture proves neither path truncates.
The seven focused account tests passed in 3.61 seconds, including that 102-session case. ENGINE's
fresh-context review passed rebased candidate `d102db0`; together with Orchestrator's full-diff
review, this closes every blocking finding.

2026-09-21: TESTER passed rebased candidate `d102db0`: `CI=true pnpm check` completed 961 checks in
169 seconds; isolated Convex push/codegen was ready in 2.9 seconds with no generated diff; and
`pnpm test:headless:account` passed in 5.02 seconds, including the owned-campaign deletion
readback. The backend was stopped and the tracked worktree was clean. Artifacts:
`/srv/presidium/projects/salient/test-artifacts/V95-d102db0`.

2026-09-21: DEPLOY2 fast-forwarded reviewed tip `1115380` into main and published the backend
and frontend successfully. Hosted build passed; Worker `72e2c950-8477-4c4a-895c-ed6b2c3026f1`.
The accepted `d102db0` results were reused without smoke/live checks or test reruns. Content
was unchanged, so no reseed was needed. Release logs:
`/srv/presidium/projects/salient/test-artifacts/V95-release-1115380`.
