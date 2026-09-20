# V83: Core perk action audit

## Scope and evidence

Fresh source audit of all 47 implemented core perks at Compendium pin
`fb83a789da8f0327a389c277a0c790b1648d5810`, against application source at
`89b79e9b4a3769e2ae316c26816f96811693162c`. Read the pinned Git blobs from
`en/unified/md/perk/`; no Opus artifacts, Forge inference, browser or runtime tests were used.
This is a source/code audit, not persisted acceptance evidence. The implementation owner is
[V83](V83-supporting-actions.md).

Three perk abilities are granted today, five further perks explicitly grant combat actions,
and fifteen other perks describe usable activities or narrative effects worth exposing through
accurately labelled shared controls. Familiar additionally has a respite restoration alternative.
The remaining 24 perks modify other operations or provide passive/build effects. Those are not
24 missing standalone abilities. Some perks in the activity group also modify tests.

`shared/content/supporting-backgrounds.ts` selects all 47 and retains their source, but
`perkOption` grants only Arcane Trick, Invisible Force and Psychic Whisper. The evaluator's
`perks()` retains the perk separately; `abilities()` honors those three `perk-ability` grants.
`convex/characters.ts` `abilityView()` gives perk content no metadata and groups it as `other`.
Thus even the existing three need presentation correction: Arcane Trick is a main action and
the other two are maneuvers. `convex/lib/resolve.ts` `abilitiesFor()` consumes the shared grants;
merely adding text to the perk feature cannot expose a new selectable table action.

## Classification and complete ledger

Paths below are relative to `vendor/steel-compendium/en/unified/md/perk/`.
**Existing** means a current grant, not newly verified execution. **Action gap** identifies an
explicit source action. **Activity gap** identifies a usable effect lacking a separate shared
entry; a duration or narrative trigger must not be turned into an invented combat action cost.
**Modifier/passive** means retain the feature and its effects in the appropriate existing
operation; do not manufacture a separate ability just to increase the action count.

| Perk / source file | Classification | Source outcome and relevant limit |
| --- | --- | --- |
| Arcane Trick / `arcane-trick.md` | Existing | Main action; seven alternative minor magical effects. Preserve all alternatives. |
| Area of Expertise / `area-of-expertise.md` | Activity gap + modifier | Inspect an object related to the selected owned crafting skill for 1 minute to learn value/flaws. Separately upgrades tier 1 easy/medium tests with that skill to tier 2. Nested skill target already exists. |
| Brawny / `brawny.md` | Modifier | After failed Might test, optionally lose 1d6 + level Stamina to improve outcome one tier; once per test. No independent action type assigned. |
| But I Know Who Does / `but-i-know-who-does.md` | Modifier/passive | Failed lore-skill recall test reveals a possible information location at Director discretion. |
| Camouflage Hunter / `camouflage-hunter.md` | Modifier/passive | In wilderness, maintaining existing hidden status does not require cover/concealment. |
| Charming Liar / `charming-liar.md` | Modifier | Suppresses failed Lie consequences or one caught negotiation lie; becomes unavailable until earning a Victory. |
| Creature Sense / `creature-sense.md` | Action gap | Maneuver; creature within 10 squares; learns stat-block keywords only if its level is no higher than yours. |
| Criminal Contacts / `criminal-contacts.md` | Activity gap | Respite activity in a settlement; Presence test supplies common information at tier 2 or uncommon information at tier 3, if it exists. |
| Danger Sense / `danger-sense.md` | Modifier/passive | Natural environment outside a settlement: Alertness edge and cannot be surprised; impending natural-disaster warning. Conditional, not permanent surprise immunity. |
| Dazzler / `dazzler.md` | Modifier/passive | Watching a 1-minute performance grants influence-test edge for 1 hour afterward; modifies ordinary performance/influence. |
| Eidetic Memory / `eidetic-memory.md` | Activity gap + build choice | Memorize a page through 1 uninterrupted minute of reading. Also respite-selected unowned lore skill until next respite; optional current skill choice already exists. |
| Engrossing Monologue / `engrossing-monologue.md` | Activity gap | Outside combat, shout to hearing creatures within 10; nonhostile listeners attend for at least 1 minute or until danger, enabling allied unnoticed tests with edge. |
| Expert Artisan / `expert-artisan.md` | Modifier | Craft/research test using owned crafting skill: roll twice, choose either. |
| Expert Sage / `expert-sage.md` | Modifier | Craft/research test using lore skill: roll twice, choose either. |
| Familiar / `familiar.md` | Action gap + activity | Destroyed familiar: restore by main action spending one Recovery, adjacent unoccupied space, or as a respite activity. Familiar/senses source remains retained; companion automation is separate. |
| Forgettable Face / `forgettable-face.md` | Activity gap + modifier | On parting after no more than 10 minutes with a previously unknown creature, optionally make it forget your face. Separately 1-hour disguise preparation sets test tier 2, or tier 3 with Disguise skill. |
| Friend Catapult / `friend-catapult.md` | Action gap | Maneuver; willing adjacent ally/object no larger than you; vertical push up to twice Might and reduce resulting fall distance accordingly; unavailable until earning a Victory. |
| Gum Up the Works / `gum-up-the-works.md` | Action gap | Triggered action when mundane trap activates within 3; move up to 3 toward it, jam if adjacent; trap remains suppressed while adjacent unless failed disarm. |
| Handy / `handy.md` | Modifier | Craft test without applicable skill: +1 power roll. |
| Harmonizer / `harmonizer.md` | Modifier | Music Presence test can influence emotionless/non-understanding creatures; once per negotiation accompany ally argument with music for edge. |
| Improvisation Creation / `improvisation-creation.md` | Activity gap | Jury-rig/repair mundane equipment tied to owned crafting skill without test/tools; lasts 1 hour or one use, then breaks. Source says quickly, not a combat action type. |
| Inspired Artisan / `inspired-artisan.md` | Modifier | Spend hero token during crafting-skill project roll for another roll in same respite activity; once per respite. |
| Invisible Force / `invisible-force.md` | Existing | Maneuver; ranged 10, one size 1T object; move/manipulate within characteristic-dependent limit. |
| I've Got You! / `ive-got-you.md` | Action gap | Free triggered action; catch willing falling ally landing on/adjacent to you; neither takes fall damage. |
| I've Read About This Place / `ive-read-about-this-place.md` | Activity gap | Enter a never-visited settlement; ask Director one of three source questions, replacing an unanswered/refused question. |
| Lie Detector / `lie-detector.md` | Activity gap | Respond to communicated information; spend hero token to identify knowing lies, not the truth. Source assigns no action type. |
| Linguist / `linguist.md` | Build/passive | Two new previously encountered languages (existing nested choice); 7-day immersion grants basic communication and halves eventual research goal. |
| Lucky Dog / `lucky-dog.md` | Modifier | Failed intrigue-skill test: lose 1d6 + level Stamina to improve outcome one tier, once per test. |
| Master of Disguise / `master-of-disguise.md` | Modifier | Don/remove disguise as part of Hide skill test or Hide maneuver. No separate action grant. |
| Monster Whisperer / `monster-whisperer.md` | Modifier | Handle Animals also works with nonsapient nonanimals. |
| Open Book / `open-book.md` | Activity gap | One-on-one question without ordinary offence/suspicion; honest answer permits reciprocal question which you must answer honestly. |
| Pardon My Friend / `pardon-my-friend.md` | Modifier | Replace failed Presence test of ally within 5 with own Presence test at bane; once per original test across all users. |
| Polymath / `polymath.md` | Modifier | Recall-lore test without applicable skill: +1 roll. |
| Power Player / `power-player.md` | Modifier | Use Might for Brag, Flirt or Intimidate tests. |
| Psychic Whisper / `psychic-whisper.md` | Existing | Maneuver; ranged 10 ally understanding a language; one-way message of up to 10 spoken seconds. |
| Put Your Back Into It! / `put-your-back-into-it.md` | Modifier | Montage assist tier 1 imposes no bane; once per montage improve ally tier 1 to tier 2. |
| Ritualist / `ritualist.md` | Activity gap | 1 uninterrupted minute blessing self/touched willing creature; double edge on next test within next minute, excluding activities longer than 1 minute. |
| Slipped Lead / `slipped-lead.md` | Activity gap + modifier | 1 uninterrupted minute escapes mundane bonds without test; escape remains unobvious until revealed. Also edge on bond-escape tests. |
| So Tell Me... / `so-tell-me.md` | Activity gap | After successful Presence influence test, ask one influenced creature a follow-up question; truthful response with Director safety exception. |
| Specialist / `specialist.md` | Build/modifier | Chosen owned lore skill gives recall double edge and conditional negotiation Renown +1/+2. Target choice exists. |
| Spot the Tell / `spot-the-tell.md` | Modifier | Tier 3 reading-person test grants future edge to read that same person. |
| Team Leader / `team-leader.md` | Modifier | At start of group/montage test spend hero token; participants use your exploration skills for tests. |
| Teamwork / `teamwork.md` | Modifier | First montage turn permits own test and assisting another. |
| Thingspeaker / `thingspeaker.md` | Activity gap | Hold object for 1 uninterrupted minute; Director determines resonance; learn emotion and one of three facts. Optional extra question causes Intuition/Presence bane until respite and prevents reuse while bane remains. |
| Traveling Artisan / `traveling-artisan.md` | Activity gap | On non-respite day spend 1 uninterrupted hour on crafting project using owned crafting skill; gain 1d10 project points. |
| Traveling Sage / `traveling-sage.md` | Activity gap | On non-respite day spend 1 uninterrupted hour on research project using owned lore skill; gain 1d10 project points. |
| Wood Wise / `wood-wise.md` | Modifier | Exploration-skill test with at least one die showing 1: reroll one d10, once per test. |

## Bounded implementation contract

The five combat additions need distinct names, exact timing, source text and grant provenance:
Creature Sense; Friend Catapult; Gum Up the Works; I've Got You!; Familiar: Restore.
Keep the existing three grants and correct their list groups. The source has no separate printed
name for Familiar restoration; the qualified name is an application label, not a claimed quotation.

For the fifteen activity entries use the perk name, qualifying only to distinguish the specific
operation: Area of Expertise: Inspect Object; Eidetic Memory: Memorize Text; Slipped Lead:
Escape Bonds. Familiar: Restore During Respite is a separate alternative because its
cost/timing differ. Include the entire relevant source passage, not a shortened invented rules
block. Where the source assigns a duration or contextual trigger, preserve that as usage information;
where it assigns neither, explicitly leave combat timing unspecified. Do not silently translate
"not specified" into "no action required." Activities belong outside main/maneuver/triggered
combat groupings. Downtime and negotiation automation are still separate work.

For modifiers, source retention is correct for this action-grant pass. Their conditions, optional
payments, rolls and per-use limits are not claimed automated or exhaustively verified here.
For example, a Brawny operation must eventually couple Stamina loss with the existing failed-test
outcome; inventing a free triggered action would change its rules. Dazzler's ordinary performance
and Master of Disguise's existing Hide operation likewise do not need counterfeit ability grants.

## Conditional state and Familiar boundary

Grant membership comes from the selected perk, not a broad career label. Changing/removing the
perk must update saved ability readbacks while preserving the retained perk source where selected
and all unrelated choices/current values. A saved perk source is also necessary to distinguish
multiple future granting decisions.

Familiar restoration has an activation precondition (the familiar has been destroyed). It does
not choose a new permanent ability or a mutually exclusive active grant like a dwarf rune. The
existing ancestry model retains analogous manual activation conditions in `activationCondition`
(for example, Bloodfire Rush requires frightened/slowed/weakened), while rune-specific maneuvers
are actually derived from saved `activeRune`. Do not create a companion actor or a new familiar
combat subsystem just to expose restoration. State explicitly that companion destruction and
restoration remain manually resolved if they are not tracked.

The main-action variant spends **one Recovery without granting healing**. The ordinary recovery
operation also heals and therefore cannot serve as a silent substitute. If resource application
is included, verify one Recovery is persisted as spent, Stamina is unchanged, and zero Recoveries
refuse execution. The respite variant spends no Recovery. If resource effects remain manual, the
shared use record must clearly say so; a logged ability is not evidence of applied Recovery cost
or a restored companion. Do not claim automated availability from untracked familiar state.

Similarly, Friend Catapult's Victory reset and Thingspeaker's lingering bane are activation/usage
conditions. Preserve these in source/use metadata unless their state operations are deliberately
implemented and verified. This audit does not authorize unbounded gameplay automation.

## Current implementation boundary

The new projection catalog is `shared/content/perk-abilities.ts` (`PERK_ABILITIES`,
`PerkAbilitySource`). It holds 24 entries: 3 existing formal abilities, 5 additional combat
abilities, 15 other usable effects, and the alternate Familiar respite restoration.
It changes action exposure, not the 47 selectable perk rules/options. The earlier V37 Forge
comparison remains a supporting-choice reference; this fresh audit did not use Forge as rules
authority or recertify its ability projection.

Lie Detector costs one hero token. Hero-token capability is currently deferred: expose the sourced
entry but refuse execution without the supported token pool. That is an explicit execution blocker,
not a free manual substitute. Familiar destruction remains an explicit manually adjudicated use
precondition; it is distinct from the available, persisted Recovery payment operation.

## Useful verification witnesses

Use the existing authenticated owner/campaign route to save and reload contrasting selected perks,
verify correct action membership/group/source and then replace/remove the perk. Confirm the old
entry disappears from both sheet and resolver; this catches stale grants that evaluator assertions
cannot. A second career with the same perk group catches accidental dependence on a single career
ID. At least one main, maneuver, free-triggered and activity witness distinguishes timing paths;
a passive modifier control catches overgeneration of fabricated abilities. Resource and familiar
state claims require their own persisted before/after proof if implemented. No browser test is
required or permitted under the current moratorium.
