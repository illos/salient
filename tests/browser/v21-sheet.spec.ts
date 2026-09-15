// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 character sheet: the header band with its five characteristic boxes, the Stamina callout
 * with recovery pips, ability cards grouped by action type, the Roll test entry opened from a
 * characteristic box, Catch Breath and the Director's numeric edit read back from the DOM, the
 * peer card without a Heroic Resource, and the compact sheet's sticky header in the heroes pane.
 * Captures owner, Director, peer and compact views in both themes at 1440×900 and 1920×1080
 * under .playtest/v21/sheet/.
 */
import { expect, test, type Page } from '@playwright/test';
import { createTable, register, shoot, THEMES, VIEWPORTS } from './v21-fixtures';

const GROUP_LABELS = ['Main actions', 'Maneuvers', 'Move actions', 'Triggered actions'];

async function assertStandalone(page: Page, heroName: string) {
  const sheet = page.getByRole('article', { name: `${heroName} character sheet` });
  await expect(sheet.getByRole('heading', { level: 1, name: heroName })).toBeVisible();
  await expect(sheet.getByRole('img', { name: `${heroName} portrait` })).toBeVisible();
  const boxes = sheet.getByRole('group', { name: 'Characteristics' }).getByRole('button');
  await expect(boxes).toHaveCount(5);
  for (const name of ['Might', 'Agility', 'Reason', 'Intuition', 'Presence'])
    await expect(boxes.filter({ hasText: name })).toHaveCount(1);
  await expect(sheet.getByRole('progressbar', { name: `${heroName} Stamina` })).toBeVisible();
  await expect(sheet.getByRole('img', { name: /^Recoveries \d+ of \d+$/ })).toBeVisible();
  await expect(sheet.getByText(/^Winded at \d+/)).toBeVisible();
  await expect(sheet.getByRole('heading', { name: 'Abilities', exact: true })).toBeVisible();
  for (const label of GROUP_LABELS)
    await expect(sheet.getByRole('heading', { level: 4, name: label })).toBeVisible();
  await expect(
    sheet.getByRole('list', { name: 'Main actions' }).getByText('Brutal Slam'),
  ).toBeVisible();
  await expect(sheet.getByText('Signature', { exact: true }).first()).toBeVisible();
  // Spec-required elements the mockup lacks keep their place: Conditions, Surges, Victories.
  for (const label of ['Surges', 'Victories', 'Conditions'])
    await expect(sheet.getByText(label, { exact: true }).first()).toBeVisible();
  // No filter tabs and no Level up (README departures).
  await expect(page.getByRole('button', { name: /level up/i })).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  const columns = await sheet.locator('[data-sheet-columns]').evaluate(node => {
    const cols = getComputedStyle(node).gridTemplateColumns.split(' ').map(parseFloat);
    return { cols, gap: parseFloat(getComputedStyle(node).columnGap) };
  });
  expect(columns.cols).toHaveLength(3);
  expect(columns.cols[0]).toBe(340);
  expect(columns.cols[2]).toBe(360);
  expect(columns.gap).toBe(32);
  return sheet;
}

const stamina = (page: Page) => page.locator('[data-sheet-stamina-value]').first();

test('standalone sheet: band, columns, Roll test, Catch Breath, Director edit, peer, compact', async ({
  browser,
}) => {
  test.setTimeout(420_000);
  const table = await createTable(browser);
  const { director, player, heroId, heroName, campaignUrl, tableUrl, stamp } = table;
  // A third member of the campaign: neither owner nor Director, so a peer of the hero.
  const peerContext = await browser.newContext({ viewport: VIEWPORTS[0] });
  const peer = await peerContext.newPage();
  try {
    await director.goto(campaignUrl);
    const invite = await director.getByLabel('Invitation link').inputValue();
    await register(peer, `Peer ${stamp}`, `v21-peer-${stamp}@example.test`);
    await peer.goto(invite);
    await peer.getByRole('button', { name: 'Request to join' }).click();
    await director.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(director.getByText(`Peer ${stamp}`).first()).toBeVisible();

    // Owner, standalone.
    await player.goto(`/characters/${heroId}`);
    const sheet = await assertStandalone(player, heroName);
    await expect(player.getByRole('link', { name: 'Edit', exact: true })).toBeVisible();
    await expect(player.getByRole('button', { name: 'Submit edit for review' })).toBeVisible();
    await expect(player.getByLabel('Sheet view')).toBeVisible();
    await expect(sheet.getByText('Private audit fixture note')).toBeAttached();
    // A characteristic box opens the shared Roll test entry with that characteristic selected.
    await sheet
      .getByRole('group', { name: 'Characteristics' })
      .getByRole('button', { name: /^Agility/ })
      .click();
    const rollTest = player.getByRole('form', { name: 'Roll test' });
    await expect(rollTest).toBeVisible();
    await expect(rollTest.getByLabel('Test characteristic')).toHaveValue('A');
    await expect(rollTest.getByRole('button', { name: 'Roll test (Agility)' })).toBeEnabled();
    await rollTest.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(rollTest).toHaveCount(0);
    // Catch Breath submits the shared operation; the Stamina number changes in the DOM.
    await director.goto(tableUrl);
    await director
      .getByLabel('Slash command')
      .fill(`@{character:${heroId}} /adjust stamina value=20`);
    await director.getByLabel('Slash command').press('Enter');
    await expect(stamina(player)).toHaveText(/^20\s*\/\s*30$/);
    await player.getByRole('button', { name: 'Catch Breath', exact: true }).click();
    await expect(stamina(player)).toHaveText(/^30\s*\/\s*30$/);
    await expect(player.getByRole('img', { name: 'Recoveries 9 of 10' })).toBeVisible();
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES) {
        await shoot(player, 'sheet', 'owner-standalone', { theme, viewport });
        await shoot(player, 'sheet', 'owner-standalone-full', { theme, viewport, fullPage: true });
      }
    await player.setViewportSize(VIEWPORTS[0]!);

    // Director, standalone: the numeric Edit / Save flow, then read back.
    await director.goto(`/characters/${heroId}`);
    await assertStandalone(director, heroName);
    await expect(director.getByText('Private audit fixture note')).toHaveCount(0);
    await expect(director.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
    await director.getByRole('button', { name: 'Edit Stamina', exact: true }).click();
    await director.getByLabel('New Stamina').fill('25');
    await director.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(stamina(director)).toHaveText(/^25\s*\/\s*30$/);
    await expect(stamina(player)).toHaveText(/^25\s*\/\s*30$/);
    await director.getByRole('button', { name: 'Edit Heroic Resource', exact: true }).click();
    await director.getByLabel('New Heroic Resource').fill('3');
    await director.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(director.locator('[data-sheet-heroic-resource]')).toHaveText('3');
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES) {
        await shoot(director, 'sheet', 'director-standalone', { theme, viewport });
        await shoot(director, 'sheet', 'director-standalone-full', {
          theme,
          viewport,
          fullPage: true,
        });
      }

    // Peer: name, owner, bar, Stamina and Recoveries; no Heroic Resource, no abilities, no notes.
    await peer.goto(`/characters/${heroId}`);
    const peerCard = peer.locator('[data-sheet-peer]');
    await expect(peerCard).toBeVisible();
    await expect(peerCard.getByText(heroName)).toBeVisible();
    await expect(peerCard.getByText(`Player ${stamp}`)).toBeVisible();
    await expect(peerCard.getByRole('progressbar', { name: `${heroName} Stamina` })).toBeVisible();
    await expect(peerCard.getByText('25 / 30')).toBeVisible();
    await expect(peerCard.getByText('9 / 10')).toBeVisible();
    await expect(peer.getByText(/ferocity/i)).toHaveCount(0);
    await expect(peer.getByText(/heroic resource/i)).toHaveCount(0);
    await expect(peer.getByText('Brutal Slam')).toHaveCount(0);
    await expect(peer.getByText('Private audit fixture note')).toHaveCount(0);
    for (const theme of THEMES)
      await shoot(peer, 'sheet', 'peer', { theme, viewport: VIEWPORTS[0]! });

    // Compact sheet in the heroes pane: the header stays put while the pane body scrolls.
    await player.goto(tableUrl);
    const compact = player.getByRole('article', { name: `${heroName} character sheet` });
    await expect(compact).toBeVisible();
    await expect(compact.locator('[data-sheet-columns]')).toHaveCount(0);
    const sticky = compact.locator('[data-sheet-sticky]');
    await expect(
      sticky.getByRole('group', { name: 'Characteristics' }).getByRole('button'),
    ).toHaveCount(5);
    await expect(sticky.getByRole('progressbar', { name: `${heroName} Stamina` })).toBeVisible();
    for (const label of GROUP_LABELS)
      await expect(compact.getByRole('heading', { level: 4, name: label })).toBeAttached();
    const pane = player.locator('[data-pane="heroes"] .session-pane-scroll');
    const overflow = await pane.evaluate(node => node.scrollHeight - node.clientHeight);
    expect(overflow).toBeGreaterThan(300);
    // Scroll until the sheet header reaches the top of the pane; only then is it stuck, and only
    // then does scrolling further test that it stays.
    const stuckAt = await pane.evaluate(node => {
      const header = node.querySelector<HTMLElement>('[data-sheet-sticky]')!;
      const top =
        header.getBoundingClientRect().top - node.getBoundingClientRect().top + node.scrollTop;
      node.scrollTop = top;
      return node.scrollTop;
    });
    await player.waitForTimeout(100);
    const before = (await sticky.boundingBox())!;
    await pane.evaluate((node, from) => (node.scrollTop = from + 300), stuckAt);
    await player.waitForTimeout(100);
    expect(await pane.evaluate(node => node.scrollTop)).toBe(stuckAt + 300);
    const after = (await sticky.boundingBox())!;
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    await expect(sticky.getByText(heroName)).toBeVisible();
    await expect(sticky.getByRole('progressbar', { name: `${heroName} Stamina` })).toBeVisible();
    await expect(
      player.getByRole('button', { name: 'Spend a Recovery', exact: true }),
    ).toBeVisible();
    await pane.evaluate(node => (node.scrollTop = 0));
    for (const viewport of VIEWPORTS)
      for (const theme of THEMES) await shoot(player, 'sheet', 'compact-pane', { theme, viewport });
    await pane.evaluate(node => (node.scrollTop = 400));
    await shoot(player, 'sheet', 'compact-pane-scrolled', {
      theme: 'light',
      viewport: VIEWPORTS[0]!,
    });
  } finally {
    await peerContext.close();
    await table.close();
  }
});
