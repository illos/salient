// SPDX-License-Identifier: GPL-3.0-only
/**
 * A08 acceptance checks 2 and 3: the appearance preference switches without reload and persists
 * across reload; `prefers-reduced-motion` disables transitions. Also captures the slice's reference
 * screenshots under .playtest/a08/ (ignored).
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = '.playtest/a08';
/** Let the token transitions (--motion-base) finish before capturing. */
async function settled(page: Page) {
  await page.waitForTimeout(400);
}

async function isDark(page: Page) {
  return page.evaluate(() => document.documentElement.classList.contains('dark'));
}
async function storedTheme(page: Page) {
  return page.evaluate(() => localStorage.getItem('salient.theme'));
}
function appearance(page: Page) {
  return page.getByRole('group', { name: 'Appearance' });
}

test('light, dark and system preference switch without reload and persist across reload', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(await isDark(page)).toBe(false);
  expect(await storedTheme(page)).toBeNull();

  await appearance(page).getByRole('button', { name: 'Dark' }).click();
  expect(await isDark(page)).toBe(true);
  expect(await storedTheme(page)).toBe('dark');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(await isDark(page)).toBe(true);
  await expect(appearance(page).getByRole('button', { name: 'Dark' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await appearance(page).getByRole('button', { name: 'Light' }).click();
  expect(await isDark(page)).toBe(false);
  expect(await storedTheme(page)).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await isDark(page)).toBe(false);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(await isDark(page)).toBe(false);

  await appearance(page).getByRole('button', { name: 'System' }).click();
  expect(await storedTheme(page)).toBe('system');
  expect(await isDark(page)).toBe(true);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => isDark(page)).toBe(false);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => isDark(page)).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(await isDark(page)).toBe(true);
});

test('prefers-reduced-motion disables transitions', async ({ page }) => {
  await page.goto('/login');
  const button = page.getByRole('button', { name: 'Sign in', exact: true });
  await expect(button).toBeVisible();
  const duration = () => button.evaluate(element => getComputedStyle(element).transitionDuration);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await duration()).not.toBe('0s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await duration()).toBe('0s');
  const motionToken = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--motion-base').trim(),
  );
  expect(motionToken).toBe('0s');
});

test('reference screenshots: login, campaign home and character list in light and dark', async ({
  page,
}) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ colorScheme: 'light' });
  const stamp = crypto.randomUUID().slice(0, 8);
  await page.goto('/login');
  await settled(page);
  await page.screenshot({ path: `${SHOTS}/login-light.png`, fullPage: true });
  await appearance(page).getByRole('button', { name: 'Dark' }).click();
  await settled(page);
  await page.screenshot({ path: `${SHOTS}/login-dark.png`, fullPage: true });
  await appearance(page).getByRole('button', { name: 'Light' }).click();

  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(`Director ${stamp}`);
  await page.getByLabel('Email', { exact: true }).fill(`theme-${stamp}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill('Test-only-salient-password-42');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
  await page.getByLabel('Campaign name').fill(`Blackcastle ${stamp}`);
  await page.getByRole('button', { name: 'Create campaign', exact: true }).click();
  await expect(page.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Connected' })).toBeVisible();
  await page.getByRole('button', { name: 'Add foe' }).click();
  await expect(
    page.getByText('Visible to players').or(page.getByText('Hidden from players')),
  ).toBeVisible();
  await settled(page);
  await page.screenshot({ path: `${SHOTS}/campaign-home-light.png`, fullPage: true });
  await appearance(page).getByRole('button', { name: 'Dark' }).click();
  await settled(page);
  await page.screenshot({ path: `${SHOTS}/campaign-home-dark.png`, fullPage: true });

  await page.getByRole('link', { name: 'Characters', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill(`Ash ${stamp}`);
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByRole('heading', { name: `Ash ${stamp}` })).toBeVisible();
  await page.getByRole('link', { name: 'Characters', exact: true }).click();
  await expect(page.getByRole('link', { name: `Ash ${stamp}` })).toBeVisible();
  await settled(page);
  await page.screenshot({ path: `${SHOTS}/characters-dark.png`, fullPage: true });
  await appearance(page).getByRole('button', { name: 'Light' }).click();
  await settled(page);
  await page.screenshot({ path: `${SHOTS}/characters-light.png`, fullPage: true });
});
