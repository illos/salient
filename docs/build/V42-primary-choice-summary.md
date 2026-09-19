# V42 — Primary wizard choice summary

Rules review: not required (presentation only).

## Owning specifications

- [Main creation and editing](../character-wizard-spec.md#main-creation-and-editing)

## Acceptance

1. Ancestry, Career, Class, Kit, and Complication show a chooser until a main choice is made;
   then show the chosen name, source reference and Edit with dependent choices below.
2. Edit hides dependent choices without changing selections; keeping the same option restores them.
   Changing the parent retains existing shared dependency pruning. Unsupported choices remain disabled.
3. Revisited/saved choices start collapsed; optional None is usable, and unavailable kit choices
   do not gain an editor. Culture and Details remain ordinary independent fields.
4. Keyboard focus follows the chooser/summary transition. Full source text stays reachable.
5. Full check suite, affected browser journeys, screenshots, independent review and shared dev
   verification pass before delivery. No persistence, schema, content or rules changes.

## Work log

2026-09-19: character/UI track in `characters-build`, branch `slice/V42` from `e28e764`.
Reusing CT114 isolated `characters` for checks/browser work. Own wizard presentation and affected
browser fixtures; V41 owns router/performance work in another worktree. Implement local presentation
state, verify draft preservation and parent switching, then review and integrate. No engine consumers
change; existing decision definitions and pruning are the authority.
