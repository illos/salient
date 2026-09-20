// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';

test('public rules search, readable articles, original sources and browser history', async ({
  page,
}) => {
  await page.goto('/rules');
  await expect(page.getByRole('heading', { level: 1, name: 'Rules', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search rules' }).fill('winded');
  const result = page.locator('.rules-result').first();
  await expect(result).toContainText('Winded');
  await result.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Winded' })).toBeVisible();
  await expect(page.locator('.rules-prose')).toContainText('Stamina');
  await expect(page.getByRole('link', { name: 'View on Steel Compendium' })).toHaveAttribute(
    'href',
    'https://steelcompendium.io/v2/scc/mcdm.heroes.v1/rule.health/winded/',
  );
  await expect(page.locator('.rules-prose')).not.toContainText('scc.v1:');
  await page.reload();
  await expect(page.locator('.rules-prose')).toContainText('Stamina');
  await page.goBack();
  await expect(page.getByRole('textbox', { name: 'Search rules' })).toHaveValue('winded');
  await page.getByRole('textbox', { name: 'Search rules' }).fill('goblin warior');
  await expect(page.locator('.rules-result').first()).toContainText('Goblin Warrior');
  await page.locator('.rules-result').first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Goblin Warrior' })).toBeVisible();
  await expect(page.locator('.rules-prose')).toBeVisible();
  await page.goto('/rules/heroes/feature/ability/fury/level-1/back');
  await expect(page.getByRole('heading', { level: 1, name: 'Back!' })).toBeVisible();
  await expect(page.locator('.rules-prose')).toContainText('Cost: 3 Ferocity');
});

test('chapter contents, cross-references, topic filters and mobile navigation', async ({
  page,
}) => {
  await page.goto('/rules/heroes/chapter/making-a-hero');
  await expect(page.getByRole('heading', { level: 1, name: 'Making a Hero' })).toBeVisible();
  await expect(page.locator('.rules-prose')).toContainText(
    'The first thing you should do is think',
  );
  await expect(page.locator('.rules-prose')).not.toContainText('data-scc');
  const toc = page.locator('.rules-toc a[href="#1-think"]');
  await toc.click();
  await expect(page).toHaveURL(/#1-think$/);
  await expect(page.locator('.rules-prose [id="1-think"]')).toBeInViewport();
  const crossReference = page.locator('.rules-prose a[href^="/rules/"]').first();
  const href = await crossReference.getAttribute('href');
  await crossReference.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  await expect(page.locator('.rules-prose')).toBeVisible();
  await page.goto('/rules?category=monster&book=monsters');
  await expect(page.getByLabel('Filter by book')).toHaveValue('monsters');
  await expect(page.locator('.rules-result').first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('.rules-sidebar')).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
