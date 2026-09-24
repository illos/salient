// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 screenshot and layout fixtures shared by the shell spec and the phase-2 slices: a Director
 * and a player with a campaign, an approved wizard-path hero (tests/browser/local-fixtures.ts),
 * two loaded foes, a running session and optionally a committed encounter in its turns phase.
 * `shoot` names captures `.playtest/v21/<area>/<name>-<theme>-<w>x<h>.png`.
 */
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { seedLocalHero, type Credentials } from './local-fixtures';

export const PASSWORD = 'Test-only-salient-password-42';
export type ThemeName = 'light' | 'dark';
export type Viewport = { width: number; height: number };
export const VIEWPORTS: Viewport[] = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
export const THEMES: ThemeName[] = ['light', 'dark'];

export async function register(page: Page, name: string, email: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
}

export interface TableFixture {
  stamp: string;
  campaignId: string;
  campaignUrl: string;
  tableUrl: string;
  heroName: string;
  heroId: string;
  director: Page;
  player: Page;
  credentials: (role: 'director' | 'player') => Credentials;
  close: () => Promise<void>;
}

/**
 * Director + player, campaign, approved hero, two Goblin Warriors, running session; both pages
 * end on the table route. With `combat`, the Director starts combat (OK, roll, heroes first)
 * and the player takes the first turn so the encounter is in its turns phase.
 */
export async function createTable(
  browser: Browser,
  options: { combat?: boolean; viewport?: Viewport } = {},
): Promise<TableFixture> {
  const viewport = options.viewport ?? VIEWPORTS[0]!;
  const contexts: BrowserContext[] = await Promise.all(
    Array.from({ length: 2 }, () => browser.newContext({ viewport })),
  );
  const [director, player] = (await Promise.all(contexts.map(c => c.newPage()))) as [Page, Page];
  const stamp = crypto.randomUUID().slice(0, 8);
  const credentials = (role: 'director' | 'player'): Credentials => ({
    email: `v21-${role}-${stamp}@example.test`,
    password: PASSWORD,
  });
  await register(director, `Director ${stamp}`, credentials('director').email);
  await director.getByLabel('Campaign name').fill(`Blackcastle ${stamp}`);
  await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
  await expect(director.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  const campaignUrl = director.url();
  const campaignId = campaignUrl.split('/').at(-1)!;
  // The invitation link lives in the Manage players card, opened from the campaign header.
  await director.getByRole('button', { name: 'Invite players', exact: true }).click();
  const invite = await director.getByLabel('Invitation link').inputValue();
  await register(player, `Player ${stamp}`, credentials('player').email);
  await player.goto(invite);
  await player.getByRole('button', { name: 'Request to join' }).click();
  await director.getByRole('button', { name: 'Approve', exact: true }).click();
  const heroName = `Thorn ${stamp}`;
  const heroId = await seedLocalHero(
    campaignId,
    heroName,
    credentials('player'),
    credentials('director'),
  );
  // Foes are managed between sessions on the campaign page; the player's campaign page shows
  // one Stamina bar per loaded foe (journey.spec.ts asserts the same).
  await player.goto(campaignUrl);
  await expect(player.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  for (const count of [1, 2]) {
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await expect(player.getByRole('progressbar', { name: 'Goblin Warrior Stamina' })).toHaveCount(
      count,
    );
  }
  await director.getByRole('checkbox', { name: `Player ${stamp}`, exact: true }).check();
  await director.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(director.getByRole('button', { name: 'Pause session', exact: true })).toBeVisible();
  const tableUrl = `${campaignUrl}/table`;
  await Promise.all([director, player].map(page => page.goto(tableUrl)));
  for (const page of [director, player])
    await expect(page.getByRole('heading', { name: 'Heroes', exact: true })).toBeVisible();
  if (options.combat) {
    await director.getByRole('button', { name: 'Start combat', exact: true }).click();
    await director.getByRole('button', { name: 'OK', exact: true }).click();
    await director.getByRole('button', { name: 'Roll initiative (d10)', exact: true }).click();
    await director.getByRole('button', { name: 'Heroes first', exact: true }).click();
    await player.getByRole('button', { name: 'Take turn', exact: true }).first().click();
    await expect(player.getByRole('status').filter({ hasText: /Combat · Round 1/i })).toBeVisible();
  }
  return {
    stamp,
    campaignId,
    campaignUrl,
    tableUrl,
    heroName,
    heroId,
    director,
    player,
    credentials,
    close: async () => {
      await Promise.all(contexts.map(context => context.close()));
    },
  };
}

/** Applies the stored appearance preference the way web/theme.ts reads it, without a reload. */
export async function setTheme(page: Page, theme: ThemeName) {
  await page.evaluate(next => {
    localStorage.setItem('salient.theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  }, theme);
  await page.waitForTimeout(400);
}

/** Captures the viewport to `.playtest/v21/<area>/<name>-<theme>-<w>x<h>.png` and returns the path. */
export async function shoot(
  page: Page,
  area: string,
  name: string,
  options: { theme: ThemeName; viewport: Viewport; fullPage?: boolean },
) {
  const { theme, viewport } = options;
  const current = page.viewportSize();
  if (!current || current.width !== viewport.width || current.height !== viewport.height)
    await page.setViewportSize(viewport);
  await setTheme(page, theme);
  const dir = `.playtest/v21/${area}`;
  mkdirSync(dir, { recursive: true });
  const path = `${dir}/${name}-${theme}-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({ path, fullPage: options.fullPage ?? false });
  return path;
}
