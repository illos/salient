# App features: first pass

Status: working feature inventory from the user's description on 2026-09-10. This records product intent; it is not a final release scope, screen layout, or implementation plan. Items explicitly labeled as suggestions or open questions are unsettled.

## The table: the heart of the app

The table is where a campaign's participants come together to play actual sessions. It brings together people, conversation, characters, monsters, and real-time rules resolution.

Stated capabilities:

- Multiple participants joined in the same shared play space, together in person or remotely.
- An active Director running play.
- Text chat.
- A rolling dialogue/history of what has happened at the table, including actions and their outcomes.
- Character sheets and monsters available during play.
- Rules interpreted through the engine as players take actions.
- Damage, conditions, effects, and resources reflected in the relevant sheets and stat blocks.
- Encounters run at the table, with relevant resources persisting across sessions.
- Spatial outcomes usable as prose instructions without requiring an integrated digital map.

The table should remain useful outside combat as well as during encounters. Specific noncombat workflows are still to be listed.

### Useful play with partial automation

The app should provide the practical tools for loading monsters, preparing encounters, and identifying the abilities a character can use even while the engine's supported mechanics are growing. Availability and affordability should reflect known character and table state; unresolved prerequisites should remain visible rather than being guessed.

Players must be able to read the full ability text and see what the engine actually applied. They can supply missing outcomes and correct mistakes through manual game operations. The action's history should distinguish automated effects, manual effects, and anything still awaiting resolution. Manual changes belong to the same state/history system and remain reversible.

An unsupported mechanic must not make its text inaccessible or prevent the table from resolving it manually. If that mechanic affects later results, those dependent results need the table's answer before automation can complete them. Interface details and permissions remain open.

The intended progression is useful play with increasing automation: as the parser and interpreter improve, players should have fewer mechanical steps to handle themselves. Full ability text remains available regardless of automation coverage.

### Headless play and UI iteration

The visual table will need extensive iteration. Both the engine and the app's game operations must be usable independently of that UI.

A CLI-like development interface should let agents load heroes and monsters, run actions and battles, record inputs and outputs, and inspect changes to sheets and table state. This supports two distinct checks: whether the engine interpreted the rules correctly, and whether the resulting effects were actually applied to the intended character or monster. See [the development workflow](development-process.md#headless-development-workflow).

### Table history and rollback

The running history is central to both play and development. The game should behave as a state machine: actions produce transitions from one game state to the next, and those transitions remain available across sessions.

The current checkpoint places action-by-action undo inside an encounter and realtime shared play inside an open session. Every encounter action must be reversible. Restoring a point means restoring the corresponding game state, including affected characters, monsters, resources, conditions, and turn or encounter progress. Removing a displayed history entry alone does not satisfy this requirement. Earlier discussion called for returning to an earlier point in any session; whether a closed session can be reopened for live undo remains unanswered following the session-archive refinement. Preserve historical detail while that policy is open.

Navigation works forward as well as backward through recorded history. The log records initial game values, inputs sent to modifiers such as the rules engine and dice roller, their outputs, and the resulting changes. Navigation restores the state before or after an action using that record; it does not run the inputs through the modifiers again.

The CLI-like interface must also expose history and rollback so agents can reproduce and investigate a sequence without the visual UI. The visual table presents that same activity as an ongoing dialogue.

Preserve the game log from every session so campaign players can review their play history. The user also wants to analyze usage across sessions and campaigns. Possible future character/campaign dashboards include times winded, monsters slain, and ability uses; a further analysis engine is exploratory and its behavior remains unspecified. Metric meanings, access policies, and treatment of rollback need definition. See the proposed [app data storage analysis](data-storage-analysis.md) for the persistence and statistics model.

After session closure, its game log can be compressed and relevant data delivered to persistent records and statistics. The proposed [data structure and architecture specification](data-architecture-spec.md) retains detailed archives alongside smaller current-state, summary, and archive-reference records. Current character values are saved during play; closure must not apply their effects again. An encounter spanning sessions and non-encounter activity are covered as proposed contracts.

Still to decide: who can roll back, the exact boundary of one action when reactions or choices intervene, how chat behaves during rollback, continuation after undo, and whether live undo can cross encounter/session boundaries or reactivate archived state. These decisions should not be assumed from the requirement to restore game state.

## Campaigns and participants

- A table belongs to a campaign.
- A campaign has an owner, an active Director, and a group of players.
- Share codes/URLs let players request membership; campaigns may also be listed in the public campaign directory. The owner approves requests and can kick members.
- A user can ban another user from requesting membership in any campaign they own. Effects on existing memberships and broader social blocking remain open.
- The owner is initially active Director; other members are initially players. The owner can appoint a player as the sole active Director for the current session, if one is active, or until revoked.
- Each participant, including the Director, can have multiple characters in that campaign.
- Campaign creation allows enabling/disabling content sources. Reusable content is grouped into packs/sets, common to official content, future available MCDM additions, community-authored content, and personal homebrew. See [content packs and campaign selection](data-architecture-spec.md#31-common-pack-contract--proposed) for proposed portability/versioning contracts and unsettled behavior after creation.

Ownership, acting as Director, and having characters are distinct concepts. Character access through campaign attachment is defined below; character build choices remain with the owning user. Director appointments and character control grants are recorded in the [accounts and access specification](accounts-and-access-spec.md). Other editing permissions and campaign ownership transfer remain to be defined. The number of tables and concurrent sessions per campaign remains open; the [data architecture checkpoint](data-architecture-spec.md) proposes records for successive sessions and encounter segments.

### Character ownership and campaign attachment

Confirmed requirements:

- Every character remains owned by the user who created it. Campaign attachment and sharing do not transfer ownership to the campaign owner, Director, or another player.
- The character owner can grant another player permission to view and run the character in combat for the current session or until revoked. Private-field exclusions and the grant's exact relationship to campaign membership remain open; see the [accounts and access specification](accounts-and-access-spec.md).
- A character is either unattached or attached to exactly one campaign. It cannot be attached to multiple campaigns at once.
- While attached, the campaign owner and active Director can see the character sheet and access its progression/decision-tree history. Possible private-field exclusions, such as player notes, remain to be defined. Current direction: they do not choose build options for someone else's character. Being Director does not grant control of those selections; a Director who owns a character still makes its choices as the owning user. Inspection of history does not itself authorize changing the active build. Other override/rollback permissions remain to be specified.
- An attached campaign can connect its operations to character values such as Victories and experience. The character is a participant in ongoing campaign state, rather than merely a read-only imported sheet.
- A character can be detached, becoming unattached and available to attach elsewhere.
- On detachment, campaign values clear, including XP and Victories. The user keeps the character and its current level, progression history, authored details, and inventory. Clearing XP must not lower the character's retained level or undo earned build choices.
- A character can be duplicated into another campaign. The duplicate is a separate character, so later changes do not synchronize with the original; the original can remain in its existing campaign.
- Campaign values do not carry into another campaign, whether moving through detachment or duplicating there. The destination starts with cleared campaign values; duplication does not clear the original character's values in its existing campaign.
- On attachment, the user chooses the entry level, up to the character's current level. Lower-level entry uses the corresponding progression build and its derived stats. It is not a level-number-only change.
- New characters added to or created for a campaign require Director review and approval before becoming effective in that campaign. Full edits to an existing campaign character also require approval before the changes take effect; the existing effective build stays in use meanwhile. Level-ups through the scoped level-up wizard are not review gated. See [wizard modes and review](character-wizard.md#wizard-modes-and-campaign-review).

Example: a user owns a level-7 wood elf Shadow. They can attach that character to a campaign at level 3, using the level-3 progression with their present inventory. They cannot simultaneously attach that same character to another campaign, but can duplicate it into another campaign or detach it before moving it. A level-7 original and a lower-level campaign copy remain distinct character instances.

Level selection follows [progression rollback](character-wizard.md#progression-history-and-rollback): it selects the build and derived baseline submitted for admission without rewinding inventory. The build becomes effective after Director approval. The preserved history remains available; a higher-level history entry is not permission to bypass the full-edit review gate. Scoped level-ups are ungated. The entry-level ceiling refers to the current level at attachment, not automatically the highest level anywhere in retained history.

Proposed attachment behavior: preview the chosen build and its outstanding conversions, then submit that revision for Director approval before it becomes the effective campaign build. Pending admission must still respect the single-campaign attachment constraint. If an imported character lacks enough history to reconstruct a requested level, surface missing choices and resolve them rather than inventing an earlier build. Duplication should create a new character identity, copy the build/history and independent authored/inventory data, and submit it for destination approval without copying the original's campaign authority, approval, or table membership. Clear campaign values in the duplicate. The clearing rule concerns campaign values; it does not yet specify treatment of current damage, conditions, or every encounter resource during duplication/detachment.

Still to define: which campaign operations control Victories/experience and the complete set of campaign values; permissions for attachment, detachment, and owner-driven progression edits during play; and access to historical campaign records after detachment. The reset policy itself is settled: campaign values clear and the current level remains. Proposed access boundary: detachment removes access to the live character granted by that attachment, while existing campaign log records remain subject to the campaign's own history policy. Clearing current campaign values does not mean deleting recorded campaign events. Visibility for ordinary players without a character grant remains open.

## Account and social features

The [accounts and access specification](accounts-and-access-spec.md) consolidates signup, account management, separate administrative sign-in, and the Convex Auth/Better Auth investigation. Convex is the data system; the final authentication library remains open.

- User profile and name.
- Signup, email, password, and account settings.
- A separate administration dashboard with its own sign-in requirements; exact admin authentication and powers remain open.
- Friends mechanic with sending, approving, denying, and revoking requests, plus controls to manage friends and blocking.
- Basic relationship categories: unaffiliated, friend, or blocked, with incoming/outgoing pending requests represented separately.
- Include this relationship foundation early. Friendship initially grants no additional access; friends-only campaign or statistics visibility is a possible future feature.

The [proposed friendship and blocking lifecycle](accounts-and-access-spec.md#4-friendship-and-blocking-foundation) shares a relationship mechanism while distinguishing mutual friendship from unilateral blocking. Removing friends, clearing requests on block, and unblocking without automatic restoration are proposed transition rules. Whether personal blocking also applies the owner-wide campaign ban, and its effects on invitations, chat, existing memberships, and character grants, remain open.

## Things a user can own

- Campaigns.
- Characters.
- Saved encounters.
- Homebrew content, including monsters.

This list is intentionally open. Characters retain user ownership and have at most one campaign attachment, as defined above. Character viewing/combat sharing is established above and does not transfer creator ownership. Homebrew/encounter sharing, broader editing rights, and campaign ownership-transfer behavior remain unsettled.

### Saved encounters

A saved encounter is a reusable preselection of monsters with additional supporting data. The exact supporting fields are still to be determined.

Loading a saved encounter into a table copies a snapshot of its data into that table. The loaded monsters and supporting data are independent of the saved encounter: changes during play do not change the saved version, and later edits to the saved version do not change a snapshot already loaded at a table. Loading it again creates another snapshot.

## Public reference libraries

Anyone should be able to use these tools without joining a campaign:

- **Rules:** browse and find Draw Steel rules.
- **Items:** browse and find game items.
- **Foes:** search the monster stat blocks in the Compendium.

Public access is part of the stated intent. Saving personal collections, publishing homebrew, and sharing private content need separate decisions.

## Creation tools

The [character wizard specification](character-wizard-spec.md) consolidates the detailed character requirements, proposed operation contracts, acceptance scenarios, and open decisions.

Character creation and management must support importing Forge Steel hero data files; compatible export is also desired. Maintain our own character model, with an interchange adapter. See [the file-format investigation](forge-steel-interchange.md). Exact supported versions and the treatment of unmapped homebrew remain to be established through implementation.

- **Encounter builder:** prepare and save encounters for use in play.
- **Character wizard:** the main creation/full-edit wizard exposes foundational choices and all levels/options; a separate level-up view shows only choices applicable to the character's level transition. Both use the same decision system. Campaign admission and full edits require Director approval; scoped level-ups do not.
- **Monster builder:** author homebrew monsters using supported stat-block language.

These tools should connect to the things users own and the campaigns where they play. Their detailed steps and the first supported content subset remain open.

## Possible additions to consider

These are suggestions, not accepted requirements:

- Session notes and a record of where the group left off.
- Director notes and control over information revealed to players.
- Bookmarks or collections for frequently used library content.
- Import, export, and duplication of other user-created content, beyond the character import/desired export and campaign duplication requirements already established above.

## Next discussion

Continue defining what participants can do at the table independently of screen layout. Player and Director walkthroughs can refine those operations while the visual design remains open to iteration.
