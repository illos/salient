# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: v26-baseline.spec.ts >> V26 real-app regression: consecutive corrections and ten abilities on proper turns
- Location: tests/browser/v26-baseline.spec.ts:79:1

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Add foe', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "Salient" [ref=e6] [cursor=pointer]:
        - /url: /
      - navigation "Primary" [ref=e8]:
        - link "Campaigns" [ref=e9] [cursor=pointer]:
          - /url: /
        - link "Characters" [ref=e10] [cursor=pointer]:
          - /url: /characters
        - link "Rules" [ref=e11] [cursor=pointer]:
          - /url: /rules
        - link "Foes" [ref=e12] [cursor=pointer]:
          - /url: /foes
      - generic [ref=e13]:
        - status [ref=e14]: ● Connected
        - group "Appearance" [ref=e15]:
          - button "Light" [ref=e16]
          - button "Dark" [ref=e17]
          - button "System" [pressed] [ref=e18]
        - generic [ref=e19]: Director 782c1da8
        - button "Sign out" [ref=e20]
  - main [ref=e21]:
    - generic [ref=e23]:
      - heading "This page is unavailable" [level=1] [ref=e24]
      - alert [ref=e25]: "Function execution timed out (maximum duration: 1s) Called by client"
      - generic [ref=e26]:
        - button "Retry" [ref=e27]
        - link "Back to campaigns" [ref=e28] [cursor=pointer]:
          - /url: /
  - contentinfo [ref=e29]: v0.01 · pre-alpha
```

# Test source

```ts
  1   | // SPDX-License-Identifier: GPL-3.0-only
  2   | /**
  3   |  * V21 screenshot and layout fixtures shared by the shell spec and the phase-2 slices: a Director
  4   |  * and a player with a campaign, an approved wizard-path hero (tests/browser/local-fixtures.ts),
  5   |  * two loaded foes, a running session and optionally a committed encounter in its turns phase.
  6   |  * `shoot` names captures `.playtest/v21/<area>/<name>-<theme>-<w>x<h>.png`.
  7   |  */
  8   | import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
  9   | import { mkdirSync } from 'node:fs';
  10  | import { seedLocalHero, type Credentials } from './local-fixtures';
  11  | 
  12  | export const PASSWORD = 'Test-only-salient-password-42';
  13  | export type ThemeName = 'light' | 'dark';
  14  | export type Viewport = { width: number; height: number };
  15  | export const VIEWPORTS: Viewport[] = [
  16  |   { width: 1440, height: 900 },
  17  |   { width: 1920, height: 1080 },
  18  | ];
  19  | export const THEMES: ThemeName[] = ['light', 'dark'];
  20  | 
  21  | export async function register(page: Page, name: string, email: string) {
  22  |   await page.goto('/login');
  23  |   await page.getByRole('button', { name: 'New here? Create an account' }).click();
  24  |   await page.getByLabel('Display name').fill(name);
  25  |   await page.getByLabel('Email', { exact: true }).fill(email);
  26  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  27  |   await page.getByRole('button', { name: 'Create account', exact: true }).click();
  28  |   await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  29  | }
  30  | 
  31  | export interface TableFixture {
  32  |   stamp: string;
  33  |   campaignId: string;
  34  |   campaignUrl: string;
  35  |   tableUrl: string;
  36  |   heroName: string;
  37  |   heroId: string;
  38  |   director: Page;
  39  |   player: Page;
  40  |   credentials: (role: 'director' | 'player') => Credentials;
  41  |   close: () => Promise<void>;
  42  | }
  43  | 
  44  | /**
  45  |  * Director + player, campaign, approved hero, two Goblin Warriors, running session; both pages
  46  |  * end on the table route. With `combat`, the Director starts combat (OK, roll, heroes first)
  47  |  * and the player takes the first turn so the encounter is in its turns phase.
  48  |  */
  49  | export async function createTable(
  50  |   browser: Browser,
  51  |   options: { combat?: boolean; viewport?: Viewport } = {},
  52  | ): Promise<TableFixture> {
  53  |   const viewport = options.viewport ?? VIEWPORTS[0]!;
  54  |   const contexts: BrowserContext[] = await Promise.all(
  55  |     Array.from({ length: 2 }, () => browser.newContext({ viewport })),
  56  |   );
  57  |   const [director, player] = (await Promise.all(contexts.map(c => c.newPage()))) as [Page, Page];
  58  |   const stamp = crypto.randomUUID().slice(0, 8);
  59  |   const credentials = (role: 'director' | 'player'): Credentials => ({
  60  |     email: `v21-${role}-${stamp}@example.test`,
  61  |     password: PASSWORD,
  62  |   });
  63  |   await register(director, `Director ${stamp}`, credentials('director').email);
  64  |   await director.getByLabel('Campaign name').fill(`Blackcastle ${stamp}`);
  65  |   await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
  66  |   await expect(director.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  67  |   const campaignUrl = director.url();
  68  |   const campaignId = campaignUrl.split('/').at(-1)!;
  69  |   const invite = await director.getByLabel('Invitation link').inputValue();
  70  |   await register(player, `Player ${stamp}`, credentials('player').email);
  71  |   await player.goto(invite);
  72  |   await player.getByRole('button', { name: 'Request to join' }).click();
  73  |   await director.getByRole('button', { name: 'Approve', exact: true }).click();
  74  |   const heroName = `Thorn ${stamp}`;
  75  |   const heroId = await seedLocalHero(
  76  |     campaignId,
  77  |     heroName,
  78  |     credentials('player'),
  79  |     credentials('director'),
  80  |   );
  81  |   // Foes are managed between sessions on the campaign page; the player's campaign page shows
  82  |   // one Stamina bar per loaded foe (journey.spec.ts asserts the same).
  83  |   await player.goto(campaignUrl);
  84  |   await expect(player.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  85  |   for (const count of [1, 2]) {
> 86  |     await director.getByRole('button', { name: 'Add foe', exact: true }).click();
      |                                                                          ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  87  |     await expect(player.getByRole('progressbar', { name: 'Goblin Warrior Stamina' })).toHaveCount(
  88  |       count,
  89  |     );
  90  |   }
  91  |   await director.getByRole('checkbox', { name: `Player ${stamp}`, exact: true }).check();
  92  |   await director.getByRole('button', { name: 'Start session', exact: true }).click();
  93  |   await expect(director.getByRole('button', { name: 'Pause session', exact: true })).toBeVisible();
  94  |   const tableUrl = `${campaignUrl}/table`;
  95  |   await Promise.all([director, player].map(page => page.goto(tableUrl)));
  96  |   for (const page of [director, player])
  97  |     await expect(page.getByRole('heading', { name: 'Heroes', exact: true })).toBeVisible();
  98  |   if (options.combat) {
  99  |     await director.getByRole('button', { name: 'Start combat', exact: true }).click();
  100 |     await director.getByRole('button', { name: 'OK', exact: true }).click();
  101 |     await director.getByRole('button', { name: 'Roll initiative (d10)', exact: true }).click();
  102 |     await director.getByRole('button', { name: 'Heroes first', exact: true }).click();
  103 |     await player.getByRole('button', { name: 'Take turn', exact: true }).first().click();
  104 |     await expect(player.getByRole('status').filter({ hasText: /Combat · Round 1/i })).toBeVisible();
  105 |   }
  106 |   return {
  107 |     stamp,
  108 |     campaignId,
  109 |     campaignUrl,
  110 |     tableUrl,
  111 |     heroName,
  112 |     heroId,
  113 |     director,
  114 |     player,
  115 |     credentials,
  116 |     close: async () => {
  117 |       await Promise.all(contexts.map(context => context.close()));
  118 |     },
  119 |   };
  120 | }
  121 | 
  122 | /** Applies the stored appearance preference the way web/theme.ts reads it, without a reload. */
  123 | export async function setTheme(page: Page, theme: ThemeName) {
  124 |   await page.evaluate(next => {
  125 |     localStorage.setItem('salient.theme', next);
  126 |     document.documentElement.classList.toggle('dark', next === 'dark');
  127 |     document.documentElement.dataset.theme = next;
  128 |     document.documentElement.style.colorScheme = next;
  129 |   }, theme);
  130 |   await page.waitForTimeout(400);
  131 | }
  132 | 
  133 | /** Captures the viewport to `.playtest/v21/<area>/<name>-<theme>-<w>x<h>.png` and returns the path. */
  134 | export async function shoot(
  135 |   page: Page,
  136 |   area: string,
  137 |   name: string,
  138 |   options: { theme: ThemeName; viewport: Viewport; fullPage?: boolean },
  139 | ) {
  140 |   const { theme, viewport } = options;
  141 |   const current = page.viewportSize();
  142 |   if (!current || current.width !== viewport.width || current.height !== viewport.height)
  143 |     await page.setViewportSize(viewport);
  144 |   await setTheme(page, theme);
  145 |   const dir = `.playtest/v21/${area}`;
  146 |   mkdirSync(dir, { recursive: true });
  147 |   const path = `${dir}/${name}-${theme}-${viewport.width}x${viewport.height}.png`;
  148 |   await page.screenshot({ path, fullPage: options.fullPage ?? false });
  149 |   return path;
  150 | }
  151 | 
```