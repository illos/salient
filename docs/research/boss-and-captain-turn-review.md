# Boss and captain turn review

Checkpoint note: this report preserves the original review and subsequent rulings. Initial cleanup
findings describe that earlier snapshot; their fixes are integrated. Use
[the latest checkpoint](../spec-consistency-review.md#latest-rulings-checkpoint) and
[owning table contracts](../table-spec.md#minion-squads-and-captain-state) for current status.

Reviewed 2026-09-13 against local Steel Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. No web research, upstream changes, or application changes.
This report distinguishes source findings, existing user rulings, and recommendations requiring a ruling.

## Conclusion

The actor-linked turn-entry model accommodates ordinary multiple-turn monsters. The reviewed source ambiguity
was a **captain with personal extra turns**: captain eligibility permits this, but the
attachment rule does not explicitly explain whether the squad accompanies every captain turn. Do not
silently duplicate the squad's actions or forbid otherwise eligible captains.

Selected interpretation, **confirmed by the user 2026-09-13**: the squad and captain share one normal turn; a turn
granted only to the captain belongs only to the captain. Attachment and its benefits persist during that
personal turn. An effect expressly granting turns to the minions must be handled according to its actual
targets and timing. This preserves separate entitlements without inferring an unlimited squad-turn grant
from a timing sentence. It is an interpretation because the source does not qualify that sentence for
multiple-turn captains.

## Source findings

| Finding | Evidence and consequence |
| --- | --- |
| Multi-turn captains are eligible. | [Attached Squad Captain](../../vendor/steel-compendium/en/unified/md/rule/monster/captain.md) allows any non-Mount, non-minion creature speaking a language its squad understands. Neither Solo nor Elite organization is excluded. One creature captains at most one squad. |
| Shared timing does not expressly define additional capacity. | The same source's **Separate Actions and Stamina** section says a captain takes its turn at the same time as the squad, with normal action options and separate Stamina. [Organized as Squads](../../vendor/steel-compendium/en/unified/md/rule/monster/squad.md) synchronizes the minions. Neither passage addresses repeated captain turns. |
| Solo capacity belongs to the creature. | [Thorn Dragon](../../vendor/steel-compendium/en/unified/md/monster/dragon/statblock/thorn-dragon.md), **Solo Turns**, allows two nonconsecutive turns. [Ajax](../../vendor/steel-compendium/en/unified/md/monster/ajax-the-invincible/statblock/ajax-the-invincible.md), **Ajax Turns**, allows up to three nonconsecutive turns and separately grants triggered-action capacity. Neither grants turns to an attached squad. |
| Acquired recurring capacity is not necessarily Solo capacity. | [Draconian Malice](../../vendor/steel-compendium/en/unified/md/monster/draconian/draconian-malice.md), **Scaleshatter Burst**, costs 7 Malice, imposes damage weakness 5, and lets the draconian take **two turns per round** until encounter end. This sets total capacity to two, not two additional turns. It does not repeat Solo's nonconsecutive restriction. The family feature is chosen at the start of a draconian's turn. |
| An immediate personal turn can happen outside squad timing. | [War Dog Breaker](../../vendor/steel-compendium/en/unified/md/monster/war-dog/3rd-echelon/statblock/war-dog-breaker.md), **Breaking Point**, delays reaching zero Stamina, ends its conditions, and grants an immediate final turn even if it already acted. It reaches zero at that turn's end. The feature refers to the breaker, without granting squad actions. |
| Extra actions remain different from full turns. | [Thorn Dragon Malice](../../vendor/steel-compendium/en/unified/md/monster/dragon/thorn-dragon-malice.md), **Solo Action**, gives the dragon an additional main action that turn, including while dazed. It does not refresh its squad, movement, or turn boundaries. [Villain Actions](../../vendor/steel-compendium/en/unified/md/rule/monster/villain-action.md) have one shared use per round across villain-action creatures and individual once-per-encounter uses; a second full turn does not reset those limits. |
| Some sources explicitly affect several turn recipients. | [Wode Elf Guerrilla](../../vendor/steel-compendium/en/unified/md/monster/elf-wode/statblock/wode-elf-guerrilla.md), **Do Not Hesitate in the Wode**, requires captain status, targets self and each ally within its range, and makes the targets take their turn immediately. Its trigger restricts the guerrilla to not having acted; the text does not impose that same condition on every target. Treating all recipients as unspent-only, or as ordinary independent minion turns, would add an unsupported interpretation. |

These are general-rule and representative-source checks, not a new exhaustive count of every possible
turn-granting combination. The prior [boss research](boss-turns-and-extra-actions.md) records its bounded
22-Solo census and six Elite/seven non-Solo personal or family routes to multiple turns.

## Definite specification cleanup

These findings refer to the reviewed snapshot before the coordinating agent's cleanup.
The listed changes implement existing decisions; they do not need another product vote.

1. **Retire the mixed-group reactivation proposal from current guidance.**
   [Table specification](../table-spec.md), the boss research, [rules status](../workstream-rules-status.md),
   and [build handoff](../web-app-build-handoff.md) still contain language treating counter-only display or
   repeated activation of a mixed group as the pending solution. Later rulings replace that with
   actor-linked turn entries and extra entries in their own groups. Preserve the historical proposal only
   as explicitly superseded context. Exact manifest styling is a UI detail.
2. **Scope spent status to the selected turn entry.** The table's regrouping subsection still emphasizes
   whether a creature has used “its turn” as entity state. In the new model, movement preserves the selected
   entry's spent status and actor-scoped state; spending one entry does not spend every entry for that
   creature. Actor-level turn counts remain derivable. A single creature-wide boolean is insufficient.
3. **Keep granted and advanced turns distinct.** The confirmed Wode Sickness case moves an unspent normal
   turn to an immediate timing slot and then resumes the interrupted group; it does not manufacture a
   bonus turn. Genuine extra grants create only the source-defined additional entitlement. Neither path
   recreates creatures or reopens completed groups.
4. **Retain source scopes across repeated turns.** Actual turn starts/ends fire once per actual turn;
   per-round and per-encounter limits do not reset with each turn. A personal extra main action changes
   only its recipient's current-turn allowance. Showing or dragging an entry creates no clock event.
5. **Do not make ordinary single-actor sequencing universal.** The squad/captain shared timing is already
   an accepted exception. Ordinary groups still take successive complete turns; squad UI can expose its
   minions and captain during their synchronized turn without pretending each member is a separate
   ordinary group activation. The minion review owns the corresponding detailed shared-turn cleanup. Subsequent user ruling: global “every turn” work fires once per shared squad/captain turn,
   not per participant. Individual personal effects and saves still apply. A separate captain-only turn
   supplies another real boundary.

The accepted immediate-interruption/resumption rule already preserves an interrupted turn's action
spending and identity, with no artificial start/end on suspension or resumption. Do not reopen that
question or introduce a boss-specific skip/forgo control.

## Confirmed captain-only extra turns

The user confirmed: only the captain gets the extra turn. Squad participation remains unchanged,
for both recurring and effect-granted personal turns. Applied concretely:

- A two-turn captain has one synchronized squad/captain turn and one captain-only entry. The latter uses
  the established separate-group placement and source timing. Which eligible captain turn is paired with
  the squad must remain explicit in preparation; the source does not designate a mandatory first turn.
- Buying Scaleshatter Burst during the shared turn creates the remaining personal entitlement, not a
  second set of minion attack assignments. Later rounds retain two captain turns only while the effect
  lasts.
- A Breaker captain's final turn interrupts at the specified point and uses its own actions. It does not
  refresh squad participation. Existing interrupted work resumes afterward as applicable; actual captain
  loss affects the attachment under the captain rules. Replacement is at the next round's start.
- Attachment remains one relationship to the creature, independent of its turn entries. Moving or taking
  its extra entry does not detach it or toggle the minions' printed captain benefits.

The selected model distinguishes **attachment**, **the synchronized squad turn**, and
**additional personal turn entries**, rather than adding special per-boss action-card programming.

A later bounded source question remains for effects such as **Do Not Hesitate in the Wode** that explicitly
target several creatures: recipients may include already-acted allies or only part of a squad. The source
does not explain that interaction sufficiently to certify automatic scheduling. Keep it visible as
unsupported/decision-required instead of inferring a new grant rule from Wode Sickness or silently
refreshing an entire squad. This is separate from the captain's purely personal extra-turn case.

## Review checks for eventual implementation

These are suggested acceptance examples, not executed tests:

- Finish Dragon Turn 1: Turn 2 remains available in its own group, with one shared creature state and
  independent turn boundary identity. Dragging Turn 2 never moves Turn 1.
- Buy an extra main action: no extra turn entry, no new start/end effects, no refreshed villain allowance.
- Buy two-turn capacity during the first turn: exactly one additional current-round entitlement, with
  recurring capacity limited to source duration.
- Under the recommended captain ruling, use that additional turn: the captain's normal actions are
  available; minion participation remains spent and the captain benefit remains attached.
- Breaker final turn interrupts a shared squad turn: preserve the unfinished squad work and spending;
  never duplicate the damage/zero-Stamina transition or grant the minions another attack by association.
- Exact undo/redo restores the actual entries, spending, attachment, and interrupted context without
  rerolling or regenerating a grant a second time.
