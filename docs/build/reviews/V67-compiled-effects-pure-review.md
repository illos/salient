# V67 pure compiled effects: provisional independent review

Date: 2026-09-20. Reviewer: independent Codex implementation/rules reviewer.

**Provisional only; no PASS.** Reviewed the working-tree pure compiler, outcome resolver,
shared grammar extraction and support-report adapter by reading source. Testing is explicitly
paused. No tests, typechecks, formatter, report generation, builds or runtime workloads were run.
This review does not attest to a committed revision, reproducible report or live migration.

## Scope and sources

Read [V26 source-to-definition](../V26-compiled-ability-effects.md#1-source-to-compiled-definition),
[definition-to-outcome](../V26-compiled-ability-effects.md#2-definition-to-outcome), and the
[Brutal Slam](../V26-ability-designs.md#brutal-slam) and
[Thunder Roar](../V26-ability-designs.md#thunder-roar) designs. The report's scope was inspected
as pure compilation evidence, not completion of V26's persisted/client/report acceptance.

Pinned source consulted from the already initialized `engine-corrections` worktree's Compendium,
revision `fb83a789da8f0327a389c277a0c790b1648d5810`: `movement/forced-movement.md`,
`rule/character/size.md`, `rule/character/stability.md`, `rule/dice/ability-roll.md`,
Goblin Warrior and Spinecleaver stat blocks, plus the preceding bounded Brutal Slam/Thunder Roar
source review. No online rules or abandoned Opus pilot materials were used.

## Findings

### Initial high-severity title/cost omission: fixed statically, test proof pending

The grammar reader recognizes a name followed by arbitrary parenthesized text as a title.
The initial compiler ignored all such title items, so a printed Bury the Point cost changed
from 2 to 3 Malice could leave the stale 2-Malice metadata executable. Newly appended
parenthesized mechanics could likewise disappear from execution eligibility.

The revised `shared/resolve/compileAbility.ts` title branch now permits only the exact bare
name, the known Signature Ability label, or an annotation equal to the declared activation cost.
Unknown or contradictory annotations become an unsupported node and `source-title` diagnostic.
This closes the reported paths by inspection. The new tests in
`tests/scripts/compiled-ability.test.ts` separately target changed printed cost and unknown title
mechanics; they are meaningful counterexamples but have not been run.

### Initial medium-severity report lineage issue: fixed statically, test proof pending

The initial `scripts/report-compiled-abilities.ts`, `compilerEnvelope`, assigned
`sourceRevision: inputs.foes.sourceRevision` to hero, kit, granted and foe envelopes alike.
It did not reconcile `inputs.manifest.compendium.revision` or each foe object's
`source.revision`. `readInputs`/`buildCorpus` did not establish that equality either.

The current checked-in manifest and foe catalog show the same pin, so this review found no
present incorrect revision value. However, a stale/mixed input snapshot can silently produce
a compiled definition labeled with a revision belonging to another population. The report's
top-level content hash also comes from the Compendium manifest, making explicit reconciliation
necessary before accepting its provenance claims across supplied inputs.

The revised `compilerEnvelope` now selects the matching foe object's own source revision or the
Compendium manifest revision and refuses missing lineage. Before building the combined corpus,
`compiledSupportReport` requires a nonempty manifest revision and exact agreement with the foe
catalog and every object's revision. This closes the reported mixed-snapshot labeling path by
static inspection. Rejection-fixture execution and report generation remain unrun under the pause.
No live gameplay regression was claimed by this finding.

## Satisfactory static observations and limits

- Definitions retain source identity/revision, format/version, complete input envelope, structural
  locators and clause ordinals. Repeated clauses receive distinct structural node identities.
  Unsupported sections/remainders are preserved rather than treated as permission to automate.
- The bounded potency-condition clause remains unsupported post-damage work; it does not derive
  potency, test the inequality, apply a condition or schedule a save. Unknown dependencies make
  the envelope manual. Multiple rolls and mismatched structured/printed blocks are diagnosed.
- `compiledOutcome.ts` calls the existing R04 `resolveAbilityRoll` with compiled tier damage
  expressions and inherited actor/resource/target facts. It does not implement another damage
  calculator, generate dice or persist effects. Damage outcomes precede the push/manual results.
- Push arithmetic matches the pinned ordinary rules: precise creature sizes distinguish 1M/1S;
  larger-creature Melee/Weapon movement gains 1; stability reduction remains optional rather than
  automatically subtracted. Missing facts and unhandled movement categories withhold a final
  allowance. Damage completion gates the instruction. Routes, vertical exceptions, collisions,
  terrain, triggers and death effects remain explicit manual scope.
- The report retains source-declared flavor and available foe parent fields. Parent context is
  not itself an ordinary-foe/minion execution gate. Spinecleaver Axe is manual because its target
  says “per minion.” Keep `pure-only`/`not-wired` claims explicit: passing grammar never establishes
  live grants, ordinary-foe eligibility or permission to migrate a population.

## Remaining gates

Both reported issues have been fixed and their changes independently inspected statically; no
remaining definite source/code blocker was identified in this bounded review. After the testing pause
is lifted, run the required checks on CT114, including focused source-mutation/lineage cases,
source-derived damage/push and missing-fact examples, and reproducible report generation.
Confirm the grammar extraction preserves the existing V64 audit contract. Inspect actual test
and report artifacts before issuing a formal implementation/rules verdict.

No persisted effect format, live adapter, UI controls, backend changes or in-app evidence are
certified by this pure-module pre-review. The wider V26 acceptance gates remain separate.
Chords could not identify this subagent's session; findings were delivered directly to the lead.
