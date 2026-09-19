import { startCharacter } from './character-fixtures';
// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { register } from './v21-fixtures';
import reference from '../fixtures/v25-bethell.json' with { type: 'json' };

test('corrected Forge Bethell: complete wizard, reload, review and sourced sheet', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const contexts = await Promise.all([
    browser.newContext({ viewport: { width: 1440, height: 900 } }),
    browser.newContext(),
  ]);
  try {
    const [page, director] = await Promise.all(contexts.map(context => context.newPage()));
    page!.setDefaultTimeout(15_000);
    director!.setDefaultTimeout(15_000);
    const stamp = crypto.randomUUID().slice(0, 8);
    const name = `Bethell ${stamp}`;
    await register(director!, `Director ${stamp}`, `v25-director-${stamp}@example.test`);
    await director!.getByLabel('Campaign name').fill(`V25 ${stamp}`);
    await director!.getByRole('button', { name: 'Create campaign', exact: true }).click();
    const invite = await director!.getByLabel('Invitation link').inputValue();
    await register(page!, `Player ${stamp}`, `v25-player-${stamp}@example.test`);
    await page!.goto(invite);
    await page!.getByRole('button', { name: 'Request to join', exact: true }).click();
    await director!.getByRole('button', { name: 'Approve', exact: true }).click();
    await page!.getByRole('link', { name: 'Characters', exact: true }).click();
    await startCharacter(page!, name);
    const step = async (name: string) =>
      page!.getByRole('button', { name: new RegExp(`^${name.replace('.', '\\.')}`) }).click();
    const pick = async (label: string, value: string) =>
      page!.getByLabel(label, { exact: true }).selectOption(value);
    const check = async (label: string) => page!.getByLabel(label, { exact: true }).check();
    await step('2. Ancestry');
    await check('Polder');
    for (const trait of reference.selections['ancestry.polder.purchased-traits'])
      await check(trait);
    await expect(page!.getByText('4 of 4 points spent')).toBeVisible();
    await step('3. Culture');
    await page!.getByLabel('Culture name', { exact: true }).fill('Polder');
    await pick('Additional language', 'Khoursirian');
    await check('Urban');
    await pick('Environment skill', 'Alertness');
    await check('Communal');
    await pick('Organization skill', 'Gymnastics');
    await check('Creative');
    await pick('Upbringing skill', 'Tailoring');
    await step('4. Career');
    await check("Mage's Apprentice");
    await pick('Career skills 1', 'Monsters');
    await pick('Career skills 2', 'Timescape');
    await pick('Career languages 1', 'The First Language');
    await check('Arcane Trick');
    await check('Forgotten Memories');
    await step('5. Class');
    await check('Elementalist');
    await check('2, 1, 1, −1');
    await expect(page!.getByLabel('Reason (fixed)', { exact: true })).toContainText('2');
    for (const [target, amount] of Object.entries(
      reference.selections['class.elementalist.array-assignment'],
    ))
      await pick(`Assign ${target}`, String(amount));
    for (const [index, skill] of reference.selections['class.elementalist.skills'].entries())
      await pick(`Additional class skills ${index + 1}`, skill);
    await pick('Replacement for duplicate Magic skill', 'Empathize');
    for (const option of [
      'Fire',
      'Enchantment of Destruction',
      'Ward of Delightful Consequences',
      'The Flesh, a Crucible',
      'Conflagration',
    ])
      await check(option);
    await pick('Signature abilities 1', 'Bifurcated Incineration');
    await pick('Signature abilities 2', 'Viscous Fire');
    await mkdir('.playtest/v25', { recursive: true });
    await page!.screenshot({ path: '.playtest/v25/elementalist-class.png', fullPage: true });
    await step('6. Kit');
    await expect(page!.getByLabel('Mountain', { exact: true })).toHaveCount(0);
    await page!.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page!.getByText(/^Draft saved \(revision \d+\)/)).toBeVisible();
    await page!.reload();
    await step('5. Class');
    await expect(page!.getByLabel('Elementalist', { exact: true })).toBeChecked();
    await expect(page!.getByLabel('Assign Might', { exact: true })).toHaveValue('-1');
    await expect(
      page!.getByLabel('Hero so far').getByText('complete', { exact: true }),
    ).toBeVisible();
    await page!.getByRole('button', { name: 'Exit', exact: true }).click();
    await page!.getByRole('button', { name: 'Submit for admission', exact: true }).click();
    await director!.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(
      page!
        .locator('span')
        .filter({ hasText: /^Effective build$/ })
        .first(),
    ).toBeVisible();
    await expect(page!.getByText('18 / 18', { exact: true }).first()).toBeVisible();
    await expect(page!.getByText('8 / 8', { exact: true }).first()).toBeVisible();
    await expect(page!.getByText('essence', { exact: false }).first()).toBeVisible();
    for (const ability of new Set([
      ...reference.expected.traits,
      ...reference.expected.features,
      ...reference.expected.perks,
      ...reference.expected.abilities,
    ])) {
      await page!
        .getByRole('button', { name: `Read ${ability} in the rules`, exact: true })
        .first()
        .click();
      if (ability !== 'Culture edge')
        await expect(page!.getByRole('dialog')).toContainText(ability);
      await expect(page!.getByRole('dialog')).not.toContainText('scc.v1:');
      await page!.keyboard.press('Escape');
    }
    await expect(page!.getByText(/Enchantment of Destruction/).first()).toBeVisible();
    await page!.screenshot({ path: '.playtest/v25/elementalist-sheet.png', fullPage: true });
    expect(
      await page!.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
