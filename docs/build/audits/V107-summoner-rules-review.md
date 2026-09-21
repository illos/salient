# V107 Summoner level-one rules and implementation review

**PASS — static review of `405dd4d081aeda80c1e4443c3f1e49730aa4ebb7`.** ENGINE, 2026-09-21. This accepts the declared editor/derived/manual-action scope, not automated summon combat. TESTER full and live execution remain separate gates; I ran no tests, generators, backend or browser.

Reviewed the initial authoring at 38cb8e9 and the final repair/generated/proof delta, against the independent V107 source audit, table-spec participation boundary and pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`. No online rules or vendor changes.

## Source and implementation

Four circles, formations and quick commands; six cost-five heroic alternatives; fixed Reason2 and its four assignment arrays; class Stamina15/eight Recoveries; Magic/Strategy plus two intrigue/lore skills; no level-one kit. Spring's two Recoveries apply to the hero. Elite's +3 Stamina/+1 stability applies only to minions. Horde derives cap12 and turn-start4. The 25 portfolio options comprise 13 signature species and 12 cost-three species; each cost-three payment summons two. Hero Reason supplies R-valued minion stability/immunity, while the printed minion characteristics remain separate.

Portfolio choice distinctness is a labelled interpretation of advancement `1,1,3,3`, documented with alternatives in Q-SUMMONER-1. Sacrifice discount ambiguity and the source's Whirlwind distance/Bengrul-name defects remain explicit/manual. No unrelated ruling was imported.

Summoner records retain source text and source-conditioned availability, distinguish hero/minion records, charge fixed Essence through the existing shared API, and expose embedded paid options separately from charge/Recovery/manual effects. Summoner Strike replaces normal free strikes in evaluation and shared runtime action discovery. Ordinary free-strike calls cannot bypass that inventory. No summon actors, pooled squad Stamina, death reactions, automatic income, sacrifice discounts, movement, condition saves or turn integration are claimed. These remain printed manual instructions; persisted records and actual payments are the implemented behavior.

The new sourcebook guard excludes Summoner references from `foes:definitions` and rejects them in `requireStatBlock`, shared by foe and squad loading. This preserves the distinction between readable statblocks and supported ordinary foe actors. The query retains authentication/Director checks and bounded indexed read; the shared loader adds no privilege or write path.

## Authoring finding closure

- Paid Catalyst no longer instructs preservation of the original Stamina. It uses newly summoned replacement wording consistent with the paid source alternative, while all transformation resolution remains manual.
- Horde provenance is now returned alongside the Minions base source. The focused fixture explicitly checks the Horde source path.
- Snapshot checks retain all 438 core statblocks and their exact content/features, and separately verify 25 Summoner entries with permitted costs and source fidelity. The core assertion was not replaced by an aggregate count.
- Misleading “one-minion payment” wording was removed from the cost-three summon records. Outside-combat paid-effect reuse restrictions are explicitly manual in action instructions.

## Independent ledger and proof review

Read `tests/fixtures/v107-summoner-expected.json`, `tests/character-v107-summoner.test.ts`, and `scripts/headless/summoner.ts`. The twelve witnesses cover all circles, formations, quick commands, six heroics and all 25 species. Source citations and concrete expected hero/minion values are stored independently of evaluator imports. The 144 distinct named action expectations include the six cost-five abilities, three cost-one hero options, each portfolio's 1-or-3 summon payment, and five cost-one minion trait activations. Charge choices do not debit Essence again.

The headless cohort creates and admits builds through public routes, then reads sheets and compares characteristics, baseline values, portfolio fields, exact grant sets, costs and source presence. It checks owner refusal and circle-pruning persistence while the prior admitted build remains stable. It invokes every distinct record and reads the event plus actor/target state: manual event/name/effects, exact resource debit, no fabricated target changes or actor changes beyond resource, and refusal at an empty pool. It also covers an outside-combat waiver, unavailable cross-circle action, both ordinary free strikes, absence from foe discovery and attempted generic minion loading. Session cleanup is in `finally` after activation.

This is a meaningful proof design for manual records/payment, not evidence of resolved game effects or manual trigger adjudication. Its execution result is not asserted here. The pure fixture additionally rejects cross-circle selections and unsupported level two.

## Generated and integration delta

Manifest adds 68 Summoner entries (class + 28 features + 14 abilities + 25 statblocks), total 1,629. Support reports retain 23 compiled, 1,483 compatibility and zero compiled-but-unavailable; supplemental class/minion actions explicitly carry the manual boundary. V88 baseline adds the 14 new source envelopes without rewriting old expectations. The source-text core test excludes only the newly admitted supplemental book and preserves existing core comparisons.

Reference-budget accounting preserves 2,614 core and 2,507 foe entries, and separately counts 122 Beastheart plus 104 Summoner references. The existing byte budget remains unchanged. Supplemental reference closure does not enable higher-level choices. Headless wiring adds the Summoner cohort and controlled error-location match without changing other cohorts. Generated freshness and production-budget execution belong to TESTER.

No outstanding static findings within the declared V107 scope.

Reviewed-By: ENGINE (pass, 2026-09-21)
