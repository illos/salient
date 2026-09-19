// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { register } from './v21-fixtures';

test('primary navigation exposes independent Rules and Foes libraries', async ({ page }) => {
  const stamp = crypto.randomUUID().slice(0, 8);
  await page.setViewportSize({ width: 1440, height: 900 });
  await register(page, `Library reader ${stamp}`, `v38-reader-${stamp}@example.test`);
  const origin = await page.evaluate(() => performance.timeOrigin);
  const primary = page.getByRole('navigation', { name: 'Primary', exact: true });
  await expect(primary.getByRole('link')).toHaveText(['Campaigns', 'Characters', 'Rules', 'Foes']);
  await page.screenshot({ path: '/artifacts/v38-primary-navigation.png' });
  await primary.getByRole('link', { name: 'Foes', exact: true }).click();
  await expect(page).toHaveURL(/\/foes$/);
  await expect(page.getByRole('heading', { name: 'Foes library' })).toBeVisible();
  await expect(page.locator('.foes-results-toolbar [role=status]')).toHaveText('438 stat blocks');
  await page.getByLabel('Search foes').fill('Goblin Warrior');
  await page.getByRole('button', { name: 'Open Goblin Warrior', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Spear Charge');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Salient', exact: true }).click();
  await primary.getByRole('link', { name: 'Rules', exact: true }).click();
  await expect(page).toHaveURL(/\/rules$/);
  await expect(page.getByLabel('Search rules')).toBeVisible();
  await expect(page.getByLabel('Search rules')).toHaveValue('');
  await expect(page.getByLabel('Search foes')).toHaveCount(0);
  await page.getByLabel('Search rules').fill('Surges');
  await primary.getByRole('link', { name: 'Foes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Foes library' })).toBeVisible();
  await expect(page.locator('.foes-results-toolbar [role=status]')).toHaveText('438 stat blocks');
  await expect(page.getByLabel('Search foes')).toHaveValue('');
  await page.screenshot({ path: '/artifacts/v38-foes-library.png' });
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 800, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
