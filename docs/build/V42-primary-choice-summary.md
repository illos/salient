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
5. Full check suite, affected browser journeys, screenshots and independent review pass before integration.
   No persistence, schema, content or rules changes.
6. Lead records shared development delivery and changed-feature checks after review.

## Work log

2026-09-19: character/UI track in `characters-build`, branch `slice/V42` from `e28e764`.
Reusing CT114 isolated `characters` for checks/browser work. Own wizard presentation and affected
browser fixtures; V41 owns router/performance work in another worktree. Implement local presentation
state, verify draft preservation and parent switching, then review and integrate. No engine consumers
change; existing decision definitions and pruning are the authority.

Implementation uses one presentation wrapper around the existing main DecisionEditor and the other
step decisions. Saved optional absence displays None; unsaved explicit None is remembered across
step visits. Opening Edit or keeping the existing raw value does not invoke selection/pruning or
mark the draft dirty. Full source references remain on the summary, including pool-based kits.

Initial lint caught React's ref-analysis rule on a callback passed to the chooser render function.
Focus requests now use state, with DOM ref access confined to the effect. Independent static review
also caught unchanged None being marked dirty and its confirmation being lost across step visits;
both are fixed and covered by the browser journey's unchanged-revision readback. The retained
initial lint log records the failure; final verification follows below.

The full check suite passed 674 tests plus all content/build stages. Six distinct browser journeys
passed: focused primary-choice interaction, layout, Elementalist, supporting choices, private
inheritance and unsaved entry. The broader Fury scenario passed the changed wizard/save flow in
both attempts; its first attempt also passed campaign review and all sheet audiences before the
existing table stress extension encountered one-second query timeouts. Its bounded retry hit the
same backend limit during admission. The full broader journey remains explicitly unverified;
[retained evidence](evidence/V42/README.md#regression-timeout) and the performance handoff distinguish
this limitation from the passing wizard acceptance. No assertions or runtime limits were weakened.

Final review also tightened the None summary guard to require an actually absent raw value; an
unrecognized saved selection must keep its chooser/diagnostics. Targeted lint/build and V42/V40
rechecks cover that final presentation condition before integration.

Final lint/types/build passed, followed by both V42/V40 browser journeys (36.2 seconds), against
the reviewed None guard. All eight final changed code/test files byte-match the tested CT114 source.

Independent [review](reviews/V42-primary-choice-review.md) passed the bounded implementation gate;
acceptance 1–5 verified with the broader runtime limitation explicitly retained. Shared delivery
(acceptance 6) follows integration and is recorded separately.
