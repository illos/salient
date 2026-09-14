// SPDX-License-Identifier: GPL-3.0-only
// A04 browser walkthrough: the Director starts combat with one hero and one Goblin Warrior through
// the staged card, a player rolls initiative, the Director chooses the side, the player takes
// Thorn's turn (only that player's hero pane switches; a second player's pane does not), ends it,
// the Director takes and ends the goblin's turn, and round 2 is shown. Needs both dev servers and
// this checkout's local deployment, like table-audit.spec.ts.
import { expect, test, type Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { seedLocalHero } from './local-fixtures';

const password = 'Test-only-salient-password-42';
async function register(page: Page, name: string, email: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
}

test('Director starts combat; a player takes and ends a turn; the round advances', async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const contexts = await Promise.all(
    Array.from({ length: 3 }, () => browser.newContext({ viewport: { width: 1440, height: 960 } })),
  );
  try {
    const [director, playerA, playerB] = await Promise.all(
      contexts.map(context => context.newPage()),
    );
    const stamp = crypto.randomUUID().slice(0, 8);
    await register(director, `Director ${stamp}`, `combat-director-${stamp}@example.test`);
    await director.getByLabel('Campaign name').fill(`Combat ${stamp}`);
    await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
    await expect(director.getByRole('heading', { name: `Combat ${stamp}` })).toBeVisible();
    const campaignUrl = director.url();
    const campaignId = campaignUrl.split('/').at(-1)!;
    const invite = await director.getByLabel('Invitation link').inputValue();
    for (const [page, role] of [
      [playerA, 'a'],
      [playerB, 'b'],
    ] as const) {
      await register(page, `Player ${role} ${stamp}`, `combat-${role}-${stamp}@example.test`);
      await page.goto(invite);
      await page.getByRole('button', { name: 'Request to join' }).click();
      await director.getByRole('button', { name: 'Approve', exact: true }).click();
    }
    await director.getByLabel(`Player a ${stamp}`, { exact: true }).check();
    await director.getByLabel(`Player b ${stamp}`, { exact: true }).check();
    await director.getByRole('button', { name: 'Start session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Pause session', exact: true }),
    ).toBeVisible();
    const asRole = async (role: 'director' | 'a' | 'b', ...args: string[]) => {
      const result = await promisify(execFile)('pnpm', ['app', ...args], {
        env: {
          ...process.env,
          SALIENT_EMAIL: `combat-${role}-${stamp}@example.test`,
          SALIENT_PASSWORD: password,
        },
      });
      return JSON.parse(result.stdout);
    };
    const credentials = (role: string) => ({
      email: `combat-${role}-${stamp}@example.test`,
      password,
    });
    // A02: heroes reach the table through admission (evaluated build, R03 live values).
    await seedLocalHero(campaignId, `Thorn ${stamp}`, credentials('a'), credentials('director'));
    await seedLocalHero(campaignId, `Elwin ${stamp}`, credentials('b'), credentials('director'));
    await Promise.all([director, playerA, playerB].map(page => page.goto(`${campaignUrl}/table`)));
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await expect(playerA.getByRole('progressbar', { name: 'Goblin Warrior health' })).toBeVisible();
    // Step 1: the staged setup card; OK commits once.
    await director.getByRole('button', { name: 'Start combat', exact: true }).click();
    await expect(director.getByText('Setup · draft')).toBeVisible();
    await expect(playerA.getByText('The Director is preparing combat.')).toBeVisible();
    await expect(playerA.getByRole('button', { name: 'OK', exact: true })).toHaveCount(0);
    await director.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(director.getByText('Combat committed · roll initiative')).toBeVisible();
    const encounter = await asRole(
      'director',
      'query',
      'encounters:current',
      JSON.stringify({ campaignId }),
    );
    expect(encounter.status).toBe('committed');
    expect(encounter.phase).toBe('roll');
    // Step 2: any active player rolls; the Director chooses the side on either result.
    await playerA.getByRole('button', { name: 'Roll initiative (d10)', exact: true }).click();
    await expect(director.getByText('Combat committed · who goes first?')).toBeVisible();
    await director.getByRole('button', { name: 'Heroes first', exact: true }).click();
    await expect(director.getByText(/Combat · round 1/)).toBeVisible();
    await expect(playerB.getByText(/Combat · round 1/)).toBeVisible();
    // Player A takes Thorn's turn from the hero pane; only A's pane switches to Thorn.
    const thornRowA = playerA
      .locator('li')
      .filter({ has: playerA.getByText(`Thorn ${stamp}`, { exact: true }) });
    await thornRowA.getByRole('button', { name: 'Take turn', exact: true }).first().click();
    await expect(
      playerA.locator('li[aria-current="true"]').filter({ hasText: `Thorn ${stamp}` }),
    ).toHaveCount(2);
    await expect(
      playerB.locator('li[aria-current="true"]').filter({ hasText: `Thorn ${stamp}` }),
    ).toHaveCount(1);
    await expect(
      playerA.locator('strong').filter({ hasText: /takes their turn \(round 1\)/ }),
    ).toHaveCount(1);
    await expect(playerB.getByRole('button', { name: 'End turn', exact: true })).toHaveCount(0);
    // Step 7: explicit End turn, then the Director's group, then round 2 with one Malice gain.
    await playerA.getByRole('button', { name: 'End turn', exact: true }).first().click();
    await expect(director.getByText(/Round 1 · Foes to act/)).toBeVisible();
    const goblinRow = director
      .locator('li')
      .filter({ has: director.getByText('Goblin Warrior', { exact: true }) });
    await goblinRow.getByRole('button', { name: 'Take turn', exact: true }).first().click();
    await director.getByRole('button', { name: 'End turn', exact: true }).first().click();
    // The heroes' side still has Elwin's group: play returns to it; round 1 ends after that turn.
    await expect(director.getByText(/Round 1 · Heroes to act/)).toBeVisible();
    const elwinRowB = playerB
      .locator('li')
      .filter({ has: playerB.getByText(`Elwin ${stamp}`, { exact: true }) });
    await elwinRowB.getByRole('button', { name: 'Take turn', exact: true }).first().click();
    await playerB.getByRole('button', { name: 'End turn', exact: true }).first().click();
    await expect(director.getByText(/Combat · round 2/)).toBeVisible();
    await expect(playerA.getByText(/Combat · round 2/)).toBeVisible();
    await expect(
      director
        .locator('strong')
        .filter({ hasText: 'Malice: round 2 gain — 2 heroes + round 2 = 4' }),
    ).toHaveCount(1);
    await expect(
      playerA.locator('strong').filter({ hasText: 'Malice: round 2 gain applied.' }),
    ).toHaveCount(1);
    const after = await asRole(
      'director',
      'query',
      'encounters:current',
      JSON.stringify({ campaignId }),
    );
    expect(after.round).toBe(2);
    expect(after.activeTurn).toBeNull();
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
