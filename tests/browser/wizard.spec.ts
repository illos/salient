// SPDX-License-Identifier: GPL-3.0-only
// A02 browser walkthrough: a player builds the hero-fixture devil Fury through every presented
// wizard step, submits it, the Director approves it from the campaign page, and the sheet reads as
// owner (Stamina 30 / 30, private notes), as the Director (no notes) and as a peer (Stamina and
// Recoveries only). Expected numbers are the R02/R03 fixture values from the documents.
import { expect, test, type Page } from '@playwright/test';

const password = 'Test-only-salient-password-42';

async function register(page: Page, name: string, email: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
}

test('wizard, admission review and the three sheet audiences', async ({ browser }) => {
  test.setTimeout(300_000);
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
  ]);
  try {
    const [director, player, observer] = await Promise.all(contexts.map(c => c.newPage()));
    const stamp = crypto.randomUUID().slice(0, 8);
    await register(director!, `Director ${stamp}`, `wizard-director-${stamp}@example.test`);
    await director!.getByLabel('Campaign name').fill(`Wizard ${stamp}`);
    await director!.getByRole('button', { name: 'Create campaign', exact: true }).click();
    await expect(director!.getByRole('heading', { name: `Wizard ${stamp}` })).toBeVisible();
    const campaignUrl = director!.url();
    const invite = await director!.getByLabel('Invitation link').inputValue();
    for (const [page, role] of [
      [player!, 'Player'],
      [observer!, 'Observer'],
    ] as const) {
      await register(
        page,
        `${role} ${stamp}`,
        `wizard-${role.toLowerCase()}-${stamp}@example.test`,
      );
      await page.goto(invite);
      await page.getByRole('button', { name: 'Request to join' }).click();
      await director!.getByRole('button', { name: 'Approve', exact: true }).click();
    }
    // Create the hero: the wizard opens on step 1 with the "hero so far" evaluating live.
    await player!.getByRole('link', { name: 'Characters', exact: true }).click();
    await player!.getByLabel('Name', { exact: true }).fill(`Grug ${stamp}`);
    await player!.getByRole('button', { name: 'Create and open the wizard' }).click();
    await expect(player!.getByRole('heading', { name: `Grug ${stamp}` })).toBeVisible();
    const soFar = player!.getByLabel('Hero so far');
    await expect(soFar).toContainText('incomplete');
    // The step buttons carry a diagnostic-count badge, so the name is matched as a prefix.
    const step = (name: string) =>
      player!.getByRole('button', { name: new RegExp(`^${name.replace('.', '\\.')}`) }).click();
    const pick = async (label: string, value: string) =>
      player!.getByLabel(label, { exact: true }).selectOption(value);
    // 2. Ancestry: the full pool is visible, unsupported ancestries are labeled and disabled.
    await step('2. Ancestry');
    await expect(player!.getByLabel('Dwarf', { exact: true })).toBeDisabled();
    await expect(player!.getByText('not offered in v0.01').first()).toBeVisible();
    await player!.getByLabel('Devil', { exact: true }).check();
    await pick('ancestry.devil.silver-tongue-skill', 'Persuade');
    await player!.getByLabel('Beast Legs', { exact: true }).check();
    await player!.getByLabel('Impressive Horns', { exact: true }).check();
    await expect(player!.getByText('3 of 3 points spent')).toBeVisible();
    // 3. Culture.
    await step('3. Culture');
    await pick('culture.language', 'Anjali');
    await player!.getByLabel('Wilderness', { exact: true }).check();
    await pick('culture.environment.skill', 'Swim');
    await player!.getByLabel('Communal', { exact: true }).check();
    await pick('culture.organization.skill', 'Blacksmithing');
    await player!.getByLabel('Martial', { exact: true }).check();
    await pick('culture.upbringing.skill', 'Intimidate');
    // 4. Career.
    await step('4. Career');
    await player!.getByLabel('Soldier', { exact: true }).check();
    await pick('career.soldier.skill.exploration', 'Endurance');
    await pick('career.soldier.skill.intrigue', 'Alertness');
    await pick('career.soldier.languages slot 1', 'Caelian');
    await pick('career.soldier.languages slot 2', 'Vaslorian');
    await pick('career.soldier.perk', 'Teamwork');
    await player!.getByLabel('Sole Survivor', { exact: true }).check();
    // 5. Class.
    await step('5. Class');
    await player!.getByLabel('Fury', { exact: true }).check();
    await player!.getByLabel('1, 0, 0', { exact: true }).check();
    await pick('class.fury.array-assignment Reason', '0');
    await pick('class.fury.array-assignment Intuition', '1');
    await pick('class.fury.array-assignment Presence', '0');
    await pick('class.fury.skills slot 1', 'Jump');
    await pick('class.fury.skills slot 2', 'Climb');
    await player!.getByLabel('Berserker', { exact: true }).check();
    await player!.getByLabel('Brutal Slam', { exact: true }).check();
    await player!.getByLabel('Out of the Way!', { exact: true }).check();
    await player!.getByLabel('Thunder Roar', { exact: true }).check();
    // Before the kit: Stamina maximum is pending, never a number (R02 4.2).
    await expect(soFar).toContainText('incomplete');
    await expect(soFar.getByText('Stamina max').locator('..')).toContainText('pending');
    // 6. Kit: the source text of an option is readable before choosing it.
    await step('6. Kit');
    await pick('kit.choice', 'Mountain');
    await player!.getByRole('button', { name: 'Source text', exact: true }).first().click();
    await expect(player!.getByLabel('Source text: Mountain')).toContainText('Stamina');
    await expect(soFar).toContainText('complete');
    await expect(soFar.getByText('Stamina max').locator('..')).toContainText('30');
    // 7. Free strikes (display only), 9. Details, 10. Connections.
    await step('7. Add Free Strikes');
    await expect(player!.getByText('Melee Weapon Free Strike').first()).toBeVisible();
    await expect(player!.getByRole('button', { name: /^8\. Complication/ })).toHaveCount(0);
    await step('9. Determine Details');
    await player!.getByLabel('Private notes', { exact: false }).fill('Grug fears the sea.');
    await player!.getByRole('button', { name: 'Save and close', exact: true }).click();
    // Submit for admission from the character page; the Director approves from the campaign page.
    await expect(player!.getByRole('heading', { name: `Grug ${stamp}` })).toBeVisible();
    await expect(player!.getByText('No live values', { exact: false })).toBeVisible();
    await player!.getByRole('button', { name: 'Submit for admission', exact: true }).click();
    await expect(player!.getByText(/admission awaiting review/)).toBeVisible();
    const characterUrl = player!.url();
    await director!.goto(campaignUrl);
    await director!.getByRole('button', { name: 'View proposed sheet', exact: true }).click();
    await expect(director!.getByText('Proposed build (awaiting review)').first()).toBeVisible();
    await expect(director!.getByText('Grug fears the sea.')).toHaveCount(0);
    await director!.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(director!.getByRole('link', { name: `Grug ${stamp}` })).toBeVisible();
    // Owner: effective build, R03 live values, private notes.
    await expect(player!.locator('span', { hasText: 'Effective build' }).first()).toBeVisible();
    await expect(player!.getByText('30 / 30').first()).toBeVisible();
    await expect(player!.getByText('10 / 10').first()).toBeVisible();
    // Private notes sit in the collapsed Character details section: present for the owner only.
    await expect(player!.getByText('Grug fears the sea.').first()).toBeAttached();
    await expect(player!.getByText('Brutal Slam').first()).toBeVisible();
    await expect(
      player!.getByRole('button', { name: 'Catch Breath (pending A05)' }),
    ).toBeDisabled();
    // Director: the full sheet without notes; a peer: Stamina and Recoveries only.
    await director!.goto(characterUrl);
    await expect(director!.getByText('Brutal Slam').first()).toBeVisible();
    await expect(director!.getByText('Grug fears the sea.')).toHaveCount(0);
    await observer!.goto(characterUrl);
    await expect(observer!.getByText('30 / 30').first()).toBeVisible();
    await expect(observer!.getByText('Brutal Slam')).toHaveCount(0);
    await expect(observer!.getByText('Grug fears the sea.')).toHaveCount(0);
    await expect(observer!.getByText('ferocity')).toHaveCount(0);
  } finally {
    await Promise.all(contexts.map(c => c.close()));
  }
});
