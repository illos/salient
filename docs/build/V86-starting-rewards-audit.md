# V86 starting rewards source and lifecycle audit

Status: source/code audit complete; implementation and application proof belong to V86. This ledger does not claim item gameplay is complete.

Audited independently on 2026-09-20 from the pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, current character definitions, evaluator, activation, private Director setup and sheet code. No browser, online rules research, pilot artifacts, services or tests were used. Code was read only. The Chords CLI could not uniquely map this delegated caller; findings were delivered to the lead and implementation agent through the native collaboration channel.

## Finding and smallest implementation

The evaluator already derives starting Wealth, Renown, career project points and most selected treasure identities. `SupportingBuildFacts` displays those derived entitlements. They are not persistent possessions or mutable balances: `HeroLiveState` has none of these fields, and there is no general inventory table or operation. Re-evaluating a career can therefore change the displayed starting amount without a separately retained grant record.

Persist a character-owned, once-initialized starting-reward snapshot at first campaign admission. Record origin revision, source/provenance, balances and item states separately from both derived baseline and encounter state. An idempotent authenticated migration operation may initialize older admitted heroes from `liveState.origin.buildRevisionId`, checking that revision belongs to the character and has a usable source evaluation. Never initialize from the latest changed career or pending draft. If the origin cannot be recovered, report the blocker instead of guessing. Read-only queries must not mint grants.

Draft save, full-edit activation, historical restoration, detachment and readmission must preserve the existing record. These operations must not duplicate, remove or retroactively replace possessions merely because the build changes. Future duplication/import needs an explicit copied-inventory origin rather than blindly trusting another character's revision. New unattached drafts retain previews; first admission is the existing actual-play initialization boundary.

Expose the actual record through the owner and current Director UI/API while retaining source preview separately. Peer sheet permission does not imply personal inventory permission. Private Strange Inheritance identity/powers must not enter owner, peer, revision, history or public event payloads before the source's reveal condition. The existing Director-private setup remains the authority for the selected identity.

This completes only the implemented starting-reward ownership/balance boundary. Ordinary stash, transfers, equipment slots, item use, crafting prerequisites and project spending are separate work. The user authorized starting-reward fulfillment; this does not settle the previously deferred project-spending product decision in [Q-CHAR-9](../rules-questions-for-user.md#q-char-9-how-should-career-project-points-work-while-v1-downtime-projects-are-deferred).

## Career ledger

Each row was checked against its own file in `vendor/steel-compendium/en/unified/md/career/`. Wealth starts at 1 and Renown at 0 before these benefits. No core career directly grants a fixed treasure. Inciting-incident flavor does not add mechanical money/items.

| Career source | Renown bonus | Wealth bonus | Project points |
| --- | ---: | ---: | ---: |
| `agent.md` | 0 | 0 | 0 |
| `aristocrat.md` | 1 | 1 | 0 |
| `artisan.md` | 0 | 0 | 240 |
| `beggar.md` | 0 | 0 | 0 |
| `criminal.md` | 0 | 0 | 120 |
| `disciple.md` | 0 | 0 | 240 |
| `explorer.md` | 0 | 0 | 0 |
| `farmer.md` | 0 | 0 | 120 |
| `gladiator.md` | 2 | 0 | 0 |
| `laborer.md` | 0 | 0 | 120 |
| `mages-apprentice.md` | 1 | 0 | 0 |
| `performer.md` | 2 | 0 | 0 |
| `politician.md` | 1 | 1 | 0 |
| `sage.md` | 0 | 0 | 240 |
| `sailor.md` | 0 | 0 | 0 |
| `soldier.md` | 1 | 0 | 0 |
| `warden.md` | 0 | 0 | 120 |
| `watch-officer.md` | 0 | 0 | 0 |

[Project Points](../../vendor/steel-compendium/en/unified/md/rule/downtime/project-points.md) permits dividing these points between qualifying crafting/research projects once, or holding them. Other prerequisites still apply. Starting materials are at the Director's discretion; points never automatically mean a completed treasure or free prerequisites. Preserve the amount and source; do not simulate spent points or completed projects at admission.

## Complication reward ledger

All source paths below are relative to `vendor/steel-compendium/en/unified/md/complication/`. All core complication files were scanned for resources, possessions and treasure grants; the rows below are the relevant cases. Other skill, language, ancestry, class and combat-resource grants belong to V85 or their existing systems.

| Source | Starting reward and restriction | Prior implementation / required state |
| --- | --- | --- |
| `amnesia.md` | One chosen first-echelon trinket | Derived selected item only; persist possessed identity and source. |
| `betrothed.md` | One chosen first-echelon trinket; Renown cannot exceed level minus 1 | Persist possession; initialize Renown after the existing cap. This remains a later gain cap, not a negative starting grant. |
| `secret-twin.md` | One chosen first-echelon trinket with twin's name or sigil | Persist possession and source condition; marking is authored flavor, not a second item. |
| `cursed-weapon.md` | One chosen leveled weapon; damage weakness 2 | Persist possession; weakness already derives separately. Weapon effects are not automatically supplied by item identity. |
| `artifact-bonded.md` | Chosen artifact manifests only at the specified first involuntary zero-Stamina event | Persist bonded identity as absent, never initially equipped/active. Manifestation and its Recovery/damage cost are gameplay, not free initial inventory. |
| `shattered-legacy.md` | Chosen leveled treasure, broken and wholly inoperative; hero already has its repair project source | Persist broken item and granted repair source. Repair goal is half the normal Craft Treasure goal; item prerequisite is still missing until acquired. No item bonuses/actions while broken. |
| `strange-inheritance.md` | Director chooses a second-echelon trinket; operative only while level plus Victories is at least 5; powers unknown until first operative | Existing private `characterSecrets` setup supplies identity, while baseline contains a placeholder. Preserve secrecy and first-reveal memory. At level 1 with 0 Victories it is inoperative. The first later Wealth greater than 1 loses 1 Wealth once; do not turn this into a permanent penalty. |
| `advanced-studies.md` | Notebook of an eccentric class member | Fixed source-owned study object; later heroic ability is a temporary respite result, not an initial learned ability. |
| `crash-landed.md` | Power pack | Fixed source-owned device; activating/deactivating and damage-type choice belong to V85 manual actions. |
| `war-dog-collar.md` | Modified loyalty collar | Fixed source-owned device; explosion/reset actions belong to V85. |
| `siblings-shield.md` | Sibling's shield worn on back | Fixed source-owned shield; conditional no-flanking benefit must not be represented as a freely selected treasure. |
| `famous-relative.md` | Magic jewelry, such as a signet ring, enables summon-relative maneuver | Missing from prior `initialItems`. Fixed source-granted possession, not a freely selected catalog treasure. Summon action belongs to V85; relative's Renown 10 is not hero Renown. |
| `pirate.md` | One piece of a pirate map | Missing from prior `initialItems`; persist a fixed narrative possession. Conditional effective Renown plus 2 with pirates is not a global resource award. The completed map/treasure is not possessed. |
| `greening.md` | Carries a golden sapling from the source's story | Missing from prior `initialItems`; retain as a narrative possession, never invent a magical treasure entry. Immunity/weakness are separate derived benefits. |
| `refugee.md` | Director/owner define family asset held by invaders, potentially treasure/Wealth/project source | Retain source-backed future entitlement, not possessed item or spendable money. Recovery requires Director resolution. |
| `disgraced.md` | Earn 1 Renown | Existing baseline modifier; persist in initial Renown. |
| `outlaw.md` | Earn 1 Renown | Existing baseline modifier; persist in initial Renown. |
| `infernal-contract-but-like-bad.md` | Choose Renown plus 2, Wealth plus 2, or Stamina maximum plus 3 | Snapshot only the chosen resource result. No extra award for the unchosen branches. |
| `indebted.md` | Starting Wealth is −5; later earned Wealth gets one more | Initial total must be −5, not ordinary Wealth minus 5. Later earnings are a separate gameplay rule. |
| `curse-of-poverty.md` | At respite, Wealth above 1 is reduced to 1 and Recoveries increase per point lost | No automatic creation event or initial grant. |
| `antihero.md` | Three antihero tokens, each usable in place of one Heroic Resource; regains instead of earning a party hero token while below three | Distinct complication gameplay pool and substitution, not ordinary money or project points; report V85 support separately. |
| `chosen-one.md` | Three destiny points with Victory-linked recovery and psychic-damage spending drawback | Distinct complication gameplay pool, not Wealth/project-point balance or treasure entitlement; report its V85 gameplay support separately. |

## Item coverage and granted actions

The existing choice pools correctly restrict these core complications to **12 first-echelon trinkets, 14 leveled weapons, 35 leveled treasures, 3 artifacts and 8 second-echelon trinkets**. Unified source folders also contain supplemental Beastheart/Summoner treasures; do not expand a core pool by globbing every file in those folders. Match the source SCC prefix, not arbitrary mention of a core SCC elsewhere in the file.

Persisting a treasure is safe without implementing a general treasure engine. Calling that treasure fully playable is not: the [granted-ability gate](README.md#trait-granted-ability-completion-gate) still applies. An action can use the existing explicit manual route, with exact timing and source text; an item record alone does not satisfy that route. Worn/held/using-this-weapon conditions must remain explicit until equipment state is supported.

The first-echelon source paths are `treasure/1st-echelon/trinket/<slug>.md` beneath the same pinned unified root.

| Core trinket | Action or relevant effect to preserve |
| --- | --- |
| Color Cloak (Blue) | Cold immunity equal to level while worn; triggered shift when targeted by cold, then temporary matching weakness and unavailable repeat. |
| Color Cloak (Red) | Fire immunity equal to level while worn; triggered reduction to zero when targeted by fire, then temporary matching weakness and unavailable repeat. |
| Color Cloak (Yellow) | Lightning immunity equal to level while worn; triggered next-ability damage bonus, then temporary matching weakness and unavailable repeat. |
| Deadweight | While held, altered falling damage; after falling at least 5 squares, one melee free strike as a free maneuver during the fall. |
| Displacing Replacement Bracer | Maneuver swaps held size-1S/1T object with equal-size object within 10; conditional notice potency. |
| Divine Vine | Maneuver using Yllyric extends vine and enables distant Grab; explicit pull options and release without action. |
| Flameshade Gloves | Passing through thin mundane objects as part of move; failed passage may require main-action hard Might test to free hand. |
| Gecko Gloves | Passive grip protection and enemy Escape Grab bane; no distinct new standalone action. |
| Hellcharger Helm | Charge-linked temporary speed plus optional free-maneuver Knockback irrespective of target size. |
| Mask of the Many | Maneuver to take previously seen same-size humanoid appearance; appearance/gear choices are runtime inputs. |
| Quantum Satchel | Narrative brooch entanglement and object retrieval; no printed action cost—do not invent one. |
| Unbinder Boots | Temporary airborne movement limited to height 3 and falling at turn end; no distinct printed action. |

The leveled weapon source paths are `treasure/leveled/weapon/<slug>.md`. Below is the level-one section only; 5th/9th-level properties must not leak into this slice.

| Core weapon | Level-one contribution and additional action |
| --- | --- |
| Authority's End | Rolled weapon damage plus 1; after damage, immediate maneuver to end an effect imposed by that target on self/nearby creature. |
| Blade of Quintessence | Rolled weapon damage plus 1 and optional cold/fire/lightning/sonic type. |
| Blade of the Luxurious Fop | Rolled weapon damage plus 1; optional shift 1 after damage; conditional negotiation interest bonus. |
| Displacer | Extra psychic damage 1; after rolled damage, maneuver to trade fitting spaces with target. |
| Executioner's Blade | Extra psychic damage 1 or 2 against winded; first caused winded each encounter grants temporary Stamina 10. |
| Icemaker Maul | Extra cold damage 1; maneuver creates 3-burst enemy difficult terrain until encounter end or reuse. |
| Knife of Nine | Extra psychic damage starts 1, increases against repeated same target within encounter, maximum 3. |
| Lance of the Sundered Star | Extra holy damage 1; optional shift adjacent after weapon push. |
| Molten Constrictor | Extra fire damage 1; tier-3 strike may grab; grabbed target has Escape Grab bane. |
| Onerous Bow | Extra poison damage 1; tier-3 signature also weakens through target's next turn. |
| Steeltongue | Melee weapon distance plus 1; damage ability against Agility below average adds bleeding, save ends. |
| Third Eye Seeker | Extra psychic damage 1; tier-3 damaging weapon ability also dazes through target's next turn. |
| Thunderhead Bident | Extra sonic damage 1; increase push by 1 or add push 1 to damage ability without forced movement. |
| Wetwork | Extra psychic damage 1; reducing creature to zero permits immediate maneuver melee free strike. |

All 35 Shattered Legacy choices are inoperative initially, so none should contribute item abilities or modifiers before repair. All 3 bonded artifacts are absent initially. Strange Inheritance has 8 valid private second-echelon choices, but its initial level-one state is inoperative; exposing their abilities in a public action list before first operation would disclose the secret. Future activation needs a separate source-specific audit of those properties, not an assumption that their catalog identity means effect support.

## Verification obligations for the implementation

- Prove first admission creates the source-correct balances/items once; retry and later edit/restore/readmission preserve actual records even when the preview changes.
- Prove legacy initialization uses the original admitted career/complication after a later build change, and refuses an unavailable or foreign origin.
- Prove possessed/broken/absent/private items retain distinct states, Shattered Legacy retains the repair source, and peers cannot inspect personal possessions or hidden inheritance identity.
- Prove all seven point-grant careers and all item-grant complications against independent pinned-source expectations; do not merely compare an implementation catalog with itself.
- For every newly exposed item action, prove source timing, authorized shared invocation and appropriate condition/blocking. Manual effect resolution must be explicit, with no phantom item bonus or invented automation.

Build proof must use authenticated shared application APIs before any future browser work. Browser testing remains under the project-wide moratorium.
