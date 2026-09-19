# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: closeout.spec.ts >> closeout awards once, is shared with observers, and paused session closure offers Void
- Location: tests/browser/closeout.spec.ts:21:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Combat closeout', exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Combat closeout', exact: true }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Combat closeout', exact: true })

```

```yaml
- heading "This page is unavailable" [level=1]
- alert: "Function execution timed out (maximum duration: 1s) Called by client"
- button "Retry"
- link "Back to campaigns":
  - /url: /
```

# Test source

```ts
  4   | import { execFile } from 'node:child_process';
  5   | import { promisify } from 'node:util';
  6   | import { seedLocalHero } from './local-fixtures';
  7   | 
  8   | test.use({ actionTimeout: 30_000 });
  9   | 
  10  | const password = 'Test-only-salient-password-42';
  11  | async function register(page: Page, name: string, email: string) {
  12  |   await page.goto('/login');
  13  |   await page.getByRole('button', { name: 'New here? Create an account' }).click();
  14  |   await page.getByLabel('Display name').fill(name);
  15  |   await page.getByLabel('Email', { exact: true }).fill(email);
  16  |   await page.getByLabel('Password', { exact: true }).fill(password);
  17  |   await page.getByRole('button', { name: 'Create account', exact: true }).click();
  18  |   await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  19  | }
  20  | 
  21  | test('closeout awards once, is shared with observers, and paused session closure offers Void', async ({
  22  |   browser,
  23  | }) => {
  24  |   test.setTimeout(300_000);
  25  |   const contexts = await Promise.all(
  26  |     Array.from({ length: 3 }, () => browser.newContext({ viewport: { width: 1440, height: 960 } })),
  27  |   );
  28  |   try {
  29  |     const [director, player, observer] = await Promise.all(
  30  |       contexts.map(context => context.newPage()),
  31  |     );
  32  |     const stamp = crypto.randomUUID().slice(0, 8);
  33  |     const credentials = (role: string) => ({
  34  |       email: `closeout-${role}-${stamp}@example.test`,
  35  |       password,
  36  |     });
  37  |     await register(director, `Director ${stamp}`, credentials('director').email);
  38  |     await director.getByLabel('Campaign name').fill(`Closeout ${stamp}`);
  39  |     await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
  40  |     await expect(director.getByRole('heading', { name: `Closeout ${stamp}` })).toBeVisible();
  41  |     const campaignUrl = director.url();
  42  |     const campaignId = campaignUrl.split('/').at(-1)!;
  43  |     const invite = await director.getByLabel('Invitation link').inputValue();
  44  |     for (const [page, role] of [
  45  |       [player, 'player'],
  46  |       [observer, 'observer'],
  47  |     ] as const) {
  48  |       await register(page, `${role} ${stamp}`, credentials(role).email);
  49  |       await page.goto(invite);
  50  |       await page.getByRole('button', { name: 'Request to join' }).click();
  51  |       await director.getByRole('button', { name: 'Approve', exact: true }).click();
  52  |       await expect(director.getByLabel(`${role} ${stamp}`, { exact: true })).toBeVisible();
  53  |     }
  54  |     await director.getByLabel(`player ${stamp}`, { exact: true }).check();
  55  |     await director.getByRole('button', { name: 'Start session', exact: true }).click();
  56  |     await expect(
  57  |       director.getByRole('button', { name: 'Pause session', exact: true }),
  58  |     ).toBeVisible();
  59  |     const heroName = `Thorn ${stamp}`;
  60  |     const heroId = await seedLocalHero(
  61  |       campaignId,
  62  |       heroName,
  63  |       credentials('player'),
  64  |       credentials('director'),
  65  |     );
  66  |     const secondName = `Elwin ${stamp}`;
  67  |     const secondId = await seedLocalHero(
  68  |       campaignId,
  69  |       secondName,
  70  |       credentials('player'),
  71  |       credentials('director'),
  72  |     );
  73  |     const cli = async (...args: string[]) => {
  74  |       const result = await promisify(execFile)('pnpm', ['app', ...args], {
  75  |         env: {
  76  |           ...process.env,
  77  |           SALIENT_EMAIL: credentials('director').email,
  78  |           SALIENT_PASSWORD: password,
  79  |         },
  80  |       });
  81  |       return JSON.parse(result.stdout);
  82  |     };
  83  |     const command = (text: string) => cli('command', text, '--campaign', campaignId);
  84  |     const roster = () => cli('query', 'table:roster', JSON.stringify({ campaignId }));
  85  |     await Promise.all([director, player, observer].map(page => page.goto(`${campaignUrl}/table`)));
  86  |     await director.getByRole('button', { name: 'Add foe', exact: true }).click();
  87  |     const startCombat = async () => {
  88  |       await director.getByRole('button', { name: 'Start combat', exact: true }).click();
  89  |       await director.getByRole('button', { name: 'OK', exact: true }).click();
  90  |       await director.getByRole('button', { name: 'Roll initiative (d10)', exact: true }).click();
  91  |       await director.getByRole('button', { name: 'Heroes first', exact: true }).click();
  92  |       await expect(
  93  |         director.getByRole('status').filter({ hasText: /Running · Combat · Round 1/ }),
  94  |       ).toBeVisible();
  95  |     };
  96  |     await startCombat();
  97  |     await command(`@{character:${heroId}} /adjust surges value=2`);
  98  |     await command(`@{character:${heroId}} /adjust temporary-stamina value=3`);
  99  |     const before = await roster();
  100 |     await director.getByRole('button', { name: 'End combat', exact: true }).click();
  101 |     for (const page of [director, player, observer]) {
  102 |       await expect(
  103 |         page.getByRole('heading', { name: 'Combat closeout', exact: true }),
> 104 |       ).toBeVisible();
      |         ^ Error: expect(locator).toBeVisible() failed
  105 |       await expect(page.getByRole('button', { name: 'Take turn', exact: true })).toHaveCount(0);
  106 |     }
  107 |     await expect(observer.getByRole('button', { name: 'Confirm Victory award' })).toHaveCount(0);
  108 |     await expect(player.getByRole('button', { name: 'Finish cleanup', exact: true })).toHaveCount(
  109 |       0,
  110 |     );
  111 |     await expect(director.getByLabel('Victories to award')).toHaveValue('1');
  112 |     await director.getByLabel(`Award to ${heroName}`, { exact: false }).check();
  113 |     await director.getByLabel(`Award to ${secondName}`, { exact: false }).check();
  114 |     await director.getByRole('button', { name: 'Confirm Victory award', exact: true }).click();
  115 |     await expect(
  116 |       observer.getByRole('status').filter({ hasText: 'Victory award confirmed: 1' }),
  117 |     ).toBeVisible();
  118 |     const sheet = player.getByRole('article', { name: `${heroName} character sheet` });
  119 |     await expect(sheet.getByText('Victories', { exact: true }).locator('..')).toContainText('1');
  120 |     for (const [page, role] of [
  121 |       [director, 'director'],
  122 |       [player, 'player'],
  123 |       [observer, 'observer'],
  124 |     ] as const)
  125 |       await page.screenshot({ path: `.playtest/a07/closeout-${role}.png`, fullPage: true });
  126 |     const awarded = await roster();
  127 |     for (const id of [heroId, secondId]) {
  128 |       const index = before.heroes.findIndex((hero: { id: string }) => hero.id === id);
  129 |       expect(awarded.heroes[index].live.victories).toBe(before.heroes[index].live.victories + 1);
  130 |     }
  131 |     await director.getByRole('button', { name: 'Finish cleanup', exact: true }).click();
  132 |     await expect(
  133 |       director.getByRole('status').filter({ hasText: /Running · Free play$/ }),
  134 |     ).toBeVisible();
  135 |     const cleaned = await roster();
  136 |     const thorn = cleaned.heroes.find((hero: { id: string }) => hero.id === heroId);
  137 |     expect(thorn.live.surges).toBe(0);
  138 |     expect(thorn.live.temporaryStamina).toBe(0);
  139 |     expect(thorn.live.victories).toBe(1);
  140 |     const original = before.heroes.find((hero: { id: string }) => hero.id === heroId);
  141 |     expect(thorn.live.stamina).toBe(original.live.stamina);
  142 |     expect(thorn.live.conditions).toEqual(original.live.conditions);
  143 | 
  144 |     await startCombat();
  145 |     const atStart = await roster();
  146 |     await director.getByRole('button', { name: 'Add foe', exact: true }).click();
  147 |     await command(`@{character:${heroId}} /adjust surges value=2`);
  148 |     await director.goto(campaignUrl);
  149 |     await director.getByRole('button', { name: 'Pause session', exact: true }).click();
  150 |     await expect(
  151 |       director.getByRole('button', { name: 'Resume session', exact: true }),
  152 |     ).toBeVisible();
  153 |     await director.getByRole('button', { name: 'End session', exact: true }).click();
  154 |     await expect(
  155 |       director.getByRole('heading', { name: 'End session · Void active combat' }),
  156 |     ).toBeVisible();
  157 |     await director.getByRole('button', { name: 'Cancel', exact: true }).click();
  158 |     expect((await roster()).session.status).toBe('paused');
  159 |     await director.goto(`${campaignUrl}/table`);
  160 |     await director.getByRole('button', { name: 'Void combat', exact: true }).click();
  161 |     await director.getByRole('button', { name: 'Restore starting state', exact: true }).click();
  162 |     await expect(director.getByRole('button', { name: 'Void combat', exact: true })).toHaveCount(0);
  163 |     const reset = await roster();
  164 |     expect(reset.session.status).toBe('paused');
  165 |     expect(reset.foes).toEqual(atStart.foes);
  166 |     expect(reset.heroes.find((hero: { id: string }) => hero.id === heroId).live.surges).toBe(0);
  167 |     await expect(director.getByRole('button', { name: 'Add foe', exact: true })).toBeDisabled();
  168 |     await director.screenshot({ path: '.playtest/a07/paused-reset.png', fullPage: true });
  169 |     await director.goto(campaignUrl);
  170 |     await director.getByRole('button', { name: 'Resume session', exact: true }).click();
  171 |     await expect(
  172 |       director.getByRole('button', { name: 'Pause session', exact: true }),
  173 |     ).toBeVisible();
  174 |     await director.goto(`${campaignUrl}/table`);
  175 |     await startCombat();
  176 |     await command(`@{character:${heroId}} /adjust surges value=2`);
  177 |     await director.goto(campaignUrl);
  178 |     await director.getByRole('button', { name: 'Pause session', exact: true }).click();
  179 |     await expect(
  180 |       director.getByRole('button', { name: 'Resume session', exact: true }),
  181 |     ).toBeVisible();
  182 |     await director.getByRole('button', { name: 'End session', exact: true }).click();
  183 |     await director.getByRole('button', { name: 'Keep current state', exact: true }).click();
  184 |     await expect(
  185 |       director.getByRole('button', { name: 'Start session', exact: true }),
  186 |     ).toBeVisible();
  187 |     const closed = await roster();
  188 |     expect(closed.session).toBeNull();
  189 |     expect(closed.heroes.find((hero: { id: string }) => hero.id === heroId).live.surges).toBe(2);
  190 |   } finally {
  191 |     await Promise.all(contexts.map(context => context.close()));
  192 |   }
  193 | });
  194 | 
```