# V45: Character option foundation

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Character integration lead |
| Rules review | Required: preservation of sourced calculations and option boundaries |
| Depends on | V44, V25, V32, V37, V40, V42 |
| Unblocks | Independent ancestry and class/level option slices |
| Status | Implementing; see `STATUS.md` |

## Goal

Give ancestry and class implementers independently owned definition and derivation modules while
preserving current saved decisions, baseline values, provenance, source text and supported paths.
Centralize the supported level/transition boundary so adding an option cannot inadvertently enable
unimplemented advancement. This prerequisite adds no new playable ancestry, class or level.

## Spec references

- [Decision system](../character-wizard-spec.md#3-decision-system).
- [Shared operations](../character-wizard-spec.md#9-shared-operations-and-reliability).
- [Level-up](../character-wizard-spec.md#level-up).
- [Delivery policy](../character-wizard-spec.md#13-proposed-delivery-sequence).
- [V44 initial plan](V44-character-option-delivery.md).

## In scope

- Extract Devil/Polder and Fury/Elementalist definitions, with Fury level two separate.
- Extract phased class/ancestry contributions without normalizing away existing provenance.
- Share the supported-level check and current advancement registration with persisted operations.
- Recover portable existing Forge references and independently check preserved selections/values.
- Full foundation audit, exact before/after evidence, regression checks and shared playable delivery.

## Out of scope

New options, higher-level coverage, new formulas, a generic effects language, production interchange
adapters and gameplay automation. Per-ancestry/class expansion remains separate commits under V44.

## Inputs and dependencies

Main `9fb4fa6`, unchanged Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` and Forge Steel
`5a846aadb623a9855a023e9403bb887a956c341f`. Existing Fury/Polder level-two hybrids remain supported.
V41/V43 performance work is independent; coordinate guest load and shared runtime updates.

## Deliverables

- Family definitions under `shared/content/ancestries/` and `shared/content/classes/`.
- Validated contribution context and phased modules under `shared/evaluate/`.
- `shared/content/character-support.ts`, used by evaluation and persisted level/advancement checks.
- Portable reference inventory/fixtures and meaningful support-boundary tests.
- Evidence and independent foundation reviews linked from this work log before merge.

## Acceptance checks

1. Assembled definitions at levels one/two and unsupported levels are unchanged, including option
   support flags, order, IDs, quotes and V37 extensions. Vendor/reference content remains unmodified.
2. Before/after evaluations match, including provenance and diagnostics, for existing complete,
   incomplete, invalid and unsupported builds and contrasting ancestry/class/kit combinations.
3. Fury baseline 30/10/10/15 and level-two 39/10/13/19 (Stamina/Recoveries/recovery/winded) remain
   sourced and unchanged; corrected Bethell remains 18/8/6/9. Polder level-two immunity remains 4.
   Missing Fury kit leaves dependent values absent. No healing or reset follows recalculation.
4. Level-two non-Berserker/class paths remain unsupported even when their level-one options are
   enabled in a regression fixture. Current progression permits only the verified transition.
5. Existing Forge exports are immutable portable evidence, with explicit deferred/incomplete-choice
   limitations; selections and source-established values compare without deriving expected values
   from Salient's implementation. New option counterpart certification remains future unit work.
6. Full repository checks and browser suite pass on isolated CT114; retained real wizard/review/
   progression/history/private-choice/table regressions include persisted readback and screenshots.
   Historical Fury timeouts are not counted as passing without a successful current rerun.
7. Independent implementation and rules-preservation audits pass the exact integration candidate;
   the lead validates commit trailers, merges and updates/verifies shared CT114 main with data retained.

## Ability design and playtest evidence

Not applicable: executed ability behavior is unchanged. Existing ability grants/modifiers and their
source/provenance are preservation cases; table regression still runs as part of foundation acceptance.

## Rules research

Use the already source-audited V25/V32 fixtures, current pinned ancestry/class/trait entries and
[reference verification](character-verification.md). Extract contributions with their exact source
sentences and invocation order. New mechanical findings need their own scoped repair, not an incidental
formula change in an extraction. Future ancestry Stamina contributions must precede recovery/winded
derivation; this slice does not implement Dwarf calculations.

## Open questions

None needed for foundation work. Reference evidence and runtime failures remain verification tasks.

## Work log

2026-09-19: user explicitly started implementation and authorized subagents. Created `slice/V45`
in the clean retained `wizard-plan` worktree. `foundation_content` owns definition extraction;
`reference_foundation` recovers portable Forge artifacts and comparison tests; lead owns evaluator
contributions, support registry and backend integration. `wizard_plan_review` performed independent
read-only preservation analysis and will audit implementation. No shared runtime changed at kickoff.
Named CT114 `characters` is stopped with data retained; coordinate validation behind performance work.

2026-09-19: integrated V41/V43 code `087a709` and documentation closeout `944a46a` before final
review. Static implementation findings (Devil trait projection and null narrowing) repaired.
CT114 focused run passes both typechecks and ten new tests; exact baseline comparison passes
ten definition variants and 5,584 evaluations across all four statuses.
[Verification evidence](evidence/V45/README.md),
[implementation review](reviews/V45-foundation-review.md), and
[rules-preservation review](reviews/V45-rules-preservation-review.md) retain pending/full verdicts.

2026-09-19: full CT114 `pnpm check` passes 691 tests (284 engine, 407 app/scripts) and every
other repository gate. Full browser batch: 45 pass, four fail, three environment-specific skips.
The four unchanged reruns all pass: closeout (1.4 min), table-audit/campaign (2.0 min) and full
Fury wizard/admission/three-audience/60-action journey (3.2 min). All 49 applicable scenarios have
current passing evidence. Initial `encounters:current`/`abilities:sheet` timeouts, registration
rate limits and near-limit retry reads are retained and handed to the performance thread via
Chords 173–175/179; no global timeout fix is claimed. Thirty-nine runtime source hashes match.
Independent implementation pre-merge review passes. Final rules verdict, commit gate and shared
delivery remain pending. Holding main integration during the performance thread's separately
authorized hosted publication; this slice has no hosted publication authorization.

2026-09-19: independent implementation and rules-preservation pre-merge audits both PASS.
All reference/performance limitations remain explicit. Reviewed code is ready to commit;
shared main integration and live verification remain the lead's delivery gate.
