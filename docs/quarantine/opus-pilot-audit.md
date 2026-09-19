# Independent review of the Opus character pilot

Three fresh Astra agents separately audited the timeline, earlier character delivery, and the
pilot's tests/processes. This report summarizes their findings. They inspected Git objects,
retained artifacts and original Chords records; they did not resume implementation or run
application tests. The pilot remains [quarantined](opus-pilot-20260919.md).

## Finding

The pilot was ineffective primarily because its execution design turned one ancestry's unresolved
verification into a dependency for the entire implementation queue. Repeated mistakes in code
verification, evidence handling and runtime coordination then consumed that serial path. Three
Opus threads were available, but they were not three implementation lanes.

The recorded pilot window is 16:41:16–22:59:18 UTC on September 19: approximately **6 hours
18 minutes**. It produced **zero fully verified, merged option units**. That is elapsed time,
not measured coding time or six hours of continuous work by every agent.

## What went wrong

1. **The lead conflated implementation release with merge readiness.** The user asked for one
   reviewed trial, meaningful mistakes to be reported, and then batching; full verification was a
   separate merge requirement. Root accepted the repaired V46 implementation and rules reviews at
   20:51:32 (Chords 391), then seventeen seconds later assigned Human preparation only because the
   full browser gate remained open (394). The stronger dependency was the lead's interpretation.
   Independent implementations could have progressed while their merges remained gated. Early
   defects justified review and repair; they did not justify indefinitely coupling every unit to
   infrastructure diagnosis.
2. **The verification baseline and acceptance treatment were inconsistent.** Pre-pilot V45 was
   accepted after a full batch with four failures followed by four unchanged passing reruns. V46
   similarly had five failed cases pass unchanged in isolation, yet the whole-suite condition
   continued blocking the entire queue. Known signup-limit and backend-timeout families were
   already present. This does not establish that V46 should have merged: its evidence had genuine
   defects and the runtime later failed. It does establish that the workflow lacked a consistent
   treatment of those known failures.
3. **Evidence errors repeatedly generated more work.** Reviews found evaluator-derived expected
   values, weak preservation assertions, stale logs attached to newer candidates, and purported
   readbacks that contained expected constants. Later diagnostics lost their raw files during
   source replacement; a focused browser run lost its full output; a collector silently produced
   nothing; subsequent reports miscounted failures and confused timestamp meanings. These were
   substantive authoring and review mistakes, not merely documentation preferences.
4. **Coordination and diagnostics became another source of failure.** A shared test slot serialized
   jobs across multiple owners. Chords messages were queued without interrupting active turns;
   observed send-to-ack intervals reached about twenty minutes while jobs continued. Root attempted
   a duplicate full run and added its own logger alongside an existing capture. Three log followers
   shared the backend's 3 GiB memory limit. Their material memory use is established; that they
   caused the later OOM is not. A marker-only health check then reported healthy after backend loss.
5. **Effort accumulated without delivery.** The first V46 commit arrived roughly 79 minutes after
   branch creation; later repairs and evidence continued for hours. Retained V46 browser summaries
   alone account for 72 minutes across whole runs, reruns and a supplement. Main received twelve
   pilot-period documentation commits and no new application behavior. Some documentation was
   requested and some reviews were valuable, but neither became effective control of the work.

Root owns the assignment/gate decisions and runtime coordination, and contributed its own errors.
Opus implementers and reviewers also made repeated meaningful mistakes. The evidence supports both
findings; blaming one model alone would conceal the orchestration failure.

## Comparison with earlier delivered work

| Earlier work | Delivered result | Recorded outcome and timing |
| --- | --- | --- |
| V25 Polder / Fire Elementalist | A second playable ancestry/class path and generalized build support, with deliberately limited options | Real Forge reference, source audit, independent reviews and persisted browsers; delivered. Implementation followed the first assessment by about 1h44m, but shared rollout took several additional hours. |
| V32 Fury progression | Level 1→2 advancement, preserved live state, history and reviewed restoration | Real Forge level-up/reimport evidence and independent reviews; delivered. A visible capture-to-authorship segment was about 1h23m, but integration stretched across a day. |
| V37 supporting choices | 289 source records across careers, culture, skills, languages, perks, kits and complications | 648 tests, source/Forge comparisons, independent review and shared journeys; recorded claim-to-shared-closeout window **1h31m45s**. |
| V45 shared foundation | Separated ancestry/class modules and preserved existing behavior | 691 tests, 5,584 exact comparisons, reviews and shared rollout; recorded plan-to-closeout window about **1h21m**. |
| V46 pilot | Complete level-one Devil options on a branch | Thirteen genuine Forge counterparts and accepted code/rules reviews, but no merged delivery after **6h18m**. |

These are milestone windows, not metered labor or matched benchmarks. Earlier work was not uniformly
fast: V25 and V32 had delivery delays. The original minimal Fury/Devil A02 commits explicitly credit
Claude Fable, so they are not clean Astra-only comparison evidence. Later work was Codex-led; Git's
common author identity alone does not establish its exact model.

V46 is broader than the older single Devil path, adding five purchased traits and twelve skill
choices. Its thirteen authentic exports explain much of its artifact volume. However, V25 added a
usable second class path, V32 added a persistent progression workflow, and V37 delivered broad
supporting choices. Those earlier deliveries already used rigorous source verification, Forge
comparisons, independent review and persisted browser evidence. Rigor was not new to the pilot.

## What the evidence supports doing differently

Keep implementation progress separate from final merge acceptance; use independent branches for
independent work. Apply one explicit acceptance standard to known test-environment failures. Carry
forward valid evidence for unchanged behavior, and repeat checks when a specific change or failure
requires it. Keep one runtime/capture owner and compact factual handoffs. Do not convert each
coordination mistake into another prerequisite that blocks the whole queue.

These are audit conclusions, not authorization to resume work or install a replacement process.
No reliable token totals or matched model comparison were retained. The pilot did not demonstrate
lower ChatGPT expenditure; it cannot establish an intrinsic Astra-versus-Opus efficiency ratio.

## Independent source reports

The three reports and selected original records are retained locally at
`/srv/presidium/projects/salient/audit-opus-pilot-20260919/`:

- `timeline.md`, `timeline-chords-evidence.json`, `timeline-v46-reflog.txt`.
- `earlier-comparison.md`.
- `process-and-tests.md`.

Key immutable repository evidence: pre-pilot `88d1e61`, pilot main `7e5f50f`, V46 `b2c660a`,
V51 `a2279a0`, V52 `0987595` and `725da76`, V55 `d218a31`, integration `ba8c6e6`; earlier V25
`4cb3f1f`, V32 `73b7ab4`, V37 `6eeaf5b`/`0993e51`, and V45 `ebe66e2`/`88d1e61`.
