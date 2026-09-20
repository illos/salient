// SPDX-License-Identifier: GPL-3.0-only
// Opt-in real HTTP correction proof. No browser, mock backend or fabricated gameplay rows.
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';
import { ConvexHttpClient } from 'convex/browser';
import { getFunctionName, type FunctionArgs, type FunctionReference } from 'convex/server';
import { api } from '../convex/_generated/api.js';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { draftSelectionsFrom } from '../shared/evaluate/draft.ts';
import type { DerivedBaseline, EvaluationInput } from '../shared/contracts/characterEvaluation';
import { definitions } from '../shared/content/level-one-decisions.ts';
import reference from '../tests/fixtures/v25-bethell.json' with { type: 'json' };
import type { Id } from '../convex/_generated/dataModel';
import manifest from '../shared/content/compendium/manifest.json' with { type: 'json' };

// Public JSON readbacks are deliberately retained verbatim for independent evidence review.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const exec = promisify(execFile);
const tokens = new WeakMap<ConvexHttpClient, string>();
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
// Run only by TESTER against a named disposable anonymous development target.
function checkTarget() {
  assert.equal(process.env.SALIENT_V88_HEADLESS, '1');
  const expectedUrl = process.env.SALIENT_V88_EXPECTED_URL;
  const expectedCommit = process.env.SALIENT_V88_EXPECTED_COMMIT;
  assert.ok(expectedUrl && expectedCommit);
  assert.match(expectedCommit, /^[a-f0-9]{40}$/);
  const url = new URL(expectedUrl);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  assert.ok(
    local ||
      /^salient-engine-potency(?:-seeded)?-dev-[a-f0-9]+\.tail41404c\.ts\.net$/.test(url.hostname),
  );
  assert.equal(process.env.DEV_WEB_URL, expectedUrl);
  assert.equal(process.env.VITE_SITE_URL, expectedUrl);
  const checkout = '/srv/presidium/projects/salient/code/.worktrees/engine-potency-seeded';
  const source = existsSync('/runtime-source.json')
    ? JSON.parse(readFileSync('/runtime-source.json', 'utf8'))
    : {
        checkout: process.cwd(),
        commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        dirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim() !== '',
      };
  assert.equal(source.checkout, checkout);
  assert.equal(source.commit, expectedCommit);
  if (!local) assert.equal(source.identity, createHash('sha256').update(checkout).digest('hex'));
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
  for (const key of ['VITE_CONVEX_URL', 'VITE_CONVEX_SITE_URL']) {
    const endpoint = new URL(process.env[key]!);
    assert.ok(
      local
        ? ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)
        : endpoint.hostname === 'backend',
    );
    assert.equal(endpoint.protocol, 'http:');
  }
  return source;
}
const source = checkTarget();
const runId = randomUUID();
const startedAt = new Date().toISOString();
const startedMs = Date.now();
const directory = process.env.SALIENT_V88_ARTIFACT_DIR ?? '/artifacts';
mkdirSync(directory, { recursive: true });
const output = `${directory}/v88-headless-${runId}.json`;
const records: Json[] = [];
const logins: ReturnType<typeof createAuthClient>[] = [];
let passed = false;
let stage = 'setup';
let operation = 'target-check-complete';
let diceDirectory: string | undefined;
const sourcePaths = [
  'scripts/v88-headless.ts',
  'scripts/v88-seeded-dice-import.mjs',
  'scripts/app.ts',
  'shared/content/compendium/manifest.json',
  'shared/content/character-evaluation-examples.json',
  'tests/fixtures/v25-bethell.json',
  'shared/resolve/abilityGrammar.ts',
  'shared/resolve/compileAbility.ts',
  'shared/resolve/compiledOutcome.ts',
  'shared/contracts/compiledResult.ts',
  'shared/contracts/liveState.ts',
  'convex/lib/compiledResults.ts',
  'convex/lib/abilityOperations.ts',
  'convex/lib/conditionInstances.ts',
  'convex/lib/clock.ts',
  'convex/lib/tableOperations.ts',
  'convex/abilities.ts',
  'convex/table.ts',
  'convex/characters.ts',
  'convex/lib/history.ts',
];
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
        runner: { cwd: process.cwd(), node: process.version },
        target: { frontend: process.env.DEV_WEB_URL, backend: process.env.VITE_CONVEX_URL },
        sourcePin: manifest.compendium.revision,
        sourceBytes: Object.fromEntries(sourcePaths.map(path => [path, hash(path)])),
        method:
          'Real BetterAuth, registered scripts/app.ts commands, public persisted readback, real campaign dice. Original V88 cases use unpositioned campaign randomness. Added V87-reachable cases disclose bounded diceStates positioning preserving unrelated rows; no generated outcome/gameplay-row imports. Expected arithmetic uses pinned printed values, never resolver output.',
        coverageLimits:
          'One real save branch per applied instance; deterministic both-branch saves and correction flips are independently covered by persisted tests. Correction flip witness depends on accepted natural dice, and its applicability is recorded without rerolling.',
        passed,
        stage,
        operation,
        records,
      },
      null,
      2,
    ),
  );
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
    name: `V88 ${role}`,
    email: `v88-${role}-${runId}@example.test`,
    password: `V88-${randomUUID()}`,
  });
  assert.ok(!registered.error, `${role} registration failed`);
  const jwt = await login.convex.token();
  assert.ok(!jwt.error && jwt.data?.token, `${role} token unavailable`);
  const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!, { logger: false });
  client.setAuth(jwt.data.token);
  tokens.set(client, jwt.data.token);
  const profile = await mutation(client, api.auth.ensureProfile, {});
  return { client, profile };
}
try {
  const director = await account('director');
  const player = await account('controller');
  const observer = await account('observer');
  const dc = director.client;
  const pc = player.client;
  const oc = observer.client;
  assert.equal(manifest.compendium.revision, 'fb83a789da8f0327a389c277a0c790b1648d5810');
  const content = await query(dc, api.content.status, {});
  assert.equal(content.entryCount, manifest.entryCount);
  assert.equal(content.contentHash, manifest.contentHash);
  assert.equal(content.revision, manifest.compendium.revision);
  const campaignId = await mutation(dc, api.campaigns.create, {
    commandId: randomUUID(),
    name: `V88 ${runId}`,
  });
  const campaign = await query(dc, api.campaigns.get, { campaignId });
  for (const member of [player, observer]) {
    await mutation(member.client, api.campaigns.requestJoin, {
      commandId: randomUUID(),
      shareCode: campaign.shareCode,
    });
    const joined = await query(dc, api.campaigns.get, { campaignId });
    const request = joined.pendingRequests.find(
      (row: Json) => row.userId === member.profile.userId,
    );
    assert.ok(request);
    await mutation(dc, api.campaigns.approveRequest, {
      commandId: randomUUID(),
      requestId: request.id,
    });
  }
  const examples = JSON.parse(
    readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
  ) as { examples: { complete: { input: EvaluationInput } } };
  const furyChoices = {
    ...examples.examples.complete.input.selections,
    'class.fury.array-assignment': { Intuition: 0, Reason: 1, Presence: 0 },
  };
  const elementalistChoices = {
    ...reference.selections,
    'class.elementalist.characteristic-array': '2, 1, 0, 0',
    'class.elementalist.array-assignment': { Might: 0, Agility: 1, Intuition: 2, Presence: 0 },
  };
  const wodeChoices: EvaluationInput['selections'] = { ...furyChoices };
  for (const key of Object.keys(wodeChoices))
    if (key.startsWith('ancestry.')) delete wodeChoices[key];
  wodeChoices['ancestry.choice'] = 'Wode Elf';
  wodeChoices['ancestry.wode-elf.purchased-traits'] = ['The Wode Defends', 'Forest Walk'];
  const hero = async (name: string, choices: EvaluationInput['selections']) => {
    const authored = { name, appearance: '', biography: '', notes: '' };
    const id = await mutation(pc, api.characters.create, { commandId: randomUUID(), authored });
    await mutation(pc, api.characters.save, {
      commandId: randomUUID(),
      characterId: id,
      expectedRevision: 1,
      authored,
      selections: draftSelectionsFrom({ ...choices, 'details.name': name }, definitions),
    });
    await mutation(pc, api.characters.submit, {
      commandId: randomUUID(),
      characterId: id,
      campaignId,
    });
    await mutation(dc, api.characters.approve, { commandId: randomUUID(), characterId: id });
    const saved = await query(pc, api.characters.get, { characterId: id });
    assert.ok(saved.derivedBaseline);
    return { id, kind: 'character', name, baseline: saved.derivedBaseline as DerivedBaseline };
  };
  const H = await hero('V88 Fury', furyChoices);
  const E = await hero('V88 Elementalist', elementalistChoices);
  const W = await hero('V88 Wode', wodeChoices);
  const N = await hero('V88 Seeded Agile Target', {
    ...elementalistChoices,
    'class.elementalist.array-assignment': { Might: 0, Agility: 0, Intuition: 2, Presence: 1 },
  });
  const P = await hero('V88 Seeded Presence Target', {
    ...furyChoices,
    'class.fury.characteristic-array': '2, −1, −1',
    'class.fury.array-assignment': { Intuition: -1, Reason: -1, Presence: 2 },
  });
  assert.equal(N.baseline.characteristics.A.value, 0);
  assert.equal(N.baseline.characteristics.M.value, 0);
  assert.equal(P.baseline.characteristics.P.value, 2);
  assert.equal(H.baseline.characteristics.A.value, 2);
  assert.equal(H.baseline.characteristics.P.value, 0);
  assert.equal(H.baseline.characteristics.M.value, 2);
  assert.equal(H.baseline.characteristics.I.value, 0);
  assert.equal(E.baseline.characteristics.M.value, 0);
  assert.equal(E.baseline.characteristics.I.value, 2);
  assert.equal(W.baseline.potencyCharacteristic.value, 'M');
  assert.deepEqual(
    ['weak', 'average', 'strong'].map(
      key => W.baseline.potency[key as keyof typeof W.baseline.potency].value,
    ),
    [0, 1, 2],
  );
  assert.equal(H.baseline.savingThrowThreshold.value, 5); // Impressive Horns, pinned Devil trait.
  for (const actor of [E, W]) assert.equal(actor.baseline.savingThrowThreshold.value, 6);
  const catalog = await query(dc, api.foes.definitions, { campaignId });
  const foe = async (name: string) => {
    const definition = catalog.find((row: Json) => row.name === name);
    assert.ok(definition, `Missing seeded ${name}`);
    const id = await mutation(dc, api.foes.add, {
      commandId: randomUUID(),
      campaignId,
      definitionId: definition.definitionId,
    });
    return { id, kind: 'foe', name };
  };
  const G = await foe('Goblin Warrior');
  const C = await foe('Goblin Cursespitter');
  const D = await foe('Dwarf Warden');
  const B = await foe('Lizardfolk Bloodeye');
  const F = await foe('Hobgoblin Redglare');
  const O = await foe('Orc Godcaller');
  const R = await foe('Ghoul');
  const goblinSource = await query(dc, api.foes.detail, { campaignId, foeId: G.id });
  const dwarfSource = await query(dc, api.foes.detail, { campaignId, foeId: D.id });
  assert.equal(Number(JSON.parse(goblinSource.sourceSnapshot).structured.agility), 2);
  assert.equal(Number(JSON.parse(dwarfSource.sourceSnapshot).structured.agility), 0);
  records.push({
    case: 'setup',
    campaignId,
    content,
    heroes: [H, E, W, N, P],
    foes: [G, C, D, B, F, O, R],
    goblinSource,
    dwarfSource,
  });
  evidence();
  await mutation(dc, api.sessions.start, {
    commandId: randomUUID(),
    campaignId,
    selectedPlayerIds: [player.profile.userId, observer.profile.userId],
  });
  const command = async (client: ConvexHttpClient, text: string) => {
    stage = text;
    operation = 'scripts/app.ts command';
    const response = await exec(
      process.execPath,
      ['scripts/app.ts', 'command', text, '--campaign', campaignId, '--command-id', randomUUID()],
      { env: { ...process.env, SALIENT_AUTH_TOKEN: tokens.get(client) }, timeout: 30_000 },
    );
    return JSON.parse(response.stdout);
  };
  const ref = (actor: Json) => `@{${actor.kind}:${actor.id}}`;
  const roster = () => query(dc, api.table.roster, { campaignId });
  const events = async () => {
    const all: Json[] = [];
    let before: number | undefined;
    for (let page = 0; page < 20; page++) {
      const result = await query(dc, api.events.list, {
        campaignId,
        ...(before === undefined ? {} : { before }),
      });
      all.push(...result.events);
      if (result.nextBefore === null) return all;
      before = result.nextBefore;
    }
    throw new Error('Disposable proof exceeded its bounded event readback');
  };
  const result = async (eventId: string, client = dc) =>
    (
      await query(client, api.abilities.results, {
        campaignId,
        eventIds: [eventId as Id<'events'>],
      })
    )[0];
  const occurrence = (r: Json) => {
    const found = r.compiled.effects.find((o: Json) => o.effect.kind === 'condition');
    assert.ok(found, 'Compiled condition occurrence required');
    return found;
  };
  const live = (r: Json, actor: Json) =>
    actor.kind === 'character'
      ? r.heroes.find((row: Json) => row.id === actor.id).live
      : r.foes.find((row: Json) => row.id === actor.id);
  const active = (r: Json, actor: Json, id: string) =>
    (live(r, actor).conditionInstances ?? []).find(
      (i: Json) => i.id === id && i.status === 'active',
    );
  const state = async () => ({
    roster: await roster(),
    encounter: await query(dc, api.encounters.current, { campaignId }),
    events: await events(),
  });
  const capture = async (name: string, eventId?: string) => {
    stage = name;
    const observed = await state();
    records.push({
      case: name,
      observed,
      ...(eventId
        ? {
            directorResult: await result(eventId),
            controllerResult: await result(eventId, pc),
            observerResult: await result(eventId, oc),
          }
        : {}),
    });
    evidence();
    return observed;
  };
  await command(dc, '/combat start');
  await command(dc, '/combat commit');
  await command(pc, '/combat roll');
  await command(dc, '/combat first side=heroes');
  const freshTurn = async (actor: Json) => {
    let encounter = await query(dc, api.encounters.current, { campaignId });
    if (encounter.activeTurn) await command(dc, `${ref(encounter.activeTurn.actor)} /turn end`);
    for (let step = 0; step < 60; step++) {
      encounter = await query(dc, api.encounters.current, { campaignId });
      const entries = encounter.groups
        .filter((g: Json) => g.active || (!g.completed && g.side === encounter.activeSide))
        .flatMap((g: Json) => g.entries)
        .filter((e: Json) => !e.spent && !e.slain);
      const entry = entries.find((e: Json) => e.actor.id === actor.id) ?? entries[0];
      assert.ok(entry, 'No eligible turn entry');
      await command(dc, `${ref(entry.actor)} /turn take`);
      if (entry.actor.id === actor.id) return;
      await command(dc, `${ref(entry.actor)} /turn end`);
    }
    throw new Error('Could not reach requested actor turn');
  };
  // Printed tier arithmetic, independent of compiler/resolver outputs.
  const expectedTier = (r: Json, bonus: number, edges = 2, banes = 0) => {
    const natural = r.dice.d10a + r.dice.d10b;
    for (const die of [r.dice.d10a, r.dice.d10b])
      assert.ok(Number.isInteger(die) && die >= 1 && die <= 10);
    const net = edges - banes;
    const total = natural + bonus + (net === 1 ? 2 : net === -1 ? -2 : 0);
    const raw = total <= 11 ? 1 : total <= 16 ? 2 : 3;
    return natural >= 19 ? 3 : Math.max(1, Math.min(3, raw + (net >= 2 ? 1 : net <= -2 ? -1 : 0)));
  };
  const refuseDisposition = async (eventId: string, target: Json) => {
    const before = await roster();
    const o = occurrence(await result(eventId));
    await assert.rejects(() =>
      command(
        dc,
        `/ability resolved event=${JSON.stringify(eventId)} target=${ref(target)} occurrence=${JSON.stringify(o.id)}`,
      ),
    );
    assert.deepEqual(await roster(), before);
  };
  const use = async (
    name: string,
    ability: string,
    actor: Json,
    target: Json,
    score: number,
    expectedStatus: string,
  ) => {
    await freshTurn(actor);
    await command(dc, `${ref(target)} /adjust stamina value=30`);
    if (ability === 'Bury the Point') await command(dc, '/adjust malice value=2');
    const before = await roster();
    const used = await command(
      actor.kind === 'character' ? pc : dc,
      `${ref(actor)} /ability use ability=${JSON.stringify(ability)} targets=[${ref(target)}] edges=2${ability === 'The Wode Defends' ? ' characteristic=M damage-characteristic=M' : ''}`,
    );
    assert.ok(used.eventId);
    const observed = await capture(name, used.eventId);
    const r = await result(used.eventId);
    const conditionLog = observed.events.find(
      (event: Json) =>
        event.kind === 'condition.potency' && event.payload?.sourceUseEventId === used.eventId,
    );
    assert.ok(conditionLog);
    assert.match(conditionLog.description, new RegExp(expectedStatus));
    assert.ok(conditionLog.description.includes(ability));
    assert.equal(conditionLog.payload.targetScore, undefined);
    const o = occurrence(r);
    const tier = expectedTier(r, 2);
    const threshold = tier - 1;
    const expectedDamage =
      ability === 'Bury the Point'
        ? [5, 6, 7][tier - 1]!
        : ability === 'Eye of Surlach'
          ? [3, 4, 5][tier - 1]!
          : [2, 3, 5][tier - 1]! + 2;
    const condition =
      ability === 'Bury the Point'
        ? 'bleeding'
        : ability === 'Eye of Surlach'
          ? 'weakened'
          : tier === 3
            ? 'restrained'
            : 'slowed';
    assert.equal(score < threshold ? 'applied' : 'resisted', expectedStatus);
    assert.equal(r.targets[0].outcome.tier, tier);
    assert.equal(r.targets[0].outcome.damage.rolledDamage, expectedDamage);
    assert.equal(o.effect.status, expectedStatus);
    assert.equal(o.effect.threshold, threshold);
    assert.equal(o.effect.targetScore, score);
    assert.equal(o.effect.condition, condition);
    assert.equal(o.effect.duration, 'save-ends');
    assert.equal(o.useEventId, used.eventId);
    assert.equal(
      o.effect.after,
      r.compiled.effects.find((x: Json) => x.effect.kind === 'damage').effect.nodeId,
    );
    assert.equal(live(observed.roster, target).conditions[condition], expectedStatus === 'applied');
    assert.equal(Boolean(active(observed.roster, target, o.id)), expectedStatus === 'applied');
    if (expectedStatus === 'applied') {
      const instance = active(observed.roster, target, o.id);
      assert.equal(instance.abilityName, ability);
      assert.equal(instance.duration, 'save-ends');
      if (target.kind === 'character') {
        assert.equal(instance.sourceUseEventId, used.eventId);
        assert.ok(instance.registrationId);
      }
    }
    for (const client of [pc, oc]) {
      const projected = occurrence(await result(used.eventId, client)).effect;
      assert.equal(projected.status, expectedStatus);
      assert.equal(projected.threshold, threshold);
      assert.equal(
        projected.targetScore,
        target.kind === 'character' && client === pc ? score : undefined,
      );
    }
    if (ability === 'Bury the Point') assert.equal(observed.roster.malice, before.malice - 2);
    if (ability === 'The Wode Defends') {
      assert.equal(o.effect.thresholdSource.kind, 'potency');
      assert.equal(o.effect.potencyCharacteristic, 'M');
      assert.equal(o.effect.thresholdSource.tier, ['weak', 'average', 'strong'][tier - 1]);
    }
    records.push({
      case: `${name}-expected`,
      tier,
      threshold,
      score,
      expectedDamage,
      condition,
      expectedStatus,
      before,
    });
    evidence();
    await refuseDisposition(used.eventId, target);
    return { eventId: used.eventId as string, occurrenceId: o.id, condition, tier, r };
  };
  await use('BP6-resisted', 'Bury the Point', G, H, 2, 'resisted');
  const applied = await use('BP7-applied', 'Bury the Point', G, E, 0, 'applied');
  // Try one correction against the same accepted dice; never reroll to obtain the desired tier.
  const corrected = await command(
    dc,
    `/ability correct event=${JSON.stringify(applied.eventId)} target=${ref(E)} edges=0 banes=2`,
  );
  assert.ok(corrected.eventId);
  const correctionResult = await result(applied.eventId);
  const correctedTier = expectedTier(correctionResult, 2, 0, 2);
  const correctedStatus = correctedTier === 1 ? 'resisted' : 'applied';
  assert.equal(occurrence(correctionResult).effect.status, correctedStatus);
  assert.equal(
    Boolean(active(await roster(), E, occurrence(correctionResult).id)),
    correctedStatus === 'applied',
  );
  await capture('BP9-correction-same-dice', applied.eventId);
  records.push({
    case: 'BP9-random-branch',
    natural: applied.r.dice.d10a + applied.r.dice.d10b,
    correctedTier,
    flipWitnessed: correctedStatus === 'resisted',
  });
  await command(dc, '/history rewind');
  assert.deepEqual((await result(applied.eventId)).compiled, applied.r.compiled);
  const save = async (name: string, target: Json, useResult: typeof applied, manual = false) => {
    await freshTurn(target);
    const before = await state();
    const original = active(before.roster, target, useResult.occurrenceId);
    assert.ok(original);
    const ended = await command(target.kind === 'character' ? pc : dc, `${ref(target)} /turn end`);
    assert.ok(ended.eventId);
    const after = await capture(name, useResult.eventId);
    const saves = after.events.filter(
      (event: Json) =>
        event.kind === 'clock.saving-throw' &&
        event.payload?.data?.effectInstanceId === useResult.occurrenceId &&
        !before.events.some((old: Json) => old.id === event.id),
    );
    assert.equal(saves.length, 1);
    const event = saves[0];
    assert.equal(event.dice.length, 1);
    const die = event.dice[0].value;
    assert.ok(Number.isInteger(die) && die >= 1 && die <= 10);
    const threshold = target.kind === 'character' ? target.baseline.savingThrowThreshold.value : 6;
    const success = die >= threshold;
    assert.equal(event.payload.data.roll, die);
    assert.equal(event.payload.data.success, success);
    assert.equal(event.payload.data.threshold, threshold);
    assert.equal(
      event.payload.data.thresholdSource.kind,
      target.kind === 'character' ? 'hero-baseline' : 'printed',
    );
    assert.equal(event.payload.work.kind, 'saving-throw');
    assert.equal(event.payload.work.creatureId, target.id);
    assert.equal(event.payload.work.effectInstanceId, useResult.occurrenceId);
    if (original.registrationId)
      assert.equal(event.payload.registrationId, original.registrationId);
    assert.equal(Boolean(active(after.roster, target, useResult.occurrenceId)), !success);
    assert.equal(live(after.roster, target).conditions[useResult.condition], manual || !success);
    if (!success) assert.match(event.description, /hero.token.*manual/i);
    const refusedBefore = await state();
    await assert.rejects(
      () =>
        command(
          dc,
          `/ability correct event=${JSON.stringify(useResult.eventId)} target=${ref(target)} edges=0 banes=0`,
        ),
      /saving throw has already been rolled/,
    );
    assert.deepEqual(await state(), refusedBefore);
    await command(dc, '/history rewind');
    assert.deepEqual(await roster(), before.roster);
    await command(dc, '/history redo');
    assert.deepEqual(await roster(), after.roster);
    const redoneEvents = await events();
    assert.deepEqual(redoneEvents.find((e: Json) => e.id === event.id).dice, event.dice);
    assert.equal(
      redoneEvents.filter(
        (e: Json) =>
          e.kind === 'clock.saving-throw' &&
          e.payload?.data?.effectInstanceId === useResult.occurrenceId,
      ).length,
      after.events.filter(
        (e: Json) =>
          e.kind === 'clock.saving-throw' &&
          e.payload?.data?.effectInstanceId === useResult.occurrenceId,
      ).length,
    );
    records.push({ case: `${name}-expected`, die, success, eventId: event.id, before, after });
    evidence();
    // Rewind the save to prove manual removal on an active instance regardless of random success.
    await command(dc, '/history rewind');
    const off = await command(dc, `${ref(target)} /condition off name=${useResult.condition}`);
    const removed = await capture(`${name}-manual-off`, useResult.eventId);
    assert.equal(Boolean(active(removed.roster, target, useResult.occurrenceId)), false);
    assert.ok(
      removed.events
        .find((event: Json) => event.id === off.eventId)
        .description.includes(original.abilityName),
    );
    assert.equal(live(removed.roster, target).conditions[useResult.condition], false);
  };
  await save('BP8-save-and-BP10-refusal', E, applied);
  await use('EYE1-resisted', 'Eye of Surlach', C, E, 2, 'resisted');
  await command(pc, `${ref(H)} /condition on name=weakened`);
  const eye = await use('EYE2-applied', 'Eye of Surlach', C, H, 0, 'applied');
  await save('EYE3-save-manual-toggle-and-Impressive-Horns', H, eye, true);
  await use('WD1-resisted', 'The Wode Defends', W, G, 2, 'resisted');
  const wode = await use('WD2-applied', 'The Wode Defends', W, D, 0, 'applied');
  await save('WD2-foe-save', D, wode);
  // V87 reachability addendum. No dice positioning occurs before this boundary.
  stage = 'seeded-addendum-helper-guard';
  const diceRoot = process.env.SALIENT_V88_DICE_DIR ?? '/artifacts/v88-seeded-dice';
  const ready = JSON.parse(readFileSync(`${diceRoot}/ready.json`, 'utf8'));
  assert.match(ready.id, /^[a-f0-9-]{36}$/);
  assert.equal(ready.frontend, process.env.DEV_WEB_URL);
  assert.equal(ready.commit, source.commit);
  assert.ok(Date.now() - ready.startedAt < 1_200_000);
  diceDirectory = `${diceRoot}/${ready.id}`;
  const seedFor = (a: number, b: number) => {
    for (let n = 0; n < 100_000; n++) {
      const seed = createHash('sha256').update(`V88 seeded reachability fixture ${n}`).digest();
      const values = [0, 1].map(counter => {
        const input = Buffer.alloc(40);
        seed.copy(input);
        input.writeBigUInt64BE(BigInt(counter), 32);
        return createHash('sha256').update(input).digest().readUInt32BE(0);
      });
      if (values.every((value, i) => value < 4_294_967_290 && (value % 10) + 1 === [a, b][i]))
        return seed.toString('hex');
    }
    throw new Error('No bounded fixture seed');
  };
  const positionDice = async (a: number, b: number) => {
    checkTarget();
    const requestId = randomUUID();
    const request = `${diceDirectory}/${requestId}.request.json`;
    const seed = seedFor(a, b);
    writeFileSync(`${request}.tmp`, JSON.stringify({ campaignId, seed }), { mode: 0o600 });
    renameSync(`${request}.tmp`, request);
    const response = request.replace('.request.json', '.response.json');
    const deadline = Date.now() + 30_000;
    while (!existsSync(response) && Date.now() < deadline) await sleep(100);
    assert.ok(existsSync(response), 'Seeded dice helper did not finish');
    const imported = JSON.parse(readFileSync(response, 'utf8'));
    assert.equal(imported.ok, true);
    records.push({
      case: 'disclosed-dice-position',
      requestId,
      campaignId,
      faces: [a, b],
      seed,
      imported,
    });
    evidence();
  };
  type SeededAbility = {
    name: string;
    actor: Json;
    sourcePath: string;
    bonus: number;
    damage: [number, number, number];
    characteristic: 'A' | 'P' | 'M';
    thresholds: [number | null, number | null, number | null];
    conditions: [string | null, string | null, string | null];
  };
  const seededAbilities: SeededAbility[] = [
    {
      name: 'Bola Knock',
      actor: B,
      sourcePath: 'monster/lizardfolk/statblock/lizardfolk-bloodeye.md',
      bonus: 2,
      damage: [5, 7, 9],
      characteristic: 'A',
      thresholds: [0, 1, 2],
      conditions: ['restrained', 'restrained', 'restrained'],
    },
    {
      name: 'Eye Flash',
      actor: F,
      sourcePath: 'monster/hobgoblin/statblock/hobgoblin-redglare.md',
      bonus: 3,
      damage: [9, 14, 17],
      characteristic: 'P',
      thresholds: [1, 2, 3],
      conditions: ['slowed', 'restrained', 'restrained'],
    },
    {
      name: 'Power Chord',
      actor: O,
      sourcePath: 'monster/orc/statblock/orc-godcaller.md',
      bonus: 2,
      damage: [5, 7, 9],
      characteristic: 'P',
      thresholds: [null, null, 2],
      conditions: [null, null, 'weakened'],
    },
    {
      name: 'Razor Claws',
      actor: R,
      sourcePath: 'monster/undead/1st-echelon/statblock/ghoul.md',
      bonus: 2,
      damage: [3, 4, 5],
      characteristic: 'M',
      thresholds: [null, null, 2],
      conditions: [null, null, 'bleeding'],
    },
  ];
  for (const ability of seededAbilities) {
    const sheet = await query(dc, api.abilities.sheet, { campaignId, actor: ability.actor });
    const action = sheet.abilities.find((a: Json) => a.name === ability.name);
    assert.ok(action && action.kind === 'rolled');
    assert.equal(action.fixedCost, null);
    assert.equal(action.unknownCost, null);
    assert.equal(action.tiers.length, 3);
    const source = await query(dc, api.foes.detail, { campaignId, foeId: ability.actor.id });
    assert.ok(source.sourceSnapshot.includes(ability.name));
    records.push({
      case: 'seeded-action-availability',
      ability: ability.name,
      action,
      sheet,
      source,
      scope:
        'Only the named compiled ability is covered; parent traits and other actions retain their existing manual/compatibility behavior.',
    });
  }
  evidence();
  const verifySeeded = async (
    label: string,
    ability: SeededAbility,
    target: Json,
    eventId: string,
    startingStamina: number,
    malice: number,
    faces: [number, number],
    edges: number,
    banes = 0,
  ) => {
    const observed = await capture(label, eventId);
    const r = await result(eventId);
    assert.deepEqual(r.dice, { d10a: faces[0], d10b: faces[1] });
    const tier = expectedTier(r, ability.bonus, edges, banes);
    const damage = ability.damage[tier - 1]!;
    const threshold = ability.thresholds[tier - 1];
    const condition = ability.conditions[tier - 1];
    const score = target.baseline.characteristics[ability.characteristic].value;
    assert.equal(r.targets[0].outcome.tier, tier);
    assert.equal(r.targets[0].outcome.damage.rolledDamage, damage);
    assert.equal(r.targets[0].applied.afterImmunity, damage);
    assert.equal(live(observed.roster, target).stamina, startingStamina - damage);
    assert.equal(observed.roster.malice, malice);
    const conditions = r.compiled.effects.filter((o: Json) => o.effect.kind === 'condition');
    const instances = (live(observed.roster, target).conditionInstances ?? []).filter(
      (i: Json) => i.sourceUseEventId === eventId && i.status === 'active',
    );
    let found: Json;
    if (threshold === null) {
      assert.deepEqual(conditions, []);
      assert.deepEqual(instances, []);
    } else {
      assert.equal(conditions.length, 1);
      found = conditions[0];
      const status = score < threshold! ? 'applied' : 'resisted';
      assert.equal(found.effect.status, status);
      assert.equal(found.effect.threshold, threshold);
      assert.equal(found.effect.targetScore, score);
      assert.equal(found.effect.characteristic, ability.characteristic);
      assert.equal(found.effect.condition, condition);
      assert.equal(found.effect.duration, 'save-ends');
      assert.equal(found.useEventId, eventId);
      assert.ok(r.compiled.definition.source.path.endsWith(ability.sourcePath));
      assert.equal(instances.length, status === 'applied' ? 1 : 0);
      if (status === 'applied') {
        assert.equal(instances[0].id, found.id);
        assert.equal(instances[0].abilityName, ability.name);
        assert.ok(instances[0].registrationId);
        assert.ok(instances[0].sourcePath.endsWith(ability.sourcePath));
      }
      for (const [client, expectedScore] of [
        [pc, score],
        [oc, undefined],
      ] as const) {
        const projected = occurrence(await result(eventId, client));
        assert.equal(projected.effect.targetScore, expectedScore);
        assert.equal(projected.effect.status, status);
        assert.equal(projected.effect.threshold, threshold);
        assert.equal(projected.effect.clause, found.effect.clause);
      }
      await refuseDisposition(eventId, target);
    }
    // These targets are clean before each use; a correction must remove an obsolete tier condition.
    for (const name of ['restrained', 'slowed', 'weakened', 'bleeding']) {
      assert.equal(
        live(observed.roster, target).conditions[name],
        Boolean(found && found.effect.status === 'applied' && name === condition),
      );
    }
    records.push({
      case: `${label}-expected`,
      sourcePath: ability.sourcePath,
      faces,
      tier,
      damage,
      score,
      threshold,
      condition,
      malice,
    });
    evidence();
    return { eventId, occurrenceId: found?.id, condition: condition ?? '', tier, r };
  };
  const seededUse = async (
    label: string,
    ability: SeededAbility,
    target: Json,
    faces: [number, number],
    edges = 0,
  ) => {
    await freshTurn(ability.actor);
    await command(dc, `${ref(target)} /adjust stamina value=50`);
    await command(dc, `${ref(target)} /adjust temporary-stamina value=0`);
    const before = await roster();
    await positionDice(...faces);
    const used = await command(
      dc,
      `${ref(ability.actor)} /ability use ability=${JSON.stringify(ability.name)} targets=[${ref(target)}] edges=${edges}`,
    );
    assert.ok(used.eventId);
    return {
      result: await verifySeeded(
        label,
        ability,
        target,
        used.eventId,
        50,
        before.malice,
        faces,
        edges,
      ),
      malice: before.malice,
    };
  };
  const seededCorrect = async (
    label: string,
    ability: SeededAbility,
    target: Json,
    eventId: string,
    malice: number,
    edges: number,
    banes: number,
  ) => {
    const old = await result(eventId);
    await command(
      dc,
      `/ability correct event=${JSON.stringify(eventId)} target=${ref(target)} edges=${edges} banes=${banes}`,
    );
    const current = await verifySeeded(
      label,
      ability,
      target,
      eventId,
      50,
      malice,
      [6, 6],
      edges,
      banes,
    );
    assert.deepEqual(current.r.dice, old.dice);
    return current;
  };
  for (const [index, ability] of seededAbilities.entries()) {
    const prefix = ['BK', 'EF', 'PC', 'RC'][index]!;
    const applyingTarget = index === 0 || index === 3 ? N : H;
    const resistingTarget = index === 0 || index === 3 ? H : P;
    const edges = index >= 2 ? 2 : 0;
    const applied = await seededUse(`${prefix}1-applied`, ability, applyingTarget, [6, 6], edges);
    assert.equal(occurrence(applied.result.r).effect.status, 'applied');
    const low = await seededCorrect(
      `${prefix}3-correction-tier1`,
      ability,
      applyingTarget,
      applied.result.eventId,
      applied.malice,
      0,
      2,
    );
    assert.equal(low.tier, 1);
    if (index >= 2) {
      const middle = await seededCorrect(
        `${prefix}3-correction-tier2`,
        ability,
        applyingTarget,
        applied.result.eventId,
        applied.malice,
        0,
        0,
      );
      assert.equal(middle.tier, 2);
    }
    const restored = await seededCorrect(
      `${prefix}3-correction-restored`,
      ability,
      applyingTarget,
      applied.result.eventId,
      applied.malice,
      index === 1 ? 2 : edges,
      0,
    );
    assert.equal(occurrence(restored.r).effect.status, 'applied');
    assert.notEqual(restored.occurrenceId, applied.result.occurrenceId);
    await save(`${prefix}4-source-save`, applyingTarget, restored);
    // Eye's equality boundary is P2 at tier2; the other three resist at tier3.
    const resisted = await seededUse(
      `${prefix}2-resisted`,
      ability,
      resistingTarget,
      index === 1 ? [6, 6] : [8, 8],
    );
    assert.equal(occurrence(resisted.result.r).effect.status, 'resisted');
    if (index >= 2) {
      const middle = await seededUse(
        `${prefix}5-tier2-no-condition`,
        ability,
        applyingTarget,
        [6, 6],
      );
      assert.equal(middle.result.tier, 2);
      assert.equal(middle.result.occurrenceId, undefined);
    }
  }
  await capture('complete');
  passed = true;
  stage = 'complete';
} catch (error) {
  const name = error instanceof Error ? error.name : 'NonError';
  records.push({
    case: 'failure',
    errorName: [
      'Error',
      'TypeError',
      'RangeError',
      'SyntaxError',
      'AssertionError',
      'ConvexError',
    ].includes(name)
      ? name
      : 'OtherError',
    stage,
    operation,
  });
  if (error instanceof assert.AssertionError)
    records.push({ case: 'assertion-failure', message: error.message });
  process.exitCode = 1;
  console.error(`V88 headless proof failed at ${stage}; inspect sanitized readback ${output}`);
} finally {
  if (diceDirectory) writeFileSync(`${diceDirectory}/done`, 'done');
  for (const login of logins) {
    try {
      assert.ok(!(await login.signOut()).error);
    } catch {
      passed = false;
      process.exitCode = 1;
      records.push({ case: 'session-cleanup', passed: false });
    }
  }
  evidence();
}
