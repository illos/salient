# Campaign inventory and loot

Version 0.19 — consolidated specification checkpoint, 2026-09-11. Specification only; no implementation
(still true 2026-09-14: `convex/` has no inventory tables or operations).

This records confirmed inventory direction separately from proposed loot flows and unresolved mechanics.
Related specifications: [table](table-spec.md), [characters](character-wizard-spec.md),
[access](accounts-and-access-spec.md), and [data](data-architecture-spec.md).

## Pre-alpha scope

**Confirmed, 2026-09-11: defer the entire inventory system beyond v0.01.** Character and party inventory
tracking, item instances, equipment management, stash contents/visibility, claims, loot distribution,
transfers and inventory history are not required for the first prototype. Starting-equipment inventory
creation is also outside that slice; a working inventory step must not gate completion of the minimal wizard.
The requirements below remain the fuller product design. Preserve the conceptual separation between a build
and future item ownership/state, without implementing unused inventory machinery for the prototype.

This defers inventory, not sourced character-build choices such as the selected kit and its derived baseline.
Item-use automation and inventory-related combat interactions can wait with this subsystem. Combat mechanics
otherwise remain for their separately deferred discussion. See [the clarification queue](pre-alpha-design-gaps.md).

## Confirmed v1 direction

- Support both individual character inventory lists and a shared party inventory. Both live at campaign level
  and persist independently of a particular session.
- Support equipped and unequipped item state. Exact effects, eligibility, and timing require game-rules
  research; no equipment slots, weight limits, or action costs are established here.
- Players can move items between the party inventory and their character inventory, including between
  sessions. The precise authority for shared characters and other players' inventories remains open.
- Inventory management remains available while a session is paused, provided the character is not locked in a
  combat encounter.
- Personal inventory lists are inspectable by the character owner and the active Director. Other players
  cannot inspect them; ordinary campaign ownership or a general character-view grant does not by itself
  establish a separate inventory-view permission.
- Players may discard unwanted items from their own character inventory or the shared party inventory. This
  does not return those items to the Director's stash.
- Players cannot return items to the Director's stash.
- The active Director can directly edit character inventories, beyond inspection and loot allocation. Existing
  combat character-edit locks still apply; inventory authority does not grant character progression choices.
- V1 has no direct character-to-character item transfers. Existing items can still move through the shared
  party inventory under the established transfer rules.
- Players cannot create or directly add new items to their own inventory; later loot comes through the
  Director's stash and its approval flow. **Starting equipment is part of character creation** and is supplied
  through that workflow, not through the stash. Moving existing items from party inventory remains supported.
- V1 does not support simple free-text custom inventory items. Use existing item definitions from the catalog,
  including in-scope official items whose mechanics are not yet automated; preserve readable rules and
  accurate automation status. The [reference/source scope](reference-library-spec.md) limits v1 to core
  rulebooks: homebrew items and all official supplemental content are excluded, including
  Summoner/Beastheart-associated content. Core starting equipment and saved encounter rewards remain
  supported; general homebrew authoring is deferred.
- Inventory is independent of character progression history. Progression restoration must not rewind
  inventory, as already established in the character specification.

Confirmed semantic boundary: **inventory management is character data**. Items can affect a character, but
managing that data is not classified as executing a gameplay action. Character/party inventory transfers are
therefore available between sessions under their access rules; this is not an exception to the block on
gameplay actions outside a running session. Applying an item through an actual gameplay action still follows
the gameplay rules.

The character-sheet lock during combat remains a separate editing constraint, including while combat is
paused. Outside that lock, pause does not block inventory management. Gameplay item use and its effects still
follow the gameplay-action rules. The Director's stash-content management permission is recorded below;
encounter wrap-up retains its explicit provisional-allocation/final-deposit flow.

The earlier character specification says inventory is retained on detachment and character duplication. This
walkthrough does not explicitly revoke that rule. Reconcile the campaign-level inventory model with
detachment, duplication, and unattached characters before implementation; do not silently discard items or
invent a cross-campaign transfer policy.

Campaign deletion preserves each detached character's inventory and personal inventory history, but
permanently removes the shared party inventory and Director's stash. The owner may delete without first
closing an active or paused session. Pending claims are not completed deposits and must not implicitly become
retained character items. No combat keep/reset dialog is offered on campaign deletion; preserving current
recorded character state before detachment resets is the proposed default. User-owned saved encounter
templates, including their prepared rewards, survive campaign deletion; they are independent of the deleted
live stash.

## Director's stash

Hiding the Director's stash cancels all outstanding provisional claims and releases their reservations without
transferring items. The Director cannot approve claims while the stash is hidden. Revealing it again requires
fresh claims; previously approved deposits remain completed. V1 excludes item stacks: each inventory/stash
item is represented individually, with no stack splitting, merging, or partial-quantity claims. Multiple
copies of an item may exist as separate instances; monster quantities in saved encounters are unaffected.

Working name: **Director's stash**, a Director-managed inventory holding loot the party has been rewarded or
discovered. **Provisional user decision: one persistent Director's stash per campaign**, with encounter
rewards added into it. Each encounter's wrap-up displays that same campaign stash; it does not create an
independently retained stash for that encounter. Confirmed: the Director can **add or remove stash items at
any time**, before, during, or after encounter wrap-up; editing the stash is not gated on entering cleanup or
loading a saved encounter. This is stash-content management; the Director also has separately confirmed
authority to edit character inventories directly, subject to the existing character-edit constraints.
Party-member claiming and Director finalization remain separate operations. The Director loads items into it;
party members can choose to move available items into the shared party inventory or an individual character
inventory.

Confirmed visibility direction for this flow: **the whole stash is invisible to players until the Director
chooses to share it**. Visibility is per stash, not a separate release decision for each item. The proposed UI
uses the same show/hide toggle pattern as individual monsters. The Director may make the whole stash visible
at any time. Confirmed correction: **whenever the stash is visible, eligible players can choose items to
take**, including outside encounter wrap-up. Those choices form a provisional allocation; the Director can
adjudicate and must approve the final end state before items are deposited into party or character
inventories. This uses the same allocation/finalization process as wrap-up. Visibility permits inspection and
provisional claims, not unapproved final transfers. More sophisticated sharing is explicitly deferred and the
user expects this design to evolve.

Proposed enforcement: hidden stash contents are absent from player-facing reads and cannot be claimed through
a guessed identifier. Encounter rewards stashes are now confirmed for v1 under the scope below. Encounter
wrap-up uses the confirmed provisional-claim/final-deposit flow below. Hiding cancels provisional claims and
blocks approval; observers cannot claim stash items because they cannot interact with the session. Mere
campaign membership or stash visibility does not grant an observer claim authority. This does not remove the
separately confirmed outside-session allocation flow. A campaign owner is not automatically granted active
Director gameplay powers by this proposal.

Discoverable inventory objects, such as shops and chests, are possible later extensions. Their discovery,
purchase, pricing, stocking, and container mechanics are unspecified; no shop or chest implementation is
required by this checkpoint.

## V1 encounter rewards stashes

Confirmed: **standalone saved stashes are out of v1**. Instead, saved encounters include a **rewards stash**,
and a rewards-stash step is part of normal encounter cleanup. This expands the saved-encounter content scope
to monster selection, remembered party strength calculator, and reward loot. A separate reusable stash library
is not required.

The Director can prepare reward loot with the saved encounter. **Confirmed: loading that saved encounter adds
its reward items to the campaign's persistent Director's stash immediately.** Encounter start and normal
wrap-up do not add a second copy. Adding loot to the stash does not itself deposit it into party or character
inventories. Normal cleanup displays an **encounter wrap-up screen** containing the campaign's persistent
Director's stash. Reward preparation stored in a saved encounter supplies loot for this common live stash; it
is not another persistent campaign container. Players can freely claim available loot for party or character
inventories, but those claims are provisional until the Director finishes wrap-up. The whole stash remains
hidden until the Director chooses to share it. Merely entering cleanup does not establish automatic revelation
or item transfer.

### Claims and Director finalization

Confirmed: **claims do not immediately deposit items**. Whenever the stash is visible, eligible players may
make loot claims freely, during or outside wrap-up; the Director can adjudicate and change item allocations
before approving the final end state. Confirmed: **once an item is claimed, it is unavailable for a second
claim**. The accepted claim reserves it while allocation is provisional; the Director can still change the
allocation before approval. Players may withdraw their own unapproved claims, releasing the item for another
claim. Withdrawing a provisional claim changes no deposited inventory and is distinct from undoing a completed
inventory change. This is not a competing-claims queue or automatic final ownership.

When the Director approves the final allocation, deposit items into party/character inventories accordingly.
During an encounter wrap-up, finishing that screen performs this approval; outside wrap-up, the same Director
finalization is available without requiring another encounter. Until then, claimed items remain in the stash
and cannot be used or equipped through a destination inventory merely because they have been claimed. This
refines the earlier direct-claim transfer proposal.

Proposed consistency contract: keep provisional allocations separate from actual item locations. Validate the
Director's final allocation against the current stash and destinations, then commit the approved deposits
once. During wrap-up, commit those deposits with wrap-up completion; outside it, finalize the stash allocation
without reopening an ended encounter. A given individual item can only be deposited once; retrying finish must
not duplicate loot, and a late claim cannot alter a completed allocation. If the Director removes or changes
an item with provisional allocations, finalization must validate against the updated stash and must not
deposit a removed item. Proposed concurrency behavior: accept one valid claim against current availability,
then reject a competing claim with updated availability. Retries of the accepted claim do not create
additional reservations. Item stacks are outside v1; claims reserve individual items. Approval requires a
visible stash and still-valid claims; final adjudication belongs to the Director.

Confirmed: **normal encounter cleanup can finish with unclaimed loot**. The rewards stash is **persistent
storage** displayed in wrap-up, not a temporary loot list. Unclaimed items simply remain in that same stash
afterward under its existing visibility controls; finishing wrap-up does not create a replacement container or
move those leftovers. Finishing cleanup does not discard the remainder, move it automatically into party
inventory, or require all players to claim items first. Ordinary transfers between party and character
inventories are confirmed available between sessions. If the stash remains visible, players may propose taking
the remaining items afterward, and the Director approves the final allocation before depositing them.

Proposed loading contract: keep reward preparation in the saved template independent of live claimable loot,
so claims do not consume or alter the reusable source. Actual transfers and repeated cleanup requests must not
duplicate rewards. Proposed consistency: commit monster loading and its reward addition as one accepted load,
so retries cannot add extra loot. Preserve existing stash contents when adding the new rewards; replacing the
foes roster does not establish permission to replace the campaign stash. Keep source/load attribution for
later history and void handling.

Voiding continues to skip normal encounter-ending rewards and cleanup, including this rewards-stash step.
Confirmed 2026-09-13: Restore starting state returns the Director panel's gameplay state, including
loot/stash state, to its combat-start snapshot. Remove reward items added by mid-combat template loads;
restore the pre-start contents. Rewards loaded before combat belong to the baseline and remain. Keep
current state retains the present stash and its later additions. Reconcile related claims and item
locations through shared recorded operations: removed items cannot retain live claims, and restoration
must not duplicate items across locations. Preserve item/load attribution and history; do not rerun
reward grants. This is the general panel reset rule, not a separate reward-specific rollback mechanism. The same provisional-claim/Director-finalization flow is confirmed outside wrap-up
whenever the stash is visible; its exact UI remains open.

## Inventory history

Confirmed v1 requirement: retain an inventory-change history the Director can review, covering transfers,
discards, and edits. Inventory being character data does not remove the need to record its changes, including
changes made between sessions. Confirmed permissions: **the Director can undo and redo inventory changes from
this history**; players can read their own character inventory history; all current campaign members can read
the shared party inventory history. Confirmed: **players cannot undo inventory changes**, either in their own
inventory or changes they made to the shared party inventory. Director inventory undo is separate from player
gameplay undo; the campaign's Enable user undo setting does not grant inventory undo.

Proposed record details: acting user, time/order, affected item instance, source/destination inventory where
applicable, and the recorded change. Preserve discarded-item details for review and record approved stash
deposits as completed transfers. Do not expose private character inventories through an otherwise broader
history view. Keep private character history restricted to its owner and the Director; access to party history
does not expose unrelated personal inventory contents. Confirmed: after a character leaves a campaign, its
owner retains access to that character's personal inventory history. This does not grant additional access to
the former campaign's party inventory/history or live Director powers; party-history access still follows
current campaign membership. Dependency handling and the interface remain open.

Proposed undo/redo contract: restore recorded inventory changes with coherent source/destination state,
without rerunning game rules or duplicating items. Reconcile later transfers, consumption, equipment effects,
and combat locks before implementation. Inventory-history undo is character-data work and does not reopen or
rewrite a closed session. This establishes the capability without designing a separate undo tree in this
exploration.

## Objects shared through messages

The user reinforced the direction that objects of different kinds should be shareable through messaging,
extending the earlier idea of sharing abilities, character sheets, and monster stat blocks. Items and loot
provide another use case.

**Confirmed long-term refinement, 2026-09-15:** inventory items participate in the same app-wide sharing
foundation as Compendium rules and other supported objects, including chat sharing and bookmarks.
Follow the [shared reference direction](data-architecture-spec.md#35-unified-object-references-and-sharing)
while retaining the distinction between reusable item definitions and particular owned instances.
This does not assign these future sharing workflows to the current inventory milestone.

The interface, supported object types for v1, and disclosure behavior remain open. Showing an object in a
message is distinct from moving an inventory item, granting character control, or granting editing access. Do
not make posting an item duplicate or transfer it implicitly. Private saved-encounter sharing remains deferred
under its existing v1 scope.

## Proposed data and operation boundaries

- Distinguish reusable item definitions from individual owned item instances and their current equipment
  state.
- Give each item an explicit location: character inventory, party inventory, or the Director's stash.
  Party/stash locations require a campaign; a retained character inventory must remain valid after detachment.
  The physical representation of that transition remains proposed. Equipment state belongs to the applicable
  character/item relationship, not the reusable definition.
- Keep wrap-up claims/allocations distinct from completed transfers; only Director finalization deposits the
  allocated loot. Record transfers as one change to source and destination, preserving each transferred
  instance's state. Concurrent claims and retries must not duplicate loot or lose it. These are proposed
  implementation contracts, not additional game rules.
- Keep shared operations usable through both the app and headless clients. Record inventory transfers,
  discards, and edits for Director review, alongside applicable gameplay records; physical storage and undo
  boundaries remain undecided.
- A posted object reference must enforce its audience and reveal only intended content. Posting a loot
  reference does not itself grant access to the entire source inventory.

## Proposed acceptance examples

- A session observer cannot claim even a visible stash item. Shared character access does not bypass observer
  status.
- Hiding the stash cancels provisional claims; a stale approval cannot deposit their items. Revealing requires
  fresh claims and does not undo prior completed deposits.
- Identical items remain separate instances; v1 exposes no stack, split, merge, or partial-quantity claim
  operation.

- Between sessions, an authorized player can transfer items between their character inventory and party
  inventory without starting or reopening a session. This edits character/inventory data and does not
  authorize gameplay actions.
- During pause, authorized inventory management works for an unlocked character; combat-locked character
  editing remains blocked. A peer cannot inspect another character's inventory; its owner and active Director
  can.
- Outside wrap-up, eligible players can inspect a visible stash and propose taking items; session observers
  cannot claim. Their inventories remain unchanged until the Director approves the final allocation; the same
  shared operation must enforce this for headless callers.
- Players can discard items from their own inventory or shared party inventory but cannot return them to the
  Director's stash. The active Director can directly edit a character inventory when it is not combat-locked;
  inventory authority does not grant progression editing.
- Starting equipment is supplied during character creation without a Director-stash claim; later loot uses the
  stash allocation flow.
- Player attempts to undo personal inventory changes or their own party inventory changes are refused, even
  with campaign gameplay undo enabled. Director inventory undo remains available under its separate
  constraints.
- V1 offers no direct character-to-character transfer, player item-creation operation, or free-text custom
  inventory item. Supported party transfers and Director-approved stash allocations remain available. Existing
  import/retention requirements are separate from manual item creation.
- A transfer from party inventory to a character removes the transferred instance from the source and adds it
  to the destination without duplication; the reverse transfer is also supported.
- Equipped/unequipped state persists and applies only verified item effects. Changing progression preserves
  the current inventory.
- The Director can add/remove loot before, during, and after wrap-up. An item removed while provisionally
  claimed cannot later be deposited from a stale claim. Completed transfers to other inventories are not
  reversed by editing the stash.
- A hidden stash and its contents are unavailable to players until the Director reveals the stash. Revealing
  it does not transfer or duplicate items.
- Loading a saved encounter adds its prepared rewards to the campaign stash once; the template remains
  unchanged and existing stash contents remain. Encounter start and wrap-up do not add the rewards again.
- A saved encounter retains its rewards preparation. Normal cleanup includes a rewards-stash step; entering it
  alone does not reveal the stash or transfer loot. Voiding skips this normal reward step.
- Under the provisional single-stash model, successive encounters use the same campaign stash; new reward
  additions preserve existing unclaimed loot. Saved reward preparation remains separate from live inventory.
- Normal cleanup completes with unclaimed rewards without transferring or discarding them. The same persistent
  stash retains those items after wrap-up, subject to its visibility and existing gameplay access controls.
- Withdrawing an unapproved claim releases its reservation without moving items. A later player may claim the
  available item; withdrawal cannot reverse an already approved deposit.
- The owner can read personal inventory history after the character leaves its campaign without gaining access
  to the former campaign's shared inventory history.
- Two players attempt to claim the same available item: only one claim is accepted, and the item is
  unavailable for a second claim. The Director can still reassign the provisional allocation before approval.
- Inventory transfers, discards, and edits remain reviewable, undoable, and redoable by the Director,
  including recorded between-session changes. For a simple change with no dependent operations, undo restores
  recorded item state without duplicating it. Players can read their own inventory history, and current
  campaign members can read party inventory history, without thereby gaining peer inventory access or player
  undo authority.
- During wrap-up, a player claim changes the proposed allocation but not the source/destination inventories.
  The Director can reassign it; finishing deposits it into the final destination once. A retry or late
  competing claim cannot duplicate the item or override the finished allocation.
- Sharing an object through a future message feature displays authorized content without silently
  transferring, duplicating, or granting control over it.

These are examples for later implementation, not completed tests.

## Continue exploring

1. Rewards stashes in saved encounters and normal cleanup are in v1; standalone saved stashes are excluded.
   Wrap-up claims are provisional and Director completion deposits the final allocation. A claimed item is
   unavailable for another claim. Hiding cancels claims and prevents approval; item stacks are excluded.
   Void restore returns Director-panel loot state to the combat-start snapshot; Keep retains current
   contents. Verify claim/location reconciliation and duplicate prevention against that confirmed scope.
2. Inventory is character data, and party/character transfers work between sessions. Pause allows inventory
   management when the character is not combat-locked. Peer inventory inspection is Director-only, and a
   visible stash permits provisional claims with Director approval inside or outside wrap-up; refine remaining
   item/edit authority.
3. Item/equipment mechanics, consumables, currency, and source data, with rules research. No item stacks in
   v1.
4. Campaign-level inventories versus prior detachment/duplication and unattached-character requirements.
5. Messaging object types, disclosure and interaction behavior; shops/chests remain speculative.
