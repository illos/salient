# V96: Character builder rail

Rules review: not required. Depends on: V75 (Quiet theme).

## Goal

Compact the character wizard's left rail so the centre column gains room, and drop the two
presented steps that record nothing the builder needs: the step rail is headed "Character
Builder" with the Making a Hero reference, the current step is marked by its accent number badge
instead of a pip, and the Think, Add Free Strikes and Make Connections steps no longer appear.
Presentation only: the decision content, the evaluator and the headless character routes are
unchanged.

## Scope

- `web/wizard/rail.tsx`: heading with the chapter reference, muted "Step n of m", compact rows,
  accent badge on the current step, no pip.
- `web/wizard/index.tsx`: hide `step.think`, `step.free-strikes` and `step.connections`, number
  the presented steps from one, narrow the rail column.
- `web/wizard/presentation.ts`: remove the unused source-number helper.
- Out of scope: the decision definitions (`presentedInV001` stays content data), the
  `connections.notes` headless route and its sheet field, the centre and hero-so-far columns.
- docs/character-wizard-spec.md#main-creation-and-editing

## Acceptance checks

1. `node_modules/.bin/prettier --check`, `eslint` on the three files and `tsc --noEmit` pass.
2. Rendering the wizard for a new character lists Ancestry through Determine Details as steps
   1–7 with no Think, Add Free Strikes or Make Connections row; the rail heading reads "Character
   Builder" beside a rulebook link labelled "Read Making a Hero in the rules".
3. Headless: `characterWizard.discover` still returns the `think.prompts`, `free-strikes.grant`
   and `connections.notes` decisions, and an evaluated build still lists both free strikes with
   base Disengage 1 and saving-throw threshold 6 (content unchanged); no app test changes.

## Work log

- 2026-09-21: branch `slice/V96` in `.worktrees/wizard-ui` from main `1115380`. User direction in
  the "Bridge Wizard UI and Progression" thread: accent badge instead of the pip, compact rail,
  replace Think with a "Character Builder" title linking Making a Hero, cut Make Connections.
  Presented steps are renumbered 1–8 (V21 had kept the book's numbers to show the Complication
  gap; that gap closed in V85). Browser scenarios logged in the backlog under the moratorium.
- 2026-09-21: the user asked whether Add Free Strikes offered any choice. It does not: one
  `automatic` decision of shape `none` granting the melee and ranged free strike to every hero,
  both already shown in the hero column and on the sheet, and the one decision the source names
  there ("it's up to you to decide what exactly your free strikes are") is authored flavor that
  belongs to Details. Hidden on the user's instruction; presented steps are now 1-7.
