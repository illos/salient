// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';

test('foe browsing, composed filters, URL persistence, sorting and empty recovery', async ({
  page,
}) => {
  await page.goto('/foes');
  await expect(page.getByRole('heading', { name: 'Foes library' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stat blocks', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('combobox', { name: 'Band', exact: true }).selectOption('Undead');
  await page.getByRole('combobox', { name: 'Level', exact: true }).selectOption('1');
  await page.getByRole('combobox', { name: 'Organization', exact: true }).selectOption('Minion');
  await page.getByRole('combobox', { name: 'Role', exact: true }).selectOption('Artillery');
  await expect(page.locator('.foes-result')).toHaveCount(1);
  await expect(page.locator('.foes-result')).toContainText('Decrepit Skeleton');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Organization', exact: true })).toHaveValue(
    'Minion',
  );
  await expect(
    page.getByRole('button', { name: 'Open Decrepit Skeleton', exact: true }),
  ).toHaveAccessibleDescription(/Level 1.*Minion.*Artillery.*EV/);
  await page.getByRole('button', { name: 'Open Decrepit Skeleton', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('With Captain');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open Decrepit Skeleton', exact: true }),
  ).toBeFocused();
  await page.getByLabel('Search foes').fill('no-such-creature-zzzz');
  await expect(page.getByRole('heading', { name: 'No matching foes' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
  await expect(page.getByLabel('Search foes')).toHaveValue('');
  await page.getByLabel('Search foes').fill('Skeleon');
  await expect(page.getByRole('button', { name: 'Open Skeleton', exact: true })).toBeVisible();
  await page.getByLabel('Search foes').fill('Bone Shards');
  await expect(page.getByRole('button', { name: 'Open Skeleton', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('level-desc');
  const levels = await page.locator('.foes-result-level').allTextContents();
  const numbers = levels.map(s => Number(s.replace('Level', ''))).filter(Number.isFinite);
  expect(numbers).toEqual([...numbers].sort((a, b) => b - a));
  await page.screenshot({ path: '/artifacts/v36-library-desktop.png', fullPage: false });
});

test('light and dark, mobile, enlarged text and keyboard search', async ({ page }) => {
  await page.goto('/foes');
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: theme, exact: true }).click();
    await page.screenshot({
      path: `/artifacts/v36-library-${theme.toLowerCase()}.png`,
      fullPage: false,
    });
  }
  await page.keyboard.press('Control+k');
  await expect(page.getByLabel('Search foes')).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Search foes').fill('Ghost');
  await page.getByRole('button', { name: 'Open Ghost', exact: true }).click();
  await expect(page.getByRole('dialog').locator('.ds-stats')).toBeVisible();
  await page.screenshot({ path: '/artifacts/v36-card-mobile.png', fullPage: false });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Clear search' }).click();
  const originalSize = await page
    .locator('.foes-result-name')
    .first()
    .evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  await page.evaluate(() => {
    // Snapshot first: parent changes must not compound inherited sizes in descendants.
    const sizes = [...document.querySelectorAll<HTMLElement>('.foes-app, .foes-app *')].map(el => {
      const style = getComputedStyle(el);
      return { el, font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
    });
    for (const { el, font, line } of sizes) {
      el.style.fontSize = `${font * 2}px`;
      if (Number.isFinite(line)) el.style.lineHeight = `${line * 2}px`;
    }
  });
  expect(
    await page
      .locator('.foes-result-name')
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).fontSize)),
  ).toBe(originalSize * 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole('combobox', { name: 'Band', exact: true })).toBeVisible();
  await page.screenshot({ path: '/artifacts/v36-library-mobile.png', fullPage: false });
  await page.locator('.foes-result').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/artifacts/v36-results-mobile.png', fullPage: false });
});

test('full catalog bands, pagination, sourcebooks, Malice and related rules', async ({ page }) => {
  await page.goto('/foes');
  await expect(page.getByRole('status')).toHaveText('438 stat blocks');
  await expect(page.locator('.foes-result')).toHaveCount(40);
  await page.getByRole('button', { name: /Show more references/ }).click();
  await expect(page.locator('.foes-result')).toHaveCount(80);
  await page.getByRole('combobox', { name: 'Band', exact: true }).selectOption('Goblins');
  await expect(page.locator('.foes-result').first()).toContainText('Goblins');
  await page.getByRole('button', { name: 'Open Goblin Warrior', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.ds-stats')).toHaveCount(1);
  await dialog.getByRole('link', { name: 'Goblins group context' }).click();
  await expect(dialog.getByRole('heading', { name: 'Goblins', exact: true }).first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  await dialog.getByRole('button', { name: 'Goblin Malice', exact: true }).click();
  await expect(
    dialog.getByRole('heading', { name: 'Goblin Malice', exact: true }).first(),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  await page.screenshot({ path: '/artifacts/v36-goblin-card.png', fullPage: false });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Sourcebook', exact: true }).selectOption('Heroes');
  await page.getByRole('button', { name: 'Open Source of Earth', exact: true }).click();
  await expect(dialog).toContainText('Draw Steel: Heroes');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Malice', exact: true }).click();
  await page.getByLabel('Search foes').fill('Goblin Malice');
  await expect(page.getByRole('button', { name: 'Open Goblin Malice', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByRole('button', { name: 'Stat blocks', exact: true }).click();
  await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('band');
  await page.screenshot({ path: '/artifacts/v36-full-library.png', fullPage: false });
});
