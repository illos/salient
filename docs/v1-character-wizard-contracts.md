# V1 character wizard: core content and decision contracts

Research/specification checkpoint, 2026-09-14. This thread owns the fuller V1 wizard specification at
the user's request. It does not own the concurrent v0.01 implementation or the other V1 subsystems.
The [primary wizard spec](character-wizard-spec.md) continues to own product requirements and approval
policy. This companion makes its core-content requirements concrete.

**Status:** source-backed research and proposed application contracts. No evaluator, wizard UI, backend,
deployment or independently reviewed rules implementation is delivered by this document. The v0.01
R01–R03 contracts are not marked delivered by this work. Ambiguous behavior below remains undecided.

## 1. Evidence and coverage

Sources inspected:

- Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, chiefly the Heroes book.
- Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`, for structural comparison only.
- The [generated coverage matrix](research/v1-wizard-coverage-matrix.md) and
  [machine-readable source index](research/v1-wizard-source-index.json), reproducible with
  `python3 docs/research/build-v1-wizard-index.py --check`.

The matrix enumerates 12 ancestries, nine classes × ten levels, 13 culture aspects, 18 careers,
25 kits (21 ordinary and four Stormwight), 47 core perks and 100 complications. It includes core
religion and skill records and the Heroes feature records needed to follow dependent grants. Counts
refer to source records, not implemented choices. Five of the 62 skill records are group entries.

Core membership comes from the book-specific Git tree, not every entry in `en/unified`. For example,
the unified perk directory also contains eight Beastheart perks. The unified `chapter/perks.md`
is supplemental; read `en/books/heroes/md/chapter/perks.md` through Git for the core chapter.

Research source notation below: `Heroes clean, <heading>` means the pinned Git object
`en/books/heroes/clean/Draw Steel Heroes.md`, accessed with `git show`. It supplies surrounding
sentences moved out of extracted chapters. Ordinary source links point to checked-out files.
Do not interpret a missing standalone record as a missing rule or manufacture an SCC for a subsection.

Coverage has separate questions: is the source available; are choices/grants fully specified; can the
evaluator derive them; can the application save/use them; can their gameplay effects execute? The
matrix currently answers the first. This document answers bounded parts of the second. None of those
answers automatically establishes another.

## 2. Creation, completion and navigation

The source's complete suggested sequence is Think; Ancestry; Culture; Career; Class; Kit; Add Free
Strikes; Complication; Determine Details; Make Connections. It explicitly permits another order.
Use that sequence as the default overview, with Think as introductory guidance and Free Strikes as
an automatic-grant review, rather than fabricated mechanical choices.
[Source: Making a Hero](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#step-by-step-hero-making).
This V1 navigation proposal does not change the v0.01 step-order acceptance contract.

Proposed interaction contract:

1. Choose a target level 1–10 and optionally a campaign. Show source availability separately from
   campaign permission to activate the resulting build.
2. Allow movement between sections. Show which selections are required, granted, optional,
   legitimately deferred, or dependent on an unresolved parent. Save incomplete drafts.
3. Present a live build preview with the origin of each value and an actionable list of missing or
   invalid decisions. Unchosen optional flavor and connections do not prevent mechanical completion.
4. Show all consequences of changing a parent: selections preserved, benefits removed, new choices
   opened, and item/resource consequences needing review. Preserve displaced selections for inspection;
   they contribute no active grants. Do not auto-select replacements.
5. Review the completed build and submit/apply through existing authority rules. Saving, evaluating,
   inspecting, or submitting never initializes resources or grants inventory.

The same operations serve UI and headless clients. A client cannot establish validity by hiding an
option, nor bypass the scope of level-up by sending an ancestry/class change with its request.

### Completion is more specific than a nonempty form

The source explicitly allows some starting languages to remain open until the player discovers a
useful choice. Represent a language entitlement as `selected(languageId)` or `deferred`, retaining its
origin and restrictions. Deferred entitlement grants no particular language until filled. Filling it
consumes that entitlement once. It is not an import error or an automatically chosen language.
[Source: I Speak Their Language](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md).

Proposed statuses retain the primary spec's `complete`, `incomplete`, `invalid`, `unsupported` result
vocabulary, with individual diagnostics so multiple issues can coexist. `complete` can include legal
deferred language slots and manual gameplay effects. An unknown creation prerequisite or unimplemented
baseline effect cannot be disguised as manual combat support. Approval handling for later language
selection and source-authorized reconfiguration is Q-CHAR-5.

Optional Complication is an explicit `none` choice in the V1 design; present benefits and drawbacks
together for a chosen complication. The concurrently recorded answer to Q-CHAR-1 omits this step
from v0.01. That prototype decision does not remove complications from the fuller V1 scope.

## 3. Definition and selection model

Proposed record contract, independent of database tables:

| Concept | Required information |
| --- | --- |
| Definition identity | App decision ID, content release, full source SCC and optional named section; scoped Forge path/ID when mapped. |
| Availability | Owning class/ancestry/branch, level, prerequisite decisions and permitted content sources. |
| Selection | Explicit grant, single option, distinct set, point budget, characteristic assignment, reference to an existing selection, or independently authored text. |
| Cardinality | Required number or budget; whether repetition is permitted; any distinctness rule within a repeated choice. |
| Timing | Initial selection requirements separately from permitted later changes: creation, progression, respite, or play. |
| Result | Granted content, derived modifiers, further decision nodes, and any one-time initial-state/inventory intent. |
| Replacement | Which exact prior entitlement/selection is replaced, with source permission and retained history. |
| Explanation | Source, parent dependency and reason an option is allowed, inactive, invalid or unresolved. |

Definitions are not saved hero objects. Selections refer to definitions and option identities. Grant
instances retain their origin even where the effective sheet displays a single deduplicated skill or
ability. Two different source grants with the same display name must not collapse into one decision.

Use explicit modifier operations such as set base, add, select one contribution, scale by level,
scale by echelon and conditionally apply. An unconditional sum is insufficient. Temporary conditions,
equipment state, form, resource thresholds and human adjustments belong to the live-state overlay;
they must not rewrite the creation choice that supplied a feature.

Resolve dependencies in a deterministic order with explicit references. For example, a Revenant's
former ancestry establishes size before its point budget; a perk selecting a known crafting skill
depends on resolved skill grants. Report dependency cycles/unresolved sources rather than guessing.

### What Forge Steel contributes

Inspected structural references:

- `src/models/feature.ts`: separate ancestry-feature, domain, kit, skill, perk and class-ability choices;
  nested feature bundles; build/respite/play timing.
- `src/logic/factory-feature-logic.ts`: omitted generic/class-ability counts default to one; domain
  choices and domain-feature choices are distinct. A preselected skill can encode an automatic grant.
- `src/data/classes/conduit/conduit.ts`: zero conventional subclasses, a two-domain selection and
  successive domain-feature selections. Zero does **not** mean Conduit has no subclass concept.
- `src/data/classes/tactician/tactician.ts`: Field Arsenal grants two kits.
- `src/data/ancestries/revenant.ts` and `src/logic/hero-logic.ts#getAncestryPoints`: former ancestry and
  a size-dependent budget. Extra data paths may require `git show` under sparse checkout.

Do not copy defaults as game rules. Forge can flatten an option into several records, omit a decision
from a helper, or implement different presentation. Examples: Dragon Knight Prismatic Scales is
expanded into damage-type variants; our identity should retain the parent trait and its parameter.
Class ability pools need explicit source membership, not a query for all records with matching cost.
Forge `selectAt: 'respite'` does not mean a new hero starts without choosing their prayer/ward.

## 4. Ancestries

All 12 core ancestries are individually required. The complete trait names, printed costs and source
links are in the [ancestry matrix](research/v1-wizard-coverage-matrix.md#all-ancestries-and-trait-budgets).

General source baseline: size 1M, speed 5 and stability 0 unless a rule changes them. Signature traits
are free; purchased traits consume the ancestry's budget. Source: Heroes clean, **Starting Size and
Speed** and **Ancestry Traits**, immediately before Devil. The Devil list has seven purchased traits;
its signature and parent section are not additional purchased options.

| Ancestry | Points | Free signature traits | Required special handling |
| --- | ---: | --- | --- |
| Devil | 3 | Silver Tongue | Beast Legs sets base speed to 6; it is not a +6 modifier. |
| Dragon Knight | 3 | Wyrmplate | Select an immunity type; purchased Prismatic Scales has another choice. Keep Wings' low-level weakness and limited flight separate from baseline speed. |
| Dwarf | 3 | Runic Carving | Rune configuration changes with ten minutes of work; it is not a permanently locked ancestry subchoice. Spark Off Your Skin adds 6 Stamina per echelon. |
| Wode Elf | 3 | Wode Elf Glamor | Swift sets base speed to 6. Use the source identity `wode-elf`; “wood elf” in older examples is not a second ancestry. |
| High Elf | 3 | High Elf Glamor | Distinguish identically named purchased traits from Wode Elf source entries. |
| Hakaan | 3 | Big! | Size 1L. Doomsight's negotiated encounter is a narrative/play contract, not a required date to finish creation. |
| Human | 3 | Detect the Supernatural | Staying Power adds two Recoveries. |
| Memonek | 4 | Fall Lightly; Lightweight | Lightning Nimbleness sets speed to 7. Lightweight changes effective size for forced movement, not actual size. |
| Orc | 3 | Relentless | Passionate Artisan selects two crafting skills, owned or unowned; selecting them does not grant those skills. |
| Polder | 4 | Small!; Shadowmeld | Size 1S. |
| Revenant | 2, or 3 at size 1S | Former Life; Tough But Withered | Former ancestry establishes size, not its other free traits. Start base speed at 5. Purchased Previous Life choices import only the permitted purchased trait. |
| Time Raider | 3 | Psychic Scar | Psionic Gift opens a signature-ability choice. Unstoppable Mind (2 points) is embedded in the parent trait section and must not disappear. |

Budgets are sourced in each ancestry's `<ancestry>-traits` entry, except Revenant's budget, which is
under [Tough But Withered](../vendor/steel-compendium/en/unified/md/feature/trait/revenant/tough-but-withered.md).
**Confirmed 2026-09-15 (Q-CHAR-10):** Unspent ancestry points warn without blocking completion.
Do not require spending the full budget or a separate acknowledgement gate. An otherwise complete
selection spending two of three points remains `complete` with a warning, consistently in UI/headless
results. Other missing required choices still matter, and over-budget selections remain invalid.
Later spending uses ordinary editing/review; no new in-play reserve is granted.
Do not invent a generic repeatable-trait purchase policy.

### Nested ancestry choices

- **Wyrmplate:** one type from acid, cold, corruption, fire, lightning, poison; immunity equals level;
  the type can change after a respite. **Prismatic Scales** retains its own selected immunity in
  addition to Wyrmplate's current one. No additive stacking of equal damage-immunity grants is inferred.
  [Wyrmplate](../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/wyrmplate.md),
  [Prismatic Scales](../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/prismatic-scales.md).
- **Runic Carving:** retain the feature independently of its current rune. Detection also needs its
  creature/object category; Voice's recipient is a play-time target. The feature permits one active
  rune and ten-minute changes/removal; do not require a recipient at creation.
  [Source](../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/runic-carving.md).
- **Passionate Artisan:** record two crafting-skill references for its project-roll modifier, without
  making ownership a prerequisite or adding them to known skills.
  [Source](../vendor/steel-compendium/en/unified/md/feature/trait/orc/passionate-artisan.md).
- **Previous Life, 1 Point:** repeatable with a different one-point trait from the former ancestry
  each time. Each occurrence needs a separate selection identity. **Previous Life, 2 Points:** one
  two-point purchased trait from that ancestry. Neither grants its signature trait or its whole budget.
  Changing former ancestry rechecks all these references and the budget.
  [Former Life](../vendor/steel-compendium/en/unified/md/feature/trait/revenant/former-life.md),
  [one-point](../vendor/steel-compendium/en/unified/md/feature/trait/revenant/previous-life-1-point.md),
  [two-point](../vendor/steel-compendium/en/unified/md/feature/trait/revenant/previous-life-2-points.md).
  Borrowing a trait that relies on an absent signature trait is Q-CHAR-7.
- **Psionic Gift:** one of Concussive Slam, Psionic Bolt or Minor Acceleration, not any signature
  ability in the corpus. The source section following Psionic Gift and its ability entries define the pool.
  [Source](../vendor/steel-compendium/en/unified/md/feature/trait/time-raider/psionic-gift.md).

## 5. Culture, skills, languages and careers

Culture is built from one environment, one organization and one upbringing, each supplying one skill
choice. It is independent of ancestry; typical ancestry cultures are suggestions. Source: Heroes
clean, **Culture Benefits**, and [Background](../vendor/steel-compendium/en/unified/md/chapter/background.md).

| Aspect | Option | Skill pool for its one choice |
| --- | --- | --- |
| Environment | Nomadic | Exploration or interpersonal |
| Environment | Rural | Crafting or lore |
| Environment | Secluded | Interpersonal or lore |
| Environment | Urban | Interpersonal or intrigue |
| Environment | Wilderness | Crafting or exploration |
| Organization | Bureaucratic | Interpersonal or intrigue |
| Organization | Communal | Crafting or exploration |
| Upbringing | Academic | Lore |
| Upbringing | Creative | Music, Perform, or crafting |
| Upbringing | Labor | Blacksmithing, Handle Animals, or exploration |
| Upbringing | Lawless | Intrigue |
| Upbringing | Martial | Blacksmithing, Fletching, Climb, Endurance, Ride, Intimidate, Alertness, Track, Monsters, Strategy |
| Upbringing | Noble | Interpersonal |

Each row's source is its [culture entry](research/v1-wizard-coverage-matrix.md#culture). A union of
groups is one pool, not one skill per group. Assembling core aspects and authoring a culture name
does not require introducing custom mechanical options.

Culture also supplies Caelian and the culture's language, plus contextual edges for recalling lore
about one's culture and influencing/interacting with its people. An ancestry choice alone does not
grant its typical language. The language pool needs book-section identities: this corpus has no
standalone language directory. Preserve named language references within the pinned Background chapter,
including its human-language list and Languages by Ancestry table, now preserved in the
[source matrix](research/v1-wizard-coverage-matrix.md#language-source-tables). Do not restrict languages to those
of the 12 playable ancestries. **Confirmed 2026-09-15 (Q-CHAR-6, language portion):** Custom
campaign languages are homebrew and deferred beyond V1, including when source text permits the
Director to invent them. Normal edits/approval do not enable custom selectable language identities.
Custom deity/domain portfolios are also deferred under Q-CHAR-6 (2026-09-15): they are unnecessary
for the narrow playtest and have no required custom-selection workflow in the current delivery
scope. Use printed supported combinations; later inclusion needs an explicit scope decision.
Legal deferred language slots follow section 2.

### Duplicate skills

If two sources grant the same specific skill, the source permits selecting another skill from any
group. Example: Warden and Fury both grant Nature; keep Nature once and create one unrestricted
replacement entitlement with both grant origins. Choosing the replacement does not erase the original
source's history. [Source: Choosing Skills](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md).

Resolve fixed grants before presenting unrestricted replacements. Do not silently lose a grant by
deduplicating a set. Nor should free choices be intentionally duplicated to manufacture unrestricted
choices without an established interpretation: fixed-versus-chosen collisions are Q-CHAR-11.
Skills selected as modifier targets (Passionate Artisan, Specialist) are not another skill grant.

### All career grants

Every career additionally includes its sourced perk choice and an inciting incident. The table below
transcribes the benefit sections; `—` means no grant in that section, not deletion of another source's
grant. Source links are in the [career matrix](research/v1-wizard-coverage-matrix.md#career).

| Career | Skills | Extra languages | Renown | Wealth | Project points | Perk group |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Agent | Sneak; 1 interpersonal; 1 other intrigue | 2 | — | — | — | Intrigue |
| Aristocrat | 1 interpersonal; 1 lore | 1 | +1 | +1 | — | Lore |
| Artisan | 2 crafting | 1 | — | — | 240 | Crafting |
| Beggar | Rumors; 1 exploration; 1 interpersonal | 2 | — | — | — | Interpersonal |
| Criminal | Criminal Underworld; 2 intrigue | 1 | — | — | 120 | Intrigue |
| Disciple | Religion; 2 other lore | — | — | — | 240 | Supernatural |
| Explorer | Navigate; 2 other exploration | 2 | — | — | — | Exploration |
| Farmer | Handle Animals; 2 exploration | 1 | — | — | 120 | Exploration |
| Gladiator | 2 exploration | 1 | +2 | — | — | Exploration |
| Laborer | Endurance; 2 crafting/exploration | 1 | — | — | 120 | Exploration |
| Mage's Apprentice | Magic; 2 other lore | 1 | +1 | — | — | Supernatural |
| Performer | Music or Perform; 2 other interpersonal | — | +2 | — | — | Interpersonal |
| Politician | 2 interpersonal | 1 | +1 | +1 | — | Interpersonal |
| Sage | 2 lore | 1 | — | — | 240 | Lore |
| Sailor | Swim; 2 other exploration | 2 | — | — | — | Exploration |
| Soldier | 1 exploration; 1 intrigue | 2 | +1 | — | — | Exploration |
| Warden | Nature; 1 exploration; 1 intrigue | 1 | — | — | 120 | Exploration |
| Watch Officer | Alertness; 2 other intrigue | 2 | — | — | — | Exploration |

An inciting incident can be chosen, rolled, or authored using the tables as inspiration. Narrative
authorship does not enable homebrew mechanics. Preserve the incident separately from the career's
automatic grants. [Source: Inciting Incident](../vendor/steel-compendium/en/unified/md/chapter/background.md).

Starting Renown is 0 and starting Wealth is 1 before career and other source adjustments. These
initial values do not reset on later career edits. Source: Heroes clean, **Career Benefits → Renown**
and **Wealth**.

Career project points may be divided between qualifying crafting/research projects once, with other
prerequisites still required. They are not free item picks or a renewable resource. Source: Heroes
clean, **Career Benefits → Project Points**. Their treatment with V1 downtime deferred needs the
bounded product choice Q-CHAR-9. Likewise, changing a career after play cannot repeatedly mint Wealth,
Renown or items; its initial grant and current state are different records.

## 6. Every core class

### Baseline statistics and characteristic assignment

The following values are from each class's **Basics** section, linked in the
[class matrix](research/v1-wizard-coverage-matrix.md#class-by-level-source-requirements).

| Class | Characteristics fixed at 2 initially | Stamina at level 1 | Added each later level | Recoveries | Class potency characteristic |
| --- | --- | ---: | ---: | ---: | --- |
| Censor | Might, Presence | 21 | 9 | 12 | Presence |
| Conduit | Intuition | 18 | 6 | 8 | Intuition |
| Elementalist | Reason | 18 | 6 | 8 | Reason |
| Fury | Might, Agility | 21 | 9 | 10 | Might |
| Null | Agility, Intuition | 21 | 9 | 8 | Intuition |
| Shadow | Agility | 18 | 6 | 8 | Agility |
| Tactician | Might, Reason | 21 | 9 | 10 | Reason |
| Talent | Reason, Presence | 18 | 6 | 8 | Reason |
| Troubadour | Agility, Presence | 18 | 6 | 8 | Presence |

With two fixed characteristics, assign one of `[2,-1,-1]`, `[1,1,-1]`, `[1,0,0]` to the remaining
three. With one fixed characteristic, assign one of `[2,2,-1,-1]`, `[2,1,1,-1]`, `[2,1,0,0]`,
`[1,1,1,0]` to the remaining four. Store assignment to named characteristics, not only the selected
array. All permutations of the selected multiset are represented without offering arbitrary point buy.

The class baseline is `startingStamina + (level - 1) × staminaPerLevel`. Add only applicable ancestry,
class-feature, kit, complication and item modifiers afterward. Base recovery value is
`floor(StaminaMaximum / 3)` before explicit recovery-value modifiers.
[Recovery source](../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md).
Echelons are 1 for levels 1–3, 2 for 4–6, 3 for 7–9, and 4 for 10.
[Echelon source](../vendor/steel-compendium/en/unified/md/rule/general/echelon.md).

**Source resolution, 2026-09-15 (Q-CHAR-12):** Class Basics supplies the potency characteristic.
The [Potencies rule](../vendor/steel-compendium/en/unified/md/rule/character/potency.md) explicitly says
its basis is determined by class; [Game of Exceptions](../vendor/steel-compendium/en/unified/md/chapter/the-basics.md)
makes that specific formula prevail over the general highest-characteristic wording. Apply explicit
feature overrides separately. For example, Conduit Intuition 2 with another characteristic 3 still
has baseline potencies 0/1/2. Forge's highest-characteristic calculation is a compatibility difference.
See [the independent review](research/remaining-character-questions-review.md#q-char-12).

### Level-one class decisions

Counts below are class-ability choices; automatic abilities, kit signatures and ancestry abilities
are additional. Every class chooses one 3-resource ability and one 5-resource ability at level 1.
Tactician's 5-Focus selection has its own
[source entry](../vendor/steel-compendium/en/unified/md/feature/tactician/level-1/5-focus-ability.md).

| Class | Branch | Class signature choices | Kit route | Additional decisions |
| --- | --- | ---: | --- | --- |
| Censor | Exorcist, Oracle, Paragon | 1 | 1 ordinary kit | Deity; 1 domain from its portfolio; domain's granted feature/skill. Order and domain are distinct. |
| Conduit | 2 domains from deity's portfolio | 2 | No generic kit grant | Choose which domain supplies the first feature/skill; 1 triggered action; 1 prayer; 1 ward. |
| Elementalist | Earth, Fire, Green, Void | 2 | No generic kit grant | 1 enchantment; 1 ward, including dependent parameters. Ordinary class ability choices can cross elemental specializations. |
| Fury | Berserker, Reaver, Stormwight | 1 | Berserker/Reaver: ordinary kit; Stormwight: Stormwight kit | Aspect's fixed skill and features; the kit branch depends on aspect. |
| Null | Chronokinetic, Cryokinetic, Metakinetic | 2 | No generic kit grant | 1 augmentation; tradition's restricted skill choice. |
| Shadow | Black Ash, Caustic Alchemy, Harlequin Mask | 1 | 1 ordinary kit | College's fixed skill and feature/triggered-action grants. |
| Tactician | Insurgent, Mastermind, Vanguard | 0 | 2 ordinary kits | Doctrine's restricted skill; choose between overlapping kit benefits. Both kit signature abilities are granted. |
| Talent | Chronopathy, Telekinesis, Telepathy | 2 | No generic kit grant | 1 augmentation; 1 ward. Ordinary class ability choices can cross talent traditions. |
| Troubadour | Auteur, Duelist, Virtuoso | 1 | 1 ordinary kit | Class act's fixed skill and granted performances. Active performance is a play choice, not another creation requirement. |

Sources: each `feature/<class>/level-1` branch/abilities entry in the index; especially
[Censor domains](../vendor/steel-compendium/en/unified/md/feature/censor/level-1/deity-and-domains.md),
[Conduit domains](../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/deity-and-domains.md),
[Elementalist abilities](../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/elementalist-abilities.md),
[Talent abilities](../vendor/steel-compendium/en/unified/md/feature/talent/level-1/talent-abilities.md),
[Fury aspect features](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/1st-level-aspect-features.md).
Seven named elements do not mean seven playable Elementalist subclasses; eight talent traditions
described in prose do not mean eight playable Talent subclasses.

Class skill grants and exact pools are preserved in each class's `sourceBasics.skills` in the JSON
index. Important nonuniform cases: Shadow grants Hide and Sneak plus five choices; Elementalist grants
Magic plus three; Troubadour grants Read Person plus two interpersonal choices and one intrigue/lore
choice. Apply fixed-skill collision handling instead of making fixed grants empty prompts.

### Prayer, enchantment, augmentation and ward pools

Each row is one choice at creation; later source-authorized change timing is separate. Exact source
entries are in the respective class's level-one feature directory and the JSON index.

| Choice | Pool |
| --- | --- |
| Conduit Prayer | Destruction, Distance, Soldier's Skill, Speed, Steel |
| Conduit Ward | Bastion, Quickness, Sanctuary, Spirit |
| Elementalist Enchantment | Battle, Celerity, Destruction, Distance, Permanence |
| Elementalist Ward | Delightful Consequences, Excellent Protection, Nature's Affection, Surprising Reactivity |
| Null Augmentation | Density, Force, Speed |
| Talent Augmentation | Battle, Density, Distance, Force, Speed |
| Talent Ward | Entropy, Repulsive, Steel, Vanishing |

Battle/Soldier's Skill options grant equipment-related benefits without a kit and explicitly cannot
be taken if the hero has a kit. Do not assume an unrestricted kit selector for all classes. Nor should
the absence of a generic kit grant prohibit an independently sourced future kit grant.

Ward of Excellent Protection lists acid, cold, corruption, fire, lightning, poison **or** sonic.
Research interpretation: select one listed damage type, with immunity equal to Reason; Forge likewise
models a nested choice. This is not immunity to every listed type. The full ward changes as its owning
Elementalist Ward rule permits, rather than independently changing damage type on every attack.
[Source](../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/ward-of-excellent-protection.md).

### Conduit domain progression

The 12 domain names are Creation, Death, Fate, Knowledge, Life, Love, Nature, Protection, Storm, Sun,
Trickery, War. A Conduit chooses two from the selected deity's portfolio, not any arbitrary two by
default. A Censor chooses one, separately from their order. Source religion entries and their portfolio
tables must be resolved; no hardcoded assumption that every deity offers every domain. The
[printed portfolios](research/v1-wizard-coverage-matrix.md#printed-deity-and-saint-portfolios) are
preserved explicitly. Do not require exactly four domains in a printed portfolio: Val has five,
while Pentalion the Paladin has Death and War. Following a saint does not automatically grant access
to every domain of their patron deity.

| Level | Conduit domain operation |
| --- | --- |
| 1 | Choose one of the selected pair; gain that domain's first feature and choose its granted skill. |
| 2 | Automatically gain the other domain's first feature and its skill choice; independently choose one of the two domains for the level-two domain ability. |
| 4 | Choose one of the pair for its level-four feature. |
| 5 | Automatically gain the other domain's level-four feature. |
| 6 | Choose one of the pair for the level-six domain ability. |
| 7 | Choose one of the pair for its level-seven feature. |
| 8 | Automatically gain the other domain's level-seven feature. |
| 9 | Choose one of the pair for the level-nine domain ability. |

The other-domain operation refers to the earlier choice for that feature tier. It must not always
use the complement of the level-one choice. Sources are the individual domain-feature/ability entries
at these levels; see [level two](../vendor/steel-compendium/en/unified/md/feature/conduit/level-2/2nd-level-domain-feature.md)
and [level five](../vendor/steel-compendium/en/unified/md/feature/conduit/level-5/5th-level-domain-feature.md).
Domain ability selections at 2, 6 and 9 are independent; alternating them is not required by the text.

### Advancement through all ten levels

The [90-row matrix](research/v1-wizard-coverage-matrix.md#class-by-level-source-requirements) preserves
the actual advancement tables and links every referenced feature through the JSON. Its ability
columns are cumulative inventories, not repeated grants on each transition.

Common schedules, checked against the individual class feature entries:

- Levels 3, 5 and 8 add one class heroic ability costing respectively 7, 9 and 11 resources.
- Levels 2, 6 and 9 normally add one branch-specific ability, chosen from the pair for the selected
  branch. Conduit instead chooses one domain's corresponding ability. Elementalist instead chooses
  a new 5-, 9- or 11-Essence ability, expressly allowing an unselected option from the earlier pool
  at levels 1, 5 or 8 respectively. Do not impose a selected-specialization filter on these choices.
- Every class grants one perk at 2, 4, 6, 8 and 10, and one skill at 4, 7 and 10. Perk pools differ:
  preserve the table below, rather than applying level-two restrictions forever.
- At level 4, two-primary classes set both primaries to 3. Conduit, Elementalist and Shadow set their
  primary to 3 and increase one characteristic by 1 to a maximum of 3.
- At level 7, every characteristic increases by 1 to a maximum of 4.
- At level 10, two-primary classes set both primaries to 5. Conduit, Elementalist and Shadow set their
  primary to 5 and increase one characteristic by 1 to a maximum of 5.

These operations occur at their recorded progression levels, not once per reevaluation. Individual
feature text controls replacements, caps and conditional benefits; this schedule does not replace
the other automatic features listed in the matrix.

| Class | Level 2 perk | Level 4 | Level 6 | Level 8 | Level 10 |
| --- | --- | --- | --- | --- | --- |
| Censor | Interpersonal/lore/supernatural | Any | Interpersonal/lore/supernatural | Any | Crafting/lore/supernatural |
| Conduit | Crafting/lore/supernatural | Any | Crafting/lore/supernatural | Any | Crafting/lore/supernatural |
| Elementalist | Crafting/lore/supernatural | Any | Crafting/lore/supernatural | Any | Crafting/lore/supernatural |
| Fury | Crafting/exploration/intrigue | Any | Crafting/exploration/intrigue | Any | Crafting/exploration/intrigue |
| Null | Exploration/interpersonal/intrigue | Any | Exploration/interpersonal/intrigue | Any | Exploration/interpersonal/intrigue |
| Shadow | Exploration/interpersonal/intrigue | Any | Any | Any | Any |
| Tactician | Exploration/interpersonal/intrigue | Any | Exploration/interpersonal/intrigue | Any | Exploration/interpersonal/intrigue |
| Talent | Interpersonal/lore/supernatural | Any | Interpersonal/lore/supernatural | Any | Interpersonal/lore/supernatural |
| Troubadour | Interpersonal/lore/supernatural | Any | Interpersonal/lore/supernatural | Any | Interpersonal/lore/supernatural |

Additional build choices must not be lost in that shared schedule. Troubadour selects an Invocation
at level 2, makes Melodrama choices at 4, and chooses one of its class act's two features at 5.
[Invocation](../vendor/steel-compendium/en/unified/md/feature/troubadour/level-2/invocation.md),
[Melodrama](../vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/melodrama.md),
[class-act feature](../vendor/steel-compendium/en/unified/md/feature/troubadour/level-5/5th-level-class-act-feature.md).
**Source-resolved interpretation, 2026-09-15 (Q-CHAR-8):** Each Melodrama choice may add a new event
or improve an already-owned event, including one gained with this feature. Both choices may improve
the same previously owned event for +2 drama; adding then improving a new event gives +1. Preserve
both choice identities and do not select the same new event twice. The source provides no distinct-target
or once-per-event restriction; this is a compositional reading, not a new user ruling. See
[the source and exception check](research/remaining-character-questions-review.md#q-char-8).

Other later features change the baseline or available configuration even without asking a creation
question. For example, Null's level-nine
[I Am the Weapon](../vendor/steel-compendium/en/unified/md/feature/null/level-9/i-am-the-weapon.md)
adds 21 Stamina, and Talent's level-seven
[Ancestral Memory](../vendor/steel-compendium/en/unified/md/feature/talent/level-7/ancestral-memory.md)
temporarily replaces owned skills after a respite. Neither can be modeled as a permanent generic
extra skill pick. The matrix's remaining feature-effect interpretation is still necessary work.

## 7. Kits, equipment and grant accounting

Ordinary kits: Arcane Archer, Battlemind, Cloak and Dagger, Dual Wielder, Guisarmier, Martial Artist,
Mountain, Panther, Pugilist, Raider, Ranger, Rapid-Fire, Retiarius, Shining Armor, Sniper, Spellsword,
Stick and Robe, Swashbuckler, Sword and Board, Warrior Priest, Whirlwind. Stormwight kits: Boren,
Corven, Raden, Vuken. Use the latter only where a feature grants that kit category.
[Kit entries](research/v1-wizard-coverage-matrix.md#kit),
[Beast Shape](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/beast-shape.md).

The extracted Stormwight kit records misleadingly carry `kit_type: Martial`; that metadata must not
place them in an ordinary kit choice pool. Their statistics are split into the Fury chapter's kit
sections. All four grant no armor and unarmed strikes. Their kit bonuses apply in true, animal and
hybrid form; aspect benefits are always available, with form-specific benefits added separately.
[Equipment](../vendor/steel-compendium/en/unified/md/feature/fury/stormwight-kits/equipment.md),
[bonus timing](../vendor/steel-compendium/en/unified/md/feature/fury/stormwight-kits/kit-bonuses.md),
[aspect/form distinction](../vendor/steel-compendium/en/unified/md/feature/fury/stormwight-kits/aspect-benefits-and-animal-form.md).

| Stormwight kit | Stamina per echelon | Speed bonus | Stability bonus | Melee damage tuple | Disengage bonus |
| --- | ---: | ---: | ---: | --- | ---: |
| [Boren](../vendor/steel-compendium/en/unified/md/feature/fury/boren/kit-bonuses.md) | 9 | — | 2 | +0/+0/+4 | — |
| [Corven](../vendor/steel-compendium/en/unified/md/feature/fury/corven/kit-bonuses.md) | 3 | 3 | — | +2/+2/+2 | 1 |
| [Raden](../vendor/steel-compendium/en/unified/md/feature/fury/raden/kit-bonuses.md) | 3 | 3 | — | +2/+2/+2 | 1 |
| [Vuken](../vendor/steel-compendium/en/unified/md/feature/fury/vuken/kit-bonuses.md) | 9 | 2 | — | +2/+2/+2 | 1 |

Kit Stamina scales by echelon; other bonuses retain their own formulas. Weapon damage bonuses are
three-tier tuples and apply to rolled damage with the required keywords. Distance bonuses do not
increase area size. A kit's signature already includes its kit damage/distance bonuses. Keep printed
values and included modifiers identifiable so evaluation cannot add those bonuses twice.
[Source: Kits](../vendor/steel-compendium/en/unified/md/chapter/kits.md).

Field Arsenal grants both kits' signature abilities. For overlapping benefits, choose one kit's
benefit and retain that selection until a respite permits changing it. A damage tuple is selected
whole; do not combine its best individual tiers. Replacing a signature's included kit bonus uses
the source's explicit subtraction/reapplication example:

`Battle Grace 5/8/11 − Martial Artist 2/2/2 + Mountain 0/0/4 = 3/6/13`.

These are the source's tier constants before adding the characteristic, not a completed attack's
damage. [Source: Field Arsenal](../vendor/steel-compendium/en/unified/md/feature/tactician/level-1/field-arsenal.md).

Ordinary adventuring gear and kit equipment do not require manually listing every mundane object.
Authoring a sword's appearance is not creating a custom mechanical item. Source:
[Adventuring Gear](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#adventuring-gear).
Actual treasure item instances use the inventory subsystem. In particular, a
[complication-granted trinket](../vendor/steel-compendium/en/unified/md/complication/amnesia.md)
must have a distinct grant identity, not appear anew after every save or history restoration.

Proposed initial-grant handling: evaluation emits a preview of grant intents. Activation applies
newly authorized initial grants once against current inventory/state, recording the grant origin.
Changing/removing the source after play creates a reviewable difference; the disposition of already
owned/spent rewards needs policy, rather than automatic duplication or silent deletion. The existing
inventory/history ownership and retained-inventory-on-rollback rules still apply.

## 8. Perks and complications are real build content

The 47 core perks and 100 complications are enumerated, not assumed interchangeable text blocks.
A build-complete implementation must interpret their permanent grants and required choices even
when the resulting gameplay effect remains manual. A few concrete structural cases:

| Source | Decision/model consequence |
| --- | --- |
| [Area of Expertise](../vendor/steel-compendium/en/unified/md/perk/area-of-expertise.md) | Choose a crafting skill already owned; it is a modifier target, not another skill grant. |
| [Specialist](../vendor/steel-compendium/en/unified/md/perk/specialist.md) | Choose an owned lore skill; its conditional Renown treatment is not a permanent Renown increase. |
| [Linguist](../vendor/steel-compendium/en/unified/md/perk/linguist.md) | Two new languages with a prior-exposure condition. A source condition needing narrative input must be visible. |
| [Eidetic Memory](../vendor/steel-compendium/en/unified/md/perk/eidetic-memory.md) | A lore skill chosen after a respite lasts until the next respite; preserve it as temporary configuration. |
| [Familiar](../vendor/steel-compendium/en/unified/md/perk/familiar.md) | Grant readable feature/creature information. This does not authorize the deferred playable-friendly-creature subsystem. |
| [Promising Apprentice](../vendor/steel-compendium/en/unified/md/complication/promising-apprentice.md) | Grants a crafting skill, then selects an owned crafting skill for a modifier. Those need not be the same decision. |
| [Shipwrecked](../vendor/steel-compendium/en/unified/md/complication/shipwrecked.md) | Two exploration skills and removal of one known language. Represent the drawback; do not count only positive grants. |
| [Shared Spirit](../vendor/steel-compendium/en/unified/md/complication/shared-spirit.md) | Select three owned skills and three new skills; the available set depends on who controls the body. Do not grant both sets unconditionally. |
| [Elemental Inside](../vendor/steel-compendium/en/unified/md/complication/elemental-inside.md) | Adds 3 Stamina at levels 1, 4, 7 and 10. Keep its control-related drawback as a separate sourced effect. |
| [Wodewalker](../vendor/steel-compendium/en/unified/md/complication/wodewalker.md) | Adds the highest characteristic to recovery value after its baseline calculation. |
| [Primordial Sickness](../vendor/steel-compendium/en/unified/md/complication/primordial-sickness.md) | Permanently reduces the number of Recoveries by one. |
| [Amnesia](../vendor/steel-compendium/en/unified/md/complication/amnesia.md) / [Secret Twin](../vendor/steel-compendium/en/unified/md/complication/secret-twin.md) | Choose a first-echelon trinket, with an inventory grant applied once. |
| [Strange Inheritance](../vendor/steel-compendium/en/unified/md/complication/strange-inheritance.md) | The Director chooses the trinket and its identity/powers can be unknown. The owner must not be forced to pick it or gain an unauthorized preview. |

All benefits and drawbacks remain visible, subject to established audience rules. A requirement
that the Director supply an option is a different decision actor from owner build editing; represent
the source-required input without transferring general control of the character's build. Exact
secret-item review interaction and starting reward reconciliation need owning inventory/access contracts.

## 9. Higher-level creation, advancement and revision safety

Proposed higher-level creation uses the same definitions as sequential advancement: resolve level-one
foundations, then each transition through the target level. Summarize automatic grants and show only
decisions requiring input. Never manufacture historical gameplay, earned XP, spent resources or prior
inventory for a newly created higher-level hero. Record the constructed build sequence as creation
history, distinguishable from levels earned in play.

Standard source advancement uses cumulative XP: thresholds for levels 1–10 are
`0,16,32,48,64,80,96,112,128,144`, with level gain during the respite that supplies sufficient XP.
Alternative advancement is expressly allowed by the source; availability in our app remains a
product choice. [Source: Heroic Advancement](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#heroic-advancement).
Do not equate choosing a creation target level with authority to award an existing character a level.
**Confirmed 2026-09-15 (Q-CHAR-3):** The campaign awards XP; the character sheet evaluates eligibility
and owns the scoped level-up choices/activation. A transfer starts campaign XP at zero with a separate
eligibility offset equal to the admitted effective level's minimum standard threshold. Level seven:
offset 96 plus 16 newly earned campaign XP reaches level eight at 112. Keep that admission offset
fixed as campaign XP accumulates; do not re-add it or reset XP on each level-up. Awarding XP alone
does not select choices or activate a new build. Preserve source respite timing and existing locks;
all level-up operations have shared UI/headless paths. See [the owning level-up policy](character-wizard-spec.md#level-up).
The respite/V08 handoff must use this confirmed policy; implementation is not claimed here.

Source starting treasure guidance for campaigns beginning above level one is discretionary (“can
give”), not an automatic treasure grant implied by changing the level selector. Source: Heroes clean,
**For the Director → Treasures Above 1st Level**. A proposed campaign starting-treasure allowance can
use that guidance, with owner choices and ordinary admission review; whether to include that workflow
is Q-CHAR-13. Existing starting-equipment scope does not by itself answer it.

### Source-authorized reconfiguration versus full edit

The source permits changing kits, various wards/prayers/augmentations, and other specifically named
choices at respite; it also gives examples of changing options for fun between sessions and an
optional respite ability-change rule. These are different from a scoped level-up. Keep the source
permission with each decision. **Confirmed 2026-09-15 (Q-CHAR-5):** Language changes, including
filling a deferred slot, use normal edits with existing Director approval. Kit swaps use a dedicated,
logged respite activity without separate full-edit approval, retaining source eligibility/activity
cost and shared UI/headless behavior. Kits remain editable in the regular character editor with
normal Director approval outside that respite path. No blanket exception was approved for prayers, wards or other
class changes; those remain under existing full-edit policy until their specific respite workflow
is settled. Do not silently enable the optional rule for all campaigns. See
[the owning workflow](character-wizard-spec.md#language-edits-and-respite-kit-changes). [Changing Character Options](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#changing-character-options).

### Revision activation proposal

Every proposed build references its base effective revision. Approval applies the exact evaluated
proposal only if ownership, campaign attachment, Director authority, content permission and base
revision still match. A scoped level-up or another activation makes an older full edit stale.
Return a comparison and require reconciliation/resubmission; never overwrite intervening build changes.
Apply against current live state and inventory, not the snapshot taken when drafting began.

Restoring a build retains current inventory and authored details, preserves later build records and
follows existing campaign review. **Confirmed 2026-09-15 (Q-CHAR-4):** Every finalized edit appends
a build snapshot. Restoring a historical build appends its snapshot as a new latest revision and
records the source revision; it preserves every intervening entry. New choices continue from that
new latest revision. Returning to an old higher-level build likewise adds a new entry. Previewing
history alone makes no finalized revision, and pending revisions do not activate themselves.
See [progression history](character-wizard-spec.md#5-progression-history). Shared UI/headless
operations must preserve these semantics without requiring Git storage or branching UI.

**Confirmed 2026-09-15 (Q-CHAR-2):** Maximum increases leave compatible current values unchanged;
a lower maximum caps any current value above it. Stamina 20/30 becomes 20/36, not 26/36. See
[the owning policy](character-wizard-spec.md#current-values-when-a-build-changes). Replaced resource
types require explicit reconciliation without an invented conversion. Apply against current live
state atomically; source-defined restoration remains separate. A preview alone does not activate a build.

## 10. Representative acceptance examples

These are source-established expectations for future evaluator/application checks, not tests claimed
to pass. Fixtures must specify every relevant selection and state assumption.

| Case | Expected result |
| --- | --- |
| Devil budget | Impressive Horns (2) + Beast Legs (1) costs 3; Impressive Horns (2) + Wings (2) exceeds 3. Speed from Beast Legs is 6 before kit modifiers. |
| Former Polder Revenant | Size 1S, base speed 5, three points; Bloodless (2) + Undead Influence (1) fits. Shadowmeld is not automatically inherited. |
| Former Devil Revenant | Base speed 5, two points; Previous Life (1) selecting Beast Legs sets speed 6. Silver Tongue is not inherited. |
| Time Raider coverage | Unstoppable Mind is available for two points although it has no standalone trait file. Psionic Gift selects Concussive Slam, Psionic Bolt or Minor Acceleration, not an arbitrary class's signatures. |
| Culture independence | A Dwarf with urban/communal/academic culture receives the three actual aspect pools; no forced Dwarf culture or language. |
| Fixed Nature collision | Warden + Fury produces Nature once and an unrestricted replacement selection, preserving two grant origins. |
| Deferred language | Saving/reloading a deliberately deferred language preserves its entitlement and does not grant a guessed language. |
| Conduit progression | Choose Life/Protection, Life feature first: level two grants Protection's first feature/skill automatically. A level-four Protection choice causes level five to grant Life's level-four feature. |
| Printed religion portfolio | Adûn permits the Life/Protection pair; Pentalion the Paladin offers Death/War. Val's five-domain portfolio is preserved, without changing the number of domains the class selects. |
| Elementalist ability pool | A level-two Elementalist may choose an unselected level-one 5-Essence ability; subclass affinity alone does not exclude it. |
| Tactician overlapping kits | Martial Artist + Mountain grants both signatures; choosing Mountain's damage tuple gives Battle Grace source constants 3/6/13, not 5/8/15 or a tuple assembled tier by tier. |
| Stormwight extraction | Boren's missing inline bonus fields do not mean zero bonuses: its Fury section supplies +9 Stamina per echelon and +2 stability. Its Martial metadata does not make it an ordinary Tactician kit option. |
| Restricted perk progression | Censor level-ten perk offers crafting/lore/supernatural; Shadow level-six perk is unrestricted. Do not copy each class's level-two pool to every level. |
| Baseline contribution example | Level-one Dwarf Censor + Spark Off Your Skin + Shining Armor, with no other Stamina/recovery modifiers: maximum 21+6+12=39, recovery value 13, Recoveries 12. At level four those same contributions are 48+12+24=84, recovery value 28. Other selected level-four features must be specified before treating this as a whole-sheet fixture. |
| Source-specific fixed bonus | Null level nine includes I Am the Weapon's +21 in addition to ordinary class-level growth and its selected augmentation. |
| Complication drawbacks | Primordial Sickness decreases Recoveries; Shipwrecked removes a known language. Neither is only a positive feature card. |
| Repeated evaluation | Save, reload and recompute an Amnesia character repeatedly; exactly one authorized initial trinket grant persists. Restoring a progression point does not grant another. |
| Exact approval | A pending edit based on revision A cannot overwrite a level-up to B. The reviewer sees an explicit stale proposal, with current live state unchanged. |
| Higher-level creation | Creating at level seven records the required earlier selections without fabricated encounters or earned campaign XP. Lowering the draft target level removes later contributions from its preview. |
| Skill-target dependency | Removing the only source of an Area of Expertise target skill invalidates that perk's parameter; it cannot keep silently applying. |
| Content exclusion | Beastheart/Summoner options do not become selectable because their files or imported IDs exist. |

Coverage requirements extend beyond one fixture per class. Exercise all 12 ancestry budgets and special
parameters; every class branch and domain; each level transition; ordinary and Stormwight kits;
characteristic/echelon boundaries at 3→4, 6→7 and 9→10; and every perk/complication creation effect.
Use dependency-based combinations (for example Revenant × former ancestry, kit × overlapping bonuses,
perk × owned skill) rather than claiming exhaustive coverage from a few attractive sample heroes.

For each source option, record whether its choices, automatic grants and baseline effects have an
implemented and verified path. Gameplay automation can have separate unsupported status. A class-level
row is complete only when all its legal branches and applicable dependencies are accounted for.

## 11. Remaining work and review handoff

Research completed here: all core option/level inventory; shared creation semantics; ancestry budgets
and important nested choices; all culture pools and career benefit summaries; nine class baselines,
major level-one branches and shared progression schedules; kit composition; bounded perk/complication
examples; proposed navigation, evaluation and revision contracts.

Still required before a complete V1 builder:

1. Map each actual class/domain/ancestry ability choice to its exact option SCCs and source sections;
   turn the source matrix into executable normalized definitions with explicit grants and conditions.
2. Complete semantic review of every later class feature, all 47 perks and 100 complications, including
   item grants, secret Director inputs and permanent versus conditional modifiers. They are indexed,
   not all individually interpreted by this pass.
3. Resolve the questions below before their dependent behavior is activated. Coordinate XP/rest,
   inventory and privacy decisions with their owning threads; do not settle those subsystem contracts
   indirectly through the wizard UI.
4. Build and independently verify the evaluator, then UI/headless persistence, review, history and import.
   Existing V08 and V09 remain implementation work; this document is not their completion record.

The [question queue](rules-questions-for-user.md) contains Q-CHAR-2 through Q-CHAR-13 with source evidence
and recommendations. The main shared product decisions are resource reconciliation, transferred XP,
editing after rollback and source-authorized reconfiguration. Bounded content questions are kept
separate so an answer about one trait is not silently applied to all ancestry choices.
