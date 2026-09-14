# Final V1 design mockups

These mockups are the final V1 reference for **visual style and theme only**. Their labels, values, controls, screen content, and depicted behavior are approximate and are not product requirements or acceptance criteria. The written design specifications are the authoritative guide for product content, behavior, workflows, permissions, and supported features. If a mockup conflicts with a written specification, follow the written specification.

The images are design references, not screenshots of implemented functionality and not a claim that every depicted element is in scope.

## Reference screens

- [Login](login.png)
- [Account and preferences](account.png)
- [Campaign home](campaign-home.png)
- [Running session: Director free-play view](session-free-play-director.png)
- [Character wizard: class step](character-wizard-class.png)
- [Standalone character sheet](character-sheet.png)
- [Combat table: light theme](combat-table-light.png)
- [Combat table: dark theme](combat-table-dark.png)

Together, these screens establish the intended V1 visual language: an achromatic white/grey or dark foundation, muted brick-red accents, strong rules and borders, compact uppercase metadata, and Schibsted Grotesk typography. They illustrate a consistent desktop treatment across account, campaign, character, session, and combat surfaces without overriding the written design.

## Known departures from the written specification

The mockups predate or ignore several settled decisions. Builders must not implement the elements
below from the picture; each one was checked against the owning specification cited. Absence from
this list is not confirmation that a depicted element is in scope.

| Image | Depicted element | Settled decision |
| --- | --- | --- |
| `session-free-play-director.png` | **Call for test** quick action | No generic Director Request test control, command, card or response lifecycle exists; the Director asks verbally and players use Roll test / `/test roll`. See [tests](../../table-spec.md#freeplay-baseline-and-combat-transition) and the [command spec](../../table-command-spec.md#direct-test-rolls). |
| `session-free-play-director.png` | **Give hero token** quick action and the **Hero tokens** pool in the Party pane | The shared hero-token counter, its controls and automation are deferred beyond v0.01 ([contract](../../table-spec.md#v001-hero-tokens--deferred)). Fuller V1 hero-token behavior is future scope; do not build it in the prototype. |
| `session-free-play-director.png` | Player-initiated **Respite requested** card with Later / Begin respite | Respite is a dedicated table mode that the Director starts and ends; its loop still needs rules research, and no player request flow is specified. The dedicated respite workflow is deferred beyond v0.01 ([mode](../../table-spec.md#respite-mode), [deferral](../../pre-alpha-design-gaps.md#respite-and-fictional-time--deferred-beyond-v001)). |
| `session-free-play-director.png` | Director Party pane showing only one bar per hero | The Director's heroes pane lists each player's heroes with current Stamina, Recoveries and Heroic Resources ([layout](../../table-spec.md#confirmed-combat-layout)). |
| `account.png` | **Session reminders** preference | There is no notification system in V1; all notifications are deferred beyond V1 ([product features](../../product-features.md#account-and-social-features)). |
| `campaign-home.png` | **OBSERVER** (and **PLAYER**) member tags | Observer is not a membership role: a campaign observer is a current member not selected as a session player, and player status is per-session selection ([definitions](../../table-spec.md#3-table-surfaces), [access](../../accounts-and-access-spec.md)). Membership lists should not present these as standing roles. |
| `combat-table-light.png`, `combat-table-dark.png` | Director-only foe controls (add box, foe roster edits) and an unconditional Malice value combined with a player-style **Selected sheet** heroes pane | The pane contents are role-specific: players see revealed foes with the campaign health display and their own sheet plus a compact party roster; the Director sees foe controls and the players/heroes resource list. Show Malice is off by default and only the Director always sees the pool ([layout](../../table-spec.md#confirmed-combat-layout), [Malice](../../table-spec.md#malice-visibility)). |
| `combat-table-light.png`, `combat-table-dark.png` | Initiative bar as flat per-side segments | Initiative is organized as groups containing actor-linked turn entries, one group per creature by default, with Director regrouping and distinct spent state per entry ([groups](../../table-spec.md#initiative-groups-confirmed-app-model)). The bar does not show groups or entries. |
| `combat-table-light.png`, `combat-table-dark.png` | Fixed-bottom **Persistent area** card | Consistent with the fuller V1 design but deferred beyond v0.01 ([checklist](../../pre-alpha-design-gaps.md#v001-combat-acceptance-checklist)). |
| `character-sheet.png` | Ability filter tabs (All / Signature / Heroic / Triggered) | The sheet groups actions by Main actions, Maneuvers, Move actions and Triggered/other, with a common-actions list; no filter or search system is required initially ([sheet spec](../../character-sheet-spec.md#actions-tests-and-readable-rules)). |
| `character-sheet.png` | Missing Conditions section, Surges, Victories, temporary Stamina, a labeled Roll test entry and the hero selector; **Level up** control | Those elements are required v0.01 sheet contents ([layout table](../../character-sheet-spec.md#layout-and-content)); leveling controls are omitted from the v0.01 sheet. |
| `character-wizard-class.png` | Seven fixed steps (Ancestry, Culture, Career, Class, Kit, Complication, Details) | The wizard follows the sourced step names, including free strikes and connections where applicable ([wizard spec](../../character-wizard-spec.md)). Do not fix the step count from the picture. |

The user-supplied reference `docs/design-references/paper-character-sheet.png` is not a project mockup.
Its artwork and game content retain their original rights and it is not covered by the project's
application-code license; see the [character sheet spec](../../character-sheet-spec.md#purpose-and-authority).

## Visual tokens

The only visual assertions these mockups establish are the ones already stated above: Schibsted
Grotesk typography, an achromatic white/grey or dark foundation, a muted brick-red accent, strong
rules and borders, and compact uppercase metadata. Exact colour values, the spacing scale, component
sizes and breakpoints are not yet defined; producing them (design tokens and a component library) is a
build-slice deliverable, not something to read off these images.

## Login footer wording

Resolved 2026-09-14 (Q-HAND-1): the "Draw Steel compatible" tag shown in `login.png` is not used. Do not
add a compatibility or affiliation phrase to the product without a separate user decision.
