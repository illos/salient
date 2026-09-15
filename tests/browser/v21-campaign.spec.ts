// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 item 11, campaign home: the role tag and START SESSION share the header row; selecting a
 * player tile and starting a session still submits `sessions.start`; COPY writes the invitation
 * link to the clipboard and reads "Copied"; a join request approves from its row; the foes chips
 * count `×2` after adding the same foe twice and `×1` after removing one; the log filter still
 * filters. Captures the Director between sessions (pending join request, two foes), the Director
 * with a running session and the player view, both themes, at 1440×900 and 1920×1080, viewport
 * and full page, under .playtest/v21/campaign/.
 */
import { expect, test, type Page } from '@playwright/test';
import { register, shoot, THEMES, VIEWPORTS } from './v21-fixtures';

async function captureAll(page: Page, name: string) {
  for (const viewport of VIEWPORTS)
    for (const theme of THEMES) {
      await shoot(page, 'campaign', name, { theme, viewport });
      await shoot(page, 'campaign', `${name}-full`, { theme, viewport, fullPage: true });
    }
  await page.setViewportSize(VIEWPORTS[0]!);
}

test('campaign home: header actions, player tiles, copy, join requests, foe chips, log filter', async ({
  browser,
}) => {
  const directorContext = await browser.newContext({
    viewport: VIEWPORTS[0],
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const playerContext = await browser.newContext({ viewport: VIEWPORTS[0] });
  const requesterContext = await browser.newContext({ viewport: VIEWPORTS[0] });
  try {
    const director = await directorContext.newPage();
    const player = await playerContext.newPage();
    const requester = await requesterContext.newPage();
    const stamp = crypto.randomUUID().slice(0, 8);
    await register(director, `Director ${stamp}`, `v21c-director-${stamp}@example.test`);
    await director.getByLabel('Campaign name').fill(`Blackcastle ${stamp}`);
    await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
    await expect(director.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
    const campaignUrl = director.url();
    const invite = await director.getByLabel('Invitation link').inputValue();

    // Header: the role tag and START SESSION sit together at the right of the same row.
    const tag = director.getByTestId('role-tag');
    const start = director.getByRole('button', { name: 'Start session', exact: true });
    await expect(tag).toHaveText(/director/i);
    await expect(start).toBeVisible();
    const [tagBox, startBox, headingBox] = await Promise.all([
      tag.boundingBox(),
      start.boundingBox(),
      director.getByRole('heading', { name: `Blackcastle ${stamp}` }).boundingBox(),
    ]);
    expect(
      Math.abs(tagBox!.y + tagBox!.height / 2 - (startBox!.y + startBox!.height / 2)),
    ).toBeLessThan(4);
    expect(tagBox!.x + tagBox!.width).toBeLessThanOrEqual(startBox!.x);
    expect(startBox!.x).toBeGreaterThan(headingBox!.x + headingBox!.width);
    await expect(director.getByText('1 member · Between sessions')).toBeVisible();

    // Copy writes the link to the clipboard and reports success. The control is icon-only:
    // docs/accounts-and-access-spec.md#5 requires no visible button label, which overrides the
    // mockup's filled COPY button.
    const copy = director.getByRole('button', { name: 'Copy link', exact: true });
    await expect(copy).toHaveText('');
    await copy.click();
    expect(await director.evaluate(() => navigator.clipboard.readText())).toBe(invite);
    await expect(copy).toHaveAttribute('title', 'Copied');
    await expect(copy).toHaveAttribute('title', 'Copy link', { timeout: 5000 });

    // A member and a pending requester.
    await register(player, `Player ${stamp}`, `v21c-player-${stamp}@example.test`);
    await player.goto(invite);
    await player.getByRole('button', { name: 'Request to join' }).click();
    await expect(director.getByTestId('join-request-count')).toHaveText('1');
    await director
      .getByTestId('join-request')
      .getByRole('button', { name: 'Approve', exact: true })
      .click();
    await expect(director.getByTestId('member-row')).toHaveCount(2);
    // Membership order is not specified; find the row by its member.
    const playerRow = director.getByTestId('member-row').filter({ hasText: `Player ${stamp}` });
    await expect(playerRow).toHaveCount(1);
    await expect(playerRow).toContainText(/observer/i);
    await register(requester, `Requester ${stamp}`, `v21c-requester-${stamp}@example.test`);
    await requester.goto(invite);
    await requester.getByRole('button', { name: 'Request to join' }).click();
    await expect(director.getByTestId('join-request-count')).toHaveText('1');
    await expect(director.getByTestId('join-request')).toContainText(`Requester ${stamp}`);

    // Foe chips: ×2 after adding the same foe twice, ×1 after removing one.
    await player.goto(campaignUrl);
    await expect(player.getByRole('heading', { name: `Blackcastle ${stamp}` })).toBeVisible();
    await expect(player.getByRole('button', { name: 'Start session' })).toHaveCount(0);
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await expect(director.getByTestId('foe-chip')).toHaveCount(1);
    await expect(director.getByTestId('foe-count')).toHaveText('×1');
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await expect(director.getByTestId('foe-chip')).toHaveCount(1);
    await expect(director.getByTestId('foe-count')).toHaveText('×2');
    await expect(director.getByText('2 loaded')).toBeVisible();
    await expect(player.getByRole('progressbar', { name: 'Goblin Warrior Stamina' })).toHaveCount(
      2,
    );
    await expect(director.getByTestId('command-disclosure')).not.toHaveAttribute('open', '');
    await captureAll(director, 'director-between-sessions');
    await captureAll(player, 'player-between-sessions');
    await director.getByRole('button', { name: 'Remove Goblin Warrior', exact: true }).click();
    await expect(director.getByTestId('foe-count')).toHaveText('×1');
    await expect(player.getByRole('progressbar', { name: 'Goblin Warrior Stamina' })).toHaveCount(
      1,
    );
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await expect(director.getByTestId('foe-count')).toHaveText('×2');

    // Player tiles: check the player, start from the header, and the session controls appear.
    const tile = director.getByRole('checkbox', { name: `Player ${stamp}`, exact: true });
    await tile.check();
    await expect(tile).toBeChecked();
    await director.getByRole('button', { name: 'Start session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Pause session', exact: true }),
    ).toBeVisible();
    await expect(director.getByRole('button', { name: 'End session', exact: true })).toBeVisible();
    await expect(director.getByRole('link', { name: 'Open the table', exact: true })).toBeVisible();
    await expect(director.getByRole('button', { name: 'Start session' })).toHaveCount(0);
    await expect(playerRow).toContainText(/player/i);
    await expect(player.getByText('The session is running.', { exact: false })).toBeVisible();
    await expect(player.getByTestId('role-tag')).toHaveText(/player/i);
    await expect(director.getByText('Started a session.', { exact: true })).toBeVisible();
    await captureAll(director, 'director-running');
    await captureAll(player, 'player-running');

    // Log filter: the session option shows only that session's entries.
    const select = director.locator('select').filter({ hasText: 'All campaign activity' });
    await expect(
      director.getByText('Goblin Warrior added to the foes roster.').first(),
    ).toBeVisible();
    await select.selectOption({ index: 1 });
    await expect(director.getByText('Started a session.', { exact: true })).toBeVisible();
    await expect(director.getByText('Goblin Warrior added to the foes roster.')).toHaveCount(0);
    await expect(director.getByText(`Created Blackcastle ${stamp}.`)).toHaveCount(0);
    await select.selectOption({ index: 0 });
    await expect(director.getByText(`Created Blackcastle ${stamp}.`)).toBeVisible();

    // End the session: the log row carries its closed-session meta and the header shows last played.
    await director.getByRole('button', { name: 'End session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Start session', exact: true }),
    ).toBeVisible();
    await expect(director.getByText('Closed the session.', { exact: true })).toBeVisible();
    await expect(director.getByText('Session 1 · closed').first()).toBeVisible();
    await expect(director.getByText(/Last played just now/)).toBeVisible();
    await expect(player.getByText('Your Director will start the next session.')).toBeVisible();
  } finally {
    await Promise.all([directorContext, playerContext, requesterContext].map(c => c.close()));
  }
});
