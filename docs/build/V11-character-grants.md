# V11: Character grants and delegated play

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required |
| Depends on | V10 |
| Unblocks | None; V19 revocation recovery consumes the grant model (soft) |
| Status | see `STATUS.md` |

## Goal

Let a character owner grant several same-campaign users sheet reads, progression-history reads and
eligible table control at once, session-scoped or until revoked, never build editing; keep notes
owner-private and personal inventory reads limited to owner and active Director; and enforce the
audience in shared reads and headless operations, not only in the UI. Existing-player takeover
requires a valid prior share; no exclusive-controller lease exists.

## Spec references

- `docs/accounts-and-access-spec.md#7-character-visibility-and-delegated-play` — grants, privacy boundary, peer visibility.
- `docs/v1-spec-checkpoint.md#characters-sharing-and-visibility` — grant scope and lifetimes.
- `docs/table-spec.md#acting-on-behalf-of-a-character` — Director acts without a share; player takeover needs a prior share.
- `docs/table-spec.md#party-sheets-and-resource-visibility` — Stamina/Recoveries visible to peers.
- `docs/table-spec.md#character-sheet-lock-during-encounters` — grants never unlock builds.
- `docs/character-sheet-spec.md#views-permissions-and-persistence` — sheet views by permission.
- `docs/accounts-and-access-spec.md#friends-and-blocking` — a block revokes shares both ways.

## In scope

- Grant record: character, grantee, scope (sheet read, history read, table control), lifetime (session or until revoked).
- Owner create/revoke; automatic expiry at session closure for session-scoped grants.
- Table control through the existing acting-character mechanism; Take turn switches the grantee's pane.
- Server-side exclusion of owner-private notes and of personal inventory from grantees' queries, subscriptions and review snapshots.
- Revocation on block, kick and detachment.

## Out of scope

- Build editing or progression choices by grantees (never granted).
- Combat recovery when a controlling grantee is removed mid-combat (V19).
- Configurable party-resource visibility policy (possible later extension, not V1).
- Player visibility without a grant beyond Stamina/Recoveries (`docs/character-wizard-spec.md#12-open-decisions`).

## Inputs and dependencies

- Hard: V10 (friends/blocking, membership removal semantics).
- Hard: A09 acting-character and Take turn operations.

## Deliverables

- Grants table and authorization helper used by every character query and table operation.
- Registered operations: grant create/revoke; grant-aware Take turn.
- Convex-test cases proving exclusion at the query level; browser test for a grantee acting at the table.
- Implementation notes in `docs/accounts-and-access-spec.md#7-character-visibility-and-delegated-play`.

## Acceptance checks

1. Granting two users at once produces two grant rows; each can read the sheet and progression history, and neither response payload contains the notes field.
2. A grantee's attempt to submit a build revision is refused at the operation level.
3. A session-scoped grant is absent from the grants query after session closure; an until-revoked grant persists into the next session.
4. Blocking between owner and grantee deletes the grant in both directions.
5. A grantee's Take turn succeeds and the log attributes the issuer separately from the acting character.
6. A grantee's personal-inventory query returns a permission error; the active Director's succeeds.

## Rules research

None.

## Open questions

Candidate `Q-V-n` entries from `docs/character-wizard-spec.md#12-open-decisions` and `docs/table-spec.md#next-baseline-contracts` ("Character switching"):

- Additional private-field exclusions beyond notes and personal inventory.
- Passive sheet-switch prompts other than explicit Take turn.

## Work log

_Empty._
