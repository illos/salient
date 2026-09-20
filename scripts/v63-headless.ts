// SPDX-License-Identifier: GPL-3.0-only
// Opt-in real HTTP correction proof. No browser, mock backend or fabricated gameplay rows.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseEnv } from 'node:util';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { draftSelectionsFrom } from '../shared/evaluate/draft.ts';
import type { EvaluationInput } from '../shared/contracts/characterEvaluation';
import type { DecisionDefinitions } from '../shared/evaluate/definitions';
import manifest from '../shared/content/compendium/manifest.json' with { type: 'json' };

// Public JSON readbacks are deliberately retained verbatim for independent evidence review.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const exec = promisify(execFile);
const tokens = new WeakMap<ConvexHttpClient, string>();
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
function checkTarget() {
  assert.equal(process.env.SALIENT_V63_HEADLESS, '1');
  const source = JSON.parse(readFileSync('/runtime-source.json', 'utf8'));
  assert.equal(
    source.checkout,
    '/srv/presidium/projects/salient/code/.worktrees/engine-corrections',
  );
  assert.equal(source.identity, createHash('sha256').update(source.checkout).digest('hex'));
  assert.match(source.commit, /^[a-f0-9]{40}$/);
  assert.equal(typeof source.dirty, 'boolean');
  assert.match(
    process.env.DEV_WEB_URL ?? '',
    /^https:\/\/salient-engine-corrections-dev-[a-f0-9]{12}\.tail41404c\.ts\.net$/,
  );
  assert.equal(process.env.SALIENT_V26_RUNTIME_URL, process.env.DEV_WEB_URL);
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
const helper = JSON.parse(readFileSync('/artifacts/v26-dice/ready.json', 'utf8'));
assert.equal(helper.frontend, process.env.DEV_WEB_URL);
assert.match(helper.id, /^[a-f0-9-]{36}$/);
assert.ok(
  Number.isFinite(helper.startedAt) &&
    Date.now() >= helper.startedAt &&
    Date.now() - helper.startedAt < 600_000,
);
const diceDirectory = `/artifacts/v26-dice/${helper.id}`;
const runId = randomUUID();
const output = '/artifacts/v63-headless-readback.json';
// Do not overwrite a previous failed or passing proof.
if (existsSync(output))
  renameSync(output, `/artifacts/v63-headless-readback-${runId}-previous.json`);
const records: Json[] = [];
const logins: ReturnType<typeof createAuthClient>[] = [];
let passed = false;
let stage = 'setup';
const evidence = () =>
  writeFileSync(
    output,
    JSON.stringify(
      {
        runId,
        source,
        frontend: process.env.DEV_WEB_URL,
        backend: process.env.VITE_CONVEX_URL,
        sourcePin: manifest.compendium.revision,
        scriptSha256: hash('scripts/v63-headless.ts'),
        runtimeHistorySha256: hash('convex/lib/history.ts'),
        runtimeHistoryReadSha256: hash('convex/lib/historyRead.ts'),
        diceHelperSha256: hash('tests/browser/v26-dice-import.mjs'),
        method:
          'Real BetterAuth HTTP, scripts/app.ts commands and authenticated public Convex readback; one disclosed deterministic diceStates import in the existing backend; no browser or gameplay row seeding',
        passed,
        stage,
        records,
      },
      null,
      2,
    ),
  );
const query = (client: ConvexHttpClient, name: string, args: Json = {}): Promise<Json> =>
  client.query(makeFunctionReference<'query'>(name), args);
const mutation = (client: ConvexHttpClient, name: string, args: Json = {}): Promise<Json> =>
  client.mutation(makeFunctionReference<'mutation'>(name), args);
async function account(role: string) {
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
    name: `V63 ${role}`,
    email: `v63-${role}-${runId}@example.test`,
    password: `V63-isolated-${randomUUID()}`,
  });
  assert.ok(!registered.error, `${role} registration failed`);
  const jwt = await login.convex.token();
  assert.ok(!jwt.error && jwt.data?.token, `${role} token unavailable`);
  const client = new ConvexHttpClient('http://backend:3210', { logger: false });
  client.setAuth(jwt.data.token);
  tokens.set(client, jwt.data.token);
  const profile = await mutation(client, 'auth:ensureProfile');
  return { client, profile };
}
function seedFor() {
  for (let n = 0; n < 100_000; n++) {
    const seed = createHash('sha256').update(`V26 disposable dice fixture ${n}`).digest();
    const values = [0, 1].map(counter => {
      const input = Buffer.alloc(40);
      seed.copy(input);
      input.writeBigUInt64BE(BigInt(counter), 32);
      return createHash('sha256').update(input).digest().readUInt32BE(0);
    });
    if (values.every(value => value < 4_294_967_290 && value % 10 === 6))
      return seed.toString('hex');
  }
  throw new Error('No deterministic 7,7 dice seed');
}
async function dice(campaignId: string) {
  checkTarget();
  const id = randomUUID();
  const request = `${diceDirectory}/${id}.request.json`;
  writeFileSync(`${request}.tmp`, JSON.stringify({ campaignId, seed: seedFor() }));
  renameSync(`${request}.tmp`, request);
  const response = `${diceDirectory}/${id}.response.json`;
  const deadline = Date.now() + 15_000;
  while (!existsSync(response) && Date.now() < deadline) await sleep(100);
  assert.ok(existsSync(response), 'Backend dice helper did not finish');
  assert.deepEqual(JSON.parse(readFileSync(response, 'utf8')), { ok: true });
}
try {
  const director = await account('director');
  const player = await account('player');
  const dc = director.client;
  const pc = player.client;
  const content = await query(dc, 'content:status');
  assert.equal(content.entryCount, manifest.entryCount);
  assert.equal(content.contentHash, manifest.contentHash);
  assert.equal(content.revision, manifest.compendium.revision);
  const campaignId = await mutation(dc, 'campaigns:create', {
    commandId: randomUUID(),
    name: `V63 proof ${runId}`,
  });
  const campaign = await query(dc, 'campaigns:get', { campaignId });
  await mutation(pc, 'campaigns:requestJoin', {
    commandId: randomUUID(),
    shareCode: campaign.shareCode,
  });
  const joined = await query(dc, 'campaigns:get', { campaignId });
  const request = joined.pendingRequests.find((row: Json) => row.userId === player.profile.userId);
  assert.ok(request);
  await mutation(dc, 'campaigns:approveRequest', {
    commandId: randomUUID(),
    requestId: request.id,
  });
  const examples = JSON.parse(
    readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
  ) as { examples: { complete: { input: EvaluationInput } } };
  const definitions = JSON.parse(
    readFileSync('shared/content/fury-level-one-decisions.json', 'utf8'),
  ) as DecisionDefinitions;
  const authored = { name: 'V63 Thorn', appearance: '', biography: '', notes: '' };
  const heroId = await mutation(pc, 'characters:create', { commandId: randomUUID(), authored });
  await mutation(pc, 'characters:save', {
    commandId: randomUUID(),
    characterId: heroId,
    expectedRevision: 1,
    authored,
    selections: draftSelectionsFrom(
      { ...examples.examples.complete.input.selections, 'details.name': authored.name },
      definitions,
    ),
  });
  await mutation(pc, 'characters:submit', {
    commandId: randomUUID(),
    characterId: heroId,
    campaignId,
  });
  await mutation(dc, 'characters:approve', { commandId: randomUUID(), characterId: heroId });
  const catalog = await query(dc, 'foes:catalog', { campaignId });
  assert.equal(catalog.name, 'Goblin Warrior');
  const foeId = await mutation(dc, 'foes:add', {
    commandId: randomUUID(),
    campaignId,
    definitionId: catalog.definitionId,
  });
  await mutation(dc, 'sessions:start', {
    commandId: randomUUID(),
    campaignId,
    selectedPlayerIds: [player.profile.userId],
  });
  const command = async (client: ConvexHttpClient, text: string) => {
    stage = text;
    // Exercise the supported CLI itself; keep its authenticated token in the child environment.
    const response = await exec(
      process.execPath,
      ['scripts/app.ts', 'command', text, '--campaign', campaignId, '--command-id', randomUUID()],
      { env: { ...process.env, SALIENT_AUTH_TOKEN: tokens.get(client) } },
    );
    return JSON.parse(response.stdout);
  };
  const H = `@{character:${heroId}}`;
  const G = `@{foe:${foeId}}`;
  await command(dc, `${H} /adjust stamina value=30`);
  await command(dc, '/combat start');
  await command(dc, '/combat commit');
  await command(pc, '/combat roll');
  await command(dc, '/combat first side=heroes');
  await command(pc, `${H} /turn take`);
  await dice(campaignId);
  records.push({
    case: 'setup',
    campaignId,
    heroId,
    foeId,
    content,
    before: await query(dc, 'table:roster', { campaignId }),
    dice: [7, 7],
  });
  const used = await command(pc, `${H} /ability use ability="Brutal Slam" targets=[${G}]`);
  const eventId = used.eventId;
  assert.ok(eventId);
  const result = async (client: ConvexHttpClient) =>
    (await query(client, 'abilities:results', { campaignId, eventIds: [eventId] }))[0];
  const capture = async (
    name: string,
    stamina: number,
    playerCorrect: boolean,
    directorCorrect: boolean,
    manual: boolean,
  ) => {
    stage = name;
    const roster = await query(dc, 'table:roster', { campaignId });
    const playerResult = await result(pc);
    const directorResult = await result(dc);
    const playerHistory = await query(pc, 'history:status', { campaignId });
    const directorHistory = await query(dc, 'history:status', { campaignId });
    records.push({
      case: name,
      roster,
      playerResult,
      directorResult,
      playerHistory,
      directorHistory,
      events: (await query(dc, 'events:list', { campaignId })).events,
    });
    evidence();
    assert.equal(roster.foes.find((foe: Json) => foe.id === foeId).health.stamina, stamina);
    assert.equal(playerResult.mayCorrect, playerCorrect);
    assert.equal(directorResult.mayCorrect, directorCorrect);
    assert.equal(directorResult.mayResolve, manual);
    assert.deepEqual(directorResult.dice, { d10a: 7, d10b: 7 });
    return directorResult;
  };
  const correct = (client: ConvexHttpClient, banes: number) =>
    command(client, `/ability correct event="${eventId}" target=${G} edges=0 banes=${banes}`);
  await capture('initial-slam', 7, true, true, true);
  await correct(pc, 1);
  await capture('player-first-correction', 7, true, true, true);
  await correct(pc, 2);
  const twice = await capture('player-second-correction', 10, true, true, true);
  assert.equal(twice.correctionEventIds.length, 2);
  await command(pc, '/history undo');
  await capture('player-undo', 7, true, true, true);
  await command(pc, '/history redo');
  await capture('player-redo', 10, true, true, true);
  const clause = twice.targets[0].outcome.unresolvedClauses[0];
  assert.equal(typeof clause, 'string');
  await command(
    dc,
    `/ability resolved event="${eventId}" target=${G} clause=${JSON.stringify(clause)}`,
  );
  const resolved = await capture('manual-disposition', 10, false, false, true);
  assert.equal(resolved.targets[0].dispositions.length, 1);
  await assert.rejects(() => correct(dc, 0), /rewind/);
  await command(dc, '/history rewind');
  const restored = await capture('rewind-disposition', 10, true, true, true);
  assert.equal(restored.targets[0].dispositions.length, 0);
  await correct(dc, 0);
  await capture('director-correction', 7, false, true, true);
  await assert.rejects(() => correct(pc, 1), /Director/);
  await capture('player-denied-after-director', 7, false, true, true);
  await command(pc, `${H} /turn end`);
  await capture('unrelated-turn-end', 7, false, false, false);
  await assert.rejects(() => correct(dc, 1), /rewind/);
  await capture('director-denied-after-turn-end', 7, false, false, false);
  passed = true;
  stage = 'complete';
} catch {
  // Persist the failure stage/readbacks without serializing auth or transport exceptions.
  process.exitCode = 1;
  console.error(`V63 headless proof failed at ${stage}; inspect sanitized readback`);
} finally {
  writeFileSync(`${diceDirectory}/done`, runId);
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
