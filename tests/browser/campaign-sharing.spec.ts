// SPDX-License-Identifier: GPL-3.0-only
import { expect, test, type Page } from '@playwright/test';
import { pacedSignUp } from './signup-pacing';

async function register(page: Page, name: string, stamp: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(`${name}-${stamp}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill('Test-only-salient-password-42');
  // V52: quiet interval before each sign-up; the helper observes the HTTP response.
  await pacedSignUp(page, async () => {
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  });
}

async function findCampaign(page: Page, invitation: string) {
  await page.goto('/');
  await page.getByLabel('Campaign code or link').fill(invitation);
  await page.getByRole('button', { name: 'Find campaign', exact: true }).click();
}

test('visible share codes support joining and rotate with links without losing requests or members', async ({
  browser,
}) => {
  const ownerContext = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const playerContext = await browser.newContext();
  try {
    const owner = await ownerContext.newPage();
    const player = await playerContext.newPage();
    const stamp = crypto.randomUUID();
    const name = `Sharing ${stamp}`;
    await register(owner, 'Owner', stamp);
    await owner.getByLabel('Campaign name').fill(name);
    await owner.getByRole('button', { name: 'Create campaign', exact: true }).click();
    const codeField = owner.getByLabel('Campaign share code', { exact: true });
    await expect(codeField).toHaveValue(/^[A-HJ-NP-Z2-9]{8}$/);
    await expect(codeField).toHaveAttribute('readonly', '');
    const campaignUrl = owner.url();
    const originalCode = await codeField.inputValue();
    const originalLink = await owner.getByLabel('Invitation link').inputValue();
    expect(new URL(originalLink).pathname).toBe(`/join/${originalCode}`);
    for (const [label, value] of [
      ['code', originalCode],
      ['link', originalLink],
    ]) {
      const copy = owner.getByRole('button', { name: `Copy ${label}`, exact: true });
      await expect(copy).toHaveText('');
      await expect(copy.locator('svg')).toHaveCount(1);
      await copy.click();
      expect(await owner.evaluate(() => navigator.clipboard.readText())).toBe(value);
      await expect(copy).toHaveAttribute('title', 'Copied');
    }
    await codeField.focus();
    expect(
      await codeField.evaluate((input: HTMLInputElement) =>
        input.value.slice(input.selectionStart!, input.selectionEnd!),
      ),
    ).toBe(originalCode);
    await owner.reload();
    await expect(codeField).toHaveValue(originalCode);

    await register(player, 'Player', stamp);
    await findCampaign(player, `  ${originalCode.toLowerCase()}  `);
    await expect(player.getByRole('heading', { name, exact: true })).toBeVisible();
    await player.getByRole('button', { name: 'Request to join', exact: true }).click();
    await expect(
      player.getByRole('status').filter({ hasText: 'Your request has been saved' }),
    ).toBeVisible();
    await expect(owner.getByRole('button', { name: 'Approve', exact: true })).toBeVisible();

    await owner.getByRole('button', { name: 'Replace code and link', exact: true }).click();
    await expect(codeField).not.toHaveValue(originalCode);
    const replacementCode = await codeField.inputValue();
    const replacementLink = await owner.getByLabel('Invitation link').inputValue();
    expect(replacementCode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(new URL(replacementLink).pathname).toBe(`/join/${replacementCode}`);
    await owner.getByRole('button', { name: 'Copy code', exact: true }).click();
    expect(await owner.evaluate(() => navigator.clipboard.readText())).toBe(replacementCode);
    await owner.getByRole('button', { name: 'Copy link', exact: true }).click();
    expect(await owner.evaluate(() => navigator.clipboard.readText())).toBe(replacementLink);
    await owner.evaluate(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: () => Promise.reject(new Error('Clipboard denied')),
      });
    });
    await owner.getByRole('button', { name: 'Copy code', exact: true }).click();
    await expect(owner.getByRole('alert')).toContainText('Could not copy');
    await expect(owner.getByRole('button', { name: 'Copy code', exact: true })).not.toHaveAttribute(
      'title',
      'Copied',
    );
    await owner.reload();
    await expect(codeField).toHaveValue(replacementCode);
    await expect(owner.getByRole('button', { name: 'Approve', exact: true })).toBeVisible();

    await findCampaign(player, originalCode);
    await expect(player.getByRole('heading', { name: 'Invitation unavailable' })).toBeVisible();
    await player.goto(originalLink);
    await expect(player.getByRole('heading', { name: 'Invitation unavailable' })).toBeVisible();
    for (const invitation of [replacementCode, replacementLink]) {
      await findCampaign(player, invitation);
      await expect(player.getByRole('heading', { name, exact: true })).toBeVisible();
    }

    await owner.getByRole('button', { name: 'Approve', exact: true }).click();
    await player.goto(campaignUrl);
    await expect(player.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(player.getByLabel('Campaign share code', { exact: true })).toHaveCount(0);
    await expect(player.getByLabel('Invitation link')).toHaveCount(0);
    await owner.getByRole('button', { name: 'Replace code and link', exact: true }).click();
    await expect(codeField).not.toHaveValue(replacementCode);
    await player.reload();
    await expect(player.getByRole('heading', { name, exact: true })).toBeVisible();
  } finally {
    await ownerContext.close();
    await playerContext.close();
  }
});
