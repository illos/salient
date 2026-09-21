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
  character becomes unbuildable. Locked are the culture name, environment, organization,
  upbringing and a preset's printed language; the three skills and a professional preset's
  language stay choices. The shared
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
- 2026-09-21 fixes on the mockup pass:
  - A base-statistics step's own `statistic` grant repeated the tiles word for word ("size 1M,
    speed 5, stability 0"); it is suppressed where the tiles render, and the source sentence
    stands under them as it does for an ancestry that grants no such text.
  - The step hint summed every ancestry's trait budget, because all twelve live in the ancestry
    step. It now counts only decisions `isAvailable` reports for the current selections.
  - Cards in a grid row stretch to a common height.
  - The rules ingest caps an excerpt at 230 characters, so long traits arrived cut mid-word (2025
    of 2614 entries sit exactly at the cap). `ruleExcerpt` now falls back to the last complete
    sentence, or the last whole word plus an ellipsis.
  - A statistic the evaluator has not produced reads "Pending", the hero column's word, rather
    than an em dash.

## Culture step

From the user's culture mockup (attachment, 2026-09-21):

- The aspects a preset fixes read back as one block of tiles, headed "Set by the <name> culture",
  instead of one read-only section
  per decision each repeating that sentence. A culture has no entry of its own, being a table row
  that combines aspects, but each of the thirteen aspects does, so a tile carries that aspect's
  own text and opens it. Checked against the built catalog: all 81 aspect tiles across the 27
  presets resolve to text, none missing.
- The step header carries a paragraph and its Read more only when the chosen option has an entry
  of its own. A culture has none, so its header is the name, the step label and Edit, with the
  descriptions on the aspect tiles below; restating the step's "choose a culture" line under the
  culture already chosen says nothing. Read more is a worded trigger for the same modal reader the
  rulebook icon opens (`RuleReadMore`, `web/rules/link.tsx`).
- The three culture skills are one panel, "Culture skills", with a dot per aspect and Clear,
  beside the step card as the point-budget panel is.
- A granted automatic step reads as a card rather than a bare line.

The skill rows follow the mockup too: the label and a note naming the aspect they follow and how
many options it offers on the left, the control on the right. `DecisionEditor` takes a `row` note
for this, so the pool and availability logic stays in one place.

## Working drafts

The wizard no longer holds an unsaved character in the browser. `characters.create` takes
`wizardDraft`, which allows a nameless character and marks it as the wizard's own; `characters.save`
takes `list`, which is the save that requires the name and puts it in the owner's list;
`characters.listMine` omits working drafts; `characters.wizardDraft` returns the owner's one draft
so the wizard resumes it. The wizard autosaves 800 ms after the last change, shows the save state
in its header, and Exit keeps the draft. Proof: `tests/app/wizard-draft.test.ts`, two cases.

Known consequence: an abandoned draft stays as an unlisted row. It is capped at one per owner by
the resume, and it counts against the hundred-character creation limit.

## Hero column

From the user's two-part mockup of the right pane (2026-09-21): the derived values are grouped and
named rather than listed flat. Vitals carries Stamina, Recoveries, Winded, the heroic resource and
the kit; Movement and defense carries Speed, Stability, Size, Disengage, Potency and the saving
throw; Standing carries Renown, Wealth and Languages. Each group is a `sub` inset of hairline-split
rows under its own label. What the build grants follows in its own counted insets — Traits,
Features, Perks, Abilities — then the skills, then the outstanding list, each row a dot, the
decision's name and what it needs, with the count in the accent and one line saying they all need
answering before the hero is finished. A missing value still reads "Pending".

## Flagged for audit: the Tactician's two kits

**This slice changed how a character option is chosen, not only how it looks.** A Tactician takes
both kits from one card grid instead of answering `kit.choice` and then `class.tactician.second-kit`
as separate selects. The wizard still writes both decisions, through `selectMany`, which applies
each transition to the result of the last so the pair settles against one base. Nothing in the
content, the evaluator or the headless route changed, and the second kit keeps its own decision id,
its `selectedPool` exclusion of the first kit and its Field Arsenal source.

What an audit should confirm, against V94 and the Field Arsenal source
(`feature/tactician/level-1/field-arsenal.md`):

- Taking, swapping and clearing kits in the grid records exactly the same two selections the two
  selects recorded, read back from the persisted build rather than from the mutation response.
- Changing the first kit still prunes what depends on it, including the Field Arsenal overlap
  questions, which remain separate decisions below the grid.
- The second kit still cannot repeat the first, and Stormwight kits stay out of both pools.
- A Fury or Shadow, with one kit, is unaffected: the grid takes a single pick.

Owner: whoever next audits the character track (V94's Tactician work). Raised 2026-09-21 by the
user while reviewing this slice.

## Follow-up: stability before the kit

Not a wizard defect, so not fixed here. The ancestry modules set `size` and `speed` as soon as the
ancestry is chosen, but set `stability` only once a kit is chosen or declined
(`shared/evaluate/ancestries/*.ts`), because a kit can add to it. Speed takes the same kind of kit
bonus and does not wait, so the ancestry step shows size and speed but not stability, even though
the step's own source sentence states stability 0. Making them consistent means changing the
shared evaluator for all twelve ancestries, which can flip a build's completeness before a kit is
chosen; it needs its own slice and headless proof.
- 2026-09-21: the user asked for the wizard to persist a draft character and for the character to
  leave draft only when finalized, and confirmed the draft is shown only inside the wizard,
  appearing in the list once saved. This reverses the V40 first-save behavior, which is recorded
  as an amendment in the spec rather than left as drift.
- 2026-09-21: the step header only borrows an option's rules text when the option has its own
  entry. Every culture preset cites the Background chapter, which is also the decision's own
  source, so the header was showing that chapter's opening paragraph under every culture. When the
  option's source is the decision's, the header keeps the step's name, text and reference.
- 2026-09-21: dropped the culture name tile (the step title already carries it), the "Choose Build
  your own to set these yourself" caption, and culture's optional-none confirm button. Build your
  own is a card in the chooser's bespoke group, so the button above the list offered the same
  thing twice; culture now has no "none" label, and picking a culture means picking a card.
- 2026-09-21: cut the culture step's stacked preamble. The chooser no longer sits in a "Starting
  culture" section with its source quote and two more lines of instruction above the cards; its
  rule reference moved beside the step title. What remains above the cards is the chooser's own
  sentence, that a starting culture can be built on or replaced and that ancestral cultures are
  open to any ancestry. The skills line went: the Culture skills panel already says the same.
- 2026-09-21: the rail's step count reads decided over presented, "0/4", rather than a bare number
  of outstanding diagnostics. Both numbers are derived, not curated: a step's choices are its
  `choice` and `authored` decisions that `isAvailable` accepts for the current selections, minus
  any a culture preset fixed. Verified through the supported `characterWizard.discover` query,
  which reports the same availability the rail uses: with a Devil culture preset the culture step
  offers nine decisions, five of them fixed by the preset, so the rail reads 0/4; before a preset
  it reads 0/6; Devil ancestry reads 1/3.
- 2026-09-21: the rail is two levels. The step the hero is inside lists its own choices beneath
  it, each with a dot showing whether it is recorded, and picking one scrolls to that choice in
  the centre column. The items are the same derived list the step's decided-over-presented count
  uses, so the sub-menu and the count can never disagree. Every rendered decision carries an
  anchor id, and while a step's main choice is collapsed into the header the header answers to
  that choice's anchor, since that is where the choice lives. Checked across every presented step
  with a mid-build selection: no item names a decision without a rendered anchor.
- 2026-09-21: the rail is a tree. A step can hang off the step it depends on, and the kit does:
  the class grants it and decides which kits are offered, so it reads under the class rather than
  beside it. The flow is unchanged, with the kit still its own step in source order and its own
  page; only the rail nests it, and it leaves the top-level numbering to the rest. The completed
  percentage and "Step n of m" count the whole tree, so a nested step still counts as a step.
  Sub-menu bullets sit in a badge-sized box so they centre on the numbers above them.
- 2026-09-21: the kit is a section of the class page rather than a step of its own. It leaves the
  presented sequence, so Continue runs Class then Complication, and the class page renders the kit
  step's decisions under their own heading after the class's. Its rail row opens the class and
  scrolls to that section, and appears only where the class actually grants a kit. Checked against
  the shared availability: no class chosen offers nothing, Elementalist offers nothing at all,
  Shadow and Tactician offer the kit from the class choice, and Fury offers it once the aspect
  that grants the Kit feature is chosen. A step that asks this hero nothing now counts as done
  once passed, so a kitless class can still reach 100%.
- 2026-09-21: the kit is chosen from a card grid rather than a dropdown, after the user's Forge
  Steel reference. One card per kit (`web/wizard/kit-choice.tsx`) folds that reference's Overview
  and Stats tabs together: the kit's own description from the rules catalog, the line saying what
  it equips you with, every bonus its Kits-table row grants, and a pill naming its signature
  ability beside a reference that opens the kit's full entry. Bonuses a kit does not grant are
  omitted rather than printed as zero. Checked against the source rows and the built catalog: all
  25 kits, ordinary and Stormwight, resolve to a row, a description and a signature ability.
- 2026-09-21: a Tactician chooses both kits from the one grid rather than from two selects, on the
  user's instruction. The cards become checkboxes bounded at two, with a line counting the picks;
  each pick still writes its own decision. Flagged for audit above, since this changes how a
  character option is chosen.
- 2026-09-21: complications are chosen from a filtered card grid rather than a search-and-select,
  after the user's Forge Steel reference. Each card carries the complication's own text from the
  rules catalog and a reference that opens its entry; the filter narrows by name and the count
  under the grid says how many match. No complication is a card; a hundred are, so the grid is
  behind an explicit `CARD_CATALOGS` list rather than an option-count threshold. Checked against
  the composed definitions and the built catalog: all 100 resolve to text and a reference.
- 2026-09-21: right pane regrouped from the user's mockup, see "Hero column" above. `Required
  choice missing:` now reads "Needs a selection" rather than "Make a selection to continue.", which
  also shortens the same guidance where it appears beside a decision in the centre column.
- 2026-09-21: the wizard takes the site's own navigation instead of a header of its own. It is no
  longer a full-viewport frame in `web/router.tsx`, so it renders inside the ordinary page column
  with the top nav above it; `web/wizard/header.tsx` is deleted. Saving moved under the rail as a
  single button, which saves and closes. Exit and the "Draft saved" line went with the header: the
  nav leaves the page, and the draft is saved as you work either way. Saving then moved again, to
  the head of the hero column, replacing the status word: the outstanding list under it already
  says whether the build is finished.
