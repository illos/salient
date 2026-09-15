// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 item 2, 3, 4 and 12: the Director's identical compact cards for foes and heroes, the
 * drill-in that replaces the roster section with a sheet or stat block, the settings pop-up that
 * took the presentation settings out of the pane body, and the audience boundary the cards keep
 * (a peer's Heroic Resource is never projected to a player).
 *
 * Owning specifications: docs/table-spec.md#confirmed-combat-layout (2026-09-15 user decisions),
 * #roster-targeting-controls, #monster-visibility-and-health-display, #malice-visibility;
 * docs/build/V21-desktop-layout-fidelity.md.
 */
import { test, expect, type Page } from '@playwright/test';
import { THEMES, VIEWPORTS, createTable, shoot } from './v21-fixtures';

const directorPane = (page: Page) => page.locator('[data-pane="director"]');
const heroesPane = (page: Page) => page.locator('[data-pane="heroes"]');

test('director rosters: compact cards, drill-in, settings pop-up, audience boundary', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const table = await createTable(browser, { combat: true });
  const { director, player, heroName, stamp } = table;
  try {
    // Both panes show the same compact card: name, a Stamina bar and its numbers.
    const foeCard = directorPane(director).locator('li[data-roster-card]').first();
    await expect(foeCard).toContainText('Goblin Warrior');
    await expect(foeCard.getByRole('progressbar', { name: 'Goblin Warrior health' })).toBeVisible();
    await expect(foeCard).toContainText('15 / 15');
    const heroCard = heroesPane(director).locator('li[data-roster-card]').first();
    await expect(heroCard).toContainText(heroName);
    await expect(heroCard.getByRole('progressbar', { name: `${heroName} Stamina` })).toBeVisible();
    await expect(heroCard).toContainText('30 / 30');
    await expect(heroCard).toContainText('10 / 10'); // Recoveries
    await expect(heroCard).toContainText(/Ferocity/i); // the class resource by its real name

    // Every participant carries its own reticle (docs/table-spec.md#roster-targeting-controls).
    await expect(foeCard.getByRole('button', { name: 'Target Goblin Warrior' })).toBeVisible();
    await expect(heroCard.getByRole('button', { name: `Target ${heroName}` })).toBeVisible();

    // Drill-in: the foe card replaces the roster section with the stat block; Back restores it.
    await director.getByRole('button', { name: 'Open Goblin Warrior' }).first().click();
    await expect(
      directorPane(director).getByRole('article', { name: 'Goblin Warrior stat block' }),
    ).toBeVisible();
    await expect(directorPane(director).locator('li[data-roster-card]')).toHaveCount(0);
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES)
        await shoot(director, 'rosters', 'director-foe-detail', { theme, viewport });
    await director.getByRole('button', { name: 'Foes', exact: true }).click();
    await expect(directorPane(director).locator('li[data-roster-card]')).toHaveCount(2);

    // The same drill-in on the heroes side opens the character sheet, and Escape goes back.
    await director
      .getByRole('button', { name: `Open ${heroName}` })
      .first()
      .click();
    await expect(
      heroesPane(director).getByRole('article', { name: `${heroName} character sheet` }),
    ).toBeVisible();
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES)
        await shoot(director, 'rosters', 'director-hero-detail', { theme, viewport });
    await director.keyboard.press('Escape');
    await expect(heroesPane(director).locator('li[data-roster-card]')).toHaveCount(1);

    // Settings pop-up: the presentation settings left the pane body for the shared card.
    await expect(
      directorPane(director).getByRole('group', { name: 'Monster health display' }),
    ).toHaveCount(0);
    await director.getByRole('button', { name: 'Table settings' }).click();
    const settings = director.getByRole('dialog');
    await expect(settings).toBeVisible();
    await expect(settings.getByRole('group', { name: 'Monster health display' })).toBeVisible();
    await expect(settings.getByRole('switch', { name: 'Show Malice' })).toBeVisible();
    await expect(settings.getByRole('switch', { name: 'Show test difficulty' })).toBeVisible();
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES) await shoot(director, 'rosters', 'settings', { theme, viewport });

    // Changing the mode moves the player's presentation; the setting is read back from the app.
    await expect(
      player.getByRole('progressbar', { name: /Goblin Warrior health/ }).first(),
    ).toBeVisible();
    await settings.getByRole('button', { name: 'Winded', exact: true }).click();
    await expect(settings.getByRole('button', { name: 'Winded', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(player.getByText('Not winded').first()).toBeVisible();
    await expect(player.getByRole('progressbar', { name: /Goblin Warrior health/ })).toHaveCount(0);
    await director.keyboard.press('Escape');
    await expect(settings).toBeHidden();

    // The player keeps the audience boundary: their own resource, never a peer's.
    await expect(player.getByText(`${heroName}`).first()).toBeVisible();
    const peers = heroesPane(player).locator('li[data-roster-card][data-own="false"]');
    for (const peer of await peers.all()) await expect(peer).not.toContainText(/Ferocity/i);
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES)
        await shoot(player, 'rosters', 'player-combat', { theme, viewport });
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES)
        await shoot(director, 'rosters', 'director-combat', { theme, viewport });

    // The operations behind the cards are unchanged: a Stamina edit persists and shows up here.
    await director.getByRole('button', { name: 'Open Goblin Warrior' }).first().click();
    director.once('dialog', dialog => void dialog.accept('9'));
    await director
      .getByRole('article', { name: 'Goblin Warrior stat block' })
      .getByRole('button', { name: 'Edit', exact: true })
      .first()
      .click();
    await expect(
      directorPane(director).getByRole('article', { name: 'Goblin Warrior stat block' }),
    ).toContainText('9 / 15');
    await director.getByRole('button', { name: 'Foes', exact: true }).click();
    await expect(directorPane(director).locator('li[data-roster-card]').first()).toContainText(
      '9 / 15',
    );
  } finally {
    await table.close();
  }
  expect(stamp).toBeTruthy();
});
