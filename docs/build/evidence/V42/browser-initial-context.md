# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: v42-primary-choice.spec.ts >> primary choices collapse, edit without loss, prune on replacement and reopen saved
- Location: tests/browser/v42-primary-choice.spec.ts:8:1

# Error details

```
TimeoutError: locator.check: Timeout 15000ms exceeded.
Call log:
  - waiting for getByLabel('Devil', { exact: true })
    - locator resolved to <input type="radio" aria-label="Devil" name="ancestry.choice" class="size-4 shrink-0 appearance-none border border-foreground bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:border-input rounded-full checked:border-primary checked:bg-primary"/>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action
    - click action done
    - waiting for scheduled navigations to finish
    - navigations have finished

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - link "Salient" [ref=f1e5] [cursor=pointer]:
      - /url: /
    - generic [ref=f1e7]: New hero
    - heading "Unnamed hero" [level=1] [ref=f1e8]
    - generic [ref=f1e9]:
      - button "Save draft" [ref=f1e10]
      - button "Exit" [ref=f1e11]
      - 'button "Choice 52e65c84: account menu" [ref=f1e13]':
        - generic [ref=f1e14]: Choice 52e65c84
        - generic [aria-hidden] [ref=f1e16]: C5
  - generic [ref=f1e17]:
    - navigation "Steps" [ref=f1e19]:
      - paragraph [ref=f1e20]: Step 2 of 10
      - list [ref=f1e21]:
        - listitem [ref=f1e22]:
          - button "1. Think" [ref=f1e23]:
            - generic [aria-hidden] [ref=f1e24]: ✓
            - generic [ref=f1e25]: Think
        - listitem [ref=f1e26]:
          - button "2. Ancestry" [ref=f1e27]:
            - generic [aria-hidden] [ref=f1e28]: "2"
            - generic [ref=f1e29]: Ancestry
            - generic [ref=f1e30]: Devil
            - generic "2 to resolve" [ref=f1e31]: "2"
        - listitem [ref=f1e32]:
          - button "3. Culture" [ref=f1e33]:
            - generic [aria-hidden] [ref=f1e34]: "3"
            - generic [ref=f1e35]: Culture
            - generic "4 to resolve" [ref=f1e36]: "4"
        - listitem [ref=f1e37]:
          - button "4. Career" [ref=f1e38]:
            - generic [aria-hidden] [ref=f1e39]: "4"
            - generic [ref=f1e40]: Career
            - generic "1 to resolve" [ref=f1e41]: "1"
        - listitem [ref=f1e42]:
          - button "5. Class" [ref=f1e43]:
            - generic [aria-hidden] [ref=f1e44]: "5"
            - generic [ref=f1e45]: Class
            - generic "1 to resolve" [ref=f1e46]: "1"
        - listitem [ref=f1e47]:
          - button "6. Kit" [ref=f1e48]:
            - generic [aria-hidden] [ref=f1e49]: "6"
            - generic [ref=f1e50]: Kit
        - listitem [ref=f1e51]:
          - button "7. Add Free Strikes" [ref=f1e52]:
            - generic [aria-hidden] [ref=f1e53]: "7"
            - generic [ref=f1e54]: Add Free Strikes
        - listitem [ref=f1e55]:
          - button "8. Complication" [ref=f1e56]:
            - generic [aria-hidden] [ref=f1e57]: "8"
            - generic [ref=f1e58]: Complication
        - listitem [ref=f1e59]:
          - button "9. Determine Details" [ref=f1e60]:
            - generic [aria-hidden] [ref=f1e61]: "9"
            - generic [ref=f1e62]: Determine Details
        - listitem [ref=f1e63]:
          - button "10. Make Connections" [ref=f1e64]:
            - generic [aria-hidden] [ref=f1e65]: "10"
            - generic [ref=f1e66]: Make Connections
      - progressbar "Steps completed" [ref=f1e68]
    - region "Current step" [ref=f1e70]:
      - generic [ref=f1e71]:
        - generic [ref=f1e72]: Unsaved character. Save draft to keep your choices. Exiting or reloading before saving discards them.
        - generic [ref=f1e73]:
          - generic [ref=f1e74]:
            - heading "Ancestry" [level=2] [ref=f1e75]
            - button "Read 2. Ancestry in the rules" [ref=f1e76]
          - paragraph [ref=f1e78]: Choose your hero's humanoid ancestry from among the range of ancestries available in the game.
        - group [ref=f1e79]:
          - region "Selected ancestry" [ref=f1e80]:
            - generic [ref=f1e81]:
              - heading "Devil" [level=3] [ref=f1e82]
              - button "Read Devil in the rules" [ref=f1e83]
              - button "Edit ancestry" [active] [ref=f1e85]: Edit
          - generic [ref=f1e86]:
            - generic [ref=f1e87]:
              - heading "Starting statistics" [level=3] [ref=f1e88]
              - button "Read Starting statistics in the rules" [ref=f1e89]
            - list [ref=f1e91]:
              - listitem [ref=f1e92]: size 1M, speed 5, stability 0
          - generic [ref=f1e93]:
            - generic [ref=f1e94]:
              - heading "Signature trait" [level=3] [ref=f1e95]
              - button "Read Signature trait in the rules" [ref=f1e96]
            - list [ref=f1e98]:
              - listitem [ref=f1e99]:
                - text: Silver Tongue
                - button "Read Silver Tongue in the rules" [ref=f1e100]
          - generic [ref=f1e102]:
            - generic [ref=f1e103]:
              - heading "Silver Tongue skill" [level=3] [ref=f1e104]
              - button "Read Silver Tongue skill in the rules" [ref=f1e105]
            - generic [ref=f1e107]:
              - combobox "Silver Tongue skill" [ref=f1e109]:
                - option "Choose…" [selected]
                - option "Persuade"
                - option "Brag — not offered yet" [disabled]
                - option "Empathize — not offered yet" [disabled]
                - option "Flirt — not offered yet" [disabled]
                - option "Gamble — not offered yet" [disabled]
                - option "Handle Animals — not offered yet" [disabled]
                - option "Interrogate — not offered yet" [disabled]
                - option "Intimidate — not offered yet" [disabled]
                - option "Lead — not offered yet" [disabled]
                - option "Lie — not offered yet" [disabled]
                - option "Music — not offered yet" [disabled]
                - option "Perform — not offered yet" [disabled]
                - option "Read Person — not offered yet" [disabled]
              - generic [ref=f1e110]: 13 options
            - list [ref=f1e111]:
              - listitem [ref=f1e112]: Make a selection to continue.
          - generic [ref=f1e113]:
            - generic [ref=f1e114]:
              - heading "Choose ancestry traits" [level=3] [ref=f1e115]
              - button "Read Choose ancestry traits in the rules" [ref=f1e116]
            - generic [ref=f1e118]:
              - list [ref=f1e119]:
                - listitem [ref=f1e120]:
                  - generic [ref=f1e121]:
                    - checkbox "Barbed Tail" [disabled] [ref=f1e122]
                    - generic [ref=f1e123]:
                      - generic [ref=f1e124]: Barbed Tail
                      - button "Read Barbed Tail in the rules" [ref=f1e125]
                    - generic [ref=f1e127]: 1 point
                    - generic [ref=f1e128]: Not offered yet
                - listitem [ref=f1e129]:
                  - generic [ref=f1e130] [cursor=pointer]:
                    - checkbox "Beast Legs" [ref=f1e131]
                    - generic [ref=f1e132]:
                      - generic [ref=f1e133]: Beast Legs
                      - button "Read Beast Legs in the rules" [ref=f1e134]
                    - generic [ref=f1e136]: 1 point
                - listitem [ref=f1e137]:
                  - generic [ref=f1e138]:
                    - checkbox "Glowing Eyes" [disabled] [ref=f1e139]
                    - generic [ref=f1e140]:
                      - generic [ref=f1e141]: Glowing Eyes
                      - button "Read Glowing Eyes in the rules" [ref=f1e142]
                    - generic [ref=f1e144]: 1 point
                    - generic [ref=f1e145]: Not offered yet
                - listitem [ref=f1e146]:
                  - generic [ref=f1e147]:
                    - checkbox "Hellsight" [disabled] [ref=f1e148]
                    - generic [ref=f1e149]:
                      - generic [ref=f1e150]: Hellsight
                      - button "Read Hellsight in the rules" [ref=f1e151]
                    - generic [ref=f1e153]: 1 point
                    - generic [ref=f1e154]: Not offered yet
                - listitem [ref=f1e155]:
                  - generic [ref=f1e156] [cursor=pointer]:
                    - checkbox "Impressive Horns" [ref=f1e157]
                    - generic [ref=f1e158]:
                      - generic [ref=f1e159]: Impressive Horns
                      - button "Read Impressive Horns in the rules" [ref=f1e160]
                    - generic [ref=f1e162]: 2 points
                - listitem [ref=f1e163]:
                  - generic [ref=f1e164]:
                    - checkbox "Prehensile Tail" [disabled] [ref=f1e165]
                    - generic [ref=f1e166]:
                      - generic [ref=f1e167]: Prehensile Tail
                      - button "Read Prehensile Tail in the rules" [ref=f1e168]
                    - generic [ref=f1e170]: 2 points
                    - generic [ref=f1e171]: Not offered yet
                - listitem [ref=f1e172]:
                  - generic [ref=f1e173]:
                    - checkbox "Wings" [disabled] [ref=f1e174]
                    - generic [ref=f1e175]:
                      - generic [ref=f1e176]: Wings
                      - button "Read Wings in the rules" [ref=f1e177]
                    - generic [ref=f1e179]: 2 points
                    - generic [ref=f1e180]: Not offered yet
              - generic [ref=f1e181]: "0 of 3 points spent · offered set: Beast Legs + Impressive Horns"
            - list [ref=f1e182]:
              - listitem [ref=f1e183]: Make a selection to continue.
      - generic [ref=f1e184]:
        - button "← Think" [ref=f1e185]
        - button "Continue to Culture →" [ref=f1e186]
    - complementary "Hero so far" [ref=f1e188]:
      - generic [ref=f1e189]:
        - paragraph [ref=f1e190]: Your hero so far
        - generic [ref=f1e191]: incomplete
      - generic [ref=f1e192]:
        - generic [aria-hidden] [ref=f1e194]: UH
        - generic [ref=f1e195]:
          - paragraph [ref=f1e196]: Unnamed hero
          - paragraph [ref=f1e197]: Devil · Level 1
      - generic "Characteristics" [ref=f1e198]:
        - generic [ref=f1e199]:
          - generic [ref=f1e200]: –
          - generic [ref=f1e201]: Mgt
        - generic [ref=f1e202]:
          - generic [ref=f1e203]: –
          - generic [ref=f1e204]: Agl
        - generic [ref=f1e205]:
          - generic [ref=f1e206]: –
          - generic [ref=f1e207]: Rsn
        - generic [ref=f1e208]:
          - generic [ref=f1e209]: –
          - generic [ref=f1e210]: Int
        - generic [ref=f1e211]:
          - generic [ref=f1e212]: –
          - generic [ref=f1e213]: Prs
      - generic [ref=f1e214]:
        - generic [ref=f1e215]:
          - generic [ref=f1e216]: Stamina
          - generic [ref=f1e217]: Pending
        - generic [ref=f1e218]:
          - generic [ref=f1e219]: Recoveries
          - generic [ref=f1e220]: Pending
        - generic [ref=f1e221]:
          - generic [ref=f1e222]: Winded
          - generic [ref=f1e223]: Pending
        - generic [ref=f1e224]:
          - generic [ref=f1e225]: Heroic resource
          - generic [ref=f1e226]: Pending
        - generic [ref=f1e227]:
          - generic [ref=f1e228]: Kit
          - generic [ref=f1e229]: Pending
        - generic [ref=f1e230]:
          - generic [ref=f1e231]: Speed
          - generic [ref=f1e232]: "5"
        - generic [ref=f1e233]:
          - generic [ref=f1e234]: Stability
          - generic [ref=f1e235]: Pending
        - generic [ref=f1e236]:
          - generic [ref=f1e237]: Size
          - generic [ref=f1e238]: 1M
        - generic [ref=f1e239]:
          - generic [ref=f1e240]: Disengage
          - generic [ref=f1e241]: Pending
        - generic [ref=f1e242]:
          - generic [ref=f1e243]: Potency
          - generic [ref=f1e244]: Pending
        - generic [ref=f1e245]:
          - generic [ref=f1e246]: Saves on
          - generic [ref=f1e247]: 6+
        - generic [ref=f1e248]:
          - generic [ref=f1e249]: Renown
          - generic [ref=f1e250]: Pending
        - generic [ref=f1e251]:
          - generic [ref=f1e252]: Wealth
          - generic [ref=f1e253]: Pending
        - generic [ref=f1e254]:
          - generic [ref=f1e255]: Languages
          - generic [ref=f1e256]: Caelian
        - generic [ref=f1e257]:
          - generic [ref=f1e258]: Traits
          - generic [ref=f1e259]: Silver Tongue
        - generic [ref=f1e260]:
          - generic [ref=f1e261]: Features
          - generic [ref=f1e262]: Culture edge
        - generic [ref=f1e263]:
          - generic [ref=f1e264]: Perks
          - generic [ref=f1e265]: Pending
        - generic [ref=f1e266]:
          - generic [ref=f1e267]: Abilities
          - generic [ref=f1e268]: Melee Weapon Free Strike, Ranged Weapon Free Strike
      - generic [ref=f1e269]:
        - paragraph [ref=f1e270]: Skills
        - paragraph [ref=f1e271]: None yet
      - generic [ref=f1e272]:
        - paragraph [ref=f1e273]: Outstanding
        - list [ref=f1e274]:
          - listitem [ref=f1e275]: "Choose ancestry traits: Make a selection to continue."
          - listitem [ref=f1e276]: "Silver Tongue skill: Make a selection to continue."
          - listitem [ref=f1e277]: "Choose a career: Make a selection to continue."
          - listitem [ref=f1e278]: "Choose a class: Make a selection to continue."
          - listitem [ref=f1e279]: "Environment: Make a selection to continue."
          - listitem [ref=f1e280]: "Additional language: Make a selection to continue."
          - listitem [ref=f1e281]: "Organization: Make a selection to continue."
          - listitem [ref=f1e282]: "Upbringing: Make a selection to continue."
      - generic "Source text" [ref=f1e283]:
        - generic [ref=f1e284]:
          - generic [ref=f1e285]: Source text
          - button "Read 2. Ancestry in the rules" [ref=f1e286]
        - paragraph [ref=f1e288]:
          - text: Choose your hero's humanoid ancestry from among the range of ancestries available in the game.
          - generic [ref=f1e289]: — 2. Ancestry
```

# Test source

```ts
  1   | // SPDX-License-Identifier: GPL-3.0-only
  2   | import { expect, test } from '@playwright/test';
  3   | import { execFile } from 'node:child_process';
  4   | import { promisify } from 'node:util';
  5   | import { mkdir } from 'node:fs/promises';
  6   | import { register, PASSWORD } from './v21-fixtures';
  7   | 
  8   | test('primary choices collapse, edit without loss, prune on replacement and reopen saved', async ({
  9   |   page,
  10  | }) => {
  11  |   test.setTimeout(180_000);
  12  |   const stamp = crypto.randomUUID().slice(0, 8);
  13  |   const email = `v42-${stamp}@example.test`;
  14  |   const name = `Choice ${stamp}`;
  15  |   await register(page, name, email);
  16  |   const query = async (operation: string, args = {}) => {
  17  |     const result = await promisify(execFile)(
  18  |       'pnpm',
  19  |       ['app', 'query', operation, JSON.stringify(args)],
  20  |       {
  21  |         env: { ...process.env, SALIENT_EMAIL: email, SALIENT_PASSWORD: PASSWORD },
  22  |         maxBuffer: 8 * 1024 * 1024,
  23  |       },
  24  |     );
  25  |     return JSON.parse(result.stdout);
  26  |   };
  27  |   const step = (label: string) =>
  28  |     page
  29  |       .getByRole('navigation', { name: 'Steps' })
  30  |       .getByRole('button', { name: new RegExp(label) })
  31  |       .click();
  32  |   const summary = (label: string) =>
  33  |     page.getByRole('region', { name: `Selected ${label}`, exact: true });
  34  |   const edit = (label: string) => page.getByRole('button', { name: `Edit ${label}`, exact: true });
  35  |   await page.goto('/characters/new/wizard');
  36  |   await step('Ancestry');
  37  |   await expect(page.getByLabel('Dwarf', { exact: true })).toBeDisabled();
  38  |   await expect(page.getByLabel('Silver Tongue skill', { exact: true })).toHaveCount(0);
> 39  |   await page.getByLabel('Devil', { exact: true }).check();
      |                                                   ^ TimeoutError: locator.check: Timeout 15000ms exceeded.
  40  |   await expect(summary('ancestry')).toContainText('Devil');
  41  |   await expect(edit('ancestry')).toBeFocused();
  42  |   await expect(page.getByLabel('Polder', { exact: true })).toHaveCount(0);
  43  |   await page.getByLabel('Silver Tongue skill', { exact: true }).selectOption('Persuade');
  44  |   await page.getByLabel('Beast Legs', { exact: true }).check();
  45  |   await mkdir('.playtest/v42', { recursive: true });
  46  |   await page.screenshot({ path: '.playtest/v42/ancestry-selected.png', fullPage: true });
  47  |   await edit('ancestry').focus();
  48  |   await page.keyboard.press('Enter');
  49  |   await expect(page.getByRole('group', { name: 'Choose ancestry', exact: true })).toBeFocused();
  50  |   await expect(page.getByLabel('Devil', { exact: true })).toBeChecked();
  51  |   await expect(page.getByLabel('Silver Tongue skill', { exact: true })).toHaveCount(0);
  52  |   await expect(page.getByLabel('Beast Legs', { exact: true })).toHaveCount(0);
  53  |   await page.screenshot({ path: '.playtest/v42/ancestry-editing.png', fullPage: true });
  54  |   await page.getByRole('button', { name: 'Keep Devil', exact: true }).click();
  55  |   await expect(page.getByLabel('Silver Tongue skill', { exact: true })).toHaveValue('Persuade');
  56  |   await expect(page.getByLabel('Beast Legs', { exact: true })).toBeChecked();
  57  |   await edit('ancestry').click();
  58  |   await page.getByLabel('Polder', { exact: true }).check();
  59  |   await expect(summary('ancestry')).toContainText('Polder');
  60  |   await expect(page.getByLabel('Beast Legs', { exact: true })).toHaveCount(0);
  61  |   await expect(page.getByText(/Cleared because a parent choice changed/)).toBeVisible();
  62  |   await step('Culture');
  63  |   await page.getByLabel('Culture name', { exact: true }).fill('River folk');
  64  |   await expect(page.getByLabel('Wilderness', { exact: true })).toBeVisible();
  65  |   await expect(edit('culture')).toHaveCount(0);
  66  |   await step('Career');
  67  |   await page.getByLabel('Artisan', { exact: true }).check();
  68  |   await page.getByLabel('Artisan: choose 2 skills 1', { exact: true }).selectOption('Alchemy');
  69  |   await edit('career').click();
  70  |   await expect(page.getByLabel('Artisan: choose 2 skills 1', { exact: true })).toHaveCount(0);
  71  |   await page.getByRole('button', { name: 'Keep Artisan', exact: true }).click();
  72  |   await expect(page.getByLabel('Artisan: choose 2 skills 1', { exact: true })).toHaveValue(
  73  |     'Alchemy',
  74  |   );
  75  |   await step('Class');
  76  |   await page.getByLabel('Fury', { exact: true }).check();
  77  |   await page.getByLabel('1, 0, 0', { exact: true }).check();
  78  |   await edit('class').click();
  79  |   await expect(page.getByLabel('1, 0, 0', { exact: true })).toHaveCount(0);
  80  |   await page.getByLabel('Elementalist', { exact: true }).check();
  81  |   await expect(summary('class')).toContainText('Elementalist');
  82  |   await step('Kit');
  83  |   await expect(edit('kit')).toHaveCount(0);
  84  |   await expect(page.getByLabel('Choose a kit', { exact: true })).toHaveCount(0);
  85  |   await step('Class');
  86  |   await expect(summary('class')).toContainText('Elementalist');
  87  |   await edit('class').click();
  88  |   await page.getByLabel('Fury', { exact: true }).check();
  89  |   await page.getByLabel('Berserker', { exact: true }).check();
  90  |   await step('Kit');
  91  |   await page.getByLabel('Choose a kit', { exact: true }).selectOption('Mountain');
  92  |   await expect(summary('kit')).toContainText('Mountain');
  93  |   await summary('kit')
  94  |     .getByRole('button', { name: 'Read Mountain in the rules', exact: true })
  95  |     .click();
  96  |   await expect(page.getByRole('dialog')).toContainText('Stamina');
  97  |   await page.getByRole('button', { name: 'Close rule', exact: true }).click();
  98  |   await edit('kit').click();
  99  |   await expect(page.getByLabel('Choose a kit', { exact: true })).toHaveValue('Mountain');
  100 |   await page.getByRole('button', { name: 'Keep Mountain', exact: true }).click();
  101 |   await step('Complication');
  102 |   await page.getByRole('button', { name: 'Use no complication', exact: true }).click();
  103 |   await expect(summary('complication')).toContainText('No complication');
  104 |   await edit('complication').click();
  105 |   await page.getByLabel('Complication', { exact: true }).selectOption('Elemental Inside');
  106 |   await expect(summary('complication')).toContainText('Elemental Inside');
  107 |   await summary('complication')
  108 |     .getByRole('button', { name: 'Read Elemental Inside in the rules', exact: true })
  109 |     .click();
  110 |   await expect(page.getByRole('dialog')).toContainText('Drawback');
  111 |   await page.keyboard.press('Escape');
  112 |   await edit('complication').click();
  113 |   await page.getByLabel('Complication', { exact: true }).selectOption('');
  114 |   await expect(summary('complication')).toContainText('No complication');
  115 |   await step('Career');
  116 |   await step('Complication');
  117 |   await expect(summary('complication')).toContainText('No complication');
  118 |   expect(await query('characters:listMine')).toEqual([]);
  119 |   await step('Determine Details');
  120 |   await page.getByLabel('Hero name', { exact: true }).fill(name);
  121 |   await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  122 |   await expect(page).toHaveURL(/\/characters\/(?!new\/)[^/]+\/wizard$/);
  123 |   const characterId = page.url().split('/').at(-2)!;
  124 |   const saved = await query('characters:get', { characterId });
  125 |   expect(saved.revision).toBe(1);
  126 |   expect(saved.selections).toContainEqual(
  127 |     expect.objectContaining({ decisionId: 'ancestry.choice', value: 'Polder' }),
  128 |   );
  129 |   expect(saved.selections).toContainEqual(
  130 |     expect.objectContaining({ decisionId: 'class.choice', value: 'Fury' }),
  131 |   );
  132 |   expect(
  133 |     saved.selections.some((choice: { decisionId: string }) =>
  134 |       choice.decisionId.startsWith('ancestry.devil.'),
  135 |     ),
  136 |   ).toBe(false);
  137 |   await page.reload();
  138 |   await step('Career');
  139 |   await expect(summary('career')).toContainText('Artisan');
```