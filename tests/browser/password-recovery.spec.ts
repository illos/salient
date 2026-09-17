// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Recovery links and session secrets must not enter traces/screenshots on failure.
test.use({ trace: 'off', screenshot: 'off' });
test.beforeEach(() => {
  test.skip(!process.env.SALIENT_RECOVERY_FIXTURE, 'Requires isolated recovery fixture.');
});

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test('forgot-password response and missing/invalid reset links are clear', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await page
    .getByLabel('Email', { exact: true })
    .fill(`missing-${crypto.randomUUID()}@example.test`);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status')).toContainText('If an account uses that email address');
  await page.screenshot({ path: '/artifacts/v39-request-complete.png' });
  for (let attempt = 2; attempt <= 4; attempt++) {
    await page.goto('/forgot-password');
    await page
      .getByLabel('Email', { exact: true })
      .fill(`missing-${crypto.randomUUID()}@example.test`);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    if (attempt < 4)
      await expect(page.getByRole('status')).toContainText('If an account uses that email address');
    else
      await expect(
        page.getByText('Too many requests. Wait a minute before trying again.'),
      ).toBeVisible();
  }
  await page.goto('/reset-password');
  await expect(page.getByText('This reset link is invalid or has expired.')).toBeVisible();
  await page.goto('/reset-password?token=invalid-browser-token');
  await page.getByLabel('New password', { exact: true }).fill('New-password-42');
  await page.getByLabel('Confirm new password').fill('Different-password-42');
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(page.getByText('The passwords do not match.')).toBeVisible();
  await page.getByLabel('Confirm new password').fill('New-password-42');
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(
    page.getByText('This reset link is invalid or has expired. Request a new link.'),
  ).toBeVisible();
});

test('real reset preserves account access, clears old session, and rejects token reuse', async ({
  browser,
}) => {
  test.skip(
    !process.env.SALIENT_RECOVERY_FIXTURE,
    'Requires isolated fixture; never read live recovery tokens.',
  );
  const fixture = JSON.parse(readFileSync(process.env.SALIENT_RECOVERY_FIXTURE!, 'utf8'));
  const oldContext = await browser.newContext();
  const resetContext = await browser.newContext();
  const oldPage = await oldContext.newPage();
  const page = await resetContext.newPage();
  await signIn(oldPage, fixture.email, fixture.password);
  await expect(oldPage.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  const newPassword = 'New-browser-recovery-password-42';
  await page.goto(`/reset-password?token=${encodeURIComponent(fixture.token)}`);
  await page.getByLabel('New password', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirm new password').fill(newPassword);
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Your password has been reset.');
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.screenshot({ path: '/artifacts/v39-reset-complete.png' });
  await oldPage.reload();
  await expect(oldPage.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await signIn(page, fixture.email, fixture.password);
  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await signIn(page, fixture.email, newPassword);
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  await page.goto(`/reset-password?token=${encodeURIComponent(fixture.token)}`);
  await page.getByLabel('New password', { exact: true }).fill('Another-new-password-42');
  await page.getByLabel('Confirm new password').fill('Another-new-password-42');
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(
    page.getByText('This reset link is invalid or has expired. Request a new link.'),
  ).toBeVisible();
  await oldContext.close();
  await resetContext.close();
});
