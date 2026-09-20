# V74 independent pinned-rules review

2026-09-20. **PASS for the sourced action catalog and conditional rune grants.**
This is a source review, not a runtime acceptance result or certification of automated effects.

Reviewed `shared/content/ancestry-abilities.ts`, `shared/evaluate/ancestryAbilities.ts`, the
ancestry action audit, sheet/table projections and the rune mutation. Independently reread the
40 signature/purchased trait entries for Devil, Polder, Dwarf, Human, Hakaan and Orc in the
canonical checkout's `vendor/steel-compendium/en/unified/md/feature/trait/` directories.
The repository gitlink identifies Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
No Forge behavior was treated as rules authority. No tests or browsers were run for this review.

## Findings

| Granted action | Source comparison |
| --- | --- |
| Glowing Eyes | Triggered action when damaged by a creature; psychic damage remains 1d10 plus level. |
| Reactive Tumble | Free triggered action; shift 1 after forced movement resolves. |
| Detect the Supernatural | Maneuver; 5-square detection without line of effect, with source categories and next-turn duration retained. |
| Determination | Maneuver while frightened, slowed or weakened; ends one such condition. |
| Resist the Unnatural | Triggered action on damage that is not untyped; halves that damage. |
| Stone Singer | One uninterrupted hour, unworked mundane stone, 3-square bounds and no destruction; no fabricated combat cost. |
| Doomsight | Elective activation while dying, without a predetermined death encounter and with Director approval; no action required. Predetermined encounter and rubble clauses remain readable and are not misrepresented as maneuvers. |
| Relentless | Creature damage leaving the hero dying permits a free strike against any creature; reducing its target to 0 Stamina permits spending a Recovery. No invented triggered-action cost. |
| Runic Carving: Detection | Active Detection rune grants the maneuver to change detected creature/object type; 20-square detection without line of effect retained. |
| Runic Carving: Light | Active Light rune grants the maneuver to toggle its 10-square light. |
| Runic Carving: Voice | Active Voice rune grants the maneuver; willing, previously met, named recipient within 1 mile and shared language retained. Changing recipient requires changing the rune. |
| Runic Carving: Carve, Change, or Remove Rune | Ten uninterrupted minutes, one active rune, and removal retained. |

The evaluator matches the actual granting trait and its source path, retains that trait, and adds
only the maneuver for the supplied active rune. A null rune adds no rune maneuver. Trait removal
removes these derived grants; an ancestry label alone does not create them. Existing Shadowmeld
is outside this new managed catalog and remains preserved.

The other audited traits are passive benefits, conditional modifiers, automatic effects or
modifications to existing actions rather than additional standalone actions. In particular,
Glowing Recovery modifies Catch Breath; Graceful Retreat modifies Disengage; Barbed Tail modifies
a melee strike. This conclusion does not certify their automation or contextual presentation.

## Scope limits for acceptance

The slice deliberately exposes sourced actions through the existing manual resolution route.
It must not be reported as automatically enforcing Doomsight approval/death, triggering
Relentless, moving stone, tracking detection targets, switching light state or tracking Voice
recipients. Their conditions remain explicit source instructions. Persisted active-rune kind
and its grants are the implemented rune state.

The rune mutation rejects a redundant same-kind assignment. Changing the recipient of a Voice
rune remains a manual ten-minute rune change with no modeled recipient field; it must not be
described as an automated recipient change. The outside-combat restriction is the application's
bounded way of requiring the acknowledged ten uninterrupted minutes, not an additional quoted
Compendium rule.

Runtime acceptance still needs the planned authenticated persisted-grant proof, stale and
unauthorized mutation refusal, trait-loss handling and undo/redo verification. No source-text
defect requiring a rules correction was found in the reviewed catalog.
