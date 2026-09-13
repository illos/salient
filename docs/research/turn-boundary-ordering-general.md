# Turn-boundary ordering: general rules search

Research date: 2026-09-12. Source: pinned local Steel Compendium only, revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. No online research or external Draw Steel sources used.
This report records source findings and interpretation limits; it selects no application policy.

## Finding

The searched core Compendium establishes **several scoped ordering rules**, but this pass did not find
a blanket ordering rule for independent effects that occur at the same turn or round boundary. In
particular, it did not find a general instruction to resolve saves before damage, expire protections
before damage, let the active creature choose every ordering, or let the Director choose every ordering.

There **is** an explicit general adjudication rule: a specific exception beats a general rule, and the
Director has final say in rules adjudication. That supports resolving genuinely uncovered cases through
adjudication. It does not erase ordering expressly assigned elsewhere to the players or the ability user.

This is a bounded negative finding about the inspected corpus, not proof that no wording could have
been missed, and not a claim about sources outside this pin.

## Positive source evidence and its scope

| Rule | Source and short excerpt | What it establishes; what it does not |
| --- | --- | --- |
| Specific exceptions and adjudication | [The Basics — Game of Exceptions](../../vendor/steel-compendium/en/unified/md/chapter/the-basics.md#game-of-exceptions), SCC `mcdm.heroes.v1/chapter/the-basics`, line 74: “a specific exception always beats a more general rule”; “The Director has the final say in how rules are adjudicated.” | Explicit exception priority and final adjudication authority. No predetermined simultaneous-effect queue or universal order-selection procedure. |
| Multiple triggered actions sharing one trigger | [Triggered Actions and Free Triggered Actions](../../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md), SCC `mcdm.heroes.v1/rule.combat/triggered-action`, line 11: “decide among themselves which of those triggered actions are resolved first. Then the Director decides the same for creatures they control.” | Heroes and other player-controlled creatures choose their triggered/free-triggered actions' order first; Director-controlled creatures follow. The paragraph expressly concerns triggered actions responding to the same trigger. Ordinary saves, passive traits and expiry are not thereby turned into triggered actions. |
| Effects of one ability | [Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md), SCC `mcdm.heroes.v1/rule.dice/ability-roll`, line 49: “If an ability creates multiple effects, those effects resolve in the order in which they are presented.” | Printed order for the effects created by that ability. Same paragraph ordinarily puts tier-determined effects after power-roll damage has been dealt to all targets. It supplies no order between separate abilities, traits, duration expiry and general saving throws. |
| Several targets force moved by one ability | [Forced Movement — Moving Multiple Creatures](../../vendor/steel-compendium/en/unified/md/movement/forced-movement.md), SCC `mcdm.heroes.v1/movement/forced-movement`, line 19: “the creature using the ability determines the order in which the targets are force moved.” | Each target's movement completes before the next; explicit contrary ability text can override. This is a spatial resolution rule, not a turn-boundary tie-breaker. |
| Individual turns and round boundary | [Combat Round](../../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md), SCC `mcdm.heroes.v1/rule.combat/combat-round`; [Taking a Turn](../../vendor/steel-compendium/en/unified/md/rule/combat/turn.md), SCC `mcdm.heroes.v1/rule.combat/turn`. | Defines individual turns, alternating sides, successive enemy-group member turns and a new round after everyone acts. Taking a Turn allows main action/maneuver order choices and split movement. Neither passage supplies a general start/end-of-turn effect-order procedure. |
| Duration clauses | [Classes — Ending Effects](../../vendor/steel-compendium/en/unified/md/chapter/classes.md#ending-effects), SCC `mcdm.heroes.v1/chapter/classes`: “whatever ability, feature, hazard, or other mechanic imposed the effect specifies how long the effect lasts.” | Duration comes from the imposing mechanic. The neighboring stacking rule uses the most recent application for duration of the same ability, but does not order unrelated effects that end together. |
| EoT | [End of Next Turn](../../vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md), SCC `mcdm.heroes.v1/rule.combat/end-of-turn`, line 7: “or the end of their current turn if the effect was imposed on their current turn.” | EoT has an explicit current-turn case. This is not a statement that all newly registered boundary work is immediately eligible, nor a relative ordering rule against saves or damage. |
| Save ends | [Saving Throw](../../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md), SCC `mcdm.heroes.v1/rule.general/saving-throw`: “makes a saving throw at the end of each of their turns”; “On a 6 or higher, the effect ends.” | Establishes save timing, d10 resolution and success. No before/after relationship to every other end-turn effect is specified here. |
| Monster End Effect | [End Effect](../../vendor/steel-compendium/en/unified/md/rule/monster/end-effect.md), SCC `mcdm.monsters.v1/rule.monster/end-effect`: “take damage in order to end one effect”; damage “can't be reduced in any way.” | Explains the special option. Individual stat blocks supply timing and cost. The general rule neither replaces ordinary saves nor says which resolves first at a shared boundary. |
| Villain actions | [Villain Action](../../vendor/steel-compendium/en/unified/md/rule/monster/villain-action.md), SCC `mcdm.monsters.v1/rule.monster/villain-action`, line 11: “at the end of any other creature's turn”; numbered actions can be used “in any order you choose.” | Their numbering is a suggested encounter arc. This does not say that a villain action always precedes or follows every other event at the chosen turn end. |

## Concrete boundary questions still uncovered by these general rules

These cases were cross-checked against the stat blocks during this pass. The general passages above
do not settle their relative order:

- **Human Bandit Chief: ordinary save versus End Effect.** The chief can take damage at their own turn
  end to end a save-ends effect. A save at that same turn end might remove the effect without payment.
  No general save-first or End-Effect-first requirement was found. Source:
  [Human Bandit Chief](../../vendor/steel-compendium/en/unified/md/monster/human/statblock/human-bandit-chief.md),
  SCC `mcdm.monsters.v1/monster.human.statblock/human-bandit-chief`, plus Saving Throw and End Effect above.
- **Wet: consequence versus removal.** The angulotl general wet rule makes a non-angulotl who is wet
  and ends their turn with no movement remaining fall prone. Where the imposed wet effect is save ends,
  save timing overlaps that consequence. The general save rule does not say whether to recheck wet
  after a successful save or apply the consequence from the pre-save state. Source:
  [Angulotl](../../vendor/steel-compendium/en/unified/md/monster/group/angulotl.md),
  SCC `mcdm.monsters.v1/monster.group/angulotl`, and the relevant wet-imposing ability's own text.
- **Essence of Tides: a save-ends effect first imposed at turn end.** Convocation of Waves' Malice
  stream slows an eligible enemy who ends their turn in it. The general save rule says end of each
  turn, without explicitly defining whether the newly applied effect gets a save during that same
  boundary. EoT's special current-turn wording is for a different duration type and does not settle
  this. Source: [Essence of Tides](../../vendor/steel-compendium/en/unified/md/monster/elemental/statblock/essence-of-tides.md),
  SCC `mcdm.monsters.v1/monster.elemental.statblock/essence-of-tides`.

There is a related distinction in the accepted product discussion: allowing a failed-save hero-token
control until another participant starts their turn is an **app convention**. The source gives the
benefit when a save fails and limits use to one hero-token benefit per turn or test; it does not specify
that deferred interface window. Source: [Hero Tokens](../../vendor/steel-compendium/en/unified/md/rule/resource/hero-token.md),
SCC `mcdm.heroes.v1/rule.resource/hero-token`. This does not reopen that accepted choice; it prevents the
window from being presented as a source timing rule.

## Search coverage and recovery of source context

1. Read the project instructions and Compendium navigation guide. Confirmed the local Git revision.
2. Searched unified `rule/` and `chapter/` text for simultaneous events, same-time events, timing,
   order of effects, resolution before/after, and start/end turn/round clauses.
3. Performed a broader scan across **core Heroes/Monsters SCC entries** throughout unified Markdown,
   stripping Markdown links before matching. This avoids missing natural-language phrases separated
   by long SCC link markup. Search terms included `simultaneous`, `at the same time`, `order of`,
   `order in which`, nearby `effect`/`order` pairs, and `timing`.
4. Searched book-specific Heroes and Monsters Markdown directly through local Git objects, including
   same-time/ordering language, first/before/after in relation to saving throws, and rules-conflict
   phrasing. No checkout expansion, vendor edit or pin update occurred.
5. Read the surrounding general sections: The Basics' Game of Exceptions; Classes' ability use,
   stacking and ending effects; the glossary; Combat Round, Taking a Turn and triggered actions;
   Saving Throw, EoT, End Effect, Malice and villain actions; Monster Basics' relevant general
   paragraphs, including minion simultaneous attacks and round-based objectives. The minion rules
   resolve their own shared-action/aggregation cases, not arbitrary clock events.
6. Recovered source order from local
   `en/books/heroes/clean/Draw Steel Heroes.md` using `git show`: Game of Exceptions (lines 790–794),
   ability-roll effects (line 4261), stacking/ending effects and save duration (approximately
   4366–4386), and combat round/turn/triggered-action context (approximately 19685–19751).
   The clean source and split entries are two representations of the same corpus, not independent
   corroborating publications. Monsters' local book-specific `md/chapter/monster-basics.md` was also
   inspected; no Monsters clean full-book file is present in this pinned Git tree.

Representative reproducible commands (run from the repository root):

```bash
rg -n -i 'simultaneous|same time|order|timing' vendor/steel-compendium/en/unified/md/rule
git -C vendor/steel-compendium grep -n -i -E 'simultaneous|timing' HEAD -- en/books/heroes/md en/books/monsters/md
git -C vendor/steel-compendium show 'HEAD:en/books/heroes/clean/Draw Steel Heroes.md'
git -C vendor/steel-compendium show HEAD:en/books/monsters/md/chapter/monster-basics.md
```

The answer supported by this pass is therefore: **apply the scoped ordering rules where they actually
apply; independent boundary collisions remain uncertain where no particular source specifies order.**
The Director's final adjudication authority is explicit, while any automated fallback or ordering-card
workflow remains a product decision.
