# V12: Campaign chat

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required |
| Depends on | A09 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Provide campaign chat as the only V1 messaging surface: a campaign-scoped, persistent, realtime
message stream separate from the game log, readable and writable by every campaign member including
observers, with no author editing or deletion, no direct messages, no notifications, deleted with the
campaign, and username attribution preserved after account deletion. It must meet the table's
sustained-use requirements and not compete with the game log's ordering.

## Spec references

- `docs/table-spec.md#game-log-and-chat-scope` — chat and log are separate entities.
- `docs/table-spec.md#campaign-observers-and-party-chat` — observers may chat, cannot act.
- `docs/accounts-and-access-spec.md#friends-and-blocking` — confirmed chat policy: no edit/delete; blocked users in a third-party campaign still see each other's messages.
- `docs/v1-spec-checkpoint.md#discovery-blocking-chat-and-deletion` — deletion and attribution rules.
- `docs/v1-spec-checkpoint.md#release-scope` — Messaging row.
- `docs/table-spec.md#sustained-use-and-realtime-requirements` — long-session behavior.
- `docs/inventory-spec.md#objects-shared-through-messages` — read to bound: object sharing is deferred design.
- `docs/data-architecture-spec.md#6-session-closure-and-compression` — chat retention across closed sessions.

## In scope

- Chat message table keyed by campaign with author id, username snapshot, timestamp, text.
- Send operation for members and observers; read subscription for members; pagination for long histories.
- Chat pane on the table and campaign hub, separate from the game log.
- Removal with campaign deletion; attribution retained after account deletion.

## Out of scope

- Editing/deleting sent messages, direct messages, notifications, bookmarks, moderation powers (`docs/accounts-and-access-spec.md#friends-and-blocking`).
- Rich object sharing from inventories (`docs/inventory-spec.md#objects-shared-through-messages`, speculative).
- Mixing chat into the game log or giving chat gameplay undo seams (`docs/table-spec.md#undo-permissions-and-proposed-campaign-control`).

## Inputs and dependencies

- Hard: A09 (campaign membership, observer role, table shell).
- None stubbed.

## Deliverables

- Convex table and indexed paginated query; registered `chat.send` operation (name proposed).
- Chat pane component with no rules logic.
- Convex-test cases for the checks; browser test for two clients exchanging messages.
- Implementation note in `docs/table-spec.md#game-log-and-chat-scope`.

## Acceptance checks

1. A message sent by an observer appears in another member's subscription; the observer's attempt at any gameplay operation is still refused.
2. No operation exists that edits or deletes a message by its author; the authorization helper rejects such a mutation if invoked headlessly.
3. Sending a chat message creates no game-log entry and no undo seam (a player's undo window is unchanged before and after).
4. Deleting the campaign removes every chat row for it; deleting an author account leaves their rows with the username snapshot.
5. A 5,000-message history loads through pagination without the table subscription exceeding the measured payload budget recorded in the work log.
6. A non-member's read query returns a permission error.

## Rules research

None.

## Open questions

Candidate `Q-V-n` entries:

- Messaging object types and disclosure (`docs/inventory-spec.md#continue-exploring`, item 5).
- Former-member access to campaign chat history (`docs/accounts-and-access-spec.md#11-remaining-decisions`).

## Work log

- 2026-09-20 — A light version of this slice is built by [V68](V68-campaign-home.md) at the
  user's direction: `chatMessages` table, `chat.send` and `chat.list` (members only, no edit or
  delete, display-name snapshot, `commandId` retry identity, no game-log entry, no undo seam) and
  the Table chat pane on the campaign home. Not covered there: the table pane, the 5,000-message
  payload budget (check 5) and removal on campaign deletion (check 4, no deletion operation exists
  yet). The user expects a longer-term game-log/chat hybrid inside the session; that is separate.
