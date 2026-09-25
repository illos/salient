# V1 foe parser and engine plan

Status: proposed implementation sequence, 2026-09-25. The user requested the same source-led
ability analysis and sliced delivery used for characters. This plan covers the confirmed
[36-foe roster](decisions/2026-09-24-v1-foe-roster.md), its Malice features and directly referenced
rules. It does not expand the roster. Owning specifications continue to define product behavior.

## Audit baseline

Code: `06859c7bef06c20bc4dbafe5c8301f524f678750`. Pinned Compendium:
`fb83a789da8f0327a389c277a0c790b1648d5810`. Read the canonical main checkout's
`vendor/steel-compendium/en/unified/md/`; leave worktree vendors empty. Source paths below are
relative to that directory. Each named section in the [inventory](v1-foe-engine-inventory.md)
is a citation to that file, not a rules claim based on catalog data.

The audit read all 36 stat blocks, seven associated Malice files, the relevant band introductions,
and the shared rules identified below. Catalog and committed V72 report counts are **static
inspection evidence**, not a new execution test:

| Population | Count | Current evidence |
| --- | ---: | --- |
| Stat blocks | 36 | 13 goblins/bugbears, 8 undead, 12 humans, 3 solos |
| Ability records in those stat blocks | 110 | 6 `compiled`, 104 `legacy-compatibility` in the committed V72 report |
| Trait records in those stat blocks | 50 | Excluded from the ability count; includes active behavior such as Provoking Nettles |
| Band/solo Malice feature records | 25 | Seven parents; includes three separate Solo Action records |
| Basic Malice options | 2 | Brutal Effectiveness and Malicious Strike, `rule/monster/malice.md`, Basic Malice |
| Additional named group traits | 2 | Shared Ferocity and Thorn Dragon's Domain, outside the stat blocks |

That is 189 named feature records to account for, with repeated traits counted at each printed
occurrence. It is not 189 distinct engine primitives. The six compiled abilities are Goblin
Warrior's Spear Charge and Bury the Point, Goblin Assassin's Shadow Chains, Goblin Cursespitter's
Eye of Surlach and Dizzying Hex, and Ghoul's Razor Claws. Preserve them as regression cases.

`legacy-compatibility` does not mean unusable: the old path can apply some rolled damage and
conditions and retain manual text. Conversely, `compiled` does not establish complete monster
behavior or prove that every instruction changes state. Do not turn these counts into a completion
percentage. V212 will expose clause execution, actor reachability and persisted proof separately.

## What the checkout already provides

| Existing piece | Evidence in code | Consequence for this work |
| --- | --- | --- |
| Pinned source and source drift refusal | `convex/lib/compiledSource.ts`, `compileLiveFoeAbility` | Extend the common grammar; keep reviewed source identity and refuse silent fallback after source changes |
| Foe action list | `convex/lib/resolve.ts`, `abilitiesFromStatBlock`, `abilitiesFor` | Lists only stat-block features classified as abilities plus common actions; traits and band Malice need explicit action/trigger discovery |
| Common damage, potency, conditions and movement instructions | `shared/resolve/compileAbility.ts`, `convex/lib/abilityOperations.ts` | Reuse nodes and shared commits; a movement instruction is not proof of movement |
| Pool damage, captain links and coordinated squad actions | `convex/lib/squadOperations.ts`, `squads.ts`, `shared/resolve/squad.ts` | Preserve V02's one squad roll, per-target contributions, casualties and Free Strike Together; its legacy resolver needs parity with new nodes |
| Typed defenses and modifier/effect instances | `shared/resolve/damageModifiers.ts`, `modifiers.ts`, `convex/lib/effectInstances.ts` | Reuse for conditional traits and source-linked expiry, with explicit minion support rather than assuming it |
| Areas with table-maintained membership | `convex/lib/areas.ts`, `shared/resolve/areas.ts` | Reuse membership and enter events; current riders explicitly leave objects and squad minions manual |
| Hero reaction holders and damage revision | `convex/lib/triggeredActions.ts`, `damageRevisions.ts` | Holder registration and owner loading are hero-specific; add foe ownership, ordering and lifecycle before advertising foe reactions |
| Turn and round journal | `convex/lib/initiative.ts`, `clock.ts` | Ordinary entries record one `spentRound`; solo turns and villain-action budgets need explicit state |
| Malice balance and ability payments | `convex/lib/abilityOperations.ts`, `clock.ts` | Existing fixed ability costs do not implement band features, their timing, or variable spending |

The compiler currently rejects `per minion` targets, unrecognized villain usage/costs, and execution
of the `malice` corpus (`shared/resolve/compileAbility.ts`, target/corpus/action boundary). Loosening
those checks alone would be incorrect. Runtime semantics and evidence must land with recognition.

## Delivery contract

Follow [rules adaptation](rules-adaptation-principles.md), the
[engine source and fact model](engine-architecture.md#from-rules-text-to-executable-behavior),
[table actions and log](table-spec.md#confirmed-action-and-log-contract),
[costs](table-spec.md#ability-costs-and-optional-spending),
[clock](table-spec.md#game-clock-and-scheduled-rules-work),
[history](table-spec.md#undo-permissions-and-proposed-campaign-control),
[squads](table-spec.md#minion-squads-and-captain-state), and the
[automation rulings](decisions/2026-09-24-automation-rulings.md).

1. Compile complete, sourced clauses into reusable typed behavior. Bind printed references to
   actor, primary target, chosen secondary target, origin and duration. Preserve every clause;
   do not mark an ability supported by discarding a dependent rider. A named source profile is
   provenance, not permission to bypass unrecognized wording.
2. Separate three outcomes: automatic state change; automatic state change after a recorded fact
   or choice; explicit table work with its reason. Geometry, line of effect, flanking, chosen
   positions and actual movement remain table-supplied. The existing area ruling makes an added
   member an enter event; it does not make membership a count of squares moved.
3. Collect only facts required by the specific clause. For example, Drag Through Hell needs the
   actual drag distance before damage, whereas Shadow Drag can issue its pull instruction before
   the table resolves terrain placement. Store answers with source event, actor/target and revision.
4. Use registered operations from UI, palette, slash and CLI/API. Optional choices remain optional.
   Traits granting actions (End Effect, Provoking Nettles, javelin pull, granted signature uses)
   must appear in the action list or contextual card and have the same programmatic route.
5. Keep ordinary rule conflicts as warnings, resource affordability as a block, and access/state
   coherence as enforced boundaries. Do not make villain order a hard 1→2→3 sequence; the source
   explicitly permits another order. Tests distinguish deliberate departures from duplicate use.
6. Reuse causal damage, resources, conditions, watchers, journal and accepted dice. Child attacks
   get their own source/roll identities and source-defined ordering. Undo/redo restores complete
   saved consequences, including limited uses, squads and offers; retries never apply twice.
7. Keep used source text public while preserving Director-only unused stat blocks, hidden foes,
   health settings and Malice settings. An automation card must not leak the rest of a monster.
8. A slice closes only after QC review, Test's accepted gate and authenticated headless persisted
   readback, QC's final clearance, and Deploy's merge/publication. Deployment reuses those results.
   No table browser run before V66; add the deferred visual scenarios to its backlog.

### Verification of each feature

The inventory is the coverage checklist. In the owning slice, record the exact source section,
source-derived expected tiers/conditions/costs, route and readback. Exercise every affected named
feature, including shared traits at each different semantic shape. Repeated identical syntax needs
one focused primitive test plus source discovery/route coverage, not dozens of duplicate unit tests.

For every changed clause, cover its real failure boundary: potency immediately below/at threshold,
qualifying/nonqualifying trigger, wrong target/owner, relevant expiration, optional spend off/on,
and a source mutation that must fail closed. Use all three printed tiers when tier behavior changes.
Do not derive expected values from the parser or resolver under test.

For state-changing slices, Test runs `CI=true pnpm check` and the slice's **new, explicitly named**
headless cohort against its committed candidate. Cohort names below are proposals to implement,
not existing commands. Register them in the established runner (or a small foe runner using the
same authenticated client); submit the exact working invocation and environment to Test.
Persisted reads must use the supported table/foe/squad/log API, not mutation responses or direct
database edits as acceptance proof. Setup uses public operations, including attributed Director
adjustments when needed. Lower-level convex-test cases may isolate failure boundaries.

Shared changes also carry focused character regressions selected by the altered contract: damage
responses, modifiers, area membership, clock, minion pool damage, granted extra actions, or respite.
The full gate is coordinator-owned; do not launch another gate from this thread. V228 adds the
cross-feature cases that isolated slices cannot prove, reusing all other accepted evidence.

## Work slices and order

V213 implements the selected-roster subset of the existing V03 boss-turn plan; V224/V227
use only the terrain contracts needed by these foes, within V20’s broader future scope. Neither
legacy umbrella is declared complete by this plan.

These are **planned**, not implemented or released. Cut each branch from current main when it is
ready; re-audit the affected source/runtime boundary then. Dependencies below describe contracts,
not permission to work in another slice's checkout. V211 is this audit and plan.

| Slice | Deliverable | Depends on |
| --- | --- | --- |
| [V212](build/V212-foe-source-and-actions.md) | Complete foe feature accounting, source discovery and trait-granted action routes | V211 |
| [V213](build/V213-foe-turns-and-villain-actions.md) | Two solo turns, villain-action windows/budgets, optional End Effect | V212 |
| [V214](build/V214-foe-malice-features.md) | Band/basic Malice activation, costs and first executable buffs | V212, V213 |
| [V215](build/V215-minion-compiled-actions.md) | Compiled coordinated and individual minion actions; captain parity | V212 |
| [V216](build/V216-foe-rolls-and-spends.md) | Ordinary roll clauses, damage choices and optional Malice variants | V212, V214 |
| [V217](build/V217-foe-grabs-and-movement.md) | Grab-linked effects, confirmed movement consequences and secondary damage/healing | V215, V216 |
| [V218](build/V218-foe-granted-action-sequences.md) | Free strikes, signature uses and ordered child actions | V213, V215, V216 |
| [V219](build/V219-foe-damage-reactions.md) | Foe reaction holders, damage responses and retaliations | V213, V217, V218 |
| [V220](build/V220-foe-pre-resolution-reactions.md) | Redirection, pre-resolution responses and roll-tier revision | V219; Q-FOE-1 |
| [V221](build/V221-foe-target-tests.md) | Each target's characteristic test and its own outcome | V214, V216 |
| [V222](build/V222-foe-traits-and-lasting-effects.md) | Traits, marks, next-roll effects and source-linked restrictions | V216, V217, V219; Q-FOE-5 for Overwhelm |
| [V223](build/V223-foe-spawn-and-revival.md) | Reinforcements, revival and delayed death | V214, V215, V218; Q-FOE-2 for winded spawn values |
| [V224](build/V224-foe-areas-and-terrain.md) | Persistent zones, auras, movement-trigger facts and terrain lifecycle | V217, V219, V221, V222 |
| [V225](build/V225-werewolf-rage.md) | Accursed Rage and compulsory strike sequence | V213, V218, V221, V222 |
| [V226](build/V226-werewolf-form-and-curse.md) | Full Wolf, lycanthropy, Moonfall and Shared Ferocity | V214, V225; Q-FOE-3 for Shared Ferocity |
| [V227](build/V227-thorn-dragon-effects.md) | Dragonsealed, healing aura, briars and domain | V214, V217, V218, V219, V221, V224; Q-FOE-4 for domain durations |
| [V228](build/V228-foe-connected-play-proof.md) | Connected roster proof, remaining manual-work report and final cross-feature fixes | Relevant completed slices V212–V227 |

Recommended first wave: V212–V216. This makes the action surfaces and monster timing honest,
keeps minion execution aligned with the compiler, and unlocks ordinary attacks and spending.
Then deliver V217–V224 as shared mechanics, prioritizing reactions and child actions because many
leaders depend on them. Werewolf and Thorn Dragon have dedicated final slices because their new
state crosses multiple mechanics. Arixx completes through the shared slices, with a named connected
journey in V228. Q-FOE-1 blocks only its pre-resolution behavior; it does not hold the rest of the track.

### Completion ledger

V212's roster report must list each inventory row as automatic, fact-assisted, explicit manual,
or awaiting a decision, plus the last accepted persisted proof. Count source records and
source clauses separately. Report unused/unreachable actions independently. No numerical automation
target justifies skipping a clause or widening the accepted grammar without evidence.

V228 reports the exact residual work: free movement/terrain placement the table must enact,
unknown spatial facts, ongoing story/downtime consequences, and any unanswered decisions. An
unimplemented mechanic remains a gap even when the Director can adjust values manually.

## Questions and blockers

Queued in [the questions file](rules-questions-for-user.md):

- **Q-FOE-1:** timing of target redirection, before-resolution responses and roll-tier revision.
  User confirmed resolve-first Director cards following character reactions; the proposed pause
  is withdrawn. The next committed action closes unused triggered cards, even in the same turn,
  consistently across heroes and monsters. Unconfirmed source-specific consequences remain
  queued under Q-FOE-1; ordinary damage reactions can proceed.
- **Q-FOE-2:** Ravenous Horde says newly created minions are winded without giving exact Stamina.
  The general minion rule also forbids winded minions. Q-FOE-2 proposes a specific exception;
  do not silently halve an ordinary pool and kill half the new minions.
- **Q-FOE-3:** Shared Ferocity's "first time a creature" omits a reset interval. Recommend once
  per qualifying creature per encounter, labelled as an interpretation until answered.
- **Q-FOE-4:** Thorn Dragon's Domain does not print expiry for its speed reduction or linked
  bleeding. Keep their duration explicit/manual until the user settles it.

- **Q-FOE-5:** Human Knave Overwhelm does not state how long its no-shift restriction lasts.
  Recommend the triggering turn; keep that duration manual pending the answer.

There is no blocker to the audit or shared first wave. Source typos (`rag`, `lycanthpy`, Bonetrops'
`the take`/`effect end`) are retained in citations; editorial normalization must not invent a
mechanical rule. Geometry is an expected input boundary, not a reason to discard all automation.

## Review and test pipeline

Engine implements and fixes; QC reviews rules first and sends findings back; Test runs reviewed
committed candidates and returns findings to QC; QC gives Deploy the final greenlight. Every handoff
names the branch, worktree, full commit, relative paths, expected failures and exact commands.
The user may answer queued questions while independent slices continue.

For V211 itself, request a documentation/source review from QC and a focused link/inventory check
from Test. There is no changed gameplay to certify, and no runtime deployment is needed. Future
slice documents contain acceptance designs, not claims that tests exist or have passed.
