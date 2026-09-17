// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { FoeDisplayPackage } from '../../shared/contracts/foes';
const pack = JSON.parse(
  readFileSync('shared/content/foes/browser.json', 'utf8'),
) as FoeDisplayPackage;

test('all core definitions render their complete feature lists through the public consumer', async ({
  page,
}, testInfo) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/foes');
  const kind = page.getByRole('combobox', { name: 'Kind', exact: true });
  const search = page.getByRole('textbox', { name: 'Search foes' });
  await kind.selectOption('statblock');
  await expect(page.getByRole('status')).toHaveText('438 references');
  for (const object of pack.objects.filter(o => !o.parentId)) {
    await kind.selectOption(object.kind);
    await search.fill(object.name);
    await page.locator(`[data-foe-id="${object.id}"]`).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: object.name, exact: true }).first(),
    ).toBeVisible();
    await expect(dialog.locator('article > .ds-content')).toHaveCount(1);
    await expect(dialog.locator('article > section')).toHaveCount(object.featureIds.length);
    for (const id of object.featureIds) {
      const feature = pack.objects.find(o => o.id === id)!;
      await expect(
        dialog.getByRole('button', { name: `Open ${feature.name}`, exact: true }).first(),
      ).toBeVisible();
    }
    await page.keyboard.press('Escape');
  }
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: theme, exact: true }).click();
    for (const name of [
      'Source of Earth',
      'Lich',
      'Hag Malice',
      'Gnoll Malice',
      'Vampire Lord',
      'Human Warrior',
      'Noncombatant',
    ]) {
      const object = pack.objects.find(o => !o.parentId && o.name === name)!;
      await kind.selectOption(object.kind);
      await search.fill(name);
      await page.locator(`[data-foe-id="${object.id}"]`).click();
      const dialog = page.getByRole('dialog');
      if (name === 'Hag Malice') await expect(dialog).toContainText('Casting Curses and Bodies');
      if (name === 'Gnoll Malice')
        await expect(dialog).toContainText('While an enemy is bleeding this way');
      if (name === 'Vampire Lord') await expect(dialog).toContainText('Wave of Blood');
      if (name === 'Source of Earth') await expect(dialog).toContainText('Draw Steel: Heroes');
      await page.screenshot({
        path: testInfo.outputPath(
          `${name.toLowerCase().replaceAll(' ', '-')}-${theme.toLowerCase()}.png`,
        ),
        fullPage: true,
      });
      await page.keyboard.press('Escape');
    }
  }
  expect(errors).toEqual([]);
  await testInfo.attach('full-corpus-coverage', {
    body: JSON.stringify({
      edition: pack.edition,
      parents: pack.objects
        .filter(o => !o.parentId)
        .map(o => ({ id: o.id, features: o.featureIds.length })),
      errors,
    }),
    contentType: 'application/json',
  });
});
