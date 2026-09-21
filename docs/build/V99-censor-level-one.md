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
