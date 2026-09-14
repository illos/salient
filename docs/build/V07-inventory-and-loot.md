# V07: Inventory, loot and Director stash

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | A09, V06 |
| Unblocks | None; V09 import of held items and V13 Items library are soft consumers |
| Status | see `STATUS.md` |

## Goal

Deliver the campaign-level inventory system deferred from v0.01: individual item instances with
equipped/unequipped state, character and party inventories with transfers, one persistent Director
stash per campaign with visibility toggle, provisional claims, Director approval and deposit, wrap-up
integration, Void keep/reset reconciliation, and a Director-reviewable inventory history. Item rules
effects are shown from source; automation of item mechanics waits for sourced contracts.

## Spec references

- `docs/inventory-spec.md#confirmed-v1-direction` — inventories, equipped state, transfers, authority.
- `docs/inventory-spec.md#directors-stash` — single persistent stash, Director authority.
- `docs/inventory-spec.md#v1-encounter-rewards-stashes` and `docs/inventory-spec.md#claims-and-director-finalization` — claims, reservation, approval.
- `docs/inventory-spec.md#inventory-history` — review/undo/redo permissions.
- `docs/table-spec.md#campaign-inventories` — observers, hide cancels claims, no stacks, pause behavior.
- `docs/accounts-and-access-spec.md#inventory-and-object-sharing` — visibility and claim authority.
- `docs/v1-spec-checkpoint.md#loot-and-history` — Void restore returns loot/stash state to snapshot.
- `docs/character-wizard-spec.md#fuller-product-scope` — starting equipment belongs to creation.

## In scope

- Item instance model from the pinned Items corpus; equipped/unequipped flag; no quantities.
- Character and party inventories; transfers between them; player discard; Director direct edits under the combat lock.
- Stash: add/remove any time; hidden by default; reveal toggle; claims reserve; withdraw; approve deposits; hide cancels claims.
- Wrap-up claims and Void keep/reset reconciliation without duplicate items.
- Inventory history with Director undo/redo; owner retains personal history after detachment.

## Out of scope

- Item stacks, free-text/custom items, player item creation, direct character-to-character transfers, standalone saved stashes, shops/chests (`docs/table-spec.md#campaign-inventories`).
- Automated item mechanics, consumables, currency (`docs/inventory-spec.md#continue-exploring`, item 3).
- Starting-equipment wizard step (V08 owns creation choices).

## Inputs and dependencies

- Hard: A09; V06 for prepared rewards entering the stash.
- Hard: S01 Items corpus with core/supplemental classification (V13 shares it; if V13 has not landed, read the classification from S01 directly).

## Deliverables

- Convex tables for items, inventories, stash, claims, inventory history; shared contracts.
- Registered operations for every transfer, claim, approval, visibility and edit action.
- Convex-test cases for the checks; browser test for reveal–claim–approve.
- Implementation notes in `docs/inventory-spec.md`.

## Acceptance checks

1. A revealed stash item claimed by player A is refused to player B until A withdraws; state read from the stash query.
2. Hiding the stash cancels A's claim and releases the reservation; a previously approved deposit remains in A's inventory.
3. An observer's claim operation is rejected with a logged reason.
4. Void restore after a wrap-up deposit returns the item to the stash exactly once, with no duplicate instance in any inventory.
5. A player's attempt to undo their own inventory transfer is refused regardless of the campaign undo setting; the Director's undo of it succeeds and redo restores it.
6. Detaching a character keeps its inventory and its owner-readable personal inventory history.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/treasure/consumable.md`, `rule/treasure/trinket.md`, `rule/treasure/leveled-treasure.md`, `rule/treasure/enhancement.md`, `rule/treasure/implement.md`
- `vendor/steel-compendium/en/unified/md/chapter/rewards.md`, `chapter/kits.md`
- `vendor/steel-compendium/en/unified/md/treasure/` (structure only, to size the item instance model).

Equipped-state effects and eligibility require research before any automation (`docs/inventory-spec.md#confirmed-v1-direction`).

## Open questions

Candidate `Q-V-n` entries from `docs/inventory-spec.md#continue-exploring` and `docs/v1-spec-checkpoint.md#remaining-work-before-complete-v1-play` (item 3):

- Wrap-up deposit timing versus character-lock release.
- Authority over shared characters' and other players' inventories.
- Outside-session stash claim eligibility.

## Work log

_Empty._
