# V67 final independent headless review

Date: 2026-09-20. Reviewer: independent Codex reviewer; did not implement this slice.

**Implementation: PASS for V67's pure compiler, outcome API and developer report scope.**
No required implementation changes found. This verdict precedes the separate rules verdict below.
It does not accept V26 live integration or migrate any ability into gameplay.

## Reviewed source and evidence

Reviewed the complete application-code diff from `2f5544f`, the V67 owning document, V26 compiler
contract and ability-design appendix, provisional review, extracted grammar, compiler, outcome
resolver, report adapter and all new tests. The source was `b3a5618` plus the working-tree title
strictness and formatting changes. The six entries in
[the tested-file manifest](../evidence/V67/v67-tested-files.sha256) independently matched the
reviewed local files with `sha256sum -c`. This is proof of those tested bytes, **not a clean-commit
attestation**. [Source metadata](../evidence/V67/source.json) explicitly records a dirty checkout.
Documentation finalized afterward does not change the reviewed application bytes.

Inspected actual retained CT114 results:

- [Full check output](../evidence/V67/v67-check-output.txt) and
  [exit status](../evidence/V67/v67-check-exit.txt): exit 0; lint/format, engine/app typechecks,
  284 engine and 458 app/scripts tests, links, vendor/content checks and build passed.
- [Initial focused output](../evidence/V67/v67-initial-focused-output.txt): 70 passing cases,
  comprising the existing 19 R04 and 12 V64 cases plus 39 compiler/outcome/report cases. These
  counts describe observed execution, not a test-value target.
- [CLI byte comparisons](../evidence/V67/v67-report-comparison.txt): two report invocations
  produced identical JSON and Markdown; regenerated V64 JSON/Markdown matched the committed
  originals exactly. Retrieved [support JSON](../evidence/V67/support.json) and
  [Markdown](../evidence/V67/support.md) hashes independently match the recorded report hashes.

I ran no tests, builds, formatters, servers or browsers. Verification workloads were already
performed on CT114 by the lead. Local work was source/artifact reading and hash comparison.

## Implementation findings

The extraction preserves V64's implementation: inspection of the moved region found only
export visibility, formatting and a section-comment change. Corpus loading, grant discovery and
report generation remain in the script; existing callers retain the re-exported API. The unchanged
V64 output supplies complementary execution evidence for this refactor.

Strict compilation separately reconciles printed blocks and headers against structured data.
Additional rolls, tiers, sections, unnamed paragraphs, undeclared italic text and contradictory
roll/tier/header/title facts cannot acquire execution eligibility. In particular, the provisional
cost finding is closed: a cost-bearing envelope accepts only its matching cost annotation when a
title is present; the Signature Ability label cannot hide a declared cost. The new counterexample
and changed-cost tests passed. Missing source identity and unsupported action/cost shapes diagnose
manual work. Source-declared flavor is matched by occurrence, not inferred from arbitrary italics.

Nodes preserve clause text, block/tier location, ordinal and source identity. Repeated identical
clauses retain distinct deterministic IDs. These are structural identities only; use/revision IDs
remain a future persistence responsibility. Push depends on preceding damage. Only the narrowly
specified immediately post-damage potency/save clause receives a known unsupported dependency;
additional or unknown prose makes the envelope manual. Sections remain manual rather than being
silently declared independent.

The public `resolveCompiledAbility` calls R04 for accepted dice, independent characteristic choices,
per-target tiers, damage, kit/build contributions, health and cost. It introduces no parallel damage
calculator or state writes. One-target and compiled-structure restrictions are explicit. Damage
outputs precede post-damage work. A push requires completed damage, relevant precise creature sizes,
known target stability and explicit conditions/traits/modifiers coverage. Missing facts name the
requirements; unhandled categories retain only a subtotal and manual explanation. Stability is
reported for optional reduction, never automatically deducted. Movement, routes and collision/death
consequences are not executed.

The report adapter now assigns per-object foe provenance or the Compendium manifest provenance,
and rejects missing/mixed corpus revisions before compilation. Its actual totals are six of 52
hero envelopes and four of 1,158 foe envelopes pure-supported; all 15 granted, 25 kit and 14 Malice
envelopes remain manual. Every entry says `live: not-wired`; the report explicitly keeps minions
compile-only. Parent stat-block facts remain developer context, not public gameplay source records.

The tests protect distinct failures: omitted mechanical source, contradictory printed data/cost,
multiple rolls, occurrence collapse, name allowlists, roll-bonus/damage conflation, unwanted
stability subtraction, imprecise-size defaults, unhandled movement eligibility, incorrect tier
correction, temporary-health order, duplicate/insufficient payment, keyword bonus qualification and
mixed report lineage. Numeric expected results are explicit source-derived values, not values
computed by the compiler under test. The determinism checks intentionally compare repeated output
because byte reproducibility is their contract. Existing R04 tests cover characteristic-choice and
immunity arithmetic; this slice does not duplicate that calculator's entire matrix.

The headless gate is met for the bounded feature: tests invoke the exported pure compiler/outcome
API and the actual report CLI was run twice against the pinned corpus. There is no changed UI,
authenticated operation or persistence to prove here. This is not evidence of a live campaign
journey, saved health/resource changes or app-wide CLI parity. Browser testing is under the site-wide
moratorium and its absence is not an acceptance blocker.

## Separate pinned-source rules review

**Rules: PASS for the declared V67 pure calculations and manual boundaries.**

After the implementation verdict, reviewed the local Compendium at
`fb83a789da8f0327a389c277a0c790b1648d5810`; no web rules, Forge Steel substitute or abandoned Opus
materials were used. Under `vendor/steel-compendium/en/unified/md/`, consulted:

- `feature/ability/fury/level-1/{brutal-slam,thunder-roar}.md`;
- `monster/goblin/statblock/{goblin-warrior,goblin-spinecleaver}.md`;
- `feature/ability/elementalist/level-1/{meteoric-introduction,viscous-fire,ray-of-agonizing-self-reflection}.md`;
- `feature/ability/common/{melee-weapon-free-strike,ranged-weapon-free-strike}.md`;
- `feature/elementalist/level-1/{enchantment-of-destruction,fire-acolyte-of-fire}.md`;
- `movement/forced-movement.md`, `rule/character/{size,stability}.md`,
  `rule/dice/{ability-roll,power-roll,edge,bane}.md`, `chapter/kits.md`, and `kit/mountain.md`.

Independent arithmetic with the disclosed H/G/E fixtures agrees with the recorded expectations:

| Comparison | Source-derived expectation |
| --- | --- |
| BS1–3 | Totals 11/16/17; damage 3+2=5, 6+2=8, 9+2+4=15; G health 10/7/0; push 1/2/4 plus 1 gives 2/3/5. |
| BS4–6 | Same-size tier-2 push stays 2 before optional stability; missing precise size or unhandled movement coverage cannot establish a final allowance. |
| BS7 | One bane makes total 14, still tier 2: damage 8/push 3. Two banes shift the unmodified tier 2 to tier 1: damage 5/push 2. |
| SC1–4 | Fixed +2 applies only to the roll; printed damage 3/4/5 leaves H 27/26/25. Four damage consumes three temporary Stamina, then leaves H 29. |
| BP | Printed damage 5/6/7, fixed 2 Malice; tier 2 leaves H 24 and pool 0. Pool 1 blocks. Thresholds 0/1/2 and bleeding/save text remain unevaluated. |
| MI2 | 5+Reason 2+Magic bonus 1=8; G 7; push 3. No Weapon keyword, hence no size bonus. |
| RA2 | 4+2+1=7 corruption; G 8; symbolic AVERAGE/slowed/save clause remains manual. |
| VF2 | 5+2+1 Magic+1 Fire/Magic=9 fire; G 6; push 3. With disclosed fire immunity 5, inherited arithmetic gives 4 applied damage and health 11. |
| Melee free strike | Constants 2/5/7 plus 2 and Mountain 0/0/4 yield 4/7/13. Independent roll/damage choices survive the adapter; asymmetric A1 roll/M2 damage with 8+7 gives total 16 and damage 7. |
| Ranged free strike | Constants 2/4/6 plus 2 yield 4/6/8; no Mountain ranged bonus. |
| TR1 manual comparison | Dice 7+6 and Might 2 give base total 15. Edge/double bane/none give tiers 3/1/2; constant damage plus applicable kit is 17/6/9; G health -2/9/6; Ferocity 6→1 once. Compiled execution remains refused. |
| Spinecleaver Axe | Printed tier 2 is damage 4 then push 3; Minion, per-minion targeting and captain context remain retained and manual. |

The Ability Roll rule establishes damage before tier effects. The forced-movement rule supports
up-to distance including zero, straight-line away movement and a larger melee-weapon creature's
+1; the size rule distinguishes 1T/1S/1M/1L. Stability is voluntary. Explicit manual scope correctly
preserves flying/vertical/slope exceptions, paths, terrain, collisions, triggers and death effects.
Mountain's bonus applies to Melee/Weapon damage without requiring Strike, explaining TR1; kit
signature printed damage already includes its kit bonus, and Pain for Pain's conditional rider
prevents safe compiled execution. Its compatibility behavior is unchanged.

Limitations: BP1/3, free-strike and immunity arithmetic above include independent source/manual
comparisons and inherited resolver coverage, not newly executed compiled-path permutations.
BS8/BP5 history/disposition, live grants, authority/privacy, persisted payment/health, minion rules,
actual movement and all V26 integration acceptance remain outside this verdict. Meteoric
Introduction and Ray are compile-only comparisons. The additional discovered foe candidates are
report recognition, not new playable support. No live behavior changed through this slice.
