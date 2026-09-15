# Forge Steel character interchange

## Requirement and investigation scope

**User reaffirmation, 2026-09-15:** retain both import and export as planned features. The working
Forge Steel wizard is a reference for choice ordering and specific grants, including nested and
level-dependent choices. Verify mechanical meaning against the pinned Compendium. Preserve the
bidirectional adapter boundary while generalizing the editor; this does not require adopting
Forge Steel's UI/storage model or implementing the adapters in the initial expansion slice.

**Pre-alpha clarification, 2026-09-11:** import and export implementation are both deferred beyond v0.01.
Compatibility remains a present design requirement: use this research when defining the character model and
shared wizard operations so later adapters do not require tearing down the wizard. The
[character specification](character-wizard-spec.md#1-product-outcome-and-scope) owns that boundary. The
conversion and round-trip examples below are later implementation work, not prototype completion gates.

Confirmed: preserve the ability to import Forge Steel character data files while designing our own character model. Compatible export is desired. Neither requirement means adopting Forge Steel's storage model. The user accepted the direction of an adapter that translates supported data and retains unmapped data. Detailed schemas and conversion behavior below remain proposals, not implemented behavior. See [character model direction](character-wizard.md#character-model-direction) for how decisions, authored content, inventory, and changing sheet values fit together.

Investigated source: Forge Steel commit `5a846aadb623a9855a023e9403bb887a956c341f`, package version `14.197.0`. Findings apply to that pin. No `.ds-hero` or `.drawsteel-hero` samples are tracked in that upstream tree, and no user-exported sample was supplied for this investigation. This is analysis of the actual serializer, import path, models, and update logic, not a successful live application round trip. An accepted filename extension does not establish support for every historical file shape.

## File format and import path

### Live export inspection — 2026-09-15

At the user's suggestion, inspected the current [Forge Steel website](https://forgesteel.net/)
in an isolated local browser profile and used its actual **Use a Premade Hero → Bethell → Export
→ Export as Data** flow. The About panel reported version **14.198.0**, distinct from our pinned
source reference **14.197.0**. Neither vendor pin was changed.

The resulting `Bethell.ds-hero` is a level-one Polder Elementalist with Fire selected. It embeds:

- Class definitions at every level from 1 to 10.
- All four specialization definitions, with only Fire marked selected.
- A 40-entry class ability pool.
- Filled level-one ability/enchantment/ward selections, plus future choice definitions with empty
  selections. For example, the level-two ability choice exists but its `selectedIDs` array is empty.

This confirms the user's observation that an exported hero carries later-level choice structure.
It does **not** make those options active grants or establish a completed higher-level build.
Retained selections may also exist in dormant branches of edited characters, so level, active
branch and actual selection must all participate in determining effective grants.

[Inspection metadata](research/forge-steel-live-export.json) records the version observed, file
fingerprint and representative populated/empty choices. The actual 161,898-byte export is retained
locally at `.playtest/forge-reference/Bethell.ds-hero` (ignored, not a committed content asset).
This is an actual website-export inspection, not a successful Salient import/export or a reimport
round trip. The full build has not yet been audited against the pinned Compendium.

### Targeted fixture workflow

Use the website to build selected ancestry/class/subclass/level combinations when a slice needs
a concrete target. Explicitly constrain sourcebooks and selections to our eleven-class scope;
the live random generator can include content beyond that scope. Complete the target level's
choices before declaring a fixture complete, then export its data and readable sheet.

Trace selected features and automatic grants against the pinned Compendium before accepting
expected results. Preserve website version, sourcebook IDs, exact export and any differences
from our pinned reference. A current website result must not silently advance vendored rules.

One low-level export can inform progression-definition mapping across later levels. To test actual
advancement, save separate completed exports before and after a transition, then compare the
specific chosen grants and derived values. Preserve these as distinct observations; the embedded
future definitions are not chronological character history. Recreate accepted targets through our
wizard/headless paths, then use the same data in later import/export round-trip tests.

The supplied official PDFs remain useful independent sheet comparisons; these structured exports
add selectable progression detail and direct interchange test material.

### Pinned serializer findings

- **Current export:** `<hero name>.ds-hero` (fallback name `Unnamed Hero`). The data command passes the entire `Hero` object to `Utils.saveFile`.
- **Encoding:** plain JSON, serialized with tab indentation by `JSON.stringify(data, null, '\t')`, downloaded as `application/octet-stream`. There is no archive, compression, wrapper, schema version, or application version added by this exporter.
- **Accepted extensions:** `.drawsteel-hero` and `.ds-hero`. The picker calls `file.text()`, `JSON.parse`, and a TypeScript cast to `Hero`. That cast supplies no runtime validation.
- **After parsing:** the main import function assigns the destination folder, changes the hero ID if it collides with an existing hero, calls `HeroUpdateLogic.updateHero(hero, sourcebooks)`, then persists and opens the hero.
- **Other exports:** PDF and image exports are visual sheets, not the structured interchange target. `FS1` share codes in `sharing-logic.ts` carry items, titles, or monsters at this pin; they are not hero-file encoding. The compact `Pregen` model is also distinct from the exported `Hero` model.

Direct evidence: [export/import handlers](../vendor/forge-steel/src/components/main/main.tsx), [file picker](../vendor/forge-steel/src/components/pages/heroes/hero-list/hero-list-page.tsx), [serializer](../vendor/forge-steel/src/utils/utils.ts), [share codes](../vendor/forge-steel/src/logic/sharing-logic.ts), [Pregen model](../vendor/forge-steel/src/models/pregen.ts).

## What a hero file contains

The file embeds substantial definitions as well as player choices. It is not a flat sheet or a list of content IDs.

| Location | Contents and compatibility implications |
| --- | --- |
| `id`, `name`, `picture`, `folder`, `isActive` | Identity and presentation. Pictures can be data URLs. Keep our character ID separate from the imported ID. |
| `sourcebookIDs` | Sourcebook identifiers, not bundled sourcebooks. The embedded hero is not necessarily sufficient to restore every library-dependent selection. |
| `ancestry`, `culture`, `career`, `class`, `complication` | Embedded objects or null, permitting unfinished characters. Career also contains the chosen inciting incident. |
| `class.level`, `primaryCharacteristics`, `characteristics` | Chosen level and characteristic information. Full sheet values are derived elsewhere. |
| `class.featuresByLevel`, `abilities`, `subclasses` | Progression definitions and ability pools, including unselected options and later levels. Subclasses have a `selected` flag plus their own definitions. Presence in the file does not mean the hero has a feature. |
| `features` | Additional hero-level features, including the default language choice and customized additions. Choices are not confined to the class. |
| `abilityCustomizations` | Ability ID, renamed title/description/notes, cost modifier, distance/damage bonuses, and characteristic override. These must not vanish when matching an official ability to Compendium content. |
| `state` | Stamina damage, temporary Stamina, recoveries used, surges, Victories, XP, hero tokens, Renown, Wealth, project points, conditions, inventory, projects, titles, controlled encounter slots, notes, and encounter/display flags. |
| Nested feature data | Heroic-resource values and gain-used flags also live here, outside `state`. A state-only copy misses part of current play state. |

Direct evidence: [Hero](../vendor/forge-steel/src/models/hero.ts), [HeroState](../vendor/forge-steel/src/models/hero-state.ts), [class](../vendor/forge-steel/src/models/class.ts), [features](../vendor/forge-steel/src/models/feature.ts), [default hero/state construction](../vendor/forge-steel/src/logic/factory-logic.ts), [picture upload](../vendor/forge-steel/src/components/pages/heroes/hero-edit/details-section/details-section.tsx).

### Selections are recursive and use different representations

Class ability choices store `data.selectedIDs`. Generic choices store whole selected feature objects. Kit, perk, and domain selections store arrays of objects. Skill/language choices store string arrays. Some other choices store a single object or null; titles use a selected-feature ID. A selection can contain more choices. Keep owning class/subclass/feature context when mapping; Forge Steel IDs are not safe to assume globally unique (see the Fury example in [wizard research](character-wizard.md)).

The adapter must distinguish available options, active selections, automatic grants, and dormant choices at higher levels. The static source inventory does not perform that traversal.

### Current state is not simply current totals

Forge Steel stores `state.staminaDamage`, not current Stamina. Its current Stamina calculation subtracts that damage from a derived maximum. Recoveries likewise have a derived maximum and a `recoveriesUsed` counter; temporary Stamina is separate. Heroic-resource values are stored in `Heroic Resource` features as `data.value`, with resource-gain usage state in nested data.

When converting to or from our engine, reconcile the derived maximum before translating these counters. For example, with a verified maximum of 30, damage of 8 means current Stamina 22. Unknown maximum modifiers must produce an unresolved conversion instead of a guessed current total. Do not reset encounter resources on import as a side effect of character creation. These are findings about Forge Steel's representation, not independent verification of every Draw Steel formula. See [HeroLogic](../vendor/forge-steel/src/logic/hero-logic.ts) and [hero updates](../vendor/forge-steel/src/logic/update/hero-update-logic.ts).

## Why valid JSON is not enough for export compatibility

`updateHero` first runs structural migrations, then refreshes data. Examples of structural changes include old `isDisabled` flags becoming `isActive`, missing state/customization defaults, and a legacy `state.heroicResource` migrating into feature data. The exporter does not identify which migrations an arbitrary file needs.

The data refresh looks up recognized ancestry, culture, career, class, complication, and inventory IDs in supplied sourcebooks. It can replace embedded definitions with current library copies, then restore level, characteristics, subclass selections, and feature selections. Ability selections are filtered against available ability IDs. Some nested choices are reconstructed from the current sourcebooks.

Consequences observed in the code:

- Keeping an official ID while changing its embedded rules text does not guarantee Forge Steel will retain that text on import.
- Unmatched top-level definitions can survive, but that does not guarantee all their nested selections survive. In particular, kit/domain selections are rebuilt using sourcebook lookups, which can drop choices absent from those books. A custom complication has an explicit fallback to its imported object; fallback behavior is not uniform.
- Valid JSON, preserved embedded objects, and correct upstream IDs each help, but none alone proves the resulting hero is intact after Forge Steel updates it.

Direct evidence: [HeroUpdateLogic](../vendor/forge-steel/src/logic/update/hero-update-logic.ts), particularly `updateHeroStructure`, `updateHeroData`, and `updateHeroFeatureData`. [Upstream tests](../vendor/forge-steel/src/logic/update/hero-update-logic.test.ts) include refresh, missing-sourcebook complication, and nested resource-state cases; they were inspected, not executed here.

## Proposed adapter boundary

Import into our character draft and state through an adapter. Map known official content using explicit, scoped Forge Steel-to-SCC references. Steel Compendium supplies the canonical official text; imported changes or homebrew remain explicit overrides/custom content rather than silently becoming official definitions. An official-looking ID is not proof that the embedded object is unmodified.

Retain the original parsed payload separately as compatibility data, together with mapping information and import diagnostics. Keep it outside the normal rules evaluation path. This allows us to preserve unfamiliar fields, presentation details, customizations, and unsupported definitions without forcing our character model to contain Forge Steel's entire object graph. Unsupported data must remain visible as unsupported; preservation is not automation support.

For a character imported from Forge Steel, export should start from the preserved payload and update the fields and selections that our adapter understands. Track which fields our model owns and which branches changed. A class/aspect/kit change must deliberately rebuild or invalidate dependent branches; blindly patching a name or ID would retain stale choices. Do not silently emit an apparently complete export when a changed branch cannot be translated.

For a character created here, there is no original payload. Export needs to construct a complete compatible `Hero` graph using the supported target version's definitions, IDs, selection layout, and defaults. That is a separate acceptance case from preserving an imported file. The ordinary app model can still use compact SCC references.

Validate imported structure and bounded file size before mapping; treat imported text and pictures as user content. Our own format should record its schema version and adapter target version. Do not infer an exact Forge Steel application version from a hero file that contains none. Start with the pinned target and explicitly supported older shapes.

## First compatibility examples

Use a small set of actual Forge Steel exports during adapter implementation:

1. A completed level-1 Fury matching our first wizard slice, with selected abilities/kit, notes, and nonzero Stamina damage, used Recoveries, and Ferocity. Compare the supported build and state before and after import, edit, export, and Forge Steel reload.
2. A Conduit with nested domain selections, plus a Fury aspect change that replaces the relevant kit branch. Check branch ownership and preservation of active choices.
3. A customized/homebrew character, including a missing external sourcebook. Verify retained raw data and clear unresolved fields, and report any export restrictions instead of dropping content silently.
4. An incomplete hero and representative older file shapes. Accept intentional null choices; reject malformed structures without creating a partial saved character. Check unchanged unknown fields through a round trip.

Also export a hero built entirely in our wizard and load it in the supported Forge Steel version. Compare semantic choices, customizations, and state after Forge Steel's update pass; byte equality is not the objective. If sourcebooks or updates change the outcome, record that limitation. Importing a character snapshot does not import our campaign ownership, table membership, or action history.

Our character model also requires [progression rollback](character-wizard.md#progression-history-and-rollback). A Forge Steel hero snapshot does not supply a chronological record of previous decisions. Its embedded level definitions must not be presented as proof of the player's actual earlier builds. Preserve the imported snapshot as an initial history point; reconstructing earlier levels, where possible, is a separate operation whose inferred or missing choices must be explicit. Export the active build even when the adapter retains later progression records internally.

Use these findings to review the first wizard model's compatibility boundary now. Prove conversion and
round trips when interchange implementation returns to scope. This investigation does not supply a
converter, a version support guarantee, or a live round-trip result.
