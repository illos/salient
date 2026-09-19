# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wizard.spec.ts >> wizard, admission review and the three sheet audiences
- Location: tests/browser/wizard.spec.ts:23:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/admission awaiting review/)
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/admission awaiting review/) with timeout 15000ms
  - waiting for getByText(/admission awaiting review/)

```

```yaml
- banner:
  - link "Salient":
    - /url: /
  - navigation "Primary":
    - link "Campaigns":
      - /url: /
    - link "Characters":
      - /url: /characters
    - link "Rules":
      - /url: /rules
    - link "Foes":
      - /url: /foes
  - status: ● Connected
  - group "Appearance":
    - button "Light"
    - button "Dark"
    - button "System" [pressed]
  - text: Player 970eff3c
  - button "Sign out"
- main:
  - link "← Your characters":
    - /url: /characters
  - paragraph: Your character
  - link "Progression":
    - /url: /characters/k17423t167fhqbap8fbb5b9bv98epqc3/progression
  - text: Campaign
  - combobox "Campaign to submit to":
    - option "Wizard 970eff3c" [selected]
  - link "Edit":
    - /url: /characters/k17423t167fhqbap8fbb5b9bv98epqc3/wizard
  - button "Submit for admission"
  - article "Grug 970eff3c character sheet":
    - img "Grug 970eff3c portrait"
    - heading "Grug 970eff3c" [level=1]
    - text: Draft preview (not in play) Devil Fury · Berserker Level 1 Kit · Mountain Soldier · owned by Player 970eff3c
    - group "Characteristics":
      - button "Might 2":
        - text: "2"
        - img "Might"
      - button "Agility 2":
        - text: "2"
        - img "Agility"
      - button "Reason 0":
        - text: "0"
        - img "Reason"
      - button "Intuition 1":
        - text: "1"
        - img "Intuition"
      - button "Presence 0":
        - text: "0"
        - img "Presence"
    - text: Stamina
    - paragraph: "No live values: they are initialized when the build is admitted to a campaign."
    - text: Maximum 30 Recovery 10
    - region "Stats":
      - heading "Stats" [level=2]
      - list "Stats":
        - listitem: Size 1M
        - listitem: Speed 6
        - listitem: Stability 2
        - listitem: Disengage 1
        - listitem: Potency 0 / 1 / 2
        - listitem: Saves on 5+
        - listitem: Renown 1
        - listitem: Wealth 1
    - region "Skills":
      - heading "Skills" [level=2]
      - text: "10"
      - list "Skills":
        - listitem: Persuade
        - listitem: Swim
        - listitem: Blacksmithing
        - listitem: Intimidate
        - listitem: Endurance
        - listitem: Alertness
        - listitem: Nature
        - listitem: Jump
        - listitem: Climb
        - listitem: Lift
    - region "Conditions":
      - heading "Conditions" [level=2]
      - text: no live record
      - paragraph: No live record yet.
    - region "Abilities":
      - heading "Abilities" [level=2]
      - text: 7 granted
      - heading "Main actions" [level=4]
      - list "Main actions":
        - listitem:
          - strong: Brutal Slam
          - text: Signature
          - button "Read Brutal Slam in the rules"
          - paragraph:
            - emphasis: The heavy impact of your weapon attacks drives your foes ever back.
          - strong:
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: ","
            - link "Strike":
              - /url: /rules/heroes/rule/combat/strike
            - text: ", Weapon"
          - strong:
            - link "Main action":
              - /url: /rules/heroes/rule/combat/turn
          - strong:
            - img "Distance"
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: "1"
          - strong:
            - img "Target"
            - text: One creature or object
          - paragraph:
            - strong:
              - link "Power Roll":
                - /url: /rules/heroes/rule/dice/power-roll
              - text: +
              - link "Might":
                - /url: /rules/heroes/rule/character/might
              - text: ":"
          - list:
            - listitem:
              - img "Tier 1, 11 or lower"
              - text: 3 +
              - img "Might"
              - text: damage;
              - link "push":
                - /url: /rules/heroes/movement/forced-movement
              - text: "1"
            - listitem:
              - img "Tier 2, 12 to 16"
              - text: 6 +
              - img "Might"
              - text: damage;
              - link "push":
                - /url: /rules/heroes/movement/forced-movement
              - text: "2"
            - listitem:
              - img "Tier 3, 17 or higher"
              - text: 9 +
              - img "Might"
              - text: damage;
              - link "push":
                - /url: /rules/heroes/movement/forced-movement
              - text: "4"
        - listitem:
          - strong: Out of the Way!
          - text: 3 Ferocity
          - button "Read Out of the Way! in the rules"
          - paragraph:
            - emphasis: Your enemies will clear your path—whether they want to or not.
          - strong:
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: ","
            - link "Strike":
              - /url: /rules/heroes/rule/combat/strike
            - text: ", Weapon"
          - strong:
            - link "Main action":
              - /url: /rules/heroes/rule/combat/turn
          - strong:
            - img "Distance"
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: "1"
          - strong:
            - img "Target"
            - text: One creature
          - paragraph:
            - strong:
              - link "Power Roll":
                - /url: /rules/heroes/rule/dice/power-roll
              - text: +
              - link "Might":
                - /url: /rules/heroes/rule/character/might
              - text: ":"
          - list:
            - listitem:
              - img "Tier 1, 11 or lower"
              - text: 3 +
              - img "Might"
              - text: damage;
              - link "slide":
                - /url: /rules/heroes/movement/forced-movement
              - text: "2"
            - listitem:
              - img "Tier 2, 12 to 16"
              - text: 5 +
              - img "Might"
              - text: damage;
              - link "slide":
                - /url: /rules/heroes/movement/forced-movement
              - text: "3"
            - listitem:
              - img "Tier 3, 17 or higher"
              - text: 8 +
              - img "Might"
              - text: damage;
              - link "slide":
                - /url: /rules/heroes/movement/forced-movement
              - text: "5"
          - paragraph:
            - strong: "Effect:"
            - text: When you
            - link "slide":
              - /url: /rules/heroes/movement/forced-movement
            - text: the target, you can move into any square they leave. If you take damage from an
            - link "opportunity attack":
              - /url: /rules/heroes/rule/combat/opportunity-attack
            - text: by moving this way, the target takes the same damage.
        - listitem:
          - strong: Thunder Roar
          - text: 5 Ferocity
          - button "Read Thunder Roar in the rules"
          - paragraph:
            - emphasis: You unleash a howl that hurls your enemies back.
          - strong:
            - text: Area,
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: ", Weapon"
          - strong:
            - link "Main action":
              - /url: /rules/heroes/rule/combat/turn
          - strong:
            - img "Distance"
            - text: 5 x 1 line within 1
          - strong:
            - img "Target"
            - text: Each enemy in the area
          - paragraph:
            - strong:
              - link "Power Roll":
                - /url: /rules/heroes/rule/dice/power-roll
              - text: +
              - link "Might":
                - /url: /rules/heroes/rule/character/might
              - text: ":"
          - list:
            - listitem:
              - img "Tier 1, 11 or lower"
              - text: 6 damage;
              - link "push":
                - /url: /rules/heroes/movement/forced-movement
              - text: "2"
            - listitem:
              - img "Tier 2, 12 to 16"
              - text: 9 damage;
              - link "push":
                - /url: /rules/heroes/movement/forced-movement
              - text: "4"
            - listitem:
              - img "Tier 3, 17 or higher"
              - text: 13 damage;
              - link "push":
                - /url: /rules/heroes/movement/forced-movement
              - text: "6"
          - paragraph:
            - strong: "Effect:"
            - text: The targets are
            - link "force moved":
              - /url: /rules/heroes/movement/forced-movement
            - text: one at a time, starting with the target nearest to you, and can be
            - link "pushed":
              - /url: /rules/heroes/movement/forced-movement
            - text: into other targets in the same line.
        - listitem:
          - strong: Melee Weapon Free Strike
          - button "Read Melee Weapon Free Strike in the rules"
          - strong:
            - text: Charge,
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: ","
            - link "Strike":
              - /url: /rules/heroes/rule/combat/strike
            - text: ", Weapon"
          - strong: Main action
          - strong:
            - img "Distance"
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: "1"
          - strong:
            - img "Target"
            - text: One creature or object
          - paragraph:
            - strong:
              - link "Power Roll":
                - /url: /rules/heroes/rule/dice/power-roll
              - text: +
              - link "Might":
                - /url: /rules/heroes/rule/character/might
              - text: or
              - link "Agility":
                - /url: /rules/heroes/rule/character/agility
              - text: ":"
          - list:
            - listitem:
              - img "Tier 1, 11 or lower"
              - text: 2 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
            - listitem:
              - img "Tier 2, 12 to 16"
              - text: 5 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
            - listitem:
              - img "Tier 3, 17 or higher"
              - text: 7 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
        - listitem:
          - strong: Ranged Weapon Free Strike
          - button "Read Ranged Weapon Free Strike in the rules"
          - strong:
            - link "Ranged":
              - /url: /rules/heroes/rule/combat/ranged
            - text: ","
            - link "Strike":
              - /url: /rules/heroes/rule/combat/strike
            - text: ", Weapon"
          - strong: Main action
          - strong:
            - img "Distance"
            - link "Ranged":
              - /url: /rules/heroes/rule/combat/ranged
            - text: "5"
          - strong:
            - img "Target"
            - text: One creature or object
          - paragraph:
            - strong:
              - link "Power Roll":
                - /url: /rules/heroes/rule/dice/power-roll
              - text: +
              - link "Might":
                - /url: /rules/heroes/rule/character/might
              - text: or
              - link "Agility":
                - /url: /rules/heroes/rule/character/agility
              - text: ":"
          - list:
            - listitem:
              - img "Tier 1, 11 or lower"
              - text: 2 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
            - listitem:
              - img "Tier 2, 12 to 16"
              - text: 4 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
            - listitem:
              - img "Tier 3, 17 or higher"
              - text: 6 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
        - listitem:
          - text: Charge Common action
          - button "Read Charge in the rules"
        - listitem:
          - text: Defend Common action
          - button "Read Defend in the rules"
        - listitem:
          - text: Free Strike Common action
          - button "Read Free Strike in the rules"
        - listitem:
          - text: Heal Common action
          - button "Read Heal in the rules"
      - heading "Maneuvers" [level=4]
      - list "Maneuvers":
        - listitem:
          - text: Aid Attack Common action
          - button "Read Aid Attack in the rules"
        - listitem:
          - text: Catch Breath Common action
          - button "Read Catch Breath in the rules"
        - listitem:
          - text: Escape Grab Common action
          - button "Read Escape Grab in the rules"
        - listitem:
          - text: Grab Common action
          - button "Read Grab in the rules"
        - listitem:
          - text: Hide Common action
          - button "Read Hide in the rules"
        - listitem:
          - text: Knockback Common action
          - button "Read Knockback in the rules"
        - listitem:
          - text: Make or Assist a Test Common action
          - button "Read Make or Assist a Test in the rules"
        - listitem:
          - text: Search for Hidden Creatures Common action
          - button "Read Search for Hidden Creatures in the rules"
        - listitem:
          - text: Stand Up Common action
          - button "Read Stand Up in the rules"
        - listitem:
          - text: Use Consumable Common action
          - button "Read Use Consumable in the rules"
      - heading "Move actions" [level=4]
      - list "Move actions":
        - listitem:
          - text: Advance Common action
          - button "Read Advance in the rules"
        - listitem:
          - text: Disengage Common action
          - button "Read Disengage in the rules"
        - listitem:
          - text: Ride Common action
          - button "Read Ride in the rules"
      - heading "Triggered actions" [level=4]
      - list "Triggered actions":
        - listitem:
          - strong: Lines of Force
          - button "Read Lines of Force in the rules"
          - paragraph:
            - emphasis: You redirect the energy of motion.
          - strong:
            - text: Magic,
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
          - strong:
            - link "Triggered":
              - /url: /rules/heroes/rule/combat/triggered-action
          - strong:
            - img "Distance"
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: "1"
          - strong:
            - img "Target"
            - text: Self or one creature
          - paragraph:
            - strong: "Trigger:"
            - text: The target would be
            - link "force moved":
              - /url: /rules/heroes/movement/forced-movement
            - text: .
          - paragraph:
            - strong: "Effect:"
            - text: You can select a new target of the same
            - link "size":
              - /url: /rules/heroes/rule/character/size
            - text: or smaller within
            - link "distance":
              - /url: /rules/heroes/rule/combat/distance
            - text: to be force moved instead. You become the source of the
            - link "forced movement":
              - /url: /rules/heroes/movement/forced-movement
            - text: ", determine the new target's destination, and can"
            - link "push":
              - /url: /rules/heroes/movement/forced-movement
            - text: the target instead of using the original
            - link "forced movement":
              - /url: /rules/heroes/movement/forced-movement
            - text: type. Additionally, the
            - link "forced movement":
              - /url: /rules/heroes/movement/forced-movement
            - link "distance":
              - /url: /rules/heroes/rule/combat/distance
            - text: gains a
            - link "bonus":
              - /url: /rules/heroes/rule/dice/bonuses-and-penalties
            - text: equal to your
            - link "Might":
              - /url: /rules/heroes/rule/character/might
            - text: score.
          - paragraph:
            - strong: "Spend 1 Ferocity:"
            - text: The
            - link "forced movement":
              - /url: /rules/heroes/movement/forced-movement
            - link "distance":
              - /url: /rules/heroes/rule/combat/distance
            - text: gains a
            - link "bonus":
              - /url: /rules/heroes/rule/dice/bonuses-and-penalties
            - text: equal to twice your
            - link "Might":
              - /url: /rules/heroes/rule/character/might
            - text: score instead.
      - heading "Other abilities" [level=4]
      - list "Other abilities":
        - listitem:
          - strong: Pain for Pain
          - text: Signature
          - button "Read Pain for Pain in the rules"
          - paragraph:
            - emphasis: An enemy who tagged you will pay for that.
          - strong:
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: ","
            - link "Strike":
              - /url: /rules/heroes/rule/combat/strike
            - text: ", Weapon"
          - strong: Main action
          - strong:
            - img "Distance"
            - link "Melee":
              - /url: /rules/heroes/rule/combat/melee
            - text: "1"
          - strong:
            - img "Target"
            - text: One creature
          - paragraph:
            - strong:
              - link "Power Roll":
                - /url: /rules/heroes/rule/dice/power-roll
              - text: +
              - link "Might":
                - /url: /rules/heroes/rule/character/might
              - text: or
              - link "Agility":
                - /url: /rules/heroes/rule/character/agility
              - text: ":"
          - list:
            - listitem:
              - img "Tier 1, 11 or lower"
              - text: 3 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
            - listitem:
              - img "Tier 2, 12 to 16"
              - text: 5 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
            - listitem:
              - img "Tier 3, 17 or higher"
              - text: 13 +
              - img "Might"
              - text: or
              - img "Agility"
              - text: damage
          - paragraph:
            - strong: "Effect:"
            - text: If the target dealt damage to you since the end of your last
            - link "turn":
              - /url: /rules/heroes/rule/combat/turn
            - text: ", this"
            - link "strike":
              - /url: /rules/heroes/rule/combat/strike
            - text: deals additional damage equal to your
            - link "Might":
              - /url: /rules/heroes/rule/character/might
            - text: or
            - link "Agility":
              - /url: /rules/heroes/rule/character/agility
            - text: score (your choice).
          - paragraph: Kit bonuses included
    - region "Kit · Mountain":
      - heading "Kit · Mountain" [level=2]
      - text: +9 Stamina +0 Speed +0/+0/+4 Melee dmg +2 Stability
      - paragraph: You wear heavy armor and wield a heavy weapon. Stamina bonus +9 per echelon (echelon 1).
    - region "Features":
      - heading "Features" [level=2]
      - text: 10 entries
      - list "Features":
        - listitem:
          - text: Silver Tongue
          - button "Read Silver Tongue in the rules"
          - text: Ancestry
        - listitem:
          - text: Impressive Horns
          - button "Read Impressive Horns in the rules"
          - text: Ancestry · 2 points
        - listitem:
          - text: Beast Legs
          - button "Read Beast Legs in the rules"
          - text: Ancestry · 1 point
        - listitem:
          - text: Culture edge
          - button "Read Culture edge in the rules"
          - text: Culture
        - listitem:
          - text: Ferocity
          - button "Read Ferocity in the rules"
          - text: Class · L1
        - listitem:
          - text: Growing Ferocity
          - button "Read Growing Ferocity in the rules"
          - text: Class · L1
        - listitem:
          - text: Mighty Leaps
          - button "Read Mighty Leaps in the rules"
          - text: Class · L1
        - listitem:
          - text: Kit
          - button "Read Kit in the rules"
          - text: Subclass · L1
        - listitem:
          - text: Primordial Strength
          - button "Read Primordial Strength in the rules"
          - text: Subclass · L1
        - listitem:
          - text: Teamwork
          - button "Read Teamwork in the rules"
          - text: Perk
    - region "Languages":
      - heading "Languages" [level=2]
      - list "Languages":
        - listitem: Caelian
        - listitem: Anjali
        - listitem: Vaslorian
    - region "Details":
      - heading "Details" [level=2]
      - list "Details":
        - listitem: Culture —
        - listitem: Career Soldier · Sole Survivor
        - listitem
        - listitem: Appearance —
        - listitem: Biography —
    - text: Notes
    - paragraph: Grug fears the sea.
- contentinfo: v0.01 · pre-alpha
```

# Test source

```ts
  62  |       player!.getByLabel(label, { exact: true }).selectOption(value);
  63  |     // 2. Ancestry: the full pool is visible, unsupported ancestries are labeled and disabled.
  64  |     await step('2. Ancestry');
  65  |     await expect(player!.getByLabel('Dwarf', { exact: true })).toBeDisabled();
  66  |     await expect(player!.getByText('Not offered yet').first()).toBeVisible();
  67  |     await player!.getByLabel('Devil', { exact: true }).click();
  68  |     await pick('Silver Tongue skill', 'Persuade');
  69  |     await player!.getByLabel('Beast Legs', { exact: true }).check();
  70  |     await player!.getByLabel('Impressive Horns', { exact: true }).check();
  71  |     await expect(player!.getByText('3 of 3 points spent')).toBeVisible();
  72  |     // 3. Culture.
  73  |     await step('3. Culture');
  74  |     await expect(
  75  |       player!.getByLabel('Additional language', { exact: true }).locator('option[value="Caelian"]'),
  76  |     ).toBeDisabled();
  77  |     await expect(
  78  |       player!
  79  |         .getByLabel('Additional language', { exact: true })
  80  |         .locator('option[value="Khoursirian"]'),
  81  |     ).toHaveCount(1);
  82  |     await pick('Additional language', 'Anjali');
  83  |     await player!.getByLabel('Wilderness', { exact: true }).check();
  84  |     await pick('Environment skill', 'Swim');
  85  |     await player!.getByLabel('Communal', { exact: true }).check();
  86  |     await pick('Organization skill', 'Blacksmithing');
  87  |     await player!.getByLabel('Martial', { exact: true }).check();
  88  |     await pick('Upbringing skill', 'Intimidate');
  89  |     // 4. Career.
  90  |     await step('4. Career');
  91  |     await player!.getByLabel('Soldier', { exact: true }).click();
  92  |     await pick('Exploration skill', 'Endurance');
  93  |     await pick('Intrigue skill', 'Alertness');
  94  |     await pick('Career languages 1', '__open__');
  95  |     await pick('Career languages 2', 'Vaslorian');
  96  |     await player!.getByLabel('Teamwork', { exact: true }).check();
  97  |     await player!.getByLabel('Sole Survivor', { exact: true }).check();
  98  |     // 5. Class.
  99  |     await step('5. Class');
  100 |     await player!.getByLabel('Fury', { exact: true }).click();
  101 |     await player!.getByLabel('1, 0, 0', { exact: true }).check();
  102 |     // V21: the class-fixed values are compact stat boxes, not inputs.
  103 |     await expect(player!.getByLabel('Might (fixed)', { exact: true })).toContainText('2');
  104 |     await expect(player!.getByLabel('Agility (fixed)', { exact: true })).toContainText('2');
  105 |     for (const target of ['Reason', 'Intuition', 'Presence'])
  106 |       await expect(player!.getByLabel(`Assign ${target}`, { exact: true })).toHaveValue('');
  107 |     await player!.getByTestId('array-value-1').dragTo(player!.getByTestId('assignment-Reason'));
  108 |     await expect(player!.getByLabel('Assign Reason', { exact: true })).toHaveValue('0');
  109 |     await pick('Assign Intuition', '1');
  110 |     await player!.getByTestId('array-value-0').dragTo(player!.getByTestId('assignment-Presence'));
  111 |     await expect(player!.getByLabel('Assign Presence', { exact: true })).toHaveValue('0');
  112 |     await mkdir('.playtest/audit-2026-09-15', { recursive: true });
  113 |     await player!.evaluate(() => window.scrollTo(0, 0));
  114 |     await player!.screenshot({
  115 |       path: '.playtest/audit-2026-09-15/wizard-assignment.png',
  116 |       fullPage: true,
  117 |     });
  118 |     await pick('Additional class skills 1', 'Jump');
  119 |     await pick('Additional class skills 2', 'Climb');
  120 |     await player!.getByLabel('Berserker', { exact: true }).check();
  121 |     await player!.getByLabel('Brutal Slam', { exact: true }).check();
  122 |     await player!.getByLabel('Out of the Way!', { exact: true }).check();
  123 |     await player!.getByLabel('Thunder Roar', { exact: true }).check();
  124 |     // Before the kit: Stamina maximum is pending, never a number (R02 4.2).
  125 |     await expect(soFar).toContainText('incomplete');
  126 |     await expect(soFar.getByText('Stamina', { exact: true }).locator('..')).toContainText(
  127 |       'Pending',
  128 |     );
  129 |     // 6. Kit: the source text of an option is readable before choosing it.
  130 |     await step('6. Kit');
  131 |     await pick('Choose a kit', 'Mountain');
  132 |     await player!
  133 |       .getByRole('region', { name: 'Selected kit', exact: true })
  134 |       .getByRole('button', { name: 'Read Mountain in the rules', exact: true })
  135 |       .click();
  136 |     await expect(player!.getByRole('dialog')).toContainText('Stamina');
  137 |     await player!.getByRole('button', { name: 'Close rule', exact: true }).click();
  138 |     await expect(player!.getByRole('region', { name: 'Selected kit', exact: true })).toContainText(
  139 |       'Mountain',
  140 |     );
  141 |     await expect(soFar.getByText('complete', { exact: true })).toBeVisible();
  142 |     await expect(soFar.getByText('Stamina', { exact: true }).locator('..')).toContainText('30');
  143 |     // Q-CHAR-10: underspending is visibly warned without changing a complete build's status.
  144 |     await step('2. Ancestry');
  145 |     await player!.getByLabel('Beast Legs', { exact: true }).uncheck();
  146 |     await expect(player!.getByText(/Unspent points are allowed/)).toBeVisible();
  147 |     await expect(soFar.getByText('complete', { exact: true })).toBeVisible();
  148 |     await player!.getByLabel('Beast Legs', { exact: true }).check();
  149 |     await expect(player!.getByText(/Unspent points are allowed/)).toHaveCount(0);
  150 |     // 7. Free strikes (display only), 9. Details, 10. Connections.
  151 |     await step('7. Add Free Strikes');
  152 |     await expect(player!.getByText('Melee Weapon Free Strike').first()).toBeVisible();
  153 |     await expect(player!.getByRole('button', { name: /^8\. Complication/ })).toBeVisible();
  154 |     await step('9. Determine Details');
  155 |     await player!.getByLabel('Private notes', { exact: false }).fill('Grug fears the sea.');
  156 |     // V21: EXIT saves the draft (the former "Save and close") and returns to the character page.
  157 |     await player!.getByRole('button', { name: 'Exit', exact: true }).click();
  158 |     // Submit for admission from the character page; the Director approves from the campaign page.
  159 |     await expect(player!.getByRole('heading', { name: `Grug ${stamp}` })).toBeVisible();
  160 |     await expect(player!.getByText('No live values', { exact: false })).toBeVisible();
  161 |     await player!.getByRole('button', { name: 'Submit for admission', exact: true }).click();
> 162 |     await expect(player!.getByText(/admission awaiting review/)).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  163 |     const characterUrl = player!.url();
  164 |     await director!.goto(campaignUrl);
  165 |     await director!.getByRole('button', { name: 'View proposed sheet', exact: true }).click();
  166 |     await expect(director!.getByText('Proposed build (awaiting review)').first()).toBeVisible();
  167 |     await expect(director!.getByText('Grug fears the sea.')).toHaveCount(0);
  168 |     await director!.getByRole('button', { name: 'Approve', exact: true }).click();
  169 |     await expect(director!.getByRole('link', { name: `Grug ${stamp}` })).toBeVisible();
  170 |     // Owner: effective build, R03 live values, private notes.
  171 |     await expect(player!.locator('span', { hasText: 'Effective build' }).first()).toBeVisible();
  172 |     await expect(player!.getByText('30 / 30').first()).toBeVisible();
  173 |     await expect(player!.getByText('10 / 10').first()).toBeVisible();
  174 |     // Private notes sit in the collapsed Character details section: present for the owner only.
  175 |     await expect(player!.getByText('Grug fears the sea.').first()).toBeAttached();
  176 |     await expect(player!.getByText('Brutal Slam').first()).toBeVisible();
  177 |     await expect(player!.getByRole('button', { name: 'Catch Breath', exact: true })).toBeDisabled();
  178 |     await player!
  179 |       .getByRole('button', { name: 'Read Brutal Slam in the rules', exact: true })
  180 |       .click();
  181 |     await expect(player!.getByRole('dialog')).toContainText('Brutal Slam');
  182 |     await expect(player!.getByRole('dialog')).not.toContainText('scc.v1:');
  183 |     await player!.keyboard.press('Escape');
  184 |     // Director: the full sheet without notes; a peer: Stamina and Recoveries only.
  185 |     await director!.goto(characterUrl);
  186 |     await expect(director!.getByText('Brutal Slam').first()).toBeVisible();
  187 |     await expect(director!.getByText('Grug fears the sea.')).toHaveCount(0);
  188 |     await observer!.goto(characterUrl);
  189 |     await expect(observer!.getByText('30 / 30').first()).toBeVisible();
  190 |     await expect(observer!.getByText('Brutal Slam')).toHaveCount(0);
  191 |     await expect(observer!.getByText('Grug fears the sea.')).toHaveCount(0);
  192 |     await expect(observer!.getByText('ferocity')).toHaveCount(0);
  193 |     for (const [page, role] of [
  194 |       [player!, 'owner'],
  195 |       [director!, 'director'],
  196 |       [observer!, 'peer'],
  197 |     ] as const) {
  198 |       await page.screenshot({
  199 |         path: `.playtest/audit-2026-09-15/sheet-${role}.png`,
  200 |         fullPage: true,
  201 |       });
  202 |       expect(
  203 |         await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  204 |       ).toBe(true);
  205 |     }
  206 |     await tableJourney([director!, player!, observer!], campaignUrl, stamp);
  207 |   } finally {
  208 |     await Promise.all(contexts.map(c => c.close()));
  209 |   }
  210 | });
  211 | 
```