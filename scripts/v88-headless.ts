// SPDX-License-Identifier: GPL-3.0-only
// Opt-in real HTTP correction proof. No browser, mock backend or fabricated gameplay rows.
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
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
    local || /^salient-engine-potency-dev-[a-f0-9]+\.tail41404c\.ts\.net$/.test(url.hostname),
  );
  assert.equal(process.env.DEV_WEB_URL, expectedUrl);
  assert.equal(process.env.VITE_SITE_URL, expectedUrl);
  const checkout = '/srv/presidium/projects/salient/code/.worktrees/engine-potency';
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
const sourcePaths = [
  'scripts/v88-headless.ts',
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
          'Real BetterAuth, registered scripts/app.ts commands, public persisted readback, real campaign dice. No database import or fabricated gameplay rows. Two edges ensure tier >=2; expected arithmetic uses pinned printed values, never resolver output.',
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
  const goblinSource = await query(dc, api.foes.detail, { campaignId, foeId: G.id });
  const dwarfSource = await query(dc, api.foes.detail, { campaignId, foeId: D.id });
  assert.equal(Number(JSON.parse(goblinSource.sourceSnapshot).structured.agility), 2);
  assert.equal(Number(JSON.parse(dwarfSource.sourceSnapshot).structured.agility), 0);
  records.push({
    case: 'setup',
    campaignId,
    content,
    heroes: [H, E, W],
    foes: [G, C, D],
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
