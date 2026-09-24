// SPDX-License-Identifier: GPL-3.0-only
/**
 * V182 (non-table; authored, not yet run by TESTER): Forge Steel import from the characters list.
 * Choosing a file previews it without writing; Import opens the new draft, whose page lists the
 * owner's import diagnostics. A hero above its class ceiling is refused in the preview (Q-V-6
 * interim). Persisted state is read back through the CLI route, not the page.
 */
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { PASSWORD, register } from './v21-fixtures';

const shadow = gunzipSync(
  readFileSync('tests/fixtures/v182-forge/shadow-level-3.ds-hero.gz'),
).toString('utf8');

test('a Forge Steel hero is previewed, then imported as a draft with owner diagnostics', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const stamp = crypto.randomUUID().slice(0, 8);
  const email = `v182-${stamp}@example.test`;
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
  await register(page, `Importer ${stamp}`, email);
  await page.getByRole('link', { name: 'Characters', exact: true }).click();
  const file = page.getByLabel('Forge Steel hero file');

  // Above the ceiling: the preview refuses and offers no Import.
  const tooHigh = JSON.parse(shadow);
  tooHigh.class.level = 7;
  await file.setInputFiles({
    name: 'too-high.ds-hero',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(tooHigh)),
  });
  const preview = page.getByRole('region', { name: 'Import preview' });
  await expect(preview.getByRole('alert')).toContainText('Shadow heroes up to level 6');
  await expect(preview.getByRole('button', { name: 'Import', exact: true })).toHaveCount(0);
  expect(await query('characters:listMine')).toEqual([]);

  // Within the ceiling: preview, then import.
  await file.setInputFiles({
    name: 'shadow-level-3.ds-hero',
    mimeType: 'application/json',
    buffer: Buffer.from(shadow),
  });
  await expect(preview).toContainText('Shadow 3');
  await expect(preview).toContainText('Level 3 Shadow');
  expect(await query('characters:listMine')).toEqual([]);
  await preview.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page).toHaveURL(/\/characters\/[^/]+$/);
  const characterId = page.url().split('/').pop()!;
  await expect(page.getByText('Imported from Forge Steel')).toBeVisible();

  const saved = await query('characters:get', { characterId });
  expect(saved.level).toBe(3);
  expect(saved.campaignId).toBeNull();
  const record = await query('characterImport:importDiagnostics', { characterId });
  expect(record.level).toBe(3);
});
