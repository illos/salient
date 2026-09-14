# V10: Accounts: settings, password reset, friends, blocking, share codes, deletion

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required |
| Depends on | A09 |
| Unblocks | V11, V19 |
| Status | see `STATUS.md` |

## Goal

Complete regular-account behavior on the selected Better Auth integration: account settings, password
reset as the only email flow, session revocation on credential change, friend requests through personal
share codes/URLs, user blocking with its campaign and share consequences, regenerable personal and
campaign share codes, campaign join requests, and account and campaign deletion with the confirmed
retention rules. No notification system, username search, direct messages, admin dashboard, archiving
or ownership transfer.

## Spec references

- `docs/accounts-and-access-spec.md#friends-and-blocking` — confirmed friend/block requirements, share codes, no notifications.
- `docs/accounts-and-access-spec.md#4-friendship-and-blocking-foundation` — proposed transitions.
- `docs/accounts-and-access-spec.md#5-campaign-discovery-requests-and-blocking` — join requests, block checks, regeneration.
- `docs/accounts-and-access-spec.md#proposed-regular-account-behavior` — stable id, password reset only, session revocation.
- `docs/accounts-and-access-spec.md#8-membership-removal-history-and-other-owned-content` — campaign and account deletion.
- `docs/accounts-and-access-spec.md#11-remaining-decisions` — open items.
- `docs/v1-spec-checkpoint.md#discovery-blocking-chat-and-deletion` — settled boundaries.
- `docs/v1-tech-stack-spec.md#7-authentication-and-email` — Better Auth, email deferred beyond reset.
- `docs/table-spec.md#account-deletion-during-play` — deletion during active combat.

## In scope

- Settings: display name, profile identifier, credential change with recent-auth requirement, sign-out everywhere.
- Password reset flow with a provider-agnostic email adapter and a local development mailbox.
- Friend request send/approve/deny/revoke; relationship states unaffiliated/friend/blocked with pending directions.
- Block: removal from blocker-owned campaigns, admission prevention, share revocation both ways; unblock restores nothing.
- Personal and campaign share codes/URLs with regeneration invalidating old codes but not pending requests.
- Campaign deletion (detach characters, delete chat/logs/foes/party inventory/stash, keep saved encounters) and account deletion (delete owned campaigns, characters, saved encounters; keep attribution; owner becomes Director in retained campaigns).

## Out of scope

- Notifications of any kind, username search, public directory, direct messages, admin dashboard, archiving, ownership transfer (`docs/v1-spec-checkpoint.md#release-scope`).
- Email verification gates and old-address notifications (`docs/accounts-and-access-spec.md#proposed-regular-account-behavior`).
- Combat recovery after forced removal (V19) and character grants (V11).

## Inputs and dependencies

- Hard: A09; existing Better Auth wiring in the checkout.
- Soft: email provider; stub with `fixtures/dev-mailbox` capturing reset messages locally.

## Deliverables

- Convex tables for relationships, requests, share codes; auth hooks for reset and revocation.
- Registered operations for every action above; settings and friends UI.
- Convex-test cases for the checks; browser test for the reset round trip via the dev mailbox.
- Implementation notes in `docs/accounts-and-access-spec.md`.

## Acceptance checks

1. Password reset invalidates all other sessions: a second logged-in client's next query fails authentication.
2. Blocking user B from user A removes B's membership in A's campaigns, revokes shares in both directions (read back from the grants table), and B's join request via A's regenerated code is refused.
3. Regenerating a campaign code makes the old code return "invalid" while a request pending under it still appears for approval.
4. Deleting a campaign detaches attached characters with level/build/inventory intact and XP/Victories cleared, and leaves the owner's saved encounters.
5. Deleting an account that is the active Director of another user's campaign makes that campaign's owner the Director; the deleted user's chat lines keep their username.
6. No notification record or email other than password reset is produced by any operation.

## Rules research

None.

## Open questions

Candidate `Q-V-n` entries from `docs/accounts-and-access-spec.md#11-remaining-decisions`:

- Invitation/block races and re-request cooldown.
- Former-member campaign-history access.
- Campaign-deletion character-state settlement (retain current recorded values before detachment resets is a proposal).
- Exact email-change mechanism with Better Auth.

## Work log

_Empty._
