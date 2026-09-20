# Astra character delivery

Status: implementation resumed at the user's request; verification queued separately on 2026-09-20. The Opus pilot is
[abandoned without reuse](../decisions/2026-09-19-opus-pilot-dead-end.md). Fresh implementation is underway. This document owns the replacement character workflow; [V44](V44-character-option-delivery.md)
owns its delivery scope, and [the build process](README.md) retains project-wide review and merge rules.

## Ownership and parallel work

Use an Astra lead and native Astra subagents. One implementer owns one ancestry/level or class/level
unit in a new worktree from current main. Start with two independent units, Devil level one and
Polder level one; neither depends on the other's merge. Use the remaining agent capacity for an
independent review or a concrete shared/runtime blocker. Do not resurrect the external Opus fleet.

The lead owns shared-file integration, runtime scheduling and delivery. Implementers own their
unit through source research, code, focused tests and correction of review findings. Native
collaboration carries assignments and results; Chords coordinates with other project threads,
not a separate worker scheduling system. Never invent a sender identity to resolve a mapping error.

Only shared-file edits, use of a shared runtime slot, and merges are serialized. Unit implementation
continues while another unit waits for review or runtime verification. A failed merge gate blocks
that merge, not unrelated coding. The initial two-unit limit was expanded by the user on 2026-09-20: keep Devil/Polder in the
verification queue, assign a subagent the closeout blocker, and implement two further ancestries
(Dwarf/Human) concurrently. The initial batch now has passing remote headless proof. On 2026-09-20 the user authorized
current-main integration and the next pair, Hakaan (V70) and Orc (V71); reference acceptance remains
explicitly separate. Finish this bounded pair before adding more units. Failed required
verification still blocks its merge; it must not block independent development.

## Unit contract

At assignment, record only: unit/level, branch and owned paths, source entry points, acceptance
cases, shared dependencies and next handoff. Use the existing slice document and `STATUS.md`.
Allocate a new slice ID; never reuse the abandoned pilot's IDs or branches.

Each unit must cover all eligible choices at its level, prerequisites, budgets, grants, permanent
values and readable manual effects. Keep gameplay automation outside this editor task. Preserve
existing saved decisions, progression, privacy and live-state behavior. A shared primitive needed
by multiple units is a separate focused change owned by the lead, not duplicate implementations.

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
headless result first, then browser-only discoveries; existing browser passes are not this proof.

During implementation, run focused checks for the changed mechanism: choices/budgets, grants and
derived values, parent replacement, persisted save/reload and applicable history/live-state cases.
Reuse the existing test runners and pre-pilot helpers. Do not create a new test framework, limiter
replica, diagnostic service or logging pipeline to complete a unit.

Keep a compact option-to-witness table. Every newly supported option must be checked against a
legal completed Forge build with the same choices in Salient. Combine compatible options and reuse
valid pre-pilot counterparts where they actually cover unchanged behavior; never use pilot exports.
Retain authentic exports, readable evidence and observed Salient readbacks. Source expectations
remain independent of both implementations. Explain discrepancies; do not label a gap a pass.
Follow [the reference procedure](character-verification.md). UI walkthroughs cover meaningful user
journeys; pure tables cover mechanical variations without multiplying redundant browser assertions.

## Runtime and failure handling

All installs, servers, builds and browser tests run on CT114 through the existing broker. Use a new
explicitly named environment for the restart; do not reuse the stopped `characters` slot or its
anonymous deployment/data. Preserve the user's shared main environment and its data. Follow the
[remote runbook](../remote-development.md); do not copy pilot wrappers or patch the broker ad hoc.

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
