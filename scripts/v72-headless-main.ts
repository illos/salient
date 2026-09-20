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
import { draftSelectionsFrom } from '../shared/evaluate/draft.ts';
import type { DerivedBaseline, EvaluationInput } from '../shared/contracts/characterEvaluation';
import type { DecisionDefinitions } from '../shared/evaluate/definitions';
import manifest from '../shared/content/compendium/manifest.json' with { type: 'json' };

// Public JSON readbacks are deliberately retained verbatim for independent evidence review.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const exec = promisify(execFile);
const tokens = new WeakMap<ConvexHttpClient, string>();
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
function checkTarget() {
  assert.equal(process.env.SALIENT_V72_MAIN_HEADLESS, '1');
  const source = JSON.parse(readFileSync('/runtime-source.json', 'utf8'));
  const target = process.env.SALIENT_V72_TARGET;
  assert.ok(
    target === 'main' || target === 'engine-live',
    'Explicit main or engine-live target required',
  );
  const targets = {
    main: {
      checkout: '/srv/presidium/projects/salient/code',
      url: 'https://salient-dev-fc4f48cb09a0.tail41404c.ts.net',
    },
    'engine-live': {
      checkout: '/srv/presidium/projects/salient/code/.worktrees/engine-live',
      url: 'https://salient-engine-live-dev-fcf42d994212.tail41404c.ts.net',
    },
  };
  assert.equal(source.checkout, targets[target].checkout);
  assert.equal(process.env.DEV_WEB_URL, targets[target].url);
  assert.equal(source.identity, createHash('sha256').update(source.checkout).digest('hex'));
  assert.match(source.commit, /^[a-f0-9]{40}$/);
  assert.equal(typeof source.dirty, 'boolean');
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
const output = '/artifacts/v72-headless-main-readback.json';
// Do not overwrite a previous failed or passing proof.
if (existsSync(output))
  renameSync(output, `/artifacts/v72-headless-main-readback-${runId}-previous.json`);
const records: Json[] = [];
const logins: ReturnType<typeof createAuthClient>[] = [];
let passed = false;
let stage = 'setup';
let operation = 'target-check-complete';
let diagnostic = 'target-check-complete';
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
        target: process.env.SALIENT_V72_TARGET,
        runner: { location: 'CT114 build container', cwd: process.cwd(), node: process.version },
        expectedMethod:
          'Independent pinned Brutal Slam constants, public baseline and original dice; no compiler or resolver oracle. Natural 19/20 tier override uses confirmed R04 project contract. Real dice may keep all correction outcomes in one tier; deterministic tier coverage belongs to the isolated V72 proof.',
        sourceRules: [
          'feature/ability/fury/level-1/brutal-slam.md',
          'rule/dice/bane.md',
          'rule/character/size.md',
          'movement/forced-movement.md',
        ],
        frontend: process.env.DEV_WEB_URL,
        backend: process.env.VITE_CONVEX_URL,
        sourcePin: manifest.compendium.revision,
        scriptSha256: hash('scripts/v72-headless-main.ts'),
        runtimeHistorySha256: hash('convex/lib/history.ts'),
        runtimeHistoryReadSha256: hash('convex/lib/historyRead.ts'),
        sourceBytes: Object.fromEntries(
          [
            'scripts/v72-headless-main.ts',
            'scripts/app.ts',
            'shared/resolve/index.ts',
            'shared/content/compendium/manifest.json',
            'shared/content/character-evaluation-examples.json',
            'shared/content/fury-level-one-decisions.json',
            'convex/abilities.ts',
            'convex/lib/abilityOperations.ts',
            'convex/lib/resolve.ts',
            'convex/lib/compiledSource.ts',
            'convex/lib/compiledResults.ts',
            'shared/contracts/compiledResult.ts',
            'shared/resolve/compileAbility.ts',
            'shared/resolve/compiledOutcome.ts',
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
        diagnostic,
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
try {
  const director = await account('director');
  const player = await account('player');
  const dc = director.client;
  const pc = player.client;
  assert.equal(manifest.compendium.revision, 'fb83a789da8f0327a389c277a0c790b1648d5810');
  const content = await query(dc, api.content.status, {});
  assert.equal(content.entryCount, manifest.entryCount);
  assert.equal(content.contentHash, manifest.contentHash);
  assert.equal(content.revision, manifest.compendium.revision);
  stage = 'public-campaign-and-character-setup';
  const campaignId = await mutation(dc, api.campaigns.create, {
    commandId: randomUUID(),
    name: `V72 main proof ${runId}`,
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
  diagnostic = 'read-derived-baseline';
  const baseline = character.derivedBaseline as DerivedBaseline | null;
  assert.ok(baseline, 'Submitted hero must have a derived baseline');
  const kit = baseline.kit;
  assert.ok(kit, 'Mountain fixture must have a kit');
  const health = before.foes.find((foe: Json) => foe.id === foeId).health;
  assert.equal(health.mode, 'director');
  // Fixture is deliberately bounded: Mountain Fury vs an unmodified Goblin Warrior.
  // These preconditions prevent silently overlooking new build bonuses or resistance.
  diagnostic = 'validate-fixture-characteristics-kit-size';
  assert.equal(baseline.characteristics.M.value, 2);
  assert.deepEqual(kit.meleeDamageBonus.value, [0, 0, 4]);
  assert.equal(baseline.size.value, '1M');
  diagnostic = 'parse-public-foe-source-snapshot';
  const foeSource = JSON.parse(catalog.sourceSnapshot) as { structured: Record<string, unknown> };
  assert.equal(foeSource.structured.size, '1S');
  assert.equal(Number(foeSource.structured.stability), 0);
  assert.equal(health.temporaryStamina, 0);
  diagnostic = 'validate-fixture-damage-modifiers';
  const applicableModifiers = (baseline.abilityModifiers ?? []).filter(m =>
    m.keywords.every(k => ['melee', 'weapon', 'strike'].includes(k.toLowerCase())),
  );
  assert.deepEqual(applicableModifiers, []);
  const inputs = { baseline, health, foeSource: catalog.sourceSnapshot };
  records.push({ case: 'setup', campaignId, heroId, foeId, content, before, inputs });
  evidence();
  const used = await command(pc, `${H} /ability use ability="Brutal Slam" targets=[${G}]`);
  const eventId = used.eventId;
  assert.ok(eventId);
  const result = async (client: ConvexHttpClient) =>
    (await query(client, api.abilities.results, { campaignId, eventIds: [eventId] }))[0];
  diagnostic = 'read-original-accepted-result';
  const first = await result(dc);
  assert.ok(first);
  const dice = first.dice;
  for (const value of [dice.d10a, dice.d10b]) {
    assert.ok(Number.isInteger(value) && value >= 1 && value <= 10);
  }
  // Pinned Brutal Slam: 3/6/9 + Might damage; push 1/2/4. Mountain adds
  // 0/0/4 melee damage; larger melee-weapon attacker adds 1 to forced movement.
  // The natural 19/20 tier override follows the project's confirmed R04 contract.
  const expected = (banes: number) => {
    const natural = dice.d10a + dice.d10b;
    const total = natural + baseline.characteristics.M.value - (banes === 1 ? 2 : 0);
    const baseTier = total <= 11 ? 1 : total <= 16 ? 2 : 3;
    const tier = natural >= 19 ? 3 : Math.max(1, baseTier - (banes >= 2 ? 1 : 0));
    const damage =
      [3, 6, 9][tier - 1]! +
      baseline.characteristics.M.value +
      kit.meleeDamageBonus.value[tier - 1];
    const pushPrinted = [1, 2, 4][tier - 1]!;
    return {
      natural,
      total,
      tier,
      damage,
      pushPrinted,
      pushSubtotal: pushPrinted + 1,
      staminaAfter: health.stamina - damage,
      temporaryStaminaAfter: 0,
      slain: health.stamina - damage <= 0,
    };
  };
  const push = (r: Json) => r.compiled.effects.find((o: Json) => o.effect.kind === 'push');
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
    diagnostic = 'calculate-independent-expected-result';
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
    diagnostic = 'verify-persisted-health-and-permissions';
    const applied = calculation;
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
    diagnostic = 'verify-compiled-occurrences-and-public-projection';
    for (const effective of [playerResult, directorResult]) {
      assert.deepEqual(effective.dice, dice);
      assert.deepEqual(effective.correctionEventIds, correctionIds);
      assert.equal(effective.targets[0].edges, 0);
      assert.equal(effective.targets[0].banes, banes);
      assert.equal(effective.targets[0].outcome.tier, calculation.tier);
      assert.equal(effective.targets[0].outcome.total, calculation.total);
      assert.equal(effective.targets[0].outcome.damage.rolledDamage, calculation.damage);
      assert.equal(effective.execution.mode, 'compiled');
      assert.equal(effective.compiled.version, 1);
      assert.equal(effective.compiled.inputs, undefined);
      assert.equal(effective.compiled.definition.execution, 'supported');
      const revision = correctionIds.at(-1) ?? eventId;
      assert.equal(effective.compiled.revision, revision);
      assert.deepEqual(
        effective.compiled.effects.map((o: Json) => o.effect.kind),
        ['damage', 'push'],
      );
      for (const occurrence of effective.compiled.effects) {
        assert.equal(occurrence.useEventId, eventId);
        assert.equal(occurrence.revision, revision);
        assert.equal(occurrence.effect.targetId, foeId);
        assert.equal(
          occurrence.id,
          JSON.stringify([eventId, occurrence.effect.nodeId, foeId, revision]),
        );
      }
      const movement = push(effective).effect;
      assert.equal(movement.printed, calculation.pushPrinted);
      assert.equal(movement.sizeBonus, 1);
      assert.equal(movement.subtotal, calculation.pushSubtotal);
      assert.equal(movement.allowance, undefined);
      assert.equal(movement.stability, 0);
      assert.equal(movement.stabilityReduction, 'optional');
      for (const category of ['conditions', 'traits', 'modifiers']) {
        assert.ok(movement.requirements.some((r: string) => r.endsWith(`.${category}`)));
      }
      assert.ok(movement.manualScope.length > 0);
    }
    assert.equal(directorResult.targets[0].applied.afterImmunity, calculation.damage);
    assert.equal(directorResult.targets[0].applied.staminaAfter, calculation.staminaAfter);
    assert.deepEqual(
      directorResult.compiled.effects[0].effect.application,
      directorResult.targets[0].applied,
    );
    assert.equal(playerResult.compiled.effects[0].effect.application.staminaBefore, undefined);
    assert.equal(playerResult.compiled.effects[0].effect.application.staminaAfter, undefined);
    assert.equal(
      playerResult.compiled.effects[0].effect.application.temporaryStaminaBefore,
      undefined,
    );
    diagnostic = 'verify-original-dice-and-linked-history';
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
  const initial = await capture('initial-slam', 0, true, true, true, []);
  const correction1 = await correct(pc, 1);
  assert.ok(correction1.eventId);
  const once = await capture('player-first-correction', 1, true, true, true, [correction1.eventId]);
  assert.equal(once.playerHistory.undo.target.eventId, correction1.eventId);
  const correction2 = await correct(pc, 2);
  assert.ok(correction2.eventId);
  const linkedIds = [correction1.eventId, correction2.eventId];
  const twice = await capture('player-second-correction', 2, true, true, true, linkedIds);
  assert.equal(twice.playerHistory.undo.target.eventId, correction2.eventId);
  assert.notEqual(push(once.result).id, push(initial.result).id);
  assert.notEqual(push(twice.result).id, push(once.result).id);
  await assert.rejects(() =>
    command(
      dc,
      `/ability resolved event="${eventId}" target=${G} occurrence=${JSON.stringify(push(once.result).id)}`,
    ),
  );
  await command(pc, '/history undo');
  const undone = await capture('player-undo', 1, true, true, true, [correction1.eventId]);
  assert.deepEqual(undone.result.compiled, once.result.compiled);
  assert.equal(undone.playerHistory.redo.available, true);
  assert.equal(undone.playerHistory.redo.target.eventId, correction2.eventId);
  assert.equal(
    undone.events.find((event: Json) => event.id === correction2.eventId).disposition,
    'undone',
  );
  await command(pc, '/history redo');
  const redone = await capture('player-redo', 2, true, true, true, linkedIds);
  assert.deepEqual(redone.result.compiled, twice.result.compiled);
  assert.equal(redone.playerHistory.undo.target.eventId, correction2.eventId);
  const directorCorrection = await correct(dc, 0);
  assert.ok(directorCorrection.eventId);
  const allIds = [...linkedIds, directorCorrection.eventId];
  const directed = await capture('director-correction', 0, false, true, true, allIds);
  assert.equal(directed.playerHistory.undo.available, false);
  assert.equal(directed.directorHistory.undo.target.eventId, directorCorrection.eventId);
  await assert.rejects(() => correct(pc, 1), /Director/);
  await capture('player-denied-after-director', 0, false, true, true, allIds);
  const occurrence = push(directed.result).id;
  assert.equal(typeof occurrence, 'string');
  const dispositionCommand = `/ability resolved event="${eventId}" target=${G} occurrence=${JSON.stringify(occurrence)}`;
  await assert.rejects(() => command(pc, dispositionCommand));
  await assert.rejects(() =>
    command(
      dc,
      `/ability resolved event="${eventId}" target=${H} occurrence=${JSON.stringify(occurrence)}`,
    ),
  );
  const disposition = await command(dc, dispositionCommand);
  const resolved = await capture('manual-disposition', 0, false, false, true, allIds);
  assert.equal(resolved.result.targets[0].dispositions.length, 0);
  assert.equal(push(resolved.result).disposition.eventId, disposition.eventId);
  assert.equal(push(resolved.result).id, occurrence);
  await assert.rejects(() => command(dc, dispositionCommand));
  assert.equal(resolved.directorHistory.undo.target.eventId, disposition.eventId);
  await assert.rejects(() => correct(dc, 1), /rewind/);
  await capture('director-denied-after-disposition', 0, false, false, true, allIds);
  await command(dc, '/history rewind');
  const restored = await capture('rewind-disposition', 0, false, true, true, allIds);
  assert.equal(restored.result.targets[0].dispositions.length, 0);
  assert.deepEqual(restored.result.compiled, directed.result.compiled);
  await command(dc, '/history redo');
  const dispositionRedone = await result(dc);
  records[records.length - 1].dispositionRedo = dispositionRedone;
  evidence();
  assert.deepEqual(dispositionRedone.compiled, resolved.result.compiled);
  assert.equal(
    (await query(dc, api.table.roster, { campaignId })).foes.find((f: Json) => f.id === foeId)
      .health.stamina,
    expected(0).staminaAfter,
  );
  await command(dc, '/history rewind');
  assert.deepEqual((await result(dc)).compiled, directed.result.compiled);
  await command(pc, `${H} /turn end`);
  await capture('unrelated-turn-end', 0, false, false, false, allIds);
  await assert.rejects(() => correct(dc, 1), /rewind/);
  await assert.rejects(() => command(dc, dispositionCommand));
  await capture('director-denied-after-turn-end', 0, false, false, false, allIds);
  passed = true;
  stage = 'complete';
} catch (error) {
  // Never serialize a transport exception, command environment, or its message.
  const name = error instanceof Error ? error.name : 'NonError';
  const errorName = [
    'Error',
    'TypeError',
    'RangeError',
    'SyntaxError',
    'AssertionError',
    'ConvexError',
  ].includes(name)
    ? name
    : 'OtherError';
  records.push({ case: 'failure-diagnostic', errorName, stage, operation, diagnostic });
  if (error instanceof assert.AssertionError)
    records.push({ case: 'assertion-failure', message: error.message });
  // Persist the failure stage/readbacks without serializing auth or transport exceptions.
  process.exitCode = 1;
  console.error(`V72 headless proof failed at ${stage}; inspect sanitized readback`);
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
