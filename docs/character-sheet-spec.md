# v0.01 character sheet specification

Historical first-pass presentation guidance. The [current direction](v1-roadmap.md#version-one),
[wizard specification](character-wizard-spec.md), and [table specification](table-spec.md) govern
current behavior and design work.

Status: initial implementation guidance, 2026-09-14. The user authorized a reasonable first-pass
spec guided by the supplied paper character sheet, with refinement through use rather than exhaustive
upfront design. This document specifies presentation and integration; it does not claim implementation.
Layout defaults below are deliberately adjustable without another product-design approval round.

## Purpose and authority

Give the player one practical place to inspect their hero, use actions and tests, and follow changing
resources. Support the minimal level-one devil Fury produced by the wizard, including its actual
selected options and granted text. Desktop usability is the v0.01 target; final styling and mobile
layouts follow later.

The user-supplied [paper sheet](design-references/paper-character-sheet.png) guides content and
hierarchy: identity/progression, prominent stats/resources, modifiers/features, and play reminders.
The image was supplied on 2026-09-14 and described by the user as the game's paper character sheet;
its edition was not independently established. It is a design reference, not an application asset
or a new rules authority. Its artwork and game content retain their original rights; this copy is
not covered by the project's application-code license.

The [pre-alpha checkpoint](pre-alpha-design-gaps.md) records the original prototype scope. The
[wizard spec](character-wizard-spec.md) owns builds, drafts, review and derived/live-state boundaries;
the [table spec](table-spec.md) owns gameplay, timing and history; the
[access spec](accounts-and-access-spec.md) owns permissions. Those contracts take precedence over
the image and this document. Formula verification uses the pinned local Compendium. Fields on paper
do not automatically add mechanics or subsystems to v0.01.

## Layout and content

Use a compact vertical sheet in the table's heroes pane. Keep identity, essential resources and turn
controls above a separately scrollable body so browsing long text does not lose the hero's current
Stamina or actor identity. Allow the compact header to wrap; do not force the paper's wide row into
the narrower pane. The standalone character page uses the same sections in a wider layout.

The initial body order is **Actions and abilities**, **Conditions**, **Features and modifiers**,
then **Character details**. Active conditions also appear in the compact header. Actions start open;
long reference sections can start collapsed. Use ordinary labeled controls and expandable text,
without reproducing decorative boxes or large blank writing areas.

| Area | v0.01 contents and behavior |
| --- | --- |
| Identity | Character name, level, ancestry, class/subclass and career. Show attached campaign and effective/draft/review status where applicable. A simple text selector switches between eligible heroes; no portrait system is required. |
| Characteristics | Might, Agility, Reason, Intuition and Presence with their current supported values. Selecting a characteristic opens the shared Roll test flow for the viewed hero with that characteristic selected; it does not immediately roll. |
| Other baseline stats | Size, speed and stability. Keep them easy to inspect, without implying movement tracking or a digital map. |
| Stamina | Current, maximum and temporary values, with an explicit Winded indicator/threshold from shared state. Keep temporary Stamina visibly separate. Do not introduce the paper's dying tracker or automatic dying/death warnings; hero-dying automation remains deferred. |
| Recoveries | Current/max count, recovery value labeled as Stamina restored, and a Catch Breath control using the existing shared operation. |
| Heroic Resource | Show the actual class resource name (Ferocity for the first hero) and current value. Readable resource rules explain manually handled class behavior; the display does not imply automatic generation, thresholds or resets. |
| Surges and Victories | Show their actual persistent counts. Surges are tracked with manual gains/spending/effects under the current table contract. Victories use the established award/manual-adjustment operations. |
| Turn state | Identify whether this hero is taking a turn, show the shared action-allowance assessment and expose eligible Take turn/End turn controls. Supported additional-action opportunities must remain distinguishable from ordinary allowances. |
| Actions and abilities | All abilities granted by the effective supported build, plus common actions covered below. Show name, action type and known cost at a glance, with full text available. |
| Conditions | One labeled on/off toggle per supported core condition, reflecting persistent state. Active conditions remain visible when this section is collapsed. |
| Features and modifiers | Class features, ancestry traits, perks and the selected kit, with full readable source text. Show relevant kit/build contributions beside or under the totals they explain. |
| Character details | Selected culture and career (the Compendium's Background chapter content), skills and languages, appearance, biography and owner-private notes. Surface existing sourced Wealth/Renown/XP values here when supplied by the supported model; dedicated editing/progression systems for them are not sheet-delivery gates. |

Omit inventory/equipment management, leveling controls, progression-history browsing, import/export,
hero-token controls and other deferred workflows. Showing the selected kit, weapon/armor categories
and its sourced bonuses is build information, not an inventory system. Do not add empty Enchantment,
Prayer, Augmentation or Ward panels merely because the paper lists them; display actual supported
grants through the same features/modifiers section.

Populate the first hero's skills, languages, traits and features from recorded choices and grants,
not from a hardcoded UI fixture. The [prepared hero notes](hero-fixture.md) are supporting research;
their old experiment's coverage is not the integrated acceptance contract. Missing required baseline
values remain an integration dependency, never a displayed zero or an invented formula.

## Actions, tests and readable rules

Implementation note (2026-09-15): the user's [app-wide rule card presentation](reference-library-spec.md#app-wide-rule-cards)
supersedes inline source expansions. Readable labels and the shared rulebook icon open a centered,
scrollable reference card with a blurred backdrop. Source paths and IDs remain metadata; operational
values and controls retain their behavior.


Group action entries by **Main actions**, **Maneuvers**, **Move actions**, and **Triggered/other**,
using supported source metadata. A short common-actions list appears alongside granted abilities
within these groups. No favorites, custom ordering or ability-search system is required initially.

Separate expanding an entry to read it from selecting it for use. The expanded view includes the
complete source text and available structured details: keywords, cost, roll characteristic, distance,
targets, tier results, effects and trigger where applicable. Use only metadata actually supplied by
the source adapter. Unsupported clauses stay readable, with plain wording such as “Resolve this
effect at the table”; distinguish them from effects the app applied.

Expose included common actions such as Defend, Aid Attack and Catch Breath through their registered
operations. Keep the remaining common-action references readable without claiming all are automated.
Ordinary movement remains a physical-table activity: no I moved, movement-distance log or Convert
buttons are introduced. Action substitution follows the owning table contract, not a new sheet rule.

All granted abilities remain visible when unaffordable, out of turn or otherwise unavailable.
Spent-allowance graying is advisory and stays clickable; show its reason in text as well as styling.
Resource affordability is a distinct blocking rule, enforced by shared execution for every caller.
The UI explains missing resources and retains the selection on refused activation as specified by
the table contract. Reference text remains accessible even when gameplay controls are blocked.

Use the existing ability/target-selection flow, including target-completion auto-fire. Do not add a
mandatory confirmation or preparation screen to every action. Place compact per-target edge/bane
inputs and any permitted roll-characteristic override with the current selection; use the confirmed
defaults, clearing and post-roll correction behavior. Required further input and resolution choices
use the shared game-log cards. Do not relocate those response workflows into a separate sheet inbox.

Provide a labeled Roll test entry as well as the characteristic shortcuts. It uses the existing
shared test controls, applicable skill selection and public calculation display. Do not infer a
difficulty or narrative outcome; difficulty visibility follows the campaign setting. There is no
generic Director Request test workflow. Skills/languages remain readable outside an active session.

## Resource and condition interaction

The Director can edit current Stamina, temporary Stamina, current Recoveries, Heroic Resource,
Surges and Victories through their shared numeric-adjustment operations. Default interaction:
select the field's Edit control, enter an absolute value, then Save or Cancel. Save appends an
attributed Manual adjustment with before/after values. Do not commit every keystroke. Rules and
allowed numeric values come from shared validation; the sheet must not impose one universal floor
or maximum on these different resources. Derived totals are read-only baseline information here.

Player controls use the existing action permissions: for example Catch Breath spends an actual
Recovery and updates Stamina through its shared operation in a running session, including FreePlay
under the existing contract. Providing resource displays does not grant players Director numeric
editing authority. No automatic refresh or replenishment occurs on viewing or reloading the sheet.

Players toggle conditions on their controlled heroes; the Director can toggle them on all heroes
and foes. Each change persists and is logged. There are no condition-duration columns, source-entry
forms, application stacks, Clear all control or inferred timers in this prototype. Show condition
text on demand. Saves use ordinary dice controls followed by manual removal when appropriate;
the toggle itself schedules no automatic save or expiry.

## Views, permissions and persistence

The standalone page and table pane read the same effective build and authoritative live state.
Combat updates appear on both without a later writeback. A draft preview is explicitly labeled and
cannot become a gameplay actor before activation. Reopening the wizard restores its actual choices;
pending edits never silently replace the effective sheet or reset play resources.

The standalone page prioritizes inspection and eligible editing through the wizard. Gameplay takes
place in the running session's table; provide Open table when applicable rather than adding a
second independent play surface. Outside combat, authored-detail editing follows its existing
separate policy. Combat locks ordinary character/build edits, while eligible gameplay adjustments
remain available during running play. Pause blocks gameplay; a closed session stays read-only.

All sheet actions bind to the viewed hero. Successful explicit Take turn switches the invoking
user's sheet to that hero. Default to no passive auto-switching during turn changes or log-card
responses. Clearly labeled bound log cards retain their own actor. Manual sheet changes follow
the existing selection-clearing rules and never retarget recorded actions.

Full-sheet reads use existing ownership, campaign and grant permissions. Peers' compact party
overview shows Stamina and Recoveries without granting full-sheet access or revealing their Heroic
Resources. Notes are owner-private even from Directors; enforce that in shared reads, not merely
with a collapsed section. Inventory's separate privacy policy remains for later delivery.

Every table gameplay control calls the same registered operation as palette/slash/headless access.
The server checks current actor/control, session, affordability and history eligibility on commit.
Show pending/error feedback and prevent accidental duplicate submission; retries preserve the same
operation identity. Shared updates and reload restore actual values, active conditions and history.
Reading, expanding sections or changing the viewed hero does not create gameplay log entries.
Keep the long game log separately bounded; the sheet must not load full history to display a stat.

## Implementation note (A02, 2026-09-15)

`characters.sheet` is the one read behind the standalone page (`web/characters.tsx`) and the table's
heroes pane (`web/character-sheet/`, mounted in `web/table/index.tsx` beside A04's turn controls).
It returns an owner payload (with notes), a Director payload (no notes; a `proposed` view for a
pending submission) or a peer payload (name, Stamina and Recoveries with their maxima); notes never
leave the owner payload. Ability grouping uses the entry's printed `action_type`; the kit's signature
ability, carried by the kit entry with no ability frontmatter, is listed under "other" with its text.
Director numeric edits submit `/adjust <field>`; condition toggles submit `/condition on|off`; the
Catch Breath control invokes the shared `ability.use` operation, including its combat allowance
and FreePlay behavior. The `/hero recover` control uses that same operation during combat.
Turn state reads the shared current encounter, including active/spent entries and opening/closeout.

## First-pass acceptance

These are implementation checks, not a claim that the feature is built. Use the minimal wizard
journey and [basic-play walkthrough](v001-basic-play-walkthrough.md) with source-established values.

1. Create/save/reopen the supported hero. Inspect actual identity, characteristics, baseline stats,
   resources, skills/languages and all granted abilities/features without inventing missing data.
2. Read a long ability while keeping hero identity and live resources visible. Execute an included
   action/test as that hero; verify its actual source text, cost, inputs and supported results in
   the shared log. Manual effects remain clearly distinguishable from applied ones.
3. Inspect spent action allowances and an unaffordable ability: advisory graying permits the
   former under the warning policy; shared execution refuses an unpaid cost without side effects.
4. Adjust a resource as Director, use Catch Breath and toggle a condition as an eligible player.
   Verify persisted values/history through another authorized client, headless reads and reload.
   Undo/redo restores recorded outcomes under existing boundaries rather than rerunning rules.
5. Check the standalone/table state match, effective/draft isolation, pause/combat edit boundaries,
   denied unauthorized operations and owner-private notes. Switch heroes and use a differently
   bound log card without changing its acting character.

Field spacing, section density, sticky-header size, indicator styling and exact responsive breakpoints
can change after playtesting. This specification does not settle remaining critical-action timing,
build/live-resource reconciliation or other unresolved rules contracts through presentation choices.
