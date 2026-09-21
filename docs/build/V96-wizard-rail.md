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
  accent badge on the current step, no pip; a decided step reads its chosen value in place of the
  step name, and carries the step navigation at its foot.
- `web/wizard/index.tsx`: hide `step.think`, `step.free-strikes` and `step.connections`, number
  the presented steps from one, narrow the rail column.
- `web/wizard/presentation.ts`: remove the unused source-number helper; name the details step
  Finalize in the wizard while its reference keeps the source step name.
- `web/wizard/culture-preset.tsx`: replace the starting-culture dropdown with a card grid,
  grouped ancestral, professional, then bespoke, each card showing the choices that preset makes
  as chips.
- `web/wizard/index.tsx`: a chosen preset renders its fixed aspects read-only in the wizard, with
  Build your own as the way to set them individually.
- `web/wizard/choice-list.tsx`, `web/rules/reference.ts`: an option row is a card with the name at
  the left of a header, its metadata at the right and its own rules text below, read from the
  already-loaded rules catalog; the control is screen-reader only.
- `web/wizard/primary-choice.tsx`, `choice-list.tsx`: a settled main choice is reported by the
  step header, so the chooser component renders only the chooser or the dependent choices.
- docs/character-wizard-spec.md#confirmed-behavior (the 2026-09-21 amendment)
- docs/character-wizard-spec.md#main-creation-and-editing (the 2026-09-21 header amendment)
- `web/wizard/index.tsx`, `header.tsx`, `rail.tsx`, `hero-so-far.tsx`: the wizard is one
  scrolling document. The page scrolls, the header scrolls with it, and the two side panes stick
  to the viewport, scrolling inside themselves only when taller than it.
- Out of scope: the decision definitions (`presentedInV001` stays content data), the
  `connections.notes` headless route and its sheet field, the table's own `.session-shell`
  full-viewport frame, which keeps its independently scrolling panes.
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
- 2026-09-21: culture step relaid out from the user's Forge Steel reference screenshot, in Quiet
  rather than Forge's chrome: sentence-case group labels instead of tracked uppercase, no
  per-card category badge (the group heading already says it), and the aspects shown as chips of
  the actual choices rather than a prose description, on the user's follow-up. Cards are native
  radios in one group, so the value still moves through the shared choice transition.
- 2026-09-21: the user asked that choosing a premade culture lock its choices in. Implemented in
  the wizard only, over the V84 out-of-scope line "locking a preset's defaults": the source says a
  player may "use or modify" a table culture, but Bespoke reaches every combination, so no legal
  character becomes unbuildable. Locked are environment, organization, upbringing and a preset's
  printed language; the three skills and a professional preset's language stay choices. The shared
  transition still accepts a modified preset and still marks it Bespoke, so the headless route is
  unchanged.
- 2026-09-21: ancestry trait rows now show the trait's text. The option records carry a source
  path but no prose, and the rules catalog already holds an inline excerpt for every entry, so
  `ruleExcerpt` resolves it through the existing `resolveRule` path mapping with no extra fetch.
  Checked against the built catalog: all 161 point-budget options across every ancestry resolve to
  text, none missing. The text wraps under the name rather than filling the truncated description
  column, so a two-sentence trait stays readable.
- 2026-09-21: option rows restyled to cards on the user's instruction: no visible checkbox or
  radio, since the accent ring already marks selection, and the name and point cost read as a
  header line. The control stays in the markup as `sr-only`, so keyboard and assistive-technology
  selection is unchanged. Applied to every `ChoiceRow`, not only ancestry traits, so the wizard
  selects consistently with the new culture cards. Dropped the `description` and `facts` props at
  the same time: no call site passed either, and the truncated middle column they fed is gone.
- 2026-09-21: a decided step now shows its value instead of the step name, rather than both. The
  accessible name keeps the step (`2. Ancestry: Devil`) so the row still says which step it is and
  still contains its visible text; the title attribute is unchanged and the outstanding-count
  badge still appears, since a step can be decided and still owe sub-choices.
- 2026-09-21: step navigation moved out of the centre column to the foot of the rail, under the
  progress bar. Back is an arrow-only icon button (its accessible name and tooltip still say where
  it goes, since the rail names the steps); forward names the step it leads to and truncates in the
  narrow column; the last step keeps Save and close. The centre column is now only the step.
- 2026-09-21: layout changed from three independently scrolling full-height columns to a scrolling
  page with sticky side panes, on the user's instruction; the header scrolls too, so the panes
  stick at one page gap from the top rather than under it. The panes keep a max height of the
  viewport less two gaps with `overflow-y-auto`, so a long hero column still scrolls inside its
  sticky box while a short rail shows no scrollbar. The centre column no longer scrolls
  independently; `[data-wizard-pane="centre"]` remains on the same element, but the obsolete
  browser assertion reads its scrollTop and will need rewriting against the document.
- 2026-09-21: choosing a step's main option now replaces the step title, description and
  reference with that option's own, with Edit beside the title, instead of leaving a summary line
  under the step header. The open state and the post-choice focus move lifted from PrimaryChoice
  into the wizard, since the header they act on belongs to the wizard; PrimaryChoice is now just
  the chooser-or-children switch. The primary decision's diagnostics render under the header while
  the chooser is closed, so a settled choice with an outstanding problem still says so.
- 2026-09-21: "Determine Details" is named Finalize in the wizard, on the user's instruction. The
  v0.01 scope line asks for the book's step names, so this is an explicit amendment rather than a
  drift: the override is one entry in a wizard-only map, the step's rulebook reference still
  resolves to "9. Determine Details", and the step description is still the source sentence.
- 2026-09-21: refinements from the user's full-wizard mockup (attachment, 2026-09-21):
  - Rail: completed percentage beside "Step n of m" with the accent progress bar under the
    heading instead of at the foot; the current step row takes a `sub` fill; the outstanding
    count reads as a plain muted number; the forward button is a pill; a hint line under the
    navigation says what the step still owes and what comes next.
  - Step header: the step name stays as a muted label beside the chosen option's name, and Edit
    moves to the right of the header row.
  - A base-statistics step reads Size, Speed and Stability back as tiles from the shared
    evaluation, with the source sentence under a hairline. An automatic step that grants
    something says "— granted" in its label and sets the granted name at reading size.
  - A point-budget decision is its own panel: heading, "n of m points spent · k left", a dot per
    point, Clear, then the option cards two across with a round state dot restored. The dot comes
    back only here, where several cards are on at once; single-choice lists keep the ring alone.
  - The step card gains a footer with what it still owes and the same forward move the rail has.
  - Hero column: status reads as a dot and a word rather than a filled pill, and the traits taken
    appear as their own chip inset.
  The points left are counted from recorded selections and content costs, the same sum the panel
  heading already made; no new rules resolution entered the UI.
