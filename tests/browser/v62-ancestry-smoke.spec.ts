// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { startCharacter } from './character-fixtures';
import { PASSWORD, register } from './v21-fixtures';
import fury from '../fixtures/v25-fury.json' with { type: 'json' };
import elementalist from '../fixtures/v25-bethell.json' with { type: 'json' };
import type { EvaluationResult, SelectionValue } from '../../shared/contracts/characterEvaluation';

// These two different class paths catch shipped wizard/corpus and persisted-value failures that
// pure evaluation cannot: Dwarf ancestry/kit health stacking and Human no-kit recovery capacity.
// Use the documented A witnesses; remaining option variations belong to focused/Forge checks.
for (const ancestry of ['Dwarf', 'Human'] as const) {
  test(`${ancestry} completes the actual wizard and preserves its sourced values after reload`, async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const dwarf = ancestry === 'Dwarf';
    const fixture: Record<string, SelectionValue> = dwarf
      ? fury.selections
      : elementalist.selections;
    const traits = dwarf ? ['Grounded', 'Spark Off Your Skin'] : ['Perseverance', 'Staying Power'];
    const stamp = crypto.randomUUID().slice(0, 8);
    const email = `v62-${ancestry.toLowerCase()}-${stamp}@example.test`;
    const name = `${ancestry} witness A ${stamp}`;
    await register(page, `${ancestry} ${stamp}`, email);
    await page.getByRole('link', { name: 'Characters', exact: true }).click();
    await startCharacter(page, name);
    const step = (number: number) =>
      page.getByRole('button', { name: new RegExp(`^${number}\\.`) }).click();
    const pick = (label: string, value: string) =>
      page.getByLabel(label, { exact: true }).selectOption(value);
    const check = (label: string) => page.getByLabel(label, { exact: true }).check();
    await step(2);
    await page.getByLabel(ancestry, { exact: true }).click();
    for (const trait of traits) await check(trait);
    await expect(page.getByText('3 of 3 points spent')).toBeVisible();
    await step(3);
    await page.getByLabel('Culture name', { exact: true }).fill(String(fixture['culture.name']));
    await pick('Additional language', String(fixture['culture.language']));
    await check(String(fixture['culture.environment']));
    await pick('Environment skill', String(fixture['culture.environment.skill']));
    await check(String(fixture['culture.organization']));
    await pick('Organization skill', String(fixture['culture.organization.skill']));
    await check(String(fixture['culture.upbringing']));
    await pick('Upbringing skill', String(fixture['culture.upbringing.skill']));
    await step(4);
    await page.getByLabel(String(fixture['career.choice']), { exact: true }).click();
    if (dwarf) {
      await pick('Exploration skill', 'Endurance');
      await pick('Intrigue skill', 'Alertness');
      await pick('Career languages 1', '__open__');
      await pick('Career languages 2', 'Vaslorian');
      await check('Teamwork');
      await check('Sole Survivor');
    } else {
      await pick('Career skills 1', 'Monsters');
      await pick('Career skills 2', 'Timescape');
      await pick('Career languages 1', 'The First Language');
      await check('Arcane Trick');
      await check('Forgotten Memories');
    }
    await step(5);
    await page.getByLabel(dwarf ? 'Fury' : 'Elementalist', { exact: true }).click();
    const classId = dwarf ? 'class.fury' : 'class.elementalist';
    await check(String(fixture[`${classId}.characteristic-array`]));
    const assignment = fixture[`${classId}.array-assignment`] as Record<string, number>;
    for (const [characteristic, value] of Object.entries(assignment))
      await pick(`Assign ${characteristic}`, String(value));
    for (const [index, skill] of (fixture[`${classId}.skills`] as string[]).entries()) {
      await pick(`Additional class skills ${index + 1}`, skill);
    }
    if (dwarf) {
      for (const option of ['Berserker', 'Brutal Slam', 'Out of the Way!', 'Thunder Roar'])
        await check(option);
      await step(6);
      await pick('Choose a kit', 'Mountain');
    } else {
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
    }
    await expect(
      page.getByLabel('Hero so far').getByText('complete', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByText(/^Draft saved \(revision \d+\)/)).toBeVisible();
    await page.reload();
    await step(2);
    for (const trait of traits) await expect(page.getByLabel(trait, { exact: true })).toBeChecked();
    await expect(
      page.getByLabel('Hero so far').getByText('complete', { exact: true }),
    ).toBeVisible();
    const characterId = new URL(page.url()).pathname.split('/').at(-2)!;
    const directory = `.playtest/v62/${ancestry.toLowerCase()}`;
    await mkdir(directory, { recursive: true });
    await page.screenshot({ path: `${directory}/reloaded-wizard.png`, fullPage: true });
    // Existing CLI consumes the target's VITE_CONVEX_URL / VITE_CONVEX_SITE_URL / VITE_SITE_URL.
    // Never let a runner's unrelated bearer token override this browser-created account.
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      SALIENT_EMAIL: email,
      SALIENT_PASSWORD: PASSWORD,
    };
    delete env.SALIENT_AUTH_TOKEN;
    const readback = await promisify(execFile)(
      'pnpm',
      ['app', 'query', 'characters:get', JSON.stringify({ characterId })],
      {
        env,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    const saved = JSON.parse(readback.stdout) as {
      evaluation: EvaluationResult;
      selections: { decisionId: string; value: SelectionValue }[];
    };
    await writeFile(`${directory}/readback.json`, JSON.stringify(saved, null, 2));
    expect(saved.evaluation.status).toBe('complete');
    const hero = saved.evaluation.baseline!;
    expect(hero.ancestry.value).toBe(ancestry);
    expect(hero.size.value).toBe('1M');
    expect(hero.speed.value).toBe(5);
    expect(hero.stability.value).toBe(dwarf ? 3 : 0);
    expect(hero.staminaMaximum.value).toBe(dwarf ? 36 : 18);
    expect(hero.recoveriesMaximum.value).toBe(10);
    expect(hero.recoveryValue.value).toBe(dwarf ? 12 : 6);
    expect(hero.windedValue.value).toBe(dwarf ? 18 : 9);
    const actualChoices = Object.fromEntries(
      saved.selections.map(selection => [selection.decisionId, selection.value]),
    );
    const expectedChoices: Record<string, SelectionValue> = {
      ...fixture,
      'ancestry.choice': ancestry,
      'details.name': name,
    };
    for (const id of Object.keys(expectedChoices))
      if (id.startsWith('ancestry.') && id !== 'ancestry.choice') delete expectedChoices[id];
    expectedChoices[`ancestry.${ancestry.toLowerCase()}.purchased-traits`] = traits;
    // Confirm the whole legal same-build witness, not just its ancestry radio button.
    expect(actualChoices).toMatchObject(expectedChoices);
    await page.getByRole('button', { name: 'Exit', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/characters/${characterId}$`));
    const cards = dwarf
      ? [
          ['Runic Carving', 'one rune active at a time'],
          ['Grounded', '+1 bonus to stability'],
          ['Spark Off Your Skin', '+6 bonus to Stamina'],
        ]
      : [
          ['Detect the Supernatural', 'within 5 squares'],
          ['Perseverance', 'reduced to 3 instead of 2'],
          ['Staying Power', 'Recoveries by 2'],
        ];
    for (const [trait, phrase] of cards) {
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
}
