// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { createTable } from './v21-fixtures';

test('live Rules and Foes share Core typography, automatic semantics and accessible navigation', async ({
  page,
}) => {
  await page.goto('/rules/monsters/monster/demon/2nd-echelon/statblock/fangling');
  await expect(page.locator('html')).toHaveClass(/ds-font-ready/);
  await expect(page.locator('.ds-stats')).toHaveCount(1);
  await expect(page.getByRole('img', { name: 'Agility less than 2', exact: true })).toHaveCount(1);
  await expect(page.getByRole('img', { name: 'Tier 2, 12 to 16', exact: true })).toHaveCount(2);
  const cdp = await page.context().newCDPSession(page);
  const ax = await cdp.send('Accessibility.getFullAXTree');
  expect(
    ax.nodes.some(n => n.role?.value === 'image' && n.name?.value === 'Agility less than 2'),
  ).toBe(true);
  writeFileSync('/artifacts/v34-accessibility.json', JSON.stringify(ax, null, 2));
  expect(
    ax.nodes.some(n => n.role?.value === 'image' && n.name?.value === 'Tier 2, 12 to 16'),
  ).toBe(true);
  expect(ax.nodes.some(n => n.role?.value === 'image' && n.name?.value === 'Might')).toBe(true);
  const copied = await page
    .getByRole('img', { name: 'Agility less than 2', exact: true })
    .evaluate(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
  expect(copied).toBe('Agility less than 2');
  await page.screenshot({ path: '/artifacts/v34-rules-light.png', fullPage: true });
  await page.evaluate(() => localStorage.setItem('salient.theme', 'dark'));
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('.ds-stats')).toHaveCount(1);
  await page.screenshot({ path: '/artifacts/v34-rules-dark.png', fullPage: true });
  const link = page.locator('.ds-feature a').first();
  const href = await link.getAttribute('href');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(href! + '$'));
  await page.goto('/rules/heroes/feature/ability/time-raider/concussive-slam');
  await expect(page.getByRole('img', { name: 'Reason', exact: true })).toHaveCount(3);
  await expect(
    page.getByRole('img', { name: 'Might less than strong', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await expect(page.locator('.ds-tiers')).toBeVisible();
  expect(
    await page.locator('.ds-content').evaluate(el => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({ path: '/artifacts/v34-hero-narrow-large-text.png', fullPage: true });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(
    page.getByRole('img', { name: 'Might less than strong', exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ forcedColors: 'none' });
  await page.evaluate(() => (document.documentElement.style.fontSize = ''));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/foes');
  await page.getByLabel('Search undead').fill('Crawling Claw');
  await page.getByRole('button', { name: 'Undead · statblock Crawling Claw' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.ds-stats')).toHaveCount(1);
  await expect(dialog.getByRole('img', { name: 'Tier 1, 11 or lower', exact: true })).toHaveCount(
    1,
  );
  await page.screenshot({ path: '/artifacts/v34-foe.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Open Fingernails' }).click();
  await expect(dialog.getByRole('img', { name: 'Target', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('live content retains readable text when the glyph font cannot load', async ({ page }) => {
  await page.route('**/*DrawSteelGlyphs*', route => route.abort());
  await page.goto('/rules/heroes/feature/ability/time-raider/concussive-slam');
  const potency = page.getByRole('img', { name: 'Might less than strong', exact: true });
  await expect(potency.locator('.ds-symbol-text')).toBeVisible();
  await expect(potency.locator('.ds-symbol-visual')).toBeHidden();
  await expect(page.locator('html')).not.toHaveClass(/ds-font-ready/);
  await page.screenshot({ path: '/artifacts/v34-font-fallback.png', fullPage: true });
});

test('hero and Director sheets use full Core content while live stats and audience stay separate', async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const table = await createTable(browser);
  const { player, director, heroId } = table;
  try {
    await player.goto(`/characters/${heroId}`);
    const ability = player.locator('.ds-hero-ability').filter({ hasText: 'Brutal Slam' });
    await expect(ability.locator('.ds-tiers')).toHaveCount(1);
    await expect(ability.getByRole('img', { name: 'Target', exact: true })).toBeVisible();
    await expect(ability.getByRole('img', { name: 'Might', exact: true })).toHaveCount(3);
    await player.screenshot({ path: '/artifacts/v34-character.png', fullPage: true });
    const trigger = ability.getByRole('button', {
      name: 'Read Brutal Slam in the rules',
      exact: true,
    });
    await trigger.click();
    const preview = player.getByRole('dialog');
    await expect(preview.locator('.ds-tiers')).toHaveCount(1);
    await expect(preview.getByRole('img', { name: 'Target', exact: true })).toBeVisible();
    await player.screenshot({ path: '/artifacts/v34-embedded-preview.png', fullPage: true });
    await player.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    const cdp = await player.context().newCDPSession(player);
    const ax = await cdp.send('Accessibility.getFullAXTree');
    expect(ax.nodes.some(n => n.role?.value === 'image' && n.name?.value === 'Might')).toBe(true);
    expect(ax.nodes.some(n => n.role?.value === 'image' && n.name?.value === 'Target')).toBe(true);
    writeFileSync('/artifacts/v34-character-accessibility.json', JSON.stringify(ax, null, 2));
    await player.route('**/*DrawSteelGlyphs*', route => route.abort());
    await player.reload();
    await expect(
      ability.getByRole('img', { name: 'Target', exact: true }).locator('.ds-symbol-text'),
    ).toBeVisible();
    await expect(
      ability.getByRole('img', { name: 'Target', exact: true }).locator('.ds-symbol-visual'),
    ).toBeHidden();

    await director.getByRole('button', { name: 'Open Goblin Warrior' }).first().click();
    const block = director.getByRole('article', { name: 'Goblin Warrior stat block' });
    await expect(block.locator('.ds-stats')).toHaveCount(1);
    await expect(block.locator('.ds-tiers')).toHaveCount(2);
    director.once('dialog', d => void d.accept('9'));
    await block.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await expect(block).toContainText('9 / 15');
    await expect(block.locator('.ds-stats')).toContainText('15');
    await director.reload();
    await director.getByRole('button', { name: 'Open Goblin Warrior' }).first().click();
    await expect(
      director.getByRole('article', { name: 'Goblin Warrior stat block' }),
    ).toContainText('9 / 15');
    await director.screenshot({ path: '/artifacts/v34-director.png', fullPage: true });
    await player.goto(table.tableUrl);
    await expect(player.getByRole('button', { name: 'Open Goblin Warrior' })).toHaveCount(0);
    await expect(player.locator('.ds-statblock')).toHaveCount(0);
  } finally {
    await table.close();
  }
});
