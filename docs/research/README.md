# Combat feasibility research

Later research: [monster import audit](monster-import-audit.md) inventories all 527 stat-block files and examines field/feature extraction. The accompanying [monster catalog specification](../monster-catalog-spec.md) proposes storage and import contracts. That work is research/specification only, not a delivered catalog importer.

Initial investigation, 2026-09-10, against Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`. Three parallel agent studies examined monster language, hero language, and reusable content storage. This is source analysis: no parser, engine, character, or battle simulation has been implemented, and no execution success rate is established.

## Findings and evidence

| Track | Scope | Result |
| --- | --- | --- |
| [Monster abilities](monster-parser-sample.md) | 20 stat blocks from a reproducible, deliberately diverse stratified sample; 18 creature groups, six organizations, eight roles, actual levels 1–9. | Recurring grammar supports a shared-parser experiment. Every sampled block also has relevant mechanics beyond numerical tiers. Sample excludes some categories and does not establish corpus-wide prevalence. |
| [Hero abilities](hero-parser-sample.md) | 18 deliberately selected abilities across six core classes, at verified grant levels 1, 3, and 6. | Similar ability structure to monsters, with characteristic expressions and class context. Triggered rules, persistence, choices, and target relationships need runtime support. Selection was for contrast, not random prevalence. |
| [Content storage](content-storage-options.md) | Actual class, feature, ability, monster, and item records; Markdown, JSON, identity, sourcebook context, and Convex capabilities. | Existing JSON saves extraction work but is not executable rules. Test a small portable derived content package; decide later whether an app-facing Convex catalog mirror is useful. |

Exact selections and source evidence are preserved in the [monster manifest](monster-sample.json) and [hero manifest](hero-sample.json). The main README links to these reports; no separate rule ledger is needed.

## Working hypothesis

Test separate source adapters for monster blocks and hero entries feeding a common ability representation and rules interpreter. The samples do not suggest that a different parser is needed merely because the actor is a hero or a monster. They also do not show that every mechanic fits a small set of text substitutions.

Shared candidates include target selection, numeric expressions, damage, movement, potency, conditions, costs, durations, and effect ordering. More complex cases require reactions, temporary changes to other rules, per-turn or per-encounter memory, linked entities, and facts about position. Whether generic constructs or explicit extensions are cheaper for the hardest cases remains unproven.

## Consequences for the proposed architecture

- **Keep complete source text.** Magma Titan's benefits and Stasis Field's enemy-only roll restriction are absent from extracted `effects` arrays but present in Markdown and JSON full-body content. A compiler consuming only those arrays would miss real mechanics.
- **Support state beyond independent creature counters.** Minion squads share Stamina and have special action rules. Entity relationships, squad state, and actor-specific conditions must fit the eventual state model.
- **Resolution may require more than one exchange.** A trigger can alter pending damage; movement can establish which targets are eligible for a later effect. The engine needs an explicit way to request choices or missing facts before dependent work resolves.
- **Distinguish roll purposes.** Some monster tier tables are tests made by each target. Three tier rows alone do not establish who rolls or how targets share results.
- **Separate history from computation.** The user's recorded-input/output/state model remains compatible with these findings. It must retain enough state to restore relationships, pending choices, and ongoing effects as well as visible counters. History navigation must not call modifiers.

These are requirements exposed by sample mechanics, not a settled engine language, storage schema, or proof that the architecture already executes them correctly.

## Suggested first executable experiment

Start with a small, explicitly scoped set of combat operations. Use a source-grounded level-1 devil Fury fixture without building a character wizard; document the chosen kit, ancestry traits, class resources, and passives that affect those operations. Deferred character creation does not remove the need for correct combat values.

1. Load the hero and a Goblin Warrior. Resolve an ordinary supported action with supplied dice and explicit target/spatial facts. Verify the expected effects and actual stored sheet changes.
2. Add Fury Brutal Slam and the relevant forced-movement behavior, including a missing-fact case. A later effect must not assume a movement endpoint the table has not supplied.
3. Add a Spinecleaver squad to exercise pooled Stamina and squad behavior, then a selected cost/condition or triggered-action case. Describe the supported slice precisely rather than marking entire creatures supported.
4. Navigate backward and forward through the recorded states. Verify restoration without calling the parser, rules engine, or dice roller again.
5. Try previously unimplemented abilities and controlled homebrew variations through the same parser before adding per-ability fixes. Record what works, what is explicitly unsupported, and what is wrong.

The precise first fixture and implementation technology remain to be selected. The point of the experiment is to test grammar generalization and application/history behavior together. A successful battle with hand-coded named abilities would not establish parser feasibility.

## Peripheral systems: keep the decision open

A brief source check supports deferring dedicated noncombat implementation without assuming those systems are wholly disconnected:

- [Project rolls](../../vendor/steel-compendium/en/unified/md/rule/downtime/project-roll.md) reuse tests but accumulate numerical progress rather than tier outcomes, with specific edge/bane and breakthrough rules.
- [Montage tests](../../vendor/steel-compendium/en/unified/md/rule/test/montage-test.md) coordinate individual tests and other choices, track group outcomes, and can award Victories. Director judgments are inputs to the procedure.
- [Negotiations](../../vendor/steel-compendium/en/unified/md/chapter/negotiation.md) track interest, patience, motivations, and pitfalls, with tests and Director adjudication. Narrative argument evaluation cannot be silently reduced to fixed arithmetic.

These suggest reusable low-level rolls/state/history with distinct subsystem procedures, rather than a decision now to implement one all-purpose combat resolver or several independent engines. Combat remains the first target. Some combat effects create later consequences; record those explicitly even when their future resolution is outside the initial slice.
