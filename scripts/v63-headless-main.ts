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
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { parseTierText, resolveAbilityRoll } from '../shared/resolve/index.ts';
import type { AbilityRollInput } from '../shared/resolve/index.ts';
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
  assert.equal(process.env.SALIENT_V63_MAIN_HEADLESS, '1');
  const source = JSON.parse(readFileSync('/runtime-source.json', 'utf8'));
  assert.equal(source.checkout, '/srv/presidium/projects/salient/code');
  assert.equal(source.identity, createHash('sha256').update(source.checkout).digest('hex'));
  assert.match(source.commit, /^[a-f0-9]{40}$/);
  assert.equal(typeof source.dirty, 'boolean');
  assert.equal(process.env.DEV_WEB_URL, 'https://salient-dev-fc4f48cb09a0.tail41404c.ts.net');
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
const runId = randomUUID();
const startedAt = new Date().toISOString();
const startedMs = Date.now();
const output = '/artifacts/v63-headless-main-readback.json';
// Do not overwrite a previous failed or passing proof.
if (existsSync(output))
  renameSync(output, `/artifacts/v63-headless-main-readback-${runId}-previous.json`);
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
        scriptSha256: hash('scripts/v63-headless-main.ts'),
        runtimeHistorySha256: hash('convex/lib/history.ts'),
        runtimeHistoryReadSha256: hash('convex/lib/historyRead.ts'),
        sourceBytes: Object.fromEntries(
          [
            'scripts/v63-headless-main.ts',
            'scripts/app.ts',
            'shared/resolve/index.ts',
            'shared/content/compendium/manifest.json',
            'shared/content/character-evaluation-examples.json',
            'shared/content/fury-level-one-decisions.json',
            'convex/abilities.ts',
            'convex/lib/abilityOperations.ts',
            'convex/lib/resolve.ts',
            'convex/lib/history.ts',
            'convex/lib/historyRead.ts',
            'convex/lib/historyIndex.ts',
          ].map(path => [path, hash(path)]),
        ),
        method:
          'Real BetterAuth HTTP, scripts/app.ts commands and authenticated public Convex readback; real random accepted dice; no browser, database import, reset or gameplay row seeding',
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
    name: `V63 ${role}`,
    email: `v63-${role}-${runId}@example.test`,
    password: `V63-main-${randomUUID()}`,
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
    name: `V63 main proof ${runId}`,
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
  const authored = { name: 'V63 Thorn', appearance: '', biography: '', notes: '' };
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
  const G = `@{foe:${foeId}}`;
  await command(dc, `${H} /adjust stamina value=30`);
  await command(dc, '/combat start');
  await command(dc, '/combat commit');
  await command(pc, '/combat roll');
  await command(dc, '/combat first side=heroes');
  await command(pc, `${H} /turn take`);
  stage = 'pre-use-facts';
  records.push({ case: 'setup-identity', campaignId, heroId, foeId });
  evidence();
  const before = await query(dc, api.table.roster, { campaignId });
  const character = await query(pc, api.characters.get, { characterId: heroId });
  const sheet = await query(pc, api.abilities.sheet, {
    campaignId,
    actor: { kind: 'character', id: heroId, name: authored.name },
  });
  const ability = sheet.abilities.find((row: Json) => row.name === 'Brutal Slam');
  assert.ok(ability && ability.kind === 'rolled');
  // A signature ability is affordable for every random starting resource pool.
  assert.equal(ability.fixedCost, null);
  assert.equal(ability.unknownCost, null);
  assert.equal(ability.tiers.length, 3);
  const baseline = character.derivedBaseline;
  const health = before.foes.find((foe: Json) => foe.id === foeId).health;
  assert.equal(health.mode, 'director');
  const inputs: Omit<AbilityRollInput, 'dice' | 'targets'> = {
    ability: {
      abilityId: ability.id,
      name: ability.name,
      source: {
        path: ability.sourcePath,
        revision: manifest.compendium.revision,
        id: ability.contentId,
      },
      actionType: ability.actionType,
      keywords: ability.keywords,
      permittedCharacteristics: ability.permittedCharacteristics,
      tiers: ability.tiers.map((text: string) =>
        parseTierText(text),
      ) as AbilityRollInput['ability']['tiers'],
      kitBonusesIncluded: false,
    },
    actor: {
      actorId: heroId,
      characteristics: Object.fromEntries(
        Object.entries(baseline.characteristics).map(([key, fact]) => [key, (fact as Json).value]),
      ) as AbilityRollInput['actor']['characteristics'],
      ...(baseline.kit
        ? {
            kitMeleeDamageBonus: baseline.kit.meleeDamageBonus.value,
            kitRangedDamageBonus: baseline.kit.rangedDamageBonus.value,
          }
        : {}),
      abilityDamageModifiers: (baseline.abilityModifiers ?? []).map((modifier: Json) => ({
        label: modifier.label ?? modifier.id,
        amount: modifier.amount,
        keywords: modifier.keywords,
        ...(modifier.alternative ? { alternative: modifier.alternative } : {}),
      })),
    },
    targetFacts: [
      {
        targetId: foeId,
        kind: 'foe',
        stamina: health.stamina,
        maxStamina: health.maxStamina,
        temporaryStamina: health.temporaryStamina,
      },
    ],
    inCombat: true,
  };
  records.push({ case: 'setup', campaignId, heroId, foeId, content, before, inputs });
  evidence();
  const used = await command(pc, `${H} /ability use ability="Brutal Slam" targets=[${G}]`);
  const eventId = used.eventId;
  assert.ok(eventId);
  const result = async (client: ConvexHttpClient) =>
    (await query(client, api.abilities.results, { campaignId, eventIds: [eventId] }))[0];
  const first = await result(dc);
  assert.ok(first);
  const dice = first.dice;
  for (const value of [dice.d10a, dice.d10b]) {
    assert.ok(Number.isInteger(value) && value >= 1 && value <= 10);
  }
  // Recompute from pre-use public facts and the first accepted roll, never corrected outputs.
  // This proves persistence/history parity with R04; it is not independent rules verification.
  const expected = (banes: number) => {
    const resolved = resolveAbilityRoll({
      ...inputs,
      dice,
      targets: [{ targetId: foeId, edges: 0, banes }],
    });
    assert.equal(resolved.kind, 'resolved');
    if (resolved.kind !== 'resolved') throw new Error('Signature ability unexpectedly blocked');
    assert.equal(resolved.cost, undefined);
    assert.equal(resolved.damageApplications.length, 1);
    return resolved;
  };
  const capture = async (
    name: string,
    banes: number,
    playerCorrect: boolean,
    directorCorrect: boolean,
    manual: boolean,
    correctionIds: string[],
  ) => {
    stage = name;
    const roster = await query(dc, api.table.roster, { campaignId });
    const playerResult = await result(pc);
    const directorResult = await result(dc);
    const playerHistory = await query(pc, api.history.status, { campaignId });
    const directorHistory = await query(dc, api.history.status, { campaignId });
    const events = (await query(dc, api.events.list, { campaignId })).events;
    const calculation = expected(banes);
    records.push({
      case: name,
      recordedAt: new Date().toISOString(),
      roster,
      playerResult,
      directorResult,
      playerHistory,
      directorHistory,
      events,
      expected: calculation,
    });
    evidence();
    const applied = calculation.damageApplications[0]!;
    const foe = roster.foes.find((row: Json) => row.id === foeId);
    assert.equal(foe.health.stamina, applied.staminaAfter);
    assert.equal(foe.health.temporaryStamina, applied.temporaryStaminaAfter);
    assert.equal(foe.slain, applied.slain);
    // Starting Ferocity can be random; this cost-free correction chain must preserve it.
    assert.deepEqual(
      roster.heroes.find((row: Json) => row.id === heroId).live,
      before.heroes.find((row: Json) => row.id === heroId).live,
    );
    assert.equal(playerResult.mayCorrect, playerCorrect);
    assert.equal(directorResult.mayCorrect, directorCorrect);
    assert.equal(playerResult.mayResolve, false);
    assert.equal(directorResult.mayResolve, manual);
    for (const effective of [playerResult, directorResult]) {
      assert.deepEqual(effective.dice, dice);
      assert.deepEqual(effective.correctionEventIds, correctionIds);
      assert.equal(effective.targets[0].edges, 0);
      assert.equal(effective.targets[0].banes, banes);
      assert.deepEqual(effective.targets[0].outcome, calculation.targets[0]);
    }
    assert.deepEqual(directorResult.targets[0].applied, applied);
    const original = events.find((event: Json) => event.id === eventId);
    assert.equal(original.kind, 'ability.use');
    assert.deepEqual(
      original.dice.map((die: Json) => die.value),
      [dice.d10a, dice.d10b],
    );
    for (const id of correctionIds) {
      const linked = events.find((event: Json) => event.id === id);
      assert.equal(linked.kind, 'correction.ability');
      assert.equal(linked.causeEventId, eventId);
      assert.equal(linked.payload.data.originalEventId, eventId);
      assert.notEqual(linked.disposition, 'undone');
    }
    return { result: directorResult, playerHistory, directorHistory, events };
  };
  const correct = (client: ConvexHttpClient, banes: number) =>
    command(client, `/ability correct event="${eventId}" target=${G} edges=0 banes=${banes}`);
  await capture('initial-slam', 0, true, true, true, []);
  const correction1 = await correct(pc, 1);
  assert.ok(correction1.eventId);
  const once = await capture('player-first-correction', 1, true, true, true, [correction1.eventId]);
  assert.equal(once.playerHistory.undo.target.eventId, correction1.eventId);
  const correction2 = await correct(pc, 2);
  assert.ok(correction2.eventId);
  const linkedIds = [correction1.eventId, correction2.eventId];
  const twice = await capture('player-second-correction', 2, true, true, true, linkedIds);
  assert.equal(twice.playerHistory.undo.target.eventId, correction2.eventId);
  await command(pc, '/history undo');
  const undone = await capture('player-undo', 1, true, true, true, [correction1.eventId]);
  assert.equal(undone.playerHistory.redo.available, true);
  assert.equal(undone.playerHistory.redo.target.eventId, correction2.eventId);
  assert.equal(
    undone.events.find((event: Json) => event.id === correction2.eventId).disposition,
    'undone',
  );
  await command(pc, '/history redo');
  const redone = await capture('player-redo', 2, true, true, true, linkedIds);
  assert.equal(redone.playerHistory.undo.target.eventId, correction2.eventId);
  const directorCorrection = await correct(dc, 0);
  assert.ok(directorCorrection.eventId);
  const allIds = [...linkedIds, directorCorrection.eventId];
  const directed = await capture('director-correction', 0, false, true, true, allIds);
  assert.equal(directed.playerHistory.undo.available, false);
  assert.equal(directed.directorHistory.undo.target.eventId, directorCorrection.eventId);
  await assert.rejects(() => correct(pc, 1), /Director/);
  await capture('player-denied-after-director', 0, false, true, true, allIds);
  const clause = directed.result.targets[0].outcome.unresolvedClauses[0];
  assert.equal(typeof clause, 'string');
  const disposition = await command(
    dc,
    `/ability resolved event="${eventId}" target=${G} clause=${JSON.stringify(clause)}`,
  );
  const resolved = await capture('manual-disposition', 0, false, false, true, allIds);
  assert.equal(resolved.result.targets[0].dispositions.length, 1);
  assert.equal(resolved.result.targets[0].dispositions[0].eventId, disposition.eventId);
  assert.equal(resolved.result.targets[0].dispositions[0].clause, clause);
  assert.equal(resolved.directorHistory.undo.target.eventId, disposition.eventId);
  await assert.rejects(() => correct(dc, 1), /rewind/);
  await capture('director-denied-after-disposition', 0, false, false, true, allIds);
  await command(dc, '/history rewind');
  const restored = await capture('rewind-disposition', 0, false, true, true, allIds);
  assert.equal(restored.result.targets[0].dispositions.length, 0);
  await command(pc, `${H} /turn end`);
  await capture('unrelated-turn-end', 0, false, false, false, allIds);
  await assert.rejects(() => correct(dc, 1), /rewind/);
  await capture('director-denied-after-turn-end', 0, false, false, false, allIds);
  passed = true;
  stage = 'complete';
} catch {
  // Persist the failure stage/readbacks without serializing auth or transport exceptions.
  process.exitCode = 1;
  console.error(`V63 headless proof failed at ${stage}; inspect sanitized readback`);
} finally {
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
