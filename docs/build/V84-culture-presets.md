# V84: Culture presets and bespoke culture editing

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead |
| Rules review | required |
| Depends on | V37, shared wizard transition API |
| Unblocks | Level-one culture selection parity |
| Status | Delivered — `175d17d`; all 27 presets shared-main API verified |

## Goal

Offer all 11 ancestral and 16 professional starting cultures alongside bespoke culture creation.
Selecting a preset fills the existing culture decisions in one shared transition; players still
choose the three skills and may adjust the culture. Culture and ancestry remain independent.
This adds selection convenience and persisted labels, not new culture mechanics.

## Spec references

- [Wizard decision system](../character-wizard-spec.md#3-decision-system).
- [Programmatic completion gate](README.md#programmatic-headless-completion-gate).
- [Test value policy](README.md#test-value).

## In scope

- A source-backed 27-preset catalog and grouped ancestral/professional/bespoke selector.
- One optional `culture.preset` choice, preserving existing saved builds without migration.
- Atomic selection through the existing shared `changeChoice` / `characterWizard.transition` route.
- Existing `culture.name`, `culture.environment`, `culture.organization`, `culture.upbringing`
  and, for ancestral defaults, `culture.language`; preserve valid child skill selections.
- Direct aspect, language or name customization switches the starting-culture marker to Bespoke
  when it differs from a preset default. The authored culture name remains intact.
- Persisted readback, ancestry independence, dependent-skill pruning and source comparisons.

## Out of scope

- New skill, language or culture-edge rules; additional ability grants; career selection changes.
- Forcing a culture based on ancestry, locking a preset's defaults or requiring existing characters
  to pick a new preset.
- Arbitrary custom language creation, community/third-party cultures or new homebrew authoring.
- Browser testing under the current moratorium; no Forge website capture.

## Inputs and dependencies

Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/chapter/background.md`: Using Culture, Typical Ancestry Cultures Table and
Archetypical Cultures Table. Individual aspect sources are `en/unified/md/culture/*.md`.
The full Heroes source's Culture Benefits/Language sections establish one additional culture
language, one skill per aspect, and the existing culture edge; there is no extra preset benefit.

Forge pin `5a846aadb623a9855a023e9403bb887a956c341f` supplies comparison code only:

- `src/components/pages/heroes/hero-edit/culture-section/culture-section.tsx` groups every ancestral
  culture independently of the hero's ancestry, then professional and bespoke cultures. “Your
  Ancestry” is an extra shortcut, not an eligibility restriction. Its generic Bespoke Culture
  exposes editable name/environment/organization/upbringing controls.
- `src/data/culture-data.ts` defines the 13 aspects and bespoke culture.
- `src/data/ancestries/*.ts` carries 11 ancestral defaults; Revenant has none.
- `src/data/sourcebooks/official/core.ts` carries 16 professional presets. This file is absent
  from the current sparse working tree and was read with `git show HEAD:<path>`, without changing
  the pin or checkout. `orden.ts` adds Hakaan/Memonek/Time Raider ancestry definitions.
- `src/logic/factory-logic.ts#createCulture` stores language as a language-choice feature with a
  preselected value when supplied; `feature-logic.ts#getFeaturesFromCulture` exposes the language
  and all aspect skill choices for every culture. Ancestral languages are defaults, not locks.

## Deliverables

- `shared/content/culture-presets.ts`: catalog, source references and optional preset decision.
- `shared/evaluate/choiceTransition.ts`: shared atomic preset expansion and customization marker.
- `shared/content/character-decisions.ts`: compose the new optional decision at supported levels.
- `web/wizard/culture-preset.tsx` and wizard integration: grouped selector, readable defaults,
  existing editable aspect/skill/language fields.
- `tests/culture-presets.test.ts`: independent source-table and shared-transition regressions.
- Public API persistence evidence under the owning headless runner and updated handoff/status.

## Acceptance checks

1. Compare all 27 catalog rows against the pinned Compendium tables: no omitted/extra rows,
   wrong triple, fixed language where none exists, or inherited Forge spelling discrepancy.
2. Use shared transitions and saved API readbacks for all 27 presets. Expected values come from
   the source tables. Verify the saved label, three aspects, ancestral language defaults and
   professional free-language behavior. All three skills remain explicit choices.
3. Choose Wode Elf culture for a dwarf (and another cross-ancestry case); ancestry traits and
   abilities remain unchanged. Changing ancestry later retains the culture.
4. Switch cultures with a mixture of still-valid and invalid child skills. Keep the valid choices,
   prune only the invalid ones, and report missing skills through normal evaluation.
5. Customize a preset's aspect, language or name and save/reload. The marker becomes Bespoke;
   the customized values remain. Selecting Bespoke directly retains current choices for editing.
6. Existing saved cultures lacking `culture.preset` retain completeness and grants. Raised by
   Beasts continues to suppress ordinary culture choices except the common language.
7. Run bounded focused tests, appropriate full checks and public API verification before marking
   delivered. Browser scenarios enter the backlog; browser execution is not required or allowed.

## Ability design and playtest evidence

Not applicable: this is a preset selection layer over existing culture skills/language/edge.
Fresh source inspection found no preset-granted action or additional trait to implement.

## Rules research

The source explicitly permits a hero of any ancestry to use any culture, and tells readers to use
**or modify** the listed examples. A culture consists of four aspects: language plus environment,
organization and upbringing. Professional presets specify only the latter three and require an
appropriate language to be chosen. The existing additional-language choice remains authoritative.
Presets do not pick the player's three skills. Revenant has no typical ancestral row because its
ancestry begins after death; it can still choose every listed culture or a bespoke one.

Source ledger (all rows in the Background chapter tables):

| Ancestral culture | Language | Environment | Organization | Upbringing |
| --- | --- | --- | --- | --- |
| Devil | Anjali | Urban | Bureaucratic | Academic |
| Dragon Knight | Vastariax | Secluded | Bureaucratic | Martial |
| Dwarf | Zaliac | Secluded | Bureaucratic | Creative |
| Wode Elf | Yllyric | Wilderness | Bureaucratic | Martial |
| High Elf | Hyrallic | Secluded | Bureaucratic | Martial |
| Hakaan | Vhoric | Rural | Communal | Labor |
| Human | Vaslorian | Urban | Communal | Labor |
| Memonek | Axiomatic | Nomadic | Communal | Academic |
| Orc | Kalliak | Wilderness | Communal | Creative |
| Polder | Khoursirian | Urban | Communal | Creative |
| Time Raider | Voll | Nomadic | Communal | Martial |

| Professional culture | Environment | Organization | Upbringing |
| --- | --- | --- | --- |
| Artisan Guild | Urban | Bureaucratic | Creative |
| Borderland Homestead | Wilderness | Communal | Labor |
| College Conclave | Urban | Bureaucratic | Academic |
| Criminal Gang | Urban | Communal | Lawless |
| Farming Village | Rural | Bureaucratic | Labor |
| Herding Community | Nomadic | Communal | Labor |
| Knightly Order | Secluded | Bureaucratic | Martial |
| Laborer Neighborhood | Urban | Communal | Labor |
| Mercenary Band | Nomadic | Bureaucratic | Martial |
| Merchant Caravan | Nomadic | Bureaucratic | Creative |
| Monastic Order | Secluded | Bureaucratic | Academic |
| Noble House | Urban | Bureaucratic | Noble |
| Outlaw Band | Wilderness | Communal | Lawless |
| Pirate Crew | Nomadic | Communal | Lawless |
| Telepathic Hive | Secluded | Communal | Creative |
| Traveling Entertainers | Nomadic | Communal | Creative |

Two pinned Forge naming discrepancies are adjudicated by the Compendium: its Orc language is
`Kalliac` rather than `Kalliak`, and its Urban/Communal/Labor professional culture is called
`Pauper Neighborhood` rather than `Laborer Neighborhood`. Salient uses the Compendium names.
The triples themselves match. Do not silently rename Compendium entries to make Forge agree.

The current app already has all 13 aspects, dependent skill pools, editable culture name and the
additional-language choice. `changeChoice` calls `pruneUnavailable`, which removes children only
when unavailable or outside their resulting pool. `characterWizard.transition` exposes that shared
logic and canonical provenance; `characters.save/get/sheet` provides persistence and readback.
No new endpoint or separate UI-only grant path is needed. Existing Raised by Beasts availability
conditions must also apply to the new optional choice.

## Open questions

None. The UI category “Professional” follows Forge's organization; the actual source calls these
“Archetypical Cultures.” Defaults remain modifiable as required by the source and user request.

## Work log

- 2026-09-20: fresh read-only audit completed against pinned Compendium and Forge code, without
  website/browser use or pilot artifacts. Recorded 27 rows, two naming discrepancies, current
  shared-operation trace and bounded acceptance cases. Lead approved the optional preset contract.
- 2026-09-20: catalog/definition extension and grouped culture control authored in the supporting
  actions worktree. Shared transition and public API integration remain with the lead; no delivery
  or verification pass is claimed by this initial candidate entry.
- 2026-09-20: after lead integration of definitions/shared transitions, local
  `pnpm exec vitest run --project engine tests/culture-presets.test.ts` passed all three cases
  in 638 ms. Source-table coverage includes all 27 rows; transition cases cover independent
  ancestry, valid/invalid child skills, professional free language and bespoke customization.
  Focused ESLint passed for the catalog, control and test. No application target or browser was
  used; persisted public API proof remains separate and pending.

## Current acceptance

Merged and live as `175d17d`. All repository check stages, independent implementation and fresh
source/proof reviews passed. Isolated CT114 and shared-main API verification each passed all 31
journeys, including saved supporting grants and every culture preset. See
[retained evidence](evidence/V83/README.md) for actual source/runner/target identities, check logs,
reviews and explicit capability limits. No browser testing ran; isolated services are stopped
with data retained. Complications and starting rewards are separate next portions.
