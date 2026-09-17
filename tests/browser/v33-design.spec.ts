// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import type { PreviewGlyph } from '../../docs/design-mockups/v33/preview';
const contract: PreviewGlyph = { kind: 'tier', tier: 1 };
void contract;
const url = '/docs/design-mockups/v33/index.html';

test('Core stat blocks, automatic glyph accessibility and plain-text fallback', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator('html')).toHaveClass(/ds-font-ready/);
  await expect(page.getByRole('heading', { name: 'Fangling', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Agility less than 2', exact: true })).toHaveCount(2);
  await expect(page.getByRole('img', { name: 'Tier 2, 12 to 16', exact: true })).toHaveCount(4);
  const specialOrder = await page
    .locator('.book-feature')
    .filter({ has: page.getByRole('heading', { name: 'Demonwarp Tears', exact: true }) })
    .innerText();
  expect(specialOrder.indexOf('Special:')).toBeLessThan(specialOrder.indexOf('Power Roll'));
  await page.screenshot({ path: '/artifacts/v33-monsters-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await page.screenshot({ path: '/artifacts/v33-monsters-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Hero abilities', exact: true }).click();
  await expect(
    page.getByRole('img', { name: 'Might less than strong', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('img', { name: 'Reason', exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: 'Light theme' }).click();
  await page.screenshot({ path: '/artifacts/v33-heroes.png', fullPage: true });
  await page.getByRole('button', { name: 'Solo creature', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ajax the Invincible', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Awe of the Iron Crown', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('img', { name: 'Leader or solo feature', exact: true })).toHaveCount(
    4,
  );
  await page.screenshot({ path: '/artifacts/v33-solo.png', fullPage: true });
  const link = page.locator('.book-prose a').first();
  const href = await link.getAttribute('href');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(href! + '$'));
  await page.goBack();
  await expect(page.locator('.ds-symbol[tabindex]')).toHaveCount(0);
  const originalTextSize = await page
    .locator('.book-block')
    .first()
    .evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page
      .locator('.book-block')
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).fontSize)),
  ).toBe(originalTextSize * 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page.locator('.tiers li').evaluateAll(rows =>
      rows.every(row => {
        const badge = row.querySelector('.ds-symbol-visual')!.getBoundingClientRect();
        const text = row.querySelector('.book-prose')!.getBoundingClientRect();
        return badge.right <= text.left;
      }),
    ),
  ).toBe(true);
  expect(
    await page.locator('.feature-title').evaluateAll(titles =>
      titles.every(title => {
        const icon = title.querySelector(':scope > .ds-symbol');
        const heading = title.querySelector('h3');
        return (
          !icon ||
          !heading ||
          icon.getBoundingClientRect().right <= heading.getBoundingClientRect().left
        );
      }),
    ),
  ).toBe(true);
  await page.screenshot({ path: '/artifacts/v33-text-200.png', fullPage: true });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  await page.getByRole('button', { name: 'All glyph combinations' }).click();
  const gallery = page.getByRole('region', { name: 'Known glyph combinations' });
  await expect(gallery.getByRole('img')).toHaveCount(76);
  const snapshot = await gallery.ariaSnapshot();
  expect(snapshot).toContain('img "Agility less than 0"');
  expect(snapshot).toContain('img "Might"');
  expect(snapshot).not.toContain('img "a<0"');
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const images = nodes.filter(node => !node.ignored && node.role?.value === 'image');
  expect(images).toHaveLength(76);
  expect(images.map(node => node.name?.value)).toContain('Agility less than 0');
  expect(images.map(node => node.name?.value)).toContain('Might less than strong');
  expect(
    nodes
      .filter(node => !node.ignored)
      .some(node => ['a<0', 'm<s', '¡¡¡¢¡¡¡'].includes(node.name?.value)),
  ).toBe(false);
  writeFileSync(
    '/artifacts/v33-accessibility.json',
    JSON.stringify(
      images.map(node => ({ role: node.role?.value, name: node.name?.value })),
      null,
      2,
    ),
  );
  await cdp.detach();
  await page.screenshot({ path: '/artifacts/v33-glyphs.png', fullPage: true });
  const copied = await gallery
    .getByRole('img', { name: 'Agility less than 2', exact: true })
    .evaluate(el => {
      const selection = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      const value = selection.toString();
      selection.removeAllRanges();
      return value;
    });
  expect(copied).toBe('Agility less than 2');
  await page.getByRole('button', { name: 'Plain text', exact: true }).click();
  await expect(
    gallery
      .getByRole('img', { name: 'Agility less than 2', exact: true })
      .locator('.ds-symbol-text'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Monster stat blocks' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Plain text', exact: true }).click();
  await page.screenshot({ path: '/artifacts/v33-narrow.png', fullPage: true });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.getByRole('img', { name: 'Distance', exact: true }).first()).toBeVisible();
  await page.screenshot({ path: '/artifacts/v33-forced-colors.png', fullPage: true });
});

test('a missing font leaves readable text rather than ASCII font codes', async ({ page }) => {
  await page.route('**/*.otf', route => route.abort());
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Fangling', exact: true })).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/ds-font-ready/);
  const distance = page.getByRole('img', { name: 'Distance', exact: true }).first();
  await expect(distance.locator('.ds-symbol-text')).toBeVisible();
  await expect(distance.locator('.ds-symbol-visual')).toBeHidden();
  await expect(
    page
      .getByRole('img', { name: 'Agility less than 2', exact: true })
      .first()
      .locator('.ds-symbol-text'),
  ).toBeVisible();
});
