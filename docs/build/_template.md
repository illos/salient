# <ID>: <Slice title>

| Field | Value |
| --- | --- |
| Family | R / S / A / V |
| Milestone | v0.01 / V1 |
| Owner type | Rules team / App team / App lead |
| Rules review | required / not required |
| Depends on | <slice ids, or None> |
| Unblocks | <slice ids> |
| Status | see `STATUS.md` |

## Goal

One paragraph: the user-visible or contract-level outcome this slice delivers, and the boundary it
must not cross.

## Spec references

Every section this slice implements. These are the `Spec:` trailers for the slice's commits.

- `docs/<file>.md#<anchor>` — what this section governs for the slice.

## In scope

Bulleted, concrete. Each bullet should map to at least one acceptance check below.

## Out of scope

What a reasonable implementer might be tempted to include but must not. Cite the deferral.

## Inputs and dependencies

What must exist before starting, which dependencies are hard, and which may be stubbed with a named
development fixture (`fixtures/<name>`) that is deleted or replaced when the real dependency lands.

## Deliverables

Files, tables, operations, documents, tests. Be specific enough that a reviewer can check presence.

## Acceptance checks

Numbered. Each is verifiable by a reviewer without the implementer present: the command or scenario,
the expected persisted state or output, and how to read it back.

## Rules research

`None` or: the Compendium paths to read first, the mechanical claims this slice makes, and which of
them already have a ruling in `docs/gameplay-decision-record.md`. Do not implement a claim that is not
grounded here or in a cited spec section.

## Open questions

Questions already known to need the user, with their ids in `docs/rules-questions-for-user.md`. Add
new ones there, not here.

## Work log

Append-only. Plan, decisions, verification output, review verdicts, commit hashes, closing summary.

At integration, follow [merge completion](README.md#merge-completion-includes-the-playable-app): record
whether this is a branch handoff or a completed merge; the merged commit and shared playable target;
affected backend/content/frontend update results; live changed-feature checks and evidence; and any
pending work. For no-runtime-impact changes, explain why no sync or live feature check is needed.
Git integration alone does not complete an ordinary merge request.
