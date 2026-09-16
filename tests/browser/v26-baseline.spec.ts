// SPDX-License-Identifier: GPL-3.0-only
// Real UI pre-compiler regression evidence. V26 compiler acceptance is still separate.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
import { test, expect, type Page } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify, parseEnv } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createTable } from './v21-fixtures';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import reference from '../fixtures/v25-bethell.json' with { type: 'json' };

const output = '.playtest/v26/corrections-evidence';
const exec = promisify(execFile);

// Only the fresh, task-owned local runtime may be reseeded. Never run against shared port 3212.
function checkTarget() {
  const env = parseEnv(readFileSync('.env.local', 'utf8'));
  expect(env.VITE_CONVEX_URL).toBe('http://127.0.0.1:3234');
  expect(env.VITE_CONVEX_SITE_URL).toBe('http://127.0.0.1:3235');
  expect(env.CONVEX_DEPLOYMENT).toBe('anonymous:anonymous-agent');
  if (process.env.CONVEX_DEPLOYMENT)
    expect(process.env.CONVEX_DEPLOYMENT).toBe(env.CONVEX_DEPLOYMENT);
  expect(process.env.SALIENT_TEST_URL).toBe('http://127.0.0.1:5184');
  for (const key of [
    'CONVEX_DEPLOY_KEY',
    'CONVEX_DEPLOYMENT_TOKEN',
    'CONVEX_SELF_HOSTED_URL',
    'CONVEX_SELF_HOSTED_ADMIN_KEY',
  ]) {
    expect(process.env[key]).toBeUndefined();
    expect(env[key]).toBeUndefined();
  }
  const local = JSON.parse(readFileSync('.convex/local/default/config.json', 'utf8'));
  expect(local.ports).toEqual({ cloud: 3234, site: 3235 });
  expect(local.deploymentName).toBe('anonymous-agent');
}

function seedFor(a: number, b: number) {
  for (let n = 0; n < 100_000; n++) {
    const seed = createHash('sha256').update(`V26 disposable dice fixture ${n}`).digest();
    const values = [0, 1].map(counter => {
      const input = Buffer.alloc(40);
      seed.copy(input);
      input.writeBigUInt64BE(BigInt(counter), 32);
      return createHash('sha256').update(input).digest().readUInt32BE(0);
    });
    if (
      values.every(x => x < 4_294_967_290) &&
      (values[0]! % 10) + 1 === a &&
      (values[1]! % 10) + 1 === b
    )
      return seed.toString('hex');
  }
  throw new Error('No deterministic seed found');
}

test('V26 real-app regression: consecutive corrections and ten abilities on proper turns', async ({
  browser,
}) => {
  test.skip(process.env.SALIENT_V26_BASELINE !== '1', 'Opt-in isolated evidence run only');
  test.setTimeout(600_000);
  const testedRevision = (await exec('git', ['rev-parse', 'HEAD'])).stdout.trim();
  const testScriptSha256 = createHash('sha256')
    .update(readFileSync('tests/browser/v26-baseline.spec.ts'))
    .digest('hex');
  checkTarget();
  mkdirSync(output, { recursive: true });
  mkdirSync('.playtest/v26', { recursive: true });
  const records: Json[] = [];
  const errors: string[] = [];
  const fixture = await createTable(browser, { viewport: { width: 1600, height: 2200 } });
  const { director, player, campaignId, heroId } = fixture;
  for (const page of [director, player]) page.on('pageerror', error => errors.push(error.message));
  const connect = async (page: Page) => {
    const token = await page.evaluate(async () => {
      // Mirror installed crossDomainClient.getCookie()/init(): this app stores the browser
      // session in localStorage and sends Better-Auth-Cookie, not ordinary browser cookies.
      // Keep credentials in memory only; this also works with the production-built frontend.
      const stored = JSON.parse(localStorage.getItem('better-auth_cookie') ?? '{}') as Record<
        string,
        { value: string; expires: string | null }
      >;
      const cookie = Object.entries(stored)
        .filter(([, value]) => !value.expires || new Date(value.expires) >= new Date())
        .map(([key, value]) => `${key}=${value.value}`)
        .join('; ');
      if (!cookie) throw new Error('No active browser session for readback');
      const response = await fetch('/api/auth/convex/token', {
        credentials: 'omit',
        headers: { 'Better-Auth-Cookie': cookie },
      });
      if (!response.ok) throw new Error(`Application token request failed: ${response.status}`);
      return ((await response.json()) as { token: string }).token;
    });
    const client = new ConvexHttpClient('http://127.0.0.1:3234');
    client.setAuth(token);
    return client;
  };
  const dc = await connect(director);
  const pc = await connect(player);
  const query = (name: string, args: Json = { campaignId }, client = dc): Promise<Json> =>
    client.query(makeFunctionReference<'query'>(name), args);
  const mutation = (name: string, args: Json, client = dc): Promise<Json> =>
    client.mutation(makeFunctionReference<'mutation'>(name), args);
  const state = async () => ({
    roster: await query('table:roster'),
    results: await query('abilities:results'),
    encounter: await query('encounters:current'),
  });
  const events = async () => (await query('events:list')).events as Json[];
  const flush = () =>
    writeFileSync(
      `${output}/readback.json`,
      JSON.stringify(
        {
          testedRevision,
          runtimeHistorySha256: createHash('sha256')
            .update(readFileSync('convex/lib/history.ts'))
            .digest('hex'),
          testScriptSha256,
          sourcePin: 'fb83a789da8f0327a389c277a0c790b1648d5810',
          frontend: 'http://127.0.0.1:5184',
          backend: 'http://127.0.0.1:3234',
          campaignId,
          heroId,
          method:
            'Playwright UI commands; authenticated readback; disclosed isolated diceStates seed imports; no fabricated result rows',
          records,
          errors,
        },
        null,
        2,
      ),
    );
  const ui = async (text: string, page = director) => {
    const before = Math.max(0, ...(await events()).map(e => e.sequence));
    const input = page.getByLabel('Slash command', { exact: true });
    await input.fill(text);
    await input.press('Enter');
    // Wait for the submitting UI to acknowledge success before issuing another command.
    // A separate readback can observe the commit before this client's pending state clears.
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue('');
    await expect
      .poll(async () => Math.max(0, ...(await events()).map(e => e.sequence)))
      .toBeGreaterThan(before);
    return (await events())
      .filter(e => e.sequence > before)
      .sort((a, b) => a.sequence - b.sequence);
  };
  const dice = async (a: number, b: number) => {
    checkTarget();
    const path = '.playtest/v26/dice-state.jsonl';
    writeFileSync(path, JSON.stringify({ campaignId, seed: seedFor(a, b), counter: 0 }) + '\n');
    await exec('pnpm', [
      'exec',
      'convex',
      'import',
      '--table',
      'diceStates',
      '--replace',
      '--yes',
      path,
      '--env-file',
      '.env.local',
    ]);
  };
  const entry = (event: Json, page = director) =>
    page.locator(`[data-log-feed] li[data-sequence="${event.sequence}"]`);
  const capture = async (id: string, event: Json, source = true, page = director) => {
    const row = entry(event, page);
    await expect(row).toBeVisible();
    await row.scrollIntoViewIfNeeded();
    await row.screenshot({ path: `${output}/${id}-log.png` });
    if (source) {
      const link = row.getByRole('button', { name: /^Read .* in the rules$/ }).first();
      await link.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.screenshot({ path: `${output}/${id}-source.png` });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
  };
  try {
    const content = await query('content:status', {});
    expect(content.entryCount).toBe(467);
    records.push({ case: 'setup-content', content });
    const authored = { name: 'V26 Bethell', appearance: '', biography: '', notes: '' };
    const elementalist = await mutation(
      'characters:create',
      { commandId: crypto.randomUUID(), authored },
      pc,
    );
    await mutation(
      'characters:save',
      {
        commandId: crypto.randomUUID(),
        characterId: elementalist,
        expectedRevision: 1,
        authored,
        selections: draftSelectionsFrom(
          { ...reference.selections, 'details.name': authored.name },
          definitions,
        ),
      },
      pc,
    );
    await mutation(
      'characters:submit',
      { commandId: crypto.randomUUID(), characterId: elementalist, campaignId },
      pc,
    );
    await mutation('characters:approve', {
      commandId: crypto.randomUUID(),
      characterId: elementalist,
    });
    await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    await expect.poll(async () => (await query('table:roster')).foes.length).toBe(3);
    const foes = (await query('table:roster')).foes.map((f: Json) => f.id);
    const H = `@{character:${heroId}}`;
    const E = `@{character:${elementalist}}`;
    const G = foes.map((id: string) => `@{foe:${id}}`);
    await director.getByRole('button', { name: 'Start combat', exact: true }).click();
    await director.getByRole('button', { name: 'OK', exact: true }).click();
    await director.getByRole('button', { name: 'Roll initiative (d10)', exact: true }).click();
    await director.getByRole('button', { name: 'Heroes first', exact: true }).click();
    const ref = (actor: Json) => `@{${actor.kind}:${actor.id}}`;
    const turnEvents: Json[] = [];
    const turnCommand = async (text: string) => {
      const emitted = await ui(text);
      expect(emitted.some(e => e.description.includes('Rule warning:'))).toBe(false);
      turnEvents.push(...emitted);
    };
    // Finish intervening activations in the side/group order supplied by the real encounter.
    // Each tested main action gets a fresh ordinary turn; no allowances or turn rows are patched.
    const takeFreshTurn = async (actor: string) => {
      let encounter = await query('encounters:current');
      if (encounter.activeTurn) await turnCommand(`${ref(encounter.activeTurn.actor)} /turn end`);
      for (let step = 0; step < 30; step++) {
        encounter = await query('encounters:current');
        const groups = encounter.groups.filter(
          (g: Json) => g.active || (!g.completed && g.side === encounter.activeSide),
        );
        const entries = groups
          .flatMap((g: Json) => g.entries)
          .filter((e: Json) => !e.spent && !e.slain);
        const entry = entries.find((e: Json) => ref(e.actor) === actor) ?? entries[0];
        expect(entry, 'An eligible turn entry must exist').toBeTruthy();
        await turnCommand(`${ref(entry.actor)} /turn take`);
        if (ref(entry.actor) === actor) return;
        await turnCommand(`${ref(entry.actor)} /turn end`);
      }
      throw new Error('Could not reach a fresh turn for the requested actor');
    };
    let desiredFerocity = 0;
    let desiredMalice = 0;
    const balances = async () => {
      await ui(`${H} /adjust heroic-resource value=${desiredFerocity}`);
      await ui(`/adjust malice value=${desiredMalice}`);
    };
    const reset = async (ferocity = 0, malice = 0) => {
      desiredFerocity = ferocity;
      desiredMalice = malice;
      for (const g of G) await ui(`${g} /adjust stamina value=15`);
      await ui(`${H} /adjust stamina value=30`);
      await balances();
    };
    const play = async (
      id: string,
      ability: string,
      actor: string,
      targets: string[],
      expectedDamage: number[],
      options: { faces?: [number, number]; extra?: string; missing?: string[]; page?: Page } = {},
    ) => {
      await takeFreshTurn(actor);
      await balances(); // Round boundaries may grant Malice; restore only the declared fixture balance.
      const faces = options.faces ?? [7, 7];
      await dice(...faces);
      const before = await state();
      const emitted = await ui(
        `${actor} /ability use ability="${ability}" targets=[${targets.join(',')}] ${options.extra ?? ''}`,
        options.page ?? director,
      );
      const event = emitted.find(e => e.kind === 'ability.use' || e.kind === 'ability.recorded');
      expect(event).toBeTruthy();
      expect(event.description).not.toContain('Rule warning:');
      const after = await state();
      const result = after.results.find((r: Json) => r.eventId === event.id);
      if (expectedDamage.length) {
        expect(result.dice).toEqual({ d10a: faces[0], d10b: faces[1] });
        expect(result.targets.map((t: Json) => t.applied.afterImmunity)).toEqual(expectedDamage);
      }
      const health = (roster: Json, id: string) =>
        roster.foes.find((f: Json) => f.id === id)?.health.stamina ??
        roster.heroes.find((h: Json) => h.id === id)?.live.stamina;
      if (expectedDamage.length) {
        for (let i = 0; i < result.targets.length; i++) {
          const targetId = result.targets[i].target.id;
          expect(health(after.roster, targetId)).toBe(
            health(before.roster, targetId) - expectedDamage[i]!,
          );
          expect(result.targets[i].applied.staminaAfter).toBe(health(after.roster, targetId));
        }
      } else {
        expect(after.roster).toEqual(before.roster);
        expect(result).toBeUndefined();
      }
      expect(after.roster.malice).toBe(
        before.roster.malice - (ability === 'Bury the Point' ? 2 : 0),
      );
      for (const oldHero of before.roster.heroes) {
        const next = after.roster.heroes.find((h: Json) => h.id === oldHero.id);
        const cost =
          oldHero.id === heroId
            ? ability === 'Thunder Roar'
              ? 5
              : ability === 'Out of the Way!'
                ? 3
                : 0
            : 0;
        expect(next.live.heroicResource.current).toBe(oldHero.live.heroicResource.current - cost);
        expect(next.live.conditions).toEqual(oldHero.live.conditions);
      }
      for (const oldFoe of before.roster.foes)
        expect(after.roster.foes.find((f: Json) => f.id === oldFoe.id).conditions).toEqual(
          oldFoe.conditions,
        );
      const record = {
        case: id,
        ability,
        before,
        event,
        after,
        expectedDamage,
        result,
        baselineAssertions:
          'damage, roster health, fixed cost and unchanged conditions pass; fresh actor turn and no action-eligibility warnings',
        v26Acceptance: options.missing?.length
          ? 'blocked: not implemented'
          : 'compatibility baseline only',
        missing: options.missing ?? [],
      };
      records.push(record);
      flush();
      await capture(id, event);
      return { event, result };
    };
    await reset();
    const slam = await play('BS2', 'Brutal Slam', H, [G[0]], [8], {
      page: player,
      missing: [
        'compiled definition/effect occurrence',
        'push allowance 2+1=3',
        'source-linked size calculation',
      ],
    });
    await expect(
      entry(slam.event, player).getByRole('button', { name: 'Add bane', exact: true }),
    ).toBeVisible();
    await entry(slam.event, player).getByRole('button', { name: 'Add bane', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await query('abilities:results')).find((r: Json) => r.eventId === slam.event.id)
            .targets[0].banes,
      )
      .toBe(1);
    expect(
      (await query('abilities:results')).find((r: Json) => r.eventId === slam.event.id).mayCorrect,
    ).toBe(true);
    expect(
      (await query('table:roster')).foes.find((f: Json) => f.id === foes[0]).health.stamina,
    ).toBe(7);
    records.push({ case: 'BS7-one-bane', after: await state() });
    flush();
    await capture('BS7-one-bane', slam.event, false);
    await entry(slam.event, player).getByRole('button', { name: 'Add bane', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await query('table:roster')).foes.find((f: Json) => f.id === foes[0]).health.stamina,
      )
      .toBe(10);
    records.push({
      case: 'BS7',
      after: await state(),
      baselineAssertions:
        'two consecutive player inline corrections pass with retained dice and reconciled health',
      missing: ['calculated push correction'],
    });
    flush();
    await capture('BS7', slam.event, false);
    const twiceCorrected = (await query('abilities:results')).find(
      (r: Json) => r.eventId === slam.event.id,
    );
    expect(twiceCorrected.correctionEventIds).toHaveLength(2);
    expect(twiceCorrected.dice).toEqual({ d10a: 7, d10b: 7 });
    await ui('/history undo', player);
    expect(
      (await query('table:roster')).foes.find((f: Json) => f.id === foes[0]).health.stamina,
    ).toBe(7);
    records.push({ case: 'BS7-undo', after: await state() });
    flush();
    await capture('BS7-undo', slam.event, false);
    await ui('/history redo', player);
    expect(
      (await query('table:roster')).foes.find((f: Json) => f.id === foes[0]).health.stamina,
    ).toBe(10);
    records.push({ case: 'BS7-restored', after: await state() });
    flush();
    await capture('BS7-restored', slam.event, false);
    await reset();
    await play('BS3', 'Brutal Slam', H, [G[0]], [15], {
      faces: [8, 7],
      missing: ['calculated push allowance 5 after lethal damage'],
    });
    await reset();
    const manualSlam = await play('BS8-before', 'Brutal Slam', H, [G[0]], [8]);
    await entry(manualSlam.event)
      .getByRole('button', { name: 'Resolved at table', exact: true })
      .first()
      .click();
    await expect
      .poll(
        async () =>
          (await query('abilities:results')).find((r: Json) => r.eventId === manualSlam.event.id)
            .targets[0].dispositions.length,
      )
      .toBe(1);
    expect(
      (await query('table:roster')).foes.find((f: Json) => f.id === foes[0]).health.stamina,
    ).toBe(7);
    records.push({
      case: 'BS8-disposition',
      after: await state(),
      missing: ['occurrence-addressed compiled instruction'],
    });
    flush();
    await capture('BS8-disposition', manualSlam.event, false);
    await ui('/history rewind');
    expect(
      (await query('abilities:results')).find((r: Json) => r.eventId === manualSlam.event.id)
        .targets[0].dispositions,
    ).toHaveLength(0);
    await ui('/history redo');
    expect(
      (await query('abilities:results')).find((r: Json) => r.eventId === manualSlam.event.id)
        .targets[0].dispositions,
    ).toHaveLength(1);
    expect(
      (await query('table:roster')).foes.find((f: Json) => f.id === foes[0]).health.stamina,
    ).toBe(7);
    records.push({ case: 'BS8-restored', after: await state() });
    flush();
    await reset();
    await play('SC2', 'Spear Charge', G[0], [H], [4], { missing: ['compiled result format'] });
    await reset(0, 2);
    const bury = await play('BP2', 'Bury the Point', G[0], [H], [6], {
      missing: ['compiled post-damage occurrence'],
    });
    expect((await query('table:roster')).malice).toBe(0);
    await entry(bury.event)
      .getByRole('button', { name: 'Resolved at table', exact: true })
      .first()
      .click();
    await expect
      .poll(
        async () =>
          (await query('abilities:results')).find((r: Json) => r.eventId === bury.event.id)
            .targets[0].dispositions.length,
      )
      .toBe(1);
    records.push({ case: 'BP5', after: await state() });
    flush();
    await capture('BP5', bury.event, false);
    await reset(0, 1);
    await takeFreshTurn(G[0]);
    await balances();
    const blockedBefore = await state();
    const blockedEvents = await ui(`${G[0]} /ability use ability="Bury the Point" targets=[${H}]`);
    const blocked = blockedEvents.find(e => e.kind === 'ability.blocked');
    expect(blocked).toBeTruthy();
    expect(blocked.dice ?? []).toEqual([]);
    const blockedAfter = await state();
    expect(blockedAfter.roster).toEqual(blockedBefore.roster);
    expect(blockedAfter.encounter).toEqual(blockedBefore.encounter);
    expect(blockedAfter.results).toEqual(blockedBefore.results);
    records.push({ case: 'BP4', before: blockedBefore, event: blocked, after: await state() });
    flush();
    await capture('BP4', blocked);
    await reset();
    await play('MF3', 'Melee Weapon Free Strike', H, [G[0]], [13], {
      faces: [8, 7],
      extra: 'characteristic=A damage-characteristic=M',
      missing: ['compiled result format'],
    });
    await reset();
    await play('RF3', 'Ranged Weapon Free Strike', H, [G[0]], [8], {
      faces: [8, 7],
      extra: 'characteristic=M damage-characteristic=A',
      missing: ['compiled result format'],
    });
    await reset();
    await play('PP3', 'Pain for Pain', H, [G[1]], [15], { faces: [8, 7] });
    await reset(3);
    await play('OW2', 'Out of the Way!', H, [G[0]], [7]);
    await reset(6);
    await play('TR1', 'Thunder Roar', H, G, [17, 6, 9], {
      faces: [7, 6],
      extra: 'edges=[1,0,0] banes=[0,2,0]',
    });
    await reset(1);
    await play('LF1', 'Lines of Force', H, [H], []);
    await reset();
    await play('VF2', 'Viscous Fire', E, [G[0]], [9], {
      missing: ['compiled fire damage/push occurrence', 'calculated push allowance 3'],
    });
    records.push({ case: 'legal-turn-sequence', events: turnEvents });
    await director.reload();
    await expect(director.getByRole('heading', { name: 'Heroes', exact: true })).toBeVisible();
    records.push({
      case: 'reload',
      after: await state(),
      playerRoster: await query('table:roster', { campaignId }, pc),
    });
    flush();
    await director.screenshot({ path: `${output}/table-after-reload.png`, fullPage: true });
    expect(errors).toEqual([]);
  } catch (error) {
    await director.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
    throw error;
  } finally {
    flush();
    await fixture.close();
  }
});
