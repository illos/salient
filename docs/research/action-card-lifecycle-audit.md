# V1 action-card lifecycle research

Research date: 2026-09-26. **Research, not an approved manifest or implementation contract.**

## Question

Can one small, shared manifest describe when an action card exists, when it offers a choice, who can answer, how often it can be used, and when it has no further possible use?

The user explicitly separates this from tracking an effect and its duration. This audit preserves that distinction. An effect can be an external prerequisite for a card; its damage, stacking, duration and cleanup remain the effect engine's responsibility.

## Scope and method

The owning character specification includes all eleven classes through levels 1–10, including the Beastheart and Summoner dependencies. The selected encounter roster contains 36 monsters. Earlier low-level implementation milestones do not exclude higher-level character source material from this research.

The audit includes all files under `feature/`: class abilities and features, ancestry traits, complications, perks, kits, careers, cultures, common actions, companion features and fixtures. It also reads the chosen monster statblocks, their Malice sheets and shared rules; granted Summoner minion/fixture sources; core item mechanics; and the condition, resource and movement rules that create or restrict actions. Class and ancestry parent records are checked for embedded grants. Titles are recorded separately as supporting reference coverage: finding an action in a title does not establish that the application grants it in V1.

Only the pinned Steel Compendium is rules evidence: revision `fb83a789da8f0327a389c277a0c790b1648d5810`, canonical `vendor/steel-compendium/en/unified/md`. Every ledger row names its source. Supplements outside the authorized character dependencies, unrelated monster rosters, and dynamic terrain statblocks are outside this selected playable content audit. Automatic effects are included in the review but explicitly distinguished from player choices. Lack of automation is not a reason to omit an otherwise in-scope ability.

Four delegated audits read the hero/supporting sources, and the parent audit reads the selected monsters, starting item actions and common lifecycle rules. Whole-file reading is followed by clause extraction and a source inventory reconciliation. An enumerated filename or keyword hit alone does not count as semantic review. Duplicate parent references do not count as additional abilities.

Coverage totals and final reconciliation will be inserted when every assigned review is complete. The searchable evidence document retains all source dispositions, individual clauses, exceptions and unresolved facts.

## Distinctions that the sources require

1. **Capability:** the continuing permission to use an action when its requirements hold. A signature ability does not disappear because the current turn's action was spent.
2. **Opportunity:** a particular chance to exercise that permission, tied to an event, turn boundary, phase or condition. Passing today's opportunity need not remove tomorrow's.
3. **Accepted work:** choices or steps still needed to finish a use that has already been accepted. A child strike granted by a selected action must not vanish merely because the parent action was committed.
4. **History:** the record of what happened. Retiring an actionable opportunity does not delete its result or imply the underlying effect ended.

These are conceptual distinctions, not four mandated database tables or four required visual cards. A single visible card can display several current choices and return when another opportunity opens.

Temporary ineligibility also differs from retirement. Insufficient Malice, a spent round allowance, being dazed, losing line of effect, or temporarily having no grabbed target can change later. Retirement requires a terminal fact for the particular instance: consumed one-time use, expired grant, completed chain, discarded item instance, or ended governing context, as specified by its source.

## Candidate models and counterexamples

| Candidate | What it covers | Counterexample | Finding |
|---|---|---|---|
| Available now plus one expiry | Simple one-use offers | The Commander's Watching opens at each ally turn start while its eligibility remains | Insufficient |
| Lifetime plus repeated trigger | Recurring event offers | Dagger Storm grants up to three attacks, with movement before or after each | Missing ordered child steps and shared spend |
| Lifetime, trigger and one use counter | Repetition with one cap | Villain actions have a per-action encounter cap and a global cross-villain round cap | Missing multiple scoped budgets |
| Add scoped budgets but close every card on next action | Ordinary response dismissal | The accepted Dagger Storm's later attacks; a critical-hit granted main action; source-ordered pre-strike actions | The cutoff must distinguish unused optional responses from accepted continuations |
| Small composition of opportunities, shared limits and ordered steps, referring to external facts | The structural families described below | Source ambiguities and missing external facts remain explicit | Plausible shared model; semantic coverage must remain inspectable rather than hidden in arbitrary callbacks |

A field named “custom logic” that runs bespoke lifecycle code for every card would not demonstrate a simple unified system. The useful test is whether the same small set of operations describes all rows, with individual cards supplying source-specific bindings and values.

## Structural families to account for

| Family | Lifecycle behavior | Concrete source example |
|---|---|---|
| Reusable action | Present when permission, actor, action allowance, targets and payment are valid | Bugbear Throw needs a held target; losing the grab temporarily disables it |
| Event response | Open a distinct occurrence for a qualifying event; accept, pass or expire that occurrence | Goblin Monarch Meat Shield; Blue Color Cloak |
| Repeating boundary choice | Reopen at each specified boundary while its external grant remains valid | The Commander's Watching; monster End Effect |
| Action continuation | Offer or require a child action in the source's before/during/after order | Human Raider's pre-Charge free strike; Bugbear You Next! |
| Finite sequence | Share a remaining-use budget among ordered steps, each with local choices | Dagger Storm's three attacks and movement; Advance!'s two Zweihander attacks |
| Shared exclusive allowance | Several cards compete for one allowance, potentially across actors | Villain action once per round across villains; Moonfall move-or-maneuver; Ride once per mount per round |
| Temporary granted control | Remain usable while a separate relation, form, object or effect permits it | Divine Vine release; grabbed-creature reposition/release; Javelin pull while its bleeding persists |
| Armed future use and cooldown | Wait for a qualifying later event; observe consumption and subsequent re-enablement | Yellow Color Cloak starts its weakness interval only after its extra damage is dealt |
| Required resolution | Collect missing input without treating it as an optional benefit that can silently lapse | Virulent Breath's target tests; threshold Accursed Rage's compelled movement/strike |
| Noncombat activity | Bind to a test, respite, narrative interval or Director-confirmed circumstance | Project breakthrough extra roll; test retry after circumstances change |
| No new card | Resolve automatically, or alter another action's permission | Arise, Shoot the Hostage, Bonetrops, damage auras, most next-strike modifiers |

Source references for these examples are in the selected-monster, item and core-rule ledger. Every family can combine with actor selection, external predicates, optional costs, finite or replenishing limits and source-specific termination. Families are explanatory groupings, not a proposed enum or one adapter per family.

## What a small manifest would need to express

These are research requirements, not field names or a schema:

- **Which action or choice, and for whom:** operation binding, acting creature, controlling responder and the originating grant. The actor receiving a benefit may differ from the actor who created it.
- **Which instance:** encounter, grant, event occurrence, target, item, relationship or accepted sequence identity. Multiple copies must not collapse into one opportunity accidentally.
- **When an opportunity opens:** a clock boundary, event, sequence phase or currently satisfied predicate. A form or attachment may grant continuously available controls between events.
- **What makes accepting legal now:** current prerequisites and any snapshot explicitly taken at the triggering event. Unknown spatial/narrative facts remain unknown/manual.
- **What accepting consumes:** any combination of per-occurrence, per-target, per-actor, shared-party, round, encounter, respite or lifetime limits. Replenishable resource balance alone is not a terminal lifetime budget.
- **When this opportunity closes:** acceptance, decline, its source phase ending, the confirmed next-action response cutoff, or a terminal dependency. Required work and ordered continuations have their own completion rules.
- **What can happen next:** reopen on a future qualifying event, advance a finite sequence, grant an action to another responder, or remain disabled until an external reset.
- **When the instance retires:** a terminal condition that proves no more opportunities remain for that instance. History remains readable; the general ability may still exist.

Effect lifetime is referenced as a dependency only where the rule actually grants a control during it. The manifest does not calculate damage, simulate movement, implement a save, own an effect's expiry, decide whether a creature died, or duplicate the game clock.

## Worked examples

### Meat Shield: a short opportunity

A strike targets the Goblin Monarch. Resolve it under the established low-interruption product policy and present the Director with the optional redirection opportunity. Accepting revises that linked result through the supported operation. The next unrelated committed action closes the unused opportunity, even in the same turn. A qualifying later strike can create a new opportunity when the ordinary triggered-action allowance and other requirements permit it.

**What ends:** that occurrence's opportunity. **What does not end:** the Monarch's Meat Shield capability. Source: `monster/goblin/statblock/goblin-monarch.md`, Meat Shield; product policy: `docs/table-spec.md`, standing action-card/prompt window and 2026-09-25 refinement.

### The Commander's Watching: repeated opportunities

An eligible ally starts a turn with a condition and line of effect to the commander. Offer ending one condition. Choosing one consumes this occurrence; ignoring it does not remove the trait. At the next qualifying ally turn start, another opportunity can open. If the ally currently has no condition, there is no useful choice to present. Lost line of effect is an eligibility fact, not proof that the capability can never be used again.

**Effect ownership:** none of the condition durations move into this manifest. It asks the existing condition system which choices are legal. Source: `monster/bugbear/statblock/bugbear-commander.md`, The Commander's Watching. The precise presentation cutoff follows the product policy only after classifying this as an optional event response; it must not be mistaken for printed source wording.

### Dagger Storm: one grant with several steps

The Scoundrel accepts Dagger Storm and pays its cost. That creates a sequence with up to three Rapier and Dagger uses. Each step allows the printed movement before or after the attack. Completing the first attack reduces the shared remaining count; it must not discard the second and third attacks as unused old reactions. Finish when the actor stops, the count is exhausted, or a valid terminal condition prevents the accepted work.

**Card presentation:** this can remain one card with the next legal controls. It does not require three interruptions. Source: `monster/human/statblock/human-scoundrel.md`, Dagger Storm.

### Yellow Color Cloak: timing begins after later consumption

A qualifying lightning event opens the cloak response. Accepting arms the printed bonus for a later damaging ability. That later bonus consumption starts weakness through the end of the next round. The cloak cannot use its response during the weakness interval. The initial response is already resolved; the effect system owns armed bonus and weakness, and the capability observes them.

**Unresolved source detail:** repeated acceptance while a bonus is armed but weakness has not begun must not be silently invented. Source: `treasure/1st-echelon/trinket/color-cloak-yellow.md`.

### Grabbed: a persistent control without recurring prompts

While one creature holds another, “release” is available without an action and “reposition” can be used as a maneuver. Ending that particular grab retires those relationship-specific controls. The actor's ordinary Grab action remains available for future legal attempts. No start-of-turn prompt is needed just to remind someone they are still holding a creature.

Source: `condition/grabbed.md`. This is the distinction between availability and repeatedly demanding attention.

## Cross-cutting cases that defeat broad shortcuts

- **Zero Stamina is not a universal card terminator.** Dying heroes can still act; Dread March defers some deaths until resolution; some effects are created by death. Ask the authoritative actor/grant state about the particular action.
- **“Free” does not imply “any time” or “unlimited.”** Free maneuvers, free triggered actions, granted main actions and no-action controls have different source restrictions.
- **A target disappearing does not always end the whole card.** Some choices may retarget, some occurrences are tied to one target, and some parent grants contain remaining choices for other actors.
- **A consumed allowance does not always end the lifetime.** Round limits reset; party resources can increase; item cooldowns clear. A once-per-encounter named villain use is a different limit.
- **Source death and effect end can themselves open opportunities.** Prickly Situation triggers when dragonsealed ends; disposing of all dependent records before observing the end would lose it.
- **One trigger may offer mutually exclusive alternatives or several independently legal responses.** Shared budgets and source ordering determine which; accepting one must not blanket-close every other response to the same event.
- **An action can include optional input without creating another card.** Damage type, target selection, surge spend and movement distance often belong to its current resolution.
- **A printed duration does not establish a card lifetime.** Full Wolf's encounter modifier, Swamp Gas, save-ended conditions and acid terrain can persist after their activation cards finish.
- **A timer cannot decide narrative facts.** Whether a corpse is eligible, circumstances changed, a wall was reached or a target can hear is external or explicitly supplied.

## Existing implementation compared with this research

This is a read-only code inspection at main `6a3b8cf2`, not an execution result:

- `shared/contracts/clock.ts` already defines combat/round/turn boundaries and scheduled work with retirement. Those are usable event dependencies; clock work is not an action-card manifest.
- `convex/lib/interactions.ts` and the interaction schema support awaiting-input/resolved/closed, continuation arguments, a bound actor and revision checks. That represents a one-answer interaction, not the whole recurring capability life.
- `convex/lib/triggeredActions.ts` and `marks.ts` create event-bound offers. Acceptance rechecks actor, round, target and eligibility. Separate helpers close offers at turn start and close competing next-turn claims.
- **A concrete implementation gap remains:** `closeOffersOnPlay` currently filters to the offer owner or the affected turn-start creature before closing. That is narrower than the user's confirmed any-next-committed-action policy. Updating a spec did not implement the broader cutoff.
- Actionable controls also exist outside `interactions`: active-effect membership/end controls, respite activity controls, encounter setup/closeout and the ability list. A complete later integration must inventory these surfaces rather than migrate only triggered offers.
- Closeout, respite and guided-input cards use application workflow state as their lifetime authority. They can share lifecycle handling, while gameplay rules and administrative permissions remain their own dependencies.

No runtime changes or test-suite runs are part of this discussion document. Later implementation would need source-derived behavioral journeys, including persisted readback, through the normal app workflow.

## Evidence needed before a contract can be approved

The research output should make it possible to challenge the model with a particular source clause. A later contract proposal should show:

1. Every reviewed actionable clause mapped to shared primitives, or explicitly left manual/unresolved; automatic/acquisition-only clauses accounted for without fictional prompts.
2. Multiple limits with different scopes, before/during/after child actions, recurring grants and external retirement dependencies represented without card-specific lifecycle code.
3. Source-derived traces for reopening, declining, spending, expiration, dependency loss, shared-budget competition and accepted continuations.
4. The same trace through UI and shared operations, including stale or duplicate answers, undo/replay and simultaneous responders, once implementation is authorized.

An exhaustive source inventory can establish coverage of this pinned, bounded corpus. It cannot prove that every possible future rule or arbitrary combination of rules is correct. Missing source semantics must remain visible even when a generic mechanism can mechanically represent either interpretation.
