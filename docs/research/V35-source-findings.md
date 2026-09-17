# V35 pinned source inventory and display dependencies

Research date: 2026-09-17. Steel Compendium pin:
`fb83a789da8f0327a389c277a0c790b1648d5810`.
This report records source research and the explicit support-link inventory; it is not
an independent implementation review or browser acceptance. No external rules sources were used.
Read source blobs with `git -C vendor/steel-compendium show <pin>:<path>` because sparse
checkout does not expose all book-specific files.

## Corpus boundary

Enumerating every JSON file in `en/books/{heroes,monsters}/json` and selecting
`type: statblock` yields **438** records: 437 Monsters and one Heroes. Their 1,800
embedded features comprise 1,158 source-classified abilities and 642 traits.

| Organization | Records |
| --- | ---: |
| Minion | 116 |
| Elite | 97 |
| Horde | 76 |
| Platoon | 68 |
| Leader | 30 |
| Solo | 22 |
| Retainer | 21 |
| Empty organization | 8 |

The empty-organization records are Noncombatant, Source of Earth, and the six Xorannox
eyes (Compulsion Eye, **Demolition**, Mover Eye, Necrotic Eye, Toxic Eye, Zapper Eye).
Keep the printed title `Demolition`; do not silently rename it to Demolition Eye.

There are **63** Monsters JSON records with `type: featureblock, kind: malice`, holding
**206 upstream feature records**. These are all under `monster/`. The 206 count includes
one malformed Gnoll record and omits one Hag feature described below, so raw JSON count
alone is not a proof of complete feature coverage. Basic Malice is a rule article, not
one of these 63 featureblocks. The complete selected parent inventory is 501 records.

The 51 group articles cover 415 statblocks (all except 21 retainers and the single
Noncombatant and Heroes summon). No core statblock has a separate Companion organization.
Named companion blocks in the unified supplement corpus must not be pulled into this
core-only inventory merely because their filenames resemble a core creature. Core animals
and beasts remain readable in their printed organization; custom-retainer conversion is
separate reading in the Retainers chapter.

## Deterministic support relationships

`scripts/foes/selection.json` records same-book `supportingPaths` to imported Malice
parents and `relatedRules` with a source ID, Rules path, source title and relationship.
These are readable source dependencies, not granted executable effects. SCC IDs are read
from `metadata.scc` or top-level `scc`; do not fabricate IDs from titles. Rules paths use
`<book>/<book-specific relative Markdown path without extension>`.

The populated inventory contains 421 Malice support edges and 1,027 Rules relationships:
478 group-context edges, 472 Basic Malice edges, 21 retainer-rules edges, 21 individual
advancement edges, 21 role-option edges, six eyes-to-owner edges, six owner-to-eyes edges,
one Ajax stance edge and one Source of Earth summoning edge. The 472 Basic Malice edges
are 409 ordinary enemy statblocks plus 63 Malice parents. The 478 group edges comprise
415 non-retainer Monsters statblocks plus all 63 Malice parents. The exact corpus
arithmetic is 438 - 21 retainers - 1 Noncombatant - 1 Heroes summon = 415 group-covered
statblocks.

The manifest also exposes `sourcebook` and a source-qualified `group: { id, name }` for
library band filtering. Ordinary groups use the actual group-article identity and title;
retainers use the Retainers chapter. The two explicit display group labels without a group
article are **Elementalist summons** (summoning-ability ID) and **Noncombatants** (statblock
ID). These labels classify reading, not a new source article or gameplay organization.

### Ordinary group rules and Malice

- `en/books/monsters/md/monster/<group>/.../statblock/<name>.md` links to
  `en/books/monsters/md/monster/group/<group>.md` when that exact group article exists.
  Keep this labeled group context; matching directory alone does not grant mechanics.
- All 409 statblocks with Horde, Platoon, Elite, Minion, Leader or Solo organization
  link to `en/books/monsters/md/rule/monster/malice.md`. Its **Basic Malice Features**
  section contains Brutal Effectiveness and Malicious Strike. It says all monsters have
  these features. Retainers and the Heroes summon do not receive this inferred grant.
- Most groups have exactly one Malice file under their group directory. Attach that
  same-group file to the ordinary enemy blocks. The source often intentionally includes
  an associated creature under the group's keyword: Clawfish has Angulotl, War Spider
  has Goblin, Elemental Mote has High Elf, and so on. Those are not inferred from name.
  Do not collect additional cross-group Malice files just because another keyword also
  matches (for example Bugbear also has Goblin, and dragons also have Elemental).
- `monster/animal/` has no special Malice file; its six blocks still link to Basic Malice
  and the Animals group context.

### Echelons and dragons

Demon, Undead and War Dog each have four Malice files:
`monster/<group>/{1st,2nd,3rd,4th}-echelon/<group>-malice-level-{1,4,7,10}-malice-features.md`.
Each statblock links to its own echelon's Malice parent. Higher Malice parents link to
all lower-level same-group Malice parents, preserving **Prior Malice Features** reading.
This adds 18 prior-support edges (1 + 2 + 3 for each group) without changing the existing
V30 same-echelon statblock support relation. The 2nd-echelon Demon text has an incomplete
phrase, “available to demons of level or lower”; preserve it rather than inventing a number.

Rivals differ: all four echelons use the single
`monster/rival/rival-malice-level-1-malice-features.md`; its introduction says any rival's
turn. Do not require an echelon-local file.

The five dragons share one directory but have distinct Malice:
`monster/dragon/{crucible,gloom,meteor,omen,thorn}-dragon-malice.md` maps only to the
statblock with the identical basename before `-malice`. All five also link to
`monster/group/dragon.md`, which contains each dragon's domain prose and other context.
A directory-wide join would incorrectly show four other dragons' Malice on each block.

### Retainers, summon and named dependencies

- All 21 retainers link to `en/books/monsters/md/chapter/retainers.md`,
  `monster/retainer/advancement-features/<statblock basename>.md`, and
  `monster/retainer/role-advancement/<lowercase printed role>.md` in that book.
  Every one of these exact paths exists. Label the role article an **option**, because
  the chapter permits selecting a matching role advancement ability instead of that
  retainer's own advancement ability. No `monster/group/retainer` article exists.
- Source of Earth links to
  `en/books/heroes/md/feature/ability/elementalist/level-8/summon-source-of-earth.md`.
  This explains the summoning duration and turn. It is not an ordinary enemy and must
  not inherit Monsters Elemental Malice based on its name or Elemental keyword.
- Ajax links to `en/books/monsters/md/monster/ajax-the-invincible/tactical-stance.md`.
  This is `type: featureblock, kind: feature`, outside the Malice selection, but contains
  necessary Insurgent, Mastermind and Vanguard reading. The group article additionally
  contains the explicitly described Ajax-the-Leader conversion; do not synthesize a
  second statblock from that sidebar as part of the 438 inventory.
- Xorannox links to all six `monster/xorannox-the-tyract/statblock/<eye>.md` entries.
  Each eye links back to `.../statblock/xorannox-the-tyract.md`. The owner's **Eyes of the
  Tyract** feature explains the dependency. Only the owner receives
  `monster/xorannox-the-tyract/xorannoxs-malice.md`; its introduction refers specifically
  to Xorannox's turn. Sharing a directory does not give each eye the owner's Malice.

## Source formats that require deliberate handling

Paths below are relative to `en/books/monsters/`; `json/` and `md/` counterparts share
basenames unless explicitly stated. Source originals must remain available unchanged.

| Source | Observation | Display/import requirement |
| --- | --- | --- |
| `monster/noncombatant/statblock/noncombatant` | JSON omits `features` entirely. | Treat absent features as empty; this is valid, not a lost source section. |
| `monster/lich/statblock/lich`, Rejuvenation | JSON says ability, but no usage/distance/target/keywords or envelope table; includes a target's Might test. | Preserve source classification and full text without fabricating an ability envelope or acting-monster roll. |
| `monster/gnoll/gnoll-malice`, Iron Jaws | Source Markdown table lacks final pipe. JSON incorrectly splits the distance/target row into a second “feature” whose icon is `|`; effects belong to Iron Jaws. | Source-specific extraction correction merges these records, recovers distance/target and retains original JSON. Three displayed Malice features, not four. |
| `monster/hag/hag-malice` | Unquoted icon heading **Casting Curses and Bodies (3 Malice)** and its paragraph are absent from JSON features. This is the only unquoted icon-prefixed bold heading found across all 501 parent bodies. | Include this complete feature in independent extraction, not only in parent fallback Markdown. |
| `monster/hag/hag-malice`, Kick | JSON cost is `Signature`; visible heading says `Signature Ability`. House Call explains that Kick belongs to the animated hut. | Preserve full text and source qualifier; do not turn Kick into a standalone resource-spending option for the hag. |
| `monster/lizardfolk/lizardfolk-malice`, Net Trap | Markdown table header lacks leading pipe; JSON serializes the envelope table into `intro` and an effect rather than distance/target fields. | Recover the visible envelope explicitly or preserve it intact as unmodeled text; do not discard the table while rendering effects. |
| `monster/war-dog/3rd-echelon/statblock/war-dog-iron-priest`, Iron Banner | JSON effect contains a three-item Markdown list. | Validate/render Markdown list content without losing bullets or misclassifying it as missing prose. |
| `monster/kobold/statblock/shieldscale-drangolin` | Size `2 or 3`. | Preserve exact choice text; no `parseInt`. |
| `monster/noncombatant/statblock/noncombatant` | Size `1S-2`; no EV. | Preserve range and absent EV. |
| `monster/retainer/statblock/hobgoblin-flameslinger` | Size/speed/Stamina/stability/free-strike row printed twice. | Compare every occurrence; one normalized field per label. |
| `monster/retainer/statblock/gnoll-gnasher` | Retainer prints EV `60`, unlike the other 20 retainers. | Preserve it; do not invent a blanket retainer EV correction. |
| Six `monster/troll/statblock/*` plus `monster/retainer/statblock/troll-mercenary` | Weakness `fire` has no amount. | Preserve exact printed weakness, not a fabricated numeric amount. |

All 116 minions print EV per four creatures, using either `four` or `4`. Twenty retainers,
Noncombatant, Source of Earth and six eyes print EV `-` (28 total). All 438 printed Stamina
values are integer strings at this pin. Names alone are not identities: the 28 rival blocks
repeat seven class names across four echelons, and the SCC IDs remain distinct.

## Validation scope

The research scans read pinned blobs and compared organization/feature counts, exact support
paths, icon-heading boundaries, source titles and ordered effect strings. JSON and Markdown
are sibling extractions, not independent rules authority. These findings identify importer
work; they do not claim the V35 implementation has passed it. Builds, application tests and
browser acceptance belong on CT114 under the remote-development runbook.

The proposed `scripts/foes/source-adaptations.json` Gnoll/Hag entries were checked against
the pinned evidence: both JSON and Markdown source hashes match. Unchanged surviving
features preserve their original values; the Kick adjustment changes only its erroneous
cost classification to the printed Signature Ability qualifier. The added Hag feature's
text and Gnoll merged effects match the visible source. This confirms the repair's source
basis, not the implementation's end-to-end behavior.
