# Trigger opportunities and intervening actions

Question: can Thorn receive collision-triggered Ferocity, spend it on another ability, then use Lines of Force to undo the original push? What does this imply for closing response cards?

Sources: only the local pinned core *Heroes*/*Monsters* Compendium, revision `fb83a789da8f0327a389c277a0c790b1648d5810`; vendor working tree clean. Full relevant entries were read, with Heroes source-order context checked using `git show HEAD:en/books/heroes/clean/Draw Steel Heroes.md`, particularly the ability rules around lines 4111–4364 and triggered actions around 19741–19749. No web research, implementation, vendor edits, or supplemental rules. Latest project instructions and [table policy](../table-spec.md#inline-interaction-cards-in-the-game-log) were read as product context, not source authority.

## Finding

The proposed collision → resource gain → unrelated ability → belated Lines of Force chain is **not supported as ordinary source resolution**. Lines of Force responds when a target **would be** force moved, before that movement produces its collision. The app's accepted apply-then-revise behavior deliberately allows later correction of already-applied movement consequences; that is the source of this hypothetical reconciliation problem.

Treating unrelated later play as moving past the original opportunity is consistent with this reading. However, the corpus does **not** expressly define “using any other ability closes every pending opportunity.” Its stated restriction is using a triggered action when its trigger occurs, and it expressly allows multiple ordered responses to one trigger. A blanket close-all-cards policy would also wrongly terminate source-authorized staged work.

## Source sequence for Lines of Force

[Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md), SCC `mcdm.heroes.v1/rule.dice/ability-roll`, **Abilities With Damage and Effects**, states that tier-determined effects ordinarily occur after the roll's damage has been dealt to all targets. Multiple effects resolve in their printed order. Its own Brutal Slam explanation repeatedly says damage, **then** push.

[Lines of Force](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/lines-of-force.md), SCC `mcdm.heroes.v1/feature.ability.fury.level-1/lines-of-force`, has the trigger “The target would be force moved.” It permits another target to be moved **instead**, changes the movement's source to the Fury, and modifies its type/distance. It does not redirect the original attack's damage or describe undoing completed movement.

[Forced Movement](../../vendor/steel-compendium/en/unified/md/movement/forced-movement.md), SCC `mcdm.heroes.v1/movement/forced-movement`, **Slamming Into Objects**, makes collision damage a consequence of forcing a target into a sufficiently large unbroken stationary object. It is downstream of the attempted movement being redirected. The general entry also makes associated movement precede death effects, showing that source sequencing can explicitly defer a consequence beyond damage.

Together these support the following ordinary sequence, absent a source exception:

1. Resolve the original ability's damage to all targets, including applicable damage responses and modifiers.
2. Apply resulting Stamina/resource changes whose requirements are satisfied.
3. At the impending forced movement, resolve eligible Lines of Force choices and other applicable responses.
4. Resolve the resulting movement and any collision consequences; apply gains caused by those consequences.

Steps 1 and 3 are directly supported by the damage-before-effects rule and Lines of Force wording. Step 2's placement is the natural reading of resources gained when damage is taken or a threshold is reached; the corpus does not provide a formal event-stack specification for every simultaneous passive and response.

[Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md), SCC `mcdm.heroes.v1/feature.fury.level-1/ferocity`, grants 1 on the first damage taken each combat round, and 1d3 on first becoming winded or dying in the encounter. [Winded](../../vendor/steel-compendium/en/unified/md/rule/health/winded.md), SCC `mcdm.heroes.v1/rule.health/winded`, begins at Stamina **equal to or below** half maximum. These are automatic gains, not optional response abilities.

Thus, if only the wall impact first makes Thorn winded, that 1d3 does not yet exist at the original Lines of Force opportunity. If the original hit already caused the round's first damage, its 1-Ferocity grant remains independently justified; reversing collision damage would not invalidate that earlier grant.

The unspecified “another ability” introduces additional missing facts. On an enemy's turn Thorn cannot simply use an ordinary main-action ability: [Taking a Turn](../../vendor/steel-compendium/en/unified/md/rule/combat/turn.md), SCC `mcdm.heroes.v1/rule.combat/turn`, gives those actions on their own turn; an out-of-turn use needs a specific grant. If the intervening ability consumes Thorn's ordinary triggered action, the normal one-per-round limit independently prevents another ordinary Lines of Force. Neither fact establishes a universal closure rule.

## Does another ability expressly close the opportunity?

[Triggered Actions and Free Triggered Actions](../../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md), SCC `mcdm.heroes.v1/rule.combat/triggered-action`, says an ordinary triggered action can be used once per round, on anyone's turn, **“but only when the action's trigger occurs.”** The [Classes chapter](../../vendor/steel-compendium/en/unified/md/chapter/classes.md), SCC `mcdm.heroes.v1/chapter/classes`, **Trigger**, repeats that an ability is usable only when its specific triggering event occurs.

Neither passage states an “another ability” expiry event or a grace period lasting the rest of the turn. Nor do these rules uniformly say “immediately” or prescribe a timer, declaration queue, or formal interrupt stack. The stronger reading is event-local resolution: Lines of Force belongs at the impending movement, not after deciding unrelated later play. The source does not license banking that trigger.

This does not mean one response must finish without any other sourced operation occurring. The same general rule explicitly lets player-controlled creatures choose the order of multiple triggered/free-triggered actions responding to the same trigger, then lets the Director order their creatures' responses. Resolving the first response cannot universally invalidate all others merely because an ability occurred. A response can still change facts that matter to another response; the text does not settle every changed-target/revalidation case.

## Original attack damage can fund the response

Recommended source reading: **yes**, Ferocity legally gained from the original hit before its forced movement can fund Lines of Force's optional **Spend 1 Ferocity** enhancement. The baseline costs no Ferocity; the spend increases the movement bonus from Might to twice Might. **Spend Heroic Resource** in the Classes chapter requires the resource to activate the additional effect, without saying it must have existed before the triggering enemy ability began. [Heroic Abilities](../../vendor/steel-compendium/en/unified/md/rule/general/heroic-ability.md), SCC `mcdm.heroes.v1/rule.general/heroic-ability`, distinguishes optional enhancement spending from a mandatory activation cost.

Concrete core lead: [Rival Fury](../../vendor/steel-compendium/en/unified/md/monster/rival/1st-echelon/statblock/rival-fury.md), SCC `mcdm.monsters.v1/monster.rival.1st-echelon.statblock/rival-fury`, has Brutal Impact, damage followed by push at every tier. Assume its tier-one 7 damage actually reaches Thorn, first makes Thorn winded this encounter, and is Thorn's first damage this round; Thorn begins at 0 Ferocity, rolls 2 on the winded d3, survives and remains able to use an unspent triggered action. After all original targets' damage resolves, Thorn has 3 Ferocity. Thorn can spend 1 on Lines of Force at the forthcoming push, retaining 2. With Might 2 the bonus is 4 rather than 2. Assume a legal replacement target and all other targeting requirements are met.

Redirecting that push does not undo Brutal Impact's 7 damage, the winded threshold crossing it caused, or these gains. This is not borrowing resource from the collision being prevented.

Damage-reducing responses need their own treatment. [Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md), SCC `mcdm.heroes.v1/rule.damage/damage-immunity`, explicitly applies a triggered halving before immunity and gives an example where actual damage becomes 0. One cannot automatically treat a provisional full-damage value as an irreversible damage/resource event. A response funded by the very damage it prevents raises a different same-event ordering question; this brief does not claim a universal self-funding rule from the simpler damage-before-movement example.

## Real continuations that a blanket closure would break

- **Several responses to one event:** the general ordering rule expressly allows this. For example, a Shadow's [In All This Confusion](../../vendor/steel-compendium/en/unified/md/feature/ability/shadow/level-1/in-all-this-confusion.md), SCC `mcdm.heroes.v1/feature.ability.shadow.level-1/in-all-this-confusion`, and an eligible allied Tactician's [Parry](../../vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-1/parry.md), SCC `mcdm.heroes.v1/feature.ability.tactician.level-1/parry`, can respond to damage to that Shadow. This does not imply quarter damage: the Classes chapter's stacking rule makes repeated halving apply only once. The responses have other movement/potency effects.
- **One response has later work:** In All This Confusion halves damage, then permits teleportation **after the triggering effect resolves**. That later teleport is a continuation already granted by the response, not an expired unchosen reaction.
- **A reaction grants a free reaction:** [Metakinetic Mastery](../../vendor/steel-compendium/en/unified/md/feature/null/level-1/metakinetic-mastery.md), SCC `mcdm.heroes.v1/feature.null.level-1/metakinetic-mastery`, permits Knockback as a free triggered action after using Inertial Shield. The general free-trigger rule preserves this despite spending the ordinary triggered action. It supplies a specific chain, not permission for arbitrary intervening abilities.
- **An ability expressly permits intervening actions:** [Double Strike](../../vendor/steel-compendium/en/unified/md/feature/ability/dual-wielder/double-strike.md), SCC `mcdm.heroes.v1/feature.ability.dual-wielder/double-strike`, permits resolving one target on the user's turn, using that turn's maneuver and move action, then resolving its second target with the same roll. A maneuver ability can legally intervene. This is a staged ability continuation, not evidence that an unrelated Lines of Force opportunity survives.

## Product boundary and unresolved details

The accepted [Lines of Force adaptation](../table-spec.md#inline-interaction-cards-in-the-game-log) applies the original outcome, then revises effective movement and reverses invalidated collision consequences. The next-individual-turn-start prompt boundary is an app convention; it is not source permission to postpone every trigger until then. The same spec preserves invalidation and source-specific ordering, while leaving intervening choices and spent grants unresolved.

Original recommendation, retained separately from the subsequent decision below: a **trigger-specific** rule closing an unchosen old Lines of Force opportunity when that character commits an unrelated new ability is consistent with the event-local reading and can reduce this adaptation's reconciliation problem. This is a proposed product rule, not an express rulebook sentence or a close-all policy. Scope it to the responding character and its prior optional trigger, regardless of which authorized user submits the character's command; other actors' responses and unrelated card kinds retain their own rules. Mere preparation or a failed activation should not count as committing later play. Preserve ordered responses, newly triggered opportunities, and explicitly granted continuations. Distinguish such a choice from the source's earlier pre-movement timing.

Remaining source uncertainty is limited to fine sequencing among simultaneous passives/response choices, revalidation after another response changes trigger facts, and unusual same-event self-funding cases. Those uncertainties do not support the original wall-impact-and-later-ability chain as ordinary source behavior.

## Subsequent product decision

On 2026-09-13, the early-close recommendation was accepted: committing an unrelated new ability passes
that character's earlier unused optional trigger opportunity, with preparation/refused activation and
response-chain/continuation distinctions retained. The next individual turn start remains the outer
deadline. Precise resource-grant timing and its use by all applicable logic was also confirmed as a
primary player-value requirement. The [table contract](../table-spec.md#inline-interaction-cards-in-the-game-log)
owns effective policy; this decision does not turn the early-close convention into quoted source law.

Later user clarification, 2026-09-13: the actor-only scope above was too narrow. Thorn taking another
action or spending resources from a hit closes that hit's response window, including an ally's Parry
prompt. Preserve responses to unrelated events and authorized response chains. The user identifies
this as prior precedent, not a new dependency-repair rule. See the [Parry follow-up](ally-response-after-resource-spend.md).
