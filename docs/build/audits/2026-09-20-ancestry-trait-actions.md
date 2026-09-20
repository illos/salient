# Implemented ancestry traits and granted actions

Read-only audit, 2026-09-20. Scope: all 40 signature and purchased trait entries across the
six implemented ancestries in the V69/V73 candidate, not classes, perks or complications.
Application source `ab0f2fd875155d929f5efed201b14d96a821f4f7`; comparison branch `1912cf9`.
Rules authority: pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/feature/trait/{devil,polder,dwarf,human,hakaan,orc}/`.

Checked every trait's text, the six `shared/content/ancestries/*/level-one.ts` decision modules,
`shared/evaluate/character.ts` ability derivation and retained V73 authenticated sheet readbacks.
This audit runs no new tests and implements no fixes. The user's clarified model is that a trait
can also grant an ability/action; retaining its trait text does not replace action-list exposure.

## Explicit combat actions missing from the ability list

| Ancestry | Trait | Granted action |
| --- | --- | --- |
| Devil | Glowing Eyes | Triggered action after a creature damages you |
| Polder | Reactive Tumble | Free triggered action after forced movement |
| Human | Detect the Supernatural | Maneuver |
| Human | Determination | Maneuver while frightened, slowed or weakened |
| Human | Resist the Unnatural | Triggered action on typed damage |
| Dwarf | Runic Carving | Three rune-dependent maneuvers: change Detection target type; toggle Light; communicate using Voice |

Runic Carving is the additional finding beyond the five Forge discrepancies. Only one rune may
be active; its relevant maneuver must be conditional on that rune, not three simultaneously
available powers. Changing/removing the rune itself takes ten uninterrupted minutes. Current
support retains the text; rune state and action exposure are absent. Forge comparison missed this
because its counterpart left the play-time rune choice unselected.

## Other activatable effects needing appropriate exposure

| Ancestry | Trait | Source behavior and current gap |
| --- | --- | --- |
| Dwarf | Stone Singer | One uninterrupted hour of singing reshapes stone; trait text only, no activity entry |
| Hakaan | Doomsight | Director-approved choice to become doomed while dying, explicitly no action required; trait text only, no dedicated activation |
| Orc | Relentless | Damage leaving you dying permits an existing free strike, with conditional Recovery afterward; free strikes exist, but the Relentless conditional use is not represented separately |

These are action-discovery/state gaps, not grounds to invent a combat action cost. The prearranged
Doomsight encounter and its rubble recovery are additional conditional effects, not a maneuver.

## Already exposed or not a new action

Polder Shadowmeld already grants an ancestry ability and appears in the retained sheet readback.
Glowing Recovery modifies Catch Breath; Graceful Retreat modifies Disengage. Barbed Tail adds to
an existing melee strike. Wings grants conditional flight. These need their effects connected to
the relevant action/movement presentation, not fabricated standalone action costs. Bloodfire Rush
and Polder Geist activate automatically when their conditions hold. Other checked traits are
passive statistics, immunities, skill/project benefits or conditional modifiers.

This audit does not certify automation of any manual effect. The appropriate next implementation
is sourced action exposure and conditional availability, with headless saved-sheet proof; combat
automation remains separate.
