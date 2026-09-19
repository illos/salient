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
5. Full checks and affected browser journeys pass; independent review passes before integration.
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
