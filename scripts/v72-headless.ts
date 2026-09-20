// SPDX-License-Identifier: GPL-3.0-only
// Opt-in real HTTP correction proof. No browser, mock backend or fabricated gameplay rows.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { ConvexHttpClient } from 'convex/browser';
import { getFunctionName, type FunctionArgs, type FunctionReference } from 'convex/server';
import { api } from '../convex/_generated/api.js';
import type { Id } from '../convex/_generated/dataModel';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { draftSelectionsFrom } from '../shared/evaluate/draft.ts';
import type { EvaluationInput } from '../shared/contracts/characterEvaluation';
import type { DecisionDefinitions } from '../shared/evaluate/definitions';
import { setTimeout as sleep } from 'node:timers/promises';
import { definitions as allDefinitions } from '../shared/content/level-one-decisions.ts';
import reference from '../tests/fixtures/v25-bethell.json' with { type: 'json' };
import manifest from '../shared/content/compendium/manifest.json' with { type: 'json' };

// Public JSON readbacks are deliberately retained verbatim for independent evidence review.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const exec = promisify(execFile);
const tokens = new WeakMap<ConvexHttpClient, string>();
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
function checkTarget() {
  assert.equal(process.env.SALIENT_V72_HEADLESS, '1');
  const source = JSON.parse(readFileSync('/runtime-source.json', 'utf8'));
  assert.equal(source.checkout, '/srv/presidium/projects/salient/code/.worktrees/engine-live');
  assert.equal(source.identity, createHash('sha256').update(source.checkout).digest('hex'));
  assert.match(source.commit, /^[a-f0-9]{40}$/);
  assert.equal(typeof source.dirty, 'boolean');
  assert.equal(
    process.env.DEV_WEB_URL,
    'https://salient-engine-live-dev-fcf42d994212.tail41404c.ts.net',
  );
  assert.equal(process.env.VITE_SITE_URL, process.env.DEV_WEB_URL);
  assert.equal(process.env.VITE_CONVEX_URL, 'http://backend:3210');
  assert.equal(process.env.VITE_CONVEX_SITE_URL, 'http://backend:3211');
  const env = parseEnv(readFileSync('.env.local', 'utf8'));
  assert.match(env.CONVEX_DEPLOYMENT ?? '', /^anonymous:anonymous-[a-z0-9-]+$/);
  for (const key of [
    'CONVEX_DEPLOYMENT',
    'CONVEX_DEPLOY_KEY',
    'CONVEX_DEPLOYMENT_TOKEN',
    'CONVEX_SELF_HOSTED_URL',
    'CONVEX_SELF_HOSTED_ADMIN_KEY',
  ]) {
    assert.ok(process.env[key] === undefined, `Injected ${key} refused`);
    if (key !== 'CONVEX_DEPLOYMENT') assert.ok(env[key] === undefined, `${key} refused`);
  }
  return source;
}
const source = checkTarget();
const helper = JSON.parse(readFileSync('/artifacts/v72-dice/ready.json', 'utf8'));
assert.equal(helper.frontend, process.env.DEV_WEB_URL);
assert.match(helper.id, /^[a-f0-9-]{36}$/);
assert.ok(Date.now() >= helper.startedAt && Date.now() - helper.startedAt < 600_000);
const diceDirectory = `/artifacts/v72-dice/${helper.id}`;
const runId = randomUUID();
const startedAt = new Date().toISOString();
const startedMs = Date.now();
const output = '/artifacts/v72-headless-readback.json';
// Do not overwrite a previous failed or passing proof.
if (existsSync(output))
  renameSync(output, `/artifacts/v72-headless-readback-${runId}-previous.json`);
const records: Json[] = [];
const logins: ReturnType<typeof createAuthClient>[] = [];
let passed = false;
let stage = 'setup';
let operation = 'target-check-complete';
const evidence = () =>
  writeFileSync(
    output,
    JSON.stringify(
      {
        runId,
        startedAt,
        recordedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startedMs,
        source,
        frontend: process.env.DEV_WEB_URL,
        backend: process.env.VITE_CONVEX_URL,
        sourcePin: manifest.compendium.revision,
        scriptSha256: hash('scripts/v72-headless.ts'),
        runtimeHistorySha256: hash('convex/lib/history.ts'),
        runtimeHistoryReadSha256: hash('convex/lib/historyRead.ts'),
        sourceBytes: Object.fromEntries(
          [
            'scripts/v72-headless.ts',
            'scripts/app.ts',
            'shared/resolve/index.ts',
            'shared/content/compendium/manifest.json',
            'shared/content/character-evaluation-examples.json',
            'shared/content/fury-level-one-decisions.json',
            'scripts/v72-dice-import.mjs',
            'convex/abilities.ts',
            'convex/lib/compiledSource.ts',
            'convex/lib/compiledResults.ts',
            'shared/contracts/compiledResult.ts',
            'shared/resolve/compileAbility.ts',
            'shared/resolve/compiledOutcome.ts',
            'convex/lib/abilityOperations.ts',
            'convex/lib/resolve.ts',
            'convex/lib/history.ts',
            'convex/lib/historyRead.ts',
            'convex/lib/historyIndex.ts',
          ].map(path => [path, hash(path)]),
        ),
        method:
          'Real BetterAuth HTTP, scripts/app.ts commands and authenticated public Convex readback; disclosed deterministic diceStates imports preserving unrelated rows; no browser, reset or gameplay row seeding; numeric expectations from V26 ability designs, not the resolver',
        passed,
        stage,
        operation,
        records,
      },
      null,
      2,
    ),
  );
// Generated function references enforce required API arguments before a live run.
const query = <Q extends FunctionReference<'query'>>(
  client: ConvexHttpClient,
  reference: Q,
  args: FunctionArgs<Q>,
): Promise<Json> => {
  operation = `query:${getFunctionName(reference)}`;
  return client.query(reference, args);
};
const mutation = <M extends FunctionReference<'mutation'>>(
  client: ConvexHttpClient,
  reference: M,
  args: FunctionArgs<M>,
): Promise<Json> => {
  operation = `mutation:${getFunctionName(reference)}`;
  return client.mutation(reference, args);
};
async function account(role: string) {
  stage = `register-${role}`;
  const storage = new Map<string, string>();
  const login = createAuthClient({
    baseURL: process.env.VITE_CONVEX_SITE_URL,
    fetchOptions: { headers: { Origin: process.env.DEV_WEB_URL! } },
    plugins: [
      convexClient(),
      crossDomainClient({
        storage: {
          getItem: key => storage.get(key) ?? null,
          setItem: (key, value) => {
            storage.set(key, value);
          },
        },
      }),
    ],
  });
  logins.push(login);
  const registered = await login.signUp.email({
    name: `V72 ${role}`,
    email: `v72-${role}-${runId}@example.test`,
    password: `V72-main-${randomUUID()}`,
  });
  assert.ok(!registered.error, `${role} registration failed`);
  const jwt = await login.convex.token();
  assert.ok(!jwt.error && jwt.data?.token, `${role} token unavailable`);
  const client = new ConvexHttpClient('http://backend:3210', { logger: false });
  client.setAuth(jwt.data.token);
  tokens.set(client, jwt.data.token);
  const profile = await mutation(client, api.auth.ensureProfile, {});
  return { client, profile };
}
function seedFor(a: number, b: number) {
  for (let n = 0; n < 100_000; n++) {
    const seed = createHash('sha256').update(`V72 disposable dice fixture ${n}`).digest();
    const values = [0, 1].map(counter => {
      const input = Buffer.alloc(40);
      seed.copy(input);
      input.writeBigUInt64BE(BigInt(counter), 32);
      return createHash('sha256').update(input).digest().readUInt32BE(0);
    });
    if (values.every((value, i) => value < 4_294_967_290 && (value % 10) + 1 === [a, b][i]))
      return seed.toString('hex');
  }
  throw new Error('No deterministic dice seed');
}
async function dice(campaignId: string, a: number, b: number) {
  checkTarget();
  const id = randomUUID();
  const request = `${diceDirectory}/${id}.request.json`;
  writeFileSync(`${request}.tmp`, JSON.stringify({ campaignId, seed: seedFor(a, b) }));
  renameSync(`${request}.tmp`, request);
  const response = `${diceDirectory}/${id}.response.json`;
  const deadline = Date.now() + 30_000;
  while (!existsSync(response) && Date.now() < deadline) await sleep(100);
  assert.ok(existsSync(response), 'Backend dice helper did not finish');
  assert.equal(JSON.parse(readFileSync(response, 'utf8')).ok, true);
}
try {
  const director = await account('director');
  const player = await account('player');
  const dc = director.client;
  const pc = player.client;
  const content = await query(dc, api.content.status, {});
  assert.equal(content.entryCount, manifest.entryCount);
  assert.equal(content.contentHash, manifest.contentHash);
  assert.equal(content.revision, manifest.compendium.revision);
  stage = 'public-campaign-and-character-setup';
  const campaignId = await mutation(dc, api.campaigns.create, {
    commandId: randomUUID(),
    name: `V72 isolated proof ${runId}`,
  });
  const campaign = await query(dc, api.campaigns.get, { campaignId });
  await mutation(pc, api.campaigns.requestJoin, {
    commandId: randomUUID(),
    shareCode: campaign.shareCode,
  });
  const joined = await query(dc, api.campaigns.get, { campaignId });
  const request = joined.pendingRequests.find((row: Json) => row.userId === player.profile.userId);
  assert.ok(request);
  await mutation(dc, api.campaigns.approveRequest, {
    commandId: randomUUID(),
    requestId: request.id,
  });
  const examples = JSON.parse(
    readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
  ) as { examples: { complete: { input: EvaluationInput } } };
  const definitions = JSON.parse(
    readFileSync('shared/content/fury-level-one-decisions.json', 'utf8'),
  ) as DecisionDefinitions;
  const authored = { name: 'V72 Thorn', appearance: '', biography: '', notes: '' };
  const heroId = await mutation(pc, api.characters.create, { commandId: randomUUID(), authored });
  await mutation(pc, api.characters.save, {
    commandId: randomUUID(),
    characterId: heroId,
    expectedRevision: 1,
    authored,
    selections: draftSelectionsFrom(
      { ...examples.examples.complete.input.selections, 'details.name': authored.name },
      definitions,
    ),
  });
  await mutation(pc, api.characters.submit, {
    commandId: randomUUID(),
    characterId: heroId,
    campaignId,
  });
  await mutation(dc, api.characters.approve, { commandId: randomUUID(), characterId: heroId });
  const catalog = await query(dc, api.foes.catalog, { campaignId });
  assert.equal(catalog.name, 'Goblin Warrior');
  const foeId = await mutation(dc, api.foes.add, {
    commandId: randomUUID(),
    campaignId,
    definitionId: catalog.definitionId,
  });
  await mutation(dc, api.sessions.start, {
    commandId: randomUUID(),
    campaignId,
    selectedPlayerIds: [player.profile.userId],
  });
  const command = async (client: ConvexHttpClient, text: string) => {
    stage = text;
    operation = 'scripts/app.ts command';
    // Exercise the supported CLI itself; keep its authenticated token in the child environment.
    const response = await exec(
      process.execPath,
      ['scripts/app.ts', 'command', text, '--campaign', campaignId, '--command-id', randomUUID()],
      { env: { ...process.env, SALIENT_AUTH_TOKEN: tokens.get(client) }, timeout: 30_000 },
    );
    return JSON.parse(response.stdout);
  };
  const H = `@{character:${heroId}}`;
  const foeIds = [foeId];
  for (let i = 0; i < 2; i++)
    foeIds.push(
      await mutation(dc, api.foes.add, {
        commandId: randomUUID(),
        campaignId,
        definitionId: catalog.definitionId,
      }),
    );
  const G = foeIds.map(id => `@{foe:${id}}`);
  const elementalistAuthored = { name: 'V72 Bethell', appearance: '', biography: '', notes: '' };
  const elementalistId = await mutation(pc, api.characters.create, {
    commandId: randomUUID(),
    authored: elementalistAuthored,
  });
  await mutation(pc, api.characters.save, {
    commandId: randomUUID(),
    characterId: elementalistId,
    expectedRevision: 1,
    authored: elementalistAuthored,
    selections: draftSelectionsFrom(
      { ...reference.selections, 'details.name': elementalistAuthored.name },
      allDefinitions,
    ),
  });
  await mutation(pc, api.characters.submit, {
    commandId: randomUUID(),
    characterId: elementalistId,
    campaignId,
  });
  await mutation(dc, api.characters.approve, {
    commandId: randomUUID(),
    characterId: elementalistId,
  });
  const E = `@{character:${elementalistId}}`;
  records.push({ case: 'setup-identity', campaignId, heroId, elementalistId, foeIds, content });
  evidence();
  await command(dc, '/combat start');
  await command(dc, '/combat commit');
  await command(pc, '/combat roll');
  await command(dc, '/combat first side=heroes');
  const ref = (actor: Json) => `@{${actor.kind}:${actor.id}}`;
  const roster = () => query(dc, api.table.roster, { campaignId });
  const state = async () => {
    const events = (await query(dc, api.events.list, { campaignId })).events;
    return {
      roster: await roster(),
      encounter: await query(dc, api.encounters.current, { campaignId }),
      events,
      results: await query(dc, api.abilities.results, { campaignId }),
    };
  };
  const result = async (eventId: string, client = dc) =>
    (
      await query(client, api.abilities.results, {
        campaignId,
        eventIds: [eventId as Id<'events'>],
      })
    )[0];
  const capture = async (name: string, eventId?: string) => {
    stage = name;
    const observed = await state();
    records.push({
      case: name,
      observed,
      ...(eventId
        ? {
            result: await result(eventId),
            playerResult: await result(eventId, pc),
            playerHistory: await query(pc, api.history.status, { campaignId }),
            directorHistory: await query(dc, api.history.status, { campaignId }),
          }
        : {}),
    });
    evidence();
    return observed;
  };
  const health = (r: Json, id: string) =>
    r.foes.find((f: Json) => f.id === id)?.health.stamina ??
    r.heroes.find((h: Json) => h.id === id)?.live.stamina;
  const conditions = (r: Json) => ({
    heroes: r.heroes.map((h: Json) => [h.id, h.live.conditions]),
    foes: r.foes.map((f: Json) => [f.id, f.conditions]),
  });
  const freshTurn = async (actor: string) => {
    let encounter = await query(dc, api.encounters.current, { campaignId });
    if (encounter.activeTurn) await command(dc, `${ref(encounter.activeTurn.actor)} /turn end`);
    for (let step = 0; step < 40; step++) {
      encounter = await query(dc, api.encounters.current, { campaignId });
      const entries = encounter.groups
        .filter((g: Json) => g.active || (!g.completed && g.side === encounter.activeSide))
        .flatMap((g: Json) => g.entries)
        .filter((e: Json) => !e.spent && !e.slain);
      const entry = entries.find((e: Json) => ref(e.actor) === actor) ?? entries[0];
      assert.ok(entry, 'No eligible turn entry');
      await command(dc, `${ref(entry.actor)} /turn take`);
      if (ref(entry.actor) === actor) return;
      await command(dc, `${ref(entry.actor)} /turn end`);
    }
    throw new Error('Could not reach requested actor turn');
  };
  const reset = async (actor: string, ferocity = 0, malice = 0, temporary = 0) => {
    for (const g of G) await command(dc, `${g} /adjust stamina value=15`);
    await command(dc, `${H} /adjust stamina value=30`);
    await command(dc, `${H} /adjust temporary-stamina value=${temporary}`);
    await freshTurn(actor);
    await command(dc, `${H} /adjust heroic-resource value=${ferocity}`);
    await command(dc, '/adjust malice value=' + malice);
    if (actor === E) await command(dc, `${E} /adjust heroic-resource value=0`);
  };
  const push = (r: Json) => r.compiled.effects.find((o: Json) => o.effect.kind === 'push');
  const checkPush = (r: Json, subtotal: number) => {
    const effect = push(r).effect;
    assert.equal(effect.subtotal, subtotal);
    assert.equal(effect.allowance, undefined);
    assert.equal(effect.stability, 0);
    assert.ok(effect.requirements.some((s: string) => s.endsWith('.traits')));
    assert.ok(effect.requirements.some((s: string) => s.endsWith('.modifiers')));
    assert.ok(effect.manualScope.length > 0);
  };
  const play = async (
    id: string,
    ability: string,
    actor: string,
    targets: string[],
    damage: number[],
    options: {
      faces?: [number, number];
      extra?: string;
      ferocity?: number;
      malice?: number;
      temporary?: number;
      push?: number;
      compiled?: boolean;
    } = {},
  ) => {
    await reset(actor, options.ferocity, options.malice, options.temporary);
    const faces = options.faces ?? [7, 7];
    await dice(campaignId, ...faces);
    const before = await state();
    const used = await command(
      actor.startsWith('@{character:') ? pc : dc,
      `${actor} /ability use ability=${JSON.stringify(ability)} targets=[${targets.join(',')}] ${options.extra ?? ''}`,
    );
    assert.ok(used.eventId);
    const after = await capture(id, used.eventId);
    const r = await result(used.eventId);
    const event = after.events.find((e: Json) => e.id === used.eventId);
    records.push({
      case: `${id}-expectations`,
      expected: { faces, damage, pushSubtotal: options.push, options },
      before,
      event,
    });
    evidence();
    assert.ok(event);
    if (damage.length) {
      assert.equal(event.kind, 'ability.use');
      assert.deepEqual(r.dice, { d10a: faces[0], d10b: faces[1] });
      assert.deepEqual(
        r.targets.map((t: Json) => t.applied.afterImmunity),
        damage,
      );
      for (const t of r.targets) {
        assert.equal(health(after.roster, t.target.id), t.applied.staminaAfter);
        assert.equal(
          t.applied.staminaAfter,
          t.applied.staminaBefore -
            Math.max(0, t.applied.afterImmunity - t.applied.temporaryStaminaBefore),
        );
      }
      if (options.compiled !== false) {
        assert.equal(r.compiled.version, 1);
        assert.equal(r.compiled.inputs, undefined);
        assert.equal(r.compiled.definition.execution, 'supported');
        assert.ok(
          r.compiled.effects.every(
            (o: Json) => o.useEventId === used.eventId && o.revision === r.compiled.revision,
          ),
        );
        if (options.push !== undefined) checkPush(r, options.push);
        else
          assert.equal(r.compiled.effects.filter((o: Json) => o.effect.kind === 'push').length, 0);
      } else {
        assert.equal(r.compiled, undefined);
        assert.equal(r.execution.mode, 'legacy-compatibility');
      }
    } else {
      assert.equal(event.kind, 'ability.recorded');
      assert.equal(r, undefined);
      assert.deepEqual(before.roster, after.roster);
    }
    assert.deepEqual(conditions(before.roster), conditions(after.roster));
    assert.equal(
      after.roster.malice,
      before.roster.malice - (ability === 'Bury the Point' ? 2 : 0),
    );
    for (const old of before.roster.heroes) {
      const next = after.roster.heroes.find((h: Json) => h.id === old.id);
      const cost =
        old.id === heroId
          ? ability === 'Thunder Roar'
            ? 5
            : ability === 'Out of the Way!'
              ? 3
              : 0
          : 0;
      assert.equal(next.live.heroicResource.current, old.live.heroicResource.current - cost);
    }
    return { id: used.eventId as string, r, before, after };
  };
  await play('BS1', 'Brutal Slam', H, [G[0]], [5], { faces: [4, 5], push: 2 });
  const slam = await play('BS2', 'Brutal Slam', H, [G[0]], [8], { push: 3 });
  const correct = (client: ConvexHttpClient, eventId: string, target: string, banes: number) =>
    command(
      client,
      `/ability correct event=${JSON.stringify(eventId)} target=${target} edges=0 banes=${banes}`,
    );
  const resolve = (client: ConvexHttpClient, eventId: string, target: string, occurrence: string) =>
    command(
      client,
      `/ability resolved event=${JSON.stringify(eventId)} target=${target} occurrence=${JSON.stringify(occurrence)}`,
    );
  await correct(pc, slam.id, G[0], 1);
  const once = await result(slam.id);
  await capture('BS7-one-bane', slam.id);
  checkPush(once, 3);
  assert.deepEqual(once.dice, { d10a: 7, d10b: 7 });
  assert.equal(health(await roster(), foeId), 7);
  await correct(pc, slam.id, G[0], 2);
  const twice = await result(slam.id);
  await capture('BS7-two-banes', slam.id);
  checkPush(twice, 2);
  assert.deepEqual(twice.dice, once.dice);
  assert.equal(health(await roster(), foeId), 10);
  assert.notEqual(push(twice).id, push(once).id);
  await assert.rejects(() => resolve(dc, slam.id, G[0], push(once).id));
  await command(pc, '/history undo');
  assert.deepEqual((await result(slam.id)).compiled, once.compiled);
  assert.equal(health(await roster(), foeId), 7);
  await capture('BS7-undo', slam.id);
  await command(pc, '/history redo');
  assert.deepEqual((await result(slam.id)).compiled, twice.compiled);
  assert.equal(health(await roster(), foeId), 10);
  await capture('BS7-redo', slam.id);
  await correct(dc, slam.id, G[0], 0);
  const directed = await result(slam.id);
  checkPush(directed, 3);
  await assert.rejects(() => correct(pc, slam.id, G[0], 1));
  await assert.rejects(() => resolve(pc, slam.id, G[0], push(directed).id));
  await assert.rejects(() => resolve(dc, slam.id, G[1], push(directed).id));
  const beforeDisposition = await state();
  await resolve(dc, slam.id, G[0], push(directed).id);
  const disposed = await result(slam.id);
  assert.ok(push(disposed).disposition?.eventId);
  assert.deepEqual((await state()).roster, beforeDisposition.roster);
  await capture('BS8-disposition', slam.id);
  await assert.rejects(() => resolve(dc, slam.id, G[0], push(directed).id));
  await assert.rejects(() => correct(dc, slam.id, G[0], 1));
  await command(dc, '/history rewind');
  assert.deepEqual((await result(slam.id)).compiled, directed.compiled);
  await command(dc, '/history redo');
  assert.deepEqual((await result(slam.id)).compiled, disposed.compiled);
  assert.equal(health(await roster(), foeId), 7);
  await capture('BS8-restored', slam.id);
  await command(dc, '/history rewind');
  await command(pc, `${H} /turn end`);
  await assert.rejects(() => resolve(dc, slam.id, G[0], push(directed).id));
  await assert.rejects(() => correct(dc, slam.id, G[0], 1));
  await capture('BS8-unrelated-boundary', slam.id);
  await play('BS3', 'Brutal Slam', H, [G[0]], [15], { faces: [8, 7], push: 5 });
  assert.equal((await roster()).foes.find((f: Json) => f.id === foeId).slain, true);
  await command(dc, `${G[0]} /condition on name=restrained`);
  const conditioned = await play('BS6', 'Brutal Slam', H, [G[0]], [8], { push: 3 });
  assert.equal(push(conditioned.r).effect.status, 'manual');
  assert.ok(push(conditioned.r).effect.manualReasons.some((s: string) => s.includes('restrained')));
  await command(dc, `${G[0]} /condition off name=restrained`);
  await play('SC1', 'Spear Charge', G[0], [H], [3], { faces: [4, 5] });
  const spear = await play('SC2', 'Spear Charge', G[0], [H], [4]);
  const publicSpear = await result(spear.id, pc);
  assert.doesNotMatch(JSON.stringify(publicSpear.compiled), /Crafty|Bury the Point|parentContext/);
  await play('SC3', 'Spear Charge', G[0], [H], [5], { faces: [8, 7] });
  await play('SC4', 'Spear Charge', G[0], [H], [4], { temporary: 3 });
  assert.equal(health(await roster(), heroId), 29);
  assert.equal((await roster()).heroes.find((h: Json) => h.id === heroId).live.temporaryStamina, 0);
  const bury = await play('BP2', 'Bury the Point', G[0], [H], [6], { malice: 2 });
  const remainder = bury.r.compiled.effects.find((o: Json) => o.effect.kind === 'unsupported');
  assert.match(remainder.effect.clause, /M < 1/);
  assert.match(remainder.effect.clause, /bleeding/);
  await correct(dc, bury.id, H, 2);
  const correctedBury = await result(bury.id);
  const correctedRemainder = correctedBury.compiled.effects.find(
    (o: Json) => o.effect.kind === 'unsupported',
  );
  assert.match(correctedRemainder.effect.clause, /M < 0/);
  assert.notEqual(correctedRemainder.id, remainder.id);
  assert.equal(health(await roster(), heroId), 25);
  assert.equal((await roster()).malice, 0);
  await assert.rejects(() => resolve(dc, bury.id, H, remainder.id));
  await command(dc, '/history rewind');
  assert.deepEqual((await result(bury.id)).compiled, bury.r.compiled);
  const beforeBuryDisposition = await roster();
  await resolve(dc, bury.id, H, remainder.id);
  assert.deepEqual(await roster(), beforeBuryDisposition);
  await capture('BP5-disposition-after-correction-rewind', bury.id);
  const block = async (
    id: string,
    ability: string,
    actor: string,
    targets: string[],
    ferocity: number,
    malice: number,
  ) => {
    await reset(actor, ferocity, malice);
    const before = await state();
    const response = await command(
      dc,
      `${actor} /ability use ability=${JSON.stringify(ability)} targets=[${targets.join(',')}]`,
    );
    const after = await capture(id);
    const event = after.events.find((e: Json) => e.id === response.eventId);
    assert.equal(event.kind, 'ability.blocked');
    assert.deepEqual(event.dice ?? [], []);
    assert.deepEqual(after.roster, before.roster);
    assert.deepEqual(after.encounter, before.encounter);
    assert.deepEqual(after.results, before.results);
  };
  await block('BP4', 'Bury the Point', G[0], [H], 0, 1);
  await play('MF3', 'Melee Weapon Free Strike', H, [G[0]], [13], {
    faces: [8, 7],
    extra: 'characteristic=A damage-characteristic=M',
  });
  await play('RF3', 'Ranged Weapon Free Strike', H, [G[0]], [8], {
    faces: [8, 7],
    extra: 'characteristic=M damage-characteristic=A',
  });
  records.push({
    case: 'PP3-history-assumption',
    note: 'Selected target G2 has not damaged H; prior attacking foe was G1.',
  });
  await play('PP3', 'Pain for Pain', H, [G[1]], [15], { faces: [8, 7], compiled: false });
  await play('OW2', 'Out of the Way!', H, [G[0]], [7], { ferocity: 3, compiled: false });
  await block('OW-insufficient', 'Out of the Way!', H, [G[0]], 2, 0);
  await play('TR1', 'Thunder Roar', H, G, [17, 6, 9], {
    faces: [7, 6],
    ferocity: 6,
    extra: 'edges=[1,0,0] banes=[0,2,0]',
    compiled: false,
  });
  await block('TR-insufficient', 'Thunder Roar', H, G, 4, 0);
  await play('LF1', 'Lines of Force', H, [H], [], { ferocity: 1, compiled: false });
  const fire = await play('VF2', 'Viscous Fire', E, [G[0]], [9], { push: 3 });
  assert.equal(push(fire.r).effect.sizeBonus, 0);
  assert.equal(health(await roster(), foeId), 6);
  records.push({
    case: 'scope',
    pureOnly: ['BS4 same-size/stability', 'BS5 missing precise size', 'VF immunity fixture'],
    compileOnly: [
      'Meteoric Introduction',
      'Ray of Agonizing Self-Reflection',
      'Ghoul Razor Claws',
      'Worg Bite',
    ],
    browser: 'paused; CLI/API proof only',
  });
  passed = true;
  stage = 'complete';
} catch (error) {
  process.exitCode = 1;
  // Assertion messages contain only our public data expectations; never serialize transport errors.
  if (error instanceof assert.AssertionError)
    records.push({ case: 'assertion-failure', message: error.message });
  console.error(`V72 headless proof failed at ${stage}; inspect sanitized readback`);
} finally {
  writeFileSync(`${diceDirectory}/done`, 'done');
  for (const login of logins) {
    try {
      const result = await login.signOut();
      assert.ok(!result.error);
    } catch {
      passed = false;
      process.exitCode = 1;
      records.push({ case: 'session-cleanup', passed: false });
    }
  }
  evidence();
}
