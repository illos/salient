// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 items 5, 6, 7 and 8: the game log as the mockups' feed (discs, dice chips, centred session
 * markers), the LOG / ROLLS tabs over the same subscription, the history controls in their V29
 * placement (the table settings pop-up, docs/build/V29-desktop-feedback.md item 1), the
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

test('log feed: dice chips, markers, ROLLS filter, history in settings, command line', async ({
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

    // V29 item 2: a rejected command raises one dismissible toast carrying the operation's own
    // message, with no Convex envelope and no error block anywhere else on the page.
    await run(director, '/test roll characteristic=M');
    const toast = director.locator('[data-toast-viewport] li');
    await expect(toast).toHaveCount(1);
    await expect(toast).toHaveAttribute('role', 'alert');
    await expect(toast).toHaveText(/\/test roll needs an @actor\./);
    await expect(toast).not.toContainText('Server Error');
    await expect(toast).not.toContainText('ConvexError');
    // The toast is the page's only alert: no error block survives beside the control that
    // submitted the failure, which sits outside the log pane in the shell's footer.
    await expect(director.getByRole('alert')).toHaveCount(1);
    await expect(director.locator('[data-toast-viewport] [role="alert"]')).toHaveCount(1);
    // The region is a pre-mounted live region, which is what keeps it announced from inside a
    // modal pop-up (Base UI aria-hides everything outside one that lacks [aria-live]).
    await expect(director.locator('[data-toast-viewport]')).toHaveAttribute(
      'aria-live',
      'assertive',
    );
    // It clears the pinned command line rather than covering it.
    const toastBox = await toast.boundingBox();
    const commandBox = await director.getByLabel('Slash command').boundingBox();
    expect(toastBox && commandBox && toastBox.y + toastBox.height).toBeLessThanOrEqual(
      commandBox!.y,
    );
    await shoot(director, 'log', 'error-toast', { theme: 'dark', viewport: VIEWPORTS[0] });
    await toast.getByRole('button', { name: 'Dismiss' }).click();
    await expect(toast).toHaveCount(0);
    await expect(director.locator('[data-toast-viewport]')).toBeHidden();
    await director.getByLabel('Slash command').fill('');

    // V29 item 1: the toolbar left the log pane for the table settings pop-up, and keeps its
    // operations there — the Director's Rewind undoes the roll and Redo restores it.
    await expect(director.getByRole('toolbar', { name: 'History' })).toHaveCount(0);
    // Raise a toast again and leave it up, so the pop-up opens over a live one.
    await run(director, '/test roll characteristic=M');
    await expect(toast).toHaveCount(1);
    await director.getByLabel('Slash command').fill('');
    await director.getByRole('button', { name: 'Table settings', exact: true }).click();
    const settings = director.getByRole('dialog');
    // The blocking finding of the V29 review: Base UI aria-hides everything outside an open modal,
    // so a toast raised while this pop-up is open must still reach the accessibility tree. The
    // region is pre-mounted with `aria-live`, which is what earns it the `markOthers` exemption.
    // `getByRole` resolves nothing inside an `aria-hidden` subtree, so this fails without it.
    await expect(settings).toBeVisible();
    await expect(director.locator('#root')).not.toHaveAttribute('aria-hidden', 'true');
    await expect(director.getByRole('alert')).toHaveCount(1);
    await expect(settings.getByRole('switch', { name: 'Enable user undo' })).toBeVisible();
    await settings.getByRole('button', { name: /^Rewind/ }).click();
    await expect(
      feed(director).locator('li[data-dice="true"][data-disposition="undone"]'),
    ).toHaveCount(1);
    await settings.getByRole('button', { name: /^Redo/ }).click();
    await expect(
      feed(director).locator('li[data-dice="true"][data-disposition="undone"]'),
    ).toHaveCount(0);
    await settings.getByRole('button', { name: 'Close settings' }).click();
    await expect(settings).toBeHidden();
    // That second toast is left to its own lifetime, which is the other half of the contract:
    // a toast nobody touches expires. Manual dismissal is asserted above.
    await expect(toast).toHaveCount(0, { timeout: 20_000 });

    // V29 item 1: a player's undo and redo keep the inline placement, on the entry each would act
    // on. The player's own roll is the head of their window; Enable user undo is on by default.
    await run(player, `@{character:${heroId}} /test roll characteristic=A`);
    // Wait for the player's own roll to land before reading it; the Director's roll is the other
    // entry with dice, and `.last()` would still resolve to it while the write is in flight.
    await expect(feed(player).locator('li[data-dice="true"]')).toHaveCount(2);
    const playerRoll = feed(player).locator('li[data-dice="true"]').last();
    await expect(playerRoll).toContainText('Test · Agility');
    const rollSequence = await playerRoll.getAttribute('data-sequence');
    await expect(playerRoll.getByRole('button', { name: 'Undo', exact: true })).toBeVisible();
    // The button sits on that entry and nowhere else in the feed.
    await expect(feed(player).getByRole('button', { name: 'Undo', exact: true })).toHaveCount(1);
    await playerRoll.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(
      feed(player).locator(`li[data-sequence="${rollSequence}"][data-disposition="undone"]`),
    ).toHaveCount(1);
    await expect(feed(player).getByRole('button', { name: 'Redo', exact: true })).toHaveCount(1);
    await playerRoll.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(
      feed(player).locator(`li[data-sequence="${rollSequence}"][data-disposition="redone"]`),
    ).toHaveCount(1);

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
