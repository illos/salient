# V37 supporting backgrounds: source inventory and Forge comparison

Research dated 2026-09-17. The machine ledger is [v37-backgrounds.json](v37-backgrounds.json).
This is rules research and comparison evidence, not an implementation or verification claim.
Only Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` establishes rules. Forge
`5a846aadb623a9855a023e9403bb887a956c341f` supplies structural comparison; sparse files were read
with `git show HEAD:<path>`, never fetched from an unpinned branch.

The ledger preserves complete source bodies, source identity/hash, complete matched Forge records,
choice counts and explicit resolved skill/perk pools, fixed grants, initial numeric rewards,
permanent numeric modifiers, manual timing and every material comparison finding. Per-record
`discrepancies` distinguish representation differences from actual wording or control gaps.

## Coverage and database reconciliation

| Family | Eligible source count | Comparison |
| --- | ---: | --- |
| Careers | 18 | All18 Forge career records;108 incidents individually paired by row |
| Culture aspects | 13 | Five environments, two organizations, six upbringings; all pools match |
| Core perks | 47 | All47 Forge records, with source grouping independently checked in Heroes clean |
| Selectable skills | 57 | All57 names/groups match Forge Core+Orden and skill.json snapshot |
| Skill groups | 5 | Category records, not additional selectable skills |
| Languages | 42 | All42 named source languages match Forge Orden identities |
| Ordinary kits | 21 | All bonus fields and signature tier constants checked |
| Stormwight kits | 4 | Separate Fury-only eligibility; split supporting sections retained |

The57 records in `shared/content/compendium/skill.json` are57 selectable skills. The complete
Compendium skill tree contains62 records because it also has five groups. No five skills are missing.
Languages have no standalone source directory:42 unique names come from the9-row human table,
25-row ancestry table (Khoursirian overlaps), and9-row dead-language table in Heroes clean
**Languages in Orden**. The earlier matrix omitted that dead-language table. This inventory keeps
all three tables, related ancient languages and common project topics. Caelian is a fixed grant;
culture language is independent of ancestry. Custom language identities remain excluded by Q-CHAR-6.

Eight Beastheart perks are explicitly enumerated in `excludedSupplemental`. They are outside this
47-core-perk ledger, not silently allowed through unrestricted core pickers. This does not revoke
the separately authorized Beastheart class/editor scope. No extra source record becomes selectable
merely because Forge or the unified directory contains it.

## Findings that affect implementation

- **Full text:** Forge culture descriptions contain only the opening sentence. Career descriptions
  omit career questions and benefit prose. Use complete Compendium bodies; quick-build suggestions
  are optional recommendations rather than fixed grants.
- **Career fixed skills:** Forge models them as preselected skill choices. Factory defaults make an
  empty pool unrestricted, but the source fixed grant remains fixed. Apply Q-CHAR-11 before other
  choices; Warden/Fury Nature collision creates one unrestricted replacement entitlement.
- **Sailor extraction:** its standalone incident table loses row delimiters/numbers but retains six
  ordered bold paragraphs. Recover six incidents rather than dropping the table. Every career has
  six incidents. Numerous Forge incident paragraphs shorten or alter narrative wording; each source
  and Forge paragraph is retained with its normalized comparison result. Narrative incidents do not
  themselves grant build modifiers, curses or items.
- **Owned targets:** Area of Expertise requires one owned crafting skill; Specialist requires one
  owned lore skill. Forge stores both as plain Text without a picker. These are modifier targets,
  not another skill grant. Removing the owned skill invalidates its dependent target.
- **Linguist:** grants two new languages with regular prior-exposure condition. Its Forge choice
  alone omits that prerequisite; preserve the full parent and child text. Later immersion/research
  benefits remain manual. Keep deferred entitlements distinct from known languages.
- **Eidetic Memory:** after a respite, one unowned lore skill lasts until the next respite. This is
  temporary configuration, not permanent creation knowledge and not an invented previous respite.
- **Familiar:** Forge parent text is empty because its whole definition is nested in Summon. Show
  complete source description/statblock; Stamina is2×hero level, not a hero Stamina bonus. Playable
  companion behavior remains deferred.
- **No core perk raises permanent hero numeric statistics.** Specialist's apparent Renown bonus
  is conditional negotiation treatment. Brawny/Lucky Dog spend current Stamina during use. Handy and
  Polymath are conditional test modifiers. The ledger records every perk's trigger/duration.
- **Kit signatures already include bonuses:** all75 source tier constants equal Forge base constants
  plus the kit tuple. Distances likewise include kit bonuses. Printed Corven burst area is not a
  distance to enlarge. Whole kit damage tuples apply to rolled damage with the required keywords.
- **Stormwight split sources:** the standalone kit record says Martial and lacks bonuses/forms.
  Use its Fury sections and exclude it from ordinary-kit choices. Corven/Raden hybrid1S/1M remains
  a real conditional choice even though Forge leaves it as text.
- **Actual Stormwight timing mismatch:** all four Forge kits encode Ferocity4/8 surge grants as
  OncePerRound; Compendium says first time on a **turn**. Source timing wins, including manual text.
- **Smaller text differences:** Forge Cloak and Dagger/Martial Artist omit source optional “can”;
  Mountain has duplicated “damage” wording; Traveling Artisan/Sage use Forge “Travelling” IDs;
  Invisible Force's Forge target adds unattended to all objects while the source qualifies movable
  parts in its effect. Source full text stays authoritative.
- **Skill text:** Tailoring, Gymnastics, Ride and Handle Animals have small wording differences.
  Timescape includes the general Make Your Own Skills sidebar in its standalone source; that is
  context, not another selectable skill. All57 canonical names and groups match.
- **Language differences:** Forge adds an unsupported Cyllinric relationship to Filliaric, calls
  Proto-Ctholl an offshoot where source says precursor, omits higher demons from Tholl, and adds
  gnomes to Variac. These do not justify new selectable identities. Source table wording is retained.

Initial career Renown/Wealth/project points are one-time starting grants with persistent provenance.
They do not reset current resources or repeatedly mint rewards when editing/restoring. Project
points remain a readable grant while their spending workflow is deferred under Q-CHAR-9.

## Career grants

All careers also choose one sourced perk and one chosen/rolled/authored incident. Group unions mean
one combined pool. Resolve fixed grants first and require discretionary skills to be distinct.

| Career | Fixed skills | Chosen skill pool(s) | Languages | Renown | Wealth | Project points | Perk |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Agent | Sneak | 1 × interpersonal; 1 × intrigue | 2 | 0 | 0 | 0 | intrigue |
| Aristocrat | — | 1 × interpersonal; 1 × lore | 1 | 1 | 1 | 0 | lore |
| Artisan | — | 2 × crafting | 1 | 0 | 0 | 240 | crafting |
| Beggar | Rumors | 1 × exploration; 1 × interpersonal | 2 | 0 | 0 | 0 | interpersonal |
| Criminal | Criminal Underworld | 2 × intrigue | 1 | 0 | 0 | 120 | intrigue |
| Disciple | Religion | 2 × lore | 0 | 0 | 0 | 240 | supernatural |
| Explorer | Navigate | 2 × exploration | 2 | 0 | 0 | 0 | exploration |
| Farmer | Handle Animals | 2 × exploration | 1 | 0 | 0 | 120 | exploration |
| Gladiator | — | 2 × exploration | 1 | 2 | 0 | 0 | exploration |
| Laborer | Endurance | 2 × crafting/exploration | 1 | 0 | 0 | 120 | exploration |
| Mage's Apprentice | Magic | 2 × lore | 1 | 1 | 0 | 0 | supernatural |
| Performer | — | 1 × Music/Perform; 2 × interpersonal | 0 | 2 | 0 | 0 | interpersonal |
| Politician | — | 2 × interpersonal | 1 | 1 | 1 | 0 | interpersonal |
| Sage | — | 2 × lore | 1 | 0 | 0 | 240 | lore |
| Sailor | Swim | 2 × exploration | 2 | 0 | 0 | 0 | exploration |
| Soldier | — | 1 × exploration; 1 × intrigue | 2 | 1 | 0 | 0 | exploration |
| Warden | Nature | 1 × exploration; 1 × intrigue | 1 | 0 | 0 | 120 | exploration |
| Watch Officer | Alertness | 2 × intrigue | 2 | 0 | 0 | 0 | exploration |

## Kit baseline ledger

Stamina scales by echelon; remaining columns are flat bonuses. Signature text/tiers and all
Stormwight conditional benefits are in the JSON. Source-equipment category choice permits authored
appearance, not custom mechanical items. Currently only the Berserker Fury parent is supported;
Elementalist does not acquire a kit because a kit has Magic metadata.

| Kit | Pool | Stamina/echelon | Speed | Stability | Melee tuple | Ranged tuple | Melee distance | Ranged distance | Disengage |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: |
| Arcane Archer | ordinary | 0 | 1 | 0 | 0/0/0 | 2/2/2 | 0 | 10 | 1 |
| Battlemind | ordinary | 3 | 2 | 1 | 2/2/2 | 0/0/0 | 0 | 0 | 0 |
| Boren | stormwight | 9 | 0 | 2 | 0/0/4 | 0/0/0 | 0 | 0 | 0 |
| Cloak and Dagger | ordinary | 3 | 2 | 0 | 1/1/1 | 1/1/1 | 0 | 5 | 1 |
| Corven | stormwight | 3 | 3 | 0 | 2/2/2 | 0/0/0 | 0 | 0 | 1 |
| Dual Wielder | ordinary | 6 | 2 | 0 | 2/2/2 | 0/0/0 | 0 | 0 | 1 |
| Guisarmier | ordinary | 6 | 0 | 1 | 2/2/2 | 0/0/0 | 1 | 0 | 0 |
| Martial Artist | ordinary | 3 | 3 | 0 | 2/2/2 | 0/0/0 | 0 | 0 | 1 |
| Mountain | ordinary | 9 | 0 | 2 | 0/0/4 | 0/0/0 | 0 | 0 | 0 |
| Panther | ordinary | 6 | 1 | 1 | 0/0/4 | 0/0/0 | 0 | 0 | 0 |
| Pugilist | ordinary | 6 | 2 | 1 | 1/1/1 | 0/0/0 | 0 | 0 | 0 |
| Raden | stormwight | 3 | 3 | 0 | 2/2/2 | 0/0/0 | 0 | 0 | 1 |
| Raider | ordinary | 6 | 1 | 0 | 1/1/1 | 1/1/1 | 0 | 5 | 1 |
| Ranger | ordinary | 6 | 1 | 0 | 1/1/1 | 1/1/1 | 0 | 5 | 1 |
| Rapid-Fire | ordinary | 3 | 1 | 0 | 0/0/0 | 2/2/2 | 0 | 7 | 1 |
| Retiarius | ordinary | 3 | 1 | 0 | 2/2/2 | 0/0/0 | 1 | 0 | 1 |
| Shining Armor | ordinary | 12 | 0 | 1 | 2/2/2 | 0/0/0 | 0 | 0 | 0 |
| Sniper | ordinary | 0 | 1 | 0 | 0/0/0 | 0/0/4 | 0 | 10 | 1 |
| Spellsword | ordinary | 6 | 1 | 1 | 2/2/2 | 0/0/0 | 0 | 0 | 0 |
| Stick and Robe | ordinary | 3 | 2 | 0 | 1/1/1 | 0/0/0 | 1 | 0 | 1 |
| Swashbuckler | ordinary | 3 | 3 | 0 | 2/2/2 | 0/0/0 | 0 | 0 | 1 |
| Sword and Board | ordinary | 9 | 0 | 1 | 2/2/2 | 0/0/0 | 0 | 0 | 1 |
| Vuken | stormwight | 9 | 2 | 0 | 2/2/2 | 0/0/0 | 0 | 0 | 1 |
| Warrior Priest | ordinary | 9 | 1 | 1 | 1/1/1 | 0/0/0 | 0 | 0 | 0 |
| Whirlwind | ordinary | 0 | 3 | 0 | 1/1/1 | 0/0/0 | 1 | 0 | 1 |

## Perk controls and manual effects

Every row's complete full text and exact Forge record lives in the machine ledger. “No build picker”
means its per-use choices remain readable/manual; it never means omitted source text.

| Perk | Group | Required nested control | Manual timing/effect |
| --- | --- | --- | --- |
| Arcane Trick | supernatural | No build picker | Main action; choose one of seven effects each use; effect-specific durations (next turn/touch) remain manual. |
| Area of Expertise | crafting | skill-modifier-target: 1 crafting | Owned crafting target: easy/medium tier1 becomes tier2; 1-minute inspection gives value/flaws. |
| Brawny | exploration | No build picker | Failed Might test; lose 1d6+level Stamina for +1 outcome tier, once per test. |
| But I Know Who Does | lore | No build picker | Failed lore recall; Director supplies nearest possible information location, with secrecy exceptions. |
| Camouflage Hunter | exploration | No build picker | In wilderness after becoming hidden; retain hidden without cover/concealment. |
| Charming Liar | interpersonal | No build picker | Failed Lie test or first caught negotiation lie; refresh only after earning at least1 Victory. |
| Creature Sense | supernatural | No build picker | Maneuver; creature within10 at level<=hero reveals statblock keywords. |
| Criminal Contacts | intrigue | No build picker | Settlement respite activity; Presence tier2 common criminal information, tier3 uncommon information if it exists. |
| Danger Sense | exploration | No build picker | Natural environment excluding settlement: Alertness edge, cannot be surprised, warns of natural disaster within72hours. |
| Dazzler | interpersonal | No build picker | After1 uninterrupted minute performance, edge to influence viewers for1hour after performance. |
| Eidetic Memory | lore | temporary-skill-configuration: 1 lore | At respite finish choose1 unowned lore skill until next respite; memorize page with1 uninterrupted minute reading. |
| Engrossing Monologue | interpersonal | No build picker | Outside combat; hearing nonhostiles within10 listen for1minute or until danger; ally unnoticed-test edge. |
| Expert Artisan | crafting | No build picker | Crafting/research test using owned crafting skill: roll twice, use either. |
| Expert Sage | lore | No build picker | Crafting/research test using lore skill: roll twice, use either. |
| Familiar | supernatural | No build picker | Readable familiar: size1T, speed5, Stamina2*heroLevel, stability0; M-3 A2 R0 I0 P1; telepathy/shared senses within10; flank only with owner; no harming/hand tasks; restore via respite activity or main action spending1Recovery. |
| Forgettable Face | intrigue | No build picker | First meeting <=10minutes can erase face memory; disguise prepared>=1hour auto tier2, tier3 if Disguise known. |
| Friend Catapult | exploration | No build picker | Maneuver: willing adjacent ally/object <=own size; vertical push2*M, reduces fall distance2*M; refresh earning>=1Victory. |
| Gum Up the Works | intrigue | No build picker | Triggered action when mundane trap within3 activates; move<=3 toward it, jam if adjacent, held while adjacent unless failed disarm. |
| Handy | crafting | No build picker | Crafting test without applicable skill gets +1 power roll; conditional, not a skill grant. |
| Harmonizer | interpersonal | No build picker | Presence/Music can influence emotionless/non-understanding creatures; once per negotiation musical aid edge. |
| Improvisation Creation | crafting | No build picker | Owned crafting skill: jury-rig/repair related mundane item without test/tools;1hour or1use then breaks, Director determines. |
| Inspired Artisan | crafting | No build picker | Crafting-skill project roll; spend hero token for another roll same respite activity, once per respite. |
| Invisible Force | supernatural | No build picker | Maneuver ranged10; size1T object moves R/I/P choice squares; each-use choice, not permanent characteristic choice; attached movable part must be unattended; cannot break off parts. |
| I've Got You! | exploration | No build picker | Free triggered action when willing ally falls on/adjacent; both avoid falling damage. |
| I've Read About This Place | lore | No build picker | First settlement visit; choose one of3 questions; Director may substitute question if unanswered. |
| Lie Detector | interpersonal | No build picker | Spend hero token in response to communication: identify knowing lies, not truth. |
| Linguist | lore | language-grant: 2 languages | Two permanent new languages require regular prior exposure. Seven-day immersion enables basic communication; related language research half goal. |
| Lucky Dog | intrigue | No build picker | Failed intrigue test; lose1d6+level Stamina for+1tier, once per test. |
| Master of Disguise | intrigue | No build picker | Don/remove disguise as part of Hide skill test or Hide maneuver. |
| Monster Whisperer | exploration | No build picker | Handle Animals applies to nonsapient non-animals; does not grant skill. |
| Open Book | interpersonal | No build picker | One-on-one question may offend; no consequences on deflection; honest answer permits compulsory honest reciprocal question. |
| Pardon My Friend | interpersonal | No build picker | Ally within5 fails Presence test; replacement own Presence test with bane, once per test across all holders. |
| Polymath | lore | No build picker | Lore recall test without applicable skill gains+1 power roll; no skill grant. |
| Power Player | interpersonal | No build picker | Might may replace characteristic on Brag/Flirt/Intimidate tests; no fixed ability choice. |
| Psychic Whisper | supernatural | No build picker | Maneuver ranged10, ally understanding a language; one-way message <=10seconds; target knows sender and may ignore. |
| Put Your Back Into It! | exploration | No build picker | Montage assist tier1 imposes no bane; once per montage promote ally tier1 to tier2. |
| Ritualist | supernatural | No build picker | One uninterrupted minute touching willing target/self: double edge on next test within1minute; activity must take<=1minute. |
| Slipped Lead | intrigue | No build picker | Escape-bonds edge;1 uninterrupted minute escapes mundane bonds without test, escape hidden until revealed. |
| So Tell Me... | interpersonal | No build picker | After successful Presence influence, one honest follow-up; Director may limit answers that endanger respondent/loved one. |
| Specialist | lore | skill-modifier-target: 1 lore | Owned lore target double edge on recall; conditional negotiation Renown treated+1 for reputation,+2 if NPC shares skill; no permanent Renown grant. |
| Spot the Tell | interpersonal | No build picker | After tier3 read-person test, future read-person tests against same individual gain edge. |
| Team Leader | exploration | No build picker | At group/montage test start spend hero token to share owned exploration skills for tests with participants. |
| Teamwork | exploration | No build picker | First turn of each montage: both test and assist. |
| Thingspeaker | supernatural | No build picker | One uninterrupted minute holding emotionally resonant object; choose1 of3 questions; optional second adds Intuition/Presence bane until respite and blocks further use meanwhile. |
| Traveling Artisan | crafting | No build picker | Day without respite:1uninterrupted hour crafting with owned crafting skill earns1d10project points. |
| Traveling Sage | lore | No build picker | Day without respite:1uninterrupted hour research with owned lore skill earns1d10project points. |
| Wood Wise | exploration | No build picker | Exploration test with at leastone d10 showing1; rerollone d10 once per test. |

## Rechecking and handoff

The ledger is reproducible from each `source.path` at the recorded Compendium commit and each
`forge.path` at the recorded Forge commit. SHA256 fingerprints identify exact source files.
Culture pools are checked against all13 Forge controls; career fixed/chosen skill pools/counts,
language counts, perk groups and Renown/Wealth/project-point amounts against all18 career records;
all57 skill names/groups and42 language identities against Forge sourcebooks; all47 perk groups
against clean Heroes headings; all25 kit bonus field sets and75 normalized signature constants
against Forge kit records. Source and Forge incident texts expose all wording differences directly.
These are lightweight read/ledger consistency checks; no installs, builds, runtime changes or browser
tests ran in this research subtask. The lead owns actual database import reconciliation, implementation,
independent review and CT114 validation. Complications are researched in a separate companion ledger.
