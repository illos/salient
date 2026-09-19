# V44: Character option delivery plan

Status: staged for a fresh Astra session, 2026-09-19. The entire Opus pilot is
[abandoned without reuse](../decisions/2026-09-19-opus-pilot-dead-end.md). No replacement implementation
has started. [The Astra workflow](astra-character-workflow.md) owns execution; the
[fresh-session handoff](character-restart-handoff.md) supplies starting paths and assignments.

## Goal and scope

Complete the twelve included ancestries and eleven included classes through level ten in the shared
character wizard. The user requires one ancestry/class/level per logical implementation commit,
same-build Forge Steel comparisons, a full audit after initial work, and incremental merges after
full verification. Finish all level-one option families before opening the later-level queue.

Each unit covers all eligible choices and branches at its level: prerequisites, counts/budgets,
automatic and selected grants, permanent derived values, readable manual effects, saved builds and
dependency changes. Preserve decision compatibility, privacy, review, progression history, inventory
and live values. A class unit is not complete after implementing one subclass or showcase build.

Combat automation, new table controls, general interchange implementation, source-pin upgrades,
homebrew and unapproved supplements are outside scope. Manual gameplay effects remain described;
missing permanent build effects cannot be declared complete by labeling them manual. Beastheart
and Summoner are included in the eleven-class target; their editor dependencies do not imply live
companion automation.

## Specification and starting point

- [Decision system](../character-wizard-spec.md#3-decision-system).
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows).
- [Progression history](../character-wizard-spec.md#5-progression-history).
- [Review lifecycle](../character-wizard-spec.md#7-revision-and-review-lifecycle).
- [Forge Steel compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility).
- [Reference verification](character-verification.md).

Start from current main. Application and test trees at this handoff match pre-pilot
`88d1e61793939feedf37ec88181e128fd721364e`; do not reset away the new decision and handoff.
V25/V32/V37 supporting choices, V40/V42 presentation and the [V45 modular foundation](V45-character-option-foundation.md)
are already delivered. Do not repeat foundation extraction. Existing Devil/Berserker Fury,
Polder/Fire Elementalist and Berserker Fury 1→2 paths are partial coverage to preserve, not complete
option families. Do not enable unsupported branches or levels through broad registration changes.

The [source matrix](../research/v1-wizard-coverage-matrix.md) lists twelve ancestries and nine core
classes; add the separately included Beastheart and Summoner to the delivery denominator. Keep both
vendor pins unchanged. Only the pinned Compendium supplies rules research; Forge is a counterpart.
Pilot research, tests and captures are rejected inputs, even if they appear useful.

## Delivery units and sequence

One implementer owns one ancestry/level or class/level in a fresh worktree. The lead owns shared
contracts, composition, evaluation primitives, runtime scheduling and integration. A genuinely
needed shared change gets its own focused prerequisite commit; do not duplicate it across units.
Unit code, justified tests and reference evidence travel together. Fold corrections into unmerged
units; use scoped follow-up fixes for merged work. Do not rewrite main history.

Ancestries start at level one. Later sourced grant changes need their own ancestry/level commits;
unchanged levels need carry-forward verification, not empty commits or invented choice trees.
Class units always cover exactly one level, including every applicable branch.

| Stage | Result |
| --- | --- |
| Initial parallel units | Devil level one and Polder level one, independently completed and verified. |
| Complete first wave | Dwarf level one, Fury level one and Elementalist level one, separately committed. Schedule disjoint units as capacity opens. |
| Combined audit | Audit the integrated five units and foundation interactions; resolve findings before the next wave. |
| Remaining level one | Complete the other ancestry/class families, including Beastheart and Summoner; order by concrete dependencies. |
| Later levels | Advance through levels 2–10 in individual class/level and applicable ancestry/level commits, with source-backed dependencies and carry-forward verification. |

Fury level one includes Berserker, Reaver and Stormwight; Elementalist includes Earth, Fire, Green
and Void. Keep existing Berserker level-two support working without accidentally enabling other
level-two branches. Nested ancestry cases depend on their eligible underlying ancestry choices.

Each unit merges after its own full verification; it need not wait for the entire wave. The combined
audit adds cross-unit review, not a second implementation queue. V46–V56 are retired pilot IDs;
allocate new IDs only when claiming replacement work.

## Counterparts and acceptance

Every newly supported selectable option needs a legal completed Forge counterpart with the same
ancestry, class, subclass, level, background, kit, perks, complication and nested choices as Salient.
Combine compatible options in a build; cover mutually exclusive branches separately. Account for
fixed grants and derived values too. Exhaustive Cartesian combinations are not required.

Use a compact option-to-witness table and authentic reference artifacts under the existing
[reference procedure](character-verification.md). Retain independently derived source expectations
and actual Salient persisted readbacks. Reuse pre-pilot evidence only where it genuinely proves the
case; old fixture names alone do not establish parity. Never reuse pilot artifacts.

Explain Forge discrepancies from pinned sources and obtain independent review. If Forge cannot
represent an option, record the precise limitation and closest comparison; exact counterpart coverage
remains incomplete. Resolve that gap before claiming full verification. For later levels, compare
before/after builds and exercise direct creation, scoped advancement, parent edits and restoration.

Acceptance establishes correct option eligibility, budgets, grants and permanent values; obsolete
choices disappear on parent changes; unrelated choices survive. Shared operations and the wizard
must agree on saved builds. Preserve applicable review/privacy constraints and immutable history,
current inventory and live state. No initial grant duplication or unintended live creature creation.

Every test must satisfy [the test value policy](README.md#test-value). These acceptance requirements
are behaviors to prove, not instructions to duplicate tests per option or per layer. Review rejects
tests that mirror implementation, freeze unverified outputs or add no distinct failure coverage.

Follow [review and merge](astra-character-workflow.md#review-and-merge) for independent implementation
and fresh rules review, full repository/browser verification of the integration candidate, and
shared playable app verification. Required failures block the affected merge while independent
coding continues. Reuse identical valid verification evidence rather than duplicating full runs.

## Initial combined audit

After the first five units, independently audit option completeness, source and same-build Forge
coverage, ancestry/class switching and V37 background/kit/perk/complication interactions. Check
private choices, review/history boundaries, existing Fury 1→2 behavior and live-state preservation.
Include the existing Fury admission/table regression; investigate current evidence rather than
assuming historical timeouts are either resolved or still present.

Report pass, fail and not verified explicitly. Fix findings and repeat affected checks before the
next wave. The audit certifies wizard/build behavior within scope, not all gameplay automation or
Forge interchange. It must not become a new test framework or orchestration project.
