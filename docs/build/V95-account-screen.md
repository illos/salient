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
- Profile: portrait upload and removal (Convex file storage, image under 2 MB, shown in the
  header, the sidebar and the campaign members cards); display name (the app profile other
  players see); email change through Better Auth's change-email route (addresses are unverified
  in this app, so the change is direct; an address another account uses is refused without
  saying whose).
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
2. Portrait: a stored image sets `users.portraitId` and `auth.viewer.portraitUrl`; replacing it
   removes the earlier file (its `_storage` row is gone); a non-image is refused and its upload
   deleted; clearing removes the file and the field.
3. Devices: two sessions for one user list with the current one first and marked; revoking the
   current one is refused; revoking the other leaves one and that identity's `auth.viewer` is
   null; `revokeOtherDevices` leaves only the current session.
4. Deletion cascade (`internal.account.continuePurge` on a fixture table): the owned campaign and
   its memberships, sessions, events and chat are gone; another player's attached hero is detached
   (`campaignId` null, `liveState` null, `combatLocked` false) with its revisions intact; the
   deleted user's own characters are gone; the membership in another user's campaign is gone while
   that user's chat line keeps `authorName`; the `users` row is gone.
5. Real route: `POST /api/auth/delete-user` with the password removes the Better Auth user and,
   through the trigger, the app profile and its owned campaign.
6. Quiet greps on `web/account/**`, `web/router.tsx`, `web/components/session-user.tsx` and
   `web/components/disc.tsx`: no raw hex, `uppercase`, `tracking-caps`, `shadow-hard`,
   `rule-strong`, text under 13px or weights over 500. Browser scenarios logged in the
   [browser coverage backlog](browser-coverage-backlog.md).
7. TESTER: `CI=true pnpm check` passes on the candidate commit.

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
required full gate remain assigned to TESTER after the candidate commit. Browser scenarios are in
the backlog under the standing V66 moratorium.
