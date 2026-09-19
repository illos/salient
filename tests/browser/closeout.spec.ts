// SPDX-License-Identifier: GPL-3.0-only
// A07 browser acceptance source. Uses the same authenticated commands and persisted reads as the UI.
import { expect, test, type Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { seedLocalHero } from './local-fixtures';
import { pacedSignUp } from './signup-pacing';

test.use({ actionTimeout: 30_000 });

const password = 'Test-only-salient-password-42';
async function register(page: Page, name: string, email: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  // V52: quiet interval before each sign-up; the helper observes the HTTP response.
  await pacedSignUp(page, async () => {
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  });
}

test('closeout awards once, is shared with observers, and paused session closure offers Void', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const contexts = await Promise.all(
    Array.from({ length: 3 }, () => browser.newContext({ viewport: { width: 1440, height: 960 } })),
  );
  try {
    const [director, player, observer] = await Promise.all(
      contexts.map(context => context.newPage()),
    );
    const stamp = crypto.randomUUID().slice(0, 8);
    const credentials = (role: string) => ({
      email: `closeout-${role}-${stamp}@example.test`,
      password,
    });
    await register(director, `Director ${stamp}`, credentials('director').email);
    await director.getByLabel('Campaign name').fill(`Closeout ${stamp}`);
    await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
    await expect(director.getByRole('heading', { name: `Closeout ${stamp}` })).toBeVisible();
    const campaignUrl = director.url();
    const campaignId = campaignUrl.split('/').at(-1)!;
    const invite = await director.getByLabel('Invitation link').inputValue();
    for (const [page, role] of [
      [player, 'player'],
      [observer, 'observer'],
    ] as const) {
      await register(page, `${role} ${stamp}`, credentials(role).email);
      await page.goto(invite);
      await page.getByRole('button', { name: 'Request to join' }).click();
      await director.getByRole('button', { name: 'Approve', exact: true }).click();
      await expect(director.getByLabel(`${role} ${stamp}`, { exact: true })).toBeVisible();
    }
    await director.getByLabel(`player ${stamp}`, { exact: true }).check();
    await director.getByRole('button', { name: 'Start session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Pause session', exact: true }),
    ).toBeVisible();
    const heroName = `Thorn ${stamp}`;
    const heroId = await seedLocalHero(
      campaignId,
      heroName,
      credentials('player'),
      credentials('director'),
    );
    const secondName = `Elwin ${stamp}`;
    const secondId = await seedLocalHero(
      campaignId,
      secondName,
      credentials('player'),
      credentials('director'),
    );
    const cli = async (...args: string[]) => {
      const result = await promisify(execFile)('pnpm', ['app', ...args], {
        env: {
          ...process.env,
          SALIENT_EMAIL: credentials('director').email,
          SALIENT_PASSWORD: password,
        },
      });
      return JSON.parse(result.stdout);
    };
    const command = (text: string) => cli('command', text, '--campaign', campaignId);
    const roster = () => cli('query', 'table:roster', JSON.stringify({ campaignId }));
    await Promise.all([director, player, observer].map(page => page.goto(`${campaignUrl}/table`)));
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    const startCombat = async () => {
      await director.getByRole('button', { name: 'Start combat', exact: true }).click();
      await director.getByRole('button', { name: 'OK', exact: true }).click();
      await director.getByRole('button', { name: 'Roll initiative (d10)', exact: true }).click();
      await director.getByRole('button', { name: 'Heroes first', exact: true }).click();
      await expect(
        director.getByRole('status').filter({ hasText: /Running · Combat · Round 1/ }),
      ).toBeVisible();
    };
    await startCombat();
    await command(`@{character:${heroId}} /adjust surges value=2`);
    await command(`@{character:${heroId}} /adjust temporary-stamina value=3`);
    const before = await roster();
    await director.getByRole('button', { name: 'End combat', exact: true }).click();
    for (const page of [director, player, observer]) {
      await expect(
        page.getByRole('heading', { name: 'Combat closeout', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Take turn', exact: true })).toHaveCount(0);
    }
    await expect(observer.getByRole('button', { name: 'Confirm Victory award' })).toHaveCount(0);
    await expect(player.getByRole('button', { name: 'Finish cleanup', exact: true })).toHaveCount(
      0,
    );
    await expect(director.getByLabel('Victories to award')).toHaveValue('1');
    await director.getByLabel(`Award to ${heroName}`, { exact: false }).check();
    await director.getByLabel(`Award to ${secondName}`, { exact: false }).check();
    await director.getByRole('button', { name: 'Confirm Victory award', exact: true }).click();
    await expect(
      observer.getByRole('status').filter({ hasText: 'Victory award confirmed: 1' }),
    ).toBeVisible();
    const sheet = player.getByRole('article', { name: `${heroName} character sheet` });
    await expect(sheet.getByText('Victories', { exact: true }).locator('..')).toContainText('1');
    for (const [page, role] of [
      [director, 'director'],
      [player, 'player'],
      [observer, 'observer'],
    ] as const)
      await page.screenshot({ path: `.playtest/a07/closeout-${role}.png`, fullPage: true });
    const awarded = await roster();
    for (const id of [heroId, secondId]) {
      const index = before.heroes.findIndex((hero: { id: string }) => hero.id === id);
      expect(awarded.heroes[index].live.victories).toBe(before.heroes[index].live.victories + 1);
    }
    await director.getByRole('button', { name: 'Finish cleanup', exact: true }).click();
    await expect(
      director.getByRole('status').filter({ hasText: /Running · Free play$/ }),
    ).toBeVisible();
    const cleaned = await roster();
    const thorn = cleaned.heroes.find((hero: { id: string }) => hero.id === heroId);
    expect(thorn.live.surges).toBe(0);
    expect(thorn.live.temporaryStamina).toBe(0);
    expect(thorn.live.victories).toBe(1);
    const original = before.heroes.find((hero: { id: string }) => hero.id === heroId);
    expect(thorn.live.stamina).toBe(original.live.stamina);
    expect(thorn.live.conditions).toEqual(original.live.conditions);

    await startCombat();
    const atStart = await roster();
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await command(`@{character:${heroId}} /adjust surges value=2`);
    await director.goto(campaignUrl);
    await director.getByRole('button', { name: 'Pause session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Resume session', exact: true }),
    ).toBeVisible();
    await director.getByRole('button', { name: 'End session', exact: true }).click();
    await expect(
      director.getByRole('heading', { name: 'End session · Void active combat' }),
    ).toBeVisible();
    await director.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect((await roster()).session.status).toBe('paused');
    await director.goto(`${campaignUrl}/table`);
    await director.getByRole('button', { name: 'Void combat', exact: true }).click();
    await director.getByRole('button', { name: 'Restore starting state', exact: true }).click();
    await expect(director.getByRole('button', { name: 'Void combat', exact: true })).toHaveCount(0);
    const reset = await roster();
    expect(reset.session.status).toBe('paused');
    expect(reset.foes).toEqual(atStart.foes);
    expect(reset.heroes.find((hero: { id: string }) => hero.id === heroId).live.surges).toBe(0);
    await expect(director.getByRole('button', { name: 'Add foe', exact: true })).toBeDisabled();
    await director.screenshot({ path: '.playtest/a07/paused-reset.png', fullPage: true });
    await director.goto(campaignUrl);
    await director.getByRole('button', { name: 'Resume session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Pause session', exact: true }),
    ).toBeVisible();
    await director.goto(`${campaignUrl}/table`);
    await startCombat();
    await command(`@{character:${heroId}} /adjust surges value=2`);
    await director.goto(campaignUrl);
    await director.getByRole('button', { name: 'Pause session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Resume session', exact: true }),
    ).toBeVisible();
    await director.getByRole('button', { name: 'End session', exact: true }).click();
    await director.getByRole('button', { name: 'Keep current state', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Start session', exact: true }),
    ).toBeVisible();
    const closed = await roster();
    expect(closed.session).toBeNull();
    expect(closed.heroes.find((hero: { id: string }) => hero.id === heroId).live.surges).toBe(2);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
