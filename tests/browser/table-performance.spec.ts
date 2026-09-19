// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createTable } from './v21-fixtures';

test('table opens without per-card detail reads, then drills in and preserves undo/redo', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const table = await createTable(browser);
  const { director, heroName, stamp } = table;
  const records: { phase: string; event: string; path: string; time: number; bytes?: number }[] =
    [];
  let phase = 'initial';
  try {
    const foes = director.locator('[data-pane="director"]');
    const heroes = director.locator('[data-pane="heroes"]');
    for (let count = 3; count <= 6; count++) {
      await director.getByRole('button', { name: 'Add foe', exact: true }).click();
      await expect(foes.locator('li[data-roster-card]')).toHaveCount(count);
    }
    director.on('websocket', socket => {
      const paths = new Map<number, string>();
      socket.on('framesent', ({ payload }) => {
        const frame = JSON.parse(String(payload));
        for (const query of frame.modifications ?? [])
          if (query.type === 'Add') {
            const path = String(query.udfPath);
            paths.set(query.queryId, path);
            records.push({ phase, event: 'subscribe', path, time: Date.now() });
          }
      });
      socket.on('framereceived', ({ payload }) => {
        const frame = JSON.parse(String(payload));
        for (const query of frame.modifications ?? []) {
          const path = paths.get(query.queryId);
          if (path && query.type === 'QueryUpdated')
            records.push({
              phase,
              event: 'result',
              path,
              time: Date.now(),
              bytes: Buffer.byteLength(JSON.stringify(query.value ?? null)),
            });
        }
      });
    });
    await director.reload();
    await expect(foes.locator('li[data-roster-card]')).toHaveCount(6);
    await expect(heroes.locator('li[data-roster-card]')).toHaveCount(1);
    await expect(heroes.locator('li[data-roster-card]')).toContainText('30 / 30');
    await expect(foes.locator('li[data-roster-card]').first()).toContainText('Level 1');
    await expect(director.locator('[data-log-feed]')).toContainText('Session started');
    const origin = await director.evaluate(() => performance.timeOrigin);
    await director.getByRole('tab', { name: 'Rolls', exact: true }).click();
    await director.getByRole('tab', { name: 'Log', exact: true }).click();
    expect(await director.evaluate(() => performance.timeOrigin)).toBe(origin);
    const initial = records.filter(row => row.phase === 'initial');
    expect(initial.filter(row => row.event === 'subscribe').map(row => row.path)).not.toContain(
      'foes:detail',
    );
    expect(initial.filter(row => row.event === 'subscribe').map(row => row.path)).not.toContain(
      'characters:sheet',
    );
    const rosterResponse = initial.find(
      row => row.path === 'table:roster' && row.event === 'result',
    );
    expect(rosterResponse).toBeDefined();
    for (const path of ['events:list', 'history:status']) {
      expect(
        initial.find(row => row.path === path && row.event === 'subscribe')!.time,
      ).toBeLessThanOrEqual(rosterResponse!.time);
    }
    await director.screenshot({ path: '/artifacts/v43-table-summary.png' });
    phase = 'foe-detail';
    await director
      .getByRole('button', { name: 'Open Goblin Warrior', exact: true })
      .first()
      .click();
    const detail = foes.getByRole('article', { name: 'Goblin Warrior stat block' });
    await expect(detail).toContainText('Spear Charge');
    expect(
      records.some(
        row => row.phase === phase && row.path === 'foes:detail' && row.event === 'subscribe',
      ),
    ).toBe(true);
    director.once('dialog', dialog => void dialog.accept('9'));
    await detail.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await expect(detail).toContainText('9 / 15');
    await director.getByRole('button', { name: 'Foes', exact: true }).click();
    const first = foes.locator('li[data-roster-card]').first();
    await expect(first).toContainText('9 / 15');
    const history = director.getByRole('group', { name: 'History', exact: true });
    await expect(history.getByRole('button', { name: 'Rewind', exact: true })).toBeEnabled();
    await history.getByRole('button', { name: 'Rewind', exact: true }).click();
    await expect(first).toContainText('15 / 15');
    await history.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(first).toContainText('9 / 15');
    phase = 'hero-detail';
    await director.getByRole('button', { name: `Open ${heroName}`, exact: true }).click();
    await expect(
      heroes.getByRole('article', { name: `${heroName} character sheet` }),
    ).toBeVisible();
    expect(
      records.some(
        row => row.phase === phase && row.path === 'characters:sheet' && row.event === 'subscribe',
      ),
    ).toBe(true);
    phase = 'persisted-reload';
    await director.reload();
    await expect(foes.locator('li[data-roster-card]').first()).toContainText('9 / 15');
    await expect(heroes.locator('li[data-roster-card]')).toHaveCount(1);
    await expect(director.getByRole('alert')).toHaveCount(0);
    mkdirSync('/artifacts/v43', { recursive: true });
    writeFileSync(
      '/artifacts/v43/subscriptions.json',
      JSON.stringify({ fixture: { stamp, foes: 6, heroes: 1 }, records }, null, 2),
    );
  } finally {
    await table.close();
  }
});
