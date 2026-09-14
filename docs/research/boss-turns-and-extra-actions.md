# Boss turns and extra actions

Research date: 2026-09-13. Source: pinned local Steel Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`. No online rules sources or upstream modifications.

The user asked to check boss rules before confirming a proposed single monster entry with a
0/2 → 1/2 → 2/2 turn counter and ordinary Take turn controls. **That presentation remains proposed.**
Research supports a source-derived full-turn counter, with the distinctions and scheduling issues below.
It does not establish complete monster automation or expand the prototype fixture.

## Findings

| Mechanic | Source evidence | Consequence for the proposal |
| --- | --- | --- |
| Multiple full turns | The [Thorn Dragon](../../vendor/steel-compendium/en/unified/md/monster/dragon/statblock/thorn-dragon.md), SCC `mcdm.monsters.v1/monster.dragon.statblock/thorn-dragon`, has Solo Turns: two nonconsecutive turns each round. Its End Effect trait is available at the end of each turn. | One creature identity and health/effects record can have multiple genuine turn instances. Each instance gets its own start/end effects. Other per-round limits do not reset just because its next turn starts. |
| Three-turn exception | [Ajax](../../vendor/steel-compendium/en/unified/md/monster/ajax-the-invincible/statblock/ajax-the-invincible.md), SCC `mcdm.monsters.v1/monster.ajax-the-invincible.statblock/ajax-the-invincible`, can take up to three nonconsecutive turns per round. | Do not hard-code two turns for every solo, or treat the generic Solo classification as the entire rules contract. Use 0/3 etc. where the source supports it. |
| Additional main action | [Thorn Dragon Malice](../../vendor/steel-compendium/en/unified/md/monster/dragon/thorn-dragon-malice.md), SCC `mcdm.monsters.v1/monster.dragon/thorn-dragon-malice`, offers Solo Action for 5 Malice, chosen through its start-of-turn Malice feature list. It grants an additional main action on that turn, including while dazed. The [lich](../../vendor/steel-compendium/en/unified/md/monster/lich/lich-malice.md) has the same relevant feature. | This increases that turn's available main actions. It does not spend or grant a full turn, refresh movement/maneuvers, create a turn boundary, or satisfy the nonconsecutive-turn requirement. Preserve its actual choice/payment timing and exception to dazed. |
| Villain actions | [Villain Actions](../../vendor/steel-compendium/en/unified/md/rule/monster/villain-action.md), SCC `mcdm.monsters.v1/rule.monster/villain-action`, allows one at the end of any other creature's turn. Each named villain action is once per encounter; no more than one villain action may be used per round, even with multiple such creatures. Printed numbering is recommended order, not a required sequence. | Track the individual encounter use and the shared round allowance separately from full turns and ordinary triggered actions. The existing end-turn response-card pattern is a suitable proposed surface. The action creates no extra full turn unless its own source explicitly does so. |
| Extra triggered-action capacity | Ajax's trait allows three triggered actions per round while he is not dazed. [Ajax's Malice](../../vendor/steel-compendium/en/unified/md/monster/ajax-the-invincible/ajaxs-malice.md), SCC `mcdm.monsters.v1/monster.ajax-the-invincible/ajaxs-malice`, includes Reason: on a successful opposed test he can choose another triggered action that round instead of bonus damage. | A turn counter cannot represent every action allowance. Triggered-action capacity is independently source-derived and can change during a round. |
| Leaders need not have solo turns | The [Wode Elf Warleader](../../vendor/steel-compendium/en/unified/md/monster/elf-wode/statblock/wode-elf-warleader.md), SCC `mcdm.monsters.v1/monster.elf-wode.statblock/wode-elf-warleader`, has villain actions and grants allies free strikes, but no Solo Turns trait. Wode Sickness makes an enemy who has not acted take their turn immediately. | Do not assign two full turns just because a creature is a boss/leader. A granted attack is not a turn. An ability that advances an unspent creature's turn must preserve that turn's identity and round use, rather than automatically granting a bonus turn. |

A text scan of core `mcdm.monsters.v1` stat blocks marked `organization: Solo` found **22**:
21 with the standard two nonconsecutive turns, and Ajax with the three-turn exception. This is a
bounded check of printed turn traits, not an exhaustive proof of every feature's interaction.
Supplemental and playable-retainer content were excluded from this scan.

[Critical Hit](../../vendor/steel-compendium/en/unified/md/rule/combat/critical-hit.md) is another route
to an additional main action, including an eligible action off-turn; it still does not create a full
turn. More actions also do not waive unrelated restrictions: the
[Creatures Who Defend rule](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#creatures-who-defend)
restricts combining Defend with additional main actions unless specifically granted Defend.

## Initial scheduling analysis (historical; see current status below)

The one-entry and repeated group-activation proposals below record the earlier investigation. The
subsequent turn-entry model supersedes them; they are not pending implementation choices. Source
constraints and explicitly unresolved boundary cases still apply.

1. **The number 2 is not universal.** Keep the proposed one-entry display, but derive allowed turns
   from the actual source. A full turn is distinct from extra main actions, free strikes, triggered
   actions and villain actions.
2. **Ordinary group completion cannot seal a solo after its first turn.** A solo needs a later
   activation in the same round after an intervening creature turn. Holding its group continuously
   active and immediately running all its turns would conflict with nonconsecutive Solo Turns.
   This is a source entitlement, unlike regrouping an ordinary unacted monster into a finished group,
   which remains governed by the accepted no-reopening rule. Exact integration for deliberately mixed
   solo/ordinary groups remains a product question; no such grouping restriction is inferred here.
3. **Early turn ending uses the existing operation.** The initial research raised declining remaining
   capacity as a separate UI question. The user subsequently rejected a boss-specific skip/forgo control:
   participants can already End turn at any time. Use ordinary actual turns and their normal boundaries;
   do not treat that answer as permission to erase future turns without events. Cases with no legal
   intervening turn remain source/sequence review rather than an approved new control.
4. **Round and turn allowances need their own timing.** At a last-turn/round transition, attribute a
   villain-action opportunity and its shared allowance to the appropriate source boundary. The app's
   existing delayed response window must not grant duplicate uses by confusing the completed turn's
   round with newly advanced bookkeeping. The source does not define the app's delayed window;
   source-stage bookkeeping and a concrete boundary test are still needed.
5. **Source-forced immediate turns are a separate sequence case.** Wode Sickness establishes a real
   ordinary turn at a source-directed time. Subsequent user ruling confirms that this turn consumes
   the target's normal round turn and then returns play to the interrupted group's remaining members.
   This is an app sequencing decision, separate from the source finding. The related captain-only
   [Do Not Hesitate in the Wode](../../vendor/steel-compendium/en/unified/md/monster/elf-wode/statblock/wode-elf-guerrilla.md)
   also warrants its own squad/turn walkthrough rather than inventing behavior from the generic counter.

## Initial recommendation (superseded by turn entries)

Keep one live creature entry with a source-derived full-turn count and normal Take turn/End turn
operations for each actual turn. Track extra actions, triggered capacity and villain uses separately,
using existing action controls and contextual log cards. Preserve nonconsecutive scheduling and genuine
turn boundaries. Do not label all bosses as two-turn creatures or mark a solo finished merely because
its first ordinary activation ended. Review remaining group scheduling before calling the full combat flow complete. The user's later
clarification rejects a separate optional-turn skip control in favor of existing End turn behavior.

Proposed acceptance examples, not executed tests:

- Thorn Dragon takes its first turn, buys Solo Action for 5 Malice and performs the extra main action:
  full-turn use remains one, with no extra turn-start/end event from the purchase or extra action.
- After an intervening creature turn, the dragon's second full turn produces its own clock events.
- Ajax supports a third legal full turn and keeps his separate triggered allowance intact across turns.
- A villain action after another creature's turn changes its own use record and the shared villain
  allowance without incrementing the boss's full-turn count. A second boss does not gain another
  same-round villain allowance.
- Undo/redo restores the actual action/turn/allowance changes and does not refresh unrelated limits.

## Follow-up presentation direction

The user subsequently suggested a small manifest at the top of a turn showing the participant's
turns, actions and related allowances. A turn-start log-card summary fits the research: distinguish
full-turn capacity, current-turn main/maneuver/move allowances, optional start-turn purchases, and
separate triggered/villain limits. Show only applicable information and known spending. This is a
proposed presentation, not yet confirmed, and does not resolve the scheduling questions above.

## Follow-up: multiple turns outside Solo stat blocks

The user requested a breakdown of the mixed-group proposal and a count of non-boss examples.
Checked the same pinned core monster corpus, including family Malice features, with searches for
multiple/full/immediate turns and acting again. This extends the earlier Solo-only scan; that scan
was never evidence that only solos can receive multiple turns.

- **Five Elite draconians** (Aeolyxria, Locratix, Lydixavus, Myxovidan and Phrrygalax) can use
  [Draconian Malice](../../vendor/steel-compendium/en/unified/md/monster/draconian/draconian-malice.md),
  SCC `mcdm.monsters.v1/monster.draconian/draconian-malice`. Scaleshatter Burst costs 7 Malice,
  grants two turns per round until encounter end and imposes damage weakness 5. This is an acquired
  allowance, not their default. The family text permits activation at the start of any draconian's
  turn. The sixth draconian, **Dorzinuuth**, is a Leader and is also eligible. The feature does not
  repeat Solo Turns' nonconsecutive restriction; do not silently inherit it from Solo classification.
- **War Dog Breaker**, an Elite, has
  [Breaking Point](../../vendor/steel-compendium/en/unified/md/monster/war-dog/3rd-echelon/statblock/war-dog-breaker.md),
  SCC `mcdm.monsters.v1/monster.war-dog.3rd-echelon.statblock/war-dog-breaker`.
  When it would reach 0 Stamina it first takes an immediate turn even if it already acted this round,
  then reaches 0 at that turn's end. This is a conditional final turn, not recurring two-turn capacity.

Count under this explicit scope: **six Elite stat blocks** with a direct personal/family route to
multiple turns, or **seven non-Solo stat blocks** if the Leader Dorzinuuth is included. None of these
has an unconditional printed Solo Turns-style baseline. Here “non-boss” excludes Leaders and Solos;
this counting convention is not a new app classification or a claim that an Elite cannot be used as
an encounter boss.

This is not a count of every monster that could receive an extra turn from another creature. The
captain-only Wode Elf Guerrilla ability above targets allies broadly and requires separate interpretation
of its multi-target timing. Wode Sickness advances an unspent normal turn; it alone does not supply a
second turn. Extra main actions and free strikes are also excluded from the count. The general Instant
Solo Creature adaptation in monster-basics is not an additional printed non-Solo stat block.

Current product status: the earlier repeated mixed-group activation proposal is superseded by
[actor-linked turn entries](../table-spec.md#initiative-groups-confirmed-app-model). Known recurring
capacity and actual grants use distinct entries sharing one creature. Regrouping moves only the selected
entry and does not refresh it. Immediate turns may interrupt an unfinished turn, then resume it without
resetting spending or replaying boundaries. End turn remains the ordinary early-finish control.
The [boss/captain review](boss-and-captain-turn-review.md) identifies the remaining source questions,
including immediate grants to multiple allies. Personal extra captain turns are confirmed captain-only and do not refresh squad participation.
