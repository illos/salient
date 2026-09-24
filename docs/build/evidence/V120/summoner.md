# Summoner (Essence) resource ledger, levels 1–3

I only read files. I edited nothing and ran nothing. All paths below are relative to `/srv/presidium/projects/salient/code/vendor/steel-compendium/en/unified/md/`. Line numbers are from the pinned files.

**Headline:** Essence has three sources of gain at levels 1–3: a Victories grant at combat start, +2 at the start of each of the Summoner's turns, and +1 the first time each round a minion dies unwillingly in range. It resets to 0 at the end of the encounter. It never goes up while out of combat. The first two gains can be automated; the minion-death gain cannot yet.

## 1. Resource identity
- **Name:** Essence. "You and your minions have a unique reserve of essence as your Heroic Resource." (`feature/summoner/level-1/essence.md` L10)
- **Can it go negative?** No text allows it. Nothing in `essence.md`, `class/summoner.md`, `rule/resource/heroic-resource.md` or `chapter/classes.md` "Heroic Resource Cost" (L46–48: "you spend some of the Heroic Resource… then activate the ability") permits a negative value. Salient's `shared/resolve/resourceFloor.ts` already returns a floor of 0 for everything except Talent clarity, which matches.
- **Maximum:** none is stated anywhere in the Summoner sources.
- **Name clash:** the Elementalist's resource is also called essence (`chapter/classes.md` L54). The `essence.md` callout says "There may be more magicians in the future that also rely on essence". The engine should key the resource by class, not by name alone.

## 2. Combat-start grant
- "At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain essence equal to your Victories." (`essence.md` L14)
- **Amount:** current Victories. Victories start at 0 per adventure, grow by 1 per successful combat (Director may adjust), and are converted to XP at a respite (`rule/resource/victories.md`).
- **OBSERVABLE:** the app knows when an encounter starts and how many Victories the hero has. The Director deciding a non-combat "stressful situation" counts is the same thing as starting an encounter.
- **Not Essence:** at combat start the Summoner also summons up to two signature minions for free (`feature/summoner/level-1/minions.md` L20).

## 3. Turn-start gain
- "At the start of each of your turns during combat, you gain 2 essence." (`essence.md` L16)
- **Amount:** fixed 2, no dice. It does not change at levels 1–3. It only rises at level 7: "you gain 3 essence instead of 2" (`feature/summoner/level-7/font-of-creation.md` L10).
- **OBSERVABLE:** the app knows the hero's actual turn start.
- **Not Essence:** "you can summon up to three of your signature minions at no cost" at turn start (`minions.md` L22). Horde Formation raises this to four (`horde-formation.md`).

## 4. Triggered gains, levels 1–3

### 4a. Unwilling minion death (level 1, every circle, no portfolio dependency)
- **Quote:** "The first time each round that any minion (either yours or an enemy) dies unwillingly within your Summoner's Range, you gain 1 essence." (`essence.md` L18)
- **Frequency:** at most 1 Essence per combat round. It can trigger on anyone's turn. At level 4 it becomes 2 instead of 1 (`feature/summoner/level-4/essence-salvage.md` L10), which is outside this range.
- **Range:** "Your Summoner's Range is equal to 5 + your Reason score." (`minions.md` L14). The gain text does not require line of effect.
- **Deaths that give no Essence:**
  - **Explosive Parade** (L1 heroic): "These minions activate no effects upon death, and you gain no essence from their deaths." (`feature/ability/summoner/level-1/explosive-parade.md` L44)
  - **Cavalry Call** (L3 heroic): "you gain no essence from their deaths." (`feature/ability/summoner/level-3/cavalry-call.md` L27)
  - **Essence Funnel** (L3 heroic), for minions it kills: "you gain no essence from their deaths." (`feature/ability/summoner/level-3/essence-funnel.md` L40)
  - **Sacrifices for a discount** are willing ("you can willingly sacrifice", `essence.md` L20), so they do not count as unwilling deaths.
- **Observability:**
  - **The Summoner's own minions: MANUAL.** They are not app combat actors (Q-SUMMONER-1 area), so their deaths and positions are unrecorded.
  - **Enemy minions: PARTLY.** The app does record damage to enemy minion squads and their deaths. It cannot check "within your Summoner's Range" because positions are out of scope, and "unwillingly" needs confirmation. The engine could offer "claim +1 Essence (first this round)" when an enemy minion dies, with the table confirming range. It should also keep a per-round "claimed" flag so a manual claim for an own-minion death blocks a second one.
- **Related features that do not touch Essence:**
  - Death Snap, Blight (`death-snap.md`): damage on an unwilling demon death.
  - Rise!, Graves (`rise.md`): once per round, summon a minion when a creature dies unwillingly.
  - Pixie Dust, Spring (`pixie-dust.md`): spend a Recovery.
  - Elemental Affinity, Storms (`elemental-affinity.md`): bonus free minion.

### 4b. Crystallized Essence treasure (not a class feature, 3rd-echelon trinket)
- "you can shatter and destroy the crystallized essence as a maneuver to immediately give yourself 5 essence." (`treasure/3rd-echelon/trinket/crystallized-essence.md` L33)
- **OBSERVABLE** if the app records the use as an operation. It is unlikely at levels 1–3.
- It conflicts with "you can't gain essence outside of combat" (`essence.md` L26), so it should only be allowed in combat.

### 4c. Everything else I checked: no Essence gain
- Levels 1–3 features: Minions, Summoner Strike, Strike for Me, Minion Bridge, Formation (all four), Quick Command (Focus Fire!, Halt!, Not Yet!, Shield!), Circle, Portfolio, the circle features, Perk, Summoner's Dominion, New Portfolio Minion, Summoner's Kit and its four wards, and the 7-Essence Ability.
- Every L1 and L3 ability file.
- Every summoner minion stat block (I grepped for gain/essence: they only have costs).
- Fixture files (no essence text).
- **Essence Transfer** is a trap for anyone reading names: its charges buy a Recovery, a surge or a minion, never Essence (`feature/ability/summoner/level-1/essence-transfer.md`).

## 5. Resets, losses, caps and conversions
- **End of encounter:** "You lose any remaining essence at the end of the encounter." (`essence.md` L22). Set to 0. OBSERVABLE.
- **Outside combat:** "you can't gain essence outside of combat, you can use your heroic abilities and effects that cost essence without spending it. Whenever you use an ability or effect outside of combat that costs essence, you can't use that same ability or effect outside of combat again until you gain at least 1 Victory or finish a respite." (`essence.md` L26). This is a no-cost use with a per-ability lockout, not a resource change. Salient's `shared/content/classes/summoner/abilities.ts` already tells users to track the lockout manually.
- **Cost reduction by sacrifice:** "Whenever you use a heroic ability or call forth a minion that costs essence, you can willingly sacrifice one or more of your minions within your Summoner's Range to reduce the cost by 1. You can't kill minions this way if they used a main action or maneuver during the turn. You can sacrifice more minions than you would reduce the cost by." (`essence.md` L20). MANUAL, because the minions are not actors.
- **Fixed spends at levels 1–3:**
  - 5-Essence heroic (`summoner-abilities.md`) and 7-Essence heroic at L3 (`level-3/7-essence-ability.md`).
  - Call Forth: "one signature minion for each essence you spend", or the minion's printed cost of 3, 5 or 7 (`call-forth.md`; stat-block `cost:` fields).
  - "Spend 1 Essence" options on Focus Fire! and Shield!, and "1 Essence" on Minion Bridge.
  - 1-Essence minion traits, e.g. Walking Boulder "Pile Up (1 Essence)", with the callout explaining trait costs (`walking-boulder.md` L37–43).
  - Elemental mote transform, "spend 1 essence" (`elemental-mote.md` L42).
  - Summoner's Dominion (L2): "spend 1 essence to relocate the fixture" (`summoners-dominion.md` L12).
- **Out of scope:** the level-7 "Their Life for Mine" spends all Essence.

## 6. Ambiguities that need a user ruling
1. **Sacrifice discount size.** Reading A: each sacrificed minion reduces the cost by 1, and the last sentence lets you over-sacrifice once the cost reaches 0. Reading B: one or more sacrifices give a total reduction of 1. Q-SUMMONER-1 already records this and keeps it manual. The "more minions than you would reduce the cost by" wording leans toward A.
2. **What counts as "dies unwillingly".** The text never defines it (it appears only in the Summoner features and one Troubadour feature). The likely reading is anything except a willing sacrifice, plus the explicit exclusions above. Other open cases: an enemy minion killed as excess from pooled squad Stamina, and a minion "dismissed" (not dying) at end of combat or at the end of a Standby turn.
3. **Standby Minions alternate rule** (`chapter/summoner-advice.md` L155, optional Director rule): unsquadded standby minions "don't activate any traits or effects upon death". Does that block the Essence gain? Explosive Parade lists "activate no effects upon death, and you gain no essence" as two separate clauses, which suggests "effects upon death" does not cover the gain. This is an interpretation.
4. **Turn-start gain while dying or unconscious.** `essence.md` has no exception. `minions.md` L50 only stops summoning and minion damage while unconscious. The recommendation is to grant it anyway, as literally written.
5. **Does a combat-start gain follow a mid-encounter Victory award?** No. It is only "at the start" (`essence.md` L14).

## 7. Proposed automation boundary
| Rule | Automate? | Reason |
|---|---|---|
| Combat start: +Victories (`essence.md` L14) | Automate | Encounter start and Victories are recorded |
| Turn start: +2 (`essence.md` L16), no change at L1–3 | Automate | Actual turn start is recorded |
| End of encounter: set to 0 (`essence.md` L22) | Automate | Encounter end is recorded |
| Floor of 0, no maximum | Automate | No negative or cap text exists |
| No gain outside combat (`essence.md` L26) | Automate (block gains) | Clear text |
| Out-of-combat no-cost use with lockout | Manual (already so) | The lockout needs per-ability history |
| Fixed-cost spends | Automate the payment | Costs are sourced |
| Sacrifice discount | Manual | Ruling pending (item 6.1), and minions are not actors |
| Minion-death +1 per round, enemy minion | Prompt / confirm | Death is observable; range and "unwillingly" are not |
| Minion-death +1 per round, own minion | Manual button, shared per-round flag | Summoned minions are not app actors (Q-SUMMONER-1) |
| Crystallized Essence +5 | Operation-driven, combat only | Treasure use is recorded; 3rd echelon |

The Summoner's own minions not being app actors is what stops the level-1 death trigger from being fully automated. Until they are modelled, with positions or a Summoner's Range check, it has to stay a confirmed or manual grant. The per-round cap has to cover both the automatic prompt and the manual claim so the Essence is never added twice. That fits `docs/pre-alpha-design-gaps.md` L44–55: no invented grants, and manual adjustments kept separate from automated ones.

**Salient code today:** there is no Essence generation. It has only cost plumbing: the `essence` resource in `shared/content/classes/summoner/level-one.ts` L41–45, abilities marked "Essence payment is automatic unless waived outside combat" in `shared/content/classes/summoner/abilities.ts`, and cost parsing in `shared/evaluate/character.ts` L143–158 and `shared/evaluate/summonerAbilities.ts`. The Salient files I read are in the main checkout at `/srv/presidium/projects/salient/code/` (main at 635113a).
