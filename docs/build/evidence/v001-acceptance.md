# v0.01 integrated acceptance — 2026-09-15

Status: **pass for the confirmed v0.01 prototype**. This document maps the actual required prototype
scope; it does not certify deferred V1 behavior. The owning
[checklist](../../pre-alpha-design-gaps.md#v001-combat-acceptance-checklist) takes precedence over
proposals in individual slice plans.

## Required coverage

| Required area | Persisted verification | Live/browser verification |
| --- | --- | --- |
| Wizard, derived baseline and first admission | `character-evaluator`, `character-derived-values`, `live-state-initialization`, `characters`, `admission`, `character-review-queue`, `character-creation-rulings` and `character-rulings` tests; independent A02 source/code review | `wizard.spec.ts`: actual choices/assignment/deferred language, review and three sheet audiences; continued into combat |
| Opening, groups and turns | `combat.test.ts`: staged opening, grouping, warned departures, actual turns, exhaustion and round handoff | `combat.spec.ts`, extended wizard journey |
| Targeting, characteristic inputs and corrections | `abilities.test.ts`, `a05-review-regressions.test.ts`, `history-audit.test.ts`: real baselines, independent damage choice, source snapshots, correction window and restored target identities | Extended wizard journey: select/use/reticle, per-target edge correction, Undo/Redo, three-role reconnect |
| Fixed costs and common actions | `abilities.test.ts`, `a05-review-regressions.test.ts`: affordability before initiative and during turns, manual-effect payment, Catch Breath, Defend/Aid, immediate critical extra action; `table.test.ts` FreePlay | Table console/palette/CLI tests, extended wizard Recovery/attack journey |
| Damage, health and manual resolution | `resolve.test.ts`, `abilities.test.ts`, `audience.test.ts`, `closeout.test.ts`: source arithmetic, temporary Stamina first, winded/Slain, corrections and manual dispositions | Three-context table audit plus connected ability journey and closeout |
| Conditions and counters | `table.test.ts`, `combat.test.ts`, connected `v001-walkthrough.test.ts`: actor authority, logged toggles, manual counters and ordinary save roll | Table audit and repeated real condition operations in three connected browser contexts |
| Shared clock | `combat.test.ts`, `closeout.test.ts`: ordered work, live queue retirement, Malice/current participation, no synthetic final turn/round | Combat round transition and formal closeout; source-specific save automation remains deferred |
| History | `history.test.ts`, `history-audit.test.ts`, `v001-walkthrough.test.ts`: sequential windows, settings, exact recorded dice, aliased recreation, preparation clearing and archive floors | Connected wizard correction/Undo/Redo; table audience controls and live CLI retries |
| Closing and noncombat | `closeout.test.ts`, `closeout-session.test.ts`, `closeout-audit.test.ts`, connected walkthrough: explicit once-only Victory award, cleanup including retained foes, Void keep/reset while paused and session closure | `closeout.spec.ts`, connected wizard normal closeout and next session |
| Tests, log and readable source | `table`, `audience`, `abilities`, `content` suites: persisted complete used-action source, current audiences, dice/modifiers/outcomes and redacted history navigation | Three-context table audit, source expansion and live headless operations |
| Runtime specialization | `abilities.test.ts` and the connected walkthrough verify admitted baseline inputs, pinned foe ability snapshots and manual dispositions for unsupported clauses | Wizard/source reading and table source expansion; no claim of unique trait/trigger automation |
| Cross-cutting authority and persistence | Registry/commands/interactions, access/session, admission, audience and history suites; mutations use real persisted readback and command retries | Separate Director/player/observer browser contexts, shared command palette/console, reload and offline reconnect |

## Independent reviews and question checks

- [A02 rules/code](../audits/2026-09-15-A02-independent-review.md), with root cross-review of the
  owner-scoped queue fix and the newly confirmed Q-CHAR-2 activation policy;
  [latest character rulings](../audits/2026-09-15-A02-final-character-rulings.md) cover Q-CHAR-10/11.
- [A04 rules/code](../audits/2026-09-15-A04-independent-review.md).
- [A05 rules/code](../audits/2026-09-15-A05-independent-review.md), with root cross-review of the
  preinitiative affordability repair.
- [A06 history](../audits/2026-09-15-A06-review.md).
- [A07 closeout rules/code](../audits/2026-09-15-A07-review.md), with root cross-review of surviving
  foe temporary-Stamina cleanup and its audience.
- [Connected walkthrough source record](../audits/2026-09-15-A09-walkthrough.md) and
  [independent A09 review](../audits/2026-09-15-A09-independent-review.md).
- [Visual review](../audits/2026-09-15-visual-review.md).

All mechanics research uses the pinned local Steel Compendium. Existing answers in the owning
specifications were checked before raising questions. Q-R-1–3, 50–52, 100–103, 200 and Q-A-400,
600–601 are settled; the build does not keep their former provisional behavior. Q-CHAR-12's
potency answer and Q-CHAR-2's retain-current/downward-cap answer are incorporated. Q-CHAR-10
now permits under-budget completion with a warning; Q-CHAR-11 rejects discretionary duplicate
skills under the adopted fixed-grant-first policy. Their source and public-operation regressions
passed independent review. Resolved language question labels are removed. Later V1
wizard answers do not expand the prototype scope. The latest [question queue](../../rules-questions-for-user.md) has no open questions: Q-CHAR-7/9/13
are explicitly deferred until after playtest. Q-R-201 now specifies fresh destination-campaign
initialization; transfer/detachment/duplication are not exposed prototype workflows, as independently
checked in the A09 review. Same-campaign build edits and session restarts retain their separate policies.

## Environment and evidence

Local anonymous Convex uses port 3212 (site proxy 3213); Vite uses 5180. Authentication uses real
local accounts in browser/CLI tests. The build thread performed the authorized disposable app-table
reset, retained authentication, and reseeded the pinned 403-entry snapshot. The audit regenerated
Convex declarations and synced the combined code; declarations matched the pre-generation file
exactly. A further `pnpm content:seed` succeeded and reported revision
`fb83a789da8f0327a389c277a0c790b1648d5810`.

`pnpm check` passed: 85 engine tests plus 307 app/tooling tests (392 total), ESLint, formatting,
both TypeScript checks, 150 Markdown link checks, both vendor pins, the 403-entry content comparison,
and the production build. Vite reports an advisory about the 729 kB main JavaScript chunk; the build
passes. The final `pnpm test:browser` run passed **all 8 tests in 6.3 minutes**, including the
invitation-link repair and the connected wizard warning/combat/reconnect/history/closeout journey.
Desktop visual review passes in both themes and all three table roles.

Logs and screenshots live under ignored `.playtest/audit-2026-09-15/`, `.playtest/a07/`,
`.playtest/a08/` and `.playtest/fixes/`. `check-final.log`, `deploy-final.log` and `seed-final.log`
`browser-green.log` records the complete passing browser run; the other logs record final local checks. GitHub Actions runs the same full check plus commit-range validation;
hosted results are attached to the audit closure commit.

The independently inspected `performance-reviewed.json` sample records Chromium 153.0.8010.12,
60 real condition toggles and three reactive contexts over 84.388 seconds. Rendered event rows
increase from 24 to the 50-row cap, then stay at 50. Director/player/observer DOM counts peak at
5210/4778/1440 and finish at 5153/4721/1383. Post-GC heaps finish at 24.27/24.39/17.22 MB and still
increase after reaching the row cap; these short observations cannot establish stable long-session
memory or exclude leaks. The final browser run also writes a fresh `performance.json` sample.
The tech-stack specification has not selected a numeric prototype budget or mandatory sample
length; the A09 slice's one-hour procedure remains proposed. A shorter measured sample must not
be represented as a one-hour or six-hour certification. Broader critical opportunity
lifetime/chaining, unimplemented unique effects, inventory and the remaining V1 wizard workflows
are outside the verified prototype behavior.
