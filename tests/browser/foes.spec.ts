// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
test('public foes search, independent cards, navigation, dismissal and themes', async ({
  page,
}) => {
  await page.goto('/foes');
  await expect(page.getByRole('heading', { name: 'Foes library' })).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Search foes' });
  await search.fill('Arise');
  await page.getByRole('button', { name: 'Traits', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('references');
  const trigger = page.getByRole('button', { name: 'Open Arise · Skeleton', exact: true });
  await trigger.click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('they instead have 1 Stamina');
  await dialog.getByRole('button', { name: 'From Skeleton' }).click();
  await expect(dialog.getByRole('heading', { name: 'Skeleton', exact: true })).toBeVisible();
  await expect(dialog).toContainText('first time they willingly move');
  await dialog.getByRole('button', { name: 'Open Bone Shards' }).click();
  await expect(dialog.getByRole('heading', { name: 'Bone Shards', exact: true })).toBeVisible();
  await expect(dialog).toContainText('Melee 1 or ranged 10');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.mouse.click(10, 500);
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await search.fill('Ghost');
  await page.getByRole('button', { name: 'Stat blocks', exact: true }).click();
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: theme, exact: true }).click();
    await page.getByRole('button', { name: 'Open Ghost' }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('The ghost chooses one additional target.');
    await expect(dialog).toContainText('while flying this way.');
    await page.screenshot({
      path: `/artifacts/v36-regression-undead-${theme.toLowerCase()}.png`,
      fullPage: true,
    });
    await dialog.getByRole('button', { name: 'Open Haunt', exact: true }).click();
    await expect(dialog).toContainText('The ghost chooses one additional target.');
    await page.screenshot({
      path: `/artifacts/v36-regression-ability-${theme.toLowerCase()}.png`,
      fullPage: true,
    });
    await dialog.getByRole('button', { name: 'Close foe reference' }).click();
  }
  await search.fill('Zombie Dust');
  await page.getByRole('button', { name: 'Abilities', exact: true }).click();
  await page.getByRole('combobox', { name: 'Usage', exact: true }).selectOption('Maneuver');
  await page.getByRole('combobox', { name: 'Keyword', exact: true }).selectOption('Area');
  await page.getByRole('button', { name: 'Open Zombie Dust · Zombie' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('expelling a wave of rot and dust.');
  const text = await dialog.innerText();
  expect(text.indexOf('expelling a wave')).toBeLessThan(text.indexOf('Power Roll'));
  const prone = dialog.getByRole('link', { name: 'prone', exact: true }).first();
  await expect(prone).toHaveAttribute('href', '/rules/heroes/condition/prone');
  await prone.click();
  await expect(dialog.getByRole('heading', { name: 'Prone', exact: true }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/foes\?/);
  await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Zombie Dust', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('Zombie Dust');
});

test('second-echelon references preserve independent features and correct Malice navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/foes');
  await expect(page.getByRole('heading', { name: 'Foes library' })).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Search foes' });
  const setKind = async (kind: string) => {
    await page
      .getByRole('button', {
        name: kind === 'statblock' ? 'Stat blocks' : 'Abilities',
        exact: true,
      })
      .click();
  };
  await setKind('statblock');
  await expect(page.getByRole('status')).toHaveText('438 stat blocks');
  const firstEchelon = [
    'Crawling Claw',
    'Decrepit Skeleton',
    'Ghost',
    'Ghoul',
    'Rotting Zombie',
    'Shade',
    'Skeleton',
    'Soulwight',
    'Specter',
    'Umbral Stalker',
    'Zombie',
  ];
  for (const name of [
    ...firstEchelon,
    'Flesh Mournling',
    'Fleshflayed Shambler Zombie',
    'Ghoul Craver',
    'Giant Zombie',
    'Hollowbone Launcher',
    'Mummy Lord',
    'Mummy',
    'Vampire Spawn',
    'Wraith',
  ]) {
    await search.fill(name);
    await page.getByRole('button', { name: `Open ${name}`, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(
      dialog.getByRole('button', {
        name: `Undead Malice (Level ${firstEchelon.includes(name) ? 1 : 4}+ Malice Features)`,
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
  }
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: theme, exact: true }).click();
    await search.fill('Binding Curse');
    await setKind('ability');
    const trigger = page.getByRole('button', {
      name: 'Open Binding Curse · Mummy Lord',
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('one additional target for each 2 Malice spent');
    await expect(dialog).toContainText('4 psychic damage whenever they use a move action');
    await page.screenshot({
      path: testInfo.outputPath(`second-echelon-ability-${theme.toLowerCase()}.png`),
      fullPage: true,
    });
    await dialog.getByRole('button', { name: 'From Mummy Lord', exact: true }).click();
    await expect(dialog).toContainText('Villain Action 3');
    await page.screenshot({
      path: testInfo.outputPath(`second-echelon-${theme.toLowerCase()}.png`),
      fullPage: true,
    });
    await dialog.getByRole('button', { name: 'Open Cursed Transference', exact: true }).click();
    await expect(dialog).toContainText("This damage can't be reduced");
    await dialog.getByRole('button', { name: 'From Mummy Lord', exact: true }).click();
    await dialog
      .getByRole('button', { name: 'Undead Malice (Level 4+ Malice Features)', exact: true })
      .click();
    await expect(dialog).toContainText('At the start of any level 4 or higher');
    await dialog.getByRole('button', { name: 'Open Blood Hunger', exact: true }).click();
    await expect(dialog).toContainText('each undead within 5 squares');
    await dialog
      .getByRole('button', { name: 'From Undead Malice (Level 4+ Malice Features)', exact: true })
      .click();
    await dialog
      .getByRole('button', { name: 'Undead Malice (Level 1+ Malice Features)', exact: true })
      .click();
    await expect(dialog).toContainText('Ravenous Horde');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
});
