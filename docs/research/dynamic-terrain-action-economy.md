# Dynamic terrain and the action economy

Checkpoint note: this report preserves the original review and subsequent rulings. Initial cleanup
findings describe that earlier snapshot; their fixes are integrated. Use
[the latest checkpoint](../spec-consistency-review.md#latest-rulings-checkpoint) and
[owning table contracts](../table-spec.md#minion-squads-and-captain-state) for current status.

Research, 2026-09-13. Source: local Steel Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`, core *Monsters* terrain and applicable *Heroes* rules.
Reviewed the general chapter and all **35** terrain entries, including upgrades. This is a context and
compatibility review, not approval of terrain implementation, saved-encounter scope, or new UI.

**Terrain generally does not take turns.** It reacts to events, performs scheduled work, modifies the
battlefield, or supplies actions that creatures use. None of these 35 entries explicitly gives the
terrain object its own recurring full turn. The existing distinction between a live entity and its
turn entries is therefore useful: a targetable object can exist with no initiative turn entry.[^general]

## Rules lifecycle

- **Prepare:** Objects have EV, sometimes priced per area, and may have upgrades priced per square.
  They can have whole-object or per-square Stamina, fixed facing, calibrated trigger sizes, links to
  other mechanisms, and concealed features. Destroying one square need not destroy the whole object.
  Encounter-building guidance spends the same EV budget on terrain and monsters.[^general][^building]
- **Discover and interact:** Hidden terrain uses the Search maneuver's object outcomes. Allied Awareness
  means fictional familiarity/training, granted at the Director's determination after study; it is not
  synonymous with app ownership or permission. A creature can operate, seize, attune to, or disable
  particular terrain under that entry's rules. Some deactivation tests explicitly cost a maneuver;
  others do not specify an action cost. Do not silently normalize them all.[^general][^throne][^cube]
- **Activate:** The general default permits repeated activation without a frequency limit. Source
  exceptions include manual resets, one-shot consumption, once-per-round actions, and conditions such
  as entering without shifting. An automatic hazard trigger is not a creature spending their ordinary
  triggered-action allowance. A printed free-triggered ability can express the hazard's resolution;
  its trigger text still determines whether the effect happens or offers an optional choice.[^general]
- **Resolve:** Preserve the object source, triggering/operating creature where relevant, actual invoking
  user, supplied spatial facts, rolls, costs and resulting states. These are different roles. A creature
  using a siege engine pays its printed action cost; the object need not acquire a turn to attack.
- **Change or end:** Deactivation, destruction, reset, consumption and removal are different outcomes.
  Destruction can cause another attack or create a lasting area. Effects retain their own durations;
  removing their origin does not universally remove them. End-of-encounter expiration is expressly
  present on some effects, not a rule that all terrain vanishes at cleanup.[^general][^bees][^pillar]

## Representative stress cases

| Example | What the source requires | Implication for our model |
| --- | --- | --- |
| **Field Ballista** | An adjacent creature uses a main action to shoot, reload, spot or move it. Shooting leaves it unloaded. Reload and Spot are each usable once per round; Spot benefits the next shot. | Keep operator spending separate from ballista load/benefit/usage state. Changing operators must not create a fresh copy of the engine. The natural reading is that the listed once-per-round action limit belongs to that engine; the text does not separately discuss competing operators.[^ballista] |
| **Exploding Mill Wheel** | Its initial operation costs an adjacent creature's main action. It then moves immediately and at the start of **every turn**. Collision or destruction can explode it. Pilot steering costs a move action; abandoning the seat costs a main action. | A scheduled object effect can run on every actual turn without getting a turn itself. Real extra boss turns count; resuming an interrupted turn creates no new start. Confirmed: a shared squad/captain turn advances it once, regardless of participant count.[^wheel] |
| **Pressure Plate → Ram** | A plate activates a linked mechanism. An ordinary plate resets automatically, a tripwire does not. A Ram can reset each round or each turn through upgrades. | A causal chain across objects is not several unrelated creature actions. Linked state and reset clocks must survive undo/redo. Mapless input supplies the actual trigger and affected targets.[^plate][^ram] |
| **Frozen Pond / Corrosive Pool** | Ice can replace unfinished forced movement, adds its remaining distance, and expressly prevents its own movement from retriggering the same ability. Fire can consume a corrosive pool and cause an area explosion. | Generic entry membership alone is insufficient: collect remaining movement/mode or damage type when needed. Source suppression prevents recursive retriggering; destruction does not erase the explosion. These are existing dependent-effect patterns.[^ice][^pool] |
| **Black Obelisk / Holy Idol** | Obelisk attacks at round start; failed deactivation can also activate it. Idol grants the Director a d6 each round that expires at round end and can modify one damage instance; multiple idols cannot stack dice on that instance. | The round queue, partial-input cards, source-scoped grants and expiry can handle work with no monster turn. Distinguish mandatory firing from a granted optional use.[^obelisk][^idol] |
| **Throne of A'An** | Attunement costs a main action; a seated creature gains an attack maneuver and a free response that grants Heroic Resource or Malice after qualifying fire damage. Destroying the throne causes Nova, even without an occupant. | An object's granted abilities use the occupant's ordinary economy and resource recipient. A response can be owned by a creature while its ability originates elsewhere. Attunement/control, temporary ability access and the object remain distinct state.[^throne] |

The Chronal Hypercube additionally changes allegiance at the **next round's start** after a successful
control test, while its ordinary start-round feature can teleport/hide it. Preserve those scheduled
changes and the actual ally relation; a player becoming its ally does not by itself settle which app
controls that player receives.[^cube]

## Objects as targets and effect recipients

The source distinguishes **creature**, **object**, and **both** target kinds. Objects normally have poison
and psychic immunity all. An ability that targets creatures and objects normally damages objects but
cannot apply its other effects unless the source says otherwise or the Director allows it. An object
forced to make a test gets tier 1 automatically. Thus a terrain reticle cannot simply reuse every creature
condition, characteristic or test assumption.[^target][^object]

Examples expressly override that baseline: burning objects take damage at **round end**, while burning
creatures take it at their own **turn start**. The terrain text marks burning save-ends, but the general
save rule schedules saves for creatures at their turn ends; these sources do not clearly supply an
object-save clock. Do not invent an object turn to fill that gap.[^pool][^save]

Mapless action cards can collect affected objects, affected parts, crossing facts, ground contact or line
of effect when needed. Merely keeping an area's current occupants is not enough for effects that trigger
on each square entered. Conversely, routine universal movement reports remain unnecessary: the existing
Resolve now path can report an otherwise unobservable trigger. An object's condition or changed section
must remain identifiable after the firing, independent of whichever turn entry exposed it.

The latest minion area ruling remains applicable to terrain **area** damage: identify affected minions
and cap that squad's final area damage at their combined applicable Stamina. Terrain is not universally
area damage: several hazard abilities are Strikes even though the hazard occupies several squares.
Use the actual source's area/target semantics, not the physical footprint alone. Keep captain damage
separate. Unsupported source combinations remain explicitly manual, not falsely automated.

## Subsequent clock-ownership decision, 2026-09-13

The user selected the game clock as the single owner of turn-based effect scheduling. Activating the
wheel resolves its immediate movement and registers later turn-start work with the clock; the wheel
does not maintain an independent schedule. Due firings use shared ability/effect resolution and causal
history. A subsequent user ruling also confirms once-per-turn global dispatch: shared squad/captain
starts count once, not once per participant. The source-specific ordering of every dependent effect
is not settled by these decisions. See
[the owning contract](../table-spec.md#game-clock-and-scheduled-rules-work).

## Compatibility and decisions genuinely left open

**Already compatible:** creature-paid object actions, additional granted abilities, automatic chains,
round/turn scheduling, precise resource timing, persistent spatial cards, required-input waits, ordinary
Director adjudication, and sequential history. Undo restores the entire recorded chain, including
object load/reset state and removed terrain; exact Redo restores its dice without rerunning them.
Optional prompts use the accepted windows; required hazard work cannot disappear because a prompt
expires. End combat must not synthesize an extra terrain turn or round tick. No new universal cancel,
movement-completion or standalone damage tool is warranted.

**No definite contradiction found in the confirmed initiative model.** However, treating every targetable
roster entity as a turn-taking monster, every terrain firing as a spent creature action, or every
start-turn effect as once per actor per round would contradict the sources. Current specs explicitly
leave specialized object targeting and effect-owner mapping open; these are coverage gaps, not evidence
that the settled creature flow must be replaced.[^spec]

Prioritize the following if terrain support enters the design:

1. **Shared turn counting — now confirmed.** The source left simultaneous squad/captain counting
   unclear. The user selected one global firing per actual turn, not per participant. The wheel moves
   once at the shared squad/captain turn start; personal effects and saves still resolve for each
   affected creature. A separate captain-only turn supplies another start; resuming an interrupted turn
   supplies none. This is the general shared-turn clock rule, not a per-object exception.[^minions][^captain][^wheel]
2. **Terrain presence and control.** Objects need a targetable live identity without a full turn, a way
   to supply creature operators where appropriate, and visibility/knowledge distinct from hostile-roster
   hiding. Which object interactions are exposed directly to players remains an app choice. Do not assume
   “Director placed it” means only the Director may use it; core rules explicitly let creatures operate
   or capture objects. Saving terrain, links and upgrades would extend today's monster/group/loot
   template scope; research alone does not authorize that extension.[^spec]
3. **Bounded source ambiguities.** Object save timing, unspecified interaction action costs, and the
   scope of terse once-per-round wording need source-specific adjudication before claimed automation.
   Also preserve uncertainty about sequencing a same-time area hit that destroys a Psionic Shard while
   damaging its protected allies: the source halves damage while intact and triggers a pulse on
   destruction, but does not explain that simultaneous damage calculation. Existing manual resolution
   suffices until interpreted; do not invent a universal sequencing change.[^shard]

Environmental danger can itself start combat under the printed Combat Round rule, even with no enemy
creatures. The app's explicit Director combat start is already an intentional adaptation; keep it.
An empty opposing side need not acquire a fictional terrain actor. Existing explicit adjudication for
empty-side opening remains the current contract.[^round][^spec]

This review identifies reusable extensions and a small number of actual interpretation questions. It
does not make all 35 terrain entries—or terrain itself—a v0.01 acceptance prerequisite.

[^general]: [Dynamic Terrain](../../vendor/steel-compendium/en/unified/md/chapter/dynamic-terrain.md) and [35-entry index](../../vendor/steel-compendium/en/unified/md/_index/dynamic-terrain.md).
[^building]: [Monster Basics: Dynamic Terrain Objects and Step 3](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#dynamic-terrain-objects).
[^ballista]: [Field Ballista](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/siege-engines/field-ballista.md).
[^wheel]: [Exploding Mill Wheel](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/siege-engines/exploding-mill-wheel.md).
[^plate]: [Pressure Plate](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/mechanisms/pressure-plate.md).
[^ram]: [Ram](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/mechanisms/ram.md).
[^ice]: [Frozen Pond](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/environmental-hazards/frozen-pond.md).
[^pool]: [Corrosive Pool](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/environmental-hazards/corrosive-pool.md).
[^obelisk]: [Black Obelisk](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/supernatural-objects/the-black-obelisk.md).
[^idol]: [Holy Idol](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/power-fixtures/holy-idol.md).
[^throne]: [Throne of A'An](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/supernatural-objects/the-throne-of-aan.md).
[^cube]: [Chronal Hypercube](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/supernatural-objects/the-chronal-hypercube.md).
[^bees]: [Angry Beehive](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/environmental-hazards/angry-beehive.md).
[^pillar]: [Pillar](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/mechanisms/pillar.md).
[^target]: [Target: Object](../../vendor/steel-compendium/en/unified/md/rule/combat/target.md#object).
[^object]: [Object Stamina](../../vendor/steel-compendium/en/unified/md/rule/general/unattended-object.md).
[^save]: [Saving Throw](../../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md).
[^minions]: [Monster Basics: Acting Together](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#acting-together).
[^captain]: [Captain: Separate Actions and Stamina](../../vendor/steel-compendium/en/unified/md/rule/monster/captain.md#separate-actions-and-stamina).
[^shard]: [Psionic Shard](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/power-fixtures/psionic-shard.md).
[^round]: [Combat Round](../../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md).
[^spec]: [Table spec: targeting, persistent area cards, initiative groups and remaining contracts](../table-spec.md), [rules adaptation](../rules-adaptation-principles.md), and [V1 scope](../v1-spec-checkpoint.md).
