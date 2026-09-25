# Provisional architecture cleanup pass

Recorded 2026-09-25 at the user's request. **Proposal only: implementation is not scheduled or
authorised by this document, and this is not a V1 release gate.** Reassess scope after the current
work settles and hands-on playtesting identifies the most useful changes. Follow the
[current project direction](v1-roadmap.md) and [build process](build/README.md) when work is selected.

## Basis and assessment

The architectural review sampled merged main at `e70a482c369e7f20eb7e6d03d62b30017c46c201`.
It traced source parsing, shared resolution, table operations, persistence, character evaluation
and UI boundaries, and inspected existing tests and execution logs. It was not an exhaustive
correctness audit or a review of unfinished branches. Main has advanced since that review; the
observations below are a historical baseline to check before implementation.

The architecture is coherent and worth preserving: bounded source compilation, pure resolution,
shared authorised operations, command deduplication, and a journal of before/after state. The
proposed work consolidates those foundations. It does not replace the engine or expand automation.

The main concerns observed were:

- `convex/lib/abilityOperations.ts` had 4,013 lines covering activation, payment, damage, effects,
  reactions, corrections and recording. The concern is the number of interacting responsibilities,
  not a line-count target.
- The original `src/` engine and its adapter remained alongside the live `shared/resolve` pipeline
  and its compatibility path. Their roles need to be explicit before any removal is considered.
- Important stored compiled results, resolution inputs and trigger payloads used `v.any()` in
  `convex/abilityTables.ts`, weakening validation at the persistence boundary.
- Character evaluation combined shared profiles with class-specific branches and an explicit chain
  of ability-grant functions. The extension pattern could be more consistent.
- Some architecture notes and comments described boundaries superseded by subsequent slices.
- The compiler recognises bounded wording, often through regular expressions; resolution rechecks
  portions of the parsed meaning. Contract simplification may help, but source reconciliation and
  rejection of unsupported mechanics must remain intact.

## Proposed scope and rough size

| Work | Provisional size | Intended result |
| --- | --- | --- |
| Refresh the architecture map and clarify old engine responsibilities | 1 small slice | A contributor can identify the authoritative live pipeline, remaining consumers and compatibility boundary. Remove old code only after verifying consumers. |
| Separate ability execution responsibilities | 2–3 substantial slices | Clear activation, calculation, application and recording boundaries; correction and reaction ordering remain explicit. |
| Strengthen stored payload validation | 1–2 slices | Runtime validation agrees with the intended result and trigger contracts, including supported historical formats. |
| Standardise character-class integration | 1–2 slices | A consistent extension pattern with preserved grant order, provenance and class-specific behaviour. |

Planning allowance: **roughly 5–8 focused slices and perhaps 3–7 elapsed days** with the existing
agent, review and test-coordination setup. This is a low-confidence estimate from the review, not
a delivery commitment. Re-estimate against the integrated code before starting; ordering issues,
test failures, review availability and shared-file contention can materially change the effort.

The difficult part is preserving resource spending, damage, triggered effects, corrections and
undo in their exact order. Moving functions between files is only a small part of that work.
Central execution changes should proceed sequentially rather than having several agents
reorganise the same path concurrently.

Parser contract changes and UI component cleanup are follow-up candidates, not additional
commitments hidden inside the estimate. Choose them only when the detailed review or playtesting
demonstrates a concrete benefit.

## Suggested sequence

1. Continue hands-on app testing and UI refinement; this cleanup need not precede them.
2. Refresh the architecture map and clarify the old engine first, accounting for documentation
   work already merged since the review.
3. Prioritise ability execution consolidation before another major expansion of automation.
4. Tighten stored contracts alongside the relevant boundaries as practical.
5. Let observed maintenance problems and playtesting determine character and UI cleanup priority.

Register implementation slices only when the work is selected. This proposal assigns no slice IDs
or owners and creates no automatic backlog of approved work.

## Behaviour preservation and acceptance

- Structural refactoring should make no intentional changes to rules, automation eligibility,
  permissions, public CLI/API behaviour, persisted outcomes, correction semantics or undo.
- Keep newly discovered bugs and new features in separately reviewable changes. Do not silently
  alter behaviour to make an extraction easier.
- Preserve pure calculation boundaries, source provenance, explicit unsupported/manual work,
  stable command identities and journaled state restoration.
- Use the existing relevant persisted-state journeys as the behavioural baseline, with tests
  coordinated under [testing-process.md](../testing-process.md). Add tests only for concrete gaps
  exposed by the change; avoid tests that merely freeze the new internal structure.
- Give particular attention to resource timing, reactions after subsequent damage, effect
  lifetimes, multi-target operations, correction and undo. These cross-system interactions are
  the main risk of the central refactor.
- Follow the existing table-browser testing restriction and record needed scenarios in the
  [browser coverage backlog](build/browser-coverage-backlog.md).
- Judge completion by clearer responsibilities and unchanged observable behaviour, not by a
  target number of files, abstractions or deleted lines.

## Evidence boundary

The review inspected the accepted V179 gate log: exit 0, 458 engine tests and 946 app/scripts
tests. It also sampled source-contradiction tests and journeys with persisted readback. Those are
historical results for the reviewed implementation, not acceptance evidence for future refactors.

At that baseline the live support report listed 182 reachable compiled abilities. Compiled
abilities could still include manual table instructions, and the report covered a broader catalog
than the V1 target. Neither this count nor a passing gate establishes full automation or polished
table interaction. See the [support report](build/evidence/V72/support.md), which evolves with code.
