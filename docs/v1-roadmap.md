# Current direction

## Version one

Version one is nearing feature completion. The project is entering a phase of testing the connected
play experience and designing and refining the UI. Finish and verify remaining behavior against the
owning specifications, then use real play and focused UI review to find gaps and improve usability.
This is the only current milestone; earlier prototype, track, level, and release-target plans are
historical planning records rather than additional delivery gates.

Report what works in the application, what was tested, what still needs manual resolution, and what
remains open. Source ingestion, character build support, compiler recognition, UI presentation, and
persisted gameplay are separate kinds of progress. A feature that changes state needs proof through
the shared UI/CLI/API operations and a readback of the saved result. UI design should be reviewed in
the working application, with concrete feedback on flows, layout, accessibility, and responsiveness.

The [build tracker](build/STATUS.md) records slice history and current work. The
[browser coverage backlog](build/browser-coverage-backlog.md) records table scenarios deferred until
the [table browser harness repair](build/V66-browser-test-harness-repair.md); focused non-table browser
testing may proceed through the [testing process](../testing-process.md). The user-assigned test
coordinator owns test execution; the user-assigned deployment coordinator owns integration and cloud
dev promotion.

Historical links to earlier roadmap sections resolve here:
<span id="current-v1-release-target--confirmed-2026-09-22"></span>
<span id="confirmed-development-tracks--2026-09-15"></span>
<span id="starting-implementation"></span>
<span id="current-discussion"></span>
The earlier target and track plans are preserved in the linked slice, decision, and checkpoint records
below; they no longer set current milestones.

## Owning documents

Detailed product behavior stays in the [table](table-spec.md),
[character wizard](character-wizard-spec.md), [accounts and access](accounts-and-access-spec.md),
[inventory](inventory-spec.md), [monster catalog](monster-catalog-spec.md),
[reference library](reference-library-spec.md), and [data architecture](data-architecture-spec.md)
specifications. The [rules adaptation principles](rules-adaptation-principles.md) govern automation
and manual resolution. The [build process](build/README.md) and
[testing process](../testing-process.md) govern execution.

Earlier V1 breadth decisions remain recorded in the
[2026-09-22 target slice](build/V111-v1-release-target.md) and
[2026-09-24 foe roster decision](decisions/2026-09-24-v1-foe-roster.md). They provide product context
where an owning spec still cites them; they do not establish separate current milestones. The
[V1 specification checkpoint](v1-spec-checkpoint.md) and dated handoffs preserve earlier planning
history.
