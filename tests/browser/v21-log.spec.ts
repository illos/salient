// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 items 5, 6, 7 and 8: the game log as the mockups' feed (discs, dice chips, centred session
 * markers), the LOG / ROLLS tabs over the same subscription, the compact history toolbar, the
 * pinned command line, the segmented initiative bar over the existing group model, and the hero
 * ring row.
 *
 * Owning specifications: docs/table-spec.md#game-log-and-chat-scope,
 * #initiative-groups-confirmed-app-model, #taking-a-turn, #confirmed-combat-layout;
 * docs/build/V21-desktop-layout-fidelity.md.
 */
import { test, expect, type Page } from '@playwright/test';
import { THEMES, VIEWPORTS, createTable, shoot } from './v21-fixtures';

const feed = (page: Page) => page.locator('[data-log-feed]');
const tab = (page: Page, name: 'Log' | 'Rolls' | 'Rules') =>
  page.getByRole('tab', { name, exact: true });

async function run(page: Page, text: string) {
  await page.getByLabel('Slash command').fill(text);
  await page.getByLabel('Slash command').press('Enter');
}

test('log feed: dice chips, markers, ROLLS filter, history toolbar, command line', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const table = await createTable(browser);
  const { director, player, heroId, heroName } = table;
  try {
    // The session start is a centred marker pill, not a feed entry.
    await expect(feed(director).getByText(/^Session started · /)).toBeVisible();

    // A test roll through the pinned command line becomes an entry with dice chips.
    await run(director, `@{character:${heroId}} /test roll characteristic=M`);
    const roll = feed(director).locator('li[data-dice="true"]').last();
    await expect(roll).toBeVisible();
    await expect(roll).toContainText('2d10');
    await expect(roll).toContainText(heroName);
    // Both users see the same shared log.
    await expect(feed(player).locator('li[data-dice="true"]')).toHaveCount(1);

    // ROLLS filters the same subscription to entries with dice; LOG restores the feed.
    const all = await feed(director).locator('li[data-sequence]').count();
    expect(all).toBeGreaterThan(1);
    await tab(director, 'Rolls').click();
    await expect(feed(director)).toHaveAttribute('data-tab', 'rolls');
    await expect(feed(director).locator('li[data-sequence]')).toHaveCount(1);
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES) await shoot(director, 'log', 'rolls-tab', { theme, viewport });
    await tab(director, 'Log').click();
    await expect(feed(director).locator('li[data-sequence]')).toHaveCount(all);

    // The history toolbar keeps its operations: the Director's Rewind undoes the roll.
    const history = director.getByRole('toolbar', { name: 'History' });
    await expect(history).toBeVisible();
    await history.getByRole('button', { name: /^Rewind/ }).click();
    await expect(
      feed(director).locator('li[data-dice="true"][data-disposition="undone"]'),
    ).toHaveCount(1);
    await history.getByRole('button', { name: /^Redo/ }).click();
    await expect(
      feed(director).locator('li[data-dice="true"][data-disposition="undone"]'),
    ).toHaveCount(0);

    for (const viewport of VIEWPORTS)
      for (const theme of THEMES)
        await shoot(director, 'log', 'freeplay-director', { theme, viewport });
  } finally {
    await table.close();
  }
});

test('initiative bar: a segment per turn entry, the current one marked, Groups for the Director', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const table = await createTable(browser, { combat: true });
  const { director, player, heroName } = table;
  try {
    const bar = director.locator('[data-initiative-bar]');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('data-round', '1');
    // One segment per turn entry: one hero and two Goblin Warriors.
    const segments = bar.locator('li[data-entry-id]');
    await expect(segments).toHaveCount(3);
    // The fixture leaves the hero mid-turn: one segment is acting, none has finished yet.
    await expect(bar.locator('li[data-entry-id][data-actor-kind="character"]')).toHaveAttribute(
      'data-state',
      'acting',
    );
    await expect(bar.locator('li[data-entry-id][data-state="acted"]')).toHaveCount(0);
    // Ending that turn through the existing control marks the segment spent.
    await player.getByRole('button', { name: 'End turn', exact: true }).first().click();
    await expect(bar.locator('li[data-entry-id][data-state="acted"]')).toHaveCount(1);
    await expect(bar.locator('li[data-entry-id][data-state="acting"]')).toHaveCount(0);

    // The ring row stands above the heroes pane in combat.
    const rings = director.locator('[data-hero-ring-row]');
    await expect(rings).toBeVisible();
    await expect(rings.getByRole('button')).toHaveCount(1);

    // Groups is the Director's regroup view over the same list; the player has no such control.
    await expect(player.getByRole('button', { name: 'Groups', exact: true })).toHaveCount(0);
    await director.getByRole('button', { name: 'Groups', exact: true }).click();
    const groups = director.locator('[data-initiative-groups]');
    await expect(groups).toBeVisible();
    await expect(groups).toContainText(heroName);
    await expect(groups).toContainText('Goblin Warrior');
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES) await shoot(director, 'log', 'groups-open', { theme, viewport });
    await director.getByRole('button', { name: 'Groups', exact: true }).click();
    await expect(groups).toBeHidden();

    // Taking a foe's turn from its segment moves the bar: that entry starts acting.
    // The state attributes sit on the entry; the button inside it is the segment.
    await bar
      .locator('li[data-entry-id][data-actor-kind="foe"][data-state="unspent"] [data-segment]')
      .first()
      .click();
    await expect(bar.locator('li[data-entry-id][data-state="acted"]')).toHaveCount(1);
    await expect(bar.locator('li[data-entry-id][data-state="acting"]')).toHaveCount(1);
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES)
        await shoot(director, 'log', 'combat-director', { theme, viewport });
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES) await shoot(player, 'log', 'combat-player', { theme, viewport });
  } finally {
    await table.close();
  }
});
