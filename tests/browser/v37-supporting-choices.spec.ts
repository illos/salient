// SPDX-License-Identifier: GPL-3.0-only
/** V37: sourced supporting choices, owned targets and saved/reviewed build consequences. */
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { createTable } from './v21-fixtures';
import { seedLocalHero } from './local-fixtures';
import type { HeroSheet } from '../../shared/contracts/characterSheet';

test('supporting choices show complete sources, prune dependent targets and persist reviewed mechanics', async ({
  browser,
}) => {
  test.setTimeout(600_000);
  const fixture = await createTable(browser);
  const { player, director, heroId: characterId } = fixture;
  const credentials = fixture.credentials('player');
  const query = async (name: string): Promise<unknown> => {
    const result = await promisify(execFile)(
      'pnpm',
      ['app', 'query', name, JSON.stringify({ characterId })],
      {
        env: {
          ...process.env,
          SALIENT_EMAIL: credentials.email,
          SALIENT_PASSWORD: credentials.password,
        },
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    return JSON.parse(result.stdout);
  };
  const step = (name: string) =>
    player.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  const check = (name: string) => player.getByLabel(name, { exact: true }).check();
  const pick = (label: string, value: string) =>
    player.getByLabel(label, { exact: true }).selectOption(value);
  const directory = '.playtest/v37/supporting-choices';
  await mkdir(directory, { recursive: true });
  try {
    await player.goto(`/characters/${characterId}`);
    const before = (await query('characters:sheet')) as HeroSheet;
    await player.getByRole('link', { name: 'Edit', exact: true }).click();
    await step('4\\. Career');
    await check('Artisan');
    await expect(
      player.getByRole('region', { name: 'Artisan full text', exact: true }),
    ).toContainText('240');
    await pick('Artisan: choose 2 skills 1', 'Alchemy');
    await pick('Artisan: choose 2 skills 2', 'Tailoring');
    await pick('Artisan: 1 additional language 1', '__open__');
    await check('Area of Expertise');
    const targetLabel = 'Area of Expertise: choose an owned crafting skill';
    await pick(targetLabel, 'Alchemy');
    await expect(
      player
        .getByLabel(targetLabel, { exact: true })
        .getByRole('option', { name: 'Carpentry', exact: true }),
    ).toHaveCount(0);
    await expect(
      player.getByRole('region', { name: 'Area of Expertise full text', exact: true }),
    ).toContainText('learn of any flaws in its construction');
    await player
      .getByRole('region', { name: 'Area of Expertise full text', exact: true })
      .getByRole('link', { name: 'crafting skill group', exact: true })
      .click();
    await expect(player.getByRole('dialog')).toBeVisible();
    await player.keyboard.press('Escape');
    await expect(player.getByLabel(targetLabel, { exact: true })).toHaveValue('Alchemy');
    await check('Continue the Work');
    await expect(
      player.getByRole('region', { name: 'Continue the Work full text', exact: true }),
    ).toContainText("finishing your friend's work");
    await player.getByText('Or write your own incident', { exact: true }).click();
    await player
      .getByLabel('Custom artisan: inciting incident', { exact: true })
      .fill('I left my workshop to recover a stolen family design.');
    await expect(player.getByLabel('Continue the Work', { exact: true })).not.toBeChecked();
    await check('Continue the Work');
    // A modifier target is a dependent selection, not another skill entitlement.
    await check('Handy');
    await expect(player.getByLabel(targetLabel, { exact: true })).toHaveCount(0);
    await check('Area of Expertise');
    await expect(player.getByLabel(targetLabel, { exact: true })).toHaveValue('');
    await pick(targetLabel, 'Alchemy');
    await player.screenshot({ path: `${directory}/career.png`, fullPage: true });
    await step('6\\. Kit');
    await pick('Choose a kit', 'Arcane Archer');
    await expect(
      player.getByRole('region', { name: 'Arcane Archer full text', exact: true }),
    ).toContainText('Signature');
    await step('8\\. Complication');
    await pick('Complication', 'Rival');
    await expect(
      player.getByText(
        'This choice records a skill for this feature; it does not grant another skill.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(player.getByText(/^Choose a skill you already know\./)).toHaveCount(1);
    await pick('Complication', 'Elemental Inside');
    const complication = player.getByRole('region', {
      name: 'Elemental Inside full text',
      exact: true,
    });
    await expect(complication).toContainText('Benefit:');
    await expect(complication).toContainText('Drawback:');
    await expect(complication).toContainText(
      'the Director can take temporary control of your hero',
    );
    await pick('Complication', '');
    await expect(complication).toHaveCount(0);
    await pick('Complication', 'Elemental Inside');
    await player.screenshot({ path: `${directory}/complication.png`, fullPage: true });
    await player.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(player.getByText(/^Draft saved \(revision \d+\)/)).toBeVisible();
    const saved = await query('characters:get');
    await player.reload();
    await step('4\\. Career');
    await expect(player.getByLabel('Artisan', { exact: true })).toBeChecked();
    await expect(player.getByLabel(targetLabel, { exact: true })).toHaveValue('Alchemy');
    await expect(player.getByLabel('Continue the Work', { exact: true })).toBeChecked();
    await step('8\\. Complication');
    await expect(player.getByLabel('Complication', { exact: true })).toHaveValue(
      'Elemental Inside',
    );
    await expect(
      player.getByLabel('Hero so far').getByText('complete', { exact: true }),
    ).toBeVisible();
    await player.getByRole('button', { name: 'Exit', exact: true }).click();
    expect(((await query('characters:sheet')) as HeroSheet).build!.baseline).toEqual(
      before.build!.baseline,
    );
    await player.getByRole('button', { name: 'Submit edit for review', exact: true }).click();
    await director.goto(fixture.campaignUrl);
    await director.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect
      .poll(
        async () => ((await query('characters:sheet')) as HeroSheet).build?.baseline?.career.value,
      )
      .toBe('Artisan');
    const after = (await query('characters:sheet')) as HeroSheet;
    expect(after.build!.baseline!.staminaMaximum.value).toBe(24);
    expect(after.live!.stamina).toBe(Math.min(before.live!.stamina, 24));
    expect(after.build!.baseline!.kit?.name.value).toBe('Arcane Archer');
    expect(after.build!.baseline!.skills.filter(skill => skill.name === 'Alchemy')).toHaveLength(1);
    await player.screenshot({ path: `${directory}/reviewed-sheet.png`, fullPage: true });
    await writeFile(
      `${directory}/readback.json`,
      JSON.stringify({ before, saved, after }, null, 2),
    );
  } finally {
    await fixture.close();
  }
});

test('Strange Inheritance lets the Director save a private sourced item without exposing it to the owner', async ({
  browser,
}) => {
  test.setTimeout(600_000);
  const fixture = await createTable(browser);
  const { player, director, heroId: characterId } = fixture;
  const directory = '.playtest/v37/private-inheritance';
  await mkdir(directory, { recursive: true });
  try {
    await player.goto(`/characters/${characterId}`);
    await player.getByRole('link', { name: 'Edit', exact: true }).click();
    await player.getByRole('button', { name: /^8\. Complication/ }).click();
    await player.getByLabel('Complication', { exact: true }).selectOption('Strange Inheritance');
    await expect(
      player.getByText('The Director privately chooses your inherited trinket.', { exact: false }),
    ).toBeVisible();
    await expect(player.getByLabel('Private inherited trinket', { exact: true })).toHaveCount(0);
    await player.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(player.getByText(/^Draft saved \(revision \d+\)/)).toBeVisible();
    await player.getByRole('button', { name: 'Exit', exact: true }).click();
    await player.getByRole('button', { name: 'Submit edit for review', exact: true }).click();
    await director.goto(fixture.campaignUrl);
    await director.getByRole('button', { name: 'View proposed sheet', exact: true }).click();
    const picker = director.getByLabel('Private inherited trinket', { exact: true });
    await expect(picker.getByRole('option')).toHaveCount(9); // Eight source items and the empty prompt.
    await picker.selectOption('Bastion Belt');
    await expect(
      director.getByRole('region', { name: 'Bastion Belt full text', exact: true }),
    ).toContainText('Bastion Belt');
    await director.getByRole('button', { name: 'Save private inheritance', exact: true }).click();
    await expect(director.getByText('Private inheritance saved.', { exact: true })).toBeVisible();
    await director.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(director.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
    await director.goto(`/characters/${characterId}`);
    await expect(director.getByLabel('Private inherited trinket', { exact: true })).toHaveValue(
      'Bastion Belt',
    );
    await director.screenshot({ path: `${directory}/director.png`, fullPage: true });
    await player.reload();
    await expect(player.getByLabel('Private inherited trinket', { exact: true })).toHaveCount(0);
    await expect(player.getByText('Bastion Belt', { exact: false })).toHaveCount(0);
    await expect(
      player.getByText('The Director records this item privately.', { exact: false }),
    ).toBeVisible();
    await player.screenshot({ path: `${directory}/owner.png`, fullPage: true });

    // An owning Director performs the same private setup before immediate logged activation.
    const ownId = await seedLocalHero(
      fixture.campaignId,
      `Director heir ${fixture.stamp}`,
      fixture.credentials('director'),
      fixture.credentials('director'),
    );
    await director.goto(`/characters/${ownId}`);
    await director.getByRole('link', { name: 'Edit', exact: true }).click();
    await director.getByRole('button', { name: /^8\. Complication/ }).click();
    await director.getByLabel('Complication', { exact: true }).selectOption('Strange Inheritance');
    await director.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(director.getByText(/^Draft saved \(revision \d+\)/)).toBeVisible();
    await director.getByRole('button', { name: 'Exit', exact: true }).click();
    const submitOwn = director.getByRole('button', { name: 'Submit edit for review', exact: true });
    await expect(submitOwn).toBeDisabled();
    await expect(director.getByText(/Editing the draft build, revision \d+\./)).toBeVisible();
    await director
      .getByLabel('Private inherited trinket', { exact: true })
      .selectOption('Evilest Eye');
    await director.getByRole('button', { name: 'Save private inheritance', exact: true }).click();
    await expect(director.getByText('Private inheritance saved.', { exact: true })).toBeVisible();
    await expect(submitOwn).toBeEnabled();
    await submitOwn.click();
    await expect(submitOwn).toBeDisabled();
    await expect(director.getByText(/Editing the effective build, revision \d+\./)).toBeVisible();
    await expect(director.getByLabel('Private inherited trinket', { exact: true })).toHaveValue(
      'Evilest Eye',
    );
    await director.screenshot({ path: `${directory}/owning-director.png`, fullPage: true });
  } finally {
    await fixture.close();
  }
});
