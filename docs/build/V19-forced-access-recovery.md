# V19: Forced access changes and combat recovery

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | V10 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Implement prompt loss of authorization when a participant is kicked, blocked, revoked or deleted, and
define what happens to a running combat when that participant's character or Director role is
affected: detachment timing, turn entries, pending cards, character locks, Director fallback to the
owner and the standalone Void-while-paused path. This is distinct from ordinary party-roster editing
and from campaign deletion's separate policy.

## Spec references

- `docs/v1-spec-checkpoint.md#remaining-work-before-complete-v1-play` — item 4: forced access changes.
- `docs/accounts-and-access-spec.md#11-remaining-decisions` — forced removal and grant revocation during combat; early Director removal.
- `docs/accounts-and-access-spec.md#membership-departure-and-retained-history` — kick/leave removes access immediately.
- `docs/accounts-and-access-spec.md#6-exactly-one-active-director` — effective Director calculation and fallback.
- `docs/accounts-and-access-spec.md#campaign-and-account-deletion` — deletion during active combat.
- `docs/table-spec.md#account-deletion-during-play` — table behavior.
- `docs/table-spec.md#voiding-an-encounter` — keep/reset, including while paused.
- `docs/table-spec.md#mid-combat-additions-and-regrouping` — removing the current actor finishes its turn.
- `docs/table-spec.md#character-sheet-lock-during-encounters` — lock release.

## In scope

- Authorization revalidation on every table operation and subscription so a removed user's next call fails.
- Combat recovery contract: removed hero's turn entry, pending response cards, effects it owns, and detachment applied after the encounter records are consistent.
- Director removal mid-combat: owner becomes effective Director in the same transition; combat continues.
- Grant revocation mid-turn for a delegated controller.
- Standalone Void while paused for these transitions.

## Out of scope

- Ordinary party-roster changes (still combat-locked) and campaign deletion's no-prompt policy (V10).
- Retainers or friendly monsters.
- Inventing an initiative or turn outcome for the removed character beyond what the table spec's removal rule states.

## Inputs and dependencies

- Hard: V10 (blocking, kick, deletion); A09 combat and Void.
- Soft: V11 grants; if absent, test revocation with the owner-only control path.

## Deliverables

- `docs/forced-access-recovery-contract.md` — the transition table (event × combat state → actions), each step citing its spec section.
- Authorization middleware for operations and subscriptions; recovery operations invoked by kick/block/delete/revoke.
- Convex-test cases per transition; browser test for a kicked player losing the table live.
- Implementation notes in `docs/accounts-and-access-spec.md#11-remaining-decisions`.

## Acceptance checks

1. Kicking a player whose hero is the current actor finishes that turn per the removal rule, resolves end-turn work, and the next group starts; the kicked client's next operation returns a permission error.
2. Blocking the active Director from the owner makes the owner the effective Director immediately; a Director-only operation by the old Director fails and by the owner succeeds, mid-combat.
3. Deleting an account whose hero is in another campaign's combat succeeds; that hero is detached with combat values cleared and the encounter remains playable.
4. Revoking a grant while the grantee has a pending card removes their ability to answer it; the card stays open for the owner or Director.
5. Void while paused after a forced removal applies keep/reset, keeps the session paused and preserves the roster lock.
6. Every transition in the contract has a test whose expected state is derived from the cited spec sentence.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/combat/turn.md`, `rule/combat/combat-round.md`, `rule/combat/end-of-turn.md` — to confirm nothing in the source contradicts the administrative removal rule.

Rulings that apply: removing the current monster finishes its turn (table spec); Director Void while paused with keep/reset.

## Open questions

Candidate `Q-V-n` entries from `docs/accounts-and-access-spec.md#11-remaining-decisions`:

- Early Director revocation/removal beyond the confirmed fallbacks.
- Combat participation handling on account deletion ("still needs an operational contract").
- Former-member campaign-history access.

## Work log

_Empty._
