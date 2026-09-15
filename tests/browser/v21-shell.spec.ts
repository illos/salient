// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 foundation: the session shell replaces the site nav on the table route, the document never
 * scrolls, each pane scrolls independently and the command line stays pinned. Captures the table
 * as Director and player in FreePlay and in combat, both themes, at 1440×900 and 1920×1080 under
 * .playtest/v21/shell/.
 */
import { expect, test, type Page } from '@playwright/test';
import { createTable, shoot, THEMES, VIEWPORTS } from './v21-fixtures';

async function assertShell(page: Page, role: string) {
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Salient', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /Running/i })).toBeVisible();
  const metrics = await page.evaluate(() => ({
    inner: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
    scrollY: window.scrollY,
  }));
  expect(metrics.documentHeight, `${role}: document height`).toBe(metrics.inner);
  expect(metrics.bodyHeight, `${role}: body height`).toBeLessThanOrEqual(metrics.inner);
  expect(metrics.scrollY).toBe(0);
  const panes = page.locator('.session-pane-scroll');
  await expect(panes).toHaveCount(3);
  const overflow = await panes.evaluateAll(nodes =>
    nodes.map(node => ({
      client: node.clientHeight,
      scroll: node.scrollHeight,
      overflowY: getComputedStyle(node).overflowY,
    })),
  );
  for (const pane of overflow) expect(pane.overflowY).toBe('auto');
  // Each pane fills the frame under the header and is its own scroll region. Whether a pane
  // actually overflows depends on how much the fixture put in it, so that is not asserted here;
  // the isolation checks below run for whichever panes do.
  const headerHeight = await page
    .locator('header')
    .first()
    .evaluate(node => node.getBoundingClientRect().height);
  // The centre pane gives up its bottom to the pinned command line; the side panes do not.
  const footerHeight = await page
    .locator('[data-pane="log"] [data-command-footer]')
    .evaluate(node => node.getBoundingClientRect().height)
    .catch(() => 0);
  for (const [index, pane] of overflow.entries())
    expect(
      Math.abs(pane.client - (metrics.inner - headerHeight - (index === 1 ? footerHeight : 0))),
      `${role}: pane ${index} fills the frame`,
    ).toBeLessThanOrEqual(2);
  // Scrolling one pane moves neither the page nor the other panes.
  for (let index = 0; index < 3; index++) {
    if (overflow[index]!.scroll <= overflow[index]!.client) continue;
    await panes.nth(index).evaluate(node => (node.scrollTop = 200));
    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      tops: [...document.querySelectorAll('.session-pane-scroll')].map(n => n.scrollTop),
    }));
    expect(after.scrollY).toBe(0);
    for (const [other, top] of after.tops.entries())
      if (other !== index) expect(top, `${role}: pane ${other} stays put`).toBe(0);
    expect(after.tops[index]).toBeGreaterThan(0);
    await panes.nth(index).evaluate(node => (node.scrollTop = 0));
  }
  // The command line is visible at the bottom of the centre pane.
  const input = page.getByLabel('Slash command');
  await expect(input).toBeVisible();
  const box = (await input.boundingBox())!;
  const centre = (await page.locator('[data-pane="log"]').boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(metrics.inner);
  expect(box.y + box.height).toBeGreaterThan(metrics.inner - 80);
  expect(box.x).toBeGreaterThanOrEqual(centre.x);
  expect(box.x + box.width).toBeLessThanOrEqual(centre.x + centre.width + 1);
}

for (const combat of [false, true]) {
  test(`session shell ${combat ? 'in combat' : 'in FreePlay'}: no site nav, no page scroll, independent panes, pinned command line`, async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const table = await createTable(browser, { combat });
    try {
      const mode = combat ? 'combat' : 'freeplay';
      for (const viewport of VIEWPORTS) {
        for (const [page, role] of [
          [table.director, 'director'],
          [table.player, 'player'],
        ] as const) {
          await page.setViewportSize(viewport);
          for (const theme of THEMES)
            await shoot(page, 'shell', `${mode}-${role}`, { theme, viewport });
          await assertShell(page, `${role} ${mode} ${viewport.width}`);
        }
      }
      // Pane widths follow the tokens: 424 / flex / 424, heroes 566 while combat is committed.
      const widths = await table.director.evaluate(() =>
        [...document.querySelectorAll('.session-pane')].map(n => n.getBoundingClientRect().width),
      );
      expect(Math.round(widths[0]!)).toBe(424);
      expect(Math.round(widths[2]!)).toBe(combat ? 566 : 424);
      const header = await table.director
        .locator('header')
        .first()
        .evaluate(n => n.getBoundingClientRect().height);
      expect(header).toBe(70);
      // The Director's header controls submit the session transition and the user menu opens.
      if (!combat) {
        await table.director.getByRole('button', { name: 'Pause', exact: true }).click();
        await expect(
          table.player.getByRole('status').filter({ hasText: /^Paused$/ }),
        ).toBeVisible();
        await table.director.getByRole('button', { name: 'Resume', exact: true }).click();
        await expect(
          table.player.getByRole('status').filter({ hasText: /Running · Free play/ }),
        ).toBeVisible();
      }
      await table.player.getByRole('button', { name: /account menu$/ }).click();
      await expect(table.player.getByRole('group', { name: 'Appearance' })).toBeVisible();
      await expect(table.player.getByRole('button', { name: 'Sign out' })).toBeVisible();
      await table.player.keyboard.press('Escape');
      await expect(table.player.getByRole('group', { name: 'Appearance' })).toHaveCount(0);
    } finally {
      await table.close();
    }
  });
}
