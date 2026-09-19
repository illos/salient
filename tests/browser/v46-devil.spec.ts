// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import { register, PASSWORD } from './v21-fixtures';
import { startCharacter } from './character-fixtures';
import fixture from '../fixtures/v46-devil/templates.json' with { type: 'json' };
import type { HeroSheet } from '../../shared/contracts/characterSheet';

const TRAITS = Object.keys(fixture.traitCosts);

test('V46 Devil level one: every trait and skill offered, flight build saved and read back', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    const stamp = crypto.randomUUID().slice(0, 8);
    const email = `v46-${stamp}@example.test`;
    const name = `Wingrug ${stamp}`;
    await register(page, `Player ${stamp}`, email);
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
      page.getByRole('button', { name: new RegExp(`^${label.replace('.', '\\.')}`) }).click();
    const pick = (label: string, value: string) =>
      page.getByLabel(label, { exact: true }).selectOption(value);
    const soFar = page.getByLabel('Hero so far');
    await mkdir('.playtest/v46', { recursive: true });

    await page.getByRole('link', { name: 'Characters', exact: true }).click();
    await startCharacter(page, name);

    // 2. Ancestry: every purchased trait is now offered, not muted and disabled.
    await step('2. Ancestry');
    await page.getByLabel('Devil', { exact: true }).click();
    for (const trait of TRAITS) await expect(page.getByLabel(trait, { exact: true })).toBeEnabled();
    // The complete interpersonal group is selectable, and nothing outside it is.
    const skillSelect = page.getByLabel('Silver Tongue skill', { exact: true });
    for (const skill of fixture.interpersonalSkills)
      await expect(skillSelect.locator(`option[value="${skill}"]`)).toHaveCount(1);
    await expect(skillSelect.locator('option[value="Blacksmithing"]')).toHaveCount(0);
    await pick('Silver Tongue skill', 'Flirt');

    // The sourced four-point exclusion is refused at the budget the source states.
    await page.getByLabel('Impressive Horns', { exact: true }).check();
    await page.getByLabel('Wings', { exact: true }).check();
    await expect(page.getByText(/4 of 3 points spent|exceeds/)).toBeVisible();
    await page.screenshot({ path: '.playtest/v46/over-budget.png', fullPage: true });
    await page.getByLabel('Impressive Horns', { exact: true }).uncheck();
    await page.getByLabel('Glowing Eyes', { exact: true }).check();
    await expect(page.getByText('3 of 3 points spent')).toBeVisible();
    // Every Devil trait is offered now, so the "offered set" caveat has nothing left to say.
    await expect(page.getByText(/offered set:/)).toHaveCount(0);
    // The control: an ancestry that still holds options back keeps showing them unsupported,
    // so the caveat's absence is about Devil, not about the wizard losing the distinction.
    await page.getByRole('button', { name: 'Edit ancestry', exact: true }).click();
    await page.getByLabel('Polder', { exact: true }).click();
    await expect(page.getByLabel('Corruption Immunity', { exact: true })).toBeEnabled();
    await expect(page.getByLabel('Nimblestep', { exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Edit ancestry', exact: true }).click();
    await page.getByLabel('Devil', { exact: true }).click();
    await pick('Silver Tongue skill', 'Flirt');
    await page.getByLabel('Glowing Eyes', { exact: true }).check();
    await page.getByLabel('Wings', { exact: true }).check();
    await expect(page.getByText('3 of 3 points spent')).toBeVisible();

    // 3. Culture, 4. Career, 5. Class, 6. Kit: the audited Grug baseline, unchanged.
    await step('3. Culture');
    await page.getByLabel('Culture name', { exact: true }).fill('wilderness mercenary commune');
    await pick('Additional language', 'Anjali');
    await page.getByLabel('Wilderness', { exact: true }).check();
    await pick('Environment skill', 'Swim');
    await page.getByLabel('Communal', { exact: true }).check();
    await pick('Organization skill', 'Blacksmithing');
    await page.getByLabel('Martial', { exact: true }).check();
    await pick('Upbringing skill', 'Intimidate');
    await step('4. Career');
    await page.getByLabel('Soldier', { exact: true }).click();
    await pick('Exploration skill', 'Endurance');
    await pick('Intrigue skill', 'Alertness');
    await pick('Career languages 1', 'Khelt');
    await pick('Career languages 2', 'Vaslorian');
    await page.getByLabel('Teamwork', { exact: true }).check();
    await page.getByLabel('Sole Survivor', { exact: true }).check();
    await step('5. Class');
    await page.getByLabel('Fury', { exact: true }).click();
    await page.getByLabel('1, 0, 0', { exact: true }).check();
    await pick('Assign Reason', '0');
    await pick('Assign Intuition', '1');
    await pick('Assign Presence', '0');
    await pick('Additional class skills 1', 'Jump');
    await pick('Additional class skills 2', 'Climb');
    await page.getByLabel('Berserker', { exact: true }).check();
    await page.getByLabel('Brutal Slam', { exact: true }).check();
    await page.getByLabel('Out of the Way!', { exact: true }).check();
    await page.getByLabel('Thunder Roar', { exact: true }).check();
    await step('6. Kit');
    await pick('Choose a kit', 'Mountain');
    await expect(soFar.getByText('complete', { exact: true })).toBeVisible();

    // Wings' movement and conditional amounts are shown with their source condition, and the
    // ancestry keeps its ordinary speed because Beast Legs is not selected.
    await expect(soFar.getByText('Speed', { exact: true }).locator('..')).toContainText('5');
    const conditional = page.getByRole('region', { name: 'Conditional grants' });
    await expect(conditional).toContainText('Fly');
    await expect(conditional).toContainText('Wings: maximum rounds aloft');
    await expect(conditional).toContainText('Wings: damage weakness');
    await expect(conditional).toContainText('at 3rd level or lower');
    await page.screenshot({ path: '.playtest/v46/wizard-conditional.png', fullPage: true });

    await page.getByRole('button', { name: 'Exit', exact: true }).click();
    await expect(page.getByRole('heading', { name })).toBeVisible();

    // Persisted readback through the application, not the mutation response.
    const characters = await query('characters:listMine');
    const record = characters.find((entry: { name: string }) => entry.name === name);
    expect(record, 'the saved character is listed').toBeTruthy();
    const sheet: HeroSheet = await query('characters:sheet', {
      characterId: record.id,
      view: 'draft',
    });
    const build = sheet.build;
    expect(build, 'the saved draft has an evaluated build').toBeTruthy();
    const baseline = build!.baseline ?? build!.partial!;
    const expected = fixture.templates.C.expected;
    expect((baseline.movementModes ?? []).map(mode => mode.mode)).toEqual(['Fly']);
    expect(
      (baseline.conditionalEffects ?? []).map(effect => [effect.effect, effect.amount.value]),
    ).toEqual(expected.conditionalEffects.map(entry => [entry.effect, entry.amount]));
    expect(baseline.damageWeaknesses ?? []).toEqual([]);
    expect(baseline.speed?.value).toBe(expected.speed);
    expect(baseline.savingThrowThreshold?.value).toBe(expected.savingThrowThreshold);
    const ancestryAbilities = sheet.abilities.filter(ability => ability.kind === 'ancestry');
    expect(ancestryAbilities.map(ability => ability.name)).toEqual(['Glowing Eyes']);
    expect(ancestryAbilities[0]!.content?.text).toContain('1d10 + your level');
    // The grant records that the trigger, roll and damage are the table's, and the sheet keeps it.
    expect(ancestryAbilities[0]!.grantedBy.note).toContain('resolved manually');

    // The sheet shows the granted ability and both trait source texts to the owner.
    await page.reload();
    // The manual boundary is visible on the sheet, not only in the persisted record.
    await expect(page.getByText(/resolved manually/).first()).toBeVisible();
    for (const trait of ['Silver Tongue', 'Glowing Eyes', 'Wings']) {
      await page
        .getByRole('button', { name: `Read ${trait} in the rules`, exact: true })
        .first()
        .click();
      await expect(page.getByRole('dialog')).toContainText(trait);
      await expect(page.getByRole('dialog')).not.toContainText('scc.v1:');
      await page.keyboard.press('Escape');
    }
    // The stats section and its list share the label; the row lives in the list.
    const stats = page.getByRole('list', { name: 'Stats' }).first();
    await expect(stats).toContainText('Fly');
    // The stat row must not read as unconditional flight: it is marked, and carries the condition.
    await expect(stats).toContainText('conditional');
    await expect(stats.getByTitle(/While using your wings to fly/)).toBeVisible();
    await page.screenshot({ path: '.playtest/v46/sheet-flight.png', fullPage: true });
  } finally {
    await context.close();
  }
});
