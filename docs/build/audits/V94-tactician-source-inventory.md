# V94 Tactician level-one source inventory

Independent source audit by WIZARD.2 delegated source reader, 2026-09-20. This is not an
implementation verdict. Only pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`
was used. Paths below are relative to `vendor/steel-compendium/en/unified/md/`.

## Confirmed baseline and inventory

`class/tactician.md`, Basics: Might 2 and Reason 2; the remaining characteristics use one of
`2, -1, -1`, `1, 1, -1`, or `1, 0, 0`; starting Stamina 21; 10 Recoveries; potency Reason minus
2, Reason minus 1, Reason (0/1/2 at Reason 2). Lead is fixed; choose two from Alertness,
Architecture, Blacksmithing, Brag, Culture, Empathize, Fletching, Mechanics, Monsters, Search,
Strategy, or exploration skills. Fixed duplicate grants retain the unrestricted replacement
rule in `chapter/making-a-hero.md`, Choosing Skills.

`feature/tactician/level-1/tactical-doctrine.md`, `1st-level-doctrine-feature.md`, and
`doctrine-triggered-action.md` establish:

| Doctrine | One chosen skill from | Feature | Triggered action |
| --- | --- | --- | --- |
| Insurgent | Intrigue | Covert Operations | Advanced Tactics |
| Mastermind | Lore | Studied Commander | Overwatch |
| Vanguard | Interpersonal | Commanding Presence | Parry |

The directory `feature/tactician/level-1/` contains thirteen feature files:
1st-Level Doctrine Feature; 5-Focus Ability; Commanding Presence; Covert Operations; Doctrine
Triggered Action; Field Arsenal; Focus; Kit Signature Ability; Mark; Strike Now; Studied
Commander; Tactical Doctrine; Tactician Abilities. This is a source-file inventory, not thirteen
simultaneous grants to every character.

The directory `feature/ability/tactician/level-1/` contains thirteen abilities:

| Grant or choice | Names | Mandatory cost |
| --- | --- | --- |
| Choose one | Battle Cry; Concussive Strike; Inspiring Strike; Squad! Forward! | 3 Focus |
| Choose one | Hammer and Anvil; Mind Game; Now!; This Is What We Planned For | 5 Focus |
| Automatic | Mark; "Strike Now!" | None |
| Doctrine | Advanced Tactics; Overwatch; Parry | None |

Membership and costs are confirmed by each ability's frontmatter and by
`feature/tactician/level-1/tactician-abilities.md` and `5-focus-ability.md`. No class signature
choice exists; each kit grants its signature, usable at will (`kit-signature-ability.md`).
All three doctrine triggered actions have optional Spend 1 Focus effects. "Strike Now!" has
an optional Spend 5 Focus effect; its normal main action is free of resource cost. Mark is a
maneuver with additional free triggered effects described below.

## Field Arsenal

`feature/tactician/level-1/field-arsenal.md` grants two kits and both signatures. It explicitly
says to take one or the other when both kits grant the same benefit, retaining that choice until
a respite. The parenthetical says this usually means the higher bonus: it does not mandate maxima.
The Martial Artist/Mountain example explicitly replaces the whole melee damage tuple, not
individual tiers: Battle Grace 5/8/11 minus 2/2/2 plus 0/0/4 becomes 3/6/13.

The eight numerical benefit categories in the design agree with the Kits table in
`chapter/kits.md`. A benefit supplied only by one kit is retained. Equal overlapping values
must not stack. Omitting a redundant equal-value choice is an interface interpretation, not
an explicit source exception to choosing a supplying kit; retain deterministic provenance and
do not describe it as a quoted rule. Treating the whole damage tuple as one benefit is directly
supported by the example; taking a tier-by-tier maximum would contradict that example.

The printed Shining Armor/Sniper example yields Stamina +12/echelon, stability +1, melee damage
+2/+2/+2, ranged damage +0/+0/+4, speed +1, ranged distance +10, disengage +1, and Protective
Attack plus Patient Shot. There is no overlapping numerical category in that pair.

`chapter/kits.md`, Kit Signature Ability, says both damage and distance already include the
originating kit's bonuses. Replacement documentation must therefore cover distance as well as
damage when the resolved arsenal differs. Merely keeping printed numbers is not the resulting
rules value: any deferred rewrite must remain visibly manual with the correct adjustment.

Ordinary-kit access follows Field Arsenal and Chapter 6. Excluding Stormwight kits is the
existing project interpretation; their explicit access grant is
`feature/fury/level-1/beast-shape.md`.

## Required clarifications to the initial design

- Studied Commander is not only a passive feature. Its source grants a Reason-test respite
  activity when the hero has at least 24 hours and a clue or rumor about the upcoming encounter
  or negotiation; use is limited to once for that encounter or negotiation. Combat outcomes give
  creature count, count and level, or that information plus surprised enemies. Negotiation
  outcomes give three candidate motivations, one actual motivation, or that motivation plus
  influence-test edges. The separate war/battle Discover Lore discount is passive. Preserve the
  activity as an available manual action/route or explicitly record the incomplete delivery;
  “no new discrete action” is inaccurate (`feature/tactician/level-1/studied-commander.md`).
- Mark's full body includes material missing from its frontmatter effects: initially one target;
  line-of-effect edges; and a 1-Focus free triggered choice on rolled damage against a marked
  creature (extra damage twice Reason, Recovery, shift Reason, or conditional melee taunt).
  It also permits free-triggered retargeting when the marked creature reaches zero Stamina.
  Preserve the full text and manual boundaries (`feature/ability/tactician/level-1/mark.md`).
- Focus outside combat applies to abilities and effects. Reuse of the same costly ability/effect
  is blocked until earning one or more Victories or finishing a respite. Unlimited-spend effects
  use current Victories as the amount. “Once per Victory or respite” is imprecise
  (`feature/tactician/level-1/focus.md`, Focus Outside of Combat).

No evaluator, generated output, Forge output, or tests were used to derive these findings.
