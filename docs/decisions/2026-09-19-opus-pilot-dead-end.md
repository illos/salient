# Abandoned: Opus character pilot

**Final user decision, 2026-09-19:** the entire Opus pilot is a dead end. Remove its work from
main and do not salvage or reuse it. This supersedes the earlier temporary quarantine and the
assistant's proposal to recover selected code.

The abandoned work includes pilot implementation, tests, fixtures, Forge captures, source ledgers,
interpretations, reviews, diagnostics, signup pacing, backend-health experiments, broker wrappers
and orchestration procedures. A passing review or useful-looking fragment does not authorize its
reuse. Do not cherry-pick, copy, adapt or use these artifacts as expected results or design input.
Research and implement again from current main, the pinned sources and pre-pilot project material.

No pilot application or test change reached main. The pilot's main documentation changes were
removed; this decision and the new Astra workflow replace the temporary quarantine guidance.
Application, runtime, scripts, tests, dependencies and source pins still match pre-pilot
`88d1e61793939feedf37ec88181e128fd721364e`. Earlier V25/V32/V37 work and the V45 foundation remain.

The pilot ran for approximately six hours eighteen minutes without a fully verified merged option
unit. Fresh Astra audits found that the lead coupled all implementation to one failing merge gate,
while repeated evidence errors, missed handoffs and infrastructure investigations consumed the
critical path. Three available workers did not become three implementation lanes. This is recorded
as a failed development approach, not unfinished work to resume.

Opus threads and child reviewers are stopped. The old isolated `characters` environment is stopped
and must not be reused for the restart. Historical artifacts and Git objects remain in cold archives
outside the active main tree for accountability only; history was not rewritten. They are not a
candidate queue. Do not consult the archives while implementing the replacement.

The replacement is [Astra character delivery](../build/astra-character-workflow.md), staged for a
[fresh session](../build/character-restart-handoff.md). This decision does not start implementation
or waive the user's source, counterpart, review, commit or merge requirements.
