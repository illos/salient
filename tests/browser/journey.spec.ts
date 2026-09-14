import { expect, test, type Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

async function register(page: Page, name: string, email: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Test-only-salient-password-42');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
}

test('accounts, invitation approval, session lifecycle, private draft persistence and reconnect', async ({
  browser,
}) => {
  const directorContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const observerContext = await browser.newContext();
  const director = await directorContext.newPage();
  const player = await playerContext.newPage();
  const observer = await observerContext.newPage();
  const stamp = crypto.randomUUID().slice(0, 8);
  const email = `director-${stamp}@example.test`;
  await register(director, `Director ${stamp}`, email);
  await director.getByLabel('Campaign name').fill(`Blackcastle ${stamp}`);
  await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
  await expect(director.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  const campaignUrl = director.url();
  const invite = await director.getByLabel('Invitation link').inputValue();

  await observer.goto(invite);
  await expect(observer.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  await expect(observer.getByRole('link', { name: 'Sign in to request membership' })).toBeVisible();
  await register(observer, `Observer ${stamp}`, `observer-${stamp}@example.test`);
  await observer.goto(invite);
  await observer.getByRole('button', { name: 'Request to join' }).click();
  await director.getByRole('button', { name: 'Approve', exact: true }).click();
  await observer.goto(campaignUrl);
  await expect(observer.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  await register(player, `Player ${stamp}`, `player-${stamp}@example.test`);
  await player.goto(invite);
  await player.getByRole('button', { name: 'Request to join' }).click();
  await expect(
    player.getByRole('status').filter({ hasText: 'Your request has been saved' }),
  ).toBeVisible();
  await expect(director.getByRole('button', { name: 'Approve', exact: true })).toBeVisible();
  await director.getByRole('button', { name: 'Approve', exact: true }).click();
  await player.goto('/');
  await player.getByRole('link', { name: new RegExp(`Blackcastle ${stamp}`) }).click();
  await expect(player.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  await expect(player.getByRole('button', { name: 'Start session' })).toHaveCount(0);
  await director.getByRole('button', { name: 'Add foe' }).click();
  await expect(player.getByText('No foes are visible.', { exact: true })).toBeVisible();
  await expect(player.getByRole('progressbar')).toHaveCount(0);
  await director.getByRole('button', { name: 'Show', exact: true }).click();
  await expect(player.getByRole('progressbar', { name: 'Goblin Warrior Stamina' })).toHaveCount(1);
  await expect(observer.getByRole('progressbar', { name: 'Goblin Warrior Stamina' })).toHaveCount(
    1,
  );
  await expect(player.getByRole('button', { name: 'Inspect source' })).toHaveCount(0);
  await expect(player.locator('pre')).toHaveCount(0);
  await director.getByLabel('Show newly added foes to players').check();
  await director.getByRole('button', { name: 'Add foe' }).click();
  await expect(player.getByRole('progressbar')).toHaveCount(2);
  await director.reload();
  await expect(director.getByLabel('Show newly added foes to players')).toBeChecked();
  // The headless CLI authenticates normally and calls the same persisted operations.
  const campaignId = campaignUrl.split('/').at(-1)!;
  const cliEnv = {
    ...process.env,
    SALIENT_EMAIL: email,
    SALIENT_PASSWORD: 'Test-only-salient-password-42',
  };
  const listed = await promisify(execFile)(
    process.execPath,
    ['scripts/app.ts', 'query', 'foes:list', JSON.stringify({ campaignId })],
    { env: cliEnv },
  );
  const headlessFoes = JSON.parse(listed.stdout);
  expect(headlessFoes.rows).toHaveLength(2);
  await promisify(execFile)(
    process.execPath,
    [
      'scripts/app.ts',
      'mutation',
      'foes:setVisible',
      JSON.stringify({
        campaignId,
        foeId: headlessFoes.rows[0].id,
        visible: false,
        commandId: crypto.randomUUID(),
      }),
    ],
    { env: cliEnv },
  );
  await expect(player.getByRole('progressbar')).toHaveCount(1);
  await director.getByLabel(`Player ${stamp}`, { exact: true }).check();
  await director.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(player.getByText('The session is running.', { exact: false })).toBeVisible();
  await expect(observer.getByRole('button', { name: 'Pause session' })).toHaveCount(0);
  await director.getByRole('button', { name: 'Pause session' }).click();
  await expect(player.getByText('The session is paused.', { exact: false })).toBeVisible();
  await player.reload();
  await expect(player.getByText('The session is paused.', { exact: false })).toBeVisible();
  await director.getByRole('button', { name: 'Resume session' }).click();
  await expect(player.getByText('The session is running.', { exact: false })).toBeVisible();
  await playerContext.setOffline(true);
  await director.getByRole('button', { name: 'Pause session' }).click();
  await playerContext.setOffline(false);
  await expect(player.getByText('The session is paused.', { exact: false })).toBeVisible();
  await director.getByRole('button', { name: 'End session' }).click();
  await expect(player.getByText('Your Director will start the next session.')).toBeVisible();
  await expect(director.getByText('Closed the session.', { exact: true })).toBeVisible();
  await expect(player.getByRole('progressbar')).toHaveCount(1);

  await player.getByRole('link', { name: 'Characters', exact: true }).click();
  await player.getByLabel('Name', { exact: true }).fill(`Ash ${stamp}`);
  await player
    .getByLabel('Private notes', { exact: false })
    .fill('Only the owner may read this secret.');
  await player.getByRole('button', { name: 'Create draft' }).click();
  await expect(player.getByRole('heading', { name: `Ash ${stamp}` })).toBeVisible();
  const characterUrl = player.url();
  await player.getByLabel('Biography').fill('A saved journey from the north.');
  await player.getByRole('button', { name: 'Save draft' }).click();
  await expect(player.getByText('Draft saved.', { exact: true })).toBeVisible();
  await player.reload();
  await expect(player.getByLabel('Biography')).toHaveValue('A saved journey from the north.');
  await expect(player.getByLabel('Private notes', { exact: false })).toHaveValue(
    'Only the owner may read this secret.',
  );
  await director.goto(characterUrl);
  await expect(director.getByRole('heading', { name: 'This page is unavailable' })).toBeVisible();
  await expect(director.getByText('Only the owner may read this secret.')).toHaveCount(0);
  await director.goto(campaignUrl);
  await director.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(director.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await director.getByLabel('Email', { exact: true }).fill(email);
  await director.getByLabel('Password', { exact: true }).fill('Test-only-salient-password-42');
  await director.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    director.getByRole('link', { name: new RegExp(`Blackcastle ${stamp}`) }),
  ).toBeVisible();
  await directorContext.close();
  await playerContext.close();
  await observerContext.close();
});
