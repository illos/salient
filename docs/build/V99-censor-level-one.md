# V99: Censor level one

Rules review: required. Depends on: V98.

## Goal

Create and edit a level-one Censor through the full wizard and shared API.

## Scope

[Decision system](../character-wizard-spec.md#3-decision-system) and
[wizard flows](../character-wizard-spec.md#4-wizard-flows): all three orders, twelve domains,
three characteristic arrays, ordinary kits, two class skills, one domain skill, and one ability
from each signature/3-Wrath/5-Wrath pool. Higher levels remain unsupported.

Rules are the pinned `en/unified/md/class/censor.md` Basics and advancement table;
`feature/censor/level-1/` and `feature/ability/censor/level-1/` supply all grants and effects.
Named deity portfolios come from the printed `religion/god/` and `religion/saint/` frontmatter.
A custom deity requires a name and exactly four domains under the source's Director-permission
rule; ordinary admission review is retained. Domain choices must belong to the selected portfolio.
The collective Lords of Hell entry has no portfolio; its individual saints remain selectable.

Fixed Wrath costs use the current resource pool. Existing bounded damage, forced-movement and
potency-condition support applies where the compiler accepts the whole clause. Source prose stays
visible for all unresolved effects. Judgment's mark, spatial/turn triggers and Wrath generation,
Recovery transfer/healing, fate points, companions, equipment and respite rituals remain explicit
manual operations; conditional rituals do not silently change baseline statistics. Embedded actions
are separately listed with timing and costs, including paid Judgment options and optional Cleanse.

Forge mapping: pinned `vendor/forge-steel/src/data/classes/censor/censor.ts` is the counterpart class;
its order subclasses, domains and deity selection correspond to the decisions above. This slice
uses a Compendium-derived independent ledger rather than extending the existing Forge runner.

## Acceptance checks

1. Twelve source-derived witnesses cover every domain, order, array and chosen ability. Focused
   evaluation checks stats, skills, grants, costs, deity/domain legality and choice pruning.
2. Authenticated `censor` headless cohort persists builds, invokes all seventeen source abilities
   and twenty-five embedded actions, and reads resource, log, target and condition results back.
   Applied and resisted paths cover newly reachable potency conditions.
3. TESTER generates content/reports, runs `CI=true pnpm check` and the isolated cohort.
   ENGINE independently reviews rules and proof; DEPLOY2 publishes the accepted slice.

## Work log

- Started at main `336d90a` on `slice/V99`, `.worktrees/class-censor`.
- Source inventory contains four signature, four 3-Wrath and four 5-Wrath choices, Judgment,
  My Life for Yours, and three domain source abilities. Twenty-five embedded actions retain
  conditional timing and manual effects. Source names use their exact pinned punctuation.
- Author checks: both TypeScript projects pass; focused Censor evaluator 3/3 and touched lint pass.
  Initial source review found no blockers (ENGINE, Chords 1380); final proof review pending.
- TESTER generation at `595f3b9` passed all three generators in 1.00/0.68/0.88s, yielding 1306
  content entries. Artifacts: `/srv/presidium/projects/salient/test-artifacts/V99-595f3b9-generation`.
  Added seventeen explicit source ability IDs to the audit allowance; original V88 rows remain.
- Live proof includes twelve admitted domain builds, custom-portfolio transition/save readback,
  all 42 new action names, fixed-cost exhaustion, rolled damage/manual clauses, and both strict
  potency paths for Halt Miscreant! (P/slowed) and Repent! (I/dazed). Two legal Elementalist
  targets use the source 2/2/−1/−1 array to give I/P −1 or 2; applied paths read save registration.
- TESTER `74b8f74` full gate exited 1 after 164s: 382 engine and 588 app/script tests passed;
  nine API tests rejected the non-ASCII object key `Adûn`. Repaired portfolio storage to use ASCII
  source-path keys plus printed `parentValue`; the shared evaluator and wizard use one lookup.
  Unchanged accepted tests are retained. No backend or live cohort had started.
- ENGINE R1 corrects Self targets for Hands of the Maker/Faithful Friend; Grave Speech uses a
  zero-Stamina target. R2 independently records six embedded Wrath costs in the source ledger,
  asserting sheet metadata and actual spend instead of deriving expected payment from the sheet.
- TESTER `47e3aa9` resumed gates passed in 54s (382 engine; all four previously failing API files,
  13 cases; remaining content/report/build checks). The live cohort failed after 28.6s at damage
  actual 3 / expected 2. Source recheck of `chapter/kits.md` Damage Bonuses shows Melee + Weapon
  is sufficient, without Strike: Back Blasphemer! with Cloak and Dagger deals 3/5/7, not 2/4/6.
  Corrected the independent ledger and allowed the controlled Censor scenario filename in failure
  locations. Runtime is unchanged; accepted gates are retained for the bounded live retry.
- ENGINE independently passed the final bounded correction at `56ddceb` (Chords 1403); see
  [the rules review](audits/V99-censor-rules-review.md). No open findings.
- TESTER final live acceptance at `56ddceb` (Chords 1404): isolated `censor` cohort exited 0 in
  53.7s, covering twelve domain builds and 42 distinct granted action uses, custom-deity pruning,
  saved/effective separation, fixed-cost blocking, target damage and applied/resisted conditions.
  Touched lint/format passed. Backend stopped, ports free; retained development data is unused.
  Artifacts: `/srv/presidium/projects/salient/test-artifacts/V99-56ddceb`.
- Combined accepted verification covers 979 distinct tests (382 engine + 597 app/scripts), using
  retained `74b8f74` passes and repaired `47e3aa9` gates. This was a resumed gate, not a single
  successful full-command run. Initial failures and reports remain retained. Runtime is unchanged
  since `47e3aa9`; no repeated suite is required for publication.
- Ready for DEPLOY2 to integrate and publish the complete slice with 1306 content entries.
