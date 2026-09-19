// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import { register, PASSWORD } from './v21-fixtures';

test('primary choices collapse, edit without loss, prune on replacement and reopen saved', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const stamp = crypto.randomUUID().slice(0, 8);
  const email = `v42-${stamp}@example.test`;
  const name = `Choice ${stamp}`;
  await register(page, name, email);
  const query = async (operation: string, args = {}) => {
    const result = await promisify(execFile)(
      'pnpm',
      ['app', 'query', operation, JSON.stringify(args)],
      {
        env: { ...process.env, SALIENT_EMAIL: email, SALIENT_PASSWORD: PASSWORD },
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    return JSON.parse(result.stdout);
  };
  const step = (label: string) =>
    page
      .getByRole('navigation', { name: 'Steps' })
      .getByRole('button', { name: new RegExp(label) })
      .click();
  const summary = (label: string) =>
    page.getByRole('region', { name: `Selected ${label}`, exact: true });
  const edit = (label: string) => page.getByRole('button', { name: `Edit ${label}`, exact: true });
  await page.goto('/characters/new/wizard');
  await step('Ancestry');
  await expect(page.getByLabel('Dwarf', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Silver Tongue skill', { exact: true })).toHaveCount(0);
  await page.getByLabel('Devil', { exact: true }).click();
  await expect(summary('ancestry')).toContainText('Devil');
  await expect(edit('ancestry')).toBeFocused();
  await expect(page.getByLabel('Polder', { exact: true })).toHaveCount(0);
  await page.getByLabel('Silver Tongue skill', { exact: true }).selectOption('Persuade');
  await page.getByLabel('Beast Legs', { exact: true }).check();
  await mkdir('.playtest/v42', { recursive: true });
  await page.screenshot({ path: '.playtest/v42/ancestry-selected.png', fullPage: true });
  await edit('ancestry').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('group', { name: 'Choose ancestry', exact: true })).toBeFocused();
  await expect(page.getByLabel('Devil', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Silver Tongue skill', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Beast Legs', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: '.playtest/v42/ancestry-editing.png', fullPage: true });
  await page.getByRole('button', { name: 'Keep Devil', exact: true }).click();
  await expect(page.getByLabel('Silver Tongue skill', { exact: true })).toHaveValue('Persuade');
  await expect(page.getByLabel('Beast Legs', { exact: true })).toBeChecked();
  await edit('ancestry').click();
  await page.getByLabel('Polder', { exact: true }).click();
  await expect(summary('ancestry')).toContainText('Polder');
  await expect(page.getByLabel('Beast Legs', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Cleared because a parent choice changed/)).toBeVisible();
  await step('Culture');
  await page.getByLabel('Culture name', { exact: true }).fill('River folk');
  await expect(page.getByLabel('Wilderness', { exact: true })).toBeVisible();
  await expect(edit('culture')).toHaveCount(0);
  await step('Career');
  await page.getByLabel('Artisan', { exact: true }).click();
  await page.getByLabel('Artisan: choose 2 skills 1', { exact: true }).selectOption('Alchemy');
  await edit('career').click();
  await expect(page.getByLabel('Artisan: choose 2 skills 1', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Keep Artisan', exact: true }).click();
  await expect(page.getByLabel('Artisan: choose 2 skills 1', { exact: true })).toHaveValue(
    'Alchemy',
  );
  await step('Class');
  await page.getByLabel('Fury', { exact: true }).click();
  await page.getByLabel('1, 0, 0', { exact: true }).check();
  await edit('class').click();
  await expect(page.getByLabel('1, 0, 0', { exact: true })).toHaveCount(0);
  await page.getByLabel('Elementalist', { exact: true }).click();
  await expect(summary('class')).toContainText('Elementalist');
  await step('Kit');
  await expect(edit('kit')).toHaveCount(0);
  await expect(page.getByLabel('Choose a kit', { exact: true })).toHaveCount(0);
  await step('Class');
  await expect(summary('class')).toContainText('Elementalist');
  await edit('class').click();
  await page.getByLabel('Fury', { exact: true }).click();
  await page.getByLabel('Berserker', { exact: true }).check();
  await step('Kit');
  await page.getByLabel('Choose a kit', { exact: true }).selectOption('Mountain');
  await expect(summary('kit')).toContainText('Mountain');
  await summary('kit')
    .getByRole('button', { name: 'Read Mountain in the rules', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Stamina');
  await page.getByRole('button', { name: 'Close rule', exact: true }).click();
  await edit('kit').click();
  await expect(page.getByLabel('Choose a kit', { exact: true })).toHaveValue('Mountain');
  await page.getByRole('button', { name: 'Keep Mountain', exact: true }).click();
  await step('Complication');
  await page.getByRole('button', { name: 'Use no complication', exact: true }).click();
  await expect(summary('complication')).toContainText('No complication');
  await edit('complication').click();
  await page.getByLabel('Complication', { exact: true }).selectOption('Elemental Inside');
  await expect(summary('complication')).toContainText('Elemental Inside');
  await summary('complication')
    .getByRole('button', { name: 'Read Elemental Inside in the rules', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Drawback');
  await page.keyboard.press('Escape');
  await edit('complication').click();
  await page.getByLabel('Complication', { exact: true }).selectOption('');
  await expect(summary('complication')).toContainText('No complication');
  await step('Career');
  await step('Complication');
  await expect(summary('complication')).toContainText('No complication');
  expect(await query('characters:listMine')).toEqual([]);
  await step('Determine Details');
  await page.getByLabel('Hero name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/\/characters\/(?!new\/)[^/]+\/wizard$/);
  const characterId = page.url().split('/').at(-2)!;
  const saved = await query('characters:get', { characterId });
  expect(saved.revision).toBe(1);
  expect(saved.selections).toContainEqual(
    expect.objectContaining({ decisionId: 'ancestry.choice', value: 'Polder' }),
  );
  expect(saved.selections).toContainEqual(
    expect.objectContaining({ decisionId: 'class.choice', value: 'Fury' }),
  );
  expect(
    saved.selections.some((choice: { decisionId: string }) =>
      choice.decisionId.startsWith('ancestry.devil.'),
    ),
  ).toBe(false);
  await page.reload();
  await step('Career');
  await expect(summary('career')).toContainText('Artisan');
  await expect(page.getByLabel('Artisan: choose 2 skills 1', { exact: true })).toHaveValue(
    'Alchemy',
  );
  await edit('career').click();
  await step('Ancestry');
  await expect(summary('ancestry')).toContainText('Polder');
  await step('Career');
  await expect(summary('career')).toContainText('Artisan');
  await edit('career').click();
  await page.getByRole('button', { name: 'Keep Artisan', exact: true }).click();
  await step('Complication');
  await expect(summary('complication')).toContainText('No complication');
  await edit('complication').click();
  await page.getByRole('button', { name: 'Use no complication', exact: true }).click();
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  expect((await query('characters:get', { characterId })).revision).toBe(1);
});
