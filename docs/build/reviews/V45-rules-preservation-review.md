# V45 independent rules-preservation review

Reviewer: `foundation_rules_audit`, 2026-09-19. The reviewer did not implement the extraction,
support registry, fixtures or comparison helper. Initial static scope: the uncommitted V45
foundation on `slice/V45`, compared with `087a709598e6acf2d86f8b68ba62f835b46e0c33`.
Final candidate: staged V45 on integration parent `944a46ab7b05059d22d8403634867de56462e209`,
identified by [candidate hashes](../evidence/V45/candidate-hashes.json).

**Final verdict: pass — pre-merge rules-preservation audit, 2026-09-19.** No blocking rules
finding remains for this foundation extraction. Initial static approval was provisional;
the executed evidence reviewed below now substantiates the preservation, reference and
applicable runtime gates. Shared playable delivery remains the lead's post-merge gate.
Intermittent backend timeouts are retained as a performance limitation, not certified fixed.

## Authority and inspection

Confirmed local pins: Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge Steel
`5a846aadb623a9855a023e9403bb887a956c341f`. No vendor edits, online rules research, dependency
installation, server, build or test execution were performed by this reviewer. Chords MCP calls
reported an ambiguous provider session; coordination was handed back to the lead.

Read the owning V45 slice, V44 verification requirements, previous V25/V32 source contracts,
the actual local source entries cited below, the removed evaluator bodies and extracted
contributions, family definitions, support registry, reference manifest/inventory, raw Forge
exports, captured sheet text and bounded comparison helper. Pinned Forge `FeatureLogic`
and `HeroLogic` were consulted only for active-selection and serialization interpretation.

## Preserved rules and boundaries

All source paths below are relative to `vendor/steel-compendium`.

| Check | Independent source result | Candidate assessment |
| --- | --- | --- |
| Fury characteristics and potency | `en/unified/md/class/fury.md`, Basics: Might/Agility 2, three remaining arrays, Might−2/Might−1/Might potency. | Extraction preserves the fixed and assigned origins and original invocation order. |
| Fury level-one vitals | Same class: Stamina 21, Recoveries 10; `kit/mountain.md`: +9 per echelon; `rule/general/echelon.md`: levels 1–3 are first echelon. | Grug remains Stamina 30, Recoveries 10; `rule/health/recoveries.md` gives recovery 10; `rule/health/winded.md` and `rule/general/always-round-down.md` give winded 15. |
| Fury level-two vitals | Fury Basics adds 9 per higher level, without a second kit echelon. | Grug remains 39/10/13/19. The +9 contribution precedes recovery/winded calculation. No live-state restoration occurs in the extracted functions. |
| Devil traits | `feature/trait/devil/beast-legs.md`: speed 6; `impressive-horns.md`: save succeeds at 5; costs 1 and 2. | Set-speed semantics, save threshold and provenance survive extraction; Mountain supplies stability 2 without a speed bonus. Existing three-point budget and support flags remain unchanged. |
| Polder | `feature/trait/polder/small.md`: size 1S; `corruption-immunity.md`: level+2; `fearless.md`: cannot be frightened; `graceful-retreat.md`: Disengage +1. | Existing level-one 3 and hybrid level-two 4 corruption immunity remain correct. Purchased costs 1+2+1 fit the four-point budget. No new Polder option is enabled. |
| Elementalist baseline | `en/unified/md/class/elementalist.md`, Basics: Reason 2, Stamina 18, Recoveries 8, Reason-based potency. | Bethell remains 18/8/6/9; no-kit baseline, characteristics and source provenance are retained. |
| Elementalist modifiers | `feature/elementalist/level-1/enchantment-of-destruction.md`: +1 rolled damage with magic abilities; `fire-acolyte-of-fire.md`: +1 for Fire and Magic, also Hurl Element when used for fire damage. | Extracted descriptors preserve keyword conjunction and the conditional Hurl Element alternative; they do not turn every spell into fire damage. |
| Berserker level two | Fury advancement table; `feature/fury/level-2/2nd-level-aspect-feature.md`; Heroes clean text, “2nd-Level Berserker Ability,” lines 9280–9314. | Unstoppable Force and the Special Delivery/Wrecking Ball choice stay Berserker-only. The two abilities are maneuvers without Strike; this refactor changes no execution semantics or damage tier treatment. |
| Availability | Existing authored support flags and level diagnostics are application coverage boundaries, not claims that other source-legal options do not exist. | Level two still requires Fury/Berserker. Central advancement eligibility now explicitly checks the same subclass boundary before accepting future level-one expansions. No current supported character loses advancement. |
| Missing or changed choices | Validated `single`/`list` values and available decisions remain the input to each extracted contribution. | Missing Fury kit still cannot supply maximum Stamina/recovery/stability. Existing stale ancestry/class filtering remains in place; exact incomplete/invalid-output equality is now supported by executed comparison evidence. |

Definition extraction retains stable IDs, wording, grant types, option order and the V37
extensions. The one-time equality script appropriately compares the whole definitions and
evaluation objects, including diagnostics/provenance; it is preservation evidence, not an
independent rules oracle. Future ancestry Stamina contributions (for example Dwarf) must be
applied before dependent recovery/winded values; V45 does not yet implement that contribution.

## Forge counterpart interpretation

The raw exports identify Devil/Berserker Fury Grug at levels one and two and corrected
Polder/Fire Elementalist Bethell at level one. Grug actually selects Beast Legs and Impressive
Horns; Bethell selects Corruption Immunity, Graceful Retreat and Fearless. Captured sheet text
reports Grug 30/10/10 and 39/10/13, and Bethell 18/8/6 for Stamina/Recoveries/recovery. It also
reports Grug speed 6, stability 2 and save 5, and Bethell speed 5, stability 0, Disengage 2,
corruption immunity 3 and frightened immunity. Winded is source-derived, not visible-sheet parity.

The helper follows pinned `getFeaturesFromClass` and `simplifyFeatures`: only levels at or below
the hero's class level, selected subclasses, chosen feature/perk records, multiple-feature
contents and chosen kits are active. Class ability IDs resolve separately, matching
`HeroLogic.getAbilities`. Embedded future levels and unselected branches are not grants.
Unsupported active containers fail explicitly. This is a bounded reference projection, not an
interchange implementation or a universal Forge rules evaluator.

Grug's missing Soldier language is accurately reported as one deferred entitlement. Forge's
`I Speak Their Language (Soldier)` presentation is not an extra granted language. Those exports
are valid preservation witnesses but cannot certify the forthcoming complete all-option Fury
unit. Corrected Bethell's author-name suffix, punctuation normalization and career/class duplicate
Magic representation are explicitly recorded. Two shared free strikes are excluded from embedded
ability comparison, not silently dropped from source expectations. Source/Forge text differences
remain explained by the preceding V25/V32 audits. Raw live counters are not mistaken for totals:
for example state renown 0 coexists with displayed career-derived renown 1.

The portable fixtures and independently authored V25/V32 expectations are a suitable regression
foundation within those stated limits. They do not establish Dwarf, other ancestry traits,
Reaver/Stormwight, Earth/Green/Void, new completed option coverage, import/export interoperability,
or browser/persistence correctness.

## Final executed-evidence assessment

Read the [focused run](../evidence/V45/focused-pass.log),
[full repository run](../evidence/V45/check-pass.log),
[initial browser batch](../evidence/V45/browser-initial.log),
[Fury retry](../evidence/V45/fury-retry.log),
[closeout retry](../evidence/V45/closeout-retry.log),
[registration retries](../evidence/V45/registration-retry.log),
[runtime source verification](../evidence/V45/isolated-source-verification.json),
[retry runtime warnings](../evidence/V45/retry-runtime-warnings.log), and
[evidence record](../evidence/V45/README.md). No additional workload was run by this reviewer.
Read-only hashing independently confirms that all 39 manifest application/test/reference files
match the present candidate. Documentation and generated helper imports are outside that manifest.

| Gate | Evidence assessed | Verdict |
| --- | --- | --- |
| Exact extraction preservation | Pristine `9fb4fa66a942466b713fa8498301a120a880b412:shared/` archive; ten assembled definition variants and 5,584 full evaluation objects deep-equal, across complete/incomplete/invalid/unsupported results. | Pass; includes provenance and diagnostics, not merely numerical totals. |
| Reference and support tests | Ten new tests pass, including portable artifact fingerprints, actual selection mapping, captured totals and future-subclass exclusion. | Pass within the stated historical-reference limits. |
| Repository checks | 284 engine plus 407 app/script tests, lint, typechecks, source/vendor/content checks and production build pass. | Pass; 691 tests. |
| Browser behavior | Initial batch: 45 passes, four failures, three fixture-specific skips. Every failure has a passing unchanged rerun. | Pass for 49 applicable scenarios; not a clean initial batch or reliability certification. |
| Persisted advancement/restoration | Raw query readback and browser assertions preserve live values, change sourced maxima, cap restoration and retain history. | Pass. |
| Candidate identity | Local manifest matches and recorded isolated comparison both report 39 matching files, zero mismatches. | Pass. |
| Shared playable update | Not yet performed for this candidate. | Pending lead post-merge gate. |

The browser failures involved execution-limit timeouts and registration rate limits; the
unchanged retries establish current functional success without erasing those observations.
Near-limit history and sheet reads remain. Exact derived-output preservation, unchanged
foundation query behavior, successful full Fury/admission/table rerun and retained performance
handoff support accepting this refactor. These results establish neither a timeout fix nor a
waiver of future option-unit verification. Password-recovery and Workers fixture skips are
explicitly excluded from the count and do not exercise changed foundation behavior.

Inspected [progression-readback.json](../evidence/V45/progression-readback.json) directly and
the corresponding `tests/browser/v32-progression.spec.ts` assertions. Before advancement,
maximum/current Stamina is 30/20; after advancement it is 39/20. Recoveries remain 4 and
Ferocity remains 3. The test explicitly adjusts current Stamina to 39 before restoration;
pending approval retains 39, while approved restoration caps it at 30. This is the confirmed
activation policy, not a level-up refill. Recovery/winded values are 10/15, then 13/19, then
10/15. The restored baseline equals the earlier level-one baseline. History retains the
level-two revision and adds an effective level-one restoration; 20 source-card readbacks name
the pinned Compendium revision. The corrected evidence record describes this deliberate
current-Stamina adjustment accurately.

Viewed the retained level-two, restored level-one and Bethell screenshots. They agree with
the readbacks and expected displayed grants, including the level-two Wrecking Ball maneuver
and its push-only tiers. Screenshots supplement the source/readback evidence rather than
proving every mechanical clause or persistence on their own.

The comparison helper's set-based name matching remains appropriate for these fixed,
fingerprinted historical artifacts. Future counterpart tests must also check option counts,
duplicates, budgets and nested constraints explicitly; set equality alone cannot establish
legal selections. Deferred Grug languages, uncaptured Forge winded/damage-card values and the
absence of a Salient interchange adapter remain limitations after these successful runs.

## Next-unit preparation review

Also reviewed [Devil level-one preparation](../../research/devil-level-one-preparation.md)
against the pinned Barbed Tail, Glowing Eyes, Hellsight, Prehensile Tail, Wings, Silver Tongue,
Interpersonal Skills and Fly entries. The seven trait costs/effects, thirteen eligible skills,
conditional Wings weakness and minimum-one-round aloft calculation are correctly described.
The proposed four trait templates and thirteen skill witnesses are a sensible capture plan;
they are not captured counterparts or enabled options. Conditional effects remain readable/manual
and must not become unconditional baseline damage/weakness. Full Devil implementation and its
same-build verification still require their own commit and independent acceptance.

The lead may proceed with the reviewed commit/integration gate. Any subsequent application
change requires affected checks and review. Do not report merge completion until the actual
shared CT114 environment has been updated and the changed behavior verified with data retained.
