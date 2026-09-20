# Astra character delivery

Status: the six initial level-one ancestries are delivered through V74. The user has authorized
[the remaining six-ancestry batch, V76–V82](V82-remaining-ancestries.md); implementation, independent reviews and hosted headless/Forge acceptance have passed.
The batch is merged/live as `1fa8aac`, with both apps passing public API acceptance. The Opus pilot remains
[abandoned without reuse](../decisions/2026-09-19-opus-pilot-dead-end.md). This document owns
the replacement character workflow; [V44](V44-character-option-delivery.md) owns its delivery
scope, and [the build process](README.md) retains project-wide review and merge rules.

## Ownership and parallel work

Use an Astra lead and native Astra subagents. One implementer owns one ancestry/level or
class/level unit in a separate worktree from current main. The current authorized batch is
Dragon Knight (V76), High Elf (V77), Memonek (V78), Revenant (V79), Time Raider (V80), and
Wode Elf (V81), integrated under V82. Implementers can take a second independent unit after
handing off their first candidate; preserve separate logical commits and unit ownership.
Use available agent capacity for independent review or a concrete shared/runtime blocker.
Do not resurrect the external Opus fleet.

The lead owns shared-file integration, runtime scheduling and delivery. Implementers own their
unit through source research, code, focused tests and correction of review findings. Native
collaboration carries assignments and results; Chords coordinates with other project threads,
not a separate worker scheduling system. Never invent a sender identity to resolve a mapping error.

Only shared-file edits, use of a shared runtime slot, and merges are serialized. Unit implementation
continues while another unit waits for review or runtime verification. A failed required gate blocks
that unit's merge, not independent development. The previous pair limits applied to the initial
Devil/Polder, Dwarf/Human, and Hakaan/Orc delivery; the user's remaining-ancestries request
supersedes those limits for this batch. Revenant's Previous Life depends on the other ancestry
purchase definitions, so the lead integrates that shared dependency after the unit modules are
available. Finish this bounded level-one batch before expanding into a new class or level.
Implementation, reference verification, live application acceptance, and delivery remain separate
statuses; none becomes complete merely because its candidate is written.

## Unit contract

At assignment, record only: unit/level, branch and owned paths, source entry points, acceptance
cases, shared dependencies and next handoff. Use the existing slice document and `STATUS.md`.
Allocate a new slice ID; never reuse the abandoned pilot's IDs or branches.

Each unit must cover all eligible choices at its level, prerequisites, budgets, grants, permanent
values and readable manual effects. Apply the project-wide
[trait-granted ability gate](README.md#trait-granted-ability-completion-gate) to every implemented
trait/feature: inspect embedded and conditional actions, retain the trait, and build its granted
actions in the UI list and shared CLI/API route. A description-only implementation is incomplete.
Include the choice or play-state operation needed to expose conditional grants; do not turn a
changeable state such as the active dwarf rune into a permanent wizard choice. Distinguish new
actions from modifiers to existing actions and preserve sourced timing/manual-resolution limits.
Full gameplay effect automation remains outside this editor task. Preserve existing saved
decisions, progression, privacy and live-state behavior. A shared primitive needed by multiple
units is a separate focused change owned by the lead, not duplicate implementations.

Use only main, pre-pilot project evidence and the pinned Compendium/Forge sources. Do not read or
reuse pilot branches, ledgers, tests, captures or interpretations. Derive expected results before
calling the evaluator. Real source ambiguity goes to the existing question queue; continue the
parts independent of the answer.

## Checks and reference comparisons

Every test must meet the [test value policy](README.md#test-value): name the concrete failure it
catches and the coverage it adds. Reviewers remove redundant or implementation-mirroring tests;
there is no test-count quota or separate test-justification bureaucracy.

Before browser acceptance, pass the app-wide
[programmatic headless gate](README.md#programmatic-headless-completion-gate). Each ancestry/class
journey must create, choose, save and read back/evaluate through supported CLI/API operations
without a browser session or UI setup. Include affected review/history boundaries. Record the
headless result first. Browser testing remains under the moratorium; log would-be scenarios in
the browser backlog. After browser testing resumes, record any additional gaps it finds separately;
existing browser passes are not programmatic proof.

During implementation, run focused checks for the changed mechanism: choices/budgets, grants and
derived values, parent replacement, persisted save/reload and applicable history/live-state cases.
Prove that conditional actions appear only for their granting choices/states, that replacement or
removal revokes old grants, and that state changes persist without resetting unrelated values.
Reuse the existing test runners and pre-pilot helpers. Do not create a new test framework, limiter
replica, diagnostic service or logging pipeline to complete a unit.

Keep a compact option-to-witness table. Every newly supported option must be checked against a
legal completed Forge build with the same choices in Salient. Combine compatible options and reuse
valid pre-pilot counterparts where they actually cover unchanged behavior; never use pilot exports.
Use retained authentic exports or reproducible counterparts constructed with pinned Forge code
and definitions, as approved by the user on 2026-09-20. Calibrate the programmatic adapter against
retained genuine exports, execute Forge's own completeness and calculation logic, and validate
allowed options, counts, budgets, prerequisites and nested choices. Do not mock selection/game
logic or hand-author expected Forge stats. Unsupported adapter semantics fail closed with explicit
scope gaps.

Retain raw Forge characters, exact selections, versioned reproduction inputs, captured Forge output
and a readable JSON comparison report against saved Salient API readbacks. Compare grants and
derived values as well as selection completeness. Source expectations remain independent of both
implementations; the pinned Compendium resolves disagreements. Explain discrepancies and obtain
independent rules review; do not label a gap a pass. Follow
[the reference procedure](character-verification.md). No website capture or browser test is required
for this comparison, and the browser moratorium remains unchanged. The option-to-witness ledger,
full per-option coverage and review gates still apply.

## Runtime and failure handling

Local and remote CT114 are both valid test environments; use whichever is free and suitable.
Do not wait for a remote slot when the same proof can run locally. Coordinate workloads per host
and environment, reuse compatible running environments, and explicitly name concurrent isolated
environments. Preserve the shared playable app and existing data; never reuse the stopped
`characters` environment or its anonymous deployment/data. Record the actual source, runner
location and application target. Use the existing broker for CT114 and follow the
[environment-selection runbook](../remote-development.md#choosing-a-test-environment); do not copy
pilot wrappers or patch the broker ad hoc. The browser moratorium applies everywhere.

One owner controls a runtime job and any capture until its result is handed back. Before the first
candidate, establish the actual current-main baseline in that clean environment. A failed baseline
is infrastructure/application debt to identify separately; it is not a character regression or a
pass. Independent unit coding can continue while the owner addresses a concrete blocker.

Use existing output/artifact paths to retain the command, deployed source, stdout and actual exit
status. No extra backend log follower is required by default. Do not replace a source checkout while
its job is running or before needed artifacts are retained. Record failed and interrupted attempts
as such. A missing log cannot prove success.

After a failure, inspect the retained evidence and identify the next diagnostic or fix before another
run. Do not repeat a full suite under the same conditions merely hoping for green. Assign a narrow
fix when evidence identifies a defect; do not expand into a general infrastructure redesign. If the
cause remains unresolved, state the blocker and continue independent work. No timeout increases,
rate-limit bypasses or disabled assertions merely to make verification pass.

## Review and merge

1. Finish the candidate and focused evidence. `pnpm check` must pass before formal review, as the
   project build process requires. An early static consultation is not a full acceptance verdict.
2. Obtain independent implementation review, followed by a fresh rules review. Repair concrete
   findings; reviewers revisit the affected changes. Do not rebuild unchanged evidence solely
   because a new reviewer reads it. Keep verification-pending distinct from acceptance-pass.
3. Prepare the integration candidate on current main. Run full `pnpm check`, pass programmatic headless application
   journeys. The full browser suite step is suspended under the
   [browser testing moratorium](README.md#browser-testing-moratorium--2026-09-20) of 2026-09-20:
   log the browser scenarios in the [backlog](browser-coverage-backlog.md) instead. When the
   moratorium is lifted, a previous run may satisfy this gate only when it covers the identical
   relevant code, tests and configuration; document that equivalence. Do not require duplicate
   branch and integration full runs when their tested trees are identical.
4. A required failure or incomplete Forge comparison blocks merge. Passing an isolated rerun does
   not erase a failed full run. Investigate, correct the cause and complete the required verification.
   This rule applies consistently to every unit; historical exceptions do not create silent waivers.
5. Merge one logical implementation commit per ancestry/class/level with the required trailers.
   Update and verify the shared playable CT114 app under the standing merge directive. Only then
   mark the unit delivered. No remote push or hosted publication is implied.

## Handoffs and progress

A handoff contains: commit and paths; implemented behavior; check results with actual evidence;
source/Forge discrepancies; review verdicts; and the precise remaining blocker or next action.
Use one compact current record plus raw artifacts. Do not spend repeated turns rewriting a long
narrative of the same result or add a new procedure after each mistake.

Report implemented, verified and merged units separately. The lead reviews completed bundles and
responds to concrete blockers; it does not continuously inspect unfinished edits. Judge progress
by working options and delivered commits, not message counts, documents or provider activity badges.
If coordination is consuming the effort without new code or verified behavior, simplify ownership
before adding more agents. No unattended monitoring or continuation is promised after a turn ends.
