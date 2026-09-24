# Troubadour Drama ledger, levels 1–3

All paths are relative to `/srv/presidium/projects/salient/code/vendor/steel-compendium/en/unified/md/` (`md/` below). I compared the core Drama text and the Appeal to the Muses text against `en/books/heroes/clean/Draw Steel Heroes.md` (lines 15126–15141 and 15573–15580). The wording matches. Nothing was edited, created or run.

**Main finding:** only two sources change Drama at levels 1–3: the base Drama feature (`md/feature/troubadour/level-1/drama.md`) and, from level 2, Appeal to the Muses (`md/feature/troubadour/level-2/appeal-to-the-muses.md`). I read every other level 1–3 feature and ability file under `feature/troubadour/level-{1,2,3}/` and `feature/ability/troubadour/level-{1,2,3}/`. They only spend Drama, waive a Drama cost, or have nothing to do with Drama. That includes all three class acts (Auteur, Duelist, Virtuoso), Routines and the performances, Scene Partner, the three Invocation options, Missed Cue, Foil, Second Album, and the 3-, 5- and 7-Drama abilities. The first gain added by a class act or later feature is outside the window: A Muse's Muse at level 7 (book line 16350).

## 1. Resource identity
- **Name:** drama. "you derive a Heroic Resource called drama" (`md/feature/troubadour/level-1/drama.md`). It is listed as "The troubadour's drama" (`md/chapter/classes.md` line 60).
- **Negative allowed:** no. No Troubadour text allows negative Drama. The general rule only says "When you use one of these abilities, you spend some of the Heroic Resource" (`md/chapter/classes.md`, Heroic Resource Cost). Salient's `shared/resolve/resourceFloor.ts` already returns a floor of 0 for everything except Talent clarity, which matches.
- **Maximum:** none is stated. The only number is the 30-Drama revive threshold (section 5), and that is not a cap.

## 2. Combat-start grant
- "At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain drama equal to your Victories." (`drama.md`)
- Victories: "At the start of an adventure, your hero has 0 Victories." They are earned per encounter or challenge and "Whenever you finish a respite ..., your Victories are converted into Experience" (`md/rule/resource/victories.md`).
- **OBSERVABLE** if the app records the encounter start and the hero's Victories. The "other stressful situation" case is a Director call, so it needs a manual start.

## 3. Turn-start gain
- "At the start of each of your turns during combat, you gain 1d3 drama." (`drama.md`). The amount is dice-based at every level from 1 to 3.
- **Level 2 change, Appeal to the Muses** (`md/feature/troubadour/level-2/appeal-to-the-muses.md`): "Before you roll to gain drama at the start of your turn, you can make your appeal (no action required). If you do, your roll gains the following additional effects:
  - If the roll is a 1, you gain 1 additional drama. The Director gains 1d3 Malice ...
  - If the roll is a 2, you gain 1 Heroic Resource, which you can keep or give to an ally within the distance of your active performance. The Director gains 1 Malice.
  - If the roll is a 3, you gain 2 of a Heroic Resource, which you can distribute among yourself and any allies within the distance of your active performance."
- **Base 1d3: OBSERVABLE** from the turn boundary plus a recorded or app-rolled d3.
- **Appeal: PARTLY.**
  - The opt-in has to be declared before the roll, so the app needs a prompt.
  - A roll of 1 is fully observable: +1 Drama and +1d3 Malice.
  - Rolls of 2 and 3 need a recipient choice. "Within the distance of your active performance" depends on position, so the table has to confirm it.
- Level 3 adds no change.

## 4. Triggered gains, levels 1–3
All of these come from `drama.md` at level 1, under "you gain drama when certain events occur during a combat encounter". None depends on the class act.

| # | Quote | Limit | What the app can see | Class |
|---|---|---|---|---|
| T1 | "The first time three or more heroes use an ability on the same turn, you gain 2 drama." | "The first time". Best reading is once per encounter (see A1) | Ability uses with actor and turn. Free strikes are abilities: "the Ranged Weapon Free Strike ability" (`md/feature/common/main-actions/free-strike.md`). Needs every hero ability use recorded, including triggered actions and free strikes. Performances are "No action" abilities (for example `choreography.md`), so it is unclear whether they count (A2) | **PARTLY** |
| T2 | "The first time any hero is made winded during the encounter, you gain 2 drama." | Once per encounter | Stamina. "When your Stamina is equal to or less than your winded value, you are winded" (`md/rule/health/winded.md`). Includes the Troubadour ("any hero") | **OBSERVABLE** (A3, A4 edge cases) |
| T3 | "Whenever a creature within your line of effect rolls a natural 19 or 20, you gain 3 drama." | Unlimited | The natural value of ability power rolls is recorded. "Natural roll" = "The total of your power roll before your characteristic or any other modifiers are added" (`md/rule/dice/natural-roll.md`). Line of effect depends on position (`md/rule/combat/line-of-effect.md`). Enemy rolls count ("a creature"). Natural rolls on tests may not be recorded (A5) | **PARTLY**: the app detects the natural 19/20 and the table confirms line of effect |
| T4 | "When you or another hero dies, you gain 10 drama." | Unlimited, once per death | Hero death is "While your Stamina is lower than 0, if it reaches the negative of your winded value, you die" (`md/rule/health/dying.md`) | **OBSERVABLE** for death by Stamina. Death from any other cause needs a manual death record |

## 5. Resets, losses, caps and conversions
- **End of encounter:** "You lose any remaining drama at the end of the encounter." (`drama.md`). OBSERVABLE, set to 0.
- **Out of combat:** "you can't gain drama outside of combat". Heroic abilities can be used without spending Drama. "Whenever you use an ability or effect outside of combat that costs drama, you can't use that same ability or effect outside of combat again until you earn 1 or more Victories or finish a respite." For "spend unlimited" abilities, "you can use it as if you had spent an amount of drama equal to your Victories" (`drama.md`). This is a per-ability lockout, not a resource change.
- **While dead:** "When you are dead, you continue to gain drama during combat as long as your body is intact." (`drama.md`). Whether the body is intact is MANUAL.
- **Coming back from death:** "If you have 30 drama during the encounter in which you died, you can come back to life with 1 Stamina and 0 drama (no action required)." This is optional ("can"). It sets Stamina to 1 and Drama to 0. **PARTLY**: the app can offer it while the hero is dead and has Drama of at least 30 in the same encounter; the player chooses.
- **Lockout after death:** "If you are still dead after the encounter in which you died, you can't gain drama during future encounters." (`drama.md`). This needs a persistent flag.
- **Cost waiver, level 3 Star Solo:** "you can use this ability against the same target for the next 2 combat rounds without spending drama" (`md/feature/ability/troubadour/level-3/star-solo.md`). It waives a spend, not a gain, and needs the same target to be tracked.
- **Spends only, no gains:**
  - Star Power: base cost 1, plus "Spend 1 Drama".
  - Harmonize: base cost 3 (book heading "Harmonize (3 Drama)", line 15329), plus "Spend 1+".
  - Dramatic Monologue: "Spend 1".
  - Turnabout: "Spend 3".
  - Witty Banter: "Spend 1".
  - Artful Flourish and Hypnotic Overtones: "Spend 2+".
- **Other sources that are not the Troubadour class** (for the shared engine to know about):
  - `md/complication/feytouched.md`: "At the start of each combat encounter, you can choose to gain 1 additional Heroic Resource. If you do so, the Director gains 3 Malice."
  - `md/complication/self-taught.md`: you can "forgo gaining your Heroic Resource until the start of your next turn".
  - `md/title/godsworn.md`: a temporary pool of 2d10.
  - `chosen-one.md` and `antihero.md`: tokens that substitute for spends.

## 6. Ambiguities needing a user ruling
- **A1. T1 frequency.** "The first time three or more heroes use an ability on the same turn." Reading (a): once per encounter, because the list sits under "events ... during a combat encounter" and T2 says "during the encounter". Reading (b): once per turn. Recommend (a).
- **A2. T1 scope.**
  - Heroes normally act on separate turns, so three uses in one turn needs triggered actions or free strikes (for example Riposte or Dramatic Reversal).
  - Open: whether a Performance chosen or kept "(no action required)" at the start of a round counts as using an ability.
  - Open: whether a Guest Star ("a mysterious new hero", `md/feature/ability/troubadour/level-2/guest-star.md`) counts as a hero.
  - Open: whether "same turn" means any creature's turn.
- **A3. T2, hero already winded when the encounter starts.** "Made winded" suggests the Stamina must cross the threshold during the encounter. The alternative reading is that any winded state counts.
- **A4. T2, going from above winded straight to dying or dead in one hit.** Dying Stamina is ≤ the winded value, so it literally satisfies the winded rule, and I read that as counting.
- **A5. T3 roll types.**
  - Open: whether test rolls count as well as ability rolls. `md/rule/dice/natural-19-20.md` talks about tests, and the natural roll is defined for any power roll.
  - Open: whether the Troubadour's own rolls count ("a creature within your line of effect").
  - Open: whether an automatic tier outcome still produces a natural roll. `md/rule/dice/power-roll.md`: "you can still make the roll".
- **A6. Dead Troubadour and turn-start 1d3.** "You continue to gain drama" does not say whether a dead creature still takes turns. Reading (a): only triggered gains apply while dead. Reading (b): the 1d3 also continues.
- **A7. Revive threshold.** "Have 30" is read as at least 30. Open: does the option lapse if Drama is at least 30 but the player declines until later in the same encounter?
- **A8. Appeal rolls of 2 and 3.**
  - "Gain 1 Heroic Resource ... give to an ally": does the ally get their own class's resource, or Drama? I read it as the ally's own resource.
  - With no active performance, is the distance undefined, meaning you can only keep it yourself?
  - The appeal adds to the d3 result: a roll of 2 gives 2 Drama plus 1 more.
- **A9. Winded includes temporary Stamina?** No: winded is computed from Stamina only (`winded.md`).

## 7. Proposed automation boundary
- **Automate:**
  - Combat-start grant equal to Victories.
  - Turn-start 1d3, or record the entered roll.
  - The Appeal opt-in prompt and the roll-of-1 result (+1 Drama and +1d3 Director Malice).
  - T2, once per encounter, from Stamina transitions.
  - T4, +10 per hero death by Stamina.
  - Zero at end of encounter, and no gains outside combat.
  - Floor of 0, no maximum.
  - The post-encounter "still dead, no future gains" flag.

  All of these depend only on turn boundaries, Stamina and recorded rolls.
- **Offer and confirm (PARTLY):**
  - T3: detect a natural 19/20 on any recorded power roll, then ask for line-of-effect confirmation. Line of effect is positional, which the app does not track.
  - T1: detect three or more distinct heroes using abilities on one turn, once per encounter, then confirm. Depends on A1 and A2, and on complete use logging.
  - Appeal rolls of 2 and 3: the player picks recipients, and distance is positional.
  - The 30-Drama revive prompt: optional, player choice.
- **Manual:**
  - The "stressful situation" start.
  - Whether the body is intact.
  - Deaths not caused by Stamina.
  - Gains while dead (A6).
  - Test natural rolls if tests are not logged.
  - The non-class sources in section 5.
  - Star Solo waiver tracking, until same-target tracking exists.
- **Current Salient code:**
  - `shared/evaluate/character.ts:154` accepts `drama` as a cost resource.
  - `shared/evaluate/troubadourAbilities.ts` sets costs (Star Power 1, Harmonize 3).
  - `shared/content/classes/troubadour/level-one.ts:40-44` quotes the resource identity and the out-of-combat rule.

  No Drama generation exists yet. `docs/pre-alpha-design-gaps.md` lines 44–56 deferred class-specific generation, and `docs/decisions/2026-09-24-heroic-resource-automation.md` supersedes that deferral for V1: V120 is the shared engine and V121–V131 are the per-class slices, including the Troubadour.
