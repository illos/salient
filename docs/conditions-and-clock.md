# Conditions, clock and Malice: sourced contract for v0.01

Status: rules contract, slice R05, 2026-09-14. Rules review required. This document states what the
pinned Compendium says and how the existing user rulings apply; it decides nothing the user has not
already decided. Every source citation is a repo-relative path into `vendor/steel-compendium` at
revision `fb83a789da8f0327a389c277a0c790b1648d5810`. Quoted text is verbatim except that the
Compendium's `[term](scc.v1:...)` link markup is shown as plain words in this document; the JSON
content file keeps the markup byte-exact.

Owning specifications: `docs/table-spec.md#v001-manual-condition-tracking`,
`docs/table-spec.md#game-clock-and-scheduled-rules-work`,
`docs/table-spec.md#initiative-groups-confirmed-app-model`, `docs/table-spec.md#taking-a-turn`,
`docs/table-spec.md#player-sheet-actions-and-explicit-end-turn`, `docs/table-spec.md#malice-visibility`,
`docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope`,
`docs/table-command-spec.md#clock-driven-operations`, and Q-TS-1 in `docs/rules-questions-for-user.md`.

Companion artifacts: `shared/content/core-conditions.json` (the toggle list with verbatim text),
`shared/contracts/clock.ts` (registration and dispatch types, no logic), and
`tests/core-conditions.test.ts` (verifies every JSON entry against its cited source file).

Labels used below: **Source** is quoted Compendium text. **Ruling** is an existing user decision, cited
to the spec that records it. **Interpretation** is grounded in cited text, with the alternatives named.
**Open** points to a `Q-R-n` entry in `docs/rules-questions-for-user.md`; the app applies the stated
provisional default until the user answers.

## 1. Core conditions

### 1.1 The list

**Source:** the Compendium's condition index lists exactly nine entries
(`vendor/steel-compendium/en/unified/md/_index/condition.md`, "Total: 9"), and the Heroes glossary
confirms the same nine: "Bleeding, dazed, frightened, grabbed, prone, restrained, slowed, taunted, and
weakened are conditions in *Draw Steel*." (`vendor/steel-compendium/en/unified/md/chapter/introduction.md`,
Glossary Index, **Condition**). The general definition: "Some abilities and other effects apply specific
negative effects called conditions to a creature. The following conditions show up regularly in the game
and can be tracked on your character sheet when they affect your hero."
(`vendor/steel-compendium/en/unified/md/rule/combat/condition.md`).

The v0.01 toggle list is therefore these nine, in index order. Winded, dying and unconscious are not
conditions in the source's sense (the end-of-combat rule names them as exceptions separately, see 1.3)
and are not toggles; Stamina/winded has its own settled contract.

| Id | Name | Source path | Save-ends default in source |
| --- | --- | --- | --- |
| `bleeding` | Bleeding | `vendor/steel-compendium/en/unified/md/condition/bleeding.md` | No |
| `dazed` | Dazed | `vendor/steel-compendium/en/unified/md/condition/dazed.md` | No |
| `frightened` | Frightened | `vendor/steel-compendium/en/unified/md/condition/frightened.md` | No |
| `grabbed` | Grabbed | `vendor/steel-compendium/en/unified/md/condition/grabbed.md` | No (own ending rules, see 1.2) |
| `prone` | Prone | `vendor/steel-compendium/en/unified/md/condition/prone.md` | No (own ending rule, see 1.2) |
| `restrained` | Restrained | `vendor/steel-compendium/en/unified/md/condition/restrained.md` | No (own ending rule, see 1.2) |
| `slowed` | Slowed | `vendor/steel-compendium/en/unified/md/condition/slowed.md` | No |
| `taunted` | Taunted | `vendor/steel-compendium/en/unified/md/condition/taunted.md` | No |
| `weakened` | Weakened | `vendor/steel-compendium/en/unified/md/condition/weakened.md` | No |

**Finding on save-ends defaults:** none of the nine condition entries contains a "(save ends)" clause or
any default duration. Duration comes from the imposing effect: "When a creature suffers a lasting effect,
whatever ability, feature, hazard, or other mechanic imposed the effect specifies how long the effect
lasts." (`vendor/steel-compendium/en/unified/md/chapter/classes.md`, **Ending Effects**). A save-ends
duration exists only when an effect's description says so: "If an effect has "(save ends)" at the end of
its description, a creature suffering the effect makes a saving throw at the end of each of their turns
to remove the effect." (`vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md`). This
confirms the ruling in `docs/table-spec.md#v001-manual-condition-tracking` that a manual toggle "supplies
no duration, so it cannot schedule expiry or imply a save-ends rule."

**Source supporting one toggle per condition:** "Different effects that impose the same condition (see
Conditions below) don't stack to impose the condition twice." (`chapter/classes.md`, the effect-stacking
paragraph preceding **Ending Effects**). Frightened and taunted add: "If a creature gains the
[condition] from one source while already [affected] by a different source, the new condition replaces the
old one." A single on/off toggle per condition is consistent with the source; it does not record which
source applies, which the ruling already accepts.

### 1.2 Verbatim effect text

The byte-exact text of each entry is in `shared/content/core-conditions.json` (`text` field, the full body
of the cited file after its frontmatter). It keeps the Compendium's link markup; rendering may strip
`[word](scc.v1:...)` to `word` for display, which is presentation and does not change the content file.
Readable versions follow, with link markup removed and nothing else changed.

**Bleeding.** While a creature is bleeding, whenever they use a main action, use a triggered action, or
make a test or ability roll using Might or Agility, they lose Stamina equal to 1d6 + their level after
the main action, triggered action, or power roll is resolved. This Stamina loss can't be prevented in
any way, and only happens once per action. You take damage from this condition when you use a main
action off your turn. For example, a signature ability used as a free triggered action with the
assistance of the tactician's Strike Now ability triggers the damage from the bleeding condition.

**Dazed.** A creature who is dazed can do only one thing on their turn: use a main action, use a
maneuver, or use a move action. A dazed creature also can't use triggered actions, free triggered
actions, or free maneuvers.

**Frightened.** When a creature is frightened, any ability roll they make against the source of their
fear takes a bane. If that source is a creature, their ability rolls made against the frightened creature
gain an edge. A frightened creature can't willingly move closer to the source of their fear if they know
the location of that source. If a creature gains the frightened condition from one source while already
frightened by a different source, the new condition replaces the old one.

**Grabbed.** A creature who is grabbed has speed 0, can't be force moved except by a creature, object,
or effect that has them grabbed, can't use the Knockback maneuver (see Maneuvers in Chapter 10: Combat),
and takes a bane on abilities that don't target the creature, object, or effect that has them grabbed.
If a creature is grabbed by another creature and that creature moves, they bring the grabbed creature
with them. If a creature's size is equal to or less than the size of a creature they have grabbed, their
speed is halved while they have that creature grabbed. A creature who has another creature grabbed can
use a maneuver to move the grabbed creature into an unoccupied space adjacent to them. A creature can
release a creature they have grabbed at any time to end that condition (no action required). A grabbed
creature can attempt to escape being grabbed using the Escape Grab maneuver (see Chapter 10: Combat). If
a grabbed creature teleports, or if either the grabbed creature or the creature grabbing them is force
moved so that both creatures are not adjacent to each other, that creature is no longer grabbed. A
creature can grab only creatures of their size or smaller. If a creature's Might score is 2 or higher,
they can grab any creature larger than them with a size equal to or less than their Might score. Unless
otherwise indicated, a creature can grab only one creature at a time.

**Prone.** While a creature is prone, they are flat on the ground, any strike they make takes a bane,
and melee abilities used against them gain an edge. A prone creature must crawl to move along the
ground, which costs 1 additional square of movement for every square crawled. A creature can't climb,
jump, swim, or fly while prone. If they are climbing, flying, or jumping when knocked prone, they fall.
Unless the ability or effect that imposed the prone condition says otherwise, a prone creature can stand
up using the Stand Up maneuver (see Maneuvers in Chapter 10: Combat). A creature adjacent to a willing
prone creature can likewise use the Stand Up maneuver to make that creature stand up.

**Restrained.** A creature who is restrained has speed 0, can't use the Stand Up maneuver, and can't be
force moved. A restrained creature takes a bane on ability rolls and on Might and Agility tests, and
abilities used against them gain an edge. If a creature teleports while restrained, that condition ends.

**Slowed.** A creature who is slowed has speed 2 unless their speed is already lower, and they can't
shift.

**Taunted.** A creature who is taunted has a double bane on ability rolls for any ability that doesn't
target the creature who taunted them, as long as they have line of effect to that creature. If a
creature gains the taunted condition from one source while already taunted by a different source, the
new condition replaces the old one.

**Weakened.** A creature who is weakened takes a bane on power rolls.

None of these effects is automated in v0.01 (`docs/table-spec.md#v001-manual-condition-tracking`: the
toggles "do not certify every condition's consequences"). The text is shown so the table can resolve
them manually; edge/bane counts remain manual inputs under the settled edge-and-bane contract.

### 1.3 Ending conditions

- **Manual saves (ruling):** for toggled conditions, the table rolls through ordinary dice controls and
  toggles the condition off; the roll and the toggle are separate logged operations
  (`docs/table-spec.md#v001-manual-condition-tracking`; Q-TS-1). The standard save the table will roll
  by hand is d10, success on 6 or higher (`rule/general/saving-throw.md`: "To make a saving throw, a
  creature rolls a d10. On a 6 or higher, the effect ends. Otherwise, it continues.").
- **Condition-specific endings in the source text** (manual in v0.01; listed so the toggle UI does not
  imply a save is the only way out): grabbed ends on release, Escape Grab, teleport, or forced movement
  apart; restrained ends on teleport; prone ends through Stand Up unless the imposing effect says
  otherwise. All quoted in 1.2.
- **End of combat (source):** "Any effect or condition on you that you suffered during combat (except
  for being winded, unconscious, or dying) ends if you want it to."
  (`vendor/steel-compendium/en/unified/md/chapter/combat.md`, **End of Combat**). The closeout ruling
  already matches: "Optional effects are not automatically cleared" (`agent.MD`, confirmed encounter
  closeout; `docs/table-spec.md#formal-encounter-closeout`). The app therefore never clears a toggle at
  encounter end; closeout may list the toggles so players can choose.
- **Dying (source, not a toggle):** "While dying ... you are bleeding, and this instance of the condition
  can't be negated or removed in any way until you are no longer dying."
  (`vendor/steel-compendium/en/unified/md/rule/health/dying.md`). Hero-dying automation is deferred
  beyond v0.01 (`docs/fury-goblin-automation.md#hero-dying`); the Director may toggle bleeding manually.

## 2. Clock contract

### 2.1 Definitions from the source

**Turn.** "Each creature in combat—whether hero, adversary, or something in between—gets to take a
**main action**, a **maneuver**, and a **move action** on their turn"
(`vendor/steel-compendium/en/unified/md/rule/combat/turn.md`). The glossary: "A creature's turn in combat
consists of a main action, a maneuver, and a move action." (`chapter/introduction.md`, **Turn**).

**Combat round.** "Combat takes place over a series of combat rounds. During a combat round, each
creature in the battle takes a turn. Once every creature has taken a turn, a new round begins."
(`vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md`).

**Turn order within a round.** "Whichever side goes first chooses a creature (or sometimes a group of
creatures on the Director's side) to act at the start of combat. ... When that turn is over, the other
side chooses a creature to act. Play continues back and forth this way as each creature takes their
turn." and "Unless an ability or special rule allows them to do so, any creature who has taken a turn
during a combat round can't act again until a new round begins." and, for the exhausted-side case, "The
creatures who have yet to act get to take their turns in any order they choose, without turns in between
from the other side." (`rule/combat/combat-round.md`, **Creatures Take Turns**).

**Director groups.** "Director-controlled creatures act in groups ... When a group of enemies acts, the
Director chooses a single creature or minion squad to take a turn. Once that turn is over, the Director
chooses another creature in that group to take a turn, continuing until all members of the group have
taken their turn." (`rule/combat/combat-round.md`, **Enemies Act In Groups**); "all creatures in the
same initiative group acting on the same turn" (`vendor/steel-compendium/en/unified/md/chapter/monster-basics.md`,
**Step 6: Build Initiative Groups**). The app's confirmed model already reads a group as successive
individual turns with individual boundaries (`docs/table-spec.md#initiative-groups-confirmed-app-model`,
`#taking-a-turn`); the two source passages differ in wording ("on the same turn" versus "another creature
in that group to take a turn") and the ruling resolves that for the app. Not reopened here.

**End of round.** "Once all creatures on both sides of a battle have acted, the combat round ends and a
new combat round begins. The side whose members acted first during the initial combat round goes first
in all subsequent rounds." (`rule/combat/combat-round.md`, **End of Round**).

**End of turn and saves.** "a creature suffering the effect makes a saving throw at the end of each of
their turns to remove the effect" (`rule/general/saving-throw.md`). "Many effects last until the end of
the target's next turn, abbreviated as "(EoT)" ... A creature suffers from such an effect until the end
of their next turn, or the end of their current turn if the effect was imposed on their current turn."
(`vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md`).

**Start of turn (monsters).** "At the start of any monster's turn, you can spend Malice to activate one
of the following features" (`vendor/steel-compendium/en/unified/md/rule/monster/malice.md`, **Basic
Malice**). This is an optional Director choice, never automatic work.

### 2.2 Boundaries the app dispatches

`shared/contracts/clock.ts` defines six distinct boundary kinds. They never collapse into a generic tick
(`docs/table-spec.md#game-clock-and-scheduled-rules-work`, confirmed 2026-09-12).

| Boundary | When it occurs in the app | Source basis |
| --- | --- | --- |
| `combat-start` | Director **OK** on the setup card, after the precombat baseline is captured (`docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation`). | "Combat starts as soon as one creature intends to harm another" (`rule/combat/combat-round.md`); "At the start of combat, you gain Malice" (`rule/monster/malice.md`). |
| `round-start` | Round 1: when the starting side is established and announced (after the roll-and-choice path or the surprise-determined path). Later rounds: immediately after the preceding `round-end`. | "Once every creature has taken a turn, a new round begins." |
| `turn-start` | **Take turn** accepted for one turn entry (a hero by its player or the Director; a foe by the Director). | "that creature gets to take their turn". |
| `turn-end` | **End turn** accepted for that turn, including ending early with unused actions (`docs/table-spec.md#player-sheet-actions-and-explicit-end-turn`), or removal of the currently acting monster (`#taking-a-turn`). | "at the end of each of their turns"; EoT rule. |
| `round-end` | When the last unspent turn entry of the round has ended (see 2.3). | "Once all creatures on both sides of a battle have acted, the combat round ends". |
| `combat-end` | Normal encounter end through closeout. Void and End combat synthesize no turn or round boundary (closeout ruling). | "At the end of an encounter, any unused Malice is lost." |

**Turn boundary (ruling):** a turn boundary belongs to one actual turn of one creature. "Ordinary turn
boundaries reference the individual creature, including within an initiative group." An entry in the
initiative display is not a started turn; "showing it does not itself start the turn." A granted extra
turn supplies its own boundaries; resuming an interrupted turn supplies none
(`docs/table-spec.md#game-clock-and-scheduled-rules-work`, `#initiative-groups-confirmed-app-model`,
`#taking-a-turn`). Squad/captain shared turns are V02 and out of scope here; the type carries
`participantIds` so the V02 shared turn needs no contract change.

**Round boundary (interpretation):** the source ends a round "once all creatures on both sides of a
battle have acted". The app reads this as: the round ends when the encounter has no unspent turn entry
left among its current participants. A creature that is Slain or removed from the encounter is no longer
"in the battle" and does not hold the round open (grounded in "creatures on both sides of a battle";
the alternative, waiting for a removed creature's turn, has no source support and would stall play). A
creature added to the encounter during a round receives an unspent turn entry in the current round,
so the round does not end until that entry is spent or the Director removes it. **Confirmed app
choice, Q-R-52:** already recorded in the table spec on 2026-09-12 and reaffirmed by the user on
2026-09-14. Existing side/group scheduling and source-specific timing still apply. The
[independent source check](research/mid-round-reinforcements.md) found this consistent with the
ordinary turn rules, but no explicit general mid-round reinforcement rule. Summons have their own
explicit immediate-after-summoner timing. The earlier provisional label is superseded.

**Sequence at a round change (interpretation):** the last turn's `turn-end` work, including its save
phase, completes before `round-end` fires; `round-start` of the next round follows immediately; the
first `turn-start` of the new round waits for an actual **Take turn**. The source fixes only that the
round ends after the last creature has acted and that the same side goes first next round; it does not
describe round-end work separately from the last turn's end. Keeping them as separate consecutive
boundaries is the app's standing rule ("do not collapse into a generic tick"), not a claim that the
source names a distinct end-of-round phase.

### 2.3 Order of due work at a boundary

**Ruling, quoted:** "Standing clock policy explicitly confirmed by the user: at a boundary, resolve due
work in enqueue order with save-ends rolls last. Include all applicable save-ends effects applied before
the final save phase begins, unless their source specifies otherwise. This is an explicit standing app
policy, not an inferred precedent from a case ruling; preserve source timing and special save
replacements." (`agent.MD`, Engine and history intent; recorded in
`docs/table-spec.md#game-clock-and-scheduled-rules-work` as the 2026-09-12 confirmed initial app policy
and the standing save-phase policy).

**Ruling, quoted:** "Confirmed shared-turn counting, 2026-09-13: global "every turn" effects fire once
per actual turn, not once per participant." (`docs/table-spec.md#game-clock-and-scheduled-rules-work`).

Applied to the contract types:

1. Build the `DispatchPlan` for the boundary event: all `active` registrations whose `TimingClause`
   matches, split into `ordinary` and `saves`, each in ascending `enqueueSeq`.
2. Fire the ordinary phase in that order. Each firing appends its own log entry linked to the causing
   user operation (End turn keeps user attribution; consequent work is system work).
3. Determine save eligibility from the state *after* step 2, so an effect imposed by earlier queued work
   at this boundary is included (standing save-phase policy). Fire the save phase in `enqueueSeq` order.
   Each save is d10, 6 or higher ends the effect, otherwise it continues (`rule/general/saving-throw.md`);
   source-specific replacements (for example a monster's End Effect trait,
   `vendor/steel-compendium/en/unified/md/rule/monster/end-effect.md`) are optional choices, never fired
   automatically.
4. Retire one-shot registrations that fired; keep recurring ones until their effect ends.
5. Retries return the recorded `DispatchResult`; they never refire or reroll.

The source itself supplies no general ordering rule for independent work at one boundary; the research
in `docs/research/turn-boundary-ordering.md` stands. The ordering above is the user's app policy.

### 2.4 Producers of scheduled work in v0.01

**Ruling (Q-TS-1, answered 2026-09-14):** "No. No save-ends roll is automatic in v0.01; all saves use
ordinary dice controls and manual condition removal. Automatic resolution is V1 behavior."

**In one sentence: v0.01 has no automatic save producer, because the Q-TS-1 answer of 2026-09-14 makes
every v0.01 save a manual dice roll followed by a manual toggle, so nothing registers a `saving-throw`
work item and the clock's save phase is empty at every boundary.**

The only registrations that can exist in v0.01 are:

- The common Malice lifecycle (section 3): `combat-start-grant`, `round-start-gain` each round, and
  `encounter-end-loss`.
- Surprise expiry, if A04 registers it: "surprised until the end of the first combat round"
  (`rule/combat/surprised.md`) is a `round`/`round-end`/`round: 1` clause whose work clears the
  Surprised flag set on the setup card. Proposal: A04 registers this because the opening operation
  already records the flag and the timing is explicit in the source; if A04 does not, the flag is
  cleared manually and the walkthrough says so. The mechanical effects of surprise (no triggered
  actions, edge against) stay manual in v0.01.
- Any other source-backed operation that A04 or A05 registers with a timing clause quoted from the
  source. Class-specific resource generation was deferred for v0.01
  (`docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope`).
- **V120 (2026-09-24), superseding that deferral for V1:** each hero participant whose class has a
  generation profile (`shared/resolve/heroicResourceGeneration.ts`) gets three `heroic-resource`
  registrations at OK, after the Malice steps:
  - `combat-start-grant` (+Victories);
  - `turn-start-gain` on each of that hero's turns (fixed, or dice logged on the firing);
  - `encounter-end-loss`, which also clears the hero's claimed triggers.

  Class triggers the app cannot observe are recorded with `resource.claim`, which enforces each
  trigger's round, turn or encounter limit. Classes are enabled one slice at a time
  (`docs/decisions/2026-09-24-heroic-resource-automation.md`).

Manual condition toggles register nothing ("Do not infer timers from toggles.", `agent.MD`).

**Implementation note, 2026-09-15 (A04):** A04 registers the surprise expiry (`round`/`round-end`/`round: 1`,
work `operation: combat.surprise-expiry`) at OK when any selected creature is surprised; it clears the
Surprised flag on every turn entry and logs the names. The three Malice steps are registered at OK in the
order of the table in 3.2. Nothing registers a save.

## 3. Malice common lifecycle

### 3.1 Source

**Growth rule, quoted:** "At the start of combat, you gain Malice equal to the average number of
Victories per hero. Then at the start of each combat round, you gain Malice equal to the number of heroes
in the battle, plus the combat round number. For instance, if five heroes with three Victories each are
just starting their first combat round, you begin that combat with 9 Malice-3 for the average number of
Victories, 5 for the number of heroes, and 1 for the first round of combat. At the start of the next
round, provided all the heroes are still alive, you gain 7 Malice-5 for the number of heroes plus 2 for
the second round. As long as none of the heroes is taken out of the fight, you gain 8 Malice in the third
round, 9 Malice in the fourth round, and so on.

If a hero dies, they stop generating Malice for you. At the end of an encounter, any unused Malice is
lost." (`vendor/steel-compendium/en/unified/md/rule/monster/malice.md`, **Earning Malice**).

**Spending, quoted:** "Monsters can spend Malice the way heroes spend their Heroic Resource, activating
and enhancing their abilities. Abilities that make use of Malice have their Malice cost noted in a
creature's stat block." and "At the start of any monster's turn, you can spend Malice to activate one of
the following features: Brutal Effectiveness (3 Malice) ... Malicious Strike (5+ Malice) ..." (same
file, **Spending Malice** and **Basic Malice**).

**Visibility, quoted:** "It's up to you whether you want to show the players how much Malice you have."
(same file). The app's Show Malice setting implements this (`docs/table-spec.md#malice-visibility`).

### 3.2 What "common lifecycle" covers (ruling)

Confirmed v0.01 automation (`docs/table-spec.md#malice-visibility`, 2026-09-13, and
`docs/fury-goblin-automation.md#malice-lifecycle`): apply the combat-start grant, the round-start gains
and the normal encounter-end loss automatically to the persistent shared pool, each logged once with
cause, inputs and before/after values. Director pool edits are separate Manual adjustment operations.

| Step | Boundary | Amount | Registered by |
| --- | --- | --- | --- |
| `combat-start-grant` | `combat-start` | average Victories per participating hero (sum of recorded Victories divided by hero count) | encounter OK |
| `round-start-gain` | every `round-start`, round 1 included | number of heroes generating Malice + round number | encounter OK, recurring |
| `encounter-end-loss` | `combat-end` (normal end only; Void keeps its own keep/reset contract) | pool becomes 0 | encounter OK |

Placement in the opening sequence (interpretation, resolving the "pin the startup grant's placement"
item in `docs/fury-goblin-automation.md#malice-lifecycle`): the combat-start grant fires at OK, after
the precombat baseline snapshot, because the ruling says combat is active from OK and the source says
the grant is "at the start of combat"; the round-one gain fires when round 1 starts, which the app
places at the starting-side announcement. Both precede any turn, so neither placement changes the pool
any monster can spend on its first turn. The alternative, granting both at OK, would put "start of each
combat round" before the round exists; the alternative of granting both at the first Take turn would
delay the source's "start of combat" grant past the point where Void could reset it.

### 3.3 Manual parts in v0.01

- **Spending** is manual: the Director records a spend through the fixed-cost operation when an
  ability's Malice cost is printed in the stat block and supplied by the operation (the ability-cost
  contract), otherwise through Manual adjustment. Basic Malice features are Director choices at a
  monster's turn start; the app never applies them.
- **Hero count. User decision, 2026-09-14 (Q-R-50):** at each round start, count the heroes still
  participating in combat, represented by their remaining combat turn entries. Removing a hero from
  combat stops their contribution to subsequent round-start gains; a dying hero who remains in combat
  still counts. Count each hero once, regardless of how many turn entries they have or whether they
  have acted. This supersedes the provisional count fixed at encounter setup. Hero death remains
  manually adjudicated in v0.01; zero Stamina alone does not establish death. Log the actual hero count
  used with the grant; removal does not retroactively change earlier grants.
- **Fractional average. User decision, 2026-09-14 (Q-R-51):** round the combat-start average
  Victories down to a whole number and log the unrounded average alongside the grant. For heroes with
  1, 1 and 2 Victories, the average is 4/3 and the grant is 1 Malice. The user confirmed the
  [round-down convention](rules-adaptation-principles.md#confirmed-rounding-convention) unless a
  source specifies otherwise. The pinned Always Round Down passage explicitly covers halving;
  applying that convention to this average is now a confirmed user ruling, replacing the provisional
  interpretation.
- **Victories** are read, never changed, by the lifecycle (`docs/fury-goblin-automation.md#malice-lifecycle`).

## 4. Surprise and the starting side

**Surprise, quoted:** "When battle starts, the Director determines which creatures, if any, are caught
off guard. Any creature who isn't ready for combat at the start of an encounter is surprised until the
end of the first combat round. A surprised creature can't take triggered actions or free triggered
actions, and ability rolls made against them gain an edge."
(`vendor/steel-compendium/en/unified/md/rule/combat/surprised.md`).

**Starting side, quoted:** "Sometimes figuring out who gets to take the first turn in combat is
automatic. If all the creatures on one side are surprised, then a creature on the other side gets to
act first. But if both sides have creatures who aren't surprised, the Director or a player they choose
rolls a d10. On a 6 or higher, the players determine who goes first—the heroes' side or the other side.
Otherwise, the Director decides which side goes first." (`rule/combat/combat-round.md`, **Determine Who
Goes First**). "The side whose members acted first during the initial combat round goes first in all
subsequent rounds." (same file, **End of Round**).

**Sides, quoted:** "Every combat encounter is a conflict between two sides. The heroes and any of their
allies are one side, controlled by the players. Any creatures who oppose the heroes are the other side,
controlled by the Director." (`vendor/steel-compendium/en/unified/md/rule/combat/side.md`).

**Confirmation of the opening contract** (`docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation`):
the Surprised toggles per creature match "the Director determines which creatures, if any"; the
roll-required path exists exactly when both sides have an unsurprised creature; "6+ awards the choice to
the players, and 1–5 awards it to the Director" matches the source; when all creatures of one side are
surprised the other side acts first without a roll (the "surprise-determined path"). The ruling that any
active player may click Roll is a deliberate app departure from "the Director or a player they choose",
recorded there; not reopened. Surprise lasts through round 1 only, so its expiry is `round-end` of round
1 (section 2.4). Surprised creatures still take their turn in round 1; the source restricts only
triggered actions and gives edges against them.

## 5. Worked example: two rounds, one hero and one foe

Setup: hero **Thorn** (level 1, 0 Victories recorded) and foe **Goblin Warrior**, each in its own
initiative group (ruling: one initial group per creature). Nobody is surprised. No condition toggles are
on at the start. The Director does not spend Malice. Dice shown are illustrative inputs, not outcomes
the contract decides. Every line is a discrete ordered log entry.

| # | Clock event | Registered work due (enqueue order, saves last) | Result |
| --- | --- | --- | --- |
| 1 | Director OK on the setup card: baseline snapshot captured, locks applied. | — | Encounter committed. |
| 2 | `combat-start` | Malice `combat-start-grant`: average Victories = 0 / 1 = 0. | Pool 0 → 0 (logged with inputs). |
| 3 | Both sides have an unsurprised creature: shared initiative roll, d10 = 7. | — | 6+: players choose. |
| 4 | Players choose **Heroes first**; announced. | — | Heroes act first in every round. |
| 5 | `round-start` (round 1) | Malice `round-start-gain`: 1 hero + round 1 = 2. | Pool 0 → 2. |
| 6 | `turn-start` Thorn (player Take turn) | None registered (class turn-start grants are deferred). | Thorn's turn begins. |
| 7 | Thorn acts: for example a strike on the Goblin, recorded through the shared operations. | — | Not clock work. |
| 8 | `turn-end` Thorn (player End turn) | Ordinary phase: none. Save phase: empty (no automatic save producer, Q-TS-1). | Turn ends. If Thorn had a toggled condition allowing a save, the player rolls d10 by hand and toggles it off on 6+; two separate log entries, outside the clock. |
| 9 | `turn-start` Goblin (Director Take turn) | None registered. The Director may choose a Basic Malice feature here and record the spend manually; none chosen. | Goblin's turn begins. |
| 10 | Goblin acts (manual resolution of its ability text; any fixed Malice cost is paid through the cost operation). | — | Not clock work. |
| 11 | `turn-end` Goblin (Director End turn) | Ordinary: none. Saves: empty. | Turn ends. |
| 12 | `round-end` (round 1): no unspent turn entry remains. | None registered (nobody was surprised; otherwise surprise expiry would fire here). | Round 1 ends. |
| 13 | `round-start` (round 2) | Malice `round-start-gain`: 1 hero + round 2 = 3. | Pool 2 → 5. |
| 14 | `turn-start` Thorn | None. | Heroes' side first again. |
| 15 | `turn-end` Thorn | Ordinary: none. Saves: empty. | |
| 16 | `turn-start` Goblin | None (Malice spend optional and manual). | |
| 17 | `turn-end` Goblin | Ordinary: none. Saves: empty. | |
| 18 | `round-end` (round 2) | None. | Round 2 ends; round 3 would start with a gain of 1 + 3 = 4. |

Derivation check (acceptance check 4): the only registrations in this example are the three Malice steps
from section 3.2; combat-start yields 0 because 0 Victories / 1 hero = 0; round gains are hero count 1
plus round number 1 and 2, giving 2 and 3 and a running pool of 0, 2, 5; save phases are empty by
Q-TS-1; turn boundaries occur once per actual turn, four turns in total; round-end fires when the last
unspent entry of each round has ended. These match the fixture arithmetic already recorded in
`docs/fury-goblin-automation.md#malice-lifecycle` (round one 2, round two 3).

Variant (interpretation from 2.2): if Thorn's strike at step 7 slays the Goblin, the Goblin's turn entry
is removed as no longer in the battle, so `round-end` for round 1 fires immediately after step 8 and
round 2's `round-start` still grants 1 + 2 = 3. If instead the Director adds a second foe during round 1,
the confirmed Q-R-52 behavior gives it an unspent entry in round 1.

Normal end after round 2: closeout (`docs/table-spec.md#formal-encounter-closeout`) resolves required
work, the Director grants Victories, and `combat-end` fires Malice `encounter-end-loss`: pool 5 → 0. No
final turn or round boundary is synthesized, and Thorn's toggles are not cleared automatically.

## 6. Corrections to the slice's research list

All paths listed under "Rules research" in `docs/build/R05-conditions-clock-malice.md` exist at the
pinned revision and were read in full. Additional files read for grounding: `_index/condition.md`,
`_index/rule.md`, `chapter/introduction.md` (glossary entries), `chapter/classes.md` (effect stacking,
Ending Effects), `rule/general/always-round-down.md`, `rule/resource/victories.md`,
`rule/health/dying.md`, `rule/monster/end-effect.md`. No path in the slice needed correction.
