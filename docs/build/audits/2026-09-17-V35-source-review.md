# V35 independent pinned-source review — 2026-09-17

Reviewer: `source_review`, independent of implementation and its source research.

**Verdict: pass for the V35 display-ingestion scope.** No remaining blocking finding or
unresolved source decision changes that scope. This follows the
[independent implementation pass](2026-09-17-V35-independent-review.md).
It does not certify ability execution, live roster loading, a merge, or a runtime rollout.

Reviewed worktree: `/srv/presidium/projects/salient/foes-full`, `slice/V35`, main
`a0ac6d4` plus V30 prerequisite `214d04b` and the uncommitted V35 changes.
Reviewed edition: `bf262edf546e91e1540cc17489915f18c4873ddd8bd8e225b20f3441e3f74f30`.
The only rules authority used was local Steel Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`, read through pinned Git blobs.
The vendor checkout is at that revision and unmodified. No online rules were consulted.
The authorized Steel Cauldron comparison at `eba4b8bb8bc1baf947f15e67e9e923951092fd89`
was inspected as secondary evidence, never as authority to replace Compendium text.

## Specifications and implementation read

- [Confirmed ingestion requirements](../../monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15).
- [Full-output comparison](../../monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16).
- [Unified object references](../../data-architecture-spec.md#35-unified-object-references-and-sharing).
- [Presentation](../../monster-presentation-spec.md#presentation),
  [headless text](../../monster-presentation-spec.md#headless-remains-ordinary-text), and
  [production adapters](../../monster-presentation-spec.md#production-adapters).
- [V35 acceptance checks](../V35-full-core-ingestion.md#acceptance-checks) and
  [review standard](../README.md#review-standard), alongside `agent.MD`, `CLAUDE.md`
  and the Compendium navigation instructions.

Read the importer, both source-adaptation files, selection, comparison resolutions and
comparison implementation, generated archival package, source-focused tests and consumer
contract. The [implementation research](../../research/V35-source-findings.md) was a
navigation aid; conclusions below were checked against actual pinned passages.

## Acceptance checks

| V35 check | Status | Evidence and scope |
| --- | --- | --- |
| 1. Complete core inventory and source retention | Verified | Independently enumerated every Heroes/Monsters JSON blob at the pin: exactly 438 statblocks and 63 Malice featureblocks, with exact set equality to the package. Direct blob comparison verified all 501 parents' original JSON, Markdown and linked Markdown, retained stat fields, all 2,006 child source spans and complete parent-body reconstruction. The 1,800 statblock features remain 1,158 abilities and 642 traits. Gnoll and Hag repairs respectively remove one false split and restore one omitted feature, preserving 206 Malice children. |
| 2. Determinism, identities, historical editions and anomalies | Verified | Reviewed append-only identity handling, exact-source adaptation guards, edition-qualified references and retained V27/V30 editions. The implementation review and CT114 regeneration evidence establish deterministic output and unchanged prior bindings. Direct source review confirms the repairs and exceptional printed values do not invent rules. |
| 3. Every comparison outcome investigated | Verified | Inspected the complete 501-row report and all 63 guarded discrepancy resolutions. The final report has 475 explained outcomes, 26 explicitly unavailable, zero unresolved/missing/ambiguous/error outcomes and no retrieval errors. Source-grounded material cases are detailed below. Unavailable is not a match. |
| 4. Source regressions and contextual links | Verified | Read the negative-source tests and checked their relevant expected quantities and passages independently. All 91 distinct Rules paths resolve to the pinned source ID and title; 421 Malice support edges and 1,027 Rules relationships retain separate context. Reviewed dragon, eye, retainer, summon and prior-Malice relationships against their actual source wording. |
| 5. Corpus browser display and themes | Verified from evidence | Read the five-test passing CT114 browser log and coverage evidence, together with the implementation review. Personally inspected the Gnoll light and Hag dark captures against the source passages. Full corpus evidence covers 501 parents and 2,006 feature controls; this reviewer did not personally operate the browser. |
| 6. Full check and independent reviews | Verified | Read final CT114 evidence recording 97 engine and 358 app/script tests, source regeneration and production build, plus the separate implementation pass. This report supplies the subsequent independent source pass. |

## Source passages and conclusions

Paths in this section are relative to `en/books/monsters/md/` at the pin unless the
Heroes path is explicitly stated. Line numbers refer to those pinned blobs, including
frontmatter. They are locators for local `git show`, not claims that sparse checkout
exposes every file.

### Extraction repairs and partially structured features

- `monster/gnoll/gnoll-malice.md`, lines 52–64: Iron Jaws is one 3 Malice maneuver,
  with Area/Ranged/Weapon keywords, distance `1 cube within 3` and target `Special`.
  Its Agility test has 6 damage/bleeding save ends, 4 damage/bleeding EoT, and no-effect
  tiers, followed by the edge-on-strikes clause. The missing final pipe on line 56
  caused the JSON's false second feature. Joining the two records is supported;
  retaining three actual Malice features and both original records is correct.
- `monster/hag/hag-malice.md`, lines 70–72: Casting Curses and Bodies is explicitly
  printed at 3 Malice and pushes each enemy within 2 squares up to 3 squares.
  Its absence from JSON must not erase its independent feature. Lines 92–106 put
  Kick after House Call's animated-hut description, expressly as the house's main
  action. Kick is labeled Signature Ability, not a Signature resource cost. The
  repaired qualifier, null cost text, retained House Call context and ordered parent
  features are correct. An independent Kick reference remains source reading; these
  fields are not permission for a hag or an engine to execute it independently.
- `monster/lizardfolk/lizardfolk-malice.md`, lines 55–69: Net Trap retains its printed
  Area/Ranged/Weapon, Maneuver, `1 cube within 3`, Special envelope and complete test.
  JSON keeps this malformed-table envelope in prose instead of dedicated fields.
  Retaining the full Markdown is acceptable for this slice; missing structured
  keywords/usage/range/target must not be treated as an inferred executable envelope.
- `monster/lich/statblock/lich.md`, lines 114–122: Rejuvenation is printed with a
  trait marker and no action envelope. It contains a touching creature's Might test,
  including the lich's full/300/100 Stamina outcomes. The source JSON's ability
  classification is retained without manufacturing usage, keywords, range or target.
  It is not evidence of an acting-lich power roll.
- `monster/undead/3rd-echelon/statblock/vampire-lord.md`, lines 93–111: Sacrifice
  includes a nested Wave of Blood, with its own Area/Magic, `20 burst`, enemy-area
  target and Might-test tiers of 11/8/2 corruption damage. Both tables and all text
  remain in the same complete source span. The outer JSON effects alone are not a
  complete executable model of this nested ability.
- `monster/war-dog/3rd-echelon/statblock/war-dog-iron-priest.md`, Iron Banner:
  the three options are immunity 2, extra 3 holy strike damage, and speed +3. The
  source's `2+ Malice` and per-2-Malice choice wording and all three bullets survive.

### Printed values and missing facts

Independent enumeration found 116 Minions, 97 Elites, 76 Hordes, 68 Platoons,
30 Leaders, 22 Solos, 21 Retainers and eight records with empty organization.
All 116 minion EV strings explicitly use `four` or `4` minions; the importer retains
that denominator as quantity 4. It does not grant per-creature printed EV or round a
squad purchase. The 28 printed EV dashes remain unresolved numeric amounts and
quantities, including the six eyes; external zero values do not resolve those dashes.

`monster/noncombatant/statblock/noncombatant.md` has size `1S-2`, EV `-`, no JSON
features, and a retained Size paragraph describing 1S/1M/1L/2. The package does not
mistake missing features for a missing body. `monster/kobold/statblock/shieldscale-drangolin.md`
prints `2 or 3`, which remains an expression. The Gnoll Gnasher retainer prints EV 60;
that surprising value is retained rather than replaced with the other retainers' dash.
Hobgoblin Flameslinger prints its identical numeric row twice; the original and display
preserve that source duplication.

The six troll statblocks and Troll Mercenary retain fire weakness without an amount.
The printed ordinary troll field is `Acid 5, fire`, or `Acid 8, fire` for Limbjumble.
Orc Eye of Grole prints `Cold, fire, or lightning` without an amount in its immunity
field. Neither missing magnitude is converted into the external comparator's zero.
These source facts require further interpretation if a later engine needs numeric
immunity/weakness behavior; V35 makes no such calculation.

### Supporting relationships

- `rule/monster/malice.md`, lines 19–27, distinguishes creature-group Malice from
  Basic Malice and states that all monsters have the latter. Basic Malice is retained
  as Rules reading, not counted among the 63 source featureblocks. Ordinary enemy
  support and group-context links do not grant or execute mechanics.
- Demon, Undead and War Dog prior-Malice entries refer back to lower-level features.
  For example War Dog level 7 lines 33–35 says level 6 or lower; Undead level 10
  lines 42–44 says level 9 or lower. All lower same-group parents are reachable through
  the higher parent's support links. Demon level 4 lines 25–27 has the incomplete
  wording “level or lower”; the text stays incomplete. Its prior-reading link does
  not silently fill in a numeric threshold or implement eligibility.
- `monster/rival/rival-malice-level-1-malice-features.md`, line 49, says any rival's
  turn. All four echelons correctly share that reading; repeated class names do not
  collapse source identities.
- Each dragon Malice introduction identifies its own dragon, e.g. Crucible line 42.
  The five statblocks each link to exactly their matching Malice, alongside common
  dragon group context. They do not inherit all five by directory membership.
- `monster/xorannox-the-tyract/statblock/xorannox-the-tyract.md`, lines 36–38,
  explains six eyes acting under Xorannox's direction. Its Malice lines 34–35
  explicitly say Xorannox's turn. Eyes have bidirectional owner reading links but
  no owner-Malice support grant. The printed `Demolition` title remains unchanged.
- `chapter/retainers.md`, lines 56–68, says each block is its lowest-level baseline,
  describes its individual advancement, and permits the matching role ability
  **instead**. Each retainer has chapter, individual advancement and role-option
  links. No automatic advancement, encounter calculation or Malice use follows.
- Heroes `en/books/heroes/md/feature/ability/elementalist/level-8/summon-source-of-earth.md`,
  lines 30–34, owns the summon's following turn, dismissal, persistent use and Stamina
  restrictions. The single Heroes statblock links to that ability and does not inherit
  Monsters Elemental Malice from its keyword.
- `monster/ajax-the-invincible/tactical-stance.md`, lines 25–37, provides the three
  round-start stance choices. Ajax links to this separate reading. It is a feature
  block, not another statblock or another Malice parent.

### Comparison dispositions

The 63 maintained resolutions preserve the Compendium's values and order. Checked
material examples include Ogre Juggernaut's printed 1 Malice Hrraaaaaagh! heading
(lines 72–80), Fossil Cryptic's ceiling roll and tiers **before** its floor-roll
introduction (No Escape, lines 141–155), and Ogre Tantrum's projectile push paragraph
**after** its tiers (Throw Fit, lines 37–45). The Werewolf's Facepalm and Head Slam
line 104 says the triggered action is resolved; the external “triggering ability”
wording does not override that timing text or establish an execution interpretation.

The remaining explanations correctly cover separated roll headings in Chimera and
four Devils, inline End Effect labels in Manticore/Medusa/Olothec, Aftershock's
Trigger grouping, Medusa's stray external keyword bullet, whitespace and force/forced
wording, nested/partially structured envelopes, Hag's omitted feature, and the
Xorannox introduction truncated in JSON but complete in Markdown. Appended dragon
and Zapper Eye external Malice is compared separately instead of being imported as
extra statblock features. Full source prose remains available in each case.

The 26 unavailable records are 21 retainers, Source of Earth, Noncombatant, two
Lightbender statblocks and Lightbender Malice. Their local retention is verified;
the report accurately declines an external match. Agreement or an explanation for
other records is still not proof of executable rules support.

## Findings and limits

No remaining blocking finding. Two low-severity explanatory defects were found and
fixed by the implementer during review:

1. `scripts/foes/comparison-resolutions.json:978` and the other five troll resolutions
   originally misstated the printed defense order as Fire, Acid. The final ledger and
   regenerated report correctly say Acid with its magnitude, followed by fire without
   a magnitude. Actual guarded fields, source Markdown and content edition were unchanged.
2. `docs/research/V35-source-findings.md:141` described Iron Banner as a two-item list.
   It now correctly says three-item. All three source options were already retained.

The reviewer ran only lightweight, read-only local Git/JSON/source audits and wrote
this review. No local build, test suite, dependency installation, browser or server was
run. CT114 suites, remote source synchronization and external retrieval were not
personally repeated; their logs, report and independent implementation review supply
that evidence. No gameplay execution or persisted gameplay outcome was claimed or
verified. Browser captures show source definitions, not resolved effects.

Full source retention and contextual links satisfy display ingestion; they do not make
every feature field semantically complete for a future parser. The explicit source
anomalies above remain part of the handoff. There is no unresolved claim of V35 display
completion that requires a rules guess or a new user ruling.

Chords startup and final checks returned “Ambiguous provider session; cannot select a
Chords project.” That limitation and review findings were sent to the assigning parent
for thread-level coordination. This reviewer made no implementation, vendor, main or
runtime changes and did not commit the reviewed work.
