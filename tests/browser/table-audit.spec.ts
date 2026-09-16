import { expect, test, type Locator, type Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync } from 'node:fs';
import { seedLocalHero } from './local-fixtures';
import manifest from '../../shared/content/compendium/manifest.json' with { type: 'json' };

const password = 'Test-only-salient-password-42';

/**
 * One entry in the game-log feed. V21 gave the feed the mockup's shape: the actor's name is the
 * bold line and the event text sits beneath it, so an assertion matches the entry, not a `strong`.
 */
function logEntry(page: Page, text: RegExp | string) {
  return page.locator('[data-log-feed] li[data-sequence]').filter({ hasText: text });
}

/**
 * The campaign presentation settings moved out of the Director pane into the shared settings card
 * (V21 item 3, docs/table-spec.md#confirmed-combat-layout). Each toggle keeps its operation.
 */
async function withTableSettings(page: Page, act: (card: Locator) => Promise<void>) {
  await page.getByRole('button', { name: 'Table settings', exact: true }).click();
  const card = page.getByRole('dialog');
  await expect(card).toBeVisible();
  await act(card);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
}
async function register(page: Page, name: string, email: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();
}

test('three table contexts, palette, console and live CLI share persisted operations', async ({
  browser,
}) => {
  test.setTimeout(360_000);
  const contexts = await Promise.all(
    Array.from({ length: 3 }, () => browser.newContext({ viewport: { width: 1440, height: 960 } })),
  );
  try {
    const [director, player, observer] = await Promise.all(
      contexts.map(context => context.newPage()),
    );
    const stamp = crypto.randomUUID().slice(0, 8);
    const email = `audit-director-${stamp}@example.test`;
    await register(director, `Director ${stamp}`, email);
    await director.getByLabel('Campaign name').fill(`Audit ${stamp}`);
    await director.getByRole('button', { name: 'Create campaign', exact: true }).click();
    await expect(director.getByRole('heading', { name: `Audit ${stamp}` })).toBeVisible();
    const campaignUrl = director.url();
    const campaignId = campaignUrl.split('/').at(-1)!;
    const invite = await director.getByLabel('Invitation link').inputValue();
    for (const [page, role] of [
      [player, 'Player'],
      [observer, 'Observer'],
    ] as const) {
      await register(page, `${role} ${stamp}`, `audit-${role.toLowerCase()}-${stamp}@example.test`);
      await page.goto(invite);
      await page.getByRole('button', { name: 'Request to join' }).click();
      await director.getByRole('button', { name: 'Approve', exact: true }).click();
    }
    await director.getByLabel(`Player ${stamp}`, { exact: true }).check();
    await director.getByRole('button', { name: 'Start session', exact: true }).click();
    await expect(
      director.getByRole('button', { name: 'Pause session', exact: true }),
    ).toBeVisible();
    const asRole = async (role: 'director' | 'player' | 'observer', ...args: string[]) => {
      const result = await promisify(execFile)('pnpm', ['app', ...args], {
        env: {
          ...process.env,
          SALIENT_EMAIL: `audit-${role}-${stamp}@example.test`,
          SALIENT_PASSWORD: password,
        },
      });
      return JSON.parse(result.stdout);
    };
    const cli = (...args: string[]) => asRole('director', ...args);
    const query = (name: string, args: unknown = { campaignId }) =>
      cli('query', name, JSON.stringify(args));
    const contentStatus = await query('content:status', {});
    expect(contentStatus.entryCount).toBe(manifest.entryCount);
    expect(contentStatus.revision).toBe(manifest.compendium.revision);
    expect(contentStatus.contentHash).toBe(manifest.contentHash);
    const credentials = (role: string) => ({
      email: `audit-${role}-${stamp}@example.test`,
      password,
    });
    const heroName = `Thorn ${stamp}`;
    // A02: heroes reach the table through admission (evaluated build, R03 live values).
    await seedLocalHero(campaignId, heroName, credentials('player'), credentials('director'));
    await seedLocalHero(
      campaignId,
      `Watcher ${stamp}`,
      credentials('observer'),
      credentials('director'),
    );
    await Promise.all([director, player, observer].map(page => page.goto(`${campaignUrl}/table`)));
    for (const page of [director, player, observer]) {
      for (const name of ['Foes', 'Game log', 'Heroes'])
        await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    await expect(observer.getByLabel('Slash command')).toHaveCount(0);
    await expect(
      observer.getByRole('button', { name: 'Spend a Recovery', exact: true }),
    ).toHaveCount(0);
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await expect(player.getByRole('progressbar', { name: 'Goblin Warrior health' })).toBeVisible();
    await expect(
      observer.getByRole('progressbar', { name: 'Goblin Warrior health' }),
    ).toBeVisible();
    const before = await query('table:roster');
    const foeId = before.foes[0].id;
    const heroId = before.heroes.find((hero: { name: string }) => hero.name === heroName)!.id;
    const goblin = await query('content:get', {
      id: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    });
    const detail = await query('foes:detail', { campaignId, foeId });
    expect(goblin.features).toHaveLength(3);
    expect(JSON.parse(detail.sourceSnapshot).features).toEqual(goblin.features);
    expect(JSON.parse(detail.sourceSnapshot).jsonPath).toBe(goblin.jsonPath);
    // V21: the palette opens from the control inside the pinned command line.
    await director.getByRole('button', { name: 'Command palette', exact: true }).click();
    const note = director
      .locator('li')
      .filter({ has: director.getByText('Session note', { exact: true }) });
    await note.getByRole('button', { name: 'Use', exact: true }).click();
    await expect(director.getByLabel('Slash command')).toHaveValue(/\/session note/);
    await director.getByLabel('Slash command').fill(`@{foe:${foeId}} /adjust stamina value=11`);
    await director.getByLabel('Slash command').press('Enter');
    await expect(logEntry(director, /Manual adjustment.*Stamina.*11/i)).toHaveCount(1);
    for (const page of [player, observer]) {
      await expect(logEntry(page, /Manual adjustment.*Stamina.*adjusted/i)).toHaveCount(1);
      await expect(page.getByText(/15 → 11/)).toHaveCount(0);
    }
    const after = await query('table:roster');
    expect(after.foes[0].health.stamina).toBe(11);
    await player.reload();
    await expect(logEntry(player, /Manual adjustment.*Stamina.*adjusted/i)).toHaveCount(1);
    const commandId = crypto.randomUUID();
    const commandArgs = [
      'command',
      '/table roll dice="2d10"',
      '--campaign',
      campaignId,
      '--command-id',
      commandId,
    ];
    const rolled = await cli(...commandArgs);
    expect(await cli(...commandArgs)).toEqual(rolled);
    const playerRolled = await asRole('player', ...commandArgs);
    expect(playerRolled.eventId).not.toBe(rolled.eventId);
    const opened = await cli('command', '/table roll', '--campaign', campaignId);
    const pending = await query('interactions:get', { interactionId: opened.interactionId });
    expect(pending.status).toBe('awaiting-input');
    const answerId = crypto.randomUUID();
    const answerArgs = ['respond', opened.interactionId, '{"dice":"d6"}', '--command-id', answerId];
    const answered = await cli(...answerArgs);
    expect(await cli(...answerArgs)).toEqual(answered);
    const resolved = await query('interactions:get', { interactionId: opened.interactionId });
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedEventId).toBe(answered.eventId);
    const history = await query('events:list');
    expect(
      history.events.filter((event: { commandId: string }) => event.commandId === commandId),
    ).toHaveLength(2);
    expect(
      history.events.filter((event: { commandId: string }) => event.commandId === answerId),
    ).toHaveLength(1);
    const recorded = history.events.find((event: { id: string }) => event.id === rolled.eventId);
    expect(recorded.dice).toHaveLength(2);
    expect(
      recorded.dice.every(
        (die: { value: number; sides: number }) =>
          die.sides === 10 && die.value >= 1 && die.value <= 10,
      ),
    ).toBe(true);
    const otherRoll = history.events.find(
      (event: { id: string }) => event.id === playerRolled.eventId,
    );
    expect(otherRoll.payload.data.rollId).not.toBe(recorded.payload.data.rollId);

    const command = (text: string) => cli('command', text, '--campaign', campaignId);
    // The maxima (30 / 10) come from the admitted build (R02 4.1); only current values are set.
    for (const [field, value] of [
      ['stamina', 22],
      ['recoveries', 10],
      ['heroic-resource', 7],
    ] as const) {
      await command(`@{character:${heroId}} /adjust ${field} value=${value}`);
    }
    await command('/adjust malice value=47');
    await expect(logEntry(observer, /Manual adjustment.*Malice.*adjusted/)).toHaveCount(1);
    let observerRoster = await asRole(
      'observer',
      'query',
      'table:roster',
      JSON.stringify({ campaignId }),
    );
    expect(observerRoster.malice).toBeNull();
    expect(observerRoster.heroes[0].live).not.toHaveProperty('heroicResource');
    expect(observerRoster.heroes[0].live).not.toHaveProperty('xp');
    const ownRoster = await asRole(
      'player',
      'query',
      'table:roster',
      JSON.stringify({ campaignId }),
    );
    expect(ownRoster.heroes[0].live.heroicResource.current).toBe(7);
    await player.getByRole('button', { name: 'Spend a Recovery', exact: true }).click();
    await expect(logEntry(player, /spent a Recovery/i)).toHaveCount(1);
    const recovered = await query('table:roster');
    expect(recovered.heroes[0].live.stamina).toBe(30);
    expect(recovered.heroes[0].live.recoveries).toBe(9);
    const recoveryEvent = logEntry(player, /spent a Recovery/i);
    await recoveryEvent
      .getByRole('button', { name: 'Read Catch Breath in the rules', exact: true })
      .click();
    await expect(player.getByRole('dialog')).toContainText('Recovery');
    await player.getByRole('button', { name: 'Close rule', exact: true }).click();
    mkdirSync('.playtest/fixes', { recursive: true });
    await player.screenshot({ path: '.playtest/fixes/recovery-source.png', fullPage: true });
    const tested = await asRole(
      'player',
      'command',
      `@{character:${heroId}} /test roll characteristic=M value=2 skill="Lore; hard: winter" difficulty=hard`,
      '--campaign',
      campaignId,
    );
    let peerHistory = await asRole(
      'observer',
      'query',
      'events:list',
      JSON.stringify({ campaignId }),
    );
    let peerTest = peerHistory.events.find((event: { id: string }) => event.id === tested.eventId);
    expect(peerTest.payload.data.result).not.toHaveProperty('difficulty');
    expect(peerTest.payload.envelope.arguments).not.toHaveProperty('difficulty');
    expect(peerTest.description).toContain('(Lore; hard: winter)');
    expect(peerTest.description.endsWith(`; ${peerTest.payload.data.result.outcome}.`)).toBe(true);
    await withTableSettings(director, card =>
      card.getByRole('switch', { name: 'Show test difficulty', exact: true }).click(),
    );
    peerHistory = await asRole('observer', 'query', 'events:list', JSON.stringify({ campaignId }));
    peerTest = peerHistory.events.find((event: { id: string }) => event.id === tested.eventId);
    expect(peerTest.payload.data.result.difficulty).toBe('hard');
    await expect(logEntry(observer, /hard:/)).toHaveCount(1);
    await withTableSettings(director, card =>
      card.getByRole('button', { name: 'Winded', exact: true }).click(),
    );
    await expect(observer.getByText('Not winded', { exact: true })).toBeVisible();
    const peerFoes = await asRole('observer', 'query', 'foes:list', JSON.stringify({ campaignId }));
    expect(peerFoes.rows[0].health).toEqual({ mode: 'winded', winded: false });
    expect(peerFoes.rows[0]).not.toHaveProperty('healthFraction');
    await withTableSettings(director, card =>
      card.getByRole('switch', { name: 'Show Malice', exact: true }).click(),
    );
    observerRoster = await asRole(
      'observer',
      'query',
      'table:roster',
      JSON.stringify({ campaignId }),
    );
    expect(observerRoster.malice).toBe(47);
    await expect(logEntry(observer, /Malice 0 → 47/)).toHaveCount(1);
    await withTableSettings(director, card =>
      card.getByRole('switch', { name: 'Show Malice', exact: true }).click(),
    );
    await expect(logEntry(observer, /Malice 0 → 47/)).toHaveCount(0);
    await player.reload();
    await expect(player.getByRole('heading', { name: 'Heroes', exact: true })).toBeVisible();
    await expect(
      player.getByRole('button', { name: 'Spend a Recovery', exact: true }),
    ).toBeVisible();
    for (const page of [director, player, observer]) {
      for (const width of [1280, 1440]) {
        await page.setViewportSize({ width, height: 960 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
      }
    }
    mkdirSync('.playtest/fixes', { recursive: true });
    writeFileSync(
      '.playtest/fixes/live-evidence.json',
      JSON.stringify(
        {
          campaignId,
          contentStatus,
          before,
          after,
          rolled,
          playerRolled,
          pending,
          resolved,
          history,
          recovered,
          observerRoster,
          peerFoes,
          peerHistory,
        },
        null,
        2,
      ),
    );
    for (const [page, name] of [
      [director, 'director'],
      [player, 'player'],
      [observer, 'observer'],
    ] as const)
      await page.screenshot({ path: `.playtest/fixes/table-${name}-light.png`, fullPage: true });
    for (const [page, name] of [
      [director, 'director'],
      [player, 'player'],
      [observer, 'observer'],
    ] as const) {
      // V21: on the table the appearance switch sits in the header's user menu.
      await page.getByRole('button', { name: /account menu$/ }).click();
      await page
        .getByRole('group', { name: 'Appearance' })
        .getByRole('button', { name: 'Dark', exact: true })
        .click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.screenshot({ path: `.playtest/fixes/table-${name}-dark.png`, fullPage: true });
    }
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
