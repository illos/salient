# V88 after V87: newly reachable potency abilities

Owner disposition for DEPLOY finding 950: keep all structurally eligible abilities compiled;
add the missing integrated proofs before promotion. No name-based exclusions, new grammar,
grants, loader changes or parent-trait automation are authorized by this addendum.

Pin: `fb83a789da8f0327a389c277a0c790b1648d5810`. Source paths below are relative to
`vendor/steel-compendium/en/unified/md/`. The 9→13 reachable change also includes Razor Claws;
its former pure damage support does not prove its newly live tier-three condition.

## Designs

All four are signature main actions without printed Malice cost, one creature or object.
Only ordinary creature targets are automated. Damage precedes the bounded condition; target score
must be strictly less than the printed threshold. All conditions here are save ends. Missing
characteristics remain fact-needed. Applied results create source instances, set the existing
toggle and schedule one campaign d10 at each target turn end; foes succeed at 6+. Conditions'
consequences remain manual. Public results show inequality/outcome, never foe resistance scores.

| Ability and exact source | Roll, range, keywords | Tiers 1 / 2 / 3 |
| --- | --- | --- |
| Bola Knock — `monster/lizardfolk/statblock/lizardfolk-bloodeye.md`, signature block | +2; ranged 5; Ranged/Strike/Weapon | 5/7/9 damage; A < 0/1/2 restrained |
| Eye Flash — `monster/hobgoblin/statblock/hobgoblin-redglare.md`, signature block | +3; ranged 10; Magic/Ranged/Strike | 9/14/17 corruption; P < 1 slowed / P < 2 restrained / P < 3 restrained |
| Power Chord — `monster/orc/statblock/orc-godcaller.md`, signature block | +2; melee 1 or ranged 10; Magic/Melee/Ranged/Strike | 5/7/9 sonic; no remainder in tiers 1/2; tier 3 P < 2 weakened |
| Razor Claws — `monster/undead/1st-echelon/statblock/ghoul.md`, signature block | +2; melee 1; Charge/Melee/Strike/Weapon | 3/4/5 damage; no remainder in tiers 1/2; tier 3 M < 2 bleeding |

The stat blocks' other abilities and traits retain their existing support and source text. This
change does not claim Reptilian Escape's tail state/shift, Infernal Ichor, Cadenza, Rallying Ostinato,
Relentless, Leap, Arise or Hunger automation. Inspect the available-action/source readbacks so this
partial support is explicit; do not call the entire parent stat block fully automated.

## Source-derived fixtures

Live fixtures are legally authored/approved heroes, not characteristic patches. Preserve the
original H Devil Fury (M 2/A 2/P 0), E Elementalist and W Wode Elf Fury. Add N Elementalist
using the legal 2/1/0/0 array with M 0/A 0/I 2/P 1 (Reason fixed 2), and P Devil Fury
using 2/−1/−1 assigned Presence 2/Intuition −1/Reason −1. Assert their evaluated scores before
use. Bola applies to N A 0 and resists H A 2; Razor applies to N M 0 and resists H M 2;
Eye tier 2 applies to H P 0 and resists P's Presence 2; Power Chord tier 3 uses those same
P 0/P 2 targets. Hero scores remain Director/own-controller only; unrelated observers cannot see
them. Source foe actors and their stat blocks are loaded through public V87 catalog/add routes.

The persisted matrix below may use seeded ordinary foe targets to exercise the same mathematical
boundaries: Dwarf Warden A 0/P 0/M 2 (Stamina 59), Goblin Monarch P 3/M 0 (Stamina 80),
Lizardfolk Bloodeye P 0/M 1 (Stamina 20), Goblin Warrior A 2 (Stamina 15). Those scores remain
Director-only. Use fresh targets or disclosed ordinary Stamina adjustments to avoid unrelated
Slain/trait effects. No existing immunity applies to the chosen damage/target pair.

For deterministic persisted tier cases, accepted dice 4+4, 6+6 and 8+8 with no edges/banes yield
respectively tier 1, 2 and 3 for both printed bonuses (+2 or +3). These are disclosed stream-position
fixtures, not fabricated effect rows. For tier-specific real-backend proof, reuse the existing V72
bounded in-backend dice-stream positioning approach under TESTER control, with an explicit current
integration target guard. Gameplay still draws/records campaign dice through registered operations.
Do not rerun natural rolls until a desired tier appears. The earlier unpositioned V88 live proof
remains separate evidence of ordinary campaign randomness.

## Per-ability case matrix

The applied/resisted cases (BK1/2, EF1/2, PC1/2, RC1/2) require real headless proof.
Transition cases BK3/EF3/PC3/RC3 have persisted coverage and extended live coverage in
[the headless plan](seeded-headless-plan.md). The live runner completes an automatic save for each new ability. Every use reads public action availability and the resulting compiled occurrence, source-linked
live state, Stamina change and unchanged Malice. Read Director/player/observer result projections.
For at least one of the added applied cases, end the target turn and read the actual
saving-throw event/source and resulting condition state; generic save branches already have
independent persisted and real-backend coverage. Reuse shared proven history/save helpers rather than build a new testing framework.

| Case | Inputs | Expected new behavior |
| --- | --- | --- |
| BK1 | Bola, tier 2, evaluated N Agility 0 (persisted equivalent: Dwarf Warden) | 7 damage, A < 1 applied, restrained instance and scheduled save |
| BK2 | Bola, tier 3, evaluated H Agility 2 (persisted equivalent: Goblin Warrior) | 9 damage, equality resists A < 2, no condition or registration |
| BK3 | Correct BK1 same dice to two banes (tier 1), then restore | 5 damage and A < 0 resisted; source instance ends/registration retires; restoring tier 2 creates current occurrence and schedule without charging Malice or rerolling |
| EF1 | Eye Flash, tier 2, evaluated H Presence 0 (persisted equivalent: Dwarf Warden) | 14 corruption damage, P < 2 applied, restrained and scheduled save |
| EF2 | Eye Flash, tier 2, evaluated P Presence 2; persisted tier 3 boundary may use Goblin Monarch P 3 | 14 corruption damage, equality resists P < 2; persisted tier 3: 17 corruption/P < 3 resisted. No condition/registration; Monarch has no printed immunity or weakness |
| EF3 | Correct EF1 same dice to two banes, then two edges | Tier 1: 9 corruption/slowed; tier 3: 17 corruption/restrained. End prior source condition, only current condition active; source/correction identities retained |
| PC1 | Power Chord, tier 3, evaluated H Presence 0 (persisted equivalent: Dwarf Warden) | 9 sonic damage, P < 2 applied, weakened and scheduled save |
| PC2 | Power Chord, tier 3, evaluated P Presence 2 (persisted equivalent: Orc Godcaller) | 9 sonic damage, equality resists P < 2; no condition/registration |
| PC3 | Persisted: correct natural tier 3 to tier 2 with two banes, restore; live: natural tier 2 with two edges → two banes → no modifiers → two edges | Tier 2 only 7 sonic damage, no condition node/instance schedule; restored tier 3 applies from same dice. Verify one tier-1 use (5 sonic) has no condition node too |
| RC1 | Razor Claws, tier 3, evaluated N Might 0 (persisted boundary: Bloodeye Might 1) | 5 damage, M < 2 applied, bleeding and scheduled save |
| RC2 | Razor Claws, tier 3, evaluated H Might 2 (persisted equivalent: Dwarf Warden) | 5 damage, equality resists; no condition/registration |
| RC3 | Persisted: correct natural tier 3 to tier 2 with two banes, restore; live: natural tier 2 with two edges → two banes → no modifiers → two edges | Tier 2 only 4 damage; no condition node/instance schedule. Restore bleeding from same dice; verify tier 1 only 3 damage has no condition node |

For correction/history, compare logical registration timing/work/source through history aliases,
not physical database IDs. Assert unchanged accepted roll rows across correction and redo. Existing
V88 deterministic hero/foe save-threshold, manual-overlap and post-save refusal cases remain valid;
these new cases add actual ability-specific target selection, tier condition differences/absence,
source identity and data persistence, not redundant tests of the same generic helper.

## Persisted and integration gates

Extend focused source-derived pure/convex-test coverage for all three tiers of each ability and the
resistance boundaries above, including EF slowed→restrained and PC/RC condition→no-remainder
correction transitions. At least one restored condition registration is inspected for active
status, equivalent work/timing/source, unchanged occurrence identity and no replacement dice.
Confirm all four added actors load from the full committed 1151-row V87 snapshot, preserving
`content.reseed` as an internal action. Update the combined report assertion to its actual inventory
(13 reachable compiled / 1222 compatibility / 2 unavailable as reported by DEPLOY), enumerating
identities rather than relying only on counts. Regenerate report artifacts on that same corpus.

TESTER owns all execution, setup and teardown. Freeze the integrated source/runner/content commit,
record target identity and fixture positioning, preserve failures and data, and run focused tests,
required full check and the added real-headless proof. An independent implementation reviewer and
separate pinned-source reviewer must approve the incremental change and its integrated evidence.
No browser, main merge or cloud publication is performed by the engine owner.

### First focused return: damage prerequisite fixture repaired

TESTER job 10 at `498778e` passed five of six cases; Eye Flash against Redglare P3
correctly remained fact-needed because `damageTargetFacts` treats every nonempty printed
immunity/weakness cell as manual. The original claim that its Fire immunity was irrelevant
to automation was wrong. The equality fixture now uses pinned Goblin Monarch P3, Stamina80,
no immunity/weakness (`monster/goblin/statblock/goblin-monarch.md`). The Redglare case remains
as a negative proof: known P3 and threshold3 cannot bypass missing damage completion; no
Stamina change, condition instance or registration. No immunity parser or mechanics change.
Live Eye Flash still targets the already designed evaluated heroes.
