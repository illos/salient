# Turn-boundary effect ordering

The pinned core Compendium supplies several explicit ordering rules, but no general ordering rule was
located for independent effects due at the same turn or round boundary. It does explicitly give the
Director final say in rules adjudication and give specific exceptions priority over general rules.[^1]
Consequently, an unresolved boundary conflict has a sourced adjudication authority, without a sourced
universal sequence such as damage, then saves, then expiration.

This conclusion concerns core Heroes and Monsters at Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. It does not claim that no clarification exists in any other
edition or publication. The evidence is restricted to the pinned local Compendium.

## Explicit ordering rules and their limits

| Situation | Source rule | Limit |
| --- | --- | --- |
| Multiple effects created by one ability | Resolve those effects in their presented order. Normally, damage reaches all targets before power-roll tier effects resolve.[^2] | This does not assign priority among unrelated effects merely because they share a later clock event. |
| Multiple triggered actions responding to one trigger | Player-controlled creatures choose the order of their responses among themselves, followed by the Director choosing the order for controlled creatures.[^3] | Automatic expiry, a saving throw and an ordinary trait are not all triggered actions. The rule does not define a universal event queue. |
| Specific text conflicts with a general rule | The specific exception wins; the Director has final adjudication authority.[^1] | This is not an instruction to ask the Director to order every routine effect. |
| A save-ends effect | The affected creature saves at the end of each of its turns, rolling d10 with success on 6 or higher before applicable exceptions.[^4] | The general save rule does not say whether every other end-turn operation goes before or after the save. |
| EoT duration | The effect ends at the target's next turn end, or current turn end when imposed during that turn.[^5] | This fixes the boundary, not priority against unrelated work due at that boundary. |

A deterministic software order and a rule-prescribed order are different things. Choosing an arbitrary
registration order would make results repeatable, but would still be an app policy whenever that order
changes the outcome. Likewise, the date when an effect was applied does not establish a printed
first-applied-first-resolved rule.

## A concrete unresolved case

The Human Bandit Chief's **End Effect** trait allows it to take 5 irreducible damage at the end of each
of its turns to remove one effect that can be ended by a saving throw.[^6] A normal save for that effect
is also due at the end of that turn.[^4]

These statements leave a material choice: may the Director see the ordinary save fail and then pay the
5 damage, or must the End Effect decision occur before that save? Neither cited passage specifies a
relative order. The trait does not state that it replaces ordinary saving throws, and its optional cost
must not be spent automatically merely because the clock reached turn end.

This is a real same-creature boundary interaction. It avoids confusing an effect's source creature with
its recipient, or treating every instance of the phrase “end of turn” as the same event. Additional
concrete cases, explicit local sequences and examples that do not establish a general conflict are
collected in the [content case report](turn-boundary-ordering-cases.md).

The [focused Essence of Tides follow-up](essence-of-tides-save-timing.md) recommends a same-turn save
against the stream's newly imposed slowed effect, with moderate confidence. It finds direct core analogues
but no explicit same-boundary clarification, so the general negative finding above remains unchanged.

## Original recommendations and subsequent app decision

The following were research recommendations, not additional source rules:

1. Preserve explicit source sequences and the separate player/Director ordering for same-trigger responses.
2. Resolve independent work automatically when its order cannot affect state, available choices or outcomes.
3. When a material ordering conflict lacks a source answer, represent the unresolved work and obtain a
   Director adjudication through the existing action-card mechanism.
4. Record a chosen order as an adjudication for that case. Do not silently promote it into a rule applying
   to every future turn boundary.

The subsequent app decision selects queue insertion order for work due at one boundary, with save-ends
rolls last, as the initial default. The third recommendation was not selected as a mandatory workflow.
This app default fills the identified source gap and does not change the source findings above; explicit
source sequences and Director adjudication remain. The [table clock specification](../table-spec.md#game-clock-and-scheduled-rules-work)
owns the accepted behavior and remaining continuation details. The accepted automatic-save behavior and the
specific hero-token opportunity lasting until a different participant starts a turn are separate app
contracts; they do not settle the Bandit Chief's trait or every other optional end-turn choice.

## Evidence and limitations

The [general-rule report](turn-boundary-ordering-general.md) covers rule definitions and sourcebook
context. The [content case report](turn-boundary-ordering-cases.md) tests the general question against
actual core features, abilities and monster traits. Their coverage supports “no general rule located in
this pinned corpus,” rather than an absolute claim of absence or a claim that every pair of effects has
been exhaustively tested.

The research itself establishes no engine implementation or Director-prompt workflow; the subsequent
app ordering decision is identified separately above. Unspecified timing remains distinguishable from unsupported automation and missing table facts.

## Sources

[^1]: MCDM, *Draw Steel: Heroes*, [The Basics — Game of Exceptions](../../vendor/steel-compendium/en/unified/md/chapter/the-basics.md#game-of-exceptions), SCC `mcdm.heroes.v1/chapter/the-basics`.
[^2]: MCDM, *Draw Steel: Heroes*, [Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md), SCC `mcdm.heroes.v1/rule.dice/ability-roll`.
[^3]: MCDM, *Draw Steel: Heroes*, [Triggered Actions and Free Triggered Actions](../../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md), SCC `mcdm.heroes.v1/rule.combat/triggered-action`.
[^4]: MCDM, *Draw Steel: Heroes*, [Saving Throw (Save Ends)](../../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md), SCC `mcdm.heroes.v1/rule.general/saving-throw`.
[^5]: MCDM, *Draw Steel: Heroes*, [End of Next Turn (EoT)](../../vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md), SCC `mcdm.heroes.v1/rule.combat/end-of-turn`.
[^6]: MCDM, *Draw Steel: Monsters*, [Human Bandit Chief — End Effect](../../vendor/steel-compendium/en/unified/md/monster/human/statblock/human-bandit-chief.md), SCC `mcdm.monsters.v1/monster.human.statblock/human-bandit-chief`.
