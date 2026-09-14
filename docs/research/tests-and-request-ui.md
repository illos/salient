# Tests and the need for a request UI

Research date: 2026-09-13. Source: pinned local Steel Compendium only,
`fb83a789da8f0327a389c277a0c790b1648d5810`; Heroes and Monsters core entries.
No vendor changes. This is a bounded review of representative uses, not an exhaustive test inventory.

Subsequent user decision, 2026-09-13: the recommendation below is accepted. Remove generic Director
test requests for now and use verbal calls plus direct rolls. This is a deliberate scope decision,
not a missing specification gap. The recommendation text below preserves the research as presented.
The separate monster-group answer is recorded in the primary specs and decision record.

## Source findings

Tests resolve uncertain interactions with the world, distinct from the ability rolls used to resolve
abilities. The Director calls for tests when failure or consequences would be interesting, and can waive
unnecessary rolls. The ordinary procedure is conversational: choose the characteristic and difficulty,
ask the player to roll, agree any relevant skill, then interpret the result. An applicable agreed skill
adds +2. This procedure does not require a preauthored task or formal request object.
Sources: [Power Rolls](../../vendor/steel-compendium/en/unified/md/rule/dice/power-roll.md),
[Tests](../../vendor/steel-compendium/en/unified/md/chapter/tests.md#when-to-make-a-test),
[How to Make a Test](../../vendor/steel-compendium/en/unified/md/rule/test/test.md).

| Representative use | What the rules do | App implication (recommendation) |
| --- | --- | --- |
| Climb a wall or pick a lock | The Director chooses a characteristic appropriate to the approach, such as Might for climbing or Agility for picking a lock, and a difficulty. | Verbal request plus a character's Roll test control is sufficient. The result can include the chosen characteristic, agreed skill and other modifiers. |
| Notice a concealed feature or recall lore | The Director can ask for an Intuition or Reason reactive test without first explaining why. Optional secret reactive tests let the Director roll for heroes instead. | A generic request card is optional convenience, not required to conduct the test. Direct rolls should not force disclosure of the fictional purpose. Existing secret-roll scope remains separate. |
| Sneak past a sleeping ogre as a group | Each participant rolls; the Director waits for all participating results to interpret the group outcome. At least half succeeding makes the task succeed. Participants cannot assist one another on that group test. | Verbal coordination works. Automatic aggregation would need a participant set and linked rolls, but that is a separate automation choice, not proof every request needs a UI. |
| Deactivate a bear trap | An adjacent creature can use a maneuver for an Agility test. A result of 11 or less triggers the trap; 12–16 deactivates it but slows the creature until end of turn; 17+ deactivates it without triggering. | A Deactivate action can supply the test and its consequences directly. A purpose-specific action card is useful if input is needed; no separate Director-authored generic request is necessary. |

Example sources: [ordinary tasks](../../vendor/steel-compendium/en/unified/md/rule/test/test.md#characteristics-and-tests),
[Reactive Tests](../../vendor/steel-compendium/en/unified/md/rule/test/reactive-test.md),
[Group Tests](../../vendor/steel-compendium/en/unified/md/rule/test/group-test.md),
[Bear Trap](../../vendor/steel-compendium/en/unified/md/dynamic-terrain/fieldworks/bear-trap.md).
The trap row summarizes its listed bands, not a complete implementation of every general test modifier
or exceptional result. Creature/terrain-required reactive tests cannot be modified by skills under the
reactive-test rule; do not infer that every voluntary terrain interaction has that restriction.

Two additional bookkeeping details matter without requiring a generic request workflow:

- **Assistance is itself a test.** It requires suitable expertise different from the skill the recipient
  is using and a plausible explanation accepted by the Director. Its listed outcomes give the recipient
  a bane, edge or double edge. A dedicated Assist operation could link that benefit to the later roll;
  verbal assistance with explicit modifier entry also works for manual play.
- **Combat tests have action costs.** Many use a maneuver, including picking a lock; assistance is a
  maneuver. More involved tasks may use a main action or be impractical during combat, and recalling lore
  is usually a free maneuver. A generic test button must not assume every test has the same cost.

Sources: [Assist a Test](../../vendor/steel-compendium/en/unified/md/chapter/tests.md#assist-a-test),
[Make or Assist a Test](../../vendor/steel-compendium/en/unified/md/feature/common/maneuvers/make-or-assist-a-test.md).

A group test's own outcome depends on its participants' rolls. This does not require the entire app to
block unrelated play, nor contradict the user's decision that ordinary request cards need no separate
cancellation control. Source-defined group aggregation remains distinct from the app's former
one-volunteer / one-roll-per-character request modes, since removed. Montage and negotiation workflow design is outside
this review and remains deferred under existing scope.

## The material tradeoff: knowing the outcome

The same total means different things at different difficulties. A 14 is success on easy, success with
a consequence on medium, and failure on hard. Difficulty may be secret or public. Natural 19/20 has a
special success-with-reward rule; test rerolls can involve hero tokens. Preserve test identity, original
dice and applicable modifiers even when no request object precedes the roll.
Sources: [Test Difficulty](../../vendor/steel-compendium/en/unified/md/rule/test/test-difficulty.md),
[Natural 19 or 20](../../vendor/steel-compendium/en/unified/md/rule/dice/natural-19-20.md).

A standalone roll can always show its recorded dice, modifiers and total. It can show a calculated outcome
when the app knows the relevant difficulty or specific outcome table. If the Director only chose a hidden
difficulty mentally, the app lacks that information: let the Director interpret the result rather than
inventing success/failure. Narrative consequences still require adjudication when the source has not
specified them. A request UI is one way to collect hidden difficulty in advance, but it is not the only
possible way; post-roll Director input or direct interpretation are alternatives.

## Original recommendation, subsequently accepted

Make verbal calls plus character-initiated Roll test the ordinary flow and remove the general-purpose
Director Request test UI. Retain structured test rolls, shared headless execution, modifiers, relevant
resource/usage bookkeeping and recorded results. Keep source-specific test steps inside their originating
action cards when automation needs them, such as trap deactivation or a feature requiring a reactive test.
These are different needs from composing a generic request for a volunteer or everyone.

At the time of research, this proposal required user acceptance to supersede the earlier request-card
UI and response modes. The user subsequently accepted it, including Director interpretation of
standalone rolls without recorded difficulty. The authoritative specs now reflect that decision. The current Show test difficulty
setting can still govern difficulty values that the app actually knows, including historical displays.

The acceptance supersedes prior request-card, response-mode and lifetime requirements. Primary specs
and the app handoff now reflect direct rolls and Director interpretation when difficulty is unrecorded.
