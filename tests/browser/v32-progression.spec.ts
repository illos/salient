// SPDX-License-Identifier: GPL-3.0-only
/**
 * V32: real authenticated level-up, persisted sheet/source readback, additive restoration. V185
 * moved the history preview and restore to the History page (full recorded sheet and comparison).
 */
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createTable } from './v21-fixtures';
import { vendorPath } from '../../scripts/lib/vendor';
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
  const fixture = await createTable(browser, { foes: false });
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
    await player.getByRole('link', { name: 'History', exact: true }).click();
    await expect(player).toHaveURL(new RegExp(`/characters/${characterId}/history$`));
    // V163: no level-up notice until the Director grants one; History keeps the notice (V185).
    // The revision list loading first means the notice's absence is not a loading artefact.
    await expect(
      player.getByRole('button', { name: /^Revision \d+ · Level 1 · / }).first(),
    ).toBeVisible();
    const notice = player.getByRole('region', { name: 'Level advancement' });
    await expect(notice).toHaveCount(0);
    await app(dm, 'mutation', 'commands:submit', {
      campaignId,
      commandId: crypto.randomUUID(),
      text: `/character grant-level-up`,
    });
    await expect(notice).toContainText('A level-up to level 2 is waiting.');
    for (const [field, value] of [
      ['xp', 16],
      ['stamina', 20],
      ['recoveries', 4],
      ['heroic-resource', 3],
    ] as const)
      await adjust(field, value);
    const before: HeroSheet = await query('characters:sheet', { characterId });
    const original = await query('characters:get', { characterId });
    // V164: the owner's sheet offers the level-up; it opens the builder's level-up mode.
    await player.goto(`/characters/${characterId}`);
    const levelUp = player.getByRole('link', { name: 'Level up to 2', exact: true });
    await expect(levelUp).toBeVisible();
    await player.screenshot({ path: `${directory}/v164-sheet-level-up.png`, fullPage: true });
    await levelUp.click();
    await expect(player.getByRole('heading', { level: 2, name: 'Level 2 perk' })).toBeVisible();
    // V37: switching a level-up perk removes its hidden modifier target before saving.
    await player.getByLabel('Area of Expertise', { exact: true }).check({ force: true });
    const target = player.getByLabel('Area of Expertise: choose an owned crafting skill', {
      exact: true,
    });
    await target.selectOption('Blacksmithing');
    await player.getByLabel('Danger Sense', { exact: true }).check({ force: true });
    await expect(target).toHaveCount(0);
    // The hero panel shows the evaluated level-2 build, not a pending one.
    await expect(player.getByText('Devil · Fury (Berserker) · Level 2')).toBeVisible();
    // Once the choice is evaluated, the perk step counts as done: no missing-selection notice.
    await expect(player.getByRole('progressbar', { name: 'Steps completed' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    await expect(
      player.getByRole('region', { name: 'Level-up step' }).getByText('Needs a selection'),
    ).toHaveCount(0);
    await player.screenshot({ path: `${directory}/v164-step-perk.png`, fullPage: true });
    // Moving on saves the level-up's choices (the shared saveAdvancement operation).
    await player.getByRole('button', { name: /Continue to Level 2 Berserker ability/ }).click();
    await expect(
      player.getByRole('heading', { level: 2, name: 'Level 2 Berserker ability' }),
    ).toBeVisible();
    await expect
      .poll(async () => (await query('characters:progression', { characterId })).draft?.version)
      .toBe(1);
    const savedAdvancement = await query('characters:progression', { characterId });
    expect(
      savedAdvancement.draft.selections.some((selection: { decisionId: string }) =>
        selection.decisionId.includes('area-of-expertise'),
      ),
    ).toBe(false);
    expect(savedAdvancement.baseSelections).toEqual(original.selections);
    await player.getByLabel('Wrecking Ball', { exact: true }).check({ force: true });
    await player.screenshot({ path: `${directory}/v164-step-ability.png`, fullPage: true });
    await player.getByRole('button', { name: /Continue to Review and take/ }).click();
    const review = player.getByRole('region', { name: 'Review' });
    await expect(review).toBeVisible();
    // Q-CHAR-2 revised: 10 damage taken stays (20/30 → 29/39); Recoveries 4/10 unchanged maximum.
    await expect(review.getByRole('row', { name: /Stamina/ })).toContainText('20 / 30');
    await expect(review.getByRole('row', { name: /Stamina/ })).toContainText('29 / 39');
    await expect(review).toContainText('Wrecking Ball');
    await player.screenshot({ path: `${directory}/v164-review.png`, fullPage: true });
    // Reloading resumes the saved choices.
    await player.reload();
    await expect(player.getByLabel('Danger Sense', { exact: true })).toBeChecked();
    await player.getByRole('button', { name: /Continue to Level 2 Berserker ability/ }).click();
    await expect(player.getByLabel('Wrecking Ball', { exact: true })).toBeChecked();
    await player.getByRole('button', { name: /Continue to Review and take/ }).click();
    await player
      .getByRole('region', { name: 'Review' })
      .getByRole('button', { name: 'Take level 2', exact: true })
      .click();
    await expect(player.getByText(`${heroName} is now level 2.`)).toBeVisible();
    await player.screenshot({ path: `${directory}/v164-taken.png`, fullPage: true });
    await expect
      .poll(
        async () => (await query('characters:sheet', { characterId })).build?.baseline?.level.value,
      )
      .toBe(2);
    await player.goto(`/characters/${characterId}`);
    // Q-CHAR-2 revised: 10 damage taken stays (20/30 → 29/39).
    await expect(player.getByText('29 / 39', { exact: true }).first()).toBeVisible();
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
    // Q-CHAR-2 revised: damage taken and Recoveries spent carry over to the new maxima
    // (Stamina 20/30 → 29/39); every other live value is unchanged.
    const recoveriesSpent =
      before.build!.baseline!.recoveriesMaximum.value - before.live!.recoveries;
    const carried: Record<string, unknown> = {
      ...before.live!,
      stamina: 29,
      recoveries: baseline.recoveriesMaximum.value - recoveriesSpent,
    };
    for (const [key, value] of Object.entries(carried))
      if (key !== 'labels')
        expect(Object.fromEntries(Object.entries(advanced.live!))[key], key).toEqual(value);
    const sourceReadback = [];
    for (const grant of [...advanced.features, ...advanced.abilities]) {
      expect(grant.content, `${grant.name} content`).not.toBeNull();
      const content = grant.content!;
      expect(content.revision).toBe(reference.compendiumRevision);
      expect(content.text).toBe(await readFile(vendorPath(content.sourcePath), 'utf8'));
      sourceReadback.push({
        name: grant.name,
        path: content.sourcePath,
        revision: content.revision,
      });
    }
    // V34's full-source card must retain the target rule outside the metadata table.
    await expect(
      player.getByText(
        'Additionally, you make one power roll that targets each enemy you move adjacent to during this movement.',
        { exact: true },
      ),
    ).toBeVisible();
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
    // The builder rail labels each step `${step.name}: ${step.chosen}`, e.g. "Class: Fury".
    await player.getByRole('button', { name: /^Class/ }).click();
    await expect(player.getByLabel('Wrecking Ball', { exact: true })).toBeChecked();
    await expect(player.getByLabel('Danger Sense', { exact: true })).toBeChecked();
    await player.getByRole('button', { name: 'Exit', exact: true }).click();
    // V185: the History page previews the full recorded sheet, read-only, with a comparison.
    // Restoring the lower maximum applies only on exact revision approval.
    await adjust('stamina', 39);
    await player.getByRole('link', { name: 'History', exact: true }).click();
    await player
      .getByRole('button', { name: new RegExp(`^Revision ${original.revision} · Level 1 · `) })
      .click();
    const recorded = player.getByRole('region', { name: 'Recorded build' });
    await expect(
      recorded.getByRole('article', { name: `${heroName} character sheet` }),
    ).toBeVisible();
    await expect(
      recorded.getByText(`Recorded revision ${original.revision} (read-only)`),
    ).toBeVisible();
    const comparison = recorded.getByRole('region', { name: 'Compared with the active build' });
    await expect(comparison).toContainText('Wrecking Ball');
    await expect(comparison).toContainText('Danger Sense');
    // The recorded sheet has no table controls.
    await expect(recorded.getByRole('button', { name: 'Roll test', exact: true })).toHaveCount(0);
    expect((await query('characters:sheet', { characterId })).build.baseline.level.value).toBe(2);
    await player.screenshot({ path: `${directory}/history-preview.png`, fullPage: true });
    const restorePanel = recorded.getByRole('region', { name: 'Restore this build' });
    await expect(restorePanel).toContainText('submits it for Director review');
    await restorePanel.getByRole('button', { name: 'Restore this build', exact: true }).click();
    await expect
      .poll(async () => (await query('characters:get', { characterId })).review?.status)
      .toBe('pending');
    expect((await query('characters:sheet', { characterId })).live.stamina).toBe(39);
    // The old Progression address redirects to History; the Director inspects but cannot restore.
    await director.goto(`/characters/${characterId}/progression`);
    await expect(director).toHaveURL(new RegExp(`/characters/${characterId}/history$`));
    await director
      .getByRole('button', { name: new RegExp(`^Revision ${original.revision} · Level 1 · `) })
      .click();
    await expect(
      director.getByRole('article', { name: `${heroName} character sheet` }),
    ).toBeVisible();
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
