# Spatial-dependent effects: triage audit

Requested 2026-09-25. This is a review list, not permission to disable or rewrite the listed
features. Overwhelm and Thorn Dragon's Domain have separate accepted text/manual deferrals.

## Inclusion and exclusions

Include a named clause when its automatic trigger, numeric result or restriction needs a spatial
fact that the app cannot derive from recorded actors, conditions, rolls and clock events. Examples:
adjacency at a boundary, movement actually completed, path/terrain contact, nearby-creature counts,
relative position, or a visibility change that controls a passive effect.

Exclude ordinary target selection, printed targeting range/line of effect checked as part of that
selection, pure movement instructions/allowances, and ordinary area/aura membership maintained
through the existing multi-select/member controls. A clause can still qualify when it needs extra
facts beyond those members (squares traversed, ground contact, distance moved or proximity counts).
Do not call a whole ability unsupported because one clause needs manual facts.

## Existing implementation used to filter the list

- `web/effect-instances.tsx`, AreaMembers, and `convex/lib/effectOperations.ts`, `effect.members`:
  the table maintains area members; `convex/lib/areas.ts` stores riders and adding a member emits
  area entry. `shared/resolve/areas.ts` defines supported whole-section patterns. This covers
  Incinerate, Blessing of the Faithful, Wellspring of Grace and supported performances, though
  some riders remain instructions. Missing rider grammar is not itself a spatial dependency.
- `convex/lib/resourceOperations.ts`, `resource.claim`, and
  `shared/resolve/heroicResourceGeneration.ts`: resource amounts and limits can be deterministic
  after a table claim even when proximity/movement cannot be observed. Such rows are labelled
  existing claims, not wholly unimplemented mechanics.
- `convex/lib/triggeredActions.ts` offers eligible hero responses and labels distance/adjacency
  as table confirmation; accepting a response can already supply that confirmation. Distinguish
  this from a new repeated turn-start questionnaire.
- `shared/resolve/modifiers.ts`, `markEdge`: existing contextual contributions name line-of-effect
  conditions and allow exclusion. That is supplied context, not computed geometry.
- V176 (`docs/build/V176-forced-movement-followups.md`) explicitly distinguishes calculated
  movement allowance from actual movement. Outcome-dependent numerical follow-ups remain manual;
  an instruction to push does not prove a push occurred.

## Coverage and method

Two user-requested read-only subagents screened hero and monster source inventories; Engine
checked runtime exclusions, reconciled catalog scope and sampled priority source claims.
Baseline: `43080f66`, canonical Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.

- **Heroes:** eleven class organizations; 95 ancestry trait files, 100 complications, 25 kits,
  55 perks, 18 careers and 13 cultures. Titles (66) and treasures (127) were screened and kept
  separate where current exposure was unproved. Nine original classes were screened through
  levels 1–10; later Beastheart/Summoner source was screened but unimported abilities are outside
  the active list. The appendix states catalog/reference/source-only evidence per row.
- **Monsters:** the foe catalog has 2,507 records: 438 stat blocks, 1,158 abilities, 642 traits and
  269 Malice records. The audit screened its 501 parent source records (438 stat blocks and 63
  Malice sheets), plus group context. Chosen V1 owners are marked separately.
- **Cross-catalog reconciliation:** the additional 37 imported Summoner minion statblocks
  are covered in the monster appendix: 82 named sections, 11 additional core clauses.
  The union covers all 475 imported statblocks plus 63 Malice sheets.

- **Counts:** the hero appendix has 114 core/context rows, including existing claim/accept/exclude
  routes, plus 48 boundary rows and 23 supporting rows with unproved exposure. These are review
  rows, not counts of broken or wholly unimplemented abilities. Monster repeated owners are
  listed under shared effect groups; no unsupported combined percentage is calculated.

This is a comprehensive inventory/search audit with candidate source reads, not independent
line-by-line rules certification of every nonmatching passage or live-runtime verification.
Ordinary multi-select areas/auras are excluded. No runtime test was run by the audit agents.

## How to triage

Review the clause, not the complete ability. Suggested decisions are: keep the existing control;
retain/source-text the unobservable clause; build a bounded input only if its benefit justifies the
interaction; or defer it to map/spatial support. A source-only discovery is not an implemented
regression. A compiler's supported status may include manual instructions; it is not evidence
that geometry is measured.

Prioritize repeated automatic triggers/restrictions that would require new questions like
Overwhelm. Review one-use path/count riders next. Existing claim/accept/exclude mechanics are
shown separately because the user has already accepted many of those interaction patterns.
Only the user can decide additional text-only deferrals from this list.

## Selected V1 monsters: first triage pass

These are clause-level candidates from the selected roster; source details and further owners
are in the monster appendix. Except the existing Overwhelm/Domain deferrals, they are **for
review**, not new text-only decisions. V217–V227 are plans; their existence is not runtime proof.

| Effect | Spatial fact beyond ordinary targeting/membership | Why review it |
| --- | --- | --- |
| Bugbear Commander — **The Commander's Watching** | Ally's line of effect to commander at that ally's turn start | Repeated boundary eligibility before condition removal |
| Undead Malice — **Ravenous Horde** | Which heroes have no undead adjacent at round end | Delayed eligibility census; accepted 2-Stamina spawn calculation remains separable |
| Werewolf — **Moonfall** | Line of effect to the moon at allowance use/turn end | Recurring permission and rage-gain predicate |
| Arixx — **Earth Sink** | Ground/underground state and whether start/end squares are identical | Turn-boundary movement-cost and sinking effects |
| Human Bandit Chief — **Form Up!** | Whether the recipients are adjacent as required by the effect | Persistent positional defense benefit after the movement instruction |
| Human Guard — **Halberd** | Whether the guard is flanked | Extra free strike depends on a relative-position fact |
| Goblin Malice / Monarch — **Tiny Stabs / Kill!** | Goblin count adjacent to each enemy | Per-enemy damage multiplier, not just affected-member selection |
| Bugbear Malice — **Grab Iron Ball / Grab Javelin** | Number of squares thrown; Javelin also has ally proximity for its later pull | Actual distance changes damage even when a target is legally selected |
| Bugbear Roughneck — **Drag Through Hell** | Actual dragged distance | Damage per square; printed movement allowance is insufficient |
| Human Bandit Chief — **Whip and Magic Longsword** | Whether the actual pull ends adjacent | Additional damage depends on the endpoint |
| Ghoul / Werewolf / Arixx — **Leap / Wall Leap / Sinkhole** | Actual landing, wall contact or distance after movement | Conditional prone/attack/continuation; ordinary movement stays table instruction |
| Ghost / Specter — **Corruptive Phasing**; Thorn Dragon — **Provoking Nettles** | Which creatures' spaces the actual path crosses | Per-crossing damage and source limits |
| Goblin Stinker — **Swamp Gas**; Thorn Dragon — **Bramble Barricade** | Actual affected squares traversed and source-specific movement type | Per-square damage; membership alone cannot supply a count |
| Thorn Dragon — **Investiture of Verdure** | Which targets were actually pulled | Temporary Stamina depends on successful movement, not selected targets |
| Arixx — **Dirt Devil** | Whether it starts the turn underground | Turn-start roll benefit |
| Human Knave — **I'm Your Enemy**; Storm Mage — **Arcane Shield**; Thorn Dragon — **Thorned Armor** | Attacker/grabber adjacency at the triggering event | Reaction/passive rider; an attack's legal reach does not prove adjacency |
| Bugbears — **Catcher**; Roughneck — **Flying Sawblade**; Werewolf — **Facepalm and Head Slam** | Entered reach, vertical forced movement, or qualifying approach path | Movement-triggered response; compare with existing accept-card pattern before shelving |
| Werewolf — **Shared Ferocity** | Line of effect to the first qualifying expenditure | Once-per-encounter arithmetic settled; trigger detection still needs a fact |

**Already decided:** Human Knave **Overwhelm**, Thorn Dragon **Domain**, and the
Domain-dependent part of **Malign Thicket** stay text/manual as recorded in the
[spatial register](../spatial-dependent-effects.md). They are included for completeness, not
reopened. Other Malign Thicket clauses need their own review, especially actual forced movement.

**Boundary cases, not automatic deferral candidates:** Accursed Rage's nearest target, Ghost
Paranormal Activity/Undead Paranormal Fling nearest-enemy movement, Full Wolf fitting the new
size into a legal space, and Geyser's safe landing destination may remain ordinary table choices
or instructions. Do not turn their placement instructions into extra questionnaires by default.
Human Blackguard Parry! adjacency is ordinary reaction eligibility, analogous to already accepted
hero reaction cards; list it for context, not as a whole-ability removal recommendation.

## Hero effects: first triage pass

Exact source paths, sections and exposure evidence are in the hero appendix. “Catalog” and
“referenced” there mean content is present, not that a clause executes. These rows prioritize
imported or directly referenced content; the appendix separately identifies later/source-only
material. No new text-only treatment has been approved for these candidates.

| Effect | Extra spatial fact | Clause to triage |
| --- | --- | --- |
| **Polder Geist** | Enemy-relative line of effect, hidden/concealment at turn start | Conditional speed gain |
| **Shadow Born** | Concealment at turn start | Surge gain; holy weakness is independent |
| **Gnoll-Mauled** | Any adjacent creature at a dazed turn start | Compulsory free strike; dazed state alone is insufficient |
| **Slight Case of Lycanthropy** | Moonlight, nearest creature and distance ties | Compulsory behavior/form eligibility; stored surges remain deterministic |
| **Grounded** | Lightning-damage recipient within 2 squares | Reactive damage to the hero |
| **Our Hearts Your Strength** | Ally count within 10 of each target at its turn start | Speed and rolled-damage bonus magnitude |
| **Edict of Disruptive Isolation** | Target's adjacency to another relevant creature | Only extra damage when judgment does not already satisfy the OR condition; ordinary aura membership excluded |
| **Chronokinetic Mastery / Cryokinetic Mastery** | Actual willing movement / movement inside Null Field | Conditional surge gain; recorded grab can satisfy its alternative branch independently |
| **Dancer / Umbral Form** | Movement through or beside a creature; some endpoint visibility predicates | Triggered movement or damage rider; independent form benefits remain |
| **Soulbound / Lead by Example** | Pairwise adjacency involving linked partners or the Censor and struck target | Conditional edge/flanking-style benefit; other clauses remain |
| **Every Step... Death! / Debilitating Strike / Mind Snare** | Actual squares moved/left, with the printed willing/forced distinction | Damage per square; initial attack and conditions are separable |
| **Wall of Fire** | Number of affected squares entered or occupied | Per-square fire amount only; membership is already an established control |
| **No Dying on My Watch** | Number of enemies passed adjacent during actual movement | Temporary Stamina multiplier; other response clauses remain |
| **Impart Force / Phase Hurl / Stasis Field** | Actual displacement amount | Follow-up amount/permission; allowance does not prove movement |
| **Lightning Leap / Pushover / Foe Bowling / This One's Yours** (Beastheart) | Jump length, path crossing, endpoint adjacency or actual repush | Conditional damage/prone/repeated attack; companion support is an additional nonspatial concern |
| **Focus Fire! / Summoner's Sword** (Summoner) | Adjacent minion count / adjacent ally count respectively | Surge or damage amount; minion actor support is a separate concern |
| **Inertia Soak** | Each square actually entered and creatures adjacent there | Repeated movement rider; its independent immunities remain |

## Already handled through lightweight input: review separately

These are not examples of an engine with no deterministic mechanics. It can calculate their
result after the existing claim, accept or exclude control. Include them in triage only if the
user wants to revisit that interaction burden; do not silently downgrade them.

| Existing mechanism | Examples / missing fact | Current evidence |
| --- | --- | --- |
| Heroic-resource claim | Beastheart damage adjacent to companion; Summoner death in range; Elementalist typed damage nearby; spatial Conduit domain events; Troubadour natural roll in line of effect | `resource.claim` applies amount and usage limit; profiles state what the table confirms |
| Accepted reaction card | Tactician **Parry** ending adjacent to an ally; distance-limited hero turn-trigger cards | `shared/resolve/damageRevision.ts` and `convex/lib/triggeredActions.ts`; accept is the confirmation |
| Contextual roll contribution | Tactician **Mark** line of effect | `shared/resolve/modifiers.ts`, `markEdge`; applicable edge can be excluded |

## Full source appendices

- [Hero candidates and exclusions](spatial-effect-triage-heroes.md): recurring predicates,
  path/count follow-ups, existing controls, supporting effects and exposure limits.
- [Monster candidates and exclusions](spatial-effect-triage-monsters.md): selected V1 priorities,
  exact repeated-owner lists across the imported catalog, and a separate boundary/geometry appendix.

The appendices preserve borderline findings so they can be reviewed without inflating the strict
core list. A simple zone or pairwise relation may be representable using an existing control;
that possibility is not a claim the individual feature has already been implemented.


