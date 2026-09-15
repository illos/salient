# Character wizard foundation

The consolidated [character wizard specification](character-wizard-spec.md) is now the primary implementation
entry point. This document retains the supporting discussion and source examples. Future requirement changes
should update the specification first and keep these notes consistent where applicable.

Current encounter boundary: a character in an encounter is locked against sheet/draft/progression edits and
build activation, including while paused. Encounter changes immediately update its main sheet. Earlier
examples of editing during play are subject to this newer lock; see the
[table contract](table-spec.md#character-sheet-lock-during-encounters).

For immediate delivery, follow the [pre-alpha checkpoint](pre-alpha-design-gaps.md) and the
[wizard scope](character-wizard-spec.md#1-product-outcome-and-scope): minimal level-one creation/editing and
saved revisions, with leveling, build-history navigation UI, inventory and interchange implementation deferred.
The supporting progression and import research below informs the model without expanding prototype scope.

## Confirmed direction

The character wizard is one app workstream alongside the headless playtests. The application will be
GPLv3. Bring in Forge Steel and use its class progression and choice definitions heavily as a reference.
Prefer Steel Compendium as the single source for the actual rules content. Reusing Forge Steel's UI or
character storage model is not a requirement.

Our character system must maintain the ability to import Forge Steel character data files. Compatible export
is also desired and should influence the model before it is settled. The
[interchange investigation](forge-steel-interchange.md) describes the current file format and proposes a
separate import/export adapter with preservation of unmapped data. These capabilities are not implemented yet.

The dependency is now [pinned locally](forge-steel.md). A repeatable source inventory connects all 11 class
definitions to Compendium class SCC IDs and finds level 1–10 entries in each. It also inventories 33 subclass
definitions. This is the source foundation, not an implemented wizard, validated progression importer, or
complete character builder.

Research uses Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f` and Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`.

## Character model direction

Confirmed by the user: character creation is a decision matrix/tree, supplemented by user-authored
descriptions and flavor, an inventory system, and a stats layer built from those decisions whose values can
change. The interchange approach above is accepted direction: translate through an adapter while retaining
unmapped imported data. Concrete schemas and implementation remain open.

The proposed representation is a dependency graph of decisions. A tree is useful for presenting a branch of
the wizard, but an available choice can depend on several earlier decisions, level, or existing selections.
The wizard presents the relevant decisions and their consequences; those relationships belong in shared
character operations, independent of screen order.

| Part | Responsibility |
| --- | --- |
| Decisions and grants | Record ancestry, culture, career, class, kit, characteristics, selected abilities, and other choices against versioned definitions (step names per [Making a Hero](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#step-by-step-hero-making); "Background" is the Compendium chapter holding Culture and Careers). Distinguish a player selection from an automatic grant. Definitions describe prerequisites, counts or budgets, and dependent choices. |
| Authored details | Store name, appearance, backstory, descriptions, flavor, and notes independently of the build. Authored flavor can attach to an ability or item without changing its canonical rules reference. Mechanical customizations are explicit, separate inputs. |
| Inventory | Track the character's item instances and their quantities/state. Ownership alone need not imply an active mechanical benefit; applicable item rules determine effects. Starting items can originate in creation, while acquisition, use, and loss continue during play. |
| Sheet and play state | Derive base characteristics, maximum Stamina/Recoveries, abilities, and other supported values from decisions and applicable item effects. Track changing resources, conditions, and temporary effects alongside those derived values. |

Separate the derived baseline from current play state within that last part. Reopening the wizard or
recalculating the character must not heal damage, replenish resources, remove conditions, or erase manual
adjustments. Permanent progression, temporary effects, and recorded corrections can all affect the effective
sheet, but have different causes and lifetimes. The exact representation of current Stamina versus damage
taken remains open; the distinction is necessary whichever storage convention we choose.

Proposed evaluation behavior:

- Re-evaluate dependent decisions when a build input changes. Retain invalidated selections for
  explanation/reselection without continuing to grant their effects. Preserve independent authored details.
- Derive a coherent sheet from the active choices, supported content, inventory effects, and current state.
  Keep enough source information to explain a value or ability: which choice, item, or active effect supplies
  it.
- Distinguish abilities the hero possesses from abilities currently usable with their resources, conditions,
  and known circumstances. An unaffordable ability still belongs on the sheet.
- Treat a build or item change that affects a resource maximum as a state reconciliation, not an implicit
  resource reset. Confirmed 2026-09-15 (Q-CHAR-2): retain current amounts when maxima increase; cap them downward
  when a new maximum is below the current amount. See [the owning policy](character-wizard-spec.md#current-values-when-a-build-changes)
  for examples, resource-type replacement and separate source-defined restoration.
- Keep recalculation deterministic. Commit play changes through the existing shared operations/history
  boundary. Table-history navigation restores recorded game state. Progression-history navigation restores
  only the recorded build and its derived baseline, as described below.

The existing combat `Entity` in `src/contracts.ts` is a bounded playtest state projection. It does not yet
model the character's decisions, authored details, or inventory, and should not become the complete saved
character schema merely because it already holds sheet values. A future adapter supplies its supported combat
inputs from the character system.

## Wizard modes and campaign review

Confirmed character management outside combat: owners may edit names, appearance, biography, and notes without
Director review, and may detach their own characters without Director approval. Notes retain owner-only
visibility. Pending full edits survive departure as a private draft; detachment does not activate that draft.
Duplication copies the currently active build, excluding pending edits, while retaining the established
independent inventory/history and cleared campaign-value rules. Owners may withdraw a submitted review before
the Director decides. Both the character owner and campaign owner may detach a character. The campaign owner
can kick a player or remove individual attached characters; removing a character alone does not remove its
owner's campaign membership. Director status alone does not grant this campaign-management power. Removed
characters remain owned by their creators and follow the established detachment policy. Existing combat locks
and separate campaign/account deletion rules remain in force.

Confirmed: there are different scopes of choice over the same character decision system.

| Flow | Available choices | Campaign review |
| --- | --- | --- |
| Main creation wizard | Foundational choices such as ancestry, culture, career, and class, plus access to all levels and their applicable options. | The Director reviews and approves a character newly added to or created for a campaign before it becomes effective there, including imported or duplicated characters. |
| Level-up wizard | Only choices available to this character for the level transition, including choices/grants that transition unlocks. Existing foundational choices stay in place. | Level-ups are not Director-review gated. Rules/eligibility validation still applies. |
| Full character edit | Reopen the main wizard outside an active encounter, including foundational choices and all levels/options. | For an attached character, the Director approves the proposed edit before it takes effect in the campaign. |

**Confirmed 2026-09-15 (Q-CHAR-3):** The campaign awards XP; the character sheet owns eligibility and
level-up steps. A transferred hero earns toward the next level from their admitted level, with zero
new-campaign XP and a separate entry-level eligibility offset. See [the owning level-up policy](character-wizard-spec.md#level-up).

Foundational choices are normally made once during creation, but are revisitable through full editing. The
main wizard is not restricted to level 1; the level-1 Fury proposal below is only the first implementation
slice. Level-up is a scoped operation over the same definitions and history, not a second independently
maintained set of rules. A full edit that happens to raise the level still follows the full-edit approval
flow; unrelated build changes must not pass through the level-up path to avoid review.

The owning user makes the choices. The Director reviews and approves the resulting character/change rather
than selecting replacement options. Sheet/history access for the campaign owner, subject to the access spec's
private-field policy, does not by itself establish approval authority for that role; the approval role
specified here is the Director. An active Director's own character admission and full edits are logged and
require no approval step. Other characters retain Director review. This exemption does not bypass build
validation, campaign source limits, or combat character-edit locks.

### Working revision and effective campaign build

The user's version-control analogy establishes a useful distinction: the owner's proposed character and the
character effective in the campaign can differ while review is pending. Saving or submitting full edits must
not leak proposed abilities, characteristics, or other build effects into campaign play. The existing
effective build stays in use until approval. A new campaign character has no effective campaign build until
initial approval. Unattached characters can use the full wizard without campaign review; their chosen build is
reviewed on campaign admission.

Proposed representation: retain progression revisions, an effective campaign build reference, and a proposed
revision with review status. Bind approval to the exact revision reviewed; later edits need review of the
changed proposal. Show the Director the proposed sheet/history and a readable comparison with the effective
build, respecting the access spec's private-field policy. Declining or withdrawing a proposal leaves the
effective build unchanged. A valid level-up advances the effective build through its scoped operation without
waiting for approval, and remains recorded in progression history.

Approved build changes must apply against current inventory/live state, not overwrite them with a stale
whole-character snapshot from when drafting began. This review is separate from ordinary game-log operations
changing resources during play. The exact boundary for standalone flavor/inventory edits outside the full
wizard remains open; do not introduce review of every combat resource change by treating it as full editing.

Inspecting progression history remains available. Activating an earlier or otherwise edited build in an
attached campaign is a proposed full change subject to review. Q-CHAR-4 now defines restoration as
appending a new snapshot revision; subsequent finalized edits follow it. Pending proposals still
follow the owning [revision/review lifecycle](character-wizard-spec.md#7-revision-and-review-lifecycle).
Approval of an obsolete proposal must not silently overwrite intervening build changes. These requirements
call for versioned character revisions, not a general-purpose source-control system.

Review status does not introduce a third attachment type or allow attachment to two campaigns. The precise
moment pending admission reserves/establishes the one campaign attachment remains an implementation decision.

Acceptance examples: a new/imported campaign character is inactive there before approval; full edits leave
campaign abilities/stats on the effective build until approval; approval activates the reviewed build; a valid
scoped level-up takes effect without review; foundational edits are refused by the level-up operation; editing
a submitted proposal prevents approval of its old revision from activating unseen changes. These are required
behaviors to implement, not completed tests.

## Progression history and rollback

Confirmed: the decision matrix must behave like the game log, allowing the character's progression to be
rolled back to any previous point in the recorded decision history. The user's example is a level-7 wood elf
Shadow restored to their level-3 build. This changes the level tree and the stats built from it; it does not
rewind inventory.

This makes build history part of the character model from the start. Lowering a level field alone is
insufficient: restore the choices that were active at that earlier point, including choices subsequently
replaced, together with their automatic grants and derived baseline. Higher-level abilities and characteristic
increases no longer contribute. Restoring a previously completed build should not ask the player to
reconstruct its choices. History points can occur within character creation or advancement, not only at
completed levels.

| On progression rollback | Intended behavior |
| --- | --- |
| Decisions, level, and build-derived stats/abilities | Restore the recorded earlier build and its baseline. |
| Inventory | Keep present item instances, quantities, and item state, including items acquired after the chosen progression point. Do not rerun starting-equipment grants. |
| Authored descriptions and flavor | Keep independently authored content; restoring the build is not a rewind of unrelated edits. |
| Current damage, spent resources, conditions, and other live effects | Do not restore an old encounter state. Retain compatible current amounts and cap above lowered maxima under Q-CHAR-2; explicitly reconcile incompatible resource types. |

An unchanged inventory can still have different mechanical effects under the restored build, where item rules
depend on level or another build property. Keep the item's ownership/state distinct from its contribution to
the effective sheet. The resulting character combines the earlier progression with present inventory and
applicable live state; it is not the entire character as they existed on an earlier date.

**Confirmed 2026-09-15 (Q-CHAR-4):** Every finalized edit appends an immutable build snapshot,
like a commit. Restoring the old level-three build makes a new latest entry containing that build;
it keeps the intervening level-four through level-seven history. New finalized choices follow the
restoration entry. Record the source revision of a restoration independently from its position at
the top of history. Restoring the old level-seven build later also appends a new snapshot.

Retain enough resolved build state and source context to restore without replaying grants or
reinterpreting against newer content. Inventory, authored details and live state retain their
independent scopes above. Previewing history does not finalize a revision, and a finalized revision
still follows campaign review before activation where required. See [the owning history contract](character-wizard-spec.md#5-progression-history).
This model does not require Git storage or a general branch/merge interface.

The shared operations must support applying this change to the actual character sheet, not just preview older
wizard screens. For an attached campaign character, restoring a different build follows the full-edit review
gate above: inspecting or proposing the old build does not immediately replace the campaign's effective build.
Table history and progression history have distinct scopes. Their concrete linkage when changing an actively
played character remains to be designed, while preserving the table's existing state-restoration guarantees.

Acceptance example: retain a level-3 Shadow build, progress it to level 7 with additional decisions and an
inventory change, then restore the level-3 history point. Assert the earlier decisions, grants, and
build-derived values; assert that later-level contributions are absent and present inventory is identical
before/after rollback. Assert a new latest revision containing the level-three build, linked to its
source snapshot, with the original level-three and level-seven entries unchanged. Finalize another
edit and verify it follows the restoration entry. Also exercise an intermediate finalized decision
point and ensure restoration does not repeat item grants. Apply [the confirmed current-value and downward-cap policy](character-wizard-spec.md#current-values-when-a-build-changes)
when restoring the lower-level build. This is a required model capability, not a claim that Shadow progression is already implemented.

## Proposed integration

### Ownership and entry into a campaign

Confirmed: every character belongs to a user and is either unattached or attached to one campaign. The
campaign owner and active Director gain sheet and progression-history access while it is attached, excluding
owner-private character notes as confirmed in the newer
[accounts and access specification](accounts-and-access-spec.md); the campaign can tie operations into
character values such as Victories and experience. Current direction: character build options are chosen by
the owning user, not by the Director on their behalf. The same character cannot join another campaign
simultaneously. Detachment frees it for reuse; duplication creates an independent character for another
campaign. See [the attachment requirements](product-features.md#character-ownership-and-campaign-attachment)
for remaining permissions.

Campaign values, including XP and Victories, clear on detachment and do not transfer into another campaign.
The character keeps its current level and build; zeroing XP must not recalculate the character down to a
starting level. Inventory, authored details, and progression history remain with the character. A duplicate
entering another campaign starts with cleared campaign values while the original's campaign values remain
unchanged. **Confirmed 2026-09-15 (Q-R-201):** Current play values are campaign-tracked and do not
transfer. Destination admission starts Stamina and Recoveries full from the admitted build, clears
prior conditions/temporary effects and initializes other resources normally. Within-campaign build
restoration still uses Q-CHAR-2. See [the owning campaign lifecycle](character-wizard-spec.md#campaign-lifecycle).

Attachment includes choosing an entry level no higher than the character's current level. This selects the
corresponding build from progression history and its derived baseline for Director review while keeping
inventory, applying the rollback scope above. That build becomes effective in the campaign upon approval. It
does not discard retained higher-level history. The model must distinguish the owner's working revision, the
effective campaign build, retained progression history, character ownership, and current campaign attachment.
Presenting retained history is separate from approval to activate a different build once attached.

Proposed acceptance examples: attach a level-7 character at level 3 and verify the sheet and unchanged
inventory; reject entry above the pre-attachment current level; reject a second simultaneous campaign
attachment; detach a character with nonzero XP/Victories and verify both clear while current level, build,
history, and inventory remain; duplicate into another campaign and verify cleared campaign values in the copy,
unchanged values in the original, and independent subsequent changes; verify sheet/history visibility for the
campaign owner and active Director under the access spec's private-field policy without allowing that role to
choose someone else's build options. Assert full Stamina/Recoveries and fresh source-defined live
state on destination admission, with old campaign damage/conditions absent and original-copy state
unchanged (Q-R-201). Imported snapshots may require reconstructing missing lower-level choices, as described in
[interchange research](forge-steel-interchange.md).

### Progression and content inputs

The progression/content foundation uses three inputs, alongside the authored details, inventory, and play
state described above:

1. **Progression definitions:** which choices and automatic grants appear at a level, their counts, option
   pools, timing, and dependencies. Derive these from Forge Steel and verify their meaning against Compendium
   rules.
2. **Content references:** explicit SCC IDs for the rules and selectable content. Resolve descriptions and
   ability definitions from the pinned Compendium. One rule entry can justify several prompts; some choices
   are sections of a larger entry rather than standalone records.
3. **Player selections:** our own compact character draft referencing those choices and content IDs. Derive
   the sheet from the draft and definitions through shared operations usable by the UI and headless client.

Proposed runtime boundary: the app consumes our normalized progression definitions and Compendium content,
without depending on Forge Steel's React components or mutable hero objects. Whether to generate most
progression definitions or translate them directly remains open. The source inventory is deliberately not that
runtime format.

Retain upstream references for maintenance, but do not make Forge Steel IDs our global content identity. For
example, `fury-sub-1-3-1` appears in both Berserker and Stormwight files at this pin. Scope references by
source path/owning branch. Name matching can suggest an SCC mapping, but ambiguous or missing matches need
explicit handling; do not silently substitute Forge Steel prose or discard a required choice.

## Concrete Fury mapping

The following relationships were inspected against the pinned class, subclass, factory, and Compendium files.
They illustrate the boundary; they are not an exhaustive Fury implementation.

| Wizard behavior | Forge Steel structure | Compendium evidence |
| --- | --- | --- |
| Choose one primordial aspect | `fury/fury.ts`: `subclassCount: 1`, three subclass references | `mcdm.heroes.v1/feature.fury.level-1/primordial-aspect` contains Berserker, Reaver, Stormwight and their granted skills. |
| Grant Nature; choose two exploration/intrigue skills | Level 1 skill factories; Nature is preselected | `mcdm.heroes.v1/class/fury`, Skills section. A preselected skill grant must not become another empty prompt. |
| Choose one signature, one 3-Ferocity, and one 5-Ferocity ability | Three level 1 `createClassAbilityChoice` calls; factory default count is one | `mcdm.heroes.v1/feature.fury.level-1/fury-abilities`; selected abilities have their own SCC IDs. |
| Display Brutal Slam from Compendium | `fury` ability pool includes Brutal Slam | `mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam` supplies the actual ability. |
| Branch kit selection on aspect | Berserker/Reaver have ordinary kit choices; Stormwight restricts kits to `Stormwight` | `mcdm.heroes.v1/feature.fury.level-1/1st-level-aspect-features` and `mcdm.heroes.v1/feature.fury.level-1/beast-shape`. |
| Add an aspect ability choice at level 2 | Each Fury subclass has a nested `createChoice` of abilities | `mcdm.heroes.v1/feature.fury.level-2/2nd-level-aspect-ability`. Preserve the selected-aspect restriction. |

Local source directory: [`src/data/classes/fury`](../vendor/forge-steel/src/data/classes/fury). Compendium
definitions are under [`en/unified/json`](../vendor/steel-compendium/en/unified/json); see
[navigation instructions](compendium-navigation.md) to resolve SCC IDs and recover sourcebook context.

## Details that affect the design

- Class files alone are insufficient. Subclasses, Conduit domains, kits, nested choices, and factory defaults
  carry part of the progression. Conduit has zero subclass selections in Forge Steel; do not force every class
  through an identical subclass screen.
- Forge Steel distinguishes `build`, `respite`, and `play` selection timing. Creation, later reassignment, and
  temporary in-play decisions need distinct behavior.
- A nested choice is conditional on its parent. Changing class, aspect, or level must re-evaluate dependent
  selections and report what needs choosing again.
- Ability choices carry pool restrictions, minimum level, cost, and count. Matching cost alone is
  insufficient.
- Beastheart and Summoner use their own Compendium sourcebook namespaces. Preserve the full SCC ID, not just a
  slug.
- Matching a content record establishes availability, not combat automation. Existing engine coverage still
  determines what can be resolved automatically at the table.

## Proposed first implementation slice

Build one complete level-1 Fury creation path, including ancestry, culture, career, characteristics, aspect,
kit, abilities, any resulting choices, and review, before expanding all class branches. Our prepared
[hero fixture](hero-fixture.md) is a useful example, but it must not become the only legal build. Verify
choices against the referenced rules and reproduce its derived values through creation operations.

Expose the draft, available choices, selection validation, and derived sheet through shared application
operations. The mobile wizard should render these operations. Convex remains the chosen backend for saved
characters. As of 2026-09-14 the checkout stores authored details and immutable saved selection revisions
(`convex/characterTables.ts`, `convex/characters.ts`) behind a temporary desktop page; decision
definitions, the evaluator, derived baseline and the decision wizard itself are not implemented (see the
[specification's implementation status](character-wizard-spec.md)).

Acceptance for that slice: complete a legal hero, reject invalid/out-of-pool selections, handle an aspect
change without leaving incompatible kit/ability choices active, show Compendium rules content, save/reload the
selected draft, and load the resulting hero through the shared playtest operations. Broader level advancement
and additional classes follow once this flow works.

Include Forge Steel import in the first model validation: the same Fury built in Forge Steel and in our wizard
should produce equivalent supported choices and derived values. Before promising compatible export, open the
exported hero in the target Forge Steel version and check that those selections and state survive its update
pass. See the interchange investigation for the additional Conduit, homebrew, and older-format cases.
