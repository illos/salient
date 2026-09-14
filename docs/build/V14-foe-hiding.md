# V14: Foe hiding and Add-visibility

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

Lift the v0.01 deferral of foe hiding: a per-campaign Add visibility setting defaulting to hidden and
applied to saved-encounter loads, per-foe hide/reveal controls, audience projections that omit hidden
roster entries and never embed hidden stat blocks or exact Stamina in Bar/Winded mode, and hidden foes
that remain active and may act. Names are not concealed in the game log under the current direction.
This changes visibility only, not stealth or concealment rules.

## Spec references

- `docs/table-spec.md#monster-visibility-and-health-display` — deferral, fuller V1 design, projection contract, open presentation details.
- `docs/v1-spec-checkpoint.md#characters-sharing-and-visibility` — Add visibility default, persistence, template loads, log names.
- `docs/monster-catalog-spec.md#remaining-decisions` — Add visibility applies to saved-encounter loads; history/void handling.
- `docs/table-spec.md#foes-roster` — roster persistence the projection filters.
- `docs/table-spec.md#smaller-opening-and-visibility-questions` — hidden foe group/turn presentation deferred; no private data exposure.
- `docs/table-spec.md#malice-visibility` — separate policy, unchanged.

## In scope

- Campaign setting Add visibility (default hidden) and per-foe hide/reveal operations, Director-only, allowed while paused or between sessions.
- Audience projection filtering hidden foes from rosters, initiative presentation and log tooltips, at the query level.
- Hidden foes take turns and act; their log entries show names.
- Saved-encounter loads honoring the setting (coordinate with V06 if not yet committed).

## Out of scope

- Stealth/concealment rules (`docs/table-spec.md#monster-visibility-and-health-display`, "defers roster visibility controls, not the source rules").
- Hidden-foe group/turn presentation design beyond omission (deferred; `docs/table-spec.md#smaller-opening-and-visibility-questions`).
- Changing health-display modes or Malice visibility (already delivered in v0.01).
- Retroactive rewriting of history already displayed.

## Inputs and dependencies

- Hard: A09 (roster, health projection, initiative presentation).
- Soft: V06 for template loads; otherwise apply the setting to direct catalog loads only and note it.

## Deliverables

- Setting field and per-foe visibility flag; projection helper shared by roster, initiative and log queries.
- Registered operations: set Add visibility, hide foe, reveal foe.
- Convex-test cases proving payload exclusion; browser test with Director and player clients.
- Implementation notes in `docs/table-spec.md#monster-visibility-and-health-display`.

## Acceptance checks

1. With Add visibility at its default, a newly added foe is absent from the player roster payload and present in the Director's.
2. In Bar mode a revealed foe's player payload contains a proportion and no Stamina number or stat block fields (assert on the serialized query result).
3. A hidden foe can take its turn; the resulting log entry names the foe in the player view.
4. Hiding a foe while paused persists and gameplay remains blocked.
5. The setting survives session closure and applies to the next session's loads.
6. Void restore returns visibility flags to their combat-start values.

## Rules research

None.

## Open questions

Candidate `Q-V-n` entries from `docs/table-spec.md#monster-visibility-and-health-display` ("Open presentation details"):

- Whether Numerical mode also shows maximum Stamina.
- How shared minion-squad health is represented to the audience.
- Historical health disclosures after a setting change.
- Hidden-foe initiative presentation (`docs/table-spec.md#smaller-opening-and-visibility-questions`).

## Work log

_Empty._
