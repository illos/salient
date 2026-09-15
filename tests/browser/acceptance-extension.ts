// SPDX-License-Identifier: GPL-3.0-only
// Continue the actual wizard-created hero into the common table journey; no seeded hero shortcut.
import { expect, type Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';

export async function tableJourney(pages: Page[], campaignUrl: string, stamp: string) {
  const [director, player, observer] = pages as [Page, Page, Page];
  const campaignId = campaignUrl.split('/').at(-1)!;
  const tokens = Object.fromEntries(
    await Promise.all(
      pages.map(async (page, index) => [
        ['director', 'player', 'observer'][index],
        await page.evaluate(async () => {
          const modulePath = '/web/auth-client.ts';
          const { authClient } = await import(modulePath);
          const result = await authClient.convex.token();
          if (!result.data?.token) throw new Error('No authenticated browser token available');
          return result.data.token as string;
        }),
      ]),
    ),
  );

  const cli = async (role: string, ...args: string[]) => {
    const output = await promisify(execFile)('pnpm', ['app', ...args], {
      env: {
        ...process.env,
        SALIENT_AUTH_TOKEN: tokens[role],
      },
    });
    return JSON.parse(output.stdout);
  };
  const query = (name: string, role = 'director') =>
    cli(role, 'query', name, JSON.stringify({ campaignId }));
  const command = (text: string, role = 'director') =>
    cli(role, 'command', text, '--campaign', campaignId);
  await director.goto(campaignUrl);
  await director.getByLabel(`Player ${stamp}`, { exact: true }).check();
  await director.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(director.getByRole('button', { name: 'Pause session', exact: true })).toBeVisible();
  await Promise.all(pages.map(page => page.goto(`${campaignUrl}/table`)));
  await director.getByRole('button', { name: 'Add foe', exact: true }).click();
  await expect(player.getByRole('progressbar', { name: 'Goblin Warrior health' })).toBeVisible();
  const initial = await query('table:roster');
  const heroId = initial.heroes[0].id;
  const foeId = initial.foes[0].id;
  await command(`@{character:${heroId}} /adjust stamina value=20`);
  await player.getByRole('button', { name: 'Catch Breath', exact: true }).click();
  await expect.poll(async () => (await query('table:roster')).heroes[0].live.stamina).toBe(30);
  await director.getByRole('button', { name: 'Start combat', exact: true }).click();
  await director.getByRole('button', { name: 'OK', exact: true }).click();
  await director.getByRole('button', { name: 'Roll initiative (d10)', exact: true }).click();
  await director.getByRole('button', { name: 'Heroes first', exact: true }).click();
  await player.getByRole('button', { name: 'Take turn', exact: true }).first().click();
  const current = await query('encounters:current');
  expect(current.activeTurn.actor.id).toBe(heroId);

  // Persisted guided-input cards survive all role reconnects; only the owner targeting draft clears.
  const opened = await command(`@{character:${heroId}} /table roll`, 'player');
  const eventsBeforeReconnect = (await query('events:list')).events.map(
    (event: { id: string }) => event.id,
  );
  const readPending = () =>
    cli(
      'player',
      'query',
      'interactions:get',
      JSON.stringify({ interactionId: opened.interactionId }),
    );
  await command(`@{character:${heroId}} /ability select ability="Thunder Roar"`, 'player');
  expect((await query('targets:drafts', 'player')).mine.abilityId).toContain('thunder-roar');
  for (const [index, page] of pages.entries()) {
    await page.context().setOffline(true);
    await page.waitForTimeout(300);
    await page.context().setOffline(false);
    await page.reload();
    await expect(page.getByText(/Session running · Combat · round 1/)).toBeVisible();
    expect((await query('encounters:current')).activeTurn.id).toBe(current.activeTurn.id);
    expect((await readPending()).status).toBe('awaiting-input');
    await expect(page.getByText(/awaiting input: which dice to roll/).first()).toBeVisible();
    if (index === 0)
      expect((await query('targets:drafts', 'player')).mine.abilityId).toContain('thunder-roar');
  }
  expect((await query('targets:drafts', 'player')).mine?.abilityId ?? null).toBeNull();
  const afterReconnect = (await query('events:list')).events;
  expect(
    eventsBeforeReconnect.every((id: string) =>
      afterReconnect.some((event: { id: string }) => event.id === id),
    ),
  ).toBe(true);
  const answerId = crypto.randomUUID();
  const answerArgs = ['respond', opened.interactionId, '{"dice":"d6"}', '--command-id', answerId];
  const answered = await cli('player', ...answerArgs);
  expect(await cli('player', ...answerArgs)).toEqual(answered);
  expect((await readPending()).resolvedEventId).toBe(answered.eventId);
  expect(
    (await query('events:list')).events.filter(
      (event: { commandId: string }) => event.commandId === answerId,
    ),
  ).toHaveLength(1);
  // Select the real common attack in the shared ability panel, then fire via the foe reticle.
  await player
    .getByTitle(
      `@{character:${heroId}} /ability select ability="mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike"`,
      { exact: true },
    )
    .click();
  await player
    .locator(
      'button[title="Target Goblin Warrior (selecting a target for a pending ability fires it)"]',
    )
    .click();
  await expect(player.getByRole('button', { name: 'Add edge', exact: true })).toBeVisible();
  expect((await query('abilities:results')).length).toBe(1);
  const result = (await query('abilities:results'))[0];
  const beforeCorrection = await query('table:roster');
  await player.getByRole('button', { name: 'Add edge', exact: true }).click();
  await expect(player.getByText(/: 1 edge, 0 bane → total/).first()).toBeVisible();
  expect((await query('abilities:results'))[0].targets[0].edges).toBe(1);
  await player.getByRole('button', { name: 'Undo', exact: true }).first().click();
  await expect(player.getByText(/: 0 edge, 0 bane → total/).first()).toBeVisible();
  expect((await query('abilities:results'))[0].targets[0].edges).toBe(0);
  expect((await query('table:roster')).foes).toEqual(beforeCorrection.foes);
  await player.getByRole('button', { name: 'Redo', exact: true }).first().click();
  await expect(player.getByText(/: 1 edge, 0 bane → total/).first()).toBeVisible();
  expect((await query('abilities:results'))[0].targets[0].edges).toBe(1);
  expect((await query('abilities:results'))[0].dice).toEqual(result.dice);
  await command(`@{character:${heroId}} /condition on name=prone`, 'player');
  await command(`@{foe:${foeId}} /adjust temporary-stamina value=7`);

  // Repeated real actions keep the three reactive views active; collect post-GC heap/DOM samples.
  const sessions = await Promise.all(pages.map(page => page.context().newCDPSession(page)));
  await Promise.all(sessions.map(cdp => cdp.send('Performance.enable')));
  const samples: unknown[] = [];
  const started = Date.now();
  for (let cycle = 0; cycle <= 60; cycle++) {
    if (cycle)
      await command(
        `@{character:${heroId}} /condition ${cycle % 2 ? 'off' : 'on'} name=prone`,
        'player',
      );
    if (cycle % 10 === 0) {
      const roles = [];
      for (const [index, cdp] of sessions.entries()) {
        await cdp.send('HeapProfiler.collectGarbage');
        const metrics = Object.fromEntries(
          (await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]),
        );
        roles.push({
          role: ['director', 'player', 'observer'][index],
          heapBytes: metrics.JSHeapUsedSize,
          nodes: metrics.Nodes,
          logRows: await pages[index]!.locator('li[data-disposition]').count(),
        });
      }
      for (const role of roles) {
        expect(role.logRows).toBeGreaterThan(0);
        expect(role.logRows).toBeLessThanOrEqual(50);
        if (cycle >= 40) expect(role.logRows).toBe(50);
      }
      samples.push({ cycle, elapsedMs: Date.now() - started, roles });
    }
  }
  await writeFile(
    '.playtest/audit-2026-09-15/performance.json',
    JSON.stringify(
      {
        browser: await director.context().browser()!.version(),
        workload:
          '60 real condition toggles during one active turn, three reactive Chromium contexts, post-GC samples every 10',
        durationMs: Date.now() - started,
        samples,
        limitation:
          'Representative local sample, not a one-hour or six-hour certification; no numeric product threshold has been selected.',
      },
      null,
      2,
    ),
  );
  for (const [index, page] of pages.entries())
    await page.screenshot({
      path: `.playtest/audit-2026-09-15/combat-${index}.png`,
      fullPage: true,
    });
  await director.getByRole('button', { name: 'End combat', exact: true }).click();
  for (const page of pages)
    await expect(page.getByRole('heading', { name: 'Combat closeout', exact: true })).toBeVisible();
  await director.getByLabel(`Award to Grug ${stamp}`, { exact: false }).check();
  await director.getByRole('button', { name: 'Confirm Victory award', exact: true }).click();
  await expect(
    observer.getByRole('status').filter({ hasText: 'Victory award confirmed: 1' }),
  ).toBeVisible();
  await director.getByRole('button', { name: 'Finish cleanup', exact: true }).click();
  await expect(player.getByText('Session running · FreePlay', { exact: true })).toBeVisible();
  expect((await query('table:roster')).heroes[0].live.victories).toBe(1);
  await director.goto(campaignUrl);
  await director.getByRole('button', { name: 'End session', exact: true }).click();
  await director.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(director.getByRole('button', { name: 'Pause session', exact: true })).toBeVisible();
  expect((await query('table:roster')).heroes[0].live.victories).toBe(1);
}
