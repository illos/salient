# V17: Mobile and tablet layouts, SSR decision

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead with App team |
| Rules review | not required |
| Depends on | A08, A09 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Turn the temporary desktop UI into the mobile-optimized product: phone and tablet layouts for the
table, character sheet, wizard, campaign hub and references built on the A08 design tokens; keyboard,
touch and screen-reader operation; and a recorded decision on SSR/prerendering (TanStack Start or
stay SPA) made from a representative screen, not as a long-session fix. Behavior stays behind the
replaceable UI; no rules logic moves into components.

## Spec references

- `docs/v1-tech-stack-spec.md#3-rendering-spa-baseline-ssr-remains-optional` — SSR decision criteria.
- `docs/v1-tech-stack-spec.md#6-visual-quality-and-sustained-performance` — design system, motion, accessibility.
- `docs/v1-tech-stack-spec.md#10-remaining-implementation-choices` — SSR and library confirmation.
- `docs/character-wizard-spec.md#10-mobile-interaction-requirements` — wizard on phones.
- `docs/character-sheet-spec.md#layout-and-content` — sheet hierarchy to adapt.
- `docs/table-spec.md#confirmed-combat-layout` — table layout to adapt.
- `docs/design-mockups/v1/README.md#visual-tokens` — visual language.
- `docs/design-mockups/v1/README.md#known-departures-from-the-written-specification` — departures that must not be implemented.
- `docs/v1-spec-checkpoint.md#remaining-work-before-complete-v1-play` — item 8: tokens and components are a build deliverable.

## In scope

- Breakpoints and component set completing the A08 token system; responsive table, sheet, wizard, hub and reference screens.
- Touch targets, focus order, labels, reduced motion; Motion for meaningful transitions only.
- SSR/prerender experiment on a reference page and the campaign hub; recorded decision with measurements.
- Backgrounding stops presentation work; resume re-establishes state without replaying cosmetic effects.

## Out of scope

- Implementing mockup departures from the specs (`docs/design-mockups/v1/README.md#known-departures-from-the-written-specification`).
- Native apps or offline operation (`docs/v1-spec-checkpoint.md#release-scope`).
- Long-session memory fixes that belong to shared operation/subscription design (`docs/v1-tech-stack-spec.md#4-shared-operations-and-the-realtime-table`).

## Inputs and dependencies

- Hard: A08 tokens; A09 flows.
- Soft: V13 reference pages for the SSR experiment; otherwise use the campaign hub.

## Deliverables

- Component library and breakpoint scale documented in the A08 tokens document.
- Responsive layouts for the five surfaces; browser tests at phone, tablet and desktop viewports.
- `docs/v1-tech-stack-spec.md` implementation note recording the SSR decision and measurements.

## Acceptance checks

1. Browser tests run the v0.01 journey at 390×844, 820×1180 and 1440×900 viewports without horizontal scrolling on any step.
2. Every interactive control on the table has a minimum 44 px touch target and a visible focus state (automated audit output attached).
3. Screen-reader labels exist for every table control; axe audit reports zero critical violations.
4. With reduced motion enabled, each transition still communicates the resulting state (screenshot pairs).
5. The SSR note records first-contentful-paint and bundle size for SPA versus the alternative on the same screen, and the decision follows the recorded criteria.
6. Backgrounding the tab for five minutes and resuming shows current state with no replayed animations and no growth in retained subscriptions.

## Rules research

None.

## Open questions

Candidate `Q-V-n` entries:

- Exact screen order and visual design of the wizard (`docs/character-wizard-spec.md#10-mobile-interaction-requirements`, "remain open").
- Whether to adopt TanStack Start (`docs/v1-tech-stack-spec.md#10-remaining-implementation-choices`) — an engineering decision to record, not a user question unless costs conflict with product constraints.

## Work log

_Empty._
