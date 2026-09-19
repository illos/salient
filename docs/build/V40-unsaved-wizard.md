# V40 — Unsaved character wizard entry

Rules review: not required (creation persistence and UI only).

## Owning specifications

- [Main creation and editing](../character-wizard-spec.md#main-creation-and-editing)
- [Shared operations](../character-wizard-spec.md#9-shared-operations-and-reliability)

## Scope and acceptance

1. Opening the wizard needs no name and creates no character; unsaved Exit/reload creates nothing.
2. Naming is inside Details; blank first save directs the user there without writing records.
3. First explicit save atomically preserves authored text and choices in one character/revision;
   retries cannot duplicate it; validation failures write nothing; normal access controls apply.
4. Later saves and reopened edits retain identity, choices and existing revision protections.
5. Implementation gate: all check stages and affected browser journeys pass; independent review
   follows the code/evidence checks and precedes integration.
6. Integration and actual shared development verification are recorded separately from branch checks.

## Work log

2026-09-19: user requested draft-first entry. Track: characters; worktree
`/srv/presidium/projects/salient/characters-build`, branch `slice/V40` from `6ddb3cb`.
CT114 isolated `characters` environment for backend/build/browser validation. Changes touch the
character list, wizard route/state, creation mutation and its shared validation, affected browser
fixtures, and owning specification. Existing create callers remain compatible via optional selections.
No source pins, game mechanics, schema, engine automation or content changes.

Validation planned: full `pnpm check`; first-save unit tests; new unsaved browser journey plus
existing wizard, Elementalist and layout journeys; screenshots and authenticated persisted readback.

Validation: lint/types and all 674 tests (274 engine, 400 app/tooling) passed. The aggregate command
then found a pre-existing V39 review link to a renamed activation heading. Corrected that link
without changing the historical review and resumed the remaining link/source/build stages.
Subsequent browser/review work fixed the new-to-saved route hook count and blocked custom edits
while a save is pending; final focused lint/types/build and browser evidence cover those changes.
Earlier compile/lint catches removed
unused creation-form imports and corrected the typed router link.

Final browser coverage: nine distinct scenarios passed across the focused unsaved-draft journey,
seven regression cases, and the complete Fury/admission/three-audience/table journey. Retained
[verification evidence](evidence/V40/README.md) distinguishes initial selector errors, the fixed
route transition, and a transient anonymous-backend table query timeout from passing runs.
The bounded table retry passed in 3.8 minutes without changing table behavior or execution limits.
All 13 changed code/test files byte-match the tested remote source. No schema migration or seed is needed.

## Integration and shared verification

Independent [implementation review](reviews/V40-unsaved-wizard-review.md) passed. Both actual
commit-trailer gates passed; main fast-forwarded through spec `00ac99d` and implementation
`af69671b6469ecaaf55e1374d9cbb5a859e13f5d`. `presidium-dev up` updated shared CT114 `main`,
compose `salient-dev-b90776c53141`, at the established
[development URL](https://salient-dev-fc4f48cb09a0.tail41404c.ts.net).
Backend/frontend are healthy; compatible data volumes and source pins remain intact. No schema
migration, content reseed, data reset or hosted release was needed or performed.

Both shared browser checks passed in 32.1 seconds, including actual authenticated record-count,
first-revision and later-save readback. [Shared evidence](evidence/V40/README.md#delivery) closes
acceptance 6 independently of the pre-merge review. Peer-owned performance-audit files remain
untracked on main and are excluded from these commits. The isolated `characters` test services
were stopped after delivery, preserving data. Final documentation changes have no runtime effect.
