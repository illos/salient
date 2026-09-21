# V101 Fury level-one independent source inventory

ENGINE, 2026-09-21. Source audit only, from base `53b7853`; no implementation verdict or tests.
Authority: Steel Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`.
All source paths below are relative to `vendor/steel-compendium/en/unified/md/`.

## Baseline and choices

`class/fury.md`: Might2/Agility2 fixed; assign Reason/Intuition/Presence from 2,-1,-1;
1,1,-1; or1,0,0. Starting Stamina21, recoveries10; potency Might−2/−1/Might =0/1/2.
Nature fixed skill plus two Exploration/Intrigue skills. One aspect, one signature of4,
one3-Ferocity ability of4, one5-Ferocity ability of4. Aspect grants its trigger, not a free
choice among all three. No level2 aspect ability is granted at level1.

`feature/fury/level-1/primordial-aspect.md`, `1st-level-aspect-features.md`,
`aspect-triggered-action.md`:

| Aspect | Skill | Features | Trigger |
| --- | --- | --- | --- |
| Berserker | Lift | Kit; Primordial Strength | Lines of Force |
| Reaver | Hide | Kit; Primordial Cunning | Unearthly Reflexes |
| Stormwight | Track | Beast Shape; Relentless Hunter | Furious Change |

Berserker/Reaver choose one ordinary kit; Stormwight selects one of Boren/Corven/Raden/Vuken
through Beast Shape. Prevent stale ordinary-kit or second-kit grants after aspect changes.
Stormwight's kit bonuses remain available in true, animal and hybrid forms; forms do not grant
a second kit. All Fury have Mighty Leaps (Might jump tests minimum tier2); Relentless Hunter
is specifically Stormwight's Track-test edge.

## Source ability inventory

15 files in `feature/ability/fury/level-1/`:

- Signatures: Brutal Slam; Hit and Run; Impaled!; To the Death!
- 3 Ferocity: Back!; Out of the Way!; Tide of Death; Your Entrails Are Your Extrails!
- 5 Ferocity: Blood for Blood!; Make Peace With Your God!; Thunder Roar; To the Uttermost End.
- Aspect triggers: Lines of Force; Unearthly Reflexes; Furious Change.

Also `feature/ability/fury/stormwight-kits/aspect-of-the-wild.md` and four kit-embedded signatures
in `kit/boren.md`, `kit/corven.md`, `kit/raden.md`, `kit/vuken.md`: 20 source ability envelopes
across the full Fury/Stormwight inventory, before other ordinary-kit signatures and embedded uses.
A Stormwight build normally has six such abilities: three selected Fury abilities, Furious Change,
Aspect of the Wild, and its kit signature. Ordinary-aspect builds have four Fury abilities plus
the ordinary-kit signature. These counts exclude common actions and ancestry grants.

## Stormwight kit statistics and signatures

Sources: `feature/fury/{boren,corven,raden,vuken}/kit-bonuses.md` and respective `kit/*.md`.
All values below are first-echelon kit additions, not complete ancestry statistics.

| Kit | Stamina | Speed | Stability | Disengage | Melee damage tiers | Signature | Storm type |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Boren | +9 | — | +2 | — | +0/+0/+4 | Bear Claws | cold |
| Corven | +3 | +3 | — | +1 | +2/+2/+2 | Wing Buffet | fire |
| Raden | +3 | +3 | — | +1 | +2/+2/+2 | Driving Pounce | corruption |
| Vuken | +9 | +2 | — | +1 | +2/+2/+2 | Unbalancing Attack | lightning |

Source for each storm type: its `primordial-storm-*.md`. A storm damage type is not a universal
conversion of all the character's damage. Stormwight equipment is no armor/unarmed strikes
(`feature/fury/stormwight-kits/equipment.md`).

`chapter/kits.md#Kit Signature Ability` explicitly includes kit damage/distance bonuses in
printed kit signatures. At M=A2, expected signature damage is Bear Claws4/7/13, Wing Buffet3/6/8,
Driving Pounce6/9/11, Unbalancing Attack6/9/11. Do not add kit bonuses again. Conversely, the kit
bonus applies to ordinary Fury Melee+Weapon damage, including non-Strike area abilities Back!,
Thunder Roar and Tide of Death; the general rule does not require Strike.

## Always-available aspect benefits versus form benefits

`feature/fury/stormwight-kits/aspect-benefits-and-animal-form.md` distinguishes these explicitly.

- Boren aspect: may replace push with pull; when pulling a creature adjacent with M<AVERAGE,
  may Grab it with a free triggered action. Bear animal AND hybrid: size2, +1 Melee Weapon
  distance. Hybrid temporary Stamina is level4, not level1.
- Corven aspect: edge on hide/sneak tests; whenever falling, may use Aspect of the Wild as a
  free triggered action. Crow animal: size1T, fly, free-maneuver Hide, allies as cover;
  no abilities except Aspect of the Wild. Hybrid: choose1S/1M; flight begins at level4.
- Raden aspect: edge on hide/sneak tests and ignore difficult terrain. Rat animal: size1T,
  climb at full speed, free-maneuver Hide/allies as cover, stay hidden through occupied squares,
  edge to climb creatures; no abilities except Aspect of the Wild. Hybrid: choose1S/1M;
  automatic full-speed climbing begins at level4.
- Vuken aspect: after Knockback, may Aid Attack as a free triggered action. Wolf animal AND
  hybrid: size1L, extra speed+2, ignore difficult terrain. That conditional+2 is additional
  to the always-on kit speed+2. Hybrid temporary Stamina begins at level4.

Sources: each kit's `aspect-benefits.md`, `animal-form-*.md`, `hybrid-form-*.md`.
Do not make animal sizes, flight or hybrid benefits permanent baseline values. If form state is
manual, label all those conditions and crow/rat ability restrictions; do not claim automatic
blocking or form-derived stats. The printed free Hide permission and broad ability prohibition
coexist: retain the explicit Hide permission, rather than interpreting it away.

Aspect of the Wild is a Self-targeted maneuver changing animal/hybrid/true form. Speech remains;
can speak with matching animals; animal-form negotiation Renown is treated as+2. Its1-Ferocity
option is a second transformation as a free maneuver. Do not interpret 'another animal form'
as permission to choose a different kit or an arbitrary animal.

## Embedded uses and spends to expose

Every granted use requires an accessible shared operation and persisted proof, with conditional
availability explained. Splitting choice families into multiple named actions is an implementation
choice; counts alone are not proof of completeness.

- Lines of Force enhancement1: movement bonus becomes2M INSTEAD OF M, not M+2M; requires parent
  forced-movement trigger and same-size-or-smaller replacement target within Melee1.
- Unearthly Reflexes enhancement1: reduce associated potency by1 for self; parent halves triggering
  damage and shifts up toA. Parent targets Self.
- Furious Change enhancement1: optional Recovery if not dying; parent trigger loses Stamina while
  not dying, temp Stamina=M and optional animal/hybrid transformation. Parent targets Self.
- Aspect of the Wild enhancement1: second transformation/free maneuver, as above.
- To the Uttermost End enhancement1+ per Ferocity: while winded extra1d6 each; while dying extra1d10
  each. Lose1d6 STAMINA AFTER THE STRIKE in either case, not once per point spent. Do not conflate
  this Stamina loss with damage or charge the base5 twice. Outside combat variable spending is
  bounded by Victories. Eligibility, dice and Stamina loss remain explicit if manual.
- Blood for Blood!: optional self1d6 damage to add target1d6 damage; costs no additional Ferocity.
  Do not silently choose a shared-versus-separate die convention if automating beyond source text.
- To the Death!: gains2 surges and grants the TARGET an opportunity attack as free triggered action.
  Inventory the recipient's granted use or a clearly labelled manual proxy, not just the cast.
- Your Entrails Are Your Extrails!: while bleeding this way, target takesM damage at end of EACH
  OF YOUR turns. This is caster timing, not target saving-throw timing; keep a separate manual
  remainder when the core bleeding occurrence is compiled.
- Out of the Way!: follow into squares the slid creature leaves; any opportunity-attack damage
  you take doing so is also dealt to that target. Inventory this conditional follow-up.
- Wing Buffet: shift2 before OR after roll; Driving Pounce: shift up to actual pushed distance.
- Primordial Cunning: optional push-to-slide; never surprised is a passive rule boundary.
- Primordial Strength: weapon STRIKE against OBJECT addsM; pushing CREATURE into object addsM.
  These are not universal weapon damage bonuses.
- Boren push-to-pull and adjacency/strict-M<average free Grab; Corven falling free transformation;
  Vuken post-Knockback free Aid Attack; Corven/Raden animal free Hide should all be accounted for.
- Make Peace With Your God!: Self/free maneuver,1 surge and NEXT ability roll THIS turn tier3;
  an automatic tier override requires actual engine support or explicit manual use.

## Ferocity and Growing Ferocity

`feature/fury/level-1/ferocity.md`: start encounter=Victories; start own turn1d3; first damage in
EACH ROUND gives1; first winded/dying in encounter gives1d3; lose remaining at encounter end.
Outside combat paid ability/effect waived, repeat locked until Victory/respite. Unlimited spend
uses act as spending Victories. Resource generation and repeat tracking cannot be inferred from
an ability log if not implemented.

`feature/fury/level-1/growing-ferocity.md` and kit `growing-ferocity.md`:
benefits unlocked by ferocity persist to END OF YOUR TURN even after spending below threshold.
Do not model them solely from the post-payment pool. Level1 uses thresholds2/4/6 only;
8 requires level4,10 level7,12 level10. Improved entries replace lesser counterparts.

| Path | Ferocity2 | Ferocity4 | Ferocity6 |
| --- | --- | --- | --- |
| Berserker | Knockback distance+M | first push on a turn:1 surge | edge Might tests and Knockback |
| Reaver | Knockback distance+A | first slide on a turn:1 surge | edge Agility tests and Knockback |
| Boren | hold2 grabs; strike own grabbed creature:1 surge | first grab on a turn:1 surge | edge Grab and Knockback |
| Corven/Raden | Disengage distance+A | first shift on a turn:1 surge | edge Agility tests, Escape Grab, Knockback |
| Vuken | Knockback one additional target | first push OR prone on a turn:1 surge | edge Agility tests and Knockback |

These are conditional bonuses, resource gains and action variants, not automatic extra free casts.
Manual implementation must retain timing, thresholds and source text. Do not grant two surges at
level1 by reading higher rows without their level gates.

## Damage and targeting proof cautions

At M2 BEFORE ordinary kit additions: Brutal Slam5/8/11; Hit and Run4/7/9;
Impaled4/7/9; To the Death5/8/11; Back5/8/11; Out of the Way5/7/10;
Tide2/3/5; Entrails5/7/10; Blood6/8/12; Thunder6/9/13; Uttermost9/13/18.
Fixed costs come from each ability's frontmatter; optional enhancements from its body.

Tide of Death is especially important: its header targets Self, but its effect makes the roll
against enemies whose spaces you traverse. Do not automatically apply its printed damage to the
Fury merely because the generic route binds Self. Prove correct affected-target handling or keep
the entire special roll/effect explicitly manual. Its last victim takesM per opportunity attack
TRIGGERED during movement, not per hit or point of damage. Thunder Roar movement is ordered
nearest-first and can collide with later targets; manual boundary if spatial order is unavailable.

Hit and Run only has A<STRONG slowed(save ends) at tier3; lower tiers have no condition. Entrails
has M<0/1/2 bleeding but also a separate caster-turn damage effect. Blood's bleeding AND weakened
is compound; Impaled/Bear Claws grab and Unbalancing Attack prone are not core save-ends clauses.
Do not broaden the bounded compiler implicitly. Source body effects can keep otherwise-simple
clauses on the compatibility path; derive final eligibility from the actual grammar report.

For headless fixtures, select Self for Unearthly Reflexes/Furious Change/Make Peace/Aspect of the
Wild; do not assume every ability attacks another hero. Use independent source-based costs and
kit arithmetic, read persisted payment/target/manual state, and preserve source-timed limitations.
No ambiguity found that blocks the inventory. Unresolved form, target-order, reaction, dice and
conditional-bonus automation should remain explicit/manual rather than receive guessed rules.
