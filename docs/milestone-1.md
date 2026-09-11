# Milestone 1: headless combat experiment

Status: implemented and cross-reviewed on 2026-09-10. All eight acceptance items below have evidence in the [review report](milestone-1-review.md); type checking and 28 behavior tests pass. This is an isolated local experiment, not the deployed Convex app or a claim of complete Draw Steel support.

## Outcome

Run selected actions between a prepared level-one devil Fury and Goblin Warrior, then include a Goblin Spinecleaver squad. Show complete ability text, parsed effects, applied state changes, and any manual work. Save the record and navigate backward/forward without invoking modifiers.

TypeScript is the prototype language; Node 24.12+ runs its erasable syntax directly. The core exposes JSON-serializable interfaces with no database or UI dependency. Local JSON run files are experiment artifacts. Convex remains the selected application backend, to be integrated after this experiment.

## Team boundaries

- Content/parser: `src/content.ts`, `src/parser.ts`, fixtures, and parser tests. Source-grounded hero choices; source-preserving loaders; generic supported grammar with explicit diagnostics.
- Resolution: `src/engine.ts` and engine tests. Deterministic computation, supplied dice/facts, actual state changes, and squad behavior. No filesystem or UI.
- History/CLI: `src/history.ts`, `src/cli.ts`, and their tests. Persist input before modifier execution, preserve outputs and before/after states, manual changes, duplicate-command handling, and history navigation.
- Integration: shared contracts, package setup, acceptance scenarios, cross-review, and final results.

`src/contracts.ts` is the shared boundary. Changes require coordination; the teams should not build parallel incompatible models.

## First supported slice

Prioritize ordinary Spear Charge use and Brutal Slam, then a resource/condition ability and squad damage. Validate chosen fixture values against source text. Unimplemented passives or branches must be visible and either require explicit manual handling or prevent an automated result that depends on them. No name-specific damage handlers.

Target and spatial facts are supplied by the table. Movement can be a pending table instruction. Fixed supplied rolls make checks reproducible. Automatic initiative, all common actions, full spatial geometry, all Fury features, and a character wizard are outside this milestone; their absence must be documented accurately.

Manual completion/correction uses the same state/history boundary. The prototype preserves future records and refuses new actions while the history cursor is in the past; branching is deferred. These are reversible experiment choices, not permanent product policy.

## Acceptance and review

1. Load real pinned source content and a documented hero fixture; inspect full ability text and support status.
2. Resolve selected actions with independently sourced expected outcomes; verify actual stored changes and resource handling.
3. Exercise a missing spatial fact and an unsupported mechanic; manual completion is visible and reversible.
4. Exercise a minion squad case with correct pooled state, or explicitly report any remaining unsupported squad branches.
5. Save/reopen a run, step backward/forward, and recover identical recorded states without calling the parser, engine, or dice roller.
6. Reject duplicate/conflicting submissions and invalid inputs without corrupting state/history.
7. Exercise a previously unimplemented ability and homebrew changes through the shared grammar before adding special handling.
8. Run type checking and focused behavior tests, then have agents cross-review source fidelity, state transitions, and recovery. Fix material findings and report remaining limits.

Keep the implementation small and reviewable. No external deployment, production data, dependency update, or new process framework is part of this milestone.
