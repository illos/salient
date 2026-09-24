# V1 foe roster — confirmed 2026-09-24

The user selected this roster in conversation on 2026-09-24. It fills the open "roster and count"
item of the [V1 release target](../v1-roadmap.md#current-v1-release-target--confirmed-2026-09-22).
Every stat block is already in the generated foe catalog; this list decides which foes get combat
behavior implemented and tested for V1, not which ones are ingested.

Levels, roles and EV below are read from each stat block's header in the pinned Compendium,
`vendor/steel-compendium/en/unified/md/monster/<band>/statblock/<file>.md`. Each band's Malice file
(`<band>/<band>-malice.md`; `dragon/thorn-dragon-malice.md` for the Thorn Dragon) is in scope with
its stat blocks.

## Release gate: 36 stat blocks

### Goblins and bugbears (13)

All four bugbears carry the Goblin keyword, so they field with goblin warbands as the medium tier.

| Stat block | File | Level | Role | EV |
|---|---|---|---|---|
| Goblin Runner | `goblin/statblock/goblin-runner.md` | 1 | Minion Harrier | 3 for four minions |
| Goblin Sniper | `goblin/statblock/goblin-sniper.md` | 1 | Minion Artillery | 3 for four minions |
| Goblin Spinecleaver | `goblin/statblock/goblin-spinecleaver.md` | 1 | Minion Brute | 3 for four minions |
| Goblin Warrior | `goblin/statblock/goblin-warrior.md` | 1 | Horde Harrier | 3 |
| Goblin Assassin | `goblin/statblock/goblin-assassin.md` | 1 | Horde Ambusher | 3 |
| Goblin Cursespitter | `goblin/statblock/goblin-cursespitter.md` | 1 | Horde Hexer | 3 |
| Goblin Stinker | `goblin/statblock/goblin-stinker.md` | 1 | Horde Controller | 3 |
| Goblin Underboss | `goblin/statblock/goblin-underboss.md` | 1 | Horde Support | 3 |
| Goblin Monarch | `goblin/statblock/goblin-monarch.md` | 1 | Leader | 12 |
| Bugbear Channeler | `bugbear/statblock/bugbear-channeler.md` | 2 | Elite Controller | 16 |
| Bugbear Commander | `bugbear/statblock/bugbear-commander.md` | 2 | Elite Support | 16 |
| Bugbear Roughneck | `bugbear/statblock/bugbear-roughneck.md` | 2 | Elite Brute | 16 |
| Bugbear Sneak | `bugbear/statblock/bugbear-sneak.md` | 2 | Elite Ambusher | 16 |

### Undead (8)

| Stat block | File | Level | Role | EV |
|---|---|---|---|---|
| Rotting Zombie | `undead/1st-echelon/statblock/rotting-zombie.md` | 1 | Minion Brute | 3 for four minions |
| Decrepit Skeleton | `undead/1st-echelon/statblock/decrepit-skeleton.md` | 1 | Minion Artillery | 3 for four minions |
| Crawling Claw | `undead/1st-echelon/statblock/crawling-claw.md` | 1 | Minion Harrier | 3 for four minions |
| Zombie | `undead/1st-echelon/statblock/zombie.md` | 1 | Horde Brute | 3 |
| Skeleton | `undead/1st-echelon/statblock/skeleton.md` | 1 | Horde Artillery | 3 |
| Ghoul | `undead/1st-echelon/statblock/ghoul.md` | 1 | Horde Harrier | 3 |
| Specter | `undead/1st-echelon/statblock/specter.md` | 1 | Horde Hexer | 3 |
| Ghost | `undead/1st-echelon/statblock/ghost.md` | 1 | Leader | 12 |

### Humans (12)

The Death Acolyte and Death Cultist let a necromancer cult field alongside the undead. The level 2–3
humans are the second medium option.

| Stat block | File | Level | Role | EV |
|---|---|---|---|---|
| Human Guard | `human/statblock/human-guard.md` | 1 | Minion Brute | 3 for four minions |
| Human Archer | `human/statblock/human-archer.md` | 1 | Minion Artillery | 3 for four minions |
| Human Raider | `human/statblock/human-raider.md` | 1 | Minion Harrier | 3 for four minions |
| Human Death Acolyte | `human/statblock/human-death-acolyte.md` | 1 | Minion Hexer | 3 for four minions |
| Human Brawler | `human/statblock/human-brawler.md` | 1 | Platoon Brute | 6 |
| Human Scoundrel | `human/statblock/human-scoundrel.md` | 1 | Platoon Ambusher | 6 |
| Human Trickshot | `human/statblock/human-trickshot.md` | 1 | Platoon Artillery | 6 |
| Human Blackguard | `human/statblock/human-blackguard.md` | 1 | Leader | 12 |
| Human Death Cultist | `human/statblock/human-death-cultist.md` | 2 | Platoon Support | 8 |
| Human Knave | `human/statblock/human-knave.md` | 2 | Platoon Defender | 8 |
| Human Storm Mage | `human/statblock/human-storm-mage.md` | 3 | Platoon Controller | 10 |
| Human Bandit Chief | `human/statblock/human-bandit-chief.md` | 3 | Leader | 20 |

### Bosses (3)

| Stat block | File | Level | Role | EV |
|---|---|---|---|---|
| Arixx | `arixx/statblock/arixx.md` | 1 | Solo | 36 |
| Werewolf | `werewolf/statblock/werewolf.md` | 1 | Solo | 36 |
| Thorn Dragon | `dragon/statblock/thorn-dragon.md` | 2 | Solo | 48 |

## Stretch wave (not a release gate)

**Orcs**, levels 1–3, excluding the Scyza mount. Automated only after the release-gate roster, and
only if time allows; the user asked to keep them off the table for now.

## Considered and excluded for V1

- **Hobgoblins:** every stat block is level 4–6, above the level two or three release ceiling.
- **Goblin mounts and oddities** (Worg, War Spider, Skitterling): mounts add rules work first.
- **Ogres and Animals:** proposed as extra medium foes; the bugbears cover that tier instead.
- **Kobolds:** the alternative to orcs as a fourth band; orcs were preferred for their level spread.
- Other level 1–3 bands (radenwights, lizardfolk, gnolls, elves, war dogs, first-echelon demons,
  dwarves, time raiders) and solos (Fossil Cryptic, Chimera, Wode Hag, Bredbeddle) remain
  expansion scope.

## Open

- The character level ceiling (two versus three) is still open. It does not change this list; the
  level-3 humans are the top of the roster either way.
