# V106: Beastheart level one and companion builds

Rules review: required. Depends on: V105.

## Goal

Build the complete level-one Beastheart wizard with its chosen companion and sourced shared action records. Keep creation/derived builds separate from companion combat automation: the existing table specification explicitly defers companion behavior and turn integration.

## Scope

- Four wild natures, three characteristic arrays, twelve chosen abilities, fourteen companions, drake attunement, ordinary kits and companion melee-bonus choice. Shared skills and hero benefits from Bear, Drake and Hellhound; companion maximum Stamina equals the hero's final maximum without adding kit Stamina twice.
- Companion build projection with printed characteristics, size, movement, kit contributions, shared skills, immunity and species features. Companion has zero personal Recoveries. No second hero admission, pooled Stamina or copied ancestry traits.
- Explicit manual action records for both users of shared actions, companion-only actions, species actions and embedded spends. `ability.use` records the named performer and selected target; fixed Ferocity payments use the hero's shared pool. Companion effects, Rampage, Recoveries, surges, conditions, timing and movement remain manual. No companion live actor or separate targeting/initiative integration is claimed. Existing hero kit actions remain supported normally.
- Original printed content stays supplemental and cited. Runtime content admits only Beastheart class/level-one and companion stat blocks; other supplements and later-level grants remain excluded. The reference viewer includes their linked same-book dependencies, including readable later-level rules, without granting wizard support.
- Source authority: `vendor/steel-compendium/en/unified/md/class/beastheart.md`, `feature/beastheart/level-1`, `feature/ability/beastheart/level-1`, and the Beastheart companion stat blocks, level-one features and abilities. Independent inventory in [source audit](audits/V106-beastheart-source-audit.md).

Spec: docs/character-wizard-spec.md#1-product-outcome-and-scope
Spec: docs/table-spec.md#2-participation-and-presence

## Acceptance checks

1. Source-derived fixture covers all fourteen companions, four natures, all arrays and all chosen abilities. Verify shared Stamina, distinct characteristics, zero companion Recoveries, kit choice, shared skills and exact grants; companion changes prune attunement and species actions.
2. Authenticated headless `beastheart` cohort creates/adopts builds and reads persisted sheets. Exercise each new manual action and its named performer, resource debit/refusal/waiver, unchanged target state and durable manual-effect readback. Verify owner refusal and effective/draft separation.
3. TESTER runs generators, full check and isolated cohort; ENGINE reviews sources and proof. Deployment reuses accepted evidence.

## Work log

- Started from main 88e51a2 in `.worktrees/class-beastheart`, branch `slice/V106`.
- Investigation: pinned corpus contains 22 class ability envelopes, 14 species maneuvers, 14 companions and 15 species traits. Companion current Stamina/conditions/turn integration is explicitly deferred by the table spec; this slice does not manufacture a second character to imitate a companion.
- Source labels Animal Handling but links to canonical Handle Animals; resolve by that source identity. Printed companion Free Strike 1+M is shown as a source value and remains manual; no inference about a player companion using the Director-only free-strike route.

- Authoring checks: both TypeScript configurations passed; focused source-ledger tests passed 2/2 across all fourteen companions and 111 distinct manual records. Generated content initially hit a duplicate statblock selection; bff7deb removes the second traversal. TESTER generation then passed (1561 entries). R1 separates verbatim provenance from authored guidance and refuses missing sources.
- Forge mapping inspected at the pinned `src/data/classes/beastheart/beastheart.ts`: class `class-beastheart`, four subclass files, Companion is a summon-choice representation, kit choice `beastheart-1-5`, chosen signature/3/5 `beastheart-1-7`/`8`/`9`. Salient stores one species decision plus attunement/melee-bonus decisions and a derived companion, not a second hero. Current `scripts/forge/project.ts` explicitly supports Fury/Elementalist/Shadow/Tactician only; no Beastheart import/export or executed Forge parity is claimed.
- Extend the source research matrix to 110 class/level inventory rows per Q-CHAR-14. Supplemental rows are labelled; this does not implement later Beastheart levels or Summoner.

- TESTER 05c4920 retained 397 engine and 602 app/script passes; one reference-viewer test exposed its core-only source ingest. The repair seeds only manifest-selected Beastheart SCCs and their transitive same-book source dependencies, labelled supplemental. Original core sources/collisions remain unchanged; reference coverage does not grant later-level choices. Research generator passed and its 110-row artifacts are retained.
- TESTER cb4a085 passed reference ingest, all nine reference tests and the remaining gates through Vite. The final build budget script still required 2614 total references; it now preserves 2614 core entries and 2507 foes while separately requiring the 122 Beastheart supplemental references. The 200 KB initial-JavaScript budget remains unchanged. Live companion verification is pending.

- ENGINE static PASS through `aaef3bd`, including source quotes, independent ledger, manual-record scope and bounded research/reference/build coverage repairs; [written review](audits/V106-beastheart-rules-review.md). No tests were run by the reviewer.
- TESTER acceptance combines retained unchanged results and targeted repairs: **1000 unique tests (397 engine +603 app/scripts)** plus ingest, lint, both TypeScript projects, links, pins, content/supporting/foes/compiled freshness and web build. This was a resumed gate, not one uninterrupted passing full run. Prior failures remain in the artifacts.
- At `aaef3bd`, `node scripts/check-web-budget.ts` against the retained Vite output passed (exit 0 /0.326s); touched lint/format passed. Core2614 + supplemental122 references and foes2507 satisfy coverage, with the unchanged strict 200 KB initial-JavaScript limit.
- Isolated `SALIENT_HEADLESS_COHORT=beastheart node scripts/verify-character-headless.ts` passed (exit 0 /147.8s): fourteen persisted builds and all111 distinct manual records, source costs, payment/refusal/waiver, owner refusal, draft/admitted separation and unchanged actor/target state except Ferocity debit. Backend stopped, ports free, data retained, checkout released.
- Evidence: `/srv/presidium/projects/salient/test-artifacts/V106-bff7deb-generation`, `V106-05c4920`, `V106-cb4a085`, and `V106-aaef3bd` under the same artifact root. Runtime acceptance source: `aaef3bd5813344178259c5af9bd6a9f1727519e7`. Final documentation does not change accepted runtime or generated sources.
- Ready for DEPLOY2 main/cloud-dev/GitHub publication. Reuse accepted checks and isolated cohort; no deployment smoke or rerun. Companion combat automation remains deferred as described above.
