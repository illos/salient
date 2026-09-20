// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { startCharacter } from './character-fixtures';
import { PASSWORD, register } from './v21-fixtures';
import reference from '../fixtures/v25-bethell.json' with { type: 'json' };
import type { EvaluationResult } from '../../shared/contracts/characterEvaluation';

// Catches disabled wizard options, lost saves and unreadable source dialogs that
// evaluator tests cannot detect. One same-build journey covers all three new traits.
test('Polder movement choices can be completed in the wizard, reloaded and read from persisted state', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const stamp = crypto.randomUUID().slice(0, 8);
  const email = `v58-polder-${stamp}@example.test`;
  await register(page, `Polder ${stamp}`, email);
  await page.getByRole('link', { name: 'Characters', exact: true }).click();
  await startCharacter(page, `Polder movement ${stamp}`);
  const step = (name: string) => page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  const pick = (label: string, value: string) =>
    page.getByLabel(label, { exact: true }).selectOption(value);
  const check = (label: string) => page.getByLabel(label, { exact: true }).check();
  await step('2\\. Ancestry');
  await page.getByLabel('Polder', { exact: true }).click();
  const traits = ['Nimblestep', 'Polder Geist', 'Reactive Tumble'];
  for (const trait of traits) await check(trait);
  await expect(page.getByText('4 of 4 points spent')).toBeVisible();
  await step('3\\. Culture');
  await page.getByLabel('Culture name', { exact: true }).fill('Polder');
  await pick('Additional language', 'Khoursirian');
  await check('Urban');
  await pick('Environment skill', 'Alertness');
  await check('Communal');
  await pick('Organization skill', 'Gymnastics');
  await check('Creative');
  await pick('Upbringing skill', 'Tailoring');
  await step('4\\. Career');
  await page.getByLabel("Mage's Apprentice", { exact: true }).click();
  await pick('Career skills 1', 'Monsters');
  await pick('Career skills 2', 'Timescape');
  await pick('Career languages 1', 'The First Language');
  await check('Arcane Trick');
  await check('Forgotten Memories');
  await step('5\\. Class');
  await page.getByLabel('Elementalist', { exact: true }).click();
  await check('2, 1, 1, −1');
  for (const [name, value] of Object.entries(
    reference.selections['class.elementalist.array-assignment'],
  ))
    await pick(`Assign ${name}`, String(value));
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
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByText(/^Draft saved \(revision \d+\)/)).toBeVisible();
  await page.reload();
  await step('2\\. Ancestry');
  for (const trait of traits) await expect(page.getByLabel(trait, { exact: true })).toBeChecked();
  await expect(page.getByLabel('Hero so far').getByText('complete', { exact: true })).toBeVisible();
  const directory = '.playtest/v58/polder';
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: `${directory}/reloaded-wizard.png`, fullPage: true });
  const characterId = page.url().split('/').at(-2)!;
  const result = await promisify(execFile)(
    'pnpm',
    ['app', 'query', 'characters:get', JSON.stringify({ characterId })],
    {
      env: { ...process.env, SALIENT_EMAIL: email, SALIENT_PASSWORD: PASSWORD },
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  const saved = JSON.parse(result.stdout) as { evaluation: EvaluationResult };
  expect(saved.evaluation.status).toBe('complete');
  expect(saved.evaluation.baseline!.speed.value).toBe(5);
  expect(saved.evaluation.baseline!.disengage.value).toBe(1);
  await writeFile(`${directory}/readback.json`, JSON.stringify(saved, null, 2));
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/characters/${characterId}$`));
  for (const [trait, phrase] of [
    ['Nimblestep', 'while sneaking'],
    ['Polder Geist', 'until the end of your turn'],
    ['Reactive Tumble', 'after the forced movement is resolved'],
  ]) {
    await page
      .getByRole('button', { name: `Read ${trait} in the rules`, exact: true })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toContainText(phrase!);
    await page.screenshot({
      path: `${directory}/${trait!.toLowerCase().replaceAll(' ', '-')}.png`,
      fullPage: true,
    });
    await page.keyboard.press('Escape');
  }
});
