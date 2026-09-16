// SPDX-License-Identifier: GPL-3.0-only
/** V32: real authenticated level-up, persisted sheet/source readback, additive restoration. */
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createTable } from './v21-fixtures';
import type { Credentials } from './local-fixtures';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import reference from '../fixtures/v32-fury-level-two.json' with { type: 'json' };

async function app(
  credentials: Credentials,
  kind: 'query' | 'mutation',
  name: string,
  args: unknown,
) {
  const result = await promisify(execFile)('pnpm', ['app', kind, name, JSON.stringify(args)], {
    env: {
      ...process.env,
      SALIENT_EMAIL: credentials.email,
      SALIENT_PASSWORD: credentials.password,
    },
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(result.stdout);
}

test('Fury advancement preserves live state; source-complete sheet and reviewed history restoration', async ({
  browser,
}) => {
  test.setTimeout(600_000);
  const fixture = await createTable(browser);
  const { player, director, heroId: characterId, campaignId, heroName } = fixture;
  const owner = fixture.credentials('player');
  const dm = fixture.credentials('director');
  const directory = '.playtest/v32/application';
  await mkdir(directory, { recursive: true });
  const query = (name: string, args: unknown) => app(owner, 'query', name, args);
  const adjust = (field: string, value: number) =>
    app(dm, 'mutation', 'commands:submit', {
      campaignId,
      commandId: crypto.randomUUID(),
      text: `@"${heroName}" /adjust ${field} value=${value}`,
    });
  try {
    await player.goto(`/characters/${characterId}`);
    await player.getByRole('link', { name: 'Progression', exact: true }).click();
    await expect(
      player.getByText('Level two requires 16 cumulative XP.', { exact: true }),
    ).toBeVisible();
    // Director setup goes through public authorized commands, never database patching.
    for (const [field, value] of [
      ['xp', 16],
      ['stamina', 20],
      ['recoveries', 4],
      ['heroic-resource', 3],
    ] as const)
      await adjust(field, value);
    const before: HeroSheet = await query('characters:sheet', { characterId });
    const original = await query('characters:get', { characterId });
    await player.getByLabel('Danger Sense', { exact: true }).check();
    await player.getByLabel('Wrecking Ball', { exact: true }).check();
    await player.getByRole('button', { name: 'Save advancement draft', exact: true }).click();
    await expect
      .poll(async () => (await query('characters:progression', { characterId })).draft?.version)
      .toBe(1);
    await player.reload();
    await expect(player.getByLabel('Danger Sense', { exact: true })).toBeChecked();
    await expect(player.getByLabel('Wrecking Ball', { exact: true })).toBeChecked();
    await expect(
      player.getByRole('button', { name: 'Advance to level 2', exact: true }),
    ).toBeDisabled();
    await player.getByLabel('This advancement occurs during a respite', { exact: true }).check();
    await player.screenshot({ path: `${directory}/advancement-ready.png`, fullPage: true });
    await player.getByRole('button', { name: 'Advance to level 2', exact: true }).click();
    await expect
      .poll(
        async () => (await query('characters:sheet', { characterId })).build?.baseline?.level.value,
      )
      .toBe(2);
    await player.goto(`/characters/${characterId}`);
    await expect(player.getByText('20 / 39', { exact: true }).first()).toBeVisible();
    const featureRows = player.getByRole('list', { name: 'Features', exact: true });
    await expect(
      featureRows.getByRole('listitem').filter({ hasText: 'Ferocity' }).first(),
    ).toContainText('Class · L1');
    await expect(
      featureRows.getByRole('listitem').filter({ hasText: 'Unstoppable Force' }),
    ).toContainText('Subclass · L2');
    const advanced: HeroSheet = await query('characters:sheet', { characterId });
    const baseline = advanced.build!.baseline!;
    for (const field of [
      'level',
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'disengage',
      'savingThrowThreshold',
      'renown',
      'wealth',
    ] as const)
      expect(baseline[field].value, field).toEqual(reference.expected[field]);
    for (const field of [
      'ancestry',
      'class',
      'subclass',
      'career',
      'size',
      'potencyCharacteristic',
    ] as const)
      expect(baseline[field].value, field).toEqual(reference.expected[field]);
    for (const field of ['characteristics', 'potency'] as const)
      expect(
        Object.fromEntries(Object.entries(baseline[field]).map(([key, stat]) => [key, stat.value])),
        field,
      ).toEqual(reference.expected[field]);
    expect(baseline.heroicResource.name.value).toBe(reference.expected.heroicResource);
    expect(baseline.kit?.name.value).toBe(reference.expected.kit);
    for (const field of [
      'skills',
      'languages',
      'traits',
      'features',
      'perks',
      'abilities',
    ] as const)
      expect(baseline[field].map(grant => grant.name).sort(), field).toEqual(
        [...reference.expected[field]].sort(),
      );
    for (const [key, value] of Object.entries(before.live!))
      if (key !== 'labels')
        expect(Object.fromEntries(Object.entries(advanced.live!))[key], key).toEqual(value);
    const sourceReadback = [];
    for (const grant of [...advanced.features, ...advanced.abilities]) {
      expect(grant.content, `${grant.name} content`).not.toBeNull();
      const content = grant.content!;
      expect(content.revision).toBe(reference.compendiumRevision);
      expect(content.text).toBe(await readFile(content.sourcePath, 'utf8'));
      sourceReadback.push({
        name: grant.name,
        path: content.sourcePath,
        revision: content.revision,
      });
    }
    for (const name of ['Unstoppable Force', 'Danger Sense', 'Wrecking Ball']) {
      await player
        .getByRole('button', { name: `Read ${name} in the rules`, exact: true })
        .first()
        .click();
      await expect(player.getByRole('dialog')).toContainText(name);
      await player.keyboard.press('Escape');
    }
    await player.screenshot({ path: `${directory}/level-two-sheet.png`, fullPage: true });
    // The full editor must round-trip the new choices rather than silently reverting to level one.
    await player.getByRole('link', { name: 'Edit', exact: true }).click();
    await player.getByRole('button', { name: /^5\. Class/ }).click();
    await expect(player.getByLabel('Wrecking Ball', { exact: true })).toBeChecked();
    await expect(player.getByLabel('Danger Sense', { exact: true })).toBeChecked();
    await player.getByRole('button', { name: 'Exit', exact: true }).click();
    // Preview is read-only. Restoring lower maximum caps only on exact revision approval.
    await adjust('stamina', 39);
    await player.getByRole('link', { name: 'Progression', exact: true }).click();
    await player
      .getByRole('button', { name: new RegExp(`^Revision ${original.revision} · level 1`) })
      .click();
    expect((await query('characters:sheet', { characterId })).build.baseline.level.value).toBe(2);
    await player.screenshot({ path: `${directory}/history-preview.png`, fullPage: true });
    await player.getByRole('button', { name: 'Restore this build', exact: true }).click();
    await expect
      .poll(async () => (await query('characters:get', { characterId })).review?.status)
      .toBe('pending');
    expect((await query('characters:sheet', { characterId })).live.stamina).toBe(39);
    await director.goto(`/characters/${characterId}/progression`);
    await expect(
      director.getByRole('button', { name: 'Restore this build', exact: true }),
    ).toHaveCount(0);
    await expect(director.getByText('Private audit fixture note')).toHaveCount(0);
    await director.goto(fixture.campaignUrl);
    await director.getByRole('button', { name: 'Approve', exact: true }).click();
    await player.goto(`/characters/${characterId}`);
    await expect(player.getByText('30 / 30', { exact: true }).first()).toBeVisible();
    const restored: HeroSheet = await query('characters:sheet', { characterId });
    expect(restored.build!.baseline).toEqual(before.build!.baseline);
    expect(restored.authored).toEqual(before.authored);
    expect(restored.live).toMatchObject({
      stamina: 30,
      recoveries: 4,
      heroicResource: { current: 3 },
      xp: 16,
    });
    const history = await query('characters:history', {
      characterId,
      paginationOpts: { cursor: null, numItems: 20 },
    });
    expect(
      history.page.some(
        (row: { kind: string; level: number }) => row.kind === 'level-up' && row.level === 2,
      ),
    ).toBe(true);
    expect(history.page[0]).toMatchObject({
      kind: 'restore',
      restoredFromRevisionId: original.effectiveRevisionId,
      isEffective: true,
    });
    await player.screenshot({ path: `${directory}/restored-sheet.png`, fullPage: true });
    await writeFile(
      `${directory}/readback.json`,
      JSON.stringify(
        { characterId, campaignId, before, advanced, restored, history, sourceReadback },
        null,
        2,
      ),
    );
  } finally {
    await fixture.close();
  }
});
