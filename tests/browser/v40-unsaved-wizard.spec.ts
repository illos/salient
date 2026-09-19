// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import { register, PASSWORD } from './v21-fixtures';

test('unsaved wizard creates nothing until first explicit save, then edits the same character', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const stamp = crypto.randomUUID().slice(0, 8);
  const email = `v40-${stamp}@example.test`;
  const name = `Draft ${stamp}`;
  let holdCreate = false;
  let releaseCreate: (() => void) | undefined;
  await page.routeWebSocket(/\/sync$/, socket => {
    const server = socket.connectToServer();
    socket.onMessage(message => {
      const request = JSON.parse(String(message));
      if (holdCreate && request.type === 'Mutation' && request.udfPath === 'characters:create') {
        releaseCreate = () => server.send(message);
      } else server.send(message);
    });
  });
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
    page.getByRole('button', { name: new RegExp(`^${label}`) }).click();
  await page.getByRole('link', { name: 'Characters', exact: true }).click();
  await expect(page.getByLabel('Hero name', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Open character wizard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unnamed hero', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
  await step('2\\. Ancestry');
  await page.getByLabel('Polder', { exact: true }).check();
  expect(await query('characters:listMine')).toEqual([]);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a name in Details');
  await expect(page.getByLabel('Hero name', { exact: true })).toBeVisible();
  expect(await query('characters:listMine')).toEqual([]);
  await page.getByLabel('Hero name', { exact: true }).fill('Discard me');
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page).toHaveURL(/\/characters$/);
  expect(await query('characters:listMine')).toEqual([]);
  // A direct deep link and reload also remain read-only.
  await page.goto('/characters/new/wizard');
  await step('2\\. Ancestry');
  await page.getByLabel('Polder', { exact: true }).check();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Unnamed hero', exact: true })).toBeVisible();
  await step('2\\. Ancestry');
  await expect(page.getByLabel('Polder', { exact: true })).not.toBeChecked();
  expect(await query('characters:listMine')).toEqual([]);
  await page.getByLabel('Polder', { exact: true }).check();
  await step('9\\. Determine Details');
  await page.getByLabel('Hero name', { exact: true }).fill(name);
  await page.getByLabel('Private notes', { exact: false }).fill('My first unsaved notes');
  await mkdir('.playtest/v40', { recursive: true });
  await page.screenshot({ path: '.playtest/v40/before-first-save.png', fullPage: true });
  await step('5\\. Class');
  await page.getByLabel('Fury', { exact: true }).check();
  await page.getByLabel('1, 0, 0', { exact: true }).check();
  // Hold the first create in transit: even custom drag/drop must not mutate the saved snapshot.
  holdCreate = true;
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect.poll(() => Boolean(releaseCreate)).toBe(true);
  await expect(page.getByLabel('Assign Reason', { exact: true })).toBeDisabled();
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.setData('application/json', JSON.stringify({ value: 1 }));
    return data;
  });
  await page.getByTestId('assignment-Reason').dispatchEvent('drop', { dataTransfer: transfer });
  await expect(page.getByLabel('Assign Reason', { exact: true })).toHaveValue('');
  expect(await query('characters:listMine')).toEqual([]);
  holdCreate = false;
  releaseCreate!();
  await expect(page).toHaveURL(/\/characters\/(?!new\/)[^/]+\/wizard$/);
  const characterId = page.url().split('/').at(-2)!;
  const saved = await query('characters:get', { characterId });
  expect(saved).toMatchObject({ revision: 1, authored: { name, notes: 'My first unsaved notes' } });
  expect(saved.selections).toContainEqual(
    expect.objectContaining({ decisionId: 'ancestry.choice', value: 'Polder' }),
  );
  expect(await query('characters:listMine')).toHaveLength(1);
  await page.reload();
  await step('2\\. Ancestry');
  await expect(page.getByLabel('Polder', { exact: true })).toBeChecked();
  await step('9\\. Determine Details');
  await page.getByLabel('Hero name', { exact: true }).fill(`${name} edited`);
  await step('10\\. Make Connections');
  await page.getByRole('button', { name: 'Save and close', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/characters/${characterId}$`));
  expect(await query('characters:listMine')).toHaveLength(1);
  expect(await query('characters:get', { characterId })).toMatchObject({
    revision: 2,
    authored: { name: `${name} edited` },
  });
  await page.screenshot({ path: '.playtest/v40/saved-character.png', fullPage: true });
  // Save and close can also be the very first save.
  await page.goto('/characters/new/wizard');
  await step('9\\. Determine Details');
  await page.getByLabel('Hero name', { exact: true }).fill(`${name} closed`);
  await step('10\\. Make Connections');
  await page.getByRole('button', { name: 'Save and close', exact: true }).click();
  await expect(page).toHaveURL(/\/characters\/[^/]+$/);
  expect(await query('characters:listMine')).toHaveLength(2);
});
