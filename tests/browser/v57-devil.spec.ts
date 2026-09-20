// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { register, PASSWORD } from './v21-fixtures';

// Catches UI-disabled new options, lost persisted choices, and missing conditional source text.
// Mechanical permutations stay in the evaluator table; this is one real saved editor journey.
test('V57 new Devil choices persist and Wings remains readable with its conditional limits', async ({
  page,
}) => {
  const stamp = crypto.randomUUID().slice(0, 8);
  const email = `v57-${stamp}@example.test`;
  await register(page, `Devil ${stamp}`, email);
  await page.goto('/characters/new/wizard');
  const ancestry = () =>
    page
      .getByRole('navigation', { name: 'Steps' })
      .getByRole('button', { name: /Ancestry/ })
      .click();
  await ancestry();
  await page.getByLabel('Devil', { exact: true }).click();
  await page.getByLabel('Silver Tongue skill', { exact: true }).selectOption('Read Person');
  await page.getByLabel('Wings', { exact: true }).check();
  await page.getByLabel('Barbed Tail', { exact: true }).check();
  await expect(page.getByText('3 of 3 points spent')).toBeVisible();
  await page.getByRole('button', { name: 'Read Wings in the rules', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('minimum 1 round');
  await expect(dialog).toContainText('3rd level or lower');
  await expect(dialog).toContainText('damage weakness');
  await mkdir('.playtest/v57', { recursive: true });
  await page.screenshot({ path: '.playtest/v57/wings-source.png', fullPage: true });
  await page.getByRole('button', { name: 'Close rule', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Steps' })
    .getByRole('button', { name: /Determine Details/ })
    .click();
  await page.getByLabel('Hero name', { exact: true }).fill(`Devil ${stamp}`);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/\/characters\/(?!new\/)[^/]+\/wizard$/);
  const characterId = page.url().split('/').at(-2)!;
  const readback = await promisify(execFile)(
    'pnpm',
    ['app', 'query', 'characters:get', JSON.stringify({ characterId })],
    {
      env: { ...process.env, SALIENT_EMAIL: email, SALIENT_PASSWORD: PASSWORD },
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  const saved = JSON.parse(readback.stdout);
  expect(saved.selections).toContainEqual(
    expect.objectContaining({
      decisionId: 'ancestry.devil.silver-tongue-skill',
      value: 'Read Person',
    }),
  );
  expect(saved.selections).toContainEqual(
    expect.objectContaining({
      decisionId: 'ancestry.devil.purchased-traits',
      value: ['Wings', 'Barbed Tail'],
    }),
  );
  await writeFile('.playtest/v57/saved-draft.json', JSON.stringify(saved, null, 2));
  await page.reload();
  await ancestry();
  await expect(page.getByLabel('Silver Tongue skill', { exact: true })).toHaveValue('Read Person');
  await expect(page.getByLabel('Wings', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Barbed Tail', { exact: true })).toBeChecked();
  await page.screenshot({ path: '.playtest/v57/reopened-devil.png', fullPage: true });
});
