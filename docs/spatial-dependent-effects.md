# Spatial-dependent manual effects

The user requested this register on 2026-09-25 when shelving Overwhelm's adjacency-input design.
Track effects kept as source text/manual because spatial automation would need facts the app does
not know. Future map/spatial implementation must review every entry and replace the manual
handling only after source-correct behavior is implemented and proven. Do not delete the game
mechanic or assume that coordinates resolve other missing rules.

This starts with the deferrals identified in the V1 foe planning discussion; it is not a complete
app-wide audit. Add entries as further spatial-dependent manual effects are identified. Existing
fact-assisted mechanics are not automatically disabled by this register.

Source paths below are relative to the canonical pinned Compendium's `en/unified/md/` root.

| Effect / owner | Current disposition | Spatial dependency | Criteria for replacing manual handling |
| --- | --- | --- | --- |
| **Human Knave: Overwhelm** — V222, Q-FOE-5; `monster/human/statblock/human-knave.md`, Overwhelm | User-requested text-only/manual; no adjacency prompt or automatic restriction | Enemy adjacency to a knave at the exact start of the subject's turn | Determine valid start-boundary adjacency; apply cannot-shift through that turn; leaving does not clear it and arriving later does not trigger it; prove shared route, expiry and undo/redo |
| **Thorn Dragon's Domain** — V227, Q-FOE-4; `monster/group/dragon.md`, Thorn Dragon's Domain | User-shelved text/manual; environmental classification and activation design deferred | Encounter-map presence, surfaces, flight/ground contact and ground restraint | Research flight and bleeding lifetime, design Director encounter-start enable/disable and source prerequisite; retain other-monster scope/source-dragon speed exemption and accepted current-turn speed duration; prove shared route and lifecycle |
| **Malign Thicket: Domain-dependent turn-start poison only** — V227; `monster/dragon/statblock/thorn-dragon.md`, Malign Thicket | Manual while Domain eligibility is shelved; independent effects proceed | Domain eligibility and the source's turn-start location predicate | Establish Domain activation/eligibility and exact target predicate, then prove the source-defined 1d3 poison firing; never infer Domain merely from using Malign Thicket |

For each future entry record the named clause, source, current manual behavior, missing spatial
facts, owning slice and any separate unresolved rule. Close an entry with its implementation
commit and accepted persisted proof; retain the history so completeness can be audited.
